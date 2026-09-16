# Infra Illustrated — Networking Visual Specification v1

**Topic:** Networking — packet journey from application to wire and back  
**Status:** Approval-ready specification  
**Version:** 1.0  
**Audience:** DevOps, cloud, platform, SRE, security, and infrastructure engineers  
**Page promise:** A learner should be able to answer “what happens to my packet?” from hostname resolution through local delivery, routing, transport, translation, filtering, load balancing, and troubleshooting.  
**Persistent scenario:** One HTTPS request from `client.lab.example` (`10.20.10.25`) to `app.example.test` (`203.0.113.80:443`).  
**Primary teaching object:** One packet/flow, with a persistent packet ribbon visible across the experience.  
**Visual standard:** Packet-first interactive network lab.

---

# 1. Non-negotiable information architecture

Networking is not one giant scrolling encyclopedia.

The top-level route is the **networking homepage**:

```text
/networking
```

The homepage must contain:

1. The interactive “Network World” map.
2. A short packet-journey overview.
3. The persistent packet ribbon.
4. Entry points to the topic sub-pages.
5. A compact “where this connects to Linux, Kubernetes, and cloud” bridge.

Every major concept is a sub-page. The homepage map is never duplicated wholesale inside sub-pages.

Recommended routes:

```text
/networking
/networking/fundamentals
/networking/addressing
/networking/ethernet-arp
/networking/routing
/networking/transport
/networking/ports-sockets
/networking/nat
/networking/dns
/networking/firewalls
/networking/load-balancing
/networking/troubleshooting
/networking/advanced
```

Every sub-page must expose an obvious control:

```text
← Back to Networking Map
```

It returns to `/networking` while preserving no hidden state that would confuse a learner.

The approval prototype is self-contained in one HTML file and simulates these routes with hash navigation. Production integration should use the project’s normal router.

---

# 2. Visual thesis

**“Follow one packet through checkpoints.”**

The learner should repeatedly see the same request transformed by different layers:

```text
hostname
  ↓
destination IP
  ↓
socket / 5-tuple
  ↓
TCP segment
  ↓
IP packet
  ↓
Ethernet frame
  ↓
next hop
  ↓
router / NAT / firewall
  ↓
server
```

The page should feel like a packet debugger, not a documentation portal.

The main question behind every section is:

> What information exists at this layer, who makes the decision, and what changes before the packet moves to the next checkpoint?

---

# 3. Scope

## In scope

- TCP/IP mental model and selective OSI mapping.
- Encapsulation and decapsulation.
- IPv4 addressing, subnetting, CIDR, network/broadcast concepts.
- IPv6 foundations, address representation, link-local/global unicast concepts, Neighbor Discovery distinction.
- Ethernet frames, MAC addresses, switches, MAC learning, broadcast domain.
- ARP for IPv4 local-link resolution.
- VLAN/access/trunk conceptual treatment.
- Routing, next hop, default route, longest-prefix match, TTL/hop limit.
- TCP, UDP, ports, sockets, connection state.
- ICMP role in errors and diagnostics.
- NAT/NAPT, source translation, destination translation, port forwarding.
- DNS hierarchy, resolver, authoritative servers, records and TTL/caching.
- Stateful vs stateless filtering, ACL/firewall concepts.
- L4/L7 load balancing, forward/reverse proxy distinction.
- Troubleshooting workflow with Linux network commands.
- Advanced handoffs: BGP, OSPF/IS-IS, VPN/IPsec/WireGuard, VXLAN/overlay, SDN, Anycast, ECMP, MTU/PMTUD, namespaces, service mesh.
- Concept bridges to Linux, Kubernetes, and AWS/cloud networking.

## Non-goals

The overview must not attempt to fully teach:

- BGP policy and path selection internals.
- OSPF LSAs and area design.
- Full TLS handshake cryptography.
- Full HTTP semantics.
- Wi-Fi PHY/MAC behavior.
- MPLS label distribution internals.
- Vendor-specific switch/router CLI configuration.
- AWS VPC internals beyond conceptual bridges.
- Kubernetes CNI internals beyond conceptual bridges.
- Packet capture filter language in exhaustive depth.

Those become dedicated pages.

---

# 4. Canonical scenario

Use documentation-safe example data.

## Client

```text
Hostname: client.lab.example
IPv4:    10.20.10.25/24
MAC:     02:11:22:33:44:25
Gateway: 10.20.10.1
DNS:     10.20.10.53
Ephemeral TCP port: 51514
```

## Local gateway

```text
IPv4: 10.20.10.1/24
MAC:  02:aa:bb:cc:dd:01
```

## Public destination

```text
Hostname: app.example.test
IPv4:    203.0.113.80
TCP:     443
```

`203.0.113.0/24` is reserved for documentation examples by RFC 5737 and must not be represented as a real public endpoint.

## NAT example

```text
Inside local: 10.20.10.25:51514
Inside global: 198.51.100.25:62001
Remote:        203.0.113.80:443
```

`198.51.100.0/24` is also a documentation block.

---

# 5. Persistent packet ribbon

A compact ribbon stays visible on desktop and becomes a normal block on mobile.

Default state:

```text
FLOW: HTTPS request
NAME: app.example.test
SRC:  10.20.10.25:51514
DST:  203.0.113.80:443
L4:   TCP
L3:   IPv4
NEXT HOP: 10.20.10.1
STATE: ready
```

As hero interactions run, update the relevant fields:

- DNS phase: destination may be `unknown`.
- ARP phase: show next-hop MAC as unresolved/resolved.
- TCP phase: show `SYN`, `SYN-ACK`, `ACK`, `ESTABLISHED`.
- NAT phase: show pre/post source tuple.
- Failure phase: show first failing checkpoint.

Dynamic changes must use an `aria-live` summary.

---

# 6. Semantic color tokens

Use meaning-based tokens. Exact project values may replace these during integration.

```css
--page-bg
--surface
--surface-raised
--border
--text
--muted

--packet
--control
--link
--device
--application

--success
--warning
--failure
--state
--inactive
```

Recommended prototype meaning:

- cyan/blue family: live packet/data-plane movement.
- violet: control/decision concepts such as DNS, routing lookup, policy.
- green: allowed/resolved/established.
- amber: unresolved/waiting/cache/TTL.
- red: blocked/dropped/failure.
- grey: inactive/non-selected path.

Never communicate meaning by color alone. Every state also needs text/iconography/border treatment.

