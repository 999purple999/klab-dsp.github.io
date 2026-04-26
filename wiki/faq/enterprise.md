---
title: "Enterprise FAQ"
slug: "faq-enterprise"
category: "FAQ"
tags: ["faq", "enterprise", "saml", "scim", "oidc", "sso", "mfa", "gdpr", "audit", "admin"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "macos", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/company.ts
  - src/shared/companyPolicy.ts
  - src/renderer/src/company
  - private-sync-worker
related: ["faq-security", "faq-billing", "faq-general"]
---

# Enterprise FAQ

## What is included in the Enterprise plan?

The Enterprise plan (€14.99/user/month) includes everything in Team plus:

- **SAML 2.0 SSO** — federated authentication via your IdP
- **SCIM 2.0 provisioning** — automated user and group provisioning from your IdP
- **OIDC** — OpenID Connect identity federation
- **IP allowlist** — restrict access to specific IP ranges
- **MFA enforcement** — require TOTP 2FA for all company members
- **Domain restriction** — restrict sign-up/join to verified email domains
- **Remote wipe** — administrator-initiated wipe of a member's workspace data
- **Transfer ownership** — safely transfer workspace ownership with quorum approval
- **GDPR tooling** — data deletion workflows for compliance
- **Audit log** — tamper-evident audit chain for workspace and company events
- **Compliance** (GDPR, HIPAA BAA available — contact your account manager) — data processing agreements
- **Unlimited storage and devices**
- **SLA 99.9% uptime guarantee**
- **Dedicated admin console**
- **Dedicated account manager**

---

## What Identity Providers (IdPs) are supported for SAML?

K-Perception supports any **SAML 2.0**-compliant IdP. Tested and documented configurations include:
- Okta
- Microsoft Azure Active Directory (Entra ID)
- Google Workspace
- OneLogin
- Any standard SAML 2.0 IdP

For OIDC-based federation, any OIDC-compliant IdP is supported.

---

## Does SAML SSO replace the vault password?

No. SAML handles **authentication** (verifying your identity to the K-Perception backend). The **vault password** is a separate credential that derives your AES-256-GCM encryption key via Argon2id. It is never sent to any server, including the IdP.

After SAML authentication, users still need to enter their vault password to decrypt note content. This is a security property, not a UX limitation — it ensures the IdP cannot access encrypted content even if the SAML assertion is valid.

The vault password setup prompt on first SAML login behavior may vary by deployment; contact support@kperception.com for details on JIT provisioning flow.

---

## How does SCIM provisioning work?

SCIM 2.0 (System for Cross-domain Identity Management) enables your IdP to automatically:
- Create K-Perception accounts when users are added in the IdP
- Update user attributes (display name, email) when they change in the IdP
- Deprovision (soft-delete or suspend) accounts when users are removed from the IdP
- Manage group membership for workspace role assignments

Configure SCIM in your IdP by pointing it at the K-Perception SCIM endpoint and providing a SCIM bearer token (generated in the Company Admin Console → Security → SCIM Tokens).

---

## What are company roles?

Company-level roles control access to the Company Admin Console:

| Role | Capabilities |
|---|---|
| `super-admin` | Full company administration, including billing, SSO, and member management |
| `billing-admin` | Manage billing and plan upgrades |
| `auditor` | Read-only access to audit logs and compliance data |
| `observer` | Read-only visibility into company membership |

---

## What are workspace roles?

Workspace roles control access within a specific workspace:

| Role | Capabilities |
|---|---|
| `owner` | Full control, including delete workspace and transfer ownership |
| `admin` | Manage members, sections, and settings; cannot delete workspace |
| `editor` | Create and edit all content |
| `commenter` | View and comment; cannot edit |
| `viewer` | Read-only access |
| `guest` | Limited read access to shared items only |

---

## Can I enforce MFA for all company members?

Yes. Go to **Company Admin Console → Policies → Require MFA**. When this policy is enabled, all members are required to complete TOTP setup before accessing workspace content. Members without TOTP enrolled are prompted to set it up on their next login.

---

## Is there a HIPAA BAA available?

A HIPAA Business Associate Agreement is listed as available on the Enterprise plan. Contact your K-Perception account manager or visit kperception.com for current details on the BAA process and availability. See also the [HIPAA BAA](../legal/hipaa-baa.md) article.

---

## What are "dangerous operations" and why do they require extra authentication?

Certain operations are classified as dangerous because they are irreversible or have significant security implications. These require a **TOTP step-up token** (an elevation credential separate from the session) to execute:

- **Rotate workspace key** — re-encrypts workspace under a new key; old key material is discarded
- **Remote wipe** — irreversibly deletes a member's workspace content
- **Transfer ownership** — changes who owns the workspace
- **Delete workspace** — permanently destroys the workspace and all its content
- **Restore backup** — overwrites current workspace state with a backup

This ensures a compromised session token alone cannot trigger these operations.

---

## What does the Admin Console include?

The Company Admin Console includes:

1. **Members** — list, invite, role assignment, remove
2. **Groups** — membership bundles for permission management
3. **Security** — sessions, API keys, webhooks, IP allowlist
4. **Policies** — MFA enforcement, domain restriction, invite policy
5. **SSO / SAML / SCIM** — federation configuration
6. **Billing** — plan, seats, invoices
7. **Audit Log** — tamper-evident event chain
8. **GDPR / Compliance** — data deletion, data export, compliance tab

---

## How does the IP allowlist work?

Under **Company Admin Console → Security → IP Allowlist**, you can define CIDR ranges that are permitted to access the company's K-Perception resources. Requests from IPs outside the allowlist are rejected with an authorization error. This is enforced server-side by the Worker.

---

## How does domain restriction work?

When enabled under **Policies → Domain Restriction**, only email addresses from verified company domains (e.g., `@acme.com`) can join the company workspace. Invitations to addresses outside these domains are blocked.

---

## What is in the audit log?

The audit log is a **tamper-evident cryptographic chain** of company and workspace events, including:
- Member invite / join / remove
- Role changes
- SSO configuration changes
- Policy changes
- Dangerous operations (rotate-key, remote-wipe, etc.)
- Backup / restore events
- API key creation / revocation

The audit log is accessible to `super-admin` and `auditor` roles. Each entry includes a cryptographic link to the previous entry, so any deletion or modification of log entries is detectable.

---

## How does SCIM group management work?

SCIM Groups in K-Perception map to **workspace groups** — membership bundles that carry a section key (SK_group ≡ SK_section). When the IdP pushes a SCIM group update:
- Group membership changes are reflected in workspace permission resolvers
- Users added to a group gain access to the group's sections
- Users removed from a group lose access (lazy revocation flag is set; full key rotation is required for immediate cryptographic revocation)

---

## Can I use K-Perception with Okta SCIM provisioning?

Yes. Configure the K-Perception SCIM 2.0 app in Okta by setting the SCIM base URL to your company's K-Perception SCIM endpoint and using the bearer token generated in the Company Admin Console. User provisioning, deprovisioning, and group push are all supported.

---

## What happens to encrypted data when a member is removed?

When a member is removed from a workspace:
1. Their session access is revoked immediately.
2. A lazy revocation flag is set on their section membership.
3. For cryptographic certainty that the removed member cannot access future content, a workspace **key rotation** (rotate-key dangerous operation) should be performed. This generates a new workspace key and re-encrypts all section keys for remaining members only.

---

## How do I set up SAML for the first time?

1. In the Company Admin Console, go to **Security → SSO / SAML**.
2. Copy the K-Perception ACS URL and Entity ID.
3. Create a SAML application in your IdP with the provided ACS URL and Entity ID.
4. Download the IdP metadata XML (or copy the certificate and SSO URL).
5. Paste the IdP metadata into K-Perception's SAML configuration.
6. Test the connection with a non-admin user first.

---

## Is there a per-company SCIM token management UI?

Yes. SCIM bearer tokens can be created, named, and revoked from **Company Admin Console → Security → SCIM Tokens**. Each token can be individually revoked without affecting other integrations.

---

## What is the SLA for Enterprise?

Enterprise customers receive a **99.9% uptime SLA** backed by the Cloudflare Worker and R2 infrastructure. Detailed SLA terms, including credit calculations for downtime, are in the Enterprise service agreement. Contact your K-Perception account manager or visit kperception.com for current details.

---

## Can Enterprise workspaces enforce TOTP for all members?

Yes, at two levels:

1. **Company policy (all members):** Enable "Require MFA" in Company Admin Console → Policies. This enforces TOTP enrollment for every member before they can access workspace content.
2. **Step-up for dangerous operations:** Regardless of the MFA policy, certain irreversible operations (rotate-key, remote-wipe, transfer-ownership, delete-workspace, restore-backup) always require a fresh TOTP step-up token from the performing admin. This applies even if the admin's session is fully authenticated.
