---
title: "HIPAA Compliance Guide"
slug: "hipaa"
category: "Compliance"
tags: ["hipaa", "healthcare", "phi", "baa", "enterprise", "security"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
  - "blueprint/project_blueprint.md"
related:
  - "compliance-overview"
  - "gdpr"
  - "soc2"
  - "hipaa-baa"
---

# HIPAA Compliance Guide

This article describes how K-Perception's architecture aligns with HIPAA Technical Safeguard requirements for covered entities and business associates. It does not constitute legal advice. HIPAA compliance is a programme, not a product feature — K-Perception provides technical controls, but your organisation is responsible for policies, workforce training, and overall programme governance.

## Important disclaimer

This documentation describes technical controls present in K-Perception. Whether these controls satisfy your specific HIPAA obligations depends on your organisation's HIPAA risk analysis, the scope of PHI involved, and the applicable standards under the HIPAA Security Rule (45 CFR Part 164). Consult qualified HIPAA counsel before deploying K-Perception in a covered-entity or business-associate context.

## What K-Perception offers for HIPAA-covered workflows

K-Perception is designed as a zero-knowledge system: the server holds only AES-256-GCM ciphertext and never possesses plaintext content or decryption keys. This architectural property has direct HIPAA relevance:

**K-Perception cannot access PHI.** If a healthcare professional stores patient notes, clinical observations, or other PHI in K-Perception, that content is encrypted on their device before any network transmission. The Cloudflare Worker backend, including K-Perception employees and infrastructure operators, cannot decrypt or read that content. This limits K-Perception's role as a business associate because it cannot process PHI in plaintext.

## HIPAA Technical Safeguards — control mapping

The HIPAA Security Rule (45 CFR §164.312) requires Technical Safeguards. The following table maps those requirements to K-Perception controls:

| HIPAA Technical Safeguard | K-Perception control |
|---------------------------|----------------------|
| Access controls (§164.312(a)(1)) | Workspace roles (owner / admin / editor / commenter / viewer / guest); per-file ACL; section-level HKDF-derived keys; company IP allowlist |
| Audit controls (§164.312(b)) | Workspace audit log (all member, file, and policy events); company audit log (hash-chained tamper evidence); configurable retention |
| Integrity controls (§164.312(c)(1)) | AES-256-GCM authenticated encryption (GCM tag provides integrity verification); hash-chained audit log |
| Person or entity authentication (§164.312(d)) | Email+password (Argon2id KDF); Google OAuth2 PKCE; TOTP step-up 2FA; SAML 2.0 SSO (Enterprise); MFA enforcement policy (Enterprise) |
| Transmission security (§164.312(e)(1)) | All traffic over TLS; Y.js real-time updates AES-256-GCM encrypted before WebSocket transmission; share links use key-in-URL-fragment (key never sent to server) |

## Encryption at rest

All note content, file blobs, and workspace data is stored in Cloudflare R2 as AES-256-GCM ciphertext. The encryption hierarchy is:

```
Master Password
    → Argon2id KDF (m=19456 KiB, t=2, p=1)
        → Vault Key
            → (workspace) WDK → SK_section → SK_dir → DEK → ciphertext blob
```

The server stores only the ciphertext blobs and wrapped key material. It cannot reconstruct plaintext without the user's password.

## Audit log

The workspace audit log records all significant events: member joins and leaves, role changes, file uploads and deletions, key rotations, channel operations, and administrative policy changes. The company-level audit log is hash-chained (SHA-256 of sequence number + previous hash + encrypted body), making retroactive modification or deletion detectable.

Audit log retention is configurable per workspace (default: 30 days). For HIPAA, you may need to extend this to 6 years to align with HIPAA's required retention of documentation (45 CFR §164.316(b)(2)(i)). The `audit_retention_days` column is an uncapped INTEGER; setting it to approximately 2190 days (or 0 to disable purging entirely) covers 6 years. See [Audit Log Retention](audit-retention.md) for detail.

## Session management and remote wipe

- **Multi-device session list** — administrators and users can view all active sessions and revoke individual sessions remotely.
- **Remote device wipe** — workspace admins (Enterprise) can trigger remote session invalidation for a device. This revokes the session token; content cached on-device in IndexedDB or Capacitor Preferences is not remotely wiped (it is already encrypted).
- **Session revocation on purge** — the GDPR purge endpoint revokes all sessions for the target user as the first step.

## MFA enforcement

Enterprise companies can enforce TOTP multi-factor authentication for all company members via the **Company Admin > Policies** tab. Once enforced, members who have not enrolled in TOTP cannot access workspace resources.

## IP allowlist

Enterprise companies can restrict API access to approved source IP ranges via **Company Admin > Security > IP Allowlist**. Requests from unlisted IPs are rejected at the Worker edge before any authentication occurs.

## SAML 2.0 SSO (Enterprise)

K-Perception supports SAML 2.0 SP-initiated and IdP-initiated SSO, enabling integration with your existing identity provider (Okta, Azure AD, Google Workspace, etc.) for centralised authentication and deprovisioning.

## SCIM 2.0 provisioning (Enterprise)

SCIM 2.0 User and Group CRUD enables automated provisioning and deprovisioning from your IdP. When a user is deprovisioned in your IdP, SCIM removes them from the K-Perception company, revoking their access to workspace resources.

## Business Associate Agreement (BAA)

A Business Associate Agreement is described as available for Enterprise plan customers in the product blueprint. Contact your K-Perception account manager or legal@kperception.com for current details on BAA availability and the request process before relying on this for a covered-entity deployment.

See [HIPAA Business Associate Agreement](../legal/hipaa-baa.md).

## Zero-knowledge limitation for covered entities

The zero-knowledge property means K-Perception has limited ability to assist in breach investigations involving note content, because the server cannot decrypt that content. However:

- Audit logs provide a complete record of who accessed which resources and when.
- Session tokens and access events are logged.
- The content itself, even if an R2 bucket were compromised, is not recoverable without device-held keys.

This is generally advantageous for HIPAA: a server-side breach of K-Perception infrastructure does not constitute a breach of PHI in the traditional sense, because the server never held readable PHI.

## Platform differences

All platforms (Windows desktop, Android, web) use the same zero-knowledge encryption model. On Android, biometric authentication (fingerprint / Face ID) is available as a convenient unlock mechanism; it gates access to the locally-cached encrypted vault. The biometric credential does not substitute for the master password in the cryptographic key derivation — it is a device-level convenience unlock only.

## Plan availability

HIPAA-relevant Enterprise features:

| Feature | Enterprise |
|---------|------------|
| Audit log with configurable retention | Yes |
| Hash-chained company audit log | Yes |
| MFA enforcement | Yes |
| IP allowlist | Yes |
| Remote device session wipe | Yes |
| SAML 2.0 SSO | Yes |
| SCIM 2.0 provisioning | Yes |
| BAA (contact account manager) | Yes |

Zero-knowledge encryption at rest and in transit is available on all plans.

## Permissions and roles

- **MFA enforcement** — requires company `super-admin`.
- **IP allowlist management** — requires company `super-admin`.
- **Audit log access** — requires company `auditor` role or above.
- **Remote wipe** — requires workspace `admin` role.
- **SAML/SCIM configuration** — requires company `super-admin`.

## Related articles

- [Compliance Overview](overview.md)
- [HIPAA Business Associate Agreement](../legal/hipaa-baa.md)
- [Audit Log Retention](audit-retention.md)
- [GDPR Compliance Guide](gdpr.md)
- [Security: Zero-Knowledge Architecture](../security/zero-knowledge.md)

## Source references

- `blueprint/project_blueprint.md` §4.7 — compliance posture, HIPAA BAA mention
- `blueprint/project_blueprint.md` §3.1 — authentication feature matrix (SAML, SCIM, TOTP, MFA enforcement)
- `private-sync-worker/src/company.ts` — GDPR purge with session revocation
- `private-sync-worker/migrations/0024_company_backups.sql` — hash-chained audit event schema
