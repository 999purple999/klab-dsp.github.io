import { EventBus } from '../utils/EventBus.js';
import { Device } from '../utils/Device.js';
import { Effects } from '../rendering/Effects.js';
import { Storage } from '../data/Storage.js';

export class GameOverScene {
  constructor(game, runData) {
    this._game = game;
    this._runData = runData || { score: 0, coins: 0, flips: 0, xpGained: 0 };
    this._t = 0;
    this._tapHandler = null;
    this._newAchievements = [];
    this._canInteract = false;

    // Check achievements
    const stats = {
      totalCoins: game.stats.totalCoins,
      zenPlays: game.stats.zenPlays,
      level: game.progression.getLevel(),
      dailyCompleted: game.stats.dailyCompleted
    };
    this._newAchievements = game.achievements.checkRun(runData, stats);
  }

  enter() {
    this._tapHandler = (data) => this._onTap(data);
    EventBus.on('tap', this._tapHandler);

    Effects.screenFlash('#FF2222', 0.6);
    Effects.chromaticAberration(1.5);

    // Show achievement toasts after a bit
    if (this._newAchievements.length > 0) {
      import('../ui/Modal.js').then(({ Modal }) => {
        const modal = new Modal();
        setTimeout(() => modal.showAchievements(this._newAchievements), 1000);
      });
    }

    setTimeout(() => { this._canInteract = true; }, 600);
  }

  exit() {
    if (this._tapHandler) {
      EventBus.off('tap', this._tapHandler);
      this._tapHandler = null;
    }
  }

  _onTap(data) {
    if (!this._canInteract) return;
    const W = this._game.W;
    const H = this._game.H;
    const x = data.x;
    const y = data.y;

    // RETRY button
    if (Math.abs(x - W * 0.5) < 100 && Math.abs(y - H * 0.68) < 30) {
      this._game.startGame();
      return;
    }
    // MENU button
    if (Math.abs(x - W * 0.5) < 80 && Math.abs(y - H * 0.78) < 26) {
      this._game.goToMenu();
      return;
    }
    // Tap anywhere = retry
    this._game.startGame();
  }

  update(dt) {
    this._t += dt;
    Effects.update(dt);
  }

  render(ctx) {
    const dpr = Device.dpr;
    const W = this._game.W;
    const H = this._game.H;
    const run = this._runData;

    ctx.save();

    // Dark overlay
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, W * dpr, H * dpr);

    // Glow bg
    const g = ctx.createRadialGradient(W * dpr / 2, H * dpr * 0.4, 0, W * dpr / 2, H * dpr * 0.4, Math.max(W, H) * dpr * 0.55);
    g.addColorStop(0, 'rgba(160,0,0,0.28)');
    g.addColorStop(1, 'rgba(5,6,13,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W * dpr, H * dpr);

    const titleFs = Math.max(28, Math.min(W * 0.095, 66)) * dpr;
    ctx.font = `800 ${titleFs}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 50 * dpr;
    ctx.shadowColor = '#FF2222';
    ctx.fillStyle = '#FF2222';
    ctx.fillText('CRASHED', W * dpr / 2, H * dpr * 0.26);
    ctx.shadowBlur = 0;

    const subFs = Math.max(14, Math.min(W * 0.036, 22)) * dpr;

    // Score
    ctx.font = `700 ${subFs}px "JetBrains Mono",monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(`SCORE: ${run.score}`, W * dpr / 2, H * dpr * 0.38);

    // Check best
    const best = Storage.get('dr_best', 0);
    if (run.score > best) {
      Storage.set('dr_best', run.score);
      ctx.font = `700 ${subFs * 0.85}px monospace`;
      ctx.shadowBlur = 20 * dpr;
      ctx.shadowColor = '#FFD700';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('NEW BEST!', W * dpr / 2, H * dpr * 0.45);
      ctx.shadowBlur = 0;
    }

    // Stats row
    const sfFs = Math.max(10, Math.min(W * 0.028, 15)) * dpr;
    ctx.font = `${sfFs}px monospace`;
    ctx.fillStyle = 'rgba(212,223,244,0.6)';
    ctx.fillText(
      `COINS: ${run.coins}   FLIPS: ${run.flips}   +${run.xpGained} XP`,
      W * dpr / 2, H * dpr * 0.52
    );

    // New achievements
    if (this._newAchievements.length > 0) {
      ctx.font = `bold ${sfFs}px monospace`;
      ctx.fillStyle = '#a855f7';
      ctx.fillText(`${this._newAchievements.length} NEW ACHIEVEMENT${this._newAchievements.length > 1 ? 'S' : ''}!`, W * dpr / 2, H * dpr * 0.58);
    }

    // RETRY button
    if (this._canInteract) {
      const btnW = 200 * dpr;
      const btnH = 52 * dpr;
      const btnX = W * dpr / 2 - btnW / 2;
      const btnY = H * dpr * 0.68 - btnH / 2;
      ctx.shadowBlur = 20 * dpr;
      ctx.shadowColor = '#a855f7';
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.shadowBlur = 0;
      ctx.font = `800 ${Math.max(13, Math.min(W * 0.038, 18)) * dpr}px monospace`;
      ctx.fillStyle = '#fff';
      ctx.fillText('RETRY', W * dpr / 2, H * dpr * 0.68);

      // MENU button
      const mBtnW = 160 * dpr;
      const mBtnH = 44 * dpr;
      const mBtnX = W * dpr / 2 - mBtnW / 2;
      const mBtnY = H * dpr * 0.78 - mBtnH / 2;
      ctx.strokeStyle = 'rgba(212,223,244,0.35)';
      ctx.lineWidth = 2 * dpr;
      ctx.strokeRect(mBtnX, mBtnY, mBtnW, mBtnH);
      ctx.font = `700 ${Math.max(11, Math.min(W * 0.030, 16)) * dpr}px monospace`;
      ctx.fillStyle = 'rgba(212,223,244,0.6)';
      ctx.fillText('MENU', W * dpr / 2, H * dpr * 0.78);

      // Blink prompt
      if (Math.sin(this._t * 3.5) > 0) {
        ctx.font = `600 ${sfFs}px monospace`;
        ctx.fillStyle = 'rgba(212,223,244,0.35)';
        ctx.fillText('TAP TO RETRY', W * dpr / 2, H * dpr * 0.88);
      }
    }

    // Chromatic aberration + flash
    Effects.drawFlash(ctx, W * dpr, H * dpr);
    Effects.drawChromaticAberration(ctx, W * dpr, H * dpr);

    ctx.restore();
  }
}
