import { Storage } from './Storage.js';
import { EventBus } from '../utils/EventBus.js';

const DEFS = {
  destroyer:  { id: 'destroyer',  label: 'Destroyer',       desc: '100 collisions'             },
  zerog_master:{ id:'zerog_master',label: 'Zero-G Master',  desc: '10 zero-g activations'      },
  creator:    { id: 'creator',    label: 'Creator',          desc: '50 boxes spawned'            },
  locker:     { id: 'locker',     label: 'Architect',        desc: 'Lock 10 boxes'               },
  chaotic:    { id: 'chaotic',    label: 'Agent of Chaos',   desc: '5 chaos activations'         },
  slingshot:  { id: 'slingshot',  label: 'Slingshot Pro',    desc: 'Slingshot across full width' },
};

let unlocked = Storage.get('achievements', {});

function save() { Storage.set('achievements', unlocked); }

export const Achievements = {
  check(id, value) {
    if (unlocked[id]) return;
    const def = DEFS[id];
    if (!def) return;
    unlocked[id] = true;
    save();
    EventBus.emit('achievement', def);
  },
  isUnlocked(id) { return !!unlocked[id]; },
  getAll() { return Object.values(DEFS).map(d => ({ ...d, unlocked: !!unlocked[d.id] })); },
  reset() { unlocked = {}; save(); }
};
