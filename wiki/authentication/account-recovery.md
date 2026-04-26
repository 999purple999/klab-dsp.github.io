---
title: "Account Recovery"
slug: "account-recovery"
category: "Authentication"
tags: ["recovery", "recovery-code", "vault", "PBKDF2", "disaster-recovery"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/workspaceRecovery.ts
  - private-sync-worker/migrations/0011_workspace_full.sql
  - src/shared/kdf.ts
related:
  - "auth-overview"
  - "sessions"
  - "argon2id-kdf"
  - "key-hierarchy"
---

# Account Recovery

## What it is

K-Perception uses a 256-bit random recovery code to allow workspace owners to recover access to workspace content after losing their vault password or primary authentication method. The recovery code is generated on first vault setup and shown once — it must be stored safely by the user.

## What the recovery code is

The recovery code is 32 bytes (256 bits) of cryptographically random data encoded in Crockford Base32 (a variant of Base32 that avoids visually ambiguous characters: no `I`, `L`, `O`, or `U`). The encoded result is grouped into 5-character blocks with dashes for readability, for example:

```
0M7G5-XB4KA-PQNZR-...
```

It is NOT a BIP-39 mnemonic phrase — it uses raw random bytes rather than a word list.

## How the recovery code protects your data

The recovery code is used to protect the Workspace Data Key (WDK):

1. User generates recovery code (32 random bytes via `crypto.getRandomValues`)
2. Client decodes the recovery code bytes
3. Client runs PBKDF2-SHA256 at 600,000 iterations over the recovery code bytes with a random salt, producing a 32-byte AES-GCM MasterKey
4. An additional HKDF step with `info="wdk-recovery-v1"` scopes the MasterKey to recovery use only
5. Client encrypts: `AES-256-GCM(scopedMasterKey, WDK_raw)` → `recovery_wrap`
6. Client uploads `{ workspace_id, key_version, wrapped_key: recovery_wrap, argon_params }` to server

The server stores:
- `wrapped_key` — the AES-GCM encrypted WDK
- `argon_params` — the algorithm (`pbkdf2-sha256`), iteration count (600,000), and salt (base64)

The server does NOT store:
- The recovery code
- The MasterKey
- The unencrypted WDK

From `workspaceRecovery.ts`:
```typescript
export function defaultArgonParams(): WorkspaceRecoveryWrap['argonParams'] {
  // algorithm: 'pbkdf2-sha256', t: 600_000 (OWASP 2023 PBKDF2 recommendation)
  ...
}
```

## Why 600,000 PBKDF2 iterations

Recovery codes use PBKDF2-SHA256 at 600,000 iterations (the `PBKDF2_LEGACY_RECOVERY_ITERS` constant). This is the OWASP 2023 recommended iteration count for PBKDF2-SHA256 and provides reasonable brute-force resistance. Because the recovery code has 256 bits of entropy (not a human-chosen password), brute-force is computationally infeasible regardless of the KDF strength.

## Where to find your recovery code

The recovery code is shown once at workspace creation or when explicitly regenerated:

- Settings → Security → Recovery Code (personal vault)
- Workspace Settings → Security → Recovery Code (workspace)

After generation, K-Perception cannot show it again — only the encrypted WDK wrap is stored.

## How to use the recovery code

If you have lost access to your vault password:

1. On the login screen, select "Use recovery code" or "Forgot vault password"
2. Enter your recovery code (a Crockford Base32-encoded string grouped in 5-character blocks with dashes, e.g. `0M7G5-XB4KA-PQNZR-...`)
3. K-Perception derives the MasterKey using PBKDF2-SHA256 (600,000 iterations + stored salt)
4. K-Perception decrypts the WDK using the derived MasterKey
5. You are granted access to your workspace

After successful recovery, you should immediately:
- Set a new vault password
- Regenerate the recovery code (the old code remains valid until you explicitly regenerate it — the server stores only the encrypted WDK wrap, and no automatic invalidation occurs on recovery)

## Recovery code as last resort

**The recovery code is the only way to regain access to encrypted content after losing your vault password.** K-Perception cannot recover your data on your behalf — the zero-knowledge architecture means the server never has access to your keys.

If both the vault password and recovery code are lost:
- Personal vault content is permanently inaccessible
- Workspace content is inaccessible on devices that do not already have the WDK cached

## Personal vault recovery vs workspace recovery

| Type | What is protected | KDF used |
|------|------------------|---------|
| Personal vault | MVK (Master Vault Key) | Not covered by `workspaceRecovery.ts` — personal vault recovery (if implemented) uses a separate mechanism not reviewed here |
| Workspace | WDK (Workspace Data Key) | PBKDF2-SHA256, 600,000 iterations |

## Plan availability

Recovery codes are available on all plans. The workspace recovery code feature requires workspace membership.

## Related articles

- [Authentication Overview](overview.md)
- [Sessions](sessions.md)
- [Argon2id KDF](../security/argon2id-kdf.md)
- [Key Hierarchy](../security/key-hierarchy.md)
