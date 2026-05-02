// ─── WeaponWheel ──────────────────────────────────────────────────────────────
// Radial weapon selector.  Show on right-click / long-press, hide on release.

const TWO_PI = Math.PI * 2;

export class WeaponWheel {
  /**
   * @param {Array} weapons - array of weapon definition objects (WPNS)
   */
  constructor(weapons) {
    this.weapons     = weapons;
    this.visible     = false;
    this.selectedIdx = 0;
    this.centerX     = 0;
    this.centerY     = 0;
    this.radius      = 80;       // distance from centre to slot centre
    this._hovered    = -1;       // index under cursor this frame
  }

  // ── Visibility ──────────────────────────────────────────────────────────────

  show(x, y) {
    this.visible = true;
    this.centerX = x;
    this.centerY = y;
    this._hovered = -1;
  }

  hide() {
    this.visible = false;
  }

  // ── Interaction ─────────────────────────────────────────────────────────────

  /**
   * Returns the index of the weapon slot closest to (mx, my).
   * Updates internal _hovered cache.
   */
  getHoveredIndex(mx, my) {
    if (!this.visible || !this.weapons.length) return this._hovered;

    const count = this.weapons.length;
    let   bestIdx  = 0;
    let   bestDist = Infinity;

    for (let i = 0; i < count; i++) {
      const angle = (TWO_PI * i / count) - Math.PI / 2;
      const sx    = this.centerX + Math.cos(angle) * this.radius;
      const sy    = this.centerY + Math.sin(angle) * this.radius;
      const dist  = Math.hypot(mx - sx, my - sy);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }

    this._hovered = bestIdx;
    return bestIdx;
  }

  /**
   * Render the weapon wheel.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} mx - cursor X (screen pixels)
   * @param {number} my - cursor Y
   */
  render(ctx, mx, my) {
    if (!this.visible) return;

    const count  = this.weapons.length;
    const slotR  = 26;       // slot circle radius
    const hIdx   = (mx !== undefined && my !== undefined) ? this.getHoveredIndex(mx, my) : this._hovered;

    ctx.save();

    // ── Background disc ────────────────────────────────────────────────────────
    ctx.globalAlpha = 0.72;
    ctx.fillStyle   = '#080010';
    ctx.strokeStyle = 'rgba(191,0,255,0.4)';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#BF00FF';
    ctx.shadowBlur  = 20;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius + slotR + 10, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;

    // ── Weapon slots ───────────────────────────────────────────────────────────
    for (let i = 0; i < count; i++) {
      const angle  = (TWO_PI * i / count) - Math.PI / 2;
      const sx     = this.centerX + Math.cos(angle) * this.radius;
      const sy     = this.centerY + Math.sin(angle) * this.radius;
      const w      = this.weapons[i];
      const col    = w.col || '#BF00FF';
      const isActive  = i === this.selectedIdx;
      const isHovered = i === hIdx;

      // Slot background
      ctx.beginPath();
      ctx.arc(sx, sy, slotR, 0, TWO_PI);
      if (isActive || isHovered) {
        ctx.fillStyle   = col + '55';
        ctx.shadowColor = col;
        ctx.shadowBlur  = isHovered ? 22 : 14;
      } else {
        ctx.fillStyle   = 'rgba(20,0,40,0.85)';
        ctx.shadowBlur  = 0;
      }
      ctx.fill();

      // Slot border
      ctx.strokeStyle = isActive ? col : (isHovered ? col + 'CC' : 'rgba(191,0,255,0.3)');
      ctx.lineWidth   = isActive ? 2.5 : 1.5;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Weapon name label (abbreviated to 4 chars to fit the slot)
      ctx.fillStyle    = isActive ? col : '#ccc';
      ctx.font         = `${isHovered ? 600 : 500} 9px 'JetBrains Mono',monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      const label = (w.n || ('W' + i)).slice(0, 5);
      ctx.fillText(label, sx, sy);

      // Slot index number (small, top-left of slot)
      ctx.fillStyle    = 'rgba(255,255,255,0.4)';
      ctx.font         = '8px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(i + 1), sx, sy - slotR + 10);
    }

    // ── Centre label: name of hovered/selected weapon ─────────────────────────
    const displayIdx = hIdx >= 0 ? hIdx : this.selectedIdx;
    const displayW   = this.weapons[displayIdx];
    if (displayW) {
      ctx.fillStyle    = displayW.col || '#fff';
      ctx.font         = "700 11px 'JetBrains Mono',monospace";
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = displayW.col || '#BF00FF';
      ctx.shadowBlur   = 10;
      ctx.fillText(displayW.n || '', this.centerX, this.centerY);
      ctx.shadowBlur   = 0;
    }

    ctx.restore();
  }
}
