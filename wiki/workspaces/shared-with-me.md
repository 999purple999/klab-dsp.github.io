---
title: "Shared with me"
slug: "shared-with-me"
category: "Workspaces"
tags: ["sharing", "files", "cross-workspace", "access"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0029_file_acl.sql"
  - "private-sync-worker/migrations/0031_notifications.sql"
related: ["workspaces/per-file-acl", "workspaces/files-and-directories", "workspaces/overview"]
---

# Shared with me

## What it is

"Shared with me" is a dedicated view showing files that other workspace members have shared directly with you via per-file ACL. It aggregates files shared across all your workspaces so you can find shared content without navigating each workspace individually.

## When to use it

- A colleague shared a specific document with you and you cannot remember which workspace it is in.
- You want to see all files explicitly shared with you (not just files you have section-level access to).
- A client or external collaborator added you to a specific file in a workspace you are otherwise not a member of.

## Step by step

### Desktop

1. In the workspace shell, click the **Shared** tab in the left sidebar (below the workspace name).
2. The **WorkspaceHomeSurface** shows the shared-with-me list.
3. Files are grouped by workspace. Each entry shows: file name, workspace name, sharer's display name, shared date, your permission level.
4. Click a file to open it in the file detail panel or download it.

### Mobile (Android)

1. Open the workspace.
2. Tap the **Files** icon → **Shared** tab.
3. The **MobileFilesSurface** shared tab lists files shared with you.
4. Tap a file to view or download.

![Shared with me view showing files from multiple workspaces](../assets/shared-with-me-1.png)

## Behaviour and edge cases

- **What appears here:** Only files explicitly shared with you via per-file ACL (user-level or group-level entries). Files you can access via section membership alone do NOT appear here — only explicitly shared items.
- **Cross-workspace:** Shared-with-me aggregates across all workspaces you are connected to, even if your role in some of those workspaces is Guest or you only have access to specific files.
- **Revocation:** If the sharer removes your ACL entry, the file disappears from your shared-with-me list on next sync.
- **Notification:** When a file is shared with you, you receive a notification (bell icon / notification tab). See migration `0031_notifications.sql`.
- **Permission indicator:** Each file in the list shows your permission level (View / Edit / Admin).
- **File deleted:** If the file is deleted by the owner, it disappears from your shared-with-me list. No broken entries are shown.
- **Downloads:** Click/tap to download. The file is decrypted on-device (using SK_dir-derived DEK) before saving.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| UI location | WorkspaceHomeSurface → Shared tab | MobileFilesSurface → Shared tab | WorkspaceHomeSurface → Shared tab |
| Grouping | By workspace | By workspace | By workspace |
| File detail panel | Full 4-tab panel | Simplified sheet | Full 4-tab panel |
| Notification on share | Bell icon | Not confirmed in current source — contact support for confirmation. | Bell icon |

## Plan availability

Shared-with-me requires Team or Enterprise plan.

## Permissions and roles

Any workspace member (including Guest) can receive shared files. The permissions you have on each file are shown in the shared-with-me list.

## Security implications

The shared-with-me list is assembled from D1 ACL entries. The server knows which user_ids are in each file's ACL. File names and content remain encrypted — the shared-with-me list shows encrypted metadata (which is decrypted on-device).

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Notifications on new shares | Enabled | Account settings → Notifications |

## Related articles

- [Per-file ACL](per-file-acl.md)
- [Files and directories](files-and-directories.md)
- [Workspace overview](overview.md)

## Source references

- `private-sync-worker/migrations/0029_file_acl.sql` — per-file ACL schema
- `private-sync-worker/migrations/0031_notifications.sql` — notifications schema
