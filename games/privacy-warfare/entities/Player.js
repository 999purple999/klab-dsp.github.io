// entities/Player.js — Player state, weapons, abilities, rendering

import { dist, clamp } from '../utils/math.js';
import { progression } from '../data/Progression.js';

// ── Weapon definitions ────────────────────────────────────────────────────
export const WPNS_DEFS = [
  { n: 'RSA PULSE',       col: '#BF00FF', rng: 170,  cd: 0.46,  dmg: 1,   t: 'pulse' },
  { n: 'AES BEAM',        col: '#00FFFF', rng: 265,  cd: 0.065, dmg: 0.32, t: 'beam' },
  { n: 'SHA SHREDDER',    col: '#00FF41', rng: 145,  cd: 0.82,  dmg: 2,   t: 'spread' },
  { n: 'QUANTUM SPLIT',   col: '#FF8C00', rng: 350,  cd: 1.25,  dmg: 2.5, t: 'split' },
  { n: 'MATRIX WAVE',     col: '#7FFF00', rng: 210,  cd: 1.9,   dmg: 1.5, t: 'wave' },
  { n: 'BLACK HOLE',      col: '#9900FF', rng: 0,    cd: 5.0,   dmg: 0,   t: 'blackhole' },
  { n: 'CHAIN LIGHTNING', col: '#FFFF00', rng: 210,  cd: 0.88,  dmg: 1.5, t: 'chain' },
  { n: 'CRYO RAY',        col: '#88FFFF', rng: 190,  cd: 0.58,  dmg: 0.5, t: 'cryo' },
  { n: 'NUKE STRIKE',     col: '#FF4400', rng: 0,    cd: 5.0,   dmg: 8,   t: 'nuke' },
  { n: 'VIRUS INJECT',    col: '#44FF00', rng: 160,  cd: 0.38,  dmg: 0.3, t: 'virus' },
];

const BASE_CD  = WPNS_DEFS.map(w => w.cd);
const BASE_DMG = WPNS_DEFS.map(w => w.dmg);
const BASE_RNG = WPNS_DEFS.map(w => w.rng);

export const SKINS = ['#BF00FF', '#00FFFF', '#FF2266', '#00FF41', '#FF8800'];

export const AB_BASE = { bomb: 12, kp: 25, dash: 3, overclock: 20, empshield: 18, timewarp: 15 };
export const AB_ICONS = { bomb: '💣', kp: '⚡', dash: '🡅', overclock: '⚙', empshield: '🛡', timewarp: '⌛' };

export class Player {
  constructor() {
    this.x = 0; this.y = 0;
    this.hp = 3; this.maxHp = 3;
    this.speed = 260;
    this.skinIdx = 0;
    this.wpnIdx = 0;
    this.wpns = WPNS_DEFS.map(w => ({ ...w }));
    this.wpnCDs = new Array(10).fill(0);

    this.ghostActive = false; this.ghostTimer = 0;
    this.invincible = 0;
    this.dashTimer = 0; this.dashVX = 0; this.dashVY = 0;
    this.dashTrail = [];

    this.overclockActive = false; this.overclockTimer = 0;
    this.empShieldActive = false; this.empShieldTimer = 0;
    this.timeWarpActive = false; this.timeWarpTimer = 0;
    this.empDisabledTimer = 0; // abilities disabled (teleporter boss)

    this.abCDs = { bomb: 0, kp: 0, dash: 0, overclock: 0, empshield: 0, timewarp: 0 };
    this.abilityCDMult = 1;

    // Skill bonuses applied each run
    this.ghostBonusTime = 0;
    this.comboDecayMult = 1;
    this.chainExtraTargets = 0;
    this.powerMult = 1;

    // Black hole state
    this.bhActive = false; this.bhTimer = 0; this.bhX = 0; this.bhY = 0;
    // Nuke state
    this.nukeCharging = false; this.nukeTimer = 0; this.nukeX = 0; this.nukeY = 0; this.nukeRad = 0;
    // Chain lightning
    this.chainSegs = []; this.chainLife = 0;
    // Wave ring
    this.waveRing = false; this.waveRingTimer = 0; this.waveRingX = 0; this.waveRingY = 0;
  }

