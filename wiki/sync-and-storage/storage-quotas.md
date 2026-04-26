---
title: "Storage quotas"
slug: "storage-quotas"
category: "Sync & Storage"
tags: ["storage", "quota", "billing", "limits"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0006_quota.sql"
  - "private-sync-worker/src/sync.ts"
related: ["413-enforcement", "getting-started/upgrading-and-billing", "workspaces/files-and-directories"]
---

# Storage quotas

## What it is

Storage quota is the maximum amount of cloud storage your account can use. Quota is consumed by encrypted note blobs and attachment blobs stored in Cloudflare R2. Metadata rows in D1 are not counted toward quota.

## Quota by plan

| Plan | Cloud storage quota |
|---|---|
| Local | 0 (device-only, no cloud storage) |
| Guardian | 5 GB |
| Vault | 50 GB |
| Lifetime | 50 GB |
| Team | 100 GB (shared across the workspace) |
| Enterprise | Unlimited |

**Team quota note:** The 100 GB is shared across all members and files in the workspace. Individual members do not have their own sub-quotas.

## Step by step — checking your quota

1. **Desktop:** Click your avatar / account icon → Health screen. The storage meter shows used / total.
2. **Android:** Settings → Storage usage. A table shows: notes, attachments, workspace files, total.
3. **Web:** Account settings → Storage.

## What counts against quota

- Encrypted note blobs (body + metadata)
- Attachment blobs (images, audio, PDFs, binaries)
- Workspace file blobs
- Revision blobs (previous versions of notes) — not confirmed in current source; contact support for confirmation.
- Voice message blobs in workspace channels
- Backup archives in workspace backups

## What does NOT count against quota

- D1 metadata rows (user record, session tokens, sync_objects entries — these are negligible)
- Durable Object state (DocRoom Y.js state)
- Cloudflare Workers compute

## Behaviour and edge cases

- **Quota meter:** Updated in near-real-time on the storage screen. Updated after each sync drain on the health screen. The meter reflects the R2 billing view (exact byte count), not an estimate.
- **413 enforcement:** When an upload would exceed your quota, the Worker rejects it with HTTP 413. See [413 enforcement](413-enforcement.md).
- **Upgrade path:** Upgrading your plan immediately increases your quota. The increased limit is applied within seconds (Stripe → Worker webhook → entitlements table update).
- **Downgrade:** If you downgrade from Vault (50 GB) to Guardian (5 GB) and you have used more than 5 GB, your existing data is NOT deleted. You simply cannot upload new data until your usage drops below 5 GB (by deleting notes or attachments).
- **Shared workspace quota:** For Team workspaces, the quota is shared. A single large file upload by one member affects all members' available storage.
- **No partial billing:** Quota is flat — you are not charged per GB in addition to the plan price. The quota is included in the plan fee.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Storage display | Health screen (meter) | Settings → Storage usage (table) | Account settings → Storage |
| Live quota meter | Yes | Yes | Yes |
| Item-by-item breakdown | Health screen details | Storage usage table | Account settings |

## Plan availability

All plans except Local have cloud storage quotas.

## Permissions and roles

Only you (and workspace admins, for workspace storage) can see the quota usage.

## Security implications

Quota tracking requires the Worker to know the size of each encrypted blob. This reveals the approximate size of your content but not its nature. The server can infer "this user stored many large blobs" but cannot decrypt any of them.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Quota alert threshold | Not confirmed in current source — contact support for confirmation | Account settings → Storage |
| Auto-delete oldest trashed notes when near quota | Disabled | Account settings → Storage |

## Related articles

- [413 enforcement](413-enforcement.md)
- [Upgrading and billing](../getting-started/upgrading-and-billing.md)
- [Files and directories](../workspaces/files-and-directories.md)

## Source references

- `private-sync-worker/migrations/0006_quota.sql` — quota tracking schema
- `private-sync-worker/src/sync.ts` — quota check on blob upload
