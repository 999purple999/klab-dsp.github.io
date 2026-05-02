// ─── Storage ──────────────────────────────────────────────────────────────────
// Thin wrapper around localStorage for persisted game data.

const KEY = 'pw_hi';

export function getHiScore() {
  return +(localStorage.getItem(KEY) || 0);
}

export function setHiScore(val) {
  localStorage.setItem(KEY, Math.floor(val));
}
