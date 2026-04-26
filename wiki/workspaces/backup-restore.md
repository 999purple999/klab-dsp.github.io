---
title: "Workspace backup and restore"
slug: "backup-restore"
category: "Workspaces"
tags: ["backup", "restore", "disaster-recovery", "workspace"]
audience: "admin"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/0017_workspace_backups.sql"
  - "private-sync-worker/migrations/0024_company_backups.sql"
  - "private-sync-worker/src/workspaceEnterprise.ts"
related: ["workspaces/admin-console", "enterprise/elevation-tokens", "enterprise/dangerous-ops"]
---

# Workspace backup and restore

## What it is

Workspace backups are ciphertext-only snapshots of all workspace data (D1 metadata rows + R2 blobs) taken at a specific point in time. "Ciphertext-only" means the backup contains encrypted data — it cannot be read without the WDK, which only workspace members hold. Backups are stored in a separate R2 path from live data.

Backup capability was added in migration `0017_workspace_backups.sql` and extended for company-level backups in `0024_company_backups.sql`.

## When to use it

- Regular disaster recovery precaution.
- Before performing a key rotation or other irreversible operation.
- Before bulk-deleting old files.
- Compliance requirement (some regulations mandate periodic data backups).

## Step by step

### Creating a manual backup

1. Admin console → **Backups** tab.
2. Click **Create backup now**.
3. The Worker takes a snapshot: reads all workspace R2 blobs and D1 rows, writes them to `backups/{wsId}/{timestamp}/`.
4. A progress indicator is shown. For large workspaces, the backup may take several minutes.
5. On completion, the backup appears in the list with: timestamp, size, status (success/failed).

### Automated backups

1. Admin console → **Backups** → **Configure schedule**.
2. Select frequency: daily, weekly, or monthly.
3. Select retention count (keep last N backups).
4. Click **Save**.
5. The backup cron job runs at the configured schedule.

### Restoring from a backup

**Warning:** This is a dangerous operation requiring TOTP step-up.

1. Admin console → **Backups** → select a backup → **Restore**.
2. The `DangerousOpModal` opens: read the warning (restoring will overwrite all current workspace data).
3. Enter your TOTP code to obtain an elevation token.
4. Type `CONFIRM` and click **Restore**.
5. The Worker:
   a. Validates the elevation token.
   b. Takes a pre-restore snapshot (safety net).
   c. Replaces current workspace R2 blobs and D1 rows with the backup content.
6. All workspace members are notified that a restore occurred.
7. Audit event: `backup.restored`.

## Backup storage path

Backups are stored in Cloudflare R2 at:
```
backups/{workspaceId}/{unix_timestamp_ms}/manifest.json
backups/{workspaceId}/{unix_timestamp_ms}/blobs/{blobKey}.enc
```

The manifest lists all blob keys and D1 schema version at backup time.

## Behaviour and edge cases

- **Ciphertext-only:** The backup contains encrypted blobs. Without the WDK (which is NOT stored in the backup), the backup is unreadable. This is a privacy feature.
- **Backup size:** Equal to current workspace live data size (all R2 blobs).
- **Backup quota:** Backups are stored under a separate R2 key path (`workspaces/{workspaceId}/backups/{backupId}.json`) distinct from live content, and do not count against the workspace's user-facing quota meter.
- **Retention policy:** The schedule configuration enforces retention by deleting the oldest backups when the count exceeds the configured limit.
- **Restore during active collab sessions:** Active WebSocket sessions (DocRoom) are disconnected on restore. Users see a "Workspace restored" notification and must reconnect.
- **Key rotation after restore:** If the WDK was rotated after the backup was taken, restoring the backup re-introduces content that was accessible under the old key. Admins should re-evaluate key rotation after a restore.
- **Company backups:** Company-level backups (migration `0024`) follow the same pattern but cover all workspaces under the company.

## Platform differences

Backup management is in the admin console, identical across platforms.

## Plan availability

Workspace backups require Team or Enterprise.

## Permissions and roles

- View backup list: Admin, Owner.
- Create backup: Admin, Owner.
- Restore backup: Admin, Owner (requires elevation token).

## Security implications

The backup files in R2 are ciphertext — unreadable without the WDK. Even if an attacker gains access to the R2 bucket, they cannot read workspace content. The WDK is not stored in the backup.

Restoring a backup is irreversible (all current data is overwritten). The mandatory pre-restore snapshot provides one level of safety. The DangerousOpModal + elevation token requirement prevents accidental or unauthorised restores.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Backup schedule | Disabled | Admin console → Backups → Configure |
| Retention count | 30 backups | Admin console → Backups → Configure |

## Related articles

- [Admin console](admin-console.md)
- [Elevation tokens](../enterprise/elevation-tokens.md)
- [Dangerous operations](../enterprise/dangerous-ops.md)

## Source references

- `private-sync-worker/migrations/0017_workspace_backups.sql` — backup schema
- `private-sync-worker/migrations/0024_company_backups.sql` — company backup schema
- `private-sync-worker/src/workspaceEnterprise.ts` — backup/restore route handlers