  reset() {
    this.hp = 3 + progression.extraHP();
    this.maxHp = this.hp;
    this.speed = 260 * progression.speedMult();
    this.skinIdx = 0; this.wpnIdx = 0;
    this.wpns = WPNS_DEFS.map(w => ({ ...w }));
    this.wpnCDs.fill(0);
    this.ghostActive = false; this.invincible = 0;
    this.dashTimer = 0; this.dashTrail = [];
    this.overclockActive = false; this.empShieldActive = false;
    this.timeWarpActive = false; this.empDisabledTimer = 0;
    this.abCDs = { bomb: 0, kp: 0, dash: 0, overclock: 0, empshield: 0, timewarp: 0 };
    this.abilityCDMult = progression.cooldownMult();
    this.ghostBonusTime = 0; this.comboDecayMult = 1; this.chainExtraTargets = 0;
    this.powerMult = progression.damageMult();
    this.bhActive = false; this.nukeCharging = false; this.nukeRad = 0;
    this.chainSegs = []; this.waveRing = false;
  }

  abCD(k) { return AB_BASE[k] * this.abilityCDMult; }

  get currentWeapon() { return this.wpns[this.wpnIdx]; }

  setWpn(i) {
    this.wpnIdx = i;
  }

  // ── Update ───────────────────────────────────────────────────────────────
  update(dt, wMX, wMY, ww, wh, obstacles, betweenWaves) {
    const t = performance.now() / 1000;
    if (!betweenWaves) {
      // Dash movement
      if (this.dashTimer > 0) {
        this.dashTimer -= dt;
        this.x += this.dashVX * dt;
        this.y += this.dashVY * dt;
        this.dashTrail.push({ x: this.x, y: this.y, life: 0.22 });
      } else {
        const pdx = wMX - this.x, pdy = wMY - this.y;
        const pd = Math.hypot(pdx, pdy);
        if (pd > 8) {
          const sp = this.speed;
          this.x += pdx / pd * Math.min(pd, sp * dt);
          this.y += pdy / pd * Math.min(pd, sp * dt);
        }
      }

      // Dash trail decay
      for (let i = this.dashTrail.length - 1; i >= 0; i--) {
        this.dashTrail[i].life -= dt;
        if (this.dashTrail[i].life <= 0) this.dashTrail.splice(i, 1);
      }

      this.x = Math.max(10, Math.min(ww - 10, this.x));
      this.y = Math.max(10, Math.min(wh - 10, this.y));

      // Obstacle resolution
      for (const o of obstacles) {
        const cx = Math.max(o.x, Math.min(o.x + o.w, this.x));
        const cy = Math.max(o.y, Math.min(o.y + o.h, this.y));
        const dst = dist(this.x, this.y, cx, cy);
        if (dst < 14 && dst > 0) {
          const nx = (this.x - cx) / dst, ny = (this.y - cy) / dst;
          this.x = cx + nx * 15; this.y = cy + ny * 15;
        }
      }
    }

    // Cooldowns
    for (const k in this.abCDs) this.abCDs[k] = Math.max(0, this.abCDs[k] - dt);
    for (let i = 0; i < this.wpnCDs.length; i++) this.wpnCDs[i] = Math.max(0, this.wpnCDs[i] - dt);
    if (this.invincible > 0) this.invincible -= dt;
    if (this.empDisabledTimer > 0) this.empDisabledTimer -= dt;

    // Ability timers
    if (this.overclockActive) { this.overclockTimer -= dt; if (this.overclockTimer <= 0) this.overclockActive = false; }
    if (this.empShieldActive) {
      this.empShieldTimer -= dt;
      if (this.empShieldTimer <= 0) { this.empShieldActive = false; }
    }
    if (this.timeWarpActive) { this.timeWarpTimer -= dt; if (this.timeWarpTimer <= 0) this.timeWarpActive = false; }
    if (this.ghostActive) { this.ghostTimer -= dt; if (this.ghostTimer <= 0) this.ghostActive = false; }

    // Black hole
    if (this.bhActive) { this.bhTimer -= dt; if (this.bhTimer <= 0) this.bhActive = false; }

    // Nuke charging
    if (this.nukeCharging) {
      this.nukeTimer -= dt;
    }
    if (this.nukeRad > 0) {
      this.nukeRad += dt * 440;
      if (this.nukeRad > 540) this.nukeRad = 0;
    }

    // Chain + wave ring
    if (this.chainSegs.length) { this.chainLife -= dt; if (this.chainLife <= 0) this.chainSegs = []; }
    if (this.waveRing) { this.waveRingTimer -= dt; if (this.waveRingTimer <= 0) this.waveRing = false; }
  }

