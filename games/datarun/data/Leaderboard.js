import { Storage } from './Storage.js';

export class Leaderboard {
  constructor() {
    this._key = 'dr_leaderboard';
    this._entries = Storage.get(this._key, []);
  }

  addRun(run) {
    // run: {score, date, coins, flips, level}
    this._entries.push(run);
    this._entries.sort((a, b) => b.score - a.score);
    this._entries = this._entries.slice(0, 5);
    Storage.set(this._key, this._entries);
  }

  getTop5() {
    return this._entries.slice(0, 5);
  }

  render(ctx, x, y, w, lineH, dpr) {
    const entries = this.getTop5();
    if (entries.length === 0) return;

    ctx.save();
    ctx.font = `bold ${11 * dpr}px monospace`;
    ctx.fillStyle = 'rgba(168,85,247,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('TOP RUNS', x, y);

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const ry = y + (i + 1) * lineH;
      ctx.fillStyle = i === 0 ? '#FFD700' : 'rgba(212,223,244,0.6)';
      ctx.font = `${i === 0 ? 'bold' : ''} ${10 * dpr}px monospace`;
      ctx.fillText(`#${i + 1}  ${e.score}`, x, ry);
      ctx.fillStyle = 'rgba(212,223,244,0.35)';
      ctx.font = `${9 * dpr}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(e.date || '', x + w, ry);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  }
}
