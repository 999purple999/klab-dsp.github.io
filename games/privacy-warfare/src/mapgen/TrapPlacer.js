export const TRAP_TYPES = {
  laser:    { col: '#FF0044', dmg: 0.8, period: 3,   onTime: 1.5, width: 4 },
  electric: { col: '#FFFF00', dmg: 1.2, period: 2.5, onTime: 1,   width: 0 },
  turret:   { col: '#FF8800', dmg: 1,   period: 2,   onTime: 0,   width: 0 },
  acid:     { col: '#44FF00', dmg: 0.4, period: 0,   onTime: 0,   width: 0 }, // continuo
  mine:     { col: '#FF4400', dmg: 3,   period: 0,   onTime: 0,   width: 0 }, // one-shot
};

export class Trap {
  constructor(type, x, y, options = {}) {
    this.type   = type;
    this.x = x; this.y = y;
    this.def    = TRAP_TYPES[type];
    this.timer  = 0;
    this.active = false;
    this.triggered = false;  // per mine
    this.radius = options.radius || 40;
    this.endX   = options.endX;  // per laser
    this.endY   = options.endY;
    this.col    = this.def.col;
    // per torrette
    this.shootTimer = 2;
    this.angle = 0;
  }

  update(dt, playerX, playerY, eprojs) {
    if (this.type === 'laser') {
      this.timer += dt;
      this.active = (this.timer % this.def.period) < this.def.onTime;
      // Se active e player sulla linea → danno
      if (this.active) return this._laserHit(playerX, playerY);
    }
    if (this.type === 'electric') {
      this.timer += dt;
      this.active = (this.timer % this.def.period) < this.def.onTime;
      if (this.active) {
        const d = Math.hypot(playerX - this.x, playerY - this.y);
        if (d < this.radius) return true;
      }
    }
    if (this.type === 'acid') {
      const d = Math.hypot(playerX - this.x, playerY - this.y);
      if (d < this.radius) return true; // danno continuo nel frame
    }
    if (this.type === 'mine') {
      if (!this.triggered) {
        const d = Math.hypot(playerX - this.x, playerY - this.y);
        if (d < 28) { this.triggered = true; return 'mine'; }
      }
    }
    if (this.type === 'turret') {
      this.shootTimer -= dt;
      this.angle = Math.atan2(playerY - this.y, playerX - this.x);
      if (this.shootTimer <= 0) {
        this.shootTimer = 2;
        // Spawna proiettile verso il player
        eprojs.push({ x: this.x, y: this.y, vx: Math.cos(this.angle) * 160, vy: Math.sin(this.angle) * 160, r: 5, col: '#FF8800', life: 3 });
      }
    }
    return false;
  }

  _laserHit(px, py) {
    if (!this.endX) return false;
    // Distanza punto-segmento
    const dx = this.endX - this.x, dy = this.endY - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.max(0, Math.min(1, ((px - this.x) * dx + (py - this.y) * dy) / (len * len)));
    const cx = this.x + t * dx, cy = this.y + t * dy;
    return Math.hypot(px - cx, py - cy) < 14;
  }

  render(ctx, wx, wy, DPR) {
    if (this.type === 'laser') {
      ctx.strokeStyle = this.active ? this.col : this.col + '33';
      ctx.lineWidth = (this.active ? 3 : 1) * DPR;
      ctx.shadowBlur = this.active ? 20 : 0; ctx.shadowColor = this.col;
      ctx.beginPath(); ctx.moveTo(wx(this.x), wy(this.y)); ctx.lineTo(wx(this.endX || this.x + 200), wy(this.endY || this.y)); ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (this.type === 'acid') {
      ctx.globalAlpha = 0.35; ctx.fillStyle = this.col;
      ctx.beginPath(); ctx.arc(wx(this.x), wy(this.y), this.radius * DPR, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (this.type === 'electric') {
      ctx.strokeStyle = this.active ? this.col : this.col + '44';
      ctx.lineWidth = DPR; ctx.setLineDash([4 * DPR, 4 * DPR]);
      ctx.beginPath(); ctx.arc(wx(this.x), wy(this.y), this.radius * DPR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    } else if (this.type === 'turret') {
      ctx.fillStyle = '#996633'; ctx.strokeStyle = this.col; ctx.lineWidth = 2 * DPR;
      ctx.beginPath(); ctx.arc(wx(this.x), wy(this.y), 12 * DPR, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // Canna
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * DPR;
      ctx.beginPath(); ctx.moveTo(wx(this.x), wy(this.y));
      ctx.lineTo(wx(this.x) + Math.cos(this.angle) * 20 * DPR, wy(this.y) + Math.sin(this.angle) * 20 * DPR); ctx.stroke();
    } else if (this.type === 'mine') {
      if (this.triggered) return;
      ctx.fillStyle = this.col; ctx.shadowBlur = 8; ctx.shadowColor = this.col;
      ctx.beginPath(); ctx.arc(wx(this.x), wy(this.y), 8 * DPR, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

export function placeTrapsinRooms(rooms, tileSize, rng, count = 5) {
  const traps = [];
  const usedRooms = [...rooms].sort(() => rng.next() - 0.5).slice(0, count);
  usedRooms.forEach((r) => {
    const types = Object.keys(TRAP_TYPES);
    const type = types[Math.floor(rng.next() * types.length)];
    const cx = (r.x + r.w / 2) * tileSize;
    const cy = (r.y + r.h / 2) * tileSize;
    const opts = type === 'laser' ? { endX: cx + 200, endY: cy } : { radius: 50 + rng.next() * 30 };
    traps.push(new Trap(type, cx, cy, opts));
  });
  return traps;
}
