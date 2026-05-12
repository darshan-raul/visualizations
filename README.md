# Interactive Visualizations

Deep-dive, interactive explainers for devops and cloud concepts — how it actually works under the hood.

No build system. No tests. Pure HTML/CSS/JS, deployed automatically on Vercel from the main branch.

---

## Available Visualizations

| | Name | Topics |
|---|------|--------|
| 🗄️ | [RDS Backup Retention](./rds-backup-retention.html) | EBS snapshots, block reference counting, PITR |
| 🔐 | [OAuth 2.0 & OIDC Flows](./oauth2-explainer.html) | Authorization Code, PKCE, JWT decoder |
| ⚙️ | [GitHub Actions Cheatsheet](./github-actions-cheatsheet.html) | Workflows, triggers, secrets, matrix builds |
| 🛡️ | [DevSecOps Pipeline](./secopspipeline.html) | Gitleaks, Trivy, Cosign, canary deploys |
| ☸️ | [Kubernetes Networking](./k8s-networking.html) | CNI, veth, VXLAN, kube-proxy, CoreDNS, Ingress |

---

## Adding a New Visualization

Create a new HTML file and follow the [AGENTS.md](./AGENTS.md) guide for the established pattern — back button, tab navigation, design tokens, reusable CSS components.

Add a card to `index.html` and assign a color theme (`.theme-blue`, `.theme-cyan`, `.theme-green`, `.theme-amber`, `.theme-purp`, etc.).

---

## Development

No dev server needed. Open any HTML file directly in a browser to preview.

---

## Deploy

Vercel auto-deploys from the main branch. Configure via `vercel.json`.