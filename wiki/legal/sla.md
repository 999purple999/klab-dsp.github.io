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
  - "soc2"
---

# Service Level Agreement

The 99.9% uptime commitment is listed in the product blueprint for the Enterprise plan. Specific SLA terms (measurement methodology, credit calculation, exclusions, maintenance windows, incident response procedures, and escalation path) are governed by your Enterprise service agreement. Contact your K-Perception account manager or visit kperception.com for current details. Do not make contractual representations to customers based on this article alone.

## What is the SLA?

A Service Level Agreement is a contractual commitment by K-Perception to maintain a minimum level of service availability for Enterprise plan customers. The SLA defines how availability is measured, what happens when the target is not met, and how customers can claim service credits.

## Uptime commitment

**Enterprise plan: 99.9% monthly uptime** (as stated in the product blueprint).

Contact your K-Perception account manager or visit kperception.com for current details on measurement period, definition of "unavailability", and which service components are covered.

A 99.9% monthly uptime target allows for approximately 43.8 minutes of downtime per month, or 8.7 hours per year.

## Plan availability

| Plan | SLA |
|------|-----|
| Local | No SLA |
| Guardian | No SLA |
| Vault | No SLA |
| Lifetime | No SLA |
| Team | No SLA (contact your account manager for current details) |
| Enterprise | 99.9% monthly uptime (contact your account manager for full SLA terms) |

## Service components covered

The SLA uptime calculation generally covers the following components; contact your account manager for the definitive list:

- Cloudflare Worker API endpoints (`/sync/*`, `/auth/*`, `/workspace/*`, `/company/*`)
- Cloudflare R2 blob storage (reads and writes)
- Cloudflare D1 database availability
- Cloudflare Durable Objects (real-time collaboration DocRooms)

The SLA does not typically cover:

- Client applications (desktop, Android) — these are end-user-installed software.
- Offline-first functionality — notes can be read and edited without server availability.
- Planned maintenance windows.
- Outages caused by third-party services outside K-Perception's control (e.g., a Cloudflare network incident).

Confirm all exclusions in your Enterprise service agreement.

## Infrastructure availability basis

K-Perception's backend runs on Cloudflare's globally distributed infrastructure:

- **Cloudflare Workers** — zero cold starts, automatic scaling across 300+ PoPs.
- **Cloudflare D1** — edge SQLite with global read replicas.
- **Cloudflare R2** — S3-compatible storage with no egress fees, exabyte scale.
- **Cloudflare Durable Objects** — per-document stateful relay, horizontal scaling.

Cloudflare's infrastructure is designed for high availability and has its own SLA commitments. K-Perception's uptime commitment is built on top of Cloudflare's infrastructure guarantees.

Additionally, K-Perception's **offline-first architecture** means that users can continue to read and edit notes locally even when the sync API is unavailable. Data written offline is queued and synced when connectivity is restored. This architectural property provides meaningful resilience against API outages from a user-experience perspective.

## Maintenance windows

Contact your account manager or visit kperception.com for current details on maintenance window scheduling, advance notice periods, and whether maintenance windows are excluded from uptime calculations.

Cloudflare Workers and D1 schema migrations can typically be deployed without downtime via a zero-downtime migration strategy. This behavior may vary by deployment; verify with your account manager.

## Incident response

Incident response procedures, severity definitions, response times, and update frequencies are governed by your Enterprise service agreement. Contact your account manager or visit kperception.com for current details.

## Status page

Contact your account manager or visit kperception.com for information on K-Perception's service status page and real-time availability monitoring.

## Service credits

Service credit percentages, maximum credit per month, and the claims process are governed by your Enterprise service agreement. Contact your account manager or visit kperception.com for current details.

Credits are typically applied to the next billing cycle and are the sole remedy for SLA breaches.

## How to report an SLA breach

Contact your account manager or support@kperception.com to report an SLA breach and request a credit review. The reporting window and process are specified in your Enterprise service agreement.

## Related articles

- [Legal Overview](overview.md)
- [Terms of Service summary](terms-of-service.md)
- [SOC 2 Overview](../compliance/soc2.md)

## Source references

- `blueprint/project_blueprint.md` §7 — "Enterprise: SLA 99.9%" listed in plan feature table
- `blueprint/project_blueprint.md` §5.3 — Cloudflare infrastructure scalability characteristics
