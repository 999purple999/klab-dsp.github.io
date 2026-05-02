// ─── VirtualJoystick ──────────────────────────────────────────────────────────
// On-screen joystick for mobile play.
// Attach touch events from the canvas and call the three handlers.

export class VirtualJoystick {
  /**
   * @param {number} x      - centre X in CSS pixels (screen space)
   * @param {number} y      - centre Y in CSS pixels
   * @param {number} radius - outer ring radius (default 60)
   */
  constructor(x, y, radius) {
    this.baseX   = x;
    this.baseY   = y;
    this.radius  = radius || 60;
    this.knobX   = x;
    this.knobY   = y;
    this.active  = false;
    this.touchId = -1;
    this.dx      = 0;   // normalised output [-1, 1]
    this.dy      = 0;
  }

  // ── Touch handlers ──────────────────────────────────────────────────────────

  /** Call when a touchstart fires over the joystick base region. */
  onTouchStart(touch) {
    if (this.active) return;
    this.active  = true;
    this.touchId = touch.identifier;
    this._update(touch.clientX, touch.clientY);
  }

  /** Call for every touchmove event; checks identifier. */
  onTouchMove(touch) {
    if (touch.identifier !== this.touchId) return;
    this._update(touch.clientX, touch.clientY);
  }

  /** Call on touchend / touchcancel; resets if it's our touch. */
  onTouchEnd(touchId) {
    if (touchId !== this.touchId) return;
    this.active  = false;
    this.touchId = -1;
    this.knobX   = this.baseX;
    this.knobY   = this.baseY;
    this.dx      = 0;
    this.dy      = 0;
  }

  /** Compute knob position and normalised direction from a raw screen point. */
  _update(clientX, clientY) {
    const rawDx = clientX - this.baseX;
    const rawDy = clientY - this.baseY;
    const dist  = Math.hypot(rawDx, rawDy);

    if (dist > this.radius) {
      // Clamp knob to the rim
      this.knobX = this.baseX + (rawDx / dist) * this.radius;
      this.knobY = this.baseY + (rawDy / dist) * this.radius;
    } else {
      this.knobX = clientX;
      this.knobY = clientY;
    }

    // Normalise to [-1, 1]
    const clampedDist = Math.min(dist, this.radius);
    if (clampedDist < 2) {
      this.dx = 0;
      this.dy = 0;
    } else {
      this.dx = (rawDx / dist) * (clampedDist / this.radius);
      this.dy = (rawDy / dist) * (clampedDist / this.radius);
    }
  }

  /** Returns normalised direction vector. */
  getDirection() {
    return { x: this.dx, y: this.dy };
  }

  /**
   * Draw the joystick (base ring + knob).
   * Should only be called on mobile.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // Draw outer ring (base)
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#BF00FF';
    ctx.lineWidth   = 3;
    ctx.shadowColor = '#BF00FF';
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    ctx.arc(this.baseX, this.baseY, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle fill for the base
    ctx.globalAlpha = 0.08;
    ctx.fillStyle   = '#BF00FF';
    ctx.beginPath();
    ctx.arc(this.baseX, this.baseY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw knob
    ctx.globalAlpha = this.active ? 0.75 : 0.4;
    ctx.fillStyle   = '#BF00FF';
    ctx.shadowBlur  = 18;
    ctx.beginPath();
    ctx.arc(this.knobX, this.knobY, this.radius * 0.38, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
