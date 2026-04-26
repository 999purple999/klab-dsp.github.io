---
title: "Share viewer"
slug: "share-viewer"
category: "Sharing"
tags: ["share-viewer", "public", "collab", "web"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["web"]
last_reviewed: "2026-04-26"
source_refs:
  - "share-page/"
  - "private-sync-worker/src/share.ts"
  - "src/shared/shareCrypto.ts"
related: ["share-links", "permissions", "revocation", "collaboration/realtime-yjs"]
---

# Share viewer

## What it is

The share viewer is a static Cloudflare Pages web application hosted at **kperception-share.pages.dev**. When you share a note with someone, the link you send them opens this viewer. The viewer reads the decryption key from the URL fragment (the `#...` part), fetches the ciphertext from the K-Perception backend, decrypts the content client-side, and renders the note in the browser.

No K-Perception account is required to view a shared note. The viewer works in any modern browser.

## When to use it

- Share a note with a colleague who does not have K-Perception installed.
- Give a client read-only access to a project document.
- Publish a document publicly (anyone with the link can view it).
- Collaborate on a note in real time with external users via the collab viewer.

## Step by step

1. Create a share link from within K-Perception (see [Share links](share-links.md)).
2. Copy the link and send it to the recipient.
3. The recipient opens the link in any browser.
4. The viewer loads at `kperception-share.pages.dev`. The page reads the `#keyHex` fragment.
5. The viewer POSTs the share ID (from the URL path) to the K-Perception API to retrieve the ciphertext.
6. The `keyHex` is imported as a `CryptoKey` via the Web Crypto API.
7. The ciphertext is decrypted client-side with AES-256-GCM.
8. The note is rendered in the appropriate mode: Markdown → rendered HTML, Docs → rich text, LaTeX → KaTeX rendering.

![Share viewer rendering a Markdown note](../assets/share-viewer-1.png)

## Pages and routes

The viewer includes several pages:

| URL path | Purpose |
|---|---|
| `/` | Default note viewer (View and Comment modes) |
| `/collab/` | Collaborative editor with Y.js real-time editing |
| `/ws/` | Workspace document viewer |
| `/status` | Service status page |

## Collaborative share viewer

When the share link grants **Edit** permission and the collab flag is set, the viewer at `/collab/` activates the Y.js layer:

- A WebSocket connects to the DocRoom Durable Object for the shared document.
- All Y.js updates are encrypted with the share key before transmission.
- Multiple viewers can edit simultaneously in real time.
- A presence strip shows other connected viewers (display names only, if authenticated).
- Version snapshots appear in a timeline sidebar. Click any snapshot to preview the document at that point in time.
- Undo/Redo is available at the document level.

## Comment mode

If the link grants **Comment** permission:

- The document is rendered read-only.
- A comment panel is shown at the right or bottom of the page.
- Anyone (including anonymous visitors) can submit a comment by entering a display name and message.
- Comments are stored server-side associated with the share link ID. Comment body text is stored in plaintext in the server database (D1) — comment content is not end-to-end encrypted.
- The note owner sees new comments in their K-Perception notification inbox.

## Behaviour and edge cases

- **Fragment not sent to server:** Per RFC 3986 §3.5, browsers do not include the `#fragment` in HTTP requests. The server receives only the share ID and fetches the ciphertext. The decryption key (`keyHex`) never reaches the server.
- **Link expiry:** If the link has expired, the viewer shows an "This link has expired" error page.
- **Revoked links:** Revoked links return HTTP 404 from the API. The viewer shows "Link not found or revoked."
- **Password-protected links:** The viewer detects the password flag from the API response and shows a password prompt before decryption. See [Password protection](password-protection.md).
- **Unsupported modes:** In the personal note share viewer (`/`), Sheets and Canvas note types are not handled — the content is rendered as plain text rather than a dedicated viewer or a "download the app" message. Workspace documents shared via the `/ws/` viewer do render Sheets as a table and Canvas as a drawing.
- **No tracking:** The viewer does not set any cookies, use analytics, or fingerprint visitors. No request from the viewer includes personally identifiable information.
- **Offline:** The viewer requires an internet connection (it fetches ciphertext from R2 via the Worker).
- **Mobile browsers:** The viewer is fully responsive. On Android, deep links (`kperception://...`) in the viewer's collab page open the K-Perception app if installed; otherwise they fall back to the browser view.

## Platform differences

The share viewer runs in any modern web browser. There is no desktop-app or Android-app version of the viewer. When opened on Android with K-Perception installed, the OS may offer to open the link in-app instead.

## Plan availability

| Plan | Share link availability |
|---|---|
| Local | Up to 2 active links |
| Guardian and above | Unlimited links |

The viewer itself is always accessible — recipients do not need a paid plan.

## Permissions and roles

The note owner controls what recipients can do:
- **View:** read-only rendering.
- **Comment:** can add comments.
- **Edit:** full collaborative editing.

The server enforces these permissions on API calls; the viewer respects them in the UI.

## Security implications

This is the most critical security property of the viewer:

1. The decryption key is only in the URL fragment. Browsers do not send fragments in HTTP requests. Server logs and Cloudflare analytics show only the share ID, never the key.
2. Even if the K-Perception backend is fully compromised, an attacker reading the server logs cannot reconstruct the plaintext — the key was never transmitted.
3. The plaintext is decrypted client-side in the visitor's browser. It is displayed in the DOM and may appear in browser history, clipboard, screenshots, or browser extensions. Advise recipients of this.
4. Sharing a link effectively makes the content accessible to anyone who receives the URL (including the fragment). Use revocation if you need to rescind access.

## Settings reference

There are no settings for the share viewer itself. Share link settings (expiry, password, permissions) are configured in K-Perception when creating the link.

## Related articles

- [Share links](share-links.md)
- [Permissions](permissions.md)
- [Password protection](password-protection.md)
- [Revocation](revocation.md)
- [Real-time collaboration with Y.js](../collaboration/realtime-yjs.md)

## Source references

- `share-page/` — static viewer source (index.html, collab.html, ws.html, status.html)
- `private-sync-worker/src/share.ts` — share API route handler
- `src/shared/shareCrypto.ts` — AES-256-GCM share link cryptography
