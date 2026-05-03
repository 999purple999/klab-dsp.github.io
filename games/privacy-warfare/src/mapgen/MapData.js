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
  for (let i = 0; i < 500; i++)
    STARS.push({ x: Math.random() * WW, y: Math.random() * WH, r: Math.random() * 2.2 + 0.3, a: Math.random() * 0.8 + 0.2, tw: Math.random() * 2 + 1, phase: Math.random() * Math.PI * 2 });

  BLDGS = [];
  for (let i = 0; i < 100; i++)
    BLDGS.push({ x: Math.random() * WW, w: 40 + Math.random() * 130, h: 80 + Math.random() * 300 });

  WEB_LINES = [];
  for (let i = 0; i < 70; i++)
    WEB_LINES.push({ x1: Math.random() * WW, y1: Math.random() * WH, x2: Math.random() * WW, y2: Math.random() * WH });

  AMBIENT = [];
  const cols = ['#BF00FF', '#00FFFF', '#00FF41', '#FF0066', '#FF8800'];
  for (let i = 0; i < 200; i++)
    AMBIENT.push({ x: Math.random() * WW, y: Math.random() * WH, vx: (Math.random() - 0.5) * 22, vy: (Math.random() - 0.5) * 22, r: Math.random() * 2.2 + 0.4, col: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 0.4 + 0.08, phase: Math.random() * Math.PI * 2 });
}

// ── biome shape helper: returns [w, h] for the given biome ────────────────────
function _biomeShape(mapIdx, rnd) {
  const r = Math.random();
  switch (mapIdx) {
    case 0:  // CYBER GRID – square pillars + long walls
      if (r < 0.38) return [30 + rnd(0, 30), 30 + rnd(0, 30)];
      if (r < 0.68) return [140 + rnd(0, 130), 15 + rnd(0, 14)];
      return [15 + rnd(0, 14), 120 + rnd(0, 100)];
    case 1:  // DEEP SPACE – asteroids
      { const s = 25 + rnd(0, 85); return [s * (0.7 + rnd(0, 0.7)), s * (0.5 + rnd(0, 0.65))]; }
    case 2:  // NEON CITY – building slabs
      if (r < 0.55) return [50 + rnd(0, 70), 90 + rnd(0, 140)];
      return [130 + rnd(0, 90), 20 + rnd(0, 20)];
    case 3:  // DATA STORM – long thin barriers
      if (r < 0.55) return [200 + rnd(0, 160), 12 + rnd(0, 10)];
      return [12 + rnd(0, 10), 180 + rnd(0, 130)];
    case 4:  // QUANTUM REALM – crystals
      if (r < 0.45) { const s = 40 + rnd(0, 55); return [s, s * 0.55]; }
      return [18 + rnd(0, 20), 100 + rnd(0, 90)];
    case 5:  // DARK WEB – tiny nodes + cables
      if (r < 0.35) return [16 + rnd(0, 18), 16 + rnd(0, 18)];
      if (r < 0.65) return [150 + rnd(0, 110), 13 + rnd(0, 9)];
      return [13 + rnd(0, 9), 120 + rnd(0, 90)];
    case 6:  // AI NEXUS – circuit blocks
      if (r < 0.52) return [70 + rnd(0, 90), 20 + rnd(0, 24)];
      return [20 + rnd(0, 24), 65 + rnd(0, 65)];
    case 7:  // CRYO VAULT – ice columns + platforms
      if (r < 0.48) return [16 + rnd(0, 14), 100 + rnd(0, 110)];
      return [100 + rnd(0, 110), 16 + rnd(0, 14)];
    case 8:  // INDUSTRIAL WASTE – machinery blocks
      return [75 + rnd(0, 120), 36 + rnd(0, 65)];
    case 9:  // BIO-DIGITAL – organic cells
      { const s = 30 + rnd(0, 65); return [s, s * (0.55 + rnd(0, 0.75))]; }
    case 10: // VOID MATRIX – obelisks + slabs
      if (r < 0.55) return [22 + rnd(0, 28), 160 + rnd(0, 130)];
      return [80 + rnd(0, 90), 26 + rnd(0, 30)];
    case 11: // PHISHING NET – anchors + cables
      if (r < 0.35) return [16 + rnd(0, 18), 16 + rnd(0, 18)];
      return [180 + rnd(0, 130), 11 + rnd(0, 9)];
    case 12: // OVERCLOCK CORE – heat shield plates
      if (r < 0.50) return [110 + rnd(0, 120), 18 + rnd(0, 20)];
      return [18 + rnd(0, 20), 110 + rnd(0, 100)];
    case 13: // SHADOW PROTOCOL – maze walls
      if (r < 0.60) return [200 + rnd(0, 160), 13 + rnd(0, 9)];
      return [13 + rnd(0, 9), 160 + rnd(0, 110)];
    case 14: // NEURAL CLUSTER – soma + dendrites
      if (r < 0.35) { const s = 26 + rnd(0, 34); return [s, s]; }
      return [130 + rnd(0, 100), 10 + rnd(0, 9)];
    default:
      return [70 + rnd(0, 110), 24 + rnd(0, 55)];
  }
}

