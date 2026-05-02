// core/Game.js — Top-level wiring of all systems

import { Engine } from './Engine.js';
import { SceneManager } from './SceneManager.js';
import { Input } from './Input.js';
import { Renderer } from '../rendering/Renderer.js';
import { AudioManager } from '../audio/AudioManager.js';
import { SFXLibrary } from '../audio/SFXLibrary.js';
import { GameScene } from '../scenes/GameScene.js';
import { leaderboard } from '../data/Leaderboard.js';
import { progression } from '../data/Progression.js';
import { bus } from '../utils/EventBus.js';
import { openSkillTreeModal } from '../ui/Modal.js';

export class Game {
  constructor() {
    this.engine = new Engine();
    this.renderer = new Renderer('c');
    this.input = new Input();
    this.audio = new AudioManager();
    this.sfx = new SFXLibrary(this.audio);
    this.scenes = new SceneManager();

    this._gameScene = new GameScene(this.renderer, this.input, this.audio, this.sfx);
    this.scenes.register('game', this._gameScene);

    this._isSurvival = false;

    this._bindMenu();
    this._bindGameOver();
    this._bindResize();
    this._bindAudioInit();
    this._bindSkillTreeMenu();
    this._bindPauseResume();
    this._bindAchievements();

    this.engine.onFrame((dt, ts) => {
      this.scenes.update(dt);
      this.scenes.render(dt);
    });

    this.engine.onResize(() => {
      this.renderer.resize();
    });

    this.renderer.resize();
    this.engine.start();
  }

  _bindMenu() {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this._startGame(false));
    }
    const survivalBtn = document.getElementById('survival-btn');
    if (survivalBtn) {
      survivalBtn.addEventListener('click', () => this._startGame(true));
    }
  }

  _startGame(survival) {
    this._isSurvival = survival;
    this.audio.getAC(); // ensure context created on gesture
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('pause-overlay') && document.getElementById('pause-overlay').classList.add('hidden');
    this.scenes.go('game', { survival });
    document.getElementById('sp-hud') && (document.getElementById('sp-hud').style.display = 'block');
  }

  _bindGameOver() {
    bus.on('gameOver', ({ score, wave, survival }) => {
      const hi = leaderboard.getHi(survival);
      const overlay = document.getElementById('overlay');
      if (!overlay) return;
      overlay.classList.remove('hidden');

      document.getElementById('ov-title').textContent = 'SYSTEM BREACH';
      document.getElementById('ov-sub').textContent = 'Your data has been compromised';

      const scoreEl = document.getElementById('ov-score');
      const hiEl = document.getElementById('ov-hi');
      const badge = document.getElementById('survival-badge');

      if (scoreEl) { scoreEl.style.display = 'block'; scoreEl.textContent = 'SCORE: ' + Math.floor(score); }
      if (hiEl) { hiEl.style.display = 'block'; hiEl.textContent = 'BEST: ' + Math.floor(hi); }
      if (badge) { badge.style.display = survival ? 'block' : 'none'; }

      const startBtn = document.getElementById('start-btn');
      if (startBtn) startBtn.textContent = '↺ RETRY';

      const survivalBtn = document.getElementById('survival-btn');
      if (survivalBtn) {
        survivalBtn.textContent = survival ? '↺ RETRY SURVIVAL' : '◉ SURVIVAL';
      }
      document.getElementById('sp-hud') && (document.getElementById('sp-hud').textContent = 'SP: ' + progression.sp);
    });
  }

  _bindResize() {
    // handled by engine
  }

  _bindAudioInit() {
    // Audio context needs a user gesture — we init it on first start-btn click (done in _startGame via getAC)
  }

  _bindSkillTreeMenu() {
    const btn = document.getElementById('skill-tree-menu-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      openSkillTreeModal(() => {});
    });
  }

  _bindPauseResume() {
    // Expose resume function for inline HTML button
    window._gamePauseResume = () => {
      if (this._gameScene) this._gameScene._resume();
    };
  }

  _bindAchievements() {
    let _achTimer = null;
    bus.on('achievement', (def) => {
      const toast = document.getElementById('achievement-toast');
      const nameEl = document.getElementById('ach-name');
      const descEl = document.getElementById('ach-desc');
      if (!toast || !nameEl) return;
      nameEl.textContent = def.name;
      if (descEl) descEl.textContent = def.desc;
      toast.style.display = 'block';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
      if (_achTimer) clearTimeout(_achTimer);
      _achTimer = setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 260);
      }, 3000);
    });
  }
}
