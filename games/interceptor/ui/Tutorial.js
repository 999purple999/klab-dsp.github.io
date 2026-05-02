import { Storage } from '../data/Storage.js';

const STEPS = [
  {
    text: 'Tap the data packets!',
    sub: 'Stop them before they reach the firewall',
    highlight: 'right',
  },
  {
    text: "Don't let them reach the firewall!",
    sub: 'Each breach costs you 1 shield HP',
    highlight: 'left',
  },
  {
    text: 'Collect power-ups for bonuses!',
    sub: 'SLOW, FREEZE, or EXPLODE all enemies',
    highlight: 'center',
  },
];

export class Tutorial {
  constructor(container) {
    this._container = container;
    this._step = 0;
    this._el = null;
    this._onDone = null;
    this._pointerAngle = 0;
  }

  shouldShow() {
    return !Storage.get('tutorial_seen', false);
  }

  show(onDone) {
    this._onDone = onDone;
    this._step = 0;
    this._build();
    this._renderStep();
    this._animFrame = requestAnimationFrame(this._animate.bind(this));
  }

  _animate() {
    this._pointerAngle += 0.04;
    const ptr = this._el && this._el.querySelector('#tut-pointer');
    if (ptr) {
      const ox = Math.sin(this._pointerAngle) * 8;
      const oy = Math.cos(this._pointerAngle * 0.7) * 8;
      ptr.style.transform = `translate(${ox}px, ${oy}px)`;
    }
    this._animFrame = requestAnimationFrame(this._animate.bind(this));
  }

  _build() {
    const existing = this._container.querySelector('#tutorial-overlay');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'tutorial-overlay';
    el.style.cssText = `
      position:fixed; inset:0; z-index:50;
      background:rgba(5,5,8,0.88);
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      font-family:'JetBrains Mono','Courier New',monospace;
      cursor:pointer;
    `;

    el.innerHTML = `
      <div id="tut-pointer" style="
        font-size:48px; margin-bottom:24px;
        filter:drop-shadow(0 0 12px #BF00FF);
        transition:transform 0.05s;
      ">👆</div>
      <div id="tut-text" style="
        font-size:clamp(18px,4vw,32px); font-weight:800;
        color:#BF00FF; text-shadow:0 0 30px #BF00FF;
        text-align:center; letter-spacing:.06em;
        margin-bottom:12px; padding:0 24px;
      "></div>
      <div id="tut-sub" style="
        font-size:clamp(12px,2vw,16px); color:rgba(255,255,255,0.6);
        text-align:center; letter-spacing:.05em; padding:0 24px;
        margin-bottom:32px;
      "></div>
      <div id="tut-dots" style="display:flex;gap:8px;margin-bottom:24px;"></div>
      <div style="
        font-size:clamp(10px,1.8vw,13px); color:rgba(255,255,255,0.35);
        letter-spacing:.12em; text-transform:uppercase;
      ">Tap anywhere to continue</div>
    `;

    el.addEventListener('click', () => this._next());
    el.addEventListener('touchstart', (e) => { e.preventDefault(); this._next(); }, { passive: false });

    this._container.appendChild(el);
    this._el = el;
  }

  _renderStep() {
    if (!this._el) return;
    const step = STEPS[this._step];
    this._el.querySelector('#tut-text').textContent = step.text;
    this._el.querySelector('#tut-sub').textContent = step.sub;

    // Dots
    const dotsEl = this._el.querySelector('#tut-dots');
    dotsEl.innerHTML = STEPS.map((_, i) => `
      <div style="
        width:8px; height:8px; border-radius:50%;
        background:${i === this._step ? '#BF00FF' : 'rgba(255,255,255,0.2)'};
        box-shadow:${i === this._step ? '0 0 8px #BF00FF' : 'none'};
      "></div>
    `).join('');
  }

  _next() {
    this._step++;
    if (this._step >= STEPS.length) {
      this._done();
      return;
    }
    this._renderStep();
  }

  _done() {
    Storage.set('tutorial_seen', true);
    cancelAnimationFrame(this._animFrame);
    if (this._el) {
      this._el.style.transition = 'opacity 0.3s';
      this._el.style.opacity = '0';
      setTimeout(() => {
        if (this._el) {
          this._el.remove();
          this._el = null;
        }
        if (this._onDone) this._onDone();
      }, 320);
    } else {
      if (this._onDone) this._onDone();
    }
  }

  destroy() {
    cancelAnimationFrame(this._animFrame);
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }
}
