export class LightingSystem {
  constructor() {
    this.lights = [];
    this.fogColor = 'rgba(0,0,0,0.65)';
    this.playerLightRadius = 280;
    this.enabled = true;
  }

  addLight(x, y, radius, color, intensity = 1) {
    this.lights.push({ x, y, radius, color, intensity, life: -1 });
  }

  addFlash(x, y, radius, color, duration = 0.3) {
    this.lights.push({ x, y, radius, color, intensity: 1, life: duration, maxLife: duration });
  }

  update(dt) {
    for (let i = this.lights.length - 1; i >= 0; i--) {
      if (this.lights[i].life > 0) {
        this.lights[i].life -= dt;
        if (this.lights[i].life <= 0) this.lights.splice(i, 1);
      }
    }
  }

  renderFog(ctx, W, H, playerX, playerY, wx, wy, DPR) {
    if (!this.enabled) return;

    const plx = wx(playerX), ply = wy(playerY);
    const r = this.playerLightRadius * DPR;

    // Crea maschera di luce con radial gradient
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    const mask = ctx.createRadialGradient(plx, ply, 0, plx, ply, r);
    mask.addColorStop(0, 'rgba(0,0,0,0)');
    mask.addColorStop(0.6, 'rgba(0,0,0,0)');
    mask.addColorStop(1, this.fogColor);

    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, W, H);

    // Luce da esplosioni/effetti
    this.lights.forEach(l => {
      if (l.life === -1) return;
      const intensity = l.life / l.maxLife;
      const lx = wx(l.x), ly = wy(l.y);
      const lr = l.radius * DPR * intensity;
      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      grad.addColorStop(0, l.color.replace(')', `,${intensity * 0.3})`).replace('rgb', 'rgba'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillRect(0, 0, W, H);
    });

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }
}
