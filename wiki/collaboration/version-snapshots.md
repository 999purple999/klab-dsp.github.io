---
title: "Version snapshots in collaboration"
slug: "version-snapshots"
category: "Collaboration"
tags: ["snapshots", "versions", "collaboration", "history"]
audience: "user"
plan: ["vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/docRoom.ts"
  - "share-page/"
related: ["realtime-yjs", "docroom-protocol", "editors/revision-history"]
---

# Version snapshots in collaboration

## What it is

DocRoom automatically saves a ciphertext snapshot of the collaborative document to Cloudflare R2 every 2 minutes if the document has changed. Snapshots capture the full Y.js document state at a point in time, encrypted with the same key as the live document. In the share viewer's collab page, you can browse and restore any snapshot.

Snapshots are distinct from per-note revision history (which applies to personal notes saved via the sync queue). Collaboration snapshots are managed by DocRoom and are only accessible via the collab viewer.

## When to use it

- You want to see what the document looked like 30 minutes ago.
- A collaborator made a change you want to undo without losing other concurrent changes.
- You want to restore a document to a specific point in a review session.

## Step by step

### Browsing snapshots (share viewer collab page)

1. Open the collaborative share link in a browser.
2. In the collab viewer (`kperception-share.pages.dev/collab/`), click the **History** icon (clock) in the top-right toolbar.
3. A timeline panel slides out showing all snapshots in reverse chronological order, with timestamps.
4. Click a snapshot to preview the document at that moment (read-only overlay).
5. To restore: click **Restore this snapshot** in the preview overlay.
6. The document is restored to that snapshot state. All connected clients receive the restored state as a Y.js update.

### Browsing snapshots (workspace document — desktop/web)

In a workspace collaborative document, the snapshot timeline is accessible from the document's revision history panel (same as for personal notes). Collab snapshots appear with a "collaboration" badge distinguishing them from manual saves.

## How snapshots work

Every 2 minutes, if the DocRoom DO detects that the document has changed since the last snapshot:

1. DocRoom calls `Y.encodeStateAsUpdate(ydoc)` to capture the full document state as a Y.js binary.
2. The binary state is **already encrypted** (DocRoom stores it encrypted — it never decrypts anything).
3. The snapshot is stored in R2 at: `collab/{docId}/snapshots/{unix_timestamp_ms}.enc`.
4. The snapshot metadata (timestamp, size) is stored in DO storage.

```
R2 path: collab/{docId}/snapshots/1745625600000.enc
Content: [12-byte IV][AES-256-GCM ciphertext of Y.js state update]
```

## Behaviour and edge cases

- **Snapshot interval:** Exactly 2 minutes, triggered only if changes have occurred.
- **Maximum snapshots retained:** No hard retention limit is confirmed in the current source. Contact support for confirmation of any pruning policy.
- **Snapshot on explicit save:** Whether pressing `Ctrl+S` triggers an immediate snapshot is not confirmed in the current source. Contact support for confirmation.
- **DocRoom eviction:** If DocRoom is evicted between snapshot writes, the next reconnect triggers an immediate snapshot.
- **Restoration and concurrent editors:** Restoring a snapshot sends a Y.js update to all connected clients. Concurrent unsaved changes are merged with the restored state (Y.js CRDT semantics). This may produce unexpected merges — consider coordinating with other editors before restoring.
- **Personal share links:** Snapshots are taken for all collab sessions, including personal share links with Edit permission.
- **Undo/Redo stack:** The share viewer's Undo/Redo applies to the current session only. After a snapshot restore, the Undo stack resets.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Snapshot browsing | Revision panel | Not confirmed — contact support for confirmation | Share viewer timeline |
| Snapshot restore | Via revision panel | Not confirmed — contact support for confirmation | Via share viewer |
| Snapshot creation | Automatic (by DocRoom) | Automatic | Automatic |

## Plan availability

Collaboration snapshots are available wherever real-time collaboration is enabled (Vault/Lifetime for share links, Team/Enterprise for workspace docs).

## Permissions and roles

- **Edit** permission on the share link or workspace document: can restore snapshots.
- **View** permission: can browse (preview) snapshots but not restore.

## Security implications

Snapshots are stored as AES-256-GCM ciphertext (same key as the live document). The server cannot read snapshot content. Restoring a snapshot is a decrypted-then-re-encrypted operation that happens on the client — the plaintext is never sent to DocRoom.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Snapshot interval | 2 minutes | Not user-configurable |
| Snapshot retention | Not confirmed in current source | Not user-configurable |

## Related articles

- [Real-time collaboration with Y.js](realtime-yjs.md)
- [DocRoom protocol](docroom-protocol.md)
- [Revision history](../editors/revision-history.md)

## Source references

- `private-sync-worker/src/docRoom.ts` — snapshot write logic
- `share-page/collab.html` — snapshot browser UI in share viewer
