import { Storage } from './Storage.js';

const DEFS = {
  first_shred:  { id: 'first_shred',  label: 'Data Eraser',   desc: 'Destroy your first document'              },
  no_trace:     { id: 'no_trace',     label: 'No Trace Left', desc: '10 docs under 30s each, 100% completion'   },
  all_methods:  { id: 'all_methods',  label: 'Methodical',    desc: 'Use all 4 destruction methods'             },
  multitouch:   { id: 'multitouch',   label: 'Multitasker',   desc: 'Shred with 3+ fingers simultaneously'      },
  pyromaniac:   { id: 'pyromaniac',   label: 'Pyromaniac',    desc: 'Burn 5 documents'                          },
};

let unlocked = Storage.get('achievements', {});
let listeners = [];

function save() { Storage.set('achievements', unlocked); }

export const Achievements = {
  check(id) {
    if (unlocked[id]) return;
    const def = DEFS[id];
    if (!def) return;
    unlocked[id] = true;
    save();
    for (const fn of listeners) fn(def);
  },
  onUnlock(fn) { listeners.push(fn); },
  isUnlocked(id) { return !!unlocked[id]; },
  getAll() { return Object.values(DEFS).map(d => ({ ...d, unlocked: !!unlocked[d.id] })); },
};
