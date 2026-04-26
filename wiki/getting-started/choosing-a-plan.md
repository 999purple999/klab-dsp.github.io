---
title: "Choosing a plan"
slug: "choosing-a-plan"
category: "Getting Started"
tags: ["plans", "pricing", "local", "guardian", "vault", "lifetime", "team", "enterprise", "comparison"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web", "macos"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/lib/entitlements.ts"
  - "worker/src/billing.ts"
  - "src/components/PlanGate.tsx"
related: ["overview", "upgrading-and-billing", "first-vault", "account-and-login"]
---

# Choosing a plan

## What it is

K-Perception offers six plans spanning free personal use to enterprise compliance. Every plan unlocks all seven editor modes and the full editing experience. Plans differ in: how many devices you can sync, how much cloud storage you get, which collaboration and security features are active, and how you pay.

## When to use it

Read this article when you are deciding which plan to start with, when your needs have changed and you are considering an upgrade or downgrade, or when you need to explain plan differences to a team or IT department.

## Step by step

### Plan decision tree

Use the flowchart below to narrow your choice:

```
Do you need cloud sync or multi-device access?
    |
    No --> LOCAL PLAN (free forever)
    |
    Yes
    |
    Are you a team of 2 or more people sharing notes?
        |
        No
        |
        Do you need real-time collaboration or unlimited history?
            |
            No --> Do you need collaboration at all?
                    |
                    No --> GUARDIAN PLAN
                    |
                    (light use, 30-day history sufficient) --> GUARDIAN PLAN
            |
            Yes
            |
            Do you intend to use this for 19+ months?
                |
                No --> VAULT PLAN (monthly or annual)
                |
                Yes --> LIFETIME PLAN (amortises at month 19)
        |
        Yes
        |
        Do you need SAML/SCIM/OIDC, audit log, HIPAA BAA, or IP allowlist?
            |
            No --> TEAM PLAN
            |
            Yes --> ENTERPRISE PLAN
```

## Behaviour and edge cases

Plan entitlements are checked both client-side (for UI gating) and server-side (for API enforcement). Client-side gating can be inspected by a determined user, but the server will return 403 for any action that exceeds your plan. You cannot unlock features by modifying local plan state.

## Platform differences

| Platform | Where to change plan |
|---|---|
| Windows | Settings → Account → Plan → Manage subscription |
| Android | Settings → Account → Plan → Manage subscription |
| Web | Settings → Account → Plan → Manage subscription |

Billing is always handled through Stripe and is not platform-specific. There is no separate pricing for desktop vs mobile.

## Plan availability

All plans are available on all platforms. The Local plan requires no account and no payment.

---

## Detailed plan breakdown

### Local — Free forever

**Price:** €0, no subscription, no credit card required.

**Devices:** 1 (the device where the app is installed; no sync).

**Storage:** 0 GB cloud. Notes exist only on your device.

**Key features:**
- All 7 editor modes
- Unlimited notes (bounded only by local storage)
- 2 outbound share links (read-only, no expiry; the recipient views the note on `kperception-share.pages.dev`)
- Export to plain text and HTML

**What you do not get:**
- Cloud sync
- Multi-device access
- PDF export
- Version history
- Real-time collaboration
- Workspace membership
- Additional share links

**Ideal user:** Someone who keeps sensitive personal notes on one device and does not need cloud backup. A good fit for a journalist's source notes kept on an air-gapped laptop, a therapist's session notes on a dedicated device, or anyone who fundamentally distrusts cloud storage.

**Important limitation:** If your device is lost, stolen, or damaged, your notes are gone unless you have a manual backup of the vault database file (Settings → Advanced → Export vault). Keep a backup.

---

### Guardian — €3.49/month or €29/year

**Price:** €3.49/month billed monthly, or €29/year (save €12.88 vs monthly).

**Devices:** 3 simultaneously synced devices.

**Storage:** 5 GB encrypted cloud storage.

**Key features over Local:**
- Cloud sync via Cloudflare R2 (zero-egress backend)
- 3-device sync
- 30-day version history (roll back any note to any state in the past 30 days)
- Unlimited share links
- PDF export (full-fidelity, including LaTeX rendering)
- Email support

**What you do not get vs Vault:**
- Real-time collaboration (you can share links, but not co-edit simultaneously)
- History beyond 30 days
- More than 3 devices

**Ideal user:** A solo professional who works across two or three devices (laptop, phone, desktop) and occasionally shares notes with clients or colleagues. Writers who need PDF export and version history. Students who back up research across devices.

**Annual savings note:** The annual plan at €29/year is equivalent to €2.42/month — a 31% saving over monthly billing. If you know you will use it for a year, choose annual.

---

### Vault — €7.99/month or €67/year

**Price:** €7.99/month billed monthly, or €67/year (save €28.88 vs monthly).

**Devices:** 8 simultaneously synced devices.

**Storage:** 50 GB encrypted cloud storage.

**Key features over Guardian:**
- Real-time collaboration with Y.js CRDT and E2EE — co-edit any note with up to 50 concurrent users
- Unlimited version history (no time limit; full history for the lifetime of the note)
- 8-device sync
- 50 GB storage
- Priority email support

**What you do not get vs Lifetime:**
- You pay monthly/annually; Lifetime is a one-time payment
- No difference in features; Lifetime is Vault forever

**Ideal user:** A freelancer who collaborates with clients or a small informal team. A researcher who co-writes papers in the Editorial editor. A power user who has notes across many devices.

---

### Lifetime — €149 one-time payment

**Price:** €149, paid once. No recurring charges.

**Devices:** 8 simultaneously synced devices.

**Storage:** 50 GB encrypted cloud storage.

**Features:** Identical to Vault — all features unlocked, unlimited history, real-time collaboration.

**Is Lifetime worth it?**

The break-even calculation against the Vault annual plan:

- Vault annual: €67/year
- Lifetime: €149 ÷ €67/year = 2.22 years = **approximately 27 months** to break even

Against Vault monthly:

- Vault monthly: €7.99/month
- Lifetime: €149 ÷ €7.99/month = **approximately 19 months** to break even

If you plan to use K-Perception for more than 19 months and currently pay monthly, Lifetime is financially better. If you pay annually and plan to use it for at least 27 months (just over 2 years), Lifetime saves money.

Beyond the financial calculation: Lifetime removes renewal risk (no accidental lapse, no credit card expiry issue), and it removes dependence on the pricing staying constant. If you value the certainty and simplicity of paying once, Lifetime is worth a premium over the pure amortisation calculation.

**Limitation:** Lifetime does not include Team or Enterprise features (shared workspaces, SAML, SCIM, admin panel, audit log). If your needs grow to team use, you will need to switch to a Team or Enterprise plan.

---

### Team — €6.99/user/month

**Price:** €6.99 per user per month. Minimum 2 users. Billed monthly or annually (annual pricing available on request — contact sales).

**Devices:** Unlimited per user.

**Storage:** 100 GB shared across the workspace.

**Key features over Vault:**
- Shared workspaces with per-section and per-file encryption keys
- Channel messaging with E2EE
- File manager with folder hierarchy and per-blob derived encryption keys
- Role-based access control (owner, admin, editor, commenter, viewer, guest)
- Workspace audit log (90-day retention)
- Group management
- Admin panel with member management, billing, and webhooks
- `kp-ws` and `kp-admin` CLI tools
- Invite policy controls

**What you do not get vs Enterprise:**
- SAML 2.0 / OIDC
- SCIM user provisioning
- IP allowlist
- MFA enforcement policy
- Domain restriction
- HIPAA BAA
- GDPR data processing agreement
- 99.9% SLA
- Custom audit log retention
- Priority phone/Slack support channel

**Ideal user:** A startup, agency, or small company with 2–50 people who need shared encrypted notes, files, and channels. Technical teams who want CLI automation. Teams that need role-based access but do not have an IT department running an IdP.

**Seat billing:** You pay for the number of active seats. Adding a member increases your monthly bill at the per-seat rate, prorated to the next billing date. Removing a member decreases it at the next billing cycle. See [Upgrading, downgrading, and billing](upgrading-and-billing.md) for prorated calculation details.

---

### Enterprise — €14.99/user/month

**Price:** €14.99 per user per month. Volume discounts available for 50+ seats — contact sales.

**Devices:** Unlimited per user.

**Storage:** Unlimited (subject to fair-use policy detailed in the Enterprise agreement).

**Key features over Team:**
- SAML 2.0 ACS for SSO with any SAML IdP (Okta, Azure AD, Ping, OneLogin, etc.)
- SCIM 2.0 for automated user and group provisioning
- OIDC for SSO with OIDC providers
- TOTP step-up 2FA for sensitive operations
- IP allowlist (restrict API access to corporate IP ranges)
- MFA enforcement policy (require all members to enable 2FA)
- Domain restriction (only emails from approved domains can join the workspace)
- Remote wipe (delete vault data on a device belonging to a departing employee)
- Audit log with unlimited retention and external SIEM webhook export
- GDPR deletion endpoint + Data Processing Agreement (DPA)
- HIPAA Business Associate Agreement (BAA) available
- SOC 2 Type II report available on request (NDA required)
- Dedicated support channel (Slack Connect or email, SLA 4-hour first response)
- 99.9% uptime SLA with credits

**Ideal user:** A company in a regulated industry (healthcare, finance, legal, education) or one that requires IdP-based user lifecycle management. Any organisation with 50+ employees who would manage user onboarding/offboarding through an IdP rather than manually.

**Custom agreement:** Enterprise plans above 100 seats include a custom Master Service Agreement. Contact sales at `enterprise@kperception.app`.

---

## Feature comparison table

| Feature | Local | Guardian | Vault | Lifetime | Team | Enterprise |
|---|---|---|---|---|---|---|
| Price | Free | €3.49/mo | €7.99/mo | €149 once | €6.99/user/mo | €14.99/user/mo |
| Devices | 1 | 3 | 8 | 8 | Unlimited | Unlimited |
| Cloud storage | 0 | 5 GB | 50 GB | 50 GB | 100 GB shared | Unlimited |
| All 7 editors | Yes | Yes | Yes | Yes | Yes | Yes |
| Cloud sync | No | Yes | Yes | Yes | Yes | Yes |
| Share links | 2 | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited |
| PDF export | No | Yes | Yes | Yes | Yes | Yes |
| Version history | No | 30 days | Unlimited | Unlimited | Unlimited | Unlimited |
| Real-time collab | No | No | Yes | Yes | Yes | Yes |
| Workspaces | No | No | No | No | Yes | Yes |
| Channels | No | No | No | No | Yes | Yes |
| File manager | No | No | No | No | Yes | Yes |
| Audit log | No | No | No | No | 90 days | Unlimited |
| CLI tools | No | No | No | No | Yes | Yes |
| SAML/SCIM/OIDC | No | No | No | No | No | Yes |
| IP allowlist | No | No | No | No | No | Yes |
| MFA enforcement | No | No | No | No | No | Yes |
| Remote wipe | No | No | No | No | No | Yes |
| HIPAA BAA | No | No | No | No | No | Yes |
| SLA 99.9% | No | No | No | No | No | Yes |

## Permissions and roles

Plan-level entitlements are enforced at the API layer. A user cannot elevate their own plan by modifying client-side state. Enterprise admins can set maximum plan ceilings for workspace members to prevent individual upgrades without admin approval.

## Security implications

Higher plans do not change the core encryption model — AES-256-GCM with device-held keys applies on all plans equally. The difference is in access control, auditability, and operational security features (IP allowlist, remote wipe, MFA enforcement). A Local-plan user's notes are as strongly encrypted as an Enterprise-plan user's notes.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Current plan | Settings → Account → Plan | Shows current plan and next billing date |
| Upgrade | Settings → Account → Plan → Upgrade | Opens Stripe checkout |
| Compare plans | Settings → Account → Plan → Compare | In-app plan comparison table |
| Team seat count | Workspace Settings → Members → Billing | Shows current seat count and cost |

## Related articles

- [What is K-Perception?](overview.md)
- [Upgrading, downgrading, and billing](upgrading-and-billing.md)
- [Creating your first vault](first-vault.md)
- [Account setup and login](account-and-login.md)

## Source references

- `src/lib/entitlements.ts` — plan tier definitions and feature flags
- `worker/src/billing.ts` — Stripe webhook handler for plan changes
- `src/components/PlanGate.tsx` — plan-gate component used to hide unavailable features
