# Helm: One Chart, Three Jobs — Visual Specification

- **Topic:** Helm as template engine, artifact manager, and release manager, including subcharts and umbrella charts
- **Status:** Draft 0.2 for owner review, 2026-10-17. Spec only; prototype not yet built; not integrated. 0.2 adds the Compose group (dependencies, value scoping, lock files, library charts) from the owner's subchart notes.
- **Proposed route / slug:** `/helm` · `src/content/topics/helm.mdx` · components in `src/components/helm/`
- **Collection / format:** Kubernetes · Deep Dive · intermediate. Tags: Kubernetes, Packaging, Deployment, GitOps. Technologies: Helm 4, OCI registries, Argo CD, Flux.
- **Version scope:** Helm v4.2.2 CLI help and behavior, checked locally on 2026-10-17 with `helm create`, `template`, `lint`, `package`, `dependency update/build`, a two-dependency umbrella chart (aliased subchart plus library chart), and client dry-runs. Helm 3 differences are called out where flags were renamed.
- **Target audience:** Engineers who have deployed with `kubectl` and run a few `helm install` commands, but can't yet say which Helm command touches the cluster, which values a subchart can see, where release state lives, or what `--atomic` actually rolls back.
- **Page promise:** After this page, you can point at any Helm command and say where it runs, what it reads, whether it talks to a registry or the cluster, and what it writes; you can predict which values reach each subchart; and you can predict what happens when an upgrade fails.

## Persistent scenario

One chart, `payment-api`, followed from a directory on a laptop to a release in a cluster. It's an umbrella chart: its own Deployment plus two subcharts and a shared library.

