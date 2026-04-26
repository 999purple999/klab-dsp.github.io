---
title: "Email + Password Authentication"
slug: "email-password"
category: "Authentication"
tags: ["email", "password", "Argon2id", "signup", "login", "reset"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/src/auth-local.ts
  - private-sync-worker/migrations/0034_local_auth.sql
related:
  - "auth-overview"
  - "sessions"
  - "account-recovery"
  - "totp-2fa"
---

# Email + Password Authentication

## What it is

Email + password is the standard account credential for K-Perception. The account password authenticates you to the server and is distinct from the vault password that decrypts your local notes. The server stores a one-way Argon2id hash of your account password — the plaintext is never stored or transmitted after the login request.

## Password hashing

Account passwords are hashed server-side using Argon2id with the same OWASP 2023 parameters used for vault key derivation:

| Parameter | Value |
|-----------|-------|
| Algorithm | Argon2id |
| Memory | m=19456 KiB |
| Iterations | t=2 |
| Parallelism | p=1 |
| Output length | 32 bytes |
| Salt | 16 bytes, random per hash |

Stored format: `argon2id:m=19456,t=2,p=1:<salt_b64url>:<hash_b64url>`

Password comparison is constant-time to prevent timing oracle attacks.

**Legacy accounts**: Accounts created before the Argon2id upgrade used PBKDF2-SHA256 at 300,000 iterations. On the next successful login, the server transparently re-hashes the password with Argon2id and replaces the stored hash. The user sees no change.

## Password requirements

| Requirement | Constraint |
|-------------|-----------|
| Minimum length | 8 characters |
| Maximum length | 256 characters |

## Signup flow

1. `POST /auth/local/signup` with `{ email, password, deviceId, deviceName, platform }`
2. Server validates email format and password length
3. Server checks email is not already registered (returns `409` if taken)
4. Server hashes password with Argon2id
5. Server creates user, local credential record, and personal namespace
6. Server sends email verification link (expires in 24 hours)
7. Server issues session and returns session details

Email must be a valid address in the format `user@domain.tld`.

## Login flow

1. `POST /auth/local/login` with `{ email, password, deviceId, deviceName, platform }`
2. Server validates email format
3. Server looks up credential by email — always runs constant-time comparison even if credential not found (prevents user enumeration via timing)
4. If PBKDF2 hash matched: transparently re-hashes with Argon2id, persists new hash
5. Server registers device and issues session
6. Auto-accepts any pending team invitations for the email address

The server returns `401 Invalid email or password` for any authentication failure, without indicating whether the email exists.

## Forgot password flow

1. User requests `POST /auth/local/forgot` with `{ email }`
2. Server always returns `200 OK` regardless of whether the email is registered (prevents user enumeration)
3. If the email is registered, server sends a reset link to that address (via Resend API)
4. Reset link format: `https://app.kperception.com/auth/reset-password?token=<uuid>`
5. Reset link expires in 1 hour

## Password reset flow

1. User clicks the reset link
2. `POST /auth/local/reset` with `{ token, newPassword }`
3. Server validates: token is a valid, unused, unexpired UUID
4. Server hashes new password with Argon2id
5. Server records `password_reset` audit event
6. Tokens are single-use — consuming the token invalidates it immediately

## Change password (authenticated)

Authenticated users can change their password via `POST /auth/local/change-password` with `{ currentPassword, newPassword }`. The current password must be verified before the change is accepted.

## Email verification

After signup, an email verification link is sent. Verification is handled by:
- `POST /auth/local/verify-email` with `{ token }`
- Token expires in 24 hours (confirmed: `db.ts` sets `expires_at = Date.now() + 24 * 60 * 60 * 1000`)

## Important: account password vs vault password

The **account password** (used here) is not the same as the **vault password**. The account password authenticates you to the server. The vault password decrypts your notes and never leaves your device. Changing your account password does not affect your vault or any encrypted content. See [Account Recovery](account-recovery.md) for vault password recovery.

## Merging with Google account

If a user signs in with Google using the same email address as an existing email+password account, Google is automatically linked to that account via the `provider_accounts` table. The existing account is found by matching email, and the Google `provider_sub` (stable Google user ID) is stored alongside it. The user can then sign in via either method. There is no separate "link accounts" action required.

## Platform differences

Email + password authentication works identically on all three platforms. The login form is presented natively on desktop and Android; via a web form on the browser.

## Related articles

- [Authentication Overview](overview.md)
- [Sessions](sessions.md)
- [Account Recovery](account-recovery.md)
- [TOTP 2FA](totp-2fa.md)
