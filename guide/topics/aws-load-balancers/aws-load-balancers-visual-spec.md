# ALB vs NLB: choosing an AWS traffic entry point — visual specification

- **Topic:** Application Load Balancer, Network Load Balancer, Gateway Load Balancer, and AWS Global Accelerator
- **Status and version:** Integrated to src/content/topics/aws-load-balancers.mdx; product behavior verified 2026-09-10
- **Target audience:** Developers moving into cloud infrastructure who understand HTTP, TCP/IP, VPCs, and Availability Zones but do not yet have a dependable model for choosing and combining these services
- **Page promise:** Give the reader a direct selection rule: ALB for HTTP-aware application routing, NLB for transport protocols or zonal static IPs, GWLB for routed appliance inspection, and Global Accelerator for stable multi-Region entry.
- **Narrative structure:** Begin with practical “use this when” choices, place the four services in an example architecture, then show how to build and operate each path: ALB request routing, NLB transport forwarding, GWLB appliance insertion, and Global Accelerator regional failover.
- **Format and difficulty:** Deep Dive; intermediate
- **Primary collection and tags:** AWS; Networking, Reliability, Security, Troubleshooting
- **Scope:** Standard AWS Global Accelerator, ALB, NLB, and GWLB data-plane behavior; listeners, target groups or endpoint groups, routing information, health boundaries, common compositions, and operational implications.
- **Non-goals:** Classic Load Balancer, custom routing accelerators, API Gateway, CloudFront, Route 53 policy design, exhaustive quotas, pricing arithmetic, Kubernetes controller annotations, detailed TLS policies, and virtual-appliance vendor configuration.
- **Visual thesis:** **Start with the protocol and required decision.** ALB can route from HTTP request data; NLB forwards transport flows and supplies zonal addresses; GWLB sends routed traffic through appliances; Global Accelerator directs new connections to regional endpoints. Combine them only when each service adds a separate capability.

## Semantic color and diagram grammar

The prototype adapts the repository tokens: `#090c13` page background; `#0f141e` and `#141b28` surfaces; cyan/blue for the active data path; green plus a check label for healthy state; amber plus a diamond label for a transition or caution; red plus a broken connector and failure label for an unavailable path; purple for rules, configuration, and health decisions. AWS orange appears only in collection framing, never as a runtime state.

The integrated page uses the official July 2026 AWS architecture resource icons for ALB, NLB, GWLB, and Global Accelerator. Icons reinforce adjacent text labels and never replace them.

- Solid arrow: runtime packet, connection, or HTTP request.
- Dashed arrow: health signal, configuration relationship, or a route-table decision.
- Double-line tunnel: GENEVE encapsulation between GWLB and an appliance.
- Outer frame: Region, VPC, Availability Zone, or AWS edge scope.
- Numbered disc: strict sequence step.
- Envelope chips: information currently available to the deciding service.
- Broken arrow with `DROP` or `UNAVAILABLE`: a failed path; color is reinforced by line style and text.
- Animated cyan bead: the packet inside the GWLB stepper only. Motion stops under `prefers-reduced-motion` while the active step remains visibly selected.

## Accuracy worksheet

| Question | Resolved model |
| --- | --- |
| Actual primitives | ALB/NLB/GWLB load balancer, listener, listener rule, target group, registered target, health check GWLB endpoint and endpoint service; Global Accelerator accelerator, static anycast address, listener, regional endpoint group, endpoint, health evaluation. |
| Configuration versus runtime | Listeners, rules, groups, targets, traffic dials, weights, routes, and attributes are configuration. HTTP requests, transport flows, packets, health probes, target states, and selected paths are runtime state. |
| Ownership | ELB owns load-balancer nodes and health evaluation; the customer owns listener/routing configuration, target capacity, VPC routes, security controls, and appliance behavior. Global Accelerator owns edge ingress and health-based endpoint selection; the customer owns endpoint configuration and the regional stacks. |
| Lifecycle initiator | The client starts a connection. Route-table lookup initiates a GWLB detour; a listener accepts traffic; a rule or flow hash chooses the next group/target. |
| Control-plane decisions | ALB listener-rule priority and actions; NLB listener/default action and flow mapping; VPC route tables plus GWLB flow mapping; Global Accelerator endpoint-group/endpoint health, location, dials, and weights. |
| Data-plane carriers | Global Accelerator edge/network, ELB nodes, GWLB endpoints, GENEVE tunnels, appliance targets, and application targets. |
| Stored state | Configuration is persisted in service control planes. Runtime services maintain connection/flow mappings and health state; the page does not claim undocumented internal structures or exact propagation times. |
| Union/intersection/override | Multiple healthy targets form the eligible set. Listener conditions constrain a matching ALB rule; health narrows normal eligibility. Explicit fail-open behavior can override normal healthy-only routing when every candidate is unhealthy. |
| Failure behavior | New traffic normally avoids unhealthy targets/endpoints. Existing connections are not retroactively moved in every service. ALB, NLB, GWLB, and standard accelerators have documented all-unhealthy fail-open behavior with service-specific consequences. |
| Wrong mental model | “Choose one of four load balancers by OSI layer.” Global Accelerator is not an ELB type; GWLB steers through appliances rather than serving an application; ALB and NLB may sit behind Global Accelerator, and GWLB may inspect traffic elsewhere in the architecture. |

## Narrative sequence

The production revision requested on 2026-09-10 places the selection guide before the architecture map. The detailed visual-contract numbers below retain the original approval-artifact numbering.

