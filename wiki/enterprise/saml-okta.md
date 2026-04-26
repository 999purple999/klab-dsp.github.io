---
title: "SAML 2.0 SSO with Okta"
slug: "saml-okta"
category: "Enterprise"
tags: ["saml", "okta", "sso", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
  - "private-sync-worker/migrations/0035_company_sso.sql"
  - "private-sync-worker/migrations/0036_company_sso_cert.sql"
related: ["enterprise/scim-okta", "enterprise/overview", "enterprise/saml-azure-ad"]
---

# SAML 2.0 SSO with Okta

## What it is

This article walks you through connecting Okta as a SAML 2.0 Identity Provider (IdP) for K-Perception. After completing this setup, members of your Okta organisation can log into K-Perception workspaces using their Okta credentials.

## Before you begin

You need:
- Okta admin access (Application admin or Super admin).
- K-Perception company admin access.
- Your K-Perception company ID (visible in Company admin → Settings).

## Required attribute mappings

| Okta claim (attribute) | K-Perception field | Notes |
|---|---|---|
| NameID (email format) | `user.email` | Primary identifier — must be email |
| `email` | `user.email` | Used as fallback |
| `firstName` | `user.display_name` (first) | |
| `lastName` | `user.display_name` (last) | |
| `groups` | `workspace_groups[]` | For SCIM group sync (optional) |

## Step by step

### Step 1 — Create the application in Okta

1. Log into your Okta Admin Console.
2. Navigate to **Applications** → **Applications** → **Create App Integration**.
3. Select **SAML 2.0** → click **Next**.
4. Give it a name: "K-Perception" → click **Next**.

### Step 2 — Configure SAML settings

5. In the **SAML Settings** section:
   - **Single sign-on URL (ACS URL):** `https://api.kperception.app/company/{companyId}/saml/acs`
   - **Audience URI (SP Entity ID):** `https://api.kperception.app/company/{companyId}`
   - **Default RelayState:** leave empty.
   - **Name ID format:** `EmailAddress`
   - **Application username:** `Email`

6. Under **Attribute Statements**, add:
   - `email` → `user.email`
   - `firstName` → `user.firstName`
   - `lastName` → `user.lastName`

7. (Optional) Under **Group Attribute Statements**:
   - Name: `groups`
   - Filter: Matches regex `.*` (or filter to specific groups)

8. Click **Next** → select "I'm an Okta customer adding an internal app" → **Finish**.

### Step 3 — Download the Okta certificate

9. In the application's **Sign On** tab → **SAML Signing Certificates** → download the active certificate (`.pem` format).

10. Note the **SAML 2.0 Endpoint (HTTP)** URL (e.g. `https://your-org.okta.com/app/kperception/.../sso/saml`).

### Step 4 — Configure K-Perception

11. Open K-Perception → Company admin → **Security** tab → **SSO** → **Configure SAML**.
12. Upload the downloaded Okta certificate.
13. Enter the **IdP SSO URL** (the SAML 2.0 Endpoint from step 10).
14. Enter the **IdP Entity ID** (e.g. `http://www.okta.com/{yourOktaId}`).
15. Click **Save**.

### Step 5 — Assign users in Okta

16. In Okta, go to the K-Perception application → **Assignments** tab.
17. Assign individuals or groups who should have access to K-Perception via SSO.

### Step 6 — Test the connection

18. In K-Perception → Company admin → SSO → click **Test SAML login**.
19. You are redirected to Okta. Log in with an assigned user's credentials.
20. You should be redirected back to K-Perception and logged in.

## Failure modes and recovery

| Symptom | Likely cause | Fix |
|---|---|---|
| "SAML certificate invalid" | Certificate mismatch | Re-download cert from Okta, re-upload |
| "Clock skew too large" | Device time drift > 5 minutes | Sync Okta and K-Perception server clocks |
| "NameID format mismatch" | Okta sending persistent ID instead of email | Set Name ID format to EmailAddress in Okta |
| "ACS URL rejected" | ACS URL typo in Okta | Verify exact URL including companyId |
| Members can't log in | Not assigned in Okta | Assign users/groups in Okta application |

## Audit events emitted

| Event | Trigger |
|---|---|
| `saml.login.succeeded` | Successful SAML-based login |
| `saml.login.failed` | Failed SAML assertion (invalid cert, clock skew, etc.) |
| `saml.certificate.uploaded` | Admin uploaded a new IdP certificate |
| `sso.configured` | SSO settings saved |

## Platform differences

SAML login redirects work identically on all platforms. The ACS endpoint is a Worker URL — platform-agnostic.

## Plan availability

SAML SSO requires Enterprise plan.

## Related articles

- [SCIM provisioning with Okta](scim-okta.md)
- [SAML with Azure AD](saml-azure-ad.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/company.ts` — SAML ACS handler
- `private-sync-worker/migrations/0035_company_sso.sql` — SSO configuration schema
- `private-sync-worker/migrations/0036_company_sso_cert.sql` — certificate storage schema
