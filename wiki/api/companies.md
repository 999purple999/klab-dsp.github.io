---
title: "Company API Endpoints"
slug: "api-companies"
category: "API"
tags: ["api", "companies", "enterprise", "members", "audit", "policy"]
audience: "developer"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
related: ["api-overview", "api-authentication", "api-errors", "api-pagination"]
---

# Company API Endpoints

The Company API provides enterprise-tier functionality for managing multi-workspace organisations. All endpoints require a valid JWT Bearer session token. The authenticated user must be a member of the company in the role stated per endpoint.

**Base path:** `https://api.kperception.app/companies`

**Auth:** `Authorization: Bearer <jwt>` for all routes (except SSO callback/ACS/metadata which are publicly reachable for IdP callbacks).

**Plan requirement:** Creating a company requires an Enterprise account tier. Members of the company retain access regardless of their personal tier.

---

## Company roles

| Role | Permissions |
|------|-------------|
| `super-admin` | Full management: create/update company, manage members and workspaces, update policy, issue password resets |
| `billing-admin` | Read billing information |
| `auditor` | Read audit log, GDPR export |
| `observer` | Read company metadata only |

---

## POST /companies

Creates a new company. Caller becomes the first `super-admin`.

**Required role:** Authenticated user must have an Enterprise account tier.

**Request body:**
```json
{
  "legalName": "Acme Corp",
  "primaryDomain": "acme.com",
  "secondaryDomains": ["acme.io"]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `legalName` | Yes | Company display name |
| `primaryDomain` | Yes | Primary email domain for the company |
| `secondaryDomains` | No | Additional allowed email domains |

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "company": {
      "companyId": "string",
      "legalName": "Acme Corp",
      "primaryDomain": "acme.com",
      "secondaryDomains": [],
      "defaultPolicy": {},
      "status": "active",
      "billingContactUserId": "string",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

**Errors:** `tier_blocked` (403) if the caller is not on Enterprise.

---

## GET /companies

Lists all companies the authenticated user is a member of.

**Response:**
```json
{
  "ok": true,
  "data": {
    "companies": [
      {
        "companyId": "string",
        "legalName": "string",
        "primaryDomain": "string",
        "secondaryDomains": [],
        "defaultPolicy": {},
        "status": "active",
        "billingContactUserId": "string",
        "createdAt": "string",
        "updatedAt": "string",
        "myRole": "super-admin"
      }
    ]
  }
}
```

---

## GET /companies/:id

Returns metadata for a specific company.

**Required role:** Any company member (observer or above).

**Response:** Same shape as the object in `POST /companies` response, plus `myRole`.

**Errors:** `forbidden` (403) if not a member; `not_found` (404) if company does not exist.

---

## PUT /companies/:id

Updates company name, domains, or default policy.

**Required role:** `super-admin`

**Request body** (all fields optional):
```json
{
  "legalName": "string",
  "primaryDomain": "string",
  "secondaryDomains": ["string"],
  "defaultPolicy": {}
}
```

**Response:** Updated company object.

---

## POST /companies/:id/members

Adds a user to the company.

**Required role:** `super-admin`

**Request body:**
```json
{
  "userId": "string",
  "email": "user@acme.com",
  "role": "auditor"
}
```

Provide either `userId` or `email`. If `email` is provided and no account exists with that address, the request returns 404. The `role` must be one of `super-admin`, `billing-admin`, `auditor`, or `observer`.

If the company policy has `blockExternalInvites` enabled, the invited user's email domain must match an allowed domain; otherwise the request returns 403 with code `domain_not_allowed`.

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "added": true,
    "userId": "string",
    "role": "auditor"
  }
}
```

---

## GET /companies/:id/members

Lists all current and past company members.

**Required role:** Any company member.

**Response:**
```json
{
  "ok": true,
  "data": {
    "members": [
      {
        "companyId": "string",
        "userId": "string",
        "role": "super-admin",
        "addedBy": "string",
        "addedAt": "string",
        "removedAt": null
      }
    ]
  }
}
```

---

## PUT /companies/:id/members/:userId

Changes a member's role.

**Required role:** `super-admin`

**Request body:**
```json
{ "role": "billing-admin" }
```

Demoting the last `super-admin` returns 409 with code `last_super_admin`.

**Response:**
```json
{ "ok": true, "data": { "updated": true, "userId": "string", "role": "billing-admin" } }
```

---

## DELETE /companies/:id/members/:userId

Soft-removes a member from the company (sets `removedAt`).

**Required role:** `super-admin`

Removing the last `super-admin` returns 409 with code `last_super_admin`.

**Response:**
```json
{ "ok": true, "data": { "removed": true, "userId": "string" } }
```

---

## POST /companies/:id/members/:userId/issue-reset

Issues a one-time password reset token for a company member. The returned `resetUrl` should be sent to the user out-of-band. Token TTL is 1 hour.

**Required role:** `super-admin`

The target user must have email+password authentication enabled. Google-only accounts return 400 with code `no_local_credential`.

**Response:**
```json
{
  "ok": true,
  "data": {
    "resetUrl": "https://app.kperception.com/auth/reset-password?token=...",
    "expiresAt": "2026-01-01T01:00:00.000Z",
    "userId": "string"
  }
}
```

---

## POST /companies/:id/workspaces

Creates a workspace inside the company (two-step flow) or links an existing workspace.

**Required role:** `super-admin`

**Step 1 — obtain intent token** (request body is empty or `{}`):
```json
{
  "ok": true,
  "data": {
    "intentToken": "string",
    "instruction": "Call POST /workspaces with planTier=enterprise then POST /companies/:id/workspaces with { workspaceId } to commit."
  }
}
```