  // ── Abilities ─────────────────────────────────────────────────────────────
  canUseAbility() { return this.empDisabledTimer <= 0; }

  // Bomb is handled by GameScene directly for full access to systems.
  // This method just arms the cooldown.
  startBomb() {
    if (this.abCDs.bomb > 0 || !this.canUseAbility()) return false;
    this.abCDs.bomb = this.abCD('bomb');
    return true;
  }

  useKP() {
    if (this.abCDs.kp > 0 || !this.canUseAbility()) return false;
    this.abCDs.kp = this.abCD('kp');
    return true;
  }

  useDash(wMX, wMY) {
    if (this.abCDs.dash > 0 || this.dashTimer > 0 || !this.canUseAbility()) return false;
    this.abCDs.dash = this.abCD('dash');
    this.dashTimer = 0.35; this.invincible = 0.45; this.dashTrail = [];
    const dx = wMX - this.x, dy = wMY - this.y, d = Math.hypot(dx, dy) || 1;
    this.dashVX = dx / d * 720; this.dashVY = dy / d * 720;
    return true;
  }

  useOverclock() {
    if (this.abCDs.overclock > 0 || !this.canUseAbility()) return false;
    this.abCDs.overclock = this.abCD('overclock');
    this.overclockActive = true; this.overclockTimer = 4;
    this.wpnCDs.fill(0);
    return true;
  }

  useEmpShield() {
    if (this.abCDs.empshield > 0 || !this.canUseAbility()) return false;
    this.abCDs.empshield = this.abCD('empshield');
    this.empShieldActive = true; this.empShieldTimer = 5;
    return true;
  }

  useTimeWarp() {
    if (this.abCDs.timewarp > 0 || !this.canUseAbility()) return false;
    this.abCDs.timewarp = this.abCD('timewarp');
    this.timeWarpActive = true; this.timeWarpTimer = 2.5;
    return true;
  }

  applyEmpDisable(duration) {
    this.empDisabledTimer = Math.max(this.empDisabledTimer, duration);
  }

  // ── Damage / death ────────────────────────────────────────────────────────
  hurt() {
    if (this.invincible > 0 || this.ghostActive || this.empShieldActive) return false;
    this.hp--;
    this.invincible = 1.8 + this.ghostBonusTime;
    this.ghostActive = true;
    this.ghostTimer = this.invincible;
    return true;
  }

  isDead() { return this.hp <= 0; }

  // ── Fire ──────────────────────────────────────────────────────────────────
  /** Returns fire events array */
  tryFire(empToggle, weather, wMX, wMY, enemies, boss, powerMult) {
    if (empToggle && weather === 'EMP') return null;
    if (this.wpnCDs[this.wpnIdx] > 0) return null;
    this.wpnCDs[this.wpnIdx] = this.wpns[this.wpnIdx].cd;
    return this._fire(wMX, wMY, enemies, boss, powerMult);
  }

