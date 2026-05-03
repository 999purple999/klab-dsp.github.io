// ─── MenuModals ───────────────────────────────────────────────────────────────
// Handles Arsenal, Challenges, and Settings modals from the main menu.
// Call initMenuModals(gameScene) once after Game construction.

import { WPNS, loadWeaponUnlocks, unlockWeapon } from '../entities/Weapon/WeaponDefinitions.js';
import { WEAPON_CATALOG_DATA, WEAPON_CATALOG_BY_ID, createWeapon, getCatalogByClass, calcTTK, calcDPS }
  from '../entities/Weapon/WeaponCatalog.js';
import { SLOT_ORDER, SLOT_LABELS, getCompatibleAttachments }
  from '../entities/Weapon/AttachmentDefs.js';
import { drawWeaponShape } from '../entities/Weapon/WeaponBase.js';
import { getWeaponProgress } from '../entities/Weapon/WeaponProgression.js';
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

// ── GADGET DEFINITIONS (exported — LoadoutModal imports from here) ─────────────
export const GADGETS = [
  { key:'bomb',      name:'FRAG BOMB',   desc:'Area explosion — devastates groups.',  col:'#FF4422', effect:'Throws a frag grenade dealing 80 dmg in 180px radius. Cooldown 14s.' },
  { key:'kp',        name:'EMP BURST',   desc:'Screen-wide stun — instant panic.',    col:'#00FFFF', effect:'Emits EMP pulse stunning all enemies for 2.5s. Cooldown 20s.' },
  { key:'dash',      name:'GHOST DASH',  desc:'Invincible dash — escape any threat.', col:'#BF00FF', effect:'Dash 200px in aim direction with 0.6s invincibility. Cooldown 8s.' },
  { key:'overclock', name:'OVERCLOCK',   desc:'Fire rate ×3 — four second window.',   col:'#FFFF00', effect:'Triples weapon fire rate for 4 seconds. Cooldown 18s.' },
  { key:'empshield', name:'EMP SHIELD',  desc:'Absorb next 3 hits — zero damage.',    col:'#00FF88', effect:'Energy shield absorbs up to 3 incoming hits. Lasts 12s or until depleted.' },
  { key:'timewarp',  name:'TIME WARP',   desc:'Slow all enemies — four seconds.',     col:'#FF8800', effect:'Reduces all enemy speed and attack rate by 60% for 4s. Cooldown 22s.' },
];

// ── ARSENAL v2 – 30 weapons from WeaponCatalog ────────────────────────────────

const UNLOCK_KEY   = 'pw_catalog_unlocks_v1';
const SELECTED_KEY = 'pw_catalog_selected_v1';
const GADGET_KEY   = 'pw_catalog_gadgets_v1';

let _arUnlocks    = null;  // { [weaponId]: true }
let _arSelected   = { s0: null, s1: null };
let _arGadSlots   = { f: 'bomb', g: 'kp' };
let _arFilter     = 'all';
let _arMode       = 'weapons';  // 'weapons' | 'gadgets'
let _arSelId      = null;
let _arGadSelKey  = null;
let _arAttSlot    = null;
const _arWpnInst  = {};   // WeaponBase instances keyed by weapon id

const AR_CLASS_TABS = [
  ['all','ALL'],['assault','AR'],['smg','SMG'],['shotgun','SG'],
  ['lmg','LMG'],['sniper','SNP'],['marksman','MKM'],['pistol','PST'],['special','SPL'],
];

function _arGetUnlocks() {
  if (!_arUnlocks) {
    try { _arUnlocks = JSON.parse(localStorage.getItem(UNLOCK_KEY) || '{}'); }
    catch (_) { _arUnlocks = {}; }
  }
  return _arUnlocks;
}
function _arSaveUnlocks() {
  try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(_arUnlocks)); } catch (_) {}
}
function _arIsUnlocked(def) {
  return def.unlockLevel === 0 || !!_arGetUnlocks()[def.id];
}
function _arUnlockWeapon(id) {
  _arGetUnlocks()[id] = true;
  _arSaveUnlocks();
}
function _arLoadSelected() {
  try { _arSelected = JSON.parse(localStorage.getItem(SELECTED_KEY) || '{"s0":null,"s1":null}'); }
  catch (_) {}
}
function _arSaveSelected() {
  try { localStorage.setItem(SELECTED_KEY, JSON.stringify(_arSelected)); } catch (_) {}
}
function _arGetInstance(id) {
  if (!_arWpnInst[id]) _arWpnInst[id] = createWeapon(id);
  return _arWpnInst[id];
}

