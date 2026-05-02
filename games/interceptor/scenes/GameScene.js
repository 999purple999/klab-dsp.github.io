import { Packet, PACKET_TYPES } from '../entities/Packet.js';
import { PowerUpDrop, POWERUP_TYPES } from '../entities/PowerUpDrop.js';
import { Renderer } from '../rendering/Renderer.js';
import { ParticleEmitter } from '../rendering/ParticleEmitter.js';
import { Effects } from '../rendering/Effects.js';
import { HUD } from '../ui/HUD.js';
import { FloatingText } from '../ui/FloatingText.js';
import { bus } from '../utils/EventBus.js';
import { dist } from '../utils/math.js';
import { isMobile, vibrate } from '../utils/Device.js';
import { ObjectPool } from '../utils/ObjectPool.js';

const HIT_PAD = isMobile ? 38 : 18;
const FIREWALL_X = 45; // logical px from left

const DIFFICULTIES = {
  EASY:   { speedMult: 0.75, spawnMult: 0.8,  powerupFreq: 0.25 },
  NORMAL: { speedMult: 1.0,  spawnMult: 1.0,  powerupFreq: 0.2  },
  HARD:   { speedMult: 1.25, spawnMult: 1.3,  powerupFreq: 0.15 },
  EXPERT: { speedMult: 1.5,  spawnMult: 1.6,  powerupFreq: 0.1  },
};

function pickPacketType(wave) {
  // RANSOMWARE and TROJAN more common at higher waves
  const adjustedWeights = [
    { type: PACKET_TYPES.NORMAL,     weight: Math.max(20, 50 - wave * 2) },
    { type: PACKET_TYPES.WORM,       weight: 15 + wave },
    { type: PACKET_TYPES.TROJAN,     weight: 10 + Math.min(wave * 0.8, 20) },
    { type: PACKET_TYPES.RANSOMWARE, weight: 5 + Math.min(wave * 0.6, 15) },
  ];
  const total = adjustedWeights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of adjustedWeights) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return PACKET_TYPES.NORMAL;
}

export class GameScene {
  constructor(engine, audioManager, sfx, achievements, leaderboard, upgradeTree, difficulty) {
    this._engine = engine;
    this._audio = audioManager;
    this._sfx = sfx;
    this._achievements = achievements;
    this._leaderboard = leaderboard;
    this._upgradeTree = upgradeTree;
    this._difficulty = difficulty || 'NORMAL';
    this._diffCfg = DIFFICULTIES[this._difficulty] || DIFFICULTIES.NORMAL;

    this._canvas = engine.canvas;
    this._ctx = engine.ctx;

    this._renderer = new Renderer(this._ctx, engine.dpr);
    this._particles = new ParticleEmitter();
    this._effects = new Effects();
    this._hud = new HUD(document.body);
    this._floats = new FloatingText();

    this._packetPool = new ObjectPool(
      () => new Packet(),
      (p) => p.reset(),
      20
    );

    this._packets = [];
    this._powerUpDrop = null;
    this._pendingPowerUpSpawn = false;

    this._score = 0;
    this._wave = 0;
    this._streak = 1;
    this._hp = upgradeTree.isOwned('firewall_hp') ? 4 : 3;
    this._maxHp = this._hp;
    this._dataIntercepted = 0;
    this._speedMult = 1.0;
    this._serverFlash = 0;
    this._repairTimer = 0;
    this._repairProgress = 0;
    this._hasAutoRepair = upgradeTree.isOwned('auto_repair');
    this._hasPowerupRadius = upgradeTree.isOwned('powerup_radius');
    this._hasScoreBoost = upgradeTree.isOwned('score_boost');
    this._hasPacketInfo = upgradeTree.isOwned('packet_info');

    // Wave state
    this._waveState = 'idle'; // 'idle' | 'spawning' | 'wavebreak'
    this._waveBreakTimer = 0;
    this._spawnQueue = [];
    this._spawnTimer = 0;
    this._spawnInterval = 1400;
    this._waveDamage = 0;      // damage taken this wave
    this._wavesNoDamage = 0;

    // Power-up state
    this._activePowerUp = { active: false, type: null, remaining: 0, duration: 0 };

    // Stats for achievements
    this._totalBossKills = 0;
    this._totalPowerUpCollects = 0;
    this._totalTrojanKills = 0;
    this._totalRansomwareKills = 0;
    this._totalBreaches = 0;
    this._firstBlock = false;

    this._onDone = null;
    this._tapUnsub = null;

    this._centerMsg = null;
    this._centerTimer = null;

    this._paused = false;
    this._gameOver = false;

    this._buildCenterEl();
    this._hud.show();
  }

