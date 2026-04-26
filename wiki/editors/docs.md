---
title: "Docs editor"
slug: "docs"
category: "Editors"
tags: ["docs", "tiptap", "rich-text", "prosemirror", "formatting", "slash-commands"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/types.ts"
  - "src/renderer/src/components/"
  - "mobile/src/"
related: ["editors-overview", "markdown", "editorial", "slash-commands", "keyboard-shortcuts", "exports", "revision-history", "attachments"]
---

## What it is

Docs mode is K-Perception's rich-text WYSIWYG editor, built on TipTap v3 (which wraps ProseMirror). It presents a live-editing surface with no source code visible: headings look like headings, bold text is bold, tables appear as tables. This is the default mode for new notes.

Docs mode includes a comprehensive inline formatting set, a slash-command menu for inserting blocks, a bubble menu for context-sensitive formatting, a DocsOutline sidebar for navigation, mention support with `@`, task lists, syntax-highlighted code blocks, images with drag-resize handles, callout blocks, blockquotes, tables with column controls, and character count. On export it produces clean HTML or PDF with embedded styles.

The editor is optimised for touch on Android, with a touch-friendly toolbar and gesture-aware block selection.

## When to use it

Use Docs mode when:

- You want to write without markup syntax. You want headings to be headings visually, not `## headings`.
- You are writing meeting notes, project briefs, decision documents, design specs, SOPs, or any everyday knowledge-management content.
- You need task lists integrated into a prose document.
- You are building a document that will be shared with non-technical collaborators who should not see markup.
- You want the slash-command workflow to discover and insert block types without leaving the keyboard.

Use Markdown mode if you need the source to be portable plain text. Use Editorial mode if the document needs citations, structured figures, or a publication-grade export pipeline.

## Step by step

### Inline formatting

Select any text to show the bubble menu with quick access to the most common formatting commands. You can also use keyboard shortcuts without selecting text first (the shortcut toggles the mark at the cursor so newly typed text uses that style).

| Format | Keyboard shortcut | Bubble menu |
|---|---|---|
| Bold | Ctrl/Cmd+B | Yes |
| Italic | Ctrl/Cmd+I | Yes |
| Underline | Ctrl/Cmd+U | Yes |
| Strikethrough | Ctrl/Cmd+Shift+X | Yes |
| Highlight (yellow default) | Ctrl/Cmd+Shift+H | Yes |
| Text colour | — | Colour picker in bubble menu |
| Inline code | Ctrl/Cmd+E | Yes |
| Subscript | Ctrl/Cmd+, | Yes |
| Superscript | Ctrl/Cmd+. | Yes |
| Link | Ctrl/Cmd+K | Yes |
| Remove formatting | Ctrl/Cmd+\ | Yes |

### Headings

Type `/heading1` through `/heading6` via the slash-command menu, or use the keyboard shortcuts:

| Heading level | Shortcut |
|---|---|
| Heading 1 | Ctrl/Cmd+Alt+1 |
| Heading 2 | Ctrl/Cmd+Alt+2 |
| Heading 3 | Ctrl/Cmd+Alt+3 |
| Heading 4 | Ctrl/Cmd+Alt+4 |
| Heading 5 | Ctrl/Cmd+Alt+5 |
| Heading 6 | Ctrl/Cmd+Alt+6 |
| Body paragraph | Ctrl/Cmd+Alt+0 |

### Inserting blocks with slash commands

Type `/` at the start of an empty line or press `/` anywhere to open the slash-command menu. Type to filter by name. See the [Slash commands](slash-commands.md) article for a complete reference.

Common blocks in Docs mode:

- `/table` — insert a table with customisable column count.
- `/tasklist` — insert a checklist.
- `/code` — insert a syntax-highlighted code block.
- `/callout` — insert an info/warning/danger callout.
- `/image` — open the media picker or drag-and-drop target.
- `/quote` — insert a blockquote.
- `/divider` — insert a horizontal rule.
- `/mention` — trigger the `@` mention picker.

### Tables

Insert a table via `/table` or the toolbar. A table insertion picker lets you select the initial dimensions (up to 10×10 via the grid picker; larger tables can be expanded after insertion).

Once a table is inserted:

- Click any cell to select it. A column toolbar appears above the selected column with options to add a column to the left/right, delete the column, and toggle header styling.
- Right-click a row to see row operations: add row above, add row below, delete row.
- Drag the column resize handle to adjust width.
- Tab moves to the next cell; Shift+Tab moves to the previous. Tab in the last cell of the last row adds a new row.

### Task lists (checklists)

Insert a task list via `/tasklist` or the toolbar. Each item has a checkbox, body text, and optional sub-items (Tab to indent). Clicking the checkbox toggles the item's completed state. Completed items are not hidden; they remain visible with a strikethrough style.

Task list state is stored in the note body and syncs along with the rest of the note content.

### Code blocks

Insert a code block via `/code` or Ctrl/Cmd+Alt+C. A language selector appears in the top-right corner of the block. Syntax highlighting is powered by highlight.js (the same library as Markdown mode). The language auto-detection runs when you paste code without setting a language explicitly.

Inside a code block, Tab inserts a literal tab character. To exit the code block and create a new paragraph below, press Escape then Enter.

### Images

Insert images by:

- Dragging an image file from your file system and dropping it onto the editor.
- Pasting an image from the clipboard.
- Using the `/image` slash command to open the media picker.
- Clicking the image icon in the toolbar.

Inserted images display inline in the document. Drag the blue resize handles on any corner or edge to change the image dimensions. The aspect ratio is maintained by default; hold Shift while dragging to resize freely.

Images are stored as encrypted attachments on the note. The editor references them via internal URIs.

### Links

Select text and press Ctrl/Cmd+K to open the link dialog. Enter the URL and press Enter. To remove a link, click anywhere in the linked text and press Ctrl/Cmd+K again, then clear the URL field.

Links are auto-detected: if you paste a bare URL on its own, Docs mode converts it to a hyperlink with the URL as the label.

### Mentions

Type `@` anywhere in the document to open the mention picker. It searches your workspace member list by name. Select a member to insert a mention chip. Mentions are currently decorative (they appear as highlighted chips); push notifications on mention are planned.

### DocsOutline sidebar

Press **Ctrl/Cmd+Shift+O** or click the outline icon in the toolbar to open the DocsOutline sidebar. It lists all headings (H1–H6) as a nested tree. Clicking a heading scrolls the editor to that heading.

The outline updates live as you add or remove headings.

### Character count

The character count is shown in the status bar at the bottom of the editor. It displays both the character count and the word count. The word count excludes punctuation and whitespace. The character count includes all characters.

### Smart quotes

The typography extension is enabled by default. It converts straight quotes (`"`, `'`) to typographic curly quotes as you type. To insert a literal straight quote, type it and press Ctrl/Cmd+Z to undo the typography conversion.

You can disable smart quotes in Settings → Editor → Docs → Smart quotes.

### Exporting

1. Press **Ctrl/Cmd+Shift+E** or use the three-dot note menu → **Export**.
2. Choose **HTML** or **PDF**.
3. HTML export produces a self-contained HTML file with all styles embedded. Images are embedded as base64 data URIs.
4. PDF export uses pdf-lib. Choose paper size and margins in the export dialog.

## Behaviour and edge cases

- **Pasting from the web**: when you paste HTML from a browser, Docs mode converts it to the internal TipTap schema. Most basic formatting, links, and tables are preserved. Complex CSS layouts are flattened to paragraphs.
- **Pasting plain text**: plain text pastes as unstyled body paragraphs. If you want to paste Markdown source and have it rendered, use Edit → Paste as Markdown (or Ctrl/Cmd+Shift+V).
- **Undo limit**: TipTap maintains a 100-step undo history per editing session. The history does not persist across page reloads; use revision history for persistent snapshots.
- **Empty documents**: creating a task list or table as the very first content of an empty document can occasionally cause the cursor to land outside the block. Click inside the block to refocus.
- **Nested lists**: ordered and unordered lists can be nested to any depth by pressing Tab. Mixed nesting (ordered inside unordered and vice versa) is supported.
- **Callout types**: available callout types are **info**, **tip**, **warning**, and **danger**. Each has a distinct icon and background colour. You can change the type after insertion via the callout's type selector.
- **Horizontal rules and page breaks**: `/divider` inserts a horizontal rule. There is no explicit page break element; the PDF export engine handles page breaks automatically based on content flow.

## Platform differences

| Feature | Windows (Electron 28) | Android (Capacitor 6) | Web (PWA) |
|---|---|---|---|
| Bubble menu | Yes | Yes (long-press or select to show) | Yes |
| Slash command menu | Yes | Yes | Yes |
| DocsOutline sidebar | Yes | Via bottom sheet | Yes |
| Image drag-and-drop | Yes | No (use media picker) | Yes |
| Image clipboard paste | Yes | Android 11+ | Yes |
| Table column resize | Yes | No (fixed columns) | Yes |
| Mention picker | Yes | Yes | Yes |
| Character count | Yes | Yes | Yes |
| Smart quotes | Yes | Yes | Yes |
| Export to HTML | Yes | Yes | Yes |
| Export to PDF | Yes | Yes (share sheet) | Yes |

## Plan availability

All Docs mode features are available on all plans. There are no plan gates on rich-text editing, tables, task lists, slash commands, or exports.

## Permissions and roles

- **Owner / Admin / Editor**: full editing, including mode changes and export.
- **Viewer / Guest**: read-only rendering. The toolbar and bubble menu are hidden. The DocsOutline sidebar is available in read-only mode.

## Security implications

Docs mode content is stored as ProseMirror JSON internally, encrypted before storage. The HTML output of the export pipeline is generated client-side; no note content passes through K-Perception servers during export.

Mention data (workspace member names) is fetched from the workspace API when the mention picker is open. This fetch happens over HTTPS using the session's auth token. Mention chips stored in notes contain the member's user ID and a cached display name; the cached name is updated on next open if the member's name has changed.

The typography extension modifies characters in-place. It does not transmit input to any external service.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Smart quotes | Settings → Editor → Docs → Smart quotes | Convert straight quotes to typographic curly quotes. Default: on. |
| Auto-link detection | Settings → Editor → Docs → Auto-link | Convert bare URLs to hyperlinks on paste. Default: on. |
| Default code block language | Settings → Editor → Docs → Default code language | Language pre-selected for new code blocks. Default: none (auto-detect). |
| Show character count | Settings → Editor → Docs → Character count | Show word/character count in status bar. Default: on. |
| Callout default type | Settings → Editor → Docs → Default callout type | Type pre-selected for new callout blocks. Default: info. |

## Related articles

- [Editor modes overview](overview.md)
- [Slash commands](slash-commands.md)
- [Markdown editor](markdown.md)
- [Editorial editor](editorial.md)
- [Keyboard shortcuts](keyboard-shortcuts.md)
- [Exports](exports.md)
- [Revision history](revision-history.md)
- [Attachments](attachments.md)

## Source references

- `src/shared/types.ts` line 23 — `NoteMode` includes `"docs"`
- `src/renderer/src/components/` — `DocsEditor` (TipTap v3 instance), `DocsOutline`
- `mobile/src/` — `MobileDocsEditor` with touch toolbar
