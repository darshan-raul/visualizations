export interface SecopsStep {
  id: string;
  aliases: string[];
  group: string;
  label: string;
  title: string;
  intro: string;
  explanation: string;
  takeaway: string;
  caveat: string;
  phase: 'pr' | 'ci' | 'staging' | 'prod';
  actor: string;
  tool: string;
  blocksOnFailure: boolean;
  codes: { title: string; language: string; text: string }[];
  sources: number[];
}

export const groups = [
  'Shift-left PR gates',
  'Supply chain & signing',
  'Progressive staging delivery',
  'Production canary & reference',
] as const;

export const sources = [
  { label: 'GitHub Docs: Security hardening for GitHub Actions', url: 'https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect' },
  { label: 'Sigstore Cosign: Keyless signatures with OIDC', url: 'https://docs.sigstore.dev/cosign/signing/overview/' },
  { label: 'SLSA: Supply-chain Levels for Software Artifacts', url: 'https://slsa.dev/spec/v1.0/about' },
  { label: 'Aqua Security: Trivy Container Vulnerability Scanner', url: 'https://aquasecurity.github.io/trivy/latest/' },
  { label: 'OWASP ZAP: Baseline Scan Documentation', url: 'https://www.zaproxy.org/docs/docker/baseline-scan/' },
  { label: 'Argo Rollouts: Canary Deployment & Automated Rollback', url: 'https://argoproj.github.io/argo-rollouts/features/canary/' },
  { label: 'AWS Security: OIDC federation with IAM Identity Providers', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html' },
  { label: 'GitHub dependency-review-action', url: 'https://github.com/actions/dependency-review-action' },
] as const;

export const steps: SecopsStep[] = [
  {
    id: 'dep-review',
    aliases: ['dependency-review', 'tab-flow'],
    group: 'Shift-left PR gates',
    label: 'PR Dependency Review',
    title: 'Block Vulnerable Dependencies at Pull Request Time',
    intro: 'Before any code is merged into the default branch, inspect lockfile diffs against known vulnerability advisories.',
    explanation: 'The pull request is the cheapest place to catch vulnerable open source dependencies. When a PR alters package.json, go.mod, or requirements.txt, dependency-review-action parses the dependency diff and checks the GitHub Advisory Database. If an introduced package has a HIGH or CRITICAL CVE, the PR check turns red and branch protection blocks the merge. No code builds, and no container is generated.',
    takeaway: 'Stop vulnerable third-party code before it ever reaches main; fixing a dependency in a PR takes minutes, while remediating it in production requires an emergency patch.',
    caveat: 'Dependency review only checks changes introduced in the current PR. Scheduled repository scans (such as Dependabot alerts) are still required to detect zero-day CVEs published in previously merged dependencies.',
    phase: 'pr',
    actor: 'GitHub Actions / Advisory DB',
    tool: 'actions/dependency-review-action@v4',
    blocksOnFailure: true,
    codes: [
      {
        title: '.github/workflows/secops.yml (PR trigger)',
        language: 'yaml',
        text: `dependency-review:
  name: Dependency Review
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - uses: actions/dependency-review-action@v4
      with:
        fail-on-severity: high
        deny-licenses: GPL-3.0, AGPL-3.0`,
      },
    ],
    sources: [0, 7],
  },
  {
    id: 'code-quality',
    aliases: ['sast', 'secrets'],
    group: 'Shift-left PR gates',
    label: 'Secrets & SAST Scanning',
    title: 'Static Application Security Testing and Secret Leak Prevention',
    intro: 'Scan full git history for leaked credentials, run AST data-flow analysis, and evaluate OWASP Top 10 security rules.',
    explanation: 'Static analysis evaluates code without executing it. Gitleaks inspects git commit history with regexes and entropy calculations to prevent AWS keys or database tokens from being committed. CodeQL compiles the codebase into an Abstract Syntax Tree (AST) database to trace untrusted user input into dangerous sinks (SQL injection, XSS). Semgrep executes lightweight semantic pattern matching for OWASP Top 10 violations. Together, they establish a high-confidence code quality gate.',
    takeaway: 'Secrets committed to git history must be treated as permanently compromised even if the commit is amended; catch them pre-commit or in the initial CI gate.',
    caveat: 'Static analyzers cannot detect runtime authorization logic flaws or environment misconfigurations. High-velocity teams must tune rules to prevent alert fatigue from false positives.',
    phase: 'ci',
    actor: 'Gitleaks + CodeQL + Semgrep',
    tool: 'gitleaks-action / codeql-action / semgrep',
    blocksOnFailure: true,
    codes: [
      {
        title: 'Static analysis job definition',
        language: 'yaml',
        text: `code-quality:
  name: Static Code Quality & Security
  runs-on: ubuntu-latest
  permissions:
    security-events: write
    contents: read
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0 # Full history needed for secret scan
    - uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    - uses: github/codeql-action/init@v3
      with:
        languages: auto
    - uses: github/codeql-action/autobuild@v3
    - uses: github/codeql-action/analyze@v3
      with:
        category: codeql-source
    - run: semgrep ci --config=auto
      env:
        SEMGREP_APP_TOKEN: \${{ secrets.SEMGREP_APP_TOKEN }}`,
      },
    ],
    sources: [0],
  },
  {
    id: 'build-once',
    aliases: ['build', 'tab-design', 'digest-pinning'],
    group: 'Supply chain & signing',
    label: 'Build Once & Digest Pinning',
    title: 'Generate an Immutable sha256 Manifest and SBOM',
    intro: 'Build the container image once, capture the cryptographic digest, and attach software bill of materials and SLSA provenance.',
    explanation: 'A fundamental rule of continuous delivery is "Build Once, Deploy Everywhere". Rebuilding an image for staging and rebuilding again for production introduces subtle drift: upstream base images change, package mirrors update, and build timestamps vary. Instead, BuildKit builds the container image exactly once, generates an immutable sha256 manifest digest, and packages an SPDX Software Bill of Materials (SBOM) and SLSA Level 3 provenance attestation.',
    takeaway: 'Mutable tags like :latest or :main can be overwritten; an immutable digest sha256:... guarantees the exact byte-for-byte image tested in staging is what runs in production.',
    caveat: 'Attestations increase registry payload size and require an OCI v1.1 compliant registry (such as Amazon ECR or GitHub Packages) that supports artifact references and referrer APIs.',
    phase: 'ci',
    actor: 'Docker Buildx / Amazon ECR',
    tool: 'docker/build-push-action@v6',
    blocksOnFailure: true,
    codes: [
      {
        title: 'Build and push with provenance outputs',
        language: 'yaml',
        text: `build:
  name: Build & Attest Image
  runs-on: ubuntu-latest
  needs: code-quality
  outputs:
    digest: \${{ steps.build.outputs.digest }}
  steps:
    - uses: actions/checkout@v4
    - uses: docker/setup-buildx-action@v3
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-ecr
        aws-region: \${{ env.AWS_REGION }}
    - uses: aws-actions/amazon-ecr-login@v2
    - id: build
      uses: docker/build-push-action@v6
      with:
        context: .
        push: true
        tags: \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
        provenance: mode=max
        sbom: true
        cache-from: type=gha
        cache-to: type=gha,mode=max`,
      },
    ],
    sources: [0, 2],
  },
  {
    id: 'attest-sign',
    aliases: ['scan-sign', 'cosign', 'sbom'],
    group: 'Supply chain & signing',
    label: 'Vulnerability Scan & Sign',
    title: 'Trivy CVE Enforcement and Keyless Sigstore Cosign Signing',
    intro: 'Scan the built OCI digest for OS/library vulnerabilities, then sign it using GitHub Actions OIDC identity without long-lived keys.',
    explanation: 'The built image digest is pulled and scanned with Trivy. If any HIGH or CRITICAL severity vulnerabilities are discovered with an available fix, the pipeline terminates immediately with an exit code 1 and uploads a SARIF report to GitHub Security. Once clear, the runner requests a short-lived OIDC token from GitHub. Sigstore Fulcio validates the runner claims (repo, workflow, commit) and mints an ephemeral x509 certificate. Cosign signs the container digest, and Rekor records the signature in an immutable, publicly verifiable transparency log.',
    takeaway: 'Keyless signing replaces fragile, leakable GPG or static private keys with cryptographic identity certificates bound to your GitHub workflow and commit SHA.',
    caveat: 'Keyless signing relies on the public Sigstore infrastructure (Fulcio and Rekor). Air-gapped enterprises must run private Sigstore instances or use KMS-backed Cosign keys.',
    phase: 'ci',
    actor: 'Trivy + Sigstore Cosign (OIDC)',
    tool: 'aquasecurity/trivy-action + sigstore/cosign',
    blocksOnFailure: true,
    codes: [
      {
        title: 'Trivy gate and keyless Cosign signing',
        language: 'yaml',
        text: `scan-sign:
  name: Scan CVEs & Keyless Sign
  runs-on: ubuntu-latest
  needs: build
  permissions:
    id-token: write      # Required for Sigstore OIDC keyless signing
    security-events: write
    contents: read
  steps:
    - uses: sigstore/cosign-installer@v3
    - uses: aquasecurity/trivy-action@0.28.0
      with:
        image-ref: \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}@\${{ needs.build.outputs.digest }}
        severity: CRITICAL,HIGH
        exit-code: '1'
        ignore-unfixed: true
    - name: Sign OCI Digest with GitHub OIDC
      run: |
        cosign sign --yes \\
          \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}@\${{ needs.build.outputs.digest }}`,
      },
    ],
    sources: [1, 3],
  },
  {
    id: 'deploy-staging',
    aliases: ['cosign-verify'],
    group: 'Progressive staging delivery',
    label: 'Staging Deploy & Verification',
    title: 'Cryptographic Cosign Verification Before Cluster Admission',
    intro: 'Verify the container signature against repository identity before deploying to the Staging Amazon EKS cluster via Helm and Argo Rollouts.',
    explanation: 'Before applying changes to staging, the deployment runner executes `cosign verify`. Crucially, it does not just verify that a signature exists: it validates that the signing certificate was issued by GitHub Actions OIDC AND that the certificate identity matches the repository and workflow name. This prevents an attacker who compromised another GitHub repo from signing an image and pushing it to your registry. Once verified, Helm deploys the Rollout resource with the pinned digest.',
    takeaway: 'Verification must constrain both the OIDC issuer AND the repository identity; verifying only the issuer allows any GitHub user in the world to sign images that your cluster accepts.',
    caveat: 'Client-side verification in CI helps catch bad images early, but admission controllers (like Kyverno or Sigstore Policy Controller) inside the cluster provide true enforcement against manual kubectl bypasses.',
    phase: 'staging',
    actor: 'Cosign Verify + Helm + Argo Rollouts',
    tool: 'sigstore/cosign + helm + kubectl-argo-rollouts',
    blocksOnFailure: true,
    codes: [
      {
        title: 'Strict Cosign verification step',
        language: 'yaml',
        text: `deploy-staging:
  name: Deploy Staging
  runs-on: ubuntu-latest
  needs: scan-sign
  environment:
    name: staging
    url: https://staging.payment.example.com
  steps:
    - uses: sigstore/cosign-installer@v3
    - name: Verify Signature & Identity
      run: |
        cosign verify \\
          --certificate-oidc-issuer=https://token.actions.githubusercontent.com \\
          --certificate-identity-regexp="^https://github.com/my-org/payment-gateway/\\.github/workflows/secops\\.yml@.*" \\
          \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}@\${{ needs.build.outputs.digest }}
    - name: Helm Upgrade (Pinned Digest)
      run: |
        helm upgrade --install payment ./helm/payment-gateway \\
          --namespace staging \\
          --set image.digest=\${{ needs.build.outputs.digest }}`,
      },
    ],
    sources: [1, 5, 6],
  },
  {
    id: 'dast-staging',
    aliases: ['owasp-zap'],
    group: 'Progressive staging delivery',
    label: 'DAST Runtime Scanning',
    title: 'Dynamic Application Security Testing Against Live Staging Endpoints',
    intro: 'Execute OWASP ZAP baseline vulnerability attacks against the running staging workload to detect runtime configuration flaws.',
    explanation: 'While SAST scans source code files, DAST analyzes the running application from an external attacker perspective. OWASP ZAP exercises the live staging URL, inspecting HTTP response headers, CORS configuration, missing Content-Security-Policy (CSP), cookie security flags (Secure, HttpOnly, SameSite), open redirect vectors, and directory traversals. Any high-risk finding immediately blocks the staging pipeline before promotion to production can even be considered.',
    takeaway: 'DAST catches runtime environment defects—like exposed debug headers or misconfigured CORS—that never appear inside source code repositories.',
    caveat: 'Automated DAST baseline scans only crawl unauthenticated endpoints unless authenticated cookies/tokens are configured; deeper API fuzzing requires OpenAPI schema specifications.',
    phase: 'staging',
    actor: 'OWASP ZAP',
    tool: 'zaproxy/action-baseline@v0.14.0',
    blocksOnFailure: true,
    codes: [
      {
        title: 'OWASP ZAP baseline scanning step',
        language: 'yaml',
        text: `dast-staging:
  name: DAST Staging Scan
  runs-on: ubuntu-latest
  needs: deploy-staging
  steps:
    - name: OWASP ZAP Baseline Scan
      uses: zaproxy/action-baseline@v0.14.0
      with:
        target: https://staging.payment.example.com
        fail_action: true
        allow_issue_writing: false
        ruleset: zap-baseline.rules`,
      },
    ],
    sources: [4],
  },
  {
    id: 'promote-gate',
    aliases: ['promote', 'approval-gate'],
    group: 'Progressive staging delivery',
    label: 'Manual Promotion Gate',
    title: 'Environment Protection Rules and Required Reviewer Sign-Off',
    intro: 'Pause delivery before production deployment, requiring authorization from designated security and lead reviewers.',
    explanation: 'Automated gates verify that tests pass and CVEs are absent, but business and operational risk often requires human oversight. GitHub Environment protection rules halt the workflow at the `promote` job. Designated approvers receive notifications with links to the staging DAST results, Trivy SARIF reports, and rollout status. If approved within the configured timeout window, the pipeline triggers production deployment; if rejected or timed out, the run stops cleanly.',
    takeaway: 'Separation of duties requires that the author of a commit cannot be the sole approver of its production promotion.',
    caveat: 'Avoid using environment approval gates as a substitute for automated tests; manual reviewers cannot reliably spot memory leaks or security vulnerabilities by eye.',
    phase: 'staging',
    actor: 'GitHub Environment Approvers',
    tool: 'GitHub Environments / Protection Rules',
    blocksOnFailure: true,
    codes: [
      {
        title: 'Environment promotion gate job',
        language: 'yaml',
        text: `promote:
  name: Production Promotion Gate
  runs-on: ubuntu-latest
  needs: dast-staging
  timeout-minutes: 60
  environment:
    name: production # Requires manual approval in repo settings
  steps:
    - name: Gate Cleared
      run: |
        echo "Production deployment approved by authorized reviewer at \$(date -u)"`,
      },
    ],
    sources: [0],
  },
  {
    id: 'deploy-prod',
    aliases: ['canary-rollout'],
    group: 'Production canary & reference',
    label: 'Production Canary Rollout',
    title: 'Progressive Traffic Shifting with Real-Time Metric Analysis',
    intro: 'Deploy the identical verified digest to production, routing 10% then 50% of user traffic while evaluating latency and HTTP error rates.',
    explanation: 'Production deployment deploys the exact same sha256 digest verified during staging. Instead of an all-at-once replacement, Argo Rollouts shifts 10% of incoming production traffic to the new ReplicaSet (canary) while keeping 90% on the stable version. Prometheus or Datadog AnalysisTemplates monitor p99 latency and HTTP 5xx error rates for 15 minutes. If metrics remain healthy, traffic scales to 50% and finally 100%, decommissioning the old pods safely.',
    takeaway: 'Canaries limit the blast radius of unexpected production bugs to a small percentage of users, giving automated monitors time to catch regressions.',
    caveat: 'Canary deployments require backward-compatible database schemas and idempotent APIs, as both old and new container versions run concurrently during the rollout.',
    phase: 'prod',
    actor: 'Argo Rollouts + Prometheus',
    tool: 'kubectl argo rollouts',
    blocksOnFailure: true,
    codes: [
      {
        title: 'Production rollout deployment step',
        language: 'yaml',
        text: `deploy-prod:
  name: Deploy Production Canary
  runs-on: ubuntu-latest
  needs: [promote, scan-sign]
  environment:
    name: production
    url: https://payment.example.com
  steps:
    - uses: sigstore/cosign-installer@v3
    - name: Verify Digest Signature in Production
      run: |
        cosign verify \\
          --certificate-oidc-issuer=https://token.actions.githubusercontent.com \\
          --certificate-identity-regexp="^https://github.com/my-org/payment-gateway/.*" \\
          \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}@\${{ needs.build.outputs.digest }}
    - name: Apply Helm Release
      run: |
        helm upgrade --install payment ./helm/payment-gateway \\
          --namespace production \\
          --set image.digest=\${{ needs.build.outputs.digest }}
    - name: Watch Argo Canary Rollout
      run: |
        kubectl argo rollouts status payment -n production --timeout 15m`,
      },
    ],
    sources: [5],
  },
  {
    id: 'rollback-prod',
    aliases: ['undo-rollback'],
    group: 'Production canary & reference',
    label: 'Automated Failure Rollback',
    title: 'Instant Traffic Reversal via argo rollouts undo',
    intro: 'If health checks fail or an unhandled exception spikes errors during canary analysis, immediately restore traffic to the stable version.',
    explanation: 'When a canary rollout fails analysis (e.g. error rate exceeds 1% or the container crashes in production), the GitHub Actions job fails. The `rollback-prod` job runs with `if: failure()`. It triggers `kubectl argo rollouts undo payment -n production`, instructing the service router (ALB, NGINX, or Envoy) to instantly redirect 100% of traffic back to the proven stable ReplicaSet. It preserves logs and diagnostic events in GitHub Step Summaries.',
    takeaway: 'Automated rollback minimizes Mean Time to Recovery (MTTR) by eliminating the minutes wasted waiting for on-call engineers to wake up and click buttons.',
    caveat: 'Rollback cannot undo destructive database migrations. Schema changes must always remain backward-compatible with the previous application version.',
    phase: 'prod',
    actor: 'Argo Rollouts Controller',
    tool: 'kubectl argo rollouts undo',
    blocksOnFailure: false,
    codes: [
      {
        title: 'Automated failure rollback handler',
        language: 'yaml',
        text: `rollback-prod:
  name: Emergency Rollback
  runs-on: ubuntu-latest
  needs: deploy-prod
  if: failure()
  environment:
    name: production
  steps:
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-eks-prod
        aws-region: \${{ env.AWS_REGION }}
    - name: Execute Rollout Undo
      run: |
        echo "::error::Production Canary failed! Initiating rollback..."
        kubectl argo rollouts undo payment -n production
        kubectl argo rollouts status payment -n production --timeout 5m`,
      },
    ],
    sources: [5],
  },
  {
    id: 'security-matrix',
    aliases: ['tab-jobs', 'tab-security', 'tab-config', 'tab-code'],
    group: 'Production canary & reference',
    label: 'Controls Matrix & Full Workflow',
    title: 'End-to-End Security Controls, IAM Roles, and Complete YAML Source',
    intro: 'Inspect the complete matrix of security controls, least-privilege AWS IAM OIDC roles, and the verified production GitHub Actions workflow.',
    explanation: 'Defense in depth requires matching every security control to the specific threat vector it mitigates. This operational reference compares all tools (Gitleaks, CodeQL, Semgrep, Trivy, Cosign, OWASP ZAP, Argo Rollouts), defines the scoped IAM role trust policies using GitHub OIDC federation, and provides the complete, production-ready GitHub Actions YAML without hardcoded credentials.',
    takeaway: 'No single security tool provides complete protection; true DevSecOps combines static code checks, supply chain provenance, dynamic runtime testing, and progressive deployment safeguards.',
    caveat: 'Copying workflow YAML without properly configuring GitHub repository secret variables and AWS IAM OIDC federation will cause authentication failure.',
    phase: 'ci',
    actor: 'Security Architect / Platform Team',
    tool: 'Complete Reference Architecture',
    blocksOnFailure: true,
    codes: [
      {
        title: '.github/workflows/secops.yml (Complete production pipeline)',
        language: 'yaml',
        text: `name: DevSecOps Production Pipeline

on:
  push:
    branches: [main]
    tags: ['v*.*.*']
  pull_request:
    branches: [main]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }} # Never cancel live deployments

permissions:
  contents: read

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: \${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  IMAGE_NAME: payment-gateway

jobs:
  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high

  code-quality:
    name: Code Quality & Secrets
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    permissions:
      security-events: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      - uses: github/codeql-action/init@v3
        with:
          languages: auto
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
        with:
          category: codeql-source
      - run: npx semgrep ci --config=p/owasp-top-ten

  build:
    name: Build Once (Digest Pinning)
    runs-on: ubuntu-latest
    needs: code-quality
    if: github.event_name == 'push'
    permissions:
      id-token: write
      contents: read
    outputs:
      digest: \${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-ecr
          aws-region: \${{ env.AWS_REGION }}
      - uses: aws-actions/amazon-ecr-login@v2
      - id: build
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
          provenance: mode=max
          sbom: true
          cache-from: type=gha
          cache-to: type=gha,mode=max

  scan-sign:
    name: Scan & Sign
    runs-on: ubuntu-latest
    needs: build
    permissions:
      id-token: write
      security-events: write
      contents: read
    steps:
      - uses: sigstore/cosign-installer@v3
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-ecr
          aws-region: \${{ env.AWS_REGION }}
      - uses: aws-actions/amazon-ecr-login@v2
      - uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}@\${{ needs.build.outputs.digest }}
          severity: CRITICAL,HIGH
          exit-code: '1'
      - name: Keyless Sign with Cosign OIDC
        run: |
          cosign sign --yes \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}@\${{ needs.build.outputs.digest }}

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: scan-sign
    environment:
      name: staging
      url: https://staging.payment.example.com
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: sigstore/cosign-installer@v3
      - uses: azure/setup-kubectl@v4
      - uses: azure/setup-helm@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-eks-staging
          aws-region: \${{ env.AWS_REGION }}
      - name: Verify Signature & Identity
        run: |
          cosign verify \\
            --certificate-oidc-issuer=https://token.actions.githubusercontent.com \\
            --certificate-identity-regexp="^https://github.com/\${{ github.repository }}/.*" \\
            \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}@\${{ needs.build.outputs.digest }}
      - name: Helm Upgrade Canary
        run: |
          aws eks update-kubeconfig --name staging-cluster
          helm upgrade --install payment ./helm/payment-gateway -n staging --set image.digest=\${{ needs.build.outputs.digest }}

  dast-staging:
    name: DAST Staging Scan
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: zaproxy/action-baseline@v0.14.0
        with:
          target: https://staging.payment.example.com
          fail_action: true

  promote:
    name: Approval Gate
    runs-on: ubuntu-latest
    needs: dast-staging
    timeout-minutes: 60
    environment:
      name: production
    steps:
      - run: echo "Promoting to production"

  deploy-prod:
    name: Deploy Production Canary
    runs-on: ubuntu-latest
    needs: [promote, scan-sign]
    environment:
      name: production
      url: https://payment.example.com
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: sigstore/cosign-installer@v3
      - uses: azure/setup-kubectl@v4
      - uses: azure/setup-helm@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-eks-prod
          aws-region: \${{ env.AWS_REGION }}
      - name: Verify Exact Digest
        run: |
          cosign verify \\
            --certificate-oidc-issuer=https://token.actions.githubusercontent.com \\
            --certificate-identity-regexp="^https://github.com/\${{ github.repository }}/.*" \\
            \${{ env.ECR_REGISTRY }}/\${{ env.IMAGE_NAME }}@\${{ needs.build.outputs.digest }}
      - name: Helm Upgrade Production
        run: |
          aws eks update-kubeconfig --name prod-cluster
          helm upgrade --install payment ./helm/payment-gateway -n production --set image.digest=\${{ needs.build.outputs.digest }}

  rollback-prod:
    name: Auto Rollback on Failure
    runs-on: ubuntu-latest
    needs: deploy-prod
    if: failure()
    environment:
      name: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-eks-prod
          aws-region: \${{ env.AWS_REGION }}
      - name: Undo Rollout
        run: |
          aws eks update-kubeconfig --name prod-cluster
          kubectl argo rollouts undo payment -n production`,
      },
      {
        title: 'AWS IAM OIDC Role Trust Policy (Least Privilege)',
        language: 'json',
        text: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:my-org/payment-gateway:ref:refs/heads/main"
        }
      }
    }
  ]
}`,
      },
    ],
    sources: [0, 1, 2, 3, 4, 5, 6],
  },
];

export const securityControls = [
  { control: 'Dependency SCA (lockfile diffs)', tool: 'actions/dependency-review-action@v4', stage: 'PR Gate', blocks: 'Yes (HIGH/CRIT)', output: 'PR Check Status' },
  { control: 'Secrets in Git History', tool: 'Gitleaks', stage: 'Code Quality', blocks: 'Yes', output: 'Job Termination + Error' },
  { control: 'SAST (AST Data-flow)', tool: 'GitHub CodeQL', stage: 'Code Quality', blocks: 'Yes', output: 'SARIF report → Security Tab' },
  { control: 'SAST (OWASP Top 10)', tool: 'Semgrep', stage: 'Code Quality', blocks: 'Yes', output: 'JUnit / Console findings' },
  { control: 'Container Base & Package CVEs', tool: 'Aqua Security Trivy', stage: 'Scan & Sign', blocks: 'Yes (CRITICAL,HIGH)', output: 'SARIF + Pipeline Exit 1' },
  { control: 'Supply Chain SBOM & Provenance', tool: 'Docker BuildKit (Buildx)', stage: 'Build Once', blocks: 'Attestation', output: 'In-toto OCI Attestation Layer' },
  { control: 'Cryptographic Supply Chain Signing', tool: 'Sigstore Cosign (OIDC)', stage: 'Scan & Sign', blocks: 'Yes (Signs digest)', output: 'Rekor Transparency Entry + Sig' },
  { control: 'Pre-Deployment Signature Check', tool: 'Cosign verify (Identity & Issuer)', stage: 'Staging & Prod', blocks: 'Yes', output: 'Cluster Gate Verification' },
  { control: 'DAST Runtime Dynamic Testing', tool: 'OWASP ZAP Baseline', stage: 'Staging Post-Deploy', blocks: 'Yes', output: 'ZAP Report + PR Warnings' },
  { control: 'Manual Production Gate', tool: 'GitHub Environment Rules', stage: 'Promote', blocks: 'Yes', output: 'Immutable Reviewer Audit Log' },
  { control: 'Progressive Canary & Auto-Undo', tool: 'Argo Rollouts', stage: 'Deploy Prod', blocks: 'Auto-Rollback', output: 'Traffic Shift Reversal' },
];

export const iamRoles = [
  { role: 'github-actions-ecr', jobs: 'build, scan-sign', scope: 'ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability, ecr:PutImage, ecr:InitiateLayerUpload' },
  { role: 'github-actions-eks-staging', jobs: 'deploy-staging', scope: 'eks:DescribeCluster, scoped RBAC on staging namespace' },
  { role: 'github-actions-eks-prod', jobs: 'deploy-prod, rollback-prod', scope: 'eks:DescribeCluster, scoped RBAC on production namespace' },
];
