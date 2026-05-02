import { Engine } from './Engine.js';
import { Input } from './Input.js';
import { Renderer } from '../rendering/Renderer.js';
import { ParticleEmitter } from '../rendering/ParticleEmitter.js';
import { AudioManager } from '../audio/AudioManager.js';
import { HUD } from '../ui/HUD.js';
import { MethodSelector } from '../ui/MethodSelector.js';
import { Achievements } from '../data/Achievements.js';
import { Storage } from '../data/Storage.js';
import { vibrate } from '../utils/Device.js';

const STATES = { MENU: 'MENU', METHOD_SELECT: 'METHOD_SELECT', PLAYING: 'PLAYING', COMPLETE: 'COMPLETE' };

export class Game {
  constructor(canvas, uiContainer) {
    this.canvas = canvas;
    this.uiContainer = uiContainer;
    this.state = STATES.MENU;
    this.method = 'SHRED';
    this.progress = 0;
    this.startTime = 0;
    this.elapsedMs = 0;
    this.burnActive = false;
    this._lastShredSound = 0;
    this._lastDissolveSound = 0;
    this._vibrateInterval = null;

    // Stats
    this.totalDocsDestroyed = Storage.get('totalDocs', 0);
    this.methodsUsed = Storage.get('methodsUsed', []);
    this.burnCount = Storage.get('burnCount', 0);
    this.docsUnder30 = Storage.get('docsUnder30', 0);

    this.engine = new Engine(canvas);
    this.renderer = new Renderer(canvas);
    this.particles = new ParticleEmitter();
    this.input = new Input(canvas);
    this.hud = new HUD(uiContainer.querySelector('#hud'));
    this.methodSelector = null;

    Achievements.onUnlock(def => this.hud.showToast(def));

    this._setupInput();
    this._buildMenu();
  }

  _setupInput() {
    this.input.onDown = (x, y) => {
      if (this.state !== STATES.PLAYING) return;
      if (this.method === 'IMPLODE') {
        this.renderer.triggerImplode();
        AudioManager.playImplode();
        return;
      }
      if (this.method === 'BURN') {
        this.burnActive = true;
        AudioManager.startBurn();
        this._startVibrate();
      }
    };

    this.input.onDrag = (x, y, prevX, prevY, pid) => {
      if (this.state !== STATES.PLAYING) return;
      const dpr = this.engine.dpr;

      if (this.method === 'SHRED') {
        this.renderer.sliceLine(x, y, prevX, prevY);
        vibrate([50]);
        const now = Date.now();
        if (now - this._lastShredSound > 100) {
          AudioManager.playShred();
          this._lastShredSound = now;
        }
        // Check 3+ finger multitouch
        if (this.input.pointers.size >= 3) {
          Achievements.check('multitouch');
        }
        // Check multitouch achievement
        if (this.input.maxSimultaneous >= 3) {
          Achievements.check('multitouch');
        }
      } else if (this.method === 'BURN') {
        // Convert screen coords to doc coords
        const docPt = this._screenToDoc(x, y);
        if (docPt) {
          this.renderer.applyBurn(docPt.x, docPt.y, 20);
          this.particles.emitAsh(x, y, dpr, 3);
        }
      } else if (this.method === 'DISSOLVE') {
        const docPt = this._screenToDoc(x, y);
        if (docPt) {
          this.renderer.applyDissolve(docPt.x, docPt.y, 18);
          this.particles.emitAcid(x, y, dpr, 4);
          const now = Date.now();
          if (now - this._lastDissolveSound > 200) {
            AudioManager.playDissolve();
            this._lastDissolveSound = now;
          }
        }
      }
    };

    this.input.onUp = () => {
      if (this.method === 'BURN' && this.burnActive) {
        this.burnActive = false;
        AudioManager.stopBurn();
        this._stopVibrate();
      }
    };
  }

