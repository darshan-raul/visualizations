# Kubernetes Networking — Deep Dive: Outline

## Overview
Companion markdown document to `k8s-networking.html` — comprehensive deep-dive into all concepts and sub-concepts, written as detailed explanatory prose (not a visualization spec).

---

## Structure: 12 Parts

```
k8s-networking-deep-dive.md
├── Part 1: Three IP Ranges
├── Part 2: Pod as Network Namespace
├── Part 3: veth Pairs & Linux Bridge
├── Part 4: CNI Plugin Interface
├── Part 5: CNI IPAM
├── Part 6: Multi-Node Overlay
├── Part 7: kube-proxy & Services
├── Part 8: Service IP Allocation
├── Part 9: Endpoints & EndpointSlices
├── Part 10: CoreDNS
├── Part 11: Ingress
└── Part 12: Network Policies
```

---

## Part 1: The Three Independent IP Ranges

### 1.1 Why Kubernetes Needs Three Separate IP Ranges
- The fundamental networking guarantee (flat pod-to-pod network)
- What happens if ranges overlap
- The operator's responsibility in planning CIDRs

### 1.2 Node Network (Host IPs)
- Physical network the nodes live on
- DHCP vs static allocation
- Node-to-node communication on this network
- Example: `192.168.1.0/24`

### 1.3 Pod CIDR (CNI IP Space)
- Allocated by CNI plugin on pod creation
- Each node gets a slice of the cluster's pod CIDR
- Example: `10.244.0.0/16` cluster-wide, node A gets `10.244.0.0/24`, node B gets `10.244.1.0/24`
- kubeadm `--pod-network-cidr` flag

### 1.4 Service CIDR (Virtual Cluster IPs)
- Purely virtual — no interface ever has these addresses
- Managed entirely by iptables/IPVS rules
- apiserver allocates from this range on Service creation
- Default: `10.96.0.0/12`
- kube-apiserver `--service-cluster-ip-range` flag
- The first IP (`10.96.0.1`) is reserved for `kubernetes.default.svc`

### 1.5 Non-Overlapping Requirement
- CIDR planning table (what goes where)
- Common mistake: pod CIDR overlapping with node network
- Tools: `kubectl get nodes -o jsonpath='{.items[*].status.addresses}'`

---

## Part 2: Pod as Network Namespace

### 2.1 Linux Network Namespaces
- What is a network namespace? (`ip netns`)
- One network namespace per pod
- Containers in a pod share the same network namespace
- Network namespace holds: interfaces, routes, ARP table, iptables rules

### 2.2 The Pause Container (Sandbox)
- kubelet creates pause container first for every pod
- Pause container's only job: hold the network namespace
- Image: `k8s.gcr.io/pause:3.x`
- If app container crashes/restarts, pause container keeps running → network namespace persists → IP doesn't change
- All containers in pod share `eth0` from the pause container's namespace

### 2.3 Shared Network Stack
- `lo` (loopback): all containers in pod can `localhost`
- Port space: containers can bind to same ports without conflict (via shared netns)
- Signal sharing: signals (SIGTERM) delivered to all containers in pod

### 2.4 Pod Networking Lifecycle (kubelet → CRI → CNI)
- Kubelet decides to create pod → calls CRI (Container Runtime Interface)
- CRI creates pause container → holds network namespace
- CRI reports container info back to kubelet
- Kubelet calls CNI plugin → CNI ADD → sets up networking
- CNI returns container's IP, gateway, routes, DNS config
- `PodSandbox` concept in CRI

---

## Part 3: veth Pairs & The Linux Bridge

### 3.1 Virtual Ethernet Pairs (veth)
- `ip link add veth0 type veth peer name veth1` creates a veth pair
- Like a pipe — packets written to veth0 appear on veth1 and vice versa
- One end placed in the pod's network namespace (named `eth0` inside pod)
- Other end remains on the host
- Host-side naming convention: `veth{UUID}` or `cali{xxx}`, `cni0{xxx}`

### 3.2 The CNI Bridge (cni0)
- Linux bridge created by bridge CNI plugin
- `ip link set cni0 master` — attaches veth to bridge
- Bridge acts like a learning switch: maintains MAC address table
- `bridge fdb show` shows learned MAC addresses
- Forwarding: if destination MAC is known → forward to specific port; if unknown → flood

