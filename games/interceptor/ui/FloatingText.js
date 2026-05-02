const POOL_SIZE = 15;

function makeEntry() {
  return {
    x: 0, y: 0, text: '', color: '#FFFFFF',
    alpha: 0, vy: -1.8, alive: false, timer: 0,
  };
}

export class FloatingText {
  constructor() {
    this._pool = [];
    this._active = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      this._pool.push(makeEntry());
    }
  }

  spawn(lx, ly, text, color) {
    let entry;
    if (this._pool.length > 0) {
      entry = this._pool.pop();
    } else {
      // Reuse oldest active
      entry = this._active.shift();
    }
    entry.x = lx;
    entry.y = ly;
    entry.text = text;
    entry.color = color || '#FFFFFF';
    entry.alpha = 1;
    entry.vy = -1.8;
    entry.alive = true;
    entry.timer = 0;
    this._active.push(entry);
  }

  update(dt) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const e = this._active[i];
      e.timer += dt;
      e.y += e.vy;
      e.alpha = Math.max(0, 1 - e.timer / 0.8);
      if (e.timer >= 0.8) {
        this._active.splice(i, 1);
        e.alive = false;
        this._pool.push(e);
      }
    }
  }

  draw(ctx, dpr, canvasW) {
    const ffs = Math.max(14, Math.min(canvasW * 0.042, 22)) * dpr;
    for (const e of this._active) {
      if (!e.alive) continue;
      ctx.globalAlpha = e.alpha;
      ctx.font = `800 ${ffs}px "JetBrains Mono","Courier New",monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = e.color;
      ctx.shadowBlur = 14 * dpr;
      ctx.shadowColor = e.color;
      ctx.fillText(e.text, e.x * dpr, e.y * dpr);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }
}
