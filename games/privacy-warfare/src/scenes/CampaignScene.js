// ─── CampaignScene ────────────────────────────────────────────────────────────
// Campaign map: 20 zone nodes on a circuit-board layout.
// Nodes connected by glowing bezier lines. Mouse hover + click. Detail panel.

import { CampaignSave } from '../data/CampaignSave.js';

// 20 zone names
const ZONE_NAMES = [
  'FIREWALL', 'PHISH NET', 'DARKWEB', 'BOTNET', 'RANSOMWARE',
  'SPYWARE', 'TROJANS', 'ROOTKIT', 'CRYPTOVAULT', 'ZERO-DAY',
  'DDOS CORE', 'MITM NODE', 'EXFILTRAT', 'DEEPFAKE', 'AI THREAT',
  'SHADOWNET', 'QUANTUM ERR', 'VOID SHARD', 'SYS ADMIN', 'NEXUS',
];

// Normalized positions (0-1) for 20 nodes in a circuit layout
// 4 rows with 5 nodes, slight horizontal offset to look like circuit paths
const NODE_NORM = [
  { x: 0.08, y: 0.18 }, { x: 0.26, y: 0.12 }, { x: 0.44, y: 0.20 }, { x: 0.62, y: 0.13 }, { x: 0.80, y: 0.21 },
  { x: 0.82, y: 0.38 }, { x: 0.64, y: 0.42 }, { x: 0.46, y: 0.35 }, { x: 0.28, y: 0.43 }, { x: 0.09, y: 0.37 },
  { x: 0.10, y: 0.56 }, { x: 0.28, y: 0.60 }, { x: 0.46, y: 0.53 }, { x: 0.64, y: 0.61 }, { x: 0.83, y: 0.55 },
  { x: 0.81, y: 0.74 }, { x: 0.63, y: 0.78 }, { x: 0.45, y: 0.72 }, { x: 0.27, y: 0.80 }, { x: 0.10, y: 0.73 },
];

// Connection pairs (indices)
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
  [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
  [15, 16], [16, 17], [17, 18], [18, 19],
  // cross-row bridges
  [4, 5], [9, 10], [14, 15],
];

export class CampaignScene {
  constructor(cv, ctx, gameScene) {
    this.cv        = cv;
    this.ctx       = ctx;
    this.gameScene = gameScene;

    this.selectedZone = 0;
    this.hoveredZone  = -1;
    this.save         = new CampaignSave();
    this._t           = 0;
    this._playBtnRect = null; // {x,y,w,h} in CSS pixels for click detection

    this._onKey   = e => this._handleKey(e);
    this._onMove  = e => this._handleMove(e);
    this._onClick = e => this._handleClick(e);
  }

  enter() {
    document.addEventListener('keydown', this._onKey);
    this.cv.addEventListener('mousemove', this._onMove);
    this.cv.addEventListener('click', this._onClick);
    this.save._load();
  }

  exit() {
    document.removeEventListener('keydown', this._onKey);
    this.cv.removeEventListener('mousemove', this._onMove);
    this.cv.removeEventListener('click', this._onClick);
  }

  update(dt) {
    this._t += dt;
    this._render();
  }

  _nodePos(i) {
    const W    = this.cv.width;
    const H    = this.cv.height;
    // Use left 70% of canvas for the map, right 28% for panel
    const mapW = W * 0.70;
    const norm = NODE_NORM[i];
    return {
      x: norm.x * mapW + W * 0.02,
      y: norm.y * H * 0.88 + H * 0.07,
    };
  }

