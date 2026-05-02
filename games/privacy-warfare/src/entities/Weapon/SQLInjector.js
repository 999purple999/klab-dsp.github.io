import { WeaponBase } from './WeaponBase.js';

export class SQLInjector extends WeaponBase {
  constructor() {
    super({
      name: 'SQL INJECTOR',
      color: '#FFFF00',
      cd: 0.32,
      dmg: 1.4,
      range: 500,
      projSpeed: 440,
      projCount: 1,
      spread: 0,
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
      aoe: this.aoe||0,
      homing: true,
      alive: true,
    });
  }
}
