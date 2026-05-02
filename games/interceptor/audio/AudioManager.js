export class AudioManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._beatInterval = null;
    this._beatBpm = 80;
    this._beatRunning = false;
    this._muted = false;
    this._volume = 0.5;
    this._beatPhase = 0;
    this._beatNextTime = 0;
  }

  _init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = this._volume;
    this._masterGain.connect(this._ctx.destination);
  }

  get ctx() {
    this._init();
    return this._ctx;
  }

  get master() {
    this._init();
    return this._masterGain;
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._masterGain) {
      this._masterGain.gain.value = this._muted ? 0 : this._volume;
    }
  }

  toggleMute() {
    this._muted = !this._muted;
    if (this._masterGain) {
      this._masterGain.gain.value = this._muted ? 0 : this._volume;
    }
    return this._muted;
  }

  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  // Beat system
  startBeat(wave) {
    this._init();
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    this._beatBpm = Math.min(160, 80 + wave * 4);
    this._beatRunning = true;
    this._beatPhase = 0;
    this._beatNextTime = this._ctx.currentTime;
    this._scheduleBeat();
  }

  updateBeat(wave) {
    this._beatBpm = Math.min(160, 80 + wave * 4);
  }

  stopBeat() {
    this._beatRunning = false;
    if (this._beatInterval) {
      clearTimeout(this._beatInterval);
      this._beatInterval = null;
    }
  }

  _scheduleBeat() {
    if (!this._beatRunning) return;
    const ctx = this._ctx;
    const interval = 60 / this._beatBpm;
    const lookahead = 0.1;
    const scheduleAhead = 0.2;

    while (this._beatNextTime < ctx.currentTime + scheduleAhead) {
      this._playBeatNote(this._beatNextTime, this._beatPhase);
      this._beatNextTime += interval;
      this._beatPhase = (this._beatPhase + 1) % 4;
    }

    const delay = Math.max(10, (this._beatNextTime - ctx.currentTime - lookahead) * 1000);
    this._beatInterval = setTimeout(() => this._scheduleBeat(), delay);
  }

  _playBeatNote(time, phase) {
    if (!this._masterGain) return;
    const ctx = this._ctx;

    if (phase === 0) {
      // Kick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this._masterGain);
      osc.frequency.setValueAtTime(80, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.08);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.start(time);
      osc.stop(time + 0.15);
    } else if (phase === 2) {
      // Snare (filtered noise)
      const bufSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this._masterGain);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      src.start(time);
      src.stop(time + 0.09);
    } else {
      // Hi-hat
      const bufSize = Math.floor(ctx.sampleRate * 0.03);
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this._masterGain);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      src.start(time);
      src.stop(time + 0.04);
    }
  }
}
