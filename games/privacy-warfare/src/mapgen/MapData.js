// ─── MapData ──────────────────────────────────────────────────────────────────
import { d2 } from '../utils/math.js';

export const MAPS = [
  { n: 'CYBER GRID',    bg: '#030306', gc: 'rgba(191,0,255,0.08)',  ac: 'rgba(191,0,255,0.6)',  sc: '#BF00FF' },
  { n: 'DEEP SPACE',    bg: '#010216', gc: 'rgba(0,80,255,0.07)',   ac: 'rgba(0,150,255,0.6)',  sc: '#0088FF' },
  { n: 'NEON CITY',     bg: '#040002', gc: 'rgba(255,0,80,0.07)',   ac: 'rgba(255,60,160,0.6)', sc: '#FF0066' },
  { n: 'DATA STORM',    bg: '#010A06', gc: 'rgba(0,255,100,0.06)',  ac: 'rgba(0,255,80,0.6)',   sc: '#00FF64' },
  { n: 'QUANTUM REALM', bg: '#060108', gc: 'rgba(150,0,255,0.07)',  ac: 'rgba(180,80,255,0.6)', sc: '#AA00FF' },
  { n: 'DARK WEB',      bg: '#060000', gc: 'rgba(255,30,0,0.06)',   ac: 'rgba(255,60,30,0.6)',  sc: '#FF2200' },
];

export let STARS    = [];
export let BLDGS    = [];
export let WEB_LINES = [];
export let AMBIENT  = [];
export let OBSTACLES = [];

export function buildMapAssets(WW, WH) {
  if (!WW) return;
  STARS = [];
  for (let i = 0; i < 260; i++)
    STARS.push({ x: Math.random() * WW, y: Math.random() * WH, r: Math.random() * 1.8 + 0.3, a: Math.random() * 0.7 + 0.2, tw: Math.random() * 2 + 1, phase: Math.random() * Math.PI * 2 });

  BLDGS = [];
  for (let i = 0; i < 30; i++)
    BLDGS.push({ x: Math.random() * WW, w: 50 + Math.random() * 110, h: 90 + Math.random() * 260 });

  WEB_LINES = [];
  for (let i = 0; i < 24; i++)
    WEB_LINES.push({ x1: Math.random() * WW, y1: Math.random() * WH, x2: Math.random() * WW, y2: Math.random() * WH });

  AMBIENT = [];
  const cols = ['#BF00FF', '#00FFFF', '#00FF41', '#FF0066', '#FF8800'];
  for (let i = 0; i < 80; i++)
    AMBIENT.push({ x: Math.random() * WW, y: Math.random() * WH, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, r: Math.random() * 1.8 + 0.4, col: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 0.3 + 0.06, phase: Math.random() * Math.PI * 2 });
}

export function buildObstacles(wv, WW, WH) {
  OBSTACLES = [];
  const n = 8 + Math.min(12, Math.floor(wv * 1.5));
  for (let i = 0; i < n; i++) {
    const w2 = 70 + Math.random() * 130, h2 = 25 + Math.random() * 55;
    OBSTACLES.push({ x: 150 + Math.random() * (WW - 300 - w2), y: 150 + Math.random() * (WH - 300 - h2), w: w2, h: h2 });
  }
}

export function obstacleCheck(x, y, r) {
  for (const o of OBSTACLES) {
    const cx = Math.max(o.x, Math.min(o.x + o.w, x));
    const cy = Math.max(o.y, Math.min(o.y + o.h, y));
    if (d2(x, y, cx, cy) < r) return o;
  }
  return null;
}

/** Resolves object position out of any overlapping obstacle. Mutates objRef.x / objRef.y. */
export function resolveObstaclePos(objRef, r) {
  for (const o of OBSTACLES) {
    const cx = Math.max(o.x, Math.min(o.x + o.w, objRef.x));
    const cy = Math.max(o.y, Math.min(o.y + o.h, objRef.y));
    const dst = d2(objRef.x, objRef.y, cx, cy);
    if (dst < r && dst > 0) {
      const nx = (objRef.x - cx) / dst, ny = (objRef.y - cy) / dst;
      objRef.x = cx + nx * (r + 1); objRef.y = cy + ny * (r + 1);
    }
  }
}
