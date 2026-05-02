// ─── Game ─────────────────────────────────────────────────────────────────────
// Top-level bootstrap: canvas setup, resize, input wiring, scene creation.

import { Engine }       from './Engine.js';
import { SceneManager } from './SceneManager.js';
import { initInput, KEYS, mx, my, isMouseDown } from './Input.js';
import * as Input       from './Input.js';
import { getAC }        from '../audio/AudioManager.js';
import { buildMapAssets } from '../mapgen/MapData.js';
import { setCameraState } from '../rendering/Camera.js';
import { setWpn }       from '../ui/HUD.js';
import { WPNS, loadWeaponUnlocks } from '../entities/Weapon/WeaponDefinitions.js';
import { GameScene }    from '../scenes/GameScene.js';
import { MenuScene }    from '../scenes/MenuScene.js';
import { CampaignScene } from '../scenes/CampaignScene.js';
import { BootScene }    from '../scenes/BootScene.js';
import { initMenuModals } from '../ui/MenuModals.js';
import { PauseScene }    from '../scenes/PauseScene.js';
import { submitScore, isAuthenticated } from '../utils/CloudAPI.js';

export class Game {
  constructor() {
    this.cv    = document.getElementById('c');
    this.ctx   = this.cv.getContext('2d');
    this.mmCv  = document.getElementById('mm');
    this.mctx  = this.mmCv.getContext('2d');

    this.engine  = new Engine();
    this.scenes  = new SceneManager();

    this.gameScene     = new GameScene(this.cv, this.ctx, this.mmCv, this.mctx);
    this.campaignScene = new CampaignScene(this.cv, this.ctx, this.gameScene);
    this.bootScene     = new BootScene(this);
    this.menuScene     = new MenuScene(this);
    this.pauseScene    = new PauseScene(
      this.cv, this.ctx,
      () => { this.gameScene.paused = false; },
      () => { this.gameScene.paused = false; this.gameScene.gameOver(); }
    );

    this._resize();
    this._initInput();
    this._initShopEvents();
    loadWeaponUnlocks();
    initMenuModals(this.gameScene);

    window.addEventListener('resize', () => this._resize());
    document.addEventListener('pw:gameover', e => this._onGameOver(e.detail));

    // Push menu — will stay until a mode is selected
    this.scenes.push(this.menuScene);

    // Start the engine; it drives GameScene.update which calls render internally
    this.engine.start((dt) => {
      // Mirror live input state into gameScene every tick
      this.gameScene.KEYS        = Input.KEYS;
      this.gameScene.mx          = Input.mx;
      this.gameScene.my          = Input.my;
      this.gameScene.isMouseDown = Input.isMouseDown();

      if (this.gameScene.running) {
        this.gameScene.update(dt);
        if (this.gameScene.paused) this.pauseScene.update(dt);
      } else {
        // Drive active scene (menu, campaign, etc.)
        this.scenes.update(dt);
      }
    });
  }

  _resize() {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const lW  = window.innerWidth;
    const lH  = window.innerHeight;
    const W   = this.cv.width  = lW * DPR;
    const H   = this.cv.height = lH * DPR;
    this.cv.style.width  = lW + 'px';
    this.cv.style.height = lH + 'px';

    // Update gameScene dimensions
    this.gameScene.lW  = lW;
    this.gameScene.lH  = lH;
    this.gameScene.DPR = DPR;
    this.gameScene.WW  = lW * 3.5;
    this.gameScene.WH  = lH * 3.5;
    this.gameScene.W   = W;
    this.gameScene.H   = H;

    setCameraState({
      lW, lH, DPR,
      WW: lW * 3.5, WH: lH * 3.5,
      camX: this.gameScene.camX,
      camY: this.gameScene.camY,
    });

    buildMapAssets(lW * 3.5, lH * 3.5);

    // If game is running just update dimensions; don't rebuild assets mid-game
    if (this.gameScene.running) {
      // camX/camY stay valid; just clip them
      this.gameScene.camX = Math.max(0, Math.min(this.gameScene.WW - lW, this.gameScene.camX));
      this.gameScene.camY = Math.max(0, Math.min(this.gameScene.WH - lH, this.gameScene.camY));
    }
  }

  _initInput() {
    initInput(this.cv, (e) => {
      getAC(); // unlock AudioContext on first interaction
      if (this.gameScene.running && !this.gameScene.skillModal && !this.gameScene.shopModal) {
        this.gameScene.tryFire();
      }
    });

    // Keyboard shortcuts that drive the game scene
    document.addEventListener('keydown', e => {
      if (!this.gameScene.running) return;
      const k = e.key;
      // P / Escape toggles pause (PauseScene handles its own keys when active)
      if ((k.toLowerCase() === 'p' || k === 'Escape') && !this.gameScene.skillModal && !this.gameScene.shopModal) {
        if (!this.gameScene.paused) {
          this.gameScene.paused = true;
          this.pauseScene.enter();
        }
        e.preventDefault();
        return;
      }
      if (this.gameScene.paused) return;
      if (k >= '1' && k <= '9') { this.gameScene.wpnIdx = +k - 1; setWpn(this.gameScene.wpnIdx, WPNS); e.preventDefault(); }
      if (k === '0')              { this.gameScene.wpnIdx = 9;      setWpn(9, WPNS); e.preventDefault(); }
      // Q/E cycle through all unlocked weapons (supports 20+)
      if (k.toLowerCase() === 'q') { this.gameScene.wpnIdx = (this.gameScene.wpnIdx + WPNS.length - 1) % WPNS.length; setWpn(this.gameScene.wpnIdx, WPNS); }
      if (k.toLowerCase() === 'e') { this.gameScene.wpnIdx = (this.gameScene.wpnIdx + 1) % WPNS.length; setWpn(this.gameScene.wpnIdx, WPNS); }
      if (k.toLowerCase() === 'f') this.gameScene.useBomb();
      if (k.toLowerCase() === 'g') this.gameScene.useKP();
      if (k.toLowerCase() === 'x') this.gameScene.useDash();
      if (k.toLowerCase() === 'v') this.gameScene.useOverclock();
      if (k.toLowerCase() === 'c') this.gameScene.useEmpShield();
      if (k.toLowerCase() === 'z') this.gameScene.useTimeWarp();
      if (k === 'Tab') {
        e.preventDefault();
        if (this.gameScene.betweenWaves && !this.gameScene.skillModal) this.gameScene._openShop();
      }
    });
  }

  _onGameOver({ score, wave, hiScore }) {
    this.pauseScene.exit();
    if (isAuthenticated()) {
      const username = localStorage.getItem('pw_username') || 'Anonymous';
      submitScore(Math.floor(score), wave, username);
    }
    document.getElementById('ov-title').textContent = 'SYSTEM BREACH';
    document.getElementById('ov-sub').textContent   = 'Your data has been compromised';
    const os = document.getElementById('ov-score'), oh = document.getElementById('ov-hi');
    os.style.display = 'block'; os.textContent = 'SCORE: ' + Math.floor(score);
    oh.style.display = 'block'; oh.textContent = 'WAVE ' + wave + '  ·  BEST: ' + Math.floor(hiScore);
    this.scenes.push(this.menuScene);
  }

  _initShopEvents() {
    document.getElementById('shop-items').addEventListener('click', e => {
      const btn = e.target.closest('[data-item]'); if (!btn) return;
      this.gameScene._buyShopItem(btn.dataset.item);
    });

    document.getElementById('close-shop-btn').addEventListener('click', () => {
      document.getElementById('shop-modal').style.display = 'none';
      this.gameScene.shopModal = false;
    });
  }
}
