---
title: "kp-ws CLI Reference"
slug: "cli-kp-ws"
category: "CLI"
tags: ["cli", "kp-ws", "workspace", "automation", "members", "backups"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "cli/kp-ws/src/index.js"
  - "cli/kp-ws/src/api.js"
  - "cli/kp-ws/package.json"
related: ["cli-overview", "cli-kp-admin", "api-workspaces", "api-authentication"]
---

# kp-ws CLI Reference

`kp-ws` is the workspace automation CLI for K-Perception. It lets administrators manage workspace members, invites, sections, backups, and TOTP configuration from the command line.

**Authentication:** User session token (`Authorization: Bearer <jwt>`). The CLI calls the workspace management API (`/workspaces/`) on your behalf.

**Runtime requirement:** Node.js 20+

---

## Session management

### kp-ws login

```
kp-ws login --base-url <url> [--session-id <token>]
```

Authenticates and stores credentials locally. If `--session-id` is not provided, the CLI prompts for the token interactively.

| Flag | Description |
|------|-------------|
| `--base-url` | Worker base URL, e.g. `https://api.kperception.app` |
| `--session-id` | Session token (or set `KP_WS_SESSION_ID` env var) |

Credentials are stored in a local config file. The path is printed on successful login.

### kp-ws logout

```
kp-ws logout
```

Removes stored credentials.

### kp-ws whoami

```
kp-ws whoami [--json]
```

Displays the current authenticated user and session metadata.

---

## Workspaces

### kp-ws workspaces list

```
kp-ws workspaces list [--json]
```

Lists all workspaces accessible to the authenticated user.

### kp-ws workspaces show

```
kp-ws workspaces show <workspaceId> [--json]
```

Displays details for a specific workspace.

---

## Members

### kp-ws members list

```
kp-ws members list <workspaceId> [--json]
```

Lists all current members of the workspace.

**API call:** `GET /workspaces/:id/members`

### kp-ws members revoke

```
kp-ws members revoke <workspaceId> <userId> [--reason <text>] [--json]
```

Revokes a member's access to the workspace.

| Argument / Flag | Description |
|-----------------|-------------|
| `workspaceId` | Target workspace UUID |
| `userId` | User UUID to revoke |
| `--reason` | Optional human-readable revocation reason |

**API call:** `DELETE /workspaces/:id/members/:userId`

---

## Invites

### kp-ws invites list

```
kp-ws invites list <workspaceId> [--json]
```

Lists all pending invites for the workspace.

**API call:** `GET /workspaces/:id/invites`

### kp-ws invites create

```
kp-ws invites create <workspaceId> <email> [--role editor] [--display-name <name>] [--json]
```

Creates an invite for a new member.

| Argument / Flag | Description |
|-----------------|-------------|
| `workspaceId` | Target workspace UUID |
| `email` | Email address to invite |
| `--role` | Role to assign: `admin`, `editor`, `commenter`, `viewer` (default: `editor`) |
| `--display-name` | Display name for the invite |

**API call:** `POST /workspaces/:id/invites`

### kp-ws invites revoke

```
kp-ws invites revoke <workspaceId> <inviteId> [--json]
```

Revokes a pending invite.

**API call:** `DELETE /workspaces/:id/invites/:inviteId`

---

## Sections

### kp-ws sections list

```
kp-ws sections list <workspaceId> [--json]
```

Lists all sections in the workspace.

**API call:** `GET /workspaces/:id/sections`

---

## Backups

Backup operations that modify state (create and delete) require TOTP step-up authentication. The CLI prompts for the TOTP code and exchanges it for a short-lived elevation token automatically.

### kp-ws backups list

```
kp-ws backups list <workspaceId> [--json]
```

Lists all backups for the workspace.

**API call:** `GET /workspaces/:id/backups`

### kp-ws backups create

```
kp-ws backups create <workspaceId> [--label <text>] [--totp <code>] [--json]
```

Creates a new ciphertext-only backup. If `--totp` is not provided, the CLI prompts interactively.

| Flag | Description |
|------|-------------|
| `--label` | Human-readable label for the backup |
| `--totp` | TOTP code for step-up authentication |

**API call:** `POST /workspaces/:id/backups` with `X-KP-Elevation: <token>` header

### kp-ws backups download

```
kp-ws backups download <workspaceId> <backupId> [--out <file>] [--json]
```

Downloads a backup to a local file. If `--out` is not specified, the CLI determines a default filename.

**API call:** `GET /workspaces/:id/backups/:backupId/download`

### kp-ws backups delete

```
kp-ws backups delete <workspaceId> <backupId> [--totp <code>] [--json]
```

Deletes a backup. Requires TOTP step-up authentication.

**API call:** `DELETE /workspaces/:id/backups/:backupId` with `X-KP-Elevation: <token>` header

---

## TOTP

### kp-ws totp status

```
kp-ws totp status <workspaceId> [--json]
```

Displays TOTP (step-up 2FA) configuration status for the workspace. TOTP enrollment itself must be performed through the workspace settings UI.

**API call:** `GET /workspaces/:id/totp/status`

---

## Global flags

| Flag | Description |
|------|-------------|
| `--json` | Output raw JSON instead of human-readable table |

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `KP_WS_SESSION_ID` | Overrides the stored session token for this invocation |
| `KP_WS_BASE_URL` | Overrides the stored worker base URL for this invocation |

Environment variables take precedence over stored credentials, making them useful for CI/CD pipelines where interactive login is not available.

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Not logged in (for `whoami`) |
| `2` | Unknown command |
| Other non-zero | Unhandled error thrown by a command |
