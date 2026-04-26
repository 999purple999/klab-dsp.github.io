---
title: "SAML 2.0 SSO with OneLogin"
slug: "saml-onelogin"
category: "Enterprise"
tags: ["saml", "onelogin", "sso", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/companySso.ts"
  - "private-sync-worker/migrations/0035_company_sso.sql"
  - "private-sync-worker/migrations/0036_company_sso_cert.sql"
related: ["enterprise/saml-okta", "enterprise/saml-azure-ad", "enterprise/oidc", "enterprise/overview"]
---

# SAML 2.0 SSO with OneLogin

## What it is

This article walks you through connecting OneLogin as a SAML 2.0 Identity Provider for K-Perception. After completing this setup, members of your OneLogin directory can log into K-Perception using their OneLogin credentials.

K-Perception validates the SAML assertion signature against the uploaded X.509 certificate, enforces a 300-second clock-skew window, and either looks up or JIT-provisions the user before issuing a session.

## Before you begin

You need:
- OneLogin Super User or Account Owner role.
- K-Perception company super-admin access.
- Your K-Perception company ID (visible in **Company admin** → **Settings**).

## Required attribute mappings

| OneLogin field | SAML attribute name | K-Perception field | Notes |
|---|---|---|---|
| NameID (email) | NameID | Email — primary identifier | Set format to `Email` |
| Email | `email` | Email | Additional claim |
| First Name | `firstName` | Display name (first) | |
| Last Name | `lastName` | Display name (last) | |

## Step by step

### Step 1 — Create a new application in OneLogin

1. Sign in to the OneLogin Admin console.
2. Navigate to **Applications** → **Applications** → **Add App**.
3. Search for "SAML Custom Connector (Advanced)" and select it.
4. Give it a name: "K-Perception".
5. Click **Save**.

### Step 2 — Configure the application configuration

6. In the application's **Configuration** tab, enter:
   - **Audience (EntityID):** `https://api.kperception.app/company/{companyId}`
   - **ACS (Consumer) URL Validator:** `https://api.kperception.app/company/{companyId}/saml/acs`
   - **ACS (Consumer) URL:** `https://api.kperception.app/company/{companyId}/saml/acs`
   - **Login URL:** leave blank (IdP-initiated flow).
   - **SAML nameID format:** `Email`
   - **SAML issuer type:** `Specific`
7. Click **Save**.

### Step 3 — Configure parameters (attribute mapping)

8. In the **Parameters** tab, add the following:
   - Click the `+` button to add a parameter.
   - **Field name:** `email` → **Value:** `Email` → tick **Include in SAML assertion**.
   - **Field name:** `firstName` → **Value:** `First Name` → tick **Include in SAML assertion**.
   - **Field name:** `lastName` → **Value:** `Last Name` → tick **Include in SAML assertion**.
9. Ensure the default `NameID` parameter maps to **Email**.
10. Click **Save**.

### Step 4 — Download the OneLogin certificate

11. In the **SSO** tab, note:
    - **SAML 2.0 Endpoint (HTTP)** — this is the IdP SSO URL.
    - **Issuer URL** — this is the IdP Entity ID.
12. Click **View Details** next to the X.509 Certificate and download the certificate in PEM format.

### Step 5 — Configure K-Perception

13. Open K-Perception → **Company admin** → **Security** tab → **SSO** → **Configure SAML**.
14. Set **Provider** to `saml`.
15. Enter the **IdP Entity URL** (the Issuer URL from step 11).
16. Paste the downloaded OneLogin certificate into the **X.509 Certificate** field.
17. Optionally set **Domain restriction** to your company's email domain.
18. Set **Default role** for JIT-provisioned users (default: `observer`).
19. Click **Save**.

### Step 6 — Assign users in OneLogin

20. In the application's **Users** tab, assign users or roles that should have access to K-Perception via SSO.

### Step 7 — Test the connection

21. In OneLogin, click **Test** on the application to perform an IdP-initiated login.
22. Alternatively, open K-Perception → **Company admin** → **SSO** → **Test SAML login**.
23. On success, you are redirected to K-Perception and logged in.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| User exists in K-Perception | Session issued for the existing user |
| User not in K-Perception, JIT provisioning on (default) | New user created; added to company as `default_role` |
| User not in K-Perception, JIT provisioning off | Login rejected with `user_not_found` |
| Email domain does not match `domainMatch` setting | Login rejected with `domain_not_allowed` |
| Assertion older than 300 seconds | Assertion rejected as stale |
| Certificate mismatch | Assertion rejected; audit event written |
| OneLogin user is suspended | OneLogin will not issue an assertion |

## Platform differences

The SAML ACS endpoint is a Cloudflare Worker URL and is platform-agnostic.

## Plan availability

SAML SSO requires the **Enterprise** plan.

## Permissions and roles

- Only a company **super-admin** can configure SSO settings.
- JIT-provisioned users receive the `default_role` set in the SSO config (default: `observer`).
- Company roles are: `super-admin | billing-admin | auditor | observer`.

## Security implications

- The X.509 certificate is stored encrypted at rest (AES-GCM) in `company_sso_configs`.
- K-Perception validates `WantAssertionsSigned="true"`.
- Clock-skew tolerance is exactly 300 seconds.
- Set `domainMatch` to prevent users from other OneLogin accounts.
- SAML sessions expire after 24 hours.

## Settings reference

| Setting | Field in API body | Notes |
|---|---|---|
| Provider | `provider` | Must be `"saml"` |
| IdP entity URL | `entityUrl` | OneLogin Issuer URL |
| X.509 certificate PEM | `x509CertPem` | Certificate from OneLogin SSO tab |
| Audience / SP Entity ID | `audience` | Defaults to `https://api.kperception.app/company/{companyId}` |
| Domain restriction | `domainMatch` | Optional — e.g. `yourcompany.com` |
| JIT provisioning | `jitProvisioning` | Boolean; default `true` |
| Default role for JIT users | `defaultRole` | One of `super-admin | billing-admin | auditor | observer`; default `observer` |

## Related articles

- [SAML 2.0 SSO with Okta](saml-okta.md)
- [SAML 2.0 SSO with Azure AD](saml-azure-ad.md)
- [SAML 2.0 SSO with Google Workspace](saml-google-workspace.md)
- [OIDC SSO](oidc.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/companySso.ts` — SAML ACS handler and config PUT route
- `private-sync-worker/migrations/0035_company_sso.sql` — `company_sso_configs` table schema
- `private-sync-worker/migrations/0036_company_sso_cert.sql` — certificate and domain fields
