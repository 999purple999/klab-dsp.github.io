---
title: "CLI Tools Overview"
slug: "cli-overview"
category: "CLI"
tags: ["cli", "automation", "kp-ws", "kp-admin"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "cli/kp-ws/package.json"
  - "cli/kp-admin/package.json"
  - "cli/kp-ws/src/index.js"
  - "cli/kp-admin/src/index.js"
related: ["cli-kp-ws", "cli-kp-admin", "api-overview", "api-authentication"]
---

# CLI Tools Overview

K-Perception ships two command-line tools for automation and administration:

| Tool | Purpose |
|------|---------|
| `kp-ws` | Workspace automation — manage members, invites, sections, backups, and TOTP |
| `kp-admin` | Platform administration — manage users, workspaces, storage, and audit log at the operator level |

Both CLIs are pure ES module packages with no runtime dependencies beyond Node.js 20+.

## Requirements

- **Node.js 20 or later** (specified in `engines` field of both `package.json` files)
- A valid session token (`kp-ws`) or admin bearer token (`kp-admin`)

## Installation

Both CLIs are **not published to the npm registry** — both `package.json` files have `"license": "UNLICENSED"` and no `publishConfig`. Installation is via the repository directly.

To use directly from the repository:

```sh
# kp-ws
node cli/kp-ws/bin/kp-ws.js <command>

# kp-admin
node cli/kp-admin/bin/kp-admin.js <command>
```

## Authentication

### kp-ws

`kp-ws` authenticates using a **user session token** (a JWT issued when the user signs in). The token is stored locally after `kp-ws login` and reused for subsequent commands.

Credentials can also be provided via environment variables to avoid interactive prompts:

| Variable | Description |
|----------|-------------|
| `KP_WS_SESSION_ID` | Session token (overrides stored token) |
| `KP_WS_BASE_URL` | Worker base URL (overrides stored URL) |

### kp-admin

`kp-admin` authenticates using an **admin bearer token** (`ADMIN_API_TOKEN`) configured on the server side. This is not the same as a user session token.

| Variable | Description |
|----------|-------------|
| `KP_ADMIN_TOKEN` | Admin bearer token (overrides stored token) |
| `KP_ADMIN_BASE_URL` | Admin panel base URL (overrides stored URL) |

## Output formats

Both CLIs support two output modes:

| Flag | Output |
|------|--------|
| (none) | Human-readable table format |
| `--json` | Raw JSON (useful for scripting with `jq`) |

## Getting help

```sh
kp-ws --help
kp-admin --help
```

Both CLIs print a full usage reference when invoked with `--help`, `-h`, `help`, or with no arguments.
