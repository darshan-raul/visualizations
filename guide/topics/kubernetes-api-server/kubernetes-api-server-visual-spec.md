# Every Conversation Goes Through the Kubernetes API — Visual specification

**Topic:** Kubernetes API Server. **Status:** Integration design, version 1.0, 2026-09-16.
**Audience:** Working developers learning Kubernetes from foundation through control-plane internals.
**Page promise:** Follow a `web` Deployment from one accepted API request to three ready Pods, then use the same cluster map to inspect the other conversations that make Kubernetes work.
**Persistent scenario:** `web` in namespace `demo`, desired replicas `3`, Pods `web-a`, `web-b`, `web-c`, two worker Nodes, one selector-based Service, and optional PVC. Its request, API objects, desired/observed counts, and current owner remain visible in a scenario ribbon.
**Scope:** The 23 selectable flows, five exploration modes, request gates, LIST/WATCH, reconciliation, component inspection, 11 failure presets, HA, direct-call exceptions, and control/data-plane boundary in the [locked brief](../../Kubernetes%20API%20Server%20%E2%80%94%20Every%20Conversation%20Goes%20Through%20the%20API%20_%20Detailed%20Visual%20Specification.md).
**Non-goals:** Protocol-level cryptography, exact scheduling plugins, provider-specific controllers, every Kubernetes API kind, and a literal trace of kube-apiserver function calls.
**Visual thesis:** One exchange, many independent loops. The API server remains the spatial anchor as the selected conversation changes.

## Semantic grammar and accuracy decisions

Use the brief's dark tokens: cyan solid directed line for direct API calls and responses, violet dashed line for a retained LIST/WATCH relationship, green labelled commit/success, amber labelled pending or degraded, red broken line and `BLOCKED` text for failure. Status updates use a solid directed line plus `STATUS`; external provider calls use a double line and `EXTERNAL`; application traffic uses a heavy line and `DATA PLANE`. Solid arrows never imply scheduler or controller instructions to kubelet. A watch event may pulse back toward a client, but the persistent watch line remains still. On a reduced-motion system, selected actors/edges are outlined without travelling tokens.

The teaching order is authentication → authorization → applicable mutating admission → applicable validating admission → processing/persistence. Ordinary GET/LIST/WATCH bypass admission; API Priority and Fairness and routing are not asserted to be literal fixed positions in that simplified gate sequence. Most Kubernetes clients use the API rather than etcd; an API watch is not drawn as one etcd read per event. Kubernetes supports special API-server-initiated calls to kubelet, webhooks, and aggregated servers; provider controllers may call external APIs. kube-proxy is optional. Node-failure timing is illustrative and never implies one missed Lease instantly recreates Pods. Verified against current Kubernetes documentation on 2026-09-16.

## Console, groups, and narrative

The neutral shared shell holds the title/metadata, the `web` state ribbon, a native grouped disclosure index, one selected canvas, contextual right/bottom inspector, bottom takeaway, related visuals, primary sources, and footer. Groups are **The exchange**, **Reconciliation**, **Boundaries**, and **Internals**. The default active view is **Who talks to the API?** Only the selected group remains open after navigation. Short labels and `01 / 11` count keep the index readable. Five modes from the locked brief map to this console: Explore uses actor inspection in the exchange; Play a Flow uses the flow lab; Request Gates uses the gate view; Fail Something uses the failure view; Advanced uses internals and depth controls. These are conceptual destinations inside the single console, not five competing page frames.

