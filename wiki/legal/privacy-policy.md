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
  - "blueprint/project_blueprint.md"
related:
  - "legal-overview"
  - "terms-of-service"
  - "data-processing-agreement"
  - "sub-processors"
  - "gdpr"
---

# Privacy Policy — Summary

This article is a plain-language summary of K-Perception's Privacy Policy. It is provided for convenience and does not replace the binding legal document. Always refer to the official Privacy Policy at kperception.com/legal/privacy for the authoritative text.

## The fundamental privacy property

K-Perception is a zero-knowledge application. This means:

**K-Perception cannot read your notes, files, or messages.** All content is AES-256-GCM encrypted on your device before any data is transmitted. The server stores only ciphertext. K-Perception employees, infrastructure operators, and government authorities that compel access to K-Perception's servers cannot obtain plaintext content.

This is a technical property, not a policy promise. The Privacy Policy describes what K-Perception can and does collect — which is limited to account metadata, not content.

## What K-Perception collects

### Account metadata (collected)

When you create an account, K-Perception collects:

- **Email address** — used for authentication, account recovery communication, and (for paid plans) billing.
- **Display name** — the name shown to collaborators in workspaces and real-time presence.
- **Authentication method** — email+password or Google OAuth2.
- **Plan and entitlement** — your current subscription tier and billing source.

This data is stored in Cloudflare D1 and is subject to GDPR and other privacy regulations.

### Session and device metadata (collected)

- **Session tokens** — created at login; stored server-side for session validation. Multi-device sessions are tracked so you can view and revoke them.
- **Device identifiers** — a device identifier may be stored to support multi-device session management and TOTP device association.
- **IP address** — logged transiently for security purposes (rate limiting, IP allowlist enforcement). Retention behavior for IP addresses may vary; contact support@kperception.com for billing specifics.

### Usage metadata (collected)

- **Workspace membership and roles** — who belongs to which workspace, with what role, since when.
- **File metadata** — file name (encrypted), file size, MIME type, upload timestamp, DEK-wrapped key material. File name encryption depends on the upload method; this behavior may vary by platform.
- **Audit events** — timestamps and actor IDs for administrative actions (see [Audit Log Retention](../compliance/audit-retention.md)).
- **Storage usage** — aggregated byte counts per user/workspace for quota enforcement.

### What K-Perception does NOT collect

- **Note content** — stored as AES-256-GCM ciphertext; K-Perception cannot read it.
- **File contents** — stored as AES-256-GCM ciphertext; K-Perception cannot read it.
- **Channel messages** — stored as AES-256-GCM ciphertext; K-Perception cannot read them.
- **Passwords** — your master password is used only on your device for key derivation (Argon2id KDF); it is never transmitted to the server.
- **Voice messages (content)** — stored as AES-256-GCM ciphertext blobs in R2.

## How collected data is used

| Data | Purpose |
|------|---------|
| Email address | Authentication; billing; account recovery; product communications (contact support@kperception.com regarding marketing consent) |
| Display name | Collaboration presence; UI display |
| Session data | Authentication; multi-device session management; security monitoring |
| Usage metadata | Quota enforcement; billing; workspace administration |
| Audit events | Security monitoring; compliance reporting; tamper evidence |

## Data retention

- **Account data** — retained while the account is active and for a period after closure as required by law. Contact support@kperception.com for billing specifics on post-closure retention.
- **Session tokens** — revoked sessions are retained in D1 for audit purposes. Specific retention periods may vary; contact support@kperception.com for details.
- **Audit logs** — workspace audit logs are purged after the configured retention period (default 30 days). Company audit log retention behavior may vary; contact your account manager for details.
- **Encrypted content** — retained in R2 until deleted by the user or until the account is purged (GDPR purge removes R2 blobs asynchronously).

## Third-party services

K-Perception uses the following third-party services that may process personal data:

- **Cloudflare** — all infrastructure (Workers, D1, R2, Durable Objects). Cloudflare processes network requests and stores metadata and ciphertext. See [Sub-processors](sub-processors.md) and Cloudflare's Privacy Policy.
- **Stripe** — payment processing for paid plans. Stripe processes billing information. K-Perception does not store full payment card details.
- **Google** — OAuth2 authentication for users who sign in with Google. Google processes authentication tokens.

K-Perception does not sell personal data to third parties.

## User rights

Depending on your jurisdiction, you may have rights including:

- **Right of access** — obtain a copy of your personal data. Enterprise company admins can generate a GDPR export (see [GDPR Compliance Guide](../compliance/gdpr.md)).
- **Right to rectification** — correct inaccurate personal data. Update your display name and email in Account Settings.
- **Right to erasure** — request deletion of your personal data. Enterprise company super-admins can initiate a GDPR purge. Individual users may delete their account from Account Settings; contact support@kperception.com if you need assistance with account deletion.
- **Right to data portability** — export your data in a portable format. Notes can be exported as TXT, Markdown, JSON, PDF, HTML, or KPX (encrypted portable format).
- **Right to object** — object to processing based on legitimate interests. Contact privacy@kperception.com.

To exercise these rights: contact privacy@kperception.com.

## Analytics

Details on any third-party analytics used on the marketing site or in the application are available in the official Privacy Policy at kperception.com/legal/privacy. Contact support@kperception.com for specifics.

## Children's privacy

Minimum age requirements and COPPA compliance details are available in the official Privacy Policy at kperception.com/legal/privacy. Contact your K-Perception account manager or visit kperception.com for current details.

## Contact

For privacy-related enquiries: privacy@kperception.com. Contact your K-Perception account manager or visit kperception.com for current details on Data Protection Officer (DPO) appointment and other privacy contacts.

## Related articles

- [Legal Overview](overview.md)
- [Data Processing Agreement](data-processing-agreement.md)
- [Sub-processors](sub-processors.md)
- [GDPR Compliance Guide](../compliance/gdpr.md)
- [Cookie Policy](cookie-policy.md)

## Source references

- `blueprint/project_blueprint.md` §4.6 — what the server can and cannot see
- `private-sync-worker/src/company.ts` — GDPR export fields (email, displayName, role, status, joinedAt, removedAt)