| Stage | Object | Example value |
| --- | --- | --- |
| Source | Chart directory | `charts/payment-api/` with `Chart.yaml` `version: 1.2.0`, `appVersion: "4.7.1"` |
| Dependencies | `Chart.yaml` `dependencies:` | `postgresql` `~16.2.0` from `https://charts.example.com/stable` (condition `postgresql.enabled`); `redis` `20.1.4` from `oci://registry.example.com/charts`, **alias `cache`**, condition `cache.enabled`; `platform-common` `1.0.0` (`type: library`) from `file://../platform-common` |
| Lock | `Chart.lock` | exact versions for all three plus one `digest` over the dependency list |
| Values | Layered inputs | chart `values.yaml` → `-f values-production.yaml` → `--set image.tag=4.7.2`; sections `postgresql:`, `cache:`, `global:` |
| Artifact | Packaged chart | `payment-api-1.2.0.tgz` (subchart archives inside `charts/`) pushed to `oci://registry.example.com/charts` |
| Release | Named install in a namespace | release `payment-api`, namespace `payments`, **one** release for parent and subcharts |
| History | Release records | `sh.helm.release.v1.payment-api.v1` … `v4` |
| Failure | Bad upgrade | revision 3 sets `image.tag=4.7.2-rc` (tag doesn't exist) → `ImagePullBackOff` |

Registries and hostnames are fictional. The example avoids real public catalogs because they change; for instance, Bitnami restructured its free catalog in 2025.

**Scenario ribbon** (console toolbar): `payment-api · chart 1.2.0 · deps pg, cache, common · values base+prod · ns payments · rev 2 deployed`. The release fields change as views 10–13 advance (for example `rev 3 failed → rev 4 deployed (rollback to 2)`); the deps field changes in views 5–7 (for example `cache disabled`).

## Scope and non-goals

**In scope:** chart structure, values precedence, local rendering and its limits, subchart declaration (repository kinds, version ranges, `condition`, `tags`, `alias`), value scoping and `global`, `Chart.lock` and the two dependency commands, library charts, whether to commit `charts/*.tgz`, packaging and OCI distribution, provenance verification, release records, the `upgrade --install` lifecycle, hooks at the level needed to explain ordering, wait/timeout/rollback behavior, inspection commands, and how CI-driven Helm compares with Argo CD and Flux.

**Non-goals (handoffs instead):** template language tutorial (Sprig functions, `tpl`, named templates beyond what library charts need), chart authoring best practices, `import-values` and `exports` beyond one mention, JSON schema authoring, Helm 4 WASM plugins and SDK embedding, Helmfile/Kustomize post-rendering, chart API v3, detailed Argo CD/Flux configuration.

## Corrections to the source notes

The owner's notes are the content brief. These claims change during research; the page uses the corrected form.

| Note says | Page says | Evidence |
| --- | --- | --- |
| `helm template --validate` checks against the live cluster | In Helm 4 `--validate` is deprecated; use `--dry-run=server`. Offline `template` fakes `Capabilities` and `lookup`. | `helm template --help` and runtime warning, v4.2.2 |
| `--atomic` rolls back on failure | Renamed `--rollback-on-failure` in Helm 4 (`--atomic` still accepted with a deprecation warning). On a first install it **uninstalls**; on an upgrade it rolls back to the last successful revision. It also turns on `--wait=watcher`. | `helm upgrade --help`, `helm install --help`, v4.2.2 |
| `--wait` blocks until Pods, PVCs, Services are ready | Helm 4 has wait strategies: `watcher` (kstatus-based, the value of bare `--wait`), `legacy`, and `hookOnly` (the default when the flag is omitted). Without `--wait`, “deployed” means the API accepted the objects, not that Pods are ready. | `helm upgrade --help`; Helm 4 overview |
| `--timeout` is the maximum time to wait | Help text: time to wait for any individual Kubernetes operation (such as hook Jobs), default `5m0s`; it also bounds the readiness wait. | `helm upgrade --help` |
| Argo CD **and Flux** run `helm template` | Argo CD renders with `helm template` and applies the output itself, so no Helm release records exist. Flux's helm-controller runs Helm SDK install/upgrade inside the cluster and *does* write release Secrets. | Argo CD Helm guide; Flux HelmRelease docs |
| `helm template` makes zero network calls | It never contacts the Kubernetes API unless `--dry-run=server` is set, but it may download a remote chart or missing dependencies from a repository or registry. | `helm template --help` |
| `kubectl apply` stores state in the `last-applied-configuration` annotation | True for client-side apply. Server-side apply tracks field ownership in `managedFields`. Helm 4 uses server-side apply by default for new releases and keeps the previous method on upgrade (`--server-side=auto`). | Kubernetes SSA docs; `helm upgrade --help` |
| `helm list -A` is like `kubectl get pods -A` | Dropped: it lists release records, not workloads. | — |
| `helm uninstall` deletes release secrets | Deletes history unless `--keep-history`; resources annotated `helm.sh/resource-policy: keep` and CRDs from `crds/` stay. | `helm uninstall --help`; charts and hooks docs |
| GitOps replaced `helm upgrade` | Presented as a trade-off between push and pull delivery, not a replacement. The chart artifact in the registry is also part of the source of truth. | — |
| Example: `alias: redis-cache` with `condition: redis.enabled`, then `redis-cache.enabled: true` in values | That pairing doesn't toggle anything. A condition is a path in the **parent's** values; `redis.enabled` doesn't exist there, and Helm ignores a condition path it can't find, so the subchart stays enabled even with `redis-cache.enabled: false`. Use `condition: cache.enabled` with values under `cache:`. | Reproduced with Helm 4.2.2 on 2026-10-17: aliased subchart rendered with its toggle set to `false` until the condition matched the alias |
| `Chart.lock` stores exact versions and SHA-256 hashes; `build` fetches the exact locked hash, so CI is 100% reproducible | `Chart.lock` stores exact versions and **one** `digest` of the dependency declarations, not a hash of each archive. `build` re-downloads the locked versions; it doesn't verify archive contents. Reproducibility therefore also depends on the repository or registry never republishing a version. Pin OCI dependencies in immutable repositories, or vendor archives. | `Chart.lock` produced by Helm 4.2.2; `helm dependency build --help` |
| `build` never resolves anything | If `Chart.lock` is missing, `build` behaves like `update`. If `Chart.yaml` and the lock disagree, it fails. | `helm dependency build --help`; reproduced error text |
| Dependencies are declared in `Chart.yaml` “in Helm 3” | Applies to every `apiVersion: v2` chart in Helm 3 and Helm 4. The older `requirements.yaml` belongs to `apiVersion: v1` charts. | Charts topic |
| Global values are accessible by the parent and all subcharts | Correct, with the scoping rule stated: a subchart sees only its own section (by name or alias) plus `global`; it can't read the parent's other keys. | Subcharts and globals guide; local render |
| Library chart “deploys nothing” | Correct: Helm refuses to install it (“library charts are not installable”), and only its named templates (`define`) are used; a manifest file inside a library renders nothing. | Reproduced with Helm 4.2.2 |

## Visual thesis

**Three benches, one parcel.** The canvas is a left-to-right track across three bounded zones—*Workstation / CI*, *Registry*, *Cluster*—with the chart as a parcel that changes form as it moves: directory → rendered YAML → `.tgz` → release record. Every command is drawn as an action at a bench, and the two boundary lines (to the registry, to the Kubernetes API) light up only when a command actually crosses them. Later views zoom into one bench while keeping a mini-track at the top of the canvas showing where we are. In the Compose group the parcel opens to show **nested parcels**—subcharts inside the parent—so the reader sees that one chart can carry others while still producing one release.

## Semantic color and diagram grammar

Uses the brief's semantic colors and connector rules.

| Element | Form | Meaning |
| --- | --- | --- |
| Zone frame | Dashed rounded frame with label tab | Workstation/CI, Registry, Cluster (namespace `payments` nested inside) |
| Parcel | Small card with a form badge: `dir`, `yaml`, `tgz`, `rev N` | The persistent chart in its current form |
| Nested parcel | Smaller card inside the parent parcel, with a name tag (`postgresql`, `cache ← redis`, `platform-common · library`) | A subchart; alias shown as `alias ← chart name` |
| Value pipe | Cyan solid arrow from a parent values section into a nested parcel | Values passed to that subchart |
| Blocked pipe | Dashed amber arrow with ✕ | A value the reader might expect to pass but doesn't (parent key into a subchart) |
| Cyan solid arrow + moving dot | Data moving now | Chart bytes, rendered manifests, or API requests in flight |
| Purple solid arrow | Kubernetes API call | Reads (`get`, server dry-run) labelled `read`; writes labelled `write` |
| Purple badge on frame | Control-plane state | Release record, hook phase |
| Dashed grey arrow | Configuration or reference | `Chart.yaml` → `Chart.lock`, values file → template, `include` → library template |
| Green badge | `deployed`, `ready`, `verified`, `enabled` | Healthy or active state |
| Amber badge with clock | `pending-upgrade`, `waiting` | In transition, bounded by `--timeout` |
| Red badge with ✕ | `failed`, `ImagePullBackOff`, `verify failed`, `out of sync` | Failure state |
| Grey strikethrough badge | `superseded`, `disabled` | Older revision still stored, or a subchart switched off |
| Numbered circles | Strict order | Lifecycle steps |
| Boundary line crossing | Thick tick on the zone edge with label `network` or `cluster API` | Proves whether the command crossed that boundary |

State is always conveyed by badge text and icon as well as color.

## Console structure

- **Index groups (6), one open at a time; counter `NN / 15`:**
  1. **Three jobs** — 1 Where commands run
  2. **Render** — 2 Chart anatomy · 3 Values merge · 4 Render offline
  3. **Compose** — 5 Umbrella chart · 6 Scoped values · 7 Lock and fetch · 8 Library charts
  4. **Package** — 9 Package and pull
  5. **Release** — 10 Release records · 11 Upgrade lifecycle · 12 Failed upgrade · 13 Inspect a release
  6. **Delivery** — 14 Push or pull · 15 Safe change loop
- **Toolbar:** active view label and scenario ribbon.
- **Canvas:** mini-track (views 2–15), view heading, controls, diagram, optional output panel (YAML, `Chart.lock`, `helm history`, or Secret excerpt).
- **Inspector (right ≥ 1100 px, below otherwise):** what happens, why it matters, one command, observable evidence, caveat, sources.
- **Bottom strip:** the takeaway for the active view, previous/next, sources and scope, related visuals, footer.
- **Default view:** 1, with no command selected (all three zones visible, no boundary lit).
- **Fragments:** `#where`, `#chart`, `#values`, `#template`, `#subcharts`, `#scoping`, `#dependencies`, `#library`, `#artifact`, `#release`, `#upgrade`, `#rollback`, `#inspect`, `#delivery`, `#practice`, `#helm-sources`. Sub-state fragments: `#where-<command>` (for example `#where-pull`), `#subcharts-<preset>` (`all`, `cache-off`, `alias-mismatch`), `#rollback-<preset>` (`no-wait`, `wait`, `rollback`, `cleanup`, `interrupted`). Selecting a view or preset pushes history; Back/Forward restore the view, group, and preset. New topic: no legacy anchors to alias.
- **No JavaScript:** all 16 views stack in order inside the console; view 1 lists every command with its four answers; view 3 shows the full precedence stack and final values; view 5 shows each toggle preset's rendered subcharts as a table; view 6 shows the visibility matrix; view 11 lists every step; view 12 shows each preset's outcome as a row; inspector copy and takeaways follow each view.

## Narrative sequence

| # | Index group / view | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Three jobs / Where commands run | Which Helm commands touch my cluster? | Three-zone track; command selector lights boundaries | Selector with inspector (8 commands) | Only release commands write to the cluster; render and package commands stop at your machine or the registry. |
| 2 | Render / Chart anatomy | What is actually inside a chart? | File tree with role tags | Select a file | A chart is templates plus defaults plus metadata; nothing in it is Kubernetes-ready until values are applied. |
| 3 | Values merge | Which value wins? | Layered stack feeding one template and its output | **Hero 1:** toggle layers, edit one `--set` | Later layers win key by key; maps merge, lists replace. |
| 4 | Render offline | Is `helm template` output what the cluster gets? | Two-column comparison: offline vs server dry-run | Toggle mode | Offline rendering guesses cluster facts; use `--dry-run=server` or `--api-versions` when the chart asks the cluster. |
| 5 | Compose / Umbrella chart | How does one chart deploy Postgres and Redis too? | Parent parcel with nested subchart parcels and their sources; rendered-objects list | Three presets: all on, cache off, alias mismatch | Subcharts render into the parent's single release; a `condition` is a path in the parent's values and is ignored if that path is missing. |
| 6 | Scoped values | Which values can each subchart see? | Parent values sections piped into nested parcels; visibility matrix | Select a chart to see its `.Values` | A subchart sees its own section and `global`, nothing else; the section name is the alias when there is one. |
| 7 | Lock and fetch | Why does CI build different charts on different days? | `Chart.yaml` range → `Chart.lock` pin → `charts/*.tgz`, with Git boundary | Toggle `dep update` / `dep build`, “next week”, out-of-sync, commit policy | `update` chooses versions; `build` reproduces the lock, provided nobody republishes a version. |
| 8 | Library charts | How do 50 services share one Deployment template? | Library parcel with `define` blocks; app templates `include` them; no objects from the library | Toggle between app chart and installing the library directly | A library supplies named templates and renders nothing by itself. |
| 9 | Package / Package and pull | How does a chart move between teams and networks? | Flow from directory to registry and back, with air-gap relay | Step through 4 hops; toggle `--verify` | A chart is an immutable, versioned artifact; verify the bytes before you trust the templates. |
| 10 | Release / Release records | Where does Helm remember what it deployed? | Ledger of Secrets with a selected record opened | Select a revision | Each install, upgrade, or rollback writes a new record; the record, not the live objects, is Helm's memory. |
| 11 | Upgrade lifecycle | What happens between pressing Enter and “deployed”? | Numbered step-through across the cluster zone | **Hero 2:** 9 steps; install vs upgrade toggle | `upgrade --install` writes the record first, applies, optionally waits, then marks the result. |
| 12 | Failed upgrade | What does a failed upgrade leave behind? | Failure lab: one bad tag, five flag presets | **Hero 3:** presets + replay | Without `--wait`, Helm reports success on acceptance; with rollback-on-failure, a failure becomes a new revision that restores the last good one. |
| 13 | Inspect a release | How do I see and repair a release? | Command board around the ledger | Select a command | History, status, values, and manifest come from the record; live drift doesn't appear there. |
| 14 | Delivery / Push or pull | Should CI run Helm, or should a controller? | Three-lane comparison: CI push, Argo CD, Flux | Select lane; inject manual drift | Argo CD uses Helm as a renderer; Flux and CI use it as a release manager; credentials and drift handling differ. |
| 15 | Safe change loop | What routine keeps Helm changes safe? | Six-step loop with checks | Step through | Lint, render and scan, diff, upgrade with wait and rollback, test, then watch history. |

Fifteen views is at the top of a detailed overview; the Compose group earns its four views because subchart scoping and lock behavior are where umbrella charts most often surprise people. Views 1, 2, 5, 6, 7, 8, 9, 10, 13, and 14 use light selectors or presets; views 4 and 15 are near-static. The hero budget stays at three.

---

## Visual contracts

### Visual 1 — `Where each command runs`

#### Purpose
Collapses the notes' three-hats diagram and summary matrix into one picture so readers stop treating Helm as one thing that always talks to the cluster.

#### Learner question
“If I run this command in CI, does it need cluster credentials?”

#### Persistent scenario state
`payment-api` exists in three forms at once: a directory on the laptop, `1.2.0` in the registry, and revision 2 in `payments`.

#### Concepts and actors
Workstation/CI zone (chart directory, Helm CLI, kubeconfig icon), Registry zone (OCI repository `charts/payment-api`, tags `1.1.0`, `1.2.0`), Cluster zone (Kubernetes API, namespace `payments`, release record stack, Deployment/Service). Commands: `template`, `lint`, `dependency build`, `package`, `push`, `pull`, `upgrade --install`, `rollback`, `test`, `uninstall` (show 8 by default; `dependency build` and `uninstall` in an expander).

#### Composition
Three zones left to right, equal height. Command chips sit in a row above the track, grouped by zone colour tab: *Render* (template, lint), *Package* (package, push, pull), *Release* (upgrade -i, rollback, test). Selecting a chip draws its path: arrows from where it runs to what it reads and writes; boundary ticks light on the Registry edge and/or the Cluster edge. A four-row answer card under the track: **Runs on** · **Network** · **Cluster API** (none / read / write) · **New revision**.

#### Interaction
Native radio group of chips; arrow keys move selection. Default: none selected, card shows “Pick a command”. Selecting updates the canvas, card, inspector, and `#where-<command>`. `aria-live="polite"` announces “helm pull: runs on workstation, contacts registry, no cluster API, no revision.”

#### Data or content states

| Command | Runs on | Network | Cluster API | New revision |
| --- | --- | --- | --- | --- |
| `template` | Workstation/CI | Only if chart or deps are remote | None (read with `--dry-run=server`) | No |
| `lint` | Workstation/CI | No | None | No |
| `package` | Workstation/CI | No (unless `--dependency-update`) | None | No |
| `push` | Workstation/CI | Registry write | None | No |
| `pull` | Workstation/CI | Registry read | None | No |
| `upgrade --install` | Workstation/CI | Registry read if chart is remote | Read + write | Yes |
| `rollback` | Workstation/CI | No | Read + write | Yes |
| `test` | Workstation/CI | No | Read + write (test Pods) | No |
| `uninstall` | Workstation/CI | No | Write (deletes) | Removes history unless `--keep-history` |

#### Failure or edge state
Selecting `template` with a “server dry-run” toggle lights the Cluster edge as `read` only—shows the one way a render command reaches the API.

#### Required copy
- Heading: “Where each command runs”
- Takeaway: “Only release commands change the cluster. Rendering and packaging stop at your machine or the registry.”
- Inspector correction: “Every Helm command runs where you type it. Helm 3 removed Tiller, so there's no Helm server in the cluster—only the records Helm writes there.”

#### Accuracy caveats
`test` creates Pods but doesn't add a revision. Flux's controller runs the same actions from inside the cluster (view 14).

#### Mobile behavior
Zones stack vertically (Workstation → Registry → Cluster) with boundary ticks drawn as horizontal bars between them; chips wrap into a 2-column grid; answer card follows.

#### Accessibility
Radio group with legend “Helm command”; zones are `figure` with text labels; boundary state also shown as text (“crosses: registry”); live region as above; reduced motion replaces the travelling dot with an instantly drawn arrow.

#### Source anchors
Helm overview; command references for template, pull, push, upgrade, rollback, test, uninstall.

#### Acceptance checks
- Each command shows the four answers in the table exactly.
- Only `upgrade`, `rollback`, `test`, `uninstall` light the Cluster edge as `write`.
- `#where-pull` loads view 1 with `pull` selected.

---

### Visual 2 — `What a chart contains`

#### Purpose
Gives readers the primitive every later view depends on: chart files and their jobs.

#### Learner question
“What's in this directory, and which file matters for what?”

#### Persistent scenario state
`charts/payment-api/` on the laptop.

#### Concepts and actors
`Chart.yaml` (name, `version` 1.2.0 = chart version, `appVersion` 4.7.1 = app version, `dependencies`), `values.yaml`, `values.schema.json` (optional), `templates/deployment.yaml`, `templates/service.yaml`, `templates/_helpers.tpl` (named templates, renders nothing), `templates/NOTES.txt`, `templates/tests/test-connection.yaml` (hook `test`), `charts/` (vendored dependency archives), `Chart.lock`, `crds/` (installed before templates, never upgraded or deleted by Helm).

#### Composition
Tree on the left (≈40%); right panel shows the selected file's short excerpt and a role tag: *metadata*, *defaults*, *template*, *helper*, *hook*, *dependency*, *CRD*. Dashed arrows from `values.yaml` and `_helpers.tpl` to `deployment.yaml` show references.

#### Interaction
Selector (tree items are buttons). Default: `Chart.yaml`. Static alternative would hide the role of `_helpers.tpl` and `crds/`; the selector keeps the tree uncluttered.

#### Data or content states
Excerpts generated from `helm create payment-api` (Helm 4.2.2) trimmed to 6–10 lines.

#### Failure or edge state
`crds/` selected: badge “install-only” with note that Helm doesn't upgrade or delete these.

#### Required copy
- Takeaway: “A chart is templates, defaults, and metadata. None of it is Kubernetes YAML until values fill the templates.”
- Correction placed on `Chart.yaml`: “`version` is the chart's version; `appVersion` describes the app inside. Bumping the image doesn't require bumping `appVersion`, but publishing a changed chart requires a new `version`.”

#### Accuracy caveats
`charts/` may contain unpacked subchart directories instead of archives.

#### Mobile behavior
Tree above, excerpt below.

#### Accessibility
Tree as nested list of buttons with `aria-pressed`; excerpt in `pre` with label.

#### Source anchors
Helm charts topic; chart hooks (test, CRDs).

#### Acceptance checks
Every listed file has a role tag; `version` vs `appVersion` distinction visible.

---

### Visual 3 — `Which value wins` (Hero 1)

#### Purpose
Values precedence causes most “why is replicaCount still 2?” confusion.

#### Learner question
“I passed three values files and a `--set`. What did the template actually get?”

#### Persistent scenario state
Rendering `payment-api` for production.

#### Concepts and actors
Layers bottom-to-top: (1) chart `values.yaml`, (2) parent chart values for subchart `redis` (shown as a side note), (3) `-f values.yaml`, (4) `-f values-production.yaml`, (5) `--set image.tag=4.7.2`. Output: merged values panel and rendered Deployment excerpt.

#### Composition
Left: stacked translucent sheets, top wins, each showing 4 keys (`replicaCount`, `image.tag`, `resources.limits.memory`, `ingress.hosts`). Centre: arrow into a template snippet `replicas: {{ .Values.replicaCount }}`. Right: merged values with each key labelled by the winning layer, and the rendered YAML lines.

#### Interaction
Checkbox per layer (1 is fixed on); a text input for the `--set` value of `image.tag`; a toggle “list override” demonstrating that `ingress.hosts` in a later file **replaces** the whole list. Changing anything animates only the changed keys (fade-highlight 300 ms). Reset button restores all layers on. Live region: “replicaCount = 5 from values-production.yaml”.

#### Data or content states
Chart default `replicaCount: 2`, `image.tag: ""` (falls back to `appVersion` via helper), `memory: 256Mi`, hosts `[payment.example.com]`; values-production `replicaCount: 5`, `memory: 512Mi`, hosts `[pay.example.com]`; `--set image.tag=4.7.2`.

#### Failure or edge state
Upgrade toggle with `--reuse-values` vs `--reset-values` vs `--reset-then-reuse-values` (expander): shows how a value set on revision 2 can silently persist or vanish on revision 3.

#### Required copy
- Takeaway: “Later layers win key by key. Maps merge; lists are replaced whole.”
- Inspector: “Files apply in the order you pass them, then `--set` and its variants. On upgrade, Helm starts from the chart's defaults unless you ask it to reuse the last release's values.”

#### Accuracy caveats
`--set-file`, `--set-json`, `--set-string`, and `--set-literal` share `--set` precedence; `null` deletes a key. Subchart values come from the parent's key named after the subchart and from `global`.

#### Mobile behavior
Layer checklist → merged values → rendered YAML, vertical.

#### Accessibility
Native checkboxes with labels naming the file; merged keys show winning-layer text; live region; reduced motion removes highlight fade.

#### Source anchors
Values files guide; `helm upgrade --help` (reuse/reset flags).

#### Acceptance checks
Disabling layer 4 changes `replicaCount` to 2 and hosts to the chart default; `--set` always wins; list replacement visible.

---

### Visual 4 — `What offline rendering can't know`

#### Purpose
Corrects “`helm template` output = what will be applied”.

#### Learner question
“Why does my rendered YAML differ from what `helm install` produced?”

#### Persistent scenario state
Rendering in CI with no kubeconfig.

#### Concepts and actors
Inputs to rendering: values, `.Release` (name, namespace, `IsInstall`/`IsUpgrade`), `.Capabilities` (`KubeVersion`, `APIVersions`), `lookup` function. Modes: offline (`helm template`), `--api-versions`/`--kube-version` supplied, `--dry-run=server`.

#### Composition
Two columns: *Offline* and *Server dry-run*. Rows: Capabilities.KubeVersion, APIVersions (e.g. `policy/v1/PodDisruptionBudget`, `monitoring.coreos.com/v1`), `lookup` result for an existing Secret, `.Release.IsUpgrade`, schema validation against cluster, hooks included. Each cell shows the value and its source (“built-in default”, “flag”, “cluster”). A purple arrow appears to the API only in the right column, labelled `read`.

#### Interaction
Segmented control: Offline / Offline + `--api-versions` / Server dry-run. Mostly comparative; the three states show how cluster-dependent template branches change output (a `ServiceMonitor` appears only when `monitoring.coreos.com/v1` is known).

#### Failure or edge state
Offline: `lookup` returns empty, so a chart that reuses an existing password generates a new random one; Argo CD sees perpetual diff (link to view 14).

#### Required copy
- Takeaway: “Offline rendering fills cluster facts with defaults. Supply them with flags, or render against the server.”
- Correction: “`--validate` is deprecated in Helm 4; use `--dry-run=server`, which needs cluster read access.”
- `-s templates/deployment.yaml` shown as a command tip.

#### Accuracy caveats
Server dry-run still doesn't run hooks against the cluster or wait for readiness.

#### Mobile behavior
Rows become cards with “Offline / Server” pairs.

#### Accessibility
Native radio group; table with headers in no-JS mode.

#### Source anchors
`helm template --help` text (faked values); functions list (`lookup`); built-in objects.

#### Acceptance checks
The `ServiceMonitor` toggles with the API version; `lookup` empty offline.

---

### Visual 5 — `One chart that carries others`

#### Purpose
Shows what an umbrella chart is and corrects the most common toggle mistake: a `condition` that doesn't match the alias.

#### Learner question
“How does my app chart deploy Postgres and Redis too, and how do I switch one off?”

#### Persistent scenario state
`payment-api` with its three dependencies declared; `charts/` already populated.

#### Concepts and actors
Parent chart; dependency entries with `name`, `version`, `repository` (three kinds: HTTP repository URL, `oci://` reference, `file://` path), `condition`, `tags`, `alias`; subcharts `postgresql`, `cache` (from chart `redis`), `platform-common` (library); rendered objects; the single release `payment-api`.

#### Composition
Left: the `dependencies:` block as three selectable rows, each with a source badge (`https`, `oci`, `file`). Centre: the parent parcel containing three nested parcels, each tagged with the section name it reads (`postgresql`, `cache ← redis`, `platform-common · library`). Right: “Rendered objects” list grouped by source path, exactly as `helm template` prints them (`payment-api/charts/cache/templates/…`). A dashed purple frame around everything labelled “one release: payment-api”.

#### Interaction
Preset radio group:
- **All on** (`postgresql.enabled: true`, `cache.enabled: true`) — every subchart renders except the library, which contributes no objects.
- **Cache off** (`cache.enabled: false`, condition `cache.enabled`) — the `cache` parcel greys with a `disabled` badge; its objects leave the list.
- **Alias mismatch** (condition `redis.enabled`, values `cache.enabled: false`) — the `cache` parcel stays `enabled`; an amber note points at the condition: “Path `redis.enabled` not found in parent values, so Helm ignores the condition.”
Changes animate only the affected parcel and list entries. Live region announces the count of rendered objects and which subcharts are enabled.

#### Data or content states
Two aliases of the same chart (for example `cache` and `sessions` from `redis`) shown in an expander to explain why `alias` exists. `tags:` shown as a secondary switch (`tags.datastores: false` disables both `postgresql` and `cache` unless a condition says otherwise; conditions override tags).

#### Failure or edge state
The alias-mismatch preset is the failure state, reproduced on Helm 4.2.2.

#### Required copy
- Heading: “One chart that carries others”
- Takeaway: “Subcharts render into the parent's single release. A `condition` is a path in the parent's values, and Helm ignores it when that path doesn't exist.”
- Inspector: “When you alias a dependency, Helm uses the alias everywhere the chart's name would appear: its values section, its condition path, and the directory name in rendered sources.”

#### Accuracy caveats
Conditions can list several comma-separated paths; the first that exists decides. Subcharts don't get separate releases, revisions, or rollbacks; uninstalling the parent removes them all.

#### Mobile behavior
Dependency rows, then nested parcels stacked vertically, then rendered list.

#### Accessibility
Presets as native radios; parcels as list items with state text (`enabled`/`disabled`); rendered list as `ul`; reduced motion swaps fades for instant state changes.

#### Source anchors
Charts topic (dependencies, conditions and tags, alias); `helm template` output.

#### Acceptance checks
- Cache off removes every `charts/cache/` source from the list.
- Alias mismatch keeps them and explains why.
- The library never contributes objects.

---

### Visual 6 — `What each chart can see`

#### Purpose
Makes value scoping concrete; complements Hero 1 (which value wins) with which chart receives it.

#### Learner question
“I set `image.repository` in the parent. Why doesn't Postgres pick it up, and how do I share a pull secret with everything?”

#### Persistent scenario state
Rendering production values for the umbrella chart.

#### Concepts and actors
Parent `values-production.yaml` with sections: top-level app keys (`replicaCount`, `image`), `postgresql:`, `cache:`, `global:` (`environment: production`, `imagePullSecrets`). Each chart's effective `.Values`.

#### Composition
Left: parent values file with each section color-banded and labelled. Right: three chart parcels (parent, `postgresql`, `cache`). Cyan pipes connect `postgresql:` → postgresql, `cache:` → cache, `global:` → all three. A dashed amber ✕ pipe from parent `image:` to `postgresql` shows the blocked path. Below: a visibility matrix (rows = keys, columns = charts, cells “sees” / “—”).

#### Interaction
Select a chart to open its effective `.Values` (parent section merged over the subchart's own defaults, plus `global`). Static matrix remains visible.

#### Data or content states

| Key in parent values | Parent sees | `postgresql` sees | `cache` sees |
| --- | --- | --- | --- |
| `replicaCount: 3` | `.Values.replicaCount` | — | — |
| `postgresql.auth.database: payments` | `.Values.postgresql.auth.database` | `.Values.auth.database` | — |
| `cache.architecture: standalone` | `.Values.cache.architecture` | — | `.Values.architecture` |
| `global.environment: production` | `.Values.global.environment` | `.Values.global.environment` | `.Values.global.environment` |

#### Failure or edge state
Values written under `redis:` (the chart name) instead of `cache:` (the alias) reach nothing; the inspector shows the subchart still using its own defaults.

#### Required copy
- Takeaway: “A subchart sees its own section and `global`, nothing else. When there's an alias, the section is named after the alias.”
- Inspector: “Scoping protects a subchart from the parent's keys, and it means a subchart can't read them either. Share settings through `global`, or have the parent pass them into the subchart's section.”

#### Accuracy caveats
A subchart only uses a `global` key if its templates reference it; `global.imagePullSecrets` is a convention many charts follow, not a Helm feature. `import-values` can copy child values up to the parent (mentioned, not drawn).

#### Mobile behavior
Values file, then one chart card at a time via the selector, then matrix as cards.

#### Accessibility
Selector radios; matrix as a real table with headers; pipe meanings repeated in matrix text.

#### Source anchors
Subcharts and global values guide; values files guide.

#### Acceptance checks
Matrix matches a local render of the scenario chart (Helm 4.2.2 confirmed: subchart sees `global` and its own section, not parent keys).

---

### Visual 7 — `Ranges, locks, and vendored charts`

#### Purpose
Shows the lock file's real guarantees and the commit-or-ignore decision for `charts/*.tgz`.

#### Learner question
“Which dependency command should CI run, and should the archives live in Git?”

#### Persistent scenario state
`postgresql` declared as `~16.2.0`; `16.2.3` is current; a week later `16.2.4` is published.

#### Concepts and actors
`Chart.yaml` dependency ranges → `Chart.lock` (exact versions, one `digest`, `generated` timestamp) → `charts/postgresql-16.2.3.tgz`, `charts/redis-20.1.4.tgz`, `charts/platform-common-1.0.0.tgz`. Repository/registry on the right. Git boundary line separating committed files from build output.

#### Composition
Three boxes left→right with dashed config arrows; registry on the right; a horizontal Git line under the boxes showing which files sit above it (committed) for the selected policy.

#### Interaction
- Command toggle: `helm dependency update` / `helm dependency build`.
- Time toggle: Today / Next week. `update` next week rewrites the lock to 16.2.4; `build` stays on 16.2.3.
- Edge toggles: *Chart.yaml edited, lock not updated*; *No Chart.lock*; *Registry republished 16.2.3*.
- Commit policy toggle: *Thin repo* (commit `Chart.lock`, ignore `charts/*.tgz`, run `build` in CI) / *Vendored* (commit archives; builds work offline and are immune to republishing, at the cost of binary files in Git and manual updates).

#### Data or content states
`Chart.lock` excerpt matching Helm 4.2.2 format: `dependencies:` list with `name`, `repository`, `version`, then `digest: sha256:…` and `generated:`.

#### Failure or edge state
- Out of sync: `build` fails with “the lock file (Chart.lock) is out of sync with the dependencies file (Chart.yaml). Please update the dependencies with 'helm dependency update'” (Helm 4.2.2, checked 2026-10-17).
- No lock: `build` behaves like `update` (help text).
- Republished version: `build` downloads the new bytes without complaint; amber note: “The lock pins a version, not the archive's contents.”

#### Required copy
- Takeaway: “`update` resolves ranges and rewrites the lock. `build` reproduces the lock, as long as nobody republishes a version.”
- Correction: “`Chart.lock` holds exact versions and one digest of your dependency list. It doesn't hash each archive, so pin dependencies in registries that refuse to overwrite a version, or vendor the archives.”

#### Accuracy caveats
`file://` dependencies are packaged from the local path at `update`/`build` time. `helm template`/`install --dependency-update` can run the update implicitly; CI should prefer an explicit `build`. Whether Argo CD runs `dependency build` for Git-sourced charts depends on its version and configuration; verify before stating.

#### Mobile behavior
Vertical chain with the Git line as a labelled divider.

#### Accessibility
Radios for each toggle group; results as text; error message in a live region.

#### Source anchors
`helm dependency build`, `helm dependency update` references; charts topic (dependencies).

#### Acceptance checks
Lock version differs only in update + next week; out-of-sync, no-lock, and republish states show the described outcomes; commit policy moves the right files across the Git line.

---

### Visual 8 — `Shared templates without shared objects`

#### Purpose
Explains library charts and contrasts them with application subcharts.

#### Learner question
“How do 50 services reuse one hardened Deployment template without copying it?”

#### Persistent scenario state
`platform-common` 1.0.0 (`type: library`) is a dependency of `payment-api`.

#### Concepts and actors
Library `Chart.yaml` (`type: library`), `templates/_deployment.tpl` with `{{- define "platform-common.deployment" -}}`, app `templates/deployment.yaml` containing `{{- include "platform-common.deployment" . }}`, the app's values feeding the included template, rendered Deployment.

#### Composition
Left: library parcel showing named-template blocks (no rendered-objects area, badge “renders nothing”). Centre: app template with one `include` line, dashed grey arrow to the `define`. Right: the rendered Deployment with lines tinted by origin (library skeleton vs app values).

#### Interaction
Toggle: *Use from app chart* (renders Deployment named `payment-api`) / *Install the library directly* (red result: “Error: INSTALLATION FAILED: library charts are not installable”). Secondary toggle: a stray `configmap.yaml` inside the library renders nothing either way.

#### Data or content states
Library defines `platform-common.deployment`, `platform-common.labels`; app passes `.` so the template reads the app's `.Values` and `.Release`.

#### Failure or edge state
Direct install error (reproduced on Helm 4.2.2).

#### Required copy
- Takeaway: “A library supplies named templates and renders nothing by itself. The calling chart's values fill them.”
- Inspector: “Bumping the library version changes every service that upgrades to it, so version the library like an API and roll changes out through each app's lock file.”

#### Accuracy caveats
Application charts can also expose named templates; `type: library` makes the intent explicit and prevents installation. Named templates share one global namespace; prefix names with the chart name.

#### Mobile behavior
Library, app template, rendered output stacked.

#### Accessibility
Radios; code in `pre`; origin tinting duplicated with line prefixes (`lib` / `app`).

#### Source anchors
Library charts topic; named templates guide.

#### Acceptance checks
Library contributes no objects; direct install shows the exact error.

---

### Visual 9 — `Package, push, pull, verify`

#### Purpose
Covers the artifact-manager job, including air-gapped relay and provenance.

#### Learner question
“How does a chart get from our build to a cluster that can't reach the internet?”

#### Persistent scenario state
`payment-api-1.2.0.tgz` built and pushed; a jump host relays an upstream chart.

#### Concepts and actors
`helm package` (directory → `.tgz`, optional `--sign` → `.prov`), `helm push` to OCI (`oci://registry.example.com/charts`, tag = chart version), `helm pull` (`--version`, `--untar --untardir`, `--verify --keyring`), HTTP repository (`index.yaml`, `helm repo add`) as an alternate, internal registry for air-gapped flow.

#### Composition
Four numbered hops across the Workstation and Registry zones. Alternate tab: *Air-gapped relay* — public registry → jump host (pull, scan, verify) → internal registry (push) → cluster pulls internally.

#### Interaction
Step-through (4 hops) plus a `--verify` toggle with states: verified ✓ (signed by key in keyring), failed ✕ (no `.prov` file: “`--verify` requires a provenance file”), failed ✕ (digest mismatch). Tabs are a genuine alternate state.

#### Failure or edge state
Pushing `1.2.0` again with changed contents: registry policy may reject or overwrite; recommend immutable tags. (Behavior is registry-specific; label as such.)

#### Required copy
- Takeaway: “Package once, version immutably, verify before trusting the templates.”
- Correction: “`helm pull` doesn't render or install. With `--verify`, the chart must have a provenance file and pass, or nothing is saved.”

#### Accuracy caveats
OCI references don't use `helm repo add`. Cosign/Notation signing of OCI artifacts is outside Helm's `.prov` mechanism; mention as a handoff.

#### Mobile behavior
Numbered vertical hops.

#### Accessibility
Step buttons with `aria-current="step"`; verify result in live region.

#### Source anchors
Registries topic; provenance topic; `helm package`, `push`, `pull` references.

#### Acceptance checks
Verify failure saves nothing; air-gap tab shows the internal registry as the cluster's only source.

---

### Visual 10 — `The release ledger`

#### Purpose
Makes Helm's state visible: release records as Secrets.

#### Learner question
“Where does Helm remember what it deployed, and how is that different from `kubectl apply`?”

#### Persistent scenario state
Namespace `payments` holds revisions 1 (superseded), 2 (deployed).

#### Concepts and actors
Secret `sh.helm.release.v1.payment-api.v2`, type `helm.sh/release.v1`, labels `owner=helm`, `name=payment-api`, `status=deployed`, `version=2`; `data.release` = base64 of gzipped JSON containing chart metadata, values used, rendered manifest, hooks, info (status, timestamps, notes). Comparison strip: kubectl client-side apply (annotation per object), server-side apply (`managedFields` per object), Helm (one record per revision per release).

#### Composition
Ledger of stacked Secret cards in the Cluster zone; selected card expands to a decoded view with collapsible sections. Below, a three-column comparison strip.

#### Interaction
Select a revision. Static comparison strip.

#### Failure or edge state
`--history-max` (default 10): an 11th upgrade prunes the oldest record; rollback to a pruned revision is impossible.

#### Required copy
- Takeaway: “Each install, upgrade, or rollback writes a new record. That record, not the live objects, is Helm's memory.”
- Inspector: “`HELM_DRIVER` can store records as ConfigMaps or in SQL, but Secrets are the default—so anyone who can read Secrets in `payments` can read every values file you deployed.”

#### Accuracy caveats
Records live in the release namespace. Helm 4 may also track field ownership via server-side apply; the release record still exists.

#### Mobile behavior
Ledger becomes a vertical list; decoded view below.

#### Accessibility
List of buttons; decoded JSON in `pre`; status by text label.

#### Source anchors
Advanced topics (storage backends); `helm upgrade --help` (`--history-max`); Kubernetes server-side apply.

#### Acceptance checks
Secret name, type, labels, and contents match a real record; security note present.

---

### Visual 11 — `upgrade --install, step by step` (Hero 2)

#### Purpose
Shows the lifecycle and where hooks, apply, and waiting sit.

#### Learner question
“What does Helm do between Enter and ‘deployed’?”

#### Persistent scenario state
CI runs `helm upgrade --install payment-api oci://registry.example.com/charts/payment-api --version 1.2.0 -n payments -f values-production.yaml --wait --timeout 5m`.

#### Concepts and actors
Helm CLI, registry, Kubernetes API, release ledger, Deployment/ReplicaSet/Pods, hook Job (`pre-upgrade` migration).

#### Composition
Numbered steps along the mini-track; the Cluster zone enlarged. Steps:
1. Load the latest record for `payment-api` (none → install path, revision 1; else revision N+1).
2. Pull chart `1.2.0` (if remote) and merge values.
3. Render manifests and hooks; validate against the API's OpenAPI schema.
4. Write record `v3` with status `pending-upgrade` (or `pending-install`).
5. Run `pre-upgrade` hooks; wait for the hook Job to finish.
6. Apply manifests (server-side apply for new Helm 4 releases; prior method otherwise); delete resources absent from the new manifest.
7. Wait per strategy (`watcher` → kstatus readiness) up to `--timeout`.
8. Run `post-upgrade` hooks.
9. Mark `v3` `deployed`, `v2` `superseded`; print NOTES.

#### Interaction
Next/Previous/Replay/Pause; toggle *Release exists* vs *First install*; toggle *with/without `--wait`* (without: step 7 shows “skipped — hookOnly”). Live region announces step text. Ribbon updates rev and status.

#### Failure or edge state
Hand-off button at step 7: “Image never pulls → open view 12”.

#### Required copy
- Takeaway: “Helm writes the record first, applies, optionally waits, then marks the result.”
- Correction: “`--install` makes the command idempotent for CI: the same line installs revision 1 or upgrades to N+1.”

#### Accuracy caveats
Ordering is simplified: Helm sorts manifests by kind; hook weights order hooks; CRDs in `crds/` install only on first install.

#### Mobile behavior
Vertical numbered list with the active step expanded.

#### Accessibility
Ordered list of steps; controls are buttons; reduced motion advances without animation; pause available.

#### Source anchors
`helm upgrade` reference; chart hooks topic; Helm 4 overview (SSA, kstatus).

#### Acceptance checks
Install path shows revision 1 and `pending-install`; no-wait path skips readiness; record write precedes apply.

---

### Visual 12 — `What a failed upgrade leaves behind` (Hero 3)

#### Purpose
The most important production behavior: what `--wait`, `--rollback-on-failure`, and `--cleanup-on-fail` change.

#### Learner question
“If the new image never starts, what state is my release and my cluster in?”

#### Persistent scenario state
Revision 3 sets `image.tag=4.7.2-rc`, which doesn't exist; revision 3 also adds a new `ConfigMap payment-api-flags`.

#### Concepts and actors
Ledger (v2, v3, maybe v4), Deployment with old/new ReplicaSets, Pods in `ImagePullBackOff`, new ConfigMap, CLI exit status, timer ring for `--timeout`.

#### Composition
Left: preset radio list. Centre: cluster zone with ledger and workloads. Right/below: outcome card (CLI exit code, ledger, live state, what you do next).

#### Interaction
Presets (deep-linkable):

| Preset | Flags | CLI | Ledger | Live state |
| --- | --- | --- | --- | --- |
| `no-wait` | none | exit 0, “deployed” | v3 deployed, v2 superseded | Old Pods still serving; new Pods `ImagePullBackOff`; rollout stalled |
| `wait` | `--wait --timeout 5m` | fails after timeout | v3 failed, v2 superseded | Same broken rollout; ConfigMap remains |
| `rollback` | `--rollback-on-failure` | fails, reports rollback | v3 failed, v4 deployed (“Rollback to 2”) | Deployment back to 4.7.1; fate of the new ConfigMap to be confirmed on kind (open item 1) |
| `cleanup` | `--rollback-on-failure --cleanup-on-fail` | fails, reports rollback | v3 failed, v4 deployed | Deployment restored; new ConfigMap deleted |
| `interrupted` | runner killed at step 6 | none | v3 `pending-upgrade` | Next run: “another operation (install/upgrade/rollback) is in progress” |

Replay animates the timer ring and status changes. Manual rollback button: `helm rollback payment-api 2` from the `wait` state → v4 deployed.

#### Failure or edge state
`interrupted` is the stuck-lock case; inspector explains recovery: `helm history`, then `helm rollback` to the last deployed revision (verify recommended recovery against Helm 4 docs before copy freeze).

#### Required copy
- Takeaway: “Without `--wait`, ‘deployed’ means accepted. Rollback-on-failure turns a failure into a new revision that restores the last good one.”
- Correction: “A rollback doesn't delete revision 3 or rewind the counter; it writes revision 4 with revision 2's manifest.”
- Note: “On a first install, rollback-on-failure uninstalls the release instead.”

#### Accuracy caveats
Exact behavior of the `rollback` preset for resources created in v3 must be confirmed against 4.2.2 with a kind cluster before copy freeze (whether rollback alone removes the new ConfigMap or `--cleanup-on-fail` is required). Database migrations run by hooks are **not** rolled back.

#### Mobile behavior
Presets as a select-like radio list on top, cluster diagram, outcome card.

#### Accessibility
Radio group; outcome card in `aria-live`; badges with text; timer ring has text countdown; reduced motion jumps to end state.

#### Source anchors
`helm upgrade`, `helm rollback`, `helm history` references; chart hooks topic.

#### Acceptance checks
Every preset matches a run on a local cluster (kind) with Helm 4.2.2; `#rollback-cleanup` loads that preset.

---

### Visual 13 — `Inspect and repair a release`

#### Purpose
Turns the companion-command tables into a map of what each command reads.

#### Learner question
“Which command tells me what's deployed, and which tells me what's running?”

#### Persistent scenario state
After view 12's `rollback` preset: v4 deployed.

#### Concepts and actors
`helm list -A`, `helm status`, `helm history`, `helm get values` / `get manifest` / `get hooks`, `helm rollback`, `helm test`, `helm uninstall`, `helm diff upgrade` (plugin), plus `kubectl get`.

#### Composition
Ledger in the centre; commands arranged around it with arrows to what they read: record only (list, history, get), record + live (status shows resources), live write (rollback, test, uninstall). A small “manual drift” chip (`kubectl scale --replicas=8`) shows that `helm get manifest` still says 5.

#### Interaction
Selector; each shows a short realistic output excerpt.

#### Failure or edge state
`uninstall` selected: shows deletion of objects and records, with `--keep-history`, `resource-policy: keep`, and CRDs as exceptions.

#### Required copy
- Takeaway: “History, values, and manifests come from the record. Drift in live objects doesn't show up there.”

#### Accuracy caveats
`helm diff` is a third-party plugin (databus23/helm-diff); confirm Helm 4 compatibility before recommending.

#### Mobile behavior
Command list with output panel below.

#### Accessibility
Buttons with `aria-pressed`; output in `pre`.

#### Source anchors
Command references; helm-diff repository.

#### Acceptance checks
Drift example demonstrates record vs live difference.

---

### Visual 14 — `Push from CI or pull from a controller`

#### Purpose
Replaces “GitOps replaced helm upgrade” with an accurate three-way comparison.

#### Learner question
“Should CI run `helm upgrade`, or should Argo CD/Flux do it?”

#### Persistent scenario state
A commit bumps `image.tag` in `values-production.yaml`.

#### Concepts and actors
Lane A: CI runner with kubeconfig → `helm upgrade --install` → API (release records). Lane B: Argo CD repo-server renders with `helm template` → application controller applies and diffs → no release records, Helm hooks mapped to Argo CD hooks. Lane C: Flux source-controller fetches chart → helm-controller runs Helm install/upgrade in-cluster → release records, optional drift detection.

#### Composition
Three horizontal lanes sharing the same Git and registry on the left and the same namespace on the right. Credential icon shows where cluster write credentials live. Rows under lanes: Helm's role, release records, hooks, drift handling, credentials.

#### Interaction
Lane selector; “inject drift” button (`kubectl scale --replicas=8`): A — persists until next deploy; B — OutOfSync, reverted if self-heal enabled; C — corrected if drift detection enabled, otherwise persists.

#### Failure or edge state
Lane B with a chart using `randAlphaNum` or `lookup`: permanent OutOfSync.

#### Required copy
- Takeaway: “Argo CD uses Helm as a renderer; CI and Flux use it as a release manager. The choice moves credentials and decides who corrects drift.”

#### Accuracy caveats
Argo CD can use client- or server-side apply; hook mapping is annotation compatibility, not identical semantics (per Argo CD docs).

#### Mobile behavior
Lanes stack; comparison rows become per-lane cards.

#### Accessibility
Radio group; drift result in live region.

#### Source anchors
Argo CD Helm guide; Flux HelmRelease docs.

#### Acceptance checks
Lane B shows no release Secrets; Lane C shows them.

---

### Visual 15 — `A safe change loop`

#### Purpose
Converts the model into routine.

#### Learner question
“What should every Helm change go through?”

#### Composition
Six-step loop: 1 `helm lint` + schema → 2 `helm template` (with `--api-versions`) → policy/scan → 3 `helm diff upgrade` or server dry-run → 4 `upgrade --install --wait --rollback-on-failure --cleanup-on-fail` → 5 `helm test` → 6 watch `helm history` and workload health; prune with `--history-max`. Side checklist: pin chart versions, commit `Chart.lock`, immutable registry tags, restrict Secret read in release namespaces, never put secrets in values committed to Git.

#### Interaction
Step through; each step shows the command and what failure it catches.

#### Required copy
- Takeaway: “Check the render, preview the diff, let Helm wait and roll back, then test.”

#### Mobile, accessibility, sources, checks
Ordered list; command references; each step lists the failure caught.

---

## Persistent console elements

Title “Helm: One Chart, Three Jobs”, summary, metadata (collection, format, difficulty, tags, technologies, published/reviewed, version scope), grouped index with counter, canvas, inspector, bottom takeaway with previous/next, sources, related visuals (`kubernetes-api-server`, `containers`, `github-actions`, `devsecops-pipeline`, `git`), footer.

## Responsive and accessibility requirements

- 320 px to wide desktop; no page-level horizontal scroll at 320 px or 200% zoom.
- Below 1100 px the inspector moves under the canvas; below 760 px zones stack vertically and sequences become numbered lists.
- Native controls only; visible focus; 44 px targets for index and presets.
- Live regions on views 1, 3, 5, 7, 9, 11, 12, 14.
- Reduced motion: no travelling dots or timer sweeps; states change instantly.

## Prototype contract

`guide/topics/helm/helm-visual-prototype.html`: self-contained, one console, all 16 views with representative content, heroes 1–3 working, view 12 presets and view 14 drift working, grouped index with fragments and history, no-JS stacked reading order, sources.

## Integration guidance

- `src/content/topics/helm.mdx` with frontmatter per the schema; `collection: kubernetes`, `format: deep-dive`.
- Components in `src/components/helm/` on `TopicConsoleShell.astro` and the shared lesson console; copy and state data in one `helm-lesson` data module used by both the prototype generator (if used) and the page.
- Add a `scripts/verify-helm-lesson.mjs` that runs `helm create`, `template`, `lint`, `package`, `dependency build` and asserts the facts shown in views 2–9 and the flag help text; run view 12 presets against kind when available.
- Update the console migration checklist after integration.

## Deep-dive handoffs

| Proposed page | Why separate | Linked from | Persistent scenario |
| --- | --- | --- | --- |
| Helm template language | Functions, scopes, named templates, `tpl`, `required`, schema | Views 2, 3, 8 | One Deployment template growing conditionals |
| Umbrella chart design | `import-values`/`exports`, when to split releases instead, upgrade coupling between subcharts, CRD-bearing subcharts | Views 5–7 | `payment-api` splitting Postgres into its own release |
| Hooks and ordering | Weights, delete policies, test hooks, migration Jobs | View 11 | A schema migration hook on `payment-api` |
| Chart supply chain | `.prov` vs Cosign/Notation, digests, SBOMs, registry immutability | View 9 | `payment-api-1.2.0` from build to admission check |
| Argo CD and Flux with Helm | Rendering vs SDK, hook mapping, drift, multi-cluster | View 14 | One values commit promoted across environments |

## Page-level acceptance criteria

- Every flag behavior shown matches `helm <cmd> --help` for v4.2.2; Helm 3 names appear only as noted aliases.
- View 12 presets are confirmed on a real cluster before copy freeze.
- The ledger, values merge, and failure lab each change the ribbon consistently.
- `npm run check` and `npm run build` pass; browser QA at 1440/390/320 px, 200% zoom, no JS, reduced motion, fragments, Back/Forward.

## Open items before copy freeze

1. Run view 12 presets on kind with Helm 4.2.2 (rollback vs cleanup of newly created resources; stuck `pending-upgrade` recovery).
2. Confirm helm-diff Helm 4 compatibility.
3. Confirm whether current Argo CD runs `helm dependency build` for Git-sourced charts with an uncommitted `charts/` (affects view 7's thin-repo note).

## Source index

| Source | Supports views |
| --- | --- |
| [Helm overview](https://helm.sh/docs/overview/) · [Helm 4 released](https://helm.sh/blog/helm-4-released) | 1, 8, 9 |
| [Charts](https://helm.sh/docs/topics/charts/) | 2, 5, 7 |
| [Values files](https://helm.sh/docs/chart_template_guide/values_files/) | 3 |
| [helm template](https://helm.sh/docs/helm/helm_template/) · [Template function list](https://helm.sh/docs/chart_template_guide/function_list/) | 4 |
| [Subcharts and global values](https://helm.sh/docs/chart_template_guide/subcharts_and_globals/) · [Charts: dependencies](https://helm.sh/docs/topics/charts/) | 5, 6 |
| [helm dependency build](https://helm.sh/docs/helm/helm_dependency_build/) · [helm dependency update](https://helm.sh/docs/helm/helm_dependency_update/) | 7 |
| [Library charts](https://helm.sh/docs/topics/library_charts/) · [Named templates](https://helm.sh/docs/chart_template_guide/named_templates/) | 8 |
| [helm package](https://helm.sh/docs/helm/helm_package/) · [helm push](https://helm.sh/docs/helm/helm_push/) · [helm pull](https://helm.sh/docs/helm/helm_pull/) · [Registries](https://helm.sh/docs/topics/registries/) · [Provenance](https://helm.sh/docs/topics/provenance/) | 9 |
| [Advanced: storage backends](https://helm.sh/docs/topics/advanced/) · [Server-side apply](https://kubernetes.io/docs/reference/using-api/server-side-apply/) | 10 |
| [helm upgrade](https://helm.sh/docs/helm/helm_upgrade/) · [Chart hooks](https://helm.sh/docs/topics/charts_hooks/) | 11, 12 |
| [helm rollback](https://helm.sh/docs/helm/helm_rollback/) · [helm history](https://helm.sh/docs/helm/helm_history/) | 12, 13 |
| [helm test](https://helm.sh/docs/helm/helm_test/) · [helm uninstall](https://helm.sh/docs/helm/helm_uninstall/) · [helm lint](https://helm.sh/docs/helm/helm_lint/) · [helm-diff](https://github.com/databus23/helm-diff) | 13, 15 |
| [Argo CD: Helm](https://argo-cd.readthedocs.io/en/stable/user-guide/helm/) · [Flux: HelmRelease](https://fluxcd.io/flux/components/helm/helmreleases/) | 14 |

All URLs returned HTTP 200 on 2026-10-17.
