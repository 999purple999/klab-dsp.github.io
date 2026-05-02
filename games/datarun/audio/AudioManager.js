import { SFXLibrary } from './SFXLibrary.js';

export class AudioManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._ready = false;
    this._volume = 0.7;
    this._pendingPlays = [];
  }

  _ensureContext() {
    if (this._ctx) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this._volume;
      this._masterGain.connect(this._ctx.destination);
      this._ready = true;
      // Play any pending sounds
      for (const name of this._pendingPlays) {
        this._playImmediate(name);
      }
      this._pendingPlays = [];
    } catch {
      // Audio not available
    }
  }

  initOnInteraction() {
    this._ensureContext();
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
  }

  _playImmediate(soundName) {
    if (!this._ctx || !this._masterGain) return;
    if (this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
    const fn = SFXLibrary[soundName];
    if (fn) {
      try {
        fn(this._ctx, this._masterGain);
      } catch {
        // ignore audio errors
      }
    }
  }

  play(soundName) {
    if (!this._ctx) {
      this._pendingPlays.push(soundName);
      return;
    }
    this._playImmediate(soundName);
  }

  setMasterVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._masterGain) {
      this._masterGain.gain.value = this._volume;
    }
  }
}
