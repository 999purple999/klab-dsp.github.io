const CHALLENGES = [
  {id:'kill10',   name:'First Blood',   desc:'Kill 10 enemies',                     target:10,     stat:'kills'},
  {id:'kill100',  name:'Centurion',     desc:'Kill 100 enemies',                    target:100,    stat:'kills'},
  {id:'kill1000', name:'Massacre',      desc:'Kill 1000 enemies',                   target:1000,   stat:'kills'},
  {id:'wave5',    name:'Survivor',      desc:'Reach wave 5',                        target:5,      stat:'maxWave'},
  {id:'wave10',   name:'Veteran',       desc:'Reach wave 10',                       target:10,     stat:'maxWave'},
  {id:'wave20',   name:'Immortal',      desc:'Reach wave 20',                       target:20,     stat:'maxWave'},
  {id:'score10k', name:'Point Scorer',  desc:'Score 10,000',                        target:10000,  stat:'score'},
  {id:'score100k',name:'High Roller',   desc:'Score 100,000',                       target:100000, stat:'score'},
  {id:'noDamage', name:'Ghost',         desc:'Complete a wave without taking damage',target:1,     stat:'noDmgWaves'},
  {id:'useAbility10',name:'Tactician',  desc:'Use abilities 10 times',              target:10,     stat:'abilityUses'},
  {id:'bomb5',    name:'Bomber',        desc:'Use Bomb ability 5 times',            target:5,      stat:'bombUses'},
  {id:'dashKill', name:'Dash Striker',  desc:'Kill an enemy while dashing',         target:1,      stat:'dashKills'},
  {id:'boss1',    name:'Boss Slayer',   desc:'Defeat your first boss',              target:1,      stat:'bossKills'},
  {id:'boss5',    name:'Boss Hunter',   desc:'Defeat 5 bosses',                     target:5,      stat:'bossKills'},
  {id:'combo20',  name:'Combo Master',  desc:'Reach 20x combo',                     target:20,     stat:'maxCombo'},
  {id:'credits500',name:'Hoarder',      desc:'Accumulate 500 credits',              target:500,    stat:'maxCredits'},
  {id:'shop3',    name:'Shopper',       desc:'Buy 3 items from the shop',           target:3,      stat:'shopBuys'},
  {id:'fullHp',   name:'Untouchable',   desc:'Finish a wave at full HP',            target:1,      stat:'fullHpWaves'},
  {id:'allWeapons',name:'Arsenal',      desc:'Fire all 10 weapons in one run',      target:10,     stat:'weaponsUsed'},
  {id:'timeWarp3',name:'Chrono',        desc:'Use Time Warp 3 times',               target:3,      stat:'timeWarpUses'},
];

export class MasterySystem {
  constructor() { this._load(); }
  _load() { const d=JSON.parse(localStorage.getItem('pw_mastery')||'{}'); this.progress=d.progress||{}; this.completed=d.completed||{}; }
  _save() { localStorage.setItem('pw_mastery', JSON.stringify({progress:this.progress,completed:this.completed})); }
  updateStat(stat, value) {
    const newly=[];
    for(const c of CHALLENGES){
      if(this.completed[c.id]) continue;
      if(c.stat===stat){ this.progress[c.id]=(this.progress[c.id]||0)+value; if(this.progress[c.id]>=c.target){ this.completed[c.id]=true; newly.push(c); } }
    }
    if(newly.length) this._save();
    return newly;
  }
  getAll() { return CHALLENGES.map(c=>({...c, progress:this.progress[c.id]||0, done:!!this.completed[c.id]})); }
  getTotalCompleted() { return Object.keys(this.completed).length; }
}
