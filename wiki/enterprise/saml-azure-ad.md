---
title: "SAML 2.0 SSO with Azure AD (Entra ID)"
slug: "saml-azure-ad"
category: "Enterprise"
tags: ["saml", "azure-ad", "entra-id", "sso", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/companySso.ts"
  - "private-sync-worker/migrations/0035_company_sso.sql"
  - "private-sync-worker/migrations/0036_company_sso_cert.sql"
related: ["enterprise/scim-azure-ad", "enterprise/saml-okta", "enterprise/saml-google-workspace", "enterprise/oidc", "enterprise/overview"]
---

# SAML 2.0 SSO with Azure AD (Entra ID)

## What it is

This article walks you through connecting Microsoft Azure Active Directory (now called Microsoft Entra ID) as a SAML 2.0 Identity Provider for K-Perception. After completing this setup, members of your Azure AD tenant can log into K-Perception using their Microsoft credentials.

The ACS endpoint receives a base64-encoded `SAMLResponse` POST from Azure AD. K-Perception validates the assertion signature against the uploaded X.509 certificate, enforces a 300-second clock-skew window, and either looks up or JIT-provisions the user before issuing a session.

## Before you begin

You need:
- Azure AD Global Administrator or Application Administrator role.
- K-Perception company super-admin access.
- Your K-Perception company ID (visible in **Company admin** → **Settings**).

## Required attribute mappings

Azure AD uses different claim names from Okta. Map the following in the Azure portal:

| Azure AD claim | K-Perception field | Notes |
|---|---|---|
| NameID (email format) | Email — primary identifier | Set Name ID format to `emailAddress` |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname` | First name | Optional display name |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname` | Last name | Optional display name |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` | Email fallback | |
| `http://schemas.microsoft.com/ws/2008/06/identity/claims/groups` | Group membership | For SCIM group sync (optional) |

## Step by step

### Step 1 — Create an Enterprise Application in Azure

1. Sign in to the [Azure portal](https://portal.azure.com) and navigate to **Azure Active Directory** (or **Microsoft Entra ID**) → **Enterprise applications** → **New application**.
2. Click **Create your own application**.
3. Name it "K-Perception" and select **Integrate any other application you don't find in the gallery (Non-gallery)** → **Create**.

### Step 2 — Configure SAML single sign-on

4. In the application overview, click **Set up single sign on** → **SAML**.
5. In **Basic SAML Configuration**, click **Edit** and enter:
   - **Identifier (Entity ID):** `https://api.kperception.app/company/{companyId}`
   - **Reply URL (Assertion Consumer Service URL):** `https://api.kperception.app/company/{companyId}/saml/acs`
   - **Sign on URL:** leave blank (IdP-initiated flow is used).
   - **Relay State:** leave blank.
   - **Logout URL:** leave blank.
6. Click **Save**.

### Step 3 — Configure user attributes and claims

7. Under **Attributes & Claims**, click **Edit**.
8. The default **Unique User Identifier (Name ID)** should be `user.userprincipalname`. Change the source attribute to `user.mail` and set the Name identifier format to **Email address**.
9. Verify or add the following additional claims:
   - `givenname` → `user.givenname`
   - `surname` → `user.surname`
   - `emailaddress` → `user.mail`
10. Click **Save**.

### Step 4 — Download the Azure AD certificate

11. Under **SAML Signing Certificate**, find the active certificate row.
12. Click **Download** next to **Certificate (Base64)** to download the `.cer` file.
13. Note the **Login URL** shown under **Set up K-Perception** (e.g. `https://login.microsoftonline.com/{tenantId}/saml2`).
14. Note the **Azure AD Identifier** (Entity ID, e.g. `https://sts.windows.net/{tenantId}/`).

### Step 5 — Configure K-Perception

15. Open K-Perception → **Company admin** → **Security** tab → **SSO** → **Configure SAML**.
16. Set **Provider** to `saml`.
17. Enter the **IdP Entity URL** (the Azure AD Identifier from step 14).
18. Paste the downloaded certificate content into the **X.509 Certificate** field.
19. Optionally set **Domain restriction** to your tenant's verified domain (e.g. `contoso.com`) to ensure only addresses from that domain are accepted.
20. Set **Default role** for JIT-provisioned users (default: `observer`).
21. Click **Save**.

### Step 6 — Assign users in Azure AD

22. In the Azure portal, go to the K-Perception enterprise application → **Users and groups** → **Add user/group**.
23. Assign the users or security groups who should be able to log into K-Perception.

### Step 7 — Test the connection

24. In K-Perception → **Company admin** → **SSO** → click **Test SAML login**.
25. You are redirected to Microsoft. Log in with an assigned user's credentials.
26. On success, you are redirected back to K-Perception and logged in.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| User exists in K-Perception | Session issued for the existing user — no new account created |
| User not in K-Perception, JIT provisioning on (default) | New user row created; user added to company as `default_role` |
| User not in K-Perception, JIT provisioning off | Login rejected with `user_not_found` |
| Email domain does not match `domainMatch` setting | Login rejected with `domain_not_allowed` |
| SAML assertion older than 5 minutes (300 s clock skew) | Assertion rejected as stale |
| Certificate fingerprint mismatch | Assertion rejected; `saml_verify_failed` audit event written |
| User is a guest account (`#EXT#` UPN) | Use `user.mail` as the Name ID source, not `user.userprincipalname` |

## Platform differences

The SAML ACS endpoint is a Cloudflare Worker URL and is platform-agnostic. All platforms (Windows desktop, Android, web) redirect to the same ACS URL. After the ACS redirect, the client app exchanges the session cookie set by the Worker.

## Plan availability

SAML SSO requires the **Enterprise** plan.

## Permissions and roles

- Only a company **super-admin** can configure SSO settings via `PUT /companies/:id/sso/config`.
- JIT-provisioned users receive the `default_role` set in the SSO config (default: `observer`).
- Company roles are: `super-admin | billing-admin | auditor | observer`.

## Security implications

- The X.509 certificate is stored encrypted at rest (AES-GCM) in the `company_sso_configs` table.
- K-Perception validates `WantAssertionsSigned="true"` — unsigned assertions are rejected.
- Clock-skew tolerance is exactly 300 seconds; assertions outside that window are rejected.
- Set `domainMatch` to your organisation's domain to prevent users from other tenants using a stolen assertion.
- The K-Perception SP does **not** sign `AuthnRequests` (`AuthnRequestsSigned="false"`). This is normal for IdP-initiated flows.
- SAML sessions expire after 24 hours.

## Settings reference

| Setting | Field in API body | Notes |
|---|---|---|
| Provider | `provider` | Must be `"saml"` |
| IdP entity URL / metadata URL | `entityUrl` | Azure AD Identifier (`https://sts.windows.net/{tenantId}/`) |
| X.509 certificate PEM | `x509CertPem` | Base64-encoded DER cert from Azure portal |
| Audience / SP Entity ID | `audience` | Defaults to `https://api.kperception.app/company/{companyId}` |
| Domain restriction | `domainMatch` | e.g. `contoso.com` — optional |
| JIT provisioning | `jitProvisioning` | Boolean; default `true` |
| Default role for JIT users | `defaultRole` | One of `super-admin | billing-admin | auditor | observer`; default `observer` |

## Related articles

- [SCIM provisioning with Azure AD](scim-azure-ad.md)
- [SAML 2.0 SSO with Okta](saml-okta.md)
- [SAML 2.0 SSO with Google Workspace](saml-google-workspace.md)
- [OIDC SSO](oidc.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/companySso.ts` — SAML ACS handler and config PUT route
- `private-sync-worker/migrations/0035_company_sso.sql` — `company_sso_configs` table schema
- `private-sync-worker/migrations/0036_company_sso_cert.sql` — certificate and domain fields
