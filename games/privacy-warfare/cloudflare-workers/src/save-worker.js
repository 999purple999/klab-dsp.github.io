// ─── Save Worker ──────────────────────────────────────────────────────────────
// GET  /api/save  → returns the user's save data from KV
// POST /api/save  → writes the user's save data to KV (max 50 KB)
// Requires valid JWT in Authorization: Bearer <token> header.

import { verify } from './jwt.js';

export async function handleSave(request, env) {
  // Authenticate
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return _err('Unauthorized', 401);

  let payload;
  try {
    payload = await verify(token, env.JWT_SECRET);
  } catch (e) {
    return _err('Unauthorized: ' + e.message, 401);
  }

  const key = 'save:' + payload.sub;

  if (request.method === 'GET') {
    const raw = await env.SAVES.get(key);
    return new Response(raw || '{}', {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'POST') {
    const body = await request.text();
    if (body.length > 51200) return _err('Payload too large (max 50 KB)', 413);

    // Validate JSON before storing
    try { JSON.parse(body); } catch { return _err('Invalid JSON', 400); }

    await env.SAVES.put(key, body, {
      metadata: { saved: new Date().toISOString(), user: payload.name },
    });
    return _json({ ok: true });
  }

  return _err('Method not allowed', 405);
}

function _json(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } });
}

function _err(msg, status) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
