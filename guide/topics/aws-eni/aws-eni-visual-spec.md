# Infra Illustrated — AWS Elastic Network Interface (ENI) visual specification

Status: approval draft 1  
Version: 1.0  
Verified: 2026-09-10  
Topic: AWS Elastic Network Interfaces as the connective tissue of VPC networking  
Target audience: cloud engineers, DevOps engineers, SREs, platform engineers, and solutions architects who know VPC basics but want a reusable mental model that connects EC2, containers, Kubernetes, Lambda, databases, load balancers, NAT, PrivateLink, security, scaling, and troubleshooting.

## 1. Page promise

By the end of this page, a reader should be able to answer these questions whenever an AWS workload has a networking problem:

1. Where does this workload obtain its VPC network presence?
2. Which subnet and Availability Zone constrain that network presence?
3. Which IP addresses, prefixes, security groups, NACLs, and routes matter?
4. Is the interface customer-managed, service-managed, requester-managed, task/Pod-managed, or abstracted behind a service such as Lambda Hyperplane?
5. Which ENI/IP capacity limits can stop scaling before CPU or memory are exhausted?
6. Which interface should a packet leave, which should receive it, and what checkpoints can block it?

The page must teach one continuous mental model:

> An ENI is one of the places where abstract VPC networking becomes concrete: a subnet-scoped interface with addresses, security associations, attachment/ownership state, and observable traffic. AWS services use that primitive in different ways, so the interface is common while ownership and behavior vary.

## 2. Persistent scenario

The teaching persona is:

`eni-0abc123` — nickname: **ENI-123**

ENI-123 is a **persistent character, not one literal AWS object moving between services**. It represents “the interface role” as the page changes scenarios. Every section must state the current ownership mode and resource type.

A secondary persistent packet is:

`flow-42: 10.20.1.17:43122 → 10.20.3.25:5432/TCP`

Use `flow-42` in the security, routing, failure, and troubleshooting sections. The page header includes a compact ribbon:

`ENI-123 | owner: customer/service | subnet: app-a | IP: 10.20.1.17 | SG: sg-app | flow-42: idle/allowed/blocked`

As the scenario morphs, the ribbon updates. On mobile it collapses to two rows.

## 3. Scope and non-goals

### In scope

- ENI scope and anatomy.
- One-subnet rule and Availability Zone implications.
- Primary and secondary ENIs on EC2.
- Multi-homing, including same-account multi-VPC secondary ENIs where applicable.
- IP addressing and Elastic IP relationships.
- Security groups and subnet NACL relationships.
- Route-table relationship and source/destination check for appliances.
- Customer-managed vs requester-managed/service-managed interfaces.
- ECS `awsvpc`, Fargate, and ECS ENI trunking.
- EKS VPC CNI secondary-IP mode, prefix delegation, and Security Groups for Pods.
- Lambda Hyperplane ENIs and the “not one ENI per invocation” misconception.
- RDS as a requester-managed ENI example.
- ALB and NLB subnet/network-interface behavior.
- NAT Gateway ENI behavior and no-SG exception.
- Interface VPC endpoints / PrivateLink.
- ENI/IP capacity and subnet exhaustion.
- VPC Flow Logs and ENI-centric troubleshooting.
- ENI vs ENA vs EFA distinction.

### Non-goals / deep dives

The overview links out rather than exhaustively teaching:

- Linux policy routing and asymmetric-routing remediation.
- EKS VPC CNI internals and every environment variable.
- IPv6 migration strategy.
- Gateway Load Balancer internals and appliance chains.
- Hyperplane internals beyond documented Lambda behavior.
- Every EC2 instance-type ENI/IP quota.
- Every Elastic Load Balancing implementation detail.
- Cross-VPC secondary networks and newer EC2 secondary-network constructs.
- Packet-capture internals or Traffic Mirroring implementation.

## 4. Visual thesis

Use a **“network passport + morphing interface”** visual language.

ENI-123 is drawn as a compact rounded network-interface card containing:

- ENI ID / persona label.
- subnet/AZ badge.
- address badge.
- ownership badge.
- security-group badge where applicable.
- attachment/service badge.

The card physically moves or morphs between resources. The page should feel like one interface touring the AWS network rather than a collection of independent architecture diagrams.

The first act establishes the passport. The second act makes ENI-123 appear around AWS services. The third act uses ENI-123 to explain routing, scale, failure, and troubleshooting.

## 5. Semantic colors and diagram grammar

### Semantic color roles

| Meaning | Color role | Usage |
| --- | --- | --- |
| ENI / network identity | Cyan | Persistent ENI card, IP labels |
| Customer controlled | Green | Interfaces or attributes the operator directly manages |
| AWS/service managed | Violet | Requester-managed, task-managed, load-balancer-managed, Hyperplane abstractions |
| Subnet / scope | Blue | Subnet/AZ boundaries and location |
| Security checkpoint | Amber | Security group, NACL, source/destination check |
| Data-plane traffic | Light cyan/white | Packet arrows and animated flow |
| Capacity / quota pressure | Orange | IP pool depletion, attachment pressure |
| Failure / block | Red | Missing route, denied packet, exhausted address space |
| Neutral infrastructure | Slate | VPC, resource shells, explanatory labels |

Never use color alone. Every state must include text/iconography/line style.

### Diagram grammar

- Solid arrow: runtime traffic.
- Dashed arrow: attachment/ownership/configuration relationship.
- Animated pulse: `flow-42`.
- Thick blue frame: subnet boundary.
- Thin larger frame: VPC boundary.
- Violet hatch: AWS-managed/requester-managed object.
- Green edge: customer-managed object.
- Amber shield: security group.
- Amber perimeter strip: NACL.
- Orange meter: finite address/ENI capacity.
- Broken red arrow: unavailable path.
- Number badges: strict troubleshooting order.
- `OWNER` badge: `YOU`, `AWS SERVICE`, `REQUESTER-MANAGED`, or `ABSTRACTED`.

## 6. Hero interaction budget

Only three visuals receive rich interaction:

1. **The ENI Morph Lab** — switch one interface persona across EC2, ECS/Fargate, EKS, Lambda, RDS, ALB, NLB, NAT Gateway, and Interface Endpoint and inspect what stays common vs changes.
2. **Packet Checkpoint Lab** — move `flow-42` through route, NACL, SG, and destination while toggling failure conditions; show first blocking reason.
3. **Capacity Lab** — vary subnet free IPs and workload networking mode to show scaling failure from subnet/ENI/IP pressure.

