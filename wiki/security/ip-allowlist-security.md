---
title: "IP Allowlist Security"
slug: "ip-allowlist-security"
category: "Security"
tags: ["IP-allowlist", "CIDR", "network-security", "workspace", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - private-sync-worker/src/workspaces.ts
  - private-sync-worker/src/workspaceDb.ts
  - private-sync-worker/migrations/0011_workspace_full.sql
related:
  - "security-overview"
  - "threat-model"
  - "session-security"
---

# IP Allowlist Security

## What it is

The IP allowlist is a network-layer access control feature for workspaces. When enabled, the Cloudflare Worker rejects all workspace API requests from IP addresses not covered by the configured CIDR rules. It is an additional layer of defence-in-depth on top of session authentication.

## What it restricts

When `ip_allowlist_enabled = 1` for a workspace, every API request to that workspace is checked against the allowlist before any other authorization logic runs. Requests from non-allowlisted IPs receive a `403` response regardless of whether they carry a valid session token.

The check is performed in `workspaces.ts`:

```typescript
if (workspace.ip_allowlist_enabled) {
  // fetch allowlist rules from DB
  if (pol.ip.allowlistCidrs.length > 0) {
    const clientIp = request.headers.get('CF-Connecting-IP') ?? ''
    if (!pol.ip.allowlistCidrs.some(cidr => cidrContains(cidr, clientIp))) {
      return err('ip_not_allowed', 'Your IP address is not on the workspace allowlist', 403)
    }
  }
}
```

The client IP is read from the `CF-Connecting-IP` header set by Cloudflare's edge.

## What it does not restrict

The IP allowlist applies only to the Cloudflare Worker API. It does not apply to:
- R2 object storage (not publicly accessible — blobs are only accessible through the Worker API)
- D1 database (internal Cloudflare infrastructure, not a public endpoint)
- Cloudflare Workers KV (internal infrastructure)

Because R2 and D1 are not directly accessible from the public internet, the IP allowlist effectively covers all meaningful API access paths.

## CIDR notation support

Rules are stored as CIDR strings. Both IPv4 and IPv6 are supported:
- IPv4 example: `203.0.113.0/24`
- IPv6 example: `2001:db8::/32`
- Single host: `203.0.113.42/32`

The Worker validates CIDR syntax on insert:

```typescript
function isValidCidr(cidr: string): boolean {
  const m = cidr.match(/^([0-9a-fA-F:.]+)\/(\d+)$/)
  if (!cidr.includes(':')) {  // IPv4
    return bits >= 0 && bits <= 32
  }
  if (cidr.includes(':')) {  // IPv6
    return bits >= 0 && bits <= 128
  }
}
```

An invalid CIDR is rejected with `400 Invalid CIDR`.

## Managing allowlist rules

Rules are managed via the workspace security settings:

- `GET /workspaces/:id/ip-allowlist` — list current rules (requires `admin` or `owner` role)
- `POST /workspaces/:id/ip-allowlist` — add a rule: `{ "cidr": "203.0.113.0/24", "label": "Office network" }` (requires `admin` or `owner` role)
- `DELETE /workspaces/:id/ip-allowlist/:ruleId` — remove a rule (requires `admin` or `owner` role)
- `PATCH /workspaces/:id/settings` with `{ "ipAllowlistEnabled": true/false }` — enable/disable enforcement

## D1 schema

Rules are stored in `workspace_ip_allowlist` (added in migration 0012):

```sql
-- rule_id, workspace_id, cidr, label, created_by, created_at, deleted_at
```

The `ip_allowlist_enabled` flag on the workspace row controls whether the check runs. Setting the flag to `0` disables enforcement without deleting the rules.

## Security implications

**Protects against**: Requests from unexpected networks (e.g. a compromised credential used from outside the office network).

**Does not protect against**:
- Attackers connecting from an allowlisted IP (e.g. internal network attacker, VPN user)
- IP spoofing (Cloudflare's `CF-Connecting-IP` reflects the actual connecting IP after Cloudflare's DDoS mitigation; it is not trivially spoofable at the application layer)
- Content exposure — the IP allowlist gates API access, not the cryptographic keys. Content is encrypted regardless of whether the IP allowlist is enabled.

**Risk of misconfiguration**: If all IP rules are deleted while the allowlist is enabled, all workspace API access will be blocked. Always verify the allowlist rules before enabling enforcement, especially when managing remotely.

## Plan availability

IP allowlist is an enterprise-tier feature. The `ip_allowlist_enabled` column defaults to `0`; the workspace UI only exposes the management controls on qualifying plans.

## Permissions and roles

| Action | Required role |
|--------|--------------|
| View allowlist rules | admin, owner |
| Add / remove rules | admin, owner |
| Enable / disable allowlist | owner |

## Related articles

- [Security Architecture Overview](overview.md)
- [Threat Model](threat-model.md)
- [Session Security](session-security.md)
