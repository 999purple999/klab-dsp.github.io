---
title: "Creating your first vault"
slug: "first-vault"
category: "Getting Started"
tags: ["vault", "password", "argon2id", "recovery-code", "encryption", "setup", "first-run"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web", "macos"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/lib/crypto.ts"
  - "src/lib/vault.ts"
  - "src/components/VaultSetupWizard.tsx"
  - "src/lib/recoveryCode.ts"
related: ["overview", "account-and-login", "install-windows", "install-android", "web-pwa", "choosing-a-plan"]
---

# Creating your first vault

## What it is

A vault is the encrypted container that holds all your notes, files, and settings. Every K-Perception installation has exactly one vault. The vault is protected by a master vault key (MVK) that is derived from your vault password. The key never leaves your device, and the server never has access to it.

"Creating your first vault" refers to the first-run wizard that runs the first time you open K-Perception on a device. By the end of the wizard, the following has happened on your device:

- A random 16-byte salt has been generated
- Argon2id (m=19 MiB, t=2, p=1) has run on your password + salt to produce the MVK
- A local encrypted database has been created to store notes and key material
- A recovery code (a 24-word offline passphrase) has been generated and shown to you once
- If you have a paid plan, the vault is registered with the Workers backend and your first cloud sync is queued

## When to use it

You create a vault once per device. After that, you open the vault by entering your vault password (or using biometric unlock on Android). If you replace your device, you go through the vault setup wizard again on the new device and enter your existing account credentials — the wizard will download your encrypted vault key material from the server instead of generating new key material.

## Step by step

### Step 1 — Choose your vault password

The vault setup wizard opens automatically on first launch. The first screen asks you to choose a vault password.

**Requirements:**
- At least 12 characters
- At least one uppercase letter, one lowercase letter, one digit, and one special character (`!@#$%^&*`...)
- OR a passphrase of at least five words with spaces (the wizard detects word-boundary patterns and accepts them without character-class requirements)

**How to choose a good password:**

The strongest approach is a randomly generated passphrase of four or more unrelated words: "marble correct lantern pivot seaweed" is an example. At six common words, this passphrase has approximately 77 bits of entropy. The Argon2id key derivation (m=19 MiB, t=2, p=1) is intentionally memory-hard, requiring roughly 19 MiB of RAM and hundreds of milliseconds per attempt, which severely limits offline brute-force speed. A six-word passphrase at those rates would take longer than the age of the universe to exhaust.

Avoid:

- Passwords you use elsewhere (password reuse is the most common way accounts are compromised)
- Passwords containing your name, birthdate, or other personally identifiable information
- Passwords under 12 characters, even with special characters (they fall to dictionary attacks quickly)

Type your password, then type it again in the confirmation field. A strength meter below the fields gives you a real-time estimate. The wizard will not proceed unless the strength meter reaches "Strong" or better.

### Step 2 — Understand the salt

When you click "Continue" after entering your password, the wizard generates a random 16-byte salt. A salt is a random value added to your password before hashing. Its purpose is to ensure that two users with the same password produce different derived keys, and to prevent precomputed dictionary attacks (rainbow tables).

The salt is stored in plaintext in your local vault database and — for paid plans — on the server alongside your account record. This is safe: a salt is not secret. Knowing the salt does not help an attacker who does not also know your password. The salt's job is uniqueness and rainbow-table prevention, both of which it achieves in plaintext.

You do not need to do anything with the salt; the app handles it automatically. It is documented here because some users wonder why the "forgot password" flow is impossible — the answer is that there is nothing on the server that would allow password recovery, and the salt being public is part of that design.

### Step 3 — Understand why "forgot password" does not exist

K-Perception cannot recover your vault if you forget your vault password. This is a consequence of the zero-knowledge design, not an oversight.

Here is why: the master vault key exists only in your device's memory during an active session. It is never sent to the server in any form. The server stores only your encrypted key material (wrapped under the MVK) and your salt. Without the MVK, the server cannot decrypt your key material. Without your password, the MVK cannot be recomputed. There is no backdoor, no escrow, and no "reset via email" path.

This is the privacy moat that makes K-Perception genuinely zero-knowledge. The trade-off is that if you forget your password and lose your recovery code, your notes are permanently unrecoverable. This is why storing your recovery code safely is so important.

### Step 4 — Save your recovery code

After your vault is created, the wizard shows your recovery code: a 24-word phrase that looks like this (this is a fictional example):

```
anchor voyage candle river marble correct lantern pivot
seaweed thunder blossom fence castle north glimmer drift
harvest copper signal echo whale prism mirror cedar
```

The recovery code is derived from your vault key material using PBKDF2 with a distinct domain-separation string. It is a deterministic function of your vault keys; if you lose your password, you can enter the recovery code in the recovery flow and the app will re-derive your vault keys from it.

**Where to store the recovery code:**

- Write it on paper and store it in a secure physical location (a locked drawer, a safe, a fireproof box)
- Store a second copy in a different physical location (a family member's house, a safe deposit box)
- If you use a password manager for other accounts, you can store it there as a note — but be aware that if your password manager is your only copy, you have a single point of failure

**Where not to store the recovery code:**

- In K-Perception itself (if you cannot open the vault, you cannot access the code)
- In an unencrypted email or message
- In a cloud notes app without encryption (Evernote, Apple Notes without lock, Google Keep)
- As a photo on your phone's camera roll (camera rolls are often backed up to cloud services in plaintext)

The wizard will not let you proceed until you tick "I have saved my recovery code in a safe place." This is not a formality. Users who skip this step and later forget their password have no recourse.

### Step 5 — Create your first note

After the wizard completes, the main editor window opens. To create your first note:

1. Click or tap the **+** button in the sidebar (desktop) or the floating action button (Android/web).
2. Type a title.
3. Choose an editor mode from the dropdown in the note header. The default is Markdown. See [What is K-Perception?](overview.md) for a description of each mode.
4. Type some content.
5. The note is saved automatically as you type. There is no manual save button; every keystroke triggers a debounced autosave.

### Step 6 — Understand the first cloud sync

If you are on a paid plan and have cloud sync enabled, the first sync happens shortly after the vault is created. Here is what happens:

1. The app generates a set of vault encryption keys. The root key is the MVK you derived in step 1. Child keys are derived from the root using HKDF.
2. The keys are serialised, encrypted under the MVK using AES-256-GCM, and uploaded to the Workers backend as your "vault key blob." The server stores this blob but cannot decrypt it.
3. The app then uploads each note as a separate encrypted blob to R2 object storage. The note content is encrypted before leaving your device.
4. A sync manifest (a list of note IDs and their encrypted modification timestamps) is stored in D1.

The first sync may take a few seconds to a few minutes depending on how many notes you have and your network speed. A progress indicator appears in the sidebar. You can continue writing during the sync.

### Step 7 — Understand the health screen

The health screen (desktop: View → Health; Android: Settings → Vault health) shows:

- **Sync status:** last successful sync time, number of notes pending sync, any errors
- **Vault integrity:** result of the last vault consistency check (every note's HMAC is verified against stored values)
- **Device count:** how many devices have your vault key blob registered (paid plans only)
- **Storage usage:** encrypted blob sizes in R2 and local database size

Run a health check after setting up a new device or if you suspect sync has stalled.

## Behaviour and edge cases

- If you enter the wrong password at vault open, the Argon2id computation runs anyway (to prevent timing attacks), and then the resulting MVK fails to decrypt the vault key blob. You see an "Incorrect password" error. There is no lockout after a fixed number of wrong attempts on the device (you own your device). If you suspect a brute-force attempt on your machine, enable full-disk encryption at the OS level.
- Changing your vault password (Settings → Security → Change password) re-derives the MVK from the new password and re-wraps all key material. Your existing notes do not need to be re-encrypted because the per-note keys are wrapped under the vault key, not directly under the password. Re-wrapping the vault key is sufficient.
- If you set up K-Perception on a second device and sign in to the same account, the app downloads your vault key blob and asks for your vault password to unwrap it. Your vault password must be the same on all devices; if you change it on one device, other devices will prompt for the new password on next sync.
- The recovery code flow is available at Settings → Security → Recovery → Enter recovery code. It is a one-time operation that re-derives your vault keys from the 24-word phrase and sets a new vault password.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| First-run wizard | Yes | Yes | Yes |
| Biometric enrolment | No | During or after wizard | No |
| Vault stored in | %APPDATA% | App private storage | IndexedDB |
| Recovery code display | Wizard + Settings | Wizard + Settings | Wizard + Settings |
| Health screen | View → Health | Settings → Vault health | Settings → Vault health |

## Plan availability

Vault creation is identical on all plans. The only difference is that on the Local plan, no key blob is uploaded to the server and no cloud sync occurs. Recovery from a lost device is impossible on the Local plan without a manual backup of the vault database file.

## Permissions and roles

Only the vault owner can change the vault password or view the recovery code. In workspace settings (Team/Enterprise), workspace key material is managed separately from the personal vault — workspace admins can rotate workspace keys without affecting your personal vault password.

## Security implications

- Argon2id (m=19 MiB, t=2, p=1) is the OWASP 2023 first-profile recommendation. It is memory-hard: an attacker must allocate 19 MiB of RAM per guess, which limits parallelism on commodity GPUs far more than an iteration-count bottleneck alone. This is a significant improvement over PBKDF2 which can be cheaply parallelised. Legacy vaults created before the Argon2id migration still use PBKDF2; they can be opened and are automatically upgraded to Argon2id on next password change.
- AES-256-GCM provides both confidentiality (no one can read your data) and authenticity (if the ciphertext is tampered with, decryption fails and an error is shown rather than corrupted data). This means even a malicious server cannot feed you modified notes without detection.
- The recovery code has the same security level as your vault password — treat it as a second password, not a less-important backup.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Change vault password | Settings → Security → Change password | Re-derives MVK; re-wraps key material |
| View recovery code | Settings → Security → Recovery → Show recovery code | Requires current password to display |
| Run vault health check | Settings → Vault health | Verifies HMAC integrity of all notes |
| Export vault database | Settings → Advanced → Export vault | Exports encrypted .kvdb file for manual backup |
| Import vault database | Settings → Advanced → Import vault | Imports a .kvdb file (replaces local vault) |

## Related articles

- [What is K-Perception?](overview.md)
- [Account setup and login](account-and-login.md)
- [Install on Windows](install-windows.md)
- [Install on Android](install-android.md)
- [Using K-Perception in a browser (PWA)](web-pwa.md)
- [Choosing a plan](choosing-a-plan.md)

## Source references

- `src/shared/kdf.ts` — Argon2id (current) and PBKDF2 legacy key derivation
- `src/lib/crypto.ts` — HKDF, AES-256-GCM implementation
- `src/lib/vault.ts` — vault creation, open, lock, and re-key logic
- `src/components/VaultSetupWizard.tsx` — first-run wizard UI
- `src/lib/recoveryCode.ts` — 24-word recovery code generation and verification
