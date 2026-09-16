# Kubernetes API Server — Every Conversation Goes Through the API

**Status:** Locked visual specification  
**Visual type:** Interactive explainer / animated architecture simulator  
**Primary topic:** Kubernetes API Server  
**Secondary topics:** Controllers, scheduler, kubelet, etcd, WATCH, reconciliation, admission, RBAC, Services, storage, autoscaling, operators, cloud controllers, node lifecycle  
**Target audience:** Beginner → intermediate → advanced Kubernetes learner  
**Primary objective:** Build a durable mental model of Kubernetes as a collection of API-driven reconciliation loops coordinated through shared state.

---

# 1. Core teaching thesis

The entire experience must teach one central idea:

> Kubernetes components usually do not directly command one another. They observe and modify Kubernetes API objects through the API server, and other components react to those state changes.

The learner should stop imagining Kubernetes like this:

```text
Deployment Controller
        │
        ├──── tells Scheduler what to do
        │
        ├──── tells Kubelet what to run
        │
        └──── tells etcd what to store
```

and start imagining:

```text
               Kubernetes API
                      ▲
          ┌───────────┼───────────┐
          │           │           │
     Controllers   Scheduler   Kubelet
          │           │           │
          └───────────┼───────────┘
                      │
                shared state
```

The API server is therefore not merely:

> "The REST endpoint used by kubectl."

It is:

> **The cluster's central state gateway, coordination hub, policy enforcement point and shared API surface.**

Kubernetes documents this architecture as a hub-and-spoke API model; node-side Kubernetes API usage terminates at the API server.

---

# 2. Mental-model terminology

Avoid saying:

> "The API server is the Kubernetes brain."

That analogy is useful initially but technically incomplete.

Use this visual model instead:

| Component | Mental model |
|---|---|
| kube-apiserver | Central exchange / nervous system / state gateway |
| etcd | Durable cluster memory |
| Controllers | Reconciliation / decision engines |
| Scheduler | Placement decision engine |
| kubelet | Node execution agent |
| Container runtime | Container execution engine |
| kube-proxy / networking dataplane | Service traffic implementation |
| CSI | Storage integration |
| Cloud controllers | Cloud infrastructure integration |

The visual may initially ask:

> **"Where is Kubernetes' brain?"**

Then progressively reveal that Kubernetes does not have one monolithic brain.

Instead:

```text
MEMORY         = etcd

DECISIONS      = controllers + scheduler

COORDINATION   = API server

EXECUTION      = kubelet + runtime
```

---

# 3. Page title

Primary:

# Every Conversation Goes Through the Kubernetes API

Subtitle:

> See how controllers, scheduler, kubelets, nodes, networking, storage and applications coordinate without directly commanding one another.

Alternative short title for navigation:

**The API Server**

---

# 4. Learning outcomes

By the end, a learner should confidently understand:

1. Why the API server sits at the center of Kubernetes architecture.
2. Why kubectl is only one Kubernetes API client.
3. Why controllers normally do not directly call kubelets.
4. Why the scheduler normally does not directly tell a kubelet to run a Pod.
5. Why most Kubernetes components do not directly access etcd.
6. How LIST/WATCH enables reactive Kubernetes controllers.
7. How desired and observed state travel through the API.
8. How a Deployment eventually results in containers running.
9. How kubelets report actual state back.
10. How node heartbeats and Leases work.
11. How node failure triggers control-plane reactions.
12. How Services become EndpointSlices and dataplane rules.
13. How storage provisioning crosses API, CSI and kubelet boundaries.
14. How HPA changes desired state rather than directly creating Pods.
15. How Operators use exactly the same architectural pattern.
16. How ServiceAccounts allow workloads to become API clients.
17. Where Authentication, Authorization and Admission occur.
18. Why GET/LIST/WATCH differ from resource-modifying requests.
19. Which paths are exceptions to the normal "client → API server" pattern.
20. What happens when the API server becomes unavailable.
21. Why production clusters can run multiple API servers.
22. Why WATCH does not imply every event is fetched directly from etcd.
23. How shared informer/local caches reduce API pressure.
24. Why Kubernetes is fundamentally an API-driven control-loop system.

---

# 5. Overall visual architecture

Do NOT build the page as twenty independent architecture diagrams.

There must be **one canonical cluster topology** reused throughout the experience.

Every scenario activates, deactivates or animates portions of this same map.

Canonical topology:

```text
                         OUTSIDE CLUSTER

             Human / CI / GitOps / Automation
          kubectl  Helm  Terraform  Argo  SDK
                         │
                         ▼

                  CONTROL PLANE

                ┌─────────────────┐
                │                 │
                │   API SERVER    │
                │                 │
                └───────┬─────────┘
                        │
            ┌───────────┼───────────────┐
            │           │               │
            ▼           ▼               ▼
      Controller     Scheduler         etcd
       Manager

                        │
────────────────────────┼──────────────────────────
                        │
                    WORKER NODES
                        │
              ┌─────────┴─────────┐
              │                   │
          Node A                Node B

          kubelet               kubelet
          kube-proxy            kube-proxy
          CSI node              CSI node
          CNI                   CNI
             │                     │
             ▼                     ▼
          runtime               runtime
             │                     │
             ▼                     ▼
           Pods                  Pods
```

As advanced systems are enabled, add:

```text
Admission webhooks
Aggregated API servers
Metrics Server
Cloud Controller
CSI Controller
Operators
Ingress/Gateway controllers
Custom controllers
External cloud APIs
External storage APIs
```

---

# 6. Permanent rule of the visualization

The learner must be able to keep the same mental geography throughout the entire page.

Positions should remain largely stable:

**Top:** Human / automation clients  
**Center:** API server  
**Behind API server:** etcd  
**Left control-plane side:** controllers  
**Right control-plane side:** scheduler  
**Bottom:** worker nodes  
**Inside workers:** kubelet/runtime/network/storage agents  
**Far right:** external APIs/providers  
**API-server perimeter:** admission/auth/policy machinery

Components may zoom or expand, but should return to their canonical location.

---

# 7. Visual language for conversations

Every communication arrow must encode its semantics.

Use both line style and textual tag so meaning never depends only on color.

### API request

```text
──────────────►
CREATE
```

### API update / patch

```text
──────────────►
PATCH
```

### LIST/WATCH relationship

```text
- - - - - - -►
WATCH
```

### Watch event returning toward client

```text
◄············
MODIFIED Pod
```

### Status report

```text
──────────────►
STATUS
```

### External call

```text
══════════════►
Cloud / CSI / Webhook
```

### Rejected request

Arrow stops at gate:

```text
──────► [ AUTHZ ] X
          403
```

---

# 8. Core interaction modes

Persistent mode selector:

```text
[ Explore ]
[ Play a Flow ]
[ Request Gates ]
[ Fail Something ]
[ Advanced ]
```

## Explore

Click any component.

Show:

