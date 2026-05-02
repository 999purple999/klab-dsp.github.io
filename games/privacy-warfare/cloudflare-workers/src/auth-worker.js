// ─── Auth Worker ──────────────────────────────────────────────────────────────
// Username / password auth with HMAC-SHA256 password hashing.
// Routes:
//   POST /auth/register  { username, password } → { token }
//   POST /auth/login     { username, password } → { token }
//   GET  /auth/me        (JWT-protected)         → { username }

import { sign, verify } from './jwt.js';

const SPECIAL_RE  = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function hashPassword(password, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function validateInput(username, password) {
  if (!USERNAME_RE.test(username))   return 'Username must be 3–32 alphanumeric characters or underscores';
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (!SPECIAL_RE.test(password))    return 'Password must contain at least one special character';
  return null;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleRegister(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { username = '', password = '' } = body;
  const err = validateInput(username.trim(), password);
  if (err) return json({ error: err }, 400);

  const key = 'user:' + username.toLowerCase();
  const existing = await env.SAVES.get(key);
  if (existing) return json({ error: 'Username already taken' }, 409);

  const hash = await hashPassword(password, env.JWT_SECRET);
  await env.SAVES.put(key, JSON.stringify({ username: username.trim(), hash, createdAt: Date.now() }));

  const token = await sign({ sub: username.toLowerCase(), name: username.trim(), exp: Date.now() + 86400000 * 90 }, env.JWT_SECRET);
  return json({ token });
}

async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { username = '', password = '' } = body;
  if (!username || !password) return json({ error: 'Username and password required' }, 400);

  const key  = 'user:' + username.toLowerCase();
  const raw  = await env.SAVES.get(key);
  if (!raw) return json({ error: 'Invalid username or password' }, 401);

  const user = JSON.parse(raw);
  const hash = await hashPassword(password, env.JWT_SECRET);
  if (hash !== user.hash) return json({ error: 'Invalid username or password' }, 401);

  const token = await sign({ sub: username.toLowerCase(), name: user.username, exp: Date.now() + 86400000 * 90 }, env.JWT_SECRET);
  return json({ token });
}

async function handleMe(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const payload = await verify(token, env.JWT_SECRET);
  if (!payload) return json({ error: 'Invalid or expired token' }, 401);

  return json({ username: payload.name, sub: payload.sub });
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function handleAuth(request, env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/auth/register' && request.method === 'POST') return handleRegister(request, env);
  if (pathname === '/auth/login'    && request.method === 'POST') return handleLogin(request, env);
  if (pathname === '/auth/me'       && request.method === 'GET')  return handleMe(request, env);

  return json({ error: 'Not found' }, 404);
}
