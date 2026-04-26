---
title: "Share Link Permission Levels"
slug: "permissions"
category: "Sharing"
tags: ["permissions", "view", "comment", "edit", "access-control", "sharing"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/share.ts"
  - "src/shared/shareCrypto.ts"
related: ["share-links", "password-protection", "revocation", "comments", "realtime-yjs", "docroom-protocol"]
---

## What it is

Every K-Perception share link carries an embedded permission level that determines what the recipient can do at the share viewer. There are three levels: **View**, **Comment**, and **Edit**. The permission is stored inside the encrypted share token in the D1 database and is checked server-side on every relevant request. It cannot be upgraded by the recipient.

Permission levels for share links are entirely separate from workspace role-based access control (RBAC). A workspace Admin, Member, or Viewer role does not affect what a share link holder can do; the two systems operate independently.

## When to use it

Choosing the right permission level is a deliberate trust decision:

- **View** — when you want someone to read your note without any ability to interact with it. Suitable for publishing reference material, sharing a read-only document with a client, or distributing a finalized report.
- **Comment** — when you want feedback or annotations without giving the recipient control over the note content. Suitable for peer review, editorial review, or collaborative annotation workflows.
- **Edit** — when you want real-time co-authorship. Suitable for pair writing, meeting notes shared between participants, or any scenario where multiple people need to contribute content simultaneously. Edit links enable the full Y.js collaborative layer.

## Step by step

### Choosing a permission level when creating a link

1. Open the note and click **Share** in the toolbar.
2. In the Share dialog, locate the **Permission** selector (View / Comment / Edit).
3. Select the desired level.
4. Complete the remaining share link settings (expiry, optional password) and click **Generate link**.

The permission level is encoded into the share token at creation time. It cannot be changed after creation. To change the permission, revoke the existing link and create a new one with the desired level.

### Checking the permission level of an existing link

All active share links for a note are listed in the Share dialog. Each entry shows the permission level badge alongside expiry and access count.

### Giving a recipient a different permission level

Create multiple links from the same note — one at each required level — and distribute them to the appropriate recipients. You can have, for example, a public View link on your blog and a private Edit link for a writing partner, both active simultaneously for the same note.

## Behaviour and edge cases

**Permission is immutable.** Once a link is generated, the permission level is fixed. There is no "upgrade" or "downgrade" API for an existing link. Revoke and recreate to change it.

**Edit links require paid plan.** Edit-level links are unavailable on the Local (free) plan because they require the Y.js collab layer (DocRoom Durable Object), which is a paid infrastructure feature. Attempting to select Edit on Local will surface an upgrade prompt.

**Comment links without an account.** Comment-level recipients do not need a K-Perception account. They enter a display name (and optionally an email) at the share viewer and can post comments anonymously. See the Comments article for the full comment model.

**Edit links and note ownership.** An Edit-level recipient who modifies the note is applying changes through the Y.js CRDT relay. The modifications are encrypted client-side with the share key before reaching the server. The note owner's vault copy is updated automatically through the sync pipeline on their next app sync. The recipient cannot transfer, delete, or revoke the note; they only edit content.

**Multiple Edit links.** Having multiple active Edit links for the same note is supported. All Edit-level recipients (and the owner, if they have the note open) join the same DocRoom and collaborate in the same Y.js session. Awareness (cursor positions, display names) is visible across all participants.

**Permission enforcement on WebSocket connections.** When a recipient opens an Edit link, the share viewer requests a WebSocket upgrade to the DocRoom at `GET /share/collab/:id/ws`. The Worker validates the share token, extracts the permission level, and rejects the WebSocket upgrade with `403 Forbidden` if the token is View or Comment level. This server-side check is the enforcement backstop; the share viewer UI also hides the edit interface for non-Edit links, but client-side UI is not a security boundary.

**Permission enforcement on comment endpoints.** `POST /share/:id/comments` checks that the share token has at least Comment permission. A View-level token receives `403 Forbidden` on comment post attempts.

## Platform differences

| Feature | Windows (Electron) | Android | Web (PWA) |
|---|---|---|---|
| Select permission when creating | Yes | Yes | Yes |
| View-level recipient | Yes (browser) | Yes (browser or in-app) | Yes (browser) |
| Comment-level recipient | Yes (browser) | Yes (browser) | Yes (browser) |
| Edit-level recipient (desktop share viewer) | Yes (browser) | Yes (browser) | Yes (browser) |
| Edit-level recipient (native in-app collab) | N/A | Yes (MobileCollabEditor via deep link) | N/A |
| Multiple simultaneous Edit recipients | Yes | Yes | Yes |

## Plan availability

| Plan | View links | Comment links | Edit links | Multiple active links |
|---|---|---|---|---|
| Local (free) | Yes (max 2 total) | Yes (counts toward limit) | No | Max 2 across all permission levels |
| Guardian (€3.49/mo) | Yes | Yes | Yes | Unlimited |
| Vault (€7.99/mo) | Yes | Yes | Yes | Unlimited |
| Lifetime (€149) | Yes | Yes | Yes | Unlimited |
| Team (€6.99/user/mo) | Yes | Yes | Yes | Unlimited |
| Enterprise (€14.99/user/mo) | Yes | Yes | Yes | Unlimited |

## Permissions and roles

### What each permission level can do

| Capability | View | Comment | Edit |
|---|---|---|---|
| Read note content at share viewer | Yes | Yes | Yes |
| See rendered Markdown / LaTeX / HTML | Yes | Yes | Yes |
| Post top-level comments | No | Yes | Yes |
| Reply to existing comments | No | Yes | Yes |
| Delete own comments | No | Yes | Yes |
| Edit note text | No | No | Yes |
| Create new blocks / paragraphs | No | No | Yes |
| Delete blocks / paragraphs | No | No | Yes |
| See real-time cursor presence of other editors | No | No | Yes |
| Access version snapshots (read) | No | No | Yes |
| Access version snapshots (restore) | No | No | Yes |
| Generate a sub-share-link | No | No | No |
| Revoke the share link | No | No | No |
| Delete the note | No | No | No |

Note that "Generate a sub-share-link" is intentionally unavailable at all recipient permission levels. Only the note owner (authenticated, with the vault key) can create share links for a note. A recipient who has an Edit link cannot re-share the note through the K-Perception share system. They can, of course, copy the URL from their browser address bar — this is not preventable.

### Workspace RBAC vs share-link permissions

Workspace roles (Owner, Admin, Member, Viewer, Guest) govern access to documents within a workspace. Share links are a separate mechanism for sharing personal notes outside the workspace system. A workspace Viewer cannot use a share link to gain Edit-level access to a workspace document; the two systems do not interact.

For workspace file sharing, see the Workspace File Sharing documentation.

## Security implications

### Permission is server-enforced

The permission level in the share token is stored in D1 as part of the encrypted token record. The Worker reads it on every access-sensitive endpoint. This is the authoritative enforcement point — not the share viewer UI. The share viewer enforces permissions in the UI as a usability layer, but server-side checks provide the actual security boundary.

### The edit capability exposes note content to the recipient

An Edit-level recipient decrypts the note client-side at the share viewer and can read the full plaintext. They can also copy it, screenshot it, or save it locally. Granting Edit access is equivalent to handing the recipient a copy of the decrypted note. Plan accordingly.

### Revoking after content exposure

If you granted Edit access to a recipient and later determine they should not have had that access, you can revoke the link. Revocation prevents future access and terminates the DocRoom WebSocket session. It does not destroy any copy of the content the recipient may have already seen or saved. There is no "delete from recipient's memory" capability in any software system.

### Comment anonymity

Comment-level recipients who post without a K-Perception account appear as their chosen display name with no verified identity. There is no email verification for anonymous comments. Do not treat anonymous commenter identities as verified.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Default permission level | Settings → Sharing | Sets the pre-selected permission level in the Share dialog for new links |
| Show permission badge on link list | Settings → Sharing → Display | Shows View/Comment/Edit badge in the active links list (default: on) |

## Related articles

- [Share Links](share-links.md) — creating and managing share links, cryptographic overview.
- [Password Protection](password-protection.md) — adding a passphrase layer to any permission level.
- [Revocation](revocation.md) — revoking a link of any permission level.
- [Comments](comments.md) — the Comment permission level in detail.
- [Real-Time Y.js Collaboration](../collaboration/realtime-yjs.md) — the engine behind Edit links.
- [DocRoom Protocol](../collaboration/docroom-protocol.md) — server-side enforcement of Edit links.

## Source references

- `private-sync-worker/src/share.ts` — permission check logic in route handlers: `validateSharePermission()`, WebSocket upgrade guard, comment POST guard.
- `src/shared/shareCrypto.ts` — share token structure including permission field encoding.
- Database migrations: `0030_share_links.sql` (permission column), `0032_share_wrapped_dek.sql`.
