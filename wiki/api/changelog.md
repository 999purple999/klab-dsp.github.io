---
title: "API Changelog"
slug: "api-changelog"
category: "API"
tags: ["api", "changelog", "migrations", "versioning"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/migrations/"
related: ["api-overview", "api-workspaces", "api-companies", "api-scim", "api-webhooks"]
---

# API Changelog

This page summarises the database migrations and significant API surface changes by migration number. Each migration corresponds to a schema change deployed to the K-Perception worker. API consumers can use this to understand when features became available.

Migration numbering is sequential. Production deployments apply all migrations up to and including the current schema version.

---

## Migration 0001 — Initial schema

Foundation tables: users, sessions, provider accounts, workspace change log.

---

## Migration 0002 — Stripe billing

Stripe subscription and entitlement tables. Tier-gated features (`plan_tier`) first available.

---

## Migration 0003 — Share links

Anonymous share link creation and access.

---

## Migration 0004 — Change log

`workspace_change_log` table. Foundation for the `/api/v1/workspaces/:id/notes` cursor-pagination endpoint.

---

## Migration 0005 — Key wraps

Per-member wrapped key storage. Foundation for end-to-end encrypted key distribution.

---

## Migration 0006 — Storage quota

Per-workspace storage quota enforcement.

---

## Migration 0007 — Collaborative share sessions

Collab share session tokens for real-time co-editing deep links.

---

## Migration 0008 — Team features

Workspace teams and admin scopes.

---

## Migration 0009 — Real-time collaboration

`collab_rooms` Durable Object state. Real-time Y.js CRDT sync tables.

---

## Migration 0011 — Workspace full

Consolidated workspace schema: sections, members, audit events, key wraps, invites.

---

## Migration 0012 — Workspace enterprise

**First availability of the enterprise API surface:**
- `workspace_sso_configs` — SAML/OIDC SSO configuration
- `workspace_scim_tokens` — SCIM 2.0 authentication tokens
- `workspace_scim_mappings` — IdP user/group sync records
- `workspace_api_keys` — scoped API keys for `/api/v1/` endpoints
- `workspace_webhooks` + `workspace_webhook_subscriptions` + `workspace_webhook_deliveries` — webhook delivery infrastructure
- `workspace_ip_allowlist` — IP-based access control

The `/api/v1/workspaces/:id/` REST endpoints and SCIM 2.0 endpoints first became available after this migration.

---

## Migration 0013 — Unified sharing

Consolidated file sharing tables.

---

## Migration 0014 — Tier local

Local (email+password) authentication tier tables.

---

## Migration 0016 — Workspace industrial

Admin scopes, invite policy and quorum, TOTP step-up 2FA tables.

---

## Migration 0017 — Workspace backups

Ciphertext-only backup and restore tables. `workspace_backups` and `backup_key_wraps`.

---

## Migration 0018 — Channels

End-to-end encrypted channels, threads, pins, per-channel DocRoom.

---

## Migration 0019 — Groups

Workspace groups backed by sections. SCIM group provisioning available after this migration.

---

## Migration 0020 — File DEK refactor

Per-blob DEK wrapping chain (`WDK → SK_section → SK_dir → DEK → ciphertext`). `keyMode` field added to file records.

---

## Migration 0021 — Calendar

Calendar event tables.

---

## Migration 0022 — Gantt

Gantt board and task tables.

---

## Migration 0023 — Citations and presence

Citation registry and cursor presence tables.

---

## Migration 0024 — Company and backups

Company hierarchy tables: `companies`, `company_members`, `company_workspace_links`, `company_audit_events`. Company API endpoints (`/companies/`) first available after this migration.

Scheduled backup tables (`backup_schedules`, `backup_replicas`).

---

## Migration 0025 — User reviews

User/workspace review endpoint tables.

---

## Migration 0028 — File versions

Per-file version history (`workspace_file_versions`).

---

## Migration 0029 — File ACL

Per-file access control lists.

---

## Migration 0030 — Share links (v2)

Revised share link schema with no-backtrack enforcement.

---

## Migration 0031 — Notifications

In-app notification tables.

---

## Migration 0033 — Entitlements and seats

Seat-count enforcement for team plans.

---

## Migration 0034 — Local auth

Email+password credential tables (`local_credentials`). Password reset flow available after this migration.

---

## Migration 0035 — Company SSO

OIDC SSO configuration for company-level identity providers. Company SAML ACS endpoint available at `https://api.kperception.app/company/{companyId}/saml/acs`.

---

## Migration 0036 — Company SSO certificate

X.509 certificate storage for SAML assertion signing verification.

---

## Migration 0037 — Dead letter log

`dead_letter_log` table for failed webhook and task deliveries. Rows are pruned after 30 days.

---

## Migration 0038 — WebAuthn credentials

Passkey/WebAuthn credential tables.
