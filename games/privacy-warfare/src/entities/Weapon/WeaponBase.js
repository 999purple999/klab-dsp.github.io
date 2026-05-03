// ─── WeaponBase v2.0 – Loadout Protocol ──────────────────────────────────────
// Full attachment, recoil-pattern, ammo-type, and progression architecture.
// All stats are 0-100 (higher = always better). handling=100 → fastest ADS.

export class WeaponBase {
  constructor(def) {
    this.id          = def.id          || 'unknown';
    this.name        = def.name        || 'Unknown';
    this.weaponClass = def.weaponClass || 'assault';
    this.description = def.description || '';
    this.col         = def.col         || '#BF00FF';
    this.unlockLevel = def.unlockLevel || 0;
    this.tag         = def.tag         || '';

    // Base stats (immutable reference for recalc)
    this._base = Object.freeze({
      damage:   def.stats?.damage   ?? 30,
      fireRate: def.stats?.fireRate ?? 50,   // 0-100 (100 = 1200 RPM)
      accuracy: def.stats?.accuracy ?? 65,
      range:    def.stats?.range    ?? 60,
      mobility: def.stats?.mobility ?? 80,
      control:  def.stats?.control  ?? 70,
      handling: def.stats?.handling ?? 70,   // 100 = instant ADS
    });
    this.stats = { ...this._base };

    // Recoil: array of {x, y} per-shot offsets on a ±10 unit scale
    this.recoilPattern = def.recoilPattern || [{x:0,y:-2},{x:0.5,y:-2.5},{x:1,y:-3}];
    this._shotIdx      = 0;
    this._recoilResetT = 0;

    // Ammo
    this._baseMag     = def.magazine || 30;
    this._baseReserve = def.reserve  || 90;
    this.magazine     = this._baseMag;
    this.reserve      = this._baseReserve;
    this.maxReserve   = this._baseReserve * 2;
    this.ammoTypes    = def.ammoTypes || ['standard'];
    this.currentAmmoType = 'standard';

    // Attachment slots (8)
    this.slots = {
      muzzle: null, barrel: null, optic: null, stock: null,
      underbarrel: null, magazine: null, rearGrip: null, weaponPerk: null,
    };
    this.uniqueAttachment = def.uniqueAttachment || null;

    // Fire state
    this._cdTimer  = 0;
    this.reloading = false;
    this._reloadT  = 0;

    // Progression
    this.level    = 1;
    this.xp       = 0;
    this._xpScale = 100;

    // Camo & challenges
    this.camo       = 'default';
    this.challenges = { headshots: 0, crouchKills: 0, longshots: 0, streaks: 0 };

    // Optional per-weapon draw function set by catalog
    this._renderFn = def.renderPreview || null;
  }

  // ── Attachment management ─────────────────────────────────────────────────
  equip(slot, attachment) {
    if (!(slot in this.slots)) return false;
    this.slots[slot] = attachment;
    this._recalc(); return true;
  }
  unequip(slot) { this.slots[slot] = null; this._recalc(); }

  _recalc() {
    const s = { ...this._base };
    for (const att of Object.values(this.slots)) {
      if (!att?.modifiers) continue;
      const m = att.modifiers;
      for (const k of Object.keys(s)) {
        if (m[k] !== undefined) {
          s[k] = (k === 'damage' || k === 'fireRate')
            ? s[k] + m[k]
            : Math.max(0, Math.min(100, s[k] + m[k]));
        }
      }
    }
    // Apply ammo modifiers
    // (handled externally; ammo effects fire on bullet creation)
    this.stats = s;
  }

  // ── Fire ─────────────────────────────────────────────────────────────────
  canFire() { return this._cdTimer <= 0 && !this.reloading && this.magazine > 0; }

  fire(ox, oy, tx, ty) {
    if (!this.canFire()) {
      if (this.magazine <= 0 && !this.reloading) this.reload();
      return null;
    }
    // fireRate 0-100 → RPM 60-1200 → cd in seconds
    const rpm    = 60 + this.stats.fireRate * 11.4;
    this._cdTimer = 60 / rpm;
    this.magazine = Math.max(0, this.magazine - 1);

    const recoil  = this._getRecoil();
    this._shotIdx++;
    this._recoilResetT = 0.7;

    // accuracy 0-100 → spread 0-0.22 radians
    const spread = ((100 - this.stats.accuracy) / 100) * 0.22;
    const dx = tx - ox, dy = ty - oy;
    const a  = Math.atan2(dy, dx)
             + (Math.random() - 0.5) * spread
             + recoil.x * 0.015;
    const spd = 280 + this.stats.range * 2.5;

    return {
      x: ox, y: oy,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      dmg: this.stats.damage, range: this.stats.range,
      dist: 0, col: this.col, sz: 4, alive: true,
      ammoType: this.currentAmmoType,
      weaponId: this.id,
    };
  }

