# Tests Along the Delivery Pipeline — v2 visual specification (archived)

> Superseded on 2026-10-20 by the v3 spec in `testing-visual-spec.md`. Kept as design history only.


- Topic: Delivery testing, DevOps & SRE.
- Status/version: v2.0, integrated locally, 2026-10-20; quality revision after the owner rejected the first implementation as too basic in both visual and technical depth.
- Audience: Developers moving into DevOps/SRE; practical foundational concepts with operational detail.
- Page promise: Explain which boundary a check exercises, why a defect can escape, and how observed evidence changes promotion.
- Persistent scenario: checkout-service c7a91 adds a percentage discount; sha256:abc… represents its built artifact. Browser, checkout API, price function, orders database and payment provider persist across views.
- Scope: Code, artifact, integration, contract, API/E2E, environment strategy, staging, canary evidence, and closing coverage gaps. Excludes tool installation recipes, live infrastructure, statistically calibrated rollout algorithms and full service-level objective design.
- Visual thesis: Testing exposes selected boundaries of one real-looking system, then supplies evidence to a release decision.
- Semantic grammar: cyan exercised or active; green passing evidence; amber test double/pending; red failed assertion; purple contract/policy. Dashed links/borders indicate a test double or conceptual scope, explicitly labelled. Solid runtime arrows show browser→API and API→function/database/provider. Release gate ordering is labelled logical progression; CI jobs may parallelize.
- Canonical route/content: /testing, src/content/topics/testing.mdx. Production components in src/components/testing; shared LessonConsole and lesson-client retain navigation and progressive enhancement.
- Approval: Direct implementation and no prototype remain explicitly authorized. No separate HTML prototype is created.

## Audit and design decisions

The first version repeated three-card diagrams, changed canned answers without changing a mechanism, and placed definitions where executable evidence was needed. Preserve the shared shell, semantic colors and grouped index; do not apply generic redesign advice about font swaps, ornamental imagery or one-accent palettes. Replace generic compositions with a stable system topology, code and protocol evidence, workload comparisons and two model-driven laboratories. The environment matrix stays complete. Do not add decorative motion or extra simulators to inflate perceived depth.

## Accuracy worksheet

Source, artifact, test definitions, assertions, dependencies, fixtures, reports, rollout policy and deployed versions are separate primitives. Source/configuration defines expectations; execution yields observations. Build binds evidence to an artifact. A gate may require multiple checks; a required failure blocks promotion. Changing the experiment resets old results. API identifies an entry point, regression a purpose, smoke a subset and E2E a scope. A test double can accept operations a real dependency rejects. Real test-environment API coverage still detects a missing schema after a mocked integration pass. Contract verification is version-pair compatibility, not live connectivity. A small-cart workload cannot expose the selected large-cart defect. Production exposes real traffic; a canary decision is separate from recovery and from SLO compliance. An empty sample is unknown, never evidence of zero errors.

## Narrative sequence

Concept groups: The journey; Before deployment; Running together; Release confidence. Default #pipeline-map. The active group alone expands after navigation. Preserve all nine existing fragments and browser history. The shared console keeps title, metadata, navigation, grouped index, canvas, inspector, takeaway, sources, related visuals and footer together. Inspectors move below the canvas at narrow widths. The two rich interactions are the release lab and canary evaluator; other comparisons are lightweight selectors.

