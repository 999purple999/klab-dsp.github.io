---
title: "API Authentication"
slug: "api-authentication"
category: "API"
tags: ["api", "authentication", "api-keys", "jwt", "bearer"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
  - "private-sync-worker/src/session.ts"
related: ["api-overview", "api-workspaces", "api-errors"]
---

# API Authentication

The K-Perception API supports two authentication methods: JWT Bearer tokens for user-context calls and API Keys for workspace automation.

## JWT Bearer token

JWT Bearer tokens are issued by the authentication subsystem when a user signs in. They are used for all company and workspace management operations that require a user session.

**Header format:**
```
Authorization: Bearer <jwt>
```

JWT tokens carry the authenticated user's identity and are validated against the session store on every request. Tokens expire and must be refreshed using the session refresh endpoint.

Use JWT tokens for:
- All `/companies/` endpoints
- All `/workspaces/` management endpoints (invite members, update settings, etc.)
- Any operation that requires a specific user's identity for audit purposes

## API Keys

API Keys are long-lived credentials scoped to a specific workspace. They are intended for automation and machine-to-machine integrations.

**Header format:**
```
Authorization: ApiKey <key>
```

**Security:** When an API key is presented, the Worker computes `SHA-256(key)` and looks up the resulting hash in the database. The raw key is never stored on the server.

### Obtaining an API key

API keys are created through the workspace Admin console:

1. Open the workspace and go to **Settings**.
2. Navigate to **Integrations** > **API Keys**.
3. Click **Create API Key**, choose a name and set the desired scopes.
4. Copy the key shown — it is displayed only once.

### Key scopes

Each API key carries one or more comma-separated scopes that control which `/api/v1/workspaces/` routes it can access:

| Scope | Access granted |
|-------|---------------|
| `admin` | All routes (supersedes all other scopes) |
| `read:metadata` | `GET .../notes`, `GET .../members`, `GET .../sections` |
| `read:content` | Adds `r2Key` and `blobId` fields to notes response (ciphertext blob references) |

The `read:metadata` scope is required for most read operations. The `read:content` scope extends the notes listing to include blob storage references so the caller can download ciphertext.

Note: `/api/v1/workspaces/:id/info` does **not** require `read:metadata` — it is accessible with any valid key scoped to that workspace.

### Key expiry

API keys may be created with an optional `expires_at` timestamp. Expired keys are rejected at authentication time with HTTP 401. Keys without an expiry are valid until explicitly revoked.

### Key rotation

To rotate a key: create a new key, update your automation to use the new key, then revoke the old key from the Admin console.

## Workspace scoping

Each API key is scoped to exactly one workspace. Presenting a key for workspace A while accessing workspace B's endpoints returns HTTP 403 with code `forbidden`.

## SCIM tokens

SCIM endpoints use a separate token type authenticated with:

```
Authorization: Bearer <scim-token>
```

SCIM tokens are managed independently from API keys and are created through the SCIM configuration UI. Like API keys, the token is SHA-256 hashed before storage. See [SCIM 2.0 API](scim.md) for details.