  _render() {
    const ctx = this.ctx;
    const cv  = this.cv;
    const W   = cv.width;
    const H   = cv.height;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const t   = this._t;

    // Background
    ctx.fillStyle = '#030208';
    ctx.fillRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(191,0,255,0.04)';
    ctx.lineWidth   = 1;
    const gs = 48 * DPR;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Draw connections
    for (const [a, b] of CONNECTIONS) {
      const pa = this._nodePos(a);
      const pb = this._nodePos(b);
      const aUnlocked = this.save.isZoneUnlocked(a);
      const bUnlocked = this.save.isZoneUnlocked(b);
      const active = aUnlocked && bUnlocked;

      ctx.strokeStyle = active ? 'rgba(0,255,200,0.35)' : 'rgba(80,40,120,0.25)';
      ctx.lineWidth   = active ? 1.5 * DPR : 1 * DPR;
      ctx.setLineDash(active ? [] : [4 * DPR, 6 * DPR]);

      // Bezier control point (slight deterministic curve using node indices)
      const side = (a + b) % 2 === 0 ? 1 : -1;
      const cx   = (pa.x + pb.x) / 2 + side * 20 * DPR;
      const cy   = (pa.y + pb.y) / 2 - 15 * DPR;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(cx, cy, pb.x, pb.y);
      ctx.stroke();

      // Traveling dot on active connections
      if (active) {
        const progress = (t * 0.4 + (a + b) * 0.07) % 1;
        const tx = pa.x + (pb.x - pa.x) * progress;
        const ty = pa.y + (pb.y - pa.y) * progress;
        ctx.fillStyle   = '#00FFCC';
        ctx.shadowBlur  = 8;
        ctx.shadowColor = '#00FFCC';
        ctx.beginPath(); ctx.arc(tx, ty, 3 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur  = 0;
      }
    }
    ctx.setLineDash([]);

    // Draw zone nodes
    for (let i = 0; i < 20; i++) {
      const pos      = this._nodePos(i);
      const unlocked = this.save.isZoneUnlocked(i);
      const cleared  = this._isZoneCleared(i);
      const selected = i === this.selectedZone;
      const hovered  = i === this.hoveredZone;
      const r        = 26 * DPR;

      // Pulsing ring for selected
      if (selected) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 3);
        ctx.strokeStyle = `rgba(191,0,255,${0.4 + 0.4 * pulse})`;
        ctx.lineWidth   = 2 * DPR;
        ctx.shadowBlur  = 20;
        ctx.shadowColor = '#BF00FF';
        this._hexPath(ctx, pos.x, pos.y, r + 8 * DPR);
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      // Node fill
      ctx.shadowBlur  = (selected || hovered) ? 22 : (unlocked ? 8 : 0);
      ctx.shadowColor = cleared ? '#00FF66' : '#BF00FF';
      ctx.fillStyle   = !unlocked ? 'rgba(20,8,35,0.95)'
                      : cleared   ? 'rgba(0,60,20,0.95)'
                      : 'rgba(40,5,80,0.95)';
      this._hexPath(ctx, pos.x, pos.y, r);
      ctx.fill();

      // Node border
      ctx.strokeStyle = !unlocked ? 'rgba(80,50,110,0.4)'
                      : cleared   ? '#00CC44'
                      : selected  ? '#BF00FF'
                      : hovered   ? 'rgba(191,0,255,0.7)'
                      : 'rgba(191,0,255,0.35)';
      ctx.lineWidth   = (selected || hovered) ? 2 * DPR : 1.5 * DPR;
      this._hexPath(ctx, pos.x, pos.y, r);
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Zone number
      ctx.fillStyle    = !unlocked ? 'rgba(100,70,130,0.7)' : cleared ? '#00FF66' : '#BF00FF';
      ctx.font         = `900 ${9 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Z${i + 1}`, pos.x, pos.y - 5 * DPR);

      // Zone short name
      ctx.fillStyle    = !unlocked ? 'rgba(100,70,130,0.5)' : 'rgba(200,180,220,0.85)';
      ctx.font         = `${7 * DPR}px 'JetBrains Mono',monospace`;
      ctx.fillText(ZONE_NAMES[i].substring(0, 8), pos.x, pos.y + 7 * DPR);

      // Lock icon
      if (!unlocked) {
        ctx.fillStyle = 'rgba(140,100,180,0.6)';
        ctx.font      = `${10 * DPR}px serif`;
        ctx.fillText('🔒', pos.x, pos.y + 18 * DPR);
      }
    }

    // Right panel — zone details
    this._renderDetailPanel(ctx, W, H, DPR);

    // Title bar
    ctx.fillStyle    = 'rgba(191,0,255,0.18)';
    ctx.fillRect(0, 0, W, 36 * DPR);
    ctx.fillStyle    = '#BF00FF';
    ctx.font         = `900 ${12 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur   = 16; ctx.shadowColor = '#BF00FF';
    ctx.fillText('CAMPAIGN MAP', W / 2, 18 * DPR);
    ctx.shadowBlur   = 0;

    // Hint bar at bottom
    ctx.fillStyle    = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, H - 28 * DPR, W, 28 * DPR);
    ctx.fillStyle    = 'rgba(200,180,220,0.5)';
    ctx.font         = `${8 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('← → ↑ ↓  Navigate    ENTER  Play    ESC  Back to Menu', W / 2, H - 14 * DPR);
  }