Other visuals are lighter selectors, comparisons, or static progressive diagrams.

## 7. Narrative sequence

| # | Section | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Meet ENI-123 | What exactly is an ENI? | Passport anatomy | light field focus | ENI carries subnet-scoped network identity and attributes |
| 2 | One subnet, one AZ | Can one ENI live in two subnets? | nested boundary | static + invalid drop hint | One ENI belongs to one subnet and cannot be moved to another |
| 3 | One EC2, two ENIs | Can a server belong to two networks? | dual-homed topology | toggle traffic lane | Multiple ENIs let one EC2 participate in multiple subnets, constrained by AZ |
| 4 | Security around the interface | SG vs NACL vs route—who does what? | checkpoint lab | HERO | Route chooses path; NACL and SG filter at different scopes |
| 5 | I am everywhere | How does ENI behavior differ by AWS service? | service morph inspector | HERO | Common primitive, different ownership and controls |
| 6 | Containers consume networking | Why can ECS task density hit an ENI limit? | host/trunk evolution | light before/after | `awsvpc` gives task-level VPC identity; trunking changes density |
| 7 | Kubernetes turns ENIs into Pod capacity | How do EKS Pods receive VPC addresses? | progressive node anatomy | mode selector | CNI consumes ENI IP/prefix slots; branch ENIs enable Pod SGs |
| 8 | Lambda myth buster | Does concurrency create one ENI per invocation? | many-to-shared interface | static animated aggregation | Hyperplane ENIs are shared managed VPC connectivity, not per-invocation ENIs |
| 9 | ENI as part of the route | When may traffic pass through an EC2 instance? | appliance path | source/dest-check toggle | Appliances can forward traffic; source/destination check and OS routing matter |
| 10 | Address + attachment continuity | Can network identity move independently from compute? | failover before/after | step toggle | Secondary ENI/IP movement can support same-AZ failover patterns |
| 11 | Networking is capacity | Why can workloads fail to scale with spare CPU? | depletion simulator | HERO | Subnet addresses + ENI limits + slots/prefixes constrain placement |
| 12 | Follow the ENI | How do I troubleshoot a broken connection? | evidence-driven decision tree | step-through | Start with source ENI and work through route/security to destination ENI |
| 13 | ENI vs ENA vs EFA | Aren’t these the same thing? | three-column comparison | static | Separate VPC interface identity from networking device/fabric technologies |
| 14 | Final network map | Where are ENIs hiding in a real VPC? | full architecture reveal | hover/focus highlight | ENIs unify many VPC concepts without making all services identical |

---

# 8. Detailed visual specifications

## Visual 1 — “My network passport”

### Purpose

Make the ENI concrete before involving any AWS service. Resolve the vague idea that an ENI is “just a virtual NIC.”

### Learner question

“What information actually belongs to an ENI?”

### Persistent scenario state

ENI-123 exists unattached in `subnet-app-a`, Availability Zone `ap-south-1a`.

### Concepts and actors

- `eni-0abc123`.
- `subnet-0app1a` / `10.20.1.0/24`.
- `ap-south-1a`.
- Primary private IPv4: `10.20.1.17`.
- Secondary private IPv4: `10.20.1.18`.
- Example IPv6: `2406:da1a:20:1::17`.
- MAC: illustrative `02:7b:64:10:20:17`.
- SGs: `sg-app`, `sg-observability`.
- source/destination check: enabled.
- attachment: `available`.
- ownership: `YOU`.

### Composition

Large passport card centered inside a subnet frame. The VPC frame is visible around it but visually quiet. The card has four quadrants:

1. Identity: ENI ID, owner, state.
2. Location: VPC, subnet, AZ.
3. Addresses: private IPv4, secondary IPv4, IPv6, MAC.
4. Controls: SGs, source/destination check, attachment/device index.

A narrow side note reads: “The exact attributes available depend on interface type and service ownership.”

### Interaction

Click/focus one passport field to highlight the matching concept label in a side inspector. No animation beyond a 200 ms focus transition.

Keyboard: fields are buttons in DOM order; Enter/Space selects; Escape returns to overview.

### Data/content states

Default: unattached customer-created interface. Secondary state: attached to `i-0web123` as device index `1`.

### Failure/edge state

If the learner selects “public IP”, explain that public/Elastic IP behavior is not a universal ENI property and varies by resource/networking mode. Do not imply every interface receives public IP assignment directly.

### Required copy

Takeaway: **“An ENI is a subnet-scoped network identity with addresses, security associations, and attachment state.”**

Misconception: “ENI = physical NIC.”  
Correct model: “It is an AWS VPC network-interface resource; the guest may see a corresponding device depending on attachment and service.”

### Accuracy caveats

- The example MAC/IPs are illustrative.
- Service-managed interfaces may expose fewer mutable attributes.

### Mobile behavior

Passport quadrants stack. Side inspector becomes an inline definition panel below the selected field.

### Accessibility

All field highlights have text labels. Focus order matches reading order. No information conveyed by card position alone.

### Source anchors

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html

### Acceptance checks

- Reader can name subnet, IP, SG, MAC, source/destination check, and attachment as ENI attributes.
- Page does not imply all service-managed ENIs expose all attributes.

---

## Visual 2 — “I live in one subnet”

### Purpose

Establish the non-negotiable locality rule that every later visual depends on.

### Learner question

“Can the same ENI stretch across two subnets?”

### Persistent scenario state

ENI-123 sits inside `subnet-app-a` in `ap-south-1a`.

### Concepts and actors

- VPC `10.20.0.0/16`.
- `subnet-app-a 10.20.1.0/24`, AZ `ap-south-1a`.
- `subnet-db-a 10.20.3.0/24`, same AZ.
- `subnet-app-b 10.20.11.0/24`, AZ `ap-south-1b`.
- ENI-123.

### Composition

Three subnet tiles in one VPC. ENI-123 is visibly contained in app-a. A ghost drag path toward db-a is marked “cannot move existing ENI to another subnet.” A second ghost path toward app-b adds “also different AZ.”

### Interaction

