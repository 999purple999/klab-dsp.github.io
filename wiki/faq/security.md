---
title: "Security FAQ"
slug: "faq-security"
category: "FAQ"
tags: ["faq", "security", "encryption", "argon2id", "aes-gcm", "zero-knowledge", "e2ee"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "macos", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/kdf.ts
  - src/main/index.ts
  - src/main/auth.ts
  - src/renderer/src/platform/browserVault.ts
  - mobile/src/platform/biometricAdapter.ts
  - src/shared/shareCrypto.ts
  - src/shared/wdkCrypto.ts
related: ["faq-general", "faq-enterprise", "platform-overview"]
---

# Security FAQ

## What encryption does K-Perception use?

K-Perception uses two cryptographic primitives:

- **Argon2id** — memory-hard key derivation function (KDF) to derive the vault key from your vault password.
- **AES-256-GCM** — authenticated encryption for all stored and transmitted data.

The combination provides confidentiality (you cannot read the ciphertext without the key) and integrity (any tampering with the ciphertext is detected by the GCM authentication tag).

All encryption and decryption happen **on-device**. The server never sees plaintext.

---

## What is Argon2id and why does K-Perception use it?

Argon2id is a **memory-hard** key derivation function — it requires a configurable amount of RAM in addition to CPU time to compute, which makes brute-force password cracking dramatically more expensive.

K-Perception uses the **OWASP 2023 first profile**:
- Memory cost: 19,456 KiB (≈19 MiB)
- Iterations: 2
- Parallelism: 1
- Output: 32 bytes (256-bit AES key)

On a 2024 laptop this derives in ~80–120 ms; on a 2024 mid-range Android phone in ~250–400 ms — fast enough for a good UX, but roughly 10,000× more expensive to brute-force than PBKDF2 with 310,000 iterations (the legacy format).

Argon2id is the OWASP 2023 top recommendation for password hashing and key derivation. It also matches the iOS Keychain default profile.

---

## Is my data safe if Cloudflare is compromised?

Yes. K-Perception stores only **ciphertext** in Cloudflare R2 and D1. Without your vault password (which never leaves your device), the stored bytes are computationally indistinguishable from random data. A full Cloudflare infrastructure compromise would yield only ciphertext to an attacker.

---

## Can government subpoenas access my notes?

K-Perception can only produce what it has: AES-256-GCM ciphertext. Even a valid legal order to the K-Perception backend would yield only opaque ciphertext with no feasible path to decryption without your vault password. This is the same answer for any subpoena served to Cloudflare.

---

## Are share links secure?

Yes. Share links use a **32-byte random key embedded in the URL fragment** (after the `#`). The fragment is:
- Never sent to the server by the browser
- Never logged in server access logs
- Used to decrypt the shared note entirely client-side

A share link recipient's browser downloads the ciphertext and decrypts it locally using the fragment key. The K-Perception server never sees the decryption key.

---

## What is zero-knowledge encryption?

Zero-knowledge encryption means the service provider has no cryptographic ability to access user data. It is a **mathematical guarantee**, not a privacy policy claim.

In K-Perception's case:
1. Your vault password is never sent to any server.
2. The Argon2id-derived vault key exists only in your device's memory while the vault is unlocked.
3. Everything stored on or transmitted to the server is already encrypted.

Contrast this with "encrypted at rest" services where the service provider holds the encryption keys — those are not zero-knowledge.

---

## How is my vault key derived?

1. You enter your vault password.
2. A cryptographically random 32-byte salt (generated on first run) is read from the vault envelope on disk.
3. Argon2id is computed: `key = argon2id(password, salt, {m: 19456, t: 2, p: 1, dkLen: 32})`
4. The resulting 32-byte key is used directly as the AES-256-GCM encryption key.
5. The key is held in memory only for the duration of the unlocked session.

The salt is stored alongside the ciphertext (it does not need to be secret; its purpose is to make rainbow-table attacks impossible even if two users have the same password).

---

## Does K-Perception store my password?

Never. Neither the vault password nor any derivative of it is stored on the server. The only thing stored on disk is the Argon2id KDF descriptor (algorithm, salt, cost parameters), the AES-GCM IV, and the AES-256-GCM ciphertext. Reconstructing the key from those requires the password.

---

## What happens if I lose my recovery code?

If you lose both your vault password and your recovery code, **no recovery is possible**. The recovery code is a second credential that can re-derive your vault key through an alternate path. It should be treated with the same care as your vault password — print it out and store it offline in a secure location.

---

## Are workspace files encrypted?

Yes. Workspace files use a layered key hierarchy:

`WDK (Workspace Data Key) → SK_section (Section Key) → SK_dir (Directory Key) → DEK (per-blob Data Encryption Key) → ciphertext`

Each file blob is encrypted with a unique DEK (`wrapped-dek-v1` key mode). The DEK is wrapped (encrypted) with the directory key, which is in turn derived from the section key, all the way up to the WDK. The WDK is derived from the workspace-level key and is itself encrypted under each member's public key.

The server stores only wrapped ciphertext at every layer.

---

## How does the session token work? Is it safe?

Session tokens are opaque UUIDs with a 7-day TTL. They are:
- **Desktop:** Encrypted with Electron `safeStorage` (DPAPI on Windows, Keychain on macOS) and stored in the `userData` directory.
- **Android:** Stored in Capacitor Preferences (app-private, OS-protected SharedPreferences).
- **Web:** Stored in `localStorage` (not HttpOnly, but the session token is not a cryptographic secret — the vault key is independent and never stored here).

A stolen session token allows API access but **not vault decryption** — the vault key is separate and never leaves the device.

---

## Does real-time collaboration compromise E2EE?

No. Y.js updates are encrypted before being sent to the DocRoom Durable Object. The Worker acts as a **blind relay**: it forwards encrypted Y.js operation bytes without decrypting them. Even in a live collaborative session, the server never sees plaintext.

---

## How is biometric unlock secured on Android?

The biometric unlock stores an AES-256-GCM encrypted hint containing the master vault password in Capacitor Preferences. The encryption key is derived from a stable device install ID and a per-device random salt via PBKDF2 (100,000 iterations). The biometric hardware authenticates the user before the hint is read; a successful biometric check triggers decryption of the hint, yielding the master password for vault re-derivation.

The master password is never stored in plaintext. Biometric unlock can be revoked at any time from Settings → Security.

---

## What happens if my device is stolen?

- **Desktop:** The vault file is AES-256-GCM encrypted on disk. An attacker with physical access to the device still needs your vault password. The session token is encrypted with the OS keychain and is scoped to the OS user account.
- **Android:** Same protection. Additionally, Android's full-disk encryption (or file-based encryption) provides an additional layer of protection at the OS level.
- **Web:** The vault in IndexedDB is encrypted. The session token in `localStorage` could be read if the attacker gains browser-level access (e.g., via another extension), but vault content still requires the vault password.

If a device is stolen and you use cloud sync (Guardian+), you can revoke that device's session from **Account Settings → Sessions**. For workspace members, a workspace admin can trigger **remote wipe** (requires TOTP step-up elevation).

---

## What is cert pinning and does K-Perception use it?

On the **desktop Electron app**, K-Perception installs SPKI (Subject Public Key Info) certificate pinning on the Chromium session. Every TLS handshake to the K-Perception Worker and backend domains is checked against a list of known pinned public key hashes before Chromium's own chain validation. A rogue certificate authority cannot impersonate the backend even if it issues a cert for the K-Perception domain.

Set `KP_DISABLE_CERT_PIN=1` environment variable only in emergencies (this is logged loudly).

---

## Is PBKDF2 still used anywhere?

PBKDF2-SHA256 (310,000 iterations) was the key derivation algorithm for vaults created before Wave-2. It is still accepted on the **read path** for backward compatibility — old vaults open transparently. On the next successful unlock, old vaults are silently re-encrypted with Argon2id. **No new writes use PBKDF2 for vault key derivation.**

PBKDF2 (100,000 iterations) is still used for the biometric hint encryption on Android (a lower-trust path not protecting the vault directly) and for the legacy sync key (`enc2:` envelope). These are legacy paths; new sync writes on desktop use the NDK (`ndk1:` envelope).

---

## Are dangerous operations protected?

Yes. The following operations require a **TOTP step-up token** (an elevation credential separate from the session token):
- Rotate workspace key
- Remote wipe a device
- Transfer workspace ownership
- Delete a workspace
- Restore a workspace backup

This means even a compromised session token cannot trigger these irreversible actions without physical possession of the TOTP device.

---

## What is the NDK (Namespace Data Key)?

The NDK is a **per-installation random 32-byte AES-256-GCM key** generated on the desktop's first vault unlock. Sync payloads are encrypted under this key (`ndk1:` envelope) rather than a password-derived sync key. This provides **forward secrecy for sync blobs**: even if your vault password is later compromised, an attacker cannot retroactively decrypt sync blobs that were written under the NDK. The NDK is stored encrypted on disk (wrapped by the vault key) and is not shared with the server.

---

## How are attachments stored?

Attachments (images, PDFs, audio files, etc.) are stored as base64-encoded blobs inside the encrypted vault. On desktop, file data is read by the main process (via `fs:pickAndReadFiles`), encoded as base64, and passed to the renderer for inclusion in the vault. The main process applies a 20 MB per-file limit. Attachments are encrypted as part of the vault — they are never stored in plaintext on disk or transmitted in plaintext to the server.

---

## Can I verify that my data is encrypted before it reaches the server?

Yes, on desktop. The development build writes a session log to `<project-root>/dev-logs/session.log` that includes all HTTP requests and their status codes. You can also use DevTools (F12) → Network tab to inspect the `POST /sync/changes` request body: the `encryptedPayload` field will be an `enc2:` or `ndk1:` prefixed ciphertext string — never readable JSON.

On all platforms, the `vault:cryptoStatus` IPC call (desktop) or equivalent returns the active envelope type (`ndk1`, `enc2`, or `none`), confirming which encryption path is active.

---

## What is AES-256-GCM and why is it used?

AES-256-GCM (Advanced Encryption Standard, 256-bit key, Galois/Counter Mode) is an **authenticated encryption** algorithm. It provides:
- **Confidentiality:** The ciphertext reveals nothing about the plaintext without the key.
- **Integrity:** The GCM authentication tag detects any tampering with the ciphertext. A modified byte causes decryption to fail with an authentication error.
- **Performance:** AES has hardware acceleration on all modern CPUs and mobile chipsets.

AES-256-GCM is the standard used by TLS 1.3, iCloud Keychain, and Signal. K-Perception uses a random 96-bit IV per encryption operation to ensure no two encryptions of the same data produce the same ciphertext.
