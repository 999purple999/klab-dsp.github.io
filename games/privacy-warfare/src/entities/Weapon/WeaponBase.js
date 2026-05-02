export class WeaponBase {
  constructor(def) {
    // def = { name, color, cd, dmg, range, projSpeed, projCount, spread, piercing, aoe }
    Object.assign(this, def);
    this.timer = 0;
    this.level = 1;
  }
  update(dt) { if(this.timer > 0) this.timer -= dt; }
  canFire() { return this.timer <= 0; }
  fire(ox, oy, tx, ty, projectiles) {
    if(!this.canFire()) return false;
    this.timer = this.cd;
    this._spawnProjectiles(ox, oy, tx, ty, projectiles);
    return true;
  }
  _spawnProjectiles(ox, oy, tx, ty, projectiles) {
    const dx=tx-ox, dy=ty-oy, len=Math.sqrt(dx*dx+dy*dy)||1;
    const nx=dx/len, ny=dy/len;
    const half = (this.projCount-1)/2;
    for(let i=0;i<this.projCount;i++){
      const a = Math.atan2(ny,nx) + (i-half)*this.spread;
      projectiles.push({
        x:ox, y:oy,
        vx: Math.cos(a)*this.projSpeed, vy: Math.sin(a)*this.projSpeed,
        dmg: this.dmg, range: this.range, dist:0,
        col: this.color, sz: 4,
        piercing: this.piercing||false,
        aoe: this.aoe||0,
        alive: true
      });
    }
  }
  upgrade() { this.level++; this.dmg *= 1.15; this.cd *= 0.92; }
  getReadout() { return `${this.name} Lv${this.level}`; }
}
