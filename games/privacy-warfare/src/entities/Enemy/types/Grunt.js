import { BaseEnemy } from '../BaseEnemy.js';

export class Grunt extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'grunt', col: '#FF4444', sz: 12, hp: 1, spd: 65, pts: 10 }, wave);
    this.weaponType = 'rifle';
    this.shootTimer = 2.5 + Math.random();
    this.shootRange = 200;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    if (this.frozen > 0) return;
    const dist = Math.hypot(px - this.x, py - this.y);
    if (dist < this.shootRange) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = 2.2 + Math.random() * 1.5;
        const dx = px - this.x, dy = py - this.y, d = Math.hypot(dx, dy) || 1;
        eprojs.push({ x: this.x, y: this.y, vx: dx / d * 180, vy: dy / d * 180, r: 4, col: this.col, life: 2.5 });
      }
    }
  }
}
