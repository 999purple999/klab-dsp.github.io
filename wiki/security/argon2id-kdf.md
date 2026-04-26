---
title: "Argon2id Key Derivation Function"
slug: "argon2id-kdf"
category: "Security"
tags: ["Argon2id", "KDF", "key-derivation", "PBKDF2", "password-hashing", "OWASP"]
audience: "developer"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/kdf.ts
  - private-sync-worker/src/auth-local.ts
related:
  - "zero-knowledge-model"
  - "key-hierarchy"
  - "aes-gcm-encryption"
  - "account-recovery"
---

# Argon2id Key Derivation Function

## What it is

K-Perception uses Argon2id as the primary key derivation function (KDF) for all new vaults and account passwords. Argon2id is a memory-hard function designed to resist brute-force attacks using GPUs and custom ASICs, which are highly parallel but memory-constrained relative to their compute throughput.

## Parameters

The default profile for all new writes is the OWASP 2023 "first profile":

| Parameter | Value | Meaning |
|-----------|-------|---------|
| algorithm | argon2id | Argon2 variant combining data-dependent (Argon2d) and data-independent (Argon2i) memory access patterns |
| m | 19456 | Memory cost in **KiB** (= 19 MiB exactly) |
| t | 2 | Iterations / time cost |
| p | 1 | Parallelism / lanes |
| dkLen | 32 | Output length in bytes (256-bit AES-GCM key) |
| salt | 16 bytes (random) | Per-derivation random bytes; stored in plaintext alongside the ciphertext |

Reference: [OWASP Password Storage Cheat Sheet (2023)](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

These parameters are stored in a `KdfParams` descriptor alongside the ciphertext so that a different device with different default parameters can still re-derive the same key:

```typescript
// from kdf.ts
export const ARGON2ID_DEFAULT_PARAMS: Argon2idCostParams = {
  algorithm: 'argon2id',
  m: 19456,   // KiB — 19 MiB
  t: 2,
  p: 1,
  dkLen: 32,  // bytes — 256-bit key
}
```

## Why Argon2id instead of PBKDF2

| Property | Argon2id | PBKDF2-SHA256 |
|----------|----------|---------------|
| Memory-hard | Yes (19 MiB required per attempt) | No (trivially parallelisable) |
| GPU-resistant | Yes — memory bandwidth bottleneck | No — easily parallelised on GPU |
| ASIC-resistant | Yes — memory cost makes custom hardware expensive | No |
| OWASP 2023 recommendation | First profile | Fourth profile (at 600,000 iterations) |
| Implementation used | `@noble/hashes/argon2` (pure JS) | `crypto.subtle.deriveBits` (Web Crypto) |
| Approximate derivation time (2024 laptop) | 80–120 ms | ~50 ms at 600,000 iterations |
| Approximate derivation time (2024 mid-range Android) | 250–400 ms | ~120 ms at 600,000 iterations |

Argon2id provides approximately 10,000× greater resistance to GPU brute-force compared to PBKDF2 at equivalent wall-clock time, because GPU memory is expensive and limited.

## Implementation

The pure-JS `argon2id` implementation from `@noble/hashes` is used. This choice was deliberate:

- No native bindings required — works identically in Node.js (Electron main process), browser WebView (Capacitor/Android), and Cloudflare Workers
- No WASM build pipeline
- No `electron-rebuild` headaches
- Performance is acceptable because Argon2's inner loop is dominated by memory bandwidth, not CPU primitives

```typescript
// from kdf.ts
import { argon2id } from '@noble/hashes/argon2'

export async function deriveKeyArgon2id(
  password: string,
  salt: Uint8Array,
  overrides?: Partial<Argon2idCostParams>,
): Promise<Uint8Array> {
  const m     = overrides?.m     ?? ARGON2ID_DEFAULT_PARAMS.m
  const t     = overrides?.t     ?? ARGON2ID_DEFAULT_PARAMS.t
  const p     = overrides?.p     ?? ARGON2ID_DEFAULT_PARAMS.p
  const dkLen = overrides?.dkLen ?? ARGON2ID_DEFAULT_PARAMS.dkLen
  return argon2id(password, salt, { m, t, p, dkLen })
}
```

## Server-side password hashing

Account passwords (email+password auth) are also hashed with Argon2id server-side in the Cloudflare Worker:

```typescript
// from auth-local.ts
const ARGON2_M = 19456
const ARGON2_T = 2
const ARGON2_P = 1

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key  = argon2id(password, salt, { m: ARGON2_M, t: ARGON2_T, p: ARGON2_P, dkLen: 32 })
  return `argon2id:m=${ARGON2_M},t=${ARGON2_T},p=${ARGON2_P}:${b64url(salt)}:${b64url(key)}`
}
```

The stored format is `argon2id:m=19456,t=2,p=1:<salt_b64url>:<hash_b64url>`.

## Legacy PBKDF2 paths

PBKDF2-SHA256 is still supported for reading vaults and verifying passwords written by builds before Wave-2. It is never used for new writes. Three legacy iteration counts are defined:

```typescript
// from kdf.ts
export const PBKDF2_LEGACY_VAULT_ITERS    = 310_000  // personal vault key
export const PBKDF2_LEGACY_SYNC_ITERS     = 100_000  // sync key
export const PBKDF2_LEGACY_RECOVERY_ITERS = 600_000  // recovery code (OWASP 2023 PBKDF2 profile)
```

**Transparent migration:** When a legacy PBKDF2 hash is successfully verified during login, the server immediately re-hashes the password with Argon2id and replaces the stored hash. The next login uses Argon2id. This migration is opaque to the user.

Note: workspace recovery codes use PBKDF2-SHA256 at 600,000 iterations (the `PBKDF2_LEGACY_RECOVERY_ITERS` constant). This is the OWASP 2023 recommendation for PBKDF2-SHA256 and provides reasonable protection for a recovery code which is a 256-bit random value (not a human-chosen password). Future releases may migrate recovery codes to Argon2id; the `argonParams.algorithm` discriminator in `workspace_recovery_wraps` allows transparent migration.

## KdfParams serialization

KDF parameters are stored as a versioned JSON descriptor alongside the ciphertext:

```typescript
// from kdf.ts
export interface KdfParams {
  algorithm: 'argon2id' | 'pbkdf2-sha256'
  m?: number           // Argon2id memory cost (KiB)
  t?: number           // Argon2id iterations
  p?: number           // Argon2id parallelism
  iterations?: number  // PBKDF2 iteration count
  dkLen?: number       // Output length in bytes
  salt: string         // Base64-encoded 16-byte salt
}
```

When a new vault is created, `freshArgon2idParams()` generates a random 16-byte salt and returns the full descriptor. On open, `deriveKeyFromParams()` dispatches to the correct KDF based on `algorithm`.

## Behaviour and edge cases

- A salt of at least 16 bytes is required and always random — deterministic salts are not permitted
- The `overrides` parameter in `deriveKeyArgon2id` allows future profiles (e.g. increased memory cost on higher-end devices) without changing the default
- If `algorithm` is neither `argon2id` nor `pbkdf2-sha256`, `deriveKeyFromParams` throws: `Unsupported KDF algorithm: <algorithm>`

## Related articles

- [Zero-Knowledge Model](zero-knowledge-model.md)
- [Key Hierarchy](key-hierarchy.md)
- [AES-256-GCM Encryption](aes-gcm-encryption.md)
- [Account Recovery](../authentication/account-recovery.md)
