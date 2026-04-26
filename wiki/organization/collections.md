---
title: "Collections"
slug: "collections"
category: "Organization"
tags: ["collections", "kanban", "board", "gallery", "calendar", "list", "organization"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/CollectionView.tsx"
  - "src/shared/collectionTypes.ts"
related: ["folders", "tags", "search", "knowledge-graph"]
---

## What it is

Collections are named, curated sets of notes. A Collection acts like a playlist: you assemble notes from anywhere in your vault — across different folders, tags, and Spaces — into a single named group, and then browse or work with them in one of four specialised view modes.

A note can belong to any number of Collections simultaneously and still remain in its original folder. Moving a note out of a folder does not remove it from a Collection. Removing a note from a Collection does not delete it from the vault.

Like all content in K-Perception, Collection metadata (name, member list, view configuration) is stored encrypted in the vault and synced via the standard encrypted sync queue.

---

## When to use it

Collections are the right tool when you want to:

- **Gather research** — pull together notes from multiple folders into a project-specific set without restructuring your folder hierarchy.
- **Track tasks across a project (Board view)** — move note cards through Kanban columns like `Backlog → In Progress → Done`.
- **Review content visually (Gallery view)** — browse thumbnails or preview cards when the visual shape of a note (image, diagram, cover art) matters.
- **Plan over time (Calendar view)** — see notes plotted on a calendar by creation date, modification date, or a custom date embedded in the note.
- **Produce a sorted reading list (List view)** — curate an ordered list of references, articles, or reading items sorted any way you like.

---

## Step by step

### Creating a Collection

1. Open the **Collections** section in the left sidebar (desktop) or in the bottom navigation (Android).
2. Click / tap the **+** button.
3. Enter a Collection name.
4. Choose the initial view mode (Board, Gallery, Calendar, or List).
5. Tap **Create**. The empty Collection opens.

### Adding notes to a Collection

**From a Collection view:** Click / tap **Add notes** (the + icon within the Collection). A note picker appears. Search or browse, then select notes and confirm.

**From the note list (desktop):** Right-click one or more notes → **Add to Collection** → pick from the list of existing Collections.

**From the note list (Android):** Long-press a note to enter selection mode → tap additional notes → tap **Add to Collection** in the contextual toolbar.

A note can be added to as many Collections as you like.

### Removing a note from a Collection

In the Collection view, right-click (desktop) or long-press (Android) the note card → **Remove from Collection**. This does not delete the note; it only removes it from this Collection's member list.

### Deleting a Collection

Right-click (desktop) or long-press (Android) the Collection in the sidebar → **Delete Collection**. All member notes remain in the vault.

### Switching view modes

Inside a Collection, use the view-mode toolbar at the top to switch between Board, Gallery, Calendar, and List. The selected mode is saved per-Collection and synced across devices.

---

## View modes in detail

### Board view (Kanban)

The Board view displays notes as cards organised into columns. Each column represents a status or stage. Default columns are **Backlog**, **In Progress**, and **Done**; you can add, rename, reorder, and delete columns.

- **Add a column:** Click / tap **+ Add column** at the right end of the board.
- **Rename a column:** Double-click (desktop) or long-press (Android) the column header.
- **Delete a column:** Click the **×** on the column header. Notes in the deleted column move to the first column.
- **Move a card:** Drag it to a different column (desktop) or long-press and drag (Android).
- **Card content:** Shows note title, tag chips, and a creation timestamp.
- **Card order within a column:** Drag to reorder. The order is saved in the Collection metadata.

### Gallery view

The Gallery view renders notes as a grid of visual cards. Each card shows:
- The note title
- A preview of the first image attached to the note, or a coloured icon if no image is present
- Tag chips
- A short excerpt of the note body

Cards are arranged in a responsive grid. On desktop the grid is typically 3–4 columns wide; on Android it is 2 columns.

### Calendar view

The Calendar view plots notes onto a calendar grid. Notes appear as chips on the date determined by the **date field** setting for the Collection:

- **Created at** (default) — uses the note's creation timestamp.
- **Modified at** — uses the note's last-modification timestamp.
- **Custom date** — if the note body contains a date in ISO 8601 format (YYYY-MM-DD) as the first line or in a metadata block, that date is used. [NEEDS-VERIFY: custom date extraction logic]

Switch between month and week views using the toggle in the Calendar toolbar.

Clicking / tapping a date chip opens the note. Dragging a chip to another date (desktop) updates the custom date field in the note body. [NEEDS-VERIFY: drag-to-reschedule availability]

### List view

The List view shows notes as a sorted, scrollable list. Sort options:

- **Title A–Z / Z–A**
- **Created date (newest or oldest first)**
- **Modified date (newest or oldest first)**
- **Manual order** — drag to reorder; order saved in Collection metadata

Each row shows title, tag chips, folder path, and modification date.

---

## Behaviour and edge cases

**Notes in multiple Collections.** A note's Collection membership list is stored in the note's own encrypted metadata. There is no upper limit on how many Collections a single note can belong to.

**Collection membership across Spaces.** You cannot add a note from Space A into a Collection that lives in Space B, or into a Collection in the default vault. Collection membership is scoped to the Space (or default vault) the Collection was created in.

**Collection deletion vs note deletion.** Deleting a Collection only removes the Collection object. All member notes stay in the vault untouched.

**Board column state and sync.** Column definitions and per-card column assignments are stored in the Collection's encrypted metadata blob. If two devices move the same card to different columns while offline, the later timestamp wins on sync (last-write-wins per card assignment). [NEEDS-VERIFY: CRDT vs LWW for column assignment]

**Empty Collections.** A Collection with zero members is valid and persists in the sidebar.

**Workspace Collections.** In Team and Enterprise workspaces, Collections are workspace-scoped. Any member can add notes to a workspace Collection. Column definitions for Board view are shared and synced across all members.

---

## Platform differences

| Feature | Windows (Electron) | Android (Capacitor) | Web (PWA) |
|---|---|---|---|
| Board view (Kanban) | Yes, drag-and-drop | Yes, long-press drag | Yes, drag-and-drop |
| Gallery view | Yes, 3–4 col grid | Yes, 2-col grid | Yes, responsive grid |
| Calendar view | Yes, month + week | Yes, month view | Yes, month + week |
| List view | Yes, all sort modes | Yes, all sort modes | Yes, all sort modes |
| Add note from right-click | Yes | No (long-press) | Yes |
| Drag card between columns | Yes | Yes (long-press drag) | Yes |
| Drag to reorder list | Yes | Yes | Yes |
| Drag-to-reschedule (Calendar) | Planned | Planned | Planned |

---

## Plan availability

Collections are available on all plans. Multi-device collection sync requires a sync-enabled plan.

| Plan | Collections | Sync |
|---|---|---|
| Local | Yes | No (single device) |
| Guardian | Yes | Yes (up to 3 devices) |
| Vault | Yes | Yes (up to 8 devices) |
| Lifetime | Yes | Yes (up to 8 devices) |
| Team | Yes | Yes (workspace, all members) |
| Enterprise | Yes | Yes (unlimited) |

---

## Permissions and roles

**Personal vault:** Only you can create, edit, and delete Collections in your personal vault.

**Workspace:**
- **Member** — can add / remove notes from workspace Collections; cannot delete Collections.
- **Admin** — can create, rename, reconfigure, and delete workspace Collections.
- **Owner** — same as Admin.

---

## Security implications

Collection metadata (name, member note IDs, column definitions, view mode) is encrypted as part of the Collection's vault-encrypted payload. The server stores only an opaque ciphertext. Note IDs referenced in a Collection membership list are also encrypted within the payload — the server cannot reconstruct the membership list or deduce how many notes a Collection contains.

---

## Settings reference

| Setting | Location | Default | Description |
|---|---|---|---|
| Default view mode for new Collections | Settings → Collections | List | The initial view mode chosen when creating a new Collection |
| Calendar date field | Per-Collection settings | Created at | Which date field drives note placement in Calendar view |
| Show tag chips in Board cards | Per-Collection settings | On | Toggle tag display on Kanban cards |
| Gallery card excerpt length | Settings → Collections | 80 chars | Characters of note body shown in Gallery card preview |

---

## Related articles

- [Folders](folders.md) — note containment; note's folder assignment is independent of Collection membership
- [Tags](tags.md) — use tags inside Collections for further filtering
- [Search](search.md) — search across all Collections or within a specific one
- [Knowledge graph](knowledge-graph.md) — visual inter-connection map, complements Gallery view for linked notes
- [Sync queue](../sync-and-storage/sync-queue.md) — how Collection changes propagate across devices

---

## Source references

- `src/renderer/src/components/CollectionView.tsx` — view mode switcher and host container
- `src/renderer/src/components/BoardView.tsx` — Kanban board implementation
- `src/renderer/src/components/GalleryView.tsx` — gallery grid implementation
- `src/renderer/src/components/CalendarView.tsx` — calendar implementation
- `src/shared/collectionTypes.ts` — `Collection`, `BoardColumn`, `CardAssignment` type definitions
