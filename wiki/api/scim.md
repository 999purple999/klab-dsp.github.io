---
title: "SCIM 2.0 API"
slug: "api-scim"
category: "API"
tags: ["api", "scim", "provisioning", "enterprise", "idp"]
audience: "developer"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
related: ["api-overview", "api-authentication", "api-errors"]
---

# SCIM 2.0 API

K-Perception supports the SCIM 2.0 protocol for automated user provisioning and deprovisioning. This allows identity providers (Okta, Azure AD, etc.) to manage workspace membership without manual intervention.

**Plan requirement:** Enterprise workspaces only. SCIM must be enabled for the workspace (`scim_enabled = true`).

## Base URL

```
https://api.kperception.app/workspaces/:workspaceId/scim/v2/
```

Replace `:workspaceId` with the UUID of the target workspace.

## Authentication

All SCIM requests must include a Bearer token:

```
Authorization: Bearer <scim-token>
```

SCIM tokens are distinct from user session tokens and API Keys. They are created through the workspace SCIM configuration panel. Like API keys, the token is **SHA-256 hashed** before storage — the raw token is shown only at creation time.

Requests with a missing, invalid, or revoked SCIM token return HTTP 401.

## Content type

SCIM responses use `Content-Type: application/scim+json`. Errors also use this content type.

## Error format

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"],
  "status": "404",
  "detail": "User not found"
}
```

---

## Users

### GET /workspaces/:id/scim/v2/Users

Returns all provisioned users in the workspace.

**Response:**
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  "totalResults": 2,
  "Resources": [
    {
      "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
      "id": "external-id-from-idp",
      "externalId": "external-id-from-idp",
      "userName": "user@example.com",
      "emails": [{ "value": "user@example.com" }]
    }
  ]
}
```

The `id` and `externalId` fields contain the IdP-provided external identifier. The full attribute set stored reflects what was sent on the original `POST` or `PUT`.

---

### POST /workspaces/:id/scim/v2/Users

Provisions a new user. If a user with the same `externalId` (or `userName` if `externalId` is absent) already exists, the existing record is updated.

**Request body** (standard SCIM User resource):
```json
{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "externalId": "idp-user-123",
  "userName": "user@example.com",
  "displayName": "Jane Smith",
  "emails": [{ "value": "user@example.com", "primary": true }]
}
```

The `externalId` field is preferred as the stable identifier; `userName` is used as a fallback. If the email address matches an existing K-Perception account, the provisioning call also adds that user to the workspace with the `viewer` role.

**Response (201):** The created/updated user resource.

---

### PUT /workspaces/:id/scim/v2/Users/:externalId

Updates attributes for an existing user.

**Request body:** Full user resource (same shape as POST).

**Response (200):** Updated user resource.

---

### PATCH /workspaces/:id/scim/v2/Users/:externalId

Partial update using SCIM patch operations.

**Response (200):** Updated user resource.

---

### DELETE /workspaces/:id/scim/v2/Users/:externalId

Deprovisions a user. This:
1. Soft-deletes the SCIM mapping record.
2. Revokes the user's workspace membership.
3. Revokes all active sessions for that user.

**Response:** HTTP 204 No Content.

---

## Groups

Groups in SCIM map directly to K-Perception workspace groups. Creating a group via SCIM also creates the backing workspace section.

### GET /workspaces/:id/scim/v2/Groups

Returns all provisioned groups.

**Response:**
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  "totalResults": 1,
  "Resources": [
    {
      "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
      "id": "group-uuid",
      "displayName": "engineering",
      "members": [
        { "value": "external-id-1", "$ref": "external-id-1" }
      ]
    }
  ]
}
```

---

### POST /workspaces/:id/scim/v2/Groups

Creates a new group. The `displayName` is slug-normalised to lowercase alphanumeric-and-hyphens.

**Request body:**
```json
{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
  "displayName": "engineering",
  "members": [
    { "value": "external-id-1" }
  ]
}
```

Members are resolved by their SCIM `externalId`. Members not found in the SCIM mapping table are silently skipped.

**Response (201):** The created group resource.

---

### GET /workspaces/:id/scim/v2/Groups/:groupId

Returns a single group by its K-Perception group UUID.

**Response:** Group resource with current member list.

---

### PATCH /workspaces/:id/scim/v2/Groups/:groupId

Updates group membership using SCIM patch operations. Supported operations:

| `op` | `path` | Effect |
|------|--------|--------|
| `add` | `members` | Adds each `value` to the group |
| `remove` | `members` | Removes each `value` from the group |

**Request body:**
```json
{
  "Operations": [
    {
      "op": "add",
      "path": "members",
      "value": [{ "value": "external-id-2" }]
    }
  ]
}
```

**Response (200):** Updated group resource.

---

### DELETE /workspaces/:id/scim/v2/Groups/:groupId

Soft-deletes the group.

**Response:** HTTP 204 No Content.

---

## SCIM schemas used

| Schema URI | Resource type |
|------------|--------------|
| `urn:ietf:params:scim:schemas:core:2.0:User` | User resource |
| `urn:ietf:params:scim:schemas:core:2.0:Group` | Group resource |
| `urn:ietf:params:scim:api:messages:2.0:ListResponse` | List response envelope |
| `urn:ietf:params:scim:api:messages:2.0:Error` | Error response |