  _screenToDoc(sx, sy) {
    const dpr = this.engine.dpr;
    const { dx, dy, dw, dh } = this.renderer._docRect();
    const rx = (sx - dx) / dw;
    const ry = (sy - dy) / dh;
    if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return null;
    return { x: rx * 300, y: ry * 400 };
  }

  _startVibrate() {
    this._stopVibrate();
    this._vibrateInterval = setInterval(() => vibrate([50]), 200);
  }

  _stopVibrate() {
    if (this._vibrateInterval) { clearInterval(this._vibrateInterval); this._vibrateInterval = null; }
  }

  _buildMenu() {
    const menu = this.uiContainer.querySelector('#menu');
    if (!menu) return;
    menu.innerHTML = `
      <div class="menu-title">DOC SHREDDER</div>
      <div class="menu-sub">Your sensitive data is exposed — destroy it</div>
      <div class="menu-docs-count">Documents Destroyed: <span id="docs-count">${this.totalDocsDestroyed}</span></div>
      <button class="menu-btn" id="menu-play">PLAY</button>
      <button class="menu-btn menu-btn-sec" id="menu-achievements">Achievements</button>
      <div class="menu-achievements hidden" id="achievements-panel"></div>
    `;

    document.getElementById('menu-play').addEventListener('click', () => this._goMethodSelect());
    document.getElementById('menu-achievements').addEventListener('click', () => this._toggleAchievements());
  }

  _toggleAchievements() {
    const panel = document.getElementById('achievements-panel');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
      const all = Achievements.getAll();
      panel.innerHTML = all.map(a => `
        <div class="ach-item ${a.unlocked ? 'unlocked' : 'locked'}">
          <span class="ach-icon">${a.unlocked ? '★' : '☆'}</span>
          <span class="ach-label">${a.label}</span>
          <span class="ach-desc">${a.desc}</span>
        </div>
      `).join('');
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  }

  _goMethodSelect() {
    this.state = STATES.METHOD_SELECT;
    const menu = this.uiContainer.querySelector('#menu');
    const methodSel = this.uiContainer.querySelector('#method-select');
    if (menu) menu.classList.add('hidden');
    if (methodSel) {
      methodSel.classList.remove('hidden');
      if (this.methodSelector) this.methodSelector.destroy();
      this.methodSelector = new MethodSelector(methodSel, (m) => { this.method = m; });
    }
    // Play button
    const existing = document.getElementById('method-play-btn');
    if (!existing) {
      const btn = document.createElement('button');
      btn.id = 'method-play-btn';
      btn.className = 'menu-btn method-play-btn';
      btn.textContent = 'START SHREDDING';
      methodSel.appendChild(btn);
      btn.addEventListener('click', () => this._startGame());
    }
  }

  _startGame() {
    this.state = STATES.PLAYING;
    this.progress = 0;
    this.startTime = Date.now();
    this.input.reset();
    this.renderer.setMethod(this.method);
    this.particles.particles = [];

    const methodSel = this.uiContainer.querySelector('#method-select');
    const gameUI = this.uiContainer.querySelector('#game-ui');
    if (methodSel) methodSel.classList.add('hidden');
    if (gameUI) gameUI.classList.remove('hidden');
    this.hud.setMethod(this.method);
    this.hud.updateProgress(0);
    this.hud.hideComplete();

    // Track method usage
    if (!this.methodsUsed.includes(this.method)) {
      this.methodsUsed.push(this.method);
      Storage.set('methodsUsed', this.methodsUsed);
      if (this.methodsUsed.length >= 4) Achievements.check('all_methods');
    }
  }