- what it is;
- what it watches;
- what it reads;
- what it writes;
- what calls it;
- what it directly calls;
- what it normally does NOT communicate with.

## Play a Flow

Select one end-to-end Kubernetes scenario.

Everything unrelated dims.

The selected scenario animates one step at a time.

## Request Gates

Zoom inside kube-apiserver request processing.

## Fail Something

Interactive failure simulator.

## Advanced

Expose LIST/WATCH internals, informers, API aggregation, watch cache, API Priority and Fairness, leader election, API HA, encryption, audit and other deeper concepts.

---

# 9. Hero experience — "Who talks to the API server?"

Start nearly empty.

Center:

```text
        ┌────────────────────┐
        │   KUBE-APISERVER   │
        └────────────────────┘
```

Prompt:

> Who actually talks to this?

One by one reveal:

```text
kubectl
Helm
Terraform
GitOps controller
Dashboard
SDK/application
Scheduler
Controller Manager
Cloud Controller
Kubelet
kube-proxy
CSI controllers
Operators
Admission webhooks
Pods using ServiceAccounts
```

Arrows converge on API server.

Then reveal etcd **behind** API server.

```text
           all clients
               │
               ▼
        ┌──────────────┐
        │  API SERVER  │
        └───────┬──────┘
                │
                ▼
              etcd
```

Show prominently:

> **Clients interact with Kubernetes state through the API server.**

Do NOT draw clients directly communicating with etcd.

---

# 10. Misconception breaker — kubectl

Start with oversized:

```text
kubectl
```

Caption:

> "kubectl controls Kubernetes."

Then shrink kubectl and reveal:

```text
 kubectl
 Helm
 Argo CD
 Terraform
 Scheduler
 Controllers
 kubelet
 Operators
 Applications
 SDKs
      │
      ▼
 Kubernetes API
```

Final copy:

> **kubectl is only one Kubernetes API client.**

---

# 11. Misconception breaker — controllers don't command kubelets

Show learner's likely model:

```text
Controller
    │
    │ START POD
    ▼
Kubelet
```

Stamp:

**Not the normal coordination model**

Transform into:

```text
Controller
    │
    │ CREATE Pod
    ▼
API Server
    │
    ▼
shared state

Kubelet
    │
    │ LIST/WATCH assigned Pods
    ▼
API Server
```

Then highlight:

> One component changes state. Another observes the state and reacts.

This should become the philosophical center of the visual.

---

# 12. API request gauntlet

Clicking the API server enters an exploded view.

Simplified teaching path:

```text
CLIENT
  │
  ▼
TLS / HTTPS
  │
  ▼
API routing
  │
  ▼
AUTHENTICATION
"Who are you?"
  │
  ▼
AUTHORIZATION
"Can you perform this action?"
  │
  ▼
ADMISSION
"Should this object be modified or rejected?"
  │
  ▼
Resource processing / validation
  │
  ▼
Persistence
  │
  ▼
etcd
```

Important annotation:

> This is a **teaching pipeline**, not a literal representation of every internal function call in kube-apiserver.

The guaranteed conceptual ordering to emphasize is:

```text
Authentication
      ↓
Authorization
      ↓
Admission for applicable requests
      ↓
Persistence
```

Admission intercepts resource-changing requests after authentication and authorization and before persistence. Ordinary GET/LIST/WATCH reads bypass admission.

---

# 13. Authentication gate

Animation:

```text
Request
Authorization: Bearer ...
      │
      ▼
┌────────────────┐
│ AUTHENTICATION │
│ Who are you?   │
└────────────────┘
```

Possible identity sources displayed as expandable examples:

```text
Client certificate
ServiceAccount token
OIDC/JWT
Authentication webhook
Authenticating proxy
```

Success:

```text
username
UID
groups
extra attributes
```

Failure:

```text
401 Unauthorized
```

Teaching message:

> Authentication establishes identity. It does not decide what that identity may do.

---

# 14. Authorization gate

Animation input:

```text
user      = alice
verb      = create
resource  = deployments
namespace = production
```

Then:

```text
         AUTHORIZATION
              │
       ┌──────┼──────┐
       │             │
      RBAC       other configured
                 authorizers
```

Success:

```text
ALLOW
```

Failure:

```text
403 Forbidden
```

Teaching message:

> Authorization asks whether the authenticated identity may perform this specific operation.

---

# 15. Admission stage

Split visually into:

```text
MUTATING
    ↓
VALIDATING
```

### Mutating

Possible outcome:

```text
incoming Pod
     ↓
mutation
     ↓
modified Pod
```

### Validating

Possible outcome:

```text
ALLOW
```

or:

```text
DENY
```

Examples may include:

```text
PodSecurity
ResourceQuota
ValidatingAdmissionPolicy
MutatingAdmissionWebhook
ValidatingAdmissionWebhook
```

Do not make admission synonymous with webhooks.

Teach:

> Admission includes built-in controllers, policies and optional webhook extensions.

---

# 16. Read versus write toggle

Persistent toggle inside API-server view:

```text
[ READ ]    [ WRITE ]
```

### READ example

```text
kubectl get pods
        │
        ▼
Authentication
        │
Authorization
        │
        ▼
API response
```

Banner:

> GET, LIST and WATCH do not pass through normal admission control.

### WRITE example

```text
kubectl apply
      │
      ▼
Authentication
      │
Authorization
      │
Admission
      │
Resource processing
      │
Persistence
```

Admission controls resource-changing requests and cannot block ordinary GET/LIST/WATCH requests.

---

# 17. Failure selector for request processing

Provide presets:

```text
Bad certificate/token
RBAC denied
Namespace missing
Quota exceeded
PodSecurity violation
Webhook denied
Webhook timeout
Malformed object
Conflict / stale resourceVersion
API overload
```

For each scenario:

1. Animate request.
2. Stop at the exact conceptual stage.
3. Show response.
4. Explain what never happened afterward.

Example:

```text
Authentication ✓
Authorization  X

403 Forbidden

Admission: NOT REACHED
Persistence: NOT REACHED
etcd: unchanged
```

This is crucial.

The learner must visually understand that denied requests do not continue deeper.

---

# 18. WATCH must receive a dedicated visual

Title:

# Kubernetes Reacts Instead of Constantly Asking

Start with polling misconception:

```text
Controller → API → anything changed?
Controller → API → anything changed?
Controller → API → anything changed?
Controller → API → anything changed?
```

Fade it.

Replace with:

```text
Controller
     │
     │ LIST initial state
     ▼
API Server

Controller
     │
     │ WATCH from resourceVersion
     ▼
API Server
     │
     ├···· ADDED
     ├···· MODIFIED
     └···· DELETED
```

Explain:

> Kubernetes controllers usually obtain state and then maintain a watch for subsequent changes.

---

# 19. Advanced WATCH layer — informer/cache mental model

This is hidden initially.

Toggle:

**Show client internals**

Transform controller into:

