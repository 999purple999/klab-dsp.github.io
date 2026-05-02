// entities/Obstacle.js — World obstacles generation and rendering

export class ObstacleManager {
  constructor() {
    this.list = [];
  }

  build(waveNum, ww, wh) {
    this.list = [];
    const n = 8 + Math.min(12, Math.floor(waveNum * 1.5));
    for (let i = 0; i < n; i++) {
      const w = 70 + Math.random() * 130;
      const h = 25 + Math.random() * 55;
      this.list.push({
        x: 150 + Math.random() * (ww - 300 - w),
        y: 150 + Math.random() * (wh - 300 - h),
        w, h
      });
    }
  }

  render(ctx, camera, dpr, mapStyle, quality) {
    const glow = quality !== 'low';
    for (const o of this.list) {
      if (!camera.onScreen(o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h))) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(camera.wx(o.x, dpr), camera.wy(o.y, dpr), o.w * dpr, o.h * dpr);
      ctx.strokeStyle = mapStyle.ac;
      ctx.lineWidth = 1;
      ctx.strokeRect(camera.wx(o.x, dpr), camera.wy(o.y, dpr), o.w * dpr, o.h * dpr);
      // Corner dots
      ctx.fillStyle = mapStyle.sc;
      for (const [cx, cy] of [[o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h]]) {
        ctx.beginPath();
        ctx.arc(camera.wx(cx, dpr), camera.wy(cy, dpr), 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
