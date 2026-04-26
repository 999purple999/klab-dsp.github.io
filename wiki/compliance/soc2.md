---
title: "SOC 2 Overview"
slug: "soc2"
category: "Compliance"
tags: ["soc2", "security", "audit", "enterprise", "trust-service-criteria"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "blueprint/project_blueprint.md"
  - "private-sync-worker/migrations/0024_company_backups.sql"
related:
  - "compliance-overview"
  - "hipaa"
  - "audit-retention"
  - "data-residency"
---

# SOC 2 Overview

All statements in this article describe technical controls that are present in the system; they do not constitute a representation that K-Perception is SOC 2 certified. Contact your K-Perception account manager or visit kperception.com for current SOC 2 certification status, audit scope, and report availability before using this information in security questionnaires or vendor assessments.

## What is SOC 2?

SOC 2 (Service Organisation Control 2) is an auditing standard developed by the American Institute of Certified Public Accountants (AICPA). A SOC 2 Type II report provides independent third-party attestation that a service organisation's controls meet the applicable Trust Service Criteria (TSC) over a defined audit period (typically six to twelve months).

The five Trust Service Categories are: Security (CC criteria), Availability, Processing Integrity, Confidentiality, and Privacy. The Security category is mandatory for all SOC 2 reports.

## How K-Perception's architecture addresses the Security TSC

The following technical controls in K-Perception are relevant to the SOC 2 Common Criteria:

### CC6 — Logical and physical access controls

| Control area | K-Perception implementation |
|-------------|----------------------------|
| User authentication | Argon2id KDF (m=19456 KiB, t=2, p=1) for password-based auth; Google OAuth2 PKCE; TOTP step-up 2FA; SAML 2.0 SSO (Enterprise) |
| Multi-factor authentication | TOTP enforcement configurable per company (Enterprise) |
| Least-privilege access | Six workspace roles (owner / admin / editor / commenter / viewer / guest); per-file ACL; section-level HKDF-derived keys |
| Network access restriction | IP allowlist enforcement at Worker edge (Enterprise) |
| Session management | Multi-device session list; remote session revocation; elevation tokens required for destructive operations |
| Deprovisioning | SCIM 2.0 automated deprovisioning from IdP; GDPR purge endpoint (Enterprise) |

### CC7 — System operations (monitoring and incident detection)

| Control area | K-Perception implementation |
|-------------|----------------------------|
| Audit logging | Workspace audit log (all member, file, policy events); company-level hash-chained audit log |
| Tamper evidence | Company audit log uses SHA-256 hash chain (each event hashes its sequence number, previous hash, and encrypted body) |
| Incident notification | Outbound webhooks for workspace events (Team+) |
| Audit retention | Configurable per workspace (default 30 days); see [Audit Log Retention](audit-retention.md) |

### CC8 — Change management

Change management process, code review policies, and deployment controls are internal operational practices. Contact your account manager or compliance@kperception.com for details.

### CC9 — Risk mitigation

| Control area | K-Perception implementation |
|-------------|----------------------------|
| Encryption at rest | AES-256-GCM for all user content; blobs stored in Cloudflare R2 as ciphertext only |
| Encryption in transit | TLS for all HTTP traffic; AES-256-GCM for Y.js WebSocket payloads |
| Backup and recovery | Ciphertext-only workspace backups to Cloudflare R2; configurable backup cron; retention_count configurable |
| Vendor management | Cloudflare (infrastructure); Stripe (billing) — see [Sub-processors](../legal/sub-processors.md) |

### Availability TSC

| Control area | K-Perception implementation |
|-------------|----------------------------|
| Edge infrastructure | Cloudflare Workers (300+ PoPs, zero cold starts, automatic scaling) |
| Database availability | Cloudflare D1 with global read replicas |
| Storage availability | Cloudflare R2 (S3-compatible, zero egress fees, exabyte scale) |
| Offline-first architecture | Notes created and read without network connectivity; queue-based sync flushed on reconnect |
| SLA | 99.9% uptime SLA listed for Enterprise plan — see [SLA](../legal/sla.md) for details |

### Confidentiality TSC

| Control area | K-Perception implementation |
|-------------|----------------------------|
| Zero-knowledge architecture | Server holds only AES-256-GCM ciphertext; cannot read user content regardless of legal compulsion |
| Key management | Device-only key derivation; keys never transmitted to server; per-section HKDF-derived keys; per-file DEK |
| Ciphertext-only backups | Backup archives are ciphertext; inaccessible without WDK held on client devices |
| E2EE real-time collaboration | Y.js binary updates AES-256-GCM encrypted before reaching DocRoom Durable Object relay |

## Certification status

Contact your K-Perception account manager or visit kperception.com for current details on SOC 2 certification status, including report type (Type I or Type II), audit period covered, how to request a copy of the report (typically under mutual NDA), and which Trust Service Categories are in scope.

## Requesting a SOC 2 report

To request a copy of the SOC 2 report, contact compliance@kperception.com or your K-Perception account manager.

## Plan availability

SOC 2-relevant Enterprise controls (MFA enforcement, IP allowlist, SAML/SCIM, hash-chained audit log, GDPR tools) require the **Enterprise** plan. The zero-knowledge encryption that underpins the Confidentiality TSC is available on all plans.

## Related articles

- [Compliance Overview](overview.md)
- [HIPAA Compliance Guide](hipaa.md)
- [Audit Log Retention](audit-retention.md)
- [Data Residency](data-residency.md)
- [SLA](../legal/sla.md)
- [Sub-processors](../legal/sub-processors.md)

## Source references

- `blueprint/project_blueprint.md` §4.7 — "SOC 2 Type II pathway" mention
- `private-sync-worker/migrations/0024_company_backups.sql` — hash-chained audit event schema
- `blueprint/project_blueprint.md` §7 — Enterprise plan SLA 99.9% mention
