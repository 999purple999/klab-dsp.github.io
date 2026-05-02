import { EventBus } from '../utils/EventBus.js';
import { Device } from '../utils/Device.js';
import { Storage } from '../data/Storage.js';

// Note: PauseScene blocks 'tap' on enter so GameScene below doesn't receive flips

export class PauseScene {
  constructor(game) {
    this._game = game;
    this._tapHandler = null;
  }

  enter() {
    this._tapHandler = (data) => this._onTap(data);
    EventBus.on('tap', this._tapHandler);
    // Save snapshot
    Storage.set('dr_paused', true);
  }

  exit() {
    if (this._tapHandler) {
      EventBus.off('tap', this._tapHandler);
      this._tapHandler = null;
    }
    Storage.remove('dr_paused');
  }

  _onTap(data) {
    // Stop propagation by consuming the event - handled exclusively here
    const W = this._game.W;
    const H = this._game.H;
    const x = data.x;
    const y = data.y;

    // RESUME button
    if (Math.abs(x - W * 0.5) < 100 && Math.abs(y - H * 0.5) < 30) {
      this._game.resumeGame();
      return;
    }

    // QUIT button
    if (Math.abs(x - W * 0.5) < 80 && Math.abs(y - H * 0.62) < 26) {
      this._game.goToMenu();
      return;
    }

    // Tap anywhere = resume
    this._game.resumeGame();
  }

  update(dt) {}

  render(ctx) {
    const dpr = Device.dpr;
    const W = this._game.W;
    const H = this._game.H;

    // Semi-transparent overlay
    ctx.save();
    ctx.fillStyle = 'rgba(5,6,13,0.75)';
    ctx.fillRect(0, 0, W * dpr, H * dpr);

    const fs = Math.max(28, Math.min(W * 0.09, 56)) * dpr;
    ctx.font = `800 ${fs}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 40 * dpr;
    ctx.shadowColor = '#a855f7';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('PAUSED', W * dpr / 2, H * dpr * 0.36);
    ctx.shadowBlur = 0;

    // RESUME button
    const btnW = 200 * dpr;
    const btnH = 52 * dpr;
    const btnX = W * dpr / 2 - btnW / 2;
    const btnY = H * dpr * 0.5 - btnH / 2;
    ctx.shadowBlur = 18 * dpr;
    ctx.shadowColor = '#a855f7';
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.shadowBlur = 0;
    ctx.font = `800 ${Math.max(13, Math.min(W * 0.038, 18)) * dpr}px monospace`;
    ctx.fillStyle = '#fff';
    ctx.fillText('RESUME', W * dpr / 2, H * dpr * 0.5);

    // QUIT button
    const qBtnW = 160 * dpr;
    const qBtnH = 44 * dpr;
    const qBtnX = W * dpr / 2 - qBtnW / 2;
    const qBtnY = H * dpr * 0.62 - qBtnH / 2;
    ctx.strokeStyle = 'rgba(212,223,244,0.4)';
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(qBtnX, qBtnY, qBtnW, qBtnH);
    ctx.font = `700 ${Math.max(11, Math.min(W * 0.030, 16)) * dpr}px monospace`;
    ctx.fillStyle = 'rgba(212,223,244,0.7)';
    ctx.fillText('QUIT TO MENU', W * dpr / 2, H * dpr * 0.62);

    ctx.restore();
  }
}
