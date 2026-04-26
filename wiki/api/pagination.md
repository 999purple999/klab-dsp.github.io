---
title: "API Pagination"
slug: "api-pagination"
category: "API"
tags: ["api", "pagination", "cursor", "after"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
  - "private-sync-worker/src/company.ts"
related: ["api-overview", "api-workspaces", "api-companies"]
---

# API Pagination

K-Perception uses cursor-based pagination for endpoints that can return large result sets. This approach is efficient for incremental synchronisation and avoids the "page drift" problem of offset-based pagination.

## Cursor pagination: notes endpoint

The `/api/v1/workspaces/:id/notes` endpoint paginates using the `canonicalSeq` field — a monotonically increasing integer assigned to each change-log entry by the server.

### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `after` | integer | `0` | Return only entries with `canonicalSeq` strictly greater than this value |
| `limit` | integer | `100` | Maximum entries per page; capped at `500` |

### Pagination flow

1. Make the initial request with `after=0` (or omit `after`).
2. In the response, note the `canonicalSeq` of the **last** entry in the `notes` array.
3. Make the next request with `after=<last canonicalSeq>`.
4. Repeat until the response returns an empty `notes` array — you have reached the end of the current log.

**Example:**

```
GET /api/v1/workspaces/abc123/notes?after=0&limit=100
→ notes[0..99], last canonicalSeq = 99

GET /api/v1/workspaces/abc123/notes?after=99&limit=100
→ notes[100..143], last canonicalSeq = 143

GET /api/v1/workspaces/abc123/notes?after=143&limit=100
→ notes: []   ← end of log
```

### Incremental sync

Because `canonicalSeq` is strictly increasing and never reused, you can store the highest `canonicalSeq` you have seen and use it as the `after` value on subsequent runs. This gives you an efficient incremental sync: you only fetch entries that are new since your last poll.

Tombstoned notes (`tombstone: true`) are included in the change log. Your client must process these to remove deleted notes from any local index.

---

## Date-range pagination: audit log

The company audit log at `GET /companies/:id/audit` uses time-based filtering rather than cursor pagination.

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | ISO 8601 datetime | Return events at or after this timestamp |
| `to` | ISO 8601 datetime | Return events at or before this timestamp |

### Limits

A maximum of **500 events** are returned per request (ordered by `event_seq` descending). If you need to retrieve more than 500 events for a time range, narrow the `from`/`to` window and make multiple requests.

**Example — export events for a calendar week:**
```
GET /companies/{id}/audit?from=2026-01-01T00:00:00Z&to=2026-01-07T23:59:59Z
```

If that range returns 500 events (the maximum), narrow the window:
```
GET /companies/{id}/audit?from=2026-01-01T00:00:00Z&to=2026-01-04T23:59:59Z
GET /companies/{id}/audit?from=2026-01-05T00:00:00Z&to=2026-01-07T23:59:59Z
```

---

## Other endpoints

The following endpoints return complete result sets without pagination. For workspaces with large numbers of members or sections these lists are returned in full on a single request:

- `GET /api/v1/workspaces/:id/members`
- `GET /api/v1/workspaces/:id/sections`
- `GET /companies/:id/members`
- `GET /companies/:id/workspaces`
- SCIM `GET .../Users` and `GET .../Groups`

[NEEDS-VERIFY: confirm whether any of the above endpoints enforce a server-side row limit for very large workspaces.]
