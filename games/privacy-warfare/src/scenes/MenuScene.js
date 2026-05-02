// ─── MenuScene ────────────────────────────────────────────────────────────────
// Handles the start/retry overlay DOM only.
// Calls gameScene.startGame() when the button is clicked.

export class MenuScene {
  constructor(gameScene) {
    this._gameScene = gameScene;
    this._onClick   = () => this._start();
  }

  enter() {
    document.getElementById('start-btn').addEventListener('click', this._onClick);
  }

  exit() {
    document.getElementById('start-btn').removeEventListener('click', this._onClick);
  }

  update() {}
  render() {}

  _start() {
    document.getElementById('overlay').classList.add('hidden');
    this._gameScene.startGame();
  }
}
