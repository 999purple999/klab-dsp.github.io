---
title: "Company shell"
slug: "enterprise/company-shell"
category: "Enterprise"
tags: ["enterprise", "company", "admin", "workspaces", "multi-workspace"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
  - "src/renderer/src/company/CompanyAdminShell.tsx"
related:
  - "enterprise/overview"
  - "enterprise/mfa-enforcement"
  - "enterprise/domain-restriction"
  - "enterprise/ip-allowlist"
  - "enterprise/audit-log"
---

## What it is

The company shell is the organisational umbrella that sits above individual workspaces in K-Perception's enterprise tier. A **company** is a first-class entity with its own ID, legal name, primary email domain, optional secondary domains, billing contact, and a per-company Audit Wrapping Key (AWK). It groups any number of workspaces under a single administrative surface with unified policies, billing, and a cross-workspace tamper-evident audit log.

The company shell manifests in the desktop and web app as the **CompanyShell**, accessible at `/co/:companyId`. Company admins are routed to the **CompanyAdminShell** at `/co/:companyId/admin`, a tabbed panel with eight administration sections.

## When to use it

You need the company shell when:

- Multiple workspaces belong to the same organisation and should share identity, policies, and billing.
- You want a single SSO configuration to apply across all workspaces.
- Security policy (MFA enforcement, IP allowlist, domain restriction) must apply uniformly, regardless of which workspace a user opens.
- Consolidated billing is required (one invoice, one seat count for the whole organisation).
- Cross-workspace audit is needed (one audit feed showing events from all linked workspaces).

## Creating a company

Only users on the enterprise tier may create a company. The server enforces this with a tier gate on `POST /companies`.

**Steps:**

1. Open the app. If you have not already upgraded to Enterprise, navigate to **Settings → Billing → Upgrade to Enterprise**.
2. After upgrade, select **Create Company** from the app home or via the top navigation.
3. Enter the **Legal name** (shown in the admin panel header and invoices).
4. Enter the **Primary domain** (e.g. `company.com`). This is used for domain restriction if enabled.
5. Optionally add **Secondary domains** (comma-separated; e.g. `company.io,subsidiary.com`).
6. Select or create the **first workspace** to link. You can create a new workspace or link an existing standalone workspace.
7. Confirm. The server creates the company record, issues the AWK, and makes you the first `super-admin`.

The company ID is a UUID assigned by the server. It appears in all URLs and API paths.

## The 9-tab CompanyAdminShell

Navigate to `/co/:companyId/admin` or click **Admin** from the company home to open the admin shell. The tab bar contains:

| Tab ID | URL path | Purpose |
|---|---|---|
| Workspaces | `/admin/workspaces` | Create, link, unlink workspaces. View workspace member counts and status. |
| Members | `/admin/members` | Invite company members, assign roles, remove members, view SCIM-provisioned users. |
| Policies | `/admin/policies` | MFA enforcement, email domain restriction, session timeout, password policy. |
| Security | `/admin/security` | SSO (SAML/OIDC), IP allowlist, SCIM tokens, WebAuthn credentials. |
| Audit | `/admin/audit` | Cross-workspace tamper-evident audit log with date, actor, and action filters. Export to JSON or CSV. |
| Billing | `/admin/billing` | Consolidated invoice view, active seat count, plan management. |
| Password Resets | `/admin/password-resets` | Super-admin issues one-time reset tokens for locked-out members. |
| Compliance | `/admin/compliance` | GDPR deletion requests, compliance report, DPA download, data residency information. |

Tab navigation is hash-driven. Each tab URL is a permanent deep link that can be shared with other admins.

## Company roles

Every company member has a company-level role that is separate from any workspace role they hold:

| Role | Description |
|---|---|
| `super-admin` | Full control. Can manage all tabs. At least one super-admin must remain; the server blocks removal of the last super-admin with `409 last_super_admin`. |
| `billing-admin` | Access to Billing tab only. Cannot modify security policy or workspace membership. |
| `auditor` | Read-only access to Audit and Compliance tabs. Cannot modify anything. |
| `observer` | Read-only access to company metadata (name, domain, status). |

Workspace-level roles (owner, admin, editor, commenter, viewer, guest) are independent and continue to apply within each workspace. A company `auditor` who is not a workspace member cannot read workspace content.

## Company-level vs workspace-level settings

Certain settings exist at both levels. The company-level setting takes precedence:

| Setting | Company-level | Workspace-level | Precedence |
|---|---|---|---|
| IP allowlist | Yes | Yes | Company-level applied first; workspace adds further restrictions |
| MFA enforcement | Yes | Yes | Company-level enforce means all workspaces enforce |
| Domain restriction | Yes | No | Company-level only |
| SSO (SAML/OIDC) | Yes | No | Company-level only |
| SCIM provisioning | Yes | No | Company-level only |
| Audit log | Cross-workspace | Per-workspace | Both; admin console shows aggregate |
| Webhook | No | Yes | Workspace-level only |

## Inviting users at the company level

Company-level invites add a user as a company member with the specified role. They do **not** automatically grant access to any workspace — workspace membership must be granted separately (or via SCIM group sync).

To invite a company member:

1. Navigate to **Admin → Members → Invite**.
2. Enter the user's email address and select a company role.
3. If domain restriction is enabled, the email must match an allowed domain or the invite is rejected server-side with `DOMAIN_NOT_ALLOWED`.
4. The invited user receives an email with a join link.

Workspace-level invites grant access to a single workspace without making the user a company member. For most enterprises the recommended flow is:

1. Provision users via SCIM (automated, tied to IdP lifecycle).
2. Grant workspace access via SCIM group → K-Perception group → section key.

## Company membership gate

When **domain restriction** is enabled (Policies tab), the company enforces that all members have an email address whose domain appears in the allowed domain list. This gate applies to:

- Manual invites via the Members tab.
- Workspace-level invites to any workspace linked to the company.

SAML- and SCIM-provisioned users are not checked against the domain restriction because the IdP is considered trusted (the IdP admin already controls which users can authenticate). See [Domain restriction](enterprise/domain-restriction.md) for full details.

## Linking and unlinking workspaces

**Link an existing workspace:**

```
POST /companies/:companyId/workspaces/:wsId/link
```

Requires `super-admin` company role and `owner` workspace role. Once linked, the workspace is subject to company policies. Billing is consolidated under the company.

**Unlink a workspace:**

```
DELETE /companies/:companyId/workspaces/:wsId
```

Removes the workspace from the company umbrella. Company-level policies (MFA, IP allowlist, SSO) no longer apply. The workspace continues to exist with its own settings. Billing reverts to the workspace owner's personal plan.

**Moving a workspace between companies** is not a single atomic operation. The supported approach is to unlink from company A (DELETE `/companies/:idA/workspaces/:wsId`) and then link to company B (POST `/companies/:idB/workspaces/:wsId/link`), provided you hold `super-admin` role on both companies and `owner` role on the workspace. The two-step flow is intentional — the server blocks linking an already-linked workspace with a `409 conflict` error.

## Behaviour and edge cases

- **Last super-admin protection.** The server blocks `DELETE /companies/:id/members/:userId` and `PUT /companies/:id/members/:userId` (role downgrade) when doing so would leave zero super-admins. Error: `409 last_super_admin`.
- **Soft removal.** Removing a company member sets `removed_at` in `company_members` rather than deleting the row, preserving the audit history of their membership.
- **Company creation tier gate.** `POST /companies` returns `403 forbidden` if the requesting user's entitlement is not `enterprise`. Existing company members retain access regardless of their personal plan tier.
- **AWK generation.** The per-company Audit Wrapping Key is generated on company creation and wrapped for the creating super-admin. Adding subsequent super-admins requires wrapping the AWK for them. This wrapping happens client-side; the server stores only the wrapped copy.

## Platform differences

The company shell is fully available on **desktop (Windows/macOS)** and **web**. Mobile (Android) shows workspace content but does not currently expose the company admin panel. Company members on mobile can authenticate via SSO and access workspace content subject to the same policy enforcement as desktop.

## Plan availability

The company shell is available exclusively on the **Enterprise plan**. Creating a company requires an enterprise-tier account. Workspace members access company-governed workspaces on any plan tier.

## Security implications

- The AWK is held only by super-admins. If all super-admins are removed, audit event bodies become permanently unreadable. Always maintain at least two super-admins.
- Company creation should be restricted to a dedicated service account or a small set of trusted individuals.
- The company ID appears in all API paths. It is not secret, but company routes require valid session authentication.

## Related articles

- [Enterprise overview](enterprise/overview.md)
- [MFA enforcement](enterprise/mfa-enforcement.md)
- [Domain restriction](enterprise/domain-restriction.md)
- [IP allowlist](enterprise/ip-allowlist.md)
- [SAML SSO — Okta](enterprise/saml-okta.md)
- [SCIM overview](enterprise/scim-overview.md)
- [Audit log](enterprise/audit-log.md)
- [Compliance tab](enterprise/compliance-tab.md)

## Source references

- `private-sync-worker/src/company.ts` — full company HTTP surface, role gates, audit chain
- `src/renderer/src/company/CompanyAdminShell.tsx` — 9-tab admin shell routing
- `src/renderer/src/company/CompanyMembersAdmin.tsx` — members tab
- `src/renderer/src/company/CompanyPoliciesAdmin.tsx` — policies tab
- `src/renderer/src/company/CompanySecurityAdmin.tsx` — security tab
