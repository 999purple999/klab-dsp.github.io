---
title: "Troubleshooting FAQ"
slug: "faq-troubleshooting"
category: "FAQ"
tags: ["faq", "troubleshooting", "sync", "saml", "errors", "login", "export", "quota"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "macos", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/main/index.ts
  - mobile/src/sync/workerSync.ts
  - src/renderer/src/platform/webAuth.ts
related: ["faq-general", "faq-security", "faq-enterprise", "cross-platform-sync", "offline-capability"]
---

# Troubleshooting FAQ

## Sync is stuck — what do I do?

**Symptoms:** Notes edited on one device are not appearing on another, or the sync indicator shows a pending queue that never clears.

**Steps:**

1. **Check your network connection.** Sync requires a live HTTPS connection to `app.kperception.com` or the K-Perception Worker. Try loading a webpage to confirm connectivity.

2. **Check your session.** Sign out and sign in again if the session may have expired. Sessions have a 7-day TTL; an expired session will silently fail to authenticate sync requests.

3. **On Android:** Sync runs every 30 seconds in the foreground. Bring the app to the front and wait one polling cycle. Background sync does not run when the app is closed.

4. **On Web PWA:** The tab must be open and active. Sync does not run when the tab is backgrounded or closed.

5. **On desktop:** Restarting the app clears the Chromium CORS preflight cache and re-establishes the IPC bridge connection.

6. **Check the queue:** If changes are stuck, the sync queue may have items in a `failed` state. Restarting the app resets the queue processing loop.

7. **Quota exceeded:** If you have exceeded your plan's storage quota, pushes will fail with a 413 error. Delete files or upgrade your plan.

---

## Note not appearing on other devices

**Most common causes:**

1. The **sync queue has not yet drained** on the writing device. Wait for the next sync cycle (30 seconds on Android, immediate push on desktop after edit).
2. The receiving device has **not polled yet**. On Android wait 30 seconds; on web refresh the tab and wait.
3. **Session expired** on either device. Sign out and sign in again.
4. **Clock skew:** If the writing device's system clock is significantly wrong, the `updatedAt` timestamp may cause conflict resolution to discard the newer note. Sync your device clock.
5. **Encryption mismatch:** If the sync cursor reports `decryptFailCount > 0`, the receiving device cannot decrypt the blob — this usually means the vault password was changed on one device but not re-synced to others. Re-unlock both devices with the current vault password.

---

## Session expired — need to log in again

Sessions have a **7-day TTL**. They are automatically refreshed within the last day of their lifetime if the app is open. If you haven't opened the app for more than 7 days, you will need to sign in again.

To re-authenticate:
1. Open K-Perception and dismiss the session-expired prompt.
2. Sign in with your email/password or Google SSO.
3. Enter your vault password to re-unlock the vault.

Note: re-authenticating does not change your vault password or lose any data.

---

## Can't log in after password change

If you changed your **account password** (not vault password) and are now unable to log in:
- On web: clear your browser's `localStorage` for the K-Perception domain and try again.
- On desktop: delete `%APPDATA%\K-Perception\session.enc` (Windows) or the equivalent `session.enc` in the app's `userData` directory on macOS/Linux, then restart K-Perception and sign in again.
- On Android: go to **Settings → Sign Out**, then sign in again.

If you changed your **vault password** and are now unable to unlock:
- Try the old password first — on desktop, vaults are silently migrated to Argon2id on unlock; if the migration was interrupted, the old PBKDF2-derived key may still be the active key.
- If neither password works, you will need your recovery code.

---

## "SAML certificate invalid" error

This error means the signature on the SAML assertion does not match the certificate configured in K-Perception.

**Steps:**
1. In your IdP, download the current signing certificate (PEM format).
2. In the Company Admin Console → Security → SSO/SAML, update the IdP certificate field with the new certificate.
3. If your IdP rotates certificates automatically, ensure K-Perception has the latest certificate.
4. Verify the certificate has not expired in your IdP.

---

## "Clock skew too large" SAML error

SAML assertions include a validity window (typically `NotBefore` and `NotOnOrAfter`). If your server or client clock is more than **5 minutes** out of sync with the IdP clock, the assertion will be rejected.

**Fix:**
- Synchronize the system clock on the affected machine (Windows: `w32tm /resync`, macOS: enable automatic time in System Settings, Linux: `chronyc makestep` or `ntpdate`).
- If the error occurs on the server side, the Cloudflare Worker uses Cloudflare's authoritative time — ensure your IdP clock is accurate.

---

## "ACS URL rejected" SAML error

The Assertion Consumer Service (ACS) URL sent in the SAML authentication request does not match the ACS URL registered in your IdP.

**Steps:**
1. In the Company Admin Console → Security → SSO/SAML, copy the exact ACS URL.
2. In your IdP's SAML application configuration, verify the Allowed/Valid redirect URIs or ACS URL field matches exactly (including `https://`, no trailing slash differences).
3. Some IdPs require the SP Entity ID to also match — verify both values.

---

## WebSocket keeps disconnecting during collaboration

Real-time collaboration uses a WebSocket connection to the DocRoom Durable Object. Disconnections can occur due to:

1. **Network instability:** The Y.js client automatically reconnects. Temporary disconnections do not lose edits — changes are buffered locally and replayed on reconnect.
2. **Proxy or firewall blocking WebSockets:** Ensure your network allows outgoing WebSocket connections (`wss://`) to Cloudflare's Worker domains.
3. **Idle timeout:** Some corporate proxies close idle WebSocket connections after a period of inactivity. The client will reconnect automatically.
4. **Session expiry:** If the session expires mid-session, the WebSocket auth fails. Re-authenticate and reopen the document.

---

## File upload fails with 413 error (quota exceeded)

A 413 response from the server means your account has reached its storage quota for the current plan.

**Immediate fix:**
- Delete files or notes you no longer need to free up space.
- Export old content as KPX and delete the originals.

**Long-term fix:**
- Upgrade to a plan with a larger storage quota (Vault: 50 GB, Team: 100 GB shared, Enterprise: unlimited).

---

## Can't invite user (DOMAIN_NOT_ALLOWED error)

The email address you are trying to invite is not in the list of allowed domains for this company workspace.

**If you are a company admin:**
1. Go to Company Admin Console → Policies → Domain Restriction.
2. Add the new domain to the allowed list, or disable domain restriction.

**If you are not an admin:**
Contact your company admin to either add the domain or invite the user directly from the admin console.

---

## Export taking too long for large vaults

PDF and HTML export render all content in the browser (or in a hidden Electron BrowserWindow). Very large notes with many images or complex LaTeX may take longer.

**Tips:**
- Export individual notes rather than the entire vault.
- On desktop, PDF export waits for `document.fonts.ready` plus an 800ms KaTeX settle window. This is necessary for accurate math rendering — it cannot be skipped.
- HTML export is significantly faster than PDF export.
- For the web app, use HTML export and print to PDF from the browser; this avoids the Electron print pipeline.

---

## "Wrong password or corrupted vault" on unlock

**Common causes:**

1. **Typo in vault password.** Vault passwords are case-sensitive. Try typing it slowly, especially if using special characters.
2. **Keyboard layout mismatch.** If you set your password with one keyboard layout and are now on another, certain characters may produce different codes.
3. **Vault file corruption.** This is rare. The vault write uses an atomic temp-file rename (`vault.enc.tmp` → `vault.enc`) to prevent partial writes. If the file is genuinely corrupted, restore from a local backup under `%APPDATA%\K-Perception\backups\`.

---

## App crashes on startup / blank screen

**Desktop:**
1. Open DevTools with F12 or Ctrl+Shift+I.
2. Check the Console tab for errors.
3. Look for the dev log at `<project-root>\dev-logs\session.log` (only present in dev builds).
4. Try clearing the app data: delete `%APPDATA%\K-Perception` (note: this also deletes your local vault — ensure you have a backup or cloud sync).

**Android:**
1. Force-stop the app and relaunch.
2. Clear app cache (but not data) from Android Settings → Apps → K-Perception → Storage → Clear Cache.

---

## I changed my vault password but other devices can't sync

After a vault password change, the sync key changes on the changing device. Other devices that still use the old sync key will fail to decrypt new blobs (reported as `decryptFailCount > 0` in the pull result).

**Fix:**
1. On each other device, sign out and sign in again.
2. Enter the new vault password to re-unlock.
3. The devices will re-derive the correct sync key and resume syncing.

---

## Biometric unlock stopped working after I changed my vault password

The biometric hint stores an AES-encrypted copy of the old vault password. After a vault password change, the hint becomes stale.

**Fix:**
1. Unlock the vault with the new password.
2. Go to Settings → Security → Biometric Unlock → Re-enable.
3. This re-encrypts the new password as the biometric hint.

---

## LaTeX compilation fails on desktop

1. Verify a LaTeX distribution is installed: open a terminal and run `pdflatex --version`. K-Perception supports `pdflatex`, `xelatex`, and `lualatex`.
2. On Windows, add the TeX distribution's `bin` directory to the system `PATH` environment variable.
3. Check the LaTeX log output for specific errors (undefined package, file not found, etc.) — K-Perception displays parsed error and warning items from the log.
4. Compilation uses `-no-shell-escape` for security; packages that require `\write18` will not work.

---

## Share link not loading or showing "key not found"

Share links encode the decryption key in the URL **fragment** (the `#keyHex` part). If the fragment is lost (e.g., a link-shortener or corporate proxy stripped it), the browser has no key and cannot decrypt the note.

**Fix:**
1. Ask the sharer to re-share the original unmodified URL.
2. Do not use link-shorteners with K-Perception share URLs — they strip the fragment.
3. Verify the share link has not expired. Local-plan share links expire after 12 hours; Guardian+ links have no expiry.

---

## Collaborative document shows old content after reconnect

Y.js CRDT merges all pending operations on reconnect. If you see stale content briefly:
1. Wait a few seconds for the Y.js merge to complete and the editor to re-render.
2. If content seems permanently stuck, close and reopen the document. This forces a full Y.js sync from the DocRoom Durable Object.
3. If the document is consistently out of sync across all devices, trigger a manual sync from the workspace menu or sign out and back in.

---

## "Host not allowed" error (Electron IPC bridge)

On desktop, all backend requests are routed through the Electron main-process IPC bridge (`worker:fetch`). This bridge only accepts requests to the allowlisted hostnames:
- `k-perception-backend.accessisoftwarefrancesco.workers.dev`
- `app.kperception.com`

If you see a `host_not_allowed` error in the console, it means a request was attempted to a hostname outside this list. This is a security control and should not occur in normal use. If you are in development and have a custom `VITE_BACKEND_URL`, ensure it points to one of the allowlisted hosts.

---

## Vault backup restore is not working

Backup restore on desktop requires the backup file to be within the `%APPDATA%\K-Perception\backups\` directory. Restoring from an arbitrary path is blocked as a security measure.

**Steps:**
1. In K-Perception, go to **Settings → Vault → Backups**.
2. Select a backup from the list (these are automatically created by K-Perception).
3. Confirm the restore. The app will copy the selected `.enc` backup over the current `vault.enc`.
4. Re-unlock with your vault password after the restore completes.

For workspace backup restore (ciphertext-only), a **TOTP step-up elevation token** is required. See the dangerous operations guide for details.

---

## Desktop app is very slow to start

On first launch after installation, Argon2id key derivation takes ~80–400 ms depending on hardware. This is intentional — the memory-hard KDF prevents brute-force attacks.

If startup is unexpectedly slow (more than 5 seconds) on subsequent launches:
1. Check that the vault file (`vault.enc`) exists and is not corrupted.
2. Ensure the system has sufficient free RAM (Argon2id requires ~20 MB working memory during derivation).
3. On Windows, check that no antivirus is scanning the `%APPDATA%\K-Perception` directory on every read — add it to the antivirus exclusion list.
