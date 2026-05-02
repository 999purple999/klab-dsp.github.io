// ─── PlayerVisual ─────────────────────────────────────────────────────────────
// Renders the player body + equipped weapon sprite that rotates toward the aim.
// Call renderPlayer(ctx, px, py, angle, wpn, isFiring, isSliding, airJumpOffset, skinCol)
// from the GameScene render loop, replacing the plain hexagon draw.

/**
 * Draw the player + weapon overlay.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} sx - screen X (already world-to-screen transformed)
 * @param {number} sy - screen Y
 * @param {number} angle - aim angle in radians
 * @param {Object} wpn - weapon definition from WPNS
 * @param {boolean} isFiring
 * @param {boolean} isSliding - hitbox/visual is squished
 * @param {number} airJumpOffset - Y offset for air-dodge visual
 * @param {string} skinCol - player skin hex color
 * @param {number} DPR - device pixel ratio
 */
export function renderPlayer(ctx, sx, sy, angle, wpn, isFiring, isSliding, airJumpOffset = 0, skinCol = '#BF00FF', DPR = 1) {
  const R   = 14 * DPR;              // body radius
  const ayOff = airJumpOffset * DPR; // visual dodge offset

  ctx.save();
  ctx.translate(sx, sy + ayOff);

  if (isSliding) {
    ctx.scale(1.35, 0.65); // squish effect during slide
  }

  // ── Glow halo
  const glow = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 2.2);
  glow.addColorStop(0, skinCol + '55');
  glow.addColorStop(1, skinCol + '00');
  ctx.beginPath(); ctx.arc(0, 0, R * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = glow; ctx.fill();

  // ── Weapon arm
  ctx.save();
  ctx.rotate(angle);
  _drawWeapon(ctx, wpn, isFiring, R, DPR);
  ctx.restore();

  // ── Player body (hex)
  _drawHex(ctx, R, skinCol);

  // ── Direction indicator
  ctx.save();
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(R * 0.6, 0);
  ctx.lineTo(R * 1.3, 0);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5 * DPR;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function _drawHex(ctx, R, col) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    i === 0 ? ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R)
            : ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
  }
  ctx.closePath();

  // Fill
  ctx.fillStyle = col + 'CC';
  ctx.fill();

  // Stroke glow
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.shadowColor  = col;
  ctx.shadowBlur   = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner highlight
  ctx.beginPath();
  ctx.arc(0, -R * 0.3, R * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fill();
}

function _drawWeapon(ctx, wpn, isFiring, bodyR, DPR) {
  if (!wpn) return;
  const col     = wpn.col || '#BF00FF';
  const recoil  = isFiring ? -3 * DPR : 0;
  const armLen  = bodyR * 2.4 + recoil;
  const barrelX = bodyR * 0.8 + recoil;

  ctx.shadowColor = col;
  ctx.shadowBlur  = isFiring ? 14 : 6;

  switch (wpn.t) {
    case 'beam':
    case 'pulse':
      _gun(ctx, col, barrelX, armLen, 5 * DPR, 3 * DPR);
      break;
    case 'spread':
      _fan(ctx, col, barrelX, armLen, DPR);
      break;
    case 'split':
      _gun(ctx, col, barrelX, armLen, 8 * DPR, 2 * DPR);
      _gun(ctx, col, barrelX, armLen * 0.7, 3 * DPR, 2 * DPR, 6 * DPR);
      break;
    case 'wave':
    case 'vortex':
      _orb(ctx, col, armLen, bodyR * 0.5, DPR);
      break;
    case 'blackhole':
    case 'graviton':
      _orb(ctx, col, armLen * 0.8, bodyR * 0.7, DPR);
      break;
    case 'chain':
    case 'drone':
      _gun(ctx, col, barrelX, armLen, 4 * DPR, 4 * DPR);
      _jag(ctx, col, barrelX, armLen, DPR);
      break;
    case 'cryo':
      _gun(ctx, col, barrelX, armLen, 6 * DPR, 2 * DPR);
      _crystals(ctx, col, armLen, DPR);
      break;
    case 'nuke':
    case 'rail':
      _gun(ctx, col, barrelX, armLen * 1.2, 10 * DPR, 2 * DPR); // long barrel
      break;
    case 'virus':
    case 'corrupt':
      _gun(ctx, col, barrelX, armLen, 5 * DPR, 3 * DPR);
      _dots(ctx, col, armLen, DPR);
      break;
    default:
      _gun(ctx, col, barrelX, armLen, 5 * DPR, 3 * DPR);
  }

  // Muzzle flash when firing
  if (isFiring) {
    ctx.beginPath();
    ctx.arc(armLen, 0, 5 * DPR, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.shadowBlur = 0;
}

// ── Weapon shape helpers ──────────────────────────────────────────────────────
function _gun(ctx, col, x0, x1, h, stroke, yOff = 0) {
  ctx.fillStyle   = col;
  ctx.strokeStyle = col;
  ctx.lineWidth   = stroke;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.rect(x0, yOff - h / 2, x1 - x0, h);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function _fan(ctx, col, x0, x1, DPR) {
  ctx.strokeStyle = col;
  ctx.lineWidth   = 2 * DPR;
  ctx.globalAlpha = 0.85;
  [-10, 0, 10].forEach(deg => {
    const r = deg * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x1 * Math.cos(r), x1 * Math.sin(r));
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function _orb(ctx, col, dist, r, DPR) {
  const grad = ctx.createRadialGradient(dist, 0, 0, dist, 0, r);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.4, col);
  grad.addColorStop(1, col + '00');
  ctx.beginPath();
  ctx.arc(dist, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function _jag(ctx, col, x0, x1, DPR) {
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = DPR;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  const mid = (x0 + x1) / 2;
  ctx.moveTo(x0, 0); ctx.lineTo(mid - 4 * DPR, -5 * DPR);
  ctx.lineTo(mid + 4 * DPR, 5 * DPR); ctx.lineTo(x1, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function _crystals(ctx, col, x1, DPR) {
  ctx.strokeStyle = col;
  ctx.lineWidth   = 1.5 * DPR;
  ctx.globalAlpha = 0.7;
  [-6, 6].forEach(yOff => {
    ctx.beginPath();
    ctx.moveTo(x1 - 8 * DPR, 0);
    ctx.lineTo(x1, yOff * DPR);
    ctx.lineTo(x1 + 6 * DPR, 0);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function _dots(ctx, col, x1, DPR) {
  ctx.fillStyle   = col;
  ctx.globalAlpha = 0.7;
  [-4, 0, 4].forEach(y => {
    ctx.beginPath();
    ctx.arc(x1 - 5 * DPR, y * DPR, 2 * DPR, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}
