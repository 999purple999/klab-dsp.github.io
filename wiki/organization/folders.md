---
title: "Folders"
slug: "folders"
category: "Organization"
tags: ["folders", "organization", "hierarchy", "CRDT", "mobile"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/FolderTree.tsx"
  - "mobile/src/components/FolderStrip.tsx"
  - "src/shared/folderTypes.ts"
related: ["tags", "collections", "search", "trash-and-purge", "spaces"]
---

## What it is

Folders are the primary hierarchical container in K-Perception. Every note lives in exactly one folder at any given time (or in the implicit **Root / Unfiled** location if no folder has been assigned). Folders can be nested to arbitrary depth, giving you a tree structure similar to a file system.

Unlike a file system, folder metadata is stored as a **vault-encrypted CRDT** (Conflict-free Replicated Data Type). This means that if two devices simultaneously rename a folder or move notes while offline, the changes merge automatically without data loss when they reconnect. The CRDT state is serialised, encrypted with your vault key, and stored in the same `sync_objects` table as notes — the server never sees folder names or structure in plaintext.

On Android, the folder tree is also surfaced as a **Folder Strip**: a horizontally scrollable row of pill buttons at the top of the note list, allowing one-tap folder navigation without opening a sidebar.

---

## When to use it

Use folders when you want strict containment — a note belongs to exactly one project, journal, or subject area, and you want to browse by browsing a tree. Typical folder schemes include:

- **By project:** `Projects / Alpha`, `Projects / Beta`
- **By date journal:** `Journal / 2026 / April`
- **By domain:** `Work`, `Personal`, `Health`, `Finance`
- **By note type:** `Templates`, `References`, `Archive`

Folders and [Tags](tags.md) complement each other well: use folders for primary containment and tags for cross-cutting attributes (status, priority, people).

---

## Step by step

### Creating a folder (desktop)

1. Right-click any folder in the left sidebar folder tree, or right-click **Root** to create a top-level folder.
2. Select **New folder**.
3. Type the folder name and press **Enter**.
4. The folder appears immediately in the tree.

Alternatively, open the command palette (**Cmd/Ctrl + K**) and type **New folder**.

### Creating a folder (Android)

1. In the Folder Strip at the top of the note list, scroll all the way to the right until you see the **+** (New Folder) pill.
2. Tap **+**. A bottom-sheet dialog appears.
3. Type the folder name and tap **Create**.

Or tap the hamburger menu → **Folders** → **+** button.

### Renaming a folder

- **Desktop:** Right-click the folder in the sidebar → **Rename**. The name becomes an inline text field. Press **Enter** to confirm.
- **Android:** Long-press the folder pill in the Folder Strip or long-press the folder in the full folder list → **Rename**.

### Deleting a folder

1. Right-click (desktop) or long-press (Android) the folder.
2. Select **Delete folder**.
3. A confirmation dialog asks what to do with notes inside:
   - **Move to Root** (default) — notes become unfiled.
   - **Trash all notes** — notes move to the Trash.
4. Confirm. The folder is removed from the CRDT state and the change is pushed to the sync queue.

Notes are never silently destroyed when you delete a folder. See **What happens to notes when a folder is deleted** below.

### Moving notes into a folder

**Single note — desktop:** Drag the note from the note list onto the target folder in the sidebar. Alternatively, right-click the note → **Move to folder** → pick from the hierarchy picker.

**Single note — Android:** Long-press the note → **Move to** → folder picker modal.

**Multi-note selection — desktop:** Hold **Shift** or **Ctrl/Cmd** and click notes to select multiple. Right-click the selection → **Move to folder**.

**Multi-note selection — Android:** Long-press one note to enter selection mode. Tap additional notes. Tap the **Move** action in the contextual toolbar.

### Keyboard navigation (desktop)

- **Arrow Up / Down** — move between folders in the sidebar.
- **Arrow Right** — expand a collapsed folder.
- **Arrow Left** — collapse an expanded folder (or move to parent).
- **Enter** — open the selected folder (show its notes in the main panel).
- **F2** — rename the selected folder.
- **Delete** — delete the selected folder (shows confirmation dialog).

---

## Behaviour and edge cases

**Nested depth.** There is no hard-coded maximum nesting depth. Deeply nested trees (6+ levels) are supported but the mobile Folder Strip only shows the current level's siblings; tap a child folder to drill down.

**Root / Unfiled notes.** Notes not assigned to any folder appear in the **Unfiled** virtual folder. This is not a real folder — it cannot be renamed or deleted. It always appears at the top of the folder list.

**Folder deletion — notes in subfolders.** When you delete a folder that has subfolders, the entire subtree is deleted. All notes in the subtree follow the same move-to-root or trash-all rule you selected.

**Drag-and-drop constraints.** You cannot drag a folder into one of its own descendants (the app prevents circular trees). Dragging a folder moves the entire subtree including all notes.

**CRDT merge behaviour.** If Device A renames folder "Work" to "Job" while offline, and Device B renames "Work" to "Career" while offline, and both sync, the later timestamp wins and you will see one folder with the newer name. No folder duplication occurs.

**Folder icons.** Folders display a default closed/open icon. Custom folder icons are not available in the current release. [NEEDS-VERIFY: icon customisation]

**Workspace folders.** In a Team or Enterprise workspace, folders are stored in the workspace namespace. All workspace members see the same folder tree (it is part of the shared encrypted CRDT state). Only Admins and Owners can delete top-level workspace folders.

**Spaces and folders.** Each Space has its own independent folder tree. Folders in Space A are invisible from Space B and from the default vault.

---

## Platform differences

| Feature | Windows (Electron) | Android (Capacitor) | Web (PWA) |
|---|---|---|---|
| Folder navigation | Left sidebar tree | Folder Strip pills + hamburger menu | Left sidebar tree |
| Create folder | Right-click → New folder, or Cmd+K | + pill in Folder Strip or menu | Right-click → New folder |
| Rename | Right-click → Rename or F2 | Long-press → Rename | Right-click → Rename |
| Delete | Right-click → Delete | Long-press → Delete | Right-click → Delete |
| Drag-and-drop notes | Yes (drag from list to sidebar) | No (use Move to action) | Yes (drag from list to sidebar) |
| Drag-and-drop folder reorder | Yes | No | Yes |
| Keyboard navigation | Full arrow-key + F2 + Delete | N/A | Full arrow-key navigation |
| Nested folder display | Expandable tree | Drill-down navigation | Expandable tree |
| Folder Strip | No | Yes (horizontal scroll) | No |

---

## Plan availability

Folders are available on all plans. Folder sync (CRDT replication across devices) requires a sync-enabled plan.

| Plan | Folders | Folder sync |
|---|---|---|
| Local | Yes | No (single device) |
| Guardian | Yes | Yes (up to 3 devices) |
| Vault | Yes | Yes (up to 8 devices) |
| Lifetime | Yes | Yes (up to 8 devices) |
| Team | Yes | Yes (workspace, all members) |
| Enterprise | Yes | Yes (unlimited) |

---

## Permissions and roles

**Personal vault:** Full create/rename/delete/move access for the vault owner.

**Workspace:**
- **Member** — can create sub-folders inside folders they have write access to; cannot delete shared top-level folders.
- **Admin** — full folder CRUD including top-level folders.
- **Owner** — same as Admin plus the ability to restructure the root folder tree.

---

## Security implications

Folder names and the entire tree structure are encrypted inside the vault-encrypted CRDT payload. The Cloudflare Worker stores an opaque ciphertext blob under the `folder_tree` object type. The server can see that a folder-tree object was updated (object_id, timestamp, sequence number) but cannot read any folder name or nesting structure.

Because folders are stored as a single CRDT blob (not one row per folder), the server cannot even count the number of folders you have. The entire folder tree is one encrypted object.

---

## Settings reference

| Setting | Location | Default | Description |
|---|---|---|---|
| Default folder for new notes | Settings → Notes → Default folder | Root (Unfiled) | Where Quick Capture and new notes land unless overridden |
| Show empty folders | Settings → Sidebar | On | Whether to display folders that contain no notes |
| Folder Strip on Android | Settings → Mobile → Folder Strip | On | Toggle the horizontal pill row at the top of the note list |
| Auto-expand folder on note open | Settings → Sidebar | On | Expands the folder in the sidebar when the active note's folder changes |

---

## Related articles

- [Tags](tags.md) — cross-cutting labels as a complement to folder containment
- [Search](search.md) — search within a specific folder using `folder:` operator
- [Collections](collections.md) — named curated note sets independent of folder structure
- [Trash and purge](trash-and-purge.md) — what happens to notes when a folder is deleted
- [Spaces](spaces.md) — top-level encrypted partitions, each with its own folder tree
- [Quick capture](quick-capture.md) — configuring the default folder for captured notes

---

## Source references

- `src/renderer/src/components/FolderTree.tsx` — desktop sidebar folder tree
- `mobile/src/components/FolderStrip.tsx` — Android horizontal folder pill strip
- `src/shared/folderTypes.ts` — `FolderNode`, `FolderCRDT` type definitions
- `src/renderer/src/hooks/useFolderCRDT.ts` — CRDT merge logic
- `private-sync-worker/migrations/0001_init.sql` — `sync_objects` table; folder tree stored with `object_type = 'folder_tree'`