function _arLoadGadgets() {
  try { _arGadSlots = JSON.parse(localStorage.getItem(GADGET_KEY) || '{"f":"bomb","g":"kp"}'); }
  catch (_) {}
}
function _arSaveGadgets() {
  try { localStorage.setItem(GADGET_KEY, JSON.stringify(_arGadSlots)); } catch (_) {}
}

// Exported — LoadoutModal reads these to pre-fill pre-mission screen
export function getArsenalSelected()      { _arLoadSelected(); return _arSelected; }
export function getArsenalGadgets()       { _arLoadGadgets();  return _arGadSlots; }
export function getArsenalInstance(id)    { return _arWpnInst[id] || null; }

function _openArsenal() {
  document.getElementById('ar-credits-amt').textContent = getCredits().toLocaleString();
  _arLoadSelected();
  _arLoadGadgets();

  // Mode tabs (once)
  const mt = document.getElementById('ar-mode-tabs');
  if (mt && !mt._init) {
    mt._init = true;
    mt.querySelectorAll('.ar-mode-tab').forEach(b => {
      b.addEventListener('click', () => _arSwitchMode(b.dataset.m));
    });
  }

  // Rebuild class filter tabs (once)
  const fb = document.getElementById('ar-filters');
  if (fb && !fb._v2) {
    fb._v2 = true;
    fb.innerHTML = '';
    AR_CLASS_TABS.forEach(([f, lbl]) => {
      const b = document.createElement('button');
      b.className = 'ar-filter' + (f === 'all' ? ' active' : '');
      b.textContent = lbl; b.dataset.f = f;
      b.addEventListener('click', () => {
        fb.querySelectorAll('.ar-filter').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        _arFilter = f;
        _arRenderList();
      });
      fb.appendChild(b);
    });
  }

  _arSwitchMode('weapons');
  _open('arsenal-modal');
}

function _arSwitchMode(mode) {
  _arMode = mode;
  document.querySelectorAll('.ar-mode-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.m === mode)
  );
  const fb = document.getElementById('ar-filters');
  if (fb) fb.style.display = mode === 'weapons' ? 'flex' : 'none';

  if (mode === 'weapons') {
    _arRenderList();
    const sel = WEAPON_CATALOG_DATA.find(d => d.id === _arSelId) ||
                WEAPON_CATALOG_DATA.find(d => _arIsUnlocked(d)) ||
                WEAPON_CATALOG_DATA[0];
    if (sel) _arDetail(sel.id);
  } else {
    _arRenderGadgets();
    const gSel = _arGadSelKey || GADGETS[0].key;
    _arGadDetail(gSel);
  }
}

function _arRenderList() {
  const list = document.getElementById('ar-wpn-list'); if (!list) return;
  const weapons = _arFilter === 'all' ? WEAPON_CATALOG_DATA
    : WEAPON_CATALOG_DATA.filter(d => d.weaponClass === _arFilter);
  list.innerHTML = '';
  weapons.forEach(def => {
    const unlocked = _arIsUnlocked(def);
    const cost     = def.unlockLevel * 100;
    const isEq     = def.id === _arSelected.s0 || def.id === _arSelected.s1;
    const row = document.createElement('div');
    row.className = `ar-row${!unlocked ? ' ar-dim' : ''}${_arSelId === def.id ? ' ar-sel' : ''}`;
    row.innerHTML = `
      <div class="ar-dot" style="background:${def.col};box-shadow:0 0 7px ${def.col}55"></div>
      <div class="ar-rinfo">
        <div class="ar-rname">${def.name}</div>
        <div class="ar-rtag">${def.tag} · ${def.weaponClass.toUpperCase()}</div>
      </div>
      <div class="ar-rprice ${unlocked ? 'free' : 'pay'}">${unlocked ? '' : cost + ' ◈'}</div>
      ${isEq ? '<div class="ar-eq-badge">EQUIPPED</div>' : ''}`;
    row.addEventListener('click', () => {
      list.querySelectorAll('.ar-row').forEach(r => r.classList.remove('ar-sel'));
      row.classList.add('ar-sel');
      _arSelId = def.id;
      _arDetail(def.id);
    });
    list.appendChild(row);
  });
}

