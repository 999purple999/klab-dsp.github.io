---
title: "Per-file access control"
slug: "per-file-acl"
category: "Workspaces"
tags: ["acl", "permissions", "files", "access-control"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0029_file_acl.sql"
  - "private-sync-worker/src/workspaces.ts"
related: ["workspaces/files-and-directories", "workspaces/groups", "workspaces/members-and-roles"]
---

# Per-file access control

## What it is

Per-file ACL (Access Control List) lets workspace admins grant or restrict access to individual files and directories, independently of the broader section or workspace membership. Each ACL entry specifies a user or group and their permission level (View, Edit, or Admin).

## When to use it

- You want HR documents in the workspace files section to be accessible only to the HR group.
- A contractor needs access to one specific file but not the rest of the workspace.
- Sensitive files require tighter access than their directory's default.

## Step by step

1. Open the workspace → **Files** tab.
2. Click the file or directory to open the detail panel.
3. Switch to the **Permissions** tab.
4. Click **Add** to add a new ACL entry. Select:
   - **Principal:** a workspace member or group.
   - **Permission level:** View, Edit, or Admin.
5. Click **Save**.
6. The ACL change is applied immediately. Affected members' access is updated on their next action.

![File detail panel Permissions tab](../assets/per-file-acl-1.png)

## ACL resolution order

The Worker evaluates access as follows (first match wins):

1. **Explicit file ACL:** Does the file have an ACL entry for this user (directly or via group)?
2. **Parent directory ACL:** Walk up the directory tree checking each parent's ACL.
3. **Section default:** Fall back to the section's default permissions (member role → can read; admin → full access).

This means an explicit file ACL entry overrides the section default.

## Permission levels

| Level | Can read / download | Can upload / edit | Can manage ACL |
|---|---|---|---|
| View | Yes | No | No |
| Edit | Yes | Yes | No |
| Admin | Yes | Yes | Yes |

## Behaviour and edge cases

- **Group ACL:** A group (backed by SK_group ≡ SK_section) can be added as a principal. All group members inherit the group's ACL permission on the file.
- **User override:** If a user has a direct ACL entry AND is in a group with a different entry, the higher permission wins. This is confirmed by the "best-of-set logic" in the ACL resolver (`private-sync-worker/src/__tests__/waveA.test.ts`): the highest non-denied permission across all matching entries is applied.
- **ACL propagation to children:** Directory ACLs propagate downward to all files and subdirectories that do not have their own explicit ACL. This is the recursive ACL resolver.
- **Removing an ACL entry:** Removes the explicit override. Access falls back to the parent directory or section default.
- **Owner always has access:** The workspace owner always has full access to all files regardless of ACL.
- **ACL changes on active downloads:** If a user's access is revoked while they are downloading a file, the current download completes. Future requests return 403.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| ACL management UI | File detail panel | Mobile file detail sheet | File detail panel |
| Group principal picker | Yes | Yes | Yes |
| Recursive preview | Show inherited permissions | Simplified | Show inherited permissions |

## Plan availability

Per-file ACL requires Team or Enterprise plan.

## Permissions and roles

Only workspace **Admins** and the workspace **Owner** can modify file ACLs.

## Security implications

ACL entries are stored in D1. They are not encrypted (ACL entries contain user IDs and permission levels — not content). Server-side enforcement means ACL bypass via direct R2 access is still prevented by DEK wrapping: the Worker will not release a wrapped DEK to a user who fails the ACL check.

Changes to ACLs are logged in the workspace audit log (event: `file.acl.changed`).

## Settings reference

There are no settings for per-file ACL beyond what is configured in the file detail panel.

## Related articles

- [Files and directories](files-and-directories.md)
- [Groups](groups.md)
- [Members and roles](members-and-roles.md)

## Source references

- `private-sync-worker/migrations/0029_file_acl.sql` — ACL schema
- `private-sync-worker/src/workspaces.ts` — ACL check in file read/write routes
