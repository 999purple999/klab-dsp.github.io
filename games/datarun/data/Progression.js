import { Storage } from './Storage.js';

export class Progression {
  constructor() {
    this._xp = Storage.get('dr_xp', 0);
    this._level = Storage.get('dr_level', 1);
    this._trailSkins = [
      { level: 1,  colors: ['#a855f7', '#00FFFF'] },
      { level: 5,  colors: ['#39FF14', '#00FFFF'] },
      { level: 10, colors: ['#FF6B00', '#FFD700'] },
      { level: 20, colors: ['#FF1493', '#FF69B4'] },
    ];
  }

  gainXP(amount) {
    this._xp += amount;
    let leveledUp = false;
    while (this._xp >= this._level * 100) {
      this._xp -= this._level * 100;
      this._level++;
      leveledUp = true;
    }
    Storage.set('dr_xp', this._xp);
    Storage.set('dr_level', this._level);
    return leveledUp;
  }

  getLevel() {
    return this._level;
  }

  getXP() {
    return this._xp;
  }

  getXPForLevel() {
    return this._level * 100;
  }

  getXPProgress() {
    return this._xp / (this._level * 100);
  }

  getTrailSkin() {
    let skin = this._trailSkins[0];
    for (const s of this._trailSkins) {
      if (this._level >= s.level) skin = s;
    }
    return skin;
  }
}
