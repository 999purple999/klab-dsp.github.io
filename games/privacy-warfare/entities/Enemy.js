// entities/Enemy.js — All enemy types (10 normal + 3 boss types)

import { dist, randRange, clamp } from '../utils/math.js';

// ── Normal enemy definitions ──────────────────────────────────────────────
export const EDEFS = {
  normal:   { col: '#FF4444', sz: 12, hp: 1, spd: 65,  pts: 10 },
  elite:    { col: '#FF8800', sz: 15, hp: 2, spd: 82,  pts: 25 },
  phish:    { col: '#FF00FF', sz: 11, hp: 1, spd: 105, pts: 20 },
  shooter:  { col: '#FF6060', sz: 13, hp: 2, spd: 55,  pts: 35 },
  doppel:   { col: '#AAAAFF', sz: 13, hp: 2, spd: 78,  pts: 30 },
  cloaker:  { col: '#FF44FF', sz: 10, hp: 1, spd: 92,  pts: 40 },
  berser:   { col: '#FF2200', sz: 13, hp: 2, spd: 72,  pts: 35 },
  tank:     { col: '#996633', sz: 20, hp: 5, spd: 32,  pts: 60 },
  teleport: { col: '#44FFFF', sz: 11, hp: 1, spd: 62,  pts: 50 },
  necro:    { col: '#CC00FF', sz: 15, hp: 3, spd: 52,  pts: 100 },
};

// ── Boss definitions ──────────────────────────────────────────────────────
export const BOSS_TYPES = ['CLONE_MASTER', 'RADIAL_SHOOTER', 'TELEPORTER'];

export const BOSS_DEFS = {
  CLONE_MASTER: {
    col: '#f59e0b', sz: 44, baseHp: 20, basePts: 800,
    spd: 38, cloneInterval: 5,
    desc: 'Spawns clones'
  },
  RADIAL_SHOOTER: {
    col: '#FF4400', sz: 40, baseHp: 15, basePts: 700,
    spd: 90, radialInterval: 3, radialCount: 12,
    desc: 'Radial burst fire'
  },
  TELEPORTER: {
    col: '#44FFFF', sz: 38, baseHp: 12, basePts: 600,
    spd: 68, teleInterval: 4,
    desc: 'Teleports near player'
  },
};

// ── Enemy factory ─────────────────────────────────────────────────────────
export function makeEnemy(x, y, type, waveNum, hpOverride) {
  const d = EDEFS[type];
  const hb = Math.floor(waveNum / 3);
  const hp = hpOverride !== undefined ? hpOverride : d.hp + hb;
  return {
    x, y, t: type,
    col: d.col,
    sz: d.sz,
    hp,
    maxHp: hp,
    spd: d.spd * (1 + waveNum * 0.07),
    pts: d.pts,
    vx: 0, vy: 0,
    frozen: 0,
    virus: 0,
    al: 1,
    hitFlash: 0,
    spawnAnim: 0.5,
    cloakTimer: 2,
    cloaking: false,
    shootTimer: 2 + Math.random() * 2,
    teleTimer: 4 + Math.random() * 3,
    necroTimer: 8,
    berserk: false,
    isBoss: false,
    bossType: null,
    bossTimer: 0,        // generic timer for boss specials
    cloneTimer: 0,
    phase: 1,
    angle: 0,
    shootTimer2: 0,
    empDisableTimer: 0,  // TELEPORTER special
  };
}

