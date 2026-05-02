// ─── PlayerMovement v2.0 ──────────────────────────────────────────────────────
// State-machine movement: Idle | Run | Dash | Slide | Grapple
// Physics: accel 5000 px/s², maxSpeed 650 px/s, dash 1200 px/s for 0.15 s

const TRAIL_MAX  = 20;
const TRAIL_LIFE = 0.16;

export class PlayerMovement {
  constructor() {
    this.state = 'Idle';
    this.vx    = 0;
    this.vy    = 0;

    // Normal movement — snappy feel
    this.accel    = 5000;
    this.friction = 0.85;
    this.maxSpeed = 650;

    // Dash
    this.dashForce    = 1200;
    this.dashDuration = 0.15;
    this.dashTimer    = 0;
    this.dashCooldown = 0;
    this.DASH_CD      = 1.5;
    this.dashTrail    = [];
    this._dashDirX    = 0;
    this._dashDirY    = 1;

    // Slide (Shift while running)
    this.slideForce    = 850;
    this.slideDuration = 0.22;
    this.slideTimer    = 0;
    this.slideCooldown = 0;
    this.SLIDE_CD      = 2.0;

    // Air dodge — visual offset only (top-down context)
    this.airJumpCooldown = 0;
    this.AIR_JUMP_CD     = 3.0;
    this.airJumpOffset   = 0;
    this.airJumpTimer    = 0;
    this.AIR_JUMP_DUR    = 0.4;

    this._invincible = false;
    this._lastX = 0;
    this._lastY = 0;
  }

  /**
   * @param {number} dt - delta time (seconds)
   * @param {{x:number,y:number}} inputDir - normalized direction
   * @param {boolean} dashRequested
   * @param {{x:number,y:number}|null} dashTarget - world-space position to dash toward
   * @param {boolean} slideRequested
   * @param {boolean} airJumpRequested
   * @param {number} px - current world X
   * @param {number} py - current world Y
   * @returns {{vx,vy,state,dashTrail,dashCooldown,slideCooldown,airJumpOffset,isInvincible}}
   */
  update(dt, inputDir, dashRequested, dashTarget, slideRequested = false, airJumpRequested = false, px = 0, py = 0) {
    if (this.dashCooldown  > 0) this.dashCooldown  -= dt;
    if (this.slideCooldown > 0) this.slideCooldown -= dt;
    if (this.airJumpCooldown > 0) this.airJumpCooldown -= dt;

    // Air dodge visual oscillation
    if (this.airJumpTimer > 0) {
      this.airJumpTimer -= dt;
      const t = 1 - (this.airJumpTimer / this.AIR_JUMP_DUR);
      this.airJumpOffset = Math.sin(t * Math.PI) * -30;
    } else {
      this.airJumpOffset = 0;
    }

    // ─── Dash state
    if (this.state === 'Dash') {
      this.dashTimer  -= dt;
      this._invincible = this.dashTimer > 0.04;

      this.dashTrail.push({ x: px, y: py, life: TRAIL_LIFE, maxLife: TRAIL_LIFE });
      if (this.dashTrail.length > TRAIL_MAX) this.dashTrail.shift();

      const dashFric = Math.pow(0.78, dt * 60);
      this.vx *= dashFric;
      this.vy *= dashFric;

      if (this.dashTimer <= 0) {
        this.dashTimer   = 0;
        this._invincible = false;
        this.state = this._moving(inputDir) ? 'Run' : 'Idle';
      }

      this._ageTrail(dt);
      return this._out(px, py);
    }

    // ─── Slide state
    if (this.state === 'Slide') {
      this.slideTimer -= dt;

      const sf = Math.pow(0.80, dt * 60);
      this.vx *= sf;
      this.vy *= sf;

      if (this.slideTimer <= 0) {
        this.slideTimer = 0;
        this.state = this._moving(inputDir) ? 'Run' : 'Idle';
      }

      this._ageTrail(dt);
      return this._out(px, py);
    }

    // ─── Normal movement (Idle / Run / Grapple)
    this.vx += inputDir.x * this.accel * dt;
    this.vy += inputDir.y * this.accel * dt;

    const fric = Math.pow(this.friction, dt * 60);
    this.vx *= fric;
    this.vy *= fric;

    const spd = Math.hypot(this.vx, this.vy);
    if (spd > this.maxSpeed) {
      const s = this.maxSpeed / spd;
      this.vx *= s;
      this.vy *= s;
    }

    if (this.state !== 'Grapple') {
      this.state = this._moving(inputDir) ? 'Run' : 'Idle';
    }

    // Persist last facing direction for directionless dash
    if (this._moving(inputDir)) {
      const l = Math.hypot(inputDir.x, inputDir.y) || 1;
      this._dashDirX = inputDir.x / l;
      this._dashDirY = inputDir.y / l;
    }

    // Dash trigger
    if (dashRequested && this.dashCooldown <= 0) {
      const target = dashTarget || { x: px + this._dashDirX * 60, y: py + this._dashDirY * 60 };
      this._startDash(target.x, target.y, px, py, inputDir);
    }

    // Slide trigger
    if (slideRequested && this.slideCooldown <= 0 && this._moving(inputDir)) {
      this._startSlide(inputDir);
    }

    // Air dodge trigger
    if (airJumpRequested && this.airJumpCooldown <= 0) {
      this.airJumpCooldown = this.AIR_JUMP_CD;
      this.airJumpTimer    = this.AIR_JUMP_DUR;
    }

    this._ageTrail(dt);
    return this._out(px, py);
  }