| # | Index group / view | Learner question | Visual form | Interaction | Takeaway |
|---|---|---|---|---|---|
| 1 | The journey / Pipeline map | What moves through the pipeline? | Release gate laboratory | Model-driven lab | Promote a known artifact with evidence; keep observing it after deployment. |
| 2 | Before deployment / Code checks | Why does a type-correct change still need tests? | Side-by-side source diff or unit assertion plus an input/expectation table; topology marks only the price function or source as exercised. | Scenario selection | A clean source report and a correct business result are different pieces of evidence. |
| 3 | Before deployment / Artifact checks | What does a clean scan tell us? | Package layers beside digest-bound reports; below, an evidence lineage from source to image, inventory/findings and promotion policy. Secret exposure and remediation have a distinct state. | Scenario selection | Bind scan evidence to the exact package you intend to deploy. |
| 4 | Running together / Boundaries | Must both services run in one environment? | Stable application/database topology with a SQL statement against the schema; alternate contract view separates consumer CI, a published agreement, and provider verification. Fixture lifecycle beneath. | Scenario selection | An interface agreement and a successful live integration answer different questions. |
| 5 | Running together / API & E2E | Is API testing a separate test level? | Stable topology switches entry point between HTTP client and browser. Request or browser assertion is paired with response/side-effect evidence. Broken UI state shows no HTTP request. | Scenario selection | Describe the entry point and real dependencies, not just the test label. |
| 6 | Release confidence / Environments | How should a DevOps team use this matrix? | Twelve-by-five baseline placement matrix, preserved from the user. Trigger/target distinction above; limited-production scopes and conversion to jobs below. Static so every placement remains comparable. | Static comparison | Run broad checks before exposure; keep production checks small, intentional, and observable. |
| 7 | Release confidence / Staging checks | What does a staging pass transfer to production? | Regression containment with unit/API/E2E bands and smoke subset, alongside the performance dimension. A five-point offered-load/p95 bar comparison supplies workload evidence and investigation context. | Scenario selection | Performance results need a workload, a duration, and an explicit threshold. |
| 8 | Release confidence / Production | Which production signals answer which questions? | Baseline/candidate traffic split, five evidence controls, a latency chart with common scale, four independently evaluated policy checks and a derived continue/wait/halt decision. Three production signal layers beneath. | Model-driven lab | Healthy probes permit traffic; release evidence determines whether exposure should grow. |
| 9 | Release confidence / Find the gap | How do we improve the pipeline after a miss? | A detection matrix highlights each defect’s earlier green check, omitted boundary, and useful detector. Concrete failure records and corrective coverage appear below; link back to the release lab to experiment. | Scenario selection | Observe → diagnose → add missing coverage → verify the next release. |

## Visual 1 — Which gate will catch this change?

### Purpose
Inject a defect into checkout-service, change the test coverage, then run the release. Watch where the first useful assertion stops promotion.

### Learner question
What moves through the pipeline?

### Persistent scenario state
The source change becomes a versioned artifact. Test results and scan reports provide evidence about that version; promotion policy decides whether it may advance.

### Concepts and actors
Checkout change, source/artifact identity, browser, API, price function, database, payment dependency, assertions and evidence. Show only relevant actors as exercised; retain unexercised context when using the topology.

### Composition
Group The journey; stable #pipeline-map. Release gate laboratory: eight numbered gates, a stable checkout topology, and an expected/observed assertion receipt. A defect selector and two coverage switches change the first detecting gate. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: Promote a known artifact with evidence; keep observing it after deployment. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Two execution controls: Run next gate advances one logical gate; Run to first failure evaluates until failure or completion. A required failure disables further execution. Reset clears execution. Changing the fault or either coverage option resets all results. Six defect selections (healthy plus five defects); databaseDouble affects integration only; largeCarts affects staging load. Topology highlights exercised dependencies, test doubles and untouched context. Every result exposes assertion, expected value, observed value and why. State is session-local; no network calls.

### Data and content states
- Static + unit: assert.equal(total(100, 0.20), 80); expected 80; observed 80
- Build + scan: build → digest → inventory → scan policy; expected Reports bound to sha256:abc…; observed SBOM and required reports attached
- Integration: INSERT INTO orders (discount_total) VALUES (20); expected Order written to the configured test dependency; observed 1 row inserted
- Contract: verify(providerResponse, consumerContract); expected paymentId: string; observed {"paymentId":"pay_test"}
- API: POST /orders { cart: [item], coupon: "SAVE20" }; expected 201 + persisted order; observed 201; total 80; row exists
- Browser journey: browser: add item → apply coupon → pay; expected Confirmation visible; order stored once; observed Confirmation rendered; one order stored
- Load threshold: 100 requests/s · 10 min · assert p95 < 300 ms; expected < 300 ms with the selected cart distribution; observed 280 ms; large carts included
- Canary evaluation: compare(candidate, baseline) after sample + time gates; expected Candidate p95 ≤ baseline × 1.20; observed 270 ms ≤ 300 ms; next rollout step allowed

### Failure or edge state
Wrong arithmetic stops at unit; real schema mismatch stops at integration; mocked integration shifts detection to the real API fixture; contract rename stops at verification; disconnected UI stops at browser journey; omitted large-cart load shifts latency detection to canary. Only the healthy fixture completes.

