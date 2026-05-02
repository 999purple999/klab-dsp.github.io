export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointers = new Map(); // pointerId -> {x, y, prevX, prevY}
    this.onDrag = null;   // (x, y, prevX, prevY, pointerId) => void
    this.onDown = null;   // (x, y) => void
    this.onUp = null;     // () => void
    this._maxSimultaneous = 0;
    this._bind();
  }

  get maxSimultaneous() { return this._maxSimultaneous; }

  _bind() {
    const cv = this.canvas;

    cv.addEventListener('pointerdown', e => {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, prevX: e.clientX, prevY: e.clientY });
      this._maxSimultaneous = Math.max(this._maxSimultaneous, this.pointers.size);
      if (this.onDown) this.onDown(e.clientX, e.clientY);
    }, { passive: false });

    cv.addEventListener('pointermove', e => {
      e.preventDefault();
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const prevX = p.x, prevY = p.y;
      p.prevX = prevX; p.prevY = prevY;
      p.x = e.clientX; p.y = e.clientY;
      if (this.onDrag) this.onDrag(e.clientX, e.clientY, prevX, prevY, e.pointerId);
    }, { passive: false });

    cv.addEventListener('pointerup', e => {
      e.preventDefault();
      this.pointers.delete(e.pointerId);
      if (this.onUp) this.onUp();
    }, { passive: false });

    cv.addEventListener('pointercancel', e => {
      this.pointers.delete(e.pointerId);
    });

    cv.addEventListener('contextmenu', e => e.preventDefault());
  }

  reset() {
    this._maxSimultaneous = 0;
    this.pointers.clear();
  }
}
