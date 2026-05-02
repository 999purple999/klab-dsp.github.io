// ─── DataSpectre ──────────────────────────────────────────────────────────────
// Boss 2. Theme: data ghost — phases in/out, immune during phase, homing radials.

import { BossBase } from './BossBase.js';

export class DataSpectre extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#00FFAA';
    this.sz  = 28;
    this.hp  = 190 + wave * 29;
    this.maxHp = this.hp;

    this.attackCooldown = 2.5;

    // Phase cycle: every 4s we toggle between visible (3 * cycle) and phased (1.5 * cycle)
    this._phaseCycleTimer  = 0;
    this._phaseCyclePeriod = 4;
    this._phaseDuration    = 1.5;
    this._phasing          = false;   // currently immune/invisible

    this._flickerAlpha = 1;
    this._moveSpd      = 110 + wave * 5;
  }

  // Phased = immune to damage
  _isPhased() {
    return this._phasing;
  }

  _updateStatus(dt) {
    super._updateStatus(dt);

    // Update phase cycle
    this._phaseCycleTimer += dt;
    const period = this._phaseCyclePeriod;
    if (this._phasing) {
      if (this._phaseCycleTimer >= this._phaseDuration) {
        this._phasing         = false;
        this._phaseCycleTimer = 0;
      }
    } else {
      if (this._phaseCycleTimer >= period - this._phaseDuration) {
        this._phasing         = true;
        this._phaseCycleTimer = 0;
      }
    }

    // Flicker alpha while phased
    if (this._phasing) {
      this._flickerAlpha = 0.12 + 0.1 * Math.sin(Date.now() / 80);
    } else {
      this._flickerAlpha = Math.min(1, this._flickerAlpha + dt * 4);
    }
  }

  _move(dt, player) {
    if (this._phasing) {
      // Drift slowly
      this.vx *= 0.96;
      this.vy *= 0.96;
    } else {
      // Chase player
      const dx = player.px - this.x;
      const dy = player.py - this.y;
      const d  = Math.hypot(dx, dy) || 1;
      this.vx += (dx / d * this._moveSpd - this.vx) * Math.min(1, 3 * dt);
      this.vy += (dy / d * this._moveSpd - this.vy) * Math.min(1, 3 * dt);
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  _attack(dt, player, projectiles) {
    if (this._phasing) return;  // no attacks while phased

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      const count = this.phase >= 2 ? 16 : 8;
      this._fireHomingRadial(count, player, projectiles);

      // Phase 2: teleport toward player
      if (this.phase >= 2) {
        const dx = player.px - this.x;
        const dy = player.py - this.y;
        const d  = Math.hypot(dx, dy) || 1;
        this.x += (dx / d) * 150;
        this.y += (dy / d) * 150;
      }
    }

    // Phase transition check
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase = 2;
      this.attackCooldown = 1.6;
      this._phaseCyclePeriod = 3;
    }
  }

  _fireHomingRadial(count, player, projectiles) {
    const baseAngle = Math.atan2(player.py - this.y, player.px - this.x);
    const spd       = 170 + this.wave * 4;
    for (let i = 0; i < count; i++) {
      const a    = (i / count) * Math.PI * 2;
      // Slight homing correction: blend radial angle toward player angle
      const blended = a * 0.8 + baseAngle * 0.2;
      projectiles.push({
        x: this.x, y: this.y,
        vx: Math.cos(blended) * spd,
        vy: Math.sin(blended) * spd,
        r: 5, col: this.col, life: 3.2,
        _homing: true,
        _target: player,
      });
    }
  }

  render(ctx, camX, camY, DPR) {
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;
    const sz = this.sz * DPR;

    ctx.save();
    ctx.globalAlpha = this._flickerAlpha;

    // Ghost body — layered rings
    const rings = this._phasing ? 3 : 2;
    for (let r = 0; r < rings; r++) {
      const scale = 1 + r * 0.3;
      const alpha = 0.4 - r * 0.12;
      ctx.save();
      ctx.globalAlpha = this._flickerAlpha * alpha;
      ctx.strokeStyle = this.col;
      ctx.lineWidth   = 1.5;
      ctx.shadowBlur  = 20;
      ctx.shadowColor = this.col;
      ctx.beginPath();
      ctx.arc(sx, sy, sz * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Core
    ctx.strokeStyle = this._phasing ? 'rgba(0,255,170,0.3)' : this.col;
    ctx.lineWidth   = 2.5;
    ctx.shadowBlur  = this._phasing ? 8 : 40;
    ctx.shadowColor = this.col;

    ctx.beginPath();
    // Eight-pointed star / data glyph
    for (let i = 0; i < 8; i++) {
      const a   = (i / 8) * Math.PI * 2 + this.angle;
      const r2  = i % 2 === 0 ? sz : sz * 0.5;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](
        sx + Math.cos(a) * r2,
        sy + Math.sin(a) * r2
      );
    }
    ctx.closePath();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.restore();

    // HP bar (only visible when not phased)
    if (!this._phasing) {
      this._drawHealthBar(ctx, sx, sy, DPR);
    }
  }
}
