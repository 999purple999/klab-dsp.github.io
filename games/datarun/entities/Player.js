import { clamp } from '../utils/math.js';

const GRAVITY = 1380;
const MAX_VY = 680;
const TRAIL_LENGTH = 12;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.gravDir = 1; // 1 = down, -1 = up
    this.r = 13;
    this.angle = 0;
    this.trail = [];
    this.alive = true;
    this.shield = false;
    this.invincible = false;
    this.slowActive = false;
    this.magnetActive = false;
    this.powerupTimer = 0;
    this.activePowerup = null;
    this.flips = 0;
    this._trailColors = { up: '#00FFFF', down: '#a855f7' };
  }

  flip() {
    this.gravDir *= -1;
    this.vy *= 0.12;
    this.flips++;
    if (navigator.vibrate) navigator.vibrate(20);
  }

  update(dt, H) {
    const speedMult = this.slowActive ? 0.4 : 1;
    this.vy += this.gravDir * GRAVITY * dt * speedMult;
    this.vy = clamp(this.vy, -MAX_VY, MAX_VY);
    this.y += this.vy * dt * speedMult;
    this.angle = Math.atan2(this.vy * this.gravDir, 300) * 0.6;

    // Update trail
    this.trail.unshift({ x: this.x, y: this.y, angle: this.angle });
    if (this.trail.length > TRAIL_LENGTH) this.trail.pop();

    // Update powerup timer
    if (this.powerupTimer > 0) {
      this.powerupTimer -= dt;
      if (this.powerupTimer <= 0) {
        this._deactivatePowerup();
      }
    }
  }

  hitBoundary(H) {
    return this.y < this.r + 3 || this.y > H - this.r - 3;
  }

  clampToScreen(H) {
    if (this.y < this.r + 3) this.y = this.r + 3;
    if (this.y > H - this.r - 3) this.y = H - this.r - 3;
  }

  activatePowerup(type, duration) {
    this.activePowerup = type;
    this.powerupTimer = duration;
    if (type === 'SHIELD') this.shield = true;
    if (type === 'SLOW') this.slowActive = true;
    if (type === 'MAGNET') this.magnetActive = true;
    if (type === 'INVINCIBLE') this.invincible = true;
  }

  _deactivatePowerup() {
    if (this.activePowerup === 'SHIELD') this.shield = false;
    if (this.activePowerup === 'SLOW') this.slowActive = false;
    if (this.activePowerup === 'MAGNET') this.magnetActive = false;
    if (this.activePowerup === 'INVINCIBLE') this.invincible = false;
    this.activePowerup = null;
    this.powerupTimer = 0;
  }

  getTrailColor() {
    return this.gravDir < 0 ? this._trailColors.up : this._trailColors.down;
  }

  draw(ctx, dpr) {
    const trailColor = this.getTrailColor();

    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const pos = this.trail[i];
      const tf = 1 - (i / (this.trail.length + 1));
      const r = this.r * tf * 0.85;
      ctx.save();
      ctx.translate(pos.x * dpr, pos.y * dpr);
      ctx.rotate(pos.angle);
      this._drawDiamond(ctx, 0, 0, r * dpr);
      ctx.globalAlpha = tf * 0.22;
      ctx.fillStyle = trailColor;
      ctx.fill();
      ctx.restore();
    }

    // Shield ring
    if (this.shield) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x * dpr, this.y * dpr, (this.r + 10) * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59,130,246,0.7)';
      ctx.lineWidth = 3 * dpr;
      ctx.shadowBlur = 16 * dpr;
      ctx.shadowColor = '#3b82f6';
      ctx.stroke();
      ctx.restore();
    }

    // Invincible ring
    if (this.invincible) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x * dpr, this.y * dpr, (this.r + 8) * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 3 * dpr;
      ctx.shadowBlur = 20 * dpr;
      ctx.shadowColor = '#fff';
      ctx.stroke();
      ctx.restore();
    }

    // Glow + body
    ctx.save();
    ctx.translate(this.x * dpr, this.y * dpr);
    ctx.rotate(this.angle);
    this._drawDiamond(ctx, 0, 0, this.r * dpr);
    ctx.shadowBlur = 36 * dpr;
    ctx.shadowColor = trailColor;
    const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r * dpr);
    pg.addColorStop(0, 'rgba(255,220,255,0.92)');
    pg.addColorStop(0.4, trailColor === '#00FFFF' ? 'rgba(0,200,255,0.85)' : 'rgba(168,85,247,0.85)');
    pg.addColorStop(1, 'rgba(80,0,160,0.4)');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = trailColor;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Gravity arrow indicator
    const ay = this.gravDir < 0 ? -1 : 1;
    const arrowLen = (this.r + 10) * dpr;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = trailColor;
    ctx.lineWidth = 1.5 * dpr;
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowColor = trailColor;
    const ax = this.x * dpr;
    const baseY = this.y * dpr + ay * arrowLen;
    ctx.beginPath();
    ctx.moveTo(ax, this.y * dpr);
    ctx.lineTo(ax, baseY);
    ctx.moveTo(ax - 5 * dpr, baseY - ay * 5 * dpr);
    ctx.lineTo(ax, baseY);
    ctx.lineTo(ax + 5 * dpr, baseY - ay * 5 * dpr);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _drawDiamond(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.65, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.65, cy);
    ctx.closePath();
  }
}
