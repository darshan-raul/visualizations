# AGENTS.md

## Repository Overview

Static HTML visualization pages deployed on Vercel. No build system, no tests, no package manager.

## Deploy

Vercel auto-deploys from main branch. Configure via `vercel.json` (cleanUrls, cache headers, security headers).

## Files

- `index.html` — main landing page ("AWS Side Quests — Interactive Visualizations")
- Individual visualization pages: `secopspipeline.html`, `rds-backup-retention.html`, `oauth2-explainer.html`, `github-actions-cheatsheet.html`, `k8s-networking.html`
- Reference markdown files: `k8s-networking-outline.md` (outline), `k8s-networking-deep-dive.md` (detailed prose companion)

## Development

No dev server needed — edit HTML files directly. Open in browser to preview.

## Adding a New Visualization

### 1. Create the HTML file

Name it descriptively (e.g., `k8s-networking.html`, `vpc-flow.html`).

### 2. Follow the established pattern

Multi-tabbed explainers share a consistent structure:

- **Back button**: Fixed top-left, links to `index.html`
- **Header**: Badge + h1 + subtitle paragraph
- **Tab navigation**: Horizontal scrollable `.tabs` with `.tab-btn` elements, numbered 00, 01, etc.
- **Content area**: `.content` containing `.panel` divs (one per tab), all hidden except `.active`
- **showTab(n) JS function**: Sets `display: block` + `.active` class on selected panel/button
- **Footer**: Links to relevant docs

### 3. Design tokens (CSS variables)

```css
:root {
  --bg:          #0a0d14;
  --surface:     #111520;
  --surface2:    #161b28;
  --border:      rgba(255,255,255,.07);
  --accent:      #4f8ef7;
  --accent-cyan: #22d3ee;
  --accent-green:#34d399;
  --accent-amber:#fbbf24;
  --accent-red:  #f87171;
  --accent-purp: #a78bfa;
  --text:        #f0f4ff;
  --text-muted:  #8b9ab5;
  --text-dim:    #4a5568;
  --mono:        'JetBrains Mono', monospace;
  --sans:        'Inter', sans-serif;
  --radius:      14px;
}
```

### 4. Reusable CSS components

| Class | Purpose |
|-------|---------|
| `.section-label` | Uppercase label with trailing divider line |
| `.concept-grid` | Auto-fill grid of concept cards |
| `.concept-card` | Surface bg, border, top accent stripe (use `blue`/`green`/`red`/`yellow` modifier) |
| `.code-block` | Dark mono font code block with syntax coloring classes |
| `.warn-box` | Red-left-border alert box |
| `.ok-box` | Green-left-border info box |
| `.compare-table` | Full bordered table for comparisons |
| `.flow-container` | Surface bg container for step flows |
| `.tab-btn .tab-num` | Mono font, muted, numbered tab prefix |

### 5. Add card to index.html

Add a new `.viz-card` entry in the `.cards-grid` before the "Coming Soon" placeholder card:

```html
<a class="viz-card theme-cyan" href="./k8s-networking.html" id="card-k8s">
  <div class="card-glow"></div>
  <div class="card-strip"></div>
  <div class="card-body">
    <div class="card-tags">
      <span class="tag tag-primary">Kubernetes</span>
      <span class="tag tag-secondary">Networking</span>
    </div>
    <div class="card-icon">☸</div>
    <div class="card-title">K8s Networking</div>
    <div class="card-desc">Deep dive into pod networking, CNI, kube-proxy, CoreDNS, and more.</div>
    <div class="card-footer">
      <div class="card-meta">
        <span class="meta-item">13 tabs</span>
      </div>
      <span class="card-arrow">→</span>
    </div>
  </div>
</a>
```

### 6. Companion markdown files

When building a complex visualization, consider creating:
- `*-outline.md` — the outline/spec for what content goes in each tab
- `*-deep-dive.md` — detailed explanatory prose (used as reference, not displayed in HTML)


## Architecture Notes

- Each visualization is a self-contained HTML file (CSS + HTML + JS in one file)
- Tab count varies by content complexity (oauth2: 5 tabs, k8s-networking: 12 tabs)
- Back button uses `.back-btn` class with fixed positioning at top-left
- No external JS dependencies — Google Fonts only via CDN