---

# 7. Diagram grammar

Use these semantics consistently:

| Visual form | Meaning |
| --- | --- |
| Solid arrow | Actual packet/frame/request movement |
| Dashed arrow | Configuration, lookup, cache, control relationship |
| Animated pulse | The persistent packet/flow |
| Rounded device block | Host, switch, router, firewall, LB, DNS server |
| Nested frame | Scope/broadcast domain/subnet/network boundary |
| Numbered badge | Strict order |
| Broken connector | Path unavailable |
| Gate | Filtering/decision point |
| Envelope stack | Encapsulation |
| Clock ring / TTL chip | Cache TTL, IP TTL/hop limit, timeout |
| Table highlight | Selected route/MAC/NAT/conntrack entry |

Animations exist only to teach order or transformation.

---

# 8. Hero interaction budget

Only three experiences receive rich stateful interaction.

## Hero 1 — End-to-end Packet Journey

A step-through flow from hostname to application response. It ties the whole site together.

## Hero 2 — Forwarding Decision Lab

A combined “same subnet vs remote subnet” decision that makes routing + ARP/neighbor resolution tangible and shows longest-prefix match for remote paths.

## Hero 3 — Troubleshooting Lab

Failure injection plus realistic Linux commands. The topology reacts and the learner identifies the first broken checkpoint.

Other pages remain interactive where useful, but use small selectors, toggles, and before/after views rather than full simulators.

---

# 9. Narrative sequence

| # | Section | Core learner question | Visual form | Interaction | Required takeaway |
|---|---|---|---|---|---|
| 1 | Networking map | What are the major moving parts? | Topology knowledge map | Navigate into sub-pages | Networking is a chain of layer-specific decisions |
| 2 | Packet journey | What happens when I open a site? | Step-through sequence | Hero interaction | A request repeatedly gains/loses headers and crosses decision points |
| 3 | Fundamentals | What is a frame/packet/segment? | Layered anatomy | Select layer | Names describe PDUs at different layers |
| 4 | Addressing | How does an IP + prefix define locality? | CIDR calculator | Prefix slider | Prefix length divides network and host space |
| 5 | Ethernet + ARP | How do local hosts actually deliver? | Switch + neighbor lab | MAC learning / ARP steps | IP chooses destination; Ethernet reaches the next hop on a local link |
| 6 | Routing | How is a next hop chosen? | Decision lab | Hero interaction | Forwarding uses the most specific matching route |
| 7 | Transport | Why TCP vs UDP? | Sequence/state visual | Step TCP states / drop packet | TCP adds connection/reliability semantics; UDP stays datagram-oriented |
| 8 | Ports/sockets | How does traffic reach a process? | 5-tuple inspector | Select connection | IP identifies host/interface; ports identify transport endpoints |
| 9 | NAT | What exactly does NAT rewrite? | Before/after packet transform | Toggle SNAT/DNAT/NAPT | NAT mutates address/port mappings and keeps translation state where required |
| 10 | DNS | How does a name become addresses? | Resolver hierarchy | Step query/cache hit | DNS is distributed, cached, hierarchical name-to-data lookup |
| 11 | Firewalls | Why does one packet pass and another fail? | Gate/conntrack comparison | Stateful/stateless toggle | Stateful filtering can use connection state; stateless ACL logic evaluates packets independently |
| 12 | Load balancing | What does L4 vs L7 selection mean? | Side-by-side traffic distributor | Strategy selector | L4 acts on transport/network metadata; L7 can inspect application semantics |
| 13 | Troubleshooting | Where did the path break? | Terminal + topology | Hero interaction | Troubleshoot layer by layer and find the first failed assumption |
| 14 | Advanced | What comes after the fundamentals? | Deep-dive constellation | Navigate | Advanced topics are compositions/extensions of the same primitives |

The homepage may show #1 and a compact version of #2. Sub-pages own #3–#14.

---

# 10. Homepage — Network World Map

## Purpose

Give the learner a durable topology of networking concepts and establish that later pages are connected, not isolated definitions.

## Learner question

> Where do addressing, Ethernet, routing, TCP, DNS, NAT, firewalls, and load balancers fit relative to each other?

## Persistent scenario state

The packet has not yet been sent. The user has only typed `https://app.example.test`.

## Concepts and actors

Homepage nodes:

- Fundamentals
- Addressing
- Ethernet + ARP
- Routing
- Transport
- Ports + sockets
- NAT
- DNS
- Firewalls
- Load balancing
- Troubleshooting
- Advanced networking

Topology context around those nodes:

```text
CLIENT
  ↓
LAN / SWITCH
  ↓
ROUTER
  ↓
FIREWALL / NAT
  ↓
INTERNET
  ↓
LOAD BALANCER
  ↓
SERVER
```

DNS is drawn as a side lookup that influences the destination before the transport connection starts.

## Composition

Top:

- Infra Illustrated breadcrumb.
- Title: **Networking**
- Promise: **Follow one packet. Understand the network.**
- Persistent packet ribbon.

Center:

- Wide “Network World” topology.
- The physical/logical traffic path is central.
- Concept cards orbit or attach to the relevant part of the path.
- Each card is a real link/button and includes a one-line learner question.

Bottom:

- “One request, many layers” packet-journey preview.
- Three bridges:
  - Linux networking
  - Kubernetes networking
  - Cloud networking

## Interaction

- Selecting any concept opens its simulated sub-route.
- `Send request` launches the compact packet-journey preview.
- `Inspect packet` opens the global packet anatomy panel.
- Keyboard focus follows DOM order, not visual absolute position.

## Failure or edge state

The homepage preview can switch to “DNS failure” to show that the TCP connection never starts if the client cannot obtain a usable destination address.

## Required copy

Takeaway:

> Networking is not one protocol. It is a sequence of decisions that transform and forward the same application intent.

Misconception:

> Common misconception: “A packet just goes to the destination IP.”  
> Correct model: the host first decides whether the destination is local or remote, resolves a link-layer next hop, then forwards hop by hop.

## Mobile behavior

The topology becomes a vertical path, with topic cards placed immediately after the checkpoint they explain. No horizontal panning is required.

## Accessibility

- Topic nodes are `<a>` or `<button>`.
- The map has a text summary immediately below.
- Packet animation stops under reduced motion.
- Active checkpoint uses text plus border/marker.

## Source anchors

