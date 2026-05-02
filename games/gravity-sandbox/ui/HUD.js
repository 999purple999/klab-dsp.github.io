import { EventBus } from '../utils/EventBus.js';

export class HUD {
  constructor(container) {
    this.container = container;
    this._build();
    EventBus.on('achievement', (def) => this.showToast(def));
  }

  _build() {
    // Stats panel (top-left)
    this.statsEl = document.createElement('div');
    this.statsEl.className = 'hud-stats';
    this.statsEl.innerHTML = `
      <span id="hud-collisions">Collisions: 0</span>
      <span id="hud-zerog">Zero-G: 0</span>
      <span id="hud-boxes">Boxes: 0</span>
    `;
    this.container.appendChild(this.statsEl);

    // Mode badge
    this.badgeEl = document.createElement('div');
    this.badgeEl.className = 'hud-badge hidden';
    this.container.appendChild(this.badgeEl);

    // Toast
    this.toastEl = document.createElement('div');
    this.toastEl.className = 'hud-toast hidden';
    this.container.appendChild(this.toastEl);

    // Fullscreen btn
    this.fsBtn = document.createElement('button');
    this.fsBtn.className = 'hud-btn hud-fs-btn';
    this.fsBtn.title = 'Fullscreen';
    this.fsBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>`;
    this.fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
    this.container.appendChild(this.fsBtn);
  }

  update(stats) {
    document.getElementById('hud-collisions').textContent = `Collisions: ${stats.collisions}`;
    document.getElementById('hud-zerog').textContent = `Zero-G: ${stats.zeroGCount}`;
    document.getElementById('hud-boxes').textContent = `Boxes: ${stats.boxCount}`;
  }

  setMode(mode) {
    if (mode === 'SANDBOX') {
      this.badgeEl.classList.add('hidden');
    } else {
      this.badgeEl.classList.remove('hidden');
      this.badgeEl.textContent = mode;
      this.badgeEl.className = `hud-badge hud-badge-${mode.toLowerCase()}`;
    }
  }

  showToast(def) {
    this.toastEl.classList.remove('hidden');
    this.toastEl.innerHTML = `<strong>Achievement Unlocked!</strong><br>${def.label}<small>${def.desc}</small>`;
    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
      setTimeout(() => this.toastEl.classList.add('hidden'), 400);
    }, 2500);
  }
}
