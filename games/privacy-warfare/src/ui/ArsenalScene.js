// ─── ArsenalScene – Wave J ────────────────────────────────────────────────────
// Full Gunsmith DOM overlay: weapon browser, attachment slots, stat radar,
// ammo types, perk selector, loadout save slots, shooting range mini-game.
// Call openArsenal(onClose?) to show; closeArsenal() to hide.

import { WEAPON_CATALOG_DATA, WEAPON_CATALOG_BY_ID, createWeapon, getCatalogByClass, calcTTK, calcDPS }
  from '../entities/Weapon/WeaponCatalog.js';
import { SLOT_ORDER, SLOT_LABELS, getCompatibleAttachments }
  from '../entities/Weapon/AttachmentDefs.js';
import { ALL_AMMO } from '../entities/Weapon/AmmoTypes.js';
import { SLOT_1_PERKS, SLOT_2_PERKS, SLOT_3_PERKS } from '../entities/Weapon/PerkSystem.js';
import { getWeaponProgress } from '../entities/Weapon/WeaponProgression.js';
import { drawWeaponShape }   from '../entities/Weapon/WeaponBase.js';

const LOADOUT_KEY   = 'pw_loadouts_v2';
const CLASS_ORDER   = ['assault','smg','shotgun','lmg','sniper','marksman','pistol','special'];
const CLASS_LABELS  = { assault:'AR', smg:'SMG', shotgun:'SG', lmg:'LMG', sniper:'SNP', marksman:'MKM', pistol:'PST', special:'SPL' };
const STAT_KEYS     = ['damage','fireRate','accuracy','range','mobility','control','handling'];
const STAT_LBLS     = ['DAMAGE','F.RATE','ACCURACY','RANGE','MOBILITY','CONTROL','HANDLING'];

// ─── Module state ─────────────────────────────────────────────────────────────
let _overlay     = null;
let _previewCv   = null;
let _previewCtx  = null;
let _rafId       = null;
let _onClose     = null;

let _selClass    = 'assault';
let _selWpnId    = null;
let _weapon      = null;   // WeaponBase instance
let _activeSlot  = null;   // open attachment slot
let _perkTab     = 1;
let _loSlot      = 0;
let _loadouts    = [ null, null, null, null ];

// ─── Public API ───────────────────────────────────────────────────────────────
export function openArsenal(onClose) {
  _onClose = onClose || null;
  if (!_overlay) _build();
  _loadSaved();
  _overlay.style.display = 'flex';
  _selectClass('assault');
  _rafId = requestAnimationFrame(_previewLoop);
}

