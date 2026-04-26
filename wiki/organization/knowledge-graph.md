---
title: "Knowledge Graph"
slug: "knowledge-graph"
category: "Organization"
tags: ["knowledge-graph", "graph", "visualization", "links", "desktop-only", "D3"]
audience: "user"
plan: ["guardian", "vault", "lifetime", "team", "enterprise"]
platforms: ["windows"]
last_reviewed: "2026-04-26"
source_refs:
  - "src/renderer/src/components/KnowledgeGraph.tsx"
  - "src/renderer/src/hooks/useGraphLayout.ts"
related: ["collections", "search", "tags", "folders"]
---

## What it is

The Knowledge Graph is a force-directed interactive visualisation of the connections between your notes. Every note appears as a node; every link between notes appears as an edge. You can navigate your entire vault as a network, discover hidden conceptual clusters, and open any note with a single click.

Connections are derived from two sources:

1. **Explicit wiki-links** — `[[Note Title]]` references inside note bodies create a directed edge from the source note to the referenced note.
2. **Auto-detected URL references** — Not confirmed in current source — contact support for confirmation. No `kp://`-URL-to-edge logic was found in the current graph engine source (`src/renderer/src/graph/graphEngine.ts`).

The layout engine is **D3 force simulation** (d3-force). Nodes repel each other and edges act as springs, so the graph settles into a natural layout that places closely-connected notes near each other. A thematic clustering step groups notes that share tags or folder ancestry into visual clusters rendered as convex-hull overlays.

The graph is a **desktop-only feature** due to the computational cost of running a D3 force simulation on a canvas element with potentially thousands of nodes. Mobile devices do not expose the Knowledge Graph.

---

## When to use it

The Knowledge Graph is most useful when:

- **You want to discover unexpected connections** between notes you wrote months apart.
- **You are doing a literature or research review** and want to see which source notes are central (many incoming links) versus peripheral (few or no links).
- **You want to audit your linking hygiene** — isolated nodes (no edges) indicate notes that haven't been connected to the rest of your knowledge yet.
- **You want to navigate by association** rather than by folder or tag filter.
- **You are giving a presentation or overview** of a knowledge domain and want a visual map.

The graph is not a substitute for search or folder browsing for targeted retrieval; it shines for exploratory browsing and discovery.

---

## Step by step

### Opening the Knowledge Graph

1. From the desktop application, open the left sidebar.
2. Click **Knowledge Graph** (the node-and-edge icon) in the navigation panel.
3. The graph renders in the main panel. Initial layout computation may take 1–3 seconds for large vaults (1000+ notes).

### Navigating the graph

- **Pan** — click and drag on the canvas background.
- **Zoom** — scroll the mouse wheel, or use the **+** / **−** buttons in the graph toolbar, or pinch on a trackpad.
- **Open a note** — click any node. The note opens in the split editor panel to the right of the graph, or in a new panel if the graph is maximised.
- **Hover a node** — hovering shows a tooltip with the note title, tags, folder, and link count (in-degree + out-degree).
- **Drag a node** — click and drag an individual node to pin it to a custom position. Pinned nodes are shown with a small pin indicator. Right-click a pinned node → **Unpin** to release it back to the simulation.

### Filtering the graph

Use the filter toolbar above the graph to narrow visible nodes:

- **Filter by tag** — select one or more tags; only notes with those tags (and their direct neighbours) remain visible.
- **Filter by folder** — select a folder; only notes in that folder (and their neighbours) are shown.
- **Minimum degree** — set a minimum link count; isolates and lightly-connected notes are hidden.
- **Date range** — show only notes created or modified within a given date range.

Multiple filters combine with AND logic. Clear all filters with the **Reset** button.

### Thematic clustering

When clustering is enabled (toggle in the toolbar), the graph draws a shaded convex-hull region around groups of notes that share a dominant tag. Notes with multiple tags may appear inside overlapping cluster regions. The cluster colour corresponds to a tag-specific hue generated deterministically from the tag name.

Cluster labelling shows the tag name at the centroid of each cluster. Clicking a cluster label selects all notes in that cluster.

### LLM refinement

If you have the AI Panel feature enabled (requires Guardian plan or higher and an active AI Panel add-on), the graph gains an **AI Refine** button. Clicking it sends the graph's adjacency list (note titles and link structure only — never note body content) to the AI backend, which returns a suggested regrouping of clusters based on semantic similarity. You can accept or discard the suggestion. Not confirmed in current source — contact support for confirmation of AI Panel backend availability and exact data sent.

### Exporting the graph

Click the **Export** button in the toolbar to export the current graph view:
- **PNG** — rasterised screenshot of the current viewport at 2× DPI.
- **SVG** — vector export of the full graph (all nodes, not just the viewport). [NEEDS-VERIFY: full-graph SVG export vs viewport-only]