// ── biome cluster helper: adds themed obstacle groups ─────────────────────────
function _biomeClusters(mapIdx, wv, WW, WH, rnd, push, mg) {
  const cCount = 4 + Math.min(6, Math.floor(wv / 2));
  for (let c = 0; c < cCount; c++) {
    const cx = rnd(mg + 200, WW - mg - 200);
    const cy = rnd(mg + 200, WH - mg - 200);
    switch (mapIdx) {
      case 0: { // CYBER GRID – server farm pillar grid
        const sp = 65 + rnd(0, 35);
        for (let gi = -1; gi <= 1; gi++)
          for (let gj = -1; gj <= 1; gj++)
            push(cx + gi * sp - 16, cy + gj * sp - 16, 32, 32);
        break;
      }
      case 1: { // DEEP SPACE – asteroid cluster
        for (let i = 0; i < 5 + Math.floor(rnd(0, 5)); i++) {
          const a = rnd(0, Math.PI * 2), d = rnd(20, 130);
          const s = 18 + rnd(0, 65);
          push(cx + Math.cos(a) * d - s/2, cy + Math.sin(a) * d - s/2, s * (0.7 + rnd(0,0.5)), s * (0.5 + rnd(0,0.5)));
        }
        break;
      }
      case 2: { // NEON CITY – L-shaped or U-shaped building outline
        const bw = 130 + rnd(0, 80), bh = 22;
        if (Math.random() < 0.5) {
          push(cx, cy, bw, bh);
          push(cx, cy, bh, 100 + rnd(0, 60));
        } else {
          push(cx, cy, bw, bh);
          push(cx, cy, bh, 90 + rnd(0, 50));
          push(cx + bw - bh, cy, bh, 90 + rnd(0, 50));
        }
        break;
      }
      case 3: { // DATA STORM – parallel stream barriers
        const len = 220 + rnd(0, 110);
        const gap = 48 + rnd(0, 32);
        push(cx - len/2, cy - gap/2 - 6, len, 12);
        push(cx - len/2, cy + gap/2 - 6, len, 12);
        break;
      }
      case 4: { // QUANTUM REALM – crystal ring
        const n2 = 5 + Math.floor(rnd(0, 4));
        const rad = 80 + rnd(0, 65);
        for (let i = 0; i < n2; i++) {
          const a = (i / n2) * Math.PI * 2;
          const s = 16 + rnd(0, 26);
          push(cx + Math.cos(a) * rad - s/2, cy + Math.sin(a) * rad - s/2 * 0.55, s, s * 0.55);
        }
        break;
      }
      case 5: { // DARK WEB – spider web radial spokes from center
        push(cx - 11, cy - 11, 22, 22);
        const spokes = 4 + Math.floor(rnd(0, 4));
        for (let i = 0; i < spokes; i++) {
          const a = (i / spokes) * Math.PI * 2;
          const len2 = 80 + rnd(0, 70);
          for (let seg = 1; seg <= 4; seg++) {
            const sd = len2 * (seg / 4);
            push(cx + Math.cos(a) * sd - 7, cy + Math.sin(a) * sd - 7, 14, 14);
          }
        }
        break;
      }
      case 6: { // AI NEXUS – circuit board rows
        const rows = 2 + Math.floor(rnd(0, 3));
        for (let ri = 0; ri < rows; ri++) {
          const ry = cy + ri * (33 + rnd(0, 22)) - rows * 18;
          let bx = cx - 100 + rnd(0, 30);
          for (let bi = 0; bi < 2 + Math.floor(rnd(0, 3)); bi++) {
            const bw = 38 + rnd(0, 45);
            push(bx, ry, bw, 17);
            bx += bw + 18 + rnd(0, 22);
          }
        }
        break;
      }
      case 7: { // CRYO VAULT – ice stalactite row
        const n3 = 4 + Math.floor(rnd(0, 5));
        for (let i = 0; i < n3; i++) {
          const ox = cx + (i - n3/2) * (26 + rnd(0, 14));
          push(ox, cy, 13 + rnd(0, 11), 80 + rnd(0, 90));
        }
        break;
      }
      case 8: { // INDUSTRIAL WASTE – machinery compound walls
        const bw = 160 + rnd(0, 90), bh = 100 + rnd(0, 70);
        const wall = 18;
        push(cx - bw/2, cy - bh/2, bw, wall);
        push(cx - bw/2, cy + bh/2 - wall, bw, wall);
        push(cx - bw/2, cy - bh/2, wall, bh);
        push(cx + bw/2 - wall, cy - bh/2, wall, bh);
        break;
      }
      case 9: { // BIO-DIGITAL – organic cell cluster
        for (let i = 0; i < 5 + Math.floor(rnd(0, 5)); i++) {
          const a = rnd(0, Math.PI * 2), d = rnd(0, 90);
          const s = 22 + rnd(0, 50);
          push(cx + Math.cos(a) * d - s/2, cy + Math.sin(a) * d - s/2, s, s * (0.55 + rnd(0, 0.65)));
        }
        break;
      }
      case 10: { // VOID MATRIX – void obelisk row
        const n4 = 3 + Math.floor(rnd(0, 4));
        const sp2 = 50 + rnd(0, 35);
        for (let i = 0; i < n4; i++)
          push(cx + (i - n4/2) * sp2 - 11, cy - 90 - rnd(0, 70), 22, 180 + rnd(0, 130));
        break;
      }
      case 11: { // PHISHING NET – hook cross
        const len3 = 180 + rnd(0, 110);
        push(cx - len3/2, cy - 7, len3, 14);
        push(cx - 7, cy - len3/2, 14, len3);
        push(cx + len3/2 - 22, cy - 22, 22, 22);
        push(cx - len3/2, cy - 22, 22, 22);
        break;
      }
      case 12: { // OVERCLOCK CORE – heat exchanger plates
        const plates = 3 + Math.floor(rnd(0, 3));
        for (let i = 0; i < plates; i++) {
          const pw = 140 + rnd(0, 90);
          push(cx - pw/2, cy + (i - plates/2) * (28 + rnd(0, 16)), pw, 14);
        }
        break;
      }
      case 13: { // SHADOW PROTOCOL – maze T-junction
        const mw = 190 + rnd(0, 90);
        push(cx - mw/2, cy - 7, mw, 14);
        push(cx - 7, cy - 120 - rnd(0,60), 14, 120 + rnd(0,60));
        push(cx - 7, cy, 14, 100 + rnd(0,60));
        push(cx - mw/2, cy - 70 - rnd(0,40), 14, 70 + rnd(0,40));
        push(cx + mw/2 - 14, cy + rnd(0,30), 14, 60 + rnd(0,40));
        break;
      }
      case 14: { // NEURAL CLUSTER – soma + dendrite highways
        push(cx - 14, cy - 14, 28, 28);
        const dn = 3 + Math.floor(rnd(0, 4));
        for (let i = 0; i < dn; i++) {
          const a = (i / dn) * Math.PI * 2;
          const len4 = 80 + rnd(0, 90);
          const horiz = Math.abs(Math.cos(a)) > 0.7;
          push(
            cx + Math.cos(a) * (len4/2 + 14) - (horiz ? len4/2 : 6),
            cy + Math.sin(a) * (len4/2 + 14) - (horiz ? 6 : len4/2),
            horiz ? len4 : 12, horiz ? 12 : len4
          );
        }
        break;
      }
    }
  }
}