```text
                 CONTROLLER PROCESS

API Server
    │
    │ LIST / WATCH
    ▼
Reflector
    │
    ▼
Local cache / informer
    │
    ▼
Event handlers
    │
    ▼
Work queue
    │
    ▼
Reconcile()
```

Core teaching point:

> A controller does not need to perform an API GET for every logical decision.

It can reconcile largely from cached state and issue writes when changes are required.

This advanced section is important for understanding:

- controller scalability;
- API pressure;
- resync;
- eventual consistency;
- resourceVersion;
- work queues;
- why WATCH matters so much.

---

# 20. API-server watch cache

Advanced toggle:

**Show server internals**

Between clients and etcd reveal:

```text
Clients
   │
   ▼
API Server
   │
   ├── API handlers
   ├── watch cache
   ├── policy layers
   └── storage interface
             │
             ▼
            etcd
```

Critical warning:

> Do not visualize every GET/LIST/WATCH event as a physical etcd request.

The API server has a watch cache for Kubernetes resources; etcd remains durable backing state, but API-serving behavior includes server-side caching.

---

# 21. Flow selector

The canonical cluster map provides the following scenarios:

```text
01  Create a Deployment
02  Schedule a Pod
03  Start a Pod on a Node
04  Pod Status Reporting
05  Node Joins Cluster
06  Node Heartbeat
07  Node Failure
08  Service + EndpointSlice
09  kube-proxy Programming
10  ConfigMap / Secret
11  ServiceAccount API Call
12  Horizontal Pod Autoscaler
13  PersistentVolume / CSI
14  Service type LoadBalancer
15  Ingress / Gateway Controller
16  Operator / CRD
17  Admission Webhook
18  kubectl logs
19  kubectl exec / attach / port-forward
20  Leader Election
21  API Aggregation / Metrics API
22  API Server Failure
23  HA API Servers
```

The same map must be reused for every flow.

---

# 22. FLOW 01 — Create a Deployment

This is the hero sequence.

Initial action:

```bash
kubectl apply -f deployment.yaml
```

Assume:

```yaml
replicas: 3
```

## Step 1

```text
kubectl
   │
   │ CREATE/PATCH Deployment
   ▼
API Server
```

Run request through gates.

## Step 2

Persist accepted Deployment.

```text
API Server
    │
    ▼
durable state
```

etcd now contains the desired Deployment state.

Display:

```text
Deployment
desired replicas = 3
```

Important message:

> No application containers are necessarily running yet.

## Step 3

Deployment controller observes Deployment.

```text
Deployment Controller
      │
      │ LIST/WATCH
      ▼
API Server
```

## Step 4

Deployment controller creates or updates ReplicaSet.

```text
Deployment Controller
      │
      │ CREATE ReplicaSet
      ▼
API Server
```

## Step 5

ReplicaSet controller observes:

```text
desired Pods = 3
existing     = 0
difference   = +3
```

## Step 6

ReplicaSet controller creates Pods:

```text
Pod A
Pod B
Pod C
```

through API server.

## Step 7

Scheduler observes unscheduled Pods.

## Step 8

Scheduler selects nodes.

## Step 9

Scheduler records bindings through API.

## Step 10

Each relevant kubelet observes assigned Pods.

## Step 11

Kubelet drives runtime.

## Step 12

Containers start.

## Step 13

Kubelet reports Pod status.

## Step 14

Controllers observe updated actual state.

Final:

```text
Deployment desired = 3

Pod A Running
Pod B Running
Pod C Running

available = 3
```

Hero message:

> **No single component performed this entire workflow. Kubernetes emerged from multiple independent reconciliation loops communicating through API state.**

---

# 23. FLOW 02 — Scheduling

Start:

```text
Pod
spec.nodeName = <unset>
```

Scheduler watches candidate Pods.

```text
Scheduler
    │
    │ LIST/WATCH Pods
    ▼
API Server
```

Scheduler also has cached information about:

```text
Nodes
taints
labels
resources
affinity
topology
storage constraints
other scheduling inputs
```

Then show:

```text
Filter
  ↓
Score
  ↓
Choose Node
```

Example:

```text
Pod A → Node 3
```

Then:

```text
Scheduler
    │
    │ Bind
    ▼
API Server
```

Result:

```text
Pod A
nodeName: node-3
```

Most important message:

> **Scheduler chooses a node. It does not start the container.**

---

# 24. FLOW 03 — Kubelet sees an assigned Pod

Node 3:

```text
kubelet
   │
   │ LIST/WATCH
   ▼
API Server
```

Relevant Pod becomes visible:

```text
Pod A
nodeName = node-3
```

Kubelet reconciliation begins:

```text
PodSpec
   │
   ▼
kubelet
   │
   ├── container runtime
   ├── CNI
   ├── CSI
   ├── Secrets / ConfigMaps
   └── probes
```

Then:

```text
CRI
 ↓
containerd / CRI-O
 ↓
container
```

Teaching message:

> **The kubelet converts assigned desired Pod state into node-local reality.**

---

# 25. FLOW 04 — Actual state returns

Animate opposite conceptual direction:

```text
container/runtime state
         │
         ▼
       kubelet
         │
         │ UPDATE status
         ▼
     API Server
```

Pod status becomes:

```text
phase: Running

conditions:
  Ready: true
```

Controllers can then observe this updated status.

Build circular animation:

```text
Desired state
     ↓
API
     ↓
Node execution
     ↓
Observed status
     ↓
API
     ↓
Controllers
     ↓
Compare desired vs actual
     ↺
```

This loop must visually communicate **reconciliation**.

---

# 26. FLOW 05 — Node joins

Animate:

```text
new worker
    │
    ▼
 kubelet
    │
    │ register/create Node
    ▼
API Server
    │
    ▼
 Node object
```

Node includes conceptual information such as:

```text
name
addresses
capacity
allocatable
conditions
node info
labels
```

Controllers and scheduler can now observe that Node.

---

# 27. FLOW 06 — Node heartbeat

Show two related mechanisms:

```text
kubelet
   │
   ├── Node.status updates
   │
   └── Lease renewals
           │
           ▼
       API Server
```

Each Node has a corresponding Lease in:

```text
kube-node-lease
```

Animate:

```text
renewTime
12:00:00
12:00:10
12:00:20
12:00:30
```

Kubernetes uses both Node status updates and Lease objects for heartbeats; Leases provide a lightweight heartbeat mechanism.

---

# 28. FLOW 07 — Node failure

Start healthy:

```text
Node 2

Lease ✓
Lease ✓
Lease ✓
```

Simulate power loss.

```text
Node 2 X

Lease ...
Lease ...
Lease ...
```

Control-plane node lifecycle logic observes missing heartbeats.

Then progressively show:

```text
Node Ready
     ↓
Unknown / False
     ↓
taint / lifecycle handling
     ↓
affected Pods
     ↓
replacement / eviction behavior
```

Do not simplify this to:

> "Node misses one heartbeat and Kubernetes instantly recreates every Pod."

Explicitly show time and lifecycle behavior.

