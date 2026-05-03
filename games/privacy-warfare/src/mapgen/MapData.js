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
  { n: 'VOID MATRIX',       bg: '#000000', gc: 'rgba(200,200,255,0.14)',ac: 'rgba(220,220,255,0.6)',sc: '#CCCCFF' },
  { n: 'PHISHING NET',      bg: '#030700', gc: 'rgba(100,200,0,0.18)',  ac: 'rgba(140,255,30,0.7)', sc: '#88FF00' },
  { n: 'OVERCLOCK CORE',    bg: '#120400', gc: 'rgba(255,200,0,0.20)',  ac: 'rgba(255,230,80,0.7)', sc: '#FFCC00' },
  { n: 'SHADOW PROTOCOL',   bg: '#0A0000', gc: 'rgba(200,0,30,0.16)',   ac: 'rgba(255,30,60,0.6)',  sc: '#CC0020' },
  { n: 'NEURAL CLUSTER',    bg: '#040012', gc: 'rgba(180,60,255,0.22)', ac: 'rgba(200,100,255,0.7)',sc: '#CC66FF' },
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

  // Classic traps always available
  const pool = ['laser', 'efield', 'turret', 'mine'];
  if (wv >= 3) pool.push('vortex_pit');
  if (wv >= 4) pool.push('acid_pool');
  if (wv >= 5) pool.push('emp_burst');
  // New spec-specific traps
  if (wv >= 3) pool.push('pendulum_saw');
  if (wv >= 4) pool.push('pressure_plate');
  if (wv >= 4) pool.push('reactive_vent');
  if (wv >= 5) pool.push('corruption_cloud');
  if (wv >= 5) pool.push('lag_zone');
  if (wv >= 6) pool.push('laser_mirror');
  if (wv >= 6) pool.push('simon_field');
  if (wv >= 7) pool.push('tp_tile');

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
    } else if (type === 'vortex_pit') {
      TRAPS.push({ type: 'vortex_pit', x, y, r: 100, pullR: 180, dmgTimer: 0, angle: 0 });
    } else if (type === 'acid_pool') {
      TRAPS.push({ type: 'acid_pool', x, y, w: rnd(100, 200), h: rnd(70, 130), pulse: 0, dmgTimer: 0 });
    } else if (type === 'emp_burst') {
      TRAPS.push({ type: 'emp_burst', x, y, r: 70, armed: true, rearmTimer: 0, blinkPhase: Math.random() * Math.PI * 2 });
    } else if (type === 'pendulum_saw') {
      TRAPS.push({ type: 'pendulum_saw', x, y, len: rnd(80, 160), spd: 0.7 + rnd(0, 0.9), angle: Math.random() * Math.PI * 2 });
    } else if (type === 'pressure_plate') {
      TRAPS.push({ type: 'pressure_plate', x, y, triggered: false, _countdown: 0 });
    } else if (type === 'reactive_vent') {
      TRAPS.push({ type: 'reactive_vent', x, y, _cooldown: 0 });
    } else if (type === 'corruption_cloud') {
      TRAPS.push({ type: 'corruption_cloud', x, y, r: 70 + rnd(0, 40), _driftAngle: Math.random() * Math.PI * 2, _driftSpd: 40 + rnd(0, 30), _phase: Math.random() * Math.PI * 2, _dmgT: 0 });
    } else if (type === 'lag_zone') {
      TRAPS.push({ type: 'lag_zone', x, y, r: 75 + rnd(0, 55) });
    } else if (type === 'laser_mirror') {
      TRAPS.push({ type: 'laser_mirror', x, y, angle: Math.random() * Math.PI, len: rnd(90, 190) });
    } else if (type === 'simon_field') {
      TRAPS.push({ type: 'simon_field', x, y, _activeQ: 0, _timer: 0, _period: 1.2 + rnd(0, 0.8), _dmgTimer: 0 });
    } else if (type === 'tp_tile') {
      TRAPS.push({ type: 'tp_tile', x, y, _cd: 0 });
    }
  }
}

export let INTERACTIVES = [];

