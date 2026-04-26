---
title: "Cross-Platform Sync"
slug: "cross-platform-sync"
category: "Platforms"
tags: ["sync", "crdt", "yjs", "cursor", "encryption", "collaboration"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "macos", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - mobile/src/sync/workerSync.ts
  - mobile/src/sync/mergeStrategy.ts
  - src/main/index.ts
  - src/renderer/src/platform/browserVault.ts
related: ["platform-overview", "offline-capability", "windows", "android", "web-pwa"]
---

# Cross-Platform Sync

K-Perception uses a **cursor-based incremental sync** backed by a Cloudflare Worker. Notes written on one platform appear on all other signed-in devices after the next sync cycle. The server stores only ciphertext — it cannot read any note content.

Cloud sync is available from the **Guardian plan** upward.

## How Notes Travel Between Devices

1. **Device A edits a note.** The change is written to the local vault and queued in the durable sync queue.
2. **On the next sync cycle**, Device A encrypts the note with AES-256-GCM (using the sync envelope key derived from the vault password, or the per-installation NDK on desktop Wave-2 builds) and posts it to `POST /sync/changes`.
3. **The Worker** validates the payload hash, stores the ciphertext blob in Cloudflare R2, and advances the server-side sequence counter.
4. **Device B polls** `GET /sync/changes?after=<cursor>` and receives the new object metadata.
5. Device B downloads the ciphertext blob (or reads it inline from the response), decrypts it locally, and merges it into its local vault.

The server is a **blind relay**: it never decrypts, never reads note content, and cannot produce a plaintext copy of your data.

## Sync Engine: Cursor-Based Incremental

Each device maintains a **sync cursor** — a monotonically increasing sequence number. After a successful pull:

- First sync (cursor = 0): `GET /sync/bootstrap` returns all objects for the namespace.
- Subsequent syncs: `GET /sync/changes?after=<cursor>` returns only changes since the last cursor.

The cursor is persisted across restarts (Capacitor Preferences on Android, Electron `userData` on desktop, IndexedDB on web).

## Conflict Resolution

### Personal notes (non-collaborative)
Personal note conflicts use **Last-Write-Wins (LWW)** based on the `updatedAt` timestamp:

- If the remote note has a newer `updatedAt`, the remote version wins and the local version is saved as a revision.
- If the local note is newer, it is kept and the remote version is discarded.
- **Tag union exception:** even when the local note wins on content, tags from the remote version are unioned to prevent tag loss.

A 30-second race window is applied: changes within 30 seconds of each other are considered concurrent, and the remote change is given priority to reduce round-trip conflicts.

### Collaborative notes (Vault+ plan)
When real-time collaboration is active, conflict resolution is handled by **Y.js CRDT** (Conflict-free Replicated Data Type). Y.js operations are commutative and associative — any two devices converge to the same document state regardless of operation order, without requiring central arbitration.

Y.js updates are relayed through **DocRoom Durable Objects** on the Worker. The Worker acts as a blind relay: it forwards encrypted Y.js updates without decrypting them. End-to-end encryption is preserved even during live collaboration.

## Platform-Specific Sync Behaviors

| Platform | Sync trigger | Background sync |
|---|---|---|
| Windows / macOS / Linux | Sync on change + periodic interval [NEEDS-VERIFY: interval not confirmed in source] | [NEEDS-VERIFY — no background sync code found in main process] |
| Android | 30-second pull polling (foreground only) | No — app must be open |
| Web PWA | On demand (tab must be open) | No — tab must stay open |

## Sync Envelope Formats

Three wire formats exist for backward compatibility:

| Prefix | Description | Current status |
|---|---|---|
| `ndk1:` | deflate-raw → AES-256-GCM under the per-installation Namespace Data Key (NDK) | Current default on desktop |
| `enc2:` | deflate-raw → AES-256-GCM under PBKDF2-derived sync key | Legacy (pre-Wave-2); still written on mobile/web |
| `enc1:` | Raw plaintext → AES-256-GCM under PBKDF2-derived sync key (no compression) | Legacy read-only; never written by current builds |

All three formats are accepted on the decrypt path on all platforms. The `ndk1:` format provides an extra forward-secrecy property: a future compromise of the vault password cannot retroactively decrypt blobs already pushed under the NDK.

## First-Time Bootstrap

On the very first sync (cursor = 0), the pull flow downloads all server-side objects. After merging them, any local notes not present on the server are pushed up to avoid data loss. This bootstrap is idempotent — if interrupted, it restarts from cursor 0 on the next launch.

## Deletions

Deleted notes are represented as **tombstones** (objects with `tombstone: true`). When a pull receives a tombstone, the local vault removes the corresponding note. Tombstones travel through the same encrypted envelope as regular changes.

## Storage Quotas

Storage limits are enforced server-side by plan:

| Plan | Storage |
|---|---|
| Local | No cloud storage (offline only) |
| Guardian | 5 GB |
| Vault / Lifetime | 50 GB |
| Team | 100 GB shared |
| Enterprise | Unlimited |

Uploads exceeding the quota are rejected with HTTP 413. The client surfaces this as a "quota exceeded" error.
