// ─── Gadget Catalog – Wave I ──────────────────────────────────────────────────
// 10 Tactical + 10 Lethal gadgets.
// use(gs) is called when the player activates the gadget.
// gs = GameScene instance. Cooldown in seconds.

export const GADGET_CATALOG = {

  // ── TACTICAL ──────────────────────────────────────────────────────────────

  smoke_grenade: {
    id: 'smoke_grenade', type: 'tactical', col: '#AAAAAA',
    name: 'Smoke Grenade', icon: '◌', cooldown: 30,
    desc: '8s smoke cloud — enemies inside have -80% accuracy.',
    synergies: ['bomb_squad'],
    use(gs) {
      const zones = gs._smokeZones || (gs._smokeZones = []);
      zones.push({ x: gs.px, y: gs.py, r: 90, timer: 8 });
      gs._spawnFloat?.(gs.px, gs.py - 30, 'SMOKE', '#AAAAAA');
    },
  },

  flashbang: {
    id: 'flashbang', type: 'tactical', col: '#FFFFFF',
    name: 'Flashbang', icon: '◉', cooldown: 25,
    desc: 'Stuns all enemies within 200px for 2s.',
    synergies: ['fast_hands'],
    use(gs) {
      let n = 0;
      for (const e of gs.EYES || []) {
        if (Math.hypot(e.x - gs.px, e.y - gs.py) < 200) {
          e._stunTimer = Math.max(e._stunTimer || 0, 2);
          n++;
        }
      }
      gs._burst?.(gs.px, gs.py, '#FFFFFF', 20, 200);
      gs._spawnFloat?.(gs.px, gs.py - 30, `FLASH ×${n}`, '#FFFFFF');
    },
  },

  stim_shot: {
    id: 'stim_shot', type: 'tactical', col: '#00FF88',
    name: 'Stim Shot', icon: '✚', cooldown: 20,
    desc: 'Instantly restore up to 40 HP.',
    synergies: ['restock'],
    use(gs) {
      const before = gs.hp;
      gs.hp = Math.min(gs.maxHp, gs.hp + 40);
      const healed = Math.round(gs.hp - before);
      gs._updateHpHud?.();
      if (typeof updateHpHud === 'function') updateHpHud(gs.hp, gs.maxHp);
      gs._spawnFloat?.(gs.px, gs.py - 30, `+${healed} HP`, '#00FF88');
    },
  },

  heartbeat_sensor: {
    id: 'heartbeat_sensor', type: 'tactical', col: '#FF6666',
    name: 'Heartbeat Sensor', icon: '◎', cooldown: 35,
    desc: 'Pings enemy positions within 400px on minimap for 5s.',
    synergies: ['tracker'],
    use(gs) {
      gs._heartbeatTimer = gs._perk_tracker ? 8 : 5;
      gs._heartbeatRange = 400;
      gs._spawnFloat?.(gs.px, gs.py - 30, 'PING ACTIVE', '#FF6666');
    },
  },

  decoy: {
    id: 'decoy', type: 'tactical', col: '#FFCC00',
    name: 'Decoy', icon: '◆', cooldown: 40,
    desc: 'Spawns a fake player that distracts enemies for 6s.',
    synergies: ['ghost'],
    use(gs) {
      const dur = gs._perk_ghost ? 12 : 6;
      const dx = gs.px + (Math.random() - 0.5) * 120;
      const dy = gs.py + (Math.random() - 0.5) * 120;
      (gs._decoys || (gs._decoys = [])).push({ x: dx, y: dy, timer: dur });
      gs._spawnFloat?.(gs.px, gs.py - 30, 'DECOY DEPLOYED', '#FFCC00');
    },
  },

  emp_pulse: {
    id: 'emp_pulse', type: 'tactical', col: '#00FFFF',
    name: 'EMP Pulse', icon: '⚡', cooldown: 30,
    desc: 'Stuns enemies within 300px for 1.5s. Clears enemy projectiles.',
    synergies: ['cold_blooded'],
    use(gs) {
      const r = gs._perk_coldBlooded ? 600 : 300;
      let n = 0;
      for (const e of gs.EYES || []) {
        if (Math.hypot(e.x - gs.px, e.y - gs.py) < r) {
          e._stunTimer = Math.max(e._stunTimer || 0, 1.5);
          n++;
        }
      }
      if (gs.EPROJS) gs.EPROJS = gs.EPROJS.filter(p => Math.hypot(p.x - gs.px, p.y - gs.py) >= r);
      gs._burst?.(gs.px, gs.py, '#00FFFF', 30, r);
      gs._spawnFloat?.(gs.px, gs.py - 30, `EMP ×${n}`, '#00FFFF');
    },
  },

  snapshot_grenade: {
    id: 'snapshot_grenade', type: 'tactical', col: '#88FFFF',
    name: 'Snapshot Grenade', icon: '◇', cooldown: 35,
    desc: 'Reveals all enemies within 350px through walls for 4s.',
    synergies: ['high_alert'],
    use(gs) {
      gs._snapshotTimer = gs._perk_highAlert ? 8 : 4;
      gs._snapshotRange = 350;
      gs._spawnFloat?.(gs.px, gs.py - 30, 'SNAPSHOT', '#88FFFF');
    },
  },

  trophy_system: {
    id: 'trophy_system', type: 'tactical', col: '#FFAA00',
    name: 'Trophy System', icon: '★', cooldown: 60,
    desc: 'Auto-destroys up to 5 incoming projectiles for 10s.',
    synergies: ['bomb_squad'],
    use(gs) {
      const shots = gs._perk_bombSquad ? 8 : 5;
      gs._trophySystem = { x: gs.px, y: gs.py, shots, timer: 10 };
      gs._spawnFloat?.(gs.px, gs.py - 30, `TROPHY ×${shots}`, '#FFAA00');
    },
  },

  deployable_cover: {
    id: 'deployable_cover', type: 'tactical', col: '#8888FF',
    name: 'Deployable Cover', icon: '▬', cooldown: 45,
    desc: 'Places a 80×30 barrier with 150 HP at your position.',
    synergies: ['battle_hardened'],
    use(gs) {
      const hp = gs._perk_battleHardened ? 210 : 150;
      (gs._deployCovers || (gs._deployCovers = [])).push({
        x: gs.px + 40, y: gs.py, w: 80, h: 30, hp, maxHp: hp, col: '#8888FF',
      });
      gs._spawnFloat?.(gs.px, gs.py - 30, 'COVER DEPLOYED', '#8888FF');
    },
  },

  tactical_insertion: {
    id: 'tactical_insertion', type: 'tactical', col: '#FF88FF',
    name: 'Tactical Insertion', icon: '✦', cooldown: 90,
    desc: 'Mark a respawn point. Die here = respawn with 50% HP within 30s.',
    synergies: ['battle_hardened'],
    use(gs) {
      gs._tacticalInsertionX     = gs.px;
      gs._tacticalInsertionY     = gs.py;
      gs._tacticalInsertionTimer = 30;
      gs._spawnFloat?.(gs.px, gs.py - 30, 'INSERTION MARKED', '#FF88FF');
    },
  },

  // ── LETHAL ────────────────────────────────────────────────────────────────

  frag_grenade: {
    id: 'frag_grenade', type: 'lethal', col: '#FF6622',
    name: 'Frag Grenade', icon: '#', cooldown: 15,
    desc: 'AoE 120px — 80 dmg center, 20 dmg edge.',
    synergies: ['resupply'],
    use(gs) {
      const tx = gs._aimX || gs.px + 100, ty = gs._aimY || gs.py;
      for (const e of gs.EYES || []) {
        const d = Math.hypot(e.x - tx, e.y - ty);
        if (d < 120) gs._damageE?.(e, Math.round(20 + 60 * (1 - d / 120)), true);
      }
      gs._burst?.(tx, ty, '#FF6622', 25, 120);
      gs._spawnFloat?.(tx, ty - 30, 'FRAG!', '#FF6622');
    },
  },

  semtex: {
    id: 'semtex', type: 'lethal', col: '#FF8800',
    name: 'Semtex', icon: '●', cooldown: 18,
    desc: 'Sticky grenade — sticks to enemies, detonates after 1.5s for 100 dmg.',
    synergies: ['resupply'],
    use(gs) {
      const tx = gs._aimX || gs.px + 100, ty = gs._aimY || gs.py;
      let stuck = false;
      for (const e of gs.EYES || []) {
        if (Math.hypot(e.x - tx, e.y - ty) < 30) {
          e._semtexTimer = 1.5; e._semtexDmg = 100;
          gs._spawnFloat?.(e.x, e.y - 20, 'STUCK!', '#FF8800');
          stuck = true; break;
        }
      }
      if (!stuck) {
        for (const e of gs.EYES || []) {
          if (Math.hypot(e.x - tx, e.y - ty) < 80) gs._damageE?.(e, 100, true);
        }
        gs._burst?.(tx, ty, '#FF8800', 20, 80);
      }
    },
  },

  thermite: {
    id: 'thermite', type: 'lethal', col: '#FF4400',
    name: 'Thermite', icon: '◈', cooldown: 20,
    desc: '4s burn patch — 25 dmg/s. Burns through cover.',
    synergies: ['scavenger'],
    use(gs) {
      const tx = gs._aimX || gs.px + 80, ty = gs._aimY || gs.py;
      (gs._burnPatches || (gs._burnPatches = [])).push({ x: tx, y: ty, r: 40, timer: 4, dps: 25, col: '#FF4400' });
      gs._burst?.(tx, ty, '#FF4400', 15, 80);
      gs._spawnFloat?.(tx, ty - 30, 'THERMITE', '#FF4400');
    },
  },

  claymore: {
    id: 'claymore', type: 'lethal', col: '#FF2200',
    name: 'Claymore', icon: '▲', cooldown: 30,
    desc: 'Proximity mine — 120 dmg in 100px when triggered.',
    synergies: ['bomb_squad'],
    use(gs) {
      (gs._mines || (gs._mines = [])).push({
        x: gs.px + 30, y: gs.py, r: 100,
        armTimer: 1.0, triggered: false, col: '#FF2200',
      });
      gs._spawnFloat?.(gs.px, gs.py - 30, 'CLAYMORE SET', '#FF2200');
    },
  },

  molotov: {
    id: 'molotov', type: 'lethal', col: '#FF6600',
    name: 'Molotov', icon: '🔥', cooldown: 22,
    desc: 'Fire pool 6s — 15 dmg/s. Enemies flee from fire.',
    synergies: [],
    use(gs) {
      const tx = gs._aimX || gs.px + 90, ty = gs._aimY || gs.py;
      (gs._burnPatches || (gs._burnPatches = [])).push({ x: tx, y: ty, r: 55, timer: 6, dps: 15, col: '#FF6600' });
      gs._burst?.(tx, ty, '#FF6600', 20, 110);
      gs._spawnFloat?.(tx, ty - 30, 'MOLOTOV', '#FF6600');
    },
  },

  throwing_knife: {
    id: 'throwing_knife', type: 'lethal', col: '#AAAAAA',
    name: 'Throwing Knife', icon: '✦', cooldown: 8,
    desc: 'Instant kill on hit within 60px. No cooldown on kill.',
    synergies: ['combat_scout'],
    use(gs) {
      for (const e of gs.EYES || []) {
        if (Math.hypot(e.x - gs.px, e.y - gs.py) < 60) {
          gs._damageE?.(e, e.hp || 9999, true);
          gs._spawnFloat?.(e.x, e.y - 20, '✦ KNIFE', '#AAAAAA');
          if (gs._perk_combatScout) e._marked = 3;
          return;
        }
      }
      gs._spawnFloat?.(gs.px, gs.py - 30, 'MISS', '#AAAAAA');
    },
  },

  c4: {
    id: 'c4', type: 'lethal', col: '#FFFF00',
    name: 'C4', icon: '◼', cooldown: 0,
    desc: 'Place on ground. Second use detonates all. 150 dmg AoE 150px. Max 2 active.',
    synergies: ['bomb_squad'],
    use(gs) {
      if (!gs._c4s) gs._c4s = [];
      const active = gs._c4s.filter(c => !c.det);
      if (active.length >= 2) {
        const dmg = gs._perk_bombSquad ? 200 : 150;
        for (const c of gs._c4s) {
          if (!c.det) {
            c.det = true;
            for (const e of gs.EYES || []) {
              if (Math.hypot(e.x - c.x, e.y - c.y) < 150) gs._damageE?.(e, dmg, true);
            }
            gs._burst?.(c.x, c.y, '#FFFF00', 30, 150);
          }
        }
        gs._c4s = [];
        gs._spawnFloat?.(gs.px, gs.py - 30, 'C4 DETONATED', '#FFFF00');
      } else {
        gs._c4s.push({ x: gs.px, y: gs.py, det: false, col: '#FFFF00' });
        gs._spawnFloat?.(gs.px, gs.py - 30, `C4 PLACED (${active.length + 1}/2)`, '#FFFF00');
      }
    },
  },

  gas_grenade: {
    id: 'gas_grenade', type: 'lethal', col: '#88FF44',
    name: 'Gas Grenade', icon: '◌', cooldown: 25,
    desc: 'Toxic cloud 8s — 10 dmg/s + 25% slow.',
    synergies: ['battle_hardened'],
    use(gs) {
      const tx = gs._aimX || gs.px + 80, ty = gs._aimY || gs.py;
      (gs._burnPatches || (gs._burnPatches = [])).push({
        x: tx, y: ty, r: 75, timer: 8, dps: 10, slow: 0.25, col: '#88FF44', isGas: true,
      });
      gs._burst?.(tx, ty, '#88FF44', 18, 150);
      gs._spawnFloat?.(tx, ty - 30, 'GAS!', '#88FF44');
    },
  },

  drill_charge: {
    id: 'drill_charge', type: 'lethal', col: '#FF9900',
    name: 'Drill Charge', icon: '↓', cooldown: 28,
    desc: 'Penetrating explosive through walls — 100 dmg in 80px.',
    synergies: ['overkill'],
    use(gs) {
      const tx = gs._aimX || gs.px + 90, ty = gs._aimY || gs.py;
      const dmg = gs._perk_overkill ? 130 : 100;
      for (const e of gs.EYES || []) {
        if (Math.hypot(e.x - tx, e.y - ty) < 80) gs._damageE?.(e, dmg, true);
      }
      gs._burst?.(tx, ty, '#FF9900', 20, 100);
      gs._spawnFloat?.(tx, ty - 30, 'DRILL!', '#FF9900');
    },
  },

  throwing_axe: {
    id: 'throwing_axe', type: 'lethal', col: '#CC8844',
    name: 'Throwing Axe', icon: '✖', cooldown: 10,
    desc: 'Melee instant kill within 65px. Marks hit targets if Tracker active.',
    synergies: ['tracker'],
    use(gs) {
      for (const e of gs.EYES || []) {
        if (Math.hypot(e.x - gs.px, e.y - gs.py) < 65) {
          gs._damageE?.(e, e.hp || 9999, true);
          gs._spawnFloat?.(e.x, e.y - 20, '✖ AXE', '#CC8844');
          if (gs._perk_tracker) e._marked = 3;
          return;
        }
      }
      gs._spawnFloat?.(gs.px, gs.py - 30, 'OUT OF RANGE', '#CC8844');
    },
  },
};

