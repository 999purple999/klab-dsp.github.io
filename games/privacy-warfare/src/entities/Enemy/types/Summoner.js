import { BaseEnemy } from '../BaseEnemy.js';

export class Summoner extends BaseEnemy {
  constructor(x, y, wave) {
    super(x, y, { type: 'summoner', col: '#AA00FF', sz: 14, hp: 3, spd: 44, pts: 80 }, wave);
    this.summonTimer = 6;
    this.summonCount = 0;
    this.maxSummons = 3;
    this.wave = wave;
  }

  update(dt, px, py, obstacles, enemies, eprojs, burst, spawnEnemy) {
    super.update(dt, px, py, obstacles, enemies, eprojs, burst);
    if (this.frozen > 0) return;
    this.summonTimer -= dt;
    if (this.summonTimer <= 0 && this.summonCount < this.maxSummons && spawnEnemy) {
      this.summonTimer = 6;
      this.summonCount++;
      const angle = Math.random() * Math.PI * 2;
      spawnEnemy(this.x + Math.cos(angle) * 60, this.y + Math.sin(angle) * 60, 'normal', this.wave);
      burst(this.x, this.y, '#AA00FF', 8, 40);
    }
  }
}
