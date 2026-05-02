// ─── GameOverScene ────────────────────────────────────────────────────────────
// Shown after player death. In Wave 0 the gameOver logic lives in GameScene;
// this class is a thin wrapper that re-shows the overlay and handles retry.

import { getHiScore } from '../data/Storage.js';

export class GameOverScene {
  constructor(gameScene) {
    this._gameScene = gameScene;
    this._onClick   = () => this._retry();
  }

  enter() {
    document.getElementById('start-btn').addEventListener('click', this._onClick);
  }

  exit() {
    document.getElementById('start-btn').removeEventListener('click', this._onClick);
  }

  update() {}
  render() {}

  _retry() {
    document.getElementById('overlay').classList.add('hidden');
    this._gameScene.startGame();
  }
}
