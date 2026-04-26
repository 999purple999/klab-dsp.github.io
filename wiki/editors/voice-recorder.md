---
title: "Voice recorder"
slug: "voice-recorder"
category: "Editors"
tags: ["voice", "audio", "recording", "attachments"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - "mobile/src/"
  - "private-sync-worker/migrations/0027_channel_voice_blob.sql"
related: ["attachments", "sync-and-storage/storage-quotas", "workspaces/channels"]
---

# Voice recorder

## What it is

The built-in voice recorder lets you record audio memos and attach them directly to a note or send them as voice messages in workspace channels. Recordings are encrypted with AES-256-GCM before storage and upload. The feature works in two contexts: as a note attachment (available in all editor modes) and as a channel voice message in workspaces.

## When to use it

- Dictate a quick thought while your hands are occupied.
- Record a meeting summary directly into the relevant project note.
- Leave an audio comment on a workspace channel message.
- Capture field observations (audio diary) when typing is impractical.

## Step by step

### Recording a note attachment

**Desktop:**
1. Open any note.
2. Click the **microphone icon** in the attachment toolbar.
3. Grant microphone permission if prompted (first time only).
4. The recording starts immediately. A recording indicator (elapsed time + waveform) appears.
5. Click **Stop** (square icon) to end the recording.
6. The recorded audio is encrypted and added to the AttachmentStrip. Play it back with the inline audio player.

**Android:**
1. Tap the **microphone icon** in the editor toolbar.
2. Grant microphone permission if prompted.
3. Tap the record button. Recording begins.
4. Tap **Stop** to end. The file is encrypted and queued for upload.

### Sending a voice message in a channel

1. Open a workspace channel.
2. Tap/click the **microphone icon** in the message input bar.
3. Hold to record (push-to-talk style) or toggle record/stop.
4. The voice blob is encrypted with the channel's section key and uploaded to R2 (migration `0027_channel_voice_blob.sql`).
5. The message appears in the channel with an audio player.

![Voice recorder active in note editor](../assets/voice-recorder-1.png)

## Behaviour and edge cases

- **Audio format:** The recorder uses `MediaRecorder` with a preferred MIME type of `audio/webm;codecs=opus` (falling back to `audio/webm`, then `audio/ogg;codecs=opus`, then the browser default) at 32 kbps. The actual format depends on what the browser/Electron WebView supports; on most platforms this resolves to WebM/Opus. The resolved MIME type is stored in the attachment metadata. On Android, Capacitor exposes the same Web API — the format is determined by the Android WebView's `MediaRecorder` support, which typically produces WebM/Opus as well; M4A is not explicitly requested.
- **Maximum recording length:** Limited only by available device storage and upload quota. There is no hard cap, but recordings longer than 2 hours are not recommended.
- **Encryption:** The audio blob is encrypted with AES-256-GCM using the same key derivation as other attachments. No plaintext audio is ever transmitted to the server.
- **Playback:** The inline audio player supports play/pause only. Seeking, volume control beyond the OS level, and playback speed control are not implemented in the current component — the player is a simple toggle-play/pause button backed by the Web `Audio` API.
- **Waveform visualisation:** The current desktop/web VoiceRecorder component does not display a real-time waveform during recording; only an elapsed-time counter is shown. The attachment strip shows a play/pause button, duration, and timestamp — no waveform thumbnail is generated.
- **Permission denied:** If you deny microphone permission, the recorder is disabled. On Android, you must go to Settings → Apps → K-Perception → Permissions to re-enable it. On desktop (Electron), re-enable in the OS privacy settings.
- **Background recording (Android):** Recording stops if the app goes into the background (OS constraint). The partial recording up to that point is saved.
- **Channel voice messages:** Voice messages in channels are stored as R2 blobs keyed by the channel_voice_blob schema (migration `0027`). They are not note attachments — they exist only in the channel context.
- **Offline recording:** Audio is captured and stored locally even without connectivity. The encrypted blob is queued in the sync queue and uploaded when online.

## Platform differences

| Feature | Windows | Android | Web |
|---|---|---|---|
| Recording format | WebM/Opus (browser default) | WebM/Opus (WebView MediaRecorder default) | WebM/Opus (browser default) |
| Microphone access | OS privacy settings | Android permissions | Browser permission |
| Background recording | App must stay focused | Stops on background | Tab must stay active |
| Push-to-talk (channels) | Click to toggle | Hold-to-talk | Click to toggle |
| Waveform display | Yes | Yes | Yes |

## Plan availability

Voice recording is available on all plans. Cloud upload (so recordings sync across devices) requires Guardian or higher. On the Local plan, recordings are stored on-device only.

## Permissions and roles

In a workspace channel, only members with Edit permission to the channel can send voice messages.

## Security implications

Audio is captured by the microphone, passed directly to the Web Audio API for waveform visualisation (no network), then encrypted in-process with AES-256-GCM before the encrypted bytes are written to the sync queue. The server never receives unencrypted audio. The microphone is active only during the recording — no background audio capture.

## Settings reference

| Setting | Default | Location |
|---|---|---|
| Microphone permission | Prompt on first use | OS privacy settings |
| Default recording format | WebM/Opus (web/desktop), M4A (Android) | Not user-configurable |

## Related articles

- [Attachments](attachments.md)
- [Storage quotas](../sync-and-storage/storage-quotas.md)
- [Channels](../workspaces/channels.md)

## Source references

- `mobile/src/` — mobile voice recorder component
- `private-sync-worker/migrations/0027_channel_voice_blob.sql` — voice blob schema
