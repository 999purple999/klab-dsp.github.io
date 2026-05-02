import { EventBus } from '../utils/EventBus.js';
import { clamp } from '../utils/math.js';

const LONG_PRESS_MS = 500;
const DOUBLE_TAP_MS = 340;
const SLINGSHOT_WINDOW_MS = 200;

export class Input {
  constructor(canvas, getBoxes) {
    this.canvas = canvas;
    this.getBoxes = getBoxes;

    this.dragBox = null;
    this.dragOx = 0; this.dragOy = 0;
    this.dragVx = 0; this.dragVy = 0;
    this.dragPx = 0; this.dragPy = 0;

    this._pressTimer = null;
    this._lastTap = 0;
    this._longPressBox = null;
    this._pinchDist = 0;
    this.scale = 1;

    // Slingshot: track pointer history
    this._slingshotHistory = [];

    this._bind();
  }

  _bind() {
    const cv = this.canvas;
    cv.addEventListener('mousedown', e => this._onDown(e.clientX, e.clientY, null, e));
    cv.addEventListener('mousemove', e => this._onMove(e.clientX, e.clientY));
    cv.addEventListener('mouseup', e => this._onUp(e.clientX, e.clientY));
    cv.addEventListener('dblclick', e => this._onDoubleTap(e.clientX, e.clientY));
    cv.addEventListener('contextmenu', e => e.preventDefault());

    cv.addEventListener('touchstart', e => {
      e.preventDefault();
      if (e.touches.length === 2) {
        this._pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        return;
      }
      const t = e.touches[0];
      this._onDown(t.clientX, t.clientY, e);
    }, { passive: false });

    cv.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (this._pinchDist > 0) {
          const delta = d / this._pinchDist;
          this.scale = clamp(this.scale * delta, 0.5, 3);
          EventBus.emit('input:pinch', this.scale);
        }
        this._pinchDist = d;
        // Two-finger drag slingshot
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        this._trackSlingshot(mx, my);
        return;
      }
      const t = e.touches[0];
      this._onMove(t.clientX, t.clientY);
    }, { passive: false });

    cv.addEventListener('touchend', e => {
      e.preventDefault();
      if (e.changedTouches.length > 0 && this._slingshotHistory.length > 1) {
        this._releaseSlingshot(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      clearTimeout(this._pressTimer);
      this._pressTimer = null;

      const now = Date.now();
      if (now - this._lastTap < DOUBLE_TAP_MS) {
        const t = e.changedTouches[0];
        this._onDoubleTap(t.clientX, t.clientY);
      }
      this._lastTap = now;
      this._onUp(e.changedTouches[0]?.clientX ?? 0, e.changedTouches[0]?.clientY ?? 0);
      this._pinchDist = 0;
      this._slingshotHistory = [];
    }, { passive: false });
  }

  _hitTest(lx, ly) {
    const boxes = this.getBoxes();
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (boxes[i].contains(lx, ly)) return boxes[i];
    }
    return null;
  }

  _onDown(lx, ly, touchEvent, mouseEvent) {
    const box = this._hitTest(lx, ly);
    this._longPressBox = box;

    // Start long press timer
    clearTimeout(this._pressTimer);
    this._pressTimer = setTimeout(() => {
      if (box) {
        EventBus.emit('input:contextMenu', { box, x: lx, y: ly });
      } else {
        EventBus.emit('input:longPress', { x: lx, y: ly });
      }
      this._pressTimer = null;
    }, LONG_PRESS_MS);

    if (!box) return;
    this.dragBox = box;
    box.dragging = true;
    this.dragOx = lx - box.x;
    this.dragOy = ly - box.y;
    this.dragPx = lx; this.dragPy = ly;
    this.dragVx = 0; this.dragVy = 0;
    this._slingshotHistory = [{ x: lx, y: ly, t: Date.now() }];
  }

  _onMove(lx, ly) {
    if (!this.dragBox) return;
    clearTimeout(this._pressTimer);
    this._pressTimer = null;

    this.dragVx = lx - this.dragPx;
    this.dragVy = ly - this.dragPy;
    this.dragPx = lx; this.dragPy = ly;
    this.dragBox.x = lx - this.dragOx;
    this.dragBox.y = ly - this.dragOy;
    this.dragBox.av *= 0.8;

    this._trackSlingshot(lx, ly);
  }

  _trackSlingshot(x, y) {
    const now = Date.now();
    this._slingshotHistory.push({ x, y, t: now });
    // Keep only last SLINGSHOT_WINDOW_MS
    while (this._slingshotHistory.length > 1 &&
           now - this._slingshotHistory[0].t > SLINGSHOT_WINDOW_MS) {
      this._slingshotHistory.shift();
    }
  }

  _releaseSlingshot(lx, ly) {
    const hist = this._slingshotHistory;
    if (hist.length < 2) return;
    const oldest = hist[0];
    const newest = hist[hist.length - 1];
    const dt = (newest.t - oldest.t) / 1000;
    if (dt < 0.001) return;
    const vx = (newest.x - oldest.x) / dt * 0.016;
    const vy = (newest.y - oldest.y) / dt * 0.016;
    EventBus.emit('input:slingshot', { vx, vy });
  }

  _onUp(lx, ly) {
    clearTimeout(this._pressTimer);
    this._pressTimer = null;

    if (!this.dragBox) return;
    this.dragBox.vx = this.dragVx * 1.4;
    this.dragBox.vy = this.dragVy * 1.4;
    this.dragBox.av = (Math.random() - 0.5) * 0.14;
    this.dragBox.dragging = false;

    // Check slingshot achievement
    const hist = this._slingshotHistory;
    if (hist.length >= 2) {
      const dx = Math.abs(hist[hist.length - 1].x - hist[0].x);
      if (dx > window.innerWidth * 0.9) {
        EventBus.emit('input:slingshotAchievement');
      }
    }

    this.dragBox = null;
    this._slingshotHistory = [];
  }

  _onDoubleTap(lx, ly) {
    const box = this._hitTest(lx, ly);
    EventBus.emit('input:doubleTap', { box, x: lx, y: ly });
  }
}
