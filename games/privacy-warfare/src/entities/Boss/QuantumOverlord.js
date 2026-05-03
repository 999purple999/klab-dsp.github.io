// ─── QuantumOverlord ──────────────────────────────────────────────────────────
// Boss 9. Theme: quantum superposition — 3 copies, only the real one takes dmg.
// Phase 1: 3 orbiting copies, real one randomised every 4s, attacks from all 3.
// Phase 2 (enraged): all 3 become real simultaneously; dimension blink every 6s.

import { BossBase } from './BossBase.js';

export class QuantumOverlord extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#CC44FF';
    this.sz  = 30;
    this.hp  = 280 + wave * 42;
    this.maxHp = this.hp;
    this.attackCooldown = 2.6;
    this.attackTimer    = 1.5;

    this._realIdx      = 0;
    this._swapTimer    = 4;
    this._copies       = [
      { ox: 0, oy: -200 },
      { ox:  173, oy: 100 },
      { ox: -173, oy: 100 },
    ];
    this._blinkTimer   = 6;
    this._blinking     = false;
    this._blinkFlash   = 0;
  }

  _isPhased() {
    // Only phased during blink flash
    return this._blinking;
  }

  takeDamage(dmg, copyIdx) {
    // copyIdx must match _realIdx (or any when enraged)
    if (this._blinking) return;
    if (copyIdx !== undefined && !this.enraged && copyIdx !== this._realIdx) return;
    super.takeDamage(dmg);
  }

  _move(dt, player) {
    // Main body follows player slowly (hidden anchor)
    const dx = player.px - this.x, dy = player.py - this.y;
    const d  = Math.hypot(dx, dy) || 1;
    this.vx += (dx / d * 40 - this.vx) * Math.min(1, 2 * dt);
    this.vy += (dy / d * 40 - this.vy) * Math.min(1, 2 * dt);
    this.x += this.vx * dt; this.y += this.vy * dt;

    // Swap real copy
    this._swapTimer -= dt;
    if (this._swapTimer <= 0) {
      this._swapTimer = this.enraged ? 2.5 : 4;
      if (!this.enraged) {
        this._realIdx = (this._realIdx + 1) % 3;
      }
    }

    // Dimension blink (enraged only)
    if (this.enraged) {
      this._blinkTimer -= dt;
      if (this._blinkTimer <= 0 && !this._blinking) {
        this._blinking = true;
        this._blinkFlash = 0.6;
        this._blinkTimer = 6;
        setTimeout(() => {
          this._blinking = false;
        }, 600);
      }
      if (this._blinkFlash > 0) this._blinkFlash -= dt;
    }
  }

  _attack(dt, player, projectiles) {
    this.attackTimer -= dt;
    if (this.attackTimer > 0) return;
    this.attackTimer = this.enraged ? 1.5 : this.attackCooldown;

    const orbitR = 150;
    this._copies.forEach((c, i) => {
      const angle = (i / 3) * Math.PI * 2 + this.angle;
      const cx = this.x + Math.cos(angle) * orbitR;
      const cy = this.y + Math.sin(angle) * orbitR;

      const shouldFire = this.enraged || i === this._realIdx;
      if (!shouldFire) return;

      // Aimed shot toward player
      const dx = player.px - cx, dy = player.py - cy, d = Math.hypot(dx, dy) || 1;
      const spd = 170 + (this.enraged ? 40 : 0);
      projectiles.push({ x: cx, y: cy, vx: dx / d * spd, vy: dy / d * spd, r: 6, col: this.col, life: 3.5 });

      // Extra spiral on real copy
      if (i === this._realIdx) {
        const burst = this.enraged ? 10 : 6;
        for (let j = 0; j < burst; j++) {
          const a = (j / burst) * Math.PI * 2 + this.angle;
          projectiles.push({ x: cx, y: cy, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 5, col: '#FF88FF', life: 3 });
        }
      }
    });
  }

  render(ctx, camX, camY, DPR) {
    if (!this.alive) return;
    const orbitR = 150 * DPR;
    const flashAlpha = this._blinkFlash > 0 ? this._blinkFlash / 0.6 : 0;

    this._copies.forEach((c, i) => {
      const angle = (i / 3) * Math.PI * 2 + this.angle;
      const cx = (this.x - camX) * DPR + Math.cos(angle) * orbitR;
      const cy = (this.y - camY) * DPR + Math.sin(angle) * orbitR;
      const isReal = this.enraged || i === this._realIdx;
      const sz = this.sz * DPR * (isReal ? 1 : 0.78);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.angle * (i % 2 === 0 ? 1 : -1));
      ctx.globalAlpha = this._blinking ? 0.2 + flashAlpha * 0.8 : (isReal ? 1 : 0.38);
      ctx.strokeStyle = isReal ? this.col : this.col + '88';
      ctx.lineWidth   = isReal ? 2.5 : 1.5;
      ctx.shadowBlur  = isReal ? 30 : 10;
      ctx.shadowColor = this.col;
      // Diamond / rhombus body for copies
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.7, 0);
      ctx.lineTo(0, sz);
      ctx.lineTo(-sz * 0.7, 0);
      ctx.closePath();
      ctx.stroke();
      if (isReal) {
        ctx.fillStyle = this.col + '22';
        ctx.fill();
        // Inner dot marking it as real
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 18; ctx.shadowColor = '#FFFFFF';
        ctx.beginPath(); ctx.arc(0, 0, 4 * DPR, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      ctx.restore();
    });

    // HP bar + label via base (using screen coords of main body)
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;
    this._drawHealthBar(ctx, sx, sy, DPR);
  }
}
