---
title: "PDF import"
slug: "pdf-import"
category: "Sync & Storage"
tags: ["pdf", "import", "android", "intent"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["android", "windows", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "mobile/src/platform/mobileExport.ts"
  - "mobile/src/platform/vaultAdapter.ts"
related: ["editors/pdf-reader", "editors/attachments", "getting-started/install-android"]
---

# PDF import

## What it is

PDF import lets you send a PDF file from another Android app directly into K-Perception using the standard Android "Open with" / share sheet mechanism. When you open a PDF in K-Perception, the app creates a new note, attaches the PDF as an encrypted blob, and (where possible) inserts the extracted text content into the note body.

## When to use it

- You receive a PDF in WhatsApp, Gmail, or a browser and want to annotate or summarise it in K-Perception.
- You have a local PDF on your device you want to archive with your notes.
- You want to read and reference a PDF document without leaving the K-Perception vault.

## Step by step

### From the Android share sheet

1. In any app (email client, browser, file manager), open or locate a PDF file.
2. Tap the **Share** button and select **Open with K-Perception** (or **K-Perception** in the share sheet).
3. If K-Perception is not already open, it launches. If your vault is locked, unlock it first.
4. A new note is automatically created in your current default folder.
5. The PDF file is attached to the note as an encrypted blob (visible in the AttachmentStrip).
6. If pdfjs-dist can extract text from the PDF, the extracted text is inserted into the note body.
7. You are taken to the new note, ready to view, annotate, or edit.

### From the K-Perception file picker (manual)

1. Open K-Perception and navigate to any note or create a new one.
2. Tap the **paperclip** icon in the editor toolbar.
3. Choose **Files** → navigate to your PDF.
4. The PDF is attached. See [Attachments](../editors/attachments.md).

### Desktop (drag and drop)

On Windows, drag a PDF file from File Explorer onto the K-Perception editor window. It is attached and optionally imported (text extraction). Not confirmed in current source — contact support for confirmation.

![Android share sheet with K-Perception as a target](../assets/pdf-import-1.png)

## Behaviour and edge cases

- **Text extraction:** pdfjs-dist attempts to extract the text layer from the PDF. PDFs that contain embedded text (most modern PDFs) yield readable extracted text. Scanned image-only PDFs produce no text — only the blob attachment is created.
- **Page limit for text extraction:** Very large PDFs (500+ pages) may time out on text extraction. Not confirmed in current source — contact support for confirmation of any specific page extraction limit.
- **Encryption:** The PDF blob is encrypted with AES-256-GCM immediately on receipt, before being written to the local store or uploaded to R2.
- **Vault locked:** If your vault is locked when the share intent arrives, K-Perception shows the unlock screen. After unlocking, the PDF import completes automatically.
- **Unsupported PDF:** If pdfjs-dist cannot parse the PDF (corrupted, DRM-protected, non-standard encoding), the file is still attached as a binary blob. The note body remains empty.
- **Duplicate imports:** Importing the same PDF twice creates two separate note+attachment pairs. There is no deduplication.
- **Large PDFs:** PDFs larger than your available quota trigger the 413 enforcement. The note is created without the attachment.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Share sheet / "Open with" | No | Yes (AndroidManifest intent filter) | No |
| Drag-and-drop import | Not confirmed in current source | No | Yes |
| Text extraction | Yes | Yes | Yes |
| Auto-create note | Yes | Yes | Yes |

## Plan availability

PDF import is available on all plans. On the Local plan, the PDF is stored on-device only (no cloud upload).

## Permissions and roles

No permission restrictions for personal vault imports. In a workspace context, the note is created in the workspace's files section (if configured).

## Security implications

The PDF blob is encrypted on-device before any persistence or upload. The text extracted from the PDF is treated as note content and encrypted as part of the note blob. The Android share intent delivers the PDF file path/URI to K-Perception — no other app sees the imported content once K-Perception processes it.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Default import folder | Last active folder | Not configurable |
| Auto-extract text from PDFs | Enabled | Not user-configurable |

## Related articles

- [PDF reader](../editors/pdf-reader.md)
- [Attachments](../editors/attachments.md)
- [Install on Android](../getting-started/install-android.md)

## Source references

- `mobile/src/platform/mobileExport.ts` — Android share intent handler
- `mobile/src/platform/vaultAdapter.ts` — vault write after import
