// ─── GameScene ────────────────────────────────────────────────────────────────
// Fat controller scene: owns ALL mutable game state and all game logic.
// Pure structural refactor of the original monolithic IIFE.

import { SFX, getAC } from '../audio/AudioManager.js';
import { MAPS, STARS, BLDGS, WEB_LINES, AMBIENT, OBSTACLES,
         buildMapAssets, buildObstacles, resolveObstaclePos } from '../mapgen/MapData.js';
import { WPNS, BASE_CD, BASE_DMG, BASE_RNG } from '../entities/Weapon/WeaponDefinitions.js';
import { setCameraState, wx, wy, onScreen, d2,
         camX as _camX, camY as _camY, lW as _lW, lH as _lH,
         WW as _WW, WH as _WH, DPR as _DPR } from '../rendering/Camera.js';
import * as Camera from '../rendering/Camera.js';
import { updateHpHud, setWpn, updateScore, updateCredits, showMsg, showStreak,
         updateWave, updateEnemyCount, updateWeather, updateAbilityUI,
         updateWeaponCD, updateCombo } from '../ui/HUD.js';
import { renderMM } from '../ui/MiniMap.js';
import { getHiScore, setHiScore } from '../data/Storage.js';

// ─── Player skins
const SKINS = ['#BF00FF', '#00FFFF', '#FF2266', '#00FF41', '#FF8800'];

// ─── Enemy definitions
const EDEFS = {
  normal:   { col: '#FF4444', sz: 12, hp: 1, spd: 65,  pts: 10  },
  elite:    { col: '#FF8800', sz: 15, hp: 2, spd: 82,  pts: 25  },
  phish:    { col: '#FF00FF', sz: 11, hp: 1, spd: 105, pts: 20  },
  shooter:  { col: '#FF6060', sz: 13, hp: 2, spd: 55,  pts: 35  },
  doppel:   { col: '#AAAAFF', sz: 13, hp: 2, spd: 78,  pts: 30  },
  cloaker:  { col: '#FF44FF', sz: 10, hp: 1, spd: 92,  pts: 40  },
  berser:   { col: '#FF2200', sz: 13, hp: 2, spd: 72,  pts: 35  },
  tank:     { col: '#996633', sz: 20, hp: 5, spd: 32,  pts: 60  },
  teleport: { col: '#44FFFF', sz: 11, hp: 1, spd: 62,  pts: 50  },
  necro:    { col: '#CC00FF', sz: 15, hp: 3, spd: 52,  pts: 100 },
};

const STREAK_NAMES = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD KILL', 'PENTA KILL', 'HEXA KILL', 'ULTRA KILL', 'RAMPAGE'];
const STREAK_COLS  = ['', '', '#FFFF00', '#FF8800', '#FF4400', '#FF0000', '#FF00FF', '#BF00FF', '#FF0000'];
const WTYPES       = ['CLEAR', 'CLEAR', 'CLEAR', 'FOG', 'STORM', 'EMP', 'DATA_RAIN'];
const AB_BASE      = { bomb: 12, kp: 25, dash: 3, overclock: 20, empshield: 18, timewarp: 15 };

const SKILLS = [
  { n: 'RAPID FIRE',    d: '+25% fire rate',          apply: (gs) => gs.WPNS.forEach((w) => { w.cd *= 0.75; }) },
  { n: 'DAMAGE BOOST',  d: '+30% weapon damage',       apply: (gs) => gs.WPNS.forEach(w => w.dmg *= 1.3) },
  { n: 'SHIELD UP',     d: '+1 max HP',                apply: (gs) => { gs.maxHp++; gs.hp = Math.min(gs.hp + 1, gs.maxHp); updateHpHud(gs.hp, gs.maxHp); } },
  { n: 'SPEED DAEMON',  d: '+20% movement',            apply: (gs) => gs.speed *= 1.2 },
  { n: 'RANGE EXTEND',  d: '+20% weapon range',        apply: (gs) => gs.WPNS.forEach(w => w.rng *= 1.2) },
  { n: 'CD MASTER',     d: '-20% ability cooldowns',   apply: (gs) => gs.abilityCDMult *= 0.8 },
  { n: 'CREDIT RUSH',   d: '+200 credits',             apply: (gs) => { gs.credits += 200; updateCredits(gs.credits); } },
  { n: 'GHOST FORM',    d: 'Invincibility +2s on hit', apply: (gs) => gs.ghostBonusTime += 2 },
  { n: 'COMBO KEEPER',  d: 'Combo decays 30% slower',  apply: (gs) => gs.comboDecayMult *= 0.7 },
  { n: 'CHAIN MASTER',  d: 'Chain hits +2 targets',    apply: (gs) => gs.chainExtraTargets += 2 },
];

const SHOP = [
  { n: 'HEALTH PACK',    d: 'Restore 1 HP',                   cost: 80,  apply: (gs) => { gs.hp = Math.min(gs.hp + 1, gs.maxHp); updateHpHud(gs.hp, gs.maxHp); } },
  { n: 'AMMO BOOST',     d: 'Reset all weapon cooldowns',      cost: 120, apply: (gs) => gs.wpnCDs.fill(0) },
  { n: 'CREDIT SURGE',   d: '+500 credits',                    cost: 200, apply: (gs) => { gs.credits += 500; } },
  { n: 'OVERCLOCK CHIP', d: '-10% ability cooldowns',          cost: 150, apply: (gs) => gs.abilityCDMult *= 0.9 },
  { n: 'DEFUSE KIT',     d: 'Clear all enemy projectiles',     cost: 90,  apply: (gs) => gs.EPROJS.length = 0 },
  { n: 'SKIN CYCLE',     d: 'Next player skin',                cost: 30,  apply: (gs) => { gs.skinIdx = (gs.skinIdx + 1) % SKINS.length; } },
];

export class GameScene {
  constructor(cv, ctx, mmCv, mctx) {
    // canvas references
    this.cv   = cv;
    this.ctx  = ctx;
    this.mmCv = mmCv;
    this.mctx = mctx;

    // camera / world (we keep local copies, sync to Camera module)
    this.lW = 0; this.lH = 0;
    this.WW = 0; this.WH = 0;
    this.DPR = 1;
    this.camX = 0; this.camY = 0;
    this.mx = 0; this.my = 0;
    this.wMX = 0; this.wMY = 0;
    this.W = 0; this.H = 0;

    // ── game state
    this.running       = false;
    this.betweenWaves  = false;
    this.betweenTimer  = 0;
    this.waveEnemyCount = 0;
    this.skillModal    = false;
    this.shopModal     = false;

    this.score    = 0;
    this.hiScore  = getHiScore();
    this.combo    = 1;
    this.comboTimer = 0;
    this.credits  = 0;
    this.wave     = 1;
    this.killStreak  = 0;
    this.streakTimer = 0;

    // player
    this.px = 0; this.py = 0;
    this.hp = 3; this.maxHp = 3;
    this.speed = 260;
    this.ghostActive = false; this.ghostTimer = 0; this.invincible = 0;
    this.dashTimer = 0; this.dashVX = 0; this.dashVY = 0; this.dashTrail = [];
    this.overclockActive = false; this.overclockTimer = 0;
    this.empShieldActive = false; this.empShieldTimer = 0;
    this.timeWarpActive  = false; this.timeWarpTimer  = 0;
    this.abCDs = { bomb: 0, kp: 0, dash: 0, overclock: 0, empshield: 0, timewarp: 0 };
    this.abilityCDMult   = 1;
    this.ghostBonusTime  = 0;
    this.comboDecayMult  = 1;
    this.chainExtraTargets = 0;
    this.skinIdx = 0;
    this.SKINS   = SKINS;

    // entity lists
    this.EYES      = [];
    this.DEAD_EYES = [];
    this.EPROJS    = [];
    this.PARTS     = [];
    this.BEAMS     = [];
    this.FLOATS    = [];

    // boss
    this.boss = null;

    // weapons
    this.WPNS    = WPNS;
    this.wpnIdx  = 0;
    this.wpnCDs  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.powerMult = 1;

    // special weapon state
    this.bhActive   = false; this.bhTimer = 0; this.bhX = 0; this.bhY = 0;
    this.nukeCharging = false; this.nukeTimer = 0; this.nukeX = 0; this.nukeY = 0; this.nukeRad = 0;
    this.chainSegs  = []; this.chainLife = 0;
    this.waveRing   = false; this.waveRingTimer = 0; this.waveRingX = 0; this.waveRingY = 0;

    // fx
    this.shakeAmt  = 0; this.shakeX = 0; this.shakeY = 0;
    this.flashAlpha = 0; this.chromAberr = 0;

    // weather
    this.weather     = 'CLEAR';
    this.weatherTimer = 90;
    this.stormTimer  = 3;
    this.empToggle   = false;
    this.empFlipTimer = 4;
    this.rainDrops   = [];

    // map
    this.mapIdx     = 0;
    this.nextMapIdx = 1;

    // input (set by Game)
    this.KEYS = {};
    this.isMouseDown = false;

    // fetch power multiplier
    fetch('https://api.github.com/repos/999purple999/klab-dsp.github.io')
      .then(r => r.json())
      .then(d => { this.powerMult = 1 + ((d.stargazers_count || 0) + (d.forks_count || 0)) * 0.05; })
      .catch(() => {});
  }

