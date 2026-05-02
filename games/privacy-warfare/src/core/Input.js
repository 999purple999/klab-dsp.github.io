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
