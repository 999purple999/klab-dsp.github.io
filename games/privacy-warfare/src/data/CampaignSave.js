// ─── CampaignSave ─────────────────────────────────────────────────────────────
// Persists campaign progress in localStorage key `pw_campaign`.

export class CampaignSave {
  constructor() {
    this._load();
  }

  _load() {
    try {
      this.data = JSON.parse(localStorage.getItem('pw_campaign')) || this._fresh();
    } catch {
      this.data = this._fresh();
    }
  }

  _fresh() {
    return { unlockedZone: 0, levels: {} };
  }

  save() {
    localStorage.setItem('pw_campaign', JSON.stringify(this.data));
  }

  isZoneUnlocked(z) {
    return z <= this.data.unlockedZone;
  }

  isLevelComplete(z, l) {
    return !!(this.data.levels[`${z}_${l}`]);
  }

  completeLevel(z, l, stars) {
    this.data.levels[`${z}_${l}`] = { stars };
    if (l === 9) {
      this.data.unlockedZone = Math.max(this.data.unlockedZone, z + 1);
    }
    this.save();
  }

  getZoneStars(z) {
    let s = 0;
    for (let l = 0; l < 10; l++) {
      s += (this.data.levels[`${z}_${l}`]?.stars || 0);
    }
    return s;
  }

  getLevelStars(z, l) {
    return this.data.levels[`${z}_${l}`]?.stars || 0;
  }

  getZoneProgress(z) {
    let completed = 0;
    for (let l = 0; l < 10; l++) {
      if (this.isLevelComplete(z, l)) completed++;
    }
    return completed;
  }

  reset() {
    this.data = this._fresh();
    this.save();
  }
}
