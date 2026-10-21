# Database Migrations, One Change at a Time

- **Status:** Approved in chat; directly integrated, v2.1, 2026-10-21. Validation record below.
- **Collection / route:** DevOps & SRE · Deep Dive · `/database-migrations`.
- **Audience:** Developers who know how an application reads a database but are new to release-time schema changes.
- **Promise:** Start with one app and table, then explain migrations, Alembic, historical data, mixed-version deployments, lock waits and recovery without presenting the whole system up front.
- **Persistent scenario:** Orders initially store `id` and `total_cents`; all historical orders are USD. Introduce `currency`, preserve old reads/writes, fill historical values, validate and require the column, then retire compatibility behavior before enabling other currencies.
- **Scope:** Schema evolution and data backfills. Python/Alembic is the main migration workflow; Go application access and Go-native migration packages are covered later.
- **Non-goals:** Host/provider migration, a general SQL course, complete ORM setup, engine-independent online-DDL guarantees, or a tutorial that requires every package shown to be installed together.
- **Visual thesis:** One picture gains one idea at a time. The app stays on the left, its SQL path in the middle, and the orders table on the right; rows, revision markers and additional actors appear when needed.

## Approval and presentation freedom

The owner requested specification first, no prototype, then implementation after approval. They requested Python and Go packages with Alembic, then asked for a simpler beginning with concepts added progressively. They explicitly authorized a different presentation outside the implementation guide provided the big shared window and existing theme remain. The revised nine-step direction was approved with “go ahead.”

The owner subsequently requested that explanation, code, caveats and sources sit on the right without collapsing. The final layout uses the neutral `TopicConsoleShell`, shared frame/index styles and navigation behavior, a visual on the left, and an always-visible right-hand explanation panel. At 1100 px and below, or when zoom leaves the canvas at most 850 CSS pixels wide, the panel stacks beneath the visual. Diagrams adapt to the available canvas width. Sources, related topics, takeaway and footer remain inside the same window. No prototype was created.

Canonical publication: `src/content/topics/database-migrations.mdx`; composition and mechanisms: `src/components/migrations/`; route: `src/pages/database-migrations.astro`. Tested code examples live under `src/components/migrations/examples/` and are imported directly into the explanation. Do not maintain a second explanatory article.

## Visual semantics

Reuse existing tokens and typefaces. Cyan means normal application/database interaction; purple means migration/configuration activity or the introduced column; amber means missing values or waiting; green means a verified change; red means a failed query or operation. Important states also have text and shape/border cues.

Solid directional arrows mean a real query or migration action. Dashed borders identify revision metadata rather than runtime queries. NULL is labelled and italic, not merely amber. New/affected table cells may animate briefly; unchanged context stays stable. No automatic playback or fixed-time race is necessary. Reduced motion preserves all selected states.

## Narrative and navigation

Groups: **One small change** (1–3), **Ship it safely** (4–6), **Go further** (7–9). First view `#one-app-one-table`, counter `01 / 09`. Only the selected group remains open after navigation. Retain ordinary anchors, history and focus management through the shared lesson navigation client; no duplicate all-view button strip.

| # | View / fragment | Learner question | Form / interaction | Required takeaway |
| --- | --- | --- | --- | --- |
| 1 | An app & a table / `#one-app-one-table` | What exists before any change? | One app, query arrow, one row; static | The application already understands a stored data shape. |
| 2 | A new field / `#a-new-field` | Why doesn’t new code work? | Same table, new query rejected; static | Deploying code does not add the missing column. |
| 3 | Change the table / `#change-the-table` | What is a migration changing? | SQL strip plus added column; static | The existing table changes while its row survives. |
| 4 | Keep it in Alembic / `#record-with-alembic` | How is that change recorded and applied? | Revision file feeds same table; static | Review a revision, apply it, inspect the recorded head. |
| 5 | Fill existing rows / `#fill-existing-rows` | Why are old values still empty? | Batch worker, rows, committed progress; hero | Defaults affect future inserts; backfills update old rows. |
| 6 | Deploy in order / `#deploy-in-order` | How do old and new code coexist? | Growing app/table picture with manual stages; hero | Expand, deploy compatible code, backfill, tighten. |
| 7 | When it waits / `#when-a-change-waits` | Why can short DDL hang? | Transaction/DDL/query lanes with outcomes; hero | Inspect the blocker and bound lock waits. |
| 8 | Python & Go / `#python-and-go` | Which package does which job? | Language lanes, one database, alternatives; static | Driver and migration ownership are separate choices. |
| 9 | Recover & verify / `#recover-and-verify` | How do I recover from actual state? | Three recovery decisions and verification list; static | Code rollback, transaction rollback and data recovery differ. |

