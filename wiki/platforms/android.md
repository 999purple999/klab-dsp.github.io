---
title: "Android Mobile"
slug: "android"
category: "Platforms"
tags: ["android", "mobile", "capacitor", "biometric", "sync", "keystore"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["android"]
last_reviewed: "2026-04-26"
source_refs:
  - capacitor.config.ts
  - mobile/src/platform/biometricAdapter.ts
  - mobile/src/platform/secureStorage.ts
  - mobile/src/sync/workerSync.ts
  - mobile/src/App.tsx
related: ["platform-overview", "cross-platform-sync", "offline-capability"]
---

# Android Mobile

K-Perception for Android is built on **Capacitor 6** (`com.kperception.app`). It delivers the core note-taking experience in a mobile-optimized shell with biometric unlock, a bottom toolbar editor, and 30-second pull polling for sync.

## System Requirements

- Android 5.1 (API level 22) or later (confirmed: `minSdkVersion = 22` in `mobile/android/variables.gradle`)
- ~100 MB storage for the application
- Internet connection for cloud sync (offline reading and editing work without it)
- Biometric hardware (fingerprint sensor or face recognition) for biometric unlock (optional)

## Installation

K-Perception for Android is available on the Google Play Store and as a direct APK download from kperception.app/download.

If installing via APK:
1. Enable "Install from unknown sources" for your browser or file manager under **Settings → Security**.
2. Download the APK from the K-Perception releases page.
3. Open the APK file and follow the Android install prompts.

## Capacitor Architecture

K-Perception for Android is a Capacitor 6 app: the app logic runs in a WebView (served via `https` scheme as configured in `capacitor.config.ts`), and Capacitor plugins bridge native Android APIs into the JavaScript runtime.

Plugins used:
- `@capacitor/preferences` — persistent key-value store (app-private, OS-protected)
- `@capacitor/filesystem` — file access
- `@capacitor/network` — network status
- `@aparajita/capacitor-biometric-auth` — biometric unlock

## Biometric Unlock

Biometric unlock is **Android-only**. It supports fingerprint and face recognition, depending on the hardware enrolled on the device.

**Security model:**
1. On first install, the master vault password is always required.
2. After a successful password unlock, the user may opt in to biometric convenience under **Settings → Security → Biometric Unlock**.
3. Enabling biometric stores an AES-256-GCM encrypted copy of the master password in Capacitor Preferences. The encryption key is derived (PBKDF2, 100,000 iterations) from a stable device install ID and a per-install random salt.
4. On subsequent app launches, biometric authentication gates decryption of that hint, yielding the master password, which is then used to fully re-derive the vault key via Argon2id — no in-memory session state is assumed.
5. Biometric can be disabled at any time from **Settings → Security**. Changing the vault password also invalidates the stored hint.

The master password itself is never stored in plaintext. The biometric prompt reads:

> **Unlock Perception** — Confirm your identity to open your vault

## Session Storage

Account session tokens (opaque UUIDs) are stored in **Capacitor Preferences** (`kp_session`), which is app-private storage backed by Android SharedPreferences. Sessions have a 7-day TTL and are refreshed automatically.

Note: the session token is not a cryptographic secret (vault key derivation is independent), but it is stored in app-private, OS-protected storage.

## Sync: 30-Second Pull Polling

The Android app syncs with the Cloudflare Worker backend using **pull polling every 30 seconds** while the app is in the foreground. There is no background sync when the app is closed.

**Push flow (local changes):**
1. A change is placed in a durable sync queue.
2. On the next sync tick, the queue is drained: each change is encrypted client-side (AES-256-GCM), then submitted to `POST /sync/changes` as part of a `SyncChangeEnvelope`.
3. The server returns a receipt; on `accepted` the item is removed from the queue.

**Pull flow (remote changes):**
1. On first sync (cursor = 0), `GET /sync/bootstrap` downloads all known objects.
2. On subsequent polls, `GET /sync/changes?after=<cursor>` fetches only new changes since the last cursor.
3. Each encrypted blob is decrypted locally; the result is merged against the local vault using a last-write-wins strategy (by `updatedAt` timestamp).

The sync cursor is persisted in Capacitor Preferences and survives app restarts.

## Editor on Mobile

The mobile editor presents a **bottom toolbar** in place of keyboard shortcuts. All 7 editor modes (plain, markdown, latex, docs, sheets, canvas, editorial) are available. LaTeX mode renders via KaTeX in the WebView (no native compilation engine on Android).

## Navigation

The Android app uses **single-pane navigation with a drawer** — the note list slides in from the left. Workspace surfaces are accessible via a header shortcut.

## Offline Capability

Notes are stored in the local vault (Capacitor Preferences + IndexedDB depending on mode). The app reads and edits notes fully offline. When connectivity returns, pending changes in the sync queue are flushed automatically on the next 30-second tick.

See [offline-capability.md](offline-capability.md) for per-feature details.

## Known Limitations vs. Desktop

| Feature | Android | Desktop |
|---|---|---|
| PDF export | No (HTML export available) | Yes (printToPDF) |
| LaTeX compilation (system engine) | No | Yes |
| Native file system access | Limited (Capacitor filesystem) | Full (Electron dialog) |
| Background sync | No (foreground only) | Not confirmed in source |
| Command palette (Ctrl+K) | No (toolbar instead) | Yes |