  _hexPath(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a  = (Math.PI / 3) * i - Math.PI / 6;
      const mx = cx + r * Math.cos(a);
      const my = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.closePath();
  }

  _isZoneCleared(z) {
    let count = 0;
    for (let l = 0; l < 10; l++) if (this.save.isLevelComplete(z, l)) count++;
    return count >= 10;
  }

  _renderDetailPanel(ctx, W, H, DPR) {
    const z    = this.selectedZone;
    const panX = W * 0.72;
    const panW = W * 0.26;
    const panY = 44 * DPR;
    const panH = H - 72 * DPR;

    // Panel bg
    ctx.fillStyle   = 'rgba(8,3,20,0.92)';
    ctx.strokeStyle = 'rgba(191,0,255,0.3)';
    ctx.lineWidth   = 1 * DPR;
    ctx.beginPath(); ctx.roundRect(panX, panY, panW, panH, 8 * DPR); ctx.fill(); ctx.stroke();

    const cx = panX + panW / 2;
    let y    = panY + 20 * DPR;

    // Zone name
    ctx.fillStyle    = '#BF00FF';
    ctx.font         = `900 ${11 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur   = 12; ctx.shadowColor = '#BF00FF';
    ctx.fillText(`ZONE ${z + 1}`, cx, y); y += 16 * DPR;
    ctx.shadowBlur   = 0;

    ctx.fillStyle = '#fff';
    ctx.font      = `900 ${10 * DPR}px 'JetBrains Mono',monospace`;
    ctx.fillText(ZONE_NAMES[z], cx, y); y += 20 * DPR;

    // Unlock status
    const unlocked = this.save.isZoneUnlocked(z);
    ctx.fillStyle = unlocked ? '#00FF66' : 'rgba(150,100,180,0.7)';
    ctx.font      = `${8 * DPR}px 'JetBrains Mono',monospace`;
    ctx.fillText(unlocked ? '● UNLOCKED' : '🔒 LOCKED', cx, y); y += 20 * DPR;

    // Level grid (2 rows x 5 cols)
    const lvlW = panW / 5 - 4 * DPR;
    const lvlH = 20 * DPR;
    for (let l = 0; l < 10; l++) {
      const col  = l % 5;
      const row  = Math.floor(l / 5);
      const lx   = panX + col * (panW / 5) + 2 * DPR;
      const ly   = y + row * (lvlH + 4 * DPR);
      const done = this.save.isLevelComplete(z, l);

      ctx.fillStyle   = !unlocked ? 'rgba(30,15,50,0.8)'
                      : done      ? 'rgba(0,60,20,0.9)'
                      : 'rgba(40,10,70,0.8)';
      ctx.strokeStyle = done ? '#00CC44' : (unlocked ? 'rgba(191,0,255,0.3)' : 'rgba(60,40,80,0.3)');
      ctx.lineWidth   = 1 * DPR;
      ctx.beginPath(); ctx.roundRect(lx, ly, lvlW, lvlH, 3 * DPR); ctx.fill(); ctx.stroke();

      ctx.fillStyle    = done ? '#00FF66' : (unlocked ? '#aaa' : 'rgba(80,60,100,0.6)');
      ctx.font         = `${7 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`L${l + 1}`, lx + lvlW / 2, ly + lvlH / 2);

      // Stars
      if (done) {
        const s = this.save.getLevelStars ? this.save.getLevelStars(z, l) : 1;
        ctx.fillStyle = '#FFD700';
        ctx.font      = `${6 * DPR}px serif`;
        ctx.fillText('★'.repeat(Math.min(s || 1, 3)), lx + lvlW / 2, ly + lvlH - 4 * DPR);
      }
    }
    y += 2 * (lvlH + 4 * DPR) + 16 * DPR;

