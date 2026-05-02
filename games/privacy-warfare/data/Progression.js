// data/Progression.js — Persistent meta-progression / skill tree

import { Storage } from './Storage.js';
import { bus } from '../utils/EventBus.js';
// achievements is imported lazily to avoid circular dependencies

const SKILL_DEFS = [
  {
    id: 'damage_up',
    name: 'Firepower',
    desc: 'All weapon damage ×1.1',
    cost: 1,
    maxLevel: 3,
    apply(player, level) {
      // multiplier is applied in Player via getStatMult
    }
  },
  {
    id: 'speed_up',
    name: 'Sprint Protocol',
    desc: 'Movement speed +10%',
    cost: 1,
    maxLevel: 2,
    apply() {}
  },
  {
    id: 'cooldown_down',
    name: 'Quick Reload',
    desc: 'Ability cooldowns ×0.85',
    cost: 2,
    maxLevel: 2,
    apply() {}
  },
  {
    id: 'crit_chance',
    name: 'Critical Strike',
    desc: '15% chance to deal 2× damage',
    cost: 2,
    maxLevel: 1,
    apply() {}
  },
  {
    id: 'hp_up',
    name: 'Reinforced Armor',
    desc: 'Max HP +1',
    cost: 2,
    maxLevel: 2,
    apply() {}
  },
  {
    id: 'xp_boost',
    name: 'Data Analyst',
    desc: 'Score/XP gain ×1.2',
    cost: 1,
    maxLevel: 1,
    apply() {}
  }
];

class Progression {
  constructor() {
    this._data = Storage.get('progression', { sp: 0, levels: {} });
    // migrate old format
    if (!this._data.levels) this._data.levels = {};
  }

  get sp() { return this._data.sp; }

  getLevel(id) { return this._data.levels[id] || 0; }

  addSP(amount) {
    this._data.sp += amount;
    this._save();
    bus.emit('sp:changed', this._data.sp);
  }

  canBuy(id) {
    const def = SKILL_DEFS.find(d => d.id === id);
    if (!def) return false;
    const lvl = this.getLevel(id);
    if (lvl >= def.maxLevel) return false;
    return this._data.sp >= def.cost;
  }

  buy(id) {
    if (!this.canBuy(id)) return false;
    const def = SKILL_DEFS.find(d => d.id === id);
    this._data.sp -= def.cost;
    this._data.levels[id] = (this._data.levels[id] || 0) + 1;
    this._save();
    bus.emit('progression:bought', id);
    bus.emit('sp:changed', this._data.sp);
    // Check if maxed
    if (this._data.levels[id] >= def.maxLevel) {
      bus.emit('progression:maxed', id);
    }
    return true;
  }

  /** Multiplier for all weapon damage from skill tree */
  damageMult() {
    return Math.pow(1.1, this.getLevel('damage_up'));
  }

  /** Multiplier for movement speed */
  speedMult() {
    return Math.pow(1.1, this.getLevel('speed_up'));
  }

  /** Multiplier for ability cooldowns (lower = better) */
  cooldownMult() {
    return Math.pow(0.85, this.getLevel('cooldown_down'));
  }

  /** Whether player has crit chance unlocked */
  hasCrit() {
    return this.getLevel('crit_chance') > 0;
  }

  /** Extra max HP from tree */
  extraHP() {
    return this.getLevel('hp_up');
  }

  /** Score multiplier from xp_boost */
  scoreMult() {
    return this.getLevel('xp_boost') > 0 ? 1.2 : 1.0;
  }

  /** All skill definitions (for UI) */
  get defs() { return SKILL_DEFS; }

  _save() { Storage.set('progression', this._data); }

  /** Reset all progression (debug / new game option) */
  reset() {
    this._data = { sp: 0, levels: {} };
    this._save();
    bus.emit('sp:changed', 0);
  }
}

export const progression = new Progression();
