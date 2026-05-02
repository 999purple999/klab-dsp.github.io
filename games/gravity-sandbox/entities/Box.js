import { clamp } from '../utils/math.js';

export const NEON_COLORS = [
  { color: '#BF00FF', rgb: '191,0,255'   },
  { color: '#00FF41', rgb: '0,255,65'    },
  { color: '#00FFFF', rgb: '0,255,255'   },
  { color: '#FF8C00', rgb: '255,140,0'   },
  { color: '#FF3366', rgb: '255,51,102'  },
  { color: '#FFFF00', rgb: '255,255,0'   },
];

export const LABEL_COLORS = {
  Docs:   NEON_COLORS[0],
  Sheets: NEON_COLORS[1],
  IDE:    NEON_COLORS[2],
  Collab: NEON_COLORS[3],
  Canvas: NEON_COLORS[4],
};

let _idCounter = 0;

export class Box {
  constructor({ x, y, w, h, label, colorIndex = 0 }) {
    this.id = ++_idCounter;
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = Math.random() * 2;
    this.w = w; this.h = h;
    this.label = label;
    this.colorIndex = colorIndex % NEON_COLORS.length;
    this.color = NEON_COLORS[this.colorIndex].color;
    this.rgb = NEON_COLORS[this.colorIndex].rgb;
    this.mass = (w * h) / 3000;
    this.elasticity = 0.7;
    this.locked = false;
    this.dragging = false;
    this.trail = [];
    this.pulse = Math.random() * Math.PI * 2;
    this.angle = 0;
    this.av = 0;
  }

  setColor(index) {
    this.colorIndex = index % NEON_COLORS.length;
    this.color = NEON_COLORS[this.colorIndex].color;
    this.rgb = NEON_COLORS[this.colorIndex].rgb;
  }

  update(dt) {
    if (this.locked || this.dragging) return;
    this.pulse += 0.04;
    // Record trail
    this.trail.push({ x: this.x + this.w / 2, y: this.y + this.h / 2 });
    if (this.trail.length > 20) this.trail.shift();
  }

  draw(ctx, dpr) {
    const s = dpr;
    // Draw trail
    if (this.trail.length > 1) {
      const speed = Math.hypot(this.vx, this.vy);
      const alpha = clamp(speed / 15, 0, 0.4);
      for (let i = 1; i < this.trail.length; i++) {
        const t = i / this.trail.length;
        ctx.globalAlpha = alpha * t * 0.5;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = t * 3 * s;
        ctx.beginPath();
        ctx.moveTo(this.trail[i - 1].x * s, this.trail[i - 1].y * s);
        ctx.lineTo(this.trail[i].x * s, this.trail[i].y * s);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate((this.x + this.w / 2) * s, (this.y + this.h / 2) * s);
    ctx.rotate(this.angle);

    const bw = this.w * s, bh = this.h * s, r = 10 * s;
    const speed = Math.hypot(this.vx, this.vy);
    const glowFactor = clamp(speed / 20, 0, 1);
    const pulse = 0.75 + 0.25 * Math.sin(this.pulse);

    ctx.shadowBlur = (16 + 20 * glowFactor + 10 * pulse) * s;
    ctx.shadowColor = this.color;

    // Body gradient
    const grad = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
    grad.addColorStop(0, `rgba(${this.rgb},0.10)`);
    grad.addColorStop(0.5, 'rgba(8,8,14,0.97)');
    grad.addColorStop(1, 'rgba(5,5,10,0.97)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    this._roundRect(ctx, -bw / 2, -bh / 2, bw, bh, r);
    ctx.fill();

    // Border
    ctx.strokeStyle = this.color;
    ctx.lineWidth = (this.locked ? 3.5 : 2.2) * s;
    ctx.shadowBlur = (12 + 8 * pulse) * s;
    ctx.stroke();

    // Locked box dashed border overlay
    if (this.locked) {
      ctx.setLineDash([6 * s, 4 * s]);
      ctx.strokeStyle = `rgba(${this.rgb},0.5)`;
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      this._roundRect(ctx, -bw / 2 + 4 * s, -bh / 2 + 4 * s, bw - 8 * s, bh - 8 * s, r * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Corner sparks
    ctx.shadowBlur = 10 * s;
    [[-0.46, -0.46], [0.46, -0.46], [0.46, 0.46], [-0.46, 0.46]].forEach(([fx, fy]) => {
      const csz = (1.5 + pulse * 2) * s;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(fx * bw, fy * bh, csz, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Shine
    const shine = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, -bh / 4);
    shine.addColorStop(0, `rgba(${this.rgb},0.16)`);
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    this._roundRect(ctx, -bw / 2, -bh / 2, bw, bh / 2, r);
    ctx.fill();

    // Label
    const fs = Math.min(bh * 0.38, bw * 0.2);
    ctx.font = `800 ${fs}px "Space Grotesk","Inter",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10 * s;
    ctx.shadowColor = this.color;
    ctx.fillText(this.label, 0, this.locked ? -fs * 0.4 : 0);
    ctx.shadowBlur = 0;

    // Lock icon
    if (this.locked) {
      ctx.fillStyle = `rgba(${this.rgb},0.9)`;
      ctx.shadowBlur = 6 * s;
      ctx.shadowColor = this.color;
      const lx = 0, ly = fs * 0.7, lw = fs * 0.5, lh = fs * 0.45;
      // Lock body
      ctx.beginPath();
      ctx.roundRect(lx - lw / 2, ly - lh / 2, lw, lh, 3 * s);
      ctx.fill();
      // Lock shackle
      ctx.beginPath();
      ctx.arc(lx, ly - lh / 2, lw * 0.28, Math.PI, 0);
      ctx.lineWidth = 2.5 * s;
      ctx.strokeStyle = `rgba(${this.rgb},0.9)`;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    const R = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + R, y);
    ctx.arcTo(x + w, y, x + w, y + h, R);
    ctx.arcTo(x + w, y + h, x, y + h, R);
    ctx.arcTo(x, y + h, x, y, R);
    ctx.arcTo(x, y, x + w, y, R);
    ctx.closePath();
  }

  contains(lx, ly) {
    return lx >= this.x && lx <= this.x + this.w && ly >= this.y && ly <= this.y + this.h;
  }

  toJSON() {
    return {
      x: this.x, y: this.y, vx: this.vx, vy: this.vy,
      w: this.w, h: this.h, label: this.label,
      colorIndex: this.colorIndex, locked: this.locked
    };
  }
}