### 3.3 Same-Node Packet Flow (Pod A → Pod B on same node)
1. Pod A sends packet to destination IP `10.244.0.3`
2. Inside Pod A's namespace: routing decision → `eth0` is the gateway
3. Packet exits via veth pair (host side of pair)
4. Reaches cni0 bridge
5. Bridge looks up MAC in its table → finds `veth3` (Pod B's veth)
6. Forwards frame to veth3
7. Pod B's namespace receives it via its `eth0`
8. Pod B's `lo` processes it

### 3.4 ARP Resolution
- Pod wants to send to `10.244.0.3` → needs MAC of holder of that IP
- Pod A broadcasts ARP request: "Who has 10.244.0.3?"
- Bridge forwards ARP to all ports except source
- Pod B (via its veth) replies: "10.244.0.3 is at aa:bb:cc:dd:ee:01"
- Bridge learns and caches this MAC mapping

### 3.5 Gateway and External Traffic
- If destination IP is not in pod CIDR → route to gateway
- Default gateway usually `0.0.0.0/0` pointing to host's default route
- Host masquerades (SNAT) outgoing pod traffic so return packets come back

---

## Part 4: CNI — The Plugin Interface

### 4.1 CNI Specification
- Container Network Interface — specification by CoreOS (now CNCF)
- Defines how kubelet interacts with network plugins
- Version: `0.1.0`, `0.2.0`, `0.3.0`, `0.4.0`, `1.0.0`
- Reference implementation: `github.com/containernetworking/cni`

### 4.2 CNI Operations
- `ADD` — configure network for container, return assigned IP
- `DEL` — teardown network configuration for container
- `CHECK` — verify network is configured correctly (since CNI 0.4.0)
- `VERSION` — plugin reports its capabilities

### 4.3 CNI Configuration Files
- Location: `/etc/cni/net.d/`
- Multiple plugins can be installed; kubelet reads files in alphabetical order
- First plugin that successfully returns network config wins
- Files: `10-cni.conf`, `99-loopback.conf`

### 4.4 CNI Plugin Types (by function)
- **bridge** — creates Linux bridge, plugs veth pairs
- **host-device** — moves existing device into pod namespace
- **vlan** — creates VLAN sub-interface
- **ipvlan** — L2/L3 mode for layer 2 sharing without veth pair
- **macvlan** — creates virtual MAC for each pod (pod appears as physical)
- **ptp** — creates veth pair, no bridge (point-to-point)
- **portmap** — maps host ports to pod ports (for `hostPort`)
- **bandwidth** — enforces traffic shaping via `tc`
- **tuning** — adjusts sysctl parameters on interface
- **sbr** — route-based traffic routing

### 4.5 Full CNI Solutions (with IPAM + policies)
- **flannel** — UDP (VXLAN), host-gw (direct routing), wireguard
- **calico** — BGP (no encapsulation), IPIP (encapsulation), eBPF (cilium backend)
- **cilium** — eBPF-based, no iptables, wireguard, VXLAN
- **weave** — sleeve (UDP encapsulation), fastdp (kernel tunnel)
- **antrea** — Open vSwitch, supports VXLAN, Geneve
- **multus** — meta-plugin that chains CNI plugins per pod (for multi-network)

### 4.6 CNI Config JSON Example (bridge plugin)
```json
{
  "cniVersion": "0.4.0",
  "name": "k8s-pod-network",
  "type": "bridge",
  "bridge": "cni0",
  "isGateway": true,
  "isDefaultGateway": true,
  "ipMasq": true,
  "mtu": 1400,
  "ipam": {
    "type": "host-local",
    "subnet": "10.244.0.0/16",
    "routes": [
      { "dst": "0.0.0.0/0" }
    ]
  }
}
```

---

## Part 5: CNI IPAM — IP Address Management

### 5.1 What IPAM Does
- Allocates IP addresses to containers from a pool
- Tracks which IPs are in use (and which are freed)
- Subnets must be non-overlapping across nodes

### 5.2 host-local IPAM
- Default IPAM for bridge CNI plugin
- Stores allocation state on the host filesystem: `/var/lib/cni/networks/`
- Directory per subnet: `10.244.0.0_24`, `10.244.1.0_24`
- Files per IP: named by IP address, contain container ID
- When container exits → CNI DEL → file removed → IP reclaimed

### 5.3 DHCP IPAM
- Sends DHCP requests to external DHCP server for IP allocation
- Less common in k8s
- Requires `host-local` or static for pod CIDR, then DHCP for pods

### 5.4 Static IPAM
- Admin manually assigns IPs to pods via annotations or config
- Used when predictable IPs are needed

### 5.5 Node Subnet Allocation (How CNI splits cluster CIDR per node)
- Cluster-wide pod CIDR: `10.244.0.0/16` (65,536 IPs)
- kubelet passes `--pod-cidr` to CNI on each node
- CNI plugin carves `/24` (256 IPs) per node from cluster CIDR
- Example: Node 1 → `10.244.0.0/24`, Node 2 → `10.244.1.0/24`
- Prevents IP overlap between nodes

### 5.6 IP Allocation Flow on Pod Create
1. Scheduler places pod on Node A
2. Kubelet calls CRI to create container
3. CRI creates pause container (holds netns)
4. Kubelet calls CNI ADD with: containerID, netns path, ifName (eth0)
5. CNI plugin (bridge) sees it needs an IP — asks IPAM (host-local)
6. IPAM reads node's subnet from state file
7. IPAM picks next available IP (e.g., `.5` since `.2,.3,.4` in use)
8. Writes IP to state file with container ID
9. Returns IP, gateway, routes to CNI
10. CNI configures veth pair, bridge, routes
11. IP returned to kubelet, stored in pod status

---

## Part 6: Multi-Node Networking — Overlay

### 6.1 Why Overlay Is Needed
- Pod IPs are not routable on physical network (not assigned to physical interfaces)
- Pod IP range exists only inside k8s cluster
- Overlay encapsulates packets so they can travel over physical network

### 6.2 VXLAN (Virtual Extensible LAN)
- Most common overlay for k8s (flannel, calico VXLAN mode, cilium)
- UDP encapsulation, port 4789
- 24-bit VNI (VXLAN Network Identifier) → supports 16M virtual networks
- VTEP (VXLAN Tunnel Endpoint) — runs on each node
- Two headers: inner (pod IP) + outer (node IP)

### 6.3 Cross-Node Packet Journey (Pod A on Node 1 → Pod B on Node 2)
1. Pod A (10.244.0.2) sends to Pod B (10.244.1.3)
2. Routing inside Node 1: destination not in local subnet → forward to gateway
3. Bridge forwards to veth → host routing table
4. Host routing sees `10.244.1.0/24` not local → needs to go to VTEP
5. VTEP encapsulates: inner.src = 10.244.0.2, inner.dst = 10.244.1.3
6. Outer.src = Node1 physical IP, outer.dst = Node2 physical IP
7. Sent over physical network (UDP 4789)
8. Node 2 VTEP receives, decapsulates
9. Inner packet delivered to Pod B via bridge → veth → eth0

### 6.4 Flannel Modes
- **VXLAN** (backend `vxlan`): UDP encapsulation, works anywhere
- **host-gw** (backend `host-gw`): direct routing, no encapsulation; requires layer 2 adjacency; higher performance
- **wireguard**: encrypted tunnel (flannel backend `wireguard`, alpha)

### 6.5 Calico Modes
- **BGP** (no encapsulation): nodes exchange routes via BGP, pods reachable via node IPs; highest performance; requires nodes be in same L2 or have BGP peering
- **IPIP** (encapsulation): IP-in-IP tunnel; single mode (IPIP only), double mode (IPIP + bgp)
- **eBPF** (Cilium-compatible): bypasses iptables, direct kernel mapping; highest performance; cilium is the reference implementation

### 6.6 Cilium
- eBPF programs attached to kernel hooks (not iptables)
- Can do VXLAN or direct routing (no encapsulation)
- WireGuard integration for encryption
- Per-pod policy enforcement at kernel level
- Hubble: built-in observability (flow visualization)

### 6.7 Comparison Table
| Solution | Encapsulation | Data Path | Performance | Encryption |
|---|---|---|---|---|
| Flannel UDP | VXLAN | userspace | low | no |
| Flannel host-gw | none | kernel | high | no |
| Calico BGP | none | kernel | highest | no |
| Calico IPIP | IP-in-IP | kernel | medium | no |
| Cilium eBPF | optional | kernel | highest | WireGuard |
| Weave | UDP/sleeve | userspace | low | optional |
| Antrea | VXLAN/Geneve | kernel | high | IPsec |

---

## Part 7: kube-proxy & Services

### 7.1 What Is a Service?
- Stable virtual IP (ClusterIP) that load-balances to backing pods
- Pod IPs are ephemeral (restart = new IP)
- Service provides stable DNS name + virtual IP
- Service selector matches pods → endpoints created automatically

### 7.2 kube-proxy
- DaemonSet running on every node (`kube-system/kube-proxy`)
- Watches API server for Service and Endpoint changes
- Programs iptables or IPVS rules on each node
- ClusterIP never assigned to any interface — purely managed by rules

### 7.3 iptables Mode (default, legacy)
- kube-proxy creates chains in the NAT table
- `KUBE-SERVICES` — all services (match destination ClusterIP)
- `KUBE-SVC-XXXXX` — per-service dispatcher (random load balancing)
- `KUBE-SEP-XXXXX` — per-endpoint (final DNAT to pod IP:port)
- LB algorithm: iptables `statistic mode random probability` chain traversal

### 7.4 iptables Rule Flow
```
iptables -t nat -L KUBE-SERVICES
  -A KUBE-SERVICES -d 10.96.0.1/32 -p TCP --dport 80 -j KUBE-SVC-4ZXNJ
  -A KUBE-SVC-4ZXNJ -m statistic --mode random --probability 0.3333 -j KUBE-SEP-AA
  -A KUBE-SVC-4ZXNJ -m statistic --mode random --probability 0.5 -j KUBE-SEP-BB
  -A KUBE-SVC-4ZXNJ -j KUBE-SEP-CC
  -A KUBE-SEP-AA -s 10.244.0.2/32 -j DNAT --to-destination 10.244.0.2:80
```

### 7.5 IPVS Mode (performance)
- Uses in-kernel IPVS (hash table, O(1) lookup)
- Supports multiple LB algorithms: round-robin, source hash, least connections
- Requires `kube-proxy --mode=ipvs` flag
- ipvsadm shows current rules

### 7.6 Comparison: iptables vs IPVS
| | iptables | IPVS |
|---|---|---|
| Data structure | Chain traversal | Hash table |
| LB algorithms | Random only | RR, source-hash, least-conn |
| Scale | O(n) rules, O(n) lookup | O(1) lookup |
| Default | Yes | No (opt-in) |
| Session affinity | No | Yes (persistent) |

### 7.7 Service Types Deep Dive
- **ClusterIP**: internal only, virtual IP from service CIDR
- **NodePort**: exposes service on each node's static port (30000-32767)
- **LoadBalancer**: provisions external LB (cloud provider integration)
- **ExternalName**: maps service to external DNS name (CNAME)

### 7.8 External Traffic Policy
- `spec.externalTrafficPolicy: Cluster` (default) — SNAT, all nodes, potential extra hop
- `spec.externalTrafficPolicy: Local` — no SNAT, only nodes with local endpoints; preserves client IP

---

## Part 8: Service IP Allocation — How ClusterIPs Are Assigned

### 8.1 Service CIDR
- Configured via `--service-cluster-ip-range` on kube-apiserver
- Default: `10.96.0.0/12` (supports 65,536 services)
- First IP (`10.96.0.1`) reserved for `kubernetes.default`
- apiserver manages allocation — stored in etcd

### 8.2 ClusterIP Assignment Process
1. Service created with `spec.clusterIP` unset
2. apiserver scans service CIDR for next available IP
3. Skips IPs already assigned to other services
4. Skips reserved IPs (kubernetes.default)
5. Writes to etcd
6. kube-proxy watches, creates iptables/IPVS rules

### 8.3 Specifying a Custom ClusterIP
- Can set `spec.clusterIP` manually (e.g., `spec.clusterIP: 10.96.0.200`)
- Must be within service CIDR and not already in use
- Useful for migration or compatibility with existing configs

### 8.4 ClusterIP is Virtual — No Interface
- Virtual IP managed entirely by iptables/IPVS
- `ip addr show` will NOT show ClusterIP on any interface
- kube-proxy intercepts packets to ClusterIP at PREROUTING/INPUT
- DNAT rewrites destination to backing pod IP before forwarding

---

## Part 9: Endpoints & EndpointSlices

### 9.1 What Are Endpoints?
- Object tracking IP:port of all pods backing a service
- Created automatically when Service selector matches pods
- `kubectl get endpoints <service-name>` shows backing pod IPs
- Controller: endpoint controller (in kube-controller-manager)

### 9.2 EndpointSlice (Kubernetes 1.16+)
- Groups endpoints (~100 per slice)
- Multiple slices per service when many pods exist
- Lower memory footprint, more efficient watches
- `kubectl get endpointslices -l kubernetes.io/service-name=<svc>`

### 9.3 Endpoint Lifecycle
- Pod created → controller creates Endpoint
- Pod dies → endpoint removed (after grace period)
- Pod IP changes → endpoint IP updated
- kube-proxy watches Endpoint changes → updates iptables rules

### 9.4 EndpointController Flow
- Service created with selector `app: nginx`
- Scheduler places pod
- kubelet creates pod → pod has IP
- Endpoint controller sees new pod matching selector → adds to Endpoints
- kube-proxy sees Endpoint change → adds new rule entry
- Pod deleted → reverse flow

### 9.5 Headless Services
- `spec.clusterIP: "None"` → no virtual IP allocated
- DNS returns A records for all backing pod IPs directly
- Pods get individual DNS names: `pod-name.ns.pod.svc.cluster.local`
- Used for stateful workloads (etcd, Cassandra) that need direct pod discovery

---

## Part 10: CoreDNS — Service Discovery

### 10.1 DNS in Kubernetes
- Before 1.12: kube-dns (SkyDNS + kube2sky + dnsmasq)
- Since 1.12: CoreDNS (single binary, ConfigMap-driven, no dnsmasq)
- Runs as a Deployment in `kube-system` with Service `kube-dns`
- Service IP: `100.64.0.10` (default, in service CIDR)

### 10.2 How Pods Get DNS Config
- kubelet injects DNS config into every pod via `/etc/resolv.conf`
- `nameserver 100.64.0.10` — points to kube-dns service
- `search <namespace>.svc.cluster.local svc.cluster.local cluster.local`
- `options ndots:5` — searches domain before using FQDN

### 10.3 CoreDNS Plugins
- `kubernetes` — answers for in-cluster names (service, pod)
- `forward` — forwards non-matched queries to `/etc/resolv.conf` (upstream)
- `errors` — logs errors
- `health` — health endpoint `:8080/health`
- `prometheus` — metrics `:9153/metrics`
- `cache` — caches responses (TTL-based)
- `reload` — watches ConfigMap for changes, auto-reloads

### 10.4 Corefile (CoreDNS ConfigMap)
```
cluster.local {
    kubernetes cluster.local in-addr.arpa ip6.arpa {
        pods insecure
        fallthrough in-addr.arpa ip6.arpa
    }
    forward . /etc/resolv.conf
}
```

### 10.5 DNS Query Resolution
1. Pod does `nslookup my-svc.default.svc.cluster.local`
2. Pod's `/etc/resolv.conf` points to `100.64.0.10`
3. Query sent to kube-dns service IP
4. CoreDNS receives, checks `cluster.local` zone
5. Finds service → returns ClusterIP
6. If headless → returns all pod IPs as A records

### 10.6 DNS Record Types
- **A record**: service name → ClusterIP (standard service)
- **A record**: pod FQDN → pod IP (when enabled in CoreDNS)
- **SRV record**: `_port-name._protocol.svc.ns.svc.cluster.local` → `svc.ns.svc.cluster.local:port`
- **CNAME**: for ExternalName services

### 10.7 Pod Hostname and Subdomain
- Pod's hostname: `metadata.name` (e.g., `nginx-abc123`)
- Pod's subdomain: `metadata.subdomain` (if set, matches a headless service name)
- Pod FQDN: `{hostname}.{subdomain}.{namespace}.svc.cluster.local`
- Pods without subdomain get: `{hostname}.{namespace}.pod.svc.cluster.local`

### 10.8 Headless Service DNS
- No ClusterIP → CoreDNS returns pod IPs directly
- `nslookup my-headless.default.svc.cluster.local` → returns 3 A records (one per pod)
- Client gets all IPs → can load-balance client-side

### 10.9 DNS TTL Behavior
- Services: TTL set by CoreDNS (default 30s)
- Negative caching: if service not found, cached as NXDOMAIN
- Pods: TTL 5 minutes (pods IPs change on restart, can't be cached long)

### 10.10 Stub Domains and External DNS
- Custom DNS zones via CoreDNS ConfigMap stub domains
- Example: `.company.com` → forward to `10.0.0.1:53`
- Useful for integrating with corporate DNS

---

## Part 11: Ingress — External Access

### 11.1 What Is Ingress?
- Kubernetes API object (since 1.1, stable since 1.19)
- HTTP/HTTPS routes from outside to services inside cluster
- Host-based and path-based routing
- TLS termination handled by controller

### 11.2 Ingress Resource
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 80
  - host: dashboard.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dashboard-svc
            port:
              number: 80
```

### 11.3 Ingress Controller
- Implementation of Ingress spec (not built into k8s)
- Watches Ingress resources, programs its own rules
- Examples: nginx-ingress-controller, Contour (Envoy), Traefik, Ambassador, GKE Ingress
- One per cluster (or multiple with IngressClass)

### 11.4 IngressClass
- `networking.k8s.io/v1` — replaces deprecated `kubernetes.io/ingress.class` annotation
- `IngressClass` object points to controller implementation
- Pods specify `ingressClassName` in Ingress spec

### 11.5 Path-Based Routing
- `api.example.com/api` → Service A
- `api.example.com/admin` → Service B
- Controller matches `Host` header + `Path` prefix
- `pathType: Prefix` (most common), `Exact`, `ImplementationSpecific`

### 11.6 Host-Based Routing
- Multiple hostnames → same Ingress rule
- `api.example.com` and `cdn.example.com` differentiated by `Host` header
- Useful for multi-tenant deployments

### 11.7 TLS Termination
- TLS certificate stored as Kubernetes Secret
- `spec.tls[]` in Ingress spec references Secret
- Controller terminates TLS, forwards HTTP to backends
- Supports SNI (Server Name Indication) for multi-cert

### 11.8 Load Balancing Algorithm
- Typically: round-robin (default for nginx)
- Can be configured: least connections, IP hash, etc.
- Annotations control behavior (e.g., `nginx.ingress.kubernetes.io/load-balance`)

### 11.9 Gateway API (Successor to Ingress)
- `gateway.networking.k8s.io/v1` — newer API, replaces Ingress
- Role model: GatewayClass → Gateway → Route
- Allows delegation of route management to different teams
- Multiple Route types: HTTPRoute, TCPRoute, UDPRoute, GRPCRoute

---

## Part 12: Network Policies (Bonus)

### 12.1 What Are Network Policies?
- Kubernetes API object for pod-level firewall rules
- Pods are isolated by default (no ingress/egress allowed)
- NetworkPolicy selects pods and defines allowed traffic
- CNI plugin must support NetworkPolicy (Calico, Cilium, Antrea, Weave, etc.)

### 12.2 Ingress and Egress Rules
- `podSelector` — selects which pods the policy applies to
- `ingress[]` — whitelist of allowed inbound traffic
- `egress[]` — whitelist of allowed outbound traffic
- `policyTypes` — specifies which types are defined (default: Ingress only if any rule exists)

### 12.3 Example NetworkPolicy
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-netpol
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

### 12.4 DNS Egress for Network Policies
- Pods need to communicate with CoreDNS for DNS resolution
- Must allow egress to kube-dns service IP (`100.64.0.10`)
- Without this, DNS lookups fail and service discovery breaks

### 12.5 CNI Plugin Implementation
| Plugin | NetworkPolicy Support |
|---|---|
| Calico | Yes (native) |
| Cilium | Yes (eBPF) |
| Antrea | Yes (OVS) |
| Weave | Yes |
| Flannel | No (requires additional plugin like Calico) |