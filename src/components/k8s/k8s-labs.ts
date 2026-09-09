export type Tone = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'muted';

export interface LabNode {
  label: string;
  detail: string;
  tone: Tone;
  explanation?: string;
}

export interface LabScenario {
  label: string;
  summary: string;
  nodes: LabNode[];
  result: string;
  evidence: string;
  setting: string;
}

export interface Lab {
  id: string;
  nav: string;
  title: string;
  question: string;
  introduction?: string;
  kind: 'fleet' | 'flow' | 'timeline' | 'signals' | 'allocation';
  scenarios: LabScenario[];
}

const n = (label: string, detail: string, tone: Tone = 'cyan'): LabNode => ({ label, detail, tone });

export const labs: Lab[] = [
  {
    id: 'v01', nav: 'Pod network', title: '', kind: 'flow',
    question: 'What does the cluster do when a new Pod needs an IP address?',
    scenarios: [
      { label: 'CNI ADD succeeds', summary: 'In this veth-based example, the runtime invokes CNI and IPAM supplies an address.', nodes: [n('Sandbox', 'Kubelet requests through CRI', 'cyan'), n('NetNS', 'Runtime creates namespace', 'cyan'), n('CNI ADD', 'Plugin invoked', 'purple'), n('IPAM', 'Allocates 10.244.1.15', 'cyan'), n('veth', 'Pod eth0 configured', 'green')], result: 'The Pod receives the interfaces, addresses, and routes returned by this network implementation.', evidence: '`ip address` and `ip route` inside the Pod show the resulting attachment.', setting: 'Runtime CNI configuration, plugin chain, and implementation-specific IPAM.' },
      { label: 'Subnet exhausted', summary: 'IPAM has no free IPs left in the node\'s allocated CIDR.', nodes: [n('Sandbox', 'Kubelet requests CRI', 'cyan'), n('NetNS', 'CRI creates namespace', 'cyan'), n('CNI ADD', 'Plugin invoked', 'purple'), n('IPAM', 'No free IPs in /24', 'red')], result: 'Scheduling succeeded but networking failed; move Pods or widen CIDR.', evidence: 'Pod events show \'failed to allocate for range 0: no IP addresses available\'.', setting: 'podCIDR per node, IPAM range.' },
      { label: 'Plugin not found', summary: 'The CNI binary is missing from the node\'s disk.', nodes: [n('Sandbox', 'Kubelet requests CRI', 'cyan'), n('CRI config', 'Reads CNI settings', 'cyan'), n('Binary search', 'Looks in /opt/cni/bin', 'amber'), n('Missing', 'Plugin not found', 'red')], result: 'The node can schedule but not connect Pods.', evidence: '\'plugin not found\' in kubelet logs.', setting: 'CNI binary path and plugin config.' },
    ],
  },
  {
    id: 'v02', nav: 'Same node', title: '', kind: 'flow',
    question: 'How does a packet travel between two Pods on the same machine?',
    scenarios: [
      { label: 'Bridge forwarding', summary: 'In this Linux bridge example, the bridge learns MAC addresses and switches frames locally.', nodes: [n('Pod A', 'Sends to 10.244.1.8', 'cyan'), n('vethA', 'Host-side peer', 'cyan'), n('cni0 bridge', 'FDB lookup finds vethB', 'purple'), n('vethB', 'Peer toward Pod B', 'cyan'), n('Pod B', 'Receives packet', 'green')], result: 'Traffic stays on one Node. This example uses a bridge; routed and eBPF implementations can take a different local path.', evidence: '`bridge fdb show br cni0` shows forwarding entries for bridge ports.', setting: 'Bridge attachment and routes come from the installed network implementation.' },
      { label: 'eBPF redirect', summary: 'An eBPF datapath can redirect known local traffic without a Linux bridge.', nodes: [n('Pod A', 'Sends to 10.244.1.8', 'cyan'), n('vethA', 'TC/eBPF hook', 'purple'), n('Kernel redirect', 'Implementation chooses peer', 'amber'), n('Pod B', 'Receives packet', 'green')], result: 'The packet still traverses kernel networking hooks, but it need not cross a Linux bridge or the same route lookup as the bridge example.', evidence: '`tc filter show dev <host-veth> ingress` can reveal attached programs for a TC-based implementation.', setting: 'Implementation-specific eBPF attachment and routing mode.' },
      { label: 'hostNetwork Pod', summary: 'The Pod uses the Node network namespace directly.', nodes: [n('Shared netns', 'No ordinary Pod veth', 'amber'), n('Host interface', 'Uses Node addresses', 'cyan'), n('Port conflict', 'Shares host port space', 'red'), n('DNS choice', 'Select policy explicitly', 'purple')], result: 'The Pod bypasses an ordinary Pod network attachment. Use ClusterFirstWithHostNet when this Pod should receive cluster-first DNS behavior.', evidence: '`kubectl get pod <name> -o jsonpath={.spec.hostNetwork}` reports the declared mode.', setting: 'spec.hostNetwork: true; dnsPolicy chosen for the workload.' },
    ],
  },
  {
    id: 'v03', nav: 'Cross node', title: '', kind: 'flow',
    question: 'How does a packet reach a Pod on a different machine?',
    scenarios: [
      { label: 'Native routing', summary: 'The underlay network natively routes Pod IPs between nodes.', nodes: [n('Pod A', '10.244.0.5 on Node A', 'cyan'), n('Node A route', '10.244.1.0/24 via Node B', 'purple'), n('L3 forward', 'Packet sent unencapsulated', 'cyan'), n('Node B route', 'Local delivery to veth', 'cyan'), n('Pod B', 'Receives 10.244.1.8', 'green')], result: 'No encapsulation overhead. Requires either BGP route distribution or cloud-native routing (e.g., AWS VPC CNI).', evidence: '`ip route show` on Node A shows `10.244.1.0/24 via <nodeB-IP>`.', setting: 'BGP peering or cloud route tables.' },
      { label: 'VXLAN overlay', summary: 'The node wraps the packet in UDP to traverse the underlay.', nodes: [n('Inner packet', 'src 10.244.0.5 dst 10.244.1.8', 'cyan'), n('flannel.1', 'VXLAN encapsulation', 'purple'), n('Outer packet', 'src Node A dst Node B', 'amber'), n('Decapsulate', 'Node B strips VXLAN', 'cyan'), n('Pod B', 'Receives inner packet', 'green')], result: 'Works on any underlay. 50-byte overhead reduces effective MTU.', evidence: '`ip -d link show flannel.1` reveals VXLAN VNI and remote entries.', setting: 'VXLAN VNI, UDP port 4789.' },
      { label: 'Cloud-native ENI', summary: 'In this AWS VPC CNI example, the Pod receives a VPC-routable address.', nodes: [n('VPC subnet', 'Allocates Pod address', 'cyan'), n('No overlay', 'VPC routes natively', 'purple'), n('Security scope', 'Node SG by default', 'amber'), n('Capacity', 'Subnet and ENI limits', 'red')], result: 'Pod addresses consume VPC capacity. Pods share Node ENI security groups by default; separate Pod security groups require the dedicated feature and branch interfaces.', evidence: '`kubectl get pod -o wide` and EC2 ENI data establish which VPC address and interface back the Pod.', setting: 'AWS VPC CNI mode, subnet capacity, prefix delegation, and optional security groups for Pods.' },
    ],
  },
  {
    id: 'v04', nav: 'MTU', title: '', kind: 'timeline',
    question: 'When does encapsulation overhead silently break large packets?',
    scenarios: [
      { label: 'Illustrative VXLAN overhead', summary: 'An inner packet can exceed the underlay MTU after tunnel headers are added.', nodes: [n('Inner packet', '1500-byte example', 'cyan'), n('Tunnel headers', 'Size varies by path', 'purple'), n('Underlay MTU', '1500-byte example', 'amber'), n('Too large', 'Fragment, signal, or drop', 'red')], result: 'The safe Pod MTU depends on IP family, encapsulation, encryption, and every link in the path; 1450 is common for one IPv4 VXLAN example, not a universal value.', evidence: 'Compare Pod, tunnel, and Node interface MTUs and capture ICMP or ICMPv6 packet-too-big messages.', setting: 'CNI MTU derived from the real encapsulation and underlay.' },
      { label: 'PMTUD succeeds', summary: 'The sender learns the path MTU via ICMP.', nodes: [n('Packet 1500', 'Hits MTU limit', 'cyan'), n('ICMP reply', 'Fragmentation Needed', 'purple'), n('MTU updated', 'Sender adjusts to 1450', 'amber'), n('Retransmit', 'Succeeds at 1450 bytes', 'green')], result: 'Path MTU Discovery works when ICMP is not filtered.', evidence: '`tcpdump -i eth0 icmp` shows \'need to frag\'.', setting: 'Don\'t Fragment flag set on packets.' },
      { label: 'PMTUD blocked', summary: 'Firewalls drop ICMP, preventing MTU discovery.', nodes: [n('Packet 1500', 'Hits MTU limit', 'cyan'), n('ICMP reply', 'Dropped by firewall', 'red'), n('Black hole', 'Sender never adjusts', 'amber'), n('Stall', 'Connection hangs', 'red')], result: 'Black hole. Small requests work, large responses or file transfers hang.', evidence: 'Large `curl` hangs while small responses succeed.', setting: 'Security group / iptables blocking ICMP type 3 code 4.' },
    ],
  },
  {
    id: 'v05', nav: 'ClusterIP', title: '', kind: 'flow',
    question: 'How does kube-proxy redirect traffic addressed to a virtual Service IP?',
    scenarios: [
      { label: 'iptables DNAT', summary: 'In kube-proxy iptables mode, kernel rules rewrite the destination before backend routing.', nodes: [n('Client sends', 'To 10.96.45.3:80', 'cyan'), n('PREROUTING', 'KUBE-SERVICES match', 'purple'), n('Service chain', 'Selects backend SEP', 'amber'), n('DNAT', 'Rewrites to 10.244.1.7:8080', 'cyan'), n('Pod receives', 'Target application', 'green')], result: 'The ClusterIP is a virtual frontend rather than the backend application. In this mode, netfilter selects an endpoint and rewrites the packet destination.', evidence: '`iptables-save -t nat` shows the KUBE-SVC and KUBE-SEP rules for this Service.', setting: 'kube-proxy mode=iptables; nftables and replacement proxies expose different state.' },
      { label: 'No ready endpoints', summary: 'The Service still has a frontend, but no endpoint is eligible for an ordinary new connection.', nodes: [n('Client sends', 'To 10.96.45.3:80', 'cyan'), n('Service frontend', 'Destination recognized', 'purple'), n('Eligible set', 'No ready endpoint', 'red'), n('Failure', 'Reject or drop by implementation', 'red')], result: 'DNS can still return the ClusterIP. The observed failure—reject, reset, or timeout—depends on the proxy implementation and packet path.', evidence: '`kubectl get endpointslice -l kubernetes.io/service-name=api -o yaml` shows membership and readiness.', setting: 'Selector match, EndpointSlice conditions, and Service-proxy implementation.' },
      { label: 'Existing connection outlives change', summary: 'A long-lived flow can retain its chosen backend after endpoint state changes.', nodes: [n('Endpoint changes', 'Proxy state reconciles', 'purple'), n('Existing TCP', 'Connection remains open', 'cyan'), n('Connection state', 'Keeps backend mapping', 'amber'), n('Later result', 'Backend or timeout decides', 'red')], result: 'Test fresh and existing connections separately. Their lifetimes can differ from EndpointSlice and proxy reconciliation.', evidence: '`conntrack -L` plus application connection state can identify the still-active flow.', setting: 'Application connection lifetime and the Node’s actual conntrack timeout values.' },
    ],
  },
  {
    id: 'v06', nav: 'Endpoints', title: '', kind: 'signals',
    question: 'What triggers a change in the endpoints available to a Service?',
    scenarios: [
      { label: 'Pod becomes ready', summary: 'Readiness changes whether the endpoint is ordinarily eligible for new traffic.', nodes: [n('Probe passes', 'Pod becomes Ready', 'green'), n('EndpointSlice', 'ready becomes true', 'purple'), n('Service proxy', 'Reconciles endpoint state', 'amber'), n('New traffic', 'Endpoint becomes eligible', 'cyan')], result: 'A matching Pod can be published before it is ready; the EndpointSlice conditions tell consumers whether it should receive ordinary new traffic.', evidence: 'EndpointSlice shows the Pod address with `conditions.ready: true` after readiness succeeds.', setting: 'Service selector, Pod readiness, and EndpointSlice conditions.' },
      { label: 'Pod starts terminating', summary: 'The endpoint remains visible with terminating state while consumers and connections drain.', nodes: [n('Deletion timestamp', 'Termination begins', 'amber'), n('EndpointSlice', 'terminating=true, ready=false', 'purple'), n('Service proxy', 'Avoids for ordinary new traffic', 'cyan'), n('Existing flows', 'Have their own lifetime', 'amber'), n('Removed', 'After Pod deletion', 'muted')], result: 'Terminating endpoints are not immediately removed. `serving` can remain true during drain, and proxies may use serving-and-terminating endpoints when all available endpoints are terminating.', evidence: '`kubectl get endpointslice -o yaml` shows ready, serving, and terminating independently.', setting: 'Pod termination behavior, EndpointSlice conditions, and consumer implementation.' },
      { label: 'Selector changes', summary: 'Mismatched labels silently disconnect Pods.', nodes: [n('New Pods', 'Labels: app=api-v2', 'cyan'), n('Service', 'Selector: app=api', 'purple'), n('Mismatch', 'EndpointSlice excludes', 'red'), n('Old only', 'Traffic skips new Pods', 'amber')], result: 'Labels and selectors are the contract. Changing labels without updating the selector disconnects backends from the Service.', evidence: '`kubectl get endpoints api` shows only old Pod IPs.', setting: 'Service spec.selector vs Pod metadata.labels.' },
    ],
  },
  {
    id: 'v07', nav: 'DNS', title: '', kind: 'flow',
    question: 'How many queries does a single name resolution actually cost?',
    scenarios: [
      { label: 'Short name resolves', summary: 'The search path resolves local Service names efficiently.', nodes: [n('Resolve \'api\'', '0 dots < ndots:5', 'cyan'), n('Search suffix', 'api.default.svc.cluster.local', 'purple'), n('CoreDNS', 'Answers 10.96.45.3', 'green'), n('Done', '1 query total', 'cyan')], result: 'Short names within the same namespace resolve efficiently through the search path.', evidence: '`cat /etc/resolv.conf` shows search suffixes and ndots:5.', setting: 'dnsPolicy: ClusterFirst.' },
      { label: 'External name amplification', summary: 'A resolver can try search-expanded names before the absolute external name.', nodes: [n('api.example.com', 'Below example ndots', 'cyan'), n('Search suffixes', 'One or more attempts', 'amber'), n('Negative answers', 'Resolver continues', 'amber'), n('Absolute query', 'Upstream answers', 'green')], result: 'The exact order and query count depend on the resolver, search list, and Pod DNS configuration. A trailing dot requests an absolute name.', evidence: 'Capture the queries or inspect DNS logs together with the Pod’s `/etc/resolv.conf`.', setting: 'Resolver behavior, search list, ndots, and the application’s query name.' },
      { label: 'Headless Service', summary: 'DNS returns Pod IPs directly instead of a ClusterIP.', nodes: [n('Resolve db', 'clusterIP: None', 'purple'), n('CoreDNS', 'Returns A records', 'cyan'), n('Pod IPs', '10.244.1.7, 10.244.2.3', 'cyan'), n('Client picks', 'Connects directly', 'green')], result: 'DNS returns actual backend addresses. Client handles selection and must cope with endpoint churn.', evidence: '`dig db.default.svc.cluster.local` returns multiple A records.', setting: 'Service spec.clusterIP: None.' },
    ],
  },
  {
    id: 'v08', nav: 'DNS edge cases', title: '', kind: 'signals',
    question: 'Which DNS configuration breaks silently until production traffic hits it?',
    scenarios: [
      { label: 'NodeLocal DNSCache', summary: 'A local daemonset caches queries to avoid conntrack saturation.', nodes: [n('Pod resolves', 'Query starts', 'cyan'), n('Link-local VIP', '169.254.20.10', 'purple'), n('DaemonSet', 'Answers from cache', 'green'), n('No conntrack', 'Avoids UDP limit', 'cyan')], result: 'Reduces CoreDNS load, avoids conntrack table saturation under high DNS query rates.', evidence: '`/etc/resolv.conf` nameserver is 169.254.20.10 instead of cluster DNS IP.', setting: 'NodeLocalDNSCache DaemonSet.' },
      { label: 'Default-deny kills DNS', summary: 'Egress policies block DNS resolution by default.', nodes: [n('egress: []', 'Total deny applied', 'purple'), n('UDP 53', 'Query to kube-dns', 'cyan'), n('Dropped', 'Policy blocks', 'red'), n('Timeout', 'App fails', 'red')], result: 'DNS is the first thing that breaks under restrictive egress policy. Always allow DNS before anything else.', evidence: '`nslookup kubernetes.default` times out from inside the Pod.', setting: 'NetworkPolicy egress: [] without DNS exception.' },
      { label: 'FQDN trailing dot', summary: 'A trailing dot marks the name as absolute for ordinary DNS resolver behavior.', nodes: [n('api.example.com.', 'Trailing dot', 'cyan'), n('Absolute name', 'No search suffix appended', 'purple'), n('Direct lookup', 'Resolver asks for that name', 'green')], result: 'An absolute name avoids search-suffix expansion, although retries, address families, and resolver behavior can still produce more than one DNS exchange.', evidence: 'Packet capture or resolver logs show the actual names and record types queried.', setting: 'Application query name and resolver implementation.' },
    ],
  },
  {
    id: 'v09', nav: 'Traffic policy', title: '', kind: 'signals',
    question: 'How does traffic policy change which backends can receive a connection?',
    scenarios: [
      { label: 'Cluster-wide eligibility', summary: 'Cluster policy makes ready endpoints across the cluster eligible.', nodes: [n('Policy: Cluster', 'Default behavior', 'purple'), n('Node A', '1 local endpoint', 'cyan'), n('Node B', '2 remote endpoints', 'cyan'), n('Eligible set', 'All 3 available', 'green')], result: 'Cluster policy widens eligibility; it does not promise an even request distribution because connections, affinity, and implementation behavior matter.', evidence: 'Inspect EndpointSlices and the rules or maps used by the installed Service proxy.', setting: 'internalTrafficPolicy: Cluster (default).' },
      { label: 'Node-local only', summary: 'Internal traffic stays with ready endpoints on the same Node or is dropped.', nodes: [n('Policy: Local', 'Strict locality', 'purple'), n('Node A (1 Pod)', 'Routes locally', 'green'), n('Node C (0 Pods)', 'No local endpoint', 'amber'), n('Dropped', 'On Node C', 'red')], result: 'Local is a hard eligibility constraint. A Node with no ready local endpoint cannot use remote endpoints for this Service path.', evidence: 'EndpointSlices show endpoint nodeName values; test from clients on Nodes with and without local endpoints.', setting: 'internalTrafficPolicy: Local.' },
      { label: 'External Local', summary: 'Local policy can preserve a client address by avoiding the extra Node hop.', nodes: [n('External traffic', 'Lands on a Node', 'purple'), n('Local endpoint', 'Required for forwarding', 'green'), n('No cross-node hop', 'Avoids common SNAT path', 'cyan'), n('Backend observes', 'Verify actual source', 'green')], result: 'Source preservation and load-balancer health behavior depend on the surrounding implementation. Local policy also narrows eligible endpoints and can skew load.', evidence: 'Compare load-balancer targets, Node-local endpoint health, and the source address logged by the backend.', setting: 'externalTrafficPolicy: Local plus provider/controller behavior.' },
    ],
  },
  {
    id: 'v10', nav: 'Source IP', title: '', kind: 'flow',
    question: 'Where does the client address get replaced, and what sees the replacement?',
    scenarios: [
      { label: 'Cluster policy example', summary: 'A common NodePort path SNATs cross-node external traffic for symmetric return routing.', nodes: [n('Client 203.0.113.5', 'Arrives at Node A', 'cyan'), n('Node path', 'May SNAT to Node A', 'purple'), n('Forward', 'To Pod on Node B', 'cyan'), n('Pod observes', 'Path-dependent source', 'amber')], result: 'Do not infer the source from the Service object alone. Provider load balancers and proxy replacements can produce different paths.', evidence: 'Application logs and a packet capture at the backend establish the address actually observed.', setting: 'externalTrafficPolicy: Cluster plus load-balancer and Service-proxy implementation.' },
      { label: 'Local policy example', summary: 'A compatible implementation can preserve the source by routing only to a local endpoint.', nodes: [n('Client 203.0.113.5', 'Arrives at Node A', 'cyan'), n('Local endpoint', 'No extra Node hop', 'purple'), n('No Node SNAT', 'In this example', 'cyan'), n('Pod observes', '203.0.113.5', 'green')], result: 'Preservation is possible when the entire entry path supports it. Only Nodes with eligible local endpoints should receive this traffic.', evidence: 'Backend logs confirm the original address; load-balancer target health confirms where traffic can land.', setting: 'externalTrafficPolicy: Local plus a compatible external path.' },
      { label: 'Proxy protocol', summary: 'L7 proxies insert the client IP into headers.', nodes: [n('L7 Proxy', 'Terminates TCP', 'purple'), n('X-Forwarded-For', 'Inserts client IP', 'cyan'), n('SNAT', 'Proxy IP is source', 'amber'), n('Pod reads header', 'Gets client IP', 'green')], result: 'Application-layer solution. Works regardless of traffic policy but requires app awareness.', evidence: 'HTTP headers contain X-Forwarded-For: 203.0.113.5.', setting: 'Proxy protocol or X-Forwarded-For configuration.' },
    ],
  },
  {
    id: 'v11', nav: 'Gateway API', title: '', kind: 'flow',
    question: 'Which status condition tells you where the Gateway API request path broke?',
    scenarios: [
      { label: 'Full attachment succeeds', summary: 'The class, listener, Route attachment, and backend reference are accepted and programmed.', nodes: [n('GatewayClass', 'Accepted', 'cyan'), n('Gateway listener', 'Accepted + Programmed', 'cyan'), n('HTTPRoute parent', 'Accepted for listener', 'purple'), n('backendRef', 'ResolvedRefs true', 'cyan'), n('Data plane', 'Test actual traffic', 'green')], result: 'Read each resource’s status and observedGeneration, then test the data plane. Accepted and Programmed describe reconciliation progress; neither replaces an end-to-end request.', evidence: '`kubectl get gateway,httproute -o yaml` shows conditions for the current object generation.', setting: 'GatewayClass, Gateway listeners, HTTPRoute parent status, and backend references.' },
      { label: 'Route attachment rejected', summary: 'Namespace boundaries block route attachment.', nodes: [n('HTTPRoute', 'Namespace app-team', 'cyan'), n('Gateway', 'Namespace infra', 'cyan'), n('allowedRoutes', 'namespaces: Same', 'purple'), n('Rejected', 'NotAllowedByListeners', 'red')], result: 'Namespace boundaries are security boundaries. The Gateway controls which namespaces can attach routes.', evidence: 'HTTPRoute status shows Accepted: False, reason: NotAllowedByListeners.', setting: 'Gateway.spec.listeners[].allowedRoutes.namespaces.' },
      { label: 'Cross-namespace backend', summary: 'Backend references across namespaces require explicit grants.', nodes: [n('HTTPRoute', 'Namespace A', 'cyan'), n('backendRef', 'Service in Namespace B', 'cyan'), n('No Grant', 'Missing ReferenceGrant', 'purple'), n('Rejected', 'ResolvedRefs: False', 'red')], result: 'Cross-namespace references require explicit permission from the target namespace.', evidence: 'HTTPRoute condition shows ResolvedRefs: False.', setting: 'ReferenceGrant in target namespace.' },
    ],
  },
  {
    id: 'v12', nav: 'TLS', title: '', kind: 'flow',
    question: 'Which component holds the private key, and what can the routing layer inspect?',
    scenarios: [
      { label: 'Terminate at Gateway', summary: 'The Gateway decrypts traffic and can route using HTTP request attributes.', nodes: [n('Client TLS', 'Encrypted', 'cyan'), n('Gateway', 'Holds listener certificate', 'purple'), n('Inspect', 'Reads host/path', 'cyan'), n('Backend hop', 'HTTP or separately secured', 'amber')], result: 'The client TLS connection ends at the Gateway. Backend transport is a separate decision and is not automatically plaintext in every implementation.', evidence: 'Gateway listener status and `tls.mode: Terminate` with valid certificateRefs establish the listener configuration.', setting: 'Gateway listener TLS termination plus explicit backend transport policy.' },
      { label: 'TLS passthrough', summary: 'The gateway routes based on SNI without decrypting.', nodes: [n('Client TLS', 'Encrypted', 'cyan'), n('Gateway SNI', 'Reads hostname only', 'purple'), n('Encrypted TCP', 'Forwarded untouched', 'cyan'), n('Pod terminates', 'Holds certificate', 'green')], result: 'Gateway cannot inspect HTTP content. Routing limited to SNI hostname. End-to-end encryption preserved.', evidence: 'Gateway listener has `tls.mode: Passthrough`, protocol: TLS.', setting: 'TLS passthrough mode.' },
      { label: 'Backend TLS', summary: 'The Gateway terminates the client connection and starts a separately authenticated TLS connection upstream.', nodes: [n('Client TLS', 'Encrypted', 'cyan'), n('Gateway terminates', 'Inspects HTTP', 'purple'), n('New TLS', 'Validates backend identity', 'amber'), n('Backend', 'Terminates upstream TLS', 'green')], result: 'The two TLS connections have separate certificates, policy, and failure modes. A Service `appProtocol` hint alone does not establish backend TLS trust.', evidence: 'Inspect the implementation’s supported BackendTLSPolicy status and verify the upstream handshake.', setting: 'Gateway listener termination plus supported BackendTLSPolicy configuration.' },
    ],
  },
  {
    id: 'v13', nav: 'Isolation', title: '', kind: 'signals',
    question: 'When does creating a NetworkPolicy actually change what traffic is allowed?',
    scenarios: [
      { label: 'No policy exists', summary: 'Default Kubernetes allows all traffic.', nodes: [n('Pod A', 'Initiates', 'cyan'), n('Pod B', 'Non-isolated', 'cyan'), n('Allowed', 'Default open', 'green')], result: 'Default Kubernetes is fully open. No policy means no restriction, not implicit deny.', evidence: '`kubectl get networkpolicy -A` returns nothing.', setting: 'No NetworkPolicy resources.' },
      { label: 'Ingress policy selects destination', summary: 'Selecting a Pod turns on implicit deny for it.', nodes: [n('Policy', 'Selects Pod B', 'purple'), n('Pod B', 'Becomes isolated', 'amber'), n('Pod A', 'Not in allow list', 'red'), n('Blocked', 'Connection drops', 'red')], result: 'Isolation applies only to the selected Pod and only in the specified direction.', evidence: '`kubectl describe networkpolicy deny-ingress` shows podSelector matching B.', setting: 'NetworkPolicy spec.podSelector + ingress rules.' },
      { label: 'Both sides isolated', summary: 'Egress and ingress are evaluated independently.', nodes: [n('Egress policy', 'On Pod A', 'purple'), n('Ingress policy', 'On Pod B', 'purple'), n('Both must allow', 'Independent checks', 'amber'), n('Success', 'If both pass', 'green')], result: 'Both directions are evaluated independently. Allowing one side is insufficient.', evidence: 'Both NetworkPolicies applied but connection still blocked if either rule is missing.', setting: 'Ingress policy on destination + egress policy on source.' },
    ],
  },
  {
    id: 'v14', nav: 'Selectors', title: '', kind: 'signals',
    question: 'Why does one YAML change turn a narrow allow into a wide-open rule?',
    scenarios: [
      { label: 'OR logic: two array elements', summary: 'Multiple array elements act as an OR.', nodes: [n('from array', 'Two elements', 'cyan'), n('Rule 1', 'podSelector app=web', 'purple'), n('Rule 2', 'namespace env=staging', 'purple'), n('Allowed', 'Any web OR any staging', 'red')], result: 'Array elements are OR\'d. This allows all Pods from the staging namespace, not just web Pods in staging.', evidence: 'A monitoring Pod in staging can reach this Service.', setting: 'NetworkPolicy ingress.from as array.' },
      { label: 'AND logic: single element', summary: 'Combining selectors in one element acts as an AND.', nodes: [n('from array', 'Single element', 'cyan'), n('Condition 1', 'app=web', 'purple'), n('Condition 2', 'env=staging', 'purple'), n('Allowed', 'Only web IN staging', 'green')], result: 'Both conditions must match. Much narrower than the OR version.', evidence: 'A monitoring Pod in staging is blocked.', setting: 'Combined podSelector + namespaceSelector in one from element.' },
      { label: 'ipBlock with except', summary: 'ipBlock matches CIDRs but except creates holes.', nodes: [n('cidr', '10.0.0.0/8', 'cyan'), n('except', '10.244.0.0/16', 'purple'), n('Result', 'Node IPs allowed, Pods blocked', 'green')], result: 'ipBlock operates on the actual source IP after any NAT. SNAT changes what matches.', evidence: 'Cross-node traffic may be SNATed to node IP, falling within the allowed range.', setting: 'ipBlock.cidr and ipBlock.except.' },
    ],
  },
  {
    id: 'v15', nav: 'DNS + policy', title: '', kind: 'flow',
    question: 'Why does default-deny egress break everything, including things that aren\'t network services?',
    scenarios: [
      { label: 'Default deny blocks DNS', summary: 'Egress block hits DNS first.', nodes: [n('egress: []', 'Deny all', 'purple'), n('Port 53', 'Blocked', 'red'), n('Name resolution', 'Fails completely', 'red'), n('App fails', 'Looks like network error', 'red')], result: 'DNS is the hidden dependency that breaks first. Even connecting by IP name requires resolution unless hardcoded.', evidence: '`nslookup kubernetes.default` times out.', setting: 'NetworkPolicy egress: [] (empty = deny all).' },
      { label: 'Allow DNS only', summary: 'DNS resolves but application traffic still drops.', nodes: [n('Rule 1', 'Allow DNS to kube-system', 'purple'), n('Resolution', 'Succeeds', 'green'), n('App traffic', 'Still blocked by default', 'red'), n('Timeout', 'During connection', 'amber')], result: 'DNS egress is necessary but not sufficient. Each backend needs its own egress rule.', evidence: '`nslookup api.default.svc` succeeds but `curl api:8080` times out.', setting: 'egress[0]: ports 53, to: namespaceSelector kube-system.' },
      { label: 'Minimal working policy', summary: 'App requires explicit egress rules for each dependency.', nodes: [n('Rule 1', 'DNS allowed', 'purple'), n('Rule 2', 'API allowed', 'purple'), n('Success', 'To existing API', 'green'), n('New service', 'Fails until policy updated', 'amber')], result: 'Principle of least privilege requires ongoing policy maintenance as dependencies change.', evidence: 'Connection to api service succeeds; connection to new logging service fails until policy updated.', setting: 'Multiple egress rules for DNS + specific backends.' },
    ],
  },
  {
    id: 'v16', nav: 'NAT + policy', title: '', kind: 'flow',
    question: 'Why can a NetworkPolicy ipBlock rule observe a different source address?',
    scenarios: [
      { label: 'Policy sees original source', summary: 'One implementation evaluates policy before a later source rewrite.', nodes: [n('Pod packet', 'Source 10.244.0.5', 'cyan'), n('Policy hook', 'Evaluates original source', 'purple'), n('Later NAT', 'May rewrite for next hop', 'amber'), n('Rule result', 'Matches Pod CIDR', 'green')], result: 'This ordering is possible, but Kubernetes does not require every implementation to place policy before NAT.', evidence: 'Policy counters and packet captures on both sides of the enforcement hook reveal the effective order.', setting: 'Network plugin, Service implementation, cloud path, and enforcement hook.' },
      { label: 'Policy sees rewritten source', summary: 'Another path can rewrite the source before policy evaluates the packet.', nodes: [n('Original client', '203.0.113.5', 'cyan'), n('Entry NAT', 'Source becomes proxy or Node', 'amber'), n('Policy hook', 'Evaluates observed source', 'purple'), n('Rule result', 'Original CIDR no longer matches', 'red')], result: 'Kubernetes leaves NAT ordering relative to NetworkPolicy undefined. Test the deployed path instead of assuming pre-NAT or post-NAT behavior.', evidence: 'Compare backend capture, policy logs or counters, and the external entry implementation’s source-preservation setting.', setting: 'Implementation-specific NAT and NetworkPolicy ordering.' },
      { label: 'Use workload selectors', summary: 'Pod and namespace selectors express an in-cluster workload relationship.', nodes: [n('namespaceSelector', 'team=payments', 'purple'), n('podSelector', 'app=client', 'purple'), n('Policy identity', 'Selects cluster workloads', 'cyan'), n('Allowed', 'No external CIDR guess', 'green')], result: 'Use workload selectors for ordinary in-cluster peers and reserve ipBlock for CIDR-based relationships, commonly outside the cluster.', evidence: 'Describe the policy and test from matching and non-matching Pods in representative namespaces.', setting: 'Combined namespaceSelector and podSelector in one peer entry.' },
    ],
  },
  {
    id: 'v17', nav: 'Connection', title: '', kind: 'flow',
    question: 'The connection times out. Which layer stopped the packet?',
    scenarios: [
      { label: 'App not listening', summary: 'The Pod phase alone does not prove that the expected socket is accepting connections.', nodes: [n('Pod Running', 'At least one container active', 'cyan'), n('Expected socket', 'Nothing bound to :8080', 'red'), n('Readiness', 'Should become false', 'amber'), n('Service backend', 'Eventually ineligible', 'purple'), n('Direct test', 'Refused or reset', 'red')], result: 'Start at the application listener. A Pod can remain Running while a sidecar is active, a child process has failed, or the app listens on the wrong address.', evidence: '`ss -lntp` in the application container and container status identify the listener and process state.', setting: 'Application bind address, container lifecycle, and readiness probe.' },
      { label: 'Port mismatch', summary: 'Service targetPort doesn\'t match container port.', nodes: [n('Service port 80', 'Client uses this', 'cyan'), n('targetPort 8080', 'DNAT rewrites to this', 'purple'), n('Container 3000', 'App listens here', 'red'), n('Refused', 'Nothing at 8080', 'red')], result: 'Three ports: Service port (what clients use), targetPort (what DNAT rewrites to), container port (what app listens on). targetPort must match container.', evidence: '`kubectl get svc api -o yaml` shows targetPort: 8080 but `ss` shows :3000.', setting: 'Service spec.ports[].targetPort vs container port.' },
      { label: 'Half-working NodePort', summary: 'Local traffic policy breaks NodePorts without local endpoints.', nodes: [n('Node A', 'Has local endpoint', 'cyan'), n('Node A NodePort', 'Works', 'green'), n('Node B', 'No local endpoint', 'amber'), n('Node B NodePort', 'Fails (Local policy)', 'red')], result: 'NodePort availability depends on endpoint locality when using Local traffic policy.', evidence: '`curl nodeA:30080` succeeds, `curl nodeB:30080` connection refused.', setting: 'externalTrafficPolicy: Local + no local endpoints.' },
    ],
  },
  {
    id: 'v18', nav: 'Overlay', title: '', kind: 'flow',
    question: 'Same-node Pods connect but cross-node Pods time out. What broke?',
    scenarios: [
      { label: 'VXLAN interface down', summary: 'The overlay tunnel entrance is missing.', nodes: [n('flannel.1', 'Interface down', 'red'), n('Same-node', 'Bridge forwarding works', 'green'), n('Cross-node', 'Dropped before tunnel', 'red'), n('Timeout', 'No path', 'red')], result: 'The overlay interface is the tunnel entrance. Without it, cross-node forwarding has no path.', evidence: '`ip link show flannel.1` returns \'Device not found\'.', setting: 'Flannel/Calico VXLAN interface.' },
      { label: 'Missing native route', summary: 'In this native-routing design, the source Node lacks a route for the remote Pod prefix.', nodes: [n('Route missing', '10.244.1.0/24 not in table', 'red'), n('Default gateway', 'Packet follows wrong route', 'amber'), n('Lost', 'Underlay cannot deliver it', 'red'), n('Timeout', 'Never reaches destination', 'red')], result: 'A native-routing implementation needs the appropriate Pod routes. An overlay or cloud-integrated datapath may represent remote reachability differently.', evidence: '`ip route show` plus the network implementation’s route or tunnel state reveals the missing path.', setting: 'Implementation-specific BGP, CNI route programming, tunnel, or cloud route state.' },
      { label: 'Firewall blocks VXLAN port', summary: 'Underlay firewalls block overlay tunnel traffic.', nodes: [n('UDP 4789', 'VXLAN port', 'cyan'), n('Blocked', 'Security group denies', 'red'), n('Same-node', 'Fine', 'green'), n('Cross-node', 'Timeout', 'red')], result: 'Overlay tunnels use specific UDP ports. Firewalls must allow inter-node tunnel traffic.', evidence: '`tcpdump -i eth0 udp port 4789` shows outgoing but no incoming on Node B.', setting: 'Security group / iptables rule for UDP 4789.' },
    ],
  },
  {
    id: 'v19', nav: 'iptables', title: '', kind: 'flow',
    question: 'How do you read the kube-proxy iptables chain hierarchy during an outage?',
    scenarios: [
      { label: 'Successful DNAT walk', summary: 'The chain structure is inspectable even though endpoint choice is probabilistic for a new connection.', nodes: [n('KUBE-SERVICES', 'Matches Service frontend', 'purple'), n('KUBE-SVC-XXXX', 'Enters Service chain', 'cyan'), n('Probability', 'Chooses one endpoint', 'amber'), n('KUBE-SEP-AAAA', 'Applies DNAT', 'cyan'), n('Postrouting', 'Masquerades when required', 'green')], result: 'The rule graph is deterministic; the selected backend is not. Conntrack then keeps packets in that connection on the established translation.', evidence: '`iptables-save -t nat` shows the Service and endpoint chains for iptables mode.', setting: 'kube-proxy mode=iptables; other proxy modes use different evidence.' },
      { label: 'Service deleted, conntrack stale', summary: 'Deleted Services can still serve existing flows.', nodes: [n('Service deleted', 'Chain removed', 'purple'), n('New connection', 'No match, unreachable', 'red'), n('Old connection', 'Conntrack remembers', 'amber'), n('Works temporarily', 'Until timeout', 'cyan')], result: 'Chain removal is immediate. Conntrack cleanup is eventual. Stale connections persist until timeout.', evidence: '`conntrack -L -d 10.96.45.3` shows entries despite no Service.', setting: 'conntrack timeout values.' },
      { label: 'Rule count explosion', summary: 'Too many Services slow down iptables sync.', nodes: [n('15000+ rules', 'Huge chain list', 'amber'), n('Sync slow', 'Takes seconds', 'red'), n('Latency spike', 'During updates', 'red')], result: 'iptables mode scales linearly. Large clusters should consider nftables or eBPF replacements.', evidence: '`iptables -t nat -L | wc -l` shows tens of thousands of rules.', setting: 'kube-proxy --iptables-sync-period.' },
    ],
  },
  {
    id: 'v20', nav: 'Compound', title: '', kind: 'fleet',
    question: 'Which layer broke first when multiple systems changed at once?',
    scenarios: [
      { label: 'Poor shutdown during rollout', summary: 'A fast process exit can outrun endpoint and proxy convergence.', nodes: [n('Rolling update', 'Old Pod gets deletion timestamp', 'cyan'), n('EndpointSlice', 'terminating=true, ready=false', 'purple'), n('Consumers', 'Reconcile on their schedules', 'amber'), n('Process exits', 'Before drain completes', 'red'), n('Requests fail', 'During the gap', 'red')], result: 'A rollout need not cause errors, but shutdown, readiness, endpoint propagation, load-balancer health, and connection draining must be designed as one timeline.', evidence: 'Correlate Pod lifecycle events, EndpointSlice conditions, proxy metrics, and request failures by timestamp.', setting: 'Readiness, preStop behavior, termination grace period, rollout strategy, and entry-controller draining.' },
      { label: 'Headless DNS + backend change', summary: 'A cached headless answer can retain an old Pod address after membership changes.', nodes: [n('Headless lookup', 'Returns Pod IPs', 'purple'), n('Client cache', 'Keeps old answer', 'amber'), n('Endpoint changes', 'Old Pod leaves', 'cyan'), n('Existing connection', 'Has separate lifetime', 'amber'), n('Refresh + reconnect', 'Uses current endpoints', 'green')], result: 'DNS caching matters for headless Services because answers contain endpoint addresses. For a normal ClusterIP Service, selector changes do not change the stable DNS answer.', evidence: 'Compare the Service form, DNS answer TTL, current EndpointSlices, and the destination of existing connections.', setting: 'Headless Service DNS TTL, client cache, and application connection pooling.' },
      { label: 'Policy + routing compound', summary: 'Both ingress and egress policies must be fixed.', nodes: [n('Ingress blocked', 'Namespace B denies A', 'red'), n('Fix ingress', 'Operator allows', 'cyan'), n('Egress blocked', 'Namespace A still denies', 'red'), n('Still blocked', 'Must fix both', 'red'), n('Success', 'When both allow', 'green')], result: 'Compound policy failures require checking both source egress and destination ingress. DNS success proves nothing about connectivity.', evidence: '`dig` succeeds but `curl` times out; both policies must allow.', setting: 'Ingress NetworkPolicy in B + egress NetworkPolicy in A.' },
    ],
  },
];

