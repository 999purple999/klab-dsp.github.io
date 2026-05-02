// ─── Math utilities ───────────────────────────────────────────────────────────

/** Euclidean distance between two points. */
export function d2(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/** Clamp value between min and max. */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
