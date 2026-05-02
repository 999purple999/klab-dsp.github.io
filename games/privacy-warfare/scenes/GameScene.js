// scenes/GameScene.js — Main gameplay scene

import { dist, clamp } from '../utils/math.js';
import { Player, SKINS } from '../entities/Player.js';
import {
  makeEnemy, makeBoss, pickType, spawnRandom, spawnFormation,
  BOSS_TYPES, updateEnemies, updateBoss, renderEnemies, renderBoss
} from '../entities/Enemy.js';
import { ProjectileManager } from '../entities/Projectile.js';
import { ObstacleManager } from '../entities/Obstacle.js';
import { PowerUpManager } from '../entities/PowerUp.js';
import { Camera } from '../rendering/Camera.js';
import { ParticleEmitter } from '../rendering/ParticleEmitter.js';
import { FloatingText } from '../ui/FloatingText.js';
import { HUD } from '../ui/HUD.js';
import { Minimap } from '../ui/Minimap.js';
import { openWaveSkillModal, openShopModal, openSkillTreeModal, openSettingsModal, loadSettings } from '../ui/Modal.js';
import { progression } from '../data/Progression.js';
import { achievements } from '../data/Achievements.js';
import { leaderboard } from '../data/Leaderboard.js';
import { NarrativeLog } from '../data/NarrativeLog.js';
import { bus } from '../utils/EventBus.js';
import { device } from '../utils/Device.js';

// ── Map definitions ───────────────────────────────────────────────────────
export const MAPS = [
  { n: 'CYBER GRID',    bg: '#030306', gc: 'rgba(191,0,255,0.08)',  ac: 'rgba(191,0,255,0.6)', sc: '#BF00FF' },
  { n: 'DEEP SPACE',    bg: '#010216', gc: 'rgba(0,80,255,0.07)',   ac: 'rgba(0,150,255,0.6)', sc: '#0088FF' },
  { n: 'NEON CITY',     bg: '#040002', gc: 'rgba(255,0,80,0.07)',   ac: 'rgba(255,60,160,0.6)', sc: '#FF0066' },
  { n: 'DATA STORM',    bg: '#010A06', gc: 'rgba(0,255,100,0.06)',  ac: 'rgba(0,255,80,0.6)',  sc: '#00FF64' },
  { n: 'QUANTUM REALM', bg: '#060108', gc: 'rgba(150,0,255,0.07)',  ac: 'rgba(180,80,255,0.6)', sc: '#AA00FF' },
  { n: 'DARK WEB',      bg: '#060000', gc: 'rgba(255,30,0,0.06)',   ac: 'rgba(255,60,30,0.6)', sc: '#FF2200' },
];

const WTYPES = ['CLEAR', 'CLEAR', 'CLEAR', 'FOG', 'STORM', 'EMP', 'DATA_RAIN'];
const STREAK_NAMES = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD KILL', 'PENTA KILL', 'HEXA KILL', 'ULTRA KILL', 'RAMPAGE'];
const STREAK_COLS  = ['', '', '#FFFF00', '#FF8800', '#FF4400', '#FF0000', '#FF00FF', '#BF00FF', '#FF0000'];

