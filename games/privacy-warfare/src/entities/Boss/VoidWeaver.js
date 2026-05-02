// ─── VoidWeaver ───────────────────────────────────────────────────────────────
// Boss 4. Theme: creates voids (gravitational pull zones).
// Spawns voidZones periodically; fires slow black orbs that explode into void zones.

import { BossBase } from './BossBase.js';

export class VoidWeaver extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#880088';
    this.sz  = 32;
    this.hp  = 210 + wave * 31;
    this.maxHp = this.hp;

    this.attackCooldown  = 2.8;
    this._voidSpawnTimer = 3;
    this._voidSpawnCD    = 3;
    this.voidZones       = [];
    this._voidOrbs       = [];     // slow moving projectiles

    this._moveSpd  = 80 + wave * 5;
    this._maxVoids = 3;

    this.phase = 1;
  }

  _move(dt, player) {
    // Drifts around player at mid range
    this._orbitPlayer(dt, player, 220, this._moveSpd);

    // Update void zones
    for (let i = this.voidZones.length - 1; i >= 0; i--) {
      const vz = this.voidZones[i];
      vz.duration -= dt;
      // Pull player toward void center
      const dx   = vz.x - player.px;
      const dy   = vz.y - player.py;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < vz.radius) {
        const force = vz.force * dt;
        // Apply force to player (if player exposes px/py as writeable)
        player.px += (dx / dist) * force;
        player.py += (dy / dist) * force;
      }
      if (vz.duration <= 0) this.voidZones.splice(i, 1);
    }

    // Update void orbs
    for (let i = this._voidOrbs.length - 1; i >= 0; i--) {
      const orb = this._voidOrbs[i];
      orb.x    += orb.vx * dt;
      orb.y    += orb.vy * dt;
      orb.life -= dt;
      if (orb.life <= 0) {
        this._explodeOrb(orb);
        this._voidOrbs.splice(i, 1);
      }
    }
  }

  _attack(dt, player, projectiles) {
    // Phase 2 check
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase           = 2;
      this.attackCooldown  = 1.4;
      this._voidSpawnCD    = 2;
      this._maxVoids       = 3;  // keep cap but faster spawn
    }

    // Void zone spawn
    this._voidSpawnTimer -= dt;
    if (this._voidSpawnTimer <= 0 && this.voidZones.length < this._maxVoids) {
      this._voidSpawnTimer = this._voidSpawnCD;
      // Spawn a void zone near player
      const angle  = Math.random() * Math.PI * 2;
      const spread = 120 + Math.random() * 80;
      this.voidZones.push({
        x:        player.px + Math.cos(angle) * spread,
        y:        player.py + Math.sin(angle) * spread,
        radius:   this.phase >= 2 ? 120 : 80,
        duration: 4,
        force:    200,
      });
    }

    // Fire void orbs
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      this._spawnVoidOrb(player, projectiles);
    }
  }

  _spawnVoidOrb(player, projectiles) {
    const dx  = player.px - this.x;
    const dy  = player.py - this.y;
    const d   = Math.hypot(dx, dy) || 1;
    const spd = 65;
    this._voidOrbs.push({
      x: this.x, y: this.y,
      vx: (dx / d) * spd,
      vy: (dy / d) * spd,
      life: 3,
      r: 10,
    });
  }

  _explodeOrb(orb) {
    // Explode into 4 void zones around orb position
    if (this.voidZones.length >= this._maxVoids + 2) return; // cap total
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const d = 60;
      this.voidZones.push({
        x:        orb.x + Math.cos(a) * d,
        y:        orb.y + Math.sin(a) * d,
        radius:   this.phase >= 2 ? 100 : 70,
        duration: 2.5,
        force:    160,
      });
    }
  }

  render(ctx, camX, camY, DPR) {
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;

    // Draw void zones (gravitational hazards)
    for (const vz of this.voidZones) {
      const vzx  = (vz.x - camX) * DPR;
      const vzy  = (vz.y - camY) * DPR;
      const vzr  = vz.radius * DPR;
      const alpha = Math.min(1, vz.duration / 1.5);

      const g = ctx.createRadialGradient(vzx, vzy, 0, vzx, vzy, vzr);
      g.addColorStop(0, 'rgba(80,0,80,0.7)');
      g.addColorStop(0.5, 'rgba(40,0,40,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle   = g;
      ctx.beginPath();
      ctx.arc(vzx, vzy, vzr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(200,0,200,0.4)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(vzx, vzy, vzr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Draw void orbs
    for (const orb of this._voidOrbs) {
      const ox  = (orb.x - camX) * DPR;
      const oy  = (orb.y - camY) * DPR;
      const or2 = orb.r * DPR;

      ctx.save();
      ctx.fillStyle   = '#220022';
      ctx.strokeStyle = '#880088';
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 20;
      ctx.shadowColor = '#880088';
      ctx.beginPath();
      ctx.arc(ox, oy, or2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Boss body
    super.render(ctx, camX, camY, DPR);

    // Void spiral decoration
    ctx.save();
    ctx.translate(sx, sy);
    ctx.strokeStyle = 'rgba(200,0,200,0.35)';
    ctx.lineWidth   = 1.2;
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 4; t += 0.15) {
      const r = (t / (Math.PI * 4)) * this.sz * DPR * 0.9;
      const a = t + this.angle * 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      t < 0.16 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
}
