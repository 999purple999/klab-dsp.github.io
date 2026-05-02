import { Storage } from './Storage.js';
import { seededRandom } from '../utils/math.js';

function getTodaySeed() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`, 10);
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
}

const MODIFIERS = ['no_shield', 'collect_3_magnets', 'score_with_gravity_x3'];
const MODIFIER_LABELS = {
  no_shield: 'No SHIELD powerup',
  collect_3_magnets: 'Collect 3 MAGNETs',
  score_with_gravity_x3: 'Flip gravity 3+ times per pipe'
};

export class DailyChallenges {
  constructor() {
    const seed = getTodaySeed();
    const rng = seededRandom(seed);
    this.targetScore = Math.floor(rng() * 26) + 15; // 15-40
    const modIdx = Math.floor(rng() * MODIFIERS.length);
    this.modifier = MODIFIERS[modIdx];
    this.modifierLabel = MODIFIER_LABELS[this.modifier];
    this._todayKey = getTodayKey();
    this._savedKey = `dr_daily_${this._todayKey}`;
    this.bestScore = Storage.get(this._savedKey, 0);
    this.completed = this.bestScore >= this.targetScore;
  }

  checkCompletion(run) {
    if (run.score >= this.targetScore) {
      if (run.score > this.bestScore) {
        this.bestScore = run.score;
        Storage.set(this._savedKey, this.bestScore);
      }
      this.completed = true;
      return true;
    }
    return false;
  }

  isModifierMet(run) {
    if (this.modifier === 'no_shield') return run.shieldUsed === false;
    if (this.modifier === 'collect_3_magnets') return (run.magnetsCollected || 0) >= 3;
    if (this.modifier === 'score_with_gravity_x3') return (run.flipsPerPipe || 0) >= 3;
    return false;
  }

  getDescription() {
    return `Score ${this.targetScore}+ · ${this.modifierLabel}`;
  }
}
