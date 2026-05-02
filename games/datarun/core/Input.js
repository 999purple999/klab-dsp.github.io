import { EventBus } from '../utils/EventBus.js';

export class Input {
  constructor(canvas) {
    this._canvas = canvas;
    this.lastTapX = 0;
    this.lastTapY = 0;
    this._bound = false;
    this._bind();
  }

  _bind() {
    if (this._bound) return;
    this._bound = true;

    const onTap = (x, y) => {
      this.lastTapX = x;
      this.lastTapY = y;
      EventBus.emit('tap', { x, y });
    };

    this._canvas.addEventListener('mousedown', e => {
      e.preventDefault();
      onTap(e.clientX, e.clientY);
    });

    this._canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const t = e.touches[0];
        onTap(t.clientX, t.clientY);
      }
    }, { passive: false });

    document.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        onTap(cx, cy);
      }
      if (e.code === 'Escape') {
        EventBus.emit('escape', {});
      }
    });
  }
}
