/**
 * Helm: One Chart, Three Jobs
 * Visual lesson explaining Helm as a template compiler, artifact manager, and cluster release manager.
 * Follows the scenario: payment-api umbrella chart (with postgresql, cache, and common-templates).
 */
import { edge, node, type Diagram, type Lesson, type View } from '../lesson/lesson-types';

const sources = [
  { label: 'Helm Overview & Architecture', url: 'https://helm.sh/docs/overview/' },
  { label: 'Helm 4 Release Announcement', url: 'https://helm.sh/blog/helm-4-released/' },
  { label: 'Charts & Dependencies Guide', url: 'https://helm.sh/docs/topics/charts/' },
  { label: 'Values Files & Scoping', url: 'https://helm.sh/docs/chart_template_guide/values_files/' },
  { label: 'Subcharts and Globals', url: 'https://helm.sh/docs/chart_template_guide/subcharts_and_globals/' },
  { label: 'Library Charts Specification', url: 'https://helm.sh/docs/topics/library_charts/' },
  { label: 'helm template reference', url: 'https://helm.sh/docs/helm/helm_template/' },
  { label: 'helm dependency build reference', url: 'https://helm.sh/docs/helm/helm_dependency_build/' },
  { label: 'helm package, push, pull reference', url: 'https://helm.sh/docs/helm/helm_package/' },
  { label: 'Kubernetes Server-Side Apply', url: 'https://kubernetes.io/docs/reference/using-api/server-side-apply/' },
  { label: 'helm upgrade & hooks reference', url: 'https://helm.sh/docs/helm/helm_upgrade/' },
  { label: 'helm rollback & history reference', url: 'https://helm.sh/docs/helm/helm_rollback/' },
  { label: 'Argo CD Helm Integration', url: 'https://argo-cd.readthedocs.io/en/stable/user-guide/helm/' },
  { label: 'Flux Helm Controller & HelmRelease', url: 'https://fluxcd.io/flux/components/helm/helmreleases/' },
];

const [S_OVERVIEW, S_HELM4, S_CHARTS, S_VALUES, S_SUBCHARTS, S_LIBS, S_TEMPLATE, S_DEP, S_PKG, S_SSA, S_UPGRADE, S_ROLLBACK, S_ARGO, S_FLUX] = sources.map((_, i) => i);

/* --- Diagrams --- */

// Visual 1: Three execution zones
export const DIAGRAM_ZONES: Diagram = {
  title: 'Three Execution Zones: Workstation, Registry, Cluster',
  width: 780,
  height: 250,
  nodes: [
    node('dev', 'code', 20, 60, 'Workstation / CI', 'helm CLI runs locally', 170, 70),
    node('reg', 'store', 290, 60, 'OCI / HTTP Registry', 'chart archives (.tgz)', 180, 70),
    node('k8s', 'kube', 570, 60, 'Kubernetes API', 'etcd & cluster state', 180, 70),
  ],
  edges: [
    edge('e_pkg', 'dev', 'reg', 'push / pull (artifacts)', { shift: -10 }),
    edge('e_api', 'dev', 'k8s', 'upgrade / rollback (mutates API)', { shift: 10 }),
    edge('e_none', 'reg', 'k8s', 'no direct connection', { kind: 'imagined' }),
  ]
};

// Visual 2: Chart anatomy
const DIAGRAM_ANATOMY: Diagram = {
  title: 'Inside a Helm Chart Directory',
  width: 780,
  height: 280,
  nodes: [
    node('c_yaml', 'part', 30, 20, 'Chart.yaml', 'name, version, appVersion', 170, 55),
    node('v_yaml', 'part', 30, 95, 'values.yaml', 'default input values', 170, 55),
    node('helpers', 'part', 30, 170, '_helpers.tpl', 'named template snippets', 170, 55),
    node('tpl', 'code', 280, 95, 'templates/*.yaml', 'Kubernetes YAML templates', 190, 65),
    node('crds', 'gate', 550, 20, 'crds/*.yaml', 'installed before templates', 170, 55),
    node('k8s_res', 'kube', 550, 140, 'Raw Manifests', 'Deployments, Services, etc.', 180, 70),
  ],
  edges: [
    edge('a1', 'c_yaml', 'tpl', 'metadata (.Chart)'),
    edge('a2', 'v_yaml', 'tpl', 'injected values (.Values)'),
    edge('a3', 'helpers', 'tpl', 'include "helper"'),
    edge('a4', 'tpl', 'k8s_res', 'renders into'),
  ]
};

// Visual 4: Offline render vs Cluster dry-run
const DIAGRAM_OFFLINE: Diagram = {
  title: 'Offline Compiler vs Server Validation',
  width: 780,
  height: 240,
  nodes: [
    node('cli_render', 'code', 30, 60, 'helm template', 'offline runner / CI', 160, 65),
    node('local_engine', 'tool', 270, 60, 'Template Engine', 'compiles Go templates', 170, 65),
    node('fake_env', 'store', 270, 160, 'Faked Capabilities', 'default k8s version / no CRDs', 170, 55),
    node('live_api', 'kube', 560, 60, 'API Server (--dry-run=server)', 'evaluates live CRDs & OpenAPI', 190, 75),
  ],
  edges: [
    edge('r1', 'cli_render', 'local_engine', 'passes values + chart'),
    edge('r2', 'fake_env', 'local_engine', 'guesses cluster capabilities'),
    edge('r3', 'cli_render', 'live_api', '--dry-run=server queries live schema', { shift: -8 }),
  ]
};

// Visual 5: Umbrella Chart
const DIAGRAM_UMBRELLA: Diagram = {
  title: 'Umbrella Chart Structure',
  width: 780,
  height: 260,
  nodes: [
    node('parent', 'code', 20, 80, 'payment-api', 'Parent / Umbrella chart', 170, 80),
    node('sub_pg', 'kube', 280, 20, 'subchart: postgresql', 'db for payments', 180, 55),
    node('sub_redis', 'kube', 280, 95, 'subchart: cache (alias)', 'aliased from redis', 180, 55),
    node('sub_lib', 'tool', 280, 175, 'library: common-templates', 'type: library (no pods)', 190, 55),
    node('single_rel', 'store', 560, 80, '1 Helm Release', 'all pods tracked together', 180, 80),
  ],
  edges: [
    edge('u1', 'parent', 'sub_pg', 'condition: postgresql.enabled'),
    edge('u2', 'parent', 'sub_redis', 'condition: cache.enabled'),
    edge('u3', 'parent', 'sub_lib', 'includes shared helpers'),
    edge('u4', 'sub_pg', 'single_rel', 'deploys into'),
    edge('u5', 'sub_redis', 'single_rel', 'deploys into'),
  ]
};

// Visual 6: Scoping
export const DIAGRAM_SCOPING: Diagram = {
  title: 'Value Scoping & Global Visibility',
  width: 780,
  height: 260,
  nodes: [
    node('p_val', 'part', 20, 70, 'Parent values.yaml', 'replicaCount, postgresql:, cache:, global:', 200, 100),
    node('pg_node', 'kube', 340, 20, 'PostgreSQL Subchart', 'sees postgresql.* & global.*', 190, 55),
    node('redis_node', 'kube', 340, 95, 'Cache Subchart', 'sees cache.* & global.*', 190, 55),
    node('app_node', 'code', 340, 175, 'App Templates', 'sees root values & global.*', 190, 55),
  ],
  edges: [
    edge('sc1', 'p_val', 'pg_node', 'scoped section'),
    edge('sc2', 'p_val', 'redis_node', 'scoped section'),
    edge('sc3', 'p_val', 'app_node', 'direct access'),
  ]
};

