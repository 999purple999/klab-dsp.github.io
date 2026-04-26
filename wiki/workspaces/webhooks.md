---
title: "Webhooks"
slug: "webhooks"
category: "Workspaces"
tags: ["webhooks", "integrations", "events", "automation"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaces.ts"
  - "private-sync-worker/migrations/0037_dead_letter_log.sql"
related: ["workspaces/api-keys", "workspaces/admin-console", "api/overview"]
---

# Webhooks

## What it is

Webhooks deliver real-time notifications of workspace events to an external HTTP endpoint you control. When a defined event occurs (e.g. a file is uploaded, a member joins), the Worker sends a POST request to your endpoint with a signed JSON payload.

## When to use it

- Trigger a CI/CD pipeline when a new file version is uploaded.
- Post workspace notifications to a Slack or Teams channel via a middleware.
- Log workspace activity to your own audit system.
- Automate team workflows based on workspace events.

## Step by step

### Adding a webhook endpoint

1. Admin console → **Integrations** tab → **Webhooks** → **Add endpoint**.
2. Enter the endpoint URL (must be HTTPS).
3. Enter a secret (used for HMAC-SHA256 signing). Store this secret securely.
4. Select which event types to subscribe to (or subscribe to all events).
5. Click **Save**.
6. The Worker sends a `ping` event to verify the endpoint is reachable.

### Verifying webhook signatures

Each webhook POST includes two headers:

```
X-Kp-Signature: sha256=<hex_digest>
X-Kp-Timestamp: <unix_seconds>
```

Compute the expected signature on your end:

```
HMAC-SHA256(secret, request_body_bytes) → hex
```

Compare with the `sha256=...` value in `X-Kp-Signature`. If they match, the request is authentic. Use `X-Kp-Timestamp` to reject replayed requests older than your tolerance window (e.g. 5 minutes).

## Event catalogue

| Event | Description |
|---|---|
| `workspace.member.joined` | A new member accepted an invitation |
| `workspace.member.left` | A member was removed or left |
| `workspace.member.role_changed` | A member's role was changed |
| `file.uploaded` | A new file or file version was uploaded |
| `file.deleted` | A file was deleted |
| `channel.message.sent` | A message was sent in a channel |
| `backup.completed` | A workspace backup completed successfully |
| `backup.failed` | A workspace backup failed |
| `key.rotated` | The workspace key was rotated |
| `dangerous_op.executed` | A dangerous operation was executed |
| `workspace.deleted` | The workspace was deleted |
| `workspace.ownership.transferred` | Ownership was transferred |
| `ping` | Sent when a new endpoint is configured (verification) |

## Payload format

```json
{
  "event": "file.uploaded",
  "workspace_id": "ws_abc123",
  "timestamp": "2026-04-26T12:00:00Z",
  "actor_user_id": "user_xyz",
  "data": {
    "file_id": "file_def456",
    "file_name_encrypted": true,
    "size_bytes": 204800,
    "version_number": 3
  }
}
```

Note: `file_name_encrypted: true` means the file name is not included in the webhook payload (it is encrypted and the server cannot read it).

## Delivery and retry

- The Worker attempts delivery with a 10-second timeout.
- On non-2xx response or timeout: retry with exponential backoff — attempt 1: 4s, attempt 2: 16s, attempt 3: 64s, attempt 4: 256s, attempt 5: capped at 1 hour. Formula: `4^attempt` seconds.
- After 5 failed attempts: the event is written to the dead letter log (`private-sync-worker/migrations/0037_dead_letter_log.sql`).
- The last 100 delivery attempts are visible in Admin console → Integrations → Webhooks → Delivery log.
- Dead-lettered events are retained for 7 days for manual inspection.

## Behaviour and edge cases

- **HTTPS required:** HTTP endpoints are rejected.
- **Endpoint down:** Events are queued and retried. Very long outages may cause events to be dead-lettered.
- **Order guarantee:** Not confirmed in current source — contact support for confirmation. The dispatch logic sends events concurrently per-webhook; no ordering guarantee was found in the source.
- **Encrypted fields:** Fields that contain user content (file names, message bodies) are NOT included in webhook payloads because the server cannot read them. Only metadata (file IDs, sizes, user IDs, timestamps) is included.

## Platform differences

Webhook management is in the admin console — available on all platforms.

## Plan availability

Webhooks require Team or Enterprise.

## Permissions and roles

Only workspace Admins and the Owner can manage webhooks.

## Security implications

The HMAC-SHA256 signature prevents spoofing — only the Worker (which knows the secret) can produce the correct signature. Store your webhook secret securely and rotate it if it is ever exposed. The dead letter log contains event metadata (IDs, timestamps) but not encrypted content.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Endpoint URL | Required | Admin console → Integrations → Webhooks |
| Secret | Required | Admin console → Integrations → Webhooks |
| Subscribed events | All events | Admin console → Integrations → Webhooks |
| Delivery timeout | 10 seconds | Not user-configurable |
| Retry attempts | 3 | Not user-configurable |

## Related articles

- [API keys](api-keys.md)
- [Admin console](admin-console.md)
- [API overview](../api/overview.md)

## Source references

- `private-sync-worker/src/workspaces.ts` — webhook dispatch logic
- `private-sync-worker/migrations/0037_dead_letter_log.sql` — dead letter schema