export const ALL_GADGETS      = Object.values(GADGET_CATALOG);
export const TACTICAL_GADGETS = ALL_GADGETS.filter(g => g.type === 'tactical');
export const LETHAL_GADGETS   = ALL_GADGETS.filter(g => g.type === 'lethal');

export function getGadget(id) { return GADGET_CATALOG[id] || null; }

// ─── Active gadget loadout state ──────────────────────────────────────────────
export class GadgetLoadout {
  constructor() {
    this.tactical = 'smoke_grenade';
    this.lethal   = 'frag_grenade';
    this._tactCD  = 0;
    this._letCD   = 0;
  }

  set(type, id) {
    if (type === 'tactical') this.tactical = id;
    else                     this.lethal   = id;
  }

  useTactical(gs) {
    if (this._tactCD > 0) return false;
    const g = GADGET_CATALOG[this.tactical];
    if (!g) return false;
    g.use(gs);
    this._tactCD = g.cooldown * (gs._perk_restock ? 0.8 : 1);
    return true;
  }

  useLethal(gs) {
    if (this._letCD > 0) return false;
    const g = GADGET_CATALOG[this.lethal];
    if (!g) return false;
    g.use(gs);
    this._letCD = g.cooldown * (gs._perk_resupply ? 0.75 : 1);
    return true;
  }

  update(dt) {
    this._tactCD = Math.max(0, this._tactCD - dt);
    this._letCD  = Math.max(0, this._letCD  - dt);
  }

  tacticalReady()  { return this._tactCD <= 0; }
  lethalReady()    { return this._letCD  <= 0; }
  tacticalCDPct()  { const g = GADGET_CATALOG[this.tactical]; return g?.cooldown ? this._tactCD / g.cooldown : 0; }
  lethalCDPct()    { const g = GADGET_CATALOG[this.lethal];   return g?.cooldown ? this._letCD  / g.cooldown : 0; }

  toJSON()   { return { tactical: this.tactical, lethal: this.lethal }; }
  fromJSON(d){ if (d) { this.tactical = d.tactical || 'smoke_grenade'; this.lethal = d.lethal || 'frag_grenade'; } }
}