- RFC 1122 — Requirements for Internet Hosts: Communication Layers.
- RFC 1812 — IPv4 router requirements.
- RFC 9293 — TCP.
- RFC 1034/1035 — DNS.

## Acceptance checks

- Learner can reach every major page from the map.
- Map does not imply DNS is “in the traffic path”.
- Local LAN and routed WAN concepts are visibly distinct.
- Back navigation from every sub-page returns here.

---

# 11. Visual 1 — End-to-end Packet Journey

## Purpose

Provide the central causal story that every sub-page can reference.

## Learner question

> What actually happens after I type a hostname and press Enter?

## Persistent scenario state

Starts with a hostname only:

```text
app.example.test
destination IP: unknown
```

Ends with an established application flow and response.

## Concepts and actors

1. Application asks resolver for destination.
2. Resolver/cache obtains address.
3. Application opens socket to destination port 443.
4. Host checks destination against local prefixes.
5. Remote destination means use default/selected route.
6. Resolve next-hop link-layer address (ARP for this IPv4 example).
7. Encapsulate:
   - application bytes
   - TCP segment
   - IPv4 packet
   - Ethernet frame
8. Switch forwards local frame.
9. Router decapsulates local L2 frame, decrements TTL, performs route lookup, and re-encapsulates for next link.
10. NAT may rewrite tuple at the boundary.
11. Firewall/filtering may allow/drop.
12. Remote load balancer/server receives.
13. TCP/TLS/application exchange continues.
14. Response follows its own routed return path.

## Composition

Left-to-right desktop sequence of checkpoints, converted to vertical on mobile.

A lower anatomy shelf shows the packet envelope at the current step.

A right-side inspector contains:

```text
Current layer
Source
Destination
Next hop
Current headers
Decision
Observable evidence
```

## Interaction

Controls:

- `Start`
- `Next`
- `Previous`
- `Auto play`
- `Reset`
- Failure selector:
  - none
  - DNS timeout
  - ARP unresolved
  - no matching route
  - firewall drop

At each step:

- One checkpoint becomes active.
- Packet ribbon updates.
- Packet anatomy changes.
- A one-sentence explanation appears.
- Failure state stops at the first failing component and shows what an operator would observe.

Reset returns to hostname-only state.

## Data states

Example state after DNS:

```text
Name: app.example.test
A: 203.0.113.80
```

Example state after socket creation:

```text
TCP 10.20.10.25:51514 → 203.0.113.80:443
```

Example L2 first-hop state:

```text
Ethernet:
src MAC 02:11:22:33:44:25
dst MAC 02:aa:bb:cc:dd:01

IP:
src 10.20.10.25
dst 203.0.113.80
```

Important teaching point: the Ethernet destination MAC is the gateway’s MAC on the first hop, while the IP destination remains the remote server.

## Failure state

For `ARP unresolved`, stop before the first frame carrying the IP packet can be delivered to the gateway.

For `no route`, stop before ARP; the host has no selected next hop.

For `firewall drop`, show that local routing and ARP succeeded; the packet made it farther before failing.

## Required copy

Takeaway:

> The destination IP can stay end-to-end while link-layer headers change hop by hop. NAT is a separate translation event that can alter the IP/port tuple.

Misconception:

> Common misconception: “The destination MAC is the remote server’s MAC.”  
> Correct model: on a routed path, the frame normally targets the next hop on the current link.

## Accuracy caveats

- This is an IPv4 Ethernet scenario. IPv6 uses Neighbor Discovery rather than ARP.
- Real browsers may perform DNS, connection racing, QUIC, proxies, caches, and connection reuse.
- TLS is represented as an application-security phase, not taught here.
- Return path need not be identical to forward path.

## Source anchors

- RFC 826 — ARP.
- RFC 894 — IPv4 over Ethernet.
- RFC 1812 — router forwarding.
- RFC 9293 — TCP.
- RFC 1034 — DNS.
- RFC 3022 — traditional NAT.

## Acceptance checks

- IP destination and first-hop MAC destination are visibly different.
- Failure order is mechanically plausible.
- Router step visibly performs a fresh L2 encapsulation.
- NAT is not implied to occur on every router.

---

# 12. Visual 2 — Packet Anatomy and Encapsulation

## Purpose

Resolve confusion between “frame”, “packet”, “segment”, “datagram”, and application data.

## Learner question

> What exactly is inside the thing moving over the wire?

## Persistent scenario state

The HTTPS request is being prepared for Ethernet transmission.

## Concepts and actors

- Application payload.
- TCP header.
- IPv4 header.
- Ethernet header/trailer.
- Payload relationship between layers.
- Decapsulation on receive.

## Composition

Use a stacked envelope:

```text
Ethernet frame
┌──────────────────────────────────────────────┐
│ Ethernet header                             │
│ ┌──────────────────────────────────────────┐ │
│ │ IPv4 packet                              │ │
│ │ ┌──────────────────────────────────────┐ │ │
│ │ │ TCP segment                          │ │ │
│ │ │ ┌──────────────────────────────────┐ │ │ │
│ │ │ │ Application bytes               │ │ │ │
│ │ │ └──────────────────────────────────┘ │ │ │
│ │ └──────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────┘ │
│ FCS / trailer concept                       │
└──────────────────────────────────────────────┘
```

Side panel maps this to the practical TCP/IP model and only then shows an OSI comparison.

## Interaction

Selecting a layer:

- expands its key fields;
- highlights which component consumes/creates it;
- updates naming:
  - data/message
  - segment
  - packet/datagram
  - frame

A `decapsulate` control reverses the stack.

## Failure or edge state

Show MTU boundary marker. Do not implement fragmentation in this visual; link to MTU deep dive.

## Required copy

> Layer names describe responsibility. Encapsulation means each lower layer carries the higher layer as payload.

Misconception:

> “Everything is a packet” is acceptable colloquially, but precise troubleshooting often depends on knowing whether the problem is at the frame, IP packet, or transport segment layer.

## Source anchors

- RFC 894 — IPv4 datagrams in Ethernet frames.
- RFC 9293 — TCP header/segment semantics.
- RFC 8200 — IPv6 base header.

---

# 13. Visual 3 — Addressing and CIDR Workbench

## Purpose

Make subnet membership calculable and visual.

## Learner question

> Given an IP and prefix, what is local, what is remote, and how big is the subnet?

## Persistent scenario state

Client interface:

```text
10.20.10.25/24
```

