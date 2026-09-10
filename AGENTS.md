# AGENTS.md

## Working agreement

- Do not create Git commits or push changes unless the user explicitly asks for that specific commit or push.
- Treat `SITE-REBUILD-BRIEF.md` as the confirmed source of truth for product, design, content, quality, and migration decisions.
- For new topic visuals and substantial visual rebuilds, read and follow `guide/INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md` in full before designing or implementing. Use the workflow below to apply it in this repository.
- Surface any proposed change that conflicts with the brief before implementing it.

## Repository overview

Infra Illustrated is a static visual reference library deployed on Vercel. The shared shell and catalogue use Astro, TypeScript, validated content collections, and Pagefind. Legacy visualization pages remain self-contained HTML files while they are migrated.

## Architecture

- `src/pages/index.astro` — Infra Illustrated landing page
- `src/pages/visualizations.astro` — complete filterable catalogue
- `src/pages/[collection].astro` — AWS, Kubernetes, DevOps & SRE, and Foundations pages
- `src/content/topics/*.{json,mdx}` — validated catalogue metadata and canonical rebuilt explainers
- `src/components/` — shared UI components
- `src/styles/global.css` — global design system
- Root-level `*.html` visualization files — canonical legacy sources during migration
- `scripts/sync-legacy.mjs` — copies legacy HTML into `public/` before builds
- `SITE-REBUILD-BRIEF.md` — confirmed rebuild plan
- `guide/INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md` — required visual specification and prototype method
- `guide/topics/<topic-slug>/` — topic design specifications and approval prototypes; not published content

Astro generates static HTML into `dist/`. Pagefind indexes generated pages and copied legacy pages after the Astro build. The deployed site has no database, accounts, CMS, server API, saved progress, or analytics.

## Development

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

`predev` and `prebuild` sync root-level legacy pages into `public/`. Edit the root file while a visualization remains legacy; do not edit its generated `public/` copy.

Vercel runs `npm run build` and serves `dist/`. Existing public visualization slugs must remain stable during migration.

## Adding or rebuilding a visualization

### Visual design workflow

Use the [visual specification generator](guide/INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md) for new topics and substantial changes to a page's visual model, narrative, or interactions. Routine copy corrections and small fixes do not require a new specification and prototype.

1. **Establish context.** Read the brief, `WRITING-GUIDE.md`, and the generator, then inspect the relevant canonical page, shared components, tokens, and responsive patterns. Use the requested audience, depth, and learning goal; otherwise keep the brief's audience and topic boundary. Proceed with reasonable defaults and ask at most two concise questions only when missing information would materially change the architecture or visual direction.
2. **Research and sequence.** Verify technical behavior against current primary sources before finalizing visuals. Resolve the generator's accuracy worksheet, choose one persistent scenario, and establish the concept dependency order. Identify real misconceptions, meaningful failure behavior, and operational implications. Date time-sensitive claims and attach primary-source anchors to each major visual.
3. **Write the specification.** Create `guide/topics/<topic-slug>/<topic-slug>-visual-spec.md` using the generator's full section 13 format, including its narrative table, per-visual contracts, integration guidance, acceptance checks, and source index. Aim for 7–12 major visuals for a detailed overview, fewer for focused topics, and at most three hero interactions. Choose the visual forms that teach this topic; do not turn every page into the same template.
4. **Build the approval prototype.** Create `guide/topics/<topic-slug>/<topic-slug>-visual-prototype.html` following sections 14–18. Cover the complete narrative with representative content, working selected hero interactions, a meaningful failure or alternate state, section navigation, and sources. Use the existing visual system, semantic HTML/CSS, inline SVG, and minimal JavaScript. Verify mobile layouts from 320 px, keyboard and touch controls, reduced motion, 200% zoom, and readable core content without JavaScript. An outline or inert mockup does not satisfy the deliverable.
5. **Validate and present.** Complete the generator's factual, narrative, visual, and HTML checks; inspect representative desktop and mobile layouts when browser tools are available. Fix issues and report any checks that could not be run. Link both artifacts and summarize the narrative, visual inventory, selected hero interactions, and material accuracy decisions. When design approval is still needed, present the completed artifacts before full integration; honor approval or implementation authorization already given in the conversation.
6. **Integrate and verify.** Carry the accepted design into one canonical MDX topic and reusable Astro/TypeScript components. Preserve public slugs and section anchors, add validated metadata, and apply the brief's publication quality gates, including `npm run check` and `npm run build`. Record the canonical page path and integration status in the specification; keep the prototype as a design artifact rather than a second maintained implementation.

