---
title: "Encrypted Channels"
slug: "workspaces/channels"
category: "Workspaces"
tags: ["channels", "messaging", "E2EE", "threads", "voice", "collaboration"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/migrations/0018_channels.sql"
  - "private-sync-worker/migrations/0026_channel_message_key_version.sql"
  - "private-sync-worker/migrations/0027_channel_voice_blob.sql"
related:
  - "workspaces/overview"
  - "workspaces/sections"
  - "workspaces/groups"
  - "workspaces/presence"
  - "workspaces/members-and-roles"
---

## What it is

**Channels** are end-to-end encrypted text rooms within a workspace. Every message sent in a channel — including text, attachments, and voice recordings — is encrypted on the sender's device before transmission. The Cloudflare infrastructure relays and stores only ciphertext.

Each channel belongs to a section, which means the channel's encryption key is derived from that section's `SK_section`. Access to a channel is controlled by both section membership and an explicit channel-level ACL.

Channels support:
- Persistent encrypted message history
- Threaded replies
- Pinned messages
- Voice messages (encrypted audio blobs stored in R2)
- Real-time message delivery via a per-channel Durable Object (DocRoom DO)
- @user mentions with push notifications
- Access control lists (ACL) to restrict channel access to subsets of section members

## When to use it

Use channels for:
- Ongoing team conversations that need a persistent, searchable history
- Project-specific discussions tied to a section
- Announcements (restrict to Admin-send only via ACL)
- Voice memos shared with the team
- Real-time collaboration alongside a shared document (a per-channel DocRoom DO provides the relay infrastructure)

For one-to-one or small-group direct messages, use the personal DM feature (if available on your plan). Channels are designed for group communication.

## Step by step

### Creating a channel

1. In the workspace sidebar, click the **+** button next to the **Channels** heading, or go to Admin console → **Channels** → **New channel**.
2. Fill in:
   - **Name**: e.g., `#engineering` (encrypted at rest)
   - **Description**: optional summary (encrypted at rest)
   - **Section**: which workspace section this channel belongs to
   - **ACL**: which members or groups can access the channel (defaults to all section members)
3. Click **Create**. The client derives the channel key from `SK_section` + the channel's UUID using HKDF and sends only encrypted metadata to the Worker.

### Sending a message

1. Type your message in the composer at the bottom of the channel.
2. Press **Enter** to send (or **Shift+Enter** for a newline).
3. The message text is encrypted with the channel key (AES-256-GCM, random IV per message) and sent to the Worker.
4. The Worker writes the ciphertext to D1 and fans it out to connected clients via the per-channel DocRoom DO.

### Starting a thread

To reply to a message and start a thread:
1. Hover over the message and click the **Reply** icon (or long-press on mobile).
2. A thread panel opens on the right (detail pane). Type your reply.
3. Threads are displayed as an indented sub-list under the parent message in the channel feed and in full in the thread detail pane.

### Pinning a message

1. Hover over the message → click the **...** menu → **Pin to channel**.
2. Pinned messages appear in a collapsible header strip at the top of the channel.
3. Any member with write access to the channel can pin messages; unpinning follows the same flow.

### Sending a voice message

1. In the composer, click the **microphone** icon.
2. Grant microphone permission if prompted.
3. Record your message (tap **Stop** or click the stop button when done).
4. The audio is encrypted with the channel key (AES-256-GCM) and uploaded as a blob to Cloudflare R2.
5. A message is sent to the channel containing the encrypted R2 blob key and duration metadata.
6. Recipients download and decrypt the audio blob when they tap/click **Play**.

Voice message schema was introduced in migration `0027_channel_voice_blob.sql`.

### @mentioning a user

Type `@` followed by a username to mention a member. A dropdown autocomplete shows matching members in the workspace. Selecting a mention embeds a structured mention token in the encrypted message. The Worker extracts mention tokens from the decrypted payload on delivery [NOTE: mention detection happens server-side only to route notifications — the Worker has a scoped read of mention tokens] and sends a push notification to the mentioned user.

## Channel key and key versioning

Each channel has a **channel key** derived as:

```
channel_key = HKDF(SK_section, "channel:" + channelId, SHA-256)
```

When a channel key is rotated (e.g., when a member with channel access is removed), the new key is stored with an incremented **key version** number. Each message in D1 stores the key version it was encrypted with (`key_version` column, added in migration `0026_channel_message_key_version.sql`). Decryption selects the correct historical channel key for each message.

This design means old messages encrypted under a previous key version remain readable to members who hold the old key, while new messages under the rotated key are not readable by revoked members.

## The per-channel DocRoom Durable Object

Each channel has a dedicated **DocRoom Durable Object (DO)** in the Cloudflare Workers runtime. This DO is responsible for:

- Maintaining WebSocket connections for all active participants in the channel.
- Fan-out: broadcasting incoming encrypted messages to all connected clients in real time.
- Presence heartbeats for the channel (who is currently viewing).

The DocRoom DO processes only encrypted payloads; it has no access to the channel key and cannot read message content.

## Behaviour and edge cases

- **Message order**: Messages are ordered by server-assigned `created_at` timestamp. If two clients send messages simultaneously, the server ordering determines display order.
- **Message editing**: Edit support may not be fully implemented in all clients. Contact support for confirmation.
- **Message deletion**: A deleted message replaces its ciphertext with a tombstone record in D1. The R2 blob (for voice messages) is deleted.
- **Maximum message length**: There is no confirmed hard limit on message length. Contact support for confirmation.
- **Channel archival**: Channel archive (read-only preservation) is not yet confirmed as a supported action. Contact support for compliance archival needs.
- **Channel deletion**: Deletes all message rows from D1 and all associated R2 blobs (voice messages, attachments). Requires Admin role. The DocRoom DO is torn down.
- **Group-scoped channels**: A channel can have a `groupId` field. When set, the channel is visible only to members of that group (in addition to Admins). The ACL is enforced server-side.

## Platform differences

- **Windows / Web**: Full channel UI with thread panel in the detail pane, voice recording, pinned-message header strip. Channel creation available in sidebar and Admin console.
- **Android**: Channel messages displayed in a single-column scrollable feed. Thread view opens a new screen. Voice recording supported (device microphone permission required). Channel creation via Admin console on mobile.

## Plan availability

Channels are available on **Team** and **Enterprise** plans.

| Feature | Team | Enterprise |
|---------|------|-----------|
| Channels (text) | Yes | Yes |
| Threads | Yes | Yes |
| Pinned messages | Yes | Yes |
| Voice messages | Yes | Yes |
| Channel ACL | Yes | Yes |
| Group-scoped channels | Yes | Yes |

## Permissions and roles

| Action | owner | admin | editor | guest |
|--------|-------|-------|--------|-------|
| Create channel | Yes | Yes | No | No |
| Delete channel | Yes | Yes | No | No |
| Send message (if in ACL) | Yes | Yes | Yes | Yes |
| Pin message | Yes | Yes | Yes | No |
| Manage channel ACL | Yes | Yes | No | No |
| Rotate channel key | Yes | Yes | No | No |

## Security implications

- Channel messages are encrypted per-message with a random IV. Even if two messages have identical plaintext, their ciphertexts differ.
- The channel key is derived from `SK_section`, so revoking a member from a section also prevents them from deriving the channel key. For complete forward secrecy after a member removal, rotate the channel key (triggers the section key rotation flow).
- Voice message blobs in R2 are encrypted before upload; R2 never holds plaintext audio.
- The per-channel DocRoom DO sees only ciphertext and cannot read message content.
- @mention notification routing is the only operation where the Worker inspects message structure; mention tokens are part of the encrypted payload and are extracted only during delivery.

## Settings reference

| Setting | Location | Notes |
|---------|----------|-------|
| Channel name | Admin → Channels → edit | Encrypted |
| Channel description | Admin → Channels → edit | Encrypted |
| Channel section | Admin → Channels → edit | Determines key derivation path |
| Channel ACL | Admin → Channels → Permissions | Members and groups with access |
| Channel groupId | Admin → Channels → edit | Scopes channel to a group |

## Related articles

- [Workspace overview](workspaces/overview)
- [Sections](workspaces/sections)
- [Groups](workspaces/groups)
- [Presence](workspaces/presence)
- [Members and roles](workspaces/members-and-roles)

## Source references

- `private-sync-worker/src/workspaces.ts` — channel CRUD routes, message handling
- `private-sync-worker/migrations/0018_channels.sql` — channels and messages schema
- `private-sync-worker/migrations/0026_channel_message_key_version.sql` — key version on messages
- `private-sync-worker/migrations/0027_channel_voice_blob.sql` — voice message blob storage
- `private-sync-worker/migrations/0031_notifications.sql` — notification routing for @mentions
