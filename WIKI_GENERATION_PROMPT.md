# K-Perception Wiki Generation — Hyper-Prompt for Claude Code

> **Paste this prompt into a fresh Claude Code session running inside the K-Perception monorepo.**
> Claude Code must have full read access to: the Electron app, the Capacitor Android app, the Cloudflare Worker backend (D1 migrations + route handlers), the share-viewer Pages app, the admin SPA, the CLI tools (`kp-ws`, `kp-admin`), and the source of `project_blueprint.md`.
>
> The goal is to produce a **completely exhaustive, production-grade reference wiki** that documents *every single feature, surface, behaviour, and configuration knob* of K-Perception. Every reasonable user question — from "how do I install?" to "how does SCIM Group sync resolve member conflicts during a SAML reauth?" — must be answerable from this wiki without reading the source.

---

## Mission

Produce a `wiki/` folder of **rigorously cross-referenced Markdown files** that:

1. Documents every user-facing feature with exact behaviour, edge cases, error states, and platform differences.
2. Documents every admin/Enterprise capability with concrete IdP setup walkthroughs (Okta, Azure AD, Google Workspace, OneLogin) and the *exact* attribute mappings.
3. Documents every cryptographic primitive with NIST references, byte-level layouts, and threat-model coverage tables.
4. Documents every backend route, Durable Object protocol, D1 schema column, and migration ordering — at a level where a senior engineer could rebuild the system from the docs alone.
5. Documents every CLI flag and JSON response shape.
6. Provides legally airtight Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use Policy, Refund Policy, DPA, BAA reference summary, and subprocessor list — written defensively, clause-by-clause, with explicit risk-allocation language.
7. Delivers a deeply searchable FAQ (≥ 80 Q&A entries) covering everything from "I forgot my password" to "Does revoking a SCIM Group instantly delete the wrapped WDK from R2?"

**Nothing may be vague. Nothing may be invented. If a behaviour is undefined in the codebase, document it as undefined and flag the file as `[NEEDS-IMPL-DECISION]` at the top.**

---

## Working method

Before writing any content, perform this scan in this exact order:

1. **Read `project_blueprint.md` end to end** — it is the canonical feature inventory.
2. **Enumerate every D1 migration in order** (`backend/migrations/*.sql` or equivalent). For each migration, write down: (a) what columns/tables it adds, (b) what semantic capability it enables. This is your authoritative schema timeline.
3. **Enumerate every Worker route handler** (`backend/src/routes/*.ts` or equivalent). For each: HTTP method, path, auth requirement, request body shape, response shape, status codes, side effects.
4. **Enumerate every Durable Object class.** For each: input messages, output messages, state shape, lifecycle events, eviction behaviour.
5. **Enumerate every cryptographic call site** (search for `crypto.subtle`, `encrypt`, `decrypt`, `deriveKey`, `wrapKey`, `importKey`). For each: purpose, key origin, IV handling, AAD handling, error mode.
6. **Enumerate every TipTap extension, CodeMirror mode, and editor command.** For each: keyboard shortcut, slash-command name, accepted input, produced output.
7. **Enumerate every Capacitor plugin invocation** (biometric, share intent, push, etc.). For each: permission required, fallback behaviour when denied.
8. **Enumerate every Stripe webhook event handled.** For each: SQL writes, side effects, idempotency strategy.
9. **Enumerate every CLI subcommand and flag** (`kp-ws --help`, `kp-admin --help`, recursively).
10. **Enumerate every settings panel, admin tab, and modal in the UI.** For each: every input, every default, every persistence target.

Only after this scan is complete may you begin writing. While writing, *every* claim must be backed by either a code reference (`backend/src/routes/share.ts:142`) or a blueprint quote.

---

## Output structure

Write files into `wiki/` with this layout. Filenames are slug-cased and must match exactly so the SPA loader can resolve them.

