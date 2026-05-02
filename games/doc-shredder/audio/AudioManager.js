let ctx = null;
let bgOsc = null, bgGain = null;
let burnNode = null, burnGain = null, burnLfo = null;
let enabled = true;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const AudioManager = {
  init() {
    const ac = getCtx();
    // Background server hum
    bgOsc = ac.createOscillator();
    bgGain = ac.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.setValueAtTime(40, ac.currentTime);
    bgGain.gain.setValueAtTime(0.015, ac.currentTime);
    bgOsc.connect(bgGain);
    bgGain.connect(ac.destination);
    bgOsc.start();
  },

  setEnabled(v) {
    enabled = v;
    if (bgGain) bgGain.gain.setTargetAtTime(v ? 0.015 : 0, getCtx().currentTime, 0.1);
  },

  stopBackground() {
    if (bgGain) bgGain.gain.setTargetAtTime(0, getCtx().currentTime, 0.3);
  },

  // SHRED: white noise burst
  playShred() {
    if (!enabled) return;
    const ac = getCtx();
    const bufLen = Math.floor(ac.sampleRate * 0.15);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src = ac.createBufferSource();
    const filt = ac.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.setValueAtTime(2000, ac.currentTime);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.25, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    src.buffer = buf;
    src.connect(filt); filt.connect(g); g.connect(ac.destination);
    src.start();
  },

  // BURN: start crackling loop
  startBurn() {
    if (!enabled || burnNode) return;
    const ac = getCtx();
    const bufLen = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
    burnNode = ac.createBufferSource();
    burnNode.buffer = buf;
    burnNode.loop = true;
    burnGain = ac.createGain();
    burnGain.gain.setValueAtTime(0, ac.currentTime);
    burnGain.gain.setTargetAtTime(0.12, ac.currentTime, 0.3);
    const filt = ac.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(800, ac.currentTime);
    filt.Q.setValueAtTime(0.5, ac.currentTime);
    // LFO on gain
    burnLfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    burnLfo.frequency.setValueAtTime(8, ac.currentTime);
    lfoGain.gain.setValueAtTime(0.05, ac.currentTime);
    burnLfo.connect(lfoGain); lfoGain.connect(burnGain.gain);
    burnNode.connect(filt); filt.connect(burnGain); burnGain.connect(ac.destination);
    burnNode.start(); burnLfo.start();
  },

  stopBurn() {
    if (!burnNode) return;
    const ac = getCtx();
    burnGain.gain.setTargetAtTime(0, ac.currentTime, 0.2);
    setTimeout(() => {
      try { burnNode.stop(); burnLfo.stop(); } catch {}
      burnNode = null; burnLfo = null; burnGain = null;
    }, 500);
  },

  // DISSOLVE: bubbling pops
  playDissolve() {
    if (!enabled) return;
    const ac = getCtx();
    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.15;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const freq = 200 + Math.random() * 600;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ac.currentTime + delay + 0.08);
      g.gain.setValueAtTime(0, ac.currentTime + delay);
      g.gain.setTargetAtTime(0.08, ac.currentTime + delay, 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.08);
      osc.connect(g); g.connect(ac.destination);
      osc.start(ac.currentTime + delay);
      osc.stop(ac.currentTime + delay + 0.1);
    }
  },

  // IMPLODE: thump + crackle
  playImplode() {
    if (!enabled) return;
    const ac = getCtx();
    // Deep thump
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ac.currentTime + 0.1);
    g.gain.setValueAtTime(0.5, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    osc.connect(g); g.connect(ac.destination);
    osc.start(); osc.stop(ac.currentTime + 0.11);
    // High-freq crackle
    const bufLen = Math.floor(ac.sampleRate * 0.2);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    const src = ac.createBufferSource();
    const filt = ac.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.setValueAtTime(3000, ac.currentTime);
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.3, ac.currentTime + 0.05);
    ng.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    src.buffer = buf;
    src.connect(filt); filt.connect(ng); ng.connect(ac.destination);
    src.start(ac.currentTime + 0.05);
  },

  playComplete() {
    if (!enabled) return;
    const ac = getCtx();
    // Whoosh
    const bufLen = ac.sampleRate * 0.5;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen) * 0.4;
    const src = ac.createBufferSource();
    const filt = ac.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(200, ac.currentTime);
    filt.frequency.exponentialRampToValueAtTime(4000, ac.currentTime + 0.3);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.4, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    src.buffer = buf; src.connect(filt); filt.connect(g); g.connect(ac.destination);
    src.start();
    // Chord resolve
    [261.63, 329.63, 392, 523.25].forEach((f, i) => {
      const o = ac.createOscillator();
      const og = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, ac.currentTime + 0.2 + i * 0.04);
      og.gain.setValueAtTime(0.12, ac.currentTime + 0.2 + i * 0.04);
      og.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.5);
      o.connect(og); og.connect(ac.destination);
      o.start(ac.currentTime + 0.2 + i * 0.04);
      o.stop(ac.currentTime + 1.6);
    });
  }
};
