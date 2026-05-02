import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const hudContainer = document.getElementById('hud');
const controlsContainer = document.getElementById('controls');

const game = new Game(canvas, hudContainer, controlsContainer);
game.start();
