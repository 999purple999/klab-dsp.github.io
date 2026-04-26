---
title: "Email domain restriction"
slug: "domain-restriction"
category: "Enterprise"
tags: ["domain", "restriction", "email", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
related: ["enterprise/overview", "enterprise/company-shell", "workspaces/invitations"]
---

# Email domain restriction

## What it is

Email domain restriction limits which email addresses can be invited to join a company's workspaces. When enabled, only email addresses matching one of the allowed domains can be invited or allowed to self-join.

## When to use it

- Prevent employees from accidentally inviting personal accounts to sensitive workspaces.
- Ensure only verified corporate email addresses are workspace members.
- Meet compliance requirements that mandate organisational identity verification.

## Step by step

1. Company admin → **Policies** tab → **Allowed email domains**.
2. Click **Add domain** → enter the domain (e.g. `company.com`).
3. Repeat for additional domains (e.g. `subsidiary.com`).
4. Click **Save**. The restriction is active immediately.
5. Audit event: `domain_restriction.updated` with the new domain list.

### What happens when restriction is active

- Inviting `user@company.com` → allowed.
- Inviting `user@gmail.com` → rejected with error `DOMAIN_NOT_ALLOWED`.
- An invite link join by `user@gmail.com` → rejected at join time.
- SCIM-provisioned users (from IdP) → bypass domain check. The Worker's domain restriction logic only runs on the `routeAddMember` path, which uses `getLocalCredentialsByUserId` to find the email. SCIM user creation goes through a separate code path in `workspaceEnterprise.ts` that does not enforce this gate.
- SAML users → bypass domain check. The company-shell documentation explicitly states that "SAML- and SCIM-provisioned users are not checked against the domain restriction because the IdP is considered trusted."

### Removing a domain

1. Company admin → Policies → Allowed email domains → click the domain → **Remove**.
2. Existing members with that domain are NOT removed — they retain their membership.
3. Future invitations to that domain are blocked.

## Behaviour and edge cases

- **Multiple domains:** The database schema imposes no hard limit on domain entries. The `allowedDomains` field is a plain JSON string array with no enforced cap in the source code. Contact support for confirmation of any UI-level cap.
- **Subdomains:** Each subdomain is a separate entry. The policy check does a simple `includes(domain)` exact-match on the domain portion of the email — `company.com` does NOT match `sub.company.com` automatically.
- **Wildcard domains:** Wildcard patterns (e.g. `*.company.com`) are not supported; only exact domain strings are matched.
- **Existing members:** Enabling the restriction does not remove existing members whose email domains are not in the allowed list.
- **Audit trail:** Every change to the domain restriction list is logged in the company audit log.

## Platform differences

Domain restriction management is in the company admin panel, available on all platforms.

## Plan availability

Email domain restriction requires Enterprise plan.

## Permissions and roles

Only company admins can configure domain restrictions.

## Security implications

Domain restriction prevents external email addresses from being invited but does not prevent an existing member from sharing files externally via share links (which are not email-based). Use IP allowlist and per-file ACL for stronger access control.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Allowed email domains | Empty (no restriction) | Company admin → Policies |

## Related articles

- [Enterprise overview](overview.md)
- [Company shell](company-shell.md)
- [Invitations](../workspaces/invitations.md)

## Source references

- `private-sync-worker/src/company.ts` — domain restriction policy
