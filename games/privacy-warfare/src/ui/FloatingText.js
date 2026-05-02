// ─── FloatingText ─────────────────────────────────────────────────────────────
// Spawns floating damage / event text in world space.
// Items drift upward with slight horizontal spread and fade out.

export class FloatingTextManager {
  constructor() {
    this.items = [];
  }

  // ── Spawn ────────────────────────────────────────────────────────────────────

  /**
   * Add a new floating text item at a world position.
   * @param {number} x    - world X
   * @param {number} y    - world Y
   * @param {string} text
   * @param {string} col  - CSS colour
   * @param {number} size - base font size in logical pixels
   */
  spawn(x, y, text, col = '#fff', size = 13) {
    this.items.push({
      x,
      y,
      text,
      col,
      size,
      life:    1.1,
      maxLife: 1.1,
      vy:      -55 + Math.random() * 20,
      vx:      (Math.random() - 0.5) * 20,
    });
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const f = this.items[i];
      f.x    += f.vx * dt;
      f.y    += f.vy * dt;
      f.life -= dt;
      // Slight deceleration so movement feels floaty
      f.vx   *= 0.96;
      f.vy   *= 0.96;
      if (f.life <= 0) this.items.splice(i, 1);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  /**
   * Draw all floating text items.
   * @param {CanvasRenderingContext2D} ctx
   * @param {function(number): number} wx       - world-to-screen X
   * @param {function(number): number} wy       - world-to-screen Y
   * @param {number}                   DPR      - device pixel ratio
   * @param {function(x,y,m): boolean} onScreen - viewport cull check
   */
  render(ctx, wx, wy, DPR, onScreen) {
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    for (const f of this.items) {
      if (!onScreen(f.x, f.y, 50)) continue;

      const t = f.life / f.maxLife;           // 1 → 0 as item ages

      // Fade out by reducing alpha
      ctx.globalAlpha = Math.max(0, t);

      // Grow the font slightly as the text ages (pop effect)
      const growPx = Math.round((1 - t) * 4);
      const sz     = Math.max(10, f.size + growPx);

      ctx.shadowBlur  = 10;
      ctx.shadowColor = f.col;
      ctx.fillStyle   = f.col;
      ctx.font        = `800 ${sz * DPR}px 'JetBrains Mono',monospace`;

      ctx.fillText(f.text, wx(f.x), wy(f.y));
    }

    // Restore default state
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
  }
}
