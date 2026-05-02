import { EventBus } from '../utils/EventBus.js';
import { Device } from '../utils/Device.js';
import { Player } from '../entities/Player.js';
import { Obstacle, OBSTACLE_TYPE, PIPE_W } from '../entities/Obstacle.js';
import { PowerUp, POWERUP_TYPES, POWERUP_DURATION } from '../entities/PowerUp.js';
import { Pickup } from '../entities/Pickup.js';
import { CollisionSystem } from '../physics/CollisionSystem.js';
import { ParticleEmitter } from '../rendering/ParticleEmitter.js';
import { Effects } from '../rendering/Effects.js';
import { HUD } from '../ui/HUD.js';
import { FloatingText } from '../ui/FloatingText.js';
import { Modal } from '../ui/Modal.js';
import { randRange } from '../utils/math.js';

function difficultyFor(score) {
  return {
    speed: Math.min(640, 200 + score * 13),
    gapH: Math.max(90, 160 - score * 2.8),
    interval: Math.max(0.85, 1.7 - score * 0.028)
  };
}

export class GameScene {
  constructor(game) {
    this._game = game;
    this._W = game.W;
    this._H = game.H;
    this._dpr = Device.dpr;

    this._score = 0;
    this._coins = 0;
    this._flips = 0;
    this._powerupsCollected = 0;
    this._magnetsCollected = 0;
    this._shieldUsed = false;
    this._speed = 200;
    this._pipeTimer = 0;
    this._nextPipeInterval = 1.5;
    this._t = 0;
    this._dead = false;
    this._deathTimer = 0;
    this._xpGained = 0;

    this._player = new Player(this._W * 0.22, this._H / 2);
    this._obstacles = [];
    this._powerups = [];
    this._pickups = [];
    this._particles = new ParticleEmitter();
    this._hud = new HUD();
    this._floatingText = new FloatingText();
    this._modal = new Modal();

    this._tapHandler = null;
    this._escHandler = null;
    this._blurHandler = null;
    this._focusHandler = null;
    this._resizeHandler = null;
  }

  enter() {
    this._tapHandler = () => this._onTap();
    this._escHandler = () => this._game.pauseGame();
    this._blurHandler = () => { if (!this._dead) this._game.pauseGame(); };
    this._resizeHandler = ({ w, h, dpr }) => {
      this._W = w; this._H = h; this._dpr = dpr;
    };

    EventBus.on('tap', this._tapHandler);
    EventBus.on('escape', this._escHandler);
    EventBus.on('app:blur', this._blurHandler);
    EventBus.on('resize', this._resizeHandler);

    // Show tutorial on first run
    this._modal.showTutorial(null);
  }

  exit() {
    EventBus.off('tap', this._tapHandler);
    EventBus.off('escape', this._escHandler);
    EventBus.off('app:blur', this._blurHandler);
    EventBus.off('resize', this._resizeHandler);
    this._modal.clearTutorial();
  }

  _onTap() {
    this._game.audioManager.initOnInteraction();
    if (this._dead) return;
    if (this._game.state !== 'PLAYING') return;
    this._player.flip();
    this._game.audioManager.play('flip');
    // Flip burst particles
    this._particles.emit(
      this._player.x * this._dpr,
      this._player.y * this._dpr,
      8,
      this._player.getTrailColor(),
      { speed: 2.5, life: 0.35, size: 2.5 }
    );
  }

  _spawnPipe() {
    const type = (this._score > 5 && Math.random() < 0.18) ? OBSTACLE_TYPE.LASER : OBSTACLE_TYPE.PIPE;
    const obs = new Obstacle(this._W + PIPE_W, this._W, this._H, this._score, type);
    this._obstacles.push(obs);

    // Maybe spawn powerup in the gap
    if (type === OBSTACLE_TYPE.PIPE && Math.random() < 0.15) {
      const ptype = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      const gy = obs.gapY + obs.gapH * 0.5;
      this._powerups.push(new PowerUp(this._W + PIPE_W + 80, gy, ptype));
    }

    // Maybe spawn coin pickup
    if (Math.random() < 0.35) {
      const cy = randRange(60, this._H - 60);
      const cx = this._W + PIPE_W + Math.random() * 120 + 40;
      this._pickups.push(new Pickup(cx, cy));
    }
  }

