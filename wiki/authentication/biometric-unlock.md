---
title: "Biometric Unlock"
slug: "biometric-unlock"
category: "Authentication"
tags: ["biometric", "fingerprint", "Android-Keystore", "unlock", "vault"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["android"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/clientState.ts
  - src/shared/encryptedSpaces.ts
  - src/shared/noteOps.ts
related:
  - "auth-overview"
  - "sessions"
  - "session-security"
  - "account-recovery"
---

# Biometric Unlock

## What it is

Biometric unlock allows Android users to unlock their K-Perception vault using a fingerprint or face scan instead of entering the vault password every time the app is opened. It is available on Android devices that have biometric hardware and a biometric credential enrolled.

Biometric unlock is not available on desktop (Windows) or web.

## How it works

Biometric unlock is implemented using the Android Keystore system:

1. **Setup**: When the user enables biometric unlock, the vault key (or a wrapping key) is imported into the Android Keystore under a key alias that requires biometric authentication to use.
2. **Unlock attempt**: When the user opens the app, Android presents the biometric prompt (fingerprint scanner or face ID).
3. **Success**: On successful biometric authentication, the Keystore releases the protected key to the application.
4. **Vault decryption**: The app uses the released key to decrypt the vault.

The actual implementation (`mobile/src/platform/biometricAdapter.ts`) works as follows: the master password (vault password) is AES-256-GCM encrypted with a key derived via PBKDF2-SHA256 (100,000 iterations) from the device's install ID and a per-install random salt. This encrypted copy ("hint") is stored in Capacitor Preferences (app-private, OS-protected at rest). The Android Keystore is NOT directly used for the vault key. When biometric authentication succeeds, the hint is decrypted and the master password is passed to the vault unlock function, which re-derives the full vault session key via Argon2id as normal.

## What biometric protects

Biometric unlock protects the vault key at rest on the device. Without biometric authentication:
- The vault cannot be decrypted
- Encrypted notes and files remain inaccessible
- The session token (if still valid) cannot be used to access content without the vault key

Biometric unlock does not provide access to the K-Perception server — a separate session token is still required for API calls.

## Vault password still required

Biometric unlock is an alternative to typing the vault password. The vault is still encrypted with a key derived from the vault password. Biometric unlock speeds up the process of presenting that key to the app without requiring the user to type the password.

The vault password remains the primary credential. Scenarios where the vault password is still required:
- First time the app is opened after install
- After the biometric enrollment is changed on the device (if the device's biometric hardware reports biometrics as unavailable or unenrolled, biometric unlock is disabled and the password path is required)
- After the app is uninstalled and reinstalled
- When explicitly signing out and signing back in

## Encrypted spaces

K-Perception supports "work-private" encrypted spaces that use a separate passphrase instead of biometric-gated access. From `encryptedSpaces.ts`:

```
"Work-private" — biometric-gated separate passphrase → passphrase mode
```

These spaces require explicit passphrase entry and are not unlocked by biometric authentication alone.

## Platform availability

| Platform | Biometric unlock |
|----------|-----------------|
| Android | Available (Capacitor Preferences + PBKDF2-encrypted hint) |
| Desktop (Windows) | Not available |
| Web | Not available |

Electron `safeStorage` on desktop uses OS-level encryption (macOS Keychain, Windows DPAPI) for session storage but this is transparent — it does not require explicit biometric authentication to open the app.

## Security implications

- Biometric data never leaves the device or the Keystore — K-Perception does not receive or process biometric templates
- Android Keystore provides hardware-backed key storage on devices with a secure enclave
- If the device is compromised at the OS level, the Keystore keys could potentially be extracted
- Biometric spoofing (fake fingerprint, photo face scan) depends on the quality of the device's biometric sensor

## Settings reference

Settings → Biometric unlock (Android only)

Toggle to enable or disable biometric unlock. Disabling returns to vault-password-required unlock.

## Related articles

- [Authentication Overview](overview.md)
- [Sessions](sessions.md)
- [Session Security](../security/session-security.md)
- [Account Recovery](account-recovery.md)
