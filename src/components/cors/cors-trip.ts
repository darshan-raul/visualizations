/**
 * A small model of what a browser does with one cross-origin request: classify it, send a preflight when one is needed,
 * send the request, then decide whether the page's script may read the answer. It follows the Fetch standard's CORS
 * protocol for the cases the page draws, and nothing more. `scripts/verify-cors-lesson.mjs` replays its verdicts in Firefox.
 * Every view of a trip (the map, the steps, the headers, the DevTools rows) is drawn from `trip()`, on the server and in the browser.
 */
export type Kind = 'fetch' | 'no-cors' | 'img' | 'img-cors' | 'form';
export type Config = {
  page: string;
  target: string;
  kind: Kind;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body: 'none' | 'text' | 'json';
  auth: boolean;
  credentials: 'same-origin' | 'include' | 'omit';
  /** The script calls `res.headers.get('X-Request-Id')`. */
  readsHeader: boolean;
  /** How the server answers OPTIONS. */
  options: 204 | 405 | 401;
  acao: 'none' | 'app' | '*' | 'reflect' | 'other';
  acac: boolean;
  methods: 'basic' | 'all';
  headers: 'content-type' | 'both' | '*';
  status: 200 | 500 | 302;
  expose: boolean;
  cdn: 'none' | 'good' | 'stale';
};

export const APP = 'https://app.b.com';
export const OTHER = 'https://admin.c.com';
export const base: Config = {
  page: APP, target: 'https://api.a.com/account', kind: 'fetch', method: 'GET', body: 'none', auth: false,
  credentials: 'same-origin', readsHeader: false, options: 204, acao: 'none', acac: false, methods: 'basic',
  headers: 'content-type', status: 200, expose: false, cdn: 'none',
};

export type Leg = 'call' | 'preOut' | 'preBack' | 'out1' | 'out2' | 'back2' | 'back1' | 'release';
export type LegState = 'off' | 'sent' | 'ghost' | 'pass' | 'block' | 'opaque';
export type Line = { name: string; value: string; mark?: 'good' | 'bad' | 'note' };
export type Exchange = { title: string; request: Line[]; response: Line[] };
export type Step = { text: string; leg?: Leg; mark?: 'good' | 'bad' };
export type Part = { scheme: string; host: string; port: string };
/** One comparison the browser makes: what the request carried against what the answer granted. */
export type Check = { stage: 'preflight' | 'response'; asks: string; says: string; ok: boolean; why?: string };
export type Trip = {
  config: Config;
  page: Part;
  target: Part;
  same: boolean;
  sameSite: boolean;
  preflightWhy: string[];
  legs: Record<Leg, LegState>;
  steps: Step[];
  exchanges: Exchange[];
  /** What reached api.a.com, as its access log would show it. */
  log: string[];
  cdnNote: string;
  cookies: 'yes' | 'maybe' | 'no';
  check: { state: 'skip' | 'pass' | 'block' | 'opaque' | 'navigate'; label: string };
  preCheck?: { ok: boolean; label: string };
  /** The read check spelled out, row by row. Empty when nothing is checked. */
  checks: Check[];
  script: [string, string];
  scriptOk: boolean;
  console?: string;
  network: { name: string; method: string; status: string; type: string; mark?: 'bad' }[];
  facts: [string, string][];
  /** The first thing to change, in one line. */
  fix: string;
  curl: string;
};

