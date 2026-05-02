// ─── BootScene ────────────────────────────────────────────────────────────────
// Dramatic data rain + glitch logo boot screen.
// Fills a progress bar over ~2.2s then transitions to game.menuScene.

export class BootScene {
  constructor(game) {
    this._game = game;
    this._t = 0;
    this._progress = 0;
    this._duration = 2.2;
    this._done = false;
    this._flashOut = 0; // 0..1 for white flash at end
    this._glitchTimer = 0;
    this._glitchActive = false;
    this._cursorVis = true;
    this._cursorTimer = 0;
    this._lineProgress = 0;
    this._lines = [
      'PRIVACY WARFARE OS v4.0',
      'Initializing threat matrix…',
      'Loading weapon profiles…',
      'Calibrating enemy AI…',
      'Establishing secure channel…',
      'SYSTEM READY ✓',
    ];
    // Rain columns — initialized in enter() to use current canvas size
    this._cols = [];
  }

  enter() {
    this._t = this._progress = this._glitchTimer = this._cursorTimer = 0;
    this._done = this._glitchActive = false;
    this._cursorVis = true;
    this._lineProgress = 0;
    this._flashOut = 0;
    this._initRain();
  }

  _initRain() {
    this._cols = [];
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const lW  = this._game.cv.width / DPR;
    const lH  = this._game.cv.height / DPR;
    const chars = '01アイウエオカキクケコサシスセソ█▓▒░⊕⊗';
    const colW  = 18;
    for (let x = 0; x < lW; x += colW) {
      this._cols.push({
        x,
        y: -Math.random() * lH,
        speed: 60 + Math.random() * 80,
        char: chars[Math.floor(Math.random() * chars.length)],
        charTimer: 0,
        charInterval: 0.08 + Math.random() * 0.12,
        trail: Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]),
        alpha: 0.1 + Math.random() * 0.35,
      });
    }
  }

  update(dt) {
    if (this._done) return;
    this._t += dt;
    this._progress = Math.min(1, this._t / this._duration);

    // Cursor blink
    this._cursorTimer += dt;
    if (this._cursorTimer >= 0.4) { this._cursorTimer = 0; this._cursorVis = !this._cursorVis; }

    // Boot line progress
    this._lineProgress = Math.floor(this._progress * (this._lines.length + 1));

    // Glitch
    this._glitchTimer += dt;
    if (this._glitchTimer >= 0.6) {
      this._glitchTimer = 0;
      this._glitchActive = true;
      setTimeout(() => { this._glitchActive = false; }, 60);
    }

    // Update rain columns
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const lH  = this._game.cv.height / DPR;
    const chars = '01アイウエオカキクケコサシスセソ█▓▒░⊕⊗';
    for (const c of this._cols) {
      c.y += c.speed * dt;
      c.charTimer += dt;
      if (c.charTimer >= c.charInterval) {
        c.charTimer = 0;
        c.char = chars[Math.floor(Math.random() * chars.length)];
        c.trail.pop(); c.trail.unshift(c.char);
      }
      if (c.y > lH + 20) c.y = -Math.random() * lH * 0.5;
    }

    this._render();

    if (this._progress >= 1 && !this._done) {
      this._done = true;
      // White flash then transition
      let flashT = 0;
      const flashFn = () => {
        flashT += 0.016;
        this._flashOut = Math.max(0, 0.8 - flashT * 4);
        this._render();
        if (flashT < 0.35) requestAnimationFrame(flashFn);
        else this._game.scenes.replace(this._game.menuScene);
      };
      requestAnimationFrame(flashFn);
    }
  }

  _render() {
    const cv  = this._game.cv;
    const ctx = this._game.ctx;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const W   = cv.width;
    const H   = cv.height;
    const lW  = W / DPR;
    const lH  = H / DPR;

    // Background
    ctx.fillStyle = '#010106';
    ctx.fillRect(0, 0, W, H);

    // Data rain
    ctx.font = `${11 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textBaseline = 'top';
    for (const col of this._cols) {
      const cx = col.x * DPR;
      // Lead character
      ctx.globalAlpha = col.alpha * 1.8;
      ctx.fillStyle   = '#FFFFFF';
      ctx.fillText(col.char, cx, col.y * DPR);
      // Trail
      for (let i = 0; i < col.trail.length; i++) {
        const ty   = col.y - (i + 1) * 15;
        const fade = 1 - i / col.trail.length;
        const hue  = i < 3 ? '#00FFCC' : '#BF00FF';
        ctx.globalAlpha = col.alpha * fade * 0.8;
        ctx.fillStyle   = hue;
        ctx.fillText(col.trail[i], cx, ty * DPR);
      }
    }
    ctx.globalAlpha = 1;

    // Center logo with glitch
    const logoY  = lH * 0.30;
    const pulse  = 0.85 + 0.15 * Math.sin(this._t * 1.5);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `900 ${clampFont(lW, 22, 36) * DPR}px 'JetBrains Mono',monospace`;

    if (this._glitchActive) {
      ctx.globalAlpha = pulse * 0.85;
      ctx.fillStyle   = '#FF0055';
      ctx.fillText('PRIVACY WARFARE', (W / 2) - 3 * DPR, logoY * DPR);
      ctx.fillStyle   = '#00FFFF';
      ctx.fillText('PRIVACY WARFARE', (W / 2) + 3 * DPR, logoY * DPR);
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = '#FFFFFF';
    ctx.shadowBlur  = 30;
    ctx.shadowColor = '#BF00FF';
    ctx.fillText('PRIVACY WARFARE', W / 2, logoY * DPR);
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;

    // Subtitle
    ctx.font      = `${9 * DPR}px 'JetBrains Mono',monospace`;
    ctx.fillStyle = 'rgba(191,0,255,0.65)';
    ctx.fillText('DEFEND YOUR DATA — ELIMINATE ALL THREATS', W / 2, (logoY + 28) * DPR);

    // Boot lines
    const startX   = lW * 0.08;
    const startY   = lH * 0.50;
    const lineH    = 18;
    const visLines = Math.min(this._lineProgress, this._lines.length);
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.font         = `${10 * DPR}px 'JetBrains Mono',monospace`;
    for (let i = 0; i < visLines; i++) {
      const isLast = i === visLines - 1 && i < this._lines.length - 1;
      const col    = i === this._lines.length - 1 ? '#00FF66' : (i === 0 ? '#BF00FF' : 'rgba(150,190,220,0.9)');
      ctx.fillStyle   = col;
      ctx.shadowBlur  = i === this._lines.length - 1 ? 12 : 0;
      ctx.shadowColor = '#00FF66';
      const txt = this._lines[i] + (isLast && this._cursorVis ? '▌' : '');
      ctx.fillText('> ' + txt, startX * DPR, (startY + i * lineH) * DPR);
    }
    ctx.shadowBlur = 0;

    // Progress bar
    const barW = lW * 0.6;
    const barH = 8;
    const barX = (lW - barW) / 2;
    const barY = lH * 0.82;
    ctx.fillStyle = 'rgba(60,20,100,0.5)';
    ctx.beginPath(); ctx.roundRect(barX * DPR, barY * DPR, barW * DPR, barH * DPR, 4 * DPR); ctx.fill();
    const grad = ctx.createLinearGradient(barX * DPR, 0, (barX + barW) * DPR, 0);
    grad.addColorStop(0, '#4400AA'); grad.addColorStop(0.5, '#BF00FF'); grad.addColorStop(1, '#00FFCC');
    ctx.fillStyle  = grad;
    ctx.shadowBlur = 18; ctx.shadowColor = '#BF00FF';
    ctx.beginPath(); ctx.roundRect(barX * DPR, barY * DPR, barW * this._progress * DPR, barH * DPR, 4 * DPR); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle    = 'rgba(200,180,220,0.7)';
    ctx.font         = `${8 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(Math.floor(this._progress * 100) + '%', W / 2, (barY + barH + 5) * DPR);

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += 4 * DPR) ctx.fillRect(0, y, W, 2 * DPR);

    // White flash overlay
    if (this._flashOut > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this._flashOut})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }
}

function clampFont(lW, min, max) { return Math.min(max, Math.max(min, lW * 0.03)); }
