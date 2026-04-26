---
title: "kp-admin CLI Reference"
slug: "cli-kp-admin"
category: "CLI"
tags: ["cli", "kp-admin", "platform-admin", "users", "workspaces", "audit"]
audience: "developer"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "cli/kp-admin/src/index.js"
  - "cli/kp-admin/src/api.js"
  - "cli/kp-admin/package.json"
related: ["cli-overview", "cli-kp-ws", "api-overview"]
---

# kp-admin CLI Reference

`kp-admin` is the platform administration CLI for K-Perception. It provides operator-level access to user management, workspace management, storage statistics, and the platform audit log.

**Authentication:** Admin bearer token (`ADMIN_API_TOKEN`). This token is a server-side operator credential distinct from user session tokens. It is configured on the worker and must be passed via `kp-admin login` or the `KP_ADMIN_TOKEN` environment variable.

**Backend:** Connects to the admin-panel JSON API surface at `/admin/api/*` endpoints.

**Runtime requirement:** Node.js 20+

---

## Session management

### kp-admin login

```
kp-admin login --base-url <url> [--token <token>]
```

Stores admin credentials locally. If `--token` is not provided, the CLI prompts interactively. On login, the CLI probes `/admin/api/stats` to verify the credentials are valid.

| Flag | Description |
|------|-------------|
| `--base-url` | Admin panel base URL, e.g. `https://api.kperception.app` |
| `--token` | Admin bearer token (or set `KP_ADMIN_TOKEN` env var) |

### kp-admin logout

```
kp-admin logout
```

Removes stored admin credentials.

### kp-admin health

```
kp-admin health
```

Fetches and prints the `/admin/health` endpoint response. Does not require stored credentials (uses the configured base URL only).

---

## Statistics

### kp-admin stats

```
kp-admin stats [--json]
```

Displays platform-wide statistics.

**API call:** `GET /admin/api/stats`

---

## User management

### kp-admin users list

```
kp-admin users list [--page 0] [--limit 50] [--q <search>] [--json]
```

Lists users with optional search and pagination.

| Flag | Default | Description |
|------|---------|-------------|
| `--page` | `0` | Page number (zero-indexed) |
| `--limit` | `50` | Results per page |
| `--q` | — | Search query string |

**API call:** `GET /admin/api/users?page=<n>&limit=<n>[&q=<q>]`

### kp-admin users show

```
kp-admin users show <userId> [--json]
```

Displays details for a specific user.

**API call:** `GET /admin/api/users/:userId`

### kp-admin users suspend

```
kp-admin users suspend <userId> [--json]
```

Suspends a user account.

**API call:** `POST /admin/api/users/:userId/suspend`

### kp-admin users reactivate

```
kp-admin users reactivate <userId> [--json]
```

Reactivates a suspended user account.

**API call:** `POST /admin/api/users/:userId/reactivate`

### kp-admin users set-tier

```
kp-admin users set-tier <userId> <tier> [--expires-at <iso8601>] [--json]
```

Sets the entitlement tier for a user.

| Argument / Flag | Description |
|-----------------|-------------|
| `userId` | Target user UUID |
| `tier` | Tier name: `free`, `lifetime`, `team`, or `enterprise` |
| `--expires-at` | Optional ISO 8601 expiry timestamp for the tier |

**API call:** `POST /admin/api/users/:userId/tier` with `{ tier, expiresAt }` body

---

## Workspace management

### kp-admin workspaces list

```
kp-admin workspaces list [--page 0] [--limit 50] [--q <search>] [--json]
```

Lists workspaces with optional search and pagination.

| Flag | Default | Description |
|------|---------|-------------|
| `--page` | `0` | Page number (zero-indexed) |
| `--limit` | `50` | Results per page |
| `--q` | — | Search query string |

**API call:** `GET /admin/api/workspaces?page=<n>&limit=<n>[&q=<q>]`

### kp-admin workspaces show

```
kp-admin workspaces show <workspaceId> [--json]
```

Displays details for a specific workspace.

**API call:** `GET /admin/api/workspaces/:workspaceId`

### kp-admin workspaces suspend

```
kp-admin workspaces suspend <workspaceId> [--json]
```

Suspends a workspace.

**API call:** `POST /admin/api/workspaces/:workspaceId/suspend`

### kp-admin workspaces reactivate

```
kp-admin workspaces reactivate <workspaceId> [--json]
```

Reactivates a suspended workspace.

**API call:** `POST /admin/api/workspaces/:workspaceId/reactivate`

---

## Storage

### kp-admin storage

```
kp-admin storage [--json]
```

Displays platform-wide storage usage statistics.

**API call:** `GET /admin/api/storage`

---

## Audit log

### kp-admin audit

```
kp-admin audit [--limit 200] [--json]
```

Displays the platform audit log.

| Flag | Default | Description |
|------|---------|-------------|
| `--limit` | `200` | Maximum events to retrieve |

**API call:** `GET /admin/api/audit?limit=<n>`

### kp-admin audit admin

```
kp-admin audit admin [--json]
```

Displays the admin-action audit log (actions performed by operator-level credentials).

**API call:** `GET /admin/api/audit/admin`

---

## Stripe

### kp-admin stripe catalog

```
kp-admin stripe catalog [--json]
```

Displays the Stripe product/price catalog.

**API call:** `GET /admin/api/stripe/catalog`

### kp-admin stripe revenue

```
kp-admin stripe revenue [--json]
```

Displays revenue summary data from Stripe.

**API call:** `GET /admin/api/stripe/revenue`

---

## Global flags

| Flag | Description |
|------|-------------|
| `--json` | Output raw JSON instead of human-readable table |

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `KP_ADMIN_TOKEN` | Overrides the stored admin bearer token for this invocation |
| `KP_ADMIN_BASE_URL` | Overrides the stored admin panel base URL for this invocation |

Environment variables take precedence over stored credentials, making them suitable for CI/CD pipelines.

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `2` | Unknown command |
| Other non-zero | Unhandled error thrown by a command |
