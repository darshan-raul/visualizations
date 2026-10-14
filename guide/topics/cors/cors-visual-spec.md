# CORS, One Request at a Time — visual specification

- **Topic:** Cross-Origin Resource Sharing, taught by following one request from a page to an API and back.
- **Status and version:** 2.1, 2026-10-15 (read-check panel, same-origin baseline, gapless step numbers); 2.0, 2026-10-14, at `/cors`. Version 1.0 (same day) had 21 trip views and a 16-control lab; 2.0 regroups it into six views after a review the owner passed on (see below). Canonical source is [`src/content/topics/cors.mdx`](../../../src/content/topics/cors.mdx) with the model, views and components in `src/components/cors/`. Built directly into the site in the same way as the HTTP status code map; there is no approval prototype.
- **Target audience:** developers and platform engineers who know HTTP and have met a CORS error they couldn't explain.
- **Page promise:** look at a CORS failure and reason through origin → request type → preflight → response headers → the browser's decision → what sits in front, instead of trying headers at random.
- **Persistent scenario:** a script on `https://app.b.com` asks `https://api.a.com/account`. Two choices change the page to `https://evil.example` to show CSRF and an over-permissive server.
- **Format:** flow explorer, foundational.
- **Non-goals:** Private Network Access, COOP, COEP, CORP, per-browser compatibility tables, framework middleware set-up, a full CSRF course.

## Departures from the owner's reference spec

The owner supplied a 12-visual spec and asked for something interactive "in the line of" the HTTP status code map. The page keeps that spec's content and accuracy decisions and changes its shape.

| Reference | Built | Why |
| --- | --- | --- |
| 12 visuals, each its own diagram, three hero simulators | One trip map that stays on screen; 21 trips in five groups redraw it | The owner liked the HTTP map, where one picture is the navigation. One request through one picture is the CORS mental model. |
| Separate origin comparator, journey stepper, decision lab and DevTools detective | A ribbon (origin comparator), Play/Step controls (journey), a lab of 16 request and server controls (decision lab), and DevTools rows plus a console line on every trip (detective) | All four views come from one model, so they can't disagree. Changing any control redraws all of them. |
| "`POST` missing from allow-methods" as a preflight failure | Removed; the preflight trip's note says POST need not be listed | POST is a CORS-safelisted method. Firefox passes such a preflight (`post-missing-from-allow-methods` in the replay script). |
| Header toolbox, fix patterns and operating loop as their own visuals | The headers appear on every trip, marked ✓ or ✕; the first thing to change is computed per trip; the operating loop is in the sources drawer | They read better next to a concrete trip than as reference lists. |
| `Allow-Headers: *` | Covers most headers without credentials, never `Authorization` | Fetch standard and Chromium. Firefox 154 still lets `*` cover `Authorization` by default (`network.cors_preflight.authorization_covered_by_wildcard`). The page says so. |

## Visual thesis and grammar

**The browser's read check.** A request may cross the network; the answer reaches the script only through the check.

| Element | Meaning |
| --- | --- |
| Browser frame, purple tab and script box | The page and its origin |
| Blue vertical bar, "READ CHECK" | Where the browser decides; stamps on it say ✓ shared, ✕ blocked, ◐ opaque, → navigation |
| Solid blue line with arrow | Went over the network |
| Red dotted line, "NOT SENT" | Would have been sent; suppressed after a failed preflight |
| Green line into "what it gets" | Handed to the script |
| Red dashed line | Held back by the browser |
| Amber dashed line | Opaque: usable for display, unreadable to script |
| Numbered circles | Step order, matching the step list |
| Cookie pill | Cookie attached, only if SameSite=None, or none |
| CDN box (only when present) | Edge; red when it serves another origin's copy |
| Access log in the server box | What reached the server. This is the "network still happened" evidence |

## Version 2.0: six views