## Visual 1 — Your app reads an order

**Purpose/question:** Establish the primitive picture before terminology. “What does my application use?”

**State/actors:** Old app selects `id, total_cents`; orders row 1042 stores 6200 cents. USD is an application assumption, not a stored currency column. No runner, revision marker or package names inside the opening canvas.

**Composition:** Left application card, central labelled query arrow, right PostgreSQL table. Single result beneath. Explain schema versus row data in the always-visible explanation panel. Default canvas is intentionally sparse.

**Interaction:** Static; selecting actors would add no useful lesson. The explanation and code are ordinary visible HTML.

**Copy/caveat:** “Your app reads an order.” Old readers use named columns; do not imply all queries such as SELECT * are automatically compatible with added columns.

**Mobile/accessibility:** Vertical app → query → table, with text-based status and semantic table caption/headers. One row, two columns, visible without scripts.

**Sources/checks:** PostgreSQL ALTER TABLE; test original reads. Assert no revision marker, one row and two headers. No essential material behind hover.

## Visual 2 — New code expects a missing field

**Purpose/question:** Show the concrete mismatch. “Why does the new query fail?”

**State/actors:** Same unchanged table and row. New application expects currency. It is the query that changes.

**Composition:** Keep actor positions stable; change app accent to purple and query path to a labelled rejection. Result states `column "currency" does not exist`.

**Interaction:** Static failure snapshot so the first blocking component is obvious.

**Copy/caveat:** A missing column is different from NULL in an existing column. Even COALESCE needs its referenced column to exist.

**Mobile/accessibility:** Same stacked order as view 1; error has text and a cross marker as well as red.

**Sources/checks:** PostgreSQL ALTER TABLE and actual SQLSTATE 42703 verification. Table must still have two columns.

## Visual 3 — Add a place for the new value

**Purpose/question:** Introduce migration terminology after showing the problem. “What changes in the database?”

**State/actors:** Same row and old app; add nullable text `currency`. This first illustration has no default yet.

**Composition:** Small visible `ALTER TABLE … ADD COLUMN …` strip above the persistent picture. New table column gets a purple boundary; the original ID and amount stay unchanged; currency displays NULL.

**Interaction:** Static relationship; this view explains the operation’s effect before the same operation is packaged in a revision in view 4. It is not an instruction to run ADD COLUMN twice.

**Copy/caveat:** NULL means missing data, not USD. DDL requires locks; short-looking SQL is not a timing guarantee.

**Mobile/accessibility:** Inline SQL wraps; new column stays readable in a semantic three-column table.

**Sources/checks:** PostgreSQL ALTER TABLE. Assert row survives and no invented currency value is shown.

## Visual 4 — Record the change with Alembic

**Purpose/question:** “How do I keep this change reproducible?”

**State/actors:** Add a revision file and release command; database gets `currency` plus a database USD default for future omitted values. Revision marker moves from 001 to 002.

**Composition:** Revision file above the same app/table picture with a downward migration arrow. Dashed `alembic_version` marker below the table. Code and graph details are in the right-hand panel.

**Interaction:** Static authored/executed relationship. A visible subsection explains revision branches and merge points.

**Required content:** revision/down_revision, upgrade/downgrade, env.py connection, autogenerate → review → upgrade → current. The actual revision is imported from the runnable file, not independently copied into prose.

**Caveats:** Autogenerate produces candidates, does not plan backfills, and does not reliably detect renames. A revision marker is not complete audit history or proof the actual schema matches. Database credentials come from the release environment. One designated migration job is the release design; Alembic is not presented as universally serializing deployments for you.

**Mobile/accessibility:** File label and command wrap; metadata is text. All detail is native readable HTML.

