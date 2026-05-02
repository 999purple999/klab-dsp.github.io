export class Pickup {
  constructor(x, y, type) {
    // type: 'hp'|'shield'|'credits'|'ammo'|'powerup'
    this.x=x; this.y=y; this.type=type;
    this.sz=10; this.alive=true;
    this.bob=0; // oscillation timer
    this.col = {hp:'#FF4466', shield:'#00FFFF', credits:'#00FF41', ammo:'#FFFF00', powerup:'#BF00FF'}[type]||'#fff';
  }
  update(dt) { this.bob += dt*3; }
  render(ctx, camX, camY, DPR) {
    const sx = (this.x-camX)*DPR, sy = (this.y-camY)*DPR + Math.sin(this.bob)*4*DPR;
    ctx.save();
    ctx.shadowColor = this.col; ctx.shadowBlur = 12;
    ctx.fillStyle = this.col;
    ctx.beginPath();
    ctx.arc(sx, sy, this.sz*DPR, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  getValue() {
    return {hp:1, shield:50, credits:15, ammo:30, powerup:0}[this.type]||0;
  }
}

export function spawnPickup(x, y, wave) {
  const r = Math.random();
  let type;
  if(r < 0.3) type='credits';
  else if(r < 0.5) type='hp';
  else if(r < 0.65) type='shield';
  else if(r < 0.8) type='ammo';
  else type='powerup';
  return new Pickup(x, y, type);
}
