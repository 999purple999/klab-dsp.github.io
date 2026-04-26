---
title: "Workspace Key Rotation"
slug: "rotate-key"
category: "Enterprise"
tags: ["key-rotation", "wdk", "encryption", "security", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/src/workspaceIndustrial.ts"
  - "src/shared/workspace.ts"
related: ["enterprise/elevation-tokens", "enterprise/dangerous-ops", "enterprise/remote-wipe", "enterprise/overview"]
---

# Workspace Key Rotation

## What it is

Workspace key rotation replaces the Workspace Data Key (WDK) — the master symmetric key used to encrypt all workspace content — with a new key. After rotation, all existing wrapped-key copies held by workspace members are re-wrapped under the new key version, and the workspace's `key_version` counter is incremented.

Key rotation is a two-phase operation:

1. **Start rotation** — `POST /workspaces/{workspaceId}/rotate-key` — the admin requests the list of member devices that need new key wraps.
2. **Commit rotation** — `POST /workspaces/{workspaceId}/rotate-key/commit` — the admin (client-side) derives a new WDK, re-wraps it for all member devices, and submits the new wraps to the server.

Both phases require a valid elevation token for the `rotate-key` operation.

## When to use it

Rotate the workspace key when:
- A workspace admin's device is lost, stolen, or compromised.
- You have just performed a remote wipe on a member and want to ensure they cannot decrypt content offline with a previously cached key.
- A member with `admin` role or higher has left the organisation and you want cryptographic assurance they can no longer access new content.
- Your security policy mandates periodic key rotation.

## Before you begin

You need:
- Workspace `admin` role or above.
- TOTP enrolled on your account for the workspace (see [TOTP elevation tokens](elevation-tokens.md)).
- Sufficient time to re-wrap keys for all active member devices — this is a client-side operation.

## Step by step

### Step 1 — Obtain an elevation token for `rotate-key`

1. Call `POST /workspaces/{workspaceId}/step-up` with `"operation": "rotate-key"` and your TOTP code.
2. Note the returned elevation token (valid for 300 seconds).

```bash
curl -X POST https://api.kperception.app/workspaces/{workspaceId}/step-up \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{ "operation": "rotate-key", "totpCode": "123456" }'
```

### Step 2 — Initiate rotation (get device list)

```bash
curl -X POST https://api.kperception.app/workspaces/{workspaceId}/rotate-key \
  -H "Authorization: Bearer <session-token>" \
  -H "X-KP-Elevation: <elevation-token>"
```

The server returns the list of all member devices that need key wraps at the new version.

### Step 3 — Client-side: generate new key and re-wrap

The K-Perception client:
1. Derives a new WDK (new random key material).
2. For each member device returned in step 2, wraps the new WDK under that device's public key.
3. Optionally re-wraps the recovery wrap under the new key.
4. Optionally re-encrypts guest (projection) keys.

This step is performed entirely on the client — the raw WDK never leaves the client.

### Step 4 — Commit rotation

```bash
# A second elevation token is required for the commit step
curl -X POST https://api.kperception.app/workspaces/{workspaceId}/rotate-key/commit \
  -H "Authorization: Bearer <session-token>" \
  -H "X-KP-Elevation: <second-elevation-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newKeyVersion": 3,
    "reason": "Compromised device",
    "wrappedKeysForMembers": [
      {
        "receiverUserId": "...",
        "receiverDeviceId": "...",
        "senderDeviceId": "...",
        "wrappedKey": "<base64>",
        "senderSignature": "<base64>",
        "senderEd25519Pub": "<base64>",
        "senderX25519Pub": "<base64>"
      }
    ],
    "newRecoveryWrap": { "wrappedKey": "<base64>", "argonParams": {...} }
  }'
```

The `newKeyVersion` must be strictly greater than the current `key_version`.

### Step 5 — Handle missing devices

The commit response includes a `missingDevices` list — devices that still do not have a wrap at the new key version. These are devices that were offline during rotation. The client should retry wrapping for those devices as they come online.

## What happens on the server at commit

1. Stores each `wrappedKeysForMembers` entry in `workspace_wrapped_keys`.
2. Updates `newRecoveryWrap` in `workspace_recovery_wraps` if provided.
3. Updates the workspace `key_version` in the database.
4. Writes a `key_rotation_completed` audit event with `severity: warn`.
5. Sends a `/key-rotated` notification to the workspace hub so connected clients know to fetch the new key version.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| `newKeyVersion` not greater than current | Returns `409 key_version_mismatch` |
| `wrappedKeysForMembers` is empty | Returns `400 invalid_request` |
| Missing devices in the commit response | Devices listed in `missingDevices` still have wraps at the old version; they receive the new wrap when next seen |
| Member added after rotation started | Will appear in `missingDevices` at commit |
| Elevation token expired before commit | Obtain a fresh elevation token and retry commit |
| Two admins attempt simultaneous rotation | The second commit will fail if it submits the same `newKeyVersion` as the first |

## Platform differences

Key rotation is a client-side cryptographic operation. The client generates the new key material and re-wraps it for each device. The server only stores the opaque ciphertexts. All platforms (Windows, Android, web) support key rotation.

## Plan availability

Key rotation requires the **Enterprise** plan. The `WORKSPACE_TOTP_ENC_KEY` binding must be provisioned for the elevation token mechanism.

## Permissions and roles

- Requires `admin` role or above in the workspace.
- Workspace roles: `owner | admin | editor | commenter | viewer | guest`.

## Security implications

- The raw WDK never touches the server — only wrapped (encrypted) copies are stored. Key rotation is therefore a zero-knowledge operation.
- After a successful rotation, member devices with only old-version wraps can still read previously synced content (they have the old WDK). New content will be encrypted under the new WDK, which those devices cannot decrypt until they receive a new wrap.
- The `key_rotation_completed` audit event is written at `severity: warn` and is part of the tamper-evident workspace audit chain.
- Elevation tokens are single-use. The start and commit phases each require their own elevation token (obtained from separate `POST /step-up` calls).
- If an admin performs a rotation while offline members exist, those members will be unable to access new content until they receive their key wrap — this is intentional.

## Settings reference

| Parameter | Value |
|---|---|
| Start rotation endpoint | `POST /workspaces/{workspaceId}/rotate-key` |
| Commit rotation endpoint | `POST /workspaces/{workspaceId}/rotate-key/commit` |
| Required elevation operation | `rotate-key` |
| Elevation header | `X-KP-Elevation: <token>` |
| Required caller role | `admin` or above |
| Audit event | `key_rotation_completed` (severity: `warn`) |
| Hub notification | `/key-rotated` |
| `newKeyVersion` constraint | Must be strictly greater than current `key_version` |

## Related articles

- [TOTP elevation tokens](elevation-tokens.md)
- [Dangerous operations overview](dangerous-ops.md)
- [Remote wipe](remote-wipe.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/workspaces.ts` — `routeStartRotation` and `routeCommitRotation` functions
- `private-sync-worker/src/workspaceIndustrial.ts` — `requireElevation` function
- `src/shared/workspace.ts` — `WorkspaceDangerousOp` type
