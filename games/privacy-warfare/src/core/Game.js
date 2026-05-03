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
import { AdaptiveMusic } from '../audio/AdaptiveMusic.js';

export class Game {
  constructor() {
    this.cv    = document.getElementById('c');
    this.ctx   = this.cv.getContext('2d');
    this.mmCv  = document.getElementById('mm');
    this.mctx  = this.mmCv.getContext('2d');

    this.engine  = new Engine();
    this.scenes  = new SceneManager();
    this._music  = null; // AdaptiveMusic — lazy-init after first AudioContext unlock

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
    this._initMobileButtons();
    this._initTutorial();

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
        // Adaptive music: lazy-init after AudioContext is unlocked
        const ac = getAC();
        if (ac && !this._music) { this._music = new AdaptiveMusic(ac); this._music.start(); }
        if (this._music && this._music._started) {
          const nearby = this.gameScene.EYES.filter(e => {
            const dx = e.x - this.gameScene.px, dy = e.y - this.gameScene.py;
            return Math.hypot(dx, dy) < 320;
          }).length;
          this._music.update(
            this.gameScene.EYES.length, nearby,
            !!this.gameScene.boss,
            this.gameScene.hp, this.gameScene.maxHp,
          );
        }
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
      // Q/E cycle between the 2 loadout weapons
      if (k.toLowerCase() === 'q' || k.toLowerCase() === 'e') {
        const slots = this.gameScene.loadoutWpns.filter(i => i >= 0);
        if (slots.length > 1) {
          const cur = slots.indexOf(this.gameScene.wpnIdx);
          this.gameScene.wpnIdx = cur === 0 ? slots[1] : slots[0];
          setWpn(this.gameScene.wpnIdx, WPNS);
          this.gameScene._updateAmmoHUD();
        }
      }
      if (k.toLowerCase() === 'f') this.gameScene.useGadget(0);
      if (k.toLowerCase() === 'g') this.gameScene.useGadget(1);
      if (k.toLowerCase() === 'x') this.gameScene.useDash(); // sprint/dash fallback
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

    // Show game-over modal
    const modal = document.getElementById('game-over-modal');
    if (modal) {
      document.getElementById('go-score-v').textContent = Math.floor(score).toLocaleString();
      document.getElementById('go-wave-v').textContent  = wave;
      document.getElementById('go-best-v').textContent  = Math.floor(hiScore).toLocaleString();
      modal.style.display = 'flex';

      document.getElementById('go-retry').onclick = () => {
        modal.style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
        this.gameScene.startGame();
      };
      document.getElementById('go-menu').onclick = () => {
        modal.style.display = 'none';
        this.scenes.push(this.menuScene);
      };
    } else {
      this.scenes.push(this.menuScene);
    }
  }

  _initTutorial() {
    if (localStorage.getItem('pw_tutorial_done')) return;
    const el = document.getElementById('tutorial-modal');
    if (!el) return;
    el.style.display = 'flex';
    const dismiss = () => {
      el.style.display = 'none';
      localStorage.setItem('pw_tutorial_done', '1');
      document.removeEventListener('keydown', dismiss);
      el.removeEventListener('touchstart', dismiss);
      el.removeEventListener('click', dismiss);
    };
    document.addEventListener('keydown', dismiss);
    el.addEventListener('touchstart', dismiss, { passive: true });
    el.addEventListener('click', dismiss);
  }

  _initMobileButtons() {
    document.getElementById('mob-actions')?.addEventListener('touchstart', e => {
      e.stopPropagation();
      const btn = e.target.closest('[data-gadget]'); if (!btn) return;
      this.gameScene.useGadget(+btn.dataset.gadget);
    }, { passive: true });
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
