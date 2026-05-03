// ─── MapData ──────────────────────────────────────────────────────────────────
import { d2 } from '../utils/math.js';

export const MAPS = [
  { n: 'CYBER GRID',        bg: '#040308', gc: 'rgba(191,0,255,0.22)',  ac: 'rgba(191,0,255,0.7)',  sc: '#BF00FF' },
  { n: 'DEEP SPACE',        bg: '#01021A', gc: 'rgba(0,100,255,0.20)',  ac: 'rgba(0,150,255,0.7)',  sc: '#0088FF' },
  { n: 'NEON CITY',         bg: '#060002', gc: 'rgba(255,0,80,0.20)',   ac: 'rgba(255,60,160,0.7)', sc: '#FF0066' },
  { n: 'DATA STORM',        bg: '#010C06', gc: 'rgba(0,255,100,0.18)',  ac: 'rgba(0,255,80,0.7)',   sc: '#00FF64' },
  { n: 'QUANTUM REALM',     bg: '#07010A', gc: 'rgba(160,0,255,0.20)',  ac: 'rgba(180,80,255,0.7)', sc: '#AA00FF' },
  { n: 'DARK WEB',          bg: '#080000', gc: 'rgba(255,40,0,0.18)',   ac: 'rgba(255,60,30,0.7)',  sc: '#FF2200' },
  { n: 'AI NEXUS',          bg: '#000A1A', gc: 'rgba(0,180,255,0.20)',  ac: 'rgba(0,220,255,0.7)',  sc: '#00CCFF' },
  { n: 'CRYO VAULT',        bg: '#010C12', gc: 'rgba(0,210,230,0.20)',  ac: 'rgba(80,240,255,0.7)', sc: '#00EEFF' },
  { n: 'INDUSTRIAL WASTE',  bg: '#0B0500', gc: 'rgba(255,130,0,0.18)', ac: 'rgba(255,160,40,0.7)', sc: '#FF8800' },
  { n: 'BIO-DIGITAL',       bg: '#001209', gc: 'rgba(0,220,80,0.20)',   ac: 'rgba(40,255,100,0.7)', sc: '#00FF88' },
];

export let STARS     = [];
export let BLDGS     = [];
export let WEB_LINES = [];
export let AMBIENT   = [];
export let OBSTACLES = [];
export let TRAPS     = [];

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

// ─── Trap system ──────────────────────────────────────────────────────────────
// Trap types:
//   laser  – alternating beam; kills player if active and player in path
//   efield – always-on electric floor zone; continuous damage
//   turret – auto-turret that fires projectiles at player
//   mine   – proximity mine; explodes once

export function buildTraps(wv, WW, WH) {
  TRAPS = [];
  if (wv < 2) return;

  const margin = 180;
  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

  const count = Math.min(6, Math.floor(wv / 2));

  const pool = ['laser'];
  if (wv >= 3) pool.push('efield');
  if (wv >= 5) pool.push('turret');
  if (wv >= 7) pool.push('mine');

  for (let i = 0; i < count; i++) {
    const type = pool[Math.floor(Math.random() * pool.length)];
    const x = rnd(margin, WW - margin);
    const y = rnd(margin, WH - margin);

    if (type === 'laser') {
      const dir = Math.random() < 0.5 ? 'h' : 'v';
      const len = rnd(120, 260);
      TRAPS.push({ type: 'laser', x, y, len, dir, active: false, phase: Math.random() * Math.PI * 2, period: 2.5 + Math.random() * 2 });
    } else if (type === 'efield') {
      TRAPS.push({ type: 'efield', x, y, w: rnd(80, 160), h: rnd(60, 120), dmgTimer: 0 });
    } else if (type === 'turret') {
      TRAPS.push({ type: 'turret', x, y, angle: 0, shootCd: 2.5 + Math.random(), shootTimer: 1.5 + Math.random() * 2, hp: 3, dead: false });
    } else if (type === 'mine') {
      TRAPS.push({ type: 'mine', x, y, armed: true, blinkPhase: Math.random() * Math.PI * 2 });
    }
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
