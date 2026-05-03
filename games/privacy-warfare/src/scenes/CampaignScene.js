// ─── CampaignScene ────────────────────────────────────────────────────────────
// Premium campaign map — 20-zone threat grid with intelligence briefings.

import { CampaignSave } from '../data/CampaignSave.js';
import { openLoadout }  from '../ui/LoadoutModal.js';

const ZONE_NAMES = [
  'FIREWALL BREACH', 'PHISHING DELTA', 'DARK WEB NODE', 'BOTNET ALPHA', 'RANSOMWARE HUB',
  'SPYWARE NEXUS',   'TROJAN GATE',   'ROOTKIT CORE',  'CRYPTO VAULT', 'ZERO-DAY LAB',
  'DDoS COMMAND',    'MITM JUNCTION', 'EXFIL RELAY',   'DEEPFAKE FORGE','AI DOMINION',
  'SHADOWNET DEEP',  'QUANTUM ERROR', 'VOID SHARD',    'SYSADMIN LAIR', 'NEXUS OMEGA',
];

const ZONE_LORE = [
  'Corporate firewall compromised. Enemy units pouring through a 0-day exploit in the outer perimeter. Establish a counterbeachhead before core systems fall.',
  'Phishing campaigns flooding the subnet. Thousands of deceptive packets disguised as legitimate traffic — distinguishing real threats from noise is impossible.',
  'Deep web marketplace for stolen data. The architecture here routes traffic through 14 layers of obfuscation. Threat actors vanish and reappear unpredictably.',
  'Botnet command node controlling 200k compromised machines. Taking it down requires surviving waves of zombie processes desperate to protect their master.',
  'Ransomware syndicate headquarters. Encrypted floors, encrypted enemies, encrypted everything. Your weapons are your only decryption key.',
  'Spyware embedded at the silicon level. Invisible threats extract your tactical data in real time. Every movement you make is already anticipated.',
  'Trojan insertion point. The enemy disguises units as friendly assets. Trust nothing that hasn\'t tried to kill you yet.',
  'Rootkit nest buried beneath the OS kernel. Reality itself is unstable — the environment is actively rewriting itself to disadvantage you.',
  'Cryptocurrency mining operation funding the entire network. Hardened infrastructure, heavily defended. Thermal systems are maxed out.',
  'Zero-day research facility. Cutting-edge exploits are assembled here before deployment. The scientists are also the weapons.',
  'DDoS command center coordinating attacks against 40 nations. Surge waves of enemy units will swarm in coordinated, overwhelming bursts.',
  'Man-in-the-middle junction intercepting and corrupting all communications. Nothing you fire is guaranteed to hit what you aimed at.',
  'Data exfiltration relay station. Enemy forces are actively stealing intel and fleeing with it. Speed is critical — let nothing escape.',
  'Deepfake forge producing synthetic identities. Enemies replicate your appearance and tactics. The copy is always one step ahead.',
  'Autonomous AI threat hub achieving self-optimization. The longer the fight goes, the harder it gets. The AI learns. You must learn faster.',
  'Shadow network substrate — the hidden layer beneath everything. Enemies here do not obey normal physics. Darkness is operational.',
  'Quantum computing error cascade. Probabilistic reality means enemies exist in superposition until observed. Laws of physics are suggestions.',
  'Void shard — a region of deleted space. Corrupted data fills the arena. Navigation is treacherous; the map itself is hostile.',
  'The sysadmin — a rogue human operator with godlike system privileges. Manual control of all defenses. This one fights with intelligence.',
  'NEXUS OMEGA: the core of everything. All threat actors converge here. Infinite waves. No mercy. The final protocol.',
];

const ZONE_MODIFIERS = [
  ['Enemies +20% speed', 'Perimeter breach chaos'],
  ['Projectile spam waves', 'Decoy signals active'],
  ['Enemy teleport every 4s', 'Fog of war enabled'],
  ['Enemy count ×1.5', 'Botnet surge events'],
  ['Arena sections lock', 'Encryption fields'],
  ['Cloaked enemy majority', 'Intel blackout zones'],
  ['Trojan units disguised', 'Trust verification fail'],
  ['Environment rewrites', 'Rootkit stability drain'],
  ['Thermal heat system', 'Overclocked enemies'],
  ['New exploit every wave', 'Zero-day escalation'],
  ['DDoS surge waves ×2', 'Swarm coordination active'],
  ['Projectile deflection zones', 'MITM interception'],
  ['Timed exfil objectives', 'Escape events'],
  ['Mirage enemy majority', 'Deepfake identification'],
  ['AI learns player patterns', 'Self-optimizing units'],
  ['Darkness protocol active', 'Shadow movement'],
  ['Quantum positions unstable', 'Superposition enemies'],
  ['Void corruption spreading', 'Deleted zones'],
  ['Manual enemy control', 'Admin override powers'],
  ['All threats simultaneously', 'Nexus convergence'],
];

