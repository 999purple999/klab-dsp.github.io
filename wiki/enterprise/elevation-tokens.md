---
title: "TOTP Step-Up Elevation Tokens"
slug: "elevation-tokens"
category: "Enterprise"
tags: ["totp", "2fa", "elevation", "step-up", "security", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceIndustrial.ts"
  - "private-sync-worker/src/workspaces.ts"
  - "src/shared/workspace.ts"
related: ["enterprise/dangerous-ops", "enterprise/rotate-key", "enterprise/remote-wipe", "enterprise/overview"]
---

# TOTP Step-Up Elevation Tokens

## What it is

TOTP (Time-based One-Time Password) step-up is a second authentication challenge required before K-Perception allows a **dangerous operation**. Even if an attacker steals a valid session token, they cannot perform dangerous operations without also providing a valid TOTP code from the user's authenticator app.

The mechanism works as follows:

1. The user's client calls `POST /workspaces/{workspaceId}/step-up` with a TOTP code and the operation name.
2. The server validates the TOTP code against the user's enrolled secret.
3. If valid, the server creates a short-lived **elevation token** (32 random bytes; only the SHA-256 hash is stored).
4. The elevation token is returned to the client with a 300-second TTL.
5. The client includes the token in the `X-KP-Elevation` header on the dangerous operation request.
6. The server validates the elevation token: checks it exists, has not expired, and has not already been consumed; then marks it consumed (single-use).
7. The dangerous operation proceeds.

Elevation tokens are: **single-use** (consumed on first use), **operation-specific** (a token for `rotate-key` cannot be used for `remote-wipe`), **workspace-scoped**, **user-scoped**, and valid for exactly **300 seconds** (5 minutes).

## Before you begin

Before you can perform any dangerous operation:
1. Enroll TOTP on your account for the relevant workspace.
2. Install an authenticator app (e.g. Google Authenticator, Authy, 1Password).

## TOTP enrollment

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/workspaces/{workspaceId}/totp/status` | Check if TOTP is enrolled |
| POST | `/workspaces/{workspaceId}/totp/enroll` | Generate a TOTP secret + QR code |
| POST | `/workspaces/{workspaceId}/totp/verify` | Confirm enrollment with a code |
| DELETE | `/workspaces/{workspaceId}/totp` | Disable TOTP (requires elevation) |

### TOTP parameters

K-Perception uses RFC 6238 TOTP:
- **Algorithm:** SHA-1
- **Digits:** 6
- **Step:** 30 seconds
- **Clock skew tolerance:** 1 step (30 seconds each side)

TOTP secrets are encrypted at rest with AES-GCM under the worker's `WORKSPACE_TOTP_ENC_KEY` binding. Loss of that binding invalidates all enrolled users (they must re-enroll).

### Step by step — enroll TOTP

1. Open K-Perception → **Workspace admin** → **Security** → **Step-up 2FA**.
2. Click **Enroll TOTP**.
3. Scan the QR code with your authenticator app.
4. Enter the 6-digit code shown in your authenticator to confirm enrollment.
5. Save the **backup codes** shown — these are one-time codes you can use if you lose your authenticator.

## Obtaining an elevation token

### Step-up endpoint

```
POST /workspaces/{workspaceId}/step-up
```

Request body:

```json
{
  "operation": "rotate-key",
  "totpCode": "123456"
}
```

Or using a backup code:

```json
{
  "operation": "rotate-key",
  "backupCode": "XXXX-XXXX"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "token": "<32-byte hex elevation token>",
    "ttlSeconds": 300,
    "operation": "rotate-key"
  }
}
```

### Using the elevation token

Include the token in the `X-KP-Elevation` header on the dangerous operation request:

```
POST /workspaces/{workspaceId}/rotate-key/commit
X-KP-Elevation: <elevation token>
```

## Operations that require elevation

All operations listed in `WorkspaceDangerousOp`:

| Operation | Description |
|---|---|
| `rotate-key` | Rotate the workspace WDK |
| `delete-workspace` | Permanently delete a workspace |
| `transfer-ownership` | Transfer workspace ownership to another user |
| `remote-wipe` | Revoke all sessions for a specific member |
| `change-invite-policy` | Change the workspace invite approval policy |
| `bulk-invite` | Bulk-invite users via CSV |
| `create-admin-api-key` | Create an admin API key |
| `backup-create` | Create a workspace backup |
| `backup-delete` | Delete a workspace backup |
| `restore-backup` | Restore from a backup |
| `delete-channel-with-history` | Delete a channel including all message history |
| `delete-group` | Delete a workspace group |
| `remove-last-admin` | Remove the last admin from a workspace |
| `join-as-admin` | Join a workspace as admin |
| `purge-citations` | Purge citation records |

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| TOTP not enrolled | `POST /step-up` returns `403 two_fa_required: Enroll TOTP before performing this operation` |
| TOTP code is wrong | `403 forbidden: Code did not verify` |
| Backup code used | Code is consumed (removed from the list); cannot be reused |
| Elevation token used once | Token is marked consumed; any second use returns `403 two_fa_required: Elevation token invalid or expired` |
| Elevation token expired (> 300 s) | Returns `403 two_fa_required: Elevation token invalid or expired` |
| Token for wrong operation | Returns `403 two_fa_required` — tokens are operation-specific |
| `WORKSPACE_TOTP_ENC_KEY` not configured | All dangerous operations return `503 not_configured` |
| DPoP headers present but invalid | Returns `401` — DPoP proof binds the request to the device's key pair |
| DPoP headers absent | Falls back to bearer-only enforcement (legacy clients) with a warning logged |

## Platform differences

TOTP enrollment and step-up are supported on all platforms. The authenticator app is separate from K-Perception (any RFC 6238-compatible TOTP app works). On mobile, the TOTP code entry is presented in a modal before triggering dangerous operations.

## Plan availability

TOTP step-up 2FA requires the **Enterprise** plan. The `WORKSPACE_TOTP_ENC_KEY` binding must be provisioned on the Cloudflare Worker deployment.

## Permissions and roles

- Any workspace member can enroll TOTP for their own account.
- Elevation tokens are user-scoped — a token minted by user A cannot be used for an operation by user B.
- The dangerous operation itself may have its own role requirement (e.g. `rotate-key` requires `admin`; `remote-wipe` requires `admin`).

## Security implications

- Elevation tokens are 32 random bytes; only the SHA-256 hash is stored server-side. The raw token is never stored.
- Single-use consumption prevents replay attacks even within the 5-minute window.
- Operation-specificity prevents a stolen `rotate-key` token from being used for `remote-wipe`.
- DPoP proof (when present) binds the request to the device's private key, meaning a stolen session + stolen elevation token is still useless without the matching device key.
- Disabling TOTP itself requires an elevation token (uses `change-invite-policy` operation as the gate) — you cannot silently remove 2FA.
- Backup codes are stored encrypted. Each code is single-use.

## Settings reference

| Parameter | Value |
|---|---|
| Step-up endpoint | `POST /workspaces/{workspaceId}/step-up` |
| Elevation token TTL | 300 seconds |
| Token header on dangerous ops | `X-KP-Elevation: <token>` |
| TOTP algorithm | SHA-1, 6 digits, 30-second step |
| Storage | SHA-256 hash stored in `workspace_elevation_tokens` |
| Consumption | Single-use; `consumed_at` set on first valid use |

## Related articles

- [Dangerous operations overview](dangerous-ops.md)
- [Rotate key](rotate-key.md)
- [Remote wipe](remote-wipe.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/workspaceIndustrial.ts` — `routeStepUp`, `createElevationToken`, `consumeElevationToken`, TOTP crypto helpers
- `private-sync-worker/src/workspaces.ts` — `requireElevation` function
- `src/shared/workspace.ts` — `WorkspaceDangerousOp` type and `WORKSPACE_DANGEROUS_OPS` list