## Concepts and actors

IPv4:

- 32-bit address.
- Prefix length.
- Network address.
- Host bits.
- Broadcast address.
- usable-address teaching note.
- RFC 1918 ranges.
- documentation ranges.

IPv6:

- 128-bit address.
- hexadecimal representation.
- zero compression.
- prefix.
- global unicast/link-local/loopback/multicast overview.
- no broadcast address in IPv6.
- Neighbor Discovery handoff.

## Composition

Top: editable IPv4 address + prefix slider.

Middle:

- binary row.
- mask row.
- network/host split.
- calculated network and broadcast.
- examples of “same subnet?” targets.

Bottom: IPv6 card with a compression/expansion example.

## Interaction

Inputs:

```text
IPv4: 10.20.10.25
prefix: /24
```

Slider `/16` to `/30` for teaching; production code may support `/0`–`/32`.

Selecting target addresses answers:

```text
10.20.10.80 → local
10.20.11.80 → remote under /24
```

## Failure or edge state

When `/31` or `/32` is selected in a future full implementation, do not apply the simplistic “network + broadcast unusable” rule blindly; label point-to-point/host-route cases separately.

## Required copy

> A prefix is not a property of an IP address alone; it defines the local network boundary used by the host’s routing logic.

Misconception:

> Private IPv4 does not mean “secure”, and public IPv4 does not mean “automatically reachable”.

## Accuracy caveats

- “Usable host count = 2^hostbits − 2” is a teaching shortcut that has exceptions such as `/31` point-to-point networks.
- IPv6 subnet practice is intentionally simplified in the overview.

## Source anchors

- RFC 1918 — private IPv4 ranges.
- RFC 4632 — CIDR.
- RFC 5737 — documentation IPv4 ranges.
- RFC 8200 — IPv6.
- RFC 4291 — IPv6 addressing architecture.

---

# 14. Visual 4 — Ethernet, Switch Learning, and ARP

## Purpose

Show how IP traffic becomes deliverable on a local Ethernet link.

## Learner question

> My host knows an IP address. How does it know which Ethernet destination to use?

## Persistent scenario state

Two selectable cases:

1. Same subnet: `10.20.10.25 → 10.20.10.80`.
2. Remote subnet: `10.20.10.25 → 203.0.113.80`.

## Concepts and actors

- Host A / Host B.
- Switch ports.
- source/destination MAC.
- MAC learning table.
- unknown unicast flooding concept.
- broadcast ARP request.
- ARP reply.
- ARP/neighbor cache.
- remote-destination gateway resolution.
- VLAN/access/trunk conceptual extension.

## Composition

Left: hosts and switch.

Right: live tables:

```text
SWITCH MAC TABLE
MAC                  PORT
02:11:...:25         1
02:11:...:80         4

ARP CACHE
10.20.10.1           02:aa:...:01
```

Bottom: packet/frame inspector.

## Interaction

Light interaction sequence:

- `Clear tables`
- `Send same-subnet packet`
- `Send remote packet`
- `ARP request`
- `ARP reply`
- `Inspect frame`

For remote destination, the selected ARP target must be `10.20.10.1`, not `203.0.113.80`.

## Failure or edge state

- Missing ARP reply leaves neighbor unresolved.
- Wrong VLAN shows that MAC discovery/local broadcast scope is bounded by the VLAN/broadcast domain.

## Required copy

> ARP resolves an IPv4 next-hop address to a link-layer address on the local link.

Misconception:

> A host does not normally ARP for a remote Internet server. It ARPs for the selected local next hop.

## Accuracy caveats

- IPv6 uses Neighbor Discovery, not ARP.
- Switch forwarding behavior is simplified; CAM aging, STP, multicast behavior, security features, and hardware pipelines are deep dives.

## Source anchors

- RFC 826 — ARP.
- RFC 894 — IP over Ethernet.
- IEEE 802.1Q should be linked in production if the project has access to the standard; the overview may use vendor-neutral VLAN terminology.

---

# 15. Visual 5 — Forwarding Decision Lab

## Purpose

Make “local vs remote”, route lookup, next hop, and longest-prefix match one coherent decision.

## Learner question

> How does a host/router choose where this packet goes next?

## Persistent scenario state

Destination selector:

```text
10.20.10.80
10.20.20.50
203.0.113.80
```

Canonical routing table:

```text
10.20.10.0/24      dev eth0      connected
10.20.20.0/24      via 10.20.10.2
203.0.113.0/24     via 10.20.10.254
0.0.0.0/0          via 10.20.10.1
```

Add one deliberately overlapping route:

```text
203.0.113.64/26    via 10.20.10.253
```

Destination `203.0.113.80` therefore selects `/26`, not `/24` or default.

## Composition

Left: packet and destination.

Center: route table, where candidate matching routes illuminate.

Right:

```text
Selected route
Next hop
Egress interface
Neighbor to resolve
Reason: longest matching prefix
```

Below: simple router hop topology with TTL decrement.

## Interaction — HERO 2

Controls:

- choose destination;
- enable/disable selected routes;
- `Evaluate route`;
- `Resolve next hop`;
- `Forward`;
- `Reset`.

Decision steps are explicit:

1. find matching prefixes;
2. choose the longest matching prefix;
3. derive next hop / egress;
4. resolve link-layer neighbor on the outgoing link;
5. transmit.

Failure injection:

- remove default route;
- disable most-specific route;
- unresolved next hop;
- TTL reaches zero.

## Failure state

If no route matches and no default exists, the packet stops before neighbor resolution.

If TTL reaches zero at a router, show drop + ICMP time exceeded concept.

## Required copy

> Routing answers “which next hop/interface?”; ARP/ND answers “what link-layer address do I use to reach that next hop on this link?”

Misconception:

> “Default route wins if it exists.”  
> Correct model: the default route is the least-specific fallback. A more-specific matching prefix wins.

## Source anchors

- RFC 1812 — most-specific/longest-prefix forwarding.
- RFC 4632 — CIDR longest-match behavior.
- RFC 792 — ICMP.
- RFC 826 — ARP.

## Acceptance checks

- `203.0.113.80` selects `/26` when present.
- Removing `/26` falls back to `/24`.
- Removing both `/26` and `/24` falls back to default.
- Removing default too gives “no route”.
- ARP/neighbor resolution happens after route selection.

---

# 16. Visual 6 — TCP and UDP Transport Lab