const SAFE_METHODS = ['GET', 'HEAD', 'POST'];
const parts = (url: string): Part => {
  const parsed = new URL(url);
  return { scheme: parsed.protocol.replace(':', ''), host: parsed.hostname, port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80') };
};
const originOf = (url: string) => new URL(url).origin;
/** Good enough for the made-up hosts on this page: the last two labels are the site. */
const siteOf = (part: Part) => `${part.scheme}://${part.host.split('.').slice(-2).join('.')}`;
export function trip(config: Config): Trip {
  const c = { ...config };
  if (c.kind === 'img' || c.kind === 'img-cors') Object.assign(c, { method: 'GET', body: 'none', auth: false, credentials: c.kind === 'img' ? 'include' : 'same-origin' });
  if (c.kind === 'form') Object.assign(c, { method: 'POST', body: 'text', auth: false, credentials: 'include' });
  if (c.method === 'GET') c.body = 'none';
  const page = parts(c.page);
  const target = parts(c.target);
  const pageOrigin = originOf(c.page);
  const targetOrigin = originOf(c.target);
  const path = new URL(c.target).pathname;
  const same = pageOrigin === targetOrigin;
  const sameSite = siteOf(page) === siteOf(target);
  const host = target.host;

  const legs: Record<Leg, LegState> = { call: 'sent', preOut: 'off', preBack: 'off', out1: 'off', out2: 'off', back2: 'off', back1: 'off', release: 'off' };
  const steps: Step[] = [];
  const exchanges: Exchange[] = [];
  const log: string[] = [];
  const network: Trip['network'] = [];
  let console: string | undefined;
  let preCheck: Trip['preCheck'];
  const blocked = (why: string) => `Access to ${c.kind === 'img-cors' ? 'image' : 'fetch'} at '${c.target}' from origin '${pageOrigin}' has been blocked by CORS policy: ${why}`;

  // Cookies: same-origin requests carry them unless told not to. Cross-origin ones only with credentials 'include'
  // (an <img> or a form uses that by default), and a cross-site request only carries cookies marked SameSite=None.
  const wantsCookies = same ? c.credentials !== 'omit' : c.credentials === 'include';
  const cookies: Trip['cookies'] = !wantsCookies ? 'no' : same || sameSite ? 'yes' : 'maybe';
  const cookieLine: Line[] = cookies === 'no' ? [] : [{ name: 'Cookie', value: 'session=9f2c…', mark: cookies === 'maybe' ? 'note' : undefined }];

  const unsafe: string[] = [];
  const preflightWhy: string[] = [];
  if (!SAFE_METHODS.includes(c.method)) preflightWhy.push(`method ${c.method}`);
  if (c.body === 'json') { unsafe.push('content-type'); preflightWhy.push('Content-Type: application/json'); }
  if (c.auth) { unsafe.push('authorization'); preflightWhy.push('an Authorization header'); }
  unsafe.sort();

  const allowOrigin = c.acao === 'none' ? undefined : c.acao === 'app' ? APP : c.acao === '*' ? '*' : c.acao === 'reflect' ? pageOrigin : OTHER;
  const allowMethods = c.methods === 'basic' ? 'GET, POST' : 'GET, POST, PUT, DELETE';
  const allowHeaders = c.headers === 'content-type' ? 'Content-Type' : c.headers === 'both' ? 'Content-Type, Authorization' : '*';
  const corsMode = c.kind === 'fetch' || c.kind === 'img-cors';
  const include = c.credentials === 'include';

  /** The Fetch standard's CORS check, returning the reason it fails. */
  const corsCheck = (acao: string | undefined, acac: boolean): string | undefined => {
    if (acao === undefined) return "No 'Access-Control-Allow-Origin' header is present on the requested resource.";
    if (acao === '*' && include) return "The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.";
    if (acao !== '*' && acao !== pageOrigin) return `The 'Access-Control-Allow-Origin' header has a value '${acao}' that is not equal to the supplied origin.`;
    if (include && !acac) return "The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true' when the request's credentials mode is 'include'.";
    return undefined;
  };
  /** The origin and credentials rows of a CORS check, each judged on its own. */
  const grantChecks = (stage: Check['stage'], acao: string | undefined, acac: boolean, missingWhy?: string): Check[] => {
    const rows: Check[] = [{
      stage, asks: `Origin: ${pageOrigin}`, says: `Access-Control-Allow-Origin: ${acao ?? '(none)'}`,
      ok: acao === pageOrigin || (acao === '*' && !include),
      why: acao === undefined ? missingWhy ?? 'no permission at all'
        : acao === '*' ? (include ? '* is refused when cookies are sent' : '* lets any origin read')
        : acao === pageOrigin ? (c.acao === 'reflect' ? 'echoed back, whatever the origin' : 'names this origin exactly') : `names ${acao}, not this page`,
    }];
    if (include) rows.push({ stage, asks: "credentials: 'include'", says: `Access-Control-Allow-Credentials: ${acac ? 'true' : '(none)'}`, ok: acac, why: acac ? undefined : 'must be exactly true' });
    return rows;
  };
  const checks: Check[] = [];
  const grantLines = (acao: string | undefined, failed: string | undefined): Line[] => {
    const lines: Line[] = [];
    const originBad = failed && !failed.includes('Credentials');
    lines.push(acao === undefined
      ? { name: 'Access-Control-Allow-Origin', value: '(missing)', mark: 'bad' }
      : { name: 'Access-Control-Allow-Origin', value: acao, mark: originBad ? 'bad' : 'good' });
    if (c.acac) lines.push({ name: 'Access-Control-Allow-Credentials', value: 'true', mark: include ? 'good' : undefined });
    else if (include && acao !== undefined && !originBad) lines.push({ name: 'Access-Control-Allow-Credentials', value: '(missing)', mark: 'bad' });
    return lines;
  };

  steps.push({ text: `Your page at ${c.page.replace('https://', '')} runs ${c.kind === 'form' ? 'a form submission' : c.kind.startsWith('img') ? 'an <img> element' : 'fetch()'} for ${host}.`, leg: 'call' });

  let sendActual = true;
  let reason: string | undefined;
  let fix = 'Nothing to fix: this is the behaviour you want.';
  const actualReq: Line[] = [];

  if (same) {
    steps.push({ text: `Scheme, host and port all match ${pageOrigin}. Same origin: no CORS rules apply.`, mark: 'good' });
  } else if (corsMode) {
    steps.push({ text: `${targetOrigin} is a different origin, so this is a CORS request. The browser adds an Origin header.` });
  } else if (c.kind === 'form') {
    steps.push({ text: 'A form submission is a navigation, not a read by the page. It needs no permission and gets no preflight.' });
  } else {
    steps.push({ text: `Cross-origin, but ${c.kind === 'img' ? 'an <img> without crossorigin' : "mode: 'no-cors'"} asks for no permission. The browser will hand the page an opaque response.` });
  }

  // no-cors only allows the three safelisted methods, and silently drops headers that are not safelisted.
  if (c.kind === 'no-cors' && !SAFE_METHODS.includes(c.method)) {
    sendActual = false;
    reason = `fetch() with mode 'no-cors' only allows GET, HEAD and POST.`;
    console = `TypeError: '${c.method}' is unsupported in no-cors mode.`;
    steps.push({ text: `${c.method} is not allowed in no-cors mode. fetch() rejects at once and sends nothing.`, mark: 'bad' });
    fix = 'Use a normal CORS request and have the server allow the method.';
  }

  const needsPreflight = corsMode && !same && preflightWhy.length > 0 && c.kind === 'fetch';
  if (needsPreflight) {
    steps.push({ text: `This request has ${preflightWhy.join(' and ')}, which is not CORS-safelisted, so the browser asks first with OPTIONS.`, leg: 'preOut' });
    legs.preOut = 'sent';
    legs.preBack = 'sent';
    const request: Line[] = [
      { name: 'OPTIONS', value: `${path} HTTP/1.1` },
      { name: 'Origin', value: pageOrigin },
      { name: 'Access-Control-Request-Method', value: c.method },
      ...(unsafe.length ? [{ name: 'Access-Control-Request-Headers', value: unsafe.join(',') }] : []),
    ];
    let response: Line[];
    let why: string | undefined;
    if (c.options !== 204) {
      const status = c.options === 405 ? '405 Method Not Allowed' : '401 Unauthorized';
      response = [
        { name: 'HTTP/1.1', value: status, mark: 'bad' },
        c.options === 405 ? { name: 'Allow', value: 'GET, POST' } : { name: 'WWW-Authenticate', value: 'Bearer' },
      ];
      why = 'Response to preflight request doesn\'t pass access control check: It does not have HTTP ok status.';
      log.push(`OPTIONS ${path} → ${c.options}`);
      checks.push({ stage: 'preflight', asks: 'a 2xx status', says: `HTTP ${status}`, ok: false, why: 'a preflight must succeed before anything else is read' });
      fix = c.options === 405
        ? 'Make the router or gateway answer OPTIONS for this path with 204 and the CORS headers.'
        : 'Let OPTIONS through before authentication. A preflight never carries cookies or the Authorization header.';
    } else {
      why = corsCheck(allowOrigin, c.acac);
      const methodBad = !why && !SAFE_METHODS.includes(c.method) && !allowMethods.split(', ').includes(c.method);
      if (methodBad) why = `Method ${c.method} is not allowed by Access-Control-Allow-Methods in preflight response.`;
      // `*` stands for any header only without credentials, and never for Authorization.
      const headerBad = !why && unsafe.find((name) => {
        if (allowHeaders === '*') return include || name === 'authorization';
        return !allowHeaders.toLowerCase().split(', ').includes(name);
      });
      if (headerBad) why = `Request header field ${headerBad} is not allowed by Access-Control-Allow-Headers in preflight response.`;
      checks.push(...grantChecks('preflight', allowOrigin, c.acac));
      if (!SAFE_METHODS.includes(c.method)) {
        const ok = allowMethods.split(', ').includes(c.method);
        checks.push({ stage: 'preflight', asks: `Access-Control-Request-Method: ${c.method}`, says: `Access-Control-Allow-Methods: ${allowMethods}`, ok, why: ok ? undefined : `${c.method} is not listed` });
      }
      if (unsafe.length) {
        const missing = unsafe.filter((name) => allowHeaders === '*' ? include || name === 'authorization' : !allowHeaders.toLowerCase().split(', ').includes(name));
        checks.push({
          stage: 'preflight', asks: `Access-Control-Request-Headers: ${unsafe.join(',')}`, says: `Access-Control-Allow-Headers: ${allowHeaders}`, ok: !missing.length,
          why: missing.length ? `${missing.join(' and ')} not covered${allowHeaders === '*' && missing.includes('authorization') ? ': * never covers authorization' : ''}` : undefined,
        });
      }
      response = [
        { name: 'HTTP/1.1', value: '204 No Content', mark: 'good' },
        ...grantLines(allowOrigin, why && !methodBad && !headerBad ? why : undefined),
        { name: 'Access-Control-Allow-Methods', value: allowMethods, mark: methodBad ? 'bad' : SAFE_METHODS.includes(c.method) ? undefined : 'good' },
        { name: 'Access-Control-Allow-Headers', value: allowHeaders, mark: headerBad ? 'bad' : unsafe.length ? 'good' : undefined },
        { name: 'Access-Control-Max-Age', value: '600' },
      ];
      log.push(`OPTIONS ${path} → 204`);
      if (methodBad) fix = `Add ${c.method} to Access-Control-Allow-Methods on the OPTIONS response.`;
      else if (headerBad) fix = headerBad === 'authorization' && allowHeaders === '*'
        ? 'List Authorization by name in Access-Control-Allow-Headers. The wildcard never covers it.'
        : allowHeaders === '*' ? 'With credentials, list each header by name: `*` is read literally.' : `Add ${headerBad === 'authorization' ? 'Authorization' : 'Content-Type'} to Access-Control-Allow-Headers.`;
      else if (why) fix = originFix(why);
    }
    exchanges.push({ title: 'Preflight', request, response });
    network.push({ name: `${path.split('/').pop()}`, method: 'OPTIONS', status: String(c.options), type: 'preflight', mark: why ? 'bad' : undefined });
    if (why) {
      sendActual = false;
      reason = why;
      preCheck = { ok: false, label: 'preflight failed' };
      steps.push({ text: `The preflight answer does not give permission, so the browser stops here. The ${c.method} is never sent.`, leg: 'preBack', mark: 'bad' });
    } else {
      preCheck = { ok: true, label: 'preflight ok' };
      steps.push({ text: `The answer allows ${pageOrigin}, ${c.method}${unsafe.length ? ` and ${unsafe.join(', ')}` : ''}. The browser goes ahead.`, leg: 'preBack', mark: 'good' });
    }
  } else if (corsMode && !same && c.kind === 'fetch') {
    steps.push({ text: `${c.method}${c.body === 'text' ? ' with a text/plain body' : ''} is CORS-safelisted, so there is no preflight. The request goes straight out.` });
  }

  let check: Trip['check'] = { state: 'skip', label: 'same origin · no check' };
  let script: [string, string] = ['', ''];
  let scriptOk = false;
  const xid = 'X-Request-Id';

  if (!sendActual) {
    legs.out1 = legs.out2 = 'ghost';
    legs.release = 'block';
    check = { state: 'block', label: needsPreflight ? 'request not sent' : 'rejected' };
    script = c.kind === 'no-cors' ? ['a rejected promise', 'TypeError, nothing sent'] : ['TypeError: Failed to fetch', 'no status, no headers, no body'];
    console = console ?? blocked(reason ?? '');
  } else {
    const body = c.body === 'json' ? [{ name: 'Content-Type', value: 'application/json' }] : c.body === 'text' ? [{ name: 'Content-Type', value: c.kind === 'form' ? 'application/x-www-form-urlencoded' : 'text/plain' }] : [];
    const dropped = c.kind === 'no-cors' ? [c.body === 'json' ? 'Content-Type: application/json' : '', c.auth ? 'Authorization' : ''].filter(Boolean) : [];
    actualReq.push(
      { name: c.method, value: `${path} HTTP/1.1` },
      // Origin goes on every CORS request and on anything that is not GET or HEAD.
      ...((corsMode && !same) || c.method !== 'GET' ? [{ name: 'Origin', value: pageOrigin }] : []),
      ...(dropped.length ? [{ name: '(silently dropped)', value: dropped.join(', '), mark: 'bad' as const }] : []),
      ...(c.kind === 'no-cors' && c.body === 'json' ? [{ name: 'Content-Type', value: 'text/plain;charset=UTF-8' }] : body),
      ...(c.auth && c.kind === 'fetch' ? [{ name: 'Authorization', value: 'Bearer eyJhbGciOi…' }] : []),
      ...cookieLine,
    );
    legs.out1 = 'sent';
    steps.push({ text: `The ${c.method} goes out${cookies === 'yes' ? ' with the session cookie' : cookies === 'maybe' ? ', with the cookie only if it is marked SameSite=None' : ''}.`, leg: 'out1' });

    // Where the answer comes from, and what it says.
    const stale = c.cdn === 'stale' && !same;
    let acao = allowOrigin;
    let status = c.status;
    if (stale) { acao = OTHER; status = 200; }
    if (!stale) { legs.out2 = legs.back2 = 'sent'; log.push(`${c.method} ${path} → ${status}${c.method !== 'GET' && status === 200 ? ' · saved' : ''}`); }
    legs.back1 = 'sent';
    const corsHeaders = status === 200;
    const statusText = status === 200 ? '200 OK' : status === 500 ? '500 Internal Server Error' : '302 Found';
    const grantAcao = corsHeaders ? acao : undefined;
    const why = corsMode && !same ? corsCheck(grantAcao, corsHeaders && c.acac) : undefined;
    if (corsMode && !same) {
      checks.push(...grantChecks('response', grantAcao, corsHeaders && c.acac, status !== 200 ? `the ${statusText} carries no CORS headers` : undefined));
      if (stale) checks[checks.length - (include ? 2 : 1)].why = 'a cached copy made for admin.c.com';
      if (c.readsHeader && c.kind === 'fetch' && !why) checks.push({ stage: 'response', asks: `headers.get('${xid}')`, says: `Access-Control-Expose-Headers: ${corsHeaders && c.expose ? xid : '(none)'}`, ok: corsHeaders && c.expose, why: corsHeaders && c.expose ? undefined : 'only that header is hidden; the rest is shared' });
    }
    const response: Line[] = [
      { name: 'HTTP/1.1', value: statusText, mark: status === 200 ? undefined : 'bad' },
      ...(corsMode && !same ? grantLines(grantAcao, why) : []),
      ...(corsHeaders && c.expose && corsMode ? [{ name: 'Access-Control-Expose-Headers', value: xid, mark: c.readsHeader ? 'good' as const : undefined }] : []),
      ...(status === 302 ? [{ name: 'Location', value: 'https://login.a.com/?next=/account' }] : []),
      ...(corsHeaders && (c.acao === 'reflect' || c.cdn !== 'none') ? [{ name: 'Vary', value: 'Origin' }] : []),
      ...(stale ? [{ name: 'X-Cache', value: 'Hit from cloudfront', mark: 'bad' as const }, { name: 'Age', value: '212' }] : []),
      { name: 'Content-Type', value: c.kind.startsWith('img') ? 'image/png' : status === 200 ? 'application/json' : 'text/html' },
      ...(status === 200 && c.kind === 'fetch' ? [{ name: xid, value: '7f3a91', mark: c.readsHeader && !c.expose ? 'note' as const : undefined }] : []),
    ];
    exchanges.push({ title: needsPreflight ? 'Actual request' : 'Request', request: actualReq, response });
    network.push({ name: path.split('/').pop() || '/', method: c.method, status: String(status), type: c.kind === 'form' ? 'document' : c.kind.startsWith('img') ? 'png' : 'fetch', mark: why ? 'bad' : undefined });
    steps.push({
      text: stale
        ? 'The CDN answers from its cache. That copy was stored for another origin and still names it.'
        : `${host} answers ${statusText}${status !== 200 ? ' and, like many error and redirect paths, adds no CORS headers' : ''}.`,
      leg: stale ? 'back1' : 'back2', mark: stale || status !== 200 ? 'bad' : undefined,
    });

    if (same) {
      legs.release = 'pass';
      scriptOk = true;
      script = [status === 302 ? 'the login page, after the redirect' : `status ${status} and the body`, status === 500 ? 'a real 500 it can show or retry' : 'headers and all'];
      steps.push({ text: 'The browser hands the whole response to your script.', leg: 'release', mark: 'good' });
    } else if (c.kind === 'img' || c.kind === 'no-cors') {
      legs.release = 'opaque';
      check = { state: 'opaque', label: 'opaque · no check' };
      script = c.kind === 'img'
        ? ['the picture, on screen', 'pixels unreadable: a canvas it is drawn into is tainted']
        : ['an opaque response', 'type "opaque", status 0, no headers, no body'];
      steps.push({ text: c.kind === 'img' ? 'The image is displayed. The page can show it but its script cannot read the bytes.' : 'The browser hands back a sealed response: it exists, and that is all the script learns.', leg: 'release' });
      fix = c.kind === 'img' ? 'To read the pixels, add crossorigin to the <img> and have the server send Access-Control-Allow-Origin.' : "Drop mode: 'no-cors' and have the server send CORS headers. no-cors never makes a response readable.";
    } else if (c.kind === 'form') {
      legs.release = 'off';
      check = { state: 'navigate', label: 'navigation · no read' };
      script = ['nothing to read', 'the tab navigates to the answer'];
      steps.push({ text: `The tab navigates to ${host}'s answer. The request did its work on the server; CORS never came into it.`, mark: 'bad' });
      fix = 'Defend the endpoint itself: a CSRF token, SameSite=Lax or Strict cookies, or rejecting cross-site Sec-Fetch-Site.';
    } else if (why) {
      legs.release = 'block';
      check = { state: 'block', label: 'blocked' };
      script = c.kind === 'img-cors' ? ['an error event', 'the image does not load at all'] : ['TypeError: Failed to fetch', `the ${status} stays hidden from it`];
      console = blocked(why);
      steps.push({ text: `The browser checks the answer for permission and finds none that fits. Your script gets an error, not the ${status}.`, leg: 'release', mark: 'bad' });
      fix = stale ? 'Make the CDN cache per Origin (add Origin to the cache key) or set the CORS headers at the edge.'
        : status === 500 ? 'Find out why the server returned 500. Then add CORS headers to error responses so the next one is readable.'
        : status === 302 ? 'Answer an expired session with 401 and CORS headers, and let the page send the user to log in.'
        : originFix(why);
    } else {
      legs.release = 'pass';
      scriptOk = true;
      check = { state: 'pass', label: 'shared' };
      const hidden = c.readsHeader && !c.expose;
      script = [`status ${status} and the body`, c.readsHeader ? `headers.get('${xid}') → ${hidden ? 'null' : "'7f3a91'"}` : 'and the basic headers'];
      steps.push({ text: hidden ? `The browser shares the response, but hides ${xid}: it is not in Access-Control-Expose-Headers.` : 'The answer names this origin, so the browser hands the response to your script.', leg: 'release', mark: hidden ? undefined : 'good' });
      if (hidden) fix = `Add Access-Control-Expose-Headers: ${xid} to the response.`;
      if (c.acao === 'reflect' && include && c.page !== APP) fix = 'Check Origin against an allow-list before echoing it. Reflecting any origin with credentials hands every site your users\' data.';
    }
  }

  // Every step should draw something: a sentence with no leg of its own joins the next step that has one (or the last).
  const drawn: Step[] = [];
  let carry: Step[] = [];
  for (const step of steps) {
    if (!step.leg) { carry.push(step); continue; }
    drawn.push({ ...step, text: [...carry, step].map((item) => item.text).join(' '), mark: step.mark ?? carry.findLast((item) => item.mark)?.mark });
    carry = [];
  }
  if (carry.length && drawn.length) {
    const lastStep = drawn[drawn.length - 1];
    drawn[drawn.length - 1] = { ...lastStep, text: [lastStep, ...carry].map((item) => item.text).join(' '), mark: carry.findLast((item) => item.mark)?.mark ?? lastStep.mark };
  }
  steps.splice(0, steps.length, ...drawn);

  const cdnNote = c.cdn === 'none' || same ? '' : c.cdn === 'stale' ? 'HIT · a 200 stored for admin.c.com' : 'MISS · Origin forwarded, in the cache key';
  if (!log.length) log.push(c.cdn === 'stale' && sendActual ? '(nothing: the CDN answered)' : '(nothing arrived)');

  const facts: [string, string][] = [
    ['Reached the server?', log[0].startsWith('(') ? 'No' : log.some((line) => !line.startsWith('OPTIONS')) ? 'Yes' : 'Only the preflight'],
    ['Preflight?', needsPreflight ? `Yes: ${preflightWhy.join(', ')}` : same ? 'No: same origin' : corsMode ? 'No: safelisted request' : 'No: not a CORS request'],
    ['Cookies sent?', cookies === 'yes' ? 'Yes' : cookies === 'maybe' ? 'Only if SameSite=None' : 'No'],
    ['Your script gets', script[0]],
  ];

  const curlLines = needsPreflight
    ? [`curl -i -X OPTIONS ${c.target} \\`, `  -H 'Origin: ${pageOrigin}' \\`, `  -H 'Access-Control-Request-Method: ${c.method}'${unsafe.length ? ' \\' : ''}`, ...(unsafe.length ? [`  -H 'Access-Control-Request-Headers: ${unsafe.join(',')}'`] : [])]
    : [`curl -i ${c.target} \\`, `  -H 'Origin: ${pageOrigin}'`];
  return {
    config: c, page, target, same, sameSite, preflightWhy, legs, steps, exchanges, log, cdnNote, cookies, check, preCheck, checks,
    script, scriptOk, console, network, facts, fix, curl: curlLines.join('\n'),
  };
}

function originFix(why: string) {
  if (why.includes('wildcard')) return 'With credentials, name the origin: Access-Control-Allow-Origin: https://app.b.com, plus Allow-Credentials: true.';
  if (why.includes('Credentials')) return 'Add Access-Control-Allow-Credentials: true to the response.';
  if (why.includes('not equal')) return 'Return the calling origin, chosen from an allow-list, in Access-Control-Allow-Origin.';
  return 'Have the server send Access-Control-Allow-Origin: https://app.b.com.';
}

/** Leg classes and SVG text for the trip map. Used by the Astro component and by the client after every change. */
export function view(t: Trip) {
  const c = t.config;
  const path = new URL(c.target).pathname;
  const order = t.steps.map((step) => step.leg).filter(Boolean) as Leg[];
  const actual = t.exchanges.at(-1);
  const status = actual?.response[0]?.value ?? '';
  const pre = t.exchanges.length === 2 || (t.exchanges.length === 1 && t.exchanges[0].title === 'Preflight') ? t.exchanges[0] : undefined;
  // When each part of the map appears during playback: a leg with its own step, or with the leg it continues.
  const stepOf = (leg: Leg) => t.steps.findIndex((step) => step.leg === leg);
  const last = t.steps.length - 1;
  const at: Record<string, number> = {};
  const badge: Partial<Record<Leg, number>> = {};
  (Object.keys(t.legs) as Leg[]).forEach((leg) => {
    const own = stepOf(leg);
    if (own >= 0) badge[leg] = own + 1;
    const partner = ({ out2: 'out1', back1: 'back2', back2: 'back1', preBack: 'preOut' } as Partial<Record<Leg, Leg>>)[leg];
    at[leg] = own >= 0 ? own : partner && stepOf(partner) >= 0 ? stepOf(partner) : last;
  });
  if (t.legs.out1 === 'ghost') at.out1 = at.out2 = stepOf('preBack');
  at.preCheck = at.preBack;
  at.check = at.gets = last;
  at.log1 = t.legs.preOut === 'sent' ? at.preBack : at.back2 ?? last;
  at.log2 = at.back2;
  at.cdn = at.jar = at.out1;
  const short = (value: string) => value.length > 26 ? `${value.slice(0, 25)}…` : value;
  return {
    legs: t.legs,
    order,
    at,
    badge,
    steps: t.steps.length,
    text: {
      tab: c.page.replace('https://', ''),
      who: c.kind === 'form' ? 'a form on the page' : c.kind.startsWith('img') ? 'an image on the page' : 'your script',
      code: short(c.kind === 'form' ? '<form method="post">' : c.kind === 'img' ? '<img src="…/logo.png">' : c.kind === 'img-cors' ? '<img crossorigin src=…>' : `fetch(…${path})`),
      gets1: short(t.script[0]),
      gets2: t.script[1].length > 34 ? `${t.script[1].slice(0, 33)}…` : t.script[1],
      preOut: `OPTIONS ${path}`,
      preBack: pre ? pre.response[0].value : '',
      out: t.legs.out1 === 'ghost' ? `${c.method} — NOT SENT` : `${c.method} ${path}`,
      back: t.legs.back2 === 'sent' ? status : '',
      check: `${({ skip: '–', pass: '✓', block: '✕', opaque: '◐', navigate: '→' })[t.check.state]} ${t.check.label}`,
      preCheck: t.preCheck ? `${t.preCheck.ok ? '✓' : '✕'} ${t.preCheck.label}` : '',
      server: t.target.host,
      log1: t.log[0] ?? '', log2: t.log[1] ?? '', log3: t.log[2] ?? '',
      cdn: t.cdnNote,
      jar: t.cookies === 'yes' ? 'cookie attached' : t.cookies === 'maybe' ? 'cookie if SameSite=None' : 'no cookie',
    },
    state: {
      check: t.check.state,
      preCheck: t.preCheck ? (t.preCheck.ok ? 'pass' : 'block') : 'off',
      cdn: c.cdn === 'none' || t.same ? 'off' : c.cdn,
      jar: t.cookies,
      gets: t.scriptOk ? 'pass' : t.check.state === 'opaque' || t.check.state === 'navigate' ? 'opaque' : 'block',
    },
  };
}

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mark = { good: '✓', bad: '✕', note: '!' } as const;
const lines = (items: Line[]) => items.map((line) => `<li${line.mark ? ` class="is-${line.mark}"` : ''}><b>${escape(line.name)}${line.name.startsWith('HTTP') || /^[A-Z]+$/.test(line.name) ? '' : ':'}</b> <span>${escape(line.value)}</span>${line.mark ? `<i aria-label="${line.mark === 'good' ? 'grants' : line.mark === 'bad' ? 'the problem' : 'note'}">${mark[line.mark]}</i>` : ''}</li>`).join('');

/** The two questions the map answers, in words. */
export function answers(t: Trip) {
  const reached = t.log[0].startsWith('(') ? (t.cdnNote.startsWith('HIT') ? 'No: the CDN answered' : 'No: it was never sent') : t.log.every((line) => line.startsWith('OPTIONS')) ? 'No: only the OPTIONS' : 'Yes';
  const read = t.scriptOk
    ? (t.config.readsHeader && !t.config.expose ? 'Yes, but not X-Request-Id' : 'Yes')
    : t.check.state === 'opaque' ? 'It can use it, not read it' : t.check.state === 'navigate' ? 'Nothing to read: the tab navigates' : 'No';
  const tone = (value: string) => value.startsWith('Yes') ? 'yes' : value.startsWith('No') ? 'no' : 'partly';
  return [
    { question: 'Did the request reach the server?', answer: reached, tone: tone(reached) },
    { question: 'Can the script read the response?', answer: read, tone: tone(read) },
  ];
}

export function answersHtml(t: Trip) {
  return answers(t).map((item) => `<div class="cors-answer is-${item.tone}"><span>${item.question}</span><b>${escape(item.answer)}</b></div>`).join('');
}

/** The read check, spelled out: what the request carried, what the answer granted, and whether they fit. */
export function checksHtml(t: Trip) {
  const v = view(t);
  const c = t.config;
  const empty = t.same ? 'Same origin. There is nothing to compare: the script reads the answer whatever its headers say.'
    : c.kind === 'form' ? 'A form post is a navigation. The page never reads the answer, so nothing is compared.'
    : c.kind === 'img' || c.kind === 'no-cors' ? 'No permission was asked for, so none is compared. The page gets an opaque response it can use but not read.'
    : '';
  const row = (check: Check) => `<li class="${check.ok ? 'is-ok' : 'is-bad'}"><code>${escape(check.asks)}</code><i aria-hidden="true">${check.ok ? '✓' : '✕'}</i><code>${escape(check.says)}</code>${check.why ? `<small><span class="sr-only">${check.ok ? 'Fits' : 'Fails'}: </span>${escape(check.why)}</small>` : `<small class="sr-only">${check.ok ? 'Fits' : 'Fails'}</small>`}</li>`;
  const stage = (name: Check['stage'], title: string, when: number) => {
    const rows = t.checks.filter((check) => check.stage === name);
    return rows.length ? `<div class="cors-check-group" data-when="${name}" data-at="${when}"><h4>${title}</h4><ul>${rows.map(row).join('')}</ul></div>` : '';
  };
  const notSent = t.legs.out1 === 'ghost' && t.legs.preOut === 'sent' ? `<p class="cors-check-note" data-at="${v.at.preBack}">The ${escape(c.method)} was never sent, so there is no answer to check.</p>` : '';
  return `<div class="cors-check-head"><span>AT THE READ CHECK</span><span>the request carried</span><span>the answer granted</span></div>
${empty ? `<p class="cors-check-note">${empty}</p>` : `${stage('preflight', `OPTIONS answer`, v.at.preBack)}${notSent}${stage('response', `${escape(c.method)} answer`, v.at.release)}`}`;
}

/** Everything behind "Inspect the exchange": steps, the fix, headers, DevTools, curl. */
export function inspect(t: Trip) {
  const steps = t.steps.map((step, index) => `<li data-cors-step="${index}"${step.mark ? ` class="is-${step.mark}"` : ''}><span>${index + 1}</span><p>${escape(step.text)}</p></li>`).join('');
  const exchanges = t.exchanges.map((exchange) => `<div class="cors-exchange"><h4>${exchange.title}</h4><div><span>BROWSER SENT</span><ul>${lines(exchange.request)}</ul></div><div><span>SERVER ANSWERED</span><ul>${lines(exchange.response)}</ul></div></div>`).join('');
  const notSent = t.legs.out1 === 'ghost' ? `<p class="cors-ghost">${escape(t.config.method)} ${escape(new URL(t.config.target).pathname)} — not sent</p>` : '';
  const rows = t.network.map((row) => `<tr${row.mark ? ' class="is-bad"' : ''}><td>${escape(row.name)}</td><td>${row.method}</td><td>${row.status}${row.mark ? ' <em>CORS error</em>' : ''}</td><td>${row.type}</td></tr>`).join('');
  return `<ol class="cors-steps">${steps}</ol>
<p class="cors-fix ${t.scriptOk && !t.fix.includes('allow-list') && !t.fix.includes('Expose') ? 'is-ok' : ''}"><span>${t.scriptOk && !t.fix.includes('allow-list') && !t.fix.includes('Expose') ? 'WHY IT WORKS' : 'FIRST THING TO CHANGE'}</span>${escape(t.scriptOk && t.fix.startsWith('Nothing') ? (t.same ? 'Same origin: the browser needs no permission from the server.' : 'The answer carries a permission that fits this origin and this credentials mode.') : t.fix)}</p>
<div class="cors-wire">${exchanges}${notSent}</div>
<div class="cors-devtools"><span class="cors-devtools-title">DEVTOOLS · NETWORK</span>
<table><thead><tr><th>Name</th><th>Method</th><th>Status</th><th>Type</th></tr></thead><tbody>${rows || '<tr><td colspan="4">(no rows: nothing was sent)</td></tr>'}</tbody></table>
${t.console ? `<p class="cors-console-line"><span>CONSOLE</span>${escape(t.console)}</p>` : ''}</div>
<div class="cors-curl"><span>HEADER CHECK WITH CURL · curl shows the headers; it does not enforce CORS</span><pre><code>${escape(t.curl)}</code></pre></div>`;
}
