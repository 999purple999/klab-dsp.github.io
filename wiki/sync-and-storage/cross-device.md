---
title: "Cross-device sync"
slug: "cross-device"
category: "Sync & Storage"
tags: ["sync", "cross-device", "multi-device", "devices"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/kdf.ts"
  - "private-sync-worker/src/sync.ts"
  - "private-sync-worker/migrations/0001_init.sql"
related: ["offline-first", "sync-queue", "pull-polling", "authentication/sessions"]
---

# Cross-device sync

## What it is

Cross-device sync lets you access your vault on any number of devices with the same K-Perception account. The security model is elegant: every device derives the same vault key from the same password via Argon2id, so the encrypted blobs stored in R2 are accessible from any authenticated device — no key exchange required.

The device limit depends on your plan.

## When to use it

- Access notes from your work desktop and personal Android phone.
- Start a note on your phone during a commute and finish it on your laptop.
- Access your vault from a browser tab on a shared/borrowed computer.

## Step by step

### Adding a new device

1. Install K-Perception on the new device (or open the web app).
2. Log in with your account credentials (Google OAuth or email + password).
3. The app authenticates with the Worker and receives a session token.
4. The app calls `GET /sync/bootstrap?after=0` to fetch all your objects from the server.
5. Your vault password is entered — the Argon2id key is derived locally — and each downloaded blob is decrypted using that key.
6. The local store is populated. The new device is now in sync.

After initial bootstrap, subsequent syncs are incremental (cursor-based) — only changes since the last cursor are downloaded.

### Device limit enforcement

| Plan | Device limit |
|---|---|
| Local | 1 device (no cloud sync) |
| Guardian | 3 devices |
| Vault / Lifetime | 8 devices |
| Team / Enterprise | Unlimited |

If you try to sign in on a device that would exceed your plan limit, the Worker returns HTTP 403 (`DEVICE_LIMIT_EXCEEDED`). To free a slot, revoke an existing device from Account settings → Sessions.

## How the crypto works

The vault key is derived as:

```
Argon2id(password, salt, m=19456 KiB, t=2, p=1) → 256-bit AES key
```

The `salt` is stored in D1 alongside your user record, not in the blob. Every device that knows your password can derive the same key and decrypt any blob. The server never sees the password or the derived key.

**Why this is safe:** An attacker who steals your encrypted blobs from R2 must also guess your password to decrypt them. Argon2id is memory-hard (19 MiB per attempt) which limits GPU-based brute-force far more than iteration-count alone.

**Why this means you cannot "change" your vault key without re-encrypting everything:** If you change your password, all blobs are re-encrypted with the new key on the next sync. Until that re-encryption completes, old blobs remain readable with the old key on any device that is online. This transition is handled transparently by the sync engine.

## Behaviour and edge cases

- **Simultaneous edits:** If two devices edit the same note at the same time, both queue their changes. When they sync, the server detects the conflict via sequence numbers and triggers the merge conflict flow. See [Merge conflicts](merge-conflicts.md).
- **Offline device:** If one of your devices is offline for an extended period, it will receive all changes in bulk when it next connects. The bootstrap call returns everything since its last known cursor.
- **Device name:** When you log in, the Worker records the device platform and a generated device name in the `devices` table. You can see and rename devices in Account settings → Sessions.
- **Device revocation:** Revoking a device from the Sessions panel invalidates its session token. The device cannot sync or access the vault server until it re-authenticates. The device's local encrypted store remains intact (you would need to physically clear app data to remove local content).
- **New password on another device:** If you change your vault password on one device, other devices will detect the key mismatch on next sync and prompt you to re-enter the new password.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Initial bootstrap | Full download (all objects) | Full download | Full download |
| Subsequent sync | Incremental (cursor-based) | Incremental | Incremental |
| Session persistence | Saved across restarts | Saved in Capacitor Preferences | Saved in localStorage / IndexedDB |
| Device name shown | "Desktop — Windows" | "Mobile — Android" | "Web — [browser]" |

## Plan availability

Cross-device sync requires Guardian or higher. The Local plan stores the vault on a single device with no cloud sync.

## Permissions and roles

Cross-device sync applies to the user's personal vault. Workspace documents sync to all devices that are workspace members via the workspace sync path.

## Security implications

Cross-device sync is possible without server-side key exchange because all devices share the same Argon2id-derived key. This is both a feature and a consideration:

- **Benefit:** No complex key exchange protocol; no key escrow on the server.
- **Consideration:** If your password is weak, any device that obtained your encrypted blobs could theoretically brute-force the key. Use a strong, unique password.
- **Consideration:** Changing your password on one device does NOT immediately lock out other devices — they retain access until they notice the key mismatch. Plan-based re-encryption happens on next connectivity.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Active devices | Listed | Account settings → Sessions |
| Device limit | Plan-dependent | Plan details |
| Revoke a device | Action in Sessions | Account settings → Sessions → Revoke |

## Related articles

- [Offline-first architecture](offline-first.md)
- [Sync queue](sync-queue.md)
- [Pull polling](pull-polling.md)
- [Sessions](../authentication/sessions.md)

## Source references

- `src/shared/kdf.ts` — Argon2id key derivation (current) and PBKDF2 legacy paths
- `private-sync-worker/src/sync.ts` — bootstrap + incremental sync routes
- `private-sync-worker/migrations/0001_init.sql` — devices + sessions + sync_objects tables