export class GameScene {
  constructor(renderer, input, audioManager, sfx) {
    this.renderer = renderer;
    this.input = input;
    this.audio = audioManager;
    this.sfx = sfx;

    this.player = new Player();
    this.projManager = new ProjectileManager();
    this.obstacleManager = new ObstacleManager();
    this.powerupManager = new PowerUpManager();
    this.particles = new ParticleEmitter();
    this.floats = new FloatingText();
    this.camera = new Camera();
    this.hud = new HUD();
    this.narrativeLog = new NarrativeLog();

    this.minimap = null; // created after DOM ready

    // Game state
    this.running = false;
    this.paused = false;
    this.betweenWaves = false;
    this.betweenTimer = 0;
    this.modalOpen = false;

    this.enemies = [];
    this.deadEnemies = [];
    this.boss = null;
    this.beams = [];
    this.waveEnemyCount = 0;
    this.wave = 1;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.credits = 100;
    this.killStreak = 0;
    this.streakTimer = 0;
    this.totalKills = 0;
    this.bossKills = 0;
    this.isSurvival = false;

    this.mapIdx = 0;
    this.nextMapIdx = 1;
    this.weather = 'CLEAR';
    this.weatherTimer = 90;
    this.stormTimer = 3;
    this.empToggle = false;
    this.empFlipTimer = 4;
    this.rainDrops = [];

    this.stars = []; this.bldgs = []; this.webLines = []; this.ambient = [];

    // Effects state
    this.flashAlpha = 0;
    this.chromAberr = 0;
    this.shakeAmt = 0;
    this._bossGlitchTimer = 0;
    this._bossIncomingTimer = 0;

    // Quality / settings
    this._settings = loadSettings();
    this._quality = this._settings.quality;
    this._fpsSamples = [];
    this._fpsLowTimer = 0;
    this._fpsHighTimer = 0;

    bus.on('quality:changed', q => { this._quality = q; });
    bus.on('sfx', name => this._playSFX(name));
    bus.on('progression:maxed', () => { achievements.onSkillMaxed(); });

    this._bindVisibility();
    this._bindFullscreen();
    this._bindPauseBtn();
    this._bindSettingsBtn();
    this._bindSkillTreeBtn();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onEnter(data) {
    this.isSurvival = !!(data && data.survival);
    this._settings = loadSettings();
    this._quality = this._settings.quality;
    device.setHaptic(this._settings.haptic);

    const { renderer } = this;
    renderer.resize();
    const lW = renderer.lW, lH = renderer.lH;
    const WW = lW * 3.5, WH = lH * 3.5;

    this.camera.setWorld(WW, WH, lW, lH);
    this.camera.x = (WW - lW) / 2;
    this.camera.y = (WH - lH) / 2;

    this.player.reset();
    this.player.x = WW / 2; this.player.y = WH / 2;

    this.enemies = []; this.deadEnemies = []; this.boss = null;
    this.beams = [];
    this.projManager.clear();
    this.particles.clear();
    this.floats.clear();
    this.powerupManager.clear();

    this.score = 0; this.wave = 0; this.combo = 1; this.comboTimer = 0;
    this.credits = 100; this.killStreak = 0; this.streakTimer = 0;
    this.totalKills = 0; this.bossKills = 0;
    this.betweenWaves = false; this.modalOpen = false;

    this.flashAlpha = 0; this.chromAberr = 0; this.shakeAmt = 0;

    achievements.resetRun();
    this._prevKeys = {};

    this._buildMapAssets(WW, WH);
    this._setupMinimap();
    this._startWave(1);
    this.audio.startMusic();
    this.running = true;
    this.paused = false;

    this.hud.updateScore(0);
    this.hud.updateCredits(100);
    this.hud.updateHP(this.player.hp, this.player.maxHp);
    this.hud.updateWeapon(this.player.currentWeapon, false);
    if (this.isSurvival) this.hud.showSurvivalWave(1);
  }

  onExit() {
    this.running = false;
    this.audio.stopMusic();
    document.getElementById('nuke-charge') && (document.getElementById('nuke-charge').style.display = 'none');
    document.getElementById('shield-bar-wrap') && (document.getElementById('shield-bar-wrap').style.display = 'none');
  }

  _setupMinimap() {
    if (!this.minimap) {
      this.minimap = new Minimap('mm');
    }
  }

  _buildMapAssets(ww, wh) {
    this.stars = [];
    for (let i = 0; i < 260; i++) this.stars.push({ x: Math.random() * ww, y: Math.random() * wh, r: Math.random() * 1.8 + 0.3, a: Math.random() * 0.7 + 0.2, tw: Math.random() * 2 + 1, phase: Math.random() * Math.PI * 2 });
    this.bldgs = [];
    for (let i = 0; i < 30; i++) this.bldgs.push({ x: Math.random() * ww, w: 50 + Math.random() * 110, h: 90 + Math.random() * 260 });
    this.webLines = [];
    for (let i = 0; i < 24; i++) this.webLines.push({ x1: Math.random() * ww, y1: Math.random() * wh, x2: Math.random() * ww, y2: Math.random() * wh });
    this.ambient = [];
    const cols = ['#BF00FF', '#00FFFF', '#00FF41', '#FF0066', '#FF8800'];
    for (let i = 0; i < 80; i++) this.ambient.push({ x: Math.random() * ww, y: Math.random() * wh, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, r: Math.random() * 1.8 + 0.4, col: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 0.3 + 0.06, phase: Math.random() * Math.PI * 2 });
  }

  // ── Main update ───────────────────────────────────────────────────────────
  update(dt) {
    if (!this.running || this.paused || this.modalOpen) return;

    const { renderer, camera, player, input } = this;
    const lW = renderer.lW, lH = renderer.lH;
    const WW = camera.ww, WH = camera.wh;
    const dpr = renderer.dpr;
    const t = performance.now() / 1000;

    // FPS auto-adjust
    if (this._settings.autoAdjust) this._autoAdjustQuality(dt);

    // Camera movement (WASD + edge scroll)
    const SSPD = 290, EDGE = 88;
    const mx = input.mx, my = input.my;
    if (input.isDown('a') || input.isDown('arrowleft')) camera.x -= SSPD * dt;
    else if (mx < EDGE) camera.x -= SSPD * (1 - mx / EDGE) * dt;
    if (input.isDown('d') || input.isDown('arrowright')) camera.x += SSPD * dt;
    else if (mx > lW - EDGE) camera.x += SSPD * (1 - (lW - mx) / EDGE) * dt;
    if (input.isDown('w') || input.isDown('arrowup')) camera.y -= SSPD * dt;
    else if (my < EDGE) camera.y -= SSPD * (1 - my / EDGE) * dt;
    if (input.isDown('s') || input.isDown('arrowdown')) camera.y += SSPD * dt;
    else if (my > lH - EDGE) camera.y += SSPD * (1 - (lH - my) / EDGE) * dt;
    camera.clamp();
    camera.update(dt);

    const wMX = input.worldMX(camera.x);
    const wMY = input.worldMY(camera.y);

    // Player update
    player.update(dt, wMX, wMY, WW, WH, this.obstacleManager.list, this.betweenWaves);

    // Black hole pull
    if (player.bhActive) {
      const bx = player.bhX, by = player.bhY;
      this.enemies.forEach(e => {
        const edx = bx - e.x, edy = by - e.y, ed = Math.hypot(edx, edy) || 1;
        const pull = (220 + player.bhTimer * 55) * dt;
        e.x += edx / ed * pull; e.y += edy / ed * pull;
        if (ed < 28) this._damageEnemy(e, 2 * player.powerMult, true);
      });
      if (this.boss) {
        const bdx = bx - this.boss.x, bdy = by - this.boss.y, bd = Math.hypot(bdx, bdy) || 1;
        this.boss.x += bdx / bd * 55 * dt; this.boss.y += bdy / bd * 55 * dt;
      }
    }

    // Virus spread
    for (const e of this.enemies) {
      if (e.virus > 0) {
        e.virus -= dt; e.hp -= 0.3 * dt;
        if (Math.random() < 0.025) {
          const n = this.enemies.find(o => o !== e && dist(o.x, o.y, e.x, e.y) < 82);
          if (n) n.virus = Math.max(n.virus, 5);
        }
        if (e.hp <= 0) this._killEnemy(e);
      }
    }
    if (this.boss && this.boss.virus > 0) { this.boss.virus -= dt; this.boss.hp -= 0.55 * dt; }

    // Dead timers
    for (let i = this.deadEnemies.length - 1; i >= 0; i--) {
      this.deadEnemies[i].deadTimer--;
      if (this.deadEnemies[i].deadTimer <= 0) this.deadEnemies.splice(i, 1);
    }

    // Firing
    if (input.mouseDown && !this.betweenWaves) {
      const ev = player.tryFire(this.empToggle, this.weather, wMX, wMY, this.enemies, this.boss, player.powerMult);
      if (ev) {
        achievements.onWeaponUsed(player.wpnIdx);
        this._processFireEvent(ev, wMX, wMY);
        device.shoot();
      }
    }

    // Nuke countdown
    if (player.nukeCharging) {
      this.hud.updateNukeBar(1 - player.nukeTimer / 2, true);
      if (player.nukeTimer <= 0) {
        player.nukeCharging = false;
        this.hud.updateNukeBar(0, false);
        this._detonateNuke();
      }
    }

    // Enemy AI
    const eEvents = updateEnemies(
      this.enemies, this.deadEnemies, this.boss, dt,
      player.x, player.y, WW, WH,
      player.invincible, player.ghostActive, player.empShieldActive,
      this.obstacleManager.list
    );
    this._processEnemyEvents(eEvents, dt);

    // Boss AI
    if (this.boss) {
      const bEvents = updateBoss(this.boss, dt, player.x, player.y, WW, WH, this.enemies, this.wave);
      this._processBossEvents(bEvents, dt);
    }

    // Projectiles
    this.projManager.update(dt, WW, WH);
    // Projectile-player collision
    if (!player.empShieldActive && player.invincible <= 0 && !player.ghostActive) {
      for (let i = this.projManager.list.length - 1; i >= 0; i--) {
        const p = this.projManager.list[i];
        if (dist(p.x, p.y, player.x, player.y) < p.r + 11) {
          p.active = false;
          this._hurtPlayer();
        }
      }
    }

    // Particles, beams, floats
    this.particles.update(dt);
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) this.beams.splice(i, 1);
    }
    this.floats.update(dt);
    this.powerupManager.update(dt);

