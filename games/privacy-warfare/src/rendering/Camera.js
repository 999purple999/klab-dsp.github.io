// ─── Camera ───────────────────────────────────────────────────────────────────
// Shared mutable camera / world-dimension state.
// Other modules import these lets and the helper functions directly.

export let camX = 0;
export let camY = 0;
export let lW = 0;
export let lH = 0;
export let WW = 0;
export let WH = 0;
export let DPR = 1;

/** Set all camera/world values at once (called from Game.resize). */
export function setCameraState(state) {
  camX = state.camX !== undefined ? state.camX : camX;
  camY = state.camY !== undefined ? state.camY : camY;
  lW   = state.lW   !== undefined ? state.lW   : lW;
  lH   = state.lH   !== undefined ? state.lH   : lH;
  WW   = state.WW   !== undefined ? state.WW   : WW;
  WH   = state.WH   !== undefined ? state.WH   : WH;
  DPR  = state.DPR  !== undefined ? state.DPR  : DPR;
}

/** Convert world-X to canvas pixel. */
export function wx(x) { return (x - camX) * DPR; }

/** Convert world-Y to canvas pixel. */
export function wy(y) { return (y - camY) * DPR; }

/** True when world point is within viewport + margin m. */
export function onScreen(x, y, m) {
  return x > camX - m && x < camX + lW + m && y > camY - m && y < camY + lH + m;
}

/** Euclidean distance (also exported from math.js for non-camera modules). */
export function d2(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
