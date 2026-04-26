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
related:
  - "legal-overview"
  - "privacy-policy"
---

# Cookie Policy

This article explains how K-Perception's applications use browser storage, cookies, and related technologies. It is provided for convenience and does not replace the official Cookie Policy at kperception.com/legal/cookies [NEEDS-VERIFY URL].

## How K-Perception differs from typical web applications

Most web applications rely heavily on HTTP cookies for session management and tracking. K-Perception's architecture is different in two important ways:

1. **Authentication tokens are stored in sessionStorage, not cookies.** The JWT session token used to authenticate API calls is stored in the browser's `sessionStorage`. It is not transmitted as an HTTP cookie. This means the token is scoped to the current browser tab/window and is not accessible to cross-site requests.

2. **Vault data is stored in IndexedDB.** The encrypted note vault (on web) is stored in the browser's `IndexedDB`. This is a persistent client-side database, not a cookie. It persists across sessions so that the vault is available offline.

The Cloudflare Worker backend is configured to not rely on cookies for standard API authentication (`// we never send cookies; auth is via the Authorization header`).

## SAML SSO — the exception

K-Perception uses an HTTP cookie for the SAML SSO flow only. During SAML authentication:

- A `session` cookie is set (`HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`) to maintain the SSO session.
- This cookie is used only in the SAML authentication context and is not used for general vault access.

This is the only server-set HTTP cookie in the K-Perception application.

## Storage mechanisms in use

| Mechanism | Where | What is stored | Persistent? |
|-----------|-------|---------------|------------|
| `sessionStorage` | Web browser | JWT session token (authentication) | Per-tab; cleared when tab closes |
| `IndexedDB` | Web browser | Encrypted vault data (notes, folders, settings); sync queue | Persistent across sessions |
| `localStorage` | Web browser | UI preferences (theme, layout, collab pending queue) | Persistent across sessions |
| HTTP cookie (`session`) | Web browser | SAML SSO session ID (SAML flow only) | 30 days (`Max-Age=2592000`) |
| Capacitor Preferences | Android | Encrypted vault data (equivalent to IndexedDB on mobile) | Persistent |

## Analytics cookies

[NEEDS-VERIFY — whether K-Perception uses any third-party analytics (e.g., Google Analytics, Plausible, Cloudflare Web Analytics) on the marketing website or within the application. Check with the engineering team before publishing. If analytics are used, list the specific cookies/mechanisms and the opt-out method here.]

## Marketing website cookies

[NEEDS-VERIFY — cookies used on the kperception.com marketing website (as opposed to the application itself) are not visible in the application source code. Contact the web team for the marketing site cookie inventory.]

## How to manage storage

### Clearing sessionStorage

Closing the browser tab automatically clears `sessionStorage`. You can also clear it manually:

- Chrome/Edge: Developer Tools > Application > Session Storage > kperception.com > Clear.
- Firefox: Developer Tools > Storage > Session Storage > kperception.com > Delete all.

Clearing `sessionStorage` logs you out of the current session. Your encrypted vault data in `IndexedDB` is unaffected.

### Clearing IndexedDB (local vault)

Clearing IndexedDB removes the locally cached encrypted vault. Your data is preserved on K-Perception's servers (for paid plans with cloud sync enabled). To clear IndexedDB:

- Chrome/Edge: Developer Tools > Application > IndexedDB > kperception > Delete database.

After clearing, you will need to log in and wait for the vault to re-sync.

### Clearing the SAML session cookie

You can clear the SAML session cookie through your browser's cookie manager. This will end your SSO session.

### Android

On Android, K-Perception uses Capacitor Preferences for vault storage (not browser cookies or IndexedDB). Storage can be cleared via Android Settings > Apps > K-Perception > Storage > Clear Data. This removes the local vault cache; cloud-synced data is preserved.

## Platform differences

| Platform | Session token | Vault storage |
|----------|--------------|--------------|
| Web browser | sessionStorage | IndexedDB |
| Windows desktop (Electron) | sessionStorage (Electron renderer) | IndexedDB (Electron renderer) |
| Android | [NEEDS-VERIFY — Capacitor session storage mechanism] | Capacitor Preferences |

## Related articles

- [Legal Overview](overview.md)
- [Privacy Policy summary](privacy-policy.md)

## Source references

- `private-sync-worker/src/companySso.ts` lines 372, 465 — SAML `Set-Cookie` header (`HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`)
- `private-sync-worker/src/db.ts` line 128 — comment: "web: short-lived because sessions are browser-stored (localStorage / cookie)"
- `private-sync-worker/src/index.ts` line 122 — comment: "we never send cookies; auth is via the Authorization header"