export function closeArsenal() {
  if (_overlay) _overlay.style.display = 'none';
  if (_rafId)   { cancelAnimationFrame(_rafId); _rafId = null; }
  if (_onClose) { _onClose(); _onClose = null; }
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const _CSS = `
#gs-overlay{position:fixed;inset:0;z-index:8000;background:rgba(0,2,8,.97);
  display:flex;flex-direction:column;font-family:"Share Tech Mono",monospace;color:#DDE8F0;overflow:hidden;}
#gs-hdr{display:flex;align-items:center;justify-content:space-between;
  padding:8px 18px;border-bottom:1px solid rgba(0,255,68,.2);height:46px;flex-shrink:0;
  background:rgba(0,255,68,.03);}
.gs-title{font-size:16px;font-weight:700;color:#0F4;letter-spacing:5px;}
.gs-sub{font-size:9px;color:rgba(0,255,68,.45);letter-spacing:2px;margin-top:1px;}
.gs-x{background:none;border:1px solid rgba(255,68,68,.5);color:#F44;padding:5px 14px;
  font-family:inherit;font-size:11px;letter-spacing:2px;cursor:pointer;}
.gs-x:hover{background:#F442;color:#fff;}
#gs-body{display:flex;flex:1;overflow:hidden;}

/* LEFT – weapon list */
#gs-left{width:200px;flex-shrink:0;border-right:1px solid rgba(0,255,68,.12);
  display:flex;flex-direction:column;overflow:hidden;}
#gs-cls-tabs{display:flex;flex-wrap:wrap;gap:2px;padding:6px;flex-shrink:0;
  border-bottom:1px solid rgba(0,255,68,.1);}
.gs-cls{flex:1;min-width:38px;padding:4px 2px;background:none;
  border:1px solid rgba(0,255,68,.2);color:#0F4;font-family:inherit;
  font-size:9px;letter-spacing:1px;cursor:pointer;text-align:center;}
.gs-cls.on{background:rgba(0,255,68,.15);color:#fff;border-color:#0F4;}
#gs-wpn-list{flex:1;overflow-y:auto;padding:5px;}
.gs-wrow{padding:7px 9px;margin-bottom:2px;border:1px solid transparent;
  cursor:pointer;border-radius:1px;}
.gs-wrow:hover{border-color:rgba(0,255,68,.25);background:rgba(0,255,68,.04);}
.gs-wrow.on{border-color:#0F4;background:rgba(0,255,68,.08);}
.gs-wn{font-size:11px;font-weight:700;margin-bottom:1px;}
.gs-wt{font-size:9px;color:#888;letter-spacing:1px;}

/* CENTER – preview + stats */
#gs-ctr{flex:1;display:flex;flex-direction:column;overflow:hidden;
  border-right:1px solid rgba(0,255,68,.12);}
#gs-cv{display:block;width:100%;height:160px;flex-shrink:0;
  border-bottom:1px solid rgba(0,255,68,.12);}
#gs-cscroll{flex:1;overflow-y:auto;padding:10px;}
#gs-radar{display:flex;justify-content:center;margin-bottom:10px;}
#gs-rsvg{width:190px;height:190px;}
.gs-sbr{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
.gs-sl{width:72px;font-size:9px;color:#888;letter-spacing:1px;flex-shrink:0;}
.gs-bar{flex:1;height:3px;background:rgba(0,255,68,.12);border-radius:2px;overflow:hidden;}
.gs-bfill{height:100%;background:#0F4;border-radius:2px;transition:width .25s;}
.gs-sv{width:26px;font-size:9px;text-align:right;color:#0F4;}
.gs-cbtrow{display:flex;gap:10px;margin:8px 0;padding:7px;
  border:1px solid rgba(0,255,68,.15);background:rgba(0,255,68,.02);}
.gs-cbt{flex:1;text-align:center;}
.gs-cbv{font-size:15px;font-weight:700;color:#0F4;}
.gs-cbl{font-size:8px;color:#888;letter-spacing:1px;margin-top:1px;}
.gs-lvlrow{margin-top:8px;padding:7px;border:1px solid rgba(68,136,255,.2);
  background:rgba(68,136,255,.03);}
.gs-lvlhdr{display:flex;justify-content:space-between;font-size:9px;margin-bottom:3px;}
.gs-lvln{color:#4488FF;font-weight:700;}
.gs-xpbar{height:3px;background:rgba(68,136,255,.15);border-radius:2px;overflow:hidden;}
.gs-xpfill{height:100%;background:#4488FF;border-radius:2px;transition:width .3s;}
.gs-sec{font-size:8px;letter-spacing:2px;color:#555;
  margin:10px 0 5px;border-top:1px solid rgba(0,255,68,.08);padding-top:7px;}
.gs-amrow{display:flex;flex-wrap:wrap;gap:3px;}
.gs-amchip{padding:3px 7px;font-size:8px;border:1px solid #333;cursor:pointer;
  letter-spacing:1px;color:#888;background:none;font-family:inherit;}
.gs-amchip:hover{border-color:#0F4;color:#0F4;}
.gs-amchip.on{border-color:#0F4;color:#fff;background:rgba(0,255,68,.1);}

/* RIGHT – attachments + perks */
#gs-right{width:250px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;}
#gs-rscroll{flex:1;overflow-y:auto;padding:10px;}
.gs-slot{display:flex;align-items:center;gap:6px;
  margin-bottom:5px;padding:5px 8px;
  border:1px solid rgba(0,255,68,.12);cursor:pointer;
  background:none;width:100%;font-family:inherit;color:#666;text-align:left;}
.gs-slot:hover{border-color:rgba(0,255,68,.4);color:#0F4;}
.gs-slot.has{border-color:rgba(0,255,68,.35);color:#DDE8F0;}
.gs-slot.open{border-color:#0F4;background:rgba(0,255,68,.07);}
.gs-slab{font-size:8px;letter-spacing:1px;width:72px;color:#555;flex-shrink:0;}
.gs-sval{font-size:10px;flex:1;}
.gs-sx{font-size:8px;color:#333;cursor:pointer;padding:1px 4px;}
.gs-sx:hover{color:#F44;}
#gs-picker{border:1px solid #0F4;background:rgba(0,8,2,.99);padding:6px;
  margin-bottom:6px;display:none;max-height:180px;overflow-y:auto;}
.gs-attopt{display:flex;align-items:center;gap:5px;padding:5px;
  cursor:pointer;border-bottom:1px solid rgba(0,255,68,.1);}
.gs-attopt:hover{background:rgba(0,255,68,.06);}
.gs-attopt.on{background:rgba(0,255,68,.12);}
.gs-an{font-size:10px;flex:1;}
.gs-am{font-size:8px;color:#888;}
.gs-ptabs{display:flex;gap:3px;margin-bottom:5px;}
.gs-ptab{flex:1;padding:4px;background:none;border:1px solid #333;
  font-family:inherit;font-size:8px;letter-spacing:1px;cursor:pointer;color:#555;}
.gs-ptab.s1.on{border-color:#4488FF;color:#4488FF;background:rgba(68,136,255,.08);}
.gs-ptab.s2.on{border-color:#FF4444;color:#FF4444;background:rgba(255,68,68,.08);}
.gs-ptab.s3.on{border-color:#FFCC00;color:#FFCC00;background:rgba(255,204,0,.08);}
.gs-prow{display:flex;align-items:center;gap:7px;padding:5px 7px;
  margin-bottom:3px;border:1px solid rgba(255,255,255,.07);cursor:pointer;}
.gs-prow:hover{border-color:#555;}
.gs-pico{font-size:15px;width:22px;text-align:center;}
.gs-pmid{flex:1;}
.gs-pn{font-size:10px;font-weight:700;}
.gs-pd{font-size:8px;color:#888;margin-top:1px;line-height:1.35;}

/* BOTTOM bar */
#gs-bot{border-top:1px solid rgba(0,255,68,.18);padding:8px 16px;
  display:flex;align-items:center;gap:10px;flex-shrink:0;height:52px;
  background:rgba(0,255,68,.02);}
#gs-lo-slots{display:flex;gap:4px;}
.gs-los{padding:5px 10px;background:none;border:1px solid #333;
  font-family:inherit;font-size:9px;letter-spacing:1px;cursor:pointer;color:#555;}
.gs-los.on{border-color:#0F4;color:#0F4;background:rgba(0,255,68,.07);}
.gs-los:hover{border-color:#0F4;color:#0F4;}
#gs-loname{flex:1;background:none;border:1px solid #333;padding:5px 9px;
  font-family:inherit;font-size:10px;color:#DDE8F0;outline:none;letter-spacing:1px;}
#gs-loname:focus{border-color:#0F4;}
.gs-savebtn{padding:5px 14px;background:rgba(0,255,68,.1);border:1px solid #0F4;
  color:#0F4;font-family:inherit;font-size:9px;letter-spacing:2px;cursor:pointer;}
.gs-savebtn:hover{background:rgba(0,255,68,.2);}
.gs-rangebtn{padding:5px 14px;background:none;border:1px solid rgba(255,136,0,.5);
  color:#FF8800;font-family:inherit;font-size:9px;letter-spacing:2px;cursor:pointer;}
.gs-rangebtn:hover{background:rgba(255,136,0,.1);}
#gs-wpn-list::-webkit-scrollbar,#gs-cscroll::-webkit-scrollbar,#gs-rscroll::-webkit-scrollbar{width:2px;}
#gs-wpn-list::-webkit-scrollbar-thumb,#gs-cscroll::-webkit-scrollbar-thumb,#gs-rscroll::-webkit-scrollbar-thumb{background:#0F428;}
`;

// ─── Build overlay ────────────────────────────────────────────────────────────
function _build() {
  if (!document.getElementById('gs-styles')) {
    const s = document.createElement('style');
    s.id = 'gs-styles';
    s.textContent = _CSS;
    document.head.appendChild(s);
  }

  _overlay = document.createElement('div');
  _overlay.id = 'gs-overlay';
  _overlay.innerHTML = `
<div id="gs-hdr">
  <div><div class="gs-title">GUNSMITH</div><div class="gs-sub">LOADOUT PROTOCOL — WAVE J</div></div>
  <button class="gs-x" id="gs-x">✕ CLOSE</button>
</div>
<div id="gs-body">
  <div id="gs-left">
    <div id="gs-cls-tabs"></div>
    <div id="gs-wpn-list"></div>
  </div>
  <div id="gs-ctr">
    <canvas id="gs-cv"></canvas>
    <div id="gs-cscroll">
      <div id="gs-radar"><svg id="gs-rsvg" viewBox="0 0 190 190"></svg></div>
      <div id="gs-sbars"></div>
      <div id="gs-cbtinfo"></div>
      <div id="gs-lvlbar"></div>
      <div class="gs-sec">AMMO TYPE</div>
      <div class="gs-amrow" id="gs-amrow"></div>
    </div>
  </div>
  <div id="gs-right">
    <div id="gs-rscroll">
      <div class="gs-sec">ATTACHMENTS</div>
      <div id="gs-picker"></div>
      <div id="gs-slots"></div>
      <div class="gs-sec">PERKS</div>
      <div class="gs-ptabs" id="gs-ptabs">
        <button class="gs-ptab s1 on" data-s="1">UTILITY</button>
        <button class="gs-ptab s2" data-s="2">COMBAT</button>
        <button class="gs-ptab s3" data-s="3">SURVIVAL</button>
      </div>
      <div id="gs-plist"></div>
    </div>
  </div>
</div>
<div id="gs-bot">
  <div id="gs-lo-slots"></div>
  <input id="gs-loname" placeholder="LOADOUT NAME" maxlength="22"/>
  <button class="gs-savebtn" id="gs-save">SAVE</button>
  <button class="gs-rangebtn" id="gs-range">⊕ RANGE</button>
</div>`;
  document.body.appendChild(_overlay);

  _previewCv  = document.getElementById('gs-cv');
  _previewCtx = _previewCv.getContext('2d');

  // Close
  document.getElementById('gs-x').addEventListener('click', closeArsenal);

  // Class tabs
  const tabsEl = document.getElementById('gs-cls-tabs');
  CLASS_ORDER.forEach(cls => {
    const b = document.createElement('button');
    b.className = 'gs-cls'; b.textContent = CLASS_LABELS[cls]; b.dataset.cls = cls;
    b.addEventListener('click', () => _selectClass(cls));
    tabsEl.appendChild(b);
  });

  // Perk tabs
  document.getElementById('gs-ptabs').addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    _perkTab = +b.dataset.s;
    document.querySelectorAll('.gs-ptab').forEach(t => t.classList.remove('on'));
    b.classList.add('on');
    _renderPerks();
  });

  // Save / Range
  document.getElementById('gs-save').addEventListener('click', _save);
  document.getElementById('gs-range').addEventListener('click', _openRange);

  // Loadout slots
  const slotsEl = document.getElementById('gs-lo-slots');
  for (let i = 0; i < 4; i++) {
    const b = document.createElement('button');
    b.className = 'gs-los' + (i === 0 ? ' on' : '');
    b.textContent = 'SLOT ' + (i + 1);
    b.dataset.i = i;
    b.addEventListener('click', () => {
      _loSlot = i;
      document.querySelectorAll('.gs-los').forEach((el, j) => el.classList.toggle('on', j === i));
      _loadSlot(i);
    });
    slotsEl.appendChild(b);
  }

  _renderAmmo();
}

