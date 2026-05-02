// ─── MiniMap ──────────────────────────────────────────────────────────────────
import { MAPS } from '../mapgen/MapData.js';

const MW = 120, MH = 84;

export function renderMM(gameState) {
  const {
    mctx, WW, WH, OBSTACLES, DEAD_EYES, EPROJS, EYES, boss,
    px, py, camX, camY, lW, lH, skinIdx, SKINS, mapIdx,
  } = gameState;

  mctx.clearRect(0, 0, MW, MH);
  mctx.fillStyle = 'rgba(0,0,0,0.82)'; mctx.fillRect(0, 0, MW, MH);
  const sx = MW / WW, sy = MH / WH;

  // Obstacles
  mctx.fillStyle = 'rgba(255,255,255,0.06)';
  OBSTACLES.forEach(o => mctx.fillRect(o.x * sx, o.y * sy, o.w * sx, o.h * sy));

  // Dead enemies (ghost)
  DEAD_EYES.forEach(e => { mctx.fillStyle = 'rgba(255,255,255,0.1)'; mctx.fillRect(e.x * sx - 1, e.y * sy - 1, 2, 2); });

  // Enemy projectiles
  EPROJS.forEach(p => { mctx.fillStyle = 'rgba(255,100,100,0.5)'; mctx.fillRect(p.x * sx - 1, p.y * sy - 1, 2, 2); });

  // Enemies
  EYES.forEach(e => { mctx.fillStyle = e.col; mctx.fillRect(e.x * sx - 1.5, e.y * sy - 1.5, 3, 3); });

  // Boss
  if (boss) {
    mctx.shadowBlur = 8; mctx.shadowColor = '#FF0000'; mctx.fillStyle = '#FF0000';
    mctx.beginPath(); mctx.arc(boss.x * sx, boss.y * sy, 5, 0, Math.PI * 2); mctx.fill();
    mctx.shadowBlur = 0;
  }

  // Player
  mctx.shadowBlur = 6; mctx.shadowColor = SKINS[skinIdx]; mctx.fillStyle = SKINS[skinIdx];
  mctx.beginPath(); mctx.arc(px * sx, py * sy, 3, 0, Math.PI * 2); mctx.fill();
  mctx.shadowBlur = 0;

  // Viewport rect
  mctx.strokeStyle = 'rgba(191,0,255,0.6)'; mctx.lineWidth = 1;
  mctx.strokeRect(camX * sx, camY * sy, lW * sx, lH * sy);

  // Map name label
  mctx.fillStyle = 'rgba(191,0,255,0.4)'; mctx.font = '7px monospace';
  mctx.textAlign = 'left'; mctx.textBaseline = 'bottom';
  mctx.fillText(MAPS[mapIdx].n, 2, MH - 2);
}
