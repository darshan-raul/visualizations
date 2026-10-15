/**
 * Builds dns-visual-prototype.html from dns-lesson.mjs.
 * The console frame reuses src/styles/lesson-console.css verbatim; diagrams follow LessonDiagram.astro.
 * Run: node guide/topics/dns/build-dns-prototype.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lesson } from './dns-lesson.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../../..');
const lessonCss = readFileSync(join(repo, 'src/styles/lesson-console.css'), 'utf8');

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const round = (v) => Math.round(v * 10) / 10;
const { views, groups, sources } = lesson;

/* ---------- Diagram, ported from LessonDiagram.astro ---------- */
const SIZE = { code: [150, 58], model: [150, 58], tool: [150, 58], kube: [150, 58], store: [150, 58], person: [150, 58], terminal: [78, 34], gate: [128, 54], part: [104, 44] };
const box = (n) => { const [w, h] = [n.w ?? SIZE[n.kind][0], n.h ?? SIZE[n.kind][1]]; return { x: n.x, y: n.y, w, h, cx: n.x + w / 2, cy: n.y + h / 2 }; };
const leave = (b, to) => {
  const dx = to.x - b.cx, dy = to.y - b.cy;
  const s = Math.min(dx ? b.w / 2 / Math.abs(dx) : Infinity, dy ? b.h / 2 / Math.abs(dy) : Infinity);
  return { x: b.cx + dx * s, y: b.cy + dy * s };
};
function route(d, e) {
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  const a = box(byId.get(e.from)), b = box(byId.get(e.to));
  const shift = e.shift ?? 0;
  let pts;
  if (e.via) {
    const c = e.via.map(([x, y]) => ({ x, y }));
    pts = [leave(a, c[0]), ...c, leave(b, c[c.length - 1])];
  } else if (a.x < b.x + b.w && b.x < a.x + a.w) {
    const x = (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2 + shift;
    pts = a.cy < b.cy ? [{ x, y: a.y + a.h }, { x, y: b.y }] : [{ x, y: a.y }, { x, y: b.y + b.h }];
  } else if (a.y < b.y + b.h && b.y < a.y + a.h) {
    const y = (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2 + shift;
    pts = a.cx < b.cx ? [{ x: a.x + a.w, y }, { x: b.x, y }] : [{ x: a.x, y }, { x: b.x + b.w, y }];
  } else {
    pts = [leave(a, { x: b.cx, y: b.cy }), leave(b, { x: a.cx, y: a.cy })];
  }
  const last = pts[pts.length - 1], before = pts[pts.length - 2];
  const len = Math.hypot(last.x - before.x, last.y - before.y) || 1;
  const tip = { x: last.x - ((last.x - before.x) / len) * 5, y: last.y - ((last.y - before.y) / len) * 5 };
  const drawn = [...pts.slice(0, -1), tip];
  let best = 0, longest = 0;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const span = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    if (span > longest) { longest = span; best = i; }
  }
  const [p, q] = [pts[best], pts[best + 1]];
  const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  const flat = Math.abs(q.y - p.y) < Math.abs(q.x - p.x);
  const label = flat ? { x: mid.x, y: mid.y + (shift > 0 ? 16 : -8), anchor: 'middle' } : { x: mid.x + (shift < 0 ? -9 : 9), y: mid.y + 4, anchor: shift < 0 ? 'end' : 'start' };
  return { d: `M${drawn.map((pt) => `${round(pt.x)} ${round(pt.y)}`).join(' L')}`, label, mid };
}
function diagram(id, d, pic = {}) {
  const all = [...d.nodes, ...d.edges, ...(d.zones ?? [])].map((i) => i.id);
  const shown = new Set(pic.show ?? all);
  const has = (list, key) => Boolean(list?.includes(key));
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  const nodes = d.nodes.filter((n) => shown.has(n.id));
  const edges = d.edges.filter((e) => shown.has(e.id) && shown.has(e.from) && shown.has(e.to)).map((e) => {
    const tone = has(pic.denied, e.id) ? 'denied' : e.kind === 'imagined' ? 'imagined' : has(pic.hot, e.id) ? 'hot' : 'idle';
    return { ...e, ...route(d, e), tone, text: pic.say?.[e.id] ?? e.label };
  });
  const zones = (d.zones ?? []).filter((z) => shown.has(z.id));
  const name = (k) => byId.get(k)?.label ?? k;
  const spoken = [`Shown: ${nodes.map((n) => n.label).join(', ')}.`,
    ...edges.filter((e) => e.tone !== 'idle').map((e) => `${name(e.from)} to ${name(e.to)}${e.text ? `: ${e.text}` : ''}${e.tone === 'denied' ? ' (stopped)' : e.tone === 'imagined' ? ' (no such path)' : ''}.`),
    ...Object.entries(pic.badge ?? {}).map(([k, t]) => `${name(k)}: ${t}.`)].join(' ');
  const out = [];
  out.push(`<svg class="lsn-diagram" viewBox="0 0 ${d.width} ${d.height}" style="max-width:${Math.round(d.width * 1.4)}px" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(d.title)}</title><desc id="${id}-desc">${esc(spoken)}</desc><defs>`);
  for (const tone of ['idle', 'hot', 'denied', 'imagined']) out.push(`<marker id="${id}-arrow-${tone}" class="lsn-arrow is-${tone}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 Z"/></marker>`);
  out.push('</defs><g aria-hidden="true">');
  for (const z of zones) out.push(`<g class="lsn-zone${has(pic.denied, z.id) ? ' is-denied' : ''}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="12"/><text x="${z.x + 10}" y="${z.y + 15}">${esc(z.label)}</text></g>`);
  for (const e of edges) {
    out.push(`<g class="lsn-edge is-${e.tone}"><path class="lsn-edge-line" d="${e.d}" marker-end="url(#${id}-arrow-${e.tone})"/>`);
    if (e.tone === 'hot') out.push(`<circle class="lsn-packet" r="4.5" style="offset-path:path('${e.d}')"/>`);
    if (e.tone === 'denied' || e.tone === 'imagined') out.push(`<text class="lsn-edge-stop" x="${round(e.mid.x)}" y="${round(e.mid.y + 5)}" text-anchor="middle">✕</text>`);
    if (e.text) out.push(`<text class="lsn-edge-label" x="${round(e.label.x)}" y="${round(e.label.y)}" text-anchor="${e.label.anchor}">${esc(e.text)}</text>`);
    out.push('</g>');
  }
  for (const n of nodes) {
    const b = box(n);
    const tag = pic.badge?.[n.id];
    const tw = tag ? Math.round(tag.length * 6.1 + 14) : 0;
    const cls = ['lsn-node', `is-${n.kind}`, has(pic.hot, n.id) && 'is-hot', has(pic.fresh, n.id) && 'is-fresh', has(pic.denied, n.id) && 'is-denied'].filter(Boolean).join(' ');
    out.push(`<g class="${cls}">`);
    out.push(n.kind === 'gate' ? `<polygon points="${b.cx},${b.y} ${b.x + b.w},${b.cy} ${b.cx},${b.y + b.h} ${b.x},${b.cy}"/>` : `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${n.kind === 'terminal' ? b.h / 2 : 7}"/>`);
    if (n.kind === 'store') out.push(`<path class="lsn-node-shelf" d="M${b.x + 1} ${b.y + 9} H${b.x + b.w - 1}"/>`);
    out.push(`<text class="lsn-node-label" x="${b.cx}" y="${n.sub ? b.cy - 2 : b.cy + 4.5}" text-anchor="middle">${esc(n.label)}</text>`);
    if (n.sub) out.push(`<text class="lsn-node-sub" x="${b.cx}" y="${b.cy + 14}" text-anchor="middle">${esc(n.sub)}</text>`);
    if (tag) out.push(`<g class="lsn-node-tag"><rect x="${b.x + b.w - tw + 6}" y="${b.y - 10}" width="${tw}" height="18" rx="9"/><text x="${b.x + b.w - tw / 2 + 6}" y="${b.y + 3}" text-anchor="middle">${esc(tag)}</text></g>`);
    out.push('</g>');
  }
  out.push('</g></svg>');
  return out.join('');
}

/* ---------- Panels ---------- */
const MARK = { read: 'reads', write: 'writes', new: 'new' };
const STORE = { fresh: 'just stored', loaded: 'served from cache', lost: 'lost' };
const split = (line) => { const at = line.search(/(^|\s)(#|\/\/) /); return at < 0 ? [line, ''] : [line.slice(0, at), line.slice(at)]; };
const codeBlock = (item) => `<section class="lsn-code" aria-label="${esc(item.title)}"><h3>${esc(item.title)}</h3><pre tabindex="0"><code>${item.text.split('\n').map((line, i) => { const [a, b] = split(line); return `<span class="lsn-line${item.hot?.includes(i + 1) ? ' is-hot' : ''}">${esc(a) || ' '}${b ? `<i>${esc(b)}</i>` : ''}</span>`; }).join('')}</code></pre></section>`;
const table = (t) => `<div class="lsn-table-wrap"><table class="lsn-table"><caption>${esc(t.title)}</caption><thead><tr>${t.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((row, ri) => `<tr${t.hot === ri ? ' class="is-hot"' : ''}>${row.map((c, ci) => ci === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const side = (f) => {
  const parts = [];
  if (f.state) parts.push(`<section class="lsn-panel lsn-state" aria-label="${esc(f.state.title)}"><h3>${esc(f.state.title)}</h3><dl>${f.state.rows.map((r) => `<div${r.mark ? ` class="is-${r.mark}"` : ''}><dt>${esc(r.key)}</dt><dd><code>${esc(r.value)}</code>${r.mark ? `<em>${MARK[r.mark]}</em>` : ''}</dd></div>`).join('')}</dl></section>`);
  if (f.store) parts.push(`<section class="lsn-panel lsn-store" aria-label="${esc(f.store.title)}"><h3>${esc(f.store.title)}</h3><ol>${f.store.rows.map((r) => `<li${r.mark ? ` class="is-${r.mark}"` : ''}><b>${esc(r.id)}</b><code>${esc(r.text)}</code>${r.mark ? `<em>${STORE[r.mark]}</em>` : ''}</li>`).join('')}</ol></section>`);
  if (f.code) parts.push(...f.code.map(codeBlock));
  return parts.join('');
};

/* ---------- Custom canvases ---------- */
function checksBlock(f) {
  return `<div class="dns-diagnose" data-dns-diagnose><div class="dns-symptom"><span>WHAT THE APP REPORTS</span><code>${esc(f.caption)}</code></div>
  <ol class="dns-checks">${f.checks.map(([cmd, out, meaning], i) => `<li data-dns-check><span class="dns-check-n">CHECK ${i + 1}</span><code class="dns-cmd">$ ${esc(cmd)}</code><pre tabindex="0">${esc(out)}</pre><p>${esc(meaning)}</p></li>`).join('')}</ol>
  <div class="lsn-controls" data-dns-check-controls hidden><button type="button" class="lsn-primary" data-dns-run>Run check 1 →</button><button type="button" data-dns-reset>↺ Start over</button></div>
  <p class="lsn-notice is-ok dns-verdict" data-dns-verdict><span>WHAT TO DO</span>${esc(f.verdict)}</p></div>`;
}

const SHORT = { A: 'IPv4 address', AAAA: 'IPv6 address', CNAME: 'alias', HTTPS: 'connection hints', MX: 'mail servers', TXT: 'policies, proofs', NS: 'name servers', SOA: 'zone facts', SRV: 'host and port', CAA: 'allowed CAs', DS: 'fingerprint, in com', DNSKEY: 'public key', RRSIG: 'signature', PTR: 'address → name' };
const TONE = { blue: 'var(--blue)', teal: '#5fb8c6', purple: 'var(--purple)', amber: 'var(--amber)', grey: '#9fb0c8' };
function recordMap() {
  const { records, districts } = lesson;
  const SIGN = { w: 112, h: 46, gap: 10 };
  const placed = new Map();
  for (const dist of districts) {
    const members = records.filter((r) => r.district === dist.id);
    members.forEach((r, i) => {
      const x = dist.box.x + 14 + i * (SIGN.w + SIGN.gap);
      const y = dist.box.y + 52;
      placed.set(r.type, { x, y });
    });
  }
  const spoken = districts.map((d) => `${d.name}, ${d.means}: ${records.filter((r) => r.district === d.id).map((r) => `${r.type} ${r.phrase}`).join(', ')}.`).join(' ');
  const svg = [`<svg class="dns-map" viewBox="0 0 830 442" role="group" aria-labelledby="dns-map-title dns-map-desc"><title id="dns-map-title">The records in the example.com zone, grouped by purpose</title><desc id="dns-map-desc">${esc(spoken)} The reverse zone sits outside example.com.</desc>`];
  svg.push('<g aria-hidden="true"><path class="dns-map-zone" d="M22 40 H808 Q822 40 822 54 V294 Q822 304 812 304 H556 Q546 304 546 314 V420 Q546 434 532 434 H20 Q6 434 6 420 V54 Q6 40 22 40 Z"/><text class="dns-map-zone-label" x="20" y="30">ZONE example.com</text><rect class="dns-map-zone is-other" x="552" y="310" width="270" height="124" rx="14"/><text class="dns-map-zone-label" x="566" y="306">ANOTHER ZONE</text></g>');
  for (const d of districts) {
    const { x, y, w, h } = d.box;
    svg.push(`<g class="dns-district" style="--tone:${TONE[d.tone]}" aria-hidden="true"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/><text class="dns-district-name" x="${x + 14}" y="${y + 22}">${esc(d.name)}</text><text class="dns-district-means" x="${x + 14}" y="${y + 39}">${esc(d.means)}</text></g>`);
  }
  for (const r of records) {
    const at = placed.get(r.type);
    const d = districts.find((dd) => dd.id === r.district);
    const short = SHORT[r.type] ?? r.phrase;
    svg.push(`<a class="dns-sign" href="#record-${r.type.toLowerCase()}" data-dns-sign="${r.type}" style="--tone:${TONE[d.tone]}" aria-label="${esc(`${r.type}, ${r.phrase}`)}"><rect x="${at.x}" y="${at.y}" width="${SIGN.w}" height="${SIGN.h}" rx="7"/><path class="dns-pin" d="M${at.x} ${at.y + 15} V${at.y + 7} a7 7 0 0 1 7 -7 H${at.x + 15} Z"/><text class="dns-sign-type" x="${at.x + SIGN.w / 2}" y="${at.y + 21}" text-anchor="middle">${esc(r.type)}</text><text class="dns-sign-phrase" x="${at.x + SIGN.w / 2}" y="${at.y + 37}" text-anchor="middle">${esc(short)}</text></a>`);
  }
  svg.push('</svg>');
  const details = records.map((r, i) => {
    const d = districts.find((dd) => dd.id === r.district);
    return `<article class="dns-record${i === 0 ? ' is-active' : ''}" id="record-${r.type.toLowerCase()}" data-dns-record="${r.type}" style="--tone:${TONE[d.tone]}" aria-labelledby="record-${r.type.toLowerCase()}-title">
      <header><span>${esc(d.name.toUpperCase())}</span><h3 id="record-${r.type.toLowerCase()}-title" tabindex="-1"><b>${esc(r.type)}</b> ${esc(r.phrase)}</h3></header>
      <p class="dns-says">“${esc(r.says)}”</p>
      <div class="dns-zone-line"><span>ZONE FILE</span><code>${esc(r.line)}</code></div>
      <dl class="dns-fields">${r.fields.map(([k, v, why]) => `<div><dt>${esc(k)}</dt><dd><code>${esc(v)}</code>${why ? `<small>${esc(why)}</small>` : ''}</dd></div>`).join('')}</dl>
      <div class="lsn-code-row">${codeBlock({ title: 'Ask for it', text: `$ ${r.dig[0]}\n${r.dig[1]}`, hot: [1] })}<div class="lsn-note dns-trap"><span>THE TRAP</span><p>${esc(r.trap)}</p></div></div>
      <p class="lsn-view-sources dns-record-sources">${r.sources.map((s) => `<a href="${sources[s].url}" target="_blank" rel="noopener noreferrer">${esc(sources[s].label)} ↗</a>`).join('')}</p>
    </article>`;
  }).join('');
  const picker = `<div class="lsn-controls is-choices dns-record-picker" role="group" aria-label="Choose a record type" data-dns-picker hidden>${records.map((r, i) => `<button type="button" data-dns-pick="${r.type}" aria-pressed="${i === 0}">${esc(r.type)}</button>`).join('')}</div>`;
  return `<div class="dns-map-wrap" tabindex="0" aria-label="Record map, scrolls sideways on narrow screens">${svg.join('')}</div>${picker}<div class="dns-records" data-dns-records>${details}</div>`;
}

function changeBoard() {
  const c = lesson.change;
  const STATE = { old: 'old address', new: 'new address', gone: 'broken' };
  const tables = c.modes.map((m) => `<div class="dns-change-table" data-dns-change-table="${m.id}"><div class="lsn-table-wrap"><table class="lsn-table dns-timeline-table"><caption>${esc(m.label)}: ${esc(m.summary)}</caption><thead><tr><th scope="col">Client</th>${c.times.map((t, ti) => `<th scope="col" data-dns-col="${ti}">${esc(t)}</th>`).join('')}</tr></thead><tbody>
    <tr><th scope="row">TTL published</th>${m.ttl.map((t, ti) => `<td data-dns-col="${ti}">${esc(t)}</td>`).join('')}</tr>
    ${c.clients.map((cl) => `<tr><th scope="row">${esc(cl.label)}<small>${esc(cl.sub)}</small></th>${c.cells[m.id][cl.id].map(([s, text], ti) => `<td data-dns-col="${ti}" class="dns-cell is-${s}"><span>${STATE[s]}</span>${esc(text)}</td>`).join('')}</tr>`).join('')}
    <tr><th scope="row">Old server</th>${c.times.map((_, ti) => `<td data-dns-col="${ti}">${ti === c.times.length - 1 ? 'off' : 'running'}</td>`).join('')}</tr>
  </tbody></table></div></div>`).join('');
  const controls = `<div class="dns-change-controls" data-dns-change-controls hidden>
    <div class="lsn-controls is-choices" role="group" aria-label="Choose the plan">${c.modes.map((m, i) => `<button type="button" data-dns-mode="${m.id}" aria-pressed="${i === 0}">${esc(m.label)}</button>`).join('')}</div>
    <div class="lsn-controls"><button type="button" class="lsn-primary" data-dns-tnext>Next →</button><button type="button" data-dns-tback>← Back</button><button type="button" data-dns-treset>↺ Restart</button><span data-lsn-step data-dns-tcount>Moment 1 of ${c.times.length}</span></div>
  </div>
  <div class="dns-board" data-dns-board hidden>
    <ol class="dns-clock" aria-label="Timeline">${c.times.map((t, i) => `<li data-dns-tick="${i}"><button type="button" data-dns-jump="${i}">${esc(t)}</button></li>`).join('')}</ol>
    <p class="dns-moment" data-dns-moment></p>
    <div class="dns-ttl"><span>TTL PUBLISHED</span><b data-dns-ttl></b><span>OLD SERVER</span><b data-dns-old></b></div>
    <ul class="dns-clients">${c.clients.map((cl) => `<li data-dns-client="${cl.id}"><b>${esc(cl.label)}</b><small>${esc(cl.sub)}</small><span class="dns-client-state"></span><code></code></li>`).join('')}</ul>
  </div>`;
  return `${controls}${tables}<script type="application/json" id="dns-change-data">${JSON.stringify(c).replace(/</g, '\\u003c')}</script>`;
}

/* ---------- Views ---------- */
const word = (v) => v.mode === 'steps' ? 'STEP' : 'OPTION';
function viewHtml(v, vi) {
  const out = [];
  out.push(`<section id="${v.id}" class="lsn-view${vi === 0 ? ' is-active' : ''}" data-lsn-view data-lsn-label="${esc(v.label)}" data-lsn-takeaway="${esc(v.takeaway)}" data-lsn-mode="${v.mode}" aria-labelledby="${v.id}-title">`);
  out.push(`<header class="lsn-view-head"><span>${pad(vi + 1)} / ${esc(v.group.toUpperCase())}${v.hero ? ' · INTERACTIVE' : ''}</span><h2 id="${v.id}-title" tabindex="-1">${esc(v.title)}</h2><p>${esc(v.lede)}</p></header>`);
  if (v.mode === 'records') out.push(recordMap());
  else if (v.mode === 'change') out.push(changeBoard());
  else {
    if (v.frames.length > 1) {
      out.push(v.mode === 'steps'
        ? `<div class="lsn-controls" data-lsn-steps hidden><button type="button" class="lsn-primary" data-lsn-next>Next →</button><button type="button" data-lsn-back>← Back</button><button type="button" data-lsn-restart>↺ Restart</button><span data-lsn-step>Step 1 of ${v.frames.length}</span></div>`
        : `<div class="lsn-controls is-choices" data-lsn-choices role="group" aria-label="${v.id === 'diagnose' ? 'Choose a fault' : 'Choose a case'}" hidden>${v.frames.map((f, fi) => `<button type="button" data-lsn-choice="${fi}" aria-pressed="${fi === 0}">${esc(f.action)}</button>`).join('')}</div>`);
    }
    out.push('<div class="lsn-frames">');
    v.frames.forEach((f, fi) => {
      out.push(`<figure class="lsn-frame${fi === 0 ? ' is-active' : ''}" data-lsn-frame data-lsn-action="${esc(f.action)}"><figcaption>${v.frames.length > 1 ? `<span>${word(v)} ${fi + 1} OF ${v.frames.length} · <b>${esc(f.action)}</b></span>` : ''}${f.checks ? '' : `<p>${esc(f.caption)}</p>`}</figcaption>`);
      if (f.notice) out.push(`<p class="lsn-notice is-${f.notice.tone}"><span>${esc(f.notice.label)}</span>${esc(f.notice.text)}</p>`);
      const s = side(f);
      if (v.diagram || s) out.push(`<div class="lsn-stage${s ? '' : ' is-solo'}">${v.diagram ? `<div class="lsn-diagram-wrap">${diagram(`${v.id}-${fi}`, v.diagram, f.pic)}</div>` : ''}${s ? `<div class="lsn-side">${s}</div>` : ''}</div>`);
      if (f.table) out.push(table(f.table));
      if (f.checks) out.push(checksBlock(f));
      out.push('</figure>');
    });
    out.push('</div>');
    if (v.table) out.push(table(v.table));
  }
  const ins = v.inspector;
  out.push(`<div class="lsn-reading" data-lsn-reading><span class="lsn-kicker">INSPECTOR</span><h3>${esc(ins.heading)}</h3><p>${esc(ins.body)}</p><dl class="lsn-facts">${ins.facts.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl><div class="lsn-evidence"><span>${esc(ins.evidence[0])}</span><code>${esc(ins.evidence[1])}</code></div><div class="lsn-note"><span>WORTH KNOWING</span><p>${esc(ins.note)}</p></div><p class="lsn-view-sources">${v.sources.map((s) => `<a href="${sources[s].url}" target="_blank" rel="noopener noreferrer">${esc(sources[s].label)} ↗</a>`).join('')}</p></div>`);
  out.push(`<p class="lsn-view-point"><span>THE POINT TO KEEP</span>${esc(v.takeaway)}</p></section>`);
  return out.join('\n');
}

const index = groups.map((g, gi) => {
  const members = views.filter((v) => v.group === g);
  const start = views.indexOf(members[0]);
  return `<details class="lsn-index-group" data-lsn-group${gi === 0 ? ' open' : ''}><summary><span>${members.length > 1 ? `${pad(start + 1)}–${pad(start + members.length)}` : pad(start + 1)}</span><strong>${esc(g)}</strong><i aria-hidden="true">⌄</i></summary><div>${members.map((v, o) => `<a href="#${v.id}" data-lsn-link${start + o === 0 ? ' aria-current="step"' : ''}><span>${pad(start + o + 1)}</span><strong>${esc(v.label)}</strong></a>`).join('')}</div></details>`;
}).join('');

const dnsCss = `
:root { color-scheme:dark; --bg:#090c13; --border:rgba(226,232,255,.09); --border-strong:rgba(226,232,255,.17); --text:#f2f5fc; --muted:#97a3b8; --dim:#8592a8; --blue:#68a3ff; --cyan:#42d6e8; --green:#49d6a3; --amber:#f6c763; --red:#fb7e85; --purple:#b79aff; --foundations:#b79aff;
  --sans:'DM Sans',Inter,ui-sans-serif,system-ui,sans-serif; --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Consolas,monospace; }
*,*::before,*::after { box-sizing:border-box; }
body { margin:0; min-width:320px; background:var(--bg); color:var(--text); font-family:var(--sans); -webkit-font-smoothing:antialiased; overflow-x:hidden; }
.proto-banner { margin:0; padding:8px 14px; background:#242117; color:var(--amber); font:.74rem var(--mono); text-align:center; }
.topic-console-topbar { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 27px; border-bottom:1px solid var(--border); background:#0a121c; font:.8rem var(--mono); }
.topic-console-topbar b { color:var(--text); } .topic-console-topbar span { color:var(--foundations); }
.lsn-legend i.is-res { border-color:#5fb8c6; } .lsn-legend i.is-auth { border-color:var(--blue); } .lsn-legend i.is-cache { border-color:#9fb0c8; border-top-width:4px; }
/* record map */
.dns-map-wrap { margin:4px 0 14px; padding:6px; border:1px solid var(--border); border-radius:11px; background:#0a131d; overflow-x:auto; overscroll-behavior-inline:contain; scrollbar-width:thin; }
.dns-map { display:block; width:100%; min-width:720px; max-width:1200px; height:auto; margin-inline:auto; }
.dns-map-zone { fill:none; stroke:var(--border-strong); stroke-dasharray:2 5; }
.dns-map-zone.is-other { stroke:#56637a; }
.dns-map-zone-label { fill:var(--dim); font:600 10.5px var(--mono); letter-spacing:.08em; }
.dns-district rect { fill:#0e1a27; stroke:var(--tone); stroke-opacity:.45; stroke-width:1.4; stroke-dasharray:3 5; }
.dns-district-name { fill:var(--text); font:650 13.5px var(--sans); }
.dns-district-means { fill:var(--muted); font:11.5px var(--sans); }
.dns-sign { cursor:pointer; }
.dns-sign rect { fill:#13202e; stroke:var(--tone); stroke-opacity:.6; stroke-width:1.3; }
.dns-sign:hover rect { stroke-opacity:1; fill:#172a3a; }
.dns-sign-type { fill:var(--tone); font:700 15px var(--mono); }
.dns-sign-phrase { fill:var(--muted); font:500 10.5px var(--sans); }
.dns-pin { fill:var(--tone); display:none; }
.dns-sign[aria-current] rect { fill:#1b2f40; stroke-opacity:1; stroke-width:2.8; }
.dns-sign[aria-current] .dns-sign-phrase { fill:var(--text); }
.dns-sign[aria-current] .dns-pin { display:block; }
.dns-sign:focus-visible { outline:none; } .dns-sign:focus-visible rect { stroke:var(--cyan); stroke-opacity:1; stroke-width:3; }
.dns-record-picker button { min-width:64px; }
@media (min-width:761px) { .dns-record-picker { display:none; } }
.dns-record { padding:16px 0 4px; scroll-margin-top:16px; }
.dns-record + .dns-record { border-top:1px solid var(--border-strong); margin-top:12px; }
.lsn-console.is-enhanced .dns-record { display:none; border-top:0; margin:0; }
.lsn-console.is-enhanced .dns-record.is-active { display:block; }
.dns-record header span { color:var(--tone); font:.72rem var(--mono); letter-spacing:.08em; }
.dns-record header h3 { margin:6px 0 4px; font-size:1.35rem; letter-spacing:-.03em; outline:none; }
.dns-record header h3 b { margin-right:6px; color:var(--tone); font:700 1.2em var(--mono); }
.dns-says { margin:0 0 12px; font-size:1.08rem; line-height:1.45; }
.dns-zone-line { display:grid; gap:5px; margin-bottom:12px; padding:10px 12px; border:1px solid var(--border-strong); border-left:3px solid var(--tone); border-radius:8px; background:#091420; }
.dns-zone-line span { color:var(--dim); font:.7rem var(--mono); letter-spacing:.06em; }
.dns-zone-line code { color:var(--text); font:.84rem/1.5 var(--mono); overflow-wrap:anywhere; }
.dns-fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr)); gap:8px; margin:0; }
.dns-fields > div { padding:9px 11px; border:1px solid var(--border); border-radius:8px; background:#0e1a27; }
.dns-fields dt { color:var(--dim); font:.7rem var(--mono); letter-spacing:.05em; text-transform:uppercase; }
.dns-fields dd { display:grid; gap:4px; margin:4px 0 0; }
.dns-fields code { color:var(--tone); font:.84rem var(--mono); overflow-wrap:anywhere; }
.dns-fields small { color:var(--muted); font-size:.82rem; line-height:1.4; }
.dns-trap { margin-top:0; }
.dns-record-sources { display:flex; flex-wrap:wrap; gap:6px 16px; margin:12px 0 0; font-size:.8rem; }
/* change board */
.dns-clock { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:0; margin:0 0 12px; padding:0; list-style:none; border:1px solid var(--border-strong); border-radius:10px; overflow:hidden; }
.dns-clock li + li { border-left:1px solid var(--border); }
.dns-clock button { width:100%; min-height:44px; padding:6px 4px; border:0; background:#0e1a27; color:var(--muted); font:.76rem var(--mono); }
.dns-clock li.is-past button { color:var(--text); background:#112330; }
.dns-clock li.is-now button { background:#12323d; color:var(--cyan); box-shadow:inset 0 -3px var(--cyan); font-weight:700; }
.dns-moment { margin:0 0 12px; font-size:1.02rem; line-height:1.5; }
.dns-ttl { display:flex; flex-wrap:wrap; gap:6px 12px; align-items:baseline; margin-bottom:12px; color:var(--dim); font:.72rem var(--mono); letter-spacing:.05em; }
.dns-ttl b { margin-right:14px; color:var(--text); font-size:.9rem; letter-spacing:0; }
.dns-clients { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr)); gap:10px; margin:0; padding:0; list-style:none; }
.dns-clients li { display:grid; gap:4px; padding:12px; border:1px solid var(--border-strong); border-left:4px solid #56637a; border-radius:9px; background:#0e1a27; }
.dns-clients small { color:var(--dim); font:.72rem var(--mono); }
.dns-client-state { font:700 .74rem var(--mono); letter-spacing:.06em; text-transform:uppercase; }
.dns-clients code { font:.92rem var(--mono); }
.dns-clients li.is-old { border-left-color:var(--amber); } .dns-clients li.is-old .dns-client-state { color:var(--amber); }
.dns-clients li.is-new { border-left-color:var(--green); } .dns-clients li.is-new .dns-client-state { color:var(--green); }
.dns-clients li.is-gone { border-left-color:var(--red); background:#27181c; } .dns-clients li.is-gone .dns-client-state { color:var(--red); }
.dns-clients li.is-changed { animation:lsn-appear .5s ease-out; }
.dns-timeline-table th small { display:block; color:var(--dim); font:400 .68rem var(--mono); white-space:normal; }
.dns-cell span { display:block; font:700 .64rem var(--mono); letter-spacing:.06em; text-transform:uppercase; }
.dns-cell.is-old span { color:var(--amber); } .dns-cell.is-new span { color:var(--green); } .dns-cell.is-gone span { color:var(--red); }
.lsn-console.is-enhanced .dns-change-table:not(.is-active) { display:none; }
.lsn-console.is-enhanced .dns-timeline-table [data-dns-col].is-future { color:transparent; }
.lsn-console.is-enhanced .dns-timeline-table [data-dns-col].is-future span { color:transparent; }
.lsn-console.is-enhanced .dns-timeline-table [data-dns-col].is-now { background:#10262f; }
.dns-change-table + .dns-change-table { margin-top:14px; }
/* diagnose */
.dns-diagnose { display:grid; gap:12px; margin-top:14px; }
.dns-symptom { display:grid; gap:5px; padding:11px 13px; border:1px solid rgba(251,126,133,.4); border-radius:8px; background:#1d1418; }
.dns-symptom span { color:var(--red); font:600 .7rem var(--mono); letter-spacing:.07em; }
.dns-symptom code { font:.88rem/1.5 var(--mono); overflow-wrap:anywhere; }
.dns-checks { display:grid; gap:10px; margin:0; padding:0; list-style:none; }
.dns-checks li { display:grid; gap:6px; padding:11px 13px; border:1px solid var(--border-strong); border-radius:9px; background:#0e1a27; }
.dns-checks li.is-new { border-color:rgba(66,214,232,.55); animation:lsn-appear .5s ease-out; }
.dns-check-n { color:var(--dim); font:600 .68rem var(--mono); letter-spacing:.07em; }
.dns-cmd { color:var(--cyan); font:.84rem var(--mono); overflow-wrap:anywhere; }
.dns-checks pre { margin:0; padding:8px 10px; border-radius:7px; background:#091420; color:var(--text); font:.78rem/1.55 var(--mono); overflow-x:auto; white-space:pre; }
.dns-checks p { margin:0; color:var(--muted); font-size:.92rem; line-height:1.5; }
.dns-verdict { margin:0; }
.lsn-console.is-enhanced .dns-checks li[hidden], .lsn-console.is-enhanced .dns-verdict[hidden] { display:none; }
@media (max-width:760px) {
  .topic-console-topbar { padding:10px 14px; }
  .dns-clock { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .dns-clock li:nth-child(4) { border-left:0; } .dns-clock li:nth-child(n+4) { border-top:1px solid var(--border); }
}
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DNS: From a Name to an Answer — approval prototype</title>
<meta name="description" content="Approval prototype for the Infra Illustrated DNS topic. Not published content.">
<style>${dnsCss}\n${lessonCss}</style>
</head>
<body>
<p class="proto-banner">APPROVAL PROTOTYPE · guide/topics/dns · not published content · generated from dns-lesson.mjs</p>
<article class="topic-console lsn-console" aria-labelledby="dns-console-title">
  <div class="topic-console-topbar"><b>Infra, Illustrated.</b><span>Foundations</span></div>
  <header class="lsn-console-head"><div><nav class="lsn-crumb" aria-label="Breadcrumb"><a href="#">Library</a><span>/</span><a href="#">Foundations</a><span>/</span><span aria-current="page">Deep Dive</span></nav><span class="lsn-kicker">${esc(lesson.kicker)}</span><h1 id="dns-console-title">${esc(lesson.title)}</h1><p>${esc(lesson.summary)}</p></div><div class="lsn-head-context"><span>${esc(lesson.reference)}</span><span>${esc(lesson.format)}</span><span>Prototype · 15 Oct 2026</span></div></header>
  <div class="lsn-console-grid">
    <nav class="lsn-index" aria-label="View index"><details class="lsn-index-menu" data-lsn-menu open><summary class="lsn-index-head"><span>VIEW INDEX</span><strong data-lsn-count>01 / ${pad(views.length)}</strong></summary>${index}<a class="lsn-index-sources" href="#dns-sources">↗ Sources</a></details></nav>
    <div class="lsn-main">
      <div class="lsn-toolbar"><div><span class="lsn-kicker">ACTIVE VIEW</span><strong data-lsn-view-title>${esc(views[0].label)}</strong></div><span class="lsn-scenario">${esc(lesson.scenario)}</span></div>
      <div class="lsn-legend" aria-label="Legend"><span><i></i> your machine</span><span><i class="is-res"></i> resolver</span><span><i class="is-auth"></i> authoritative server</span><span><i class="is-cache"></i> cache or file</span><span><i class="is-hot"></i> happening now</span><span><i class="is-imagined"></i> no such path</span><span><i class="is-denied"></i> fails</span></div>
      <div class="lsn-canvas">
${views.map(viewHtml).join('\n')}
      </div>
      <div class="lsn-timeline" data-lsn-timeline hidden><button type="button" data-lsn-prev aria-label="Previous view">←</button><div><span>NOW INSPECTING</span><strong data-lsn-progress>01 / ${esc(views[0].label)}</strong></div><button type="button" data-lsn-forward aria-label="Next view">→</button></div>
      <p class="lsn-live" data-lsn-live aria-live="polite"></p>
    </div>
    <aside class="lsn-inspector" data-lsn-inspector aria-label="Inspector"></aside>
  </div>
  <footer class="lsn-console-bottom">
    <div class="lsn-point"><span>THE POINT TO KEEP</span><p data-lsn-point>${esc(views[0].takeaway)}</p></div>
    <details class="lsn-reference" id="dns-sources" data-lsn-sources><summary><span>Sources, scope &amp; related visuals</span><i aria-hidden="true">↗</i></summary><div><p>${esc(lesson.scope)}</p><ul>${sources.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a></li>`).join('')}</ul><p class="lsn-related"><span>RELATED VISUALS</span>${lesson.related.map((r) => `<a href="${r.href}">${esc(r.label)} ↗</a>`).join('')}</p></div></details>
    <div class="lsn-sitefoot"><span>Infra, Illustrated. · Visual deep dives into cloud infrastructure.</span><a href="#">Browse all visuals ↗</a></div>
  </footer>
</article>
<script>
${readFileSync(join(here, 'dns-prototype-client.js'), 'utf8')}
</script>
</body>
</html>
`;
writeFileSync(join(here, 'dns-visual-prototype.html'), html);
console.log(`wrote dns-visual-prototype.html (${Math.round(html.length / 1024)} KB, ${views.length} views)`);