Static by default. On pointer/focus, attempted destination subnet shows the rejection reason. Avoid full drag/drop because the rule is more important than the interaction.

### Data/content states

- Valid creation in one subnet.
- Invalid “move to another subnet.”

### Failure/edge state

Show that a *new* ENI can be created in another subnet, but it is a different ENI ID.

### Required copy

**“One ENI → one subnet. The subnet determines the ENI’s Availability Zone.”**

### Accuracy caveats

Do not say “one resource → one subnet.” EC2 and some services can use multiple interfaces/subnets.

### Mobile behavior

Subnets stack vertically with clear `AZ A` and `AZ B` headers.

### Accessibility

Invalid transitions include explicit text reasons; do not rely on red X alone.

### Source anchors

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/create-network-interface.html

### Acceptance checks

- The learner does not leave believing an ENI can be moved between subnets.

---

## Visual 3 — “You want two subnets? Get another me.”

### Purpose

Use dual-homing to separate “one ENI is subnet-scoped” from “one EC2 can have multiple network attachments.”

### Learner question

“How can one EC2 instance use an app subnet and a management subnet?”

### Persistent scenario state

ENI-123 becomes the primary application interface on `i-0web123`; a second interface `eni-0mgmt456` is attached to the same instance.

### Concepts and actors

- EC2 `i-0web123` in `ap-south-1a`.
- `eth0 → eni-0abc123 → app-subnet-a`.
- `eth1 → eni-0mgmt456 → mgmt-subnet-a`.
- ALB traffic lane to app ENI.
- VPN/DX/admin lane to mgmt ENI.
- Distinct SGs.
- OS route table icon.

### Composition

EC2 centered, two ENI passport cards below-left/below-right, each contained in a different subnet tile but under the same `ap-south-1a` banner. Traffic lanes enter from opposite sides.

Secondary mini-panel: “Advanced: secondary ENI can be from another VPC you own in the same account if the AZ matches.” Keep collapsed by default.

### Interaction

Two toggle buttons: `App traffic` and `Management traffic`; activating one animates the matching lane and highlights the SG applied to that interface.

### Data/content states

- App: ALB → `eni-0abc123:443`.
- Mgmt: VPN → `eni-0mgmt456:22` or `443` for admin agent; use generic “management” if avoiding SSH preference.

### Failure/edge state

- Attempt secondary ENI from `ap-south-1b` → blocked: AZ mismatch.
- Warning: multiple interfaces can require OS routing/policy-routing care.

### Required copy

**“One ENI cannot span subnets. One EC2 can use multiple ENIs.”**

Misconception: “Adding two ENIs doubles network bandwidth.”  
Correct model: “Attachment count is not a simple bandwidth multiplier.”

### Accuracy caveats

- Instance type controls attachment count.
- Multi-interface hosts can encounter asymmetric routing.
- Cross-VPC secondary ENI case is same-account and same-AZ; do not imply cross-account support.

### Mobile behavior

EC2 first, then app interface/subnet, then management interface/subnet. Traffic-lane toggles remain above the diagram.

### Accessibility

`aria-pressed` for lane toggles. Live text reads the selected path.

### Source anchors

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/scenarios-enis.html
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/network-interface-attachments.html

### Acceptance checks

- Same-AZ constraint is visible without opening a note.
- Cross-VPC support is not generalized beyond documented same-account/same-AZ behavior.

---

## Visual 4 — HERO: “Packet checkpoint lab”

### Purpose

Resolve the common confusion between route table, NACL, security group, and ENI.

### Learner question

“Which control actually blocks my packet?”

### Persistent scenario state

`flow-42` travels from app ENI `10.20.1.17` to RDS-side address `10.20.3.25:5432`.

### Concepts and actors

- Source ENI and SG `sg-app`.
- Source subnet route table.
- Source subnet NACL.
- Destination subnet NACL.
- Destination requester-managed RDS interface / SG `sg-db`.
- Route match `10.20.0.0/16 local`.
- Stateful SG semantics.
- Stateless NACL semantics.

### Composition

Horizontal circuit:

`source ENI → source SG → route decision → source NACL → VPC local path → destination NACL → destination SG → RDS`

The route card is a signpost rather than a firewall gate. NACL gates have explicit `IN` and `OUT` halves. SG shield is marked `STATEFUL`.

Top control bar toggles:

- Route exists.
- Source SG egress allowed.
- Destination SG inbound allowed.
- NACL forward direction allowed.
- NACL return ephemeral path allowed.

Result panel always shows first blocking reason and operator evidence.

### Interaction

Rich decision lab.

Default: all controls allow → `flow-42 ALLOWED`.

Toggle examples:

- Route off → packet stops at route decision: “No matching reachable path.”
- DB SG inbound off → “Destination SG does not allow TCP/5432 from sg-app.”
- NACL return off → forward may leave but connection fails because stateless return path is denied.

Reset restores healthy path.

Keyboard: tab through switches; result is `aria-live=polite`.

### Data/content states

Use PostgreSQL TCP/5432 as the concrete example. The service is illustrative; the networking model is generic.

### Failure/edge state

Add a mode chip `NAT Gateway exception`: replace destination with NAT Gateway and hide the SG control with text: “NAT Gateways do not support security groups; control source workloads plus subnet NACL/routing.”

### Required copy

- **Route table = where.**
- **NACL = subnet-level stateless allow/deny.**
- **Security group = stateful allowed flows for supported resources/interfaces.**
- **ENI = network presence carrying the addresses and attachment context.**

### Accuracy caveats

- Ordering is a teaching sequence, not a claim about literal packet-processing implementation order inside AWS.
- SG evaluation is stateful; NACLs are stateless.
- Some services attach SGs at the service abstraction while AWS manages underlying interfaces.

### Mobile behavior

Horizontal circuit becomes numbered vertical checkpoints. Result card remains sticky within section.

### Accessibility

- Every switch has visible state text.
- Result contains first blocker in words.
- Animated packet stops under `prefers-reduced-motion`; state changes remain visible.

### Source anchors

- https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html
- https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html

### Acceptance checks

- Reader can explain why “route blocked it” differs from “SG denied it.”
- NAT mode removes the incorrect SG assumption.

---

## Visual 5 — HERO: “I am everywhere — ENI Morph Lab”

### Purpose

