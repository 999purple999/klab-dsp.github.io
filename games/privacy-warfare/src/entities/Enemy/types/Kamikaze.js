import { BaseEnemy } from '../BaseEnemy.js';

export class Kamikaze extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'kamikaze', col: '#FFFF00', sz: 10, hp: 1, spd: 140, pts: 30 }, wave);
    this.explodeRange = 60;
    this.beepTimer = 0;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    if (this.frozen > 0) return;
    this.beepTimer -= dt;
    const dist = Math.hypot(px - this.x, py - this.y);
    if (dist < this.explodeRange) {
      // Esplode! hp=0 per uccidersi, burst grande
      this.hp = 0;
      burst(this.x, this.y, '#FFFF00', 20, 90);
      // Il danno al player è gestito dal game loop tramite hp <= 0 + tipo kamikaze
      return;
    }
  }

  isKamikaze() { return true; }
}
