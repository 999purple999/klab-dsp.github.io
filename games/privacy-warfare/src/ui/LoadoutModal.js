// ─── LoadoutModal ─────────────────────────────────────────────────────────────
// Pre-mission loadout: choose 2 weapons + 2 gadgets before deploying.
// Weapons are sourced from WeaponCatalog (unlocked ones).
// Gadget definitions remain here; Arsenal handles weapons & attachments.

import { WEAPON_CATALOG_DATA, WEAPON_CATALOG_BY_ID } from '../entities/Weapon/WeaponCatalog.js';
import { getArsenalSelected } from './MenuModals.js';

export const GADGETS = [
  { key: 'bomb',      name: 'FRAG BOMB',   desc: 'Area explosion — devastates groups.',  col: '#FF4422', icon: '#i-bomb'   },
  { key: 'kp',        name: 'EMP BURST',   desc: 'Screen-wide stun — instant panic.',    col: '#00FFFF', icon: '#i-bolt'   },
  { key: 'dash',      name: 'GHOST DASH',  desc: 'Invincible dash — escape any threat.', col: '#BF00FF', icon: '#i-dash'   },
  { key: 'overclock', name: 'OVERCLOCK',   desc: 'Fire rate ×3 — four second window.',   col: '#FFFF00', icon: '#i-chip'   },
  { key: 'empshield', name: 'EMP SHIELD',  desc: 'Absorb next 3 hits — zero damage.',    col: '#00FF88', icon: '#i-shield' },
  { key: 'timewarp',  name: 'TIME WARP',   desc: 'Slow all enemies — four seconds.',     col: '#FF8800', icon: '#i-clock'  },
];

const UNLOCK_KEY = 'pw_catalog_unlocks_v1';

function _getUnlockedWeapons() {
  let unlocks = {};
  try { unlocks = JSON.parse(localStorage.getItem(UNLOCK_KEY) || '{}'); } catch (_) {}
  return WEAPON_CATALOG_DATA.filter(d => d.unlockLevel === 0 || unlocks[d.id]);
}

let _onConfirm = null;
let _wpnSlots  = [null, null];  // catalog weapon IDs (strings)
let _gadSlots  = ['bomb', 'kp'];

export function openLoadout(onConfirm) {
  _onConfirm = onConfirm;

  // Default to Arsenal-selected weapons, falling back to first two unlocked
  const sel = getArsenalSelected();
  const unlocked = _getUnlockedWeapons();
  _wpnSlots = [
    sel.s0 || unlocked[0]?.id || null,
    sel.s1 || unlocked[1]?.id || unlocked[0]?.id || null,
  ];
  _gadSlots = ['bomb', 'kp'];

  const modal = document.getElementById('loadout-modal');
  if (!modal) { _onConfirm(_wpnSlots, _gadSlots); return; }
  modal.style.display = 'flex';
  _render();

  const deployBtn = document.getElementById('lo-deploy-btn');
  const backBtn   = document.getElementById('lo-back-btn');
  const _deploy   = () => { _cleanup(); _onConfirm(_wpnSlots, _gadSlots); };
  const _abort    = () => { _cleanup(); };
  function _cleanup() {
    modal.style.display = 'none';
    deployBtn.removeEventListener('click', _deploy);
    backBtn.removeEventListener('click', _abort);
  }
  deployBtn.addEventListener('click', _deploy);
  backBtn.addEventListener('click', _abort);
}

// ─── Render ───────────────────────────────────────────────────────────────────

function _render() {
  _renderWpnSlots();
  _renderGadSlots();
  _renderWpnList();
  _renderGadList();
}

function _renderWpnSlots() {
  for (let s = 0; s < 2; s++) {
    const el = document.getElementById('lo-wpn-slot-' + s);
    if (!el) continue;
    const id = _wpnSlots[s];
    const d  = id ? WEAPON_CATALOG_BY_ID[id] : null;
    el.innerHTML = d
      ? `<div class="lo-sl-key">${s === 0 ? 'SLOT 1' : 'SLOT 2'}</div>
         <div class="lo-sl-name" style="color:${d.col}">${d.name}</div>
         <div class="lo-sl-ammo">${d.magazine} mag · ${d.weaponClass.toUpperCase()}</div>`
      : `<div class="lo-sl-key">${s === 0 ? 'SLOT 1' : 'SLOT 2'}</div>
         <div class="lo-sl-empty">— SELECT WEAPON —</div>`;
    el.style.borderColor = d ? d.col + '55' : 'rgba(255,255,255,0.08)';
    el.style.boxShadow   = d ? '0 0 14px ' + d.col + '22' : 'none';
  }
}

