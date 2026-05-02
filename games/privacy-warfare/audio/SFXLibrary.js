// audio/SFXLibrary.js — All procedural sound effects

export class SFXLibrary {
  constructor(audioManager) {
    this._am = audioManager;
  }

  get ac() { return this._am.getAC(); }
  get dest() { return this._am.dest; }

  _tone(freq, type, dur, vol, slide) {
    const ac = this.ac; if (!ac || !this.dest) return;
    try {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(this.dest);
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, ac.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, ac.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.12, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.start(); o.stop(ac.currentTime + dur + 0.02);
    } catch (e) { /* noop */ }
  }

  _noise(dur, vol, filterFreq) {
    const ac = this.ac; if (!ac || !this.dest) return;
    try {
      const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const g = ac.createGain();
      g.gain.setValueAtTime(vol || 0.1, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      if (filterFreq) {
        const bpf = ac.createBiquadFilter();
        bpf.type = 'lowpass';
        bpf.frequency.value = filterFreq;
        src.connect(bpf); bpf.connect(g);
      } else {
        src.connect(g);
      }
      g.connect(this.dest);
      src.start(); src.stop(ac.currentTime + dur + 0.02);
    } catch (e) { /* noop */ }
  }

  // ── Weapons ──────────────────────────────────────────────────────────────

  /** Per weapon type shoot sound */
  shoot(weaponType) {
    switch (weaponType) {
      case 'pulse':     this._tone(380, 'square', 0.05, 0.07, 120); break;
      case 'beam':      this._tone(660, 'sine', 0.04, 0.05, 200); break;
      case 'spread':    this._noise(0.06, 0.08, 4000); this._tone(320, 'square', 0.04, 0.05); break;
      case 'split':     this._tone(440, 'sawtooth', 0.06, 0.07, 300); break;
      case 'wave':      this._tone(280, 'sine', 0.12, 0.08, 500); break;
      case 'blackhole': this._tone(110, 'sawtooth', 0.3, 0.14, 60); break;
      case 'chain':     this._tone(550, 'square', 0.07, 0.1, 850); break;
      case 'cryo':      this._tone(800, 'sine', 0.12, 0.06, 1200); break;
      case 'nuke':      this._noise(0.1, 0.1, 200); this._tone(80, 'sawtooth', 0.15, 0.12, 50); break;
      case 'virus':     this._tone(220, 'square', 0.08, 0.07, 440); break;
      default:          this._tone(380, 'square', 0.05, 0.07, 120);
    }
  }

  hit()          { this._tone(180, 'sawtooth', 0.06, 0.1, 60); }
  kill()         { this._tone(800, 'square', 0.08, 0.12, 300); }
  bossHit()      { this._tone(120, 'sawtooth', 0.12, 0.18, 80); }
  dash()         { this._tone(550, 'sine', 0.08, 0.1, 900); }
  hurt()         { this._noise(0.2, 0.15); this._tone(200, 'sawtooth', 0.2, 0.15, 80); }
  explosion()    { this._noise(0.45, 0.2, 600); this._tone(60, 'sawtooth', 0.4, 0.22, 40); }
  nuke()         { this._noise(0.8, 0.3); this._tone(60, 'sawtooth', 0.8, 0.25, 40); }
  upgrade()      { this._tone(660, 'sine', 0.1, 0.12, 880); this._tone(880, 'sine', 0.15, 0.1, 1100); }
  powerup()      { this._tone(440, 'sine', 0.07, 0.1, 660); this._tone(550, 'sine', 0.07, 0.08, 770); this._tone(660, 'sine', 0.1, 0.06, 880); }

  // ── Abilities ─────────────────────────────────────────────────────────────

  bomb()         { this._noise(0.35, 0.2); this._tone(90, 'sawtooth', 0.35, 0.18, 40); }
  kernelPanic()  { this._tone(440, 'square', 0.5, 0.15, 110); }
  overclock()    { this._tone(880, 'sine', 0.3, 0.12, 1200); }
  empShield()    { this._tone(330, 'sine', 0.25, 0.1, 660); this._noise(0.1, 0.05, 3000); }
  timeWarp()     { this._tone(300, 'sine', 0.4, 0.1, 150); this._tone(600, 'sine', 0.4, 0.08, 300); }

  waveComplete() {
    // ascending arpeggio
    [440, 550, 660, 880].forEach((f, i) => {
      setTimeout(() => this._tone(f, 'sine', 0.2, 0.1, f * 1.1), i * 90);
    });
  }

  bossAppear() {
    this._tone(110, 'sawtooth', 0.8, 0.2, 55);
    this._noise(0.5, 0.15);
    setTimeout(() => this._tone(80, 'sine', 1.2, 0.1, 60), 200);
  }

  playerDeath() {
    // descending wail
    this._tone(440, 'sawtooth', 0.8, 0.2, 80);
    this._noise(0.5, 0.1);
    setTimeout(() => this._tone(220, 'sawtooth', 0.6, 0.12, 60), 300);
  }
}
