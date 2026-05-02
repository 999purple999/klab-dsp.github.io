import { Storage } from './Storage.js';

const ACHIEVEMENT_LIST = [
  {
    id: 'first_run',
    name: 'First Flight',
    desc: 'Complete your first run',
    check: (run, stats) => run.score >= 0
  },
  {
    id: 'score_10',
    name: 'Getting Started',
    desc: 'Reach score 10',
    check: (run) => run.score >= 10
  },
  {
    id: 'score_50',
    name: 'Speed Demon',
    desc: 'Reach score 50',
    check: (run) => run.score >= 50
  },
  {
    id: 'score_100',
    name: 'Data Runner',
    desc: 'Reach score 100',
    check: (run) => run.score >= 100
  },
  {
    id: 'flips_10',
    name: 'Flip Master',
    desc: '10 flips in one run',
    check: (run) => run.flips >= 10
  },
  {
    id: 'flips_50',
    name: 'Gravity Bender',
    desc: '50 flips in one run',
    check: (run) => run.flips >= 50
  },
  {
    id: 'powerup_5',
    name: 'Power Collector',
    desc: 'Collect 5 powerups in one run',
    check: (run) => run.powerupsCollected >= 5
  },
  {
    id: 'coins_50',
    name: 'Coin Hoarder',
    desc: 'Collect 50 total coins',
    check: (run, stats) => (stats.totalCoins || 0) >= 50
  },
  {
    id: 'zen_5',
    name: 'Zen Master',
    desc: 'Play Zen mode 5 times',
    check: (run, stats) => (stats.zenPlays || 0) >= 5
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    desc: 'Reach player level 5',
    check: (run, stats) => (stats.level || 1) >= 5
  },
  {
    id: 'no_powerup',
    name: 'Pure Run',
    desc: 'Score 20+ without collecting any powerup',
    check: (run) => run.score >= 20 && run.powerupsCollected === 0
  },
  {
    id: 'daily',
    name: 'Daily Challenger',
    desc: 'Complete a daily challenge',
    check: (run, stats) => stats.dailyCompleted === true
  }
];

export class Achievements {
  constructor() {
    this._unlocked = Storage.get('dr_achievements', {});
  }

  checkRun(run, stats) {
    const newlyUnlocked = [];
    for (const ach of ACHIEVEMENT_LIST) {
      if (!this._unlocked[ach.id]) {
        try {
          if (ach.check(run, stats)) {
            this._unlocked[ach.id] = true;
            newlyUnlocked.push({ id: ach.id, name: ach.name, desc: ach.desc });
          }
        } catch {
          // ignore check errors
        }
      }
    }
    if (newlyUnlocked.length > 0) {
      Storage.set('dr_achievements', this._unlocked);
    }
    return newlyUnlocked;
  }

  isUnlocked(id) {
    return !!this._unlocked[id];
  }

  getAll() {
    return ACHIEVEMENT_LIST.map(a => ({
      ...a,
      unlocked: !!this._unlocked[a.id]
    }));
  }
}
