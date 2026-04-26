---
title: "API Error Reference"
slug: "api-errors"
category: "API"
tags: ["api", "errors", "error-codes", "http-status"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/src/company.ts"
  - "private-sync-worker/src/rateLimiter.ts"
related: ["api-overview", "api-authentication", "api-rate-limits"]
---

# API Error Reference

All error responses from the K-Perception API use a consistent JSON envelope:

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

The `detail` field is optional and present only for errors that carry structured extra context (for example, tier or plan information).

---

## HTTP status codes

| Status | Meaning |
|--------|---------|
| 400 | Invalid request — bad JSON, missing required field, invalid parameter value |
| 401 | Authentication required or credentials invalid |
| 403 | Authenticated but not authorised for this operation |
| 404 | Resource not found |
| 405 | HTTP method not allowed on this route |
| 409 | Conflict — state constraint violated |
| 429 | Rate limited or capacity limit reached |
| 503 | Service unavailable |

---

## Error codes

### Authentication and authorisation

| Code | HTTP | Description |
|------|------|-------------|
| `auth_required` | 401 | No valid authentication credentials were provided |
| `two_fa_required` | 403 | The operation requires step-up 2FA. Obtain an elevation token first. |
| `elevation_required` | 401 | A step-up elevation token is required for this operation |
| `forbidden` | 403 | The authenticated user does not have permission for this operation |
| `ip_not_allowed` | 403 | The client IP is not in the workspace or company IP allowlist |
| `mfa_required` | 403 | Company policy requires TOTP to be enrolled before making changes |

### Resources

| Code | HTTP | Description |
|------|------|-------------|
| `not_found` | 404 | The requested resource does not exist |
| `conflict` | 409 | The resource already exists or a uniqueness constraint would be violated |

### Plan and tier

| Code | HTTP | Description |
|------|------|-------------|
| `tier_blocked` | 403 | The operation requires a higher plan tier. The `detail.tier` field indicates the required tier. |

### Members and invites

| Code | HTTP | Description |
|------|------|-------------|
| `member_limit_reached` | 429 | The workspace has reached its member limit |
| `guest_limit_reached` | 429 | The workspace has reached its guest limit |
| `domain_not_allowed` | 403 | The invitee's email domain is not permitted by company policy |
| `last_super_admin` | 409 | Cannot remove or demote the last `super-admin` of a company |

### Keys and cryptography

| Code | HTTP | Description |
|------|------|-------------|
| `key_version_mismatch` | 409 | The submitted key version is not greater than the current version |

### Rate limiting

| Code | HTTP | Description |
|------|------|-------------|
| `rate_limited` | 429 | The sliding-window rate limit for this endpoint has been exceeded. Check the `retryAfterSeconds` field and the `Retry-After` response header. |

### Input validation

| Code | HTTP | Description |
|------|------|-------------|
| `invalid_request` | 400 | A required field is missing, a field value is invalid, or request body could not be parsed |
| `invalid_json` | 400 | Request body is not valid JSON |
| `invalid_input` | 400 | A field value failed validation (company routes) |

### SCIM

SCIM errors use a different envelope (see [SCIM 2.0 API](scim.md)):

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"],
  "status": "400",
  "detail": "externalId required"
}
```

### Workspace operations

| Code | HTTP | Description |
|------|------|-------------|
| `no_local_credential` | 400 | Target user does not have email+password auth; cannot issue a password reset |
| `approval_required` | 403 | Workspace owner must sign an approval token before linking to a company |
| `invalid_token` | 400/403 | Provided token is invalid, expired, or does not match the expected resource |
| `method_not_allowed` | 405 | HTTP method not supported for this route |

### Miscellaneous

| Code | HTTP | Description |
|------|------|-------------|
| `not_configured` | 503 | A required server-side configuration (e.g. TOTP encryption key) is missing |

---

## Rate limit error body

When rate limited, the response body includes a machine-readable retry delay:

```json
{
  "error": "Rate limit exceeded",
  "code": "rate_limited",
  "retryAfterSeconds": 42
}
```

The `Retry-After` HTTP header is also set to the same value (in seconds, minimum 1).