// Visual 7: Dependency build & Lock
export const DIAGRAM_LOCK: Diagram = {
  title: 'Dependency Resolution & Lock Pinning',
  width: 780,
  height: 240,
  nodes: [
    node('chart_yaml', 'part', 20, 40, 'Chart.yaml', 'dependencies: postgresql ~16.2.0', 190, 60),
    node('dep_up', 'tool', 280, 40, 'helm dep update', 'resolves ranges against repo', 170, 60),
    node('chart_lock', 'store', 530, 40, 'Chart.lock (Commit to Git)', 'pinned exact version + digest', 210, 60),
    node('ci_build', 'code', 280, 150, 'helm dep build (CI)', 'strictly builds from lock', 170, 60),
    node('vendor_dir', 'part', 530, 150, 'charts/*.tgz archives', 'extracted in-memory on deploy', 210, 60),
  ],
  edges: [
    edge('lk1', 'chart_yaml', 'dep_up', 'queries latest'),
    edge('lk2', 'dep_up', 'chart_lock', 'writes locked pins'),
    edge('lk3', 'chart_lock', 'ci_build', 'reproduces in CI'),
    edge('lk4', 'ci_build', 'vendor_dir', 'fetches exact files'),
  ]
};

// Visual 8: Library charts
const DIAGRAM_LIBRARY: Diagram = {
  title: 'Library Charts: Shared Templates, No Pods',
  width: 780,
  height: 230,
  nodes: [
    node('lib_chart', 'tool', 30, 50, 'common-templates', 'type: library (cannot be installed)', 200, 70),
    node('app_chart', 'code', 310, 50, 'payment-api (app)', 'templates/deployment.yaml', 190, 70),
    node('rendered_k8s', 'kube', 570, 50, 'Running Deployment', 'standardized enterprise spec', 180, 70),
  ],
  edges: [
    edge('lib1', 'lib_chart', 'app_chart', '{{ include "common.deploy" . }}'),
    edge('lib2', 'app_chart', 'rendered_k8s', 'renders live object'),
  ]
};

// Visual 9: Package, Push, Pull
const DIAGRAM_ARTIFACTS: Diagram = {
  title: 'Package, Push, Pull & Provenance Verification',
  width: 780,
  height: 240,
  nodes: [
    node('source_dir', 'part', 20, 60, './charts/payment-api', 'raw source directory', 170, 65),
    node('tarball', 'store', 270, 60, 'payment-api-1.2.0.tgz', 'packaged immutable tarball', 190, 65),
    node('oci_reg', 'kube', 550, 60, 'OCI Registry (GHCR/ECR)', 'oci://registry.example.com', 200, 65),
  ],
  edges: [
    edge('art1', 'source_dir', 'tarball', 'helm package (--sign)'),
    edge('art2', 'tarball', 'oci_reg', 'helm push'),
    edge('art3', 'oci_reg', 'tarball', 'helm pull --verify', { shift: 14 }),
  ]
};

// Visual 10: Release Ledger
const DIAGRAM_LEDGER: Diagram = {
  title: 'In-Cluster State: The Release Secret Ledger',
  width: 780,
  height: 250,
  nodes: [
    node('rev1', 'store', 30, 60, 'Secret: ...v1', 'status: superseded', 140, 60),
    node('rev2', 'store', 200, 60, 'Secret: ...v2', 'status: superseded', 140, 60),
    node('rev3', 'store', 370, 60, 'Secret: ...v3', 'status: deployed (latest)', 160, 65),
    node('secret_body', 'part', 580, 30, 'data.release (gzip JSON)', 'manifest, values, chart, hooks', 180, 110),
  ],
  edges: [
    edge('l1', 'rev1', 'rev2', 'upgrade'),
    edge('l2', 'rev2', 'rev3', 'upgrade'),
    edge('l3', 'rev3', 'secret_body', 'unpacks state'),
  ]
};

// Visual 11: Upgrade Lifecycle
const DIAGRAM_LIFECYCLE: Diagram = {
  title: 'The helm upgrade --install Execution Path',
  width: 780,
  height: 250,
  nodes: [
    node('step_prep', 'code', 20, 50, '1. Render & Validate', 'compile YAML & OpenAPI check', 160, 60),
    node('step_sec', 'store', 210, 50, '2. Write Secret', 'status: pending-upgrade', 160, 60),
    node('step_hook', 'tool', 400, 50, '3. Pre-upgrade Hook', 'run DB migration Job', 160, 60),
    node('step_apply', 'kube', 590, 50, '4. Apply & Wait', 'kstatus wait up to --timeout', 170, 60),
  ],
  edges: [
    edge('lc1', 'step_prep', 'step_sec', 'next'),
    edge('lc2', 'step_sec', 'step_hook', 'next'),
    edge('lc3', 'step_hook', 'step_apply', 'next'),
  ]
};

// Visual 13: Inspect
const DIAGRAM_INSPECT: Diagram = {
  title: 'Inspect Commands: What Reads What',
  width: 780,
  height: 250,
  nodes: [
    node('cmd_hist', 'code', 30, 20, 'helm history', 'reads revision history', 160, 50),
    node('cmd_stat', 'code', 30, 95, 'helm status', 'reads secret + queries live pods', 160, 50),
    node('cmd_get', 'code', 30, 170, 'helm get values/manifest', 'reads stored release state', 160, 50),
    node('sec_db', 'store', 310, 95, 'Release Secrets', 'sh.helm.release.v1.*', 170, 65),
    node('live_pods', 'kube', 560, 95, 'Live Cluster Objects', 'Deployments, Pods, Services', 180, 65),
  ],
  edges: [
    edge('i1', 'cmd_hist', 'sec_db', 'queries'),
    edge('i2', 'cmd_stat', 'sec_db', 'reads status'),
    edge('i3', 'cmd_stat', 'live_pods', 'verifies ready'),
    edge('i4', 'cmd_get', 'sec_db', 'decodes JSON'),
  ]
};

// Visual 14: GitOps comparison
export const DIAGRAM_GITOPS: Diagram = {
  title: 'CI Push vs GitOps (Argo CD vs Flux)',
  width: 780,
  height: 260,
  nodes: [
    node('git_repo', 'part', 20, 95, 'Git Repository', 'values.yaml as source of truth', 160, 65),
    node('ci_push', 'code', 270, 20, 'Legacy CI Push', 'runner runs helm upgrade -i', 180, 55),
    node('argo_cd', 'tool', 270, 95, 'Argo CD (Pull)', 'runs helm template -> Server Apply', 190, 55),
    node('flux_cd', 'tool', 270, 175, 'Flux (Pull)', 'helm-controller runs Helm SDK', 190, 55),
    node('k8s_cluster', 'kube', 560, 95, 'Target Cluster', 'live workloads & drift state', 180, 75),
  ],
  edges: [
    edge('g1', 'git_repo', 'ci_push', 'trigger webhook'),
    edge('g2', 'git_repo', 'argo_cd', 'continuous poll'),
    edge('g3', 'git_repo', 'flux_cd', 'continuous poll'),
    edge('g4', 'ci_push', 'k8s_cluster', 'direct mutation (needs admin creds)'),
    edge('g5', 'argo_cd', 'k8s_cluster', 'server-side apply (no Helm secret)'),
    edge('g6', 'flux_cd', 'k8s_cluster', 'reconciles Helm release secrets'),
  ]
};

