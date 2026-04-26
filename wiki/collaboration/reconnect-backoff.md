---
title: "Reconnect behaviour and backoff"
slug: "reconnect-backoff"
category: "Collaboration"
tags: ["reconnect", "backoff", "websocket", "resilience"]
audience: "user"
plan: ["vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/collab/CollabDoc.ts"
related: ["realtime-yjs", "docroom-protocol", "awareness-and-presence"]
---

# Reconnect behaviour and backoff

## What it is

When a collaborative WebSocket connection drops — due to network interruption, device sleep, server restart, or idle timeout — K-Perception automatically attempts to reconnect using exponential backoff. During the disconnected period, your local edits are preserved in the Y.js document and applied to the server state on reconnect.

## When to use it

This is automatic. You experience it when:

- Your network drops briefly while collaborating.
- You put your laptop to sleep and reopen it.
- The Cloudflare Worker is redeployed (brief disruption possible).
- Your mobile app goes to the background and returns to the foreground.

## Backoff schedule

| Attempt | Wait before retry |
|---|---|
| 1st | 1 second |
| 2nd | 2 seconds |
| 3rd | 4 seconds |
| 4th | 8 seconds |
| 5th | 16 seconds |
| 6th+ | 30 seconds (cap) |

## Step by step — what happens on disconnect

1. WebSocket connection closes (network error, timeout, or server close).
2. K-Perception shows a **"Reconnecting…"** indicator in the editor toolbar (orange).
3. The Y.js document continues operating locally — you can keep typing. All changes are buffered in the `Y.Doc`.
4. After the backoff wait, a new WebSocket connection is attempted.
5. On successful reconnect: authentication is re-validated. A `sync_step1` (state vector) is sent to DocRoom.
6. DocRoom responds with `sync_step2` (all updates you missed while disconnected, as encrypted blobs).
7. Your buffered local changes are sent as updates to DocRoom.
8. Both your offline changes and any remote changes you missed are merged by Y.js — no data loss.
9. The **"Reconnecting…"** indicator disappears. Presence strip repopulates.

## Behaviour and edge cases

- **No data loss:** Y.js CRDT guarantees that all local changes made while disconnected are merged on reconnect. You never lose work due to a disconnect.
- **DocRoom eviction:** If DocRoom was evicted (very long disconnect, e.g. days), the DO has no stored state. In this case, the first client to reconnect re-seeds the document from their local Y.js state. Subsequent clients sync from that first client via DocRoom.
- **Authentication expiry:** If the session token expires during a long disconnect, the reconnect attempt returns HTTP 401. K-Perception shows a "Session expired — please log in" message and stops retrying.
- **Maximum retries:** After 10 failed attempts (approximately 5 minutes of attempting with backoff), reconnection stops. A "Connection lost — tap to retry" message is shown. Tap/click it to manually trigger a reconnect.
- **Mobile backgrounding:** When the K-Perception Android app goes to the background, the WebSocket is closed by the OS. On foreground return, the full reconnect sequence runs.
- **Share link expiry:** If the share link expires during a collab session, the reconnect attempt will fail with a 404/410 error. The session ends.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Reconnect trigger | Automatic | Automatic + foreground return | Automatic + page visibility change |
| Visual indicator | Toolbar banner (orange) | Header status dot | Toolbar banner |
| Session expiry on disconnect | Re-auth prompted | Re-auth prompted | Re-auth prompted |
| Manual retry | Click banner | Tap dot | Click banner |

## Plan availability

Reconnect logic applies wherever real-time collaboration is available (Vault+, Team+, Enterprise).

## Permissions and roles

No special permissions required for reconnect. Authentication is re-validated on each reconnect.

## Security implications

On reconnect, the WebSocket handshake re-authenticates with the session token or share token. The Y.js sync handshake exchanges encrypted state vectors — DocRoom never sees plaintext. The reconnect sequence does not change or expose any encryption keys.

## Settings reference

There are no user-configurable reconnect settings. The backoff schedule is fixed.

## Related articles

- [Real-time collaboration with Y.js](realtime-yjs.md)
- [DocRoom protocol](docroom-protocol.md)
- [Awareness and presence](awareness-and-presence.md)

## Source references

- `src/renderer/src/collab/CollabDoc.ts` — reconnect loop, backoff schedule, state restoration
