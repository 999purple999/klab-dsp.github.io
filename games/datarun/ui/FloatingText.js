const POOL_SIZE = 10;

function makeFloatItem() {
  return { x: 0, y: 0, text: '', color: '#fff', alpha: 0, vy: 0, active: false, t: 0 };
}

export class FloatingText {
  constructor() {
    this._pool = [];
    for (let i = 0; i < POOL_SIZE; i++) this._pool.push(makeFloatItem());
    this._active = [];
  }

  spawn(x, y, text, color = '#00FFFF') {
    let item = this._pool.pop();
    if (!item) {
      // Evict oldest active
      if (this._active.length > 0) {
        item = this._active.shift();
      } else {
        item = makeFloatItem();
      }
    }
    item.x = x;
    item.y = y;
    item.text = text;
    item.color = color;
    item.alpha = 1;
    item.vy = -1.6;
    item.active = true;
    item.t = 0;
    this._active.push(item);
  }

  update(dt) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const item = this._active[i];
      item.y += item.vy;
      item.vy *= 0.97;
      item.t += dt;
      item.alpha = Math.max(0, 1 - item.t * 1.4);
      if (item.alpha <= 0) {
        this._active.splice(i, 1);
        item.active = false;
        this._pool.push(item);
      }
    }
  }

  render(ctx, dpr) {
    ctx.save();
    const fontSize = 18 * dpr;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const item of this._active) {
      ctx.globalAlpha = item.alpha;
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = item.color;
      ctx.shadowBlur = 12 * dpr;
      ctx.shadowColor = item.color;
      ctx.fillText(item.text, item.x * dpr, item.y * dpr);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  clear() {
    for (const item of this._active) {
      item.active = false;
      this._pool.push(item);
    }
    this._active = [];
  }
}
