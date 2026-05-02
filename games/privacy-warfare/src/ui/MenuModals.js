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

// ── ARSENAL ───────────────────────────────────────────────────────────────────
function _openArsenal() {
  const grid = document.getElementById('arsenal-grid');
  if (!grid) return;

  const credits = getCredits();
  document.getElementById('arsenal-credits').textContent = credits + ' ◈';

  grid.innerHTML = WPNS.map((w, i) => {
    const locked    = !w.unlocked;
    const cost      = w.unlockCost || 0;
    const canAfford = credits >= cost;
    const statsBar  = _bar('DMG', w.dmg, 10) + _bar('RNG', w.rng, 600) + _bar('SPD', 1 / w.cd, 30);
    const equipped  = _gameScene?.wpnIdx === i;

    return `<div class="ar-card ${locked ? 'ar-locked' : ''}" style="--wc:${w.col}">
      <div class="ar-color-strip"></div>
      <div class="ar-body">
        <div class="ar-name">${w.n}</div>
        <div class="ar-desc">${w.desc || ''}</div>
        <div class="ar-stats">${statsBar}</div>
      </div>
      <div class="ar-right">
        ${locked
          ? `<button class="ar-btn ar-buy" data-buy="${i}" ${canAfford ? '' : 'disabled'}>${cost} ◈ UNLOCK</button>`
          : `<button class="ar-btn ar-equip" data-equip="${i}">${equipped ? '✓ EQUIPPED' : 'EQUIP'}</button>`
        }
        <div class="ar-type">${w.t.toUpperCase()}</div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-equip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.equip;
      if (_gameScene) _gameScene.wpnIdx = idx;
      import('../ui/HUD.js').then(m => m.setWpn(idx, WPNS));
      grid.querySelectorAll('.ar-equip').forEach(b => b.textContent = 'EQUIP');
      btn.textContent = '✓ EQUIPPED';
    });
  });

  grid.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx  = +btn.dataset.buy;
      const cost = WPNS[idx]?.unlockCost || 0;
      if (getCredits() >= cost) {
        setCredits(getCredits() - cost);
        if (_gameScene) _gameScene.credits = getCredits();
        unlockWeapon(idx);
        _openArsenal();
      }
    });
  });

  _open('arsenal-modal');
}

function _bar(label, val, max) {
  const pct = Math.min(100, (val / max) * 100).toFixed(0);
  return `<div class="ar-stat-row"><span>${label}</span><div class="ar-stat-bg"><div class="ar-stat-fill" style="width:${pct}%;background:var(--wc)"></div></div></div>`;
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
