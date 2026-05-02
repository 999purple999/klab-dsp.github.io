import { bus } from '../utils/EventBus.js';

export class Input {
  constructor(canvas) {
    this._canvas = canvas;
    this._touches = new Map();
    this._swipeStart = null;
    this._enabled = true;
    this._bind();
  }

  _bind() {
    const cv = this._canvas;

    cv.addEventListener('mousedown', (e) => {
      if (!this._enabled) return;
      e.preventDefault();
      const rect = cv.getBoundingClientRect();
      const scaleX = cv.width / (parseFloat(cv.style.width) || cv.width);
      const dpr = scaleX;
      bus.emit('tap', {
        x: e.clientX,
        y: e.clientY,
        id: 'mouse',
      });
    });

    cv.addEventListener('touchstart', (e) => {
      if (!this._enabled) return;
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this._touches.set(t.identifier, { x: t.clientX, y: t.clientY, startTime: Date.now() });
        bus.emit('tap', {
          x: t.clientX,
          y: t.clientY,
          id: t.identifier,
        });
      }
    }, { passive: false });

    cv.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const start = this._touches.get(t.identifier);
        if (start) {
          // Swipe detection
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const dt = Date.now() - start.startTime;
          if (dist > 40 && dt < 400) {
            const angle = Math.atan2(dy, dx);
            let dir;
            if (Math.abs(dx) > Math.abs(dy)) {
              dir = dx > 0 ? 'right' : 'left';
            } else {
              dir = dy > 0 ? 'down' : 'up';
            }
            bus.emit('swipe', { dx, dy, dir, x: t.clientX, y: t.clientY });
          }
          this._touches.delete(t.identifier);
        }
      }
    }, { passive: false });

    cv.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      bus.emit('keydown', { key: e.key, code: e.code });
    });
  }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }

  destroy() {
    // Listeners are on canvas, will be GCd with it
  }
}
