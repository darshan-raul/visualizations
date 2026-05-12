# Kubernetes Networking — Deep Dive Visualization Spec

## Overview
Interactive tab-based HTML visualization (like `oauth2-explainer.html`) covering Kubernetes networking from first principles through CoreDNS, kube-proxy, and Ingress. Single file, no build system.

## Design System
- **Colors**: `--bg: #0a0d14`, `--surface: #111520`, `--surface2: #161b28`, `--border: rgba(255,255,255,.07)`
- **Accent**: `#4f8ef7` (blue), `#22d3ee` (cyan), `#34d399` (green), `#fbbf24` (amber), `#f87171` (red), `#a78bfa` (purple)
- **Typography**: Inter (sans), JetBrains Mono (code)
- **Layout**: Tab-based navigation, max-width 1100px, 48px padding, dark theme
- **Back button**: Fixed top-left, links to `index.html`

## Tabs (12 sections)

| # | Tab Name | Content |
|---|----------|---------|
| 00 | Three IP Ranges | Node network vs pod CIDR vs service CIDR — three non-overlapping IP spaces |
| 01 | Flat Network | Pod-to-pod communication without NAT; k8s networking guarantee |
| 02 | Pod & Pause | Network namespace, shared eth0 via pause container, container crash doesn't lose IP |
| 03 | veth & Bridge | veth pairs, cni0 bridge, MAC learning, same-node packet flow |
| 04 | CNI Plugin | ADD/DEL/CHECK lifecycle, /etc/cni/net.d/, plugin types, config JSON |
| 05 | CNI IPAM | host-local (per node), node subnet allocation, IP assignment on pod create |
| 06 | Multi-Node Overlay | VXLAN encapsulation, VNI, UDP 4789, cross-node packet journey |
| 07 | kube-proxy & Services | ClusterIP virtual IP, iptables vs IPVS, proxy watches API server |
| 08 | Service IP Allocation | ClusterIP from service CIDR, no physical interface, any unallocated IP |
| 09 | Endpoints | Endpoint = IP:port backing pods, EndpointSlices (~100 per), pod death → endpoint removal |
| 10 | CoreDNS | cluster.local forward, pod FQDN, headless services, SRV records |
| 11 | Ingress | HTTP/HTTPS routing, Ingress controller, path-based vs host-based |

---

## Tab 00: Three IP Ranges

### Content
- **Intro**: Kubernetes requires three completely separate, non-overlapping IP ranges. Operators must configure all three.
- **Visual**: Diagram showing a single node with three labeled IP zones:
  - Node network: physical eth0 interface on the left, labeled "Node Network (your infrastructure)"
  - Pod CIDR: inside the node, a "Pod Network" box labeled "CNI allocates from this"
  - Service CIDR: floating above, no physical interface, labeled "Virtual IPs only — iptables/IPVS"
- **Table** of three ranges with columns: Range Name, Used For, Configured By, Example

### Table
| Range | Used For | Configured By | Example |
|-------|----------|---------------|---------|
| Node Network | Host/node IPs | Network admin / DHCP | 192.168.1.0/24 |
| Pod CIDR | Pod IP addresses | CNI plugin / kubeadm --pod-network-cidr | 10.244.0.0/16 |
| Service CIDR | Virtual ClusterIPs | kube-apiserver --service-cluster-ip-range | 10.96.0.0/12 |

### Key insight box
"Service ClusterIPs are purely virtual — no interface ever has that address. kube-proxy creates iptables/IPVS rules to redirect traffic from the virtual IP to actual backing pods."

### Warning box
"All three ranges must be non-overlapping. A pod IP must never equal a node IP or a service IP, and vice versa."

---

## Tab 01: Flat Network Model

### Content
- **Concept cards** (2x2 grid):
  1. "Every Pod Gets Its Own IP" — pods are like VMs; no port mapping needed
  2. "No NAT Between Pods" — pods can communicate directly using pod IPs
  3. "Same-Flat Network Across All Nodes" — pods on different nodes can communicate directly too (no NAT)
  4. "IP Per Container (via Pause)" — containers share the pod's network namespace

### Visual
- Two-node diagram with pods on each node
- Arrows showing pod-to-pod communication across nodes (no NAT)
- Label: `10.244.0.2 → 10.244.1.3 (no NAT)`

---

## Tab 02: Pod & Pause Container

### Content
- **Pod cutaway visual**:
  - Outer box = Pod boundary
  - "Pause container (sandbox)" box holding the network namespace
  - eth0 interface inside pause container
  - Two app containers (nginx, sidecar) sharing the pause container's eth0
  - Arrow: "All containers share eth0 from pause container's network namespace"
