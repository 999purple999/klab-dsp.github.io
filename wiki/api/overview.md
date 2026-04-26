---
title: "API Overview"
slug: "api-overview"
category: "API"
tags: ["api", "authentication", "rest", "overview"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
  - "private-sync-worker/src/company.ts"
related: ["api-authentication", "api-workspaces", "api-companies", "api-errors"]
---

# API Overview

The K-Perception API lets you integrate workspace data into your own tooling, automate administrative tasks, and build on top of the K-Perception platform. All content served by the API is **ciphertext only** — the server never has access to plaintext note content. Callers that need to read content must independently hold the Workspace Decryption Key (WDK).

## Base URL

```
https://api.kperception.app
```

All endpoints are served from this base. The current REST API version is **v1**, accessed at `/api/v1/`.

## Authentication methods

The API supports two authentication methods depending on the call context.

| Method | Header | Use case |
|--------|--------|----------|
| JWT Bearer | `Authorization: Bearer <jwt>` | Interactive user sessions; company and workspace management routes |
| API Key | `Authorization: ApiKey <key>` | Workspace automation; machine-to-machine access to `/api/v1/workspaces/` |

See [API Authentication](authentication.md) for full details on obtaining credentials and scope rules.

## Plan requirements

| Feature | Minimum plan |
|---------|-------------|
| `/api/v1/workspaces/` REST endpoints | Team or Enterprise |
| SCIM 2.0 provisioning | Enterprise |
| Webhooks | Team or Enterprise |
| Company hierarchy endpoints | Enterprise |

Calling a plan-gated endpoint from a lower-tier workspace returns HTTP 403 with error code `tier_blocked`.

## API versioning

The current stable API version is **v1**. Workspace endpoints live under `/api/v1/workspaces/:id/`. Company and workspace management routes (session-authenticated) are not versioned and are mounted directly under `/companies/` and `/workspaces/`.

## Common request headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <jwt>` or `ApiKey <key>` depending on the endpoint |
| `Content-Type` | For mutations | `application/json` |

## Response envelope

All JSON responses from the API use a consistent envelope:

**Success:**
```json
{
  "ok": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "ok": false,
  "error": {
    "code": "error_code",
    "message": "Human-readable description",
    "detail": { ... }
  }
}
```

The `detail` field is optional and present only when additional context is useful (for example, the `tier` field on `tier_blocked` errors).

## Rate limits

The API uses a sliding-window rate limiter backed by a Cloudflare Durable Object. The limiter is keyed per `(endpoint, client-IP)` pair and enforces per-minute ceilings. When a limit is exceeded, the response is HTTP 429 with:

```json
{
  "error": "Rate limit exceeded",
  "code": "rate_limited",
  "retryAfterSeconds": 42
}
```

The response also includes a `Retry-After` header. See [Rate Limits](rate-limits.md) for per-endpoint limits.

## Error codes

See [API Errors](errors.md) for the full list of error codes and their meanings.