// ── Boss factory ──────────────────────────────────────────────────────────
export function makeBoss(bossType, waveNum, ww, wh) {
  const def = BOSS_DEFS[bossType];
  if (!def) {
    // Fallback legacy boss
    return {
      x: ww / 2, y: wh * 0.22,
      hp: 30 + waveNum * 9, maxHp: 30 + waveNum * 9,
      spd: 52 + waveNum * 3, sz: 44, col: '#FF0000',
      phase: 1, shootTimer: 1.4, vx: 100, vy: 70,
      frozen: 0, virus: 0, pts: 500 + waveNum * 100,
      angle: 0, hitFlash: 0, isBoss: true, bossType: 'LEGACY',
      cloneTimer: 0, shootTimer2: 0, empDisableTimer: 0,
    };
  }
  return {
    x: ww / 2, y: wh * 0.22,
    hp: def.baseHp + waveNum * 2,
    maxHp: def.baseHp + waveNum * 2,
    spd: def.spd + waveNum * 2,
    sz: def.sz,
    col: def.col,
    phase: 1,
    shootTimer: 1.4,
    frozen: 0, virus: 0,
    pts: def.basePts + waveNum * 100,
    angle: 0, hitFlash: 0,
    isBoss: true, bossType,
    cloneTimer: def.cloneInterval || 0,
    shootTimer2: def.radialInterval || def.teleInterval || 0,
    empDisableTimer: 0,
    vx: 0, vy: 0,
  };
}

// ── Pick enemy type by wave ───────────────────────────────────────────────
export function pickType(waveNum) {
  const pool = [];
  function add(k, minW, w) { if (waveNum >= minW) pool.push({ k, w }); }
  add('normal',   1, 60); add('elite',   2, 28); add('phish',    3, 18);
  add('shooter',  4, 14); add('doppel',  4, 12); add('cloaker',  5, 10);
  add('berser',   5, 10); add('tank',    6, 6);  add('teleport', 7, 5);
  add('necro',    8, 3);
  let tot = pool.reduce((s, p) => s + p.w, 0);
  let r = Math.random() * tot;
  for (const p of pool) { r -= p.w; if (r <= 0) return p.k; }
  return 'normal';
}

// ── Spawn helpers ─────────────────────────────────────────────────────────
export function spawnRandom(enemies, waveNum, ww, wh) {
  const m = 80;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0)      { x = Math.random() * ww; y = m; }
  else if (side === 1) { x = ww - m; y = Math.random() * wh; }
  else if (side === 2) { x = Math.random() * ww; y = wh - m; }
  else                 { x = m; y = Math.random() * wh; }
  enemies.push(makeEnemy(x, y, pickType(waveNum), waveNum));
}

export function spawnFormation(enemies, ftype, cx, cy, count, type, waveNum, ww, wh) {
  const r = 85;
  const pts = [];
  if (ftype === 'ring') {
    for (let i = 0; i < count; i++)
      pts.push([cx + Math.cos(i / count * Math.PI * 2) * r, cy + Math.sin(i / count * Math.PI * 2) * r]);
  } else if (ftype === 'v') {
    for (let i = 0; i < count; i++) {
      const s = (i % 2 ? 1 : -1);
      pts.push([cx + s * Math.ceil(i / 2) * 40, cy + Math.ceil(i / 2) * 42]);
    }
  } else if (ftype === 'line') {
    for (let i = 0; i < count; i++)
      pts.push([cx + (i - (count - 1) / 2) * 46, cy]);
  } else {
    const dp = [[0, -r], [r, 0], [0, r], [-r, 0]];
    for (let i = 0; i < count; i++) pts.push([cx + dp[i % 4][0], cy + dp[i % 4][1]]);
  }
  pts.forEach(([ex, ey]) => {
    enemies.push(makeEnemy(
      Math.max(60, Math.min(ww - 60, ex)),
      Math.max(60, Math.min(wh - 60, ey)),
      type, waveNum
    ));
  });
}

// ── AI update ─────────────────────────────────────────────────────────────
/**
 * Update all enemies. Returns array of { type, x, y } events:
 *   { type:'proj', x, y, vx, vy, r, col, life }
 *   { type:'burst', x, y, col, n, spd }
 *   { type:'kill', enemy }
 *   { type:'hurtPlayer' }
 *   { type:'cloneSpawn', x, y, baseType, waveNum }
 *   { type:'empDisable', duration }
 */