// ─── Class + weapon selection ──────────────────────────────────────────────────
function _selectClass(cls) {
  _selClass = cls;
  document.querySelectorAll('.gs-cls').forEach(b => b.classList.toggle('on', b.dataset.cls === cls));
  _renderWpnList();
  const first = getCatalogByClass(cls)[0];
  if (first) _selectWeapon(first.id);
}

function _renderWpnList() {
  const el = document.getElementById('gs-wpn-list'); if (!el) return;
  el.innerHTML = '';
  getCatalogByClass(_selClass).forEach(def => {
    const prog = getWeaponProgress(def.id);
    const row  = document.createElement('div');
    row.className = 'gs-wrow' + (def.id === _selWpnId ? ' on' : '');
    row.innerHTML = `<div class="gs-wn" style="color:${def.col||'#0F4'}">${def.name}</div>
      <div class="gs-wt">LVL ${prog.level} · ${def.weaponClass.toUpperCase()}</div>`;
    row.addEventListener('click', () => _selectWeapon(def.id));
    el.appendChild(row);
  });
}

function _selectWeapon(id) {
  _selWpnId   = id;
  _weapon     = createWeapon(id);
  _activeSlot = null;
  document.querySelectorAll('.gs-wrow').forEach((r, i) => {
    r.classList.toggle('on', getCatalogByClass(_selClass)[i]?.id === id);
  });
  _renderCenter();
  _renderSlots();
  _renderPicker(null);
  _renderPerks();
}

