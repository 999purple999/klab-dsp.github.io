---
title: "Install on Android"
slug: "install-android"
category: "Getting Started"
tags: ["install", "android", "apk", "biometric", "widget", "capacitor", "mobile"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["android"]
last_reviewed: "2026-04-26"
source_refs:
  - "android/src/main/AndroidManifest.xml"
  - "src/mobile/biometricUnlock.ts"
  - "src/mobile/quickCaptureWidget.ts"
  - "src/mobile/syncPoller.ts"
related: ["overview", "first-vault", "account-and-login", "install-windows", "web-pwa"]
---

# Install on Android

## What it is

The Android version of K-Perception is a native app built on Capacitor 6, Vite, and React 18. It wraps the same cryptographic core and editor set as the desktop app, packaged as an APK distributed both through the official website and through Google Play. The minimum supported Android version is 8.0 (API level 26, "Oreo").

Android-specific features not present on other platforms include: biometric unlock (fingerprint and face recognition), a quick-capture home screen widget, voice recorder for audio notes, and a folder strip for fast workspace navigation.

## When to use it

Use the Android app if you:

- Need to capture notes on the go and sync them to your desktop later
- Want biometric unlock so you do not need to type your vault password every time you open the app
- Use the quick-capture widget to record a thought without opening the full app
- Need to open PDFs sent to you by other apps and save them into your vault

## Step by step

### Option A — Install from Google Play

1. Open the Google Play Store on your device.
2. Search for "K-Perception" or scan the QR code on the `kperception.app/download` page.
3. Tap **Install**. The Play Store verifies the APK signature before installation. No additional configuration is needed.
4. Once installed, tap **Open** or find the K-Perception icon in your app drawer.

### Option B — Install the APK directly (side-loading)

Side-loading means installing an APK outside the Play Store. You might choose this if your device does not have Google Play Services, if you are on a managed device where Play Store is unavailable, or if you want to install a beta build.

**Step 1 — Enable installation from unknown sources**

Android 8.0 and later require you to grant install permission per browser or file manager app, rather than a single system-wide toggle.

1. Download the APK file from `https://kperception.app/download` using Chrome, Firefox, or another browser.
2. When the download completes, tap the notification or find the file in your Downloads folder.
3. Android will prompt: "Your phone is not allowed to install unknown apps from this source." Tap **Settings**.
4. On the "Install unknown apps" screen, toggle **Allow from this source** on.
5. Tap the back button. Android will resume the installation prompt.
6. Tap **Install**. Review the permissions list that appears (described later in this article).
7. Tap **Install** again to confirm.

On Android 7 and earlier (no longer supported for new features), the toggle is at Settings → Security → Unknown sources.

**Security note on side-loading:** Only download the APK from `kperception.app`. Do not install APKs from third-party mirrors or file-sharing sites. The official APK is signed with the K-Perception release certificate; Android verifies this signature and will refuse to install a tampered APK, but it cannot verify that the file came from the right server — you must ensure the download URL is correct.

After installation, you can re-disable "Allow from this source" for the browser you used. This does not affect the already-installed app or future updates installed the same way.

### First launch

1. Open K-Perception from your app drawer.
2. On first launch, the vault setup wizard appears — the same flow as on desktop. See [Creating your first vault](first-vault.md) for a full walkthrough.
3. If you already have an account from another device, tap **Sign in** and enter your credentials. After authentication, the app downloads your encrypted vault key material and begins sync. Your notes are decrypted on-device.

### Enrol biometric unlock

After your vault is set up, the app offers to enable biometric unlock. You can also enable it later at Settings → Security → Biometric unlock.

1. Go to Settings → Security → Biometric unlock.
2. Tap **Enable**.
3. Authenticate once with your vault password to authorise the change.
4. The app stores an encrypted copy of your vault session key in Android Keystore, wrapped by a biometric-bound key that Android only releases upon successful biometric authentication.
5. On subsequent launches, you tap your fingerprint sensor or look at the front camera instead of typing your password.

If your enrolled biometrics change (for example, you add a new fingerprint), the biometric key is revoked by Android Keystore and you must re-enrol. The app detects this and prompts you to enter your vault password and re-enable biometric unlock.

### Set up the quick-capture widget

1. Long-press an empty area of your home screen.
2. Tap **Widgets**.
3. Scroll to **K-Perception** and drag the **Quick Capture** widget to your home screen.
4. The widget shows a text field and a microphone button. Tapping the text field opens a small note entry form. Tapping the microphone starts an inline voice recording.
5. Captured notes are saved as drafts in your Inbox folder, encrypted with your vault key, and synced when the app is next opened or a background sync fires.

### Notification permissions (Android 13+)

Android 13 requires apps to request permission to send notifications. K-Perception uses notifications for:

- Sync completion alerts
- Collaboration invitation alerts
- Workspace mention alerts

On first launch on Android 13+, the system will ask "Allow K-Perception to send you notifications?" Tap **Allow** to receive these. If you deny and later want to re-enable, go to Android Settings → Apps → K-Perception → Notifications.

### Battery optimisation exemption

Android's battery optimisation (Doze mode) can prevent the 30-second pull polling from running when the app is in the background. To ensure near-real-time sync and collaboration updates:

1. Go to Android Settings → Apps → K-Perception → Battery.
2. Tap **Battery optimization** (exact label varies by manufacturer).
3. Select **Don't optimize** or **Unrestricted** (Samsung One UI) or **No restrictions** (Pixel / stock Android).

K-Perception requests this exemption automatically on first launch with a prompt. You can also grant it through the flow above at any time.

On devices with aggressive battery management (Huawei, Xiaomi, OnePlus, Samsung), you may additionally need to enable "Auto-launch" and disable "Background activity restrictions" in the manufacturer's battery settings panel. The exact steps vary by device and Android skin version.

## Behaviour and edge cases

- The 30-second pull polling is an HTTP long-poll to the Workers API, not a persistent WebSocket. It is designed to minimise battery impact while keeping collaboration updates reasonably fresh. When you are actively editing a shared note, the app switches to a WebSocket connection for full real-time sync; the poll resumes when you navigate away.
- Voice notes are recorded as M4A files, encrypted locally using the same AES-256-GCM scheme as text notes, and attached to a note in your vault. They are never transcribed server-side.
- If Android kills the app process during a sync (OOM kill), the sync operation is re-queued on next launch. No data is lost; the queue is persisted in encrypted local storage.
- The "Open with" PDF intent is registered in `AndroidManifest.xml`. When another app (email client, file manager) offers to share a PDF with K-Perception, the app creates a new file entry in your vault, encrypts the PDF bytes, and saves it. The original file in the sharing app is not modified.
- Rotating your device (portrait to landscape) does not close the current note or interrupt an active sync.

## Upgrading

**Play Store:** The app updates automatically when a new version is published and you have automatic updates enabled in Play Store settings. Manual update: open Play Store → My apps → K-Perception → Update.

**APK side-load:** Download the new APK from `kperception.app/download` and install it over the existing app. Android will ask you to confirm the upgrade. Your vault data and settings are preserved because the APK is signed with the same certificate and Android considers it the same application. You do not need to uninstall first.

Never uninstall and reinstall to upgrade — uninstalling deletes your local vault database. If you have cloud sync enabled, you can recover your notes after reinstalling, but local-only notes are gone permanently.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Biometric unlock | No | Yes (fingerprint/face) | No |
| Quick-capture widget | No | Yes | No |
| Voice recorder | No | Yes | No |
| Background sync | Tray agent | 30-second pull polling | Tab must be open |
| File-sharing intent | Read-only | Yes ("Open with" PDF) | No |
| Local vault path | %APPDATA% | App private storage | IndexedDB |

## Plan availability

Installation and core note-taking are available on all plans, including Local (free). Biometric unlock, cloud sync, and collaboration require a Guardian plan or higher. The quick-capture widget works on all plans; captured notes sync only on paid plans.

## Permissions and roles

K-Perception requests the following Android permissions:

| Permission | Why it is needed |
|---|---|
| INTERNET | Sync, auth, collaboration |
| USE_BIOMETRIC / USE_FINGERPRINT | Biometric unlock |
| RECORD_AUDIO | Voice note recording |
| RECEIVE_BOOT_COMPLETED | Re-register sync alarm after device restart |
| FOREGROUND_SERVICE | Voice recording and active sync displayed in status bar |
| POST_NOTIFICATIONS | Sync and mention notifications (Android 13+) |
| VIBRATE | Haptic feedback on widget |
| REQUEST_INSTALL_PACKAGES | Prompting you to install APK updates (side-load builds only) |

K-Perception does not request CONTACTS, CALL_LOG, CAMERA, LOCATION, or READ_EXTERNAL_STORAGE. It reads PDF files only when you explicitly share them via the system intent; it does not scan your storage.

## Security implications

- Biometric unlock does not weaken vault security. If biometric authentication fails five times, Android Keystore permanently revokes the biometric key and the app requires your full vault password. An attacker with a photo of your face cannot unlock a well-configured Android device; the system uses liveness detection where supported.
- The vault database is stored in the app's private storage directory (`/data/data/app.kperception/`), which is inaccessible to other apps on a non-rooted device. On a rooted device, the database is accessible to root processes; however, it is still encrypted and requires your vault password to read.
- The quick-capture widget stores draft notes in encrypted local storage before the main app has a chance to flush them to the vault. If you uninstall the app or clear app data before the app processes the queue, those drafts are lost. Check your Inbox folder regularly.
- Avoid granting K-Perception "all files access" (MANAGE_EXTERNAL_STORAGE); the app does not request this permission. If a third-party app or tutorial instructs you to grant it, that instruction is not from K-Perception and may indicate a phishing attempt.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Biometric unlock | Settings → Security → Biometric unlock | Enrol or revoke biometric key |
| Auto-lock timeout | Settings → Security → Auto-lock | Locks vault after N minutes of inactivity. Default: 5 minutes on mobile |
| Pull poll interval | Settings → Sync → Poll interval | How often the app checks for new data (minimum 30 seconds) |
| Battery optimisation | Settings → Sync → Battery mode | Links to Android battery settings for exemption |
| Notification types | Settings → Notifications | Toggle individual notification categories |
| Widget theme | Long-press widget → Edit | Light, dark, or match system |

## Related articles

- [What is K-Perception?](overview.md)
- [Creating your first vault](first-vault.md)
- [Account setup and login](account-and-login.md)
- [Install on Windows](install-windows.md)
- [Using K-Perception in a browser (PWA)](web-pwa.md)
- [Choosing a plan](choosing-a-plan.md)

## Source references

- `android/src/main/AndroidManifest.xml` — permission declarations and intent filters
- `src/mobile/biometricUnlock.ts` — Android Keystore biometric key wrapping
- `src/mobile/quickCaptureWidget.ts` — widget bridge and draft queue
- `src/mobile/syncPoller.ts` — 30-second pull poll implementation
- `src/mobile/voiceRecorder.ts` — M4A recording and vault attachment