  _fire(wMX, wMY, enemies, boss, powerMult) {
    const w = this.wpns[this.wpnIdx];
    const pm = powerMult * (progression.hasCrit() && Math.random() < 0.15 ? 2 : 1);
    const dx = wMX - this.x, dy = wMY - this.y;
    const dist2 = Math.hypot(dx, dy) || 1;
    const ux = dx / dist2, uy = dy / dist2;
    const ev = { weaponType: w.t, beams: [], damages: [], specials: [] };

    if (w.t === 'pulse') {
      ev.beams.push({ x1: this.x, y1: this.y, x2: this.x + ux * w.rng, y2: this.y + uy * w.rng, col: w.col, life: 0.12, lw: 2.5 });
      this._hitDir(this.x, this.y, ux, uy, w.rng, w.dmg * pm, 16, enemies, boss, ev);
    } else if (w.t === 'beam') {
      ev.beams.push({ x1: this.x, y1: this.y, x2: this.x + ux * w.rng, y2: this.y + uy * w.rng, col: w.col, life: 0.09, lw: 4 });
      this._hitDir(this.x, this.y, ux, uy, w.rng, w.dmg * pm, 12, enemies, boss, ev);
    } else if (w.t === 'spread') {
      for (let a = -0.44; a <= 0.45; a += 0.22) {
        const c = Math.cos(a), s = Math.sin(a);
        const bx = ux * c - uy * s, by = ux * s + uy * c;
        ev.beams.push({ x1: this.x, y1: this.y, x2: this.x + bx * w.rng, y2: this.y + by * w.rng, col: w.col, life: 0.14, lw: 2 });
        this._hitDir(this.x, this.y, bx, by, w.rng, w.dmg * pm, 15, enemies, boss, ev);
      }
    } else if (w.t === 'split') {
      [-0.38, -0.19, 0, 0.19, 0.38].forEach(a => {
        const c = Math.cos(a), s = Math.sin(a);
        const bx = ux * c - uy * s, by = ux * s + uy * c;
        ev.beams.push({ x1: this.x, y1: this.y, x2: this.x + bx * w.rng, y2: this.y + by * w.rng, col: w.col, life: 0.16, lw: 2 });
        this._hitDir(this.x, this.y, bx, by, w.rng, w.dmg * pm, 14, enemies, boss, ev);
      });
    } else if (w.t === 'wave') {
      this.waveRing = true; this.waveRingTimer = 0.55;
      this.waveRingX = this.x; this.waveRingY = this.y;
      enemies.forEach(e => { if (dist(e.x, e.y, this.x, this.y) < w.rng) ev.damages.push({ target: e, dmg: w.dmg * pm, big: false }); });
      if (boss && dist(boss.x, boss.y, this.x, this.y) < w.rng) ev.damages.push({ target: boss, dmg: w.dmg * pm, big: false, isBoss: true });
      ev.specials.push({ type: 'burst', x: this.x, y: this.y, col: w.col, n: 16, spd: w.rng * 0.8 });
    } else if (w.t === 'blackhole') {
      this.bhActive = true; this.bhTimer = 2.4; this.bhX = wMX; this.bhY = wMY;
      ev.specials.push({ type: 'blackhole_start', x: wMX, y: wMY });
    } else if (w.t === 'chain') {
      const sorted = [...enemies].sort((a, b) => dist(a.x, a.y, wMX, wMY) - dist(b.x, b.y, wMX, wMY));
      const n = Math.min(5 + this.chainExtraTargets, sorted.length);
      this.chainSegs = []; this.chainLife = 0.5;
      let lx = this.x, ly = this.y;
      sorted.slice(0, n).forEach(t => {
        this.chainSegs.push({ x1: lx, y1: ly, x2: t.x, y2: t.y });
        lx = t.x; ly = t.y;
        ev.damages.push({ target: t, dmg: w.dmg * pm, big: false });
      });
      if (boss) {
        this.chainSegs.push({ x1: lx, y1: ly, x2: boss.x, y2: boss.y });
        ev.damages.push({ target: boss, dmg: w.dmg * 0.5 * pm, big: false, isBoss: true });
      }
    } else if (w.t === 'cryo') {
      ev.beams.push({ x1: this.x, y1: this.y, x2: this.x + ux * w.rng, y2: this.y + uy * w.rng, col: w.col, life: 0.38, lw: 6 });
      this._hitDir(this.x, this.y, ux, uy, w.rng, w.dmg * pm, 18, enemies, boss, ev, e => {
        e.frozen = 3.8; e.vx *= 0.08; e.vy *= 0.08;
        ev.specials.push({ type: 'burst', x: e.x, y: e.y, col: '#88FFFF', n: 5, spd: 25 });
      });
      if (boss && dist(boss.x, boss.y, this.x, this.y) < w.rng) boss.frozen = 1.6;
    } else if (w.t === 'nuke') {
      this.nukeCharging = true; this.nukeTimer = 2;
      this.nukeX = wMX; this.nukeY = wMY;
      ev.specials.push({ type: 'nuke_charging' });
    } else if (w.t === 'virus') {
      const t = enemies.find(e => dist(e.x, e.y, wMX, wMY) < e.sz + 14);
      if (t) { t.virus = 12; ev.damages.push({ target: t, dmg: w.dmg * pm, big: false }); }
      else if (boss && dist(boss.x, boss.y, wMX, wMY) < boss.sz + 22) boss.virus = 7;
    }

    return ev;
  }

