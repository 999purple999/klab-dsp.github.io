---
title: "File version history"
slug: "file-versioning"
category: "Workspaces"
tags: ["versioning", "files", "history", "workspace"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0028_file_versions.sql"
  - "private-sync-worker/src/workspaces.ts"
related: ["workspaces/files-and-directories", "workspaces/per-file-acl", "editors/revision-history"]
---

# File version history

## What it is

Every upload to a workspace file creates an immutable new version. Previous versions are retained in Cloudflare R2, allowing you to restore any past state of a file without losing the history. Version metadata is stored in D1 (migration `0028_file_versions.sql`).

## When to use it

- A colleague uploaded a revised contract and you need the previous version.
- A dataset was updated and you need to compare with last week's version.
- An image was accidentally overwritten and needs to be recovered.

## Step by step

1. Open the workspace → **Files** tab.
2. Click the file name to open the **File detail panel**.
3. Switch to the **Versions** tab.
4. The version list shows all versions in reverse chronological order: version number, uploaded by, uploaded at, size.
5. Click a version to preview it (for images: thumbnail; for PDFs: inline viewer; for other types: metadata only).
6. To restore: click **Restore this version**. A new version is created pointing to the restored blob (the history is preserved).
7. To download a specific version: click the download icon next to it.

![File detail panel showing version history tab](../assets/file-versioning-1.png)

## Version schema

Migration `0028_file_versions.sql` adds to the files table:

| Column | Type | Description |
|---|---|---|
| `file_id` | TEXT | UUID of the file |
| `version_number` | INTEGER | Monotonically increasing |
| `r2_blob_key` | TEXT | R2 path for this version's blob |
| `wrapped_dek` | TEXT | Wrapped DEK for this version's blob |
| `size_bytes` | INTEGER | Encrypted blob size |
| `uploaded_by` | TEXT | user_id of uploader |
| `uploaded_at` | TEXT | ISO8601 timestamp |

## Behaviour and edge cases

- **Version creation:** Every `PUT /workspace/{wsId}/files/{fileId}` creates a new version entry. There is no API to overwrite a version in place.
- **Current version:** The latest version_number is the "current" version. This is what members download by default.
- **Storage cost:** Each version is a separate R2 blob consuming quota. A file with 10 versions consumes 10× the storage.
- **Version limit:** There is no confirmed hard limit on the number of versions. Contact support for confirmation. However, older versions consume quota.
- **Deleting versions:** Whether workspace admins can delete specific old versions from the Versions tab is not confirmed in the current source. Contact support for confirmation. Deleting a version marks its R2 blob for garbage collection.
- **Restoring a version:** Creates a new version entry pointing to the existing blob of the restored version — no re-upload, no re-encryption needed. The new version number is `max(version_number) + 1`.
- **DEK for restored version:** The restored version uses the wrapped DEK of the original version. Whether re-wrapping is required after a section key rotation is not confirmed in the current source. Contact support for confirmation.
- **Diff between versions:** Binary diff or text diff views are not currently supported [NEEDS-IMPL-DECISION].

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Version history panel | File detail panel → Versions tab | Mobile file detail sheet | File detail panel → Versions tab |
| Version preview | Yes | Yes (images, PDFs) | Yes |
| Restore version | Yes | Yes | Yes |
| Download specific version | Yes | Yes | Yes |

## Plan availability

File versioning requires Team or Enterprise plan.

## Permissions and roles

| Role | Can view versions | Can restore | Can delete versions |
|---|---|---|---|
| editor | Yes | Yes (if Edit on file) | No |
| Admin | Yes | Yes | Yes |

## Security implications

Each version is an independent encrypted blob. Restoring a version does not decrypt or re-encrypt data — the R2 blob is the same bytes. The wrapped DEK for each version is stored in D1 alongside the version metadata. An attacker who compromises D1 sees wrapped DEKs (unreadable without SK_dir) and version metadata (file IDs, sizes, timestamps — no content).

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Show version history | Enabled | Not configurable |
| Auto-delete old versions | Disabled | Not configurable |

## Related articles

- [Files and directories](files-and-directories.md)
- [Per-file ACL](per-file-acl.md)
- [Revision history (personal notes)](../editors/revision-history.md)

## Source references

- `private-sync-worker/migrations/0028_file_versions.sql` — version schema
- `private-sync-worker/src/workspaces.ts` — file upload + version routes
