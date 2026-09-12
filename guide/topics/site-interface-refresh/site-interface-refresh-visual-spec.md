# Infra Illustrated site interface refresh

Status: Approved for integration  
Version: 1.0  
Target audience: Working developers building cloud, platform, DevOps, and SRE mental models  
Page promise: Put a useful infrastructure reference within one clear selection, search, or scan.  
Persistent scenario: A reader arrives with a mechanism to recall, narrows the library, opens one reference, and finds the first useful model quickly.  
Scope: Homepage, catalogue, collection pages, shared topic opening, related references, shared typography and states.  
Non-goals: Rewriting technical topic content, changing routes or navigation labels, redesigning legacy explainers before their editorial migrations, adding light mode, or changing diagram semantics.  
Visual thesis: A technical atlas with a legible map and a compact editorial index.  

## Semantic color and diagram grammar

- Cyan identifies shared library actions and active infrastructure.
- Collection colors identify AWS, Kubernetes, DevOps & SRE, and Foundations in navigation and framing.
- Green, amber, red, purple, blue, solid connectors, and dashed connectors retain the meanings in `SITE-REBUILD-BRIEF.md` inside technical diagrams.
- A solid tree connector means a visible hierarchy. Selection increases contrast instead of adding decorative motion.
- Rounded rectangles use 10-16px radii. Collection switches may use pills because they form one segmented control.
- Body copy starts at 16px. Controls start at 14px. Secondary metadata starts at 12px.

## Narrative sequence

| # | Section | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Topic tree | Where does my question belong? | Root and collection hierarchy | Expand a collection, select a topic, reset | The library has four stable collections and independently useful topics. |
| 2 | Catalogue | Can I find a reference directly? | Compact search and editorial index | Search, filter, switch view, clear | Search and filters lead directly to content without a marketing preamble. |
| 3 | Collection page | What is available in this system? | Compact collection introduction plus index | Open a topic or map view | Collection identity supports discovery without changing diagram semantics. |
| 4 | Topic opening | What will this page teach me? | Compressed title, summary, metadata, section navigation | Follow deep links and connected references | The first useful model appears near the initial viewport. |

## Visual 1: Responsive topic-tree discovery

### Purpose

Resolve the collision between the immersive desktop map and the narrow-screen control stack while preserving the approved full-viewport tree.

### Learner question

Which collection contains the mechanism I need, and what can I open from it?

### Persistent scenario state

The reader has arrived but has not yet chosen a collection.

### Concepts and actors

- Infra Illustrated brand
- Four collection filters
- Search and advanced filters
- Root node
- Collection nodes
- Topic nodes
- Topic inspector
- Fit, zoom, and reset controls

### Composition

Desktop keeps the brand at top left, the collection switch at top right, search below the brand, the hierarchy in the center, camera controls at the bottom, and the inspector in a dedicated right column. Connectors remain visible in the default state.

Below 760px, controls occupy normal rows above the canvas. The collection switch scrolls horizontally on one line. The canvas receives a bounded height and no control overlays. Selecting a topic stacks the inspector below the canvas.

### Interaction

Collection buttons expand one branch at a time. Topic selection opens the inspector. Reset returns to the root and four collections. Keyboard arrow keys pan the canvas. Search and filter state stays in the URL.

### Data or content states

- Initial: four collapsed collections
- Expanded: one visible topic branch
- Selected: one topic plus connected references
- Filtered: only matching collections and topics
- Empty: a clear-filter action

### Failure or edge state

If full-text search fails to load, title and metadata matching continues and the status explains the fallback.

### Required copy

- `Infrastructure, mapped.`
- `Choose a collection to reveal its topics.`
- `Search systems, services, or concepts`
- `No matching topics`

### Accuracy caveats

Connections describe editorial or metadata relationships. They do not imply prerequisites or a prescribed learning path.

### Mobile behavior

Brand, collection switch, search, canvas, camera controls, results count, catalogue link, and inspector occupy separate rows. The canvas does not sit under another control.

### Accessibility

Native buttons and select controls expose state. The canvas has keyboard instructions. Selection updates a polite live region. Reduced motion changes camera movement to immediate repositioning.

### Source anchors

- `SITE-REBUILD-BRIEF.md`, Discovery and Accessibility sections
- `AGENTS.md`, Visual system and catalogue contracts

### Acceptance checks

- No overlap at 320px, 390px, or 200% zoom.
- All collection and topic controls have at least a 44px touch target.
- The root label and collection connectors are readable before interaction.
- The selected inspector never covers the brand or collection controls.

## Visual 2: Compact catalogue search

### Purpose

Move the discovery controls and first results into the initial viewport while removing the generic oversized gradient hero.

### Learner question

Can I locate a reference by title, collection, technology, tag, or format?

### Persistent scenario state

The reader knows approximately what they need and is narrowing the library.

### Concepts and actors

- Compact page title and summary
- Collection switch
- Search input
- Four filter groups
- Active filter chips
- Result status
- List and map view switch
- Topic index

### Composition

The intro uses solid off-white type with one cyan phrase. Search follows immediately. List view uses a two-column editorial index on wide screens, with featured topics allowed to span columns. Each topic has a collection rail, title, summary, format, difficulty, and tags. Decorative generic glyphs are removed.

