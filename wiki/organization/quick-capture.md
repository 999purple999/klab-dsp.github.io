---
title: "Quick capture"
slug: "quick-capture"
category: "Organization"
tags: ["quick-capture", "widget", "deep-link", "mobile"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "mobile/src/App.tsx"
related: ["folders", "tags", "organization/overview", "getting-started/install-android"]
---

# Quick capture

## What it is

Quick capture is a deep-link mechanism that lets you create a new note instantly from outside the app — from an Android home-screen widget, a system shortcut, or a deep link in another application. You tap once and land directly in a blank note, ready to type, with no navigation required.

The deep-link scheme is `com.kperception.app://quick-capture`.

## When to use it

- Capture a thought as soon as it occurs, before it disappears.
- Create a note from a system shortcut during a meeting without unlocking the full app.
- Integrate K-Perception into another workflow via URL scheme (e.g. from a Tasker automation on Android).

## Step by step

### Android home-screen widget

1. Long-press an empty area of your Android home screen and select **Widgets**.
2. Find the **K-Perception** widget (labelled "Quick Note" or "Capture").
3. Drag it to your home screen.
4. Tap the widget at any time — the app opens directly to a new blank note in your default folder.

### Android app shortcut

1. Long-press the K-Perception app icon.
2. A shortcut menu appears with **Quick capture** as an option.
3. Tap **Quick capture** to jump directly into a new note.
4. Optionally drag the shortcut to your home screen as a dedicated icon.

### Deep link from another app

From any Android application that supports URL-scheme links, trigger:

```
com.kperception.app://quick-capture
```

This opens K-Perception and creates a new blank note.

### Desktop (Windows)

A global keyboard shortcut for quick capture is planned [NEEDS-IMPL-DECISION]. Currently, `Ctrl+N` in an open K-Perception window creates a new note.

![Android widget for quick capture](../assets/quick-capture-1.png)

## Behaviour and edge cases

- **Vault unlocked:** If the vault is already unlocked, the new note opens immediately and you can start typing within 1 second.
- **Vault locked:** If the vault is locked when the quick-capture link is triggered, the link is queued (stored in memory by the Capacitor App plugin). The app opens to the unlock screen. After you unlock, the queued capture is processed and the new note is created. You do not lose the intent.
- **Default placement:** The new note is created in the last-active folder (or the root if no folder has been visited). There is currently no way to configure the default quick-capture destination from outside the app.
- **Pre-filled content:** The deep link does not currently support passing content as a parameter (e.g. a pre-filled title or body). The note is always blank.
- **Multiple queued captures:** Based on the current source (`mobile/src/App.tsx`), the quick-capture intent is only acted upon when the vault is already unlocked (`if (!locked) setQuickCaptureOpen(true)`). When the vault is locked, the intent is not queued — it is silently ignored. The note is not created until the next explicit quick-capture trigger after unlock.
- **Editor mode:** The new note opens in your previously chosen default editor mode.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Home-screen widget | No | Yes | No |
| App shortcut | No | Yes | No |
| Deep link scheme | Planned [NEEDS-IMPL-DECISION] | `com.kperception.app://quick-capture` | N/A |
| Keyboard shortcut for new note | `Ctrl+N` (in-app) | N/A | `Ctrl+N` (in-app) |

## Plan availability

Quick capture is available on all plans, including the free Local plan.

## Permissions and roles

No permission restrictions. The note is created in the user's personal vault.

## Security implications

The deep-link scheme `com.kperception.app://quick-capture` can be triggered by any app on the Android device. The scheme carries no content parameter, so there is no data injection risk. If the vault is locked, no vault content is exposed to the calling app.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Default capture folder | Last active folder | Not configurable |
| Default editor mode | Last used mode | Settings → Editor |

## Related articles

- [Folders](folders.md)
- [Tags](tags.md)
- [Install on Android](../getting-started/install-android.md)

## Source references

- `mobile/src/App.tsx` — Capacitor App plugin URL listener for quick-capture intent