A review (the owner's, via Codex) found 1.0 hard to absorb: too many near-identical destinations, too much evidence around each trip, a lab whose results drifted from the prose, and a map that scrolled sideways on phones. 2.0 keeps the model and its checks and changes the presentation.

| Group | View | Choices |
| --- | --- | --- |
| Basics | 01 Origins (`#what-is-an-origin`, default) | URL anatomy, then a comparator with nine examples and a free URL box. No map. |
| Basics | 02 Reading the response | Same origin (the baseline: nothing to check) · No Allow-Origin · Allow-Origin: https://app.b.com · Allow-Origin: * |
| Requests | 03 Preflight | Allows both headers · Leaves out Authorization · Not handled: 405 |
| Requests | 04 Credentials | * · names app.b.com only · names app.b.com + Allow-Credentials · echoes any Origin (from evil.example) |
| Troubleshooting | 05 Find the failure | Auth rejects OPTIONS · 500 without CORS headers · redirect to login · CDN cached another origin's answer. Four diagnostic questions above the explanation; the one that catches the case is marked. |
| Troubleshooting | 06 Common traps | no-cors · a plain `<img>` · a cross-site form post (CSRF) · a custom header reads null |

- **Two answers lead every map view:** "Did the request reach the server?" and "Can the script read the response?", with Yes / No / partly, coloured and worded.
- **Only relevant actors:** the OPTIONS lanes appear only when a preflight is sent, the CDN only in its case, the cookie pill only when a cookie can go. The origin ribbon is gone; Origins carries that idea.
- **One explanation per choice** under the map, written for that state, so the prose always matches the drawing. Steps, the computed fix, headers, DevTools rows, the console message and curl sit under a closed "Inspect the exchange".
- **The read check, spelled out** under the map: for the OPTIONS answer and the real answer, each row pairs what the request carried (Origin, Access-Control-Request-Headers, credentials mode, a header the script reads) with what the answer granted, marked ✓ or ✕ with a short reason. Same origin, `<img>`, no-cors and forms say in one line why nothing is compared. Rows dim during playback until their step.
- **Play / Step** remain; the current step's sentence shows under the map. Every step draws something: a sentence with no leg of its own joins the next drawn step, so the numbered circles run 1, 2, 3 without gaps.
- **Legend** lists only the line styles on the current map.
- **Phones:** below 760 px a second, vertical SVG replaces the wide one (page at the top, read check across the browser's lower edge, server at the foot; lane labels run along their lanes). No sideways scrolling.
- **Fragments:** `#<view>`, `#<view>--<choice>`, and every 1.0 `#trip-<id>` as an alias to its new view and choice (`same-origin`, `subdomain` and `port` go to Origins). `#cors-sources` opens the sources.
- **No JavaScript:** Origins, then one map drawn with view 02's first choice and a caption saying so, then each view with every choice stacked: its two answers, its explanation and a closed "Inspect the exchange".
- Index labels are plain: Views, Basics, Requests, Troubleshooting.

## Accuracy decisions

The model (`cors-trip.ts`) implements the Fetch standard's CORS check, preflight checks and credentials rules for the cases drawn. `node scripts/verify-cors-lesson.mjs` runs every choice that a local page can reproduce, six named edge cases and 260 random combinations of the model's settings in headless Firefox against two local servers. For each case it compares whether the script could read the answer, whether the actual request reached the server, whether a preflight was sent and whether `X-Request-Id` was visible: 281 of 281 match in 2.1 (280 in 2.0) (284 of 284 in 1.0) (Firefox 154, 2026-10-14, with the Authorization wildcard pref set to the standard's behaviour).

Not replayed: cookie delivery and SameSite (they need real sites); the CDN trip; `<img>` and form navigation; the console text, which uses Chromium's wording and was not captured. Mixed content, canvas tainting and `Origin: null` after a cross-origin redirect rest on the HTML and Fetch standards.

## Implementation

- `cors-trip.ts`: `trip(config)` returns the legs, steps, headers, log, DevTools rows and verdict; `view()`, `answersHtml()` and `inspect()` turn it into the map state and HTML, on the server and in the client.
- `cors-views.ts`: groups, the five map views and their choices (a config plus one explanation), the diagnostic questions, 1.0 fragment aliases and sources. `cors-origin.ts` and `CorsOrigin.astro`: the Origins view.
- `CorsMap.astro` (wide and tall layouts from one set of data attributes), `CorsConsole.astro`, `cors-client.ts`, `src/styles/cors.css`; the frame comes from `lesson-console.css`.
- Adding a case is one choice in a view.

## Page-level acceptance

- [x] `npm run verify` passes; `node scripts/verify-cors-lesson.mjs` passes 281/281.
- [x] Every source URL returned 200 and every fragment exists on 2026-10-14.
- [x] 2.0 headless Firefox screenshots inspected: Preflight with a choice from a fragment at 1440 px; Find the failure via a 1.0 alias and Preflight at 390 px; the whole page with JavaScript disabled.
- [ ] Owner review.
- [ ] Not yet exercised by hand: keyboard and touch, focus order, 320 px, 200% zoom, reduced motion, Back and Forward.

## Deep-dive handoffs

1. Credentials, SameSite and third-party cookie blocking in a real SSO flow (from Cookies and headers).
2. CloudFront, API Gateway and ALB CORS in one OPTIONS + POST trip (from When it breaks).
3. CORP, COEP, COOP and cross-origin isolation (from Other ways in).
4. Private Network Access.

## Source index

See `sources` in `src/components/cors/cors-views.ts`: the Fetch standard (CORS protocol, safelisted headers and methods, preflight, credentials, CORS check, opaque responses, redirects), the HTML standard (origins, same site, CORS settings attributes, canvas), MDN (CORS, CORS errors, CSRF), RFC 6265bis, W3C Fetch Metadata, and the CloudFront header caching and response headers policy guides.