  // ─── called by Game on each resize
  resize(lW, lH, DPR) {
    this.lW = lW; this.lH = lH; this.DPR = DPR;
    this.WW = lW * 3.5; this.WH = lH * 3.5;
    this.W  = this.cv.width;
    this.H  = this.cv.height;
    this._syncCamera();
    buildMapAssets(this.WW, this.WH);
  }

  _syncCamera() {
    setCameraState({
      camX: this.camX, camY: this.camY,
      lW: this.lW, lH: this.lH,
      WW: this.WW, WH: this.WH,
      DPR: this.DPR,
    });
  }

  // ─── Scene interface
  enter() {}
  exit()  {}

  startGame() {
    this.running = true;
    this.score = 0; this.wave = 0; this.combo = 1; this.comboTimer = 0; this.credits = 100;
    this.hp = 3; this.maxHp = 3; this.speed = 260; this.killStreak = 0; this.streakTimer = 0;
    this.ghostActive = false; this.invincible = 0; this.dashTimer = 0; this.dashTrail = [];
    this.overclockActive = false; this.empShieldActive = false; this.timeWarpActive = false;
    this.abCDs = { bomb: 0, kp: 0, dash: 0, overclock: 0, empshield: 0, timewarp: 0 };
    this.abilityCDMult = 1; this.ghostBonusTime = 0; this.comboDecayMult = 1; this.chainExtraTargets = 0;
    this.EYES.length = 0; this.PARTS.length = 0; this.BEAMS.length = 0;
    this.EPROJS.length = 0; this.DEAD_EYES.length = 0; this.FLOATS.length = 0;
    this.boss = null; this.bhActive = false; this.nukeCharging = false; this.nukeRad = 0; this.chainSegs = [];
    WPNS.forEach((w, i) => { w.cd = BASE_CD[i]; w.dmg = BASE_DMG[i]; w.rng = BASE_RNG[i]; });
    this.wpnCDs.fill(0); this.skinIdx = 0; this.wpnIdx = 0;
    this.camX = (this.WW - this.lW) / 2; this.camY = (this.WH - this.lH) / 2;
    this.px = this.WW / 2; this.py = this.WH / 2;
    this.mapIdx = 0; this.nextMapIdx = 1;
    this._syncCamera();
    updateHpHud(this.hp, this.maxHp);
    updateScore(0);
    updateCredits(100);
    setWpn(0, WPNS);
    document.getElementById('shield-bar-wrap').style.display = 'none';
    document.getElementById('nuke-charge').style.display = 'none';
    document.getElementById('ov-score').style.display = 'none';
    document.getElementById('ov-hi').style.display = 'none';
    this._startWave(1);
  }

  gameOver() {
    this.running = false;
    this.hiScore = getHiScore();
    if (this.score > this.hiScore) { this.hiScore = this.score; setHiScore(this.score); }
    const ov = document.getElementById('overlay'); ov.classList.remove('hidden');
    document.getElementById('ov-title').textContent = 'SYSTEM BREACH';
    document.getElementById('ov-sub').textContent   = 'Your data has been compromised';
    const os = document.getElementById('ov-score'), oh = document.getElementById('ov-hi');
    os.style.display = 'block'; os.textContent = 'SCORE: ' + Math.floor(this.score);
    oh.style.display = 'block'; oh.textContent = 'BEST: '  + Math.floor(this.hiScore);
    document.getElementById('start-btn').textContent = '↺ RETRY';
  }

  // ─── Wave management
  _startWave(wv) {
    this.wave = wv; this.betweenWaves = false;
    this.EYES.length = 0; this.boss = null; this.EPROJS.length = 0;
    this.mapIdx = this.nextMapIdx;
    buildObstacles(wv, this.WW, this.WH);
    const M = MAPS[this.mapIdx];
    const mf = document.getElementById('map-name-flash');
    mf.style.opacity = '1'; mf.textContent = M.n;
    setTimeout(() => mf.style.opacity = '0', 2300);
    const isBoss = wv % 5 === 0;
    if (isBoss) {
      this._spawnBoss(wv); this.waveEnemyCount = 1;
      showMsg('BOSS WAVE', 'Critical Threat Detected', 3000);
    } else {
      const count = 5 + wv * 3; this.waveEnemyCount = count;
      const ftypes = ['ring', 'v', 'line', 'diamond'];
      if (wv >= 2 && Math.random() < 0.45) {
        const ft = ftypes[Math.floor(Math.random() * ftypes.length)];
        const fc = Math.min(6, count);
        const fx = this.camX + this.lW * (0.3 + Math.random() * 0.4);
        const fy = this.camY + this.lH * (0.3 + Math.random() * 0.4);
        this._spawnFormation(ft, fx, fy, fc, this._pickType(wv), wv);
        for (let i = fc; i < count; i++) this._spawnRandom(wv);
      } else {
        for (let i = 0; i < count; i++) this._spawnRandom(wv);
      }
    }
    this._pickWeather(wv); SFX.wave();
    updateWave(wv);
    this._updateEnemyCount();
  }

  _endWave() {
    this.betweenWaves = true; this.betweenTimer = 4.5;
    this.nextMapIdx = Math.floor(Math.random() * MAPS.length);
    const hs = getHiScore();
    if (this.score > hs) setHiScore(this.score);
    showMsg('WAVE ' + this.wave + ' CLEARED', 'Opening Skill Matrix…');
    setTimeout(() => { if (this.running && this.betweenWaves) this._openSkillModal(); }, 900);
  }

  _updateEnemyCount() {
    updateEnemyCount(this.EYES.length + (this.boss ? 1 : 0));
  }

  // ─── Enemy helpers
  _pickType(wv) {
    const pool = [];
    const add = (k, minW, w2) => { if (wv >= minW) pool.push({ k, w: w2 }); };
    add('normal', 1, 60); add('elite', 2, 28); add('phish', 3, 18);
    add('shooter', 4, 14); add('doppel', 4, 12); add('cloaker', 5, 10);
    add('berser', 5, 10); add('tank', 6, 6); add('teleport', 7, 5); add('necro', 8, 3);
    let tot = pool.reduce((s, p) => s + p.w, 0), r = Math.random() * tot;
    for (const p of pool) { r -= p.w; if (r <= 0) return p.k; }
    return 'normal';
  }

  _makeEnemy(x, y, type, wv) {
    const d = EDEFS[type], hb = Math.floor(wv / 3);
    return {
      x, y, t: type, col: d.col, sz: d.sz, hp: d.hp + hb, maxHp: d.hp + hb,
      spd: d.spd * (1 + wv * 0.07), pts: d.pts, vx: 0, vy: 0,
      frozen: 0, virus: 0, al: 1, hitFlash: 0, spawnAnim: 0.5,
      cloakTimer: 2, cloaking: false, shootTimer: 2 + Math.random() * 2,
      teleTimer: 4 + Math.random() * 3, necroTimer: 8, berserk: false,
    };
  }

  _spawnAt(x, y, type, wv) { this.EYES.push(this._makeEnemy(x, y, type, wv)); }

