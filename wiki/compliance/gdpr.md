---
title: "GDPR Compliance Guide"
slug: "gdpr"
category: "Compliance"
tags: ["gdpr", "privacy", "data-erasure", "right-to-access", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
  - "private-sync-worker/migrations/0011_workspace_full.sql"
  - "private-sync-worker/migrations/0024_company_backups.sql"
related:
  - "compliance-overview"
  - "audit-retention"
  - "data-residency"
  - "data-processing-agreement"
---

# GDPR Compliance Guide

This article describes how K-Perception supports GDPR obligations for organisations that process EU personal data. It covers the technical capabilities available to company administrators; it does not constitute legal advice. See your organisation's legal counsel and the [Data Processing Agreement](../legal/data-processing-agreement.md) for contractual obligations.

## What GDPR compliance means in a zero-knowledge system

Under GDPR, "processing" means any operation on personal data. K-Perception's zero-knowledge architecture limits what the server processes:

- **Content data** (note text, file contents, channel messages) is AES-256-GCM encrypted on the user's device. The server stores ciphertext only. It cannot read, index, or process this data in plaintext.
- **Account metadata** (email address, display name, role, membership timestamps) is stored in plaintext in Cloudflare D1 and is subject to normal GDPR obligations.

This means data access requests under GDPR Article 15 will yield account metadata but not decrypted note content. K-Perception cannot provide plaintext content on behalf of a user because the server does not hold decryption keys.

## Right of access — GDPR export

**Endpoint:** `GET /companies/:id/compliance/gdpr-export`

**Required role:** `auditor` or above (`auditor`, `billing-admin`, `super-admin`)

The GDPR export returns a JSON file containing all company member metadata:

```json
{
  "generated_at": "<ISO timestamp>",
  "company_id": "<id>",
  "member_count": 42,
  "members": [
    {
      "userId":      "<uuid>",
      "email":       "<email or purged placeholder>",
      "displayName": "<name or 'Deleted User'>",
      "role":        "editor",
      "status":      "active",
      "joinedAt":    "<ISO timestamp>",
      "removedAt":   null
    }
  ]
}
```

The response is delivered as a downloadable attachment (`gdpr-export-{companyId[:8]}.json`) and is not stored on K-Perception servers. Generating the export is itself recorded in the company audit log as `COMPANY_POLICY_CHANGED` with the summary `"GDPR member data export generated"`.

The export does not include decrypted note or file content — the server holds only ciphertext for those resources.

### How to generate a GDPR export

1. Navigate to **Company Admin** > **Compliance** tab.
2. Click **Export member data (GDPR Article 15)**.
3. The JSON file downloads immediately in your browser.

## Right to erasure — member purge

**Endpoint:** `POST /companies/:id/compliance/purge-member`

**Required role:** `super-admin` only

**Request body:**
```json
{ "targetUserId": "<uuid>" }
```

The purge operation executes in two phases:

### Phase 1 — Immediate PII zeroing (synchronous)

The following happens in the same database transaction before the HTTP response is returned:

1. **All active sessions revoked** — `sessions.revoked_at` is set for all of the target user's non-revoked sessions. The user cannot log in after this point.
2. **Company membership removed** — `company_members.status = 'removed'`, `removed_at` is set.
3. **PII zeroed in `provider_accounts`:**
   - `email` → `purged-{userId[:8]}@deleted`
   - `display_name` → `'Deleted User'`
   - `avatar_url` → `NULL`

Even if the async queue task (Phase 2) is delayed or fails, the PII fields are no longer recoverable from the database row. This is a defence-in-depth measure described explicitly in the source code comments.

### Phase 2 — Async R2 blob purge (queued)

A `purge_user` task is enqueued to `TASK_QUEUE`. This task handles:

- Deletion of R2 blobs associated with the user (encrypted note blobs, file blobs, attachment blobs, voice message blobs).
- Refresh token cleanup.

If the queue is not configured, the endpoint returns HTTP 503 (`queue_unavailable`). Phase 1 (PII zeroing) has already occurred at this point.

The purge is recorded in the company audit log as `COMPANY_MEMBER_REMOVED` with summary `"GDPR purge requested for user {userId[:8]}"`.

### Edge cases

- **Purging a workspace owner:** Transfer workspace ownership before purging. The purge operation does not automatically transfer workspace ownership.
- **Encrypted content:** R2 blobs are deleted. However, because the blobs are AES-256-GCM ciphertext and the decryption keys are held only on user devices (never server-side), the ciphertext is cryptographically inaccessible even before deletion.
- **Queue unavailability:** If Phase 1 completes but Phase 2 fails due to queue unavailability, retry by calling the endpoint again or by processing the queue manually. PII is already zeroed.

## Data retention

### Audit log retention

Each workspace has a configurable `audit_retention_days` field (default: `30`, from migration 0011). The Worker cron automatically purges audit rows older than this window. To change it:

1. Open the workspace **Settings** > **Security** or **Policies** tab (workspace admin or owner required).
2. Set the desired retention period.

See [Audit Log Retention](audit-retention.md) for detail. The `audit_retention_days` column is an uncapped INTEGER; the practical maximum depends on D1 storage. Contact your account manager if you require multi-year retention.

### Backup retention

Company backups have a `retention_count` field (default: 30, from migration 0024). This controls how many backup snapshots are retained. Old backups beyond this count are deleted from R2 automatically.

### Note and file data

Notes and files persist until explicitly deleted by the user or purged via the GDPR purge endpoint. There is no automatic server-side expiry for user content.

## Data residency

K-Perception stores data on Cloudflare's global infrastructure (D1 SQLite at edge, R2 object storage). Cloudflare operates data centres in the EU. K-Perception uses Cloudflare's global infrastructure (Workers, D1, R2). Contact your account manager for EU data residency requirements.

See [Data Residency](data-residency.md).

## Zero-knowledge and GDPR data access requests

When a data subject submits a Subject Access Request (SAR) under GDPR Article 15, you can provide:

- The GDPR export JSON (account metadata, role, membership history).
- A statement that note and file content is stored exclusively as ciphertext on K-Perception servers and is not readable by K-Perception or the company administrator.

The data subject's own device holds the decryption keys. If the data subject requires a copy of their own content, they must export it themselves from their device while the vault is unlocked.

## Data Processing Agreement (DPA)

A DPA is described as available for enterprise customers in the product blueprint. Contact your account manager or legal@kperception.com for the current DPA. See [Data Processing Agreement](../legal/data-processing-agreement.md).

## Plan availability

GDPR tools (export and purge) require the **Enterprise** plan. Zero-knowledge encryption (the primary GDPR technical safeguard) is available on all plans.

## Permissions and roles

| Operation | Required role |
|-----------|--------------|
| Generate GDPR export | `auditor`, `billing-admin`, or `super-admin` |
| Purge a member's PII | `super-admin` only |
| View audit log | `auditor` or above |
| Configure audit retention | Workspace owner or admin |

## Security implications

- The GDPR purge is irreversible. The zeroed PII cannot be recovered by K-Perception.
- All GDPR operations are recorded in the immutable hash-chained company audit log.
- The purge endpoint requires `super-admin` role, which should be granted to as few accounts as possible.
- Because company-level audit events are hash-chained (SHA-256 of sequence number + previous hash + encrypted body), retroactive deletion of audit records is detectable.

## Related articles

- [Compliance Overview](overview.md)
- [Audit Log Retention](audit-retention.md)
- [Data Residency](data-residency.md)
- [Data Processing Agreement](../legal/data-processing-agreement.md)
- [Security: Zero-Knowledge Architecture](../security/zero-knowledge.md)

## Source references

- `private-sync-worker/src/company.ts` lines 926–1004 — `routeGdprExport` and `routePurgeMember` implementations
- `private-sync-worker/migrations/0011_workspace_full.sql` line 37 — `audit_retention_days INTEGER NOT NULL DEFAULT 30`
- `private-sync-worker/migrations/0024_company_backups.sql` lines 97–118 — hash-chained company audit event schema
- `blueprint/project_blueprint.md` §4.7 — compliance posture