Make the page’s central thesis memorable while preserving service-specific differences.

### Learner question

“If ENIs are everywhere, are they all the same?”

### Persistent scenario state

ENI-123 changes persona across services. A large label reads: “Teaching morph — not one literal ENI moving between services.”

### Concepts and actors

Selectable services:

1. EC2 primary/secondary ENI.
2. ECS `awsvpc` task ENI.
3. Fargate task ENI.
4. EKS node/CNI-managed ENI capacity.
5. Lambda Hyperplane ENI abstraction.
6. RDS requester-managed network interface.
7. ALB network interfaces in configured subnets.
8. NLB one network interface per enabled AZ.
9. NAT Gateway requester-managed network interface.
10. Interface VPC endpoint requester-managed endpoint ENI.

Inspector fields:

- Network presence model.
- Who creates it?
- Can customer attach/detach it?
- Can customer modify ENI attributes directly?
- Security-group relationship.
- Subnet relationship.
- Scaling implication.
- Visibility caveat.

### Composition

Left: service selector tiles. Center: morph stage with service silhouette + ENI card. Right: inspector matrix. Below: invariant strip “subnet-scoped network presence / addresses / interface concept” and changing strip “ownership / mutability / visibility / SG handling / scale model.”

### Interaction

Rich selector. Selecting a service morphs the center stage and updates inspector.

Representative required states:

**EC2** — customer can create/attach secondary ENIs, subject to AZ/instance limits.  
**ECS** — ECS creates task ENI; user cannot manually detach/modify while task runs.  
**Fargate** — task gets ENI; `awsvpc` is required.  
**EKS** — CNI manages ENIs/IPs/prefixes on nodes; Pod SG mode uses branch ENIs.  
**Lambda** — Hyperplane ENI is managed/abstracted and shared for compatible subnet+SG combinations.  
**RDS** — requester-managed; view but do not manage attachment/IP lifecycle.  
**ALB** — ELB creates interfaces in configured subnets for nodes/maintenance; service-managed behavior.  
**NLB** — one interface per enabled AZ/subnet; static IP behavior.  
**NAT** — requester-managed ENI; no SG on NAT Gateway.  
**Interface Endpoint** — endpoint ENI per selected subnet; SGs control endpoint traffic.

### Data/content states

Use Mumbai region examples (`ap-south-1a`, `ap-south-1b`) while clearly labeling zone letters as account-specific mappings if discussing physical AZ identity elsewhere.

### Failure/edge state

Selecting NAT shows the SG row as `Not supported`, not blank. Selecting Lambda shows visibility as `AWS-managed abstraction; not directly managed by you`.

### Required copy

**“The primitive repeats. Ownership does not.”**

Misconception: “If I see an ENI, I should be able to detach or edit it.”  
Correct model: “Requester-managed and service-managed interfaces are owned by the service lifecycle.”

### Accuracy caveats

- Use “network interface(s)” for ALB rather than claiming a fixed one-per-AZ invariant identical to NLB.
- Lambda Hyperplane ENIs are presented as a documented connectivity abstraction, not ordinary account-visible ENIs.
- EKS section represents CNI-managed network capacity rather than claiming one Pod always owns one ordinary ENI.

### Mobile behavior

Service selector becomes horizontal tabs; inspector moves under stage. Preserve selected service while scrolling.

### Accessibility

Tablist semantics or buttons with `aria-pressed`; inspector title announces selected service.

### Source anchors

- EC2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html
- Requester-managed: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/requester-managed-eni.html
- ECS: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking-awsvpc.html
- Fargate: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html
- EKS: https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html
- Lambda: https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html
- ALB: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html
- NLB: https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html
- NAT: https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html
- Interface endpoint: https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html

### Acceptance checks

- At least 10 service personas are selectable.
- Ownership and SG differences are explicit.
- “Teaching morph” caveat remains visible at all times.

---

## Visual 6 — “ECS: containers become VPC citizens”

### Purpose

Show why `awsvpc` mode changes task isolation and capacity.

### Learner question

“Why does each ECS task suddenly care about ENI limits?”

### Persistent scenario state

ENI-123 is now a task ENI for `orders-task-7`.

### Concepts and actors

- EC2 container instance host ENI.
- ECS task A/B/C ENIs.
- `awsvpc` mode.
- task SG.
- `ip` target-group relationship.
- trunk ENI mode.
- Fargate note.

### Composition

Before/after split:

**Ordinary awsvpc density**: host ENI + task ENIs consuming attachment capacity.  
**Trunking**: host primary + trunk interface + more task network interfaces/branches represented under the service-managed trunk model.

A small Fargate card says: “Fargate tasks use `awsvpc`; each task gets an ENI.”

### Interaction

Toggle `Standard attachment density` / `ENI trunking`. The number of visible task cards changes; avoid hard-coding a universal maximum because instance type matters. A concrete `c5.large` example may be shown as an explicitly sourced historical/current example only if verified in the build.

### Data/content states

Each task has `10.20.2.x`, `sg-orders`, and target type `ip`.

### Failure/edge state

Placement attempt fails with `network attachment capacity unavailable` while CPU meter still shows spare compute.

### Required copy

**“In `awsvpc`, task networking is first-class VPC networking.”**

### Accuracy caveats

- ECS on EC2 supports other network modes; `awsvpc` is recommended but not the only EC2 mode.
- Fargate requires `awsvpc`.
- Windows ECS trunking support differs; keep overview Linux-oriented unless expanded.

### Mobile behavior

Before/after stacks vertically.

### Accessibility

Mode toggle announced with current task-capacity explanation.

### Source anchors

- https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking-awsvpc.html
- https://docs.aws.amazon.com/AmazonECS/latest/developerguide/container-instance-eni.html
- https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html

### Acceptance checks

- Learner sees task IP/SG identity and understands why target type `ip` is used.

---

## Visual 7 — “EKS: Pods spend ENI capacity”

### Purpose

Make VPC CNI Pod addressing and Security Groups for Pods understandable without teaching the entire CNI implementation.

### Learner question

“How does a Pod end up with a VPC IP, and why can networking cap Pod density?”

### Persistent scenario state

ENI-123 is the node primary ENI on `ip-10-20-4-10`; additional CNI-managed ENIs appear as Pod demand grows.

### Concepts and actors

Modes:

