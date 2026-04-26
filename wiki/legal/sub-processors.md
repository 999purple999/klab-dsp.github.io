---
title: "Sub-processors"
slug: "sub-processors"
category: "Legal"
tags: ["sub-processors", "gdpr", "privacy", "cloudflare", "stripe", "google", "resend"]
audience: "admin"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "blueprint/project_blueprint.md"
  - "private-sync-worker/src/stripe.ts"
  - "private-sync-worker/src/auth-local.ts"
related:
  - "legal-overview"
  - "privacy-policy"
  - "data-processing-agreement"
---

# Sub-processors

A sub-processor is a third-party organisation that K-Perception engages to process personal data in connection with providing the service. Under GDPR Article 28(2), K-Perception is required to inform data controllers of sub-processors and to obtain controller authorisation before engaging new ones.

This page lists K-Perception's current sub-processors. The authoritative and up-to-date version is published at [PLACEHOLDER — update before publishing: insert canonical URL, e.g. kperception.com/legal/sub-processors].

## Current sub-processors

### Cloudflare, Inc.

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Cloud infrastructure: edge compute (Workers), edge database (D1), object storage (R2), stateful real-time relay (Durable Objects) |
| **Data processed** | All server-side data: account metadata, session tokens, encrypted content blobs, audit events, workspace metadata, IP addresses |
| **Data location** | Global (300+ points of presence). K-Perception does not currently pin data to a specific region. [PLACEHOLDER — update before publishing: confirm whether EU-only data residency is available for Enterprise customers.] |
| **Privacy policy** | cloudflare.com/privacypolicy |
| **DPA** | Cloudflare's Data Processing Addendum: cloudflare.com/cloudflare-customer-dpa |

Cloudflare is the primary sub-processor. All API requests, storage reads/writes, and real-time collaboration pass through Cloudflare infrastructure.

**Zero-knowledge note:** Cloudflare stores encrypted blobs (note content, files, voice recordings, channel messages) that it cannot decrypt. The metadata Cloudflare processes in plaintext includes IP addresses, request metadata, and the account metadata stored in D1.

---

### Stripe, Inc.

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Payment processing, subscription management, billing webhooks |
| **Data processed** | Payment card data, billing address, email address (for receipts), subscription status |
| **Data location** | United States (primarily); see Stripe's privacy policy for international transfer mechanisms |
| **Privacy policy** | stripe.com/privacy |
| **DPA** | Stripe's Data Processing Addendum: stripe.com/legal/dpa |

Stripe is used for Guardian, Vault, Lifetime, Team, and Enterprise plan billing. K-Perception does not store payment card details — these are held by Stripe. K-Perception stores only the Stripe `customer_id`, subscription identifiers, and entitlement metadata required to validate plan access.

Stripe is not involved for the Local (free) plan.

---

### Google LLC

| Attribute | Detail |
|-----------|--------|
| **Purpose** | OAuth2 authentication ("Sign in with Google") |
| **Data processed** | OAuth2 authorisation code and token exchange; Google account email address |
| **Data location** | Google's global infrastructure; see Google's privacy policy |
| **Privacy policy** | policies.google.com/privacy |
| **DPA** | Google's Data Processing Addendum, incorporated into Google's Terms of Service |

Google is used only when a user explicitly selects "Sign in with Google." Users who authenticate with email and password have no interaction with Google.

---

### Resend

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Transactional email delivery (account verification, password reset, workspace invitations, notification emails) |
| **Data processed** | Recipient email address; email subject and body (which may contain the recipient's name or workspace name) |
| **Data location** | [PLACEHOLDER — update before publishing: confirm Resend's data processing location and DPA availability from resend.com/legal] |
| **Privacy policy** | resend.com/privacy-policy |
| **DPA** | [PLACEHOLDER — update before publishing: confirm whether Resend offers a DPA and insert the URL] |

Resend is used for all transactional email sent by K-Perception. It processes email addresses and message content only for the purpose of delivery.

---

## Notification of changes

K-Perception will provide advance written notice of any new sub-processors or material changes to existing sub-processor arrangements. [PLACEHOLDER — update before publishing: specify the notice period, e.g. 30 days before the change takes effect.]

Enterprise customers with an executed DPA have the right to object to new sub-processors within the notice period. See [Data Processing Agreement](data-processing-agreement.md).

## Related articles

- [Legal Overview](overview.md)
- [Privacy Policy summary](privacy-policy.md)
- [Data Processing Agreement](data-processing-agreement.md)

## Source references

- `blueprint/project_blueprint.md` §5.1 — infrastructure stack (Cloudflare Workers, D1, R2, Durable Objects; Stripe for billing)
- `private-sync-worker/src/stripe.ts` — Stripe webhook handler confirming Stripe integration
- `private-sync-worker/src/auth-local.ts` — Resend email delivery integration
- `blueprint/project_blueprint.md` §3.1 — Google OAuth2 PKCE authentication
