import { WeaponBase } from './WeaponBase.js';

export class ZeroDay extends WeaponBase {
  constructor() {
    super({
      name: 'ZERO DAY',
      color: '#FF4400',
      cd: 0.55,
      dmg: 2.2,
      range: 400,
      projSpeed: 480,
      projCount: 1,
      spread: 0,
      aoe: 80,
    });
  }
  _spawnProjectiles(ox, oy, tx, ty, projectiles) {
    const dx=tx-ox, dy=ty-oy, len=Math.sqrt(dx*dx+dy*dy)||1;
    const nx=dx/len, ny=dy/len;
    const a = Math.atan2(ny, nx);
    projectiles.push({
      x: ox, y: oy,
      vx: Math.cos(a)*this.projSpeed, vy: Math.sin(a)*this.projSpeed,
      dmg: this.dmg, range: this.range, dist: 0,
      col: this.color, sz: 4,
      piercing: this.piercing||false,
      aoe: 80,
      alive: true,
    });
  }
}