export function updateEnemies(enemies, deadEnemies, boss, dt, px, py, ww, wh,
  invincible, ghostActive, empShieldActive, obstacles) {
  const events = [];

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.hp <= 0) { events.push({ type: 'kill', enemy: e }); continue; }
    if (e.spawnAnim > 0) e.spawnAnim -= dt * 3;
    if (e.frozen > 0) {
      e.frozen -= dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      continue;
    }
    if (e.hitFlash > 0) e.hitFlash -= dt;

    // Type behaviours
    if (e.t === 'cloaker') {
      e.cloakTimer -= dt;
      if (e.cloakTimer <= 0) {
        e.cloaking = !e.cloaking;
        e.cloakTimer = e.cloaking ? 3 : 2;
      }
      e.al = e.cloaking ? 0.07 : 1;
    }
    if (e.t === 'berser' && e.hp < e.maxHp * 0.5 && !e.berserk) {
      e.berserk = true; e.spd *= 2; e.col = '#FF0000';
    }
    if (e.t === 'teleport') {
      e.teleTimer -= dt;
      if (e.teleTimer <= 0) {
        e.x = Math.random() * ww; e.y = Math.random() * wh;
        e.teleTimer = 4 + Math.random() * 3;
        events.push({ type: 'burst', x: e.x, y: e.y, col: '#44FFFF', n: 8, spd: 45 });
      }
    }
    if (e.t === 'necro') {
      e.necroTimer -= dt;
      if (e.necroTimer <= 0) {
        e.necroTimer = 8;
        if (deadEnemies.length > 0) {
          const d = deadEnemies.shift();
          events.push({ type: 'cloneSpawn', x: d.x, y: d.y, baseType: d.t || 'normal', waveNum: 1 });
          events.push({ type: 'burst', x: d.x, y: d.y, col: '#CC00FF', n: 10, spd: 55 });
        }
      }
    }
    if (e.t === 'shooter' || e.t === 'doppel') {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 1.8 + Math.random() * 2;
        const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy) || 1;
        events.push({ type: 'proj', x: e.x, y: e.y, vx: dx / d * 185, vy: dy / d * 185, r: 5, col: e.col, life: 3 });
      }
    }

    // Movement + separation
    const tdx = px - e.x, tdy = py - e.y, td = Math.hypot(tdx, tdy) || 1;
    let sx = 0, sy = 0;
    for (const o of enemies) {
      if (o === e) continue;
      const sd = dist(e.x, e.y, o.x, o.y);
      if (sd < 32 && sd > 0) { sx += (e.x - o.x) / sd; sy += (e.y - o.y) / sd; }
    }
    e.vx += (tdx / td * e.spd - e.vx) * Math.min(1, 4.5 * dt);
    e.vx += sx * 90 * dt;
    e.vy += (tdy / td * e.spd - e.vy) * Math.min(1, 4.5 * dt);
    e.vy += sy * 90 * dt;
    e.x += e.vx * dt; e.y += e.vy * dt;
    e.x = Math.max(0, Math.min(ww, e.x));
    e.y = Math.max(0, Math.min(wh, e.y));

    // Obstacle bounce
    for (const o of obstacles) {
      const cx = Math.max(o.x, Math.min(o.x + o.w, e.x));
      const cy = Math.max(o.y, Math.min(o.y + o.h, e.y));
      const dst = dist(e.x, e.y, cx, cy);
      if (dst < e.sz && dst > 0) {
        const nx = (e.x - cx) / dst, ny = (e.y - cy) / dst;
        e.x = cx + nx * (e.sz + 1); e.y = cy + ny * (e.sz + 1);
        e.vx += nx * 120; e.vy += ny * 120;
      }
    }

    // Hit player
    if (invincible <= 0 && !ghostActive && !empShieldActive &&
        dist(e.x, e.y, px, py) < e.sz + 12) {
      events.push({ type: 'hurtPlayer' });
    }
  }

  return events;
}

