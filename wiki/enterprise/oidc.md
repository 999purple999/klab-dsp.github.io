---
title: "OIDC SSO for Companies"
slug: "oidc"
category: "Enterprise"
tags: ["oidc", "sso", "openid-connect", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/companySso.ts"
  - "private-sync-worker/migrations/0035_company_sso.sql"
  - "private-sync-worker/migrations/0036_company_sso_cert.sql"
related: ["enterprise/saml-okta", "enterprise/saml-azure-ad", "enterprise/scim-overview", "enterprise/overview"]
---

# OIDC SSO for Companies

## What it is

OpenID Connect (OIDC) is a modern identity protocol built on top of OAuth 2.0. K-Perception supports OIDC as an alternative to SAML 2.0 for company-level single sign-on. After configuration, members of your company can log in via an OIDC-compatible Identity Provider (IdP) such as Okta, Azure AD, Google, Auth0, or any provider that publishes a standards-compliant `/.well-known/openid-configuration` discovery document.

OIDC and SAML both configure on the same `company_sso_configs` table row per company — only one SSO provider can be active at a time.

## OIDC vs SAML

| | OIDC | SAML 2.0 |
|---|---|---|
| Protocol base | OAuth 2.0 | XML-based |
| Token format | JWT (id_token) | XML Assertion |
| Discovery | Automatic via `/.well-known/openid-configuration` | Manual metadata URL |
| SP-initiated flow | Supported | Partially — K-Perception uses IdP-initiated SAML |
| Certificate required | No | Yes — X.509 cert required |
| Complexity | Lower | Higher |
| Best for | Modern IdPs, cloud-native environments | Legacy enterprise IdPs, complex attribute mapping |

Choose OIDC when your IdP is a modern SaaS provider (Okta, Azure AD, Auth0) and you want simpler setup. Choose SAML when your IdP requires SAML or your compliance requirements mandate it.

## How OIDC works in K-Perception

1. The user navigates to `GET /companies/{companyId}/sso/initiate`.
2. K-Perception fetches the IdP's `/.well-known/openid-configuration` discovery document.
3. K-Perception stores a short-lived state nonce (10-minute TTL) and redirects the user to the IdP's `authorization_endpoint` with `response_type=code`, `scope=openid email profile`.
4. The user authenticates at the IdP.
5. The IdP redirects the user back to `GET /companies/{companyId}/sso/callback` with an authorisation `code` and `state`.
6. K-Perception validates the `state` nonce, then exchanges the `code` for tokens at the IdP's `token_endpoint`.
7. K-Perception extracts the email from the `id_token` JWT claims (or falls back to calling the `userinfo_endpoint`).
8. K-Perception finds the K-Perception account with that email, creates a session, and sets a session cookie.
9. The user is redirected to the workspace.

Note: JIT provisioning for OIDC requires a pre-existing K-Perception account with the matching email. If no account exists with the email from the `id_token`, login fails with `user_not_found`. [NEEDS-VERIFY: whether OIDC supports full JIT provisioning (new user row creation) or only lookup of existing accounts]

## Before you begin

You need:
- An OIDC-compatible IdP with an application/client you can configure.
- K-Perception company super-admin access.
- Your K-Perception company ID (visible in **Company admin** → **Settings**).

## Step by step

### Step 1 — Create an OIDC application in your IdP

**Okta:**
1. Navigate to **Applications** → **Create App Integration** → **OIDC — Web Application**.
2. Set **Sign-in redirect URI** to `https://api.kperception.app/companies/{companyId}/sso/callback`.
3. Note the **Client ID** and **Client Secret**.
4. Note the **Okta domain** (e.g. `https://your-org.okta.com`).

**Azure AD:**
1. Navigate to **App registrations** → **New registration**.
2. Set **Redirect URI** (Web) to `https://api.kperception.app/companies/{companyId}/sso/callback`.
3. Create a **Client secret** under **Certificates & secrets**.
4. Note the **Application (client) ID**, **Client Secret**, and **Directory (tenant) ID**.
5. The Azure AD OIDC issuer URL is `https://login.microsoftonline.com/{tenantId}/v2.0`.

**Auth0:**
1. Navigate to **Applications** → **Create Application** → **Regular Web Application**.
2. Add `https://api.kperception.app/companies/{companyId}/sso/callback` to **Allowed Callback URLs**.
3. Note the **Client ID**, **Client Secret**, and **Domain** (e.g. `https://your-tenant.auth0.com`).

### Step 2 — Configure K-Perception

4. Open K-Perception → **Company admin** → **Security** → **SSO** → **Configure OIDC**.
5. Set **Provider** to `oidc`.
6. Enter the **Issuer URL** (the IdP's `/.well-known/openid-configuration` base URL without the well-known path):
   - Okta: `https://your-org.okta.com`
   - Azure AD: `https://login.microsoftonline.com/{tenantId}/v2.0`
   - Auth0: `https://your-tenant.auth0.com`
7. Enter the **Client ID** from your IdP application.
8. Enter the **Client Secret** from your IdP application.
9. Optionally set **Domain restriction** to your company's email domain (e.g. `yourcompany.com`).
10. Set **Default role** for the company (default: `observer`). This does not affect workspace roles.
11. Click **Save**.

K-Perception encrypts the client secret at rest using AES-GCM with the `SESSION_SIGNING_KEY` binding before storing it.

### Step 3 — Test the connection

12. Open K-Perception → **Company admin** → **SSO** → **Test OIDC login**.
13. You are redirected to your IdP. Log in.
14. On success, you are redirected back to K-Perception.

## Behaviour and edge cases

| Scenario | Behaviour |
|---|---|
| User exists in K-Perception | Session issued for the existing account |
| User not in K-Perception | Login fails with `user_not_found` redirect to error page |
| IdP discovery document unreachable | Login fails with `sso_unreachable` (502) |
| State nonce expired (> 10 minutes) | Login fails with `invalid_state` |
| Email domain does not match `domainMatch` | Login rejected with `domain_not_allowed` redirect |
| No email in `id_token` | Fallback to `userinfo_endpoint`; if still no email, `no_email_in_token` error |
| Client secret rotated in IdP | Update K-Perception config — old secret causes token exchange failure |
| OIDC session duration | 24 hours — matches SAML session duration |

## Platform differences

The OIDC callback endpoint is a Worker URL. All platforms redirect to the same endpoint. Session cookie is set with `HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`.

## Plan availability

OIDC SSO requires the **Enterprise** plan.

## Permissions and roles

- Only a company **super-admin** can configure SSO settings via `PUT /companies/:id/sso/config`.
- Company roles: `super-admin | billing-admin | auditor | observer`.

## Security implications

- The client secret is encrypted at rest with AES-GCM using the `SESSION_SIGNING_KEY` environment variable as the key source. The raw secret is never stored.
- K-Perception validates the OIDC `state` parameter against a stored nonce to prevent CSRF.
- The nonce is single-use and consumed on first callback.
- K-Perception uses TLS for all communication with the IdP token endpoint. Token signatures are not separately verified [NEEDS-VERIFY: whether K-Perception validates the id_token JWT signature against the IdP's JWKS].
- Set `domainMatch` to restrict login to users from a specific email domain.

## Settings reference

| Setting | Field in API body | Notes |
|---|---|---|
| Provider | `provider` | Must be `"oidc"` |
| OIDC issuer URL | `entityUrl` | Base URL; K-Perception appends `/.well-known/openid-configuration` |
| Client ID | `clientId` | From IdP application |
| Client secret | `clientSecret` | Encrypted at rest with AES-GCM |
| Domain restriction | `domainMatch` | Optional — e.g. `yourcompany.com` |
| JIT provisioning | `jitProvisioning` | Boolean; default `true` |
| Default company role | `defaultRole` | One of `super-admin | billing-admin | auditor | observer`; default `observer` |

## Related articles

- [SAML 2.0 SSO with Okta](saml-okta.md)
- [SAML 2.0 SSO with Azure AD](saml-azure-ad.md)
- [SCIM provisioning overview](scim-overview.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/companySso.ts` — OIDC initiate, callback, and config routes
- `private-sync-worker/migrations/0035_company_sso.sql` — `company_sso_configs` table schema (`client_id`, `client_secret_enc`, `entity_url`)
