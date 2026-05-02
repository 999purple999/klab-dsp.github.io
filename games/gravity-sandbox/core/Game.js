import { Engine } from './Engine.js';
import { Input } from './Input.js';
import { Box, NEON_COLORS } from '../entities/Box.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { Renderer } from '../rendering/Renderer.js';
import { ParticleEmitter } from '../rendering/ParticleEmitter.js';
import { AudioManager } from '../audio/AudioManager.js';
import { HUD } from '../ui/HUD.js';
import { ContextMenu } from '../ui/ContextMenu.js';
import { Achievements } from '../data/Achievements.js';
import { EventBus } from '../utils/EventBus.js';
import { vibrate } from '../utils/Device.js';
import { rand, clamp } from '../utils/math.js';

const INITIAL_LABELS = ['Docs', 'Sheets', 'IDE', 'Collab', 'Canvas'];

const STATES = { SANDBOX: 'SANDBOX', CHAOS: 'CHAOS', ZEROG: 'ZEROG' };

export class Game {
  constructor(canvas, hudContainer, controlsContainer) {
    this.canvas = canvas;
    this.state = STATES.SANDBOX;
    this.boxes = [];
    this.totalBoxesSpawned = 0;
    this.zeroGCount = 0;
    this.chaosCount = 0;
    this.lockCount = 0;
    this.zeroGTimer = 0;
    this.chaosTimer = 0;

    this.engine = new Engine(canvas);
    this.physics = new PhysicsWorld();
    this.renderer = new Renderer(canvas);
    this.particles = new ParticleEmitter();
    this.hud = new HUD(hudContainer);
    this.contextMenu = new ContextMenu(document.body);
    this.input = new Input(canvas, () => this.boxes);

    this.physics.onCollision = (a, b, force) => {
      const cx = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
      const cy = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
      const count = Math.floor(rand(8, 12));
      this.particles.emit(cx, cy, a.color, b.color, count, this.engine.dpr);
      AudioManager.playCollision(force, (a.mass + b.mass) / 2);
      this._checkAchievements();
    };

    this._setupControls(controlsContainer);
    this._setupEvents();
  }

  _setupEvents() {
    EventBus.on('input:doubleTap', ({ box, x, y }) => this._activateZeroG(box));
    EventBus.on('input:longPress', ({ x, y }) => this._activateChaos());
    EventBus.on('input:contextMenu', ({ box, x, y }) => this.contextMenu.show(box, x, y));
    EventBus.on('input:slingshotAchievement', () => {
      Achievements.check('slingshot');
    });

    EventBus.on('box:delete', (box) => {
      this.boxes = this.boxes.filter(b => b !== box);
    });
    EventBus.on('box:duplicate', (box) => {
      const nb = new Box({
        x: box.x + 20, y: box.y - 20,
        w: box.w, h: box.h,
        label: box.label,
        colorIndex: box.colorIndex
      });
      nb.vx = rand(-3, 3); nb.vy = rand(-5, 0);
      this.boxes.push(nb);
      this.totalBoxesSpawned++;
      this._checkAchievements();
    });
    EventBus.on('box:lockToggled', (box) => {
      AudioManager.playLockUnlock();
      if (box.locked) {
        this.lockCount++;
        Achievements.check('locker', this.lockCount >= 10 ? true : null);
        if (this.lockCount >= 10) Achievements.check('locker');
      }
    });
  }

