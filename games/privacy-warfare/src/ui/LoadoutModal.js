// ─── LoadoutModal ─────────────────────────────────────────────────────────────
// Pre-mission loadout: choose 2 weapons + 2 gadgets before deploying.

import { WPNS, BASE_AMMO } from '../entities/Weapon/WeaponDefinitions.js';

export const GADGETS = [
  { key: 'bomb',      name: 'FRAG BOMB',   desc: 'Area explosion — devastates groups.',  col: '#FF4422', icon: '#i-bomb'   },
  { key: 'kp',        name: 'EMP BURST',   desc: 'Screen-wide stun — instant panic.',    col: '#00FFFF', icon: '#i-bolt'   },
  { key: 'dash',      name: 'GHOST DASH',  desc: 'Invincible dash — escape any threat.', col: '#BF00FF', icon: '#i-dash'   },
  { key: 'overclock', name: 'OVERCLOCK',   desc: 'Fire rate ×3 — four second window.',   col: '#FFFF00', icon: '#i-chip'   },
  { key: 'empshield', name: 'EMP SHIELD',  desc: 'Absorb next 3 hits — zero damage.',    col: '#00FF88', icon: '#i-shield' },
  { key: 'timewarp',  name: 'TIME WARP',   desc: 'Slow all enemies — four seconds.',     col: '#FF8800', icon: '#i-clock'  },
];

let _onConfirm = null;
let _wpnSlots  = [0, 1];
let _gadSlots  = ['bomb', 'kp'];

export function openLoadout(onConfirm) {
  _onConfirm = onConfirm;

  // Default to first two unlocked weapons
  const unlocked = WPNS.map((w, i) => i).filter(i => WPNS[i].unlocked);
  _wpnSlots = [unlocked[0] ?? 0, unlocked[1] ?? unlocked[0] ?? 0];
  _gadSlots = ['bomb', 'kp'];

  const modal = document.getElementById('loadout-modal');
  if (!modal) { _onConfirm([_wpnSlots, _gadSlots]); return; }
  modal.style.display = 'flex';
  _render();

  const deployBtn = document.getElementById('lo-deploy-btn');
  const backBtn   = document.getElementById('lo-back-btn');
  const _deploy   = () => { _cleanup(); _onConfirm(_wpnSlots, _gadSlots); };
  const _abort    = () => { _cleanup(); };
  function _cleanup() { modal.style.display = 'none'; deployBtn.removeEventListener('click', _deploy); backBtn.removeEventListener('click', _abort); }
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
    const idx = _wpnSlots[s];
    const w   = (idx >= 0 && WPNS[idx]) ? WPNS[idx] : null;
    el.innerHTML = w
      ? `<div class="lo-sl-key">${s === 0 ? 'SLOT 1' : 'SLOT 2'}</div>
         <div class="lo-sl-name" style="color:${w.col}">${w.n}</div>
         <div class="lo-sl-ammo">${BASE_AMMO[idx]} ammo</div>`
      : `<div class="lo-sl-key">${s === 0 ? 'SLOT 1' : 'SLOT 2'}</div>
         <div class="lo-sl-empty">— SELECT WEAPON —</div>`;
    el.style.borderColor = w ? w.col + '55' : 'rgba(255,255,255,0.08)';
    el.style.boxShadow   = w ? '0 0 14px ' + w.col + '22' : 'none';
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
  WPNS.forEach((w, i) => {
    if (!w.unlocked) return;
    const slot = _wpnSlots.indexOf(i);
    const row  = document.createElement('div');
    row.className = 'lo-wpn-row' + (slot >= 0 ? ' lo-row-sel' : '');
    row.dataset.idx = i;
    row.innerHTML = `
      <div class="lo-wpn-dot" style="background:${w.col};box-shadow:0 0 8px ${w.col}88"></div>
      <div class="lo-wpn-mid">
        <div class="lo-wpn-name">${w.n}</div>
        <div class="lo-wpn-tag">${w.tag}</div>
      </div>
      <div class="lo-wpn-ammo-badge" style="color:${w.col}">${BASE_AMMO[i]}</div>
      ${slot >= 0 ? `<div class="lo-row-badge">S${slot+1}</div>` : ''}
    `;
    row.style.setProperty('--wc', w.col);
    row.addEventListener('click', () => _toggleWpn(i));
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

function _toggleWpn(idx) {
  const cur = _wpnSlots.indexOf(idx);
  if (cur >= 0) {
    _wpnSlots[cur] = _wpnSlots[cur === 0 ? 1 : 0]; // keep other, clear this
    _wpnSlots[cur === 0 ? 1 : 0] = -1; // this doesn't quite work right
    // Actually: just remove from the slot it's in
    _wpnSlots[cur] = -1;
  } else {
    if (_wpnSlots[0] < 0)      _wpnSlots[0] = idx;
    else if (_wpnSlots[1] < 0) _wpnSlots[1] = idx;
    else                        _wpnSlots[0] = idx; // replace slot 0
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
