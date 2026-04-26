---
title: "Workspace citations"
slug: "citations"
category: "Workspaces"
tags: ["citations", "references", "editorial", "workspace"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0023_citations_presence.sql"
  - "src/renderer/src/workspace/"
related: ["editors/editorial", "editors/slash-commands", "workspaces/overview"]
---

# Workspace citations

## What it is

The workspace citation registry is a shared, encrypted database of structured citations — journal articles, books, reports, URLs — that all workspace members can reference in their documents. Citations are encrypted with a key derived from the workspace section key.

The registry was introduced in migration `0023_citations_presence.sql` alongside the presence system.

## When to use it

- A research team sharing a citation library across multiple papers and reports.
- Legal teams maintaining a shared case law reference database.
- Editorial teams with a standard reference list for publications.

## Step by step

### Adding a citation

1. Open the workspace → **Citations** panel (accessible from the workspace sidebar or from the Editorial editor).
2. Click **Add citation**.
3. Fill in the fields: authors, title, year, journal/publisher, DOI, URL, notes.
4. Click **Save**. The citation is encrypted and stored.

### Inserting a citation into a document

1. In the Editorial editor (or Docs editor), type `/citation`.
2. The **CitationPicker** opens showing all citations in the workspace registry.
3. Search or browse to find the desired citation.
4. Click it to insert a formatted inline reference.
5. The citation auto-generates in the document's bibliography section on export.

## Behaviour and edge cases

- **Citation formats:** Configured citation style formats (APA, MLA, Chicago) are not confirmed in the current source. Contact support for confirmation.
- **BibTeX import:** Importing `.bib` files is not currently implemented.
- **Deduplication:** Active citation pairs `(workspace, from_uri, to_uri)` are deduplicated by a unique partial index (`WHERE deleted_at IS NULL`). The same URI pair cannot be added twice while active; tombstoned pairs may be re-added after deletion.
- **Shared registry:** All workspace members with section access can read citations. Admins can delete any citation; members can delete their own.
- **Encryption:** Citation content (titles, authors, URLs) encrypted with SK_section-derived key. DOIs and URLs are not stored in plaintext on the server.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Citations panel | Sidebar panel | Bottom sheet | Sidebar panel |
| CitationPicker in editor | /citation slash command | /citation slash command | /citation slash command |
| Add citation form | Full form | Simplified form | Full form |

## Plan availability

Workspace citations require Team or Enterprise.

## Permissions and roles

| Role | Can view | Can add | Can delete |
|---|---|---|---|
| editor | Yes | Yes | Own citations only |
| Admin | Yes | Yes | All |

## Security implications

Citation data encrypted with section key. Server stores only ciphertext.

## Settings reference

No configurable settings for citations.

## Related articles

- [Editorial editor](../editors/editorial.md)
- [Slash commands](../editors/slash-commands.md)
- [Workspace overview](overview.md)

## Source references

- `private-sync-worker/migrations/0023_citations_presence.sql` — citations schema
