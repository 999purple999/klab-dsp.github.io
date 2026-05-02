// ─── SystemAdmin ──────────────────────────────────────────────────────────────
// Boss 5 (final). Theme: admin god-mode — 3 phases, summons grunts, shotgun, EMP pulse.
// Phase 1: summons grunts every 5s (up to 6)
// Phase 2 (<50% HP): fast + shotgun spread 7 shots every 0.8s
// Phase 3 (enraged / <30% HP): BOTH + screen-wide EMP every 8s (disables player abilities 3s)

import { BossBase } from './BossBase.js';

export class SystemAdmin extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col       = '#FF2200';
    this.sz        = 38;
    this.hp        = 300 + wave * 40;
    this.maxHp     = this.hp;
    this.maxPhases = 3;

    this.attackCooldown = 1.3;
    this._moveSpd       = 100 + wave * 6;

    // Grunt summon
    this._summonTimer    = 5;
    this._summonCooldown = 5;
    this._summonedGrunts = 0;
    this._maxGrunts      = 6;
    this._summonCallback = null; // set by game to spawn grunts

    // EMP pulse (phase 3)
    this._empTimer      = 8;
    this._empCooldown   = 8;
    this._empCallback   = null; // set by game: (duration) => disables player abilities

    // Visual
    this._phase3Aura    = 0;
  }

  /**
   * Attach external callbacks so the boss can affect the game world.
   * @param {Function} summonCb - (x, y, wave) => void — spawns a grunt
   * @param {Function} empCb    - (duration) => void — disables player abilities
   */
  setCallbacks(summonCb, empCb) {
    this._summonCallback = summonCb;
    this._empCallback    = empCb;
  }

  _checkEnrage() {
    if (!this.enraged && this.hp < this.maxHp * 0.3) {
      this.enraged = true;
      this.phase   = 3;
      this.attackCooldown = 0.8;
      this._moveSpd       = 220;
    } else if (this.phase < 2 && this.hp < this.maxHp * 0.5) {
      this.phase = 2;
      this._moveSpd       = 180;
      this.attackCooldown = 0.8;
    }
  }

  _move(dt, player) {
    const dx   = player.px - this.x;
    const dy   = player.py - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Phase 2+ aggressively chases
    const desired = this.phase >= 2 ? 80 : 160;
    let spd = this._moveSpd;
    if (dist < desired) spd *= -0.5;

    this.vx += (dx / dist * spd - this.vx) * Math.min(1, (this.phase >= 2 ? 5 : 3) * dt);
    this.vy += (dy / dist * spd - this.vy) * Math.min(1, (this.phase >= 2 ? 5 : 3) * dt);
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
  }

  _attack(dt, player, projectiles) {
    this._checkEnrage();

    // Phase 1 & 3: summon grunts
    if (this.phase === 1 || this.phase === 3) {
      this._summonTimer -= dt;
      if (this._summonTimer <= 0 && this._summonedGrunts < this._maxGrunts) {
        this._summonTimer = this._summonCooldown;
        if (this._summonCallback) {
          const angle  = Math.random() * Math.PI * 2;
          const dist   = 80 + Math.random() * 60;
          this._summonCallback(
            this.x + Math.cos(angle) * dist,
            this.y + Math.sin(angle) * dist,
            this.wave
          );
          this._summonedGrunts++;
        }
      }
    }

    // Phase 2 & 3: shotgun attack
    if (this.phase >= 2) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = this.attackCooldown;
        this._fireShotgun(7, player, projectiles);
      }
    }

    // Phase 3: EMP pulse
    if (this.phase >= 3) {
      this._empTimer -= dt;
      if (this._empTimer <= 0) {
        this._empTimer = this._empCooldown;
        if (this._empCallback) this._empCallback(3);
        // Visual flash handled in render via _phase3Aura
        this._phase3Aura = 1.0;
      }
    }

    // Tick phase3 aura down
    if (this._phase3Aura > 0) {
      this._phase3Aura = Math.max(0, this._phase3Aura - dt * 1.5);
    }
  }

  _fireShotgun(count, player, projectiles) {
    const baseAngle = Math.atan2(player.py - this.y, player.px - this.x);
    const totalSpread = 0.7;
    for (let i = 0; i < count; i++) {
      const t   = count > 1 ? (i / (count - 1) - 0.5) : 0;
      const a   = baseAngle + t * totalSpread;
      const spd = 200 + Math.random() * 30 + this.wave * 4;
      projectiles.push({
        x: this.x, y: this.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 7, col: this.col, life: 3.2,
      });
    }
  }

  render(ctx, camX, camY, DPR) {
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;
    const sz = this.sz * DPR;

    // EMP pulse ring
    if (this._phase3Aura > 0.01) {
      ctx.save();
      ctx.globalAlpha = this._phase3Aura * 0.7;
      ctx.strokeStyle = '#FFDD00';
      ctx.lineWidth   = 3;
      ctx.shadowBlur  = 40;
      ctx.shadowColor = '#FFDD00';
      const empR = sz + (1 - this._phase3Aura) * 400 * DPR;
      ctx.beginPath();
      ctx.arc(sx, sy, empR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Phase 3 threat aura
    if (this.phase >= 3) {
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.1 * Math.sin(Date.now() / 120);
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sz * 2.5);
      g.addColorStop(0, 'rgba(255,34,0,0.6)');
      g.addColorStop(1, 'rgba(255,34,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, sz * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Base render
    super.render(ctx, camX, camY, DPR);

    // Admin badge layers
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle * (this.phase >= 2 ? 1.8 : 1));

    // Outer gear ring
    const teeth  = 12;
    const rInner = sz * 1.0;
    const rOuter = sz * 1.3;
    ctx.strokeStyle = this.phase >= 3 ? '#FF6600' : (this.phase >= 2 ? '#FF4400' : '#FF2200');
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 12;
    ctx.shadowColor = this.col;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? rOuter : rInner;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Phase label
    ctx.fillStyle    = 'rgba(255,100,50,0.9)';
    ctx.font         = `900 ${7 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`PHASE ${this.phase}`, sx, sy);
  }
}
