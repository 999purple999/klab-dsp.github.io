const PREFIX = 'doc-shredder:';

export const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch { }
  },
  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { }
  }
};
