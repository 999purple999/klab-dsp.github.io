import { Device } from '../utils/Device.js';

export class BootScene {
  constructor(game) {
    this._game = game;
    this._done = false;
  }

  enter() {
    this._done = false;
  }

  update(dt) {
    if (!this._done) {
      this._done = true;
      // Set DPR from device
      Device.init();
      // Transition immediately to menu
      this._game.goToMenu();
    }
  }

  render(ctx) {
    // Just a black frame
    const dpr = this._game.dpr || 1;
    const W = (this._game.W || window.innerWidth) * dpr;
    const H = (this._game.H || window.innerHeight) * dpr;
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, W, H);
  }

  exit() {}
}