- Secondary-IP mode.
- Prefix mode (`/28` IPv4 prefix).
- Security Groups for Pods using trunk + branch ENI.
- warm pool concept.
- node ENI attachment limit.

### Composition

One EKS node centered. Three mode buttons above it.

**Secondary IP:** Pods map to secondary addresses on primary/secondary ENIs.  
**Prefix:** ENI slot owns a `/28` prefix and Pod addresses fan out.  
**Pod SG:** trunk ENI connects to branch ENIs, each selected Pod displays distinct SG badge.

### Interaction

Light mode selector, not a hero simulator. Switch redraws the node anatomy and one-sentence explanation.

### Data/content states

Example Pods: `orders-7`, `payments-4`, `telemetry-2`.

### Failure/edge state

`payments-5` remains `Pending` when no branch ENI/network slot is available. Show “compute available” next to “networking unavailable.”

### Required copy

**“Pod density is partly a VPC networking capacity problem.”**

Misconception: “Every EKS Pod always owns a normal standalone ENI.”  
Correct model: “Default VPC CNI usually assigns Pod addresses from ENI capacity; Pod-SG mode introduces branch ENIs for selected Pods.”

### Accuracy caveats

- Prefix sizes and behavior differ for IPv4/IPv6.
- Prefix mode requires compatible CNI/version/configuration; current page cites current docs.
- Do not imply branch ENI use for every Pod.

### Mobile behavior

Node diagram stacks ENI → prefixes/addresses → Pods.

### Accessibility

Mode buttons include summaries; diagram has text equivalent.

### Source anchors

- https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html
- https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html
- https://docs.aws.amazon.com/eks/latest/best-practices/network-security.html

### Acceptance checks

- Reader can distinguish secondary-IP, prefix, and Pod-SG models.

---

## Visual 8 — “Lambda: 1,000 invocations do not mean 1,000 ENIs”

### Purpose

Correct a persistent pre-Hyperplane/oversimplified Lambda mental model.

### Learner question

“Does every VPC Lambda invocation create its own ENI?”

### Persistent scenario state

ENI-123 becomes a **Hyperplane ENI teaching representation** for Lambda functions configured with the same compatible subnet/security-group combination.

### Concepts and actors

- Lambda functions A/B/C.
- many concurrent invocations.
- subnet + security-group combination.
- shared Hyperplane ENI.
- 65,000 connections/ports documented capacity per Hyperplane ENI.
- auto scale-out of additional ENI capacity as required.
- private-subnet route/NAT/endpoint reminder.

### Composition

Top fan-in: many invocation dots collapse into three function cards, then into a shared violet Hyperplane interface bridge, then VPC resource side.

A counter animates `1 → 100 → 1,000` invocations while the interface count stays conceptual until connection pressure crosses the documented interface capacity; do not present deterministic concurrency-to-ENI arithmetic.

### Interaction

Static animation or one `Increase concurrency` button only. This is intentionally not a hero simulator because Lambda chooses scaling internally.

### Data/content states

- `subnet-app-a + sg-lambda` shared combination.
- second function with different SG creates a separate combination lane.

### Failure/edge state

Function attached to a public subnet but no valid egress path shows: “Public subnet selection does not automatically give the function a public IPv4 address.”

### Required copy

**“Lambda VPC networking is shared managed Hyperplane connectivity, not one ordinary ENI per invocation.”**

### Accuracy caveats

- Hyperplane ENIs are AWS-managed and not directly customer-managed.
- 65,000 figure is connection/port capacity, not “65,000 concurrent Lambda invocations.”

### Mobile behavior

Functions stack above shared interface, then VPC destination.

### Accessibility

Animated dots are decorative; textual counter and explanation carry the information.

### Source anchors

- https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html

### Acceptance checks

- Page never equates Lambda concurrency 1:1 with ENI count.

---

## Visual 9 — “Sometimes I am on the route”

### Purpose

Connect ENIs to network appliances, routing, and source/destination checking.

### Learner question

“When can an EC2 instance forward traffic that is not addressed to itself?”

### Persistent scenario state

ENI-123 is the ingress interface of `fw-ec2-a`; `eni-fw-egress` is the second interface.

### Concepts and actors

- workload subnet route table.
- EC2 firewall/router.
- two ENIs.
- source/destination check.
- Linux forwarding / OS route icon.
- downstream egress/inspection network.

### Composition

Traffic path from workload subnet to firewall ENI A, through EC2 appliance, out ENI B. A large switch card labelled `Source/destination check` overlays the appliance.

### Interaction

Toggle source/destination check `ON/OFF`.

- ON: transit packet blocked from appliance role.
- OFF: AWS-side prerequisite satisfied; second label still says `OS forwarding/routing must be configured`.

### Data/content states

`0.0.0.0/0 → eni/appliance target` is represented generically; do not imply all route targets accept direct ENI IDs in every topology. Use “appliance instance/network interface path” unless exact target type is shown from current docs.

### Failure/edge state

Source/destination check off but OS forwarding off → packet still fails. This prevents the common “disable one checkbox and I have a router” misconception.

### Required copy

**“Disabling source/destination check permits appliance-style forwarding; it does not configure the guest OS for you.”**

### Accuracy caveats

- Routing target support varies by design/service.
- Multi-NIC appliances need careful symmetric routing.

### Mobile behavior

Vertical path.

### Accessibility

Switch state and first failure reason are textual.

### Source anchors

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/scenarios-enis.html
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html

### Acceptance checks

- Learner does not leave believing ENI attachment itself performs routing.

---

## Visual 10 — “Network identity can outlive compute”

### Purpose

Show why secondary interfaces and secondary private addresses can be useful in same-AZ failover.

### Learner question

“Can I move a network identity from a failed instance to a standby?”

### Persistent scenario state

ENI-123 represents a movable **secondary** service interface in `ap-south-1a`.

### Concepts and actors

- active EC2 A.
- standby EC2 B.
- secondary ENI or secondary private IPv4.
- same-AZ boundary.
- automation/controller.

### Composition

Three frames: normal → failure → recovery. The same secondary ENI card detaches from active and attaches to standby. Primary ENIs remain fixed on each instance.

### Interaction

Simple step-through `Normal`, `Fail`, `Recover`.

### Data/content states

- service IP `10.20.9.50`.
- brief interruption label.

