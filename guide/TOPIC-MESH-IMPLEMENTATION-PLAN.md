# Topic mesh implementation plan

Status: Implemented on 2026-09-11  
Prepared: 2026-09-11  
Scope: Library discovery on Infra Illustrated  
Reference: [The AI Coding Dictionary](https://www.aicodingdictionary.com/)

## 1. Intended outcome

Add an interactive topic map alongside the existing catalogue. Readers should be able to locate a topic, see its connections across collections, inspect why another topic is related, and open the existing visual explanation. Map and List are two views of the same catalogue, search results, and filters.

The final implementation uses an organic two-dimensional knowledge mesh with circular, connection-weighted nodes, pan and zoom, draggable nodes, and an overlay topic drawer. It adapts the reference interaction to the established dark visual system and accessible HTML controls rather than copying its light palette or implementation.

The existing dark design, topic URLs, independent reference format, and static Astro architecture remain the foundation. Connections express editorial or metadata relationships. They do not express runtime traffic, technical dependency, importance, or a prescribed learning order.

### Initial placement and defaults

- Add Map/List to `/visualizations`. Keep List as the default for URLs without a view parameter during the initial rollout.
- Make Map the homepage's default discovery view, with List retained as an alternate view and a link to the complete catalogue.
- Keep collection pages in List view initially; they reuse the improved filtering implementation.
- On collection pages, offer a map link with the collection encoded in the query string. Cross-collection exploration happens on the complete catalogue.
- An explicit `view=map` works on mobile too, with a mobile composition described below.
- Keep `/visualizations` in List by default for direct catalogue browsing; an explicit `view=map` opens its map.

This scope follows the confirmed brief's discovery model. A freely rotating 3D scene would be a subsequent design decision.

## 2. Current implementation and findings

| Area | Current state | Implication |
| --- | --- | --- |
| Content | 17 entries: 11 reviewed, 5 legacy, 1 draft | Use actual entries in the prototype; do not invent topics to fill the map. |
| Metadata | Slug, title, summary, collection, tags, technologies, format, state, optional related slugs | Most map data already exists in the validated collection. |
| Public selection | Home and catalogue currently load all entries, including the draft | Preserve catalogue membership for this change; do not silently introduce a publication policy or mark drafts reviewed. |
| Discovery UI | `LibraryExplorer.astro` renders search, four selects, status, and cards | Extract shared state before introducing a second renderer. |
| Filters | One selection per group; displayed chips are spans | Implement the brief's OR-within-group / AND-across-groups behavior and removable chips. |
| Search | Pagefind with metadata fallback; asynchronous results have no stale-response guard | Keep both views synchronized and prevent old queries from overwriting newer state. |
| URL behavior | Filter parameters restored on load and replaced on changes | Add view and selection, preserve fragments, and handle Back/Forward. |
| Related visuals | Manual overrides, otherwise a weighted recommendation score | Graph edges need explicit reasons; matching collection or format alone is insufficient evidence for an edge. |
| Broken relationship | `aws-identity-credential-flows` references `oauth2-oidc`, whose public slug is `oauth2-explainer` | Correct that metadata reference and validate all relationship targets. |
| Checks | Astro check, static build, generated internal-route/anchor checks | Add focused graph/state checks and browser interaction coverage. |

These findings come from the repository at the date above. Recheck the worktree and content inventory before implementation.

## 3. Reader experience

### A. Orient in the library

The map occupies the homepage's primary discovery region and the catalogue's map view. Topics form an organic constellation with compact labels, collection accents, and node sizes influenced by connection count. A legend explains that lines connect related references.

Show a sparse overview of the strongest connections. Avoid a line between every pair sharing a broad tag such as Troubleshooting. Keep all matching topics represented, including isolated topics.

Default inspector copy: “Select a topic to see its connections.” Include matching topic count and a short explanation of the relationship legend.

### B. Inspect a topic

Click, tap, or keyboard-activate a node to select it. The node receives an outline and selected state; its incident connections become prominent. Unrelated nodes remain available with subdued styling that still passes contrast checks. Layout positions do not change on selection.

The adjacent inspector shows:

- Full title, summary, collection, format, difficulty, and existing publication state where relevant.
- A normal “Open visual” link using the canonical current URL.
- Related matching topics, each with a reason such as “Shared technology: IAM,” “Shared tags: Networking, Security,” or “Editorially related.”
- A separate button to select each related topic in the map, with a clear accessible name.
- A count of connections outside the current filters, when applicable, and an explicit action to clear filters and explore them.

Do not navigate away on the first node click. The inspector's link opens the explanation using ordinary link behavior, including modifier keys and browser context menus.

### C. Follow a connection

Selecting a related topic updates the inspector and connection emphasis in place. Keep the previous topic available through browser Back. Dashed, undirected connectors indicate association. For a manually authored relationship, retain its source in the data and disclose it in the inspector when the connection is being viewed from the opposite end.

The repeatable exploration loop is: find a topic → inspect its relationship → select a neighbor → open the reference needed now.

### D. Search, filter, and switch views

Search and filters determine one matching-topic set used by both views. Map selection never silently relaxes filters. Switching to List preserves query and filters; switching back restores selection if it still matches.

Filtering hides excluded nodes and their lines without moving the remaining nodes. “Fit results” explicitly adjusts the camera. When filters remove the selected topic, clear selection and announce the change. A zero-result state replaces the graph with helpful copy and a working Clear filters action. A single result remains selectable even with no visible connections.

## 4. Graph data and relationship contract

### Source of truth

Build graph data from `getCollection('topics')` at build time. Use public slugs as IDs, never collection entry filenames. Resolve links with the existing `legacyPath || /slug` convention through a shared helper. Serialize only catalogue metadata and derived connections; do not ship MDX bodies in the graph payload.

Suggested types:

```ts
type TopicNode = {
  id: string; // public slug
  title: string;
  summary: string;
  href: string;
  collection: CollectionSlug;
  tags: string[];
  technologies: string[];
  format: TopicFormat;
  difficulty: TopicDifficulty;
  state: TopicState;
};

type TopicEdge = {
  id: string; // sorted endpoint IDs
  source: string;
  target: string;
  editorialSources: string[];
  sharedTags: string[];
  sharedTechnologies: string[];
  score: number;
};
```

Use inferred collection types for the field aliases. Do not create a second independently maintained content schema.

### Connection generation

1. Validate unique slugs, valid related targets, no self-references, and no duplicate related entries. Report source file and invalid target on failure.
2. Add all valid manual `related` pairs, recording which endpoint authored each reference. Collapse reciprocal declarations into one graph edge.
3. Generate metadata candidates for pairs sharing at least one technology or tag. Matching collection, format, difficulty, or publication state alone does not create a connection.
4. Rank candidates deterministically. Proposed initial score: three points per shared technology plus the sum of `1 / tagFrequency` for shared tags. Tag frequency is calculated over the complete supplied catalogue. Manual relationships rank first; ties break by public slug.
5. For overview rendering, retain all manual edges and the union of each node's three highest-ranked metadata edges. This limits the number of inferred edges to at most `3 × topicCount`; it does not guarantee degree three because other nodes may choose the same neighbor.
6. On selection, show that topic's complete candidate neighborhood, with all reasons available in the inspector. Use a collapsed “More connections” list if necessary; do not imply the sparse overview is exhaustive.
7. Apply active filters to node visibility and edge endpoints after graph generation. Relevance and layout must not change as filters change.

Treat the ranking constants as prototype tuning values. Check actual edge density and cross-collection links before fixing them. No random ranking, runtime similarity API, embeddings, or service dependency claims are required.

Existing topic-page Related Visuals keep their current manual-override behavior. The map presents a broader, explained neighborhood, so identical recommendations are not required. Share ID validation and URL resolution, without silently changing the topic-page recommendation policy.

### Content growth and publication state

Test with the real 17-entry catalogue and a clearly marked test-only fixture of at least 50 nodes. Synthetic entries must never enter the published catalogue or search index. Preserve the current inclusion policy for draft content in this iteration and show its state honestly in the inspector. A repository-wide draft visibility policy is a separate decision.

## 5. Rendering and layout

### Proposed implementation medium

Use Astro for server-rendered structure, ordinary TypeScript for interaction, HTML buttons for nodes and controls, and inline SVG for connectors. Position node buttons and SVG lines in one shared coordinate system inside a clipped viewport. Keep text selectable in the inspector and essential content available in ordinary HTML.

Do not add a client framework or graph library initially. Validate the small deterministic layout against 50 topics; consider a narrowly scoped layout dependency only if the prototype demonstrates an unresolved collision or performance problem. A continuously running force simulation is unnecessary for the proposed stable interface.

### Layout contract

- Use a deterministic layout module, stable ordering by collection and slug, measured node dimensions, and a bounded collision pass.
- Use a deterministic radial distribution ranked by connection count, then allow direct node dragging for local exploration.
- Permit the world surface to grow as topics are added. Do not solve density by shrinking labels below readable sizes.
- Route connectors behind nodes, with subdued contrast; draw selected edges above other edges and below labels.
- Keep full title in the inspector. If compact node labels are needed, derive sensible wrapping first; introduce an optional validated short title only if specific real titles require editorial abbreviations.
- Wait for local layout/font readiness before final measurement; handle resize through a coalesced observer update.
- Retain positions across filtering and selection. Recompute only when viewport mode or data changes.
- Share one pan/zoom transform for node positions and connectors. Verify alignment at every supported scale.
- Use existing background, surface, border, typography, collection-color, focus, and spacing tokens. Dashed lines represent conceptual associations, with a nearby legend.
- No decorative auto-rotation, moving particles, continuous pulsing, or animation that competes with reading.

### Camera controls

Provide Zoom in, Zoom out, Fit results, and Reset view. Reset view affects camera and selection only; Clear filters remains a distinct action. Disable zoom controls at their bounds and expose the current scale as text.

Mouse or pointer drag on empty map space pans. A movement threshold distinguishes panning from clicking. Handle pointer cancellation and loss of capture. Keep page scrolling and browser zoom available; do not capture ordinary wheel scrolling or Ctrl/Cmd browser zoom. Keyboard users can reach every topic through a native topic selector and inspector links without panning.

At low camera zoom, provide an overview density mode with collection labels and selected-topic labeling rather than presenting unreadably tiny text. A compact “Select topic” control above the map guarantees access to every matching full title at every zoom level. Define zoom bounds and density thresholds from the tested prototype, not arbitrary visual preference.

## 6. Shared state, filters, and URL behavior

Extract a small library controller used by both renderers. Keep graph layout/camera state separate from catalogue state.

```ts
type LibraryState = {
  query: string;
  collections: string[];
  tags: string[];
  technologies: string[];
  formats: string[];
  view: 'list' | 'map';
  selectedTopic: string | null;
};
```

### URL contract

Use existing parameter names and allow repeated values:

```text
/visualizations?view=map&collection=aws&collection=kubernetes&tags=Networking&topic=vpc-flow
```

- `q`, `collection`, `tags`, `technologies`, and `format` retain existing meaning.
- `view` chooses the renderer; absent or invalid values resolve to List.
- `topic` selects a valid matching public slug, with no automatic navigation.
- Preserve section fragments and unrelated query parameters when editing owned parameters.
- Push history for committed filter changes, view switches, and topic selections. Replace history for debounced query typing to avoid one Back entry per keystroke.
- Handle `popstate` by restoring controls, matching results, renderer, and selection without writing a new history entry.
- Ignore invalid values safely; do not create nodes or links from query text. Avoid rewriting URLs merely because initial hydration occurred.
- Keep camera position ephemeral. Do not add local storage or accounts for persistence.

### Search and filtering rules

- OR within each group, AND across groups; query matching is another AND condition.
- Use native checkbox groups in labeled disclosure panels for multi-select filters. Provide selected counts and a button for removing each active chip.
- Collection pages maintain their route's collection scope. Do not offer controls suggesting that another collection's missing data can appear there; link to the full catalogue for that action.
- Debounce search input around 150–200 ms. Increment a request generation ID on every relevant state change; discard obsolete asynchronous Pagefind responses, including responses completing after reset.
- Cache the Pagefind initialization promise and a bounded set of recent query results. Do not reload the search module on every keystroke.
- Normalize returned URLs using the URL parser and canonical pathname comparison. Test both legacy `.html` and rebuilt paths, including anchors and trailing slashes.
- Combine Pagefind matches with local title/metadata matches so available index results do not suppress a direct title match. Preserve title relevance in List ordering where possible; the map keeps stable positions.
- When Pagefind is unavailable, use local metadata search and show concise status that full-text search is unavailable. Do not claim that metadata fallback searches topic prose.
- Keep status, empty state, result count, and selected topic consistent across both views. Announce result changes without reading the entire inspector on every update.
- Scope `/` and Escape shortcuts appropriately. Never intercept typing in inputs, textareas, selects, or editable content.

## 7. Responsive behavior and accessibility

### Desktop and narrow layouts

- At approximately 1000 px and above: the map fills the canvas and a roughly 390 px inspector drawer overlays its right edge after selection.
- Between approximately 760 and 999 px: map above inspector, with controls wrapping naturally.
- Below approximately 760 px: default List remains useful; explicit Map shows a collection overview and a selected-topic neighborhood with the inspector below. Keep full-title selection available through the topic selector. Do not squeeze the full desktop diagram into a phone screen.
- At 320 px: controls stack, titles wrap, touch targets remain usable, and there is no page-level horizontal overflow. The map clips only its own world surface.
- On touch screens, retain ordinary page scrolling. Use explicit camera controls and topic selection for the baseline interaction; free touch pan/pinch is optional and should be added only if it coexists reliably with scrolling and browser magnification.
- At 200% zoom, use the corresponding narrow layout and allow vertical document scrolling. Avoid inspector or toolbar overlays that obscure content.

### Keyboard and assistive technology contract

- Use native buttons, links, selects, checkbox groups, and labeled regions. Do not make every node a generic clickable `div`.
- Map/List buttons expose `aria-pressed` and the controlled region. Node buttons expose selected state with `aria-pressed`; full title is the accessible name.
- Provide a full-title topic selector, ordinary inspector links, and an explicit “Go to topic details” control. Users never need a mouse or spatial arrow-key navigation to discover or open a reference.
- Tab order follows a stable collection/title sequence, independent of physical coordinates. Hide excluded nodes from both the accessibility tree and tab order.
- Selecting a node does not move focus unexpectedly. Escape clears selection when focus is within the map; return focus sensibly if a control's selected content is removed.
- Keep SVG connectors noninteractive and `aria-hidden`; all relationship information appears in the inspector's semantic list.
- Selected state uses an outline/text cue as well as color. Subdued nodes and metadata still meet contrast requirements.
- Target controls at least 44 × 44 CSS pixels where practical. Verify 4.5:1 text contrast and 3:1 essential UI/focus contrast.
- Honor reduced motion with immediate camera/state updates. Normal transitions remain short and interruptible.

### Progressive enhancement

Server-render the ordinary catalogue with real topic links. Hide nonfunctional map controls until initialization succeeds. An explicit map URL still yields the usable catalogue if JavaScript is disabled or map initialization fails. Mount the enhanced view only after its data and event handlers are ready; preserve List as a working fallback if rendering fails.

No-JavaScript users can read summaries, open all topics, and use collection navigation. Interactive filters need not pretend to work without JavaScript; provide a short explanation and keep navigation available. Do not duplicate every summary in hidden graph DOM or the Pagefind index.

## 8. Deliverables and implementation sequence

The visual generator applies to the substantial discovery redesign, adapted to an interface rather than a new infrastructure explainer. This plan does not replace its specification/prototype deliverables. No MDX topic should be created for the catalogue UI.

### Phase 1 — Baseline and detailed visual specification

1. Read current repository instructions, brief, writing guide, and full visual generator; inspect any changes since this plan.
2. Run existing validation before editing; record pre-existing failures separately.
3. Successfully inspect the reference's desktop and mobile interactions, if browser/network access permits. Record observed behavior separately from proposed behavior.
4. Inventory real metadata, long titles, isolated nodes, manual links, and draft state. Calculate candidate/overview edge counts.
5. Create `guide/topics/topic-mesh/topic-mesh-visual-spec.md` using the generator's section 13 structure, including all applicable per-visual contracts, source anchors, acceptance checks, integration status, and accuracy worksheet conclusions.
6. Specify three connected compositions: collection overview, selected-topic neighborhood/inspector, and filtered/mobile discovery state. Use one persistent scenario: finding VPC Packet Flow, inspecting a Networking connection, then opening the needed reference.
7. Limit rich interactions to selection/traversal, shared filtering, and camera exploration. Explain why infrastructure failure scenarios and operational checklists are inapplicable to this discovery UI; use empty search and unavailable enhancement as its meaningful failure states.

Exit: The specification resolves information architecture, relationship meaning, display rules, layout, responsive behavior, and concrete acceptance criteria without inventing new subject content.

### Phase 2 — Complete working design prototype

1. Build `guide/topics/topic-mesh/topic-mesh-visual-prototype.html`, self-contained and outside published paths.
2. Use a snapshot of all actual catalogue metadata, clearly dated in the artifact. Support selection, inspector traversal, filters, Map/List, reset, camera controls, empty results, and the mobile composition.
3. Include a readable no-JavaScript fallback, compact navigation to the prototype's demonstrations, relationship legend, and source links.
4. Inspect desktop, tablet, 375 px, and 320 px layouts; verify keyboard use, touch selection, reduced motion, 200% zoom, and long titles.
5. Exercise the 50-node test fixture separately. Tune edge budget, layout spacing, label presentation, and zoom bounds based on observed results.
6. Present the completed spec and prototype for design review before production integration when approval remains needed. Honor any implementation/design authorization already given; do not ask the user to approve routine internal choices.

Exit: A working complete design can be evaluated with real topics. Any remaining visual tradeoffs or unrun checks are recorded explicitly.

### Phase 3 — Graph data and shared catalogue state

1. Introduce typed metadata projection, URL resolution, graph generation, and relationship validation.
2. Correct the invalid OAuth related slug after verifying the intended target.
3. Extract existing search/filter logic into a library controller with URL parsing/serialization and stale-search protection.
4. Implement multi-select filters, removable chips, deterministic reset, and Back/Forward behavior for the existing List view first.
5. Add small focused checks for graph integrity, relationship provenance, filter combinations, URL round trips, and async query races.

Exit: List view and collection pages still work; the graph receives a validated data projection and the same result set.

### Phase 4 — Production map and inspector

1. Build the small Astro components and TypeScript modules listed below, translating the approved prototype into shared production tokens.
2. Implement deterministic layout, connector rendering, selection, full-title selector, inspector, and explained neighbor traversal.
3. Add camera controls and pointer handling, then responsive neighborhood mode and reduced-motion behavior.
4. Wire Map/List to shared state and URLs; initialize progressively and keep fallback recovery available.
5. Check selected-topic removal, zero/one result, no connections, invalid URL selection, initialization failure, and repeated view changes.

Exit: The feature works on `/visualizations?view=map`, with no regression to catalogue links or search.

### Phase 5 — Discovery integration and release validation

1. Add homepage and collection-page entry links; keep existing discovery defaults.
2. Update the visual specification with canonical production files and integration status. Keep the prototype as a historical design artifact, not a second maintained implementation.
3. Run complete required checks and browser acceptance cases below. Capture representative desktop/mobile screenshots and report any unavailable browser coverage.
4. Review the diff for generated files, duplicated content, new dependencies, broken legacy links, and unintended publication changes.
5. Hand off the completed implementation with validation evidence. Do not commit, push, or deploy without the applicable explicit user authorization.

Exit: The map is discoverable, accessible, technically validated, and ready for the user's publishing workflow.

## 9. Proposed file map

Names may be consolidated during implementation where doing so keeps modules smaller and clearer.

| File | Responsibility |
| --- | --- |
| `guide/topics/topic-mesh/topic-mesh-visual-spec.md` | Full design contract and integration record. |
| `guide/topics/topic-mesh/topic-mesh-visual-prototype.html` | Working design artifact, excluded from publication. |
| `src/lib/topic-graph.ts` | Typed node projection, edge reasons, ranking, and validation. |
| `src/lib/topic-url.ts` | Canonical topic href resolution and search pathname matching. |
| `src/lib/library-state.ts` | Pure filter and URL state operations. |
| `src/scripts/library-explorer.ts` | Controller, Pagefind coordination, result notifications, history. |
| `src/scripts/topic-map.ts` | Map lifecycle, camera, selection, pointer handling, renderer updates. |
| `src/lib/topic-map-layout.ts` | Deterministic layout and collision/fit calculations. |
| `src/components/LibraryExplorer.astro` | Shared tools, view switch, results, and progressive enhancement. |
| `src/components/LibraryFilters.astro` | Native multi-select filter groups and chip structure. |
| `src/components/TopicMap.astro` | Viewport, connector layer, node controls, legend, camera controls. |
| `src/components/TopicInspector.astro` | Selected topic and semantic relationship list. |
| `src/components/TopicCard.astro` | Existing List renderer; change only for shared identity/state hooks. |
| `src/pages/visualizations.astro` | Full catalogue enables map capability. |
| `src/pages/index.astro`, `src/pages/[collection].astro` | Entry links and scoped List integration. |
| `src/content/topics/aws-identity-credential-flows.mdx` | Correct invalid related target only. |
| `src/styles/global.css` | Only shared control/token refinements; keep map composition styles scoped. |
| `scripts/check-topic-graph.mjs` or a build-time validation hook | Validates graph references and invariants using the same projection. |
| `tests/topic-mesh/` | Focused logic fixtures and browser smoke coverage, with a documented runner. |
| `package.json` | Add scoped test commands and dev-only browser tooling if needed. |

Do not hand-maintain a graph JSON file, insert catalogue cards manually, edit generated legacy copies, or add prototype files to routing/search. Keep browser automation dependencies development-only.

## 10. Verification and acceptance matrix

| Area | Required evidence |
| --- | --- |
| Build and metadata | `npm run check`, `npm run build`, and `npm run check:links` pass; all graph targets resolve; no duplicate/self edges. |
| Edge semantics | Manual references retain provenance; shared technology/tag reasons match metadata; collection/format alone never creates an edge; inferred overview budget holds. |
| Real catalogue | Every currently listed entry appears in both views; existing URLs and source content remain intact; draft is not presented as reviewed. |
| Selection | Mouse, tap, keyboard, topic selector, and neighbor selection update the same inspector; ordinary Open visual links work. |
| Filters | OR within groups and AND across groups; chips removable; reset deterministic; Map/List IDs and counts agree. |
| Search | Title and full-text queries work against the production Pagefind build; metadata fallback is truthful; rapid typing/reset cannot restore stale results. |
| URL/history | Existing query URLs still work; repeat filters, selection, view, refresh, deep links, and Back/Forward restore state; fragments survive. |
| Geometry | Nodes/lines stay aligned through pan, zoom, resize, font readiness, filtering, and repeated view switches; long titles do not collide. |
| Empty/invalid cases | Zero and one result, isolated topic, excluded selection, missing query slug, and failed map initialization remain understandable and recoverable. |
| Accessibility | Keyboard-only completion; no focus trap; non-color selection; live result announcements; no serious/critical automated accessibility findings on changed surfaces. |
| Responsive | Inspect 1440, 1024, 768, 375, and 320 px, plus 200% browser zoom, portrait/landscape, and touch scrolling. No page overflow or obscured controls. |
| Reduced motion / no JS | No continuous motion; reduced-motion state changes immediate; no-JavaScript catalogue and topic navigation remain usable. |
| Growth | 50-node fixture stays navigable without label collisions; graph edge count and initial fit remain useful; no unbounded simulation. |
| Performance | Proposed targets: added map code ≤40 KB gzip excluding existing Pagefind; no idle animation loop; selection/filter paint under 100 ms excluding index/network search on a documented test device. Measure and record, not assume. |
| Regression | Homepage catalogue, four collection pages, header navigation, legacy links, rebuilt topic links, and existing topic-page Related Visuals still function. |

Run browser tests against the built preview, since the development server does not provide the final Pagefind index. Cover Chromium and Firefox automatically where available, and inspect Safari/mobile behavior when tooling or devices permit. Missing browser access must be reported rather than counted as a pass. Use automated geometry/state checks plus human screenshot inspection; screenshots alone cannot validate keyboard or search behavior.

For this planning-only change, validate document structure, repository references, and consistency. Product builds and browser tests become necessary when implementation begins.

## 11. Risks and resolution strategy

| Risk | Resolution |
| --- | --- |
| A dense graph looks impressive but obscures relationships | Sparse overview, selection emphasis, explicit reasons, and a 50-node growth check. |
| Users interpret a line as a dependency | Dashed undirected associations, plain legend, reason text, no traffic arrows. |
| A 2D interpretation misses the reference's appeal | Evaluate the full working prototype before integration; record whether a spatial 3D requirement remains. |
| Long titles force unreadable nodes | Test real content, wrap labels, grow the world surface, keep full-title selector/inspector. |
| Graph and List produce different search results | One state controller and one matching-ID set. |
| Search races or history updates leave stale selection | Generation guards, explicit state transitions, URL restoration tests. |
| Mobile map traps scrolling or shrinks text | Mobile neighborhood composition, native controls, preserved browser scroll/zoom. |
| Layout work delays basic discovery value | Begin with a deterministic organic distribution, then add camera and direct node dragging without a continuous simulation loop. |
| Prototype becomes a duplicate content source | Snapshot only for approval; production reads collection; record integration and freeze artifact. |

Rollback is additive and simple: disable the Map capability and remove map entry links while leaving the working List controller and existing topic URLs in place. No content migration or data restoration is required.

## 12. Boundaries and subsequent decisions

This plan does not add prerequisites, progress tracking, AI recommendations, accounts, analytics, a graph database, new topic explainers, or a new publishing system. It does not upgrade unrelated legacy content or change the homepage default.

Possible later work, contingent on the initial result: make Map the default discovery view, add editorially typed relationships with authored explanations, or explore a true 3D layout with equivalent accessibility. These are not prerequisites for the initial topic mesh.

The implementation and required design artifacts were completed under the user's authorization. The visual specification records the canonical production paths and the prototype remains an approval/history artifact.

## 13. Sources and repository anchors

- [Confirmed site rebuild brief](../SITE-REBUILD-BRIEF.md): product scope, discovery/filter contract, visual semantics, architecture, publication gates.
- [Repository working agreement](../AGENTS.md): authoring workflow, canonical sources, approval handling, and no-commit rule.
- [Writing guide](../WRITING-GUIDE.md): reader-facing labels, summaries, and explanations.
- [Visual specification generator](INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md): detailed specification, working prototype, and validation process.
- [Content schema](../src/content.config.ts): validated metadata and publication states.
- [Current library explorer](../src/components/LibraryExplorer.astro): existing search, filters, cards, and URL behavior.
- [Current related visuals](../src/components/RelatedVisuals.astro): editorial overrides and recommendation scoring.
- [Catalogue constants](../src/lib/catalog.ts): collections and content formats.
- [The AI Coding Dictionary](https://www.aicodingdictionary.com/): visual inspiration; no source code or content reuse proposed.

During implementation, verify any newly introduced browser/library API assumptions against current primary documentation. The map itself makes no new AWS or Kubernetes mechanism claims; it exposes relationships grounded in catalogue metadata.
