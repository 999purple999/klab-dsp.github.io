import { BaseEnemy } from '../BaseEnemy.js';

export class Glitch extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'glitch', col: '#FFFFFF', sz: 11, hp: 2, spd: 70, pts: 55 }, wave);
    this.teleTimer = 2.5 + Math.random() * 2;
    this.glitchAlpha = 1;
    this.WW = 1920; this.WH = 1080; // aggiornato dal game
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    if (this.frozen > 0) return;
    this.teleTimer -= dt;
    this.glitchAlpha = 0.4 + Math.sin(Date.now() / 80) * 0.6;
    this.al = Math.max(0.1, this.glitchAlpha);
    if (this.teleTimer <= 0) {
      this.teleTimer = 2.5 + Math.random() * 2.5;
      // Teletrasportati vicino al player
      const angle = Math.random() * Math.PI * 2;
      const r = 80 + Math.random() * 120;
      this.x = Math.max(0, Math.min(this.WW, px + Math.cos(angle) * r));
      this.y = Math.max(0, Math.min(this.WH, py + Math.sin(angle) * r));
      burst(this.x, this.y, '#FFFFFF', 6, 35);
    }
  }
}