const teaching = [
  ['Build the network', 'What does the cluster do when a new Pod needs an IP address? Start with how a single Pod gets its identity.'],
  ['Same node', 'How does a packet travel between two Pods on the same machine? Watch how traffic avoids the wider network.'],
  ['Cross node', 'How does a packet reach a Pod on a different machine? Explore routing and encapsulation.'],
  ['MTU', 'When does encapsulation overhead silently break large packets? See why small packets work while big ones vanish.'],
  ['ClusterIP', 'How does kube-proxy redirect traffic addressed to a virtual Service IP? Follow the destination rewrite.'],
  ['Endpoints', 'What triggers a change in the endpoints available to a Service? See how readiness gates traffic.'],
  ['DNS', 'How many queries can one name resolution produce? Follow the resolver’s configured search behavior without assuming a fixed count.'],
  ['DNS edge cases', 'Which DNS configuration breaks silently until production traffic hits it? Spot the hidden bottlenecks.'],
  ['Traffic policy', 'How does traffic policy change which backends can receive a connection? Separate a hard Local constraint from softer topology preferences.'],
  ['Source IP', 'Where does the client address get replaced, and what sees the replacement? Trace NAT transformations.'],
  ['Gateway API', 'Which status condition tells you where the Gateway API request path broke? Read from the infrastructure inward.'],
  ['TLS', 'Which component holds the private key, and what can the routing layer inspect? Compare termination with passthrough.'],
  ['Isolation', 'When does creating a NetworkPolicy actually change what traffic is allowed? Default open vs explicit deny.'],
  ['Selectors', 'Why does one YAML change turn a narrow allow into a wide-open rule? See how arrays change logic.'],
  ['DNS + policy', 'Why does default-deny egress often make DNS the first visible failure? Account for the dependencies an application needs before it can connect.'],
  ['NAT + policy', 'Which source address does an ipBlock rule actually evaluate? Inspect the deployed order instead of assuming pre-NAT or post-NAT behavior.'],
  ['Connection', 'The connection times out. Which layer stopped the packet? Differentiate routing failures from app crashes.'],
  ['Overlay', 'Same-node Pods connect but cross-node Pods time out. What broke? Troubleshoot the tunnel.'],
  ['iptables', 'How do you read the kube-proxy iptables chain hierarchy during an outage? Follow the probability rules.'],
  ['Compound', 'Which layer broke first when multiple systems changed at once? Untangle overlapping incidents.']
];

