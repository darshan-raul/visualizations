# Infra Illustrated — Site Rebuild Brief

Status: Confirmed

Confirmed on: 2026-09-05

This document is the persistent source of truth for the planned transformation of this repository. It records the decisions reached during the product grilling session. Future work should follow this brief unless the user explicitly changes a decision.

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

### Shared shell

Standardize the page shell while keeping the explanatory canvas flexible. Each topic page should provide:

- Breadcrumb and back-to-collection navigation
- Title and concise summary
- Primary collection, tags, technology labels, format, and difficulty
- Published and last-reviewed dates
- Table of contents or section navigation
- Related Visuals
- Sources
- Shared footer

### Sections and deep links

Use a scrolling document with a sticky section navigator as the default structure.

Do not use tabs merely as chapter navigation. Reserve tabs for genuine alternate views, comparisons, or states.

Every major section must have a stable fragment or route. Section changes should work with browser history, refresh, back/forward navigation, and direct sharing.

### Interaction

Interactivity is optional and must have a teaching purpose. Use it when changing state, stepping through time, comparing scenarios, or inspecting a flow teaches something that a static diagram cannot.

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

### Stage 2: First proving pages

Rebuild these first:

1. **RDS Backup Retention** — proves the focused visual explainer, timeline behavior, and technical-correction workflow.
2. **VPC Packet Flow** — proves the interactive flow explorer and more complex visualization primitives.

Use these two pages to refine the architecture and visual system before scaling migration.

### Stage 3: Remaining pages

Migrate the remaining six pages individually:

- Kubernetes Networking
- GitHub Actions Cheatsheet
- OAuth 2.0 and OIDC
- DevSecOps Pipeline
- Docker Multi-Architecture
- OpenTelemetry

The exact order may follow current interest and what the first two migrations reveal.

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
