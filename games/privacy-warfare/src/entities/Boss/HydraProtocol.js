// ─── HydraProtocol ────────────────────────────────────────────────────────────
// Boss 7. Theme: 5-headed hydra — each head fires a different elemental attack.
// Phase 1: cycles through 5 heads sequentially.
// Phase 2 (enraged): all heads attack simultaneously on every other cycle.

import { BossBase } from './BossBase.js';

const HEADS = [
  { col: '#FF2200', name: 'FIRE',    atk: 'radial' },
  { col: '#00FFFF', name: 'ICE',     atk: 'freeze' },
  { col: '#00FF41', name: 'TOXIC',   atk: 'spread' },
  { col: '#FFFF00', name: 'SHOCK',   atk: 'chain'  },
  { col: '#FF00FF', name: 'VOID',    atk: 'burst'  },
];

export class HydraProtocol extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#AA00CC';
    this.sz  = 34;
    this.hp  = 240 + wave * 35;
    this.maxHp = this.hp;
    this.attackCooldown = 2.2;
    this.attackTimer    = 2;
    this._headIdx       = 0;
    this._cycle         = 0;
  }

  _move(dt, player) {
    this._orbitPlayer(dt, player, 230, 80);
  }

  _attack(dt, player, projectiles) {
    this.attackTimer -= dt;
    if (this.attackTimer > 0) return;
    this.attackTimer = this.enraged ? 1.3 : this.attackCooldown;

    if (this.enraged && this._cycle % 2 === 0) {
      // All heads at once
      HEADS.forEach((h, i) => this._fireHead(h, i, player, projectiles));
    } else {
      this._fireHead(HEADS[this._headIdx], this._headIdx, player, projectiles);
      this._headIdx = (this._headIdx + 1) % HEADS.length;
    }
    this._cycle++;
  }

  _fireHead(head, idx, player, projectiles) {
    const angle = (idx / HEADS.length) * Math.PI * 2 + this.angle;
    const ox = this.x + Math.cos(angle) * 28;
    const oy = this.y + Math.sin(angle) * 28;
    switch (head.atk) {
      case 'radial':
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2;
          projectiles.push({ x: ox, y: oy, vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, r: 6, col: head.col, life: 3.5 });
        }
        break;
      case 'freeze': {
        const dx = player.px - ox, dy = player.py - oy, d = Math.hypot(dx, dy) || 1;
        projectiles.push({ x: ox, y: oy, vx: dx / d * 130, vy: dy / d * 130, r: 8, col: head.col, life: 4, freeze: true });
        break;
      }
      case 'spread':
        for (let a = -0.45; a <= 0.46; a += 0.225) {
          const dx = player.px - ox, dy = player.py - oy, d = Math.hypot(dx, dy) || 1;
          const c = Math.cos(a), s = Math.sin(a);
          const bx = dx / d * c - dy / d * s, by = dx / d * s + dy / d * c;
          projectiles.push({ x: ox, y: oy, vx: bx * 155, vy: by * 155, r: 5, col: head.col, life: 3 });
        }
        break;
      case 'chain': {
        const dx = player.px - ox, dy = player.py - oy, d = Math.hypot(dx, dy) || 1;
        projectiles.push({ x: ox, y: oy, vx: dx / d * 200, vy: dy / d * 200, r: 7, col: head.col, life: 3.5 });
        break;
      }
      case 'burst':
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * Math.PI * 2 + this.angle;
          projectiles.push({ x: ox, y: oy, vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, r: 5, col: head.col, life: 4 });
        }
        break;
    }
  }

  render(ctx, camX, camY, DPR) {
    super.render(ctx, camX, camY, DPR);
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;
    const sz = this.sz * DPR;
    // Draw 5 head appendages
    HEADS.forEach((h, i) => {
      const angle = (i / HEADS.length) * Math.PI * 2 + this.angle;
      const hx = sx + Math.cos(angle) * sz * 1.1;
      const hy = sy + Math.sin(angle) * sz * 1.1;
      const active = i === this._headIdx;
      ctx.save();
      ctx.shadowBlur = active ? 22 : 8; ctx.shadowColor = h.col;
      ctx.fillStyle = active ? h.col : h.col + '66';
      ctx.beginPath(); ctx.arc(hx, hy, (active ? 9 : 6) * DPR, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }
}
