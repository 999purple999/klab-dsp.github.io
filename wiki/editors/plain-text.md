---
title: "Plain text editor"
slug: "plain-text"
category: "Editors"
tags: ["plain", "text", "codemirror", "monospace", "raw"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/types.ts"
  - "src/renderer/src/components/"
related: ["editors-overview", "markdown", "keyboard-shortcuts", "exports", "revision-history"]
---

## What it is

Plain text mode is the simplest editor in K-Perception. It is a CodeMirror 6 instance configured with a monospace font, line numbers, and no rendering layer — what you type is exactly what you see and exactly what is stored. There is no Markdown preview, no rich formatting, no formula engine, and no special block types.

The mode is intentionally minimal. It gives you a fast, distraction-free space for content where formatting would be in the way: source code fragments, terminal output, raw configuration, unprocessed log data, and short scratchpad notes where you want zero ambiguity between input and stored text.

Because the editor is CodeMirror, it inherits CodeMirror's mature keyboard handling, Unicode support, multi-cursor editing, and performance characteristics even on very large files.

## When to use it

Use plain text mode when:

- You are capturing raw text that must not be altered by any rendering pipeline — log files, terminal output, stack traces, or system configuration.
- You are drafting text that will be pasted into an external tool that does its own formatting. A GitHub issue body, a shell script, an API request body, or a CSV fragment that you do not need to actually compute in Sheets.
- You want the absolute lowest cognitive overhead for notes. No slash menus appear, no auto-formatting fires, no syntax gets interpreted.
- You are writing structured data formats: JSON, YAML, TOML, XML, dotenv files, or similar. Plain mode's monospace rendering and optional language highlighting (see Settings reference) makes these readable.
- You need to compare two raw text fragments side by side using Find & Replace's regex support.

Plain text mode is not the right choice when you need rendered output. If you want Markdown to be rendered into HTML for reading, use Markdown mode. If you need bold, italic, or headings in a rendered document, use Docs mode.

## Step by step

### Opening a note in plain text mode

1. Create a new note via **Cmd+K → New note** or the **+** button.
2. In the creation dialog, set **Mode** to **Plain text**.
3. Alternatively, change an existing note's mode: open the note, click the mode indicator in the status bar, and select **Plain text**. Confirm the conversion if prompted.

### Navigating the editor

The editor opens with cursor focus at the top of the document. Standard keyboard navigation applies:

- **Arrow keys** — move character by character or line by line.
- **Ctrl/Cmd+Home** — jump to start of document.
- **Ctrl/Cmd+End** — jump to end of document.
- **Ctrl/Cmd+G** — go to line number (desktop/web).
- **Ctrl/Cmd+Left/Right** — move word by word.
- **Shift+any movement key** — extend the selection.

### Using Find & Replace

1. Press **Ctrl/Cmd+F** to open the Find bar at the bottom of the editor.
2. Type your search term. Matches are highlighted in the editor as you type.
3. Press **Enter** or the **Next** button to jump to the next match. **Shift+Enter** goes to the previous match.
4. Press **Ctrl/Cmd+H** or click the **Replace** toggle to expand to Find & Replace.
5. Type the replacement string in the second field.
6. Click **Replace** to replace the current match, or **Replace all** to replace every match in the document.
7. Toggle **Regex** (the `.*` button) to use regular expressions in the search field. Capture groups (`$1`, `$2`) are available in the replacement field.
8. Toggle **Match case** for case-sensitive search.
9. Press **Escape** or click the **X** to close Find.

### Multi-cursor editing

1. **Alt+Click** (desktop/web) to place an additional cursor.
2. **Ctrl/Cmd+D** to select the next occurrence of the current selection and add a cursor there.
3. **Escape** to collapse all cursors back to one.

### Exporting a plain text note

1. Click the three-dot menu on the note or press **Ctrl/Cmd+Shift+E** to open the export dialog.
2. Available formats: **Plain text (.txt)** and **Markdown (.md)**. Exporting to Markdown from plain text mode simply renames the extension; no conversion is applied to the content.
3. Select a format, choose a save location (desktop) or share target (Android), and confirm.

## Behaviour and edge cases

- **Line endings**: K-Perception normalises all line endings to LF (`\n`) internally. When you export to `.txt` on Windows, the export dialog gives you the option to convert to CRLF for Windows compatibility. The default follows the OS convention.
- **Large files**: CodeMirror handles large documents efficiently by virtualising the viewport. Documents up to several megabytes load without visible delay. Very large files (tens of MB) may slow down Find & Replace on older devices.
- **Null bytes and binary content**: plain text mode is designed for text. If you paste binary data containing null bytes, CodeMirror may substitute replacement characters. Use the attachment strip for binary files instead.
- **Tabs vs spaces**: by default, the Tab key inserts a tab character in plain text mode (unlike Markdown and Docs modes, where Tab indents a list). You can change tab behaviour in Settings → Editor → Plain text → Tab behaviour (tab character / 2 spaces / 4 spaces).
- **Auto-brackets and auto-quotes**: disabled by default in plain text mode. You can enable them in Settings → Editor → Plain text → Auto-close brackets.
- **Undo/redo**: standard CodeMirror undo stack, scoped per editing session. The session stack resets on reload, but revision history (Ctrl/Cmd+Shift+H) gives you named saved snapshots.
- **Scroll position**: plain text mode remembers your scroll position and cursor location when you switch away from the note and come back within the same session.
- **Word wrap**: word wrap is off by default. Toggle it with **Alt+Z** (desktop/web) or from the note menu on mobile.

## Platform differences

| Feature | Windows (Electron 28) | Android (Capacitor 6) | Web (PWA) |
|---|---|---|---|
| CodeMirror editor | Full | Full | Full |
| Line numbers | Shown by default | Hidden by default (toggle in settings) | Shown by default |
| Monospace font | System monospace (Cascadia Code if available) | System monospace | System monospace |
| Multi-cursor (Alt+Click) | Yes | No (touch input) | Yes |
| Find & Replace | Full with regex | Basic (no regex toggle on small screens) | Full with regex |
| Go to line (Ctrl+G) | Yes | No | Yes |
| Word wrap toggle (Alt+Z) | Yes | Via note menu | Yes |
| Export dialog | Full | Share sheet | Full |
| Hardware keyboard | Full shortcut set | Full shortcut set when keyboard attached | Full shortcut set |

## Plan availability

Plain text mode is available on all plans. There are no plan-based restrictions on note length, the number of notes, or the use of Find & Replace.

Plan-based limits that apply to all modes (not specific to plain text):
- **Local (free)**: no cloud sync; notes stored on-device only; no revision history.
- **Guardian (€3.49/mo)**: cloud sync; revision history up to 30 days.
- **Vault and above**: cloud sync; unlimited revision history.

## Permissions and roles

In personal notes: full access at all times.

In workspace notes:
- **Owner / Admin / Editor**: can open, edit, and export.
- **Viewer / Guest**: can open and read; cannot edit or export.

## Security implications

Plain text mode stores content identically to all other modes from a security standpoint. The note body is encrypted with AES-256-GCM before being written to local storage or uploaded. The absence of rich formatting does not change the encryption scheme.

One practical point: because plain text mode imposes no structure on content, users sometimes paste sensitive data — API keys, passwords, private keys — into plain text notes as a convenient scratch area. This data is encrypted at rest, but if the device is unlocked, any application or user with access to the K-Perception database directory could potentially access the session's decryption material. Treat encrypted notes as "secure from passive observation of storage" rather than "secure from an active attacker with device access and admin rights".

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Tab behaviour | Settings → Editor → Plain text → Tab behaviour | Insert tab character, 2 spaces, or 4 spaces. Default: tab character. |
| Line numbers | Settings → Editor → Plain text → Line numbers | Show or hide line numbers. Default: on. |
| Word wrap | Settings → Editor → Plain text → Word wrap | Wrap long lines. Default: off. |
| Auto-close brackets | Settings → Editor → Plain text → Auto-close brackets | Automatically insert closing bracket/quote. Default: off. |
| Font size | Settings → Editor → Font size | Global font size; applies to all monospace editors. |
| Syntax highlighting | Settings → Editor → Plain text → Syntax highlighting | Auto-detect language for highlighting (JSON, YAML, shell). Default: off. |

## Related articles

- [Editor modes overview](overview.md)
- [Markdown editor](markdown.md)
- [Keyboard shortcuts](keyboard-shortcuts.md)
- [Revision history](revision-history.md)
- [Exports](exports.md)
- [Find & Replace](markdown.md#find--replace)

## Source references

- `src/shared/types.ts` line 23 — `NoteMode` type includes `"plain"` as the first variant
- `src/renderer/src/components/` — `PlainEditor` component wrapping CodeMirror 6
- `mobile/src/` — `MobilePlainEditor` component
