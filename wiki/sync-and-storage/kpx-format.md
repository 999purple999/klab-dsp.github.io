---
title: "KPX encrypted export format"
slug: "kpx-format"
category: "Sync & Storage"
tags: ["kpx", "export", "backup", "format", "encryption"]
audience: "developer"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/exportPackage.ts"
  - "src/shared/backupPolish.ts"
related: ["editors/exports", "offline-first", "cross-device"]
---

# KPX encrypted export format

## What it is

KPX (K-Perception Encrypted Export) is the proprietary portable vault backup format. A `.kpx` file is a ZIP archive containing all your notes and attachments, each individually encrypted with a key derived from a user-supplied export password. Unlike the vault itself (which uses the vault master key), a KPX file uses a completely separate key so you can share the export password independently from your account password.

## When to use it

- Migrate your vault to a new device before cloud sync is available.
- Create a local offline backup of your entire vault.
- Securely hand off a vault to another person (they decrypt with the export password you provide separately).
- Archive a vault snapshot that is independent of the K-Perception service.

## Step by step

### Export (create a .kpx file)

1. In K-Perception (desktop or web), go to Account settings → Export vault or use File → Export vault.
2. Choose format: **KPX (encrypted portable)**.
3. Enter an export password. This password is used to derive the KPX encryption key. It is separate from your vault password and not stored anywhere.
4. Confirm the password.
5. Click **Export**. The KPX file is saved to your Downloads folder.

### Import (restore from .kpx file)

1. On the target device, open K-Perception.
2. On the unlock/login screen, choose **Import from KPX**.
3. Select the `.kpx` file.
4. Enter the export password.
5. The vault is decrypted and imported into the local store.
6. After import, set up your account sync (optional) to push the imported vault to the cloud.

## File format specification

A `.kpx` file is a standard ZIP archive (compatible with any ZIP tool, though the contents are encrypted and unreadable without the KPX key).

### ZIP structure

```
vault-export.kpx (ZIP)
├── manifest.json         ← unencrypted, describes the archive
├── meta/
│   └── kdf_params.json   ← unencrypted KDF parameters
└── objects/
    ├── {object_id_1}.enc ← AES-256-GCM encrypted blob
    ├── {object_id_2}.enc
    └── …
```

### `manifest.json`

```json
{
  "kpx_version": "1.0",
  "created_at": "2026-04-26T00:00:00Z",
  "object_count": 1234,
  "app_version": "2.0.0"
}
```

### `kdf_params.json`

```json
{
  "algorithm": "pbkdf2-sha256",
  "hash": "SHA-256",
  "iterations": 310000,
  "salt": "<base64-encoded 32-byte random salt>"
}
```

The salt is stored in plaintext in the archive — it is not secret. The security is in the password.

### Individual `.enc` files — byte layout

Each blob file is structured as:

```
┌─────────────────────────────────────────────────────────┐
│  12 bytes  │  Nonce (random IV for this blob)           │
│  N bytes   │  AES-256-GCM ciphertext                    │
│  16 bytes  │  GCM authentication tag (appended by API)  │
└─────────────────────────────────────────────────────────┘
```

- The KPX AES key is derived from the export password using PBKDF2-SHA256 with 310,000 iterations and a 32-byte random salt.
- A fresh 12-byte nonce is generated per blob (never reused).
- The GCM tag provides integrity authentication — any tampering is detected on import.

## Security properties

| Property | Value |
|---|---|
| Encryption algorithm | AES-256-GCM (NIST FIPS 197 + SP 800-38D) |
| Key derivation | PBKDF2-SHA256, 310,000 iterations |
| Salt | 32 bytes, random, stored in archive (Base64-encoded) |
| Nonce | 12 bytes, random per blob |
| Authentication | GCM tag (128-bit), integrity-verified on decrypt |
| Key separation | Export key is independent of vault master key |

## Behaviour and edge cases

- **Wrong password:** If the import password is incorrect, AES-GCM decryption of the first blob fails (auth tag mismatch). The import is aborted with an error.
- **Truncated archive:** If the ZIP is truncated or corrupted, individual `.enc` files with corrupt data will fail decryption. Successfully decrypted objects are imported; failed objects are logged.
- **Version compatibility:** `kpx_version: "1.0"` is the only current version. Future versions may use a different format and will be documented here.
- **Large vaults:** For vaults with thousands of notes, export may take several minutes as each blob is individually decrypted, re-encrypted with the KPX key, and written. A progress bar is shown.
- **Attachments included:** All attachment blobs are included in the KPX archive. The export represents the complete vault state.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Export to KPX | Yes | Yes | Yes |
| Import from KPX | Yes | Yes | Yes |
| Export destination | OS file dialog | Downloads folder | Browser download |
| Import source | OS file dialog | Files app | Browser file picker |

## Plan availability

KPX export and import are available on all plans, including the free Local plan.

## Permissions and roles

Any authenticated user can export their own vault. No admin permission is required.

## Security implications

The KPX key is derived entirely from the export password. The export password is never stored on the server or in the KPX file. If you lose the export password, the KPX archive cannot be decrypted — there is no recovery path.

Keep the `.kpx` file and the export password separate (e.g. store the file in cloud storage and the password in a password manager). Never store both in the same location.

## Related articles

- [Exports](../editors/exports.md)
- [Offline-first architecture](offline-first.md)
- [Cross-device sync](cross-device.md)

## Source references

- `src/shared/exportPackage.ts` — KPX export/import logic
- `src/shared/backupPolish.ts` — backup encryption pipeline