| # | Index group / view | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | The exchange / Who talks to the API? | Is kubectl the only API client? | Persistent cluster topology | Select actors and relationships | API state is the common coordination surface. |
| 2 | The exchange / Request gates | Where can a request stop before state changes? | API-server perimeter / ordered gates | Read/write, gate steps, failure preset | A denied request never reaches later gates or persistence. |
| 3 | The exchange / Watch and caches | Does a controller repeatedly query etcd? | LIST → WATCH → informer → work queue | Client/server internals disclosure | A watch follows initial state; caches separate decisions from repeated GETs. |
| 4 | Reconciliation / Spec and status | How does desired state become observed reality? | Desired/observed bars and Observe–Compare–Act loop | Pod A version selection | Spec and status move through different actors and converge over time. |
| 5 | Reconciliation / Play a flow | Who acts after a Deployment is accepted? | Same topology + selected directed edges + step timeline | Select 23 scenarios, step/back/reset; hero Deployment play/pause | No single component performs the whole Deployment lifecycle. |
| 6 | Reconciliation / Conversations | What does each component read, watch and write? | Same topology + actor/edge inspector | Select component or edge | Controllers, scheduler and kubelet own different decisions. |
| 7 | Boundaries / Control or data? | Does application traffic traverse kube-apiserver? | Two-path comparison on same topology | Control/data/both selector | API centrality describes state coordination, not ordinary application traffic. |
| 8 | Boundaries / Fail something | What survives a control-plane or node failure? | Same topology + faulted edge/actor + seven-field result | Eleven failure presets; hero replay/step | Failure affects state, reconciliation and traffic differently. |
| 9 | Boundaries / HA and durable state | Does one API leader serve every request? | Endpoint → API replicas → etcd backing layer | One-replica and dependency failure | API replicas can serve concurrently; etcd and endpoint health still matter. |
| 10 | Internals / API responsibilities | What else lives behind the central API surface? | API-server cutaway and capability rails | Depth and capability selection | Discovery, policy, watch serving, storage and extensions share the API boundary. |
| 11 | Internals / One picture | Why coordinate through one shared API? | Direct-coupling versus common object model | Step transformation | Kubernetes is repeated reconciliation around a shared versioned API. |

## Per-visual contracts

### Visual 1 — Who talks to the API?