```
wiki/
├── _index.json                       # Auto-generated TOC — see schema below
├── _search.json                      # Pre-built lunr-style search index
│
├── getting-started/
│   ├── overview.md                   # What is K-Perception?
│   ├── install-windows.md
│   ├── install-android.md
│   ├── web-pwa.md
│   ├── first-vault.md
│   ├── account-and-login.md
│   ├── choosing-a-plan.md
│   └── upgrading-and-billing.md
│
├── editors/
│   ├── overview.md                   # All seven modes at a glance
│   ├── plain-text.md
│   ├── markdown.md
│   ├── latex.md
│   ├── docs.md                       # TipTap-based rich text
│   ├── sheets.md                     # Formula engine, full function reference
│   ├── canvas.md
│   ├── editorial.md                  # Citations, preflight, page geometry
│   ├── command-palette.md
│   ├── slash-commands.md             # Every slash command, every editor
│   ├── keyboard-shortcuts.md         # Full shortcut matrix per platform
│   ├── revision-history.md
│   ├── attachments.md
│   ├── voice-recorder.md
│   ├── pdf-reader.md
│   └── exports.md                    # Every format, every option
│
├── organization/
│   ├── tags.md
│   ├── folders.md
│   ├── collections.md                # Board / Gallery / Calendar / List
│   ├── knowledge-graph.md            # Force-directed + clustering + LLM refine
│   ├── search.md
│   ├── pinning.md
│   ├── trash-and-purge.md
│   ├── spaces.md                     # EncryptedSpaceGate
│   └── quick-capture.md              # Widget + deep links
│
├── sync-and-storage/
│   ├── offline-first.md
│   ├── sync-queue.md
│   ├── pull-polling.md
│   ├── cross-device.md
│   ├── merge-conflicts.md            # Visual merge modal flow
│   ├── storage-quotas.md
│   ├── 413-enforcement.md
│   ├── kpx-format.md                 # Byte-level KPX spec
│   └── pdf-import.md                 # Android intent pipeline
│
├── sharing/
│   ├── share-links.md
│   ├── permissions.md                # View / Comment / Edit
│   ├── password-protection.md
│   ├── revocation.md
│   ├── comments.md
│   └── share-viewer.md               # kperception-share.pages.dev
│
├── collaboration/
│   ├── realtime-yjs.md               # End-to-end CRDT walkthrough
│   ├── docroom-protocol.md           # Wire-level protocol spec
│   ├── awareness-and-presence.md
│   ├── reconnect-backoff.md
│   ├── version-snapshots.md
│   ├── mobile-collab-editor.md
│   └── deep-link-routing.md
│
├── workspaces/
│   ├── overview.md
│   ├── creating-a-workspace.md
│   ├── sections.md                   # SK_section derivation
│   ├── channels.md                   # Threads + voice messages
│   ├── files-and-directories.md      # Per-blob DEK chain
│   ├── file-versioning.md
│   ├── per-file-acl.md
│   ├── shared-with-me.md
│   ├── calendar.md
│   ├── gantt.md
│   ├── citations.md
│   ├── presence.md
│   ├── members-and-roles.md
│   ├── groups.md                     # SK_group resolver
│   ├── invitations.md                # Email + link + bulk + quorum
│   ├── webhooks.md                   # Event catalogue + signing
│   ├── api-keys.md                   # Scopes + rotation
│   ├── admin-console.md              # All 8 tabs
│   ├── backup-restore.md
│   └── transfer-ownership.md
│
├── enterprise/
│   ├── overview.md
│   ├── company-shell.md              # Multi-workspace company
│   ├── ip-allowlist.md
│   ├── mfa-enforcement.md
│   ├── domain-restriction.md
│   ├── saml-okta.md                  # Step-by-step Okta walkthrough
│   ├── saml-azure-ad.md
│   ├── saml-google-workspace.md
│   ├── saml-onelogin.md
│   ├── scim-overview.md
│   ├── scim-okta.md
│   ├── scim-azure-ad.md
│   ├── scim-groups.md                # Bidirectional sync semantics
│   ├── oidc.md
│   ├── gdpr-deletion.md              # End-to-end deletion flow
│   ├── audit-log.md                  # Every event type catalogued
│   ├── compliance-tab.md
│   ├── elevation-tokens.md
│   ├── remote-wipe.md
│   ├── rotate-key.md                 # Pending-wrap retry semantics
│   └── dangerous-ops.md              # TOTP step-up matrix
│
├── security/
│   ├── overview.md
│   ├── threat-model.md               # Adversary capabilities tabulated
│   ├── pbkdf2.md                     # Iteration count history & rationale
│   ├── aes-gcm.md                    # IV strategy, AAD usage
│   ├── hkdf-hierarchy.md             # WDK → SK_section → SK_dir → DEK
│   ├── per-file-dek.md
│   ├── share-cryptography.md
│   ├── biometric-enclave.md
│   ├── session-tokens.md
│   ├── what-the-server-sees.md       # Definitive table
│   ├── post-quantum-roadmap.md
│   └── responsible-disclosure.md     # Security contact + PGP key
│
├── authentication/
│   ├── email-password.md
│   ├── google-oauth-pkce.md
│   ├── biometric.md
│   ├── totp-2fa.md
│   ├── account-recovery.md
│   ├── sessions.md
│   ├── api-keys.md
│   └── elevation-tokens.md
│
├── platforms/
│   ├── windows.md
│   ├── android.md
│   ├── web-pwa.md
│   ├── browser-mode.md
│   ├── macos-roadmap.md
│   ├── ios-roadmap.md
│   └── linux-roadmap.md
│
├── cli/
│   ├── kp-ws.md                      # Every flag, every example
│   ├── kp-admin.md
│   └── ci-cd-recipes.md              # GitHub Actions, GitLab CI examples
│
├── compliance/
│   ├── gdpr.md
│   ├── hipaa.md
│   ├── soc2.md
│   ├── ccpa.md
│   ├── nist-fips.md
│   └── data-residency.md
│
├── api/
│   ├── overview.md
│   ├── auth.md
│   ├── sync.md
│   ├── share.md
│   ├── workspace.md
│   ├── company.md
│   ├── admin.md
│   ├── stripe-webhooks.md
│   ├── error-codes.md
│   └── rate-limits.md
│
├── faq/
│   ├── general.md                    # ≥ 25 Q&A
│   ├── security.md                   # ≥ 20 Q&A
│   ├── billing.md                    # ≥ 15 Q&A
│   ├── enterprise.md                 # ≥ 15 Q&A
│   └── troubleshooting.md            # ≥ 25 Q&A
│
└── legal/
    ├── terms-of-service.md
    ├── privacy-policy.md
    ├── cookie-policy.md
    ├── acceptable-use-policy.md
    ├── refund-policy.md
    ├── dpa.md                        # Standard Contractual Clauses ready
    ├── baa-summary.md                # Pointer to Enterprise BAA
    ├── subprocessors.md              # Cloudflare, Stripe, Google, etc.
    ├── responsible-ai-disclosure.md  # If AI Panel uses 3rd-party LLM
    └── changelog.md                  # Version-by-version change log
```

