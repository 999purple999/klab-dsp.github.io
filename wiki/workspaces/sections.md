---
title: "Sections"
slug: "workspaces/sections"
category: "Workspaces"
tags: ["sections", "encryption", "SK_section", "HKDF", "access-control"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "src/shared/workspaceKeyManager.ts"
  - "private-sync-worker/migrations/0016_workspace_industrial.sql"
related:
  - "workspaces/overview"
  - "workspaces/groups"
  - "workspaces/files-and-directories"
  - "workspaces/members-and-roles"
  - "workspaces/admin-console"
---

## What it is

A **section** is the fundamental cryptographic partition of a K-Perception workspace. Every piece of content in a workspace — documents, files, channel messages, calendar events, Gantt tasks, citations — belongs to exactly one section. Each section has its own **Section Key** (`SK_section`) derived from the workspace's root Workspace Data Key (WDK) using HKDF.

The derivation formula is:

```
SK_section = HKDF(WDK, "section:" + sectionId, SHA-256)
```

Because `SK_section` is derived deterministically from the WDK and the section's UUID, any member who holds a valid WDK can re-derive any section key on demand. Revoking a member's access to a specific section therefore requires rotating that section's key (replacing it with a new one that the departing member cannot derive).

Sections let you answer the question: "which subset of workspace content should this person be able to see?" You control that by controlling which sections a member or group has access to.

## When to use it

Use sections to:

- Separate sensitive content (e.g., an HR section that only HR admins can read) from general team content.
- Organize workspace content into logical domains (Engineering, Marketing, Finance, etc.).
- Grant a guest or contractor access to a limited slice of workspace data without exposing the full workspace.
- Back a group with a section, so that group membership directly controls access to the section's content.

## Step by step

### Creating a section

1. Open the Admin console (gear icon in the sidebar).
2. Go to the **Crypto** tab.
3. Click **New section**.
4. Enter a section name (encrypted at rest) and optionally restrict access to specific members or groups.
5. Confirm. The client derives the new `SK_section` from the WDK using the new section's UUID, encrypts the section metadata, and sends it to the Worker.

### Assigning members to a section

Members are assigned to sections either directly (by user_id) or through groups. In the Admin console:

- Go to **Members** tab → select a member → **Edit permissions** → toggle section access.
- Or go to **Groups** tab → select a group → **Sections** → toggle the section.

### Viewing section key metadata

In the Admin console → **Crypto** tab, each section has a row showing:
- Section name (decrypted client-side)
- Section ID (UUID)
- Key version (increments on each rotation)
- Last rotated date
- Members with access

## Section types

### Regular sections

The default type. A named logical partition you create to organise workspace content. Examples: General, Engineering, Marketing, HR.

### Files section (auto-provisioned)

Every workspace automatically gets a special section named `files-{wsId.slice(0,8)}`. This section is the root of the workspace file system. All workspace files are encrypted under keys derived from this section's `SK_section` (further derived to `SK_dir` and then to per-blob DEKs). You cannot delete the files section.

### Group-backed sections

When a group is created, a section is provisioned for it such that `SK_group ≡ SK_section`. The section key and the group key are the same key. Membership in the group is equivalent to holding the section key. This design ensures that removing a user from a group (and triggering a section key rotation if needed) is sufficient to revoke their access to all content protected by that section.

## Per-section encryption

Every content item in a section is encrypted under a key derived from that section's `SK_section`:

| Content type | Key used |
|-------------|---------|
| Documents | `SK_section` (directly, via AES-256-GCM) |
| Files | `SK_section` → `SK_dir` → wrapped DEK |
| Channel messages | `SK_section` → channel key (HKDF) |
| Calendar events | `SK_section` → calendar key (HKDF, calendarCrypto.ts) |
| Gantt tasks | `SK_section` → gantt key (HKDF, ganttCrypto.ts) |
| Citations | `SK_section` → citations key (HKDF) |

Metadata stored in D1 (section name, document titles, filenames) is also encrypted — the server cannot read the names of sections or the documents within them.

## Per-section key rotation

Key rotation replaces an existing `SK_section` with a new independently random key. After rotation, all content in the section is re-encrypted with keys derived from the new section key, and all members' WDK wraps are refreshed to include the new derivation path.

**Rotation is required when:**
- A member is removed who previously had access to the section.
- A security incident is suspected.
- Compliance policy mandates periodic rotation.

**Rotation process:**
1. Admin console → **Crypto** tab → section row → **Rotate key**.
2. A TOTP elevation token is required (dangerous operation).
3. The Worker validates the token and marks the section key as `rotation_pending`.
4. The client downloads all content in the section (ciphertext + wrapped keys), re-encrypts with the new section key, and uploads the new ciphertext.
5. Once all re-encryption is confirmed, the old key material is deleted from D1.
6. Members who had access to the old section key but are no longer members will not receive the new key, effectively revoking their access.

> Note: For large sections, key rotation is an intensive operation. Plan for a window of elevated API usage during rotation. The WorkspaceShell shows a rotation-in-progress banner.

Per-section key rotation was introduced in migration `0016_workspace_industrial.sql` (HKDF SSK support).

## Section visibility and access

A member can see a section if:
1. They are directly listed in the section's `member_access` list, **or**
2. They are a member of a group whose `SK_group` matches the section's `SK_section`.

If neither condition is met, the section is invisible to the member — it does not appear in their sidebar and they cannot request access to it.

The Owner and all Admins can see all sections in the Admin console regardless of their section membership (they can manage sections they are not content-members of).

## Behaviour and edge cases

- **Deriving section keys**: Because `SK_section = HKDF(WDK, "section:" + sectionId)`, a member can derive any section key as long as they hold the WDK. The section membership list in D1 is an access-control check performed server-side, but it does not prevent a determined member from computing the derived key locally. To truly revoke access, rotate the section key to a new independently random value that cannot be derived from the old WDK.
- **Renaming a section**: Section names are encrypted; renaming does not affect the section key. Rename via Admin → Crypto → edit section name.
- **Deleting a section**: Requires deletion of all content in the section first. Sections with content cannot be deleted. The files section cannot be deleted at all.
- **Maximum sections per workspace**: There is no hard documented limit; practical limits are imposed by D1 row counts and client-side HKDF performance.

## Platform differences

- **Windows / Web**: Section management is available in the Admin console Crypto tab with full key rotation UI.
- **Android**: Members can view sections and navigate to section content, but section creation and key rotation require the desktop or web client.

## Plan availability

Sections are available on **Team** and **Enterprise** plans. Enterprise plans also get per-section TOTP-gated rotation (from `0016_workspace_industrial.sql`).

## Permissions and roles

| Action | owner | admin | editor | guest |
|--------|-------|-------|--------|-------|
| View section (if workspace member) | Yes | Yes | Yes | Yes |
| Create section | Yes | Yes | No | No |
| Rename section | Yes | Yes | No | No |
| Delete section | Yes | Yes | No | No |
| Rotate section key | Yes | Yes | No | No |
| Manage section membership | Yes | Yes | No | No |

## Security implications

- `SK_section` is derived from the WDK using HKDF, which means it is deterministic: any member with the WDK can derive it. Rotating the section key to an independently random value is the only way to establish true cryptographic isolation between a member and a section after they have held the WDK.
- Section metadata (names, member lists) stored in D1 is partially encrypted (names are encrypted). Member IDs in the access list are stored in plaintext for server-side access checks.
- A compromised Admin account that holds the WDK can derive all section keys. Protect Admin accounts with strong TOTP configuration and IP allowlisting (Enterprise).

## Settings reference

| Setting | Location | Notes |
|---------|----------|-------|
| Section name | Admin → Crypto → section row | Encrypted |
| Section key version | Admin → Crypto → section row | Read-only |
| Section members | Admin → Crypto → section row | User IDs |
| Key rotation | Admin → Crypto → Rotate key | Requires elevation token |

## Related articles

- [Workspace overview](workspaces/overview)
- [Groups](workspaces/groups)
- [Files and directories](workspaces/files-and-directories)
- [Members and roles](workspaces/members-and-roles)
- [Admin console](workspaces/admin-console)

## Source references

- `private-sync-worker/src/workspaces.ts` — section CRUD routes and rotation logic
- `src/shared/workspaceKeyManager.ts` — `deriveSection()` HKDF implementation
- `private-sync-worker/migrations/0011_workspace_full.sql` — sections table schema
- `private-sync-worker/migrations/0016_workspace_industrial.sql` — per-section key rotation (HKDF SSK)
- `private-sync-worker/migrations/0019_groups.sql` — group-backed sections (`SK_group ≡ SK_section`)