### Failure/edge state

Standby placed in another AZ → red rejection: “Cannot attach this ENI across AZs.”

### Required copy

**“Network identity and compute identity can be separable, but ENI failover remains AZ-scoped.”**

### Accuracy caveats

- Do not present this as multi-AZ HA.
- Primary ENI cannot be detached from a running/stopped EC2 instance in the same way as secondary interfaces.

### Mobile behavior

Timeline becomes vertical.

### Accessibility

Each step includes a text description; animation optional.

### Source anchors

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/network-interface-attachments.html
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/scenarios-enis.html

### Acceptance checks

- Same-AZ limitation is prominent.

---

## Visual 11 — HERO: “Networking is capacity”

### Purpose

Turn ENI/IP exhaustion into a first-class production scaling concept.

### Learner question

“How can deployment fail when CPU and memory are fine?”

### Persistent scenario state

ENI-123 lives in `subnet-app-a`; the subnet is shared by EKS, ECS, endpoints, and load-balancer networking.

### Concepts and actors

Inputs:

- subnet free IPv4 addresses (slider 0–250 illustrative).
- workload mode: EC2 / ECS `awsvpc` / EKS secondary IP / EKS prefix / interface endpoints.
- host ENI attachment headroom (low/medium/high abstract selector).
- current desired scale count.

Outputs:

- can place / cannot place.
- first constraint: subnet addresses / ENI attachments / ENI slots / branch ENIs.
- remaining free-IP meter.
- suggested architectural lever: larger/new subnet, IPv6, prefix delegation, trunking, placement changes, endpoint rationalization as appropriate.

### Composition

Left control panel. Center subnet address pool made of 64 small cells (representative, not literal CIDR count). Right result card with `COMPUTE HEADROOM` vs `NETWORK HEADROOM` gauges.

### Interaction

Rich simulator with three presets:

1. **ECS task surge** — consumes task-network identities and host networking capacity.
2. **EKS Pod surge** — secondary-IP mode runs out earlier.
3. **EKS prefix mode** — shows more Pod address capacity per ENI slot, while subnet address space is still finite.

A fourth preset `Interface endpoint sprawl` demonstrates one endpoint ENI per selected subnet consuming addresses.

Do not produce fake exact universal numbers. The simulator is labeled “conceptual capacity model; exact limits depend on instance type and service configuration.”

### Data/content states

Default: 42 free addresses, medium host ENI headroom, request +30 EKS Pods.

### Failure/edge state

CPU 55% / memory 61%, yet placement fails due to network headroom. Result reads: “Compute is available; networking is the first exhausted resource.”

### Required copy

**“Subnet IP space and ENI capacity are application capacity.”**

### Accuracy caveats

- Use conceptual ratios unless exact instance type is selected and current limits are fetched/verified.
- `/28` prefix delegation gives 16 IPv4 addresses per prefix assignment slot but actual usable Pod capacity depends on CNI/node configuration.

### Mobile behavior

Controls → pool → result stacked. Presets remain large tap targets.

### Accessibility

All sliders have numeric text. Pool cells have a textual equivalent such as `42 addresses free`.

### Source anchors

- https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html
- https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html
- https://docs.aws.amazon.com/AmazonECS/latest/developerguide/container-instance-eni.html
- https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html

### Acceptance checks

- Learner understands at least three independent constraints: subnet addresses, attachment count, address/prefix slots.
- No unsupported universal maximum is displayed.

---

## Visual 12 — “Follow the ENI” troubleshooting lab

### Purpose

End the conceptual journey by converting it into an operational debugging method.

### Learner question

“An app cannot reach a database. Where do I start?”

### Persistent scenario state

`flow-42` is failing from `eni-app 10.20.1.17` to `eni/rds-side 10.20.3.25:5432`.

### Concepts and actors

Troubleshooting sequence:

1. Resolve source workload → ENI/IP.
2. Identify source subnet/AZ.
3. Confirm destination IP/ENI/service endpoint.
4. Inspect route.
5. Inspect SG relationships.
6. Inspect source/destination NACLs.
7. Inspect VPC Flow Logs.
8. Inspect service health/listener/application layer.

Evidence panel fields:

- `interface-id`.
- `srcaddr` / `dstaddr`.
- `srcport` / `dstport`.
- protocol.
- `ACCEPT/REJECT`.
- log status.

### Composition

Left: numbered decision tree. Center: mini topology. Right: Flow Log evidence card. Advancing one step highlights both the topology object and the evidence to collect.

### Interaction

Step-through sequence with `Next`, `Back`, `Reset`. Failure preset selector:

- missing SG allow.
- NACL return blocked.
- missing route.
- wrong DNS/destination.

Each preset ends at the first component that explains the failure.

### Data/content states

Example flow-log format is paraphrased/simplified rather than copied extensively from docs.

### Failure/edge state

`REJECT` may indicate filtering evidence but page must not claim Flow Logs always identify the exact SG/NACL rule. The lab says “use the record to narrow the path, then inspect the relevant controls.”

### Required copy

**“Which ENI should the packet leave, which should receive it, and what checkpoints lie between them?”**

### Accuracy caveats

- Flow Logs are metadata, not packet capture.
- `SKIPDATA`/`NODATA` states exist.
- Some managed service interfaces are abstracted or service-owned, so start from the closest customer-visible network identity.

### Mobile behavior

Decision tree becomes accordion steps; evidence card follows active step.

### Accessibility

Current step uses `aria-current=step`; result and evidence updates are live-region text.

### Source anchors

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html
- https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-records-examples.html

### Acceptance checks

- Troubleshooting does not stop at generic “check SG/NACL.”
- First blocking reason and observable evidence are explicit.

---

## Visual 13 — “ENI ≠ ENA ≠ EFA”

### Purpose

Clear up three names that are often conflated.

### Learner question

“Are ENI, ENA, and EFA just three generations of the same thing?”

### Persistent scenario state

ENI-123 pauses; the page zooms from VPC resource model to EC2 network-device choices.

### Concepts and actors

Three columns:

- ENI: VPC network-interface resource / identity and attributes.
- ENA: traditional high-performance IP networking device path.
- EFA with ENA: adds EFA device capabilities while retaining ENA IP networking.
- EFA-only: no traditional IP networking.

### Composition

Three cards with “What question does it answer?”

