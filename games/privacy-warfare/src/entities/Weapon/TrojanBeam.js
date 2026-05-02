import { WeaponBase } from './WeaponBase.js';

export class TrojanBeam extends WeaponBase {
  constructor() {
    super({
      name: 'TROJAN BEAM',
      color: '#CC00FF',
      cd: 0.7,
      dmg: 3.0,
      range: 360,
      projSpeed: 260,
      projCount: 1,
      spread: 0,
      aoe: 60,
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
      col: this.color, sz: 8,
      piercing: this.piercing||false,
      aoe: 60,
      alive: true,
    });
  }
}
