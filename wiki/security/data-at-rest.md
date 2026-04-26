---
title: "Data at Rest"
slug: "data-at-rest"
category: "Security"
tags: ["data-at-rest", "D1", "R2", "encryption", "storage", "metadata"]
audience: "developer"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/migrations/0001_init.sql
  - private-sync-worker/migrations/0011_workspace_full.sql
  - private-sync-worker/migrations/0016_workspace_industrial.sql
related:
  - "zero-knowledge-model"
  - "key-hierarchy"
  - "aes-gcm-encryption"
  - "threat-model"
---

# Data at Rest

## What it is

K-Perception stores data across three locations: Cloudflare D1 (SQLite database), Cloudflare R2 (object storage), and the local device (vault database). This article describes what is stored in each location, what is encrypted, and what is stored in plaintext.

## Cloudflare D1 — SQLite database

D1 is the server-side relational database. It stores structured metadata, wrapped key material, and encrypted content fields.

### What is encrypted in D1

Content fields that would reveal information about the user's work are stored encrypted. These columns contain AES-256-GCM ciphertext (base64-encoded `iv ‖ ciphertext`):

| Table | Encrypted columns | Key used |
|-------|------------------|---------|
| `workspaces` | `name_enc`, `description_enc`, `settings_enc` | WDK |
| `workspace_sections` | `name_enc` | WDK |
| `workspace_folders` | `name_enc` | WDK |
| `workspace_teams` | `name_enc` | WDK |
| `workspace_audit_events` | `body_enc` | WDK (key_version tracks rotation) |
| `workspace_content_changelog` | `summary_enc` | WDK |
| `workspace_mentions` | `context_enc` | WDK |
| `workspace_user_totp` | `secret_enc`, `backup_codes_enc` | `WORKSPACE_TOTP_ENC_KEY` (server-side key) |
| `sync_objects` (personal) | payload is stored in R2 (see below) | NDK / MVK-derived |
| `workspace_wrapped_keys` | `wrapped_key` | ECDH wrap key (per-device) |
| `workspace_member_section_keys` | `wrapped_key` | ECDH wrap key |
| `workspace_recovery_wraps` | `wrapped_key` | PBKDF2-derived MasterKey |

### What is stored in plaintext in D1

The following fields are stored unencrypted and are visible to the server:

| Field type | Examples |
|-----------|---------|
| User IDs | `user_id` (server-generated UUID) |
| Session IDs | `session_id` |
| Device IDs | `device_id` |
| Timestamps | `created_at`, `updated_at`, `server_accepted_at`, `issued_at`, `expires_at` |
| File / blob sizes | `ciphertext_size`, `bytes_attributed` |
| Workspace membership | `workspace_id`, `user_id`, `role` |
| Object types | `entity_type` (e.g. `note`, `attachment`) |
| Plan tier | `plan_tier`, `tier` |
| Status flags | `status`, `tombstone`, `revoked_at`, `deleted_at` |
| CIDR rules | `cidr` in `workspace_ip_allowlist` |
| Audit event type | `event_type` (body is encrypted) |
| IP address hashes | `actor_ip_hash` (SHA-256 of the connecting IP) |
| Sequence numbers | `canonical_seq`, `head_seq` |
| Payload hashes | `payload_hash` (SHA-256 of plaintext before encryption) |

The payload hash (`payload_hash`) is SHA-256 of the plaintext content computed client-side before encryption. It allows deduplication and corruption detection, but does not reveal the content (SHA-256 is one-way).

### D1 schema commentary

From migration 0011:
> Server never sees plaintext workspace content — every `*_enc` column is AES-256-GCM(WDK, iv ‖ plaintext) base64.

## Cloudflare R2 — object storage

R2 stores encrypted content blobs. The R2 key for each object follows the pattern `{namespace_id}/{object_type}/{object_id}.enc` for personal vault objects.

**All objects in R2 are encrypted.** R2 never receives plaintext. The client encrypts the payload with the appropriate key (DEK for files, WDK-derived key for notes) before uploading.

| Object type | Key used |
|-------------|---------|
| Personal vault notes / attachments | NDK / MVK-derived key |
| Workspace files (`wrapped-dek-v1` mode) | Per-file DEK (itself wrapped by SK_dir in D1) |
| Workspace files (`derived-v1` mode, legacy) | HKDF-derived file key from WDK |
| Workspace snapshots | WDK |
| Export blobs | WDK |
| Workspace backup blobs | WDK (ciphertext-only backup) |

## Local device storage

Each device maintains a local vault database. On desktop (Electron), this is a SQLite file on disk. On Android, it is stored in the app's private storage area.

**The local vault is encrypted at the application level** by a key derived from the user's vault password (Argon2id). Additionally:
- Desktop: Electron `safeStorage` provides OS-level encryption (macOS Keychain, Windows DPAPI) for the session blob
- Android: The Android Keystore can optionally protect the session and vault key (biometric unlock flow)
- Web: `localStorage` stores the session token only; vault content is fetched from the server as needed

The local vault stores:
- Decrypted notes (in memory, not persisted) when the vault is unlocked
- Cached encrypted objects (ciphertext from R2)
- The user's vault key material (encrypted by the vault password)
- Wrapped key blobs received from the server

## Storage usage tracking

The server tracks storage consumption for quota enforcement without accessing content:

```sql
CREATE TABLE IF NOT EXISTS workspace_storage_usage (
  workspace_id      TEXT PRIMARY KEY,
  notes_bytes       INTEGER NOT NULL DEFAULT 0,
  attachments_bytes INTEGER NOT NULL DEFAULT 0,
  snapshots_bytes   INTEGER NOT NULL DEFAULT 0,
  exports_bytes     INTEGER NOT NULL DEFAULT 0,
  trash_bytes       INTEGER NOT NULL DEFAULT 0,
  total_bytes       INTEGER NOT NULL DEFAULT 0,
  ...
);
```

Byte counts are based on `ciphertext_size` — the size of the encrypted blob, not the plaintext. The server does not know the compression ratio or the actual plaintext size.

## Behaviour and edge cases

- **Deletion**: A tombstone flag (`tombstone = 1`) marks an object as deleted. The actual R2 blob may be retained for a grace period before permanent deletion.
- **Key rotation**: After WDK rotation, old encrypted blobs remain in R2 until re-encrypted by a client. During the transition window, both old and new key versions may be active.
- **Backup**: Workspace backups are ciphertext-only — the backup contains the same encrypted blobs as the live workspace. A backup restore requires the current WDK.

## Related articles

- [Zero-Knowledge Model](zero-knowledge-model.md)
- [Key Hierarchy](key-hierarchy.md)
- [AES-256-GCM Encryption](aes-gcm-encryption.md)
- [Threat Model](threat-model.md)
