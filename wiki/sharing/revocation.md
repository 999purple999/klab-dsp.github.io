---
title: "Revoking Share Links"
slug: "revocation"
category: "Sharing"
tags: ["revocation", "sharing", "security", "access-control", "share-links"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/share.ts"
related: ["share-links", "permissions", "password-protection", "comments", "share-viewer", "docroom-protocol"]
---

## What it is

Revoking a share link is the act of permanently invalidating it so that no one — including people who already have the URL — can use it to access the shared note content again. Revocation is immediate: the moment you confirm revocation in the K-Perception app, the sync worker marks the share token as revoked in D1, and subsequent requests from the share viewer to that token receive a `410 Gone` response.

Revocation does not delete the underlying note. It only destroys the access pathway created by that specific link. The note remains in your vault, encrypted, unmodified.

## When to use it

Revoke a share link when:

- You shared a link with someone who should no longer have access (e.g., they left a project, a working relationship ended).
- The link URL was exposed in a channel where unintended recipients could see it (e.g., a chat thread, a shared document).
- You want to change the permission level or expiry of an existing link (since links cannot be edited in-place, revoke and recreate with the new settings).
- You want to change the password on a password-protected link.
- You are deleting the note and want to clean up all share access proactively.
- You are rotating your sharing practices and want a clean slate of active links.

## Step by step

### Revoking a single link

1. Open the note whose link you want to revoke.
2. Click **Share** in the toolbar to open the Share dialog.
3. Under **Active links**, find the link you want to revoke. Each entry shows permission level, expiry, and access count.
4. Click **Revoke** next to the link.
5. Confirm the revocation in the confirmation dialog ("This link will immediately stop working. Recipients will no longer be able to access the shared content. Are you sure?").
6. The link is removed from the active links list. Revocation takes effect within a few seconds globally (Cloudflare Workers propagate the D1 write quickly across edge nodes).

### Revoking all links for a note

1. Open the Share dialog for the note.
2. Scroll to the bottom of the active links list and click **Revoke all links**.
3. Confirm. All active links for that note are revoked in a single batch operation.

### Bulk revocation via the sharing settings page

1. Go to **Settings → Sharing → Active links**.
2. This page lists every active share link across all your notes, with note title, permission level, and expiry.
3. Use the checkboxes to select multiple links, then click **Revoke selected**.
4. Or click **Revoke all** to invalidate every active share link in your account in one operation.

### Revocation on note delete

By default (configurable in Settings → Sharing), deleting a note automatically revokes all of its share links. The share viewer will show a `410 Gone` response to anyone who attempts to access a revoked link after the note is deleted. If you disable this setting, deleted notes' share links will continue to return `410` anyway, because the ciphertext they reference will also have been deleted from storage.

## Behaviour and edge cases

**Revocation is immediate but not retroactive.** The share viewer will receive `410 Gone` on the next request after revocation. Any content that a recipient already has open in their browser tab has been decrypted locally and is in their browser's memory or rendered DOM. You cannot un-render content that has already been delivered to a browser. Revocation prevents all future access; it cannot undo past access.

**Active Y.js (Edit) sessions.** When you revoke an Edit-level link, the DocRoom Durable Object is notified. On the next message from any connected client in that collab session, the DocRoom closes the WebSocket connection with a `4403` close code (custom code meaning "link revoked"). The recipient's share viewer displays: "This collaborative link has been revoked. Your changes have been saved." The local Y.js document state is preserved in the share viewer's session storage for the duration of the browser tab, but the session is disconnected from the real-time sync.

**Pending saves on revocation.** If an Edit-level recipient had unsaved changes in a Y.js session when the link was revoked, those changes are lost server-side (the WebSocket closes before the final update is relayed). Changes already relayed to the DocRoom before revocation are present in the most recent version snapshot. The note owner will see those changes on next sync.

**revokeTokenHash mechanics.** When you create a share link, a `tokenHash` (SHA-256 of the random link token) is stored in D1. Revocation sets a `revokedAt` timestamp on that row. The Worker checks `revokedAt IS NULL` on every request. This approach means the server does not need to store the full token value — the hash is sufficient for lookup — and a database dump does not expose valid tokens (only hashes).

**Revocation visibility.** Once revoked, a link does not appear in the Share dialog active links list. There is currently no audit log of revoked links visible in the UI; a future release may add a revocation history view.

**Expiry vs revocation.** A link that has passed its expiry date behaves identically to a revoked link from the recipient's perspective (both return `410 Gone`). The difference is that expiry is automatic, while revocation is manual and immediate. An expired link does not appear as "revoked" in the active links list; it simply disappears when the expiry time passes.

**Plan downgrade.** If you downgrade from a paid plan to Local (free), your account is limited to 2 active share links. If you have more than 2 active links at the time of downgrade, the oldest links beyond the 2-link limit are automatically revoked. You will receive an in-app notification listing which links were revoked.

**Workspace file links.** Revoking a workspace file share link follows the same mechanics described above but is performed from the workspace file detail panel rather than the personal note share dialog.

## Platform differences

| Feature | Windows (Electron) | Android | Web (PWA) |
|---|---|---|---|
| Revoke single link | Yes | Yes | Yes |
| Revoke all links for note | Yes | Yes | Yes |
| Bulk revoke in Settings | Yes | Yes | Yes |
| Auto-revoke on note delete (configurable) | Yes | Yes | Yes |
| Revoke notification to active Y.js sessions | Yes | Yes | Yes |
| Plan downgrade auto-revocation | Automatic | Automatic | Automatic |

## Plan availability

Revocation is available on all plans including Local (free). There is no plan distinction for the revocation feature itself — you can always revoke any link you created.

| Plan | Can revoke links |
|---|---|
| Local (free) | Yes |
| Guardian (€3.49/mo) | Yes |
| Vault (€7.99/mo) | Yes |
| Lifetime (€149) | Yes |
| Team (€6.99/user/mo) | Yes |
| Enterprise (€14.99/user/mo) | Yes |

## Permissions and roles

Only the note owner (the authenticated K-Perception user whose vault key encrypted the note) can revoke share links for that note. A share link recipient — even one with Edit-level access — cannot revoke the link.

In a workspace context, workspace Admins and Owners can revoke file share links for any workspace file, not just files they created.

## Security implications

### What revocation guarantees

Revocation guarantees that the share viewer infrastructure (the `kperception-share.pages.dev` Cloudflare Pages site + the sync worker) will no longer serve ciphertext for the revoked token. From the moment revocation is recorded in D1, any request to `/share/{tokenId}` returns `410 Gone` with no ciphertext in the response body. This is a hard, server-enforced cut-off.

### What revocation does not guarantee

Revocation provides no guarantee about content the recipient already received. Browser-level caching, browser history, screenshots, copy-paste, or a local download of the decrypted content are all entirely outside K-Perception's control. Revocation is a forward-looking access control mechanism, not a data destruction mechanism.

If the ciphertext was cached by a browser or CDN before revocation, it is theoretically possible for a cache hit to serve the ciphertext. In practice, K-Perception share requests carry `Cache-Control: no-store, no-cache` headers to prevent CDN and browser caching of share content.

### revokeTokenHash and the token hash design

Storing only the SHA-256 hash of the token in D1 means that a complete D1 database dump does not yield any valid, unexpired share tokens. An attacker who has the database dump cannot reconstruct the token values from the hashes (SHA-256 is a one-way function). This is a deliberate security-in-depth measure: the token URL path component is treated like a password — only its hash is persisted server-side.

### Zero-knowledge preservation on revocation

Revocation does not involve decrypting or inspecting the note content. The Worker only updates a single column (`revokedAt`) in the share_links table. The ciphertext and IV are retained in D1/R2 until the garbage collection cycle (typically 24–48 hours after revocation), after which they are purged. At no point in the revocation flow does the server touch or see the plaintext.

### Emergency revocation procedure

If you believe a sensitive share link URL was leaked and you need to act immediately:

1. Open K-Perception on any device where your vault is unlocked.
2. Navigate to Settings → Sharing → Active links.
3. Click **Revoke all** to terminate all active share links across all notes instantly.
4. Review the note(s) that were linked and assess whether further action (vault key rotation, note deletion) is warranted.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Auto-revoke on note delete | Settings → Sharing | Revokes all links for a note when the note is deleted (default: on) |
| Notify on revocation | Settings → Sharing → Notifications | Sends an in-app notification when a link is revoked (useful for audit trail) |
| Show revoked links in history | Settings → Sharing → Display | Shows recently revoked links in the Share dialog history section (default: off) |

## Related articles

- [Share Links](share-links.md) — creating and managing share links, token structure.
- [Permissions](permissions.md) — permission levels and why you may need to revoke + recreate to change them.
- [Password Protection](password-protection.md) — changing a password requires revoking and recreating.
- [Share Viewer](share-viewer.md) — what the recipient sees when a link is revoked.
- [DocRoom Protocol](../collaboration/docroom-protocol.md) — how DocRoom handles revocation of active collab sessions.

## Source references

- `private-sync-worker/src/share.ts` — `DELETE /share/:id` handler (sets `revokedAt`), `GET /share/:id` guard (`revokedAt IS NULL` check), DocRoom revocation notification, bulk revoke endpoint.
- Database migrations: `0030_share_links.sql` — `revokedAt` column, `revokeTokenHash` column, index on `tokenHash`.
