import { Device } from '../utils/Device.js';

export class Engine {
  constructor(canvas, game) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._game = game;
    this._running = false;
    this._t0 = null;
    this._rafId = null;
    this._lW = 0;
    this._lH = 0;

    this._onResize = this._resize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._resize();
  }

  _resize() {
    const dpr = Device.dpr;
    this._lW = window.innerWidth;
    this._lH = window.innerHeight;
    this._canvas.width = this._lW * dpr;
    this._canvas.height = this._lH * dpr;
    this._canvas.style.width = this._lW + 'px';
    this._canvas.style.height = this._lH + 'px';
    if (this._game && this._game.onResize) {
      this._game.onResize(this._lW, this._lH, dpr);
    }
  }

  get canvas() { return this._canvas; }
  get ctx() { return this._ctx; }
  get logicalWidth() { return this._lW; }
  get logicalHeight() { return this._lH; }

  start() {
    if (this._running) return;
    this._running = true;
    if (this._game.init) this._game.init(this);
    this._rafId = requestAnimationFrame(this._loop.bind(this));
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _loop(ts) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(this._loop.bind(this));

    Device.recordFrame(ts);

    if (!this._t0) this._t0 = ts;
    const dt = Math.min((ts - this._t0) * 0.001, 0.05);
    this._t0 = ts;

    this._game.update(dt, ts * 0.001);
    this._game.render(this._ctx);
  }
}
