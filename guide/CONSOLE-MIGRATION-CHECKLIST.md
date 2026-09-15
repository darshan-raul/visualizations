# Topic console migration checklist

Status: planning inventory, checked against `src/content/topics/`, `src/pages/`, and `scripts/sync-legacy.mjs` on 2026-09-15. Update this file as each canonical page changes. [SITE-REBUILD-BRIEF.md](../SITE-REBUILD-BRIEF.md#confirmed-topic-console-design-language) is the design authority; this checklist records implementation progress. Do not mark a page complete because its specification or prototype was updated. The Linux foundation added one topic entry and nine static routes on 2026-09-15, bringing the catalogue inventory to 18 topics.

## Locked contract and scope

Every topic visualization format uses **one persistent console** containing title and metadata, internal navigation, a concept-grouped disclosure index, one active visual canvas, right/bottom explanation, bottom takeaway and sequence controls, sources, related links, and footer. Keep one group expanded after view selection; use short one-line view labels, a `current / total` indicator, and stable fragments. Preserve old section anchors as aliases. With JavaScript disabled, stack all core views and their explanations inside the same console. Arrows and motion should expose direction, causality, timing, or state change; manual steps, replay/pause, and reduced-motion still states keep sequences inspectable. The home page, catalogue, collection pages, and topic tree are discovery surfaces and stay outside this contract.

## Shared prerequisites

- [ ] Align the RDS and ENI pilots to the new neutral `src/components/TopicConsoleShell.astro` frame and shared tokens. Keep diagram logic and topic copy in topic modules; remove the ENI pilot's dependency on RDS-named layout classes. The Linux pillar routes already use the neutral frame.
- [ ] Build a reusable native disclosure index: concept groups, one open group after selection, short view labels, current/total state, and previous/current/next where the sequence needs it. Make the index readable at 320 px and 200% zoom, with keyboard and touch controls.
- [ ] Establish one view/fragment contract for direct links, reload, browser back/forward, and old anchor aliases. In the no-JavaScript state, anchors reach stacked figures within the same console.
- [ ] Standardize canvas, inspector, bottom takeaway, sources, related links, and footer slots without forcing the same diagram into every topic. Keep explanatory prose to the right or below, and labels near the actors.
- [ ] Reuse semantic colors and connector meanings from the brief. Provide text/state cues as well as color; animate only useful movement or change, with pause/replay or manual steps when a trace is hard to inspect. Respect reduced motion.
- [ ] Validate title, collection/format/tags/technologies, authoritative sources, published/last-reviewed dates, stable public slug, and Pagefind/catalogue metadata for each integrated page.
- [ ] Run `npm run check` and `npm run build` after integration, then inspect representative desktop/mobile layouts, 320 px, 200% zoom, keyboard/touch, no JavaScript, reduced motion, direct fragments, and back/forward. Record any browser-visual-QA limit rather than claiming it passed.

## Pilot alignment

| Topic and route | Current state | Remaining checks |
| --- | --- | --- |
| RDS Backup Retention — `/rds-backup-retention` | Integrated MDX console pilot; eight views and the incremental EBS time sequence are present. | [ ] Replace the flat rail with concept-grouped disclosure; preserve eight view anchors and older anchors. [ ] Move layout into the neutral shell. [ ] Inspect desktop/mobile screenshots when browser QA works. |
| AWS ENI — `/aws/vpc/eni` | Integrated MDX console pilot; 16 views in five grouped chapters, with the animated multi-ENI EC2 example. | [ ] Move RDS-named layout dependency into neutral shell. [ ] Confirm 44 px touch targets, narrow index fit, old anchor aliases, and desktop/mobile screenshots when browser QA works. |

The pilots demonstrate the accepted language; neither is marked fully aligned until these remaining checks pass. Preserve their current canonical MDX, components, prototypes, and public routes while extracting the shell.

## New Linux foundation

| Topic and routes | Current state | Remaining checks |
| --- | --- | --- |
| Linux Foundations — `/linux` hub plus `/linux/identity`, `/linux/storage`, `/linux/processes`, `/linux/networking`, `/linux/packages`, `/linux/shell`, `/linux/security`, `/linux/troubleshooting` | One canonical Foundations MDX topic, eight dedicated pillar consoles, grouped indexes, deterministic command evidence, meaningful failure states, and a navigation/interaction prototype. | [ ] Complete final browser QA at 320 px and 200% zoom, keyboard/touch, reduced motion, no JavaScript, all direct fragments, and back/forward; then record the result in the [Linux spec](topics/linux-foundation/linux-foundation-visual-spec.md). |

## Topic queue

`MDX article` means an integrated canonical explainer whose **console migration has not begun**. `Draft MDX` is not a publication-complete topic. `Legacy HTML` is a root source copied to `public/` during build. Routes below are the stable public paths to keep.

| Topic | Stable route | Current source | Console migration |
| --- | --- | --- | --- |
| VPC Packet Flow | `/vpc-flow` | MDX article | [ ] Carry cumulative packet trace into one canvas; keep checkpoint and section fragments. |
| AWS IAM Authorization Decision Explorer | `/aws-authorization-decision-explorer` | MDX article | [ ] Group request, evaluation, diagnosis views; keep explicit-deny and cross-account evidence visible. |
| AWS Identity and Credential Flows | `/aws-identity-credential-flows` | MDX article | [ ] Group trust, session, credential journey views; preserve artifact and ownership distinctions. |
| AWS Load Balancers | `/aws-load-balancers` | MDX article | [ ] Move eight visual contracts into console; keep `#choose`, `#envelope`, `#alb`, `#nlb`, `#gwlb`, `#global-accelerator`, `#health`, `#operate`, and `#sources`. |
| Kubernetes Networking | `/k8s-networking` | MDX article | [ ] Keep the system-map role while grouping the major networking paths and companion handoffs. |
| Pod Networking and CNI | `/pod-networking-cni` | MDX article | [ ] Preserve Pod/interface and CNI sequence, including implementation caveats. |
| Kubernetes Services | `/kubernetes-services` | MDX article | [ ] Show endpoint selection and traffic path without losing eligibility conditions. |
| Kubernetes DNS | `/kubernetes-dns` | MDX article | [ ] Preserve query/search-suffix steps and resolver evidence. |
| Kubernetes Gateway API and Ingress | `/kubernetes-gateway-ingress` | MDX article | [ ] Group ownership, matching, route, and failure views; keep control/data-plane distinctions. |
| EC2 Auto Scaling | `/ec2-auto-scaling` | Draft MDX and `ASG-INTERACTIVE-SPEC.md` | [ ] Reconcile current AWS behavior and bounded setting/scenario coverage, then design grouped fleet/lifecycle, scaling, placement, maintenance, and diagnosis labs in one console before publication. |
| Docker Multi-Architecture | `/docker-multiarch` | Legacy `docker-multiarch.html` | [ ] Revalidate manifest/build/pull behavior and migrate to canonical MDX + console. |
| GitHub Actions Cheatsheet | `/github-actions-cheatsheet` | Legacy `github-actions-cheatsheet.html` | [ ] Keep its operational-reference utility while grouping workflow, runner, and troubleshooting views in a console. |
| OAuth 2.0 & OIDC | `/oauth2-explainer` | Legacy `oauth2-explainer.html` | [ ] Revalidate grant, token, and trust boundaries; migrate to canonical MDX + console. |
| OpenTelemetry | `/opentelemetry` | Legacy `opentelemetry.html` | [ ] Revalidate signal/export pipeline and failure points; migrate to canonical MDX + console. |
| DevSecOps Pipeline | `/secopspipeline` | Legacy `secopspipeline.html` | [ ] Preserve pipeline order, gates, evidence, and failure behavior; migrate to canonical MDX + console. |

## Per-topic migration gate

Copy this gate into the topic's work item. Complete it against the canonical MDX or root legacy HTML source; never edit generated `public/` copies.

- [ ] Inventory the live slug, section/view fragments, interactive controls, sources, catalogue metadata, and no-JavaScript reading path.
- [ ] Read the brief, writing guide, generator, and current canonical page. Verify current technical behavior against primary sources; resolve the generator's accuracy worksheet and preserve material caveats.
- [ ] Write or revise `guide/topics/<slug>/<slug>-visual-spec.md` with one persistent scenario, concept groups, per-view contracts, arrows/motion states, inspector and bottom copy, fragment aliases, acceptance checks, and source anchors.
- [ ] Build or revise the representative, working one-console approval prototype in `guide/topics/<slug>/<slug>-visual-prototype.html`. Honor design approval or implementation authorization already given.
- [ ] Integrate one canonical MDX topic and reusable Astro/TypeScript components in the neutral shell. Preserve the public route and published anchors; remove the root page from legacy sync only after the new route builds and matches the old URL.
- [ ] Verify factual claims, meaningful failure/alternate behavior, keyboard/touch, focus, 320 px, 200% zoom, reduced motion, no JavaScript, fragments/history, metadata, source links, `npm run check`, and `npm run build`.
- [ ] Record canonical path, integration status, browser-QA limits, and date in the spec and this checklist. Mark the topic complete only when the published console passes its gates.

Suggested sequence: neutral shell and pilot alignment first; VPC trace next because it tests the flow contract; then the IAM pair and load balancers; then the Kubernetes family; then legacy pages individually. Auto Scaling remains a draft until its bounded research and simulation contract is ready. Order may follow current interest without changing the shared prerequisites or topic gates.
