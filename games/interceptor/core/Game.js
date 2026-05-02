import { MenuScene } from '../scenes/MenuScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';
import { Tutorial } from '../ui/Tutorial.js';
import { Input } from './Input.js';
import { AudioManager } from '../audio/AudioManager.js';
import { SFXLibrary } from '../audio/SFXLibrary.js';
import { Achievements } from '../data/Achievements.js';
import { Leaderboard } from '../data/Leaderboard.js';
import { UpgradeTree } from '../data/UpgradeTree.js';
import { bus } from '../utils/EventBus.js';

export const STATES = {
  MENU:     'MENU',
  PLAYING:  'PLAYING',
  PAUSED:   'PAUSED',
  GAMEOVER: 'GAMEOVER',
};

export class Game {
  constructor(engine) {
    this._engine = engine;
    this._state = null;
    this._scene = null;
    this._input = new Input(engine.canvas);
    this._audio = new AudioManager();
    this._sfx = new SFXLibrary(this._audio);
    this._achievements = new Achievements();
    this._leaderboard = new Leaderboard();
    this._upgradeTree = new UpgradeTree();
    this._gameOver = null;
    this._tutorial = null;

    // Achievement toast
    bus.on('achievement_unlocked', (def) => this._showAchievementToast(def));

    // Engine resize
    engine.setResizeCallback(() => {
      // Re-render current scene if needed
    });

    // Start with menu or tutorial
    this._gotoMenu();
  }

  _gotoMenu() {
    if (this._scene && this._scene.destroy) this._scene.destroy();
    if (this._gameOver) { this._gameOver.destroy(); this._gameOver = null; }
    this._state = STATES.MENU;

    const menu = new MenuScene(
      document.body,
      this._leaderboard,
      this._upgradeTree,
      this._achievements
    );

    menu.onPlay((difficulty) => {
      menu.destroy();
      this._scene = null;
      // Check tutorial
      const tutorial = new Tutorial(document.body);
      if (tutorial.shouldShow()) {
        tutorial.show(() => {
          tutorial.destroy();
          this._startGame(difficulty);
        });
      } else {
        tutorial.destroy();
        this._startGame(difficulty);
      }
    });

    // Tutorial re-show from menu
    bus.once('show_tutorial', () => {
      const t = new Tutorial(document.body);
      t.show(() => t.destroy());
    });

    this._scene = menu;
  }

  _startGame(difficulty) {
    this._state = STATES.PLAYING;

    const gameScene = new GameScene(
      this._engine,
      this._audio,
      this._sfx,
      this._achievements,
      this._leaderboard,
      this._upgradeTree,
      difficulty
    );

    gameScene.onEnter((result) => {
      // Game over
      this._state = STATES.GAMEOVER;
      gameScene.onExit();

      const go = new GameOverScene(document.body, this._achievements, this._upgradeTree);
      go.show(
        result,
        () => {
          // Retry
          this._startGame(difficulty);
        },
        () => {
          // Menu
          this._gotoMenu();
        }
      );
      this._gameOver = go;
      this._scene = null;
    });

    this._scene = gameScene;
  }

  update(dt, ts) {
    if (this._state === STATES.PLAYING && this._scene && this._scene.tick) {
      // GameScene.tick handles both update logic + draw
      this._scene.tick(dt);
    } else {
      // Clear main canvas while in menu/gameover states
      // (MenuScene uses its own overlay canvas)
      const ctx = this._engine.ctx;
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, this._engine.W, this._engine.H);
    }
  }

  _showAchievementToast(def) {
    const existing = document.getElementById('achievement-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'achievement-toast';
    toast.style.cssText = `
      position:fixed; bottom:80px; left:50%; transform:translateX(-50%) translateY(20px);
      background:rgba(0,0,0,0.9); border:1px solid #BF00FF;
      border-radius:10px; padding:12px 20px;
      font-family:'JetBrains Mono','Courier New',monospace;
      color:#BF00FF; font-size:13px; font-weight:700;
      letter-spacing:.08em; text-align:center;
      z-index:99; opacity:0;
      transition:all 0.3s; pointer-events:none;
      box-shadow:0 0 20px rgba(191,0,255,0.4);
      white-space:nowrap;
    `;
    toast.innerHTML = `🏆 ACHIEVEMENT UNLOCKED<br><span style="color:#FFFFFF;font-size:11px;font-weight:400;">${def.title} — ${def.desc}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(() => toast.remove(), 320);
    }, 3500);
  }
}
