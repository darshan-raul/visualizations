/**
 * HTTP status codes as a city: five districts, one per first digit, and a sign for each code.
 * Everything the page says about a code lives here; the map and the detail panels are drawn from it.
 */
export type Family = 1 | 2 | 3 | 4 | 5;
export type District = {
  family: Family;
  name: string;
  means: string;
  blurb: string;
  takeaway: string;
  /** Used for a code that does not set its own. */
  acts: string;
  again: string;
  icon: string;
  /** The district's frame on the map, and how many signs sit in a row. */
  box: { x: number; y: number; w: number; h: number };
  columns: number;
};
export type Code = {
  code: number;
  phrase: string;
  says: string;
  story: string;
  by: string;
  acts?: string;
  again?: string;
  header?: [string, string];
  see: [string, string];
  note: string;
  sources: number[];
  /** Where the sign sits when it is not on the district's grid. */
  at?: { x: number; y: number };
};

const RFC = 'https://www.rfc-editor.org/rfc/rfc9110.html#section-';
export const sources = [
  { label: 'RFC 9110: status codes', url: `${RFC}15` },
  { label: 'RFC 9110: informational 1xx', url: `${RFC}15.2` },
  { label: 'RFC 9110: successful 2xx', url: `${RFC}15.3` },
  { label: 'RFC 9110: redirection 3xx', url: `${RFC}15.4` },
  { label: 'RFC 9110: client error 4xx', url: `${RFC}15.5` },
  { label: 'RFC 9110: server error 5xx', url: `${RFC}15.6` },
  { label: 'RFC 9110: conditional requests', url: `${RFC}13` },
  { label: 'RFC 9110: WWW-Authenticate', url: `${RFC}11.6.1` },
  { label: 'RFC 9110: idempotent methods', url: `${RFC}9.2.2` },
  { label: 'RFC 9110: Retry-After', url: `${RFC}10.2.3` },
  { label: 'RFC 9112: the HTTP/1.1 status line', url: 'https://www.rfc-editor.org/rfc/rfc9112.html#section-4' },
  { label: 'RFC 8297: 103 Early Hints', url: 'https://www.rfc-editor.org/rfc/rfc8297.html' },
  { label: 'RFC 6585: 429 Too Many Requests', url: 'https://www.rfc-editor.org/rfc/rfc6585.html#section-4' },
  { label: 'IANA: HTTP status code registry', url: 'https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml' },
  { label: 'Fetch standard: following a redirect', url: 'https://fetch.spec.whatwg.org/#http-redirect-fetch' },
  { label: 'AWS: troubleshoot Application Load Balancers', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html' },
  { label: 'nginx: proxy_read_timeout', url: 'https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout' },
  { label: 'nginx source: the 499 log code', url: 'https://github.com/nginx/nginx/blob/master/src/http/ngx_http_request.h' },
];
const [STATUS, INFO, OK, REDIRECT, CLIENT, SERVER, CONDITIONAL, AUTH, IDEMPOTENT, RETRY_AFTER, STATUS_LINE, HINTS, RATE, REGISTRY, FETCH, ALB, NGINX_TIMEOUT, NGINX_499] = sources.map((_, index) => index);

export const SIGN = { w: 118, h: 44, gap: 7, top: 64, left: 16 };

export const districts: District[] = [
  {
    family: 1, name: 'The Gatehouse', means: 'not done yet', icon: 'M2 28 V12 A12 12 0 0 1 26 12 V28 M-2 28 H30',
    blurb: 'Notes handed out on the way in, before the real answer. Exactly one final answer from another district always follows.',
    takeaway: 'A 1xx is never the last word: wait for the final answer that follows it.',
    acts: 'nobody yet; the final answer is still coming', again: 'not applicable; this is not a final answer',
    box: { x: 20, y: 60, w: 284, h: 180 }, columns: 2,
  },
  {
    family: 2, name: 'Market Square', means: 'it worked', icon: 'M0 12 L4 2 H28 L32 12 Z M4 12 V28 M28 12 V28 M0 28 H32',
    blurb: 'The server understood the request, accepted it and carried it out. Which sign you reach says what comes back.',
    takeaway: 'Any 2xx says the request was carried out. It does not say the content is what you hoped for.',
    acts: 'the client uses the answer', again: 'no need',
    box: { x: 322, y: 20, w: 402, h: 180 }, columns: 3,
  },
  {
    family: 3, name: 'Signpost Junction', means: 'look elsewhere', icon: 'M14 28 V0 M14 4 H28 L32 8 L28 12 H14 M14 15 H2 L-2 19 L2 23 H14',
    blurb: 'What you want is at another address, or already in your own cache. The client has one more step to take.',
    takeaway: 'A 3xx is an instruction to the client, and following it is a second request the client makes.',
    acts: 'the client asks again at the address in Location', again: 'yes, at the new address',
    box: { x: 742, y: 20, w: 278, h: 230 }, columns: 2,
  },
  {
    family: 4, name: 'The Wall', means: 'fix the request', icon: 'M0 28 V8 H6 V13 H12 V8 H18 V13 H24 V8 H30 V28 Z',
    blurb: 'The server looked at the request and found the problem in it: who is asking, where, or what was sent. It turns the same request back the same way every time.',
    takeaway: 'A 4xx fails the same way until the request changes. Only 429 is fixed by waiting.',
    acts: 'whoever sent the request', again: 'not until the request changes',
    box: { x: 20, y: 452, w: 530, h: 180 }, columns: 4,
  },
  {
    family: 5, name: 'The Works', means: 'the server failed', icon: 'M0 28 V14 L10 20 V14 L20 20 V4 H26 V28 Z',
    blurb: 'The request was fine and the city\'s own machinery was not. Two buildings write codes here: the front office, which is a proxy, and the workshop behind it, which is the app.',
    takeaway: 'A 5xx sends you to the server\'s logs, and a 502 or 504 points one hop behind the box that wrote it.',
    acts: 'whoever runs the server', again: 'possibly, after a wait',
    box: { x: 580, y: 400, w: 440, h: 300 }, columns: 1,
  },
];

/** The two buildings inside The Works. 502, 503 and 504 hang on the first; 500 on the second. */
export const works = {
  office: { x: 598, y: 470, w: 142, h: 212, label: 'FRONT OFFICE', sub: 'the proxy' },
  shop: { x: 826, y: 470, w: 176, h: 212, label: 'WORKSHOP', sub: 'the app' },
};
const office = (row: number) => ({ x: works.office.x + 12, y: works.office.y + 46 + row * (SIGN.h + SIGN.gap) });

export const codes: Code[] = [
  {
    code: 100, phrase: 'Continue', says: 'Go ahead and send the rest.',
    story: 'Before uploading a large photo, the browser sends only the request headers, with Expect: 100-continue. The shop answers 100, the browser sends the photo, and then the real answer arrives.',
    by: 'the server', acts: 'the client sends the body', header: ['Expect (in the request)', '100-continue'],
    see: ['Watch both status lines', 'curl -i -H \'Expect: 100-continue\' -d @photo.jpg https://shop.example/photos'],
    note: 'This lets a server refuse a huge upload before any of it is sent. A client that hears nothing should send the body anyway after a short wait, because an older box on the path may never pass the 100 along.',
    sources: [INFO],
  },
  {
    code: 101, phrase: 'Switching Protocols', says: 'Agreed. This connection now speaks something else.',
    story: 'The shop\'s live chat asks to upgrade its connection to WebSocket. After the 101, the same connection stops carrying HTTP requests and carries chat messages instead.',
    by: 'the server', acts: 'both sides switch protocol', header: ['Upgrade', 'websocket'],
    see: ['Where to see it', 'browser developer tools → Network → the chat request shows 101'],
    note: 'Every box on the path has to pass the upgrade along. A proxy that isn\'t configured to do so is a common reason a WebSocket works on a laptop and fails behind a load balancer.',
    sources: [INFO],
  },
  {
    code: 103, phrase: 'Early Hints', says: 'Start loading these while I work.',
    story: 'While the shop builds the cart page, it sends a 103 naming the stylesheet the page will need. The browser starts fetching it, and the 200 with the page follows.',
    by: 'the server', acts: 'the client may start fetching the hinted files', header: ['Link', '</app.css>; rel=preload; as=style'],
    see: ['Watch both status lines', 'curl -i https://shop.example/cart'],
    note: 'One request can produce several status lines. A log or tool that records one number per request shows only the final answer.',
    sources: [INFO, HINTS],
  },
  {
    code: 200, phrase: 'OK', says: 'Here is what you asked for.',
    story: 'The browser asks for /cart and gets the cart page.',
    by: 'the app, or a cache holding its answer',
    see: ['Print the first line of the answer', 'curl -si https://shop.example/cart | head -1'],
    note: 'An app that catches its own failure and still answers 200 with {"error": "…"} in the body looks healthy to every load balancer and dashboard that reads only the number. Also, only the digits are protocol: "200 Fine" is a valid 200, and HTTP/2 sends no words at all.',
    sources: [OK, STATUS_LINE],
  },
  {
    code: 201, phrase: 'Created', says: 'Done, and something new now exists.',
    story: 'A POST to /orders creates order 7. The Location header gives the new order\'s address.',
    by: 'the app', header: ['Location', '/orders/7'],
    see: ['Find the new address', 'curl -si -d \'{"item":12,"qty":2}\' https://shop.example/orders | grep -i \'^location\''],
    note: 'A client that needs the new thing should read Location and not guess the address from the request.',
    sources: [OK],
  },
  {
    code: 202, phrase: 'Accepted', says: 'Received. The work will happen later.',
    story: 'The browser asks for a full year\'s sales export. The shop puts the job in a queue and answers straight away, before any of the export exists.',
    by: 'the app', acts: 'the client checks back for the result', again: 'no; ask for the result at the address the API gives you',
    see: ['What to look for', 'a status address in the response body or Location header'],
    note: 'A 202 is a promise to try. The job can still fail afterwards, and HTTP has no way to send that news later, so the API has to offer somewhere to ask.',
    sources: [OK],
  },
  {
    code: 204, phrase: 'No Content', says: 'Done. There is nothing to send back.',
    story: 'DELETE /cart/items/3 removes the item from the cart. The answer ends after its headers.',
    by: 'the app',
    see: ['See the empty answer', 'curl -si -X DELETE https://shop.example/cart/items/3'],
    note: 'Client code that parses every successful answer as JSON fails here, because the body is empty.',
    sources: [OK],
  },
  {
    code: 206, phrase: 'Partial Content', says: 'Here is the slice you asked for.',
    story: 'Someone skips ahead in the shop\'s intro video. The browser asks for just those bytes with a Range header and gets just those bytes.',
    by: 'the app, a file server or a CDN', header: ['Content-Range', 'bytes 0-999/48000'],
    see: ['Ask for the first 1000 bytes', 'curl -si -r 0-999 https://shop.example/intro.mp4 | head -5'],
    note: 'A server is free to ignore Range and answer 200 with the whole file, so a client has to check which of the two it received.',
    sources: [OK],
  },
  {
    code: 301, phrase: 'Moved Permanently', says: 'Moved for good. Use the new address from now on.',
    story: 'The sale page moved from /sale to /deals. The shop answers with the new address in a Location header, and the browser sends a second request there.',
    by: 'the app or the proxy', header: ['Location', '/deals'],
    see: ['Watch both answers', 'curl -sIL https://shop.example/sale'],
    note: 'Browsers and curl turn a redirected POST into a GET here and drop its body. Browsers may also remember a 301 long after you change the server, so use 302 until you are sure of the move. They give up after 20 redirects in a row.',
    sources: [REDIRECT, FETCH],
  },
  {
    code: 302, phrase: 'Found', says: 'It is over there for now. Keep using this address.',
    story: 'During a promotion, /deals sends visitors to /summer. Next week it will point somewhere else, so the browser keeps asking /deals first.',
    by: 'the app or the proxy', header: ['Location', '/summer'],
    see: ['Print where it points', 'curl -sI https://shop.example/deals | grep -i \'^location\''],
    note: 'The method changes just as it does for 301: a redirected POST arrives as a GET. Use 307 when it must stay a POST.',
    sources: [REDIRECT, FETCH],
  },
  {
    code: 303, phrase: 'See Other', says: 'Done. Now go and look at this page.',
    story: 'The checkout form is posted, the shop takes the order, and it redirects to /receipt/7. Refreshing the receipt repeats a GET, so the order isn\'t submitted twice.',
    by: 'the app', header: ['Location', '/receipt/7'],
    see: ['Follow a POST and print the final method', 'curl -sL -o /dev/null -w \'%{method} %{url_effective}\\n\' -d a=1 https://shop.example/checkout'],
    note: 'The second request is a GET by design, whatever the first one was. This is the usual answer to a form submission.',
    sources: [REDIRECT],
  },
  {
    code: 304, phrase: 'Not Modified', says: 'Nothing changed. Use the copy you already have.',
    story: 'The browser kept the shop\'s logo along with its version label, "v7". On the next visit it asks for the logo only if the label has changed. It hasn\'t, so the shop sends headers and no image.',
    by: 'the app, a proxy or a CDN', acts: 'the client shows its stored copy', again: 'no need', header: ['If-None-Match (in the request)', '"v7"'],
    see: ['Ask conditionally', 'curl -sI -H \'If-None-Match: "v7"\' https://shop.example/logo.png'],
    note: 'This is why 304 lives at the junction: the answer is elsewhere, and elsewhere is the browser\'s own cache. It saves the transfer and not the round trip.',
    sources: [REDIRECT, CONDITIONAL],
  },
  {
    code: 307, phrase: 'Temporary Redirect', says: 'Over there for now. Repeat the request exactly.',
    story: 'The checkout form is posted to /checkout while payments are being served from /pay. The browser sends the same POST, with the same body, to /pay.',
    by: 'the app or the proxy', header: ['Location', '/pay'],
    see: ['Follow a POST and print the final method', 'curl -sL -o /dev/null -w \'%{method}\\n\' -d a=1 https://shop.example/checkout'],
    note: '307 exists because clients rewrite the method on 302. The client must not change it here.',
    sources: [REDIRECT],
  },
  {
    code: 308, phrase: 'Permanent Redirect', says: 'Moved for good. Repeat the request exactly.',
    story: 'The shop\'s API moved from /api/orders to /v2/orders. A POST to the old address is sent again, unchanged, to the new one.',
    by: 'the app or the proxy', header: ['Location', '/v2/orders'],
    see: ['Watch both answers', 'curl -sIL -X POST https://shop.example/api/orders'],
    note: 'It is to 301 what 307 is to 302. Like a 301, it may be remembered by browsers and caches, so it is hard to take back.',
    sources: [REDIRECT],
  },
  {
    code: 400, phrase: 'Bad Request', says: 'I can\'t read this request.',
    story: 'An order arrives with its JSON cut off partway through. The shop can\'t parse it, so it never gets as far as thinking about an order.',
    by: 'the app, or a proxy that can\'t parse the request',
    see: ['Read the explanation in the body', 'curl -s -H \'Content-Type: application/json\' -d \'{"item": 12,\' https://shop.example/orders'],
    note: 'Many APIs answer 400 for any invalid input, not only for unreadable requests. The response body normally says what was wrong.',
    sources: [CLIENT],
  },
  {
    code: 401, phrase: 'Unauthorized', says: 'I don\'t know who you are.',
    story: 'A request for /account arrives with no login. The shop refuses and names the kind of login it accepts.',
    by: 'the app, or an authenticating proxy', again: 'yes, with valid credentials', header: ['WWW-Authenticate', 'Bearer realm="shop"'],
    see: ['See the challenge', 'curl -si https://shop.example/account | head -3'],
    note: 'The name says unauthorized and the meaning is unauthenticated. The test that separates it from 403: could logging in change the answer?',
    sources: [CLIENT, AUTH],
  },
  {
    code: 403, phrase: 'Forbidden', says: 'I understood, and the answer is no.',
    story: 'Maya is logged in and asks for /admin. Maya\'s account is not an admin, so sending the same credentials again changes nothing.',
    by: 'the app, or a firewall in front of it', again: 'not with the same credentials',
    see: ['Check which box refused', 'compare the proxy\'s log with the app\'s log for that request'],
    note: 'A 403 is not always about your account. A firewall can answer 403 for a blocked address or a request that looks like an attack, and then the app never sees it. A server may also answer 404 in place of 403 to avoid confirming that a private page exists.',
    sources: [CLIENT],
  },
  {
    code: 404, phrase: 'Not Found', says: 'Nothing is at this address.',
    story: 'A typo sends the browser to /crat. The shop has no page there.',
    by: 'the app, or a proxy with no rule for the path',
    see: ['Check the exact path that was sent', 'curl -si https://shop.example/crat | head -1'],
    note: 'When the proxy writes the 404, the path may be right and the routing wrong, and the app\'s log is empty. A 404 doesn\'t say whether the page ever existed, and caches may store it, so a CDN can keep answering 404 for a file that was missing only during a deploy.',
    sources: [CLIENT, STATUS],
  },
  {
    code: 405, phrase: 'Method Not Allowed', says: 'This address exists. That action isn\'t offered on it.',
    story: 'A DELETE is sent to /orders. Orders can be read or added there, and the list itself can\'t be deleted.',
    by: 'the app', header: ['Allow', 'GET, POST'],
    see: ['See which methods work', 'curl -si -X DELETE https://shop.example/orders | grep -i \'^allow\''],
    note: 'A request names a place, the path, and an action, the method. 404 is about the place and 405 about the action, and a 405 has to list the actions that are allowed.',
    sources: [CLIENT],
  },
  {
    code: 409, phrase: 'Conflict', says: 'Valid, but it clashes with how things are now.',
    story: 'An order for item 12 arrives a moment after the last one sold. Nothing is wrong with the request itself.',
    by: 'the app', again: 'after loading the current state and deciding again',
    see: ['Read what it conflicts with', 'the response body'],
    note: 'Sending the identical request again usually conflicts again. The client has to look at the current state first.',
    sources: [CLIENT],
  },
  {
    code: 422, phrase: 'Unprocessable Content', says: 'Readable, and the values make no sense.',
    story: 'An order arrives as well-formed JSON asking for a quantity of -3.',
    by: 'the app',
    see: ['Read which field failed', 'curl -s -H \'Content-Type: application/json\' -d \'{"item":12,"qty":-3}\' https://shop.example/orders'],
    note: 'Three refusals at three depths: 400 could not read the request, 422 read it and found the values wrong, 409 found the values fine and the current data in the way.',
    sources: [CLIENT],
  },
  {
    code: 429, phrase: 'Too Many Requests', says: 'Too many requests from you. Slow down.',
    story: 'A script checking prices speeds up past the shop\'s limit. The shop refuses the extra requests and says how long to wait.',
    by: 'a rate limiter in the app, the proxy or a CDN', again: 'yes, after waiting', header: ['Retry-After', '30'],
    see: ['Find the wait', 'curl -sI \'https://shop.example/search?q=mug\' | grep -i \'^retry-after\''],
    note: 'Retry-After is optional. When it is missing, wait longer after each refusal and add some randomness, so that many limited clients don\'t all return in the same second.',
    sources: [RATE, RETRY_AFTER],
  },
  {
    code: 500, phrase: 'Internal Server Error', says: 'Something broke in here.',
    story: 'The shop\'s code hits a case it does not handle while building the cart. Its framework catches the crash and answers 500, and the proxy passes that answer back unchanged.',
    by: 'the app', again: 'possibly later; nothing in the request needs fixing',
    see: ['Find them in an access log', 'awk \'$9 ~ /^5/\' access.log'],
    note: 'The page a visitor gets is vague on purpose, since a stack trace would tell an attacker about the code. The useful detail is in the app\'s log for that moment.',
    sources: [SERVER], at: { x: works.shop.x + 29, y: works.shop.y + 46 + SIGN.h + SIGN.gap },
  },
  {
    code: 502, phrase: 'Bad Gateway', says: 'The box behind me gave a bad answer.',
    story: 'The proxy passes the request to the app and gets back half a reply, nonsense, or a closed connection. It can\'t forward that, so it writes an answer of its own.',
    by: 'the proxy, about the app', again: 'often, after a short wait',
    see: ['Compare two logs', 'proxy: 502 at 10:02:11 · app: restarted at 10:02:10'],
    note: 'The app this code describes never writes it. Look for app crashes and restarts at that time, or an app that closes idle connections sooner than the proxy expects.',
    sources: [SERVER, ALB], at: office(0),
  },
  {
    code: 503, phrase: 'Service Unavailable', says: 'Nobody can take this right now.',
    story: 'The proxy has no copy of the app it can send to: they are starting up, failing health checks, or full. It answers without the request reaching any of the shop\'s code.',
    by: 'the proxy, or an overloaded app', again: 'yes, after waiting', header: ['Retry-After', '120'],
    see: ['Check what the proxy can reach', 'the health-check status of each app instance'],
    note: 'Serve a maintenance page with 503 and not 200, so that clients, monitors and crawlers know the state is temporary.',
    sources: [SERVER, RETRY_AFTER, ALB], at: office(1),
  },
  {
    code: 504, phrase: 'Gateway Timeout', says: 'The box behind me took too long.',
    story: 'The app has the request and is still busy when the proxy\'s 60-second timer runs out. The proxy stops waiting and answers 504. The app may go on to finish the work.',
    by: 'the proxy, about the app', again: 'with care: the work may have been done',
    see: ['Compare two logs', 'proxy: 504 at 10:02:11 · app: that request still running'],
    note: 'After a 504 on a POST, the order may have been saved, and sending it again creates a second one. GET, PUT and DELETE are safe to repeat. The 60 seconds is an example and also the default in nginx and on an AWS Application Load Balancer. If the client gives up first, no answer is sent at all, and nginx records its own 499 in the log.',
    sources: [SERVER, IDEMPOTENT, ALB, NGINX_TIMEOUT, NGINX_499], at: office(2),
  },
];

export const familyOf = (code: Code) => Math.floor(code.code / 100) as Family;
export const districtOf = (code: Code) => districts[familyOf(code) - 1];
/** Top-left corner of a code's sign on the map. */
export const place = (code: Code) => {
  if (code.at) return code.at;
  const district = districtOf(code);
  const index = codes.filter((item) => familyOf(item) === district.family).indexOf(code);
  return {
    x: district.box.x + SIGN.left + (index % district.columns) * (SIGN.w + SIGN.gap),
    y: district.box.y + SIGN.top + Math.floor(index / district.columns) * (SIGN.h + SIGN.gap),
  };
};

export const related = [
  { label: 'Networking, Illustrated', href: '/networking' },
  { label: 'AWS Load Balancers', href: '/aws-load-balancers' },
  { label: 'Kubernetes Gateway API and Ingress', href: '/kubernetes-gateway-ingress' },
];
export const registry = sources[REGISTRY];
