// data/Storage.js — localStorage wrappers

const PREFIX = 'pw_';

export const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  },

  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* quota or private */ }
  },

  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* noop */ }
  }
};
