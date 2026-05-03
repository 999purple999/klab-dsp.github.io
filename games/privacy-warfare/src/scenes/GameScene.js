// ─── GameScene ────────────────────────────────────────────────────────────────
// Fat controller scene: owns ALL mutable game state and all game logic.
// Pure structural refactor of the original monolithic IIFE.

import { SFX, getAC } from '../audio/AudioManager.js';
import { renderPlayer } from '../entities/PlayerVisual.js';
import { MAPS, STARS, BLDGS, WEB_LINES, AMBIENT, OBSTACLES, TRAPS,
         buildMapAssets, buildObstacles, buildTraps, resolveObstaclePos,
         INTERACTIVES, buildInteractives,
         PORTALS, CONVEYOR_ZONES, MOVING_OBSTACLES, buildGeometry,
         SECRETS, buildSecrets } from '../mapgen/MapData.js';
import { renderBiomeExtras, renderBiomeObstacle } from '../mapgen/BiomeRenderer.js';
import { WPNS, BASE_CD, BASE_DMG, BASE_RNG, BASE_AMMO } from '../entities/Weapon/WeaponDefinitions.js';
import { WEAPON_CATALOG_BY_ID } from '../entities/Weapon/WeaponCatalog.js';
import { GADGETS } from '../ui/LoadoutModal.js';
import { setCameraState, wx, wy, onScreen, d2,
         camX as _camX, camY as _camY, lW as _lW, lH as _lH,
         WW as _WW, WH as _WH, DPR as _DPR } from '../rendering/Camera.js';
import * as Camera from '../rendering/Camera.js';
import { updateHpHud, setWpn, updateScore, updateCredits, showMsg, showStreak,
         updateWave, updateEnemyCount, updateWeather, updateAbilityUI,
         updateWeaponCD, updateCombo, updateStyleMeter } from '../ui/HUD.js';
