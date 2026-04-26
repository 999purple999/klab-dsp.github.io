---
title: "End-to-End Encrypted Real-Time Collaboration"
slug: "e2ee-collaboration"
category: "Security"
tags: ["E2EE", "collaboration", "Y.js", "CRDT", "DocRoom", "real-time", "WebSocket"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/wdkCrypto.ts
  - private-sync-worker/src/docRoom.ts
  - private-sync-worker/migrations/0009_realtime_collab.sql
related:
  - "key-hierarchy"
  - "aes-gcm-encryption"
  - "zero-knowledge-model"
  - "security-overview"
---

# End-to-End Encrypted Real-Time Collaboration

## What it is

K-Perception's real-time co-editing feature allows multiple users to edit the same document simultaneously. Collaboration uses Y.js CRDT (Conflict-free Replicated Data Type) for merge semantics, but all Y.js update payloads are encrypted with AES-256-GCM before leaving the device. The Cloudflare Durable Object (DocRoom) that relays updates between clients operates as a blind relay and never sees plaintext.

## Collaboration encryption model

Every document in a workspace is associated with a section key (SK_section) derived from the workspace data key (WDK). The Y.js CRDT update binary is encrypted with the section key before being sent over the WebSocket to the DocRoom:

```
Y.js update (binary)
  |
  v
encryptWithKey(SK_section, yUpdateBytes)
  = base64(iv ‖ AES-GCM(SK_section, yUpdate))
  |
  v
WebSocket frame → DocRoom Durable Object → other clients
  |
  v
decryptWithKey(SK_section, encryptedFrame)
  = Y.js update bytes
  |
  v
Y.doc.applyUpdate(update)
```

The DocRoom Durable Object:
- Receives encrypted WebSocket frames
- Broadcasts them to other connected clients in the same room
- Stores the latest encrypted state for fast-join bootstrap
- Never decrypts — has no access to any key material

## DocRoom Durable Object

The DocRoom is a Cloudflare Durable Object (single-tenant, globally consistent) scoped to one document. It acts as a rendezvous point for real-time updates. Its role in the security model:

- **What it does**: Routes encrypted WebSocket frames between clients; maintains a frame buffer for clients that reconnect
- **What it cannot do**: Decrypt any content (no key material is ever sent to the server)
- **Persistence**: The DocRoom may persist the latest encrypted state for fast-join; this persisted state is also ciphertext

## Presence and awareness

Y.js awareness data (cursor position, user display name, selection range) is also transmitted through the DocRoom. Awareness data is encrypted using the same section key (AES-256-GCM) before being sent over the WebSocket.

[NEEDS-VERIFY — confirm that awareness/presence frames go through the same AES-GCM encryption path as document updates, or whether they use a different encryption layer]

## Share link collaboration

When a note is shared via a share link, the collaboration session uses the share link's encryption key (the random 32-byte `keyHex` placed in the URL fragment). The DocRoom for a shared note is identified by the share link ID, not the workspace note ID. Participants who join via a share link use the fragment key to encrypt/decrypt their Y.js updates. See [Share Link Security](share-link-security.md) for details on the share key model.

## WebSocket frame format

Encrypted frames sent over the WebSocket use the same format as all other K-Perception encrypted blobs:

```
base64(iv[12] ‖ AES-GCM-ciphertext[variable])
```

The IV is 12 bytes of fresh random data generated per frame. The authentication tag (16 bytes) is appended by AES-GCM and verified on receipt.

## Channel real-time messaging

Workspace channels use a dedicated `SK_channel` derived from the section key (see [Key Hierarchy](key-hierarchy.md)):

```
SK_channel = HKDF-SHA256(SK_section, info="kp-channel-v1:" + channelId)
```

Channel messages are encrypted with SK_channel before upload. The `ChannelDoc` Durable Object relays channel WebSocket frames in the same blind-relay pattern as the DocRoom.

## Behaviour and edge cases

- **Key rotation**: After a WDK rotation, all derived section and channel keys change. Any cached Y.js state that was encrypted with the old key must be re-encrypted. Clients that have not yet received the new WDK cannot participate until the new key is wrapped for their device.
- **Offline edits**: Y.js CRDT merges offline edits automatically. Offline edit frames are queued on the client and sent encrypted when connectivity is restored.
- **Late-join bootstrap**: The DocRoom may serve a cached encrypted state snapshot to a newly connecting client to avoid replaying the full update log.
- **Network interception**: TLS protects the WebSocket connection in transit. E2EE protects content even if TLS is terminated or compromised at the CDN edge.

## Platform differences

The collaboration feature is available on all three platforms (desktop, Android, web). The encryption and decryption always runs client-side using `crypto.subtle` (Web Crypto API). There are no platform-specific crypto paths for collaboration.

## Related articles

- [Key Hierarchy](key-hierarchy.md)
- [AES-256-GCM Encryption](aes-gcm-encryption.md)
- [Zero-Knowledge Model](zero-knowledge-model.md)
- [Share Link Security](share-link-security.md)
