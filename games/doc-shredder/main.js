import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const uiContainer = document.getElementById('ui-container');

const game = new Game(canvas, uiContainer);
game.start();
