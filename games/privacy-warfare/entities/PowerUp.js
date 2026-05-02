// entities/PowerUp.js — World power-ups (health packs, ammo etc.)

import { dist } from '../utils/math.js';

const TYPES = [
  { id: 'health',  col: '#ef4444', label: '+HP',  chance: 0.3 },
  { id: 'credits', col: '#39FF14', label: '+CR',  chance: 0.4 },
  { id: 'ammo',    col: '#a855f7', label: 'AMMO', chance: 0.3 },
];

export class PowerUpManager {
  constructor() {
    this.list = [];
  }

  maybeSpawn(x, y, waveNum) {
    if (Math.random() > 0.18) return; // 18% chance per kill
    const rng = Math.random();
    let acc = 0;
    let type = TYPES[0];
    for (const t of TYPES) {
      acc += t.chance;
      if (rng <= acc) { type = t; break; }
    }
    this.list.push({ x, y, type, life: 8, pulse: 0 });
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      p.pulse += dt * 3;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  }

  checkPickup(px, py, radius = 22) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (dist(p.x, p.y, px, py) < radius) {
        this.list.splice(i, 1);
        return p.type.id;
      }
    }
    return null;
  }

  clear() { this.list = []; }

  render(ctx, camera, dpr, t) {
    for (const p of this.list) {
      if (!camera.onScreen(p.x, p.y, 20)) continue;
      const cx = camera.wx(p.x, dpr);
      const cy = camera.wy(p.y, dpr);
      const r = (8 + Math.sin(p.pulse) * 2) * dpr;
      ctx.globalAlpha = Math.min(1, p.life * 0.5);
      ctx.fillStyle = p.type.col;
      ctx.shadowBlur = 16;
      ctx.shadowColor = p.type.col;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(7 * dpr)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type.label, cx, cy);
      ctx.globalAlpha = 1;
    }
  }
}
