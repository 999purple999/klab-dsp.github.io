export const POWERUP_TYPES = ['SHIELD', 'SLOW', 'MAGNET', 'INVINCIBLE'];
export const POWERUP_COLORS = {
  SHIELD: '#3b82f6',
  SLOW: '#EAB308',
  MAGNET: '#F97316',
  INVINCIBLE: '#ffffff'
};
export const POWERUP_DURATION = {
  SHIELD: 8,
  SLOW: 5,
  MAGNET: 7,
  INVINCIBLE: 4
};
const POWERUP_LABELS = {
  SHIELD: 'SH',
  SLOW: 'SL',
  MAGNET: 'MG',
  INVINCIBLE: 'IV'
};

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 14;
    this.collected = false;
    this._t = Math.random() * Math.PI * 2;
    this.color = POWERUP_COLORS[type] || '#fff';
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this._t += dt * 2.5;
  }

  isOffScreen() {
    return this.x < -this.r - 20;
  }

  draw(ctx, dpr) {
    if (this.collected) return;
    const x = this.x * dpr;
    const y = this.y * dpr;
    const r = this.r * dpr;
    const pulse = 0.8 + 0.2 * Math.sin(this._t);
    const glowR = r * pulse * 1.6;

    ctx.save();
    // Glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    grad.addColorStop(0, this.color + 'CC');
    grad.addColorStop(0.5, this.color + '44');
    grad.addColorStop(1, this.color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.shadowBlur = 20 * dpr;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.color + 'BB';
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${9 * dpr}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POWERUP_LABELS[this.type] || '?', x, y);
    ctx.restore();
  }
}
