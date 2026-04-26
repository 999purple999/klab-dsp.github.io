---
title: "Creating a Workspace"
slug: "workspaces/creating-a-workspace"
category: "Workspaces"
tags: ["workspace", "setup", "onboarding", "WDK", "encryption"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "src/shared/workspaceKeyManager.ts"
  - "src/shared/wdkCrypto.ts"
  - "src/shared/workspaceClient.ts"
related:
  - "workspaces/overview"
  - "workspaces/sections"
  - "workspaces/members-and-roles"
  - "workspaces/invitations"
  - "workspaces/admin-console"
---

## What it is

Creating a workspace is the act of provisioning a new shared encrypted space in K-Perception. The creation process generates the root cryptographic material (the Workspace Data Key, or WDK), establishes the initial set of sections, and registers the workspace in the Cloudflare D1 database. From this point forward every piece of content stored in the workspace is encrypted on the client with keys derived from the WDK before it ever reaches the server.

This article walks through every step of workspace creation, explains the cryptographic operations that happen on your device during provisioning, and covers workspace deletion.

## When to use it

Create a workspace when you want to:

- Start a new team collaboration project in K-Perception.
- Migrate an existing team to K-Perception from another tool.
- Separate projects that require different member lists or key material (one workspace per project, or one workspace per department).

You can own or be a member of multiple workspaces simultaneously. Each workspace has its own independent WDK; compromise of one workspace's key material does not affect any other workspace.

## Step by step

### 1. Check your plan

Workspaces are only available on **Team** (€6.99/user/month) and **Enterprise** (€14.99/user/month) plans. If your account is on a lower tier, K-Perception will prompt you to upgrade before continuing. The upgrade flow is accessible from the plan gate screen that appears when you attempt to create a workspace.

### 2. Open the workspace creation dialog

- **Windows / Web**: Click the **Workspaces** icon in the left navigation rail, then click **New Workspace** at the top of the workspace list panel.
- **Android**: Tap the hamburger menu → **Workspaces** → tap the **+** button.

### 3. Enter workspace details

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | Visible to all members; encrypted at rest |
| Description | No | Optional summary; encrypted at rest |
| Initial members | No | Comma-separated emails; invitations are sent after workspace creation |

Click **Create** (or **Next** if adding initial members).

### 4. Cryptographic provisioning (happens automatically on your device)

After you click Create, the following sequence runs entirely on your device before any network request is made:

1. **Generate WDK**: A cryptographically random 32-byte AES-256 key is generated using the platform's secure random source (`crypto.getRandomValues`).
2. **Wrap WDK with device key**: The WDK is wrapped (AES-KW) with your device key. This produces the `member_wdk_wrap` ciphertext that will be stored in D1 against your `user_id`.
3. **Derive initial section keys**: Default sections (e.g., General, Files) have their `SK_section` values derived via HKDF: `HKDF(WDK, "section:" + sectionId)`. The section keys are used to encrypt initial section metadata.
4. **Auto-provision files section**: The `files-{wsId.slice(0,8)}` section is automatically created and its key derived from the WDK. This section is the root of the workspace file system.
5. **Encrypt workspace metadata**: Name and description are encrypted with the General section key before transmission.
6. **POST /workspaces**: A single request is sent to the Worker containing: encrypted workspace metadata, your wrapped WDK, and encrypted section metadata. The plaintext WDK is discarded from memory after the wrap.

The Worker writes to D1 and returns a workspace ID (a UUID). No plaintext key material ever leaves your device.

### 5. The workspace is ready

After a successful response from the Worker, you land in the **WorkspaceShell** with your newly created workspace selected. The workspace ID is a UUID (e.g., `ws_01hx7k...`). You can share this ID with support if you ever need to reference a specific workspace in a ticket.

## What gets created at provisioning time

| Resource | Where stored | Notes |
|----------|-------------|-------|
| Workspace row | D1 `workspaces` table | Encrypted name/description |
| Owner member row | D1 `workspace_members` | Role = Owner |
| Wrapped WDK | D1 `member_wdk_wraps` | One row per member |
| General section | D1 `sections` | Default landing section |
| Files section | D1 `sections` | `files-{wsId.slice(0,8)}`, auto-provisioned |
| Section key metadata | D1 `section_keys` | Encrypted section key metadata |

No R2 objects are created at provisioning time; R2 usage begins when the first file is uploaded.

## Adding members during creation

If you entered email addresses in the **Initial members** field, K-Perception sends invitation emails after the workspace is provisioned. Invitations are standard email-link invites; recipients must accept the invite and complete the join flow before their wrapped WDK is written to D1 and they gain access.

You can skip this step and invite members later via the Admin console (see [Invitations](workspaces/invitations)).

## Workspace limits

> The per-account workspace ownership limit is enforced by the Worker based on your entitlement tier. The exact numerical caps are tier-specific and may change; contact support if you need to create more than the default number of workspaces.

Each workspace enforces a **seat limit** based on your plan. The Team plan and Enterprise plan both charge per seat. Adding a member beyond your purchased seat count will prompt a seat upgrade flow.

## Workspace ID format

Workspace IDs are prefixed UUIDs stored as strings in D1. The first 8 hex characters of the workspace ID are used to name the auto-provisioned files section: `files-{wsId.slice(0,8)}`. This naming convention is deterministic and used by the client to locate the files section key without an additional D1 lookup.

## Deleting a workspace

Workspace deletion is a **dangerous operation** that requires a TOTP step-up elevation token and can only be performed by the workspace Owner.

**What happens when a workspace is deleted:**

1. Owner opens Admin console → Settings → Danger Zone → **Delete Workspace**.
2. K-Perception shows a confirmation dialog listing what will be permanently deleted.
3. Owner enters a TOTP code (from their authenticator app) to generate an elevation token.
4. The Worker validates the elevation token server-side before proceeding.
5. All D1 rows for the workspace (members, sections, channels, files metadata, group memberships, etc.) are deleted.
6. All R2 objects associated with the workspace are deleted (encrypted file blobs, backup snapshots, voice message blobs).
7. All Durable Objects (WorkspaceHub, per-channel DocRoom DOs, PresenceHub) are destroyed.

Deletion is irreversible. There is no soft-delete or recovery window. If a backup exists, restoring it after deletion would require re-creating the workspace first.

## Platform differences

- **Windows / Web**: Workspace creation uses the full three-pane WorkspaceShell from the moment the workspace is ready. The creation dialog includes an optional member-invite step inline.
- **Android**: The creation flow uses a modal sheet. Initial members cannot be added during creation on mobile; use the Invite flow in the Admin console after creation.

## Plan availability

Workspace creation is available on **Team** and **Enterprise** plans only. Attempting to create a workspace on Local, Guardian, Vault, or Lifetime plans presents an upgrade prompt.

| Plan | Can create workspace |
|------|---------------------|
| Local (€0) | No |
| Guardian (€3.49/mo) | No |
| Vault (€7.99/mo) | No |
| Lifetime (€149) | No |
| Team (€6.99/user/mo) | Yes |
| Enterprise (€14.99/user/mo) | Yes |

## Permissions and roles

Only the account that creates the workspace is initially designated as **Owner**. The Owner is the only role that can delete the workspace. Ownership can be transferred to another Admin later; see [Transfer ownership](workspaces/transfer-ownership).

## Security implications

- The WDK is generated with a cryptographically secure RNG and never transmitted in plaintext.
- The workspace name and description are encrypted before they are sent to the server; the Cloudflare Worker and D1 database cannot read them.
- Deleting a workspace requires a server-side validated TOTP elevation token; this prevents a stolen session token from being used to destroy a workspace.
- After deletion, ciphertext blobs are removed from R2. However, data that was previously synced to member devices is not automatically wiped. Use Remote Wipe (see the Admin console) before deletion if you need to enforce client-side cleanup.

## Settings reference

| Setting | Default | Notes |
|---------|---------|-------|
| Workspace name | (required) | Encrypted; visible to members only |
| Workspace description | (empty) | Encrypted; optional |
| Initial members | (none) | Email addresses; triggers invite emails |
| Invite policy | Invite-only | Can be changed in Admin → Settings after creation |

## Related articles

- [Workspace overview](workspaces/overview)
- [Sections](workspaces/sections)
- [Members and roles](workspaces/members-and-roles)
- [Invitations](workspaces/invitations)
- [Admin console](workspaces/admin-console)
- [Transfer ownership](workspaces/transfer-ownership)
- [Backup and restore](workspaces/backup-restore)

## Source references

- `private-sync-worker/src/workspaces.ts` — `POST /workspaces` route and deletion logic
- `src/shared/workspaceKeyManager.ts` — WDK generation and section key derivation
- `src/shared/wdkCrypto.ts` — AES-KW wrap/unwrap for WDK
- `src/shared/workspaceClient.ts` — `createWorkspace()` client method
- `private-sync-worker/migrations/0008_team.sql` — initial team workspace schema
- `private-sync-worker/migrations/0011_workspace_full.sql` — full workspace schema
- `private-sync-worker/migrations/0033_entitlements_seats.sql` — seat entitlement tracking