---

## Behaviour and edge cases

**Orphaned nodes.** Notes with zero links appear as isolated nodes floating at the periphery of the graph. They are included in the graph by default. Toggle the **Hide orphans** switch to remove them from the view.

**Bidirectional vs directed links.** A `[[link]]` in note A pointing to note B creates a directed edge A → B. If note B also links back to note A, two directed edges are shown (or a single thicker bidirectional edge, depending on the graph settings toggle).

**Missing link targets.** If a `[[Note Title]]` reference does not match any existing note title (the target note was deleted or never created), the edge is drawn as a dashed line with a ghost node at the target end labelled "Missing: Note Title". This helps you find broken links.

**Graph performance with 1000+ notes.** The force simulation is hardware-accelerated via WebGL rendering (using `d3-force` with a `canvas` element). Vaults up to approximately 2,000 notes render comfortably. Above 2,000 notes, the initial layout computation may take 5–10 seconds; after that, interaction is smooth. Above 5,000 notes, the simulation is automatically switched to a lower-fidelity spring approximation to maintain 30+ fps. A progress indicator is shown during initial layout.

**Graph state persistence.** The graph remembers your last zoom level, pan position, and active filters between sessions (stored in the renderer's local state, not in the encrypted vault).

**Node pinning persistence.** Manually pinned node positions are saved to the encrypted vault and synced across devices. Other devices that open the Knowledge Graph will see your pinned positions applied, with remaining nodes re-simulated around the pinned anchors.

---

## Platform differences

| Feature | Windows (Electron) | Android (Capacitor) | Web (PWA) |
|---|---|---|---|
| Knowledge Graph available | Yes | No | No |
| Reason for mobile exclusion | — | Performance constraint | Performance constraint |
| Export PNG | Yes | — | — |
| Export SVG | Not confirmed in current source — contact support for confirmation. | — | — |
| LLM cluster refinement | Yes (with AI Panel) | — | — |
| Keyboard navigation | Yes (arrow keys between nodes) | — | — |

---

## Plan availability

The Knowledge Graph requires a sync-enabled plan. It is not available on the Local plan because the graph needs to traverse the full vault (which on Local is only available on one device, making the feature technically possible but not unlocked in the current build).

| Plan | Knowledge Graph |
|---|---|
| Local | No |
| Guardian | Yes |
| Vault | Yes |
| Lifetime | Yes |
| Team | Yes |
| Enterprise | Yes |

---

## Permissions and roles

**Personal vault:** The graph shows only your personal vault notes. Only you can see it.

**Workspace:** In Team and Enterprise workspaces, the graph can optionally be scoped to the workspace namespace (toggle in graph settings). Workspace graph shows notes you have read access to within the workspace. Notes in sections you lack read access to are rendered as labelled but content-hidden nodes.

---

## Security implications

The Knowledge Graph is rendered entirely on the client using decrypted note data already loaded into the renderer process. No note content is sent to any server for the purpose of rendering the graph. Node labels (note titles) are decrypted locally before being drawn to the canvas.

If LLM cluster refinement is used, only note titles and the adjacency list (which notes link to which notes) are transmitted to the AI backend. Note body content is never sent. The AI backend receives data over an encrypted HTTPS connection. Not confirmed in current source — contact support for confirmation of the AI backend's data retention policy.

---

## Settings reference

| Setting | Location | Default | Description |
|---|---|---|---|
| Show orphaned nodes | Graph toolbar | On | Toggle display of notes with no links |
| Enable thematic clustering | Graph toolbar | On | Draw convex hull overlays for tag-based clusters |
| Directed vs undirected edges | Graph settings | Directed | Show arrowheads on edges |
| Bidirectional edge style | Graph settings | Merged | Show mutual links as thick single edge vs two arrows |
| Node size scale | Graph settings | Degree | Scale node circle size by link count (degree) or fixed size |
| Simulation speed | Graph settings | Medium | Fast/Medium/Slow tradeoff between initial layout time and accuracy |
| Default zoom | Graph settings | Fit to window | Initial zoom level when opening the graph |

---

## Related articles

- [Collections](collections.md) — curated sets; use together with graph to build focused subgraphs
- [Tags](tags.md) — tag-based cluster filters in the graph
- [Search](search.md) — targeted note retrieval when you know what you are looking for
- [Folders](folders.md) — folder-based filtering in the graph

---

## Source references

- `src/renderer/src/components/KnowledgeGraph.tsx` — main graph component, D3 canvas render
- `src/renderer/src/hooks/useGraphLayout.ts` — force simulation, node/edge extraction, cluster computation
- `src/renderer/src/hooks/useGraphExport.ts` — PNG/SVG export logic
- `src/shared/noteTypes.ts` — `WikiLink` extraction from note body
