---
title: "K-Perception Threat Model"
slug: "threat-model"
category: "Security"
tags: ["threat-model", "security", "attack-surface", "privacy", "risk"]
audience: "developer"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/kdf.ts
  - src/shared/wdkCrypto.ts
  - private-sync-worker/src/session.ts
  - private-sync-worker/migrations/0001_init.sql
related:
  - "security-overview"
  - "zero-knowledge-model"
  - "data-at-rest"
  - "session-security"
---

# K-Perception Threat Model

## Scope

This document describes what K-Perception is designed to protect against, what it explicitly does not protect against, and the assumptions the security model depends on.

## Threat model summary

| Threat | Protected? | Mechanism |
|--------|-----------|-----------|
| Server-side data breach (full DB + R2 dump) | Yes | All content encrypted client-side; server holds only ciphertext |
| Network interception (passive eavesdropping) | Yes | TLS + E2EE layered defense |
| TLS termination at CDN edge | Yes | Content is E2EE regardless of TLS |
| Malicious server returning tampered ciphertext | Yes | AES-GCM authentication tag detects any modification |
| Weak password brute force | Partial | Argon2id (m=19456 KiB, t=2, p=1) makes GPU attacks expensive |
| Strong random password brute force | Yes | 2^n entropy for n-bit random password |
| Device theft (locked device) | Partial | Keys in OS-protected storage; depends on OS security |
| Device compromise (OS-level malware) | No | Keys in memory are extractable by OS-level attacker |
| Legal compulsion / lawful intercept | No | Server can comply but can only hand over ciphertext |
| Metadata analysis (who communicates with whom, when) | No | Timestamps, file sizes, user IDs are stored in plaintext |
| Insider threat (K-Perception employee with server access) | Yes | Zero-knowledge — server employees cannot read content |
| Session token theft (without TOTP) | Partial | Attacker can make API calls but cannot decrypt content |
| Session token + TOTP theft | Partial | Dangerous operations require TOTP step-up |
| MITM during WDK wrap delivery | Yes | Ed25519 signature on wrapped key; mismatch aborts unwrap |
| Share link URL interception (no-password) | Partial | Fragment not sent to server; vulnerable to URL leakage |

## What K-Perception protects

### Content confidentiality from server compromise

If an attacker gains full read access to the Cloudflare Worker, D1, and R2, they cannot read the content of any note, file, or channel message. All content is encrypted with AES-256-GCM keys that are derived and held on client devices and never transmitted to the server.

### Network interception

K-Perception employs defense-in-depth: TLS protects data in transit (Cloudflare handles TLS termination at the edge), and E2EE ensures that even a TLS compromise does not expose content because the ciphertext arriving at the server is already the final ciphertext.

### Tampered ciphertext

AES-256-GCM's 128-bit authentication tag detects any modification to a ciphertext blob. A malicious server returning tampered bytes causes `crypto.subtle.decrypt` to throw before any plaintext is returned to the application.

### WDK delivery integrity

When the Workspace Data Key (WDK) is wrapped for a new device, the sender signs the wrapped blob using ECDSA P-256. The receiver verifies the signature before proceeding with ECDH decryption. An invalid signature (which could indicate a man-in-the-middle substituting a different wrapped key) causes the unwrap to abort with an error.

## What K-Perception does not protect

### Metadata

The following are stored in plaintext in D1 and are visible to the server and any attacker who accesses D1:

- User IDs (server-generated UUIDs)
- Timestamps (`created_at`, `updated_at`, `server_accepted_at`, etc.)
- File sizes (`ciphertext_size`)
- Workspace membership (which user belongs to which workspace, with which role)
- Session activity (which device accessed which namespace, when)
- IP address hashes in audit events (`actor_ip_hash`)
- Audit event types (e.g. `sign_in`, `rotate_key`, `password_changed`) — event bodies are encrypted

Content metadata (workspace name, folder name, file name, note title) IS encrypted in dedicated `*_enc` columns.

### Device compromise

If an attacker achieves OS-level code execution on a user's device (via malware, physical access, or an OS exploit), they can:
- Read keys from process memory
- Extract session tokens from storage
- Capture keystrokes (including vault passwords)
- Decrypt any content the user has open

K-Perception cannot protect against a compromised OS. The security model assumes the client device is trusted.

### Weak passwords

Argon2id significantly raises the cost of brute-force attacks, but it cannot compensate for a very weak password (e.g. a common dictionary word). Users should use a password manager to generate and store a high-entropy vault password.

The Argon2id parameters (m=19456 KiB, t=2, p=1) mean each brute-force attempt requires ~19 MiB of memory and ~80–400 ms. A dedicated GPU cluster could still attempt millions of guesses per day against a weak password.

### Legal compulsion

K-Perception's servers can comply with lawful access requests. However, the server can only provide what it has: ciphertext, metadata, and session information. It cannot provide plaintext content because it does not have the decryption keys.

This is a technical limitation, not a policy choice. K-Perception cannot provide plaintext to law enforcement even if it wanted to.

### Share link URL leakage (no-password links)

For no-password share links, the encryption key is in the URL fragment. If the URL is copy-pasted into a server-logged field (e.g. a search engine, a chat message scanner, or a browser extension that uploads URLs), the key may be exposed. Password-protected links mitigate this risk.

## Security assumptions

The security model depends on these assumptions being true:

1. **The client device is not compromised** — OS integrity, process isolation, and secure storage hold
2. **The cryptographic primitives are sound** — AES-256-GCM, ECDH P-256, ECDSA P-256, HKDF-SHA256, Argon2id, and PBKDF2-SHA256 are not broken
3. **The user's vault password has sufficient entropy** — Argon2id cannot compensate for trivially guessable passwords
4. **Cloudflare's edge infrastructure correctly reports `CF-Connecting-IP`** — IP allowlist enforcement depends on this header being accurate

## Workspace roles and scope

Within the zero-knowledge model, workspace access control (roles: `owner`, `admin`, `editor`, `commenter`, `viewer`, `guest`) is enforced at the API layer. A server compromise that bypasses role checks would expose: metadata about all members, wrapped key blobs (still protected by ECDH key agreement), and ciphertext (still protected by AES-GCM). Role enforcement is not a substitute for encryption.

## Related articles

- [Security Architecture Overview](overview.md)
- [Zero-Knowledge Model](zero-knowledge-model.md)
- [Data at Rest](data-at-rest.md)
- [Session Security](session-security.md)
