# Infra Illustrated topic mesh visual specification

Topic: Catalogue topic mesh  
Status: Integrated  
Version: 1.0  
Verified: 2026-09-11  
Target audience: Working developers using Infra Illustrated to recall, compare, or discover infrastructure concepts.  
Page promise: Find one useful reference and understand why nearby references may help without turning the library into a prescribed course.  
Persistent scenario: A reader searches for VPC Packet Flow, inspects its Networking relationships, follows a connected Kubernetes topic, and opens the reference they need.  
Scope: Discovery across existing catalogue entries on `/visualizations`, with shared search and filters.  
Non-goals: Technical dependency mapping, prerequisites, progress tracking, automatic recommendations, a graph database, or a replica of the reference site's implementation.  
Visual thesis: A dark constellation of independently useful references whose visible gravity comes from their connections.

## Semantic color and diagram grammar

- The page retains the established dark background and surfaces.
- AWS uses amber, Kubernetes blue, DevOps & SRE green, and Foundations purple for collection identity.
- Cyan marks active controls, the selected node, and selected connections.
- Dashed undirected lines mean “related reference.” They never mean runtime traffic, dependency, or reading order.
- Collection frames are orientation regions, not infrastructure boundaries.
- A solid outline and `aria-pressed` state identify selection; color is not the only state cue.
- Motion is limited to short camera transitions and direct drag feedback. Reduced-motion users receive immediate updates.

## Narrative sequence

| # | Section | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Constellation overview | What kinds of references exist here? | Organic topic mesh | Map/List switch, selection, node drag, pan and zoom | The library is a connected reference space with independently useful topics. |
| 2 | Topic neighborhood | Why is this topic connected to those topics? | Selected node plus semantic inspector | Select a node or connected reference | Every visible connection has an explicit metadata or editorial reason. |
| 3 | Focused discovery | How do I narrow this without losing context? | Shared filters with map/list results | Search, multi-select filters, chips, history | Map and List are two views of one stable matching set. |

## Visual 1 — The collection constellation

### Purpose

Give readers a spatial overview without suggesting a curriculum or a service architecture.

### Learner question

“Where does the concept I need sit in this library?”

### Persistent scenario state

The reader has opened the complete catalogue and is looking for a packet-flow reference.

### Concepts and actors

- One node per catalogue entry.
- Collection identity shown through subtle node accents and inspector metadata.
- Sparse overview relationships generated from explicit `related` metadata and the strongest shared tag/technology candidates.
- A full-title selector, Map/List controls, camera controls, legend, and result count.

Catalogue metadata is authored configuration. Nodes and connectors are a build-time projection of that metadata; they are not stored runtime objects.

### Composition

On wide screens, an organic node field fills the map canvas. Highly connected topics receive larger circles and start nearer the visual center; less connected topics spread outward through a deterministic radial distribution. Lines render behind labels and nodes. Selecting a topic opens a roughly 390 px drawer over the right edge, keeping the highlighted neighborhood visible behind it. The homepage search and Map/List control float over the canvas.

The homepage defaults to Map, with List available beside it. The complete catalogue defaults to List and `/visualizations?view=map` opens its map. The world surface retains stable node positions through selection and filtering.

### Interaction

- Map/List buttons switch renderers and preserve query and filters.
- The full-title selector selects any visible topic on the catalogue map; homepage search provides the primary find action.
- Zoom in, Zoom out, Fit results, and Reset view are native buttons.
- Pointer drag on empty canvas pans; controls never capture normal wheel scrolling or browser zoom.
- Pointer drag on a node moves it and updates its incident connectors.
- Reset view clears map selection and resets the camera. Filter Reset remains separate.
- Keyboard users can reach every topic through native node buttons and the selector.

### Data or content states

Default data is the validated catalogue snapshot. Representative nodes include VPC Packet Flow, Kubernetes Networking, AWS Identity and Credential Flows, OpenTelemetry, and OAuth 2.0 & OIDC.

### Failure or edge state

An isolated topic still appears and can be opened. If map initialization fails or JavaScript is unavailable, the server-rendered List remains usable. An empty matching set replaces the canvas with concise recovery copy and a Clear filters button.

### Required copy

- “Select a topic to see its connections.”
- “Dashed lines join references with shared metadata or an editorial relationship. They are associations, not prerequisites.”
- “Drag empty space to pan. Use the controls to zoom. Every topic is also available in the selector and List view.”

### Accuracy caveats

Node size reflects connection count only as a visual emphasis; it does not mean importance. Exact spatial distance has no semantic meaning. The sparse overview omits weaker candidate connections to control density.

### Mobile behavior

Below approximately 760 px, controls and inspector stack. The viewport remains clipped to its own world surface and never causes page-level horizontal scrolling. The full-title selector supplies a readable baseline when overview labels are small.

### Accessibility

Use native buttons and a select, visible focus, full-title accessible names, `aria-pressed` selection, and a semantic inspector. SVG connectors are hidden from assistive technology because the inspector repeats their meaning in text. Reduced motion removes nonessential transition time.

### Source anchors

