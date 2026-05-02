// ─── Cloudflare Workers — Main Router ─────────────────────────────────────────
// Routes all requests to the appropriate handler.
// Deploy: npx wrangler deploy (from the cloudflare-workers/ directory)

import { handleAuth }        from './auth-worker.js';
import { handleSave }        from './save-worker.js';
import { handleLeaderboard } from './leaderboard-worker.js';

const CORS = {
  'Access-Control-Allow-Origin':  'https://999purple999.github.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age':       '86400',
};

export default {
  async fetch(request, env) {
    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    let response;

    try {
      if (url.pathname.startsWith('/auth')) {
        response = await handleAuth(request, env);
      } else if (url.pathname === '/api/save') {
        response = await handleSave(request, env);
      } else if (url.pathname === '/api/leaderboard') {
        response = await handleLeaderboard(request, env);
      } else if (url.pathname === '/health') {
        response = new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err) {
      response = new Response(JSON.stringify({ error: 'Internal server error', msg: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Attach CORS headers to every response
    const out = new Response(response.body, response);
    Object.entries(CORS).forEach(([k, v]) => out.headers.set(k, v));
    return out;
  },
};
