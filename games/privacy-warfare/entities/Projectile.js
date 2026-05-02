// entities/Projectile.js — Enemy and weapon projectiles

import { ObjectPool } from '../utils/ObjectPool.js';

function makeProj() {
  return { x: 0, y: 0, vx: 0, vy: 0, r: 5, col: '#fff', life: 3, active: true };
}

function resetProj(p, x, y, vx, vy, r, col, life) {
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.r = r; p.col = col; p.life = life; p.active = true;
}

export const projPool = new ObjectPool(makeProj, resetProj, 60);

/** Managed list of active enemy projectiles */
export class ProjectileManager {
  constructor() {
    this.list = [];
  }

  spawn(x, y, vx, vy, r, col, life) {
    const p = projPool.acquire(x, y, vx, vy, r, col, life);
    this.list.push(p);
  }

  update(dt, ww, wh) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (!p.active || p.life <= 0 || p.x < 0 || p.x > ww || p.y < 0 || p.y > wh) {
        projPool.release(p);
        this.list.splice(i, 1);
      }
    }
  }

  clear() {
    projPool.releaseAll(this.list);
  }

  render(ctx, camera, dpr, quality) {
    const glow = quality !== 'low';
    for (const p of this.list) {
      if (!camera.onScreen(p.x, p.y, 22)) continue;
      ctx.fillStyle = p.col;
      if (glow) { ctx.shadowBlur = 12; ctx.shadowColor = p.col; }
      ctx.beginPath();
      ctx.arc(camera.wx(p.x, dpr), camera.wy(p.y, dpr), p.r * dpr, 0, Math.PI * 2);
      ctx.fill();
      if (glow) ctx.shadowBlur = 0;
    }
  }
}