| # | Section | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Choose from the requirement | Do I need ALB, NLB, GWLB, or Global Accelerator? | Four direct use-case cards followed by an exact comparison matrix | Static comparison | HTTP-aware routing means ALB; transport protocols or zonal static IPs mean NLB; routed appliances mean GWLB; stable multi-Region entry means Global Accelerator. |
| 2 | Put each service in the path | Where does the selected service sit, and which services can be combined? | Global-to-regional architecture map with a separate egress-inspection lane | Static overview | ALB and NLB are alternative regional application entrances, Global Accelerator can sit in front, and GWLB belongs on a routed inspection path. |
| 3 | Use ALB for HTTP routing | How does an HTTPS request reach the right application service? | Detailed request lifecycle with ordered rules, target selection, controls, and caveats | Static | ALB evaluates HTTP-aware controls and listener rules, then selects a target from the chosen target group. |
| 4 | Use NLB for transport protocols or zonal static IPs | How does a TCP, UDP, or QUIC flow reach a target? | Detailed transport lifecycle, five-tuple anatomy, TLS modes, controls, and caveats | Static | NLB forwards transport flows and provides zonal static addresses; client-IP and TLS behavior depend on listener, target type, protocol, and attributes. |
| 5 | Use GWLB to insert a firewall fleet | How does routed traffic pass through an appliance and continue? | Detailed routed round-trip with endpoint ownership, flow symmetry, controls, and appliance states | **Hero 1:** previous/next/reset and allow/drop appliance result | Route tables send traffic to a zonal GWLB endpoint; GWLB selects an appliance and returns allowed traffic to the routed path. |
| 6 | Use Global Accelerator for multi-Region entry | How do new connections reach another Region without changing the client entry addresses? | Detailed global edge and two-Region failover lab with configuration cards | **Hero 2:** toggle Mumbai endpoint health and traffic dial; reset | Global Accelerator supplies global anycast addresses and selects regional endpoints; the regional ALB or NLB still selects the application target. |
| 7 | Check what happens when targets become unhealthy | Which component notices a failure, and what moves? | Failure-boundary matrix with existing/new traffic columns | Static expandable details | Health decisions are local to each selection layer, and all-unhealthy states can fail open rather than recover. |
| 8 | Choose a deployment pattern and test failures | Which deployable path meets the requirement? | Three composition strips plus an operational loop | Static | Start with one regional load balancer, then add Global Accelerator or GWLB only for a distinct requirement. |

## Visual 1 — Bird’s-eye architecture

### Purpose

Give the reader a complete placement model before asking them to compare details.

### Learner question

“Where do Global Accelerator, ALB, NLB, and GWLB sit in one AWS architecture?”

### Example state

Clients enter through a standard accelerator with separate listeners. Each listener reaches matching regional endpoint groups in Mumbai and Hyderabad. ALB and NLB appear as parallel regional entry points. A separate Mumbai egress lane shows private workloads routed through a GWLB endpoint and appliance fleet before NAT and internet egress.

### Concepts and actors

Runtime: global ingress connections and inspected outbound flows. Configuration: accelerator listeners, regional endpoint groups, regional load balancers, VPC routes, GWLB endpoint service, target groups, and health checks. Actors: clients, AWS edge, two Regions, ALB, NLB, application targets, GWLB endpoint, GWLB, appliance fleet, NAT gateway, and internet gateway.

### Composition

Use one top-down architecture. `Clients / internet users` enters `AWS Global Accelerator · global · L4`. The accelerator branches into Mumbai and Hyderabad. Within each Region, ALB and NLB occupy parallel columns over their own target sets. In Mumbai, a visually separate warm-colored lane shows `private workload → GWLB endpoint → NAT gateway → internet gateway`; a branch reveals `GWLB endpoint ⇄ PrivateLink ⇄ GWLB ⇄ GENEVE UDP 6081 ⇄ appliance fleet`.

Finish with three concise reading notes: Global Accelerator selects a regional endpoint; the regional ALB or NLB selects its target; routes and GWLB endpoints insert appliances into a separate path.

### Interaction

Static. The visual’s job is spatial orientation, and all branches must remain visible together.

### Data or content states

- Global Accelerator listener `TCP 443` → regional ALB endpoint groups.
- Global Accelerator listener `TCP 8443` → regional NLB endpoint groups.
- Mumbai private workload egress → zonal GWLB endpoint → appliance service → NAT gateway → internet gateway.

### Failure or edge state

Hyderabad egress is deliberately omitted. A note says the lane is representative and that resilient deployments repeat endpoints, NAT gateways, and appliances per Availability Zone. Return traffic must follow the same inspection path when a stateful appliance requires symmetry.

### Required copy

- Heading: “See the whole traffic map first.”
- Takeaway: “Global Accelerator chooses a regional entrance. ALB and NLB are parallel regional entry points. GWLB inserts an appliance fleet into a routed path.”
- Misconception: “GWLB is not a Global Accelerator endpoint and it is not the firewall. Its registered targets are the appliances.”

### Accuracy caveats

The architecture shows one possible composition, not a required chain. ALB and NLB are alternatives or parallel listener destinations in this example. Standard accelerators also support EC2 instances and Elastic IP addresses. The inspection lane is logical and suppresses subnet, route-table, and Availability Zone detail that appears later.

### Mobile behavior

Stack Global Accelerator, Mumbai, and Hyderabad. Within each Region, ALB and NLB stack vertically with explicit target labels. Keep the inspection lane as a readable ordered path with wrapping nodes and no horizontal page scroll.

### Accessibility

Give the architecture a concise `role="img"` label and repeat the three-part reading order as visible prose. Connector colors are reinforced by labels and arrow direction.

### Source anchors