## Purpose

Explain transport semantics without reducing the comparison to “TCP reliable, UDP fast”.

## Learner question

> What state does TCP maintain that UDP does not?

## Persistent scenario state

TCP flow:

```text
10.20.10.25:51514 → 203.0.113.80:443
```

UDP example:

```text
10.20.10.25:53000 → 10.20.10.53:53
```

## Concepts and actors

TCP:

- SYN, SYN-ACK, ACK.
- sequence/acknowledgment.
- retransmission concept.
- receive window concept.
- FIN/RST.
- TIME_WAIT awareness.
- connection state.

UDP:

- datagrams.
- source/destination port.
- length/checksum.
- no TCP-style connection establishment.
- no transport-level ordering/retransmission guarantee.

Also show QUIC/HTTP/3 as “reliable application transport semantics built over UDP” handoff.

## Composition

Two tabs: TCP and UDP.

TCP shows sequence lanes client/server and a small state machine.

UDP shows independent datagrams and minimal state.

## Interaction

TCP:

- `SYN`
- `SYN-ACK`
- `ACK`
- `send data`
- `drop segment`
- `retransmit`
- `FIN`
- `RST`
- `reset`

UDP:

- `send datagram`
- `drop datagram`
- `send another`

## Failure or edge state

Dropped TCP segment illustrates retransmission concept. Dropped UDP datagram shows that any recovery is application-specific.

## Required copy

> TCP is a byte-stream transport with connection state and reliability mechanisms. UDP provides datagram delivery with much less transport machinery.

## Accuracy caveats

- Congestion control, RTO calculation, SACK, ECN, window scaling, and modern TCP variants deserve a dedicated deep dive.
- “UDP is faster” is not a universal architectural rule.

## Source anchors

- RFC 9293 — TCP.
- RFC 768 — UDP.
- RFC 9000 — QUIC deep-dive anchor.

---

# 17. Visual 7 — Ports, Sockets, and the 5-Tuple

## Purpose

Connect network traffic to a local process.

## Learner question

> The packet reached the host. How does the kernel know which application gets it?

## Persistent scenario state

```text
TCP
10.20.10.25:51514
→
203.0.113.80:443
```

## Concepts and actors

- protocol.
- source IP.
- source port.
- destination IP.
- destination port.
- listening socket.
- established socket.
- wildcard bind awareness.
- ephemeral ports.
- one server port serving many concurrent flows because client tuples differ.

## Composition

Left: host with processes.

Center: listening sockets.

Right: active 5-tuples.

Terminal strip:

```text
ss -lntp
ss -ntp
```

Use representative safe output.

## Interaction

Select Nginx/SSH/PostgreSQL listeners to show which incoming tuples would match.

## Failure or edge state

- Port closed → no listener.
- Bound to loopback only → remote client cannot reach it even if host routing/firewall permits.
- Firewall may block before socket delivery.

## Required copy

> A port is not an application by itself. A socket is the kernel endpoint that binds protocol/address/port state to a process.

## Source anchors

- RFC 9293 — TCP ports and connections.
- RFC 768 — UDP ports.

---

# 18. Visual 8 — NAT Translation Workbench

## Purpose

Show exact tuple mutation rather than depicting NAT as a magic cloud.

## Learner question

> Which fields change at a NAT boundary, and how does the response find its way back?

## Persistent scenario state

Before translation:

```text
10.20.10.25:51514 → 203.0.113.80:443
```

After NAPT:

```text
198.51.100.25:62001 → 203.0.113.80:443
```

Mapping:

```text
10.20.10.25:51514
↔
198.51.100.25:62001
```

## Concepts and actors

Modes:

- Basic source NAT.
- NAPT/PAT.
- DNAT.
- port forwarding.
- static mapping.
- return translation.

## Composition

Center NAT boundary with packet “before” and “after” cards.

Below: translation table.

Right: response packet and reverse mapping.

## Interaction

Selector:

```text
SNAT
NAPT
DNAT / port forward
```

`Send outbound` populates mapping.

`Return packet` performs reverse mapping.

## Failure or edge state

- Missing/expired mapping.
- Exhausted translation port pool conceptual warning.
- Protocols that embed addresses can complicate NAT traversal.

## Required copy

> NAT is translation state at a boundary, not routing itself.

Misconception:

> NAT is not a substitute for a firewall policy, even though many devices combine both functions.

## Source anchors

- RFC 3022 — traditional NAT/NAPT.
- RFC 4787 — NAT behavioral requirements for UDP (deep dive).

---

# 19. Visual 9 — DNS Resolution Journey

## Purpose

Make recursive resolution, referrals, authoritative data, caching, and TTL visually distinct.

## Learner question

> Who actually knows the answer for `app.example.test`?

## Persistent scenario state

Client needs an address for:

```text
app.example.test
```

## Concepts and actors

- application/stub resolver.
- local cache.
- recursive resolver.
- root.
- TLD.
- authoritative server.
- resource records.
- TTL.
- negative caching awareness.
- A/AAAA/CNAME/MX/TXT/NS/SOA/PTR overview.

## Composition

Left client, center recursive resolver/cache, right hierarchical authoritative path.

DNS is drawn as a lookup plane, not inline with application packets after resolution.

## Interaction

Step-through:

1. client cache.
2. resolver cache.
3. root referral.
4. TLD referral.
5. authoritative answer.
6. cache answer with TTL.
7. repeat query → cache hit.

Record-type selector updates the inspector.

## Failure or edge state

- `NXDOMAIN`.
- resolver timeout.
- stale cached answer discussion.
- DNS answer exists but network connection can still fail.

## Required copy

> DNS answers questions about names and resource records; it does not route the resulting packets.

Misconception:

> “DNS points traffic to a server.”  
> More precise: DNS returns data such as addresses or aliases; the client then chooses and connects using networking/transport logic.

## Accuracy caveats

Modern resolvers may use aggressive caching, DNSSEC validation, DoH/DoT, QNAME minimization, and implementation-specific behaviors; those are deep dives.

## Source anchors

- RFC 1034 — DNS concepts.
- RFC 1035 — DNS implementation/specification.
- RFC 2308 — negative caching.
- RFC 3596 — IPv6 AAAA records.

---

# 20. Visual 10 — Firewall and Connection-State Gate

## Purpose

Teach filtering as a decision on traffic metadata/state rather than a red shield icon.

## Learner question