function _arDetail(id) {
  _arSelId = id; _arAttSlot = null;
  const panel = document.getElementById('ar-detail'); if (!panel) return;
  const def = WEAPON_CATALOG_BY_ID[id]; if (!def) return;

  const unlocked  = _arIsUnlocked(def);
  const cost      = def.unlockLevel * 100;
  const credits   = getCredits();
  const canAfford = credits >= cost;
  const wpn       = unlocked ? _arGetInstance(id) : null;
  const s         = wpn ? wpn.stats : def.stats;
  const prog      = getWeaponProgress(id);

  const rv = parseInt(def.col.slice(1,3),16)||191;
  const gv = parseInt(def.col.slice(3,5),16)||0;
  const bv = parseInt(def.col.slice(5,7),16)||255;
  const rgba = (a) => `rgba(${rv},${gv},${bv},${a})`;

  const STATS = [['DAMAGE','damage'],['FIRE RATE','fireRate'],['ACCURACY','accuracy'],
    ['RANGE','range'],['MOBILITY','mobility'],['CONTROL','control'],['HANDLING','handling']];

  const ttk = calcTTK(def, 100, 20);

  // Attachment slots HTML
  const attSection = unlocked ? `
    <div class="ar-stats-lbl" style="margin-top:18px;margin-bottom:8px">ATTACHMENTS</div>
    <div id="ar-att-slots">${SLOT_ORDER.map(slot => {
      const att = wpn.slots[slot];
      return `<div class="ar-srow ar-att-slot" data-slot="${slot}" style="cursor:pointer;padding:5px 8px;
        border:1px solid rgba(255,255,255,.06);border-radius:4px;margin-bottom:3px;transition:all .1s">
        <span class="ar-sn" style="width:74px;font-size:8px;color:rgba(255,255,255,.28)">${SLOT_LABELS[slot]||slot}</span>
        <span style="flex:1;font-size:9px;color:${att ? '#00FF88' : 'rgba(255,255,255,.18)'}">
          ${att ? att.name : '— EMPTY —'}</span>
        ${att ? `<span data-clr="${slot}" style="font-size:9px;color:rgba(255,60,60,.55);cursor:pointer;padding:0 4px">✕</span>` : ''}
      </div>`;
    }).join('')}</div>
    <div id="ar-att-pick" style="display:none;margin-top:6px;border:1px solid ${rgba(.3)};
      border-radius:6px;padding:8px;max-height:150px;overflow-y:auto;background:rgba(0,0,0,.5)"></div>
  ` : '';

  // Action
  const eqd0 = _arSelected.s0 === id, eqd1 = _arSelected.s1 === id;
  const actionHTML = unlocked
    ? `<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="ar-equip-btn ${eqd0?'equipped':''}" id="ar-eq0">
          ${eqd0 ? '✓ SLOT 1' : 'EQUIP → SLOT 1'}</button>
        <button class="ar-equip-btn ${eqd1?'equipped':''}" id="ar-eq1" style="opacity:.75">
          ${eqd1 ? '✓ SLOT 2' : 'EQUIP → SLOT 2'}</button>
       </div>`
    : `<div style="margin-top:16px">
        <button class="ar-buy-btn" id="ar-buy-cat" ${canAfford?'':'disabled'}>
          ${canAfford ? `UNLOCK — ${cost} ◈` : `NEED ${cost-credits} MORE ◈`}</button>
        ${!canAfford ? '<div class="ar-cant-afford">Earn credits by completing waves</div>' : ''}
       </div>`;

  panel.innerHTML = `
    <div class="ar-d-top">
      <div class="ar-d-icon" style="background:${rgba(.1)};border:1.5px solid ${def.col};box-shadow:0 0 20px ${rgba(.18)}">
        <canvas id="ar-wpn-cv" width="48" height="48" style="display:block"></canvas>
      </div>
      <div>
        <div class="ar-d-name" style="text-shadow:0 0 28px ${rgba(.45)}">${def.name}</div>
        <div class="ar-d-cat" style="color:${def.col}">${def.weaponClass.toUpperCase()} · ${def.tag}</div>
        <div style="font-size:8px;color:rgba(255,255,255,.3);margin-top:4px">
          LVL ${prog.level} · ${prog.kills} kills · TTK ${ttk === Infinity ? '∞' : ttk+'ms'} @20m · MAG ${def.magazine}r
        </div>
      </div>
    </div>
    <div class="ar-d-desc" style="border-color:${rgba(.25)};margin-top:12px">${def.description || ''}</div>
    <div class="ar-stats-lbl" style="margin-top:14px">WEAPON STATS</div>
    ${STATS.map(([n, k]) => {
      const v = Math.round(Math.max(0, Math.min(100, s[k] || 0)));
      return `<div class="ar-srow">
        <span class="ar-sn">${n}</span>
        <div class="ar-sb"><div class="ar-sf" style="width:${v}%;background:${def.col}"></div></div>
        <span class="ar-sv">${v}</span></div>`;
    }).join('')}
    ${attSection}
    <div class="ar-action">${actionHTML}</div>`;

  // Canvas weapon preview
  const cv = document.getElementById('ar-wpn-cv');
  if (cv) {
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 48, 48);
    ctx.save(); ctx.translate(24, 26);
    drawWeaponShape(ctx, 46, 40, def.weaponClass, def.col || '#BF00FF');
    ctx.restore();
  }

  // Unlock button
  document.getElementById('ar-buy-cat')?.addEventListener('click', () => {
    if (getCredits() < cost) return;
    setCredits(getCredits() - cost);
    if (_gameScene) _gameScene.credits = getCredits();
    _arUnlockWeapon(id);
    document.getElementById('ar-credits-amt').textContent = getCredits().toLocaleString();
    _arRenderList();
    _arDetail(id);
  });

  // Equip slot buttons
  document.getElementById('ar-eq0')?.addEventListener('click', () => {
    _arSelected.s0 = id; _arSaveSelected(); _arRenderList(); _arDetail(id);
  });
  document.getElementById('ar-eq1')?.addEventListener('click', () => {
    _arSelected.s1 = id; _arSaveSelected(); _arRenderList(); _arDetail(id);
  });

  // Attachment slot clicks
  if (unlocked) {
    document.querySelectorAll('.ar-att-slot').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.dataset.clr) { wpn.equip(e.target.dataset.clr, null); _arDetail(id); return; }
        _arOpenPicker(el.dataset.slot, wpn, def);
      });
    });
  }
}