### Interaction

Search shows a searching status while Pagefind resolves. Filters update the URL. View changes preserve the same search state. Clear removes every active filter.

### Failure or edge state

The empty state names the problem and exposes `Clear filters`. Pagefind failure announces local metadata matching rather than silently degrading.

### Mobile behavior

The intro, collection switch, search, filters, and list use one column. Collection filters scroll instead of wrapping into a tall block.

### Accessibility

Status changes use `aria-live`. Filter labels remain visible. Every filter and result is keyboard operable.

### Source anchors

- `SITE-REBUILD-BRIEF.md`, Search behavior and Discovery sections

### Acceptance checks

- Search and part of the first result are visible at 1280x900.
- No decorative gradient text or repeated fake preview glyph remains.
- Loading, empty, fallback, and populated states have reader-facing feedback.

## Visual 3: Collection index hierarchy

### Purpose

Keep collection pages consistent while reducing empty hero space and making their available references the dominant content.

### Learner question

What can I inspect in this collection right now?

### Composition

Collection label, concise description, count, map link, and search form one compact opening. The collection color appears in the heading and topic rails. Topic entries use the shared editorial index.

### Interaction

Search and filters work as in the full catalogue. The map link opens the full catalogue with collection state encoded in the URL.

### Mobile behavior

Metadata wraps below the summary and the first result remains close to the initial viewport.

### Accessibility

Collection color is supplementary. Text labels always identify the collection.

### Source anchors

- `SITE-REBUILD-BRIEF.md`, Primary collections and Discovery sections

### Acceptance checks

- All four collection pages share mechanics but retain clear collection identity.
- The first topic begins substantially higher than in the previous layout.

## Visual 4: Topic opening and connected references

### Purpose

Reduce title dominance, keep provenance visible, and bring the first teaching section into view sooner.

### Learner question

What question does this page answer, how current is it, and where should I begin?

### Composition

Breadcrumb, compact format labels, title, summary, taxonomy, and dates remain in that order. Title sizing responds to a title-length class. The section navigation drops decorative ordinal numbers. Related references use one prominent item followed by compact links and explain why each item is connected when metadata permits.

### Interaction

Section navigation uses stable fragments. Taxonomy links open filtered catalogue views. Related references open directly.

### Mobile behavior

Long titles use a smaller cap, metadata remains at least 12px, and the horizontal section navigator retains 44px targets.

### Accessibility

Heading hierarchy and fragment targets remain stable. Inline citations inherit body size. Focus treatments remain visible.

### Source anchors

- `SITE-REBUILD-BRIEF.md`, Topic-page experience and Minimum content contract

### Acceptance checks

- No title overwhelms a 390px viewport.
- The first section heading appears near the first viewport at common laptop sizes.
- Related references do not use three identical cards.

## Persistent page elements

The brand, stable primary navigation, dark theme, collection colors, semantic diagram colors, shared footer, search state, and topic routes remain unchanged.

## Responsive and accessibility requirements

- Test at 320px, 390px, 768px, 1024px, and 1280px.
- Test at 200% browser zoom.
- Keep controls at least 44px in both dimensions where practical.
- Keep body text at least 16px, controls at least 14px, and secondary metadata at least 12px.
- Preserve visible focus and reduced-motion behavior.
- Prevent page-level horizontal scrolling.

## Prototype implementation contract

The approval prototype is self-contained and demonstrates the four page surfaces. It includes working collection selection, catalogue filtering, topic selection, an empty state, and a mobile-safe stacked layout.

## Integration guidance

- Canonical homepage: `src/pages/index.astro`
- Shared catalogue: `src/components/LibraryExplorer.astro`
- Tree: `src/components/TopicTree.astro` and `src/components/map/tree-camera.ts`
- Cards/index: `src/components/TopicCard.astro`
- Topic opening: `src/components/TopicHeader.astro`, `src/components/SectionNav.astro`, and `src/styles/topic.css`
- Shared shell and tokens: `src/layouts/BaseLayout.astro` and `src/styles/global.css`
- Integration status: complete in the shared Astro interface

## Deep-dive handoffs

None. Legacy topic redesigns continue through the existing topic migration workflow rather than this shared-shell refresh.

## Page-level acceptance criteria

- Routes, nav labels, anchors, and catalogue metadata remain stable.
- Homepage controls and content never overlap from 320px upward.
- Catalogue and collection pages expose real results sooner.
- Generic gradient headline treatment and repeated card glyphs are removed.
- Shared interface labels meet the documented minimum type scale.
- Search exposes populated, loading, empty, and fallback states.
- Topic introductions are compact without hiding required metadata.
- `npm run verify` passes.
- Representative desktop and mobile screenshots show no clipping or overlap.

## Source index

- `SITE-REBUILD-BRIEF.md`
- `WRITING-GUIDE.md`
- `AGENTS.md`
- `guide/INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md`

## Validation record

- Validated on 2026-09-12 with `npm run verify`: Astro checks, production build, Pagefind indexing, graph validation, and generated-link validation passed.
- Inspected representative homepage, catalogue, collection, and topic layouts at 1280x900, 390x844, and 320px widths.
- Confirmed keyboard-focus styling and reduced-motion behavior in the shared CSS and prototype.
