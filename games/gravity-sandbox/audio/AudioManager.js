let ctx = null;
let bgOsc = null, bgGain = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const AudioManager = {
  init() {
    const ac = getCtx();
    // Background hum
    bgOsc = ac.createOscillator();
    bgGain = ac.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.setValueAtTime(40, ac.currentTime);
    bgGain.gain.setValueAtTime(0.02, ac.currentTime);
    bgOsc.connect(bgGain);
    bgGain.connect(ac.destination);
    bgOsc.start();
  },

  setEnabled(v) { enabled = v; if (bgGain) bgGain.gain.setValueAtTime(v ? 0.02 : 0, getCtx().currentTime); },

  setChaosLevel(level) {
    if (!bgGain) return;
    const g = 0.02 + level * 0.04;
    bgGain.gain.setTargetAtTime(enabled ? g : 0, getCtx().currentTime, 0.1);
  },

  playCollision(impactForce, mass) {
    if (!enabled) return;
    const ac = getCtx();
    const freq = Math.min(800, Math.max(80, impactForce * 50)) * (1 - Math.min(0.6, mass / 20));
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(0.18, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.08);
  },

  playZeroG() {
    if (!enabled) return;
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ac.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.31);
  },

  playChaos() {
    if (!enabled) return;
    const ac = getCtx();
    // Noise burst
    const bufLen = ac.sampleRate * 0.15;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const nGain = ac.createGain();
    nGain.gain.setValueAtTime(0.3, ac.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    src.connect(nGain);
    nGain.connect(ac.destination);
    src.start();
    // Chord
    [220, 277, 330, 440].forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, ac.currentTime);
      g.gain.setValueAtTime(0.08, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.4);
    });
  },

  playLockUnlock() {
    if (!enabled) return;
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, ac.currentTime);
    gain.gain.setValueAtTime(0.1, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.04);
  }
};