function _arOpenPicker(slot, wpn, def) {
  _arAttSlot = slot;
  const pick = document.getElementById('ar-att-pick'); if (!pick) return;
  const options = getCompatibleAttachments(slot, def.weaponClass, 50);
  if (!options.length) {
    pick.innerHTML = '<div style="font-size:9px;color:rgba(255,255,255,.22);padding:6px">No attachments for this slot</div>';
    pick.style.display = 'block'; return;
  }
  const cur = wpn.slots[slot];
  pick.style.display = 'block';
  pick.innerHTML = options.map(a => {
    const mods = Object.entries(a.modifiers || {}).map(([k,v]) => `${k} ${v>0?'+':''}${v}`).join(' · ') || '—';
    const sel  = cur?.id === a.id;
    return `<div class="ar-att-opt" data-aid="${a.id}" style="display:flex;align-items:center;
      gap:8px;padding:6px 8px;cursor:pointer;border-radius:4px;margin-bottom:2px;
      background:${sel ? 'rgba(0,255,136,.1)' : 'transparent'}">
      <span style="flex:1;font-size:10px;color:${sel ? '#00FF88' : 'rgba(255,255,255,.7)'}">${a.name}</span>
      <span style="font-size:8px;color:rgba(255,255,255,.3)">${mods}</span>
    </div>`;
  }).join('');
  pick.querySelectorAll('.ar-att-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const att = options.find(a => a.id === opt.dataset.aid);
      if (att) wpn.equip(slot, att);
      _arDetail(_arSelId);
    });
  });
}

// ── GADGET LIST & DETAIL ──────────────────────────────────────────────────────

