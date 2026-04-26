---
title: "PDF reader"
slug: "pdf-reader"
category: "Editors"
tags: ["pdf", "reader", "viewer", "attachments"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/"
  - "mobile/src/"
related: ["attachments", "sync-and-storage/pdf-import", "exports"]
---

# PDF reader

## What it is

K-Perception includes an integrated PDF viewer powered by **pdfjs-dist 4.10.38** (Mozilla PDF.js). When you click a PDF attachment in the AttachmentStrip, the PDF opens in the inline reader — no external application required. The PDF is decrypted on-device before being passed to the renderer, so the plaintext PDF never leaves the device.

Two components implement this: **PdfReader** (desktop/web) and **MobilePdfReader** (Android).

## When to use it

- Read a research paper, contract, or report attached to a note without switching apps.
- Review a PDF imported via the Android "Open with" intent.
- Annotate a PDF attachment (see limitations below).

## Step by step

1. Attach a PDF to a note (see [Attachments](attachments.md)) or import one via the Android share sheet (see [PDF import](../sync-and-storage/pdf-import.md)).
2. The PDF appears in the **AttachmentStrip** with a thumbnail of the first page.
3. Click/tap the PDF thumbnail to open the inline reader.
4. Navigate pages using:
   - Desktop: the **Previous** / **Next** buttons in the reader toolbar, or `PageUp` / `PageDown` keys.
   - Android: swipe left/right or use the navigation arrows.
5. Adjust zoom with the **+/-** buttons or pinch-to-zoom on Android.
6. To close, click the **×** in the reader header or press `Escape`.

![PDF reader showing a multi-page document](../assets/pdf-reader-1.png)

## Behaviour and edge cases

- **Decryption on open:** The encrypted PDF blob is downloaded from R2 (or read from local cache), decrypted with AES-256-GCM, and passed as a `Blob` URL to pdfjs-dist. The decrypted bytes exist only in memory; they are not written to disk.
- **Large PDFs:** pdfjs-dist uses lazy page loading — only the visible page is rendered at full resolution. Pages outside the viewport are rendered at reduced resolution or deferred. PDFs up to 200 pages render smoothly; very large PDFs (500+ pages) may cause performance degradation on low-end devices.
- **Text selection:** PDF text can be selected and copied using the standard text-selection mechanism. Text copying works only for PDFs with embedded text layers (not scanned image-only PDFs).
- **Annotations:** The reader is read-only. Adding, editing, or saving annotations is not supported in this version [NEEDS-IMPL-DECISION].
- **Password-protected PDFs:** If the PDF itself is password-protected at the file level (separate from K-Perception encryption), pdfjs-dist will prompt for the PDF password before rendering.
- **Unsupported features:** Form fields, JavaScript actions, and 3D content within PDFs are not supported by the embedded viewer.
- **Print:** On desktop (Electron), `Ctrl+P` is not intercepted by the K-Perception main process for the PDF reader — the Electron window does not register a Ctrl+P IPC handler. The OS print dialog is available through the system menu or browser devtools if DevTools are open. To print a PDF attachment, use Export → PDF from the note menu to produce a new PDF file and then print that file with your OS PDF viewer.
- **Search within PDF:** In-document text search depends on the pdfjs-dist version in use (4.10.38). The pdfjs find bar is not explicitly wired to `Ctrl+F` in the current PdfReader component — if the find bar is available, it would be triggered by the browser's default `Ctrl+F` handling inside the iframe/canvas area.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Component | PdfReader | MobilePdfReader | PdfReader |
| Pinch-to-zoom | No (scroll wheel zoom) | Yes | Yes (touch devices) |
| Text selection | Yes | Yes (tap + drag) | Yes |
| Print | OS print dialog | Share → print | Browser print |
| Page navigation | Buttons + PageUp/Down | Swipe + buttons | Buttons + PageUp/Down |

## Plan availability

The PDF reader is available on all plans.

## Permissions and roles

Any user who can read a note can view its PDF attachments. In a workspace, View permission on the note is sufficient.

## Security implications

The PDF blob is encrypted at rest (R2) and in transit (HTTPS). Decryption happens on-device, in memory. The decrypted bytes are passed to the pdfjs renderer via an in-memory `Blob` URL. The Blob URL is revoked (via `URL.revokeObjectURL`) when the reader is closed, releasing the decrypted bytes from memory. The server never receives the decryption key or the plaintext PDF.

## Settings reference

There are no user-configurable settings for the PDF reader.

## Related articles

- [Attachments](attachments.md)
- [PDF import](../sync-and-storage/pdf-import.md)
- [Exports](exports.md)

## Source references

- `src/renderer/src/components/` — PdfReader component
- `mobile/src/` — MobilePdfReader component
