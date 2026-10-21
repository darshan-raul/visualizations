# DevSecOps Pipeline — Visual Specification

- **Topic:** DevSecOps Delivery Pipeline, DevOps & SRE. Route `/secopspipeline`.
- **Status/version:** v1.0, directly integrated console migration, 2026-10-22 (no prototype requested by user).
- **Collection / route:** DevOps & SRE · Flow Explorer · `/secopspipeline`.
- **Audience:** Developers, DevOps, and Platform Engineers building CI/CD pipelines, container supply chains, and deployment gates.
- **Promise:** Trace an application change from pull request through SAST, build once digest pinning, keyless Sigstore Cosign signing, staging canary, DAST, manual environment promotion, production rollout, and automated failure rollback.
- **Persistent scenario:** Microservice `payment-gateway` (`commit 7f2c8a1`) modifying API endpoints and package dependencies. The workflow builds one immutable container image (`sha256:d4e891b...`), attaches SBOM + SLSA provenance, signs the digest using GitHub Actions OIDC identity, verifies the signature before each deployment, and rolls out via Argo Rollouts canary on Amazon EKS.
- **Canonical sources:** `src/components/secops/`, `src/content/topics/secopspipeline.mdx`, `src/pages/secopspipeline.astro`.

---

## Visual Grammar & Semantics

| Meaning | Treatment | Semantic token |
|---|---|---|
| Normal execution / Active infrastructure | Cyan solid border and accent | `var(--accent)` (`#58a6ff`) |
| Passed check / Verified signature / Healthy rollout | Green accent and badge | `var(--accent2)` (`#3fb950`) |
| Warning / Waiting / Approval gate / In-progress | Amber accent and badge | `var(--yellow)` (`#d29922`) |
| Failed check / Quarantined artifact / Rollback | Red accent, danger badge | `var(--warn)` (`#f85149`) |
| Policy, Cryptographic Identity, Attestation | Purple accent | `var(--purple)` (`#bc8cff`) |
| Inactive / Background step | Muted border and text | `var(--border)` / `var(--muted)` |

Color is never the sole indicator of state: all steps, gates, and statuses feature explicit icons (✓, ✕, 🔒, ⏸, ↩), text badges, and readable explanations.

---

## Narrative Structure: Ten Views in Four Groups

Views are organized by concept in the persistent console's disclosure index:

1. **Shift-Left Gates (PR & Source)**
   - **View 01 (`#dep-review`):** *Dependency Review on PR* — Scan package manifest diffs, reject high/critical CVEs before merge.
   - **View 02 (`#code-quality`):** *Code Quality & Secrets* — Git history secret scanning (Gitleaks), AST security analysis (CodeQL), rule-based SAST (Semgrep), linting.

2. **Supply Chain Integrity (Build & Sign)**
   - **View 03 (`#build-once`):** *Build Once, Digest Pinning* — Build single OCI image, compute immutable sha256 digest, why tag mutation (`:latest`) enables supply chain attacks.
   - **View 04 (`#attest-sign`):** *Vulnerability Scan & Keyless Signing* — Trivy container vulnerability gate, SARIF upload, Sigstore Cosign keyless signing via GitHub Actions OIDC (Fulcio + Rekor).

3. **Staged Progressive Delivery (Environment Gates)**
   - **View 05 (`#deploy-staging`):** *Staging Deploy & Verification* — Cryptographic `cosign verify` (verifying both OIDC issuer and repository identity), Helm deployment to EKS, Argo Rollouts baseline.
   - **View 06 (`#dast-staging`):** *Dynamic Application Security Testing (DAST)* — OWASP ZAP baseline scan against live staging endpoints; contrast SAST vs DAST coverage.
   - **View 07 (`#promote-gate`):** *Manual Promotion Gate* — GitHub Environment protection rules, required reviewer signoff, timeout windows, and immutable audit trail.

4. **Production Operations & Reference**
   - **View 08 (`#deploy-prod`):** *Production Canary Rollout* — Deploy exact same byte-for-byte digest, 10% -> 50% -> 100% progressive traffic shift with analysis metrics.
   - **View 09 (`#rollback-prod`):** *Automated Production Rollback* — Detect health check failure, instant `argo rollouts undo`, preserving forensic artifacts.
   - **View 10 (`#security-matrix`):** *Security Controls & Production Workflow* — Interactive control map, IAM OIDC trust configuration, and copyable, corrected GitHub Actions workflow.

---

## Legacy Fragment Aliases

All fragments from the legacy `secopspipeline.html` are preserved:
- `#tab-flow` → `#dep-review`
- `#tab-jobs` → `#security-matrix`
- `#tab-security` → `#security-matrix`
- `#tab-design` → `#build-once`
- `#tab-config` → `#security-matrix`
- `#tab-code` → `#security-matrix`
- `#dep-review` → `#dep-review`
- `#code-quality` → `#code-quality`
- `#build` → `#build-once`
- `#scan-sign` → `#attest-sign`
- `#deploy-staging` → `#deploy-staging`
- `#dast-staging` → `#dast-staging`
- `#promote` → `#promote-gate`
- `#deploy-prod` → `#deploy-prod`
- `#rollback-prod` → `#rollback-prod`

---

## Technical Corrections from Legacy Prototype

1. **Strict Cosign Verification:**
   - Previous code omitted `--certificate-identity`.
   - Corrected to require both `--certificate-oidc-issuer=https://token.actions.githubusercontent.com` and `--certificate-identity-regexp=^https://github.com/my-org/my-app/.*$`.
2. **Scoping GitHub Actions Permissions:**
   - Replaced hazardous global `id-token: write` with granular per-job least-privilege tokens.
3. **PR Gating:**
   - Clearly models PR checks running on Pull Requests before merging to `main`.
4. **Concurrency Safety:**
   - Canceling in-progress workflows is scoped away from live deployments so in-flight Helm/Argo releases cannot be killed in undefined states.
5. **Tooling Modernization:**
   - Replaced deprecated actions and invalid reusable workflow assumptions with modern GitHub Actions composite action patterns.

---

## Verification & Accessibility Requirements

- Validated HTML without invalid nesting.
- Keyboard navigation (tabindex, focus visible, Enter/Space activation on interactive gates).
- Touch target sizing >= 44px on all interactive controls.
- Full responsive fidelity from 320px to 1440px without unwanted horizontal document overflow.
- Progressive enhancement: When JavaScript is disabled, all 10 views and their corresponding explanations, code snippets, and tables render in full narrative order.
- Passes `npm run build`, `npm run check:graph`, and `npm run check:links`.