  _setupControls(container) {
    container.innerHTML = `
      <div class="ctrl-row">
        <label>Gravity <span id="grav-val">9.8</span></label>
        <input type="range" id="ctrl-grav" min="-30" max="30" step="0.5" value="9.8">
      </div>
      <div class="ctrl-row">
        <label>Bounce <span id="bounce-val">0.70</span></label>
        <input type="range" id="ctrl-bounce" min="0" max="1" step="0.05" value="0.7">
      </div>
      <div class="ctrl-row">
        <label>Wind <span id="wind-val">0.0</span></label>
        <input type="range" id="ctrl-wind" min="-5" max="5" step="0.1" value="0">
      </div>
      <div class="ctrl-row ctrl-buttons">
        <button id="ctrl-add" class="ctrl-btn">+ Add Box</button>
        <button id="ctrl-export" class="ctrl-btn">Export JSON</button>
        <label class="ctrl-btn ctrl-import-label">Import JSON<input type="file" id="ctrl-import" accept=".json" style="display:none"></label>
        <button id="ctrl-audio" class="ctrl-btn">🔊 Sound</button>
      </div>
    `;

    document.getElementById('ctrl-grav').addEventListener('input', e => {
      this.physics.gravity = parseFloat(e.target.value);
      document.getElementById('grav-val').textContent = parseFloat(e.target.value).toFixed(1);
    });
    document.getElementById('ctrl-bounce').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      document.getElementById('bounce-val').textContent = v.toFixed(2);
      for (const b of this.boxes) b.elasticity = v;
      this.physics._defaultElasticity = v;
    });
    document.getElementById('ctrl-wind').addEventListener('input', e => {
      this.physics.wind = parseFloat(e.target.value);
      document.getElementById('wind-val').textContent = parseFloat(e.target.value).toFixed(1);
    });

    document.getElementById('ctrl-add').addEventListener('click', () => {
      const n = ++this.totalBoxesSpawned;
      const dpr = this.engine.dpr;
      const lW = this.engine.W / dpr;
      const lH = this.engine.H / dpr;
      const bw = clamp(lW * 0.18, 90, 150);
      const bh = bw * 0.5;
      const b = new Box({
        x: rand(20, lW - bw - 20),
        y: rand(20, lH * 0.4),
        w: bw, h: bh,
        label: `BOX-${n}`,
        colorIndex: Math.floor(Math.random() * NEON_COLORS.length)
      });
      this.boxes.push(b);
      this._checkAchievements();
    });

    document.getElementById('ctrl-export').addEventListener('click', () => this._exportJSON());

    document.getElementById('ctrl-import').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          this._importJSON(data);
        } catch {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    });

    let audioOn = true;
    document.getElementById('ctrl-audio').addEventListener('click', e => {
      audioOn = !audioOn;
      AudioManager.setEnabled(audioOn);
      e.target.textContent = audioOn ? '🔊 Sound' : '🔇 Sound';
    });
  }

  _exportJSON() {
    const data = {
      boxes: this.boxes.map(b => b.toJSON()),
      physics: { gravity: this.physics.gravity, wind: this.physics.wind }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gravity-sandbox.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  _importJSON(data) {
    if (!Array.isArray(data.boxes)) return;
    this.boxes = data.boxes.map(d => {
      const b = new Box({ x: d.x, y: d.y, w: d.w, h: d.h, label: d.label, colorIndex: d.colorIndex ?? 0 });
      b.vx = d.vx ?? 0; b.vy = d.vy ?? 0;
      b.locked = !!d.locked;
      return b;
    });
    if (data.physics) {
      if (data.physics.gravity !== undefined) {
        this.physics.gravity = data.physics.gravity;
        const gravEl = document.getElementById('ctrl-grav');
        if (gravEl) { gravEl.value = this.physics.gravity; document.getElementById('grav-val').textContent = this.physics.gravity.toFixed(1); }
      }
      if (data.physics.wind !== undefined) {
        this.physics.wind = data.physics.wind;
        const windEl = document.getElementById('ctrl-wind');
        if (windEl) { windEl.value = this.physics.wind; document.getElementById('wind-val').textContent = this.physics.wind.toFixed(1); }
      }
    }
  }

  _activateZeroG(box) {
    this.state = STATES.ZEROG;
    this.zeroGCount++;
    this.zeroGTimer = 240;
    this.physics.mode = 'ZEROG';
    for (const b of this.boxes) {
      if (!b.locked) {
        b.vx += rand(-8, 8);
        b.vy -= rand(4, 12);
      }
    }
    AudioManager.playZeroG();
    vibrate([30, 30, 30]);
    this.renderer.zeroGAlpha = 1;
    this.hud.setMode('ZERO-G');
    if (this.zeroGCount >= 10) Achievements.check('zerog_master');
  }

  _activateChaos() {
    if (this.state === STATES.CHAOS) return;
    this.state = STATES.CHAOS;
    this.chaosCount++;
    this.chaosTimer = 300;
    this.physics.mode = 'CHAOS';
    for (const b of this.boxes) {
      if (!b.locked) {
        b.vx = rand(-28, 28);
        b.vy = -rand(10, 18);
        b.av = rand(-0.45, 0.45);
      }
    }
    AudioManager.playChaos();
    vibrate([100]);
    this.renderer.chaosAlpha = 1;
    this.hud.setMode('CHAOS');
    AudioManager.setChaosLevel(1);
    if (this.chaosCount >= 5) Achievements.check('chaotic');
  }

  _checkAchievements() {
    if (this.physics.totalCollisions >= 100) Achievements.check('destroyer');
    if (this.totalBoxesSpawned >= 50) Achievements.check('creator');
  }

  start() {
    // Init audio on first user interaction
    const initAudio = () => {
      AudioManager.init();
      document.removeEventListener('pointerdown', initAudio);
    };
    document.addEventListener('pointerdown', initAudio);

    this.engine.start(
      (dt, ts) => this._frame(dt, ts),
      (W, H, dpr) => {
        this.renderer.resize(W, H, dpr);
        this.physics.setDimensions(W / dpr, H / dpr);
      }
    );

    // Initialize boxes
    const lW = window.innerWidth;
    const lH = window.innerHeight;
    const cols = Math.min(4, INITIAL_LABELS.length);
    INITIAL_LABELS.forEach((label, i) => {
      const bw = clamp(lW * 0.18, 90, 145);
      const bh = bw * 0.48;
      const b = new Box({
        x: 60 + (i % cols) * (lW * 0.22),
        y: 50 + Math.floor(i / cols) * 165,
        w: bw, h: bh,
        label: label.toUpperCase(),
        colorIndex: i % NEON_COLORS.length
      });
      this.boxes.push(b);
      this.totalBoxesSpawned++;
    });

    this.physics.setDimensions(lW, lH);
  }

  _frame(dt, ts) {
    const { engine, renderer, physics, particles, hud } = this;
    renderer.t = ts * 0.001;

    // Update mode timers
    if (this.state === STATES.ZEROG) {
      this.zeroGTimer--;
      renderer.zeroGAlpha = this.zeroGTimer / 240;
      if (this.zeroGTimer <= 0) {
        this.state = STATES.SANDBOX;
        physics.mode = 'SANDBOX';
        renderer.zeroGAlpha = 0;
        hud.setMode('SANDBOX');
      }
    }
    if (this.state === STATES.CHAOS) {
      this.chaosTimer--;
      renderer.chaosAlpha = this.chaosTimer / 300;
      AudioManager.setChaosLevel(this.chaosTimer / 300);
      if (this.chaosTimer <= 0) {
        this.state = STATES.SANDBOX;
        physics.mode = 'SANDBOX';
        renderer.chaosAlpha = 0;
        hud.setMode('SANDBOX');
        AudioManager.setChaosLevel(0);
      }
    }

    physics.update(dt, this.boxes);
    particles.update();

    // Render
    renderer.drawBackground(this.boxes);
    for (const box of this.boxes) {
      box.draw(engine.ctx, engine.dpr);
    }
    particles.draw(engine.ctx);
    renderer.drawWatermark();

    // Update HUD
    hud.update({
      collisions: physics.totalCollisions,
      zeroGCount: this.zeroGCount,
      boxCount: this.boxes.length
    });
  }
}
