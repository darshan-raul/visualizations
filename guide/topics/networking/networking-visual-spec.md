# Networking, Illustrated — Visual specification

**Status:** Integrated refactor; design and factual review 2026-09-16. **Version:** 2.2; OSI / TCP/IP view added and verified 2026-10-15.
**Audience:** Working developers moving into DevOps, SRE and cloud infrastructure.
**Page promise:** Follow one HTTPS request from a hostname on a laptop to a server, and see which layer makes each decision.
**Persistent scenario:** One HTTPS intent from client.lab.example (10.20.10.25:51514) to app.example.test (203.0.113.80:443), using a local gateway and an illustrative NAT edge.
**Scope:** OSI responsibilities and the TCP/IP protocol stack, IPv4 address locality, Ethernet next-hop delivery, route selection, TCP endpoints, translation, discovery, filtering, balancing, and first-failure diagnosis.
**Non-goals:** Full TLS, IPv6 Neighbor Discovery internals, BGP, vendor device CLI, Wi-Fi, and complete Kubernetes or VPC networking.
**Visual thesis:** Follow one packet through layer-specific checkpoints; keep DNS beside, not inside, the data path.

## Semantic visual grammar

Use the confirmed dark console tokens from `src/styles/global.css`: cyan is live data movement, violet is lookup/namespace/secret context, green is resolved or allowed state, amber is waiting/pressure, and red is blocked state. Solid arrows carry runtime traffic or protocol messages; dashed connectors mark lookup/configuration. A packet pulse, newly enclosing process boundary, or SSH NEWKEYS tunnel transition highlights only the changed actor or path. Every color state also has a text label, border, or connector style.

## Concept groups and narrative

The native disclosure index groups views as **Request**, **Local link**, **Routing**, **Transport**, **Discovery**, **Diagnosis**. The default active view is **Packet journey**. Selection opens only its group and updates a current/total counter.

| # | Index group / view | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Request / Packet journey | What happens after an application asks for app.example.test? | Topology with DNS as a violet side lookup above a cyan client → link → gateway → optional NAT → server path | Step, play/pause, failure | A network request is one application intent carried through several layer-specific decisions. |
| 2 | Request / OSI–TCP/IP | How do seven OSI layers relate to this request’s protocol stack? | Seven responsibility rows align with four TCP/IP bands beside a concrete HTTP/TLS/TCP/IP/Ethernet sender stack | Select a band; disconnect local link | Layers identify responsibilities; a working lower layer does not prove the layers above it work. |
| 3 | Request / Headers on the wire | Which address matters to the next device, and which one identifies the final peer? | Nested envelope: application bytes inside TCP segment inside IPv4 packet inside Ethernet frame, with field labels at each boundary | Manual inspection and alternate state | MAC addresses reach the next hop; IP addresses guide the packet across hops; ports select an endpoint. |
| 4 | Local link / CIDR and locality | Does 203.0.113.80 live on the client’s link? | Large client address and a proportional 24-bit prefix/8-bit host rail; local and remote peers sit below as a two-outcome comparison | Manual inspection and alternate state | Prefix length divides the address space; the route table decides what to do with a destination. |
| 5 | Local link / ARP to the next hop | What MAC address goes into the Ethernet destination field? | Client and gateway anchor a bidirectional request/reply rail; the completed first-hop frame lists gateway MAC beside remote IP | Manual inspection and alternate state | ARP resolves a local next hop. It does not discover the remote server’s Ethernet address across routers. |
| 6 | Routing / Route selection | Why does this destination use a specific gateway? | Destination sits left of an overlapping route table; the selected /26 via 10 | Step, play/pause, failure | Route selection happens before neighbor resolution; the longest matching prefix wins. |
| 7 | Transport / TCP and UDP | What does TCP add to this HTTPS request? | Two anchored endpoint labels bracket a vertical SYN → SYN-ACK ← ACK → DATA sequence, followed by a short UDP comparison | Manual inspection and alternate state | TCP connection state and retransmission are transport responsibilities; they do not repair missing routes or application failures. |
| 8 | Transport / Socket and 5-tuple | How does the server know which application endpoint should receive it? | One five-field transport tuple is shown as a flat horizontal anatomy strip, with the server listener below as the receiving endpoint | Manual inspection and alternate state | An IP address identifies a host/interface context; a port and protocol identify transport endpoints. |
| 9 | Routing / NAT transformation | Which fields change when the private client reaches the outside network? | Before/after source tuples flank an SNAT marker; mapping state sits below and the reply path reverses the mapping | Manual inspection and alternate state | NAT changes selected address or port fields; routing and filtering remain separate decisions. |
| 10 | Discovery / DNS lookup | How did the client learn 203.0.113.80? | Application query leads to a split cache-or-authority branch and rejoins at the resolver answer; a boundary note keeps DNS off the later packet route | Manual inspection and alternate state | DNS discovers a destination; it is not a forwarding hop for the application packet. |
| 11 | Discovery / Filter and state | Why can a SYN fail while a later reply is allowed? | New SYN, policy gate and return flow form a directional rail; stateful/stateless rule treatment is compared below | Manual inspection and alternate state | A filter decision depends on rule context and connection state, not just the destination IP. |
| 12 | Discovery / L4 versus L7 | How does the information a balancer inspects change its backend choice? | Two flat rails compare L4 metadata/choice with L7 HTTP evidence/choice; healthy target requirement appears in the bottom note | Manual inspection and alternate state | The layer of inspection determines the routing criteria and the connection behavior a balancer can implement. |
| 13 | Diagnosis / Diagnose | Where should you look when a request times out? | A numbered evidence ladder moves from name to route, socket, policy and service; the first failure is marked at the exact checkpoint | Step, play/pause, failure | Find the first failed assumption, then collect evidence at that layer before changing configuration. |

