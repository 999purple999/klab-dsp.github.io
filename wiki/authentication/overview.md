---
title: "Authentication Overview"
slug: "auth-overview"
category: "Authentication"
tags: ["authentication", "OAuth2", "PKCE", "SAML", "OIDC", "email-password", "session"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/src/auth.ts
  - private-sync-worker/src/auth-local.ts
  - private-sync-worker/src/session.ts
  - private-sync-worker/src/db.ts
  - private-sync-worker/migrations/0001_init.sql
related:
  - "email-password"
  - "google-oauth"
  - "sessions"
  - "totp-2fa"
  - "account-recovery"
  - "device-management"
---

# Authentication Overview

## What it is

Authentication in K-Perception establishes who you are to the backend server. It is separate from vault decryption: authenticating successfully gives you a session token that grants API access, but the vault password (which decrypts your notes) is never sent to the server and is not part of the authentication flow.

## Authentication methods

| Method | Availability | Description |
|--------|-------------|-------------|
| Email + password | All plans | Create an account with email and password. Password is hashed server-side with Argon2id (m=19456 KiB, t=2, p=1). |
| Google OAuth2 (PKCE) | All plans | Sign in with your Google account. Uses the PKCE extension to prevent authorization code interception. |
| SAML 2.0 | Enterprise | Enterprise SSO via SAML identity provider. Configured per company. |
| OIDC | Enterprise | Enterprise SSO via OpenID Connect identity provider. Configured per company. |

## Account password vs vault password

K-Perception has two distinct passwords:

| Password | What it does | Sent to server? |
|----------|-------------|----------------|
| **Account password** | Authenticates you to the server (email+password flow). Server stores Argon2id hash. | Yes (to verify during login; never stored in plaintext) |
| **Vault password** | Derives your Master Vault Key (MVK) via Argon2id; decrypts your local vault. | Never |

The vault password never leaves your device. Forgetting your vault password means losing access to previously encrypted content unless you have your recovery code. See [Account Recovery](account-recovery.md).

## Session tokens

After successful authentication, the server issues a session token — an opaque UUID stored in the D1 `sessions` table. The token is sent as `Authorization: Bearer <sessionId>` with every API request.

Session TTLs by platform:
- Web: 7 days
- Desktop: 60 days
- Mobile: 60 days

Sessions are validated server-side against D1 on every request (not via JWT signatures). They can be revoked individually or by device.

## Device registration

Every device that authenticates registers itself in the `devices` table with a `device_id`, `platform`, and optional `name`. Device registration is automatic during authentication. You can see and manage your registered devices in Account → Sessions.

## Email verification

For email+password accounts, an email verification link is sent on signup. The server issues a full session immediately — access is NOT blocked pending verification. The `emailVerified` flag is returned in the signup/login response and the client may show a verification prompt, but no API endpoints enforce verification as a prerequisite.

## OAuth2 PKCE

Google OAuth2 uses the PKCE (Proof Key for Code Exchange) extension, which prevents authorization code interception attacks by binding the authorization code to a cryptographically random code verifier:

1. Client generates a random `code_verifier`
2. Client computes `code_challenge = SHA-256(code_verifier)`, encoded as base64url
3. Authorization request includes `code_challenge` and `challenge_method=S256`
4. Code exchange includes `code_verifier`; server verifies `SHA-256(code_verifier) === code_challenge`

No OAuth client secret is required (or used) on desktop and mobile native clients — PKCE eliminates the need for a shared secret.

## Enterprise SSO (SAML / OIDC)

Enterprise plans can configure SAML 2.0 or OIDC SSO through the Company Admin Panel. When SSO is configured:
- Users in the company are redirected to the identity provider for authentication
- K-Perception creates or links accounts based on the SSO identity
- SCIM provisioning can automate user lifecycle management

See the enterprise authentication documentation for setup details.

## Platform differences

| Platform | Google OAuth flow | Session storage |
|----------|------------------|----------------|
| Desktop | System browser (RFC 8252 loopback redirect) | Electron `safeStorage` |
| Android | Worker HTTPS callback → `com.kperception.app://oauth2redirect` custom scheme | Capacitor Preferences (app-private, OS-protected) |
| Web | Server-held PKCE verifier; popup or redirect | `localStorage` |

## Related articles

- [Email + Password Authentication](email-password.md)
- [Google OAuth2 PKCE](google-oauth.md)
- [Sessions](sessions.md)
- [TOTP 2FA](totp-2fa.md)
- [Account Recovery](account-recovery.md)
- [Device Management](device-management.md)
