---
title: "LaTeX editor"
slug: "latex"
category: "Editors"
tags: ["latex", "katex", "latex.js", "math", "pdf", "preview"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/types.ts"
  - "src/renderer/src/components/"
related: ["editors-overview", "markdown", "editorial", "exports", "keyboard-shortcuts"]
---

## What it is

LaTeX mode is a full document-composition editor for LaTeX source. It combines a CodeMirror 6 source editor with a real-time preview pane that renders your LaTeX using two complementary technologies: **KaTeX** for mathematics typesetting and **latex.js** for document-level layout including sectioning, environments, cross-references, and basic typography. The rendered output is visible as you type, with a 200 ms debounce.

The result is an editor that feels like a lightweight alternative to a full TeX distribution: you write LaTeX source and see a close approximation of the final layout without installing any TeX binaries. For the final PDF, K-Perception uses pdf-lib to produce a downloadable PDF that respects the document's page geometry settings.

LaTeX mode is not a complete TeX runtime. It is based on latex.js, which supports a practical subset of LaTeX packages and commands sufficient for most academic and technical writing. Commands that latex.js does not implement silently degrade or show an unresolved macro warning in the preview margin.

## When to use it

Use LaTeX mode when:

- Your document consists primarily of mathematical content — theorems, proofs, equations, matrices, chemical formulae.
- You are preparing an academic paper and want standard LaTeX sectioning (`\section`, `\subsection`), numbered equations (`equation`, `align`), and cross-references (`\label`, `\ref`).
- You are comfortable with LaTeX syntax and want a zero-install, zero-configuration editor for LaTeX documents.
- You need PDF output that looks like a typeset document rather than a browser-rendered page.

If your document is mostly prose with occasional equations, Markdown mode's KaTeX support or Editorial mode may serve you better. If you need specific packages that latex.js does not support (for example, `pgfplots`, `tikz`, or `biblatex`), you will need a full TeX distribution on your local machine and K-Perception's LaTeX export to feed the `.tex` source to it.

## Step by step

### Opening a note in LaTeX mode

1. Create a new note and set **Mode** to **LaTeX**, or change an existing note's mode via the status bar mode selector.
2. The editor opens with a starter `article` document template. You can delete this and start from scratch if you prefer.

### Document structure

A minimal working document:

```latex
\documentclass{article}
\title{My Document}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle

\section{Introduction}
This is the introduction.

\subsection{Background}
More detail here.

\end{document}
```

### Supported document classes

latex.js supports the following document classes:

- `article` — the most commonly used class; supports `\section`, `\subsection`, `\subsubsection`, `\paragraph`.
- `report` — adds `\chapter` above `\section`.
- `letter` — basic letter class with `\opening`, `\closing`, `\signature`.
- `minimal` — no sectioning; useful for standalone math documents.

Other document classes declared in `\documentclass` are treated as `article` by latex.js.

### Mathematics

Both inline and display math are supported via KaTeX.

**Inline math** using `$...$` or `\(...\)`:

```latex
The energy $E = mc^2$ is fundamental.
```

**Display math** using `$$...$$`, `\[...\]`, or the `equation` environment:

```latex
\begin{equation}
  \int_0^\infty e^{-x^2}\, dx = \frac{\sqrt{\pi}}{2}
  \label{eq:gaussian}
\end{equation}
```

**Numbered equations with labels**: use `\label{eq:name}` inside an `equation` or `align` environment, then `\ref{eq:name}` or `\eqref{eq:name}` to cite it elsewhere.

**Multi-line aligned equations**:

```latex
\begin{align}
  a &= b + c \\
  d &= e + f
\end{align}
```

### Cross-references

```latex
\section{Methods}
\label{sec:methods}

See Section~\ref{sec:methods} for details.
```

Cross-references resolve within the same document. Forward references (referencing a label that appears later in the source) are resolved on the second render pass; in the live preview you may see `??` for a moment before they resolve.

### Supported packages (latex.js subset)

The following packages are supported by latex.js and available in LaTeX mode:

| Package | What it provides |
|---|---|
| `amsmath` | `align`, `gather`, `multline`, `split`, `cases` environments; `\text`, `\operatorname` |
| `amssymb` | Extended math symbol set including `\mathbb`, `\mathfrak` |
| `amsfonts` | Blackboard bold and fraktur fonts |
| `graphicx` | `\includegraphics` (images must be uploaded as attachments; local paths resolve to attachment URIs) |
| `geometry` | Page margin configuration |
| `hyperref` | `\href`, `\url` |
| `inputenc` | UTF-8 input encoding (declared automatically) |
| `fontenc` | T1 font encoding (declared automatically) |
| `color` | Basic colour commands |
| `xcolor` | Named colour set |
| `enumitem` | Customise list spacing and labels |
| `booktabs` | `\toprule`, `\midrule`, `\bottomrule` for tables |
| `array` | Extended column types in tabular |
| `listings` | Verbatim code with basic syntax colouring |

Packages not in this list are parsed and the `\usepackage` declaration is silently ignored. Commands from unsupported packages show as unresolved macros in the preview margin (amber text). They will appear correctly in a full TeX compilation if you export the `.tex` source.

Packages with known incompatibilities that produce preview errors rather than silent degradation: `pgfplots`, `tikz`, `beamer`, `biblatex`, `natbib`. Do not include these; they will break the preview renderer.

### Real-time preview

The preview pane updates within 200 ms of you stopping typing. The preview shows a scrollable rendered page that approximates the final PDF layout.

If the document has a syntax error that prevents latex.js from parsing it, the preview shows the last valid state and an error banner at the top describing the first parse error it encountered. Errors are also marked in the source pane with a red underline.

### Exporting to PDF

1. Click **Export** in the toolbar or press **Ctrl/Cmd+Shift+E**.
2. Select **PDF** from the format list.
3. Set paper size (A4 or Letter; Custom dimensions available) and margin values if you want to override the document's `\geometry` declaration.
4. Click **Export**. pdf-lib renders the document and produces a `.pdf` file.

To export the raw LaTeX source (`.tex` file), select **LaTeX source** in the export dialog. This gives you a portable `.tex` file that you can compile with a full TeX distribution.

## Behaviour and edge cases

- **latex.js limitations**: latex.js does not implement every LaTeX feature. Missing commands degrade gracefully in the preview with an "unresolved macro" marker. They are preserved in the source and will compile correctly in a full TeX installation.
- **Bibliography**: `\bibliography` and `\bibliographystyle` are not processed by latex.js. You can write your bibliography as a `thebibliography` environment, which is supported. For BibTeX/BibLaTeX support, export the `.tex` source and compile locally.
- **Images via \includegraphics**: images must be attached to the note first (via the attachment strip). K-Perception maps `\includegraphics{filename}` to the matching attachment by filename. The path does not need to be absolute; just use the attachment's filename.
- **Custom macros**: `\newcommand` and `\renewcommand` are supported by latex.js and work in the preview.
- **Font commands**: `\textbf`, `\textit`, `\emph`, `\texttt`, `\textsf` and their `\bfseries` / `\itshape` equivalents all work. Custom font declarations via `fontspec` are not supported.
- **Table environments**: `tabular` and `tabularx` work. `longtable` is not supported; use `tabular` split across sections for long tables.
- **Counter manipulation**: `\setcounter` and `\addtocounter` are supported.
- **Verbatim**: `verbatim` and `verbatim*` environments work. The `listings` package provides coloured code listings.

## Platform differences

| Feature | Windows (Electron 28) | Android (Capacitor 6) | Web (PWA) |
|---|---|---|---|
| Source + preview split pane | Yes | No (tab toggle) | Yes |
| Real-time preview | Yes (200 ms debounce) | Yes (500 ms debounce on low-RAM devices) | Yes (200 ms debounce) |
| Export to PDF | Yes | Via export screen | Yes |
| Export to .tex source | Yes | Yes | Yes |
| Unresolved macro markers | Yes | Yes | Yes |
| `\includegraphics` from attachments | Yes | Yes | Yes |
| Hardware keyboard shortcuts | Full | Full when keyboard attached | Full |

## Plan availability

LaTeX mode is available on all plans including the free Local tier. All rendering features (KaTeX, latex.js, real-time preview) and export formats (PDF, .tex source) are available on every plan.

Cloud-dependent features (revision history retention, attachment sync) follow the standard plan limits.

## Permissions and roles

- **Owner / Admin / Editor**: full read/write access; can export.
- **Viewer / Guest**: read-only access to the rendered preview; can view but cannot edit source.

## Security implications

LaTeX rendering runs entirely client-side. latex.js does not make network requests. KaTeX runs synchronously and is deterministic.

LaTeX source does not expose server infrastructure. The source `.tex` content is encrypted like all other note content.

Be aware that `\write18` and other shell-escape commands are not processed by latex.js and are stripped at parse time. There is no risk of shell injection through LaTeX source.

`\url` and `\href` produce clickable links in the preview. Clicking these links opens the URL in the system default browser. Treat URLs in LaTeX notes with the same caution you would apply to links in any other document.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Preview debounce (ms) | Settings → Editor → LaTeX → Preview debounce | Delay before preview re-renders. Default: 200 ms. |
| Show unresolved macro markers | Settings → Editor → LaTeX → Macro markers | Show amber markers in preview for unresolved commands. Default: on. |
| Default paper size | Settings → Editor → LaTeX → Default paper size | A4 or Letter; used when no `\geometry` is declared. Default: A4. |
| Starter template | Settings → Editor → LaTeX → Starter template | Document content inserted when creating a new LaTeX note. |

## Related articles

- [Editor modes overview](overview.md)
- [Markdown editor](markdown.md) — for lighter math needs
- [Editorial editor](editorial.md) — for structured publications with citations
- [Exports](exports.md)
- [Keyboard shortcuts](keyboard-shortcuts.md)
- [Attachments](attachments.md)

## Source references

- `src/shared/types.ts` line 23 — `NoteMode` type includes `"latex"`
- `src/renderer/src/components/` — `LatexEditor` component (CodeMirror + latex.js preview pane)
- `mobile/src/` — `MobileLatexEditor` with tab-toggle preview
