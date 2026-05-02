import { WeaponBase } from './WeaponBase.js';

export class RansomWave extends WeaponBase {
  constructor() {
    super({
      name: 'RANSOM WAVE',
      color: '#FF0055',
      cd: 0.45,
      dmg: 1.8,
      range: 650,
      projSpeed: 1100,
      projCount: 1,
      spread: 0,
      piercing: true,
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
      piercing: true,
      aoe: this.aoe||0,
      alive: true,
    });
  }
}