For Deployment-managed workload:

```text
desired replicas = 3
available replicas falls
        │
        ▼
control loops react
        │
        ▼
replacement Pod
        │
        ▼
scheduler
        │
        ▼
healthy Node
```

---

# 29. FLOW 08 — Service and EndpointSlice

Objects:

```text
Service: web
selector:
  app=web
```

Pods:

```text
10.1.0.5
10.1.0.8
10.1.0.9
```

EndpointSlice controller:

```text
EndpointSlice Controller
          │
          │ observes Services + Pods
          ▼
      API Server
```

Writes:

```text
EndpointSlice
  10.1.0.5
  10.1.0.8
  10.1.0.9
```

EndpointSlices are normally created by the control plane for selector-based Services and act as the source of truth used by kube-proxy for backend routing.

---

# 30. FLOW 09 — kube-proxy

For each node:

```text
kube-proxy
    │
    │ WATCH
    ▼
API Server
```

Resources:

```text
Services
EndpointSlices
```

Then:

```text
kube-proxy
    │
    ▼
node service dataplane
```

Implementation can visually offer:

```text
iptables
nftables
IPVS / legacy context
```

Also provide:

**Modern alternative**

```text
eBPF / other kube-proxy replacement
```

Avoid teaching kube-proxy as mandatory in every possible Kubernetes implementation.

Kubernetes documents kube-proxy as watching Services and EndpointSlices and synchronizing node forwarding state accordingly.

---

# 31. FLOW 10 — ConfigMaps and Secrets

Start:

```text
PodSpec
  references:
    ConfigMap
    Secret
```

Kubelet obtains required API objects through the API server.

```text
kubelet
   │
   ▼
API Server
   │
   ▼
ConfigMap / Secret
```

Then materialization:

```text
API object
    ↓
kubelet
    ↓
volume / projected data / environment setup
    ↓
container
```

Add nuance:

**Environment variable**

```text
value captured when container starts
```

**Mounted/projected data**

```text
can be updated according to kubelet/projected-volume behavior
```

Do not imply every Secret is permanently copied into arbitrary node files.

---

# 32. FLOW 11 — Pod calling Kubernetes API

Show workload:

```text
Pod
 │
 ├── ServiceAccount identity
 │
 └── projected token
        │
        ▼
Kubernetes API Service
        │
        ▼
API Server
```

Then replay exact gates:

```text
Authentication
Authorization
Admission if applicable
```

Teaching message:

> **Pods can themselves be Kubernetes API clients.**

This connects ServiceAccounts directly to API architecture.

---

# 33. FLOW 12 — HPA

Show:

```text
Metrics source
      │
      ▼
Metrics API
      │
      ▼
HPA Controller
```

Then:

```text
Current CPU = high
Current replicas = 3
Desired replicas = 8
```

HPA does NOT directly create Pods.

Instead:

```text
HPA Controller
      │
      │ update scale
      ▼
API Server
      │
      ▼
Deployment scale
3 → 8
```

Then normal reconciliation takes over:

```text
Deployment
   ↓
ReplicaSet
   ↓
Pods
   ↓
Scheduler
   ↓
Kubelets
```

HPA operates against the target resource's `scale` subresource based on observed metrics.

---

# 34. FLOW 13 — Persistent storage / CSI

Provide two modes:

```text
Dynamic Provisioning
Existing PV
```

Hero uses dynamic provisioning.

Start:

```text
PVC
 │
 ▼
API Server
```

CSI external provisioner watches relevant PVCs.

```text
external-provisioner
        │
        │ WATCH PVC
        ▼
    API Server
```

Then:

```text
external-provisioner
        │
        ▼
CSI controller
        │
        ▼
Storage provider
```

Example external providers can be generic:

```text
cloud block storage
SAN
distributed storage
```

Then Kubernetes objects update:

```text
PersistentVolume
PVC binding
VolumeAttachment where relevant
```

Later:

```text
scheduled Pod
     │
     ▼
kubelet
     │
     ▼
CSI node plugin
     │
     ▼
stage / publish / mount
     │
     ▼
container
```

Advanced branch:

**WaitForFirstConsumer**

Explain that storage topology can require scheduling context before dynamic provisioning completes.

CSI volumes can be referenced through PVCs and the CSI workflow includes controller- and node-side operations for provisioning, attaching and mounting.

---

# 35. FLOW 14 — Service type LoadBalancer

Generic flow:

```text
Service
type: LoadBalancer
       │
       ▼
API Server
```

Provider-specific cloud controller observes it.

```text
Cloud / provider controller
          │
          │ WATCH
          ▼
      API Server
```

Then external call:

```text
controller
    │
    ▼
Cloud API
    │
    ▼
Load Balancer
```

Status eventually returns:

```text
cloud
  ↓
controller
  ↓
API Server
  ↓
Service.status
```

Display:

> Kubernetes declares desired cloud-facing state; a controller translates that state into provider API calls.

Keep implementation cloud-neutral in the base visual.

Allow optional examples:

```text
AWS
Azure
GCP
```

---

# 36. FLOW 15 — Ingress / Gateway controller

Objects:

```text
Ingress
or
Gateway / HTTPRoute
```

Controller:

```text
Ingress/Gateway Controller
          │
          │ WATCH
          ▼
      API Server
```

Controller may then configure:

```text
NGINX
Envoy
cloud load balancer
other dataplane
```

This reinforces:

> A controller is an API observer + reconciler.

---

# 37. FLOW 16 — Operator / CRD

User creates:

```yaml
kind: DatabaseCluster
```

API server stores custom resource.

Operator:

```text
Operator
   │
   │ WATCH DatabaseCluster
   ▼
API Server
```

Operator reconciles by creating:

```text
StatefulSet
Service
Secret
ConfigMap
PVC
```

through API server.

Then updates:

```text
status
conditions
```

Final message:

> **An Operator uses the same controller pattern Kubernetes itself uses.**

This is the bridge to advanced Kubernetes extensibility.

---

# 38. FLOW 17 — Admission webhook

This must be visually marked as an important exception.

Normal client:

```text
kubectl
   │
   ▼
API Server
```

Inside admission stage:

```text
API Server
    │
    │ AdmissionReview
    ▼
Webhook
    │
    ├── allow
    ├── deny
    └── mutation patch
    ▼
API Server
```

Then request either continues or stops.

Show:

```text
timeout
failurePolicy
deny
mutation
```

at advanced depth.

Do not depict webhook as watching objects like a controller.

The API server actively calls the webhook during request processing.

---

# 39. FLOW 18/19 — logs, exec, attach and port-forward

This is another crucial exception.

Example:

```text
kubectl logs pod-a
       │
       ▼
API Server
       │
       ▼
kubelet HTTPS endpoint
       │
       ▼
Pod/container logs
```

Also:

```text
kubectl exec
kubectl attach
kubectl port-forward
```

Display badge:

**SPECIAL API SERVER → KUBELET PATH**