- [Confirmed discovery and interaction rules](../../../SITE-REBUILD-BRIEF.md#discovery)
- [Existing catalogue metadata](../../../src/content.config.ts)

### Acceptance checks

- All current catalogue topics appear once.
- Collection color does not replace readable collection labels.
- Lines remain aligned during pan, zoom, and resize.
- List remains usable without JavaScript.
- The page does not gain horizontal overflow at 320 px.

## Visual 2 — The explained neighborhood

### Purpose

Make connections accountable instead of presenting a decorative web.

### Learner question

“Why does this reference lead to that one?”

### Persistent scenario state

The reader selects VPC Packet Flow and sees its incident relationships highlighted.

### Concepts and actors

- Selected topic and its canonical URL.
- Manual editorial relationships and their declaring source topics.
- Shared tags and shared technologies.
- Matching and filtered-out neighboring topics.
- Format, difficulty, and current content state.

### Composition

The selected node receives a cyan outline. Incident dashed lines become cyan; unrelated nodes become subdued. The inspector shows title, summary, metadata, a normal Open visual link, and connected-reference buttons. Each button includes a reason such as “Editorially related,” “Shared technology: Kubernetes,” or “Shared tags: Networking, Troubleshooting.” Six connections appear first; additional connections remain available in a native disclosure.

### Interaction

Selecting a node, choosing a title, or activating a related-reference button updates the same selected state and URL. The first activation never navigates away. The Open visual anchor retains ordinary link behavior. Escape clears selection when focus is within the map. Browser Back restores previous selections.

### Data or content states

VPC Packet Flow connects editorially to Kubernetes Networking through the latter's `related` metadata. Other associations may result from shared Networking, Security, or Troubleshooting tags. AWS Identity and Credential Flows connects editorially to the public slug `oauth2-explainer`.

### Failure or edge state

If current filters hide neighbors, the inspector reports the number hidden. If the URL requests an unknown or excluded topic, selection clears safely. A topic with no relationships remains openable and explains that no matching connection is present.

### Required copy

- “Open visual →”
- “Connected reference(s)”
- “connection(s) hidden by current filters.”
- Relationship reasons derived from metadata, with no invented dependency language.

### Accuracy caveats

Shared metadata suggests topical adjacency, not equivalent scope or operational dependency. Manual `related` values receive priority but remain undirected in the mesh.

### Mobile behavior

The overlay inspector becomes a normal block below the map. Connected-reference controls wrap long titles. Additional relationships use a native disclosure instead of extending the first screen indefinitely.

### Accessibility

Selection does not move focus unexpectedly. Every neighbor button has “Select [full title]” as its accessible name. The selected state uses outline and pressed state. The relationship list communicates everything shown by SVG lines.

### Source anchors

- [Validated related metadata](../../../src/content.config.ts)
- [Graph projection](../../../src/lib/topic-graph.ts)

### Acceptance checks

- Every displayed reason exactly matches source metadata.
- Collection or format alone never creates an edge.
- Reciprocal manual declarations collapse to one line.
- The inspector's Open visual link resolves to the existing public URL.

## Visual 3 — One result set, two views

### Purpose

Let readers move between scanning cards and exploring relationships without losing their place.

### Learner question

“Can I narrow the map the same way I narrow the catalogue?”

### Persistent scenario state

The reader filters for Networking across AWS and Kubernetes, follows a neighbor, then switches to List before opening it.

### Concepts and actors

- Text query.
- Multi-select collection, topic tag, technology, and format groups.
- OR matching within a group and AND matching across groups.
- Removable active-filter chips and deterministic reset.
- Pagefind full-text results plus local title/metadata matches.
- URL state for query, repeated filters, view, and selected topic.

### Composition

Search remains the strongest control. Four dark disclosure menus expose native checkboxes and selected counts. Active chips appear below. Result count and Map/List switch align above the active renderer.

### Interaction

Changing a checkbox commits a history state; query typing replaces the current state after a short debounce. Back and Forward restore controls, visible topics, view, and selection. Query results use a generation guard so an older Pagefind response cannot replace newer state. Local metadata matches supplement the full-text index.

### Data or content states

Example URL: `/visualizations?view=map&collection=aws&collection=kubernetes&tags=Networking&topic=vpc-flow`.

### Failure or edge state

If Pagefind is unavailable, local title and metadata search still works. Zero results display recovery controls. If filtering removes the selected topic, selection clears rather than relaxing the filter silently.

### Required copy

- “Search systems, services, or concepts…”
- “No matching visual yet”
- “Try a broader term or clear one of the filters.”

### Accuracy caveats

Local fallback does not search MDX prose. Result count always describes catalogue topics, not matching Pagefind sections.

### Mobile behavior

Filter controls become a single column. Menus stay within the viewport, chips wrap, and view controls remain reachable. The page retains ordinary browser scrolling and zooming.

### Accessibility

Every disclosure has a readable summary, every group has a legend, and each chip is a labeled removal button. Result counts use a polite live region. The `/` shortcut ignores editable controls.

### Source anchors

- [Confirmed search behavior](../../../SITE-REBUILD-BRIEF.md#search-behavior)
- [Pagefind documentation](https://pagefind.app/docs/api/)

### Acceptance checks

- Multiple values within one group use OR; groups combine with AND.
- Map and List show identical topic IDs and counts.
- Rapid query changes cannot restore stale results.
- URL refresh and browser history restore state.

## Persistent page elements

The existing site header, page introduction, search tools, result count, catalogue shell, and footer remain. The homepage and complete catalogue mount the map renderer; collection pages link into the filtered complete map. Topic URLs remain stable.

## Responsive and accessibility requirements

- Support 320, 375, 768, 1024, and 1440 px layouts and 200% browser zoom.
- Preserve page scrolling and browser magnification.
- Keep controls at least 40 px high, targeting 44 px where space permits.
- Provide visible focus, non-color state cues, semantic controls, and readable relationship text.
- Keep core topic navigation available without JavaScript.
- Do not run continuous animation.

## Prototype implementation contract

The self-contained prototype uses the established dark tokens, semantic HTML, inline CSS, and minimal JavaScript. It demonstrates Map/List switching, topic selection, relationship explanations, search/filtering, reset, a zero-result state, and narrow responsive behavior. It uses representative catalogue content and does not publish through Astro routes.

## Integration guidance

### September 2026 visual refinement

The homepage now uses a wider atlas with a compact introduction and a persistent, responsive search/filter toolbar. Map is the default on both discovery routes; an explicit List choice is preserved in the URL. Nodes use the existing collection accents, with larger sentence-case labels and restrained lighting. Dashed connections denote conceptual associations, not runtime traffic. The drawer exposes the metadata reason for each related topic and uses a dark cyan-accented action. A text-and-color collection legend accompanies the canvas. The existing prototype remains the historical approval artifact; production components are canonical for this authorized refinement.

Acceptance for this pass: desktop and 320/375 px layouts, default Map, selecting a topic, collection filtering/reset, List restoration after refresh, no-JavaScript catalogue access, and no browser errors. Automated check and build must pass before handoff.

- Canonical data: `src/content/topics/*.{json,mdx}`.
- Graph derivation and relationship validation: `src/lib/topic-graph.ts`.
- Shared URL normalization: `src/lib/topic-url.ts`.
- Map structure and scoped visuals: `src/components/TopicMap.astro`.
- Shared state and filters: `src/components/LibraryExplorer.astro`.
- Canonical discovery surfaces: `/` via `src/pages/index.astro` and `/visualizations` via `src/pages/visualizations.astro`.
- Integration status: Implemented; final verification results belong in the delivery report.

The prototype is an approval/history artifact. Future content changes update the collection and production projection, not the prototype snapshot.

## Deep-dive handoffs

No topic deep dive is created by this interface. Potential future product work includes authored relationship types or a true 3D renderer, but neither has a published target and neither should be linked as content.

## Page-level acceptance criteria

- Dark theme is retained throughout the map, filters, inspector, and empty states.
- Every current catalogue topic is reachable in List and Map.
- Connection semantics are visible and accurate.
- Search, filters, history, selection, and view switching share one state.
- Existing public URLs, collection pages, homepage discovery, and Related Visuals remain functional.
- Astro check, static build, internal link validation, and representative browser checks pass.
- No serious accessibility problem or mobile page overflow is introduced.

## Source index

- [Infra Illustrated site rebuild brief](../../../SITE-REBUILD-BRIEF.md)
- [Infra Illustrated writing guide](../../../WRITING-GUIDE.md)
- [Universal visual specification generator](../../INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md)
- [AI Coding Dictionary reference](https://www.aicodingdictionary.com/)
- [Pagefind search API](https://pagefind.app/docs/api/)

## Landing-page refinement — 2026-09-11

The user's clarified direction keeps the two-dimensional map as the main homepage surface and retains click-to-open summaries on the right. This is a refinement of the integrated constellation, not a replacement discovery model. Canonical implementation remains `src/pages/index.astro`, `src/components/LibraryExplorer.astro`, and `src/components/TopicMap.astro`; the original prototype is a frozen historical design artifact.

- Four always-visible collection buttons select AWS, Kubernetes, DevOps & SRE, or Foundations exclusively. All collections clears the collection selection while preserving other filters. Counts represent collection inventory. The existing advanced collection filter still permits OR selections.
- Buttons, advanced filters, removable chips, URL history, list cards, nodes, and edges share the same selection state. Excluded nodes and their connections disappear; an excluded selection closes its summary.
- The landing-page heading is compact and neutral. Flat collection-colored nodes replace glossy spheres. The summary appears in a floating right-hand panel on desktop and below the map on mobile.
- Secondary filters are disclosed through More filters on the homepage. The map's dashed-line caption describes related references, not runtime dependencies.
- Mobile fit preserves a minimum readable scale; panning and the full-title selector reach offscreen topics. Opening a summary focuses its close button; closing it restores node focus. Escape also closes the summary.

Acceptance: verify each collection independently, All collections, URL restoration, node selection and summary links, mobile overflow from 320 px, keyboard selection/close, and the no-JavaScript list fallback. No new infrastructure claims or content metadata are introduced.
