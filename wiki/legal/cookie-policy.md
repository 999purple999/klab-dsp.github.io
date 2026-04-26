---
title: "Cookie Policy"
slug: "cookie-policy"
category: "Legal"
tags: ["cookies", "privacy", "storage", "sessionstorage", "indexeddb"]
audience: "admin"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/companySso.ts"
  - "private-sync-worker/src/db.ts"
  - "private-sync-worker/src/index.ts"
related:
  - "legal-overview"
  - "privacy-policy"
---

# Cookie Policy

This article describes how K-Perception's applications use browser storage, cookies, and related technologies. The authoritative Cookie Policy is published at [PLACEHOLDER — update before publishing: insert canonical URL, e.g. kperception.com/legal/cookies].

## How K-Perception differs from typical web applications

Most web applications rely on HTTP cookies for session management and tracking. K-Perception's architecture differs in two important ways:

1. **Authentication tokens are stored in sessionStorage, not cookies.** The JWT session token used to authenticate API calls is stored in the browser's `sessionStorage`. It is not sent as an HTTP cookie and is not accessible to cross-site requests. The Cloudflare Worker backend is configured to authenticate exclusively via the `Authorization` request header — it does not read or set cookies for standard API requests.

2. **Vault data is stored in IndexedDB, not cookies.** The encrypted note vault is stored in the browser's `IndexedDB`, a persistent client-side database. This allows the vault to be available offline without transmitting data to a server.

## SAML SSO — the only server-set cookie

K-Perception uses a single HTTP cookie, set only during the SAML SSO authentication flow:

- **Name:** `session`
- **Attributes:** `HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` (30 days)
- **Purpose:** Maintains the SAML SSO session state during enterprise single sign-on.
- **Scope:** Used only in the SAML authentication context, not for general vault access or session management.

This is the only server-set HTTP cookie in the K-Perception application.

## Storage mechanisms in use

| Mechanism | Platform | What is stored | Persistence |
|-----------|----------|---------------|-------------|
| `sessionStorage` | Web browser | JWT session token (authentication) | Per browser tab; cleared when tab closes |
| `IndexedDB` | Web browser | Encrypted vault data (notes, folders, settings); offline sync queue | Persistent across sessions |
| `localStorage` | Web browser | UI preferences (theme, layout, collab pending queue) | Persistent across sessions |
| HTTP cookie (`session`) | Web browser | SAML SSO session ID (SAML flow only) | 30 days |
| Capacitor Preferences | Android | Encrypted vault data; application state | Persistent |
| `sessionStorage` | Windows desktop (Electron) | JWT session token (authentication) | Per Electron window session |
| `IndexedDB` | Windows desktop (Electron) | Encrypted vault data; offline sync queue | Persistent |

## Analytics and tracking

[PLACEHOLDER — update before publishing: confirm whether any third-party analytics service (e.g. Cloudflare Web Analytics, Plausible, or similar) is used on the marketing website or within the application. If analytics are used, list the specific cookies or storage mechanisms involved and the available opt-out mechanism. If no analytics or tracking is used, state this explicitly.]

## Marketing website storage

[PLACEHOLDER — update before publishing: the storage mechanisms used on the kperception.com marketing website are separate from the application. Conduct a cookie audit of the marketing website and list all cookies, their purposes, and their retention periods before publishing.]

## Managing storage

### Clearing sessionStorage

Closing the browser tab automatically clears `sessionStorage`. To clear it manually:

- **Chrome / Edge:** DevTools (F12) → Application → Session Storage → [origin] → Clear all values.
- **Firefox:** DevTools (F12) → Storage → Session Storage → [origin] → Delete all.

Clearing `sessionStorage` ends your current session. Your encrypted vault data in `IndexedDB` is not affected.

### Clearing IndexedDB (local vault cache)

Clearing `IndexedDB` removes the locally cached encrypted vault. For paid plans with cloud sync enabled, your data remains on K-Perception's servers and will re-sync on next login.

- **Chrome / Edge:** DevTools (F12) → Application → IndexedDB → kperception → Delete database.

After clearing, you will need to log in again and wait for the vault to re-sync.

### Clearing the SAML session cookie

You can delete the SAML session cookie through your browser's cookie manager. This ends your SSO session and requires re-authentication through your identity provider.

### Android

On Android, K-Perception uses Capacitor Preferences for vault storage. Storage can be cleared via Android Settings → Apps → K-Perception → Storage → Clear Data. This removes the local vault cache; cloud-synced data is preserved on K-Perception's servers.

## Related articles

- [Legal Overview](overview.md)
- [Privacy Policy summary](privacy-policy.md)

## Source references

- `private-sync-worker/src/companySso.ts` lines 372, 465 — SAML `Set-Cookie` header (`HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`)
- `private-sync-worker/src/index.ts` — comment: "we never send cookies; auth is via the Authorization header"
- `private-sync-worker/src/db.ts` — session storage comment referencing browser-based session management
