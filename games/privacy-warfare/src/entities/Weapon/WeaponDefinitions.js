// ─── Weapon Definitions v2.0 ──────────────────────────────────────────────────
// 20 weapons total: 10 original + 10 new (indices 10-19).
// BASE_* arrays hold reset values for the first 10 (originals).
// New weapons keep their base stats permanently (no upgrade reset needed).

export const BASE_CD  = [0.46, 0.065, 0.82, 1.25, 1.9, 5.0, 0.88, 0.58, 5.0, 0.38];
export const BASE_DMG = [1,    0.32,  2,    2.5,  1.5, 0,   1.5,  0.5,  8,   0.3 ];
export const BASE_RNG = [170,  265,   145,  350,  210, 0,   210,  190,  0,   160 ];

/** All weapons. Skill upgrades mutate cd/dmg/rng in-place for indices 0-9. */
export const WPNS = [
  // ── Original 10 ─────────────────────────────────────────────────────────────
  { n: 'RSA PULSE',        col: '#BF00FF', rng: 170, cd: 0.46,  dmg: 1,    t: 'pulse',     desc: 'Rapid energy bolts. Reliable all-around weapon.',      unlocked: true  },
  { n: 'AES BEAM',         col: '#00FFFF', rng: 265, cd: 0.065, dmg: 0.32, t: 'beam',      desc: 'Hyper-fast data stream. Melts enemies at range.',       unlocked: true  },
  { n: 'SHA SHREDDER',     col: '#00FF41', rng: 145, cd: 0.82,  dmg: 2,    t: 'spread',    desc: 'Wide shotgun spread. Dominates close quarters.',        unlocked: true  },
  { n: 'QUANTUM SPLIT',    col: '#FF8C00', rng: 350, cd: 1.25,  dmg: 2.5,  t: 'split',     desc: 'Projectile forks into 3. Excellent mid-range DPS.',     unlocked: true  },
  { n: 'MATRIX WAVE',      col: '#7FFF00', rng: 210, cd: 1.9,   dmg: 1.5,  t: 'wave',      desc: 'Expanding ring pulse. Clears packed groups.',           unlocked: true  },
  { n: 'BLACK HOLE',       col: '#9900FF', rng: 0,   cd: 5.0,   dmg: 0,    t: 'blackhole', desc: 'Singularity that pulls all nearby enemies.',            unlocked: true  },
  { n: 'CHAIN LIGHTNING',  col: '#FFFF00', rng: 210, cd: 0.88,  dmg: 1.5,  t: 'chain',     desc: 'Arcs between up to 4 enemies. Crowd destroyer.',        unlocked: true  },
  { n: 'CRYO RAY',         col: '#88FFFF', rng: 190, cd: 0.58,  dmg: 0.5,  t: 'cryo',      desc: 'Freezes enemies solid. Low damage, high control.',      unlocked: true  },
  { n: 'NUKE STRIKE',      col: '#FF4400', rng: 0,   cd: 5.0,   dmg: 8,    t: 'nuke',      desc: 'Massive AOE explosion. Nuclear option.',                unlocked: true  },
  { n: 'VIRUS INJECT',     col: '#44FF00', rng: 160, cd: 0.38,  dmg: 0.3,  t: 'virus',     desc: 'Infects enemies; damage-over-time spreads on kill.',    unlocked: true  },

  // ── New 10 (v2.0) ───────────────────────────────────────────────────────────
  { n: 'PLASMA VORTEX',    col: '#FF44FF', rng: 200, cd: 2.2,   dmg: 4.0,  t: 'wave',      desc: 'Slow vortex orb that pulls & detonates. Huge damage.',  unlocked: false, unlockCost: 300 },
  { n: 'LASER PRISM',      col: '#00FFAA', rng: 400, cd: 0.55,  dmg: 1.8,  t: 'beam',      desc: 'Crystal beam bounces off walls up to 4 times.',         unlocked: false, unlockCost: 250 },
  { n: 'TIME LOOP',        col: '#AA88FF', rng: 220, cd: 1.1,   dmg: 2.2,  t: 'split',     desc: 'Projectile reverses and strikes again after 1 second.', unlocked: false, unlockCost: 350 },
  { n: 'DATA CORRUPT',     col: '#FF2244', rng: 180, cd: 0.70,  dmg: 0.8,  t: 'virus',     desc: 'Corrupted data spreads explosively on enemy death.',     unlocked: false, unlockCost: 280 },
  { n: 'DRONE SWARM MK2',  col: '#FFAA00', rng: 280, cd: 3.5,   dmg: 1.2,  t: 'chain',     desc: 'Deploys 6 hunter drones that auto-target enemies.',     unlocked: false, unlockCost: 400 },
  { n: 'GRAVITON GUN',     col: '#8844FF', rng: 0,   cd: 4.0,   dmg: 3.0,  t: 'blackhole', desc: 'Lifts enemies and slams them. Strong stun effect.',     unlocked: false, unlockCost: 450 },
  { n: 'EMP BLASTER',      col: '#44FFFF', rng: 0,   cd: 3.8,   dmg: 1.5,  t: 'pulse',     desc: 'Wide EMP burst stuns all enemies and disables traps.',  unlocked: false, unlockCost: 320 },
  { n: 'FLAME WALL',       col: '#FF6600', rng: 160, cd: 2.8,   dmg: 0.6,  t: 'spread',    desc: 'Casts a persistent burning barrier that damages foes.',  unlocked: false, unlockCost: 300 },
  { n: 'SNIPER RAIL',      col: '#FFFFFF', rng: 600, cd: 2.0,   dmg: 8.0,  t: 'pulse',     desc: 'Pinpoint railgun shot. Maximum range & alpha damage.',  unlocked: false, unlockCost: 380 },
  { n: 'SHATTER MISSILE',  col: '#FF8844', rng: 300, cd: 1.8,   dmg: 3.5,  t: 'split',     desc: 'Missile fragments into 6 shards on impact.',            unlocked: false, unlockCost: 340 },
];

/** Unlock a weapon by index. Persists to localStorage. */
export function unlockWeapon(idx) {
  if (idx >= 0 && idx < WPNS.length) {
    WPNS[idx].unlocked = true;
    const unlocked = JSON.parse(localStorage.getItem('pw_weapons') || '[]');
    if (!unlocked.includes(idx)) { unlocked.push(idx); localStorage.setItem('pw_weapons', JSON.stringify(unlocked)); }
  }
}

/** Load unlock state from localStorage on startup. */
export function loadWeaponUnlocks() {
  const unlocked = JSON.parse(localStorage.getItem('pw_weapons') || '[]');
  unlocked.forEach(idx => { if (WPNS[idx]) WPNS[idx].unlocked = true; });
}