- **Concept cards**:
  1. "Network Namespace Held by Pause" — one netns per pod, created before app containers
  2. "Crash Isolation" — if app container crashes, pause container keeps netns alive, IP persists
  3. "Shared loopback" — all containers in a pod share lo; localhost within pod works

### Animation idea
- Show container crash and restart, pause container stays, IP unchanged

---

## Tab 03: veth & Bridge

### Content
- **Same-node packet flow visual**:
  - Pod A (10.244.0.2) with eth0 → veth pair → cni0 bridge → veth pair → Pod B (10.244.0.3)
  - Each veth shown as a "pipe" with two ends
- **Bridge MAC learning table** (shown as a small table):
  - MAC | Interface | IP
  - aa:bb:cc:dd:ee:00 | veth1 | 10.244.0.2
  - aa:bb:cc:dd:ee:01 | veth3 | 10.244.0.3
- **Concept cards**:
  1. "veth Pair = Virtual Cable" — like a pipe, one end in pod namespace, one on host
  2. "Bridge Acts Like a Switch" — learns MAC addresses, forwards frames
  3. "ARP Resolution" — bridge knows which MAC address owns which IP on its ports
- **Code snippet** showing: `ip link set vethxxx master cni0`

---

## Tab 04: CNI Plugin Interface

### Content
- **Flow diagram**: kubelet → CNI plugin → network setup
  - kubelet calls CNI ADD when pod is created
  - CNI DEL when pod is deleted
  - CNI CHECK to verify setup
- **CNI config directory**: `/etc/cni/net.d/` with example configs
- **Code block showing CNI config JSON**:
```json
{
  "cniVersion": "0.4.0",
  "name": "bridge",
  "type": "bridge",
  "bridge": "cni0",
  "isGateway": true,
  "ipMasq": true,
  "ipam": {
    "type": "host-local",
    "subnet": "10.244.0.0/16",
    "routes": [{"dst": "0.0.0.0/0"}]
  }
}
```
- **Plugin types grid** (icon cards):
  - bridge, host-device, vlan, ipvlan, macvlan, ptp, portmap, bandwidth, tuning, sbr
  - flannel, calico, cilium, weave (full CNI solutions)

---

## Tab 05: CNI IPAM

### Content
- **Cluster CIDR visual**:
  - 10.244.0.0/16 cluster CIDR split into node subnets
  - Node A: 10.244.0.0/24, Node B: 10.244.1.0/24, Node C: 10.244.2.0/24
- **IP allocation flow**:
  1. Pod scheduled to Node A
  2. Kubelet calls CNI ADD
  3. CNI IPAM (host-local) assigns next available from 10.244.0.0/24
  4. Returns IP: 10.244.0.5
- **Concept cards**:
  1. "host-local IPAM" — stores allocated IPs on node filesystem, never reuses until released
  2. "Node Subnet Pre-allocated" — each node gets its /24 when cluster is initialized
  3. "No IP Conflicts" — CNI tracks which IPs are in use per node

---

## Tab 06: Multi-Node Overlay

### Content
- **Packet journey visual** (Node A pod → Node B pod):
  1. Pod A sends to 10.244.1.3 (Pod B IP)
  2. Route table: not local → forward to gateway (cni0)
  3. Bridge forwards to veth → host routing
  4. Host routing sees 10.244.1.3 isn't local subnet
  5. Tunnel endpoint (VXLAN VTEP) encapsulates: outer src=NodeA IP, outer dst=NodeB IP
  6. Packet sent over physical network (UDP 4789)
  7. Node B receives, VXLAN decapsulates, delivers to Pod B
- **VXLAN header diagram**: show VNI field (24-bit, supports 16M virtual networks)
- **Comparison**:
  - flannel (host-gw mode): direct routing, no encapsulation (requires layer 2 adjency)
  - flannel (UDP mode): VXLAN encapsulation
  - calico (BGP): direct routing with BGP, no encapsulation
  - calico (IPIP): IP-in-IP encapsulation
  - cilium: eBPF-based, can do encapsulation or native routing

---

## Tab 07: kube-proxy & Services

### Content
- **Service diagram**: ClusterIP (10.96.0.1) → three backing pods with animated arrows
- **kube-proxy watching API server**: small diagram showing kube-proxy ← API Server events (Endpoints changes)
- **iptables vs IPVS comparison table**:
  | | iptables | IPVS |
  |---|---|---|
  | Algorithm | Chain traversal | Hash table lookup |
  | LB algorithms | Random only | RR, source hash, least conn |
  | Scale | O(n) rules | O(1) lookup |
  | Default | Yes | No (opt-in) |
