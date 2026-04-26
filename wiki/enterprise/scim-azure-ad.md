---
title: "SCIM Provisioning with Azure AD (Entra ID)"
slug: "scim-azure-ad"
category: "Enterprise"
tags: ["scim", "azure-ad", "entra-id", "provisioning", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
related: ["enterprise/scim-overview", "enterprise/scim-okta", "enterprise/scim-groups", "enterprise/saml-azure-ad", "enterprise/overview"]
---

# SCIM Provisioning with Azure AD (Entra ID)

## What it is

This article describes how to configure Microsoft Azure Active Directory (Entra ID) to automatically provision and deprovision K-Perception workspace members using SCIM 2.0. After setup, users assigned to the K-Perception enterprise application in Azure AD are pushed into the workspace; removing or disabling them in Azure AD revokes their workspace membership and sessions immediately.

## Before you begin

You need:
- Azure AD Global Administrator or Application Administrator role.
- The K-Perception enterprise application already created in Azure AD (see [SAML SSO with Azure AD](saml-azure-ad.md)).
- K-Perception workspace owner or admin access.
- SCIM enabled on the target workspace (see [SCIM overview](scim-overview.md)).

## Step by step

### Step 1 — Enable SCIM on the K-Perception workspace

1. Open K-Perception → **Workspace admin** → **Security** → **SCIM provisioning**.
2. Toggle **Enable SCIM provisioning** to on.
3. Click **Generate new SCIM token**.
4. Copy the token immediately — it is shown only once.
5. Note your workspace ID from the URL or workspace settings.

### Step 2 — Open provisioning in Azure AD

6. In the [Azure portal](https://portal.azure.com), navigate to **Azure Active Directory** → **Enterprise applications** → open your K-Perception application.
7. Click **Provisioning** in the left sidebar.
8. Set **Provisioning Mode** to **Automatic**.

### Step 3 — Configure the admin credentials

9. Under **Admin Credentials**, enter:
   - **Tenant URL:** `https://api.kperception.app/workspaces/{workspaceId}/scim/v2/`
   - **Secret Token:** paste your SCIM token.
10. Click **Test Connection**. Azure will issue a `GET /Users` request. A "Testing connection to..." success message confirms it is working.
11. Click **Save**.

### Step 4 — Configure attribute mappings

12. Under **Mappings**, click **Provision Azure Active Directory Users**.
13. Verify that the following source attributes map correctly:
    - `userPrincipalName` → `userName`
    - `Switch([IsSoftDeleted], , "False", "True", "True", "False")` → `active`
    - `displayName` → `displayName`
    - `mail` → `emails[type eq "work"].value`
14. Remove any attribute mappings that K-Perception does not support.
15. Click **Save**.

### Step 5 — Configure scope

16. Under **Settings**, set **Scope** to either:
    - **Sync only assigned users and groups** — recommended. Only users assigned to the application are provisioned.
    - **Sync all users and groups** — provisions all directory users. Not recommended for large tenants.
17. Click **Save**.

### Step 6 — Assign users and groups

18. Go to the **Users and groups** tab of the enterprise application.
19. Click **Add user/group** and select the users or security groups to provision.
20. Click **Assign**.

### Step 7 — Start provisioning

21. Return to the **Provisioning** tab.
22. Click **Start provisioning**.
23. Azure AD begins an initial sync cycle (this can take 20–40 minutes for large directories).

### Step 8 — Verify

24. In K-Perception, go to **Workspace admin** → **Members**.
25. Provisioned users should appear with role `viewer`.
26. In Azure AD, check **Provisioning logs** for success or error records.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| User assigned in Azure AD | User provisioned to K-Perception as `viewer` (if account exists) |
| User unassigned in Azure AD | Workspace membership revoked; sessions terminated |
| User account disabled in Azure AD | User deprovisioned; sessions terminated |
| User account re-enabled in Azure AD | User re-provisioned on next sync cycle |
| User does not have a K-Perception account | SCIM mapping created but not linked |
| Group push | Groups created in K-Perception — see [SCIM groups](scim-groups.md) |
| Initial sync cycle slow | Expected for large directories — incremental sync is faster |

## Platform differences

SCIM is a server-side protocol. No platform-specific behaviour is required.

## Plan availability

SCIM provisioning requires the **Enterprise** plan. Azure AD SCIM provisioning requires an Azure AD P1 or P2 licence (included in Microsoft Entra ID P1/P2 and Microsoft 365 E3/E5).

## Permissions and roles

- Only workspace owners and admins can enable SCIM and generate tokens.
- SCIM-provisioned users receive the `viewer` role by default.
- Workspace roles in K-Perception: `owner | admin | editor | commenter | viewer | guest`.

## Security implications

- SCIM tokens are stored as SHA-256 hashes only. Rotate the token if it is ever exposed.
- Deprovisioning via SCIM revokes all active sessions immediately.
- Azure AD incremental sync cycles run approximately every 40 minutes by default. For immediate deprovisioning, trigger a manual sync or use Azure AD access reviews.
- SCIM does not re-encrypt E2EE content — removing a user via SCIM revokes their membership but does not rotate keys.

## Settings reference

| Setting | Value |
|---|---|
| Tenant URL | `https://api.kperception.app/workspaces/{workspaceId}/scim/v2/` |
| Authentication | Secret token (`Authorization: Bearer <token>`) |
| Provisioning mode | Automatic |
| Supported provisioning actions | Create, update, disable/delete users; push groups |
| Unique user identifier | `userPrincipalName` / `userName` |

## Related articles

- [SCIM provisioning overview](scim-overview.md)
- [SCIM with Okta](scim-okta.md)
- [SCIM Group sync](scim-groups.md)
- [SAML SSO with Azure AD](saml-azure-ad.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/workspaceEnterprise.ts` — `handleScim` function
