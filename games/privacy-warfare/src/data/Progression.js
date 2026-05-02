const XP_PER_LEVEL = [0,100,250,450,700,1000,1400,1900,2500,3200,4000];

export class Progression {
  constructor() { this.xp=0; this.level=1; this._load(); }
  _load() { const d=JSON.parse(localStorage.getItem('pw_prog')||'{}'); this.xp=d.xp||0; this.level=d.level||1; }
  _save() { localStorage.setItem('pw_prog', JSON.stringify({xp:this.xp,level:this.level})); }
  addXP(amount) {
    this.xp += amount;
    let leveled=false;
    while(this.level < XP_PER_LEVEL.length-1 && this.xp >= XP_PER_LEVEL[this.level]) { this.level++; leveled=true; }
    this._save();
    return leveled;
  }
  getXPForNext() { return XP_PER_LEVEL[Math.min(this.level, XP_PER_LEVEL.length-1)]; }
  getProgress() { return Math.min(1, this.xp / this.getXPForNext()); }
}
