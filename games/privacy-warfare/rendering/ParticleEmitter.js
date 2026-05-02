// rendering/ParticleEmitter.js — Manages the live particle pool

import { ObjectPool } from '../utils/ObjectPool.js';

function makeParticle() {
  return { x: 0, y: 0, vx: 0, vy: 0, col: '#fff', r: 2, life: 1, maxLife: 1 };
}

function resetParticle(p, x, y, vx, vy, col, r, life) {
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.col = col; p.r = r; p.life = life; p.maxLife = life;
}

export class ParticleEmitter {
  constructor() {
    this._pool = new ObjectPool(makeParticle, resetParticle, 200);
    this._active = [];
  }

  burst(wx, wy, col, n, speed, qualityMult = 1) {
    const count = Math.max(1, Math.round(n * qualityMult));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed;
      const p = this._pool.acquire(wx, wy, Math.cos(a) * s, Math.sin(a) * s, col,
        1 + Math.random() * 3.5, 0.5 + Math.random() * 0.45);
      this._active.push(p);
    }
  }

  update(dt) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const p = this._active[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 58 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this._pool.release(p);
        this._active.splice(i, 1);
      }
    }
  }

  render(ctx, camera, dpr) {
    for (const p of this._active) {
      if (!camera.onScreen(p.x, p.y, 12)) continue;
      ctx.globalAlpha = p.life * 0.9;
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(camera.wx(p.x, dpr), camera.wy(p.y, dpr), p.r * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this._pool.releaseAll(this._active);
  }
}
