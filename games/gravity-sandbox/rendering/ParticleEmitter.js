import { rand } from '../utils/math.js';

const POOL_SIZE = 150;

export class ParticleEmitter {
  constructor() {
    this.particles = [];
    // Pre-allocate pool
    for (let i = 0; i < POOL_SIZE; i++) {
      this.particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, r: 1, alpha: 0, col: '#fff' });
    }
  }

  _alloc() {
    for (const p of this.particles) if (!p.active) return p;
    // Recycle oldest if pool exhausted
    return this.particles[0];
  }

  emit(lx, ly, colA, colB, count = 10, dpr = 1) {
    const n = Math.min(count, 12);
    for (let i = 0; i < n; i++) {
      const p = this._alloc();
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.5, 6);
      p.active = true;
      p.x = lx * dpr;
      p.y = ly * dpr;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.r = rand(1.5, 4) * dpr;
      p.alpha = 1;
      p.col = Math.random() < 0.5 ? colA : colB;
    }
  }

  update() {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.14;
      p.alpha -= 0.028;
      if (p.alpha <= 0) p.active = false;
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.col;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
