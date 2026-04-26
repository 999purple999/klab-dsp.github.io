---
title: "Session Management"
slug: "sessions"
category: "Authentication"
tags: ["session", "token", "TTL", "revocation", "device", "storage"]
audience: "user"
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
  - "auth-overview"
  - "device-management"
  - "session-security"
  - "totp-2fa"
---

# Session Management

## What it is

A session represents an authenticated connection between a specific device and the K-Perception backend. Sessions are created after successful authentication and expire after a platform-specific TTL. Multiple sessions can exist simultaneously — one per device or browser tab.

## Session structure

Sessions are stored in the D1 `sessions` table:

| Column | Description |
|--------|-------------|
| `session_id` | Opaque UUID — used as the Bearer token |
| `user_id` | The authenticated user |
| `device_id` | The device that created this session |
| `namespace_id` | The user's personal namespace |
| `platform` | `web`, `desktop`, or `mobile` |
| `issued_at` | ISO 8601 timestamp of creation |
| `expires_at` | ISO 8601 timestamp of expiry |
| `revoked_at` | Set on revocation; null = active |

Sessions are identified by the `session_id` UUID, which is used as the `Authorization: Bearer` token. The session is not a JWT — it is an opaque identifier validated against D1 on every request.

## Session TTL

| Platform | TTL |
|----------|-----|
| Web (browser) | 7 days |
| Desktop (Electron) | 60 days |
| Mobile (Android) | 60 days |

Web sessions are shorter-lived because browser `localStorage` provides weaker protection than OS keychains. On desktop and mobile, the OS keychain (Electron `safeStorage` / Android Keystore) provides an additional layer of protection, so longer session lifetimes are acceptable.

## Session storage per platform

| Platform | Storage | Notes |
|----------|---------|-------|
| Desktop (Electron) | Electron `safeStorage` | Uses macOS Keychain or Windows DPAPI for OS-level encryption. Falls back to unencrypted file if `safeStorage.isEncryptionAvailable()` returns false. |
| Android | Capacitor Preferences | App-private storage, OS-protected at rest. The session state is JSON-serialised into the `kp_session` Preferences key. This is not the Android Keystore — see the upgrade path note in `secureStorage.ts`. |
| Web | `localStorage` | No OS-level protection. The session token is a short-lived UUID — not the vault key. |

## Session refresh

The session refresh endpoint is `POST /auth/session/refresh`. The mobile client (`mobile/src/platform/authAdapter.ts`) calls it when the session is within 7 days of expiry. On refresh, the server revokes the old session and issues a new one with a fresh TTL for the same device. A `deviceId` must be supplied in the request body and must match the session's registered device ID.

## Session revocation

### Revoking the current session (sign out)

`POST /auth/logout` sets `revoked_at` on the current session. Subsequent requests with that `session_id` return `401 session_revoked`.

### Revoking a specific session / device

`POST /auth/devices/:id/revoke` revokes all sessions associated with that device. The device's `revoked_at` is set in `devices`, and all sessions for that device are updated.

### Error codes on invalid sessions

| Code | Meaning |
|------|---------|
| `session_not_found` | Session ID does not exist in D1 (may have been deleted) |
| `session_revoked` | Session was explicitly revoked — sign in again |
| `session_expired` | Session TTL has passed — sign in again |

All three codes result in the same client behaviour: clear local session state and show the sign-in screen.

## Viewing active sessions

Users can see their active sessions and registered devices in Account → Sessions. Each entry shows the device name, platform, and last-seen timestamp.

## Multiple sessions

K-Perception allows multiple concurrent sessions — one per device or browser. This means:
- You can be signed in on desktop, Android, and a browser simultaneously
- Each session has its own TTL and can be revoked independently
- Revoking one session does not affect others

## Session and vault key separation

The session token grants API access but does not decrypt any content. The vault key is derived from the vault password (Argon2id) and lives only in device memory. A compromised session token allows API calls (subject to role-based access control) but does not expose any encrypted content.

## Platform differences

The session model is identical across platforms. The difference is only in how the session token is stored:
- Desktop: OS-encrypted file via `safeStorage`
- Android: Capacitor Preferences (app-private, OS-protected at rest)
- Web: `localStorage` (no OS protection)

On web, the session token is a short-lived (7-day) opaque UUID. It is not the vault key, so a localStorage leak exposes API access but not content.

## Related articles

- [Authentication Overview](overview.md)
- [Device Management](device-management.md)
- [Session Security](../security/session-security.md)
- [TOTP 2FA](totp-2fa.md)
