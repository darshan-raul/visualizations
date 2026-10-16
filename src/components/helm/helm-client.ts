/**
 * helm-client.ts
 * Interactive handlers for the complete Helm Visual Console:
 * 1. ValuesMergeBoard (Hero 1: Precedence & layer merging)
 * 2. FailureLabBoard (Hero 3: Upgrade transaction & rollback states)
 * 3. HelmWorkbench (Visual Anchor: 3-Zone execution boundaries & commands)
 * 4. ScopeFunnelBoard (Lab 1: Subchart scoping, alias mismatch trap, library chart)
 * 5. DependencyLabBoard (Lab 2: Time machine, ranges, Chart.lock, thin vs vendored)
 * 6. DeliveryLabBoard (Lab 4: CI Push vs Argo CD vs Flux & drift simulation)
 */

export function initHelmConsole() {
  const root = document.querySelector<HTMLElement>('.helm-console');
  if (!root) return;

  // =========================================================================
  // 1. HERO 1: Values Merge Board
  // =========================================================================
  const valuesBoard = root.querySelector<HTMLElement>('[data-helm-values-board]');
  if (valuesBoard) {
    const baseCheck = valuesBoard.querySelector<HTMLInputElement>('[data-helm-layer="base"]');
    const prodCheck = valuesBoard.querySelector<HTMLInputElement>('[data-helm-layer="prod"]');
    const setCheck = valuesBoard.querySelector<HTMLInputElement>('[data-helm-layer="set"]');
    const setInput = valuesBoard.querySelector<HTMLInputElement>('[data-helm-set-input]');
    const resetBtn = valuesBoard.querySelector<HTMLButtonElement>('[data-helm-reset-values]');

    const vReplicas = valuesBoard.querySelector<HTMLElement>('[data-v="replicas"]');
    const srcReplicas = valuesBoard.querySelector<HTMLElement>('[data-src="replicas"]');
    const vTag = valuesBoard.querySelector<HTMLElement>('[data-v="tag"]');
    const srcTag = valuesBoard.querySelector<HTMLElement>('[data-src="tag"]');
    const vMemory = valuesBoard.querySelector<HTMLElement>('[data-v="memory"]');
    const srcMemory = valuesBoard.querySelector<HTMLElement>('[data-src="memory"]');
    const vHosts = valuesBoard.querySelector<HTMLElement>('[data-v="hosts"]');
    const srcHosts = valuesBoard.querySelector<HTMLElement>('[data-src="hosts"]');
    const renderedYaml = valuesBoard.querySelector<HTMLElement>('[data-helm-rendered-yaml]');

    const updateMerge = () => {
      const isBase = baseCheck?.checked ?? true;
      const isProd = prodCheck?.checked ?? true;
      const isSet = setCheck?.checked ?? true;
      const tagVal = setInput?.value.trim() || '4.7.2';

      let replicas = '2';
      let srcRep = 'from chart defaults';
      let memory = '256Mi';
      let srcMem = 'from chart defaults';
      let hosts = '[payment.example.com]';
      let srcHost = 'from chart defaults';

      if (isBase) {
        replicas = '3';
        srcRep = 'from values.yaml';
      }
      if (isProd) {
        replicas = '5';
        srcRep = 'from values-prod.yaml';
        memory = '512Mi';
        srcMem = 'from values-prod.yaml';
        hosts = '[pay.prod.example.com]';
        srcHost = 'list replaced (values-prod.yaml)';
      }

      let tag = '4.7.1';
      let srcT = 'fallback: appVersion';
      if (isSet) {
        tag = tagVal;
        srcT = 'from --set override';
      }

      if (vReplicas) vReplicas.textContent = replicas;
      if (srcReplicas) srcReplicas.textContent = srcRep;
      if (vMemory) vMemory.textContent = memory;
      if (srcMemory) srcMemory.textContent = srcMem;
      if (vHosts) vHosts.textContent = hosts;
      if (srcHosts) srcHosts.textContent = srcHost;
      if (vTag) vTag.textContent = tag;
      if (srcTag) srcTag.textContent = srcT;

      if (renderedYaml) {
        renderedYaml.textContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
spec:
  replicas: ${replicas}
  template:
    spec:
      containers:
        - name: payment-api
          image: "payments/api:${tag}"
          resources:
            limits:
              memory: ${memory}`;
      }
    };

    baseCheck?.addEventListener('change', updateMerge);
    prodCheck?.addEventListener('change', updateMerge);
    setCheck?.addEventListener('change', updateMerge);
    setInput?.addEventListener('input', updateMerge);
    resetBtn?.addEventListener('click', () => {
      if (baseCheck) baseCheck.checked = true;
      if (prodCheck) prodCheck.checked = true;
      if (setCheck) setCheck.checked = true;
      if (setInput) setInput.value = '4.7.2';
      updateMerge();
    });
  }

  // =========================================================================
  // 2. HERO 3: Failure Lab Board
  // =========================================================================
  const failureLab = root.querySelector<HTMLElement>('[data-helm-failure-lab]');
  if (failureLab) {
    const buttons = failureLab.querySelectorAll<HTMLButtonElement>('[data-preset]');
    const cmdBox = failureLab.querySelector<HTMLElement>('[data-helm-cmd]');
    const badge = failureLab.querySelector<HTMLElement>('[data-helm-cli-badge]');
    const cliOutput = failureLab.querySelector<HTMLElement>('[data-helm-cli-output]');
    const ledger = failureLab.querySelector<HTMLElement>('[data-helm-ledger]');
    const pods = failureLab.querySelector<HTMLElement>('[data-helm-pods]');
    const extra = failureLab.querySelector<HTMLElement>('[data-helm-extra]');
    const action = failureLab.querySelector<HTMLElement>('[data-helm-action]');

    const PRESETS: Record<string, {
      cmd: string;
      badge: string;
      badgeColor: string;
      output: string;
      ledger: string;
      pods: string;
      extra: string;
      action: string;
    }> = {
      rollback: {
        cmd: `helm upgrade --install payment-api ./charts/payment-api \\
  --namespace payments \\
  -f values-prod.yaml \\
  --set image.tag=4.7.2-rc \\
  --rollback-on-failure`,
        badge: 'EXIT CODE 1 (FAILED & ROLLED BACK)',
        badgeColor: '#da3633',
        output: `Error: UPGRADE FAILED: release payment-api failed, and has been rolled back due to --rollback-on-failure
Deployment.apps "payment-api" is invalid: ImagePullBackOff (tag 4.7.2-rc not found)
Rolled back release payment-api to revision 2`,
        ledger: 'v1 (superseded) → v2 (superseded) → v3 (failed) → v4 (deployed, rollback to 2)',
        pods: 'Pods running stable image payments/api:4.7.1 (Service healthy)',
        extra: 'ConfigMap payment-api-flags remains in cluster (use --cleanup-on-fail to purge)',
        action: 'Cluster workloads remained online! Release ledger advanced to v4 (which mirrors v2\'s configuration). Fix the image tag in Git before triggering CI again.'
      },
      cleanup: {
        cmd: `helm upgrade --install payment-api ./charts/payment-api \\
  --namespace payments \\
  -f values-prod.yaml \\
  --set image.tag=4.7.2-rc \\
  --rollback-on-failure \\
  --cleanup-on-fail`,
        badge: 'EXIT CODE 1 (ROLLED BACK + CLEANED UP)',
        badgeColor: '#da3633',
        output: `Error: UPGRADE FAILED: release payment-api failed, and has been rolled back due to --rollback-on-failure
Deployment.apps "payment-api" is invalid: ImagePullBackOff (tag 4.7.2-rc not found)
Rolled back release payment-api to revision 2
Deleted newly created resources: ConfigMap/payment-api-flags`,
        ledger: 'v1 (superseded) → v2 (superseded) → v3 (failed) → v4 (deployed, rollback to 2)',
        pods: 'Pods running stable image payments/api:4.7.1 (Service healthy)',
        extra: 'Cleaned up: ConfigMap payment-api-flags was automatically deleted',
        action: 'Cleanest failure path. No orphaned resources from the failed release remain in Kubernetes.'
      },
      wait: {
        cmd: `helm upgrade --install payment-api ./charts/payment-api \\
  --namespace payments \\
  -f values-prod.yaml \\
  --set image.tag=4.7.2-rc \\
  --wait --timeout 5m`,
        badge: 'EXIT CODE 1 (TIMED OUT)',
        badgeColor: '#d29922',
        output: `Error: UPGRADE FAILED: timed out waiting for the condition
Deployment.apps "payment-api" is not ready: 0 of 5 updated replicas are available (ImagePullBackOff)`,
        ledger: 'v1 (superseded) → v2 (superseded) → v3 (failed)',
        pods: 'Rollout stalled: 5 old pods still running, new ReplicaSet stuck in ImagePullBackOff',
        extra: 'ConfigMap payment-api-flags was created and remains in cluster',
        action: 'CI runner blocked for 5 minutes. Release is marked failed. Operator must run "helm rollback payment-api 2" manually.'
      },
      'no-wait': {
        cmd: `helm upgrade --install payment-api ./charts/payment-api \\
  --namespace payments \\
  -f values-prod.yaml \\
  --set image.tag=4.7.2-rc`,
        badge: 'EXIT CODE 0 (SILENT PRODUCTION TRAP)',
        badgeColor: '#238636',
        output: `Release "payment-api" has been upgraded. Happy Helming!
NAME: payment-api
LAST DEPLOYED: Sat Oct 17 00:00:00 2026
NAMESPACE: payments
STATUS: deployed
REVISION: 3`,
        ledger: 'v1 (superseded) → v2 (superseded) → v3 (deployed!)',
        pods: 'CRITICAL: Helm exited 0, but Pods in Kubernetes are crashing/ImagePullBackOff!',
        extra: 'All new resources created and active',
        action: 'DANGEROUS: Without --wait, Helm reports success the moment API accepts the YAML. CI passes while Kubernetes workload fails.'
      },
      interrupted: {
        cmd: `helm upgrade --install payment-api ./charts/payment-api ...
# [CI Runner killed by timeout/SIGKILL during apply phase]`,
        badge: 'INTERRUPTED (STUCK RELEASE LOCK)',
        badgeColor: '#8b949e',
        output: `Next CI run produces:
Error: UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress`,
        ledger: 'v1 (superseded) → v2 (superseded) → v3 (pending-upgrade)',
        pods: 'Cluster state depends on exact instant execution was terminated',
        extra: 'Pending secret lock prevents any subsequent Helm commands',
        action: 'Release is locked. Operator must inspect "helm history payment-api" and execute "helm rollback payment-api 2" to clear pending state.'
      }
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const key = btn.dataset.preset || 'rollback';
        const p = PRESETS[key];
        if (!p) return;

        if (cmdBox) cmdBox.textContent = p.cmd;
        if (badge) {
          badge.textContent = p.badge;
          badge.style.background = p.badgeColor;
        }
        if (cliOutput) cliOutput.textContent = p.output;
        if (ledger) ledger.textContent = p.ledger;
        if (pods) pods.textContent = p.pods;
        if (extra) extra.textContent = p.extra;
        if (action) action.textContent = p.action;
      });
    });
  }

  // =========================================================================
  // 3. PERSISTENT VISUAL ANCHOR: HelmWorkbench (3-Zone Workbench)
  // =========================================================================
  const workbench = root.querySelector<HTMLElement>('[data-helm-workbench]');
  if (workbench) {
    const hatButtons = workbench.querySelectorAll<HTMLButtonElement>('[data-hat]');
    const cmdChips = workbench.querySelectorAll<HTMLButtonElement>('[data-cmd]');

    const z1 = workbench.querySelector<HTMLElement>('[data-zone="1"]');
    const z2 = workbench.querySelector<HTMLElement>('[data-zone="2"]');
    const z3 = workbench.querySelector<HTMLElement>('[data-zone="3"]');
    const gateReg = workbench.querySelector<HTMLElement>('[data-gate="registry"]');
    const gateClust = workbench.querySelector<HTMLElement>('[data-gate="cluster"]');

    const rRole = workbench.querySelector<HTMLElement>('[data-r-role]');
    const rTitle = workbench.querySelector<HTMLElement>('[data-r-title]');
    const rDesc = workbench.querySelector<HTMLElement>('[data-r-desc]');
    const rHost = workbench.querySelector<HTMLElement>('[data-r-host]');
    const rNet = workbench.querySelector<HTMLElement>('[data-r-net]');
    const rK8s = workbench.querySelector<HTMLElement>('[data-r-k8s]');
    const rState = workbench.querySelector<HTMLElement>('[data-r-state]');

    const setZoneOpacity = (z1Active: boolean, z2Active: boolean, z3Active: boolean) => {
      if (z1) z1.style.opacity = z1Active ? '1' : '0.35';
      if (z2) z2.style.opacity = z2Active ? '1' : '0.35';
      if (z3) z3.style.opacity = z3Active ? '1' : '0.35';
      if (gateReg) gateReg.style.opacity = z1Active && z2Active ? '1' : '0.25';
      if (gateClust) gateClust.style.opacity = z1Active && z3Active ? '1' : '0.25';
    };

    const HATS_DATA: Record<string, {
      role: string;
      title: string;
      desc: string;
      host: string;
      net: string;
      k8s: string;
      state: string;
      zones: [boolean, boolean, boolean];
    }> = {
      all: {
        role: 'ALL-IN-ONE OVERVIEW',
        title: 'Helm Wears Three Distinct Hats',
        desc: 'Select any hat or command chip above to trace exactly which boundaries it crosses, what state it mutates, and where its memory lives.',
        host: 'Workstation / CI',
        net: 'Local / Offline by default',
        k8s: 'None (unless release commands)',
        state: 'None (or Secret Ledger v1..vN)',
        zones: [true, true, true]
      },
      template: {
        role: 'HAT 1: TEMPLATE COMPILER',
        title: 'Compiles Go Templates into Raw Kubernetes YAML Offline',
        desc: 'Evaluates templates/*.yaml against merged values. Zero network calls to the cluster and zero in-cluster records created.',
        host: 'Workstation / CI Runner',
        net: '100% Offline / Local Disk',
        k8s: 'Zero API calls (offline)',
        state: 'Outputs to stdout / pipe to scanner',
        zones: [true, false, false]
      },
      package: {
        role: 'HAT 2: ARTIFACT & PACKAGE MANAGER',
        title: 'Packages .tgz Archives and Pushes to OCI Registries',
        desc: 'Treats Helm charts as first-class OCI container artifacts. Transfers packages and digital signatures without touching Kubernetes.',
        host: 'Workstation / CI Runner',
        net: 'HTTPS to OCI / HTTP registry',
        k8s: 'Zero K8s API calls',
        state: 'Stored in OCI container registry',
        zones: [true, true, false]
      },
      release: {
        role: 'HAT 3: CLUSTER RELEASE MANAGER',
        title: 'Mutates Kubernetes API & Tracks Release Secret Ledger',
        desc: 'Communicates with kube-apiserver, runs pre/post hooks, executes Server-Side Apply, and records immutable history in namespace Secrets.',
        host: 'Workstation / CI with KUBECONFIG',
        net: 'K8s API Server (6443/TCP)',
        k8s: 'Full Create/Update/Delete mutation',
        state: 'Secret Ledger: sh.helm.release.v1.*',
        zones: [true, false, true]
      }
    };

    const CMDS_DATA: Record<string, {
      hat: string;
      role: string;
      title: string;
      desc: string;
      host: string;
      net: string;
      k8s: string;
      state: string;
      zones: [boolean, boolean, boolean];
    }> = {
      template: {
        hat: 'template',
        role: 'COMMAND: helm template',
        title: 'helm template [NAME] [CHART] -f [VALUES]',
        desc: 'Compiles local or pulled chart templates into raw YAML. Used by Argo CD and pre-commit security scanners (trivy, kube-linter).',
        host: 'Workstation / CI',
        net: 'Zero network calls',
        k8s: 'No cluster access',
        state: 'Standard output (YAML stream)',
        zones: [true, false, false]
      },
      lint: {
        hat: 'template',
        role: 'COMMAND: helm lint',
        title: 'helm lint [PATH]',
        desc: 'Examines chart directory for syntactic correctness, missing mandatory values, and invalid Chart.yaml schemas.',
        host: 'Workstation / CI',
        net: 'Zero network calls',
        k8s: 'No cluster access',
        state: 'Linting report / exit code',
        zones: [true, false, false]
      },
      pull: {
        hat: 'package',
        role: 'COMMAND: helm pull',
        title: 'helm pull [OCI-CHART] --version [X.Y.Z] --untar',
        desc: 'Fetches immutable packaged tarball from remote registry. Optional --verify checks digital GPG signatures and provenance.',
        host: 'Workstation / CI',
        net: 'OCI Registry download',
        k8s: 'No cluster access',
        state: 'Local .tgz archive file',
        zones: [true, true, false]
      },
      package: {
        hat: 'package',
        role: 'COMMAND: helm package',
        title: 'helm package [PATH] --sign',
        desc: 'Compresses chart directory into a versioned tarball (payment-api-1.2.0.tgz). Optional --sign creates cryptographic .prov file.',
        host: 'Workstation / CI',
        net: 'None (local disk)',
        k8s: 'No cluster access',
        state: 'Local .tgz + .prov package',
        zones: [true, false, false]
      },
      push: {
        hat: 'package',
        role: 'COMMAND: helm push',
        title: 'helm push [TARBALL] oci://registry.example.com/...',
        desc: 'Pushes packaged chart directly to an OCI container registry. The chart version becomes the OCI image tag.',
        host: 'Workstation / CI',
        net: 'OCI Registry upload',
        k8s: 'No cluster access',
        state: 'Remote OCI artifact tag',
        zones: [true, true, false]
      },
      upgrade: {
        hat: 'release',
        role: 'COMMAND: helm upgrade --install',
        title: 'helm upgrade --install [NAME] [CHART] --wait --rollback-on-failure',
        desc: 'The idempotent release command. Writes pending Secret, executes pre-upgrade hooks, applies manifests, and awaits health verification.',
        host: 'CI Runner / Operator',
        net: 'kube-apiserver (HTTPS)',
        k8s: 'Applies workloads (SSA)',
        state: 'New Secret revision (vN+1)',
        zones: [true, false, true]
      },
      rollback: {
        hat: 'release',
        role: 'COMMAND: helm rollback',
        title: 'helm rollback [NAME] [TARGET-REVISION]',
        desc: 'Restores workloads to the exact manifest recorded in an earlier revision. Writes a new revision that mirrors the target state.',
        host: 'CI Runner / Operator',
        net: 'kube-apiserver (HTTPS)',
        k8s: 'Rolls back workloads to target',
        state: 'New Secret revision (e.g. v4 from v2)',
        zones: [true, false, true]
      },
      status: {
        hat: 'release',
        role: 'COMMAND: helm status',
        title: 'helm status [NAME] --show-desc',
        desc: 'Reads the latest release Secret from Kubernetes and cross-checks live Pod/Service readiness conditions.',
        host: 'Workstation / Operator',
        net: 'kube-apiserver (HTTPS)',
        k8s: 'Read-only cluster query',
        state: 'Prints live cluster health report',
        zones: [true, false, true]
      }
    };

    const applyHat = (key: string) => {
      const data = HATS_DATA[key];
      if (!data) return;
      hatButtons.forEach((b) => {
        const isActive = b.dataset.hat === key;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      cmdChips.forEach((c) => c.classList.remove('is-active'));
      setZoneOpacity(...data.zones);
      if (rRole) rRole.textContent = data.role;
      if (rTitle) rTitle.textContent = data.title;
      if (rDesc) rDesc.textContent = data.desc;
      if (rHost) rHost.textContent = data.host;
      if (rNet) rNet.textContent = data.net;
      if (rK8s) rK8s.textContent = data.k8s;
      if (rState) rState.textContent = data.state;
    };

    hatButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        applyHat(btn.dataset.hat || 'all');
      });
    });

    cmdChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const cmdKey = chip.dataset.cmd || 'template';
        const c = CMDS_DATA[cmdKey];
        if (!c) return;
        cmdChips.forEach((b) => b.classList.remove('is-active'));
        chip.classList.add('is-active');
        hatButtons.forEach((b) => {
          const isActive = b.dataset.hat === c.hat;
          b.classList.toggle('is-active', isActive);
          b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        setZoneOpacity(...c.zones);
        if (rRole) rRole.textContent = c.role;
        if (rTitle) rTitle.textContent = c.title;
        if (rDesc) rDesc.textContent = c.desc;
        if (rHost) rHost.textContent = c.host;
        if (rNet) rNet.textContent = c.net;
        if (rK8s) rK8s.textContent = c.k8s;
        if (rState) rState.textContent = c.state;
      });
    });
  }

  // =========================================================================
  // 4. LAB 1: ScopeFunnelBoard (Subcharts & Scope Router)
  // =========================================================================
  const funnelBoard = root.querySelector<HTMLElement>('[data-helm-funnel-board]');
  if (funnelBoard) {
    const buttons = funnelBoard.querySelectorAll<HTMLButtonElement>('[data-funnel-preset]');
    const fValues = funnelBoard.querySelector<HTMLElement>('[data-f-values]');
    const pgStatus = funnelBoard.querySelector<HTMLElement>('[data-pg-status]');
    const cacheStatus = funnelBoard.querySelector<HTMLElement>('[data-cache-status]');
    const fCallout = funnelBoard.querySelector<HTMLElement>('[data-f-callout]');
    const fOutput = funnelBoard.querySelector<HTMLElement>('[data-f-output]');

    const FUNNEL_PRESETS: Record<string, {
      values: string;
      pgStat: string;
      pgOk: boolean;
      cacheStat: string;
      cacheOk: boolean;
      callout: string;
      output: string;
    }> = {
      all: {
        values: `replicaCount: 5
image:
  repository: payments/api
  tag: "4.7.2"

# 1. Scoped to PostgreSQL subchart
postgresql:
  enabled: true
  auth:
    database: payments

# 2. Scoped to aliased Redis cache
cache:
  enabled: true
  architecture: standalone

# 3. Global (passed to ALL subcharts)
global:
  environment: production
  imagePullSecrets:
    - name: reg-cred`,
        pgStat: '✓ Evaluates postgresql.enabled=true',
        pgOk: true,
        cacheStat: '✓ Evaluates cache.enabled=true',
        cacheOk: true,
        callout: '<strong>Scope Rule:</strong> Subcharts cannot see parent application keys. They only receive their dedicated section (or alias) and <code>global:</code>.',
        output: `# Source: payment-api/charts/postgresql/templates/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: payment-api-postgresql
spec:
  serviceName: payment-api-postgresql
---
# Source: payment-api/charts/cache/templates/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: payment-api-cache
spec:
  replicas: 1
---
# Source: payment-api/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
spec:
  replicas: 5
  template:
    spec:
      containers:
        - name: api
          image: "payments/api:4.7.2"`
      },
      'cache-off': {
        values: `replicaCount: 5
image:
  repository: payments/api
  tag: "4.7.2"

# 1. Scoped to PostgreSQL subchart
postgresql:
  enabled: true
  auth:
    database: payments

# 2. Scoped to aliased Redis cache (DISABLED)
cache:
  enabled: false
  architecture: standalone

# 3. Global
global:
  environment: production`,
        pgStat: '✓ Evaluates postgresql.enabled=true',
        pgOk: true,
        cacheStat: '✗ Condition false: stripped from render!',
        cacheOk: false,
        callout: '<strong>Condition Evaluation:</strong> Because <code>cache.enabled: false</code> in values, Helm skips rendering any templates from the cache subchart.',
        output: `# Source: payment-api/charts/postgresql/templates/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: payment-api-postgresql
spec:
  serviceName: payment-api-postgresql
---
# (payment-api-cache StatefulSet is skipped)
---
# Source: payment-api/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
spec:
  replicas: 5
  template:
    spec:
      containers:
        - name: api
          image: "payments/api:4.7.2"`
      },
      'alias-trap': {
        values: `replicaCount: 5
# TRAP: Developer wrote 'redis:' instead of alias 'cache:'!
redis:
  enabled: false
  architecture: cluster

postgresql:
  enabled: true

global:
  environment: production`,
        pgStat: '✓ Evaluates postgresql.enabled=true',
        pgOk: true,
        cacheStat: '⚠ ALIAS TRAP: cache.enabled missing; Helm DEPLOYS cache anyway!',
        cacheOk: false,
        callout: '<strong>The Alias Trap:</strong> When an alias is declared (<code>alias: cache</code>), values under <code>redis:</code> are completely ignored! Because <code>cache.enabled</code> does not exist, Helm considers the condition unset and DEPLOYS Redis with defaults.',
        output: `# Source: payment-api/charts/postgresql/templates/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: payment-api-postgresql
spec:
  serviceName: payment-api-postgresql
---
# Source: payment-api/charts/cache/templates/statefulset.yaml
# DEPLOYED UNINTENTIONALLY (Condition path cache.enabled was missing)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: payment-api-cache
spec:
  replicas: 1
---
# Source: payment-api/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
spec:
  replicas: 5`
      },
      'lib-only': {
        values: `# Demonstrating common-templates library chart consumption:
replicaCount: 5
image:
  repository: payments/api
  tag: "4.7.2"

# Templates in payment-api call:
# {{ include "common-templates.deployment" . }}`,
        pgStat: '✓ Evaluates postgresql.enabled=true',
        pgOk: true,
        cacheStat: '✓ Evaluates cache.enabled=true',
        cacheOk: true,
        callout: '<strong>Library Charts (type: library):</strong> Provide reusable template snippets across your enterprise. Attempting to run <code>helm install</code> directly fails: <em>"Error: INSTALLATION FAILED: library charts are not installable"</em>.',
        output: `# Templates generated via common-templates library helper:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  labels:
    # Standard labels injected by library chart:
    app.kubernetes.io/name: payment-api
    app.kubernetes.io/managed-by: Helm
    enterprise.corp/compliance: tier-1
spec:
  replicas: 5
  template:
    metadata:
      labels:
        app.kubernetes.io/name: payment-api
    spec:
      containers:
        - name: payment-api
          image: "payments/api:4.7.2"`
      }
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const key = btn.dataset.funnelPreset || 'all';
        const p = FUNNEL_PRESETS[key];
        if (!p) return;

        if (fValues) fValues.textContent = p.values;
        if (pgStatus) {
          pgStatus.textContent = p.pgStat;
          pgStatus.className = `pipe-status ${p.pgOk ? 'ok' : 'err'}`;
        }
        if (cacheStatus) {
          cacheStatus.textContent = p.cacheStat;
          cacheStatus.className = `pipe-status ${p.cacheOk ? 'ok' : 'err'}`;
        }
        if (fCallout) fCallout.innerHTML = p.callout;
        if (fOutput) fOutput.textContent = p.output;
      });
    });
  }

  // =========================================================================
  // 5. LAB 2: DependencyLabBoard (Time Machine & Supply Chain)
  // =========================================================================
  const depBoard = root.querySelector<HTMLElement>('[data-helm-dep-board]');
  if (depBoard) {
    const timeBtns = depBoard.querySelectorAll<HTMLButtonElement>('[data-time]');
    const stratBtns = depBoard.querySelectorAll<HTMLButtonElement>('[data-strat]');
    const actionBtns = depBoard.querySelectorAll<HTMLButtonElement>('[data-action]');

    const depRange = depBoard.querySelector<HTMLElement>('[data-dep-range]');
    const depLog = depBoard.querySelector<HTMLElement>('[data-dep-log]');
    const depLock = depBoard.querySelector<HTMLElement>('[data-dep-lock]');
    const depVerdict = depBoard.querySelector<HTMLElement>('[data-dep-verdict]');
    const gitBanner = depBoard.querySelector<HTMLElement>('[data-dep-git-banner]');

    let currentTime = 'day1';
    let currentAction = 'build';
    let currentStrat = 'thin';

    const updateDepLab = () => {
      if (currentTime === 'day1') {
        if (depRange) depRange.textContent = '"~16.2.0"';
        if (depLock) {
          depLock.textContent = `dependencies:
- name: postgresql
  repository: https://charts.example.com
  version: 16.2.3
- name: redis
  repository: oci://registry.example.com
  version: 20.1.4
digest: sha256:4b91f0a1c8d4...
generated: "2026-10-17T00:00:00Z"`;
        }
        if (currentAction === 'build') {
          if (depLog) {
            depLog.textContent = `$ helm dependency build ./payment-api
Rebuilding dependencies from Chart.lock...
Fetching postgresql 16.2.3 (matching lockfile)
Fetching redis 20.1.4 (matching lockfile)
Dependencies built successfully.`;
          }
          if (depVerdict) {
            depVerdict.className = 'lock-verdict ok';
            depVerdict.innerHTML = '<strong>REPRODUCIBLE IN CI:</strong> Guaranteed identical build across any runner.';
          }
        } else {
          if (depLog) {
            depLog.textContent = `$ helm dependency update ./payment-api
Saving 2 charts
Downloading postgresql from https://charts.example.com
Resolved version: 16.2.3 (highest matching ~16.2.0)
Saving Chart.lock`;
          }
          if (depVerdict) {
            depVerdict.className = 'lock-verdict ok';
            depVerdict.innerHTML = '<strong>DEVELOPER WORKFLOW:</strong> Re-queried repo and generated initial Chart.lock.';
          }
        }
      } else if (currentTime === 'day14') {
        if (depRange) depRange.textContent = '"~16.2.0"';
        if (currentAction === 'build') {
          if (depLock) {
            depLock.textContent = `dependencies:
- name: postgresql
  repository: https://charts.example.com
  version: 16.2.3
- name: redis
  repository: oci://registry.example.com
  version: 20.1.4
digest: sha256:4b91f0a1c8d4...`;
          }
          if (depLog) {
            depLog.textContent = `$ helm dependency build ./payment-api
Rebuilding dependencies from Chart.lock...
Fetching postgresql 16.2.3 (pinned by lock, even though 16.2.4 exists!)
Fetching redis 20.1.4 (pinned by lock)
Dependencies built successfully.`;
          }
          if (depVerdict) {
            depVerdict.className = 'lock-verdict ok';
            depVerdict.innerHTML = '<strong>SAFE CI BUILD:</strong> Chart.lock shielded CI from newly published upstream 16.2.4!';
          }
        } else {
          if (depLock) {
            depLock.textContent = `dependencies:
- name: postgresql
  repository: https://charts.example.com
  version: 16.2.4
- name: redis
  repository: oci://registry.example.com
  version: 20.1.4
digest: sha256:9f8e7d6c5b4a... (NEW DIGEST)`;
          }
          if (depLog) {
            depLog.textContent = `$ helm dependency update ./payment-api
Saving 2 charts
Downloading postgresql from https://charts.example.com
Resolved version: 16.2.4 (new patch version published upstream!)
Updating Chart.lock with new pinned version and digest.`;
          }
          if (depVerdict) {
            depVerdict.className = 'lock-verdict warn';
            depVerdict.innerHTML = '<strong>LOCKFILE REWRITTEN:</strong> postgresql upgraded to 16.2.4. Test before committing to Git!';
          }
        }
      } else if (currentTime === 'tamper') {
        if (depRange) depRange.textContent = '"~16.3.0" (MODIFIED WITHOUT LOCK UPDATE)';
        if (depLock) {
          depLock.textContent = `dependencies:
- name: postgresql
  repository: https://charts.example.com
  version: 16.2.3
digest: sha256:4b91f0a1c8d4... (MISMATCH WITH Chart.yaml)`;
        }
        if (currentAction === 'build') {
          if (depLog) {
            depLog.textContent = `$ helm dependency build ./payment-api
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "bitnami" chart repository
Error: the lock file (Chart.lock) is out of sync with the dependencies file (Chart.yaml). Please update the dependencies with 'helm dependency update'`;
          }
          if (depVerdict) {
            depVerdict.className = 'lock-verdict err';
            depVerdict.innerHTML = '<strong>CI PIPELINE BLOCKED:</strong> Hash digest mismatch between Chart.yaml and Chart.lock prevents corrupt deployments.';
          }
        } else {
          if (depLog) {
            depLog.textContent = `$ helm dependency update ./payment-api
Saving 2 charts
Downloading postgresql version 16.3.1
Updated Chart.lock to match modified Chart.yaml.`;
          }
          if (depVerdict) {
            depVerdict.className = 'lock-verdict ok';
            depVerdict.innerHTML = '<strong>REPAIRED:</strong> Ran update to regenerate Chart.lock with new digest.';
          }
        }
      }

      if (gitBanner) {
        if (currentStrat === 'thin') {
          gitBanner.innerHTML = `<div class="git-badge">GIT COMMIT BOUNDARY: THIN REPOSITORY (RECOMMENDED)</div>
<div class="git-desc">
  <span>Tracked in Git:</span> <code>Chart.yaml</code>, <code>Chart.lock</code>, <code>values.yaml</code>, <code>templates/</code>.
  <span class="sep">|</span>
  <span>Ignored (.gitignore):</span> <code>charts/*.tgz</code> (downloaded on-the-fly in CI via <code>helm dependency build</code>).
</div>`;
        } else {
          gitBanner.innerHTML = `<div class="git-badge is-vendored">GIT COMMIT BOUNDARY: VENDORED AIR-GAP REPOSITORY</div>
<div class="git-desc">
  <span>Tracked in Git:</span> Everything including <code>charts/*.tgz</code> archives committed directly into repository.
  <span class="sep">|</span>
  <span>Air-Gap Guarantee:</span> Builds run 100% offline without contacting external registries during deployment.
</div>`;
        }
      }
    };

    timeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        timeBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentTime = btn.dataset.time || 'day1';
        updateDepLab();
      });
    });

    stratBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        stratBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentStrat = btn.dataset.strat || 'thin';
        updateDepLab();
      });
    });

    actionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        actionBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentAction = btn.dataset.action || 'build';
        updateDepLab();
      });
    });
  }

  // =========================================================================
  // 6. LAB 4: DeliveryLabBoard (CI Push vs Argo CD vs Flux)
  // =========================================================================
  const deliveryBoard = root.querySelector<HTMLElement>('[data-helm-delivery-board]');
  if (deliveryBoard) {
    const modeBtns = deliveryBoard.querySelectorAll<HTMLButtonElement>('[data-deliv-mode]');
    const driftBtn = deliveryBoard.querySelector<HTMLButtonElement>('[data-drift-btn]');
    const driftText = deliveryBoard.querySelector<HTMLElement>('[data-drift-text]');

    const engineTag = deliveryBoard.querySelector<HTMLElement>('[data-engine-tag]');
    const engineTitle = deliveryBoard.querySelector<HTMLElement>('[data-engine-title]');
    const engineSub = deliveryBoard.querySelector<HTMLElement>('[data-engine-sub]');
    const step1Title = deliveryBoard.querySelector<HTMLElement>('[data-step1-title]');
    const step1Desc = deliveryBoard.querySelector<HTMLElement>('[data-step1-desc]');
    const step2Title = deliveryBoard.querySelector<HTMLElement>('[data-step2-title]');
    const step2Desc = deliveryBoard.querySelector<HTMLElement>('[data-step2-desc]');
    const engineBadge = deliveryBoard.querySelector<HTMLElement>('[data-engine-badge]');

    const delivLedger = deliveryBoard.querySelector<HTMLElement>('[data-deliv-ledger]');
    const delivLedgerHint = deliveryBoard.querySelector<HTMLElement>('[data-deliv-ledger-hint]');
    const delivPods = deliveryBoard.querySelector<HTMLElement>('[data-deliv-pods]');
    const driftCard = deliveryBoard.querySelector<HTMLElement>('[data-drift-card]');
    const driftTitle = deliveryBoard.querySelector<HTMLElement>('[data-drift-title]');
    const driftDesc = deliveryBoard.querySelector<HTMLElement>('[data-drift-desc]');

    const mRole = deliveryBoard.querySelector<HTMLElement>('[data-m-role]');
    const mCreds = deliveryBoard.querySelector<HTMLElement>('[data-m-creds]');
    const mSecrets = deliveryBoard.querySelector<HTMLElement>('[data-m-secrets]');
    const mDrift = deliveryBoard.querySelector<HTMLElement>('[data-m-drift]');

    let currentMode = 'ci-push';
    let isDrifting = false;

    const updateDelivery = () => {
      if (currentMode === 'ci-push') {
        if (engineTag) engineTag.textContent = 'EXTERNAL RUNNER';
        if (engineTitle) engineTitle.textContent = 'CI Runner (Push Model)';
        if (engineSub) engineSub.textContent = 'GitHub Actions / GitLab CI';
        if (step1Title) step1Title.textContent = 'Runs helm upgrade --install';
        if (step1Desc) step1Desc.textContent = 'Runner executes Helm binary with administrative KUBECONFIG credentials pushed from secrets store.';
        if (step2Title) step2Title.textContent = 'Direct kube-apiserver mutation';
        if (step2Desc) step2Desc.textContent = 'Pushes rendered manifests directly across the cluster firewall perimeter.';
        if (engineBadge) {
          engineBadge.textContent = 'SECURITY RISK: CI runner holds broad cluster admin credentials';
          engineBadge.style.color = '#f85149';
          engineBadge.style.borderColor = 'rgba(218, 54, 51, 0.3)';
          engineBadge.style.background = 'rgba(218, 54, 51, 0.12)';
        }

        if (delivLedger) {
          delivLedger.innerHTML = '<span class="pill rev-active">sh.helm.release.v1.payment-api.v3 (deployed)</span>';
        }
        if (delivLedgerHint) delivLedgerHint.textContent = 'helm list finds this release record.';

        if (mRole) mRole.textContent = 'Release Manager';
        if (mCreds) mCreds.textContent = 'Required (Admin Token in CI)';
        if (mSecrets) mSecrets.textContent = 'Created in Namespace';
        if (mDrift) mDrift.textContent = 'None (Silent Divergence)';

        if (isDrifting) {
          if (delivPods) {
            delivPods.innerHTML = '<span class="pod-count" style="color: #f85149;">5 Running Pods</span><span class="pod-match" style="color: #f85149;">⚠ DRIFT DETECTED</span>';
          }
          if (driftCard) driftCard.style.borderColor = '#da3633';
          if (driftTitle) {
            driftTitle.textContent = 'Drift Status: SILENT DIVERGENCE';
            driftTitle.style.color = '#f85149';
          }
          if (driftDesc) driftDesc.textContent = 'Engineer ran "kubectl edit". CI has no idea drift occurred! Cluster has 5 pods while Git declares 3. Divergence persists until next CI run.';
        } else {
          if (delivPods) {
            delivPods.innerHTML = '<span class="pod-count" style="color: #3fb950;">3 Running Pods</span><span class="pod-match">Matches Git Declaration</span>';
          }
          if (driftCard) driftCard.style.borderColor = '#30363d';
          if (driftTitle) {
            driftTitle.textContent = 'Drift Status: IN SYNC';
            driftTitle.style.color = '#3fb950';
          }
          if (driftDesc) driftDesc.textContent = 'Cluster reflects the exact values defined in Git.';
        }
      } else if (currentMode === 'argo') {
        if (engineTag) engineTag.textContent = 'IN-CLUSTER GITOPS CONTROLLER';
        if (engineTitle) engineTitle.textContent = 'Argo CD (Pull Model)';
        if (engineSub) engineSub.textContent = 'Pure Template Compiler Hat';
        if (step1Title) step1Title.textContent = 'Runs helm template offline';
        if (step1Desc) step1Desc.textContent = 'repo-server compiles values without talking to K8s or creating Helm release Secrets.';
        if (step2Title) step2Title.textContent = 'Kubernetes Server-Side Apply (SSA)';
        if (step2Desc) step2Desc.textContent = 'Application Controller syncs raw manifests and continuously watches for live drift.';
        if (engineBadge) {
          engineBadge.textContent = 'GITOPS EXCELLENCE: Zero cluster credentials in CI; continuous self-healing';
          engineBadge.style.color = '#3fb950';
          engineBadge.style.borderColor = 'rgba(35, 134, 54, 0.3)';
          engineBadge.style.background = 'rgba(35, 134, 54, 0.12)';
        }

        if (delivLedger) {
          delivLedger.innerHTML = '<span class="pill rev-none">No Secrets (sh.helm.release.* is skipped)</span>';
        }
        if (delivLedgerHint) delivLedgerHint.textContent = 'Running "helm list" prints zero releases! State is tracked in Argo Application CRD.';

        if (mRole) mRole.textContent = 'Template Compiler Only';
        if (mCreds) mCreds.textContent = 'Zero (Pull architecture)';
        if (mSecrets) mSecrets.textContent = 'None Created (Bypassed)';
        if (mDrift) mDrift.textContent = 'Automatic Self-Healing';

        if (isDrifting) {
          if (delivPods) {
            delivPods.innerHTML = '<span class="pod-count" style="color: #3fb950;">3 Running Pods</span><span class="pod-match" style="color: #3fb950;">✓ Self-Healed</span>';
          }
          if (driftCard) driftCard.style.borderColor = '#238636';
          if (driftTitle) {
            driftTitle.textContent = 'Drift Status: OUT-OF-SYNC → AUTO-HEALED';
            driftTitle.style.color = '#3fb950';
          }
          if (driftDesc) driftDesc.textContent = 'Engineer ran "kubectl edit" (5 replicas). Argo CD immediately detected OutOfSync and re-applied SSA, automatically forcing the cluster back to 3 replicas!';
        } else {
          if (delivPods) {
            delivPods.innerHTML = '<span class="pod-count" style="color: #3fb950;">3 Running Pods</span><span class="pod-match">Matches Git Declaration</span>';
          }
          if (driftCard) driftCard.style.borderColor = '#30363d';
          if (driftTitle) {
            driftTitle.textContent = 'Drift Status: SYNCED';
            driftTitle.style.color = '#3fb950';
          }
          if (driftDesc) driftDesc.textContent = 'Cluster matches Git. Argo CD is actively monitoring for drift.';
        }
      } else if (currentMode === 'flux') {
        if (engineTag) engineTag.textContent = 'IN-CLUSTER HELM OPERATOR';
        if (engineTitle) engineTitle.textContent = 'Flux CD (HelmRelease)';
        if (engineSub) engineSub.textContent = 'Native Helm SDK In-Cluster';
        if (step1Title) step1Title.textContent = 'source-controller pulls chart';
        if (step1Desc) step1Desc.textContent = 'Tracks Git repository or OCI artifact registry for new chart versions.';
        if (step2Title) step2Title.textContent = 'helm-controller runs Helm Go SDK';
        if (step2Desc) step2Desc.textContent = 'Executes full Helm lifecycle in-cluster, writing standard release Secrets.';
        if (engineBadge) {
          engineBadge.textContent = 'FULL LIFECYCLE: Standard Helm release secrets with automated drift reconciliation';
          engineBadge.style.color = '#79c0ff';
          engineBadge.style.borderColor = 'rgba(56, 139, 253, 0.3)';
          engineBadge.style.background = 'rgba(56, 139, 253, 0.12)';
        }

        if (delivLedger) {
          delivLedger.innerHTML = '<span class="pill rev-active">sh.helm.release.v1.payment-api.v3 (managed by flux)</span>';
        }
        if (delivLedgerHint) delivLedgerHint.textContent = '"helm list" works natively and shows the release managed by Flux.';

        if (mRole) mRole.textContent = 'Release Manager (In-Cluster SDK)';
        if (mCreds) mCreds.textContent = 'Zero (Pull architecture)';
        if (mSecrets) mSecrets.textContent = 'Created & Managed';
        if (mDrift) mDrift.textContent = 'Continuous Controller Sync';

        if (isDrifting) {
          if (delivPods) {
            delivPods.innerHTML = '<span class="pod-count" style="color: #3fb950;">3 Running Pods</span><span class="pod-match" style="color: #3fb950;">✓ Reconciled</span>';
          }
          if (driftCard) driftCard.style.borderColor = '#58a6ff';
          if (driftTitle) {
            driftTitle.textContent = 'Drift Status: RECONCILED BY FLUX';
            driftTitle.style.color = '#79c0ff';
          }
          if (driftDesc) driftDesc.textContent = 'Engineer ran "kubectl edit". Flux helm-controller detected drift and triggered an automated Helm reconciliation loop, reverting replicas back to 3.';
        } else {
          if (delivPods) {
            delivPods.innerHTML = '<span class="pod-count" style="color: #3fb950;">3 Running Pods</span><span class="pod-match">Matches Git Declaration</span>';
          }
          if (driftCard) driftCard.style.borderColor = '#30363d';
          if (driftTitle) {
            driftTitle.textContent = 'Drift Status: RECONCILED';
            driftTitle.style.color = '#3fb950';
          }
          if (driftDesc) driftDesc.textContent = 'Cluster matches Git. Flux HelmRelease is healthy.';
        }
      }
    };

    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        modeBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentMode = btn.dataset.delivMode || 'ci-push';
        updateDelivery();
      });
    });

    driftBtn?.addEventListener('click', () => {
      isDrifting = !isDrifting;
      driftBtn.classList.toggle('is-drifting', isDrifting);
      driftBtn.setAttribute('aria-pressed', isDrifting ? 'true' : 'false');
      if (driftText) {
        driftText.textContent = isDrifting ? 'Revert Outage Drift (replicas: 5 → 3)' : 'Inject "kubectl edit" (replicas: 3 → 5)';
      }
      updateDelivery();
    });
  }
}