#### Purpose
Replace the picture of kubectl or one monolithic “brain” commanding the cluster.
#### Learner question
“Who actually talks to the API server?”
#### Persistent scenario state
The `web` request is prepared but no Deployment exists yet; actor geography is established before the lifecycle starts.
#### Concepts and actors
External clients (human, CI/GitOps, SDK), kube-apiserver, etcd backing layer, independent controllers, scheduler, kubelets on two Nodes, runtime/Pods, optional service/storage/provider actors. Configuration: Deployment manifest. Runtime: processes, node agents and Pods.
#### Composition
External clients at top, API server center, etcd behind/below, controller group left, scheduler right, worker nodes below, providers far right. Each actor is a real button; directed API edges return to the center. An `API CLIENT` label appears on kubectl alongside the others; no client-to-etcd edge. Initial state emphasizes kubectl, then actor selection reveals each relationship. The inspector gives reads/watches/writes/why; bottom says that shared API objects connect these actors. The opening topology stays largely unchanged in every later view.
#### Interaction
Select an actor or labelled relationship by click, touch, Enter or Space. Selection outlines the actor and relevant edge, updates inspector and `aria-live` relationship summary; selecting another clears the old highlight. No autoplay in this orientation view.
#### Data or content states
`kubectl apply -f web-deployment.yaml`, `Deployment/demo/web`, `web-a`, `worker-a`, `worker-b`, `etcd` backing state.
#### Failure or edge state
The `kubectl → etcd` misconception is shown as a labelled crossed-out hypothetical path; it is never a normal traffic edge.
#### Required copy
“kubectl is one API client.” “The API is the shared state gateway; decisions and execution remain distributed.”
#### Accuracy caveats
Some API-server-initiated and provider calls are legitimate exceptions and are unpacked in later views. The topology is a conceptual actor map, not a physical deployment manifest.
#### Mobile behavior
Keep the center as a focused map viewport; actor list and inspector stack underneath. Do not shrink labels to fit the entire desktop map.
#### Accessibility
Buttons have actor names, selected state uses `aria-pressed`, keyboard focus is visible, and a text relationship list follows the map. Reduced motion is a still outline.
#### Source anchors
[Cluster components](https://kubernetes.io/docs/concepts/overview/components/), [node/control-plane communication](https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/).
#### Acceptance checks
- kubectl, controllers, scheduler and kubelets reach API; none of their normal state edges terminate at etcd.
- The first useful visual fits before a long marketing introduction.

### Visual 2 — Request gates

#### Purpose
Separate identity, permission and admission, and show what a denial prevents.
#### Learner question
“Does an RBAC denial still run admission or write to etcd?”
#### Persistent scenario state
Alice submits a `CREATE Deployment/demo/web` request; the desired replicas are still only in the manifest until the accepted write persists.
#### Concepts and actors
Client request, TLS/API route, authentication identity, authorization attributes, optional mutating/validating admission, resource processing and persistence, etcd backing state. RBAC and configured alternatives are policies, not runtime Pods.
#### Composition
The same topology dims around a zoomed API-server perimeter. A single numbered gate rail crosses its center; etcd remains behind its final end. READ/WRITE comparison occupies a small top strip. A red failure stops at the exact gate, while later gates show `NOT REACHED`, not generic grey uncertainty. Inspector shows response, affected object and first operator clue. Motion follows only the selected request token; static step highlighting remains complete.
#### Interaction
READ/WRITE toggles set distinct gate lists. Presets: bad credential (401), RBAC denial (403), namespace missing, quota, PodSecurity, webhook denial/timeout, malformed object, stale resourceVersion conflict, overload. Step/back/reset inspect before/after; play/pause applies only to this hero gate trace. Switching preset resets to the first gate and stops playback. Results announce exact gate, response and what never ran.
#### Data or content states
User `alice`, verb `create`, resource `deployments.apps`, namespace `demo`; compare `GET Pods` to the write. `403 Forbidden` leaves the Deployment absent. Admission mutation is before validation conceptually.
#### Failure or edge state
RBAC denial is default alternate state: AuthN passed, AuthZ failed, admission and etcd not reached. A webhook timeout depends on its configured `failurePolicy` and is not universally denied.
#### Required copy
“Authentication identifies Alice; authorization checks this operation; admission examines applicable object-changing requests.” “A denied request never becomes shared state.”
#### Accuracy caveats
This is a teaching pipeline, not a call-stack trace. Admission can also intercept some connect-style requests, but ordinary GET/LIST/WATCH bypass it. Exact HTTP error for every preset depends on request and configuration; label only established outcomes.
#### Mobile behavior
Numbered gates stack vertically at 320 px, with the current response and inspector directly below.
#### Accessibility
Native controls and `aria-current=step`; live result includes `PASSED`, `BLOCKED` or `NOT REACHED`; reduced motion skips travelling token.
#### Source anchors
[Authentication](https://kubernetes.io/docs/reference/access-authn-authz/authentication/), [authorization](https://kubernetes.io/docs/reference/access-authn-authz/authorization/), [admission phases](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/).
#### Acceptance checks
- GET/LIST/WATCH never display ordinary admission gates.
- A denied request leaves persistence and downstream watch events visibly unexecuted.

### Visual 3 — Watch and caches

#### Purpose
Show how components react to API state without inventing continuous etcd polling.
#### Learner question
“What does a controller do between receiving events and making an API write?”
#### Persistent scenario state
The accepted `web` Deployment has resourceVersion `10245`; the Deployment controller learns its initial state and watches later changes.
#### Concepts and actors
API LIST result, resourceVersion, WATCH stream, ADDED/MODIFIED/DELETED events, reflector, local informer cache, handlers, work queue, reconcile, server watch cache, etcd backing state.
#### Composition
The canonical API/controller locations remain. A side band magnifies a LIST → WATCH dashed relationship and three event tokens, then an optional controller internals strip. Server cache appears between serving and durable backing, not as mandatory physical hop for every response. Intro comparison shows repeated polling faded behind one retained watch line. Static rail is clearer than a perpetual animation.
#### Interaction
“Client internals” and “Server internals” native disclosures reveal local and server layers; one manual `LIST`, `WATCH`, `MODIFIED`, `RECONCILE` stepper updates the inspector. No timed playback.
#### Data or content states
`Deployment/demo/web`, `resourceVersion: 10245`, `MODIFIED` → `11020`, queue key `demo/web`; a stale watch can return `410 Gone`, prompting re-LIST and re-WATCH.
#### Failure or edge state
Disconnected or too-old watch resets via list; a local cache can be temporarily behind API state.
#### Required copy
“LIST establishes a starting point. WATCH streams later changes. The controller reconciles from observed state and writes only when needed.”
#### Accuracy caveats
Bookmarks and cache serving vary; never claim every WATCH event is fetched directly from etcd or every decision triggers a GET.
#### Mobile behavior
Four numbered phases stack; the optional informer rail becomes a vertical sequence.
#### Accessibility
Disclosures use `details/summary`; event text remains readable without motion or JavaScript.
#### Source anchors
[Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts).
#### Acceptance checks
- WATCH is visibly a request/stream involving API server, not periodic controller-to-etcd polling.
- A stale `resourceVersion` shows re-LIST, not an unexplained missing event.

### Visual 4 — Spec and status

#### Purpose
Make the gap between declared intent and observed execution inspectable.
#### Learner question
“Why can a Deployment request three replicas while only one Pod is ready?”
#### Persistent scenario state
`web.spec.replicas=3` is accepted; status moves from 0 to 1 to 3 ready as separate loops progress.
#### Concepts and actors
Deployment spec, Deployment status, ReplicaSet desired/current, Pod spec.nodeName, Pod status.phase/Ready, Observe–Compare–Act loop.
#### Composition
Two flat bars at top show desired 3 and observed 0/1/3; below, API-centered actors remain in their canonical places while a compact Observe–Compare–Act loop connects the controller to an API write. A Pod object diff sits at right/bottom. No giant nested object cards.
#### Interaction
Select before schedule / bound / running Pod state. The object inspector changes only `spec.nodeName` or `status.phase`/Ready; text names the actor that made each change. This manual comparison is clearer than autoplay.
#### Data or content states
`spec.replicas: 3`, `status.readyReplicas: 1`, `web-a.spec.nodeName: worker-a`, `web-a.status.phase: Running`.
#### Failure or edge state
If one Pod exits, observed ready falls before replacement converges; the existing spec remains 3.
#### Required copy
“Spec says what the system should build. Status reports what it can currently see.”
#### Accuracy caveats
Pod phase Running is not the same as Ready. The visual uses a simplified desired/ready pair, not every Deployment status field.
#### Mobile behavior
Bars and diff become full-width rows; the loop becomes numbered vertical phases.
#### Accessibility
Version controls are buttons with pressed state; diff uses text `unset`, `worker-a`, `Running`, `Ready`.
#### Source anchors
[Deployment behavior](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), [Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/).
#### Acceptance checks
- A stored desired Deployment does not imply any container already runs.
- Scheduling changes Pod spec; kubelet reports Pod status.

### Visual 5 — Play a flow on the same map

#### Purpose
Let the reader trace multiple actors without losing the geography learned in Visual 1.
#### Learner question
“What happens between `kubectl apply` and three ready containers?”
#### Persistent scenario state
The `web` request and objects change at the selected step; desired/observed counts and the current owner update together.
#### Concepts and actors
All canonical actors/edges. 23 scenario IDs: Deployment, scheduling, assigned Pod, status return, node join, Lease heartbeat, node failure, Service/EndpointSlice, service proxy, ConfigMap/Secret, ServiceAccount API client, HPA, CSI storage, LoadBalancer, Gateway/Ingress, Operator/CRD, admission webhook, logs, exec/attach/port-forward, leader election, API aggregation, API outage, and API HA.
#### Composition
One cluster map never moves its principal actors. Only the current actor, directed edge type and object chip become bright; unrelated edges dim. A selected flow title/question and small object state rail sit above; clickable step timeline and transport controls sit below. The right inspector states actor, operation, observed evidence, object change and why the next actor reacts. A selector groups Foundation, Practitioner and Internals scenarios rather than showing 23 flat number buttons. A static summary for every scenario remains below in the no-JavaScript reading path.
#### Interaction
Every scenario supports select, direct step, previous/next and reset. Deployment uses hero play/pause and speed 0.5×/1×/2×; other flows remain manual under the brief's three-hero budget. Switching flow stops playback and resets. `Show API operation`, `Show YAML` and `Explain step` reveal the selected operation/changed fields in the inspector; they are disclosures, not decorative toggles. Query parameter `flow=` deep-links scenario inside `#flow-lab`; browser history restores both.
#### Data or content states
Hero 14 stages: Apply → AuthN → AuthZ → Admission → Store Deployment → Deployment controller WATCH → CREATE ReplicaSet → ReplicaSet controller compares 3/0 → CREATE three Pods → Scheduler WATCH/choose → BIND Pods → kubelet WATCH/CRI → PATCH Pod status → controllers observe convergence. `web-a` lands on `worker-a`; the final desired/ready pair is 3/3 in this example. Other scenarios follow the named objects and operation sequences in the locked brief.
#### Failure or edge state
At “Store Deployment,” status is still 0 ready. Scheduler selection does not start a container; kubelet action follows observing assigned Pod. A selected outage flow stops API communication while existing Pods remain.
#### Required copy
“No single component performed this workflow. Each loop observes state, acts within its scope, and records changes through the API.”
#### Accuracy caveats
Stage times and final Ready=3 are illustrative; admission, readiness, CSI topology and cloud integrations depend on configuration. A scheduler binding is recorded through API state; it is not a scheduler-to-kubelet command. `kubectl logs` and admission webhooks are explicit direct-call exceptions.
#### Mobile behavior
The stepper appears first, then a focused/pannable map viewport, then inspector; actor labels remain at least 14 px. A separate textual step list makes pan optional.
#### Accessibility
Arrow Left/Right step when focus is within the timeline, Space pauses/plays only the hero, Escape closes details. Each step is a button; current step and result are announced in a live region. Map edges have descriptive labels.
#### Source anchors
[Components](https://kubernetes.io/docs/concepts/overview/components/), [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), [API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts), [EndpointSlices](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/), [CSI provisioner](https://kubernetes-csi.github.io/docs/external-provisioner.html), [HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/), [Leases](https://kubernetes.io/docs/concepts/architecture/leases/).
#### Acceptance checks
- All 23 listed scenarios have representative stages and can be selected and stepped.
- All normal state edges touch the API server; external and special paths carry their own labels.
- Direct query links restore the selected flow and its group; no-JavaScript summaries preserve the 23 narratives.

### Visual 6 — Component conversations

#### Purpose
Prevent “controller manager” and “kubelet” from becoming interchangeable boxes.
#### Learner question
“What does this actor read, watch, write and why?”
#### Persistent scenario state
`web` exists; actor selection examines one responsibility without advancing the flow.
#### Concepts and actors
Deployment/ReplicaSet/Node/EndpointSlice/HPA controllers, scheduler, kubelet, API server, service proxy, CSI and cloud controllers; labelled API relationships and provider exceptions.
#### Composition
The same topology stays visible. Selecting a button or real labelled edge brightens that relation and fills a flat inspector with mandatory READS/WATCHES/WRITES/WHY fields plus optional DIRECT EXTERNAL CALLS. Controller manager expands into named loops below the same position; kubelet scope stays inside its Node.
#### Interaction
Each actor/edge is a button, with `aria-pressed` and visible selection. Reset returns to API server. Relationship text is always present below the map for no-JavaScript reading.
#### Data or content states
ReplicaSet controller: reads/watches ReplicaSets and Pods, creates Pods, reports status; scheduler: watches unscheduled Pods and Nodes, binds Pod; kubelet: watches assigned Pod, drives CRI and reports status/Lease.
#### Failure or edge state
A controller-manager outage leaves existing Pods running while affected reconciliation stops; it is not identical to API outage.
#### Required copy
“A controller acts on API state; a scheduler records placement; a kubelet makes assigned state real on its Node.”
#### Accuracy caveats
The inspector names representative resources, not every exact informer and client call in every version.
#### Mobile behavior
Map and inspector stack, with a full-width actor list as an alternative to panning.
#### Accessibility
Selected actor and all four field headings are announced; hover alone never contains essential content.
#### Source anchors
[Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/), [node/control-plane communication](https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/).
#### Acceptance checks
- Controller manager opens multiple loops; scheduler and kubelet never acquire each other's execution responsibility.
- Provider direct calls are marked `EXTERNAL`, not normal Kubernetes state edges.

### Visual 7 — Control or data?

#### Purpose
Limit the central-API thesis to cluster state coordination, not ordinary application packets.
#### Learner question
“Does a client HTTP request to `web` pass through kube-apiserver?”
#### Persistent scenario state
The `web` Pods and Service exist; control-plane state has configured service routing before a client sends application traffic.
#### Concepts and actors
Service, EndpointSlice, service proxy/alternative, CNI/node network, Pod, client HTTP request, API server and controllers.
#### Composition
Same geography, with a split rail beneath the map: dashed `WATCH Service/EndpointSlice` to API and heavy `HTTP DATA PLANE` from client through service forwarding to Pod. Toggle brightens control, data or both; API server is explicitly outside the HTTP rail. Inspector explains how the two relate without making kube-proxy universal.
#### Interaction
Three native radio choices change edge classes and textual summary. No autoplay; the static contrast carries the point.
#### Data or content states
`Service/demo/web`, selector `app=web`, EndpointSlice backends `10.1.0.5`, `.8`, `.9`, HTTP port 80.
#### Failure or edge state
With API unavailable, existing service rules and Pod traffic may continue while endpoint updates cannot propagate; removing a service proxy affects clusters using it, not every dataplane.
#### Required copy
“The API coordinates Service state. The node's network dataplane carries the application's request.”
#### Accuracy caveats
Endpoint readiness, proxy mode and CNI implementation vary. Ingress/Gateway and cloud controllers may configure separate external dataplanes.
#### Mobile behavior
The two rails stack as numbered text-backed paths.
#### Accessibility
Native radio labels include “Control”, “Data”, “Both”; line style and badges distinguish them without color.
#### Source anchors
[EndpointSlices](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/), [Services/networking](https://kubernetes.io/docs/concepts/services-networking/).
#### Acceptance checks
- No ordinary HTTP data edge touches API server.
- API WATCH and dataplane forwarding are visually and textually distinct.

### Visual 8 — Fail something

#### Purpose
Show why cluster state, reconciliation, execution and workload traffic fail differently.
#### Learner question
“If I stop this component, what actually stops first?”
#### Persistent scenario state
`web` is 3 desired/3 ready at reset; a selected fault changes one actor/edge and the observed state over a short trace.
#### Concepts and actors
Eleven presets: kill Pod, Node, controller, scheduler, all API servers, one API replica, block admission webhook, break RBAC, break etcd connectivity, overload API, remove kube-proxy. Seven result fields: stops, continues, detector, object change, reacting controller, traffic effect, recovery condition.
#### Composition
One canonical map highlights the failed actor/edge with red broken line and preserves healthy context. A short three-to-seven-step fault trace sits below; inspector has seven labelled outcome rows. Pod loss shows 3→2→3 ready and new Pod D; Node loss shows missing Lease then lifecycle/taint/replacement, with time rather than instant recreation. API outage leaves existing node runtime/Pods visible.
#### Interaction
Preset selection resets fault trace. Manual steps/back/reset work for all faults; this hero has play/pause on Pod loss and API outage only within one failure visual. The result live region announces changed availability and first detector; tab-hidden page pauses timers.
#### Data or content states
Pod B exits, kubelet updates Pod status, ReplicaSet observes 2/3 and creates Pod D, scheduler binds it, kubelet starts it. API outage: `kubectl get` and new writes fail, existing running Pods remain.
#### Failure or edge state
One failed API replica under healthy endpoint/etcd still leaves others serving; etcd quorum or endpoint failure can defeat that availability. A blocked webhook's outcome depends on `failurePolicy`.
#### Required copy
“A stopped control-plane component does not instantly stop containers already running on Nodes.” “Find the first state or dependency that stopped moving.”
#### Accuracy caveats
Timing, eviction and readiness are configured/contextual. The simulation uses representative outcomes and names conditions rather than promising fixed recovery times.
#### Mobile behavior
Fault list becomes a compact disclosure; the selected trace and seven outcome fields stack.
#### Accessibility
Fault buttons have pressed state; broken paths include `BLOCKED`; result is live; reduced motion lands on selected step without pulse.
#### Source anchors
[Nodes and heartbeats](https://kubernetes.io/docs/concepts/architecture/nodes/), [Leases](https://kubernetes.io/docs/concepts/architecture/leases/), [cluster architecture](https://kubernetes.io/docs/concepts/architecture/), [API flow control](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/).
#### Acceptance checks
- Kill Pod and API outage produce materially different stop/continue fields.
- Node failure does not assert instant recreation after one missed heartbeat.

### Visual 9 — HA and durable state

#### Purpose
Separate concurrent API serving from controller/scheduler leader election and etcd backing.
#### Learner question
“Does an API leader have to be elected before another replica can accept requests?”
#### Persistent scenario state
`web` remains stored; clients use one endpoint backed by three API replicas, while etcd is durable state behind them.
#### Concepts and actors
Control-plane endpoint, API1/API2/API3, etcd, endpoint health, etcd quorum dependency, scheduler/controller-manager Lease election.
#### Composition
The API server's canonical position expands into three adjacent replicas behind one endpoint, still above/forward of etcd. One-replica fault greys API2 while API1/3 remain reachable; a separate Lease rail shows one active scheduler/controller-manager, not one active API server. No single replica is drawn as a universal leader.
#### Interaction
Buttons select healthy, API2 failed, endpoint failed or etcd degraded. Inspector reports what can still serve and which dependency is decisive; reset restores healthy. Static comparison suffices.
#### Data or content states
API1/2/3 serve concurrent client requests; `coordination.k8s.io/Lease` distinguishes component leadership and Node heartbeats by purpose.
#### Failure or edge state
An endpoint or etcd dependency can impair all API replicas; one failed replica alone need not.
#### Required copy
“API replicas can serve concurrently. Leader election belongs to active reconcilers; durable state and the control-plane endpoint remain dependencies.”
#### Accuracy caveats
No fixed quorum tolerance or claim that three API servers survive any two control-plane failures; etcd topology and load-balancer health matter.
#### Mobile behavior
Endpoint/replica/dependency tiers become vertical rows.
#### Accessibility
State labels `SERVING`, `FAILED`, `DEPENDENCY DEGRADED`; buttons and inspector work without color.
#### Source anchors
[Cluster architecture](https://kubernetes.io/docs/concepts/architecture/), [Leases](https://kubernetes.io/docs/concepts/architecture/leases/).
#### Acceptance checks
- API replicas show concurrent serving; controller/scheduler Lease is a separate coordination model.
- etcd is backing memory, never the public client API.

### Visual 10 — API responsibilities

#### Purpose
Explain why API centrality includes more than a kubectl endpoint without dumping internals into the opening map.
#### Learner question
“Which work happens at the API boundary, and what is delegated?”
#### Persistent scenario state
`web` objects are stable; selecting a capability reveals the API treatment of that same resource.
#### Concepts and actors
Discovery/versions, AuthN/AuthZ/admission, defaulting/conversion/validation, watch cache, storage interface, aggregation, subresources, audit, APF, TLS/proxy, webhook/provider boundaries.
#### Composition
The API node stays centered. A flat capability rail groups Fundamental, Security, State, Performance, Extensibility and Operations; selected detail appears adjacent without populating 20 tiny labels simultaneously. Optional advanced depth shows watch cache and informer, APF queue/reject, audit stages, `/status`, `/scale`, `/log`, `/exec`, aggregation path, and external call boundaries. This is an API-server cutaway, not another cluster map.
#### Interaction
Native category buttons/disclosures select one capability; selecting advanced reveals deeper explanation. No simulation beyond a conceptual APF comparison.
#### Data or content states
`/apis/apps/v1`, `deployments/status`, `deployments/scale`, `pods/log`, `pods/exec`, `metrics.k8s.io` aggregation, `RequestReceived`/`ResponseComplete` audit stages, APF queue or 429 reject.
#### Failure or edge state
An aggregated API server can fail while core API paths still respond; APF overload can queue or reject requests, with behaviour configured per priority level.
#### Required copy
“The API server authenticates and serves a versioned object model; many implementation details sit behind that stable surface.”
#### Accuracy caveats
APF does not apply identically to all long-running operations; aggregation is registered through APIService. Exact cache-serving details depend on resourceVersion semantics and Kubernetes version.
#### Mobile behavior
One category expanded at a time; capability details follow its button.
#### Accessibility
Native controls, headings and descriptive edge labels; advanced information is not hover-only.
#### Source anchors
[API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts), [aggregation](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/), [APF](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/), [auditing](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/).
#### Acceptance checks
- A selected capability names what kube-apiserver handles and what calls another component.
- `/scale`, `/status`, `/log` and `/exec` are subresource paths, not full-object CRUD shorthand.

### Visual 11 — Kubernetes in one picture

#### Purpose
Turn many flows into one reusable coordination rule and production practice.
#### Learner question
“Why not let every component directly command every other component?”
#### Persistent scenario state
`web` is 3 desired/3 ready; intent, shared state, decisions, execution and reported reality are visible at once.
#### Concepts and actors
Hypothetical N×N direct coupling, common API object model, policy boundary, controllers/scheduler/kubelet scopes, status return.
#### Composition
First a crossed-out thin web of hypothetical direct links, then the canonical API map with four flat rails: Intent → API state → independent loops → node reality → Status back to API. A final operational loop sits below: check API availability/latency and audit, inspect object spec/status and watch health, inspect component/Node Leases, verify service/storage dataplane, rehearse fault recovery. The final map reuses the opening geography.
#### Interaction
One step transformation reveals the clean map; `Show objects` expands a compact grouped resource inventory. Motion changes only the affected edges and stops after a few seconds; a static still state carries the same point.
#### Data or content states
Deployment, ReplicaSet, Pods, Node, Lease, Service, EndpointSlice, PVC/PV, HPA, RoleBinding and custom resource groups.
#### Failure or edge state
The direct-coupling hypothetical is explicitly labelled `NOT KUBERNETES NORMAL COORDINATION`; exceptions remain available in Visuals 7 and 10.
#### Required copy
“Kubernetes is a distributed system of reconciliation loops centered around a shared, versioned API.”
#### Accuracy caveats
The API model coordinates Kubernetes state; it does not replace runtime, networking or storage systems and does not imply literal every network call passes through API server.
#### Mobile behavior
Four rails stack; the complete map remains a panning option, not the only explanation.
#### Accessibility
Transformation steps are manual buttons; the final relationship is text in the same reading order.
#### Source anchors
[Kubernetes architecture](https://kubernetes.io/docs/concepts/architecture/), [components](https://kubernetes.io/docs/concepts/overview/components/).
#### Acceptance checks
- The ending allows the reader to state: controller changes API state, scheduler records placement, kubelet observes assigned Pod and reports status.
- A concise operational check loop follows the architectural payoff.

## Deep links, prototype, integration and page-level acceptance

The public route is `/kubernetes-api-server`; major view fragments are `#exchange`, `#request-gates`, `#watch`, `#spec-status`, `#flow-lab`, `#conversations`, `#control-data`, `#failures`, `#ha-state`, `#responsibilities`, and `#one-picture`. No earlier public aliases exist. The `flow=` query parameter selects one of 23 scenario IDs inside `#flow-lab`; direct link, refresh, Back and Forward reopen its group and restore flow selection. Without JavaScript, all eleven view figures/explanations, every flow summary, the failure-preset explanation, index and sources remain in the same console.

The self-contained `kubernetes-api-server-visual-prototype.html` contains the full grouped index, canonical map, representative content for eleven views, working Deployment/gate/fault hero traces, a read/write denial, data-plane contrast, sources and 320 px stack. It stays under `guide/topics/`, outside routing/catalogue/search. Production integration completed on 2026-09-16 using the canonical `src/content/topics/kubernetes-api-server.mdx`, `src/pages/kubernetes-api-server.astro`, neutral `TopicConsoleShell.astro`, composable `src/components/k8s/api-server/` topic modules, shared tokens and `src/styles/api-server-console.css`. Browser visual QA remains pending and is recorded below rather than treated as passed.

Page acceptance: all 23 flows and 11 faults have named stage/state data; gate outcomes stop at the right boundary; all 20 technical-accuracy rules in the locked brief are preserved; responsive/no-JavaScript/keyboard/reduced-motion/direct-link/history behavior is inspectable; catalogue metadata, primary sources, publish/review dates, and related published routes resolve; `npm run check`, `npm run build`, `npm run check:graph`, and `npm run check:links` pass. Browser review at 320 px, 200% zoom, desktop and touch must be recorded rather than inferred from CSS. A published page stays migration-incomplete in the checklist until that QA is run.

Verification record, 2026-09-16: `npm run check` completed with zero diagnostics; the production build generated 31 routes and Pagefind indexed 36 pages; graph and internal-link checks passed. Structural assertions confirmed 11 unique view fragments and index links, 11 map instances, 23 unique flows with 115 named stages, 11 faults with 46 named stages, 11 gate presets, nine actor-filter controls, seven explicit misconception corrections, 11 specification contracts, and a prototype with no remaining `/_astro/` asset dependency. A 1366 × 768 Firefox headless capture of the self-contained prototype crashed before producing a screenshot, even with a dedicated profile, software rendering and the content sandbox disabled. Browser visual, interaction, zoom and touch QA therefore remain pending.

Deep-dive handoffs link only published targets: Kubernetes Services for EndpointSlice/traffic details, Kubernetes Networking for CNI/node paths, and Gateway/Ingress for attachment/route ownership. Future API audit policy, scheduler plugins, CSI topology, watch-cache implementation, APF tuning and provider-specific controllers deserve separate canonical pages because each would interrupt the API-centered mental model; proposed links appear only after their targets exist.

## Source index

- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/)
- [Cluster architecture](https://kubernetes.io/docs/concepts/architecture/)
- [Node/control-plane communication](https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/)
- [API concepts, LIST/WATCH, resourceVersion and subresources](https://kubernetes.io/docs/reference/using-api/api-concepts)
- [Authentication](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)
- [Authorization](https://kubernetes.io/docs/reference/access-authn-authz/authorization/)
- [Admission controllers and phases](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Node heartbeats](https://kubernetes.io/docs/concepts/architecture/nodes/)
- [Leases](https://kubernetes.io/docs/concepts/architecture/leases/)
- [EndpointSlices](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/)
- [CSI external provisioner](https://kubernetes-csi.github.io/docs/external-provisioner.html)
- [StorageClass volume binding](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [ServiceAccounts](https://kubernetes.io/docs/concepts/security/service-accounts/)
- [API aggregation](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/)
- [API Priority and Fairness](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/)
- [Auditing](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/)
