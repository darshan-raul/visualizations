# Infra Illustrated

**Visual deep dives into cloud infrastructure.**

Infra Illustrated is a static visual reference library focused on AWS, Kubernetes, DevOps, SRE, and the foundations beneath them. Topics are independent references rather than a course or prescribed learning path.

The confirmed product and migration decisions live in [SITE-REBUILD-BRIEF.md](./SITE-REBUILD-BRIEF.md).

Topic visuals now follow one persistent console with a grouped concept index, active canvas, right/bottom explanation, and bottom takeaway. The [console migration checklist](./guide/CONSOLE-MIGRATION-CHECKLIST.md) tracks the remaining page work. Discovery pages retain their own layout.

## Current architecture

- Astro with static output
- TypeScript and validated content collections
- MDX support for rebuilt explainers
- Pagefind for generated full-text search
- Static deployment on Vercel
- No database, accounts, CMS, server API, or analytics

Topic catalogue metadata lives in `src/content/topics/`. Shared layouts, components, and styling live under `src/`.

The remaining standalone HTML explainers stay at the repository root during migration. `scripts/sync-legacy.mjs` copies them into `public/` before development and production builds so their existing URLs continue to work. Rebuilt explainers use canonical MDX content and Astro components under `src/`.

## Commands

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

The production build is written to `dist/`. Pagefind indexes both generated Astro pages and the preserved legacy explainers after each build.

## Creating topic visuals

Use the [Universal Visual Specification Generator](./guide/INFRA_ILLUSTRATED_VISUAL_SPEC_GENERATOR.md) for every new topic and substantial visual rebuild. The [repository workflow](./AGENTS.md#visual-design-workflow) explains how to research, specify, prototype, review, and integrate the result. Follow the [Writing Guide](./WRITING-GUIDE.md) for prose and the [Site Rebuild Brief](./SITE-REBUILD-BRIEF.md) for product scope, architecture, and the shared visual system.

Before full integration, produce both approval artifacts under `guide/topics/<topic-slug>/`:

- `<topic-slug>-visual-spec.md` — narrative order, detailed visual and interaction contracts, sources, and acceptance criteria.
- `<topic-slug>-visual-prototype.html` — the complete representative page with working interactions and responsive, accessible behavior.

These are design artifacts outside the published site. Once the direction is accepted, integrate it into canonical MDX and shared Astro/TypeScript components and run the publication checks. Existing approval or implementation authorization carries forward. Small fixes and copy edits do not require restarting this workflow.

## Current visualizations

The catalogue is generated from `src/content/topics/`; use `/visualizations` to see the current published library. The [migration checklist](./guide/CONSOLE-MIGRATION-CHECKLIST.md) records each topic's implementation state and route.

## Migration status

Stage 1 established the shared shell, metadata, collection pages, catalogue, filters, and search while preserving public routes. RDS Backup Retention and VPC Packet Flow were the first Astro/MDX editorial migrations. RDS and ENI are the integrated console pilots; Linux Foundations is now a multi-route Foundations topic with a map and eight pillar consoles. The remaining canonical articles, the Auto Scaling draft, and five standalone HTML explainers have not yet adopted the locked console contract; their exact status is recorded in the checklist.

Existing pages must be technically revalidated during migration rather than mechanically wrapped in the new shell.

## Deployment

Vercel builds the project with `npm run build` and serves `dist/`. Do not commit or push changes unless the user explicitly requests that specific operation.
