import { Storage } from './Storage.js';
import { bus } from '../utils/EventBus.js';

const DEFS = [
  { id: 'first_blood',    title: 'First Block',          desc: 'Intercept your first packet',            secret: false },
  { id: 'analyst',        title: 'Security Analyst',     desc: 'Reach a score of 500',                   secret: false },
  { id: 'firewall_god',   title: 'Firewall God',         desc: 'Complete 10 waves without taking damage', secret: false },
  { id: 'zero_breach',    title: 'Zero Breach',          desc: 'Finish a game with 0 packets reaching the firewall', secret: false },
  { id: 'boss_slayer',    title: 'Boss Slayer',          desc: 'Defeat 5 boss packets',                  secret: false },
  { id: 'power_user',     title: 'Power User',           desc: 'Collect 10 power-ups',                   secret: false },
  { id: 'streak_10',      title: 'On Fire',              desc: 'Reach a ×10 streak',                     secret: false },
  { id: 'trojan_hunter',  title: 'Trojan Hunter',        desc: 'Destroy 10 Trojan packets',              secret: false },
  { id: 'ransomware_stop',title: 'Ransomware Stopper',   desc: 'Stop 5 ransomware packets',              secret: false },
  { id: 'speed_demon',    title: 'Speed Demon',          desc: 'Survive to wave 15',                     secret: false },
];

export class Achievements {
  constructor() {
    this._unlocked = Storage.get('achievements', {});
  }

  isUnlocked(id) {
    return !!this._unlocked[id];
  }

  unlock(id) {
    if (this._unlocked[id]) return false;
    this._unlocked[id] = true;
    Storage.set('achievements', this._unlocked);
    const def = DEFS.find(d => d.id === id);
    if (def) {
      bus.emit('achievement_unlocked', def);
    }
    return true;
  }

  getAll() {
    return DEFS.map(d => ({ ...d, unlocked: !!this._unlocked[d.id] }));
  }

  getUnlockedCount() {
    return Object.keys(this._unlocked).length;
  }

  // Call these during gameplay to auto-unlock
  checkScore(score) {
    if (score >= 500) this.unlock('analyst');
  }

  checkFirstBlock() {
    this.unlock('first_blood');
  }

  checkFirewallGod(wavesWithoutDamage) {
    if (wavesWithoutDamage >= 10) this.unlock('firewall_god');
  }

  checkZeroBreach(breachCount) {
    if (breachCount === 0) this.unlock('zero_breach');
  }

  checkBossSlayer(bossKills) {
    if (bossKills >= 5) this.unlock('boss_slayer');
  }

  checkPowerUser(powerUpCount) {
    if (powerUpCount >= 10) this.unlock('power_user');
  }

  checkStreak(streak) {
    if (streak >= 10) this.unlock('streak_10');
  }

  checkTrojanHunter(trojanKills) {
    if (trojanKills >= 10) this.unlock('trojan_hunter');
  }

  checkRansomware(ransomwareKills) {
    if (ransomwareKills >= 5) this.unlock('ransomware_stop');
  }

  checkSpeedDemon(wave) {
    if (wave >= 15) this.unlock('speed_demon');
  }
}
