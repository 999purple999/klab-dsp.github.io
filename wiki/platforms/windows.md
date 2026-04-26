---
title: "Windows Desktop"
slug: "windows"
category: "Platforms"
tags: ["windows", "desktop", "electron", "installation", "ipc", "safeStorage"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows"]
last_reviewed: "2026-04-26"
source_refs:
  - src/main/index.ts
  - src/main/auth.ts
  - package.json
related: ["platform-overview", "cross-platform-sync", "offline-capability"]
---

# Windows Desktop

K-Perception for Windows is built on **Electron 28** and distributed as a signed NSIS installer (`.exe`, x64). It delivers a full-featured experience including native PDF export, LaTeX compilation, the IPC CORS bypass, and OS-protected session storage.

## System Requirements

- Windows 10 (64-bit) or later
- 4 GB RAM minimum (8 GB recommended for LaTeX compilation)
- ~200 MB disk space for the application
- Internet connection required for cloud sync and collaboration (offline reading and editing work without it)

## Installation

See [install-windows.md](../getting-started/install-windows.md) for the full setup walkthrough.

In brief:
1. Download `K-Perception-Setup-x.x.x.exe` from the releases page.
2. Run the installer and follow the prompts.
3. Launch K-Perception from the Start menu or desktop shortcut.
4. On first launch, create your vault password. This password derives your encryption key via Argon2id — it is never sent to the server.

## Vault and Key Storage

### Vault file
The encrypted vault is stored at `%APPDATA%\K-Perception\vault.enc`. It is a JSON envelope containing an Argon2id KDF descriptor, a random salt, an AES-GCM IV, and the AES-256-GCM ciphertext of your notes.

Automatic local backups (up to 5, timestamped) are kept in `%APPDATA%\K-Perception\backups\`. These are also ciphertext — they require your vault password to restore.

### Session (JWT) storage
After signing in to a K-Perception account, the session token is persisted to `%APPDATA%\K-Perception\session.enc`. This file is encrypted with **Electron `safeStorage`**, which delegates to the Windows Data Protection API (DPAPI). The session blob is bound to the OS user account and cannot be decrypted on another machine.

## IPC Bridge (CORS Bypass)

On Windows (and all Electron builds) the renderer runs in a Chromium sandbox. Because the renderer origin (`file://` or `http://localhost:5173`) is cross-origin with the Cloudflare Worker, CORS preflights can stall due to Chromium's preflight cache.

K-Perception routes all backend requests through the **Electron main process** via `window.kpWorker.fetch` → `ipcMain` → `net.fetch`. The `net` module bypasses web-platform CORS rules entirely. Only the following hostnames are accepted by the proxy:

- `k-perception-backend.accessisoftwarefrancesco.workers.dev`
- `app.kperception.com`

Any other target is rejected with `host_not_allowed`.

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Command palette | Ctrl+K |
| Toggle DevTools | F12 or Ctrl+Shift+I |

## PDF Export

PDF export uses Electron's `printToPDF` API. The renderer builds the full HTML (including embedded CSS and KaTeX-rendered math), passes it to the main process, which:
1. Writes a temp `.html` file.
2. Loads it in a hidden `BrowserWindow`.
3. Waits for `document.fonts.ready` and an 800 ms KaTeX settle guard.
4. Calls `printToPDF` with `preferCSSPageSize: true` and zero margins (respects the document's `@page` declaration).
5. Writes the PDF to the user-chosen path and cleans up the temp file.

HTML export is also available and opens a Save dialog immediately.

## LaTeX Compilation

K-Perception detects installed LaTeX engines (`pdflatex`, `xelatex`, `lualatex`) on first use via `latex:detect`. Compilation runs up to 3 passes (including an optional BibTeX pass for bibliographies). The engine is invoked with `-no-shell-escape` to block `\write18` shell-escape injection.

You must install a TeX distribution (MiKTeX or TeX Live) separately; K-Perception does not bundle a LaTeX runtime.

## Deep Links

K-Perception registers itself as the default handler for the `kperception://` URI scheme on Windows. Deep links arriving via the command line while a window is open are forwarded to the renderer. If the app is not running, it is launched first and the link is queued.

Supported deep-link patterns:
- `kperception://ws-share/:linkId#shareKeyHex` — workspace file share
- `kperception://share/:shareId#keyHex` — home note share
- `kperception://collab/:shareId#keyHex` — home note collaboration

## Auto-Update

Auto-update checks run on launch and every 6 hours while the app is open. Updates download in the background and are applied on next restart. This behavior may vary by build; verify with your deployment.

## Security Hardening

- **Context isolation:** The renderer is `contextIsolation: true`, `nodeIntegration: false`.
- **Sandbox:** The main app window runs with `sandbox: false` (required for the vault IPC handlers); the share viewer window uses `sandbox: true`.
- **Navigation guard:** `will-navigate` is intercepted; any navigation to an external origin is redirected to the system browser via `shell.openExternal`.
- **Window open handler:** New windows opened by renderer content are denied and sent to the system browser.
- **SPKI cert pinning:** The main process installs SPKI certificate pinning on the default Chromium session, checked on every TLS handshake to K-Perception backend domains.
- **Scheme allowlist:** `shell:openExternal` accepts only `http:`, `https:`, and `mailto:` schemes.

## Close Behavior

When the window is closed, K-Perception sends `app:will-close` to the renderer, which flushes any pending vault writes before confirming `app:flush-done`. If the renderer does not respond within 3 seconds, the window is force-closed.
