---
title: "Data Processing Agreement (DPA)"
slug: "data-processing-agreement"
category: "Legal"
tags: ["dpa", "gdpr", "enterprise", "legal", "data-processing"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "blueprint/project_blueprint.md"
related:
  - "legal-overview"
  - "gdpr"
  - "privacy-policy"
  - "sub-processors"
---

# Data Processing Agreement (DPA)

A Data Processing Agreement (DPA) is a legally binding contract between a data controller (your organisation) and a data processor (K-Perception) that governs how the processor handles personal data on behalf of the controller. Under GDPR (Article 28), a DPA is required whenever a processor processes personal data on behalf of a controller.

The DPA is described as available in the product blueprint. Contact your account manager or legal@kperception.com for the current DPA document and any questions about its terms before entering into a DPA.

## When you need a DPA

You likely need a DPA with K-Perception if:

- Your organisation is subject to GDPR (you are established in the EU, or you process data of EU residents).
- You use K-Perception to process personal data belonging to individuals (employees, customers, patients, etc.).
- You require your SaaS vendors to have a DPA in place as part of your vendor management programme.

Even without a formal DPA requirement, organisations in regulated industries (healthcare, finance, legal) often require DPAs as part of their risk management processes.

## What the DPA covers

A DPA with K-Perception should address (consistent with GDPR Article 28(3)):

- **Subject matter and duration** — the nature and purpose of the processing; the duration of the agreement.
- **Nature of processing** — storage and retrieval of encrypted user content; management of workspace membership data.
- **Type of personal data** — account metadata (email, display name, membership records). Note: encrypted content is not personal data accessible to K-Perception (it is ciphertext).
- **Categories of data subjects** — your employees, collaborators, and (potentially) your customers.
- **Obligations and rights of the controller** — what instructions the controller gives; the controller's right to audit.
- **Processor obligations** — processing only on documented instructions; confidentiality; security measures; sub-processor management; assistance with data subject rights; deletion or return of data at contract end; audit rights.
- **Sub-processors** — K-Perception's use of sub-processors (Cloudflare, Stripe, Google — see [Sub-processors](sub-processors.md)) and obligations to inform the controller of changes.
- **International transfers** — Cloudflare infrastructure spans global PoPs; the DPA should address Standard Contractual Clauses (SCCs) or equivalent transfer mechanisms where applicable.

## K-Perception's role as data processor

Under GDPR, K-Perception acts as a **data processor** for company workspace data. Your organisation is the **data controller**. K-Perception processes personal data (workspace membership metadata) only to provide the service and as directed by your configuration.

**Important limitation:** K-Perception is a data processor only for the metadata it can access. The encrypted content (notes, files, messages) is ciphertext that K-Perception cannot read. For that content, K-Perception acts as a "conduit" — it stores opaque blobs with no ability to process the underlying personal data. Many legal analyses treat this as outside the scope of traditional data processing obligations, though the legal position varies by jurisdiction.

## How to request a DPA

To request a DPA:

1. Contact your K-Perception account manager or email legal@kperception.com.
2. Request the current DPA template.
3. Review the DPA with your legal counsel.
4. Execute the DPA by counter-signing. Executed copies are retained by both parties.

A DPA is available to **Enterprise** plan customers. Contact your account manager or legal@kperception.com to confirm DPA availability for Team plan customers.

## Sub-processor changes

Under GDPR, you have the right to object to new sub-processors. K-Perception will provide advance notice of any material sub-processor changes. Contact your account manager or visit kperception.com for current details on notice periods and notification mechanisms. See [Sub-processors](sub-processors.md) for the current list.

## Data transfer mechanisms

K-Perception uses Cloudflare infrastructure which spans global data centres. K-Perception uses Cloudflare's global infrastructure (Workers, D1, R2). Contact your account manager for EU data residency requirements, including which transfer mechanisms are used and whether Cloudflare's DPA is incorporated by reference.

## Plan availability

DPAs are available to **Enterprise** plan customers. Contact your account manager or legal@kperception.com to confirm availability for Team plan customers.

## Related articles

- [Legal Overview](overview.md)
- [GDPR Compliance Guide](../compliance/gdpr.md)
- [Privacy Policy summary](privacy-policy.md)
- [Sub-processors](sub-processors.md)
- [Data Residency](../compliance/data-residency.md)

## Source references

- `blueprint/project_blueprint.md` §4.7 — "DPA available" mention in GDPR compliance posture
