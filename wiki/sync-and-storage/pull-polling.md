---
title: "Pull sync and polling"
slug: "pull-polling"
category: "Sync & Storage"
tags: ["sync", "polling", "pull", "realtime"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "mobile/src/App.tsx"
  - "src/renderer/src/hooks/useWorkerSync.ts"
  - "private-sync-worker/src/realtime.ts"
related: ["sync-queue", "offline-first", "cross-device", "merge-conflicts"]
---

# Pull sync and polling

## What it is

Pull sync is the mechanism by which K-Perception fetches changes made on other devices and applies them to the local vault. There are two implementations: a **polling** model (Android and web) where the app periodically asks the server for new objects, and a **push notification** model (desktop) where the NamespaceHub Durable Object notifies the desktop client as soon as a new change is available.

## When to use it

Pull sync is automatic and always active when you are signed in with a cloud-sync plan (Guardian+). You benefit from it whenever you work across multiple devices or share documents collaboratively.

## How pull sync works

### Desktop (push-based)

The desktop client maintains a WebSocket connection to the **NamespaceHub** Durable Object (`private-sync-worker/src/realtime.ts`). When another device pushes a change, the Worker emits an event to the NamespaceHub, which forwards it to all connected desktop clients for that namespace. The desktop client then fetches the new object immediately — real-time, with no polling delay.

### Android and web (poll-based)

The app polls the Worker every **30 seconds** while the vault is unlocked (`mobile/src/App.tsx`, Capacitor Network plugin). Each poll sends the current `sync_cursor` (the highest `canonical_seq` the client has processed) to `GET /sync/bootstrap?after={cursor}`. The Worker returns all objects with `seq > cursor` (metadata + blob references). The client downloads the blobs from R2 and applies the changes to the local store.

```
Poll cycle (mobile):
every 30 seconds while unlocked:
    GET /sync/bootstrap?after={last_cursor}
    ← [{object_type, object_id, canonical_seq, tombstone, r2_key}, …]
    for each object:
        GET /sync/blob/{r2_key}  ← encrypted blob
        decrypt blob → apply to local store
        update last_cursor
```

## Step by step

No manual action is required. When you observe that changes from another device have not appeared:

1. Open the health screen — it shows "Last synced: X minutes ago".
2. On Android, pull to refresh in the note list triggers an immediate poll.
3. On desktop, `Ctrl+S` in any note triggers both a push drain and a pull fetch.

## Behaviour and edge cases

- **Cursor-based incremental sync:** The `sync_cursor` ensures only genuinely new objects are returned on each poll. There is no full re-download on each poll cycle — only the delta since the cursor.
- **Network off:** If the network is unavailable, the poll fails silently (no error shown, no retry storm). The next poll attempt happens at the next 30-second tick when connectivity is restored.
- **App backgrounded (Android):** When K-Perception goes to the background on Android, the 30-second polling interval pauses. It resumes when the app comes to the foreground.
- **Large delta:** If many changes accumulated (e.g. after a long offline period), the bootstrap response may be large. The client processes it in chunks to avoid blocking the UI.
- **Tombstones:** Deleted objects are returned as tombstone entries (tombstone=1). The client marks them deleted in the local store.
- **Workspace objects:** Workspace documents and files have their own namespace and sync path. They are fetched via the workspace sync route, not the personal sync route.
- **Conflict on pull:** If a pulled object has the same `object_id` as a locally modified but unsynced object, a conflict is triggered. See [Merge conflicts](merge-conflicts.md).

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Pull mechanism | WebSocket push (NamespaceHub) | 30s polling | 30s polling |
| Latency (update received) | < 1 second | Up to 30 seconds | Up to 30 seconds |
| Manual trigger | `Ctrl+S` in editor | Pull-to-refresh | `Ctrl+S` in editor |
| Polling paused when | App minimised / focus lost | App backgrounded | Tab hidden |

## Plan availability

Pull sync requires Guardian or higher. The Local plan has no pull sync (no cloud).

## Permissions and roles

Pull sync fetches only objects in the user's own namespace (personal notes) or workspace namespaces the user is a member of.

## Security implications

The pull endpoint returns encrypted blob references and metadata. The server never returns plaintext. Blob downloads (`GET /sync/blob/{key}`) retrieve ciphertext from R2. Decryption happens on-device using the vault key or the workspace section key. The `sync_cursor` (a monotonic integer) is not sensitive — it reveals only the number of sync operations, not their content.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Polling interval (mobile/web) | 30 seconds | Not user-configurable |
| Sync enabled | Yes (if signed in) | Account settings → Sync |
| Last sync timestamp | Displayed in health screen | Health screen |

## Related articles

- [Sync queue](sync-queue.md)
- [Offline-first architecture](offline-first.md)
- [Cross-device sync](cross-device.md)
- [Merge conflicts](merge-conflicts.md)

## Source references

- `mobile/src/App.tsx` — 30-second poll timer
- `src/renderer/src/hooks/useWorkerSync.ts` — desktop sync hook
- `private-sync-worker/src/realtime.ts` — NamespaceHub DO (push notifications for desktop)
- `private-sync-worker/src/sync.ts` — `GET /sync/bootstrap` route handler
