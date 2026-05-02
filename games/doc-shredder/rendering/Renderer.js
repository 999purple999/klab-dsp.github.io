import { clamp, rand } from '../utils/math.js';

const DOC_W = 300, DOC_H = 400;

const CODE_LINES = [
  '// CONFIDENTIAL — user_data.json',
  '{',
  '  "user_id":     "u_8f3a9c2d1b47ee52",',
  '  "email":       "alice@corporation.com",',
  '  "password":    "S3cur3P@$$word!99",',
  '  "credit_card": "4532-1234-5678-9012",',
  '  "cvv": "847",  "expiry": "11/28",',
  '  "ssn":         "078-05-1120",',
  '  "api_key":     "sk-live-abc123xQRstuVWXyz",',
  '  "session_tok": "eyJhbGciOiJIUzI1NiJ9...",',
  '  "location":    {"lat": 48.8566, "lng": 2.3522},',
  '  "health": {',
  '    "diagnosis":  "type-2-diabetes",',
  '    "meds":       ["metformin","insulin"],',
  '    "insurance":  "Aetna-8834992",',
  '  },',
  '  "slack_token": "xoxb-123456-supersecret",',
  '  "github_pat":  "ghp_xxxxxxxxxxxxxxxx",',
  '  "stripe_key":  "sk_live_zzzzzzzzzzzzzz",',
  '  "ssh_key":     "-----BEGIN RSA PRIVATE KEY-----",',
  '  "db_pass":     "Pr0d-DB-P@$$w0rd!2024",',
  '  "face_data":   "<binary blob: 45 KB>",',
  '  "biometrics":  "<binary blob: 128 KB>"',
  '}',
];

const HOT_WORDS = ['email','password','credit_card','cvv','ssn','api_key','session','diagnosis','insurance','slack','github','stripe','ssh_key','db_pass','face_data','biometrics'];