// ─── Center panel ─────────────────────────────────────────────────────────────
function _renderCenter() {
  if (!_weapon) return;
  const def  = WEAPON_CATALOG_BY_ID[_selWpnId];
  const s    = _weapon.stats;
  const prog = getWeaponProgress(_selWpnId);

  // Stat bars
  document.getElementById('gs-sbars').innerHTML = STAT_KEYS.map((k, i) => {
    const v = Math.round(Math.max(0, Math.min(100, s[k] || 0)));
    return `<div class="gs-sbr">
      <div class="gs-sl">${STAT_LBLS[i]}</div>
      <div class="gs-bar"><div class="gs-bfill" style="width:${v}%"></div></div>
      <div class="gs-sv">${v}</div></div>`;
  }).join('');

  // Combat info
  const ttk = calcTTK(def, 100, 20);
  const dps = calcDPS(def);
  document.getElementById('gs-cbtinfo').innerHTML = `
    <div class="gs-cbtrow">
      <div class="gs-cbt"><div class="gs-cbv">${ttk === Infinity ? '∞' : ttk + 'ms'}</div><div class="gs-cbl">TTK @20m</div></div>
      <div class="gs-cbt"><div class="gs-cbv">${dps}</div><div class="gs-cbl">DPS</div></div>
      <div class="gs-cbt"><div class="gs-cbv">${_weapon.magazine}r</div><div class="gs-cbl">MAG</div></div>
      <div class="gs-cbt"><div class="gs-cbv">${_weapon.reserve}</div><div class="gs-cbl">RESERVE</div></div>
    </div>`;

  // Level bar
  document.getElementById('gs-lvlbar').innerHTML = `
    <div class="gs-lvlrow">
      <div class="gs-lvlhdr">
        <span>LVL <span class="gs-lvln">${prog.level}</span>/50</span>
        <span style="color:#888">${prog.kills} kills · ${prog.camo.toUpperCase()}</span>
      </div>
      <div class="gs-xpbar"><div class="gs-xpfill" style="width:${(prog.xpProgress()*100).toFixed(1)}%"></div></div>
    </div>`;

  _renderAmmo();
  _renderRadar();
}