  _hitDir(ox, oy, dirx, diry, rng, dmg, tol, enemies, boss, ev, onHit) {
    for (const e of enemies) {
      if (e.cloaking && Math.random() < 0.7) continue;
      const tx = e.x - ox, ty = e.y - oy;
      const proj = tx * dirx + ty * diry;
      if (proj < 0 || proj > rng) continue;
      const cx = ox + dirx * proj, cy = oy + diry * proj;
      if (dist(e.x, e.y, cx, cy) < e.sz + tol) {
        ev.damages.push({ target: e, dmg, big: false });
        if (onHit) onHit(e);
      }
    }
    if (boss) {
      const tx = boss.x - ox, ty = boss.y - oy;
      const proj = tx * dirx + ty * diry;
      if (proj >= 0 && proj <= rng) {
        const cx = ox + dirx * proj, cy = oy + diry * proj;
        if (dist(boss.x, boss.y, cx, cy) < boss.sz + tol) {
          ev.damages.push({ target: boss, dmg, big: false, isBoss: true });
          if (onHit) onHit(boss);
        }
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  render(ctx, camera, dpr, quality, t) {
    const plx = camera.wx(this.x, dpr), ply = camera.wy(this.y, dpr), ps = 12 * dpr;
    const glow = quality !== 'low';
    const pBlink = this.ghostActive && Math.floor(t * 10) % 2 === 0;
    ctx.globalAlpha = pBlink ? 0.22 : 1;
    const pCol = this.empShieldActive ? '#00FFFF' : SKINS[this.skinIdx];
    if (glow) { ctx.shadowBlur = this.empShieldActive ? 40 : 24; ctx.shadowColor = pCol; }
    ctx.fillStyle = pCol;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 - Math.PI / 6;
      ctx[i ? 'lineTo' : 'moveTo'](plx + Math.cos(a) * ps, ply + Math.sin(a) * ps);
    }
    ctx.closePath();
    ctx.fill();
    if (glow) ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Auras
    if (this.empShieldActive) {
      ctx.strokeStyle = 'rgba(0,255,255,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(plx, ply, (24 + this.empShieldTimer * 5) * dpr, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.overclockActive) {
      ctx.strokeStyle = 'rgba(255,255,0,0.35)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(plx, ply, (20 + Math.sin(t * 8) * 4) * dpr, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.timeWarpActive) {
      ctx.strokeStyle = 'rgba(180,100,255,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(plx, ply, (24 + this.timeWarpTimer * 6) * dpr, 0, Math.PI * 2); ctx.stroke();
    }

    // Dash trail
    for (const trail of this.dashTrail) {
      ctx.globalAlpha = trail.life / 0.22 * 0.45;
      ctx.fillStyle = SKINS[this.skinIdx];
      if (glow) { ctx.shadowBlur = 8; ctx.shadowColor = SKINS[this.skinIdx]; }
      const tlx = camera.wx(trail.x, dpr), tly = camera.wy(trail.y, dpr);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 - Math.PI / 6;
        ctx[i ? 'lineTo' : 'moveTo'](tlx + Math.cos(a) * 10 * dpr, tly + Math.sin(a) * 10 * dpr);
      }
      ctx.closePath(); ctx.fill();
      if (glow) ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }
}
