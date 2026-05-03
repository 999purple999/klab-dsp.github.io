// ─── Weapon Progression – Level 1-50 per weapon ──────────────────────────────
// Tracks XP, level, kills, and camo unlocks per weapon ID.
// Persisted in localStorage under 'pw_wpn_prog_v1_<weaponId>'.

const STORAGE_PREFIX = 'pw_wpn_prog_v1_';

// Cumulative XP thresholds for each level (index = level you're reaching)
const XP_SCALE = [0];
for (let i = 1; i <= 50; i++) {
  XP_SCALE.push(XP_SCALE[i - 1] + Math.round(100 + i * 80 + i * i * 2));
}

export const CAMO_TIERS = [
  { id: 'digital',    name: 'Digital',    col: '#00AAFF', unlockLevel: 5,  killReq: 100  },
  { id: 'arctic',     name: 'Arctic',     col: '#AADDFF', unlockLevel: 10, killReq: 250  },
  { id: 'neon_viper', name: 'Neon Viper', col: '#00FF88', unlockLevel: 20, killReq: 500  },
  { id: 'phantom',    name: 'Phantom',    col: '#8844FF', unlockLevel: 30, killReq: 1000 },
  { id: 'void',       name: 'Void',       col: '#FF00AA', unlockLevel: 40, killReq: 2500 },
  { id: 'cyber_gold', name: 'Cyber Gold', col: '#FFD700', unlockLevel: 50, killReq: 5000 },
];

// Attachment unlock gates by weapon level
export const LEVEL_UNLOCK_GATES = [
  { level: 2,  slot: 'muzzle',       desc: 'Muzzle attachments' },
  { level: 4,  slot: 'barrel',       desc: 'Barrel attachments' },
  { level: 6,  slot: 'optic',        desc: 'Optic attachments' },
  { level: 8,  slot: 'stock',        desc: 'Stock attachments' },
  { level: 10, slot: 'underbarrel',  desc: 'Underbarrel attachments' },
  { level: 12, slot: 'magazine',     desc: 'Magazine attachments' },
  { level: 15, slot: 'rearGrip',     desc: 'Rear grip attachments' },
  { level: 20, slot: 'weaponPerk',   desc: 'Weapon perk slot' },
];

export class WeaponProgression {
  constructor(weaponId) {
    this.id    = weaponId;
    this.level = 1;
    this.xp    = 0;
    this.kills = 0;
    this.camo  = 'none';
    this._load();
  }

  gainXP(amount) {
    this.xp += Math.round(amount);
    while (this.level < 50 && this.xp >= XP_SCALE[this.level]) {
      this.xp -= XP_SCALE[this.level];
      this.level++;
    }
    if (this.level >= 50) this.xp = 0;
    this._checkCamos();
    this._save();
    return this.level;
  }

  addKill(xpAward = 50) {
    this.kills++;
    this.gainXP(xpAward);
  }

  _checkCamos() {
    for (const tier of CAMO_TIERS) {
      if (this.level >= tier.unlockLevel && this.kills >= tier.killReq) {
        this.camo = tier.id;
      }
    }
  }

  xpProgress() {
    if (this.level >= 50) return 1;
    return this.xp / XP_SCALE[this.level];
  }

  xpToNextLevel() {
    if (this.level >= 50) return 0;
    return XP_SCALE[this.level] - this.xp;
  }

  isSlotUnlocked(slot) {
    const gate = LEVEL_UNLOCK_GATES.find(g => g.slot === slot);
    return !gate || this.level >= gate.level;
  }

  unlockedCamos() {
    return CAMO_TIERS.filter(t => this.level >= t.unlockLevel && this.kills >= t.killReq);
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_PREFIX + this.id, JSON.stringify({
        level: this.level, xp: this.xp, kills: this.kills, camo: this.camo,
      }));
    } catch (_) {}
  }

  _load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_PREFIX + this.id) || 'null');
      if (d) {
        this.level = d.level || 1;
        this.xp    = d.xp    || 0;
        this.kills = d.kills || 0;
        this.camo  = d.camo  || 'none';
      }
    } catch (_) {}
  }

  toJSON() {
    return { level: this.level, xp: this.xp, kills: this.kills, camo: this.camo };
  }
}

// ─── Global registry ──────────────────────────────────────────────────────────
const _registry = new Map();

export function getWeaponProgress(weaponId) {
  if (!_registry.has(weaponId)) _registry.set(weaponId, new WeaponProgression(weaponId));
  return _registry.get(weaponId);
}

export function awardKillXP(weaponId, isHeadshot = false) {
  const prog = getWeaponProgress(weaponId);
  prog.addKill(isHeadshot ? 80 : 50);
  return prog;
}

export { XP_SCALE };
