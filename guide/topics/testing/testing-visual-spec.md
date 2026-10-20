# Tests Along the Delivery Pipeline — visual specification (v3)

- Topic: Delivery testing, DevOps & SRE. Route `/testing`.
- Status/version: v3.1, integrated locally, 2026-10-20. v3 rebuilt the page from the owner's content outline; v3.1 closed the review gaps listed at the end. The v2 nine-view design is archived in `testing-visual-spec-v2.md`.
- Audience: developers moving into DevOps/SRE.
- Page promise: for any test, answer three questions. What confidence does it give? Where should it run? Should its failure block deployment?
- Persistent scenario: `checkout-service` (`CHECKOUT-SERVICE · abc123`) calls the Payment API, writes to PostgreSQL and stores receipts in S3. The contract example everywhere is Payment API renaming `paymentId` → `id`.
- Canonical sources of truth: `src/components/testing/` (data, model, views, labs) and `src/content/topics/testing.mdx`. This file describes intent; code wins on detail.

## Visual grammar

| Meaning | Treatment |
|---|---|
| Real / exercised | cyan solid border |
| Test double (mock, stub, fake, sandbox) | amber dashed border, tag names the kind |
| Passed | green |
| Failed / blocked | red border and fill, tag reads "fails" |
| Contract / policy | purple |
| Not used | dim grey |

The console legend and the system-map key use the same box swatches. Colour is never the only signal: tags, ✓ / ✕ glyphs and text labels carry the same state.

## Structure: twelve views, three groups

| # | id (aliases) | Group | Question it answers |
|---|---|---|---|
| 1 | `confidence` | What it proves | Which doubt does each layer remove? The three question cards link to views 1, 5 and 9. |
| 2 | `test-scope` | What it proves | Where is the line between real and stand-in for unit, component, integration and E2E? |
| 3 | `contracts-api` (`api-e2e`, `integration-contracts`) | What it proves | What does an API test check, and how does a contract catch the `paymentId` rename? |
| 4 | `code-checks` | What it proves | What do static, Terraform, manifest and image checks read and catch? |
| 5 | `build-once` (`artifact-checks`, `pipeline-map`) | Where it runs | Why promote one digest instead of rebuilding? |
| 6 | `isolation` | Where it runs | Shared environments, per-PR namespaces, parallel shards. |
| 7 | `staging-checks` | Where it runs | Smoke, regression, load shapes and a threshold chart. |
| 8 | `environment-strategy` | Where it runs | The owner's environment grid (yes ✓ / maybe / limited / no). |
| 9 | `gates` | Should it block? | Which promotion does each failure stop; which only inform? |
| 10 | `production-signals` (hero) | Should it block? | Green dashboards vs synthetics, progressive rollout, canary policy lab. |
| 11 | `flaky-tests` | Should it block? | Flake rate, timing and data causes, retry trap vs fix loop. |
| 12 | `release-lab` (hero; `find-the-gap`) | Should it block? | Which gate catches each defect for the chosen coverage? |

Every view after the first starts with a "RUNS IN" strip over PR checks / Build / Test env / Staging / Production. Its stages agree with view 8. When a frame runs nowhere, the strip's accessible name uses the frame note. The inspector shows *proves / runs in / if it fails*, not a repeat of the takeaway.

## View contracts

- **Test scope (2).** Unit: only the pure price function is real and nothing is doubled; the frame says mocks appear when unit-tested code calls out. Component: API, price and database real; payment stubbed; storage faked. Integration: API and database real, runs in PR, Build and Test env. E2E: everything real except the payment sandbox.
- **Contracts (3).** Frame 1 is an API test of `POST /orders`. Frames 2 and 3 use checkout-service as consumer and Payment API as provider, ending with `can-i-deploy → no`. This is the same break the release lab's contract gate catches.
- **Code blocks.** Highlighted lines keep a newline in their text, so copying and screen readers keep line breaks.
- **Gates (9).** Horizontal five-stage rail at 760px and wider; labels have a fixed two-line height so the connector stays on the badge centres. Below 760px it is a vertical step list with the connector running through the badges.
- **Canary lab (10).** 95/5 proportional split; latency bars show their ms values and a dashed baseline +20% line. Presets carry `aria-pressed`: Healthy starts pressed, and a preset stays pressed only while the sliders match it.
- **Release lab (12).** Gates are grouped by zone. When a gate blocks, the system map marks the failing component red ("fails"): price (arithmetic), database (migration, slow queries), payment (contract), browser (UI), API (canary). The catch grid shows the first catching gate for each defect under the current coverage.

## Accessibility and responsive rules

- Interactive targets are at least 44px tall (choices, sliders, lab select, checkboxes, run buttons).
- Without JavaScript all 12 views and their frames stack in order, and the labs show a static reference.
- Old fragment aliases resolve to their new views.
- No horizontal page scroll from 320px to 1440px. The environment grid scrolls inside its own wrapper on phones.

## Verification record (2026-10-20)

All of these passed:

- `npx astro check`: 0 errors.
- `npm run build`, `npm run check:links` (50 pages), `npm run check:graph` (32 nodes, 318 relationships).
- `node scripts/verify-testing-model.mjs`: 8 defect/coverage outcomes, 9 canary boundary cases.
- `TESTING_BASE_URL=… node scripts/verify-testing-console.mjs`: 235 view/frame/viewport checks at 1440/1000/720/390/320, 4 old fragments, 8 release outcomes with the failing actor, the catch grid, canary presets including `aria-pressed` clearing and latency labels, and no-JS.
- Screenshots checked: gates at 1440 and 390, environment grid, release lab contract failure, question cards.

Still to do by hand: native browser zoom to 200%, a physical touch device, a screen reader pass and a full contrast audit.

## v3.1 review fixes

1. The release lab marks the failing actor; the map key and mobile list have a "fails" state.
2. The unit scope no longer shows mocks for a function that calls nothing.
3. Canary presets have correct `aria-pressed` state; latency bars show ms values.
4. The gates rail is aligned to its badges and becomes a vertical list on narrow screens.
5. The console legend uses consistent box swatches and adds contract / policy (purple).
6. "Yes" cells in the environment grid show a ✓ glyph.
7. Empty "runs in" strips have an accessible name; integration runs in PR, Build and Test env, matching view 8.
8. Code blocks keep newlines; touch targets are at least 44px.
9. The contract example uses checkout-service ↔ Payment API; the three question cards are links.
10. The frontmatter sources in `testing.mdx` match the 18 rendered sources.
