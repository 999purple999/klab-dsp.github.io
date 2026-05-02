import { BaseEnemy } from '../BaseEnemy.js';

export class FrostMage extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'frostmage', col: '#88CCFF', sz: 13, hp: 2, spd: 45, pts: 55 }, wave);
    this.frostTimer = 2.5 + Math.random();
    this.frostRange = 220;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    if (this.frozen > 0) return;
    this.frostTimer -= dt;
    if (this.frostTimer <= 0) {
      this.frostTimer = 3 + Math.random() * 2;
      const dx = px - this.x, dy = py - this.y, d = Math.hypot(dx, dy) || 1;
      if (d < this.frostRange) {
        // Proiettile lento congelante
        eprojs.push({ x: this.x, y: this.y, vx: dx / d * 100, vy: dy / d * 100, r: 8, col: '#88CCFF', life: 4, isFrost: true });
        burst(this.x, this.y, '#88CCFF', 5, 30);
      }
    }
  }
}
