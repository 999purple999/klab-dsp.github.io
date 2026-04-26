---
title: "General FAQ"
slug: "faq-general"
category: "FAQ"
tags: ["faq", "general", "encryption", "plans", "editors", "offline", "zero-knowledge"]
audience: "user"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "macos", "android", "web"]
last_reviewed: "2026-04-26"
source_refs:
  - src/shared/plans.ts
  - src/shared/kdf.ts
  - src/main/index.ts
  - src/renderer/src/platform/browserVault.ts
related: ["faq-security", "faq-billing", "platform-overview"]
---

# General FAQ

## Is K-Perception truly zero-knowledge?

**Yes — mathematically, not just contractually.**

Your vault password never leaves your device. All encryption and decryption happen locally. The Cloudflare Worker backend stores only AES-256-GCM ciphertext. K-Perception employees, Cloudflare, and any third party with access to the server infrastructure cannot read your notes — they would only ever see encrypted bytes, and decryption requires your vault key, which is derived locally from your vault password via Argon2id.

This is a mathematical guarantee, not a privacy policy claim.

---

## What happens if I forget my vault password?

If you forget your vault password and do not have a recovery code, **your data cannot be recovered**. This is a direct consequence of zero-knowledge encryption — no one, including K-Perception, can derive your key from the server side.

If you have a **recovery code** (generated when you set up cloud sync), you can use it to regain access. Treat the recovery code as a second vault password and store it securely offline.

---

## What is the difference between my vault password and my account password?

These are separate credentials:

- **Vault password:** Derives your AES-256-GCM encryption key via Argon2id. Never sent to the server. Required to unlock and read your notes on any device.
- **Account password (or Google SSO):** Used to authenticate to the K-Perception backend (for sync, workspaces, collaboration). Managed by the server. Separate from the vault key.

Changing your account password does not change your vault encryption. Changing your vault password re-encrypts the local vault with a new Argon2id-derived key.

---

## How many devices can I use?

Device limits are enforced per plan:

| Plan | Devices |
|---|---|
| Local (free) | 1 |
| Guardian (€3.49/mo) | 3 |
| Vault (€7.99/mo) | 8 |
| Lifetime (€149 one-time) | 8 |
| Team (€6.99/user/mo) | Unlimited |
| Enterprise (€14.99/user/mo) | Unlimited |

---

## Does K-Perception work offline?

Yes. All note reading and editing works offline on every platform. Notes are stored in an encrypted local vault on the device. Changes made offline are queued and pushed to the sync server when connectivity returns.

What requires a network connection: sync push/pull, real-time collaboration, share links, and account sign-in.

---

## Can K-Perception employees read my notes?

No. K-Perception employees have access to the server infrastructure, which stores only AES-256-GCM ciphertext. The encryption key is derived locally from your vault password and never transmitted to the server. Without the vault password, the ciphertext is computationally indistinguishable from random bytes.

---

## What editor modes are available?

K-Perception has 7 editor modes:

1. **Plain** — Simple plaintext editor
2. **Markdown** — Full GFM (GitHub Flavored Markdown) with mermaid diagrams, KaTeX inline math, syntax highlighting, and more
3. **LaTeX** — Full LaTeX document authoring with live KaTeX preview; desktop builds support native compilation (pdflatex/xelatex/lualatex)
4. **Docs** — Rich text document editor (Tiptap-based) with headings, tables, callouts, and figures
5. **Sheets** — Spreadsheet with formula engine, cross-sheet references, and real cell formats
6. **Canvas** — Infinite canvas for freeform diagrams and visual thinking
7. **Editorial** — Publication-grade document mode with citation management, structured figures, CSS page geometry, and preflight checks

---

## Is there a free plan?

Yes. The **Local plan** is free and requires no account. It stores your vault on-device only with AES-256-GCM encryption. There is no cloud sync, no collaboration, no PDF export, and no cross-device access. You get unlimited notes in plain, Markdown, LaTeX, and Docs modes, plus KPX import/export.

---

## What is the Lifetime plan?

The Lifetime plan (€149, one-time payment) gives you everything included in the Vault plan — 8 devices, 50 GB storage, unlimited version history, real-time collaboration — with a single payment and no recurring fees. All future features are included automatically. It also includes a Lifetime supporter badge in the app.

