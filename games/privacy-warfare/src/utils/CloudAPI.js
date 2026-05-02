// ─── CloudAPI ─────────────────────────────────────────────────────────────────
// Offline-first client for the Cloudflare Workers backend.
// Set CLOUD_BASE to your deployed Workers URL before using cloud features.

export const CLOUD_BASE = 'https://pw-api.YOUR-DOMAIN.workers.dev';

let _token = localStorage.getItem('pw_cloud_token') || null;

// ── Auth ──────────────────────────────────────────────────────────────────────
export function setToken(token) {
  _token = token;
  localStorage.setItem('pw_cloud_token', token);
}

export function clearToken() {
  _token = null;
  localStorage.removeItem('pw_cloud_token');
}

export function getToken()         { return _token; }
export function isAuthenticated()  { return !!_token; }

/** Redirect to GitHub OAuth login (handled by auth-worker). */
export function loginWithGitHub() {
  window.location.href = CLOUD_BASE + '/auth/login';
}

/** Call from index page if URL has ?token= after OAuth callback. */
export function checkAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('token');
  if (token) {
    setToken(token);
    window.history.replaceState({}, '', window.location.pathname);
    return true;
  }
  return false;
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
    const res = await fetch(CLOUD_BASE + path, opts);
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, status: 0 };
  }
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