// ── Boss AI update ────────────────────────────────────────────────────────
export function updateBoss(boss, dt, px, py, ww, wh, enemies, waveNum) {
  if (!boss) return [];
  const events = [];
  if (boss.hitFlash > 0) boss.hitFlash -= dt;
  if (boss.frozen > 0) { boss.frozen -= dt; return events; }

  boss.angle = (boss.angle || 0) + dt * (boss.phase === 2 ? 1.4 : 0.8);

  const bossType = boss.bossType || 'LEGACY';

  // Phase 2 trigger
  if (boss.hp < boss.maxHp * 0.5 && boss.phase === 1) {
    boss.phase = 2;
    boss.spd = (boss.spd || 52) * 1.55;
    boss.shootTimer /= 2;
    events.push({ type: 'bossPhase2' });
  }

  if (bossType === 'LEGACY') {
    _updateLegacyBoss(boss, dt, px, py, ww, wh, events);
  } else if (bossType === 'CLONE_MASTER') {
    _updateCloneMaster(boss, dt, px, py, ww, wh, events, enemies, waveNum);
  } else if (bossType === 'RADIAL_SHOOTER') {
    _updateRadialShooter(boss, dt, px, py, ww, wh, events);
  } else if (bossType === 'TELEPORTER') {
    _updateTeleporterBoss(boss, dt, px, py, ww, wh, events);
  }

  // Melee hit
  if (dist(boss.x, boss.y, px, py) < boss.sz + 14) {
    events.push({ type: 'hurtPlayer' });
  }

  return events;
}

function _updateLegacyBoss(boss, dt, px, py, ww, wh, events) {
  const bdx = px - boss.x, bdy = py - boss.y, bd = Math.hypot(bdx, bdy) || 1;
  boss.x += bdx / bd * boss.spd * dt;
  boss.y += bdy / bd * boss.spd * dt;
  boss.x = clamp(boss.x, 40, ww - 40);
  boss.y = clamp(boss.y, 40, wh - 40);

  boss.shootTimer -= dt;
  if (boss.shootTimer <= 0) {
    boss.shootTimer = boss.phase === 2 ? 0.75 : 1.3;
    const cnt = boss.phase === 2 ? 5 : 3;
    for (let a = 0; a < cnt; a++) {
      const ang = a / cnt * Math.PI * 2 + boss.angle;
      events.push({ type: 'proj', x: boss.x, y: boss.y, vx: Math.cos(ang) * 210, vy: Math.sin(ang) * 210, r: 9, col: '#FF2200', life: 3.5 });
    }
  }
}

function _updateCloneMaster(boss, dt, px, py, ww, wh, events, enemies, waveNum) {
  // Slow movement
  const bdx = px - boss.x, bdy = py - boss.y, bd = Math.hypot(bdx, bdy) || 1;
  boss.x += bdx / bd * boss.spd * dt;
  boss.y += bdy / bd * boss.spd * dt;
  boss.x = clamp(boss.x, 40, ww - 40);
  boss.y = clamp(boss.y, 40, wh - 40);

  // Clone spawn timer
  boss.cloneTimer -= dt;
  if (boss.cloneTimer <= 0) {
    boss.cloneTimer = 5;
    // Spawn 2 clones near boss
    const currentTypes = enemies.length > 0
      ? [enemies[Math.floor(Math.random() * enemies.length)].t, enemies[Math.floor(Math.random() * enemies.length)].t]
      : ['normal', 'normal'];
    for (let i = 0; i < 2; i++) {
      const ang = Math.random() * Math.PI * 2;
      events.push({ type: 'cloneSpawn', x: boss.x + Math.cos(ang) * 70, y: boss.y + Math.sin(ang) * 70, baseType: currentTypes[i], waveNum, halfHp: true });
    }
    events.push({ type: 'burst', x: boss.x, y: boss.y, col: '#f59e0b', n: 14, spd: 60 });
  }

  // Wide spray shot
  boss.shootTimer -= dt;
  if (boss.shootTimer <= 0) {
    boss.shootTimer = boss.phase === 2 ? 1.0 : 1.8;
    const cnt = boss.phase === 2 ? 7 : 5;
    const baseAng = Math.atan2(py - boss.y, px - boss.x);
    for (let a = 0; a < cnt; a++) {
      const ang = baseAng + (a - (cnt - 1) / 2) * 0.35;
      events.push({ type: 'proj', x: boss.x, y: boss.y, vx: Math.cos(ang) * 180, vy: Math.sin(ang) * 180, r: 7, col: '#f59e0b', life: 3.5 });
    }
  }
}

