// ui/Modal.js — DOM modals: skill upgrade, shop, settings, skill tree

import { progression } from '../data/Progression.js';
import { Storage } from '../data/Storage.js';
import { device } from '../utils/Device.js';
import { bus } from '../utils/EventBus.js';

// ── Quality settings ──────────────────────────────────────────────────────
export function loadSettings() {
  return Storage.get('settings', { quality: 'high', haptic: true, autoAdjust: false });
}

export function saveSettings(s) {
  Storage.set('settings', s);
}

// ── Skill tree modal ──────────────────────────────────────────────────────
export function openSkillTreeModal(onClose) {
  const existing = document.getElementById('skill-tree-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'skill-tree-modal';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '65',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
    fontFamily: "'JetBrains Mono','Courier New',monospace",
  });

  const inner = document.createElement('div');
  Object.assign(inner.style, {
    background: 'linear-gradient(160deg,#0d0022,#050508)',
    border: '1px solid rgba(168,85,247,0.4)',
    borderRadius: '16px', padding: '28px', maxWidth: '540px',
    width: '92%', maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 0 60px rgba(168,85,247,0.15)',
  });

  const sp = progression.sp;
  inner.innerHTML = `<div style="text-align:center;margin-bottom:20px">
    <div style="font-size:17px;font-weight:900;color:#a855f7;letter-spacing:.16em;text-transform:uppercase">Skill Matrix</div>
    <div style="font-size:12px;color:rgba(168,85,247,0.7);margin-top:4px">Skill Points: <span id="stm-sp">${sp}</span> SP</div>
  </div><div id="stm-nodes"></div>
  <button id="stm-close" style="width:100%;margin-top:14px;padding:11px;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.4);border-radius:8px;color:#a855f7;font-weight:800;font-size:13px;cursor:pointer;letter-spacing:.1em;font-family:inherit">Close</button>`;

  const nodesEl = inner.querySelector('#stm-nodes');
  const renderNodes = () => {
    nodesEl.innerHTML = '';
    for (const def of progression.defs) {
      const lvl = progression.getLevel(def.id);
      const maxed = lvl >= def.maxLevel;
      const canBuy = progression.canBuy(def.id);
      const card = document.createElement('div');
      Object.assign(card.style, {
        background: maxed ? 'rgba(168,85,247,0.18)' : 'rgba(168,85,247,0.05)',
        border: `1px solid rgba(168,85,247,${maxed ? 0.7 : canBuy ? 0.35 : 0.15})`,
        borderRadius: '10px', padding: '14px 16px', marginBottom: '8px',
        cursor: canBuy ? 'pointer' : 'default', transition: 'all .15s',
        opacity: (!canBuy && !maxed) ? '0.5' : '1',
      });
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:13px;font-weight:800;color:#fff;letter-spacing:.1em;text-transform:uppercase">${def.name}${maxed ? ' ✓' : ''}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px">${def.desc}</div>
          </div>
          <div style="text-align:right;min-width:70px">
            <div style="font-size:11px;color:rgba(168,85,247,0.8)">${lvl}/${def.maxLevel}</div>
            ${maxed ? '' : `<div style="font-size:10px;color:#39FF14;margin-top:2px">${def.cost} SP</div>`}
          </div>
        </div>`;
      if (canBuy) {
        card.addEventListener('click', () => {
          if (progression.buy(def.id)) {
            inner.querySelector('#stm-sp').textContent = progression.sp;
            renderNodes();
            bus.emit('sfx', 'upgrade');
          }
        });
        card.addEventListener('mouseenter', () => { card.style.background = 'rgba(168,85,247,0.25)'; });
        card.addEventListener('mouseleave', () => { card.style.background = 'rgba(168,85,247,0.05)'; });
      }
      nodesEl.appendChild(card);
    }
  };
  renderNodes();

  inner.querySelector('#stm-close').addEventListener('click', () => {
    overlay.remove();
    if (onClose) onClose();
  });

  overlay.appendChild(inner);
  document.body.appendChild(overlay);
}

// ── Settings modal ────────────────────────────────────────────────────────
export function openSettingsModal(onClose) {
  const existing = document.getElementById('settings-modal');
  if (existing) existing.remove();

  const settings = loadSettings();

  const overlay = document.createElement('div');
  overlay.id = 'settings-modal';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '65',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
    fontFamily: "'JetBrains Mono','Courier New',monospace",
  });

  const inner = document.createElement('div');
  Object.assign(inner.style, {
    background: 'linear-gradient(160deg,#0a0a14,#050508)',
    border: '1px solid rgba(168,85,247,0.3)',
    borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '92%',
    boxShadow: '0 0 40px rgba(168,85,247,0.1)',
  });

  inner.innerHTML = `
    <div style="font-size:16px;font-weight:900;color:#a855f7;letter-spacing:.16em;text-align:center;margin-bottom:20px;text-transform:uppercase">Settings</div>

    <div style="margin-bottom:16px">
      <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:.14em;margin-bottom:8px;text-transform:uppercase">Quality</div>
      <div style="display:flex;gap:8px">
        ${['low','medium','high'].map(q => `
          <button class="q-btn" data-q="${q}" style="flex:1;padding:8px 4px;border-radius:7px;font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border:1px solid rgba(168,85,247,${settings.quality===q?'0.8':'0.2'});background:rgba(168,85,247,${settings.quality===q?'0.25':'0.05'});color:${settings.quality===q?'#a855f7':'rgba(255,255,255,0.4)'};">${q}</button>
        `).join('')}
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
      <div>
        <div style="font-size:12px;color:#fff;font-weight:700">Haptic Feedback</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35)">Vibration on hit/shoot</div>
      </div>
      <button id="haptic-toggle" style="padding:6px 14px;border-radius:6px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;border:1px solid rgba(57,255,20,${settings.haptic?'0.5':'0.15'});background:rgba(57,255,20,${settings.haptic?'0.15':'0.03'});color:${settings.haptic?'#39FF14':'rgba(255,255,255,0.3)'}">${settings.haptic?'ON':'OFF'}</button>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
      <div>
        <div style="font-size:12px;color:#fff;font-weight:700">Auto-Adjust Quality</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35)">FPS-based quality scaling</div>
      </div>
      <button id="auto-toggle" style="padding:6px 14px;border-radius:6px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;border:1px solid rgba(57,255,20,${settings.autoAdjust?'0.5':'0.15'});background:rgba(57,255,20,${settings.autoAdjust?'0.15':'0.03'});color:${settings.autoAdjust?'#39FF14':'rgba(255,255,255,0.3)'}">${settings.autoAdjust?'ON':'OFF'}</button>
    </div>

    <button id="settings-close" style="width:100%;padding:11px;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.4);border-radius:8px;color:#a855f7;font-weight:800;font-size:13px;cursor:pointer;letter-spacing:.1em;font-family:inherit">Save & Close</button>
  `;

  // Quality buttons
  inner.querySelectorAll('.q-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      settings.quality = btn.dataset.q;
      inner.querySelectorAll('.q-btn').forEach(b => {
        const active = b.dataset.q === settings.quality;
        b.style.border = `1px solid rgba(168,85,247,${active ? 0.8 : 0.2})`;
        b.style.background = `rgba(168,85,247,${active ? 0.25 : 0.05})`;
        b.style.color = active ? '#a855f7' : 'rgba(255,255,255,0.4)';
      });
    });
  });

  // Haptic toggle
  const hapticBtn = inner.querySelector('#haptic-toggle');
  hapticBtn.addEventListener('click', () => {
    settings.haptic = !settings.haptic;
    hapticBtn.textContent = settings.haptic ? 'ON' : 'OFF';
    hapticBtn.style.border = `1px solid rgba(57,255,20,${settings.haptic ? 0.5 : 0.15})`;
    hapticBtn.style.background = `rgba(57,255,20,${settings.haptic ? 0.15 : 0.03})`;
    hapticBtn.style.color = settings.haptic ? '#39FF14' : 'rgba(255,255,255,0.3)';
    device.setHaptic(settings.haptic);
  });

  // Auto-adjust toggle
  const autoBtn = inner.querySelector('#auto-toggle');
  autoBtn.addEventListener('click', () => {
    settings.autoAdjust = !settings.autoAdjust;
    autoBtn.textContent = settings.autoAdjust ? 'ON' : 'OFF';
    autoBtn.style.border = `1px solid rgba(57,255,20,${settings.autoAdjust ? 0.5 : 0.15})`;
    autoBtn.style.background = `rgba(57,255,20,${settings.autoAdjust ? 0.15 : 0.03})`;
    autoBtn.style.color = settings.autoAdjust ? '#39FF14' : 'rgba(255,255,255,0.3)';
  });

  inner.querySelector('#settings-close').addEventListener('click', () => {
    saveSettings(settings);
    device.setHaptic(settings.haptic);
    bus.emit('quality:changed', settings.quality);
    overlay.remove();
    if (onClose) onClose(settings);
  });

  overlay.appendChild(inner);
  document.body.appendChild(overlay);
}

// ── Wave skill choose modal ───────────────────────────────────────────────
const WAVE_SKILLS = [
  { n: 'RAPID FIRE',    d: '+25% fire rate',         apply: (p, gs) => p.wpns.forEach(w => { w.cd *= 0.75; }) },
  { n: 'DAMAGE BOOST',  d: '+30% weapon damage',     apply: (p, gs) => p.wpns.forEach(w => { w.dmg *= 1.3; }) },
  { n: 'SHIELD UP',     d: '+1 max HP',              apply: (p, gs) => { p.maxHp++; p.hp = Math.min(p.hp + 1, p.maxHp); } },
  { n: 'SPEED DAEMON',  d: '+20% movement',          apply: (p, gs) => { p.speed *= 1.2; } },
  { n: 'RANGE EXTEND',  d: '+20% weapon range',      apply: (p, gs) => p.wpns.forEach(w => { w.rng *= 1.2; }) },
  { n: 'CD MASTER',     d: '-20% ability cooldowns', apply: (p, gs) => { p.abilityCDMult *= 0.8; } },
  { n: 'GHOST FORM',    d: 'Invincibility +2s on hit',apply: (p, gs) => { p.ghostBonusTime += 2; } },
  { n: 'COMBO KEEPER',  d: 'Combo decays 30% slower',apply: (p, gs) => { p.comboDecayMult *= 0.7; } },
  { n: 'CHAIN MASTER',  d: 'Chain hits +2 targets',  apply: (p, gs) => { p.chainExtraTargets += 2; } },
  { n: 'CREDIT RUSH',   d: '+200 credits',           apply: (p, gs) => { if (gs) gs.credits += 200; } },
];

export function openWaveSkillModal(player, gameState, onClose) {
  const existing = document.getElementById('wave-skill-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wave-skill-modal';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '60',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
    fontFamily: "'JetBrains Mono','Courier New',monospace",
  });

  const inner = document.createElement('div');
  Object.assign(inner.style, {
    background: 'linear-gradient(160deg,#0d0022,#050508)',
    border: '1px solid rgba(168,85,247,0.35)',
    borderRadius: '16px', padding: '32px', maxWidth: '520px', width: '90%',
    boxShadow: '0 0 60px rgba(168,85,247,0.15)',
  });

  const title = document.createElement('div');
  Object.assign(title.style, { fontSize: '17px', fontWeight: '900', color: '#BF00FF', letterSpacing: '.16em', textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase' });
  title.textContent = 'Choose an Upgrade';
  inner.appendChild(title);

  const pool = [...WAVE_SKILLS];
  const choices = [];
  for (let i = 0; i < 3 && pool.length; i++)
    choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);

  choices.forEach(s => {
    const card = document.createElement('div');
    Object.assign(card.style, {
      background: 'rgba(191,0,255,0.06)', border: '1px solid rgba(191,0,255,0.18)',
      borderRadius: '10px', padding: '16px 18px', marginBottom: '10px',
      cursor: 'pointer', transition: 'all .15s',
    });
    card.innerHTML = `<div style="font-size:13px;font-weight:800;color:#fff;letter-spacing:.12em;text-transform:uppercase">${s.n}</div><div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px">${s.d}</div>`;
    card.addEventListener('click', () => {
      s.apply(player, gameState);
      bus.emit('sfx', 'upgrade');
      overlay.remove();
      if (onClose) onClose();
    });
    card.addEventListener('mouseenter', () => { card.style.background = 'rgba(191,0,255,0.2)'; card.style.borderColor = 'rgba(191,0,255,0.65)'; card.style.transform = 'translateX(4px)'; });
    card.addEventListener('mouseleave', () => { card.style.background = 'rgba(191,0,255,0.06)'; card.style.borderColor = 'rgba(191,0,255,0.18)'; card.style.transform = ''; });
    inner.appendChild(card);
  });

  overlay.appendChild(inner);
  document.body.appendChild(overlay);
}