Kubernetes explicitly uses API-server-to-kubelet connections for pod logs, attach and port-forward functionality.

This prevents over-learning the incorrect rule:

> "The API server never initiates connections toward kubelets."

---

# 40. FLOW 20 — Leader election

Show two controller-manager instances:

```text
controller-manager A
controller-manager B
```

Both can reach API server.

Lease:

```text
coordination.k8s.io/Lease
```

Animation:

```text
A owns Lease
B watches / attempts renewal

A X

Lease expires

B acquires leadership
```

Repeat with scheduler replicas.

Teaching message:

> Kubernetes uses API objects themselves for distributed coordination.

Leases are used for both node heartbeats and component leader election.

---

# 41. FLOW 21 — API aggregation

Advanced scenario.

Client requests:

```text
/apis/metrics.k8s.io/...
```

Show:

```text
client
  │
  ▼
kube-apiserver
  │
  ▼
aggregated API server
  │
  ▼
metrics provider
```

Use Metrics Server as an example.

Important:

> Not every Kubernetes API is necessarily implemented directly inside kube-apiserver.

Kubernetes supports aggregated APIs; the resource metrics API is commonly served by Metrics Server through that mechanism.

---

# 42. etcd relationship

etcd must have a dedicated teaching card.

Title:

# Kubernetes' Durable Memory

Diagram:

```text
                    etcd
            ┌─────────────────┐
            │ cluster state   │
            └────────▲────────┘
                     │
                API Server
                     ▲
          ┌──────────┼──────────┐
          │          │          │
     Scheduler   Controllers   Kubelet
```

Cross out:

```text
kubectl ─────────────X────► etcd
scheduler ───────────X────► etcd
kubelet ─────────────X────► etcd
normal controller ───X────► etcd
```

Text:

> In normal Kubernetes architecture, kube-apiserver is the frontend to shared cluster state; ordinary Kubernetes clients should not treat etcd as their API.

---

# 43. Important etcd visual nuance

Do NOT imply:

```text
Controller WATCH
      ↓
API Server
      ↓
etcd
      ↓
API Server
      ↓
Controller
```

for every single event.

Instead:

```text
Controller ↔ Kubernetes API
```

and separately:

```text
API Server ↔ persistent backing state / watch cache
```

The learner needs the API abstraction, not an inaccurate internal RPC trace.

---

# 44. API server responsibility explorer

Click API Server → **What does it actually do?**

Display radial capabilities:

```text
REST API
API discovery
API versions
Authentication
Authorization
Admission
Validation
Defaulting
Conversion
Watch
Watch cache
Persistence
API aggregation
Subresources
Audit
Request priority/fairness
TLS termination
Proxy functionality
```

Do not expose all simultaneously to beginners.

Use:

```text
Fundamental
Security
State
Performance
Extensibility
Operations
```

tabs.

---

# 45. Spec versus status

Include dedicated microvisual:

```text
SPEC
"What should exist?"

STATUS
"What currently exists?"
```

Example:

```yaml
spec:
  replicas: 3
```

versus:

```yaml
status:
  replicas: 3
  readyReplicas: 2
```

Connect:

```text
User/controller writes desired state
           ↓
          spec

System observes reality
           ↓
         status
```

Then:

```text
Controller compares spec ↔ observed state
```

This concept should be reused throughout all flows.

---

# 46. Reconciliation loop visual

Canonical loop:

```text
        WATCH / EVENT
             │
             ▼
        Observe state
             │
             ▼
 Compare desired vs actual
             │
      ┌──────┴──────┐
      │             │
   Same?         Different?
      │             │
     End        Take action
                    │
                    ▼
                API write
                    │
                    ▼
                new state
                    │
                    └─────────↺
```

Use real example:

```text
Deployment wants 3
ReplicaSet sees 2
Difference = 1

CREATE one Pod
```

---

# 47. Component conversation inspector

Every arrow in the cluster map must be clickable.

Inspector format:

```text
┌────────────────────────────────────────┐
│ ReplicaSet Controller → API Server    │
├────────────────────────────────────────┤
│ Reads                                  │
│   ReplicaSets                          │
│   Pods                                 │
│                                        │
│ Watches                                │
│   ReplicaSets                          │
│   Pods                                 │
│                                        │
│ Writes                                 │
│   Pods                                 │
│   ReplicaSet status                    │
│                                        │
│ Why                                    │
│   Maintain desired replica count       │
└────────────────────────────────────────┘
```

The four mandatory fields are:

```text
READS
WATCHES
WRITES
WHY
```

Optional fifth:

```text
DIRECT EXTERNAL CALLS
```

for controllers integrating with providers.

---

# 48. Controller Manager inspector

Click:

**kube-controller-manager**

Do not describe it as one controller.

Open it into multiple conceptual controllers such as:

```text
Deployment Controller
ReplicaSet Controller
Node lifecycle/controller logic
EndpointSlice Controller
Job Controller
Namespace Controller
ServiceAccount-related controllers
PV-related control loops
HPA Controller
others
```

Caption:

> kube-controller-manager hosts many independent reconciliation loops.

Avoid trying to enumerate every controller on the initial view.

---

# 49. Kubelet inspector

Show major responsibilities:

```text
Assigned PodSpecs
       ↓
    kubelet
       │
       ├── manage Pod lifecycle
       ├── talk to CRI
       ├── invoke CNI-related workflows
       ├── invoke CSI node operations
       ├── run probes
       ├── obtain ConfigMaps/Secrets
       ├── update Pod status
       ├── update Node status
       └── renew Node Lease
```

Important message:

> kubelet is not a general-purpose cluster controller. Its primary scope is its node.

---

# 50. Scheduler inspector

Show:

```text
OBSERVES

unscheduled Pods
Nodes
resource capacity
taints/tolerations
affinity
topology
storage constraints
other scheduling data
```

Produces:

```text
Pod → Node placement decision
```

Does NOT:

```text
start container
configure application
create runtime directly
SSH into node
```

---

# 51. API server down experiment

Button:

```text
[ STOP API SERVER ]
```

Fade central API server.

Immediately show:

```text
Running container A      ✓
Running container B      ✓
Running container C      ✓
```

But:

```text
kubectl get              X
kubectl apply            X
new scheduling           impaired
controller reconciliation impaired
status propagation       impaired
new API writes           unavailable
```

Important message:

> **Existing data-plane workloads do not inherently vanish merely because the API server becomes unavailable.**

This teaches control plane versus data plane.

---

# 52. API server HA experiment

Replace one server with:

```text
             Control Plane Endpoint
                      │
              Load Balancer / VIP
                ┌─────┼─────┐
                ▼     ▼     ▼
              API1  API2  API3
                \     |     /
                 \    |    /
                    etcd
```

Animate concurrent requests reaching different API servers.

Important:

> Serving Kubernetes API requests does not depend on one active API-server leader. Multiple API-server replicas can serve clients concurrently.

Contrast with scheduler/controller-manager replicas, where leader election commonly determines the active reconciler.

