// core/Input.js — Keyboard, mouse, touch input manager

export class Input {
  constructor() {
    this.keys = {};
    this.mx = 0; this.my = 0;
    this.mouseDown = false;
    this._handlers = [];
    this._attach();
  }

  _attach() {
    const kd = e => {
      this.keys[e.key.toLowerCase()] = true;
      // Prevent default for game keys
      if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const ku = e => { this.keys[e.key.toLowerCase()] = false; };
    const mm = e => { this.mx = e.clientX; this.my = e.clientY; };
    const md = e => { this.mouseDown = true; };
    const mu = () => { this.mouseDown = false; };
    const blur = () => { this.mouseDown = false; };
    const ts = e => {
      e.preventDefault();
      const t = e.touches[0];
      this.mx = t.clientX; this.my = t.clientY;
      this.mouseDown = true;
    };
    const tm = e => {
      e.preventDefault();
      const t = e.touches[0];
      this.mx = t.clientX; this.my = t.clientY;
    };
    const te = () => { this.mouseDown = false; };

    document.addEventListener('keydown', kd);
    document.addEventListener('keyup', ku);
    document.addEventListener('mousemove', mm);
    document.addEventListener('mousedown', md);
    document.addEventListener('mouseup', mu);
    window.addEventListener('blur', blur);
    document.addEventListener('touchstart', ts, { passive: false });
    document.addEventListener('touchmove', tm, { passive: false });
    document.addEventListener('touchend', te);

    this._handlers = [
      ['keydown', kd, document],
      ['keyup', ku, document],
      ['mousemove', mm, document],
      ['mousedown', md, document],
      ['mouseup', mu, document],
      ['blur', blur, window],
      ['touchstart', ts, document],
      ['touchmove', tm, document],
      ['touchend', te, document],
    ];
  }

  destroy() {
    for (const [type, fn, target] of this._handlers)
      target.removeEventListener(type, fn);
  }

  isDown(key) { return !!this.keys[key.toLowerCase()]; }

  /** World mouse position given camera */
  worldMX(camX) { return this.mx + camX; }
  worldMY(camY) { return this.my + camY; }
}