- [Elastic Load Balancing product types](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
- [AWS Global Accelerator components](https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-components.html)

### Acceptance checks

- All four services are visible before the comparison matrix.
- ALB and NLB appear as parallel regional entry points rather than a serial chain.
- Global Accelerator appears before a regional endpoint, never as a target-group replacement.
- GWLB, the GWLB endpoint, and the appliance fleet are visibly distinct.

## Visual 2 — Decision matrix

### Purpose

Make the service-selection envelope reviewable in one scan, using services as columns and decision dimensions as rows.

### Learner question

“Which service makes the decision I need, and what constraints come with it?”

### Example state

The matrix compares scope and role, accepted traffic, decision inputs, selection chain, destination types, TLS handling, address model, WAF/security, and the strongest use case.

### Concepts and actors

Columns: ALB, NLB, GWLB, Global Accelerator. Rows are the nine decision dimensions. Cells distinguish runtime inputs from configured selection objects.

### Composition

Use a responsive matrix on desktop with the services as columns and these dimensions as rows:

| Decision dimension | ALB | NLB | GWLB | Global Accelerator |
| --- | --- | --- | --- | --- |
| Scope and role | Regional application proxy, Layer 7 | Regional transport load balancer, Layer 4 | Regional routed inspection path, Layer 3 | Global standard accelerator for TCP/UDP delivery |
| Accepted traffic | HTTP, HTTPS, WebSockets, HTTP/2, gRPC | TCP, TLS, UDP, TCP_UDP, QUIC, TCP_QUIC | IP packets; GENEVE to appliances on UDP 6081 | TCP and UDP listeners |
| Decision inputs | Host, path, headers, method, query, source-IP CIDR | Listener, source-address-type rule where configured, and transport flow | VPC route to GWLBE; flow stickiness selects appliance | Client location, endpoint health, dials, and weights |
| Selection chain | Listener rule → action → target group → target | Listener action/rule → target group → flow target | GWLBE → GWLB → appliance → GWLB → GWLBE | Listener → regional endpoint group → endpoint |
| Destination types | Instance, IP, Lambda | Instance, IP, ALB | GENEVE-capable appliance instance/IP targets | ALB, NLB, EC2, Elastic IP |
| TLS handling | HTTPS listener terminates TLS; backend may use HTTP or HTTPS | TLS listener terminates; TCP can pass TLS through | Transparent insertion; inspection/decryption belongs to the appliance | Regional endpoint handles TLS; accelerator does not terminate application TLS |
| Address model | DNS name with changing IPs; internet-facing or internal | Static address per enabled AZ; optional EIPs for internet-facing IPv4 | Private GWLB endpoint used as a route target | Static anycast entry addresses; regional endpoints may change behind them |
| WAF and security | AWS WAF association; load balancer and target security groups | No AWS WAF association; NLB security groups where attached | Appliances perform firewall, IDS, or IPS functions | No WAF association at GA; associate WAF with an ALB endpoint |
| Choose when | HTTP services need content routing, authentication, or WAF | Transport workloads need flow balancing, zonal static addresses, or TLS pass-through | Traffic must traverse a scalable appliance fleet | Multi-Region applications need stable global entry and regional traffic steering |

Finish with a `Common compositions` row: `Global Accelerator → ALB/NLB`, `NLB → ALB`, and `routed workload egress → GWLBE ⇄ GWLB ⇄ appliances`.

### Interaction

Static because exact simultaneous comparison is more useful than hiding rows behind a selector. Column headers remain visible; no hover-only explanation.

### Data or content states

Mark NLB’s 2026 protocol set and limited source-IP-type rule as “verified 2026-09-10.” Mark Global Accelerator’s endpoint list as standard-accelerator scope.

### Failure or edge state

An `All candidates unhealthy` footer points ahead to Visual 7; it does not flatten the four distinct fail-open behaviors into one cell.

### Required copy

- Caption: “A deeper parser can route on richer content. A broader network scope solves a different problem.”
- Misconception: “Layer numbers alone do not choose the product. Scope, target type, address requirements, inspection, and failure behavior also matter.”

### Accuracy caveats

The table names the main decision input, not every implemented algorithm or option. AWS does not document Global Accelerator’s internal optimal-path algorithm in enough detail to reproduce it; describe only documented inputs and outcomes.

### Mobile behavior

Convert rows into cards with repeated field labels. Do not use a wide horizontally scrolling matrix.

### Accessibility

Use a real table with caption and headers on desktop markup; CSS may visually reflow it on mobile while preserving cells and header associations. Text labels accompany all colored chips.

### Source anchors

- [ALB rule condition types](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/rule-condition-types.html)
- [NLB listeners](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-listeners.html)
- [GWLB behavior](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/gateway-load-balancers.html)
- [Global Accelerator components](https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-components.html)

### Acceptance checks

- Rows distinguish global from regional scope.
- ALB alone exposes HTTP content-routing fields.
- GWLB’s destination is an appliance, not the application target.
- The table remains readable at 320 px and at 200% zoom.

## Visual 3 — ALB reads the HTTP request

### Purpose

Connect ALB listener rules to a concrete request without implying that DNS or a target group parses the URL.

### Learner question

“What happens after the HTTPS request reaches the ALB?”

### Example state

An ALB-specific example sends `POST /checkout` with host `shop.example.com` to an HTTPS listener. This request is not reused by the other service sections.

### Concepts and actors

HTTPS listener `:443`; certificate/TLS boundary; prioritized rules; actions; `checkout-tg` and `storefront-tg`; healthy targets `10.0.21.18:8443` and `10.0.22.41:8443`; default rule. Rules are configuration. The received request, match result, selected target, and backend connection are runtime.

### Composition

Begin with three connected stages: client and network access; HTTPS listener `:443` with ACM/TLS policy and optional mTLS; AWS WAF evaluation associated with this ALB. Make clear that WAF participates in request processing rather than acting as a separate network hop. Below them, show the ordered listener-rule board and target-group selection:

1. Priority 10: `Host = shop.example.com` AND `Path = /checkout*` → forward `checkout-tg`.
2. Priority 20: `Path = /static/*` → forward `assets-tg`.
3. Default: forward `storefront-tg`.

Highlight rule 10 using a check icon and `MATCH`; dim later rules with “not evaluated after terminal forward.” On the right, show target-group settings, one selected healthy target, one excluded unhealthy target, the health-check expectation, and the separate backend TLS connection. Finish with three detail cards for listener/rule options, target-group controls, and network/operations signals.

### Interaction

Static. The lifecycle, ordered rules, alternate routes, target health, and operational controls need to remain visible together.

### Data or content states

Show separate client→ALB and ALB→target connections. Label TLS termination at the HTTPS listener for this example and `HTTPS :8443` on the backend connection so the visual does not imply that termination requires plaintext to targets.

### Failure or edge state

Show one unhealthy checkout target excluded from ordinary selection. Include a small pointer: “If every target is unhealthy, see Health is layered.”

### Required copy

- Heading: “ALB can route because it reads the request.”
- Takeaway: “The listener selects the first matching rule; the rule selects a target group; load balancing then selects a healthy target.”
- Misconception: “A target group does not inspect the URL. The listener rule selects the target group.”

### Accuracy caveats

This is an illustrative forward action. ALB rules also support redirects, fixed responses, authentication actions, URL/host rewrites, JWT validation, and weighted forwarding, subject to documented constraints. AWS WAF can allow, block, count, or challenge requests according to the web ACL. The diagram does not claim a particular internal node or target-selection implementation.

### Mobile behavior

Render request, listener, rule rows, group, and target vertically. Preserve rule priority. Backend targets become a two-card grid, then one column below 420 px.

### Accessibility

Use an ordered list for rules and explicit `MATCH`, `SKIPPED`, `HEALTHY`, and `UNHEALTHY` text. The figure caption contains the full selection sequence.

### Source anchors

- [What is an Application Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [ALB listeners and default action](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html)
- [ALB listener rule actions](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/rule-action-types.html)
- [JWT validation on ALB listeners](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-verify-jwt.html)
- [ALB target groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html)

### Acceptance checks

- Rules visibly evaluate in priority order and include the default.
- Rule selection and target selection are separate steps.
- TLS termination does not imply an unencrypted backend.

## Visual 4 — Deploy a TCP service behind NLB

### Purpose

Show the deployable NLB path first—client, zonal address and listener, target group, healthy target—then explain the connection-level behavior and conditional details.

### Learner question

“When should I use NLB, what do I configure, and what happens to a connection?”

### Example state

An internet-facing TCP service uses zonal NLB address `198.51.100.10`, listener `TCP :443`, target group `tcp-service-tg` on `TCP :8443`, and healthy target `10.0.21.18:8443`. A second connection changes the source port from `51514` to `51515`.

### Concepts and actors

Client connection; zonal NLB address; official NLB, ALB, and VPC endpoint icons; listener; target group; healthy and unhealthy targets; connection mapping; client-IP preservation attribute; TCP pass-through and TLS-listener modes; ALB target type; interface VPC endpoint; PrivateLink endpoint service; endpoint ENI IPs. Configuration and runtime states are labelled separately.

### Composition

Begin with one left-to-right deployable path: a client opens `TCP 203.0.113.24:51514 → 198.51.100.10:443`; the NLB card exposes the zonal address, `TCP :443` listener, and forward action; the target-group card exposes backend protocol and port, the selected healthy target, and an unhealthy target excluded from ordinary new-flow selection. A short “Why NLB fits” callout states that this service needs TCP forwarding and a stable zonal address, with no HTTP routing decision.

Below the path, compare an existing connection with a new connection. Packets on source port `51514` remain mapped to `10.0.21.18:8443`; a connection using source port `51515` triggers selection again and may use another healthy target. Do not imply that AWS publishes its internal target-selection formula.

Below it, compare two modes. `TCP :443` keeps the encrypted TLS exchange end to end to the target. `TLS :443` terminates client TLS at NLB and establishes the configured backend connection. Place a qualified client-IP card beside them: instance targets and several protocol combinations preserve it by default; TCP/TLS IP targets default differently and use a target-group attribute. Finish with detail cards for current protocols/rules, target-group controls and identity, and network/operational behavior.

Add a three-card composition guide whose arrows are part of the lesson. First, show the native `NLB → target group type alb → ALB` pattern for combining static zonal addresses or PrivateLink with ALB HTTP routing; call out the TCP, matching-port, same-VPC, same-account, single-ALB, and IPv4 constraints. Second, show the normal PrivateLink provider pattern as `consumer interface VPCE → endpoint service → NLB → service`, explaining that consumer traffic does not run from NLB to VPCE. Third, cover a literal `NLB → target group type ip → interface endpoint ENI private IPs` bridge as a specialized IP-target design, not a native `vpce` target type; make ownership of registration lifecycle, reachability, health checks, security groups, ports, TLS hostname/SNI, and zonal coverage explicit.

### Interaction

Static because the configuration path and side-by-side connection cases answer the operational question without a decorative packet generator.

### Data or content states

Use documentation-reserved addresses. Show `Zonal static address` rather than “one global static IP.” Label optional EIP as internet-facing IPv4 context.

### Failure or edge state

An unhealthy target is absent from new ordinary selections. Existing established connections are not illustrated as migrating; a note points to service-specific reset/draining behavior and Visual 7.

### Required copy

- Heading: “Use NLB for a TCP service with a stable zonal address.”
- Takeaway: “Create the client-facing listener, forward it to a compatible target group, register healthy targets in every enabled zone, and plan for one NLB address per zone.”
- Misconception: “NLB does not always preserve the original client address. The outcome depends on target type, protocol, and `preserve_client_ip.enabled`.”

### Accuracy caveats

The connection mapping is conceptual, not a disclosed selection formula. QUIC/TCP_QUIC and source-address-type listener rules are current features verified 2026-09-10; they are named in Visual 2 but not expanded here. Source-IP preservation has additional topology constraints. NLB fail-open behavior is stated separately so the ordinary unhealthy-target state is not presented as absolute. NLB target types are `instance`, `ip`, and `alb`; a VPC endpoint ID is never shown as directly registrable. The literal NLB-to-VPCE composition depends on registering reachable endpoint ENI IPs and must not be confused with the managed PrivateLink provider direction.

### Mobile behavior

Stack client, NLB, and target-group cards with downward arrows. Connection, TLS, and integration comparisons become one column. Addresses and ports wrap without truncation.

### Accessibility

The deployable path has numbered text steps and an explicit selected target. The path has a complete text alternative. TLS states say `terminates here` or `stays encrypted to target`.

### Source anchors

- [What is a Network Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html)
- [NLB target groups and protocols](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html)
- [NLB client IP preservation](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/edit-target-group-attributes.html#client-ip-preservation)
- [Use an ALB as an NLB target](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/application-load-balancer-target.html)
- [Share services through AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html)

### Acceptance checks

- Client, listener, target group, and selected target are visible in one path.
- A changed source port creates a visibly separate connection case.
- NLB-to-ALB uses the native `alb` target type and shows its material constraints.
- PrivateLink consumer flow points from interface endpoint through the endpoint service to NLB.
- A literal NLB-to-interface-endpoint design is labelled as IP targets with lifecycle duties, never as a `vpce` target type.
- Static addresses are described per enabled Availability Zone, not globally.
- Client-IP and TLS copy remain conditional.

## Visual 5 — GWLB creates an inspection loop

### Purpose

Show that GWLB is part of a route-controlled service insertion pattern, not a public application listener.

### Learner question

“How does the original packet visit a firewall fleet and return to the application path?”

### Example state

A GWLB-specific packet enters a consumer VPC, where a route sends it toward the application subnet through a zonal GWLB endpoint.

### Concepts and actors

Consumer VPC, ingress route table, zonal GWLB endpoint, PrivateLink endpoint service relationship, service VPC, GWLB, appliance target group, `firewall-a`, GENEVE UDP 6081 outer packet, unchanged inner packet, application subnet, return route. Route tables and groups are configuration; packets, encapsulation, appliance verdict, and sticky flow mapping are runtime.

### Composition

Desktop has two framed VPC columns. The consumer VPC holds internet gateway, endpoint, and application subnet. The service VPC holds GWLB and two firewall appliances. A seven-step rail runs under the topology:

1. Route matches application-subnet destination.
2. Packet enters the zonal GWLB endpoint.
3. Endpoint service carries it to GWLB.
4. GWLB selects a healthy appliance for the flow.
5. GWLB sends a GENEVE-encapsulated packet on UDP 6081.
6. Appliance returns `ALLOW` or withholds/drops the packet.
7. Allowed traffic returns through the endpoint and route toward the application.

At steps 5–6, an anatomy inset shows `outer IPv4 + UDP 6081 + GENEVE metadata | original IP packet`.

### Interaction

Previous, Next, and Reset buttons step through the sequence. A native radio group selects `Appliance allows` or `Appliance drops`. Changing verdict resets to step 1. The active step updates the topology, anatomy inset, short explanation, and live result. In drop mode, step 6 ends with “Firewall-a drops the packet; no inspected packet returns to the endpoint.” Next is disabled. Reset restores allow mode and step 1. Keyboard order is verdict, Previous, Next, Reset.

### Data or content states

Endpoint `vpce-0abc123example`; target `firewall-a / 10.2.11.20`; inner packet `203.0.113.24 → 10.0.21.18`; GENEVE outer destination `10.2.11.20:6081`. IDs are clearly fictional.

### Failure or edge state

Drop verdict is the primary failure. Also show a caution: a missing return route or asymmetric path can bypass inspection or break a stateful appliance. If all GWLB appliance targets are unhealthy, GWLB still picks a target and traffic is dropped until it becomes healthy; full behavior appears in Visual 7.

### Required copy

- Heading: “The route creates the detour; GWLB scales the appliance hop.”
- Takeaway: “The endpoint and route tables steer the packet. GWLB keeps the flow on an appliance and uses GENEVE to preserve the original packet for inspection.”
- Misconception: “GWLB does not replace an ALB or NLB listener. Its targets are appliances, and the allowed packet continues toward the application afterward.”

### Accuracy caveats

The two-VPC centralized model is representative, not mandatory. Endpoint and route placement varies across ingress, egress, east-west, Transit Gateway, and cross-account designs. The illustration shows the documented GENEVE relationship without inventing appliance internals. Default flow stickiness and target-failover behavior have configurable alternatives and constraints.

### Mobile behavior

VPC frames stack, followed by the step rail as full-width numbered cards. At every step, `from → to` text repeats the connector meaning. Keep the anatomy inset within the viewport with wrapping fields.

### Accessibility

Use native radio and button controls, disabled state on unavailable actions, a polite live region, and a complete ordered-list fallback visible when JavaScript is absent. `ALLOW`/`DROP`, line style, and icon shape reinforce color. Reduced motion removes bead transitions.

### Source anchors

- [What is a Gateway Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/introduction.html)
- [GWLB behavior and GENEVE](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/gateway-load-balancers.html)
- [GWLB inspection routing tutorial](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/getting-started.html)

### Acceptance checks

- The endpoint, GWLB, and appliance are three distinct objects.
- Both outbound-to-appliance and return-from-appliance movements are visible.
- Drop mode stops before the application and announces the detecting component.
- The core seven steps remain readable without JavaScript.

## Visual 6 — Global Accelerator chooses a regional entrance

### Purpose

Separate global endpoint selection from regional load balancing and demonstrate how a health change affects new connections.

### Learner question

“When `ap-south-1` is unhealthy, what does the same static entry address do?”

### Example state

Internet clients connect to a standard accelerator’s anycast addresses. The normal example path reaches a Mumbai regional ALB; an Ireland ALB is the alternate endpoint.

### Concepts and actors

Client; two anycast IPv4 addresses; AWS edge; TCP listener `:443`; `ap-south-1` and `eu-west-1` endpoint groups; traffic dial; endpoint health; regional ALBs; new versus existing connections; regional ALB target health. Accelerator configuration and health state are separate from runtime connections.

### Composition

Left: internet clients and two stable address chips. Center: AWS edge and branching AWS-network paths. Right: two Region frames, each containing endpoint group → ALB. Above each Region: health and traffic-dial badges. Below: “Global decision” and “Regional decision” strips. The former selects endpoint group/endpoint; the latter handles request routing.

### Interaction

A checkbox labelled `Make Mumbai endpoint unhealthy` changes the health signal, breaks the Mumbai path, and shows new connections using the healthy Ireland endpoint. A range input labelled `Mumbai traffic dial` has marked values 0, 50, 100 and updates an explanatory sentence; it does not animate percentages as deterministic per-request promises. Reset restores Mumbai healthy and the dial to 100. When Mumbai is unhealthy, the traffic-dial control remains visible but the feedback says health excludes it from normal selection. A fixed note explains that configuration changes do not migrate established connections.

### Data or content states

Use documentation ranges for displayed addresses: `192.0.2.10` and `192.0.2.20`, explicitly labelled illustrative. Regions: Mumbai `ap-south-1`; Ireland `eu-west-1`. Endpoint type: internet-facing ALB for both.

### Failure or edge state

The main failure is an unhealthy Mumbai endpoint. An expandable “When nothing is healthy” note states the documented standard-accelerator fail-open behavior: after it cannot find a healthy positive-weight endpoint through the documented failover search, it can route to a random endpoint in the closest endpoint group. Do not show a green success state in that condition.

### Required copy

- Heading: “The address stays; the regional entrance can change.”
- Takeaway: “Global Accelerator selects a healthy regional endpoint for new connections. The chosen ALB still evaluates `/checkout` and selects the application target.”
- Misconception: “A traffic dial is not a percentage of all listener traffic, and changing it does not terminate existing connections.”

### Accuracy caveats

The path is a conceptual depiction of documented edge entry and AWS-network routing, not a physical PoP map or latency guarantee. Standard accelerators also support NLB, EC2, and Elastic IP endpoints. Endpoint health for ALB/NLB comes from Elastic Load Balancing health behavior rather than the custom health settings used for EC2/Elastic IP endpoints. The two default IPv4 addresses are current behavior verified 2026-09-10; dual-stack supplies additional addresses.

### Mobile behavior

Stack client, edge, Mumbai, and Ireland. Keep controls above the diagram. Broken and active paths become left-bordered vertical lanes with text labels.

### Accessibility

Use a labelled checkbox, range input with visible numeric output, and native buttons. Announce new-connection selection and health changes. Existing/new connection distinction is written out. Reduced motion swaps paths immediately.

### Source anchors

- [How Global Accelerator works](https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-how-it-works.html)
- [Global Accelerator components](https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-components.html)
- [Standard accelerator endpoints](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoints.html)
- [Traffic dials](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoint-groups-traffic-dial.html)
- [Unhealthy endpoint failover](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoints-endpoint-weights.unhealthy-endpoints.html)

### Acceptance checks

- Both anycast addresses remain unchanged across the simulated health event.
- The next connection changes Region; the existing connection is not shown teleporting.
- The ALB and its target-selection role remain visible inside each Region.
- Dial copy says its percentage applies only to traffic already directed to that endpoint group.

## Visual 7 — Health is layered

### Purpose

Show the detector, unit removed from normal selection, treatment of existing traffic, and all-unhealthy outcome for each layer.

### Learner question

“A health check failed. Which path changes, and does traffic stop?”

### Comparison state

Each row compares the same categories—health boundary, new traffic, existing traffic, and all candidates unhealthy—without inventing a shared end-to-end path.

### Concepts and actors

Service health probes/signals, target or endpoint state, new selection, existing flow, fail open, observable reason/status. Rows: ALB target group, NLB target group/zonal health, GWLB appliance target, Global Accelerator standard endpoint.

### Composition

Use four stacked rows with the same columns:

| Layer | First useful health boundary | New traffic after one failure | Existing traffic | If every candidate is unhealthy |
| --- | --- | --- | --- | --- |
| ALB | Target in target group | Select another healthy target | Request/connection behavior depends on protocol and draining context | Routes to all targets in the target group: fail open |
| NLB | Target and zonal target-group threshold | Avoid target; DNS/routing failover can alter zonal paths | Do not promise migration; resets/draining depend on protocol and attributes | Can route to unhealthy registered targets: fail open |
| GWLB | Appliance target | New flow selects a healthy appliance | Default keeps existing flow on its appliance even after unhealthy; configurable failover exists | Picks an unhealthy target; traffic is dropped until it recovers |
| Global Accelerator | Standard endpoint/endpoint group | New connection selects another healthy positive-weight endpoint | Dial changes affect new connections; do not depict migration | Documented search can end by routing to a random endpoint in the closest group: fail open |

Each row ends with a small `Observe` chip: target-health reason codes/CloudWatch; zonal health and target metrics; appliance target health and packet loss; endpoint health and regional application signals.

### Interaction

Static expandable `<details>` for nuance. Simultaneous rows are necessary because the teaching goal is to compare boundaries, not play four failure games.

### Data or content states

Use `Target.Timeout`, `unhealthy`, `no_rebalance`, and `endpoint unhealthy` as representative status labels. Do not invent exact detection duration.

### Failure or edge state

The last column is the failure state. It must use red broken-path styling and the literal words `FAIL OPEN`; for GWLB also display `traffic may still drop` so fail open is not mistaken for successful bypass.

### Required copy

- Heading: “Unhealthy narrows the normal choice. All unhealthy can reopen it.”
- Takeaway: “A health signal changes one selector’s eligible set. It does not prove the entire request path is healthy.”
- Misconception: “Fail open does not mean healthy or available. It means the service stops excluding every failed candidate.”

### Accuracy caveats

Behavior depends on listener protocols, deregistration delay, cross-zone settings, thresholds, failover attributes, and the failure’s location. Keep exact timers out of the overview. ALB’s all-unhealthy statement is scoped to the affected target group; NLB and Global Accelerator have additional zonal/group logic.

### Mobile behavior

Each table row becomes a card whose four outcomes follow detector → new → existing → all unhealthy. Details expand in place.

### Accessibility

Use table headers or card labels, literal status text, and `<details>/<summary>`. No auto-opening content. Failure is communicated by words and broken borders as well as red.

### Source anchors

- [ALB target health and fail open](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)
- [NLB target group health](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html#target-group-health)
- [GWLB target failure scenarios](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/health-checks.html)
- [Global Accelerator health checks](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoint-groups-health-check-options.html)

### Acceptance checks

- Each row names the detector and the selection unit it affects.
- Existing and new traffic are distinct.
- Fail open is never styled or worded as a successful recovery.

## Visual 8 — Compose the roles, then operate the path

### Purpose

Turn the mental model into three legitimate architectures and a repeatable operating loop.

### Learner question

“What should I build and verify once I know the roles?”

### Example state

Three independent production patterns show which service owns each decision. They are alternatives and compositions, not three variants of one tracked request.

### Concepts and actors

Three compositions:

1. `Client → ALB → HTTP services` for regional HTTP routing.
2. `Client → Global Accelerator → ALB in Region A/B → HTTP services` for stable global entry plus regional content routing.
3. `Client → routed GWLB inspection → NLB or ALB → application targets` for inline appliance inspection plus the application entrance.

Operational loop: define decision and protocols; map zones/routes/trust; configure representative health; observe; inject failure; refine capacity/cost and remove redundant hops.

### Composition

Place three horizontal strips with numbered decision badges. Each strip contains a `Choose this when` sentence and a `Verify` sentence. Below them, render a linear six-step operating loop. A final amber architecture note spans the width: “Global Accelerator client-IP preservation can bypass GWLB endpoints, AWS Network Firewall, and NACL evaluation for that traffic. Validate the exact ingress path before claiming inline inspection.” Mark this feature claim verified 2026-09-10.

### Interaction

Static. This is a synthesis and checklist; controls would turn review work into ceremony.

### Data or content states

Checklist evidence includes ALB/NLB/GWLB target health, Global Accelerator endpoint health, access/flow logs where supported and enabled, CloudWatch metrics, route tables, security groups, and a synthetic request from outside the VPC.

### Failure or edge state

For each composition, name the most revealing drill: all targets fail ALB health checks; one NLB zone loses eligible capacity; appliance becomes unhealthy while an existing flow is active; primary Global Accelerator endpoint becomes unhealthy. Require evidence of both new and existing traffic behavior.

### Required copy

- Heading: “Compose roles; test the seams.”
- Takeaway: “Every extra selector adds a health boundary. Diagram and monitor the whole request path, not just the final target group.”
- Production loop labels: `Define → Route → Health → Observe → Break → Refine`.

### Accuracy caveats

The inspection composition is intentionally topology-neutral. Whether traffic can traverse GWLB depends on exact route, endpoint, AZ, Transit Gateway, and client-IP-preservation choices. Cost is driven by service hours/capacity or data processing and, for Global Accelerator, current pricing dimensions; consult current pricing rather than embedding rates.

### Mobile behavior

Composition strips become numbered vertical paths. The loop becomes a six-row checklist. The caveat remains ordinary flowing text.

### Accessibility

Use ordered lists, explicit decision-owner labels, and descriptive link text. The loop has a linear reading order that matches the visual cycle.

### Source anchors

- [ALB as a Global Accelerator endpoint](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoints.html)
- [ALB as an NLB target](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/application-load-balancer-target.html)
- [Global Accelerator client-IP preservation restrictions](https://docs.aws.amazon.com/global-accelerator/latest/dg/preserve-client-ip-address.how-to-enable-preservation.html)
- [GWLB deployment guidance](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/getting-started.html)

### Acceptance checks

- Each composition assigns one clear decision to every service.
- The page never implies that GWLB is itself a Global Accelerator endpoint.
- The client-IP/inspection caveat is prominent and dated.
- The operating loop contains a real failure drill and observable evidence.

## Page elements

- Compact sticky chapter navigation linking `#choose`, `#envelope`, `#alb`, `#nlb`, `#gwlb`, `#global-accelerator`, `#health`, `#operate`, and `#sources`.
- Legend near the first diagram defining solid/dashed/double/broken connectors and semantic state colors with text labels.
- “Verified 2026-09-10” markers beside NLB’s current listener protocols/rules and Global Accelerator client-IP restrictions.
- Sources section with primary AWS links grouped by service.

## Responsive and accessibility requirements

- Work from 320 px through large desktop with no page-level horizontal scroll.
- The bird’s-eye architecture appears immediately after the compact title and promise.
- Main text is at least 16 px; diagram labels at least 14 px except 12–13 px metadata.
- At 200% zoom, controls and labels reflow without overlap; diagrams become vertical rather than shrinking to illegibility.
- All controls are native HTML elements with visible focus, 44 px touch targets, programmatic labels, and deterministic reset states.
- Dynamic summaries use polite live regions. Focus never moves automatically on selection.
- Core diagrams, sequence lists, failure behavior, and takeaways remain in the HTML when JavaScript is unavailable.
- Motion is limited to active flow transitions. Under `prefers-reduced-motion: reduce`, transitions and animated beads stop while selected steps remain visually explicit.
- Use heading order `h1 → h2 → h3`; every major visual is a `<figure>` or labelled `<section>` with a visible caption/summary.

## Prototype implementation contract

- One self-contained file with inline CSS and minimal vanilla JavaScript; no external fonts, styles, scripts, images, or build step.
- Reuse the repository’s visual tokens and general 1180 px shell, dark technical surfaces, 16 px radii, mono metadata, and 900/650 px responsive logic.
- Drive Visuals 5 and 6 from small immutable data objects. Keep section-local render functions and unique IDs.
- Enhancement adds an `.is-enhanced` class. Static default content must already express the core model before scripts run.
- Prototype every major visual with representative content, not placeholder cards.
- Production integration must split compositions into reusable Astro components and shared CSS tokens; the prototype stylesheet must not be copied wholesale.

## Integration guidance

- Canonical slug: `/aws-load-balancers`.
- Canonical content: `src/content/topics/aws-load-balancers.mdx`, with metadata `collection: aws`, `format: Deep Dive`, and `difficulty: intermediate`.
- Reusable visual components are colocated under `src/components/elb/`; their shared production styles live in `src/components/elb/elb-shared.css`.
- The page reuses `TopicHeader`, `SectionNav`, `SourcesList`, `RelatedVisuals`, global tokens, and topic typography.
- Preserve the section IDs listed above. The approval files stay under `guide/topics/` and are not added to content collections, Pagefind, legacy sync, or public routes.
- **Integration status:** Integrated on 2026-09-10 in the canonical MDX topic and `/aws-load-balancers` Astro route. The prototype remains an approval artifact, not a second published implementation.
- **Post-integration revision:** On 2026-09-10, the canonical page was reordered and rewritten around direct selection rules and deployable examples. The prototype preserves the earlier approval snapshot; the MDX topic is the maintained reader-facing source.

## Deep-dive page handoffs

1. **ALB rule actions, authentication, and transforms.** These would interrupt the request-routing explanation with detailed action ordering and security behavior. Link from Visual 3. Suggested example: one HTTP request passing authentication, URL rewrite, and weighted forwarding.
2. **NLB source identity, security groups, and PrivateLink.** Target type, protocol, topology, Proxy Protocol, and client-IP preservation deserve a precise matrix. Link from Visual 4. Suggested example: one TCP connection observed at an IP target.
3. **Centralized inspection with GWLB and Transit Gateway.** Symmetry, AZ affinity, appliance mode, cross-account endpoints, and route domains need a full topology. Link from Visual 5. Suggested example: one bidirectional five-tuple crossing a spoke and inspection VPC.
4. **Global Accelerator failover and traffic engineering.** Endpoint weights, traffic dials, client affinity, port overrides, health inheritance, and fail-open search require more controlled scenarios. Link from Visual 6. Suggested example: sequential connections from two client locations during a regional impairment.

Do not link these as published related pages until their targets exist.

## Page-level acceptance criteria

- [ ] The first visual places all four services in one legible architecture and keeps ingress load balancing separate from routed egress inspection.
- [ ] All eight visuals reinforce the four-role decision framework without requiring an artificial shared request path.
- [ ] ALB, NLB, GWLB, and Global Accelerator are not presented as interchangeable members of one layer chart.
- [ ] Configuration objects and runtime traffic/state are labelled distinctly.
- [ ] The two hero interactions work with mouse, touch, and keyboard and have deterministic resets.
- [ ] A dropped inspection packet and an unhealthy regional endpoint are fully represented failure states.
- [ ] New versus existing traffic is explicit wherever health or configuration changes.
- [ ] All-unhealthy fail-open behavior is accurate, scoped, and never presented as success.
- [ ] Current NLB features and Global Accelerator client-IP caveats are dated 2026-09-10.
- [ ] No important state depends on color, hover, timing, or JavaScript.
- [ ] The prototype has unique IDs, valid internal anchors, parsing JavaScript, reduced-motion rules, and no page-level overflow at 320 px.
- [ ] All source links are primary AWS documentation URLs and pass repository link validation where applicable.

## Source index

### Elastic Load Balancing and ALB

1. [What is Elastic Load Balancing?](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
2. [What is an Application Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
3. [ALB listeners](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html)
4. [ALB rule condition types](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/rule-condition-types.html)
5. [ALB target groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html)
6. [ALB target health](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)
7. [ALB listener rule actions](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/rule-action-types.html)
8. [ALB JWT validation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-verify-jwt.html)

### NLB

9. [What is a Network Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html)
10. [NLB listeners](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-listeners.html)
11. [NLB target groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html)
12. [NLB target-group attributes and client IP](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/edit-target-group-attributes.html)
13. [Use an ALB as an NLB target](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/application-load-balancer-target.html)
14. [Share services through AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html)

### GWLB

15. [What is a Gateway Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/introduction.html)
16. [Gateway Load Balancer behavior](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/gateway-load-balancers.html)
17. [Getting started with Gateway Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/getting-started.html)
18. [GWLB target health](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/health-checks.html)
19. [GWLB target-group attributes](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/edit-target-group-attributes.html)

### AWS Global Accelerator

20. [How AWS Global Accelerator works](https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-how-it-works.html)
21. [Global Accelerator components](https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-components.html)
22. [Standard accelerator endpoints](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoints.html)
23. [Endpoint groups](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoint-groups.html)
24. [Traffic dials](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoint-groups-traffic-dial.html)
25. [Health-check guidance](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoint-groups-health-check-options.html)
26. [Unhealthy endpoint failover](https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoints-endpoint-weights.unhealthy-endpoints.html)
27. [Client-IP preservation](https://docs.aws.amazon.com/global-accelerator/latest/dg/preserve-client-ip-address.html)
28. [Client-IP preservation restrictions](https://docs.aws.amazon.com/global-accelerator/latest/dg/preserve-client-ip-address.how-to-enable-preservation.html)