  _buildCenterEl() {
    let el = document.getElementById('game-center-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'game-center-msg';
      el.style.cssText = `
        position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        font-family:'JetBrains Mono','Courier New',monospace;
        font-size:clamp(18px,5vw,44px); font-weight:800;
        letter-spacing:.08em; text-align:center;
        pointer-events:none; z-index:15;
        opacity:0; transition:opacity .18s;
        text-shadow:0 0 40px currentColor;
        white-space:nowrap;
      `;
      document.body.appendChild(el);
    }
    this._centerEl = el;
  }

  _showCenter(text, color, duration) {
    clearTimeout(this._centerTimer);
    this._centerEl.textContent = text;
    this._centerEl.style.color = color;
    this._centerEl.style.opacity = '1';
    this._centerTimer = setTimeout(() => {
      this._centerEl.style.opacity = '0';
    }, duration || 1200);
  }

  onEnter(onDone) {
    this._onDone = onDone;
    this._tapUnsub = bus.on('tap', (e) => this._onTap(e));
    this._keyUnsub = bus.on('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') this.togglePause();
    });
    this._audio.resume();
    this._startWave();
  }

  onExit() {
    if (this._tapUnsub) { this._tapUnsub(); this._tapUnsub = null; }
    if (this._keyUnsub) { this._keyUnsub(); this._keyUnsub = null; }
    this._hud.destroy();
    if (this._centerEl) { this._centerEl.style.opacity = '0'; }
    clearTimeout(this._centerTimer);
    this._audio.stopBeat();
  }

  togglePause() {
    this._paused = !this._paused;
    if (this._paused) {
      this._showCenter('PAUSED', '#BF00FF', 999999);
      this._audio.stopBeat();
    } else {
      this._centerEl.style.opacity = '0';
      this._audio.startBeat(this._wave);
    }
  }

  _startWave() {
    this._wave++;
    const isBoss = this._wave > 1 && this._wave % 5 === 0;
    const diffCfg = this._diffCfg;

    const cnt = Math.min(
      Math.floor((4 + Math.floor(this._wave * 1.2)) * diffCfg.spawnMult),
      22
    );
    this._spawnInterval = Math.max(250, 1500 - this._wave * 80);
    this._spawnQueue = [];
    for (let i = 0; i < cnt; i++) {
      this._spawnQueue.push({ boss: isBoss && i === 0, delay: i * this._spawnInterval });
    }
    this._spawnTimer = 0;
    this._waveState = 'spawning';
    this._waveDamage = 0;
    this._speedMult = 1.0;

    this._audio.startBeat(this._wave);

    if (isBoss) {
      this._sfx.boss_appear();
      this._showCenter(`WAVE ${this._wave} — ⚠ BOSS INCOMING`, '#FFD700', 2000);
    } else {
      this._showCenter(`WAVE ${this._wave} — GO!`, '#00FF41', 1400);
    }

    this._hud.log(`wave ${this._wave} started — ${cnt} threats detected`);

    // Maybe spawn a power-up drop this wave
    if (
      !this._powerUpDrop &&
      Math.random() < diffCfg.powerupFreq
    ) {
      this._pendingPowerUpSpawn = true;
    }

    this._achievements.checkSpeedDemon(this._wave);
  }

  _spawnPacket(boss) {
    const engine = this._engine;
    const lH = engine.lH;
    const lW = engine.lW;
    const hudH = isMobile ? 72 : 80;

    const baseR = Math.max(isMobile ? 22 : 17, (isMobile ? 46 : 40) - this._wave * 1.5);
    const r = boss ? baseR * 1.0 : baseR; // boss size handled in Packet.init

    const baseSpeed = Math.max(55, (90 + this._wave * 22)) * this._diffCfg.speedMult;
    const speedVariation = boss ? 0.5 : (0.8 + Math.random() * 0.5);
    const speed = baseSpeed * speedVariation * this._speedMult;

    const type = boss ? PACKET_TYPES.BOSS : pickPacketType(this._wave);

    const p = this._packetPool.get();
    p.init({
      x: lW + r + 40,
      y: hudH + Math.random() * (lH - hudH - 20),
      vx: speed,
      vy: (Math.random() - 0.5) * 35,
      r,
      type,
      wave: this._wave,
      canvasH: lH,
      hudH,
    });

    this._packets.push(p);
  }

  _spawnPowerUp() {
    if (this._powerUpDrop && this._powerUpDrop.alive) return;
    const lW = this._engine.lW;
    const lH = this._engine.lH;
    const types = [POWERUP_TYPES.SLOW, POWERUP_TYPES.FREEZE, POWERUP_TYPES.EXPLODE];
    const type = types[Math.floor(Math.random() * types.length)];
    if (!this._powerUpDrop) this._powerUpDrop = new PowerUpDrop();
    this._powerUpDrop.init(
      lW * 0.3 + Math.random() * lW * 0.4,
      100,
      type
    );
  }

  _onTap({ x, y }) {
    if (this._paused || this._gameOver) return;
    if (this._waveState !== 'spawning' && this._waveState !== 'idle') return;

    this._audio.resume();

    // Check power-up first
    if (this._powerUpDrop && this._powerUpDrop.alive) {
      const radiusMult = this._hasPowerupRadius ? 1.5 : 1.0;
      if (this._powerUpDrop.hitTest(x, y, radiusMult)) {
        this._collectPowerUp(this._powerUpDrop.type, x, y);
        this._powerUpDrop.alive = false;
        return;
      }
    }

    // Check packets (reverse order so front is hit first)
    let hitSomething = false;
    for (let i = this._packets.length - 1; i >= 0; i--) {
      const p = this._packets[i];
      if (!p.alive) continue;
      const d = dist(p.x, p.y, x, y);
      if (d < p.r + HIT_PAD) {
        hitSomething = true;
        this._hitPacket(p, i, x, y);
        break;
      }
    }

    if (!hitSomething) {
      // Miss
      this._streak = 1;
      this._bumpSpeed();
      this._showCenter('MISS! SPEED UP!', '#FF5500', 700);
    }
  }

  _hitPacket(p, idx, tapX, tapY) {
    const dead = p.takeDamage(1);

    if (dead) {
      this._streak++;

      // Score calculation
      let pts = Math.round((120 + p.maxHp * 180) * Math.min(this._streak, 30));
      if (this._hasScoreBoost) pts = Math.round(pts * 1.2);
      this._score += pts;
      this._dataIntercepted += 0.1 + (p.type === PACKET_TYPES.BOSS ? 2 : 0);

      // Particles
      const col = p.type === PACKET_TYPES.BOSS ? '#FFD700' : p.color;
      this._particles.packetExplode(tapX, tapY, col, p.type === PACKET_TYPES.BOSS ? 45 : 24);
      this._particles.pixelBurst(tapX, tapY, col, 12);
      this._floats.spawn(tapX, tapY, `+${pts.toLocaleString()}`, col);

      // Effects
      if (p.type === PACKET_TYPES.BOSS) {
        this._effects.shake(6);
        this._effects.flash('#FFD700', 0.18, 0.2);
        vibrate([30]);
      } else {
        vibrate([10]);
      }

      // Audio
      if (p.type === PACKET_TYPES.BOSS) {
        this._sfx.tap_boss_hit();
      } else {
        this._sfx.tap_hit();
      }

      // Streak milestones
      if (this._streak === 5) {
        this._showCenter('STREAK ×5 🔥', '#FF8C00', 1100);
        this._sfx.streak_5();
      } else if (this._streak === 10) {
        this._showCenter('×10 — ON FIRE!!', '#FF3333', 1200);
      } else if (this._streak === 25) {
        this._showCenter('×25 — LEGENDARY ⚡', '#BF00FF', 1500);
      }
      this._achievements.checkStreak(this._streak);

      // Type-specific stat tracking
      if (p.type === PACKET_TYPES.BOSS) {
        this._totalBossKills++;
        this._achievements.checkBossSlayer(this._totalBossKills);
        this._hud.log('BOSS packet.exe ELIMINATED');
      } else if (p.type === PACKET_TYPES.TROJAN) {
        this._totalTrojanKills++;
        this._achievements.checkTrojanHunter(this._totalTrojanKills);
        this._hud.log('trojan.dll quarantined');
      } else if (p.type === PACKET_TYPES.RANSOMWARE) {
        this._totalRansomwareKills++;
        this._achievements.checkRansomware(this._totalRansomwareKills);
        this._hud.log('ransomware.exe blocked');
      } else {
        this._hud.log(`packet.exe blocked (+${pts})`);
      }

      // First block achievement
      if (!this._firstBlock) {
        this._firstBlock = true;
        this._achievements.checkFirstBlock();
      }

      // Remove packet
      this._packets.splice(idx, 1);
      this._packetPool.release(p);

    } else {
      // Damaged but alive
      this._sfx.tap_hit();
      this._particles.packetExplode(tapX, tapY, '#FFFFFF', 8);

      if (p.type === PACKET_TYPES.BOSS) {
        this._effects.triggerGlitch(8);
        this._floats.spawn(tapX, tapY, 'BOSS HIT!', '#FFD700');
        this._hud.log('BOSS packet.exe damaged');
      }

    }

    this._achievements.checkScore(this._score);
  }

  _splitTrojan(p, idx) {
    // Called from _hitPacket when trojan is hit — removes & replaces inline
    const snapX = p.x, snapY = p.y, snapR = p.r, snapVx = p.vx;
    if (this._packets.includes(p)) {
      this._packets.splice(this._packets.indexOf(p), 1);
      this._packetPool.release(p);
    }
    this._spawnTrojanFragments({ x: snapX, y: snapY, r: snapR, vx: snapVx });
  }

  _spawnTrojanFragments(p) {
    const lH = this._engine.lH;
    const hudH = isMobile ? 72 : 80;

    // Spawn 2 children
    for (let s = 0; s < 2; s++) {
      const child = this._packetPool.get();
      child.init({
        x: p.x,
        y: p.y + (s === 0 ? -p.r * 1.2 : p.r * 1.2),
        vx: p.vx * 1.3,
        vy: (s === 0 ? -55 : 55),
        r: p.r * 0.65,
        type: PACKET_TYPES.NORMAL,
        wave: this._wave,
        canvasH: lH,
        hudH,
      });
      child.isChild = true;
      child.color = '#FF88CC';
      child.label = 'FRAG';
      this._packets.push(child);
    }

    this._effects.flash('#FF88CC', 0.2, 0.25);
    this._hud.log('TROJAN split! — 2 fragments detected');
    this._floats.spawn(p.x, p.y, 'SPLIT!', '#FF88CC');
  }

  _collectPowerUp(type, x, y) {
    const colors = { SLOW: '#3388FF', FREEZE: '#88CCFF', EXPLODE: '#FF4400' };
    const col = colors[type] || '#BF00FF';

    this._particles.powerUpCollect(x, y, col);
    this._sfx.powerup_collect();
    vibrate([20, 10, 20]);

    this._totalPowerUpCollects++;
    this._achievements.checkPowerUser(this._totalPowerUpCollects);

    if (type === POWERUP_TYPES.SLOW) {
      this._activateSlow();
      this._hud.log('SLOW.exe activated — 0.4× speed');
    } else if (type === POWERUP_TYPES.FREEZE) {
      this._activateFreeze();
      this._hud.log('FREEZE.exe — all packets stopped');
    } else if (type === POWERUP_TYPES.EXPLODE) {
      this._activateExplode();
      this._hud.log('EXPLODE.exe — area clear!');
    }
    this._floats.spawn(x, y, type, col);
  }

  _activateSlow() {
    this._sfx.slow_activate();
    this._effects.flash('#3388FF', 0.2, 0.3);
    this._effects.setSlowTint(true);
    this._activePowerUp = { active: true, type: 'SLOW', remaining: 5, duration: 5 };
  }

  _activateFreeze() {
    this._sfx.freeze_activate();
    this._effects.flash('#88CCFF', 0.4, 0.3);
    this._effects.setFreezeTint(true);
    this._activePowerUp = { active: true, type: 'FREEZE', remaining: 2, duration: 2 };
    // Particles on all packets
    for (const p of this._packets) {
      this._particles.freezeEffect(p.x, p.y, 8);
    }
  }

  _activateExplode() {
    this._sfx.explode_activate();
    this._effects.shake(12);
    this._effects.flash('#FF4400', 0.5, 0.4);

    let pts = 0;
    for (const p of this._packets) {
      const ppts = Math.round((80 + p.maxHp * 100) * Math.min(this._streak, 10));
      pts += ppts;
      this._particles.packetExplode(p.x, p.y, p.color, 16);
      this._particles.pixelBurst(p.x, p.y, p.color, 8);
      this._packetPool.release(p);
    }
    this._packets = [];
    if (this._hasScoreBoost) pts = Math.round(pts * 1.2);
    this._score += pts;
    this._floats.spawn(this._engine.lW / 2, this._engine.lH / 2, `+${pts.toLocaleString()} BOOM!`, '#FF4400');
    this._activePowerUp = { active: true, type: 'EXPLODE', remaining: 0.1, duration: 0.1 };
    vibrate([50, 20, 50]);
  }

  _bumpSpeed() {
    this._speedMult = Math.min(2.2, this._speedMult + 0.15);
    for (const p of this._packets) {
      p.vx = Math.min(p.vx * 1.12, 500);
    }
  }

  _packetBreached(p, idx) {
    const dmg = p.type === PACKET_TYPES.RANSOMWARE ? 2 : 1;
    this._hp = Math.max(0, this._hp - dmg);
    this._streak = 1;
    this._waveDamage += dmg;
    this._repairTimer = 0;
    this._totalBreaches++;

    this._effects.shake(10);
    this._effects.flash('#FF0000', 0.35, 0.3);
    this._particles.firewallHit(FIREWALL_X, p.y, 20);
    this._serverFlash = 50;
    this._sfx.packet_breach();
    vibrate([40, 10, 40]);

    const msg = p.type === PACKET_TYPES.RANSOMWARE
      ? 'RANSOMWARE BREACH! -2 HP!'
      : 'BREACH! SPEED UP!';
    this._showCenter(msg, '#FF2222', 900);
    this._bumpSpeed();
    this._hud.log(
      p.type === PACKET_TYPES.RANSOMWARE
        ? 'RANSOMWARE breached — firewall -2HP!'
        : `${p.label} data breached — firewall damaged`
    );

    this._packets.splice(idx, 1);
    this._packetPool.release(p);

    if (this._hp <= 0) {
      setTimeout(() => this._endGame(), 350);
    }
  }

  _endGame() {
    this._gameOver = true;
    this._audio.stopBeat();
    this._sfx.game_over();

    // Check zero breach
    if (this._totalBreaches === 0) this._achievements.checkZeroBreach(0);
    // Firewall god
    if (this._wavesNoDamage >= 10) this._achievements.checkFirewallGod(this._wavesNoDamage);

    // Save lifetime score (add current run's score only once)
    this._upgradeTree.addRunScore(this._score);

    // Save run to leaderboard
    const totalPackets = this._totalBossKills * 8 + this._totalTrojanKills + this._totalRansomwareKills;
    const acc = totalPackets > 0
      ? Math.round((totalPackets / Math.max(totalPackets + this._totalBreaches, 1)) * 100)
      : 0;

    this._leaderboard.addRun({
      score: this._score,
      wave: this._wave,
      accuracy: acc,
      difficulty: this._difficulty,
    });

    if (this._onDone) {
      this._onDone({
        score: this._score,
        wave: this._wave,
        accuracy: acc,
        streak: this._streak,
        difficulty: this._difficulty,
      });
    }
  }

  update(dt) {
    if (this._paused || this._gameOver) return;

    // Active power-up timer
    if (this._activePowerUp.active) {
      this._activePowerUp.remaining -= dt;
      if (this._activePowerUp.remaining <= 0) {
        const wasType = this._activePowerUp.type;
        this._activePowerUp = { active: false, type: null, remaining: 0, duration: 0 };
        if (wasType === 'SLOW') this._effects.setSlowTint(false);
        if (wasType === 'FREEZE') this._effects.setFreezeTint(false);
      }
    }

    const isFrozen = this._activePowerUp.active && this._activePowerUp.type === 'FREEZE';
    const slowFactor = (this._activePowerUp.active && this._activePowerUp.type === 'SLOW') ? 0.4 : 1.0;

    // Auto-repair
    if (this._hasAutoRepair && this._hp < this._maxHp && this._hp > 0) {
      this._repairTimer += dt;
      this._repairProgress = Math.min(1, this._repairTimer / 5);
      if (this._repairTimer >= 5) {
        this._hp = Math.min(this._maxHp, this._hp + 1);
        this._repairTimer = 0;
        this._repairProgress = 0;
        this._hud.log('firewall.repair — +1HP restored');
        this._floats.spawn(FIREWALL_X, this._engine.lH / 2, '+1 HP', '#00FF41');
      }
    } else if (!this._hasAutoRepair) {
      this._repairProgress = 0;
    }

    // Server flash decay
    if (this._serverFlash > 0) this._serverFlash--;

    // Spawn queue
    if (this._waveState === 'spawning') {
      this._spawnTimer += dt * 1000;
      while (
        this._spawnQueue.length > 0 &&
        this._spawnTimer >= this._spawnQueue[0].delay
      ) {
        const item = this._spawnQueue.shift();
        this._spawnPacket(item.boss);
        // Spawn power-up on first packet if pending
        if (this._pendingPowerUpSpawn && this._packets.length === 1) {
          this._pendingPowerUpSpawn = false;
          this._spawnPowerUp();
        }
      }
    }

    // Update packets
    const lH = this._engine.lH;
    const lW = this._engine.lW;
    const hudH = isMobile ? 72 : 80;

    for (let i = this._packets.length - 1; i >= 0; i--) {
      const p = this._packets[i];
      if (!p.alive) continue;

      const result = p.update(dt, lH, hudH, isFrozen, slowFactor);

      if (result === 'SPLIT') {
        // Capture values before releasing to pool
        const snapX = p.x, snapY = p.y, snapR = p.r, snapVx = p.vx;
        this._packets.splice(i, 1);
        this._packetPool.release(p);
        this._spawnTrojanFragments({ x: snapX, y: snapY, r: snapR, vx: snapVx });
        continue;
      }

      // Reached firewall (left edge)
      if (p.x <= FIREWALL_X && !isFrozen) {
        this._packetBreached(p, i);
        if (this._gameOver) return;
      }
      // Fell off left side (shouldn't happen but safety)
      else if (p.x < -p.r - 60) {
        this._packets.splice(i, 1);
        this._packetPool.release(p);
      }
    }

    // Power-up update
    if (this._powerUpDrop && this._powerUpDrop.alive) {
      this._powerUpDrop.update(dt, lH);
    }

    // Check wave complete
    if (
      this._waveState === 'spawning' &&
      this._spawnQueue.length === 0 &&
      this._packets.length === 0
    ) {
      this._waveComplete();
    }

    // Effects update
    this._effects.update(dt);
    this._particles.update(dt);
    this._floats.update(dt);

    // HUD update
    this._hud.update({
      score: this._score,
      streak: this._streak,
      wave: this._wave,
      hp: this._hp,
      maxHp: this._maxHp,
      dataIntercepted: this._dataIntercepted,
      speedMult: this._speedMult,
      activePowerUp: this._activePowerUp,
    });
  }

  _waveComplete() {
    this._waveState = 'wavebreak';
    this._waveBreakTimer = 2.0;

    if (this._waveDamage === 0) {
      this._wavesNoDamage++;
    } else {
      this._wavesNoDamage = 0;
    }

    this._achievements.checkFirewallGod(this._wavesNoDamage);
    this._sfx.wave_clear();
    const msg = this._hp === this._maxHp
      ? `WAVE ${this._wave} CLEAR ✓`
      : `WAVE ${this._wave} CLEAR`;
    this._showCenter(msg, this._hp === this._maxHp ? '#00FF41' : '#FF8C00', 2000);
    this._hud.log(`wave ${this._wave} cleared — no active threats`);
    this._audio.stopBeat();
  }

  draw() {
    const engine = this._engine;
    const ctx = this._ctx;
    const W = engine.W;
    const H = engine.H;
    const dpr = engine.dpr;
    const lW = engine.lW;
    const lH = engine.lH;

    ctx.save();
    this._effects.applyShake(ctx, dpr);

    // Background
    this._renderer.drawBackground(W, H, dpr);

    // Firewall
    this._renderer.drawFirewall(W, H, dpr, this._hp, this._maxHp, this._repairProgress);

    // Server
    this._renderer.drawServer(W, H, dpr, this._serverFlash, this._hp, this._maxHp);

    // Particles (behind packets)
    this._particles.draw(ctx, dpr);

    // Packets
    for (const p of this._packets) {
      p.draw(ctx, dpr, this._hasPacketInfo, lW);
    }

    // Power-up drop
    if (this._powerUpDrop && this._powerUpDrop.alive) {
      this._powerUpDrop.draw(ctx, dpr);
    }

    // Floating text
    this._floats.draw(ctx, dpr, lW);

    // Effects overlays (flash, tints, glitch)
    this._effects.drawOverlays(ctx, W, H, dpr);

    // Branding
    this._renderer.drawBranding(W, H, dpr);

    ctx.restore();
  }

  // Called by Engine update loop — update logic then draw
  tick(dt) {
    this.update(dt);

    // Wave break countdown (only in tick, not draw)
    if (this._waveState === 'wavebreak') {
      this._waveBreakTimer -= dt;
      if (this._waveBreakTimer <= 0 && !this._gameOver) {
        this._waveState = 'idle';
        this._startWave();
      }
    }

    this.draw();
  }
}
