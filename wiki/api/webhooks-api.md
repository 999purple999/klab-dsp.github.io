---
title: "Webhooks API Reference"
slug: "api-webhooks"
category: "API"
tags: ["api", "webhooks", "events", "hmac", "signatures"]
audience: "developer"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
  - "private-sync-worker/src/workspaces.ts"
related: ["api-overview", "api-authentication", "api-errors"]
---

# Webhooks API Reference

K-Perception can deliver HTTP POST notifications to a URL of your choice when events occur in a workspace. Each delivery is signed with HMAC-SHA256 so you can verify it originated from K-Perception.

**Plan requirement:** Team or Enterprise workspaces. The authenticated user must have `admin` role or above to manage webhooks.

## Creating a webhook

Webhooks are created through the workspace Admin console under **Settings > Integrations > Webhooks**. The `secret` is shown once at creation time — store it securely. It is used to verify the `X-Kp-Signature` header on incoming deliveries.

When creating a webhook you specify:
- A target `url` (must be `https://`)
- A list of `events` to subscribe to

---

## Delivery headers

Every webhook POST request includes these headers:

| Header | Description |
|--------|-------------|
| `X-Kp-Event` | The event type string, e.g. `member_joined` |
| `X-Kp-Delivery` | A unique UUID for this delivery attempt |
| `X-Kp-Timestamp` | Unix timestamp (seconds) when the delivery was initiated |
| `X-Kp-Signature` | `sha256=<HMAC-SHA256 hex>` of the request body |
| `Content-Type` | `application/json` |

---

## Signature verification

The `X-Kp-Signature` header contains an HMAC-SHA256 digest of the raw request body, formatted as:

```
sha256=<hex-encoded-digest>
```

**Verification steps:**

1. Extract the raw request body bytes (before any JSON parsing).
2. Compute `HMAC-SHA256(secret, body)` using the webhook secret you stored at creation time.
3. Compare the hex result to the value in `X-Kp-Signature` after the `sha256=` prefix.
4. Also check `X-Kp-Timestamp` is within an acceptable clock skew window (recommended: reject deliveries older than 5 minutes).

**Example (Node.js):**
```js
const crypto = require('crypto')

function verifyWebhook(secret, body, signatureHeader, timestampHeader) {
  const maxAgeSeconds = 300
  const ts = parseInt(timestampHeader, 10)
  if (Math.abs(Date.now() / 1000 - ts) > maxAgeSeconds) {
    throw new Error('Timestamp too old')
  }
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
}
```

---

## Payload format

All webhook payloads share a common outer envelope:

```json
{
  "event": "event.type",
  "workspaceId": "string",
  "emittedAt": "2026-01-15T12:00:00.000Z",
  "payload": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | The event type (same as `X-Kp-Event`) |
| `workspaceId` | string | The workspace that emitted the event |
| `emittedAt` | ISO 8601 datetime | When the event was emitted server-side |
| `payload` | object | Event-specific data |

The `payload` field shape varies per event type. Webhook subscriptions match on the `event_type` column in the `workspace_webhook_subscriptions` table. The outer envelope (`event`, `workspaceId`, `emittedAt`) is always present; the `payload` contents are event-specific. Detailed payload schemas for each event are not currently documented — contact support or refer to `private-sync-worker/src/workspaceEnterprise.ts` `dispatchWebhooks` call sites.

---

## Event types

The event type strings are free-form: you subscribe to any string, and deliveries are sent when a matching audit event is recorded. The following strings are confirmed in `private-sync-worker/src/workspaces.ts` as the actual `eventType` values emitted by server-side operations:

| Event type string | Description |
|-------------------|-------------|
| `workspace_created` | A workspace was created |
| `workspace_updated` | Workspace settings were updated |
| `workspace_deleted` | Workspace was soft-deleted |
| `member_joined` | A user joined the workspace |
| `member_role_changed` | A member's role was changed |
| `member_revoked` | A member was removed |
| `member_remote_wiped` | A member's device was remote-wiped |
| `team_created` | A team was created |
| `team_deleted` | A team was deleted |
| `section_created` | A section was created |
| `section_updated` | A section was updated |
| `section_deleted` | A section was deleted |
| `section_acl_changed` | Section ACL was modified |
| `key_rotation_started` | Key rotation was initiated |
| `key_rotation_completed` | Key rotation completed |
| `guest_invited` | A guest was invited |
| `invite_created` | An invite was created |
| `invite_revoked` | An invite was revoked |
| `invite_accepted` | An invite was accepted |
| `guest_revoked` | A guest's access was revoked |
| `session_terminated` | A session was forcibly terminated |
| `api_key_created` | An API key was created |
| `api_key_revoked` | An API key was revoked |
| `webhook_created` | A webhook was created |

Note that the client can also push custom `eventType` strings via the audit endpoint — subscriptions using those strings will also fire if any source emits them. The server does not enforce a closed set of valid event types.

---

## Retry schedule

If the target URL does not respond with an HTTP 2xx status code within the request timeout, the delivery is retried using exponential backoff:

| Retry | Delay before retry |
|-------|-------------------|
| 1st retry | 4 seconds |
| 2nd retry | 16 seconds |
| 3rd retry | 64 seconds |
| 4th retry (final) | 256 seconds |

The formula is `min(3600, 4^attempt)` seconds. After 5 total delivery attempts (the initial attempt plus 4 retries), the delivery is marked `giving-up` and no further retries are made. Confirmed in `attemptWebhookDelivery` in `workspaceEnterprise.ts`: `if (attempt >= 5) { // give up }`.

The `consecutive_failures` counter on the webhook is incremented each time a delivery reaches `giving-up` state.

---

## Dead letter queue

Failed deliveries (status `giving-up`) are logged to the dead letter log table. Operators can inspect this log to identify and replay failed events. Rows are pruned after 30 days.

---

## Delivery idempotency

Each delivery is identified by the `X-Kp-Delivery` UUID. If your endpoint receives the same `X-Kp-Delivery` value more than once (possible during retry), process it idempotently — the retry carries the same payload and signature as the original attempt.