---

## What happens if K-Perception shuts down?

Your encrypted data remains on your device. You can export your vault at any time as a **KPX package** or JSON export. The KPX format is a documented, self-contained encrypted archive that can be imported into a future K-Perception build or decrypted with knowledge of the format specification.

Because encryption is based on open standards (Argon2id + AES-256-GCM), the ciphertext can in principle be decrypted with any compliant cryptography library given the vault password and the KDF parameters stored in the vault envelope.

---

## Does K-Perception support Markdown?

Yes. The Markdown editor supports:
- Full GFM (GitHub Flavored Markdown) — tables, task lists, fenced code blocks with syntax highlighting
- Mermaid diagrams (flowcharts, sequence diagrams, Gantt, etc.)
- KaTeX inline and block math (`$...$` and `$$...$$`)
- Footnotes, strikethrough, subscript, superscript
- Table of Contents generation
- Find & Replace
- Drag-and-drop image attachment
- Zen mode (distraction-free full-screen)

---

## Can I collaborate in real-time?

Yes, on the **Vault plan and above**. Real-time collaboration uses **Y.js CRDT** relayed through a **DocRoom Durable Object** on the Cloudflare Worker. All collaboration is end-to-end encrypted — the server relays encrypted Y.js updates without decrypting them. Cursor presence shows collaborators' positions in the document.

---

## Is K-Perception open source?

No, the application code is not open source. However, the cryptographic primitives are based entirely on open standards and well-audited open-source libraries: Argon2id from `@noble/hashes`, AES-256-GCM from the Web Crypto API / Node.js `crypto`, Y.js for CRDT, and the SAML/SCIM/OIDC protocols for enterprise identity.

---

## Can I import from Notion, Obsidian, or Evernote?

- **KPX:** K-Perception's native import/export format. Full round-trip fidelity.
- **Plain text and Markdown (.txt, .md):** Import supported on all platforms via "Import notes".
- **Notion / Obsidian / Evernote:** Direct import from these services is not confirmed; check the import UI for currently supported formats, or contact support@kperception.com for details.

---

## What is a KPX file?

A `.kpx` file is a K-Perception Encrypted Bundle — a self-contained export package containing your notes (and optionally attachments) encrypted with a password you choose at export time. It is the recommended format for backups and migration. The main process treats it as an opaque blob; only the renderer builds and optionally encrypts the package, so the main process never sees the export password.

---

## How do I change my vault password?

Go to **Settings → Security → Change Vault Password**. Entering the new password re-encrypts the local vault with a freshly-generated Argon2id key. The old password is no longer valid after this operation. If biometric unlock is enabled on Android, the stored hint is also re-encrypted with the new password.

---

## What is version history?

Version history saves a copy of a note each time it is saved (subject to plan limits). Guardian plan retains 30 days of revisions; Vault and Lifetime retain all revisions indefinitely. Revisions are stored encrypted in the vault alongside the current note content.

---

## Can I use K-Perception without an account?

Yes. The **Local plan** requires no account. You create a vault password on first launch and all notes are stored locally with no server communication.

An account is required for cloud sync (Guardian+), workspaces (Guardian+), and collaboration (Vault+).

---

## Is there a mobile app?

Yes. K-Perception for **Android** is available as a native app built on Capacitor 6. iOS support is not confirmed at this time; contact support@kperception.com for current platform availability.

---

## Does K-Perception support voice notes?

Voice recording is supported in workspace contexts on desktop. The main process grants `media` (microphone) permission for the renderer window. Voice messages are stored as encrypted attachments in the workspace. On Android, voice recording is also supported via the quick-capture widget and inline recorder. Web PWA voice note support may vary by browser; contact support@kperception.com for details.

---

## What is reading time?

The Markdown editor displays an estimated reading time based on the note's word count. This is a local calculation — no content is sent to the server.

---

## How do I export a note as PDF?

On **desktop** (Windows, macOS, Linux): open the note, click the export button, and choose PDF. The export uses Electron's `printToPDF` with KaTeX rendering.

On **web / PWA**: PDF export is not available. Export as HTML and use the browser's Print → Save as PDF instead.

On **Android**: PDF export is not available. HTML export is available.
