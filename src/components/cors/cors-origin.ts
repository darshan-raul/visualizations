/**
 * The starter view: what an origin is. `compare()` splits a URL the way the browser's URL parser does and
 * checks it against the page's own origin. Used by the Astro view and, for typed URLs, by the client.
 */
export const PAGE = 'https://app.b.com/dashboard?tab=2#top';
const DEFAULT_PORTS: Record<string, string> = { 'http:': '80', 'https:': '443', 'ws:': '80', 'wss:': '443' };

export type Row = { key: 'scheme' | 'host' | 'port'; label: string; page: string; other: string; match: boolean; implied: boolean };
export type Comparison =
  | { ok: true; url: string; rows: Row[]; same: boolean; sameSite: boolean; summary: string }
  | { ok: false; url: string; summary: string };

const site = (host: string) => host.split('.').slice(-2).join('.');

export function compare(input: string): Comparison {
  let url: URL;
  try { url = new URL(input.trim(), PAGE); } catch { return { ok: false, url: input, summary: 'That isn\'t a URL the browser can read.' }; }
  const page = new URL(PAGE);
  if (!(url.protocol in DEFAULT_PORTS)) {
    return { ok: false, url: url.href, summary: `A ${url.protocol} URL has no host and port to compare. The browser gives it an opaque origin, which is never equal to any other origin.` };
  }
  const port = (u: URL) => u.port || DEFAULT_PORTS[u.protocol];
  const rows: Row[] = [
    { key: 'scheme', label: 'scheme', page: page.protocol.replace(':', ''), other: url.protocol.replace(':', ''), match: page.protocol === url.protocol, implied: false },
    { key: 'host', label: 'host', page: page.hostname, other: url.hostname, match: page.hostname === url.hostname, implied: false },
    { key: 'port', label: 'port', page: port(page), other: port(url), match: port(page) === port(url), implied: !url.port },
  ];
  const differ = rows.filter((row) => !row.match).map((row) => row.label);
  const same = differ.length === 0;
  return {
    ok: true, url: url.href, rows, same, sameSite: page.protocol === url.protocol && site(page.hostname) === site(url.hostname),
    summary: same ? 'Same origin: all three parts match.' : `Different origin: the ${differ.join(' and the ')} ${differ.length > 1 ? 'differ' : 'differs'}.`,
  };
}

/** Examples, from the ones that surprise people by matching to the ones that don't. */
export const presets: { url: string; why: string }[] = [
  { url: '/api/account', why: 'A URL with no scheme or host borrows them from the page, so it is always the same origin.' },
  { url: 'https://app.b.com/settings?tab=billing#card', why: 'The path, the ?query and the #fragment say where on the site you are. They are not part of the origin.' },
  { url: 'https://app.b.com:443/api', why: 'https uses port 443 when none is written, so writing :443 changes nothing.' },
  { url: 'https://APP.B.COM/api', why: 'Host names are not case-sensitive. The browser lowercases them before comparing.' },
  { url: 'http://app.b.com/api', why: 'http is another scheme, and it brings its own default port, 80. Two parts differ.' },
  { url: 'https://api.b.com/account', why: 'A sibling subdomain is another host, even inside the same company.' },
  { url: 'https://b.com/account', why: 'The parent domain is another host too. Origins don\'t nest.' },
  { url: 'https://app.b.com:8443/api', why: 'Same machine name, another port. That is another origin.' },
  { url: 'https://api.a.com/account', why: 'Another host on another site. This is the API the rest of the page calls.' },
];
export const START_PRESET = presets.length - 1;

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The comparison table under the URL box. */
export function comparison(c: Comparison, why = '') {
  if (!c.ok) return `<p class="cors-o-verdict is-differ"><span>NO ORIGIN TO COMPARE</span>${escape(c.summary)}</p>`;
  const cells = c.rows.map((row) => `<div class="cors-o-part ${row.match ? 'is-match' : 'is-differ'}"><span>${row.label}</span><b>${escape(row.page)}</b><b>${escape(row.other)}${row.key === 'port' && row.implied ? ' <small>default</small>' : ''}</b><i>${row.match ? '= same' : '≠ differs'}</i></div>`).join('');
  const site = c.same ? '' : c.sameSite ? ' It is still the same site, b.com, which matters for cookies but not for CORS.' : '';
  return `<div class="cors-o-grid"><div class="cors-o-rows"><span>this page</span><span>the URL</span></div>${cells}</div>
<p class="cors-o-verdict ${c.same ? 'is-match' : 'is-differ'}"><span>${c.same ? 'SAME ORIGIN' : 'DIFFERENT ORIGIN'}</span>${escape(c.summary)}${escape(site)}${why ? ` ${escape(why)}` : ''}</p>
<p class="cors-o-resolved">The browser reads it as <code>${escape(c.url)}</code></p>`;
}
