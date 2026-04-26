---
title: "HIPAA Business Associate Agreement"
slug: "hipaa-baa"
category: "Legal"
tags: ["hipaa", "baa", "healthcare", "enterprise", "legal"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "blueprint/project_blueprint.md"
related:
  - "legal-overview"
  - "hipaa"
  - "terms-of-service"
  - "data-processing-agreement"
---

# HIPAA Business Associate Agreement

A Business Associate Agreement (BAA) is described as available on the Enterprise plan in the product blueprint. Contact your account manager or legal@kperception.com before relying on this article for a covered-entity deployment decision.

## What is a Business Associate Agreement?

Under the Health Insurance Portability and Accountability Act (HIPAA), a Business Associate Agreement is a written contract required between a Covered Entity (CE) and a Business Associate (BA) whenever the BA creates, receives, maintains, or transmits Protected Health Information (PHI) on behalf of the CE. The BAA governs how the BA must handle PHI and what obligations it has in the event of a security breach.

**45 CFR §164.308(b)(1)** requires that a CE have a BAA in place with each business associate before PHI is shared or stored with that associate.

## K-Perception's role under HIPAA

K-Perception acts as a **Business Associate** when a Covered Entity uses K-Perception to store or transmit PHI. K-Perception's zero-knowledge architecture limits its access to PHI:

- **Note and file content** is AES-256-GCM encrypted on the healthcare professional's device before upload. K-Perception cannot decrypt this content. In that sense, K-Perception never "receives" PHI in plaintext — it stores opaque ciphertext.
- **Workspace metadata** (who belongs to which workspace, access timestamps) is stored in plaintext and may indirectly relate to PHI workflows.

The legal question of whether K-Perception meets the HIPAA definition of a Business Associate for zero-knowledge content storage is nuanced. Consult qualified HIPAA counsel to determine whether a BAA is required for your specific deployment.

## Is a BAA available?

A Business Associate Agreement is described as available on the **Enterprise plan** in the K-Perception product blueprint. Contact your K-Perception account manager or visit kperception.com for current details on BAA availability, sub-processor coverage, and any special configuration requirements.

## How to request a BAA

To request a BAA:

1. Confirm you are on the Enterprise plan or are in the process of signing an Enterprise contract.
2. Contact your K-Perception account manager or email legal@kperception.com to request the BAA.
3. Review the BAA with your organisation's HIPAA compliance officer and legal counsel.
4. Execute the BAA. Both parties retain a signed copy.
5. Keep the executed BAA on file; it must be available for HIPAA audits.

## Who qualifies as a Covered Entity?

Under HIPAA, Covered Entities include:

- **Health plans** — health insurance companies, HMOs, company health plans.
- **Healthcare clearinghouses** — organisations that process health information from nonstandard to standard format.
- **Healthcare providers** — doctors, clinics, hospitals, nursing homes, pharmacies that transmit health information electronically for covered transactions.

If your organisation is a Covered Entity and you intend to use K-Perception to store or handle PHI, a BAA should be in place before doing so.

## Business associates of covered entities

If your organisation is a Business Associate of a Covered Entity (e.g., a healthcare IT consultant, legal firm that handles PHI, or a medical billing company), you may also be required to have a BAA with your upstream sub-processors, including K-Perception.

## What a BAA with K-Perception covers

Contact your account manager or legal@kperception.com for specific BAA terms. A typical BAA with a technology vendor covers:

- How the BA (K-Perception) will use and disclose PHI.
- The BA's obligation to implement appropriate safeguards (encryption, access controls, audit logging).
- The BA's obligation to report security incidents and breaches.
- The BA's obligation to ensure sub-processors (Cloudflare, etc.) are also bound by appropriate terms.
- The BA's obligation to return or destroy PHI at the end of the agreement.
- The CE's right to terminate if the BA violates the BAA.

## Sub-processor BAA coverage

For a BAA to be complete, K-Perception's sub-processors that handle PHI must also be covered by appropriate agreements:

- **Cloudflare** — Cloudflare offers a HIPAA BAA as part of its enterprise offerings. Contact your account manager or visit kperception.com for current details on whether K-Perception's Cloudflare contract includes HIPAA BAA coverage.
- **Stripe** — Stripe processes billing metadata, not PHI. A Stripe BAA is unlikely to be required, but verify with your HIPAA counsel.

## Relationship to the DPA

The BAA and DPA serve different purposes:

- The **DPA** addresses GDPR obligations as a data processor under EU law.
- The **BAA** addresses HIPAA obligations as a business associate under US law.

Organisations with both GDPR and HIPAA obligations may need both documents.

## Plan availability

BAA available: **Enterprise plan**. Contact your account manager or visit kperception.com for current details.

## Related articles

- [Legal Overview](overview.md)
- [HIPAA Compliance Guide](../compliance/hipaa.md)
- [Data Processing Agreement](data-processing-agreement.md)
- [Sub-processors](sub-processors.md)

## Source references

- `blueprint/project_blueprint.md` §4.7 — "Business Associate Agreement available on Enterprise plan"
- `blueprint/project_blueprint.md` §7 — "GDPR/HIPAA" listed as Enterprise plan feature
