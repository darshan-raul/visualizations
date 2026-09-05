# Infra Illustrated

**Visual deep dives into cloud infrastructure.**

Infra Illustrated is a static visual reference library focused on AWS, Kubernetes, DevOps, SRE, and the foundations beneath them. Topics are independent references rather than a course or prescribed learning path.

The confirmed product and migration decisions live in [SITE-REBUILD-BRIEF.md](./SITE-REBUILD-BRIEF.md).

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

## Current visualizations

| Collection | Visualization | Format |
|---|---|---|
| AWS | RDS Backup Retention | Visual Brief |
| AWS | VPC Packet Flow | Flow Explorer |
| Kubernetes | Kubernetes Networking | Deep Dive |
| DevOps & SRE | OpenTelemetry | Deep Dive |
| DevOps & SRE | GitHub Actions Cheatsheet | Operational Reference |
| DevOps & SRE | DevSecOps Pipeline | Flow Explorer |
| Foundations | Docker Multi-Architecture | Deep Dive |
| Foundations | OAuth 2.0 & OIDC | Flow Explorer |

## Migration status

Stage 1 established the shared shell, design system, metadata, collection pages, catalogue, filters, and search while preserving all public routes. RDS Backup Retention and VPC Packet Flow are rebuilt in Astro/MDX. VPC Packet Flow includes six cumulative request/reply traces, selectable failure cases, and manual or timed playback.

The first editorial rebuilds are:

1. ~~RDS Backup Retention~~ — rebuilt
2. ~~VPC Packet Flow~~ — rebuilt

Existing pages must be technically revalidated during migration rather than mechanically wrapped in the new shell.

## Deployment

Vercel builds the project with `npm run build` and serves `dist/`. Do not commit or push changes unless the user explicitly requests that specific operation.
