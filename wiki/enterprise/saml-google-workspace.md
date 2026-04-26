---
title: "SAML 2.0 SSO with Google Workspace"
slug: "saml-google-workspace"
category: "Enterprise"
tags: ["saml", "google-workspace", "sso", "enterprise"]
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

# SAML 2.0 SSO with Google Workspace

## What it is

This article walks you through connecting Google Workspace as a SAML 2.0 Identity Provider for K-Perception. After completing this setup, members of your Google Workspace domain can log into K-Perception using their Google credentials.

Google Workspace uses IdP-initiated SAML. The ACS endpoint receives a `SAMLResponse` POST, validates the assertion signature, enforces a 300-second clock-skew window, and either looks up or JIT-provisions the user before issuing a session.

## Before you begin

You need:
- Google Workspace Super Administrator role.
- K-Perception company super-admin access.
- Your K-Perception company ID (visible in **Company admin** → **Settings**).

## Required attribute mappings

Google Workspace uses its own claim names. Map the following in the Google Admin console:

| Google Workspace attribute | K-Perception field | Notes |
|---|---|---|
| Primary email (NameID) | Email — primary identifier | Set Name ID format to `EMAIL` |
| `First name` | Display name (first) | Map via Basic Information |
| `Last name` | Display name (last) | Map via Basic Information |
| `Primary email` | Email | Map as attribute `email` |

## Step by step

### Step 1 — Open the Google Admin console

1. Sign in to the [Google Admin console](https://admin.google.com) as a Super Administrator.
2. Navigate to **Apps** → **Web and mobile apps** → **Add app** → **Add custom SAML app**.

### Step 2 — Name the application

3. Enter "K-Perception" as the app name.
4. Optionally upload a K-Perception logo.
5. Click **Continue**.

### Step 3 — Download Google IdP information

6. On the **Google Identity Provider details** page you will see:
   - **SSO URL** — the SAML endpoint Google will POST to K-Perception.
   - **Entity ID** — the Google IdP entity identifier (e.g. `https://accounts.google.com/o/saml2?idpid=...`).
   - **Certificate** — download the certificate (click **Download Certificate**).
7. Click **Continue**.

### Step 4 — Configure the service provider (K-Perception)

8. On the **Service provider details** page, enter:
   - **ACS URL:** `https://api.kperception.app/company/{companyId}/saml/acs`
   - **Entity ID:** `https://api.kperception.app/company/{companyId}`
   - **Start URL:** leave blank.
   - **Signed response:** tick this checkbox.
   - **Name ID format:** `EMAIL`
   - **Name ID:** `Basic Information > Primary email`
9. Click **Continue**.

### Step 5 — Configure attribute mapping

10. On the **Attribute mapping** page, add the following mappings:
    - Google Directory attribute: `First name` → App attribute: `firstName`
    - Google Directory attribute: `Last name` → App attribute: `lastName`
    - Google Directory attribute: `Primary email` → App attribute: `email`
11. Click **Finish**.

### Step 6 — Enable the application

12. In the app listing, click on **K-Perception**.
13. Click **User access** → set to **ON for everyone** (or to specific organisational units).
14. Click **Save**.

### Step 7 — Configure K-Perception

15. Open K-Perception → **Company admin** → **Security** tab → **SSO** → **Configure SAML**.
16. Set **Provider** to `saml`.
17. Enter the **IdP Entity URL** (the Google Entity ID from step 6).
18. Paste the downloaded Google certificate into the **X.509 Certificate** field.
19. Optionally set **Domain restriction** to your Google Workspace domain (e.g. `yourcompany.com`).
20. Set **Default role** for JIT-provisioned users (default: `observer`).
21. Click **Save**.

### Step 8 — Test the connection

22. Open the K-Perception app and navigate to the company login page.
23. Click **Sign in with SSO** — you will be redirected to Google.
24. Log in with a user from the assigned organisational unit.
25. On success you are redirected back to K-Perception and logged in.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| User exists in K-Perception | Session issued for the existing user |
| User not in K-Perception, JIT provisioning on (default) | New user created; added to company as `default_role` |
| User not in K-Perception, JIT provisioning off | Login rejected with `user_not_found` |
| Email domain does not match `domainMatch` setting | Login rejected with `domain_not_allowed` |
| SAML assertion older than 300 seconds | Assertion rejected as stale |
| Certificate fingerprint mismatch | Assertion rejected; audit event written |
| User disabled in Google Workspace | Google will not issue an assertion — user cannot log in |

## Platform differences

The SAML ACS endpoint is a Cloudflare Worker URL and is platform-agnostic. Google Workspace uses IdP-initiated SAML only — SP-initiated flows (where K-Perception sends an AuthnRequest) are not supported by this integration. [NEEDS-VERIFY: whether K-Perception generates an AuthnRequest for Google Workspace]

## Plan availability

SAML SSO requires the **Enterprise** plan.

## Permissions and roles

- Only a company **super-admin** can configure SSO settings.
- JIT-provisioned users receive the `default_role` set in the SSO config (default: `observer`).
- Company roles are: `super-admin | billing-admin | auditor | observer`.

## Security implications

- Google signs both the SAML Response and Assertion. K-Perception validates the signature using the uploaded X.509 certificate.
- Clock-skew tolerance is exactly 300 seconds.
- Set `domainMatch` to your Google Workspace primary domain to prevent accounts from other Google tenants.
- The X.509 certificate is stored encrypted at rest (AES-GCM) in `company_sso_configs`.
- SAML sessions expire after 24 hours.
- Google certificates rotate periodically — re-download and re-upload the certificate when Google rotates it.

## Settings reference

| Setting | Field in API body | Notes |
|---|---|---|
| Provider | `provider` | Must be `"saml"` |
| IdP entity URL | `entityUrl` | Google Entity ID |
| X.509 certificate PEM | `x509CertPem` | Certificate downloaded from Google Admin console |
| Audience / SP Entity ID | `audience` | Defaults to `https://api.kperception.app/company/{companyId}` |
| Domain restriction | `domainMatch` | e.g. `yourcompany.com` — optional |
| JIT provisioning | `jitProvisioning` | Boolean; default `true` |
| Default role for JIT users | `defaultRole` | One of `super-admin | billing-admin | auditor | observer`; default `observer` |

## Related articles

- [SAML 2.0 SSO with Okta](saml-okta.md)
- [SAML 2.0 SSO with Azure AD](saml-azure-ad.md)
- [SAML 2.0 SSO with OneLogin](saml-onelogin.md)
- [OIDC SSO](oidc.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/companySso.ts` — SAML ACS handler and config PUT route
- `private-sync-worker/migrations/0035_company_sso.sql` — `company_sso_configs` table schema
- `private-sync-worker/migrations/0036_company_sso_cert.sql` — certificate and domain fields
