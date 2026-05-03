// ─── Weapon Definitions v3.0 ──────────────────────────────────────────────────
// Indices 0-9 = original 10 (BASE_* arrays used for skill upgrade reset).
// Indices 10-20 = unlockable weapons (no BASE reset).

export const BASE_CD   = [0.46, 0.065, 0.82, 1.25, 1.9, 5.0, 0.88, 0.58, 5.0, 0.38];
export const BASE_DMG  = [1,    0.32,  2,    2.5,  1.5, 0,   0.8,  0.5,  8,   0.3 ];
export const BASE_RNG  = [170,  265,   145,  350,  210, 0,   210,  190,  0,   160 ];
// Base ammo per weapon (indices match WPNS)
export const BASE_AMMO = [
  80, 300, 30, 35, 18, 5, 40, 60, 3, 90,   // indices 0-9
  12, 70, 30, 75, 15,                        // indices 10-14
  8, 10, 20, 12, 25, 8,                      // indices 15-20
];

export const WPNS = [
  // ── INDEX 0-9: Standard Issue (all unlocked) ────────────────────────────────
  { n: 'RSA PULSE',
    col: '#BF00FF', rng: 170, cd: 0.46,  dmg: 1,    t: 'pulse',
    cat: 'energy',  tag: 'STANDARD',
    desc: 'Standard-issue energy bolt. Reliable rate of fire, solid stopping power. Your dependable sidearm for any engagement.',
    unlocked: true },

  { n: 'AES BEAM',
    col: '#00FFFF', rng: 265, cd: 0.065, dmg: 0.32, t: 'beam',
    cat: 'energy',  tag: 'RAPID FIRE',
    desc: 'Hyper-frequency data stream. Lowest damage per bolt but the highest sustained DPS of any weapon. Melts armored threats.',
    unlocked: true },

  { n: 'SHA SHREDDER',
    col: '#00FF41', rng: 145, cd: 0.82,  dmg: 2,    t: 'spread',
    cat: 'spread',  tag: 'SHOTGUN',
    desc: 'Wide-pattern scatter burst. Five simultaneous bolts create a kill cone at close quarters. Unmatched clearing power up close.',
    unlocked: true },

  { n: 'QUANTUM SPLIT',
    col: '#FF8C00', rng: 350, cd: 1.25,  dmg: 2.5,  t: 'split',
    cat: 'tactical', tag: 'BURST',
    desc: 'Projectile superpositions into five parallel trajectories. Excellent mid-range coverage against dense enemy formations.',
    unlocked: true },

  { n: 'MATRIX WAVE',
    col: '#7FFF00', rng: 210, cd: 1.9,   dmg: 1.5,  t: 'wave',
    cat: 'tactical', tag: 'AOE RING',
    desc: 'Expanding ring pulse propagates outward from your position. Clears tight corridors and surrounded states instantly.',
    unlocked: true },

  { n: 'BLACK HOLE',
    col: '#9900FF', rng: 0,   cd: 5.0,   dmg: 0,    t: 'blackhole',
    cat: 'special',  tag: 'GRAVITY',
    desc: 'Deploys a gravitational singularity at cursor. Pulls all nearby threats inward. Pair with explosive weapons for max lethality.',
    unlocked: true },

  { n: 'CHAIN LIGHTNING',
    col: '#FFFF00', rng: 210, cd: 0.88,  dmg: 0.8,  t: 'chain',
    cat: 'tactical', tag: 'CHAIN',
    desc: 'Electromagnetic arc jumps between up to three targets automatically. Balanced crowd-control — lethal without being game-breaking.',
    unlocked: false, unlockCost: 180 },

  { n: 'CRYO RAY',
    col: '#88FFFF', rng: 190, cd: 0.58,  dmg: 0.5,  t: 'cryo',
    cat: 'status',   tag: 'FREEZE',
    desc: 'Supercooled data beam halts enemy movement on contact. Frozen targets take bonus damage. Low DPS — maximum control.',
    unlocked: true },

  { n: 'NUKE STRIKE',
    col: '#FF4400', rng: 0,   cd: 5.0,   dmg: 8,    t: 'nuke',
    cat: 'special',  tag: 'NUCLEAR',
    desc: 'Charges a massive area-denial detonation. 2-second charge delivers catastrophic damage to everything within 360 units.',
    unlocked: true },

  { n: 'VIRUS INJECT',
    col: '#44FF00', rng: 160, cd: 0.38,  dmg: 0.3,  t: 'virus',
    cat: 'status',   tag: 'DOT SPREAD',
    desc: 'Injects a self-replicating malware payload. Infected enemies spread the virus on death, creating devastating chain reactions.',
    unlocked: true },

  // ── INDEX 10-14: Unlockable Tier 1 (250-400 ◈) ─────────────────────────────
  { n: 'PLASMA VORTEX',
    col: '#FF44FF', rng: 200, cd: 2.2,   dmg: 4.0,  t: 'wave',
    cat: 'tactical', tag: 'VORTEX',
    desc: 'Deploys a slow-moving vortex that pulls enemies and detonates on expiry. Devastating area damage — timing is everything.',
    unlocked: false, unlockCost: 300 },

  { n: 'LASER PRISM',
    col: '#00FFAA', rng: 400, cd: 0.55,  dmg: 1.8,  t: 'beam',
    cat: 'energy',   tag: 'BOUNCE',
    desc: 'Crystalline beam refracts off map boundaries up to three times. One shot can strike enemies across the entire arena.',
    unlocked: false, unlockCost: 250 },

  { n: 'TIME LOOP',
    col: '#AA88FF', rng: 220, cd: 1.1,   dmg: 2.2,  t: 'split',
    cat: 'tactical', tag: 'RICOCHET',
    desc: 'Quantum projectile reverses trajectory after 1 second, striking again from the opposite direction. Double the punishment.',
    unlocked: false, unlockCost: 350 },

  { n: 'DATA CORRUPT',
    col: '#FF2244', rng: 180, cd: 0.70,  dmg: 0.8,  t: 'virus',
    cat: 'status',   tag: 'CHAIN CORRUPT',
    desc: 'Advanced corruption payload detonates infected targets on death. Kills become chain explosions — lethal in dense packs.',
    unlocked: false, unlockCost: 280 },

  { n: 'DRONE SWARM MK2',
    col: '#FFAA00', rng: 280, cd: 3.5,   dmg: 1.2,  t: 'chain',
    cat: 'tactical', tag: 'AUTO-TARGET',
    desc: 'Releases six autonomous hunter drones that lock onto and eliminate the nearest enemies. Set and forget — they do the work.',
    unlocked: false, unlockCost: 400 },

  // ── INDEX 15-19: Unlockable Tier 2 (420-550 ◈) ─────────────────────────────
  { n: 'GRAVITON GUN',
    col: '#8844FF', rng: 0,   cd: 4.0,   dmg: 3.0,  t: 'blackhole',
    cat: 'special',  tag: 'LIFT & SLAM',
    desc: 'Targeted gravitational lance lifts enemies and slams them into obstacles. Strong stun — exceptional boss damage multiplier.',
    unlocked: false, unlockCost: 450 },

  { n: 'EMP BLASTER',
    col: '#44FFFF', rng: 0,   cd: 3.8,   dmg: 1.5,  t: 'pulse',
    cat: 'energy',   tag: 'EMP STUN',
    desc: 'Wide electromagnetic pulse stuns every enemy on screen and disables environmental traps. Zero collateral — total control.',
    unlocked: false, unlockCost: 320 },

  { n: 'FLAME WALL',
    col: '#FF6600', rng: 160, cd: 2.8,   dmg: 0.6,  t: 'spread',
    cat: 'spread',   tag: 'SUSTAINED',
    desc: 'Deploys a persistent thermal barrier across the fire arc. Enemies moving through take sustained burn damage.',
    unlocked: false, unlockCost: 340 },

  { n: 'SNIPER RAIL',
    col: '#FF0040', rng: 9999, cd: 2.5,  dmg: 12,   t: 'sniper',
    cat: 'energy',   tag: 'PIERCING LASER',
    desc: 'Electromagnetic railgun fires a red laser that pierces every enemy in its path simultaneously. Maximum range. Zero falloff. Lethal.',
    unlocked: false, unlockCost: 550 },

  { n: 'SHATTER MISSILE',
    col: '#FF8844', rng: 300, cd: 1.8,   dmg: 3.5,  t: 'split',
    cat: 'tactical', tag: 'FRAG',
    desc: 'High-velocity payload fragments into six armor-piercing shards on contact. Devastating burst damage against clustered threats.',
    unlocked: false, unlockCost: 500 },

  // ── INDEX 20: Elite Tier ───────────────────────────────────────────────────
  { n: 'QUANTUM ENTROPY',
    col: '#FF00FF', rng: 240, cd: 3.2,   dmg: 6.0,  t: 'wave',
    cat: 'special',  tag: 'CHAIN DETONATION',
    desc: 'Releases unstable quantum fields that detonate in sequence. Each explosion triggers two more — a self-perpetuating chain of destruction.',
    unlocked: false, unlockCost: 650 },
];

export function unlockWeapon(idx) {
  if (idx >= 0 && idx < WPNS.length) {
    WPNS[idx].unlocked = true;
    const saved = JSON.parse(localStorage.getItem('pw_weapons') || '[]');
    if (!saved.includes(idx)) { saved.push(idx); localStorage.setItem('pw_weapons', JSON.stringify(saved)); }
  }
}

export function loadWeaponUnlocks() {
  const saved = JSON.parse(localStorage.getItem('pw_weapons') || '[]');
  saved.forEach(idx => { if (WPNS[idx]) WPNS[idx].unlocked = true; });
}
