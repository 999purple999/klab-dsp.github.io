// ─── Leaderboard Worker ───────────────────────────────────────────────────────
// GET  /api/leaderboard  → returns top 100 global scores
// POST /api/leaderboard  → submits a new score entry (no auth required)
// Scores are stored in KV under the key 'global' as a JSON array.

const MAX_ENTRIES   = 100;
const MAX_NAME_LEN  = 24;

export async function handleLeaderboard(request, env) {
  if (request.method === 'GET') {
    const raw = await env.LEADERBOARD.get('global') || '[]';
    return new Response(raw, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); }
    catch { return _err('Invalid JSON', 400); }

    const { score, wave, name } = body;
    if (typeof score !== 'number' || score < 0 || score > 1e10) return _err('Invalid score', 400);
    if (typeof wave  !== 'number' || wave  < 1)                   return _err('Invalid wave', 400);

    const safeName = String(name || 'Anonymous').slice(0, MAX_NAME_LEN).replace(/[<>&"']/g, '');

    // Load + append + sort + trim
    const raw   = await env.LEADERBOARD.get('global') || '[]';
    const board = JSON.parse(raw);
    board.push({ score: Math.floor(score), wave: Math.floor(wave), name: safeName, ts: Date.now() });
    board.sort((a, b) => b.score - a.score);
    board.splice(MAX_ENTRIES);

    await env.LEADERBOARD.put('global', JSON.stringify(board));
    return _json({ ok: true, rank: board.findIndex(e => e.ts === board[board.length - 1]?.ts) + 1 });
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
