// ─── CampaignScene ────────────────────────────────────────────────────────────
// Cyberpunk PCB circuit-board campaign map — premium 10x visual rewrite.
// Manhattan-routed PCB traces, animated data packets, hex nodes with category
// icons, glitch title, keycap controls, and full zone briefing panel.

import { CampaignSave } from '../data/CampaignSave.js';

// ─── Static data ──────────────────────────────────────────────────────────────

const ZONE_NAMES = [
  'FIREWALL', 'PHISH NET', 'DARKWEB', 'BOTNET', 'RANSOMWARE',
  'SPYWARE', 'TROJANS', 'ROOTKIT', 'CRYPTOVAULT', 'ZERO-DAY',
  'DDOS CORE', 'MITM NODE', 'EXFILTRAT', 'DEEPFAKE', 'AI THREAT',
  'SHADOWNET', 'QUANTUM ERR', 'VOID SHARD', 'SYS ADMIN', 'NEXUS',
];

const BOSS_NAMES = [
  'IGNIS PRIME',  'PHISH QUEEN', 'DARKMASTER',   'BOT OVERLORD',  'RANSOM KING',
  'EYE SPIDER',   'TROJAN HORSE','ROOT DAEMON',  'CRYPTO WRAITH', '0DAY GHOST',
  'DDoS HYDRA',   'MITM SHADE',  'DATA KRAKEN',  'DEEP FAKER',    'AI DOMINION',
  'SHADOW LORD',  'QUANTUM RIFT','VOID HERALD',  'SYSADM1N',      'NEXUS OMEGA',
];

// Zone categories — every 4 zones get a distinct cyber identity
const CATEGORIES = [
  { name: 'FIREWALL',     color: '#FF4422', rgb: [255, 68,  34]  },
  { name: 'INFILTRATION', color: '#00FFEE', rgb: [0,   255, 238] },
  { name: 'NETWORK',      color: '#BF00FF', rgb: [191, 0,   255] },
  { name: 'AI THREAT',    color: '#FFD700', rgb: [255, 215, 0]   },
  { name: 'NEXUS',        color: '#E0E0FF', rgb: [224, 224, 255] },
];

function catOf(z) { return CATEGORIES[Math.floor(z / 4)]; }

// Normalized positions (0-1) within the map area — circuit-board layout
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
  [4, 5], [9, 10], [14, 15],
];

