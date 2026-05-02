// ─── GrapplingHook ────────────────────────────────────────────────────────────
// Grappling hook entity: fires toward a target, hooks on arrival,
// then pulls the player toward the anchor point.
// Also stuns enemies it passes through.

export class GrapplingHook {
  constructor() {
    this.active     = false;
    this.hooked     = false;
    this.x          = 0;      // current hook position (world)
    this.y          = 0;
    this.targetX    = 0;      // anchor point (world)
    this.targetY    = 0;
    this.fromX      = 0;      // fire origin (for rendering the rope)
    this.fromY      = 0;
    this.speed      = 1200;   // travel speed px/s
    this.pullForce  = 600;    // force applied to player while hooked
    this.maxLength  = 480;
    this.timer      = 0;      // auto-release after maxLength / speed
    this.hookEnemy  = null;   // enemy reference if hooked to an enemy
    this._dx        = 0;      // unit direction of travel
    this._dy        = 0;
  }

  /**
   * Fire the hook from (fromX, fromY) toward (toX, toY).
   */
  fire(fromX, fromY, toX, toY) {
    this.active   = true;
    this.hooked   = false;
    this.hookEnemy = null;
    this.x        = fromX;
    this.y        = fromY;
    this.fromX    = fromX;
    this.fromY    = fromY;
    this.targetX  = toX;
    this.targetY  = toY;

    const len     = Math.hypot(toX - fromX, toY - fromY) || 1;
    this._dx      = (toX - fromX) / len;
    this._dy      = (toY - fromY) / len;

    // Auto-release timer: cap at max length
    const dist    = Math.min(len, this.maxLength);
    this.targetX  = fromX + this._dx * dist;
    this.targetY  = fromY + this._dy * dist;
    this.timer    = dist / this.speed;
  }

  /**
   * @param {number} dt
   * @param {number} playerX
   * @param {number} playerY
   * @param {Array}  enemies  - array of enemy objects with {px, py, stunTimer}
   * @returns {{pullX, pullY, hooked, x, y, targetX, targetY}}
   */
  update(dt, playerX, playerY, enemies) {
    if (!this.active) return { pullX: 0, pullY: 0, hooked: false, x: this.x, y: this.y, targetX: this.targetX, targetY: this.targetY };

    let pullX = 0;
    let pullY = 0;

    if (!this.hooked) {
      // ── Hook is flying toward target ───────────────────────────────────────
      this.timer -= dt;

      const stepDist = this.speed * dt;
      this.x += this._dx * stepDist;
      this.y += this._dy * stepDist;

      // Check if we reached the target
      const distToTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);
      if (distToTarget < stepDist * 2 || this.timer <= 0) {
        this.x      = this.targetX;
        this.y      = this.targetY;
        this.hooked = true;
      }

      // Stun enemies the hook passes through
      if (enemies) {
        for (const e of enemies) {
          if (!e || e.dead) continue;
          const ex = e.px ?? e.x ?? 0;
          const ey = e.py ?? e.y ?? 0;
          const er = e.sz ?? e.r ?? 12;
          if (Math.hypot(this.x - ex, this.y - ey) < er + 6) {
            // Stun for 1.5 seconds
            e.stunTimer = Math.max(e.stunTimer || 0, 1.5);
            this.hookEnemy = e;
            this.hooked    = true;
            this.x         = ex;
            this.y         = ey;
            break;
          }
        }
      }
    }

    if (this.hooked) {
      // If attached to an enemy, track its position
      if (this.hookEnemy && !this.hookEnemy.dead) {
        this.x = this.hookEnemy.px ?? this.hookEnemy.x ?? this.x;
        this.y = this.hookEnemy.py ?? this.hookEnemy.y ?? this.y;
      }

      // Compute pull force toward anchor
      const dx   = this.x - playerX;
      const dy   = this.y - playerY;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        pullX = (dx / dist) * this.pullForce;
        pullY = (dy / dist) * this.pullForce;
      } else {
        // Close enough – auto release
        this.release();
      }
    }

    return {
      pullX,
      pullY,
      hooked:  this.hooked,
      x:       this.x,
      y:       this.y,
      targetX: this.targetX,
      targetY: this.targetY,
    };
  }

  /** Retract and deactivate the hook. */
  release() {
    this.active    = false;
    this.hooked    = false;
    this.hookEnemy = null;
  }

  /**
   * Render the grappling hook rope and tip.
   * @param {CanvasRenderingContext2D} ctx
   * @param {function} wx  - world-to-screen X
   * @param {function} wy  - world-to-screen Y
   * @param {number}   DPR - device pixel ratio
   */
  render(ctx, wx, wy, DPR) {
    if (!this.active) return;

    const sx = wx(this.fromX);
    const sy = wy(this.fromY);
    const ex = wx(this.x);
    const ey = wy(this.y);

    ctx.save();

    if (this.hooked) {
      // ── Taut rope ───────────────────────────────────────────────────────────
      ctx.strokeStyle = '#FF8800';
      ctx.lineWidth   = 2 * DPR;
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur  = 8 * DPR;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Anchor circle
      ctx.fillStyle   = '#FFB84D';
      ctx.shadowBlur  = 14 * DPR;
      ctx.beginPath();
      ctx.arc(ex, ey, 5 * DPR, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ── Flying projectile + rope trailing back ─────────────────────────────
      ctx.strokeStyle = 'rgba(255,136,0,0.5)';
      ctx.lineWidth   = 1.5 * DPR;
      ctx.setLineDash([6 * DPR, 4 * DPR]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hook tip as small filled circle
      ctx.fillStyle  = '#FF8800';
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur  = 10 * DPR;
      ctx.beginPath();
      ctx.arc(ex, ey, 4 * DPR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
