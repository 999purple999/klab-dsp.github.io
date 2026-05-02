export const PIPE_W = 54;
export const OBSTACLE_TYPE = { PIPE: 'PIPE', LASER: 'LASER' };

export class Obstacle {
  constructor(x, W, H, score, type = OBSTACLE_TYPE.PIPE) {
    this.type = type;
    this.x = x;
    this.w = PIPE_W;
    this.scored = false;
    this.passed = false;

    if (type === OBSTACLE_TYPE.PIPE) {
      const gapH = Math.max(90, 160 - score * 2.5);
      const margin = 70;
      this.gapY = margin + Math.random() * (H - gapH - margin * 2);
      this.gapH = gapH;
    } else if (type === OBSTACLE_TYPE.LASER) {
      this.flashTimer = 0;
      this.flashPeriod = 0.6;
      this.active = true;
    }
  }

  update(dt, speed) {
    this.x -= speed * dt;

    if (this.type === OBSTACLE_TYPE.LASER) {
      this.flashTimer += dt;
      if (this.flashTimer >= this.flashPeriod) {
        this.flashTimer = 0;
        this.active = !this.active;
      }
    }
  }

  isOffScreen() {
    return this.x + this.w + 20 < 0;
  }

  draw(ctx, dpr, H) {
    if (this.type === OBSTACLE_TYPE.PIPE) {
      this._drawPipe(ctx, dpr, H);
    } else if (this.type === OBSTACLE_TYPE.LASER) {
      this._drawLaser(ctx, dpr, H);
    }
  }

  _drawPipe(ctx, dpr, H) {
    const px = this.x * dpr;
    const pw = PIPE_W * dpr;
    const gTop = this.gapY * dpr;
    const gBot = (this.gapY + this.gapH) * dpr;
    const canvasH = H * dpr;

    const pg = ctx.createLinearGradient(px, 0, px + pw, 0);
    pg.addColorStop(0, 'rgba(180,0,60,0.85)');
    pg.addColorStop(0.5, 'rgba(255,30,80,0.95)');
    pg.addColorStop(1, 'rgba(130,0,40,0.85)');
    ctx.fillStyle = pg;
    ctx.fillRect(px, 0, pw, gTop - 6 * dpr);
    ctx.fillRect(px, gBot + 6 * dpr, pw, canvasH - gBot - 6 * dpr);

    ctx.shadowBlur = 24 * dpr;
    ctx.shadowColor = '#FF2244';
    ctx.strokeStyle = '#FF3366';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.rect(px, 0, pw, gTop - 6 * dpr);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(px, gBot + 6 * dpr, pw, canvasH - gBot - 6 * dpr);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Gap caps
    ctx.fillStyle = '#FF3366';
    ctx.fillRect(px - 4 * dpr, gTop - 14 * dpr, pw + 8 * dpr, 14 * dpr);
    ctx.fillRect(px - 4 * dpr, gBot, pw + 8 * dpr, 14 * dpr);
    ctx.shadowBlur = 30 * dpr;
    ctx.shadowColor = '#FF2244';
    ctx.strokeStyle = '#FF5588';
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(px - 4 * dpr, gTop - 14 * dpr, pw + 8 * dpr, 14 * dpr);
    ctx.strokeRect(px - 4 * dpr, gBot, pw + 8 * dpr, 14 * dpr);
    ctx.shadowBlur = 0;
  }

  _drawLaser(ctx, dpr, H) {
    if (!this.active) {
      // Dim outline when off
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 3 * dpr;
      ctx.setLineDash([8 * dpr, 8 * dpr]);
      ctx.beginPath();
      ctx.moveTo(this.x * dpr, 0);
      ctx.lineTo(this.x * dpr, H * dpr);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      return;
    }

    // Active laser - bright red line
    ctx.save();
    ctx.shadowBlur = 30 * dpr;
    ctx.shadowColor = '#FF0000';
    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(this.x * dpr, 0);
    ctx.lineTo(this.x * dpr, H * dpr);
    ctx.stroke();
    // Inner bright core
    ctx.strokeStyle = '#FFAAAA';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(this.x * dpr, 0);
    ctx.lineTo(this.x * dpr, H * dpr);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
