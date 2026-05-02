// ─── Architect ────────────────────────────────────────────────────────────────
// Boss 1. Theme: builds walls that block bullets and damage player.
// Phase 1: spawns rectangular obstacle projectiles every 3s.
// Phase 2 (enraged): walls become electrified, attack every 1.8s.

import { BossBase } from './BossBase.js';

export class Architect extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#4444FF';
    this.sz  = 30;
    this.hp  = 180 + wave * 28;
    this.maxHp = this.hp;

    this.attackCooldown = 3;
    this.walls = [];        // active wall objects

    this._orbitAngle = 0;
    this._orbitRadius = 200;
    this._orbitSpd    = 0.5 + wave * 0.03;
  }

  _move(dt, player) {
    // Slow circle around player at radius 200
    this._orbitAngle += this._orbitSpd * dt;
    const targetX = player.px + Math.cos(this._orbitAngle) * this._orbitRadius;
    const targetY = player.py + Math.sin(this._orbitAngle) * this._orbitRadius;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const d  = Math.hypot(dx, dy) || 1;
    const spd = 90;
    this.vx += (dx / d * spd - this.vx) * Math.min(1, 3.5 * dt);
    this.vy += (dy / d * spd - this.vy) * Math.min(1, 3.5 * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  _attack(dt, player, projectiles) {
    const cd = this.enraged ? 1.8 : this.attackCooldown;
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = cd;
      this._spawnWalls(player, projectiles);
    }

    // Update walls
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const w = this.walls[i];
      w.life -= dt;
      // Move wall
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      // Electrified damage to player
      if (this.enraged && w.electrified) {
        const px = player.px, py = player.py;
        if (px >= w.x && px <= w.x + w.w && py >= w.y && py <= w.y + w.h) {
          player._hurtPlayer ? player._hurtPlayer() : null;
        }
      }
      if (w.life <= 0) this.walls.splice(i, 1);
    }
  }

  _spawnWalls(player, projectiles) {
    // 4 rectangular walls fanning out from boss toward player's position
    const dirs = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (const baseAngle of dirs) {
      const ang = baseAngle + this._orbitAngle * 0.3;
      const ww  = 48;
      const wh  = 16;
      const spd = 60;
      this.walls.push({
        x: this.x - ww / 2,
        y: this.y - wh / 2,
        w: ww,
        h: wh,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 4.5,
        electrified: this.enraged,
      });
    }
  }

  // Walls block projectiles — caller checks wall array
  getWalls() {
    return this.walls;
  }

  render(ctx, camX, camY, DPR) {
    // Draw walls first (behind boss)
    for (const w of this.walls) {
      const alpha = Math.min(1, w.life / 0.8);
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;

      if (w.electrified) {
        // Electric blue glow
        ctx.fillStyle   = 'rgba(40,80,255,0.3)';
        ctx.strokeStyle = '#00CCFF';
        ctx.shadowBlur  = 18;
        ctx.shadowColor = '#00CCFF';
      } else {
        ctx.fillStyle   = 'rgba(20,20,100,0.6)';
        ctx.strokeStyle = '#4444FF';
        ctx.shadowBlur  = 8;
        ctx.shadowColor = '#4444FF';
      }

      ctx.lineWidth = 2;
      const wx = (w.x - camX) * DPR;
      const wy = (w.y - camY) * DPR;
      ctx.fillRect(wx, wy, w.w * DPR, w.h * DPR);
      ctx.strokeRect(wx, wy, w.w * DPR, w.h * DPR);

      // Electric arc animation for electrified walls
      if (w.electrified) {
        ctx.strokeStyle = 'rgba(0,220,255,0.7)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        const steps = 6;
        for (let s = 0; s <= steps; s++) {
          const t  = s / steps;
          const ex = wx + t * w.w * DPR + (Math.random() - 0.5) * 6 * DPR;
          const ey = wy + w.h * DPR / 2 + (Math.random() - 0.5) * 6 * DPR;
          s === 0 ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey);
        }
        ctx.stroke();
      }

      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Boss body
    super.render(ctx, camX, camY, DPR);

    // Draw blueprint grid pattern on boss
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;
    const sz = this.sz * DPR;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#8888FF';
    ctx.lineWidth   = 0.8;
    const gridSz    = 8 * DPR;
    ctx.beginPath();
    for (let gx = -sz; gx <= sz; gx += gridSz) {
      ctx.moveTo(sx + gx, sy - sz);
      ctx.lineTo(sx + gx, sy + sz);
    }
    for (let gy = -sz; gy <= sz; gy += gridSz) {
      ctx.moveTo(sx - sz, sy + gy);
      ctx.lineTo(sx + sz, sy + gy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