// ── Shop modal ────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { n: 'HEALTH PACK',    d: 'Restore 1 HP',                   cost: 80,  apply: (p) => { p.hp = Math.min(p.hp + 1, p.maxHp); } },
  { n: 'AMMO BOOST',     d: 'Reset all weapon cooldowns',     cost: 120, apply: (p) => { p.wpnCDs.fill(0); } },
  { n: 'OVERCLOCK CHIP', d: '-10% ability cooldowns',         cost: 150, apply: (p) => { p.abilityCDMult *= 0.9; } },
  { n: 'DEFUSE KIT',     d: 'Clear all enemy projectiles',    cost: 90,  apply: (p, gs) => { gs.projManager.clear(); } },
  { n: 'SKIN CYCLE',     d: 'Next player skin',               cost: 30,  apply: (p) => { p.skinIdx = (p.skinIdx + 1) % 5; } },
  { n: 'CREDIT SURGE',   d: '+500 credits',                   cost: 200, apply: (p, gs) => { gs.credits += 500; } },
];

export function openShopModal(player, gameState, onClose) {
  const existing = document.getElementById('shop-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'shop-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '60',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
    fontFamily: "'JetBrains Mono','Courier New',monospace",
  });

  const inner = document.createElement('div');
  Object.assign(inner.style, {
    background: 'linear-gradient(160deg,#020012,#050508)',
    border: '1px solid rgba(0,255,65,0.2)',
    borderRadius: '16px', padding: '26px', maxWidth: '480px', width: '90%',
    boxShadow: '0 0 50px rgba(0,255,65,0.08)',
  });

  const buildShop = () => {
    inner.innerHTML = '';
    inner.innerHTML = `
      <div style="font-size:15px;font-weight:900;color:#00FF41;letter-spacing:.16em;text-align:center;margin-bottom:4px;text-transform:uppercase">NPM Marketplace</div>
      <div style="font-size:11px;color:rgba(0,255,65,0.55);text-align:center;margin-bottom:16px">&#x2B21; <span id="shop-cr">${gameState.credits}</span> Credits</div>
      <div id="shop-list"></div>
      <button id="shop-close" style="width:100%;margin-top:8px;padding:10px;background:rgba(0,255,65,0.1);border:1px solid rgba(0,255,65,0.25);border-radius:6px;color:#00FF41;font-weight:800;cursor:pointer;letter-spacing:.08em;font-family:inherit">Close</button>
    `;
    const list = inner.querySelector('#shop-list');
    for (const item of SHOP_ITEMS) {
      const canAfford = gameState.credits >= item.cost;
      const row = document.createElement('div');
      Object.assign(row.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.12)', borderRadius: '8px', padding: '11px 14px', marginBottom: '7px' });
      row.innerHTML = `
        <div><div style="font-size:12px;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${item.n}</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">${item.d}</div></div>
        <button style="padding:6px 16px;background:rgba(0,255,65,${canAfford?'0.15':'0.03'});border:1px solid rgba(0,255,65,${canAfford?'0.35':'0.1'});border-radius:5px;color:${canAfford?'#00FF41':'rgba(255,255,255,0.2)'};font-size:11px;font-weight:800;cursor:${canAfford?'pointer':'default'};font-family:inherit;letter-spacing:.08em">${item.cost}&#x2B21;</button>
      `;
      const buyBtn = row.querySelector('button');
      if (canAfford) {
        buyBtn.addEventListener('click', () => {
          if (gameState.credits < item.cost) return;
          gameState.credits -= item.cost;
          item.apply(player, gameState);
          bus.emit('sfx', 'upgrade');
          buildShop();
        });
      }
      list.appendChild(row);
    }
    inner.querySelector('#shop-close').addEventListener('click', () => { overlay.remove(); if (onClose) onClose(); });
  };

  buildShop();
  overlay.appendChild(inner);
  document.body.appendChild(overlay);
}
