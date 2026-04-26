---
title: "Security Architecture Overview"
slug: "security-overview"
category: "Security"
tags: ["zero-knowledge", "encryption", "architecture", "key-hierarchy", "trust-model"]
audience: "developer"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/kdf.ts
  - src/shared/wdkCrypto.ts
  - src/shared/deviceKeys.ts
  - private-sync-worker/migrations/0001_init.sql
  - private-sync-worker/migrations/0011_workspace_full.sql
related:
  - "zero-knowledge-model"
  - "key-hierarchy"
  - "aes-gcm-encryption"
  - "argon2id-kdf"
  - "threat-model"
---

# Security Architecture Overview

## What it is

K-Perception is built on a zero-knowledge, end-to-end encrypted (E2EE) architecture. Every piece of user content — notes, files, channel messages, workspace metadata — is encrypted on the client device before any data is transmitted to the server. The server (a Cloudflare Worker backed by D1 SQLite and R2 object storage) stores and relays only ciphertext. It never has access to the keys required to decrypt that ciphertext.

## Encryption stack

K-Perception uses two complementary cryptographic primitives throughout:

**Key derivation — Argon2id**
All keys that are derived from a human password use Argon2id (OWASP 2023 first profile): m=19456 KiB, t=2, p=1, output 32 bytes. This is memory-hard and GPU-resistant. Legacy vaults created before Wave-2 used PBKDF2-SHA256 (310,000 iterations for vault keys, 100,000 for sync keys, 600,000 for recovery codes) and can still be read; they are silently upgraded to Argon2id on the next write. The implementation uses `@noble/hashes/argon2` — pure JS that runs identically in Electron, Android WebView, and Cloudflare Workers.

**Content encryption — AES-256-GCM**
All ciphertext is produced by AES-256-GCM: 256-bit key, 12-byte random nonce (IV), 128-bit authentication tag. GCM provides both confidentiality and integrity — a single bit flip in the ciphertext causes decryption to fail with an authentication error before any plaintext is returned. The nonce is generated fresh for every encryption call; it is prepended to the ciphertext blob for storage.

**Device identity — ECDSA P-256 + ECDH P-256**
Each device generates a permanent signing keypair (ECDSA P-256) and a key-agreement keypair (ECDH P-256) at first install. Private keys are stored in OS-level secure storage (Electron `safeStorage` on desktop, Android Keystore on mobile). Public keys are uploaded to the server. The ECDH keypair is used in the WDK wrap protocol (ECDH → HKDF-SHA256 → AES-GCM). The ECDSA keypair signs every wrapped-key blob so that a receiving device can detect tampering.

## Key hierarchy

The full workspace key hierarchy, from user password to individual file bytes:

```
password
  └─ Argon2id ──────────────────────────────────> MVK (Master Vault Key, 32 bytes)
       MVK wraps / unwraps key material in the personal vault.

  WDK (Workspace Data Key, random 32 bytes per workspace)
    ├─ HKDF-SHA256(WDK, "kp-section-v1:" + sectionId) ──> SK_section (per section)
    │    ├─ HKDF-SHA256(SK_section, "kp-dir-v1:" + dirId) ──> SK_dir (KEK, per directory)
    │    │    └─ AES-GCM(SK_dir, DEK) ──────────────────> wrapped DEK (per file)
    │    │         └─ AES-GCM(DEK, plaintext) ──────────> file ciphertext
    │    └─ HKDF-SHA256(SK_section, "kp-channel-v1:" + channelId) ──> SK_channel
    └─ HKDF-SHA256(WDK, "kp-file-v1:" + attachmentId) ──> file key (legacy derived mode)
```

The WDK is wrapped per-device using ECDH key agreement. Guests receive only the section key(s) they are scoped to — they cannot compute any other section key because HKDF is not invertible.

## Trust model

**The server is untrusted.** K-Perception's security does not rely on the honesty or security of the Cloudflare Worker, the D1 database, or the R2 object store. A complete compromise of the server backend would expose:

- Encrypted blobs (ciphertext) — unreadable without keys
- Metadata: timestamps, file sizes, user IDs, workspace membership (who belongs to which workspace)
- The structure of the key hierarchy (which keys exist, not their values)

A server compromise would NOT expose:
- Any plaintext content (notes, files, channel messages)
- Any private keys (they never leave the device)
- The WDK or any derived section/directory/file key

## Threat model summary

| Threat | Protected? | Notes |
|--------|-----------|-------|
| Server compromise / data breach | Yes | Server holds only ciphertext |
| Network interception | Yes | TLS in transit + E2EE at rest |
| Weak password brute force | Partial | Argon2id makes this expensive; depends on password strength |
| Device compromise (OS-level) | No | Keys in memory can be extracted if the OS is compromised |
| Metadata analysis | No | Timestamps, sizes, and membership are not encrypted at the field level |
| Legal compulsion | No | Server can comply with lawful requests but can only hand over ciphertext |

## Plan availability

The security architecture described here applies to all plans (local, guardian, vault, lifetime, team, enterprise). Some security features — IP allowlist, TOTP step-up, SCIM provisioning, SSO — are available on team and enterprise plans only.

## Related articles

- [Zero-Knowledge Model](zero-knowledge-model.md)
- [Key Hierarchy](key-hierarchy.md)
- [AES-256-GCM Encryption](aes-gcm-encryption.md)
- [Argon2id KDF](argon2id-kdf.md)
- [Threat Model](threat-model.md)
