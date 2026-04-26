---
title: "Files and directories"
slug: "files-and-directories"
category: "Workspaces"
tags: ["files", "directories", "encryption", "dek", "workspace"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/workspaceKeyManager.ts"
  - "private-sync-worker/migrations/0020_file_dek_refactor.sql"
  - "src/renderer/src/workspace/files/FilesSurface.tsx"
related: ["workspaces/overview", "workspaces/sections", "workspaces/file-versioning", "workspaces/per-file-acl"]
---

# Files and directories

## What it is

The workspace file system is a hierarchical tree of directories containing encrypted file blobs. Each file is encrypted with its own per-file Data Encryption Key (DEK), derived from or wrapped by the section key. The DEK approach means revoking access to one directory requires only rotating that directory's key — not re-encrypting the entire workspace.

The key derivation chain is:

```
WDK (Workspace Data Key)
  ↓ HKDF
SK_section (Section Key for the files section)
  ↓ HKDF
SK_dir (Directory Key)
  ↓ wrap (AES-KW)
DEK (Data Encryption Key — per file blob)
  ↓ AES-256-GCM encrypt
Ciphertext → Cloudflare R2
```

## When to use it

- Store project documents, datasets, or media that multiple team members need to access.
- Build a shared file library for a department or project.
- Share individual files with specific members via per-file ACL without exposing the whole workspace.

## Step by step

### Uploading a file

1. Open the workspace → **Files** tab.
2. Navigate to the desired directory (or create one: right-click → New folder).
3. Click **Upload** or drag files from your desktop into the directory panel.
4. The file is encrypted locally: a random DEK is generated → the file blob is AES-256-GCM encrypted with that DEK → the DEK is wrapped with SK_dir → both ciphertext and wrapped DEK are uploaded to R2.
5. The file appears in the directory with its name, size, and uploader.

### Creating directories

1. In the Files tab, right-click the parent directory → **New folder**.
2. Enter the folder name.
3. The folder is provisioned in D1. A directory key (SK_dir) is HKDF-derived from SK_section.

### Downloading a file

1. Click the file name or the download icon.
2. The app fetches the encrypted blob from R2 and decrypts it on-device (unwrap DEK with SK_dir → decrypt blob with DEK).
3. The decrypted file is saved to your local device.

### Inserting a file reference into a document

1. In a Docs or Editorial editor, type `/file`.
2. The **FileCitePicker** dialog opens, showing the workspace file tree.
3. Select a file. A `~kp://w/{wsId}/f/{fileId}` URI is inserted inline.
4. The URI renders as a clickable link that downloads/opens the file.

![Workspace file browser with directory tree](../assets/files-and-directories-1.png)

## Key modes

| keyMode | Description |
|---|---|
| `derived-v1` | Legacy: DEK is HKDF-derived from SK_dir + file ID. No separate wrapped key stored. |
| `wrapped-dek-v1` | Current: Random DEK wrapped with AES-KW using SK_dir. Allows per-file key rotation without re-upload. |

All new uploads use `wrapped-dek-v1`. Old `derived-v1` blobs remain accessible and are migrated on next download+re-upload.

## Auto-provisioned files section

When a workspace is created, a section named `files-{wsId.slice(0,8)}` is automatically provisioned. This is the default section for all uploaded files. The section cannot be deleted while any files exist in it.

## Promote-from-personal flow

You can promote a personal note attachment into the workspace files section:

1. Open a note with an attachment.
2. Right-click the attachment in the AttachmentStrip → **Move to workspace**.
3. Select the workspace and directory.
4. The blob is re-encrypted with the workspace SK_dir-derived DEK and uploaded to R2. The personal copy is removed.

## Behaviour and edge cases

- **Quota:** File blobs count against the workspace quota (Team: 100 GB shared, Enterprise: unlimited).
- **413 enforcement:** Uploads exceeding quota are rejected. See [413 enforcement](../sync-and-storage/413-enforcement.md).
- **File name encryption:** File names are encrypted as part of the file metadata blob, not stored in plaintext in D1.
- **Directory ACL:** Each directory can have an explicit ACL. If no ACL is set on a file, the parent directory's ACL applies recursively.
- **Empty directories:** Deleting all files from a directory does not auto-delete the directory.
- **Large files:** Files are uploaded in a single request. Chunked upload for very large files is not implemented [NEEDS-IMPL-DECISION].

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| File browser UI | FilesSurface (full tree) | MobileFilesSurface | FilesSurface |
| Drag-and-drop upload | Yes | No (use Files app) | Yes |
| FileCitePicker in editor | Yes | Yes | Yes |
| Download to device | OS file dialog | Downloads folder | Browser download |

## Plan availability

Files and directories require Team or Enterprise plan.

## Permissions and roles

| Role | Can upload | Can download | Can delete | Can manage ACL |
|---|---|---|---|---|
| editor | Yes (default section) | Yes (if ACL allows) | Own uploads only | No |
| Admin | Yes | Yes | Yes | Yes |
| Guest | No | Yes (if explicitly granted) | No | No |

## Security implications

Every file blob is encrypted on-device before upload. The server stores only ciphertext and the wrapped DEK. An attacker who compromises R2 obtains encrypted blobs. Without the WDK (which only workspace members hold), the blobs cannot be decrypted.

File metadata (name, size, MIME type) is encrypted in the file metadata blob. The server can see the existence of files and their sizes, but not their names or contents.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Default upload directory | Root files section | Files tab context menu |
| Key mode for new uploads | `wrapped-dek-v1` | Not user-configurable |

## Related articles

- [Sections](sections.md)
- [File versioning](file-versioning.md)
- [Per-file ACL](per-file-acl.md)
- [Workspace overview](overview.md)

## Source references

- `src/shared/workspaceKeyManager.ts` — key hierarchy management
- `private-sync-worker/migrations/0020_file_dek_refactor.sql` — DEK refactor schema
- `src/renderer/src/workspace/files/FilesSurface.tsx` — file browser UI
