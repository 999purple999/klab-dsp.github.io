---
title: "Editorial editor"
slug: "editorial"
category: "Editors"
tags: ["editorial", "citations", "publication", "tiptap", "preflight", "pdf", "html", "templates"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/types.ts"
  - "src/renderer/src/components/"
related: ["editors-overview", "docs", "exports", "slash-commands", "keyboard-shortcuts", "revision-history", "attachments"]
---

## What it is

Editorial mode is K-Perception's seventh and most specialised editor. It is built on the same TipTap v3 / ProseMirror base as Docs mode, with a second layer added on top that provides structured citation management, attachment-based SVG figures with captions, configurable CSS-variable page geometry, a severity-gated preflight check system, and persistent named export templates.

The mode is designed for documents that will be published, formally submitted, or distributed to audiences outside K-Perception: research papers, technical reports, long-form journalism, grant proposals, legal briefs, white papers, and anything else where publication standards apply. You get the same rich-text editing experience as Docs mode, plus the publication-infrastructure tools to produce a polished, well-formed final document.

## When to use it

Use Editorial mode when:

- You need structured citations with automatic bibliography generation.
- You are producing a document for formal submission (journal, institution, client).
- You need to control page margins, line height, and font size at the document level (not just the theme level).
- You want to attach SVG figures with numbered captions and cross-references.
- You want the export pipeline to warn or block if the document is incomplete before you export.
- You need named, reusable export templates that preserve your preferred paper size, font, and margin settings across documents.

Use Docs mode instead of Editorial if you are writing informal documents that do not need citations or formal publication structure. Use LaTeX mode if your document requires precise LaTeX typesetting commands or packages that Editorial does not support.

## Step by step

### The citation manager

The citation manager is a panel that opens from the right side of the editor. Click the **Citations** icon in the toolbar or press **Ctrl/Cmd+Shift+C** to toggle it.

**Adding a citation**

1. In the citation panel, click **Add citation**.
2. Fill in the citation fields. Available fields vary by source type:
   - **Journal article**: authors, title, journal name, year, volume, issue, pages, DOI.
   - **Book**: authors, title, publisher, year, edition, ISBN.
   - **Book chapter**: chapter authors, chapter title, book editors, book title, publisher, year, pages.
   - **Website**: authors (if any), page title, site name, URL, access date.
   - **Other**: free-form fields.
3. Select the citation format: the manager shows the formatted citation preview in the selected style. The citation format field is user-configurable (default: APA). The specific supported style names (APA, MLA, Chicago variants, Vancouver, etc.) depend on the citation-rendering implementation; contact support or check release notes for the confirmed style list.
4. Click **Save**.

**Inserting a citation inline**

1. Place the cursor where you want the inline citation marker.
2. Type `/citation` to open the slash-command citation picker, or click the **Insert citation** button in the citation panel.
3. Search for the citation by author name or title.
4. Select it. A citation chip appears at the cursor position (e.g. `[1]` or `(Smith, 2023)` depending on the citation format).

**Auto-generated bibliography**

At the end of the document, place the cursor where you want the bibliography and type `/bibliography` (slash command) or click **Insert bibliography** in the citation panel. A live-updating bibliography block appears. It automatically includes all cited references in the selected citation format, sorted alphabetically (APA/MLA/Chicago) or by order of first citation (Vancouver).

If you change a citation's details in the citation panel, the inline markers and the bibliography block update automatically.

**Editing and deleting citations**

In the citation panel, click any citation to open its edit form. Click **Delete** to remove the citation from the manager. Inline markers and bibliography entries for that citation are replaced with a broken-citation placeholder (shown in amber in the editor and flagged by the preflight check).

### Attachment-based SVG figures

**Inserting a figure**

1. Attach an SVG file to the note via the attachment strip (drag-and-drop or the attachment button).
2. Type `/figure` in the editor to open the figure insertion dialog.
3. Select the SVG attachment from the list.
4. Add a caption. The figure is assigned an automatic number (Figure 1, Figure 2, ...) based on its position in the document.
5. The figure renders inline with the caption below it.

**Cross-referencing figures**

Use the `/figref` slash command or type `\figref{figure-id}` (Editorial supports both syntaxes) to insert a cross-reference chip that displays the figure's current number. If the figure is moved or renumbered, all cross-references update automatically.

**Non-SVG figures**: you can attach PNG or JPEG images and insert them as figures the same way. SVG figures are recommended for diagrams because they scale cleanly to any page size. Raster images are embedded at their attachment resolution.

**Figure positioning**: by default, figures appear inline with the text flow. You can set a figure to **full-width** (spans the text column) via the figure options menu (right-click the figure or use the figure toolbar that appears on hover).

### Page geometry controls

Editorial mode adds a **Page geometry** panel accessible from the toolbar (or **Ctrl/Cmd+Shift+G**). These settings are stored per-document (overriding the global export theme) and are applied to HTML and PDF exports.

| CSS variable | What it controls | Default |
|---|---|---|
| `--page-width` | Text column width | 65 ch (approximately 680 px at 16 px base) |
| `--page-margin-top` | Top margin | 25 mm |
| `--page-margin-bottom` | Bottom margin | 25 mm |
| `--page-margin-left` | Left margin | 30 mm |
| `--page-margin-right` | Right margin | 30 mm |
| `--base-font-size` | Root font size | 11 pt |
| `--line-height` | Line height multiplier | 1.5 |
| `--font-family` | Body font | Georgia (serif) |
| `--heading-font-family` | Heading font | System sans-serif |
| `--paragraph-spacing` | Space below paragraphs | 0.8 em |

Fonts available: Georgia, Times New Roman, Palatino (serif); Arial, Helvetica, Inter (sans-serif); Courier New, Fira Code (monospace).

These values are entered as CSS values in the panel's input fields. Any valid CSS length (`mm`, `cm`, `pt`, `px`, `em`, `ch`, `%`) is accepted.

### Preflight checks

The preflight system runs before every export and can be triggered manually from the toolbar (the shield/check icon) or with **Ctrl/Cmd+Shift+P**.

Preflight rules are categorised by severity:

- **Info**: informational observations; export continues normally.
- **Warning**: potential issues; you see a warning dialog with a "Continue anyway" option.
- **Error**: blocking issues; export is prevented until the issue is resolved.

**Built-in preflight rules**

| Rule | Severity | Condition |
|---|---|---|
| Missing bibliography | Warning | Document has inline citation markers but no bibliography block |
| Broken citation reference | Error | Inline marker references a deleted citation |
| Broken figure reference | Error | `/figref` cross-reference points to a figure that no longer exists |
| Orphaned figure | Info | A figure in the document is not referenced by any `/figref` |
| Overly long paragraph | Warning | A single paragraph exceeds 500 words |
| Document has no title | Warning | The document has no H1 heading |
| Empty document | Error | Document body contains no text content |
| Attachment missing | Error | A figure references an attachment that has been deleted from the strip |

**Custom preflight rules**: you can add custom rules in Settings → Editorial → Preflight. Each custom rule is defined as a simple text pattern (plain text or regex) and a severity level. If the pattern is found anywhere in the document, the rule fires.

### Persistent custom export templates

A template saves the page geometry settings, export format (HTML or PDF), paper size, citation format, and a chosen name.

**Saving a template**

1. Configure the page geometry and export settings as desired.
2. Click **Save as template** in the page geometry panel or export dialog.
3. Give the template a name.
4. The template is saved to your profile and available in all future Editorial notes.

**Loading a template**

1. In any Editorial note, open the page geometry panel or export dialog.
2. Click **Load template** and select from your saved templates.
3. The document's page geometry settings are updated immediately.

Templates are stored encrypted in your note metadata. They are not tied to any specific note; they are per-user preferences.

**Default template**: in Settings → Editorial → Default template, you can set a template that is automatically applied to all new Editorial notes.

### Exporting

**HTML export**

Produces a single HTML file with all CSS variables resolved and styles embedded in a `<style>` tag. Images and SVG figures are embedded as base64 data URIs. The output is self-contained and can be opened in any browser. Fonts that require web font files are replaced with system font fallbacks unless you are exporting from the desktop app with the fonts installed locally.

**PDF export**

Produces a PDF via pdf-lib. The PDF respects the page geometry CSS variables. Text is embedded as system font text (not outlined). Page headers and footers can be configured in the export dialog: document title, author, date, and page numbers.

**Raw export formats**: for programmatic use, Editorial notes can also be exported as Markdown (a best-effort conversion, some Editorial-specific elements may not convert perfectly) or as the KPX encrypted portable format.

## Behaviour and edge cases

- **Cross-references update on document change**: figure numbers and citation markers are computed dynamically based on document structure. Reordering content (moving a figure before another) will renumber figures and update all `/figref` chips.
- **SVG scaling in PDF**: SVG figures are rasterised at 2× the PDF page resolution during PDF export. Very complex SVGs with thousands of elements may slow down the PDF generation step.
- **Bibliography placement at end**: if the bibliography block is not the last block in the document, the preflight shows an Info notice. This is not a blocking error.
- **Multiple bibliographies**: inserting two `/bibliography` blocks is allowed but will produce an Info warning. Both blocks display the same reference list.
- **Citation format change**: changing the citation format in the citation panel reformats all inline markers and the bibliography block live. The change is undoable.
- **Read-only on mobile**: Editorial mode is currently write-restricted on Android. You can view and read Editorial notes on Android via `MobileEditorialViewer`, but the citation manager, figure insertion, and preflight tools are not available. Edits must be made on desktop or web.
- **Collaboration**: Editorial notes in workspaces support real-time co-editing (Y.js CRDT) the same as Docs notes. Citation panel changes are synchronised; two users editing citation metadata simultaneously may produce a merge conflict resolved by last-write-wins on the citation fields.

## Platform differences

| Feature | Windows (Electron 28) | Android (Capacitor 6) | Web (PWA) |
|---|---|---|---|
| Full editing surface | Yes | Read-only (view only) | Yes |
| Citation manager | Yes | No | Yes |
| SVG figure insertion | Yes | No | Yes |
| Page geometry panel | Yes | No | Yes |
| Preflight checks | Yes | View results only | Yes |
| Custom export templates | Yes | Can load templates | Yes |
| HTML export | Yes | Yes (share) | Yes |
| PDF export | Yes | View only | Yes |
| Bibliography auto-generation | Yes | No | Yes |

## Plan availability

Editorial mode is available on all plans. All features — citation manager, figure insertion, page geometry, preflight, and export templates — are available on every plan including Local.

## Permissions and roles

- **Owner / Admin / Editor**: full access to all Editorial features.
- **Viewer / Guest**: can read the document, view figures, and view the formatted bibliography. Cannot edit citations, insert figures, change page geometry, or export.

## Security implications

Citation data (author names, titles, DOIs, URLs) is stored as structured JSON within the note body and encrypted along with it. URL fields in citations are clickable links in the rendered view; they open in the system browser.

Page geometry CSS variables are stored in note metadata, encrypted. They are applied client-side at render/export time; no layout computation happens on K-Perception servers.

Preflight checks run entirely on-device. No document content is transmitted during a preflight run.

Export templates are stored encrypted in your profile's settings blob. They are synced to cloud if you are on Guardian or above.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Default citation format | Settings → Editorial → Default citation format | Format applied to new Editorial notes. Default: APA. |
| Default template | Settings → Editorial → Default template | Template auto-applied to new Editorial notes. Default: none. |
| Preflight on export | Settings → Editorial → Run preflight on export | Run preflight automatically when you trigger an export. Default: on. |
| Custom preflight rules | Settings → Editorial → Preflight → Custom rules | Define additional regex or plain-text preflight rules. |
| Figure number prefix | Settings → Editorial → Figure prefix | Text before figure number in captions. Default: "Figure". |
| Overly long paragraph threshold | Settings → Editorial → Long paragraph threshold | Word count threshold for the paragraph-length preflight rule. Default: 500. |

## Related articles

- [Editor modes overview](overview.md)
- [Docs editor](docs.md)
- [Slash commands](slash-commands.md)
- [Exports](exports.md)
- [Keyboard shortcuts](keyboard-shortcuts.md)
- [Revision history](revision-history.md)
- [Attachments](attachments.md)

## Source references

- `src/shared/types.ts` line 23 — `NoteMode` includes `"editorial"`
- `src/renderer/src/components/` — `EditorialEditor`, `CitationManager`, `PreflightPanel`
- `mobile/src/` — `MobileEditorialViewer` (read-only)