---

# 53. API Server HA failure

Kill API2.

```text
API1 ✓
API2 X
API3 ✓
```

Client continues via endpoint.

Then kill enough control-plane dependencies to demonstrate degraded/unavailable behavior.

Do not oversimplify HA into:

> "Three API servers means the cluster can survive any two control-plane failures."

etcd quorum, load balancer health and other dependencies matter.

---

# 54. External systems layer

Advanced toggle:

```text
[ Show External World ]
```

Reveal:

```text
Identity provider
Admission webhook
Authorization webhook
Authentication webhook
Cloud provider API
Storage provider API
Aggregated API server
External metrics provider
```

This teaches that kube-apiserver is also a gateway into an extensible control-plane ecosystem.

---

# 55. API audit trail

Optional advanced section:

Request:

```text
alice creates Deployment
```

Alongside request flow show audit trail:

```text
RequestReceived
ResponseStarted / ResponseComplete
```

Teaching message:

> API activity is the natural observation point for many Kubernetes security and compliance questions.

Do not turn this into a full audit-policy tutorial; link to a dedicated future page if available.

---

# 56. API Priority and Fairness

Advanced-only.

Simulate:

```text
10 normal requests
10,000 runaway requests
```

Without control:

```text
API saturated
```

Then introduce API request prioritization/fairness conceptually.

Purpose:

> The API server is shared infrastructure; one noisy client should not casually dominate all control-plane request handling.

Keep this conceptual unless a separate scaling module is built.

---

# 57. API discovery and versions

Advanced microvisual:

```text
/api/v1
/apis/apps/v1
/apis/batch/v1
/apis/example.io/v1
```

Then:

```text
client
   │
   ▼
API discovery
   │
   ▼
available groups / versions / resources
```

Connect CRDs naturally:

```text
CRD installed
     ↓
new API resource appears
     ↓
clients can discover it
```

---

# 58. Subresources

Optional deep-dive tile:

```text
Pod
 ├── /status
 ├── /log
 ├── /exec
 └── /portforward

Deployment
 ├── /status
 └── /scale
```

Purpose:

Show why not every API operation maps to ordinary CRUD on a full object.

This also helps explain:

- HPA `/scale`;
- Pod status;
- logs;
- exec.

---

# 59. Direct communication exceptions panel

The page's primary teaching rule is intentionally strong, so exceptions must be explicitly captured.

Panel:

# What actually bypasses the simple mental model?

Examples:

**API server → kubelet**

For:

```text
logs
attach
port-forward
```

**API server → admission webhook**

During admission.

**API server → authentication/authorization webhook**

When configured.

**API server → aggregated API server**

For aggregated APIs.

**Controllers → external systems**

Examples:

```text
cloud controller → cloud API
CSI controller → storage API
Ingress controller → load balancer/API
Operator → external system
```

The statement to preserve is therefore:

> **Kubernetes components primarily coordinate cluster state through the Kubernetes API, but some components also make direct calls where their responsibility requires it.**

That is more accurate than "literally every network packet goes through kube-apiserver."

---

# 60. "Show only API traffic" mode

Toggle:

```text
[ API TRAFFIC ]
```

Dim:

```text
Pod-to-Pod traffic
Service application traffic
container runtime internals
storage data traffic
```

Keep:

```text
control-plane/API communication
```

This prevents another misconception:

> Application traffic does NOT normally flow through kube-apiserver.

Show:

```text
User HTTP request
     │
     X
API Server
```

and instead:

```text
Client
   ↓
Load Balancer / Service dataplane
   ↓
Pod
```

Banner:

> **API-server centrality applies to Kubernetes control/state communication, not ordinary workload network traffic.**

This distinction is mandatory.

---

# 61. "Show data plane" mode

Optional companion toggle:

```text
[ CONTROL PLANE ]
[ DATA PLANE ]
[ BOTH ]
```

### Control plane

Highlights:

```text
API Server
controllers
scheduler
etcd
kubelet control traffic
```

### Data plane

Highlights:

```text
Pods
CNI
Services
network dataplane
storage data path
```

### Both

Shows their relationship.

---

# 62. Progressive learning levels

The same page must work for three depths.

## Level 1 — Foundation

Expose only:

```text
kubectl
API server
etcd
controller
scheduler
kubelet
runtime
Pods
```

Flows:

```text
Deployment
Scheduling
Pod execution
Status
```

## Level 2 — Practitioner

Add:

```text
WATCH
Node heartbeats
EndpointSlices
kube-proxy
ConfigMaps
Secrets
HPA
CSI
ServiceAccount
```

## Level 3 — Internals

Add:

```text
informers
local cache
resourceVersion
watch cache
admission webhooks
API aggregation
leader election
HA
API Priority and Fairness
subresources
audit
external controllers
```

Never dump Level 3 into the opening visual.

---

# 63. Animation controls

Persistent bottom controls:

```text
|◀
◀
Play/Pause
▶
▶|
```

Also:

```text
Speed: 0.5×  1×  2×
```

And:

```text
Reset
Explain this step
Show YAML
Show API operation
```

Each flow must be runnable:

- automatically;
- one step at a time;
- backwards;
- reset to initial state.

---

# 64. Step timeline

For long flows such as Deployment:

```text
1 Apply
2 AuthN
3 AuthZ
4 Admission
5 Store Deployment
6 Deployment Controller
7 ReplicaSet
8 Pods
9 Scheduler
10 Binding
11 Kubelet
12 Runtime
13 Status
14 Reconciled
```

Current step highlighted.

Click any step to jump directly to it.

---

# 65. API operation overlay

Toggle:

```text
[ Show API Operations ]
```

Instead of just:

```text
Controller → API Server
```

display:

```text
WATCH Deployments
CREATE ReplicaSet
LIST Pods
CREATE Pod
BIND Pod
PATCH status
UPDATE Lease
WATCH EndpointSlices
```

This turns the visual from conceptual architecture into practical Kubernetes internals.

---

# 66. Object inspector

Whenever an object changes, allow opening its state.

Example Pod:

### Before scheduling

```yaml
spec:
  nodeName: null
```

### After scheduling

```yaml
spec:
  nodeName: worker-3
```

### After kubelet starts it

```yaml
status:
  phase: Running
```

Animations between object versions should highlight only changed fields.

---

# 67. Desired versus observed state bar

Persistent when running reconciliation flows:

```text
DESIRED                  OBSERVED

Replicas: 3              Running: 1

████████████              ████░░░░░░░░
```

As reconciliation progresses:

```text
3 desired
2 running
3 running
```

Then:

```text
CONVERGED
```

This provides an intuitive visual representation of reconciliation.

---

# 68. Failure playground

Allow learner to click:

```text
Kill Pod
Kill Node
Kill Controller
Kill Scheduler
Kill API Server
Kill one API replica
Block Admission Webhook
Break RBAC
Break etcd connectivity
Overload API
Remove kube-proxy
```

For every failure, animate:

