---
title: "Transfer workspace ownership"
slug: "transfer-ownership"
category: "Workspaces"
tags: ["ownership", "transfer", "admin", "workspace"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
  - "src/renderer/src/workspace/admin/DangerousOpModal.tsx"
related: ["workspaces/members-and-roles", "enterprise/elevation-tokens", "enterprise/dangerous-ops"]
---

# Transfer workspace ownership

## What it is

Ownership transfer moves the Owner role from the current owner to another existing Admin member. This is the only way to change who holds the Owner role. It requires TOTP step-up (elevation token) to prevent unauthorised or accidental ownership changes.

## When to use it

- A team lead is leaving the company and their successor needs full ownership.
- An organisation wants to reassign workspace ownership during a restructuring.
- Compliance audit requires a specific individual to hold ownership.

## Step by step

1. Admin console → **Crypto** tab (or **Settings** → **Danger zone**) → **Transfer ownership**.
2. The `DangerousOpModal` opens.
3. Enter your TOTP code to obtain an elevation token.
4. Select the target member from the dropdown (must be an existing Admin).
5. Type `CONFIRM` and click **Transfer**.
6. The Worker validates the elevation token, updates the role assignment in D1:
   - Target member's role → `owner`.
   - Current owner's role → `admin`.
   - WDK wrap: a new WDK wrap is created for the new owner (using their device key). The old owner retains their existing WDK wrap (they remain an Admin with workspace access).
7. Audit event: `workspace.ownership.transferred` with `{from_user_id, to_user_id}`.
8. Both parties receive a notification.

## Behaviour and edge cases

- **Target must be an existing Admin:** You cannot transfer ownership to a Member or Guest. Promote the target to Admin first.
- **Reversibility:** The new owner can transfer ownership back to the original owner (or to anyone else). Ownership transfer is always reversible by the current owner.
- **Current owner retains Admin access:** After transfer, the previous owner becomes an Admin. They retain cryptographic access to the workspace (their WDK wrap is not deleted).
- **Key rotation not required:** Ownership transfer does not change the WDK. If you want to ensure forward secrecy after an ownership change, trigger a key rotation separately.
- **Transfer during active backup/restore:** Not confirmed in current source — contact support for confirmation. No blocking check for in-progress backup/restore was found in the transfer-ownership route.
- **Company ownership:** Transferring workspace ownership within a company does not affect company-level ownership. Company ownership is managed separately.

## Platform differences

Ownership transfer is in the admin console — available on all platforms via `DangerousOpModal`.

## Plan availability

Ownership transfer requires Team or Enterprise.

## Permissions and roles

Only the current workspace Owner can initiate ownership transfer.

## Security implications

The elevation token requirement prevents session-hijacking attacks from triggering unauthorised ownership transfers. Even if an attacker obtains a valid admin session token, they cannot transfer ownership without also possessing the TOTP seed.

The new owner immediately gains Owner-level API access (all ownership-gated endpoints check the `owner` role in D1, which is updated atomically).

## Settings reference

There are no configurable settings for ownership transfer.

## Related articles

- [Members and roles](members-and-roles.md)
- [Elevation tokens](../enterprise/elevation-tokens.md)
- [Dangerous operations](../enterprise/dangerous-ops.md)

## Source references

- `private-sync-worker/src/workspaceEnterprise.ts` — ownership transfer endpoint
- `src/renderer/src/workspace/admin/DangerousOpModal.tsx` — TOTP step-up modal
