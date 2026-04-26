---
title: "Enterprise plan overview"
slug: "enterprise/overview"
category: "Enterprise"
tags: ["enterprise", "overview", "company", "compliance", "sso"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
  - "src/renderer/src/company/CompanyAdminShell.tsx"
related:
  - "enterprise/company-shell"
  - "enterprise/saml-okta"
  - "enterprise/scim-overview"
  - "enterprise/audit-log"
  - "enterprise/gdpr-deletion"
---

## What it is

The Enterprise plan is K-Perception's top-tier offering, designed for organisations that require centralised identity management, regulatory compliance, and administrative control across many teams and workspaces. It wraps all Personal and Team capabilities in a company-level shell that lets a single administrator govern dozens of workspaces, enforce security policies uniformly, and satisfy auditors with a tamper-evident event log.

Enterprise is billed at **€14.99 per user per month**, includes an SLA of **99.9% uptime**, and comes with a dedicated account manager. Healthcare and legal customers can request a Business Associate Agreement (BAA) under HIPAA and a Data Processing Agreement (DPA) under GDPR at no additional cost.

## When to use it

Enterprise is the right choice when any of the following apply:

- Your organisation uses a central identity provider (Okta, Azure AD / Entra ID, Google Workspace, OneLogin) and wants single sign-on with automatic user provisioning.
- You operate in a regulated industry (healthcare, legal, financial services, government) and need documented compliance artefacts.
- You manage more than one team workspace and want a unified admin surface — member management, billing, audit — rather than per-workspace configuration.
- Security policy requires multi-factor authentication for all staff, IP-based access restrictions, or mandatory key rotation schedules.
- You need immutable audit records of every administrative action and content operation.

## What Enterprise adds over Team

| Capability | Personal | Team | Enterprise |
|---|---|---|---|
| Workspaces | 1 | Unlimited | Unlimited under company umbrella |
| Users | 1 | Unlimited | Unlimited |
| Storage | Unlimited | Unlimited | Unlimited |
| SAML 2.0 SSO | No | No | Yes |
| SCIM 2.0 provisioning | No | No | Yes |
| OIDC SSO | No | No | Yes |
| Company admin panel | No | No | Yes (9 tabs) |
| IP allowlist | No | Workspace-level | Company + workspace |
| MFA enforcement | Personal only | Workspace | Company-wide |
| Email domain restriction | No | No | Yes |
| Tamper-evident audit log | No | Basic | Full, exportable |
| GDPR data deletion flow | Self-service | Self-service | Admin-initiated + certificate |
| Elevation tokens for dangerous ops | No | No | Yes |
| TOTP step-up matrix | No | No | Yes |
| Webhooks | No | Yes | Yes |
| Dedicated account manager | No | No | Yes |
| SLA | None | None | 99.9% |
| BAA / DPA | No | On request | Included |

## The company shell concept

When you activate Enterprise, K-Perception creates a **company** record that acts as an umbrella over your workspaces. The company has its own legal name, primary domain, optional secondary domains, and a per-company Audit Wrapping Key (AWK) — an encryption key that protects the contents of the audit event log so that only company super-admins can read audit body data.

Workspaces can be created directly inside the company, or existing standalone workspaces can be linked to the company (`POST /companies/:id/workspaces/:wsId/link`). Once linked, workspace membership is subject to company-level policies (MFA enforcement, IP allowlist, domain restriction).

A user's access within the company is governed by their **company role**, which is independent of their workspace role:

| Company role | Capabilities |
|---|---|
| `super-admin` | Full company administration. Can manage all workspaces, members, policies, billing, and audit. At least one super-admin must remain at all times. |
| `billing-admin` | Access to Billing tab. Cannot change security policy. |
| `auditor` | Read-only access to Audit and Compliance tabs. Cannot modify anything. |
| `observer` | Read-only access to company metadata. |

## The 9-tab company admin panel

The **CompanyAdminShell** provides a unified administration surface accessible at `/co/:companyId/admin`. It contains eight purpose-built tabs:

1. **Workspaces** — create, link, unlink, and browse all workspaces under the company.
2. **Members** — invite company members, change roles, remove members. Domain restriction and SCIM-provisioned users visible here.
3. **Policies** — company-wide policy settings: MFA enforcement, email domain restriction, session timeout, password policies.
4. **Security** — SSO configuration (SAML, OIDC), IP allowlist, SCIM token management, WebAuthn credentials.
5. **Audit** — filterable, exportable tamper-evident event log for every workspace and company action.
6. **Billing** — consolidated billing view, seat count, invoices, plan upgrade/downgrade.
7. **Password Resets** — super-admin issues one-time password reset tokens for members who are locked out.
8. **Compliance** — GDPR deletion requests, compliance report export, DPA download, data residency information.

Navigation is hash-driven so every tab has a shareable deep link (e.g. `/co/abc123/admin/security`).

## Compliance posture

K-Perception's enterprise architecture is designed around zero-knowledge encryption: the server never holds plaintext content. All workspace data is encrypted client-side before reaching Cloudflare's infrastructure. This means:

- A data breach of the K-Perception servers exposes only ciphertext.
- The audit log body is additionally encrypted under the company AWK; only super-admins can read audit details.
- GDPR deletion removes all R2 blobs, all D1 rows (in reverse dependency order), and revokes all session tokens.
- Elevation tokens ensure that destructive operations require physical possession of an authenticator device.

The compliance tab provides downloadable artefacts: JSON audit dumps, PDF compliance reports, and a link to the current DPA.

## Pricing

- **€14.99 per user per month**, billed monthly or annually (annual pricing available on request from your account manager).
- **Unlimited devices** per user.
- **Unlimited storage** (Cloudflare R2 — no egress fees).
- Seats are counted as the number of active company members; deactivated (SCIM-deprovisioned) users do not count.

## Who Enterprise is for

**Healthcare organisations** benefit from HIPAA BAA coverage, TOTP enforcement for all clinicians, audit logs for HIPAA access-event requirements, and GDPR erasure flows for patient data.

**Law firms** benefit from per-workspace key rotation on client matter closure, IP allowlists locking down access to office networks, and tamper-evident audit logs for privilege log production.

**Security-conscious enterprises** benefit from SAML/SCIM automated provisioning, zero-knowledge architecture (server-side compromise does not expose client data), elevation tokens preventing session-hijack exploitation of destructive operations, and TOTP step-up MFA for all admin actions.

**Multi-team organisations** benefit from the company umbrella removing the need to manage SSO and MFA separately per workspace.

## Plan availability

Enterprise plan activation is done by contacting your account manager or via the Billing tab in the app. Only `enterprise`-tier accounts may create a company (`POST /companies` is tier-gated server-side). Members added to the company gain enterprise capabilities regardless of their personal plan tier.

## Related articles

- [Company shell](enterprise/company-shell.md)
- [SAML SSO — Okta](enterprise/saml-okta.md)
- [SAML SSO — Azure AD](enterprise/saml-azure-ad.md)
- [SAML SSO — Google Workspace](enterprise/saml-google-workspace.md)
- [SAML SSO — OneLogin](enterprise/saml-onelogin.md)
- [SCIM overview](enterprise/scim-overview.md)
- [OIDC](enterprise/oidc.md)
- [IP allowlist](enterprise/ip-allowlist.md)
- [MFA enforcement](enterprise/mfa-enforcement.md)
- [Domain restriction](enterprise/domain-restriction.md)
- [Audit log](enterprise/audit-log.md)
- [Compliance tab](enterprise/compliance-tab.md)
- [Elevation tokens](enterprise/elevation-tokens.md)
- [Dangerous operations reference](enterprise/dangerous-ops.md)
- [Remote wipe](enterprise/remote-wipe.md)
- [Rotate key](enterprise/rotate-key.md)
- [GDPR deletion](enterprise/gdpr-deletion.md)

## Source references

- `private-sync-worker/src/company.ts` — company HTTP surface, audit chain, role gate
- `src/renderer/src/company/CompanyAdminShell.tsx` — 9-tab admin shell
- `private-sync-worker/migrations/0035_company_sso.sql` — SSO schema
- `private-sync-worker/migrations/0012_workspace_enterprise.sql` — enterprise workspace schema
