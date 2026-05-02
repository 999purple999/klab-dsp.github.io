import { SceneManager } from './SceneManager.js';
import { Input } from './Input.js';
import { EventBus } from '../utils/EventBus.js';
import { Device } from '../utils/Device.js';
import { Renderer } from '../rendering/Renderer.js';
import { Leaderboard } from '../data/Leaderboard.js';
import { Achievements } from '../data/Achievements.js';
import { Progression } from '../data/Progression.js';
import { Storage } from '../data/Storage.js';
import { DailyChallenges } from '../data/DailyChallenges.js';

export const GameState = {
  BOOT: 'BOOT',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  ZEN: 'ZEN'
};

export class Game {
  constructor(audioManager) {
    this.state = GameState.BOOT;
    this.sceneManager = new SceneManager();
    this.audioManager = audioManager;
    this.leaderboard = new Leaderboard();
    this.achievements = new Achievements();
    this.progression = new Progression();
    this.dailyChallenge = new DailyChallenges();
    this.renderer = null;
    this.engine = null;
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.dpr = Device.dpr;

    // Global stats for achievements
    this.stats = {
      totalCoins: Storage.get('dr_total_coins', 0),
      zenPlays: Storage.get('dr_zen_plays', 0),
      level: this.progression.getLevel(),
      dailyCompleted: false
    };

    // Visibility pause
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        EventBus.emit('app:blur', {});
      } else {
        EventBus.emit('app:focus', {});
      }
    });
  }

  init(engine) {
    this.engine = engine;
    this.W = engine.logicalWidth;
    this.H = engine.logicalHeight;
    this.dpr = Device.dpr;
    this.renderer = new Renderer(engine.canvas, engine.ctx);
    this.input = new Input(engine.canvas);

    // Boot immediately to menu
    this._goToMenu();
  }

  onResize(w, h, dpr) {
    this.W = w;
    this.H = h;
    this.dpr = dpr;
    if (this.renderer) this.renderer.onResize(w, h, dpr);
    EventBus.emit('resize', { w, h, dpr });
  }

  _goToMenu() {
    import('../scenes/MenuScene.js').then(({ MenuScene }) => {
      this.state = GameState.MENU;
      this.sceneManager.clear();
      this.sceneManager.push(new MenuScene(this));
    });
  }

  startGame() {
    import('../scenes/GameScene.js').then(({ GameScene }) => {
      this.state = GameState.PLAYING;
      this.sceneManager.clear();
      this.sceneManager.push(new GameScene(this));
    });
  }

  startZen() {
    import('../scenes/ZenScene.js').then(({ ZenScene }) => {
      this.state = GameState.ZEN;
      this.sceneManager.clear();
      this.sceneManager.push(new ZenScene(this));
    });
  }

  pauseGame() {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.PAUSED;
    import('../scenes/PauseScene.js').then(({ PauseScene }) => {
      this.sceneManager.push(new PauseScene(this));
    });
  }

  resumeGame() {
    this.state = GameState.PLAYING;
    this.sceneManager.pop();
  }

  gameOver(runData) {
    this.state = GameState.GAMEOVER;
    import('../scenes/GameOverScene.js').then(({ GameOverScene }) => {
      this.sceneManager.clear();
      this.sceneManager.push(new GameOverScene(this, runData));
    });
  }

  goToMenu() {
    this._goToMenu();
  }

  addCoins(count) {
    this.stats.totalCoins = (this.stats.totalCoins || 0) + count;
    Storage.set('dr_total_coins', this.stats.totalCoins);
    // 50 coins = 1 credit
    const credits = Math.floor(this.stats.totalCoins / 50);
    Storage.set('dr_credits', credits);
  }

  update(dt, t) {
    this.sceneManager.update(dt, t);
  }

  render(ctx) {
    this.sceneManager.render(ctx);
  }
}
