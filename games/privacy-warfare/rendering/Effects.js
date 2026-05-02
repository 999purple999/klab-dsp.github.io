// rendering/Effects.js — Full-screen visual effects

export class Effects {
  constructor() {
    this.flashAlpha = 0;
    this.chromAberr = 0;
    this._glitchTimer = 0;
    this._glitchActive = false;
    this._bossIncomingTimer = 0;
    this._quality = 'high'; // 'low' | 'medium' | 'high'
  }

  setQuality(q) { this._quality = q; }

  startBossEntry() {
    this._glitchTimer = 0.5;
    this._glitchActive = true;
    this._bossIncomingTimer = 1.5;
  }

  flash(alpha) { this.flashAlpha = Math.max(this.flashAlpha, alpha); }

  aberration(v) { this.chromAberr = Math.max(this.chromAberr, v); }

  update(dt) {
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
    if (this.chromAberr > 0) this.chromAberr = Math.max(0, this.chromAberr - dt * 4);
    if (this._glitchTimer > 0) { this._glitchTimer -= dt; if (this._glitchTimer <= 0) this._glitchActive = false; }
    if (this._bossIncomingTimer > 0) this._bossIncomingTimer -= dt;
  }

  /** Draw effects on top of scene. ctx is the 2d context, W/H are canvas dims in px. */
  render(ctx, W, H, dpr) {
    const glow = this._quality !== 'low';
    const doChrom = this._quality === 'high';

    // Glitch effect during boss entry
    if (this._glitchActive) {
      const lines = 8;
      ctx.save();
      for (let i = 0; i < lines; i++) {
        const y = Math.random() * H;
        const h = 4 + Math.random() * 14;
        const offset = (Math.random() - 0.5) * 40;
        ctx.drawImage(ctx.canvas, offset, y, W, h, 0, y, W, h);
      }
      ctx.fillStyle = `rgba(191,0,255,${Math.random() * 0.08})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Boss incoming text
    if (this._bossIncomingTimer > 0.2) {
      const alpha = Math.min(1, this._bossIncomingTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f59e0b';
      ctx.font = `900 ${Math.round(36 * dpr)}px 'JetBrains Mono',monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (glow) { ctx.shadowBlur = 40; ctx.shadowColor = '#f59e0b'; }
      ctx.fillText('BOSS INCOMING', W / 2, H / 2);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Screen flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Chromatic aberration
    if (doChrom && this.chromAberr > 0.05) {
      ctx.globalAlpha = this.chromAberr * 0.18;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,0,1)';
      ctx.fillRect(-4 * this.chromAberr * dpr, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,255,1)';
      ctx.fillRect(4 * this.chromAberr * dpr, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  renderVignette(ctx, W, H) {
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.min(W, H) * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
}
