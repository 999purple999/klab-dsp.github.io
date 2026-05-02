export const SHOP_CATALOG = [
  {id:'hp',      name:'HP Restore',     desc:'+1 heart',            cost:80,  type:'consumable'},
  {id:'shield',  name:'EMP Shield Ext', desc:'Shield +25%',         cost:60,  type:'consumable'},
  {id:'dmg',     name:'Overclock Chip', desc:'Damage +15%',         cost:120, type:'upgrade'},
  {id:'speed',   name:'Speed Boost',    desc:'Movement +10%',       cost:100, type:'upgrade'},
  {id:'cd',      name:'Cache Clear',    desc:'Cooldowns -10%',      cost:110, type:'upgrade'},
  {id:'range',   name:'Antenna Ext',    desc:'Weapon range +15%',   cost:90,  type:'upgrade'},
  {id:'xp2',     name:'XP Doubler',     desc:'2x XP next wave',     cost:70,  type:'buff'},
  {id:'nuke',    name:'Nuke Charge',    desc:'Fill nuke bar 50%',   cost:150, type:'consumable'},
  {id:'revive',  name:'Ghost Protocol', desc:'Auto-revive once',    cost:200, type:'passive'},
  {id:'credits', name:'Credit Launder', desc:'+50 credits',         cost:40,  type:'consumable'},
];

export function getShopItem(id) { return SHOP_CATALOG.find(i=>i.id===id); }
export function canAfford(credits, id) { const item=getShopItem(id); return item && credits>=item.cost; }