- ENI: “Who/where am I in the VPC?”
- ENA: “How does this EC2 instance perform normal IP networking?”
- EFA: “How do tightly-coupled AI/HPC workloads achieve low-latency fabric communication?”

### Interaction

Static comparison; interaction would add little.

### Data/content states

Show `interface`, `efa`, `efa-only` API type labels in a small footer.

### Failure/edge state

None needed; naming contrast is the point.

### Required copy

**“ENI is the network-interface resource model; ENA/EFA describe interface/device capabilities.”**

### Accuracy caveats

Do not reduce EFA to “faster ENA”; EFA adds a distinct device path and OS-bypass capabilities.

### Mobile behavior

Cards stack.

### Accessibility

Comparison is real text, not image-only.

### Source anchors

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/create-network-interface.html

### Acceptance checks

- Reader can state one sentence distinguishing all three.

---

## Visual 14 — “Now find me everywhere” final architecture reveal

### Purpose

Recombine the page into one real production architecture and prove the mental model transfers.

### Learner question

“Where should I look for ENI-shaped network presence in a normal production VPC?”

### Persistent scenario state

ENI-123 becomes a highlighter rather than one object. Each supported service footprint is revealed one by one.

### Concepts and actors

Two AZ VPC containing:

- internet-facing ALB.
- ECS/Fargate service.
- EKS worker node/Pods.
- Lambda VPC function.
- RDS.
- NAT Gateways.
- interface endpoints.
- management EC2 with two ENIs.
- private subnets and DB subnets.
- route tables, SGs, NACLs.

### Composition

Full-width two-AZ VPC. Services are initially muted. A `Show network interfaces` button lights up the network-presence points and labels ownership types.

The architecture must not imply that the same literal ENI object attaches to multiple managed resources. Each highlighted interface has a distinct ID/persona.

### Interaction

Light reveal controls:

- `Interfaces`.
- `Security`.
- `Routes`.
- `Capacity pressure`.

Only one overlay active at a time to avoid clutter.

### Data/content states

Include `ap-south-1a` and `ap-south-1b`, with separate NAT Gateway and workload subnets to reinforce AZ-local designs.

### Failure/edge state

Capacity overlay marks one app subnet as low on free addresses and shows which upcoming resources may fail placement.

### Required copy

Closing line:

**“You thought AWS networking was VPCs and subnets. Most of the time, you were talking to an interface somewhere.”**

Subline:

**“Follow the interface, then follow the packet.”**

### Accuracy caveats

The diagram is a mental-model map, not a claim that every managed-service data-plane component is visible as a customer-manageable ENI.

### Mobile behavior

Replace giant architecture with two stacked AZ cards and a service-by-service interface inventory.

### Accessibility

Overlay controls update a textual inventory list immediately below the diagram.

### Source anchors

Use the complete source index below.

### Acceptance checks

- Final map reuses the same semantic grammar as earlier visuals.
- Ownership badges remain visible.

---

# 9. Persistent page elements

## ENI state ribbon

Desktop sticky ribbon, max ~12% viewport height:

`ENI persona | service | owner | subnet/AZ | address | SG support | flow state`

Examples:

- `ENI-123 | EC2 secondary | YOU | app-a / 1a | 10.20.1.17 | sg-app | flow-42 allowed`
- `ENI-123 | NAT Gateway | REQUESTER-MANAGED | public-a / 1a | 10.20.0.5 | SG: N/A | egress`
- `ENI-123 | Lambda Hyperplane | ABSTRACTED | app-a / 1a | managed | sg-lambda combination | shared`

## Progress navigation

`Passport → Scope → Multi-ENI → Security → Everywhere → Containers → EKS → Lambda → Routing → Failover → Capacity → Troubleshoot → ENA/EFA → Map`

Ordinary anchors without JavaScript; active section enhancement with JavaScript.

## Ownership legend

Persistent compact legend:

- YOU.
- AWS SERVICE.
- REQUESTER-MANAGED.
- ABSTRACTED / NOT DIRECTLY MANAGED.

## Common misconception markers

Use no more than one per major section. Required misconceptions:

1. An ENI can span subnets.
2. More ENIs automatically means more bandwidth.
3. Every ENI has a security group you can manage.
4. Every ECS/EKS/Lambda workload uses ENIs the same way.
5. One Lambda invocation equals one ENI.
6. Spare CPU means a node/task host can always scale.
7. Flow Logs are packet captures.

# 10. Responsive and accessibility requirements

- Core explanation must remain understandable without JavaScript.
- Below ~760 px, horizontal packet paths become numbered vertical flows.
- No page-level horizontal scrolling.
- Interactive selectors use buttons/tab semantics, not hover-only state.
- `aria-pressed`, `aria-selected`, `aria-current`, and live regions where applicable.
- At 200% zoom, diagrams reflow rather than clip.
- `prefers-reduced-motion: reduce` disables ENI morph animation and packet pulses.
- Color is never the only state signal.
- All SVG-like diagrams implemented with HTML/CSS in prototype must expose textual summaries.
- Minimum touch targets ~44 px.
- Focus rings are high contrast.

# 11. Prototype implementation contract

Create `aws-eni-visual-prototype.html` as a single self-contained file.

It must include:

- Complete 14-section narrative order.
- Representative content for every major visual.
- Three working hero interactions:
  1. ENI Morph Lab.
  2. Packet Checkpoint Lab.
  3. Capacity Lab.
- At least four meaningful failure states across the page.
- Sticky chapter navigation and ENI state ribbon.
- Responsive layouts.
- Reduced-motion handling.
- Accessible controls and live result regions.
- Source links.
- No framework dependency.
- Minimal vanilla JavaScript.
- No external images required for the approval prototype.

Technical validation:

- JavaScript parses.
- IDs are unique.
- All internal anchors exist.
- No console-breaking missing references.
- No placeholder `TODO` text.
- Source links point to current AWS primary docs.

# 12. Integration guidance for Infra Illustrated

Implementation status as of 2026-09-10:

- Approval prototype: `guide/topics/aws-eni/aws-eni-visual-prototype.html` — implemented and browser-checked at desktop and 390 px mobile widths.
- Proposed canonical published route: `/aws/vpc/eni`.
- Production Astro/MDX integration: not started; the prototype remains an unpublished design artifact.
- Accuracy refinement applied in the prototype: NAT Gateway is the explicit no-security-group exception. The NLB persona states that NLB security groups are supported when configured and does not inherit the NAT exception.

