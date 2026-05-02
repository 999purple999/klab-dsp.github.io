import { Engine } from './core/Engine.js';
import { Game } from './core/Game.js';
import { AudioManager } from './audio/AudioManager.js';

const canvas = document.getElementById('c');
const audio = new AudioManager();
const game = new Game(audio);
const engine = new Engine(canvas, game);

engine.start();
