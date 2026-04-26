---
title: "AES-256-GCM Encryption"
slug: "aes-gcm-encryption"
category: "Security"
tags: ["AES-GCM", "encryption", "authenticated-encryption", "nonce", "ciphertext"]
audience: "developer"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/wdkCrypto.ts
  - src/shared/shareCrypto.ts
  - src/shared/kdf.ts
related:
  - "key-hierarchy"
  - "zero-knowledge-model"
  - "argon2id-kdf"
  - "e2ee-collaboration"
---

# AES-256-GCM Encryption

## What it is

K-Perception uses AES-256-GCM (Advanced Encryption Standard, 256-bit key, Galois/Counter Mode) as the single symmetric encryption algorithm throughout the system. Every encrypted field — note content, file content, workspace names, channel messages, wrapped key material, audit event bodies — is produced by AES-256-GCM.

GCM is an authenticated encryption with associated data (AEAD) mode. It provides both:
- **Confidentiality** — ciphertext reveals nothing about the plaintext without the key
- **Integrity** — any modification to the ciphertext (including the IV or any ciphertext byte) causes decryption to fail with an authentication error, before any plaintext is returned

## Algorithm parameters

| Parameter | Value |
|-----------|-------|
| Algorithm | AES-GCM |
| Key length | 256 bits (32 bytes) |
| IV (nonce) length | 96 bits (12 bytes) |
| Authentication tag length | 128 bits (16 bytes) |
| Implementation | `crypto.subtle.encrypt` / `crypto.subtle.decrypt` (Web Crypto API) |

These parameters follow NIST SP 800-38D recommendations. The 12-byte nonce is the recommended size for GCM; it allows the internal counter to reach its maximum value before wrapping.

## On-wire format

Every encrypted blob produced by `encryptWithKey` in `wdkCrypto.ts` uses the following layout:

```
| IV (12 bytes) | Ciphertext + GCM tag (variable) |
```

The IV is prepended to the ciphertext and stored or transmitted as a single base64-encoded blob. The GCM authentication tag (16 bytes) is appended to the ciphertext by `crypto.subtle.encrypt` automatically and verified by `crypto.subtle.decrypt`.

Example from `wdkCrypto.ts`:
```typescript
export async function encryptWithKey(key: CryptoKey, plaintext: Uint8Array): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, toStrictArrayBuffer(plaintext)
  )
  const out = new Uint8Array(12 + ciphertext.byteLength)
  out.set(iv)
  out.set(new Uint8Array(ciphertext), 12)
  return bufToBase64(out.buffer)
}
```

## Nonce uniqueness requirement

AES-GCM requires that the (key, nonce) pair is unique across all encryptions. Reusing the same nonce with the same key is a catastrophic failure: it allows an attacker to recover the plaintext XOR and forge authentication tags.

K-Perception guarantees nonce uniqueness by generating 12 bytes of cryptographically random data (`crypto.getRandomValues`) for every encryption call. With 96 bits of randomness, the probability of a nonce collision on the same key across 2^32 encryptions is approximately 2^{-33} — well below any practical concern.

Key rotation (WDK rotation) additionally bounds the number of encryptions per key.

## What happens on tag mismatch

If the authentication tag does not match — due to ciphertext corruption, a tampered blob, or use of the wrong key — `crypto.subtle.decrypt` throws a `DOMException`. The caller catches this and returns an error. No partial plaintext is ever returned.

From `wdkCrypto.ts`:
```typescript
export async function unwrapDek(wrapped: Uint8Array, kek: CryptoKey): Promise<Uint8Array> {
  if (wrapped.byteLength < 12 + 16) {
    throw new Error('[wdkCrypto] wrapped DEK shorter than IV+tag')
  }
  // crypto.subtle.decrypt throws on GCM auth failure — callers MUST surface this
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, kek, toStrictArrayBuffer(ct),
  )
  return new Uint8Array(raw)
}
```

From `shareCrypto.ts`:
```typescript
try {
  plaintext = await crypto.subtle.decrypt(...)
} catch {
  throw new Error('Decryption failed — wrong key or corrupted data.')
}
```

## Where AES-GCM is used

| Location | Key used | Purpose |
|----------|---------|---------|
| Note / file content blobs (R2) | DEK (W4.4+) or WDK-derived file key (legacy) | Encrypts user content |
| Wrapped key blobs | Wrap key (HKDF from ECDH shared secret) | Encrypts WDK for device delivery |
| Per-file DEK wrapping | SK_dir | Wraps the DEK for storage in D1 |
| Section key wrapping | Wrap key | Wraps SK for scoped-member delivery |
| Workspace recovery wrap | PBKDF2-derived MasterKey (scoped via HKDF) | Wraps WDK for disaster recovery |
| Share link payload | Random key (keyHex) or PBKDF2-derived key | Encrypts shared note content |
| TOTP secrets at rest | `WORKSPACE_TOTP_ENC_KEY` (server-side AES-GCM) | Encrypts TOTP secrets in D1 |
| Encrypted workspace metadata columns | WDK | Encrypts `name_enc`, `description_enc`, etc. |
| Guest projection keys | WDK, then one-time fragment key | Double-wraps section access tokens |

## Platform differences

AES-256-GCM is implemented via the Web Crypto API (`crypto.subtle`) on all three platforms:
- **Desktop (Electron)**: Node.js Web Crypto API, available since Electron 15 / Node 16
- **Android (Capacitor WebView)**: Android WebView Web Crypto API
- **Web**: Browser Web Crypto API

No platform-specific native code or WASM is required for AES-GCM.

## Security implications

- Tag mismatch is always a hard error — the caller is required to surface it, not swallow it
- The server can verify the SHA-256 hash of the plaintext (stored as `payload_hash`) but cannot compute it without knowing the plaintext, so this does not undermine the zero-knowledge property
- TOTP secrets are also AES-GCM encrypted at rest in D1 using the Worker's `WORKSPACE_TOTP_ENC_KEY` binding — the server can decrypt these, but only with the binding key which is a server-side secret, not a user-derived key

## Related articles

- [Key Hierarchy](key-hierarchy.md)
- [Zero-Knowledge Model](zero-knowledge-model.md)
- [Argon2id KDF](argon2id-kdf.md)
- [E2EE Collaboration](e2ee-collaboration.md)