export function buildObstacles(wv, WW, WH, mapIdx = 0) {
  OBSTACLES = [];
  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
  const mg = 110;
  const push = (x, y, w, h) => {
    x = Math.max(mg, Math.min(WW - mg - w, x));
    y = Math.max(mg, Math.min(WH - mg - h, y));
    if (w > 5 && h > 5) OBSTACLES.push({ x, y, w, h });
  };

  // ── Grid-distributed base: 7×5 cells → 70-175 obstacles ──────────────────
  const COLS = 7, ROWS = 5;
  const cW = (WW - mg * 2) / COLS, cH = (WH - mg * 2) / ROWS;
  const perCell = 2 + Math.min(3, Math.floor(wv / 2));

  for (let ci = 0; ci < COLS; ci++) {
    for (let ri = 0; ri < ROWS; ri++) {
      if (Math.random() < 0.10) continue;
      const bx = mg + ci * cW, by = mg + ri * cH;
      for (let k = 0; k < perCell; k++) {
        const px = bx + rnd(0.08, 0.92) * cW;
        const py = by + rnd(0.08, 0.92) * cH;
        const [w, h] = _biomeShape(mapIdx, rnd);
        push(px - w / 2, py - h / 2, w, h);
      }
    }
  }

  // ── Biome feature clusters on top of grid base ────────────────────────────
  _biomeClusters(mapIdx, wv, WW, WH, rnd, push, mg);
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

// ─── Secrets system ───────────────────────────────────────────────────────────
// One relic + hidden caches per wave. Relics require a 1.8s scan; caches instant.
// Each biome has a unique relic with a unique effect that fires via GameScene.

export let SECRETS = [];

const RELIC_DATA = [
  { name: 'ADMIN KEY',        col: '#BF00FF', effect: 'xray',          lore: 'System access: GRANTED' },
  { name: 'ALIEN SIGNAL',     col: '#0088FF', effect: 'freeze_all',    lore: 'Transmission origin: UNKNOWN' },
  { name: 'BLACKMARKET CHIP', col: '#FF0066', effect: 'credits',       lore: 'Value: 150 CR. Source: illegal' },
  { name: 'STORM SEED',       col: '#00FF64', effect: 'speed_bullets', lore: 'Accelerant. Handle with care.' },
  { name: 'QUANTUM CRYSTAL',  col: '#AA00FF', effect: 'invincible',    lore: 'Superposition: immune to harm' },
  { name: '0DAY EXPLOIT',     col: '#FF2200', effect: 'kill_all',      lore: 'Unpatched. Devastating. Yours.' },
  { name: 'ROGUE SUBROUTINE', col: '#00CCFF', effect: 'turret_ally',   lore: 'Rogue AI fragment. Still angry.' },
  { name: 'FROZEN HEART',     col: '#00EEFF', effect: 'freeze_bullets',lore: 'Absolute zero. All motion stops.' },
  { name: 'POWER CELL',       col: '#FF8800', effect: 'inf_ammo',      lore: 'Overcharged. Infinite output.' },
  { name: 'SYMBIOTE CORE',    col: '#00FF88', effect: 'extra_life',    lore: 'It will protect you. Once.' },
  { name: 'NULL FRAGMENT',    col: '#CCCCFF', effect: 'health_cache',  lore: 'Compressed void. Contains life.' },
  { name: 'HONEYPOT DATA',    col: '#88FF00', effect: 'lure_enemies',  lore: 'Irresistible to threats. Use wisely.' },
  { name: 'HEAT SINK',        col: '#FFCC00', effect: 'damage_reduce', lore: 'Thermal shielding. 10 seconds.' },
  { name: 'GHOST KEY',        col: '#CC0020', effect: 'invisible',     lore: 'They cannot see you. Yet.' },
  { name: 'MEMORY CORE',      col: '#CC66FF', effect: 'homing',        lore: 'Every shot remembers the target.' },
];

export function buildSecrets(wv, WW, WH, mapIdx) {
  SECRETS = [];
  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
  const mg = 220;
  const rd = RELIC_DATA[mapIdx % RELIC_DATA.length];

  // Main relic: biome-specific, requires 1.8s scan
  SECRETS.push({
    type: 'relic', x: rnd(mg, WW - mg), y: rnd(mg, WH - mg),
    r: 22, col: rd.col, name: rd.name, effect: rd.effect, lore: rd.lore,
    found: false, scanTimer: 0, scanMax: 1.8, pulse: Math.random() * Math.PI * 2, mapIdx,
  });

  // Hidden caches (wave 3+): instant pickup, +HP or +ammo
  if (wv >= 3) {
    const cc = 1 + (wv >= 6 ? 1 : 0) + (wv >= 9 ? 1 : 0);
    const cacheTypes = ['hp_cache', 'ammo_cache'];
    for (let i = 0; i < cc; i++) {
      SECRETS.push({
        type: cacheTypes[i % 2], x: rnd(mg, WW - mg), y: rnd(mg, WH - mg),
        r: 14, col: i % 2 === 0 ? '#FF4466' : '#FFAA00',
        found: false, pulse: Math.random() * Math.PI * 2,
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
