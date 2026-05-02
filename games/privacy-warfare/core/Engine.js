// core/Engine.js — rAF loop with dt cap and resize

export class Engine {
  constructor() {
    this._running = false;
    this._lastT = 0;
    this._onFrame = null;
    this._onResize = null;
    this._rafId = null;
  }

  onFrame(fn) { this._onFrame = fn; }
  onResize(fn) { this._onResize = fn; }

  start() {
    this._running = true;
    this._lastT = performance.now();
    this._rafId = requestAnimationFrame(ts => this._loop(ts));

    window.addEventListener('resize', () => {
      if (this._onResize) this._onResize();
    });
  }

  stop() {
    this._running = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  }

  _loop(ts) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(ts2 => this._loop(ts2));
    const dt = Math.min((ts - this._lastT) / 1000, 0.05); // cap at 50ms
    this._lastT = ts;
    if (this._onFrame) this._onFrame(dt, ts);
  }
}
