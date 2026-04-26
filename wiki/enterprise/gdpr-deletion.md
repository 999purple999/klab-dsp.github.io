---
title: "GDPR Data Deletion"
slug: "gdpr-deletion"
category: "Enterprise"
tags: ["gdpr", "compliance", "privacy", "enterprise", "data-deletion"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
related: ["enterprise/audit-log", "enterprise/compliance-tab", "enterprise/overview"]
---

# GDPR Data Deletion

## What it is

K-Perception provides two GDPR compliance operations at the company level:

1. **Data export** — generates a JSON report of all company member PII (names, emails, roles, dates). Required for GDPR right-of-access requests.
2. **Member purge** — zeroes PII for a specific user, revokes all their sessions, removes them from the company, and queues a background job for full account deletion. Required for GDPR right-to-erasure requests.

Both operations are available under `GET/POST /companies/{companyId}/compliance/`.

## When to use it

Use these operations when:
- A user submits a GDPR **right of access** request — use the data export endpoint.
- A user submits a GDPR **right to erasure** (right to be forgotten) request — use the member purge endpoint.
- Your data protection officer needs a record of who held company membership — use the data export.

## Data export

### Endpoint

```
GET /companies/{companyId}/compliance/gdpr-export
```

### Required role

`auditor` or above (`super-admin`, `billing-admin`, `auditor`).

### What it returns

A JSON file with `Content-Disposition: attachment; filename="gdpr-export-{companyId[:8]}.json"` containing:

```json
{
  "generated_at": "2026-04-26T12:00:00.000Z",
  "company_id": "...",
  "member_count": 42,
  "members": [
    {
      "userId": "...",
      "email": "alice@example.com",
      "displayName": "Alice Example",
      "role": "editor",
      "status": "active",
      "joinedAt": "2026-01-01T00:00:00.000Z",
      "removedAt": null
    }
  ]
}
```

The report includes all members (including removed ones) ordered by `joined_at` ascending.

Note: this endpoint uses `COMPANY_POLICY_CHANGED` as the audit event type when the export is generated. This is confirmed in source — `routeGdprExport` calls `appendCompanyAudit` with `type: 'COMPANY_POLICY_CHANGED'` and summary `'GDPR member data export generated'`. The event type is a known code quirk; the intent is to log the export action.

## Member purge (right to erasure)

### Endpoint

```
POST /companies/{companyId}/compliance/purge-member
```

### Required role

`super-admin` only.

### Request body

```json
{ "targetUserId": "..." }
```

### What it does

Purge executes the following steps atomically and in order:

1. **Revoke all active sessions** — `UPDATE sessions SET revoked_at = now() WHERE user_id = ? AND revoked_at IS NULL`. The user is immediately logged out of all devices.
2. **Remove from company** — sets `status = 'removed'` and `removed_at = now()` in `company_members`.
3. **Zero PII immediately** — updates `provider_accounts`:
   - `email` → `purged-{userId[:8]}@deleted`
   - `display_name` → `'Deleted User'`
   - `avatar_url` → `NULL`
4. **Queue background purge task** — sends `{ type: 'purge_user', userId }` to `TASK_QUEUE` for asynchronous R2 blob cleanup and refresh-token wipe.
5. **Write audit event** — appends `COMPANY_MEMBER_REMOVED` to the company audit chain with summary `GDPR purge requested for user {userId[:8]}`.

The PII zeroing in step 3 is applied **immediately** as defence-in-depth — even if the background queue is delayed or fails, the user's email and display name are no longer recoverable from the database.

### Response

```json
{ "ok": true, "data": { "purged": true, "targetUserId": "..." } }
```

If the `TASK_QUEUE` binding is not configured, the endpoint returns `503 queue_unavailable` and the purge does not proceed.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| Target user is not a company member | Returns `404 not_found` |
| Target user is the last super-admin | The member can still be purged — there is no last-super-admin guard on the purge route. Confirmed in source: `routePurgeMember` does not call `wouldRemoveLastSuperAdmin`, unlike the standard `routeRemoveMember`. |
| TASK_QUEUE not configured | Returns `503 queue_unavailable`; no PII is zeroed |
| User already purged (re-running) | PII update is idempotent; duplicate audit event is written |
| Purge of a super-admin | Allowed — requires caller to also be super-admin |
| Sessions already revoked | Revoke call is a no-op (WHERE clause excludes already-revoked sessions) |

## Platform differences

These are server-side API operations. No platform-specific behaviour.

## Plan availability

GDPR compliance endpoints require the **Enterprise** plan.

## Permissions and roles

| Operation | Required role |
|---|---|
| Data export (`GET .../gdpr-export`) | `auditor` or above |
| Member purge (`POST .../purge-member`) | `super-admin` only |

Company roles: `super-admin | billing-admin | auditor | observer`.

## Security implications

- The data export response is sent as a downloadable JSON file. Store it securely — it contains PII for all company members.
- The purge operation is irreversible. The email and display name are overwritten; there is no undo.
- The audit chain records that a purge was requested, but the body is encrypted and contains only the first 8 characters of the user ID (not the full ID or the original email).
- Background queue tasks perform the full account deletion including R2 storage cleanup. If queue delivery fails, PII in `provider_accounts` is already zeroed but R2 blobs may persist until the task is retried.

## Settings reference

| Field | Value |
|---|---|
| Data export endpoint | `GET /companies/{companyId}/compliance/gdpr-export` |
| Member purge endpoint | `POST /companies/{companyId}/compliance/purge-member` |
| Purged email format | `purged-{userId[:8]}@deleted` |
| Purged display name | `'Deleted User'` |
| Audit event on purge | `COMPANY_MEMBER_REMOVED` |

## Related articles

- [Audit log](audit-log.md)
- [Compliance tab](compliance-tab.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/company.ts` — `routeGdprExport` (line 926) and `routePurgeMember` (line 968)
