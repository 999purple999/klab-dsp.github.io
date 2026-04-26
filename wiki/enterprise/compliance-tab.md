---
title: "Compliance Tab"
slug: "compliance-tab"
category: "Enterprise"
tags: ["compliance", "gdpr", "audit", "enterprise"]
audience: "admin"
plan: ["enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "private-sync-worker/src/company.ts"
related: ["enterprise/audit-log", "enterprise/gdpr-deletion", "enterprise/overview"]
---

# Compliance Tab

## What it is

The **Compliance** tab in the Company Admin Panel provides a centralised interface for enterprise compliance operations. It surfaces the tools that data protection officers, security auditors, and super-admins need to meet their legal obligations.

The Compliance tab is accessible at **Company admin** → **Compliance** (requires `auditor` role or above).

## When to use it

Use the Compliance tab when you need to:
- Respond to a GDPR data access request — generate a member data export.
- Respond to a GDPR right-to-erasure request — purge a member's PII.
- Review the company audit trail — view or download the hash-chained event log.
- Download a Business Associate Agreement (BAA) for HIPAA compliance (available on Enterprise — contact your account manager).
- Demonstrate compliance posture to an auditor.

## What it shows

### GDPR export

A button to download a full member data report as JSON. The report includes:
- User IDs, emails, display names, roles, status, join dates, and removal dates for all company members (including removed members).
- The report is generated at request time (not pre-cached).
- Requires `auditor` role or above.
- Endpoint: `GET /companies/{companyId}/compliance/gdpr-export`

See [GDPR data deletion](gdpr-deletion.md) for the full response format.

### Member purge

A form to enter a user ID and trigger a GDPR right-to-erasure purge. The purge:
- Immediately revokes all active sessions.
- Zeros the user's email (`purged-{userId[:8]}@deleted`) and display name (`Deleted User`).
- Removes the user from the company.
- Queues a background task for full account deletion including R2 storage cleanup.
- Requires `super-admin` role.
- Endpoint: `POST /companies/{companyId}/compliance/purge-member`

This operation is **irreversible**. See [GDPR data deletion](gdpr-deletion.md) for full details.

### Audit log viewer

An interface to browse and search the company audit log:
- Set a date range (`from` / `to`) to filter events.
- Displays event type, actor, sequence number, and timestamp.
- Maximum 500 events per query — paginate by adjusting the `to` date.
- An **Export** button downloads the current view as JSON.
- Requires `auditor` role or above.
- Endpoint: `GET /companies/{companyId}/audit?from=...&to=...`

Note: every time you load the audit log, a `COMPANY_AUDIT_VIEWED` event is recorded in the audit chain, including who viewed it and the query range.

See [Audit log](audit-log.md) for the event types and hash chain details.

### BAA information

The Compliance tab may display information about Business Associate Agreements (BAA) for HIPAA-covered entities. Contact support@kperception.com for BAA requests.

## Step by step

### Generating a GDPR data export

1. Open K-Perception → **Company admin** → **Compliance** tab.
2. Under **GDPR Export**, click **Download member data**.
3. A JSON file is downloaded to your device.
4. Store the file securely — it contains PII for all company members.

### Purging a member (right to erasure)

1. Open K-Perception → **Company admin** → **Compliance** tab.
2. Under **Member Purge**, enter the user's K-Perception user ID.
3. Confirm the operation by entering the user ID again in the confirmation field.
4. Click **Purge member**.
5. The user is immediately logged out and their PII is zeroed.

### Viewing the audit log

1. Open K-Perception → **Company admin** → **Compliance** tab.
2. Under **Audit Log**, set the **From** and **To** date range.
3. Click **Load events**.
4. Review the event list. Events are shown most-recent first.
5. To download, click **Export as JSON**.

## Platform differences

The Compliance tab is part of the Company Admin Panel, which is accessible on all platforms (Windows desktop, Android, web).

## Plan availability

The Compliance tab requires the **Enterprise** plan. All features within it are enterprise-only.

## Permissions and roles

| Feature | Required role |
|---|---|
| GDPR data export | `auditor` or above |
| Member purge | `super-admin` only |
| Audit log viewer | `auditor` or above |

Company roles: `super-admin | billing-admin | auditor | observer`.

## Security implications

- The GDPR export contains PII for all members. Treat it with the same care as any personal data export.
- Member purge is irreversible — always verify the user ID before confirming.
- The audit log is append-only. Events cannot be deleted. Reading the log itself is logged.

## Related articles

- [Audit log](audit-log.md)
- [GDPR data deletion](gdpr-deletion.md)
- [Enterprise overview](overview.md)

## Source references

- `private-sync-worker/src/company.ts` — `routeGdprExport`, `routePurgeMember`, `routeGetAudit`
