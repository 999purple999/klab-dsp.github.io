---
title: "Keyboard shortcuts"
slug: "keyboard-shortcuts"
category: "Editors"
tags: ["keyboard", "shortcuts", "hotkeys", "accessibility"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/"
related: ["command-palette", "slash-commands", "markdown", "docs"]
---

# Keyboard shortcuts

## What it is

K-Perception defines a consistent set of keyboard shortcuts across all editor modes and application screens. This article is the single authoritative reference for every shortcut. Shortcuts are listed by scope: global, then per editor mode.

On macOS, `Cmd` replaces `Ctrl` throughout. On Android physical keyboards are supported but no default mobile shortcuts are defined — the on-screen UI is the primary interaction model.

## When to use it

Learn these shortcuts to:

- Navigate between notes without the mouse.
- Apply formatting faster in Docs and Editorial.
- Control the Markdown preview and split-pane.
- Manage the Sheets grid efficiently.
- Undo/redo across all editors.

## Step by step

Open the built-in shortcut overlay at any time by pressing `Ctrl+/` (Windows) or `Cmd+/` (macOS). The overlay shows all shortcuts relevant to the currently active editor mode.

## Global shortcuts

| Shortcut (Windows) | Shortcut (macOS) | Action |
|---|---|---|
| `Ctrl+K` | `Cmd+K` | Open command palette |
| `Ctrl+N` | `Cmd+N` | New note |
| `Ctrl+S` | `Cmd+S` | Save / force sync |
| `Ctrl+Z` | `Cmd+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | `Cmd+Shift+Z` | Redo |
| `Ctrl+F` | `Cmd+F` | Find (in-document search) |
| `Ctrl+H` | `Cmd+H` | Find and replace |
| `Ctrl+/` | `Cmd+/` | Show shortcut reference overlay |
| `Ctrl+,` | `Cmd+,` | Open settings |
| `Ctrl+W` | `Cmd+W` | Close current note / tab |
| `F11` | `Ctrl+Cmd+F` | Toggle fullscreen (Electron) |
| `Ctrl+Shift+Z` | `Cmd+Shift+Z` | Zen mode toggle |

## Plain text and Markdown shortcuts

| Shortcut (Windows) | Action |
|---|---|
| `Ctrl+B` | Bold (Markdown: wraps selection in `**`) |
| `Ctrl+I` | Italic (wraps in `_`) |
| `Tab` | Indent list item / insert 2-space indent |
| `Shift+Tab` | Dedent list item |
| `Enter` | Smart Enter: continues list, auto-pairs fences |
| `Ctrl+Shift+P` | Toggle split-pane preview |
| `Ctrl+Shift+V` | Toggle full preview mode |
| `Ctrl+E` | Toggle reading-time / stats bar |

## Docs editor shortcuts

| Shortcut (Windows) | Action |
|---|---|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Shift+S` | Strikethrough |
| `Ctrl+Shift+H` | Highlight |
| `Ctrl+K` | Insert / edit link (when text is selected; overrides palette) |
| `Ctrl+Alt+1` through `6` | Heading levels 1–6 |
| `Ctrl+Shift+7` | Ordered list |
| `Ctrl+Shift+8` | Bullet list |
| `Ctrl+Shift+9` | Task list |
| `Ctrl+Alt+C` | Code block |
| `Ctrl+Shift+B` | Blockquote |
| `Tab` (in table cell) | Move to next cell |
| `Shift+Tab` (in table cell) | Move to previous cell |
| `Enter` (in last table cell) | Insert new table row |
| `Ctrl+Shift+X` | Subscript |
| `Ctrl+Shift+P` | Superscript |

## Sheets editor shortcuts

| Shortcut (Windows) | Action |
|---|---|
| `Tab` | Move to next cell (right) |
| `Shift+Tab` | Move to previous cell |
| `Enter` | Confirm cell input, move down |
| `Shift+Enter` | Confirm cell input, move up |
| `Ctrl+Enter` | Insert line break inside cell |
| `Arrow keys` | Navigate cells |
| `Ctrl+Home` | Go to cell A1 |
| `Ctrl+End` | Go to last used cell |
| `F2` | Enter edit mode on selected cell |
| `Escape` | Cancel edit, restore original value |
| `Delete` | Clear cell content |
| `Ctrl+C` | Copy selection |
| `Ctrl+V` | Paste (CSV parsing for multi-cell) |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+Shift+Plus` | Insert row above |
| `Ctrl+Minus` | Delete selected row |

## Canvas editor shortcuts

| Shortcut (Windows) | Action |
|---|---|
| `V` | Select / move tool |
| `P` | Pen/brush tool |
| `E` | Eraser tool |
| `R` | Rectangle shape |
| `C` | Circle/ellipse shape |
| `L` | Line tool |
| `T` | Text annotation |
| `Ctrl+Z` | Undo stroke |
| `Ctrl+Y` | Redo |
| `Space + drag` | Pan canvas |
| `Ctrl+scroll` | Zoom in/out |
| `Ctrl+0` | Reset zoom to 100% |
| `Ctrl+Shift+E` | Export canvas as PNG |

## Editorial editor shortcuts

All Docs shortcuts apply, plus:

| Shortcut (Windows) | Action |
|---|---|
| `Ctrl+Shift+C` | Insert citation (opens citation picker) |
| `Ctrl+Shift+F` | Insert figure (opens figure attachment dialog) |
| `Ctrl+Shift+R` | Run preflight checks |
| `Ctrl+Shift+E` | Export (opens export dialog) |

## Behaviour and edge cases

- Shortcuts that conflict with browser defaults (e.g. `Ctrl+S` saving a web page) are intercepted by the Electron/Capacitor shell and routed to K-Perception. In the web PWA, `Ctrl+S` may trigger a browser save-as dialog in some browsers; use the toolbar Save button instead.
- `Ctrl+K` inside the Docs editor: when text is selected, it opens the link editor (TipTap built-in). When no text is selected, it opens the command palette.
- Android physical keyboards: standard Android key events are forwarded to the web view. Most shortcuts work as documented.

## Platform differences

| Scope | Windows | macOS | Android (physical kbd) | Web (browser) |
|---|---|---|---|---|
| Modifier key | `Ctrl` | `Cmd` | `Ctrl` | `Ctrl` |
| Full-screen | F11 | `Ctrl+Cmd+F` | N/A | Browser F11 |
| `Ctrl+S` | Save | Save | Save | May open browser dialog |
| Canvas shortcuts | All | All | Limited | All |

## Plan availability

All keyboard shortcuts are available on all plans.

## Permissions and roles

No permission restrictions apply to keyboard shortcuts.

## Security implications

No security implications — shortcuts are purely client-side UI actions.

## Settings reference

Custom keyboard shortcut remapping is not currently supported. The shortcut overlay (`Ctrl+/`) is the canonical reference and auto-updates when new shortcuts are added.

## Related articles

- [Command palette](command-palette.md)
- [Slash commands](slash-commands.md)
- [Docs editor](docs.md)
- [Sheets editor](sheets.md)

## Source references

- `src/renderer/src/components/` — KeyboardShortcutOverlay component
