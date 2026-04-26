---
title: "Canvas editor"
slug: "canvas"
category: "Editors"
tags: ["canvas", "drawing", "freehand", "svg", "png", "bezier", "sketching"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/types.ts"
  - "src/renderer/src/components/"
related: ["editors-overview", "attachments", "exports", "keyboard-shortcuts", "revision-history"]
---

## What it is

Canvas mode is a freehand drawing editor that gives you a blank infinite-scroll surface where you can draw, sketch, annotate, and create diagrams using pointer input. On Windows and the web, you use a mouse or stylus. On Android, you draw with your finger or a stylus.

The drawing engine applies Bézier curve smoothing to every stroke: raw pointer coordinates are processed through a cubic Bézier fitting algorithm before they are committed as paths. This produces smooth, natural-looking lines from imprecise mouse or finger movement. The result is cleaner than raw polyline rendering without requiring a drawing tablet.

Canvas mode includes a set of shape tools (rectangle, circle/ellipse, line, arrow), a text annotation tool, an eraser, colour and stroke-width controls, and an unlimited undo/redo stack. Finished canvases can be exported as PNG (raster) or SVG (vector).

## When to use it

Use Canvas mode when:

- You need to draw a rough architecture diagram, flowchart, or network diagram and do not need structured diagram syntax (for structured diagrams, use Mermaid in Markdown mode).
- You are sketching a wireframe, screen layout, or UI prototype.
- You want to draw a mind map with free-form connections.
- You need a visual scratchpad to think through a problem spatially.
- You are annotating a concept with handwritten labels.
- You want freehand notes that look like handwriting rather than typed text.

Canvas mode is not the right choice for precise technical drawings that require exact measurements, snap-to-grid geometry, or parametric shapes. For those, use an external CAD or design tool and attach the exported image.

## Step by step

### Tools overview

The toolbar appears on the left side (desktop/web) or at the bottom (mobile). Tools are selected by clicking/tapping.

| Tool | Icon | Shortcut | Description |
|---|---|---|---|
| Pen/brush | Pen | P | Freehand Bézier-smoothed stroke |
| Eraser | Eraser | E | Erase strokes by painting over them |
| Rectangle | Square | R | Draw rectangle shapes |
| Circle/ellipse | Circle | C | Draw ellipse shapes |
| Line | Line | L | Draw straight lines |
| Arrow | Arrow | A | Draw straight lines with arrowhead |
| Text annotation | T | T | Click to place editable text labels |
| Selection | Arrow pointer | S or Escape | Select, move, and resize elements |
| Pan | Hand | H or Space (hold) | Pan the canvas without drawing |

### Drawing freehand strokes

1. Select the Pen tool (P).
2. Click and drag (desktop/web) or touch and drag (mobile) to draw.
3. Release to complete the stroke. The Bézier smoothing algorithm processes the stroke and replaces the raw path with a smooth curve.
4. The stroke uses the currently selected colour and stroke width.

**Stroke width**: adjust with the width slider in the toolbar (1 px to 32 px).

**Colour**: click the colour swatch to open the colour picker. You can enter a hex code, use the HSL sliders, or pick from the 16-colour quick palette.

### Drawing shapes

1. Select the Rectangle, Circle, Line, or Arrow tool.
2. Click and drag to define the shape.
3. For rectangles and ellipses, hold **Shift** while dragging to constrain to a square or circle.
4. For lines and arrows, hold **Shift** to snap to 45-degree angle increments.

### Text annotations

1. Select the Text tool (T).
2. Click anywhere on the canvas to place a text box.
3. Type your text. The text box expands to fit.
4. Click outside the text box to deselect it. The text is committed as a canvas element.
5. To edit text, select the Selection tool, double-click the text element.

Text annotations use the currently selected colour and a font size that can be adjusted in the toolbar (12 px to 72 px). The font is the system sans-serif font.

### Selecting, moving, and resizing elements

1. Select the Selection tool (S or Escape).
2. Click any element to select it. A blue bounding box appears.
3. Drag the selected element to move it.
4. Drag the corner handles of the bounding box to resize. Shift-drag to maintain aspect ratio.
5. Click and drag on empty canvas to draw a selection rectangle; all elements inside are selected.
6. **Ctrl/Cmd+A** selects all elements.
7. **Delete** or **Backspace** deletes selected elements.
8. **Ctrl/Cmd+D** duplicates selected elements in place (offset by 8 px).

### Undo and redo

**Ctrl/Cmd+Z** undoes the last action. **Ctrl/Cmd+Shift+Z** (or Ctrl+Y on Windows) redoes. The undo stack is session-local (not persisted across reloads; use revision history for persistent snapshots).

The undo stack is unlimited within a session.

### Panning and zooming

- **Pan**: hold **Space** and drag, or select the Pan tool (H) and drag.
- **Zoom in**: Ctrl/Cmd+= or scroll up with Ctrl held.
- **Zoom out**: Ctrl/Cmd+- or scroll down with Ctrl held.
- **Reset zoom**: Ctrl/Cmd+0 resets to 100%.
- **Fit to content**: Ctrl/Cmd+Shift+0 zooms and pans to show all content.

On mobile, pinch to zoom and two-finger drag to pan.

### Erasing

1. Select the Eraser tool (E).
2. Draw over any part of a stroke to erase it. The eraser works at the stroke level: if you paint over part of a stroke, the entire stroke segment under the eraser is removed.

For precise erasing, decrease the eraser size using the width slider.

### Exporting

1. Click the three-dot note menu → **Export** or press **Ctrl/Cmd+Shift+E**.
2. Choose **PNG** or **SVG**.
3. **PNG export**: raster image at the canvas's current logical resolution. Set the pixel density multiplier (1×, 2×, 4×) in the export dialog. At 2× (recommended for retina displays), the image is exported at double the screen resolution.
4. **SVG export**: vector export. All strokes, shapes, and text annotations are encoded as SVG elements. The SVG is self-contained and can be opened in any SVG-capable viewer or imported into a vector editing tool.

For both formats, you can choose to export the full canvas (all content) or only the visible viewport.

## Behaviour and edge cases

- **Bézier smoothing algorithm**: the smoothing uses a least-squares cubic Bézier fitting approach with a configurable tolerance. Higher tolerance produces smoother but less accurate curves; lower tolerance preserves more of the raw input. The default tolerance is calibrated for mouse input. Stylus input on Windows Ink-capable devices produces more accurate smoothing because pressure data is also available.
- **Performance at high stroke counts**: the canvas uses a tiled rendering system to avoid re-rendering the entire canvas on every frame. At stroke counts above approximately 5,000, pan and zoom interactions may show brief lag on older devices. Exporting to SVG with very high stroke counts (10,000+) may be slow.
- **Multi-page support**: multi-page canvas is not currently implemented. A single canvas note represents one infinite-scroll page.
- **Canvas size**: the canvas is conceptually infinite. Content can be placed at any coordinate. The practical limit is determined by device memory.
- **Touch palm rejection**: on Android with a stylus, palm rejection is handled by the OS stylus API. Capacitor exposes the PointerEvent `pointerType` field; only `stylus` events are treated as drawing input when a stylus is detected.
- **Copy and paste**: you can copy selected elements within the same canvas (**Ctrl/Cmd+C** then **Ctrl/Cmd+V**). Cross-note canvas element copy/paste is not supported; use Export → PNG or SVG instead.
- **Grid/snap**: a background grid and snap-to-grid feature are available in Settings → Editor → Canvas. Grid is off by default.

## Platform differences

| Feature | Windows (Electron 28) | Android (Capacitor 6) | Web (PWA) |
|---|---|---|---|
| Freehand drawing | Mouse and stylus | Touch and stylus | Mouse and stylus |
| Bézier smoothing | Yes | Yes | Yes |
| Pressure sensitivity | Yes (Windows Ink) | Depends on stylus | No |
| Palm rejection | Windows Ink handles it | OS stylus API | No |
| Shape tools | Full | Full | Full |
| Text annotations | Full | Full | Full |
| Pinch to zoom | No (Ctrl+scroll) | Yes | No (Ctrl+scroll) |
| Two-finger pan | No | Yes | No |
| PNG export | Yes | Yes (share sheet) | Yes |
| SVG export | Yes | Yes | Yes |
| Toolbar position | Left sidebar | Bottom bar | Left sidebar |

## Plan availability

Canvas mode is available on all plans. All drawing tools, shape tools, text annotations, and both export formats are available on every plan.

## Permissions and roles

- **Owner / Admin / Editor**: full drawing access; can export.
- **Viewer / Guest**: the canvas is displayed as a static image (rendered at current zoom); drawing tools are disabled.

## Security implications

Canvas content is stored as a JSON document describing the set of strokes, shapes, and text elements (not as a raster image). This JSON is encrypted with AES-256-GCM before storage.

When you export to PNG or SVG, the rendered image is generated client-side. No canvas data is sent to a server during export.

Text annotations are stored as plaintext strings within the canvas JSON. They are encrypted as part of the note body. If you write sensitive text in a canvas annotation (rather than in a text-mode note), it is equally secure — but be aware that text in exported PNG or SVG files is readable by anyone who has the exported file.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Bézier smoothing tolerance | Settings → Editor → Canvas → Smoothing | Tolerance value for stroke smoothing (0.1–5.0). Default: 1.0. |
| Background grid | Settings → Editor → Canvas → Grid | Show a dot-grid or line-grid background. Default: off. |
| Snap to grid | Settings → Editor → Canvas → Snap | Snap shapes and moved elements to grid. Default: off. |
| Grid size | Settings → Editor → Canvas → Grid size | Grid cell size in pixels. Default: 20 px. |
| Default stroke width | Settings → Editor → Canvas → Default stroke | Initial stroke width for new canvas notes. Default: 2 px. |
| Default colour | Settings → Editor → Canvas → Default colour | Initial drawing colour. Default: #000000 (black). |
| High-DPI PNG export | Settings → Editor → Canvas → Export DPI | Default pixel density for PNG export: 1×, 2×, 4×. Default: 2×. |

## Related articles

- [Editor modes overview](overview.md)
- [Attachments](attachments.md)
- [Exports](exports.md)
- [Keyboard shortcuts](keyboard-shortcuts.md)
- [Revision history](revision-history.md)

## Source references

- `src/shared/types.ts` line 23 — `NoteMode` includes `"canvas"`
- `src/renderer/src/components/` — `CanvasEditor` component
- `mobile/src/` — `MobileCanvasEditor` with touch and stylus input handling
