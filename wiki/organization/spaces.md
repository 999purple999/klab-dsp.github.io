---
title: "Encrypted Spaces"
slug: "spaces"
category: "Organization"
tags: ["spaces", "encryption", "partitioning", "passphrase", "EncryptedSpaceGate"]
audience: "user"
plan: ["vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/encryptedSpaces.ts"
  - "src/renderer/src/components/SpacesPanel.tsx"
related: ["folders", "tags", "collections", "trash-and-purge", "security-implications"]
---

## What it is

A **Space** is a separately encrypted partition within your vault. While the vault key (derived from your account password via PBKDF2) protects everything in your default vault, each Space has its **own encryption key** derived from a distinct Space passphrase that you set when creating the Space.

The technical implementation lives in `src/shared/encryptedSpaces.ts` (`EncryptedSpaceGate`). The Space key is an AES-256-GCM key derived from the Space passphrase using PBKDF2 (100,000 iterations, SHA-256). Space notes are encrypted with the Space key, not the vault key. The Space key is never stored on disk; it only exists in memory while the Space is unlocked.

From the outside — from the perspective of the sync Worker, D1 database, and R2 storage — Space notes look identical to regular notes: opaque ciphertext blobs with object IDs. There is no server-visible flag indicating that a blob belongs to a Space. The server cannot distinguish a Space note from a regular note.

---

## When to use it

Spaces are designed for scenarios where you want genuinely separate access control within a single account — not just organisational separation (which folders and tags provide), but **cryptographic separation**:

- **Work vs personal context** — keep professional notes in a Space with a separate passphrase so that someone who borrows your unlocked device cannot access them without the Space passphrase.
- **Highly sensitive material** — health records, legal documents, personal finance, or private journals that you want protected even if someone gains access to your vault password.
- **Shared device scenarios** — multiple family members using the same device, each unlocking their own Space.
- **Confidential project notes** — notes you want to protect from exposure even in screen-share situations (Space is locked when not in use).

Spaces are **not** the same as workspaces (team collaboration environments). Spaces are a personal vault feature; they live entirely on your account.

---

## Step by step

### Creating a Space

1. Open the **Spaces** panel in the left sidebar (desktop) or via the hamburger menu / Spaces tab (Android).
2. Click / tap **+ New Space**.
3. Enter a Space **name** (this name is visible in the locked state — choose something that does not reveal the contents).
4. Enter and confirm a **Space passphrase**. This passphrase must be different from your vault password. It is not recoverable by K-Perception — if you forget it, the Space contents are permanently inaccessible.
5. Click / tap **Create**. The Space is created and immediately unlocked in the current session.

### Entering (unlocking) a Space

1. In the Spaces panel or sidebar, click / tap the locked Space.
2. Enter the Space passphrase in the prompt dialog.
3. The Space unlocks and its notes become visible in the note list, scoped to the Space.

### Locking a Space

- Click / tap the **lock icon** next to the Space name in the sidebar.
- Or: go to Spaces panel → long-press (Android) or right-click (desktop) the Space → **Lock Space**.
- Or: the Space locks automatically on vault lock or on idle timeout (see Settings below).

When locked, the Space's notes are cryptographically inaccessible — the Space key is removed from memory.

### Working inside a Space

Once a Space is unlocked, you work inside it exactly as you would in the default vault:
- The note list shows only the Space's notes.
- Folders, tags, Collections, and Trash all function per-Space.
- The search scope is limited to the open Space by default (toggle available to expand).
- New notes are created in the Space by default.

### Renaming a Space

Right-click (desktop) or long-press (Android) the Space in the panel → **Rename**. The Space name is stored encrypted in the default vault (using the vault key, not the Space key), so renaming does not require the Space passphrase to be entered again.

### Deleting a Space

Right-click / long-press → **Delete Space**. This permanently destroys the Space and all its notes. A confirmation dialog requires you to type the Space name to confirm. This action is irreversible — there is no recovery once a Space is deleted.

---

## Behaviour and edge cases

**Space passphrase is not recoverable.** The Space key is derived purely from the passphrase via PBKDF2 with a per-Space random salt. K-Perception stores the salt and a verification token (MAC over a known test vector) in the default vault's encrypted metadata, but it never stores the key itself. If you forget the Space passphrase, the contents are lost permanently.

**Space name visibility in locked state.** The Space name (e.g., "Health", "Work Confidential") is visible to anyone with access to your unlocked default vault — it is stored in the default vault's metadata. Only the note contents and their metadata inside the Space are protected by the Space key. Choose Space names that do not themselves reveal sensitive information if needed.

**Space idle timeout.** Not confirmed in current source — contact support for confirmation. No idle-timeout setting for Spaces was found in the current source (`src/shared/encryptedSpaces.ts` or related UI components).

**Multiple Spaces open simultaneously.** You can have more than one Space unlocked at the same time. Each Space key is held in memory independently. Switching between unlocked Spaces does not require re-entering the passphrase.

**Spaces on mobile (Android).** Not confirmed in current source — contact support for confirmation. The `EncryptedSpaceGate` component exists in the shared codebase, but full Spaces management UI on Android has not been confirmed in the current mobile source.

**Spaces and sync.** Space note blobs are synced across devices like any other note — they are stored in R2 as ciphertext. The Space key (passphrase-derived) is independent of the vault key. This means you can access a Space on any device as long as you know the Space passphrase. The vault key alone is insufficient to open a Space.

**Spaces and KPX export.** When exporting a KPX vault backup, you choose whether to include Spaces. If included, Space notes are re-encrypted under the KPX export password (which replaces both the vault key and Space keys for the purpose of the backup file).

**Notes cannot be moved between Spaces.** A note created inside Space A cannot be directly moved to Space B or the default vault, because it was encrypted with Space A's key. To move content, you would copy the text manually. This is an intentional cryptographic boundary.

---

## Platform differences

| Feature | Windows (Electron) | Android (Capacitor) | Web (PWA) |
|---|---|---|---|
| Spaces panel in sidebar | Yes | Hamburger menu / tab | Yes |
| Create Space | Yes | Not confirmed in current source — contact support for confirmation. | Yes |
| Unlock Space | Yes | Yes | Yes |
| Lock Space manually | Yes | Yes | Yes |
| Auto-lock on idle | Not confirmed in current source — contact support for confirmation. | Not confirmed in current source — contact support for confirmation. | Not confirmed in current source — contact support for confirmation. |
| Search within Space | Yes | Yes | Yes |
| Rename Space | Yes | Not confirmed in current source — contact support for confirmation. | Yes |
| Delete Space | Yes | Not confirmed in current source — contact support for confirmation. | Yes |

---

## Plan availability

Encrypted Spaces are a premium feature. They are not available on Local or Guardian plans.

| Plan | Spaces |
|---|---|
| Local | No |
| Guardian | No |
| Vault | Yes (limit not confirmed in current source — contact support for confirmation) |
| Lifetime | Yes (limit not confirmed in current source — contact support for confirmation) |
| Team | Yes |
| Enterprise | Yes |

---

## Permissions and roles

**Personal vault:** Spaces are personal. They exist within your account only. No other user, including K-Perception staff, can access a Space's contents.

**Workspace:** Spaces are not a workspace feature. Workspaces have their own section-level key hierarchy (SK_section, HKDF-derived from the WDK). Do not confuse personal Spaces with workspace sections.

---

## Security implications

Spaces provide genuine cryptographic partitioning. Key properties:

- **Space key derivation:** `PBKDF2(passphrase, space_salt, 100000, SHA-256, 32)` → AES-256-GCM key.
- **Vault key cannot decrypt Space notes.** Even if your vault password is compromised, an attacker cannot read Space contents without the Space passphrase.
- **In-memory key only:** The Space key is never written to disk, LocalStorage, or any persistent store. It exists only in the renderer process memory while the Space is unlocked.
- **Server blindness:** The server stores Space note blobs as standard ciphertext. There is no flag, prefix, or indication in D1 or R2 that distinguishes Space blobs from regular blobs.

The primary threat model addressed by Spaces is: **physical device access by someone who knows (or guesses) your vault password but not your Space passphrase.** Use a genuinely distinct passphrase for your Space — do not reuse your vault password.

---

## Settings reference

| Setting | Location | Default | Description |
|---|---|---|---|
| Auto-lock Spaces on vault lock | Settings → Spaces | On | Lock all open Spaces when the vault is locked |
| Space idle timeout | Settings → Spaces → Auto-lock after | Not confirmed in current source — contact support for confirmation. | Time after last Space activity before auto-lock |
| Include Spaces in KPX export | Export dialog | Prompted | Whether Space notes are included in vault backup exports |
| Show Space panel in sidebar | Settings → Sidebar | On | Toggle Space panel visibility |

---

## Related articles

- [Folders](folders.md) — each Space has its own independent folder tree
- [Tags](tags.md) — tags are Space-scoped; tag suggestions do not cross Space boundaries
- [Search](search.md) — search is scoped to the current open Space by default
- [Trash and purge](trash-and-purge.md) — each Space has its own Trash with the same retention logic
- [KPX format](../sync-and-storage/kpx-format.md) — Space contents in vault exports
- [Cross-device sync](../sync-and-storage/cross-device.md) — how Space blobs sync and how the key is supplied on a second device

---

## Source references

- `src/shared/encryptedSpaces.ts` — `EncryptedSpaceGate` class: key derivation, lock/unlock, encrypt/decrypt helpers
- `src/renderer/src/components/SpacesPanel.tsx` — desktop Spaces panel UI
- `src/renderer/src/hooks/useSpaceKey.ts` — in-memory Space key management
