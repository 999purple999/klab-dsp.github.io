---
title: "Invitations"
slug: "invitations"
category: "Workspaces"
tags: ["invitations", "invite", "members", "workspace"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/migrations/0016_workspace_industrial.sql"
related: ["workspaces/members-and-roles", "workspaces/admin-console"]
---

# Invitations

## What it is

K-Perception supports four invitation methods for adding members to a workspace: email invite, invite link, bulk invite (CSV), and quorum invite (requires approval from multiple admins before access is granted).

## Invitation types

### Email invite

1. Admin console → **Members** → **Invite** → enter email → select role → **Send**.
2. The Worker sends an invitation email to the address.
3. Recipient clicks the link in the email → opens K-Perception (web or app) → accepts the invitation → joins the workspace.
4. On accepting, the new member's WDK wrap is created and they gain cryptographic workspace access.

### Invite link

1. Admin console → **Members** → **Invite link** → **Generate**.
2. A time-limited invite link is generated. Copy and share it.
3. Anyone with the link can join the workspace (up to the plan's seat limit).
4. Invite links expire after 7 days by default (the Worker sets `expiresAt = now + 7 days` when no `expiresInSeconds` is supplied by the caller).
5. Admins can revoke an active invite link before it expires.

### Bulk invite (CSV)

1. Admin console → **Members** → **Bulk invite**.
2. Paste a comma-separated list of email addresses or upload a CSV file with a `email` column.
3. Select a default role for all invitees.
4. Click **Send invites**. One invitation email is sent to each address.
5. Progress is shown in the admin console.

### Quorum invite policy

When quorum policy is enabled (see [Admin console](admin-console.md) → Settings → "Invite approval required"):

1. An invitation is generated but not activated until the required number of admins approve it.
2. Admins see a "Pending approval" queue in the Members tab.
3. Each admin clicks **Approve** or **Deny**.
4. When the required quorum is reached, the invitation is activated and the invite email is sent.
5. Quorum threshold is configurable (e.g. 2 of 3 admins must approve).

## Behaviour and edge cases

- **Email delivery:** Invitation emails are sent by the Worker via the email provider configured in the Worker environment. Delivery depends on the recipient's spam filters.
- **Resend invite:** Admins can resend an invitation email for pending invitations.
- **Cancel invite:** Admins can cancel a pending invitation before acceptance. Cancellation is immediate.
- **Seat limits:** If adding a new member would exceed the plan's seat limit (Team: paid per seat), the Worker returns an error. Upgrade the plan to add more seats.
- **Invite link join:** When using an invite link, the joining user automatically gets the default role configured for that link (usually Member).
- **Quorum pending invites:** Invitations pending quorum approval do not consume a seat until accepted.

## Platform differences

Invitation management is in the admin console. All invitation types work identically across platforms.

## Plan availability

Invitations require Team or Enterprise.

## Permissions and roles

Only workspace Admins and the Owner can invite members.

## Security implications

The invitation email contains a one-time link. The link contains a token (stored in D1) that is valid only once. The `routeAcceptInvite` handler requires the caller to be authenticated (a valid session is mandatory); it does not re-check that the authenticated user's email matches the invited email address — it only validates the token itself. Access is restricted to whoever holds the token and has a valid session.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Invite link expiry | 7 days | Admin console → Settings |
| Quorum policy | Disabled | Admin console → Settings → Invite approval |
| Quorum threshold | 1 admin (configurable) | Admin console → Settings |

## Related articles

- [Members and roles](members-and-roles.md)
- [Admin console](admin-console.md)

## Source references

- `private-sync-worker/src/workspaces.ts` — invitation routes
- `private-sync-worker/migrations/0016_workspace_industrial.sql` — invite policy schema
