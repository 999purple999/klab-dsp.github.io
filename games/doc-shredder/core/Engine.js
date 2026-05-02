export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0; this.H = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._running = false;
    this._lastTs = 0;
    this._onFrame = null;
    this._onResize = null;
    this._rafId = null;
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const lw = window.innerWidth, lh = window.innerHeight;
    this.W = this.canvas.width = lw * this.dpr;
    this.H = this.canvas.height = lh * this.dpr;
    this.canvas.style.width = lw + 'px';
    this.canvas.style.height = lh + 'px';
    if (this._onResize) this._onResize(this.W, this.H, this.dpr);
  }

  start(onFrame, onResize) {
    this._onFrame = onFrame;
    this._onResize = onResize;
    this._running = true;
    this.resize();
    this._rafId = requestAnimationFrame(ts => this._loop(ts));
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _loop(ts) {
    if (!this._running) return;
    const dt = Math.min(ts - this._lastTs, 50);
    this._lastTs = ts;
    if (this._onFrame) this._onFrame(dt, ts);
    this._rafId = requestAnimationFrame(ts2 => this._loop(ts2));
  }
}
