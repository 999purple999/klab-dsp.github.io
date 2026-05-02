export class Pickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 8;
    this.collected = false;
    this._t = Math.random() * Math.PI * 2;
    this._bobY = 0;
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this._t += dt * 3;
    this._bobY = Math.sin(this._t) * 3;
  }

  isOffScreen() {
    return this.x < -20;
  }

  draw(ctx, dpr) {
    if (this.collected) return;
    const x = this.x * dpr;
    const y = (this.y + this._bobY) * dpr;
    const r = this.r * dpr;

    ctx.save();
    // Glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
    grad.addColorStop(0, 'rgba(255,215,0,0.5)');
    grad.addColorStop(1, 'rgba(255,165,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Coin body
    ctx.shadowBlur = 12 * dpr;
    ctx.shadowColor = '#FFD700';
    const cg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    cg.addColorStop(0, '#FFE566');
    cg.addColorStop(0.6, '#FFD700');
    cg.addColorStop(1, '#CC9900');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#CC9900';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Coin symbol
    ctx.fillStyle = 'rgba(180,130,0,0.7)';
    ctx.font = `bold ${7 * dpr}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¢', x, y);
    ctx.restore();
  }
}