const explanations: Record<string, string[][]> = {
  "v01": [
    ["Kubelet requests a new Pod sandbox through the Container Runtime Interface (CRI).", "The container runtime creates the sandbox and, in this Linux example, its network namespace.", "The runtime invokes the configured CNI plugin chain with an ADD request.", "This example's IPAM implementation reserves 10.244.1.15 from its configured pool.", "The plugin creates the veth attachment and configures the Pod-side interface and routes."],
    ["Kubelet requests the sandbox creation as usual.", "The network namespace is created and waiting.", "The CNI ADD command fires to wire up the network.", "The local IPAM range is exhausted, so no IP is available and the process fails."],
    ["Kubelet attempts to set up the sandbox.", "The runtime reads its configuration to find the CNI plugin.", "It searches the configured binary path, usually /opt/cni/bin.", "The required binary is not found, leaving the Pod without a network attachment."]
  ],
  "v02": [
    ["The Pod sends a packet to a peer address on the same Node.", "The packet crosses the Pod-side interface and host-side veth peer.", "In this example, cni0 looks up the destination MAC address in its forwarding database.", "The bridge sends the frame through the peer connected to Pod B.", "Pod B receives the packet without an underlay hop."],
    ["The source Pod sends the packet through its interface.", "An eBPF program attached at a kernel hook observes it.", "The implementation redirects the packet toward the local destination without using a Linux bridge.", "The target Pod receives the packet; the exact hooks and route processing remain implementation-specific."],
    ["The Pod declares hostNetwork and shares the Node network namespace.", "It uses Node interfaces and addresses rather than an ordinary Pod veth attachment.", "Its processes share the Node port space and can conflict with host or other host-network processes.", "ClusterFirstWithHostNet is available when the Pod should use cluster-first DNS behavior."]
  ],
  "v03": [
    ["The Pod originates a packet to a destination on another node.", "The host routing table knows that the destination Pod CIDR is reachable via Node B.", "The packet is forwarded at layer 3 without any encapsulation.", "Node B receives it and routes it locally to the target veth interface.", "The target Pod receives the unencapsulated packet."],
    ["The Pod originates the inner packet.", "The flannel/vxlan interface encapsulates it in a UDP VXLAN header.", "The outer packet uses the node IPs to cross the underlay network.", "Node B receives the UDP packet and decapsulates the inner payload.", "The target Pod receives the original inner packet."],
    ["The network implementation allocates a Pod address from the VPC subnet.", "The cloud fabric routes that address without a VXLAN overlay.", "By default in this AWS VPC CNI example, Pods share security groups associated with the Node ENIs; per-Pod groups require a separate feature.", "Subnet addresses, ENI capacity, prefix delegation, and optional branch interfaces constrain density differently."]
  ],
  "v04": [
    ["The application emits an illustrative 1500-byte inner packet.", "The tunnel adds headers whose size depends on IP family, encapsulation, and optional encryption.", "The result exceeds this example's 1500-byte underlay MTU.", "The network must fragment, return a packet-too-big signal, or drop the packet according to the real path and configuration."],
    ["The application sends a 1500-byte packet which hits the MTU limit.", "A router sends back an ICMP 'Fragmentation Needed' message.", "The sender adjusts its Path MTU cache to the lower size.", "The retransmitted packet succeeds at 1450 bytes."],
    ["The application sends a 1500-byte packet which exceeds MTU.", "The ICMP reply is dropped by an overzealous firewall.", "The sender never learns the true MTU and keeps retrying the large packet.", "The connection hangs indefinitely, though small packets still work."]
  ],
  "v05": [
    ["The client Pod initiates a connection to a virtual ClusterIP.", "The PREROUTING chain matches the traffic against the KUBE-SERVICES rules.", "A probability rule selects a specific backend (KUBE-SEP) for load balancing.", "The kernel rewrites the destination IP and port to the actual Pod.", "The target Pod receives the traffic."],
    ["The client initiates a connection to the ClusterIP.", "The traffic matches the KUBE-SERVICES chain.", "No backend rules exist because the Service has no ready endpoints.", "The connection is explicitly rejected or dropped by the node."],
    ["A backend Pod dies, and kube-proxy updates iptables to remove it.", "An existing TCP connection sends another packet.", "The connection tracking (conntrack) table remembers the old destination.", "The packet routes to the dead IP and times out."]
  ],
  "v06": [
    ["The Pod's readiness condition becomes true.", "The EndpointSlice controller updates the published endpoint's ready condition.", "The installed Service proxy reconciles that endpoint state into its own data plane.", "The endpoint becomes eligible for ordinary new Service connections after that reconciliation."],
    ["The Pod receives a deletion timestamp and begins termination.", "The controller exposes terminating=true and ready=false while serving can remain true.", "Service proxies normally avoid the endpoint for ordinary new traffic, with documented fallback when every endpoint is terminating.", "Existing connections and application draining follow their own lifetimes.", "The endpoint disappears after the Pod is deleted."],
    ["New Pods are deployed with a different label.", "The Service selector was not updated to match.", "The EndpointSlice controller ignores the new Pods.", "Traffic continues to flow only to the old Pods matching the selector."]
  ],
  "v07": [
    ["The application queries a short name with fewer dots than the ndots threshold.", "The resolver appends the first search suffix.", "CoreDNS matches the full internal name.", "The query succeeds in a single round trip."],
    ["The application gives its resolver an external-looking name that is below the example ndots threshold.", "The resolver can try one or more search-expanded names according to its search list.", "Negative answers cause the resolver to continue according to its own algorithm.", "The resolver eventually asks for the absolute name; the exact sequence and count are not fixed by Kubernetes."],
    ["The Service is configured as headless with clusterIP: None.", "CoreDNS returns the individual Pod IPs directly.", "The client receives multiple A records.", "The client selects one and connects directly without kube-proxy DNAT."]
  ],
  "v08": [
    ["The Pod initiates a DNS query.", "Traffic routes to a special link-local IP on the node.", "A local DaemonSet answers directly from memory.", "No cross-node UDP traffic or conntrack entries are created."],
    ["A strict NetworkPolicy blocks all egress by default.", "The Pod attempts a DNS query to kube-dns.", "The policy drops the UDP packet.", "The application times out, making it look like a general network failure."],
    ["The application includes a trailing dot in its query.", "An ordinary DNS resolver treats the name as absolute.", "Search suffixes are not appended, although retries and record-type lookups can still produce multiple exchanges."]
  ],
  "v09": [
    ["The Service uses the default Cluster traffic policy.", "Node A contributes one ready endpoint.", "Node B contributes two ready endpoints.", "All three are eligible, but connection reuse, affinity, and proxy behavior mean request distribution need not be even."],
    ["The Service uses the Local traffic policy.", "A client on Node A can use its ready local endpoint.", "Node C has no ready local endpoint.", "kube-proxy drops traffic on Node C rather than falling back to a remote endpoint."],
    ["External traffic reaches a Node for a Service using Local policy.", "The receiving Node needs an eligible local endpoint.", "Avoiding the extra Node hop can avoid the common source-NAT path.", "The backend source address must still be verified against the load-balancer and Service implementation."]
  ],
  "v10": [
    ["In this common NodePort path, an external connection lands on Node A.", "Node A source-NATs traffic that it forwards to another Node.", "The translated connection reaches a backend Pod on Node B.", "The backend observes Node A as the transport source; provider and proxy implementations can differ."],
    ["An external connection lands on a Node with a local endpoint.", "Local policy keeps this Service hop on the receiving Node.", "The common kube-proxy path can avoid source NAT here.", "The backend can observe the client source when the surrounding load balancer also preserves it."],
    ["A layer 7 proxy terminates the client connection.", "A trusted proxy can add the original client address to Forwarded or X-Forwarded-For.", "The separate upstream connection has the proxy as its transport source.", "The application must trust only headers supplied by known proxies and parse them correctly."]
  ],
  "v11": [
    ["A controller accepts the GatewayClass.", "The Gateway listener reports Accepted and Programmed for the current generation.", "The HTTPRoute reports Accepted for the intended parent and listener.", "ResolvedRefs confirms that the backend reference exists and is permitted.", "An end-to-end request confirms that the programmed data plane is actually reachable."],
    ["The HTTPRoute is in the app-team namespace.", "The Gateway is in the infra namespace.", "The Gateway only allows routes from its own namespace.", "The route is rejected for crossing namespace boundaries."],
    ["The HTTPRoute is in Namespace A.", "It points to a Service in Namespace B.", "Namespace B has no ReferenceGrant allowing this.", "The reference is rejected as insecure."]
  ],
  "v12": [
    ["The client initiates a TLS connection.", "The Gateway terminates that connection using the listener certificate.", "It can inspect HTTP attributes and choose a route.", "The upstream hop uses whatever backend transport the implementation and policy configure; it is a separate security boundary."],
    ["The client initiates a TLS connection.", "The Gateway reads only the SNI hostname from the unencrypted handshake.", "It forwards the encrypted TCP stream unmodified.", "The backend Pod holds the certificate and terminates the TLS."],
    ["The client initiates TLS to the Gateway.", "The Gateway terminates that connection and inspects the HTTP request.", "It starts a distinct TLS connection and validates the configured backend identity.", "The backend terminates the upstream connection using its own certificate."]
  ],
  "v13": [
    ["Pod A initiates a connection.", "Pod B has no NetworkPolicy selecting it.", "Traffic is allowed because default behavior is open."],
    ["A NetworkPolicy selects Pod B, isolating it for ingress.", "Pod B is now isolated and implicitly denies unmatched traffic.", "Pod A is not explicitly allowed.", "The connection is blocked by the policy."],
    ["An egress policy restricts Pod A.", "An ingress policy restricts Pod B.", "Both policies must explicitly allow the connection.", "The connection succeeds only if both sides agree."]
  ],
  "v14": [
    ["The from block uses multiple array elements.", "One element allows the web label.", "Another element allows the staging namespace.", "Traffic is allowed from any web Pod OR any Pod in staging."],
    ["The from block uses a single array element.", "It specifies both a podSelector and a namespaceSelector.", "They are combined with logical AND.", "Traffic is allowed only from web Pods IN the staging namespace."],
    ["The ipBlock specifies a broad CIDR.", "The except field carves out a subset.", "It allows traffic from node IPs but blocks the Pod network."]
  ],
  "v15": [
    ["A NetworkPolicy drops all egress traffic.", "The DNS query on port 53 is blocked.", "Name resolution completely fails.", "The application fails because it can't resolve endpoints."],
    ["An egress rule explicitly allows DNS.", "Name resolution now succeeds.", "But traffic to the resolved IPs is still blocked by default.", "Connections time out during establishment."],
    ["The policy allows DNS.", "The policy also explicitly allows the API dependency.", "Traffic flows to the existing service.", "New dependencies will fail until the policy is updated again."]
  ],
  "v16": [
    ["A Pod sends a packet using its Pod source address.", "This implementation evaluates NetworkPolicy before a later translation point.", "A subsequent hop may still rewrite the address.", "The CIDR rule therefore matched the original source in this particular path."],
    ["An external client begins with its own source address.", "An entry proxy or Node rewrites the source before the enforcement point.", "The policy evaluates the address it observes at that point.", "A rule written for the original client range does not match."],
    ["The policy first narrows callers to namespaces with the intended label.", "A Pod selector in the same peer entry further narrows that set.", "The policy expresses an in-cluster workload relationship rather than a transient Pod address.", "Matching workloads are allowed without relying on an external CIDR rule."]
  ],
  "v17": [
    ["The Pod phase is Running because at least one container remains active.", "No process is listening on the expected application socket.", "A suitable readiness check becomes false.", "EndpointSlice and Service-proxy consumers converge on making that backend ineligible.", "A direct connection helps separate listener failure from Service and DNS state."],
    ["The Service defines port 80 for clients.", "It rewrites the destination to targetPort 8080.", "The container process actually listens on 3000.", "The connection is refused because nothing listens on 8080."],
    ["Node A has a local backend Pod.", "Node A's NodePort works properly.", "Node B has no local backend Pods.", "Node B's NodePort fails because the Local policy prevents cross-node forwarding."]
  ],
  "v18": [
    ["The vxlan/flannel interface is missing or down.", "Same-node traffic still works via bridge forwarding.", "Cross-node traffic is dropped before entering the tunnel.", "Connections time out."],
    ["The routing table lacks an entry for the remote Pod CIDR.", "Packets are sent to the default gateway.", "The underlay network drops them as unroutable.", "Connections time out."],
    ["UDP port 4789 is used for VXLAN encapsulation.", "A cloud security group blocks this port between nodes.", "Same-node traffic works fine.", "Cross-node traffic times out because tunnels are blocked."]
  ],
  "v19": [
    ["The iptables Service rules match the configured frontend.", "Traffic enters the chain generated for that Service and port.", "A statistic rule chooses one endpoint for the new connection.", "The endpoint chain applies destination NAT.", "Postrouting applies masquerading only when the path requires it."],
    ["The Service is deleted and its chains are removed.", "New connections fail immediately.", "Conntrack keeps existing flows active.", "Traffic temporarily continues until the flow times out."],
    ["Thousands of Services create tens of thousands of rules.", "kube-proxy takes longer to sync changes.", "Latency spikes occur during mass updates."]
  ],
  "v20": [
    ["A rollout gives an old Pod a deletion timestamp.", "EndpointSlice exposes terminating state while readiness becomes false.", "Service proxies and entry controllers reconcile that change on their own schedules.", "The process exits before every relevant drain and connection has completed.", "Requests can fail during that poorly coordinated interval; the rollout itself does not require an outage."],
    ["A headless Service lookup returns endpoint addresses rather than one stable ClusterIP.", "The client keeps an older DNS answer according to its cache behavior.", "EndpointSlice membership changes while that answer remains cached.", "Existing application connections have a separate lifetime from the DNS record.", "A later lookup and new connection use the current endpoint set."],
    ["Namespace B applies an ingress policy blocking Namespace A.", "The operator fixes the ingress policy.", "Namespace A has a restrictive egress policy.", "Traffic is still blocked.", "Success requires both sides to allow it."]
  ]
};