---

## File frontmatter

Every Markdown file must start with this YAML block:

```yaml
---
title: "Article title"
slug: "url-slug"
category: "Category Name"
tags: ["tag1", "tag2"]
audience: "user" | "admin" | "developer" | "legal"
plan: ["local", "guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows", "android", "web", "macos", "ios", "linux"]
last_reviewed: "YYYY-MM-DD"
source_refs:
  - "backend/src/routes/share.ts"
  - "src/crypto/aesgcm.ts"
related: ["other-slug", "another-slug"]
---
```

The SPA wiki loader uses this metadata to filter, search, and cross-reference.

## `_index.json` schema

```json
{
  "version": "1.0.0",
  "generated": "2026-04-26T00:00:00Z",
  "categories": [
    {
      "id": "getting-started",
      "title": "Getting Started",
      "icon": "rocket",
      "order": 1,
      "articles": [
        { "slug": "overview", "title": "What is K-Perception?" },
        { "slug": "install-windows", "title": "Install on Windows" }
      ]
    }
  ]
}
```

## `_search.json` schema

```json
{
  "documents": [
    {
      "slug": "share-links",
      "title": "Share Links",
      "category": "Sharing",
      "body": "plaintext-stripped article body",
      "headings": ["Creating a link", "Permission levels", "Revocation"]
    }
  ]
}
```

---

## Content depth requirements

For **every feature article**, the file must contain at least these sections:

1. `## What it is` — one-paragraph plain-language explanation.
2. `## When to use it` — concrete scenarios.
3. `## Step by step` — numbered walkthrough with screenshots referenced as `![alt](../assets/<slug>-<n>.png)` (placeholders if assets are not yet exported).
4. `## Behaviour and edge cases` — error states, empty states, race conditions, what happens when the network drops mid-operation, what happens when the vault is locked.
5. `## Platform differences` — table comparing Windows / Android / Web behaviour.
6. `## Plan availability` — which tiers can use this feature.
7. `## Permissions and roles` — who can see / edit / configure (workspace context).
8. `## Security implications` — what gets encrypted, what the server sees, what audit-log events are emitted.
9. `## Settings reference` — every related setting, its default, its constraint.
10. `## Related articles` — at least three cross-references.
11. `## Source references` — file paths and line ranges in the codebase.

For **every admin/enterprise article**, additionally include:

- `## IdP-specific configuration` — concrete UI walkthrough for Okta, Azure AD, Google Workspace.
- `## Required attribute mappings` — table of `idp_claim → kperception_field`.
- `## Failure modes and recovery` — what to do when SCIM provisioning fails mid-batch.
- `## Audit events emitted` — exact event names and payload shape.

For **every cryptography article**, additionally include:

- `## Algorithm and parameters` — exact NIST/IETF spec name + parameter set.
- `## Byte layout` — diagram of bytes on the wire / on disk.
- `## Threat model coverage` — table of "adversary X cannot do Y because of Z".
- `## Known limitations` — honest list of what this primitive does NOT protect against.
- `## Migration plan` — what the rotation/deprecation strategy is.

For **every API article**, additionally include:

