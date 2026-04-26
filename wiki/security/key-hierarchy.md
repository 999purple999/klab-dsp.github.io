---
title: "Workspace Key Hierarchy"
slug: "key-hierarchy"
category: "Security"
tags: ["key-hierarchy", "WDK", "HKDF", "DEK", "workspace", "encryption"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/wdkCrypto.ts
  - src/shared/kdf.ts
  - private-sync-worker/migrations/0011_workspace_full.sql
  - private-sync-worker/migrations/0016_workspace_industrial.sql
  - private-sync-worker/migrations/0020_file_dek_refactor.sql
related:
  - "security-overview"
  - "zero-knowledge-model"
  - "aes-gcm-encryption"
  - "argon2id-kdf"
---

# Workspace Key Hierarchy

## What it is

K-Perception uses a layered key hierarchy so that access to one key does not expose all content. A compromise of a per-file DEK exposes only that file. A compromise of an SK_dir exposes only files in that directory. The WDK, if compromised, exposes the entire workspace — but the WDK never exists in plaintext on the server.

## Full hierarchy

```
password
  └─ Argon2id (m=19456 KiB, t=2, p=1, dkLen=32)
       └─ MVK (Master Vault Key)
            └─ wraps personal vault key material

WDK (Workspace Data Key)
  ├── 32-byte AES-256-GCM key
  ├── Generated once at workspace creation (crypto.subtle.generateKey)
  ├── Wrapped per-device: ECDH(sender.x25519, receiver.x25519) → HKDF → AES-GCM(WDK)
  ├── Server stores: opaque wrapped blob + Ed25519 signature, never the WDK itself
  │
  ├── HKDF-SHA256(WDK, info="kp-section-v1:" + sectionId, salt=0×32)
  │     └─ SK_section (Section Key, per workspace section)
  │          ├── HKDF-SHA256(SK_section, info="kp-dir-v1:" + dirId, salt=0×32)
  │          │     └─ SK_dir (Directory Key = KEK for files in that directory)
  │          │          └─ AES-GCM(SK_dir, random DEK) → wrapped DEK stored in D1
  │          │               └─ AES-GCM(DEK, file plaintext) → file ciphertext in R2
  │          │
  │          └── HKDF-SHA256(SK_section, info="kp-channel-v1:" + channelId, salt=0×32)
  │                └─ SK_channel (Channel Key)
  │
  └── HKDF-SHA256(WDK, info="kp-file-v1:" + attachmentId, salt=0×32)
        └─ legacy file key (keyMode="derived-v1", pre-W4.4 attachments only)
```

## MVK — Master Vault Key

The MVK is derived from the user's vault password using Argon2id (m=19456 KiB, t=2, p=1, dkLen=32). It exists only in memory on the client device. The MVK is used to encrypt and decrypt key blobs stored in the personal vault (the local database). It is never transmitted to the server.

## WDK — Workspace Data Key

The WDK is a random 32-byte AES-256-GCM key generated at workspace creation:

```typescript
// from wdkCrypto.ts
export async function generateWDK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}
```

**WDK wrap protocol (per device):**
1. Sender derives a shared secret: `ECDH(sender.x25519_priv, receiver.x25519_pub)`
2. Derives a wrap key: `HKDF-SHA256(sharedSecret, info="wdk-wrap-v1", salt=0×32)`
3. Encrypts: `wrapped = iv ‖ AES-GCM(wrapKey, iv, WDK_raw)`
4. Signs: `sig = ECDSA-P256(sender.signing_priv, wrapped)`
5. Uploads `{ wrappedKey, sig, senderX25519Pub, senderEd25519Pub }` to the server

The receiving device verifies the Ed25519 signature before proceeding with ECDH decryption. A signature mismatch is treated as a potential man-in-the-middle attack and the unwrap is aborted.

## SK_section — Section Key

Derived deterministically from the WDK using HKDF-SHA256:

```typescript
// from wdkCrypto.ts
const SECTION_KEY_INFO = 'kp-section-v1:'

// HKDF-SHA256(WDK, info="kp-section-v1:" + sectionId, salt=0×32, length=256 bits)
export async function deriveSectionKey(wdk: CryptoKey, sectionId: string): Promise<CryptoKey>
```

Zero-salt HKDF is used intentionally: the ECDH shared secret already provides the entropy, and using a zero-salt makes the derivation deterministic across devices without requiring additional state exchange.

A guest member scoped to section `s` receives only `SK_s`. Because HKDF is not invertible, they cannot compute `SK_s'` for any other section `s'` from `SK_s`.

## SK_dir — Directory Key (KEK)

Derived from SK_section using a second HKDF stage:

```typescript
// from wdkCrypto.ts
const DIR_KEY_INFO = 'kp-dir-v1:'

// HKDF-SHA256(SK_section, info="kp-dir-v1:" + dirId, salt=0×32, length=256 bits)
export async function deriveDirKey(wdk: CryptoKey, sectionId: string, dirId: string): Promise<CryptoKey>
```

The sentinel value `DIR_ROOT_ID = 'root'` is used for files that live at the section root (not inside any folder).

SK_dir acts as a Key Encryption Key (KEK): its purpose is to wrap (encrypt) per-file DEKs, not to directly encrypt file content.

## DEK — Data Encryption Key (per file)

DEKs are random 32-byte values generated fresh for each file upload:

```typescript
// from wdkCrypto.ts
export function generateDek(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32))
}
```

The DEK is wrapped by SK_dir using AES-256-GCM (`wrapDek`), and the wrapped form is stored in D1 as part of the file record (`keyMode = 'wrapped-dek-v1'`). The file content is encrypted with the DEK. The raw DEK is never persisted — only the wrapped form.

**Key mode enum:**
- `derived-v1` — legacy mode (pre-W4.4): file key derived directly from WDK + attachmentId via HKDF. Still supported for reading old attachments.
- `wrapped-dek-v1` — current mode: random DEK wrapped by SK_dir. Required for all new file uploads.

## SK_channel — Channel Key

Derived as a two-step HKDF chain:

```
SK_section = HKDF-SHA256(WDK, info="kp-section-v1:" + sectionId)
SK_channel = HKDF-SHA256(SK_section, info="kp-channel-v1:" + channelId)
```

Default workspace channels use `sectionId = 'default'`.

## Recovery wrap

The WDK can also be wrapped using a recovery phrase. The flow:

1. Client generates 32 bytes of random data, encodes as Crockford Base32 (the recovery code)
2. PBKDF2-SHA256 at 600,000 iterations derives a MasterKey from the recovery code + a random salt
3. An additional HKDF step with `info="wdk-recovery-v1"` scopes the MasterKey
4. `AES-256-GCM(scopedKey, WDK)` produces the recovery wrap, stored in `workspace_recovery_wraps`

The server stores the encrypted WDK and the PBKDF2 parameters. It never sees the recovery code or the MasterKey.

## Behaviour and edge cases

- **Key rotation**: When the WDK is rotated, every derived section key, directory key, and channel key changes (because they are HKDF derivatives of the WDK). All wrapped DEKs must be re-wrapped with the new SK_dir values.
- **Section isolation mode**: Sections with `isolation_mode = 'hkdf-v1'` have their SK explicitly tracked in `workspace_section_keys`. Scoped members receive per-device wraps of the SK rather than the WDK.
- **Directory moves**: Moving a file between directories requires re-wrapping the DEK from the old SK_dir to the new SK_dir (`rewrapDek`).

## Related articles

- [Security Architecture Overview](overview.md)
- [AES-256-GCM Encryption](aes-gcm-encryption.md)
- [Argon2id KDF](argon2id-kdf.md)
- [Zero-Knowledge Model](zero-knowledge-model.md)
