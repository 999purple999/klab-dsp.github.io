---
title: "TOTP Two-Factor Authentication"
slug: "totp-2fa"
category: "Authentication"
tags: ["TOTP", "2FA", "authenticator", "backup-codes", "login", "step-up"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/src/workspaceIndustrial.ts
  - private-sync-worker/migrations/0016_workspace_industrial.sql
related:
  - "totp-step-up"
  - "sessions"
  - "account-recovery"
  - "auth-overview"
---

# TOTP Two-Factor Authentication

## What it is

K-Perception supports TOTP (Time-based One-Time Password) two-factor authentication. TOTP is used in K-Perception primarily as a **step-up mechanism for dangerous workspace operations** (key rotation, remote wipe, workspace deletion, ownership transfer, and backup restore). This is distinct from a login-level 2FA gate.

## TOTP algorithm

| Parameter | Value |
|-----------|-------|
| Standard | RFC 6238 (TOTP) |
| Hash | HMAC-SHA1 |
| Digits | 6 |
| Time step | 30 seconds |
| Clock skew tolerance | ±1 step (±30 seconds) |
| Secret encoding | Base32 (RFC 4648 alphabet) |

The `otpauth://` URI format for QR code generation:
```
otpauth://totp/<workspace-label>?secret=<secretB32>&issuer=K-Perception&algorithm=SHA1&digits=6&period=30
```

## Compatible authenticator apps

Any RFC 6238-compatible TOTP app works. Common options include:
- Google Authenticator
- Authy
- 1Password
- Bitwarden Authenticator
- Microsoft Authenticator
- Any other TOTP app that scans `otpauth://totp/` QR codes

## TOTP enrollment (step-up)

TOTP enrollment for step-up 2FA is per-workspace. Each workspace you belong to can have a separate TOTP enrollment.

1. Open Workspace Settings → Security → Step-up 2FA
2. Click "Enroll TOTP"
3. Scan the QR code with your authenticator app
4. Enter the 6-digit code shown in your authenticator to verify enrollment
5. Save your backup codes in a safe place (they cannot be shown again)

Enrollment is stored in `workspace_user_totp` with the TOTP secret encrypted under the Worker's `WORKSPACE_TOTP_ENC_KEY` binding. The server can decrypt TOTP secrets (they are server-side secrets, not user-derived).

## Backup codes

At enrollment time, backup codes are generated and stored encrypted in `workspace_user_totp.backup_codes_enc`. Backup codes are:
- Single-use — once used, a code is removed from the list
- A substitute for the TOTP code when performing step-up operations

10 backup codes are generated at enrollment (from `workspaceIndustrial.ts`: `Array.from({ length: 10 }, () => b32(randomBytes(5)).slice(0, 10))`). Each code is 10 characters in Base32.

## Login-level 2FA

K-Perception does NOT enforce TOTP at the login step. Session creation (`POST /auth/local/login`, `/auth/google/exchange`) issues a session unconditionally after credentials are verified — no TOTP challenge is inserted into the login flow. The `workspace_user_totp` table is workspace-scoped and is only consulted by the `POST /workspaces/:id/industrial/:uid/step-up` endpoint. There is no account-wide login 2FA in the reviewed source.

## TOTP step-up vs login 2FA

| Aspect | Step-up TOTP | Login 2FA |
|--------|-------------|----------|
| When triggered | Before dangerous workspace operations | Not implemented — login never requires TOTP |
| Scope | Per-workspace | N/A |
| Table | `workspace_user_totp` | No equivalent table exists |
| Token issued | Short-lived elevation token (5 min, single-use) | Normal session |
| Can be bypassed by | Valid backup code | Valid backup code |

## Dangerous operations requiring step-up TOTP

| Operation | Description |
|-----------|-------------|
| `rotate-key` | Rotate workspace data key |
| `remote-wipe` | Revoke all sessions for a member |
| `transfer-ownership` | Transfer workspace ownership |
| `delete-workspace` | Permanently delete workspace |
| `restore-backup` | Restore from backup |

## Re-enrollment and removal

To remove TOTP enrollment: `DELETE /workspaces/:id/industrial/:uid/totp`

Removing TOTP is itself a dangerous operation that requires an elevation token (you must have TOTP enrolled to remove TOTP). This prevents disabling step-up 2FA without possessing the authenticator.

## TOTP secrets security

TOTP secrets are encrypted at rest in D1 using the Worker's `WORKSPACE_TOTP_ENC_KEY` environment binding. This is a server-side key stored in the Worker's secret bindings — it is not user-derived. Loss of `WORKSPACE_TOTP_ENC_KEY` invalidates all TOTP enrollments and requires all users to re-enroll.

## Platform differences

TOTP enrollment and step-up are enforced server-side (Cloudflare Worker). The 6-digit code is entered through the app UI on any platform. The verification runs identically regardless of platform.

## Related articles

- [TOTP Step-Up for Dangerous Operations](../security/totp-step-up.md)
- [Sessions](sessions.md)
- [Account Recovery](account-recovery.md)
- [Authentication Overview](overview.md)
