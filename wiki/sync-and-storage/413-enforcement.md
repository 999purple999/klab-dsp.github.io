---
title: "413 quota enforcement"
slug: "413-enforcement"
category: "Sync & Storage"
tags: ["quota", "storage", "413", "upload"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/sync.ts"
  - "private-sync-worker/migrations/0006_quota.sql"
related: ["storage-quotas", "getting-started/upgrading-and-billing"]
---

# 413 quota enforcement

## What it is

When an upload would push your R2 storage usage above your plan's quota limit, the Cloudflare Worker rejects the request with HTTP **413 Request Entity Too Large** and a JSON body containing the quota details. This prevents users from silently exceeding their plan limit.

## When you will encounter this

- Your vault has grown to fill your plan quota (5 GB for Guardian, 50 GB for Vault/Lifetime).
- A workspace member uploaded a large file that pushed the shared workspace quota to its limit.
- You are on the Local plan and accidentally triggered a cloud upload (this should not happen in normal usage).

## Error response format

```json
{
  "error": "QUOTA_EXCEEDED",
  "used": 5368709120,
  "limit": 5368709120,
  "unit": "bytes"
}
```

| Field | Description |
|---|---|
| `error` | Always `"QUOTA_EXCEEDED"` |
| `used` | Current storage used, in bytes |
| `limit` | Your plan's limit, in bytes |
| `unit` | Always `"bytes"` |

## Client-side behaviour when 413 is received

1. The sync queue pauses uploads (further blob PUTs are not attempted until quota is resolved).
2. A **"Storage full"** banner appears in the app header and health screen.
3. Text-only changes (edits without new blobs) continue to sync normally — they do not produce new R2 blobs.
4. A **"Upgrade your plan"** CTA is shown in the banner.

## Step by step — resolving a 413

**Option 1 — Upgrade your plan:**
1. Click the "Upgrade" link in the storage-full banner or go to Account settings → Plan.
2. Select a higher-tier plan and complete payment.
3. Your quota is increased within seconds (Stripe webhook updates the entitlements table).
4. The sync queue resumes automatically.

**Option 2 — Free up space:**
1. Go to Account settings → Storage to see which items are consuming the most space.
2. Delete large attachments or notes you no longer need.
3. Empty the Trash (trashed items still count against quota until purged).
4. After deletion, the quota meter updates on the next sync cycle. The sync queue resumes when usage is below the limit.

## Behaviour and edge cases

- **Partial uploads:** If a large note has multiple attachment blobs and the quota is exceeded mid-upload, blobs that were already uploaded remain. The note will reference both uploaded and failed blobs. On the next sync attempt (after freeing space), the missing blobs are re-uploaded.
- **Text edits never blocked:** The 413 check applies only to blob (R2) uploads. Text note metadata (D1 rows) are never blocked — even at quota, you can continue editing existing notes and the text changes sync.
- **Workspace quota:** For Team workspaces, the 413 can be triggered by any member's upload. All members are notified via the storage-full banner.
- **Race condition:** Two simultaneous uploads that together would exceed the quota — the Worker's quota check is transactional (reading current usage and conditionally accepting the upload). One of the two uploads will succeed (whichever arrives first at the Worker); the other receives 413.
- **Large single file:** A single file exceeding the remaining quota (e.g. uploading a 4 GB file with 1 GB remaining) will always fail with 413. The file is not partially accepted.

## Platform differences

The 413 handling is identical across all platforms — the sync queue pauses and the banner is shown. The upgrade flow is platform-specific:

- **Desktop:** Opens the account settings → Plan upgrade page.
- **Android:** Opens the in-app plan comparison screen.
- **Web:** Redirects to the billing portal.

## Plan availability

413 enforcement applies to all plans with cloud storage (Guardian+).

## Permissions and roles

Any user can trigger a 413 by exhausting their quota.

## Security implications

No security implications beyond normal quota enforcement. The error response does not contain any sensitive information.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Storage usage view | Real-time | Health screen / Account settings |
| Quota alert threshold | Not confirmed in current source — contact support for confirmation | Account settings → Storage |

## Related articles

- [Storage quotas](storage-quotas.md)
- [Upgrading and billing](../getting-started/upgrading-and-billing.md)

## Source references

- `private-sync-worker/src/sync.ts` — quota check + 413 response on blob PUT
- `private-sync-worker/migrations/0006_quota.sql` — quota table schema
