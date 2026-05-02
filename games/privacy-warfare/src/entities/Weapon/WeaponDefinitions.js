// ─── Weapon Definitions ───────────────────────────────────────────────────────

export const BASE_CD  = [0.46, 0.065, 0.82, 1.25, 1.9, 5.0, 0.88, 0.58, 5.0, 0.38];
export const BASE_DMG = [1, 0.32, 2, 2.5, 1.5, 0, 1.5, 0.5, 8, 0.3];
export const BASE_RNG = [170, 265, 145, 350, 210, 0, 210, 190, 0, 160];

/** Mutable weapon array — upgrades mutate cd/dmg/rng in place. */
export const WPNS = [
  { n: 'RSA PULSE',       col: '#BF00FF', rng: 170, cd: 0.46,  dmg: 1,    t: 'pulse'    },
  { n: 'AES BEAM',        col: '#00FFFF', rng: 265, cd: 0.065, dmg: 0.32, t: 'beam'     },
  { n: 'SHA SHREDDER',    col: '#00FF41', rng: 145, cd: 0.82,  dmg: 2,    t: 'spread'   },
  { n: 'QUANTUM SPLIT',   col: '#FF8C00', rng: 350, cd: 1.25,  dmg: 2.5,  t: 'split'    },
  { n: 'MATRIX WAVE',     col: '#7FFF00', rng: 210, cd: 1.9,   dmg: 1.5,  t: 'wave'     },
  { n: 'BLACK HOLE',      col: '#9900FF', rng: 0,   cd: 5.0,   dmg: 0,    t: 'blackhole'},
  { n: 'CHAIN LIGHTNING', col: '#FFFF00', rng: 210, cd: 0.88,  dmg: 1.5,  t: 'chain'    },
  { n: 'CRYO RAY',        col: '#88FFFF', rng: 190, cd: 0.58,  dmg: 0.5,  t: 'cryo'     },
  { n: 'NUKE STRIKE',     col: '#FF4400', rng: 0,   cd: 5.0,   dmg: 8,    t: 'nuke'     },
  { n: 'VIRUS INJECT',    col: '#44FF00', rng: 160, cd: 0.38,  dmg: 0.3,  t: 'virus'    },
];
