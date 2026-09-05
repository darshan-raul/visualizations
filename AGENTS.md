# AGENTS.md

## Working agreement

- Do not create Git commits or push changes unless the user explicitly asks for that specific commit or push.
- Treat `SITE-REBUILD-BRIEF.md` as the confirmed source of truth for product, design, content, quality, and migration decisions.
- Surface any proposed change that conflicts with the brief before implementing it.

## Repository overview

Infra Illustrated is a static visual reference library deployed on Vercel. The shared shell and catalogue use Astro, TypeScript, validated content collections, and Pagefind. Legacy visualization pages remain self-contained HTML files while they are migrated.

## Architecture

- `src/pages/index.astro` — Infra Illustrated landing page
- `src/pages/visualizations.astro` — complete filterable catalogue
- `src/pages/[collection].astro` — AWS, Kubernetes, DevOps & SRE, and Foundations pages
- `src/content/topics/*.json` — validated catalogue metadata
- `src/components/` — shared UI components
- `src/styles/global.css` — global design system
- Root-level `*.html` visualization files — canonical legacy sources during migration
- `scripts/sync-legacy.mjs` — copies legacy HTML into `public/` before builds
- `SITE-REBUILD-BRIEF.md` — confirmed rebuild plan

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

### Visual system

- Reuse design tokens and shared components; do not copy page-sized CSS implementations.
- Prefer small composable primitives for cards, callouts, code, comparisons, nodes, connectors, legends, timelines, packet steps, and diagnostics.
- Prefer semantic HTML/CSS and inline SVG. Use Canvas only for genuinely dynamic simulations and raster assets only when necessary.
- Preserve the semantic color and connector meanings in `SITE-REBUILD-BRIEF.md`.
- Support keyboard operation, visible focus, reduced motion, sufficient contrast, and readable mobile layouts.

### Catalogue

Cards, collection pages, filters, and search metadata are generated from the topic collection. Never add catalogue cards manually.

## Migration order

The first editorial rebuilds are:

1. RDS Backup Retention
2. VPC Packet Flow

The remaining six legacy pages may be migrated individually after those proving pages refine the system.
