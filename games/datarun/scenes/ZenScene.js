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
import { Storage } from '../data/Storage.js';
import { randRange } from '../utils/math.js';

const ZEN_SPEED = 220;
const ZEN_INTERVAL = 1.6;
const ZEN_GAP = 200;

export class ZenScene {
  constructor(game) {
    this._game = game;
    this._W = game.W;
    this._H = game.H;
    this._dpr = Device.dpr;

    this._t = 0;
    this._coins = 0;
    this._flips = 0;
    this._pipeTimer = 0;

    this._player = new Player(this._W * 0.22, this._H / 2);
    this._obstacles = [];
    this._powerups = [];
    this._pickups = [];
    this._particles = new ParticleEmitter();
    this._hud = new HUD();
    this._floatingText = new FloatingText();

    this._tapHandler = null;
    this._escHandler = null;
    this._blurHandler = null;
    this._resizeHandler = null;

    // Track zen plays
    const zenPlays = Storage.get('dr_zen_plays', 0) + 1;
    Storage.set('dr_zen_plays', zenPlays);
    game.stats.zenPlays = zenPlays;
  }

  enter() {
    this._tapHandler = () => this._onTap();
    this._escHandler = () => this._game.goToMenu();
    this._blurHandler = () => {};
    this._resizeHandler = ({ w, h, dpr }) => {
      this._W = w; this._H = h; this._dpr = dpr;
    };

    EventBus.on('tap', this._tapHandler);
    EventBus.on('escape', this._escHandler);
    EventBus.on('app:blur', this._blurHandler);
    EventBus.on('resize', this._resizeHandler);
  }

  exit() {
    EventBus.off('tap', this._tapHandler);
    EventBus.off('escape', this._escHandler);
    EventBus.off('app:blur', this._blurHandler);
    EventBus.off('resize', this._resizeHandler);
  }

  _onTap() {
    this._game.audioManager.initOnInteraction();
    this._player.flip();
    this._game.audioManager.play('flip');
    this._particles.emit(
      this._player.x * this._dpr,
      this._player.y * this._dpr,
      8,
      this._player.getTrailColor(),
      { speed: 2.5, life: 0.35, size: 2.5 }
    );
  }

  _spawnObstacle() {
    const obs = new Obstacle(this._W + PIPE_W, this._W, this._H, 0, OBSTACLE_TYPE.PIPE);
    // In Zen, use constant large gap
    obs.gapY = this._H * 0.5 - ZEN_GAP * 0.5 + randRange(-40, 40);
    obs.gapH = ZEN_GAP;
    this._obstacles.push(obs);

    if (Math.random() < 0.2) {
      const ptype = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      this._powerups.push(new PowerUp(this._W + PIPE_W + 80, obs.gapY + ZEN_GAP * 0.5, ptype));
    }
    if (Math.random() < 0.4) {
      this._pickups.push(new Pickup(this._W + PIPE_W + Math.random() * 100 + 40, randRange(80, this._H - 80)));
    }
  }