### Required copy
Takeaway: “Promote a known artifact with evidence; keep observing it after deployment.”. Inspector question: “What moves through the pipeline?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
This is one possible pipeline. Independent jobs can run in parallel, contract tests can run earlier in CI, and some unit tests require compilation first. The same artifact does not make environment configuration or data identical.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Google SRE · Testing for reliability](https://sre.google/sre-book/testing-reliability/)
- [Google SRE · Canarying releases](https://sre.google/workbook/canarying-releases/)

### Acceptance checks
- #pipeline-map opens the view and correct group; history, refresh and previous/next preserve navigation.
- Controls alter the documented model and produce consistent evidence, topology and decision.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Visual 2 — Inspect the source, then execute a behavior.

### Purpose
A discount change gives static analysis and unit tests different jobs.

### Learner question
Why does a type-correct change still need tests?

### Persistent scenario state
A type checker constrains valid operations. Unit assertions check selected behavior. Static application security testing (SAST) searches for security-relevant patterns or flows; it does not prove that the service is secure.

### Concepts and actors
Checkout change, source/artifact identity, browser, API, price function, database, payment dependency, assertions and evidence. Show only relevant actors as exercised; retain unexercised context when using the topology.

### Composition
Group Before deployment; stable #code-checks. Side-by-side source diff or unit assertion plus an input/expectation table; topology marks only the price function or source as exercised. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: A clean source report and a correct business result are different pieces of evidence. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Native scenario buttons select complete evidence states, with aria-pressed and a polite announcement. First button restores the default. No hover-only information. Selection persists while navigating within the page and resets on reload.

### Data and content states
- Static checks: Both discount expressions are valid code. Static checks enforce their configured rules; the percentage requirement needs a behavioral assertion. Evidence: types: valid · lint: passed · behavior: not executed. PASS · source rules; business behavior still unverified
- Unit tests: Execute the price calculation with controlled inputs and compare the result to an explicit expectation. Evidence: calculateTotal(100, 0.20) === 80. PASS · the asserted calculation works
- Calculation bug: Subtracting 0.20 instead of 20% is valid arithmetic. A test with the right expectation detects the wrong business behavior. Evidence: AssertionError: expected 80, received 99.8. BLOCK · fix the calculation

### Failure or edge state
Subtracting 0.20 instead of 20% is valid arithmetic. A test with the right expectation detects the wrong business behavior.

### Required copy
Takeaway: “A clean source report and a correct business result are different pieces of evidence.”. Inspector question: “Why does a type-correct change still need tests?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
Formatting enforces consistency, not behavior. Unit-test isolation and granularity vary by codebase, and untested inputs can still fail.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Google SRE · Testing for reliability](https://sre.google/sre-book/testing-reliability/)
- [GitHub · Code scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning)

### Acceptance checks
- #code-checks opens the view and correct group; history, refresh and previous/next preserve navigation.
- Every scenario’s boundary, caption, evidence and verdict agree.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Visual 3 — Open the package before you promote it.

### Purpose
The deployable unit contains more than your source: runtime dependencies and base-image packages travel with it.

### Learner question
What does a clean scan tell us?

### Persistent scenario state
It reports what the configured scanner detected with its rules and vulnerability data. The SBOM records components so other tools can inspect that inventory later.

### Concepts and actors
Checkout change, source/artifact identity, browser, API, price function, database, payment dependency, assertions and evidence. Show only relevant actors as exercised; retain unexercised context when using the topology.

### Composition
Group Before deployment; stable #artifact-checks. Package layers beside digest-bound reports; below, an evidence lineage from source to image, inventory/findings and promotion policy. Secret exposure and remediation have a distinct state. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: Bind scan evidence to the exact package you intend to deploy. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Native scenario buttons select complete evidence states, with aria-pressed and a polite announcement. First button restores the default. No hover-only information. Selection persists while navigating within the page and resets on reload.

### Data and content states
- Inspect evidence: Attach inventory and findings to the immutable digest. The policy evaluates findings; creating an inventory is not a security verdict. Evidence: subject: sha256:abc…; reports: inventory + vulnerability findings + secret findings. PASS · configured artifact policy
- Secret in image: A credential copied into a build layer is detected. Stop promotion and investigate exposure, including copies already pushed to a registry. Evidence: secret scanner: /app/.env · credential pattern; required policy: deny promotion. BLOCK · revoke exposed credentials and rebuild

### Failure or edge state
A credential copied into a build layer is detected. Stop promotion and investigate exposure, including copies already pushed to a registry.

### Required copy
Takeaway: “Bind scan evidence to the exact package you intend to deploy.”. Inspector question: “What does a clean scan tell us?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
A clean scan is not proof of no vulnerabilities or secrets. Scan source early too; rebuilding creates a new digest that needs its own evidence. New advisories can change findings for an unchanged artifact.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Trivy · Software bill of materials](https://trivy.dev/docs/latest/supply-chain/sbom/)
- [Trivy · Secret scanning](https://trivy.dev/docs/latest/guide/scanner/secret/)

### Acceptance checks
- #artifact-checks opens the view and correct group; history, refresh and previous/next preserve navigation.
- Every scenario’s boundary, caption, evidence and verdict agree.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Visual 4 — Does the dependency work? Does its interface fit?

### Purpose
Checkout writes orders to a database and calls a payment provider. Those boundaries need different checks.

### Learner question
Must both services run in one environment?

### Persistent scenario state
Integration tests can exercise real dependencies. Consumer-driven contract tests verify each side against a shared agreement and can run in separate CI jobs before deployment.

### Concepts and actors
Checkout change, source/artifact identity, browser, API, price function, database, payment dependency, assertions and evidence. Show only relevant actors as exercised; retain unexercised context when using the topology.

### Composition
Group Running together; stable #integration-contracts. Stable application/database topology with a SQL statement against the schema; alternate contract view separates consumer CI, a published agreement, and provider verification. Fixture lifecycle beneath. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: An interface agreement and a successful live integration answer different questions. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Native scenario buttons select complete evidence states, with aria-pressed and a polite announcement. First button restores the default. No hover-only information. Selection persists while navigating within the page and resets on reload.

### Data and content states
- Integration: Run checkout against a real test database and inspect the persisted order. Evidence: SELECT total FROM orders WHERE id = test_order → 80. PASS · exercised service/database integration
- Missing migration: The application writes a field the test database does not yet have. The failing call identifies the first broken boundary. Evidence: database error: column "discount_total" does not exist. BLOCK · fix migration and rollout ordering
- Contract: The consumer records the interaction it requires. Provider verification checks that the provider can satisfy that agreement. Evidence: provider verification: expected $.paymentId, field missing. BLOCK · incompatible consumer/provider versions

### Failure or edge state
The application writes a field the test database does not yet have. The failing call identifies the first broken boundary.

### Required copy
Takeaway: “An interface agreement and a successful live integration answer different questions.”. Inspector question: “Must both services run in one environment?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
Contract verification does not prove live networking, credentials, data migrations, or all business behavior. Publish versioned results and check compatibility with versions actually being deployed.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Google SRE · Testing for reliability](https://sre.google/sre-book/testing-reliability/)
- [Pact · Contract tests in CI/CD](https://docs.pact.io/pact_nirvana)
- [Testcontainers · Isolated real dependencies](https://testcontainers.com/guides/getting-started-with-testcontainers-for-nodejs/)

### Acceptance checks
- #integration-contracts opens the view and correct group; history, refresh and previous/next preserve navigation.
- Every scenario’s boundary, caption, evidence and verdict agree.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Visual 5 — Choose the boundary you want to exercise.

### Purpose
The same checkout behavior can be tested through an HTTP client or through the browser journey a customer uses.

### Learner question
Is API testing a separate test level?

### Persistent scenario state
API describes the interface used by the test. An API test may exercise one component or several real services, depending on its setup.

### Concepts and actors
Checkout change, source/artifact identity, browser, API, price function, database, payment dependency, assertions and evidence. Show only relevant actors as exercised; retain unexercised context when using the topology.

### Composition
Group Running together; stable #api-e2e. Stable topology switches entry point between HTTP client and browser. Request or browser assertion is paired with response/side-effect evidence. Broken UI state shows no HTTP request. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: Describe the entry point and real dependencies, not just the test label. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Native scenario buttons select complete evidence states, with aria-pressed and a polite announcement. First button restores the default. No hover-only information. Selection persists while navigating within the page and resets on reload.

### Data and content states
- API test: Send a request directly to checkout. Assert status, response fields, and any required side effects. Evidence: POST /orders → 201 { "orderId": "test_order", "total": 80 }. PASS · asserted API behavior
- E2E journey: Start at the user interface and follow the configured full journey. Include the dependency behavior your test claims to cover. Evidence: browser: confirmation visible · order reference matches persisted order. PASS · configured end-to-end journey
- Broken button: The API is healthy, but the UI never sends the order request. The browser journey detects a gap the direct HTTP test bypasses. Evidence: browser assertion: confirmation not visible before timeout. BLOCK · repair the user journey

### Failure or edge state
The API is healthy, but the UI never sends the order request. The browser journey detects a gap the direct HTTP test bypasses.

### Required copy
Takeaway: “Describe the entry point and real dependencies, not just the test label.”. Inspector question: “Is API testing a separate test level?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
A payment sandbox avoids real charges but differs from the live payment service. Name mocked or sandboxed boundaries when reporting E2E coverage.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Google SRE · Testing for reliability](https://sre.google/sre-book/testing-reliability/)
- [Playwright · API testing](https://playwright.dev/docs/api-testing)

### Acceptance checks
- #api-e2e opens the view and correct group; history, refresh and previous/next preserve navigation.
- Every scenario’s boundary, caption, evidence and verdict agree.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Visual 6 — Put each check where its evidence is useful.

### Purpose
A practical baseline for checkout-service: fast feedback on changes, broader checks before release, and small, controlled checks against production.

### Learner question
How should a DevOps team use this matrix?

### Persistent scenario state
Yes means include the check in this baseline, not run every case on every change. Maybe depends on risk, duration, and available isolation. No means outside this baseline release gate, not that the technique is forbidden there. PR integration and API jobs still need a running target, such as a temporary service and database.

### Concepts and actors
PR and CI triggers; test, staging, production targets; twelve test families; baseline, optional and deliberately limited execution.

### Composition
Group Release confidence; stable #environment-strategy. Twelve-by-five baseline placement matrix, preserved from the user. Trigger/target distinction above; limited-production scopes and conversion to jobs below. Static so every placement remains comparable. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: Run broad checks before exposure; keep production checks small, intentional, and observable. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Static matrix: no extra controls because simultaneous comparison is the learning task.

### Data and content states
- Suggested baseline: PR and CI build describe triggers; test, staging, and production describe deployed targets. A PR can launch CI jobs and provision its own disposable environment. Evidence: checkout PR → fast checks + isolated dependency tests; release build → versioned artifact + reports; test / staging → broader journeys and workloads; production → narrow checks + continuous observation. ADAPT · choose coverage, cost, isolation, and blast radius deliberately

### Failure or edge state
This matrix is a proposed team strategy, not a standard. Dependency scans can also rescan deployed artifacts as new advisories arrive. Production checks need bounded test data and cleanup; contract compatibility can be verified against deployed-version metadata without running intrusive tests in production.

### Required copy
Takeaway: “Run broad checks before exposure; keep production checks small, intentional, and observable.”. Inspector question: “How should a DevOps team use this matrix?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
This matrix is a proposed team strategy, not a standard. Dependency scans can also rescan deployed artifacts as new advisories arrive. Production checks need bounded test data and cleanup; contract compatibility can be verified against deployed-version metadata without running intrusive tests in production.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Google SRE · Testing for reliability](https://sre.google/sre-book/testing-reliability/)
- [Pact · Contract tests in CI/CD](https://docs.pact.io/pact_nirvana)
- [Grafana k6 · Performance thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Google SRE · Canarying releases](https://sre.google/workbook/canarying-releases/)
- [OWASP · Dynamic application security testing](https://devguide.owasp.org/en/06-verification/02-tools/01-dast/)
- [ZAP · Active scanning](https://www.zaproxy.org/docs/desktop/start/features/ascan/)

### Acceptance checks
- #environment-strategy opens the view and correct group; history, refresh and previous/next preserve navigation.
- Every scenario’s boundary, caption, evidence and verdict agree.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Visual 7 — Rehearse the release under explicit conditions.

### Purpose
Staging combines fast deployment checks, representative journeys, and workload-specific performance evidence.

### Learner question
What does a staging pass transfer to production?

### Persistent scenario state
It gives evidence for the tested configuration, data, dependency behavior, and workload. Record these with the result so the release decision has context.

### Concepts and actors
Checkout change, source/artifact identity, browser, API, price function, database, payment dependency, assertions and evidence. Show only relevant actors as exercised; retain unexercised context when using the topology.

### Composition
Group Release confidence; stable #staging-checks. Regression containment with unit/API/E2E bands and smoke subset, alongside the performance dimension. A five-point offered-load/p95 bar comparison supplies workload evidence and investigation context. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: Performance results need a workload, a duration, and an explicit threshold. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Native scenario buttons select complete evidence states, with aria-pressed and a polite announcement. First button restores the default. No hover-only information. Selection persists while navigating within the page and resets on reload.

### Data and content states
- Coverage map: These labels overlap. Regression is the purpose of catching broken existing behavior; smoke is a small critical subset. Evidence: staging sha256:abc…; p95: 280 ms · errors: 0.2% · workload: 100 requests/s. PASS · stated rehearsal conditions
- Load failure: Functional journeys still pass, but the latency threshold fails at the configured load. Stop promotion and inspect the bottleneck. Evidence: load run: p95 850 ms · errors 0.2%; profile: database connection-pool wait increased. BLOCK · investigate capacity and contention

### Failure or edge state
Functional journeys still pass, but the latency threshold fails at the configured load. Stop promotion and inspect the bottleneck.

### Required copy
Takeaway: “Performance results need a workload, a duration, and an explicit threshold.”. Inspector question: “What does a staging pass transfer to production?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
The workload and thresholds here are illustrative, not recommendations. Staging rarely matches production scale or traffic distribution exactly; a passing p95 also leaves the slowest tail uncharacterized.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Google SRE · Testing for reliability](https://sre.google/sre-book/testing-reliability/)
- [Grafana k6 · Performance thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)

### Acceptance checks
- #staging-checks opens the view and correct group; history, refresh and previous/next preserve navigation.
- Every scenario’s boundary, caption, evidence and verdict agree.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Visual 8 — A running process is only the first signal.

### Purpose
Send 5% of traffic to the candidate. Compare its behavior with the baseline before expanding exposure.

### Learner question
Which production signals answer which questions?

### Persistent scenario state
Health checks assess configured readiness or liveness. Smoke tests sample critical behavior after deployment. Synthetic tests repeatedly exercise scripted journeys. Canary analysis compares candidate and baseline; service-level objective (SLO) monitoring tracks user-facing reliability over its defined window.

### Concepts and actors
Checkout change, source/artifact identity, browser, API, price function, database, payment dependency, assertions and evidence. Show only relevant actors as exercised; retain unexercised context when using the topology.

### Composition
Group Release confidence; stable #production-signals. Baseline/candidate traffic split, five evidence controls, a latency chart with common scale, four independently evaluated policy checks and a derived continue/wait/halt decision. Three production signal layers beneath. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: Healthy probes permit traffic; release evidence determines whether exposure should grow. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Native range inputs: minutes 0–30, candidate requests 0–10,000, failures 0–100 clamped to requests, baseline p95 50–1,000 ms, candidate p95 50–1,200 ms. Three preset/reset buttons set healthy, slow and sparse examples. Minimums: 10 minutes and 1,000 requests. Guardrails: errors <1%, candidate p95 <=1.2 × baseline. An observed guardrail breach halts immediately even if the window is short; clean but insufficient evidence waits. Zero requests means no error/latency observation and WAIT. These are a labelled deterministic teaching policy, not statistical confidence. Native keyboard ranges update the decision and polite live status.

### Data and content states
- Healthy: 10 min, 1,000 requests, 3 failures, baseline 250 ms, candidate 270 ms → CONTINUE. Slow: candidate 850 ms → HALT. Sparse: 1 min, 20 requests, 0 failures → WAIT. No requests → WAIT. Exactly 1% errors → HALT. Exactly 20% p95 increase is allowed.

### Failure or edge state
HALT for observed guardrail breach; WAIT for insufficient or zero candidate evidence. Errors cannot exceed requests. Relative comparison can hide shared degradation, so absolute objectives remain necessary.

### Required copy
Takeaway: “Healthy probes permit traffic; release evidence determines whether exposure should grow.”. Inspector question: “Which production signals answer which questions?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
Adjust the observation window, request count, failures, and latency to evaluate an explicit policy. These criteria do not establish statistical confidence or a full SLO evaluation. Comparable traffic matters. Halting expansion does not undo database changes; rollback, flag disablement, or roll-forward needs a prepared plan.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Google SRE · Canarying releases](https://sre.google/workbook/canarying-releases/)
- [Kubernetes · Health probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)
- [Google Cloud · Synthetic monitoring](https://docs.cloud.google.com/monitoring/uptime-checks/introduction)

### Acceptance checks
- #production-signals opens the view and correct group; history, refresh and previous/next preserve navigation.
- Controls alter the documented model and produce consistent evidence, topology and decision.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Visual 9 — Follow the defect to the first useful signal.

### Purpose
Choose a defect and see why earlier checks can pass. Detection depends on the assertions and workload in this example.

### Learner question
How do we improve the pipeline after a miss?

### Persistent scenario state
Name the escaped behavior, find the earliest reliable place to exercise it, add the missing assertion or workload, then rerun the release checks. Keep production observation for conditions earlier environments cannot reproduce.

### Concepts and actors
Checkout change, source/artifact identity, browser, API, price function, database, payment dependency, assertions and evidence. Show only relevant actors as exercised; retain unexercised context when using the topology.

### Composition
Group Release confidence; stable #find-the-gap. A detection matrix highlights each defect’s earlier green check, omitted boundary, and useful detector. Concrete failure records and corrective coverage appear below; link back to the release lab to experiment. Explanatory caveats remain in the shared right/bottom inspector. Bottom takeaway: Observe → diagnose → add missing coverage → verify the next release. No autoplay; manual state changes preserve context. Bars encode measured example values, not decorative progress.

### Interaction
Native scenario buttons select complete evidence states, with aria-pressed and a polite announcement. First button restores the default. No hover-only information. Selection persists while navigating within the page and resets on reload.

### Data and content states
- Calculation bug: The unit suite includes a 20% discount example. It catches incorrect arithmetic before any artifact is promoted. Evidence: first detector: price unit test; repair: fix arithmetic; retain the regression assertion. BLOCK · before packaging in this pipeline
- Response changed: Provider unit tests expect the renamed field. Consumer compatibility fails because checkout still requires paymentId. Evidence: first detector: provider contract verification; repair: preserve compatibility or coordinate version transition. BLOCK · incompatible interface
- Missing migration: Unit tests use a database double. The real test database exposes the missing column. Evidence: first detector: service/database integration; repair: verify migration ordering and mixed-version compatibility. BLOCK · schema mismatch
- Production latency: Staging uses small carts. Real traffic includes large carts that trigger an expensive query path; canary latency reveals it. Evidence: first detector: candidate p95 comparison; repair: investigate traces; add representative large-cart workload. HALT · limit exposure and investigate

### Failure or edge state
The unit suite includes a 20% discount example. It catches incorrect arithmetic before any artifact is promoted.

### Required copy
Takeaway: “Observe → diagnose → add missing coverage → verify the next release.”. Inspector question: “How do we improve the pipeline after a miss?”. Preserve “fixture model” and “illustrative” on model outputs. Never imply live testing or deployment.

### Accuracy caveats
Do not make a flaky failure disappear by retrying until green. Preserve failure evidence and investigate nondeterminism. A green gate means its configured criteria passed, not that every possible defect was excluded.

### Mobile behavior
320 px minimum. Multi-column evidence becomes vertical. The topology SVG is replaced by labelled semantic actor/state rows plus an explicit relationship caption; text never shrinks to unreadable diagram labels. Gate rail becomes two columns with explicit numbering. Environment matrix becomes per-test labelled environment/value rows. Inputs and controls wrap; inspector follows the canvas. No page-level horizontal scroll at 200% CSS zoom.

### Accessibility
Semantic figures, headings, native forms, buttons, tables and lists. Status text and connector labels supplement color. Visible focus; controls >=44 px. Range inputs have wrapping native labels and unit-bearing outputs. Dynamic lab decisions use polite live regions. No new animation; shared reduced-motion rules apply. Without JavaScript all scenarios remain stacked; release lab includes an open complete healthy-run reference and canary displays a complete healthy policy evaluation. Controls stay hidden until their client initializes.

### Source anchors
- [Google SRE · Testing for reliability](https://sre.google/sre-book/testing-reliability/)
- [Pact · Contract tests in CI/CD](https://docs.pact.io/pact_nirvana)
- [Google SRE · Canarying releases](https://sre.google/workbook/canarying-releases/)

### Acceptance checks
- #find-the-gap opens the view and correct group; history, refresh and previous/next preserve navigation.
- Every scenario’s boundary, caption, evidence and verdict agree.
- Mobile/desktop, keyboard, no-JavaScript and zoom preserve readable content.
- Failure is located at a specific detector; no generic unexplained error badge.

## Environment matrix contract

Preserve the owner’s baseline exactly; qualify it as a strategy rather than a universal standard.

| Test | PR | CI build | Test env | Staging | Production |
|---|---|---|---|---|---|
| Lint | Yes | Yes | No | No | No |
| Unit | Yes | Yes | No | No | No |
| SAST | Yes | Yes | No | No | No |
| Dependency scan | Yes | Yes | No | No | No |
| Integration | Yes | Yes | Yes | Maybe | No |
| Contract | Yes | Yes | Yes | Yes | No |
| API | Maybe | Yes | Yes | Yes | Small |
| E2E | Maybe | Maybe | Yes | Yes | Tiny |
| Smoke | No | No | Yes | Yes | Yes |
| Performance | No | No | Maybe | Yes | Rarely |
| DAST | No | No | Maybe | Yes | Carefully |
| Synthetic | No | No | No | Maybe | Yes |

## Integration and progressive enhancement

One MDX catalogue source plus focused Astro/TypeScript modules. Shared shell and navigation unchanged. No packages added; no raster or external CDN assets. Keep all existing section fragments. The release and canary model lives in testing-model.ts; client DOM updates in testing-lab.ts. Focused mechanisms use TestMechanism and SystemMap; package and matrix use TestScene. The route imports existing shell styling and topic-only CSS. No prototype or second implementation is maintained.

## Production-practice ending

Preserve evidence → identify omitted boundary → add a distinguishing assertion/workload → verify recovery → rerun. Retain versioned contract results and scan data, control fixture lifecycle, avoid retry-until-green, rehearse migration compatibility and retain production observation.

## Deep-dive handoffs

Future topics: versioned contract compatibility, test-data isolation, statistical canary analysis and migration recovery. Each can continue checkout-service; no links until published.

## Page-level acceptance

Run npm run verify; verify-testing-model.mjs for defect/coverage and canary threshold boundaries; verify-testing-console.mjs for actual DOM behavior, controls, viewport/zoom/no-JS and screenshots. Inspect representative screenshots. Record limitations rather than marking manual screen-reader, physical-touch or native-zoom checks complete.

## Source index

Sources rechecked 2026-10-20. Fictional values describe teaching fixtures, not provider limits or product defaults.
1. [Google SRE · Testing for reliability](https://sre.google/sre-book/testing-reliability/)
2. [Pact · Contract tests in CI/CD](https://docs.pact.io/pact_nirvana)
3. [Playwright · API testing](https://playwright.dev/docs/api-testing)
4. [Trivy · Software bill of materials](https://trivy.dev/docs/latest/supply-chain/sbom/)
5. [Grafana k6 · Performance thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
6. [Google SRE · Canarying releases](https://sre.google/workbook/canarying-releases/)
7. [Kubernetes · Health probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)
8. [GitHub · Code scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning)
9. [Trivy · Secret scanning](https://trivy.dev/docs/latest/guide/scanner/secret/)
10. [Google Cloud · Synthetic monitoring](https://docs.cloud.google.com/monitoring/uptime-checks/introduction)
11. [OWASP · Dynamic application security testing](https://devguide.owasp.org/en/06-verification/02-tools/01-dast/)
12. [ZAP · Active scanning](https://www.zaproxy.org/docs/desktop/start/features/ascan/)
13. [Testcontainers · Isolated real dependencies](https://testcontainers.com/guides/getting-started-with-testcontainers-for-nodejs/)

## Validation record

Pending final v2 checks and screenshot inspection. The earlier v1 browser pass did not establish sufficient visual or teaching quality; v2 adds causal model checks and distinct mechanism layouts.
