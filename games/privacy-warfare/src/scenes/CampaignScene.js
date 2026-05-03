// ─── CampaignScene ────────────────────────────────────────────────────────────
// HTML-based campaign map — premium zone grid + detail panel.
// Renders via DOM (no canvas drawing) for clean, readable UI.

import { CampaignSave } from '../data/CampaignSave.js';
import { openLoadout }  from '../ui/LoadoutModal.js';

const ZONE_NAMES = [
  'FIREWALL', 'PHISH NET', 'DARKWEB', 'BOTNET', 'RANSOMWARE',
  'SPYWARE', 'TROJANS', 'ROOTKIT', 'CRYPTOVAULT', 'ZERO-DAY',
  'DDOS CORE', 'MITM NODE', 'EXFILTRAT', 'DEEPFAKE', 'AI THREAT',
  'SHADOWNET', 'QUANTUM ERR', 'VOID SHARD', 'SYS ADMIN', 'NEXUS',
];

const BOSS_NAMES = [
  'IGNIS PRIME',  'PHISH QUEEN', 'DARKMASTER',   'BOT OVERLORD',  'RANSOM KING',
  'EYE SPIDER',   'TROJAN HORSE','ROOT DAEMON',  'CRYPTO WRAITH', '0DAY GHOST',
  'DDoS HYDRA',   'MITM SHADE',  'DATA KRAKEN',  'DEEP FAKER',    'AI DOMINION',
  'SHADOW LORD',  'QUANTUM RIFT','VOID HERALD',  'SYSADM1N',      'NEXUS OMEGA',
];

const CATS = [
  { name: 'FIREWALL',     color: '#FF4422' },
  { name: 'INFILTRATION', color: '#00FFEE' },
  { name: 'NETWORK',      color: '#BF00FF' },
  { name: 'AI THREAT',    color: '#FFD700' },
  { name: 'NEXUS',        color: '#E0E0FF' },
];

function catOf(z) { return CATS[Math.floor(z / 4)]; }

export class CampaignScene {
  constructor(cv, ctx, gameScene) {
    this.cv        = cv;
    this.ctx       = ctx;
    this.gameScene = gameScene;
    this.save      = new CampaignSave();
    this._sel      = 0;
    this._modal    = null;
    this._onKey    = e => this._handleKey(e);
    this._activeFilter = -1; // -1 = all
  }

  enter() {
    this.save._load();
    this._modal = document.getElementById('campaign-modal');
    if (!this._modal) return;
    this._modal.style.display = 'flex';
    this._buildGrid();
    this._selectZone(this._sel, true);
    this._wireTabs();
    document.getElementById('cp-back-btn')?.addEventListener('click', () => this._goBack());
    document.addEventListener('keydown', this._onKey);
  }

  exit() {
    if (this._modal) this._modal.style.display = 'none';
    document.removeEventListener('keydown', this._onKey);
  }

  update(dt) {
    // Clear canvas while HTML modal is shown
    const ctx = this.ctx;
    if (ctx) {
      ctx.fillStyle = '#020108';
      ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    }
  }

  // ─── Build zone grid ────────────────────────────────────────────────────────

  _buildGrid() {
    const grid = document.getElementById('cp-zone-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const card = this._makeCard(i);
      grid.appendChild(card);
    }
  }

  _makeCard(i) {
    const cat     = catOf(i);
    const unl     = this.save.isZoneUnlocked(i);
    const prog    = this._progress(i);
    const cleared = prog >= 10;

    const div = document.createElement('div');
    div.className = `cp-zone-card${!unl ? ' cp-locked' : ''}${cleared ? ' cp-cleared' : ''}`;
    div.dataset.zone = i;
    div.dataset.cat  = Math.floor(i / 4);
    div.style.setProperty('--zc', cleared ? '#00CC44' : cat.color);

    const statusTxt = !unl ? 'LOCKED'
      : cleared            ? '✓ CLEARED'
      : prog > 0           ? `${prog}/10 LEVELS`
                           : 'AVAILABLE';
    div.innerHTML = `
      <div class="cp-znum">ZONE ${String(i+1).padStart(2,'0')}</div>
      <div class="cp-zname">${ZONE_NAMES[i]}</div>
      <div class="cp-zprog-wrap"><div class="cp-zprog" style="width:${prog*10}%"></div></div>
      <div class="cp-zstatus">${statusTxt}</div>
    `;
    div.addEventListener('click', () => this._selectZone(i));
    return div;
  }

  _progress(z) {
    let n = 0;
    for (let l = 0; l < 10; l++) if (this.save.isLevelComplete(z, l)) n++;
    return n;
  }

  // ─── Select zone ────────────────────────────────────────────────────────────

