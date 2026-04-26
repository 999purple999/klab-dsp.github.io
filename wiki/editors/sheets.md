---
title: "Sheets editor"
slug: "sheets"
category: "Editors"
tags: ["sheets", "spreadsheet", "formulas", "grid", "csv", "functions"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/shared/types.ts"
  - "src/renderer/src/components/"
related: ["editors-overview", "keyboard-shortcuts", "exports", "revision-history"]
---

## What it is

Sheets mode is a spreadsheet editor built into K-Perception. It presents a 500-column by 52-row grid (extendable in both directions) with a formula bar, multi-sheet tabs, and a custom formula engine that evaluates expressions entirely on your device. All cell data is encrypted before storage in the same way as note content in other modes.

The formula engine supports more than 40 functions across categories: arithmetic, statistical, lookup, text, logical, and date/time. Number formats include currency, percentage, date/time, and scientific notation. Cell formatting supports bold, italic, text colour, background colour, and borders.

Sheets mode is not a feature-equivalent replacement for Microsoft Excel or Google Sheets. It lacks macros, pivot tables, and conditional formatting. It is designed for everyday tabular computation: budgets, trackers, comparison tables, schedules, and logged data where the spreadsheet's output needs to be encrypted and synced alongside your other notes.

## When to use it

Use Sheets mode when:

- You need formulas to compute values across cells — running totals, budgets, grade averages, habit streaks.
- You want data organised as a grid with row and column headers, not as a Markdown or Docs table.
- You are capturing regularly updated data (a weekly log, a monthly budget) and need cross-sheet references to pull values between tabs.
- You want to paste CSV data from another source and edit it without converting to a document format.

Do not use Sheets mode for data that needs pivot tables, macros, charts inside the spreadsheet, or conditional formatting — those features are not implemented. For data that is fundamentally tabular but does not need computation, a table inside a Docs or Editorial note is simpler.

## Step by step

### Navigating the grid

- **Click** any cell to select it.
- **Arrow keys** move the selection one cell at a time.
- **Tab** moves right; **Shift+Tab** moves left.
- **Enter** moves down; **Shift+Enter** moves up.
- **Ctrl/Cmd+Home** jumps to cell A1.
- **Ctrl/Cmd+End** jumps to the last occupied cell.
- **Ctrl/Cmd+Arrow** jumps to the last non-empty cell in that direction.
- **Ctrl/Cmd+G** (or the Name Box at the top-left) — type a cell address (e.g. `C14` or `Sheet2!B3`) and press Enter to navigate there.

### Entering data

1. Select a cell and start typing to enter edit mode. The cell's current value is replaced.
2. Press **F2** or double-click to enter edit mode while preserving the existing content (the cursor is placed at the end).
3. Press **Enter** to confirm and move down, **Tab** to confirm and move right, or **Escape** to cancel without saving.
4. Press **Ctrl/Cmd+Enter** to confirm the entry without moving the selection.

### Writing formulas

All formulas begin with `=`. The formula bar at the top of the editor shows the raw formula of the selected cell; all other cells show the computed value.

```
=SUM(A1:A10)
=AVERAGE(B2:B20)
=IF(C3>100, "Over budget", "OK")
=VLOOKUP(D5, A1:B20, 2, FALSE)
```

Formula auto-complete: as you type inside a formula, the editor suggests function names and displays a tooltip with the function signature and a brief description.

**Cell ranges**: use `:` to denote a range (`A1:A10`). Non-contiguous ranges use `,` (`A1,A3,A5`). Whole columns: `A:A`. Whole rows: `1:1`.

**Cross-sheet references**: reference cells in another sheet tab using the `SheetName!CellRef` syntax:

```
=Sheet2!A1
=SUM(Sheet2!B1:B10)
```

Sheet names that contain spaces must be wrapped in single quotes: `='My Sheet'!A1`.

### Formula function reference

The following functions are implemented in K-Perception's formula engine:

**Mathematical**

| Function | Syntax | Description |
|---|---|---|
| SUM | `SUM(range)` | Sum of all numeric values in range |
| PRODUCT | `PRODUCT(range)` | Product of all values |
| ABS | `ABS(n)` | Absolute value |
| ROUND | `ROUND(n, digits)` | Round to specified decimal places |
| FLOOR | `FLOOR(n, significance)` | Round down to nearest multiple |
| CEILING | `CEILING(n, significance)` | Round up to nearest multiple |
| MOD | `MOD(n, divisor)` | Remainder |
| POWER | `POWER(base, exponent)` | Exponentiation |
| SQRT | `SQRT(n)` | Square root |
| LN | `LN(n)` | Natural logarithm |
| LOG | `LOG(n, base)` | Logarithm with specified base |
| EXP | `EXP(n)` | e raised to power n |
| PI | `PI()` | Value of π |
| RAND | `RAND()` | Random number [0,1) — recalculates on each change |

**Statistical**

| Function | Syntax | Description |
|---|---|---|
| AVERAGE | `AVERAGE(range)` | Arithmetic mean |
| MEDIAN | `MEDIAN(range)` | Median value |
| MIN | `MIN(range)` | Minimum value |
| MAX | `MAX(range)` | Maximum value |
| COUNT | `COUNT(range)` | Count of numeric cells |
| COUNTA | `COUNTA(range)` | Count of non-empty cells |
| COUNTIF | `COUNTIF(range, criterion)` | Count cells matching criterion |
| SUMIF | `SUMIF(range, criterion, sum_range)` | Sum cells where criterion matches |
| STDEV | `STDEV(range)` | Sample standard deviation |
| VAR | `VAR(range)` | Sample variance |
| LARGE | `LARGE(range, k)` | k-th largest value |
| SMALL | `SMALL(range, k)` | k-th smallest value |

**Lookup and reference**

| Function | Syntax | Description |
|---|---|---|
| VLOOKUP | `VLOOKUP(value, range, col, exact)` | Vertical table lookup |
| HLOOKUP | `HLOOKUP(value, range, row, exact)` | Horizontal table lookup |
| INDEX | `INDEX(range, row, col)` | Value at row/col in range |
| MATCH | `MATCH(value, range, type)` | Position of value in range |
| INDIRECT | `INDIRECT(ref_text)` | Reference from text string |
| OFFSET | `OFFSET(ref, rows, cols, height, width)` | Offset reference |
| ROW | `ROW(ref)` | Row number of reference |
| COLUMN | `COLUMN(ref)` | Column number of reference |
| ROWS | `ROWS(range)` | Number of rows in range |
| COLUMNS | `COLUMNS(range)` | Number of columns in range |

**Logical**

| Function | Syntax | Description |
|---|---|---|
| IF | `IF(condition, true_val, false_val)` | Conditional |
| AND | `AND(cond1, cond2, ...)` | Logical AND |
| OR | `OR(cond1, cond2, ...)` | Logical OR |
| NOT | `NOT(cond)` | Logical NOT |
| IFERROR | `IFERROR(value, fallback)` | Return fallback on error |
| IFBLANK | `IFBLANK(value, fallback)` | Return fallback if blank |
| IFS | `IFS(cond1, val1, cond2, val2, ...)` | Multiple conditions |

**Text**

| Function | Syntax | Description |
|---|---|---|
| CONCATENATE | `CONCATENATE(text1, text2, ...)` | Join strings |
| CONCAT | `CONCAT(range)` | Join all values in range |
| LEN | `LEN(text)` | String length |
| UPPER | `UPPER(text)` | Uppercase |
| LOWER | `LOWER(text)` | Lowercase |
| TRIM | `TRIM(text)` | Remove leading/trailing whitespace |
| LEFT | `LEFT(text, n)` | Leftmost n characters |
| RIGHT | `RIGHT(text, n)` | Rightmost n characters |
| MID | `MID(text, start, n)` | Substring |
| FIND | `FIND(needle, haystack, start)` | Position of substring (case-sensitive) |
| SUBSTITUTE | `SUBSTITUTE(text, old, new, n)` | Replace occurrences |
| TEXT | `TEXT(value, format)` | Format value as text |

**Date and time**

| Function | Syntax | Description |
|---|---|---|
| TODAY | `TODAY()` | Current date |
| NOW | `NOW()` | Current date and time |
| DATE | `DATE(year, month, day)` | Create a date value |
| YEAR | `YEAR(date)` | Year component |
| MONTH | `MONTH(date)` | Month component |
| DAY | `DAY(date)` | Day component |
| WEEKDAY | `WEEKDAY(date, return_type)` | Day of week |
| DATEDIF | `DATEDIF(start, end, unit)` | Difference between dates |
| NETWORKDAYS | `NETWORKDAYS(start, end)` | Working days between dates |

### Number formats

Select cells and use the format dropdown in the toolbar:

- **General**: automatic (number, text, date detected by content).
- **Number**: decimal places configurable (0–4).
- **Currency**: prefix currency symbol; comma separator; 2 decimal places. Currency symbol follows the locale set in Settings → Regional.
- **Percentage**: multiplies by 100, appends `%`.
- **Date**: configurable date format string (e.g. `DD/MM/YYYY`, `MM-DD-YY`).
- **Time**: `HH:MM` or `HH:MM:SS`.
- **Date/time**: combined date and time.
- **Scientific**: e.g. `1.23E+04`.
- **Text**: forces cell to display as text regardless of content (useful for leading-zero numbers like postal codes).

### Cell formatting

Select one or more cells and use the toolbar:

- **Bold** (Ctrl/Cmd+B), **Italic** (Ctrl/Cmd+I): applies to cell text.
- **Text colour**: colour picker in toolbar.
- **Background colour**: fill colour picker in toolbar.
- **Borders**: border style selector (all, outer, bottom, none).
- **Alignment**: left, centre, right (horizontal); top, middle, bottom (vertical).
- **Wrap text**: toggle text wrap within the cell.
- **Merge cells**: merge a rectangular selection into a single cell.

### Multi-sheet tabs

Click the **+** button at the bottom of the editor to add a new sheet tab. Double-click a tab to rename it. Right-click a tab to: rename, duplicate, move left/right, or delete.

The first sheet is named "Sheet1" by default. You can rename it. Cross-sheet references update automatically when you rename a sheet.

### Pasting CSV data

Copy CSV text from any source (another spreadsheet, a text file, a download). In Sheets mode, paste with Ctrl/Cmd+V. The clipboard parser detects CSV content (comma or tab-separated) and places values into cells starting at the currently selected cell.

### Exporting

Click the three-dot note menu → **Export** or press Ctrl/Cmd+Shift+E.

- **CSV**: exports the currently visible sheet as a UTF-8 CSV file. Multi-sheet notes export each sheet as a separate CSV file (downloaded as a zip on desktop).
- **KPX**: encrypted portable format including all sheets and metadata.

## Behaviour and edge cases

- **Circular references**: a formula that directly or indirectly references its own cell produces a `#CIRCULAR` error. K-Perception does not support iterative calculation.
- **Error values**: standard spreadsheet error codes are implemented: `#DIV/0!`, `#N/A`, `#NAME?`, `#NULL!`, `#NUM!`, `#REF!`, `#VALUE!`.
- **Case insensitivity**: function names are case-insensitive (`sum` and `SUM` are the same).
- **String literals in formulas**: wrap in double quotes: `=IF(A1="yes", 1, 0)`.
- **Boolean literals**: `TRUE` and `FALSE` are recognised keywords.
- **Grid extension**: the grid starts at 500 columns × 52 rows. To add more rows, scroll to the last row and press Tab in the last cell; a new row is appended. Additional columns are added by clicking the **+** column header at the right edge.
- **Macros**: not implemented. [NEEDS-IMPL-DECISION]
- **Pivot tables**: not implemented. [NEEDS-IMPL-DECISION]
- **Conditional formatting**: not implemented. [NEEDS-IMPL-DECISION]
- **Charts**: Sheets mode does not generate charts. For chart needs, use the Gantt or Timeline views in the Workspace calendar surface, or embed a Mermaid diagram in a Markdown note.

## Platform differences

| Feature | Windows (Electron 28) | Android (Capacitor 6) | Web (PWA) |
|---|---|---|---|
| Full 500×52 grid | Yes | Reduced (scrollable) | Yes |
| Formula bar | Yes | Compact formula bar | Yes |
| Multi-sheet tabs | Yes | Yes (horizontal scroll) | Yes |
| Keyboard navigation | Full | Tap to navigate | Full |
| CSV paste | Yes | Via clipboard | Yes |
| Cell formatting | Full | Bold/italic/colour only | Full |
| Merge cells | Yes | No | Yes |
| Export to CSV | Yes | Yes (share sheet) | Yes |
| Auto-complete in formulas | Yes | Yes | Yes |

## Plan availability

All Sheets features are available on all plans. There are no plan-based restrictions on grid size, number of sheets, formula functions, or number formats.

## Permissions and roles

- **Owner / Admin / Editor**: full grid editing; can add/delete sheets; can export.
- **Viewer / Guest**: read-only; formulas are evaluated and results shown; grid is not editable.

## Security implications

All cell values, formulas, and sheet names are stored as part of the note body and encrypted with AES-256-GCM before storage. An observer of raw storage sees only ciphertext; cell formulas and values are not extractable without the decryption key.

Formula evaluation is deterministic and runs on-device. No cell data is sent to any server for computation.

`RAND()` and `NOW()`/`TODAY()` produce values based on the local system random number generator and local clock. They do not call external services.

## Settings reference

| Setting | Location | Description |
|---|---|---|
| Default sheet name | Settings → Editor → Sheets → Default sheet name | Name given to the first sheet in new Sheets notes. Default: Sheet1. |
| Row count | Settings → Editor → Sheets → Default row count | Starting row count for new sheets. Default: 52. |
| Column count | Settings → Editor → Sheets → Default column count | Starting column count for new sheets. Default: 500. |
| Regional currency symbol | Settings → Regional → Currency symbol | Symbol prepended in currency format. Default: follows OS locale. |
| Date format | Settings → Regional → Date format | Default date format for DATE display. Default: DD/MM/YYYY. |
| Decimal separator | Settings → Regional → Decimal separator | Period or comma. Default: follows OS locale. |

## Related articles

- [Editor modes overview](overview.md)
- [Keyboard shortcuts](keyboard-shortcuts.md)
- [Exports](exports.md)
- [Revision history](revision-history.md)

## Source references

- `src/shared/types.ts` line 23 — `NoteMode` includes `"sheets"`
- `src/renderer/src/components/` — `SheetsEditor`, formula engine
- `mobile/src/` — `MobileSheetsEditor`
