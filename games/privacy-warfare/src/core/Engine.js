// ─── Engine ───────────────────────────────────────────────────────────────────
// Fixed-timestep-capped rAF loop.

export class Engine {
  constructor() {
    this._running = false;
    this._rafId   = null;
    this._lastT   = 0;
    this._updateFn = null;
  }

  start(updateFn) {
    this._updateFn = updateFn;
    this._running  = true;
    this._lastT    = performance.now();
    this._rafId    = requestAnimationFrame(ts => this._frame(ts));
  }

  stop() {
    this._running = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  }

  _frame(ts) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(t => this._frame(t));
    const dt = Math.min((ts - this._lastT) / 1000, 0.05);
    this._lastT = ts;
    this._updateFn(dt, ts);
  }
}
