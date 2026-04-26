---
title: "Tags"
slug: "tags"
category: "Organization"
tags: ["tags", "metadata", "search", "organization", "filtering"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/TagEditor.tsx"
  - "src/shared/noteTypes.ts"
  - "mobile/src/components/TagEditor.tsx"
related: ["folders", "search", "collections", "spaces"]
---

## What it is

Tags are short, user-defined labels you attach to notes to describe their topic, status, project, or any other classification that matters to you. Unlike folders, a single note can carry any number of tags simultaneously — and the same tag can span notes in completely different folders or Spaces.

In K-Perception every tag is stored as part of the note's encrypted metadata payload. The server never sees your tag text in plaintext: tags are encrypted with your vault key before they leave the device, so neither Cloudflare Workers nor R2 storage can read them. Tag lookup and filtering are performed entirely client-side after decryption.

Tags are free-form: there is no central registry. You define them as you type. When you start typing a tag name, the editor surfaces autocomplete suggestions drawn from the complete set of tags already present in your decrypted local vault. This means suggestions load instantly with no network round-trip.

---

## When to use it

Use tags when a note legitimately belongs to more than one category, or when the dimension you want to track does not map cleanly to a folder hierarchy. Common patterns include:

- **Status tags** — `inbox`, `review`, `done`, `archived`
- **Project tags** — `project/alpha`, `project/beta` (hierarchical slash notation supported; see below)
- **Type tags** — `meeting-note`, `recipe`, `reference`, `daily-log`
- **Priority tags** — `urgent`, `low-priority`
- **Person tags** — `@alice`, `@bob`

If you find yourself creating many folders primarily to distinguish topic, tags are usually a better fit. If you need strict containment and hierarchical browsing, combine tags with folders.

---

## Step by step

### Adding a tag to a note (desktop)

1. Open a note in the editor.
2. Click the **Tags** field below the note title (or press the keyboard shortcut **T** while the editor has focus and the cursor is not inside the writing area).
3. Type the tag name. A dropdown appears showing matching existing tags.
4. Press **Enter** or click a suggestion to confirm. Repeat for additional tags.
5. Tags save automatically as part of the note — there is no separate save action.

### Adding a tag to a note (Android)

1. Open a note.
2. Tap the **⋮ (more)** menu in the top-right corner, then tap **Edit tags**.
3. The tag editor panel slides up from the bottom.
4. Type a tag name. Matching suggestions appear as chips above the keyboard.
5. Tap a suggestion or tap **Add** / press the enter key on the software keyboard to confirm.
6. Tap outside the panel or press the back gesture to dismiss.

### Removing a tag

- **Desktop:** Click the × icon on the tag chip in the tag editor, or position the cursor immediately after the tag name and press **Backspace**.
- **Android:** In the tag editor panel, tap the × on any tag chip.

### Browsing all tags

- **Desktop:** Open the left sidebar and select **Tags** in the navigation panel. A tag cloud or alphabetical list appears showing every tag in your vault and the note count for each.
- **Android:** Tap the **Tags** tab in the bottom navigation bar (if visible) or navigate via the hamburger menu.

### Filtering the note list by tag

1. From the note list, tap or click the **filter / funnel** icon.
2. Select one or more tags. The list immediately narrows to notes carrying all selected tags (AND logic by default).
3. To clear the filter, tap the active tag chip in the filter bar or press **Escape** on desktop.

### Using tag search

In the search bar, type `tag:meeting-note` to return only notes tagged `meeting-note`. Multiple `tag:` operators are ANDed together. See the [Search article](search.md) for the full operator reference.

---

## Behaviour and edge cases

**Autocomplete scope.** Suggestions come from your locally decrypted vault. On a brand-new device that has not yet completed an initial sync, suggestions may be empty until the first pull completes.

**Hierarchical / nested tags.** K-Perception supports slash-separated tag paths such as `project/work` or `area/health/fitness`. The tag browser renders these as a collapsible tree. A note tagged `project/work` is also implicitly reachable when you filter for `project`, so parent-level filtering cascades downward. [NEEDS-VERIFY: tree rendering in current build]

**Case sensitivity.** Tags are stored as-is but compared case-insensitively for deduplication in the autocomplete list. `Meeting` and `meeting` are treated as the same tag in suggestions; however the capitalisation you use when first creating a tag is what gets stored.

**Tag rename.** There is no global "rename tag" operation in the current release. To rename a tag, you must open each affected note and re-tag it. A bulk rename workflow is planned. [NEEDS-VERIFY: bulk rename availability]

**Tags across Spaces.** Tags do not cross Space boundaries. A tag named `urgent` inside Space A is independent from a tag named `urgent` in your default vault or Space B.

**Workspace notes.** In a Team or Enterprise workspace, tag suggestions come only from notes in that workspace's namespace. Tags are still encrypted and the server never sees them.

**Performance with large tag sets.** The autocomplete index is built in memory from the decrypted note list. Vaults with 10,000+ notes and hundreds of distinct tags may show a slight (< 200 ms) delay on first open. Subsequent lookups are near-instant because the index is cached in the renderer process until the vault is locked.

**Deletion of all tagged notes.** Deleting or trashing all notes with a given tag does not delete the tag itself from the suggestion list until the vault is reopened (the in-memory index is rebuilt on unlock).

---

## Platform differences

| Feature | Windows (Electron) | Android (Capacitor) | Web (PWA) |
|---|---|---|---|
| Tag editor location | Below note title in editor | Bottom sheet via ⋮ menu | Below note title in editor |
| Keyboard shortcut to open tag editor | **T** (editor focused, cursor outside text) | N/A | **T** (editor focused) |
| Autocomplete dropdown | Inline dropdown | Horizontal chip row above keyboard | Inline dropdown |
| Tag browse sidebar | Left nav panel → Tags | Tags tab / hamburger menu | Left nav panel → Tags |
| Nested tag tree view | Yes | Flat list with path shown | Yes |
| Bulk tag operations | Filter + multi-select + retag | Filter + multi-select + retag | Filter + multi-select + retag |

---

## Plan availability

Tags are available on all plans including Local (no sync required). Tags sync across devices on Guardian, Vault, Lifetime, Team, and Enterprise plans via the standard encrypted sync queue.

| Plan | Tags | Sync |
|---|---|---|
| Local | Yes | No (device-only) |
| Guardian | Yes | Yes (up to 3 devices) |
| Vault | Yes | Yes (up to 8 devices) |
| Lifetime | Yes | Yes (up to 8 devices) |
| Team | Yes | Yes (workspace members) |
| Enterprise | Yes | Yes (unlimited) |

---

## Permissions and roles

In personal vaults, tag read/write permission follows vault access — if you can open the vault, you can create and edit tags. In workspaces, any member who can edit a note can also edit its tags. Workspace Admins can see and filter by tags within the workspace but cannot read the plaintext tag values of other members' notes outside the workspace namespace (cross-namespace isolation applies).

---

## Security implications

Tags are part of the encrypted note metadata object. They are serialised into the same AES-256-GCM ciphertext blob as the note title and body before leaving the device. The Cloudflare Worker receives only:
- The namespace ID (account identifier)
- The object ID (opaque UUID)
- The sequence number
- The ciphertext blob

The Worker cannot index, search, or read your tags. All filtering and search is performed on the client after local decryption. A compromised server can learn that a tag *exists* (because a metadata blob was stored) but cannot learn the tag's value, the note title, or any content.

Tag data is included in KPX vault exports, re-encrypted under the export password.

---

## Settings reference

| Setting | Location | Default | Description |
|---|---|---|---|
| Show tag suggestions | Settings → Editor → Tags | On | Toggle autocomplete dropdown while typing a tag |
| Max suggestions shown | Settings → Editor → Tags | 8 | How many autocomplete results appear at once |
| Case-fold suggestions | Settings → Editor → Tags | On | Merge same-word different-case tags in suggestions |

---

## Related articles

- [Folders](folders.md) — hierarchical containment model
- [Search](search.md) — full-text and tag-based search with operators
- [Collections](collections.md) — named curated sets of notes
- [Spaces](spaces.md) — separate encrypted partitions with independent keys
- [Sync queue](../sync-and-storage/sync-queue.md) — how tag changes propagate across devices

---

## Source references

- `src/renderer/src/components/TagEditor.tsx` — desktop tag editor component
- `mobile/src/components/TagEditor.tsx` — Android tag editor bottom sheet
- `src/shared/noteTypes.ts` — `NoteMetadata` type definition including `tags: string[]`
- `src/renderer/src/hooks/useTagSuggestions.ts` — autocomplete index builder
- `private-sync-worker/migrations/0001_init.sql` — `sync_objects` schema (tags stored in payload column as ciphertext)
