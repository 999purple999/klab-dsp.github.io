---
title: "Members and roles"
slug: "members-and-roles"
category: "Workspaces"
tags: ["members", "roles", "permissions", "workspace"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/migrations/0011_workspace_full.sql"
related: ["workspaces/invitations", "workspaces/groups", "workspaces/admin-console"]
---

# Members and roles

## What it is

Every workspace has a membership list. Each member is assigned one of six roles: **owner**, **admin**, **editor**, **commenter**, **viewer**, or **guest**. Roles determine what actions a member can perform in the workspace.

## Roles reference

| Permission | owner | admin | editor | commenter | viewer | guest |
|---|---|---|---|---|---|---|
| Invite new members | Yes | Yes | No | No | No | No |
| Change member roles | Yes | Yes (editor/commenter/viewer/guest only) | No | No | No | No |
| Remove members | Yes | Yes | No | No | No | No |
| Access all sections | Yes | Yes | Section-based | Section-based | Section-based | Explicit ACL only |
| Create channels | Yes | Yes | Yes | No | No | No |
| Manage channel ACL | Yes | Yes | No | No | No | No |
| Create/edit notes | Yes | Yes | Yes | No | No | No |
| Add comments | Yes | Yes | Yes | Yes | No | No |
| Upload files | Yes | Yes | Yes | No | No | No |
| Download / read content | Yes | Yes | Yes | Yes | Yes | ACL only |
| Manage file ACL | Yes | Yes | No | No | No | No |
| View admin console | Yes | Yes | No | No | No | No |
| View audit log | Yes | Yes | No | No | No | No |
| Rotate workspace key | Yes | Yes | No | No | No | No |
| Delete workspace | Yes | No | No | No | No | No |
| Transfer ownership | Yes | No | No | No | No | No |

## Ownership

Each workspace has exactly one owner. The owner has exclusive rights to delete the workspace and transfer ownership. Ownership cannot be removed — only transferred. See [Transfer ownership](transfer-ownership.md).

## Step by step — inviting a member

1. Admin console → **Members** tab → **Invite**.
2. Enter the email address and select a role (editor / commenter / viewer / guest).
3. The Worker sends an invitation email. The recipient accepts and is added as a member.
4. On joining, the new member's device key is used to wrap a copy of the WDK (Workspace Data Key) for them. This is how they gain cryptographic access to the workspace.

## Step by step — changing a role

1. Admin console → **Members** tab → click the member → **Change role**.
2. Select the new role.
3. The role change is recorded in D1 and the audit log.
4. The member's access updates immediately (on their next API call).

## Step by step — removing a member

1. Admin console → **Members** tab → click the member → **Remove**.
2. Confirm the removal.
3. The Worker deletes the member's wrapped WDK entry from D1. Their session tokens are not automatically revoked — remote wipe is a separate operation that handles session revocation.
4. The member loses cryptographic access to the workspace immediately.
5. Audit event: `workspace.member.left`.

## Behaviour and edge cases

- **WDK wrap on join:** When a member joins, they receive a copy of the WDK encrypted with their device public key. Without this wrap, they cannot derive any section or file key.
- **WDK deletion on remove:** Deleting a member deletes their wrapped WDK. They cannot re-derive any key.
- **Session persistence:** Removing a member invalidates their WDK access but does not revoke active sessions unless remote wipe is also performed.
- **Seat billing:** Team and Enterprise plans are billed per seat. Adding a member adds a seat. Removing a member frees a seat; for exact billing-cycle behaviour, contact support for confirmation.
- **Guest limits:** Guest access is limited to specific files/directories granted via per-file ACL. Guests are visible in the presence list but cannot access workspace-wide resources.
- **Role constraint check:** Migration 0011 enforces the role via a `CHECK` constraint: `role IN ('owner','admin','editor','commenter','viewer','guest')`. The Worker cannot store any other role string.

## Platform differences

Member management is handled in the admin console, available on all platforms.

## Plan availability

Members and roles require Team or Enterprise.

## Permissions and roles

Only admins and the owner can manage members.

## Security implications

When a member is removed, their WDK wrap is deleted. They cannot access any workspace content going forward. However, any content they downloaded while a member remains on their device. Use Remote wipe (Enterprise) to also invalidate their active sessions.

## Settings reference

See [Admin console](admin-console.md) for the Members tab.

## Related articles

- [Invitations](invitations.md)
- [Groups](groups.md)
- [Admin console](admin-console.md)
- [Transfer ownership](transfer-ownership.md)

## Source references

- `private-sync-worker/src/workspaces.ts` — member invite/remove/role-change routes
- `private-sync-worker/migrations/0011_workspace_full.sql` — workspace_members schema with role CHECK constraint
