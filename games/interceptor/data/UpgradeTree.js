import { Storage } from './Storage.js';

const UPGRADES = [
  {
    id: 'firewall_hp',
    name: 'Reinforced Firewall',
    desc: '4HP instead of 3',
    cost: 500,
  },
  {
    id: 'auto_repair',
    name: 'Self-Repair Protocol',
    desc: 'Regain 1HP after 5s no damage',
    cost: 800,
  },
  {
    id: 'powerup_radius',
    name: 'Extended Reach',
    desc: 'Power-up hit radius ×1.5',
    cost: 300,
  },
  {
    id: 'score_boost',
    name: 'Data Multiplier',
    desc: 'All scores ×1.2',
    cost: 600,
  },
  {
    id: 'packet_info',
    name: 'Threat Analysis',
    desc: 'Show packet type before halfway',
    cost: 400,
  },
];

export class UpgradeTree {
  constructor() {
    this._owned = Storage.get('upgrades', {});
    this._lifetimeScore = Storage.get('lifetimeScore', 0);
    this._spentScore = Storage.get('spentScore', 0);
  }

  addLifetimeScore(pts) {
    this._lifetimeScore += pts;
    Storage.set('lifetimeScore', this._lifetimeScore);
  }

  // Add a single run's score to lifetime total (call once per run at game over)
  addRunScore(runScore) {
    this._lifetimeScore += runScore;
    Storage.set('lifetimeScore', this._lifetimeScore);
  }

  getAvailablePoints() {
    return this._lifetimeScore - this._spentScore;
  }

  getLifetimeScore() {
    return this._lifetimeScore;
  }

  isOwned(id) {
    return !!this._owned[id];
  }

  canAfford(id) {
    const up = UPGRADES.find(u => u.id === id);
    if (!up) return false;
    return this.getAvailablePoints() >= up.cost;
  }

  buy(id) {
    if (this.isOwned(id)) return false;
    const up = UPGRADES.find(u => u.id === id);
    if (!up) return false;
    if (!this.canAfford(id)) return false;
    this._owned[id] = true;
    this._spentScore += up.cost;
    Storage.set('upgrades', this._owned);
    Storage.set('spentScore', this._spentScore);
    return true;
  }

  getAllUpgrades() {
    return UPGRADES.map(u => ({
      ...u,
      owned: this.isOwned(u.id),
      affordable: !this.isOwned(u.id) && this.canAfford(u.id),
    }));
  }

  getUpgradeById(id) {
    return UPGRADES.find(u => u.id === id);
  }
}
