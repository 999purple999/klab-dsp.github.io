// ui/FloatingText.js — Floating damage/score numbers rendered on canvas

export class FloatingText {
  constructor() {
    this.list = [];
  }

  spawn(x, y, text, col) {
    this.list.push({
      x, y, text,
      col: col || '#fff',
      life: 1.1,
      vy: -55 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 20,
    });
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.life -= dt;
      if (f.life <= 0) this.list.splice(i, 1);
    }
  }

  render(ctx, camera, dpr, quality) {
    const glow = quality !== 'low';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.list) {
      if (!camera.onScreen(f.x, f.y, 50)) continue;
      ctx.globalAlpha = f.life;
      if (glow) { ctx.shadowBlur = 10; ctx.shadowColor = f.col; }
      ctx.fillStyle = f.col;
      const sz = Math.max(10, 12 + Math.round((1 - f.life) * 4));
      ctx.font = `800 ${sz * dpr}px 'JetBrains Mono',monospace`;
      ctx.fillText(f.text, camera.wx(f.x, dpr), camera.wy(f.y, dpr));
      if (glow) ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  clear() { this.list = []; }
}
