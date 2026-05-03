// ─── Perk System – Loadout Protocol ─────────────────────────────────────────
// 3 slots × 5 perks each = 15 perks.
// Each perk has an apply(gameScene) and remove(gameScene) hook.
// Perks are applied at the start of a wave and removed at wave end.

export const PERKS = {

  // ── SLOT 1 – UTILITY (Blue) ───────────────────────────────────────────────
  double_time: {
    id: 'double_time', slot: 1, col: '#4488FF',
    name: 'Double Time', icon: '⚡',
    desc: 'Sprint duration ×2. Tactical sprint available.',
    unlockLevel: 1,
    apply: (gs) => { gs._perk_doubleTime = true; },
    remove: (gs) => { gs._perk_doubleTime = false; },
  },
  bomb_squad: {
    id: 'bomb_squad', slot: 1, col: '#4488FF',
    name: 'Bomb Squad', icon: '🛡',
    desc: 'Detect traps and enemy equipment at 10m. -30% explosive damage.',
    unlockLevel: 5,
    apply: (gs) => { gs._perk_bombSquad = true; },
    remove: (gs) => { gs._perk_bombSquad = false; },
  },
  scavenger: {
    id: 'scavenger', slot: 1, col: '#4488FF',
    name: 'Scavenger', icon: '💠',
    desc: 'Collect ammo from killed enemies. +1 magazine reserve.',
    unlockLevel: 2,
    apply: (gs) => { gs._perk_scavenger = true; },
    remove: (gs) => { gs._perk_scavenger = false; },
  },
  overkill: {
    id: 'overkill', slot: 1, col: '#4488FF',
    name: 'Overkill', icon: '⚔',
    desc: 'Equip two primary weapons. No pistol slot needed.',
    unlockLevel: 8,
    apply: (gs) => { gs._perk_overkill = true; },
    remove: (gs) => { gs._perk_overkill = false; },
  },
  tracker: {
    id: 'tracker', slot: 1, col: '#4488FF',
    name: 'Tracker', icon: '👁',
    desc: 'See enemy trails for 3s. Killed enemies pinged for 3s.',
    unlockLevel: 12,
    apply: (gs) => { gs._perk_tracker = true; },
    remove: (gs) => { gs._perk_tracker = false; },
  },

  // ── SLOT 2 – COMBAT (Red) ─────────────────────────────────────────────────
  hardline: {
    id: 'hardline', slot: 2, col: '#FF4444',
    name: 'Hardline', icon: '★',
    desc: 'Killstreak costs 1 kill less. Score +20%.',
    unlockLevel: 3,
    apply: (gs) => { gs._perk_hardline = true; },
    remove: (gs) => { gs._perk_hardline = false; },
  },
  high_alert: {
    id: 'high_alert', slot: 2, col: '#FF4444',
    name: 'High Alert', icon: '◉',
    desc: 'Screen pulses when an enemy outside your FoV looks at you.',
    unlockLevel: 6,
    apply: (gs) => { gs._perk_highAlert = true; },
    remove: (gs) => { gs._perk_highAlert = false; },
  },
  restock: {
    id: 'restock', slot: 2, col: '#FF4444',
    name: 'Restock', icon: '↺',
    desc: 'Recharge tactical gadget every 25s.',
    unlockLevel: 4,
    apply: (gs) => { gs._perk_restock = true; gs._restockTimer = 25; },
    remove: (gs) => { gs._perk_restock = false; },
  },
  cold_blooded: {
    id: 'cold_blooded', slot: 2, col: '#FF4444',
    name: 'Cold Blooded', icon: '❄',
    desc: 'Invisible to auto-targeting, thermal optics, and AI systems.',
    unlockLevel: 10,
    apply: (gs) => { gs._perk_coldBlooded = true; },
    remove: (gs) => { gs._perk_coldBlooded = false; },
  },
  fast_hands: {
    id: 'fast_hands', slot: 2, col: '#FF4444',
    name: 'Fast Hands', icon: '✋',
    desc: '+30% reload. +50% weapon swap. +30% equipment use speed.',
    unlockLevel: 7,
    apply: (gs) => { gs._perk_fastHands = true; },
    remove: (gs) => { gs._perk_fastHands = false; },
  },

  // ── SLOT 3 – SURVIVAL (Yellow) ────────────────────────────────────────────
  battle_hardened: {
    id: 'battle_hardened', slot: 3, col: '#FFCC00',
    name: 'Battle Hardened', icon: '🛡',
    desc: '-60% flash/stun/gas duration. No aim shake from damage.',
    unlockLevel: 4,
    apply: (gs) => { gs._perk_battleHardened = true; },
    remove: (gs) => { gs._perk_battleHardened = false; },
  },
  amped: {
    id: 'amped', slot: 3, col: '#FFCC00',
    name: 'Amped', icon: '⚡',
    desc: '+30% weapon swap speed. Throw equipment further.',
    unlockLevel: 2,
    apply: (gs) => { gs._perk_amped = true; },
    remove: (gs) => { gs._perk_amped = false; },
  },
  combat_scout: {
    id: 'combat_scout', slot: 3, col: '#FFCC00',
    name: 'Combat Scout', icon: '◎',
    desc: 'Enemies you hit are marked for 2s. +10% damage to marked targets.',
    unlockLevel: 9,
    apply: (gs) => { gs._perk_combatScout = true; },
    remove: (gs) => { gs._perk_combatScout = false; },
  },
  ghost: {
    id: 'ghost', slot: 3, col: '#FFCC00',
    name: 'Ghost', icon: '◌',
    desc: 'Invisible on enemy minimap. No ping when firing with suppressor.',
    unlockLevel: 15,
    apply: (gs) => { gs._perk_ghost = true; },
    remove: (gs) => { gs._perk_ghost = false; },
  },
  resupply: {
    id: 'resupply', slot: 3, col: '#FFCC00',
    name: 'Resupply', icon: '◆',
    desc: 'Start with ×2 lethal equipment. Recharge lethal every 30s.',
    unlockLevel: 11,
    apply: (gs) => { gs._perk_resupply = true; gs._resupplyTimer = 30; },
    remove: (gs) => { gs._perk_resupply = false; },
  },
};

export const ALL_PERKS    = Object.values(PERKS);
export const SLOT_1_PERKS = ALL_PERKS.filter(p => p.slot === 1);
export const SLOT_2_PERKS = ALL_PERKS.filter(p => p.slot === 2);
export const SLOT_3_PERKS = ALL_PERKS.filter(p => p.slot === 3);

export function getPerk(id) { return PERKS[id] || null; }

// Active loadout perk state
export class PerkLoadout {
  constructor() { this.p1 = 'double_time'; this.p2 = 'hardline'; this.p3 = 'battle_hardened'; }
  set(slot, id) { if (slot === 1) this.p1 = id; else if (slot === 2) this.p2 = id; else this.p3 = id; }
  apply(gs)  { [this.p1, this.p2, this.p3].forEach(id => PERKS[id]?.apply(gs));  }
  remove(gs) { [this.p1, this.p2, this.p3].forEach(id => PERKS[id]?.remove(gs)); }
  toJSON() { return { p1: this.p1, p2: this.p2, p3: this.p3 }; }
  fromJSON(d) { if (d) { this.p1 = d.p1||'double_time'; this.p2 = d.p2||'hardline'; this.p3 = d.p3||'battle_hardened'; } }
}
