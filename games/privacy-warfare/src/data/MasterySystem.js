// ─── MasterySystem v2.0 ───────────────────────────────────────────────────────
// 60+ challenges across 7 categories. Progress is stored in localStorage.

const CHALLENGES = [
  // ── KILLS ────────────────────────────────────────────────────────────────────
  { id: 'kill1',      cat: 'KILLS',   name: 'First Blood',      desc: 'Kill 1 enemy',               target: 1,      stat: 'kills',       reward: 50   },
  { id: 'kill10',     cat: 'KILLS',   name: 'Skirmisher',       desc: 'Kill 10 enemies',             target: 10,     stat: 'kills',       reward: 75   },
  { id: 'kill50',     cat: 'KILLS',   name: 'Soldier',          desc: 'Kill 50 enemies',             target: 50,     stat: 'kills',       reward: 100  },
  { id: 'kill100',    cat: 'KILLS',   name: 'Centurion',        desc: 'Kill 100 enemies',            target: 100,    stat: 'kills',       reward: 150  },
  { id: 'kill250',    cat: 'KILLS',   name: 'Slaughterer',      desc: 'Kill 250 enemies',            target: 250,    stat: 'kills',       reward: 200  },
  { id: 'kill500',    cat: 'KILLS',   name: 'Executioner',      desc: 'Kill 500 enemies',            target: 500,    stat: 'kills',       reward: 300  },
  { id: 'kill1000',   cat: 'KILLS',   name: 'Massacre',         desc: 'Kill 1,000 enemies',          target: 1000,   stat: 'kills',       reward: 500  },
  { id: 'kill5000',   cat: 'KILLS',   name: 'Genocide Protocol',desc: 'Kill 5,000 enemies',          target: 5000,   stat: 'kills',       reward: 1000 },

  // ── WAVES ────────────────────────────────────────────────────────────────────
  { id: 'wave3',      cat: 'WAVES',   name: 'Survivor',         desc: 'Reach wave 3',                target: 3,      stat: 'maxWave',     reward: 50   },
  { id: 'wave5',      cat: 'WAVES',   name: 'Veteran',          desc: 'Reach wave 5',                target: 5,      stat: 'maxWave',     reward: 100  },
  { id: 'wave10',     cat: 'WAVES',   name: 'Ironclad',         desc: 'Reach wave 10',               target: 10,     stat: 'maxWave',     reward: 200  },
  { id: 'wave15',     cat: 'WAVES',   name: 'Unstoppable',      desc: 'Reach wave 15',               target: 15,     stat: 'maxWave',     reward: 350  },
  { id: 'wave20',     cat: 'WAVES',   name: 'Immortal',         desc: 'Reach wave 20',               target: 20,     stat: 'maxWave',     reward: 500  },
  { id: 'wave30',     cat: 'WAVES',   name: 'Legend',           desc: 'Reach wave 30',               target: 30,     stat: 'maxWave',     reward: 750  },
  { id: 'wave50',     cat: 'WAVES',   name: 'God Mode',         desc: 'Reach wave 50',               target: 50,     stat: 'maxWave',     reward: 1500 },

  // ── SCORE ────────────────────────────────────────────────────────────────────
  { id: 'score1k',    cat: 'SCORE',   name: 'Point Scorer',     desc: 'Score 1,000 points',          target: 1000,   stat: 'score',       reward: 50   },
  { id: 'score5k',    cat: 'SCORE',   name: 'Digital Fighter',  desc: 'Score 5,000 points',          target: 5000,   stat: 'score',       reward: 100  },
  { id: 'score10k',   cat: 'SCORE',   name: 'Data Warrior',     desc: 'Score 10,000 points',         target: 10000,  stat: 'score',       reward: 150  },
  { id: 'score50k',   cat: 'SCORE',   name: 'High Roller',      desc: 'Score 50,000 points',         target: 50000,  stat: 'score',       reward: 300  },
  { id: 'score100k',  cat: 'SCORE',   name: 'Cyber Champion',   desc: 'Score 100,000 points',        target: 100000, stat: 'score',       reward: 500  },
  { id: 'score500k',  cat: 'SCORE',   name: 'Top Tier Hacker',  desc: 'Score 500,000 points',        target: 500000, stat: 'score',       reward: 1000 },

  // ── COMBAT ───────────────────────────────────────────────────────────────────
  { id: 'noDamage',   cat: 'COMBAT',  name: 'Ghost',            desc: 'Clear a wave without damage', target: 1,      stat: 'noDmgWaves',  reward: 200  },
  { id: 'noDamage5',  cat: 'COMBAT',  name: 'Phantom',          desc: 'Clear 5 waves without damage',target: 5,      stat: 'noDmgWaves',  reward: 500  },
  { id: 'fullHp',     cat: 'COMBAT',  name: 'Untouchable',      desc: 'Finish a wave at full HP',    target: 1,      stat: 'fullHpWaves', reward: 150  },
  { id: 'fullHp10',   cat: 'COMBAT',  name: 'Iron Curtain',     desc: 'Finish 10 waves at full HP',  target: 10,     stat: 'fullHpWaves', reward: 400  },
  { id: 'combo20',    cat: 'COMBAT',  name: 'Combo Starter',    desc: 'Reach 20x combo',             target: 20,     stat: 'maxCombo',    reward: 150  },
  { id: 'combo50',    cat: 'COMBAT',  name: 'Combo Master',     desc: 'Reach 50x combo',             target: 50,     stat: 'maxCombo',    reward: 300  },
  { id: 'combo100',   cat: 'COMBAT',  name: 'Combo God',        desc: 'Reach 100x combo',            target: 100,    stat: 'maxCombo',    reward: 600  },
  { id: 'dashKill',   cat: 'COMBAT',  name: 'Dash Striker',     desc: 'Kill an enemy while dashing', target: 1,      stat: 'dashKills',   reward: 100  },
  { id: 'dashKill25', cat: 'COMBAT',  name: 'Speed Demon',      desc: 'Kill 25 enemies while dashing',target: 25,   stat: 'dashKills',   reward: 300  },
  { id: 'killStreak4',cat: 'COMBAT',  name: 'Quad Kill',        desc: 'Get a 4-kill streak',         target: 1,      stat: 'quadKills',   reward: 150  },
  { id: 'killStreak6',cat: 'COMBAT',  name: 'Ultra Kill',       desc: 'Get a 6-kill streak',         target: 1,      stat: 'ultraKills',  reward: 300  },

  // ── BOSS ─────────────────────────────────────────────────────────────────────
  { id: 'boss1',      cat: 'BOSS',    name: 'Boss Slayer',      desc: 'Defeat your first boss',      target: 1,      stat: 'bossKills',   reward: 200  },
  { id: 'boss3',      cat: 'BOSS',    name: 'Boss Hunter',      desc: 'Defeat 3 bosses',             target: 3,      stat: 'bossKills',   reward: 350  },
  { id: 'boss5',      cat: 'BOSS',    name: 'Boss Slayer II',   desc: 'Defeat 5 bosses',             target: 5,      stat: 'bossKills',   reward: 500  },
  { id: 'boss10',     cat: 'BOSS',    name: 'Boss Annihilator', desc: 'Defeat 10 bosses',            target: 10,     stat: 'bossKills',   reward: 750  },
  { id: 'boss20',     cat: 'BOSS',    name: 'Apex Predator',    desc: 'Defeat 20 bosses',            target: 20,     stat: 'bossKills',   reward: 1200 },

  // ── WEAPONS ──────────────────────────────────────────────────────────────────
  { id: 'allWeapons10',cat:'WEAPONS', name: 'Arsenal Novice',   desc: 'Fire all 10 original weapons',target: 10,     stat: 'weaponsUsed', reward: 200  },
  { id: 'allWeapons20',cat:'WEAPONS', name: 'Full Arsenal',     desc: 'Fire all 20 weapons',         target: 20,     stat: 'weaponsUsed', reward: 500  },
  { id: 'bombUse5',   cat: 'WEAPONS', name: 'Bomber',           desc: 'Use Bomb ability 5 times',    target: 5,      stat: 'bombUses',    reward: 100  },
  { id: 'bombUse25',  cat: 'WEAPONS', name: 'Demolitions',      desc: 'Use Bomb ability 25 times',   target: 25,     stat: 'bombUses',    reward: 250  },
  { id: 'nukeUse1',   cat: 'WEAPONS', name: 'Nuclear Option',   desc: 'Fire the Nuke Strike',        target: 1,      stat: 'nukeUses',    reward: 150  },
  { id: 'nukeUse10',  cat: 'WEAPONS', name: 'MAD Protocol',     desc: 'Fire Nuke Strike 10 times',   target: 10,     stat: 'nukeUses',    reward: 350  },
  { id: 'blackHole1', cat: 'WEAPONS', name: 'Event Horizon',    desc: 'Create a black hole',         target: 1,      stat: 'blackHoles',  reward: 100  },
  { id: 'cryo10',     cat: 'WEAPONS', name: 'Ice Age',          desc: 'Freeze 10 enemies',           target: 10,     stat: 'cryoFreezes', reward: 150  },
  { id: 'virusKill10',cat: 'WEAPONS', name: 'Patient Zero',     desc: 'Kill 10 enemies with virus',  target: 10,     stat: 'virusKills',  reward: 200  },

  // ── ABILITIES ────────────────────────────────────────────────────────────────
  { id: 'ability10',  cat: 'ABILITIES',name:'Tactician',        desc: 'Use abilities 10 times',      target: 10,     stat: 'abilityUses', reward: 100  },
  { id: 'ability50',  cat: 'ABILITIES',name:'Operator',         desc: 'Use abilities 50 times',      target: 50,     stat: 'abilityUses', reward: 250  },
  { id: 'ability100', cat: 'ABILITIES',name:'Special Forces',   desc: 'Use abilities 100 times',     target: 100,    stat: 'abilityUses', reward: 400  },
  { id: 'timeWarp3',  cat: 'ABILITIES',name:'Chrono',           desc: 'Use Time Warp 3 times',       target: 3,      stat: 'timeWarpUses',reward: 100  },
  { id: 'timeWarp15', cat: 'ABILITIES',name:'Time Lord',        desc: 'Use Time Warp 15 times',      target: 15,     stat: 'timeWarpUses',reward: 300  },
  { id: 'empShield5', cat: 'ABILITIES',name:'Iron Guard',       desc: 'Use EMP Shield 5 times',      target: 5,      stat: 'empUses',     reward: 150  },
  { id: 'overclock5', cat: 'ABILITIES',name:'Overclocked',      desc: 'Use Overclock 5 times',       target: 5,      stat: 'overclockUses',reward: 150 },
  { id: 'kp5',        cat: 'ABILITIES',name:'Kernel Panic',     desc: 'Trigger Kernel Panic 5 times',target: 5,      stat: 'kpUses',      reward: 150  },

  // ── ECONOMY ──────────────────────────────────────────────────────────────────
  { id: 'credits200', cat: 'ECONOMY', name: 'Saver',            desc: 'Accumulate 200 credits',      target: 200,    stat: 'maxCredits',  reward: 50   },
  { id: 'credits500', cat: 'ECONOMY', name: 'Hoarder',          desc: 'Accumulate 500 credits',      target: 500,    stat: 'maxCredits',  reward: 100  },
  { id: 'credits2000',cat: 'ECONOMY', name: 'Data Tycoon',      desc: 'Accumulate 2,000 credits',    target: 2000,   stat: 'maxCredits',  reward: 300  },
  { id: 'shop3',      cat: 'ECONOMY', name: 'Shopper',          desc: 'Buy 3 items from the shop',   target: 3,      stat: 'shopBuys',    reward: 100  },
  { id: 'shop10',     cat: 'ECONOMY', name: 'Power Buyer',      desc: 'Buy 10 items from the shop',  target: 10,     stat: 'shopBuys',    reward: 250  },
  { id: 'shop25',     cat: 'ECONOMY', name: 'Marketplace King', desc: 'Buy 25 items from the shop',  target: 25,     stat: 'shopBuys',    reward: 500  },
];