    // Boss indicator
    ctx.fillStyle = 'rgba(255,40,40,0.8)';
    ctx.font      = `${8 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('⚡ BOSS AT LEVEL 10', cx, y); y += 18 * DPR;

    // Progress
    let completed = 0;
    for (let l = 0; l < 10; l++) if (this.save.isLevelComplete(z, l)) completed++;
    const pct = completed / 10;
    const bx  = panX + 10 * DPR;
    const bw  = panW - 20 * DPR;
    ctx.fillStyle = 'rgba(60,20,100,0.5)';
    ctx.beginPath(); ctx.roundRect(bx, y, bw, 6 * DPR, 3 * DPR); ctx.fill();
    if (pct > 0) {
      ctx.fillStyle  = completed >= 10 ? '#00CC44' : '#BF00FF';
      ctx.shadowBlur = 8; ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath(); ctx.roundRect(bx, y, bw * pct, 6 * DPR, 3 * DPR); ctx.fill();
      ctx.shadowBlur = 0;
    }
    y += 16 * DPR;
    ctx.fillStyle    = 'rgba(200,180,220,0.6)';
    ctx.font         = `${8 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${completed}/10 levels`, cx, y); y += 22 * DPR;

    // PLAY button
    if (unlocked) {
      const btnH  = 32 * DPR;
      const btnX  = panX + 12 * DPR;
      const btnW  = panW - 24 * DPR;
      const pulse = 0.8 + 0.2 * Math.sin(this._t * 2.5);
      ctx.fillStyle   = `rgba(191,0,255,${0.75 * pulse})`;
      ctx.shadowBlur  = 16; ctx.shadowColor = '#BF00FF';
      ctx.beginPath(); ctx.roundRect(btnX, y, btnW, btnH, 6 * DPR); ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = '#BF00FF'; ctx.lineWidth = 1.5 * DPR;
      ctx.beginPath(); ctx.roundRect(btnX, y, btnW, btnH, 6 * DPR); ctx.stroke();
      ctx.fillStyle    = '#fff';
      ctx.font         = `900 ${11 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▶  PLAY', btnX + btnW / 2, y + btnH / 2);

      // Store button rect in CSS pixels for click detection
      const DPR2 = Math.min(window.devicePixelRatio || 1, 2);
      this._playBtnRect = { x: btnX / DPR2, y: y / DPR2, w: btnW / DPR2, h: btnH / DPR2 };
    } else {
      this._playBtnRect = null;
    }
  }

  _handleKey(e) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.selectedZone = Math.min(19, this.selectedZone + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.selectedZone = Math.max(0, this.selectedZone - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.selectedZone = Math.min(19, this.selectedZone + 5);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedZone = Math.max(0, this.selectedZone - 5);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._launchSelected();
        break;
      case 'Escape':
        // No game reference in this constructor; ESC is a no-op
        break;
    }
  }

  _handleMove(e) {
    const rect = this.cv.getBoundingClientRect();
    const DPR  = Math.min(window.devicePixelRatio || 1, 2);
    const mx   = (e.clientX - rect.left) * DPR;
    const my   = (e.clientY - rect.top) * DPR;
    this.hoveredZone = -1;
    for (let i = 0; i < 20; i++) {
      const p  = this._nodePos(i);
      const dx = mx - p.x;
      const dy = my - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 32 * DPR) { this.hoveredZone = i; break; }
    }
    this.cv.style.cursor = this.hoveredZone >= 0 || this._isOverPlayBtn(e) ? 'pointer' : 'default';
  }

  _handleClick(e) {
    const rect = this.cv.getBoundingClientRect();
    const DPR  = Math.min(window.devicePixelRatio || 1, 2);
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;

    // Check zone nodes
    for (let i = 0; i < 20; i++) {
      const p  = this._nodePos(i);
      const dx = mx * DPR - p.x;
      const dy = my * DPR - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 32 * DPR) {
        this.selectedZone = i;
        return;
      }
    }

    // Check play button
    if (this._isOverPlayBtn(e)) this._launchSelected();
  }

  _isOverPlayBtn(e) {
    if (!this._playBtnRect) return false;
    const rect = this.cv.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const b    = this._playBtnRect;
    return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
  }

  _launchSelected() {
    const z = this.selectedZone;
    if (!this.save.isZoneUnlocked(z)) return;
    const waveNum = z * 10 + 1;
    this.gameScene.wave = waveNum;

    const origKillBoss = this.gameScene._killBoss?.bind(this.gameScene);
    if (origKillBoss) {
      this.gameScene._killBoss = () => {
        origKillBoss();
        const hpPct = this.gameScene.hp / (this.gameScene.maxHp || 5);
        const stars  = hpPct > 0.66 ? 3 : hpPct > 0.33 ? 2 : 1;
        this.save.completeLevel(z, 0, stars);
        this.gameScene._killBoss = origKillBoss;
      };
    }
    this.gameScene.startGame();
  }
}