import { renderMM } from '../ui/MiniMap.js';
import { getHiScore, setHiScore, getCredits, setCredits } from '../data/Storage.js';
import { MasterySystem } from '../data/MasterySystem.js';
import { Progression }   from '../data/Progression.js';
import { BaseEnemy }    from '../entities/Enemy/BaseEnemy.js';
import { Architect }         from '../entities/Boss/Architect.js';
import { DataSpectre }       from '../entities/Boss/DataSpectre.js';
import { CoreGuardian }      from '../entities/Boss/CoreGuardian.js';
import { VoidWeaver }        from '../entities/Boss/VoidWeaver.js';
import { SystemAdmin }       from '../entities/Boss/SystemAdmin.js';
import { FirewallColossus }  from '../entities/Boss/FirewallColossus.js';
import { HydraProtocol }     from '../entities/Boss/HydraProtocol.js';
import { DataLeviathan }     from '../entities/Boss/DataLeviathan.js';
import { QuantumOverlord }   from '../entities/Boss/QuantumOverlord.js';
import { PrivacyEater }      from '../entities/Boss/PrivacyEater.js';

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
  // Wave A new types
  mosquito: { col: '#FF88FF', sz:  6, hp: 1, spd: 140, pts:  25 },
  hawk:     { col: '#FF2200', sz: 18, hp: 4, spd:  40, pts:  80 },
  bouncer:  { col: '#FFAA00', sz: 11, hp: 2, spd:   0, pts:  45 },
  leech:    { col: '#1A0033', sz:  8, hp: 2, spd: 150, pts:  60 },
  trojan:   { col: '#00FFCC', sz: 10, hp: 4, spd:  60, pts:  70 },
  mirage:   { col: '#AAAAFF', sz: 12, hp: 5, spd:  55, pts:  90 },
  zeryday:  { col: '#FF00FF', sz: 14, hp: 6, spd:  45, pts: 100 },
  crawler:  { col: '#CC8800', sz: 14, hp: 3, spd:  55, pts:  50 },
  broker:   { col: '#00FF88', sz: 10, hp: 2, spd: 120, pts:  80 },
  corrupted:{ col: '#8800CC', sz: 13, hp: 3, spd:  70, pts:  55 },
  // Wave C new types
  hornet:   { col: '#FFCC00', sz: 10, hp: 2, spd:  90, pts:  30 },
  dropper:  { col: '#FF6600', sz: 14, hp: 3, spd:  25, pts:  45 },
  sentry:   { col: '#00FFCC', sz: 16, hp: 6, spd:   0, pts:  70 },
  wraith:   { col: '#AA44FF', sz:  9, hp: 2, spd:  95, pts:  55 },
  zealot:   { col: '#FFFFFF', sz: 12, hp: 3, spd:  50, pts:  65 },
  kiddie:   { col: '#FF2288', sz:  7, hp: 1, spd: 120, pts:  15 },
  icecannon:{ col: '#88EEFF', sz: 15, hp: 4, spd:   0, pts:  60 },
  goblin:   { col: '#44CC44', sz: 11, hp: 2, spd:  75, pts:  40 },
  glitch:   { col: '#FF44AA', sz: 12, hp: 3, spd:  60, pts:  75 },
  titan:    { col: '#8888AA', sz: 22, hp:10, spd:  20, pts:  90 },
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
    this.sprintTimer = 0; // Shift sprint boost
    this._isFiring = false;
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
    this.AMMO_PKUPS = [];
    this.HP_PKUPS   = [];

    // loadout
    this.loadoutWpns  = [0, 1];    // two equipped weapon indices
    this.loadoutGads  = ['bomb', 'kp']; // two equipped gadget keys
    this.wpnAmmo      = {};        // ammo by weapon index
    this.ammoPkupTimer = 0;        // countdown to next random spawn

    // boss
    this.boss = null;

    // weapons
    this.WPNS    = WPNS;
    this.wpnIdx  = 0;
    this.wpnCDs  = new Array(WPNS.length).fill(0);
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

    this.mastery     = new MasterySystem();
    this.progression = new Progression();
    this.vortexList     = [];
    this.timeLoopProjs  = [];
    this.drones         = [];
    this.CORRUPT_ZONES  = []; // { x, y, r, pulse }
    this._biomeState     = {}; // per-biome ephemeral gameplay state
    this._timeBubbleActive = false;
    this._ddosTriggered = false;
    this.paused         = false;

    // Style Meter + Overdrive
    this.styleMeter      = 0;   // 0–100
    this.overdriveActive = false;
    this.overdriveTimer  = 0;
    this._baseSpeed      = 260; // stored to restore after overdrive

    // Kill-cam slow-mo
    this._timeScale      = 1;
    this._timeScaleTimer = 0;
  }

  // ─── Loadout (called before startGame) ─────────────────────────────────────
  // wpnSlots: array of catalog weapon IDs (strings) or legacy WPNS indices (numbers)
  setLoadout(wpnSlots, gadSlots) {
    // Map catalog IDs → WPNS indices by weapon class
    const CLASS_TO_IDX = { assault:0, smg:1, shotgun:2, lmg:3, sniper:4, marksman:5, pistol:6, special:7 };
    this.loadoutCatalogIds = (wpnSlots || []).filter(Boolean);
    this.loadoutWpns = this.loadoutCatalogIds.map(slot => {
      if (typeof slot === 'number') return slot;  // legacy numeric index
      const def = WEAPON_CATALOG_BY_ID[slot];
      return def ? (CLASS_TO_IDX[def.weaponClass] ?? 0) : 0;
    }).filter(i => i >= 0 && i < WPNS.length);
    // Deduplicate (two weapons of same class both map to same WPNS index)
    this.loadoutWpns = [...new Set(this.loadoutWpns)];
    if (!this.loadoutWpns.length) this.loadoutWpns = [0];
    this.loadoutGads = (gadSlots || []).filter(Boolean);
    // Fill ammo for each selected weapon
    this.wpnAmmo = {};
    this.loadoutWpns.forEach(i => { this.wpnAmmo[i] = BASE_AMMO[i] ?? 80; });
    // Set active weapon to slot 0
    if (this.loadoutWpns.length > 0) this.wpnIdx = this.loadoutWpns[0];
    // Update gadget HUD
    this._updateGadgetHUD();
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

  startGame(startWave = 1) {
    this.running = true;
    this.paused = false;
    this.score = 0; this.wave = 0; this.combo = 1; this.comboTimer = 0; this.credits = getCredits() + 50;
    this.hp = 3; this.maxHp = 3; this.speed = 260; this.killStreak = 0; this.streakTimer = 0;
    this.ghostActive = false; this.invincible = 0; this.dashTimer = 0; this.dashTrail = [];
    this.overclockActive = false; this.empShieldActive = false; this.timeWarpActive = false;
    this.abCDs = { bomb: 0, kp: 0, dash: 0, overclock: 0, empshield: 0, timewarp: 0 };
    this.abilityCDMult = 1; this.ghostBonusTime = 0; this.comboDecayMult = 1; this.chainExtraTargets = 0;
    this.EYES.length = 0; this.PARTS.length = 0; this.BEAMS.length = 0;
    this.EPROJS.length = 0; this.DEAD_EYES.length = 0; this.FLOATS.length = 0;
    this.AMMO_PKUPS.length = 0; this.HP_PKUPS.length = 0; this.ammoPkupTimer = 8;
    this.vortexList.length = 0; this.timeLoopProjs.length = 0; this.drones.length = 0; this.CORRUPT_ZONES.length = 0; this._ddosTriggered = false;
    this.styleMeter = 0; this.overdriveActive = false; this.overdriveTimer = 0;
    this.boss = null; this.bhActive = false; this.nukeCharging = false; this.nukeRad = 0; this.chainSegs = [];
    WPNS.forEach((w, i) => { if (i < BASE_CD.length) { w.cd = BASE_CD[i]; w.dmg = BASE_DMG[i]; w.rng = BASE_RNG[i]; } });
    this.wpnCDs.fill(0); this.skinIdx = 0;
    this.wpnIdx = this.loadoutWpns.length > 0 ? this.loadoutWpns[0] : 0;
    // Reset ammo for loadout weapons
    this.wpnAmmo = {};
    this.loadoutWpns.forEach(i => { this.wpnAmmo[i] = BASE_AMMO[i] ?? 80; });
    this._updateGadgetHUD();
    this.camX = (this.WW - this.lW) / 2; this.camY = (this.WH - this.lH) / 2;
    this.px = this.WW / 2; this.py = this.WH / 2;
    this.mapIdx = 0; this.nextMapIdx = 1;
    this._syncCamera();
    updateHpHud(this.hp, this.maxHp);
    updateScore(0);
    updateCredits(this.credits);
    setWpn(this.wpnIdx, WPNS);
    this._updateAmmoHUD();
    document.getElementById('shield-bar-wrap').style.display = 'none';
    document.getElementById('nuke-charge').style.display = 'none';
    document.getElementById('ov-score').style.display = 'none';
    document.getElementById('ov-hi').style.display = 'none';
    this._startWave(startWave);
  }

  startCampaignLevel(waveNum) { this.startGame(waveNum); }

  gameOver() {
    this.running = false;
    this.hiScore = getHiScore();
    if (this.score > this.hiScore) { this.hiScore = this.score; setHiScore(this.score); }
    setCredits(this.credits);
    document.dispatchEvent(new CustomEvent('pw:gameover', {
      detail: { score: this.score, wave: this.wave, hiScore: this.hiScore }
    }));
  }

  // ─── Wave management
  _startWave(wv) {
    this.wave = wv; this.betweenWaves = false;
    this.EYES.length = 0; this.boss = null; this.EPROJS.length = 0;
    this._biomeState = {}; // reset per-biome state each wave
    this.mapIdx = this.nextMapIdx;
    // Recolor ambient particles to match the new biome
    AMBIENT.forEach(a => { a.col = MAPS[this.mapIdx].sc; });
    buildObstacles(wv, this.WW, this.WH, this.mapIdx);
    buildTraps(wv, this.WW, this.WH);
    buildInteractives(wv, this.WW, this.WH);
    buildGeometry(wv, this.WW, this.WH);
    buildSecrets(wv, this.WW, this.WH, this.mapIdx);
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
    // Spawn corruption zones every 3 waves (1-2 zones)
    this.CORRUPT_ZONES.length = 0;
    if (wv >= 3 && wv % 3 === 0) {
      const zcount = 1 + Math.floor(wv / 6);
      for (let i = 0; i < zcount; i++) {
        this.CORRUPT_ZONES.push({
          x: 100 + Math.random() * (this.WW - 200),
          y: 100 + Math.random() * (this.WH - 200),
          r: 90 + Math.random() * 60,
          pulse: 0,
        });
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
    this.mastery.setStat('maxWave', this.wave);
    const leveled = this.progression.addXP(100);
    if (leveled) setTimeout(() => showMsg('LEVEL UP', 'Rank ' + this.progression.level), 200);
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
    // Wave A new types
    add('mosquito', 3, 12); add('crawler', 4, 8); add('bouncer', 5, 7);
    add('hawk', 5, 5); add('leech', 6, 6); add('broker', 6, 5);
    add('trojan', 7, 4); add('mirage', 7, 4); add('zeryday', 8, 3); add('corrupted', 8, 4);
    // Wave C new types
    add('hornet', 3, 10); add('dropper', 4, 6); add('glitch', 4, 7);
    add('goblin', 5, 6); add('wraith', 5, 5); add('kiddie', 3, 14);
    add('zealot', 6, 5); add('sentry', 6, 4); add('icecannon', 7, 4); add('titan', 8, 3);
    let tot = pool.reduce((s, p) => s + p.w, 0), r = Math.random() * tot;
    for (const p of pool) { r -= p.w; if (r <= 0) return p.k; }
    return 'normal';
  }

  _makeEnemy(x, y, type, wv) {
    return new BaseEnemy(x, y, { type, ...EDEFS[type] }, wv);
  }

  _enemyTypeBehavior(e, dt) {
    // ── Original types ──────────────────────────────────────────────────────────
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
    // ── Wave A new types ────────────────────────────────────────────────────────

    // MOSQUITO: no special, speed handled by EDEFS; just leave base movement

    // CRAWLER: charges at player every 3.5s
    if (e.t === 'crawler') {
      if (e.chargeActive) {
        e.vx = e.chargeDX * 400; e.vy = e.chargeDY * 400;
        e.chargeTimer -= dt;
        if (e.chargeTimer <= 0) { e.chargeActive = false; e.chargeTimer = 3 + Math.random() * 2; }
      } else {
        e.chargeTimer -= dt;
        if (e.chargeTimer <= 0) {
          const cdx = this.px - e.x, cdy = this.py - e.y, cd = Math.hypot(cdx, cdy) || 1;
          e.chargeDX = cdx / cd; e.chargeDY = cdy / cd;
          e.chargeActive = true; e.chargeTimer = 1.2;
          this._burst(e.x, e.y, '#CC8800', 6, 50);
        }
      }
    }

    // BOUNCER: bounces off world walls, accelerates, splits at 5 bounces
    if (e.t === 'bouncer') {
      if (!e.bounceDir) {
        const a = Math.random() * Math.PI * 2;
        e.bounceDir = { x: Math.cos(a), y: Math.sin(a) };
        e.bounceSpd = 120;
      }
      e.bounceSpd = Math.min(e.bounceSpd + 18 * dt, 340);
      // Keep spd = bounceSpd so base steering target matches our direction (prevents damping)
      e.spd = e.bounceSpd;
      e.vx = e.bounceDir.x * e.bounceSpd; e.vy = e.bounceDir.y * e.bounceSpd;
      if (e.x <= e.sz) { e.bounceDir.x = Math.abs(e.bounceDir.x); e.bounceCount++; this._burst(e.x, e.y, '#FFAA00', 4, 40); }
      if (e.x >= this.WW - e.sz) { e.bounceDir.x = -Math.abs(e.bounceDir.x); e.bounceCount++; this._burst(e.x, e.y, '#FFAA00', 4, 40); }
      if (e.y <= e.sz) { e.bounceDir.y = Math.abs(e.bounceDir.y); e.bounceCount++; this._burst(e.x, e.y, '#FFAA00', 4, 40); }
      if (e.y >= this.WH - e.sz) { e.bounceDir.y = -Math.abs(e.bounceDir.y); e.bounceCount++; this._burst(e.x, e.y, '#FFAA00', 4, 40); }
      if (e.bounceCount >= 5 && !e._splitDone) {
        e._splitDone = true;
        this._spawnAt(e.x + 12, e.y, 'normal', this.wave);
        this._spawnAt(e.x - 12, e.y, 'normal', this.wave);
        e.hp = 0; this._killE(e); return;
      }
    }

    // HAWK: fires sustained laser beam every 4-6s; hits player once per 1.5s while active
    if (e.t === 'hawk') {
      if (e.laserActive) {
        e.laserHoldTime -= dt;
        e._laserDmgTimer = (e._laserDmgTimer || 0) - dt;
        const dist = Math.hypot(this.px - e.x, this.py - e.y);
        this._addBeam(e.x, e.y, this.px, this.py, '#FF2200', 0.04, 2);
        if (dist < 320 && e._laserDmgTimer <= 0) { this._hurtPlayer(); e._laserDmgTimer = 1.5; }
        if (e.laserHoldTime <= 0) { e.laserActive = false; e.laserTimer = 4 + Math.random() * 2; e._laserDmgTimer = 0; }
      } else {
        e.laserTimer -= dt;
        if (e.laserTimer <= 0) { e.laserActive = true; e.laserHoldTime = 1.8; }
      }
    }

    // LEECH: dashes into player, attaches, drains credits; detaches if player dashes
    if (e.t === 'leech') {
      const ldx = this.px - e.x, ldy = this.py - e.y, ld = Math.hypot(ldx, ldy);
      if (ld < 18) {
        // Attached: drain credits, slow player
        e.stealTimer -= dt;
        if (e.stealTimer <= 0) {
          e.stealTimer = 1;
          this.credits = Math.max(0, this.credits - 8);
          updateCredits(this.credits);
          this._spawnFloat(e.x, e.y - 12, '-8¢', '#1A0033');
        }
        e.x = this.px; e.y = this.py - 14; e.vx = 0; e.vy = 0;
        // detach on dash
        if (this.ghostActive) { e.x += (Math.random() - 0.5) * 60; e.y += (Math.random() - 0.5) * 60; }
      }
    }

    // TROJAN: disguised as ammo pickup; reveals at 80px
    if (e.t === 'trojan') {
      if (!e.revealed) {
        e.spd = 0; // freeze in place
        e.vx = 0; e.vy = 0;
        const tdx = this.px - e.x, tdy = this.py - e.y;
        if (Math.hypot(tdx, tdy) < 80) { e.revealed = true; e.spd = EDEFS.trojan.spd; this._burst(e.x, e.y, '#00FFCC', 10, 55); showMsg('TROJAN!', 'It\'s a trap — it\'s alive!', 1200); }
      }
    }

    // MIRAGE: spawns 4 ghost clones that track with it (rendered separately)
    if (e.t === 'mirage') {
      if (!e.copies) {
        e.copies = Array.from({ length: 4 }, (_, i) => {
          const a = i / 4 * Math.PI * 2;
          return { ox: Math.cos(a) * 55, oy: Math.sin(a) * 55 };
        });
      }
    }

    // ZERYDAY: tracks which weapon index hits it; gains immunity after 3 hits from same weapon
    // Immunity logic is in _damageE override below

    // BROKER: steals credits at range, flees when <50% HP
    if (e.t === 'broker') {
      e.stealTimer -= dt;
      if (e.stealTimer <= 0) {
        e.stealTimer = 4 + Math.random() * 2;
        const bd = Math.hypot(this.px - e.x, this.py - e.y);
        if (bd < 240) {
          const stolen = Math.min(20, this.credits);
          this.credits -= stolen; updateCredits(this.credits);
          this._spawnFloat(e.x, e.y - 14, '-' + stolen + '¢', '#00FF88');
          this._burst(e.x, e.y, '#00FF88', 5, 40);
        }
      }
      // Flee to nearest edge when below 50% HP
      if (e.hp < e.maxHp * 0.5) {
        const toEdgeX = e.x < this.WW / 2 ? -1 : 1;
        const toEdgeY = e.y < this.WH / 2 ? -1 : 1;
        e.vx += toEdgeX * 300 * dt; e.vy += toEdgeY * 300 * dt;
      }
    }

    // CORRUPTED: pulses DoT aura on player, buffs nearby normal enemies
    if (e.t === 'corrupted') {
      e._auraDmgTimer = (e._auraDmgTimer || 0) - dt;
      const cd = Math.hypot(this.px - e.x, this.py - e.y);
      if (cd < 55 && e._auraDmgTimer <= 0) { this._hurtPlayer(); e._auraDmgTimer = 2.0; }
      // Buff nearby enemies once
      if (!e._buffApplied) {
        for (const o of this.EYES) {
          if (o === e) continue;
          if (Math.hypot(o.x - e.x, o.y - e.y) < 80 && !o.corrupted) {
            o.corrupted = true; o.spd *= 1.25; o.col = '#CC44FF';
          }
        }
        e._buffApplied = true;
        setTimeout(() => { if (e) e._buffApplied = false; }, 3000);
      }
    }

    // ── Wave C new types ──────────────────────────────────────────────────────────

    // HORNET: burst-fires 5 projectiles every 2.5s while strafing
    if (e.t === 'hornet') {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 2.2 + Math.random() * 0.8;
        const dx = this.px - e.x, dy = this.py - e.y, d = Math.hypot(dx, dy) || 1;
        const perp = { x: -dy / d, y: dx / d };
        for (let b = -2; b <= 2; b++) {
          const spread = b * 0.12;
          const c = Math.cos(spread), s = Math.sin(spread);
          const bx = dx / d * c - dy / d * s, by = dx / d * s + dy / d * c;
          this.EPROJS.push({ x: e.x, y: e.y, vx: bx * 170, vy: by * 170, r: 4, col: '#FFCC00', life: 2.5 });
        }
        // Strafe perpendicular
        e.vx += perp.x * 200; e.vy += perp.y * 200;
      }
    }

    // DROPPER: hovers above player, drops slow bombs every 4s
    if (e.t === 'dropper') {
      const targetY = this.py - 160;
      e.vy += (targetY - e.y) * 1.5 * dt;
      e.vy = Math.max(-50, Math.min(50, e.vy));
      e.stealTimer -= dt;
      if (e.stealTimer <= 0) {
        e.stealTimer = 3.5 + Math.random();
        this.EPROJS.push({ x: e.x + (Math.random() - 0.5) * 40, y: e.y, vx: 0, vy: 70, r: 12, col: '#FF6600', life: 3.5 });
      }
    }

    // GLITCH: micro-teleports every 0.6s, fires in random direction
    if (e.t === 'glitch') {
      e._glitchTimer = (e._glitchTimer || 0) - dt;
      if (e._glitchTimer <= 0) {
        e._glitchTimer = 0.55 + Math.random() * 0.15;
        e.x += (Math.random() - 0.5) * 32; e.y += (Math.random() - 0.5) * 32;
        e.x = Math.max(e.sz, Math.min(this.WW - e.sz, e.x));
        e.y = Math.max(e.sz, Math.min(this.WH - e.sz, e.y));
        this._burst(e.x, e.y, '#FF44AA', 3, 30);
      }
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 1.2 + Math.random();
        const a = Math.atan2(this.py - e.y, this.px - e.x) + (Math.random() - 0.5) * 1.2;
        this.EPROJS.push({ x: e.x, y: e.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, r: 5, col: '#FF44AA', life: 3 });
      }
    }

    // GOBLIN: hides underground (invisible 3s), then bursts up at player position
    if (e.t === 'goblin') {
      if (!e._goblinState) e._goblinState = 'hunt';
      if (e._goblinState === 'hunt') {
        e.chargeTimer -= dt;
        if (e.chargeTimer <= 0) {
          e._goblinState = 'underground'; e.chargeTimer = 3;
          e.al = 0; e.vx = 0; e.vy = 0;
          // Mark emerge target
          e._emergeX = this.px + (Math.random() - 0.5) * 50;
          e._emergeY = this.py + (Math.random() - 0.5) * 50;
        }
      } else {
        e.chargeTimer -= dt; e.spd = 0;
        if (e.chargeTimer <= 0) {
          e._goblinState = 'hunt'; e.chargeTimer = 3 + Math.random() * 2;
          e.x = e._emergeX; e.y = e._emergeY; e.al = 1; e.spd = EDEFS.goblin.spd;
          this._burst(e.x, e.y, '#44CC44', 14, 80);
          if (Math.hypot(this.px - e.x, this.py - e.y) < 55) this._hurtPlayer();
        }
      }
    }

    // WRAITH: semi-transparent, steals credits on contact, phases through briefly
    if (e.t === 'wraith') {
      e.al = 0.32 + 0.18 * Math.sin(this._T() * 4);
      const wd = Math.hypot(this.px - e.x, this.py - e.y);
      if (wd < 20) {
        e.stealTimer -= dt;
        if (e.stealTimer <= 0) {
          e.stealTimer = 2.5;
          const stolen = Math.min(30, this.credits);
          this.credits -= stolen; updateCredits(this.credits);
          this._spawnFloat(e.x, e.y - 12, '-' + stolen + '¢', '#AA44FF');
          this._burst(e.x, e.y, '#AA44FF', 8, 55);
        }
      }
    }

    // ZEALOT: seeks most-wounded nearby enemy and heals it
    if (e.t === 'zealot') {
      e._zealotTimer = (e._zealotTimer || 0) - dt;
      if (e._zealotTimer <= 0) {
        e._zealotTimer = 2;
        // Find most wounded nearby enemy
        let target = null, worstFrac = 1;
        for (const o of this.EYES) {
          if (o === e) continue;
          const frac = o.hp / o.maxHp;
          if (frac < worstFrac && Math.hypot(o.x - e.x, o.y - e.y) < 160) { target = o; worstFrac = frac; }
        }
        if (target) {
          target.hp = Math.min(target.maxHp, target.hp + 3);
          this._addBeam(e.x, e.y, target.x, target.y, '#FFFFFF', 0.25, 2);
          this._burst(target.x, target.y, '#FFFFFF', 5, 25);
        }
      }
    }

    // KIDDIE: fast swarm; DDoS call if 4+ kiddies survive 10s
    if (e.t === 'kiddie') {
      e._kiddieAge = (e._kiddieAge || 0) + dt;
    }
    // DDoS check (once per frame, outside individual behavior)
    if (e.t === 'kiddie' && !this._ddosTriggered) {
      const alive = this.EYES.filter(x => x.t === 'kiddie');
      if (alive.length >= 4 && alive.every(k => (k._kiddieAge || 0) >= 10)) {
        this._ddosTriggered = true;
        showMsg('DDoS ATTACK!', '8 enemy surge incoming!', 2000);
        for (let i = 0; i < 8; i++) this._spawnRandom(this.wave);
        setTimeout(() => { this._ddosTriggered = false; }, 15000);
      }
    }

    // SENTRY: stationary rapid fire + berserk spiral every 10s
    if (e.t === 'sentry') {
      e.spd = 0; e.vx = 0; e.vy = 0;
      if (!e._sentryMode) e._sentryMode = 'fire';
      if (e._sentryMode === 'fire') {
        e.shootTimer -= dt;
        e._sentryBerserkCd = (e._sentryBerserkCd || 10) - dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 0.25;
          const dx = this.px - e.x, dy = this.py - e.y, d = Math.hypot(dx, dy) || 1;
          this.EPROJS.push({ x: e.x, y: e.y, vx: dx / d * 200, vy: dy / d * 200, r: 4, col: '#00FFCC', life: 2.5 });
        }
        if (e._sentryBerserkCd <= 0) { e._sentryMode = 'berserk'; e._sentryBerserkTimer = 3; e._sentryBerserkAngle = 0; }
      } else if (e._sentryMode === 'berserk') {
        e._sentryBerserkTimer -= dt; e._sentryBerserkAngle += dt * 6;
        if (e._sentryBerserkTimer % 0.08 < dt) {
          const a = e._sentryBerserkAngle;
          this.EPROJS.push({ x: e.x, y: e.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, r: 5, col: '#00FF88', life: 2.5 });
        }
        if (e._sentryBerserkTimer <= 0) { e._sentryMode = 'overheat'; e._sentryBerserkCd = 7; e._sentryOverheatTimer = 3; }
      } else {
        e._sentryOverheatTimer -= dt;
        if (e._sentryOverheatTimer <= 0) e._sentryMode = 'fire';
      }
    }

    // ICE CANNON: stationary, fires slow freeze shot every 4s that slows player
    if (e.t === 'icecannon') {
      e.spd = 0; e.vx = 0; e.vy = 0;
      e.laserTimer -= dt;
      if (e.laserTimer <= 0) {
        e.laserTimer = 3.5 + Math.random();
        const dx = this.px - e.x, dy = this.py - e.y, d = Math.hypot(dx, dy) || 1;
        this.EPROJS.push({ x: e.x, y: e.y, vx: dx / d * 90, vy: dy / d * 90, r: 10, col: '#88EEFF', life: 5, freeze: true });
      }
    }

    // TITAN: huge slow tank, fires single homing projectile every 5s
    if (e.t === 'titan') {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 4.5 + Math.random();
        const dx = this.px - e.x, dy = this.py - e.y, d = Math.hypot(dx, dy) || 1;
        this.EPROJS.push({ x: e.x, y: e.y, vx: dx / d * 100, vy: dy / d * 100, r: 9, col: '#8888AA', life: 6, seek: true, dmg: 2 });
      }
    }
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
    const BOSS_CLASSES = [Architect, DataSpectre, CoreGuardian, VoidWeaver, SystemAdmin, FirewallColossus, HydraProtocol, DataLeviathan, QuantumOverlord, PrivacyEater];
    const BossClass = BOSS_CLASSES[(Math.floor(wv / 5) - 1) % BOSS_CLASSES.length];
    this.boss = new BossClass(this.WW / 2, this.WH * 0.22, wv);
    SFX.boss();
    // Boss spawn glitch
    this.flashAlpha = 0.55; this.chromAberr = 2.2; this.shakeAmt = 28;
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

  _damageE(e, dmg, big, wpnIdx) {
    if (!e || e.hp <= 0) return;
    // Zeryday immunity: track hits per weapon; block after 3 from same weapon
    if (e.t === 'zeryday' && wpnIdx !== undefined) {
      e.immuneHits[wpnIdx] = (e.immuneHits[wpnIdx] || 0) + 1;
      if (e.immuneHits[wpnIdx] > 3) {
        this._burst(e.x, e.y, '#FF00FF', 4, 30);
        this._spawnFloat(e.x, e.y - 12, 'IMMUNE', '#FF00FF');
        return;
      }
    }
    e.hp -= dmg; e.hitFlash = 0.13;
    SFX.hit();
    if (big) this._burst(e.x, e.y, e.col, 8, 35);
    if (e.hp <= 0) this._killE(e);
  }

  _hurtBoss(dmg) {
    if (!this.boss) return;
    // PrivacyEater absorb: intercept damage during absorb window
    if (this.boss.absorbProjectile && this.boss.absorbProjectile()) {
      this._spawnFloat(this.boss.x + (Math.random() - 0.5) * 40, this.boss.y - 30, 'ABSORBED', '#FF88CC');
      return;
    }
    this.boss.takeDamage(dmg); SFX.bossHit();
    this._spawnFloat(this.boss.x + (Math.random() - 0.5) * 40, this.boss.y - 40, '-' + dmg.toFixed(1), '#FF5555');
    if (!this.boss.alive) this._killBoss();
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
    if (e.t === 'necro')       this._burst(e.x, e.y, '#CC00FF', 20, 90);
    else if (e.t === 'tank')   this._burst(e.x, e.y, '#FF8800', 22, 80);
    else if (e.t === 'boss')   this._burst(e.x, e.y, '#FF0000', 30, 130);
    else if (e.t === 'hawk')   { this._burst(e.x, e.y, '#FF2200', 18, 95); this._addBeam(e.x, e.y, e.x, e.y - 60, '#FF2200', 0.3, 3); }
    else if (e.t === 'zeryday') this._burst(e.x, e.y, '#FF00FF', 25, 100);
    else if (e.t === 'mirage') { this._burst(e.x, e.y, '#AAAAFF', 20, 75); if (e.copies) e.copies = null; }
    else if (e.t === 'corrupted') this._burst(e.x, e.y, '#8800CC', 22, 85);
    else if (e.t === 'titan')  { this._burst(e.x, e.y, '#8888AA', 30, 110); this._shakeDir(e.x, e.y, 14); }
    else if (e.t === 'glitch') this._burst(e.x, e.y, '#FF44AA', 16, 65);
    else if (e.t === 'zealot') this._burst(e.x, e.y, '#FFFFFF', 14, 55);
    else if (e.t === 'sentry') { this._burst(e.x, e.y, '#00FFCC', 20, 90); this._shakeDir(e.x, e.y, 10); }
    else                       this._burst(e.x, e.y, e.col, 12, 55);
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
    this.mastery.updateStat('kills', 1);
    this.mastery.setStat('maxCombo', Math.floor(this.combo));
    const _leveled = this.progression.addXP(Math.round(pts * 0.5));
    if (_leveled) showMsg('LEVEL UP', 'Rank ' + this.progression.level);
    // Drops on kill: 25% ammo, 6% health
    if (Math.random() < 0.25) this.AMMO_PKUPS.push({ x: e.x, y: e.y, pulse: 0 });
    if (Math.random() < 0.06 && this.hp < this.maxHp) this.HP_PKUPS.push({ x: e.x, y: e.y, pulse: 0 });
    this._addStyle(15);
    // Neural Cluster (mapIdx 14): 20% chance to chain-kill nearest enemy within 120px
    if (this.mapIdx === 14 && Math.random() < 0.20) {
      const linked = this.EYES.find(n => Math.hypot(n.x - e.x, n.y - e.y) < 120);
      if (linked) { this._damageE(linked, linked.hp, true); this._spawnFloat(linked.x, linked.y - 20, 'MIND LINK!', '#CC66FF'); }
    }
    // Kill-cam slow-mo on wave's last kill
    if (this.EYES.length === 0 && !this.betweenWaves && !this.boss) {
      this._timeScale = 0.12; this._timeScaleTimer = 0.45;
    }
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
    this.mastery.updateStat('bossKills', 1);
    this.progression.addXP(500);
    this._addStyle(50);
  }

  // ─── Ammo helpers ─────────────────────────────────────────────────────────
  _collectAmmo() {
    // Restore ~35% base ammo for all carried weapons
    let restored = false;
    this.loadoutWpns.forEach(i => {
      const max = BASE_AMMO[i] ?? 80;
      const add = Math.max(1, Math.floor(max * 0.35));
      if ((this.wpnAmmo[i] ?? max) < max) {
        this.wpnAmmo[i] = Math.min(max, (this.wpnAmmo[i] ?? 0) + add);
        restored = true;
      }
    });
    if (restored) { SFX.kp && SFX.kp(); showMsg('AMMO CACHE', 'Supply Restored', 1000); this._updateAmmoHUD(); }
  }

  _updateAmmoHUD() {
    const el = document.getElementById('wpn-ammo');
    if (!el) return;
    const ammo = this.wpnAmmo[this.wpnIdx];
    if (ammo === undefined) { el.textContent = ''; return; }
    const max = BASE_AMMO[this.wpnIdx] ?? 80;
    el.textContent = ammo + ' / ' + max;
    el.style.color = ammo === 0 ? '#FF2200' : ammo < max * 0.25 ? '#FF8800' : 'rgba(0,255,65,0.7)';
  }

  _updateGadgetHUD() {
    ['f', 'g'].forEach((key, s) => {
      const gadKey = this.loadoutGads[s];
      const g      = GADGETS.find(x => x.key === gadKey);
      const nameEl = document.getElementById('gad-name-' + key);
      if (nameEl) nameEl.textContent = g ? g.name : '—';
      const slotEl = document.getElementById('slot-' + key);
      if (slotEl) {
        slotEl.dataset.gadget = gadKey || '';
        if (g) slotEl.style.setProperty('--gc', g.col);
      }
      // Update mobile label
      const mobEl = document.getElementById('mob-gad-' + s);
      if (mobEl) mobEl.textContent = g ? g.name : 'GADGET';
    });
  }

  // ─── Gadget dispatch — called by Game.js F/G keys ─────────────────────────
  useGadget(slot) {
    const key = this.loadoutGads[slot];
    if (!key) return;
    switch (key) {
      case 'bomb':      this.useBomb();       break;
      case 'kp':        this.useKP();         break;
      case 'dash':      this.useDash();       break;
      case 'overclock': this.useOverclock();  break;
      case 'empshield': this.useEmpShield();  break;
      case 'timewarp':  this.useTimeWarp();   break;
    }
  }

  _hurtPlayer() {
    if (this.invincible > 0 || this.ghostActive || this.empShieldActive) return;
    if ((this._secretDmgReduceTimer || 0) > 0 && Math.random() < 0.75) return;
    this.hp--; updateHpHud(this.hp, this.maxHp); SFX.hurt();
    this.invincible = 1.8 + this.ghostBonusTime;
    this.ghostActive = true; this.ghostTimer = this.invincible;
    this._shakeDir(this.px, this.py, 20); this.flashAlpha = 0.28; this.chromAberr = 0.8;
    if (this.hp <= 0) {
      if ((this._extraLives || 0) > 0) {
        this._extraLives--;
        this.hp = this.maxHp;
        updateHpHud(this.hp, this.maxHp);
        this._spawnFloat(this.px, this.py - 40, '✦ EXTRA LIFE ✦', '#00FF88');
        return;
      }
      this.gameOver();
    }
  }

  // ─── Abilities
  _abCD(k) { return AB_BASE[k] * this.abilityCDMult * (this.overdriveActive ? 0.5 : 1); }

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
    this.EYES.forEach(e => { e.applyFreeze(3.8); });
    if (this.boss) this.boss.applyFreeze(2.5);
    this.shakeAmt = 8; this.flashAlpha = 0.22;
    showMsg('KERNEL PANIC', 'All Threats Frozen');
  }

  useDash() {
    if (this.abCDs.dash > 0 || this.dashTimer > 0 || !this.running) return;
    this.abCDs.dash = this._abCD('dash'); SFX.dash();
    this.dashTimer = 0.35; this.invincible = 0.45; this.dashTrail = [];
    const dx = this.wMX - this.px, dy = this.wMY - this.py, d = Math.hypot(dx, dy) || 1;
    this.dashVX = dx / d * 720; this.dashVY = dy / d * 720;
    this.mastery.updateStat('dashes', 1);
    this._addStyle(20);
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
    this.EYES.forEach(e => { e.applyFreeze(2.5); });
    if (this.boss) this.boss.applyFreeze(2.5);
    showMsg('TIME WARP', 'Reality Suspended');
  }

  // ─── Style Meter
  _addStyle(amount) {
    if (this.overdriveActive) return;
    this.styleMeter = Math.min(100, this.styleMeter + amount);
    if (this.styleMeter >= 100) this._startOverdrive();
  }

  _startOverdrive() {
    this.overdriveActive = true;
    this.overdriveTimer  = 6;
    this.styleMeter      = 100;
    this._baseSpeed      = this.speed;
    this.speed          *= 1.3;
    this.powerMult      *= 1.5;
    showMsg('OVERDRIVE', 'Style at Maximum — Engage');
    this.flashAlpha = 0.3; this.chromAberr = 1;
  }

  _endOverdrive() {
    this.overdriveActive = false;
    this.styleMeter      = 0;
    this.speed           = this._baseSpeed;
    this.powerMult      /= 1.5;
  }

  // ─── Weapons fire
  tryFire() {
    if (this.empToggle && this.weather === 'EMP') return;
    // Ammo check — switch to other loadout weapon if empty
    const ammoLeft = this.wpnAmmo[this.wpnIdx];
    if (ammoLeft !== undefined && ammoLeft <= 0) {
      const other = this.loadoutWpns.find(i => i !== this.wpnIdx && (this.wpnAmmo[i] ?? 1) > 0);
      if (other !== undefined) { this.wpnIdx = other; setWpn(this.wpnIdx, WPNS); this._updateAmmoHUD(); }
      this._isFiring = false; return;
    }
    if (this.wpnCDs[this.wpnIdx] > 0) { this._isFiring = false; return; }
    this._isFiring = true;
    this._fire();
    this.wpnCDs[this.wpnIdx] = WPNS[this.wpnIdx].cd;
    // Consume ammo
    if (this.wpnAmmo[this.wpnIdx] !== undefined) {
      this.wpnAmmo[this.wpnIdx] = Math.max(0, this.wpnAmmo[this.wpnIdx] - 1);
      this._updateAmmoHUD();
    }
  }

  _fire() {
    // Weapons 10-14 have custom mechanics
    switch (this.wpnIdx) {
      case 10: this._firePlasmaVortex(); return;
      case 11: this._fireLaserPrism();   return;
      case 12: this._fireTimeLoop();     return;
      case 13: this._fireDataCorrupt();  return;
      case 14: this._fireDroneSwarm();   return;
    }

    const w = WPNS[this.wpnIdx];
    const dx = this.wMX - this.px, dy = this.wMY - this.py, dist2 = Math.hypot(dx, dy) || 1;
    const ux = dx / dist2, uy = dy / dist2;

    if (w.t === 'pulse') {
      SFX.shoot();
      this._addBeam(this.px, this.py, this.px + ux * w.rng, this.py + uy * w.rng, w.col, 0.12, 2.5);
      this._hitDir(this.px, this.py, ux, uy, w.rng, w.dmg, 16, null, this.wpnIdx);
    } else if (w.t === 'beam') {
      SFX.beam();
      this._addBeam(this.px, this.py, this.px + ux * w.rng, this.py + uy * w.rng, w.col, 0.09, 4);
      this._hitDir(this.px, this.py, ux, uy, w.rng, w.dmg, 12, null, this.wpnIdx);
    } else if (w.t === 'spread') {
      SFX.shoot();
      for (let a = -0.44; a <= 0.45; a += 0.22) {
        const c = Math.cos(a), s = Math.sin(a);
        const bx = ux * c - uy * s, by = ux * s + uy * c;
        this._addBeam(this.px, this.py, this.px + bx * w.rng, this.py + by * w.rng, w.col, 0.14, 2);
        this._hitDir(this.px, this.py, bx, by, w.rng, w.dmg, 15, null, this.wpnIdx);
      }
    } else if (w.t === 'split') {
      SFX.shoot();
      [-0.38, -0.19, 0, 0.19, 0.38].forEach(a => {
        const c = Math.cos(a), s = Math.sin(a);
        const bx = ux * c - uy * s, by = ux * s + uy * c;
        this._addBeam(this.px, this.py, this.px + bx * w.rng, this.py + by * w.rng, w.col, 0.16, 2);
        this._hitDir(this.px, this.py, bx, by, w.rng, w.dmg, 14, null, this.wpnIdx);
      });
    } else if (w.t === 'wave') {
      SFX.shoot();
      this.waveRing = true; this.waveRingTimer = 0.55; this.waveRingX = this.px; this.waveRingY = this.py;
      this.EYES.forEach(e => { if (d2(e.x, e.y, this.px, this.py) < w.rng) this._damageE(e, w.dmg * this.powerMult, false, this.wpnIdx); });
      if (this.boss && d2(this.boss.x, this.boss.y, this.px, this.py) < w.rng) this._hurtBoss(w.dmg * this.powerMult);
      this._burst(this.px, this.py, w.col, 16, w.rng * 0.8); this._shakeDir(this.px, this.py, 5);
    } else if (w.t === 'blackhole') {
      this.bhActive = true; this.bhTimer = 2.4; this.bhX = this.wMX; this.bhY = this.wMY;
      SFX.shoot(); showMsg('BLACK HOLE', 'Gravity Singularity');
    } else if (w.t === 'chain') {
      SFX.shoot();
      const sorted = [...this.EYES].sort((a, b) => d2(a.x, a.y, this.wMX, this.wMY) - d2(b.x, b.y, this.wMX, this.wMY));
      const n = Math.min(3 + this.chainExtraTargets, sorted.length);
      this.chainSegs = []; this.chainLife = 0.5;
      let lx = this.px, ly = this.py;
      sorted.slice(0, n).forEach(t => { this.chainSegs.push({ x1: lx, y1: ly, x2: t.x, y2: t.y }); lx = t.x; ly = t.y; this._damageE(t, w.dmg * this.powerMult, false); });
      if (this.boss) { this.chainSegs.push({ x1: lx, y1: ly, x2: this.boss.x, y2: this.boss.y }); this._hurtBoss(w.dmg * 0.5 * this.powerMult); }
    } else if (w.t === 'cryo') {
      SFX.beam();
      this._addBeam(this.px, this.py, this.px + ux * w.rng, this.py + uy * w.rng, w.col, 0.38, 6);
      this._hitDir(this.px, this.py, ux, uy, w.rng, w.dmg, 18, e => { e.applyFreeze(3.8); e.vx *= 0.08; e.vy *= 0.08; this._burst(e.x, e.y, '#88FFFF', 5, 25); }, this.wpnIdx);
      if (this.boss && d2(this.boss.x, this.boss.y, this.px, this.py) < w.rng) this.boss.applyFreeze(1.6);
    } else if (w.t === 'nuke') {
      this.nukeCharging = true; this.nukeTimer = 2; this.nukeX = this.wMX; this.nukeY = this.wMY;
      document.getElementById('nuke-charge').style.display = 'block';
    } else if (w.t === 'virus') {
      SFX.shoot();
      const t = this.EYES.find(e => d2(e.x, e.y, this.wMX, this.wMY) < e.sz + 14);
      if (t) { t.applyVirus(12); this._damageE(t, w.dmg * this.powerMult, false); }
      else if (this.boss && d2(this.boss.x, this.boss.y, this.wMX, this.wMY) < this.boss.sz + 22) this.boss.applyVirus(7);
    } else if (w.t === 'sniper') {
      this._fireSniperLaser();
    }
  }

  // ── Sniper Rail: piercing red laser — hits all enemies on line simultaneously
  _fireSniperLaser() {
    const w   = WPNS[this.wpnIdx];
    const dx  = this.wMX - this.px, dy = this.wMY - this.py;
    const len = Math.hypot(dx, dy) || 1;
    const ux  = dx / len, uy = dy / len;
    const far = Math.max(this.WW, this.WH) * 1.5;
    const ex  = this.px + ux * far, ey = this.py + uy * far;
    // Three-layer beam: outer glow → mid beam → white core
    this._addBeam(this.px, this.py, ex, ey, w.col, 0.30, 18);
    this._addBeam(this.px, this.py, ex, ey, w.col, 0.22,  7);
    this._addBeam(this.px, this.py, ex, ey, '#FFFFFF',   0.16,  2);
    // Piercing hit — all enemies on the line
    let hits = 0;
    for (const e of this.EYES) {
      if (e.cloaking && Math.random() < 0.65) continue;
      const tx = e.x - this.px, ty = e.y - this.py;
      const proj = tx * ux + ty * uy;
      if (proj < 0) continue;
      const cx = this.px + ux * proj, cy = this.py + uy * proj;
      if (d2(e.x, e.y, cx, cy) < e.sz + 18) {
        this._damageE(e, w.dmg * this.powerMult, true);
        this._burst(e.x, e.y, w.col, 8, 35);
        hits++;
      }
    }
    if (this.boss) {
      const tx = this.boss.x - this.px, ty = this.boss.y - this.py;
      const proj = tx * ux + ty * uy;
      if (proj >= 0) {
        const cx = this.px + ux * proj, cy = this.py + uy * proj;
        if (d2(this.boss.x, this.boss.y, cx, cy) < this.boss.sz + 28) {
          this._hurtBoss(w.dmg * this.powerMult); hits++;
          this._burst(this.boss.x, this.boss.y, w.col, 14, 60);
        }
      }
    }
    SFX.beam();
    this.flashAlpha  = Math.max(this.flashAlpha, 0.2);
    this.chromAberr  = Math.max(this.chromAberr, 1.5);
    this._shakeDir(this.px, this.py, 12);
    if (hits > 1) showMsg('MULTI-KILL', `${hits} TARGETS ELIMINATED`, 1500);
    else showMsg('RAILGUN FIRE', 'PRECISION STRIKE', 1200);
  }

  // ── Plasma Vortex (10): slow pull-orb that explodes after 1.5 s
  _firePlasmaVortex() {
    SFX.shoot();
    this.vortexList.push({ x: this.wMX, y: this.wMY, timer: 1.5 });
    showMsg('PLASMA VORTEX', 'Gravity Singularity');
  }

  // ── Laser Prism (11): beam that bounces off world edges up to 3 times
  _fireLaserPrism() {
    SFX.beam();
    const w = WPNS[11];
    const dx = this.wMX - this.px, dy = this.wMY - this.py, dist = Math.hypot(dx, dy) || 1;
    let ux = dx / dist, uy = dy / dist;
    let ox = this.px, oy = this.py;
    const segLen = w.rng * 0.45;
    for (let b = 0; b < 3; b++) {
      const ex = ox + ux * segLen, ey = oy + uy * segLen;
      this._addBeam(ox, oy, ex, ey, w.col, 0.18, 3);
      this._hitDir(ox, oy, ux, uy, segLen, w.dmg, 12, null, this.wpnIdx);
      // Reflect off world bounds
      let nx = ex, ny = ey;
      if (ex < 40 || ex > this.WW - 40) { ux = -ux; nx = Math.max(40, Math.min(this.WW - 40, ex)); }
      if (ey < 40 || ey > this.WH - 40) { uy = -uy; ny = Math.max(40, Math.min(this.WH - 40, ey)); }
      ox = nx; oy = ny;
    }
  }

  // ── Time Loop (12): projectile that reverses direction after 1 s
  _fireTimeLoop() {
    SFX.shoot();
    const w = WPNS[12];
    const dx = this.wMX - this.px, dy = this.wMY - this.py, dist = Math.hypot(dx, dy) || 1;
    const spd = 380;
    this.timeLoopProjs.push({ x: this.px, y: this.py, vx: dx / dist * spd, vy: dy / dist * spd, timer: 1.0, returning: false, dmg: w.dmg });
  }

  // ── Data Corrupt (13): aggressive virus targeting up to 2 nearby enemies
  _fireDataCorrupt() {
    SFX.shoot();
    const w = WPNS[13];
    const sorted = [...this.EYES].sort((a, b) => d2(a.x, a.y, this.wMX, this.wMY) - d2(b.x, b.y, this.wMX, this.wMY));
    sorted.slice(0, 2).forEach(t => { t.applyVirus(15); this._damageE(t, w.dmg * this.powerMult * 2, false); });
    if (this.boss && d2(this.boss.x, this.boss.y, this.wMX, this.wMY) < this.boss.sz + 30)
      this.boss.applyVirus(10);
  }

  // ── Drone Swarm MK2 (14): deploys 3 orbiting attack drones for 8 s
  _fireDroneSwarm() {
    SFX.shoot();
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2;
      this.drones.push({ x: this.px + Math.cos(ang) * 35, y: this.py + Math.sin(ang) * 35, timer: 8.0, shootCd: 0.4 + i * 0.15 });
    }
    showMsg('DRONE SWARM MK2', '3 Drones Deployed');
  }

  // ─── Trap system
  _updateTraps(dt) {
    const T = this._T();
    for (const tr of TRAPS) {
      if (tr.type === 'laser') {
        tr.active = Math.sin(T * (Math.PI / tr.period) + tr.phase) > 0;
        if (tr.active && this.invincible <= 0 && !this.ghostActive) {
          const inBeam = tr.dir === 'h'
            ? (Math.abs(this.py - tr.y) < 10 && this.px >= tr.x && this.px <= tr.x + tr.len)
            : (Math.abs(this.px - tr.x) < 10 && this.py >= tr.y && this.py <= tr.y + tr.len);
          if (inBeam) this._hurtPlayer();
        }
      } else if (tr.type === 'efield') {
        tr.dmgTimer = (tr.dmgTimer || 0) - dt;
        if (tr.dmgTimer <= 0) {
          tr.dmgTimer = 1.5;
          if (this.px >= tr.x && this.px <= tr.x + tr.w && this.py >= tr.y && this.py <= tr.y + tr.h)
            this._hurtPlayer();
        }
      } else if (tr.type === 'turret') {
        if (tr.dead) continue;
        tr.shootTimer -= dt;
        const tdx = this.px - tr.x, tdy = this.py - tr.y;
        tr.angle = Math.atan2(tdy, tdx);
        if (tr.shootTimer <= 0) {
          tr.shootTimer = tr.shootCd;
          const d = Math.hypot(tdx, tdy) || 1;
          this.EPROJS.push({ x: tr.x, y: tr.y, vx: tdx / d * 165, vy: tdy / d * 165, r: 5, col: '#FF8800', life: 3 });
        }
        // Turret can be destroyed by player weapons — check via _damageE doesn't apply; use direct hit check
        // Turrets die when a projectile (from player) hits them — handled in _hitDir by treating it as a pseudo-enemy
      } else if (tr.type === 'mine') {
        if (!tr.armed) continue;
        if (d2(this.px, this.py, tr.x, tr.y) < 32) {
          tr.armed = false;
          this._burst(tr.x, tr.y, '#FF8800', 18, 180);
          this._shakeDir(tr.x, tr.y, 18);
          this.flashAlpha = 0.3;
          if (d2(this.px, this.py, tr.x, tr.y) < 90 && this.invincible <= 0) this._hurtPlayer();
          this.EYES.forEach(e => { if (d2(e.x, e.y, tr.x, tr.y) < 120) this._damageE(e, 3 * this.powerMult, true); });
          if (this.boss && d2(this.boss.x, this.boss.y, tr.x, tr.y) < 140) this._hurtBoss(3 * this.powerMult);
        }
      } else if (tr.type === 'data_spike') {
        tr.active = Math.sin(T * (Math.PI / tr.period) + tr.phase) > 0.3;
        if (tr.active && this.invincible <= 0 && !this.ghostActive && d2(this.px, this.py, tr.x, tr.y) < tr.r) {
          tr.dmgTimer = (tr.dmgTimer || 0) - dt;
          if (tr.dmgTimer <= 0) { tr.dmgTimer = 1.2; this._hurtPlayer(); }
        }
      } else if (tr.type === 'emp_burst') {
        if (!tr.armed) {
          tr.rearmTimer -= dt;
          if (tr.rearmTimer <= 0) tr.armed = true;
          continue;
        }
        if (d2(this.px, this.py, tr.x, tr.y) < tr.r && this.invincible <= 0) {
          tr.armed = false; tr.rearmTimer = 20;
          this._burst(tr.x, tr.y, '#00FFFF', 20, 120); this._shakeDir(tr.x, tr.y, 10);
          this._spawnFloat(tr.x, tr.y - 40, 'EMP!', '#00FFFF');
          // Disable all ability cooldowns by setting them to max
          const empDur = 4;
          Object.keys(this.abCDs).forEach(k => { this.abCDs[k] = Math.max(this.abCDs[k], empDur); });
        }
      } else if (tr.type === 'vortex_pit') {
        tr.angle = (tr.angle + dt * 2.5) % (Math.PI * 2);
        const pullDist = d2(this.px, this.py, tr.x, tr.y);
        if (pullDist < tr.pullR && !this.ghostActive) {
          const dx = tr.x - this.px, dy = tr.y - this.py, d3 = Math.hypot(dx, dy) || 1;
          const force = (1 - pullDist / tr.pullR) * 120;
          this.px += dx / d3 * force * dt; this.py += dy / d3 * force * dt;
        }
        if (pullDist < tr.r && this.invincible <= 0 && !this.ghostActive) {
          tr.dmgTimer = (tr.dmgTimer || 0) - dt;
          if (tr.dmgTimer <= 0) { tr.dmgTimer = 1.0; this._hurtPlayer(); }
        }
        // Also pull enemies
        this.EYES.forEach(e => {
          const ed = d2(e.x, e.y, tr.x, tr.y);
          if (ed < tr.pullR) { const dx = tr.x - e.x, dy = tr.y - e.y, d3 = Math.hypot(dx, dy) || 1; const f = (1 - ed / tr.pullR) * 80; e.x += dx / d3 * f * dt; e.y += dy / d3 * f * dt; }
        });
      } else if (tr.type === 'time_bubble') {
        if (this.invincible <= 0 && !this.ghostActive && Math.hypot(this.px - tr.x, this.py - tr.y) < tr.r) {
          this.speed = Math.max(70, this.speed * 0.4);
          if (!this._timeBubbleActive) {
            this._timeBubbleActive = true;
            clearTimeout(this._timeBubbleRestore);
            this._timeBubbleRestore = setTimeout(() => { this.speed = this._baseSpeed; this._timeBubbleActive = false; }, 1800);
          }
        }
      } else if (tr.type === 'acid_pool') {
        tr.pulse = (tr.pulse + dt * 2.2) % (Math.PI * 2);
        tr.dmgTimer = (tr.dmgTimer || 0) - dt;
        if (tr.dmgTimer <= 0) {
          tr.dmgTimer = 1.2;
          if (this.px >= tr.x && this.px <= tr.x + tr.w && this.py >= tr.y && this.py <= tr.y + tr.h && this.invincible <= 0) this._hurtPlayer();
          // Also hurts enemies in pool
          this.EYES.forEach(e => { if (e.x >= tr.x && e.x <= tr.x + tr.w && e.y >= tr.y && e.y <= tr.y + tr.h) this._damageE(e, 1, false); });
        }
      } else if (tr.type === 'phase_wall') {
        const T2 = this._T();
        tr.active = Math.sin(T2 * (Math.PI / tr.period) + tr.phase) > 0;
        if (tr.active) {
          // Block player movement through wall (push out)
          const dx = this.px - tr.x, dy = this.py - tr.y;
          if (tr.dir === 'h') {
            if (Math.abs(dy) < 10 && this.px >= tr.x && this.px <= tr.x + tr.len && this.invincible <= 0) this._hurtPlayer();
          } else {
            if (Math.abs(dx) < 10 && this.py >= tr.y && this.py <= tr.y + tr.len && this.invincible <= 0) this._hurtPlayer();
          }
        }
      } else if (tr.type === 'noise_trap') {
        tr.pulse = (tr.pulse || 0) + dt * 2;
        if (!tr.armed) { tr.rearmTimer -= dt; if (tr.rearmTimer <= 0) tr.armed = true; continue; }
        if (Math.hypot(this.px - tr.x, this.py - tr.y) < tr.r) {
          tr.armed = false; tr.rearmTimer = 16;
          this._burst(tr.x, tr.y, '#FFAA00', 14, 100); this._spawnFloat(tr.x, tr.y - 40, 'ALERT!', '#FFAA00');
          // Put all nearby enemies into berserk
          this.EYES.forEach(e => { if (Math.hypot(e.x - tr.x, e.y - tr.y) < 250) { e.berserk = true; setTimeout(() => { e.berserk = false; }, 5000); } });
        }
      } else if (tr.type === 'crusher') {
        tr.offset += tr.spd * tr.offsetDir * dt;
        if (tr.offset >= tr.maxOffset || tr.offset <= 0) tr.offsetDir *= -1;
        const cx2 = tr.dir === 'h' ? tr.x + tr.offset : tr.x;
        const cy2 = tr.dir === 'v' ? tr.y + tr.offset : tr.y;
        const cw = tr.dir === 'h' ? tr.len : 18, ch = tr.dir === 'v' ? tr.len : 18;
        if (this.px >= cx2 && this.px <= cx2 + cw && this.py >= cy2 && this.py <= cy2 + ch && this.invincible <= 0) this._hurtPlayer();
        this.EYES.forEach(e => { if (e.x >= cx2 && e.x <= cx2 + cw && e.y >= cy2 && e.y <= cy2 + ch) this._damageE(e, 2, true); });
      } else if (tr.type === 'gravity_pulse') {
        tr.pulseTimer -= dt;
        if (tr.pulseTimer <= 0 && !tr.pulseActive) { tr.pulseActive = true; tr.pulseR = 0; tr.pulseTimer = tr.pulseCd; }
        if (tr.pulseActive) {
          tr.pulseR += 280 * dt;
          if (!this.ghostActive && Math.abs(Math.hypot(this.px - tr.x, this.py - tr.y) - tr.pulseR) < 18) {
            const ndx = this.px - tr.x, ndy = this.py - tr.y, nd = Math.hypot(ndx, ndy) || 1;
            this.px += ndx / nd * 80 * dt; this.py += ndy / nd * 80 * dt;
          }
          if (tr.pulseR > tr.r * 2) tr.pulseActive = false;
        }
      } else if (tr.type === 'laser_mandala') {
        tr.angle = (tr.angle + tr.spd * dt) % (Math.PI * 2);
        const T2 = this._T();
        if (this.invincible <= 0 && !this.ghostActive) {
          for (let arm = 0; arm < tr.arms; arm++) {
            const a = tr.angle + (arm / tr.arms) * Math.PI * 2;
            const dx = Math.cos(a), dy = Math.sin(a);
            for (let d3 = 0; d3 < tr.r; d3 += 8) {
              if (Math.hypot(this.px - (tr.x + dx * d3), this.py - (tr.y + dy * d3)) < 12) { this._hurtPlayer(); break; }
            }
          }
        }
      } else if (tr.type === 'mine_chain') {
        if (!tr.armed) continue;
        if (Math.hypot(this.px - tr.x, this.py - tr.y) < 30) {
          tr.armed = false;
          this._burst(tr.x, tr.y, '#FF8800', 18, 160);
          this._shakeDir(tr.x, tr.y, 18); this.flashAlpha = 0.28;
          if (Math.hypot(this.px - tr.x, this.py - tr.y) < 80 && this.invincible <= 0) this._hurtPlayer();
          this.EYES.forEach(e => { if (Math.hypot(e.x - tr.x, e.y - tr.y) < 120) this._damageE(e, 3, true); });
          // Chain: trigger other mine_chains in range
          TRAPS.forEach(t2 => { if (t2 !== tr && t2.type === 'mine_chain' && t2.armed && Math.hypot(t2.x - tr.x, t2.y - tr.y) < tr.chainR) {
            setTimeout(() => { t2.armed = false; this._burst(t2.x, t2.y, '#FF8800', 14, 120); }, 350);
          }});
        }
      } else if (tr.type === 'pendulum_saw') {
        tr.angle = (tr.angle + tr.spd * dt) % (Math.PI * 2);
        const tipX = tr.x + Math.cos(tr.angle) * tr.len;
        const tipY = tr.y + Math.sin(tr.angle) * tr.len;
        if (this.invincible <= 0 && Math.hypot(this.px - tipX, this.py - tipY) < 18) this._hurtPlayer();
      } else if (tr.type === 'simon_field') {
        tr._timer -= dt;
        if (tr._timer <= 0) { tr._timer = tr._period; tr._activeQ = (tr._activeQ + 1) % 4; }
        tr._dmgTimer -= dt;
        const sfQx = tr.x + (tr._activeQ % 2 === 0 ? -40 : 40);
        const sfQy = tr.y + (tr._activeQ < 2 ? -40 : 40);
        if (this.invincible <= 0 && Math.hypot(this.px - sfQx, this.py - sfQy) < 38 && tr._dmgTimer <= 0) {
          tr._dmgTimer = 0.4; this._hurtPlayer();
        }
      } else if (tr.type === 'pressure_plate') {
        if (!tr.triggered) {
          if (Math.hypot(this.px - tr.x, this.py - tr.y) < 28) { tr.triggered = true; tr._countdown = 1.0; }
        } else {
          tr._countdown -= dt;
          if (tr._countdown <= 0) {
            tr.triggered = false;
            for (let q = 0; q < 8; q++) {
              const qa = (q / 8) * Math.PI * 2;
              this.EPROJS.push({ x: tr.x, y: tr.y, vx: Math.cos(qa) * 160, vy: Math.sin(qa) * 160, r: 5, col: '#FF8800', life: 2 });
            }
            this._burst(tr.x, tr.y, '#FF8800', 10, 100);
          }
        }
      } else if (tr.type === 'corruption_cloud') {
        tr._driftAngle += dt * 0.4;
        tr.x += Math.cos(tr._driftAngle) * tr._driftSpd * dt;
        tr.y += Math.sin(tr._driftAngle) * tr._driftSpd * dt;
        tr.x = Math.max(80, Math.min(this.WW - 80, tr.x));
        tr.y = Math.max(80, Math.min(this.WH - 80, tr.y));
        tr._dmgT -= dt;
        if (Math.hypot(this.px - tr.x, this.py - tr.y) < tr.r && this.invincible <= 0 && tr._dmgT <= 0) {
          tr._dmgT = 0.5; this._hurtPlayer();
        }
      } else if (tr.type === 'reactive_vent') {
        tr._cooldown -= dt;
        if (tr._cooldown <= 0 && Math.hypot(this.px - tr.x, this.py - tr.y) < 60) {
          tr._cooldown = 4;
          this._burst(tr.x, tr.y, '#FFAA00', 14, 70);
          if (this.invincible <= 0) { this.py -= 80; this._shakeDir(tr.x, tr.y, 10); }
        }
      } else if (tr.type === 'laser_mirror') {
        const lmDirs = [
          { x: Math.cos(tr.angle), y: Math.sin(tr.angle) },
          { x: Math.cos(tr.angle + Math.PI * 0.75), y: Math.sin(tr.angle + Math.PI * 0.75) },
        ];
        if (this.invincible <= 0) {
          for (const d4 of lmDirs) {
            const tx4 = this.px - tr.x, ty4 = this.py - tr.y;
            const proj4 = tx4 * d4.x + ty4 * d4.y;
            if (proj4 > 0 && proj4 < tr.len) {
              const cx4 = tr.x + d4.x * proj4, cy4 = tr.y + d4.y * proj4;
              if (Math.hypot(this.px - cx4, this.py - cy4) < 12) { this._hurtPlayer(); break; }
            }
          }
        }
      } else if (tr.type === 'lag_zone') {
        if (Math.hypot(this.px - tr.x, this.py - tr.y) < tr.r) this._lagMult = 0.28;
      } else if (tr.type === 'tp_tile') {
        tr._cd -= dt;
        if (tr._cd <= 0 && Math.hypot(this.px - tr.x, this.py - tr.y) < 24) {
          tr._cd = 8;
          this.px = 200 + Math.random() * (this.WW - 400);
          this.py = 200 + Math.random() * (this.WH - 400);
          showMsg('TELEPORTED', 'Position Scrambled', 1200);
          this._burst(tr.x, tr.y, '#FF00FF', 12, 80);
        }
      }
    }
  }

  _updateInteractives(dt) {
    if (!INTERACTIVES) return;
    for (const iv of INTERACTIVES) {
      iv.pulse = (iv.pulse + dt * 2) % (Math.PI * 2);
      if (iv.cooldown > 0) { iv.cooldown -= dt; continue; }
      const dist = Math.hypot(this.px - iv.x, this.py - iv.y);
      if (dist < iv.r + 20) {
        if (!iv.activating) { iv.activating = true; iv.activateTimer = 1.0; }
        iv.activateTimer -= dt;
        if (iv.activateTimer <= 0) {
          iv.activating = false; iv.cooldown = iv.cdMax;
          this._triggerInteractive(iv);
        }
      } else {
        iv.activating = false; iv.activateTimer = 1.0;
      }
    }
  }

  _triggerInteractive(iv) {
    switch (iv.type) {
      case 'data_terminal':
        const bonus = 50 + Math.floor(Math.random() * 150);
        this.credits += bonus; this._spawnFloat(iv.x, iv.y - 40, '+' + bonus + ' CR', '#00FFCC'); SFX.hit();
        break;
      case 'ammo_depot':
        this.wpnCDs.fill(0); this._spawnFloat(iv.x, iv.y - 40, 'AMMO RELOAD', '#FFCC00'); SFX.hit();
        break;
      case 'health_station':
        this.hp = Math.min(this.maxHp, this.hp + 2); updateHpHud(this.hp, this.maxHp);
        this._spawnFloat(iv.x, iv.y - 40, '+2 HP', '#00FF88'); SFX.hit();
        break;
      case 'jammer_node':
        this.EYES.forEach(e => { e.applyFreeze(6); });
        this._burst(iv.x, iv.y, '#00FF88', 16, 200); this._spawnFloat(iv.x, iv.y - 40, 'JAMMED!', '#00FF88');
        break;
      case 'shield_pylon':
        this.invincible = 4; this._spawnFloat(iv.x, iv.y - 40, 'SHIELD 4s', '#00FFFF'); SFX.hit();
        break;
      case 'decoy_beacon':
        this._decoyActive = true; this._decoyX = iv.x; this._decoyY = iv.y; this._decoyTimer = 5;
        this._spawnFloat(iv.x, iv.y - 40, 'DECOY!', '#FFFF00'); SFX.hit();
        break;
      case 'power_node':
        this.powerMult *= 1.5;
        setTimeout(() => { this.powerMult /= 1.5; }, 5000);
        this._spawnFloat(iv.x, iv.y - 40, 'POWER +50%', '#FF8800'); SFX.hit();
        break;
      case 'firewall_barrier':
        // Push enemies away from iv position
        this.EYES.forEach(e => { const fd = Math.hypot(e.x - iv.x, e.y - iv.y); if (fd < 180) { const fn = (iv.x - e.x) / (fd || 1); e.x -= fn * 120; e.vx -= fn * 200; } });
        this._burst(iv.x, iv.y, '#FF4400', 20, 180); this._spawnFloat(iv.x, iv.y - 40, 'FIREWALL', '#FF4400');
        break;
      case 'overclock_station':
        Object.keys(this.abCDs).forEach(k => { this.abCDs[k] = 0; });
        this._spawnFloat(iv.x, iv.y - 40, 'OVERCLOCK!', '#BF00FF'); SFX.hit();
        break;
      case 'data_cache':
        this.wpnCDs.fill(0); this.credits += 80; updateHpHud(this.hp, this.maxHp);
        this._spawnFloat(iv.x, iv.y - 40, 'DATA CACHE', '#00FFCC'); SFX.hit();
        break;
      case 'data_barrel':
        this._burst(iv.x, iv.y, '#FF8800', 22, 160);
        this.EYES.forEach(e => { if (Math.hypot(e.x - iv.x, e.y - iv.y) < 160) this._damageE(e, 4, true); });
        if (this.boss && Math.hypot(this.boss.x - iv.x, this.boss.y - iv.y) < 160) this._hurtBoss(4 * this.powerMult);
        this._shakeDir(iv.x, iv.y, 16); this.flashAlpha = 0.22;
        this._spawnFloat(iv.x, iv.y - 40, 'BARREL BLAST!', '#FF8800'); SFX.hit();
        break;
      case 'crystal_spike':
        // Summon 6 radial spikes that linger as obstacles for 3s
        for (let q = 0; q < 6; q++) {
          const sa = (q / 6) * Math.PI * 2;
          const sx2 = iv.x + Math.cos(sa) * 60, sy2 = iv.y + Math.sin(sa) * 60;
          this.CORRUPT_ZONES.push({ x: sx2, y: sy2, r: 22, pulse: 0, life: 3 });
        }
        this._spawnFloat(iv.x, iv.y - 40, 'CRYSTAL SPIKE!', '#00EEFF'); SFX.hit();
        break;
      case 'data_cache_hack':
        this.credits += 200 + Math.floor(Math.random() * 150);
        this.powerMult *= 1.25; setTimeout(() => { this.powerMult /= 1.25; }, 6000);
        this._spawnFloat(iv.x, iv.y - 40, 'HACKED! +CR +PWR', '#FF44FF'); SFX.hit();
        break;
      case 'weight_platform':
        // Crushes nearby enemies with downward force and stuns
        this.EYES.forEach(e => { if (Math.hypot(e.x - iv.x, e.y - iv.y) < 120) { e.vy = (e.vy || 0) + 300; this._damageE(e, 2, true); } });
        this._burst(iv.x, iv.y, '#AAAAAA', 18, 120); this._shakeDir(iv.x, iv.y, 12);
        this._spawnFloat(iv.x, iv.y - 40, 'CRUSHING BLOW!', '#AAAAAA'); SFX.hit();
        break;
    }
  }

  _updateGeometry(dt) {
    // Moving obstacles update
    const t2 = this._T();
    if (MOVING_OBSTACLES) {
      MOVING_OBSTACLES.forEach(mo => {
        if (mo.dir === 'h') {
          mo.x = mo.baseX + Math.sin(t2 * (Math.PI * 2 / mo.period) + mo.phase) * mo.amplitude;
        } else {
          mo.y = mo.baseY + Math.sin(t2 * (Math.PI * 2 / mo.period) + mo.phase) * mo.amplitude;
        }
      });
    }

    // Conveyor zones: push player and enemies
    if (CONVEYOR_ZONES) {
      CONVEYOR_ZONES.forEach(cz => {
        cz.pulse = (cz.pulse + dt * 3) % (Math.PI * 2);
        if (this.px >= cz.x && this.px <= cz.x + cz.w && this.py >= cz.y && this.py <= cz.y + cz.h) {
          this.px += cz.dx * dt; this.py += (cz.dy || 0) * dt;
        }
        this.EYES.forEach(e => {
          if (e.x >= cz.x && e.x <= cz.x + cz.w && e.y >= cz.y && e.y <= cz.y + cz.h) {
            e.x += cz.dx * dt; e.y += (cz.dy || 0) * dt;
          }
        });
      });
    }

    // Portals: teleport player and enemies on contact
    if (PORTALS) {
      PORTALS.forEach((p, pi) => {
        p.angle = (p.angle + dt * 2) % (Math.PI * 2);
        if (!p._cd || p._cd <= 0) {
          if (Math.hypot(this.px - p.x, this.py - p.y) < p.r + 10) {
            // Find partner portal
            const partner = PORTALS.find((q, qi) => qi !== pi && q.pairIdx === p.pairIdx);
            if (partner) {
              this.px = partner.x; this.py = partner.y;
              p._cd = 1.5; partner._cd = 1.5;
              this._burst(partner.x, partner.y, p.col, 12, 60);
            }
          }
        } else { p._cd -= dt; }
        // Enemy teleport
        this.EYES.forEach(e => {
          if (!e._portalCd || e._portalCd <= 0) {
            if (Math.hypot(e.x - p.x, e.y - p.y) < p.r + 8) {
              const partner2 = PORTALS.find((q, qi) => qi !== pi && q.pairIdx === p.pairIdx);
              if (partner2) { e.x = partner2.x; e.y = partner2.y; e._portalCd = 1.5; }
            }
          } else { e._portalCd -= dt; }
        });
      });
    }

    // Decoy beacon: enemies target decoy instead of player
    if (this._decoyActive) {
      this._decoyTimer -= dt;
      if (this._decoyTimer <= 0) { this._decoyActive = false; }
    }
  }

  _updateBiomeEffects(dt) {
    const bs = this._biomeState;
    switch (this.mapIdx) {
      case 0: { // CYBER GRID — random sector overloads every 30s
        bs._t0 = (bs._t0 || 30) - dt;
        if (bs._t0 <= 0) {
          bs._t0 = 28 + Math.random() * 18;
          const gx = 100 + Math.random() * (this.WW - 200), gy = 100 + Math.random() * (this.WH - 200);
          this.CORRUPT_ZONES.push({ x: gx, y: gy, r: 65, pulse: 0, life: 5 });
          this._burst(gx, gy, '#BF00FF', 10, 60);
          showMsg('SECTOR OVERLOAD', 'Grid Node Critical', 1500);
        }
        break;
      }
      case 1: { // DEEP SPACE — enemies drift randomly
        if (Math.random() < 0.015) {
          this.EYES.forEach(e => { e.vx += (Math.random() - 0.5) * 25; e.vy += (Math.random() - 0.5) * 25; });
        }
        break;
      }
      case 2: { // NEON CITY — exploding signs every 8-17s
        bs._t2 = (bs._t2 || 10) - dt;
        if (bs._t2 <= 0) {
          bs._t2 = 7 + Math.random() * 10;
          const nx = 120 + Math.random() * (this.WW - 240), ny = 120 + Math.random() * (this.WH - 240);
          this._burst(nx, ny, '#FF0066', 22, 140); this._shakeDir(nx, ny, 8);
          if (Math.hypot(this.px - nx, this.py - ny) < 100 && this.invincible <= 0) this._hurtPlayer();
          this.EYES.forEach(e => { if (Math.hypot(e.x - nx, e.y - ny) < 110) this._damageE(e, 2, true); });
          if (this.boss && Math.hypot(this.boss.x - nx, this.boss.y - ny) < 120) this._hurtBoss(2);
          showMsg('NEON SURGE', 'Sign Detonation!', 1200);
        }
        break;
      }
      case 3: { // DATA STORM — movement slow + damage burst release
        bs._t3 = (bs._t3 || 22) - dt;
        if (bs._t3 <= 0 && !bs._surge) {
          bs._t3 = 22 + Math.random() * 12; bs._surge = true; bs._surgeTimer = 3;
          bs._surgeOrigSpd = this.speed; this.speed = Math.max(60, this.speed * 0.45);
          showMsg('DATA SURGE', 'Network Overload — 3s', 2000); this.flashAlpha = 0.12;
        }
        if (bs._surge) {
          bs._surgeTimer -= dt;
          if (bs._surgeTimer <= 0) {
            bs._surge = false; this.speed = bs._surgeOrigSpd || this._baseSpeed;
            this.EYES.forEach(e => this._damageE(e, 2, true));
            if (this.boss) this._hurtBoss(5);
            this._burst(this.px, this.py, '#00FF64', 20, 200);
            showMsg('SURGE RELEASE', 'Data Shockwave!', 1500);
          }
        }
        break;
      }
      case 4: { // QUANTUM REALM — player quantum jumps every 12-20s
        bs._t4 = (bs._t4 || 12) - dt;
        if (bs._t4 <= 0) {
          bs._t4 = 12 + Math.random() * 8;
          const jx = (Math.random() - 0.5) * 180, jy = (Math.random() - 0.5) * 180;
          this._burst(this.px, this.py, '#AA00FF', 12, 60);
          this.px = Math.max(50, Math.min(this.WW - 50, this.px + jx));
          this.py = Math.max(50, Math.min(this.WH - 50, this.py + jy));
          this._burst(this.px, this.py, '#CC88FF', 12, 50);
          this._spawnFloat(this.px, this.py - 30, 'QUANTUM JUMP', '#AA00FF');
        }
        break;
      }
      case 5: { // DARK WEB — enemies fade invisible unless attacking
        this.EYES.forEach(e => {
          const soonShoot = e.shootTimer !== undefined && e.shootTimer < 0.5;
          if (soonShoot || e.hitFlash > 0 || e.berserk) { e.al = Math.min(1, (e.al || 1) + 3 * dt); }
          else { e.al = Math.max(0.06, (e.al || 1) - 1.5 * dt); }
        });
        break;
      }
      case 6: { // AI NEXUS — auto-overclock speed burst every 15s
        bs._t6 = (bs._t6 || 15) - dt;
        if (bs._t6 <= 0 && !bs._anBoost) {
          bs._t6 = 15 + Math.random() * 8; bs._anBoost = true; bs._anTimer = 3;
          bs._anOrigSpd = this.speed; this.speed = Math.min(this.speed * 1.9, 650);
          showMsg('AI OVERCLOCK', 'Autonomous Speed Boost — 3s', 2000); this.flashAlpha = 0.12;
        }
        if (bs._anBoost) { bs._anTimer -= dt; if (bs._anTimer <= 0) { bs._anBoost = false; this.speed = bs._anOrigSpd || this._baseSpeed; } }
        break;
      }
      case 7: { // CRYO VAULT — ice momentum: dash leaves a slide
        if (this.dashTimer > 0.25 && !bs._iceSlide) {
          bs._iceSlide = true; bs._iceVx = this.dashVX * 0.3; bs._iceVy = this.dashVY * 0.3;
        }
        if (bs._iceSlide) {
          this.px += bs._iceVx * dt; this.py += bs._iceVy * dt;
          bs._iceVx *= (1 - 1.8 * dt); bs._iceVy *= (1 - 1.8 * dt);
          if (Math.abs(bs._iceVx) < 5 && Math.abs(bs._iceVy) < 5) bs._iceSlide = false;
        }
        break;
      }
      case 8: { // INDUSTRIAL WASTE — lava strip rises from bottom periodically
        bs._t8 = (bs._t8 || 35) - dt;
        if (bs._t8 <= 0) {
          bs._t8 = 25 + Math.random() * 18;
          const stripY = this.WH - 80 - Math.random() * 120;
          this.CORRUPT_ZONES.push({ x: this.WW / 2, y: stripY, r: this.WW * 0.7, pulse: 0, life: 10 });
          showMsg('LAVA SURGE', 'Industrial Floor Rising!', 1500); this.flashAlpha = 0.1;
        }
        break;
      }
      case 9: { // BIO-DIGITAL — organic growth randomly expands obstacles
        bs._t9 = (bs._t9 || 22) - dt;
        if (bs._t9 <= 0 && OBSTACLES.length > 0) {
          bs._t9 = 18 + Math.random() * 12;
          const o = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
          o.w = Math.min(o.w + 45, 320); o.h = Math.min(o.h + 30, 220);
          showMsg('BIO-GROWTH', 'Organic Expansion!', 1200);
        }
        break;
      }
      case 10: { // VOID MATRIX — reality glitch teleports all enemies
        bs._t10 = (bs._t10 || 28) - dt;
        if (bs._t10 <= 0) {
          bs._t10 = 20 + Math.random() * 18;
          this.EYES.forEach(e => { this._burst(e.x, e.y, '#CCCCFF', 5, 40); e.x = 100 + Math.random() * (this.WW - 200); e.y = 100 + Math.random() * (this.WH - 200); this._burst(e.x, e.y, '#CCCCFF', 5, 40); });
          showMsg('REALITY GLITCH', 'Enemy Positions Scrambled', 1500); this.flashAlpha = 0.2; this.chromAberr = 1;
        }
        break;
      }
      case 11: { // PHISHING NET — auto-spawn decoys confusing enemies
        bs._t11 = (bs._t11 || 12) - dt;
        if (bs._t11 <= 0 && !this._decoyActive) {
          bs._t11 = 10 + Math.random() * 8;
          this._decoyActive = true;
          this._decoyX = 100 + Math.random() * (this.WW - 200); this._decoyY = 100 + Math.random() * (this.WH - 200);
          this._decoyTimer = 6;
          this._burst(this._decoyX, this._decoyY, '#88FF00', 10, 80);
          showMsg('PHISHING DECOY', 'Enemies Lured — 6s', 1200);
        }
        break;
      }
      case 12: { // OVERCLOCK CORE — thermal heat builds from shooting, jams at 100%
        if (!bs._oh) {
          bs._heat = (bs._heat || 0);
          if (this._isFiring) bs._heat = Math.min(100, bs._heat + 22 * dt);
          else bs._heat = Math.max(0, bs._heat - 10 * dt);
          if (bs._heat >= 100) {
            bs._oh = true; bs._ohTimer = 3;
            this.wpnCDs.fill(3);
            showMsg('THERMAL OVERLOAD', 'Weapons Jammed — Cooling 3s', 2000);
            this.flashAlpha = 0.18; this._burst(this.px, this.py, '#FF8800', 12, 80);
          }
        } else {
          bs._ohTimer -= dt;
          if (bs._ohTimer <= 0) { bs._oh = false; bs._heat = 0; showMsg('COOLED', 'Weapons Online', 900); }
        }
        break;
      }
      case 13: break; // SHADOW PROTOCOL — handled in _render (darkness overlay)
      case 14: break; // NEURAL CLUSTER — mind link handled in _killE
    }
  }

  _updateSecrets(dt) {
    if (!SECRETS.length) return;
    if ((this._secretDmgReduceTimer || 0) > 0) this._secretDmgReduceTimer -= dt;

    for (const s of SECRETS) {
      if (s.found) continue;
      s.pulse += dt;
      const dist = Math.hypot(this.px - s.x, this.py - s.y);

      if (s.type === 'relic') {
        if (dist < 45) {
          s.scanTimer += dt;
          if (s.scanTimer >= s.scanMax) {
            s.found = true;
            this._triggerSecret(s);
            this._spawnFloat(s.x, s.y - 40, '✦ ' + s.name + ' ✦', s.col);
            this._spawnFloat(s.x, s.y - 60, s.lore, '#CCCCCC');
          }
        } else {
          s.scanTimer = Math.max(0, s.scanTimer - dt * 2);
        }
      } else if (dist < 30) {
        s.found = true;
        if (s.type === 'hp_cache') {
          this.hp = Math.min(this.maxHp, this.hp + 1);
          updateHpHud(this.hp, this.maxHp);
          this._spawnFloat(s.x, s.y - 30, '+1 HP CACHE', '#FF4466');
        } else {
          this.loadoutWpns.forEach(i => {
            if (this.wpnAmmo[i] !== undefined)
              this.wpnAmmo[i] = Math.min(BASE_AMMO[i] ?? 80, (this.wpnAmmo[i] ?? 0) + 20);
          });
          this._updateAmmoHUD();
          this._spawnFloat(s.x, s.y - 30, '+AMMO CACHE', '#FFAA00');
        }
      }
    }

    // Allied turrets update
    if (this._allyTurrets?.length) {
      for (let i = this._allyTurrets.length - 1; i >= 0; i--) {
        const at = this._allyTurrets[i];
        at.lifetime = (at.lifetime || 0) + dt;
        if (at.lifetime > 20) { this._allyTurrets.splice(i, 1); continue; }
        let closest = null, closestD = 320;
        for (const e of this.EYES) {
          const ed = Math.hypot(e.x - at.x, e.y - at.y);
          if (ed < closestD) { closest = e; closestD = ed; }
        }
        if (!closest && this.boss) closest = this.boss;
        at.shootTimer = (at.shootTimer || 0) - dt;
        if (at.shootTimer <= 0 && closest) {
          at.shootTimer = 0.65;
          const adx = closest.x - at.x, ady = closest.y - at.y, ad = Math.hypot(adx, ady) || 1;
          if (!this._allyProjs) this._allyProjs = [];
          this._allyProjs.push({ x: at.x, y: at.y, vx: adx/ad*300, vy: ady/ad*300, r: 5, col: at.col, life: 1.8 });
        }
      }
      if (this._allyProjs?.length) {
        for (let i = this._allyProjs.length - 1; i >= 0; i--) {
          const p = this._allyProjs[i];
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          if (p.life <= 0) { this._allyProjs.splice(i, 1); continue; }
          let hit = false;
          for (const e of this.EYES) {
            if (Math.hypot(e.x - p.x, e.y - p.y) < e.sz + p.r) {
              this._damageE(e, 1, true); this._allyProjs.splice(i, 1); hit = true; break;
            }
          }
          if (!hit && this.boss && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < this.boss.sz + p.r) {
            this._hurtBoss(1); this._allyProjs.splice(i, 1);
          }
        }
      }
    }
  }

  _triggerSecret(s) {
    switch (s.effect) {
      case 'xray':        this._xrayMode = true; break;
      case 'freeze_all':
        this.EYES.forEach(e => e.applyFreeze(6));
        if (this.boss) this.boss.applyFreeze(3);
        break;
      case 'credits':
        this.credits += 150; updateCredits(this.credits); break;
      case 'speed_bullets':
        this._speedBulletsTimer = 12; break;
      case 'invincible':
        this.invincible = 8; break;
      case 'kill_all':
        for (const e of [...this.EYES]) this._damageE(e, 99999, true); break;
      case 'turret_ally':
        if (!this._allyTurrets) this._allyTurrets = [];
        if (!this._allyProjs) this._allyProjs = [];
        this._allyTurrets.push({ x: this.px, y: this.py, col: s.col, shootTimer: 0.3, lifetime: 0 });
        break;
      case 'freeze_bullets':
        this.EPROJS.length = 0; break;
      case 'inf_ammo':
        this.loadoutWpns.forEach(i => { if (this.wpnAmmo[i] !== undefined) this.wpnAmmo[i] = BASE_AMMO[i] ?? 80; });
        this._updateAmmoHUD(); break;
      case 'extra_life':
        this._extraLives = (this._extraLives || 0) + 1; break;
      case 'homing':
        this._homingTimer = 20; break;
      case 'health_cache':
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2;
          this.HP_PKUPS.push({ x: this.px + Math.cos(a) * 60, y: this.py + Math.sin(a) * 60, pulse: 0 });
        }
        break;
      case 'lure_enemies':
        this.EYES.forEach(e => {
          const dx = this.px - e.x, dy = this.py - e.y, d = Math.hypot(dx, dy) || 1;
          e.vx = dx / d * 220; e.vy = dy / d * 220; e._lured = 5;
        });
        break;
      case 'damage_reduce':
        this._secretDmgReduceTimer = 10; break;
      case 'invisible':
        this.invincible = 8; this.ghostActive = true; this.ghostTimer = 8; break;
    }
  }

  _renderSecrets(ctx, camX, camY, DPR, t) {
    for (const s of SECRETS) {
      if (s.found) continue;
      const sx = (s.x - camX) * DPR, sy = (s.y - camY) * DPR;
      if (!onScreen(s.x, s.y, 80)) continue;
      const pr = Math.sin(s.pulse * 2.5) * 0.5 + 0.5;
      ctx.save();
      if (s.type === 'relic') {
        const gR = (22 + pr * 16) * DPR;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, gR);
        grad.addColorStop(0, s.col + 'AA'); grad.addColorStop(1, s.col + '00');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(sx, sy, gR, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(sx, sy); ctx.rotate(t * 1.8);
        ctx.strokeStyle = s.col; ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18 + pr * 18; ctx.shadowColor = s.col;
        const ds = (13 + pr * 5) * DPR;
        ctx.beginPath();
        ctx.moveTo(0, -ds); ctx.lineTo(ds * 0.7, 0); ctx.lineTo(0, ds); ctx.lineTo(-ds * 0.7, 0);
        ctx.closePath(); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = s.col + 'CC';
        ctx.shadowBlur = 14; ctx.shadowColor = s.col;
        ctx.beginPath(); ctx.arc(sx, sy, (5 + pr * 2) * DPR, 0, Math.PI * 2); ctx.fill();
        const progress = s.scanTimer / s.scanMax;
        if (progress > 0) {
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
          ctx.shadowBlur = 12; ctx.shadowColor = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(sx, sy, (20 + pr * 5) * DPR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
          ctx.stroke();
          ctx.font = `bold ${8 * DPR}px monospace`;
          ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.shadowBlur = 8; ctx.shadowColor = s.col;
          ctx.fillText('SCANNING...', sx, sy - 24 * DPR);
        }
        if (Math.hypot(this.px - s.x, this.py - s.y) < 200) {
          const alpha2 = Math.min(1, (200 - Math.hypot(this.px - s.x, this.py - s.y)) / 100);
          ctx.globalAlpha = alpha2;
          ctx.font = `bold ${7 * DPR}px monospace`;
          ctx.fillStyle = s.col; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.shadowBlur = 10; ctx.shadowColor = s.col;
          ctx.fillText('◈ ' + s.name + ' ◈', sx, sy + 22 * DPR);
          ctx.globalAlpha = 1;
        }
      } else {
        const col = s.type === 'hp_cache' ? '#FF4466' : '#FFAA00';
        const cs = (s.r + pr * 5) * DPR;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.shadowBlur = 12 + pr * 10; ctx.shadowColor = col;
        ctx.fillStyle = col + '44';
        ctx.beginPath(); ctx.arc(sx, sy, cs, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = `bold ${9 * DPR}px monospace`;
        ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.type === 'hp_cache' ? '+' : '◆', sx, sy);
      }
      ctx.shadowBlur = 0; ctx.restore();
    }
    if (this._allyTurrets?.length) {
      for (const at of this._allyTurrets) {
        const tx2 = (at.x - camX) * DPR, ty2 = (at.y - camY) * DPR;
        ctx.save(); ctx.translate(tx2, ty2);
        ctx.strokeStyle = at.col; ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18; ctx.shadowColor = at.col;
        ctx.fillStyle = at.col + '44';
        ctx.beginPath(); ctx.arc(0, 0, 12 * DPR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = `bold ${7 * DPR}px monospace`;
        ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('T', 0, 0);
        const frac = 1 - (at.lifetime || 0) / 20;
        ctx.fillStyle = at.col;
        ctx.fillRect(-10 * DPR, 15 * DPR, 20 * frac * DPR, 2 * DPR);
        ctx.shadowBlur = 0; ctx.restore();
      }
    }
    if (this._allyProjs?.length) {
      for (const p of this._allyProjs) {
        const px2 = (p.x - camX) * DPR, py2 = (p.y - camY) * DPR;
        ctx.save();
        ctx.fillStyle = p.col; ctx.shadowBlur = 10; ctx.shadowColor = p.col;
        ctx.beginPath(); ctx.arc(px2, py2, p.r * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      }
    }
  }

  _renderInteractives(ctx, camX, camY, DPR) {
    if (!INTERACTIVES) return;
    const T = this._T();
    const TYPE_COLS = {
      data_terminal: '#00FFCC', ammo_depot: '#FFCC00', health_station: '#00FF88',
      jammer_node: '#00FF44', shield_pylon: '#00FFFF', decoy_beacon: '#FFFF00',
      power_node: '#FF8800', firewall_barrier: '#FF4400', overclock_station: '#BF00FF',
      data_cache: '#FF88FF', data_barrel: '#FF6600', crystal_spike: '#00EEFF',
      data_cache_hack: '#FF44FF', weight_platform: '#AAAAAA',
    };
    const TYPE_ICONS = {
      data_terminal: 'TERM', ammo_depot: 'AMMO', health_station: 'HP',
      jammer_node: 'JAM', shield_pylon: 'SHL', decoy_beacon: 'DCY',
      power_node: 'PWR', firewall_barrier: 'FW', overclock_station: 'OC',
      data_cache: 'CACHE', data_barrel: 'BRL', crystal_spike: 'CRYS',
      data_cache_hack: 'HACK', weight_platform: 'WGT',
    };
    INTERACTIVES.forEach(iv => {
      const sx = (iv.x - camX) * DPR, sy = (iv.y - camY) * DPR;
      const col = TYPE_COLS[iv.type] || '#FFFFFF';
      const onCd = iv.cooldown > 0;
      const pulseMod = 1 + 0.1 * Math.sin(iv.pulse);
      const alpha = onCd ? 0.25 : 0.85;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = onCd ? 4 : 18; ctx.shadowColor = col;
      // Outer ring
      ctx.strokeStyle = col; ctx.lineWidth = 2 * DPR;
      ctx.beginPath(); ctx.arc(sx, sy, iv.r * DPR * pulseMod, 0, Math.PI * 2); ctx.stroke();
      // Inner fill
      ctx.fillStyle = col + '22'; ctx.fill();
      // Icon text
      ctx.fillStyle = col; ctx.font = `bold ${6 * DPR}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(TYPE_ICONS[iv.type] || '?', sx, sy);

      // Activating progress arc
      if (iv.activating) {
        const prog = 1 - iv.activateTimer;
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3 * DPR;
        ctx.beginPath(); ctx.arc(sx, sy, (iv.r + 6) * DPR, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
      }
      // Cooldown text
      if (onCd) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `${5 * DPR}px monospace`;
        ctx.fillText(Math.ceil(iv.cooldown) + 's', sx, sy + iv.r * DPR + 8 * DPR);
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      ctx.restore();
    });

    // Portals
    if (PORTALS) {
      PORTALS.forEach(p => {
        const sx = (p.x - camX) * DPR, sy = (p.y - camY) * DPR;
        ctx.save();
        ctx.shadowBlur = 20 * DPR; ctx.shadowColor = p.col;
        ctx.strokeStyle = p.col; ctx.lineWidth = 2.5 * DPR;
        ctx.beginPath(); ctx.arc(sx, sy, p.r * DPR, p.angle, p.angle + Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, p.r * DPR * 0.6, p.angle + Math.PI, p.angle + Math.PI + Math.PI * 1.5); ctx.stroke();
        ctx.fillStyle = p.col + '18'; ctx.beginPath(); ctx.arc(sx, sy, p.r * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      });
    }

    // Conveyor zones
    if (CONVEYOR_ZONES) {
      CONVEYOR_ZONES.forEach(cz => {
        const cx4 = (cz.x - camX) * DPR, cy4 = (cz.y - camY) * DPR;
        ctx.save();
        ctx.fillStyle = `rgba(255,200,0,${0.06 + 0.04 * Math.sin(cz.pulse)})`;
        ctx.fillRect(cx4, cy4, cz.w * DPR, cz.h * DPR);
        ctx.strokeStyle = `rgba(255,200,0,${0.2 + 0.1 * Math.sin(cz.pulse)})`; ctx.lineWidth = DPR;
        ctx.setLineDash([5 * DPR, 5 * DPR]);
        ctx.strokeRect(cx4, cy4, cz.w * DPR, cz.h * DPR);
        ctx.setLineDash([]);
        // Arrow
        const arrowX = cx4 + cz.w * DPR / 2 + Math.sin(cz.pulse) * 6 * DPR;
        ctx.fillStyle = `rgba(255,200,0,0.5)`;
        ctx.font = `${10 * DPR}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(cz.dx > 0 ? '→' : '←', arrowX, cy4 + cz.h * DPR / 2);
        ctx.restore();
      });
    }

    // Moving obstacles
    if (MOVING_OBSTACLES) {
      const M = MAPS[this.mapIdx];
      MOVING_OBSTACLES.forEach(mo => {
        const mx4 = (mo.x - camX) * DPR, my4 = (mo.y - camY) * DPR;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(mx4, my4, mo.w * DPR, mo.h * DPR);
        ctx.strokeStyle = M.ac; ctx.lineWidth = DPR; ctx.strokeRect(mx4, my4, mo.w * DPR, mo.h * DPR);
        ctx.shadowBlur = 8 * DPR; ctx.shadowColor = M.sc;
        ctx.strokeStyle = M.sc; ctx.lineWidth = 0.5 * DPR; ctx.strokeRect(mx4 + 2 * DPR, my4 + 2 * DPR, mo.w * DPR - 4 * DPR, mo.h * DPR - 4 * DPR);
        ctx.shadowBlur = 0; ctx.restore();
      });
    }
  }

  _renderTraps(ctx, camX, camY, DPR) {
    const T = this._T();
    for (const tr of TRAPS) {
      if (tr.type === 'laser') {
        const col = tr.active ? '#FF2244' : 'rgba(255,34,68,0.18)';
        const ex = tr.dir === 'h' ? tr.x + tr.len : tr.x;
        const ey = tr.dir === 'h' ? tr.y : tr.y + tr.len;
        ctx.strokeStyle = col;
        ctx.lineWidth   = tr.active ? 3 * DPR : 1 * DPR;
        ctx.shadowBlur  = tr.active ? 20 : 0;
        ctx.shadowColor = '#FF2244';
        ctx.globalAlpha = tr.active ? 0.9 : 0.35;
        ctx.beginPath();
        ctx.moveTo((tr.x - camX) * DPR, (tr.y - camY) * DPR);
        ctx.lineTo((ex - camX) * DPR, (ey - camY) * DPR);
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        // Emitter nodes at each end
        ctx.fillStyle = '#FF2244'; ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc((tr.x - camX) * DPR, (tr.y - camY) * DPR, 4 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc((ex - camX) * DPR, (ey - camY) * DPR, 4 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (tr.type === 'efield') {
        const pulse = 0.25 + 0.12 * Math.sin(T * 3);
        ctx.fillStyle   = 'rgba(80,200,255,' + pulse + ')';
        ctx.strokeStyle = 'rgba(80,200,255,0.5)';
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 14; ctx.shadowColor = '#50C8FF';
        ctx.fillRect((tr.x - camX) * DPR, (tr.y - camY) * DPR, tr.w * DPR, tr.h * DPR);
        ctx.strokeRect((tr.x - camX) * DPR, (tr.y - camY) * DPR, tr.w * DPR, tr.h * DPR);
        ctx.shadowBlur = 0;
      } else if (tr.type === 'turret' && !tr.dead) {
        const tx2 = (tr.x - camX) * DPR, ty2 = (tr.y - camY) * DPR;
        ctx.save(); ctx.translate(tx2, ty2); ctx.rotate(tr.angle);
        ctx.fillStyle = '#996633'; ctx.strokeStyle = '#FF8800'; ctx.lineWidth = 2;
        ctx.shadowBlur = 14; ctx.shadowColor = '#FF8800';
        ctx.beginPath(); ctx.arc(0, 0, 8 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FF8800'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14 * DPR, 0); ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'mine' && tr.armed) {
        const blink = Math.sin(T * 4 + tr.blinkPhase) > 0;
        ctx.fillStyle   = blink ? '#FF8800' : 'rgba(255,136,0,0.4)';
        ctx.shadowBlur  = blink ? 18 : 4;
        ctx.shadowColor = '#FF8800';
        ctx.beginPath(); ctx.arc((tr.x - camX) * DPR, (tr.y - camY) * DPR, 6 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,136,0,0.2)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc((tr.x - camX) * DPR, (tr.y - camY) * DPR, 32 * DPR, 0, Math.PI * 2); ctx.stroke();
      } else if (tr.type === 'data_spike') {
        const tx2 = (tr.x - camX) * DPR, ty2 = (tr.y - camY) * DPR;
        const spk = tr.active;
        ctx.save();
        ctx.strokeStyle = spk ? '#FF4444' : 'rgba(200,50,50,0.25)';
        ctx.lineWidth   = spk ? 2 : 1;
        ctx.shadowBlur  = spk ? 16 : 0; ctx.shadowColor = '#FF2222';
        for (let s = 0; s < 8; s++) {
          const a = (s / 8) * Math.PI * 2;
          const len = spk ? tr.r * DPR : tr.r * 0.35 * DPR;
          ctx.beginPath();
          ctx.moveTo(tx2 + Math.cos(a) * 5 * DPR, ty2 + Math.sin(a) * 5 * DPR);
          ctx.lineTo(tx2 + Math.cos(a) * len, ty2 + Math.sin(a) * len);
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(tx2, ty2, 5 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = spk ? '#FF2222' : 'rgba(200,50,50,0.4)'; ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'emp_burst') {
        const tx2 = (tr.x - camX) * DPR, ty2 = (tr.y - camY) * DPR;
        const blink2 = tr.armed && Math.sin(T * 2 + tr.blinkPhase) > 0;
        ctx.save();
        ctx.strokeStyle = tr.armed ? (blink2 ? '#00FFFF' : 'rgba(0,255,255,0.3)') : 'rgba(0,255,255,0.08)';
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = tr.armed ? (blink2 ? 20 : 5) : 0; ctx.shadowColor = '#00FFFF';
        ctx.beginPath(); ctx.arc(tx2, ty2, tr.r * DPR, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = tr.armed ? 'rgba(0,255,255,0.06)' : 'rgba(0,255,255,0.02)';
        ctx.fill();
        ctx.beginPath(); ctx.arc(tx2, ty2, 5 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = tr.armed ? '#00FFFF' : 'rgba(0,255,255,0.3)'; ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'vortex_pit') {
        const tx2 = (tr.x - camX) * DPR, ty2 = (tr.y - camY) * DPR;
        ctx.save();
        // Spinning spiral rings
        for (let ring = 0; ring < 3; ring++) {
          const rr = (tr.r * (0.35 + ring * 0.3)) * DPR;
          ctx.beginPath(); ctx.arc(tx2, ty2, rr, tr.angle + ring * 0.8, tr.angle + ring * 0.8 + Math.PI * 1.4);
          ctx.strokeStyle = `rgba(100,0,200,${0.7 - ring * 0.2})`; ctx.lineWidth = (3 - ring) * DPR;
          ctx.shadowBlur = 12; ctx.shadowColor = '#6600CC'; ctx.stroke();
        }
        ctx.fillStyle = 'rgba(40,0,80,0.7)';
        ctx.beginPath(); ctx.arc(tx2, ty2, 8 * DPR, 0, Math.PI * 2); ctx.fill();
        // Pull radius indicator
        ctx.strokeStyle = 'rgba(100,0,200,0.12)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(tx2, ty2, tr.pullR * DPR, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      } else if (tr.type === 'time_bubble') {
        const tbx = (tr.x - camX) * DPR, tby = (tr.y - camY) * DPR;
        const tbPulse = 0.5 + 0.3 * Math.sin(T * 2.5);
        ctx.save();
        ctx.strokeStyle = `rgba(100,100,255,${tbPulse})`; ctx.lineWidth = 2 * DPR;
        ctx.shadowBlur = 14 * DPR; ctx.shadowColor = '#6666FF';
        ctx.beginPath(); ctx.arc(tbx, tby, tr.r * DPR, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(80,80,200,${tbPulse * 0.12})`; ctx.fill();
        ctx.fillStyle = '#AAAAFF'; ctx.font = `${7 * DPR}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('SLOW', tbx, tby);
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'acid_pool') {
        const apx = (tr.x - camX) * DPR, apy = (tr.y - camY) * DPR;
        const acid = 0.15 + 0.1 * Math.sin(tr.pulse);
        ctx.save();
        ctx.fillStyle = `rgba(60,200,0,${acid})`; ctx.fillRect(apx, apy, tr.w * DPR, tr.h * DPR);
        ctx.strokeStyle = `rgba(80,255,0,${acid * 2})`; ctx.lineWidth = DPR; ctx.strokeRect(apx, apy, tr.w * DPR, tr.h * DPR);
        ctx.shadowBlur = 10 * DPR; ctx.shadowColor = '#44FF00';
        // Bubble dots
        for (let bi = 0; bi < 5; bi++) {
          const bx2 = apx + (bi / 5 + Math.sin(T * 1.5 + bi) * 0.08) * tr.w * DPR;
          const by2 = apy + (0.3 + Math.abs(Math.sin(T * 2 + bi * 1.3)) * 0.5) * tr.h * DPR;
          ctx.beginPath(); ctx.arc(bx2, by2, 2.5 * DPR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(120,255,40,0.55)'; ctx.fill();
        }
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'phase_wall') {
        const col2 = tr.active ? '#FF88FF' : 'rgba(255,136,255,0.15)';
        const ex2 = tr.dir === 'h' ? tr.x + tr.len : tr.x;
        const ey2 = tr.dir === 'h' ? tr.y : tr.y + tr.len;
        ctx.save();
        ctx.strokeStyle = col2; ctx.lineWidth = tr.active ? 3 * DPR : DPR;
        ctx.shadowBlur = tr.active ? 18 * DPR : 0; ctx.shadowColor = '#FF88FF';
        ctx.globalAlpha = tr.active ? 0.85 : 0.25;
        ctx.setLineDash(tr.active ? [] : [6 * DPR, 4 * DPR]);
        ctx.beginPath(); ctx.moveTo((tr.x - camX) * DPR, (tr.y - camY) * DPR); ctx.lineTo((ex2 - camX) * DPR, (ey2 - camY) * DPR); ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
      } else if (tr.type === 'noise_trap') {
        const ntx = (tr.x - camX) * DPR, nty = (tr.y - camY) * DPR;
        ctx.save();
        const ntPulse = tr.armed ? (0.3 + 0.25 * Math.sin(tr.pulse || 0)) : 0.05;
        ctx.strokeStyle = `rgba(255,170,0,${ntPulse})`; ctx.lineWidth = 1.5 * DPR;
        ctx.shadowBlur = tr.armed ? 12 * DPR : 0; ctx.shadowColor = '#FFAA00';
        ctx.beginPath(); ctx.arc(ntx, nty, tr.r * DPR, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(255,170,0,${ntPulse * 0.15})`; ctx.fill();
        ctx.fillStyle = tr.armed ? '#FFAA00' : 'rgba(255,170,0,0.3)';
        ctx.beginPath(); ctx.arc(ntx, nty, 5 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'crusher') {
        const cx3 = tr.dir === 'h' ? tr.x + tr.offset : tr.x;
        const cy3 = tr.dir === 'v' ? tr.y + tr.offset : tr.y;
        const cw2 = tr.dir === 'h' ? tr.len : 18, ch2 = tr.dir === 'v' ? tr.len : 18;
        ctx.save();
        ctx.fillStyle = 'rgba(180,60,0,0.7)'; ctx.strokeStyle = '#FF4400'; ctx.lineWidth = 2 * DPR;
        ctx.shadowBlur = 14 * DPR; ctx.shadowColor = '#FF4400';
        ctx.fillRect((cx3 - camX) * DPR, (cy3 - camY) * DPR, cw2 * DPR, ch2 * DPR);
        ctx.strokeRect((cx3 - camX) * DPR, (cy3 - camY) * DPR, cw2 * DPR, ch2 * DPR);
        // Spikes
        const spk = tr.dir === 'h' ? ch2 : cw2;
        const spkCount = Math.floor((tr.dir === 'h' ? cw2 : ch2) / 14);
        for (let si = 0; si < spkCount; si++) {
          const sx3 = (cx3 - camX) * DPR + (tr.dir === 'h' ? si * 14 * DPR : 0);
          const sy3 = (cy3 - camY) * DPR + (tr.dir === 'v' ? si * 14 * DPR : 0);
          ctx.fillStyle = '#FF6600';
          ctx.beginPath();
          ctx.moveTo(sx3 + (tr.dir === 'h' ? 7 * DPR : 0), sy3 + (tr.dir === 'v' ? 7 * DPR : 0));
          ctx.lineTo(sx3 + (tr.dir === 'h' ? 7 * DPR : (spk + 6) * DPR), sy3 + (tr.dir === 'v' ? 7 * DPR : -(spk + 6) * DPR));
          ctx.fill();
        }
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'gravity_pulse') {
        const gpx = (tr.x - camX) * DPR, gpy = (tr.y - camY) * DPR;
        ctx.save();
        // Pulse ring
        if (tr.pulseActive && tr.pulseR > 0) {
          ctx.strokeStyle = `rgba(150,0,255,${Math.max(0, 1 - tr.pulseR / (tr.r * 2))})`; ctx.lineWidth = 2.5 * DPR;
          ctx.shadowBlur = 16 * DPR; ctx.shadowColor = '#9900FF';
          ctx.beginPath(); ctx.arc(gpx, gpy, tr.pulseR * DPR, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
        }
        // Core
        ctx.fillStyle = '#6600CC'; ctx.shadowBlur = 12 * DPR; ctx.shadowColor = '#9900FF';
        ctx.beginPath(); ctx.arc(gpx, gpy, 7 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(150,0,255,0.3)'; ctx.lineWidth = DPR; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(gpx, gpy, tr.r * DPR, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      } else if (tr.type === 'laser_mandala') {
        const lmx = (tr.x - camX) * DPR, lmy = (tr.y - camY) * DPR;
        ctx.save();
        for (let arm = 0; arm < tr.arms; arm++) {
          const a = tr.angle + (arm / tr.arms) * Math.PI * 2;
          const ex3 = lmx + Math.cos(a) * tr.r * DPR, ey3 = lmy + Math.sin(a) * tr.r * DPR;
          ctx.strokeStyle = 'rgba(255,0,200,0.7)'; ctx.lineWidth = 1.5 * DPR;
          ctx.shadowBlur = 12 * DPR; ctx.shadowColor = '#FF00CC';
          ctx.beginPath(); ctx.moveTo(lmx, lmy); ctx.lineTo(ex3, ey3); ctx.stroke();
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = '#FF00FF'; ctx.beginPath(); ctx.arc(lmx, lmy, 5 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (tr.type === 'mine_chain' && tr.armed) {
        const mcx = (tr.x - camX) * DPR, mcy = (tr.y - camY) * DPR;
        const blink3 = Math.sin(T * 4 + tr.blinkPhase) > 0;
        ctx.save();
        ctx.fillStyle = blink3 ? '#FF8800' : 'rgba(255,136,0,0.4)';
        ctx.shadowBlur = blink3 ? 18 * DPR : 4 * DPR; ctx.shadowColor = '#FF8800';
        ctx.beginPath(); ctx.arc(mcx, mcy, 6 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Chain radius ring
        ctx.strokeStyle = 'rgba(255,136,0,0.15)'; ctx.lineWidth = DPR;
        ctx.setLineDash([4 * DPR, 4 * DPR]);
        ctx.beginPath(); ctx.arc(mcx, mcy, tr.chainR * DPR, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (tr.type === 'pendulum_saw') {
        const psx = (tr.x - camX) * DPR, psy = (tr.y - camY) * DPR;
        const ptx = (tr.x + Math.cos(tr.angle) * tr.len - camX) * DPR;
        const pty = (tr.y + Math.sin(tr.angle) * tr.len - camY) * DPR;
        ctx.save();
        ctx.strokeStyle = '#FF4400'; ctx.lineWidth = 3 * DPR; ctx.shadowBlur = 14; ctx.shadowColor = '#FF4400';
        ctx.beginPath(); ctx.moveTo(psx, psy); ctx.lineTo(ptx, pty); ctx.stroke();
        ctx.fillStyle = '#FF6600'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(ptx, pty, 7 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath(); ctx.arc(psx, psy, 4 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'simon_field') {
        const sfx = (tr.x - camX) * DPR, sfy = (tr.y - camY) * DPR;
        const qdx = 40 * DPR, qdy = 40 * DPR;
        ctx.save();
        for (let q = 0; q < 4; q++) {
          const qx2 = sfx + (q % 2 === 0 ? -qdx : qdx);
          const qy2 = sfy + (q < 2 ? -qdy : qdy);
          const isActive = q === tr._activeQ;
          ctx.fillStyle = isActive ? 'rgba(255,200,0,0.55)' : 'rgba(255,200,0,0.08)';
          ctx.strokeStyle = isActive ? '#FFCC00' : 'rgba(255,200,0,0.3)';
          ctx.lineWidth = isActive ? 2.5 * DPR : 1 * DPR;
          ctx.shadowBlur = isActive ? 24 : 4; ctx.shadowColor = '#FFCC00';
          ctx.beginPath(); ctx.rect(qx2 - 18 * DPR, qy2 - 18 * DPR, 36 * DPR, 36 * DPR);
          ctx.fill(); ctx.stroke();
        }
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'pressure_plate') {
        const ppx = (tr.x - camX) * DPR, ppy = (tr.y - camY) * DPR;
        ctx.save();
        const ppCol = tr.triggered ? '#FF8800' : 'rgba(255,136,0,0.5)';
        ctx.strokeStyle = ppCol; ctx.lineWidth = 2.5 * DPR;
        ctx.shadowBlur = tr.triggered ? 22 : 8; ctx.shadowColor = '#FF8800';
        ctx.beginPath(); ctx.rect(ppx - 18 * DPR, ppy - 8 * DPR, 36 * DPR, 16 * DPR); ctx.stroke();
        if (tr.triggered) {
          ctx.fillStyle = 'rgba(255,136,0,0.3)';
          ctx.beginPath(); ctx.rect(ppx - 18 * DPR, ppy - 8 * DPR, 36 * DPR, 16 * DPR); ctx.fill();
          ctx.fillStyle = '#FFFFFF'; ctx.font = (5 * DPR) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(Math.ceil(tr._countdown) + 's', ppx, ppy);
        }
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'corruption_cloud') {
        const ccx = (tr.x - camX) * DPR, ccy = (tr.y - camY) * DPR;
        const ccPulse = 1 + 0.08 * Math.sin(T * 2.5 + tr._phase);
        ctx.save();
        const ccG = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, tr.r * DPR * ccPulse);
        ccG.addColorStop(0, 'rgba(136,0,204,0.40)'); ccG.addColorStop(0.5, 'rgba(80,0,120,0.20)'); ccG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ccG;
        ctx.beginPath(); ctx.arc(ccx, ccy, tr.r * DPR * ccPulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(180,0,255,0.5)'; ctx.lineWidth = 1.5; ctx.shadowBlur = 18; ctx.shadowColor = '#8800CC';
        ctx.beginPath(); ctx.arc(ccx, ccy, tr.r * DPR * ccPulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#CC66FF'; ctx.font = (5 * DPR) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('CORRUPT', ccx, ccy);
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'reactive_vent') {
        const rvx = (tr.x - camX) * DPR, rvy = (tr.y - camY) * DPR;
        ctx.save();
        ctx.strokeStyle = '#FFAA00'; ctx.lineWidth = 2 * DPR; ctx.shadowBlur = 12; ctx.shadowColor = '#FFAA00';
        ctx.beginPath(); ctx.rect(rvx - 12 * DPR, rvy - 5 * DPR, 24 * DPR, 10 * DPR); ctx.stroke();
        // Steam jets when near cooldown end
        if (tr._cooldown < 0.8) {
          const jets = 4;
          for (let j = 0; j < jets; j++) {
            const jx = rvx - 9 * DPR + j * 6 * DPR;
            const jLen = (0.8 - tr._cooldown) * 30 * DPR;
            ctx.strokeStyle = 'rgba(255,170,0,0.5)'; ctx.lineWidth = DPR;
            ctx.beginPath(); ctx.moveTo(jx, rvy - 5 * DPR); ctx.lineTo(jx + (Math.random() - 0.5) * 4 * DPR, rvy - 5 * DPR - jLen); ctx.stroke();
          }
        }
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'laser_mirror') {
        const lmx2 = (tr.x - camX) * DPR, lmy2 = (tr.y - camY) * DPR;
        ctx.save();
        const lmDirs2 = [
          { x: Math.cos(tr.angle), y: Math.sin(tr.angle) },
          { x: Math.cos(tr.angle + Math.PI * 0.75), y: Math.sin(tr.angle + Math.PI * 0.75) },
        ];
        for (const d5 of lmDirs2) {
          ctx.strokeStyle = 'rgba(255,50,200,0.75)'; ctx.lineWidth = 1.5 * DPR; ctx.shadowBlur = 12; ctx.shadowColor = '#FF22CC';
          ctx.beginPath(); ctx.moveTo(lmx2, lmy2); ctx.lineTo(lmx2 + d5.x * tr.len * DPR, lmy2 + d5.y * tr.len * DPR); ctx.stroke();
        }
        ctx.fillStyle = '#FF44FF'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(lmx2, lmy2, 5 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'lag_zone') {
        const lzx = (tr.x - camX) * DPR, lzy = (tr.y - camY) * DPR;
        const lzR = tr.r * DPR;
        ctx.save();
        const lzPulse = 1 + 0.05 * Math.sin(T * 1.8);
        const lzG = ctx.createRadialGradient(lzx, lzy, 0, lzx, lzy, lzR * lzPulse);
        lzG.addColorStop(0, 'rgba(0,100,255,0.12)'); lzG.addColorStop(1, 'rgba(0,80,200,0)');
        ctx.fillStyle = lzG; ctx.beginPath(); ctx.arc(lzx, lzy, lzR * lzPulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,150,255,0.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([6 * DPR, 4 * DPR]);
        ctx.shadowBlur = 10; ctx.shadowColor = '#0088FF';
        ctx.beginPath(); ctx.arc(lzx, lzy, lzR * lzPulse, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,200,255,0.7)'; ctx.font = (5 * DPR) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('LAG ZONE', lzx, lzy);
        ctx.shadowBlur = 0; ctx.restore();
      } else if (tr.type === 'tp_tile') {
        const tpx = (tr.x - camX) * DPR, tpy = (tr.y - camY) * DPR;
        const tpPulse = 0.6 + 0.4 * Math.sin(T * 3 + tr._cd);
        ctx.save();
        ctx.globalAlpha = tr._cd > 0 ? 0.25 : tpPulse;
        ctx.strokeStyle = '#FF00FF'; ctx.lineWidth = 2 * DPR; ctx.shadowBlur = tr._cd > 0 ? 4 : 20; ctx.shadowColor = '#FF00FF';
        ctx.beginPath(); ctx.rect(tpx - 14 * DPR, tpy - 14 * DPR, 28 * DPR, 28 * DPR); ctx.stroke();
        ctx.fillStyle = 'rgba(255,0,255,0.15)'; ctx.fill();
        ctx.fillStyle = '#FF88FF'; ctx.font = (5 * DPR) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = tr._cd > 0 ? 0.25 : 1;
        ctx.fillText('TP', tpx, tpy);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
      }
    }
  }

  _hitDir(ox, oy, dirx, diry, rng, dmg, tol, onHit, wpnIdx) {
    for (let i = this.EYES.length - 1; i >= 0; i--) {
      const e = this.EYES[i];
      if (e.cloaking && Math.random() < 0.7) continue;
      const tx = e.x - ox, ty = e.y - oy;
      const proj = tx * dirx + ty * diry;
      if (proj < 0 || proj > rng) continue;
      const cx = ox + dirx * proj, cy = oy + diry * proj;
      if (d2(e.x, e.y, cx, cy) < e.sz + tol) { this._damageE(e, dmg * this.powerMult, false, wpnIdx); if (onHit) onHit(e); }
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
    setCredits(this.credits);
    document.getElementById('sh-cr').textContent = this.credits;
    updateCredits(this.credits);
  }

  // ─── Main update
  update(dt) {
    if (!this.running) return;
    if (this.paused) { this._render(); this._renderMiniMap(); return; }
    if (this.skillModal || this.shopModal) return;
    this._isFiring = false;
    if (this.isMouseDown) this.tryFire();
    // Kill-cam slow-motion time scale
    if (this._timeScaleTimer > 0) { this._timeScaleTimer -= dt; dt *= this._timeScale; }
    this._update(dt);
    this._render();
    this._renderMiniMap();
  }

  _update(dt) {
    // Camera — always follows player with smooth lerp
    const { mx, my, lW, lH } = this;
    const tcX = Math.max(0, Math.min(this.WW - lW, this.px - lW / 2));
    const tcY = Math.max(0, Math.min(this.WH - lH, this.py - lH / 2));
    this.camX += (tcX - this.camX) * Math.min(1, 8 * dt);
    this.camY += (tcY - this.camY) * Math.min(1, 8 * dt);
    this.wMX = mx + this.camX; this.wMY = my + this.camY;
    this._syncCamera();

    // Player movement
    if (!this.betweenWaves) {
      // Shift = sprint (150% speed, 0.4 s burst, 2 s cooldown)
      const shiftHeld = this.KEYS['shift'] || this.KEYS['shiftleft'] || this.KEYS['shiftrigh'];
      if (shiftHeld && this.sprintTimer <= 0 && this.abCDs.dash <= 0) {
        this.sprintTimer = 0.4;
        this.abCDs.dash  = 2; // borrow the dash cooldown to prevent spam
        SFX.dash && SFX.dash();
      }
      if (this.sprintTimer > 0) this.sprintTimer -= dt;
      const sprintMult = this.sprintTimer > 0 ? 1.5 : 1;

      const pdx = this.wMX - this.px, pdy = this.wMY - this.py, pd = Math.hypot(pdx, pdy);
      if (pd > 8) {
        const sp = this.dashTimer > 0 ? 720 : this.speed * sprintMult * (this._lagMult || 1);
        this._lagMult = 1;
        this.px += pdx / pd * Math.min(pd, sp * dt);
        this.py += pdy / pd * Math.min(pd, sp * dt);
      }
      if (this.dashTimer > 0) {
        this.dashTimer -= dt; this.px += this.dashVX * dt; this.py += this.dashVY * dt;
        this.dashTrail.push({ x: this.px, y: this.py, life: 0.22 });
      }
      this.dashTrail.forEach(t => t.life -= dt);
      for (let i = this.dashTrail.length - 1; i >= 0; i--) { if (this.dashTrail[i].life <= 0) this.dashTrail.splice(i, 1); }
      // Cylindrical wrap: left/right edges are connected; top/bottom remain bounded
      if (this.px < 0)          this.px += this.WW;
      else if (this.px > this.WW) this.px -= this.WW;
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

    // Style Meter + Overdrive
    if (this.overdriveActive) {
      this.overdriveTimer -= dt;
      if (this.overdriveTimer <= 0) this._endOverdrive();
    } else {
      this.styleMeter = Math.max(0, this.styleMeter - 7 * dt);
    }
    updateStyleMeter(this.styleMeter / 100, this.overdriveActive);

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

    // Ammo pickup — random ground spawns
    if (this.running && !this.betweenWaves) {
      this.ammoPkupTimer -= dt;
      if (this.ammoPkupTimer <= 0) {
        this.ammoPkupTimer = 6 + Math.random() * 6;
        const MARGIN = 80;
        this.AMMO_PKUPS.push({
          x: MARGIN + Math.random() * (this.WW - MARGIN * 2),
          y: MARGIN + Math.random() * (this.WH - MARGIN * 2),
          pulse: 0,
        });
      }
      // Collect ammo pickups
      for (let i = this.AMMO_PKUPS.length - 1; i >= 0; i--) {
        const p = this.AMMO_PKUPS[i];
        p.pulse += dt * 3;
        if (d2(p.x, p.y, this.px, this.py) < 28) {
          this.AMMO_PKUPS.splice(i, 1);
          this._collectAmmo();
        }
      }
      // Collect HP pickups
      for (let i = this.HP_PKUPS.length - 1; i >= 0; i--) {
        const p = this.HP_PKUPS[i];
        p.pulse += dt * 2;
        if (d2(p.x, p.y, this.px, this.py) < 28) {
          this.HP_PKUPS.splice(i, 1);
          if (this.hp < this.maxHp) {
            this.hp++; updateHpHud(this.hp, this.maxHp);
            showMsg('MEDKIT', 'Health Restored', 1200);
            this._burst(this.px, this.py, '#FF4466', 8, 35);
          }
        }
      }
    }

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

    // Plasma Vortex: pull enemies, explode on expiry
    for (let i = this.vortexList.length - 1; i >= 0; i--) {
      const v = this.vortexList[i];
      v.timer -= dt;
      this.EYES.forEach(e => { const dx = v.x - e.x, dy = v.y - e.y, dist = Math.hypot(dx, dy) || 1; if (dist < 160) { e.x += dx / dist * 85 * dt; e.y += dy / dist * 85 * dt; } });
      if (this.boss) { const dx = v.x - this.boss.x, dy = v.y - this.boss.y, dist = Math.hypot(dx, dy) || 1; if (dist < 160) { this.boss.x += dx / dist * 32 * dt; this.boss.y += dy / dist * 32 * dt; } }
      if (v.timer <= 0) {
        this.EYES.forEach(e => { if (d2(e.x, e.y, v.x, v.y) < 120) this._damageE(e, WPNS[10].dmg * this.powerMult, true); });
        if (this.boss && d2(this.boss.x, this.boss.y, v.x, v.y) < 120) this._hurtBoss(WPNS[10].dmg * this.powerMult);
        this._burst(v.x, v.y, '#FF44FF', 22, 150); this._shakeDir(v.x, v.y, 12); this.flashAlpha = 0.2;
        this.vortexList.splice(i, 1);
      }
    }

    // Time Loop projectiles: advance, reverse after 1 s
    for (let i = this.timeLoopProjs.length - 1; i >= 0; i--) {
      const p = this.timeLoopProjs[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.timer -= dt;
      if (!p.returning && p.timer <= 0) { p.vx = -p.vx; p.vy = -p.vy; p.returning = true; p.timer = 1.0; }
      this.EYES.forEach(e => { if (d2(p.x, p.y, e.x, e.y) < e.sz + 8) this._damageE(e, p.dmg * this.powerMult, false); });
      if (this.boss && d2(p.x, p.y, this.boss.x, this.boss.y) < this.boss.sz + 10) this._hurtBoss(p.dmg * this.powerMult);
      if (p.timer <= 0 || p.x < 0 || p.x > this.WW || p.y < 0 || p.y > this.WH) this.timeLoopProjs.splice(i, 1);
    }

    // Drones: orbit player, shoot nearest enemy
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const dr = this.drones[i];
      dr.timer -= dt;
      if (dr.timer <= 0) { this.drones.splice(i, 1); continue; }
      const ang = (this._T() + i * 2.094) * 2.2;
      dr.x += (this.px + Math.cos(ang) * 55 - dr.x) * 7 * dt;
      dr.y += (this.py + Math.sin(ang) * 55 - dr.y) * 7 * dt;
      dr.shootCd -= dt;
      if (dr.shootCd <= 0 && this.EYES.length > 0) {
        dr.shootCd = 0.6;
        const target = this.EYES.reduce((a, b) => d2(a.x, a.y, dr.x, dr.y) < d2(b.x, b.y, dr.x, dr.y) ? a : b);
        this._addBeam(dr.x, dr.y, target.x, target.y, WPNS[14].col, 0.1, 1.5);
        this._damageE(target, WPNS[14].dmg * this.powerMult, false);
      }
    }

    // Ambient particles
    AMBIENT.forEach(a => {
      a.phase += dt; a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < 0) a.x += this.WW; if (a.x > this.WW) a.x -= this.WW;
      if (a.y < 0) a.y += this.WH; if (a.y > this.WH) a.y -= this.WH;
    });

    // Virus spread (tick handled by BaseEnemy.update; spread to nearby is GameScene responsibility)
    for (const e of this.EYES) {
      if (e.virus > 0 && Math.random() < 0.025) {
        const n = this.EYES.find(o => o !== e && d2(o.x, o.y, e.x, e.y) < 82);
        if (n) n.applyVirus(5);
      }
    }
    // Boss virus HP drain (BossBase statusEffects tick time but don't drain HP)
    if (this.boss) {
      if (this.boss.statusEffects.some(s => s.type === 'virus')) this.boss.hp -= 0.55 * dt;
    }

    // Dead timers
    for (let i = this.DEAD_EYES.length - 1; i >= 0; i--) {
      this.DEAD_EYES[i].deadTimer--;
      if (this.DEAD_EYES[i].deadTimer <= 0) this.DEAD_EYES.splice(i, 1);
    }

    // Enemy AI — BaseEnemy.update handles status, movement, obstacles
    for (let i = this.EYES.length - 1; i >= 0; i--) {
      const e = this.EYES[i];
      if (e.hp <= 0) { this._killE(e); continue; }
      e.update(dt, this.px, this.py, OBSTACLES, this.EYES);
      if (e.hp <= 0) { this._killE(e); continue; }
      this._enemyTypeBehavior(e, dt);
      // Cylindrical wrap for enemies; wrapping gives an elite boost once per crossing
      if (e.x < 0)            { e.x += this.WW; if (!e._wrapElite) { e._wrapElite = true; e.hp = Math.min(e.hp * 1.25, e.maxHp * 1.8); e.spd *= 1.12; e.col = '#FFFFFF'; } }
      else if (e.x > this.WW) { e.x -= this.WW; if (!e._wrapElite) { e._wrapElite = true; e.hp = Math.min(e.hp * 1.25, e.maxHp * 1.8); e.spd *= 1.12; e.col = '#FFFFFF'; } }
      e.y = Math.max(0, Math.min(this.WH, e.y));
      if (this.invincible <= 0 && !this.ghostActive && !this.empShieldActive && d2(e.x, e.y, this.px, this.py) < e.sz + 12) this._hurtPlayer();
    }

    // Enemy projectiles
    for (let i = this.EPROJS.length - 1; i >= 0; i--) {
      const p = this.EPROJS[i];
      // Seeking projectiles home toward player
      if (p.seek) {
        const sdx = this.px - p.x, sdy = this.py - p.y, sd = Math.hypot(sdx, sdy) || 1;
        p.vx += (sdx / sd * 120 - p.vx) * Math.min(1, 2.5 * dt);
        p.vy += (sdy / sd * 120 - p.vy) * Math.min(1, 2.5 * dt);
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.x < 0 || p.x > this.WW || p.y < 0 || p.y > this.WH) {
        // PrivacyEater zone-drop: convert to corruption zone on expiry
        if (p.zone) {
          this.CORRUPT_ZONES.push({ x: p.x, y: p.y, r: 80 + Math.random() * 40, pulse: 0, life: 18 });
          this._burst(p.x, p.y, '#8800CC', 12, 80);
        }
        this.EPROJS.splice(i, 1); continue;
      }
      if (!this.empShieldActive && this.invincible <= 0 && !this.ghostActive && d2(p.x, p.y, this.px, this.py) < p.r + 11) {
        this.EPROJS.splice(i, 1);
        // Freeze shot: slow player speed for 2.5s
        if (p.freeze) {
          this.speed = Math.max(80, this.speed * 0.35);
          this._spawnFloat(this.px, this.py - 20, 'FROZEN!', '#88EEFF');
          clearTimeout(this._freezeRestore);
          this._freezeRestore = setTimeout(() => { this.speed = this._baseSpeed; }, 2500);
        }
        this._hurtPlayer();
      }
    }

    // Boss AI — BossBase subclass handles movement, attack, phase transitions
    if (this.boss) {
      if (!this.boss.alive) {
        this._killBoss();
      } else {
        this.boss.update(dt, { px: this.px, py: this.py }, this.EPROJS);
        this.boss.x = Math.max(40, Math.min(this.WW - 40, this.boss.x));
        this.boss.y = Math.max(40, Math.min(this.WH - 40, this.boss.y));
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
    // Corruption zones: DoT player, pulse animation, optional life expiry
    for (let zi = this.CORRUPT_ZONES.length - 1; zi >= 0; zi--) {
      const z = this.CORRUPT_ZONES[zi];
      z.pulse = (z.pulse + dt * 1.8) % (Math.PI * 2);
      if (z.life !== undefined) { z.life -= dt; if (z.life <= 0) { this.CORRUPT_ZONES.splice(zi, 1); continue; } }
      if (this.invincible <= 0 && !this.ghostActive && Math.hypot(this.px - z.x, this.py - z.y) < z.r) {
        if (!z._dotTimer || z._dotTimer <= 0) {
          z._dotTimer = 1.0;
          this.hp -= 0.3;
          updateHpHud(this.hp, this.maxHp);
          if (this.hp <= 0) this.gameOver();
        }
        z._dotTimer = (z._dotTimer || 0) - dt;
      } else {
        z._dotTimer = (z._dotTimer || 0) - dt;
      }
    }
    // Floats
    for (let i = this.FLOATS.length - 1; i >= 0; i--) {
      const f = this.FLOATS[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt;
      if (f.life <= 0) this.FLOATS.splice(i, 1);
    }

    this._updateTraps(dt);
    this._updateInteractives(dt);
    this._updateSecrets(dt);
    this._updateGeometry(dt);
    this._updateBiomeEffects(dt);
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

    // Biome-specific background extras (all 15 biomes)
    const t2 = this._T();
    renderBiomeExtras(ctx, this.mapIdx, t2, wx, wy, onScreen, W, H, DPR, camX, camY, STARS, BLDGS, WEB_LINES);

    // Ambient particles
    ctx.shadowBlur = 8;
    AMBIENT.forEach(a => {
      if (!onScreen(a.x, a.y, 10)) return;
      const pulse = a.a * (0.5 + 0.5 * Math.sin(t2 * 1.5 + a.phase));
      ctx.globalAlpha = pulse; ctx.fillStyle = a.col; ctx.shadowColor = a.col;
      ctx.beginPath(); ctx.arc(wx(a.x), wy(a.y), a.r * DPR, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    });
    ctx.shadowBlur = 0;

    // Obstacles — biome-themed rendering
    OBSTACLES.forEach(o => {
      if (!onScreen(o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h))) return;
      renderBiomeObstacle(ctx, o, wx, wy, DPR, this.mapIdx, M, t2);
    });

    // Traps
    this._renderTraps(ctx, camX, camY, DPR);
    this._renderInteractives(ctx, camX, camY, DPR);
    this._renderSecrets(ctx, camX, camY, DPR, t2);

    // Corruption zones
    for (const z of this.CORRUPT_ZONES) {
      if (!onScreen(z.x, z.y, z.r + 20)) continue;
      const zx = wx(z.x), zy = wy(z.y), zr = z.r * DPR;
      const pulseMod = 1 + 0.06 * Math.sin(z.pulse);
      const g = ctx.createRadialGradient(zx, zy, 0, zx, zy, zr * pulseMod);
      g.addColorStop(0, 'rgba(136,0,204,0.18)');
      g.addColorStop(0.6, 'rgba(80,0,100,0.10)');
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(zx, zy, zr * pulseMod, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(180,0,255,' + (0.22 + 0.12 * Math.sin(z.pulse)) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(zx, zy, zr * pulseMod, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(180,0,255,0.55)';
      ctx.font = 'bold ' + (10 * DPR) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CORRUPTION ZONE', zx, zy - zr * 0.6);
    }
    ctx.textAlign = 'left';

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

    // Plasma vortex orbs
    this.vortexList.forEach(v => {
      const vox = wx(v.x), voy = wy(v.y);
      const pct = 1 - v.timer / 1.5;
      const r   = pct * 80 * DPR;
      const pulse = 0.6 + 0.4 * Math.sin(this._T() * 5);
      ctx.strokeStyle = '#FF44FF'; ctx.lineWidth = 2.5; ctx.shadowBlur = 30; ctx.shadowColor = '#FF44FF';
      ctx.globalAlpha = 0.85 * pulse;
      ctx.beginPath(); ctx.arc(vox, voy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.4 * pulse;
      ctx.beginPath(); ctx.arc(vox, voy, r * 0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });

    // Time loop projectiles
    this.timeLoopProjs.forEach(p => {
      if (!onScreen(p.x, p.y, 14)) return;
      ctx.fillStyle = WPNS[12].col; ctx.shadowBlur = 20; ctx.shadowColor = WPNS[12].col;
      ctx.beginPath(); ctx.arc(wx(p.x), wy(p.y), 7 * DPR, 0, Math.PI * 2); ctx.fill();
      if (p.returning) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(wx(p.x), wy(p.y), 10 * DPR, 0, Math.PI * 2); ctx.stroke(); }
      ctx.shadowBlur = 0;
    });

    // Drones
    this.drones.forEach((dr, idx) => {
      if (!onScreen(dr.x, dr.y, 14)) return;
      const drx = wx(dr.x), dry = wy(dr.y);
      const spinA = this._T() * 4 + idx * 2.094;
      ctx.globalAlpha = Math.min(1, dr.timer);
      ctx.fillStyle = WPNS[14].col; ctx.shadowBlur = 22; ctx.shadowColor = WPNS[14].col;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + spinA; ctx[k ? 'lineTo' : 'moveTo'](drx + Math.cos(a) * 7 * DPR, dry + Math.sin(a) * 7 * DPR); }
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });

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

    // Boss HP bar (canvas top) + boss body via subclass render
    if (this.boss && this.boss.alive) {
      const bw2 = lW * 0.6 * DPR, bx2 = (W - bw2) / 2, by2 = 8 * DPR;
      ctx.fillStyle = 'rgba(255,0,0,0.15)'; ctx.fillRect(bx2, by2, bw2, 7 * DPR);
      const hpPct = this.boss.hp / this.boss.maxHp;
      const hcol = hpPct > 0.5 ? '#FF4400' : hpPct > 0.25 ? '#FF8800' : '#FF0000';
      ctx.fillStyle = hcol; ctx.shadowBlur = 12; ctx.shadowColor = hcol;
      ctx.fillRect(bx2, by2, bw2 * hpPct, 7 * DPR); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,80,80,0.7)'; ctx.font = (8 * DPR) + 'px monospace'; ctx.textAlign = 'center';
      ctx.fillText(this.boss.constructor.name.toUpperCase() + '  —  ' + Math.ceil(this.boss.hp) + ' HP', W / 2, by2 - 3 * DPR);
      this.boss.render(ctx, this.camX, this.camY, this.DPR);
    }

    // Enemies
    this.EYES.forEach(e => {
      if (!onScreen(e.x, e.y, e.sz + 14)) return;
      const sa = e.spawnAnim > 0 ? Math.max(0.1, 1 - e.spawnAnim) : 1;
      ctx.save(); ctx.translate(wx(e.x), wy(e.y)); ctx.scale(sa, sa);
      ctx.globalAlpha = e.al * (e.frozen > 0 ? 0.6 : 1) * (e.spawnAnim > 0 ? sa : 1);
      const col = e.hitFlash > 0 ? '#FFFFFF' : (e.frozen > 0 ? '#88FFFF' : (e.virus > 0 ? '#44FF00' : (e.berserk ? '#FF0000' : e.col)));
      ctx.fillStyle = col;
      ctx.shadowBlur = (e.t === 'necro' || e.t === 'corrupted') ? 35 : 15;
      ctx.shadowColor = e.hitFlash > 0 ? '#FFFFFF' : e.col;
      const er = e.sz * DPR;
      // Trojan: render as ammo pickup icon until revealed
      if (e.t === 'trojan' && !e.revealed) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#00FFCC'; ctx.shadowColor = '#00FFCC'; ctx.shadowBlur = 12;
        ctx.fillRect(-er * 0.7, -er * 0.7, er * 1.4, er * 1.4);
        ctx.fillStyle = '#001A14'; ctx.font = (er * 1.2) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('A', 0, 1);
        ctx.textBaseline = 'alphabetic';
      } else {
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
        } else if (e.t === 'hawk') {
          // Hexagon
          for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); }
          ctx.closePath();
        } else if (e.t === 'zeryday') {
          // Octagon
          for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); }
          ctx.closePath();
        } else if (e.t === 'crawler') {
          // Rectangle (crouched)
          ctx.rect(-er, -er * 0.65, er * 2, er * 1.3);
        } else if (e.t === 'broker') {
          // Elongated diamond (6-point)
          ctx.moveTo(0, -er * 1.3); ctx.lineTo(er * 0.6, -er * 0.3);
          ctx.lineTo(er * 0.9, er * 0.5); ctx.lineTo(0, er * 1.3);
          ctx.lineTo(-er * 0.9, er * 0.5); ctx.lineTo(-er * 0.6, -er * 0.3);
          ctx.closePath();
        } else if (e.t === 'hornet') {
          // Pentagon
          for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); }
          ctx.closePath();
        } else if (e.t === 'sentry' || e.t === 'icecannon') {
          // Rotated square (diamond)
          for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 - Math.PI / 4; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); }
          ctx.closePath();
        } else if (e.t === 'zealot') {
          // Cross/plus
          ctx.rect(-er * 0.35, -er, er * 0.7, er * 2);
          ctx.rect(-er, -er * 0.35, er * 2, er * 0.7);
        } else if (e.t === 'titan') {
          // Large rectangle with notched corners
          ctx.rect(-er, -er * 0.65, er * 2, er * 1.3);
        } else if (e.t === 'glitch') {
          // Jagged irregular shape (static polygon)
          const pts2 = [[-er,-er*0.4],[0,-er*0.9],[er*0.5,-er*0.3],[er,0],[er*0.4,er],[0,er*0.6],[-er*0.6,er*0.8]];
          pts2.forEach(([px2,py2],i) => ctx[i?'lineTo':'moveTo'](px2,py2));
          ctx.closePath();
        } else if (e.t === 'dropper') {
          // Oval (wider)
          ctx.ellipse(0, 0, er * 1.4, er * 0.8, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(0, 0, er, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      ctx.restore();
      // Mirage ghost copies
      if (e.t === 'mirage' && e.copies) {
        e.copies.forEach(c => {
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = e.col; ctx.shadowBlur = 8; ctx.shadowColor = e.col;
          ctx.beginPath(); ctx.arc(wx(e.x + c.ox), wy(e.y + c.oy), er * 0.8, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0; ctx.globalAlpha = 1;
          ctx.restore();
        });
      }
      // Corrupted aura ring
      if (e.t === 'corrupted') {
        ctx.strokeStyle = 'rgba(136,0,204,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(wx(e.x), wy(e.y), (e.sz + 22 + 4 * Math.sin(t2 * 3)) * DPR, 0, Math.PI * 2); ctx.stroke();
      }
      // Hawk laser charge indicator
      if (e.t === 'hawk' && !e.laserActive && e.laserTimer < 1) {
        ctx.strokeStyle = 'rgba(255,34,0,' + (1 - e.laserTimer) * 0.6 + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(wx(e.x), wy(e.y), (e.sz + 8) * DPR, 0, Math.PI * 2); ctx.stroke();
      }
      // Crawler charge warning
      if (e.t === 'crawler' && !e.chargeActive && e.chargeTimer < 0.5) {
        ctx.strokeStyle = 'rgba(204,136,0,0.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(wx(e.x), wy(e.y), (e.sz + 6) * DPR, 0, Math.PI * 2); ctx.stroke();
      }
      // HP bar
      if (e.maxHp > 1 && e.t !== 'trojan' || (e.t === 'trojan' && e.revealed)) {
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

    // Player — rendered via PlayerVisual (weapon arm + hex body + glow)
    const plx = wx(this.px), ply = wy(this.py);
    const pBlink = this.ghostActive && Math.floor(this._T() * 10) % 2 === 0;
    ctx.globalAlpha = pBlink ? 0.22 : 1;
    const pCol    = this.empShieldActive ? '#00FFFF' : SKINS[this.skinIdx];
    const aimAngle = Math.atan2(this.wMY - this.py, this.wMX - this.px);
    const isSliding = this.sprintTimer > 0 && (this.KEYS['shift'] || this.KEYS['shiftleft']);
    renderPlayer(ctx, plx, ply, aimAngle, WPNS[this.wpnIdx], this._isFiring, isSliding, 0, pCol, DPR);
    ctx.globalAlpha = 1;
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

    // Shadow Protocol (mapIdx 13): darkness vignette — only player's immediate vicinity is lit
    if (this.mapIdx === 13) {
      const spG = ctx.createRadialGradient(this.mx * DPR, this.my * DPR, 60 * DPR, this.mx * DPR, this.my * DPR, Math.min(W, H) * 0.62);
      spG.addColorStop(0, 'rgba(0,0,0,0)'); spG.addColorStop(1, 'rgba(0,0,0,0.93)');
      ctx.fillStyle = spG; ctx.fillRect(0, 0, W, H);
    }

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

    // Overdrive thermal distortion — pulsing teal edge + colour shift
    if (this.overdriveActive) {
      const odPulse = 0.5 + 0.5 * Math.sin(this._T() * 7);
      ctx.globalAlpha = 0.06 + 0.04 * odPulse;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = '#00FFFF'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      // Edge glow
      const edgeG = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.min(W, H) * 0.9);
      edgeG.addColorStop(0, 'rgba(0,255,255,0)');
      edgeG.addColorStop(1, 'rgba(0,255,255,' + (0.12 * odPulse) + ')');
      ctx.fillStyle = edgeG; ctx.fillRect(0, 0, W, H);
    }

    // Ammo pickups — glowing cyan diamond
    this.AMMO_PKUPS.forEach(p => {
      if (!onScreen(p.x, p.y, 22)) return;
      const glow = 0.6 + 0.4 * Math.sin(p.pulse);
      const r = (8 + 2 * Math.sin(p.pulse)) * DPR;
      ctx.save();
      ctx.shadowBlur = 22 * DPR; ctx.shadowColor = '#00FFCC';
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#00FFCC';
      ctx.beginPath();
      ctx.moveTo(wx(p.x), wy(p.y) - r);
      ctx.lineTo(wx(p.x) + r * 0.7, wy(p.y));
      ctx.lineTo(wx(p.x), wy(p.y) + r);
      ctx.lineTo(wx(p.x) - r * 0.7, wy(p.y));
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#020A0A';
      ctx.font = `900 ${7 * DPR}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('◉', wx(p.x), wy(p.y));
      ctx.restore();
    });

    // HP pickups — pulsing gold cross
    this.HP_PKUPS.forEach(p => {
      if (!onScreen(p.x, p.y, 22)) return;
      const glow = 0.65 + 0.35 * Math.sin(p.pulse);
      const r = (7 + 2 * Math.sin(p.pulse * 1.3)) * DPR;
      ctx.save();
      ctx.shadowBlur = 20 * DPR; ctx.shadowColor = '#FF4466';
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#FF4466';
      ctx.fillRect(wx(p.x) - r * 0.28, wy(p.y) - r, r * 0.56, r * 2);
      ctx.fillRect(wx(p.x) - r, wy(p.y) - r * 0.28, r * 2, r * 0.56);
      ctx.restore();
    });

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

    // World boundary warning — glow at map edges when player is near
    const BZONE = 120;
    const bL = Math.max(0, 1 - this.px / BZONE);
    const bR = Math.max(0, 1 - (this.WW - this.px) / BZONE);
    const bT = Math.max(0, 1 - this.py / BZONE);
    const bB = Math.max(0, 1 - (this.WH - this.py) / BZONE);
    if (bL > 0) { const g = ctx.createLinearGradient(0,0,W*0.18,0); g.addColorStop(0,`rgba(255,60,0,${0.55*bL})`); g.addColorStop(1,'rgba(255,60,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W*0.18,H); }
    if (bR > 0) { const g = ctx.createLinearGradient(W,0,W*0.82,0); g.addColorStop(0,`rgba(255,60,0,${0.55*bR})`); g.addColorStop(1,'rgba(255,60,0,0)'); ctx.fillStyle=g; ctx.fillRect(W*0.82,0,W*0.18,H); }
    if (bT > 0) { const g = ctx.createLinearGradient(0,0,0,H*0.18); g.addColorStop(0,`rgba(255,60,0,${0.55*bT})`); g.addColorStop(1,'rgba(255,60,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H*0.18); }
    if (bB > 0) { const g = ctx.createLinearGradient(0,H,0,H*0.82); g.addColorStop(0,`rgba(255,60,0,${0.55*bB})`); g.addColorStop(1,'rgba(255,60,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,H*0.82,W,H*0.18); }

    // Overclock Core (mapIdx 12): heat bar HUD
    if (this.mapIdx === 12 && this._biomeState) {
      const heat = this._biomeState._heat || 0;
      const bx3 = W / 2 - 80 * DPR, by3 = 12 * DPR, bw3 = 160 * DPR, bh3 = 10 * DPR;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx3 - 2, by3 - 2, bw3 + 4, bh3 + 4);
      const heatCol = heat > 80 ? '#FF2200' : heat > 50 ? '#FF8800' : '#FFCC00';
      ctx.fillStyle = heatCol; ctx.shadowBlur = heat > 80 ? 16 : 6; ctx.shadowColor = heatCol;
      ctx.fillRect(bx3, by3, bw3 * (heat / 100), bh3);
      ctx.strokeStyle = heatCol; ctx.lineWidth = 1; ctx.shadowBlur = 0;
      ctx.strokeRect(bx3, by3, bw3, bh3);
      ctx.fillStyle = '#FFFFFF'; ctx.font = (5.5 * DPR) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this._biomeState._oh ? 'OVERHEATED — COOLING' : 'THERMAL: ' + Math.round(heat) + '%', W / 2, by3 + bh3 / 2);
      ctx.restore();
    }

    // Lag zone slow indicator
    if (this._lagMult && this._lagMult < 0.5) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,100,255,0.18)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,200,255,0.7)'; ctx.font = (8 * DPR) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('LAG ZONE', W / 2, 30 * DPR);
      ctx.restore();
    }

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