  _die() {
    if (this._dead) return;
    if (this._player.shield) {
      // Shield absorbs one hit
      this._player.shield = false;
      this._player.activePowerup = null;
      this._player.powerupTimer = 0;
      this._shieldUsed = true;
      this._game.audioManager.play('hit');
      Effects.screenFlash('#3b82f6', 0.5);
      Effects.screenShake(6, 0.2);
      this._particles.emitBurst(
        this._player.x * this._dpr,
        this._player.y * this._dpr,
        20,
        ['#3b82f6', '#fff'],
        { speed: 4, life: 0.5 }
      );
      this._floatingText.spawn(this._player.x, this._player.y - 30, 'SHIELD!', '#3b82f6');
      return;
    }
    if (this._player.invincible) return;

    this._dead = true;
    this._player.alive = false;
    this._game.audioManager.play('gameover');
    if (navigator.vibrate) navigator.vibrate([50, 20, 50]);
    Effects.screenFlash('#FF2222', 0.8);
    Effects.screenShake(10, 0.4);
    Effects.chromaticAberration(1.5);

    // Death burst
    this._particles.emitBurst(
      this._player.x * this._dpr,
      this._player.y * this._dpr,
      48,
      ['#a855f7', '#FF2222', '#fff'],
      { speed: 5, life: 0.8 }
    );

    // Gain XP
    this._xpGained = Math.floor(this._score * 1.5) + this._coins;
    const leveledUp = this._game.progression.gainXP(this._xpGained);
    if (leveledUp) {
      this._game.audioManager.play('levelup');
    }

    // Add to leaderboard
    const now = new Date();
    const dateStr = `${now.getMonth()+1}/${now.getDate()}`;
    this._game.leaderboard.addRun({
      score: this._score,
      date: dateStr,
      coins: this._coins,
      flips: this._flips,
      level: this._game.progression.getLevel()
    });

    this._game.addCoins(this._coins);

    // Check daily challenge
    const daily = this._game.dailyChallenge;
    const dailyDone = daily.checkCompletion({ score: this._score });
    if (dailyDone) this._game.stats.dailyCompleted = true;

    // Schedule transition to GameOver
    setTimeout(() => {
      const runData = {
        score: this._score,
        coins: this._coins,
        flips: this._flips,
        xpGained: this._xpGained,
        powerupsCollected: this._powerupsCollected,
        magnetsCollected: this._magnetsCollected,
        shieldUsed: this._shieldUsed,
        leveledUp
      };
      this._game.gameOver(runData);
    }, 900);
  }

