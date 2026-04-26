---
title: "Session Token Security"
slug: "session-security"
category: "Security"
tags: ["session", "token", "authentication", "secure-storage", "revocation"]
audience: "developer"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/src/session.ts
  - private-sync-worker/src/db.ts
  - private-sync-worker/migrations/0001_init.sql
  - src/shared/clientState.ts
  - src/main/auth.ts
related:
  - "overview"
  - "totp-step-up"
  - "device-management"
  - "sessions"
---

# Session Token Security

## What it is

After a successful authentication (Google OAuth, email+password, SAML, or OIDC), the K-Perception backend issues a session token. This token is an opaque UUID stored in the D1 `sessions` table — not a JWT. The client sends it as a `Bearer` token in every API request.

## Session token properties

| Property | Value |
|----------|-------|
| Format | Opaque UUID (not a JWT) |
| Storage (server) | D1 `sessions` table |
| Authorization | `Authorization: Bearer <sessionId>` header |
| Validation | Server looks up the session row and checks `revoked_at` and `expires_at` |
| Signing | None — session validity is checked against D1, not verified via a signature |

Note from `session.ts`:
> No JWT, no HMAC — the sessionId is an opaque UUID that lives in D1. Future upgrade: add HMAC signing over (sessionId + expiresAt) stored in the Authorization header so the Worker can reject expired tokens without a D1 read.

## Session TTL by platform

Session TTLs differ by platform to balance security (shorter on less-protected storage) with usability (fewer re-auth prompts on devices with OS-level keychain protection):

| Platform | TTL |
|----------|-----|
| Web | 7 days |
| Desktop (Electron) | 60 days |
| Mobile (Android) | 60 days |

```typescript
// from db.ts
const SESSION_TTL_BY_PLATFORM: Record<'web' | 'desktop' | 'mobile', number> = {
  web:     60 * 60 * 24 * 7,   // 7 days
  desktop: 60 * 60 * 24 * 60,  // 60 days
  mobile:  60 * 60 * 24 * 60,  // 60 days
}
```

## Session storage per platform

| Platform | Storage location | Notes |
|----------|-----------------|-------|
| Desktop (Electron) | Electron `safeStorage` | OS-level encryption (macOS Keychain, Windows DPAPI). Falls back to plaintext file if `safeStorage.isEncryptionAvailable()` is false. |
| Android (Capacitor) | Android Keystore [NEEDS-VERIFY — confirm Capacitor secure storage implementation] | OS-protected storage |
| Web (browser) | `localStorage` | No OS-level protection; same-origin JS can read it. The session token is short-lived (7 days) and is not the vault key. |

From `clientState.ts`:
```
hasSecureStorage: true   // Electron: safeStorage
hasSecureStorage: false  // Web: localStorage only
```

From `src/main/auth.ts`:
```typescript
// Session persistence (safeStorage)
if (safeStorage.isEncryptionAvailable()) {
  const enc = safeStorage.encryptString(json)
  // write encrypted bytes to file
}
```

## Session validation (server side)

Every authenticated request goes through `requireAuth` in `session.ts`:

1. Extract `Authorization: Bearer <sessionId>` header
2. Look up `sessionId` in D1 `sessions` table
3. Check `revoked_at IS NULL` — reject if revoked
4. Check `expires_at > now()` — reject if expired
5. Return `AuthContext { userId, deviceId, namespaceId, platform }`

```typescript
// from session.ts
const session = await getSession(env.DB, sessionId)
if (!session)           throw 401 'Session not found'
if (session.revoked_at) throw 401 'Session revoked'
if (session.expires_at < now) throw 401 'Session expired'
```

## Session revocation

Sessions can be revoked in two ways:

1. **Single session**: `POST /auth/logout` revokes the current session. The `revoked_at` column is set to the current timestamp. Subsequent requests with that sessionId return `401 session_revoked`.

2. **All sessions / device revocation**: Revoking a device via `POST /auth/devices/:id/revoke` revokes all sessions associated with that device.

From D1 schema (`0001_init.sql`):
```sql
CREATE TABLE IF NOT EXISTS sessions (
  session_id  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  device_id   TEXT NOT NULL,
  revoked_at  TEXT   -- null = active; set to timestamp on revocation
);
```

## Session and vault key separation

The session token is completely separate from the vault encryption key. Knowing the session token gives API access (subject to server-side authorization checks) but does NOT give access to any encrypted content. The vault key is derived from the user's vault password using Argon2id and lives only in device memory. It is never transmitted to the server or stored in the session.

This means:
- A leaked session token allows API calls but not content decryption
- Session token theft does not expose the user's notes, files, or workspace content

## Behaviour and edge cases

- **Expired sessions**: `session_expired` error code is returned. The client is expected to clear local session state and show the sign-in screen.
- **Revoked sessions**: `session_revoked` error code. Same client behaviour as expired.
- **Not found**: `session_not_found` error code. The session may have been deleted (e.g. after workspace deletion or data purge).
- **Rate limiting**: Auth endpoints are rate-limited by IP using a sliding-window Durable Object counter.
- **Concurrent sessions**: Multiple concurrent sessions per user are allowed (one per device/browser). Each session is independently revocable.

## Related articles

- [Device Management](../authentication/device-management.md)
- [Sessions](../authentication/sessions.md)
- [TOTP Step-Up](totp-step-up.md)
- [Security Architecture Overview](overview.md)
