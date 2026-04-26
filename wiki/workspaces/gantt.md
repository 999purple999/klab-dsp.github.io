---
title: "Workspace Gantt chart"
slug: "gantt"
category: "Workspaces"
tags: ["gantt", "project", "timeline", "tasks"]
audience: "user"
plan: ["team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/ganttCrypto.ts"
  - "private-sync-worker/migrations/0022_gantt.sql"
related: ["workspaces/calendar", "workspaces/overview"]
---

# Workspace Gantt chart

## What it is

The workspace Gantt chart is a project timeline view where tasks are plotted on a horizontal timeline. Tasks, their durations, assignees, and dependencies are all encrypted with a key derived from the workspace section key.

## When to use it

- Plan a project with multiple phases and task dependencies.
- Assign tasks to team members and track their completion.
- Visualise the critical path of a project (dependency edges are stored in D1; visual CPM highlighting is not confirmed in the current release — contact support for confirmation).

## Step by step

1. Open the workspace → **Gantt** surface.
2. The timeline renders with tasks as horizontal bars on a date axis.
3. To add a task: click **+ Task** → enter title, start date, end date, assignee, status.
4. To add a dependency: drag from the end of one task bar to the start of another.
5. Task bars can be dragged to reschedule (drag the bar) or resized (drag the right edge).

## Task structure (encrypted)

| Field | Description |
|---|---|
| title | Task name |
| start_date | ISO8601 date |
| end_date | ISO8601 date |
| assignee_user_id | Assigned workspace member |
| status | pending / in_progress / done / blocked |
| dependencies | List of task_ids this task depends on |
| description | Notes on the task |

## Encryption

Gantt data is encrypted using `src/shared/ganttCrypto.ts` with a key derived from the workspace section key (SK_section). The AES-256-GCM pattern follows the standard workspace key hierarchy.

## Behaviour and edge cases

- **Critical path:** Visual CPM critical path highlighting is not confirmed in the current release. Contact support for confirmation.
- **Export:** Export to PNG or PDF is not confirmed in the current release. Contact support for confirmation.
- **Mobile view:** A simplified list view of tasks on mobile is not confirmed in the current release. Contact support for confirmation.
- **Task deletion:** Tombstone in D1, R2 blob deletion scheduled.
- **Zoom levels:** Day / week / month timeline zoom is not confirmed in the current release. Contact support for confirmation.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Full timeline view | Yes | Simplified list | Yes |
| Drag to reschedule | Yes | No | Yes |
| Dependency arrows | Yes | No | Yes |

## Plan availability

Gantt chart requires Team or Enterprise plan.

## Permissions and roles

Members can view and create tasks. Admins can delete any task.

## Security implications

Task content (titles, descriptions, assignees) encrypted with section key. Server sees only ciphertext.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Default zoom | Week | Toolbar |

## Related articles

- [Calendar](calendar.md)
- [Workspace overview](overview.md)

## Source references

- `src/shared/ganttCrypto.ts` — Gantt encryption
- `private-sync-worker/migrations/0022_gantt.sql` — Gantt schema
