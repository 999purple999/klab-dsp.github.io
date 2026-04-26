---
title: "Using K-Perception in a browser (PWA)"
slug: "web-pwa"
category: "Getting Started"
tags: ["pwa", "browser", "web", "indexeddb", "offline", "chrome", "firefox", "edge"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["web", "windows", "android", "macos"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/lib/browserVault.ts"
  - "src/components/BrowserModeBanner.tsx"
  - "public/manifest.webmanifest"
  - "public/sw.js"
related: ["overview", "install-windows", "install-android", "first-vault", "account-and-login"]
---

# Using K-Perception in a browser (PWA)

## What it is

K-Perception runs as a Progressive Web App (PWA) at `https://app.kperception.app`. A PWA is a web application that behaves like a native app: it can be installed to your home screen or taskbar, run offline, and cache assets so it loads instantly. No installation is required to use the browser version — you can open it in any supported browser and start writing immediately.

The share viewer, which lets you view notes shared via share links, runs at a separate origin: `https://kperception-share.pages.dev`. This separation ensures that the share viewer's origin cannot access your vault's IndexedDB storage or session tokens.

## When to use it

Use the browser version when:

- You are on a computer where you cannot or do not want to install software (a library computer, a colleague's machine)
- You want to quickly access your notes from a device you don't own, using a private/incognito window
- You are on an iOS device (the Capacitor app is Android-only; iOS users use the PWA)
- You are evaluating K-Perception before committing to the native app
- You are a developer and want to test in the browser before building

Do not use the browser version as your primary environment if you need biometric unlock, system file-sharing intent, or the 3-pane desktop shell. Those features require the native apps.

## Step by step

### Open the app

1. Navigate to `https://app.kperception.app` in your browser.
2. If this is your first visit, the vault setup wizard appears. See [Creating your first vault](first-vault.md).
3. If you have an existing account, sign in and the app downloads your encrypted vault key material and begins sync.

### Install as a PWA on Chrome or Edge (desktop)

Installing as a PWA gives you a dedicated window, taskbar icon, and faster launch times.

1. Navigate to `https://app.kperception.app`.
2. In Chrome: click the install icon (monitor with a down arrow) in the address bar, or open the three-dot menu → **Cast, save and share** → **Install page as app**.
3. In Edge: click the install icon in the address bar, or open the three-dot menu → **Apps** → **Install this site as an app**.
4. Click **Install** in the confirmation dialog.
5. K-Perception opens in a standalone window without browser chrome. You can find it in your Start menu (Windows) or Applications folder (macOS).

To uninstall: in Chrome, open the three-dot menu in the PWA window → **Uninstall K-Perception**. In Edge, right-click the taskbar icon → **Uninstall**.

### Install as a PWA on Android (Chrome)

1. Navigate to `https://app.kperception.app` in Chrome.
2. Chrome shows an "Add to Home Screen" banner. Tap **Add**. If the banner does not appear, tap the three-dot menu → **Add to Home screen**.
3. Edit the name if you like, then tap **Add**. The icon appears on your home screen.
4. Tapping the icon opens the PWA in standalone mode (no address bar).

Note: if you have the native K-Perception Android app installed, use that instead. The native app has features the PWA cannot provide (biometric unlock, quick-capture widget, voice recorder, background polling).

### Install on iOS (Safari)

1. Navigate to `https://app.kperception.app` in Safari.
2. Tap the share icon (rectangle with an upward arrow) at the bottom of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top-right corner.
5. The icon appears on your home screen. Tap it to open the PWA.

iOS PWA limitations are described in the Platform differences section below.

## Behaviour and edge cases

### Storage backend: IndexedDB via browserVault.ts

On the native Android app, notes are stored in Capacitor Preferences (a thin wrapper over Android SharedPreferences and the app's private SQLite). On the browser, notes are stored in IndexedDB via `browserVault.ts`. The structure is the same encrypted format; only the storage driver differs.

IndexedDB storage is:
- **Origin-scoped.** Notes stored at `app.kperception.app` are not accessible to any other origin, including the share viewer at `kperception-share.pages.dev`.
- **Clearable by the user.** Going to your browser's site settings and clicking "Clear data" for `app.kperception.app` deletes your local encrypted vault. If you have cloud sync enabled, your data is not lost — resync will restore it. If you are on the Local plan, your data is gone permanently.
- **Not wiped by clearing cookies alone.** IndexedDB is a separate storage mechanism from cookies and localStorage. Only "Clear site data" or a full browser data wipe removes it.
- **Storage quota varies by browser and device.** Chrome and Edge typically allow up to 60% of available disk space. Firefox allows 50% of free disk space up to 2 GB by default. Safari limits each origin to 1 GB.

### BrowserModeBanner

When you use the web app, a banner appears at the top of the screen if you are not using the native app:

> "You are using K-Perception in a browser. Some features are only available in the native app. [Download the app]"

This banner appears only once per session and is dismissed by clicking X. It is informational only; all features available in the browser version continue to work regardless.

### Service worker and offline mode

The PWA registers a service worker (`sw.js`) that caches app assets (HTML, JS, CSS, images). After your first visit, the app shell loads from the cache even with no network connection. However:

- You can read and edit notes that are already downloaded to your local vault.
- Creating new notes offline works; they are queued for sync.
- You cannot log in for the first time offline (authentication requires the server).
- You cannot sync, collaborate, or share while offline.

The service worker updates itself automatically when a new app version is deployed. You may see a "New version available — reload to update" banner. Click it or manually reload the tab.

## Platform differences

| Feature | Windows (native) | Android (native) | Web / PWA |
|---|---|---|---|
| Biometric unlock | No | Yes | No |
| Quick-capture widget | No | Yes | No |
| Voice recorder | No | Yes | No |
| Background sync | Tray agent | 30-second poll | Tab must be open |
| Storage backend | %APPDATA% (SQLite) | App private storage | IndexedDB |
| Offline editing | Yes | Yes | Yes (limited) |
| File-sharing intent | Partial | Yes (PDF) | No |
| 3-pane shell | Yes | Drawer-based | Responsive 2-pane |
| Command palette | Ctrl+K | Long-press | Ctrl+K |
| PWA installable | N/A | Yes (also native APK) | Yes |

### iOS Safari limitations

iOS Safari has several restrictions that affect PWA functionality:

- **No push notifications.** Apple only enabled web push on iOS 16.4+ and only via Add to Home Screen; it is not reliable in-browser.
- **Storage quota is stricter.** Safari on iOS limits each origin to 1 GB and may evict data under storage pressure. Enable iCloud backup for the Safari data to reduce risk, but do not rely on it for your sole copy of important notes. Enable cloud sync if you are on a paid plan.
- **No background sync.** A PWA on iOS does not run in the background. Sync only happens while the app is open.
- **WebAssembly restrictions are fewer since iOS 16.4.** KaTeX and LaTeX rendering work correctly on iOS 16.4+.

## Supported browsers

| Browser | Minimum version | Notes |
|---|---|---|
| Chrome | 100 | Full support |
| Edge | 100 | Full support |
| Firefox | 100 | Full support; IndexedDB quota may differ |
| Safari | 16.4 | Full support; iOS limitations above |
| Samsung Internet | 18 | Full support |
| Brave | 1.40 | Full support |
| Opera | 85 | Full support |

Browsers based on Chromium 100+ generally work. Internet Explorer is not supported.

Features that require specific browser capabilities:

- **WebCrypto API** (AES-256-GCM) — required; all modern browsers support it.
- **WebAssembly** — required for KaTeX/LaTeX rendering; supported in all listed browsers.
- **WebSockets** — required for real-time collaboration; supported in all listed browsers.
- **Notifications API** — required for collaboration mention alerts; not available in all contexts on Safari.

## Plan availability

All plans work in the browser. The Local plan stores notes only in IndexedDB (no server sync). Paid plans sync to the Workers backend as on native apps.

## Permissions and roles

The browser app requests:

| Browser permission | Why |
|---|---|
| Storage (IndexedDB) | Local vault — automatically granted |
| Notifications | Sync and mention alerts — prompted by browser |
| Clipboard read | Paste detection for drag-and-drop and paste-as-image |
| Microphone | Voice notes (if you use the audio recorder) |

No camera, location, or contact access is requested.

## Security implications

- **Session isolation in private/incognito mode.** In incognito mode, IndexedDB is wiped when the window closes. If you create notes in incognito on the Local plan, they are deleted when you close the browser. Use a paid plan and enable sync to preserve them.
- **Browser extensions can read page content.** If you have browser extensions installed (especially clipboard managers, grammar checkers, or screenshot tools), they may be able to read your decrypted note text as it appears on screen. This is a risk common to all web apps and is why the native desktop app is recommended for highly sensitive content.
- **Content Security Policy.** The app sets a strict CSP that disallows inline scripts and restricts `connect-src` to the app's own origin and `*.kperception.app`. This prevents injected scripts in notes from phoning home.
- **The share viewer at kperception-share.pages.dev** is a separate origin with no access to your vault. Share links contain the decryption key in the URL fragment (the part after `#`), which is never sent to the server. Only someone with the full URL can decrypt the shared content.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Clear local vault | Settings → Advanced → Clear local data | Wipes IndexedDB. Irreversible for Local-plan users |
| PWA display mode | Installed via browser | Standalone (no address bar) vs browser tab |
| Notification permission | Browser site settings | Revoke or grant notification access |
| Storage quota | Browser site settings → Usage | Shows IndexedDB usage for the app origin |

## Related articles

- [What is K-Perception?](overview.md)
- [Install on Windows](install-windows.md)
- [Install on Android](install-android.md)
- [Creating your first vault](first-vault.md)
- [Account setup and login](account-and-login.md)

## Source references

- `src/lib/browserVault.ts` — IndexedDB storage driver
- `src/components/BrowserModeBanner.tsx` — browser mode banner component
- `public/manifest.webmanifest` — PWA manifest (icons, display mode, start URL)
- `public/sw.js` — service worker for asset caching and offline support
- `src/lib/shareViewer.ts` — share link URL fragment key extraction
