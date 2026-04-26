---
title: "Revision history"
slug: "revision-history"
category: "Editors"
tags: ["revision", "history", "version", "rollback"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/"
  - "private-sync-worker/src/sync.ts"
related: ["exports", "sync-and-storage/sync-queue", "workspaces/backup-restore"]
---

# Revision history

## What it is

Every time K-Perception saves a note, it stores the previous version as a revision. You can browse the full revision history for any note and restore any past version. Each revision is stored as a separate encrypted blob, so the complete writing history of a document is preserved without overwriting earlier work.

## When to use it

- You accidentally deleted a large section of text and `Ctrl+Z` undo did not go back far enough.
- You want to compare how a document looked last week versus today.
- A collaborator made changes you want to revert.
- You want to recover a draft you discarded and then regretted.

## Step by step

### Desktop (Windows / macOS)

1. Open the note you want to inspect.
2. Click the clock icon in the top-right toolbar, or press `Ctrl+Shift+H` / `Cmd+Shift+H`.
3. The **RevisionPanel** slides open on the right side of the editor.
4. The panel lists every saved revision in reverse chronological order, showing the timestamp and the device that saved it.
5. Click a revision to preview it in a read-only overlay on the left.
6. If you want to restore that version, click **Restore this version**. A new revision is created capturing the current state before the restore happens (so you can undo the restore too).

### Mobile (Android)

1. Open the note.
2. Tap the three-dot menu (⋮) at the top right.
3. Tap **Revision history**.
4. The **RevisionSheet** bottom drawer slides up listing revisions.
5. Tap a revision to preview it full-screen.
6. Tap **Restore** to replace the current content with the selected revision.

![RevisionPanel open on desktop with list of saves](../assets/revision-history-1.png)

## Behaviour and edge cases

- **Auto-save trigger:** K-Perception saves a revision every time you stop typing for 3 seconds and when you explicitly press `Ctrl+S`. Each auto-save creates a revision.
- **Restore is non-destructive:** Restoring a revision creates a new revision capturing the pre-restore state. You can always undo a restore by opening history again and picking the revision just before the restore.
- **What is stored:** The full encrypted note JSON (body + metadata) for each revision. Attachments are referenced by blob ID — the attachment blobs themselves are not duplicated.
- **Revision limit by plan:**
  - **Local:** No cloud revision history. Undo/Redo buffer only (in-session).
  - **Guardian:** 30 days of revision history.
  - **Vault / Lifetime / Team / Enterprise:** Unlimited revision history.
- **Pruning:** Revisions older than the plan limit are automatically purged from the server during periodic maintenance. The latest revision is always preserved regardless of age.
- **Large notes:** Very large notes generate large revision blobs. Revision blobs are stored as separate encrypted objects in R2, the same as live note blobs, and therefore do count against storage quota. The quota meter in Account settings → Storage reflects the combined total of live notes and their revisions.
- **Collaborative notes:** In a Y.js collaborative session, revisions are Y.js state snapshots taken every 2 minutes by the DocRoom. These appear in history as "collaboration snapshot" entries.
- **Offline revisions:** Revisions created while offline are queued and uploaded when connectivity is restored, maintaining the full history.
- **Deleted notes:** If you delete a note, its revisions are also deleted (after the trash retention period).

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| UI component | RevisionPanel (right sidebar) | RevisionSheet (bottom drawer) | RevisionPanel |
| Keyboard shortcut | `Ctrl+Shift+H` | Via menu only | `Ctrl+Shift+H` |
| Preview display | Side-by-side with editor | Full-screen overlay | Side-by-side |
| Restore button location | Panel footer | Drawer footer | Panel footer |

## Plan availability

| Plan | Revision retention |
|---|---|
| Local | None (undo buffer only) |
| Guardian | 30 days |
| Vault | Unlimited |
| Lifetime | Unlimited |
| Team | Unlimited |
| Enterprise | Unlimited |

## Permissions and roles

- Any user can view and restore revisions for their own notes.
- In a workspace: Members can view revision history for documents in sections they have read access to. Only users with Edit permission can restore a revision.
- Workspace admins can see revision history for all documents in the workspace.

## Security implications

Each revision blob is encrypted with AES-256-GCM using the same key as the live note (master vault key for personal notes; SK_section-derived key for workspace notes). Revision blobs are stored in Cloudflare R2 alongside live blobs. The server cannot read any revision content. Restoring a revision does not change any encryption keys.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Auto-save interval | 3 seconds after last keystroke | Not user-configurable |
| Revision history access | Enabled | Not user-configurable |
| Storage quota counted | Yes — revision blobs count against quota | Account settings → Storage |

## Related articles

- [Exports](exports.md)
- [Sync queue](../sync-and-storage/sync-queue.md)
- [Workspace backup and restore](../workspaces/backup-restore.md)

## Source references

- `src/renderer/src/components/` — RevisionPanel, RevisionSheet components
- `private-sync-worker/src/sync.ts` — revision blob storage
- `private-sync-worker/migrations/0001_init.sql` — sync_objects table (stores revision blobs)