function _renderGadSlots() {
  for (let s = 0; s < 2; s++) {
    const el = document.getElementById('lo-gad-slot-' + s);
    if (!el) continue;
    const key = _gadSlots[s];
    const g   = key ? GADGETS.find(x => x.key === key) : null;
    el.innerHTML = g
      ? `<div class="lo-sl-key">${s === 0 ? 'F KEY' : 'G KEY'}</div>
         <div class="lo-sl-name" style="color:${g.col}">${g.name}</div>`
      : `<div class="lo-sl-key">${s === 0 ? 'F KEY' : 'G KEY'}</div>
         <div class="lo-sl-empty">— SELECT GADGET —</div>`;
    el.style.borderColor = g ? g.col + '55' : 'rgba(255,255,255,0.08)';
    el.style.boxShadow   = g ? '0 0 14px ' + g.col + '22' : 'none';
  }
}

function _renderWpnList() {
  const list = document.getElementById('lo-wpn-list');
  if (!list) return;
  list.innerHTML = '';
  _getUnlockedWeapons().forEach(d => {
    const slotIdx = _wpnSlots.indexOf(d.id);
    const row = document.createElement('div');
    row.className = 'lo-wpn-row' + (slotIdx >= 0 ? ' lo-row-sel' : '');
    row.dataset.id = d.id;
    row.innerHTML = `
      <div class="lo-wpn-dot" style="background:${d.col};box-shadow:0 0 8px ${d.col}88"></div>
      <div class="lo-wpn-mid">
        <div class="lo-wpn-name">${d.name}</div>
        <div class="lo-wpn-tag">${d.tag} · ${d.weaponClass.toUpperCase()}</div>
      </div>
      <div class="lo-wpn-ammo-badge" style="color:${d.col}">${d.magazine}r</div>
      ${slotIdx >= 0 ? `<div class="lo-row-badge">S${slotIdx + 1}</div>` : ''}
    `;
    row.style.setProperty('--wc', d.col);
    row.addEventListener('click', () => _toggleWpn(d.id));
    list.appendChild(row);
  });
}

function _renderGadList() {
  const list = document.getElementById('lo-gad-list');
  if (!list) return;
  list.innerHTML = '';
  GADGETS.forEach(g => {
    const slot = _gadSlots.indexOf(g.key);
    const row  = document.createElement('div');
    row.className = 'lo-gad-row' + (slot >= 0 ? ' lo-row-sel' : '');
    row.dataset.key = g.key;
    row.innerHTML = `
      <svg class="lo-gad-ico" width="20" height="20" style="color:${g.col}"><use href="${g.icon}"/></svg>
      <div class="lo-gad-mid">
        <div class="lo-gad-name">${g.name}</div>
        <div class="lo-gad-desc">${g.desc}</div>
      </div>
      ${slot >= 0 ? `<div class="lo-row-badge" style="background:${g.col}33;color:${g.col};border-color:${g.col}66">${slot === 0 ? 'F' : 'G'}</div>` : ''}
    `;
    row.style.setProperty('--gc', g.col);
    row.addEventListener('click', () => _toggleGad(g.key));
    list.appendChild(row);
  });
}

// ─── Toggle logic ─────────────────────────────────────────────────────────────

function _toggleWpn(id) {
  const cur = _wpnSlots.indexOf(id);
  if (cur >= 0) {
    _wpnSlots[cur] = null;
  } else {
    if (!_wpnSlots[0])      _wpnSlots[0] = id;
    else if (!_wpnSlots[1]) _wpnSlots[1] = id;
    else                     _wpnSlots[0] = id;
  }
  _render();
}

function _toggleGad(key) {
  const cur = _gadSlots.indexOf(key);
  if (cur >= 0) {
    _gadSlots[cur] = null;
  } else {
    if (!_gadSlots[0])      _gadSlots[0] = key;
    else if (!_gadSlots[1]) _gadSlots[1] = key;
    else                     _gadSlots[0] = key;
  }
  _render();
}
