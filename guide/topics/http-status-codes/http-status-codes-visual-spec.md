# HTTP Status Codes as a City Map — visual specification

- **Topic:** HTTP status codes as a map of five districts, one per first digit, with a sign for each code.
- **Status and version:** 2.0, written and integrated on 2026-10-13 at `/http-status-codes`. Canonical source is [`src/content/topics/http-status-codes.mdx`](../../../src/content/topics/http-status-codes.mdx) with data and components in `src/components/http/`. Version 1.0, a 16-view chain on the shared lesson console built earlier the same day, was replaced in full at the owner's request after they proposed a city-map poster; it was never committed. There is no approval prototype.
- **Target audience:** anyone who meets status codes in a browser, an API client or an access log and wants to look one up and remember where it belongs.
- **Page promise:** find a code on the map, and read what the server is saying, who acts next, whether asking again helps, and which box probably wrote it.
- **Persistent scenario:** a browser asking a made-up shop, `shop.example`.
- **Format:** operational reference, foundational.
- **Scope:** 26 codes: 100, 101, 103; 200, 201, 202, 204, 206; 301, 302, 303, 304, 307, 308; 400, 401, 403, 404, 405, 409, 422, 429; 500, 502, 503, 504.
- **Non-goals:** 408, 410 and the rest of the IANA registry, CDN-specific codes, 418, caching rules, CORS, and API error-body formats. 499 appears in the note on 504.

## What changed from the owner's reference image

The reference was a bright cartoon raster with every label drawn into the picture. The page keeps its idea (five districts, a sign per code, a one-line gloss) and changes these things, each for a stated reason.

| Reference | Built | Why |
| --- | --- | --- |
| Raster illustration with text in the image | Inline SVG with real text; each sign is a link | Searchable, readable by a screen reader, correctable. The reference misspelt "malformed". |
| Bright cartoon palette | The site's dark console | Brief: preserve the dark technical character; frame matches the other topics. |
| 4xx red, 5xx purple | 4xx amber, 5xx red, 3xx blue, 2xx green, 1xx grey | Brief: red is failure, amber is caution, purple is identity. |
| "Checkpoint", "Success Plaza", "Detour", "Wrong Address", "Outage Zone" | The Gatehouse, Market Square, The Crossroads, The Wall, The Factory | "Wrong address" fits only 404, and 304 is not a detour. Each name now fits every code in its district. |
| Districts scattered, no path | A road from the browser to the server at the centre, and from there to each district | Shows that the server picks one sign per request; the road to the selected district is lit. |
| 5xx as four equal signs | Two buildings: a front office (the proxy) holding 502, 503, 504, and a workshop (the app) holding 500 | Which box writes which code is the most useful thing to know about 5xx. |
| Gloss only | Gloss, an example, four facts, a command, and a caveat per code | A gloss can't carry what people get wrong: the POST that becomes a GET, the 504 after the order was saved. |
| No 303 | 303 added, with 103, 206, 409 and 422 | 303 completes the redirect set; the others are common. |

**Conflict with the brief, accepted by the owner:** the generator says not to build decorative representational artwork from CSS or SVG. The district icons and the river are decoration. They are five small line icons and one path; nothing on the map that carries meaning depends on them.

## Visual thesis

**The first digit is a place.** The map is always on screen. Selecting a sign marks it, lights the road to its district, and puts that code's detail under the map and its evidence in the inspector.

## Semantic color and diagram grammar

| Element | Form | Meaning |
| --- | --- | --- |
| Dashed frame in a family colour | Five of them | One class of status code |
| Large `4xx`, a name, a short phrase | District header | The class, a name to remember it by, and what it means in three words |
| Small box with a number and phrase | Sign | One status code; a link |
| Filled corner and heavy border | On one sign | The selected code. Does not rely on colour. |
| Pill and circle | `browser`, `server` | Who asks and who answers |
| Thick grey line | Road | The request's way in, and the way to each district |
| Moving dotted line in the family colour | One road | The district the selected code is in. Still under reduced motion. |
| Two inner boxes in The Factory | Front office, workshop | The proxy and the app, with an arrow for the hand-off |

## Console structure

One console on the neutral `TopicConsoleShell`, using the lesson console's frame styles.

- **Index:** five groups named for the districts, one open at a time, listing codes as `404 Not Found`. Counter `18 / 26`.
- **Canvas:** the map, then the selected code: class line, number and phrase, the gloss in quotation marks, a one-paragraph example at `shop.example`, and fact tiles (who acts next, ask again?, usually written by, and a header to read when there is one).
- **Inspector:** the district's meaning, one command or place to look, a "worth knowing" caveat for the code, and its sources.
- **Bottom:** the district's takeaway, sources, related visuals, footer. Previous and next step through the codes in numeric order.
- **Fragments:** `#code-404` for each code; `#http-status-sources` opens the sources. Selecting a code pushes history.
- **Default:** 200.
- **No JavaScript:** the map, then all 26 codes stacked in order, each with its inspector text and takeaway. Signs and index entries are ordinary links to those sections.

