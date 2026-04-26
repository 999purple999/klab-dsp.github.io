---
title: "SCIM Provisioning with Okta"
slug: "scim-okta"
category: "Enterprise"
tags: ["scim", "okta", "provisioning", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
related: ["enterprise/scim-overview", "enterprise/scim-azure-ad", "enterprise/scim-groups", "enterprise/saml-okta", "enterprise/overview"]
---

# SCIM Provisioning with Okta

## What it is

This article describes how to configure Okta to automatically provision and deprovision K-Perception workspace members using SCIM 2.0. After setup, users assigned to the K-Perception application in Okta are pushed into the workspace; deassigning or deactivating them in Okta revokes their workspace membership and sessions immediately.

## Before you begin

You need:
- Okta admin access with the ability to configure application provisioning.
- The K-Perception application already created in Okta (see [SAML SSO with Okta](saml-okta.md) for how to create the app; SCIM can be added to the same application).
- K-Perception workspace owner or admin access.
- SCIM enabled on the target workspace (see [SCIM overview](scim-overview.md)).

## Step by step

### Step 1 — Enable SCIM on the K-Perception workspace

1. Open K-Perception → **Workspace admin** → **Security** → **SCIM provisioning**.
2. Toggle **Enable SCIM provisioning** to on.
3. Click **Generate new SCIM token**.
4. Copy the token immediately — it is shown only once.
5. Note your workspace ID from the URL or workspace settings.

### Step 2 — Enable provisioning in Okta

6. In the Okta Admin Console, navigate to **Applications** → **Applications** → open your K-Perception application.
7. Click the **Provisioning** tab → **Configure API Integration**.
8. Check **Enable API integration**.
9. Enter:
   - **SCIM connector base URL:** `https://api.kperception.app/workspaces/{workspaceId}/scim/v2/`
   - **Unique identifier field for users:** `userName`
   - **Authentication mode:** `HTTP Header`
   - **Authorization:** `Bearer <paste your SCIM token here>`
10. Click **Test API credentials** — Okta will perform a `GET /Users` request. If it returns successfully, the connection is working.
11. Click **Save**.

### Step 3 — Configure provisioning actions

12. Still on the **Provisioning** tab, click **To App** on the left.
13. Enable the following:
    - **Create Users** — checked
    - **Update User Attributes** — checked
    - **Deactivate Users** — checked
14. Click **Save**.

### Step 4 — Configure attribute mappings

15. Click **Edit** next to **Attribute Mappings**.
16. Verify that the `userName` attribute maps to the Okta user's email (`user.email` or `appuser.email`).
17. Map any additional attributes as needed (e.g. `displayName`).
18. Click **Save**.

### Step 5 — Assign users

19. Go to the **Assignments** tab of the K-Perception application.
20. Click **Assign** → **Assign to People** or **Assign to Groups**.
21. Select the users or groups to provision and click **Assign**.
22. Okta will immediately push those users to K-Perception via SCIM.

### Step 6 — Verify

23. In K-Perception, go to **Workspace admin** → **Members**.
24. The provisioned users should appear with role `viewer`.
25. In Okta, the user status should show as **Active** and **Pushed**.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| User assigned in Okta | User added to K-Perception workspace as `viewer` (if account exists) |
| User deassigned in Okta | Workspace membership revoked; all sessions terminated |
| User deactivated in Okta | Workspace membership revoked; all sessions terminated |
| User reactivated in Okta | User re-provisioned as new SCIM mapping; membership re-created |
| User already exists in K-Perception | SCIM mapping linked; membership upserted (idempotent) |
| User does not have a K-Perception account | SCIM mapping created but not linked until account exists |
| Group push via Okta | Groups created in K-Perception workspace — see [SCIM groups](scim-groups.md) |

## Platform differences

SCIM is a server-side protocol. No platform-specific client behaviour is required.

## Plan availability

SCIM provisioning requires the **Enterprise** plan. The Okta SCIM integration also requires an Okta plan that supports SCIM (Okta SSO, or higher).

## Permissions and roles

- Only workspace owners and admins can enable SCIM and generate tokens.
- SCIM-provisioned users receive the `viewer` role by default.
- Workspace roles in K-Perception: `owner | admin | editor | commenter | viewer | guest`.

## Security implications

- SCIM tokens are stored as SHA-256 hashes only. Rotate the token immediately if it is compromised.
- Deprovisioning via SCIM revokes all active sessions — the user is logged out on all devices within seconds.
- Do not share the SCIM bearer token. If it is exposed, revoke it in **Workspace admin** → **Security** → **SCIM tokens** and generate a new one.
- SCIM does not re-wrap E2EE keys. Removing a user via SCIM revokes membership but does not re-encrypt content they previously had access to.

## Settings reference

| Setting | Value |
|---|---|
| SCIM connector base URL | `https://api.kperception.app/workspaces/{workspaceId}/scim/v2/` |
| Authentication mode | HTTP Header — `Authorization: Bearer <token>` |
| Unique identifier field | `userName` |
| Supported provisioning actions | Create, update, deactivate users; push groups |
| Unique user identifier | User email address |

## Related articles

- [SCIM provisioning overview](scim-overview.md)
- [SCIM with Azure AD](scim-azure-ad.md)
- [SCIM Group sync](scim-groups.md)
- [SAML SSO with Okta](saml-okta.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/workspaceEnterprise.ts` — `handleScim` function
