export const POWERUP_TYPES = {
  SLOW:    'SLOW',
  FREEZE:  'FREEZE',
  EXPLODE: 'EXPLODE',
};

const COLORS = {
  SLOW:    '#3388FF',
  FREEZE:  '#88CCFF',
  EXPLODE: '#FF4400',
};

const ICONS = {
  SLOW:    '⏱',
  FREEZE:  '❄',
  EXPLODE: '💥',
};

const LABELS = {
  SLOW:    'SLOW',
  FREEZE:  'FREEZE',
  EXPLODE: 'BOOM',
};

export class PowerUpDrop {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.r = 22;
    this.type = POWERUP_TYPES.SLOW;
    this.color = COLORS.SLOW;
    this.alive = false;
    this.age = 0;
    this.vy = 18; // drift downward speed (px/s)
  }

  init(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = COLORS[type];
    this.alive = true;
    this.age = 0;
    this.r = 26;
    this.vy = 20;
  }

  update(dt, canvasH) {
    if (!this.alive) return;
    this.age += dt;
    this.y += this.vy * dt;
    // Despawn if off bottom
    if (this.y > canvasH + this.r + 20) {
      this.alive = false;
    }
  }

  hitTest(tapX, tapY, radiusMult) {
    const rm = radiusMult || 1;
    const dx = this.x - tapX;
    const dy = this.y - tapY;
    return Math.sqrt(dx * dx + dy * dy) < (this.r + 24) * rm;
  }

  draw(ctx, dpr) {
    if (!this.alive) return;

    const px = this.x * dpr;
    const py = this.y * dpr;
    const pr = this.r * dpr;

    // Pulsing glow
    const pulse = 0.5 + 0.5 * Math.sin(this.age * 4);

    ctx.shadowBlur = (20 + pulse * 20) * dpr;
    ctx.shadowColor = this.color;

    // Outer ring
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5 * dpr;
    ctx.globalAlpha = 0.5 + pulse * 0.4;
    ctx.beginPath();
    ctx.arc(px, py, pr * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Body
    const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    grad.addColorStop(0, this.color + '40');
    grad.addColorStop(1, 'rgba(5,5,8,0.9)');
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label
    const fs = Math.max(9, this.r * 0.45) * dpr;
    ctx.font = `700 ${fs}px "JetBrains Mono","Courier New",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6 * dpr;
    ctx.shadowColor = this.color;
    ctx.fillText(LABELS[this.type], px, py);
    ctx.shadowBlur = 0;

    // Type indicator arc (decorative)
    ctx.strokeStyle = this.color + 'AA';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(px, py, pr * 1.25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pulse);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }
}