Preserve the established dark Infra Illustrated design system from the IAM prototype:

- dark navy page background;
- raised blue/slate panels;
- high-contrast semantic accent colors;
- compact sticky chapter nav;
- rounded diagram panels;
- bold short section headings;
- monospace for IDs/IPs/flow evidence;
- responsive two-column → single-column reflow around ~760 px.

Do not copy IAM’s authorization-circuit semantics. Only reuse typography, spacing, navigation, panel language, and interaction ergonomics.

Recommended page slug:

`/aws/vpc/eni`

Recommended title:

`I'm an AWS ENI. Look What I Can Do.`

SEO/technical subtitle:

`Elastic Network Interfaces: the hidden primitive behind AWS VPC networking`

# 13. Deep-dive page handoffs

1. **EC2 multi-ENI and policy routing**  
   Why: guest OS behavior, asymmetric routing, and network appliances need more depth.  
   Link from: Visuals 3 and 9.  
   Persistent scenario: dual-homed Ubuntu EC2 with app and management interfaces.

2. **EKS VPC CNI internals**  
   Why: warm pools, IPAMD, prefix mode, custom networking, SG-for-Pods, and maxPods warrant their own lab.  
   Link from: Visual 7 and Capacity Lab.  
   Persistent scenario: one pending Pod moving through address allocation.

3. **ECS `awsvpc` and ENI trunking**  
   Why: density, task ENIs, branch/trunk behavior, target registration, and Fargate differences.  
   Link from: Visual 6.  
   Persistent scenario: one ECS service scaling from 2 to 100 tasks.

4. **Lambda VPC networking and Hyperplane**  
   Why: subnet/SG combinations, connection scale, egress, endpoints, and troubleshooting are frequently misunderstood.  
   Link from: Visual 8.  
   Persistent scenario: one Lambda function accessing RDS and an AWS API privately.

5. **PrivateLink under the hood**  
   Why: endpoint ENIs, DNS, endpoint policies, NLB/provider path, and cross-account/cross-Region behavior deserve a full page.  
   Link from: Morph Lab and final map.  
   Persistent scenario: one HTTPS request to a private AWS/service endpoint.

6. **AWS VPC packet troubleshooting**  
   Why: Reachability Analyzer, Flow Logs, Traffic Mirroring, SG/NACL/route failure trees can become a dedicated operational tool.  
   Link from: Visual 12.  
   Persistent scenario: `flow-42`.

7. **IPv6 and ENI addressing**  
   Why: IPv6-only subnets, dual stack, egress-only IGW, EKS IPv6 prefixes, and public reachability differ enough to deserve separate treatment.  
   Link from: Passport and Capacity Lab.

# 14. Production-practice ending

End with the operational loop:

1. **Place it** — VPC, AZ, subnet.
2. **Address it** — IPv4, IPv6, prefixes, public/EIP mapping where supported.
3. **Secure it** — SG relationship, NACL, service exception.
4. **Route it** — path and return path.
5. **Own it** — customer vs requester/service-managed vs abstracted.
6. **Scale it** — subnet addresses, ENI attachment limits, IP/prefix/branch capacity.
7. **Observe it** — Flow Logs and service telemetry.
8. **Fail it** — route removal, security change, IP exhaustion, instance/AZ failure.
9. **Refine it** — right-size address space and reduce accidental network complexity.

Dangerous shortcuts to call out:

- Deleting “mystery” service-managed ENIs manually.
- Treating all ENIs as mutable EC2 ENIs.
- Designing small subnets based only on current EC2 count.
- Assuming multiple NICs solve bandwidth problems.
- Disabling source/destination check without deliberate appliance routing.
- Using overly permissive SG/NACL rules simply to make a path work.

# 15. Page-level acceptance criteria

The page is approved only when:

- The first visual establishes ENI identity and subnet scope.
- The same ENI persona remains recognizable across the narrative.
- The teaching-morph caveat prevents literal misinterpretation.
- EC2 multi-ENI same-AZ rules are explicit.
- Security-group vs NACL vs route roles are visually distinct.
- NAT Gateway’s no-SG exception is present.
- ECS task ENIs and trunking are covered.
- EKS secondary-IP, prefix, and Pod-SG models are distinguished.
- Lambda does not imply one ENI per invocation.
- Requester-managed interfaces are visually distinct from customer-controlled interfaces.
- NLB’s per-enabled-AZ interface/static-IP behavior is accurate.
- Interface endpoint ENIs are tied to selected subnets and SGs.
- Capacity failure occurs even with spare compute in the simulator.
- Flow Logs are presented as metadata, not packet capture.
- ENI/ENA/EFA are correctly distinguished.
- At least one production failure appears in every act.
- The page finishes with an operational troubleshooting/scaling loop.

# 16. Primary source index

Verified 2026-09-10.

- EC2 ENI concepts and attributes: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html
- Create ENI / subnet and AZ constraints: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/create-network-interface.html
- Multiple ENIs / dual-homed EC2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/scenarios-enis.html
- ENI attachment considerations: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/network-interface-attachments.html
- Requester-managed ENIs: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/requester-managed-eni.html
- VPC NACLs: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html
- ECS `awsvpc` task networking: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking-awsvpc.html
- ECS ENI trunking: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/container-instance-eni.html
- ECS Fargate networking: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html
- EKS VPC CNI: https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html
- EKS prefix mode: https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html
- EKS Security Groups for Pods / network security: https://docs.aws.amazon.com/eks/latest/best-practices/network-security.html
- Lambda VPC / Hyperplane ENIs: https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html
- Interface endpoints / endpoint ENIs: https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html
- Configure interface endpoints: https://docs.aws.amazon.com/vpc/latest/privatelink/interface-endpoints.html
- NAT Gateway ENI/security behavior: https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html
- ELB request routing and NLB interfaces: https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html
- ALB subnet/network-interface behavior: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html
- NLB introduction: https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html
- NLB AZ/interface behavior: https://docs.aws.amazon.com/elasticloadbalancing/latest/network/availability-zones.html
- VPC Flow Log examples: https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-records-examples.html
- EFA/ENA comparison: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html