  update(dt) {
    this._t += dt;
    const W = this._W;
    const H = this._H;

    Effects.update(dt);

    if (this._dead) {
      this._deathTimer += dt;
      this._particles.update(dt);
      this._floatingText.update(dt);
      return;
    }

    const d = difficultyFor(this._score);
    this._speed = d.speed;

    // Update renderer parallax
    if (this._game.renderer) {
      this._game.renderer.update(dt, this._speed, this._player.y);
    }

    // Player physics
    this._player.update(dt, H);

    // Boundary death
    if (this._player.hitBoundary(H)) {
      this._die();
      this._player.clampToScreen(H);
      return;
    }

    // Spawn pipes
    this._pipeTimer += dt;
    if (this._pipeTimer >= d.interval) {
      this._pipeTimer = 0;
      this._spawnPipe();
    }

    // Update obstacles
    for (let i = this._obstacles.length - 1; i >= 0; i--) {
      const obs = this._obstacles[i];
      obs.update(dt, this._speed);

      // Score
      if (obs.type === OBSTACLE_TYPE.PIPE && !obs.scored && obs.x + obs.w < this._player.x) {
        obs.scored = true;
        this._score++;
        this._game.audioManager.play('coin');
        this._floatingText.spawn(W * 0.5, H * 0.38, '+1', '#39FF14');
      }

      // Collision
      if (this._player.alive) {
        if (obs.type === OBSTACLE_TYPE.PIPE) {
          if (CollisionSystem.playerVsPipe(this._player.x, this._player.y, this._player.r * 0.75, {
            x: obs.x, gapY: obs.gapY, gapH: obs.gapH, w: obs.w
          })) {
            this._die();
          }
        } else if (obs.type === OBSTACLE_TYPE.LASER) {
          if (CollisionSystem.playerVsLaser(this._player.x, this._player.y, this._player.r * 0.75, obs, W, H)) {
            this._die();
          }
        }
      }

      if (obs.isOffScreen()) {
        this._obstacles.splice(i, 1);
      }
    }

    // Update powerups
    for (let i = this._powerups.length - 1; i >= 0; i--) {
      const pu = this._powerups[i];
      pu.update(dt, this._speed);

      if (!pu.collected && CollisionSystem.circleCircle(
        this._player.x, this._player.y, this._player.r + 6,
        pu.x, pu.y, pu.r
      )) {
        pu.collected = true;
        this._player.activatePowerup(pu.type, POWERUP_DURATION[pu.type] || 5);
        this._powerupsCollected++;
        if (pu.type === 'MAGNET') this._magnetsCollected++;
        this._game.audioManager.play('powerup');
        this._floatingText.spawn(pu.x, pu.y - 20, pu.type + '!', pu.color);
        this._particles.emitBurst(
          pu.x * this._dpr, pu.y * this._dpr, 16,
          [pu.color, '#fff'],
          { speed: 3, life: 0.5 }
        );
      }

      if (pu.isOffScreen() || pu.collected) {
        this._powerups.splice(i, 1);
      }
    }

    // Update pickups (coins)
    const magnetRange = this._player.magnetActive ? 120 : 0;
    for (let i = this._pickups.length - 1; i >= 0; i--) {
      const pk = this._pickups[i];
      pk.update(dt, this._speed);

      if (!pk.collected) {
        let collected = false;
        if (this._player.magnetActive) {
          const d2 = Math.hypot(this._player.x - pk.x, this._player.y - pk.y);
          if (d2 < magnetRange) {
            // Attract coin toward player
            const angle = Math.atan2(this._player.y - pk.y, this._player.x - pk.x);
            pk.x += Math.cos(angle) * 5;
            pk.y += Math.sin(angle) * 5;
          }
          collected = d2 < this._player.r + pk.r + 10;
        } else {
          collected = CollisionSystem.circleCircle(
            this._player.x, this._player.y, this._player.r,
            pk.x, pk.y, pk.r
          );
        }

        if (collected) {
          pk.collected = true;
          this._coins++;
          this._game.audioManager.play('coin');
          this._floatingText.spawn(pk.x, pk.y - 15, '+1 COIN', '#FFD700');
        }
      }

      if (pk.isOffScreen() || pk.collected) {
        this._pickups.splice(i, 1);
      }
    }

    this._particles.update(dt);
    this._floatingText.update(dt);
  }

  render(ctx) {
    const dpr = Device.dpr;
    const W = this._W;
    const H = this._H;

    ctx.save();

    // Apply shake
    Effects.applyShake(ctx, dpr);

    // Background
    if (this._game.renderer) {
      this._game.renderer.drawBackground(this._t);
    } else {
      ctx.fillStyle = '#05060d';
      ctx.fillRect(0, 0, W * dpr, H * dpr);
    }

    // Obstacles
    for (const obs of this._obstacles) {
      obs.draw(ctx, dpr, H);
    }

    // Pickups
    for (const pk of this._pickups) {
      pk.draw(ctx, dpr);
    }

    // Powerups
    for (const pu of this._powerups) {
      pu.draw(ctx, dpr);
    }

    // Particles
    this._particles.render(ctx);

    // Player
    if (this._player.alive || this._dead) {
      this._player.draw(ctx, dpr);
    }

    // Floating text
    this._floatingText.render(ctx, dpr);

    // HUD
    this._hud.draw(
      ctx, dpr, W, H,
      this._score, this._coins,
      this._player.activePowerup,
      this._player.powerupTimer,
      this._player.activePowerup ? (POWERUP_DURATION[this._player.activePowerup] || 5) : 1,
      this._game.progression,
      this._player.gravDir,
      this._t,
      this._game.dailyChallenge
    );

    // Screen flash
    Effects.drawFlash(ctx, W * dpr, H * dpr);
    // Chromatic aberration (on death)
    Effects.drawChromaticAberration(ctx, W * dpr, H * dpr);

    ctx.restore();
  }
}
