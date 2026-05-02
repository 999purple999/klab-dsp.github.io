function noteFreq(note) {
  const notes = { C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392.00,A4:440.00,B4:493.88,
                  C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880.00,B5:987.77 };
  return notes[note] || 440;
}

function playTone(ctx, masterGain, freq, type, startTime, duration, gain, endGain = 0) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(masterGain);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(gain, startTime);
  g.gain.linearRampToValueAtTime(endGain, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

function playNoise(ctx, masterGain, startTime, duration, gain) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, startTime);
  g.gain.linearRampToValueAtTime(0, startTime + duration);
  source.connect(g);
  g.connect(masterGain);
  source.start(startTime);
  source.stop(startTime + duration + 0.01);
}

export const SFXLibrary = {
  flip(ctx, masterGain) {
    const t = ctx.currentTime;
    playTone(ctx, masterGain, 220, 'sine', t, 0.05, 0.15, 0);
    playTone(ctx, masterGain, 440, 'sine', t, 0.04, 0.08, 0);
  },

  coin(ctx, masterGain) {
    const t = ctx.currentTime;
    playTone(ctx, masterGain, noteFreq('C5'), 'sine', t, 0.05, 0.12, 0.02);
    playTone(ctx, masterGain, noteFreq('E5'), 'sine', t + 0.05, 0.05, 0.12, 0.02);
  },

  powerup(ctx, masterGain) {
    const t = ctx.currentTime;
    playTone(ctx, masterGain, noteFreq('G4'), 'sine', t, 0.2, 0.1, 0);
    playTone(ctx, masterGain, noteFreq('B4'), 'sine', t, 0.2, 0.1, 0);
    playTone(ctx, masterGain, noteFreq('D5'), 'sine', t, 0.2, 0.1, 0);
  },

  hit(ctx, masterGain) {
    const t = ctx.currentTime;
    playNoise(ctx, masterGain, t, 0.1, 0.3);
    playTone(ctx, masterGain, 80, 'sawtooth', t, 0.1, 0.2, 0);
  },

  gameover(ctx, masterGain) {
    const t = ctx.currentTime;
    const notes = ['C5', 'G4', 'E4', 'C4'];
    notes.forEach((n, i) => {
      playTone(ctx, masterGain, noteFreq(n), 'sine', t + i * 0.12, 0.1, 0.15, 0);
    });
    playNoise(ctx, masterGain, t, 0.15, 0.2);
  },

  levelup(ctx, masterGain) {
    const t = ctx.currentTime;
    const notes = ['C5', 'E5', 'G5', 'C5'];
    notes.forEach((n, i) => {
      playTone(ctx, masterGain, noteFreq(n), 'sine', t + i * 0.08, 0.1, 0.15, 0);
    });
  }
};