  _startDash(targetX, targetY, fromX, fromY, inputDir) {
    let dx = targetX - fromX;
    let dy = targetY - fromY;
    const len = Math.hypot(dx, dy);

    if (len < 5) {
      dx = this._dashDirX || inputDir.x;
      dy = this._dashDirY || inputDir.y;
      const fl = Math.hypot(dx, dy) || 1;
      dx /= fl; dy /= fl;
    } else {
      dx /= len; dy /= len;
    }

    this._dashDirX    = dx;
    this._dashDirY    = dy;
    this.vx           = dx * this.dashForce;
    this.vy           = dy * this.dashForce;
    this.dashTimer    = this.dashDuration;
    this.dashCooldown = this.DASH_CD;
    this.state        = 'Dash';
    this._invincible  = true;
  }

  _startSlide(inputDir) {
    const spd = Math.hypot(this.vx, this.vy) || this.slideForce;
    const nx = (this.vx / spd) || inputDir.x;
    const ny = (this.vy / spd) || inputDir.y;
    const nlen = Math.hypot(nx, ny) || 1;
    this.vx           = (nx / nlen) * this.slideForce;
    this.vy           = (ny / nlen) * this.slideForce;
    this.slideTimer   = this.slideDuration;
    this.slideCooldown = this.SLIDE_CD;
    this.state        = 'Slide';
  }

  _moving(dir) {
    return Math.abs(dir.x) > 0.05 || Math.abs(dir.y) > 0.05;
  }

  _ageTrail(dt) {
    for (let i = this.dashTrail.length - 1; i >= 0; i--) {
      this.dashTrail[i].life -= dt;
      if (this.dashTrail[i].life <= 0) this.dashTrail.splice(i, 1);
    }
  }

  _out(px, py) {
    this._lastX = px;
    this._lastY = py;
    return {
      vx:            this.vx,
      vy:            this.vy,
      state:         this.state,
      dashTrail:     this.dashTrail,
      dashCooldown:  this.dashCooldown,
      slideCooldown: this.slideCooldown,
      airJumpOffset: this.airJumpOffset,
      isInvincible:  this._invincible,
    };
  }

  isInvincibleDuringDash() { return this._invincible; }
  isSliding()               { return this.state === 'Slide'; }

  setGrappleState(active) {
    if (active) {
      this.state = 'Grapple';
    } else if (this.state === 'Grapple') {
      this.state = 'Idle';
    }
  }
}
