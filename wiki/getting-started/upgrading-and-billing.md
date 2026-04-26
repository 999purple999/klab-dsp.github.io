---
title: "Upgrading, downgrading, and billing"
slug: "upgrading-and-billing"
category: "Getting Started"
tags: ["billing", "upgrade", "downgrade", "stripe", "subscription", "invoice", "refund", "seats", "cancel"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web", "macos"]
last_reviewed: "2026-04-26"
source_refs:
  - "worker/src/billing.ts"
  - "worker/src/stripe.ts"
  - "src/components/BillingSettings.tsx"
  - "src/lib/entitlements.ts"
related: ["choosing-a-plan", "account-and-login", "overview"]
---

# Upgrading, downgrading, and billing

## What it is

Billing in K-Perception is handled by Stripe. When you subscribe to a paid plan, you create a Stripe customer linked to your K-Perception account. Stripe stores your payment method and manages recurring charges. K-Perception's Cloudflare Worker receives Stripe webhook events (subscription created, updated, deleted, payment failed) and updates your plan entitlement in the D1 database accordingly.

This article explains how to upgrade or downgrade your plan, how billing cycles work, what happens when a payment fails, how to manage Team/Enterprise seats, and how to cancel and — if eligible — request a refund.

## When to use it

Read this article when you are ready to subscribe, when you want to switch plans, when your payment has failed and you are not sure what to do, or when you are an admin managing seat counts for a Team or Enterprise workspace.

## Step by step

### How to upgrade

You can upgrade at any time. The new plan takes effect immediately, not at the next billing date.

1. Open K-Perception and go to Settings → Account → Plan.
2. Click **Upgrade** next to the plan you want.
3. You are redirected to a Stripe Checkout page in your browser (or in a browser window on desktop).
4. Enter your payment details (card, bank transfer, SEPA direct debit, or local payment method depending on your country).
5. Confirm the purchase.
6. Stripe notifies the K-Perception Worker within a few seconds via webhook. The Worker updates your entitlement tier in D1 and returns an updated JWT on your next API call.
7. The app detects the new JWT and unlocks the upgraded features without requiring a restart or re-login.

**Prorated upgrades (mid-cycle):**

If you upgrade from Guardian (€3.49/month) to Vault (€7.99/month) 15 days into your billing month, Stripe prorates the charges:

- You have already paid for the full Guardian month.
- Stripe credits the unused 15 days of Guardian (approximately €1.75).
- Stripe charges the remaining 15 days of Vault (approximately €4.00).
- At the next billing cycle, you pay the full Vault price (€7.99/month).

The prorated amounts appear as separate line items on your Stripe invoice.

**Upgrading from monthly to annual:**

Go to Settings → Account → Plan → Billing cycle → Switch to annual. Stripe charges the annual amount immediately and cancels the monthly subscription. The unused days on the current monthly cycle are credited and applied against the annual charge.

**Upgrading to Lifetime:**

1. Go to Settings → Account → Plan and click **Upgrade to Lifetime**.
2. Stripe processes a one-time charge of €149.
3. Your account is upgraded to the Lifetime tier. Any active monthly or annual subscription is cancelled. Unused days from the current subscription period are credited but not refunded (they are applied as a Stripe credit balance that offsets future invoices — however, since Lifetime has no future invoices, this credit is forfeited). Consider upgrading at the start of a billing cycle to minimise forfeited credit.

### How to downgrade

Downgrades take effect at the end of the current billing period, not immediately. This ensures you get the full value of the period you have already paid for.

1. Go to Settings → Account → Plan.
2. Click **Change plan** and select the lower plan.
3. Confirm the downgrade.
4. You see a notice: "Your plan will change to [lower plan] on [date]." Until that date, you retain full access to your current plan's features.
5. On the downgrade date, the Worker receives a Stripe `customer.subscription.updated` event and updates your entitlement.

**What data is preserved on downgrade:**

Your notes, files, and settings are never deleted by a plan downgrade. However, you may lose access to features, and cloud storage over the new plan's quota is flagged as read-only until you delete enough data to come within quota.

| Downgrade path | What changes |
|---|---|
| Vault → Guardian | Collaboration features disabled. History older than 30 days becomes inaccessible (not deleted; if you upgrade again, it reappears). Device limit enforced on next login attempt above 3 devices. |
| Guardian → Local | Cloud sync paused. Notes remain in cloud storage but new writes are blocked. Device count capped at 1. Share links beyond 2 become inaccessible (the links still work for recipients already holding them, but you cannot create new ones). |
| Vault/Lifetime → Local | All of the above; additionally, R2 objects are scheduled for deletion after a 90-day grace period if the account remains on Local. You receive email warnings at 30, 14, and 3 days before deletion. |
| Team/Enterprise → any personal plan | Workspace membership is unaffected (you remain a member); your personal plan changes. If you are the workspace owner and downgrade, you must transfer ownership first or the downgrade is blocked with an error. |

### How billing works

**Monthly billing:**

You are charged on the same day each month as your initial subscription date. If you subscribed on the 31st of a month and the next month has only 30 days, the charge falls on the 30th.

**Annual billing:**

You are charged once per year on the anniversary of your annual subscription start date. Annual pricing:

| Plan | Monthly rate | Annual rate | Annual saving |
|---|---|---|---|
| Guardian | €3.49/mo | €29/yr | €12.88 |
| Vault | €7.99/mo | €67/yr | €28.88 |

**Lifetime:**

A single charge of €149. No future charges. The Lifetime tier does not expire.

**Team/Enterprise seat billing:**

You pay for the number of active seats in your workspace. A seat is counted when a user accepts a workspace invitation and has an active membership. Pending invitations (sent but not yet accepted) do not count as seats.

- Adding a seat mid-cycle: prorated from the date the seat activates to the next billing date.
- Removing a seat mid-cycle: the seat remains billable until the end of the current cycle. It is not credited back immediately. The seat count decreases on the next billing cycle.
- Seat count changes are reconciled in real time by the Worker when the Stripe subscription quantity is updated.

**Taxes and VAT:**

Prices shown in the app are exclusive of VAT for EU customers. Stripe Tax computes and collects the appropriate VAT based on your billing address and location. Your invoice shows the VAT amount separately. K-Perception is a VAT-registered business in the EU. If you are an EU business purchasing for your organisation, enter your VAT ID at checkout to apply reverse charge (VAT is not charged to you).

### Renewal failure and grace period

If a payment fails (insufficient funds, expired card, etc.):

1. Stripe retries the charge automatically: 3 days after the first failure, then 5 days, then 7 days.
2. During the retry period, your account remains on your current plan. You retain full access.
3. You receive email notifications from Stripe at each failed attempt with a link to update your payment method. Update your payment method at Settings → Account → Billing → Update payment method or via the Stripe billing portal link in the email.
4. If all retries fail (approximately 15 days after the original renewal date), Stripe sends a `customer.subscription.deleted` event to the K-Perception Worker.
5. The Worker downgrades your account to the Local tier immediately upon receiving this event.
6. The app displays a banner: "Your subscription has lapsed. Your notes are safe. [Resubscribe]."

Your encrypted notes are not deleted when your subscription lapses. Cloud storage access is suspended (no new writes; reads work for 90 days). You have 90 days to resubscribe before R2 deletion is scheduled.

### Downloading invoices

1. Go to Settings → Account → Billing.
2. Click **View billing portal**. This opens your Stripe customer portal in a browser.
3. Under "Billing history", click the download icon next to any invoice.

Invoices are also emailed to your account email address by Stripe at each billing event. They are standard Stripe-formatted PDF invoices showing the plan name, billing period, amount, VAT (if applicable), and your billing address.

For Team/Enterprise plans, invoices show the number of seats and the per-seat rate. If you need invoices in a custom format for your accounts department, contact `billing@kperception.app`.

### How to cancel

Cancelling your subscription does not delete your account or your data. It schedules the subscription to end at the close of the current billing period, after which you are downgraded to the Local tier.

1. Go to Settings → Account → Plan.
2. Click **Cancel subscription**.
3. Confirm in the dialog. You see the date your access to paid features ends.
4. Until that date, you retain your current plan. You can resubscribe any time before or after the end date.

Alternatively, cancel through the Stripe billing portal linked from Settings → Account → Billing.

**Cancelling a Team workspace subscription:**

Only the workspace owner can cancel. Go to Workspace Settings → Billing → Cancel subscription. All workspace members retain access until the end of the billing period. After cancellation, the workspace enters read-only mode (notes and files visible but no new writes). The owner can export all workspace data within 90 days before it is deleted.

### Refund policy summary

**7-day refund for annual personal plans:**

If you subscribed to the Guardian or Vault annual plan and request a refund within 7 days of the initial charge, you receive a full refund. Contact `billing@kperception.app` with your account email address and the invoice number.

**14-day refund for Lifetime:**

Lifetime purchases may be refunded within 14 days of purchase if you have not materially used the service (defined as fewer than 10 notes created after purchase). After 14 days, or after material use, Lifetime purchases are non-refundable. Full terms at `kperception.app/legal/refund-policy`.

**Monthly plans:**

Monthly subscription charges are non-refundable. You can cancel at any time and retain access until the end of the current period.

**Team/Enterprise:**

Refunds for seat charges are handled on a case-by-case basis. Contact your account manager or `enterprise@kperception.app`.

For full refund terms, see [Refund Policy](../legal/refund-policy.md).

## Behaviour and edge cases

- If you upgrade from Guardian to Vault and have notes shared via Vault-tier collaboration that were created during a Vault trial, those collaboration sessions remain active. If you later downgrade to Guardian, active collaboration sessions stop updating; the notes are preserved.
- Changing the email address on your Stripe account (via the billing portal) does not change your K-Perception account email. Keep them in sync manually if you want invoices sent to the same address you log in with.
- If you have both a monthly personal subscription and are a member of a Team workspace, the two are billed independently. Your personal plan does not affect the Team billing, and vice versa.
- Stripe card details are never sent to K-Perception servers. Stripe handles all payment data under PCI DSS Level 1 compliance. K-Perception stores only your Stripe customer ID.
- VAT ID validation happens at checkout time via the Stripe Tax API. If your VAT ID fails validation, you are charged VAT. Submit the correct VAT ID at checkout to avoid needing a credit note later.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Manage plan | Settings → Account → Plan | Settings → Account → Plan | Settings → Account → Plan |
| Stripe checkout | System browser | Chrome Custom Tab | Redirect in same tab |
| Stripe billing portal | System browser | Chrome Custom Tab | New tab |
| Invoice download | Via browser | Via browser | Via browser |

## Plan availability

All billing operations are available on all plans. Local-plan users who want to upgrade do so from within the app or at `kperception.app/pricing`.

## Permissions and roles

Only the account holder (personal plans) or the workspace owner (Team/Enterprise) can manage subscriptions and billing. Workspace admins can view seat counts but cannot change billing details.

## Security implications

K-Perception does not process or store payment card data. All payment handling is delegated to Stripe. K-Perception Workers receive only Stripe webhook events (subscription status, invoice paid/failed) signed with Stripe's webhook signing secret. Webhooks are verified via `stripe.webhooks.constructEvent()` using the signing secret; unverified events are rejected with HTTP 400. This prevents a malicious actor from injecting fake upgrade or downgrade events.

Your plan tier is stored in D1 and embedded in your JWT at refresh time. A tampered JWT fails HMAC verification and is rejected. Downgrading your plan by modifying the JWT is not possible.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Current plan | Settings → Account → Plan | Shows plan name, renewal date, and price |
| Upgrade / Change plan | Settings → Account → Plan → Upgrade | Opens Stripe Checkout |
| Billing portal | Settings → Account → Billing → View billing portal | Manage payment method, download invoices, cancel |
| Update payment method | Settings → Account → Billing → Update payment method | Opens Stripe billing portal to update card |
| Seat count (Team/Enterprise) | Workspace Settings → Billing | Shows current and projected seat cost |
| Downgrade / Cancel | Settings → Account → Plan → Cancel subscription | Schedules end of subscription |

## Related articles

- [Choosing a plan](choosing-a-plan.md)
- [Account setup and login](account-and-login.md)
- [What is K-Perception?](overview.md)
- Refund Policy (`kperception.app/legal/refund-policy`)

## Source references

- `worker/src/billing.ts` — Stripe webhook handler (subscription lifecycle events)
- `worker/src/stripe.ts` — Stripe API client, checkout session creation, billing portal session
- `src/components/BillingSettings.tsx` — billing settings UI
- `src/lib/entitlements.ts` — plan tier definitions and gating logic