- **iptables rules visualization**:
  - KUBE-SERVICES chain → KUBE-SVC-XXXX chain → KUBE-SEP-YYYY chains
  - DNAT to endpoint IP:port
- **Code block** showing iptables -L -t nat -L KUBE-SERVICES excerpt

---

## Tab 08: Service IP Allocation

### Content
- **Visual**: ClusterIP range (10.96.0.0/12) shown as address space
  - First IP (10.96.0.1) reserved for kubernetes.default.svc
  - Remaining IPs available for Services
- **Step-by-step**:
  1. Service created with spec.clusterIP not specified
  2. apiserver allocates next available from service CIDR
  3. apiserver stores in etcd
  4. kube-proxy watches, creates iptables rules
  5. Service ClusterIP never assigned to any interface
- **Headless service visual**: clusterIP: None → DNS returns all pod IPs directly
- **Key insight**: "ClusterIP can be any unallocated IP in the service CIDR — even non-routable ones. It's purely a virtual mapping managed by iptables/IPVS."

---

## Tab 09: Endpoints & EndpointSlices

### Content
- **Service → Endpoints relationship**:
  - Service with selector `app: nginx` matches 3 pods
  - EndpointSlice objects show the IP:port pairs
  - Each pod has one EndpointSlice entry
- **Visual flow**: Pod dies → Endpoint removed → kube-proxy updates rules → traffic stops going to that pod
- **EndpointSlices**:
  - Group ~100 endpoints per slice
  - Multiple slices per service
  - Shown as a stack of small slice cards
- **Code snippet**: `kubectl get endpoints <svc-name>`

---

## Tab 10: CoreDNS

### Content
- **DNS query flow diagram**:
  1. busybox pod runs `nslookup my-svc.default.svc.cluster.local`
  2. /etc/resolv.conf from pod points to kube-dns (100.64.0.10)
  3. Query goes to kube-dns service (100.64.0.10)
  4. CoreDNS pod receives, looks up in its cache
  5. Returns ClusterIP (10.96.0.1) for my-svc
- **Pod FQDN**: `pod-name.ns.pod.svc.cluster.local`
- **Headless service**: clusterIP: None → CoreDNS returns A records for all pod IPs directly
- **SRV record**: `_http._tcp.my-svc.ns.svc.cluster.local` → points to `my-svc.ns.svc.cluster.local:80`
- **CoreDNS ConfigMap** shown as code block

---

## Tab 11: Ingress

### Content
- **External client → Ingress → Service → Pods flow**
- **Ingress resource YAML** with annotations (for nginx controller)
- **Path-based routing visual**:
  - /api → Service A (port 8080)
  - /static → Service B (port 8081)
  - / → Service C (port 8082)
- **Host-based routing visual**:
  - api.example.com → Ingress
  - dashboard.example.com → Ingress
  - Same Ingress, different backends based on Host header
- **Comparison**:
  - Ingress controller vs Ingress resource
  - nginx, contour, traefik, ambassador
  - TLS termination at controller

---

## Technical Implementation Notes

### Tab System
- JS function `showTab(n)` sets `display: block` on active panel, others hidden
- Active tab button gets `.active` class with top border accent
- CSS animation: `fadeIn` (opacity + translateY)

### Shared CSS Components
- `.section-label` — mono font, uppercase, letter-spacing, accent color
- `.section-title` — clamp font, bold
- `.section-desc` — muted color, max-width, line-height
- `.concept-grid` — auto-fill minmax(300px, 1fr)
- `.concept-card` — surface bg, border, border-radius, top accent stripe
- `.code-block` — dark bg, mono font, syntax highlighting classes
- `.warn-box` — red tint, border-left accent
- `.ok-box` — green tint
- `.compare-table` — full width, bordered
- `.flow-container` — surface bg, border-radius, overflow-x auto
- `.divider` — horizontal rule with border-top

### JavaScript
- `showTab(n)` — tab switching only (no complex interactions needed for this viz)
- `buildPacketJourney()` — for overlay packet flow animation (Tab 06)
- `highlightRange()` — for highlighting IP ranges (Tab 00)
- DOMContentLoaded init

### Animations
- Tab transitions: 0.3s fadeIn
- Pod crash/restart: Tab 02 (CSS animation)
- Service LB rotation: Tab 07 (CSS animation, looping)
- Packet encapsulation: Tab 06 (JS-driven step-by-step)
- DNS query flow: Tab 10 (JS-driven step-by-step)

---

## File Output
- `k8s-networking.html` — single self-contained HTML file
- No external dependencies except Google Fonts (Inter, JetBrains Mono)
- ~2500-3000 lines of HTML/CSS/JS expected