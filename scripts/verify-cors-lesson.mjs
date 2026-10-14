/**
 * Replays the verdicts of the CORS page's model (src/components/cors/cors-trip.ts) in headless Firefox.
 * Two local servers stand in for app.b.com and api.a.com (different ports, so different origins). The page runs every
 * case with fetch() or <img>, then posts what its script could see; the API server records which requests reached it.
 * The model's answers to "could the script read it?", "did the request reach the server?" and "was the header visible?"
 * must match. Needs Firefox on the PATH. Run with: node scripts/verify-cors-lesson.mjs
 */
import http from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { trip, base } from '../src/components/cors/cors-trip.ts';
import { allChoices } from '../src/components/cors/cors-views.ts';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
const pick = (list, n) => list[Math.floor(n * list.length)];
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// Cases: every choice on the page that runs from app.b.com without a CDN, then a random spread over the model's settings.
const cases = allChoices.filter((c) => c.config.page === base.page && c.config.cdn !== 'stale' && c.config.kind !== 'img').map((c) => ({ name: `${c.view}/${c.id}`, config: c.config }));
// Edge cases worth pinning down by name.
const edge = (name, config) => cases.push({ name, config: { ...base, ...config } });
edge('wildcard-auth-omit', { method: 'GET', auth: true, credentials: 'omit', acao: 'app', headers: '*' });
edge('wildcard-auth-same-origin', { method: 'GET', auth: true, credentials: 'same-origin', acao: 'app', headers: '*' });
edge('wildcard-json-no-auth', { method: 'POST', body: 'json', acao: 'app', headers: '*' });
edge('wildcard-json-include', { method: 'POST', body: 'json', credentials: 'include', acao: 'app', acac: true, headers: '*' });
edge('post-missing-from-allow-methods', { method: 'POST', body: 'json', acao: 'app', methods: 'get-only' });
edge('put-missing-from-allow-methods', { method: 'PUT', acao: 'app', methods: 'basic' });
for (let i = 0; i < 260; i++) {
  const kind = pick(['fetch', 'fetch', 'fetch', 'fetch', 'no-cors', 'img-cors'], rand());
  cases.push({ name: `random-${i}`, config: { ...base,
    kind, method: pick(['GET', 'POST', 'PUT', 'DELETE'], rand()), body: pick(['none', 'text', 'json'], rand()), auth: rand() < 0.4,
    credentials: pick(['same-origin', 'include', 'omit'], rand()), readsHeader: rand() < 0.4, options: pick([204, 204, 405, 401], rand()),
    acao: pick(['none', 'app', 'app', '*', 'reflect', 'other'], rand()), acac: rand() < 0.5, methods: pick(['basic', 'all'], rand()),
    headers: pick(['content-type', 'both', '*'], rand()), status: pick([200, 200, 500, 302], rand()), expose: rand() < 0.5,
    target: rand() < 0.1 && kind === 'fetch' ? 'https://app.b.com/api/account' : base.target } });
}

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
const arrived = new Map();
let pageOrigin = '';
let apiOrigin = '';
let results;
let release;
const done = new Promise((resolve) => { release = resolve; });

const api = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const index = Number(url.searchParams.get('case'));
  const c = cases[index]?.config;
  if (!c) return res.writeHead(404).end();
  (arrived.get(index) ?? arrived.set(index, []).get(index)).push(req.method);
  const grant = {};
  const acao = { none: undefined, app: pageOrigin, '*': '*', reflect: req.headers.origin, other: 'http://admin.c.example' }[c.acao];
  if (acao) grant['Access-Control-Allow-Origin'] = acao;
  if (c.acac) grant['Access-Control-Allow-Credentials'] = 'true';
  if (req.method === 'OPTIONS') {
    if (c.options !== 204) return res.writeHead(c.options, c.options === 405 ? { Allow: 'GET, POST' } : { 'WWW-Authenticate': 'Bearer' }).end();
    return res.writeHead(204, { ...grant,
      'Access-Control-Allow-Methods': { basic: 'GET, POST', all: 'GET, POST, PUT, DELETE', 'get-only': 'GET' }[c.methods],
      'Access-Control-Allow-Headers': { 'content-type': 'Content-Type', both: 'Content-Type, Authorization', '*': '*' }[c.headers],
      'Access-Control-Max-Age': '0' }).end();
  }
  req.resume();
  if (c.status === 500) return res.writeHead(500, { 'Content-Type': 'text/html' }).end('boom');
  if (c.status === 302) return res.writeHead(302, { Location: `${apiOrigin}/login` }).end();
  const extra = c.expose ? { 'Access-Control-Expose-Headers': 'X-Request-Id' } : {};
  if (c.kind === 'img-cors') return res.writeHead(200, { ...grant, ...extra, 'Content-Type': 'image/png' }).end(PNG);
  res.writeHead(200, { ...grant, ...extra, 'Content-Type': 'application/json', 'X-Request-Id': '7f3a91' }).end('{"ok":true}');
});