// ─── Radar SVG ────────────────────────────────────────────────────────────────
function _renderRadar() {
  if (!_weapon) return;
  const svg  = document.getElementById('gs-rsvg'); if (!svg) return;
  const s    = _weapon.stats;
  const RKEYS = ['damage','fireRate','accuracy','range','mobility','control'];
  const RLBLS = ['DMG','RPM','ACC','RNG','MOB','CTL'];
  const N = RKEYS.length, cx = 95, cy = 95, r = 65;

  const pts = RKEYS.map((k, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const v = Math.max(0, Math.min(1, (s[k] || 0) / 100));
    return { x: cx + Math.cos(a) * r * v, y: cy + Math.sin(a) * r * v,
             ax: cx + Math.cos(a) * (r + 18), ay: cy + Math.sin(a) * (r + 18), lbl: RLBLS[i] };
  });

  const gridRings = [.25, .5, .75, 1].map(f => {
    const gp = RKEYS.map((_, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      return `${cx + Math.cos(a)*r*f},${cy + Math.sin(a)*r*f}`;
    }).join(' ');
    return `<polygon points="${gp}" fill="none" stroke="#0F4" stroke-width=".5" opacity=".18"/>`;
  }).join('');

  const spokes = RKEYS.map((_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return `<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*r}" y2="${cy+Math.sin(a)*r}" stroke="#0F4" stroke-width=".5" opacity=".25"/>`;
  }).join('');

  const polyPts = pts.map(p => `${p.x},${p.y}`).join(' ');
  const lbls    = pts.map(p => `<text x="${p.ax}" y="${p.ay}" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#0F4" font-family="monospace">${p.lbl}</text>`).join('');

  svg.innerHTML = gridRings + spokes +
    `<polygon points="${polyPts}" fill="rgba(0,255,68,.14)" stroke="#0F4" stroke-width="1.4"/>` + lbls;
}

