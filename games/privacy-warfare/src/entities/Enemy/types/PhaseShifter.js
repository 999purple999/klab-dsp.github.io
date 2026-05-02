import { BaseEnemy } from '../BaseEnemy.js';

export class PhaseShifter extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'phaseshifter', col: '#AAAAAA', sz: 12, hp: 3, spd: 60, pts: 70 }, wave);
    this.phaseTimer = 2;
    this.phaseIn = false;  // true = intangibile
    this.phaseDuration = 1.5;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    this.phaseTimer -= dt;
    if (this.phaseTimer <= 0) {
      this.phaseIn = !this.phaseIn;
      this.phaseTimer = this.phaseIn ? this.phaseDuration : (2 + Math.random() * 1.5);
      this.al = this.phaseIn ? 0.15 : 1;
    }
  }

  isPhased() { return this.phaseIn; }  // quando phased: immune ai danni
}
