// ─── CloudAPI ─────────────────────────────────────────────────────────────────
// Offline-first client for the Cloudflare Workers backend.

export const CLOUD_BASE = 'https://pw-api.accessisoftwarefrancesco.workers.dev';

let _token = localStorage.getItem('pw_cloud_token') || null;

// ── Auth ──────────────────────────────────────────────────────────────────────
export function setToken(token) {
  _token = token;
  localStorage.setItem('pw_cloud_token', token);
}

export function clearToken() {
  _token = null;
  localStorage.removeItem('pw_cloud_token');
  localStorage.removeItem('pw_username');
}

export function getToken()        { return _token; }
export function isAuthenticated() { return !!_token; }

// ── Password validation (run on client before sending) ───────────────────────
const SPECIAL_RE = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/;

export function validatePassword(pwd) {
  if (!pwd || pwd.length < 8)    return 'Password must be at least 8 characters';
  if (!SPECIAL_RE.test(pwd))     return 'Password must contain at least one special character (!@#$%^&* …)';
  return null;
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function _headers() {
  const h = { 'Content-Type': 'application/json' };
  if (_token) h['Authorization'] = 'Bearer ' + _token;
  return h;
}

async function _req(path, method = 'GET', body = null) {
  try {
    const opts = { method, headers: _headers() };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(CLOUD_BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

/**
 * Register a new account. Returns { ok, error }.
 * Password must be 8+ chars with at least one special character.
 */
export async function register(username, password) {
  const r = await _req('/auth/register', 'POST', { username, password });
  if (r.ok && r.data.token) {
    setToken(r.data.token);
    return { ok: true };
  }
  return { ok: false, error: r.data.error || 'Registration failed' };
}

/**
 * Log in with username and password. Returns { ok, error }.
 */
export async function loginUser(username, password) {
  const r = await _req('/auth/login', 'POST', { username, password });
  if (r.ok && r.data.token) {
    setToken(r.data.token);
    return { ok: true };
  }
  return { ok: false, error: r.data.error || 'Invalid username or password' };
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export async function submitScore(score, wave, name = 'Anonymous') {
  const r = await _req('/api/leaderboard', 'POST', { score: Math.floor(score), wave, name });
  return r.ok;
}

export async function fetchLeaderboard() {
  const r = await _req('/api/leaderboard');
  return r.ok ? r.data : null;
}

// ── Cloud save ────────────────────────────────────────────────────────────────
export async function uploadSave(saveSnapshot) {
  if (!isAuthenticated()) return false;
  const r = await _req('/api/save', 'POST', saveSnapshot);
  return r.ok;
}

export async function downloadSave() {
  if (!isAuthenticated()) return null;
  const r = await _req('/api/save');
  return r.ok ? r.data : null;
}