// ─── Ammo types ───────────────────────────────────────────────────────────────
function _renderAmmo() {
  const el = document.getElementById('gs-amrow'); if (!el || !_weapon) return;
  const cur = _weapon.currentAmmoType || 'standard';
  el.innerHTML = '';
  ALL_AMMO.forEach(a => {
    const chip = document.createElement('button');
    chip.className = 'gs-amchip' + (a.id === cur ? ' on' : '');
    chip.textContent = a.name.toUpperCase().replace(' ','·');
    chip.title = a.desc;
    chip.addEventListener('click', () => { if (_weapon) { _weapon.currentAmmoType = a.id; _renderAmmo(); } });
    el.appendChild(chip);
  });
}

// ─── Attachment slots ─────────────────────────────────────────────────────────
function _renderSlots() {
  const el = document.getElementById('gs-slots'); if (!el || !_weapon) return;
  el.innerHTML = '';
  SLOT_ORDER.forEach(slot => {
    const att = _weapon.slots[slot];
    const btn = document.createElement('button');
    btn.className = 'gs-slot' + (att ? ' has' : '') + (_activeSlot === slot ? ' open' : '');
    btn.dataset.slot = slot;
    btn.innerHTML = `<span class="gs-slab">${SLOT_LABELS[slot]||slot}</span>
      <span class="gs-sval" style="color:${att?'#0F4':'#333'}">${att ? att.name : '— EMPTY —'}</span>
      ${att ? `<span class="gs-sx" data-clr="${slot}">✕</span>` : ''}`;
    btn.addEventListener('click', e => {
      if (e.target.dataset.clr) { _clearSlot(e.target.dataset.clr); return; }
      _activeSlot = (_activeSlot === slot) ? null : slot;
      _renderSlots();
      _renderPicker(_activeSlot);
    });
    el.appendChild(btn);
  });
}

function _renderPicker(slot) {
  const el = document.getElementById('gs-picker'); if (!el) return;
  if (!slot || !_weapon) { el.style.display = 'none'; return; }
  const def     = WEAPON_CATALOG_BY_ID[_selWpnId];
  // Pass level 50 so Gunsmith shows all compatible attachments regardless of progression
  const options = getCompatibleAttachments(slot, def?.weaponClass || 'assault', 50);
  if (!options.length) {
    el.innerHTML = '<div style="padding:6px;font-size:9px;color:#555">No attachments for this slot/class</div>';
    el.style.display = 'block'; return;
  }
  const curAtt = _weapon.slots[slot];
  el.style.display = 'block';
  el.innerHTML = options.map(a => {
    const modStr = Object.entries(a.modifiers||{}).map(([k,v])=>`${k} ${v>0?'+':''}${v}`).join(' · ') || '—';
    return `<div class="gs-attopt ${curAtt?.id===a.id?'on':''}" data-aid="${a.id}">
      <span class="gs-an">${a.name}</span>
      <span class="gs-am">${modStr}</span></div>`;
  }).join('');
  el.querySelectorAll('.gs-attopt').forEach(opt => {
    opt.addEventListener('click', () => {
      const att = options.find(a => a.id === opt.dataset.aid);
      if (att) _weapon.equip(slot, att);
      _renderSlots();
      _renderPicker(slot);
      _renderCenter();
    });
  });
}

function _clearSlot(slot) {
  if (_weapon) _weapon.equip(slot, null);
  _renderSlots();
  _renderCenter();
}

// ─── Perks ────────────────────────────────────────────────────────────────────
function _renderPerks() {
  const el = document.getElementById('gs-plist'); if (!el) return;
  const perks  = _perkTab === 1 ? SLOT_1_PERKS : _perkTab === 2 ? SLOT_2_PERKS : SLOT_3_PERKS;
  const colMap = { 1:'#4488FF', 2:'#FF4444', 3:'#FFCC00' };
  const col    = colMap[_perkTab];
  el.innerHTML = '';
  perks.forEach(p => {
    const row = document.createElement('div');
    row.className = 'gs-prow';
    row.style.borderColor = col + '22';
    row.innerHTML = `<div class="gs-pico">${p.icon}</div>
      <div class="gs-pmid">
        <div class="gs-pn" style="color:${col}">${p.name}</div>
        <div class="gs-pd">${p.desc}</div>
      </div>`;
    el.appendChild(row);
  });
}

