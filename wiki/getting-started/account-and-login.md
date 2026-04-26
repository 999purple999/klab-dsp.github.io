---
title: "Account setup and login"
slug: "account-and-login"
category: "Getting Started"
tags: ["account", "login", "oauth2", "pkce", "jwt", "session", "biometric", "multi-device"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web", "macos"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/lib/auth.ts"
  - "src/lib/authAdapter.desktop.ts"
  - "src/lib/authAdapter.mobile.ts"
  - "worker/src/auth.ts"
  - "src/components/AccountSettings.tsx"
related: ["overview", "first-vault", "install-windows", "install-android", "web-pwa", "choosing-a-plan"]
---

# Account setup and login

## What it is

An account in K-Perception is a server-side identity — an email address and authentication credential stored in the Cloudflare Workers backend. Your account is separate from your vault. The account determines:

- Which devices are allowed to sync your encrypted notes
- What plan you are on (and therefore which features are unlocked)
- Who you are in shared workspaces and collaboration sessions

Your vault is the encrypted container on your device. You could have an account without a vault (you have registered but not finished setup on this device), or a vault without an account (Local plan users). In normal operation, both exist on the same device and are linked.

## When to use it

You need an account when you want any of the following:

- Cloud sync across multiple devices
- Real-time collaboration
- Workspace membership (Team/Enterprise plans)
- Share links visible to recipients
- Plan management and billing

You do not need an account for the Local plan. Local-plan users skip login entirely and manage their vault with only a vault password.

## Step by step

### Creating an account with email and password

1. Open K-Perception and click **Create account** on the welcome screen.
2. Enter your email address. Use an address you can reliably receive mail at — you must verify it.
3. Enter a password for your K-Perception account. This is a separate credential from your vault password, though you may use the same string if you choose. The account password is transmitted to the server (over TLS) and stored as a salted bcrypt hash. It is used only for authentication, not for encrypting your notes.
4. Click **Create account**. A verification email is sent to the address you provided.
5. Open the email and click the verification link. You have 24 hours before the link expires.
6. Return to K-Perception. Click **I've verified my email** or simply restart the app. The app checks verification status and proceeds to vault setup if verified.

If you do not receive the verification email within 5 minutes, check your spam folder. If it is not there, click **Resend verification email** on the waiting screen.

### Creating an account with Google OAuth2 (PKCE flow)

K-Perception supports sign-in with Google using the OAuth2 Authorization Code flow with PKCE (Proof Key for Code Exchange). This is the recommended flow for public clients (apps that cannot store a client secret securely).

**What PKCE prevents:**

Without PKCE, an attacker who intercepts the authorization code (via a malicious app registered for the redirect URI scheme, or via a compromised network) can exchange it for tokens. PKCE adds a code verifier — a random 128-bit string generated on your device — and a code challenge (SHA-256 hash of the verifier) sent to Google with the initial auth request. The token exchange requires presenting the original verifier. An intercepted code is useless without the verifier, which never leaves your device.

**Why no client secret is stored:**

A client secret is a credential that identifies the app to the OAuth server. In a server-side web app, the secret is stored on the server. In a native or browser app, there is no secure place to store a secret — it would be visible to any user who inspects the app bundle. K-Perception therefore uses a public OAuth2 client ID (not secret) and relies on PKCE for security instead.

**Steps:**

1. On the welcome screen or at Settings → Account → Sign in with Google, click **Continue with Google**.
2. On desktop (Windows/macOS), the system browser opens a Google authentication page. On Android, a Chrome Custom Tab opens. On web, a popup window opens.
3. Sign in to your Google account and grant K-Perception permission to read your name and email address. K-Perception does not request access to your Gmail, Drive, or any other Google data.
4. Google redirects to the app with an authorization code. The app exchanges the code for a short-lived ID token using the PKCE verifier.
5. The Workers backend verifies the Google ID token signature and issues a K-Perception session JWT. The browser or app stores this JWT.
6. If this is your first sign-in with this Google account, an account is created automatically. Your vault setup wizard then begins.

### How the session token works

After login (email/password or OAuth2), the Workers backend creates an opaque session token — a random UUID stored server-side in D1. There is no JWT, no HMAC signature embedded in the token itself. The token is looked up on every request against the D1 `sessions` table, which stores the associated user ID, plan, and expiry.

Session TTLs differ by platform:
- **Web:** 7 days
- **Desktop (Electron) and Mobile (Android):** 60 days

The app stores the session token in secure storage (Electron safeStorage on desktop, Capacitor Preferences on mobile, localStorage on web). The token is sent as a `Bearer` token in the `Authorization` header on every API request.

**Session refresh:** The app calls `POST /auth/session/refresh` when within 7 days of expiry. You do not need to log in again unless you explicitly sign out or the session is revoked.

**Session revocation:** If you believe a session has been compromised, go to Settings → Account → Sessions and click **Revoke all sessions**. This deletes all session rows in D1 for your account.

### Multi-device login

You can log in on up to the device limit for your plan (Local: 0 cloud devices, Guardian: 3, Vault/Lifetime: 8–10, Team: 20, Enterprise: unlimited). Each device gets its own session token.

When you log in on a second device:

1. Enter your account credentials (email/password or Google).
2. The app downloads your vault key blob (the encrypted vault key material stored on the server).
3. You enter your vault password. The app derives the MVK from it and uses the MVK to decrypt the vault key blob, extracting your vault keys.
4. The app begins downloading your encrypted notes from R2 and decrypting them locally.

This process is the same for every new device. The vault password is never stored on the server; only the encrypted key blob is. The server cannot derive your vault keys even if it has the blob.

If you reach your plan's device limit, you are prompted to either upgrade your plan or sign out of an existing device. You can view all active sessions at Settings → Account → Sessions.

### Session revocation

To sign out of a specific device without physical access to it:

1. Go to Settings → Account → Sessions.
2. You see a list of all active sessions with device name, approximate location (inferred from IP, not precise GPS), and last active time.
3. Click **Revoke** next to any session.
4. The server marks that session's JWT as revoked. The next time that device makes an API call, it receives a 401 response and the local session is cleared, prompting a re-login.

To sign out of all devices at once, click **Revoke all sessions**.

### What happens when you log out

Logging out of K-Perception (Settings → Account → Sign out):

1. The JWT is deleted from local storage.
2. The vault is locked (the MVK is zeroed from memory).
3. The vault database file and encrypted blobs on disk are **not** deleted. Your notes remain on the device, encrypted.

On next launch, you see the login screen. If you log back in with the same account and enter your vault password, your notes are immediately accessible. You are never locked out of your own data.

If you want to sign out and delete local data (for example, before selling or returning a device), use Settings → Advanced → Sign out and clear local data. This logs you out and securely deletes the vault database from the device. With cloud sync enabled, no notes are lost; without sync (Local plan), this operation permanently deletes your notes.

## Behaviour and edge cases

- If you sign in with Google on a device that previously used email/password, and the Google account email matches the existing account email, the accounts are automatically merged. Future logins can use either method.
- If you forget your account password (not your vault password), use the "Forgot password" link on the login screen. This sends a reset link to your email. Resetting the account password does not affect your vault password or your encrypted notes; the account password is separate from the vault key derivation chain.
- Email change is available at Settings → Account → Change email. After changing, you must verify the new address. Your account password and vault are unaffected.
- On the web app in incognito mode, the session token is stored in localStorage and is deleted when the browser context closes. You will need to log in again on the next visit.
- If your plan is downgraded (for example, your subscription lapses), API calls that require a higher plan return 403 with a `plan_required` error code. The app surfaces this as an upgrade prompt.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| OAuth2 redirect | System browser | Chrome Custom Tab | Popup window |
| Session token storage | Electron safeStorage | Capacitor Preferences | localStorage |
| Biometric unlock | No | Yes | No |
| Auto-refresh | Yes | Yes | Yes (tab must be open) |
| Session revocation list | Settings → Account → Sessions | Settings → Account → Sessions | Settings → Account → Sessions |

## Plan availability

Account creation and login are available on all paid plans. The Local plan supports vault-only operation with no account. All account features described here require at least the Guardian plan (cloud sync must be enabled).

## Permissions and roles

Within a workspace (Team/Enterprise plans), your account carries a workspace role: owner, admin, editor, commenter, viewer, or guest. Roles are assigned by workspace admins and determine access to channels, files, and admin functions. Your personal account password and vault password are independent of your workspace role; an admin cannot access your vault contents.

## Security implications

### Account password vs vault password

These are two separate credentials with different purposes:

| | Account password | Vault password |
|---|---|---|
| What it protects | Server identity, session issuance | Vault key derivation, note decryption |
| Where it is stored | Server (bcrypt hash) | Nowhere (derived on-device only) |
| Transmitted over network | Yes (over TLS, then hashed) | Never |
| Recoverable if forgotten | Yes (email reset) | No (recovery code only) |
| Affects note encryption | No | Yes |

An attacker who learns your account password can log in as you and see your encrypted blobs. They cannot decrypt them without your vault password. An attacker who learns your vault password but not your account password cannot sync or share — but if they have physical access to your device's vault database, they can decrypt notes locally. Protect both.

### OAuth2 and third-party risk

Signing in with Google means Google is in your authentication path. If your Google account is compromised, your K-Perception account can be logged in to by the attacker. However, the attacker still cannot decrypt your notes without your vault password. Enable 2FA on your Google account to mitigate this risk.

### Enterprise: TOTP step-up 2FA

On Enterprise plans, workspace admins can require TOTP (Time-Based One-Time Password) step-up authentication for sensitive operations (workspace key rotation, remote wipe, transfer of ownership). This is separate from login-level MFA. You are prompted for a TOTP code from an authenticator app (Google Authenticator, Authy, 1Password, etc.) only when performing those specific operations. Standard note editing does not require step-up.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Change account password | Settings → Account → Change password | Updates the server-side bcrypt hash |
| Change email | Settings → Account → Change email | Requires verification of new address |
| Active sessions | Settings → Account → Sessions | View and revoke sessions |
| Connected Google account | Settings → Account → Google | Link or unlink Google sign-in |
| Delete account | Settings → Account → Delete account | Schedules GDPR deletion (30-day grace period) |
| Two-factor authentication | Settings → Security → 2FA | Set up TOTP for login-level MFA |

## Related articles

- [What is K-Perception?](overview.md)
- [Creating your first vault](first-vault.md)
- [Install on Windows](install-windows.md)
- [Install on Android](install-android.md)
- [Using K-Perception in a browser (PWA)](web-pwa.md)
- [Choosing a plan](choosing-a-plan.md)

## Source references

- `src/lib/auth.ts` — JWT issue, refresh, and revocation client logic
- `src/lib/authAdapter.desktop.ts` — PKCE flow implementation for Electron
- `src/lib/authAdapter.mobile.ts` — PKCE flow implementation for Capacitor/Android
- `worker/src/auth.ts` — Cloudflare Worker auth routes (login, refresh, revoke, Google callback)
- `src/components/AccountSettings.tsx` — account settings UI (sessions, email change, delete)
