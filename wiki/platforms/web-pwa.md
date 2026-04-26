---
title: "Web PWA"
slug: "web-pwa"
category: "Platforms"
tags: ["web", "pwa", "browser", "indexeddb", "localstorage", "offline"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/renderer/src/platform/browserVault.ts
  - src/renderer/src/platform/webAuth.ts
related: ["platform-overview", "cross-platform-sync", "offline-capability"]
---

# Web PWA

K-Perception is available as a **Progressive Web App (PWA)** at `app.kperception.com`. It runs entirely in the browser — no installation required — and can be installed to your home screen or taskbar for an app-like experience.

## Installing as a PWA

### Desktop browsers (Chrome, Edge, Brave)
1. Open `app.kperception.com` in your browser.
2. Click the install icon in the address bar (or open the browser menu and choose "Install K-Perception").
3. Confirm the prompt. K-Perception opens as a standalone window without browser chrome.

### Android Chrome
1. Open `app.kperception.com`.
2. Tap the "Add to Home Screen" prompt at the bottom of the screen, or use the browser menu → "Add to Home Screen".
3. The icon appears on your home screen and launches like a native app.

### Safari (iOS/macOS)
PWA installability and full functionality on Safari/iOS may vary. This behavior may vary by platform; verify with your deployment or contact support@kperception.com.

## Vault Storage

In web/browser mode, the vault is stored in **IndexedDB** under the database `k-perception`, object store `vault`. The ciphertext format is identical to the desktop vault (`vault.enc`): an Argon2id KDF descriptor, random salt, AES-GCM IV, and AES-256-GCM ciphertext. Up to 5 rotating local backups are also stored in IndexedDB.

The vault key is held **in memory only** for the duration of the session. Closing or refreshing the tab locks the vault; the key is never written to IndexedDB or localStorage.

**Limitation:** IndexedDB is accessible to same-origin JavaScript. The cryptographic protection is the same as on desktop (AES-256-GCM), but the storage layer is not OS-protected the way Electron's `userData` directory is.

## Session Storage

After signing in to a K-Perception account, the session token is stored in **`localStorage`** under the key `kp_web_session`. Sessions have a 7-day TTL and are refreshed automatically within the last day of their lifetime.

During the Google OAuth redirect flow, transient PKCE state is stored in **`sessionStorage`** (key `kp_web_pkce_state`). This is automatically cleaned up when the callback completes.

Important: `localStorage` persists across browser restarts until you sign out or clear browser data. The session token is an opaque UUID — not a vault key — so exposure of the token does not compromise encrypted note content.

## Offline Support

- **Reading and editing notes:** Fully available offline. Notes are read from and written to IndexedDB.
- **Sync push/pull:** Requires a network connection.
- **Real-time collaboration:** Requires a network connection (WebSocket).
- **Share links:** Require a network connection to load.

Pending sync changes accumulate in the sync queue while offline and are flushed when connectivity returns.

## Sync Behavior

The web app syncs on demand (when the tab is active and the app is in focus). **The tab must remain open for sync to run.** There is no background sync when the tab is closed, unlike native apps.

## PDF Export

PDF export is **not available** in the web app. The browser vault returns an error:

> "PDF export requires the desktop app. Use HTML export and print from your browser instead."

HTML export works in all browsers via a `<a download>` blob URL. You can then use the browser's built-in Print → Save as PDF to produce a PDF, though page geometry may differ from the desktop export.

## LaTeX Compilation

Native LaTeX compilation (pdflatex/xelatex/lualatex) is **not available** in the web app — there is no system process host. KaTeX is used for inline math rendering in Markdown and LaTeX preview modes.

## Responsive Layout

The web PWA uses a **2-pane responsive layout** — sidebar/note-list on the left, editor on the right. On narrow viewports the sidebar collapses to a drawer.

## Incognito / Private Browsing Considerations

- `localStorage` and `IndexedDB` are scoped to the incognito session and deleted when the window is closed.
- The vault and session will not persist between incognito sessions.
- Use incognito mode when you want zero browser-level trace of the session but accept that your vault will not survive a tab close.

## Feature Differences vs. Desktop

| Feature | Web PWA | Desktop |
|---|---|---|
| Vault storage | IndexedDB | OS filesystem (`userData`) |
| Session storage | localStorage | Electron safeStorage (DPAPI/Keychain) |
| PDF export | No | Yes |
| LaTeX compilation | No | Yes |
| Background sync | No (tab must stay open) | Not confirmed in source |
| Biometric unlock | No | No |
| Deep links (kperception://) | No | Yes |
| Native file-open dialog | No (browser `<input type=file>`) | Yes (Electron dialog) |
| IPC CORS bypass | No (direct fetch) | Yes (net.fetch via main process) |
