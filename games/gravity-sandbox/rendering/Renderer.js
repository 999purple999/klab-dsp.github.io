import { clamp } from '../utils/math.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width;
    this.H = canvas.height;
    this.dpr = 1;
    this.t = 0;
    this.zeroGAlpha = 0;
    this.chaosAlpha = 0;
  }

  resize(W, H, dpr) {
    this.W = W; this.H = H; this.dpr = dpr;
  }

  drawBackground(boxes) {
    const { ctx, W, H, dpr, t } = this;
    ctx.fillStyle = 'rgba(5,6,13,0.86)';
    ctx.fillRect(0, 0, W, H);

    const gs = 50 * dpr;
    const cols = Math.ceil(W / gs) + 1;
    const rows = Math.ceil(H / gs) + 1;

    // Compute grid with spacetime deformation
    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < rows; gy++) {
        const px = gx * gs;
        const py = gy * gs;
        let dx = 0, dy = 0;

        if (boxes) {
          for (const b of boxes) {
            const bx = (b.x + b.w / 2) * dpr;
            const by = (b.y + b.h / 2) * dpr;
            const speed = Math.hypot(b.vx, b.vy);
            const influence = b.mass * speed * 0.5;
            const distX = px - bx;
            const distY = py - by;
            const d2 = distX * distX + distY * distY;
            if (d2 < 1) continue;
            const d = Math.sqrt(d2);
            const force = clamp(influence / d, 0, 8);
            dx += (distX / d) * force * -1;
            dy += (distY / d) * force * -1;
          }
        }

        // Draw grid dot
        const fpx = px + dx;
        const fpy = py + dy;
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(fpx, fpy, 1.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Grid lines (undistorted, subtle)
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(168,85,247,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Animated floor
    const fl = H - 40 * dpr;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
    const floorG = ctx.createLinearGradient(0, fl - 30 * dpr, 0, fl + 6 * dpr);
    floorG.addColorStop(0, 'rgba(168,85,247,0)');
    floorG.addColorStop(1, `rgba(168,85,247,${0.1 + 0.06 * pulse})`);
    ctx.fillStyle = floorG;
    ctx.fillRect(0, fl - 30 * dpr, W, 36 * dpr);
    ctx.strokeStyle = `rgba(168,85,247,${0.22 + 0.12 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, fl); ctx.lineTo(W, fl); ctx.stroke();

    // Zero-G overlay
    if (this.zeroGAlpha > 0) {
      ctx.fillStyle = `rgba(0,255,255,${0.04 * this.zeroGAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Chaos overlay
    if (this.chaosAlpha > 0) {
      ctx.fillStyle = `rgba(255,50,50,${0.04 * this.chaosAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.globalAlpha = 1;
  }

  drawWatermark() {
    const { ctx, W, H, dpr } = this;
    ctx.globalAlpha = 0.32;
    ctx.font = `600 ${12 * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('K-PERCEPTION', W - 16 * dpr, H - 16 * dpr);
    ctx.globalAlpha = 1;
  }
}
