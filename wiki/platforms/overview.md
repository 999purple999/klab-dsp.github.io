---
title: "Platform Overview"
slug: "platform-overview"
category: "Platforms"
tags: ["platforms", "desktop", "mobile", "web", "pwa", "electron", "capacitor"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "macos", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/main/index.ts
  - capacitor.config.ts
  - package.json
  - mobile/src/platform/biometricAdapter.ts
related: ["windows", "android", "web-pwa", "cross-platform-sync"]
---

# Platform Overview

K-Perception runs on three platform families. All of them share the same cryptographic core (Argon2id key derivation, AES-256-GCM encryption), the same 7 editor modes, and the same Cloudflare Worker sync backend. Your encrypted notes look identical to the server regardless of which platform wrote them.

## Supported Platforms

| Platform | Technology | Distribution |
|---|---|---|
| Windows desktop | Electron 28, NSIS installer | Direct download (.exe) |
| macOS desktop | Electron 28, DMG | Direct download (.dmg) — x64 + Apple Silicon (arm64) |
| Linux desktop | Electron 28, AppImage | Direct download (.AppImage) |
| Android mobile | Capacitor 6 | APK sideload or Play Store |
| Web / PWA | React 18 + Vite, installable | Browser at app.kperception.com |

## Feature Matrix

| Feature | Windows | macOS | Linux | Android | Web PWA |
|---|---|---|---|---|---|
| All 7 editor modes | Yes | Yes | Yes | Yes | Yes |
| Vault encryption (AES-256-GCM) | Yes | Yes | Yes | Yes | Yes |
| Argon2id KDF | Yes | Yes | Yes | Yes | Yes |
| Cloud sync | Yes | Yes | Yes | Yes | Yes |
| Offline read/edit | Yes | Yes | Yes | Yes | Yes |
| Background sync | Not confirmed (no tray agent in source) | Not confirmed | Not confirmed | 30s poll (foreground) | No — tab must be open |
| JWT/session storage | Electron safeStorage (OS keychain) | Electron safeStorage (OS keychain) | Electron safeStorage (OS keychain) | Capacitor Preferences | localStorage (7-day TTL) |
| Biometric unlock | No | No | No | Yes (fingerprint/face) | No |
| PDF export (native) | Yes (printToPDF) | Yes (printToPDF) | Yes (printToPDF) | No | No |
| LaTeX compilation | Yes (pdflatex/xelatex/lualatex) | Yes | Yes | No | No |
| IPC CORS bypass | Yes (net.fetch in main process) | Yes | Yes | N/A | N/A |
| Deep links (kperception://) | Yes | Yes | Yes | Supported (via intent filter) | No |
| KPX import/export | Yes | Yes | Yes | Yes | Yes |
| Real-time collaboration | Yes (Vault+) | Yes (Vault+) | Yes (Vault+) | Yes (Vault+) | Yes (Vault+) |
| Workspace access | Yes (Guardian+) | Yes (Guardian+) | Yes (Guardian+) | Yes (Guardian+) | Yes (Guardian+) |

## Shared Cryptographic Core

All platforms derive vault keys identically: Argon2id with m=19456 KiB, t=2, p=1, producing a 32-byte AES-256-GCM key. The sync wire format uses the same envelope across all platforms (`enc2:` or `ndk1:` prefix), so an encrypted blob written on Android can be decrypted on Windows and vice versa. The server stores only opaque ciphertext and never participates in key derivation.

## Local vs. Cloud Sync

The **Local plan** (free) stores the vault on-device only. No ciphertext ever leaves the device. Cloud sync activates from the **Guardian plan** upward.

## Navigation Model by Platform

- **Desktop (all):** 3-pane shell — sidebar / note list / editor. Command palette on Ctrl+K (Windows/Linux) or Cmd+K (macOS).
- **Android:** Single-pane with drawer navigation. Bottom toolbar replaces keyboard shortcuts.
- **Web PWA:** Responsive 2-pane layout. Installable from the browser's "Add to home screen" / install prompt.