function _updateRadialShooter(boss, dt, px, py, ww, wh, events) {
  // Fast movement
  const bdx = px - boss.x, bdy = py - boss.y, bd = Math.hypot(bdx, bdy) || 1;
  boss.x += bdx / bd * boss.spd * dt;
  boss.y += bdy / bd * boss.spd * dt;
  boss.x = clamp(boss.x, 40, ww - 40);
  boss.y = clamp(boss.y, 40, wh - 40);

  boss.shootTimer2 -= dt;
  if (boss.shootTimer2 <= 0) {
    boss.shootTimer2 = boss.phase === 2 ? 2.0 : 3.0;
    const cnt = boss.phase === 2 ? 16 : 12;
    for (let a = 0; a < cnt; a++) {
      const ang = a / cnt * Math.PI * 2 + boss.angle;
      events.push({ type: 'proj', x: boss.x, y: boss.y, vx: Math.cos(ang) * 220, vy: Math.sin(ang) * 220, r: 8, col: '#FF4400', life: 4 });
    }
    events.push({ type: 'burst', x: boss.x, y: boss.y, col: '#FF4400', n: 10, spd: 50 });
  }
}

function _updateTeleporterBoss(boss, dt, px, py, ww, wh, events) {
  // Normal movement
  const bdx = px - boss.x, bdy = py - boss.y, bd = Math.hypot(bdx, bdy) || 1;
  boss.x += bdx / bd * boss.spd * dt;
  boss.y += bdy / bd * boss.spd * dt;
  boss.x = clamp(boss.x, 40, ww - 40);
  boss.y = clamp(boss.y, 40, wh - 40);

  boss.shootTimer2 -= dt;
  if (boss.shootTimer2 <= 0) {
    boss.shootTimer2 = boss.phase === 2 ? 2.5 : 4;
    // Teleport near player
    const ang = Math.random() * Math.PI * 2;
    boss.x = clamp(px + Math.cos(ang) * 150, 40, ww - 40);
    boss.y = clamp(py + Math.sin(ang) * 150, 40, wh - 40);
    // EMP burst
    events.push({ type: 'empDisable', duration: 1 });
    events.push({ type: 'burst', x: boss.x, y: boss.y, col: '#44FFFF', n: 18, spd: 80 });
  }

  // Normal shoot
  boss.shootTimer -= dt;
  if (boss.shootTimer <= 0) {
    boss.shootTimer = boss.phase === 2 ? 0.9 : 1.5;
    const cnt = boss.phase === 2 ? 4 : 2;
    for (let a = 0; a < cnt; a++) {
      const ang = a / cnt * Math.PI * 2 + boss.angle;
      events.push({ type: 'proj', x: boss.x, y: boss.y, vx: Math.cos(ang) * 195, vy: Math.sin(ang) * 195, r: 8, col: '#44FFFF', life: 3.5 });
    }
  }
}

