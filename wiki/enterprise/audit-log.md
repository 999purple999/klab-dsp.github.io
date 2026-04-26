---
title: "Company Audit Log"
slug: "audit-log"
category: "Enterprise"
tags: ["audit", "compliance", "enterprise", "security"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
related: ["enterprise/compliance-tab", "enterprise/gdpr-deletion", "enterprise/overview"]
---

# Company Audit Log

## What it is

The company audit log is a tamper-evident, hash-chained record of all significant events in a K-Perception company: member additions and removals, policy changes, workspace link/unlink operations, SSO events, and administrative actions. The hash chain means that any deletion or modification of a historical event is detectable.

The log is accessible via:

```
GET /companies/{companyId}/audit?from=<ISO8601>&to=<ISO8601>
```

## Hash chain construction

Each audit event is assigned a monotonically increasing `event_seq`. The hash chain is constructed as follows:

```
prevHash   = SHA-256( prev.body_enc || '|' || prev.event_seq )
selfHash   = SHA-256( event_seq || '|' || prevHash || '|' || body_enc )
```

Where `body_enc` is the base64-encoded event body. The first event in the chain has `hash_chain_prev = NULL`.

Verifying integrity: compute `selfHash` for each event using the formula above, check that it matches the stored `hash_chain_self`, and verify that `hash_chain_prev` equals the `selfHash` of the immediately preceding event (by `event_seq`).

Note: server-internal events use `body_enc = btoa('srv:' + summary)`. Client-submitted audit events use a different encrypted body.

## Querying the audit log

### Endpoint

```
GET /companies/{companyId}/audit
```

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `from` | ISO 8601 datetime string | Return events at or after this timestamp |
| `to` | ISO 8601 datetime string | Return events at or before this timestamp |

### Limits

- Maximum **500 events** per query (enforced server-side with `LIMIT 500`).
- Events are returned in **descending** order by `event_seq` (most recent first).
- For ranges larger than 500 events, paginate using the `created_at` of the oldest returned event as the next `to` value.

### Response shape

```json
{
  "ok": true,
  "data": {
    "events": [
      {
        "eventId": "...",
        "companyId": "...",
        "eventSeq": 42,
        "type": "COMPANY_MEMBER_ADDED",
        "actorId": "...",
        "bodyEnc": "c3J2Ok1lbWJlciBhZGRlZA==",
        "hashChainPrev": "...",
        "hashChainSelf": "...",
        "createdAt": "2026-04-26T12:00:00.000Z"
      }
    ]
  }
}
```

Note: **reading the audit log itself generates an audit event** (`COMPANY_AUDIT_VIEWED`) recording the actor, the query range, and the number of events returned. This creates a meta-audit trail of who reviewed the log.

## Event types

| Event type | Trigger |
|---|---|
| `COMPANY_CREATED` | Company created |
| `COMPANY_POLICY_CHANGED` | Company policy updated via `PUT /companies/:id/policy`; also used for GDPR export generation |
| `COMPANY_MEMBER_ADDED` | Member added to company |
| `COMPANY_MEMBER_ROLE_CHANGED` | Member role updated |
| `COMPANY_MEMBER_REMOVED` | Member removed or GDPR-purged |
| `COMPANY_WORKSPACE_LINKED` | Workspace linked to company |
| `COMPANY_WORKSPACE_UNLINKED` | Workspace unlinked from company |
| `COMPANY_AUDIT_VIEWED` | Audit log queried |
| `MEMBER_PASSWORD_RESET_ISSUED` | Super-admin issued a password reset token for a member |

## Step by step

### Viewing the audit log in the UI

1. Open K-Perception → **Company admin** → **Compliance** tab.
2. Select a date range.
3. Click **Load audit events**.
4. Events are displayed in reverse chronological order.
5. To download the full log as JSON, click **Export audit log**.

### Querying the audit log via API

```bash
curl -H "Authorization: Bearer <session-token>" \
  "https://api.kperception.app/companies/{companyId}/audit?from=2026-01-01T00:00:00Z&to=2026-04-26T23:59:59Z"
```

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| Query returns more than 500 events | Truncated to 500; paginate using `to` parameter |
| No `from`/`to` provided | Returns the 500 most recent events |
| Caller has `auditor` role | Full read access to event metadata |
| Caller has only `observer` role | Returns `403 forbidden` |
| Audit event body is encrypted | `bodyEnc` is base64; decrypt with the company AWK (super-admin only) |

## Platform differences

The audit log is a server-side API. The Compliance tab in the Company Admin Panel provides a UI for all platforms.

## Plan availability

The company audit log requires the **Enterprise** plan.

## Permissions and roles

- Requires `auditor` role or above (`super-admin`, `billing-admin`, `auditor`).
- `observer` role cannot access the audit log.
- Decrypting event bodies requires `super-admin` access (AWK holder).

## Security implications

- The hash chain provides tamper-evidence: any deletion or modification of an event will cause hash verification to fail for all subsequent events.
- Event bodies are base64-encoded server summaries. They are not end-to-end encrypted at the server level for server-internal events, but the AWK (Audit Workspace Key) can be used for client-side encryption of sensitive bodies.
- Every time an auditor reads the log, a `COMPANY_AUDIT_VIEWED` event is written, creating a permanent record of who accessed the audit trail.
- Audit events are append-only — there is no API endpoint to delete them.

## Settings reference

| Parameter | Value |
|---|---|
| Endpoint | `GET /companies/{companyId}/audit` |
| `from` parameter | ISO 8601 datetime (inclusive) |
| `to` parameter | ISO 8601 datetime (inclusive) |
| Max events per query | 500 |
| Sort order | Descending by `event_seq` |
| Required role | `auditor` or above |

## Related articles

- [Compliance tab](compliance-tab.md)
- [GDPR data deletion](gdpr-deletion.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/company.ts` — `routeGetAudit` (line 755), `appendCompanyAudit` (line 227)
