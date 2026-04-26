---
title: "Admin console"
slug: "admin-console"
category: "Workspaces"
tags: ["admin", "console", "settings", "management"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/workspace/admin/AdminShell.tsx"
  - "src/renderer/src/workspace/admin/DangerousOpModal.tsx"
related: ["workspaces/members-and-roles", "workspaces/groups", "workspaces/webhooks", "enterprise/elevation-tokens"]
---

# Admin console

## What it is

The admin console is the central management interface for a workspace. It is accessible only to workspace Admins and the Owner. The console is implemented in `AdminShell.tsx` and contains 11 tabs covering every aspect of workspace management.

## Step by step — opening the admin console

1. Open the workspace in K-Perception.
2. Click the **Settings** icon (gear) in the workspace sidebar, or navigate to workspace → **Admin**.
3. The admin console opens. Select a tab from the left navigation.

## Tab reference

### Overview

Shows:
- Workspace plan, seat count, storage used.
- Recent activity feed (member joins, file uploads, key events).
- Quick health indicators (backup status, key health, seat usage).

### Members

Manage workspace membership:
- Current member list with roles, join date, last active.
- **Invite** button (email, link, bulk, quorum).
- Per-member actions: change role, remove.
- Pending invitations list with cancel/resend options.

### Groups

Manage groups:
- Group list with member count.
- Create group, edit name/description, delete group.
- Add/remove members from groups.
- View group's backing section key status.

### Channels

Manage channels:
- Channel list with member count and ACL summary.
- Create channel, archive channel, delete channel.
- Per-channel ACL configuration.

### Security

Manage security-sensitive settings:
- **Sessions:** View active sessions for all workspace members. Revoke individual sessions.
- **API keys:** Create, list, revoke workspace API keys.
- **IP allowlist:** Add/remove CIDR ranges for IP-based access restriction.

### Integrations

- **Webhooks:** Add/manage webhook endpoints, view delivery log.
- **SCIM endpoint:** View SCIM base URL, generate/revoke SCIM tokens (Enterprise only).

### Audit

Tamper-evident audit log viewer:
- Filter by date range, actor, event type.
- Export as JSON or CSV.
- See [Audit log](../enterprise/audit-log.md) for the full event catalogue.

### Backups

- Current backup list with timestamps and sizes.
- **Create backup now** button.
- Automated backup schedule configuration.
- **Restore** button (requires elevation token + TOTP).

### Billing

- Current plan and seat count.
- Seat usage breakdown.
- Payment method management (opens Stripe billing portal).
- Invoice history.

### Settings

- Workspace display name and description.
- Invite policy (quorum threshold).
- Public join link toggle.
- Notification settings.

### Crypto (Owner only)

- Section list with key rotation status per section.
- **Rotate workspace key** button (requires elevation token).
- Recovery code management.
- Per-section key rotation.

## Dangerous operations modal

All destructive actions (rotate-key, remote-wipe, transfer-ownership, delete-workspace, restore-backup) are gated by the `DangerousOpModal`. This modal:

1. Shows a clear description of what the operation does and what cannot be undone.
2. Requires a TOTP code input.
3. Sends the TOTP code to the Worker to obtain an elevation token.
4. Requires explicit confirmation ("I understand this is irreversible — type CONFIRM").
5. Only then executes the operation.

See [Elevation tokens](../enterprise/elevation-tokens.md) for the full security design.

## Platform differences

The admin console is identical across Windows, web, and Android. On Android, tabs are accessed via a bottom navigation drawer instead of a left sidebar.

## Plan availability

The admin console requires Team or Enterprise.

## Permissions and roles

Only workspace Admins and the Owner can access the admin console.

## Security implications

The admin console is the most privileged UI surface in K-Perception. Access is enforced server-side — every admin console API call checks the caller's role. Dangerous operations additionally require elevation tokens.

## Settings reference

All workspace settings are managed through the admin console tabs described above.

## Related articles

- [Members and roles](members-and-roles.md)
- [Groups](groups.md)
- [Webhooks](webhooks.md)
- [Elevation tokens](../enterprise/elevation-tokens.md)

## Source references

- `src/renderer/src/workspace/admin/AdminShell.tsx` — admin console implementation (11 tabs)
- `src/renderer/src/workspace/admin/DangerousOpModal.tsx` — TOTP step-up confirmation modal