> Why can the reply return even when I never wrote an explicit inbound rule for the ephemeral client port?

## Persistent scenario state

Outbound TCP connection to `203.0.113.80:443`.

## Concepts and actors

- rule match.
- direction.
- source/destination.
- protocol/port.
- ordered ACL concept.
- stateful connection tracking.
- established/related concept at a high level.
- default deny/allow policy concept.
- L3/L4 firewall vs L7/WAF distinction.

## Composition

Two side-by-side modes:

**Stateless ACL**

```text
packet → rule list → allow/drop
return packet → independent rule list → allow/drop
```

**Stateful firewall**

```text
new flow → policy → conntrack state
return packet → established flow state → policy handling
```

## Interaction

Toggle:

- stateful
- stateless

Test packets:

- outbound TCP 443.
- inbound reply.
- unsolicited inbound TCP 22.
- UDP response example.

## Failure or edge state

Asymmetric routing may cause stateful devices to miss expected connection state if paths split across independent state tables.

## Required copy

> Stateful filtering remembers flow state. Stateless filtering evaluates each packet without relying on prior-flow state.

Misconception:

> Stateful does not mean “automatically secure”; the initial policy can still be dangerously broad.

## Accuracy caveats

Firewall implementations vary. This visual teaches the model, not a specific nftables, pf, Cisco ACL, AWS SG, or cloud NACL implementation.

## Source anchors

- Linux conntrack/nftables documentation should be used for the Linux-specific deep dive.
- RFC 9293 provides TCP state context.
- AWS-specific stateful SG/stateless NACL behavior belongs on the AWS networking page, not as protocol truth here.

---

# 21. Visual 11 — Load Balancer and Proxy Matrix

## Purpose

Separate L4 load balancing, L7 reverse proxying, and forward proxying.

## Learner question

> Which component terminates or understands which layer?

## Persistent scenario state

Client connects to a virtual frontend that selects among three application servers.

## Concepts and actors

- frontend/listener.
- backend/target.
- health.
- L4 tuple-based forwarding.
- L7 host/path/header awareness.
- TLS termination location awareness.
- reverse proxy.
- forward proxy.
- source-address preservation caveat.

## Composition

Top comparison:

```text
L4
client → VIP:443 → backend connection/flow

L7
client → HTTP-aware proxy → selected backend
```

Below:

```text
Forward proxy: client-side intermediary for destinations
Reverse proxy: server-side intermediary in front of origins
```

## Interaction

Strategy selector:

- round robin.
- least connections concept.
- weighted.
- hash/stickiness concept.

L7 request selector:

```text
Host: api.example.test
Path: /orders
```

changes selected backend pool.

## Failure or edge state

Mark one backend unhealthy and show it removed from normal selection.

## Required copy

> “Layer 4 vs Layer 7” describes what information the load balancer can act on; product implementations may proxy, NAT, tunnel, or preserve addresses in different ways.

## Source anchors

This overview should reference standards for TCP/HTTP plus authoritative documentation on whichever implementation is used in a later vendor-specific page.

---

# 22. Visual 12 — Troubleshooting Network Lab

## Purpose

Turn the mental model into an operational method.

## Learner question

> The application says “network issue”. What do I check first, and how do I avoid guessing?

## Persistent scenario state

Same client-to-app flow, with one injected failure.

## Topology

```text
client
  │
switch / local link
  │
gateway
  │
firewall / NAT
  │
internet / routed path
  │
load balancer
  │
server
```

DNS remains a side dependency.

## Terminal

Canonical prompt:

```text
netlab@client:~$
```

Supported simulated commands:

```text
ip addr
ip route
ip neigh
ping 10.20.10.1
ping 203.0.113.80
traceroute 203.0.113.80
dig app.example.test
ss -lntp
nc -vz 203.0.113.80 443
curl -vk https://app.example.test/
tcpdump -ni eth0 host 203.0.113.80
```

Do not pretend every command works identically on every OS. This is a Linux-oriented troubleshooting workspace.

## Interaction — HERO 3

Failure selector:

- healthy.
- DNS failure.
- missing default route.
- unresolved gateway neighbor.
- firewall drops TCP 443.
- service not listening.
- MTU black-hole symptom.

Learner runs commands.

Each command returns realistic output consistent with the selected failure.

Topology highlights the first broken checkpoint only after sufficient evidence or via a `Reveal fault` control.

## Example evidence

### DNS failure

```text
$ dig app.example.test
;; connection timed out; no servers could be reached
```

### Missing route

```text
$ ip route
10.20.10.0/24 dev eth0 proto kernel scope link src 10.20.10.25

$ ping 203.0.113.80
connect: Network is unreachable
```

### Firewall drop

```text
$ nc -vz 203.0.113.80 443
nc: connect to 203.0.113.80 port 443 (tcp) timed out
```

with routing and neighbor evidence still healthy.

### Service not listening

The network can reach the host but connection gets refused, emphasizing that “connection refused” differs from a timeout.

### MTU black-hole symptom

TCP handshake may succeed, but larger application data stalls. Link to PMTUD deep dive and show ICMP filtering as a possible cause, not a universal diagnosis.

## Required troubleshooting loop

```text
1. Name?
2. Local interface/address?
3. Route?
4. Next-hop neighbor?
5. Reachability / hop evidence?
6. Filter/NAT?
7. Transport connection?
8. Local listener?
9. Application/TLS?
10. Packet capture when ambiguity remains.
```

This is the production-practice ending of the whole Networking overview.

## Required copy

> Find the first failed assumption. Do not jump straight to “firewall”.

Misconception:

> Ping failure alone does not prove the destination is down; ICMP may be filtered while the application path still works.

## Accessibility

- Commands are real buttons as well as copyable text.
- Terminal output uses text, never raster.
- Fault state is announced in an `aria-live` result.
- Output remains understandable with animation disabled.

## Source anchors

- RFC 792 — ICMP.
- RFC 1812 — router behavior.
- RFC 8201 / RFC 1191 — PMTUD.
- Linux `iproute2`, `ss`, `ping`, `tracepath`, `tcpdump` documentation should anchor the production Linux-specific page.

## Acceptance checks

- Different failure modes produce internally consistent command output.
- “No route” fails earlier than firewall.
- “Connection refused” differs from timeout.
- DNS is tested independently from connecting directly to an IP.
- The learner can complete a healthy path without revealing the answer.

---

# 23. Advanced Networking constellation

