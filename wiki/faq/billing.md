---
title: "Billing FAQ"
slug: "faq-billing"
category: "FAQ"
tags: ["faq", "billing", "plans", "pricing", "subscription", "team", "enterprise"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "macos", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/plans.ts
related: ["faq-general", "faq-enterprise"]
---

# Billing FAQ

## What plans are available and what do they cost?

| Plan | Price | Devices | Storage |
|---|---|---|---|
| Local | Free | 1 | No cloud |
| Guardian | €3.49/month (€29/year) | 3 | 5 GB |
| Vault | €7.99/month (€67/year) | 8 | 50 GB |
| Lifetime | €149 one-time | 8 | 50 GB |
| Team | €6.99/user/month (€59/user/year) | Unlimited | 100 GB shared |
| Enterprise | €14.99/user/month | Unlimited | Unlimited |

---

## How does Team plan billing work?

The Team plan is billed **per seat** at €6.99 per user per month (€59 per user per year on annual billing). Each active workspace member counts as one seat. The workspace owner is responsible for the subscription.

---

## What payment methods are accepted?

Stripe is the payment processor. Accepted methods (credit card, SEPA, local payment methods) depend on your country. Contact support@kperception.com for billing specifics.

---

## Is there an annual billing option?

Yes. Guardian offers €29/year (saving ~30% vs monthly). Vault offers €67/year. Team offers €59/user/year. Annual billing is confirmed in the plan definitions.

---

## What is included in the Lifetime plan?

The Lifetime plan (€149, one-time) includes everything in the Vault plan:
- 8 devices
- 50 GB storage
- Unlimited version history
- Real-time collaboration (view, comment, edit)
- PDF export + themes
- Unlimited share links
- All future features automatically

It also includes a Lifetime supporter badge in the app and direct access to the developer for feedback.

---

## Is there a free trial for Team or Enterprise?

Contact your K-Perception account manager or visit kperception.com for current details on free trial availability for Team or Enterprise.

---

## Can I cancel anytime?

You may cancel your subscription at any time from Settings → Account → Plan → Cancel subscription. Access continues until the end of the current billing period. See the [Terms of Service](../legal/terms-of-service.md) for full cancellation terms.

---

## What happens when I downgrade to a lower plan?

When you downgrade:
- Your **data is retained** — no notes or files are deleted.
- Features above your new plan tier become inaccessible (locked in the UI).
- Devices over the new limit may lose sync access until you remove the extra devices.
- Storage above the new limit will prevent new uploads; existing data is not deleted.

---

## What happens if I exceed my storage quota?

New uploads and sync pushes that would exceed the quota are rejected by the server with an HTTP 413 error. The client surfaces this as a "quota exceeded" error. Existing data is not affected. You must upgrade to a higher plan or delete existing files to free up space.

---

## Are there annual plan savings?

Yes:
- Guardian: ~30% savings vs monthly (€29/yr vs €41.88/yr)
- Vault: ~30% savings vs monthly (€67/yr vs €95.88/yr)
- Team: ~29% savings per user vs monthly (€59/user/yr vs €83.88/user/yr)

---

## Is there a student or nonprofit discount?

Contact your K-Perception account manager or visit kperception.com for current details on student and nonprofit discount availability.

---

## Do prices include VAT?

Prices shown are exclusive of VAT for EU customers. Stripe Tax computes and collects applicable VAT based on your billing address. Contact support@kperception.com for billing specifics.

---

## What happens to my data if my payment lapses?

Stripe retries failed payments automatically. If all retries fail (approximately 15 days after the original renewal date), the account is downgraded to the Local tier. Your encrypted notes are not deleted; cloud storage access is suspended for 90 days before deletion is scheduled. Contact support@kperception.com for billing specifics.

---

## Is the Lifetime plan truly lifetime?

The Lifetime plan is a one-time payment that grants perpetual access to the Vault feature set (as it exists and as it grows) for the life of the product. It does not expire. See [the general FAQ](general.md) for what happens if K-Perception shuts down.

---

## How do I upgrade from Local to Guardian?

Sign in to your K-Perception account (create one if you don't have one), then go to **Account → Plan → Upgrade** and select Guardian. Your existing local vault content can be uploaded to the cloud after upgrading.

---

## Can I switch from monthly to annual billing?

Switching from monthly to annual billing is available from Settings → Account → Plan → Billing cycle. Contact support@kperception.com for billing specifics on mid-cycle switching.