export const CATEGORIES = ['KILLS', 'WAVES', 'SCORE', 'COMBAT', 'BOSS', 'WEAPONS', 'ABILITIES', 'ECONOMY'];

export class MasterySystem {
  constructor() { this._load(); }

  _load() {
    try {
      const d = JSON.parse(localStorage.getItem('pw_mastery') || '{}');
      this.progress  = d.progress  || {};
      this.completed = d.completed || {};
    } catch {
      this.progress = {}; this.completed = {};
    }
  }

  _save() {
    localStorage.setItem('pw_mastery', JSON.stringify({ progress: this.progress, completed: this.completed }));
  }

  /** Call after each game event. Returns array of newly completed challenges. */
  updateStat(stat, value) {
    const newly = [];
    for (const c of CHALLENGES) {
      if (this.completed[c.id]) continue;
      if (c.stat !== stat) continue;
      this.progress[c.id] = (this.progress[c.id] || 0) + value;
      if (this.progress[c.id] >= c.target) {
        this.completed[c.id] = true;
        newly.push(c);
      }
    }
    if (newly.length) this._save();
    return newly;
  }

  /** Update a stat to an absolute value (for max-tracking stats like maxWave, maxCombo). */
  setStat(stat, value) {
    const newly = [];
    for (const c of CHALLENGES) {
      if (this.completed[c.id]) continue;
      if (c.stat !== stat) continue;
      const current = this.progress[c.id] || 0;
      if (value > current) this.progress[c.id] = value;
      if (this.progress[c.id] >= c.target) {
        this.completed[c.id] = true;
        newly.push(c);
      }
    }
    if (newly.length) this._save();
    return newly;
  }

  getAll()              { return CHALLENGES.map(c => ({ ...c, progress: this.progress[c.id] || 0, done: !!this.completed[c.id] })); }
  getByCategory(cat)    { return this.getAll().filter(c => c.cat === cat); }
  getTotalCompleted()   { return Object.keys(this.completed).length; }
  getTotalChallenges()  { return CHALLENGES.length; }
}
