---
title: "Attachments"
slug: "attachments"
category: "Editors"
tags: ["attachments", "files", "images", "audio", "pdf"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/AttachmentStrip.tsx"
  - "private-sync-worker/src/sync.ts"
related: ["voice-recorder", "pdf-reader", "exports", "sync-and-storage/storage-quotas"]
---

# Attachments

## What it is

You can attach files of any type to any note in K-Perception. Attachments are encrypted using AES-256-GCM before upload and stored as binary blobs in Cloudflare R2. Supported types receive special treatment: images display inline, audio files have a built-in playback bar, PDFs open in the integrated viewer, and all other binary files offer a download button.

Attachments appear in a horizontal scrollable strip at the bottom of the editor — the **AttachmentStrip** — so they are always visible without occupying vertical editor space.

## When to use it

- Attach a scanned document to a legal note.
- Drop a photo into a meeting note as visual context.
- Record and attach a voice memo (see [Voice recorder](voice-recorder.md)).
- Attach a PDF to a research note and read it inline (see [PDF reader](pdf-reader.md)).
- Keep a binary file (zip, executable, dataset) alongside the note that documents it.

## Step by step

### Desktop

1. In any editor mode, click the **paperclip icon** in the toolbar or drag a file from your file manager into the editor window.
2. A file-picker dialog appears. Select one or more files (multiple selection supported).
3. The file is encrypted on-device and uploaded to R2. A progress indicator shows in the AttachmentStrip.
4. Once uploaded, the attachment appears in the strip at the bottom of the note.
5. Click an image thumbnail to view it full-size. Click an audio attachment to play it inline. Click a PDF to open the integrated PDF reader. Click any other file type to download it.

### Android

1. Tap the **paperclip icon** in the editor toolbar.
2. Choose from: Camera (take photo), Gallery (pick existing image), Files (file picker). For PDFs received via the Android share sheet, they attach automatically — see [PDF import](../sync-and-storage/pdf-import.md).
3. After selection, the attachment is encrypted and queued for upload.

### Drag and drop (desktop/web)

Drag a file from your desktop directly over the editor area. A blue drop zone appears. Release to attach.

![AttachmentStrip showing image, audio, and PDF attachments](../assets/attachments-1.png)

## Behaviour and edge cases

- **Encryption:** Each attachment is encrypted with a fresh AES-256-GCM key derived from the vault master key (personal notes) or the SK_section-derived key (workspace notes). The key is stored encrypted in the note's metadata blob.
- **Maximum file size:** Limited by your plan's storage quota. There is no explicit per-file maximum (other than the 413 enforcement when quota is exceeded). Large files may take time to encrypt and upload on slow connections.
- **Inline rendering:**
  - **Images:** JPEG, PNG, GIF, WebP, SVG are displayed as thumbnails in the strip and full-size on click.
  - **Audio:** MP3, M4A, WAV, WebM/Opus display a playback bar with play/pause and seek.
  - **PDF:** Opens in the integrated PDF reader (pdfjs-dist).
  - **Other types:** A generic file icon with file name and size. Click downloads the decrypted file to the local device.
- **Quota:** Attachment blobs count against your storage quota. The quota meter in account settings reflects total usage including attachments.
- **Deletion:** Removing an attachment from the note marks the R2 blob reference as deleted in the note's metadata. Blob garbage collection timing is handled by a periodic server-side cleanup task; the exact schedule is not configurable by end users (contact support for data-retention specifics). Until collected, the blob remains encrypted and inaccessible without the note's key.
- **Rename attachment:** You can rename the display name of an attachment without re-uploading. The rename is stored in the note metadata (not the blob key).
- **Offline:** If you add an attachment while offline, it is queued in the sync queue. The note is saved locally with a placeholder reference. When connectivity is restored, the blob is uploaded and the note metadata updated.
- **Collaborative notes:** In a Y.js collab session, attachments are added by one user and visible to all collaborators once synced. Each collaborator decrypts the attachment blob independently.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Attach from file system | Yes (drag-drop + picker) | Yes (Files app) | Yes (file picker) |
| Camera capture | No (desktop has no camera API) | Yes | Yes (browser media) |
| Gallery picker | No | Yes | No |
| PDF inline view | Yes | Yes | Yes |
| Audio inline playback | Yes | Yes | Yes |

## Plan availability

Attachments are available on all plans. Cloud storage of attachments requires a plan with cloud sync (Guardian+). On the Local plan, attachments are stored on-device only.

## Permissions and roles

In a workspace:
- **View** permission: can see and download attachments.
- **Edit** permission: can add and delete attachments.
- **Admin** permission: same as Edit plus can manage attachment ACL if per-file ACL is configured.

## Security implications

Every attachment blob is encrypted with AES-256-GCM before leaving the device. The blob key is wrapped in the note metadata and is only accessible to users who can decrypt the note. The server stores the ciphertext only and cannot read attachment content. Attachment metadata (file name, MIME type, size) is also encrypted as part of the note metadata blob.

## Settings reference

There are no dedicated settings for attachments. Related settings:

| Setting | Default | Location |
|---|---|---|
| Storage quota | Plan-dependent | Account settings → Storage |
| Max simultaneous uploads | Not enforced client-side | Not user-configurable |

## Related articles

- [Voice recorder](voice-recorder.md)
- [PDF reader](pdf-reader.md)
- [Storage quotas](../sync-and-storage/storage-quotas.md)
- [Exports](exports.md)

## Source references

- `src/renderer/src/components/AttachmentStrip.tsx` — attachment strip UI
- `private-sync-worker/src/sync.ts` — blob upload/download routes
- `private-sync-worker/migrations/0001_init.sql` — sync_objects (object_type 'attachment')