  update(dt) {
    this._t += dt;
    const H = this._H;
    const W = this._W;

    Effects.update(dt);

    if (this._game.renderer) {
      this._game.renderer.update(dt, ZEN_SPEED, this._player.y);
    }

    // Player
    this._player.update(dt, H);

    // Bounce instead of die at boundaries
    if (this._player.y < this._player.r + 4) {
      this._player.y = this._player.r + 4;
      if (this._player.gravDir < 0) {
        this._player.gravDir = 1;
        this._player.vy = Math.abs(this._player.vy) * 0.3;
      }
    }
    if (this._player.y > H - this._player.r - 4) {
      this._player.y = H - this._player.r - 4;
      if (this._player.gravDir > 0) {
        this._player.gravDir = -1;
        this._player.vy = -Math.abs(this._player.vy) * 0.3;
      }
    }

    // Spawn obstacles
    this._pipeTimer += dt;
    if (this._pipeTimer >= ZEN_INTERVAL) {
      this._pipeTimer = 0;
      this._spawnObstacle();
    }

    // Update/clip obstacles (no collision death in zen)
    for (let i = this._obstacles.length - 1; i >= 0; i--) {
      const obs = this._obstacles[i];
      obs.update(dt, ZEN_SPEED);
      if (obs.isOffScreen()) {
        this._obstacles.splice(i, 1);
      }
    }

    // Powerups
    for (let i = this._powerups.length - 1; i >= 0; i--) {
      const pu = this._powerups[i];
      pu.update(dt, ZEN_SPEED);
      if (!pu.collected && CollisionSystem.circleCircle(
        this._player.x, this._player.y, this._player.r + 6,
        pu.x, pu.y, pu.r
      )) {
        pu.collected = true;
        this._player.activatePowerup(pu.type, POWERUP_DURATION[pu.type] || 5);
        this._game.audioManager.play('powerup');
        this._floatingText.spawn(pu.x, pu.y - 20, pu.type + '!', pu.color);
        this._particles.emitBurst(pu.x * this._dpr, pu.y * this._dpr, 12, [pu.color, '#fff'], { speed: 3, life: 0.4 });
      }
      if (pu.isOffScreen() || pu.collected) {
        this._powerups.splice(i, 1);
      }
    }

    // Pickups
    for (let i = this._pickups.length - 1; i >= 0; i--) {
      const pk = this._pickups[i];
      pk.update(dt, ZEN_SPEED);
      if (!pk.collected) {
        const hit = this._player.magnetActive
          ? Math.hypot(this._player.x - pk.x, this._player.y - pk.y) < 120
          : CollisionSystem.circleCircle(this._player.x, this._player.y, this._player.r, pk.x, pk.y, pk.r);
        if (this._player.magnetActive) {
          const a = Math.atan2(this._player.y - pk.y, this._player.x - pk.x);
          pk.x += Math.cos(a) * 5;
          pk.y += Math.sin(a) * 5;
        }
        if (hit && Math.hypot(this._player.x - pk.x, this._player.y - pk.y) < this._player.r + pk.r + 5) {
          pk.collected = true;
          this._coins++;
          this._game.audioManager.play('coin');
          this._floatingText.spawn(pk.x, pk.y - 15, '+1 COIN', '#FFD700');
          this._game.addCoins(1);
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
    Effects.applyShake(ctx, dpr);

    if (this._game.renderer) {
      this._game.renderer.drawBackground(this._t);
    } else {
      ctx.fillStyle = '#05060d';
      ctx.fillRect(0, 0, W * dpr, H * dpr);
    }

    for (const obs of this._obstacles) obs.draw(ctx, dpr, H);
    for (const pk of this._pickups) pk.draw(ctx, dpr);
    for (const pu of this._powerups) pu.draw(ctx, dpr);

    this._particles.render(ctx);
    this._player.draw(ctx, dpr);
    this._floatingText.render(ctx, dpr);

    // HUD
    this._hud.draw(
      ctx, dpr, W, H,
      this._coins, this._coins,
      this._player.activePowerup,
      this._player.powerupTimer,
      this._player.activePowerup ? (POWERUP_DURATION[this._player.activePowerup] || 5) : 1,
      this._game.progression,
      this._player.gravDir,
      this._t,
      null
    );

    // ZEN MODE badge
    const badgeFs = Math.max(11, Math.min(W * 0.032, 18)) * dpr;
    ctx.font = `800 ${badgeFs}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur = 16 * dpr;
    ctx.shadowColor = '#00FFFF';
    ctx.fillStyle = '#00FFFF';
    ctx.fillText('ZEN MODE', W * dpr / 2, 18 * dpr);
    ctx.shadowBlur = 0;

    Effects.drawFlash(ctx, W * dpr, H * dpr);
    ctx.restore();
  }
}
