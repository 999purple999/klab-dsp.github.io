---
title: "Password-Protected Share Links"
slug: "password-protection"
category: "Sharing"
tags: ["password", "PBKDF2", "encryption", "share-links", "security", "zero-knowledge"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/shareCrypto.ts"
  - "private-sync-worker/src/share.ts"
  - "share-page/"
related: ["share-links", "permissions", "revocation", "share-viewer"]
---

## What it is

Password protection is an optional second layer of encryption on a share link. When enabled, the 32-byte AES-256-GCM share key that decrypts the note content is itself encrypted (wrapped) using a key derived from a passphrase you choose, via PBKDF2. The result: even if someone obtains the full share URL (including the `#fragment` key), they cannot decrypt the note without also knowing the passphrase.

The passphrase is never sent to the server. K-Perception derives the wrapping key entirely client-side using the Web Crypto API and stores only the PBKDF2-wrapped share key and its salt in D1. This preserves the zero-knowledge property of the share system: the server holds ciphertext it cannot decrypt, and it cannot derive the wrapping key from the stored salt alone (that would require the passphrase, which only you and your recipient know).

Password protection is available on Guardian and above. It is not available on the Local (free) plan.

## When to use it

Use password protection when:

- The share URL might travel through channels you do not fully control (email threads, Slack channels, shared document links in a team Wiki).
- You want to add a second factor: the recipient needs both the URL and the passphrase, delivered through separate channels.
- You are sharing sensitive material with a recipient you trust but want an additional layer of access control in case the URL leaks.
- You are required by your organisation's security policy to password-protect externally shared documents.

Do not use password protection as a substitute for choosing the right permission level. Password protection controls who can open the link; the permission level controls what they can do once inside.

## Step by step

### Creating a password-protected share link

1. Open the note and click **Share** in the toolbar.
2. In the Share dialog, choose your permission level and expiry as normal.
3. Toggle **Password protect this link** to enabled.
4. Enter a passphrase in the **Password** field. There is no minimum length requirement enforced by the UI, but you should use a passphrase of at least 12 characters with mixed character classes for meaningful security. Weak passphrases reduce the effective security of the PBKDF2 wrapping significantly.
5. Click **Generate link**. The app performs the following client-side operations before uploading:
   a. Generates a 16-byte random PBKDF2 salt.
   b. Derives a 32-byte AES-256-GCM encryption key from your passphrase + salt using PBKDF2-SHA-256 with 100,000 iterations.
   c. Generates a 12-byte random IV.
   d. Encrypts the note content (title, body, mode) with AES-256-GCM using the derived key and the IV.
   e. Uploads: ciphertext, IV, PBKDF2 salt, password-required flag — all to the server.
   f. Places only the PBKDF2 salt and a flag indicating password protection in the URL fragment (not a bare decryption key).
6. Copy the generated link and the passphrase separately. The passphrase is shown once; it is not stored anywhere by K-Perception and cannot be recovered if lost.

### Distributing the link and passphrase

Deliver the URL and the passphrase through separate channels for maximum security. For example:
- URL via email; passphrase via SMS.
- URL in a shared document; passphrase in a private message.

The security of two-channel delivery is that an attacker who intercepts one channel gains nothing without the other.

### What the recipient experiences

1. The recipient opens the share link in a browser. The share viewer at `kperception-share.pages.dev` detects the password-protection flag in the URL fragment.
2. A password prompt is shown before any content is rendered. The note content remains encrypted; the share viewer has no way to display it without the passphrase.
3. The recipient enters the passphrase and clicks **Unlock**.
4. The share viewer performs client-side PBKDF2 key derivation using the passphrase and the salt stored with the blob, then decrypts the note content directly using the derived AES-256-GCM key. This entire process runs in the browser; no passphrase is transmitted.
5. If the passphrase is correct, the note content is rendered in the appropriate mode (Markdown, HTML, etc.).
6. If the passphrase is incorrect, decryption fails with an authentication tag mismatch, and the share viewer re-prompts with an error message. The recipient can try again immediately.

### Changing the passphrase

There is no in-place passphrase change mechanism. To change the passphrase on an existing link:

1. Revoke the existing link.
2. Create a new share link with the new passphrase.
3. Distribute the new URL and passphrase to recipients.

## Behaviour and edge cases

**PBKDF2 parameters.** The derivation uses SHA-256, 100,000 iterations, and a 16-byte random salt. These parameters are stored alongside the ciphertext so the share viewer can reconstruct them without out-of-band communication. 100,000 PBKDF2-SHA-256 iterations represents approximately 100–250 ms of computation on a mid-range device as of 2026, which is the intended cost to make brute-force attacks expensive.

**No server-side brute-force protection.** Because the passphrase verification happens entirely client-side (via AES-GCM authentication tag), the server cannot enforce attempt limits or lockouts. An attacker who has the full URL (including fragment) could theoretically run offline brute-force attacks against the ciphertext. This makes passphrase strength critical. A short, common passphrase (e.g., "password123") provides very little protection against a determined offline attacker with the URL.

**Wrong passphrase behaviour.** The AES-GCM authentication tag verification fails immediately on an incorrect passphrase, producing a `DOMException: The operation failed for an operation-specific reason` (or similar). The share viewer catches this and displays "Incorrect password, please try again." There is no delay between attempts.

**Passphrase loss.** If you lose the passphrase and have revoked the original link, the note content is still accessible from your own vault (the share key and passphrase are independent of your vault key). You can recreate the share link with a new passphrase. Recipients who no longer have access will need the new link.

**Password protection and anonymous comments.** Commenters must successfully enter the passphrase before they can view the note and post comments. The passphrase unlock is per-session in the browser; commenters do not need to re-enter it on each comment submission within the same session.

**Password protection and Edit links.** Password protection is compatible with Edit-level links. The recipient must supply the passphrase before the Y.js collab session initialises. Once unlocked, the collab session behaves identically to an unprotected Edit link.

**Password protection on mobile deep links.** When a password-protected collab link is opened via the `kperception://collab/…` deep link on Android, MobileCollabEditor displays the passphrase prompt before rendering the editor. The derivation runs on-device using the Web Crypto API available to Capacitor WebViews.

**Removing password protection.** You cannot remove password protection from an existing link. Revoke and recreate without the password option.

## Platform differences

| Feature | Windows (Electron) | Android | Web (PWA) |
|---|---|---|---|
| Create password-protected link | Yes | Yes | Yes |
| Enter passphrase at share viewer | Yes (browser) | Yes (browser or in-app) | Yes (browser) |
| PBKDF2 derivation runs on-device | Yes | Yes | Yes |
| Passphrase never sent to server | Yes | Yes | Yes |
| Re-prompt on wrong password | Yes | Yes | Yes |

## Plan availability

| Plan | Password protection |
|---|---|
| Local (free) | Not available |
| Guardian (€3.49/mo) | Available |
| Vault (€7.99/mo) | Available |
| Lifetime (€149) | Available |
| Team (€6.99/user/mo) | Available |
| Enterprise (€14.99/user/mo) | Available |

## Permissions and roles

Password protection does not affect the permission level encoded in the link. A password-protected View link still only grants View access; a password-protected Edit link grants Edit access to anyone who knows both the URL and the passphrase.

Only the note owner (an authenticated K-Perception user with vault access to the note) can set or remove password protection. Recipients, regardless of their permission level, cannot modify the password protection settings.

## Security implications

### Defence-in-depth: why two layers matter

A standard share link has one cryptographic gate: possession of the URL fragment. Anyone who receives (or intercepts) the URL can decrypt the note. Password protection adds a second gate: knowledge of the passphrase. A URL interception alone is no longer sufficient.

This is particularly valuable when:
- The URL travels through a channel that logs or indexes URLs (e.g., a corporate email gateway, an enterprise Slack workspace with eDiscovery enabled, a link-shortener service).
- The URL is stored in a browser's history on a shared or compromised device.
- The URL appears in a referrer header if someone pastes it into a document that loads external resources.

### The passphrase is the weakest link

The cryptographic construction is sound, but passphrase quality directly determines effective security. A 12-character random passphrase from a full character set provides roughly 79 bits of entropy, which makes offline brute force infeasible. "cat" provides about 5 bits. Use a passphrase manager or the built-in passphrase generator (if available in your plan) to generate strong passphrases.

### What the server stores

The server stores, per password-protected share link:
- Encrypted note ciphertext (AES-256-GCM, encrypted under the PBKDF2-derived key).
- Ciphertext IV (12 bytes, random).
- PBKDF2 salt (16 bytes, random) — needed by the recipient to derive the same key.
- `pwRequired: true` flag.
- Permission level, expiry, access count, creation timestamp.

The server does not store: the derived AES key or the passphrase. A full database dump reveals none of these values.

### Timing side-channels

The Worker does not perform any passphrase-dependent computation — all derivation is client-side. There is no server-observable timing side-channel related to passphrase correctness.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Default: require password for new links | Settings → Sharing → Security | Pre-selects the password-protect toggle for all new links (default: off) |
| PBKDF2 iterations | Not user-configurable | Fixed at 100,000; future versions may allow increasing this |

## Related articles

- [Share Links](share-links.md) — share link creation, the fragment-key principle, overall security model.
- [Permissions](permissions.md) — View / Comment / Edit levels and their interaction with password protection.
- [Revocation](revocation.md) — how to revoke and recreate a link when changing passphrase.
- [Share Viewer](share-viewer.md) — the share viewer password prompt UI.

## Source references

- `src/shared/shareCrypto.ts` — `wrapShareKeyWithPassword()`, `unwrapShareKeyWithPassword()`, PBKDF2 derivation, wrapping IV generation.
- `private-sync-worker/src/share.ts` — storage of wrapped key, salt, and wrapping IV in D1; flag indicating password protection in token metadata.
- `share-page/` — password prompt UI component, client-side PBKDF2 invocation, re-prompt on decryption failure.
- Database migrations: `0032_share_wrapped_dek.sql` — adds `wrapped_key`, `wrap_iv`, `pbkdf2_salt`, `pbkdf2_iters` columns to the share_links table.
