# AGENTS.md

## Repository Overview

Static HTML visualization pages deployed on Vercel. No build system, no tests, no package manager.

## Deploy

Vercel auto-deploys from main branch. Configure via `vercel.json` (cleanUrls, cache headers, security headers).

## Files

- `index.html` — main landing page ("AWS Side Quests — Interactive Visualizations")
- Individual visualization pages listed in index.html cards

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
```

### 4. Reusable CSS components

| Class | Purpose |
|-------|---------|
| `.section-label` | Uppercase label with trailing divider line |
| `.concept-grid` | Auto-fill grid of concept cards |
| `.concept-card` | Surface bg, border, top accent stripe (use `cyan`/`green`/`amber`/`red`/`purp` modifier) |
| `.code-block` | Dark mono font code block with syntax coloring classes |
| `.warn-box` | Red-left-border alert box |
| `.ok-box` | Green-left-border info box |
| `.info-box` | Blue-left-border info box |
| `.compare-table` | Full bordered table for comparisons |
| `.flow-container` | Surface bg container for step flows |
| `.flow-row` / `.flow-step` | Flex row of numbered steps |

### 5. Add card to index.html

Add a new `.viz-card` entry in the `.cards-grid` before the "Coming Soon" placeholder card:

```html
<a class="viz-card theme-cyan" href="./your-new-viz.html" id="card-yours">
  <div class="card-glow"></div>
  <div class="card-strip"></div>
  <div class="card-body">
    <div class="card-tags">
      <span class="tag tag-primary">Primary Tag</span>
      <span class="tag tag-secondary">Secondary</span>
    </div>
    <div class="card-icon">🔧</div>
    <div class="card-title">Your Title</div>
    <div class="card-desc">Brief description.</div>
    <div class="card-footer">
      <div class="card-meta">
        <span class="meta-item">📌 Key feature</span>
      </div>
      <span class="card-arrow">→</span>
    </div>
  </div>
</a>
```

### 6. Add theme color CSS

If using a new color theme, add the theme class before the footer in index.html's `<style>`:

```css
.theme-cyan .card-strip   { background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue)); }
.theme-cyan .card-glow    { background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,.08) 0%, transparent 70%); }
.theme-cyan .tag-primary  { background: rgba(34,211,238,.12); border: 1px solid rgba(34,211,238,.25); color: var(--accent-cyan); }
.theme-cyan .tag-secondary{ background: rgba(79,142,247,.1);  border: 1px solid rgba(79,142,247,.2);  color: var(--accent-blue); }
```

Available accent variables for themes: `--accent-blue`, `--accent-cyan`, `--accent-green`, `--accent-amber`, `--accent-purp`.

### 7. Preview

No dev server needed — open the HTML file directly in a browser to preview changes.

## Development

No dev server needed — edit HTML files directly. Open in browser to preview.