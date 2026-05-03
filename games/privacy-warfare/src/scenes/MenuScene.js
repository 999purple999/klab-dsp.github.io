// ─── MenuScene ────────────────────────────────────────────────────────────────
// Renders an animated cyberpunk background on the game canvas,
// then shows the HTML overlay with panels on top.

import { openLoadout } from '../ui/LoadoutModal.js';

export class MenuScene {
  constructor(game) {
    this._game = game;
    this._cv   = game.cv;
    this._ctx  = game.ctx;

    // Parallax layers
    this._t      = 0;
    this._mouseX = 0;
    this._mouseY = 0;
    this._onMouseMove = e => { this._mouseX = e.clientX; this._mouseY = e.clientY; };

    // Particles (data rain on the bg)
    this._particles = [];
    this._initParticles();

    // Skyline buildings (far layer)
    this._buildings = [];
    this._initBuildings();

    // Bound handlers
    this._onSurvival   = () => this._startSurvival();
    this._onCampaign   = () => this._startCampaign();
    this._onMnSurvival = () => this._startSurvival();
    this._onMnCampaign = () => this._startCampaign();
  }

  enter() {
    document.getElementById('overlay').classList.remove('hidden');
    document.addEventListener('mousemove', this._onMouseMove);
    document.getElementById('mp-survival')?.addEventListener('click', this._onSurvival);
    document.getElementById('mp-campaign')?.addEventListener('click', this._onCampaign);
    document.getElementById('mn-survival')?.addEventListener('click', this._onMnSurvival);
    document.getElementById('mn-campaign')?.addEventListener('click', this._onMnCampaign);
    // legacy start-btn still triggers survival for any old references
    document.getElementById('start-btn')?.addEventListener('click', this._onSurvival);
  }

  exit() {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.getElementById('mp-survival')?.removeEventListener('click', this._onSurvival);
    document.getElementById('mp-campaign')?.removeEventListener('click', this._onCampaign);
    document.getElementById('mn-survival')?.removeEventListener('click', this._onMnSurvival);
    document.getElementById('mn-campaign')?.removeEventListener('click', this._onMnCampaign);
    document.getElementById('start-btn')?.removeEventListener('click', this._onSurvival);
  }

  update(dt) {
    this._t += dt;
    this._renderBg();
  }

  render() {}

  _startSurvival() {
    document.getElementById('overlay').classList.add('hidden');
    this._game.scenes.pop();
    openLoadout((wpnSlots, gadSlots) => {
      this._game.gameScene.setLoadout(wpnSlots, gadSlots);
      this._game.gameScene.startGame();
    });
  }

  _startCampaign() {
    document.getElementById('overlay').classList.add('hidden');
    this._game.scenes.replace(this._game.campaignScene);
  }

  _initParticles() {
    // Data rain: columns of falling characters
    const cols = Math.floor(window.innerWidth / 18);
    for (let i = 0; i < cols; i++) {
      this._particles.push({
        x: i * 18 + Math.random() * 18,
        y: Math.random() * window.innerHeight,
        speed: 40 + Math.random() * 80,
        char: this._randChar(),
        timer: 0,
        interval: 0.1 + Math.random() * 0.3,
        alpha: 0.05 + Math.random() * 0.18,
        trail: [],
      });
    }
  }

  _initBuildings() {
    // Skyline: random building shapes
    const count = 22;
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (let i = 0; i < count; i++) {
      const w = 30 + Math.random() * 90;
      this._buildings.push({
        x: (W / count) * i + Math.random() * 20,
        w,
        h: 80 + Math.random() * (H * 0.45),
        col: `rgba(${8 + Math.floor(Math.random()*12)},${4 + Math.floor(Math.random()*8)},${20 + Math.floor(Math.random()*20)},0.9)`,
        windows: Array.from({length: 20}, () => ({
          ox: Math.random() * w,
          oy: Math.random() * 200,
          on: Math.random() > 0.55,
          blink: Math.random() > 0.85,
          blinkT: Math.random() * 5,
        })),
      });
    }
  }

  _randChar() {
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ█▓▒░⌂⌀⊕⊗⊞⊠';
    return chars[Math.floor(Math.random() * chars.length)];
  }

