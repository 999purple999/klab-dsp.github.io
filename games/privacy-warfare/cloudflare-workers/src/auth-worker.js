// ─── Auth Worker ──────────────────────────────────────────────────────────────
// Handles GitHub OAuth login flow and issues signed JWT sessions.
// Routes: GET /auth/login  → redirects to GitHub OAuth
//         GET /auth/callback → exchanges code, issues JWT, redirects back to game

import { sign } from './jwt.js';

export async function handleAuth(request, env) {
  const url = new URL(request.url);

  // Step 1: Redirect user to GitHub OAuth
  if (url.pathname === '/auth/login') {
    const ghURL = new URL('https://github.com/login/oauth/authorize');
    ghURL.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    ghURL.searchParams.set('scope', 'user:email');
    ghURL.searchParams.set('redirect_uri', new URL(request.url).origin + '/auth/callback');
    return Response.redirect(ghURL.toString(), 302);
  }

  // Step 2: Exchange authorization code for GitHub access token
  if (url.pathname === '/auth/callback') {
    const code = url.searchParams.get('code');
    if (!code) return new Response('Missing code', { status: 400 });

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id:     env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response('GitHub auth failed', { status: 401 });
    }

    // Fetch GitHub user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization:  'Bearer ' + tokenData.access_token,
        'User-Agent':   'PrivacyWarfare/2.0',
        Accept:         'application/vnd.github.v3+json',
      },
    });
    const user = await userRes.json();

    // Issue our own 30-day JWT
    const payload = {
      sub:  String(user.id),
      name: user.login,
      exp:  Date.now() + 86400000 * 30,
    };
    const jwt = await sign(payload, env.JWT_SECRET);

    // Redirect back to game with token in query string
    // The game's CloudAPI.checkAuthCallback() will read and store it
    const gameURL = env.GAME_ORIGIN + '/games/privacy-warfare/src/?token=' + encodeURIComponent(jwt);
    return Response.redirect(gameURL, 302);
  }

  return new Response('Not found', { status: 404 });
}