## Per-visual contracts

### Visual 1 — One request crosses several decision points

#### Purpose

Resolve “What happens after an application asks for app.example.test?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What happens after an application asks for app.example.test?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **Resolve** and can advance to **Deliver**.

#### Concepts and actors

Client, resolver, local switch/link, gateway, NAT edge, remote server, packet envelope.

#### Composition

Request / Packet journey in the one persistent console. Topology with DNS as a violet side lookup above a cyan client → link → gateway → optional NAT → server path. A first-hop envelope below separates MAC, IP and port fields. The active view’s actor labels and state cues stay in the canvas; DNS supplies an address before TCP begins. The client then selects a route and a next-hop link address; routers repeat forwarding decisions at each hop. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Resolve.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Simulate DNS failure**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Resolve:** DNS returns 203.0.113.80
- 2. **Route:** client selects gateway 10.20.10.1
- 3. **Neighbor:** ARP resolves the gateway MAC
- 4. **Forward:** frame crosses the local link and gateway
- 5. **NAT:** configured edge rewrites source tuple
- 6. **Deliver:** server receives TCP port 443
- Observable fixture: Illustrative DNS answer: app.example.test A 203.0.113.80

#### Failure or edge state

The resolver has no usable answer. No TCP SYN is sent because the application does not yet have a destination address.

#### Required copy

Canvas labels: Resolve → Route → Neighbor → Forward → NAT → Deliver. Bottom takeaway: “A network request is one application intent carried through several layer-specific decisions.”

#### Accuracy caveats

