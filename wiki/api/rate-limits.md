---
title: "API Rate Limits"
slug: "api-rate-limits"
category: "API"
tags: ["api", "rate-limits", "throttling", "429"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/rateLimiter.ts"
  - "private-sync-worker/src/session.ts"
  - "private-sync-worker/src/auth.ts"
  - "private-sync-worker/src/auth-local.ts"
  - "private-sync-worker/src/workspaces.ts"
related: ["api-overview", "api-errors"]
---

# API Rate Limits

K-Perception enforces sliding-window rate limits on all endpoints to protect against abuse and ensure fair access. The rate limiter is backed by a Cloudflare Durable Object (`RateLimiterHub`) which serialises increments per `(scope, client-IP)` pair, eliminating the race window present in counter-based approaches.

## How it works

1. Each request is identified by its client IP address (from the `CF-Connecting-IP` header set by Cloudflare).
2. The limiter maintains a deque of recent request timestamps per `(scope, IP)` pair.
3. Timestamps older than the window are evicted.
4. If the count of remaining timestamps reaches the configured ceiling, the request is denied with HTTP 429.
5. The `retryAfterSeconds` value is computed as `ceil((oldest_timestamp + window_ms - now) / 1000)`.

## Failure behaviour

If the `RATE_LIMITER_HUB` Durable Object binding is unavailable, the limiter fails **open** (allows the request) and logs an error. This preserves availability during infrastructure outages. No endpoint currently uses fail-closed mode.

## Per-endpoint limits

The following limits are confirmed in source code. The `rateLimit` helper defaults to **20 requests per 60-second window** unless the call site specifies a different value.

| Endpoint / scope | Limit | Window |
|-----------------|-------|--------|
| Auth start (`auth_start`) | 20 per IP | 60 seconds |
| Auth exchange (`auth_exchange`) | 20 per IP | 60 seconds |
| Session refresh (`session_refresh`) | 20 per IP | 60 seconds |
| Local signup (`local_signup`) | 10 per IP | 60 seconds |
| Local login (`local_login`) | 10 per IP | 60 seconds |
| Forgot password (`local_forgot`) | 5 per IP | 60 seconds |
| Password reset (`local_reset`) | 10 per IP | 60 seconds |
| Email verification (`local_verify`) | 20 per IP | 60 seconds |
| Workspace create (`ws-create`) | 5 per IP | 60 seconds |

The `/api/v1/workspaces/:id/*` REST endpoints (`handleApiV1`) authenticate via API key but do not add a `rateLimit` call in the reviewed source — they rely on the API key authentication gate and the general Cloudflare Worker request limit. Share-link and update-download endpoint rate limits are not confirmed from source review; contact support for exact limits on those routes.

## HTTP 429 response

When a limit is exceeded:

**Status:** 429 Too Many Requests

**Headers:**
```
Retry-After: 42
Content-Type: application/json
```

**Body:**
```json
{
  "error": "Rate limit exceeded",
  "code": "rate_limited",
  "retryAfterSeconds": 42
}
```

## Capacity limits (not rate limits)

The following HTTP 429 responses relate to plan capacity rather than request frequency:

| Code | Trigger |
|------|---------|
| `member_limit_reached` | Workspace member count equals `memberLimit` |
| `guest_limit_reached` | Workspace guest count equals `guestLimit` |

These are not time-windowed — they remain until a member is removed or the plan is upgraded.

## Best practices

- Cache responses where possible to avoid re-fetching unchanged data.
- Use the `after` cursor on `/api/v1/workspaces/:id/notes` for incremental polling rather than full reloads.
- Respect the `Retry-After` header on 429 responses.
- Distribute scheduled jobs to avoid burst patterns at regular clock boundaries.
