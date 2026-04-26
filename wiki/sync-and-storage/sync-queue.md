---
title: "Sync queue"
slug: "sync-queue"
category: "Sync & Storage"
tags: ["sync", "queue", "offline", "operations"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "mobile/src/sync/syncQueue.ts"
  - "mobile/src/sync/evictedItems.ts"
  - "src/renderer/src/hooks/useWorkerSync.ts"
  - "private-sync-worker/src/sync.ts"
related: ["offline-first", "pull-polling", "merge-conflicts", "storage-quotas"]
---

# Sync queue

## What it is

The sync queue is a persistent local list of operations that have been applied to the local vault but not yet confirmed by the server. Every create, update, and delete action produces one entry in the queue. When connectivity is available, K-Perception drains the queue by sending the changes to the Cloudflare Worker backend. If the app is closed before the queue drains, the operations survive the restart and are sent on the next launch.

## When to use it

You never interact with the sync queue directly — it operates automatically. You will encounter it indirectly when:

- You see a badge or indicator showing "X changes pending sync".
- The health screen reports "Offline — N operations queued".
- You review the eviction log (large vaults only) when items are dropped due to storage pressure.

## How it works

```
User action (create/edit/delete note)
    ↓
Write to local encrypted store (immediate)
    ↓
Append operation to sync queue
    ↓
[connectivity available?]
    YES → Drain: send batch to Worker → Worker returns seq numbers → mark ops confirmed
    NO  → Queue persists; retry on next connectivity event
```

Each queue entry contains:

| Field | Description |
|---|---|
| `object_type` | `'note'` \| `'attachment'` \| `'settings'` \| `'snapshot'` |
| `object_id` | UUID of the note or attachment |
| `operation` | `'upsert'` \| `'delete'` |
| `payload` | AES-256-GCM encrypted blob (bytes) |
| `client_updated_at` | Client-side timestamp (used for conflict resolution) |
| `retry_count` | Number of failed attempts |

## Step by step (what happens on drain)

1. The sync hook (`useWorkerSync.ts` on desktop/web; equivalent on mobile) detects connectivity.
2. It reads all unconfirmed entries from the sync queue.
3. Entries are batched (up to 50 per request) and sent to `POST /sync/changes`.
4. The Worker validates each entry, assigns a `canonical_seq` to each object, and stores the blob in R2.
5. The Worker returns the assigned sequence numbers.
6. The client marks those queue entries as confirmed and removes them from the queue.
7. If the Worker returns a conflict (seq mismatch), the entry is held and the merge conflict flow is triggered (see [Merge conflicts](merge-conflicts.md)).

## Eviction tracking

For very large vaults where local storage is near capacity (`mobile/src/sync/evictedItems.ts`):

- The app monitors available device storage before each write.
- If storage drops below a warning threshold, the app shows a "Local storage nearly full" banner.
- If storage is critically low, the oldest unsynced items may be evicted (dropped from the queue) with an error log entry.
- Evicted items are tracked in the eviction log so you can identify what was lost and attempt recovery from the server.

## Retry behaviour

Failed drain attempts (network error, server 5xx) trigger exponential backoff:

| Attempt | Wait |
|---|---|
| 1st failure | 5 seconds |
| 2nd failure | 15 seconds |
| 3rd failure | 60 seconds |
| 4+ | 5 minutes |

After 10 consecutive failures, the queue pauses and a persistent error is shown in the health screen. You can manually trigger a retry from the health screen.

## Behaviour and edge cases

- **App restart:** The queue is persisted to the local store. Restarting the app does not lose queued operations.
- **Concurrent edits:** If you edit the same note on two devices simultaneously while both are offline, both devices queue their respective changes. When they come online, both push their changes. The Worker detects the conflict via `canonical_seq` and one of the devices will receive a conflict notification.
- **Delete operations:** A delete queues a tombstone. If the object is also in the unconfirmed create queue (created and deleted offline before any sync), both entries remain in the queue independently — there is no coalescing into a no-op. Not confirmed in current source — contact support for confirmation.
- **Attachment blobs:** Attachment blobs are uploaded as single encrypted blobs within a sync envelope. No chunking of attachment blobs into separate queue entries is implemented in the current codebase.
- **Quota exceeded:** If the server returns HTTP 413 (QUOTA_EXCEEDED), the failing operation is moved to a failed queue. All subsequent operations for non-attachment types continue to drain normally.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Queue persistence | Electron local store | Capacitor Preferences | IndexedDB |
| Drain trigger | NamespaceHub push event + interval | 30s poll + connectivity event | Interval + visibility change |
| Eviction tracking | Yes | Yes (`evictedItems.ts`) | Yes |
| Manual retry | Health screen | Health screen | Health screen |

## Plan availability

The sync queue is active only when cloud sync is enabled (Guardian+). On the Local plan, no queue entries are ever sent to the server.

## Permissions and roles

No permission restrictions — the queue operates on the authenticated user's namespace.

## Security implications

Queue entries contain encrypted blobs (AES-256-GCM). The queue itself is stored in the encrypted local store. Even if an attacker gains access to the device's local storage, they see only ciphertext. Queue entries are transmitted over HTTPS to the Worker; the Worker can see the encrypted blob and metadata (object_type, size, seq) but not the plaintext content.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Sync enabled | Yes (if signed in with cloud plan) | Account settings → Sync |
| Eviction log | Accessible in health screen | Health screen → Details |
| Batch size per drain | 50 | Not user-configurable |

## Related articles

- [Offline-first architecture](offline-first.md)
- [Pull polling](pull-polling.md)
- [Merge conflicts](merge-conflicts.md)
- [Storage quotas](storage-quotas.md)

## Source references

- `mobile/src/sync/syncQueue.ts` — sync queue implementation
- `mobile/src/sync/evictedItems.ts` — eviction tracking
- `src/renderer/src/hooks/useWorkerSync.ts` — desktop/web sync hook
- `private-sync-worker/src/sync.ts` — Worker-side sync route handler
