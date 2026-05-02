import { WeaponBase } from './WeaponBase.js';

export class QuantumKey extends WeaponBase {
  constructor() {
    super({
      name: 'QUANTUM KEY',
      color: '#00FFFF',
      cd: 0.9,
      dmg: 4.5,
      range: 700,
      projSpeed: 9999,
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
      isQuantum: true,
      alive: true,
    });
  }
}
