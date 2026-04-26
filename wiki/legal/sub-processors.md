---
title: "Sub-processors"
slug: "sub-processors"
category: "Legal"
tags: ["sub-processors", "gdpr", "privacy", "cloudflare", "stripe", "google"]
audience: "admin"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "blueprint/project_blueprint.md"
  - "private-sync-worker/src/stripe.ts"
related:
  - "legal-overview"
  - "privacy-policy"
  - "data-processing-agreement"
  - "data-residency"
---

# Sub-processors

A sub-processor is a third-party organisation that K-Perception engages to process personal data in connection with providing the service. Under GDPR Article 28(2), K-Perception is required to inform data controllers of sub-processors and to obtain controller authorisation before engaging new ones.

This page lists K-Perception's current sub-processors. The authoritative and up-to-date version is at kperception.com/legal/sub-processors.

## Current sub-processors

### Cloudflare, Inc.

| Attribute | Detail |
|-----------|--------|
| Purpose | Cloud infrastructure: edge compute (Workers), edge database (D1), object storage (R2), stateful real-time relay (Durable Objects) |
| Data processed | All server-side data: account metadata, session tokens, encrypted content blobs, audit events, workspace metadata |
| Data location | Global (300+ PoPs); EU data centres available. Contact your account manager for EU data residency requirements regarding K-Perception's R2 and D1 jurisdiction configuration. |
| Privacy policy | cloudflare.com/privacypolicy |
| DPA | Cloudflare's Data Processing Addendum (cloudflare.com/cloudflare-customer-dpa) |

Cloudflare is the primary sub-processor. All API requests, storage, and real-time communication pass through Cloudflare infrastructure.

**Zero-knowledge note:** Cloudflare processes encrypted blobs (note content, files, voice messages) that it cannot read. The metadata Cloudflare processes includes IP addresses, request metadata, and account metadata stored in D1.

### Stripe, Inc.

| Attribute | Detail |
|-----------|--------|
| Purpose | Payment processing, subscription management, billing webhooks |
| Data processed | Payment card data, billing address, email address (for billing), subscription status |
| Data location | United States (primarily); see Stripe's privacy policy for transfers |
| Privacy policy | stripe.com/privacy |
| DPA | Stripe's Data Processing Addendum (available at stripe.com) |

Stripe is used for Guardian, Vault, Lifetime, Team, and Enterprise plan billing. K-Perception does not store full payment card details — these are held by Stripe. K-Perception stores only the Stripe `customer_id`, subscription identifiers, and entitlement metadata needed to validate plan access.

Stripe billing is not involved for the Local (free) plan.

### Google LLC

| Attribute | Detail |
|-----------|--------|
| Purpose | OAuth2 authentication (Google Sign-In option) |
| Data processed | OAuth2 authorisation code and token; Google account email address |
| Data location | Google's global infrastructure; see Google's privacy policy |
| Privacy policy | policies.google.com/privacy |
| DPA | Google's Data Processing Addendum (available in Google's terms) |

Google is used only when a user chooses "Sign in with Google." Users who use email+password authentication do not interact with Google at all.

## Additional sub-processors

The following may be sub-processors. Contact support@kperception.com for confirmation of current third-party service providers.

- **Email service provider** — if K-Perception sends transactional emails (account verification, password reset, invite notifications), an email delivery service may be a sub-processor.
- **Error monitoring / observability** — if a third-party error tracking or monitoring service is used.
- **Android distribution platform** — Google Play Store processes data related to app distribution for Android users. Contact support@kperception.com for billing specifics on what data Google Play processes beyond standard app distribution.

## Notification of changes

K-Perception will provide advance notice of any new sub-processors or material changes to existing sub-processor arrangements. Contact your account manager or visit kperception.com for current details on notice periods and notification mechanisms.

Enterprise customers with a DPA in place have the right to object to new sub-processors. See [Data Processing Agreement](data-processing-agreement.md).

## Related articles

- [Legal Overview](overview.md)
- [Privacy Policy summary](privacy-policy.md)
- [Data Processing Agreement](data-processing-agreement.md)
- [Data Residency](../compliance/data-residency.md)

## Source references

- `blueprint/project_blueprint.md` §5.1 — infrastructure stack (Cloudflare Workers, D1, R2, Durable Objects; Stripe for billing)
- `private-sync-worker/src/stripe.ts` — Stripe webhook handler confirming Stripe integration
- `blueprint/project_blueprint.md` §3.1 — Google OAuth2 PKCE authentication
