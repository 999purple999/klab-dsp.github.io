---
title: "Workspace calendar"
slug: "calendar"
category: "Workspaces"
tags: ["calendar", "events", "schedule", "workspace"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/calendarCrypto.ts"
  - "private-sync-worker/migrations/0021_calendar.sql"
related: ["workspaces/gantt", "workspaces/presence", "workspaces/overview"]
---

# Workspace calendar

## What it is

The workspace calendar is a shared team calendar where events are encrypted with an AES-256-GCM key derived from the workspace section key. Team members with calendar access can create, view, and manage events. Event titles and descriptions are encrypted — the server cannot read calendar content.

## When to use it

- Coordinate team meetings and deadlines in a shared encrypted calendar.
- Track project milestones alongside workspace documents.
- Plan recurring activities for a team that handles sensitive information.

## Step by step

### Desktop

1. Open the workspace → **Calendar** surface.
2. The calendar renders in month view by default.
3. To create an event: click a date cell → enter title, start/end time, description, attendees.
4. Click **Save**. The event is encrypted and stored.
5. Switch views: month / week / day using the toolbar buttons.

### Mobile (Android)

1. Open the workspace.
2. Tap **Calendar** in the bottom navigation.
3. The **MobileCalendarSurface** renders the calendar.
4. Tap a date to see events. Long-press to create a new event.

![Workspace calendar in month view](../assets/calendar-1.png)

## Event structure

Each calendar event stores (all encrypted):

| Field | Description |
|---|---|
| title | Event title |
| start_at | ISO8601 datetime |
| end_at | ISO8601 datetime |
| description | Event notes / agenda |
| attendees | List of workspace member user_ids |
| recurrence | Recurrence rule (RFC 5545 RRULE subset) — stored as cleartext `rrule` column in D1 |
| location | Location string — encrypted as `location_enc` in D1 |

## Encryption

Calendar events are encrypted using `src/shared/calendarCrypto.ts`. The encryption key is derived from the workspace section key (SK_section) for the calendar section. The AES-256-GCM pattern follows the standard workspace key hierarchy.

## Behaviour and edge cases

- **Attendee notifications:** When you add a member as an attendee, they receive a notification. The notification content (event title) is decrypted on-device before display.
- **iCal export:** Export to `.ics` format is not currently implemented [NEEDS-IMPL-DECISION].
- **Timezone handling:** All events are stored in UTC. The calendar renders in your local timezone.
- **Recurring events:** The `rrule` column exists in the D1 schema (RFC 5545 RRULE subset). Full UI support for creating and editing recurring events is not confirmed for the current release. Contact support for confirmation.
- **Event deletion:** Deleting an event tombstones the D1 row and schedules the R2 blob for deletion.
- **View modes:** Month, week, day views available. List/agenda view is not confirmed in the current release. Contact support for confirmation.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| UI component | CalendarSurface | MobileCalendarSurface | CalendarSurface |
| View modes | Month, week, day | Month, day | Month, week, day |
| Event creation | Click date cell | Long-press date | Click date cell |
| Attendee picker | Yes | Yes | Yes |

## Plan availability

Workspace calendar requires Team or Enterprise plan.

## Permissions and roles

| Role | Can view | Can create | Can delete others' events |
|---|---|---|---|
| editor | Yes | Yes | No |
| Admin | Yes | Yes | Yes |

## Security implications

Event content (title, description, attendees) is encrypted with the calendar section key. The server stores only ciphertext. An attacker who compromises D1 sees encrypted event blobs and their timestamps (reveals when events are scheduled, not what they are).

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Default view | Month | Not user-configurable |
| Timezone | Device local timezone | System timezone |
| Notifications for events | Enabled | Account settings → Notifications |

## Related articles

- [Gantt chart](gantt.md)
- [Workspace presence](presence.md)
- [Workspace overview](overview.md)

## Source references

- `src/shared/calendarCrypto.ts` — calendar encryption
- `private-sync-worker/migrations/0021_calendar.sql` — calendar schema
