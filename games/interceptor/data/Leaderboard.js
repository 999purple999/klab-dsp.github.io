import { Storage } from './Storage.js';

export class Leaderboard {
  constructor() {
    this._runs = Storage.get('leaderboard', []);
  }

  addRun(run) {
    // run: { score, wave, accuracy, date, difficulty }
    this._runs.push({ ...run, date: run.date || new Date().toLocaleDateString() });
    this._runs.sort((a, b) => b.score - a.score);
    this._runs = this._runs.slice(0, 5);
    Storage.set('leaderboard', this._runs);
  }

  getTop5() {
    return this._runs.slice(0, 5);
  }

  getTopScore() {
    return this._runs.length > 0 ? this._runs[0].score : 0;
  }
}
