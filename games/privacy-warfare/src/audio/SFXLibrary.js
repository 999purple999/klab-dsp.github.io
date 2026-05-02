// ─── SFXLibrary ───────────────────────────────────────────────────────────────
// Additional sound effects for Wave 3+ weapons and enemy types.
// Mirrors the pattern used in AudioManager.js.

import { getAC } from './AudioManager.js';

// ── Helpers (mirrored from AudioManager) ────────────────────────────────────

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
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = buf; src.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(vol || 0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    src.start(); src.stop(ac.currentTime + dur + 0.01);
  } catch (e) {}
}

// Filtered noise burst (passes noise through a bandpass at a given frequency)
function filteredNoise(dur, vol, centreFreq) {
  const ac = getAC(); if (!ac) return;
  try {
    const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const filt       = ac.createBiquadFilter();
    filt.type        = 'bandpass';
    filt.frequency.value = centreFreq || 1000;
    filt.Q.value     = 2;

    const g = ac.createGain();
    g.gain.setValueAtTime(vol || 0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);

    src.connect(filt); filt.connect(g); g.connect(ac.destination);
    src.start(); src.stop(ac.currentTime + dur + 0.01);
  } catch (e) {}
}

// ── SFX2 collection ──────────────────────────────────────────────────────────

export const SFX2 = {

  /** Gravity gun – deep tone sliding down (heavy pull sound) */
  gravityGun: () => {
    tone(280, 'sawtooth', 0.3, 0.15, 55);
    noise(0.15, 0.06);
  },

  /** Drone swarm – buzzing cluster at 300-400 Hz */
  droneSwarm: () => {
    tone(310, 'square', 0.25, 0.08, 340);
    tone(370, 'square', 0.2,  0.06, 300);
    tone(340, 'sawtooth', 0.22, 0.05, 360);
  },

  /** Tesla crackle – short noise burst + sharp high tone */
  teslaCrackle: () => {
    noise(0.06, 0.18);
    tone(820, 'square', 0.08, 0.1, 400);
  },

  /** Plasma shot – smooth sine sliding up */
  plasma: () => {
    tone(400, 'sine', 0.18, 0.1, 600);
  },

  /** Flamethrower – ongoing filtered noise burst */
  flamethrower: () => {
    filteredNoise(0.22, 0.14, 600);
    noise(0.12, 0.08);
  },

  /** Freeze hit – crisp high ping */
  freezeHit: () => {
    tone(1200, 'sine', 0.1, 0.09, 900);
  },

  /** EMP burst – noise combined with deep low tone */
  empBurst: () => {
    noise(0.3, 0.2);
    tone(200, 'square', 0.3, 0.12, 80);
  },

  /** Saw weapon – short harsh sawtooth hit */
  saw: () => {
    tone(300, 'sawtooth', 0.12, 0.13, 180);
  },

  /** Time bomb – 3 ascending warning beeps */
  timeBomb: () => {
    const ac = getAC(); if (!ac) return;
    const freqs = [440, 550, 660];
    freqs.forEach((f, i) => {
      try {
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(f, ac.currentTime + i * 0.12);
        g.gain.setValueAtTime(0, ac.currentTime);
        g.gain.setValueAtTime(0.1, ac.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.12 + 0.09);
        o.start(ac.currentTime + i * 0.12);
        o.stop(ac.currentTime  + i * 0.12 + 0.12);
      } catch (e) {}
    });
  },

  /** Hook launch – descending whoosh */
  hookLaunch: () => {
    tone(800, 'sine', 0.18, 0.11, 200);
  },

  /** Hook hit / anchor – metallic clang */
  hookHit: () => {
    tone(400, 'triangle', 0.12, 0.14, 280);
    noise(0.04, 0.08);
  },

  /** Enemy grunt alert – 2 short staccato tones */
  gruntAlert: () => {
    tone(320, 'square', 0.06, 0.09);
    const ac = getAC(); if (!ac) return;
    try {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'square';
      o.frequency.setValueAtTime(480, ac.currentTime + 0.09);
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.setValueAtTime(0.09, ac.currentTime + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.16);
      o.start(ac.currentTime + 0.09);
      o.stop(ac.currentTime  + 0.18);
    } catch (e) {}
  },

  /** Boss spawn (second variant) – long noise swell + power chord */
  bossSpawn2: () => {
    noise(0.9, 0.25);
    tone(110, 'sawtooth', 0.9, 0.18, 55);
    tone(165, 'sawtooth', 0.7, 0.12, 82);
    tone(220, 'sawtooth', 0.5, 0.08, 110);
  },

  /** Achievement unlocked – cheerful 4-note arpeggio */
  achievementUnlock: () => {
    const ac = getAC(); if (!ac) return;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      try {
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(f, ac.currentTime + i * 0.1);
        g.gain.setValueAtTime(0, ac.currentTime);
        g.gain.setValueAtTime(0.1, ac.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.1 + 0.18);
        o.start(ac.currentTime + i * 0.1);
        o.stop(ac.currentTime  + i * 0.1 + 0.22);
      } catch (e) {}
    });
  },
};