1. What stops.
2. What continues.
3. Who detects it.
4. Which API object changes.
5. Which controller reacts.
6. Whether workload traffic is affected.
7. Whether eventual recovery is possible.

This is where the visual becomes an architecture simulator rather than a slideshow.

---

# 69. Example — kill one Pod

Initial:

```text
Deployment desired: 3

Pod A ✓
Pod B ✓
Pod C ✓
```

Kill B.

Runtime reports termination.

API status changes.

ReplicaSet reconciliation sees:

```text
desired = 3
current = 2
```

Creates Pod D.

Scheduler binds Pod D.

Kubelet starts Pod D.

Final:

```text
A ✓
C ✓
D ✓
```

Do NOT animate:

```text
Deployment Controller → Node → restart Pod
```

---

# 70. Example — controller-manager unavailable

Show:

```text
Existing Pods: still running
API Server: available
kubectl get: available
new objects can potentially be accepted
```

But reconciliation driven by affected controllers stops.

This visually distinguishes:

```text
state storage
API availability
reconciliation
execution
```

as separate concepts.

---

# 71. Hover labels

Every major component must have one-sentence hover text.

Examples:

**API Server**

> Serves the Kubernetes API and mediates access to shared cluster state.

**etcd**

> Durable distributed key-value store backing Kubernetes cluster state.

**Scheduler**

> Selects Nodes for Pods that need placement.

**Controller Manager**

> Runs multiple control loops that move actual state toward desired state.

**Kubelet**

> Reconciles assigned PodSpecs into running node-local workloads.

**kube-proxy**

> Implements Service forwarding on Nodes in clusters that use it.

---

# 72. Microcopy rules

Prefer:

> "Scheduler records its placement decision through the API."

Avoid:

> "Scheduler tells kubelet to run the Pod."

Prefer:

> "Kubelet observes Pods assigned to its Node."

Avoid:

> "API server sends Pods to kubelet."

Prefer:

> "Controller reconciles desired and observed state."

Avoid:

> "Controller continuously scans everything."

Prefer:

> "etcd backs Kubernetes API state."

Avoid:

> "All API reads always go directly to etcd."

Prefer:

> "Most Kubernetes component coordination occurs through API objects."

Avoid:

> "Absolutely all Kubernetes communication flows through API server."

---

# 73. Required misconception cards

The following must appear somewhere in the experience.

```text
MYTH:
kubectl is Kubernetes.

REALITY:
kubectl is one API client.
```

```text
MYTH:
Scheduler starts Pods.

REALITY:
Scheduler selects Nodes.
Kubelet executes assigned PodSpecs.
```

```text
MYTH:
Controllers tell kubelets what to do.

REALITY:
They usually coordinate indirectly through API state.
```

```text
MYTH:
Every component talks directly to etcd.

REALITY:
Kubernetes clients use the API server.
```

```text
MYTH:
WATCH means controllers hammer etcd continuously.

REALITY:
API watches, server caches and client-side caches form a more efficient event-driven system.
```

```text
MYTH:
All network traffic flows through the API server.

REALITY:
Application data-plane traffic normally does not.
```

```text
MYTH:
If API server dies, every running container instantly dies.

REALITY:
Existing node workloads can continue while control-plane coordination is impaired.
```

---

# 74. Visual hierarchy

The API server should always be the visual anchor.

Do not make it comically larger than every component, but it should be unmistakably central.

etcd should appear:

```text
behind / below API server
```

rather than as an equal-purpose peer.

Worker nodes should remain visibly separate from the control plane.

Controllers should visually look like **observers/reconcilers**, not imperative orchestrators.

---

# 75. Motion design

Animations should encode architecture.

When a request moves:

```text
client → API server
```

the object/request token visibly moves.

When a WATCH exists:

the line remains connected.

When state changes:

a small event token travels back over the WATCH relationship.

When a controller reconciles:

show:

```text
Observe
Compare
Act
```

in three small phases.

When persistence occurs:

do not animate the whole object physically living inside etcd forever.

A short "state committed" pulse is enough.

---

# 76. Avoid animation noise

Do not continuously animate:

- heartbeats;
- all watches;
- all Pod status;
- every controller;
- network packets;

simultaneously.

Inactive communication becomes muted static lines.

Only current flow pulses.

The learner should always know:

> "What should I be looking at right now?"

---

# 77. Flow color/shape semantics

Each logical category should be visually distinguishable, but never rely solely on color.

Suggested categories:

```text
API request         solid arrow
WATCH               dashed line
watch event         dotted reverse pulse
status              solid line + STATUS badge
external provider   double line
data-plane traffic  thicker flowing line
failure             broken line / X
```

---

# 78. Object chips

Use small movable object chips:

```text
[ Deployment ]
[ ReplicaSet ]
[ Pod ]
[ Node ]
[ Lease ]
[ Service ]
[ EndpointSlice ]
[ PVC ]
[ PV ]
```

These move only where pedagogically useful.

Do not suggest Kubernetes objects are literal packets travelling permanently between components.

---

# 79. Cluster map filters

Top-right filters:

```text
[ Humans ]
[ Control Plane ]
[ Nodes ]
[ Networking ]
[ Storage ]
[ Autoscaling ]
[ Extensions ]
[ External ]
```

Selecting Networking might highlight:

```text
API Server
EndpointSlice Controller
Service
EndpointSlice
kube-proxy
CNI
Pods
```

---

# 80. "Why API Server?" finale

After completing several flows, ask:

> Why not let every component directly talk to every other component?

Transform architecture.

### Hypothetical direct coupling

```text
Controller ↔ Scheduler
Controller ↔ kubelet
Controller ↔ etcd
Scheduler ↔ kubelet
Scheduler ↔ etcd
kubelet ↔ etcd
Operators ↔ everyone
```

Display:

```text
N×N coupling
```

Then collapse into:

```text
              API
       ┌───────┼───────┐
       │       │       │
   Controller Scheduler Kubelet
```

Benefits appear:

```text
common object model
security boundary
authentication
authorization
policy
versioned APIs
watch semantics
consistent state access
extensibility
auditability
loose coupling
```

This is the final architectural payoff.

---

# 81. Final "Kubernetes in one picture"

End on:

```text
                        INTENT
                          │
              Humans / Automation
                          │
                          ▼
                ┌──────────────────┐
                │                  │
                │ KUBERNETES API   │
                │                  │
                └────────┬─────────┘
                         │
                         ▼
                       STATE
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     Controllers      Scheduler       Kubelets
          │              │              │
          │              │              ▼
          │              │          Runtime
          │              │              │
          └──────────────┴──────────────┤
                                        ▼
                                      REALITY

                        ▲
                        │
                     STATUS
                        │
                        └───────────────
```

Final statement:

> **Kubernetes is a distributed system of reconciliation loops centered around a shared, versioned API.**

Below it:

> Desired state enters through the API.  
> Controllers and schedulers react to it.  
> Kubelets turn assigned state into running workloads.  
> Reality is reported back through the API.  
> The loop continues.

