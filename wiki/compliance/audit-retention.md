---
title: "Audit Log Retention"
slug: "audit-retention"
category: "Compliance"
tags: ["audit", "retention", "compliance", "security", "enterprise"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0011_workspace_full.sql"
  - "private-sync-worker/migrations/0024_company_backups.sql"
  - "private-sync-worker/src/index.ts"
  - "private-sync-worker/src/workspaceDb.ts"
related:
  - "compliance-overview"
  - "gdpr"
  - "hipaa"
  - "soc2"
---

# Audit Log Retention

K-Perception maintains two audit logs per organisation: a workspace-level audit log and a company-level audit log. This article explains how retention is configured, how automatic purging works, and how the company audit log provides tamper evidence.

## Workspace audit log

### Default retention

Every workspace has an `audit_retention_days` field set to **30 days** by default. This value is set in the database migration:

```sql
-- migration 0011
ALTER TABLE workspaces ADD COLUMN audit_retention_days INTEGER NOT NULL DEFAULT 30;
```

### Automatic purging

The Cloudflare Worker cron job automatically deletes workspace audit events older than the configured window:

```sql
WHERE w.audit_retention_days > 0
  AND julianday('now') - julianday(e.created_at) > w.audit_retention_days
```

If `audit_retention_days` is set to `0`, automatic purging is disabled and events are retained indefinitely. This behavior may vary by deployment; verify with your account manager whether this setting is exposed in the UI or only configurable via the API/CLI.

### Maximum retention

The `audit_retention_days` column is an uncapped INTEGER in the schema. The practical maximum depends on D1 storage limits. Contact your account manager if you require multi-year retention.

### How to change workspace audit retention

1. Navigate to the workspace **Settings** (gear icon or admin panel).
2. Open the **Security** or **Policies** tab.
3. Set **Audit log retention** to the desired number of days.
4. Save. The new value takes effect immediately for future purge runs.

Requires workspace **owner** or **admin** role.

## Company audit log

### Structure and tamper evidence

The company audit log is separate from the workspace audit log and uses a cryptographic hash chain for tamper evidence. Each row in `company_audit_events` includes:

- `event_seq` — monotonically increasing integer per company.
- `hash_chain_prev` — SHA-256 hash of the previous event row (null for the first event).
- `hash_chain_self` — SHA-256 hash of the canonical form of `(event_seq || hash_chain_prev || body_enc)`.

This means that deleting or modifying any historical event breaks the chain from that point forward. Auditors can verify the integrity of the full chain by recomputing hashes.

### Encrypted event body

The event body (`body_enc`) is AES-GCM encrypted under the Company Audit Key (CAK), which is derived and wrapped per super-admin device. Only company super-admins with their device's wrapped CAK can decrypt event bodies. The server (and K-Perception) cannot decrypt audit event contents.

### Retention for company audit log

The company audit log (`company_audit_events`) does not have a `retention_days` configuration column in the current schema. Whether the Worker cron applies retention purging to company audit events, or retains them indefinitely, may vary by deployment. Contact your account manager for HIPAA-relevant 6-year retention requirements.

## What is recorded in the audit logs

### Workspace audit events (examples)

- Member joined or removed from workspace
- Member role changed
- File uploaded, downloaded, or deleted
- Directory created or deleted
- Section key rotated
- Workspace key (WDK) rotated
- Backup created or restored
- Policy settings changed (audit retention, 2FA requirement)
- API key created or revoked
- Webhook created or deleted

### Company audit events (examples)

- Company policy changed
- GDPR member data export generated
- GDPR purge requested
- SSO configuration updated
- Company backup created or restored
- Company member added or removed
- IP allowlist modified
- MFA enforcement policy changed

## Backup retention (separate from audit retention)

Company backups have a separate `retention_count` configuration (default: 30, from migration 0024). This controls how many backup archives are retained in R2 — it is not a time-based retention setting but a count-based one. Old archives beyond the `retention_count` are deleted automatically.

## HIPAA and long-term retention

HIPAA requires that documentation of policies and procedures be retained for six years. If you are deploying K-Perception in a HIPAA context and intend the audit log to satisfy this requirement, you must:

1. Set `audit_retention_days` to a value that covers six years (approximately 2190 days) or set it to 0 to disable automatic purging.
2. The maximum supported value is not capped in the schema; D1 storage constraints may affect long-term retention at scale. Contact your account manager if you require multi-year retention.

Consult qualified HIPAA counsel on whether the audit log satisfies your specific documentation retention obligations.

## Platform differences

Audit log configuration is managed through the workspace admin panel or company admin panel. This is a server-side setting; the platform (Windows, Android, web) does not affect the retention configuration. Audit log viewing is available in the admin panel on all platforms.

## Plan availability

| Feature | Team | Enterprise |
|---------|------|------------|
| Workspace audit log | Yes | Yes |
| Configurable audit retention | Yes | Yes |
| Company audit log (hash-chained) | — | Yes |
| GDPR export of audit metadata | — | Yes |

## Permissions and roles

| Operation | Required role |
|-----------|--------------|
| View workspace audit log | Workspace owner or admin |
| Configure workspace audit retention | Workspace owner or admin |
| View company audit log | Company auditor or above |
| Verify company audit hash chain | Company super-admin (holds wrapped CAK) |

## Security implications

- The hash-chained company audit log provides tamper evidence. Any deletion or modification of historical events is detectable by recomputing the hash chain.
- Audit event bodies are encrypted under the CAK. K-Perception cannot decrypt audit event details.
- Setting `audit_retention_days` to a very low value (e.g., 1 day) will rapidly purge historical audit data. Consider your regulatory obligations before lowering retention.
- The audit log records metadata (who did what, when) but does not record content (note text, file data) — that content is ciphertext-only.

## Related articles

- [Compliance Overview](overview.md)
- [GDPR Compliance Guide](gdpr.md)
- [HIPAA Compliance Guide](hipaa.md)
- [SOC 2 Overview](soc2.md)

## Source references

- `private-sync-worker/migrations/0011_workspace_full.sql` line 37 — `audit_retention_days INTEGER NOT NULL DEFAULT 30`
- `private-sync-worker/migrations/0024_company_backups.sql` lines 97–118 — company audit event hash chain schema; `retention_count INTEGER NOT NULL DEFAULT 30` (backup retention)
- `private-sync-worker/src/index.ts` lines 592–593 — cron purge query using `audit_retention_days`
- `private-sync-worker/src/workspaceDb.ts` line 248 — `auditRetentionDays` patch handler
