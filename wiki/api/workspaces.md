---
title: "Workspace API Endpoints"
slug: "api-workspaces"
category: "API"
tags: ["api", "workspaces", "notes", "members", "sections"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
related: ["api-overview", "api-authentication", "api-pagination", "api-errors"]
---

# Workspace API Endpoints (v1)

The workspace REST API exposes read access to workspace metadata and (optionally) ciphertext blob references. All endpoints are authenticated by API Key only — JWT Bearer is not accepted at `/api/v1/`.

**Base path:** `https://api.kperception.app/api/v1/workspaces/:id/`

All content returned is **ciphertext** or metadata only. The server has no knowledge of plaintext note content.

---

## GET /api/v1/workspaces/:id/info

Returns basic metadata about the workspace. Does not require a specific scope — any valid key scoped to this workspace may call this endpoint.

**Auth:** `Authorization: ApiKey <key>`

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Workspace ID (UUID) |

**Response:**
```json
{
  "ok": true,
  "data": {
    "workspaceId": "string",
    "slug": "string",
    "planTier": "string",
    "keyVersion": 1,
    "memberLimit": 20,
    "scopes": ["read:metadata", "read:content"]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `workspaceId` | string | The workspace UUID |
| `slug` | string | Human-readable workspace identifier |
| `planTier` | string | Current plan: `free`, `lifetime`, `team`, or `enterprise` |
| `keyVersion` | number | Current workspace key version (incremented on key rotation) |
| `memberLimit` | number | Maximum member count; `0` = unlimited |
| `scopes` | string[] | The scopes granted to the authenticating API key |

**Errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `auth_required` | 401 | Missing or invalid API key |
| `not_found` | 404 | Workspace not found |
| `forbidden` | 403 | API key not scoped to this workspace |

---

## GET /api/v1/workspaces/:id/notes

Lists workspace change-log entries for notes. Returns metadata only unless the key has `read:content` scope.

**Auth:** `Authorization: ApiKey <key>` — requires `read:metadata` scope

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Workspace ID (UUID) |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `after` | integer | `0` | Return only entries with `canonicalSeq` greater than this value. Use for cursor-based pagination. |
| `limit` | integer | `100` | Maximum entries to return. Capped at `500`. |

**Response:**
```json
{
  "ok": true,
  "data": {
    "notes": [
      {
        "noteId": "string",
        "canonicalSeq": 42,
        "updatedAt": "2026-01-15T12:00:00.000Z",
        "authorUserId": "string",
        "sectionId": "string",
        "keyVersion": 1,
        "ciphertextSize": 1024,
        "tombstone": false,
        "payloadHash": "string"
      }
    ]
  }
}
```

When the API key also has `read:content` scope, each note additionally includes:

| Field | Type | Description |
|-------|------|-------------|
| `r2Key` | string or null | R2 storage key for the ciphertext blob |
| `blobId` | string or null | Blob identifier for direct retrieval |

**Note on tombstones:** When `tombstone` is `true`, the note has been deleted. The `ciphertextSize` and other content fields may be null or zero for tombstoned entries.

**Pagination:** Use the `canonicalSeq` of the last returned note as the `after` value in the next request. Continue until an empty `notes` array is returned. See [Pagination](pagination.md) for more detail.

**Errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `auth_required` | 401 | Missing or invalid API key |
| `forbidden` | 403 | Key not scoped to this workspace, or missing `read:metadata` scope |
| `not_found` | 404 | Workspace not found |

---

## GET /api/v1/workspaces/:id/members

Lists all members of the workspace.

**Auth:** `Authorization: ApiKey <key>` — requires `read:metadata` scope

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Workspace ID (UUID) |

**Response:**
```json
{
  "ok": true,
  "data": {
    "members": [
      {
        "userId": "string",
        "role": "editor",
        "email": "user@example.com"
      }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | User UUID |
| `role` | string | Member's role: `owner`, `admin`, `editor`, `commenter`, `viewer`, or `guest` |
| `email` | string | Display email address |

**Errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `auth_required` | 401 | Missing or invalid API key |
| `forbidden` | 403 | Key not scoped to this workspace, or missing `read:metadata` scope |
| `not_found` | 404 | Workspace not found |

---

## GET /api/v1/workspaces/:id/sections

Lists all sections (notebook sections) in the workspace.

**Auth:** `Authorization: ApiKey <key>` — requires `read:metadata` scope

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Workspace ID (UUID) |

**Response:**
```json
{
  "ok": true,
  "data": {
    "sections": [
      {
        "sectionId": "string",
        "slug": "string",
        "icon": "string",
        "sortIndex": 0
      }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sectionId` | string | Section UUID |
| `slug` | string | URL-safe section identifier |
| `icon` | string or null | Emoji or icon identifier |
| `sortIndex` | number | Display order position |

**Errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `auth_required` | 401 | Missing or invalid API key |
| `forbidden` | 403 | Key not scoped to this workspace, or missing `read:metadata` scope |
| `not_found` | 404 | Workspace not found |

---

## Workspace roles

The `role` field in the members response uses these values:

| Role | Description |
|------|-------------|
| `owner` | Workspace owner; can transfer ownership and delete workspace |
| `admin` | Full management access |
| `editor` | Can create and edit notes |
| `commenter` | Can read and comment |
| `viewer` | Read-only access |
| `guest` | Section-scoped access |