// Visual 15: Safe change loop
const DIAGRAM_LOOP: Diagram = {
  title: 'The Production Helm Change Loop',
  width: 780,
  height: 240,
  nodes: [
    node('s1_lint', 'code', 20, 80, '1. Lint & Schema', 'helm lint', 130, 55),
    node('s2_tpl', 'tool', 170, 80, '2. Render & Scan', 'helm template | trivy', 140, 55),
    node('s3_diff', 'tool', 330, 80, '3. Preview Diff', 'helm diff upgrade', 130, 55),
    node('s4_up', 'kube', 480, 80, '4. Deploy & Wait', '--rollback-on-failure', 150, 55),
    node('s5_test', 'gate', 640, 80, '5. Hook Tests', 'helm test', 120, 55),
  ],
  edges: [
    edge('l1', 's1_lint', 's2_tpl', 'valid syntax'),
    edge('l2', 's2_tpl', 's3_diff', 'valid YAML'),
    edge('l3', 's3_diff', 's4_up', 'approved diff'),
    edge('l4', 's4_up', 's5_test', 'workloads ready'),
  ]
};

/* --- Views --- */

const groups = [
  'Three jobs',
  'Render',
  'Compose',
  'Package',
  'Release',
  'Delivery'
];

const views: View[] = [
  // 0: Enter Helm: Three Roles & Persistent Scenario
  {
    id: 'enter', group: groups[0], label: 'Enter Helm: Three Roles', mode: 'custom',
    title: 'Enter Helm: Three Roles & The Scenarios It Covers',
    lede: 'In modern DevOps workflows, Helm wears three distinct hats: a template engine, an artifact manager, and a cluster release manager.',
    frames: [],
    inspector: {
      heading: 'The Architecture of Helm in Modern DevOps',
      body: 'Helm is often thought of merely as "apt-get for Kubernetes". In reality, modern cloud engineering workflows treat Helm as three distinct subsystems that run at different phases of the software delivery lifecycle.',
      facts: [
        ['1. Template Compiler', 'Renders parameterized values into raw Kubernetes manifests offline'],
        ['2. Package Manager', 'Manages, versions, and pulls .tgz archives from OCI container registries'],
        ['3. Release Manager', 'Talks to kube-apiserver, tracks release Secret revisions, and executes rollbacks']
      ],
      evidence: ['PERSISTENT SCENARIO', 'payment-api umbrella chart (API + Redis cache + PostgreSQL + common library)'],
      note: 'Throughout this console, you follow payment-api across all three hats: compiling values locally, resolving umbrella dependencies, pushing to OCI registries, and diagnosing failed releases in the cluster.'
    },
    takeaway: 'Helm is three tools in one: a local YAML compiler, an OCI package manager, and an in-cluster release manager.',
    sources: [S_OVERVIEW, S_HELM4]
  },

  // 1: Three jobs (Persistent 3-Zone Workbench Anchor)
  {
    id: 'where', group: groups[0], label: 'Where commands run', mode: 'custom', hero: true,
    title: 'Which Helm commands touch your cluster?',
    lede: 'Every Helm command executes locally on your workstation or CI runner. Only release commands communicate with the Kubernetes API.',
    frames: [],
    table: {
      title: 'Helm Command Execution Matrix',
      head: ['Command', 'Runs On', 'Network Activity', 'Cluster API Interaction', 'Creates Revision'],
      rows: [
        ['helm template', 'Workstation / CI', 'None (unless remote chart)', 'None (read with --dry-run=server)', 'No'],
        ['helm lint', 'Workstation / CI', 'None', 'None', 'No'],
        ['helm package / push / pull', 'Workstation / CI', 'Talks to OCI / HTTP registry', 'None', 'No'],
        ['helm upgrade --install', 'Workstation / CI', 'Pulls chart if remote', 'Full Read + Write mutation', 'Yes (rev N+1)'],
        ['helm rollback', 'Workstation / CI', 'None', 'Full Read + Write mutation', 'Yes (rev N+1)'],
      ]
    },
    inspector: {
      heading: 'The Three Execution Boundaries',
      body: 'Unlike Helm 2, Helm 3 and 4 have no server-side "Tiller" component in the cluster. Helm is purely a client CLI that performs three distinct functions: compiling YAML, packaging archives, and managing cluster releases.',
      facts: [['Client-Side Apply', 'Helm client renders YAML and communicates with kube-apiserver directly'], ['State Storage', 'Release state is saved in Kubernetes Secrets inside the application namespace'], ['Security Context', 'The runner executing Helm must possess appropriate RBAC credentials']],
      evidence: ['CHECK RBAC IMPACT', 'kubectl auth can-i create secrets -n payments'],
      note: 'If CI runs helm upgrade directly, your CI runner requires broad cluster-admin credentials. GitOps pull models eliminate this exposure.'
    },
    takeaway: 'Only release commands write to the cluster. Rendering and packaging stop at your machine or the registry.',
    sources: [S_OVERVIEW, S_HELM4]
  },

  // 2: Chart anatomy
  {
    id: 'chart', group: groups[1], label: 'Chart anatomy', mode: 'steps',
    title: 'What is actually inside a chart directory?',
    lede: 'A chart is not raw Kubernetes YAML. It is a bundle of Go templates, metadata, default values, and helper templates.',
    diagram: DIAGRAM_ANATOMY,
    frames: [
      { action: 'Chart.yaml', caption: 'Chart.yaml defines chart metadata. "version" is the version of the Helm package (SemVer); "appVersion" is the version of the application running inside.', pic: { hot: ['c_yaml'], badge: { c_yaml: 'metadata' } } },
      { action: 'values.yaml', caption: 'values.yaml provides built-in default inputs for the templates. Any consumer can override these via values files or CLI flags.', pic: { hot: ['v_yaml'], badge: { v_yaml: 'defaults' } } },
      { action: '_helpers.tpl', caption: 'Files prefixed with an underscore produce no YAML directly. They define reusable template partials and standard labels.', pic: { hot: ['helpers'], badge: { helpers: 'named templates' } } },
      { action: 'templates/', caption: 'The template files contain Kubernetes manifests injected with Go template directives ({{ .Values.* }}).', pic: { hot: ['tpl', 'k8s_res'], badge: { tpl: 'compiler' } } },
    ],
    table: {
      title: 'Chart Files & Responsibilities',
      head: ['File / Directory', 'Role', 'Produces Kubernetes Objects?'],
      rows: [
        ['Chart.yaml', 'Defines chart name, SemVer version, dependencies', 'No'],
        ['values.yaml', 'Default variable assignments', 'No'],
        ['templates/_helpers.tpl', 'Reusable snippets (e.g. standard labels)', 'No'],
        ['templates/*.yaml', 'Parameterized Kubernetes manifests', 'Yes, once compiled'],
        ['crds/*.yaml', 'CustomResourceDefinitions installed before templates', 'Yes (never updated or deleted by Helm)'],
      ]
    },
    inspector: {
      heading: 'version vs appVersion',
      body: 'A common pitfall is conflating chart version and appVersion. Bumping your Docker image tag requires bumping appVersion, but publishing an updated chart package requires incrementing version.',
      facts: [['version', 'Must follow strict SemVer (e.g. 1.2.0)'], ['appVersion', 'Informational string (e.g. "4.7.1" or Git SHA)'], ['CRDs', 'Helm installs CRDs on first install but deliberately skips them during upgrades']],
      evidence: ['INSPECT CHART METADATA', 'helm show chart ./charts/payment-api'],
      note: 'Helm never modifies or deletes CRDs in crds/ during upgrades to prevent accidental data loss across dependent operators.'
    },
    takeaway: 'A chart is templates, defaults, and metadata. Nothing in it is Kubernetes-ready until values fill the templates.',
    sources: [S_CHARTS]
  },

  // 3: Values merge (Hero 1 - Custom slot)
  {
    id: 'values', group: groups[1], label: 'Which value wins', mode: 'custom', hero: true,
    title: 'Value precedence: which input takes effect?',
    lede: 'Helm merges values layer by layer. Later layers override earlier layers key by key. Maps merge; lists are replaced entirely.',
    frames: [],
    inspector: {
      heading: 'The Precedence Hierarchy',
      body: 'When multiple values files and --set flags are supplied, Helm compiles a single merged configuration dictionary before evaluating any templates.',
      facts: [['Layer Order', 'Chart defaults < -f values.yaml < -f values-prod.yaml < --set'], ['Map Merging', 'Nested maps merge keys recursively across layers'], ['List Replacement', 'A list in a higher-precedence layer completely overwrites the previous list']],
      evidence: ['PREVIEW MERGED VALUES', 'helm template ./charts/payment-api -f values-prod.yaml --set image.tag=4.7.2'],
      note: 'Remember: lists do not concatenate. If your chart defines 3 ingress hosts and values-prod.yaml defines 1, only the 1 host will exist.'
    },
    takeaway: 'Later layers win key by key. Maps merge; lists are replaced whole.',
    sources: [S_VALUES]
  },

  // 4: Render offline
  {
    id: 'template', group: groups[1], label: 'Render offline', mode: 'choices',
    title: 'Is helm template output identical to cluster deployment?',
    lede: 'helm template compiles manifests locally using faked cluster capabilities. When templates query live cluster state, offline renders diverge.',
    diagram: DIAGRAM_OFFLINE,
    frames: [
      { action: 'Pure Offline', caption: 'By default, helm template makes zero network calls. It simulates a standard Kubernetes version and assumes unsupported CRD APIs are absent.', pic: { hot: ['cli_render', 'local_engine', 'fake_env'], badge: { fake_env: 'default fake' } } },
      { action: 'With API Versions', caption: 'Pass --api-versions to supply missing CRDs (e.g. monitoring.coreos.com/v1) so conditional templates (like ServiceMonitors) render properly in CI.', pic: { hot: ['cli_render', 'local_engine'], badge: { cli_render: '--api-versions' } } },
      { action: 'Server Dry-Run', caption: 'In Helm 4, --dry-run=server replaces deprecated --validate. It queries the live API for OpenAPI schemas and live CRDs without mutating cluster state.', pic: { hot: ['cli_render', 'live_api'], badge: { live_api: 'cluster read' } } },
    ],
    table: {
      title: 'Offline Rendering vs Live Apply Differences',
      head: ['Feature', 'helm template (offline)', 'helm template --dry-run=server'],
      rows: [
        ['Network Access', 'Zero network calls', 'Requires read-only cluster connectivity'],
        ['OpenAPI Validation', 'Validated against built-in schema only', 'Validated against live cluster API schema'],
        ['lookup Function', 'Returns empty map {}', 'Returns live in-cluster resource values'],
        ['Capabilities.APIVersions', 'Standard built-in Kubernetes APIs only', 'Includes all CRDs installed in cluster'],
      ]
    },
    inspector: {
      heading: 'The lookup Function Trap',
      body: 'Helm provides a {{ lookup }} function to query existing cluster objects (such as reading an auto-generated password secret). Offline rendering cannot reach the cluster, so lookup returns empty.',
      facts: [['lookup in GitOps', 'In Argo CD, lookup returns empty unless server-side generation is enabled'], ['Deprecated Flag', '--validate was deprecated in Helm 4 in favor of --dry-run=server'], ['Resource Selection', 'Use -s templates/deployment.yaml to output only specific manifests']],
      evidence: ['TEST SERVER DRY-RUN', 'helm template payment-api ./charts/payment-api --dry-run=server'],
      note: 'If a chart uses lookup to preserve existing passwords, running helm template offline will regenerate a new random password every time.'
    },
    takeaway: 'Offline rendering fills cluster facts with defaults. Supply flags or render against the server when templates query the API.',
    sources: [S_TEMPLATE, S_HELM4]
  },

  // 5: Umbrella chart
  {
    id: 'subcharts', group: groups[2], label: 'Umbrella chart', mode: 'steps',
    title: 'One chart that carries and deploys others',
    lede: 'An umbrella chart declares other charts under dependencies. When installed, Helm unpacks all subcharts in-memory and deploys them in a single release.',
    diagram: DIAGRAM_UMBRELLA,
    frames: [
      { action: 'Declare Dependencies', caption: 'In Chart.yaml, dependencies list the name, SemVer version range, repository URL, and condition for each child chart.', pic: { hot: ['parent'], badge: { parent: 'Chart.yaml' } } },
      { action: 'HTTP, OCI & Local', caption: 'Helm supports dependencies from HTTP repos (https://...), OCI registries (oci://...), and local disk paths (file://...).', pic: { hot: ['sub_pg', 'sub_redis', 'sub_lib'], badge: { sub_pg: 'http', sub_redis: 'oci', sub_lib: 'file' } } },
      { action: 'Condition & Aliasing', caption: 'condition toggles a subchart on/off. alias allows running multiple instances of the same chart (e.g. redis-cache and redis-queue).', pic: { hot: ['sub_redis'], badge: { sub_redis: 'alias: cache' } } },
      { action: 'One Unified Release', caption: 'Subcharts do not create separate Helm releases. Parent and all subcharts share one release secret and roll back together.', pic: { hot: ['single_rel'], badge: { single_rel: 'release: payment-api' } } },
    ],
    table: {
      title: 'Umbrella Chart Dependencies (Chart.yaml)',
      head: ['Dependency', 'Repository Kind', 'Alias', 'Condition Toggle'],
      rows: [
        ['postgresql (~16.2.0)', 'HTTP Repository (https://...)', 'None (uses postgresql)', 'condition: postgresql.enabled'],
        ['redis (20.1.4)', 'OCI Registry (oci://...)', 'cache', 'condition: cache.enabled'],
        ['common-templates (1.0.0)', 'Local File Path (file://...)', 'None', 'None (type: library)'],
      ]
    },
    inspector: {
      heading: 'The Alias & Condition Gotcha',
      body: 'When you assign an alias to a dependency (e.g. alias: cache), the condition path in values must match the alias (condition: cache.enabled). If the condition path does not exist, Helm silently ignores it and deploys the subchart.',
      facts: [['Atomic Lifecycle', 'Uninstalling or rolling back the umbrella chart affects all subcharts simultaneously'], ['Single Release', 'helm list shows only 1 release for parent and all dependencies'], ['Tag Filtering', 'tags: [datastores] can enable/disable groups of subcharts at once']],
      evidence: ['INSPECT UNPACKED SUBCHARTS', 'helm dependency list ./charts/payment-api'],
      note: 'If a database subchart crashes during an upgrade, Helm rolls back the entire umbrella release, including the application pods.'
    },
    takeaway: 'Subcharts render into the parent\'s single release. A condition is a path in the parent\'s values and is ignored if missing.',
    sources: [S_CHARTS, S_SUBCHARTS]
  },

  // 6: Scoping (Lab 1: Values & Subchart Scope Funnel)
  {
    id: 'scoping', group: groups[2], label: 'Scoped values', mode: 'custom', hero: true,
    title: 'Value scoping: what each subchart can see',
    lede: 'Parent values files isolate subchart configurations into dedicated sections. Subcharts cannot inspect parent values unless shared via global.',
    frames: [],
    table: {
      title: 'Value Visibility Across Subcharts',
      head: ['Key in Parent values.yaml', 'Parent App Sees', 'PostgreSQL Subchart Sees', 'Cache Subchart Sees'],
      rows: [
        ['replicaCount: 3', '.Values.replicaCount (3)', 'Hidden (uses own default)', 'Hidden (uses own default)'],
        ['postgresql.auth.database: db', '.Values.postgresql.auth.database', '.Values.auth.database', 'Hidden'],
        ['cache.architecture: standalone', '.Values.cache.architecture', 'Hidden', '.Values.architecture'],
        ['global.environment: production', '.Values.global.environment', '.Values.global.environment', '.Values.global.environment'],
      ]
    },
    inspector: {
      heading: 'Subchart Encapsulation Boundary',
      body: 'Value scoping ensures modularity. A third-party Redis chart cannot accidentally collide with your application\'s own port or replicaCount settings.',
      facts: [['Encapsulation', 'Subcharts only receive the dictionary section named after their alias'], ['Global Propagation', 'global.* is deeply merged into every subchart\'s .Values scope'], ['Parent Values', 'A parent chart can read subchart values via {{ index .Values "cache" "key" }}']],
      evidence: ['VALIDATE SCOPED RENDERING', 'helm template payment-api ./charts/payment-api -f values-prod.yaml'],
      note: 'Subcharts cannot access parent values. If a subchart needs an application hostname, pass it under the subchart\'s explicit section or through global.'
    },
    takeaway: 'A subchart sees its own section and global, nothing else. The section name matches the alias when defined.',
    sources: [S_SUBCHARTS]
  },

  // 7: Lock & Fetch (Lab 2: Dependency Time Machine & Supply Chain Lab)
  {
    id: 'dependencies', group: groups[2], label: 'Lock and fetch', mode: 'custom', hero: true,
    title: 'Why CI builds different charts on different days',
    lede: 'helm dependency update resolves SemVer ranges and writes Chart.lock. helm dependency build strictly enforces the lock for deterministic CI.',
    frames: [],
    table: {
      title: 'Dependency Commands Compared',
      head: ['Command', 'Target Audience', 'Action on Ranges', 'Modifies Chart.lock?'],
      rows: [
        ['helm dependency update', 'Developers adding/updating dependencies', 'Re-queries registries and picks highest version', 'Yes, regenerates Chart.lock'],
        ['helm dependency build', 'CI/CD Pipelines & Automated Runners', 'Strictly respects Chart.lock pins', 'No, fails if Chart.lock is out of sync'],
      ]
    },
    inspector: {
      heading: 'Git Policy: Commit Chart.lock vs charts/*.tgz',
      body: 'Standard enterprise practice (thin repository) is to commit Chart.lock to Git and add charts/*.tgz to .gitignore. In CI, run helm dependency build before rendering or deploying.',
      facts: [['Thin Repo Pattern', 'Commit Chart.lock; run helm dependency build in CI runners'], ['Air-Gapped Pattern', 'Commit downloaded .tgz files to Git so builds succeed 100% offline'], ['Lock Digest', 'Chart.lock records a sha256 digest of Chart.yaml dependencies to detect drift']],
      evidence: ['OUT OF SYNC ERROR', 'Error: the lock file (Chart.lock) is out of sync with dependencies file'],
      note: 'Notice: Chart.lock pins versions and hashes the dependencies list, but does not calculate individual tarball hashes. Use immutable OCI registries for strict supply-chain security.'
    },
    takeaway: 'update resolves ranges and rewrites the lock. build reproduces the lock, as long as versions are not republished.',
    sources: [S_DEP]
  },

  // 8: Library charts
  {
    id: 'library', group: groups[2], label: 'Library charts', mode: 'choices',
    title: 'Shared templates without shared workloads',
    lede: 'A chart with type: library deploys no Kubernetes resources. It provides reusable Go templates and helper definitions for application charts to inherit.',
    diagram: DIAGRAM_LIBRARY,
    frames: [
      { action: 'Standard Inheritance', caption: 'Application charts declare the library as a dependency and call standard templates via {{ include "common-templates.deployment" . }}.', pic: { hot: ['lib_chart', 'app_chart', 'rendered_k8s'], badge: { app_chart: 'inherits' } } },
      { action: 'Direct Install Error', caption: 'Attempting to run helm install on a library chart immediately fails with: "Error: INSTALLATION FAILED: library charts are not installable".', pic: { hot: ['lib_chart'], badge: { lib_chart: 'not installable' } } },
    ],
    table: {
      title: 'Application Charts vs Library Charts',
      head: ['Characteristic', 'Application Chart (default)', 'Library Chart (type: library)'],
      rows: [
        ['type in Chart.yaml', 'application (or omitted)', 'library'],
        ['Produces Workloads?', 'Yes (Deployments, Services, etc.)', 'No, completely disabled'],
        ['Standalone helm install', 'Succeeds and creates a release', 'Fails with validation error'],
        ['Primary Use Case', 'Deploying specific microservices', 'Enterprise boilerplate sharing across 50+ services'],
      ]
    },
    inspector: {
      heading: 'Enterprise Standardization Pattern',
      body: 'Instead of duplicating 200 lines of complex Deployment YAML across dozens of repos, platform teams publish an internal library chart with approved security contexts, probes, and telemetry.',
      facts: [['type: library', 'Explicitly tells Helm this package contains no deployable objects'], ['Global Template Scope', 'Templates defined with {{- define -}} share a global namespace across all dependencies'], ['Prefix Naming', 'Always prefix library templates with the library name to prevent namespace collisions']],
      evidence: ['TEST LIBRARY INSTALLATION', 'helm install lib ./common-templates --dry-run=client'],
      note: 'Treat library charts as internal API contracts. Major changes to template arguments should follow SemVer to prevent breaking downstream applications.'
    },
    takeaway: 'A library supplies named templates and renders nothing by itself. The calling chart\'s values fill them.',
    sources: [S_LIBS]
  },

  // 9: Package, Push, Pull
  {
    id: 'artifact', group: groups[3], label: 'Package and pull', mode: 'steps',
    title: 'Packaging, OCI distribution, and provenance verification',
    lede: 'Helm charts package into versioned tarballs (.tgz). Modern Helm natively pushes and pulls chart artifacts directly to OCI container registries.',
    diagram: DIAGRAM_ARTIFACTS,
    frames: [
      { action: 'helm package', caption: 'Compresses the chart directory into a versioned tarball: payment-api-1.2.0.tgz. Optional --sign generates a cryptographic .prov provenance file.', pic: { hot: ['source_dir', 'tarball'], badge: { tarball: 'packaged' } } },
      { action: 'helm push (OCI)', caption: 'Uploads the package directly to an OCI registry (e.g. GitHub Packages, ECR, Harbor). The chart version becomes the OCI image tag.', pic: { hot: ['tarball', 'oci_reg'], badge: { oci_reg: 'oci://...' } } },
      { action: 'helm pull --untar', caption: 'Downloads and extracts a packaged chart for local inspection without installing it.', pic: { hot: ['oci_reg', 'tarball', 'source_dir'], badge: { source_dir: 'extracted' } } },
      { action: 'helm pull --verify', caption: 'Validates digital signatures using GPG keyrings and provenance files before saving. If signature verification fails, nothing is saved.', pic: { hot: ['oci_reg', 'tarball'], badge: { tarball: 'verified ✓' } } },
    ],
    table: {
      title: 'Helm Package Commands',
      head: ['Command', 'Purpose', 'Key Flags'],
      rows: [
        ['helm package <path>', 'Compress directory into versioned .tgz', '--version, --sign, --keyring'],
        ['helm push <tarball> oci://...', 'Upload package directly to OCI registry', '--ca-file, --insecure-skip-tls-verify'],
        ['helm pull <chart>', 'Fetch chart package from remote registry', '--version, --untar, --untardir, --verify'],
      ]
    },
    inspector: {
      heading: 'The Modern OCI Standard',
      body: 'In Helm 2 and early Helm 3, charts required dedicated HTTP servers with an index.yaml index. Today, OCI registries treat charts as first-class container artifacts alongside Docker images.',
      facts: [['No index.yaml', 'OCI registries eliminate fragile index.yaml repository files'], ['Unified Storage', 'Container images and Helm charts share the same registry permissions and vulnerability scanning'], ['Air-Gapped Flow', 'Pull upstream charts into a jump host, verify signatures, and push to internal registries']],
      evidence: ['PULL OCI ARTIFACT', 'helm pull oci://ghcr.io/argoproj/argo-helm/argo-cd --version 6.7.0'],
      note: 'Unlike Docker images, chart versions in OCI registries must strictly adhere to SemVer 2 (no arbitrary string tags like "latest" or "master").'
    },
    takeaway: 'Package once, version immutably, and verify signatures before trusting external templates.',
    sources: [S_PKG]
  },

  // 10: Release records
  {
    id: 'release', group: groups[4], label: 'Release records', mode: 'steps',
    title: 'Where does Helm remember what it deployed?',
    lede: 'Helm maintains deployment history by writing release metadata into Kubernetes Secrets inside the application namespace.',
    diagram: DIAGRAM_LEDGER,
    frames: [
      { action: 'Secret Per Revision', caption: 'Every helm upgrade creates a new Secret named sh.helm.release.v1.<NAME>.v<REVISION>. Previous revisions are marked superseded.', pic: { hot: ['rev1', 'rev2', 'rev3'], badge: { rev3: 'v3 deployed' } } },
      { action: 'data.release Content', caption: 'The Secret data contains gzipped, base64-encoded JSON storing chart metadata, values files used, rendered manifests, and hooks.', pic: { hot: ['rev3', 'secret_body'], badge: { secret_body: 'gzipped JSON' } } },
      { action: 'History Pruning', caption: '--history-max (default 10) limits stored revisions. Oldest records are pruned automatically to conserve etcd space.', pic: { hot: ['rev1'], badge: { rev1: 'pruned at 11' } } },
    ],
    table: {
      title: 'State Tracking: kubectl apply vs Helm',
      head: ['Mechanism', 'Where State is Stored', 'Historical Revisions Tracked?'],
      rows: [
        ['kubectl apply (Client-Side)', 'Annotation metadata.annotations.kubectl.kubernetes.io/last-applied-configuration on each resource', 'No (only last applied state)'],
        ['kubectl apply (Server-Side SSA)', 'metadata.managedFields tracking field ownership directly on the resource', 'No'],
        ['Helm 3 & 4', 'Kubernetes Secrets in the target namespace (sh.helm.release.v1.<name>.v<N>)', 'Yes (ledger of revisions v1..vN)'],
      ]
    },
    inspector: {
      heading: 'Security Implications of Release Secrets',
      body: 'Because Helm stores the complete merged values files inside release Secrets, any sensitive variables (passwords, tokens) passed via -f or --set exist in plaintext within the Secret.',
      facts: [['Secret Naming', 'sh.helm.release.v1.payment-api.v1'], ['RBAC Isolation', 'Anyone with permissions to read Secrets in the namespace can read your entire values history'], ['HELM_DRIVER', 'Storage can be changed via HELM_DRIVER (secret, configmap, sql, memory)']],
      evidence: ['DECODE RELEASE SECRET', 'kubectl get secret -n payments -l owner=helm -o jsonpath="{.items[-1].metadata.name}"'],
      note: 'Never pass unencrypted raw production secrets in plain values files committed to Git. Use external secrets operators or sealed secrets.'
    },
    takeaway: 'Each install, upgrade, or rollback writes a new record. That record, not live cluster objects, is Helm\'s memory.',
    sources: [S_OVERVIEW, S_SSA]
  },

  // 11: Upgrade lifecycle (Hero 2)
  {
    id: 'upgrade', group: groups[4], label: 'Upgrade lifecycle', mode: 'steps', hero: true,
    title: 'What happens between pressing Enter and "deployed"?',
    lede: 'helm upgrade --install executes a multi-stage transaction: validating manifests, writing a pending secret, executing hooks, applying changes, and waiting for readiness.',
    diagram: DIAGRAM_LIFECYCLE,
    frames: [
      { action: '1. Resolve & Render', caption: 'Checks if release exists. If missing: runs install (rev 1). If present: prepares upgrade (rev N+1). Merges values and compiles templates.', pic: { hot: ['step_prep'], badge: { step_prep: 'compile' } } },
      { action: '2. Pending Secret', caption: 'Before modifying any live workloads, Helm writes a new Secret with status pending-upgrade (or pending-install).', pic: { hot: ['step_sec'], badge: { step_sec: 'pending-upgrade' } } },
      { action: '3. Pre-upgrade Hooks', caption: 'Executes resources annotated with helm.sh/hook: pre-upgrade (e.g. database migration Jobs) and waits for them to complete successfully.', pic: { hot: ['step_hook'], badge: { step_hook: 'migration job' } } },
      { action: '4. Apply & Server Reconcile', caption: 'Applies Kubernetes manifests. In Helm 4, new releases default to Server-Side Apply (SSA). Resources removed from templates are deleted.', pic: { hot: ['step_apply'], badge: { step_apply: 'apply' } } },
      { action: '5. Wait for Readiness', caption: 'With --wait, Helm blocks until all Pods, PVCs, and Services reach healthy condition. Defaults to kstatus watcher.', pic: { hot: ['step_apply'], badge: { step_apply: 'readiness wait' } } },
      { action: '6. Success & Supersede', caption: 'Marks new revision "deployed" and previous revision "superseded". Post-upgrade hooks execute.', pic: { hot: ['step_apply', 'step_sec'], badge: { step_sec: 'deployed ✓' } } },
    ],
    table: {
      title: 'helm upgrade Lifecycle Order',
      head: ['Phase', 'Action Taken', 'Failure Consequence'],
      rows: [
        ['1. Compilation', 'Validates OpenAPI schema & chart dependencies', 'CLI exits immediately; no cluster changes'],
        ['2. State Reservation', 'Writes pending-upgrade Secret to Kubernetes', 'Lock is reserved; subsequent runs block if aborted'],
        ['3. Pre-Hooks', 'Runs pre-install / pre-upgrade Jobs', 'Halts rollout; live application untouched'],
        ['4. Manifest Apply', 'Server-Side Apply creates/updates Kubernetes workloads', 'Resources created in cluster'],
        ['5. Readiness Verification', 'kstatus watcher monitors Pod conditions up to --timeout', 'Rollout fails if pods CrashLoop; triggers rollback if enabled'],
        ['6. Post-Hooks & Finalize', 'Marks release deployed; runs post-upgrade hooks', 'Rollout completed'],
      ]
    },
    inspector: {
      heading: 'The Idempotent CI Command',
      body: 'In automated CI/CD pipelines, you should always run helm upgrade --install rather than separate install and upgrade scripts.',
      facts: [['--install (-i)', 'Installs rev 1 if brand new; upgrades to rev N+1 if release exists'], ['--wait Strategy', 'Helm 4 wait strategies: watcher (kstatus-based), legacy, hookOnly'], ['--atomic Renamed', 'In Helm 4, --atomic is officially renamed --rollback-on-failure']],
      evidence: ['RECOMMENDED CI COMMAND', 'helm upgrade --install payment-api ./charts/payment-api -n payments --wait --timeout 5m --rollback-on-failure --cleanup-on-fail'],
      note: 'Without --wait, Helm considers its job finished the millisecond the API server accepts the YAML. Your pods could be CrashLoopBackOff and CI would still report green.'
    },
    takeaway: 'Helm writes the record first, applies, optionally waits, then marks the result.',
    sources: [S_UPGRADE, S_HELM4]
  },

  // 12: Failed upgrade (Hero 3 - Custom slot)
  {
    id: 'rollback', group: groups[4], label: 'Failed upgrade', mode: 'custom', hero: true,
    title: 'What does a failed upgrade leave behind?',
    lede: 'When an upgrade fails (e.g. image tag typo), the state of your release and live workloads depends entirely on --wait, --rollback-on-failure, and --cleanup-on-fail.',
    frames: [],
    inspector: {
      heading: 'The Mechanics of Rolling Back',
      body: 'A rollback in Helm does not "delete" the bad revision or rewind the counter. It writes a brand-new revision record that duplicates the exact manifests from the earlier successful revision.',
      facts: [['Revision Ledger', 'v1 (superseded) → v2 (superseded) → v3 (failed) → v4 (deployed, rollback to v2)'], ['First Install Failure', 'On a brand-new install that fails, --rollback-on-failure uninstalls the release completely'], ['Hook Caveat', 'Database migrations executed by pre-upgrade hooks are NOT automatically reversed by Helm']],
      evidence: ['MANUAL ROLLBACK COMMAND', 'helm rollback payment-api 2 -n payments'],
      note: 'Always pair --rollback-on-failure with --cleanup-on-fail. Otherwise, new ConfigMaps or Services created during the broken release linger indefinitely in Kubernetes.'
    },
    takeaway: 'Without --wait, "deployed" means accepted. Rollback-on-failure turns a failure into a new revision that restores the last good one.',
    sources: [S_UPGRADE, S_ROLLBACK]
  },

  // 13: Inspect a release
  {
    id: 'inspect', group: groups[4], label: 'Inspect a release', mode: 'choices',
    title: 'How do you inspect and troubleshoot a release?',
    lede: 'Different Helm commands query different data sources. Some inspect stored release Secrets; others query live cluster workloads.',
    diagram: DIAGRAM_INSPECT,
    frames: [
      { action: 'helm history', caption: 'Queries release Secrets to print revision numbers, deployment timestamps, descriptions, and statuses (deployed, superseded, failed).', pic: { hot: ['cmd_hist', 'sec_db'], badge: { cmd_hist: 'history' } } },
      { action: 'helm status', caption: 'Combines stored release metadata with live Kubernetes API queries to display current Pod readiness and release notes.', pic: { hot: ['cmd_stat', 'sec_db', 'live_pods'], badge: { cmd_stat: 'status' } } },
      { action: 'helm get manifest', caption: 'Decodes the stored release Secret to output the exact Kubernetes YAML manifests applied during that specific revision.', pic: { hot: ['cmd_get', 'sec_db'], badge: { cmd_get: 'manifest' } } },
      { action: 'helm diff upgrade', caption: 'Popular third-party plugin that generates a git-diff view comparing live cluster state against your new local templates.', pic: { hot: ['cmd_stat', 'live_pods'], badge: { cmd_stat: 'diff' } } },
    ],
    table: {
      title: 'Helm Inspection Commands',
      head: ['Command', 'Reads From', 'Primary Diagnostic Use Case'],
      rows: [
        ['helm history <rel>', 'Stored Secrets only', 'Audit who deployed what and find the last good revision for rollback'],
        ['helm status <rel>', 'Stored Secrets + Live API', 'Inspect current status, notes, and live workload health'],
        ['helm get values <rel>', 'Stored Secrets only', 'Inspect user-supplied overrides passed to the release'],
        ['helm get manifest <rel>', 'Stored Secrets only', 'Extract the exact rendered YAML deployed to Kubernetes'],
        ['helm diff upgrade <rel> <chart>', 'Live API + Local Chart', 'Review exact field changes before running an upgrade'],
      ]
    },
    inspector: {
      heading: 'The Drift Detection Blindspot',
      body: 'helm get manifest reflects what Helm stored during the last deployment. If an engineer manually edits a Deployment using kubectl edit, helm get manifest will NOT reflect those manual changes.',
      facts: [['Stored State vs Live State', 'Helm history reflects intent at deployment time, not drift'], ['helm list -A', 'Lists all releases across all namespaces'], ['helm diff Plugin', 'Indispensable tool for verifying changes before running upgrade in production']],
      evidence: ['VIEW DEPLOYED MANIFEST', 'helm get manifest payment-api -n payments --revision 2'],
      note: 'Never run kubectl edit on resources managed by Helm unless in an active outage. Manual mutations cause silent drift that gets overwritten on the next release.'
    },
    takeaway: 'History, values, and manifests come from the release record. Drift in live objects does not appear there.',
    sources: [S_ROLLBACK]
  },

  // 14: Push or pull (Lab 4: Delivery Architecture Switchboard & Drift Simulator)
  {
    id: 'delivery', group: groups[5], label: 'Push or pull', mode: 'custom', hero: true,
    title: 'Should CI run helm upgrade, or should a controller?',
    lede: 'CI push models require broad cluster admin credentials in CI runners. Modern GitOps controllers (Argo CD and Flux) pull changes from inside the cluster.',
    frames: [],
    table: {
      title: 'Delivery Architecture Comparison',
      head: ['Feature', 'CI Push (helm upgrade -i)', 'Argo CD', 'Flux (helm-controller)'],
      rows: [
        ['Where Helm Runs', 'External CI Runner', 'Inside Cluster Controller', 'Inside Cluster Controller'],
        ['Cluster Creds in CI?', 'Yes (broad admin credentials required)', 'Zero cluster credentials in CI', 'Zero cluster credentials in CI'],
        ['Helm Role', 'Release Manager', 'Template Compiler (helm template)', 'Release Manager (Helm Go SDK)'],
        ['In-Cluster Helm Secrets?', 'Yes (sh.helm.release.v1.*)', 'No (tracked in Argo CD Application)', 'Yes (sh.helm.release.v1.*)'],
        ['Drift Reconciliation', 'None (persists until next CI deploy)', 'Continuous self-healing / auto-sync', 'Continuous drift detection supported'],
      ]
    },
    inspector: {
      heading: 'Argo CD vs Flux: Different Helm Philosophies',
      body: 'Argo CD uses Helm purely to inflate YAML templates, deliberately bypassing Helm\'s in-cluster release secrets and hooks in favor of native GitOps diffing. Flux embraces Helm\'s release lifecycle natively via its Go SDK.',
      facts: [['No Secrets in Argo', 'If you run helm list on an Argo-managed cluster, you will see no releases'], ['Hook Translation', 'Argo CD translates Helm hooks into Argo CD resource hooks'], ['Self-Healing', 'GitOps controllers automatically reconcile manual kubectl drift back to Git state']],
      evidence: ['ARGO CD MANIFEST', 'spec.source.helm.valueFiles: ["values-prod.yaml"]'],
      note: 'If a chart uses {{ randAlphaNum }} to generate secrets, Argo CD will detect permanent out-of-sync drift on every reconciliation loop.'
    },
    takeaway: 'Argo CD uses Helm as a renderer; CI and Flux use it as a release manager. The choice moves credentials and decides who fixes drift.',
    sources: [S_ARGO, S_FLUX]
  },

  // 15: Safe change loop
  {
    id: 'practice', group: groups[5], label: 'Safe change loop', mode: 'steps',
    title: 'A six-step routine for every production Helm change',
    lede: 'Production deployment safety is not about luck. Follow a repeatable verification loop from local linting through automated verification.',
    diagram: DIAGRAM_LOOP,
    frames: [
      { action: '1. Lint', caption: 'Run helm lint to catch YAML syntax errors, missing mandatory values, and invalid Chart.yaml schemas before committing.', pic: { hot: ['s1_lint'], badge: { s1_lint: 'lint' } } },
      { action: '2. Render & Scan', caption: 'Run helm template --api-versions to compile YAML and pass manifests through security scanners like trivy or checkov.', pic: { hot: ['s2_tpl'], badge: { s2_tpl: 'security scan' } } },
      { action: '3. Preview Diff', caption: 'Inspect exact additions, modifications, and deletions against live Kubernetes workloads using helm diff upgrade.', pic: { hot: ['s3_diff'], badge: { s3_diff: 'review diff' } } },
      { action: '4. Safe Upgrade', caption: 'Deploy using --wait --timeout 5m --rollback-on-failure --cleanup-on-fail. Never skip readiness waiting in production.', pic: { hot: ['s4_up'], badge: { s4_up: 'atomic wait' } } },
      { action: '5. Integration Test', caption: 'Run helm test to trigger ephemeral test pods that verify database connections and API health in staging.', pic: { hot: ['s5_test'], badge: { s5_test: 'integration test' } } },
    ],
    table: {
      title: 'Production Verification Checklist',
      head: ['Checklist Item', 'Why it Matters'],
      rows: [
        ['Pin Dependency Versions in Chart.lock', 'Prevents unexpected upstream breaking changes in automated builds'],
        ['Commit Chart.lock, gitignore charts/*.tgz', 'Keeps repositories thin while guaranteeing reproducible builds'],
        ['Always Supply --rollback-on-failure & --wait', 'Prevents broken deployments from lingering undetected in production'],
        ['Configure --history-max 10', 'Prunes historical release secrets to keep etcd storage lean'],
        ['Never Commit Unencrypted Secrets to values.yaml', 'Release secrets store plain values; anyone with read access can see them'],
      ]
    },
    inspector: {
      heading: 'The Golden Production Flags',
      body: 'Always combine --wait, --timeout, --rollback-on-failure (formerly --atomic), and --cleanup-on-fail in your automated deployment pipelines.',
      facts: [['--wait', 'Guarantees pods are running and healthy before declaring success'], ['--rollback-on-failure', 'Restores the previous stable release revision if pods crash or timeout expires'], ['--cleanup-on-fail', 'Deletes newly created resources if the transaction fails']],
      evidence: ['PRODUCTION FLAG COMBINATION', 'helm upgrade -i app ./chart -f prod.yaml --wait --timeout 5m --rollback-on-failure --cleanup-on-fail'],
      note: 'Avoid using --force unless absolutely necessary. --force causes hard resource deletion and recreation rather than rolling updates.'
    },
    takeaway: 'Check the render, preview the diff, let Helm wait and roll back, then test.',
    sources: [S_UPGRADE, S_ROLLBACK]
  }
];

