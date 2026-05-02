// ─── Storage v2.0 ─────────────────────────────────────────────────────────────
// Versioned localStorage wrapper: hi-score, settings, lifetime stats.

const V         = 2;
const KEY_HI    = 'pw_hi';
const KEY_SET   = 'pw_settings';
const KEY_STATS = 'pw_stats';

// ── Hi-score ──────────────────────────────────────────────────────────────────
export function getHiScore()     { return +(localStorage.getItem(KEY_HI) || 0); }
export function setHiScore(val)  { localStorage.setItem(KEY_HI, Math.floor(val)); }

// ── Credits (persisted between runs) ──────────────────────────────────────────
export function getCredits()     { return +(localStorage.getItem('pw_credits') || 0); }
export function setCredits(val)  { localStorage.setItem('pw_credits', Math.max(0, Math.floor(val))); }

// ── Settings ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  v:         V,
  musicVol:  0.7,
  sfxVol:    1.0,
  quality:   'high',    // 'low' | 'medium' | 'high'
  joystick:  true,
  vibration: true,
  particles: true,
};

export function getSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY_SET) || '{}');
    return { ...DEFAULT_SETTINGS, ...raw };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(patch) {
  localStorage.setItem(KEY_SET, JSON.stringify({ ...getSettings(), ...patch }));
}

// ── Lifetime stats ────────────────────────────────────────────────────────────
const DEFAULT_STATS = {
  totalKills:    0,
  totalWaves:    0,
  totalPlaytime: 0,   // seconds
  gamesPlayed:   0,
  totalScore:    0,
};

export function getStats() {
  try {
    return { ...DEFAULT_STATS, ...JSON.parse(localStorage.getItem(KEY_STATS) || '{}') };
  } catch { return { ...DEFAULT_STATS }; }
}

export function updateStats(patch) {
  const stats = { ...getStats() };
  for (const k of Object.keys(patch)) {
    if (typeof patch[k] === 'number') stats[k] = (stats[k] || 0) + patch[k];
    else stats[k] = patch[k];
  }
  localStorage.setItem(KEY_STATS, JSON.stringify(stats));
  return stats;
}

// ── Full-save snapshot ────────────────────────────────────────────────────────
export function createSaveSnapshot(gameData) {
  return {
    v:        V,
    ts:       Date.now(),
    hiScore:  getHiScore(),
    settings: getSettings(),
    stats:    getStats(),
    campaign: gameData?.campaign || null,
    mastery:  JSON.parse(localStorage.getItem('pw_mastery') || '{}'),
    weapons:  JSON.parse(localStorage.getItem('pw_weapons') || '[]'),
  };
}

export function applySaveSnapshot(snap) {
  if (!snap || snap.v !== V) return false;
  if (snap.hiScore)   setHiScore(snap.hiScore);
  if (snap.settings)  localStorage.setItem(KEY_SET, JSON.stringify(snap.settings));
  if (snap.stats)     localStorage.setItem(KEY_STATS, JSON.stringify(snap.stats));
  if (snap.mastery)   localStorage.setItem('pw_mastery', JSON.stringify(snap.mastery));
  if (snap.weapons)   localStorage.setItem('pw_weapons', JSON.stringify(snap.weapons));
  if (snap.campaign)  localStorage.setItem('pw_campaign', JSON.stringify(snap.campaign));
  return true;
}
