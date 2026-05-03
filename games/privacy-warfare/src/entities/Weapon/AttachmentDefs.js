// ─── Attachment Definitions – Loadout Protocol ───────────────────────────────
// 8 slots × multiple attachments. modifiers: positive = stat improvement.
// All stat deltas are on the 0-100 scale used by WeaponBase.stats.
// Exception: damage/fireRate are raw unit deltas.

export const ATTACHMENTS = {

  // ── MUZZLE ────────────────────────────────────────────────────────────────
  muzzle_suppressor: {
    id: 'muzzle_suppressor', name: 'Suppressor', slot: 'muzzle',
    desc: 'Sound suppression. Invisible when firing on minimap.',
    modifiers: { range: 8, control: 5, handling: -8, mobility: -5 },
    pros: ['Sound Suppression', '+Damage Range', 'Minimap Stealth'],
    cons: ['-ADS Speed', '-Movement Speed'],
    unlockLevel: 12,
    compatible: ['assault','smg','marksman','sniper','pistol'],
    special: 'stealth',
  },
  muzzle_brake: {
    id: 'muzzle_brake', name: 'Muzzle Brake', slot: 'muzzle',
    desc: '-30% vertical recoil. Ideal for burst fire.',
    modifiers: { control: 15, accuracy: -8 },
    pros: ['-Vertical Recoil'],
    cons: ['+Horizontal Recoil'],
    unlockLevel: 5, compatible: ['assault','smg','lmg','marksman'],
  },
  muzzle_compensator: {
    id: 'muzzle_compensator', name: 'Compensator', slot: 'muzzle',
    desc: '-25% horizontal recoil. For sustained full-auto spray.',
    modifiers: { accuracy: 12, control: -8 },
    pros: ['-Horizontal Recoil'],
    cons: ['+Vertical Recoil'],
    unlockLevel: 8, compatible: ['assault','smg','lmg'],
  },
  muzzle_flash_hider: {
    id: 'muzzle_flash_hider', name: 'Flash Hider', slot: 'muzzle',
    desc: 'Removes muzzle flash. Balanced recoil reduction.',
    modifiers: { control: 8, accuracy: 4 },
    pros: ['No Muzzle Flash', '-Recoil'],
    cons: [],
    unlockLevel: 2, compatible: ['assault','smg','lmg','marksman','sniper','pistol'],
  },
  muzzle_breacher: {
    id: 'muzzle_breacher', name: 'Breacher Device', slot: 'muzzle',
    desc: '+Melee damage. Lethal close-range engagement tool.',
    modifiers: { handling: 5, damage: 5 },
    pros: ['+Melee Damage', '+Close Range Lethality'],
    cons: ['Visible Flash'],
    unlockLevel: 15, compatible: ['assault','smg','shotgun','pistol'],
    special: 'melee_boost',
  },

  // ── BARREL ───────────────────────────────────────────────────────────────
  barrel_extended: {
    id: 'barrel_extended', name: 'Extended Barrel', slot: 'barrel',
    desc: '+25% effective range. Heavy.',
    modifiers: { range: 18, mobility: -10, handling: -5 },
    pros: ['+Damage Range'],
    cons: ['-Movement Speed', '-ADS Speed'],
    unlockLevel: 3, compatible: ['assault','smg','marksman','sniper','pistol'],
  },
  barrel_lightweight: {
    id: 'barrel_lightweight', name: 'Lightweight Barrel', slot: 'barrel',
    desc: 'Optimised for mobility. Shorter effective range.',
    modifiers: { mobility: 10, handling: 8, range: -12 },
    pros: ['+Movement Speed', '+ADS Speed'],
    cons: ['-Damage Range'],
    unlockLevel: 2, compatible: ['assault','smg','pistol','marksman'],
  },
  barrel_heavy: {
    id: 'barrel_heavy', name: 'Heavy Barrel', slot: 'barrel',
    desc: '+Control and range. Slows you down.',
    modifiers: { control: 12, range: 10, mobility: -10 },
    pros: ['-Recoil', '+Damage Range'],
    cons: ['-Movement Speed'],
    unlockLevel: 6, compatible: ['assault','lmg','marksman','sniper'],
  },
  barrel_cqb: {
    id: 'barrel_cqb', name: 'CQB Barrel', slot: 'barrel',
    desc: 'Optimised for close-quarters. Sacrifices range.',
    modifiers: { handling: 15, mobility: 5, range: -18 },
    pros: ['+ADS Speed', '+Movement Speed'],
    cons: ['-Damage Range'],
    unlockLevel: 4, compatible: ['assault','smg','shotgun','pistol'],
  },

  // ── OPTIC ────────────────────────────────────────────────────────────────
  optic_iron: {
    id: 'optic_iron', name: 'Iron Sights', slot: 'optic',
    desc: 'Default sights. Fastest ADS.',
    modifiers: { handling: 5 },
    pros: ['+ADS Speed'],
    cons: [],
    unlockLevel: 0, compatible: ['assault','smg','shotgun','lmg','marksman','pistol','special'],
  },
  optic_reddot: {
    id: 'optic_reddot', name: 'Red Dot Sight', slot: 'optic',
    desc: '1.25× clean dot. Precision improvement.',
    modifiers: { accuracy: 6, handling: 3 },
    pros: ['Clean Sight Picture', '+Accuracy'],
    cons: [],
    unlockLevel: 1, zoom: 1.25, compatible: ['assault','smg','lmg','shotgun','pistol'],
  },
  optic_holo: {
    id: 'optic_holo', name: 'Holographic', slot: 'optic',
    desc: '1.5× wide window. Best clarity.',
    modifiers: { accuracy: 9, handling: -3 },
    pros: ['Wide FoV', '+Accuracy'],
    cons: ['-ADS Speed'],
    unlockLevel: 4, zoom: 1.5, compatible: ['assault','smg','lmg'],
  },
  optic_acog: {
    id: 'optic_acog', name: 'ACOG Scope', slot: 'optic',
    desc: '3.0× magnification. Mid-range dominance.',
    modifiers: { accuracy: 12, range: 10, handling: -12 },
    pros: ['3× Magnification', '+Accuracy', '+Range'],
    cons: ['-ADS Speed'],
    unlockLevel: 10, zoom: 3.0, compatible: ['assault','marksman','lmg'],
  },
  optic_thermal: {
    id: 'optic_thermal', name: 'Thermal', slot: 'optic',
    desc: '3.5× thermal. Highlights enemies. No standard zoom.',
    modifiers: { accuracy: 10, range: 8, handling: -15 },
    pros: ['Enemy Highlighting', '+Accuracy'],
    cons: ['-ADS Speed', 'No Standard View'],
    unlockLevel: 22, zoom: 3.5, special: 'thermal',
    compatible: ['assault','marksman','sniper','lmg'],
  },
  optic_sniper: {
    id: 'optic_sniper', name: 'Sniper Scope', slot: 'optic',
    desc: '6.0× high-power. Long-range lethal.',
    modifiers: { accuracy: 18, range: 15, handling: -20 },
    pros: ['6× Magnification', '+Accuracy', '+Range'],
    cons: ['-ADS Speed'],
    unlockLevel: 18, zoom: 6.0, compatible: ['sniper','marksman'],
  },
  optic_hybrid: {
    id: 'optic_hybrid', name: 'Hybrid Scope', slot: 'optic',
    desc: '1.5× / 4.0× toggle. Versatile.',
    modifiers: { accuracy: 8, handling: -10 },
    pros: ['Toggle Zoom 1.5× / 4×'],
    cons: ['-ADS Speed'],
    unlockLevel: 28, zoom: 1.5, special: 'toggle_zoom',
    compatible: ['assault','marksman'],
  },
  optic_cyberlink: {
    id: 'optic_cyberlink', name: 'Cyber Link', slot: 'optic',
    desc: '2.0× with target outline. +5% headshot multiplier. Violet link.',
    modifiers: { accuracy: 8, handling: -8 },
    pros: ['Enemy Outline', '+Headshot Multiplier', '2× Zoom'],
    cons: ['-ADS Speed'],
    unlockLevel: 30, zoom: 2.0, special: 'headshot_boost',
    compatible: ['assault','smg','marksman','sniper'],
  },

  // ── STOCK ────────────────────────────────────────────────────────────────
  stock_tactical: {
    id: 'stock_tactical', name: 'Tactical Stock', slot: 'stock',
    desc: '+ADS speed. Slightly less stable.',
    modifiers: { handling: 10, control: -5 },
    pros: ['+ADS Speed'],
    cons: ['-Stability'],
    unlockLevel: 4, compatible: ['assault','smg','lmg','marksman','sniper'],
  },
  stock_heavy: {
    id: 'stock_heavy', name: 'Heavy Stock', slot: 'stock',
    desc: 'Maximum stability. Slow to aim.',
    modifiers: { control: 15, handling: -10, mobility: -5 },
    pros: ['+Stability', '-Recoil'],
    cons: ['-ADS Speed', '-Movement Speed'],
    unlockLevel: 8, compatible: ['assault','lmg','sniper'],
  },
  stock_none: {
    id: 'stock_none', name: 'No Stock', slot: 'stock',
    desc: 'Extreme mobility. Very unstable.',
    modifiers: { handling: 20, mobility: 10, control: -15, accuracy: -10 },
    pros: ['+ADS Speed', '+Movement Speed'],
    cons: ['-Control', '-Accuracy'],
    unlockLevel: 16, compatible: ['assault','smg','pistol'],
  },
  stock_folded: {
    id: 'stock_folded', name: 'Folded Stock', slot: 'stock',
    desc: 'Compact form. Good mobility/ADS balance.',
    modifiers: { mobility: 12, handling: 6, control: -8 },
    pros: ['+Movement Speed', '+ADS Speed'],
    cons: ['-Control'],
    unlockLevel: 6, compatible: ['assault','smg','marksman'],
  },

  // ── UNDERBARREL ──────────────────────────────────────────────────────────
  ub_vertical: {
    id: 'ub_vertical', name: 'Vertical Grip', slot: 'underbarrel',
    desc: '+15% recoil control. Slightly slower.',
    modifiers: { control: 15, handling: -5 },
    pros: ['-Vertical Recoil'],
    cons: ['-ADS Speed'],
    unlockLevel: 2, compatible: ['assault','smg','lmg','marksman'],
  },
  ub_angled: {
    id: 'ub_angled', name: 'Angled Grip', slot: 'underbarrel',
    desc: '+ADS speed and recoil. Best of both.',
    modifiers: { handling: 10, control: 8 },
    pros: ['+ADS Speed', '+Recoil Control'],
    cons: [],
    unlockLevel: 4, compatible: ['assault','smg','marksman','lmg'],
  },
  ub_laser: {
    id: 'ub_laser', name: 'Laser Sight', slot: 'underbarrel',
    desc: '+15% hipfire accuracy. Visible to enemies.',
    modifiers: { accuracy: 15 },
    pros: ['+Hip-fire Accuracy'],
    cons: ['Visible Laser'],
    unlockLevel: 3, special: 'laser_visible',
    compatible: ['assault','smg','shotgun','pistol'],
  },
  ub_grenade: {
    id: 'ub_grenade', name: 'Grenade Launcher', slot: 'underbarrel',
    desc: '2 rounds. 80 AoE damage. -Mobility and -ADS.',
    modifiers: { mobility: -20, handling: -10 },
    pros: ['AoE Grenade (2 rounds)', 'High Structure Damage'],
    cons: ['-Movement Speed', '-ADS Speed'],
    unlockLevel: 20, special: 'grenade_launcher',
    compatible: ['assault','lmg'],
  },
  ub_shotgun: {
    id: 'ub_shotgun', name: 'Underbarrel Shotgun', slot: 'underbarrel',
    desc: '4 rounds. 40×8 pellet at 10m. -Handling.',
    modifiers: { handling: -15 },
    pros: ['Secondary Shotgun (4 rounds)'],
    cons: ['-ADS Speed'],
    unlockLevel: 25, special: 'ub_shotgun',
    compatible: ['assault','marksman'],
  },

  // ── MAGAZINE ─────────────────────────────────────────────────────────────
  mag_extended: {
    id: 'mag_extended', name: 'Extended Mag', slot: 'magazine',
    desc: '+50% ammo. Slightly slower ADS and reload.',
    modifiers: { handling: -5, control: -3 },
    pros: ['+50% Magazine Capacity'],
    cons: ['-ADS Speed', '-Reload Speed'],
    unlockLevel: 5, special: 'mag_x1_5',
    compatible: ['assault','smg','lmg','marksman','pistol'],
  },
  mag_fast: {
    id: 'mag_fast', name: 'Fast Mag', slot: 'magazine',
    desc: '+30% reload speed. Slightly less ammo.',
    modifiers: { handling: 15, control: -5 },
    pros: ['+30% Reload Speed'],
    cons: ['-10% Magazine Capacity'],
    unlockLevel: 3, special: 'fast_reload',
    compatible: ['assault','smg','marksman','sniper','pistol'],
  },
  mag_drum: {
    id: 'mag_drum', name: 'Drum Magazine', slot: 'magazine',
    desc: '+100% ammo. Heavy penalty to mobility and ADS.',
    modifiers: { handling: -10, mobility: -15, control: -5 },
    pros: ['+100% Magazine Capacity'],
    cons: ['-Mobility', '-ADS Speed', '+Reload Time'],
    unlockLevel: 15, special: 'mag_x2',
    compatible: ['smg','shotgun','lmg'],
  },
  mag_ap: {
    id: 'mag_ap', name: 'Armor Piercing Rounds', slot: 'magazine',
    desc: 'Penetrates cover and chains through enemies. -15% damage vs unarmored.',
    modifiers: { damage: -4 },
    pros: ['Penetrates Cover', 'Chain-through Enemies'],
    cons: ['-Damage vs Unarmored'],
    unlockLevel: 20, special: 'armor_piercing',
    compatible: ['assault','lmg','sniper','marksman'],
  },
  mag_subsonic: {
    id: 'mag_subsonic', name: 'Subsonic Rounds', slot: 'magazine',
    desc: 'Silent with no projectile trail. -15% range.',
    modifiers: { range: -15 },
    pros: ['Fully Suppressed', 'No Bullet Trail'],
    cons: ['-Damage Range'],
    unlockLevel: 12, special: 'stealth',
    compatible: ['assault','smg','pistol','marksman'],
  },

  // ── REAR GRIP ────────────────────────────────────────────────────────────
  grip_stippled: {
    id: 'grip_stippled', name: 'Stippled Grip Tape', slot: 'rearGrip',
    desc: '+ADS speed, +sprint-to-fire. Slightly less stable.',
    modifiers: { handling: 10, mobility: 5, control: -8 },
    pros: ['+ADS Speed', '+Sprint-to-Fire'],
    cons: ['-Stability'],
    unlockLevel: 4, compatible: ['assault','smg','lmg','marksman','sniper','pistol'],
  },
  grip_rubberized: {
    id: 'grip_rubberized', name: 'Rubberized Grip', slot: 'rearGrip',
    desc: '+Recoil control. Marginal ADS penalty.',
    modifiers: { control: 12, handling: -5 },
    pros: ['+Recoil Control'],
    cons: ['-ADS Speed'],
    unlockLevel: 6, compatible: ['assault','smg','lmg','marksman','sniper'],
  },
  grip_granular: {
    id: 'grip_granular', name: 'Granular Grip', slot: 'rearGrip',
    desc: '+Accuracy and shot consistency.',
    modifiers: { accuracy: 8, handling: -3 },
    pros: ['+Accuracy', '+Shot Consistency'],
    cons: ['-ADS Speed'],
    unlockLevel: 8, compatible: ['assault','smg','marksman','sniper','pistol'],
  },

  // ── WEAPON PERK ──────────────────────────────────────────────────────────
  perk_fmj: {
    id: 'perk_fmj', name: 'FMJ', slot: 'weaponPerk',
    desc: '+40% penetration. +25% damage vs equipment.',
    modifiers: {},
    pros: ['+Cover Penetration', '+Equipment Damage'],
    cons: [],
    unlockLevel: 18, special: 'fmj',
    compatible: ['assault','lmg','sniper','marksman'],
  },
  perk_fast_melee: {
    id: 'perk_fast_melee', name: 'Fast Melee', slot: 'weaponPerk',
    desc: '+50% melee attack speed.',
    modifiers: {},
    pros: ['+Melee Speed'],
    cons: [],
    unlockLevel: 8, special: 'fast_melee', compatible: ['assault','smg','pistol'],
  },
  perk_fully_loaded: {
    id: 'perk_fully_loaded', name: 'Fully Loaded', slot: 'weaponPerk',
    desc: 'Spawn with maximum reserve ammo.',
    modifiers: {},
    pros: ['Max Ammo on Spawn'],
    cons: [],
    unlockLevel: 10, special: 'full_ammo',
    compatible: ['assault','smg','shotgun','lmg','sniper','marksman','pistol'],
  },
  perk_sleight: {
    id: 'perk_sleight', name: 'Sleight of Hand', slot: 'weaponPerk',
    desc: '+25% reload speed.',
    modifiers: { handling: 10 },
    pros: ['+25% Reload Speed'],
    cons: [],
    unlockLevel: 6,
    compatible: ['assault','smg','shotgun','lmg','pistol'],
  },
  perk_frangible: {
    id: 'perk_frangible', name: 'Frangible', slot: 'weaponPerk',
    desc: 'Shots slow enemies 15% for 1s.',
    modifiers: { damage: -2 },
    pros: ['-15% Enemy Speed on Hit'],
    cons: ['-Damage'],
    unlockLevel: 14, special: 'slow_on_hit',
    compatible: ['assault','smg','marksman'],
  },
  perk_focus: {
    id: 'perk_focus', name: 'Focus', slot: 'weaponPerk',
    desc: 'Reduced flinch when taking damage.',
    modifiers: { control: 10 },
    pros: ['-Flinch When Hit'],
    cons: [],
    unlockLevel: 12,
    compatible: ['sniper','marksman','assault'],
  },
};

// Flat array for iteration
export const ALL_ATTACHMENTS = Object.values(ATTACHMENTS);

// Build a lookup map by id
export const ATTACHMENT_BY_ID = ATTACHMENTS;

// Get all attachments for a given slot
export function getSlotAttachments(slot) {
  return ALL_ATTACHMENTS.filter(a => a.slot === slot);
}

// Get attachments compatible with a weapon class and unlocked at given level
export function getCompatibleAttachments(slot, weaponClass, weaponLevel = 0) {
  return ALL_ATTACHMENTS.filter(a =>
    a.slot === slot &&
    (!a.compatible || a.compatible.includes(weaponClass)) &&
    a.unlockLevel <= weaponLevel
  );
}

export const SLOT_LABELS = {
  muzzle:       'MUZZLE',
  barrel:       'BARREL',
  optic:        'OPTIC',
  stock:        'STOCK',
  underbarrel:  'UNDERBARREL',
  magazine:     'MAGAZINE',
  rearGrip:     'REAR GRIP',
  weaponPerk:   'WEAPON PERK',
};

export const SLOT_ORDER = ['muzzle','barrel','optic','stock','underbarrel','magazine','rearGrip','weaponPerk'];
