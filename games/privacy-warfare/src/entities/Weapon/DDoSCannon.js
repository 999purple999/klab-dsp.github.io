import { WeaponBase } from './WeaponBase.js';

export class DDoSCannon extends WeaponBase {
  constructor() {
    super({
      name: 'DDOS CANNON',
      color: '#00FF41',
      cd: 0.55,
      dmg: 0.7,
      range: 380,
      projSpeed: 640,
      projCount: 3,
      spread: 0.06,
    });
  }
}