**Step 2 — commit** (provide the `workspaceId` from the newly created workspace):
```json
{ "workspaceId": "string" }
```

The workspace must have `plan_tier = 'enterprise'`. Returns 409 with code `conflict` if the workspace is already linked to another company.

---

## POST /companies/:id/workspaces/:wsId/link

Links an existing standalone workspace to the company using an owner-signed approval token.

**Required role:** `super-admin`

**Request body:**
```json
{ "approvalToken": "<base64-JSON>" }
```

The `approvalToken` is a base64-encoded JSON object `{ workspaceId, companyId, expiresAt, signedBy: ownerUserId }` produced by the workspace owner. Tokens are valid for a limited time.

---

## DELETE /companies/:id/workspaces/:wsId

Unlinks a workspace from the company.

**Required role:** `super-admin`

This removes the company's ability to read the workspace audit feed via the company audit key. Existing workspace members and their keys are not affected.

---

## GET /companies/:id/workspaces

Lists all workspaces linked to this company.

**Required role:** Any company member.

**Response:**
```json
{
  "ok": true,
  "data": {
    "workspaces": [
      {
        "workspaceId": "string",
        "slug": "string",
        "name": "string",
        "plan": "enterprise",
        "status": "active",
        "memberCount": 12,
        "memberLimit": 50,
        "storageLimitBytes": 10737418240,
        "addedAt": "string"
      }
    ]
  }
}
```

---

## GET /companies/:id/audit

Returns the company audit event log. Each event is hash-chained for tamper detection. The body (`bodyEnc`) is base64-encoded and encrypted under the company audit key — only super-admins with the appropriate key wrap can decrypt it.

**Required role:** `auditor` or above

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | ISO 8601 datetime | Return events at or after this time |
| `to` | ISO 8601 datetime | Return events at or before this time |

Maximum 500 events are returned per request. Accessing the audit log itself appends a `COMPANY_AUDIT_VIEWED` event to the chain.

**Response:**
```json
{
  "ok": true,
  "data": {
    "events": [
      {
        "eventId": "string",
        "companyId": "string",
        "eventSeq": 1,
        "type": "COMPANY_MEMBER_ADDED",
        "actorId": "string",
        "bodyEnc": "string",
        "hashChainPrev": "string or null",
        "hashChainSelf": "string",
        "createdAt": "string"
      }
    ]
  }
}
```

**Audit event types:**

| Type | Description |
|------|-------------|
| `COMPANY_CREATED` | Company was created |
| `COMPANY_MEMBER_ADDED` | A member was added |
| `COMPANY_MEMBER_ROLE_CHANGED` | A member's role changed |
| `COMPANY_MEMBER_REMOVED` | A member was removed |
| `COMPANY_WORKSPACE_LINKED` | A workspace was linked |
| `COMPANY_WORKSPACE_UNLINKED` | A workspace was unlinked |
| `COMPANY_POLICY_CHANGED` | Company policy was updated |
| `COMPANY_AUDIT_VIEWED` | The audit log was accessed |
| `BACKUP_SCHEDULE_CREATED` | A backup schedule was created |
| `BACKUP_SCHEDULE_RAN` | Scheduled backup ran |
| `BACKUP_SCHEDULE_FAILED` | Scheduled backup failed |
| `BACKUP_REPLICATED` | Backup was replicated |
| `BACKUP_RESTORED_NEW` | Backup restored to a new workspace |
| `BACKUP_RESTORED_OVERWRITE` | Backup restored over an existing workspace |
| `BACKUP_REPLICA_PROMOTED` | Replica backup promoted to primary |
| `BACKUP_CORRUPT_DETECTED` | Corrupt backup detected |
| `JOIN_AS_ADMIN_USED` | Admin join token was used |
| `MEMBER_PASSWORD_RESET_ISSUED` | Password reset token was issued for a member |

---

## GET /companies/:id/billing

Returns consolidated billing data across all linked workspaces.

**Required role:** `super-admin` or `billing-admin`

**Response:**
```json
{
  "ok": true,
  "data": {
    "rows": [
      {
        "workspaceId": "string",
        "slug": "string",
        "plan": "enterprise",
        "seatsUsed": 12,
        "seatsTotal": 50,
        "mrrCents": null
      }
    ],
    "totalSeats": 12,
    "totalMrrCents": 0
  }
}
```

Note: `mrrCents` is currently `null`. [NEEDS-VERIFY: billing integration with Stripe is present but exact MRR computation may not be exposed via this endpoint.]

---

## PUT /companies/:id/policy

Updates company-wide security policy.

**Required role:** `super-admin`

**Request body:**
```json
{
  "policy": {
    "domains": {
      "blockExternalInvites": true,
      "allowedDomains": ["acme.com"]
    }
  }
}
```

[NEEDS-VERIFY: full policy schema — confirm all available policy fields in `src/shared/companyPolicy.ts`.]

**Response:**
```json
{ "ok": true, "data": { "policy": { ... } } }
```

---

## GET /companies/:id/compliance/gdpr-export

Returns a list of company members with their personal data for GDPR documentation purposes. The response is **not** encrypted — it contains display names and email addresses accessible to the caller.

**Required role:** `auditor` or above

**Response:**
```json
{
  "ok": true,
  "data": {
    "generated_at": "string",
    "company_id": "string",
    "members": [
      {
        "userId": "string",
        "role": "string",
        "joinedAt": "string",
        "removedAt": null,
        "email": "string",
        "displayName": "string"
      }
    ]
  }
}
```

---

## POST /companies/:id/compliance/purge-member

Permanently purges a company member's personal data (GDPR right to erasure).

**Required role:** `super-admin`

**Request body:**
```json
{ "userId": "string" }
```

[NEEDS-VERIFY: exact response shape and full side-effects of the purge operation.]
