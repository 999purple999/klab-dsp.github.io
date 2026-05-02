export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function angleBetween(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function vecLen(vx, vy) {
  return Math.sqrt(vx * vx + vy * vy);
}

export function normalize(vx, vy) {
  const len = vecLen(vx, vy) || 1;
  return [vx / len, vy / len];
}
