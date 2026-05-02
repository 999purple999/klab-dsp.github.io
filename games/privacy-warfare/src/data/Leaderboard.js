export class Leaderboard {
  constructor() { this._load(); }
  _load() { this.entries=JSON.parse(localStorage.getItem('pw_lb')||'[]'); }
  _save() { localStorage.setItem('pw_lb', JSON.stringify(this.entries)); }
  submit(name, score, wave) {
    this.entries.push({name:name||'ANON', score, wave, date:Date.now()});
    this.entries.sort((a,b)=>b.score-a.score);
    this.entries=this.entries.slice(0,10);
    this._save();
    return this.entries.findIndex(e=>e.score===score && e.wave===wave);
  }
  getTop(n=10) { return this.entries.slice(0,n); }
  isTopScore(score) { return this.entries.length<10 || score>=(this.entries[this.entries.length-1]?.score||0); }
}
