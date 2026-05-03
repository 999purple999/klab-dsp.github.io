// ─── FirewallColossus ─────────────────────────────────────────────────────────
// Boss 6. Theme: massive firewall that sweeps horizontal laser walls.
// Phase 1: fires slow horizontal projectile rows across the arena.
// Phase 2 (enraged): rows double-speed + radial burst every third attack.

import { BossBase } from './BossBase.js';

export class FirewallColossus extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#FF4400';
    this.sz  = 38;
    this.hp  = 220 + wave * 32;
    this.maxHp = this.hp;
    this.attackCooldown = 2.5;
    this.attackTimer    = 1.5;
    this._attackCount   = 0;
    this._wallSpd       = 140;
  }

  _move(dt, player) {
    // Drift slowly left/right above player
    const targetX = player.px + Math.sin(this.angle * 0.4) * 180;
    const targetY = player.py - 220;
    const dx = targetX - this.x, dy = targetY - this.y;
    const d  = Math.hypot(dx, dy) || 1;
    const spd = 70;
    this.vx += (dx / d * spd - this.vx) * Math.min(1, 2.5 * dt);
    this.vy += (dy / d * spd - this.vy) * Math.min(1, 2.5 * dt);
    this.x += this.vx * dt; this.y += this.vy * dt;
  }

  _attack(dt, player, projectiles) {
    this.attackTimer -= dt;
    if (this.attackTimer > 0) return;
    this.attackTimer = this.enraged ? 1.4 : this.attackCooldown;
    this._attackCount++;

    const spd = this._wallSpd * (this.enraged ? 1.8 : 1);
    // Sweep 3 staggered horizontal rows, alternating direction each attack
    const dir = (this._attackCount % 2 === 0) ? 1 : -1;
    for (let row = -1; row <= 1; row++) {
      // Each row has 7 projectiles spaced horizontally
      for (let col = -3; col <= 3; col++) {
        projectiles.push({
          x: this.x + col * 55,
          y: this.y + row * 42,
          vx: dir * spd,
          vy: 0,
          r: 7, col: '#FF4400', life: 5,
        });
      }
    }
    // Every 3rd attack: radial burst
    if (this._attackCount % 3 === 0) {
      this._fireRadial(12, projectiles, 160, 6, '#FF8800', this.angle);
    }
  }

  render(ctx, camX, camY, DPR) {
    super.render(ctx, camX, camY, DPR);
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;
    const sz = this.sz * DPR;
    // Draw firewall bars
    ctx.save();
    ctx.strokeStyle = this.col + '55'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sx - sz * 2, sy + i * 10 * DPR);
      ctx.lineTo(sx + sz * 2, sy + i * 10 * DPR);
      ctx.stroke();
    }
    ctx.restore();
  }
}