Route:

```text
/networking/advanced
```

Do not teach all of these inline. Show them as a constellation grouped by the primitive they extend.

## Routing and internet scale

- BGP.
- OSPF.
- IS-IS.
- ECMP.
- Anycast.
- policy routing.

## Tunnels and overlays

- GRE.
- IPsec.
- WireGuard.
- VXLAN.
- overlay vs underlay.

## Segmentation and virtual networking

- VLAN.
- VRF.
- network namespaces.
- veth/bridge.
- SDN.

## Performance

- MTU.
- fragmentation.
- PMTUD / PLPMTUD.
- congestion.
- QoS.
- bufferbloat.

## Cloud-native

- Kubernetes CNI.
- service routing.
- eBPF dataplanes.
- service mesh.
- cloud VPC/VNet constructs.
- Transit Gateway / peering / PrivateLink-style patterns as cloud-specific deep dives.

The advanced page should repeatedly connect concepts back to the core primitives.

Example:

```text
VXLAN = Ethernet frame carried inside an overlay over an IP underlay.
```

---

# 24. Global Packet Inspector

A global `Inspect packet` control should be available from the persistent ribbon.

It opens a non-modal expandable shelf on desktop and a full-width section on mobile.

Default sample:

```text
ETHERNET
src MAC: 02:11:22:33:44:25
dst MAC: 02:aa:bb:cc:dd:01
ethertype: IPv4

IPV4
src: 10.20.10.25
dst: 203.0.113.80
ttl: 64
protocol: TCP

TCP
src port: 51514
dst port: 443
flags: SYN
seq: 1000
ack: 0

APPLICATION
intent: open HTTPS connection
```

When the journey crosses a router:

- Ethernet addresses change.
- TTL decrements.
- IP source/destination normally remain unless a translation occurs.

When NAT occurs:

- source IP/port update in the inspector.
- translation is explicitly labelled.

This component should be reusable later in Linux, Kubernetes, and AWS networking visuals.

---

# 25. Misconceptions that must appear in context

Do not collect these into a generic “myths” section. Place them at the exact visual where the model becomes clear.

1. **Remote destination MAC**
   - Wrong: destination Ethernet MAC is the remote server’s MAC.
   - Correct: on a routed path it is normally the current-link next hop.

2. **ARP target**
   - Wrong: ARP for every IPv4 destination.
   - Correct: ARP only resolves a target on the local link; remote traffic usually resolves the gateway/selected next hop.

3. **Default route**
   - Wrong: default route wins whenever configured.
   - Correct: longest-prefix/more-specific route wins first.

4. **DNS**
   - Wrong: DNS routes traffic.
   - Correct: DNS returns naming data; the connection then uses transport/routing.

5. **NAT**
   - Wrong: NAT is a firewall.
   - Correct: translation and filtering are separate concepts even when one device provides both.

6. **Ping**
   - Wrong: failed ping proves the application host is down.
   - Correct: ICMP behavior can differ from the application path.

7. **TCP vs UDP**
   - Wrong: UDP is simply “faster TCP”.
   - Correct: UDP has different transport semantics; applications may build reliability/ordering above it.

---

# 26. Cross-project bridges

These should appear at the bottom of the homepage, not as full lessons.

## Linux bridge

```text
process
  ↓
socket
  ↓
kernel TCP/IP stack
  ↓
route lookup
  ↓
neighbor table
  ↓
interface / qdisc
  ↓
NIC
```

Links to Linux networking sub-page.

## Kubernetes bridge

```text
Pod
  ↓
network namespace
  ↓
veth
  ↓
CNI / node dataplane
  ↓
route / service / overlay
  ↓
node NIC
```

Links to Kubernetes networking.

## AWS bridge

```text
workload
  ↓
ENI
  ↓
subnet
  ↓
route table
  ↓
SG / NACL
  ↓
IGW / NAT / TGW / endpoint path
```

Links to AWS networking/VPC concepts.

Do not imply cloud abstractions replace TCP/IP fundamentals; they compose around them.

---

# 27. Responsive requirements

Target: 320 px mobile through large desktop.

## Desktop

- Homepage topology can be 2D and spacious.
- Packet ribbon may be sticky but must stay below ~15% viewport height.
- Sub-page visual + inspector can use two columns.

## Tablet

- Reduce map cross-links.
- Keep central packet path vertical or diagonal.
- Inspectors move below main diagram.

## Mobile

- No page-level horizontal scrolling.
- Every horizontal sequence becomes numbered vertical steps.
- Route/MAC/NAT tables become stacked key/value cards if needed.
- Sticky ribbon becomes normal-flow compact block.
- Buttons minimum practical touch target.
- Terminal wraps long lines or uses internal overflow only where unavoidable.
- `Back to Networking Map` stays visible near top of every sub-page.

---

# 28. Accessibility requirements

- Native semantic controls only.
- Visible keyboard focus.
- Meaning never depends on color.
- Dynamic state updates announced through appropriate live regions.
- Every animated journey has equivalent textual numbered steps.
- Respect `prefers-reduced-motion`; replace moving packet pulses with instant checkpoint changes.
- Packet inspector uses headings and definition lists/tables.
- Diagrams have concise text summaries.
- No critical learning content in hover-only tooltips.
- At 200% zoom, text must not overlap connectors or disappear.
- Route/sub-page navigation uses real links.

---

# 29. Prototype implementation contract

The approval prototype must:

- be one self-contained HTML file;
- use inline CSS and JavaScript;
- load no external library or font;
- simulate sub-pages via URL hash;
- implement the complete homepage;
- include representative content for all topic routes;
- make hero interactions actually work;
- support reset for every simulator;
- include at least these failures:
  - DNS failure;
  - no route;
  - firewall drop;
  - service not listening;
- include the global packet inspector;
- include primary-source links;
- remain understandable if JavaScript fails by retaining section summaries in HTML;
- avoid secrets, real endpoints, account identifiers, or private infrastructure names.

Production integration should replace the hash router with the repository’s normal routing primitives, while preserving the navigation and state model.

---

# 30. Production implementation guidance

## Reusable components

Recommended conceptual component boundary:

```text
NetworkingHomeMap
PacketRibbon
PacketInspector
PacketJourney
LayerStack
CIDRWorkbench
EthernetArpLab
RoutingDecisionLab
TransportLab
SocketInspector
NatWorkbench
DnsJourney
FirewallGate
LoadBalancerMatrix
NetworkTroubleshootingLab
AdvancedNetworkingMap
```

