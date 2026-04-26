---
title: "IP allowlist"
slug: "enterprise/ip-allowlist"
category: "Enterprise"
tags: ["enterprise", "security", "ip-allowlist", "network", "access-control"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/workspaceEnterprise.ts"
  - "private-sync-worker/src/company.ts"
related:
  - "enterprise/overview"
  - "enterprise/mfa-enforcement"
  - "enterprise/audit-log"
  - "enterprise/company-shell"
---

## What it is

The IP allowlist enforces source-IP-based access control at the Cloudflare Worker edge. Requests arriving from IP addresses that do not match any configured CIDR entry are rejected before they reach authentication or data logic, returning a `403` with error code `IP_BLOCKED`. The check is performed on every authenticated API request — including sync, file upload, SCIM, and admin operations.

Two levels of IP allowlist exist:

- **Company-level allowlist** — applies to all workspaces linked to the company. Configured in **Company Admin → Security → IP Allowlist**.
- **Workspace-level allowlist** — applies to a single workspace only. Configured in **Workspace Admin → Security → IP Allowlist**.

The evaluation order is: company-level first, then workspace-level. A request must pass both checks to be accepted.

## When to use it

Use the IP allowlist when:

- Your organisation requires that K-Perception can only be accessed from your corporate network (on-premises or VPN).
- Regulatory requirements (SOC 2, ISO 27001, internal security policy) mandate network-level access controls.
- You have experienced credential theft and want to prevent access from attacker-controlled IP ranges.
- You operate in a jurisdiction where access from specific countries or ranges must be blocked.

## Step by step

### Adding a CIDR (company-level)

1. Navigate to **Company Admin → Security → IP Allowlist**.
2. Click **Add CIDR**.
3. Enter the CIDR range (e.g. `203.0.113.0/24` for IPv4 or `2001:db8::/32` for IPv6).
4. Optionally add a description (e.g. "London office" or "AWS NAT gateway").
5. Click **Save**. The entry takes effect on the next request from that IP.

### Adding a CIDR (workspace-level)

1. Navigate to **Workspace Admin → Security → IP Allowlist** (requires workspace `admin` or `owner` role).
2. Follow the same steps as above. Workspace-level entries are additive to any company-level restrictions.

### Removing a CIDR

1. Locate the CIDR entry in the list.
2. Click **Remove** (or the delete icon).
3. Confirm the removal. The change takes effect immediately; requests from that CIDR will be blocked (if no other matching entry covers them) on the next request.

**Warning:** Removing the only entry covering your current IP address will lock you out of the app. Always ensure you have at least one entry covering your current source IP before removing others, or use a second admin account from a different network to make the change.

### Adding a CIDR via API

The `routeAddIp` capability is exposed at:

```
POST /companies/:companyId/ip-allowlist
Authorization: Bearer <session_token>

{ "cidr": "203.0.113.0/24", "description": "London office" }
```

This route is **capability-gated**: the calling user must hold `super-admin` company role. Workspace-level IP management is at:

```
POST /workspaces/:wsId/ip-allowlist
```

Requires workspace `admin` role.

## Behaviour and edge cases

### What happens on violation

When a request arrives from a blocked IP:

1. The Cloudflare Worker evaluates the source IP (`CF-Connecting-IP` header) against the CIDR table.
2. If no CIDR matches, the Worker returns:
   ```json
   { "ok": false, "error": { "code": "IP_BLOCKED", "message": "Access denied from this IP address." } }
   ```
   HTTP status `403`.
3. An `ip.blocked` audit event is emitted with `actor_ip`, `company_id` (or `workspace_id`), and timestamp.
4. The request is not processed further — authentication is not attempted.

### Empty allowlist (no entries configured)

If no CIDR entries are configured, the allowlist is effectively disabled and all source IPs are allowed. This is the default state. The allowlist only becomes active after the first CIDR entry is added.

### IPv4 and IPv6

Both IPv4 (CIDR notation, e.g. `203.0.113.0/24`) and IPv6 (e.g. `2001:db8::/32`) are supported. IPv4-mapped IPv6 addresses (`::ffff:x.x.x.x`) are normalised to their IPv4 form before matching.

### CIDR notation

Standard CIDR notation is required. Single-host entries use `/32` (IPv4) or `/128` (IPv6). The server validates CIDR syntax on input and returns `400 invalid_cidr` for malformed entries.

**Maximum CIDR entries per company:** The database schema and Worker source do not enforce a hard limit on the number of CIDR entries. Practical guidance: keep the list under 100 entries for performance predictability. Contact your account manager if you need to allowlist a very large number of ranges.

### Exemptions

Internal Worker-to-Worker calls (Durable Object communication, background CRON jobs, TASK_QUEUE consumers) bypass the IP allowlist check because they originate from Cloudflare's internal infrastructure and do not carry a `CF-Connecting-IP` header. These paths are not client-accessible.

Cloudflare IPs listed in Cloudflare's published IP ranges are not automatically exempt — the allowlist applies equally to all external source IPs including those coming through other Cloudflare products (e.g. Cloudflare Access, Cloudflare Tunnel). If you use Cloudflare Tunnel to proxy corporate traffic, add your tunnel's egress IP range.

### Dry-run mode

A dry-run mode (log violations without blocking) is not implemented in the current release. To safely roll out an allowlist, add all required CIDRs before enabling the allowlist, or use the audit log `ip.blocked` events to identify misses in a monitoring period before removing access from unlisted IPs.

## Platform differences

The IP check is enforced uniformly at the Cloudflare Worker edge, regardless of client platform (desktop Windows, Android, web). The check applies to all API calls including:

- Note sync
- File upload/download
- SCIM provisioning calls from external IdP
- Webhook delivery (server-to-server; uses internal paths, exempt as noted above)

Mobile users connecting via cellular networks may use dynamic IP addresses. If you enforce an IP allowlist, ensure your VPN or split-tunnel configuration routes K-Perception traffic through the allowlisted range, or use a broader corporate CIDR.

## Plan availability

IP allowlist is available on the **Enterprise plan** only — at both the company level and the workspace level. The Worker enforces this via `planAllowsIpAcl = plan === 'enterprise'` in `workspaceCapabilities`. Team-plan workspaces cannot use the workspace-level IP allowlist.

## Permissions and roles

| Action | Minimum role |
|---|---|
| View company IP allowlist | `super-admin` |
| Add/remove company CIDR | `super-admin` |
| View workspace IP allowlist | Workspace `admin` |
| Add/remove workspace CIDR | Workspace `admin` |

## Security implications

- The IP allowlist is a network-layer control. It does not substitute for authentication, MFA, or encryption. A compromised device inside the allowlisted network range can still be used to attack the account.
- The `CF-Connecting-IP` header is set by Cloudflare and cannot be spoofed by clients. Standard HTTP `X-Forwarded-For` is not used for this check.
- Combined with TOTP MFA enforcement, the IP allowlist provides two independent barriers: a network perimeter and a possession factor.
- Audit events for `ip.blocked` are recorded even when the request is blocked, providing a record of access attempts from outside the allowlist.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| CIDR entries | Company Admin → Security → IP Allowlist | List of allowed source CIDRs |
| Description | Per CIDR entry | Human-readable label (office name, etc.) |
| Workspace CIDR entries | Workspace Admin → Security → IP Allowlist | Additional per-workspace restrictions |

## Related articles

- [Enterprise overview](enterprise/overview.md)
- [MFA enforcement](enterprise/mfa-enforcement.md)
- [Elevation tokens](enterprise/elevation-tokens.md)
- [Audit log](enterprise/audit-log.md)
- [Company shell](enterprise/company-shell.md)

## Source references

- `private-sync-worker/src/workspaceEnterprise.ts` — IP allowlist route handlers
- `private-sync-worker/src/company.ts` — company-level IP gate, `ip.blocked` audit event emission