function _arRenderGadgets() {
  const list = document.getElementById('ar-wpn-list'); if (!list) return;
  list.innerHTML = '';
  GADGETS.forEach(g => {
    const isF = _arGadSlots.f === g.key;
    const isG = _arGadSlots.g === g.key;
    const row = document.createElement('div');
    row.className = `ar-row${_arGadSelKey === g.key ? ' ar-sel' : ''}`;
    row.innerHTML = `
      <div class="ar-dot" style="background:${g.col};box-shadow:0 0 7px ${g.col}55"></div>
      <div class="ar-rinfo">
        <div class="ar-rname">${g.name}</div>
        <div class="ar-rtag">${g.desc}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        ${isF ? `<div class="ar-eq-badge">F</div>` : ''}
        ${isG ? `<div class="ar-eq-badge" style="background:rgba(0,240,255,.15);border-color:rgba(0,240,255,.45);color:#00f0ff">G</div>` : ''}
      </div>`;
    row.addEventListener('click', () => {
      list.querySelectorAll('.ar-row').forEach(r => r.classList.remove('ar-sel'));
      row.classList.add('ar-sel');
      _arGadSelKey = g.key;
      _arGadDetail(g.key);
    });
    list.appendChild(row);
  });
}

function _arGadDetail(key) {
  _arGadSelKey = key;
  const panel = document.getElementById('ar-detail'); if (!panel) return;
  const g = GADGETS.find(x => x.key === key); if (!g) return;
  const isF = _arGadSlots.f === key;
  const isG = _arGadSlots.g === key;
  const rv = parseInt(g.col.slice(1,3),16)||191;
  const gv = parseInt(g.col.slice(3,5),16)||0;
  const bv = parseInt(g.col.slice(5,7),16)||255;
  const rgba = a => `rgba(${rv},${gv},${bv},${a})`;

  panel.innerHTML = `
    <div class="ar-d-top">
      <div class="ar-d-icon" style="background:${rgba(.1)};border:1.5px solid ${g.col};box-shadow:0 0 20px ${rgba(.18)}">
        <div style="font-size:26px;text-align:center;line-height:48px;filter:drop-shadow(0 0 8px ${g.col})">◈</div>
      </div>
      <div>
        <div class="ar-d-name" style="text-shadow:0 0 28px ${rgba(.45)}">${g.name}</div>
        <div class="ar-d-cat" style="color:${g.col}">TACTICAL GADGET</div>
        <div style="font-size:8px;color:rgba(255,255,255,.3);margin-top:4px">Always available · No credits required</div>
      </div>
    </div>
    <div class="ar-d-desc" style="border-color:${rgba(.25)};margin-top:12px">${g.desc}</div>
    <div class="ar-stats-lbl" style="margin-top:14px">EFFECT DETAILS</div>
    <div style="font-size:12px;color:rgba(255,255,255,.65);line-height:1.7;letter-spacing:.04em;margin-bottom:16px">${g.effect}</div>
    <div class="ar-action">
      <div style="display:flex;gap:8px;margin-top:0;flex-wrap:wrap">
        <button class="ar-equip-btn ${isF?'equipped':''}" id="ar-gad-f">
          ${isF ? '✓ F KEY' : 'EQUIP → F KEY'}</button>
        <button class="ar-equip-btn ${isG?'equipped':''}" id="ar-gad-g" style="opacity:.8">
          ${isG ? '✓ G KEY' : 'EQUIP → G KEY'}</button>
      </div>
    </div>`;

  document.getElementById('ar-gad-f')?.addEventListener('click', () => {
    _arGadSlots.f = key; _arSaveGadgets(); _arRenderGadgets(); _arGadDetail(key);
  });
  document.getElementById('ar-gad-g')?.addEventListener('click', () => {
    _arGadSlots.g = key; _arSaveGadgets(); _arRenderGadgets(); _arGadDetail(key);
  });
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

  // Settings tab switching
  document.getElementById('st-tabs')?.addEventListener('click', e => {
    const tab = e.target.closest('.st-tab'); if (!tab) return;
    document.querySelectorAll('.st-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.st-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('stp-' + tab.dataset.st);
    if (panel) panel.classList.add('active');
  });

  // CRT overlay toggle
  const crtToggle = document.getElementById('s-crt');
  if (crtToggle) {
    const crtEl = document.getElementById('crt-overlay');
    crtToggle.addEventListener('click', () => {
      const on = crtToggle.classList.toggle('tog-on');
      crtToggle.textContent = on ? 'ON' : 'OFF';
      if (crtEl) crtEl.style.display = on ? '' : 'none';
    });
  }

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
