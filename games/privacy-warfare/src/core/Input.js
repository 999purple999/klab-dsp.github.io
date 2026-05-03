// ─── Input ────────────────────────────────────────────────────────────────────
// Centralised input state.  Game passes the KEYS object and mouse state into
// GameScene directly; this module just stores them.

export const KEYS = {};
export let mx = 0;
export let my = 0;
let _mouseDown = false;

export function isMouseDown() { return _mouseDown; }

/** Must be called once with the main canvas element. */
export function initInput(canvas, onMouseDown) {
  document.addEventListener('keydown', e => { KEYS[e.key.toLowerCase()] = true; });
  document.addEventListener('keyup',   e => { KEYS[e.key.toLowerCase()] = false; });

  canvas.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  canvas.addEventListener('mousedown', e => { _mouseDown = true; if (onMouseDown) onMouseDown(e); });
  canvas.addEventListener('mouseup',   () => { _mouseDown = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0]; mx = t.clientX; my = t.clientY;
    _mouseDown = true; if (onMouseDown) onMouseDown(e);
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault(); const t = e.touches[0]; mx = t.clientX; my = t.clientY;
  }, { passive: false });
  canvas.addEventListener('touchend', () => { _mouseDown = false; });
  window.addEventListener('blur', () => { _mouseDown = false; });
}

const _JOY_KEYS = ['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'];

/** Wire a virtual thumbstick to WASD. el = the outer ring element. */
export function initVirtualJoystick(el) {
  if (!el) return;
  const knob = el.querySelector('#vjoy-knob');
  let _id  = null;
  let _cx  = 0;
  let _cy  = 0;
  const R  = 40; // max knob travel radius

  function _clearKeys() { _JOY_KEYS.forEach(k => { KEYS[k] = false; }); }

  function _apply(tx, ty) {
    const dx = tx - _cx;
    const dy = ty - _cy;
    const dist = Math.hypot(dx, dy);
    const nx = dist > 8 ? dx / dist : 0;
    const ny = dist > 8 ? dy / dist : 0;
    const travel = Math.min(dist, R);
    if (knob) {
      knob.style.transform = `translate(calc(-50% + ${nx * travel}px), calc(-50% + ${ny * travel}px))`;
    }
    _clearKeys();
    if (nx >  0.3) KEYS['d'] = true;
    if (nx < -0.3) KEYS['a'] = true;
    if (ny >  0.3) KEYS['s'] = true;
    if (ny < -0.3) KEYS['w'] = true;
  }

  el.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    _id = t.identifier;
    const rect = el.getBoundingClientRect();
    _cx = rect.left + rect.width  / 2;
    _cy = rect.top  + rect.height / 2;
    _apply(t.clientX, t.clientY);
    el.style.opacity = '0.9';
  }, { passive: true });

  el.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === _id) { _apply(t.clientX, t.clientY); break; }
    }
  }, { passive: true });

  const _end = e => {
    for (const t of e.changedTouches) {
      if (t.identifier === _id) {
        _id = null;
        _clearKeys();
        if (knob) knob.style.transform = 'translate(-50%,-50%)';
        el.style.opacity = '0.5';
        break;
      }
    }
  };
  el.addEventListener('touchend',    _end, { passive: true });
  el.addEventListener('touchcancel', _end, { passive: true });
}
