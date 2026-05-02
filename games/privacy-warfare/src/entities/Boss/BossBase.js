// ─── BossBase ─────────────────────────────────────────────────────────────────
// Abstract base class for all bosses. Standalone (no parent extends).

export class BossBase {
  constructor(x, y, wave) {
    this.x    = x;
    this.y    = y;
    this.wave = wave;

    this.phase     = 1;
    this.maxPhases = 2;

    this.hp    = 200 + wave * 30;
    this.maxHp = this.hp;

    this.sz  = 32;
    this.col = '#FF0055';

    this.vx = 0;
    this.vy = 0;

    this.attackTimer    = 0;
    this.attackCooldown = 2;

    this.statusEffects = [];

    this.alive    = true;
    this.enraged  = false;

    // generic timers / state
    this.hitFlash   = 0;
    this.angle      = 0;
    this.pts        = 600 + wave * 80;
  }

  // ─── Public update entry point ────────────────────────────────────────────────
  update(dt, player, projectiles, ctx) {
    if (!this.alive) return;
    this._checkEnrage();
    this._updateStatus(dt);
    this._move(dt, player);
    this._attack(dt, player, projectiles);
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.angle += dt * (this.enraged ? 1.6 : 0.9);
  }

  // ─── Enrage check ─────────────────────────────────────────────────────────────
  _checkEnrage() {
    if (!this.enraged && this.hp < this.maxHp * 0.3) {
      this.enraged = true;
      this.attackCooldown *= 0.6;
    }
  }

  // ─── Status effects ───────────────────────────────────────────────────────────
  _updateStatus(dt) {
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const fx = this.statusEffects[i];
      fx.t -= dt;
      if (fx.t <= 0) {
        this.statusEffects.splice(i, 1);
      }
    }
  }

  _hasStatus(type) {
    return this.statusEffects.some(s => s.type === type);
  }

  // ─── Movement (override in subclass) ─────────────────────────────────────────
  _move(dt, player) {
    // base: do nothing — subclass overrides
  }

  // ─── Attack (override in subclass) ───────────────────────────────────────────
  _attack(dt, player, projectiles) {
    // base: do nothing — subclass overrides
  }

  // ─── Damage handling ─────────────────────────────────────────────────────────
  takeDamage(dmg) {
    if (this._isPhased()) return;
    if (this._hasStatus('freeze')) return;
    this.hp -= dmg;
    this.hitFlash = 0.13;
    if (this.hp <= 0) {
      this.hp    = 0;
      this.alive = false;
    }
  }

  // Override to enable phase-immunity (e.g., DataSpectre while ghosting)
  _isPhased() {
    return false;
  }

  // ─── Status helpers ───────────────────────────────────────────────────────────
  applyFreeze(dur) {
    this.statusEffects.push({ type: 'freeze', t: dur });
  }

  applyVirus(dur) {
    this.statusEffects.push({ type: 'virus', t: dur });
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  /**
   * Base render: draws the boss body hexagon + HP bar.
   * Subclasses call super.render() then draw extras.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} camX
   * @param {number} camY
   * @param {number} DPR
   */
  render(ctx, camX, camY, DPR) {
    if (!this.alive) return;

    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;
    const sz = this.sz * DPR;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // Hit-flash override
    const col = this.hitFlash > 0 ? '#FFFFFF' : this.col;
    ctx.strokeStyle = col;
    ctx.lineWidth   = 3;
    ctx.shadowBlur  = this.hitFlash > 0 ? 60 : 40;
    ctx.shadowColor = this.hitFlash > 0 ? '#FFFFFF' : this.col;

    // Hexagon body
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * sz, Math.sin(a) * sz);
    }
    ctx.closePath();
    ctx.stroke();

    // Enraged inner ring
    if (this.enraged) {
      ctx.strokeStyle = '#FF4400';
      ctx.lineWidth   = 1.5;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * sz * 1.4, Math.sin(a) * sz * 1.4);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    ctx.shadowBlur = 0;

    // HP bar drawn in world space
    this._drawHealthBar(ctx, sx, sy, DPR);
  }

  /**
   * Draw an 80px-wide (scaled) HP bar above the boss.
   */
  _drawHealthBar(ctx, sx, sy, DPR) {
    const barW  = 80 * DPR;
    const barH  = 6 * DPR;
    const barX  = sx - barW / 2;
    const barY  = sy - this.sz * DPR - 16 * DPR;
    const pct   = Math.max(0, this.hp / this.maxHp);
    const hcol  = pct > 0.5 ? this.col : (pct > 0.25 ? '#FF8800' : '#FF2200');

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle   = hcol;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = hcol;
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.shadowBlur = 0;

    // Phase indicator dots
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const phaseX  = barX + barW * (0.3 * (this.maxPhases - 1));
    ctx.fillRect(phaseX, barY, 1.5, barH);

    // Boss label
    ctx.fillStyle    = 'rgba(255,120,120,0.85)';
    ctx.font         = `${7 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      `${this.constructor.name.toUpperCase()}  P${this.phase}  ${Math.ceil(this.hp)} HP`,
      sx, barY - 2 * DPR
    );
  }

  // ─── Convenience: fire projectile toward player ───────────────────────────────
  _fireAt(player, projectiles, spd, radius, col, extra) {
    const dx = player.px - this.x;
    const dy = player.py - this.y;
    const d  = Math.hypot(dx, dy) || 1;
    projectiles.push(Object.assign({
      x: this.x, y: this.y,
      vx: (dx / d) * spd,
      vy: (dy / d) * spd,
      r: radius, col, life: 4,
    }, extra || {}));
  }

  // ─── Radial burst ────────────────────────────────────────────────────────────
  _fireRadial(count, projectiles, spd, radius, col, angleOffset, extra) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (angleOffset || 0);
      projectiles.push(Object.assign({
        x: this.x, y: this.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: radius, col, life: 3.5,
      }, extra || {}));
    }
  }

  // ─── Circle orbit helper ─────────────────────────────────────────────────────
  _orbitPlayer(dt, player, radius, spd) {
    const dx      = player.px - this.x;
    const dy      = player.py - this.y;
    const dist    = Math.hypot(dx, dy) || 1;
    const targetX = player.px - (dx / dist) * radius;
    const targetY = player.py - (dy / dist) * radius;
    const tx      = targetX - this.x;
    const ty      = targetY - this.y;
    const td      = Math.hypot(tx, ty) || 1;
    this.vx += (tx / td * spd - this.vx) * Math.min(1, 3 * dt);
    this.vy += (ty / td * spd - this.vy) * Math.min(1, 3 * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}
