export class Effects {
  constructor() {
    this._flashes = [];
    this._shake = { x: 0, y: 0, intensity: 0, decay: 0.85 };
    this._glitchTimer = 0;
    this._slowTint = 0;
    this._freezeTint = 0;
    this._vignetteAlpha = 0;
  }

  flash(color, alpha, duration) {
    this._flashes.push({
      color,
      alpha: alpha || 0.35,
      duration: duration || 0.25,
      elapsed: 0,
    });
  }

  shake(intensity) {
    this._shake.intensity = Math.max(this._shake.intensity, intensity || 8);
  }

  triggerGlitch(frames) {
    this._glitchTimer = Math.max(this._glitchTimer, frames || 10);
  }

  setSlowTint(active) {
    this._slowTint = active ? 1 : 0;
  }

  setFreezeTint(active) {
    this._freezeTint = active ? 1 : 0;
  }

  update(dt) {
    // Flashes
    for (let i = this._flashes.length - 1; i >= 0; i--) {
      const f = this._flashes[i];
      f.elapsed += dt;
      if (f.elapsed >= f.duration) {
        this._flashes.splice(i, 1);
      }
    }

    // Shake decay
    if (this._shake.intensity > 0.1) {
      const angle = Math.random() * Math.PI * 2;
      this._shake.x = Math.cos(angle) * this._shake.intensity;
      this._shake.y = Math.sin(angle) * this._shake.intensity;
      this._shake.intensity *= this._shake.decay;
    } else {
      this._shake.x = 0;
      this._shake.y = 0;
      this._shake.intensity = 0;
    }

    if (this._glitchTimer > 0) this._glitchTimer--;
  }

  applyShake(ctx, dpr) {
    if (this._shake.intensity > 0.5) {
      ctx.translate(this._shake.x * dpr, this._shake.y * dpr);
    }
  }

  drawOverlays(ctx, W, H, dpr) {
    // Flashes
    for (const f of this._flashes) {
      const t = f.elapsed / f.duration;
      const a = f.alpha * (1 - t);
      ctx.globalAlpha = a;
      ctx.fillStyle = f.color;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 1;

    // Slow tint — blue vignette
    if (this._slowTint > 0) {
      const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
      grad.addColorStop(0, 'rgba(0,0,255,0)');
      grad.addColorStop(1, `rgba(0,60,255,${0.18 * this._slowTint})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Scanline effect when slow active
      ctx.fillStyle = `rgba(0,80,255,${0.04 * this._slowTint})`;
      for (let y = 0; y < H; y += 4 * dpr) {
        ctx.fillRect(0, y, W, 1.5 * dpr);
      }
    }

    // Freeze tint
    if (this._freezeTint > 0) {
      ctx.fillStyle = `rgba(136,204,255,${0.12 * this._freezeTint})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Glitch effect: slice horizontal bands and offset
    if (this._glitchTimer > 0) {
      this._drawGlitch(ctx, W, H, dpr);
    }
  }

  _drawGlitch(ctx, W, H, dpr) {
    const bands = 8;
    const bandH = H / bands;
    ctx.save();
    for (let i = 0; i < bands; i++) {
      if (Math.random() < 0.35) {
        const offset = (Math.random() - 0.5) * 14 * dpr;
        const yStart = i * bandH;
        ctx.globalAlpha = 0.15;
        // Chromatic aberration bands
        ctx.fillStyle = i % 2 === 0 ? 'rgba(0,255,255,1)' : 'rgba(255,0,255,1)';
        ctx.fillRect(offset, yStart, W, bandH);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
