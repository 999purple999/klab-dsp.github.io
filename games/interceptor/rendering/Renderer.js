export class Renderer {
  constructor(ctx, dpr) {
    this._ctx = ctx;
    this._dpr = dpr;
    this._firewallCrackSeed = 0;
    this._serverGlowPulse = 0;
  }

  drawBackground(W, H, dpr, scanlineOffset) {
    const ctx = this._ctx;

    // Base fill
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, W, H);

    // Grid lines (terminal effect)
    const gs = 50 * dpr;
    ctx.strokeStyle = 'rgba(191,0,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.055)';
    for (let y = 0; y < H; y += 3 * dpr) {
      ctx.fillRect(0, y, W, 1.5 * dpr);
    }

    // Subtle center vanishing point gradient (3D depth cue)
    const vpGrad = ctx.createRadialGradient(W * 0.85, H / 2, 0, W * 0.85, H / 2, W * 0.7);
    vpGrad.addColorStop(0, 'rgba(191,0,255,0.03)');
    vpGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vpGrad;
    ctx.fillRect(0, 0, W, H);
  }

  drawFirewall(W, H, dpr, hp, maxHp, repairProgress) {
    const ctx = this._ctx;
    const fw = 40 * dpr;

    // Gradient glow
    const hpRatio = hp / maxHp;
    const r = Math.round(255 * (1 - hpRatio));
    const g = Math.round(255 * hpRatio);
    const fwG = ctx.createLinearGradient(0, 0, fw, 0);
    fwG.addColorStop(0, `rgba(${r},${g},65,0.30)`);
    fwG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fwG;
    ctx.fillRect(0, 0, fw, H);

    // Main wall line
    const wallCol = hp > 0 ? `rgba(${r},${g},65,0.7)` : 'rgba(255,50,50,0.7)';
    ctx.strokeStyle = wallCol;
    ctx.lineWidth = 3 * dpr;
    ctx.shadowBlur = 12 * dpr;
    ctx.shadowColor = wallCol;
    ctx.beginPath();
    ctx.moveTo(5 * dpr, 0);
    ctx.lineTo(5 * dpr, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cracks based on damage
    const damage = maxHp - hp;
    if (damage > 0) {
      this._drawFirewallCracks(ctx, dpr, H, damage, maxHp);
    }

    // Repair progress bar
    if (repairProgress > 0) {
      const barH = H * repairProgress;
      ctx.fillStyle = 'rgba(0,255,65,0.3)';
      ctx.fillRect(0, H - barH, 8 * dpr, barH);
    }

    // "FIREWALL" label
    ctx.save();
    ctx.translate(16 * dpr, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = wallCol;
    ctx.font = `700 ${9 * dpr}px "JetBrains Mono","Courier New",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowColor = wallCol;
    ctx.fillText('FIREWALL', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // HP dots
    for (let i = 0; i < maxHp; i++) {
      const dotY = H / 2 + (i - (maxHp - 1) / 2) * 18 * dpr;
      ctx.beginPath();
      ctx.arc(5 * dpr, dotY, 4 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = i < hp ? '#00FF41' : '#330000';
      ctx.shadowBlur = i < hp ? 8 * dpr : 0;
      ctx.shadowColor = '#00FF41';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  _drawFirewallCracks(ctx, dpr, H, damage, maxHp) {
    const crackColors = ['rgba(255,60,60,0.7)', 'rgba(255,120,0,0.5)', 'rgba(200,0,0,0.6)'];
    // Draw one set of crack lines per damage level
    for (let d = 0; d < damage; d++) {
      const seed = (d + 1) * 17;
      const sr = this._seededRand(seed);
      const numCracks = 3 + d * 2;
      for (let c = 0; c < numCracks; c++) {
        const startY = sr() * H;
        const col = crackColors[Math.floor(sr() * crackColors.length)];
        ctx.strokeStyle = col;
        ctx.lineWidth = (1.5 + d * 0.5) * dpr;
        ctx.shadowBlur = 8 * dpr;
        ctx.shadowColor = '#FF3333';
        ctx.beginPath();
        ctx.moveTo(3 * dpr, startY);
        let cx = 3 * dpr;
        let cy = startY;
        for (let seg = 0; seg < 4; seg++) {
          cx += (sr() * 20 + 5) * dpr;
          cy += (sr() - 0.5) * 30 * dpr;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }

  _seededRand(seed) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  }

  drawServer(W, H, dpr, serverFlash, hp, maxHp) {
    const ctx = this._ctx;
    const sw = 40 * dpr;
    const sf = serverFlash > 0 ? serverFlash / 50 : 0;

    // Server glow
    const svG = ctx.createLinearGradient(W, 0, W - sw, 0);
    svG.addColorStop(0, `rgba(255,34,34,${0.22 + sf * 0.5})`);
    svG.addColorStop(1, 'rgba(255,34,34,0)');
    ctx.fillStyle = svG;
    ctx.fillRect(W - sw, 0, sw, H);

    // Wall line
    const col = `rgba(255,34,34,${0.5 + sf * 0.5})`;
    ctx.strokeStyle = col;
    ctx.lineWidth = 3 * dpr;
    ctx.shadowBlur = 12 * dpr;
    ctx.shadowColor = '#FF2222';
    ctx.beginPath();
    ctx.moveTo(W - 5 * dpr, 0);
    ctx.lineTo(W - 5 * dpr, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Server rack icon
    const rx = W - 34 * dpr;
    const rackH = Math.min(H * 0.5, 200 * dpr);
    const ry = (H - rackH) / 2;
    const rackW = 20 * dpr;
    const unitH = rackH / 5;

    for (let i = 0; i < 5; i++) {
      const uy = ry + i * unitH;
      const isActive = (Date.now() + i * 200) % 1200 < 600;
      ctx.fillStyle = `rgba(255,34,34,${0.1 + sf * 0.3})`;
      ctx.strokeStyle = `rgba(255,34,34,${0.4 + sf * 0.3})`;
      ctx.lineWidth = 1 * dpr;
      ctx.fillRect(rx, uy + 2 * dpr, rackW, unitH - 4 * dpr);
      ctx.strokeRect(rx, uy + 2 * dpr, rackW, unitH - 4 * dpr);
      // LED indicator
      ctx.beginPath();
      ctx.arc(rx + rackW - 5 * dpr, uy + unitH / 2, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? `rgba(255,50,50,${0.5 + sf * 0.5})` : 'rgba(100,0,0,0.5)';
      ctx.shadowBlur = isActive ? 8 * dpr : 0;
      ctx.shadowColor = '#FF3333';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // "SERVER" label
    ctx.save();
    ctx.translate(W - 16 * dpr, H / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = col;
    ctx.font = `700 ${9 * dpr}px "JetBrains Mono","Courier New",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowColor = '#FF2222';
    ctx.fillText('SERVER', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Flash overlay
    if (serverFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${sf * 0.2})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawBranding(W, H, dpr) {
    const ctx = this._ctx;
    ctx.globalAlpha = 0.25;
    ctx.font = `600 ${11 * dpr}px "JetBrains Mono","Courier New",monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#BF00FF';
    ctx.fillText('K-PERCEPTION', W - 16 * dpr, H - 16 * dpr);
    ctx.globalAlpha = 1;
  }
}
