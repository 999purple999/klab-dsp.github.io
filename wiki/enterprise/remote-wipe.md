---
title: "Remote Wipe"
slug: "remote-wipe"
category: "Enterprise"
tags: ["remote-wipe", "sessions", "security", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/src/workspaceIndustrial.ts"
  - "src/shared/workspace.ts"
related: ["enterprise/elevation-tokens", "enterprise/dangerous-ops", "enterprise/overview"]
---

# Remote Wipe

## What it is

Remote wipe revokes all active sessions and device trust records for a specific workspace member. The affected user is logged out of every device — Windows desktop, Android, and web — immediately. Their devices will stop receiving real-time updates and will be kicked from any presence sessions they are in.

Remote wipe is a workspace-level operation. It does not delete the user's account or their content — it only revokes their access tokens and device records for the workspace.

## When to use it

Use remote wipe when:
- A team member's device is lost or stolen and you need to prevent unauthorised access.
- An employee has been terminated and you need to ensure immediate access revocation before account offboarding is complete.
- You suspect a session has been compromised and need to force a re-authentication.

## Before you begin

You need:
- Workspace `admin` role or above.
- TOTP enrolled on your account for the workspace (see [TOTP elevation tokens](elevation-tokens.md)).

## Step by step

### Step 1 — Obtain an elevation token

1. Open K-Perception → **Workspace admin** → **Members**.
2. Find the member you want to wipe and click **Actions** → **Remote wipe**.
3. K-Perception prompts you to enter your 6-digit TOTP code.
4. Enter the code from your authenticator app.
5. An elevation token is minted for the `remote-wipe` operation (valid for 300 seconds).

### Step 2 — Confirm the remote wipe

6. Review the warning: all sessions and device records for the selected user will be revoked.
7. Confirm the action.

Alternatively, via API:

```bash
# Step 1: obtain elevation token
curl -X POST https://api.kperception.app/workspaces/{workspaceId}/step-up \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{ "operation": "remote-wipe", "totpCode": "123456" }'
# Returns: { "token": "...", "ttlSeconds": 300, "operation": "remote-wipe" }

# Step 2: perform remote wipe
curl -X POST https://api.kperception.app/workspaces/{workspaceId}/members/{targetUserId}/remote-wipe \
  -H "Authorization: Bearer <session-token>" \
  -H "X-KP-Elevation: <elevation-token>"
```

### Step 3 — Verify

8. The target user is kicked from presence (the server sends a `/presence-kick` notification via the workspace hub).
9. An audit event `member_remote_wiped` is written to the workspace audit chain with `severity: critical`.
10. In **Workspace admin** → **Members**, the member's last-active status will reflect the wipe.

## What remote wipe does

The server executes the following for the target user:

1. Sets `revoked_at = now()` on all rows in the `sessions` table where `user_id = targetUserId AND revoked_at IS NULL`.
2. Sets `revoked_at = now()` on all rows in the `devices` table (or equivalent device trust table) for that user.
3. Sends a `/presence-kick` notification to the workspace hub with `{ userId: targetUserId, reason: 'remote-wiped' }`, which disconnects any active WebSocket presence connections.
4. Invalidates the presence ACL cache for that user.
5. Writes a `member_remote_wiped` audit event with `severity: critical`.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| Target user has no active sessions | Revoke calls are no-ops; operation succeeds |
| Target user is the workspace owner | Can be wiped if caller is `admin` |
| Caller is not `admin` | Returns `403 forbidden` |
| Elevation token missing | Returns `403 two_fa_required: Step-up required for this operation` |
| Elevation token already consumed | Returns `403 two_fa_required: Elevation token invalid or expired` |
| Target user re-logs in after wipe | New sessions are created normally; wipe only affects sessions at the time of the operation |

## Platform differences

Remote wipe works identically across platforms. The target user is kicked from presence and logged out on all platforms simultaneously.

## Plan availability

Remote wipe requires the **Enterprise** plan. TOTP step-up requires the `WORKSPACE_TOTP_ENC_KEY` binding to be provisioned.

## Permissions and roles

- **Caller** must have `admin` role or above in the workspace.
- **Target** can be any workspace member.
- Workspace roles: `owner | admin | editor | commenter | viewer | guest`.

## Security implications

- Remote wipe immediately revokes all current sessions. Any in-flight requests using a revoked session will fail on their next server interaction.
- The operation requires both a valid session and a valid TOTP-derived elevation token. An attacker with only a stolen session cannot perform a remote wipe.
- The `member_remote_wiped` audit event is written at `severity: critical` and is part of the tamper-evident workspace audit chain.
- Remote wipe does not rotate the workspace encryption key (WDK). If the target user had access to decrypted content on their device before the wipe, that content may still be readable offline. For maximum security, follow a remote wipe with a [key rotation](rotate-key.md).
- Remote wipe does not revoke SCIM mappings or SSO sessions at the IdP level — revoke access in the IdP as well.

## Settings reference

| Parameter | Value |
|---|---|
| Endpoint | `POST /workspaces/{workspaceId}/members/{targetUserId}/remote-wipe` |
| Required elevation operation | `remote-wipe` |
| Elevation header | `X-KP-Elevation: <token>` |
| Required caller role | `admin` or above |
| Audit event | `member_remote_wiped` (severity: `critical`) |
| Presence kick | Yes — `/presence-kick` notification sent |

## Related articles

- [TOTP elevation tokens](elevation-tokens.md)
- [Dangerous operations overview](dangerous-ops.md)
- [Rotate key](rotate-key.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/workspaces.ts` — `routeRemoteWipe` function
- `private-sync-worker/src/workspaceIndustrial.ts` — `requireElevation`, `consumeElevationToken`
- `src/shared/workspace.ts` — `WorkspaceDangerousOp` type
