import { WeaponBase } from './WeaponBase.js';

export class PhishingNet extends WeaponBase {
  constructor() {
    super({
      name: 'PHISHING NET',
      color: '#FF8C00',
      cd: 0.35,
      dmg: 0.8,
      range: 320,
      projSpeed: 580,
      projCount: 5,
      spread: 0.18,
    });
  }
}