## Shared data model

Use one packet/flow object across visuals where possible:

```js
{
  appName: "app.example.test",
  srcIp: "10.20.10.25",
  srcPort: 51514,
  dstIp: "203.0.113.80",
  dstPort: 443,
  protocol: "TCP",
  srcMac: "02:11:22:33:44:25",
  nextHopIp: "10.20.10.1",
  nextHopMac: "02:aa:bb:cc:dd:01",
  ttl: 64,
  state: "ready"
}
```

Do not let each page invent contradictory values for the same canonical journey.

---

# 31. Deep-dive handoffs

## BGP — “How the Internet chooses paths”

Why separate:
- path vector mechanics, attributes, policy, eBGP/iBGP, route reflectors, convergence, leaks/hijacks.

Persistent object:
- one prefix advertisement.

Link from:
- Routing page and Advanced page.

## DNS internals and DNSSEC

Persistent object:
- one query and validation chain.

Link from:
- DNS page.

## TCP internals

Persistent object:
- one long-lived TCP connection under loss/congestion.

Link from:
- Transport page.

## MTU / fragmentation / PMTUD

Persistent object:
- one packet larger than a path bottleneck MTU.

Link from:
- Packet Anatomy, Routing, Troubleshooting.

## Linux networking internals

Persistent object:
- one process write becoming an skb and leaving a NIC.

Link from:
- Ports/sockets and troubleshooting.

## VLAN / STP / switching

Persistent object:
- one frame across multiple switches/VLANs.

Link from:
- Ethernet + ARP.

## VPN / IPsec / WireGuard

Persistent object:
- one original IP packet encapsulated/encrypted into a tunnel.

Link from:
- Advanced.

## VXLAN and overlays

Persistent object:
- one tenant Ethernet frame encapsulated over an IP underlay.

Link from:
- Advanced and Kubernetes bridge.

## Kubernetes networking

Persistent object:
- Pod A packet to Pod/Service B.

Link from:
- homepage bridge and Advanced.

## AWS/VPC networking

Persistent object:
- one flow through ENI, subnet, route table, SG/NACL, gateway/endpoint/TGW.

Link from:
- homepage bridge.

---

# 32. Production-practice ending

End the Networking section with this operational loop:

```text
1. Establish identity of endpoints
   name, IP, subnet, protocol, port

2. Verify local host state
   interface, address, listener

3. Verify forwarding
   route, next hop, neighbor

4. Verify boundaries
   NAT, firewall, ACL, proxy/LB

5. Verify transport
   handshake, reset, timeout, retransmission

6. Inspect evidence
   DNS answer, route table, neighbor table, socket state, packet capture

7. Test the failure mode
   do not infer from one signal such as ping

8. Fix the first broken assumption
   then retest end-to-end
```

Takeaway:

> Troubleshooting is the packet journey in reverse: prove each dependency until you find the first false assumption.

---

# 33. Page-level acceptance criteria

The implementation is approved only when:

- `/networking` immediately communicates the major conceptual map.
- Every map node opens the correct sub-page.
- Every sub-page has Back to Networking Map.
- The same canonical flow remains recognizable across pages.
- The end-to-end packet journey can be stepped forward/back and reset.
- Packet anatomy visibly changes as layers are added/removed.
- Remote traffic resolves the gateway/next-hop MAC, not remote-server MAC.
- The routing lab demonstrates longest-prefix match with overlapping routes.
- DNS is represented as a lookup dependency, not an inline router.
- NAT visibly rewrites tuple state.
- Stateful/stateless filtering is not reduced to product-specific AWS semantics.
- Troubleshooting failures produce consistent Linux command evidence.
- IPv6 is included as a first-class addressing concept and is not taught as “IPv4 with bigger addresses”.
- ARP is explicitly scoped to IPv4; IPv6 Neighbor Discovery is called out.
- The prototype works without external assets.
- Reduced motion works.
- Mobile does not require page-level horizontal scroll.
- The page ends with an operator-oriented troubleshooting loop, not generic best-practice prose.

---

# 34. Source index

Primary protocol references:

- RFC 826 — ARP: https://www.rfc-editor.org/info/rfc826
- RFC 768 — UDP: https://www.rfc-editor.org/info/rfc768
- RFC 792 — ICMP: https://www.rfc-editor.org/info/rfc792
- RFC 894 — IPv4 over Ethernet: https://www.rfc-editor.org/rfc/rfc894.html
- RFC 1034 — DNS concepts: https://www.rfc-editor.org/info/rfc1034
- RFC 1035 — DNS implementation/specification: https://www.rfc-editor.org/info/rfc1035
- RFC 1191 — IPv4 Path MTU Discovery: https://www.rfc-editor.org/info/rfc1191
- RFC 1812 — IPv4 routers / longest-prefix behavior: https://www.rfc-editor.org/info/rfc1812
- RFC 1918 — private IPv4 address space: https://www.rfc-editor.org/info/rfc1918
- RFC 2308 — DNS negative caching: https://www.rfc-editor.org/info/rfc2308
- RFC 3022 — traditional NAT/NAPT: https://www.rfc-editor.org/info/rfc3022
- RFC 3596 — IPv6 DNS extensions: https://www.rfc-editor.org/info/rfc3596
- RFC 4291 — IPv6 addressing architecture: https://www.rfc-editor.org/info/rfc4291
- RFC 4632 — CIDR: https://www.rfc-editor.org/info/rfc4632
- RFC 4861 — IPv6 Neighbor Discovery: https://www.rfc-editor.org/info/rfc4861
- RFC 5737 — documentation IPv4 blocks: https://www.rfc-editor.org/info/rfc5737
- RFC 7348 — VXLAN: https://www.rfc-editor.org/info/rfc7348
- RFC 8200 — IPv6 specification: https://www.rfc-editor.org/info/rfc8200
- RFC 8201 — IPv6 Path MTU Discovery: https://www.rfc-editor.org/info/rfc8201
- RFC 8305 — Happy Eyeballs v2: https://www.rfc-editor.org/info/rfc8305
- RFC 9000 — QUIC: https://www.rfc-editor.org/info/rfc9000
- RFC 9293 — TCP: https://www.rfc-editor.org/info/rfc9293

Use current project-native sources for Linux command behavior and vendor-specific cloud pages when those deep dives are implemented.