  _renderBg() {
    const ctx = this._ctx;
    const cv  = this._cv;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const W   = cv.width;
    const H   = cv.height;
    const lW  = W / DPR;
    const lH  = H / DPR;
    const t   = this._t;
    const mx  = this._mouseX;
    const my  = this._mouseY;

    // Base fill (very dark, slight purple tint)
    ctx.fillStyle = '#030208';
    ctx.fillRect(0, 0, W, H);

    // ── LAYER 1: Skyline (far, slow parallax) ──
    const px1 = (mx / lW - 0.5) * 18 * DPR;
    const py1 = (my / lH - 0.5) * 8 * DPR;
    ctx.save();
    ctx.translate(px1, py1);

    // Horizon glow
    const horizY = lH * 0.72;
    const horizGrad = ctx.createLinearGradient(0, (horizY - 80) * DPR, 0, (horizY + 40) * DPR);
    horizGrad.addColorStop(0, 'rgba(191,0,255,0)');
    horizGrad.addColorStop(0.5, 'rgba(191,0,255,0.06)');
    horizGrad.addColorStop(1, 'rgba(191,0,255,0.02)');
    ctx.fillStyle = horizGrad;
    ctx.fillRect(0, (horizY - 80) * DPR, W, 120 * DPR);

    // Buildings
    for (const b of this._buildings) {
      const bx = b.x * DPR;
      const by = (lH - b.h) * DPR;
      const bw = b.w * DPR;
      const bh = b.h * DPR;

      ctx.fillStyle = b.col;
      ctx.fillRect(bx, by, bw, bh);

      // Windows
      for (const w of b.windows) {
        if (w.oy > b.h - 10) continue;
        const isOn = w.blink ? (Math.sin(t * 1.2 + w.blinkT) > 0) : w.on;
        if (!isOn) continue;
        ctx.fillStyle = Math.random() > 0.98
          ? 'rgba(255,150,0,0.7)'
          : 'rgba(191,0,255,0.55)';
        ctx.fillRect(bx + w.ox * DPR, by + w.oy * DPR, 3 * DPR, 2.5 * DPR);
      }
    }

    // Ground line
    ctx.strokeStyle = 'rgba(191,0,255,0.25)';
    ctx.lineWidth   = 1 * DPR;
    ctx.beginPath();
    ctx.moveTo(0, lH * DPR * 0.72);
    ctx.lineTo(W, lH * DPR * 0.72);
    ctx.stroke();
    ctx.restore();

    // ── LAYER 2: Mid — server/cable silhouettes ──
    const px2 = (mx / lW - 0.5) * 38 * DPR;
    const py2 = (my / lH - 0.5) * 16 * DPR;
    ctx.save();
    ctx.translate(px2, py2);
    // Draw 3-4 server rack silhouettes
    const racks = [0.12, 0.32, 0.65, 0.82];
    for (const rx of racks) {
      const sx = rx * lW * DPR;
      const sy = (lH * 0.45) * DPR;
      const sw = 22 * DPR;
      const sh = (lH * 0.32) * DPR;
      ctx.fillStyle = 'rgba(14,6,30,0.9)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = 'rgba(0,255,200,0.12)';
      ctx.lineWidth   = 1 * DPR;
      ctx.strokeRect(sx, sy, sw, sh);
      // Server unit lines
      for (let u = 0; u < 6; u++) {
        const uy = sy + u * (sh / 6);
        const isActive = Math.sin(t * 0.8 + rx * 5 + u) > 0.3;
        ctx.fillStyle = isActive ? 'rgba(0,255,65,0.4)' : 'rgba(100,50,150,0.2)';
        ctx.fillRect(sx + 3 * DPR, uy + 2 * DPR, 6 * DPR, (sh / 6 - 6) * DPR);
      }
    }
    // Horizontal cable lines
    for (let i = 0; i < 6; i++) {
      const ly = (lH * 0.5 + i * 28) * DPR;
      const alpha = 0.04 + 0.03 * Math.sin(t * 0.5 + i);
      ctx.strokeStyle = `rgba(0,255,200,${alpha})`;
      ctx.lineWidth   = 1 * DPR;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(W, ly);
      ctx.stroke();
    }
    ctx.restore();

    // ── LAYER 3: Data rain with head-glow (near, fast parallax) ──
    const px3 = (mx / lW - 0.5) * 60 * DPR;
    ctx.save();
    ctx.translate(px3, 0);
    const fSz = 11 * DPR;
    ctx.font = `${fSz}px 'JetBrains Mono',monospace`;
    for (const p of this._particles) {
      p.timer += 0.016;
      if (p.timer >= p.interval) {
        p.timer = 0;
        p.char  = this._randChar();
        p.y    += p.speed * p.interval;
        if (p.y > lH + 20) p.y = -20;
        // Push trail char
        if (!p.trail) p.trail = [];
        p.trail.push({ char: p.char, y: p.y, alpha: p.alpha });
        if (p.trail.length > 6) p.trail.shift();
      }
      // Render trail
      if (p.trail) {
        for (let ti = 0; ti < p.trail.length; ti++) {
          const tr = p.trail[ti];
          const fade = (ti / p.trail.length) * p.alpha * 0.7;
          ctx.globalAlpha = fade;
          ctx.fillStyle   = '#BF00FF';
          ctx.fillText(tr.char, p.x * DPR, tr.y * DPR);
        }
      }
      // Head char — brightest, with glow
      ctx.shadowBlur  = 12;
      ctx.shadowColor = p.y < lH * 0.4 ? '#00FFFF' : '#BF00FF';
      ctx.globalAlpha = Math.min(1, p.alpha * 2.8);
      ctx.fillStyle   = p.y < lH * 0.4 ? '#FFFFFF' : '#DF88FF';
      ctx.fillText(p.char, p.x * DPR, p.y * DPR);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Scan line sweep ──
    const scanY = ((t * 0.18) % 1) * H;
    const scanG = ctx.createLinearGradient(0, scanY - 40 * DPR, 0, scanY + 40 * DPR);
    scanG.addColorStop(0,   'rgba(191,0,255,0)');
    scanG.addColorStop(0.5, 'rgba(191,0,255,0.04)');
    scanG.addColorStop(1,   'rgba(191,0,255,0)');
    ctx.fillStyle = scanG;
    ctx.fillRect(0, scanY - 40 * DPR, W, 80 * DPR);

    // ── Top glow bar ──
    const barGrad = ctx.createLinearGradient(0, 0, W, 0);
    barGrad.addColorStop(0, 'rgba(191,0,255,0)');
    barGrad.addColorStop(0.5, 'rgba(191,0,255,0.55)');
    barGrad.addColorStop(1, 'rgba(191,0,255,0)');
    ctx.fillStyle = barGrad;
    ctx.fillRect(W * 0.15, 0, W * 0.7, 2 * DPR);

    // ── Vignette ──
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
}