Interaction is a single selector with an inspector. There are no hero interactions; this is a reference, and the map is the navigation.

## Responsive and accessibility

- Below 1200 px the inspector moves under the canvas; below 760 px the index collapses to one disclosure.
- The map keeps a minimum width of 760 px and scrolls sideways inside a focusable frame on narrow screens. There the index is the practical way in, and choosing a code scrolls its detail into view.
- Signs are SVG links with an accessible name (`404 Not Found`); the map has a text description listing every district and code. Selection is announced through a polite live region.
- Not yet checked: sign text is about 10 px at a 1440 px window, below the generator's 12 px floor for secondary labels. The same phrase is repeated at full size in the index and the detail.

## Accuracy decisions

| Decision | Basis |
| --- | --- |
| A client treats an unknown code by its first digit | RFC 9110 §15; script |
| Only the digits are protocol; HTTP/2 sends no reason phrase | RFC 9112 §4; script |
| 301 and 302 turn a POST into a GET in browsers and curl; 303 always; 307 and 308 never | RFC 9110 §15.4; Fetch standard; script, with curl and Node's `fetch` |
| Browsers stop after 20 redirects | Fetch standard |
| 301, 308 and 404 may be stored by a cache without explicit headers | RFC 9110 §15.1 |
| 202: HTTP cannot report the later outcome | RFC 9110 §15.3.3 |
| A server may ignore Range and answer 200 | RFC 9110 §14.2 |
| 401 always carries `WWW-Authenticate`; 404 may stand in for 403 | RFC 9110 §15.5.2, §15.5.4 |
| 405 must list `Allow`; 422 is named Unprocessable Content | RFC 9110 §15.5.6, §15.5.21 |
| `Retry-After` is optional on 429 and 503 | RFC 6585 §4; RFC 9110 §15.6.4 |
| 502 and 504 are written by a proxy; 503 by either | RFC 9110 §15.6.3–5; AWS ALB troubleshooting page |
| 60 seconds is the default in nginx and on an ALB | nginx `proxy_read_timeout`; AWS "Edit attributes for your Application Load Balancer". Both read on 2026-10-13 |
| nginx logs 499 when the client leaves | Comment in nginx source at `NGX_HTTP_CLIENT_CLOSED_REQUEST` |
| GET, PUT and DELETE are safe to repeat; POST is not by default | RFC 9110 §9.2.2 |
| A proxy that drops the upgrade is "a common reason" a WebSocket fails; "serve a maintenance page with 503"; "many APIs answer 400 for any invalid input" | Editorial judgement, not sourced |
| No proxy was run | 502, 503 and 504 rest on the RFC and vendor documentation; nginx is not installed here |

`node scripts/verify-http-status-lesson.mjs` starts a local server and replays 13 client-behaviour claims with curl and Node's `fetch`.

## Implementation

- `http-codes.ts` — districts, codes, sign placement, sources. `CityMap.astro` — the SVG. `HttpCityConsole.astro` — console slots and code panels. `http-city-client.ts` — selection, history, focus. `src/styles/http-city.css` — the map and panels; the frame comes from `lesson-console.css`.
- Adding a code is one entry in `codes`; its sign is placed on the district's grid unless it sets `at`.

## Page-level acceptance

- [x] `npm run verify` passes; the replay script passes with curl 8.21.0 and Node.js 26.1.0.
- [x] Every source URL returned 200 on 2026-10-13.
- [x] Headless Firefox screenshots inspected at 1440 px (200 and 504 selected), 390 px, and with JavaScript disabled.
- [ ] Owner review of the map's look against the reference image.
- [ ] Not yet exercised by hand: clicking signs, keyboard and touch operation, focus order, 320 px, 200% zoom, reduced motion, Back and Forward.

## Source index

1. [RFC 9110 §15: status codes](https://www.rfc-editor.org/rfc/rfc9110.html#section-15), with §15.2–15.6 per class
2. [RFC 9110 §13: conditional requests](https://www.rfc-editor.org/rfc/rfc9110.html#section-13) — 304
3. [RFC 9110 §11.6.1: WWW-Authenticate](https://www.rfc-editor.org/rfc/rfc9110.html#section-11.6.1) — 401
4. [RFC 9110 §9.2.2: idempotent methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) — 504
5. [RFC 9110 §10.2.3: Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3) — 429, 503
6. [RFC 9112 §4: status line](https://www.rfc-editor.org/rfc/rfc9112.html#section-4) — 200
7. [RFC 8297: Early Hints](https://www.rfc-editor.org/rfc/rfc8297.html) — 103
8. [RFC 6585 §4: 429](https://www.rfc-editor.org/rfc/rfc6585.html#section-4)
9. [IANA HTTP status code registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)
10. [Fetch standard: HTTP-redirect fetch](https://fetch.spec.whatwg.org/#http-redirect-fetch) — 301, 302
11. [AWS: troubleshoot Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html) — 502, 503, 504
12. [nginx: proxy_read_timeout](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout) — 504
13. [nginx source: ngx_http_request.h](https://github.com/nginx/nginx/blob/master/src/http/ngx_http_request.h) — 499