- `## Endpoint definition` — method, path, auth, content-type.
- `## Request schema` — TypeScript interface or JSON Schema.
- `## Response schema` — same.
- `## Status codes** — every code returned and what it means.
- `## Curl example** — copy-pastable.
- `## Idempotency rules**.
- `## Rate limits**.

For **every legal document**, the file must:

- Be written in plain modern English (no archaic legalese unless required).
- Be jurisdiction-aware — explicitly state governing law and venue.
- Include exhaustive definitions section.
- Include limitation-of-liability and indemnity clauses with monetary caps.
- Include a clear data-deletion timeline.
- Reference the subprocessor list.
- End with a "last modified" date and a "what changed since last version" summary.
- Be reviewable by a non-lawyer in under 15 minutes.

---

## FAQ depth

Each `faq/*.md` file must contain *real* Q&A pairs, *not* marketing fluff. Bad: "Q: Is K-Perception secure? A: Yes, very secure!". Good: "Q: If my Android phone is stolen and the thief tries 1000 password guesses per second, how long until they could brute-force my vault? A: With a 14-character random password and PBKDF2 100k iterations, ~10^21 years. With a weak 8-character dictionary password, possibly under one day — which is why biometric unlock falls back to a password failure counter that wipes the local vault after N attempts (see `BIOMETRIC_MAX_ATTEMPTS` in `src/auth/biometric.ts`)."

The minimum FAQ counts above are floors, not ceilings.

---

## Cross-linking and consistency

- Every workspace article must link back to `workspaces/overview.md`.
- Every cryptography article must link back to `security/overview.md` and `security/threat-model.md`.
- Every legal document must link to `legal/subprocessors.md` where relevant.
- Every feature must declare its plan availability — and that declaration must match `getting-started/choosing-a-plan.md`.
- Article titles must use sentence case, not Title Case.
- Code samples must be syntax-highlighted using triple-backtick fences with the language tag.
- Every `[NEEDS-VERIFY]` placeholder must be reported in a final `wiki/_TODO.md` file with one line per occurrence.

---

## Tone and editorial standards

- **No hype.** Don't write "blazingly fast" or "industry-leading". Write what the system *does*.
- **No marketing claims that aren't measurable.** "Sub-50ms latency to 95% of global pop" is fine — it's measurable. "Best-in-class security" is not — it's a feeling.
- **Active voice, second person.** "You generate a share link by clicking…" not "Share links can be generated by…".
- **One topic per article.** If an article wants to grow beyond ~1500 words, split it.
- **Diagrams as ASCII or Mermaid, not as inline images** — so they remain readable in the raw Markdown.
- **No emoji in headings.** Emoji in body text only when they reduce ambiguity (e.g., status icons).

---

## Deliverable acceptance criteria

The wiki is **done** when:

- ✅ Every file in the structure above exists.
- ✅ Every file has the required frontmatter.
- ✅ Every feature article has all eleven required sections.
- ✅ Every legal document has been written end-to-end (no `[TODO]` blocks).
- ✅ `_index.json` and `_search.json` are generated and validate against their schemas.
- ✅ `wiki/_TODO.md` lists every remaining `[NEEDS-VERIFY]`.
- ✅ Running a grep for "Lorem ipsum", "TODO", "FIXME", or "XXX" returns zero matches outside `_TODO.md`.
- ✅ The total word count is at least **120,000 words** across the wiki.
- ✅ The FAQ contains ≥ 100 Q&A pairs combined.
- ✅ A first-time enterprise admin can configure SAML+SCIM against Okta using only `enterprise/saml-okta.md` and `enterprise/scim-okta.md` as a guide.

---

## After generation

After the markdown files exist, generate two more artifacts:

1. **`wiki/_render-pack.json`** — a single JSON file aggregating all article HTML (rendered from MD with a sane renderer like `marked`), keyed by slug, ready to be embedded into the static `wiki.html` page on GitHub Pages.
2. **`wiki/_inline-bundle.js`** — a JS file that exports `WIKI_DATA` as a frozen object containing the index, the search documents, and the rendered HTML — so `wiki.html` can `<script src="wiki/_inline-bundle.js"></script>` and immediately render without `fetch()`.

These two artifacts are how the static GitHub Pages wiki page consumes the content without a backend.

---

## Final reminder

The user is shipping this wiki to a real audience (privacy-first knowledge workers, healthcare, legal, enterprise security teams). **Inaccuracy is worse than incompleteness.** If you cannot verify a claim from the codebase or the blueprint, write `[NEEDS-VERIFY: …]` and move on. Do not invent.

Begin with the codebase scan. Then write `getting-started/overview.md` and use it to calibrate tone. Then proceed in the order of the directory tree above.

Good luck. Don't cut corners.
