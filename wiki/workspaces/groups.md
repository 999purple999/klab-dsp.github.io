---
title: "Groups"
slug: "groups"
category: "Workspaces"
tags: ["groups", "permissions", "membership", "workspace"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0019_groups.sql"
  - "private-sync-worker/src/workspaces.ts"
related: ["workspaces/members-and-roles", "workspaces/sections", "enterprise/scim-groups"]
---

# Groups

## What it is

A group is a named membership bundle backed by a workspace section. The key identity `SK_group ≡ SK_section` means the group's encryption key IS the section key for that group's backing section. Members in a group share access to that section's content. This design makes group access control cryptographically coherent: adding someone to a group gives them the section key; removing them triggers lazy revocation.

Groups were introduced in migration `0019_groups.sql`.

## When to use it

- Organise workspace members into logical units (e.g. "Engineering", "Legal", "Contractors").
- Grant a set of channels and files to all members of a department without managing individual ACL entries.
- Integrate with SCIM to sync IdP groups to workspace groups (Enterprise).

## Step by step

### Creating a group

1. Admin console → **Groups** tab → **New group**.
2. Enter a group name and optional description.
3. Select initial members from the workspace member list.
4. Click **Create**. A new section is provisioned for the group, and its SK_section becomes SK_group.

### Adding members to a group

1. Admin console → **Groups** → click the group → **Add member**.
2. Select workspace members.
3. Each new member receives a wrapped copy of SK_group (wrapped with their device key).

### Removing members from a group

1. Admin console → **Groups** → click the group → member row → **Remove**.
2. A lazy revocation flag is set on the member's group membership.
3. Immediate effect: the member is removed from the group member list; their SK_group wrap is deleted.
4. Full revocation: on the next admin-triggered key rotation for that section, the section key is rotated and the removed member cannot access new content.

## Deterministic permission resolver

Given a user and a resource (file, channel, document), the permission resolver runs:

1. Check user's direct role (Owner, Admin, Member, Guest).
2. For each group the user is a member of: check if that group has ACL access to the resource.
3. Merge the permissions (highest permission wins).
4. Return the effective permission.

This resolver is deterministic — given the same user, resource, and group membership state, it always returns the same result.

## Channel groupId stripe

Channels can be scoped to a group via `channel.groupId`. When a channel has a groupId:

- Only members of that group see the channel in the sidebar.
- The channel key is HKDF-derived from SK_group (= SK_section).
- Non-group members cannot decrypt channel messages even if they somehow obtain the channel list.

## Lazy revocation

When a member is removed from a group:

- A `lazy_revoke` flag is set on the membership record.
- The member's SK_group wrap is deleted — they cannot access new group content.
- Past content they accessed via the group remains in their local vault (no retroactive wipe).
- Full forward-secrecy requires an admin to trigger a key rotation for the group's section.

## Behaviour and edge cases

- **Groups and sections:** Each group has exactly one backing section. The section is auto-created when the group is created and cannot be used for other purposes.
- **Group deletion:** Deletes the group and its backing section. All content in that section is permanently inaccessible if no other key holders exist.
- **Group chip:** In the member list and admin console, a group chip shows the group name next to members who belong to it.
- **SCIM groups (Enterprise):** Groups can be synchronised from an IdP. When a SCIM group is pushed, K-Perception creates or updates the corresponding workspace group. See [SCIM groups](../enterprise/scim-groups.md).
- **Audit events:** `group.created`, `group.deleted`, `group.member.added`, `group.member.removed`.

## Platform differences

Group management is in the admin console, available on all platforms with identical functionality.

## Plan availability

Groups require Team or Enterprise.

## Permissions and roles

Only workspace Admins and the Owner can create, modify, or delete groups.

## Security implications

The `SK_group ≡ SK_section` identity means that group access is cryptographically enforced, not just an ACL flag. A member not in the group cannot derive the SK_group and therefore cannot decrypt group content regardless of what D1 rows say.

## Settings reference

See [Admin console](admin-console.md) → Groups tab.

## Related articles

- [Members and roles](members-and-roles.md)
- [Sections](sections.md)
- [SCIM groups](../enterprise/scim-groups.md)

## Source references

- `private-sync-worker/migrations/0019_groups.sql` — groups schema
- `private-sync-worker/src/workspaces.ts` — group CRUD routes
