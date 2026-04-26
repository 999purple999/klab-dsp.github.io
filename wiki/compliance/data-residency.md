---
title: "Data Residency"
slug: "data-residency"
category: "Compliance"
tags: ["data-residency", "gdpr", "cloudflare", "r2", "d1", "privacy"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "blueprint/project_blueprint.md"
  - "private-sync-worker/src/company.ts"
related:
  - "compliance-overview"
  - "gdpr"
  - "soc2"
---

# Data Residency

This article describes where K-Perception stores data, what types of data are stored at each layer, and what data residency options are available. It also explains how the zero-knowledge architecture affects data residency considerations under privacy regulations.

## Where K-Perception stores data

K-Perception's backend runs entirely on Cloudflare's infrastructure:

| Data layer | Service | What is stored |
|------------|---------|---------------|
| Relational metadata | Cloudflare D1 (SQLite at edge) | User accounts, sessions, workspace membership, channel metadata, file metadata (size, MIME type, key wraps), audit events, SSO config, billing data |
| Object storage | Cloudflare R2 | Encrypted note blobs, encrypted file blobs, backup archives, voice message blobs, attachment blobs |
| Real-time relay | Cloudflare Durable Objects | Transient Y.js binary update buffers (one DO per document; buffers are encrypted blobs) |

**Nothing in R2 is plaintext.** All blobs stored in R2 are AES-256-GCM ciphertext produced by the client before upload. Cloudflare and K-Perception cannot read this content.

**D1 metadata** (email addresses, display names, membership records) is plaintext and is subject to data residency considerations under GDPR and other privacy regulations.

## Cloudflare infrastructure locations

Cloudflare operates 300+ Points of Presence (PoPs) worldwide, including data centres across the EU (Frankfurt, Amsterdam, Paris, London, Warsaw, and others). Cloudflare D1 and R2 use Cloudflare's global infrastructure.

K-Perception uses Cloudflare's global infrastructure (Workers, D1, R2). Contact your account manager for EU data residency requirements. Cloudflare's specific data locality guarantees for D1 and R2 depend on Cloudflare's current product offerings — verify current options at developers.cloudflare.com before making contractual commitments to data subjects or regulators.

### Cloudflare R2 jurisdiction control

Cloudflare R2 supports optional jurisdiction control that can pin bucket data to EU, FedRAMP, or other regions. Contact your account manager for EU data residency requirements regarding K-Perception's R2 bucket configuration.

### Cloudflare D1 data location

Cloudflare D1 databases have a configurable location hint (e.g., `weur` for Western Europe). Contact your account manager for EU data residency requirements regarding K-Perception's production D1 location configuration.

## Zero-knowledge architecture and data residency

A critical consideration for GDPR data residency is whether data stored on a server constitutes "personal data" under Article 4(1) GDPR. Personal data means information relating to an identified or identifiable natural person.

K-Perception's R2 blobs are AES-256-GCM ciphertext. The decryption keys are derived from the user's password on their device and are never transmitted to the server. Without those keys, the ciphertext cannot be linked to any natural person and cannot be read.

Many legal interpretations hold that properly encrypted ciphertext — where the controller does not possess the decryption key — falls outside the GDPR definition of personal data, or alternatively that processing of such ciphertext does not constitute processing of personal data in a meaningful sense.

**This interpretation is not settled law.** Your organisation should obtain qualified legal advice on whether the zero-knowledge model affects GDPR data residency obligations for your specific use case.

The D1 metadata (account email, display name, membership records) is clearly personal data and is subject to standard GDPR data residency analysis.

## Data types by residency concern

| Data type | Location | Plaintext? | Personal data? |
|-----------|----------|-----------|----------------|
| Note content | R2 (global) | No — AES-256-GCM ciphertext | Disputed (ciphertext) |
| File blobs | R2 (global) | No — AES-256-GCM ciphertext | Disputed (ciphertext) |
| Voice messages | R2 (global) | No — AES-256-GCM ciphertext | Disputed (ciphertext) |
| Backup archives | R2 (global) | No — AES-256-GCM ciphertext | Disputed (ciphertext) |
| Account metadata | D1 (edge) | Yes | Yes |
| Audit log events | D1 (edge) | Body encrypted (AES-GCM, company audit key); metadata (actor_id, type, timestamp) plaintext | Yes (actor_id) |
| Session tokens | D1 (edge) | Hashed/signed | Yes |

## EU customers and GDPR

K-Perception includes GDPR tools (export and purge) for enterprise companies. Cloudflare is a sub-processor with its own data processing addendum. Verify Cloudflare's current DPA terms for D1/R2 compatibility with your GDPR obligations before making contractual commitments.

For the K-Perception DPA, see [Data Processing Agreement](../legal/data-processing-agreement.md).

## Platform differences

Data residency is determined by the backend configuration. The platform (Windows desktop, Android, web) does not affect where server-side data is stored. Local data (offline vault in IndexedDB on web, Capacitor Preferences on Android) is stored on the user's device and is subject to device-level data residency.

## Plan availability

Data residency configuration options (if any specific EU data localisation service is offered) would be an Enterprise feature. Contact your K-Perception account manager or visit kperception.com for current details on contractual data residency guarantees.

## Related articles

- [Compliance Overview](overview.md)
- [GDPR Compliance Guide](gdpr.md)
- [Data Processing Agreement](../legal/data-processing-agreement.md)
- [Sub-processors](../legal/sub-processors.md)
- [Security: Zero-Knowledge Architecture](../security/zero-knowledge.md)

## Source references

- `blueprint/project_blueprint.md` §5.1 — infrastructure stack (Cloudflare Workers, D1, R2, Durable Objects)
- `blueprint/project_blueprint.md` §5.2 — backend architecture diagram
- `blueprint/project_blueprint.md` §5.3 — scalability characteristics
