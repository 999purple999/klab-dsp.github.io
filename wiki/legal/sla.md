---
title: "Service Level Agreement"
slug: "sla"
category: "Legal"
tags: ["sla", "uptime", "enterprise", "availability", "incident-response"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "blueprint/project_blueprint.md"
related:
  - "legal-overview"
  - "terms-of-service"
---

# Service Level Agreement

This article describes K-Perception's service availability commitment for Enterprise plan customers. The binding SLA terms — including the measurement methodology, credit calculation, exclusions, maintenance windows, and incident response procedures — are governed by your Enterprise service agreement.

Do not make contractual representations to your own customers based solely on this article. Contact your K-Perception account manager for the full SLA document.

## Uptime commitment

**Enterprise plan: 99.9% monthly uptime**, as described in the product blueprint.

A 99.9% monthly uptime target allows for approximately 43.8 minutes of downtime per calendar month.

The precise definition of "downtime," the measurement window, and which service components are in scope are specified in your Enterprise service agreement. Contact your account manager for details.

## Plan availability

| Plan | SLA |
|------|-----|
| Local | No SLA |
| Guardian | No SLA |
| Vault | No SLA |
| Lifetime | No SLA |
| Team | No SLA — contact your account manager for current details |
| Enterprise | 99.9% monthly uptime — full terms in your service agreement |

## Service components

The uptime commitment covers K-Perception's backend API and storage services. These run on Cloudflare's globally distributed infrastructure:

- **Cloudflare Workers** — edge compute; zero cold starts, automatic global scaling.
- **Cloudflare D1** — edge SQLite database with global read replicas.
- **Cloudflare R2** — object storage (encrypted content blobs).
- **Cloudflare Durable Objects** — stateful real-time relay for collaborative editing (DocRooms).

The SLA does not cover:

- Client applications (Windows desktop, Android) — these are installed software on devices outside K-Perception's control.
- Offline-first functionality — notes can be read and edited locally without server connectivity.
- Planned maintenance windows.
- Outages caused by events outside K-Perception's control, including Cloudflare network incidents, Stripe outages, or internet backbone disruptions.

Your Enterprise service agreement specifies the complete exclusion list.

## Offline-first resilience

K-Perception's offline-first architecture means users can continue to read and edit notes locally when the sync API is unavailable. Changes made offline are queued and synchronised automatically when connectivity is restored. This architectural property provides meaningful resilience to API outages from a user-experience perspective, independent of the formal SLA.

## Infrastructure availability basis

K-Perception's uptime commitment is built on Cloudflare's infrastructure. Cloudflare operates its own availability SLAs for Workers, D1, R2, and Durable Objects. K-Perception's commitment takes into account Cloudflare's infrastructure guarantees as the underlying layer.

## Maintenance windows

[PLACEHOLDER — update before publishing: specify scheduled maintenance windows, how much advance notice is given, and whether maintenance windows are excluded from uptime calculations. Cloudflare Workers and D1 migrations can typically be performed without downtime via rolling deployments, but the policy should be documented explicitly.]

## Status page

[PLACEHOLDER — update before publishing: provide the URL of K-Perception's service status page where customers can monitor real-time availability and review incident history.]

## Service credits

The credit percentage, maximum monthly credit, and claims process are specified in your Enterprise service agreement. Credits are typically applied to the next billing cycle and are the sole remedy for SLA breaches.

To report an SLA breach and request a credit review, contact your account manager or [PLACEHOLDER — update before publishing: insert support contact email].

## Incident response

Incident severity definitions, response time targets, update frequencies, and escalation procedures are governed by your Enterprise service agreement. Contact your account manager for the current incident response procedures.

## Related articles

- [Legal Overview](overview.md)
- [Terms of Service summary](terms-of-service.md)

## Source references

- `blueprint/project_blueprint.md` §7 — "Enterprise: SLA 99.9%" listed in plan feature table
- `blueprint/project_blueprint.md` §5.3 — Cloudflare infrastructure characteristics
