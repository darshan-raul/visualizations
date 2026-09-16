# Infra Illustrated — Site Rebuild Brief

Status: Confirmed

Confirmed on: 2026-09-05; topic console design language confirmed on 2026-09-15

This document is the persistent source of truth for the planned transformation of this repository. It records the decisions reached during the product grilling session. Future work should follow this brief unless the user explicitly changes a decision.

## Adopted visual authoring workflow

Adopted on 2026-09-10: use [Infra Illustrated — Universal Visual Specification Generator](guide/INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md) for new topic visuals and substantial visual rebuilds. It defines the research, narrative design, detailed specification, working approval prototype, and validation process. [AGENTS.md](AGENTS.md#visual-design-workflow) records the repository workflow and artifact locations; [WRITING-GUIDE.md](WRITING-GUIDE.md) governs reader-facing copy.

The specification and HTML prototype are pre-integration design artifacts, stored under `guide/topics/<topic-slug>/`. Review the completed direction before full integration when approval is still needed; existing user authorization carries forward. After integration, one MDX topic and its components remain the canonical published content.

Apply the generator's existing-project rule: preserve this brief's audience, focused topic formats, static Astro/MDX architecture, shared visual semantics, progressive enhancement, and publication gates. Its overview size and example diagram grammar adapt to the topic and existing system. Routine corrections do not require a fresh prototype.

## Confirmed topic console design language

Confirmed after the RDS Backup Retention and AWS ENI pilots on 2026-09-15. Every topic visualization, whether a Visual Brief, Deep Dive, Flow Explorer, or Operational Reference, should present its teaching journey inside **one persistent console**. This applies to new topics and to existing topics as they migrate. The homepage, catalogue, collection pages, and spatial topic tree remain discovery surfaces rather than topic consoles.

The console contains the topic title and metadata, internal site navigation, a compact grouped view index, one active visual canvas, a contextual inspector, a bottom takeaway, sources, related visuals, and the footer. The reader should recognize one environment while moving between views. Use the RDS pilot for the time and recovery model and the ENI pilot for the grouped index and ownership/packet model; extract their shared shell and tokens into neutral reusable components before scaling migration. Topic-specific diagrams and interaction logic remain distinct.

Group views by the concepts readers need to find, not by an arbitrary count. A focused brief may have two or three short groups; a deep dive may need more. Use native disclosure groups with short, single-line view labels, a visible `current / total` counter, and one group expanded after view selection. An index must remain usable at 320 px and 200% zoom without overlapping text or consuming the visual canvas. Preserve every major view's stable fragment, browser history behavior, and older section anchors during migration. Previous/current/next controls may sit below the canvas when they help the reader follow a sequence; avoid a duplicate row of every view number.

The active view's title and concise diagram labels may sit above or inside the canvas. Explanation, caveats, operational evidence, and sources belong in the right inspector or below the visual. Prose should clarify what the diagram leaves implicit rather than restate each node. On narrower screens, move the inspector below the canvas; keep the index compact and its groups operable by touch and keyboard. If JavaScript fails, render all views in the same console in narrative order with their explanations below each visual, and keep index anchors and sources reachable.

Use arrows and motion to teach direction, causality, timing, state change, or a failure boundary. Animate the changed actor or path, and keep unchanged context stable. Give readers manual steps, replay, or pause for a sequence that is difficult to inspect in real time. Show the meaning in text and connector style as well as color. Respect reduced motion by retaining the selected state and readable path without movement. The three-or-fewer hero interaction budget continues to apply; the console itself is a common frame, not a reason to turn every view into a simulator.

The [console migration checklist](guide/CONSOLE-MIGRATION-CHECKLIST.md) records the shared shell work, topic inventory, per-topic gates, and remaining gaps in the two pilots. Its status is planning information; this brief governs the design decision.

Confirmed on 2026-09-16: discovery surfaces share the topic console's outer visual frame—bordered environment, compact masthead, dark technical backdrop, typography, and status-like footer—without inheriting the topic console's teaching controls. The homepage keeps the topic tree as its primary workspace; catalogue and collection pages keep search, filters, maps, and lists. A grouped view index, active teaching canvas, inspector, and takeaway remain topic-page semantics rather than decorative site chrome.

## Product identity

- Product name: **Infra Illustrated**
- Display lockup: **Infra, Illustrated.**
- Tagline: **Visual deep dives into cloud infrastructure.**
- The existing dark, technical, terminal-adjacent character should evolve into a more disciplined visual system without losing its current personality.
- The name was screened for obvious conflicts, but this was not trademark or domain clearance. There is meaningful name-family adjacency to the existing "Systems Illustrated" website; the user accepted the recommended name after this was disclosed.

## Purpose and audience

Infra Illustrated is a personal and publicly usable visual reference library for cloud infrastructure concepts.

The primary audience is working developers moving into DevOps, SRE, and cloud infrastructure, including engineers filling gaps in their mental models.

The primary product promise is:

> Make complex AWS, Kubernetes, DevOps, and SRE systems visually intuitive without sacrificing technical depth.

The project is primarily something the owner can consult when recalling or explaining a concept. Other people should still be able to trust and use it as a technical reference.

It is explicitly **not** being designed as:

- A professional portfolio
- A sequential course or curriculum
- A certification-preparation product
- A prescribed learning path or roadmap
- A progress-tracking platform
- A commercial or community publishing platform

Topics may be created ad hoc according to current interest or need. Coherence comes from categories, tags, shared formats, and editorial standards rather than a curriculum.

## Scope

AWS and Kubernetes are the two main subject pillars.

Supporting material is appropriate when it strengthens those pillars, including:

- DevOps and SRE practices
- Linux and networking foundations
- Security and identity
- Containers
- CI/CD
- Observability
- Databases and storage
- Distributed-systems concepts

Broad multi-cloud coverage is not an initial goal.

The system should comfortably support at least 50 high-quality visualizations without requiring a redesign.

## Information architecture

### Primary collections

Every visualization has exactly one primary collection:

1. AWS
2. Kubernetes
3. DevOps & SRE
4. Foundations

Do not create many sparse top-level collections. A tag may become a collection later only when there is enough substantial content to justify it.

### Tags

Visualizations can have multiple cross-cutting tags, including:

- Networking
- Security
- Databases
- Observability
- CI/CD
- Containers
- Identity
- Troubleshooting

Technology-specific tags such as RDS, EKS, IAM, CoreDNS, and OpenTelemetry are also supported.

### Discovery

Homepage direction confirmed on 2026-09-11 and revised on 2026-09-12: use a full-viewport, pannable 2D topic tree. The root opens into four collection branches; selecting a collection reveals its topic leaves while keeping the overall hierarchy legible. Collection nodes expand and collapse their leaves; the brand stays at the top left, clickable collection filters stay at the top right, and topic summaries open in a dedicated right-hand region that the tree canvas never occupies. On narrow screens, the tree and summary stack in separate rows. Preserve the dark palette, accessible topic selection and list fallback, and shared search/filter state. The user explicitly authorized direct homepage integration without another approval prototype; topic explainers follow the console design language above.

The homepage should become a library discovery interface rather than a course landing page. It should provide:

- Search
- Primary collection filters
- Tag and technology filters
- Format indicators
- Recently added or reviewed material
- A small featured area

The site should include:

- Dedicated AWS, Kubernetes, DevOps & SRE, and Foundations collection pages
- A complete filterable visualizations catalogue
- Stable topic URLs independent of collection membership
- Related Visuals based on shared metadata with optional manual overrides

Do not present related content as a required next lesson or prerequisite sequence.

### Search behavior

Search should index:

- Titles and summaries
- Collections, tags, and technologies
- Headings and prose
- Code snippets
- Individual sections where practical

Title and heading matches should rank more strongly than ordinary body matches.

Launch filters:

- Collection
- Topic tag
- Technology
- Content format

Use OR behavior within a filter group and AND behavior across filter groups. Filters must work without a text query, appear as removable chips, provide a one-click reset, and persist in the URL.

Difficulty remains visible metadata but does not need to be a launch filter.

## Content model

### Normal content boundary

One visualization should normally answer one concrete concept, mechanism, or operational question. Examples include how CoreDNS resolves a Service or what happens when an RDS snapshot expires.

Broader system-map explainers, such as Kubernetes Networking, are allowed when the subject benefits from an integrated view. Not every visualization should become encyclopedic.

### Supported formats

Each topic declares one of these formats:

- **Visual Brief** — one focused mechanism or question
- **Deep Dive** — a multi-section system explanation
- **Flow Explorer** — an animated or stepwise request, packet, data, or control flow
- **Operational Reference** — searchable commands, comparisons, configuration, or diagnostics

The format should be visible on catalogue cards and topic pages.

### Minimum content contract

Every published visualization should include:

- What the subject is and why it matters
- A visual mental model
- The important flow, behavior, or mechanism
- Material caveats or common misconceptions
- Practical or operational implications
- Authoritative references
- Published and last-reviewed dates

Configuration, troubleshooting, security, costs, and failure modes should be included when they materially help the topic. They are not mandatory filler.

### Progressive depth

Pages should begin with a concise, plain-language mental model and then progress into implementation details and operational nuance.

- Define specialized terms at first use.
- Prefer concrete examples over abstract definitions.
- Link to foundation visuals rather than repeating complete beginner tutorials.
- Separate documented behavior from simplified conceptual models.
- Call out misconceptions directly.
- Avoid marketing language, certification framing, and unnecessary history.

### Topic selection rule

A topic is a strong candidate when at least two of these are true:

- The owner repeatedly needs to recall or explain it.
- Text documentation hides an important sequence or relationship.
- It has a common misconception worth correcting.
- It contains operational trade-offs or failure modes.
- A visual or interaction materially improves understanding.

Maintain a lightweight topic backlog with:

- Working title
- Primary collection and tags
- The mechanism, misconception, or operational question being explained
- Why visualization helps
- Approximate content format
- Status: idea, researching, building, or published

The next topic may be chosen according to current need or curiosity; this backlog is not a roadmap.

## Topic-page experience

### Shared console

Standardize the topic console while keeping each explanatory canvas suited to its mechanism. Each topic page should provide, inside that console:

- Breadcrumb and back-to-collection navigation
- Title and concise summary
- Primary collection, tags, technology labels, format, and difficulty
- Published and last-reviewed dates
- Grouped view index with current/total progress
- One active visual canvas and contextual explanation to its right or below
- Related Visuals
- Sources
- Shared footer

### Views and deep links

Use the console's grouped disclosure index as the default topic structure. A selected view occupies the central canvas; its explanation follows in the inspector or bottom strip. Use tabs only for genuine alternate states or comparisons inside a view. The index is ordinary anchor navigation enhanced by JavaScript, not a tab strip.

Every major view must have a stable fragment or route. View changes should work with browser history, refresh, back/forward navigation, and direct sharing. Preserve published section fragments as aliases when migrating an article or legacy page. Without JavaScript, the same views should remain readable in order inside the console.

### Interaction

Interactivity is optional and must have a teaching purpose. Use it when changing state, stepping through time, comparing scenarios, or inspecting a flow teaches something that a static diagram cannot.

Interactive animation is explicitly allowed when motion materially clarifies sequence, causality, data movement, state transitions, or changes over time. A visualization may use animation, direct manipulation, playback, or step-by-step controls when those are the clearest way to teach the mechanism inside its console view.

Animated explanations must remain understandable and operable without precise timing. Provide pause, replay, or manual step controls when the sequence would otherwise be difficult to inspect, and honor reduced-motion preferences by replacing nonessential movement with immediate state changes or an equivalent static presentation.

Do not add decorative controls merely to make a page feel interactive.

## Visual system

### Direction

Preserve the current dark technical feel while improving typography, spacing, readability, consistency, and accessibility.

Collection colors may distinguish AWS, Kubernetes, DevOps & SRE, and Foundations in navigation and framing. They must not override semantic colors inside diagrams.

### Semantic color conventions

- Blue/cyan: normal flow or active infrastructure
- Green: success or healthy state
- Amber: caution, delay, or transition
- Red: failure, denial, or destructive consequence
- Purple: identity, policy, or control-plane activity

### Diagram conventions

- Solid connectors represent direct interactions.
- Dashed connectors represent asynchronous, optional, inferred, or conceptual relationships; a nearby legend should resolve any ambiguity.
- Motion represents progression or meaningful state change, never decoration alone.
- Important information must not depend on color alone.
- Every important diagram needs an accompanying textual explanation.

### Implementation medium

Prefer, in order:

1. Semantic HTML and CSS
2. Inline SVG
3. Canvas for genuinely dynamic simulations
4. Raster imagery only when illustration or texture is necessary

The site should provide reusable primitives for cards, callouts, code, comparisons, nodes, connectors, legends, timelines, packet steps, and diagnostics. Build small composable primitives rather than a universal diagram language.

Topic-specific compositions and interactions remain welcome, but they should use shared tokens and accessibility behavior.

Light mode is deferred.

## Technical architecture

Introduce a lightweight build-time static architecture:

- Astro
- TypeScript
- MDX for ordinary authored content with embedded visual components
- Astro build-time content collections with a validated schema
- A static full-text search index such as Pagefind
- Static HTML output deployed to Vercel

Use ordinary browser JavaScript for interactions by default. React, Svelte, or another client framework may be introduced for an individual visualization only when that visualization materially benefits from it. Do not adopt a client framework globally without a concrete need.

The site remains free of:

- A database
- User accounts
- Saved progress
- Server APIs
- A CMS
- Behavioral analytics

Progressive enhancement is required: core prose, diagrams, navigation, and sources must remain readable if optional interactive JavaScript fails.

### Content files

Use one canonical MDX content file per topic containing its metadata and explanatory prose, plus optional colocated interactive components and assets.

Create a separate research/source note only when the supporting material is substantial. Do not maintain overlapping outline and deep-dive documents as competing sources of truth.

### Required metadata

Each topic should carry:

- Title
- Concise summary
- Stable slug
- Primary collection
- Tags
- Technologies
- Content format
- Difficulty: foundational, intermediate, or advanced
- Published date
- Last-reviewed date
- Version scope when relevant
- Source references
- Optional related-topic overrides
- Publication state: draft or reviewed/published

There is no stale state, automated age warning, expiry calculation, or scheduled review promise.

## Accuracy and sources

Treat the site as a publicly usable technical reference even though it began as a personal reference.

- Prefer official documentation, specifications, and upstream project documentation.
- Use secondary sources only for interpretation or field experience.
- Place compact citations near version-sensitive or disputable claims.
- Include a complete references section.
- Clearly label conceptual simplifications.
- Do not present inferred cloud-provider internals as documented fact.

Every existing page must receive an editorial rebuild, not just a visual wrapper. Revalidate technical claims, correct misleading simulations, remove unsupported implementation details, restructure content around the new contract, and preserve existing material only where it remains useful and accurate.

Known issues discovered during the initial repository audit include:

- Docker image inspection behavior does not correctly support arbitrary public registries or supplied tags.
- The RDS PITR simulation introduces random output and can describe impossible snapshot timing.
- The OAuth page contains a suspect claim about URL fragments leaking through HTTP Referer headers.
- Some RDS snapshot internals and exact storage behavior are presented too concretely despite AWS exposing them as abstractions.

These examples are not an exhaustive technical review.

## Accessibility, responsiveness, and browser support

Published pages must provide:

- Semantic controls
- Full keyboard operation
- Visible focus treatments
- Sufficient contrast
- Reduced-motion behavior
- Mobile-readable prose and diagrams
- Alternatives or explanations for complex visuals
- Safe horizontal scrolling where unavoidable

Support current evergreen Chrome, Firefox, Safari, and Edge, plus recent mobile Safari and Chrome.

Complex visuals may be easier to explore on desktop, but their core explanation must remain usable on mobile.

## Publication quality gates

Before publication, a rebuilt visualization should pass:

- Content metadata/schema validation
- Successful static build
- Internal-link and source-link validation
- Keyboard-operable interaction checks
- Reduced-motion checks
- Representative desktop and mobile visual checks
- Direct-link checks for major sections
- Technical review against primary sources
- Automated accessibility checks without serious violations
- Browser smoke tests for shared navigation, search, filters, section links, and common interactive controls

Introduce proportionate automation:

- Formatting and linting
- Metadata validation
- Link validation
- HTML and accessibility checks
- A small browser smoke-test suite
- Screenshot checks for shared layouts

Do not build a large unit-test suite for mostly declarative content, and do not initially require screenshot coverage for every bespoke diagram.

## Search-engine presentation

Implement technical discoverability without turning the project into SEO-driven publishing:

- Unique titles and descriptions
- Canonical URLs
- Open Graph metadata
- Sitemap and robots file
- Semantic headings and crawlable prose
- Section anchors
- Structured metadata where it fits naturally

Do not choose topics or publishing schedules based on keyword optimization.

## Migration plan

The rebuild occurs incrementally inside this repository and on one site. Do not create a parallel product or elaborate cutover system.

Temporary coexistence between rebuilt and legacy page designs is acceptable.

### Stage 1: Foundation

- Introduce Astro, TypeScript, MDX, and the content schema.
- Establish shared design tokens, layout components, navigation, collection pages, catalogue, and search.
- Preserve all current public slugs.
- Keep unconverted pages reachable and functional.

### Stage 2: Proving pages and console language

RDS Backup Retention and VPC Packet Flow established the first Astro/MDX editorial migrations. The later RDS and AWS ENI console pilots established the confirmed topic design language above: one console, an active canvas, contextual explanation, meaningful motion, and a compact grouped index. Finish the shared shell extraction and pilot alignment recorded in the checklist before repeating this structure across the catalogue.

### Stage 3: Topic console migration

Migrate each existing canonical Astro/MDX article and the five still-synced legacy HTML pages individually. The EC2 Auto Scaling topic remains a draft until its factual and interaction scope is resolved. [The checklist](guide/CONSOLE-MIGRATION-CHECKLIST.md) holds the current route inventory and topic-specific gates; catalogue metadata and published URLs remain canonical. The exact order may follow topic dependencies and current interest, but the shared console shell should be extracted before broad repetition.

## Repository and publishing governance

- Work directly in the existing project; do not build a separate replacement site.
- Vercel remains the deployment target.
- Preserve existing public URLs even if a topic's collection or tags change.
- No formal external-contribution system is required.
- Document schemas and conventions well enough that future contributions remain possible.
- Do not add behavioral analytics.
- Do not create Git commits or push changes unless the user explicitly asks for that specific commit or push.

## Decision rule for future sessions

When implementation details are unclear, prefer the option that:

1. Improves visual understanding of a real infrastructure mechanism.
2. Preserves technical accuracy and clearly labels simplification.
3. Keeps individual topics independently useful.
4. Reuses shared visual and accessibility primitives without constraining bespoke explanation.
5. Keeps the deployed site static, fast, and operationally simple.
6. Avoids introducing curriculum, accounts, progress tracking, analytics, or unnecessary platform scope.

If a proposed change conflicts with this brief, surface the conflict before implementing it.
