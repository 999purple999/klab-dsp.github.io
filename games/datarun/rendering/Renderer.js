import { Device } from '../utils/Device.js';

export class Renderer {
  constructor(canvas, ctx) {
    this._canvas = canvas;
    this._ctx = ctx;
    this._W = window.innerWidth;
    this._H = window.innerHeight;
    this._dpr = Device.dpr;
    this._gridOff = 0;
    this._dataCloudOff = 0;
    this._nearParticles = [];
    this._initNearParticles();
  }

  onResize(w, h, dpr) {
    this._W = w;
    this._H = h;
    this._dpr = dpr;
    this._initNearParticles();
  }

  _initNearParticles() {
    this._nearParticles = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      this._nearParticles.push({
        x: Math.random() * this._W,
        y: Math.random() * this._H,
        vx: -0.3 - Math.random() * 0.5,
        vy: 0,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.4,
        color: Math.random() < 0.5 ? '#00FFFF' : '#a855f7'
      });
    }
  }

  update(dt, speed, playerY) {
    this._gridOff += dt * speed * 0.08;
    this._dataCloudOff += dt * speed * 0.2;

    // Near particles react slightly to player Y
    const targetBias = (playerY / this._H - 0.5) * 0.8;
    for (const p of this._nearParticles) {
      p.x += p.vx * speed * dt;
      p.vy = targetBias * 0.5;
      p.y += p.vy;
      if (p.x < -10) {
        p.x = this._W + 10;
        p.y = Math.random() * this._H;
      }
      p.y = Math.max(0, Math.min(this._H, p.y));
    }
  }

  drawBackground(t) {
    const ctx = this._ctx;
    const dpr = this._dpr;
    const W = this._W * dpr;
    const H = this._H * dpr;

    // Base fill
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, W, H);

    // Layer 1: far dot grid (slow scroll)
    const gs = 52 * dpr;
    const gridOff = (this._gridOff * dpr) % gs;
    ctx.fillStyle = 'rgba(100,0,200,0.12)';
    for (let x = -gs + gridOff; x < W + gs; x += gs) {
      for (let y = 0; y < H + gs; y += gs) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Neon grid lines (faint)
    ctx.strokeStyle = 'rgba(100,0,200,0.06)';
    ctx.lineWidth = 1;
    for (let x = -gs + gridOff; x < W + gs; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Layer 2: mid data-cloud rectangles (slow scroll)
    const cloudOff = (this._dataCloudOff * dpr) % (this._W * dpr * 2);
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#a855f7';
    const cloudCount = 8;
    for (let i = 0; i < cloudCount; i++) {
      const bx = ((i * 180 * dpr - cloudOff) % (W + 300 * dpr)) - 50 * dpr;
      const by = (Math.sin(i * 1.7) * 0.4 + 0.5) * H;
      const bw = (40 + i * 15) * dpr;
      const bh = (8 + i * 4) * dpr;
      ctx.fillRect(bx, by, bw, bh);
    }
    ctx.globalAlpha = 1;

    // Layer 3: near bright particles
    for (const p of this._nearParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6 * dpr;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, p.size * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Top/bottom neon rails
    const railG = ctx.createLinearGradient(0, 0, W, 0);
    railG.addColorStop(0, 'rgba(168,85,247,0)');
    railG.addColorStop(0.3, 'rgba(168,85,247,0.7)');
    railG.addColorStop(0.7, 'rgba(168,85,247,0.7)');
    railG.addColorStop(1, 'rgba(168,85,247,0)');
    ctx.fillStyle = railG;
    ctx.shadowBlur = 18 * dpr;
    ctx.shadowColor = '#a855f7';
    ctx.fillRect(0, 0, W, 3 * dpr);
    ctx.fillRect(0, H - 3 * dpr, W, 3 * dpr);
    ctx.shadowBlur = 0;
  }
}
