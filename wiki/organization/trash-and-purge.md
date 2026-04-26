---
title: "Trash and Auto-Purge"
slug: "trash-and-purge"
category: "Organization"
tags: ["trash", "delete", "purge", "recovery", "retention", "tombstone"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0001_init.sql"
  - "private-sync-worker/src/sync.ts"
  - "src/shared/noteTypes.ts"
related: ["folders", "sync-queue", "offline-first", "storage-quotas", "spaces"]
---

## What it is

When you delete a note in K-Perception, it is not immediately destroyed. Instead, it is moved to the **Trash** — a soft-delete state where the note is hidden from normal views but still stored, recoverable, and fully encrypted. Notes remain in the Trash until one of the following events removes them permanently:

1. **Auto-purge on vault open** — when the vault is unlocked, notes in the Trash that are older than your configured retention period are permanently deleted.
2. **Manual "Empty trash"** — you explicitly purge all trashed notes.
3. **Manual single-note permanent delete** — you right-click / long-press a specific note in the Trash and choose "Delete permanently".
4. **Workspace Admin force-purge** — a workspace Admin can permanently purge any trashed note in the workspace regardless of age.

At the storage layer, a deleted note is represented by a **tombstone** record in the Cloudflare D1 database: the `sync_objects` row has its `tombstone` column set to `true`. The encrypted payload blob in R2 is retained until the note is permanently purged, at which point the blob is deleted from R2 and the D1 row is cleaned up.

---

## When to use it

The Trash provides a recovery window for accidental deletions. The default 30-day retention means you have a month to realise you deleted something by mistake and restore it. If you work with sensitive information and want shorter data retention, reduce the retention period. If you archive older notes and want a longer safety net, increase it.

---

## Step by step

### Deleting a note (moving to Trash)

**Desktop:**
- Right-click a note in the list → **Move to Trash**, or
- Open the note → click the **Delete** (trash icon) button in the editor toolbar, or
- Select a note in the list and press the **Delete** key.

**Android:**
- Long-press a note → contextual toolbar → **Delete** (trash icon).
- Or open the note → tap **⋮** menu → **Move to Trash**.

**Web:**
- Right-click a note → **Move to Trash**, or open the note → toolbar **Delete** button.

Multi-select: select multiple notes and use the bulk-delete action to move all to Trash at once.

### Viewing trashed notes

Open the **Trash** virtual folder in the sidebar (desktop/web) or via the hamburger menu (Android). Trashed notes are displayed with a muted visual style and a timestamp showing when they were deleted and when they will be auto-purged.

### Restoring a note

In the Trash view, right-click (desktop) or long-press (Android) a note → **Restore**. The note returns to its original folder. If the original folder was deleted in the meantime, the note is placed in Root / Unfiled.

### Permanently deleting a single note

In the Trash view, right-click (desktop) or long-press (Android) → **Delete permanently**. A confirmation dialog appears. Confirm to trigger immediate permanent deletion.

### Emptying the trash (purge all)

In the Trash view toolbar, click / tap **Empty Trash**. A confirmation dialog warns that this action is irreversible. Confirming permanently deletes all notes currently in the Trash, regardless of their deletion age.

### Configuring the retention period

Go to **Settings → Notes → Trash retention** and set the number of days (minimum 1, maximum 365). The default is 30 days.

---

## What happens on permanent purge

When a note is permanently purged (by auto-purge, manual empty-trash, or single-note permanent delete):

1. **Client-side:** The note is removed from the local in-memory note list and from the local encrypted store (IndexedDB / Capacitor Preferences). The search index is updated.
2. **Sync queue:** A delete operation is added to the sync queue. The operation carries `operation: "delete"`, the object ID, and the final sequence number.
3. **Worker processing** (`private-sync-worker/src/sync.ts`):
   - The Worker updates the D1 `sync_objects` row: sets `tombstone = true` and clears the `payload_hash`.
   - The Worker deletes the corresponding R2 blob at `{namespace_id}/{object_type}/{object_id}.enc`.
4. **D1 row cleanup:** After R2 deletion is confirmed, the D1 tombstone row is retained for a short window (7 days) to allow other devices to receive the deletion event in their next pull. After that window, the D1 row is physically deleted by a scheduled cleanup cron job.

The net result is that after permanent purge, no encrypted blob remains in R2 and the D1 row is eventually cleaned up. There is no soft-delete retention at the server side beyond the client-controlled tombstone.

---

## Behaviour and edge cases

**Auto-purge timing.** Auto-purge runs at vault open time (when you enter your password and unlock). If you have been offline for weeks, notes that crossed the retention threshold while offline will be purged the next time you unlock with internet connectivity (to allow the Worker to confirm the deletion). In offline mode, the purge is queued locally and executed against the server on the next successful sync.

**Notes still encrypted in Trash.** Trashed notes are never decrypted at the server. The tombstone flag and deletion timestamps are server-visible metadata, but the note content and title remain encrypted in the R2 blob until R2 deletion. This means a server operator can see *that* you deleted a note (tombstone timestamp) but not *what* the note contained.

**Workspace notes — admin force-purge.** A workspace Admin or Owner can navigate to a member's trashed workspace notes (via the Admin Panel → Workspace Notes → Trash) and trigger immediate permanent deletion regardless of the retention period. This is useful for compliance, legal hold release, or storage reclamation.

**What happens if retention is changed mid-period.** Reducing the retention period (e.g., from 30 to 7 days) will cause notes older than 7 days to be purged on the next vault open. Increasing the retention period extends the safety window for notes already in the Trash.

**Trash and storage quota.** Trashed notes count against your storage quota until they are permanently purged (their R2 blobs still exist). If you are near your quota limit, emptying the Trash frees that storage.

**Attachments in trashed notes.** Attachment blobs are purged at the same time as the note blob when permanent deletion occurs. All associated R2 objects under the note's object ID are deleted.

**Pinned notes moved to Trash.** If a pinned note is deleted, the pin flag is preserved in its encrypted metadata until permanent purge. On restore, the note returns pinned.

---

## Platform differences

| Feature | Windows (Electron) | Android (Capacitor) | Web (PWA) |
|---|---|---|---|
| Move to Trash | Right-click menu or Delete key | Long-press → Delete | Right-click menu |
| View Trash | Left sidebar → Trash | Hamburger menu → Trash | Left sidebar → Trash |
| Restore note | Right-click → Restore | Long-press → Restore | Right-click → Restore |
| Empty Trash button | Toolbar in Trash view | Toolbar in Trash view | Toolbar in Trash view |
| Auto-purge on vault open | Yes | Yes | Yes |
| Configure retention days | Settings → Notes | Settings → Notes | Settings → Notes |
| Admin force-purge | Admin Panel (Team/Enterprise) | Admin Panel (Team/Enterprise) | Admin Panel (Team/Enterprise) |

---

## Plan availability

Trash and configurable retention are available on all plans.

| Plan | Trash | Configurable retention | Admin force-purge |
|---|---|---|---|
| Local | Yes | Yes | N/A |
| Guardian | Yes | Yes | N/A |
| Vault | Yes | Yes | N/A |
| Lifetime | Yes | Yes | N/A |
| Team | Yes | Yes | Yes (Admins) |
| Enterprise | Yes | Yes | Yes (Admins) |

---

## Permissions and roles

**Personal vault:** Only the vault owner can delete, restore, or purge notes.

**Workspace:**
- **Member** — can delete (move to Trash) notes they authored; can restore their own trashed notes; cannot force-purge.
- **Admin** — can delete, restore, or force-purge any note in the workspace.
- **Owner** — same as Admin.

---

## Security implications

The tombstone mechanism leaks minimal metadata to the server: the object ID, the tombstone timestamp, and the sequence number of the delete event. The server does not learn the note's title, content, or tags. The R2 blob is retained (encrypted) until permanent purge; after purge, no recoverable data exists at the server.

It is important to understand that **Trash is not a security measure** — it is a user-experience safety net. If you need to ensure data is irrecoverable, use "Delete permanently" (not just "Move to Trash") and confirm.

---

## Settings reference

| Setting | Location | Default | Description |
|---|---|---|---|
| Trash retention period | Settings → Notes → Trash retention | 30 days | Notes older than this (in Trash) are auto-purged on vault open |
| Show Trash in sidebar | Settings → Sidebar | On | Toggle Trash folder visibility in the left navigation |
| Confirm before empty trash | Settings → Notes | On | Show a confirmation dialog before emptying the entire Trash |

---

## Related articles

- [Folders](folders.md) — notes move to Root when their folder is deleted; then soft-deleted if desired
- [Storage quotas](../sync-and-storage/storage-quotas.md) — trashed blobs count against quota until purged
- [Sync queue](../sync-and-storage/sync-queue.md) — how delete operations are queued and processed
- [Offline-first architecture](../sync-and-storage/offline-first.md) — what happens when purge cannot reach the server
- [Spaces](spaces.md) — each Space has its own Trash

---

## Source references

- `src/shared/noteTypes.ts` — `NoteMetadata.deleted_at` and `NoteMetadata.tombstone` fields
- `private-sync-worker/src/sync.ts` — delete operation handler; tombstone write; R2 blob deletion
- `private-sync-worker/migrations/0001_init.sql` — `sync_objects` schema; `tombstone BOOLEAN` column
- `src/renderer/src/components/TrashView.tsx` — desktop Trash view with restore and purge actions