  _getRecoil() {
    const p   = this.recoilPattern;
    if (!p.length) return { x: 0, y: 0 };
    const idx = Math.min(this._shotIdx, p.length - 1);
    const cf  = this.stats.control / 100;   // 0-1 damping
    return {
      x: p[idx].x * (1 - cf * 0.5) + (Math.random() - 0.5) * 0.5,
      y: p[idx].y * (1 - cf * 0.4) + (Math.random() - 0.5) * 0.3,
    };
  }

  getDamageAtDistance(meters) {
    const eff = this.stats.range * 0.55;          // effective range in game-meters
    if (meters <= eff) return this.stats.damage;
    return this.stats.damage * Math.max(0.25, 1 - (meters - eff) / (eff * 2.5));
  }

  // ── Reload ───────────────────────────────────────────────────────────────
  reload() {
    if (this.reloading || this.magazine >= this._baseMag || this.reserve <= 0) return;
    this.reloading = true;
    // handling 0-100 → reload 0.5s-2.5s
    this._reloadT  = 2.5 - (this.stats.handling / 100) * 2.0;
    this._shotIdx  = 0;
  }

  // ── Update ───────────────────────────────────────────────────────────────
  update(dt) {
    if (this._cdTimer     > 0) this._cdTimer -= dt;
    if (this._recoilResetT > 0) {
      this._recoilResetT -= dt;
      if (this._recoilResetT <= 0) this._shotIdx = 0;
    }
    if (this.reloading) {
      this._reloadT -= dt;
      if (this._reloadT <= 0) {
        const need = this._baseMag - this.magazine;
        const got  = Math.min(need, this.reserve);
        this.magazine += got; this.reserve -= got;
        this.reloading = false;
      }
    }
  }

  // ── Progression ──────────────────────────────────────────────────────────
  gainXP(amt) {
    if (this.level >= 50) return;
    this.xp += amt;
    while (this.xp >= this._xpScale && this.level < 50) {
      this.xp -= this._xpScale;
      this.level++;
      this._xpScale = Math.floor(this._xpScale * 1.12);
    }
  }

  getUnlockedAttachments(allAttachments) {
    return allAttachments.filter(a => a.unlockLevel <= this.level);
  }

  // ── Serialisation ────────────────────────────────────────────────────────
  toJSON() {
    return {
      id: this.id, level: this.level, xp: this.xp, camo: this.camo,
      challenges: { ...this.challenges },
      slots: Object.fromEntries(Object.entries(this.slots).map(([k,v])=>[k,v?.id||null])),
      ammoType: this.currentAmmoType,
    };
  }

  fromJSON(data, attachmentMap) {
    if (!data) return;
    this.level = data.level || 1;
    this.xp    = data.xp   || 0;
    this.camo  = data.camo || 'default';
    if (data.challenges) this.challenges = { ...data.challenges };
    if (data.slots && attachmentMap) {
      for (const [slot, id] of Object.entries(data.slots)) {
        if (id && attachmentMap[id]) this.slots[slot] = attachmentMap[id];
      }
      this._recalc();
    }
    this.currentAmmoType = data.ammoType || 'standard';
  }

  // ── Visual ───────────────────────────────────────────────────────────────
  renderPreview(ctx, w, h) {
    if (this._renderFn) { this._renderFn(ctx, w, h, this.col, this.slots); return; }
    drawWeaponShape(ctx, w, h, this.weaponClass, this.col);
  }
}

// ── Shared procedural weapon drawing ─────────────────────────────────────────
export function drawWeaponShape(ctx, w, h, weaponClass, col = '#BF00FF') {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  const fn = {
    assault:  _ar,  smg: _smg,  shotgun: _sg,  lmg: _lmg,
    sniper:   _snp, marksman: _mrk, pistol: _pst, launcher: _lnc,
    special:  _ar,  bow: _bow,
  }[weaponClass] || _ar;
  fn(ctx, w, h, col);
  ctx.restore();
}

