---
title: "Share Link Security Model"
slug: "share-link-security"
category: "Security"
tags: ["share-link", "encryption", "URL-fragment", "PBKDF2", "E2EE"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/shareCrypto.ts
related:
  - "zero-knowledge-model"
  - "aes-gcm-encryption"
  - "e2ee-collaboration"
  - "data-at-rest"
---

# Share Link Security Model

## What it is

Share links allow a K-Perception user to share a note with anyone — even people without a K-Perception account — while maintaining end-to-end encryption. The server stores and serves only ciphertext; the decryption key is delivered to the recipient out-of-band, either in the URL fragment or via a shared password.

## URL fragment delivery (no-password links)

For links without password protection, the encryption key is a 32-byte (256-bit) random value. It is placed in the URL fragment (`#`) of the share URL:

```
https://kperception-share.pages.dev/s/{shareId}#{keyHex}
```

The URL fragment is a browser-enforced privacy mechanism: fragments are **never sent to the server** in HTTP requests, including `Referer` headers. When the recipient's browser fetches the share page, the server sees the path (`/s/{shareId}`) but not the `#{keyHex}` portion.

This means the server cannot decrypt the shared content even if it wanted to — it never receives the key.

From `shareCrypto.ts`:
```typescript
// No-password: generate random key, return as keyHex for URL fragment
const raw = crypto.getRandomValues(new Uint8Array(32))
key    = await importAesKey(raw)
keyHex = bytesToHex(raw)
// ...
// Fragment URL: https://.../s/{id}#{keyHex}
```

## Password-protected links

For password-protected share links, the key is derived from the user's password using PBKDF2-SHA256 at 100,000 iterations with a random 16-byte salt:

```typescript
// from shareCrypto.ts
const derived = await crypto.subtle.deriveKey(
  {
    name:       'PBKDF2',
    salt:       salt,
    iterations: 100_000,
    hash:       'SHA-256',
  },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
)
```

The server stores only the PBKDF2 salt (16 bytes hex), not the password or derived key. The recipient must enter the password in their browser to derive the key and decrypt the content.

## Encryption format

Share payloads are encrypted as:

| Field | Description |
|-------|-------------|
| `ciphertext` | Base64-encoded AES-256-GCM ciphertext of `JSON.stringify({ title, content, mode })` |
| `iv` | Hex (12 bytes = 24 hex chars) — random nonce per encryption |
| `salt` | Hex (16 bytes = 32 hex chars), or `null` for no-password links |
| `pwRequired` | Boolean — whether the recipient must supply a password |

## Revocation

Each share link has a revoke token: 32 bytes of random data. The creator stores the raw token; only the SHA-256 hash is stored on the server. To revoke, the creator sends the raw token to `DELETE /share/:id`; the server computes the hash and validates it.

```typescript
export async function generateRevokeToken(): Promise<{ token: string; hash: string }> {
  const raw   = crypto.getRandomValues(new Uint8Array(32))
  const token = bytesToHex(raw)     // kept by creator
  const hash  = await sha256Hex(token)  // sent to server
  return { token, hash }
}
```

## No-backtrack enforcement

Share links are write-once at creation. The content encrypted into a share link reflects the note at the moment of sharing; subsequent edits to the original note do not automatically update the shared version. This is intentional: the server stores only the ciphertext blob uploaded at share time.

## Real-time collaboration on share links

Share links can optionally enable real-time co-editing via the `/share/collab/create` endpoint. In this mode, the share link key also serves as the encryption key for Y.js CRDT collaboration frames relayed through a DocRoom Durable Object. The DocRoom never sees the plaintext — it relays only encrypted frames. See [E2EE Collaboration](e2ee-collaboration.md).

## What the server stores

The server stores in D1:
- Share ID (UUID)
- Encrypted ciphertext (the AES-GCM blob)
- IV (12 bytes, hex)
- Salt (16 bytes, hex) — for password links only
- `pwRequired` flag
- Expiry timestamp
- Revoke token hash (SHA-256 of the raw revoke token)
- `realtimeDocId` — for collab-enabled links

The server does NOT store:
- The share key (keyHex) — for no-password links, this is only in the URL fragment
- The password — for password links, only the salt is stored
- Any plaintext of the shared note

## Security implications

- **No-password links**: Anyone with the URL can decrypt the content. Treat the share URL as a secret. The URL fragment is not included in server logs, analytics, or `Referer` headers.
- **Password-protected links**: PBKDF2 at 100,000 iterations provides reasonable brute-force resistance for passwords; prefer long, random passwords. Note that this uses PBKDF2 (not Argon2id) — this is confirmed in source.
- **Link expiry**: Links can be set to expire at a future timestamp. After expiry, the server returns `410 Gone`.
- **Revocation**: Link revocation is immediate — the server marks the link as revoked and subsequent fetches return `410 Gone`.

## Related articles

- [Zero-Knowledge Model](zero-knowledge-model.md)
- [AES-256-GCM Encryption](aes-gcm-encryption.md)
- [E2EE Collaboration](e2ee-collaboration.md)
- [Data at Rest](data-at-rest.md)
