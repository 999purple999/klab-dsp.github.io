const DAILY_POOL = [
  {id:'d_kills', name:'Daily Exterminator', desc:'Kill 50 enemies today',   target:50,    stat:'kills',     reward:100},
  {id:'d_wave',  name:'Daily Survivor',     desc:'Reach wave 8 today',      target:8,     stat:'maxWave',   reward:150},
  {id:'d_score', name:'Daily Scorer',       desc:'Score 50,000 today',      target:50000, stat:'score',     reward:200},
  {id:'d_boss',  name:'Daily Slayer',       desc:'Kill a boss today',       target:1,     stat:'bossKills', reward:300},
  {id:'d_combo', name:'Daily Combo',        desc:'Reach 15x combo',         target:15,    stat:'maxCombo',  reward:120},
];

export class DailyChallenges {
  constructor() { this._load(); }
  _todayKey() { return new Date().toISOString().slice(0,10); }
  _load() {
    const raw=JSON.parse(localStorage.getItem('pw_daily')||'{}');
    const today=this._todayKey();
    if(raw.date!==today){ this.data={date:today,progress:{},completed:{}}; this._save(); }
    else { this.data=raw; }
  }
  _save() { localStorage.setItem('pw_daily', JSON.stringify(this.data)); }
  updateStat(stat, val) {
    const newly=[];
    for(const c of DAILY_POOL){
      if(this.data.completed[c.id]) continue;
      if(c.stat===stat){ this.data.progress[c.id]=(this.data.progress[c.id]||0)+val; if(this.data.progress[c.id]>=c.target){ this.data.completed[c.id]=true; newly.push(c); } }
    }
    if(newly.length) this._save();
    return newly;
  }
  getAll() { return DAILY_POOL.map(c=>({...c,progress:this.data.progress[c.id]||0,done:!!this.data.completed[c.id]})); }
  getTotalCreditsEarned() { return DAILY_POOL.filter(c=>this.data.completed[c.id]).reduce((s,c)=>s+c.reward,0); }
}
