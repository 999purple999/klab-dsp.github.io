import { WeaponBase } from './WeaponBase.js';

export class AESStream extends WeaponBase {
  constructor() {
    super({
      name: 'AES STREAM',
      color: '#00FFFF',
      cd: 0.08,
      dmg: 0.6,
      range: 420,
      projSpeed: 700,
      projCount: 1,
      spread: 0.04,
    });
  }
}
