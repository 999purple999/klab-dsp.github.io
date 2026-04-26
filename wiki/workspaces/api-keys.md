---
title: "Workspace API keys"
slug: "api-keys"
category: "Workspaces"
tags: ["api", "api-keys", "automation", "developer"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/migrations/0011_workspace_full.sql"
related: ["workspaces/webhooks", "workspaces/admin-console", "cli/kp-ws"]
---

# Workspace API keys

## What it is

Workspace API keys are long-lived programmatic access tokens for the K-Perception workspace API. Unlike session tokens (which are short-lived and tied to a user login), API keys are durable and scoped — they can read or write only the capabilities you specify.

API keys are the credential used by the `kp-ws` CLI and custom integrations.

## When to use it

- Automate file uploads in a CI/CD pipeline.
- Read workspace member lists from an internal directory tool.
- Send channel messages from a monitoring service.
- Run the `kp-ws` CLI in a headless environment.

## Step by step

### Creating an API key

1. Admin console → **Security** tab → **API Keys** → **Create API key**.
2. Enter a descriptive name (e.g. "CI upload pipeline").
3. Select scopes (see below).
4. Click **Create**.
5. The full key secret is shown **once** — copy it immediately and store it in your secrets manager. It cannot be retrieved again.

### Using an API key

Include the key in the `Authorization` header:

```
Authorization: Bearer kp_ws_{secret}
```

### Revoking an API key

1. Admin console → **Security** → **API Keys** → click the key → **Revoke**.
2. Revocation is immediate. Any in-flight request with the revoked key returns HTTP 401.

## Scopes

| Scope | Description |
|---|---|
| `read:files` | Download files from the workspace |
| `write:files` | Upload files to the workspace |
| `read:members` | List workspace members |
| `manage:members` | Invite and remove members |
| `read:channels` | Read channel messages |
| `write:channels` | Send channel messages |
| `read:audit` | Access workspace audit log |

## Key format

API keys have the format: `kp_ws_{random_hex_64chars}`.

## Behaviour and edge cases

- **Secret visibility:** The secret is shown only once at creation. Store it immediately. If lost, you must create a new key.
- **No expiry by default:** API keys do not expire unless you set an expiry date at creation or revoke them manually.
- **Rate limits:** API keys are subject to the same rate limits as session-based requests [NEEDS-VERIFY — exact limits].
- **Key listing:** The admin console shows key name, created date, last used date, and scopes. It never shows the secret again.
- **Plan requirement:** API keys require Team or Enterprise plan.
- **Workspace scope:** API keys are scoped to a single workspace. There are no cross-workspace API keys.

## Platform differences

API key management is in the admin console. The generated key is usable from any HTTP client on any platform.

## Plan availability

API keys require Team or Enterprise.

## Permissions and roles

Only workspace Admins and the Owner can create and manage API keys.

## Security implications

API keys are long-lived credentials. Rotate them regularly (quarterly at minimum). If an API key is compromised, revoke it immediately and audit the activity log for suspicious usage.

API keys do NOT have access to plaintext content — they interact with encrypted blobs. A leaked API key allows an attacker to download encrypted blobs (unreadable without the WDK) and upload new encrypted blobs.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Key name | Required | Admin console → Security → API Keys |
| Scopes | None selected | Admin console → Security → API Keys |
| Expiry | None | Admin console → Security → API Keys |

## Related articles

- [Webhooks](webhooks.md)
- [Admin console](admin-console.md)
- [kp-ws CLI](../cli/kp-ws.md)

## Source references

- `private-sync-worker/src/workspaces.ts` — API key authentication + scope enforcement
- `private-sync-worker/migrations/0011_workspace_full.sql` — workspace API key schema
