// audio/AudioManager.js — Web Audio context manager + adaptive music

export class AudioManager {
  constructor() {
    this._ac = null;
    this._masterGain = null;
    this._musicNodes = {};
    this._musicRunning = false;
    this._combatLevel = 0; // 0-1 based on enemy count
    this._bossMode = false;
    this._rhythmTimer = 0;
    this._rhythmPhase = false;
  }

  /** Lazy-init AudioContext on first user gesture */
  getAC() {
    if (!this._ac) {
      try {
        this._ac = new (window.AudioContext || window.webkitAudioContext)();
        this._masterGain = this._ac.createGain();
        this._masterGain.gain.value = 1.0;
        this._masterGain.connect(this._ac.destination);
      } catch (e) { return null; }
    }
    if (this._ac.state === 'suspended') this._ac.resume();
    return this._ac;
  }

  get ac() { return this.getAC(); }
  get dest() { return this._masterGain || (this._ac ? this._ac.destination : null); }

  setVolume(v) {
    if (this._masterGain) this._masterGain.gain.value = v;
  }

  /** Start adaptive background music */
  startMusic() {
    if (this._musicRunning) return;
    const ac = this.getAC();
    if (!ac) return;
    this._musicRunning = true;

    // Drone 1 — 80 Hz
    this._spawnDrone(80, 0.015, 'drone1');
    // Drone 2 — 120 Hz
    this._spawnDrone(120, 0.013, 'drone2');
  }

  _spawnDrone(freq, gain, key) {
    const ac = this._ac;
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(this.dest);
    osc.start();
    if (this._musicNodes[key]) {
      try { this._musicNodes[key].osc.stop(); } catch (e) { /* */ }
    }
    this._musicNodes[key] = { osc, gain: g };
  }

  /** Called each frame with dt and enemy count */
  updateMusic(dt, enemyCount, bossActive) {
    if (!this._musicRunning) return;
    const ac = this._ac;
    if (!ac) return;

    const targetCombat = Math.min(1, enemyCount / 12);
    this._combatLevel += (targetCombat - this._combatLevel) * Math.min(1, dt * 0.4);

    // Combat noise layer
    if (this._combatLevel > 0.05) {
      if (!this._musicNodes.combatNoise) {
        const bufLen = ac.sampleRate * 2;
        const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const bpf = ac.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 800;
        bpf.Q.value = 1.5;
        const g = ac.createGain();
        g.gain.value = 0;
        src.connect(bpf);
        bpf.connect(g);
        g.connect(this.dest);
        src.start();
        this._musicNodes.combatNoise = { src, gain: g };
      }
      this._musicNodes.combatNoise.gain.gain.value = this._combatLevel * 0.02;
    } else if (this._musicNodes.combatNoise) {
      this._musicNodes.combatNoise.gain.gain.value = 0;
    }

    // Boss layer — rhythmic pulse
    if (bossActive && !this._bossMode) {
      this._bossMode = true;
      this._startBossPulse();
    } else if (!bossActive && this._bossMode) {
      this._bossMode = false;
      this._stopBossPulse();
    }

    if (this._bossMode) {
      this._rhythmTimer -= dt;
      if (this._rhythmTimer <= 0) {
        this._rhythmTimer = 0.5; // 2 Hz
        this._pulseBeat();
      }
    }
  }

  _startBossPulse() {
    const ac = this._ac;
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = 100;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(this.dest);
    osc.start();
    this._musicNodes.bossPulse = { osc, gain: g };
  }

  _stopBossPulse() {
    if (this._musicNodes.bossPulse) {
      try { this._musicNodes.bossPulse.osc.stop(); } catch (e) { /* */ }
      delete this._musicNodes.bossPulse;
    }
  }

  _pulseBeat() {
    const node = this._musicNodes.bossPulse;
    if (!node) return;
    const ac = this._ac;
    const now = ac.currentTime;
    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(0.02, now);
    node.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  }

  stopMusic() {
    this._musicRunning = false;
    for (const key of Object.keys(this._musicNodes)) {
      try { this._musicNodes[key].osc.stop(); } catch (e) { /* */ }
    }
    this._musicNodes = {};
    this._bossMode = false;
  }
}