export const helmLesson: Lesson = {
  id: 'helm',
  kicker: 'KUBERNETES · PACKAGING & RELEASE CONSOLE',
  title: 'Helm: One Chart, Three Jobs',
  summary: 'Follow payment-api from a directory on your workstation to an OCI registry package and an in-cluster release, configure subcharts, and simulate rollbacks.',
  reference: 'UMBRELLA CHART · payment-api',
  format: 'KUBERNETES · DEEP DIVE',
  scenario: 'payment-api · chart 1.2.0 · deps pg, cache, common · ns payments · rev 2 deployed',
  scope: 'Covers Helm architecture across client-side rendering, OCI artifact packaging, and cluster release management. Explains subcharts, umbrella charts, values scoping, Chart.lock reproducibility, release secret ledgers, the upgrade transaction lifecycle, rollback mechanics, and GitOps delivery with Argo CD and Flux. Tested against Helm v4.2.2.',
  groups,
  views,
  sources,
  collection: { href: '/kubernetes', label: 'Kubernetes' },
  legend: [
    { kind: 'code', label: 'your workstation / CI' },
    { kind: 'tool', label: 'template compiler / engine' },
    { kind: 'store', label: 'registry / release secret' },
    { kind: 'kube', label: 'Kubernetes API / workload' },
    { kind: 'part', label: 'file / manifest / config' },
    { kind: 'hot', label: 'active execution path' },
    { kind: 'denied', label: 'failed / stopped' },
  ],
  related: [
    { label: 'Kubernetes API Server', href: '/kubernetes-api-server' },
    { label: 'Containers', href: '/containers' },
    { label: 'GitHub Actions Cheatsheet', href: '/github-actions-cheatsheet' },
    { label: 'DevSecOps Pipeline', href: '/secopspipeline' },
    { label: 'Git: Snapshots and Moving Labels', href: '/git' },
  ]
};