---

# 82. Advanced finale — "Kubernetes is an API machine"

Click:

```text
Show all objects
```

Populate API server with:

```text
Pods
Deployments
ReplicaSets
Nodes
Leases
Services
EndpointSlices
Secrets
ConfigMaps
PVCs
PVs
Jobs
StatefulSets
DaemonSets
Ingresses
Gateways
HPAs
Roles
RoleBindings
CRDs
Custom Resources
...
```

Then display:

> Almost everything you think of as "Kubernetes" is represented through API resources plus controllers that reconcile those resources into reality.

That is the final conceptual destination.

---

# 83. Technical accuracy requirements

Implementation must obey these rules.

1. Never draw controller → kubelet as the normal Deployment orchestration path.
2. Never draw scheduler → kubelet as Pod-start instruction.
3. Never draw ordinary controllers → etcd.
4. Never draw kubectl → etcd.
5. Never imply application traffic normally traverses kube-apiserver.
6. Never say admission applies to ordinary GET/LIST/WATCH.
7. Mutating admission must appear before validating admission conceptually.
8. Do not imply every API read equals an etcd read.
9. Do not imply WATCH means periodic polling.
10. Do not imply kube-proxy is universal if alternative Service dataplanes are used.
11. API-server→kubelet special operations must be represented.
12. External controllers may call cloud/storage/provider APIs directly.
13. HPA changes desired scale; it does not directly create application containers.
14. Scheduler chooses placement; kubelet performs node execution.
15. Node heartbeat must include Lease concept.
16. etcd must be shown as backing state rather than public cluster API.
17. Multiple API servers may concurrently serve requests.
18. Scheduler/controller-manager HA should expose leader-election concept separately.
19. Admission webhook must be modeled as API-server initiated request processing.
20. Operator must be modeled using the same reconciliation pattern as built-in controllers.

---

# 84. Performance requirements

The implementation should remain smooth with all advanced components visible.

Prefer:

- SVG or DOM-based topology;
- CSS transforms for movement;
- request tokens rather than hundreds of animated particles;
- shared reusable edge definitions;
- state-driven animation rather than ad-hoc timers.

Pause animation when the page/tab is not active.

Respect:

```text
prefers-reduced-motion
```

Provide a reduced-motion mode that replaces travelling animations with step highlighting.

---

# 85. Responsive design

Desktop is primary because architecture is dense.

Desktop:

```text
canonical topology + inspector side panel
```

Tablet:

```text
topology above
inspector below
```

Mobile:

Do NOT shrink entire cluster to illegibility.

Instead:

```text
flow stepper
     ↓
focused architecture viewport
     ↓
explanation
```

Allow pan/zoom for full cluster map.

---

# 86. Accessibility

Every visual state must also have textual representation.

Keyboard:

```text
Tab components
Enter inspect
Arrow keys step flow
Space play/pause
Esc close panel
```

ARIA labels should describe:

```text
"Scheduler watches unscheduled Pods through Kubernetes API"
```

not merely:

```text
"Arrow 7"
```

Color cannot be the only state indicator.

---

# 87. Default first-run experience

Recommended sequence:

### Scene 1

Question:

> Who actually controls Kubernetes?

### Scene 2

Show kubectl.

### Scene 3

Reveal API server.

### Scene 4

Reveal every API client.

### Scene 5

Reveal etcd behind API server.

### Scene 6

Run `kubectl apply Deployment`.

### Scene 7

Deployment stops after being persisted.

Ask:

> Are three containers running now?

User selects:

```text
Yes
No
```

Correct answer:

**No**

### Scene 8

Start controller chain.

### Scene 9

Scheduler chooses Nodes.

### Scene 10

Kubelets execute.

### Scene 11

Status returns.

### Scene 12

Zoom out.

Show complete cluster conversation map.

This provides the "aha" moment before exposing menus.

---

# 88. Recommended homepage card

If linked from a larger Kubernetes visual:

Title:

**The API Server**

Tagline:

> Follow every major conversation in a Kubernetes cluster.

Mini animation:

```text
Controller ───┐
Scheduler ────┤
kubectl ──────┼──► API
Kubelet ──────┤
Operator ─────┘
```

CTA:

**Enter the cluster conversation**

---

# 89. Optional knowledge checks

Use sparingly.

Example:

> Scheduler has chosen worker-3. What happens next?

Options:

```text
A. Scheduler calls containerd
B. Scheduler SSHs to worker-3
C. Placement is recorded through the Kubernetes API
D. Scheduler writes directly to etcd
```

Correct:

**C**

Another:

> Who detects that a Deployment needs another Pod?

Correct conceptual answer:

**The relevant reconciliation controllers observing API state — not the kubelet.**

---

# 90. Completion state

When learner has explored the major flows, unlock:

# Show Everything

Canonical cluster comes alive with:

```text
WATCH relationships
status updates
Lease renewals
scheduler placement
controller reconciliation
provider integrations
Service changes
```

Run for only several seconds.

Then freeze.

Display:

> It looks complicated because Kubernetes is distributed.

Then progressively hide direct implementation details until only:

```text
              API
        ┌──────┼──────┐
        ▼      ▼      ▼
 controllers scheduler kubelets
```

Final:

> **Once you understand the API-centered coordination model, the complexity becomes a collection of repeated patterns.**

---

# 91. Definition of done

The implementation is complete only if a learner can use it to explain, without memorization:

- what kube-apiserver actually does;
- why everyone talks to it;
- why etcd sits behind it;
- how Kubernetes requests pass security/policy gates;
- how WATCH works conceptually;
- how controllers reconcile;
- how scheduler and kubelet communicate indirectly;
- how desired state becomes running containers;
- how actual state comes back;
- how node heartbeats work;
- how Services become usable dataplane state;
- how storage controllers and kubelet coordinate;
- how HPA fits into normal reconciliation;
- how Operators extend Kubernetes;
- where direct calls are legitimate exceptions;
- what continues when API server fails;
- why API-server HA exists;
- why Kubernetes architecture is fundamentally API-driven.

If the learner finishes the page still thinking:

> "The controller tells the kubelet to start a Pod"

the visual has failed.

If the learner instead thinks:

> "The controller changes desired API state, scheduler records placement, kubelet observes its assigned state and reports reality back, while independent reconciliation loops converge through the Kubernetes API"

the visual has succeeded.

---

# 92. Final locked design principle

Every major animation, tooltip, flow and interaction should reinforce this sentence:

> **Kubernetes components coordinate primarily by observing and changing shared API state.**

And every advanced feature should feel like another implementation of the same pattern:

```text
OBSERVE
   ↓
COMPARE
   ↓
ACT
   ↓
UPDATE API
   ↓
OBSERVE AGAIN
```

That repetition is the entire pedagogical advantage of this visual.

Once the learner sees that pattern, Kubernetes stops looking like dozens of unrelated components and starts looking like one coherent distributed system.