**Sources/checks:** Alembic tutorial/autogenerate/branches. Actually generate a candidate in a temp project, then test the reviewed revision and marker.

## Visual 5 — Fill historical rows

**Purpose/question:** “Why are existing orders still NULL after the default is set?”

**State/actors:** Six illustrative historical orders, one worker, batches of two. All historical values are known to be USD. New inserts omit currency and receive USD from the default.

**Composition:** Worker to left of table; count and worker state above; committed-progress line, controls and explanatory result below. Historical and newly inserted rows remain visible together.

**Hero interaction:** Run a batch commits the next two NULL rows. Interrupt a batch simulates its uncommitted work rolling back and pauses the worker. Pause stops between batches; Resume enables the next manual batch. Add a new order demonstrates the default without filling old rows. Reset restores six NULL rows. Limit new illustrative inserts to two to keep the canvas readable.

**Failure/data states:** Before commit, an interrupted batch leaves its rows NULL; previous committed batches stay USD. Retry selects remaining NULL rows, not an in-memory offset. Existing populated values must not be overwritten. No arbitrary progress or auto-running clock.

**Copy/caveat:** Batches are separate transactions. The published SQL has a predicate and row selection; this example has one worker. Production needs suitable access paths and load/WAL/replica-lag observation. Do not infer a universal batch size from two teaching rows.

**Mobile/accessibility:** Worker above table, all native buttons at least 44 px, live progress announcements, numeric progressbar. No-JS explanation explicitly describes commit, interruption and resumption while hiding inert controls.

**Sources/checks:** Alembic data-migration guidance and PostgreSQL. Verify actual committed and rolled-back SQL batches, interrupted UI state, defaulted insert, complete/reset outcomes, and non-overwrite behavior.

## Visual 6 — Deploy in order

**Purpose/question:** “How can two application versions share a table during rollout?”

**State/actors:** Old app, expanded schema, new app, historical rows, final constraint and revision markers 001/002/003.

**Composition:** Same spatial picture, now with two app cards during the overlap. Small five-stage progress strip plus Next, Back, Reset, Try app first. One active stage under enhancement.

**Hero interaction:** Start → Expand → Roll out → Backfill → Require it. Try app first displays the original schema with the new reader and a query failure. The next control returns to the safe order. Announce each new outcome; unchanged table values remain stable.

**Required semantics:** Old reads name the original columns. Old writes omit currency; the database default supplies USD. New readers use a temporary fallback for NULL historical values; new writers explicitly send USD. Validate historical values before NOT NULL. Retire old readers before non-USD data is enabled.

**Caveats:** NOT NULL plus a default still accepts omitted values. Removing the default too soon would break old writers. The compact constraint revision validates in the same migration transaction; its locks are retained until commit, so it is not sold as an online-DDL recipe. Large tables need deliberately separated lock-sensitive phases.

**Mobile/accessibility:** Two app versions stack; table stays readable. Native buttons and live result; all five stages and the failed ordering remain visible in narrative order without JavaScript.

**Sources/checks:** Alembic tutorial/data guidance; PostgreSQL ALTER TABLE. Test defaults after NOT NULL, explicit NULL rejection, marker movement, failed early enforcement and restoration of transactional state.

## Visual 7 — Inspect a waiting migration

**Purpose/question:** “Why can a quick change sit waiting?”

**State/actors:** An old SELECT transaction holds ACCESS SHARE on orders. DDL wants ACCESS EXCLUSIVE. A later query can join the queue behind waiting DDL.

**Composition:** Stable three-session lanes. Explicit state text describes who holds, waits or proceeds. No exact elapsed-time simulation or generic red database box.

**Hero interaction:** Start waiting; Commit the blocker lets migration complete and later work proceed. Let lock timeout expire cancels/rolls back the migration attempt while leaving the original transaction alone. Reset returns to waiting. Terminal controls disable until reset.

**Failure/caveat:** Timeout is not a blocker kill. Inspect pg_stat_activity and pg_blocking_pids. The explanation panel also covers concurrent indexes: not lock-free, outside transaction blocks, invalid-index recovery may be needed.