for (const [index, lab] of labs.entries()) {
  lab.title = teaching[index][0];
  lab.introduction = teaching[index][1];
  const paths = explanations[lab.id];
  if (paths.length !== lab.scenarios.length) throw new Error('Missing scenario explanations: ' + lab.id);
  lab.scenarios.forEach((scenario, scenarioIndex) => {
    const copy = paths[scenarioIndex];
    if (copy.length !== scenario.nodes.length) throw new Error('Missing step explanations: ' + lab.id + '/' + scenario.label);
    scenario.nodes.forEach((node, nodeIndex) => { node.explanation = copy[nodeIndex]; });
  });
}

labs[0].scenarios.unshift({
  label: 'Start here: one container',
  summary: 'Build the system one piece at a time. Follow a container listening on a port before introducing the network namespace.',
  nodes: [
    { label: 'One container', detail: 'Listens on a port', tone: 'cyan', explanation: 'A container is an isolated Linux process. If it binds to a port, it needs a network interface to receive traffic.' },
    { label: 'Pod sandbox', detail: 'Shared environment', tone: 'cyan', explanation: 'Kubernetes groups containers into Pods. They share a single network namespace so they can communicate over localhost.' },
    { label: 'Routable IP', detail: 'Needs cluster identity', tone: 'purple', explanation: 'To talk to other Pods, the Pod needs its own IP address that the rest of the cluster can route to.' },
    { label: 'CNI Plugin', detail: 'Wires the network', tone: 'amber', explanation: 'The Container Network Interface (CNI) plugin is responsible for connecting the Pod namespace to the node\'s network.' },
    { label: 'Ready', detail: 'Can send and receive', tone: 'green', explanation: 'Once wired, the Pod has a full network identity and can participate in cluster traffic.' }
  ],
  result: 'A container becomes part of a Pod, which receives an IP through CNI to participate in the cluster network.',
  evidence: 'This worked example assumes one application container joining a Pod sandbox.',
  setting: 'Pod spec with one container; kubelet requests network setup from CRI and CNI.',
});
