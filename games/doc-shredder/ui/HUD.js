export class HUD {
  constructor(container) {
    this.container = container;
    this._progressBar = null;
    this._progressText = null;
    this._timerEl = null;
    this._methodBadge = null;
    this._completeBanner = null;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="hud-top">
        <div class="hud-method-badge" id="method-badge">SHRED</div>
        <div class="hud-timer" id="hud-timer">0.0s</div>
      </div>
      <div class="hud-progress-wrap">
        <div class="hud-progress-bar" id="hud-progress-bar">
          <div class="hud-progress-fill" id="hud-progress-fill"></div>
        </div>
        <span class="hud-progress-text" id="hud-progress-text">0%</span>
      </div>
      <div class="hud-complete hidden" id="hud-complete">
        <div class="complete-title">DATA DESTROYED</div>
        <div class="complete-sub" id="complete-sub"></div>
        <a class="complete-link" href="https://999purple999.github.io/klab-dsp.github.io/" target="_blank">Try K-Perception →</a>
      </div>
      <div class="hud-toast hidden" id="hud-toast"></div>
    `;
    this._progressFill = document.getElementById('hud-progress-fill');
    this._progressText = document.getElementById('hud-progress-text');
    this._timerEl = document.getElementById('hud-timer');
    this._methodBadge = document.getElementById('method-badge');
    this._completeBanner = document.getElementById('hud-complete');
    this._toast = document.getElementById('hud-toast');
  }

  setMethod(method) {
    if (this._methodBadge) {
      this._methodBadge.textContent = method;
      this._methodBadge.className = `hud-method-badge method-${method.toLowerCase()}`;
    }
  }

  updateProgress(pct) {
    const p = Math.round(pct * 100);
    if (this._progressFill) this._progressFill.style.width = p + '%';
    if (this._progressText) this._progressText.textContent = p + '%';
  }

  updateTimer(ms) {
    if (this._timerEl) this._timerEl.textContent = (ms / 1000).toFixed(1) + 's';
  }

  showComplete(elapsedMs, onPlayAgain) {
    if (this._completeBanner) {
      this._completeBanner.classList.remove('hidden');
      const sub = document.getElementById('complete-sub');
      if (sub) sub.textContent = `Completed in ${(elapsedMs / 1000).toFixed(1)}s`;
      // Add play again button if not already there
      if (!document.getElementById('complete-again-btn')) {
        const btn = document.createElement('button');
        btn.id = 'complete-again-btn';
        btn.className = 'menu-btn';
        btn.style.cssText = 'font-size:13px;padding:10px 30px;pointer-events:auto';
        btn.textContent = 'Play Again';
        btn.addEventListener('click', () => {
          btn.remove();
          if (onPlayAgain) onPlayAgain();
        });
        this._completeBanner.appendChild(btn);
      }
    }
  }

  hideComplete() {
    if (this._completeBanner) this._completeBanner.classList.add('hidden');
  }

  showToast(def) {
    if (!this._toast) return;
    this._toast.classList.remove('hidden');
    this._toast.innerHTML = `<strong>Achievement!</strong> ${def.label}<small>${def.desc}</small>`;
    this._toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast.classList.remove('show');
      setTimeout(() => this._toast.classList.add('hidden'), 400);
    }, 2500);
  }
}