const _rrect = (ctx, x, y, w, h, r = 4) => {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
};
const _glow = (ctx, col, b) => { ctx.shadowBlur = b; ctx.shadowColor = col; };
const _ng   = ctx => { ctx.shadowBlur = 0; };

function _ar(ctx, w, h, col) {
  const g = ctx.createLinearGradient(0,h*0.35,0,h*0.65);
  g.addColorStop(0,'#1E1E32'); g.addColorStop(1,'#111120');
  ctx.fillStyle = g; _rrect(ctx, w*0.12, h*0.38, w*0.72, h*0.24, 5); ctx.fill();
  ctx.fillStyle = '#0A0A1A'; _rrect(ctx, w*0.76, h*0.43, w*0.2, h*0.14, 3); ctx.fill();
  ctx.fillStyle = '#0D0D20'; _rrect(ctx, w*0.28, h*0.62, w*0.14, h*0.22, 3); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; _glow(ctx, col, 10);
  ctx.beginPath(); ctx.moveTo(w*0.2, h*0.5); ctx.lineTo(w*0.6, h*0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.38, h*0.38); ctx.lineTo(w*0.38, h*0.62); ctx.stroke();
  ctx.fillStyle = col; _glow(ctx, col, 16);
  ctx.beginPath(); ctx.arc(w*0.3, h*0.3, 4, 0, Math.PI*2); ctx.fill(); _ng(ctx);
}
function _smg(ctx, w, h, col) {
  const g = ctx.createLinearGradient(0,h*0.38,0,h*0.62);
  g.addColorStop(0,'#1E1E32'); g.addColorStop(1,'#111120');
  ctx.fillStyle = g; _rrect(ctx, w*0.18, h*0.38, w*0.56, h*0.24, 5); ctx.fill();
  ctx.fillStyle = '#0A0A1A'; _rrect(ctx, w*0.66, h*0.43, w*0.16, h*0.14, 3); ctx.fill();
  ctx.fillStyle = '#0D0D20'; _rrect(ctx, w*0.32, h*0.62, w*0.12, h*0.18, 3); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; _glow(ctx, col, 10);
  ctx.beginPath(); ctx.moveTo(w*0.24, h*0.5); ctx.lineTo(w*0.58, h*0.5); ctx.stroke(); _ng(ctx);
}
function _sg(ctx, w, h, col) {
  const g = ctx.createLinearGradient(0,h*0.36,0,h*0.64);
  g.addColorStop(0,'#221A1A'); g.addColorStop(1,'#130E0E');
  ctx.fillStyle = g; _rrect(ctx, w*0.14, h*0.36, w*0.62, h*0.28, 5); ctx.fill();
  ctx.fillStyle = '#0A0A1A'; _rrect(ctx, w*0.68, h*0.42, w*0.16, h*0.16, 3); ctx.fill();
  ctx.fillStyle = '#1A1010'; _rrect(ctx, w*0.26, h*0.52, w*0.2, h*0.12, 3); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; _glow(ctx, col, 10);
  ctx.beginPath(); ctx.moveTo(w*0.2, h*0.5); ctx.lineTo(w*0.62, h*0.5); ctx.stroke(); _ng(ctx);
}
function _lmg(ctx, w, h, col) {
  const g = ctx.createLinearGradient(0,h*0.38,0,h*0.62);
  g.addColorStop(0,'#1A1A2E'); g.addColorStop(1,'#0E0E1E');
  ctx.fillStyle = g; _rrect(ctx, w*0.06, h*0.39, w*0.82, h*0.22, 5); ctx.fill();
  ctx.fillStyle = '#0A0A1A'; _rrect(ctx, w*0.8, h*0.43, w*0.16, h*0.14, 3); ctx.fill();
  // drum mag
  ctx.fillStyle = '#0A0A1E'; ctx.beginPath(); ctx.arc(w*0.28, h*0.72, h*0.14, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; _glow(ctx, col, 10);
  ctx.beginPath(); ctx.arc(w*0.28, h*0.72, h*0.14, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.12, h*0.5); ctx.lineTo(w*0.72, h*0.5); ctx.stroke(); _ng(ctx);
}
function _snp(ctx, w, h, col) {
  const g = ctx.createLinearGradient(0,h*0.42,0,h*0.58);
  g.addColorStop(0,'#1A1A2E'); g.addColorStop(1,'#0E0E1E');
  ctx.fillStyle = g; _rrect(ctx, w*0.06, h*0.43, w*0.88, h*0.14, 4); ctx.fill();
  ctx.fillStyle = '#0A0A1A'; _rrect(ctx, w*0.72, h*0.45, w*0.24, h*0.1, 2); ctx.fill();
  // scope
  ctx.fillStyle = '#0E0E20'; _rrect(ctx, w*0.36, h*0.24, w*0.24, h*0.2, 5); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; _glow(ctx, col, 14);
  ctx.strokeRect(w*0.36, h*0.24, w*0.24, h*0.2);
  ctx.beginPath(); ctx.moveTo(w*0.48, h*0.24); ctx.lineTo(w*0.48, h*0.44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.36, h*0.34); ctx.lineTo(w*0.6, h*0.34); ctx.stroke(); _ng(ctx);
}
function _mrk(ctx, w, h, col) {
  const g = ctx.createLinearGradient(0,h*0.41,0,h*0.59);
  g.addColorStop(0,'#1A1A2E'); g.addColorStop(1,'#0E0E1E');
  ctx.fillStyle = g; _rrect(ctx, w*0.1, h*0.41, w*0.78, h*0.18, 4); ctx.fill();
  ctx.fillStyle = '#0A0A1A'; _rrect(ctx, w*0.78, h*0.44, w*0.16, h*0.12, 2); ctx.fill();
  ctx.fillStyle = '#0E0E20'; _rrect(ctx, w*0.42, h*0.26, w*0.2, h*0.16, 4); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; _glow(ctx, col, 12);
  ctx.strokeRect(w*0.42, h*0.26, w*0.2, h*0.16);
  ctx.beginPath(); ctx.moveTo(w*0.2, h*0.5); ctx.lineTo(w*0.7, h*0.5); ctx.stroke(); _ng(ctx);
}
function _pst(ctx, w, h, col) {
  const g = ctx.createLinearGradient(0,h*0.35,0,h*0.65);
  g.addColorStop(0,'#1E1E32'); g.addColorStop(1,'#111120');
  ctx.fillStyle = g; _rrect(ctx, w*0.28, h*0.3, w*0.34, h*0.28, 5); ctx.fill();
  ctx.fillStyle = '#0A0A1A'; _rrect(ctx, w*0.54, h*0.38, w*0.14, h*0.12, 2); ctx.fill();
  ctx.fillStyle = '#0D0D20'; _rrect(ctx, w*0.33, h*0.58, w*0.18, h*0.24, 4); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; _glow(ctx, col, 10);
  ctx.beginPath(); ctx.moveTo(w*0.34, h*0.44); ctx.lineTo(w*0.52, h*0.44); ctx.stroke(); _ng(ctx);
}
function _lnc(ctx, w, h, col) {
  const g = ctx.createLinearGradient(0,h*0.36,0,h*0.64);
  g.addColorStop(0,'#1A1A2E'); g.addColorStop(1,'#0E0E1E');
  ctx.fillStyle = g; _rrect(ctx, w*0.08, h*0.36, w*0.8, h*0.28, 10); ctx.fill();
  ctx.fillStyle = col + '44'; ctx.beginPath();
  ctx.arc(w*0.78, h*0.5, h*0.1, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 2; _glow(ctx, col, 18);
  ctx.beginPath(); ctx.arc(w*0.78, h*0.5, h*0.1, 0, Math.PI*2); ctx.stroke(); _ng(ctx);
}
function _bow(ctx, w, h, col) {
  ctx.strokeStyle = '#1A1A2E'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(w*0.5, h*0.5, h*0.35, -Math.PI*0.7, Math.PI*0.7); ctx.stroke();
  ctx.strokeStyle = col + '88'; ctx.lineWidth = 1; _glow(ctx, col, 8);
  ctx.beginPath(); ctx.moveTo(w*0.5, h*0.15); ctx.lineTo(w*0.5, h*0.85); ctx.stroke();
  ctx.strokeStyle = '#2A2A3E'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w*0.5, h*0.5); ctx.lineTo(w*0.88, h*0.5); ctx.stroke(); _ng(ctx);
}
