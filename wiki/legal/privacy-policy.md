---
title: "Privacy Policy — Summary"
slug: "privacy-policy"
category: "Legal"
tags: ["privacy", "gdpr", "data-collection", "zero-knowledge"]
audience: "admin"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
  - "private-sync-worker/src/auth-local.ts"
  - "private-sync-worker/src/stripe.ts"
related:
  - "legal-overview"
  - "terms-of-service"
  - "data-processing-agreement"
  - "sub-processors"
  - "cookie-policy"
---

# Privacy Policy — Summary

This article is a plain-language summary of K-Perception's Privacy Policy. It is provided for convenience and does not replace the binding legal document. The authoritative Privacy Policy is published at [PLACEHOLDER — update before publishing: insert canonical URL, e.g. kperception.com/legal/privacy].

## The fundamental privacy property

K-Perception is a zero-knowledge application. This means:

**K-Perception cannot read your notes, files, messages, or voice recordings.** All content is encrypted with AES-256-GCM on your device before any data is transmitted to the server. The server stores only ciphertext. K-Perception employees, infrastructure operators, and government authorities that compel access to K-Perception's servers cannot obtain plaintext content.

This is a technical property enforced by the application's architecture, not merely a policy promise.

## What K-Perception collects

### Account metadata

When you create an account, K-Perception collects:

- **Email address** — used for authentication, transactional email (account verification, password reset, invite notifications), and billing for paid plans.
- **Display name** — the name shown to collaborators in workspaces and in real-time presence.
- **Authentication method** — email+password or Google OAuth2.
- **Plan and entitlement** — your current subscription tier and billing source.

This data is stored in Cloudflare D1 (edge SQLite) and is subject to GDPR and other applicable privacy regulations.

### Session and device metadata

- **Session tokens** — created at login and stored server-side for session validation. Multi-device sessions are tracked so you can view and revoke them from Account Settings.
- **IP address** — logged for security purposes including rate limiting and IP allowlist enforcement. [PLACEHOLDER — update before publishing: specify the retention period for IP address logs.]

### Usage metadata

- **Workspace membership and roles** — who belongs to which workspace, with what role, and since when.
- **File metadata** — file size, MIME type, upload timestamp, and wrapped key material. File names are encrypted before upload.
- **Audit events** — timestamps and actor IDs for administrative actions within workspaces and company accounts.
- **Storage usage** — aggregated byte counts per user and workspace for quota enforcement.

### What K-Perception does NOT collect

- **Note content** — stored as AES-256-GCM ciphertext; K-Perception cannot read it.
- **File content** — stored as AES-256-GCM ciphertext blobs in Cloudflare R2; K-Perception cannot read it.
- **Channel messages** — stored as AES-256-GCM ciphertext; K-Perception cannot read them.
- **Voice message content** — stored as AES-256-GCM ciphertext blobs; K-Perception cannot read them.
- **Passwords** — your master password is used only on your device for key derivation (Argon2id KDF); it is never transmitted to the server.

## How collected data is used

| Data | Purpose |
|------|---------|
| Email address | Authentication; transactional email; billing; account recovery |
| Display name | Collaboration presence; UI display |
| Session tokens | Authentication; multi-device session management; security monitoring |
| Usage metadata | Quota enforcement; billing; workspace administration |
| Audit events | Security monitoring; compliance reporting; tamper-evidence |

K-Perception does not sell personal data to third parties.

## Data retention

- **Account data** — retained while the account is active and for a period after closure as required by applicable law. [PLACEHOLDER — update before publishing: specify the post-closure retention period.]
- **Session tokens** — revoked sessions are retained for audit purposes. [PLACEHOLDER — update before publishing: specify the session token retention period.]
- **Workspace audit logs** — purged after the configured retention period (default 30 days for workspace-level logs).
- **Encrypted content** — retained in Cloudflare R2 until deleted by the user or until the account is purged. A GDPR account purge removes R2 blobs asynchronously.

## Third-party sub-processors

K-Perception uses the following third-party services that process personal data on its behalf. For the complete list, see [Sub-processors](sub-processors.md).

- **Cloudflare, Inc.** — all infrastructure (Workers, D1, R2, Durable Objects). Cloudflare processes network requests and stores account metadata and encrypted content blobs. Cloudflare cannot read the encrypted content.
- **Stripe, Inc.** — payment processing for paid plans. Stripe processes billing information. K-Perception does not store full payment card details.
- **Google LLC** — OAuth2 authentication for users who choose "Sign in with Google." Used only when a user selects Google authentication.
- **Resend** — transactional email delivery (account verification, password reset, workspace invitations). Resend processes email addresses and message content for delivery purposes.

## Your rights

Depending on your jurisdiction, you have rights including:

- **Right of access** — request a copy of your personal data. Contact [PLACEHOLDER — update before publishing: insert privacy contact email].
- **Right to rectification** — correct inaccurate personal data. Update your display name and email in Settings → Account.
- **Right to erasure** — request deletion of your personal data. Individual users may delete their account from Settings → Account → Delete Account (30-day grace period). Enterprise company super-admins can initiate a GDPR purge for company members from the Company Admin Panel.
- **Right to data portability** — export your data in a portable format. Notes can be exported as TXT, Markdown, JSON, PDF, HTML, or KPX (encrypted portable format).
- **Right to object** — object to processing based on legitimate interests. Contact [PLACEHOLDER — update before publishing: insert privacy contact email].

To exercise any of these rights, contact [PLACEHOLDER — update before publishing: insert privacy contact email, e.g. privacy@kperception.com].

## Data Protection Officer

[PLACEHOLDER — update before publishing: state whether a DPO has been appointed; if so, provide their contact details. If not yet appointed, note this clearly.]

## Analytics

[PLACEHOLDER — update before publishing: confirm whether any third-party analytics service is used on the marketing website or within the application, and if so, name the service and describe the opt-out mechanism. If no analytics are used, state that explicitly.]

## Children's privacy

[PLACEHOLDER — update before publishing: specify the minimum age requirement and describe compliance with applicable children's privacy law (e.g. COPPA for users in the United States, GDPR Article 8 for users in the EU).]

## Contact

For privacy-related enquiries: [PLACEHOLDER — update before publishing: insert privacy contact email and postal address of the data controller.]

## Related articles

- [Legal Overview](overview.md)
- [Data Processing Agreement](data-processing-agreement.md)
- [Sub-processors](sub-processors.md)
- [Cookie Policy](cookie-policy.md)

## Source references

- `private-sync-worker/src/company.ts` — GDPR export fields (email, displayName, role, status, joinedAt, removedAt)
- `private-sync-worker/src/auth-local.ts` — Resend transactional email integration
- `private-sync-worker/src/stripe.ts` — Stripe payment processing integration
