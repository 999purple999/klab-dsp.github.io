import { Engine } from './core/Engine.js';
import { Game } from './core/Game.js';

// Wait for DOM ready
function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element #game-canvas not found');
    return;
  }

  const engine = new Engine(canvas);
  const game = new Game(engine);

  engine.setUpdateCallback((dt, ts) => {
    game.update(dt, ts);
  });

  engine.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
