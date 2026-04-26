# Wiki Verification Status

Generated: 2026-04-26  
Last updated: 2026-04-26 (full verification pass complete)

## Status: ✓ COMPLETE

All 157 wiki articles have been verified against the K-Perception source code.

**Initial state:** 316 [NEEDS-VERIFY] items across 95 files  
**Final state:** 0 [NEEDS-VERIFY] items in any article file

## Verification methodology

Each article was checked against actual source files:

- `private-sync-worker/src/` — Cloudflare Worker routes and business logic
- `private-sync-worker/migrations/` — D1 schema (ground truth for data models)
- `src/shared/` — Shared types, KDF constants, crypto utilities
- `src/renderer/src/` — Desktop renderer UI components
- `mobile/src/` — Android/Capacitor implementations
- `src/lib/` — Auth adapters, sync queue, client utilities

## Resolution categories

**Confirmed from source (updated with evidence):**
- Argon2id KDF params (m=19456, t=2, p=1) — `src/shared/kdf.ts`
- Session tokens are opaque UUIDs, not JWTs — `private-sync-worker/src/session.ts`
- Workspace roles: owner|admin|editor|commenter|viewer|guest — migration 0011
- Company roles: super-admin|billing-admin|auditor|observer — `src/shared/company.ts`
- Webhook headers: X-Kp-Signature, X-Kp-Timestamp, X-Kp-Event, X-Kp-Delivery — `workspaceEnterprise.ts`
- Webhook retry: 5 attempts, 4^attempt seconds backoff — `workspaceEnterprise.ts`
- TOTP step-up only (not login gate), 10 backup codes — `workspaceIndustrial.ts`
- Recovery codes: Crockford Base32, PBKDF2 600k — `src/shared/workspaceRecovery.ts`
- KPX format: pbkdf2-sha256, 310,000 iterations, 32-byte salt — `src/shared/exportPackage.ts`
- Share link password: PBKDF2 100k — `src/shared/shareCrypto.ts`
- Backup retention default: 30 — migration 0024
- Elevation token TTL: 300s, header X-KP-Elevation — `workspaceIndustrial.ts`
- Android minSdkVersion: 22 (Android 5.1) — `mobile/android/variables.gradle`
- Sync batch size: MAX_BATCH_SIZE=50 — `mobile/src/sync/workerSync.ts`
- Invite link expiry: 7 days — `workspaces.ts`
- Quorum threshold default: 1 — migration 0016
- IP allowlist: Enterprise plan only — `workspace.ts`
- SCIM auto-create: does NOT create accounts, maps NULL if no match — `workspaceEnterprise.ts`
- Presence heartbeat: PRESENCE_HEARTBEAT_MS=30,000ms — source confirmed
- `collabPending` queue: single string|null (last-wins) — `mobile/src/App.tsx`
- GDPR export audit event: COMPANY_POLICY_CHANGED — `company.ts`

**Replaced with "contact support" language:**
- Business/legal claims (SOC2, BAA, SLA, HIPAA certification)
- URL paths for legal documents (terms, privacy, AUP)
- Billing logic (payment methods, discounts, VAT, refunds)
- Data residency specifics (Cloudflare D1/R2 region configuration)
- UI features not confirmable from source (iCal export, BibTeX import, recurring events UI)
- Plan-specific workspace limits (entitlement values not in source constants)

## Files verified

All 157 article files across 16 subdirectories:
- getting-started/ (8 files)
- editors/ (16 files)
- organization/ (9 files)
- sharing/ (6 files)
- sync-and-storage/ (9 files)
- collaboration/ (7 files)
- workspaces/ (20 files)
- enterprise/ (21 files)
- security/ (12 files)
- authentication/ (8 files)
- api/ (10 files)
- cli/ (3 files)
- platforms/ (7 files)
- compliance/ (6 files)
- legal/ (10 files)
- faq/ (5 files)
