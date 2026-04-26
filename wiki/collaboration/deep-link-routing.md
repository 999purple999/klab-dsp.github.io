---
title: "Deep link routing"
slug: "deep-link-routing"
category: "Collaboration"
tags: ["deep-link", "routing", "android", "electron", "uri"]
audience: "developer"
plan: ["vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "mobile/src/App.tsx"
  - "src/renderer/src/collab/CollabShareSession.ts"
  - "src/main/index.ts"
related: ["mobile-collab-editor", "realtime-yjs", "sharing/share-links"]
---

# Deep link routing

## What it is

Deep link routing maps custom URL schemes to in-app navigation. When you click a `kperception://` link, the operating system routes it to K-Perception instead of a browser. The app reads the URL, extracts the parameters, and navigates to the appropriate screen.

For collaborative links, the URL fragment (`#keyHex`) contains the AES-256-GCM decryption key — it never appears in any HTTP request and is only readable by client-side JavaScript.

## URL scheme

```
kperception://{route}/{id}#{fragment}
```

### Known routes

| URL | Destination | Fragment |
|---|---|---|
| `kperception://collab/{shareId}` | MobileCollabEditor / CollabDoc | `#keyHex` — AES-256-GCM key |
| `kperception://note/{noteId}` | Open specific note | None |
| `kperception://quick-capture` | New blank note | None |
| `kperception://workspace/{wsId}` | Open workspace | None |

## Platform implementation

### Android

The `AndroidManifest.xml` registers an intent filter for the `kperception` URI scheme:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="kperception" />
</intent-filter>
```

The Capacitor `App` plugin (`mobile/src/App.tsx`) listens for `appUrlOpen` events:

```typescript
App.addListener('appUrlOpen', (event) => {
  const url = new URL(event.url);
  routeDeepLink(url);
});
```

The `routeDeepLink` function:

1. Checks `url.host` to determine the route (`collab`, `note`, `quick-capture`, `workspace`).
2. For `collab` routes: routes to MobileCollabEditor, passes `url.pathname` (shareId) and `url.hash` (keyHex).
3. For other routes: routes to the appropriate screen.
4. If the vault is locked: queues the deep link intent; shows unlock screen; processes after unlock.

### Desktop (Electron)

In `src/main/index.ts`, K-Perception registers as the default protocol client for `kperception`:

```typescript
app.setAsDefaultProtocolClient('kperception');
```

When a `kperception://` URL is opened:

- On Windows: the app receives it via `process.argv` on cold launch, or via `app.on('second-instance', ...)` if already running.
- On macOS: via `app.on('open-url', ...)`.

The main process sends the URL to the renderer via IPC. The renderer routes it the same way as mobile.

### Web (browser)

In a browser, `kperception://` links are not handled natively. Clicking a `kperception://` link in a browser:

- On Android with K-Perception installed: the OS offers to open the link in K-Perception (Android app links).
- On desktop browser: fails silently or shows an OS "No application registered" error.
- The share viewer (`kperception-share.pages.dev`) includes a banner: "Open in K-Perception app" that constructs the correct deep link.

## Step by step — collab deep link flow

1. Recipient receives a collab link (e.g. by email or messaging app).
2. Recipient taps/clicks the link.
3. OS matches the `kperception://` scheme to K-Perception.
4. K-Perception opens (or comes to foreground).
5. `appUrlOpen` fires with the full URL including fragment.
6. `routeDeepLink` parses: `shareId = "abc123"`, `keyHex = "def456..."`.
7. CollabShareSession is initialised: `keyHex` imported as CryptoKey.
8. WebSocket connects to DocRoom.
9. MobileCollabEditor (Android) or CollabDoc (desktop) opens.

## Security properties

- `#keyHex` is never sent to any server in any HTTP request (RFC 3986 §3.5 — fragments are not transmitted).
- The key arrives at the app via the `appUrlOpen` event, which is an in-process IPC call. No network transmission of the key occurs.
- The Capacitor App plugin receives the full URL (including fragment) from the Android intent system. Android does not log intent extras to external services by default.
- On desktop, the URL is passed via `process.argv` or `app.on('open-url')` — fully in-process.

## Behaviour and edge cases

- **App not installed:** On Android, if K-Perception is not installed, the OS shows "No application to handle this link". The link cannot fall back to a browser because browsers do not handle `kperception://` scheme.
- **Vault locked on link open:** The deep link is queued. Unlock screen is shown. After unlock, the link is processed.
- **Expired share link:** If the share link has expired, DocRoom returns an error on WebSocket connect. The app shows "This collaboration session has expired."
- **Multiple deep links:** If multiple `kperception://collab/` links are received while the app is in the background, only the most recent is processed. The `collabPending` field holds a single URL string; each new deep link overwrites the previous pending value.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Registration method | `setAsDefaultProtocolClient` | AndroidManifest intent filter | Not supported |
| Handler event | `app.on('second-instance')` or `open-url` | `App.addListener('appUrlOpen')` | N/A |
| Fragment preservation | Yes (IPC passes full URL) | Yes (intent passes full URL) | N/A |

## Plan availability

Deep links to collab sessions require Vault/Lifetime or Team/Enterprise.

## Permissions and roles

No special permissions. The deep link routing is available to all authenticated users.

## Related articles

- [Mobile collaborative editor](mobile-collab-editor.md)
- [Real-time collaboration with Y.js](realtime-yjs.md)
- [Share links](../sharing/share-links.md)

## Source references

- `mobile/src/App.tsx` — Capacitor App `appUrlOpen` listener
- `src/renderer/src/collab/CollabShareSession.ts` — session creation from URL
- `src/main/index.ts` — Electron protocol client registration