    // Power-up pickup
    const pu = this.powerupManager.checkPickup(player.x, player.y);
    if (pu) {
      if (pu === 'health') { player.hp = Math.min(player.hp + 1, player.maxHp); this.hud.updateHP(player.hp, player.maxHp); }
      else if (pu === 'credits') { this.credits += 50; this.hud.updateCredits(this.credits); }
      else if (pu === 'ammo') { player.wpnCDs.fill(0); }
      this.sfx.powerup();
      device.pickup();
      this.floats.spawn(player.x, player.y - 20, pu.toUpperCase(), '#39FF14');
    }

    // Weather
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) this._pickWeather(this.wave);
    if (this.weather === 'STORM') {
      this.stormTimer -= dt;
      if (this.stormTimer <= 0) {
        this.stormTimer = 2.8 + Math.random() * 3;
        if (this.enemies.length > 0) {
          const tgt = this.enemies[Math.floor(Math.random() * this.enemies.length)];
          this._damageEnemy(tgt, 2, false);
          this.flashAlpha = 0.1;
          this.beams.push({ x1: tgt.x, y1: 0, x2: tgt.x, y2: tgt.y, col: '#FFFFFF', life: 0.14, maxLife: 0.14, lw: 3 });
        }
      }
    }
    if (this.weather === 'EMP') {
      this.empFlipTimer -= dt;
      if (this.empFlipTimer <= 0) { this.empFlipTimer = 2.5 + Math.random() * 2; this.empToggle = !this.empToggle; }
    }
    if (this.weather === 'DATA_RAIN') {
      this.rainDrops.forEach(r => { r.y += r.spd; if (r.y > lH) r.y = -r.len; });
    }

    // Ambient particles
    this.ambient.forEach(a => {
      a.phase += dt; a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < 0) a.x += WW; if (a.x > WW) a.x -= WW;
      if (a.y < 0) a.y += WH; if (a.y > WH) a.y -= WH;
    });

    // Effects decay
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
    if (this.chromAberr > 0) this.chromAberr = Math.max(0, this.chromAberr - dt * 4);
    if (this.shakeAmt > 0.4) this.shakeAmt = Math.max(0, this.shakeAmt - this.shakeAmt * 5.5 * dt - 0.05);
    if (this._bossGlitchTimer > 0) this._bossGlitchTimer -= dt;
    if (this._bossIncomingTimer > 0) this._bossIncomingTimer -= dt;

    // Combo
    if (this.comboTimer > 0) this.comboTimer -= dt * player.comboDecayMult;
    else this.combo = Math.max(1, this.combo - 1.1 * dt);
    this.hud.updateCombo(this.combo);

    // Kill streak decay
    if (this.streakTimer > 0) this.streakTimer -= dt;
    else if (this.killStreak > 0) this.killStreak = 0;

    // HUD updates
    const wpnPct = player.wpnCDs[player.wpnIdx] > 0 ? 1 - player.wpnCDs[player.wpnIdx] / player.currentWeapon.cd : 1;
    this.hud.updateWeaponCD(wpnPct, player.overclockActive, player.currentWeapon.col);
    this.hud.updateAbilities(player.abCDs, player.abilityCDMult);
    this.hud.updateShield(player.empShieldActive, player.empShieldTimer / 5);
    this.hud.updateEnemyCount(this.enemies.length + (this.boss ? 1 : 0));
    this.audio.updateMusic(dt, this.enemies.length + (this.boss ? 4 : 0), !!this.boss);

    // Wave completion check
    if (!this.betweenWaves) {
      const bossWave = this.wave % 5 === 0;
      if (bossWave ? this.boss === null : (this.enemies.length === 0 && !this.boss)) {
        this._endWave();
      }
    } else {
      this.betweenTimer -= dt;
      if (this.betweenTimer <= 0 && !this.modalOpen) this._startWave(this.wave + 1);
    }

    // Keyboard shortcuts (non-modal)
    if (!this.modalOpen) {
      this._handleKeys();
    }
  }

  _handleKeys() {
    const k = this.input;
    const p = this.player;

    // We read key state on each frame, but track "just pressed" via a simple flag map
    if (!this._prevKeys) this._prevKeys = {};
    const check = (key, fn) => {
      const pressed = k.isDown(key);
      if (pressed && !this._prevKeys[key]) { fn(); }
      this._prevKeys[key] = pressed;
    };

    for (let i = 1; i <= 9; i++) check(i.toString(), () => this._setWeapon(i - 1));
    check('0', () => this._setWeapon(9));
    check('q', () => this._setWeapon((p.wpnIdx + 9) % 10));
    check('e', () => this._setWeapon((p.wpnIdx + 1) % 10));
    check('f', () => this._useAbility('bomb'));
    check('g', () => this._useAbility('kp'));
    check('x', () => this._useAbility('dash'));
    check('v', () => this._useAbility('overclock'));
    check('c', () => this._useAbility('empshield'));
    check('z', () => this._useAbility('timewarp'));
    check('tab', () => { if (this.betweenWaves) this._openShopNow(); });
    check('escape', () => this._togglePause());
  }

  _setWeapon(i) {
    this.player.setWpn(i);
    this.hud.updateWeapon(this.player.currentWeapon, this.player.overclockActive);
    achievements.onWeaponUsed(i);
  }

  _useAbility(name) {
    if (!this.running || this.betweenWaves) return;
    const p = this.player;
    const wMX = this.input.worldMX(this.camera.x);
    const wMY = this.input.worldMY(this.camera.y);
    let used = false;

    if (name === 'bomb') {
      if (!p.startBomb()) return;
      this.sfx.bomb();
      const R = 230;
      for (const e of this.enemies) { if (dist(e.x, e.y, p.x, p.y) < R) this._damageEnemy(e, 4 * p.powerMult, true); }
      if (this.boss && dist(this.boss.x, this.boss.y, p.x, p.y) < R) this._damageBoss(4 * p.powerMult);
      this.particles.burst(p.x, p.y, '#FF8800', 28, 220, this._particleMult());
      this._shake(p.x, p.y, 16);
      this.floats.spawn(p.x, p.y - 30, 'BOMB!', '#FF8800');
      used = true;
    } else if (name === 'kp') {
      if (!p.useKP()) return;
      this.sfx.kernelPanic();
      this.enemies.forEach(e => { e.frozen = 3.8; e.vx = 0; e.vy = 0; });
      if (this.boss) this.boss.frozen = 2.5;
      this.shakeAmt = 8; this.flashAlpha = 0.22;
      this.hud.showMsg('KERNEL PANIC', 'All Threats Frozen');
      used = true;
    } else if (name === 'dash') {
      if (!p.useDash(wMX, wMY)) return;
      this.sfx.dash();
      used = true;
    } else if (name === 'overclock') {
      if (!p.useOverclock()) return;
      this.sfx.overclock();
      this.hud.showMsg('OVERCLOCK', 'Weapons Supercharged');
      used = true;
    } else if (name === 'empshield') {
      if (!p.useEmpShield()) return;
      this.sfx.empShield();
      this.projManager.clear();
      this.hud.showMsg('EMP SHIELD', 'Projectiles Negated');
      used = true;
    } else if (name === 'timewarp') {
      if (!p.useTimeWarp()) return;
      this.sfx.timeWarp();
      this.enemies.forEach(e => { e.frozen = Math.max(e.frozen, 2.5); e.vx = 0; e.vy = 0; });
      if (this.boss) this.boss.frozen = Math.max(this.boss.frozen || 0, 2.5);
      this.hud.showMsg('TIME WARP', 'Reality Suspended');
      used = true;
    }

    if (used) achievements.onAbilityUsed(name);
  }

  _openShopNow() {
    if (this.modalOpen) return;
    this.modalOpen = true;
    const gameState = { credits: this.credits, projManager: this.projManager };
    openShopModal(this.player, gameState, () => {
      this.credits = gameState.credits; // sync back
      this.hud.updateCredits(this.credits);
      this.modalOpen = false;
    });
  }

  // ── Fire processing ───────────────────────────────────────────────────────
  _processFireEvent(ev, wMX, wMY) {
    if (!ev) return;
    this.sfx.shoot(ev.weaponType);

    // Add beams
    for (const b of ev.beams) {
      this.beams.push({ ...b, maxLife: b.life });
    }

    // Process damages
    for (const d of ev.damages) {
      if (d.isBoss) this._damageBoss(d.dmg);
      else this._damageEnemy(d.target, d.dmg, d.big || false);
    }

    // Specials
    for (const s of ev.specials) {
      if (s.type === 'burst') this.particles.burst(s.x, s.y, s.col, s.n, s.spd, this._particleMult());
      if (s.type === 'blackhole_start') this.hud.showMsg('BLACK HOLE', 'Gravity Singularity');
      if (s.type === 'nuke_charging') { /* bar handled in update */ }
    }

    // Wave ring shakeDir
    if (ev.weaponType === 'wave') this._shake(this.player.x, this.player.y, 5);
  }

  _processEnemyEvents(events, dt) {
    for (const ev of events) {
      if (ev.type === 'kill') {
        this._killEnemy(ev.enemy);
      } else if (ev.type === 'proj') {
        this.projManager.spawn(ev.x, ev.y, ev.vx, ev.vy, ev.r, ev.col, ev.life);
      } else if (ev.type === 'burst') {
        this.particles.burst(ev.x, ev.y, ev.col, ev.n, ev.spd, this._particleMult());
      } else if (ev.type === 'hurtPlayer') {
        this._hurtPlayer();
      } else if (ev.type === 'cloneSpawn') {
        const e = makeEnemy(
          clamp(ev.x, 60, this.camera.ww - 60),
          clamp(ev.y, 60, this.camera.wh - 60),
          ev.baseType, ev.waveNum || this.wave
        );
        if (ev.halfHp) { e.hp = Math.max(1, Math.floor(e.hp * 0.5)); e.maxHp = e.hp; }
        this.enemies.push(e);
      } else if (ev.type === 'empDisable') {
        this.player.applyEmpDisable(ev.duration);
        this.hud.showMsg('EMP DISABLED', 'Abilities offline for ' + ev.duration + 's');
        this.flashAlpha = 0.15; this.chromAberr = 0.5;
      }
    }
  }

  _processBossEvents(events, dt) {
    for (const ev of events) {
      if (ev.type === 'proj') {
        this.projManager.spawn(ev.x, ev.y, ev.vx, ev.vy, ev.r, ev.col, ev.life);
      } else if (ev.type === 'burst') {
        this.particles.burst(ev.x, ev.y, ev.col, ev.n, ev.spd, this._particleMult());
      } else if (ev.type === 'hurtPlayer') {
        this._hurtPlayer();
      } else if (ev.type === 'cloneSpawn') {
        const e = makeEnemy(
          clamp(ev.x, 60, this.camera.ww - 60),
          clamp(ev.y, 60, this.camera.wh - 60),
          ev.baseType, ev.waveNum || this.wave
        );
        if (ev.halfHp) { e.hp = Math.max(1, Math.floor(e.hp * 0.5)); e.maxHp = e.hp; }
        this.enemies.push(e);
      } else if (ev.type === 'empDisable') {
        this.player.applyEmpDisable(ev.duration);
        this.hud.showMsg('EMP DISABLED', 'Abilities offline', 1000);
        this.flashAlpha = 0.2; this.chromAberr = 0.6;
      } else if (ev.type === 'bossPhase2') {
        this.sfx.bossAppear();
        this.hud.showMsg('PHASE 2', 'Critical System Override');
      }
    }
  }

  // ── Damage ────────────────────────────────────────────────────────────────
  _damageEnemy(e, dmg, big) {
    if (!e || e.hp <= 0) return;
    e.hp -= dmg; e.hitFlash = 0.13;
    this.sfx.hit();
    if (big) this.particles.burst(e.x, e.y, e.col, 8, 35, this._particleMult());
    if (e.hp <= 0) this._killEnemy(e);
  }

  _damageBoss(dmg) {
    if (!this.boss) return;
    this.boss.hp -= dmg; this.boss.hitFlash = 0.1;
    this.sfx.bossHit();
    this.floats.spawn(this.boss.x + (Math.random() - 0.5) * 40, this.boss.y - 40, '-' + dmg.toFixed(1), '#FF5555');
    if (this.boss.hp <= 0) this._killBoss();
  }

  _killEnemy(e) {
    const i = this.enemies.indexOf(e);
    if (i < 0) return;
    this.enemies.splice(i, 1);
    this.deadEnemies.push({ ...e, deadTimer: 25 });

    const pts = Math.round(e.pts * this.combo * progression.scoreMult());
    this.score += pts;
    this.credits += Math.floor(e.pts * 0.1);
    this.combo = Math.min(this.combo + 0.4, 8);
    this.comboTimer = 2.5;
    this.totalKills++;
    this.sfx.kill();

    // Death explosion
    const n = e.t === 'necro' ? 20 : e.t === 'tank' ? 22 : 12;
    const spd = e.t === 'necro' ? 90 : e.t === 'tank' ? 80 : 55;
    this.particles.burst(e.x, e.y, e.col, n, spd, this._particleMult());
    this.floats.spawn(e.x, e.y - 16, '+' + pts, e.col);

    // Kill streak
    this.killStreak++; this.streakTimer = 2.5;
    if (this.killStreak >= 2 && this.killStreak < STREAK_NAMES.length) {
      this.hud.showStreak(STREAK_NAMES[Math.min(this.killStreak, STREAK_NAMES.length - 1)], STREAK_COLS[Math.min(this.killStreak, STREAK_COLS.length - 1)], this.killStreak);
    }

    this.hud.updateScore(this.score);
    this.hud.updateCredits(this.credits);

    achievements.onKill(this.totalKills);

    // Maybe spawn power-up
    this.powerupManager.maybeSpawn(e.x, e.y, this.wave);
  }

  _killBoss() {
    if (!this.boss) return;
    const pts = Math.round(this.boss.pts * this.combo * progression.scoreMult());
    this.score += pts;
    this.credits += 350;
    this.bossKills++;
    this.particles.burst(this.boss.x, this.boss.y, this.boss.col || '#FF0000', 35, 160, this._particleMult());
    this._shake(this.boss.x, this.boss.y, 25);
    this.flashAlpha = 0.4;
    this.floats.spawn(this.boss.x, this.boss.y - 50, '+' + pts + ' BOSS!', '#f59e0b');
    this.hud.updateScore(this.score);
    this.hud.updateCredits(this.credits);
    this.boss = null;
    this.sfx.kill();
    this.hud.showMsg('BOSS ELIMINATED', 'Threat Neutralized');
    achievements.onBossKill(this.bossKills);
    progression.addSP(2); // bonus SP for boss kill
  }

  _hurtPlayer() {
    if (!this.player.hurt()) return;
    this.hud.updateHP(this.player.hp, this.player.maxHp);
    this.sfx.hurt();
    this._shake(this.player.x, this.player.y, 20);
    this.flashAlpha = 0.28; this.chromAberr = 0.8;
    device.hit();
    achievements.onPlayerHit();
    if (this.player.isDead()) {
      this._gameOver();
    }
  }

  _detonateNuke() {
    this.player.nukeRad = 10;
    const R = 360;
    this.sfx.nuke();
    for (const e of this.enemies) { if (dist(e.x, e.y, this.player.nukeX, this.player.nukeY) < R) this._damageEnemy(e, 8 * this.player.powerMult, true); }
    if (this.boss && dist(this.boss.x, this.boss.y, this.player.nukeX, this.player.nukeY) < R) this._damageBoss(8 * this.player.powerMult);
    this.particles.burst(this.player.nukeX, this.player.nukeY, '#FF4400', 44, R * 0.9, this._particleMult());
    this._shake(this.player.nukeX, this.player.nukeY, 28);
    this.flashAlpha = 0.7; this.chromAberr = 1;
  }

  _shake(srcX, srcY, amt) {
    this.shakeAmt = amt;
    // camera.shakeDir stores metadata but we drive shake from shakeAmt in render
  }

  // ── Wave management ───────────────────────────────────────────────────────
  _startWave(wv) {
    this.wave = wv;
    this.betweenWaves = false;
    this.enemies = []; this.boss = null;
    this.projManager.clear();
    this.mapIdx = this.nextMapIdx;
    this.obstacleManager.build(wv, this.camera.ww, this.camera.wh);
    this.hud.showMapName(MAPS[this.mapIdx].n);

    const isBoss = wv % 5 === 0;
    if (isBoss) {
      const bossType = BOSS_TYPES[Math.floor((wv / 5 - 1) % BOSS_TYPES.length)];
      this.boss = makeBoss(bossType, wv, this.camera.ww, this.camera.wh);
      this.waveEnemyCount = 1;
      this._bossGlitchTimer = 0.5;
      this._bossIncomingTimer = 1.5;
      this.hud.showMsg('BOSS WAVE', 'Critical Threat Detected', 3000);
      this.sfx.bossAppear();
      this.flashAlpha = 0.3;
    } else {
      const count = 5 + wv * 3;
      this.waveEnemyCount = count;
      const ftypes = ['ring', 'v', 'line', 'diamond'];
      if (wv >= 2 && Math.random() < 0.45) {
        const ft = ftypes[Math.floor(Math.random() * ftypes.length)];
        const fc = Math.min(6, count);
        const fx = this.camera.x + this.camera.vw * (0.3 + Math.random() * 0.4);
        const fy = this.camera.y + this.camera.vh * (0.3 + Math.random() * 0.4);
        spawnFormation(this.enemies, ft, fx, fy, fc, pickType(wv), wv, this.camera.ww, this.camera.wh);
        for (let i = fc; i < count; i++) spawnRandom(this.enemies, wv, this.camera.ww, this.camera.wh);
      } else {
        for (let i = 0; i < count; i++) spawnRandom(this.enemies, wv, this.camera.ww, this.camera.wh);
      }
    }

    this._pickWeather(wv);
    this.sfx.waveComplete();
    this.hud.updateWave(wv);
    this.hud.updateEnemyCount(this.enemies.length + (this.boss ? 1 : 0));
    if (this.isSurvival) this.hud.showSurvivalWave(wv);
  }

  _endWave() {
    this.betweenWaves = true;
    this.betweenTimer = 4.5;
    this.nextMapIdx = Math.floor(Math.random() * MAPS.length);

    const hi = leaderboard.getHi(this.isSurvival);
    if (this.score > hi) leaderboard.submit(this.score, this.wave, this.isSurvival);

    this.hud.showMsg('WAVE ' + this.wave + ' CLEARED', 'Opening Skill Matrix…');

    // Award SP
    progression.addSP(1);

    achievements.onWaveComplete(this.wave, this.isSurvival);

    // Show narrative log
    setTimeout(() => { if (this.running) this.narrativeLog.show(); }, 300);

    // Open wave skill modal after short delay
    setTimeout(() => {
      if (this.running && this.betweenWaves) {
        this.modalOpen = true;
        openWaveSkillModal(this.player, this, () => {
          this.hud.updateCredits(this.credits);
          this.modalOpen = false;
        });
      }
    }, 900);
  }

  _gameOver() {
    this.running = false;
    this.sfx.playerDeath();
    device.death();
    leaderboard.submit(this.score, this.wave, this.isSurvival);
    bus.emit('gameOver', { score: this.score, wave: this.wave, survival: this.isSurvival });
  }

  // ── Weather ───────────────────────────────────────────────────────────────
  _pickWeather(wv) {
    const pool = wv >= 3 ? WTYPES : ['CLEAR', 'CLEAR', 'FOG'];
    this.weather = pool[Math.floor(Math.random() * pool.length)];
    this.weatherTimer = 75 + Math.random() * 90;
    this.hud.updateWeather(this.weather);
    if (this.weather === 'DATA_RAIN') {
      this.rainDrops = [];
      for (let i = 0; i < 110; i++) this.rainDrops.push({ x: Math.random() * this.renderer.lW, y: Math.random() * this.renderer.lH, spd: 2.5 + Math.random() * 5, len: 10 + Math.random() * 30 });
    }
    this.empToggle = false; this.empFlipTimer = 4; this.stormTimer = 3;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  render() {
    if (!this.running) return;
    const { renderer, camera } = this;
    const { ctx, W, H, dpr, lW, lH } = renderer;
    const M = MAPS[this.mapIdx];
    const t = performance.now() / 1000;
    const p = this.player;

    ctx.save();

    // Screen shake
    if (this.shakeAmt > 0.4) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeAmt * dpr,
        (Math.random() - 0.5) * this.shakeAmt * dpr
      );
    }

    // Background
    ctx.fillStyle = M.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    renderer.drawGrid(camera.x, camera.y, 44, M.gc);

    // Map extras
    const glow = this._quality !== 'low';
    if (this._quality !== 'low') {
      if (this.mapIdx === 0 || this.mapIdx === 3 || this.mapIdx === 4) {
        ctx.shadowBlur = 0;
        this.stars.forEach(s => {
          if (!camera.onScreen(s.x, s.y, 12)) return;
          const a = s.a * (0.6 + 0.4 * Math.sin(t * s.tw + s.phase));
          ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(camera.wx(s.x, dpr), camera.wy(s.y, dpr), s.r * dpr, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        });
      }
      if (this.mapIdx === 1) {
        this.stars.forEach(s => {
          if (!camera.onScreen(s.x, s.y, 12)) return;
          ctx.globalAlpha = s.a * 0.65; ctx.fillStyle = '#aaccff';
          ctx.beginPath(); ctx.arc(camera.wx(s.x, dpr), camera.wy(s.y, dpr), s.r * dpr, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        });
      }
      if (this.mapIdx === 2) {
        this.bldgs.forEach(b => {
          if (!camera.onScreen(b.x, lH - b.h, b.w + 20)) return;
          ctx.fillStyle = 'rgba(255,0,80,0.05)';
          ctx.fillRect(camera.wx(b.x, dpr), camera.wy(lH - b.h, dpr), b.w * dpr, b.h * dpr);
          ctx.strokeStyle = 'rgba(255,0,80,0.15)'; ctx.lineWidth = 1;
          ctx.strokeRect(camera.wx(b.x, dpr), camera.wy(lH - b.h, dpr), b.w * dpr, b.h * dpr);
        });
      }
      if (this.mapIdx === 5) {
        ctx.strokeStyle = 'rgba(255,30,0,0.07)'; ctx.lineWidth = 1;
        this.webLines.forEach(l => {
          if (!camera.onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 250)) return;
          ctx.beginPath(); ctx.moveTo(camera.wx(l.x1, dpr), camera.wy(l.y1, dpr)); ctx.lineTo(camera.wx(l.x2, dpr), camera.wy(l.y2, dpr)); ctx.stroke();
        });
      }
    }

    // Ambient particles
    if (glow) ctx.shadowBlur = 8;
    this.ambient.forEach(a => {
      if (!camera.onScreen(a.x, a.y, 10)) return;
      const pulse = a.a * (0.5 + 0.5 * Math.sin(t * 1.5 + a.phase));
      ctx.globalAlpha = pulse; ctx.fillStyle = a.col;
      if (glow) ctx.shadowColor = a.col;
      ctx.beginPath(); ctx.arc(camera.wx(a.x, dpr), camera.wy(a.y, dpr), a.r * dpr, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
    if (glow) ctx.shadowBlur = 0;

    // Obstacles
    this.obstacleManager.render(ctx, camera, dpr, M, this._quality);

    // Black hole
    if (p.bhActive) {
      const bx = camera.wx(p.bhX, dpr), by = camera.wy(p.bhY, dpr);
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, 135 * dpr);
      g.addColorStop(0, 'rgba(0,0,0,0.97)'); g.addColorStop(0.35, 'rgba(80,0,190,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 135 * dpr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(150,0,255,0.45)'; ctx.lineWidth = 1;
      for (let r = 22; r < 135; r += 28) { ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.arc(bx, by, r * dpr, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }

    // Nuke explosion ring
    if (p.nukeRad > 5) {
      const nx = camera.wx(p.nukeX, dpr), ny = camera.wy(p.nukeY, dpr);
      const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, p.nukeRad * dpr);
      g.addColorStop(0, 'rgba(255,240,100,0.9)'); g.addColorStop(0.4, 'rgba(255,80,0,0.5)'); g.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx, ny, p.nukeRad * dpr, 0, Math.PI * 2); ctx.fill();
    }
    if (p.nukeCharging) {
      ctx.strokeStyle = 'rgba(255,68,0,0.65)'; ctx.lineWidth = 2;
      ctx.setLineDash([9, 5]);
      ctx.beginPath(); ctx.arc(camera.wx(p.nukeX, dpr), camera.wy(p.nukeY, dpr), 58 * dpr, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Wave ring
    if (p.waveRing) {
      const pr = 1 - p.waveRingTimer / 0.55;
      ctx.strokeStyle = '#7FFF0088'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(camera.wx(p.waveRingX, dpr), camera.wy(p.waveRingY, dpr), pr * 210 * dpr, 0, Math.PI * 2); ctx.stroke();
    }

    // Chain lightning
    if (p.chainSegs.length && glow) {
      ctx.shadowBlur = 14; ctx.shadowColor = '#FFFF00';
      p.chainSegs.forEach(s => {
        ctx.strokeStyle = `rgba(255,255,80,${p.chainLife / 0.5 * 0.9})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(camera.wx(s.x1, dpr), camera.wy(s.y1, dpr)); ctx.lineTo(camera.wx(s.x2, dpr), camera.wy(s.y2, dpr)); ctx.stroke();
      });
      ctx.shadowBlur = 0;
    }

    // Beams
    this.beams.forEach(b => {
      const a = b.life / b.maxLife;
      ctx.globalAlpha = a * 0.9; ctx.strokeStyle = b.col; ctx.lineWidth = b.lw * dpr;
      if (glow) { ctx.shadowBlur = 22; ctx.shadowColor = b.col; }
      ctx.beginPath(); ctx.moveTo(camera.wx(b.x1, dpr), camera.wy(b.y1, dpr)); ctx.lineTo(camera.wx(b.x2, dpr), camera.wy(b.y2, dpr)); ctx.stroke();
      if (glow) ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Enemy projectiles
    this.projManager.render(ctx, camera, dpr, this._quality);

    // Boss HP bar + body
    renderBoss(ctx, this.boss, camera, dpr, this._quality);

    // Enemies
    renderEnemies(ctx, this.enemies, camera, dpr, this._quality);

    // Power-ups
    this.powerupManager.render(ctx, camera, dpr, t);

    // Particles
    this.particles.render(ctx, camera, dpr);

    // Player
    p.render(ctx, camera, dpr, this._quality, t);

    // Cursor crosshair
    const wMX = this.input.worldMX(camera.x);
    const wMY = this.input.worldMY(camera.y);
    const csx = camera.wx(wMX, dpr), csy = camera.wy(wMY, dpr);
    const cc = p.currentWeapon.col;
    ctx.strokeStyle = cc + '88'; ctx.lineWidth = 1.5;
    const ch = 9 * dpr;
    ctx.beginPath(); ctx.moveTo(csx - ch, csy); ctx.lineTo(csx + ch, csy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(csx, csy - ch); ctx.lineTo(csx, csy + ch); ctx.stroke();
    ctx.strokeStyle = cc + '55';
    ctx.beginPath(); ctx.arc(csx, csy, 5 * dpr, 0, Math.PI * 2); ctx.stroke();

    // Floating text
    this.floats.render(ctx, camera, dpr, this._quality);

    // Weather overlays
    if (this.weather === 'FOG') {
      const fg = ctx.createRadialGradient(this.input.mx * dpr, this.input.my * dpr, 60 * dpr, this.input.mx * dpr, this.input.my * dpr, Math.min(W, H) * 0.7);
      fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,0.86)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
    }
    if (this.weather === 'DATA_RAIN') {
      ctx.strokeStyle = M.sc + '44'; ctx.lineWidth = 1;
      this.rainDrops.forEach(r => { ctx.beginPath(); ctx.moveTo(r.x * dpr, r.y * dpr); ctx.lineTo(r.x * dpr, (r.y + r.len) * dpr); ctx.stroke(); });
    }
    if (this.empToggle && this.weather === 'EMP') { ctx.fillStyle = 'rgba(255,200,0,0.04)'; ctx.fillRect(0, 0, W, H); }

    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.min(W, H) * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

    // Flash
    if (this.flashAlpha > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`; ctx.fillRect(0, 0, W, H); }

    // Chromatic aberration
    if (this._quality === 'high' && this.chromAberr > 0.05) {
      ctx.globalAlpha = this.chromAberr * 0.18;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,0,1)'; ctx.fillRect(-4 * this.chromAberr * dpr, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,255,1)'; ctx.fillRect(4 * this.chromAberr * dpr, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }

    // Boss glitch
    if (this._bossGlitchTimer > 0) {
      for (let i = 0; i < 8; i++) {
        const gy = Math.random() * H;
        const gh = 4 + Math.random() * 14;
        const go = (Math.random() - 0.5) * 40;
        ctx.drawImage(ctx.canvas, go, gy, W, gh, 0, gy, W, gh);
      }
      ctx.fillStyle = `rgba(168,85,247,${Math.random() * 0.07})`; ctx.fillRect(0, 0, W, H);
    }

    // Boss incoming text
    if (this._bossIncomingTimer > 0.2) {
      const alpha = Math.min(1, this._bossIncomingTimer);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f59e0b';
      ctx.font = `900 ${Math.round(36 * dpr)}px 'JetBrains Mono',monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (glow) { ctx.shadowBlur = 40; ctx.shadowColor = '#f59e0b'; }
      ctx.fillText('BOSS INCOMING', W / 2, H / 2);
      if (glow) ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Watermark
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#BF00FF';
    ctx.font = (10 * dpr) + 'px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('K-PERCEPTION', W - 14 * dpr, H - 14 * dpr);
    ctx.globalAlpha = 1;

    ctx.restore();

    // Minimap
    if (this.minimap) {
      this.minimap.render({
        enemies: this.enemies, boss: this.boss, player: this.player,
        projManager: this.projManager, obstacleManager: this.obstacleManager,
        camera: this.camera,
        mapName: MAPS[this.mapIdx] ? MAPS[this.mapIdx].n : '',
        skinIdx: this.player.skinIdx, SKINS,
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _particleMult() {
    if (this._quality === 'low') return 0.3;
    if (this._quality === 'medium') return 0.6;
    return 1.0;
  }

  _playSFX(name) {
    if (typeof this.sfx[name] === 'function') this.sfx[name]();
  }

  _autoAdjustQuality(dt) {
    const fps = dt > 0 ? 1 / dt : 60;
    this._fpsSamples.push(fps);
    if (this._fpsSamples.length > 30) this._fpsSamples.shift();
    if (this._fpsSamples.length < 10) return;
    const avg = this._fpsSamples.reduce((a, b) => a + b, 0) / this._fpsSamples.length;

    if (avg < 30) {
      this._fpsLowTimer += dt; this._fpsHighTimer = 0;
      if (this._fpsLowTimer > 3) {
        this._quality = 'low'; this._fpsLowTimer = 0;
      }
    } else if (avg > 55) {
      this._fpsHighTimer += dt; this._fpsLowTimer = 0;
      if (this._fpsHighTimer > 5 && this._quality === 'low') {
        this._quality = 'medium'; this._fpsHighTimer = 0;
      }
    } else {
      this._fpsLowTimer = 0; this._fpsHighTimer = 0;
    }
  }

  // ── UI binding ────────────────────────────────────────────────────────────
  _bindVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.running && !this.paused) this._pause();
    });
  }

  _bindFullscreen() {
    const btn = document.getElementById('fullscreen-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    });
  }

  _bindPauseBtn() {
    const btn = document.getElementById('pause-btn');
    if (!btn) return;
    btn.addEventListener('click', () => this._togglePause());
  }

  _bindSettingsBtn() {
    const btn = document.getElementById('settings-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      this.modalOpen = true;
      openSettingsModal(settings => {
        if (settings) {
          this._settings = settings;
          this._quality = settings.quality;
        }
        this.modalOpen = false;
      });
    });
  }

  _bindSkillTreeBtn() {
    const btn = document.getElementById('skill-tree-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!this.betweenWaves && this.running) return; // only between waves or from menu
      this.modalOpen = true;
      openSkillTreeModal(() => { this.modalOpen = false; });
    });
  }

  _togglePause() {
    if (!this.running) return;
    if (this.paused) this._resume();
    else this._pause();
  }

  _pause() {
    this.paused = true;
    const el = document.getElementById('pause-overlay');
    if (el) el.classList.remove('hidden');
  }

  _resume() {
    this.paused = false;
    const el = document.getElementById('pause-overlay');
    if (el) el.classList.add('hidden');
  }
}