const BOSS_NAMES = [
  'IGNIS PRIME',    'PHISH QUEEN',   'DARKMASTER',    'BOT OVERLORD',   'RANSOM KING',
  'EYE SPIDER',     'TROJAN HORSE',  'ROOT DAEMON',   'CRYPTO WRAITH',  '0DAY GHOST',
  'DDoS HYDRA',     'MITM SHADE',    'DATA KRAKEN',   'DEEP FAKER',      'AI DOMINION-X',
  'SHADOW LORD',    'QUANTUM RIFT',  'VOID HERALD',   'SYSADM1N',       'NEXUS OMEGA',
];

const BOSS_LORE = [
  'A firewall sentinel corrupted by the breach. Immune to conventional approaches — only sustained assault reveals its true attack surface.',
  'The architect of the phishing campaign. Spawns endless decoys; only one is the real target. Destroy the right one.',
  'Dark web kingpin who has compiled every exploit ever written. Phases through damage until forced into the light.',
  'The botnet\'s central coordinator. Continuously summons zombie units. Kill the master and the swarm loses coherence.',
  'The ransom king encrypts both attacks and defenses in real time. Break the cipher, break the boss.',
  'A living spyware organism. Reads your inputs 0.5s before you make them. Randomize your approach.',
  'The Trojan Horse appears as an ally until critical range. The reveal is always explosive.',
  'Root Daemon controls the kernel. Every environment object becomes a weapon at its command.',
  'Crypto Wraith exists simultaneously across multiple wallet addresses. Only one instance is real.',
  '0-Day Ghost is pure exploit — a moving collection of weaponized vulnerabilities with no fixed form.',
  'DDoS Hydra cannot be killed normally. Each head must be defeated simultaneously or they regenerate.',
  'MITM Shade intercepts every projectile you fire and returns it at double velocity.',
  'Data Kraken tentacles drag intel packets to safety. Stop the exfiltration or the zone is lost.',
  'Deep Faker has copied your loadout perfectly. Fight your own shadow.',
  'AI Dominion-X self-optimizes after each hit. The 1st hit is easy. Each subsequent hit is harder.',
  'Shadow Lord exists only in darkness. The spotlight is your weapon.',
  'Quantum Rift exists as all possible bosses until you observe it. Choose your counter wisely.',
  'Void Herald corrupts reality around it. Standing still is lethal.',
  'SYSADM1N is a human operator with manual override of all systems. Unpredictable, adaptive, lethal.',
  'NEXUS OMEGA is everything. It is the sum of all previous bosses and all previous failures.',
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
    this._activeFilter = -1;
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
    const ctx = this.ctx;
    if (ctx) {
      ctx.fillStyle = '#020108';
      ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    }
  }

  _buildGrid() {
    const grid = document.getElementById('cp-zone-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 20; i++) grid.appendChild(this._makeCard(i));
  }

  _makeCard(i) {
    const cat     = catOf(i);
    const unl     = this.save.isZoneUnlocked(i);
    const prog    = this._progress(i);
    const cleared = prog >= 10;
    const threat  = Math.floor((i + 1) / 20 * 100);

    const div = document.createElement('div');
    div.className = `cp-zone-card${!unl ? ' cp-locked' : ''}${cleared ? ' cp-cleared' : ''}`;
    div.dataset.zone = i;
    div.dataset.cat  = Math.floor(i / 4);
    div.style.setProperty('--zc', cleared ? '#00CC44' : cat.color);

    const statusTxt = !unl ? '⬡ LOCKED'
      : cleared            ? '✓ CLEARED'
      : prog > 0           ? `${prog}/10`
                           : 'AVAILABLE';

    const threatBar = `<div style="height:2px;background:linear-gradient(90deg,${cat.color},transparent);width:${threat}%;opacity:0.6;margin-top:3px"></div>`;

    div.innerHTML = `
      <div class="cp-znum" style="color:${cat.color};font-size:9px;opacity:0.7">ZONE ${String(i+1).padStart(2,'0')} · ${cat.name}</div>
      <div class="cp-zname" style="font-size:11px;margin:2px 0">${ZONE_NAMES[i]}</div>
      ${threatBar}
      <div class="cp-zstatus" style="font-size:9px;margin-top:4px;opacity:0.8">${statusTxt}</div>
    `;
    div.addEventListener('click', () => this._selectZone(i));
    return div;
  }

  _progress(z) {
    let n = 0;
    for (let l = 0; l < 10; l++) if (this.save.isLevelComplete(z, l)) n++;
    return n;
  }

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

  _renderDetail(z) {
    const panel = document.getElementById('cp-detail');
    if (!panel) return;
    const cat     = catOf(z);
    const unl     = this.save.isZoneUnlocked(z);
    const prog    = this._progress(z);
    const cleared = prog >= 10;
    const threat  = (z + 1) / 20;
    const tier    = z < 4 ? 'ALPHA' : z < 8 ? 'BETA' : z < 12 ? 'GAMMA' : z < 16 ? 'DELTA' : 'OMEGA';
    const mods    = ZONE_MODIFIERS[z] || [];

    const badgeCls = !unl ? 'locked' : cleared ? 'cleared' : 'unlocked';
    const badgeTxt = !unl ? '⬡ CLASSIFIED' : cleared ? '● ZONE CLEARED' : '● ACTIVE THREAT';

    const lvlCells = Array.from({ length: 10 }, (_, l) => {
      const done  = this.save.isLevelComplete(z, l);
      const avail = unl;
      const isBoss = l === 9;
      const cls   = done ? 'done' : avail ? 'avail' : 'locked';
      return `<div class="cp-d-lvl ${cls}" title="${isBoss ? 'BOSS: ' + BOSS_NAMES[z] : 'Level ' + (l+1)}">${isBoss ? '👁' : 'L' + (l+1)}</div>`;
    }).join('');

    const modHTML = mods.map(m => `<div style="font-size:9px;color:${cat.color};opacity:0.8;margin:2px 0">▸ ${m}</div>`).join('');

    const actionHTML = unl
      ? `<button class="cp-deploy-btn" id="cp-deploy-now" style="border-color:${cat.color};color:${cat.color};background:rgba(${_rgb(cat.color)},0.1)">▶ DEPLOY TO ZONE ${z+1}</button>`
      : `<div class="cp-locked-msg">Complete zone ${z} to unlock</div>`;

    panel.innerHTML = `
      <div style="font-size:9px;color:${cat.color};opacity:0.6;letter-spacing:2px">${cat.name} · SECTOR ${tier} · ZONE ${z+1}</div>
      <div class="cp-d-zone-name" style="font-size:18px;margin:4px 0 2px">${ZONE_NAMES[z]}</div>
      <div class="cp-d-status-badge ${badgeCls}">${badgeTxt}</div>

      <div class="cp-d-divider"></div>
      <div class="cp-d-label">INTELLIGENCE REPORT</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.55);line-height:1.5;margin:4px 0 8px">${ZONE_LORE[z]}</div>

      <div class="cp-d-divider"></div>
      <div class="cp-d-label">THREAT LEVEL — ${Math.round(threat*100)}%</div>
      <div class="cp-d-threat-wrap" style="margin:4px 0">
        <div class="cp-d-threat-fill" style="width:${(threat*100).toFixed(0)}%;background:linear-gradient(90deg,${cat.color}66,${cat.color})"></div>
      </div>
      <div class="cp-d-threat-txt">TIER ${z+1} / 20 — ${z < 5 ? 'LOW' : z < 10 ? 'MEDIUM' : z < 15 ? 'HIGH' : 'CRITICAL'}</div>

      <div class="cp-d-divider"></div>
      <div class="cp-d-label">ACTIVE MODIFIERS</div>
      ${modHTML || '<div style="font-size:9px;opacity:0.4">Standard threat profile</div>'}

      <div class="cp-d-divider"></div>
      <div class="cp-d-label">MISSION PROGRESS — ${prog}/10</div>
      <div class="cp-d-lvl-grid">${lvlCells}</div>

      <div class="cp-d-divider"></div>
      <div class="cp-boss-card" style="border-color:${cat.color}44">
        <div class="cp-boss-lbl" style="color:${cat.color}">BOSS ENCOUNTER · LEVEL 10</div>
        <div class="cp-boss-name">${BOSS_NAMES[z]}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.45);margin-top:4px;line-height:1.4">${BOSS_LORE[z]}</div>
      </div>

      ${actionHTML}
    `;

    document.getElementById('cp-deploy-now')?.addEventListener('click', () => this._launch());
  }

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
    const g = this.gameScene?.game;
    if (g) g.scenes.replace(g.menuScene);
  }

  _launch() {
    const z = this._sel;
    if (!this.save.isZoneUnlocked(z)) return;
    const waveNum = z * 10 + 1;

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
