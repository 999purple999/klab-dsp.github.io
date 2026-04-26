---
title: "Security Vulnerability Disclosure Policy"
slug: "security-disclosure"
category: "Legal"
tags: ["security", "disclosure", "vulnerability", "bug-bounty", "responsible-disclosure"]
audience: "admin"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs: []
related:
  - "legal-overview"
  - "acceptable-use-policy"
---

# Security Vulnerability Disclosure Policy

K-Perception takes security seriously. If you believe you have identified a security vulnerability in a K-Perception application, infrastructure, or related service, please follow this responsible disclosure policy before taking any other action, including public disclosure.

## What to report

Report security vulnerabilities that affect:

- The K-Perception Cloudflare Worker backend (API endpoints, authentication, authorisation, data access controls).
- The K-Perception desktop application (Electron, Windows).
- The K-Perception Android application.
- The K-Perception web application.
- Cryptographic implementation issues (key derivation, encryption, the key hierarchy).
- Any issue that could allow an attacker to access another user's encrypted content, session tokens, or workspace resources without authorisation.

## What is out of scope

The following are generally out of scope:

- Vulnerabilities in third-party libraries where the issue is publicly known and a patch is not yet available upstream.
- Issues that require physical access to a user's unlocked device.
- Social engineering attacks targeting K-Perception employees.
- Theoretical vulnerabilities without a working proof of concept.
- Rate limiting on non-sensitive, non-authenticated endpoints.
- Vulnerabilities in infrastructure operated by Cloudflare, Stripe, or Google rather than K-Perception. Report those directly to the relevant vendor.

Contact [PLACEHOLDER — update before publishing: insert security contact email, e.g. security@kperception.com] to confirm current scope before beginning research.

## How to report

**Email:** [PLACEHOLDER — update before publishing: insert security contact email, e.g. security@kperception.com]

Include in your report:

- A clear description of the vulnerability.
- The affected component (backend API, desktop app, Android app, web app).
- Steps to reproduce, including any payloads, screenshots, or proof-of-concept code.
- Your assessment of the severity and potential impact.
- Whether you have exploited the vulnerability beyond what was necessary to confirm it, or disclosed it to any third party.

**Encrypting sensitive reports:** If your report contains sensitive material (for example, session tokens or credentials obtained during research), encrypt your email before sending. Contact [PLACEHOLDER — update before publishing: insert security contact email] to request a PGP public key or an alternative secure channel.

## Response timeline

| Milestone | Target |
|-----------|--------|
| Acknowledgement | Within 2 business days of receipt |
| Initial severity assessment | Within 5 business days |
| Status update | Every 7–14 days while the investigation is active |
| Fix deployed — critical / high severity | Within 30 days of confirmed reproduction |
| Fix deployed — medium / low severity | Within 90 days of confirmed reproduction |
| Coordinated public disclosure | Agreed with the reporter after the fix is deployed |

These are targets. Actual timelines may vary based on complexity. K-Perception will communicate promptly if a target cannot be met.

## Safe harbour

If you follow this policy and report a vulnerability in good faith, K-Perception will:

- Not initiate legal action against you for security research conducted in accordance with this policy.
- Work with you towards coordinated public disclosure.
- Credit you for the finding in any public disclosure, unless you prefer to remain anonymous.

Your research must be limited to what is strictly necessary to identify and document the vulnerability. Do not access, modify, or delete data belonging to other users. Do not disrupt or degrade service availability.

## Bug bounty

[PLACEHOLDER — update before publishing: state whether a bug bounty programme is in place, its scope, reward ranges, and the platform used (e.g. HackerOne, Bugcrowd, or direct). If no formal programme exists, state that clearly rather than implying one.]

## Cryptographic security context

K-Perception's zero-knowledge architecture means the most impactful vulnerability classes are those that could:

1. Allow an attacker to extract plaintext content or cryptographic keys from memory or device storage.
2. Bypass authentication and gain unauthorised access to another user's workspace.
3. Cause the client to transmit plaintext content or keys to an untrusted server (for example, through malicious share link URL parsing).
4. Undermine the integrity guarantees of AES-256-GCM ciphertext, such as GCM tag forgery.
5. Compromise the Argon2id key derivation or the `WDK → SK_section → SK_dir → DEK` key hierarchy.

These vulnerability classes are treated as critical severity.

## Related articles

- [Legal Overview](overview.md)
- [Acceptable Use Policy summary](acceptable-use-policy.md)
