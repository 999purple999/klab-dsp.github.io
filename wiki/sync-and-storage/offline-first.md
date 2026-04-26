---
title: "Offline-first architecture"
slug: "offline-first"
category: "Sync & Storage"
tags: ["offline", "sync", "vault", "local-storage"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/platform/browserVault.ts"
  - "mobile/src/platform/vaultAdapter.ts"
  - "src/renderer/src/hooks/useWorkerSync.ts"
related: ["sync-queue", "pull-polling", "cross-device", "merge-conflicts"]
---

# Offline-first architecture

## What it is

K-Perception is built offline-first: your vault is stored entirely on your device, encrypted, and the application operates fully without any internet connection. Notes can be created, read, edited, and deleted whether you are online or not. The network is used only to push and pull changes — it is never a prerequisite for normal note-taking.

This architecture is the foundation of the privacy model. Because all reads and writes go through the local store first, the network layer handles only encrypted blobs and never sees plaintext in transit (beyond what TLS already provides).

## When to use it

This feature is always active — you do not enable or disable offline mode. You benefit from it:

- When working on a plane, train, or in a location with no signal.
- During brief network outages (notes are never "loading" or "unavailable").
- When you prefer not to depend on a cloud service for day-to-day note access.
- On the Local plan (no cloud sync at all — the vault stays on-device permanently).

## Step by step

No setup is needed. The vault is local by default. Here is what happens when you lose connectivity:

1. You continue creating and editing notes normally.
2. Changes are written immediately to the local encrypted store.
3. The sync queue accumulates the offline changes.
4. When connectivity is restored, the queue drains automatically and changes sync to the cloud.
5. Any changes made by other devices while you were offline are fetched and merged (see [Merge conflicts](merge-conflicts.md)).

## Behaviour and edge cases

- **Vault open:** Opening the app, unlocking the vault, and reading all your notes requires zero network. The unlock is pure local cryptography (Argon2id key derivation + AES-GCM decryption).
- **Operations that require network:**
  - First account creation / first login (tokens must be issued by the server).
  - Pushing changes to the cloud (sync drain).
  - Fetching changes from other devices (pull sync).
  - Generating share links (server must store the ciphertext).
  - Workspace operations (members, channels, files).
- **Health screen:** The health screen shows the sync status indicator. When offline, it shows "Offline — changes are queued". When online and in sync, it shows a green status.
- **Large vaults:** The local store has no practical size limit other than device storage. Very large vaults (many thousands of notes) may cause longer initial decryption on older devices.
- **Storage backend by platform:**
  - **Web (PWA):** IndexedDB via `browserVault.ts`. Data persists across browser restarts unless the user clears browser storage.
  - **Android:** Capacitor Filesystem (app-private directory, `Directory.Data`). The app manifest sets `android:allowBackup="true"`, so data survives reinstall on the same device when Android Backup is enabled on the device.
  - **Desktop (Electron):** Electron local store (encrypted file on disk in the user's AppData directory).
- **Vault corruption:** If local store is corrupted (power cut during write, storage full), the app shows a vault health warning. Recovery is possible via KPX import or by re-downloading all blobs from the server.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Local storage backend | Electron store (AppData) | Capacitor Preferences | IndexedDB |
| Persists across reinstall | Yes (unless uninstall wipes AppData) | Yes (Android Backup enabled) | No (clearing browser data wipes vault) |
| Storage location | `%AppData%\K-Perception\` | Android app data partition | Browser origin storage |
| Capacity limit | OS disk space | Device storage | Browser storage quota (~1 GB on most browsers) |

## Plan availability

Offline-first works on all plans, including the free Local plan.

## Permissions and roles

No specific permissions — the local vault is always accessible to the device user once unlocked.

## Security implications

The local vault store contains only AES-256-GCM ciphertext. A device that is stolen, seized, or forensically imaged yields only ciphertext — the contents are unreadable without the vault password. The local storage is not additionally protected at the OS level (it relies on K-Perception's own encryption layer). On Android, Capacitor Preferences may use the Android Keystore for an additional hardware-backed encryption layer on supported devices.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Sync enabled | Yes (if signed in) | Account settings → Sync |
| Local vault location | Auto (platform default) | Not user-configurable |
| Offline indicator | Shown in health screen | Always visible |

## Related articles

- [Sync queue](sync-queue.md)
- [Pull polling](pull-polling.md)
- [Cross-device sync](cross-device.md)
- [Merge conflicts](merge-conflicts.md)

## Source references

- `src/renderer/src/platform/browserVault.ts` — web IndexedDB vault
- `mobile/src/platform/vaultAdapter.ts` — Android vault adapter
- `src/renderer/src/hooks/useWorkerSync.ts` — sync hook (drain + pull)
