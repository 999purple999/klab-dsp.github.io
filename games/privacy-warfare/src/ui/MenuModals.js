// ─── MenuModals ───────────────────────────────────────────────────────────────
// Handles Arsenal, Challenges, and Settings modals from the main menu.
// Call initMenuModals(gameScene) once after Game construction.

import { WPNS, loadWeaponUnlocks, unlockWeapon } from '../entities/Weapon/WeaponDefinitions.js';
import { MasterySystem, CATEGORIES }             from '../data/MasterySystem.js';
import { getSettings, saveSettings,
         getCredits, setCredits,
         createSaveSnapshot, applySaveSnapshot }  from '../data/Storage.js';
import { isAuthenticated, loginUser, register, validatePassword,
         clearToken, getToken,
         uploadSave, downloadSave,
         fetchLeaderboard }                       from '../utils/CloudAPI.js';

let _gameScene = null;
const mastery  = new MasterySystem();

// ── Bootstrap ─────────────────────────────────────────────────────────────────
export function initMenuModals(gameScene) {
  _gameScene = gameScene;
  loadWeaponUnlocks();

  _bindPanel('mp-arsenal',    () => _openArsenal());
  _bindPanel('mp-challenges', () => _openChallenges());
  _bindPanel('mp-settings',   () => _openSettings());

  // Mobile nav
  _bindPanel('mn-arsenal', () => _openArsenal());
  _bindPanel('mn-more',    () => _openSettings());

  // Close buttons
  _on('close-arsenal-btn',    () => _close('arsenal-modal'));
  _on('close-challenges-btn', () => _close('challenges-modal'));
  _on('close-settings-btn',   () => _close('settings-modal'));

  // Backdrop clicks
  ['arsenal-modal', 'challenges-modal', 'settings-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { if (e.target === el) _close(id); });
  });

  // Settings controls
  _initSettingsControls();

  // Leaderboard tab inside challenges
  _on('lb-refresh-btn', () => _loadLeaderboard());
}

// ── Panel binding ─────────────────────────────────────────────────────────────
function _bindPanel(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('mp-dim', 'mn-dim');
  el.style.cursor = 'pointer';
  el.addEventListener('click', fn);
}

function _on(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function _close(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function _open(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

// ── ARSENAL (CoD-style 2-panel) ───────────────────────────────────────────────
const WPN_CAT = {
  pulse: 'energy', beam: 'energy', sniper: 'energy',
  spread: 'spread',
  split: 'tactical', wave: 'tactical', chain: 'tactical',
  blackhole: 'special', nuke: 'special',
  virus: 'status', cryo: 'status',
};

let _arActiveFilter = 'all';
let _arSelectedIdx  = -1;

function _openArsenal() {
  const credEl = document.getElementById('ar-credits-amt');
  if (credEl) credEl.textContent = getCredits().toLocaleString();

  // Filter tab wiring (once per open)
  const filterBar = document.getElementById('ar-filters');
  if (filterBar && !filterBar._wired) {
    filterBar._wired = true;
    filterBar.querySelectorAll('.ar-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.ar-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _arActiveFilter = btn.dataset.f;
        _arRenderList();
      });
    });
  }

  _arRenderList();

  // Default: show currently equipped weapon
  const startIdx = _gameScene?.wpnIdx ?? 0;
  _arShowDetail(startIdx);

  _open('arsenal-modal');
}

function _arRenderList() {
  const list = document.getElementById('ar-wpn-list');
  if (!list) return;
  const credits   = getCredits();
  const equippedI = _gameScene?.wpnIdx ?? 0;

  list.innerHTML = '';
  WPNS.forEach((w, i) => {
    if (_arActiveFilter !== 'all' && (WPN_CAT[w.t] || 'tactical') !== _arActiveFilter) return;
    const locked   = !w.unlocked;
    const equipped = i === equippedI;
    const row = document.createElement('div');
    row.className = `ar-row${locked ? ' ar-dim' : ''}${_arSelectedIdx === i ? ' ar-sel' : ''}`;
    row.dataset.idx = i;
    row.innerHTML = `
      <div class="ar-dot" style="background:${w.col};box-shadow:0 0 7px ${w.col}55"></div>
      <div class="ar-rinfo">
        <div class="ar-rname">${w.n}</div>
        <div class="ar-rtag">${(w.tag || w.t).toUpperCase()} · ${(WPN_CAT[w.t]||'TACTICAL').toUpperCase()}</div>
      </div>
      <div class="ar-rprice ${locked ? 'pay' : 'free'}">${locked ? (w.unlockCost||0)+' ◈' : ''}</div>
      ${equipped ? '<div class="ar-eq-badge">EQUIPPED</div>' : ''}
    `;
    row.addEventListener('click', () => {
      list.querySelectorAll('.ar-row').forEach(r => r.classList.remove('ar-sel'));
      row.classList.add('ar-sel');
      _arSelectedIdx = i;
      _arShowDetail(i);
    });
    list.appendChild(row);
  });
}

