---
title: "Comments on Shared Notes"
slug: "comments"
category: "Sharing"
tags: ["comments", "annotations", "sharing", "threaded", "anonymous", "collaboration"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/share.ts"
  - "share-page/"
related: ["share-links", "permissions", "revocation", "share-viewer"]
---

## What it is

Comments are threaded annotations that recipients of Comment-level or Edit-level share links can leave on a shared note. They appear in a comment panel alongside the rendered note content at the share viewer. Comments support both anonymous participants (no K-Perception account required) and authenticated participants (signed in with a K-Perception account).

Comments are associated with a share link ID, not directly with the encrypted note content. This keeps the comment model simple and server-verifiable without requiring the server to understand note content. The note owner can view, moderate, and delete comments from within K-Perception on any platform.

## When to use it

The comments feature is designed for workflows where you want structured feedback on a note without giving the reviewer write access to the note itself:

- Sending a draft article to an editor for annotations before incorporating changes.
- Sharing a project proposal with stakeholders and collecting their reactions in a structured thread.
- Distributing meeting notes and inviting attendees to clarify or flag items.
- Gathering feedback from users who do not have K-Perception accounts.
- Creating a lightweight review workflow where all comments are visible to all reviewers simultaneously.

If you want reviewers to directly edit the note text, use an Edit-level link instead.

## Step by step

### Enabling comments on a shared note

Comments are available automatically on any share link with Comment or Edit permission. When you create a Comment-level link, the share viewer automatically displays the comment panel. No additional setup is required.

To share a note for comments:

1. Open the note and click **Share** in the toolbar.
2. Select **Comment** (or **Edit**) as the permission level.
3. Set an expiry and optional password if desired.
4. Click **Generate link** and copy the link.
5. Send the link to your reviewers.

### Posting a comment as a recipient (anonymous)

1. Open the share link in a browser.
2. The share viewer renders the note alongside a comment panel on the right (or below on narrow viewports).
3. Click **Add comment** or the `+` button.
4. Enter your **Display name** (required) and optionally an **Email address** (used only for reply notifications if supported by your plan; never publicly displayed).
5. Type your comment in the text field. Plain text is supported; Markdown formatting is not rendered in comments.
6. Click **Post**. Your comment appears in the thread.

### Posting a comment as a recipient (authenticated)

1. Open the share link in a browser while signed in to K-Perception (or sign in from the share viewer).
2. Your name from your K-Perception profile is pre-filled as the display name.
3. Post the comment. Authenticated comments display a verified badge next to the display name.

### Replying to a comment

1. Click **Reply** under any existing comment.
2. The reply field opens nested below the parent comment.
3. Type and post. Replies are displayed indented under the parent comment thread.

### Viewing and moderating comments as the note owner

1. Open the note in K-Perception.
2. A comment count badge appears on the note in the note list (e.g., "3 comments").
3. Click the note to open it; the editor toolbar shows a **Comments** button with the count.
4. Click **Comments** to open the comment panel inside the editor.
5. All comments and replies are visible, along with the commenter's display name, timestamp, and (if authenticated) verification badge.
6. Click the `…` menu next to any comment to:
   - **Delete comment** — removes the comment from the share viewer immediately.
   - **Copy comment text** — copies the comment content to clipboard.
   - (Future: Flag comment, Mark as resolved.)

### Deleting your own comment as a recipient

1. At the share viewer, click the `…` menu next to your comment.
2. Select **Delete**. You can only delete comments posted in the current browser session (session-based ownership token stored in the comment record). After closing the browser tab, you cannot delete your own comment without asking the note owner.

## Behaviour and edge cases

**Comment storage.** Comments are stored in D1 associated with the share link ID (`share_link_id` foreign key). They are stored as plaintext on the server — this is by design. Comments are metadata annotations; they are not part of the encrypted note vault. The server can read comment text. This is a deliberate trade-off: encrypting comments with the share key would mean the server cannot serve comment thread data without the client decrypting everything first, which would break server-side notification and moderation features. Consider this when deciding what to write in comments on sensitive shared notes.

**Comment thread structure.** The data model supports two levels: top-level comments and one level of replies. Deeply nested threading (replies to replies) is not currently supported.

**Comment count.** The total comment count for a note (across all active share links) is visible on the note card in the note list. The count updates in near-real-time via periodic polling when the note is selected.

**Comments after link revocation.** Revoking a share link stops all future access to the shared content but does not delete the comments associated with that link. Comments remain accessible to the note owner in the editor comment panel. This allows you to retain the feedback even after closing the share access.

**Comments after note deletion.** If the note is deleted, all associated share links are revoked (if auto-revoke is enabled) and the comment records are cascade-deleted from D1 as part of the note deletion pipeline.

**Anonymous commenter identity.** Anonymous commenters are identified only by their chosen display name. There is no identity verification. A commenter can enter any display name. Do not treat anonymous comment display names as verified identities.

**Authenticated commenter badge.** Authenticated commenters (signed in to K-Perception) receive a small verified badge visible at the share viewer and in the owner's comment panel. The badge indicates the comment was posted by a verified K-Perception account holder, not an anonymous visitor.

**Notifications.** When a new top-level comment or reply is posted on a shared note, the note owner receives an in-app notification (bell icon in the toolbar). Email notifications for new comments are available on Guardian and above if an email address is configured in account settings.

**Comment length.** Comments are limited to 2 000 characters. Longer comments are truncated at the input field.

**Rich text in comments.** Comments support plain text only. Markdown syntax is not rendered. Code blocks, bold, italic, and other formatting are displayed as raw characters.

**Rate limiting.** The comment POST endpoint has per-IP and per-share-link rate limits to prevent spam. Anonymous commenters are limited to 10 comments per hour per share link per IP address. Authenticated commenters have a higher limit (50 per hour per share link).

## Platform differences

| Feature | Windows (Electron) | Android | Web (PWA) |
|---|---|---|---|
| View comments on owned notes (editor panel) | Yes | Yes | Yes |
| Delete comments as owner | Yes | Yes | Yes |
| Comment count badge on note list | Yes | Yes | Yes |
| In-app notification for new comments | Yes | Yes | Yes |
| Post comment as recipient (share viewer) | Browser | Browser | Browser |
| Reply to comment (share viewer) | Browser | Browser | Browser |
| Delete own comment as recipient (share viewer) | Browser | Browser | Browser |
| Authenticated comment via K-Perception account | Browser | Browser | Browser |

## Plan availability

All plans that support share links also support comments. The comment feature itself has no plan restriction beyond the share link requirement.

| Plan | Comments enabled | Email notifications for new comments |
|---|---|---|
| Local (free) | Yes (on up to 2 active links) | No |
| Guardian (€3.49/mo) | Yes | Yes |
| Vault (€7.99/mo) | Yes | Yes |
| Lifetime (€149) | Yes | Yes |
| Team (€6.99/user/mo) | Yes | Yes |
| Enterprise (€14.99/user/mo) | Yes | Yes |

## Permissions and roles

| Role | Can view comments | Can post comments | Can delete own comments | Can delete any comment |
|---|---|---|---|---|
| Note owner | Yes | Yes | Yes | Yes |
| View-level link holder | Yes | No | No | No |
| Comment-level link holder | Yes | Yes | Yes (same session) | No |
| Edit-level link holder | Yes | Yes | Yes (same session) | No |
| Workspace Admin (workspace files) | Yes | Yes | Yes | Yes |

View-level link holders can read the existing comment thread but cannot post new comments or replies. This allows "audience" members to see the discussion without being able to contribute.

## Security implications

### Comment plaintext storage

This is the most important security consideration for comments: **comment text is stored as plaintext on the sync worker's D1 database**. Unlike note content, which is encrypted with keys that never reach the server, comments are readable by K-Perception infrastructure, Cloudflare (as the D1 provider), and anyone with access to the D1 database.

This design decision exists because:
- Comments are metadata annotations intended to be served alongside the shared content.
- The server needs to be able to count, paginate, and serve comments without the client providing the decryption key on every request.
- Comment notifications and moderation would be impractical if comments were encrypted at rest with the share key.

**Practical guidance:** Do not include sensitive information (personal data, confidential business details, private correspondence) in share link comments. Treat comments as semi-public annotations on a shared document.

### Anonymous identity

Anonymous commenters can impersonate any display name. If you receive a comment claiming to be from a specific person, the only way to verify their identity is to check whether their comment shows the authenticated account badge. If it does not, the display name is unverified.

### Comment data in the event of a breach

If the D1 database were exfiltrated by an attacker, comment text would be exposed in plaintext. Note content would not — it remains protected by AES-256-GCM encryption.

### Spam and abuse

The rate limiting on the comment endpoint mitigates bulk comment spam but does not prevent a determined bad actor who operates from multiple IPs. If a share link is receiving abusive comments, revoke the link immediately. This terminates the commenting endpoint for that link. Future per-commenter blocking may be added in a later release.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Enable comments by default | Settings → Sharing | Pre-selects the permission level at Comment when creating new links (default: off, defaults to View) |
| Email notifications for comments | Settings → Account → Notifications | Sends email notification when a new comment is posted (Guardian and above) |
| In-app notifications for comments | Settings → Notifications | Shows bell-icon notification for new comments (default: on) |
| Auto-delete comments on link revocation | Settings → Sharing | Deletes comments when their associated share link is revoked (default: off — comments are retained for owner reference) |

## Related articles

- [Share Links](share-links.md) — creating share links that enable commenting.
- [Permissions](permissions.md) — which permission levels allow commenting.
- [Revocation](revocation.md) — revoking a link and the fate of its comments.
- [Share Viewer](share-viewer.md) — the share viewer UI where comments are displayed and posted.

## Source references

- `private-sync-worker/src/share.ts` — `GET /share/:id/comments` (list comments, paginated), `POST /share/:id/comments` (post comment, permission-checked), `DELETE /share/:id/comments/:commentId` (owner delete), rate limiting middleware.
- `share-page/` — comment panel component, reply UI, anonymous/authenticated comment form, session token management.
- Database migrations: `0030_share_links.sql` — `share_comments` table definition (id, share_link_id, parent_id, display_name, is_authenticated, account_id, body, created_at, session_token_hash).
