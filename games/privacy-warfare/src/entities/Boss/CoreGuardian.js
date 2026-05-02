// ─── CoreGuardian ─────────────────────────────────────────────────────────────
// Boss 3. Theme: armored core with 3 orbiting shield orbs.
// Orbs intercept projectiles; all orbs must die before boss takes damage.
// Phase 2: orbs respawn one at a time; boss fires spread of 5 shots.

import { BossBase } from './BossBase.js';

const ORB_ORBIT_RADIUS = 80;
const ORB_SZ           = 10;
const ORB_OFFSETS      = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

export class CoreGuardian extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#FF8800';
    this.sz  = 36;
    this.hp  = 220 + wave * 32;
    this.maxHp = this.hp;

    this.attackCooldown = 2.2;

    this.shieldOrbs = this._createOrbs();
    this._orbRespawnTimer = 0;

    this._vulnerable = false; // only when all orbs dead

    this._moveSpd = 70 + wave * 4;
    this._orbAngle = 0;

    this.phase = 1;
  }

  _createOrbs() {
    return ORB_OFFSETS.map(offset => ({
      angle: offset,
      alive: true,
      radius: ORB_ORBIT_RADIUS,
      hitFlash: 0,
    }));
  }

  // Override: boss only takes damage when all orbs are dead
  takeDamage(dmg) {
    if (this._isPhased()) return;
    if (!this._vulnerable) return;
    super.takeDamage(dmg);
  }

  _isPhased() {
    return false;
  }

  /**
   * Check if a projectile (x, y, r) hits any shield orb.
   * Returns true and destroys the orb if hit.
   */
  checkOrbCollision(projX, projY, projR) {
    for (const orb of this.shieldOrbs) {
      if (!orb.alive) continue;
      const ox = this.x + Math.cos(orb.angle) * orb.radius;
      const oy = this.y + Math.sin(orb.angle) * orb.radius;
      const dx = projX - ox;
      const dy = projY - oy;
      if (Math.hypot(dx, dy) < projR + ORB_SZ) {
        orb.alive = false;
        return true;
      }
    }
    return false;
  }

  _updateVulnerability() {
    this._vulnerable = this.shieldOrbs.every(o => !o.alive);
  }

  _move(dt, player) {
    // Slow approach; keep some distance
    const dx   = player.px - this.x;
    const dy   = player.py - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const target = 180;
    if (dist > target + 20) {
      this.vx += (dx / dist * this._moveSpd - this.vx) * Math.min(1, 2.5 * dt);
      this.vy += (dy / dist * this._moveSpd - this.vy) * Math.min(1, 2.5 * dt);
    } else if (dist < target - 20) {
      this.vx += (-dx / dist * this._moveSpd * 0.5 - this.vx) * Math.min(1, 2.5 * dt);
      this.vy += (-dy / dist * this._moveSpd * 0.5 - this.vy) * Math.min(1, 2.5 * dt);
    } else {
      this.vx *= 0.94;
      this.vy *= 0.94;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Rotate orb angle
    this._orbAngle += dt * 1.1;
    for (const orb of this.shieldOrbs) {
      if (orb.alive) orb.angle += dt * 1.1;
      if (orb.hitFlash > 0) orb.hitFlash -= dt;
    }

    this._updateVulnerability();
  }

  _attack(dt, player, projectiles) {
    // Phase 2 check
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase = 2;
      this.attackCooldown = 1.5;
    }

    // Orb respawn in phase 2
    if (this.phase >= 2) {
      const deadOrb = this.shieldOrbs.find(o => !o.alive);
      if (deadOrb) {
        this._orbRespawnTimer -= dt;
        if (this._orbRespawnTimer <= 0) {
          deadOrb.alive     = true;
          deadOrb.hitFlash  = 0;
          this._orbRespawnTimer = 5;
          this._updateVulnerability();
        }
      }
    }

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      if (this.phase >= 2) {
        this._fireSpread(5, player, projectiles);
      } else {
        this._fireAt(player, projectiles, 160, 7, this.col);
      }
    }
  }

  _fireSpread(count, player, projectiles) {
    const baseAngle = Math.atan2(player.py - this.y, player.px - this.x);
    const spread    = 0.35;
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? (i / (count - 1) - 0.5) : 0;
      const a = baseAngle + t * spread * 2;
      const spd = 175 + this.wave * 3;
      projectiles.push({
        x: this.x, y: this.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 7, col: this.col, life: 3.5,
      });
    }
  }

  render(ctx, camX, camY, DPR) {
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;

    // Draw orbs
    for (const orb of this.shieldOrbs) {
      if (!orb.alive) continue;
      const ox  = sx + Math.cos(orb.angle) * ORB_ORBIT_RADIUS * DPR;
      const oy  = sy + Math.sin(orb.angle) * ORB_ORBIT_RADIUS * DPR;
      const ocol = orb.hitFlash > 0 ? '#FFFFFF' : '#FF8800';

      ctx.save();
      ctx.strokeStyle = ocol;
      ctx.fillStyle   = 'rgba(255,136,0,0.25)';
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = orb.hitFlash > 0 ? 40 : 18;
      ctx.shadowColor = ocol;
      ctx.beginPath();
      ctx.arc(ox, oy, ORB_SZ * DPR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Orbit trail line
      ctx.save();
      ctx.strokeStyle = 'rgba(255,136,0,0.15)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, ORB_ORBIT_RADIUS * DPR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Vulnerability indicator
    if (this._vulnerable) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,80,0,0.5)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(sx, sy, (this.sz + 8) * DPR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Base boss render
    super.render(ctx, camX, camY, DPR);

    // Armored hexagonal shell pattern
    const sz = this.sz * DPR;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle * 0.5);
    ctx.strokeStyle = this._vulnerable ? 'rgba(255,100,0,0.6)' : 'rgba(255,136,0,0.4)';
    ctx.lineWidth   = 1;
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI * 2;
      const a1 = ((i + 1) / 6) * Math.PI * 2;
      const mid = (a0 + a1) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a0) * sz * 0.6, Math.sin(a0) * sz * 0.6);
      ctx.lineTo(Math.cos(mid) * sz, Math.sin(mid) * sz);
      ctx.lineTo(Math.cos(a1) * sz * 0.6, Math.sin(a1) * sz * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
}
