---
title: "Google OAuth2 PKCE Authentication"
slug: "google-oauth"
category: "Authentication"
tags: ["Google", "OAuth2", "PKCE", "SSO", "authentication"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/src/auth.ts
  - private-sync-worker/migrations/0001_init.sql
related:
  - "auth-overview"
  - "sessions"
  - "email-password"
  - "device-management"
---

# Google OAuth2 PKCE Authentication

## What it is

K-Perception supports Sign in with Google using the OAuth2 authorization code flow with PKCE (Proof Key for Code Exchange). No Google client secret is stored on native clients (desktop, mobile); PKCE eliminates the need for one. The server acts as an OAuth2 client on behalf of web browsers.

## What PKCE prevents

Without PKCE, an attacker who intercepts the OAuth2 authorization code (e.g. via a malicious app listening on the same redirect URI) could exchange it for tokens. PKCE prevents this by binding the authorization code to a cryptographically random code verifier that only the legitimate client possesses.

PKCE flow:
1. Client generates `code_verifier` (32 random bytes, base64url-encoded)
2. Client computes `code_challenge = base64url(SHA-256(code_verifier))`
3. Authorization request includes `code_challenge` and `code_challenge_method=S256`
4. Authorization server returns a code that is bound to `code_challenge`
5. Code exchange includes `code_verifier`; server verifies `base64url(SHA-256(code_verifier)) === code_challenge`
6. An intercepted code is useless without `code_verifier`

## OAuth2 scopes

The standard scopes requested are `openid email profile`. An optional `https://www.googleapis.com/auth/drive.appdata` scope may be included when the app needs Drive appdata access (for cross-device sync fallback).

## Platform-specific flows

### Desktop (Electron)

Desktop uses a separate Google OAuth client (GOOGLE_DESKTOP_CLIENT_ID) configured for loopback redirect URIs per RFC 8252 §7.3.

1. App sends `POST /auth/google/start` with `platform=desktop` and a client-generated code challenge
2. Server returns `authUrl` pointing to `accounts.google.com`
3. App opens the URL in the **system browser** (not an embedded WebView)
4. Google redirects to a loopback URI: `http://127.0.0.1:<port>/oauth2callback`
5. App's local HTTP listener captures the code and state
6. App sends `POST /auth/google/exchange` with the code and code verifier
7. Server exchanges with Google, validates the PKCE challenge, and issues a K-Perception session

The loopback URI must match the pattern `http://127.0.0.1:<PORT>/oauth2callback` (any port). `localhost` is also accepted.

### Android (Capacitor)

1. App sends `POST /auth/google/start` with `platform=mobile`
2. Server returns `authUrl`
3. App opens URL (Chrome Custom Tab recommended)
4. Google redirects to the Worker's HTTPS callback URL: `POST /auth/callback`
5. Worker redirects to `com.kperception.app://oauth2redirect?code=...&state=...`
6. Android app receives the deep link, extracts `code` and `state`
7. App sends `POST /auth/google/exchange`
8. Server completes PKCE exchange and issues session

The Worker's HTTPS callback is used (not a registered custom scheme) to avoid needing to register `com.kperception.app://` with Google Cloud Console as an authorized redirect URI.

### Web (browser)

For web, the server holds the code verifier (instead of the browser, because browsers cannot keep a secret in localStorage):

1. Browser sends `POST /auth/google/start` with `platform=web`
2. Server generates a random `code_verifier` and `code_challenge`; stores verifier in KV with 10-minute TTL
3. Server returns `authUrl` to browser
4. Browser redirects to Google
5. Google redirects back to the configured `GOOGLE_AUTH_REDIRECT_URI_WEB`
6. Browser sends `POST /auth/google/exchange`; server retrieves stored `code_verifier` from KV and exchanges with Google

## Account linking

If a user signs in with Google and a K-Perception account already exists with the same email address (from a previous email+password signup), the Google account is linked to the existing K-Perception account. The `provider_accounts` table stores the mapping:

```sql
CREATE TABLE IF NOT EXISTS provider_accounts (
  user_id          TEXT NOT NULL,
  provider         TEXT NOT NULL DEFAULT 'google',
  provider_sub     TEXT NOT NULL,   -- Google "sub" claim (stable, unique per user)
  email            TEXT,
  email_verified   INTEGER NOT NULL DEFAULT 0,
  ...
)
```

The `provider_sub` (Google's stable user ID) is the primary identifier, not the email, because emails can change.

## Refresh tokens

Google refresh tokens are stored server-side in Cloudflare KV (encrypted via `kvCrypto`) when `refresh_mode = 'server-held'`. On native clients, the token may be client-held (`refresh_mode = 'client-held-native'`) and stored in the platform keychain. Raw refresh tokens are never stored in the D1 `sessions` table.

## Disconnecting Google

Users can disconnect their Google account via `POST /auth/google/disconnect`. This requires only a valid active session (Bearer token) — no separate password re-authentication is required. On disconnect, the `provider_accounts` row is deleted, the server-held Google refresh token (if any) is removed from KV, and all active sessions are revoked (forcing a fresh sign-in).

## Security implications

- No client secret is required for desktop and mobile — PKCE provides equivalent security without a shared secret
- The system browser (not an embedded WebView) is used on desktop, preventing the app from intercepting Google credentials entered during sign-in
- Google's `sub` claim is a stable, opaque user ID — it does not change if the user changes their Google email address
- State parameter (random UUID) prevents CSRF attacks on the OAuth callback

## Platform differences

| Aspect | Desktop | Android | Web |
|--------|---------|---------|-----|
| Client ID | GOOGLE_DESKTOP_CLIENT_ID | GOOGLE_CLIENT_ID | GOOGLE_CLIENT_ID |
| Redirect URI | Loopback (127.0.0.1) | Worker HTTPS callback | Configured web URI |
| Code verifier holder | Client (app) | Client (app) | Server (KV) |
| Browser used | System browser | Chrome Custom Tab | Popup/redirect |

## Related articles

- [Authentication Overview](overview.md)
- [Sessions](sessions.md)
- [Email + Password Authentication](email-password.md)
- [Device Management](device-management.md)
