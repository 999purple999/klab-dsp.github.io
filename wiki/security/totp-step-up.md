---
title: "TOTP Step-Up Authentication for Dangerous Operations"
slug: "totp-step-up"
category: "Security"
tags: ["TOTP", "step-up", "2FA", "elevation", "dangerous-ops", "workspace"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/src/workspaceIndustrial.ts
  - private-sync-worker/migrations/0016_workspace_industrial.sql
related:
  - "totp-2fa"
  - "session-security"
  - "security-overview"
---

# TOTP Step-Up Authentication for Dangerous Operations

## What it is

K-Perception requires a TOTP step-up challenge before any workspace member can perform a "dangerous operation" — an irreversible or high-impact action such as key rotation or workspace deletion. This is separate from login-level 2FA (which gates initial authentication); step-up 2FA gates specific sensitive API calls even within an already-authenticated session.

The motivation: a stolen or leaked session token alone is not sufficient to perform destructive operations on a workspace. The attacker would also need the user's TOTP authenticator.

## TOTP algorithm

The TOTP implementation follows RFC 6238:

| Parameter | Value |
|-----------|-------|
| Algorithm | HMAC-SHA1 |
| Digits | 6 |
| Time step | 30 seconds |
| Clock skew tolerance | ±1 step (±30 seconds) |
| Secret encoding | Base32 (RFC 4648 alphabet: A–Z, 2–7) |

The `otpauth://` URI format used for QR codes:
```
otpauth://totp/<label>?secret=<secretB32>&issuer=K-Perception&algorithm=SHA1&digits=6&period=30
```

Server-side TOTP verification from `workspaceIndustrial.ts`:
```typescript
export async function totpAt(secretB32: string, timestampMs: number, step = 30, digits = 6): Promise<string> {
  const counter = Math.floor(timestampMs / 1000 / step)
  // ... HMAC-SHA1 computation ...
}

export async function verifyTotp(secretB32: string, code: string): Promise<boolean> {
  const now = Date.now()
  // ±1 step tolerance to absorb clock skew
  for (const delta of [0, -30_000, 30_000]) {
    const at = await totpAt(secretB32, now + delta)
    if (timingSafeEq(at, trimmed)) return true
  }
  return false
}
```

Comparison is timing-safe (constant-time string comparison) to prevent timing oracle attacks.

## TOTP secrets at rest

TOTP secrets are stored encrypted in D1:
- **Column**: `workspace_user_totp.secret_enc`
- **Encryption**: AES-GCM using the Worker's `WORKSPACE_TOTP_ENC_KEY` binding
- **Note**: This is a server-side secret (not user-derived). If `WORKSPACE_TOTP_ENC_KEY` is lost, all enrolled users must re-enroll.

Backup codes are also stored encrypted: `workspace_user_totp.backup_codes_enc`.

## Dangerous operations requiring step-up

The following operations require a valid elevation token (obtained via TOTP step-up):

| Operation | Description |
|-----------|-------------|
| `rotate-key` | Rotate the workspace data key (WDK) |
| `remote-wipe` | Remotely revoke all sessions for a member |
| `transfer-ownership` | Transfer workspace ownership to another member |
| `delete-workspace` | Permanently delete the workspace |
| `restore-backup` | Restore workspace data from a backup |

## Step by step: performing a dangerous operation

1. **Enroll TOTP** (one-time setup):
   - `GET /workspaces/:id/industrial/:uid/totp/status` — check enrollment status
   - `POST /workspaces/:id/industrial/:uid/totp/enroll` — generate TOTP secret + QR code
   - `POST /workspaces/:id/industrial/:uid/totp/verify` — verify initial TOTP code to complete enrollment

2. **Obtain elevation token** (before each dangerous operation):
   - `POST /workspaces/:id/industrial/:uid/step-up`
   - Body: `{ "operation": "rotate-key", "totpCode": "123456" }`
   - Server verifies the TOTP code and issues a short-lived elevation token
   - Response includes the elevation token value

3. **Execute the dangerous operation**:
   - Include the elevation token in the request header or body
   - Server validates the token is: (a) not expired, (b) bound to the correct operation, (c) not already consumed
   - Token is marked as consumed atomically — single-use only

## Elevation token properties

From `workspace_elevation_tokens` in migration 0016:

| Property | Value |
|----------|-------|
| Token | 32 random bytes; only the SHA-256 hash is stored in D1 |
| TTL | 5 minutes from issuance |
| Scope | Single operation (e.g. `rotate-key`) |
| Consumption | Single-use — consumed atomically on the dangerous-op endpoint |

## Backup codes

Users can use a backup code in place of a TOTP code for step-up. Backup codes are:
- Generated at TOTP enrollment time
- Stored encrypted under `WORKSPACE_TOTP_ENC_KEY` in D1
- Single-use: a consumed backup code is removed from the stored list on use

## Relationship to login-level TOTP

Step-up TOTP and login-level TOTP are separate mechanisms:

| Aspect | Login-level TOTP | Step-up TOTP |
|--------|-----------------|--------------|
| Scope | Account-wide authentication | Per-workspace dangerous operations |
| When checked | At sign-in, before session is issued | After sign-in, before a specific operation |
| Table | [NEEDS-VERIFY — account-level TOTP table] | `workspace_user_totp` |
| Purpose | Prevents unauthorized session creation | Prevents misuse of a stolen session |

## Platform differences

Step-up TOTP is enforced server-side (Cloudflare Worker). Any platform (desktop, Android, web) that makes the dangerous-op API call will be required to provide an elevation token. The TOTP code entry UI is available on all platforms.

## Permissions and roles

- Any workspace member can enroll their own TOTP (`totp/enroll`, `totp/verify`)
- Only members with the `admin` or `owner` role can perform most dangerous operations
- `WORKSPACE_TOTP_ENC_KEY` must be configured in the Worker environment — if missing, step-up endpoints return `503 feature_disabled`

## Related articles

- [TOTP 2FA for Login](../authentication/totp-2fa.md)
- [Session Security](session-security.md)
- [Security Architecture Overview](overview.md)
