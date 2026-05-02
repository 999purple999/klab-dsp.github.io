export const Effects = {
  _shakeX: 0,
  _shakeY: 0,
  _shakeDur: 0,
  _shakeMag: 0,
  _flashAlpha: 0,
  _flashColor: '#fff',
  _chromaticDur: 0,
  _chromaticMag: 3,

  screenShake(magnitude, duration) {
    this._shakeMag = magnitude;
    this._shakeDur = duration;
  },

  screenFlash(color, alpha) {
    this._flashColor = color || '#fff';
    this._flashAlpha = alpha || 0.7;
  },

  chromaticAberration(duration) {
    this._chromaticDur = duration || 1.5;
  },

  update(dt) {
    if (this._shakeDur > 0) {
      this._shakeDur -= dt;
      this._shakeX = (Math.random() * 2 - 1) * this._shakeMag;
      this._shakeY = (Math.random() * 2 - 1) * this._shakeMag;
      if (this._shakeDur <= 0) {
        this._shakeX = 0;
        this._shakeY = 0;
      }
    }
    if (this._flashAlpha > 0) {
      this._flashAlpha -= dt * 2.5;
      if (this._flashAlpha < 0) this._flashAlpha = 0;
    }
    if (this._chromaticDur > 0) {
      this._chromaticDur -= dt;
      if (this._chromaticDur < 0) this._chromaticDur = 0;
    }
  },

  applyShake(ctx, dpr = 1) {
    if (this._shakeX !== 0 || this._shakeY !== 0) {
      ctx.translate(this._shakeX * dpr, this._shakeY * dpr);
    }
  },

  drawFlash(ctx, w, h) {
    if (this._flashAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this._flashAlpha;
    ctx.fillStyle = this._flashColor;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },

  drawVignette(ctx, w, h) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },

  drawChromaticAberration(ctx, w, h) {
    if (this._chromaticDur <= 0) return;
    const intensity = Math.min(this._chromaticDur / 1.5, 1);
    ctx.save();
    // Red fringe on left edge
    const redGrad = ctx.createLinearGradient(0, 0, w * 0.3, 0);
    redGrad.addColorStop(0, `rgba(255,0,0,${0.18 * intensity})`);
    redGrad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = redGrad;
    ctx.fillRect(0, 0, w * 0.3, h);
    // Blue fringe on right edge
    const blueGrad = ctx.createLinearGradient(w, 0, w * 0.7, 0);
    blueGrad.addColorStop(0, `rgba(0,50,255,${0.18 * intensity})`);
    blueGrad.addColorStop(1, 'rgba(0,50,255,0)');
    ctx.fillStyle = blueGrad;
    ctx.fillRect(w * 0.7, 0, w * 0.3, h);
    // Scanlines
    if (intensity > 0.3) {
      ctx.globalAlpha = 0.06 * intensity;
      ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  isActive() {
    return this._chromaticDur > 0 || this._shakeDur > 0 || this._flashAlpha > 0;
  }
};
