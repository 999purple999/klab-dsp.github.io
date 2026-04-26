---
title: "Workspace presence"
slug: "presence"
category: "Workspaces"
tags: ["presence", "online", "status", "workspace"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/presence.ts"
  - "private-sync-worker/migrations/0023_citations_presence.sql"
related: ["workspaces/channels", "workspaces/overview", "collaboration/awareness-and-presence"]
---

# Workspace presence

## What it is

Workspace presence shows which team members are currently online and, optionally, which document or channel they are viewing. Presence is managed by the **PresenceHub** Durable Object (`private-sync-worker/src/presence.ts`), one per workspace.

Presence data is plaintext — it contains display names and current location but no document content.

## When to use it

- See who is online before sending a message or requesting a review.
- Avoid interrupting colleagues who are actively editing a document.
- Coordinate synchronous collaboration sessions.

## How it works

Each client sends a heartbeat to the PresenceHub every 15 seconds while the vault is unlocked and the workspace is open. The heartbeat contains:

```json
{
  "user_id": "uuid",
  "display_name": "Alice",
  "current_location": "channel:{channelId}" | "document:{docId}" | "workspace"
}
```

PresenceHub broadcasts the updated presence map to all connected workspace members. Each client renders the presence indicators in the sidebar.

## Step by step

Presence is automatic when you are logged in and have a workspace open. To see who is online:

1. Open any workspace.
2. The member list in the sidebar shows a green indicator next to online members.
3. Hover (desktop) or tap (mobile) a member's name to see their current location.
4. Members who have not sent a heartbeat in 60 seconds are shown as offline.

## Behaviour and edge cases

- **Privacy:** Presence reveals your display name and which workspace you are in. It does not reveal what you are writing.
- **Heartbeat interval:** 30 seconds while active (`PRESENCE_HEARTBEAT_MS = 30_000` in `src/shared/presence.ts`). No background reduction is implemented — heartbeats stop entirely when the app is backgrounded (Android OS constraint).
- **Offline timeout:** 60 seconds without a heartbeat marks a member as offline.
- **Mobile backgrounding:** Heartbeats stop when the app goes to the background (Android OS constraint). Members appear offline until the app returns to the foreground.
- **Guest members:** Guest workspace members are shown in the presence map if they are active.
- **PresenceHub scale:** One DO per workspace. Each DO handles all presence for that workspace. Supports hundreds of concurrent members.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Presence in sidebar | Yes (green dot + name) | Header shortcuts only | Yes |
| Current location displayed | Yes | No | Yes |
| Heartbeat active in background | No | No | Only if tab is visible |

## Plan availability

Workspace presence requires Team or Enterprise.

## Permissions and roles

All workspace members can see each other's presence.

## Security implications

Presence data is plaintext at the PresenceHub level. A server-side operator can see which members are online and which document/channel they are in. This is a deliberate trade-off for usable team coordination. Document content is never exposed.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Show my presence to teammates | Enabled | Not confirmed in current source — contact support for confirmation. Presence visibility is controlled per-workspace by admins via the workspace `presence_policy` setting, not per-user in Account settings. |
| Heartbeat interval | 15 seconds | Not user-configurable |

## Related articles

- [Channels](channels.md)
- [Workspace overview](overview.md)
- [Awareness and presence (collab)](../collaboration/awareness-and-presence.md)

## Source references

- `private-sync-worker/src/presence.ts` — PresenceHub Durable Object
- `private-sync-worker/migrations/0023_citations_presence.sql` — presence schema additions