The diagram keeps TLS and internet-provider routing outside the frame. 203.0.113.80 and 198.51.100.0/24 are documentation-only addresses.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc1034), [primary source](https://www.rfc-editor.org/rfc/rfc1812), [primary source](https://www.rfc-editor.org/rfc/rfc9293), [primary source](https://www.rfc-editor.org/rfc/rfc826)

#### Acceptance checks

- DNS never sits on the application data path; the first frame targets a next hop; NAT occurs only at a configured edge.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 2 — OSI, reimagined around one request

#### Purpose

Connect familiar layer numbers to the existing HTTPS request, replacing rote layer-name recall with responsibility, protocol composition, and diagnostic evidence.

#### Learner question

How do seven OSI layers relate to the TCP/IP stack your request actually uses?

#### Persistent scenario state

The client has resolved app.example.test to 203.0.113.80 and sends HTTP protected by TLS over TCP, IPv4, and its Ethernet link. This is the HTTP-over-TCP case, not HTTP/3. It appears second, after the broad packet journey and before the header anatomy.

#### Concepts and actors

OSI application (7), presentation (6), session (5), transport (4), network (3), data link (2), and physical (1). TCP/IP application, transport, internet, and link bands. HTTP, TLS, TCP ports 51514/443, IPv4 addresses, next-hop MAC addresses, and physical signaling. Models group responsibilities; they are not seven runtime services or seven forwarding hops.

#### Composition

Use `Request / OSI–TCP/IP`, fragment `#osi-tcp-ip`, inside the existing console. A semantic two-column table shows all seven OSI responsibilities, with row-spanning cells for the four TCP/IP bands. To the right, a sender stack grounds the model in HTTP over TLS → TCP segment → IPv4 packet → Ethernet and physical signaling. Solid downward arrows denote the sender’s use of lower-layer services, not equivalence between models. Dashed table boundaries denote approximate functional correspondence. The receiver processes data up its stack; this is not a packet trace through seven devices.

Default selection is Application. All context remains fully readable; selected responsibility rows, TCP/IP band, and request strip gain a cyan background/border cue. Explanation follows the selected band in the contextual inspector and below the visual. No animation is needed: simultaneous alignment teaches grouping better than a timed layer reveal. The existing three hero traces remain the only timed interactions.

#### Interaction

Four native pressed-state buttons (Application, Transport, Internet, Link) appear above the model under enhancement. Selecting one highlights only its matching band and request strip and updates the inspector and named result. Tab, Enter, and Space operate the controls. **Disconnect local link** selects Link, marks the affected band and local request strip as blocked, and explains that a configured IP address can remain present despite loss of physical connectivity. Toggle off or select another band to clear the failure. Existing view navigation, direct fragments, reload, and browser history select this view and its index group.

#### Data or content states

- Application: HTTP gives the exchange meaning; TLS protects bytes above TCP in this example. Representation and dialog functions do not require separate OSI runtime modules.
- Transport: TCP sends an ordered byte stream between ports 51514 and 443; transport success does not establish TLS trust or HTTP success.
- Internet: IPv4 uses 10.20.10.25 → 203.0.113.80; routing selects a next hop.
- Link: Ethernet uses the client MAC → gateway MAC on this local link; physical signaling carries the encoded data, and routers construct new outgoing frames.
- Evidence: name resolution, TCP connectivity, TLS acceptance, and HTTP success are distinct observations.

#### Failure or edge state

The local interface loses physical link connectivity. The configured IP address may still exist, but frames cannot leave through that interface. Show this at Link, with a text explanation and red boundary; higher-layer configuration cannot restore the missing link.

#### Required copy

Title: “OSI, reimagined around one request.” Canvas: “One request. Two ways to read it.” Model caption: “OSI / TCP/IP · approximate correspondence.” Takeaway: “Use layers to identify the responsibility and the evidence you need; a working lower layer does not prove the layers above it work.”

#### Accuracy caveats

This is a teaching correspondence, not a normative one-to-one mapping. X.200 defines the seven OSI layers; RFC 1122 §1.1.3 identifies the four Internet architecture layers. RFC 1122 directly compares application/presentation and describes transport as well; do not claim it prescribes an exact 7-to-4 crosswalk. Session functions may span applications and transport. TLS is shown above TCP and below HTTP, without declaring TLS universally “OSI layer 6.” Mention the five-layer teaching variation, which separates physical signaling from link, without implying a protocol change. HTTP/3 uses QUIC over UDP and is outside this example.

#### Mobile behavior

At 800 px and below, the request stack follows the table. Keep the two model columns together with readable seven-row labels and row-spanning TCP/IP groups. No horizontal page scrolling at 320 px or 200% CSS zoom. The inspector follows the canvas. Labels wrap without truncation.

#### Accessibility

Use table headers, grouped table bodies, and real row spans; all model names and responsibilities remain ordinary text. Selection uses a border and background along with named pressed-state buttons and a text result, not color alone. Keep all context visible and use no essential motion. Without JavaScript, all seven rows, four TCP/IP bands, the real request stack, caveats, scenario explanations, and sources remain readable in narrative order.

#### Source anchors

- [ITU-T X.200, §§6–7 — OSI basic reference model](https://www.itu.int/rec/T-REC-X.200-199407-I/en)
- [RFC 1122, §1.1.3 — Internet protocol suite](https://www.rfc-editor.org/rfc/rfc1122#section-1.1.3)
- [RFC 8446, §1 — TLS’s underlying transport and security properties](https://www.rfc-editor.org/rfc/rfc8446#section-1)
- [Kurose/Ross, Chapter 1 §1.5, slide 6 — five-layer teaching stack](https://gaia.cs.umass.edu/kurose_ross/videos/1/5/1.5_video_slides_posted.pptx)

#### Acceptance checks

- All seven OSI names and numbers and all four TCP/IP bands are readable simultaneously.
- Application selection groups upper responsibilities without asserting exact implementation boundaries; TLS has no fixed OSI-layer assignment.
- Link selection and disconnection distinguish configured addresses from physical reachability.
- Direct `#osi-tcp-ip`, reload, Back/Forward, native keyboard choices, 320 px, 200% CSS zoom, and the no-JavaScript reading path work.
- Existing view fragments remain stable and the counter becomes 13 views.

### Visual 3 — Each layer adds the address it owns

#### Purpose

Resolve “Which address matters to the next device, and which one identifies the final peer?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Which address matters to the next device, and which one identifies the final peer?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **Application** and can advance to **Ethernet frame**.

#### Concepts and actors

Application payload, TCP ports, IPv4 addresses, Ethernet MACs and current-link trailer.

#### Composition

Request / Headers on the wire in the one persistent console. Nested envelope: application bytes inside TCP segment inside IPv4 packet inside Ethernet frame, with field labels at each boundary. The active view’s actor labels and state cues stay in the canvas; The Ethernet frame is only for the current local link. The IP packet carries the end-to-end destination, while TCP identifies the receiving transport endpoint. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Application.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Show missing neighbor** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Application:** HTTPS request bytes
- 2. **TCP segment:** 51514 → 443
- 3. **IP packet:** 10.20.10.25 → 203.0.113.80
- 4. **Ethernet frame:** 02:11:…:25 → gateway MAC
- Observable fixture: $ ip route get 203.0.113.80 / … via 10.20.10.1 dev eth0 src 10.20.10.25

#### Failure or edge state

The route is valid, but the host cannot resolve the gateway’s link-layer address. Local delivery waits or fails before the frame can leave.

#### Required copy

Canvas labels: Application → TCP segment → IP packet → Ethernet frame. Bottom takeaway: “MAC addresses reach the next hop; IP addresses guide the packet across hops; ports select an endpoint.”

#### Accuracy caveats

The exact link layer changes across a path. A router removes the incoming frame and builds a new frame for its outgoing link.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc894), [primary source](https://www.rfc-editor.org/rfc/rfc9293)

#### Acceptance checks

- The frame is local-link scope; a router can replace L2 while retaining the remote IP destination.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 4 — The prefix decides what is local

#### Purpose

Resolve “Does 203.0.113.80 live on the client’s link?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Does 203.0.113.80 live on the client’s link?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **Client IP** and can advance to **Remote peer**.

#### Concepts and actors

Client address, /24 prefix, connected range, local peer and remote peer.

#### Composition

Local link / CIDR and locality in the one persistent console. Large client address and a proportional 24-bit prefix/8-bit host rail; local and remote peers sit below as a two-outcome comparison. The active view’s actor labels and state cues stay in the canvas; The client has 10.20.10.25/24, so its directly connected subnet is 10.20.10.0/24. A destination outside it needs a route through a next hop. A prefix describes a network range, not a physical wire. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Client IP.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Show wrong prefix** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Client IP:** 10.20.10.25/24
- 2. **Network bits:** first 24 bits identify 10.20.10.0/24
- 3. **Local peer:** 10.20.10.80 fits that prefix
- 4. **Remote peer:** 203.0.113.80 does not fit
- Observable fixture: Illustrative: 10.20.10.25/24 → connected route 10.20.10.0/24

#### Failure or edge state

A misconfigured prefix can make the host treat a remote peer as on-link and attempt neighbor resolution instead of using the intended gateway.

#### Required copy

Canvas labels: Client IP → Network bits → Local peer → Remote peer. Bottom takeaway: “Prefix length divides the address space; the route table decides what to do with a destination.”

#### Accuracy caveats

IPv6 uses prefixes too, but its address and neighbor behavior differs. Broadcast is an IPv4 local-link concept.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc4632)

#### Acceptance checks

- 10.20.10.80 is in 10.20.10.0/24 while 203.0.113.80 is outside it.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 5 — The first frame targets the gateway, not the server

#### Purpose

Resolve “What MAC address goes into the Ethernet destination field?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What MAC address goes into the Ethernet destination field?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **Route** and can advance to **Frame**.

#### Concepts and actors

Client, next-hop IPv4 address, ARP request/reply, gateway MAC, Ethernet frame.

#### Composition

Local link / ARP to the next hop in the one persistent console. Client and gateway anchor a bidirectional request/reply rail; the completed first-hop frame lists gateway MAC beside remote IP. The active view’s actor labels and state cues stay in the canvas; After route selection, the host resolves the selected IPv4 next hop with ARP on the local link. The outgoing frame uses the gateway’s MAC; the IP packet still names 203.0.113.80. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Route.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Drop ARP reply** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Route:** selected next hop 10.20.10.1
- 2. **ARP request:** who has 10.20.10.1?
- 3. **ARP reply:** 02:aa:bb:cc:dd:01
- 4. **Frame:** destination MAC is gateway MAC
- Observable fixture: Illustrative neighbor record: 10.20.10.1 → 02:aa:bb:cc:dd:01

#### Failure or edge state

The route exists but the gateway cannot be resolved on this link, so the first frame cannot be sent to that next hop.

#### Required copy

Canvas labels: Route → ARP request → ARP reply → Frame. Bottom takeaway: “ARP resolves a local next hop. It does not discover the remote server’s Ethernet address across routers.”

#### Accuracy caveats

This is IPv4 over Ethernet. IPv6 uses Neighbor Discovery instead of ARP.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc826)

#### Acceptance checks

- The outgoing destination MAC is the gateway MAC, never the routed-away server MAC.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 6 — Forwarding chooses the most specific route

#### Purpose

Resolve “Why does this destination use a specific gateway?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why does this destination use a specific gateway?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **Lookup** and can advance to **NAT**.

#### Concepts and actors

Destination, /26, /24, default route, next hop and outgoing interface.

#### Composition

Routing / Route selection in the one persistent console. Destination sits left of an overlapping route table; the selected /26 via 10.20.10.1 is marked, and the right decision strip separates neighbor resolution from later NAT. The active view’s actor labels and state cues stay in the canvas; The deliberately overlapping route table selects 203.0.113.64/26 for 203.0.113.80. That beats 203.0.113.0/24 and the default route. Only then does the host resolve the selected next hop’s link address. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Lookup.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Show no matching route**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Lookup:** 203.0.113.80 matches /26, /24, and default
- 2. **Next hop:** /26 selects 10.20.10.1 on eth0
- 3. **Neighbor:** Resolve that next hop’s link address
- 4. **NAT:** A later configured edge may rewrite the source tuple
- Observable fixture: Illustrative route table: 203.0.113.64/26 via 10.20.10.1

#### Failure or edge state

If all matching routes, including the default, are removed, the host stops before neighbor resolution.

#### Required copy

Canvas labels: Lookup → Next hop → Neighbor → NAT. Bottom takeaway: “Route selection happens before neighbor resolution; the longest matching prefix wins.”

#### Accuracy caveats

NAT is a separate transformation at a configured edge. It is not performed by every router, and the translation state depends on that device.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc1812), [primary source](https://www.rfc-editor.org/rfc/rfc4632)

#### Acceptance checks

- 203.0.113.80 selects /26 via the same 10.20.10.1 gateway as the first-hop narrative; neighbor resolution follows route selection.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 7 — TCP establishes a connection before application data

#### Purpose

Resolve “What does TCP add to this HTTPS request?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What does TCP add to this HTTPS request?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **SYN** and can advance to **Data**.

#### Concepts and actors

Client port, server port, TCP control flags, connection state and byte stream.

#### Composition

Transport / TCP and UDP in the one persistent console. Two anchored endpoint labels bracket a vertical SYN → SYN-ACK ← ACK → DATA sequence, followed by a short UDP comparison. The active view’s actor labels and state cues stay in the canvas; The client sends SYN, receives SYN-ACK, and returns ACK before exchanging stream data. TCP numbers bytes and acknowledges delivery; UDP carries independent datagrams without a transport handshake. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: SYN.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Drop SYN-ACK** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **SYN:** client asks to open a TCP connection
- 2. **SYN-ACK:** server acknowledges and responds
- 3. **ACK:** client completes handshake
- 4. **Data:** application bytes flow in the TCP stream
- Observable fixture: Illustrative socket state: SYN-SENT → ESTABLISHED

#### Failure or edge state

The client retransmits according to TCP behavior; a route or policy problem can leave it waiting before application data is exchanged.

#### Required copy

Canvas labels: SYN → SYN-ACK → ACK → Data. Bottom takeaway: “TCP connection state and retransmission are transport responsibilities; they do not repair missing routes or application failures.”

#### Accuracy caveats

This is a simplified three-way handshake. TLS begins after transport setup, and modern clients may choose QUIC over UDP for some HTTPS traffic.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc9293), [primary source](https://www.rfc-editor.org/rfc/rfc768)

#### Acceptance checks

- Application data begins after transport setup in this example; UDP has no TCP handshake.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 8 — A five-tuple distinguishes this connection

#### Purpose

Resolve “How does the server know which application endpoint should receive it?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

How does the server know which application endpoint should receive it?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **Protocol** and can advance to **Listener**.

#### Concepts and actors

Protocol, source/destination addresses, source/destination ports and listener.

#### Composition

Transport / Socket and 5-tuple in the one persistent console. One five-field transport tuple is shown as a flat horizontal anatomy strip, with the server listener below as the receiving endpoint. The active view’s actor labels and state cues stay in the canvas; For this TCP flow, protocol, source IP and port, and destination IP and port distinguish the transport conversation. The server needs a listener on the destination address/port; a successful DNS lookup says nothing about that listener. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Protocol.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Close listener** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Protocol:** TCP
- 2. **Source:** 10.20.10.25:51514
- 3. **Destination:** 203.0.113.80:443
- 4. **Listener:** server process accepts port 443
- Observable fixture: Illustrative: TCP 10.20.10.25:51514 → 203.0.113.80:443

#### Failure or edge state

A reachable host can reject a connection when no process is listening on the selected destination port.

#### Required copy

Canvas labels: Protocol → Source → Destination → Listener. Bottom takeaway: “An IP address identifies a host/interface context; a port and protocol identify transport endpoints.”

#### Accuracy caveats

A socket can bind a specific address or a wildcard; operating-system connection tracking and proxying can add additional state.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc9293)

#### Acceptance checks

- A reachable address does not imply a process listens on port 443.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 9 — NAT rewrites a tuple at a configured edge

#### Purpose

Resolve “Which fields change when the private client reaches the outside network?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Which fields change when the private client reaches the outside network?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **Inside tuple** and can advance to **Reply**.

#### Concepts and actors

Private client tuple, translated public tuple, unchanged remote tuple, edge mapping.

#### Composition

Routing / NAT transformation in the one persistent console. Before/after source tuples flank an SNAT marker; mapping state sits below and the reply path reverses the mapping. The active view’s actor labels and state cues stay in the canvas; In this source-NAT example, the edge maps 10.20.10.25:51514 to 198.51.100.25:62001. Return traffic uses that mapping to find the private client. The remote destination and its port stay the same in this example. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Inside tuple.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Expire mapping** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Inside tuple:** 10.20.10.25:51514
- 2. **Mapping:** edge allocates 198.51.100.25:62001
- 3. **Outside tuple:** destination remains 203.0.113.80:443
- 4. **Reply:** edge applies reverse mapping
- Observable fixture: Illustrative mapping: 10.20.10.25:51514 ↔ 198.51.100.25:62001

#### Failure or edge state

Without matching translation state, a later reply cannot be mapped back to this private flow.

#### Required copy

Canvas labels: Inside tuple → Mapping → Outside tuple → Reply. Bottom takeaway: “NAT changes selected address or port fields; routing and filtering remain separate decisions.”

#### Accuracy caveats

This is an illustrative NAPT mapping, not a universal requirement for IP communication. Both public addresses shown are documentation blocks.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc3022), [primary source](https://www.rfc-editor.org/rfc/rfc5737)

#### Acceptance checks

- The source fields change in this example; routing and filtering are separate.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 10 — DNS returns data before transport starts

#### Purpose

Resolve “How did the client learn 203.0.113.80?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

How did the client learn 203.0.113.80?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. The default scenario is **Cache hit**; **Cache miss** selects the alternate lookup path. Both return an address.

#### Concepts and actors

Application, recursive resolver/cache, delegated authority, A answer and TTL.

#### Composition

Discovery / DNS lookup in the one persistent console. Application query leads to a split cache-or-authority branch and rejoins at the resolver answer; a boundary note keeps DNS off the later packet route. The active view’s actor labels and state cues stay in the canvas; The application asks a resolver, which may answer from cache or query the DNS hierarchy. An A record supplies an IPv4 address; TTL bounds how long a cached answer may be reused. The later TCP packet does not pass through DNS. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default scenario: Cache hit. The cache-hit path highlights application, cache, and answer; the cache-miss path also highlights delegated authority.

#### Interaction

Two native pressed-state buttons select **Cache hit** or **Cache miss** without suggesting that a cache hit queries authority. **Change authoritative record** selects the cache-hit path and compares cached 203.0.113.80 (120 seconds remaining) with authoritative 203.0.113.81. The answer still reaches the client; the status reads **CACHED ANSWER RETURNED**, with amber alternate-state framing rather than a red block. Toggling the change off or selecting a scenario restores the baseline. Tab/Enter/Space operate all controls.

#### Data or content states

- **Cache hit:** return 203.0.113.80 directly from cache without asking authority.
- **Cache miss:** follow delegation and return the authoritative 203.0.113.80 answer.
- **Record changed:** return cached 203.0.113.80 while authority now has 203.0.113.81; the cached answer has 120 seconds remaining.
- Observable fixture: Illustrative DNS record: app.example.test. 300 IN A 203.0.113.80

#### Failure or edge state

A cached address may continue to be used until its TTL expires even after the authoritative record changes.

#### Required copy

Canvas labels: application → resolver cache → answer on a hit; resolver cache → delegated authority → answer on a miss. Bottom takeaway: “DNS discovers a destination; it is not a forwarding hop for the application packet.”

#### Accuracy caveats

Resolver behavior, search paths, multiple answers, IPv6 AAAA records, and connection reuse can change observed requests.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc1034), [primary source](https://www.rfc-editor.org/rfc/rfc1035)

#### Acceptance checks

- A DNS answer supplies data before transport; stale cache can persist until TTL expiry.
- Changing authority returns the older cached address with a remaining TTL; no node or status claims DNS is blocked.

### Visual 11 — A firewall evaluates packets at its own boundary

#### Purpose

Resolve “Why can a SYN fail while a later reply is allowed?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why can a SYN fail while a later reply is allowed?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **New SYN** and can advance to **Reply**.

#### Concepts and actors

New flow, configured policy, connection state, reply and denied packet.

#### Composition

Discovery / Filter and state in the one persistent console. New SYN, policy gate and return flow form a directional rail; stateful/stateless rule treatment is compared below. The active view’s actor labels and state cues stay in the canvas; A stateful firewall can remember an allowed flow and classify return packets using connection state. A stateless rule set evaluates each packet independently. Policy order, direction, and location determine where a packet first fails. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: New SYN.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Drop new SYN** stops at the policy gate, reveals the denied-SYN branch, and leaves the return flow unreached. Toggling it off restores the normal branch.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **New SYN:** evaluate ingress/egress policy
- 2. **Allow:** record accepted connection state
- 3. **Reply:** match established flow
- Observable fixture: Illustrative policy: allow TCP destination 443; allow established replies

#### Failure or edge state

A silent drop leaves the client waiting in SYN-SENT; the server may see no request at all.

#### Required copy

Canvas labels: New SYN → Allow → Reply. Denial is a separate branch at the policy gate, revealed by **Drop new SYN**, never the final step of an allowed flow. Bottom takeaway: “A filter decision depends on rule context and connection state, not just the destination IP.”

#### Accuracy caveats

Different firewalls implement state and timeout behavior differently. A silent drop and an active rejection produce different client evidence.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc9293), [primary source](https://wiki.nftables.org/wiki-nftables/index.php/Matching_connection_tracking_stateful_metainformation)

#### Acceptance checks

- A silent drop can leave the client in SYN-SENT while the server sees no request.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 12 — Load balancing chooses an endpoint using different evidence

#### Purpose

Resolve “How does the information a balancer inspects change its backend choice?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

How does the information a balancer inspects change its backend choice?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. The default comparison selects **L4 connection**. **L7 request** selects the other rail; neither rail is a later stage of the other.

#### Concepts and actors

Transport metadata, HTTP host/path, backend pools, target health.

#### Composition

Discovery / L4 versus L7 in the one persistent console. Two flat rails compare L4 metadata/choice with L7 HTTP evidence/choice; healthy target requirement appears in the bottom note. The active view’s actor labels and state cues stay in the canvas; An L4 balancer can use addresses, ports, protocol and connection state. An L7 HTTP balancer can inspect application attributes such as host and path once it terminates or parses that protocol. Both need healthy eligible targets. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default comparison: L4 connection. Highlight only the selected rail’s input and backend choice.

#### Interaction

Two native pressed-state buttons select **L4 connection** or **L7 request**. There are no numbered checkpoints or step controls in this comparison. **No healthy target** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- **L4 connection:** transport metadata → eligible backend for the connection.
- **L7 request:** HTTP host/path → matching API pool for the request.
- Observable fixture: Illustrative: app.example.test /api → API pool

#### Failure or edge state

The balancer can receive the request but has no eligible backend to send it to.

#### Required copy

Canvas labels: L4 evidence → L4 choice, compared with L7 evidence → L7 choice. Bottom takeaway: “The layer of inspection determines the routing criteria and the connection behavior a balancer can implement.”

#### Accuracy caveats

Products vary in TLS handling, source-IP preservation, connection reuse, and health-check implementation.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)

#### Acceptance checks

- Layer of inspection determines what criteria can drive routing.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 13 — Troubleshoot the first checkpoint that fails

#### Purpose

Resolve “Where should you look when a request times out?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Where should you look when a request times out?

#### Persistent scenario state

HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443. At this view the active checkpoint begins at **Name** and can advance to **Service**.

#### Concepts and actors

Resolver, route table, socket state, filter and listening application.

#### Composition

Diagnosis / Diagnose in the one persistent console. A numbered evidence ladder moves from name to route, socket, policy and service; the first failure is marked at the exact checkpoint. The active view’s actor labels and state cues stay in the canvas; Test a claim at each layer: name resolution, route, neighbor reachability, TCP handshake, policy, then application response. A later test cannot repair an earlier missing prerequisite. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Name.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Inject firewall drop**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Name:** getent hosts app.example.test
- 2. **Route:** ip route get 203.0.113.80
- 3. **Socket:** ss -tn state syn-sent
- 4. **Policy:** Inspect firewall and conntrack state
- 5. **Service:** Confirm a listener and application response
- Observable fixture: $ nc -vz app.example.test 443 / Connection to app.example.test 443 port [tcp/https] succeeded!

#### Failure or edge state

The packet reaches the policy boundary, which silently drops the SYN. The client remains in SYN-SENT until its timeout.

#### Required copy

Canvas labels: Name → Route → Socket → Policy → Service. Bottom takeaway: “Find the first failed assumption, then collect evidence at that layer before changing configuration.”

#### Accuracy caveats

ICMP behavior and firewall policy vary, so a failed ping does not by itself prove TCP is blocked.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://man7.org/linux/man-pages/man8/ip-route.8.html), [primary source](https://man7.org/linux/man-pages/man8/ss.8.html)

#### Acceptance checks

- Diagnosis stops at the first contradicted assumption rather than treating a timeout as one cause.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

## Persistent console and deep-link contract

The canonical public route is `/networking`. Every major view uses its stable fragment (the view IDs in the narrative table). Browser refresh, direct fragment, back and forward select the correct view and open its index group. These are new routes, so no earlier public section aliases exist. Without JavaScript, all 13 figures, their explanations, the grouped index and sources remain stacked inside the same console.

The console contains brand and library navigation, Foundations breadcrumb, title, format/difficulty, publication/review dates, persistent scenario state ribbon, grouped disclosure index, one active canvas, right/bottom inspector, bottom takeaway and previous/current/next navigation, related visuals, primary sources and footer.

## Prototype implementation and quality contract

The self-contained `guide/topics/networking/networking-visual-prototype.html` is generated from the integrated static route with its CSS and JavaScript inlined. It covers the full narrative and controls in one console; it is a review artifact outside catalogue, routing and Pagefind. Its hero traces have manual steps, play/pause, and a material alternate failure.

Factual checks compare every actor, ordering, source value and failure boundary with the linked primary references. Narrative checks ensure the scenario persists and related mechanisms follow dependency order. HTML checks cover semantic controls, direct fragments/history, no-JavaScript stacked reading, keyboard/focus, reduced motion and source reachability. `npm run check`, `npm run build`, `npm run check:graph`, and `npm run check:links` are the publication commands. Browser screenshots at 320 px, 200% zoom and reduced motion remain a separate QA gate; the workspace could not bind a preview socket and Firefox crashed in its sandbox on 2026-09-16.

## Deep-dive handoffs

Published related visuals: [Linux networking](/linux/networking), [Kubernetes networking](/k8s-networking), [VPC packet flow](/vpc-flow). The console ends with these existing targets; proposed extensions wait until a canonical target is published. Keep this specification and its prototype outside the catalogue, routing, and search index.

## Page-level acceptance

- All 13 named figures, inspector explanations, failure copy, sources, and the grouped index are readable inside the same console with JavaScript disabled.
- Under enhancement, exactly one selected visual canvas is shown; selecting a new view opens only its concept group and preserves a stable fragment across refresh and history navigation.
- Every manual checkpoint updates its canvas state and named result, every selected hero trace can be paused and inspected, and its failure state marks a relevant boundary and evidence.
- Topic color and connector meaning follow the brief, while static comparisons remain static where movement adds no teaching value.
- Metadata, catalogue route, related links, source links, type check, static build, graph validation, and generated internal links all resolve.
- Browser review at desktop, 320 px, 200% zoom, keyboard, touch, reduced motion, and no JavaScript is recorded before this page is marked fully migration-complete.

## Integration guidance and status

Canonical metadata: `src/content/topics/networking.mdx`. Canonical route: `src/pages/networking.astro`. Neutral shell: `src/components/TopicConsoleShell.astro`; reusable console behavior: `src/components/foundations/ProtocolConsole.astro`; topic-specific visual forms: `src/components/foundations/VisualCanvas.astro`; source state: `src/components/foundations/protocol-data.ts`; reusable tokens/styles: `src/styles/protocol-console.css`. The prototype remains an approval artifact and must be regenerated after final production edits. Integration status: canonical page retained; console behavior repaired and browser-tested on 2026-10-15. The output takeaway uses a dedicated selector, so initialization preserves every view. Empty-fragment history restores the first view. NAT source fields agree with the translated tuple. The prototype was regenerated from the corrected production build.

## Source index

- [ITU-T X.200 — OSI basic reference model](https://www.itu.int/rec/T-REC-X.200-199407-I/en)
- [RFC 8446 — TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446)

- [RFC 1122 — Internet host requirements](https://www.rfc-editor.org/rfc/rfc1122)
- [RFC 9293 — Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293)
- [RFC 1034 — DNS concepts and facilities](https://www.rfc-editor.org/rfc/rfc1034)
- [RFC 5737 — IPv4 documentation blocks](https://www.rfc-editor.org/rfc/rfc5737)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc1812)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc826)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc894)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc4632)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc768)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc3022)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc1035)
- [Additional primary reference](https://wiki.nftables.org/wiki-nftables/index.php/Matching_connection_tracking_stateful_metainformation)
- [Additional primary reference](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
- [Additional primary reference](https://man7.org/linux/man-pages/man8/ip-route.8.html)
- [Additional primary reference](https://man7.org/linux/man-pages/man8/ss.8.html)

## Correction validation — 2026-10-15

Before the OSI addition, headless Chromium checks passed for all 32 views across Networking, Containers, and SSH: exactly one active canvas, intact opening diagrams, stage selection, failure/alternate toggles, contextual takeaways, and one expanded index group after navigation. Those Networking checks also covered direct fragments, Back/Forward including the empty fragment, NAT state fields, both DNS paths and changed-authority evidence, the separate firewall denial branch, keyboard activation of comparison choices, all 12 views without page overflow at 320 and 720 CSS px and CSS zoom 200%, reduced-motion playback, and all 12 readable views with JavaScript disabled. Desktop and 320 px screenshots were inspected. No JavaScript page errors occurred. CSS zoom and keyboard automation are useful checks but do not replace manual browser zoom, screen-reader, touch-device, or contrast review; those checks remain pending. `npm run check` and `npm run build` passed.

## OSI addition validation — 2026-10-15

Canonical visual module: `src/components/foundations/NetworkLayers.astro`, composed by `VisualCanvas.astro`; scoped styles use shared tokens in `src/styles/network-layers.css`. The new view is second in the Request group; existing fragments are unchanged. Headless Chromium passed seven OSI rows, four TCP/IP groups, all four band selections, local-link failure, keyboard selection, direct-link reload and history, no horizontal page overflow at 320/390/720 px and CSS zoom 200%, zero page errors, and all 13 views with JavaScript disabled. Desktop and mobile screenshots were inspected. The prototype is regenerated from the production build; it remains a design artifact. Manual browser zoom, screen-reader and contrast review remain pending.
