---
title: "DocRoom protocol"
slug: "docroom-protocol"
category: "Collaboration"
tags: ["docroom", "protocol", "websocket", "durable-objects"]
audience: "developer"
plan: ["vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/docRoom.ts"
  - "src/renderer/src/collab/CollabDoc.ts"
related: ["realtime-yjs", "awareness-and-presence", "reconnect-backoff", "version-snapshots"]
---

# DocRoom protocol

## What it is

DocRoom is a Cloudflare Durable Object — stateful compute that runs at the edge. One DocRoom instance exists per collaborative document. It acts as a **blind relay**: it receives encrypted WebSocket messages from clients and rebroadcasts them to all other connected clients. It also stores the latest known encrypted document state so new joiners can bootstrap the document without requiring another peer to be online.

## Lifecycle

```
First client connects
    ↓
Durable Object is created (or woken from hibernation)
    ↓
Client sends sync_step1 (state vector)
    ↓
DocRoom responds with sync_step2 (full document state, if stored)
    ↓
[Additional clients connect, same sync handshake]
    ↓
Clients exchange updates via DocRoom relay
    ↓
Last client disconnects
    ↓
DocRoom hibernates after 30s idle
    ↓
Document state persists in DO storage (encrypted)
```

## WebSocket endpoint

- **Personal share collab:** `GET /share/collab/{shareId}/ws`
- **Workspace document collab:** `GET /collab/doc/{docId}/ws`

Authentication:
- Share collab: share token validated by Worker before WebSocket upgrade.
- Workspace collab: `Authorization: Bearer <session_token>` header; Worker validates before upgrade.

## Message types

All messages are transmitted as binary (Uint8Array) over the WebSocket.

### Client → DocRoom

| Message type byte | Description |
|---|---|
| `0x00` — sync_step1 | Client sends its Y.js state vector (base64-encoded). DocRoom responds with sync_step2. |
| `0x01` — sync_step2 | Client sends missing updates (diff from server's state vector). DocRoom stores and relays. |
| `0x02` — update | AES-256-GCM encrypted Y.js update (12-byte IV prepended). DocRoom relays to all other clients. |
| `0x03` — awareness | Plaintext awareness update (cursor position, user presence). DocRoom relays to all clients including sender. |

### DocRoom → Client

DocRoom re-broadcasts each received message to all connected clients (except the sender for updates/awareness). For sync_step2 responses, DocRoom sends its stored encrypted document state.

### ASCII sequence diagram — join and sync

```
Client A                DocRoom DO              Client B
   |                       |                       |
   |── connect ──────────► |                       |
   |── sync_step1 (sv=A) ─► |                       |
   |◄── sync_step2 (state) ─|                       |
   |                       |                       |
   |── update (enc) ───────► |                       |
   |                       |── relay update ────► B |
   |                       |                       |
   |                       |◄── update (enc) ──── B |
   |◄── relay update ──────|                       |
```

## DocRoom internal storage

DocRoom stores one entry in DO storage per document:

- **Key:** `"doc_state"`
- **Value:** Latest encrypted Y.js document state (bytes), base64-encoded. This is the full document as an AES-256-GCM ciphertext that only clients can decrypt.

This allows new joiners to receive the complete document state even when no other peer is connected.

## Hibernation and eviction

After the last WebSocket closes, DocRoom enters hibernation after 30 seconds of inactivity. During hibernation, the DO is not billed for compute (only storage). When a new client connects, the DO wakes from hibernation and its DO storage is available immediately.

Cloudflare evicts DO storage for objects that have not been accessed for an extended period. If eviction occurs, new joiners will receive an empty document and must re-seed it from their local Y.js state. This is handled transparently by the Y.js sync protocol.

## Behaviour and edge cases

- **DocRoom never decrypts:** The DO does not possess any encryption key. It processes messages as opaque binary blobs. Broadcast is pure relay.
- **Authentication boundary:** The Worker validates the session token/share token BEFORE upgrading the HTTP connection to WebSocket. DocRoom itself does not perform authentication — it trusts that the Worker only forwards authenticated connections.
- **Scale:** Each DocRoom handles one document. The Cloudflare DO namespace allows millions of concurrent DocRoom instances.
- **Awareness plaintext:** Awareness messages (type `0x03`) are relayed as-is. They contain cursor positions and display names, not document content, which is why they are not encrypted.

## Platform differences

The DocRoom protocol is platform-agnostic — it operates over standard WebSocket from any client.

## Plan availability

Workspace document collab requires Team or Enterprise. Share link collab requires Vault or higher (share links with Edit permission).

## Permissions and roles

Enforced at the Worker level before WebSocket upgrade. DocRoom receives only already-authenticated connections.

## Security implications

See [Real-time collaboration with Y.js](realtime-yjs.md) for the full security analysis. The key invariant: DocRoom can observe message sizes and timing but never message content.

## Settings reference

No user-configurable DocRoom settings.

## Related articles

- [Real-time collaboration with Y.js](realtime-yjs.md)
- [Awareness and presence](awareness-and-presence.md)
- [Reconnect behaviour](reconnect-backoff.md)

## Source references

- `private-sync-worker/src/docRoom.ts` — DocRoom Durable Object implementation
- `src/renderer/src/collab/CollabDoc.ts` — client-side WebSocket provider + encrypt/decrypt
