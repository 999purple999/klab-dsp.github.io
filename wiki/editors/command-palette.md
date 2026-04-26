---
title: "Command palette"
slug: "command-palette"
category: "Editors"
tags: ["command-palette", "search", "navigation", "keyboard"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/"
  - "src/shared/types.ts"
related: ["keyboard-shortcuts", "slash-commands", "search", "overview"]
---

# Command palette

## What it is

The command palette is a fuzzy-search overlay that gives you instant keyboard-driven access to every note, editor command, workspace, and application setting in K-Perception. On desktop it opens with `Cmd+K` (macOS) or `Ctrl+K` (Windows). On Android it is triggered by the magnifier icon in the header bar. It is available in every editor mode and on every screen of the application.

## When to use it

Use the command palette whenever you want to navigate without reaching for the mouse:

- Jump to a note by typing the first few letters of its title.
- Switch the current note's editor mode (plain → markdown → docs).
- Create a new note in a specific folder without leaving the keyboard.
- Open account settings, workspace admin, or a specific workspace section.
- Run an editor action (insert table, toggle zen mode, export note) that you cannot remember the shortcut for.

## Step by step

1. Press `Ctrl+K` (Windows) or `Cmd+K` (macOS) from anywhere in the application. On Android, tap the magnifier/search icon in the note-list header.
2. The overlay appears centred on screen with a text input pre-focused.
3. Start typing. Results update in real time as you type:
   - Note titles that fuzzy-match your query appear in the **Notes** group.
   - Application commands that match appear in the **Commands** group.
   - Recent items appear first when the input is empty.
4. Use **↑ / ↓** arrow keys (or swipe on Android) to move between results.
5. Press **Enter** (or tap) to execute the highlighted result.
6. Press **Escape** to dismiss without taking any action.

![Opening the command palette](../assets/command-palette-1.png)

## Behaviour and edge cases

- **Empty state:** When you open the palette with no query, recent notes and recently used commands are shown.
- **Fuzzy matching:** Characters do not need to be consecutive. Typing `mkd` matches "**M**ar**k**down **d**ocs". Match quality is scored so the best matches appear first.
- **Note pinning from palette:** Highlighting a note result and pressing the pin keyboard shortcut (`Ctrl+P` / `Cmd+P`) pins it without opening it.
- **No results:** If nothing matches, the palette shows "No results for '…'" and offers a quick-create action to create a new note with the typed string as its title.
- **Command mode:** If you type `/` as the first character, the palette switches to command-only mode — note results are suppressed, and only editor/application commands are shown.
- **Workspace context:** If you are inside a workspace, workspace channels and workspace members are also included in results.
- **Network not required:** The palette searches the local encrypted index — no network call is made.
- **Vault locked:** The palette is unavailable when the vault is locked (the overlay simply does not open).

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Trigger | `Ctrl+K` | Magnifier icon tap | `Ctrl+K` |
| Result categories | Notes, Commands, Workspaces, Settings | Notes, Commands | Notes, Commands, Settings |
| Keyboard navigation | Arrow keys + Enter | Scroll + tap | Arrow keys + Enter |
| Pin note shortcut | `Ctrl+P` in palette | Long-press result | `Ctrl+P` in palette |

## Plan availability

The command palette is available on all plans including the free Local plan.

## Permissions and roles

The palette searches only content you have access to. If you are a workspace Guest with access only to specific sections, only those sections' documents appear in results.

## Security implications

The command palette searches the local decrypted index on your device. No query is ever sent to the server. If you type a sensitive term and the vault is unlocked, the search is performed entirely in-process — no network traffic is generated.

## Settings reference

There is no dedicated settings panel for the command palette. Keyboard shortcut customisation is not yet supported (the shortcut is fixed to `Ctrl+K` / `Cmd+K`).

## Related articles

- [Keyboard shortcuts](keyboard-shortcuts.md)
- [Slash commands](slash-commands.md)
- [Search](../organization/search.md)

## Source references

- `src/renderer/src/components/` — CommandPalette component
- `src/shared/types.ts` — NoteMode enum used for mode-switch commands
