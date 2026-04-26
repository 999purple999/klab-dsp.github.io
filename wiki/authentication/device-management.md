---
title: "Device Management"
slug: "device-management"
category: "Authentication"
tags: ["device", "revocation", "session", "security", "management"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/src/auth.ts
  - private-sync-worker/src/db.ts
  - private-sync-worker/migrations/0001_init.sql
related:
  - "auth-overview"
  - "sessions"
  - "session-security"
  - "biometric-unlock"
---

# Device Management

## What it is

Every K-Perception client (desktop app, Android app, or browser) registers as a named device when you sign in. You can view all registered devices, see when they were last active, and revoke access from devices you no longer use or recognize.

## Device registration

A device is registered automatically during authentication (`POST /auth/google/start`, `/auth/google/exchange`, `/auth/local/login`, or `/auth/local/signup`). The device record includes:

| Field | Description |
|-------|-------------|
| `device_id` | Client-generated UUID, stable for the lifetime of the installation |
| `user_id` | The authenticated user |
| `platform` | `web`, `desktop`, or `mobile` |
| `name` | Optional human-readable name (e.g. "Francesco's MacBook") |
| `app_version` | App version string at registration time |
| `first_seen_at` | Timestamp of first registration |
| `last_seen_at` | Timestamp of most recent activity |
| `revoked_at` | Null for active devices; set to timestamp on revocation |

## Viewing devices

Go to Account → Sessions (or Account → Devices) to see all registered devices. Each entry shows:
- Device name and platform
- App version
- First registered date
- Last active date
- Active/revoked status

## Revoking a device

To revoke a device: click "Revoke" next to the device in the device list.

The API endpoint: `POST /auth/devices/:id/revoke`

### What revocation does

1. Sets `devices.revoked_at` to the current timestamp
2. Revokes all active sessions associated with that device (sets `sessions.revoked_at`)
3. The next API request from that device returns `401 session_revoked`
4. The device is forced to re-authenticate on next use

### What revocation does NOT do

Revocation invalidates the session token but does NOT:
- Delete encrypted local data on the revoked device
- Revoke the device's cryptographic keypairs (ECDSA P-256 signing key and ECDH P-256 agreement key)
- Prevent the device from signing in again with valid credentials

The encrypted local data on a revoked device remains protected by the vault password — it is inaccessible without it.

### Workspace device trust

Workspaces can require explicit device trust approval (`require_device_trust = 1`). In this mode, a device may be trusted for the owner's personal vault but still require admin approval before the workspace WDK (Workspace Data Key) is wrapped for it. A device in `pending` trust state cannot access workspace content.

## Device limit per plan

Device limits are enforced per plan at sync time in `private-sync-worker/src/sync.ts` via the `syncDeviceLimit` feature flag. The limits by plan are:

| Plan | Device limit |
|------|-------------|
| Local | No sync (0) |
| Guardian | 3 |
| Vault | 8 |
| Lifetime | 10 |
| Team | 20 |
| Enterprise | Unlimited |

The check counts non-revoked devices sorted by first registration date. When a new device would exceed the plan's limit, the sync endpoint returns `403` with a message directing the user to revoke an older device from Account settings.

## Cryptographic device identity

Beyond the session token, each device has a permanent cryptographic identity:
- **ECDSA P-256 signing keypair** — used to sign wrapped key blobs (attestation)
- **ECDH P-256 key-agreement keypair** — used to receive the wrapped WDK from other workspace members

These keypairs are generated at first install (`generateDeviceKeypairs()`) and stored in OS-level secure storage. Public keys are uploaded to the server during device registration and stored in `devices` or the wrapped-keys tables.

Revoking a device does not delete its public keys from the server's key tables. If the same `device_id` re-authenticates after revocation, the existing keypairs are reused.

## Lost or stolen device

If your device is lost or stolen:

1. Sign in on another device or the web
2. Go to Account → Sessions
3. Find the lost device and click "Revoke"
4. The lost device's session is immediately invalidated
5. The attacker cannot access your K-Perception data via the API without re-authenticating
6. Your encrypted vault data on the lost device remains protected by the vault password

If you suspect the vault password is also compromised, use your recovery code to gain access from a new device and change your vault password.

## Trusted devices for workspaces

In workspaces with `require_device_trust` enabled, newly registered devices start in `pending` state and must be approved by a workspace admin before they can access workspace content. This prevents a compromised account from immediately granting workspace access to an attacker's device.

Trust states: `pending` | `approved` | `rejected`

## Platform differences

The device management UI is available on all three platforms. Revocation is enforced server-side regardless of platform.

## Related articles

- [Authentication Overview](overview.md)
- [Sessions](sessions.md)
- [Session Security](../security/session-security.md)
- [Biometric Unlock](biometric-unlock.md)