function _arShowDetail(idx) {
  _arSelectedIdx = idx;
  const panel = document.getElementById('ar-detail');
  if (!panel) return;
  const w = WPNS[idx];
  if (!w) return;

  const credits   = getCredits();
  const locked    = !w.unlocked;
  const equipped  = (_gameScene?.wpnIdx ?? 0) === idx;
  const canAfford = credits >= (w.unlockCost || 0);

  // Color components for rgba usage
  const r = parseInt(w.col.slice(1,3),16)||0;
  const g = parseInt(w.col.slice(3,5),16)||0;
  const b = parseInt(w.col.slice(5,7),16)||0;

  const stats = [
    { n:'DAMAGE',    v: Math.min(100, (w.dmg  / 15)  * 100), lbl: w.dmg >= 10 ? w.dmg.toFixed(0) : w.dmg.toFixed(1) },
    { n:'RANGE',     v: Math.min(100, (Math.min(w.rng,600) / 600) * 100), lbl: w.rng >= 600 ? 'MAX' : w.rng.toString() },
    { n:'FIRE RATE', v: Math.min(100, (1 / w.cd) / 20 * 100), lbl: (1/w.cd).toFixed(1)+'/s' },
    { n:'IMPACT',    v: Math.min(100, w.dmg * (1/w.cd) / 4 * 100), lbl: (w.dmg*(1/w.cd)).toFixed(1) },
  ];

  const priceHTML = locked
    ? `<div class="ar-price-pill">${w.unlockCost || 0} ◈</div>`
    : `<div class="ar-free-pill">UNLOCKED</div>`;

  const btnHTML = locked
    ? `<button class="ar-buy-btn" id="ar-buy-${idx}" ${canAfford?'':'disabled'}>${canAfford ? `UNLOCK — ${w.unlockCost} ◈` : `NEED ${(w.unlockCost||0)-credits} MORE ◈`}</button>${!canAfford ? '<div class="ar-cant-afford">Earn credits by playing Survival mode</div>' : ''}`
    : `<button class="ar-equip-btn ${equipped?'equipped':''}" id="ar-eq-${idx}">${equipped ? '✓  EQUIPPED' : 'EQUIP WEAPON'}</button>`;

  panel.innerHTML = `
    <div class="ar-d-top">
      <div class="ar-d-icon" style="background:rgba(${r},${g},${b},0.12);border:1.5px solid ${w.col};box-shadow:0 0 20px rgba(${r},${g},${b},0.2)">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${w.col}" stroke-width="1.8">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
          <circle cx="12" cy="12" r="3" fill="${w.col}" opacity=".5"/>
        </svg>
      </div>
      <div>
        <div class="ar-d-name" style="text-shadow:0 0 28px rgba(${r},${g},${b},0.5)">${w.n}</div>
        <div class="ar-d-cat" style="color:${w.col}">${w.t.toUpperCase()} · ${(WPN_CAT[w.t]||'TACTICAL').toUpperCase()}</div>
      </div>
    </div>
    <div class="ar-d-tag" style="color:${w.col};border-color:rgba(${r},${g},${b},0.35)">${w.tag || w.t.toUpperCase()}</div>
    <div class="ar-d-desc" style="border-color:rgba(${r},${g},${b},0.3)">${w.desc || ''}</div>
    <div class="ar-stats-lbl">WEAPON STATS</div>
    ${stats.map(s => `
      <div class="ar-srow">
        <span class="ar-sn">${s.n}</span>
        <div class="ar-sb"><div class="ar-sf" style="width:${s.v.toFixed(0)}%;background:${w.col}"></div></div>
        <span class="ar-sv">${s.lbl}</span>
      </div>`).join('')}
    <div class="ar-action">
      ${priceHTML}
      ${btnHTML}
    </div>
  `;

  // Wire up action button
  const buyBtn = document.getElementById(`ar-buy-${idx}`);
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      const cost = WPNS[idx]?.unlockCost || 0;
      if (getCredits() >= cost) {
        setCredits(getCredits() - cost);
        if (_gameScene) _gameScene.credits = getCredits();
        unlockWeapon(idx);
        const cEl = document.getElementById('ar-credits-amt');
        if (cEl) cEl.textContent = getCredits().toLocaleString();
        _arRenderList();
        _arShowDetail(idx);
      }
    });
  }
  const eqBtn = document.getElementById(`ar-eq-${idx}`);
  if (eqBtn && !equipped) {
    eqBtn.addEventListener('click', () => {
      if (_gameScene) _gameScene.wpnIdx = idx;
      import('../ui/HUD.js').then(m => m.setWpn(idx, WPNS));
      _arRenderList();
      _arShowDetail(idx);
    });
  }
}