**Mobile/accessibility:** Vertical session cards with named status and labels. Live announcements. No-JS shows all three outcomes; reduced motion changes no meaning.

**Sources/checks:** PostgreSQL locking/ALTER TABLE/CREATE INDEX. Reproduce an actual DDL timeout behind an open transaction and success after commit; verify concurrent-index transaction rejection.

## Visual 8 — Python and Go packages

**Purpose/question:** “Which package owns migrations, and which connects the application?”

**State/actors:** One PostgreSQL contract with two language lanes. Python uses SQLAlchemy/psycopg and Alembic. Go uses pgx or database/sql with a compatible driver and may use the same Alembic release job.

**Composition:** Two language columns converge on one database. Below a separator, show Go-native ownership alternatives: golang-migrate/v4 and goose/v3. Do not draw them as additional serial pipeline steps.

**Interaction:** Static comparison keeps roles visible together. Actual Go reader and package paths are in the explanation panel.

**Content/caveats:** golang-migrate paired up/down SQL and CLI/library; goose SQL annotations or registered Go functions. One owner for this migration history. Query generation, ORM mapping and a driver are not substitutes for reviewed migrations.

**Mobile/accessibility:** Language lanes and alternatives stack, labels remain text, no hover or code-image dependency.

**Sources/checks:** Primary Alembic, SQLAlchemy, pgx, database/sql, golang-migrate and goose documentation. Compile and run the displayed pgx reader against the Alembic-managed database. Do not claim full executable tutorials for both alternative migration tools.

## Visual 9 — Recover and verify

**Purpose/question:** “What do I do after a change fails or the application needs rollback?”

**State/actors:** Observed database schema/data and revision metadata, committed versus uncommitted changes, compatible versus incompatible application versions.

**Composition:** Three recovery situations: did not commit, expanded schema committed, data meaning changed. Underneath, a short verification checklist replaces another simulator.

**Interaction:** Static operational reference. Exact observation commands sit below in the explanation panel.

**Required distinctions:** Application rollback does not rewind the database. A compatible rollback can leave an additive schema. Destructive downgrade can lose currency information. Restore needs an understood loss/reconciliation plan. Alembic stamp edits marker state without running operations. golang-migrate dirty/force behavior is labelled tool-specific.

**Mobile/accessibility:** Recovery situations stack. Every consequence uses text; no color-only success. Ordered decision points are always readable without scripts.

**Sources/checks:** Alembic commands and golang-migrate FAQ. Prove stamp leaves the currency data intact, while downgrade actually removes the column; verify expected revisions and data before ending the lesson.

## Integration, accessibility and scope boundaries

- Shared shell, masthead, theme tokens, grouped index, history/focus client, bottom takeaway and footer are reused. `migrations.css` defines the topic layout and mechanisms; it does not duplicate the outer frame stylesheet.
- All nine views render as HTML inside one console; JS hides nonselected views. Explanation, code, caveats and sources are always visible. The first useful picture is visible without a marketing hero.
- Stable fragments use the IDs in the narrative table, plus `#database-migrations-sources`. This is a new route with no old aliases. Direct links, refresh, Back/Forward and selected-group expansion must work.
- Responsive checks: 320, 390, 720, 1000, 1280 and 1440 px, with all explanation panels visible, 200% CSS zoom. Horizontal actor paths become vertical; no page-level scrolling sideways.
- Semantic labelled controls, visible focus, polite live regions, semantic tables, non-color statuses, reduced-motion behavior and no-JS alternatives are required.
- Related published pages: testing, Git and RDS backup retention. No unpublished deep-dive links. Future advanced topics could follow one concurrent index build, a revision-branch conflict, or a backfill worker under load; none is required for this simple narrative.
- Page metadata is validated in the topic collection; catalogue and DevOps & SRE discovery update automatically. No hand-written discovery cards, database connection or server-side feature is added.

## Accuracy decisions

The table definition, stored rows, current migration marker and application binary are different states. Defaults on future omitted inserts do not retroactively populate historical rows when SET DEFAULT follows ADD COLUMN. Migration ownership and DB access are separate responsibilities. The main example has an explicit all-USD historical assumption, so the backfill does not invent historical currencies. Batching is deterministic and predicate-based; interruption before commit differs from earlier committed work. The full rollout is not guaranteed zero downtime, and timing/locking are labelled PostgreSQL-specific. A revision marker alone cannot prove schema/data correctness. New currencies are gated on compatible readers, not merely successful SQL.

