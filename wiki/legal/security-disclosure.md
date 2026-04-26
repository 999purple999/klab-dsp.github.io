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

K-Perception takes security seriously. If you believe you have found a security vulnerability in the K-Perception application, infrastructure, or any related service, please follow this responsible disclosure policy before taking any other action.

The following represents standard responsible disclosure practice. Contact security@kperception.com to confirm specific scope, response SLAs, and bug bounty status before relying on the details below.

## What to report

Please report security vulnerabilities that affect:

- The K-Perception Cloudflare Worker backend (API endpoints, authentication, data access controls).
- The K-Perception desktop application (Electron, Windows/macOS).
- The K-Perception Android application.
- The K-Perception web application (progressive web app, share page).
- Cryptographic implementation issues (key derivation, encryption, the key hierarchy).
- Any issue that could allow an attacker to access another user's encrypted data, session tokens, or workspace resources without authorisation.

## What is out of scope

The following items are generally out of scope; contact security@kperception.com to confirm current scope with the security team.

- Vulnerabilities in third-party libraries where the vulnerability is already publicly known and a patch is not yet available.
- Issues that require physical access to a user's device.
- Social engineering attacks against K-Perception employees.
- Theoretical vulnerabilities without a demonstrated proof of concept.
- Rate limiting or brute-force issues on non-sensitive endpoints.
- Issues on systems not operated by K-Perception (e.g., Cloudflare infrastructure vulnerabilities should be reported to Cloudflare).

## How to report

**Email:** security@kperception.com

Please include in your report:

- A clear description of the vulnerability.
- The affected component (backend API, desktop app, Android app, web app, etc.).
- Steps to reproduce the vulnerability, including any payloads, screenshots, or proof-of-concept code.
- Your assessment of the severity and potential impact.
- Whether you have exploited the vulnerability or disclosed it to any third party.

**Encrypt sensitive reports:** If your report contains sensitive information (e.g., credentials, session tokens you obtained as part of testing), please encrypt it. Contact security@kperception.com to request a PGP key or alternative secure channel.

## Response timeline

The following timelines are targets; contact security@kperception.com for the current committed SLAs.

| Milestone | Target timeline |
|-----------|----------------|
| Acknowledgement of report | Within 2 business days |
| Initial severity assessment | Within 5 business days |
| Status update | Every 7–14 days while investigation is ongoing |
| Fix deployed (critical/high) | Within 30 days |
| Fix deployed (medium/low) | Within 90 days |
| Coordinated public disclosure | Agreed with reporter after fix |

## Safe harbour

If you follow this policy and report a vulnerability in good faith, K-Perception will:

- Not pursue legal action against you for your research.
- Work with you towards coordinated disclosure.
- Credit you for your finding (unless you prefer to remain anonymous).

Contact legal@kperception.com to confirm safe harbour terms.

Reverse engineering for security research must be limited to what is strictly necessary to identify and document the vulnerability. Do not access, modify, or delete data belonging to other users.

## Bug bounty

Contact security@kperception.com to ask about bug bounty eligibility before submitting a report.

## Cryptographic security context

K-Perception's zero-knowledge architecture means that the most impactful vulnerability classes are those that could:

1. Allow an attacker to extract plaintext keys from memory or device storage.
2. Bypass authentication and gain access to another user's workspace.
3. Cause the client to transmit plaintext content to a server it should not trust (e.g., through a compromised share link URL parsing).
4. Undermine the integrity guarantees of the AES-256-GCM ciphertext (e.g., GCM tag forgery).
5. Compromise the Argon2id key derivation or the `WDK→SK_section→SK_dir→DEK` key hierarchy.

These vulnerability classes are treated with the highest severity.

## Related articles

- [Legal Overview](overview.md)
- [Acceptable Use Policy summary](acceptable-use-policy.md)
- [Security: Zero-Knowledge Architecture](../security/zero-knowledge.md)