  _selectZone(i, noScroll) {
    this._sel = i;
    document.querySelectorAll('.cp-zone-card').forEach(c => c.classList.remove('cp-selected'));
    const card = document.querySelector(`[data-zone="${i}"]`);
    if (card) {
      card.classList.add('cp-selected');
      if (!noScroll) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    this._renderDetail(i);
  }

  // ─── Detail panel ───────────────────────────────────────────────────────────

  _renderDetail(z) {
    const panel = document.getElementById('cp-detail');
    if (!panel) return;
    const cat     = catOf(z);
    const unl     = this.save.isZoneUnlocked(z);
    const prog    = this._progress(z);
    const cleared = prog >= 10;
    const threat  = (z + 1) / 20;

    const badgeCls = !unl ? 'locked' : cleared ? 'cleared' : 'unlocked';
    const badgeTxt = !unl ? '⬡ LOCKED ZONE' : cleared ? '● ZONE CLEARED' : '● ACTIVE ZONE';

    const lvlCells = Array.from({ length: 10 }, (_, l) => {
      const done  = this.save.isLevelComplete(z, l);
      const avail = unl;
      const cls   = done ? 'done' : avail ? 'avail' : 'locked';
      return `<div class="cp-d-lvl ${cls}">L${l+1}</div>`;
    }).join('');

    const actionHTML = unl
      ? `<button class="cp-deploy-btn" id="cp-deploy-now" style="border-color:${cat.color};color:${cat.color};background:rgba(${_rgb(cat.color)},0.1)">DEPLOY TO ZONE ${z+1}</button>`
      : `<div class="cp-locked-msg">Complete zone ${z} to unlock this sector</div>`;

    panel.innerHTML = `
      <div class="cp-d-cat" style="color:${cat.color}">${cat.name} · ZONE ${z+1}</div>
      <div class="cp-d-zone-name">${ZONE_NAMES[z]}</div>
      <div class="cp-d-status-badge ${badgeCls}">${badgeTxt}</div>

      <div class="cp-d-divider"></div>
      <div class="cp-d-label">THREAT LEVEL</div>
      <div class="cp-d-threat-wrap">
        <div class="cp-d-threat-fill" style="width:${(threat*100).toFixed(0)}%;background:linear-gradient(90deg,${cat.color}66,${cat.color})"></div>
      </div>
      <div class="cp-d-threat-txt">TIER ${z+1} / 20 — ${z < 5 ? 'LOW' : z < 10 ? 'MEDIUM' : z < 15 ? 'HIGH' : 'CRITICAL'}</div>

      <div class="cp-d-divider"></div>
      <div class="cp-d-label">MISSION PROGRESS</div>
      <div class="cp-d-lvl-grid">${lvlCells}</div>
      <div class="cp-d-prog-txt">${prog} / 10 LEVELS CLEARED</div>

      <div class="cp-d-divider"></div>
      <div class="cp-boss-card">
        <div class="cp-boss-lbl">BOSS ENCOUNTER · LEVEL 10</div>
        <div class="cp-boss-name">${BOSS_NAMES[z]}</div>
      </div>

      ${actionHTML}
    `;

    document.getElementById('cp-deploy-now')?.addEventListener('click', () => this._launch());
  }

  // ─── Category filter tabs ───────────────────────────────────────────────────

  _wireTabs() {
    const tabs = document.getElementById('cp-cat-tabs');
    if (!tabs || tabs._wired) return;
    tabs._wired = true;
    tabs.querySelectorAll('.cp-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.querySelectorAll('.cp-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._activeFilter = +btn.dataset.cat;
        this._applyFilter();
      });
    });
  }

  _applyFilter() {
    document.querySelectorAll('.cp-zone-card').forEach(card => {
      const catIdx = +card.dataset.cat;
      card.style.display = (this._activeFilter === -1 || catIdx === this._activeFilter) ? '' : 'none';
    });
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  _handleKey(e) {
    const visible = [...document.querySelectorAll('.cp-zone-card')]
      .filter(c => c.style.display !== 'none')
      .map(c => +c.dataset.zone);
    const cur = visible.indexOf(this._sel);
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); if (cur < visible.length-1) this._selectZone(visible[cur+1]); break;
      case 'ArrowLeft':  e.preventDefault(); if (cur > 0) this._selectZone(visible[cur-1]); break;
      case 'ArrowDown':  e.preventDefault(); if (cur + 4 < visible.length) this._selectZone(visible[cur+4]); break;
      case 'ArrowUp':    e.preventDefault(); if (cur - 4 >= 0) this._selectZone(visible[cur-4]); break;
      case 'Enter': case ' ': e.preventDefault(); this._launch(); break;
      case 'Escape': this._goBack(); break;
    }
  }

  _goBack() {
    this.exit();
    // Re-push the menu scene
    const g = this.gameScene?.game;
    if (g) g.scenes.replace(g.menuScene);
  }

  // ─── Launch ─────────────────────────────────────────────────────────────────

  _launch() {
    const z = this._sel;
    if (!this.save.isZoneUnlocked(z)) return;
    const waveNum = z * 10 + 1;

    // Hook boss-kill to record campaign progress
    const origKillBoss = this.gameScene._killBoss?.bind(this.gameScene);
    if (origKillBoss) {
      this.gameScene._killBoss = () => {
        origKillBoss();
        const hpPct = this.gameScene.hp / (this.gameScene.maxHp || 5);
        const stars  = hpPct > 0.66 ? 3 : hpPct > 0.33 ? 2 : 1;
        this.save.completeLevel(z, 0, stars);
        this.gameScene._killBoss = origKillBoss;
      };
    }

    this.exit();
    openLoadout((wpnSlots, gadSlots) => {
      this.gameScene.setLoadout(wpnSlots, gadSlots);
      this.gameScene.startCampaignLevel(waveNum);
    });
  }
}

function _rgb(hex) {
  const r = parseInt(hex.slice(1,3),16)||0;
  const g = parseInt(hex.slice(3,5),16)||0;
  const b = parseInt(hex.slice(5,7),16)||0;
  return `${r},${g},${b}`;
}
