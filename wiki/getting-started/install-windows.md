---
title: "Install on Windows"
slug: "install-windows"
category: "Getting Started"
tags: ["install", "windows", "electron", "setup", "enterprise", "silent-install"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows"]
last_reviewed: "2026-04-26"
source_refs:
  - "electron/src/main.ts"
  - "electron/src/ipcBridge.ts"
  - "electron/installer/nsis-script.nsi"
related: ["overview", "first-vault", "account-and-login", "install-android", "web-pwa"]
---

# Install on Windows

## What it is

The Windows version of K-Perception is a native Electron 28 desktop application distributed as an NSIS installer (`.exe`). It runs on Windows 10 version 1903 or later and Windows 11. The installer is code-signed with an Extended Validation certificate; the app process runs without elevated privileges and stores all user data under your profile directory.

## When to use it

Use the Windows desktop app if you:

- Want full local-first operation with no dependency on a browser
- Need the 3-pane shell (sidebar, editor, preview pane) for extended writing sessions
- Want to use the command palette (Ctrl+K) or the knowledge graph view
- Need to open files sent to you via the operating system ("Open with" integration)
- Are on an IT-managed machine and need a silent installer for mass deployment

## Step by step

### Download the installer

1. Open your browser and go to `https://kperception.app/download`.
2. Under "Desktop", click **Download for Windows**. The file is named `KPerception-Setup-x.y.z.exe` where `x.y.z` is the current version number.
3. Verify the file size shown on the page matches what you downloaded. If you want to verify the SHA-256 checksum, copy the hash shown on the download page and run the following in PowerShell:

```powershell
Get-FileHash .\KPerception-Setup-x.y.z.exe -Algorithm SHA256
```

Compare the `Hash` field in the output against the value on the download page. They must match exactly. If they do not, delete the file and download it again.

### Handle the Windows SmartScreen prompt

When you run the installer, Windows SmartScreen may display a blue dialog that reads "Windows protected your PC". This is expected for any independently distributed application, including code-signed ones, until the certificate builds sufficient reputation data with Microsoft.

To proceed:

1. Click **More info** in the SmartScreen dialog.
2. Click **Run anyway**.
3. If Windows asks "Do you want to allow this app to make changes to your device?", click **Yes**. The installer requires this only to write to `Program Files`; the app itself runs without elevation.

If you are on a managed machine where SmartScreen blocks the installer entirely, ask your IT administrator to add the app to the software allow-list or use the enterprise deployment method described later in this article.

### Run the installer

The NSIS installer is a one-page wizard:

1. Accept the licence agreement.
2. Choose the install directory. The default is `C:\Program Files\K-Perception`. You can change this, but the default is recommended.
3. Choose whether to create a desktop shortcut and a Start menu entry. Both are on by default.
4. Click **Install**. Installation takes under 30 seconds on typical hardware.
5. Click **Finish**. If you leave "Launch K-Perception" checked, the app starts immediately.

### First launch and account vs local-only mode

On first launch, the app presents the vault setup wizard with two paths:

**Path A — Create an account (cloud sync enabled)**

1. Click **Create account**.
2. Enter your email address and choose a password for your K-Perception account. This is separate from your vault password (explained next).
3. Verify your email address by clicking the link in the confirmation email.
4. Return to the app. You are now logged in and the vault setup step begins.

**Path B — Local only (no account)**

1. Click **Use locally without an account**.
2. The vault setup wizard opens directly. You will not be able to sync, share, or collaborate, but your notes are fully functional on this device. You can create an account later from Settings → Account.

### Set up your vault password

Whether you chose Path A or Path B, you must now create a vault password. This is the master credential that protects all your notes.

Requirements enforced by the app:

- At least 12 characters
- At least one uppercase letter, one number, and one special character, OR a passphrase of at least five words

The password you type is used as input to Argon2id (m=19 MiB, t=2, p=1, a random 16-byte salt) to derive a 256-bit master vault key. Argon2id is memory-hard — it requires significant RAM per attempt, making GPU-based brute-force attacks far more expensive than traditional iteration-count approaches. A passphrase like "correct horse battery staple lamp" is both easy to remember and extremely hard to brute-force.

After you type and confirm the password:

1. The app generates the salt and derives the key.
2. The app generates a recovery code — a 24-word BIP-39-style phrase. **Write this down on paper and store it somewhere safe.** It is the only way to recover your vault if you forget your password. It is derived offline from your key material and is never sent to the server.
3. Confirm you have stored the recovery code by ticking the checkbox.
4. Click **Create vault**. The vault is created and the main editor window opens.

### What gets stored where

| Item | Location |
|---|---|
| Installed application binaries | `C:\Program Files\K-Perception\` |
| Encrypted vault database | `%APPDATA%\K-Perception\vault.db` |
| App settings and preferences | `%APPDATA%\K-Perception\settings.json` |
| Electron session data (cookies, session tokens) | `%APPDATA%\K-Perception\Electron` |
| Log files | `%APPDATA%\K-Perception\logs\` |
| Cached R2 blobs (ciphertext) | `%LOCALAPPDATA%\K-Perception\blob-cache\` |

Your vault password and master vault key are **never** written to disk. They exist in memory only for the duration of the unlocked session. When you lock the vault (Ctrl+L or close the window with auto-lock enabled), the key is zeroed from memory.

## Behaviour and edge cases

- If you install over an existing installation without uninstalling first, the NSIS installer detects the previous version and upgrades in place. Your vault data is preserved.
- If the app crashes while writing an encrypted note, the write is atomic — the previous version of the note is not overwritten until the new ciphertext is committed. You will not lose data due to a mid-write crash.
- The IPC bridge allows the Electron main process to perform network requests on behalf of the renderer, bypassing browser-origin CORS restrictions. This is not a security downgrade: the renderer is still sandboxed and cannot invoke arbitrary main-process code; only the registered `kp-fetch` IPC handler is exposed.
- The app will not start if Windows Defender Antivirus quarantines the main executable. If this happens, add an exclusion for `C:\Program Files\K-Perception\K-Perception.exe` in Windows Security.
- Auto-update checks run on launch and every 6 hours while the app is open. Updates download in the background and are applied on next restart. You are always informed before an update is applied.

## Upgrading

When a new version is available, a banner appears in the app: "Version x.y.z is ready — restart to apply". Click **Restart now** or defer and restart manually later. The update mechanism uses the same NSIS installer in silent mode; your data is never touched.

To update manually: download the new installer from the website and run it. It will upgrade the existing installation.

## Silent install for enterprise IT

The NSIS installer supports a `/S` (silent) flag and an `/D=<path>` flag for the install directory.

Minimal silent install to the default path:

```cmd
KPerception-Setup-x.y.z.exe /S
```

Silent install to a custom directory:

```cmd
KPerception-Setup-x.y.z.exe /S /D=C:\Apps\KPerception
```

Suppress the desktop shortcut (set the registry value before running, or use the following NSIS parameter if your deployment tool supports it):

```cmd
KPerception-Setup-x.y.z.exe /S /NoDesktopShortcut=1
```

For Group Policy deployment:

1. Place the installer on a network share accessible by target machines.
2. Create a GPO under Computer Configuration → Software Settings → Software Installation.
3. Add the installer as a new package. NSIS installers can be wrapped in an MSI using third-party tools (for example, Advanced Installer) if your GPO requires MSI format.

For SCCM/Intune, use the win32 application type and set the install command to `KPerception-Setup-x.y.z.exe /S` and the detection rule to the presence of `C:\Program Files\K-Perception\K-Perception.exe`.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Installer format | NSIS .exe | APK / Play Store | N/A (browser) |
| Silent/enterprise deployment | Yes | MDM via APK | N/A |
| Auto-update | Yes (background) | APK: manual; Play: auto | N/A (always latest) |
| Vault stored in | %APPDATA% | App private storage | IndexedDB |
| IPC CORS bypass | Yes | N/A | N/A |

## Plan availability

Installation is the same for all plans. The plan you are on determines which features are available after you log in. The Local plan is fully functional without an account or internet connection.

## Permissions and roles

The installer writes to `Program Files` (requires elevation at install time only). The running app requires no elevated privileges. It accesses:

- The filesystem under `%APPDATA%\K-Perception\` and `%LOCALAPPDATA%\K-Perception\`
- Outbound HTTPS (port 443) to `*.kperception.app` and `*.cloudflare.com`
- Microphone (only if you record a voice note)

No camera, location, or contact access is requested.

## Security implications

- The Electron main process is the only process that performs outbound network requests for sync. The renderer process (the UI) communicates with the main process via a narrow IPC channel (`kp-fetch`). This limits the blast radius if a note with malicious content somehow triggers a renderer exploit — the renderer cannot directly exfiltrate data to an attacker-controlled server.
- The vault database at `%APPDATA%\K-Perception\vault.db` is an encrypted SQLite file. An attacker with physical access to your machine and your Windows user session can read the file but cannot decrypt it without your vault password.
- Log files at `%APPDATA%\K-Perception\logs\` do not contain vault content, note titles, or decrypted text. They contain operational events (sync status, error codes). Review them if asked by support.
- If you share your Windows user account with others, they can access the K-Perception vault database file. Enable Windows user account separation and vault auto-lock to limit exposure.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Auto-lock timeout | Settings → Security → Auto-lock | Locks vault after N minutes. Default: 15 minutes |
| Launch at startup | Settings → General → Start at login | Adds app to Windows startup registry key |
| Minimize to tray | Settings → General → Minimize to tray | Keeps app running in system tray when window is closed |
| Update channel | Settings → General → Update channel | Stable (default) or Beta |
| Log level | Settings → Advanced → Log level | Info (default), Debug, Verbose |

## Related articles

- [What is K-Perception?](overview.md)
- [Creating your first vault](first-vault.md)
- [Account setup and login](account-and-login.md)
- [Install on Android](install-android.md)
- [Using K-Perception in a browser (PWA)](web-pwa.md)
- [Choosing a plan](choosing-a-plan.md)

## Source references

- `electron/src/main.ts` — Electron main process, tray management, auto-update
- `electron/src/ipcBridge.ts` — IPC bridge for CORS-bypassed network requests
- `electron/installer/nsis-script.nsi` — NSIS installer script with silent-install flags
- `src/lib/crypto.ts` — PBKDF2 key derivation
- `src/lib/vault.ts` — vault creation, open, and lock logic
