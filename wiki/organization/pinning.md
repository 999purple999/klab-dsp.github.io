---
title: "Pinning Notes"
slug: "pinning"
category: "Organization"
tags: ["pin", "pinning", "note-list", "organization", "quick-access"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/noteTypes.ts"
  - "src/renderer/src/components/NoteList.tsx"
  - "mobile/src/components/NoteList.tsx"
related: ["folders", "tags", "collections", "trash-and-purge", "search"]
---

## What it is

Pinning a note causes it to float to the top of any note list view, above all un-pinned notes. Pinned notes are visually distinguished with a pin icon and remain at the top regardless of the active sort order (date, title, or modified).

Pin state is stored as a boolean field (`pinned: true`) in the note's encrypted metadata object. It is therefore encrypted at rest alongside all other note metadata — the server cannot determine which notes you have pinned. Pin state is synced across devices via the standard encrypted sync queue, so a note you pin on your phone will appear pinned on your desktop after the next sync.

---

## When to use it

Pin notes you access constantly and want to reach without scrolling or searching:

- **Daily log or today's note** — pin the current day's journal entry so it is always at the top of your inbox.
- **Active project brief** — pin the main reference note for the project you are currently working on.
- **Quick reference** — pin a note containing passwords (inside a Space), a cheat sheet, or a template you copy frequently.
- **In-progress drafts** — pin unfinished notes so they are visually prominent.

Pinning is distinct from adding to a Collection or tagging. It is purely a sort-position override and does not affect folder membership, tag assignment, or Collection membership. Think of it as "sticky note" semantics rather than a category.

---

## Step by step

### Pinning a note (desktop)

1. In the note list, **right-click** the note you want to pin.
2. Select **Pin to top** from the context menu.
3. The note moves to the pinned section at the top of the list immediately.

Alternatively, with the note open in the editor, click the **pin icon** (📌-shaped button) in the editor toolbar.

Keyboard shortcut: select a note in the list and press **P** (when the list has keyboard focus and no text input is active).

### Pinning a note (Android)

1. In the note list, **long-press** the note you want to pin.
2. The note enters selection mode and a contextual action toolbar appears at the bottom.
3. Tap **Pin** in the toolbar.

Alternatively, open the note, tap the **⋮ (more)** menu in the top-right corner, then tap **Pin to top**.

### Unpinning a note

Repeat the same action used to pin it:

- **Desktop:** Right-click → **Unpin**, or click the filled pin icon in the editor toolbar, or press **P** on the selected note.
- **Android:** Long-press → contextual toolbar → **Unpin**, or open the note → **⋮** → **Unpin to top**.

### Pinning multiple notes

You can pin as many notes as you like. Pinned notes sort among themselves by the active sort order (e.g., pinned notes are sorted by modification date among each other at the top of the list).

---

## Behaviour and edge cases

**Maximum pinned notes.** There is no enforced maximum on how many notes you can pin. However, if a large number of notes are pinned (more than the visible list height), the pinned section scrolls along with the rest of the list — it does not create a sticky frozen section that never scrolls. The only guarantee is that all pinned notes appear above all un-pinned notes. [NEEDS-VERIFY: sticky vs scroll behaviour for pinned section]

**Pin state across list contexts.** A note pinned in the "All Notes" view is also pinned in its folder view, its tag filter view, and any Collection list view that includes it. Pin state is a property of the note, not of a particular view.

**Pinned notes in search results.** Search results do not respect pin order — they are sorted by relevance score. Pinned notes still appear in search results normally but are not floated to the top of search output.

**Pinned notes and sort order.** Within the pinned group, notes are sorted by the current list sort key (modification date by default). If you switch sort order to "Title A-Z", pinned notes sort alphabetically among themselves, still above all un-pinned notes.

**Pinned notes in trash.** If you trash a pinned note, it moves to the Trash. In the Trash folder view, pinned state is preserved (the note still shows the pin icon in the Trash list), but this has no practical effect since Trash is not used for normal work. On restore, the note returns to its folder with pin state intact.

**Sync of pin state.** Pin state is included in the note's encrypted metadata payload. Changes to pin state are added to the sync queue like any other note edit and propagate to all devices within one sync cycle (typically under 30 seconds on mobile, immediately on desktop via push).

**Difference between pin and starred / favourite.** In the current release, pin and star are the same mechanism — there is a single `pinned` field. The UI may label it as "pin" in some views and "favourite" in others, but they control the same flag. [NEEDS-VERIFY: whether pin and star/favourite are unified or separate fields]

---

## Platform differences

| Feature | Windows (Electron) | Android (Capacitor) | Web (PWA) |
|---|---|---|---|
| Pin via right-click | Yes | No | Yes |
| Pin via long-press | No | Yes | No |
| Pin via editor toolbar icon | Yes | Yes (⋮ menu) | Yes |
| Keyboard shortcut (P) | Yes | No | Yes |
| Pinned section visual indicator | Pin icon + shaded row | Pin icon + shaded row | Pin icon + shaded row |
| Sync pin state across devices | Yes | Yes | Yes |

---

## Plan availability

Pinning is available on all plans. Sync of pin state requires a sync-enabled plan.

| Plan | Pinning | Pin state sync |
|---|---|---|
| Local | Yes | No (single device) |
| Guardian | Yes | Yes (up to 3 devices) |
| Vault | Yes | Yes (up to 8 devices) |
| Lifetime | Yes | Yes (up to 8 devices) |
| Team | Yes | Yes (workspace, all members) |
| Enterprise | Yes | Yes (unlimited) |

---

## Permissions and roles

**Personal vault:** Only the vault owner can pin or unpin notes.

**Workspace:** Any workspace member with write access to a note can pin it. Pin state in a workspace is shared — if one member pins a note, all members see it pinned. Workspace Admins can override pin state for any note in the workspace.

---

## Security implications

The `pinned` boolean is part of the encrypted note metadata blob. The server cannot determine which of your notes are pinned. Pin state changes are included in the same ciphertext payload update as any other metadata change — there is no separate, observable "pin" event at the network level.

---

## Settings reference

There are no global settings for pinning beyond the pin action itself. Per-note pin state is set directly on the note.

| Feature | Notes |
|---|---|
| Pin state storage | Encrypted in note metadata (`pinned` field) |
| Pin state sync | Via standard sync queue (same as all note edits) |
| Maximum pins | Unlimited [NEEDS-VERIFY: soft limit in UI] |

---

## Related articles

- [Folders](folders.md) — primary containment; pinning is independent of folder
- [Tags](tags.md) — use tags for cross-cutting categorisation; use pins for top-of-list prominence
- [Collections](collections.md) — curate sets; pin individual notes for quick access within any list
- [Search](search.md) — pinned notes do not affect search ranking
- [Trash and purge](trash-and-purge.md) — pin state preserved through trash and restore

---

## Source references

- `src/shared/noteTypes.ts` — `NoteMetadata.pinned: boolean` field definition
- `src/renderer/src/components/NoteList.tsx` — desktop list sorting logic (pinned notes hoisted)
- `mobile/src/components/NoteList.tsx` — Android list sorting logic
- `private-sync-worker/migrations/0001_init.sql` — `sync_objects` table; pin state stored in encrypted payload column