export function buildInteractives(wv, WW, WH) {
  INTERACTIVES = [];
  if (wv < 2) return;
  const margin = 200;
  const rnd2 = (lo, hi) => lo + Math.random() * (hi - lo);
  const count = Math.min(5, 1 + Math.floor(wv / 3));
  const pool2 = ['data_terminal', 'ammo_depot', 'health_station', 'data_barrel'];
  if (wv >= 3) pool2.push('jammer_node');
  if (wv >= 4) pool2.push('shield_pylon', 'crystal_spike');
  if (wv >= 5) pool2.push('decoy_beacon', 'data_cache_hack');
  if (wv >= 6) pool2.push('power_node', 'weight_platform');
  if (wv >= 7) pool2.push('firewall_barrier');
  if (wv >= 8) pool2.push('overclock_station');
  if (wv >= 9) pool2.push('data_cache');

  const cdMaxFor = t => ({ data_barrel: 12, crystal_spike: 20, data_cache_hack: 25, weight_platform: 15 }[t] || 20);
  const activateTimeFor = t => ({ crystal_spike: 1.5, weight_platform: 0.4, data_cache_hack: 1.8 }[t] || 1.0);

  for (let i = 0; i < count; i++) {
    const type = pool2[Math.floor(Math.random() * pool2.length)];
    const x = rnd2(margin, WW - margin);
    const y = rnd2(margin, WH - margin);
    INTERACTIVES.push({ type, x, y, r: 30, cooldown: 0, cdMax: cdMaxFor(type), activating: false, activateTimer: activateTimeFor(type), pulse: 0 });
  }
}

export let PORTALS = [];
export let CONVEYOR_ZONES = [];
export let MOVING_OBSTACLES = [];

export function buildGeometry(wv, WW, WH) {
  PORTALS = [];
  CONVEYOR_ZONES = [];
  MOVING_OBSTACLES = [];

  const margin = 150;
  const rnd3 = (lo, hi) => lo + Math.random() * (hi - lo);

  // Portals: pairs of teleport circles (wave 6+)
  if (wv >= 6) {
    const pairCount = Math.min(2, Math.floor((wv - 4) / 3));
    for (let i = 0; i < pairCount; i++) {
      const colA = ['#FF00FF', '#00FFFF', '#FFFF00'][i % 3];
      PORTALS.push(
        { x: rnd3(margin, WW / 2 - margin), y: rnd3(margin, WH - margin), r: 28, col: colA, pairIdx: i, angle: 0 },
        { x: rnd3(WW / 2 + margin, WW - margin), y: rnd3(margin, WH - margin), r: 28, col: colA, pairIdx: i, angle: 0 }
      );
    }
  }

  // Conveyor zones (wave 4+)
  if (wv >= 4) {
    const ccount = Math.min(3, Math.floor((wv - 2) / 2));
    for (let i = 0; i < ccount; i++) {
      const dir3 = Math.random() < 0.5 ? 1 : -1;
      CONVEYOR_ZONES.push({
        x: rnd3(margin, WW - margin - 160), y: rnd3(margin, WH - margin - 100),
        w: rnd3(120, 200), h: rnd3(80, 130), dx: dir3 * (30 + rnd3(0, 20)), dy: 0, pulse: 0
      });
    }
  }

  // Moving obstacles (wave 5+) — stored separately, obstacles array uses these as extra entries
  if (wv >= 5) {
    const mcount = Math.min(4, Math.floor((wv - 3) / 2));
    for (let i = 0; i < mcount; i++) {
      const mdir = Math.random() < 0.5 ? 'h' : 'v';
      const bx = rnd3(margin, WW - margin - 120);
      const by = rnd3(margin, WH - margin - 40);
      MOVING_OBSTACLES.push({
        x: bx, y: by, w: 80 + rnd3(0, 60), h: 22 + rnd3(0, 18),
        baseX: bx, baseY: by, dir: mdir,
        amplitude: 60 + rnd3(0, 80), period: 3 + rnd3(0, 3), phase: Math.random() * Math.PI * 2
      });
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
