import { BaseEnemy } from '../BaseEnemy.js';

export class Medic extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'medic', col: '#44FF88', sz: 12, hp: 2, spd: 58, pts: 45 }, wave);
    this.healTimer = 3;
    this.healRange = 120;
    this.healAmount = 0.5;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    if (this.frozen > 0) return;
    this.healTimer -= dt;
    if (this.healTimer <= 0) {
      this.healTimer = 3;
      // Cura nemici vicini danneggiati
      enemies.forEach(e => {
        if (e !== this && Math.hypot(e.x - this.x, e.y - this.y) < this.healRange && e.hp < e.maxHp) {
          e.hp = Math.min(e.hp + this.healAmount, e.maxHp);
          burst(e.x, e.y, '#44FF88', 3, 20);
        }
      });
    }
  }
}
