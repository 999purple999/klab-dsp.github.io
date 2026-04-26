---
title: "Legal Overview"
slug: "legal-overview"
category: "Legal"
tags: ["legal", "terms", "privacy", "dpa", "compliance"]
audience: "admin"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs: []
related:
  - "terms-of-service"
  - "privacy-policy"
  - "data-processing-agreement"
  - "acceptable-use-policy"
  - "cookie-policy"
  - "sub-processors"
  - "hipaa-baa"
  - "security-disclosure"
  - "sla"
---

# Legal Overview

This article provides a guide to the legal documents that govern use of K-Perception. It does not replace those documents. Always refer to the binding versions published at [PLACEHOLDER — update before publishing: insert canonical legal portal URL, e.g. kperception.com/legal].

## Legal documents at a glance

| Document | Who it applies to | How to obtain |
|----------|-------------------|---------------|
| Terms of Service | All users | [PLACEHOLDER — insert canonical URL] |
| Privacy Policy | All users | [PLACEHOLDER — insert canonical URL] |
| Acceptable Use Policy | All users | [PLACEHOLDER — insert canonical URL] |
| Cookie Policy | Web and app users | [PLACEHOLDER — insert canonical URL] |
| Sub-processors list | All customers (transparency) | [PLACEHOLDER — insert canonical URL] |
| Data Processing Agreement (DPA) | Enterprise customers processing EU personal data | On request — see [Data Processing Agreement](data-processing-agreement.md) |
| HIPAA Business Associate Agreement (BAA) | Healthcare Covered Entities on Enterprise plan | On request — see [HIPAA BAA](hipaa-baa.md); availability not yet confirmed |
| Service Level Agreement (SLA) | Enterprise customers | See [SLA](sla.md); full terms in your Enterprise service agreement |
| Security Disclosure Policy | Security researchers | See [Security Disclosure](security-disclosure.md) |

## Terms of Service

The Terms of Service governs your right to use K-Perception, your obligations as a user, K-Perception's limitations of liability, and account termination conditions. All users must accept the Terms when creating an account or first launching the application.

Highlights: zero-knowledge commitment; Stripe billing; 30-day account deletion grace period; "as is" service provision.

See [Terms of Service summary](terms-of-service.md).

## Privacy Policy

The Privacy Policy describes what data K-Perception collects, why, how it is used, and how long it is retained. K-Perception's zero-knowledge architecture means that note and file content is never collected — the server holds only AES-256-GCM ciphertext that K-Perception cannot read.

Collected data is limited to: email address, display name, session tokens, workspace membership metadata, usage and quota metadata, and audit events.

Third-party sub-processors: Cloudflare (infrastructure), Stripe (billing), Google (OAuth2), Resend (transactional email).

See [Privacy Policy summary](privacy-policy.md).

## Acceptable Use Policy

The Acceptable Use Policy defines what users may and may not do with K-Perception. It applies to all plans and all platforms. Because K-Perception is zero-knowledge and cannot monitor content, the AUP relies on user reports to identify violations.

See [Acceptable Use Policy summary](acceptable-use-policy.md).

## Cookie Policy

K-Perception's web and desktop applications use `sessionStorage` and `IndexedDB` for vault storage rather than tracking cookies. A single HTTP cookie (`session`) is used only during the SAML SSO authentication flow. The Cookie Policy explains all storage mechanisms in use and how to manage them.

See [Cookie Policy](cookie-policy.md).

## Data Processing Agreement (DPA)

Organisations subject to GDPR that use K-Perception to process personal data need a DPA in place with K-Perception as the data processor. A DPA is available to Enterprise customers on request.

See [Data Processing Agreement](data-processing-agreement.md).

## HIPAA Business Associate Agreement (BAA)

Healthcare Covered Entities that intend to use K-Perception for workflows involving Protected Health Information (PHI) must have a BAA in place before doing so. A BAA is listed as available on the Enterprise plan, but its current availability and sub-processor coverage are not yet fully confirmed. Do not use K-Perception for PHI without first consulting your HIPAA compliance officer and obtaining a fully executed BAA.

See [HIPAA Business Associate Agreement](hipaa-baa.md).

## Sub-processors

K-Perception uses four confirmed sub-processors: Cloudflare (all infrastructure), Stripe (billing), Google (OAuth2 authentication), and Resend (transactional email). Cloudflare processes all server-side data including encrypted content blobs, which it cannot read.

See [Sub-processors](sub-processors.md).

## Service Level Agreement (SLA)

The Enterprise plan includes a 99.9% monthly uptime commitment, as described in the product blueprint. Measurement methodology, service credits, exclusions, and incident response procedures are specified in your Enterprise service agreement.

See [Service Level Agreement](sla.md).

## Security Disclosure Policy

If you have identified a security vulnerability in K-Perception, follow the responsible disclosure process before any public disclosure.

See [Security Disclosure Policy](security-disclosure.md).

## Certifications and compliance programmes

K-Perception does not currently hold SOC 2, ISO 27001, or any other third-party security certification. No audit report is available at this time. [PLACEHOLDER — update before publishing: update this section when and if certifications are obtained.]

GDPR self-service tooling is available: individual users can delete their account from Settings → Account → Delete Account; company super-admins can initiate a GDPR purge from the Company Admin Panel.

## Changes to legal documents

K-Perception may update legal documents from time to time. Material changes will be communicated to account holders with reasonable advance notice. The effective date is shown on each published document.

## Contact

For legal and compliance enquiries: [PLACEHOLDER — update before publishing: insert legal contact email and registered company address.]

For privacy-related enquiries: [PLACEHOLDER — update before publishing: insert privacy contact email.]

For security vulnerability reports: [PLACEHOLDER — update before publishing: insert security contact email.]

## Related articles

- [Terms of Service summary](terms-of-service.md)
- [Privacy Policy summary](privacy-policy.md)
- [Data Processing Agreement](data-processing-agreement.md)
- [Acceptable Use Policy summary](acceptable-use-policy.md)
- [Cookie Policy](cookie-policy.md)
- [Sub-processors](sub-processors.md)
- [HIPAA Business Associate Agreement](hipaa-baa.md)
- [Service Level Agreement](sla.md)
- [Security Disclosure Policy](security-disclosure.md)
