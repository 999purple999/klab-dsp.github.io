// ─── PlayerMovement ───────────────────────────────────────────────────────────
// State-machine based movement system for the player.
// States: Idle | Run | Dash | Grapple

const TRAIL_MAX    = 12;
const TRAIL_LIFE   = 0.18; // seconds each trail point lives

export class PlayerMovement {
  constructor() {
    this.state        = 'Idle';
    this.vx           = 0;
    this.vy           = 0;
    this.accel        = 1800;
    this.friction     = 0.88;
    this.maxSpeed     = 320;
    this.dashForce    = 900;
    this.dashDuration = 0.28;
    this.dashTimer    = 0;
    this.dashCooldown = 0;
    this.dashTrail    = [];   // [{x, y, life, maxLife}]

    // Position is owned externally; we track it to generate trail points.
    this._lastX = 0;
    this._lastY = 0;
  }

  /**
   * Main update.
   * @param {number} dt          - delta time in seconds
   * @param {{x:number,y:number}} inputDir - normalised direction from WASD / joystick
   * @param {boolean} dashRequested
   * @param {{x:number,y:number}|null} dashTarget - world position to dash toward
   * @param {number} px - current player world-x
   * @param {number} py - current player world-y
   * @returns {{vx, vy, state, dashTrail, dashCooldown}}
   */
  update(dt, inputDir, dashRequested, dashTarget, px = 0, py = 0) {
    // Tick dash cooldown
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    // ── Dash state ──────────────────────────────────────────────────────────
    if (this.state === 'Dash') {
      this.dashTimer -= dt;

      // Emit trail point each frame during dash
      this.dashTrail.push({ x: px, y: py, life: TRAIL_LIFE, maxLife: TRAIL_LIFE });
      if (this.dashTrail.length > TRAIL_MAX) this.dashTrail.shift();

      // Gradually bleed off dash velocity with reduced friction
      const dashFric = Math.pow(0.82, dt * 60);
      this.vx *= dashFric;
      this.vy *= dashFric;

      if (this.dashTimer <= 0) {
        this.dashTimer = 0;
        this.state = (Math.abs(inputDir.x) > 0.05 || Math.abs(inputDir.y) > 0.05) ? 'Run' : 'Idle';
      }
    }

    // ── Normal movement (Idle / Run / Grapple) ───────────────────────────────
    if (this.state !== 'Dash') {
      // Apply acceleration along input direction
      this.vx += inputDir.x * this.accel * dt;
      this.vy += inputDir.y * this.accel * dt;

      // Exponential friction (frame-rate independent)
      const fric = Math.pow(this.friction, dt * 60);
      this.vx *= fric;
      this.vy *= fric;

      // Clamp to max speed
      const spd = Math.hypot(this.vx, this.vy);
      if (spd > this.maxSpeed) {
        const s = this.maxSpeed / spd;
        this.vx *= s;
        this.vy *= s;
      }

      // Determine state
      if (this.state !== 'Grapple') {
        const moving = Math.abs(inputDir.x) > 0.05 || Math.abs(inputDir.y) > 0.05;
        this.state = moving ? 'Run' : 'Idle';
      }

      // Trigger dash if requested and off cooldown
      if (dashRequested && this.dashCooldown <= 0 && dashTarget) {
        this.dash(dashTarget.x, dashTarget.y, px, py);
      }
    }

    // ── Age trail points ─────────────────────────────────────────────────────
    for (let i = this.dashTrail.length - 1; i >= 0; i--) {
      this.dashTrail[i].life -= dt;
      if (this.dashTrail[i].life <= 0) this.dashTrail.splice(i, 1);
    }

    this._lastX = px;
    this._lastY = py;

    return {
      vx:         this.vx,
      vy:         this.vy,
      state:      this.state,
      dashTrail:  this.dashTrail,
      dashCooldown: this.dashCooldown,
    };
  }

  /**
   * Launch a dash toward (targetX, targetY) from (fromX, fromY).
   */
  dash(targetX, targetY, fromX, fromY) {
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = (dx / len) * this.dashForce;
    this.vy = (dy / len) * this.dashForce;
    this.dashTimer    = this.dashDuration;
    this.dashCooldown = 0.9; // cooldown after dash completes
    this.state        = 'Dash';
  }

  /** Player is invincible for most of the dash, except the very end. */
  isInvincibleDuringDash() {
    return this.dashTimer > 0.1;
  }

  /** Called externally to force the Grapple state. */
  setGrappleState(active) {
    if (active) {
      this.state = 'Grapple';
    } else if (this.state === 'Grapple') {
      this.state = 'Idle';
    }
  }
}
