// data/Leaderboard.js — Local high score leaderboard

import { Storage } from './Storage.js';

const MAX_ENTRIES = 10;

class Leaderboard {
  constructor() {
    this._scores = Storage.get('leaderboard', []);
    this._hiNormal = Storage.get('hi', 0);
    this._hiSurvival = Storage.get('hi_survival', 0);
  }

  getHi(survival = false) {
    return survival ? this._hiSurvival : this._hiNormal;
  }

  submit(score, wave, survival = false) {
    const key = survival ? 'hi_survival' : 'hi';
    const current = survival ? this._hiSurvival : this._hiNormal;
    if (score > current) {
      if (survival) this._hiSurvival = score;
      else this._hiNormal = score;
      Storage.set(key, Math.floor(score));
    }

    const entry = { score: Math.floor(score), wave, survival, date: Date.now() };
    this._scores.push(entry);
    this._scores.sort((a, b) => b.score - a.score);
    if (this._scores.length > MAX_ENTRIES) this._scores.length = MAX_ENTRIES;
    Storage.set('leaderboard', this._scores);
    return entry;
  }

  getTop(limit = MAX_ENTRIES) {
    return this._scores.slice(0, limit);
  }
}

export const leaderboard = new Leaderboard();
