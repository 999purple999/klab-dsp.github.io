// ─── AdaptiveMusic ────────────────────────────────────────────────────────────
// Layered procedural background music that adapts to combat state.
// Three layers: drone (always on), combat percussion, boss lead.

export class AdaptiveMusic {
  /**
   * @param {AudioContext} audioCtx - shared Web Audio context
   */
  constructor(audioCtx) {
    this.ac         = audioCtx;
    this.enabled    = true;
    this.masterGain = null;

    // Layer nodes
    this.droneOsc     = null;
    this.droneGain    = null;
    this.combatOsc    = null;
    this.combatGain   = null;
    this.bossOsc      = null;
    this.bossFilter   = null;
    this.bossGain     = null;

    this.bossActive = false;
    this.intensity  = 0;    // 0 – 1

    this._started = false;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  start() {
    if (this._started || !this.ac || !this.enabled) return;
    this._started = true;

    try {
      // ── Master output ─────────────────────────────────────────────────────
      this.masterGain = this.ac.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ac.currentTime);
      this.masterGain.connect(this.ac.destination);

      // ── Layer 1: Drone – 50 Hz sawtooth → lowpass → droneGain ─────────────
      const droneFilter = this.ac.createBiquadFilter();
      droneFilter.type            = 'lowpass';
      droneFilter.frequency.value = 200;
      droneFilter.Q.value         = 1;

      this.droneGain = this.ac.createGain();
      this.droneGain.gain.setValueAtTime(0.04, this.ac.currentTime);

      this.droneOsc = this.ac.createOscillator();
      this.droneOsc.type                      = 'sawtooth';
      this.droneOsc.frequency.setValueAtTime(50, this.ac.currentTime);
      this.droneOsc.connect(droneFilter);
      droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);
      this.droneOsc.start();

      // ── Layer 2: Combat – 110 Hz square, gain starts silent ───────────────
      this.combatGain = this.ac.createGain();
      this.combatGain.gain.setValueAtTime(0, this.ac.currentTime);

      this.combatOsc = this.ac.createOscillator();
      this.combatOsc.type                      = 'square';
      this.combatOsc.frequency.setValueAtTime(110, this.ac.currentTime);
      this.combatOsc.connect(this.combatGain);
      this.combatGain.connect(this.masterGain);
      this.combatOsc.start();

      // ── Layer 3: Boss – 80 Hz sawtooth → bandpass filter ─────────────────
      this.bossFilter             = this.ac.createBiquadFilter();
      this.bossFilter.type        = 'bandpass';
      this.bossFilter.frequency.value = 160;
      this.bossFilter.Q.value     = 4;

      this.bossGain = this.ac.createGain();
      this.bossGain.gain.setValueAtTime(0, this.ac.currentTime);

      this.bossOsc = this.ac.createOscillator();
      this.bossOsc.type                      = 'sawtooth';
      this.bossOsc.frequency.setValueAtTime(80, this.ac.currentTime);
      this.bossOsc.connect(this.bossFilter);
      this.bossFilter.connect(this.bossGain);
      this.bossGain.connect(this.masterGain);
      this.bossOsc.start();

    } catch (e) {
      // Web Audio may be blocked; fail silently
      this._started = false;
    }
  }

  // ── Per-frame update ─────────────────────────────────────────────────────────

  /**
   * @param {number} enemyCount     - total enemies alive
   * @param {number} nearbyEnemies  - enemies within aggro range
   * @param {boolean} hasBoss
   * @param {number} playerHP
   * @param {number} maxHP
   */
  update(enemyCount, nearbyEnemies, hasBoss, playerHP, maxHP) {
    if (!this._started || !this.enabled) return;

    // Compute intensity
    let intensity = Math.min(nearbyEnemies / 5, 1);
    if (playerHP < maxHP / 3) intensity = Math.min(intensity + 0.3, 1);
    this.intensity = intensity;

    const now = this.ac.currentTime;

    // Smoothly ramp combat layer
    try {
      this.combatGain.gain.setTargetAtTime(intensity * 0.06, now, 0.4);
    } catch (e) {}

    // Boss layer
    if (hasBoss && !this.bossActive) {
      this.setBossActive(true);
    } else if (!hasBoss && this.bossActive) {
      this.setBossActive(false);
    }

    // Modulate drone pitch slightly with intensity for tension
    try {
      const droneFreq = 50 + intensity * 12;
      this.droneOsc.frequency.setTargetAtTime(droneFreq, now, 1.5);
    } catch (e) {}
  }

  // ── Boss layer ────────────────────────────────────────────────────────────────

  setBossActive(active) {
    if (!this._started) return;
    this.bossActive = active;
    try {
      const now = this.ac.currentTime;
      if (active) {
        this.bossGain.gain.setTargetAtTime(0.1, now, 1.2);
        // Detune the boss oscillator for an ominous quality
        this.bossOsc.frequency.setTargetAtTime(70, now, 0.5);
      } else {
        this.bossGain.gain.setTargetAtTime(0, now, 2.0);
        this.bossOsc.frequency.setTargetAtTime(80, now, 1.0);
      }
    } catch (e) {}
  }

  // ── Teardown ─────────────────────────────────────────────────────────────────

  stop() {
    if (!this._started) return;
    try {
      const now = this.ac.currentTime;
      this.masterGain.gain.setTargetAtTime(0, now, 0.5);
      setTimeout(() => {
        try { this.droneOsc.stop();  } catch (e) {}
        try { this.combatOsc.stop(); } catch (e) {}
        try { this.bossOsc.stop();   } catch (e) {}
        try { this.masterGain.disconnect(); } catch (e) {}
      }, 1200);
    } catch (e) {}
    this._started = false;
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.stop();
  }
}
