import { BaseEnemy } from '../BaseEnemy.js';

export class Overclocker extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'overclocker', col: '#00FFFF', sz: 12, hp: 2, spd: 52, pts: 60 }, wave);
    this.boostTimer = 4;
    this.boostRange = 150;
    this.boostMult = 1.5;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    if (this.frozen > 0) return;
    this.boostTimer -= dt;
    if (this.boostTimer <= 0) {
      this.boostTimer = 4;
      enemies.forEach(e => {
        if (e !== this && Math.hypot(e.x - this.x, e.y - this.y) < this.boostRange) {
          e.spd = Math.min(e.spd * 1.2, 250);
          burst(e.x, e.y, '#00FFFF', 4, 25);
        }
      });
    }
  }
}