## Validation record

Integrated at `/database-migrations`; canonical MDX and topic modules are the published source. No prototype was created.

- `npm run build` passes, including the static page, validated catalogue metadata and Pagefind indexing. Topic graph passes with 33 nodes and 327 relationships. Internal route/fragment checks pass across 51 generated pages. All 14 primary source URLs return HTTP 200.
- `uv run scripts/verify-database-migrations.py` passes **20 real database/package checks** against a loopback-only disposable PostgreSQL instance. It exercises the actual published Alembic revisions and backfill SQL, autogenerate, missing-column failure, old-writer defaults, interrupted batches, early constraint failure/transaction rollback, NOT NULL/default interaction, queued DDL and later-query waiting, concurrent-index transaction rejection, stamp and destructive downgrade. It also compiles and runs the displayed Go reader. The temporary container is removed on exit; no real database is used.
- Verified runtime: PostgreSQL 18.6, Alembic 1.20.0, SQLAlchemy 2.1.5, psycopg 3.3.6, pgx/v5 5.11.0. The Go-native migration tools are source-verified comparisons, not claimed as separate executed tutorials.
- Desktop opening and backfill plus 320 px mixed-version rollout screenshots inspected. QA screenshots are temporary artifacts under `/tmp/database-migrations-qa/`.
- `npm run check` has no migration-topic diagnostics, but still reports six existing diagnostics in testing-topic `Flaky.astro` and `StaticChecks.astro`, plus two existing unused-variable hints in the CORS topic. Those files were not changed.
- `scripts/verify-migrations-console.mjs` passes **138 view/state/viewport checks** against the compiled production preview at 320, 390, 720, 1000, 1280 and 1440 px. This includes the deliberately sparse opening, all nine explanation/code panels visible, right-side placement on desktop and stacked placement on smaller screens, interrupted/resumed batches, safe/failed rollout, lock outcomes, keyboard/focus, selected groups, direct fragments, Back/Forward, unique IDs, no JavaScript, reduced motion, CSS 200% zoom and simulated touch.
- Axe-core 4.14.0 reports no serious or critical violations across all nine views with explanation/code panels visible. Physical touch, native browser zoom, a screen-reader session and a complete manual contrast audit remain separate unperformed checks.

## Primary source index

1. [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html) — environment, revision file, application and marker.
2. [Alembic autogenerate](https://alembic.sqlalchemy.org/en/latest/autogenerate.html) — candidates, review and limitations.
3. [PostgreSQL 18 ALTER TABLE](https://www.postgresql.org/docs/18/sql-altertable.html) — schema, defaults, constraints and locks.
4. [Alembic data migration techniques](https://alembic.sqlalchemy.org/en/latest/cookbook.html#data-migrations-general-techniques) — data/schema separation.
5. [PostgreSQL 18 explicit locking](https://www.postgresql.org/docs/18/explicit-locking.html) — lock modes and transaction lifetime.
6. [PostgreSQL 18 CREATE INDEX](https://www.postgresql.org/docs/18/sql-createindex.html) — concurrent builds and transaction boundary.
7. [Alembic branches](https://alembic.sqlalchemy.org/en/latest/branches.html) — revision DAG and heads.
8. [Alembic commands](https://alembic.sqlalchemy.org/en/latest/api/commands.html) — upgrade, downgrade and stamp.
9. [SQLAlchemy PostgreSQL dialect](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html) — psycopg integration.
10. [pgx](https://github.com/jackc/pgx) — Go application access.
11. [golang-migrate](https://github.com/golang-migrate/migrate) — CLI/library and files.
12. [goose](https://pressly.github.io/goose/) — SQL/Go migration options.
13. [golang-migrate FAQ](https://github.com/golang-migrate/migrate/blob/master/FAQ.md) — dirty flag and driver-specific locking.
14. [Go database/sql](https://pkg.go.dev/database/sql) — database access interface and driver distinction.
