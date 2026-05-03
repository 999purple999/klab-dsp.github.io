// ─── PrivacyEater ─────────────────────────────────────────────────────────────
// Boss 10. Theme: data vacuum — absorbs bullets, erases floor zones, dilates time.
// Phase 1: absorb mode (2s immune, re-fires absorbed shots), drops corruption zones.
// Phase 2 (enraged): time dilation pulse slows player, nova from stored energy.

import { BossBase } from './BossBase.js';

export class PrivacyEater extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#FF0088';
    this.sz  = 36;
    this.hp  = 300 + wave * 45;
    this.maxHp = this.hp;
    this.attackCooldown = 3;
    this.attackTimer    = 2;

    this._absorbTimer   = 0;       // countdown while absorbing
    this._absorbCd      = 5;       // cooldown between absorb windows
    this._absorbing     = false;
    this._stored        = 0;       // shots stored during absorb
    this._zoneTimer     = 8;       // drop corruption zone every N seconds
    this._dilateTimer   = 10;      // time dilation pulse (enraged)
    this._dilateFlash   = 0;
    this._pulseR        = 0;
    this._pulseActive   = false;
  }

  // Called by GameScene when a projectile hits this boss during absorb mode
  absorbProjectile() {
    if (!this._absorbing) return false;
    this._stored++;
    return true; // signal to caller: destroy the bullet, don't deal dmg
  }

  _isPhased() {
    return this._absorbing;
  }

  _move(dt, player) {
    this._orbitPlayer(dt, player, 240, 80);

    // Absorb cycle
    if (!this._absorbing) {
      this._absorbTimer -= dt;
      if (this._absorbTimer <= 0) {
        this._absorbing = true;
        this._stored    = 0;
        this._absorbTimer = this.enraged ? 1.5 : 2.2;
      }
    } else {
      this._absorbTimer -= dt;
      if (this._absorbTimer <= 0) {
        this._absorbing = false;
        this._absorbTimer = this._absorbCd * (this.enraged ? 0.7 : 1);
      }
    }

    // Corruption zone drop
    this._zoneTimer -= dt;
    if (this._zoneTimer <= 0) {
      this._zoneTimer = this.enraged ? 5 : 8;
      // Signal to GameScene via a special marker projectile (zone-drop)
      // We piggyback on the projectiles array in _attack; handled there.
      this._dropZoneFlag = true;
    }

    // Time dilation pulse (enraged only)
    if (this.enraged) {
      this._dilateTimer -= dt;
      if (this._dilateTimer <= 0 && !this._pulseActive) {
        this._dilateTimer   = 12;
        this._pulseActive   = true;
        this._pulseR        = 0;
        this._dilateFlash   = 0.5;
      }
      if (this._pulseActive) {
        this._pulseR += 380 * dt;
        this._dilateFlash -= dt;
        if (this._pulseR > 500) this._pulseActive = false;
      }
    }
  }

  _attack(dt, player, projectiles) {
    this.attackTimer -= dt;
    if (this.attackTimer > 0 && !this._dropZoneFlag) return;

    if (this._dropZoneFlag) {
      this._dropZoneFlag = false;
      // Zone drop encoded as a special projectile with type='zone'
      projectiles.push({ x: this.x, y: this.y, vx: 0, vy: 0, r: 0, col: '#8800CC', life: 0.01, zone: true });
    }

    if (this.attackTimer > 0) return;
    this.attackTimer = this.enraged ? 1.8 : this.attackCooldown;

    // Release stored energy as radial burst
    const burstCount = Math.max(8, this._stored * 3);
    const capped     = Math.min(burstCount, this.enraged ? 28 : 20);
    this._fireRadial(capped, projectiles, 165, 7, '#FF4488', this.angle);

    // Aimed shot always
    this._fireAt(player, projectiles, 190, 8, '#FF00CC');

    this._stored = 0;
  }

  render(ctx, camX, camY, DPR) {
    if (!this.alive) return;
    const sx = (this.x - camX) * DPR;
    const sy = (this.y - camY) * DPR;
    const sz = this.sz * DPR;

    // Time dilation pulse ring
    if (this._pulseActive && this._pulseR > 0) {
      ctx.save();
      ctx.strokeStyle = '#FF00CC';
      ctx.lineWidth   = 3;
      ctx.globalAlpha = Math.max(0, 1 - this._pulseR / 500);
      ctx.shadowBlur  = 20; ctx.shadowColor = '#FF00CC';
      ctx.beginPath(); ctx.arc(sx, sy, this._pulseR * DPR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Body: concentric ovals + rotating ring
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);
    const col = this.hitFlash > 0 ? '#FFFFFF' : this.col;

    // Outer ring spikes
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.strokeStyle = col + (this._absorbing ? 'FF' : '88');
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 14; ctx.shadowColor = col;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * sz, Math.sin(a) * sz);
      ctx.lineTo(Math.cos(a) * sz * 1.55, Math.sin(a) * sz * 1.55);
      ctx.stroke();
    }

    // Main oval
    ctx.beginPath();
    ctx.ellipse(0, 0, sz, sz * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = col + '18';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth   = 2.5;
    ctx.shadowBlur  = this._absorbing ? 50 : 30;
    ctx.stroke();

    // Absorb mode inner pulse
    if (this._absorbing) {
      ctx.fillStyle   = '#FF44AA44';
      ctx.shadowBlur  = 40; ctx.shadowColor = '#FF44AA';
      ctx.beginPath(); ctx.arc(0, 0, sz * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.font        = `${7 * DPR}px monospace`;
      ctx.fillStyle   = '#FFFFFF';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ABSORB', 0, 0);
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    this._drawHealthBar(ctx, sx, sy, DPR);
  }
}