// ─── Main class ───────────────────────────────────────────────────────────────

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

    // Glitch title state
    this._glitchTimer    = 0;
    this._glitchActive   = false;
    this._glitchDuration = 0;
    this._nextGlitch     = 3.2 + Math.random() * 1.5;

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

    // Glitch title ticker
    this._glitchTimer += dt;
    if (!this._glitchActive && this._glitchTimer >= this._nextGlitch) {
      this._glitchActive   = true;
      this._glitchDuration = 0.08 + Math.random() * 0.1;
      this._glitchTimer    = 0;
      this._nextGlitch     = 3.0 + Math.random() * 1.8;
    }
    if (this._glitchActive) {
      this._glitchDuration -= dt;
      if (this._glitchDuration <= 0) this._glitchActive = false;
    }

    this._render();
  }

  // ─── Node position ──────────────────────────────────────────────────────────

  _nodePos(i) {
    const W    = this.cv.width;
    const H    = this.cv.height;
    const mapW = W * 0.70;
    const norm = NODE_NORM[i];
    return {
      x: norm.x * mapW + W * 0.02,
      y: norm.y * H * 0.88 + H * 0.07,
    };
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  _render() {
    const ctx = this.ctx;
    const cv  = this.cv;
    const W   = cv.width;
    const H   = cv.height;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const t   = this._t;

    // ── Deep black base ──────────────────────────────────────────────────────
    ctx.fillStyle = '#000308';
    ctx.fillRect(0, 0, W, H);

    // ── PCB honeycomb hex grid ────────────────────────────────────────────────
    this._drawPCBHexGrid(ctx, W, H, DPR);

    // ── Diagonal scan lines ───────────────────────────────────────────────────
    this._drawScanLines(ctx, W, H, DPR);

    // ── Animated scanning beam ────────────────────────────────────────────────
    this._drawScanBeam(ctx, W, H, DPR, t);

    // ── Corner brackets ───────────────────────────────────────────────────────
    const mapW = W * 0.70;
    this._drawCornerBrackets(ctx, W * 0.01, H * 0.04, mapW - W * 0.01, H * 0.97, DPR);

    // ── PCB Manhattan connections ─────────────────────────────────────────────
    this._drawConnections(ctx, DPR, t);

    // ── Zone nodes ────────────────────────────────────────────────────────────
    for (let i = 0; i < 20; i++) this._drawNode(ctx, i, DPR, t);

    // ── Right detail panel ────────────────────────────────────────────────────
    this._renderDetailPanel(ctx, W, H, DPR);

    // ── Title bar ─────────────────────────────────────────────────────────────
    this._drawTitleBar(ctx, W, H, DPR, t);

    // ── Controls hint bar ─────────────────────────────────────────────────────
    this._drawControlsBar(ctx, W, H, DPR);
  }

  // ─── PCB honeycomb hex grid ─────────────────────────────────────────────────

  _drawPCBHexGrid(ctx, W, H, DPR) {
    const size   = 18 * DPR; // hex cell radius
    const colW   = size * Math.sqrt(3);
    const rowH   = size * 1.5;
    ctx.strokeStyle = 'rgba(0,255,180,0.04)';
    ctx.lineWidth   = 1;
    for (let row = -1; row < H / rowH + 2; row++) {
      for (let col = -1; col < W / colW + 2; col++) {
        const cx = col * colW + (row % 2 === 0 ? 0 : colW / 2);
        const cy = row * rowH;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const ang = (Math.PI / 3) * k - Math.PI / 6;
          const px  = cx + size * Math.cos(ang);
          const py  = cy + size * Math.sin(ang);
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  // ─── Diagonal scan lines ────────────────────────────────────────────────────

  _drawScanLines(ctx, W, H, DPR) {
    ctx.save();
    ctx.strokeStyle = 'rgba(191,0,255,0.03)';
    ctx.lineWidth   = 1;
    const step = 8 * DPR;
    for (let d = -H; d < W + H; d += step) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + H, H);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ─── Scanning beam ──────────────────────────────────────────────────────────

  _drawScanBeam(ctx, W, H, DPR, t) {
    const period  = 4.0;
    const beamW   = 60 * DPR;
    const cx      = ((t % period) / period) * (W + beamW) - beamW / 2;
    const grad    = ctx.createLinearGradient(cx - beamW / 2, 0, cx + beamW / 2, 0);
    grad.addColorStop(0,   'rgba(0,255,200,0)');
    grad.addColorStop(0.5, 'rgba(0,255,200,0.06)');
    grad.addColorStop(1,   'rgba(0,255,200,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - beamW / 2, 0, beamW, H);
  }

  // ─── Corner brackets ────────────────────────────────────────────────────────

  _drawCornerBrackets(ctx, x1, y1, x2, y2, DPR) {
    const len     = 22 * DPR;
    const thick   = 2 * DPR;
    const inset   = 6 * DPR;
    ctx.strokeStyle = 'rgba(0,255,180,0.3)';
    ctx.lineWidth   = thick;
    ctx.setLineDash([]);
    const corners = [
      [x1 + inset, y1 + inset, 1, 1],
      [x2 - inset, y1 + inset, -1, 1],
      [x1 + inset, y2 - inset, 1, -1],
      [x2 - inset, y2 - inset, -1, -1],
    ];
    for (const [cx, cy, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * len, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * len);
      ctx.stroke();
      // small dot at corner
      ctx.fillStyle = 'rgba(0,255,180,0.5)';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5 * DPR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─── Manhattan PCB connections ──────────────────────────────────────────────

  _drawConnections(ctx, DPR, t) {
    ctx.setLineDash([]);
    for (const [a, b] of CONNECTIONS) {
      const pa       = this._nodePos(a);
      const pb       = this._nodePos(b);
      const aUnlocked = this.save.isZoneUnlocked(a);
      const bUnlocked = this.save.isZoneUnlocked(b);
      const active    = aUnlocked && bUnlocked;

      // Manhattan route: H → V → H (alternate direction based on parity)
      const flip = (a + b) % 2 === 0;
      let segments; // array of {x1,y1,x2,y2}
      if (flip) {
        // go horizontal from A to midpoint X, then vertical to B's Y, then horizontal to B
        const midX = (pa.x + pb.x) / 2;
        segments = [
          { x1: pa.x, y1: pa.y, x2: midX, y2: pa.y },
          { x1: midX, y1: pa.y, x2: midX, y2: pb.y },
          { x1: midX, y1: pb.y, x2: pb.x, y2: pb.y },
        ];
      } else {
        // go vertical from A to midpoint Y, then horizontal to B's X, then vertical to B
        const midY = (pa.y + pb.y) / 2;
        segments = [
          { x1: pa.x, y1: pa.y, x2: pa.x, y2: midY },
          { x1: pa.x, y1: midY, x2: pb.x, y2: midY },
          { x1: pb.x, y1: midY, x2: pb.x, y2: pb.y },
        ];
      }

      if (active) {
        ctx.strokeStyle = 'rgba(0,220,180,0.5)';
        ctx.lineWidth   = 1.5 * DPR;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(60,30,100,0.2)';
        ctx.lineWidth   = 1 * DPR;
        ctx.setLineDash([3 * DPR, 5 * DPR]);
      }

      for (const seg of segments) {
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Via pads at bends on active traces
      if (active) {
        const bends = flip
          ? [{ x: (pa.x + pb.x) / 2, y: pa.y }, { x: (pa.x + pb.x) / 2, y: pb.y }]
          : [{ x: pa.x, y: (pa.y + pb.y) / 2 }, { x: pb.x, y: (pa.y + pb.y) / 2 }];
        ctx.fillStyle   = '#00DDB4';
        ctx.shadowBlur  = 6;
        ctx.shadowColor = '#00DDB4';
        for (const v of bends) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, 2 * DPR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Animated data packet traveling along the full path
        const totalLen = segments.reduce((acc, s) =>
          acc + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);
        if (totalLen > 0) {
          const speed   = 0.3 + ((a * 7 + b * 3) % 10) * 0.05;
          const rawPct  = ((t * speed + (a * 0.13 + b * 0.07)) % 1);
          const pktDist = rawPct * totalLen;
          let   traveled = 0;
          let   pktX = 0, pktY = 0;
          for (const seg of segments) {
            const segLen = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
            if (traveled + segLen >= pktDist) {
              const frac = (pktDist - traveled) / segLen;
              pktX = seg.x1 + (seg.x2 - seg.x1) * frac;
              pktY = seg.y1 + (seg.y2 - seg.y1) * frac;
              break;
            }
            traveled += segLen;
            pktX = seg.x2; pktY = seg.y2;
          }
          // Glowing trail
          const cat = catOf(a);
          ctx.shadowBlur  = 10;
          ctx.shadowColor = cat.color;
          ctx.fillStyle   = cat.color;
          ctx.fillRect(pktX - 1.5 * DPR, pktY - 1.5 * DPR, 3 * DPR, 3 * DPR);
          ctx.shadowBlur  = 0;
          // Fading trail squares behind the packet
          for (let k = 1; k <= 4; k++) {
            const trailPct  = Math.max(0, rawPct - k * 0.025);
            const trailDist = trailPct * totalLen;
            let   trav2 = 0;
            let   tx = 0, ty = 0;
            for (const seg of segments) {
              const segLen = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
              if (trav2 + segLen >= trailDist) {
                const frac2 = (trailDist - trav2) / segLen;
                tx = seg.x1 + (seg.x2 - seg.x1) * frac2;
                ty = seg.y1 + (seg.y2 - seg.y1) * frac2;
                break;
              }
              trav2 += segLen;
              tx = seg.x2; ty = seg.y2;
            }
            const alpha = (1 - k / 5) * 0.35;
            const [r, g, bl] = cat.rgb;
            ctx.fillStyle = `rgba(${r},${g},${bl},${alpha})`;
            ctx.fillRect(tx - DPR, ty - DPR, 2 * DPR, 2 * DPR);
          }
        }
      }
    }
    ctx.setLineDash([]);
  }

  // ─── Draw a single zone node ─────────────────────────────────────────────────

  _drawNode(ctx, i, DPR, t) {
    const pos      = this._nodePos(i);
    const unlocked = this.save.isZoneUnlocked(i);
    const cleared  = this._isZoneCleared(i);
    const selected = i === this.selectedZone;
    const hovered  = i === this.hoveredZone;
    const cat      = catOf(i);
    const r        = 26 * DPR;
    const [cr, cg, cb] = cat.rgb;

    // Outer pulsing ring for selected node
    if (selected) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.5 + 0.45 * pulse})`;
      ctx.lineWidth   = (2 + pulse) * DPR;
      ctx.shadowBlur  = 35;
      ctx.shadowColor = cat.color;
      this._hexPath(ctx, pos.x, pos.y, r + 10 * DPR);
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Second outer pulse ring
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.2 * pulse})`;
      ctx.lineWidth   = 1 * DPR;
      this._hexPath(ctx, pos.x, pos.y, r + 18 * DPR * (0.8 + 0.2 * pulse));
      ctx.stroke();
    }

    // Glow for unlocked nodes
    ctx.shadowBlur  = (selected || hovered) ? 22 : (unlocked ? 14 : 0);
    ctx.shadowColor = unlocked ? cat.color : 'rgba(60,30,80,0.5)';

    // Node fill
    ctx.fillStyle = unlocked
      ? `rgba(${cr},${cg},${cb},0.15)`
      : 'rgba(15,5,28,0.95)';
    this._hexPath(ctx, pos.x, pos.y, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Node border
    if (unlocked) {
      ctx.strokeStyle = selected
        ? cat.color
        : hovered
        ? `rgba(${cr},${cg},${cb},0.9)`
        : `rgba(${cr},${cg},${cb},0.6)`;
    } else {
      ctx.strokeStyle = 'rgba(60,40,80,0.3)';
    }
    ctx.lineWidth = (selected || hovered) ? 2.5 * DPR : 1.5 * DPR;
    this._hexPath(ctx, pos.x, pos.y, r);
    ctx.stroke();

    // Zone number label
    ctx.fillStyle    = unlocked ? cat.color : 'rgba(100,70,130,0.7)';
    ctx.font         = `900 ${9 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Z${i + 1}`, pos.x, pos.y - 7 * DPR);

    // Zone short name (below number)
    ctx.fillStyle    = unlocked ? `rgba(${cr},${cg},${cb},0.75)` : 'rgba(100,70,130,0.5)';
    ctx.font         = `${6.5 * DPR}px 'JetBrains Mono',monospace`;
    ctx.fillText(ZONE_NAMES[i].substring(0, 8), pos.x, pos.y + 4 * DPR);

    // Category icon (canvas-drawn, no emoji)
    if (unlocked) {
      this._drawZoneIcon(ctx, pos.x, pos.y + 14 * DPR, 7 * DPR, i, cat, DPR);
    }

    // Lock icon (canvas-drawn rectangle + arch — NO emoji)
    if (!unlocked) {
      this._drawLockIcon(ctx, pos.x, pos.y + 12 * DPR, 7 * DPR, DPR);
    }

    // Cleared checkmark (canvas-drawn tick)
    if (cleared && unlocked) {
      this._drawCheckmark(ctx, pos.x + r * 0.55, pos.y - r * 0.55, 5 * DPR, DPR);
    }
  }

  // ─── Zone category icons (all canvas paths) ─────────────────────────────────

  _drawZoneIcon(ctx, cx, cy, size, zoneIdx, cat, DPR) {
    const catIdx = Math.floor(zoneIdx / 4); // 0–4
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = cat.color;
    ctx.fillStyle   = cat.color;
    ctx.lineWidth   = 1.2 * DPR;
    ctx.globalAlpha = 0.85;

    if (catIdx === 0) {
      // FIREWALL — shield (pentagon-like)
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.85, -size * 0.4);
      ctx.lineTo(size * 0.65, size * 0.7);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.65, size * 0.7);
      ctx.lineTo(-size * 0.85, -size * 0.4);
      ctx.closePath();
      ctx.stroke();
      // inner flame lines
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.4);
      ctx.lineTo(0, size * 0.5);
      ctx.moveTo(-size * 0.35, 0);
      ctx.lineTo(size * 0.35, 0);
      ctx.stroke();
    } else if (catIdx === 1) {
      // INFILTRATION — eye
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      // pupil
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (catIdx === 2) {
      // NETWORK — wifi signal arcs
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(0, size * 0.4, size * k * 0.32, Math.PI * 1.25, Math.PI * 1.75);
        ctx.stroke();
      }
      // center dot
      ctx.beginPath();
      ctx.arc(0, size * 0.4, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
    } else if (catIdx === 3) {
      // AI THREAT — circuit brain (circle + crossing lines)
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      const offs = size * 0.75;
      ctx.beginPath();
      ctx.moveTo(-offs, 0); ctx.lineTo(-size * 1.1, 0);
      ctx.moveTo(offs,  0); ctx.lineTo(size * 1.1,  0);
      ctx.moveTo(0, -offs); ctx.lineTo(0, -size * 1.1);
      ctx.moveTo(-offs * 0.65, -offs * 0.65); ctx.lineTo(-size * 0.85, -size * 0.85);
      ctx.moveTo(offs * 0.65,  -offs * 0.65); ctx.lineTo(size * 0.85,  -size * 0.85);
      ctx.stroke();
    } else {
      // NEXUS — 6-point star
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const outerA = (Math.PI / 3) * k - Math.PI / 2;
        const innerA = outerA + Math.PI / 6;
        const ox = Math.cos(outerA) * size;
        const oy = Math.sin(outerA) * size;
        const ix = Math.cos(innerA) * size * 0.45;
        const iy = Math.sin(innerA) * size * 0.45;
        if (k === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  // ─── Canvas-drawn lock icon (no emoji) ──────────────────────────────────────

  _drawLockIcon(ctx, cx, cy, size, DPR) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(140,100,180,0.65)';
    ctx.fillStyle   = 'rgba(60,30,80,0.85)';
    ctx.lineWidth   = 1.2 * DPR;

    // Lock body (rounded rectangle)
    const bw = size * 1.2;
    const bh = size;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh * 0.1, bw, bh, 2 * DPR);
    ctx.fill(); ctx.stroke();

    // Arch (shackle)
    ctx.beginPath();
    ctx.arc(0, -bh * 0.1, size * 0.45, Math.PI, 0);
    ctx.stroke();

    // Keyhole dot
    ctx.fillStyle = 'rgba(140,100,180,0.65)';
    ctx.beginPath();
    ctx.arc(0, bh * 0.3, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ─── Canvas-drawn checkmark (cleared node) ──────────────────────────────────

  _drawCheckmark(ctx, cx, cy, size, DPR) {
    ctx.save();
    ctx.translate(cx, cy);
    // Small green circle badge
    ctx.fillStyle   = 'rgba(0,180,80,0.95)';
    ctx.shadowBlur  = 6;
    ctx.shadowColor = '#00FF66';
    ctx.beginPath(); ctx.arc(0, 0, size * 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Tick mark
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1.5 * DPR;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(-size * 0.55, 0);
    ctx.lineTo(-size * 0.1,  size * 0.5);
    ctx.lineTo(size * 0.55,  -size * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  // ─── Hex path helper ────────────────────────────────────────────────────────

  _hexPath(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a  = (Math.PI / 3) * i - Math.PI / 6;
      const mx = cx + r * Math.cos(a);
      const my = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    }
    ctx.closePath();
  }

  // ─── Zone cleared check ──────────────────────────────────────────────────────

  _isZoneCleared(z) {
    let count = 0;
    for (let l = 0; l < 10; l++) if (this.save.isLevelComplete(z, l)) count++;
    return count >= 10;
  }

  // ─── Detail panel ───────────────────────────────────────────────────────────

  _renderDetailPanel(ctx, W, H, DPR) {
    const z      = this.selectedZone;
    const cat    = catOf(z);
    const [cr, cg, cb] = cat.rgb;
    const panX   = W * 0.722;
    const panW   = W * 0.265;
    const panY   = 44 * DPR;
    const panH   = H - 72 * DPR;
    const px     = panX;
    const cx     = panX + panW / 2;

    // Panel background
    ctx.fillStyle   = 'rgba(0,5,15,0.95)';
    ctx.strokeStyle = 'rgba(0,255,180,0.2)';
    ctx.lineWidth   = 1 * DPR;
    ctx.beginPath(); ctx.roundRect(panX, panY, panW, panH, 8 * DPR); ctx.fill(); ctx.stroke();

    // Left accent line (category color)
    ctx.fillStyle = cat.color;
    ctx.fillRect(panX, panY + 12 * DPR, 2 * DPR, panH - 24 * DPR);

    // Inner corner brackets
    this._drawCornerBrackets(ctx, panX + 4 * DPR, panY + 4 * DPR, panX + panW - 4 * DPR, panY + panH - 4 * DPR, DPR * 0.7);

    let y = panY + 18 * DPR;

    // ── ZONE header ──────────────────────────────────────────────────────────
    ctx.fillStyle    = cat.color;
    ctx.font         = `900 ${12 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur   = 14; ctx.shadowColor = cat.color;
    ctx.fillText(`ZONE ${z + 1}`, cx, y); y += 17 * DPR;
    ctx.shadowBlur   = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.font      = `900 ${10 * DPR}px 'JetBrains Mono',monospace`;
    ctx.fillText(ZONE_NAMES[z], cx, y); y += 16 * DPR;

    // Category badge (filled rounded pill)
    const badgeW = panW * 0.55;
    const badgeH = 14 * DPR;
    const badgeX = cx - badgeW / 2;
    ctx.fillStyle   = `rgba(${cr},${cg},${cb},0.18)`;
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.6)`;
    ctx.lineWidth   = 1 * DPR;
    ctx.beginPath(); ctx.roundRect(badgeX, y, badgeW, badgeH, 7 * DPR); ctx.fill(); ctx.stroke();
    ctx.fillStyle    = cat.color;
    ctx.font         = `700 ${7 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cat.name, cx, y + badgeH / 2);
    y += badgeH + 10 * DPR;

    // Unlock status
    const unlocked = this.save.isZoneUnlocked(z);
    ctx.fillStyle    = unlocked ? '#00FF66' : 'rgba(150,100,180,0.7)';
    ctx.font         = `${8 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textBaseline = 'top';
    if (unlocked) {
      ctx.fillText('[ UNLOCKED ]', cx, y);
    } else {
      // Draw small lock icon inline
      ctx.fillText('[ LOCKED ]', cx, y);
    }
    y += 16 * DPR;

    // ── Threat level bar ──────────────────────────────────────────────────────
    ctx.fillStyle    = 'rgba(200,180,220,0.55)';
    ctx.font         = `${7.5 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('THREAT LEVEL', px + 14 * DPR, y); y += 12 * DPR;

    const bx = px + 14 * DPR;
    const bw = panW - 28 * DPR;
    const threatPct = (z + 1) / 20;
    // Track bg
    ctx.fillStyle = 'rgba(30,10,50,0.8)';
    ctx.beginPath(); ctx.roundRect(bx, y, bw, 7 * DPR, 3.5 * DPR); ctx.fill();
    // Threat fill with category gradient
    if (threatPct > 0) {
      const grad = ctx.createLinearGradient(bx, y, bx + bw * threatPct, y);
      grad.addColorStop(0,   `rgba(${cr},${cg},${cb},0.5)`);
      grad.addColorStop(1,   `rgba(${cr},${cg},${cb},0.95)`);
      ctx.fillStyle  = grad;
      ctx.shadowBlur = 8; ctx.shadowColor = cat.color;
      ctx.beginPath(); ctx.roundRect(bx, y, bw * threatPct, 7 * DPR, 3.5 * DPR); ctx.fill();
      ctx.shadowBlur = 0;
    }
    y += 14 * DPR;

    // ── Level grid (2 rows × 5 cols) ─────────────────────────────────────────
    const lvlW = (panW - 28 * DPR) / 5 - 3 * DPR;
    const lvlH = 20 * DPR;
    for (let l = 0; l < 10; l++) {
      const col  = l % 5;
      const row  = Math.floor(l / 5);
      const lx   = px + 14 * DPR + col * (lvlW + 3 * DPR);
      const ly   = y + row * (lvlH + 4 * DPR);
      const done = this.save.isLevelComplete(z, l);

      ctx.fillStyle = !unlocked ? 'rgba(15,5,28,0.85)'
                    : done      ? `rgba(0,60,20,0.9)`
                    : 'rgba(20,8,42,0.85)';
      ctx.strokeStyle = done      ? '#00CC44'
                      : unlocked  ? `rgba(${cr},${cg},${cb},0.3)`
                      : 'rgba(60,40,80,0.25)';
      ctx.lineWidth = 1 * DPR;
      ctx.beginPath(); ctx.roundRect(lx, ly, lvlW, lvlH, 3 * DPR); ctx.fill(); ctx.stroke();

      ctx.fillStyle    = done ? '#00FF66' : (unlocked ? `rgba(${cr},${cg},${cb},0.8)` : 'rgba(80,60,100,0.6)');
      ctx.font         = `700 ${7 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`L${l + 1}`, lx + lvlW / 2, ly + lvlH / 2 - 2 * DPR);

      // Stars row
      if (done) {
        const stars = this.save.getLevelStars ? this.save.getLevelStars(z, l) : 1;
        ctx.fillStyle = '#FFD700';
        ctx.font      = `${5.5 * DPR}px 'JetBrains Mono',monospace`;
        // Draw star dots as tiny filled circles (no emoji)
        for (let s = 0; s < Math.min(stars || 1, 3); s++) {
          const sx = lx + lvlW / 2 + (s - 1) * 4 * DPR;
          const sy = ly + lvlH - 3.5 * DPR;
          ctx.beginPath(); ctx.arc(sx, sy, 1.4 * DPR, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    y += 2 * (lvlH + 4 * DPR) + 12 * DPR;

    // ── Progress bar (segmented, 10 segments like CPU load) ───────────────────
    let completed = 0;
    for (let l = 0; l < 10; l++) if (this.save.isLevelComplete(z, l)) completed++;
    ctx.fillStyle    = 'rgba(200,180,220,0.5)';
    ctx.font         = `${7 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('PROGRESS', px + 14 * DPR, y); y += 11 * DPR;

    const segTotalW = panW - 28 * DPR;
    const segW      = (segTotalW - 9 * DPR) / 10; // 9px gap total
    const segH      = 8 * DPR;
    for (let s = 0; s < 10; s++) {
      const sx = px + 14 * DPR + s * (segW + 1 * DPR);
      const filled = s < completed;
      ctx.fillStyle = filled
        ? `rgba(${cr},${cg},${cb},${0.65 + 0.35 * (s / 9)})`
        : 'rgba(30,10,50,0.7)';
      ctx.strokeStyle = filled
        ? `rgba(${cr},${cg},${cb},0.8)`
        : 'rgba(60,30,90,0.4)';
      ctx.lineWidth = 0.5 * DPR;
      ctx.beginPath(); ctx.roundRect(sx, y, segW, segH, 1.5 * DPR); ctx.fill(); ctx.stroke();
      if (filled) {
        ctx.fillStyle  = `rgba(${cr},${cg},${cb},0.4)`;
        ctx.shadowBlur = 4; ctx.shadowColor = cat.color;
        ctx.beginPath(); ctx.roundRect(sx, y, segW, segH, 1.5 * DPR); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    y += segH + 7 * DPR;

    ctx.fillStyle    = `rgba(${cr},${cg},${cb},0.7)`;
    ctx.font         = `${7.5 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${completed}/10 LEVELS`, cx, y); y += 14 * DPR;

    // ── Stats row ─────────────────────────────────────────────────────────────
    let totalStars = 0, bestStars = 0, completedCount = 0;
    for (let l = 0; l < 10; l++) {
      if (this.save.isLevelComplete(z, l)) {
        const s = this.save.getLevelStars ? this.save.getLevelStars(z, l) : 1;
        totalStars += s;
        if (s > bestStars) bestStars = s;
        completedCount++;
      }
    }
    const avgStars = completedCount > 0 ? (totalStars / completedCount).toFixed(1) : '0.0';
    ctx.fillStyle    = 'rgba(180,160,210,0.55)';
    ctx.font         = `${7 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.fillText(`AVG STARS: ${avgStars}  |  BEST: ${bestStars}`, cx, y); y += 14 * DPR;

    // ── Boss section ──────────────────────────────────────────────────────────
    // Red accent box
    const bossBoxH = 26 * DPR;
    const bossBoxX = px + 10 * DPR;
    const bossBoxW = panW - 20 * DPR;
    ctx.fillStyle   = 'rgba(180,20,20,0.15)';
    ctx.strokeStyle = 'rgba(255,40,40,0.6)';
    ctx.lineWidth   = 1 * DPR;
    ctx.beginPath(); ctx.roundRect(bossBoxX, y, bossBoxW, bossBoxH, 4 * DPR); ctx.fill(); ctx.stroke();
    // Left red accent
    ctx.fillStyle = '#FF2222';
    ctx.fillRect(bossBoxX, y + 4 * DPR, 2 * DPR, bossBoxH - 8 * DPR);
    // Lightning bolt lines (replacing emoji)
    ctx.save();
    ctx.translate(bossBoxX + 10 * DPR, y + bossBoxH / 2);
    ctx.strokeStyle = '#FF4422';
    ctx.lineWidth   = 1.5 * DPR;
    ctx.beginPath();
    ctx.moveTo(2 * DPR, -5 * DPR);
    ctx.lineTo(-2 * DPR, 0);
    ctx.lineTo(2 * DPR, 0);
    ctx.lineTo(-2 * DPR, 5 * DPR);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle    = '#FF4422';
    ctx.font         = `700 ${7.5 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS ENCOUNTER  LVL 10', cx + 4 * DPR, y + bossBoxH * 0.35);
    ctx.fillStyle = '#FF8888';
    ctx.font      = `${6.5 * DPR}px 'JetBrains Mono',monospace`;
    ctx.fillText(BOSS_NAMES[z], cx + 4 * DPR, y + bossBoxH * 0.72);
    y += bossBoxH + 10 * DPR;

    // ── DEPLOY button ─────────────────────────────────────────────────────────
    if (unlocked) {
      const btnH   = 34 * DPR;
      const btnX   = px + 12 * DPR;
      const btnW   = panW - 24 * DPR;
      const pulse  = 0.8 + 0.2 * Math.sin(this._t * 2.5);

      // Button glow bg
      ctx.fillStyle  = `rgba(${cr},${cg},${cb},${0.18 * pulse})`;
      ctx.shadowBlur = 20; ctx.shadowColor = cat.color;
      ctx.beginPath(); ctx.roundRect(btnX, y, btnW, btnH, 6 * DPR); ctx.fill();
      ctx.shadowBlur = 0;

      // Button fill
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.65 * pulse})`;
      ctx.beginPath(); ctx.roundRect(btnX, y, btnW, btnH, 6 * DPR); ctx.fill();

      // Top highlight streak
      ctx.fillStyle = `rgba(255,255,255,0.08)`;
      ctx.beginPath(); ctx.roundRect(btnX + 4 * DPR, y + 3 * DPR, btnW - 8 * DPR, 6 * DPR, 3 * DPR); ctx.fill();

      ctx.strokeStyle = cat.color;
      ctx.lineWidth   = 1.5 * DPR;
      ctx.shadowBlur  = 10; ctx.shadowColor = cat.color;
      ctx.beginPath(); ctx.roundRect(btnX, y, btnW, btnH, 6 * DPR); ctx.stroke();
      ctx.shadowBlur  = 0;

      // DEPLOY text
      ctx.fillStyle    = '#FFFFFF';
      ctx.font         = `900 ${12 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur   = 8; ctx.shadowColor = '#ffffff';
      ctx.fillText('DEPLOY', btnX + btnW / 2, y + btnH / 2);
      ctx.shadowBlur   = 0;

      // Store button rect in CSS pixels for click detection
      const DPR2 = Math.min(window.devicePixelRatio || 1, 2);
      this._playBtnRect = { x: btnX / DPR2, y: y / DPR2, w: btnW / DPR2, h: btnH / DPR2 };
    } else {
      this._playBtnRect = null;
    }
  }

  // ─── Title bar ──────────────────────────────────────────────────────────────

  _drawTitleBar(ctx, W, H, DPR, t) {
    const barH = 38 * DPR;

    // Bar background
    const barGrad = ctx.createLinearGradient(0, 0, 0, barH);
    barGrad.addColorStop(0, 'rgba(0,10,20,0.98)');
    barGrad.addColorStop(1, 'rgba(0,20,35,0.92)');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, W, barH);
    ctx.strokeStyle = 'rgba(0,255,180,0.25)';
    ctx.lineWidth   = 1 * DPR;
    ctx.beginPath(); ctx.moveTo(0, barH); ctx.lineTo(W, barH); ctx.stroke();

    const titleX = W / 2;
    const titleY = barH / 2;

    // Decorative circuit traces extending left/right from title
    const textHalfW = 110 * DPR;
    ctx.strokeStyle  = 'rgba(0,255,180,0.25)';
    ctx.lineWidth    = 1 * DPR;
    // Left trace
    ctx.beginPath();
    ctx.moveTo(titleX - textHalfW - 4 * DPR, titleY);
    ctx.lineTo(titleX - textHalfW - 30 * DPR, titleY);
    ctx.lineTo(titleX - textHalfW - 36 * DPR, titleY - 6 * DPR);
    ctx.lineTo(titleX - textHalfW - 80 * DPR, titleY - 6 * DPR);
    ctx.stroke();
    // Right trace
    ctx.beginPath();
    ctx.moveTo(titleX + textHalfW + 4 * DPR, titleY);
    ctx.lineTo(titleX + textHalfW + 30 * DPR, titleY);
    ctx.lineTo(titleX + textHalfW + 36 * DPR, titleY + 6 * DPR);
    ctx.lineTo(titleX + textHalfW + 80 * DPR, titleY + 6 * DPR);
    ctx.stroke();
    // Via pads on traces
    ctx.fillStyle = 'rgba(0,255,180,0.4)';
    for (const [dx, dy] of [
      [-textHalfW - 30 * DPR, 0],
      [textHalfW + 30 * DPR, 0],
    ]) {
      ctx.beginPath(); ctx.arc(titleX + dx, titleY + dy, 2.5 * DPR, 0, Math.PI * 2); ctx.fill();
    }

    // Glitch effect — briefly shift color on glitch tick
    const isGlitch = this._glitchActive;
    const titleColor = isGlitch ? '#00FFEE' : '#00FFB4';

    ctx.fillStyle    = titleColor;
    ctx.font         = `900 ${13 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur   = isGlitch ? 28 : 18;
    ctx.shadowColor  = titleColor;

    // Glitch horizontal shift artifact
    if (isGlitch) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle   = '#FF00AA';
      ctx.fillText('CAMPAIGN OPERATIONS', titleX + 3 * DPR, titleY);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    ctx.fillText('CAMPAIGN OPERATIONS', titleX, titleY);
    ctx.shadowBlur   = 0;
  }

  // ─── Controls hint bar ───────────────────────────────────────────────────────

  _drawControlsBar(ctx, W, H, DPR) {
    const barH   = 30 * DPR;
    const barY   = H - barH;

    // Bar bg
    ctx.fillStyle = 'rgba(0,2,8,0.88)';
    ctx.fillRect(0, barY, W, barH);
    ctx.strokeStyle = 'rgba(0,255,180,0.12)';
    ctx.lineWidth   = 1 * DPR;
    ctx.beginPath(); ctx.moveTo(0, barY); ctx.lineTo(W, barY); ctx.stroke();

    // Helper to draw a keycap
    const drawKey = (label, x, y) => {
      const kw  = (label.length > 1 ? 30 : 16) * DPR;
      const kh  = 16 * DPR;
      const kx  = x - kw / 2;
      const ky  = y - kh / 2;
      ctx.fillStyle   = 'rgba(0,255,180,0.08)';
      ctx.strokeStyle = 'rgba(0,255,180,0.4)';
      ctx.lineWidth   = 1 * DPR;
      ctx.beginPath(); ctx.roundRect(kx, ky, kw, kh, 3 * DPR); ctx.fill(); ctx.stroke();
      // Bottom shadow edge
      ctx.fillStyle = 'rgba(0,255,180,0.15)';
      ctx.fillRect(kx + 1 * DPR, ky + kh - 2 * DPR, kw - 2 * DPR, 2 * DPR);
      ctx.fillStyle    = 'rgba(0,255,180,0.85)';
      ctx.font         = `700 ${7 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y - DPR * 0.5);
      return kw;
    };

    const cy = barY + barH / 2;
    let x    = W * 0.12;
    const gap = 8 * DPR;

    // Draw key groups
    drawKey('←', x, cy); x += 10 * DPR + gap;
    drawKey('→', x, cy); x += 10 * DPR + gap;
    drawKey('↑', x, cy); x += 10 * DPR + gap;
    drawKey('↓', x, cy); x += 10 * DPR + gap + 6 * DPR;

    ctx.fillStyle    = 'rgba(180,180,220,0.5)';
    ctx.font         = `${7 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Navigate', x, cy); x += 68 * DPR;

    drawKey('ENTER', x + 20 * DPR, cy); x += 58 * DPR;
    ctx.fillText('Deploy', x + 8 * DPR, cy); x += 62 * DPR;

    drawKey('ESC', x + 14 * DPR, cy); x += 44 * DPR;
    ctx.fillText('Abort Mission', x + 8 * DPR, cy);
  }

  // ─── Input handlers ─────────────────────────────────────────────────────────

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
        this.gameScene?.game?.scenes?.replace(this.gameScene.game.menuScene);
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

    // Check DEPLOY button
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

  // ─── Launch selected zone ───────────────────────────────────────────────────

  _launchSelected() {
    const z = this.selectedZone;
    if (!this.save.isZoneUnlocked(z)) return;
    const waveNum = z * 10 + 1;

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
    this.gameScene.startCampaignLevel(waveNum);
  }
}
