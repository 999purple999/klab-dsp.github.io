// utils/math.js — Math utilities

export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function normalise(dx, dy) {
  const d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
}

export function angleToXY(a) {
  return [Math.cos(a), Math.sin(a)];
}

export function wrap(v, max) {
  v = v % max;
  return v < 0 ? v + max : v;
}
