---
title: "Editor modes overview"
slug: "editors-overview"
category: "Editors"
tags: ["editor", "modes", "overview", "comparison"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/types.ts"
  - "src/renderer/src/components/"
  - "mobile/src/"
related: ["plain-text", "markdown", "latex", "docs", "sheets", "canvas", "editorial", "command-palette", "keyboard-shortcuts"]
---

## What it is

K-Perception gives you seven distinct editor modes, each optimised for a different type of content. Rather than forcing everything into a single rich-text box, the app lets you pick the editing experience that matches what you are actually writing — whether that is raw code snippets, a formatted document, a spreadsheet, a hand-drawn diagram, or a publication-ready research paper.

Every mode shares a common infrastructure: zero-knowledge encryption of all content before it leaves your device, a command palette (Cmd+K), revision history, the attachment strip, the voice recorder, the AI panel sidebar, and the export system. The differences are in the editing surface itself and the rendering pipeline that turns your input into finished output.

This article gives you an at-a-glance comparison of all seven modes, explains how to switch between them, and guides you to the right mode for your task.

## When to use it

Read this article when you are not sure which mode to open a new note in, or when you want to understand the full capability set available across modes before you start a project.

## Step by step

### Creating a note in a specific mode

1. Open K-Perception on any platform.
2. Press **Cmd+K** (desktop/web) or tap the search icon (mobile) to open the command palette.
3. Type "New note" and select the result, or press the **+** button in the note list.
4. In the creation dialog, use the **Mode** selector to choose your starting mode.
5. You can change the mode of an existing note at any time from the note's three-dot menu → **Change mode**. Note that changing mode on a note that already has content may cause some formatting to be lost; K-Perception will warn you before converting.

### Switching modes on an existing note

1. Open the note.
2. Click the mode indicator in the bottom status bar (desktop/web) or tap the kebab menu → **Change mode** (mobile).
3. Confirm the conversion when prompted.

### Opening the mode capabilities overlay

Press **Cmd+/** (desktop/web) or tap **Shortcuts** in the note menu (mobile) to open the keyboard shortcuts overlay. This overlay is mode-aware and will show only the shortcuts relevant to the current editor.

## Behaviour and edge cases

- **Switching from Markdown to Plain**: raw Markdown source is preserved as-is, no stripping occurs.
- **Switching from Docs to Markdown**: TipTap HTML is converted to Markdown via a lossy HTML-to-MD serialiser. Callouts, mentions, and custom block types that have no Markdown equivalent are converted to plain paragraphs.
- **Switching from Sheets**: the grid is serialised to CSV-style plain text. All formulas are lost; only computed values are preserved.
- **Switching from Canvas**: the canvas PNG is embedded as an inline image in the target mode. Vector data (SVG strokes) is preserved in the attachment strip.
- **Switching from LaTeX**: the raw LaTeX source is preserved as plain text; the note's MIME type is updated.
- **Switching to Editorial from Docs**: the TipTap document is carried across intact; the citation manager starts empty.
- **Mode cannot be changed for notes opened from shared read-only links.** You see the content, but the mode selector is disabled.

## Platform differences

| Feature | Windows (Electron 28) | Android (Capacitor 6) | Web (PWA) |
|---|---|---|---|
| Plain mode | Full | Full | Full |
| Markdown mode | Full including split-pane | Preview rendered; split-pane not available | Full including split-pane |
| LaTeX mode | Full real-time preview pane | Preview only; edit pane simplified | Full real-time preview pane |
| Docs mode | Full | Full, touch-optimised toolbar | Full |
| Sheets mode | Full 500×52 grid | Reduced grid, formula bar; tap to edit | Full 500×52 grid |
| Canvas mode | Full pressure-sensitive pen | Full touch drawing | Full |
| Editorial mode | Full including preflight | Read-only on mobile; edit on desktop/web | Full |
| Mode switching UI | Status-bar selector | Kebab menu | Status-bar selector |
| Zen mode | Supported | Not available | Supported |

## Mode capabilities matrix

| Capability | Plain | Markdown | LaTeX | Docs | Sheets | Canvas | Editorial |
|---|---|---|---|---|---|---|---|
| Rich formatting | No | Preview | Preview | Live | N/A | N/A | Live |
| Math rendering (KaTeX) | No | Yes | Yes | No | No | No | No |
| Mermaid diagrams | No | Yes | No | No | No | No | No |
| Slash commands | No | No | No | Yes | No | No | Yes |
| Formula engine | No | No | No | No | Yes | No | No |
| Freehand drawing | No | No | No | No | No | Yes | No |
| Citation manager | No | No | No | No | No | No | Yes |
| Preflight checks | No | No | No | No | No | No | Yes |
| Export to PDF | Yes | Yes | Yes | Yes | No | Yes | Yes |
| Export to HTML | No | Yes | No | Yes | No | No | Yes |
| Export to CSV | No | No | No | No | Yes | No | No |
| Export to SVG | No | No | No | No | No | Yes | No |
| Find & Replace | Yes | Yes | No | Yes | Yes | No | Yes |
| Revision history | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| TOC sidebar | No | Yes | No | Yes | No | No | Yes |
| Bubble menu | No | No | No | Yes | No | No | Yes |
| Reading time | No | Yes | No | No | No | No | Yes |
| Split-pane preview | No | Yes | Yes | No | No | No | No |
| Zen mode | Yes | Yes | No | Yes | No | No | No |
| AI panel sidebar | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

## When each mode is best

**Plain** is best when you do not want any rendering at all — raw code you are copying across systems, log output, unformatted meeting notes, configuration file fragments, or any text where every character must appear exactly as typed.

**Markdown** is best for structured writing where you want the source to remain human-readable. It is the natural choice for README files, technical blog posts, project documentation, study notes, and any writing that may need to be copied into a Markdown-aware tool later. The split-pane preview and KaTeX support make it capable of light technical writing.

**LaTeX** is best for documents that involve dense mathematical notation, formal proofs, academic paper structure, or numbered equations. It is not a word processor; if your document has more prose than equations, Docs or Editorial will serve you better.

**Docs** is best for everyday rich-text notes where you want formatting, tables, task lists, and images without writing markup. Think meeting notes, project briefs, decision documents, checklists, and general personal knowledge articles.

**Sheets** is best for tabular data with computation: budgets, schedules, comparison tables, grade trackers, workout logs, habit trackers, or any data where you need formulas, running totals, or cell cross-references.

**Canvas** is best for visual thinking: system architecture diagrams, wireframes, mind maps, rough sketches, annotated screenshots, or any content where spatial layout matters more than text structure.

**Editorial** is best for documents that will be published or formally submitted: research papers, technical reports, long-form articles, grant proposals, legal briefs, and journalism. It adds citation management, figure captioning, page-geometry controls, and export preflight checks that the other modes do not have.

## Plan availability

All seven editor modes are available on every plan, including the free Local plan. There is no plan gate on opening, editing, or exporting notes in any mode. Plan-based limits apply to features that involve cloud infrastructure: revision history retention, attachment upload size, and cloud sync. See individual mode articles for plan-specific limits on those features.

## Permissions and roles

In personal notes, you are always the owner and have full access to all modes. In workspace contexts:

- **Owner / Admin**: can open any note in any mode and change the note's mode.
- **Editor**: can open and edit notes; can change mode on notes they created.
- **Viewer**: read-only access; mode selector is disabled.
- **Guest**: read-only access to shared notes; mode selector is disabled.

## Security implications

Mode selection has no effect on encryption. All note content — regardless of mode — is encrypted client-side with AES-256-GCM before being stored locally or synced to cloud storage. The mode identifier is stored as metadata alongside the encrypted note body. An attacker who obtained raw storage would not be able to determine which mode was used to write a note.

When you change modes, the conversion (for example, Docs HTML to Markdown text) happens entirely in-process on your device. The plaintext at no point passes through K-Perception's servers.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Default mode for new notes | Settings → Editor → Default mode | The mode pre-selected when you create a new note. Default: Docs. |
| Warn before mode conversion | Settings → Editor → Warn on mode change | Shows a confirmation dialog before converting a note's mode. Default: on. |
| Restore last-used mode | Settings → Editor → Remember mode per note | Saves the mode alongside each note so it re-opens in the correct mode. Default: on. |

## Related articles

- [Plain text editor](plain-text.md)
- [Markdown editor](markdown.md)
- [LaTeX editor](latex.md)
- [Docs editor](docs.md)
- [Sheets editor](sheets.md)
- [Canvas editor](canvas.md)
- [Editorial editor](editorial.md)
- [Command palette](command-palette.md)
- [Keyboard shortcuts](keyboard-shortcuts.md)
- [Revision history](revision-history.md)
- [Exports](exports.md)

## Source references

- `src/shared/types.ts` line 23 — `NoteMode` union type enumerating all seven modes
- `src/renderer/src/components/` — individual editor component implementations
- `mobile/src/` — mobile editor adaptations