// ── Render helpers ────────────────────────────────────────────────────────
export function renderEnemies(ctx, enemies, camera, dpr, quality) {
  const glow = quality !== 'low';
  for (const e of enemies) {
    if (!camera.onScreen(e.x, e.y, e.sz + 14)) continue;
    const sa = e.spawnAnim > 0 ? Math.max(0.1, 1 - e.spawnAnim) : 1;
    ctx.save();
    ctx.translate(camera.wx(e.x, dpr), camera.wy(e.y, dpr));
    ctx.scale(sa, sa);
    ctx.globalAlpha = e.al * (e.frozen > 0 ? 0.6 : 1) * (e.spawnAnim > 0 ? sa : 1);
    const col = e.hitFlash > 0 ? '#FFFFFF' : (e.frozen > 0 ? '#88FFFF' : (e.virus > 0 ? '#44FF00' : (e.berserk ? '#FF0000' : e.col)));
    ctx.fillStyle = col;
    if (glow) { ctx.shadowBlur = e.t === 'necro' ? 35 : 15; ctx.shadowColor = e.hitFlash > 0 ? '#FFFFFF' : e.col; }
    const er = e.sz * dpr;
    ctx.beginPath();
    if (e.t === 'tank')     { ctx.rect(-er, -er, er * 2, er * 2); }
    else if (e.t === 'necro')  { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); } ctx.closePath(); }
    else if (e.t === 'elite')  { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 - Math.PI / 4; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); } ctx.closePath(); }
    else if (e.t === 'teleport') { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * er, Math.sin(a) * er); } ctx.closePath(); }
    else { ctx.arc(0, 0, er, 0, Math.PI * 2); }
    ctx.fill();
    if (glow) ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();

    // HP bar
    if (e.maxHp > 1) {
      const ex = camera.wx(e.x, dpr), ey = camera.wy(e.y, dpr), er2 = e.sz * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(ex - er2, ey - er2 - 8 * dpr, er2 * 2, 4 * dpr);
      ctx.fillStyle = e.col;
      ctx.fillRect(ex - er2, ey - er2 - 8 * dpr, er2 * 2 * (e.hp / e.maxHp), 4 * dpr);
    }
    if (e.cloaking) {
      ctx.strokeStyle = 'rgba(255,68,255,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(camera.wx(e.x, dpr), camera.wy(e.y, dpr), (e.sz + 5) * dpr, 0, Math.PI * 2); ctx.stroke();
    }
    if (e.frozen > 0) {
      ctx.strokeStyle = 'rgba(136,255,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(camera.wx(e.x, dpr), camera.wy(e.y, dpr), (e.sz + 3) * dpr, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

export function renderBoss(ctx, boss, camera, dpr, quality) {
  if (!boss) return;
  const glow = quality !== 'low';
  // HP bar at top of canvas (screen space, no camera transform)
  const bw = camera.vw * 0.6 * dpr;
  const bx = (camera.vw * dpr - bw) / 2;
  const by = 8 * dpr;
  ctx.fillStyle = 'rgba(255,0,0,0.15)';
  ctx.fillRect(bx, by, bw, 7 * dpr);
  const hpPct = boss.hp / boss.maxHp;
  const bossCol = boss.col || '#f59e0b';
  const hcol = hpPct > 0.5 ? bossCol : hpPct > 0.25 ? '#FF8800' : '#FF0000';
  ctx.fillStyle = hcol;
  if (glow) { ctx.shadowBlur = 12; ctx.shadowColor = hcol; }
  ctx.fillRect(bx, by, bw * hpPct, 7 * dpr);
  if (glow) ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,200,80,0.7)';
  ctx.font = `${8 * dpr}px monospace`;
  ctx.textAlign = 'center';
  const typeLabel = boss.bossType || 'BOSS';
  ctx.fillText(`${typeLabel}  PHASE ${boss.phase}  —  ${Math.ceil(boss.hp)} HP`, camera.vw * dpr / 2, by - 3 * dpr);

  // Boss body
  const bxe = camera.wx(boss.x, dpr), bye = camera.wy(boss.y, dpr), bs = boss.sz * dpr;
  ctx.save();
  ctx.translate(bxe, bye);
  ctx.rotate(boss.angle || 0);
  if (boss.hitFlash > 0) {
    if (glow) { ctx.shadowBlur = 60; ctx.shadowColor = '#FFFFFF'; }
    ctx.strokeStyle = '#FFFFFF';
  } else {
    if (glow) { ctx.shadowBlur = 50; ctx.shadowColor = bossCol; }
    ctx.strokeStyle = bossCol;
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * bs, Math.sin(a) * bs);
  }
  ctx.closePath();
  ctx.stroke();
  if (boss.phase === 2) {
    ctx.strokeStyle = `rgba(255,140,0,0.5)`; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + boss.angle * 0.4;
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * bs * 1.45, Math.sin(a) * bs * 1.45);
    }
    ctx.closePath();
    ctx.stroke();
  }
  if (glow) ctx.shadowBlur = 0;
  ctx.restore();
}
