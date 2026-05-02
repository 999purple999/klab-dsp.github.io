// ─── BootScene ────────────────────────────────────────────────────────────────
// Short loading screen: "BOOTING…" text + progress bar that fills over 1.5s.
// Calls game.scenes.replace(game.campaignScene) when done.

export class BootScene {
  constructor(game) {
    this._game     = game;
    this._progress = 0;       // 0 → 1
    this._duration = 1.5;     // seconds
    this._elapsed  = 0;
    this._done     = false;

    // Blinking cursor state
    this._cursorTimer = 0;
    this._cursorVis   = true;

    // Boot lines that appear progressively
    this._lines = [
      'PRIVACY WARFARE OS v2.0',
      'Initializing threat matrix…',
      'Loading weapon profiles…',
      'Calibrating enemy AI…',
      'Establishing secure channel…',
      'SYSTEM READY',
    ];
    this._lineProgress = 0;
  }

  enter() {
    this._progress      = 0;
    this._elapsed       = 0;
    this._done          = false;
    this._lineProgress  = 0;
    this._cursorTimer   = 0;
    this._cursorVis     = true;
  }

  update(dt) {
    if (this._done) return;

    this._elapsed  += dt;
    this._progress  = Math.min(1, this._elapsed / this._duration);

    // Cursor blink
    this._cursorTimer += dt;
    if (this._cursorTimer >= 0.4) {
      this._cursorTimer = 0;
      this._cursorVis   = !this._cursorVis;
    }

    // Reveal boot lines progressively
    this._lineProgress = Math.floor(this._progress * (this._lines.length + 1));

    this._render();

    // Transition when complete
    if (this._progress >= 1) {
      this._done = true;
      // Brief delay then transition
      setTimeout(() => {
        if (this._game.campaignScene) {
          this._game.scenes.replace(this._game.campaignScene);
        }
      }, 300);
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
    ctx.fillStyle = '#020206';
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < H; y += 4 * DPR) {
      ctx.fillRect(0, y, W, 2 * DPR);
    }

    // Boot text block
    const startY  = lH * 0.22;
    const lineH   = 20;
    const visLines = Math.min(this._lineProgress, this._lines.length);

    ctx.font         = `${11 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < visLines; i++) {
      const isLast = i === visLines - 1 && i < this._lines.length - 1;
      const col    = i === this._lines.length - 1 ? '#00FF66' : (i === 0 ? '#BF00FF' : '#88AACC');
      ctx.fillStyle   = col;
      ctx.shadowBlur  = i === 0 || i === this._lines.length - 1 ? 14 : 0;
      ctx.shadowColor = col;

      const txt = this._lines[i] + (isLast && this._cursorVis ? '_' : '');
      ctx.fillText('> ' + txt, lW * 0.1 * DPR, (startY + i * lineH) * DPR);
    }
    ctx.shadowBlur = 0;

    // "BOOTING…" header
    const pulse = 0.7 + 0.3 * Math.sin(this._elapsed * 3);
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = '#BF00FF';
    ctx.font        = `900 ${24 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur  = 30;
    ctx.shadowColor = '#BF00FF';
    ctx.fillText('BOOTING…', W / 2, lH * 0.12 * DPR);
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;

    // Progress bar
    const barW   = lW * 0.6;
    const barH   = 8;
    const barX   = (lW - barW) / 2;
    const barY   = lH * 0.78;

    // Background track
    ctx.fillStyle = 'rgba(80,40,120,0.4)';
    ctx.beginPath();
    ctx.roundRect(barX * DPR, barY * DPR, barW * DPR, barH * DPR, 4 * DPR);
    ctx.fill();

    // Fill
    const fillW = barW * this._progress;
    const grad  = ctx.createLinearGradient(barX * DPR, 0, (barX + barW) * DPR, 0);
    grad.addColorStop(0, '#4400AA');
    grad.addColorStop(0.5, '#BF00FF');
    grad.addColorStop(1, '#00FFCC');
    ctx.fillStyle   = grad;
    ctx.shadowBlur  = 16;
    ctx.shadowColor = '#BF00FF';
    ctx.beginPath();
    ctx.roundRect(barX * DPR, barY * DPR, fillW * DPR, barH * DPR, 4 * DPR);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Progress percentage
    ctx.fillStyle    = '#aaa';
    ctx.font         = `${9 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      Math.floor(this._progress * 100) + '%',
      W / 2,
      (barY + barH + 6) * DPR
    );

    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
}
