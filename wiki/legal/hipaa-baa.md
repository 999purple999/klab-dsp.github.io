---
title: "HIPAA Business Associate Agreement"
slug: "hipaa-baa"
category: "Legal"
tags: ["hipaa", "baa", "healthcare", "enterprise", "legal"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs: []
related:
  - "legal-overview"
  - "terms-of-service"
  - "data-processing-agreement"
  - "sub-processors"
---

# HIPAA Business Associate Agreement

This article describes K-Perception's position with respect to HIPAA Business Associate Agreements. **K-Perception has not confirmed that a signed BAA is currently available or that its infrastructure meets all HIPAA technical safeguard requirements.** Do not use K-Perception for workflows involving Protected Health Information (PHI) without first consulting your HIPAA compliance officer and legal counsel, and without obtaining a fully executed BAA.

To enquire about BAA availability: [PLACEHOLDER — update before publishing: insert legal contact email].

## What is a Business Associate Agreement?

Under the Health Insurance Portability and Accountability Act (HIPAA) and the HITECH Act, a Business Associate Agreement is a written contract required between a Covered Entity (CE) and a Business Associate (BA) whenever the BA creates, receives, maintains, or transmits PHI on behalf of the CE. The BAA governs how the BA must handle PHI and what obligations apply in the event of a security incident or breach.

**45 CFR §164.308(b)(1)** requires that a CE obtain a BAA from each business associate before PHI is shared with or stored by that associate. Storing PHI with a vendor without an executed BAA is a HIPAA violation.

## K-Perception's architecture and PHI

K-Perception's zero-knowledge architecture has the following technical properties relevant to HIPAA:

- **Note and file content** is AES-256-GCM encrypted on the user's device before upload. K-Perception cannot decrypt this content at rest or in transit. K-Perception never receives PHI in plaintext.
- **Workspace metadata** (workspace membership, access timestamps, audit events) is stored in plaintext and may relate to PHI workflows.

Whether K-Perception meets the HIPAA definition of a Business Associate for zero-knowledge ciphertext storage is a nuanced legal question. Consult qualified HIPAA counsel to determine your obligations for your specific deployment and use case.

## Current BAA status

[PLACEHOLDER — update before publishing: state clearly whether a BAA is currently available, whether it has been reviewed by a HIPAA attorney, whether sub-processor BAA coverage (particularly Cloudflare) is confirmed, and on which plans it is offered. Until this is confirmed, do not represent BAA availability to prospective customers.]

## What a BAA with K-Perception would cover

A BAA with K-Perception, once available, would typically address:

- How K-Perception (as Business Associate) uses and discloses PHI.
- K-Perception's obligation to implement appropriate administrative, physical, and technical safeguards (encryption, access controls, audit logging).
- K-Perception's obligation to report security incidents and breaches to the Covered Entity.
- K-Perception's obligation to ensure that its sub-processors are bound by appropriate terms (a Cloudflare BAA would be required for Cloudflare to be a permitted sub-processor under HIPAA).
- K-Perception's obligation to return or destroy PHI at the end of the agreement.
- The Covered Entity's right to terminate if K-Perception violates the BAA.

## Who qualifies as a Covered Entity

Under HIPAA, Covered Entities include:

- **Health plans** — health insurance companies, HMOs, employer-sponsored health plans.
- **Healthcare clearinghouses** — organisations that process health information from nonstandard to standard format.
- **Healthcare providers** — physicians, clinics, hospitals, pharmacies, and other providers that transmit health information electronically for covered transactions.

## Business associates of Covered Entities

If your organisation is itself a Business Associate of a Covered Entity (for example, a healthcare IT consultant or medical billing company), you may also need a BAA with K-Perception before using K-Perception in connection with PHI.

## Sub-processor considerations

For a BAA to be complete, K-Perception's sub-processors that handle PHI must also be covered by appropriate agreements:

- **Cloudflare** — Cloudflare offers HIPAA BAA coverage as part of its enterprise offerings. [PLACEHOLDER — update before publishing: confirm whether K-Perception's Cloudflare contract includes a signed HIPAA BAA.]
- **Stripe** — processes billing metadata only, not PHI. A Stripe BAA is unlikely to be required, but verify with your HIPAA counsel.
- **Resend** — processes email addresses for transactional emails. [PLACEHOLDER — update before publishing: confirm whether Resend is in scope for PHI and whether a BAA is required.]

## Relationship to the DPA

The BAA and DPA serve different purposes:

- The **DPA** addresses GDPR obligations as a data processor under EU law.
- The **BAA** addresses HIPAA obligations as a business associate under US federal law.

Organisations with both GDPR and HIPAA obligations may require both documents.

## Related articles

- [Legal Overview](overview.md)
- [Data Processing Agreement](data-processing-agreement.md)
- [Sub-processors](sub-processors.md)