// ─── Loadout save / load ──────────────────────────────────────────────────────
function _save() {
  if (!_weapon) return;
  const nameEl = document.getElementById('gs-loname');
  _loadouts[_loSlot] = {
    name: nameEl?.value || 'LOADOUT ' + (_loSlot + 1),
    weaponId: _selWpnId,
    ammoType: _weapon.currentAmmoType,
  };
  try { localStorage.setItem(LOADOUT_KEY, JSON.stringify(_loadouts)); } catch (_) {}
  _updateSlotBtns();
  const btn = document.getElementById('gs-save');
  if (btn) { const o = btn.textContent; btn.textContent = 'SAVED ✓'; setTimeout(() => btn.textContent = o, 1200); }
}

function _loadSaved() {
  try {
    const d = JSON.parse(localStorage.getItem(LOADOUT_KEY) || 'null');
    if (Array.isArray(d)) _loadouts = d;
  } catch (_) {}
  _updateSlotBtns();
}

function _loadSlot(i) {
  const lo = _loadouts[i]; if (!lo?.weaponId) return;
  const nameEl = document.getElementById('gs-loname');
  if (nameEl) nameEl.value = lo.name || '';
  const def = WEAPON_CATALOG_BY_ID[lo.weaponId]; if (!def) return;
  _selectClass(def.weaponClass);
  _selectWeapon(lo.weaponId);
  if (lo.ammoType && _weapon) _weapon.currentAmmoType = lo.ammoType;
  _renderAmmo();
}

function _updateSlotBtns() {
  document.querySelectorAll('.gs-los').forEach((b, i) => {
    b.textContent = _loadouts[i]?.name || 'SLOT ' + (i + 1);
  });
}

// ─── Preview render loop ──────────────────────────────────────────────────────
function _previewLoop() {
  if (!_overlay || _overlay.style.display === 'none') { _rafId = null; return; }
  _drawPreview();
  _rafId = requestAnimationFrame(_previewLoop);
}

