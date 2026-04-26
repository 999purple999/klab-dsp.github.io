---
title: "Offline Capability"
slug: "offline-capability"
category: "Platforms"
tags: ["offline", "sync-queue", "indexeddb", "vault", "local-first"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "macos", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/renderer/src/platform/browserVault.ts
  - mobile/src/sync/workerSync.ts
  - mobile/src/sync/syncQueue.ts
  - src/main/index.ts
related: ["platform-overview", "cross-platform-sync", "android", "web-pwa"]
---

# Offline Capability

K-Perception is designed as a **local-first** application. All note reading and editing works offline on every platform. Cloud sync only activates when a network connection is available.

## What Works Offline (All Platforms)

- Reading all notes, including attachments stored in the local vault
- Creating new notes
- Editing existing notes (all 7 editor modes)
- Searching within the local vault
- Exporting notes (TXT, Markdown, JSON, KPX)
- Viewing version history stored locally

## What Requires a Network Connection

| Feature | Network required? |
|---|---|
| Sync push (sending local changes to server) | Yes |
| Sync pull (receiving changes from other devices) | Yes |
| Real-time collaboration (Y.js WebSocket) | Yes |
| Opening share links | Yes |
| Workspace file downloads from R2 | Yes |
| Account sign-in / session refresh | Yes |
| LaTeX engine compilation (cloud path) | N/A — runs locally on desktop |

## Offline Queue

When a note is edited offline, the change is placed in a **durable sync queue** persisted on-device. On Android, this queue is stored in Capacitor Preferences. On desktop and web, it uses the local vault write path.

When connectivity returns, the queue is drained:
1. Each queued item is encrypted client-side.
2. The ciphertext is submitted to the Worker (`POST /sync/changes`).
3. On a successful receipt, the item is removed from the queue.
4. Failed items (network error, server rejection) are marked and retried on the next sync cycle.

The queue is at-least-once: a change is not cleared until a confirmed receipt is received.

## Platform-Specific Offline Behavior

### Windows / macOS / Linux (Desktop)

- Vault stored on disk in `%APPDATA%/K-Perception/vault.enc` (Windows) or equivalent `userData` path.
- All reads and writes are local filesystem operations — no network dependency.
- Pending sync changes queue up and are flushed when the app comes back online.
- Background sync when the app window is closed: [NEEDS-VERIFY — no background sync handler found in main process source].

### Android

- Vault and sync cursor stored in Capacitor Preferences (app-private storage).
- Sync runs every 30 seconds while the **app is in the foreground**. There is no background sync.
- The sync queue survives app restarts.

### Web PWA

- Vault stored in **IndexedDB** in the browser.
- Up to 5 rotating ciphertext backups are also stored in IndexedDB.
- Pending sync changes are flushed when the tab is open and online.
- **The tab must remain open for sync to run.** Closing the tab stops all sync activity.
- The vault key is in memory only. Closing the tab locks the vault; reopening requires the password again.

## Offline Storage Limits

| Platform | Storage location | Practical limit |
|---|---|---|
| Desktop | OS filesystem (userData) | Disk capacity |
| Android | Capacitor Preferences + app-private storage | [NEEDS-VERIFY: Android per-app storage quota] |
| Web PWA | Browser IndexedDB | Browser quota (~10% of available disk or less; varies by browser and OS) |

Browser-enforced IndexedDB quotas depend on the browser and available disk space. Large vaults or many attachments may approach browser limits on the web PWA.

## Local Plan (Fully Offline)

Users on the **Local plan (free)** operate entirely offline. No ciphertext is ever sent to the server. There is no sync queue, no cursor, and no account required. Data exists only on the local device — a lost or wiped device means lost data unless you have manually exported a KPX backup.

## Conflict Handling After Reconnection

When a device comes back online after an offline edit, the sync engine:
1. Pulls remote changes first.
2. Merges remote changes against local state using LWW (last `updatedAt` wins).
3. Pushes local changes that the server doesn't have.

For collaborative documents, Y.js CRDT convergence ensures no edit is lost — all offline edits are merged deterministically when the device reconnects.