// ── CHALLENGES ────────────────────────────────────────────────────────────────
let _activeTab = 'KILLS';

function _openChallenges() {
  _renderChallenges(_activeTab);
  _open('challenges-modal');
}

function _renderChallenges(cat) {
  _activeTab = cat;
  const all = mastery.getAll();
  const done = all.filter(c => c.done).length;
  document.getElementById('ch-progress-txt').textContent = `${done} / ${all.length} completed`;

  // Tab bar
  const tabs = document.getElementById('ch-tabs');
  if (tabs) {
    tabs.innerHTML = CATEGORIES.map(c =>
      `<button class="ch-tab ${c === cat ? 'ch-tab-active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    tabs.querySelectorAll('.ch-tab').forEach(btn => {
      btn.addEventListener('click', () => _renderChallenges(btn.dataset.cat));
    });
  }

  const list = document.getElementById('ch-list');
  if (!list) return;
  const items = mastery.getByCategory(cat);
  list.innerHTML = items.map(c => {
    const pct = Math.min(100, (c.progress / c.target) * 100).toFixed(1);
    return `<div class="ch-item ${c.done ? 'ch-done' : ''}">
      <div class="ch-head">
        <span class="ch-name">${c.name}</span>
        <span class="ch-reward">+${c.reward} ◈</span>
      </div>
      <div class="ch-desc">${c.desc}</div>
      <div class="ch-prog-wrap">
        <div class="ch-prog-bar" style="width:${pct}%"></div>
      </div>
      <div class="ch-prog-txt">${c.progress.toLocaleString()} / ${c.target.toLocaleString()}</div>
    </div>`;
  }).join('');
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────
function _initSettingsControls() {
  const cfg = getSettings();

  // Music volume
  const musicSlider = document.getElementById('s-music-vol');
  const musicVal    = document.getElementById('s-music-val');
  if (musicSlider) {
    musicSlider.value = cfg.musicVol;
    if (musicVal) musicVal.textContent = Math.round(cfg.musicVol * 100) + '%';
    musicSlider.addEventListener('input', () => {
      const v = parseFloat(musicSlider.value);
      if (musicVal) musicVal.textContent = Math.round(v * 100) + '%';
      saveSettings({ musicVol: v });
    });
  }

  // SFX volume
  const sfxSlider = document.getElementById('s-sfx-vol');
  const sfxVal    = document.getElementById('s-sfx-val');
  if (sfxSlider) {
    sfxSlider.value = cfg.sfxVol;
    if (sfxVal) sfxVal.textContent = Math.round(cfg.sfxVol * 100) + '%';
    sfxSlider.addEventListener('input', () => {
      const v = parseFloat(sfxSlider.value);
      if (sfxVal) sfxVal.textContent = Math.round(v * 100) + '%';
      saveSettings({ sfxVol: v });
    });
  }

  // Quality buttons
  document.querySelectorAll('.sq-btn').forEach(btn => {
    if (btn.dataset.q === cfg.quality) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sq-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings({ quality: btn.dataset.q });
    });
  });

  // Joystick toggle
  const jsToggle = document.getElementById('s-joystick');
  if (jsToggle) {
    jsToggle.textContent = cfg.joystick ? 'ON' : 'OFF';
    jsToggle.classList.toggle('tog-on', cfg.joystick);
    jsToggle.addEventListener('click', () => {
      const cur = getSettings().joystick;
      saveSettings({ joystick: !cur });
      jsToggle.textContent = !cur ? 'ON' : 'OFF';
      jsToggle.classList.toggle('tog-on', !cur);
    });
  }

  // Particles toggle
  const parToggle = document.getElementById('s-particles');
  if (parToggle) {
    parToggle.textContent = cfg.particles ? 'ON' : 'OFF';
    parToggle.classList.toggle('tog-on', cfg.particles);
    parToggle.addEventListener('click', () => {
      const cur = getSettings().particles;
      saveSettings({ particles: !cur });
      parToggle.textContent = !cur ? 'ON' : 'OFF';
      parToggle.classList.toggle('tog-on', !cur);
    });
  }

  // Account / cloud
  _updateAccountUI();
  _initAuthForm();
  _on('s-logout-btn',  () => { clearToken(); _updateAccountUI(); });
  _on('s-sync-up-btn', () => _syncUp());
  _on('s-sync-dn-btn', () => _syncDown());
}

function _openSettings() {
  _updateAccountUI();
  _open('settings-modal');
}

function _updateAccountUI() {
  const loggedIn  = document.getElementById('s-auth-logged-in');
  const loggedOut = document.getElementById('s-auth-logged-out');
  const statusEl  = document.getElementById('s-account-status');
  if (isAuthenticated()) {
    const name = localStorage.getItem('pw_username') || 'Player';
    if (statusEl)  statusEl.textContent = '● ' + name;
    if (loggedIn)  loggedIn.style.display  = 'block';
    if (loggedOut) loggedOut.style.display = 'none';
  } else {
    if (loggedIn)  loggedIn.style.display  = 'none';
    if (loggedOut) loggedOut.style.display = 'block';
  }
}

function _initAuthForm() {
  let isRegister = false;

  const tabLogin    = document.getElementById('s-tab-login');
  const tabRegister = document.getElementById('s-tab-register');
  const authBtn     = document.getElementById('s-auth-btn');
  const errEl       = document.getElementById('s-auth-err');

  function _setTab(reg) {
    isRegister = reg;
    if (tabLogin)    tabLogin.classList.toggle('active', !reg);
    if (tabRegister) tabRegister.classList.toggle('active',  reg);
    if (authBtn)     authBtn.textContent = reg ? 'Register' : 'Sign In';
    if (errEl)       errEl.textContent   = '';
  }

  _on('s-tab-login',    () => _setTab(false));
  _on('s-tab-register', () => _setTab(true));

  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      const username = (document.getElementById('s-username')?.value || '').trim();
      const password = document.getElementById('s-password')?.value || '';
      if (errEl) errEl.textContent = '';

      if (!username || username.length < 3) {
        if (errEl) errEl.textContent = 'Username must be at least 3 characters';
        return;
      }
      const pwErr = validatePassword(password);
      if (pwErr) { if (errEl) errEl.textContent = pwErr; return; }

      authBtn.disabled    = true;
      authBtn.textContent = isRegister ? 'Registering…' : 'Signing in…';

      const result = isRegister
        ? await register(username, password)
        : await loginUser(username, password);

      authBtn.disabled = false;
      authBtn.textContent = isRegister ? 'Register' : 'Sign In';

      if (result.ok) {
        localStorage.setItem('pw_username', username);
        _updateAccountUI();
      } else {
        if (errEl) errEl.textContent = result.error || 'Authentication failed';
      }
    });
  }
}

async function _syncUp() {
  const btn = document.getElementById('s-sync-up-btn');
  if (btn) btn.textContent = 'Syncing…';
  const snap = createSaveSnapshot({ campaign: JSON.parse(localStorage.getItem('pw_campaign') || 'null') });
  const ok = await uploadSave(snap);
  if (btn) btn.textContent = ok ? '✓ Synced!' : '✗ Failed';
  setTimeout(() => { if (btn) btn.textContent = 'Upload Save'; }, 2000);
}

async function _syncDown() {
  const btn = document.getElementById('s-sync-dn-btn');
  if (btn) btn.textContent = 'Downloading…';
  const snap = await downloadSave();
  if (snap && applySaveSnapshot(snap)) {
    if (btn) btn.textContent = '✓ Loaded!';
  } else {
    if (btn) btn.textContent = '✗ Failed';
  }
  setTimeout(() => { if (btn) btn.textContent = 'Download Save'; }, 2000);
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
async function _loadLeaderboard() {
  const el = document.getElementById('lb-list');
  if (!el) return;
  el.innerHTML = '<div style="opacity:.5;text-align:center;padding:20px">Loading…</div>';
  const data = await fetchLeaderboard();
  if (!data || !data.length) {
    el.innerHTML = '<div style="opacity:.5;text-align:center;padding:20px">No scores yet. Be the first!</div>';
    return;
  }
  el.innerHTML = data.slice(0, 20).map((e, i) =>
    `<div class="lb-row ${i < 3 ? 'lb-top' : ''}">
       <span class="lb-rank">#${i + 1}</span>
       <span class="lb-name">${e.name}</span>
       <span class="lb-score">${e.score.toLocaleString()}</span>
       <span class="lb-wave">W${e.wave}</span>
     </div>`
  ).join('');
}