function _drawPreview() {
  const cv = _previewCv; if (!cv) return;
  const W  = cv.width  = cv.offsetWidth;
  const H  = cv.height = cv.offsetHeight;
  if (W <= 0 || H <= 0) return;
  const ctx = _previewCtx;

  ctx.fillStyle = 'rgba(0,10,4,.65)';
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,255,68,.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Weapon silhouette
  const def = WEAPON_CATALOG_BY_ID[_selWpnId];
  if (def) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    const sc = Math.min(W / 280, H / 100) * 0.88;
    ctx.scale(sc, sc);
    drawWeaponShape(ctx, 260, 90, def.weaponClass, def.col || '#0F4');
    ctx.restore();
  }

  // Name tag
  if (def) {
    ctx.font = `bold 13px "Share Tech Mono",monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = (def.col || '#0F4') + 'CC';
    ctx.fillText(def.name, 14, H - 14);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText((def.weaponClass || '').toUpperCase() + ' · ' + (def.tag || ''), 14, H - 26);
    ctx.textAlign = 'left';
  }
}

// ─── Shooting Range mini-game ─────────────────────────────────────────────────
function _openRange() {
  const existing = document.getElementById('gs-range-wrap');
  if (existing) { existing.remove(); return; }

  const wrap = document.createElement('div');
  wrap.id = 'gs-range-wrap';
  wrap.style.cssText = `position:absolute;inset:0;background:rgba(0,2,8,.98);z-index:10;
    display:flex;flex-direction:column;align-items:center;justify-content:center;`;

  const cv = document.createElement('canvas');
  cv.width = 680; cv.height = 340;
  cv.style.cssText = 'border:1px solid rgba(0,255,68,.3);cursor:crosshair;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ EXIT RANGE';
  closeBtn.style.cssText = 'margin-top:12px;padding:7px 22px;background:none;border:1px solid #F44;color:#F44;font-family:inherit;cursor:pointer;letter-spacing:2px;';
  closeBtn.addEventListener('click', () => wrap.remove());

  const stats = document.createElement('div');
  stats.style.cssText = 'margin-top:8px;font-size:10px;color:#888;letter-spacing:2px;';
  stats.textContent = 'CLICK TARGETS — COMPARE WEAPON FEEL';

  wrap.appendChild(cv); wrap.appendChild(stats); wrap.appendChild(closeBtn);
  _overlay.appendChild(wrap);

  _runRange(cv, stats);
}

function _runRange(cv, statsEl) {
  const ctx  = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let targets   = [];
  let shots = 0, hits = 0;
  let mx = W/2, my = H/2;
  let recoilX = 0, recoilY = 0;
  let _cd = 0;

  const spawn = () => targets.push({
    x: 60 + Math.random() * (W - 120), y: 50 + Math.random() * (H - 100),
    r: 18 + Math.random() * 18, hp: 3, maxHp: 3, timer: 3.5 + Math.random() * 2.5,
  });
  for (let i = 0; i < 5; i++) spawn();

  cv.addEventListener('mousemove', e => {
    const rc = cv.getBoundingClientRect();
    mx = (e.clientX - rc.left) * (W / rc.width);
    my = (e.clientY - rc.top)  * (H / rc.height);
  });

  const fire = () => {
    if (_cd > 0 || !_weapon) return;
    const rpm = 60 + (_weapon.stats?.fireRate || 50) * 11.4;
    _cd = 60 / rpm;
    const spread = (100 - (_weapon.stats?.accuracy || 50)) * 0.005;
    const sx = mx + (Math.random()-.5) * spread * 120 + recoilX;
    const sy = my + (Math.random()-.5) * spread * 120 + recoilY;
    shots++;
    let hit = false;
    for (const t of targets) {
      if (Math.hypot(sx - t.x, sy - t.y) < t.r) {
        t.hp--;
        hit = true;
        if (t.hp <= 0) { targets.splice(targets.indexOf(t), 1); spawn(); }
        break;
      }
    }
    if (hit) hits++;
    const rAmt = (100 - (_weapon.stats?.control || 50)) * 0.0025;
    recoilX += (Math.random()-.5) * rAmt * 32;
    recoilY -= rAmt * 18;
    statsEl.textContent = `SHOTS: ${shots}  HITS: ${hits}  ACCURACY: ${shots ? ((hits/shots)*100).toFixed(1) : 0}%`;
  };

  cv.addEventListener('mousedown', fire);

  let last = performance.now(), running = true;
  const loop = (now) => {
    if (!document.getElementById('gs-range-wrap')) { running = false; return; }
    const dt = Math.min((now - last) / 1000, .05); last = now;
    _cd = Math.max(0, _cd - dt);
    recoilX *= .82; recoilY *= .82;
    for (let i = targets.length - 1; i >= 0; i--) {
      targets[i].timer -= dt;
      if (targets[i].timer <= 0) { targets.splice(i, 1); spawn(); }
    }

    ctx.fillStyle = '#00080A'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,255,68,.06)'; ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

    for (const t of targets) {
      const a   = Math.min(1, t.timer);
      const pct = t.hp / t.maxHp;
      ctx.save(); ctx.globalAlpha = a;
      const col = `rgb(255,${Math.round(pct*180)},0)`;
      const grd = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r * 1.6);
      grd.addColorStop(0, col + '44'); grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(t.x, t.y, t.r*1.6, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      [1, .55, .22].forEach(f => { ctx.beginPath(); ctx.arc(t.x, t.y, t.r*f, 0, Math.PI*2); ctx.stroke(); });
      ctx.fillStyle = '#111'; ctx.fillRect(t.x - t.r, t.y + t.r + 5, t.r*2, 3);
      ctx.fillStyle = col; ctx.fillRect(t.x - t.r, t.y + t.r + 5, t.r*2*pct, 3);
      ctx.restore();
    }

    // Crosshair
    const sp = (100 - (_weapon?.stats?.accuracy || 50)) * .45;
    ctx.strokeStyle = '#0F4'; ctx.lineWidth = 1.2;
    [ [-1,0,-15,-sp-2], [1,0,15,sp+2], [0,-1,-15,-sp-2], [0,1,15,sp+2] ].forEach(([dx,dy,s1,s2]) => {
      ctx.beginPath();
      ctx.moveTo(mx + dx*Math.abs(s1), my + dy*Math.abs(s1));
      ctx.lineTo(mx + dx*Math.abs(s2), my + dy*Math.abs(s2));
      ctx.stroke();
    });
    ctx.fillStyle = '#0F4'; ctx.beginPath();
    ctx.arc(mx + recoilX, my + recoilY, 2, 0, Math.PI*2); ctx.fill();

    if (running) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
