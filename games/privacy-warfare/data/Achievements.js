// data/Achievements.js — Achievement tracking

import { Storage } from './Storage.js';
import { bus } from '../utils/EventBus.js';

const DEFS = [
  { id: 'first_kill',   name: 'First Blood',       desc: 'Kill your first enemy' },
  { id: 'wave_5',       name: 'Seasoned Warrior',   desc: 'Survive wave 5' },
  { id: 'wave_10',      name: 'Battle Hardened',    desc: 'Survive wave 10' },
  { id: 'boss_1',       name: 'Boss Hunter',        desc: 'Defeat your first boss' },
  { id: 'boss_5',       name: 'Boss Slayer',        desc: 'Defeat 5 bosses' },
  { id: 'all_weapons',  name: 'Arsenal',            desc: 'Use all 10 weapons in a single run' },
  { id: 'all_abilities',name: 'Full Kit',           desc: 'Use all 6 abilities in a single run' },
  { id: 'skill_maxed',  name: 'Fully Upgraded',     desc: 'Max out any skill tree branch' },
  { id: 'survival_10',  name: 'Survivor',           desc: 'Reach wave 10 in Survival mode' },
  { id: 'no_hit_wave',  name: 'Ghost',              desc: 'Complete a wave without taking damage' },
];

class Achievements {
  constructor() {
    this._unlocked = Storage.get('achievements', {});
    this._runWeapons = new Set();
    this._runAbilities = new Set();
    this._waveHitFree = true;
  }

  isUnlocked(id) { return !!this._unlocked[id]; }

  unlock(id) {
    if (this._unlocked[id]) return;
    this._unlocked[id] = Date.now();
    Storage.set('achievements', this._unlocked);
    const def = DEFS.find(d => d.id === id);
    if (def) bus.emit('achievement', def);
  }

  onKill(killCount) {
    if (killCount === 1) this.unlock('first_kill');
  }

  onWaveComplete(wave, isSurvival) {
    if (wave >= 5) this.unlock('wave_5');
    if (wave >= 10) this.unlock('wave_10');
    if (isSurvival && wave >= 10) this.unlock('survival_10');
    if (this._waveHitFree) this.unlock('no_hit_wave');
    this._waveHitFree = true; // reset for next wave
  }

  onBossKill(totalBossKills) {
    if (totalBossKills >= 1) this.unlock('boss_1');
    if (totalBossKills >= 5) this.unlock('boss_5');
  }

  onWeaponUsed(weaponIdx) {
    this._runWeapons.add(weaponIdx);
    if (this._runWeapons.size >= 10) this.unlock('all_weapons');
  }

  onAbilityUsed(abilityId) {
    this._runAbilities.add(abilityId);
    if (this._runAbilities.size >= 6) this.unlock('all_abilities');
  }

  onSkillMaxed() {
    this.unlock('skill_maxed');
  }

  onPlayerHit() {
    this._waveHitFree = false;
  }

  resetRun() {
    this._runWeapons.clear();
    this._runAbilities.clear();
    this._waveHitFree = true;
  }

  get defs() { return DEFS; }
  get all() { return this._unlocked; }
}

export const achievements = new Achievements();
