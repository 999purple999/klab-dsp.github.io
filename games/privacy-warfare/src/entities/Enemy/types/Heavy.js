import { BaseEnemy } from '../BaseEnemy.js';

export class Heavy extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'heavy', col: '#FF8800', sz: 18, hp: 4 + Math.floor(wave / 2), spd: 38, pts: 55 }, wave);
    this.shootTimer = 3 + Math.random() * 2;
    this.rocketSpeed = 130;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    if (this.frozen > 0) return;
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = 3.5 + Math.random() * 2;
      const dx = px - this.x, dy = py - this.y, d = Math.hypot(dx, dy) || 1;
      // Razzo: grande, lento, splash
      eprojs.push({ x: this.x, y: this.y, vx: dx / d * this.rocketSpeed, vy: dy / d * this.rocketSpeed, r: 9, col: this.col, life: 4, isRocket: true });
    }
  }
}
