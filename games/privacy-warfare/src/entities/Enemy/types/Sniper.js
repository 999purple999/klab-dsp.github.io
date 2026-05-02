import { BaseEnemy } from '../BaseEnemy.js';

export class Sniper extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'sniper', col: '#4488FF', sz: 11, hp: 1, spd: 40, pts: 40 }, wave);
    this.shootTimer = 3 + Math.random();
    this.chargeTimer = 0;
    this.charging = false;
    this.aimX = 0; this.aimY = 0;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super._updateStatus(dt);
    if (this.frozen > 0) return;
    this.shootTimer -= dt;
    if (!this.charging && this.shootTimer <= 0) {
      this.charging = true; this.chargeTimer = 0.8;
      this.aimX = px; this.aimY = py;
    }
    if (this.charging) {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.charging = false; this.shootTimer = 3.5 + Math.random();
        const dx = this.aimX - this.x, dy = this.aimY - this.y, d = Math.hypot(dx, dy) || 1;
        // Proiettile veloce (laser)
        for (let s = 0; s < 3; s++) eprojs.push({ x: this.x + s * dx / d * 20, y: this.y + s * dy / d * 20, vx: dx / d * 380, vy: dy / d * 380, r: 3, col: this.col, life: 2 });
      }
    }
    // Mantieni distanza dal player
    const dist = Math.hypot(px - this.x, py - this.y);
    if (dist < 200) {
      const dx = (this.x - px) / (dist || 1), dy = (this.y - py) / (dist || 1);
      this.vx += dx * this.spd * dt * 2; this.vy += dy * this.spd * dt * 2;
    } else {
      super._updateMovement(dt, px, py, obstacles, enemies);
    }
    this.x = Math.max(0, this.x); this.y = Math.max(0, this.y);
  }
}
