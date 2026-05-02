import { WeaponBase } from './WeaponBase.js';

export class RSAPulse extends WeaponBase {
  constructor() {
    super({
      name: 'RSA PULSE',
      color: '#BF00FF',
      cd: 0.18,
      dmg: 1,
      range: 550,
      projSpeed: 820,
      projCount: 1,
      spread: 0,
    });
  }
}
