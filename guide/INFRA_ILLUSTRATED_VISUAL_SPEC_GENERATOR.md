# Infra Illustrated — Universal Visual Specification Generator

Version: 1.0  
Purpose: Give this document to any capable AI session to produce an approval-ready visual specification and interactive HTML prototype for an AWS service, Kubernetes topic, cloud architecture pattern, security concept, networking concept, or infrastructure workflow.

## Use in this repository

Adopted for new topic visuals and substantial visual rebuilds on 2026-09-10. Follow the [repository workflow](../AGENTS.md#visual-design-workflow) for artifact placement, review, and integration. Read this generator in full before designing; the workflow summary does not replace its detailed contracts.

Apply the existing-project rule below with [SITE-REBUILD-BRIEF.md](../SITE-REBUILD-BRIEF.md) as the source of truth for product scope, architecture, and visual semantics, and [WRITING-GUIDE.md](../WRITING-GUIDE.md) for reader-facing copy. Adapt the sample tokens, connector grammar, overview size, and callout phrasing to those conventions.

Store both deliverables in `guide/topics/<topic-slug>/`. The self-contained HTML is an approval artifact; production pages use canonical MDX and shared Astro/TypeScript components. These artifacts are not catalogue entries or legacy pages. Existing user approval or implementation authorization carries forward; routine corrections do not require restarting the design process.

---

## Copy/paste invocation

Use this specification to design the Infra Illustrated page for:

```text
TOPIC: <required topic>
AUDIENCE: <optional; default: cloud engineers with working foundational knowledge>
DEPTH: <optional; default: detailed overview with links to advanced deep dives>
LEARNING GOAL: <optional; what the reader should confidently understand or do>
EXISTING PROJECT OR PAGE: <optional repository/path/URL/reference>
KNOWN CONSTRAINTS: <optional visual, technical, factual, or scope constraints>
```

Produce both required deliverables:

1. `<topic-slug>-visual-spec.md`
2. `<topic-slug>-visual-prototype.html`

Follow every applicable instruction below. Do not return only an outline, prose explanation, Mermaid diagram, or static mockup. The HTML prototype must contain representative working interactions for approval.

---

# Instructions for the session

## 1. Your role

Act as the visual learning architect for **Infra Illustrated**.

Your job is to transform a technical topic into a coherent visual learning journey. You are responsible for:

- Technical correctness.
- Concept sequencing.
- Visual storytelling.
- Interaction design.
- Prototype implementation.
- Responsive and accessible behavior.
- Clear separation between overview content and future deep dives.

Do not merely decorate documentation. Build a visual model that makes the system easier to reason about.

The reader should finish the page with a reusable mental model, not a collection of memorized definitions.

## 2. Default audience and depth

Unless the invocation says otherwise, assume the reader:

- Works with cloud or infrastructure systems.
- Recognizes common product names and basic terminology.
- Wants architectural and operational understanding.
- May not know the topic’s internal mechanics or edge cases.
- Values accurate production implications over introductory marketing language.

Use a layered depth model:

1. **Core page:** primitives, lifecycle, decision points, failure paths, and operational guidance.
2. **Expandable details:** important caveats that fit without breaking the narrative.
3. **Deep-dive handoffs:** complex exceptions, attacks, service-specific behavior, or advanced implementation patterns that deserve separate pages.

Do not turn the overview into an exhaustive reference manual.

## 3. Clarification policy

Proceed with reasonable defaults whenever the topic is sufficiently clear.

Ask at most two concise questions only when an unanswered choice would materially change the technical architecture or visual direction. Good reasons include:

- The name refers to multiple unrelated technologies.
- The requested scope could mean control plane, data plane, operational usage, or internals and there is no safe default.
- An existing page must be replaced but its source or design system is unavailable.
- The audience is so different that the same visual would be inappropriate.

Do not ask the user to choose libraries, frameworks, diagram types, colors, or routine implementation details.

## 4. Existing-project rule

If an existing Infra Illustrated project or page is available:

1. Inspect the project instructions and only the files needed to understand its structure.
2. Identify its typography, spacing, color tokens, card language, navigation, diagram conventions, component patterns, and responsive breakpoints.
3. Preserve the established design system unless redesign is explicitly requested.
4. Build the prototype so its sections can be moved into the existing page with minimal translation.
5. Do not replace project architecture, dependencies, routing, or working components merely to simplify prototyping.

If no project is available, create a self-contained prototype and clearly tokenize its visual system so it can be adapted later.

## 5. Research and accuracy protocol

Research the topic before finalizing the narrative or visuals.

### Source priority

Use primary, current sources wherever possible:

- **AWS:** AWS documentation, service developer/user guides, API references, architecture guidance, AWS security guidance, official announcements, and official GitHub repositories.
- **Kubernetes:** kubernetes.io documentation, enhancement proposals, Kubernetes GitHub repositories, SIG documentation, and CNCF project documentation.
- **Protocols and standards:** RFCs, IETF, NIST, W3C, OpenID Foundation, CNCF, or the project’s authoritative specification.
- **Vendor products:** the vendor’s official documentation and API references.
- **Open-source internals:** upstream documentation, source code, design proposals, and maintainers’ release notes.

Use secondary sources only to clarify—not to override—primary sources.

### Time sensitivity

Verify facts that can change, including:

- Supported features.
- Limits and quotas.
- Policy types.
- API behavior.
- Kubernetes version behavior.
- Defaults.
- Pricing.
- Regional availability.
- Deprecations.
- Security recommendations.

Add an “as verified on” date when the visual contains limits, defaults, prices, or feature availability.

### Accuracy worksheet

Before drawing, privately answer:

1. What are the system’s actual primitives?
2. Which objects are configuration, and which objects exist at runtime?
3. Who owns each object?
4. What initiates the lifecycle?
5. Which control-plane components make decisions?
6. Which data-plane components carry traffic or work?
7. What state is stored, and where?
8. What combines as a union?
9. What combines as an intersection or maximum?
10. What condition overrides every other decision?
11. What happens on retry, timeout, failure, failover, rescheduling, or deletion?
12. Which common mental model is technically wrong?

Do not implement a visual until these answers are internally consistent.

### Source anchors

Include a final source section in both deliverables. Link each major visual to the primary documentation that supports it. Do not paste long quotations from documentation.

## 6. Find the narrative spine

Choose one persistent object or scenario that can travel through most of the page.

Examples:

| Topic family | Useful persistent object |
| --- | --- |
| IAM / authentication | One signed request or identity session |
| Networking | One packet, flow, DNS query, or connection |
| Kubernetes scheduling | One pending Pod |
| Kubernetes networking | One packet from Pod A to Service B |
| SQS / Kafka / NATS | One message and its delivery attempts |
| Observability | One request producing traces, metrics, and logs |
| Databases | One write, transaction, query, or replication record |
| DR / backup | One workload state change and one recovery event |
| KMS / encryption | One plaintext data key and one encryption operation |
| Load balancing | One client connection or HTTP request |
| CI/CD | One source change moving toward production |
| Autoscaling | One demand spike and the resulting scaling decisions |

The persistent object should prevent the page from becoming a disconnected gallery.

Display a compact persistent state ribbon when it adds value. Depending on the topic, it may show:

- Identity.
- Source and destination.
- Current lifecycle state.
- Selected configuration.
- Owning component.
- Retry count.
- Replication position.
- Availability Zone or Region.
- Current decision or outcome.

Every major section should either transform the object, explain a decision affecting it, or reveal a deeper layer underneath it.

## 7. Build the concept dependency graph

Before choosing visuals, identify the minimum concept order.

Use this general pattern when it fits:

1. **Primitives:** what objects or actors exist?
2. **Relationships:** how are they connected or configured?
3. **Lifecycle:** what happens from start to finish?
4. **Decision engine:** which component chooses what happens next?
5. **Boundaries and constraints:** what limits or overrides the normal path?
6. **Failure behavior:** what breaks, retries, queues, fails over, or becomes unavailable?
7. **Scale and production patterns:** what changes under load or across teams/accounts/clusters/Regions?
8. **Operational practice:** how should engineers configure, observe, secure, and troubleshoot it?

Reorder this sequence when the technology demands it. For example, a networking topic may start with a packet journey; a DR topic may start with business requirements such as RTO and RPO.

The first visual must establish the primitive that every later visual depends on. Never begin with advanced configuration before the reader knows what is being configured.

## 8. Choose the visual inventory

Create approximately 7–12 major visuals for a detailed overview. Use fewer when the topic is narrow and more only when the user explicitly requests exhaustive depth.

Choose the smallest visual form that makes the relationship easier to understand:

| Information shape | Preferred visual |
| --- | --- |
| Components and connections | Topology map |
| Ordered events | Sequence or step-through flow |
| State transitions | State machine |
| Hierarchy and inheritance | Tree or nested frames |
| Alternative designs | Side-by-side comparison |
| Exact feature mapping | Matrix or table |
| Request or packet internals | Layered anatomy view |
| Permission or routing decision | Interactive decision lab |
| Capacity or scaling response | Timeline or input/output simulator |
| Retry and failure handling | Branching failure path |
| Scope or containment | Nested boundaries |
| Before/after optimization | Diff or transformation view |
| Multiple signals from one event | Correlation view |

Avoid forcing every concept into architecture boxes and arrows.

### Hero interaction budget

Select at most three visuals as hero interactions. These receive the richest animation and controls.

Good hero candidates:

- The central lifecycle.
- The most confusing decision engine.
- The most important production or failure scenario.

All other visuals should be lighter diagrams, comparisons, selectors, or progressive disclosures. Ten competing simulators create cognitive overload.

## 9. Required content coverage

For each topic, determine which of these lenses apply:

### Foundations

- Definitions and primitives.
- Runtime versus configuration objects.
- Naming and scope.
- Ownership and boundaries.

### Mechanics

- Happy-path lifecycle.
- Control-plane decisions.
- Data-plane movement.
- State transitions.
- Timing, retries, ordering, or consistency.

### Architecture

- Component relationships.
- Same-account/cluster/Region behavior.
- Cross-account/cluster/Region behavior.
- Managed-service versus self-managed responsibilities.

### Security

- Identity and trust boundaries.
- Encryption and secrets.
- Least privilege.
- Isolation.
- Misconfiguration and privilege-escalation paths.

### Reliability

- Failure modes.
- Recovery behavior.
- Availability Zone and Region considerations.
- Backpressure and overload.
- Data loss or duplication risks.

### Operations

- Metrics, logs, and traces.
- Troubleshooting decision tree.
- Deployment and change safety.
- Quotas, limits, and cost drivers.
- Recommended operational loop.

Do not mechanically add every lens. Include only those that materially improve understanding of the topic.

## 10. Misconception-driven design

Identify the 3–6 mistakes engineers most commonly make about the topic.

Each misconception must appear at the exact place where the correct mental model is established. Use a compact marker such as:

> Common misconception: `<incorrect model>`  
> Correct model: `<accurate replacement>`

Examples of productive contrasts:

- Configuration object versus runtime object.
- Authentication versus authorization.
- Desired state versus observed state.
- Service discovery versus traffic forwarding.
- Replication versus backup.
- Encryption permission versus data access permission.
- At-least-once delivery versus exactly-once business processing.
- Readiness versus liveness.
- Node networking versus Pod networking.

Do not manufacture misconceptions merely to make the page dramatic.

## 11. Failure-first completeness check

For every happy-path visual, ask whether a failure view is needed.

Potential failure branches include:

- Authentication failure.
- Authorization denial.
- Missing route or DNS response.
- Health-check failure.
- Retry and duplicate delivery.
- Timeout and partial completion.
- Node or Availability Zone loss.
- Quota exhaustion.
- Backpressure.
- Stale cache or propagation delay.
- Split brain or replication lag.
- Pod eviction or rescheduling.
- Certificate expiry or trust failure.
- Dependency throttling.

Show the first component that detects the failure, the state transition it causes, and what the operator can observe. Avoid generic red “error” boxes with no mechanics.

## 12. Visual language

Choose one concise visual thesis derived from the topic. Examples:

- Authorization circuit.
- Packet journey through checkpoints.
- Control tower and worker fleet.
- Conveyor belt with retries and dead-letter exits.
- Replication timeline across failure domains.
- Layered protocol envelope.
- Scheduler decision board.

Do not reuse the IAM visual thesis automatically. The topic should determine the page silhouette and interaction grammar.

### Semantic color tokens

Define colors by meaning, not by component name. A useful starting set is:

```css
:root {
  --page-bg: ...;
  --surface: ...;
  --surface-raised: ...;
  --border: ...;
  --text: ...;
  --muted: ...;
  --actor: ...;
  --control-plane: ...;
  --data-plane: ...;
  --success: ...;
  --warning: ...;
  --failure: ...;
  --state: ...;
  --resource: ...;
}
```

Adapt the roles to the topic. Never communicate state through color alone.

### Diagram grammar

Define visual semantics before building. Examples:

- Solid arrow: runtime traffic or direct call.
- Dashed arrow: configuration, trust, watch, or desired-state relationship.
- Animated pulse: the persistent request, packet, message, or event.
- Outer frame: scope or administrative boundary.
- Clock ring: timeout, TTL, lease, or session duration.
- Repeating line: replication or streaming.
- Broken line: unavailable path.
- Numbered badges: strict event order.

Use the grammar consistently across the page.

## 13. Detailed visual-specification format

The Markdown deliverable must begin with:

- Topic.
- Status and version.
- Target audience.
- Page promise.
- Persistent scenario.
- Scope and non-goals.
- Visual thesis.
- Semantic color and diagram grammar.

Then include a narrative sequence table:

| # | Section | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |

For **every major visual**, use the following template.

### Visual N — `<descriptive title>`

#### Purpose

State what confusion this visual resolves.

#### Learner question

Write the question in the reader’s words.

#### Persistent scenario state

Explain where the page’s request, packet, Pod, message, transaction, or other persistent object is at this point.

#### Concepts and actors

List every component, object, boundary, and state that must appear. Distinguish configuration from runtime objects.

#### Composition

Describe the layout precisely enough that another session could implement it without inventing the information architecture. Include:

- Left/right/top/bottom placement.
- Containment and scope boundaries.
- Connectors and direction.
- Labels and state indicators.
- Default selected state.
- Supporting explanation.

#### Interaction

Specify controls, available states, transitions, reset behavior, keyboard behavior, and the exact feedback shown after an action.

If the visual is static, state why interaction would not improve it.

#### Data or content states

Provide realistic example values. Do not use meaningless labels such as Component A, Service B, or Account 1 when a concrete example would teach more.

#### Failure or edge state

Describe at least one meaningful failure, exception, or “not applicable” state when relevant.

#### Required copy

Provide the critical labels, takeaway sentence, and misconception callout. Avoid filling every box with paragraphs.

#### Accuracy caveats

State where the visual is intentionally simplified and which conditions change the behavior.

#### Mobile behavior

Explain how the composition becomes vertical or otherwise remains usable below approximately 760 px.

#### Accessibility

Specify semantic controls, focus order, live-region announcements, non-color state cues, reduced-motion behavior, and a text summary.

#### Source anchors

Link the primary documentation supporting the visual.

#### Acceptance checks

List observable checks that prove the visual teaches the intended model correctly.

After all visuals, include:

- Persistent page elements.
- Responsive and accessibility requirements.
- Prototype implementation contract.
- Integration guidance for the existing project.
- Deep-dive page handoffs.
- Page-level acceptance criteria.
- Source index.

## 14. Prototype requirements

Create `<topic-slug>-visual-prototype.html` as a self-contained approval prototype unless an existing project requires a different integration artifact.

### Minimum implementation

The prototype must include:

- The complete narrative order.
- Representative content for every major visual.
- Working interactions for the selected hero visuals.
- At least one meaningful failure or alternate state.
- A compact chapter navigation.
- A persistent scenario ribbon when appropriate.
- Responsive layouts.
- Accessible controls.
- Source links.

Do not implement only the first viewport.

### Technical constraints

- Use semantic HTML, CSS, and minimal JavaScript.
- Prefer one self-contained HTML file with inline CSS and JavaScript for the approval artifact.
- Do not require a package installation or build step unless the existing project requires it.
- Do not load fonts, JavaScript libraries, images, or stylesheets from third-party CDNs by default.
- Use CSS and small SVG connectors for diagrams and state visualization.
- Do not place essential text inside raster images.
- Do not build decorative representational artwork from CSS or SVG.
- Avoid Canvas for text-heavy technical diagrams because text selection and accessibility suffer.
- Use data objects as the source for labels and example states when one interaction updates multiple regions.
- Keep IDs unique.
- Keep JavaScript section-local and understandable.
- Do not include secrets, live account identifiers, private endpoints, internal hostnames, or real credentials.
- Use obviously fictional identifiers and documentation-safe examples.

### Interaction rules

- Every clickable card must be a real `button`, link, checkbox, radio input, or other native interactive element.
- Use `aria-pressed`, `aria-selected`, or native checked state as appropriate.
- Use `aria-live` for changing decisions, errors, lifecycle states, or result summaries.
- Provide a deterministic reset state for every simulator.
- Make the main learning state visible without requiring hover.
- Do not hide essential content behind tooltips.
- Support keyboard and touch input.
- Use animation only to clarify causality, order, movement, or state change.
- Respect `prefers-reduced-motion`.

### Text and density

- Main body text should be at least 16 px by default.
- Regular labels should normally be at least 14 px.
- Reserve 12–13 px for secondary metadata.
- Use short labels inside diagrams and place detailed explanation beside or below them.
- Ensure text does not overlap at 200% zoom.
- Avoid oversized marketing heroes that delay the first useful visual.

### Responsive behavior

- The prototype must work from 320 px mobile width through large desktop widths.
- Horizontal sequences should become numbered vertical sequences on narrow screens.
- Trees may use indentation, but must not cause page-level horizontal scrolling.
- Large matrices may become card lists when horizontal scrolling would obscure relationships.
- Sticky elements must not consume more than roughly 15% of the viewport or obscure section headings.

### Progressive enhancement

The page’s main explanation and section order must remain understandable if JavaScript does not run. JavaScript may enhance selection, animation, calculation, or alternate states, but it must not be the only place where the core model exists.

## 15. Preferred interaction patterns

Use these only where they match the concept:

### Selector with inspector

Use for object types, principal types, workload types, or component variants. Selecting a card updates an adjacent runtime inspector.

### Step-through sequence

Use for STS exchanges, scheduling, TLS handshakes, DNS resolution, reconciliation, failover, or deployment. Include current step, completed steps, and reset.

### Decision lab

Use when several policies, health signals, routes, predicates, or quorum conditions determine an outcome. State the simplified scenario and show the first blocking reason.

### Boundary playground

Use for permission ceilings, quotas, namespaces, cgroups, blast-radius controls, or resource limits. Let requested behavior visibly intersect with the boundary.

### Two-pattern comparison

Use when engineers commonly conflate two valid approaches, such as role assumption versus direct resource access, backup versus replication, ClusterIP versus headless Service, or active/passive versus active/active.

### Failure injection

Use for retry, failover, health checking, leader election, backpressure, or network paths. Let the user disable one dependency and show detection, state transition, and recovery.

### Before/after transformation

Use for least privilege, cost optimization, manifest hardening, query planning, policy refinement, or architecture evolution.

## 16. Production-practice ending

End the page with an operational loop or concise production checklist. It should answer:

- How should this be configured safely?
- What should be monitored?
- Which failure indicators matter?
- What should be tested regularly?
- Which cost or scale controls matter?
- Which dangerous shortcut should be avoided?

Prefer a repeatable loop over a generic “best practices” wall of text.

Example structure:

1. Define requirements and failure boundaries.
2. Configure the smallest safe initial scope.
3. Validate before deployment.
4. Observe real behavior.
5. Test failure and recovery.
6. Refine configuration and remove unnecessary access/capacity/complexity.

## 17. Deep-dive handoff rules

The overview must identify advanced topics without attempting to teach all of them inline.

Create deep-dive handoffs when a subject has:

- Service-specific exceptions.
- Version-specific behavior.
- Security attack paths.
- Complex troubleshooting branches.
- Many alternative architectures.
- Long configuration examples.
- Mathematical or protocol detail that would interrupt the main journey.

For every proposed deep dive, state:

- Why it deserves its own page.
- Which overview visual should link to it.
- The persistent scenario that page should use.

## 18. Validation workflow

Complete these checks before delivery.

### Factual validation

- Every major claim is supported by a primary source.
- Current limits, versions, defaults, prices, and supported features are verified.
- Configuration objects are not confused with runtime identities or state.
- Simplifications are labelled.
- Cross-account, cross-cluster, cross-Region, or failure-domain behavior is not implied from same-scope behavior without verification.

### Narrative validation

- The first visual establishes the required primitives.
- Every later visual depends naturally on earlier concepts.
- The persistent object remains recognizable.
- The page includes at least one failure or denied path when the topic has meaningful failure behavior.
- The ending converts the mental model into production practice.

### Visual validation

- Semantic colors and connector styles are consistent.
- No diagram depends on color alone.
- No section repeats the same diagram with only renamed labels.
- The three-or-fewer hero interactions are clearly more important than secondary visuals.
- The first useful visual appears without scrolling through a marketing-style hero.

### HTML validation

- JavaScript parses without syntax errors.
- Element IDs are unique.
- Every internal navigation target exists.
- Controls have accessible names and correct state attributes.
- Dynamic results use a suitable live region.
- Reduced-motion rules exist.
- The layout has no unintended page-level horizontal scrolling at mobile widths.
- Source links are valid primary-source URLs.
- No placeholder text, broken assets, or nonfunctional controls remain.

If browser preview or visual inspection is available, verify representative desktop and mobile widths. Fix clipped text, overlapping connectors, sticky-element collisions, and unusable touch targets.

## 19. Required final response

Lead with the completed outcome. Provide links to both artifacts and a concise summary containing:

- The chosen narrative spine.
- The number and names of major visuals.
- The three hero interactions.
- The most important accuracy decisions or caveats.
- Any design decisions that still need user approval.

Do not make the user read process logs. Do not claim publication or integration into an existing page unless it actually occurred.

## 20. Output-quality contract

The work is not complete when:

- Only an outline was written.
- The “prototype” contains inert cards with no representative interaction.
- The page is a generic dashboard unrelated to the topic’s mechanics.
- Visuals repeat documentation paragraphs inside boxes.
- The happy path is shown without meaningful failure or constraint behavior.
- Current product facts were not verified.
- Complex exceptions are silently simplified.
- Mobile behavior is unspecified.
- Accessibility is postponed to implementation.
- The visual specification is too vague for another engineer or session to implement.

The work is complete when another session can use the Markdown specification to rebuild the visual page without inventing its teaching sequence, conceptual model, interaction states, or critical copy—and when the HTML prototype lets the user approve that direction before full integration.

---

# Topic adaptation examples

These are examples of how to interpret the framework, not fixed page templates.

## Example A — Amazon SQS

Persistent object: one order message.

Possible visual sequence:

1. Queue, producer, consumer, and message primitives.
2. Send, store, receive, visibility timeout, delete lifecycle.
3. Standard versus FIFO comparison.
4. Long polling and batch retrieval.
5. At-least-once delivery and idempotent processing.
6. Visibility timeout simulator.
7. Retry, redrive policy, and DLQ path.
8. Lambda event-source scaling and concurrency controls.
9. Queue depth, age, and backpressure operations.
10. Production tuning loop.

Hero interactions: message lifecycle, visibility-timeout lab, DLQ/failure injection.

## Example B — Kubernetes Pod networking

Persistent object: one packet from Pod A to Pod B.

Possible visual sequence:

1. Pod, network namespace, veth pair, node interface, and CNI primitives.
2. Pod-to-node packet exit.
3. Same-node Pod-to-Pod path.
4. Cross-node Pod-to-Pod path.
5. Service virtual IP and endpoint selection.
6. kube-proxy/IPVS/eBPF implementation contrast where applicable.
7. NetworkPolicy decision lab.
8. DNS resolution and service discovery.
9. Failure injection: endpoint unready, route missing, policy deny.
10. Troubleshooting flow using namespace, route, conntrack, DNS, and CNI evidence.

Hero interactions: packet step-through, Service routing selector, policy/failure lab.

## Example C — Multi-Region disaster recovery

Persistent object: one business transaction before and during a regional failure.

Possible visual sequence:

1. RTO, RPO, workload, data, and dependency primitives.
2. Backup/restore, pilot light, warm standby, and active/active comparison.
3. Normal replication and traffic flow.
4. Failure detection timeline.
5. Promotion and traffic-shift sequence.
6. Data-loss window versus replication lag.
7. Dependency and control-plane availability map.
8. Failback and reverse-replication sequence.
9. DR drill evidence and failure injection.
10. Cost/readiness trade-off and operating loop.

Hero interactions: strategy comparison, failover timeline, failback sequence.

## Example D — OpenTelemetry pipeline

Persistent object: one application request and its telemetry signals.

Possible visual sequence:

1. Trace, span, metric, log, resource, and context primitives.
2. Context propagation across services.
3. SDK versus agent versus collector responsibility.
4. Receiver, processor, exporter pipeline anatomy.
5. Agent/DaemonSet versus gateway deployment comparison.
6. Sampling decision lab.
7. Batching, queues, retry, and backpressure.
8. Collector failure and data-loss paths.
9. Signal correlation using trace and resource attributes.
10. Production sizing and observability loop.

Hero interactions: context propagation, collector pipeline builder, failure/backpressure lab.

---

# Compact reusable prompt

Use the following only when the full document is already attached or available to the session:

```text
Using the attached “Infra Illustrated — Universal Visual Specification Generator,” create an approval-ready visual specification and self-contained interactive HTML prototype for:

TOPIC: <topic>
AUDIENCE: <audience or use the default>
DEPTH: <depth or use the default>
LEARNING GOAL: <optional>
EXISTING PROJECT OR PAGE: <optional>
CONSTRAINTS: <optional>

Research current behavior from primary sources. Build one continuous learning narrative around a persistent request, packet, Pod, message, transaction, identity, or other topic-appropriate object. Include meaningful failure paths and production practices. Produce the two required files, validate them, and return them for approval.
```
