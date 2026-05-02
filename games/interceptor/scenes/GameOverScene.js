import { bus } from '../utils/EventBus.js';

export class GameOverScene {
  constructor(container, achievements, upgradeTree) {
    this._container = container;
    this._achievements = achievements;
    this._upgradeTree = upgradeTree;
    this._el = null;
    this._onRetry = null;
    this._onMenu = null;
  }

  show({ score, wave, accuracy, streak, difficulty }, onRetry, onMenu) {
    this._onRetry = onRetry;
    this._onMenu = onMenu;

    const existing = document.getElementById('gameover-scene');
    if (existing) existing.remove();

    // XP earned (simplified: 1 xp per 100 points)
    const xp = Math.floor(score / 100);

    // New achievements to display
    const allAchievements = this._achievements.getAll();
    const newUnlocked = allAchievements.filter(a => a.unlocked);

    const el = document.createElement('div');
    el.id = 'gameover-scene';
    el.style.cssText = `
      position:fixed; inset:0; z-index:35;
      background:rgba(5,5,8,0.96);
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      font-family:'JetBrains Mono','Courier New',monospace;
      overflow-y:auto;
    `;

    el.innerHTML = `
      <div style="max-width:440px;width:100%;padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div style="
          font-size:clamp(26px,7vw,52px); font-weight:800;
          color:#FF2222; letter-spacing:.06em; text-align:center;
          text-shadow:0 0 50px #FF2222, 0 0 100px rgba(255,34,34,.4);
          line-height:1.1;
        ">BREACH<br>COMPLETE</div>

        <div style="color:rgba(255,255,255,.4);font-size:clamp(11px,2vw,14px);letter-spacing:.07em;text-align:center;">
          All firewall layers compromised.<br>Your data has been exfiltrated.
        </div>

        <div style="
          background:rgba(0,0,0,0.5); border:1px solid rgba(255,34,34,0.2);
          border-radius:10px; padding:16px 24px; width:100%; box-sizing:border-box;
        ">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${_statRow('SCORE', score.toLocaleString(), '#BF00FF')}
            ${_statRow('WAVE', wave, '#00FF41')}
            ${_statRow('ACCURACY', accuracy + '%', '#FF8C00')}
            ${_statRow('BEST STREAK', '×' + streak, '#FF8C00')}
            ${_statRow('XP EARNED', '+' + xp, '#BF00FF')}
            ${_statRow('DIFFICULTY', difficulty || 'NORMAL', '#FFFFFF')}
          </div>
        </div>

        ${newUnlocked.length > 0 ? `
          <div style="width:100%;box-sizing:border-box;">
            <div style="color:rgba(255,255,255,.4);font-size:10px;letter-spacing:.12em;margin-bottom:8px;text-transform:uppercase;">Achievements</div>
            ${newUnlocked.slice(-3).map(a => `
              <div style="
                display:flex;align-items:center;gap:10px;
                border:1px solid rgba(191,0,255,0.3);border-radius:8px;
                padding:8px 12px; margin-bottom:6px;
                background:rgba(191,0,255,0.08);
              ">
                <span style="font-size:18px;">🏆</span>
                <div>
                  <div style="color:#BF00FF;font-weight:700;font-size:12px;">${a.title}</div>
                  <div style="color:rgba(255,255,255,.4);font-size:10px;">${a.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="display:flex;gap:12px;margin-top:4px;">
          <button id="go-retry" style="
            padding:13px 36px; color:#fff; font-weight:800;
            font-size:clamp(13px,2.5vw,17px); letter-spacing:.12em;
            text-transform:uppercase; border:none; cursor:pointer;
            border-radius:10px; transition:all .15s;
            font-family:'JetBrains Mono',monospace;
            background:linear-gradient(135deg,#FF2222,#aa0000);
            box-shadow:0 0 40px rgba(255,34,34,.5);
          ">TRY AGAIN</button>
          <button id="go-menu" style="
            padding:13px 28px; color:#BF00FF; font-weight:700;
            font-size:clamp(11px,2vw,14px); letter-spacing:.12em;
            text-transform:uppercase;
            border:1px solid rgba(191,0,255,.5); cursor:pointer;
            border-radius:10px; transition:all .15s;
            font-family:'JetBrains Mono',monospace;
            background:rgba(191,0,255,0.1);
          ">MENU</button>
        </div>

        <a href="https://999purple999.github.io/klab-dsp.github.io/" target="_blank" style="
          padding:9px 22px;
          background:linear-gradient(135deg,#BF00FF,#7c3aed);
          color:#fff; font-weight:700;
          font-size:clamp(10px,1.8vw,12px); letter-spacing:.12em;
          text-transform:uppercase; text-decoration:none;
          border-radius:8px; box-shadow:0 0 20px rgba(191,0,255,.4);
          transition:all .2s; font-family:'JetBrains Mono',monospace;
        ">Try K-Perception →</a>
      </div>
    `;

    this._container.appendChild(el);
    this._el = el;

    el.querySelector('#go-retry').addEventListener('click', () => {
      this.destroy();
      if (this._onRetry) this._onRetry();
    });
    el.querySelector('#go-menu').addEventListener('click', () => {
      this.destroy();
      if (this._onMenu) this._onMenu();
    });
  }

  destroy() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }
}

function _statRow(label, value, color) {
  return `
    <div style="text-align:center;">
      <div style="font-size:10px;color:rgba(255,255,255,.35);letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px;">${label}</div>
      <div style="font-size:clamp(14px,3vw,22px);font-weight:800;color:${color};text-shadow:0 0 14px ${color}66;">${value}</div>
    </div>
  `;
}
