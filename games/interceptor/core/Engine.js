export class Engine {
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._running = false;
    this._rafId = null;
    this._t0 = null;
    this._onUpdate = null;
    this._onResize = null;
    this._W = 0;
    this._H = 0;
    this._dpr = 1;
    this._lW = 0;
    this._lH = 0;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._lW = window.innerWidth;
    this._lH = window.innerHeight;
    this._W = Math.floor(this._lW * this._dpr);
    this._H = Math.floor(this._lH * this._dpr);
    this._canvas.width = this._W;
    this._canvas.height = this._H;
    this._canvas.style.width = this._lW + 'px';
    this._canvas.style.height = this._lH + 'px';
    if (this._onResize) {
      this._onResize(this._lW, this._lH, this._dpr);
    }
  }

  get canvas() { return this._canvas; }
  get ctx() { return this._ctx; }
  get W() { return this._W; }
  get H() { return this._H; }
  get lW() { return this._lW; }
  get lH() { return this._lH; }
  get dpr() { return this._dpr; }

  setUpdateCallback(fn) { this._onUpdate = fn; }
  setResizeCallback(fn) { this._onResize = fn; }

  start() {
    this._running = true;
    this._t0 = null;
    this._rafId = requestAnimationFrame(this._frame.bind(this));
  }

  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _frame(ts) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(this._frame.bind(this));

    if (this._t0 === null) this._t0 = ts;
    const dt = Math.min((ts - this._t0) * 0.001, 0.05); // cap 50ms
    this._t0 = ts;

    if (this._onUpdate) {
      this._onUpdate(dt, ts);
    }
  }
}