const page = http.createServer((req, res) => {
  if (req.url === '/results') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    return req.on('end', () => { results = JSON.parse(body); res.writeHead(204).end(); release(); });
  }
  if (req.url === '/wait.png') return done.then(() => res.writeHead(200, { 'Content-Type': 'image/png' }).end(PNG));
  if (req.url === '/api/account') return res.writeHead(200, { 'Content-Type': 'application/json' }).end('{}');
  if (req.url.startsWith('/same')) { const index = Number(new URL(req.url, 'http://x').searchParams.get('case')); (arrived.get(index) ?? arrived.set(index, []).get(index)).push(req.method); req.resume(); const s = cases[index].config.status; if (s === 302) return res.writeHead(302, { Location: '/api/account' }).end(); return res.writeHead(s, { 'X-Request-Id': '7f3a91' }).end('{}'); }
  res.writeHead(200, { 'Content-Type': 'text/html' }).end(`<!doctype html><title>cors check</title><script>
const cases = ${JSON.stringify(cases.map((item) => item.config))};
const api = ${JSON.stringify(apiOrigin)};
async function one(c, i) {
  const same = c.target.startsWith('https://app.b.com/');
  const url = same ? '/same?case=' + i : api + '/account?case=' + i;
  if (c.kind === 'img-cors') return new Promise((resolve) => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve({ ok: true }); img.onerror = () => resolve({ ok: false }); img.src = url; });
  const init = { method: c.method, credentials: c.credentials, headers: {} };
  if (c.kind === 'no-cors') init.mode = 'no-cors';
  if (c.method !== 'GET' && c.body !== 'none') init.body = c.body === 'json' ? '{"a":1}' : 'a=1';
  if (c.method !== 'GET' && c.body === 'json') init.headers['Content-Type'] = 'application/json';
  if (c.method !== 'GET' && c.body === 'text') init.headers['Content-Type'] = 'text/plain';
  if (c.auth) init.headers['Authorization'] = 'Bearer x';
  try {
    const res = await fetch(url, init);
    return { ok: res.type !== 'opaque', opaque: res.type === 'opaque', header: res.headers.get('X-Request-Id') };
  } catch (error) { return { ok: false, error: String(error) }; }
}
(async () => {
  const out = [];
  for (let i = 0; i < cases.length; i++) out.push(await one(cases[i], i));
  await fetch('/results', { method: 'POST', body: JSON.stringify(out) });
})();
</script><img src="/wait.png" alt="">`);
});

const apiPort = await listen(api);
const pagePort = await listen(page);
pageOrigin = `http://127.0.0.1:${pagePort}`;
apiOrigin = `http://localhost:${apiPort}`;
const profile = mkdtempSync(join(tmpdir(), 'cors-ff-'));
const shot = join(profile, 'shot.png');
// Firefox still lets `Access-Control-Allow-Headers: *` cover Authorization unless this is off; the Fetch standard
// and Chromium (from version 97) do not. The page follows the standard, so the check runs Firefox the same way.
const lenient = process.argv.includes('--firefox-default');
if (!lenient) writeFileSync(join(profile, 'user.js'), 'user_pref("network.cors_preflight.authorization_covered_by_wildcard", false);\n');
const firefox = new Promise((resolve, reject) => execFile('firefox', ['--headless', '--no-remote', '--profile', profile, '--window-size=400,300', '--screenshot', shot, `${pageOrigin}/`], { timeout: 120000 }, (error) => error && !results ? reject(error) : resolve()));
await Promise.race([done, firefox]);
await firefox.catch(() => {});
api.close(); page.close();
rmSync(profile, { recursive: true, force: true });
if (!results) { console.error('Firefox never reported results.'); process.exit(1); }

let failures = 0;
cases.forEach((item, index) => {
  const model = trip(item.config);
  const seen = results[index];
  const methods = arrived.get(index) ?? [];
  const reached = methods.some((method) => method !== 'OPTIONS');
  const modelReached = model.log.some((line) => !line.startsWith('OPTIONS') && !line.startsWith('('));
  const modelPreflight = model.log.some((line) => line.startsWith('OPTIONS'));
  const problems = [];
  if (item.config.kind === 'no-cors' && !model.same) {
    if (model.legs.out1 === 'ghost' ? !seen.error : !seen.opaque) problems.push(`no-cors: model ${model.legs.out1}, browser ${JSON.stringify(seen)}`);
  } else if (model.scriptOk !== seen.ok) problems.push(`readable: model ${model.scriptOk}, browser ${seen.ok}${seen.error ? ` (${seen.error})` : ''}`);
  if (modelReached !== reached) problems.push(`reached server: model ${modelReached}, server saw ${methods.join(',') || 'nothing'}`);
  if (modelPreflight !== methods.includes('OPTIONS')) problems.push(`preflight: model ${modelPreflight}, server saw ${methods.join(',') || 'nothing'}`);
  if (seen.ok && item.config.kind === 'fetch' && item.config.readsHeader && !model.same) {
    const visible = seen.header !== null;
    if (visible !== item.config.expose) problems.push(`X-Request-Id visible: browser ${visible}, expose ${item.config.expose}`);
  }
  if (problems.length) { failures++; console.log(`✕ ${item.name} ${JSON.stringify(item.config)}\n    ${problems.join('\n    ')}`); }
});
console.log(`${cases.length - failures} / ${cases.length} cases match Firefox.`);
process.exit(failures ? 1 : 0);
