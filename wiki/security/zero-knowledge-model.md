---
title: "Zero-Knowledge Model"
slug: "zero-knowledge-model"
category: "Security"
tags: ["zero-knowledge", "E2EE", "encryption", "key-derivation", "privacy"]
audience: "developer"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/kdf.ts
  - src/shared/wdkCrypto.ts
  - private-sync-worker/migrations/0001_init.sql
  - private-sync-worker/migrations/0011_workspace_full.sql
related:
  - "security-overview"
  - "key-hierarchy"
  - "argon2id-kdf"
  - "aes-gcm-encryption"
  - "data-at-rest"
---

# Zero-Knowledge Model

## What it is

"Zero-knowledge" in K-Perception means that the server is cryptographically incapable of reading user content — not merely contractually prohibited from doing so. This is a technical property of the architecture, not a policy statement.

The term is used in the practical sense common in secure communication systems (similar to Signal's definition): the server processes and stores data but cannot derive meaningful information from it because every piece of content is encrypted with keys that are derived and held exclusively on client devices.

This is distinct from the mathematical definition of a zero-knowledge proof, which involves interactive proof systems. K-Perception does not use zero-knowledge proofs.

## The derivation chain

The chain from user password to uploaded ciphertext proceeds as follows:

```
User password (string)
  + Salt (16 random bytes, stored in plaintext alongside ciphertext)
  |
  v
Argon2id KDF
  m=19456 KiB, t=2, p=1, dkLen=32
  |
  v
MVK — Master Vault Key (32 bytes, AES-256-GCM key)
  |
  v  (client wraps WDK for each device using ECDH + HKDF)
WDK — Workspace Data Key (32 bytes, random, per workspace)
  |
  v  (HKDF-SHA256, non-invertible)
SK_section / SK_dir / DEK  (see key-hierarchy.md)
  |
  v
AES-256-GCM encryption of plaintext content
  |
  v
Ciphertext blob — uploaded to R2 / stored in D1
```

At no point in this chain does the server see:
- The user's password
- The derived MVK
- The WDK or any WDK-derived key
- The plaintext of any content field

## What the server receives

When a client uploads content, the server receives:

1. **Ciphertext** — the AES-256-GCM encrypted payload, including the 12-byte IV prepended to the blob
2. **KDF parameters** — the Argon2id salt and cost parameters, stored alongside the ciphertext so a different device can re-derive the same key
3. **Structural metadata** — object type, object ID, sequence number, timestamp, payload hash (SHA-256 of the plaintext computed client-side before encryption)
4. **Wrapped key material** — the WDK encrypted for each member's device using ECDH key agreement. The server stores these wrapped blobs but cannot unwrap them.

The payload hash (#3) is a SHA-256 digest of the plaintext before encryption. It allows the server to detect accidental corruption but does not allow the server to learn the content. SHA-256 is a one-way function; knowing the hash does not reveal the plaintext.

## What the server can see

| Datum | Server visible? | Notes |
|-------|----------------|-------|
| Note / file / channel plaintext | No | All encrypted before upload |
| Workspace name / description | No | Stored in `name_enc` / `description_enc` columns (AES-GCM ciphertext) |
| User IDs | Yes | Server-generated UUIDs |
| Timestamps | Yes | ISO 8601, stored in plaintext |
| File sizes | Yes | `ciphertext_size` stored in plaintext |
| Workspace membership | Yes | Who belongs to which workspace |
| Audit event types | Yes | Event type strings (e.g. `sign_in`, `rotate_key`); event bodies are encrypted |
| Wrapped key blobs | Yes | Opaque ciphertext; server cannot unwrap |
| Argon2id salt and cost params | Yes | Required for cross-device re-derivation |

## Threat scenarios

**Scenario 1: Server database fully compromised.**
An attacker with read access to all D1 rows and all R2 blobs can see timestamps, file sizes, workspace membership, user IDs, and ciphertext. They cannot decrypt any content without the users' passwords and a successful Argon2id derivation (which requires ~80–400 ms and 19 MiB of memory per attempt on modern hardware).

**Scenario 2: Server-side code execution.**
An attacker who can execute arbitrary code in the Cloudflare Worker can intercept API requests and responses — but they still cannot see the plaintext content of sync blobs because those are encrypted before the HTTP request is made by the client. They could, however, read session tokens from request headers and impersonate users.

**Scenario 3: Malicious server returning tampered ciphertext.**
AES-256-GCM's authentication tag detects any modification to the ciphertext. If the server returns tampered bytes, the client's `crypto.subtle.decrypt` call throws an error and no plaintext is returned. The client cannot silently receive corrupted data.

## Backup codes and recovery

The workspace recovery code is a 256-bit random value encoded in Crockford Base32. To protect the WDK with this code, the client runs PBKDF2-SHA256 at 600,000 iterations over the recovery code bytes to derive a master key, then wraps the WDK under that master key using AES-256-GCM. The server stores only the encrypted WDK (`wrapped_key`) and the Argon2id/PBKDF2 parameters — not the recovery code itself.

See [Account Recovery](../authentication/account-recovery.md) for the user-facing flow.

## Related articles

- [Security Architecture Overview](overview.md)
- [Key Hierarchy](key-hierarchy.md)
- [Argon2id KDF](argon2id-kdf.md)
- [AES-256-GCM Encryption](aes-gcm-encryption.md)
- [Data at Rest](data-at-rest.md)
