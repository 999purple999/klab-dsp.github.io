// ─── CampaignMapUI ────────────────────────────────────────────────────────────
// Renders the 20-zone campaign map on canvas. 5 columns × 4 rows.

export class CampaignMapUI {
  constructor(cv, ctx) {
    this.cv  = cv;
    this.ctx = ctx;
  }

  /**
   * Render the full campaign map grid.
   * @param {Array} zones       - array of 20 zone descriptor objects { name }
   * @param {number} selectedZone  - currently selected zone index (0-19)
   * @param {number} selectedLevel - currently selected level index (0-9)
   * @param {CampaignSave} save
   */
  render(zones, selectedZone, selectedLevel, save) {
    const ctx  = this.ctx;
    const W    = this.cv.width;
    const H    = this.cv.height;
    const DPR  = Math.min(window.devicePixelRatio || 1, 2);

    // Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#BF00FF';
    ctx.font      = `900 ${18 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur  = 20;
    ctx.shadowColor = '#BF00FF';
    ctx.fillText('CAMPAIGN MAP', W / 2, 12 * DPR);
    ctx.shadowBlur = 0;

    const COLS = 5;
    const ROWS = 4;
    const PAD  = 14 * DPR;
    const gridW = W - PAD * 2;
    const gridH = H - PAD * 2 - 50 * DPR;
    const cellW = gridW / COLS;
    const cellH = gridH / ROWS;

    for (let z = 0; z < 20; z++) {
      const col  = z % COLS;
      const row  = Math.floor(z / COLS);
      const x    = PAD + col * cellW;
      const y    = PAD + 44 * DPR + row * cellH;
      const data = {
        unlocked:  save.isZoneUnlocked(z),
        stars:     save.getZoneStars(z),
        progress:  save.getZoneProgress(z),
        zoneObj:   zones[z] || { name: `ZONE ${z + 1}` },
      };
      this._drawZoneCell(z, x, y, cellW - 6 * DPR, cellH - 6 * DPR, z === selectedZone, data, selectedLevel, save, DPR);
    }

    // Bottom hint bar
    ctx.fillStyle = 'rgba(191,0,255,0.18)';
    ctx.fillRect(0, H - 28 * DPR, W, 28 * DPR);
    ctx.fillStyle = '#aaa';
    ctx.font      = `${9 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('← → ↑ ↓  NAVIGATE    ENTER  SELECT    ESC  BACK', W / 2, H - 14 * DPR);
  }

  /**
   * Draw a single zone cell.
   * @param {number} zoneIdx
   * @param {number} x, y, w, h  - canvas coords
   * @param {boolean} selected
   * @param {object} data         - { unlocked, stars, progress, zoneObj }
   * @param {number} selectedLevel
   * @param {CampaignSave} save
   * @param {number} DPR
   */
  _drawZoneCell(zoneIdx, x, y, w, h, selected, data, selectedLevel, save, DPR) {
    const ctx = this.ctx;
    const { unlocked, stars, progress, zoneObj } = data;
    const cleared = progress >= 10;

    ctx.save();

    // Cell background
    if (!unlocked) {
      ctx.fillStyle = 'rgba(20,10,30,0.85)';
    } else if (cleared) {
      ctx.fillStyle = 'rgba(0,60,20,0.85)';
    } else {
      ctx.fillStyle = 'rgba(30,10,60,0.85)';
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6 * DPR);
    ctx.fill();

    // Border
    if (selected) {
      ctx.strokeStyle = '#BF00FF';
      ctx.lineWidth   = 2.5 * DPR;
      ctx.shadowBlur  = 18;
      ctx.shadowColor = '#BF00FF';
    } else if (cleared) {
      ctx.strokeStyle = '#00CC44';
      ctx.lineWidth   = 1.5 * DPR;
      ctx.shadowBlur  = 0;
    } else if (unlocked) {
      ctx.strokeStyle = 'rgba(191,0,255,0.4)';
      ctx.lineWidth   = 1 * DPR;
      ctx.shadowBlur  = 0;
    } else {
      ctx.strokeStyle = 'rgba(80,60,100,0.4)';
      ctx.lineWidth   = 1 * DPR;
      ctx.shadowBlur  = 0;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6 * DPR);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Zone number + name
    const zLabel = `Z${zoneIdx + 1}`;
    ctx.fillStyle = !unlocked ? 'rgba(100,80,120,0.6)' : (cleared ? '#00FF66' : '#BF00FF');
    ctx.font      = `900 ${10 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(zLabel, x + 6 * DPR, y + 5 * DPR);

    // Zone name
    const zoneName = (zoneObj.name || `Zone ${zoneIdx + 1}`).substring(0, 10);
    ctx.fillStyle   = unlocked ? '#ccc' : 'rgba(120,100,140,0.6)';
    ctx.font        = `${7.5 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(zoneName, x + w / 2, y + 5 * DPR);

    // Progress bar
    if (unlocked) {
      const barY = y + h - 10 * DPR;
      const barW = w - 12 * DPR;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + 6 * DPR, barY, barW, 4 * DPR);
      const pct = progress / 10;
      ctx.fillStyle = cleared ? '#00CC44' : '#7700CC';
      ctx.fillRect(x + 6 * DPR, barY, barW * pct, 4 * DPR);
      // progress text
      ctx.fillStyle = '#aaa';
      ctx.font      = `${6 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${progress}/10`, x + w - 6 * DPR, barY - 1 * DPR);
    }

    // Stars
    if (unlocked && stars > 0) {
      const maxStars  = 30; // 10 levels × 3 stars
      const starCount = Math.min(3, Math.floor(stars / 10));
      const starX0    = x + w / 2 - starCount * 7 * DPR;
      ctx.fillStyle   = '#FFD700';
      ctx.font        = `${9 * DPR}px serif`;
      ctx.textAlign   = 'left';
      ctx.textBaseline = 'middle';
      for (let s = 0; s < starCount; s++) {
        ctx.fillText('★', starX0 + s * 14 * DPR, y + h / 2);
      }
    }

    // Lock overlay
    if (!unlocked) {
      ctx.fillStyle   = 'rgba(20,10,30,0.55)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6 * DPR);
      ctx.fill();
      // Lock icon (simple padlock shape)
      const cx  = x + w / 2;
      const cy  = y + h / 2;
      const lw  = 14 * DPR;
      const lh  = 10 * DPR;
      ctx.strokeStyle = 'rgba(150,100,180,0.7)';
      ctx.lineWidth   = 1.5 * DPR;
      ctx.fillStyle   = 'rgba(80,50,110,0.8)';
      ctx.beginPath();
      ctx.roundRect(cx - lw / 2, cy - 1 * DPR, lw, lh, 2 * DPR);
      ctx.fill();
      ctx.stroke();
      // Shackle arc
      ctx.beginPath();
      ctx.arc(cx, cy - 1 * DPR, lw * 0.33, Math.PI, 0);
      ctx.stroke();
    }

    // Selected level list (only for selected zone)
    if (selected) {
      const lvlFontSz = Math.min(6.5 * DPR, h / 13);
      ctx.font        = `${lvlFontSz}px 'JetBrains Mono',monospace`;
      ctx.textAlign   = 'center';
      const lvlsPerRow = 5;
      const lvlW      = w / lvlsPerRow;
      const lvlAreaY  = y + 20 * DPR;
      const lvlAreaH  = h - 32 * DPR;
      const lvlH      = lvlAreaH / 2;
      for (let l = 0; l < 10; l++) {
        const lc   = l % lvlsPerRow;
        const lr   = Math.floor(l / lvlsPerRow);
        const lx   = x + lc * lvlW + lvlW / 2;
        const ly   = lvlAreaY + lr * lvlH;
        const done = save.isLevelComplete(zoneIdx, l);
        const isSel = l === selectedLevel;
        if (isSel) {
          ctx.fillStyle = 'rgba(191,0,255,0.35)';
          ctx.fillRect(x + lc * lvlW + 1 * DPR, ly, lvlW - 2 * DPR, lvlH - 2 * DPR);
        }
        ctx.fillStyle = !unlocked ? 'rgba(100,80,120,0.5)' : (done ? '#00CC44' : (isSel ? '#fff' : '#aaa'));
        ctx.textBaseline = 'middle';
        ctx.fillText(`L${l + 1}`, lx, ly + lvlH / 2);
        if (done) {
          const s = save.getLevelStars(zoneIdx, l);
          ctx.fillStyle = '#FFD700';
          ctx.font      = `${lvlFontSz * 0.8}px serif`;
          ctx.fillText('★'.repeat(Math.min(s, 3)), lx, ly + lvlH - 4 * DPR);
          ctx.font = `${lvlFontSz}px 'JetBrains Mono',monospace`;
        }
      }
    }

    ctx.restore();
  }
}