const STRIP_COUNT = 200;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0; this.H = 0; this.dpr = 1;

    // Off-screen document canvas
    this.offDoc = null;
    this.offBg = null;
    this.offKPerception = null;

    // SHRED state
    this.strips = [];
    this._initStrips();

    // BURN state
    this.burnMask = null; // Float32Array, 1 = burned
    this.burnW = DOC_W;
    this.burnH = DOC_H;

    // DISSOLVE state
    this.dissolveMask = null;

    // IMPLODE state
    this.implodePixels = []; // [{x,y,vx,vy,col,alpha}]
    this.implodeDone = false;
    this.implodeExploded = false;

    // Shake
    this.shakeX = 0; this.shakeY = 0;
    this.shakeDuration = 0;
    this.shakeMag = 5;
    this._shakeTriggered = false;

    this.method = 'SHRED';
  }

  resize(W, H, dpr) {
    this.W = W; this.H = H; this.dpr = dpr;
    this._buildOffscreens();
  }

  setMethod(method) {
    this.method = method;
    this._resetMethod();
  }

  _resetMethod() {
    this._initStrips();
    if (this.burnMask) this.burnMask.fill(0);
    if (this.dissolveMask) this.dissolveMask.fill(0);
    this.implodePixels = [];
    this.implodeDone = false;
    this.implodeExploded = false;
    this._shakeTriggered = false;
    this.shakeDuration = 0;
  }

  _initStrips() {
    this.strips = [];
    for (let i = 0; i < STRIP_COUNT; i++) {
      this.strips.push({
        index: i,
        cut: false,
        dx: 0, dy: 0,
        vx: 0, vy: 0,
        ay: 0.3,
        angle: 0, av: 0,
        alpha: 1,
      });
    }
  }

  _buildOffscreens() {
    const dpr = this.dpr;
    const W = this.W, H = this.H;

    // Offscreen document
    const oc = document.createElement('canvas');
    oc.width = DOC_W * dpr;
    oc.height = DOC_H * dpr;
    const dc = oc.getContext('2d');
    dc.scale(dpr, dpr);
    this._drawDocumentContent(dc, DOC_W, DOC_H);
    this.offDoc = oc;

    // Burn mask: size matches document
    this.burnMask = new Float32Array(DOC_W * DOC_H);
    this.dissolveMask = new Float32Array(DOC_W * DOC_H);

    // Reusable mask canvas (avoid per-frame allocation)
    this._maskCanvas = document.createElement('canvas');
    this._maskCanvas.width = DOC_W;
    this._maskCanvas.height = DOC_H;
    this._maskCtx = this._maskCanvas.getContext('2d');

    // K-Perception background reveal
    const kb = document.createElement('canvas');
    kb.width = W; kb.height = H;
    const kc = kb.getContext('2d');
    this._drawKPerception(kc, W, H, dpr);
    this.offKPerception = kb;

    // Background
    const bg = document.createElement('canvas');
    bg.width = W; bg.height = H;
    const bc = bg.getContext('2d');
    const grad = bc.createRadialGradient(W/2, H*0.44, 0, W/2, H*0.44, Math.max(W,H)*0.68);
    grad.addColorStop(0, '#1e0040');
    grad.addColorStop(1, '#05060d');
    bc.fillStyle = grad; bc.fillRect(0,0,W,H);
    bc.strokeStyle = 'rgba(168,85,247,0.07)'; bc.lineWidth = 1;
    for (let x=0; x<W; x+=44*dpr) { bc.beginPath(); bc.moveTo(x,0); bc.lineTo(x,H); bc.stroke(); }
    for (let y=0; y<H; y+=44*dpr) { bc.beginPath(); bc.moveTo(0,y); bc.lineTo(W,y); bc.stroke(); }
    this.offBg = bg;
  }

  _drawDocumentContent(dc, w, h) {
    // Background
    dc.fillStyle = '#0d1117';
    dc.fillRect(0, 0, w, h);
    // Title bar
    dc.fillStyle = '#161b22';
    dc.fillRect(0, 0, w, 28);
    // Traffic lights
    [{x:10,c:'#FF5F57'},{x:22,c:'#FFBD2E'},{x:34,c:'#28CA41'}].forEach(({x,c}) => {
      dc.fillStyle = c; dc.beginPath(); dc.arc(x, 14, 4, 0, Math.PI*2); dc.fill();
    });
    // Tab
    dc.fillStyle = '#0d1117';
    dc.fillRect(46, 4, 110, 20);
    dc.fillStyle = '#8b949e'; dc.font = '9px monospace'; dc.textBaseline = 'middle'; dc.textAlign = 'left';
    dc.fillText('user_data.json', 52, 14);
    // Red dot
    dc.fillStyle = '#FF4444'; dc.beginPath(); dc.arc(150, 14, 3, 0, Math.PI*2); dc.fill();

    // CONFIDENTIAL watermark
    dc.save();
    dc.translate(w/2, h/2); dc.rotate(-Math.PI*0.22);
    dc.font = `800 ${Math.min(w*0.09,24)}px Inter,sans-serif`;
    dc.textAlign = 'center'; dc.textBaseline = 'middle';
    dc.fillStyle = 'rgba(255,34,34,0.09)';
    dc.fillText('CONFIDENTIAL', 0, 0);
    dc.restore();

    // Code lines
    const lineH = Math.max(14, (h - 32) / CODE_LINES.length);
    const fs = Math.min(9, lineH * 0.6);
    CODE_LINES.forEach((line, i) => {
      const y = 30 + i * lineH;
      // Line number
      dc.fillStyle = '#3d444d'; dc.font = `${fs}px monospace`;
      dc.textAlign = 'right'; dc.fillText(String(i+1), 26, y + lineH*0.5);
      // Highlight hot lines
      const isHot = HOT_WORDS.some(s => line.toLowerCase().includes(s));
      if (isHot) {
        dc.fillStyle = 'rgba(255,68,68,0.10)';
        dc.fillRect(30, y, w - 30, lineH);
      }
      let col = isHot ? '#FF5555' : line.startsWith('//') ? '#8b949e' : line.includes('"') ? '#79c0ff' : '#e6edf3';
      dc.fillStyle = col; dc.textAlign = 'left'; dc.font = `${fs}px monospace`;
      dc.fillText(line, 32, y + lineH * 0.5);
    });
  }

  _drawKPerception(kc, W, H, dpr) {
    const orb = kc.createRadialGradient(W/2, H*0.44, 0, W/2, H*0.44, W*0.4);
    orb.addColorStop(0, 'rgba(168,85,247,0.32)');
    orb.addColorStop(1, 'rgba(168,85,247,0)');
    kc.fillStyle = orb; kc.fillRect(0, 0, W, H);

    const fs = Math.min(W*0.095, 72*dpr);
    kc.font = `800 ${fs}px Inter,system-ui,sans-serif`;
    kc.textAlign = 'center'; kc.textBaseline = 'middle';
    kc.shadowBlur = 80*dpr; kc.shadowColor = '#a855f7';
    kc.fillStyle = '#a855f7';
    kc.fillText('K-PERCEPTION', W/2, H*0.37);
    kc.shadowBlur = 26*dpr;
    kc.font = `700 ${fs*0.28}px Inter,system-ui,sans-serif`;
    kc.fillStyle = 'rgba(255,255,255,0.9)';
    kc.fillText('YOUR DATA. YOUR DEVICE. YOUR RULES.', W/2, H*0.51);
    kc.shadowBlur = 0;
    kc.font = `500 ${fs*0.19}px "JetBrains Mono",monospace`;
    kc.fillStyle = 'rgba(57,255,20,0.85)';
    kc.fillText('End-to-End Encrypted  ·  100% Local  ·  Zero Cloud', W/2, H*0.59);
    kc.font = `400 ${fs*0.155}px "JetBrains Mono",monospace`;
    kc.fillStyle = 'rgba(168,85,247,0.55)';
    kc.fillText('DOCUMENT DESTROYED. DATA PROTECTED.', W/2, H*0.67);
  }

  // Compute document rect (centered, scaled to fit)
  _docRect() {
    const W = this.W / this.dpr, H = this.H / this.dpr;
    const scale = Math.min(W * 0.7 / DOC_W, (H * 0.72) / DOC_H, 1.8);
    const dw = DOC_W * scale, dh = DOC_H * scale;
    const dx = (W - dw) / 2, dy = (H - dh) / 2 - H * 0.05;
    return { dx, dy, dw, dh, scale };
  }

  // Apply shake
  _applyShake(ctx) {
    if (this.shakeDuration > 0) {
      const mag = this.shakeMag * (this.shakeDuration / 30);
      this.shakeX = rand(-mag, mag);
      this.shakeY = rand(-mag, mag);
      this.shakeDuration--;
    } else {
      this.shakeX = 0; this.shakeY = 0;
    }
    ctx.translate(this.shakeX * this.dpr, this.shakeY * this.dpr);
  }

  triggerShake() {
    this.shakeDuration = 30;
  }

  // --- SHRED interaction ---
  sliceLine(x1, y1, x2, y2) {
    const { dx, dy, dw, dh } = this._docRect();
    const stripH = dh / STRIP_COUNT;
    for (let i = 0; i < STRIP_COUNT; i++) {
      const stripY = dy + i * stripH;
      if (this.strips[i].cut) continue;
      // Check if line passes through this strip's y range
      const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
      if (maxY >= stripY && minY <= stripY + stripH &&
          maxX >= dx && minX <= dx + dw) {
        const dir = (i % 2 === 0) ? -1 : 1;
        const goUp = (i % 7 === 3);
        this.strips[i].cut = true;
        this.strips[i].vx = dir * (rand(4, 9));
        this.strips[i].vy = goUp ? -rand(0.5, 1.5) : rand(0.05, 0.15);
        this.strips[i].ay = goUp ? -0.04 : rand(0.015, 0.025);
        this.strips[i].av = rand(-0.02, 0.02);
      }
    }
  }

  getShredProgress() {
    const cut = this.strips.filter(s => s.cut).length;
    return cut / STRIP_COUNT;
  }

  updateStrips() {
    for (const s of this.strips) {
      if (!s.cut) continue;
      s.dx += s.vx;
      s.dy += s.vy;
      s.vy += s.ay;
      s.angle += s.av;
      s.alpha = Math.max(0, 1 - Math.abs(s.dx) / (this.W / this.dpr * 0.42));
    }
  }

  drawShred(ctx) {
    if (!this.offDoc) return;
    const { dx, dy, dw, dh } = this._docRect();
    const dpr = this.dpr;
    const stripH = DOC_H / STRIP_COUNT;

    for (let i = 0; i < STRIP_COUNT; i++) {
      const s = this.strips[i];
      if (s.cut && s.alpha <= 0) continue;

      const destY = (dy + i * (dh / STRIP_COUNT)) * dpr;
      const destH = (dh / STRIP_COUNT) * dpr;
      const srcY = i * stripH * dpr;
      const srcH = stripH * dpr;

      if (!s.cut) {
        ctx.drawImage(this.offDoc, 0, srcY, DOC_W * dpr, srcH, dx * dpr, destY, dw * dpr, destH);
      } else {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate((dx + s.dx) * dpr, (dy + i * (dh / STRIP_COUNT) + s.dy) * dpr);
        ctx.rotate(s.angle);
        ctx.drawImage(this.offDoc, 0, srcY, DOC_W * dpr, srcH, 0, 0, dw * dpr, destH);
        ctx.restore();
      }
    }
  }

  // --- BURN interaction ---
  applyBurn(docX, docY, radius) {
    const r = Math.ceil(radius);
    const bx = Math.floor(docX), by = Math.floor(docY);
    for (let y = by - r; y <= by + r; y++) {
      for (let x = bx - r; x <= bx + r; x++) {
        if (x < 0 || x >= DOC_W || y < 0 || y >= DOC_H) continue;
        const d = Math.hypot(x - bx, y - by);
        if (d <= radius) {
          const idx = y * DOC_W + x;
          this.burnMask[idx] = Math.min(1, this.burnMask[idx] + (1 - d / radius) * 0.15);
        }
      }
    }
  }

  getBurnProgress() {
    let burned = 0;
    for (let i = 0; i < this.burnMask.length; i++) if (this.burnMask[i] >= 0.8) burned++;
    return burned / this.burnMask.length;
  }

  drawBurn(ctx) {
    if (!this.offDoc) return;
    const { dx, dy, dw, dh } = this._docRect();
    const dpr = this.dpr;
    ctx.drawImage(this.offDoc, dx * dpr, dy * dpr, dw * dpr, dh * dpr);

    // Draw burn overlay using cached offscreen canvas
    const bc = this._maskCanvas;
    const bctx = this._maskCtx;
    const img = bctx.createImageData(DOC_W, DOC_H);
    for (let i = 0; i < DOC_W * DOC_H; i++) {
      const v = this.burnMask[i];
      const idx = i * 4;
      if (v > 0.8) {
        img.data[idx] = 0; img.data[idx+1] = 0; img.data[idx+2] = 0; img.data[idx+3] = 255;
      } else if (v > 0.4) {
        const t = (v - 0.4) / 0.4;
        img.data[idx] = Math.floor(lerp(255, 0, t));
        img.data[idx+1] = Math.floor(lerp(100, 0, t));
        img.data[idx+2] = 0;
        img.data[idx+3] = Math.floor(200 * v);
      } else if (v > 0) {
        const t = v / 0.4;
        img.data[idx] = 255;
        img.data[idx+1] = Math.floor(lerp(200, 100, t));
        img.data[idx+2] = 0;
        img.data[idx+3] = Math.floor(180 * t);
      }
    }
    bctx.putImageData(img, 0, 0);
    ctx.drawImage(bc, dx * dpr, dy * dpr, dw * dpr, dh * dpr);
  }

  // --- DISSOLVE interaction ---
  applyDissolve(docX, docY, radius) {
    const r = Math.ceil(radius);
    const bx = Math.floor(docX), by = Math.floor(docY);
    for (let y = by - r; y <= by + r; y++) {
      for (let x = bx - r; x <= bx + r; x++) {
        if (x < 0 || x >= DOC_W || y < 0 || y >= DOC_H) continue;
        const d = Math.hypot(x - bx, y - by);
        if (d <= radius) {
          const idx = y * DOC_W + x;
          this.dissolveMask[idx] = Math.min(1, this.dissolveMask[idx] + (1 - d / radius) * 0.12);
        }
      }
    }
  }

  getDissolveProgress() {
    let dissolved = 0;
    for (let i = 0; i < this.dissolveMask.length; i++) if (this.dissolveMask[i] >= 0.8) dissolved++;
    return dissolved / this.dissolveMask.length;
  }

  drawDissolve(ctx) {
    if (!this.offDoc) return;
    const { dx, dy, dw, dh } = this._docRect();
    const dpr = this.dpr;
    ctx.drawImage(this.offDoc, dx * dpr, dy * dpr, dw * dpr, dh * dpr);

    const dc = this._maskCanvas;
    const dctx = this._maskCtx;
    const img = dctx.createImageData(DOC_W, DOC_H);
    for (let i = 0; i < DOC_W * DOC_H; i++) {
      const v = this.dissolveMask[i];
      const idx = i * 4;
      if (v > 0.8) {
        img.data[idx] = 0; img.data[idx+1] = 0; img.data[idx+2] = 0; img.data[idx+3] = 255;
      } else if (v > 0) {
        const t = v / 0.8;
        img.data[idx] = 0;
        img.data[idx+1] = Math.floor(lerp(80, 255, t));
        img.data[idx+2] = 0;
        img.data[idx+3] = Math.floor(200 * t);
      }
    }
    dctx.putImageData(img, 0, 0);
    ctx.drawImage(dc, dx * dpr, dy * dpr, dw * dpr, dh * dpr);
  }

  // --- IMPLODE interaction ---
  triggerImplode() {
    if (this.implodeDone) return;
    this.implodeDone = true;
    const { dx, dy, dw, dh } = this._docRect();
    const cx = dx + dw / 2, cy = dy + dh / 2;
    const dpr = this.dpr;

    // Sample pixels from doc and give them velocity toward center
    const sampleStep = 6;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = DOC_W; tempCanvas.height = DOC_H;
    const tctx = tempCanvas.getContext('2d');
    tctx.drawImage(this.offDoc, 0, 0, DOC_W, DOC_H);
    const idata = tctx.getImageData(0, 0, DOC_W, DOC_H);

    for (let y = 0; y < DOC_H; y += sampleStep) {
      for (let x = 0; x < DOC_W; x += sampleStep) {
        const idx = (y * DOC_W + x) * 4;
        const r = idata.data[idx], g = idata.data[idx+1], b = idata.data[idx+2];
        const px = dx + (x / DOC_W) * dw;
        const py = dy + (y / DOC_H) * dh;
        const dirX = cx - px, dirY = cy - py;
        const d = Math.hypot(dirX, dirY) + 0.01;
        const speed = rand(2, 8);
        this.implodePixels.push({
          x: px, y: py,
          vx: (dirX / d) * speed,
          vy: (dirY / d) * speed,
          col: `rgb(${r},${g},${b})`,
          alpha: 1,
          phase: 'implode',
          cx, cy,
        });
      }
    }
  }

  updateImplode() {
    if (this.implodePixels.length === 0) return;
    let allAtCenter = true;
    const cx = this.implodePixels[0].cx;
    const cy = this.implodePixels[0].cy;

    for (const p of this.implodePixels) {
      if (p.phase === 'implode') {
        p.x += p.vx;
        p.y += p.vy;
        const d = Math.hypot(p.x - p.cx, p.y - p.cy);
        if (d > 5) allAtCenter = false;
      } else if (p.phase === 'explode') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.alpha -= 0.018;
      }
    }

    if (allAtCenter && !this.implodeExploded && this.implodePixels.length > 0) {
      this.implodeExploded = true;
      this.triggerShake();
      for (const p of this.implodePixels) {
        p.phase = 'explode';
        const angle = rand(0, Math.PI * 2);
        const speed = rand(3, 12);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      }
    }

    // Clean up faded
    for (let i = this.implodePixels.length - 1; i >= 0; i--) {
      if (this.implodePixels[i].alpha <= 0) this.implodePixels.splice(i, 1);
    }
  }

  getImplodeProgress() {
    if (!this.implodeDone) return 0;
    if (this.implodePixels.length === 0) return 1;
    if (!this.implodeExploded) return 0.1; // imploding in progress
    // Progress based on how many explode pixels have faded
    const total = this.implodePixels.length;
    const faded = this.implodePixels.filter(p => p.alpha < 0.3).length;
    return Math.min(1, 0.1 + 0.9 * (faded / Math.max(1, total)));
  }

  drawImplode(ctx) {
    if (!this.offDoc || !this.implodeDone) {
      // Draw full doc
      if (this.offDoc) {
        const { dx, dy, dw, dh } = this._docRect();
        ctx.drawImage(this.offDoc, dx * this.dpr, dy * this.dpr, dw * this.dpr, dh * this.dpr);
      }
      return;
    }
    const dpr = this.dpr;
    for (const p of this.implodePixels) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.col;
      ctx.fillRect(p.x * dpr, p.y * dpr, 3 * dpr, 3 * dpr);
    }
    ctx.globalAlpha = 1;
  }

  drawBackground(ctx) {
    if (this.offBg) ctx.drawImage(this.offBg, 0, 0);
  }

  drawKPerception(ctx, alpha = 1) {
    if (!this.offKPerception) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.offKPerception, 0, 0);
    ctx.globalAlpha = 1;
  }

  drawWatermark(ctx) {
    const { W, H, dpr } = this;
    ctx.globalAlpha = 0.32;
    ctx.font = `600 ${12*dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('K-PERCEPTION', W - 16*dpr, H - 16*dpr);
    ctx.globalAlpha = 1;
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }
