// ─── AudioManager ─────────────────────────────────────────────────────────────

let AC = null;

export function getAC() {
  if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}

function tone(freq, type, dur, vol, slide) {
  const ac = getAC(); if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, ac.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur + 0.01);
  } catch (e) {}
}

function noise(dur, vol) {
  const ac = getAC(); if (!ac) return;
  try {
    const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = buf; src.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(vol || 0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    src.start(); src.stop(ac.currentTime + dur + 0.01);
  } catch (e) {}
}

export const SFX = {
  shoot:     () => tone(380, 'square', 0.05, 0.07, 120),
  beam:      () => tone(660, 'sine', 0.04, 0.05, 200),
  hit:       () => { tone(180, 'sawtooth', 0.06, 0.1, 60); },
  kill:      () => { tone(800, 'square', 0.08, 0.12, 300); },
  bossHit:   () => { tone(120, 'sawtooth', 0.12, 0.18, 80); },
  dash:      () => { tone(550, 'sine', 0.08, 0.1, 900); },
  bomb:      () => { noise(0.35, 0.2); tone(90, 'sawtooth', 0.35, 0.18, 40); },
  kp:        () => { tone(440, 'square', 0.5, 0.15, 110); },
  hurt:      () => { noise(0.2, 0.15); tone(200, 'sawtooth', 0.2, 0.15, 80); },
  overclock: () => tone(880, 'sine', 0.3, 0.12, 1200),
  warp:      () => { tone(300, 'sine', 0.4, 0.1, 150); tone(600, 'sine', 0.4, 0.08, 300); },
  wave:      () => { tone(440, 'sine', 0.6, 0.1, 660); },
  boss:      () => { tone(110, 'sawtooth', 0.8, 0.2, 55); noise(0.5, 0.15); },
  nuke:      () => { noise(0.8, 0.3); tone(60, 'sawtooth', 0.8, 0.25, 40); },
  upgrade:   () => { tone(660, 'sine', 0.1, 0.12, 880); tone(880, 'sine', 0.15, 0.1, 1100); },
};