### Applying the generator to this repository

- The brief governs product scope, architecture, semantic colors, connector meanings, and publication quality. The generator supplies the design method and deliverable contracts; `WRITING-GUIDE.md` governs all reader-facing copy. Its sample colors, diagram grammar, and misconception markers are examples to adapt to these existing rules.
- Keep focused Visual Briefs focused. The generator's detailed-overview defaults do not require every topic to grow into an overview, and interaction must retain the teaching purpose required by the brief. Explain static visual choices in the specification; do not add controls solely to meet an interaction count.
- Self-contained inline CSS/JavaScript is appropriate for the approval prototype. Production implementation must reuse shared tokens and composable components rather than copying a page-sized prototype stylesheet.
- Keep specifications and prototypes under `guide/topics/`, outside `src/content/topics/`, `public/`, and the root legacy HTML sources. Do not add approval artifacts to the legacy sync list, catalogue, routing, or search index.
- The design specification records implementation intent and acceptance criteria. After integration, MDX and its components remain the canonical published explanation; do not maintain overlapping outlines, deep dives, and prototypes as competing content sources. Link proposed deep dives only once their published targets exist.

### Content source

- Add validated catalogue metadata under `src/content/topics/`.
- A rebuilt explainer should use one canonical MDX content file plus optional colocated Astro/TypeScript components and assets.
- Create a separate research note only when the source material is substantial. Do not create overlapping outline and deep-dive documents as competing sources of truth.
- Revalidate existing technical content during migration; do not mechanically wrap legacy HTML.

### Topic contract

Every published topic should include:

- What the subject is and why it matters
- A visual mental model
- The important flow or mechanism
- Material caveats and misconceptions
- Practical implications
- Authoritative references
- Published and last-reviewed dates

Use a scrolling document with deep-linked sections by default. Reserve tabs for genuine alternate states or comparisons. Interactivity must serve a teaching purpose and progressively enhance readable content.

### Editorial voice and tone

- Follow `WRITING-GUIDE.md` for editorial voice, rhythm, and tone.
- Avoid robotic, staccato, LLM-generated summaries and defensive disclaimer boilerplate (e.g., compulsive `> **Model boundary:**` callouts).
- Write like an experienced senior engineer talking to a peer at a whiteboard: technically rigorous, empathetic to common traps and operational scars, with natural sentence cadence and active verbs.

### Visual system

- Prefer visual-first explanations with less prose. Use text to frame, clarify, and document caveats rather than repeat what a diagram already shows; give each major mechanism a diagram, comparison, trace, or compact reference where that materially improves understanding.
- Reuse design tokens and shared components; do not copy page-sized CSS implementations.
- Prefer small composable primitives for cards, callouts, code, comparisons, nodes, connectors, legends, timelines, packet steps, and diagnostics.
- Prefer semantic HTML/CSS and inline SVG. Use Canvas only for genuinely dynamic simulations and raster assets only when necessary.
- Preserve the semantic color and connector meanings in `SITE-REBUILD-BRIEF.md`.
- Support keyboard operation, visible focus, reduced motion, sufficient contrast, and readable mobile layouts.

### Catalogue

Cards, collection pages, filters, and search metadata are generated from the topic collection. Never add catalogue cards manually.

## Migration order

The first editorial rebuilds are:

1. RDS Backup Retention — rebuilt in Astro/MDX
2. VPC Packet Flow — rebuilt in Astro/MDX with cumulative packet traces

The remaining six legacy pages may be migrated individually after those proving pages refine the system.
