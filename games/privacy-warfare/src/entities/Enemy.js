// ─── Enemy ────────────────────────────────────────────────────────────────────
// Wave 0: enemy logic is inline in GameScene.
// This file exports shared constants for use by GameScene.

export const EDEFS = {
  normal:   { col: '#FF4444', sz: 12, hp: 1, spd: 65,  pts: 10  },
  elite:    { col: '#FF8800', sz: 15, hp: 2, spd: 82,  pts: 25  },
  phish:    { col: '#FF00FF', sz: 11, hp: 1, spd: 105, pts: 20  },
  shooter:  { col: '#FF6060', sz: 13, hp: 2, spd: 55,  pts: 35  },
  doppel:   { col: '#AAAAFF', sz: 13, hp: 2, spd: 78,  pts: 30  },
  cloaker:  { col: '#FF44FF', sz: 10, hp: 1, spd: 92,  pts: 40  },
  berser:   { col: '#FF2200', sz: 13, hp: 2, spd: 72,  pts: 35  },
  tank:     { col: '#996633', sz: 20, hp: 5, spd: 32,  pts: 60  },
  teleport: { col: '#44FFFF', sz: 11, hp: 1, spd: 62,  pts: 50  },
  necro:    { col: '#CC00FF', sz: 15, hp: 3, spd: 52,  pts: 100 },
};
