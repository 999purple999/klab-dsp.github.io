---
title: "Real-time collaboration with Y.js CRDT"
slug: "realtime-yjs"
category: "Collaboration"
tags: ["collaboration", "yjs", "crdt", "realtime", "e2ee"]
audience: "user"
plan: ["vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/collab/CollabDoc.ts"
  - "private-sync-worker/src/docRoom.ts"
related: ["docroom-protocol", "awareness-and-presence", "reconnect-backoff", "version-snapshots"]
---

# Real-time collaboration with Y.js CRDT

## What it is

K-Perception uses **Y.js** (version 13.6.30) for real-time collaborative editing. Y.js implements Conflict-free Replicated Data Types (CRDTs) — a mathematical framework that guarantees any two peers can independently apply edits and converge to the same document state, without any coordination round-trip or last-write-wins data loss.

Every Y.js binary update is encrypted with AES-256-GCM before transmission. The Cloudflare Durable Object relay (DocRoom) sees only encrypted binary blobs and re-broadcasts them to peers. The server is mathematically excluded from the document content.

## When to use it

- Two or more people need to edit the same note simultaneously.
- You want to review changes made by a colleague in near-real-time.
- You are using the share viewer with Edit permission.
- You are working in a workspace channel document (Team/Enterprise).

## How it works

### Update flow

```
User edits note
    ↓
Y.Doc: local Y.js CRDT update generated
    ↓
encryptUpdate(update, key) — AES-256-GCM, random 12-byte IV
    ↓
IV (12 bytes) ∥ ciphertext ──► WebSocket ──► DocRoom Durable Object
                                                    ↓
                                    Blind relay: re-broadcasts to all connected peers
                                                    ↓
                              Peer receives: IV ∥ ciphertext
                                    ↓
                              decryptUpdate(bytes, key) → Y.js binary update
                                    ↓
                              Y.applyUpdate(ydoc, update, 'remote')
                                    ↓
                              Document renders merged state
```

### Key used for encryption

| Context | Key |
|---|---|
| Personal share link collab | Share link `keyHex` (AES-256, from URL fragment) |
| Workspace document collab | SK_section-derived key for the document's section |

The key is known only to clients. The DocRoom never possesses the key.

### Y.Doc structure per editor mode

| Mode | Y.js type |
|---|---|
| Plain text | `Y.Text` — single text value |
| Markdown | `Y.Text` — Markdown source |
| Docs (TipTap) | `Y.XmlFragment` — ProseMirror document tree |
| Editorial | `Y.XmlFragment` — TipTap document tree |
| LaTeX | `Y.Text` — LaTeX source |
| Sheets | `Y.Map` — cell grid state |

## Step by step

1. Open a note that has been shared with Edit permission, or open a workspace document.
2. The Y.js WebSocket provider connects to DocRoom at `wss://{worker}/collab/doc/{docId}/ws`.
3. A sync handshake occurs: your client sends its state vector (`sync_step1`), the server echoes the current document state back (`sync_step2`), and you apply any updates you missed.
4. You and other collaborators see each other's cursors in the presence strip.
5. As you type, Y.js generates binary updates. They are encrypted and sent over the WebSocket within milliseconds.
6. Other clients receive and apply the updates — the document converges in real time.

## Behaviour and edge cases

- **Concurrent edits:** If two users type in the same paragraph at the same time, Y.js merges the changes algorithmically. Both users' text is preserved — nothing is discarded.
- **Disconnected edit:** If your WebSocket drops, Y.js buffers your local changes. On reconnect, a state vector exchange recovers all missed updates from the server's stored state.
- **Conflict-free deletions:** Deleting a character that another user simultaneously typed preserves the typed character (CRDT invariant: inserts beat concurrent deletes at the same position [NEEDS-VERIFY specific behaviour]).
- **Large documents:** Y.js binary encoding is compact. Documents up to ~1 MB (text equivalent) perform well. Very large documents may have slower update serialisation.
- **Undo/Redo:** Each user has their own undo stack. Undoing a change undoes YOUR changes only — it does not revert another user's concurrent edits.
- **Awareness vs content:** Awareness messages (cursor positions, presence) are plaintext. Document content updates are encrypted. This is intentional: cursor positions carry no sensitive information, and encrypting them would require key distribution to third-party presence-only viewers.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Editor binding | TipTap + Y.js | MobileCollabEditor (textarea) | TipTap + Y.js |
| Presence strip | Full avatar chips | Simplified strip | Full avatar chips |
| Cursor position sync | Full (TipTap ProseMirror positions) | Character offset only | Full |
| Undo stack | Per-user, rich history | Per-user, basic | Per-user, rich history |

## Plan availability

| Plan | Collab access |
|---|---|
| Local | No |
| Guardian | Via share links (Edit permission) |
| Vault / Lifetime | Full collab via share links |
| Team / Enterprise | Full collab in workspace documents |

## Permissions and roles

- Share link with **Edit** permission: full collab access.
- Share link with **View** or **Comment**: no Y.js editing.
- Workspace member with **Edit** on the document section: full collab access.

## Security implications

The DocRoom Durable Object receives only AES-256-GCM ciphertext. A server-side attacker who compromises the Worker can see:

- That a WebSocket connection was established between N clients for docId X.
- The size of each update (reveals relative edit sizes, not content).
- The timing of edits (reveals when editing occurred).
- Nothing else — the content is completely opaque.

Awareness data (cursor positions, user names) is transmitted as plaintext within the WebSocket, within the same encrypted TLS connection. An operator-level attacker with access to the Worker logs can see cursor positions and display names but not document content.

## Settings reference

There are no user-configurable settings for Y.js CRDT. The connection is automatic when opening a collab document.

## Related articles

- [DocRoom protocol](docroom-protocol.md)
- [Awareness and presence](awareness-and-presence.md)
- [Reconnect behaviour](reconnect-backoff.md)
- [Version snapshots](version-snapshots.md)

## Source references

- `src/renderer/src/collab/CollabDoc.ts` — Y.js client, WebSocket provider, encrypt/decrypt
- `private-sync-worker/src/docRoom.ts` — DocRoom Durable Object (blind relay)
