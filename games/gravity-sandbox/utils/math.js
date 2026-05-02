export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
export function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
export function randInt(lo, hi) { return Math.floor(rand(lo, hi + 1)); }
export function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function v2add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
export function v2sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
export function v2scale(v, s) { return { x: v.x * s, y: v.y * s }; }
export function v2len(v) { return Math.hypot(v.x, v.y); }
export function v2norm(v) { const l = v2len(v); return l < 1e-9 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l }; }
export function v2dot(a, b) { return a.x * b.x + a.y * b.y; }
