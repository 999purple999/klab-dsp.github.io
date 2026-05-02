export class SFXLibrary {
  constructor(audioManager) {
    this._am = audioManager;
  }

  _ctx() { return this._am.ctx; }
  _out() { return this._am.master; }

  tap_hit() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.05);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  tap_boss_hit() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const dist = ctx.createWaveShaper();
    const gain = ctx.createGain();

    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 400) * x / (Math.PI + 400 * Math.abs(x));
    }
    dist.curve = curve;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(dist);
    dist.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  packet_breach() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;

    // Low rumble
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, t);
    oscGain.gain.setValueAtTime(0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(oscGain);
    oscGain.connect(out);
    osc.start(t);
    osc.stop(t + 0.22);

    // Noise burst
    const bufSize = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.3, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(out);
    src.start(t);
    src.stop(t + 0.22);
  }

  powerup_collect() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    // Ascending maj7 chord: C5, E5, G5, B5
    const freqs = [523.25, 659.25, 783.99, 987.77];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const st = t + i * 0.06;
      gain.gain.setValueAtTime(0.0, st);
      gain.gain.linearRampToValueAtTime(0.25, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.15);
      osc.connect(gain);
      gain.connect(out);
      osc.start(st);
      osc.stop(st + 0.17);
    });
  }

  freeze_activate() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.3);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  slow_activate() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    // Wobble: amplitude-modulated sine
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const carrierGain = ctx.createGain();
    carrier.type = 'sine';
    carrier.frequency.value = 300;
    modulator.type = 'sine';
    modulator.frequency.value = 4; // 4Hz AM
    modGain.gain.value = 0.5;
    carrierGain.gain.setValueAtTime(0.3, t);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    modulator.connect(modGain);
    modGain.connect(carrierGain.gain);
    carrier.connect(carrierGain);
    carrierGain.connect(out);
    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + 0.32);
    carrier.stop(t + 0.32);
  }

  explode_activate() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;

    // Sine thump
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.25);
    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc.connect(oscGain);
    oscGain.connect(out);
    osc.start(t);
    osc.stop(t + 0.28);

    // White noise burst
    const bufSize = Math.floor(ctx.sampleRate * 0.2);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.4, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(nGain);
    nGain.connect(out);
    src.start(t);
    src.stop(t + 0.26);
  }

  wave_clear() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    const freqs = [783.99, 1046.50]; // G5, C6
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const st = t + i * 0.1;
      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.08);
      osc.connect(gain);
      gain.connect(out);
      osc.start(st);
      osc.stop(st + 0.1);
    });
  }

  boss_appear() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 80;
    mod.type = 'sine';
    mod.frequency.value = 4;
    modGain.gain.value = 40;
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(out);
    mod.start(t);
    osc.start(t);
    mod.stop(t + 0.52);
    osc.stop(t + 0.52);
  }

  game_over() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    // Descending minor arpeggio: A4, F4, D4, A3
    const freqs = [440, 349.23, 293.66, 220];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const st = t + i * 0.15;
      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.14);
      osc.connect(gain);
      gain.connect(out);
      osc.start(st);
      osc.stop(st + 0.16);
    });
  }

  streak_5() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    // 3-note ascending fanfare
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      const st = t + i * 0.07;
      gain.gain.setValueAtTime(0.0, st);
      gain.gain.linearRampToValueAtTime(0.15, st + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.1);
      osc.connect(gain);
      gain.connect(out);
      osc.start(st);
      osc.stop(st + 0.12);
    });
  }

  level_up() {
    const ctx = this._ctx();
    const out = this._out();
    const t = ctx.currentTime;
    // 4-note ascending chord
    const freqs = [261.63, 329.63, 392, 523.25];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const st = t + i * 0.05;
      gain.gain.setValueAtTime(0.2, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
      osc.connect(gain);
      gain.connect(out);
      osc.start(st);
      osc.stop(st + 0.2);
    });
  }
}
