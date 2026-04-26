---
title: "Merge conflicts"
slug: "merge-conflicts"
category: "Sync & Storage"
tags: ["merge", "conflict", "sync", "offline"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/sync.ts"
  - "src/renderer/src/hooks/useWorkerSync.ts"
related: ["sync-queue", "cross-device", "pull-polling", "collaboration/realtime-yjs"]
---

# Merge conflicts

## What it is

A merge conflict occurs when two devices edit the same note while both are offline (or out of sync), and both push their changes to the server before receiving each other's update. K-Perception detects this via sequence number mismatch and presents a visual merge modal so you can choose which version to keep.

## When to use it

You will encounter a merge conflict when:

- You edited a note on your laptop while offline, then edited the same note on your phone before either synced.
- A collab session had a network interruption and both sides applied changes independently.

## Step by step

1. Both devices make edits to the same note while offline or disconnected.
2. Device A syncs first — its changes are accepted by the Worker and assigned `canonical_seq = N`.
3. Device B syncs and pushes its version. The Worker sees the incoming `client_seq` does not match `N`.
4. The Worker returns HTTP 409 with the current server version (`seq=N` blob reference).
5. Device B downloads the server version and presents the **merge modal**:
   - **Left panel:** "Your local version" (Device B's edit)
   - **Right panel:** "Remote version" (Device A's edit, from server)
   - Options: **Keep mine**, **Keep theirs**, **Merge manually**
6. If you choose **Keep mine**, your version is re-pushed as a new revision (seq N+1).
7. If you choose **Keep theirs**, the remote version is applied locally.
8. If you choose **Merge manually**, a split-view editor lets you copy sections between versions and compose a merged result.
9. The resolved version is saved and synced.

![Merge conflict modal showing two versions side by side](../assets/merge-conflicts-1.png)

## Behaviour and edge cases

- **CRDT documents are exempt:** Notes being edited collaboratively via Y.js are conflict-free by design — Y.js merge semantics always produce a deterministic result without user intervention.
- **Timestamp-based automatic resolution (optional):** If you have enabled "auto-resolve by latest timestamp" in settings, the device with the later `client_updated_at` wins without showing the modal. This is off by default.
- **Attachment conflicts:** If two devices upload different binary blobs for the same attachment ID, the later-arriving blob wins (last-write-wins). No merge modal is shown for binary attachments.
- **Settings and metadata conflicts:** Title, tags, folder assignment, and mode conflicts use timestamp-based auto-resolution (later wins) without a modal.
- **Multiple pending conflicts:** If several notes conflict simultaneously, the merge modal queues them and shows them one at a time.
- **Mobile conflict modal:** On Android, the merge modal is a full-screen bottom sheet with simplified Keep/Theirs/Manual options.
- **Unresolved conflicts:** You can dismiss the modal (Escape on desktop) to defer resolution. The conflict is marked "pending" and a badge shows in the health screen. The note shows the local version.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Merge modal | Full side-by-side diff view | Full-screen bottom sheet | Full side-by-side diff view |
| Manual merge editor | Yes (split-view) | Simplified | Yes |
| Auto-resolve by timestamp | Optional (disabled by default) | Optional | Optional |

## Plan availability

Merge conflict resolution is available on Guardian and above. The Local plan cannot have conflicts (single device, no sync).

## Permissions and roles

Any user with Edit access to a note can resolve conflicts for that note.

## Security implications

The conflict resolution flow downloads the server version (an encrypted blob) and decrypts it on-device. The merge modal renders two decrypted versions side by side — this is done entirely in-process. No plaintext is sent to the server during conflict resolution.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Auto-resolve conflicts by latest timestamp | Disabled | Account settings → Sync → Conflict resolution |
| Show pending conflicts badge | Enabled | Account settings → Sync |

## Related articles

- [Sync queue](sync-queue.md)
- [Cross-device sync](cross-device.md)
- [Real-time collaboration with Y.js](../collaboration/realtime-yjs.md)

## Source references

- `private-sync-worker/src/sync.ts` — conflict detection (sequence number check)
- `src/renderer/src/hooks/useWorkerSync.ts` — conflict handling on client
