// ─── Ammo Types – Loadout Protocol ───────────────────────────────────────────
// Each ammo type modifies the bullet object created by WeaponBase.fire().
// applyToProjectile(proj, weapon) is called when the bullet is created.
// applyOnHit(target, proj, gameScene) is called when the bullet hits.

export const AMMO_TYPES = {

  standard: {
    id: 'standard', name: 'Standard',
    desc: 'No modifiers. Baseline performance.',
    col: null,                           // inherits weapon col
    modifiers: {},
    unlockLevel: 0,
    applyToProjectile: (p) => p,
    applyOnHit: () => {},
    trailVisible: true,
  },

  overpressure: {
    id: 'overpressure', name: 'Overpressure',
    desc: '+20% damage vs shield/armor. +25% recoil, +10% spread.',
    col: '#FF6622',
    modifiers: { damage: 0.20 /* mult */, accuracy: -10, control: -15 },
    unlockLevel: 10,
    applyToProjectile: (p) => { p.dmg *= 1.20; p.col = '#FF6622'; return p; },
    applyOnHit: (target, p, gs) => {
      if (target.shield > 0) p.dmg *= 1.5;
    },
    trailVisible: true,
  },

  ap: {
    id: 'ap', name: 'Armor Piercing',
    desc: 'Penetrates 1 enemy and thin cover. -15% damage.',
    col: '#AAAACC',
    modifiers: { damage: -0.15 /* mult */ },
    unlockLevel: 15,
    applyToProjectile: (p) => { p.dmg *= 0.85; p.piercing = true; p.col = '#AAAACC'; return p; },
    applyOnHit: () => {},
    trailVisible: true,
  },

  incendiary: {
    id: 'incendiary', name: 'Incendiary',
    desc: 'DoT 5 dmg/sec for 3s. -10% fire rate and range.',
    col: '#FF4400',
    modifiers: { fireRate: -10, range: -10 },
    unlockLevel: 12,
    applyToProjectile: (p) => { p.col = '#FF4400'; return p; },
    applyOnHit: (target, p, gs) => {
      target._burnTimer = 3; target._burnDmg = 5;
      if (gs?._spawnFloat) gs._spawnFloat(target.x, target.y - 20, 'BURN', '#FF4400');
    },
    trailVisible: true,
  },

  cryo: {
    id: 'cryo', name: 'Cryo',
    desc: 'Slows enemies 30% for 2s. -25% damage. No headshot bonus.',
    col: '#88FFFF',
    modifiers: { damage: -0.25 /* mult */ },
    unlockLevel: 14,
    applyToProjectile: (p) => { p.dmg *= 0.75; p.col = '#88FFFF'; p.noHeadshot = true; return p; },
    applyOnHit: (target, p, gs) => {
      if (target.applyFreeze) target.applyFreeze(2);
    },
    trailVisible: true,
  },

  shock: {
    id: 'shock', name: 'Shock',
    desc: '15% chance stun 0.5s. -20% damage, +15% spread.',
    col: '#FFFF00',
    modifiers: { damage: -0.20, accuracy: -15 },
    unlockLevel: 16,
    applyToProjectile: (p) => { p.dmg *= 0.80; p.col = '#FFFF00'; p.shockChance = 0.15; return p; },
    applyOnHit: (target, p, gs) => {
      if (Math.random() < (p.shockChance || 0.15)) {
        target._stunTimer = Math.max(target._stunTimer || 0, 0.5);
        if (gs?._spawnFloat) gs._spawnFloat(target.x, target.y - 20, 'STUN', '#FFFF00');
      }
    },
    trailVisible: true,
  },

  corrosive: {
    id: 'corrosive', name: 'Corrosive',
    desc: 'Halves enemy armor for 5s. DoT 3/sec. -15% damage.',
    col: '#88FF00',
    modifiers: { damage: -0.15 },
    unlockLevel: 20,
    applyToProjectile: (p) => { p.dmg *= 0.85; p.col = '#88FF00'; return p; },
    applyOnHit: (target, p, gs) => {
      target._armorReduced = 5; target._corrosiveDot = 3; target._corrosiveDotT = 5;
    },
    trailVisible: true,
  },

  explosive: {
    id: 'explosive', name: 'Explosive',
    desc: 'Explodes on impact (r=20, 30% AoE). -40% bullet damage. No headshot.',
    col: '#FF8800',
    modifiers: { damage: -0.40 },
    unlockLevel: 22,
    applyToProjectile: (p) => {
      p.dmg *= 0.60; p.col = '#FF8800'; p.explosive = true; p.aoeR = 20; p.noHeadshot = true;
      return p;
    },
    applyOnHit: (target, p, gs) => {
      if (!gs || !p.explosive) return;
      const aoe = p.aoeR || 20;
      for (const e of gs.EYES || []) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < aoe && e !== target) gs._damageE(e, p.dmg * 0.3, true);
      }
      gs._burst?.(p.x, p.y, '#FF8800', 10, 80);
    },
    trailVisible: true,
  },

  smart_link: {
    id: 'smart_link', name: 'Smart-Link',
    desc: 'Weak homing (curves 5° toward nearest enemy). -30% damage. Requires Cyber Link optic.',
    col: '#CC44FF',
    modifiers: { damage: -0.30 },
    unlockLevel: 28,
    requiresOptic: 'optic_cyberlink',
    applyToProjectile: (p) => { p.dmg *= 0.70; p.col = '#CC44FF'; p.homing = true; p.homingStr = 0.06; return p; },
    applyOnHit: () => {},
    trailVisible: false,
  },

  hollow_point: {
    id: 'hollow_point', name: 'Hollow Point',
    desc: '+35% damage to limbs. No penetration. -20% vs torso.',
    col: '#FFAAAA',
    modifiers: {},
    unlockLevel: 10,
    applyToProjectile: (p) => { p.col = '#FFAAAA'; p.hollowPoint = true; return p; },
    applyOnHit: (target, p, gs) => {
      // Limb bonus is applied in damage calculation in GameScene
    },
    trailVisible: true,
  },
};

export const ALL_AMMO = Object.values(AMMO_TYPES);

export function getAmmoType(id) {
  return AMMO_TYPES[id] || AMMO_TYPES.standard;
}
