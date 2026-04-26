---
title: "SCIM 2.0 Provisioning Overview"
slug: "scim-overview"
category: "Enterprise"
tags: ["scim", "provisioning", "enterprise", "directory-sync"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
related: ["enterprise/scim-okta", "enterprise/scim-azure-ad", "enterprise/scim-groups", "enterprise/saml-okta", "enterprise/overview"]
---

# SCIM 2.0 Provisioning Overview

## What it is

SCIM (System for Cross-domain Identity Management) 2.0 is a standardised protocol that lets your Identity Provider (IdP) automatically provision, update, and deprovision workspace members in K-Perception. When an employee joins your organisation, your IdP pushes their account into K-Perception. When they leave, the IdP removes access immediately — without manual intervention.

K-Perception supports SCIM 2.0 for workspace-level provisioning. The SCIM endpoint base URL is:

```
https://api.kperception.app/workspaces/{workspaceId}/scim/v2/
```

Supported resource types:

| Resource type | Path | Operations |
|---|---|---|
| Users | `/workspaces/{workspaceId}/scim/v2/Users` | GET (list), POST (create) |
| User by ID | `/workspaces/{workspaceId}/scim/v2/Users/{externalId}` | PUT, PATCH, DELETE |
| Groups | `/workspaces/{workspaceId}/scim/v2/Groups` | GET (list), POST (create) |
| Group by ID | `/workspaces/{workspaceId}/scim/v2/Groups/{groupId}` | GET, PATCH, DELETE |

## When to use it

Use SCIM when you want:
- Automatic user provisioning when new employees join your IdP directory.
- Automatic deprovisioning (session revocation + workspace removal) when employees leave.
- Group membership sync so your IdP groups map to K-Perception workspace groups.

SCIM is complementary to SAML/OIDC SSO. SAML/OIDC handles login; SCIM handles lifecycle management.

## Authentication

All SCIM endpoints use Bearer token authentication:

```
Authorization: Bearer <scim-token>
```

SCIM tokens are distinct from user session tokens. Generate a SCIM token in **Workspace admin** → **Security** → **SCIM tokens** → **Generate token**. The token hash is stored in the `workspace_scim_tokens` table — the raw value is only shown once on generation.

SCIM is only available when `scim_enabled = true` on the workspace. Enabling SCIM does not automatically enable SSO, and vice versa.

## User resource

A SCIM User resource corresponds to a workspace member. When a User is created via SCIM:

1. K-Perception stores the IdP's `externalId` (or `userName`) in `workspace_scim_mappings`.
2. If a K-Perception account with the matching email already exists, the mapping is linked and the user is added as a workspace member with role `viewer`.
3. If no matching account exists, the SCIM mapping is created (with `kp_user_id = NULL`) but no K-Perception account is automatically created and no workspace membership is added. The user will be linked and added as a member when they subsequently log in via SAML JIT provisioning or create an account manually with a matching email address.

When a User is deleted via SCIM:
- The linked K-Perception workspace membership is revoked.
- All active sessions for that user are revoked immediately.
- The SCIM mapping is soft-deleted (`deleted_at` timestamp set).

## Group resource

A SCIM Group corresponds to a K-Perception workspace group (backed by a workspace section). See [SCIM Group sync](scim-groups.md) for full details.

When a Group is created via SCIM:
- A new `workspace_groups` row and its backing `workspace_sections` row are created.
- Member `value` fields are resolved via existing SCIM mappings and added to the group.

When a Group is patched via SCIM (`PATCH` with `Operations`):
- `add` operations add members to the group.
- `remove` operations remove members from the group.

When a Group is deleted via SCIM:
- The group is soft-deleted (`deleted_at` set); backing section is not deleted.

## Response format

All SCIM endpoints return `Content-Type: application/scim+json`.

List responses follow the SCIM `ListResponse` envelope:

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  "totalResults": 3,
  "Resources": [...]
}
```

Error responses follow the SCIM `Error` schema:

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"],
  "status": "401",
  "detail": "Unauthorized"
}
```

## Step by step

### Step 1 — Enable SCIM on the workspace

1. Open K-Perception → **Workspace admin** → **Security** → **SCIM provisioning**.
2. Toggle **Enable SCIM**.

### Step 2 — Generate a SCIM token

3. Click **Generate new token**.
4. Copy the token immediately — it is only shown once.

### Step 3 — Configure your IdP

5. Enter the SCIM base URL: `https://api.kperception.app/workspaces/{workspaceId}/scim/v2/`
6. Enter the SCIM Bearer token.
7. Test the connection in your IdP's SCIM configuration page.

See [SCIM with Okta](scim-okta.md) or [SCIM with Azure AD](scim-azure-ad.md) for IdP-specific steps.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| SCIM token is revoked | All SCIM calls return `401 Unauthorized` |
| SCIM is disabled on workspace | All SCIM calls return `403 SCIM not enabled` |
| User POST when user already provisioned | Upserts the SCIM mapping (idempotent) |
| User DELETE when user has no sessions | Revoke calls are no-ops; mapping soft-deleted |
| Group PATCH with unknown member `value` | Member is silently skipped — no error |

## Platform differences

SCIM is a server-side provisioning protocol. There is no platform-specific client behaviour.

## Plan availability

SCIM 2.0 provisioning requires the **Enterprise** plan.

## Permissions and roles

- SCIM tokens are workspace-scoped. Only workspace owners and admins can generate or revoke SCIM tokens.
- SCIM-provisioned users are assigned the `viewer` role by default.

## Security implications

- SCIM tokens are stored as SHA-256 hashes only — the raw value cannot be recovered after generation.
- Deleting a user via SCIM immediately revokes all their active sessions — they are logged out on all devices.
- SCIM does not re-wrap encryption keys. Provisioning via SCIM alone does not grant access to existing encrypted content until a workspace admin shares the WDK with the new user.

## Settings reference

| Parameter | Value |
|---|---|
| SCIM base URL | `https://api.kperception.app/workspaces/{workspaceId}/scim/v2/` |
| Authentication method | Bearer token (`Authorization: Bearer <token>`) |
| Supported User operations | GET, POST, PUT, PATCH, DELETE |
| Supported Group operations | GET, POST, PATCH, DELETE |
| Content-Type | `application/scim+json` |
| Default provisioned role | `viewer` |

## Related articles

- [SCIM with Okta](scim-okta.md)
- [SCIM with Azure AD](scim-azure-ad.md)
- [SCIM Group sync](scim-groups.md)
- [SAML SSO with Okta](saml-okta.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/workspaceEnterprise.ts` — `handleScim` function implementing all SCIM routes
