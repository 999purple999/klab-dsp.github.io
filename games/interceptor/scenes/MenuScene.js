import { bus } from '../utils/EventBus.js';
import { Storage } from '../data/Storage.js';

const DIFFICULTIES = ['EASY', 'NORMAL', 'HARD', 'EXPERT'];
const DIFF_COLORS = {
  EASY:   '#00FF41',
  NORMAL: '#BF00FF',
  HARD:   '#FF8C00',
  EXPERT: '#FF3333',
};

export class MenuScene {
  constructor(container, leaderboard, upgradeTree, achievements) {
    this._container = container;
    this._leaderboard = leaderboard;
    this._upgradeTree = upgradeTree;
    this._achievements = achievements;
    this._el = null;
    this._selectedDifficulty = Storage.get('difficulty', 'NORMAL');
    this._showShop = false;
    this._showLeaderboard = false;
    this._onPlay = null;
    this._animPackets = [];
    this._canvas = null;
    this._ctx = null;
    this._rafId = null;
    this._build();
  }

  _build() {
    const existing = document.getElementById('menu-scene');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'menu-scene';
    el.style.cssText = `
      position:fixed; inset:0; z-index:30;
      background:#050508;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      font-family:'JetBrains Mono','Courier New',monospace;
      overflow:hidden;
    `;

    el.innerHTML = `
      <canvas id="menu-bg-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"></canvas>
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:18px;width:100%;max-width:460px;padding:20px;">
        <div id="menu-title" style="
          font-size:clamp(24px,6vw,54px); font-weight:800;
          color:#BF00FF; letter-spacing:.06em; text-align:center;
          text-shadow:0 0 50px #BF00FF,0 0 100px rgba(191,0,255,.35);
          line-height:1.12;
        ">DATA BREACH<br>INTERCEPTOR</div>
        <div style="color:rgba(255,255,255,.45);font-size:clamp(9px,1.8vw,12px);letter-spacing:.1em;text-align:center;">
          K-PERCEPTION SECURITY LABS
        </div>

        <div id="menu-difficulty" style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;justify-content:center;"></div>

        <button id="menu-play-btn" style="
          padding:14px 54px; color:#fff; font-weight:800;
          font-size:clamp(14px,2.8vw,19px); letter-spacing:.14em;
          text-transform:uppercase; border:none; cursor:pointer;
          border-radius:12px; transition:all .15s;
          font-family:'JetBrains Mono',monospace;
          background:linear-gradient(135deg,#BF00FF,#7c3aed);
          box-shadow:0 0 50px rgba(191,0,255,.6);
          margin-top:4px;
        ">ENGAGE FIREWALL</button>

        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
          <button id="menu-shop-btn" class="menu-sec-btn">⬆ UPGRADES</button>
          <button id="menu-lb-btn" class="menu-sec-btn">🏆 LEADERBOARD</button>
          <button id="menu-tutorial-btn" class="menu-sec-btn">? TUTORIAL</button>
          <button id="menu-fs-btn" class="menu-sec-btn">⛶ FULLSCREEN</button>
        </div>

        <div id="menu-top3" style="
          background:rgba(0,0,0,0.5);
          border:1px solid rgba(191,0,255,0.2);
          border-radius:8px; padding:12px 20px;
          min-width:240px; text-align:center;
        "></div>
      </div>

      <div id="menu-shop-panel" style="display:none;position:fixed;inset:0;z-index:40;background:rgba(5,5,8,0.97);overflow-y:auto;"></div>
      <div id="menu-lb-panel" style="display:none;position:fixed;inset:0;z-index:40;background:rgba(5,5,8,0.97);overflow-y:auto;"></div>
    `;

    // Inject secondary button styles
    const style = document.createElement('style');
    style.textContent = `
      .menu-sec-btn {
        padding:9px 18px; color:#BF00FF; font-weight:700;
        font-size:clamp(10px,1.8vw,13px); letter-spacing:.1em;
        text-transform:uppercase; border:1px solid rgba(191,0,255,0.5);
        cursor:pointer; border-radius:8px;
        font-family:'JetBrains Mono',monospace;
        background:rgba(191,0,255,0.1);
        transition:all .15s;
      }
      .menu-sec-btn:hover { background:rgba(191,0,255,0.25); transform:translateY(-2px); }
      .diff-btn {
        padding:7px 14px; font-weight:700;
        font-size:clamp(9px,1.6vw,12px); letter-spacing:.1em;
        text-transform:uppercase; border:1px solid;
        cursor:pointer; border-radius:6px;
        font-family:'JetBrains Mono',monospace;
        transition:all .15s;
      }
      .diff-btn:hover { transform:translateY(-2px); }
    `;
    el.appendChild(style);

    this._container.appendChild(el);
    this._el = el;

    // Build animated bg canvas
    this._canvas = el.querySelector('#menu-bg-canvas');
    this._ctx = this._canvas.getContext('2d');
    this._resizeBg();

    // Difficulty buttons
    this._renderDiffButtons(el.querySelector('#menu-difficulty'));

    // Top 3
    this._renderTop3(el.querySelector('#menu-top3'));

    // Play button
    el.querySelector('#menu-play-btn').addEventListener('click', () => {
      Storage.set('difficulty', this._selectedDifficulty);
      if (this._onPlay) this._onPlay(this._selectedDifficulty);
    });

    // Shop
    el.querySelector('#menu-shop-btn').addEventListener('click', () => this._openShop());

    // Leaderboard
    el.querySelector('#menu-lb-btn').addEventListener('click', () => this._openLeaderboard());

    // Tutorial reset
    el.querySelector('#menu-tutorial-btn').addEventListener('click', () => {
      Storage.remove('tutorial_seen');
      bus.emit('show_tutorial', {});
    });

    // Fullscreen
    el.querySelector('#menu-fs-btn').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    });

    // Start bg animation
    this._initBgPackets();
    this._animate();

    window.addEventListener('resize', () => this._resizeBg());
  }

  _resizeBg() {
    if (!this._canvas) return;
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
  }

  _initBgPackets() {
    this._animPackets = [];
    for (let i = 0; i < 12; i++) {
      this._animPackets.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 18 + Math.random() * 24,
        vx: 25 + Math.random() * 40,
        col: ['#FF8C00','#BF00FF','#00FF41','#FF3333'][Math.floor(Math.random() * 4)],
        alpha: 0.06 + Math.random() * 0.12,
        label: ['DATA','PKT','EXE','SYS'][Math.floor(Math.random() * 4)],
      });
    }
  }

  _animate() {
    this._rafId = requestAnimationFrame(() => this._animate());
    if (!this._ctx || !this._canvas) return;
    const ctx = this._ctx;
    const W = this._canvas.width;
    const H = this._canvas.height;
    const dt = 0.016;

    ctx.clearRect(0, 0, W, H);

    for (const p of this._animPackets) {
      p.x -= p.vx * dt;
      if (p.x < -p.r - 20) {
        p.x = W + p.r + 20;
        p.y = Math.random() * H;
      }

      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = p.col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `700 ${Math.max(7, p.r * 0.4)}px "JetBrains Mono",monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = p.col;
      ctx.fillText(p.label, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  _renderDiffButtons(container) {
    container.innerHTML = '';
    for (const d of DIFFICULTIES) {
      const btn = document.createElement('button');
      btn.className = 'diff-btn';
      btn.textContent = d;
      const col = DIFF_COLORS[d];
      const isSelected = d === this._selectedDifficulty;
      btn.style.color = col;
      btn.style.borderColor = isSelected ? col : 'rgba(255,255,255,0.15)';
      btn.style.background = isSelected ? col + '25' : 'transparent';
      btn.style.boxShadow = isSelected ? `0 0 14px ${col}55` : 'none';
      btn.addEventListener('click', () => {
        this._selectedDifficulty = d;
        this._renderDiffButtons(container);
      });
      container.appendChild(btn);
    }
  }

  _renderTop3(container) {
    const top = this._leaderboard.getTop5().slice(0, 3);
    if (top.length === 0) {
      container.innerHTML = `<div style="color:rgba(255,255,255,.3);font-size:11px;letter-spacing:.08em;">No runs yet — be the first!</div>`;
      return;
    }
    const medals = ['🥇','🥈','🥉'];
    container.innerHTML = `
      <div style="color:rgba(255,255,255,.4);font-size:10px;letter-spacing:.12em;margin-bottom:8px;text-transform:uppercase;">Top Runs</div>
      ${top.map((r, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin:4px 0;font-size:clamp(10px,1.8vw,13px);">
          <span>${medals[i]}</span>
          <span style="color:#BF00FF;font-weight:700;">${r.score.toLocaleString()}</span>
          <span style="color:rgba(255,255,255,.4);">W${r.wave}</span>
          <span style="color:rgba(255,255,255,.3);font-size:10px;">${r.difficulty || ''}</span>
        </div>
      `).join('')}
    `;
  }

  _openShop() {
    const panel = this._el.querySelector('#menu-shop-panel');
    panel.style.display = 'block';
    this._renderShop(panel);
  }

  _renderShop(panel) {
    const upgrades = this._upgradeTree.getAllUpgrades();
    const pts = this._upgradeTree.getAvailablePoints();

    panel.innerHTML = `
      <div style="
        max-width:480px; margin:0 auto; padding:32px 20px;
        font-family:'JetBrains Mono','Courier New',monospace;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div style="font-size:clamp(18px,4vw,28px);font-weight:800;color:#BF00FF;letter-spacing:.08em;">UPGRADE SHOP</div>
          <button id="shop-close" style="
            background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
            color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;
            font-family:'JetBrains Mono',monospace;font-size:12px;
          ">CLOSE</button>
        </div>
        <div style="color:rgba(255,255,255,.5);font-size:12px;letter-spacing:.1em;margin-bottom:20px;">
          AVAILABLE POINTS: <span style="color:#BF00FF;font-weight:700;">${pts.toLocaleString()}</span>
        </div>
        <div id="shop-items"></div>
      </div>
    `;

    panel.querySelector('#shop-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    const itemsEl = panel.querySelector('#shop-items');
    for (const up of upgrades) {
      const item = document.createElement('div');
      item.style.cssText = `
        border:1px solid rgba(${up.owned ? '0,255,65' : '191,0,255'},0.3);
        border-radius:10px; padding:14px 16px; margin-bottom:12px;
        background:rgba(${up.owned ? '0,255,65' : '191,0,255'},0.05);
        display:flex; align-items:center; justify-content:space-between; gap:12px;
      `;
      item.innerHTML = `
        <div style="flex:1;">
          <div style="font-weight:700;color:${up.owned ? '#00FF41' : '#FFFFFF'};font-size:clamp(11px,2vw,14px);margin-bottom:4px;">${up.name}</div>
          <div style="color:rgba(255,255,255,.5);font-size:clamp(9px,1.6vw,11px);">${up.desc}</div>
        </div>
        <div style="text-align:right;">
          ${up.owned
            ? `<div style="color:#00FF41;font-size:12px;letter-spacing:.1em;">✓ OWNED</div>`
            : `<div style="color:rgba(255,255,255,.4);font-size:11px;margin-bottom:6px;">${up.cost} pts</div>
               <button class="buy-btn" data-id="${up.id}" style="
                 padding:6px 14px;background:${up.affordable ? 'rgba(191,0,255,0.3)' : 'rgba(255,255,255,0.05)'};
                 border:1px solid rgba(191,0,255,${up.affordable ? '0.8' : '0.2'});
                 color:${up.affordable ? '#BF00FF' : 'rgba(255,255,255,0.2)'};
                 border-radius:6px;cursor:${up.affordable ? 'pointer' : 'default'};
                 font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.08em;
               ">${up.affordable ? 'BUY' : 'LOCKED'}</button>`
          }
        </div>
      `;
      itemsEl.appendChild(item);

      if (!up.owned) {
        const buyBtn = item.querySelector('.buy-btn');
        if (buyBtn && up.affordable) {
          buyBtn.addEventListener('click', () => {
            if (this._upgradeTree.buy(up.id)) {
              this._renderShop(panel); // refresh
            }
          });
        }
      }
    }
  }

  _openLeaderboard() {
    const panel = this._el.querySelector('#menu-lb-panel');
    panel.style.display = 'block';
    const top5 = this._leaderboard.getTop5();

    panel.innerHTML = `
      <div style="
        max-width:480px; margin:0 auto; padding:32px 20px;
        font-family:'JetBrains Mono','Courier New',monospace;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div style="font-size:clamp(18px,4vw,28px);font-weight:800;color:#BF00FF;letter-spacing:.08em;">LEADERBOARD</div>
          <button id="lb-close" style="
            background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
            color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;
            font-family:'JetBrains Mono',monospace;font-size:12px;
          ">CLOSE</button>
        </div>
        ${top5.length === 0
          ? `<div style="color:rgba(255,255,255,.3);text-align:center;padding:40px;">No runs recorded yet.</div>`
          : top5.map((r, i) => `
            <div style="
              display:flex; align-items:center; gap:16px;
              border:1px solid rgba(191,0,255,0.15);
              border-radius:10px; padding:14px 16px; margin-bottom:10px;
              background:rgba(191,0,255,0.05);
            ">
              <div style="font-size:24px;">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</div>
              <div style="flex:1;">
                <div style="color:#BF00FF;font-weight:700;font-size:clamp(14px,3vw,20px);">${r.score.toLocaleString()}</div>
                <div style="color:rgba(255,255,255,.4);font-size:11px;margin-top:2px;">
                  Wave ${r.wave} · ${r.accuracy || 0}% acc · ${r.difficulty || 'NORMAL'} · ${r.date}
                </div>
              </div>
            </div>
          `).join('')}
      </div>
    `;

    panel.querySelector('#lb-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  onPlay(cb) {
    this._onPlay = cb;
  }

  destroy() {
    cancelAnimationFrame(this._rafId);
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }
}
