---
title: "Compliance Overview"
slug: "compliance-overview"
category: "Compliance"
tags: ["compliance", "gdpr", "hipaa", "soc2", "audit", "enterprise"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
  - "private-sync-worker/migrations/0011_workspace_full.sql"
  - "private-sync-worker/migrations/0024_company_backups.sql"
  - "blueprint/project_blueprint.md"
related:
  - "gdpr"
  - "hipaa"
  - "soc2"
  - "data-residency"
  - "audit-retention"
---

# Compliance Overview

K-Perception is designed for regulated industries and organisations that must demonstrate data protection controls to auditors, regulators, or enterprise procurement teams. This article explains how K-Perception's architecture supports compliance and which features are available on each plan.

## Zero-knowledge architecture as the privacy foundation

Every compliance position K-Perception takes rests on one architectural fact: the server holds only ciphertext. All cryptographic operations (encryption, decryption, key derivation) execute inside the user's browser or Electron process using the Web Crypto API. The Cloudflare Worker backend stores exclusively AES-256-GCM ciphertext and never possesses plaintext keys or content.

This means:

- A database breach exposes only ciphertext. Without device-held keys, the data is not readable.
- A government subpoena for server data yields only encrypted blobs.
- K-Perception as a vendor cannot access user content regardless of legal compulsion.

This is a technical property of the system, not a contractual promise. See [Security: Zero-Knowledge Architecture](../security/zero-knowledge.md) for the cryptographic detail.

## GDPR compliance tools

K-Perception provides purpose-built GDPR tooling for companies on the Enterprise plan:

| Tool | Endpoint | Required role |
|------|----------|--------------|
| Member data export (right of access) | `GET /companies/:id/compliance/gdpr-export` | auditor or above |
| Member PII purge (right to erasure) | `POST /companies/:id/compliance/purge-member` | super-admin only |

The purge operation zeroes PII immediately in the database (`email → purged-{userId[:8]}@deleted`, `displayName → 'Deleted User'`) and enqueues an async task to remove R2 blobs. All GDPR operations are recorded in the company audit log. See [GDPR Compliance Guide](gdpr.md) for full detail.

## Audit log

Every workspace and company maintains a tamper-evident audit log:

- **Workspace audit log** — records member joins/leaves, policy changes, file operations, key rotations, and admin actions against workspace resources.
- **Company audit log** — records company-scoped events (policy changes, GDPR purges, SSO configuration, backup operations). The log is hash-chained: each row includes a SHA-256 hash of the previous event, making retroactive deletion or modification detectable.
- **Audit retention** — configurable per workspace (default: 30 days). Rows older than the configured retention window are purged automatically by the Worker cron. See [Audit Log Retention](audit-retention.md).

Audit log access requires the auditor role or above within a company.

## HIPAA

K-Perception's technical controls (AES-256-GCM encryption at rest and in transit, audit logging, session management, remote device wipe, MFA enforcement) are relevant to HIPAA's Technical Safeguard requirements. Because the server cannot access PHI, K-Perception's exposure as a Business Associate is architecturally limited.

A Business Associate Agreement (BAA) is listed as available on the Enterprise plan in the product blueprint. Contact your K-Perception account manager or visit kperception.com for current details.

See [HIPAA Compliance Guide](hipaa.md).

## SOC 2

K-Perception's architecture addresses many SOC 2 Trust Service Criteria (security, availability, confidentiality). The audit log, access controls, encryption at rest and in transit, and incident-response webhook hooks are relevant controls.

Contact your K-Perception account manager or visit kperception.com for current SOC 2 certification status, report availability, and audit scope before using this information in procurement responses.

See [SOC 2 Overview](soc2.md).

## ISO 27001

Contact your K-Perception account manager or visit kperception.com for current ISO 27001 certification status.

## Data residency

K-Perception's backend runs on Cloudflare's global infrastructure (Workers, D1, R2). Cloudflare operates data centres in the EU and worldwide. K-Perception uses Cloudflare's global infrastructure (Workers, D1, R2). Contact your account manager for EU data residency requirements. See [Data Residency](data-residency.md) for more detail.

## Plan availability

| Feature | Local | Guardian | Vault | Lifetime | Team | Enterprise |
|---------|-------|----------|-------|----------|------|------------|
| Zero-knowledge E2EE | Yes | Yes | Yes | Yes | Yes | Yes |
| Workspace audit log | — | — | — | — | Yes | Yes |
| Configurable audit retention | — | — | — | — | Yes | Yes |
| Company audit log (hash-chained) | — | — | — | — | — | Yes |
| GDPR export | — | — | — | — | — | Yes |
| GDPR purge | — | — | — | — | — | Yes |
| MFA enforcement | — | — | — | — | — | Yes |
| IP allowlist | — | — | — | — | — | Yes |
| SAML / SCIM / OIDC | — | — | — | — | — | Yes |
| BAA (contact account manager) | — | — | — | — | — | Yes |
| SLA 99.9% (contact account manager) | — | — | — | — | — | Yes |

## Permissions and roles

- Company compliance features require a **super-admin** (purge) or **auditor** (export) role at the company level.
- Workspace audit configuration requires the workspace **owner** or **admin** role.
- No content is readable by K-Perception staff regardless of role.

## Security implications

All compliance operations are themselves recorded in the audit log. The GDPR export response is delivered as a downloadable JSON file and is not stored server-side after generation. The export includes only metadata held in D1 (userId, email, displayName, role, status, join/remove timestamps) — note content is never included because the server holds only ciphertext.

## Related articles

- [GDPR Compliance Guide](gdpr.md)
- [HIPAA Compliance Guide](hipaa.md)
- [SOC 2 Overview](soc2.md)
- [Data Residency](data-residency.md)
- [Audit Log Retention](audit-retention.md)
- [Security: Zero-Knowledge Architecture](../security/zero-knowledge.md)

## Source references

- `private-sync-worker/src/company.ts` — GDPR export and purge implementations (lines 926–1004)
- `private-sync-worker/migrations/0011_workspace_full.sql` — `audit_retention_days DEFAULT 30`
- `private-sync-worker/migrations/0024_company_backups.sql` — company audit event hash chain schema
- `blueprint/project_blueprint.md` — compliance posture section (§4.7) and plan feature table (§7)