  _completeGame() {
    if (this.state === STATES.COMPLETE) return;
    this.state = STATES.COMPLETE;
    this.elapsedMs = Date.now() - this.startTime;
    this._stopVibrate();
    AudioManager.stopBurn();
    AudioManager.stopBackground();
    AudioManager.playComplete();

    this.totalDocsDestroyed++;
    Storage.set('totalDocs', this.totalDocsDestroyed);

    Achievements.check('first_shred');

    if (this.method === 'BURN') {
      this.burnCount++;
      Storage.set('burnCount', this.burnCount);
      if (this.burnCount >= 5) Achievements.check('pyromaniac');
    }

    if (this.elapsedMs < 30000) {
      this.docsUnder30++;
      Storage.set('docsUnder30', this.docsUnder30);
      if (this.docsUnder30 >= 10) Achievements.check('no_trace');
    }

    this.hud.updateProgress(1);
    this.hud.showComplete(this.elapsedMs, () => {
      // Return to menu
      const gameUI = this.uiContainer.querySelector('#game-ui');
      const menu = this.uiContainer.querySelector('#menu');
      if (gameUI) gameUI.classList.add('hidden');
      if (menu) {
        menu.classList.remove('hidden');
        // Refresh docs count
        const dc = document.getElementById('docs-count');
        if (dc) dc.textContent = this.totalDocsDestroyed;
      }
      this.state = STATES.MENU;
    });

    // Update menu docs count if visible
    const dc = document.getElementById('docs-count');
    if (dc) dc.textContent = this.totalDocsDestroyed;
  }

  start() {
    const initAudio = () => {
      AudioManager.init();
      document.removeEventListener('pointerdown', initAudio);
    };
    document.addEventListener('pointerdown', initAudio);

    this.engine.start(
      (dt, ts) => this._frame(dt, ts),
      (W, H, dpr) => {
        this.renderer.resize(W, H, dpr);
      }
    );
  }

  _frame(dt, ts) {
    const ctx = this.engine.ctx;

    // Shake transform
    ctx.save();
    this.renderer._applyShake(ctx);

    // Background
    this.renderer.drawBackground(ctx);

    if (this.state === STATES.PLAYING || this.state === STATES.COMPLETE) {
      this._updateProgress();
      this.particles.update();

      if (this.method === 'SHRED') {
        this.renderer.updateStrips();
        this.renderer.drawShred(ctx);
      } else if (this.method === 'BURN') {
        this.renderer.drawBurn(ctx);
      } else if (this.method === 'DISSOLVE') {
        this.renderer.drawDissolve(ctx);
      } else if (this.method === 'IMPLODE') {
        this.renderer.updateImplode();
        this.renderer.drawImplode(ctx);
        // Camera shake on explosion
        if (this.renderer.implodeExploded && !this.renderer._shakeTriggered) {
          this.renderer._shakeTriggered = true;
          this.renderer.triggerShake();
        }
      }

      this.particles.draw(ctx);

      // K-Perception reveal as progress increases
      if (this.progress > 0.3) {
        const revealAlpha = Math.min(1, (this.progress - 0.3) / 0.7);
        this.renderer.drawKPerception(ctx, revealAlpha);
      }

      if (this.state === STATES.PLAYING) {
        this.elapsedMs = Date.now() - this.startTime;
        this.hud.updateTimer(this.elapsedMs);
      }
    } else {
      // MENU / METHOD_SELECT: draw doc in background faintly
      if (this.renderer.offDoc) {
        const { dx, dy, dw, dh } = this.renderer._docRect();
        const dpr = this.engine.dpr;
        ctx.globalAlpha = 0.3;
        ctx.drawImage(this.renderer.offDoc, dx * dpr, dy * dpr, dw * dpr, dh * dpr);
        ctx.globalAlpha = 1;
      }
    }

    this.renderer.drawWatermark(ctx);
    ctx.restore();
  }

  _updateProgress() {
    let newProgress = 0;
    if (this.method === 'SHRED') newProgress = this.renderer.getShredProgress();
    else if (this.method === 'BURN') newProgress = this.renderer.getBurnProgress();
    else if (this.method === 'DISSOLVE') newProgress = this.renderer.getDissolveProgress();
    else if (this.method === 'IMPLODE') newProgress = this.renderer.getImplodeProgress();

    this.progress = newProgress;
    this.hud.updateProgress(this.progress);

    if (this.progress >= 1 && this.state === STATES.PLAYING) {
      this._completeGame();
    }
  }
}
