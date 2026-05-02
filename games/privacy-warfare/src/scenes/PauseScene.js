// ─── PauseScene ───────────────────────────────────────────────────────────────
// Pause overlay rendered on top of game canvas.
// Semi-transparent black backdrop + "PAUSED" + Resume / Quit buttons.
// P key resumes; Enter/Space activates focused button.

export class PauseScene {
  /**
   * @param {HTMLCanvasElement} cv
   * @param {CanvasRenderingContext2D} ctx
   * @param {Function} onResume
   * @param {Function} onQuit
   */
  constructor(cv, ctx, onResume, onQuit) {
    this.cv       = cv;
    this.ctx      = ctx;
    this.onResume = onResume || (() => {});
    this.onQuit   = onQuit   || (() => {});

    // Button state
    this._buttons = [
      { label: 'RESUME',   action: () => this.onResume() },
      { label: 'QUIT',     action: () => this.onQuit()   },
    ];
    this._focused = 0;    // 0 = Resume, 1 = Quit

    this._keyBound    = (e) => this._handleKey(e);
    this._clickBound  = (e) => this._handleClick(e);

    // Animation
    this._t    = 0;
    this._fade = 0;  // 0→1 entrance fade
  }

  enter() {
    this._focused = 0;
    this._t       = 0;
    this._fade    = 0;
    document.addEventListener('keydown', this._keyBound);
    this.cv.addEventListener('click',    this._clickBound);
  }

  exit() {
    document.removeEventListener('keydown', this._keyBound);
    this.cv.removeEventListener('click',    this._clickBound);
  }

  update(dt) {
    this._t    += dt;
    this._fade  = Math.min(1, this._fade + dt * 6);
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const W   = this.cv.width;
    const H   = this.cv.height;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const lW  = W / DPR;
    const lH  = H / DPR;

    // Semi-transparent dark overlay
    ctx.fillStyle = `rgba(0,0,0,${0.75 * this._fade})`;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(191,0,255,0.06)';
    ctx.lineWidth   = 1;
    const gs = 40 * DPR;
    for (let x = 0; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const cx = W / 2;
    const cy = H / 2;

    // Panel background
    const panelW = 260 * DPR;
    const panelH = 180 * DPR;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;

    ctx.save();
    ctx.globalAlpha = this._fade;

    ctx.fillStyle = 'rgba(5,2,18,0.92)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12 * DPR);
    ctx.fill();

    ctx.strokeStyle = 'rgba(191,0,255,0.5)';
    ctx.lineWidth   = 1.5 * DPR;
    ctx.shadowBlur  = 20;
    ctx.shadowColor = '#BF00FF';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12 * DPR);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // "PAUSED" title
    const pulse = 0.85 + 0.15 * Math.sin(this._t * 3);
    ctx.fillStyle   = `rgba(191,0,255,${pulse})`;
    ctx.font        = `900 ${22 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur  = 25;
    ctx.shadowColor = '#BF00FF';
    ctx.fillText('PAUSED', cx, panelY + 38 * DPR);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle    = 'rgba(180,160,200,0.7)';
    ctx.font         = `${8 * DPR}px 'JetBrains Mono',monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText('SYSTEM SUSPENDED', cx, panelY + 62 * DPR);

    // Buttons
    const btnW = 160 * DPR;
    const btnH = 28 * DPR;
    const btnX = cx - btnW / 2;
    const btnSpacing = 36 * DPR;
    const btn0Y = panelY + 86 * DPR;

    this._buttons.forEach((btn, i) => {
      const bx = btnX;
      const by = btn0Y + i * btnSpacing;
      const focused = i === this._focused;

      // Save button rect for click detection (in canvas px)
      btn._rect = { x: bx, y: by, w: btnW, h: btnH };

      // Background
      ctx.fillStyle = focused
        ? 'rgba(191,0,255,0.28)'
        : 'rgba(30,10,60,0.6)';
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 5 * DPR);
      ctx.fill();

      // Border
      ctx.strokeStyle = focused ? '#BF00FF' : 'rgba(120,80,160,0.5)';
      ctx.lineWidth   = focused ? 1.8 * DPR : 1 * DPR;
      if (focused) { ctx.shadowBlur = 14; ctx.shadowColor = '#BF00FF'; }
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 5 * DPR);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle    = focused ? '#FFFFFF' : '#AAAACC';
      ctx.font         = `900 ${10 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, cx, by + btnH / 2);

      // Shortcut hint
      const hint = i === 0 ? '[P / ENTER]' : '[Q]';
      ctx.fillStyle    = 'rgba(150,120,180,0.6)';
      ctx.font         = `${6 * DPR}px 'JetBrains Mono',monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText(hint, cx, by + btnH - 6 * DPR);
    });

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _handleKey(e) {
    switch (e.key.toLowerCase()) {
      case 'p':
      case 'escape':
        e.preventDefault();
        this.onResume();
        break;
      case 'arrowup':
      case 'w':
        e.preventDefault();
        this._focused = (this._focused - 1 + this._buttons.length) % this._buttons.length;
        break;
      case 'arrowdown':
      case 's':
        e.preventDefault();
        this._focused = (this._focused + 1) % this._buttons.length;
        break;
      case 'enter':
      case ' ':
        e.preventDefault();
        this._buttons[this._focused].action();
        break;
      case 'q':
        e.preventDefault();
        this.onQuit();
        break;
      default:
        break;
    }
  }

  _handleClick(e) {
    const rect  = this.cv.getBoundingClientRect();
    const DPR   = Math.min(window.devicePixelRatio || 1, 2);
    const clickX = (e.clientX - rect.left) * DPR;
    const clickY = (e.clientY - rect.top)  * DPR;

    for (let i = 0; i < this._buttons.length; i++) {
      const btn = this._buttons[i];
      if (!btn._rect) continue;
      const { x, y, w, h } = btn._rect;
      if (clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h) {
        this._focused = i;
        btn.action();
        return;
      }
    }
  }
}
