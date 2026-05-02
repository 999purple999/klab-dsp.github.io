export class HUD {
  constructor(container) {
    this._container = container;
    this._el = null;
    this._terminalLines = [];
    this._powerupEl = null;
    this._build();
  }

  _build() {
    // Remove any existing HUD
    const existing = this._container.querySelector('#hud-overlay');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'hud-overlay';
    el.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none; z-index: 10;
      font-family: 'JetBrains Mono','Courier New',monospace;
    `;

    el.innerHTML = `
      <div id="hud-top" style="
        position:absolute; top:0; left:0; right:0; height:58px;
        display:flex; align-items:center; justify-content:space-between;
        padding:0 14px;
        background:linear-gradient(180deg,rgba(0,0,0,0.92),transparent);
      ">
        <div class="hud-block">
          <div style="font-size:clamp(7px,1.4vw,10px);letter-spacing:.16em;text-transform:uppercase;opacity:.5;margin-bottom:1px;color:#BF00FF">SCORE</div>
          <div id="hud-score" style="font-size:clamp(17px,3.5vw,28px);font-weight:800;color:#BF00FF;text-shadow:0 0 18px #BF00FF;letter-spacing:.04em">0</div>
        </div>
        <div class="hud-block">
          <div style="font-size:clamp(7px,1.4vw,10px);letter-spacing:.16em;text-transform:uppercase;opacity:.5;margin-bottom:1px;color:#FF8C00">STREAK</div>
          <div id="hud-streak" style="font-size:clamp(17px,3.5vw,28px);font-weight:800;color:#FF8C00;text-shadow:0 0 14px #FF8C00;letter-spacing:.04em">×1</div>
        </div>
        <div id="hud-lives" style="display:flex;gap:7px;align-items:center;"></div>
        <div class="hud-block">
          <div style="font-size:clamp(7px,1.4vw,10px);letter-spacing:.16em;text-transform:uppercase;opacity:.5;margin-bottom:1px;color:#00FF41">WAVE</div>
          <div id="hud-wave" style="font-size:clamp(17px,3.5vw,28px);font-weight:800;color:#00FF41;text-shadow:0 0 14px #00FF41;letter-spacing:.04em">—</div>
        </div>
        <div class="hud-block">
          <div style="font-size:clamp(7px,1.4vw,10px);letter-spacing:.16em;text-transform:uppercase;opacity:.5;margin-bottom:1px;color:#FFFFFF">DATA</div>
          <div id="hud-data" style="font-size:clamp(11px,2.2vw,18px);font-weight:700;color:#FFFFFF;letter-spacing:.04em">0.0 MB</div>
        </div>
      </div>

      <div id="hud-speedbar" style="
        position:absolute; top:58px; left:0; right:0; height:3px;
        background:rgba(255,255,255,0.06);
      ">
        <div id="hud-speedfill" style="height:100%;width:0%;background:linear-gradient(90deg,#FF8C00,#FF2222);transition:width .15s;"></div>
      </div>

      <div id="hud-powerup" style="
        position:absolute; top:70px; right:14px;
        display:none;
        background:rgba(0,0,0,0.7);
        border:1px solid #BF00FF;
        border-radius:8px;
        padding:6px 12px;
        color:#FFFFFF;
        font-size:12px;
        letter-spacing:.08em;
      ">
        <span id="hud-pu-name">SLOW</span>
        <div id="hud-pu-bar-wrap" style="height:3px;background:rgba(255,255,255,0.15);border-radius:2px;margin-top:4px;min-width:80px;">
          <div id="hud-pu-bar" style="height:100%;width:100%;background:#3388FF;border-radius:2px;transition:width .1s;"></div>
        </div>
      </div>

      <div id="hud-terminal" style="
        position:absolute; bottom:16px; right:16px;
        width:clamp(200px, 30vw, 320px);
        font-size:clamp(9px,1.5vw,11px);
        color:rgba(0,255,65,0.75);
        background:rgba(0,0,0,0.6);
        border:1px solid rgba(0,255,65,0.2);
        border-radius:6px;
        padding:8px 10px;
        letter-spacing:.06em;
        line-height:1.5;
        pointer-events:none;
      "></div>
    `;

    this._container.appendChild(el);
    this._el = el;
    this._scoreEl = el.querySelector('#hud-score');
    this._streakEl = el.querySelector('#hud-streak');
    this._waveEl = el.querySelector('#hud-wave');
    this._livesEl = el.querySelector('#hud-lives');
    this._dataEl = el.querySelector('#hud-data');
    this._terminalEl = el.querySelector('#hud-terminal');
    this._speedFill = el.querySelector('#hud-speedfill');
    this._powerupEl = el.querySelector('#hud-powerup');
    this._puName = el.querySelector('#hud-pu-name');
    this._puBar = el.querySelector('#hud-pu-bar');

    this._updateLives(3, 3);
  }

  show() {
    if (this._el) this._el.style.display = 'block';
  }

  hide() {
    if (this._el) this._el.style.display = 'none';
  }

  _updateLives(hp, maxHp) {
    if (!this._livesEl) return;
    let html = '';
    for (let i = 0; i < maxHp; i++) {
      const active = i < hp;
      html += `<span style="
        font-size:clamp(18px,3.2vw,24px);
        color:${active ? '#00FF41' : 'rgba(255,255,255,0.15)'};
        text-shadow:${active ? '0 0 10px #00FF41' : 'none'};
        transition:all .3s;
      ">🛡</span>`;
    }
    this._livesEl.innerHTML = html;
  }

  update(state) {
    if (!this._el) return;
    const { score, streak, wave, hp, maxHp, dataIntercepted, speedMult, activePowerUp } = state;

    if (this._scoreEl) this._scoreEl.textContent = score.toLocaleString();
    if (this._streakEl) this._streakEl.textContent = `×${streak}`;
    if (this._waveEl) this._waveEl.textContent = wave || '—';
    if (this._dataEl) this._dataEl.textContent = `${(dataIntercepted || 0).toFixed(1)} MB`;
    this._updateLives(hp, maxHp || 3);

    // Speed bar
    if (this._speedFill) {
      const pct = Math.min(100, ((speedMult - 1.0) / 1.0) * 100);
      this._speedFill.style.width = pct + '%';
      if (pct < 30) this._speedFill.style.background = 'linear-gradient(90deg,#FF8C00,#FF5500)';
      else if (pct < 65) this._speedFill.style.background = 'linear-gradient(90deg,#FF5500,#FF2222)';
      else this._speedFill.style.background = 'linear-gradient(90deg,#FF2222,#FF0066)';
    }

    // Active power-up
    if (activePowerUp && activePowerUp.active && this._powerupEl) {
      this._powerupEl.style.display = 'block';
      const colors = { SLOW: '#3388FF', FREEZE: '#88CCFF', EXPLODE: '#FF4400' };
      const col = colors[activePowerUp.type] || '#BF00FF';
      if (this._puName) {
        this._puName.textContent = activePowerUp.type;
        this._puName.style.color = col;
      }
      if (this._puBar) {
        const pct = (activePowerUp.remaining / activePowerUp.duration) * 100;
        this._puBar.style.width = pct + '%';
        this._puBar.style.background = col;
      }
    } else if (this._powerupEl) {
      this._powerupEl.style.display = 'none';
    }
  }

  log(message) {
    this._terminalLines.push('> ' + message);
    if (this._terminalLines.length > 5) this._terminalLines.shift();
    if (this._terminalEl) {
      this._terminalEl.innerHTML = this._terminalLines
        .map(l => `<div>${l}</div>`)
        .join('');
    }
  }

  destroy() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }
}