  _spawnRandom(wv) {
    const m = 80, side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0)      { x = Math.random() * this.WW; y = m; }
    else if (side === 1) { x = this.WW - m; y = Math.random() * this.WH; }
    else if (side === 2) { x = Math.random() * this.WW; y = this.WH - m; }
    else                 { x = m; y = Math.random() * this.WH; }
    this._spawnAt(x, y, this._pickType(wv), wv);
  }

  _spawnFormation(ftype, cx, cy, count, type, wv) {
    const r = 85, pts = [];
    if (ftype === 'ring') {
      for (let i = 0; i < count; i++) pts.push([cx + Math.cos(i / count * Math.PI * 2) * r, cy + Math.sin(i / count * Math.PI * 2) * r]);
    } else if (ftype === 'v') {
      for (let i = 0; i < count; i++) { const s = (i % 2 ? 1 : -1); pts.push([cx + s * Math.ceil(i / 2) * 40, cy + Math.ceil(i / 2) * 42]); }
    } else if (ftype === 'line') {
      for (let i = 0; i < count; i++) pts.push([cx + (i - (count - 1) / 2) * 46, cy]);
    } else {
      const dp = [[0, -r], [r, 0], [0, r], [-r, 0]];
      for (let i = 0; i < count; i++) pts.push([cx + dp[i % 4][0], cy + dp[i % 4][1]]);
    }
    pts.forEach(([x, y]) => this._spawnAt(Math.max(60, Math.min(this.WW - 60, x)), Math.max(60, Math.min(this.WH - 60, y)), type, wv));
  }

  // ─── Boss
  _spawnBoss(wv) {
    this.boss = {
      x: this.WW / 2, y: this.WH * 0.22,
      hp: 30 + wv * 9, maxHp: 30 + wv * 9,
      spd: 52 + wv * 3, sz: 44, col: '#FF0000',
      phase: 1, shootTimer: 1.4, vx: 100, vy: 70,
      frozen: 0, virus: 0, pts: 500 + wv * 100, angle: 0, hitFlash: 0,
    };
    SFX.boss();
  }

  // ─── Weather
  _pickWeather(wv) {
    const pool = wv >= 3 ? WTYPES : ['CLEAR', 'CLEAR', 'FOG'];
    this.weather = pool[Math.floor(Math.random() * pool.length)];
    this.weatherTimer = 75 + Math.random() * 90;
    updateWeather(this.weather);
    if (this.weather === 'DATA_RAIN') {
      this.rainDrops = [];
      for (let i = 0; i < 110; i++)
        this.rainDrops.push({ x: Math.random() * this.lW, y: Math.random() * this.lH, spd: 2.5 + Math.random() * 5, len: 10 + Math.random() * 30 });
    }
    this.empToggle = false; this.empFlipTimer = 4; this.stormTimer = 3;
  }

  // ─── Scoring / scoring helpers
  _spawnFloat(x, y, text, col) {
    this.FLOATS.push({ x, y, text, col: col || '#fff', life: 1.1, vy: -55 + Math.random() * 20, vx: (Math.random() - 0.5) * 20 });
  }

  _burst(bx, by, col, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * spd;
      this.PARTS.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col, r: 1 + Math.random() * 3.5, life: 0.5 + Math.random() * 0.45 });
    }
  }

  _shakeDir(srcX, srcY, amt) { this.shakeAmt = amt; this.shakeX = (this.px - srcX); this.shakeY = (this.py - srcY); }

  _addBeam(x1, y1, x2, y2, col, life, lw) { this.BEAMS.push({ x1, y1, x2, y2, col, life, maxLife: life, lw }); }

  _damageE(e, dmg, big) {
    if (!e || e.hp <= 0) return;
    e.hp -= dmg; e.hitFlash = 0.13;
    SFX.hit();
    if (big) this._burst(e.x, e.y, e.col, 8, 35);
    if (e.hp <= 0) this._killE(e);
  }

  _hurtBoss(dmg) {
    if (!this.boss) return;
    this.boss.hp -= dmg; this.boss.hitFlash = 0.1; SFX.bossHit();
    this._spawnFloat(this.boss.x + (Math.random() - 0.5) * 40, this.boss.y - 40, '-' + dmg.toFixed(1), '#FF5555');
    if (this.boss.hp <= 0) this._killBoss();
  }

  _killE(e) {
    const i = this.EYES.indexOf(e);
    if (i < 0) return;
    this.EYES.splice(i, 1);
    this.DEAD_EYES.push({ ...e, deadTimer: 25 });
    const pts = Math.round(e.pts * this.combo);
    this.score += pts; this.credits += Math.floor(e.pts * 0.1);
    this.combo = Math.min(this.combo + 0.4, 8); this.comboTimer = 2.5;
    SFX.kill();
    if (e.t === 'necro')      this._burst(e.x, e.y, '#CC00FF', 20, 90);
    else if (e.t === 'tank')  this._burst(e.x, e.y, '#FF8800', 22, 80);
    else if (e.t === 'boss')  this._burst(e.x, e.y, '#FF0000', 30, 130);
    else                      this._burst(e.x, e.y, e.col, 12, 55);
    this._spawnFloat(e.x, e.y - 16, '+' + pts, e.col);
    this.killStreak++; this.streakTimer = 2.5;
    if (this.killStreak >= 2 && this.killStreak < STREAK_NAMES.length) {
      showStreak(
        STREAK_NAMES[Math.min(this.killStreak, STREAK_NAMES.length - 1)],
        STREAK_COLS[Math.min(this.killStreak, STREAK_COLS.length - 1)],
        this.killStreak,
      );
    }
    updateScore(this.score);
    updateCredits(this.credits);
  }

  _killBoss() {
    if (!this.boss) return;
    const pts = Math.round(this.boss.pts * this.combo);
    this.score += pts; this.credits += 350;
    this._burst(this.boss.x, this.boss.y, '#FF0000', 35, 160);
    this._shakeDir(this.boss.x, this.boss.y, 25);
    this.flashAlpha = 0.4;
    this._spawnFloat(this.boss.x, this.boss.y - 50, '+' + pts + ' BOSS!', '#FF4400');
    updateScore(this.score);
    updateCredits(this.credits);
    this.boss = null; SFX.kill(); showMsg('BOSS ELIMINATED', 'Threat Neutralized');
  }

  _hurtPlayer() {
    if (this.invincible > 0 || this.ghostActive || this.empShieldActive) return;
    this.hp--; updateHpHud(this.hp, this.maxHp); SFX.hurt();
    this.invincible = 1.8 + this.ghostBonusTime;
    this.ghostActive = true; this.ghostTimer = this.invincible;
    this._shakeDir(this.px, this.py, 20); this.flashAlpha = 0.28; this.chromAberr = 0.8;
    if (this.hp <= 0) this.gameOver();
  }

  // ─── Abilities
  _abCD(k) { return AB_BASE[k] * this.abilityCDMult; }

  useBomb() {
    if (this.abCDs.bomb > 0 || !this.running) return;
    this.abCDs.bomb = this._abCD('bomb'); SFX.bomb();
    const R = 230;
    this.EYES.forEach(e => { if (d2(e.x, e.y, this.px, this.py) < R) this._damageE(e, 4 * this.powerMult, true); });
    if (this.boss && d2(this.boss.x, this.boss.y, this.px, this.py) < R) this._hurtBoss(4 * this.powerMult);
    this._burst(this.px, this.py, '#FF8800', 28, 220); this._shakeDir(this.px, this.py, 16);
    this._spawnFloat(this.px, this.py - 30, 'BOMB!', '#FF8800');
  }

  useKP() {
    if (this.abCDs.kp > 0 || !this.running) return;
    this.abCDs.kp = this._abCD('kp'); SFX.kp();
    this.EYES.forEach(e => { e.frozen = 3.8; e.vx = 0; e.vy = 0; });
    if (this.boss) this.boss.frozen = 2.5;
    this.shakeAmt = 8; this.flashAlpha = 0.22;
    showMsg('KERNEL PANIC', 'All Threats Frozen');
  }

  useDash() {
    if (this.abCDs.dash > 0 || this.dashTimer > 0 || !this.running) return;
    this.abCDs.dash = this._abCD('dash'); SFX.dash();
    this.dashTimer = 0.35; this.invincible = 0.45; this.dashTrail = [];
    const dx = this.wMX - this.px, dy = this.wMY - this.py, d = Math.hypot(dx, dy) || 1;
    this.dashVX = dx / d * 720; this.dashVY = dy / d * 720;
  }

  useOverclock() {
    if (this.abCDs.overclock > 0 || !this.running) return;
    this.abCDs.overclock = this._abCD('overclock'); SFX.overclock();
    this.overclockActive = true; this.overclockTimer = 4; this.wpnCDs.fill(0);
    showMsg('OVERCLOCK', 'Weapons Supercharged');
  }

  useEmpShield() {
    if (this.abCDs.empshield > 0 || !this.running) return;
    this.abCDs.empshield = this._abCD('empshield');
    this.empShieldActive = true; this.empShieldTimer = 5; this.EPROJS.length = 0;
    document.getElementById('shield-bar-wrap').style.display = 'block';
    showMsg('EMP SHIELD', 'Projectiles Negated');
  }

  useTimeWarp() {
    if (this.abCDs.timewarp > 0 || !this.running) return;
    this.abCDs.timewarp = this._abCD('timewarp'); SFX.warp();
    this.timeWarpActive = true; this.timeWarpTimer = 2.5;
    this.EYES.forEach(e => { e.frozen = Math.max(e.frozen, 2.5); e.vx = 0; e.vy = 0; });
    if (this.boss) this.boss.frozen = Math.max(this.boss.frozen || 0, 2.5);
    showMsg('TIME WARP', 'Reality Suspended');
  }

  // ─── Weapons fire
  tryFire() {
    if (this.empToggle && this.weather === 'EMP') return;
    if (this.wpnCDs[this.wpnIdx] > 0) return;
    this._fire();
    this.wpnCDs[this.wpnIdx] = WPNS[this.wpnIdx].cd;
  }

  _fire() {
    const w = WPNS[this.wpnIdx];
    const dx = this.wMX - this.px, dy = this.wMY - this.py, dist2 = Math.hypot(dx, dy) || 1;
    const ux = dx / dist2, uy = dy / dist2;

    if (w.t === 'pulse') {
      SFX.shoot();
      this._addBeam(this.px, this.py, this.px + ux * w.rng, this.py + uy * w.rng, w.col, 0.12, 2.5);
      this._hitDir(this.px, this.py, ux, uy, w.rng, w.dmg, 16);
    } else if (w.t === 'beam') {
      SFX.beam();
      this._addBeam(this.px, this.py, this.px + ux * w.rng, this.py + uy * w.rng, w.col, 0.09, 4);
      this._hitDir(this.px, this.py, ux, uy, w.rng, w.dmg, 12);
    } else if (w.t === 'spread') {
      SFX.shoot();
      for (let a = -0.44; a <= 0.45; a += 0.22) {
        const c = Math.cos(a), s = Math.sin(a);
        const bx = ux * c - uy * s, by = ux * s + uy * c;
        this._addBeam(this.px, this.py, this.px + bx * w.rng, this.py + by * w.rng, w.col, 0.14, 2);
        this._hitDir(this.px, this.py, bx, by, w.rng, w.dmg, 15);
      }
    } else if (w.t === 'split') {
      SFX.shoot();
      [-0.38, -0.19, 0, 0.19, 0.38].forEach(a => {
        const c = Math.cos(a), s = Math.sin(a);
        const bx = ux * c - uy * s, by = ux * s + uy * c;
        this._addBeam(this.px, this.py, this.px + bx * w.rng, this.py + by * w.rng, w.col, 0.16, 2);
        this._hitDir(this.px, this.py, bx, by, w.rng, w.dmg, 14);
      });
    } else if (w.t === 'wave') {
      SFX.shoot();
      this.waveRing = true; this.waveRingTimer = 0.55; this.waveRingX = this.px; this.waveRingY = this.py;
      this.EYES.forEach(e => { if (d2(e.x, e.y, this.px, this.py) < w.rng) this._damageE(e, w.dmg * this.powerMult, false); });
      if (this.boss && d2(this.boss.x, this.boss.y, this.px, this.py) < w.rng) this._hurtBoss(w.dmg * this.powerMult);
      this._burst(this.px, this.py, w.col, 16, w.rng * 0.8); this._shakeDir(this.px, this.py, 5);
    } else if (w.t === 'blackhole') {
      this.bhActive = true; this.bhTimer = 2.4; this.bhX = this.wMX; this.bhY = this.wMY;
      SFX.shoot(); showMsg('BLACK HOLE', 'Gravity Singularity');
    } else if (w.t === 'chain') {
      SFX.shoot();
      const sorted = [...this.EYES].sort((a, b) => d2(a.x, a.y, this.wMX, this.wMY) - d2(b.x, b.y, this.wMX, this.wMY));
      const n = Math.min(5 + this.chainExtraTargets, sorted.length);
      this.chainSegs = []; this.chainLife = 0.5;
      let lx = this.px, ly = this.py;
      sorted.slice(0, n).forEach(t => { this.chainSegs.push({ x1: lx, y1: ly, x2: t.x, y2: t.y }); lx = t.x; ly = t.y; this._damageE(t, w.dmg * this.powerMult, false); });
      if (this.boss) { this.chainSegs.push({ x1: lx, y1: ly, x2: this.boss.x, y2: this.boss.y }); this._hurtBoss(w.dmg * 0.5 * this.powerMult); }
    } else if (w.t === 'cryo') {
      SFX.beam();
      this._addBeam(this.px, this.py, this.px + ux * w.rng, this.py + uy * w.rng, w.col, 0.38, 6);
      this._hitDir(this.px, this.py, ux, uy, w.rng, w.dmg, 18, e => { e.frozen = 3.8; e.vx *= 0.08; e.vy *= 0.08; this._burst(e.x, e.y, '#88FFFF', 5, 25); });
      if (this.boss && d2(this.boss.x, this.boss.y, this.px, this.py) < w.rng) this.boss.frozen = 1.6;
    } else if (w.t === 'nuke') {
      this.nukeCharging = true; this.nukeTimer = 2; this.nukeX = this.wMX; this.nukeY = this.wMY;
      document.getElementById('nuke-charge').style.display = 'block';
    } else if (w.t === 'virus') {
      SFX.shoot();
      const t = this.EYES.find(e => d2(e.x, e.y, this.wMX, this.wMY) < e.sz + 14);
      if (t) { t.virus = 12; this._damageE(t, w.dmg * this.powerMult, false); }
      else if (this.boss && d2(this.boss.x, this.boss.y, this.wMX, this.wMY) < this.boss.sz + 22) this.boss.virus = 7;
    }
  }

  _hitDir(ox, oy, dirx, diry, rng, dmg, tol, onHit) {
    for (let i = this.EYES.length - 1; i >= 0; i--) {
      const e = this.EYES[i];
      if (e.cloaking && Math.random() < 0.7) continue;
      const tx = e.x - ox, ty = e.y - oy;
      const proj = tx * dirx + ty * diry;
      if (proj < 0 || proj > rng) continue;
      const cx = ox + dirx * proj, cy = oy + diry * proj;
      if (d2(e.x, e.y, cx, cy) < e.sz + tol) { this._damageE(e, dmg * this.powerMult, false); if (onHit) onHit(e); }
    }
    if (this.boss) {
      const tx = this.boss.x - ox, ty = this.boss.y - oy, proj = tx * dirx + ty * diry;
      if (proj >= 0 && proj <= rng) {
        const cx = ox + dirx * proj, cy = oy + diry * proj;
        if (d2(this.boss.x, this.boss.y, cx, cy) < this.boss.sz + tol) { this._hurtBoss(dmg * this.powerMult); if (onHit) onHit(this.boss); }
      }
    }
  }

  _detonateNuke() {
    this.nukeRad = 10;
    const R = 360; SFX.nuke();
    this.EYES.forEach(e => { if (d2(e.x, e.y, this.nukeX, this.nukeY) < R) this._damageE(e, WPNS[8].dmg * this.powerMult, true); });
    if (this.boss && d2(this.boss.x, this.boss.y, this.nukeX, this.nukeY) < R) this._hurtBoss(WPNS[8].dmg * this.powerMult);
    this._burst(this.nukeX, this.nukeY, '#FF4400', 44, R * 0.9);
    this._shakeDir(this.nukeX, this.nukeY, 28);
    this.flashAlpha = 0.7; this.chromAberr = 1;
  }

  // ─── Skill / Shop modals
  _openSkillModal() {
    if (!this.running || this.shopModal) return;
    this.skillModal = true;
    const pool = [...SKILLS]; const choices = [];
    for (let i = 0; i < 3 && pool.length; i++) choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const c = document.getElementById('skill-cards'); c.innerHTML = '';
    choices.forEach(s => {
      const dEl = document.createElement('div'); dEl.className = 'sk-card';
      dEl.innerHTML = '<div class="sk-name">' + s.n + '</div><div class="sk-desc">' + s.d + '</div>';
      dEl.onclick = () => { s.apply(this); SFX.upgrade(); this._closeSkillModal(); };
      c.appendChild(dEl);
    });
    document.getElementById('skill-modal').style.display = 'flex';
  }

  _closeSkillModal() {
    document.getElementById('skill-modal').style.display = 'none'; this.skillModal = false;
  }

  _openShop() {
    if (!this.running || this.skillModal) return;
    this.shopModal = true;
    document.getElementById('sh-cr').textContent = this.credits;
    const cont = document.getElementById('shop-items'); cont.innerHTML = '';
    SHOP.forEach(item => {
      const row = document.createElement('div'); row.className = 'sh-item';
      row.innerHTML = '<div><div class="sh-item-name">' + item.n + '</div><div class="sh-item-desc">' + item.d + '</div></div>'
        + '<button class="sh-buy" data-item="' + item.n + '">' + item.cost + '⬡</button>';
      cont.appendChild(row);
    });
    document.getElementById('shop-modal').style.display = 'flex';
  }

  _buyShopItem(name) {
    const item = SHOP.find(i => i.n === name);
    if (!item || this.credits < item.cost) return;
    this.credits -= item.cost;
    item.apply(this);
    SFX.upgrade();
    document.getElementById('sh-cr').textContent = this.credits;
    updateCredits(this.credits);
  }

  // ─── Main update
  update(dt) {
    if (!this.running) return;
    if (this.skillModal || this.shopModal) return;
    if (this.isMouseDown) this.tryFire();
    this._update(dt);
    this._render();
    this._renderMiniMap();
  }

  _update(dt) {
    // Camera
    const SSPD = 290, EDGE = 88;
    const { mx, my, lW, lH } = this;
    if (this.KEYS['a'] || this.KEYS['arrowleft'])   this.camX -= SSPD * dt;
    else if (mx < EDGE)                              this.camX -= SSPD * (1 - mx / EDGE) * dt;
    if (this.KEYS['d'] || this.KEYS['arrowright'])   this.camX += SSPD * dt;
    else if (mx > lW - EDGE)                         this.camX += SSPD * (1 - (lW - mx) / EDGE) * dt;
    if (this.KEYS['w'] || this.KEYS['arrowup'])      this.camY -= SSPD * dt;
    else if (my < EDGE)                              this.camY -= SSPD * (1 - my / EDGE) * dt;
    if (this.KEYS['s'] || this.KEYS['arrowdown'])    this.camY += SSPD * dt;
    else if (my > lH - EDGE)                         this.camY += SSPD * (1 - (lH - my) / EDGE) * dt;
    this.camX = Math.max(0, Math.min(this.WW - lW, this.camX));
    this.camY = Math.max(0, Math.min(this.WH - lH, this.camY));
    this.wMX = mx + this.camX; this.wMY = my + this.camY;
    this._syncCamera();

    // Player movement
    if (!this.betweenWaves) {
      const pdx = this.wMX - this.px, pdy = this.wMY - this.py, pd = Math.hypot(pdx, pdy);
      if (pd > 8) {
        const sp = this.dashTimer > 0 ? 720 : this.speed;
        this.px += pdx / pd * Math.min(pd, sp * dt);
        this.py += pdy / pd * Math.min(pd, sp * dt);
      }
      if (this.dashTimer > 0) {
        this.dashTimer -= dt; this.px += this.dashVX * dt; this.py += this.dashVY * dt;
        this.dashTrail.push({ x: this.px, y: this.py, life: 0.22 });
      }
      this.dashTrail.forEach(t => t.life -= dt);
      for (let i = this.dashTrail.length - 1; i >= 0; i--) { if (this.dashTrail[i].life <= 0) this.dashTrail.splice(i, 1); }
      this.px = Math.max(10, Math.min(this.WW - 10, this.px));
      this.py = Math.max(10, Math.min(this.WH - 10, this.py));
      // Obstacle resolution
      for (const o of OBSTACLES) {
        const cx = Math.max(o.x, Math.min(o.x + o.w, this.px));
        const cy = Math.max(o.y, Math.min(o.y + o.h, this.py));
        const dst = d2(this.px, this.py, cx, cy);
        if (dst < 14 && dst > 0) { const nx = (this.px - cx) / dst, ny = (this.py - cy) / dst; this.px = cx + nx * 15; this.py = cy + ny * 15; }
      }
    }

    // Cooldowns
    for (const k in this.abCDs) this.abCDs[k] = Math.max(0, this.abCDs[k] - dt);
    this.wpnCDs.forEach((_, i) => this.wpnCDs[i] = Math.max(0, this.wpnCDs[i] - dt));
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shakeAmt > 0) this.shakeAmt = Math.max(0, this.shakeAmt - this.shakeAmt * 5.5 * dt - 0.05);
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
    if (this.chromAberr > 0) this.chromAberr = Math.max(0, this.chromAberr - dt * 4);

    // Ability timers
    if (this.overclockActive) { this.overclockTimer -= dt; if (this.overclockTimer <= 0) this.overclockActive = false; }
    if (this.empShieldActive) {
      this.empShieldTimer -= dt;
      document.getElementById('shield-bar').style.width = Math.max(0, this.empShieldTimer / 5 * 100) + '%';
      if (this.empShieldTimer <= 0) { this.empShieldActive = false; document.getElementById('shield-bar-wrap').style.display = 'none'; }
    }
    if (this.timeWarpActive) { this.timeWarpTimer -= dt; if (this.timeWarpTimer <= 0) this.timeWarpActive = false; }
    if (this.ghostActive)    { this.ghostTimer -= dt;   if (this.ghostTimer <= 0)    this.ghostActive = false; }

    // Combo
    if (this.comboTimer > 0) this.comboTimer -= dt * this.comboDecayMult;
    else this.combo = Math.max(1, this.combo - 1.1 * dt);
    updateCombo(this.combo);

    // Kill streak decay
    if (this.streakTimer > 0) this.streakTimer -= dt;
    else if (this.killStreak > 0) this.killStreak = 0;

    // Weapon CD bar + ability UI
    updateWeaponCD(this.wpnIdx, this.wpnCDs, WPNS, this.overclockActive);
    updateAbilityUI(this.abCDs, this.abilityCDMult);

    // Weather
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) this._pickWeather(this.wave);
    if (this.weather === 'STORM') {
      this.stormTimer -= dt;
      if (this.stormTimer <= 0) {
        this.stormTimer = 2.8 + Math.random() * 3;
        if (this.EYES.length > 0) {
          const t = this.EYES[Math.floor(Math.random() * this.EYES.length)];
          this._damageE(t, 2, false); this.flashAlpha = 0.1;
          this.BEAMS.push({ x1: t.x, y1: 0, x2: t.x, y2: t.y, col: '#FFFFFF', life: 0.14, maxLife: 0.14, lw: 3 });
        }
      }
    }
    if (this.weather === 'EMP') {
      this.empFlipTimer -= dt;
      if (this.empFlipTimer <= 0) { this.empFlipTimer = 2.5 + Math.random() * 2; this.empToggle = !this.empToggle; }
    }
    if (this.weather === 'DATA_RAIN') this.rainDrops.forEach(r => { r.y += r.spd; if (r.y > this.lH) r.y = -r.len; });

    // Black hole
    if (this.bhActive) {
      this.bhTimer -= dt;
      if (this.bhTimer <= 0) this.bhActive = false;
      else {
        this.EYES.forEach(e => {
          const dx = this.bhX - e.x, dy = this.bhY - e.y, d = Math.hypot(dx, dy) || 1;
          const pull = (220 + this.bhTimer * 55) * dt;
          e.x += dx / d * pull; e.y += dy / d * pull;
          if (d < 28) this._damageE(e, 2 * this.powerMult, false);
        });
        if (this.boss) {
          const dx = this.bhX - this.boss.x, dy = this.bhY - this.boss.y, d = Math.hypot(dx, dy) || 1;
          this.boss.x += dx / d * 55 * dt; this.boss.y += dy / d * 55 * dt;
        }
      }
    }

    // Nuke
    if (this.nukeCharging) {
      this.nukeTimer -= dt;
      document.getElementById('nuke-bar').style.width = ((1 - this.nukeTimer / 2) * 100) + '%';
      if (this.nukeTimer <= 0) { this.nukeCharging = false; document.getElementById('nuke-charge').style.display = 'none'; this._detonateNuke(); }
    }
    if (this.nukeRad > 0) { this.nukeRad += dt * 440; if (this.nukeRad > 540) this.nukeRad = 0; }

    // Chain + wave ring
    if (this.chainSegs.length) { this.chainLife -= dt; if (this.chainLife <= 0) this.chainSegs = []; }
    if (this.waveRing)          { this.waveRingTimer -= dt; if (this.waveRingTimer <= 0) this.waveRing = false; }

    // Ambient particles
    AMBIENT.forEach(a => {
      a.phase += dt; a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < 0) a.x += this.WW; if (a.x > this.WW) a.x -= this.WW;
      if (a.y < 0) a.y += this.WH; if (a.y > this.WH) a.y -= this.WH;
    });

    // Virus spread
    this.EYES.forEach(e => {
      if (e.virus > 0) {
        e.virus -= dt; e.hp -= 0.3 * dt;
        if (Math.random() < 0.025) {
          const n = this.EYES.find(o => o !== e && d2(o.x, o.y, e.x, e.y) < 82);
          if (n) n.virus = Math.max(n.virus, 5);
        }
        if (e.hp <= 0) this._killE(e);
      }
    });
    if (this.boss && this.boss.virus > 0) { this.boss.virus -= dt; this.boss.hp -= 0.55 * dt; }

    // Dead timers
    for (let i = this.DEAD_EYES.length - 1; i >= 0; i--) {
      this.DEAD_EYES[i].deadTimer--;
      if (this.DEAD_EYES[i].deadTimer <= 0) this.DEAD_EYES.splice(i, 1);
    }

    // Enemy AI
    for (let i = this.EYES.length - 1; i >= 0; i--) {
      const e = this.EYES[i];
      if (e.hp <= 0) { this._killE(e); continue; }
      if (e.spawnAnim > 0) e.spawnAnim -= dt * 3;
      if (e.frozen > 0) { e.frozen -= dt; if (e.hitFlash > 0) e.hitFlash -= dt; continue; }
      if (e.hitFlash > 0) e.hitFlash -= dt;
      // Type behaviours
      if (e.t === 'cloaker') {
        e.cloakTimer -= dt;
        if (e.cloakTimer <= 0) { e.cloaking = !e.cloaking; e.cloakTimer = e.cloaking ? 3 : 2; }
        e.al = e.cloaking ? 0.07 : 1;
      }
      if (e.t === 'berser' && e.hp < e.maxHp * 0.5 && !e.berserk) { e.berserk = true; e.spd *= 2; e.col = '#FF0000'; }
      if (e.t === 'teleport') {
        e.teleTimer -= dt;
        if (e.teleTimer <= 0) { e.x = Math.random() * this.WW; e.y = Math.random() * this.WH; e.teleTimer = 4 + Math.random() * 3; this._burst(e.x, e.y, '#44FFFF', 8, 45); }
      }
      if (e.t === 'necro') {
        e.necroTimer -= dt;
        if (e.necroTimer <= 0) {
          e.necroTimer = 8;
          if (this.DEAD_EYES.length > 0) { const dead = this.DEAD_EYES.shift(); this._spawnAt(dead.x, dead.y, dead.t || 'normal', this.wave); this._burst(dead.x, dead.y, '#CC00FF', 10, 55); }
        }
      }
      if (e.t === 'shooter' || e.t === 'doppel') {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 1.8 + Math.random() * 2;
          const sdx = this.px - e.x, sdy = this.py - e.y, sd = Math.hypot(sdx, sdy) || 1;
          this.EPROJS.push({ x: e.x, y: e.y, vx: sdx / sd * 185, vy: sdy / sd * 185, r: 5, col: e.col, life: 3 });
        }
      }
      // Movement + separation
      const tdx = this.px - e.x, tdy = this.py - e.y, td = Math.hypot(tdx, tdy) || 1;
      let sx = 0, sy = 0;
      for (const o of this.EYES) {
        if (o === e) continue;
        const sd = d2(e.x, e.y, o.x, o.y);
        if (sd < 32 && sd > 0) { sx += (e.x - o.x) / sd; sy += (e.y - o.y) / sd; }
      }
      e.vx += (tdx / td * e.spd - e.vx) * Math.min(1, 4.5 * dt); e.vx += sx * 90 * dt;
      e.vy += (tdy / td * e.spd - e.vy) * Math.min(1, 4.5 * dt); e.vy += sy * 90 * dt;
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.x = Math.max(0, Math.min(this.WW, e.x)); e.y = Math.max(0, Math.min(this.WH, e.y));
      // Obstacle bounce
      for (const o of OBSTACLES) {
        const cx = Math.max(o.x, Math.min(o.x + o.w, e.x)); const cy = Math.max(o.y, Math.min(o.y + o.h, e.y));
        const dst = d2(e.x, e.y, cx, cy);
        if (dst < e.sz && dst > 0) { const nx = (e.x - cx) / dst, ny = (e.y - cy) / dst; e.x = cx + nx * (e.sz + 1); e.y = cy + ny * (e.sz + 1); e.vx += nx * 120; e.vy += ny * 120; }
      }
      // Hit player
      if (this.invincible <= 0 && !this.ghostActive && !this.empShieldActive && d2(e.x, e.y, this.px, this.py) < e.sz + 12) this._hurtPlayer();
    }

    // Enemy projectiles
    for (let i = this.EPROJS.length - 1; i >= 0; i--) {
      const p = this.EPROJS[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.x < 0 || p.x > this.WW || p.y < 0 || p.y > this.WH) { this.EPROJS.splice(i, 1); continue; }
      if (!this.empShieldActive && this.invincible <= 0 && !this.ghostActive && d2(p.x, p.y, this.px, this.py) < p.r + 11) { this.EPROJS.splice(i, 1); this._hurtPlayer(); }
    }

    // Boss AI
    if (this.boss) {
      if (this.boss.hitFlash > 0) this.boss.hitFlash -= dt;
      if (this.boss.frozen > 0) { this.boss.frozen -= dt; }
      else {
        if (this.boss.hp < this.boss.maxHp * 0.5 && this.boss.phase === 1) {
          this.boss.phase = 2; this.boss.spd *= 1.55; this.boss.shootTimer /= 2;
          SFX.boss(); showMsg('PHASE 2', 'Critical System Override');
        }
        this.boss.angle = (this.boss.angle || 0) + dt * (this.boss.phase === 2 ? 1.4 : 0.8);
        const bdx = this.px - this.boss.x, bdy = this.py - this.boss.y, bd = Math.hypot(bdx, bdy) || 1;
        this.boss.x += bdx / bd * this.boss.spd * dt; this.boss.y += bdy / bd * this.boss.spd * dt;
        this.boss.x = Math.max(40, Math.min(this.WW - 40, this.boss.x));
        this.boss.y = Math.max(40, Math.min(this.WH - 40, this.boss.y));
        this.boss.shootTimer -= dt;
        if (this.boss.shootTimer <= 0) {
          this.boss.shootTimer = this.boss.phase === 2 ? 0.75 : 1.3;
          const cnt = this.boss.phase === 2 ? 5 : 3;
          for (let a = 0; a < cnt; a++) {
            const ang = a / cnt * Math.PI * 2 + this.boss.angle;
            this.EPROJS.push({ x: this.boss.x, y: this.boss.y, vx: Math.cos(ang) * 210, vy: Math.sin(ang) * 210, r: 9, col: '#FF2200', life: 3.5 });
          }
        }
        if (d2(this.boss.x, this.boss.y, this.px, this.py) < this.boss.sz + 14 && this.invincible <= 0) this._hurtPlayer();
      }
    }

    // Particles
    for (let i = this.PARTS.length - 1; i >= 0; i--) {
      const p = this.PARTS[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 58 * dt; p.life -= dt;
      if (p.life <= 0) this.PARTS.splice(i, 1);
    }
    // Beams
    for (let i = this.BEAMS.length - 1; i >= 0; i--) { this.BEAMS[i].life -= dt; if (this.BEAMS[i].life <= 0) this.BEAMS.splice(i, 1); }
    // Floats
    for (let i = this.FLOATS.length - 1; i >= 0; i--) {
      const f = this.FLOATS[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt;
      if (f.life <= 0) this.FLOATS.splice(i, 1);
    }

    this._updateEnemyCount();

    // Wave end condition
    if (!this.betweenWaves) {
      const bossWave = this.wave % 5 === 0;
      if (bossWave ? this.boss === null : (this.EYES.length === 0 && !this.boss)) this._endWave();
    } else {
      this.betweenTimer -= dt;
      if (this.betweenTimer <= 0 && !this.skillModal && !this.shopModal) this._startWave(this.wave + 1);
    }
  }

  // ─── Render
  _T() { return Date.now() / 1000; }

  _render() {
    const ctx = this.ctx;
    const { W, H, DPR, camX, camY, lW, lH } = this;
    ctx.save();
    // Screen shake
    if (this.shakeAmt > 0.4) {
      ctx.translate((Math.random() - 0.5) * this.shakeAmt * DPR, (Math.random() - 0.5) * this.shakeAmt * DPR);
    }
    const M = MAPS[this.mapIdx];
    // BG
    ctx.fillStyle = M.bg; ctx.fillRect(0, 0, W, H);
    // Grid
    ctx.strokeStyle = M.gc; ctx.lineWidth = 1;
    const gs = 44 * DPR;
    const offX2 = ((-camX * DPR % gs) + gs) % gs;
    const offY2 = ((-camY * DPR % gs) + gs) % gs;
    for (let x = offX2; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = offY2; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Map extras
    const t2 = this._T();
    if (this.mapIdx === 0 || this.mapIdx === 3 || this.mapIdx === 4) {
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 12)) return;
        const a = s.a * (0.6 + 0.4 * Math.sin(t2 * s.tw + s.phase));
        ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), s.r * DPR, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      });
    }
    if (this.mapIdx === 1) {
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 12)) return;
        ctx.globalAlpha = s.a * 0.65; ctx.fillStyle = '#aaccff';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), s.r * DPR, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      });
    }
    if (this.mapIdx === 2) {
      BLDGS.forEach(b => {
        if (!onScreen(b.x, this.WH - b.h, b.w + 20)) return;
        ctx.fillStyle = 'rgba(255,0,80,0.05)'; ctx.fillRect(wx(b.x), wy(this.WH - b.h), b.w * DPR, b.h * DPR);
        ctx.strokeStyle = 'rgba(255,0,80,0.15)'; ctx.lineWidth = 1; ctx.strokeRect(wx(b.x), wy(this.WH - b.h), b.w * DPR, b.h * DPR);
      });
    }
    if (this.mapIdx === 5) {
      ctx.strokeStyle = 'rgba(255,30,0,0.07)'; ctx.lineWidth = 1;
      WEB_LINES.forEach(l => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 250)) return;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
      });
    }

    // Ambient particles
    ctx.shadowBlur = 8;
    AMBIENT.forEach(a => {
      if (!onScreen(a.x, a.y, 10)) return;
      const pulse = a.a * (0.5 + 0.5 * Math.sin(t2 * 1.5 + a.phase));
      ctx.globalAlpha = pulse; ctx.fillStyle = a.col; ctx.shadowColor = a.col;
      ctx.beginPath(); ctx.arc(wx(a.x), wy(a.y), a.r * DPR, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    });
    ctx.shadowBlur = 0;

    // Obstacles
    OBSTACLES.forEach(o => {
      if (!onScreen(o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h))) return;
      ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(wx(o.x), wy(o.y), o.w * DPR, o.h * DPR);
      ctx.strokeStyle = M.ac; ctx.lineWidth = 1; ctx.strokeRect(wx(o.x), wy(o.y), o.w * DPR, o.h * DPR);
      ctx.fillStyle = M.sc;
      [[o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(wx(cx2), wy(cy2), 2.5 * DPR, 0, Math.PI * 2); ctx.fill();
      });
    });

    // Black hole
    if (this.bhActive) {
      const bx2 = wx(this.bhX), by2 = wy(this.bhY);
      const g = ctx.createRadialGradient(bx2, by2, 0, bx2, by2, 135 * DPR);
      g.addColorStop(0, 'rgba(0,0,0,0.97)'); g.addColorStop(0.35, 'rgba(80,0,190,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx2, by2, 135 * DPR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(150,0,255,0.45)'; ctx.lineWidth = 1;
      for (let r = 22; r < 135; r += 28) { ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.arc(bx2, by2, r * DPR, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }

    // Nuke explosion
    if (this.nukeRad > 5) {
      const nx2 = wx(this.nukeX), ny2 = wy(this.nukeY);
      const g = ctx.createRadialGradient(nx2, ny2, 0, nx2, ny2, this.nukeRad * DPR);
      g.addColorStop(0, 'rgba(255,240,100,0.9)'); g.addColorStop(0.4, 'rgba(255,80,0,0.5)'); g.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx2, ny2, this.nukeRad * DPR, 0, Math.PI * 2); ctx.fill();
    }
    if (this.nukeCharging) {
      ctx.strokeStyle = 'rgba(255,68,0,0.65)'; ctx.lineWidth = 2; ctx.setLineDash([9, 5]);
      ctx.beginPath(); ctx.arc(wx(this.nukeX), wy(this.nukeY), 58 * DPR, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }

    // Wave ring
    if (this.waveRing) {
      const p2 = 1 - this.waveRingTimer / 0.55;
      ctx.strokeStyle = WPNS[4].col + '88'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(wx(this.waveRingX), wy(this.waveRingY), p2 * 210 * DPR, 0, Math.PI * 2); ctx.stroke();
    }

    // Chain lightning
    ctx.shadowBlur = 14; ctx.shadowColor = '#FFFF00';
    this.chainSegs.forEach(s => {
      ctx.strokeStyle = 'rgba(255,255,80,' + (this.chainLife / 0.5 * 0.9) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(wx(s.x1), wy(s.y1)); ctx.lineTo(wx(s.x2), wy(s.y2)); ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Beams
    this.BEAMS.forEach(b => {
      const a = b.life / b.maxLife;
      ctx.globalAlpha = a * 0.9; ctx.strokeStyle = b.col; ctx.lineWidth = b.lw * DPR;
      ctx.shadowBlur = 22; ctx.shadowColor = b.col;
      ctx.beginPath(); ctx.moveTo(wx(b.x1), wy(b.y1)); ctx.lineTo(wx(b.x2), wy(b.y2)); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });

    // Enemy projectiles
    this.EPROJS.forEach(p => {
      if (!onScreen(p.x, p.y, 22)) return;
      ctx.fillStyle = p.col; ctx.shadowBlur = 12; ctx.shadowColor = p.col;
      ctx.beginPath(); ctx.arc(wx(p.x), wy(p.y), p.r * DPR, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    });

    // Boss HP bar (canvas top)
    if (this.boss) {
      const bw2 = lW * 0.6 * DPR, bx2 = (W - bw2) / 2, by2 = 8 * DPR;
      ctx.fillStyle = 'rgba(255,0,0,0.15)'; ctx.fillRect(bx2, by2, bw2, 7 * DPR);
      const hpPct = this.boss.hp / this.boss.maxHp;
      const hcol = hpPct > 0.5 ? '#FF4400' : hpPct > 0.25 ? '#FF8800' : '#FF0000';
      ctx.fillStyle = hcol; ctx.shadowBlur = 12; ctx.shadowColor = hcol;
      ctx.fillRect(bx2, by2, bw2 * hpPct, 7 * DPR); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,80,80,0.7)'; ctx.font = (8 * DPR) + 'px monospace'; ctx.textAlign = 'center';
      ctx.fillText('BOSS  PHASE ' + this.boss.phase + '  —  ' + Math.ceil(this.boss.hp) + ' HP', W / 2, by2 - 3 * DPR);
      // Boss shape
      const bxe = wx(this.boss.x), bye = wy(this.boss.y), bs = this.boss.sz * DPR;
      ctx.save(); ctx.translate(bxe, bye); ctx.rotate(this.boss.angle || 0);
      if (this.boss.hitFlash > 0) { ctx.shadowBlur = 60; ctx.shadowColor = '#FFFFFF'; ctx.strokeStyle = '#FFFFFF'; }
      else { ctx.shadowBlur = 50; ctx.shadowColor = '#FF0000'; ctx.strokeStyle = '#FF2200'; }
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * bs, Math.sin(a) * bs); }
      ctx.closePath(); ctx.stroke();
      if (this.boss.phase === 2) {
        ctx.strokeStyle = 'rgba(255,140,0,0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + this.boss.angle * 0.4; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * bs * 1.45, Math.sin(a) * bs * 1.45); }
        ctx.closePath(); ctx.stroke();
      }
      ctx.restore(); ctx.shadowBlur = 0;
    }

    // Enemies
    this.EYES.forEach(e => {
      if (!onScreen(e.x, e.y, e.sz + 14)) return;
      const sa = e.spawnAnim > 0 ? Math.max(0.1, 1 - e.spawnAnim) : 1;
      ctx.save(); ctx.translate(wx(e.x), wy(e.y)); ctx.scale(sa, sa);
      ctx.globalAlpha = e.al * (e.frozen > 0 ? 0.6 : 1) * (e.spawnAnim > 0 ? sa : 1);
      const col = e.hitFlash > 0 ? '#FFFFFF' : (e.frozen > 0 ? '#88FFFF' : (e.virus > 0 ? '#44FF00' : (e.berserk ? '#FF0000' : e.col)));
      ctx.fillStyle = col;
      ctx.shadowBlur = e.t === 'necro' ? 35 : 15; ctx.shadowColor = e.hitFlash > 0 ? '#FFFFFF' : e.col;
      const er = e.sz * DPR;
      ctx.beginPath();
      if (e.t === 'tank') {
        ctx.rect(-er, -er, er * 2, er * 2);
      } else if (e.t === 'necro') {
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); }
        ctx.closePath();
      } else if (e.t === 'elite') {
        for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 - Math.PI / 4; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); }
        ctx.closePath();
      } else if (e.t === 'teleport') {
        for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, er, 0, Math.PI * 2);
      }
      ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      ctx.restore();
      // HP bar
      if (e.maxHp > 1) {
        const ex2 = wx(e.x), ey2 = wy(e.y), er2 = e.sz * DPR;
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(ex2 - er2, ey2 - er2 - 8 * DPR, er2 * 2, 4 * DPR);
        ctx.fillStyle = e.col; ctx.fillRect(ex2 - er2, ey2 - er2 - 8 * DPR, er2 * 2 * (e.hp / e.maxHp), 4 * DPR);
      }
      if (e.cloaking) { ctx.strokeStyle = 'rgba(255,68,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(wx(e.x), wy(e.y), (e.sz + 5) * DPR, 0, Math.PI * 2); ctx.stroke(); }
      if (e.frozen > 0) { ctx.strokeStyle = 'rgba(136,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(wx(e.x), wy(e.y), (e.sz + 3) * DPR, 0, Math.PI * 2); ctx.stroke(); }
    });

    // Particles
    this.PARTS.forEach(p => {
      if (!onScreen(p.x, p.y, 12)) return;
      ctx.globalAlpha = p.life * 0.9; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(wx(p.x), wy(p.y), p.r * DPR, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    });

    // Dash trail
    this.dashTrail.forEach(t => {
      ctx.globalAlpha = t.life / 0.22 * 0.45;
      ctx.fillStyle = SKINS[this.skinIdx]; ctx.shadowBlur = 8; ctx.shadowColor = SKINS[this.skinIdx];
      const plx2 = wx(t.x), ply2 = wy(t.y), ps = 10 * DPR;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 6; ctx[i ? 'lineTo' : 'moveTo'](plx2 + Math.cos(a) * ps, ply2 + Math.sin(a) * ps); }
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });

    // Player
    const plx = wx(this.px), ply = wy(this.py), ps = 12 * DPR;
    const pBlink = this.ghostActive && Math.floor(this._T() * 10) % 2 === 0;
    ctx.globalAlpha = pBlink ? 0.22 : 1;
    const pCol = this.empShieldActive ? '#00FFFF' : SKINS[this.skinIdx];
    ctx.shadowBlur = this.empShieldActive ? 40 : 24; ctx.shadowColor = pCol;
    ctx.fillStyle = pCol;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 6; ctx[i ? 'lineTo' : 'moveTo'](plx + Math.cos(a) * ps, ply + Math.sin(a) * ps); }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    // Ability auras
    if (this.empShieldActive) { ctx.strokeStyle = 'rgba(0,255,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(plx, ply, (24 + this.empShieldTimer * 5) * DPR, 0, Math.PI * 2); ctx.stroke(); }
    if (this.overclockActive)  { ctx.strokeStyle = 'rgba(255,255,0,0.35)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(plx, ply, (20 + Math.sin(this._T() * 8) * 4) * DPR, 0, Math.PI * 2); ctx.stroke(); }
    if (this.timeWarpActive)   { ctx.strokeStyle = 'rgba(180,100,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(plx, ply, (24 + this.timeWarpTimer * 6) * DPR, 0, Math.PI * 2); ctx.stroke(); }

    // Cursor crosshair
    const csx = wx(this.wMX), csy = wy(this.wMY);
    const cc = WPNS[this.wpnIdx].col;
    ctx.strokeStyle = cc + '88'; ctx.lineWidth = 1.5;
    const ch = 9 * DPR;
    ctx.beginPath(); ctx.moveTo(csx - ch, csy); ctx.lineTo(csx + ch, csy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(csx, csy - ch); ctx.lineTo(csx, csy + ch); ctx.stroke();
    ctx.strokeStyle = cc + '55'; ctx.beginPath(); ctx.arc(csx, csy, 5 * DPR, 0, Math.PI * 2); ctx.stroke();

    // Weather overlays
    if (this.weather === 'FOG') {
      const fg = ctx.createRadialGradient(this.mx * DPR, this.my * DPR, 60 * DPR, this.mx * DPR, this.my * DPR, Math.min(W, H) * 0.7);
      fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,0.86)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
    }
    if (this.weather === 'DATA_RAIN') {
      ctx.strokeStyle = MAPS[this.mapIdx].sc + '44'; ctx.lineWidth = 1;
      this.rainDrops.forEach(r => { ctx.beginPath(); ctx.moveTo(r.x * DPR, r.y * DPR); ctx.lineTo(r.x * DPR, (r.y + r.len) * DPR); ctx.stroke(); });
    }
    if (this.empToggle && this.weather === 'EMP') { ctx.fillStyle = 'rgba(255,200,0,0.04)'; ctx.fillRect(0, 0, W, H); }

    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.min(W, H) * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

    // Flash
    if (this.flashAlpha > 0) { ctx.fillStyle = 'rgba(255,255,255,' + this.flashAlpha + ')'; ctx.fillRect(0, 0, W, H); }

    // Chromatic aberration
    if (this.chromAberr > 0.05) {
      ctx.globalAlpha = this.chromAberr * 0.18;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,0,1)'; ctx.fillRect(-4 * this.chromAberr * DPR, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,255,1)'; ctx.fillRect(4 * this.chromAberr * DPR, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }

    // Floating damage numbers
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.FLOATS.forEach(f => {
      if (!onScreen(f.x, f.y, 50)) return;
      ctx.globalAlpha = f.life;
      ctx.shadowBlur = 10; ctx.shadowColor = f.col; ctx.fillStyle = f.col;
      const sz = Math.max(10, 12 + Math.round((1 - f.life) * 4));
      ctx.font = `800 ${sz * DPR}px 'JetBrains Mono',monospace`;
      ctx.fillText(f.text, wx(f.x), wy(f.y));
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });

    // Watermark
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#BF00FF';
    ctx.font = (10 * DPR) + 'px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('K-PERCEPTION', W - 14 * DPR, H - 14 * DPR); ctx.globalAlpha = 1;

    ctx.restore();
  }

  _renderMiniMap() {
    renderMM({
      mctx:      this.mctx,
      WW:        this.WW,
      WH:        this.WH,
      OBSTACLES,
      DEAD_EYES: this.DEAD_EYES,
      EPROJS:    this.EPROJS,
      EYES:      this.EYES,
      boss:      this.boss,
      px:        this.px,
      py:        this.py,
      camX:      this.camX,
      camY:      this.camY,
      lW:        this.lW,
      lH:        this.lH,
      skinIdx:   this.skinIdx,
      SKINS,
      mapIdx:    this.mapIdx,
    });
  }
}
