---
title: "Dangerous Operations Overview"
slug: "dangerous-ops"
category: "Enterprise"
tags: ["elevation", "totp", "security", "dangerous-ops", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/src/workspaceIndustrial.ts"
  - "private-sync-worker/src/workspaceBackup.ts"
  - "src/shared/workspace.ts"
related: ["enterprise/elevation-tokens", "enterprise/rotate-key", "enterprise/remote-wipe", "enterprise/overview"]
---

# Dangerous Operations Overview

## What it is

A **dangerous operation** is any workspace action that is irreversible or carries significant security implications — key rotation, workspace deletion, member session revocation, ownership transfer, and others. K-Perception requires a TOTP **step-up elevation token** for every dangerous operation, regardless of the user's role or session validity.

This is the complete list of operations classified as dangerous in K-Perception:

| Operation identifier | Description | Minimum role |
|---|---|---|
| `rotate-key` | Rotate the workspace WDK | `admin` |
| `delete-workspace` | Permanently delete the workspace | `owner` |
| `transfer-ownership` | Transfer workspace ownership to another member | `owner` |
| `remote-wipe` | Revoke all sessions for a specific member | `admin` |
| `change-invite-policy` | Change the workspace invite approval policy | `admin` |
| `bulk-invite` | Bulk-invite users via CSV upload | `admin` |
| `create-admin-api-key` | Create an admin-scoped API key | `admin` |
| `backup-create` | Create a workspace backup | `admin` |
| `backup-delete` | Delete a workspace backup | `admin` |
| `restore-backup` | Restore from a backup | `owner` |
| `delete-channel-with-history` | Delete a channel and all its message history | `admin` |
| `delete-group` | Delete a workspace group | `admin` |
| `remove-last-admin` | Remove the last admin from a workspace | `owner` |
| `join-as-admin` | Join a workspace as an admin | `owner` |
| `purge-citations` | Purge citation records | `admin` |

## Why elevation tokens are used

A standard session token proves that a user authenticated at some point in the past (potentially days or weeks ago). If an attacker steals a session token — via XSS, a compromised device, or network interception — they have full access to all operations the user can perform.

Elevation tokens solve this by requiring proof-of-presence at the time of the dangerous action:

1. The attacker needs the session token **and** access to the user's TOTP authenticator app simultaneously.
2. Elevation tokens are operation-specific — a stolen `rotate-key` token cannot be used for `delete-workspace`.
3. Elevation tokens are single-use — replaying a captured token is impossible.
4. Elevation tokens expire after 300 seconds — a captured token is only usable for a 5-minute window.
5. DPoP proof (when the client supports it) additionally binds the request to the device's private key — even with a stolen session and stolen elevation token, the attacker cannot proceed without the matching device private key.

## The DangerousOpModal flow

In the K-Perception UI, every dangerous operation follows the same modal flow:

1. The user clicks the action (e.g. "Rotate key", "Delete workspace", "Remote wipe member").
2. A **DangerousOpModal** appears, explaining what the operation does and warning it may be irreversible.
3. The user enters their **6-digit TOTP code** from their authenticator app (or a backup code).
4. The client calls `POST /workspaces/{workspaceId}/step-up` with the operation name and code.
5. If valid, the server returns an elevation token.
6. The client proceeds with the dangerous operation, attaching `X-KP-Elevation: <token>` to the request.
7. If the elevation token is accepted, the operation proceeds. Otherwise, the modal shows an error.

The elevation token is discarded after use (either consumed by the server or allowed to expire).

## Step by step

### Performing a dangerous operation

1. In the K-Perception UI, initiate the dangerous action.
2. Enter your 6-digit TOTP code in the confirmation modal.
3. Confirm the action.
4. The operation executes.

Or via API:

```bash
# Step 1: get elevation token
curl -X POST https://api.kperception.app/workspaces/{workspaceId}/step-up \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{ "operation": "<operation-id>", "totpCode": "123456" }'
# Returns: { "token": "...", "ttlSeconds": 300, "operation": "..." }

# Step 2: perform the operation
curl -X POST https://api.kperception.app/workspaces/{workspaceId}/<route> \
  -H "Authorization: Bearer <session-token>" \
  -H "X-KP-Elevation: <token>" \
  -H "Content-Type: application/json" \
  -d '...'
```

## Server enforcement

The server enforces elevation on dangerous operations via `requireElevation`:

1. Checks `WORKSPACE_TOTP_ENC_KEY` is configured. If not, returns `503 not_configured`.
2. Reads the `X-KP-Elevation` header. If absent, returns `403 two_fa_required`.
3. Hashes the token with SHA-256 and looks it up in `workspace_elevation_tokens` by `(token_hash, workspace_id, user_id, operation)`.
4. If not found, expired, or already consumed → `403 two_fa_required`.
5. Marks the token as consumed (`consumed_at = now()`).
6. If DPoP headers are present, validates the DPoP proof.
7. Returns `null` (success) — the calling route handler proceeds.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| TOTP not enrolled | `POST /step-up` returns `403 two_fa_required` |
| Invalid TOTP code | `403 forbidden: Code did not verify` |
| Elevation token expired | `403 two_fa_required: Elevation token invalid or expired` |
| Elevation token already consumed | `403 two_fa_required` — same error; prevents replay |
| Token for wrong operation | `403 two_fa_required` — tokens are scoped to one operation |
| `WORKSPACE_TOTP_ENC_KEY` not provisioned | All dangerous operations fail with `503 not_configured` |
| Client omits DPoP headers | Falls back to bearer-only; logs a warning |
| Client provides invalid DPoP | `401` — hard fail |

## Platform differences

The TOTP entry modal appears on all platforms before dangerous operations. On mobile, the numeric keypad appears automatically for code entry. On desktop, a text field is shown.

## Plan availability

TOTP step-up for dangerous operations requires the **Enterprise** plan. The `WORKSPACE_TOTP_ENC_KEY` worker binding must be provisioned.

## Permissions and roles

Each dangerous operation enforces its own minimum role (see the table above). The elevation token check comes after the role check — an `editor` cannot get past the role gate even with a valid elevation token for `rotate-key`.

Workspace roles: `owner | admin | editor | commenter | viewer | guest`.

## Security implications

- Elevation tokens prevent session-hijack attacks from enabling dangerous workspace actions.
- The combination of session token + TOTP code + operation-specific token + DPoP proof provides four independent layers of authentication for dangerous operations.
- All dangerous operations emit an audit event in the workspace audit chain.
- Audit events for dangerous operations are written at `severity: warn` or `severity: critical`.

## Related articles

- [TOTP elevation tokens](elevation-tokens.md)
- [Rotate key](rotate-key.md)
- [Remote wipe](remote-wipe.md)
- [Enterprise overview](overview.md)

## Source references

- `src/shared/workspace.ts` — `WorkspaceDangerousOp` type and `WORKSPACE_DANGEROUS_OPS` constant
- `private-sync-worker/src/workspaceIndustrial.ts` — `routeStepUp`, `requireElevation`, `createElevationToken`, `consumeElevationToken`
- `private-sync-worker/src/workspaces.ts` — `requireElevation` usage across all dangerous routes
- `private-sync-worker/src/workspaceBackup.ts` — `requireElevation` usage for backup operations
