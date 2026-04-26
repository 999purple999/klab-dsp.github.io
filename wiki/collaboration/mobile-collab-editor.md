---
title: "Mobile collaborative editor"
slug: "mobile-collab-editor"
category: "Collaboration"
tags: ["mobile", "collaboration", "android", "yjs"]
audience: "user"
plan: ["vault", "lifetime", "team", "enterprise"]
platforms: ["android"]
last_reviewed: "2026-04-26"
source_refs:
  - "mobile/src/"
  - "src/renderer/src/collab/CollabShareSession.ts"
related: ["realtime-yjs", "deep-link-routing", "awareness-and-presence"]
---

# Mobile collaborative editor

## What it is

The **MobileCollabEditor** is the Android-optimised collaborative editing experience. It provides full Y.js-backed real-time co-editing with a textarea-based input (simpler and more performant on mobile than TipTap), a presence strip showing connected collaborators, and auto-save every 5 seconds.

## When to use it

- You receive a collaborative share link on your Android device.
- You open a workspace document on Android and another member is online.
- You want to co-edit a note while on the go.

## Step by step

1. Receive a collaborative deep link: `kperception://collab/{id}#keyHex`.
2. On Android, the link opens K-Perception directly (in-app, not browser) via the intent filter.
3. If the vault is locked, you are taken to the unlock screen. The collab link is queued.
4. After unlock, **MobileCollabEditor** opens in full-screen.
5. The editor connects to DocRoom via WebSocket, completes the Y.js sync handshake, and loads the current document state.
6. The presence strip at the top shows connected collaborators as coloured chips.
7. Type to edit — changes are encrypted and sent to DocRoom within milliseconds.
8. Remote changes from other peers appear in your textarea in real time.
9. Press the back button or tap the × to close the collab session.

![MobileCollabEditor full-screen with presence strip](../assets/mobile-collab-editor-1.png)

## CollabShareSession

The **CollabShareSession** (`src/renderer/src/collab/CollabShareSession.ts`) handles the session lifecycle:

1. Parses the deep link URL: extracts `{id}` and `#keyHex`.
2. Imports `keyHex` as a Web Crypto `CryptoKey` (AES-256-GCM).
3. Stores the session state (id + key) in localStorage for reconnect.
4. Connects to DocRoom via y-websocket provider.
5. Provides the key to the Y.js encryption layer.

## Collab pending queue

If a collab deep link arrives while the vault is locked:

- The link is stored in the **collabPending queue** (in-memory, serialised to localStorage).
- The app shows the unlock screen with a "1 collab session waiting" indicator.
- After successful vault unlock, the pending link is dequeued and MobileCollabEditor opens.
- If multiple collab links arrive while locked, only the most recent is queued (earlier ones are dropped). The `collabPending` state is a single string — each new link overwrites the previous one.

## Shared tab in note list

The **Shared** tab in the mobile note list shows all active collab sessions:

- Sessions where you are connected (green dot).
- Sessions you have previously visited but are not currently in (grey dot).
- Tap any session to re-open MobileCollabEditor for that document.

## Behaviour and edge cases

- **Textarea vs TipTap:** MobileCollabEditor uses a plain textarea bound to a `Y.Text` CRDT. This means no rich text formatting on mobile — headings, bold, tables are not rendered or editable on mobile. The content is stored in the shared Y.Doc and renders correctly on desktop.
- **Auto-save:** Every 5 seconds if the document has changed, the local Y.Doc state is saved to Capacitor Preferences as a recovery snapshot.
- **Offline during session:** If the network drops, the editor continues operating locally. Changes are buffered in the Y.Doc and synced on reconnect (see [Reconnect behaviour](reconnect-backoff.md)).
- **Presence on mobile:** The presence strip shows chips for connected peers. Tap a chip to see the display name. Cursor positions from desktop peers are not rendered (textarea does not support caret overlays) — only the chip is shown.
- **Permission enforcement:** If the share link has View-only permission, the textarea is read-only.

## Platform differences

This feature is Android-specific. Desktop and web use TipTap-based collab editing with full rich text.

## Plan availability

Collaborative editing on mobile requires Vault/Lifetime (via share links) or Team/Enterprise (workspace documents).

## Permissions and roles

Same as desktop collab: Edit permission required to type; View permission renders read-only.

## Security implications

Same as the general Y.js collab security model — all updates are AES-256-GCM encrypted before transmission. The mobile editor uses the same key derivation as desktop (from `CollabShareSession`). The session key is stored in localStorage, which is sandboxed to the app on Android.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Auto-save interval | 5 seconds | Not user-configurable |
| Pending collab queue | 1 item max | Not user-configurable |

## Related articles

- [Real-time collaboration with Y.js](realtime-yjs.md)
- [Deep link routing](deep-link-routing.md)
- [Awareness and presence](awareness-and-presence.md)

## Source references

- `mobile/src/` — MobileCollabEditor component
- `src/renderer/src/collab/CollabShareSession.ts` — session management, key import
