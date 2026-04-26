---
title: "Awareness and presence"
slug: "awareness-and-presence"
category: "Collaboration"
tags: ["presence", "awareness", "cursors", "collaboration"]
audience: "user"
plan: ["vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/collab/CollabDoc.ts"
  - "private-sync-worker/src/presence.ts"
related: ["realtime-yjs", "docroom-protocol", "workspaces/presence"]
---

# Awareness and presence

## What it is

Awareness is the real-time display of where other collaborators are in a document — their cursor positions, selection ranges, and online status. Presence extends this to workspace-level: which members are online and which document they are currently viewing.

Awareness data is **intentionally transmitted in plaintext** within the encrypted TLS WebSocket connection. Cursor positions and display names do not reveal document content. Encrypting them would require key distribution to every presence-only viewer, adding complexity for no privacy benefit.

## When to use it

- Collaborative editing: see your colleague's cursor moving in real time.
- Workspace sidebar: quickly see which team members are online and what they are working on.
- Coordinating edits: avoid editing the same paragraph as someone else.

## How it works — in-document awareness

Y.js provides a built-in awareness module. Each client maintains a local awareness state:

```json
{
  "clientId": 12345,
  "user": {
    "name": "Alice",
    "color": "#e94f37",
    "cursor": {
      "anchor": { "type": "text", "index": 142 },
      "head":   { "type": "text", "index": 157 }
    }
  }
}
```

When this state changes (cursor moves, selection changes, user goes idle), the Y.js awareness module broadcasts an update via the DocRoom's awareness channel (message type `0x03`). All connected peers receive and apply the update, rendering the remote cursor as a coloured caret with the user's display name tooltip.

### Presence strip

A horizontal strip of coloured avatar chips is displayed at the top of the collaborative editor. Each chip represents one connected peer. Hovering (desktop) or tapping (mobile) a chip shows the user's display name.

## How it works — workspace presence

The **PresenceHub** Durable Object (`private-sync-worker/src/presence.ts`) manages workspace-level presence:

- Each workspace member sends a heartbeat every 15 seconds while active.
- The heartbeat includes: `user_id`, `display_name`, `current_document_id` (a surface/document identifier passed in cleartext — presence data is intentionally not encrypted, as documented in the security implications section).
- The PresenceHub broadcasts the presence map to all connected workspace members.
- A member is marked offline after 60 seconds without a heartbeat.

Workspace presence is shown in the workspace sidebar: a green dot next to online members, with their current location shown on hover.

## Step by step

Awareness is automatic. When you open a collaborative document:

1. Your cursor is immediately shared with all connected peers.
2. You see coloured cursors for each other connected peer.
3. Each cursor has a label showing the collaborator's display name.
4. When a peer stops moving their cursor for 30 seconds, their cursor fades but remains visible (idle state).
5. When a peer disconnects, their cursor disappears after 30 seconds (timeout).

## Behaviour and edge cases

- **Display name:** Taken from your K-Perception account display name. Not configurable per-session.
- **Cursor colour:** Assigned automatically from a deterministic colour palette based on user ID. Consistent across sessions.
- **Awareness timeout:** A peer's awareness entry expires after 30 seconds without a heartbeat. This handles abrupt disconnections (network cut, device sleep).
- **Maximum peers shown:** No hard limit, but the presence strip shows up to 8 chips before collapsing into a "+N" indicator.
- **What the server sees:** DocRoom relays awareness messages as-is. The Worker can read awareness messages in plaintext. This is a deliberate design choice — cursor positions carry no sensitive information.
- **Opt-out:** You cannot opt out of sharing your cursor position in a collaborative document without leaving the document.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Cursor rendering | Coloured caret with name label | Coloured highlight (no caret precision) | Coloured caret with name label |
| Presence strip | Full chips with hover | Simplified strip with tap | Full chips with hover |
| Workspace presence sidebar | Yes | Header shortcuts only | Yes |
| Heartbeat interval | 15 seconds | 15 seconds | 15 seconds |

## Plan availability

In-document awareness: Vault/Lifetime (share links), Team/Enterprise (workspace). Workspace presence: Team/Enterprise only.

## Permissions and roles

Presence is visible to all users in the same collaborative document or workspace session.

## Security implications

Awareness messages are plaintext at the DocRoom level. A server-side operator can see:

- Who is connected to a document (display names).
- When they are active (timestamps).
- Approximate cursor position (character offset — not the content at that position).

This is an acceptable trade-off for real-time UX. Document content is never part of awareness data.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Share cursor position | Always on (cannot disable in collab session) | N/A |
| Workspace presence | Enabled | Not user-configurable |
| Presence timeout | 60 seconds | Not user-configurable |

## Related articles

- [Real-time collaboration with Y.js](realtime-yjs.md)
- [DocRoom protocol](docroom-protocol.md)
- [Workspace presence](../workspaces/presence.md)

## Source references

- `src/renderer/src/collab/CollabDoc.ts` — Y.js awareness integration
- `private-sync-worker/src/presence.ts` — PresenceHub DO
