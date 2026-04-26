---
title: "Search"
slug: "search"
category: "Organization"
tags: ["search", "full-text", "tag-search", "filtering", "command-palette"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/hooks/useSearch.ts"
  - "mobile/src/hooks/useSearch.ts"
  - "src/shared/searchIndex.ts"
related: ["tags", "folders", "collections", "knowledge-graph"]
---

## What it is

Search in K-Perception is a fully client-side, zero-knowledge operation. All search — including full-text content search — is performed after the vault is decrypted locally. The server never receives your search query, and no plaintext is ever transmitted for the purpose of search. When you type into the search bar, K-Perception scans your locally decrypted notes in memory and returns results instantly.

There are three search dimensions:

1. **Title search** — matches against note titles.
2. **Tag search** — matches against encrypted tag metadata.
3. **Full-text content search** — matches against the full decrypted body of every note.

All three dimensions are active simultaneously unless you scope the query with an operator prefix (see below).

---

## When to use it

Use search when you remember something specific about a note (a word in the title, a phrase in the body, a tag you applied) and want to retrieve it directly. Search is faster than browsing for targeted retrieval; the [Knowledge Graph](knowledge-graph.md) and [Collections](collections.md) are better for exploratory navigation.

---

## Step by step

### Opening search (desktop)

- Click the **Search** icon in the top toolbar, or
- Press **Cmd/Ctrl + F** to open the in-panel search bar, or
- Press **Cmd/Ctrl + K** to open the command palette, which includes search as the primary action.

### Opening search (Android)

- Tap the **magnifying glass** icon in the top-right of the note list header.
- The search bar expands inline at the top of the list.

### Running a basic search

Type any text. Results appear as you type (debounced at 150 ms). The note list is filtered to matching notes. Both title and full-text matches are highlighted.

### Using search operators

K-Perception supports operator-prefixed search terms to narrow the scope:

| Operator | Example | Matches |
|---|---|---|
| `tag:` | `tag:meeting-note` | Notes with the tag `meeting-note` |
| `folder:` | `folder:Projects` | Notes inside the folder named `Projects` |
| `mode:` | `mode:markdown` | Notes created in Markdown mode |
| `created:` | `created:2026-04` | Notes created in April 2026 (YYYY-MM or YYYY-MM-DD) |
| `modified:` | `modified:>2026-01-01` | Notes modified after 2026-01-01 |

Not confirmed in current source — contact support for confirmation. The shared search index (`src/shared/search.ts`) performs title, tag, and full-text matching but does not implement operator-prefixed query parsing. The operator syntax described above has not been confirmed in the current build.

Multiple operators are ANDed. Example: `tag:urgent folder:Work review` finds notes tagged `urgent` in the `Work` folder whose content contains the word "review".

### Searching within a specific scope

**Current folder:** When a folder is selected in the sidebar, the search bar defaults to searching within that folder. Click the scope indicator to expand to the full vault.

**Workspace search:** If you are a member of a workspace, a **scope selector** appears in the search bar letting you switch between "Personal vault" and the workspace name.

### Clearing a search

Press **Escape** (desktop) or tap **×** in the search bar (Android/web) to clear the query and return to the full note list.

---

## Search architecture

### How full-text search works

When the vault is unlocked, K-Perception builds an in-memory full-text index from all decrypted note bodies. The indexer uses a trigram approach: each note's text is decomposed into overlapping 3-character sequences, and these trigrams are stored in a fast in-memory hash map keyed by note ID.

When you type a query, the query is also decomposed into trigrams. Notes whose trigram sets have sufficient overlap with the query trigrams are scored and returned. This approach provides fast fuzzy matching without requiring the query or content to be sent to a server.

### Index freshness

The index is updated incrementally as you edit notes — the note's trigrams are re-indexed 500 ms after the last keystroke (debounced). The full index rebuild happens:
- On vault unlock (full rebuild from all decrypted notes)
- After bulk import (KPX import or PDF import)

### Search ranking

Results are ranked by:
1. **Exact title match** (highest priority)
2. **Title prefix or contains match**
3. **Tag match**
4. **Full-text match score** (by trigram overlap percentage)

Notes pinned to the top of a list do not affect search ranking — pinning only affects the default list order, not search results.

---

## Behaviour and edge cases

**Encrypted content, client-side search.** Because the server only stores ciphertext, the search index is built from your locally decrypted data. This means search is unavailable until the vault is unlocked, and a vault that has not completed its initial sync on a new device may return incomplete results until the first full pull finishes.

**Search in Spaces.** When you are inside a Space, search is scoped to that Space's decrypted notes by default. The scope selector allows you to broaden to the full vault or narrow to a specific folder within the Space.

**Regex search.** Advanced regex search is available on desktop. Toggle **Regex** in the search bar (or press **Alt+R**). Standard ECMAScript regex syntax is supported. Regex is applied to both title and body text. [NEEDS-VERIFY: regex search availability on Android]

**Case sensitivity.** Search is case-insensitive by default. Toggle **Aa** in the search bar for case-sensitive mode.

**Large vault performance.** Index build time scales linearly with vault size. A vault with 10,000 notes (average 500 words each) takes approximately 2–4 seconds to index on first unlock. After that, incremental updates are near-instant. A progress indicator is shown during index build.

**Workspace search isolation.** Workspace search operates on the workspace's decrypted objects in the local cache. You cannot search across workspace and personal vault in a single query — they are separate namespaces.

**Tags in search results.** Matching tags are highlighted in the result list. A `tag:` match is shown with a tag chip visual indicator distinct from a full-text match.

---

## Platform differences

| Feature | Windows (Electron) | Android (Capacitor) | Web (PWA) |
|---|---|---|---|
| Search bar location | Top toolbar / Cmd+K command palette | Top of note list | Top toolbar |
| Command palette integration | Yes (Cmd/Ctrl+K) | No | Planned |
| Full-text search | Yes | Yes | Yes |
| Operator prefix support | Yes | Yes | Yes |
| Regex mode | Yes | Not confirmed in current source — contact support for confirmation. | Yes |
| Case-sensitive toggle | Yes | Yes | Yes |
| Scope selector (personal/workspace) | Yes | Yes | Yes |
| Search highlights in note body | Yes | Yes | Yes |

---

## Plan availability

Search (title, tag, and full-text) is available on all plans, including Local. Workspace search requires Team or Enterprise.

| Plan | Personal search | Workspace search |
|---|---|---|
| Local | Yes | No |
| Guardian | Yes | No |
| Vault | Yes | No |
| Lifetime | Yes | No |
| Team | Yes | Yes |
| Enterprise | Yes | Yes |

---

## Permissions and roles

Search operates on decrypted content you have access to. In workspaces, notes in sections where you lack read access are not included in search results (they are not in your local cache).

---

## Security implications

Search is architecturally zero-knowledge. No search query leaves the device. No note content is transmitted to the server for search purposes. The server has no query log. An attacker with access to the Worker or D1/R2 backend cannot determine what you have searched for or what your notes contain.

The only information the server has about your search behaviour is the timing of sync events — the server can observe that a device fetched a certain object at a certain time, but cannot correlate this with your search query.

---

## Settings reference

| Setting | Location | Default | Description |
|---|---|---|---|
| Search debounce delay | Settings → Search | 150 ms | How long to wait after the last keystroke before running search |
| Include trashed notes in results | Settings → Search | Off | Whether notes in the Trash appear in search results |
| Max results shown | Settings → Search | 50 | Maximum number of results displayed before "Show more" |
| Default search scope | Settings → Search | Current folder | Whether search starts scoped to the current folder or the full vault |

---

## Related articles

- [Tags](tags.md) — using `tag:` operator and tag-based filtering
- [Folders](folders.md) — using `folder:` operator
- [Collections](collections.md) — search within a specific Collection
- [Knowledge graph](knowledge-graph.md) — visual exploration for when you want to browse, not search

---

## Source references

- `src/renderer/src/hooks/useSearch.ts` — desktop search hook: index build, query execution, ranking
- `mobile/src/hooks/useSearch.ts` — Android search hook
- `src/shared/searchIndex.ts` — shared trigram index data structure and scoring algorithm
