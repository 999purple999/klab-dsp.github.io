---
title: "Slash commands"
slug: "slash-commands"
category: "Editors"
tags: ["slash-commands", "docs", "editorial", "shortcuts"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/"
related: ["docs", "editorial", "command-palette", "keyboard-shortcuts"]
---

# Slash commands

## What it is

Slash commands are inline insertion triggers available in the **Docs** and **Editorial** editor modes. When you type `/` at the start of an empty block (or after pressing Enter on a new line), a contextual menu appears listing every insertable element. You can type after the slash to filter the list. Selecting a command inserts the corresponding block or inline element at the cursor position.

## When to use it

Use slash commands to insert rich content without leaving the keyboard or remembering toolbar icons:

- Insert a code block without hunting through the toolbar.
- Add a table at the current cursor position.
- Insert a citation reference from the workspace citation registry (Editorial mode).
- Embed a workspace file reference inline in a document.

## Step by step

1. In the Docs or Editorial editor, position your cursor at the start of a new empty line (or press **Enter** to create one).
2. Type `/`. The slash-command menu appears immediately below the cursor.
3. Optionally continue typing to filter: `/cod` narrows the list to commands whose name contains "cod" (e.g. Code block).
4. Use **↑ / ↓** arrows to highlight the desired command. On mobile, scroll the list and tap.
5. Press **Enter** (or tap) to insert.
6. Press **Escape** to dismiss the menu and keep the `/` as literal text.

![Slash command menu open in Docs editor](../assets/slash-commands-1.png)

## Complete command reference

### Heading levels
| Command | Inserts |
|---|---|
| `/heading1` or `/h1` | Heading level 1 (`# `) |
| `/heading2` or `/h2` | Heading level 2 (`## `) |
| `/heading3` or `/h3` | Heading level 3 |
| `/heading4` `/heading5` `/heading6` | Heading levels 4–6 |

### Text blocks
| Command | Inserts |
|---|---|
| `/paragraph` | Normal paragraph block |
| `/quote` | Blockquote |
| `/callout` | Callout box (with icon, info/warning/error variants) |
| `/divider` | Horizontal rule |
| `/code` or `/codeblock` | Fenced code block with language selector |

### Lists
| Command | Inserts |
|---|---|
| `/list` or `/bullet` | Bulleted list |
| `/numbered` | Numbered list |
| `/tasklist` or `/todo` | Task list (checkbox items) |

### Rich media
| Command | Inserts |
|---|---|
| `/image` | Image uploader (local file or URL) |
| `/attachment` | File attachment picker |
| `/table` | Table (default 3 × 3; resize with column/row handles) |
| `/mermaid` | Mermaid diagram fenced block |
| `/math` | KaTeX display math block |

### Collaboration and references
| Command | Inserts |
|---|---|
| `/mention` | @-mention — opens member picker |
| `/toc` | Auto-generated table of contents (Docs only) |
| `/file` | Workspace file picker → inserts `~kp://w/:ws/f/:id` URI (workspace context only) |

### Editorial-only commands
| Command | Inserts |
|---|---|
| `/citation` | Opens citation picker → inserts inline structured reference |
| `/figure` | Attachment-based SVG figure with caption field |
| `/pagebreak` | Manual page break (affects PDF export) |

## Behaviour and edge cases

- **Filtering:** The filter matches against command name, description, and keyword aliases. `/tb` matches "Table".
- **Partial slash:** If you type `/` inside a word (e.g. `10/20`), the slash command menu does NOT open — it only activates when `/` is the first character of the current block.
- **No results:** If no command matches the typed filter, the menu shows "No matching commands". Press Escape or Backspace to clear the filter.
- **Mode availability:** `/citation` and `/figure` are only available in Editorial mode. `/file` is only available inside a workspace context (Team/Enterprise). `/toc` is Docs-only.
- **Undo:** Inserting via slash command is undoable with `Ctrl+Z` / `Cmd+Z`.
- **Markdown mode:** Slash commands are NOT available in Markdown mode (which uses CodeMirror). Use the toolbar or type syntax directly.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Trigger | `/` at block start | `/` at block start | `/` at block start |
| Menu navigation | Arrow keys + Enter | Scroll + tap | Arrow keys + Enter |
| All commands available | Yes | Yes (file picker adapted for mobile) | Yes |

## Plan availability

All slash commands are available on all plans. The `/file` command requires a Team or Enterprise workspace.

## Permissions and roles

The `/mention` command shows only members of the current workspace you have access to. The `/file` command shows only files in sections you can read.

## Security implications

Slash commands operate entirely client-side. The `/citation` and `/file` commands make authenticated requests to the workspace API but transmit only encrypted identifiers — no plaintext content is sent.

## Settings reference

There is no configuration panel for slash commands. Custom slash commands are not currently supported.

## Related articles

- [Docs editor](docs.md)
- [Editorial editor](editorial.md)
- [Command palette](command-palette.md)
- [Keyboard shortcuts](keyboard-shortcuts.md)

## Source references

- `src/renderer/src/components/` — SlashCommandMenu component in Docs/Editorial editors
