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
  - "privacy-policy"
  - "sub-processors"
---

# Data Processing Agreement (DPA)

A Data Processing Agreement (DPA) is a legally binding contract between a data controller (your organisation) and a data processor (K-Perception) that governs how the processor handles personal data on behalf of the controller. Under GDPR Article 28, a DPA is required whenever a processor processes personal data on behalf of a controller established in the EU, or processing personal data of EU residents.

A DPA is available to Enterprise plan customers. To request the current DPA document, contact [PLACEHOLDER — update before publishing: insert legal contact email, e.g. legal@kperception.com].

## When you need a DPA

You likely need a DPA with K-Perception if:

- Your organisation is subject to GDPR — either you are established in the EU or EEA, or you process personal data of EU or EEA residents.
- You use K-Perception to process personal data belonging to individuals (employees, customers, or others).
- Your vendor management or procurement programme requires executed DPAs with all SaaS providers.

Organisations in regulated industries (healthcare, finance, legal) routinely require DPAs as part of their risk management processes, independent of any legal mandate.

## What the DPA covers

A DPA with K-Perception addresses the requirements of GDPR Article 28(3), including:

- **Subject matter and duration** — the nature and purpose of the processing; the duration of the agreement.
- **Nature of processing** — storage and retrieval of encrypted user content; management of workspace membership metadata.
- **Types of personal data** — account metadata (email address, display name, workspace membership records). Encrypted content blobs are not personal data accessible to K-Perception.
- **Categories of data subjects** — your employees, collaborators, and, where applicable, your own customers.
- **Controller obligations and rights** — the instructions the controller gives to the processor; the controller's right to audit.
- **Processor obligations** — processing only on documented controller instructions; confidentiality; implementation of appropriate technical and organisational security measures; sub-processor management; assistance with data subject rights requests; deletion or return of data at contract end; cooperation with supervisory authorities.
- **Sub-processors** — K-Perception's use of sub-processors (Cloudflare, Stripe, Google, Resend — see [Sub-processors](sub-processors.md)) and the obligation to inform the controller of intended changes.
- **International transfers** — where personal data is transferred outside the EU/EEA (Cloudflare's global infrastructure spans data centres in multiple jurisdictions), the applicable transfer mechanism (Standard Contractual Clauses or equivalent) will be addressed in the DPA.

## K-Perception's role as data processor

Under GDPR, K-Perception acts as a **data processor** for workspace and company account metadata. Your organisation is the **data controller**. K-Perception processes personal data only to provide the service and as directed by your configuration.

**Important scope limitation:** K-Perception processes only the metadata it can access in plaintext. Encrypted content (notes, files, messages, voice recordings) is stored as opaque ciphertext that K-Perception cannot read or process. Many legal analyses treat this ciphertext storage as outside the traditional scope of personal data processing by K-Perception, though the applicable legal position varies by jurisdiction. Consult your legal counsel for your specific deployment.

## How to request a DPA

1. Confirm you are on the Enterprise plan or are in the process of signing an Enterprise contract.
2. Contact your K-Perception account manager or email [PLACEHOLDER — update before publishing: insert legal contact email] to request the current DPA template.
3. Review the DPA with your legal counsel.
4. Execute the DPA by counter-signing. Executed copies are retained by both parties.

## Sub-processor changes

Under GDPR, you have the right to object to new sub-processors. K-Perception will provide advance written notice of any material sub-processor changes. [PLACEHOLDER — update before publishing: specify the notice period, e.g. 30 days.] See [Sub-processors](sub-processors.md) for the current list.

## International data transfers

K-Perception uses Cloudflare's globally distributed infrastructure. Data written to Cloudflare D1 or R2 may be stored in or routed through data centres outside the EU/EEA. K-Perception addresses this through Cloudflare's Data Processing Addendum, which incorporates Standard Contractual Clauses. [PLACEHOLDER — update before publishing: confirm the specific transfer mechanism(s) in place and whether EU-only data residency can be configured for Enterprise customers.]

## Plan availability

DPAs are available to **Enterprise plan** customers. [PLACEHOLDER — update before publishing: confirm whether DPAs are also available on the Team plan.]

## Related articles

- [Legal Overview](overview.md)
- [Privacy Policy summary](privacy-policy.md)
- [Sub-processors](sub-processors.md)

## Source references

- `blueprint/project_blueprint.md` §4.7 — GDPR compliance posture; DPA availability noted
