---
title: "MFA enforcement"
slug: "mfa-enforcement"
category: "Enterprise"
tags: ["mfa", "totp", "2fa", "enforcement", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
  - "private-sync-worker/src/workspaceEnterprise.ts"
related: ["enterprise/overview", "authentication/totp-2fa", "enterprise/elevation-tokens"]
---

# MFA enforcement

## What it is

MFA enforcement requires all members of a company to have TOTP 2-factor authentication enabled. When a company admin enables enforcement, any member who does not yet have TOTP configured is redirected to the TOTP setup screen on their next login and cannot access the workspace until setup is complete.

## When to use it

- Your security policy mandates MFA for all employees.
- You want to reduce the risk of compromised passwords leading to workspace data access.
- A compliance framework (HIPAA, SOC 2) requires 2FA for sensitive data access.

## Step by step

### Enabling enforcement

1. Company admin → **Policies** tab → **Security policies**.
2. Toggle "Require MFA for all members" to **Enabled**.
3. Confirm. The policy is stored in D1 and takes effect immediately.
4. Audit event: `mfa.enforcement.enabled`.

### What happens to members who have not set up TOTP

1. On the member's next login, after successful password / OAuth authentication, the Worker checks if the company policy requires MFA.
2. If the member does not have an active TOTP credential: they are redirected to the TOTP setup screen.
3. The member must scan the QR code and confirm the setup with a valid TOTP code.
4. After setup, their session proceeds normally.
5. They cannot access the workspace until TOTP setup is complete (access is blocked by the Worker, not just the UI).

### Disabling enforcement

1. Company admin → Policies → toggle "Require MFA" to **Disabled**.
2. Existing TOTP credentials are not removed. Members retain TOTP if they already have it; they are no longer forced to use it.

## Behaviour and edge cases

- **Admin exemptions:** No exemptions. The `enforceForAll` flag in `CompanyMfaPolicy` applies uniformly to all members. The separate `enforceForAdmins` flag (default `true`) independently requires admins to enrol even if `enforceForAll` is off.
- **Grace period:** No grace period. The Worker enforces the policy on every non-GET write request immediately once the flag is enabled.
- **SAML users:** The Worker's MFA gate checks TOTP enrollment in the `workspace_user_totp` table regardless of SSO login method. Whether SAML-authenticated users can bypass this check depends on your IdP's MFA policy — review your IdP configuration in conjunction with this setting. Contact support for confirmation of current enforcement behaviour for SSO users.
- **Recovery codes:** Members who lose their TOTP device can use a PBKDF2-derived recovery code to bypass TOTP (see [Account recovery](../authentication/account-recovery.md)). Recovery code use is logged.
- **Step-up vs enforcement:** MFA enforcement at login is separate from TOTP step-up for dangerous operations. Step-up is always required for dangerous ops regardless of enforcement setting.

## Platform differences

MFA enforcement affects all platforms equally — the Worker enforces the policy server-side regardless of the client.

## Plan availability

MFA enforcement requires Enterprise plan.

## Permissions and roles

Only company admins can enable or disable MFA enforcement.

## Security implications

Server-side enforcement prevents bypass via API manipulation — the Worker always checks the enforcement flag before issuing session tokens. Enabling MFA enforcement significantly reduces the risk of password-only compromise leading to workspace access.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Require MFA for all members | Disabled | Company admin → Policies |

## Related articles

- [TOTP 2FA](../authentication/totp-2fa.md)
- [Elevation tokens](elevation-tokens.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/company.ts` — MFA enforcement policy storage + check
- `private-sync-worker/src/workspaceEnterprise.ts` — login flow MFA gate
