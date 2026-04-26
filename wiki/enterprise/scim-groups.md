---
title: "SCIM Group Sync"
slug: "scim-groups"
category: "Enterprise"
tags: ["scim", "groups", "provisioning", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
related: ["enterprise/scim-overview", "enterprise/scim-okta", "enterprise/scim-azure-ad", "enterprise/overview"]
---

# SCIM Group Sync

## What it is

K-Perception supports SCIM 2.0 Group provisioning alongside User provisioning. When your IdP pushes a Group to K-Perception, a new workspace group is created automatically. Members within that group are also linked if their SCIM User records have already been provisioned. This allows you to manage workspace group membership entirely from your IdP directory.

The SCIM Groups endpoints are:

| Method | Path | Operation |
|---|---|---|
| GET | `/workspaces/{workspaceId}/scim/v2/Groups` | List all groups |
| POST | `/workspaces/{workspaceId}/scim/v2/Groups` | Create a new group |
| GET | `/workspaces/{workspaceId}/scim/v2/Groups/{groupId}` | Get a specific group |
| PATCH | `/workspaces/{workspaceId}/scim/v2/Groups/{groupId}` | Add or remove members |
| DELETE | `/workspaces/{workspaceId}/scim/v2/Groups/{groupId}` | Delete a group |

## When to use it

Use SCIM Group sync when you want:
- IdP security groups or directory groups to automatically create K-Perception workspace groups.
- Group membership changes in your IdP (e.g. Azure AD security group, Okta group) to propagate to K-Perception within minutes.
- Consistent group membership across tools without manual management.

## How K-Perception maps SCIM groups

Each SCIM Group in K-Perception corresponds to:
- A `workspace_groups` row.
- A backing `workspace_sections` row (created automatically at the same time).

The group `displayName` from the IdP becomes the group's `slug` in K-Perception (lowercased, non-alphanumeric characters replaced with hyphens).

Group members are resolved via existing SCIM User mappings. When the IdP sends a Group with members, each `value` in the `members` array is looked up in `workspace_scim_mappings` by `external_id`. If a match is found and the user has a linked K-Perception user ID, the user is added to the group.

If a member's SCIM User record has not yet been provisioned (i.e. the mapping does not exist), that member is silently skipped. They will be added when the IdP next pushes an update to the group.

## Step by step

### Step 1 — Ensure User provisioning is configured first

Group member resolution depends on SCIM User mappings already existing. Set up User provisioning before enabling group push (see [SCIM overview](scim-overview.md)).

### Step 2 — Enable group push in your IdP

**Okta:**
1. In the K-Perception application's **Provisioning** → **To App** settings, check **Push Groups**.
2. Go to the **Push Groups** tab → **Push Groups by Name** or **Push Groups by Rule**.
3. Select the groups you want to sync to K-Perception.

**Azure AD:**
1. Under **Provisioning** → **Mappings**, click **Provision Azure Active Directory Groups**.
2. Ensure the mapping is enabled.
3. Add the security groups to the application's **Users and groups** assignments.

### Step 3 — Verify group creation in K-Perception

4. Open K-Perception → **Workspace admin** → **Groups**.
5. Groups pushed from the IdP should appear.
6. Members should appear within those groups if their SCIM User mappings were already created.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| Group created via SCIM POST | New `workspace_groups` row and backing `workspace_sections` row created |
| Group member `value` not in SCIM mappings | Member silently skipped — no error |
| Group member `value` in mappings but no linked K-Perception user | Member skipped |
| Group PATCH `add` operation | Members added to group |
| Group PATCH `remove` operation | Members removed from group |
| Group DELETE | Group soft-deleted (`deleted_at` set); backing section remains |
| Group with duplicate `displayName` | The slug is derived by lowercasing and hyphenating the displayName; if a slug collision occurs D1 returns a UNIQUE constraint error and the SCIM POST returns an error. IdP should use unique group names. |
| User deprovisioned but still in group | When a SCIM User is deleted, their workspace membership is revoked and sessions are revoked. Group membership rows in `workspace_group_members` are not explicitly purged by the SCIM delete path — they remain as orphan rows until the next group sync or manual cleanup. |

## Platform differences

SCIM is a server-side protocol. There is no platform-specific behaviour.

## Plan availability

SCIM Group sync requires the **Enterprise** plan.

## Permissions and roles

- SCIM tokens are workspace-scoped. Only workspace owners and admins can generate tokens.
- SCIM-created groups do not automatically receive elevated permissions. Group-based access control is managed separately.

## Security implications

- SCIM group membership changes propagate without an encryption key re-wrap. Adding a user to a group via SCIM does not grant them access to encrypted section keys — that requires a workspace admin to wrap the section key for the new member.
- Deleting a group via SCIM soft-deletes the group record. The backing workspace section and any encrypted content in it are not deleted.

## Settings reference

| Parameter | Value |
|---|---|
| Groups endpoint (list/create) | `GET/POST /workspaces/{workspaceId}/scim/v2/Groups` |
| Group endpoint (get/patch/delete) | `GET/PATCH/DELETE /workspaces/{workspaceId}/scim/v2/Groups/{groupId}` |
| Group schema | `urn:ietf:params:scim:schemas:core:2.0:Group` |
| `displayName` | Becomes the group slug (lowercased, hyphenated) |
| `members[].value` | Must match an existing SCIM User `external_id` |
| DELETE response | `204 No Content` |

## Related articles

- [SCIM provisioning overview](scim-overview.md)
- [SCIM with Okta](scim-okta.md)
- [SCIM with Azure AD](scim-azure-ad.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/workspaceEnterprise.ts` — Groups section of `handleScim` function (lines 407–491)
