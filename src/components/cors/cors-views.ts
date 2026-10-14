/**
 * The views of the CORS page. Each view after Origins has two to four choices; a choice is a preset of the model
 * in cors-trip.ts plus the sentence that explains it. The map and the exchange are drawn from `trip(choice.config)`.
 */
import { base, type Config } from './cors-trip.ts';

export const sources = [
  { label: 'Fetch standard: the CORS protocol', url: 'https://fetch.spec.whatwg.org/#http-cors-protocol' },
  { label: 'Fetch standard: CORS-safelisted request headers', url: 'https://fetch.spec.whatwg.org/#cors-safelisted-request-header' },
  { label: 'Fetch standard: CORS-preflight fetch', url: 'https://fetch.spec.whatwg.org/#cors-preflight-fetch' },
  { label: 'Fetch standard: CORS protocol and credentials', url: 'https://fetch.spec.whatwg.org/#cors-protocol-and-credentials' },
  { label: 'Fetch standard: CORS check', url: 'https://fetch.spec.whatwg.org/#cors-check' },
  { label: 'HTML standard: origins', url: 'https://html.spec.whatwg.org/multipage/browsers.html#origin' },
  { label: 'HTML standard: same site', url: 'https://html.spec.whatwg.org/multipage/browsers.html#same-site' },
  { label: 'HTML standard: CORS settings attributes', url: 'https://html.spec.whatwg.org/multipage/urls-and-fetching.html#cors-settings-attributes' },
  { label: 'HTML standard: security with canvas elements', url: 'https://html.spec.whatwg.org/multipage/canvas.html#security-with-canvas-elements' },
  { label: 'MDN: Cross-Origin Resource Sharing', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS' },
  { label: 'MDN: CORS errors', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors' },
  { label: 'MDN: Cross-site request forgery', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF' },
  { label: 'IETF: Cookies (RFC 6265bis), SameSite', url: 'https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/' },
  { label: 'AWS: CloudFront caching based on request headers', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/header-caching.html' },
  { label: 'AWS: CloudFront response headers policies', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/modifying-response-headers.html' },
  { label: 'Fetch standard: opaque filtered response', url: 'https://fetch.spec.whatwg.org/#concept-filtered-response-opaque' },
  { label: 'W3C: Fetch Metadata request headers', url: 'https://www.w3.org/TR/fetch-metadata/' },
  { label: 'Fetch standard: CORS-safelisted method', url: 'https://fetch.spec.whatwg.org/#cors-safelisted-method' },
  { label: 'Fetch standard: CORS-safelisted response header names', url: 'https://fetch.spec.whatwg.org/#cors-safelisted-response-header-name' },
  { label: 'Fetch standard: HTTP-redirect fetch', url: 'https://fetch.spec.whatwg.org/#http-redirect-fetch' },
];
const [CORS, SAFE_HEADERS, PREFLIGHT, CREDENTIALS, CHECK, ORIGIN, SITE, CORS_ATTR, CANVAS, MDN, MDN_ERRORS, CSRF, SAMESITE, CF_HEADERS, CF_POLICY, OPAQUE, FETCH_METADATA, SAFE_METHOD, SAFE_RESPONSE, REDIRECT] = sources.map((_, index) => index);

export type Choice = {
  id: string;
  /** Button text: what this choice changes. */
  label: string;
  /** One or two sentences, shown beside the result. */
  explain: string;
  config: Config;
  /** Find the failure: which diagnostic question catches this case (0-based). */
  catches?: number;
};
export type View = {
  id: string;
  group: string;
  label: string;
  says: string;
  intro: string;
  /** What the choice buttons vary, said as a question or a label. */
  choose: string;
  choices: Choice[];
  note: string;
  sources: number[];
  takeaway: string;
};

export const groups = [
  { id: 'basics', name: 'Basics' },
  { id: 'requests', name: 'Requests' },
  { id: 'troubleshooting', name: 'Troubleshooting' },
];

const at = (config: Partial<Config>): Config => ({ ...base, ...config });
const json: Partial<Config> = { method: 'POST', body: 'json', auth: true, acao: 'app', headers: 'both' };

/** Origins (view 01) is drawn by CorsOrigin.astro; the views below are drawn on the trip map. */
export const ORIGINS = { id: 'what-is-an-origin', group: 'basics', label: 'Origins', takeaway: 'An origin is scheme + host + port. Same origin means all three match; anything else is a different origin, and reading from it needs permission.' };

export const views: View[] = [
  {
    id: 'reading-the-response', group: 'basics', label: 'Reading the response',
    says: 'The request goes out either way. The answer decides whether the script may read it.',
    intro: 'Start where nothing can go wrong: the dashboard asks its own origin for the account. Then point the same plain GET at api.a.com. The browser still sends it straight away, but now it adds an Origin header naming app.b.com, and when the answer comes back it looks for a header that grants app.b.com permission to read it.',
    choose: 'Ask the page\'s own origin, or api.a.com with three answers',
    choices: [
      { id: 'same-origin', label: 'Same origin', config: at({ target: 'https://app.b.com/api/account' }),
        explain: 'Scheme, host and port all match the page, so the browser has nothing to check. The script reads the status, the body and every header, whatever the server sends.' },
      { id: 'site', label: 'No Allow-Origin', config: at({}),
        explain: 'The API answers 200 with the data, but names no origin that may read it. The browser keeps the response and hands the script a TypeError. The server did the work and logged a 200 anyway.' },
      { id: 'simple-ok', label: 'Allow-Origin: https://app.b.com', config: at({ acao: 'app' }),
        explain: 'The answer names app.b.com, which matches the Origin the browser sent, so the script gets the status, the body and the basic headers.' },
      { id: 'wildcard', label: 'Allow-Origin: *', config: at({ acao: '*' }),
        explain: '* means any origin may read it. That works here because the request carries no cookies. The Credentials view shows where it stops working.' },
    ],
    note: 'Access-Control-Allow-Origin holds one origin or *, never a list. To allow several, check the Origin header against an allow-list, echo the match, and send Vary: Origin so caches keep the answers apart. And because the request already reached the server, CORS can\'t protect a server from requests; it protects the response from being read.',
    sources: [CORS, CHECK, MDN],
    takeaway: 'A cross-origin request can reach the server and succeed there while the script still gets nothing. CORS decides who may read, not who may send.',
  },
  {
    id: 'preflight', group: 'requests', label: 'Preflight',
    says: 'Some requests make the browser ask first. A refusal means the real request never leaves.',
    intro: 'Now the dashboard POSTs JSON with a bearer token. Neither Content-Type: application/json nor the Authorization header is on the browser\'s short list of safe request features, so before sending the POST it sends an OPTIONS request naming the method and headers it wants to use.',
    choose: 'How api.a.com answers the OPTIONS',
    choices: [
      { id: 'preflight-ok', label: 'Allows both headers', config: at(json),
        explain: 'The 204 allows app.b.com and lists Content-Type and Authorization. Only then does the browser send the POST, and the answer is checked again on the way back.' },
      { id: 'header-missing', label: 'Leaves out Authorization', config: at({ ...json, headers: 'content-type' }),
        explain: 'The OPTIONS gets a 204, but Allow-Headers lists only Content-Type. The browser stops. The server\'s log shows one OPTIONS and no POST: nothing was saved.' },
      { id: 'preflight-405', label: 'Not handled: 405', config: at({ ...json, options: 405 }),
        explain: 'The router has no route for OPTIONS and answers 405. A preflight needs a 2xx, so the POST is never sent.' },
    ],
    note: 'GET, HEAD and POST never need listing in Allow-Methods; PUT, PATCH and DELETE do. Allow-Headers: * covers most headers without credentials but, under the Fetch standard, never Authorization. Chromium enforces that; Firefox 154 still lets the wildcard cover it by default. Access-Control-Max-Age lets the browser reuse a preflight answer for a while, capped by each browser.',
    sources: [PREFLIGHT, SAFE_HEADERS, SAFE_METHOD],
    takeaway: 'A failed preflight means the request was never sent. A JSON body or an Authorization header is enough to need one.',
  },
  {
    id: 'credentials', group: 'requests', label: 'Credentials',
    says: 'Sending cookies raises the bar: the answer must name you and say so twice.',
    intro: 'The dashboard needs the user\'s session on api.a.com, so it calls fetch with credentials: \'include\' and the browser attaches the cookie. For an answer built from someone\'s cookie, the browser wants two things: Allow-Origin naming app.b.com exactly, and Allow-Credentials: true.',
    choose: 'What api.a.com sends back',
    choices: [
      { id: 'wildcard-creds', label: 'Allow-Origin: *', config: at({ credentials: 'include', acao: '*', acac: true }),
        explain: '* means anyone may read this, and a response built from a cookie is the opposite of public. With credentials the browser refuses the wildcard, even with Allow-Credentials: true.' },
      { id: 'creds-no-acac', label: 'Names app.b.com only', config: at({ credentials: 'include', acao: 'app' }),
        explain: 'The origin matches, but Allow-Credentials: true is missing. The value has to be exactly true; leaving it out fails.' },
      { id: 'creds-ok', label: 'Names app.b.com + Allow-Credentials', config: at({ credentials: 'include', acao: 'app', acac: true }),
        explain: 'Both conditions hold, so the script reads the user\'s account.' },
      { id: 'reflect-any', label: 'Echoes any Origin', config: at({ page: 'https://evil.example', credentials: 'include', acao: 'reflect', acac: true }),
        explain: 'Someone made the errors go away by copying any Origin into Allow-Origin. Now a script on evil.example sends the visitor\'s cookie and reads their account. Check Origin against an exact allow-list instead.' },
    ],
    note: 'app.b.com and api.a.com are different sites, so the cookie only goes if it was set with SameSite=None; Secure, and a browser that blocks third-party cookies may hold it back anyway. CORS can\'t change that; serving the API from the same site can. With credentials, * in Allow-Headers, Allow-Methods and Expose-Headers is read literally too.',
    sources: [CREDENTIALS, SAMESITE, CHECK],
    takeaway: 'With credentials the wildcard stops working: the answer must name the origin and add Allow-Credentials: true, and the name must come from an allow-list.',
  },
  {
    id: 'find-the-failure', group: 'troubleshooting', label: 'Find the failure',
    says: 'The console blames CORS. The Network tab says what actually went wrong.',
    intro: 'Anything that comes back without the right headers shows up as a CORS error, so the console message rarely names the cause. Work through the exchange in order and stop at the first answer that isn\'t what you expected.',
    choose: 'A failure to diagnose',
    choices: [
      { id: 'options-401', label: 'Auth rejects OPTIONS', config: at({ ...json, options: 401 }), catches: 0,
        explain: 'Authentication runs before anything else and demands a token, but a preflight never carries cookies or Authorization. It gets 401, so the POST is never sent. Let OPTIONS through authentication, in the app, the gateway and any WAF.' },
      { id: 'error-500', label: 'A 500 without CORS headers', config: at({ acao: 'app', status: 500 }), catches: 1,
        explain: 'The handler crashed, and the framework\'s error page adds no CORS headers. The real failure is the 500. Fix it, and add CORS headers in the outermost layer so errors are readable next time.' },
      { id: 'redirect-302', label: 'Redirect to login', config: at({ acao: 'app', status: 302 }), catches: 1,
        explain: 'The session expired and the API redirected to login.a.com, as it would for a page. The 302 has no CORS headers, so the browser stops there. An API should answer 401 and let the page decide.' },
      { id: 'cdn-stale', label: 'CDN cached another origin\'s answer', config: at({ acao: 'reflect', cdn: 'stale' }), catches: 3,
        explain: 'The edge\'s cache key ignores Origin, so it serves a copy made for admin.c.com, and the API never sees the request. Put Origin in the cache key, or set the CORS headers at the edge.' },
    ],
    note: 'Each response in a redirect chain needs its own permission, and after a redirect to yet another origin the browser sends Origin: null. Vary: Origin informs caches that honour it; in CloudFront what counts is the cache policy or a response headers policy. curl shows the headers a server returns, but it doesn\'t enforce CORS, so a working curl proves little.',
    sources: [MDN_ERRORS, REDIRECT, CF_HEADERS, CF_POLICY],
    takeaway: 'Find the first exchange that really failed before changing CORS headers. The console\'s CORS error is often only the messenger.',
  },
  {
    id: 'common-traps', group: 'troubleshooting', label: 'Common traps',
    says: 'Loading, sending and reading are three different things.',
    intro: 'CORS guards what a page\'s script can read. Plenty still crosses origins without asking, and some of what looks like a fix only hides the answer.',
    choose: 'A trap',
    choices: [
      { id: 'no-cors', label: "mode: 'no-cors'", config: at({ kind: 'no-cors' }),
        explain: 'The request goes and the console stays quiet, but the script gets an opaque response: status 0, no headers, no body. It is never a fix for an API you need to read, and it drops headers like Authorization.' },
      { id: 'img', label: 'An <img> from another origin', config: at({ kind: 'img', target: 'https://api.a.com/logo.png' }),
        explain: 'The image loads and shows without permission, but script can\'t read its pixels: a canvas it is drawn into becomes tainted. With the crossorigin attribute and an Allow-Origin header, it can.' },
      { id: 'form-csrf', label: 'A form post from another site', config: at({ kind: 'form', page: 'https://evil.example', target: 'https://api.a.com/account/email' }),
        explain: 'A page on evil.example submits a form to api.a.com. It is a navigation, so there is no preflight and no check, and if the cookie goes, the email changes. That is CSRF: defend with a token, SameSite cookies or Sec-Fetch-Site.' },
      { id: 'expose', label: 'A custom header reads null', config: at({ acao: 'app', readsHeader: true }),
        explain: 'The response is shared and the JSON reads fine, but X-Request-Id comes back null. Scripts only see basic response headers unless the server lists others in Access-Control-Expose-Headers.' },
    ],
    note: 'Allow-Headers is about what may go to the server; Expose-Headers is about what the script may read from the answer. Module scripts and web fonts are always fetched in CORS mode, so they need permission like fetch() does.',
    sources: [OPAQUE, CANVAS, CORS_ATTR, CSRF, FETCH_METADATA, SAFE_RESPONSE],
    takeaway: 'Loading and sending across origins is allowed by default. Reading the answer is the part that needs permission.',
  },
];

/** The diagnostic questions in Find the failure, in the order to ask them. */
export const diagnosis = [
  'Is there an OPTIONS row, and did it get a 2xx?',
  'Did the real request go out, and what status came back?',
  'Does the answer\'s Allow-Origin name this page\'s origin?',
  'Did a cache or proxy produce the answer?',
];

/** Fragments from the first version of the page, which had one view per trip. */
export const aliases: Record<string, [string, string?]> = Object.fromEntries([
  ...['subdomain', 'port'].map((id) => [`trip-${id}`, [ORIGINS.id]]),
  ['trip-img-cors', ['common-traps', 'img']],
  ...views.flatMap((view) => view.choices.map((choice) => [`trip-${choice.id}`, [view.id, choice.id]])),
]);

/** Every choice, for the replay script. */
export const allChoices = views.flatMap((view) => view.choices.map((choice) => ({ ...choice, view: view.id })));

export const related = [
  { label: 'HTTP Status Codes as a City Map', href: '/http-status-codes' },
  { label: 'Networking, Illustrated', href: '/networking' },
  { label: 'AWS Load Balancers', href: '/aws-load-balancers' },
];
