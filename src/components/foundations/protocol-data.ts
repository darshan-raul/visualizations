export type ProtocolView = {
  id: string;
  group: string;
  label: string;
  title: string;
  question: string;
  inspector: string;
  takeaway: string;
  caveat: string;
  stages: { label: string; detail: string; state?: 'ready' | 'warn' | 'fail' }[];
  evidence: string;
  failureLabel: string;
  failure: string;
};

export type ProtocolTopic = {
  id: string;
  title: string;
  kicker: string;
  summary: string;
  objectLabel: string;
  format: string;
  reference: string;
  sources: { label: string; url: string }[];
  related: { label: string; href: string }[];
  views: ProtocolView[];
};

export const protocolTopics: Record<string, ProtocolTopic> = {
  networking: {
    id: 'networking', title: 'Networking, Illustrated', kicker: 'FOUNDATIONS · PACKET JOURNEY',
    summary: 'Follow one HTTPS request from a hostname on a laptop to a server, and see which layer makes each decision.',
    objectLabel: 'HTTPS · app.example.test · 10.20.10.25:51514 → 203.0.113.80:443', format: 'FLOW EXPLORER · FOUNDATIONAL', reference: 'CLIENT · client.lab.example',
    sources: [
      { label: 'RFC 1122 — Internet host requirements', url: 'https://www.rfc-editor.org/rfc/rfc1122' },
      { label: 'RFC 9293 — Transmission Control Protocol', url: 'https://www.rfc-editor.org/rfc/rfc9293' },
      { label: 'RFC 1034 — DNS concepts and facilities', url: 'https://www.rfc-editor.org/rfc/rfc1034' },
      { label: 'RFC 5737 — IPv4 documentation blocks', url: 'https://www.rfc-editor.org/rfc/rfc5737' },
    ],
    related: [{ label: 'Linux networking', href: '/linux/networking' }, { label: 'Kubernetes networking', href: '/k8s-networking' }, { label: 'VPC packet flow', href: '/vpc-flow' }],
    views: [
      { id: 'packet-journey', group: 'Follow the request', label: 'Packet journey', title: 'One request crosses several decision points', question: 'What happens after an application asks for app.example.test?', inspector: 'DNS supplies an address before TCP begins. The client then selects a route and a next-hop link address; routers repeat forwarding decisions at each hop.', takeaway: 'A network request is one application intent carried through several layer-specific decisions.', caveat: 'The diagram keeps TLS and internet-provider routing outside the frame. 203.0.113.80 and 198.51.100.0/24 are documentation-only addresses.', stages: [{ label: 'Resolve', detail: 'DNS returns 203.0.113.80' }, { label: 'Route', detail: 'client selects gateway 10.20.10.1' }, { label: 'Neighbor', detail: 'ARP resolves the gateway MAC' }, { label: 'Forward', detail: 'frame crosses the local link and gateway' }, { label: 'NAT', detail: 'configured edge rewrites source tuple' }, { label: 'Deliver', detail: 'server receives TCP port 443' }], evidence: 'Illustrative DNS answer: app.example.test A 203.0.113.80', failureLabel: 'Simulate DNS failure', failure: 'The resolver has no usable answer. No TCP SYN is sent because the application does not yet have a destination address.' },
      { id: 'encapsulation', group: 'Follow the request', label: 'Headers on the wire', title: 'Each layer adds the address it owns', question: 'Which address matters to the next device, and which one identifies the final peer?', inspector: 'The Ethernet frame is only for the current local link. The IP packet carries the end-to-end destination, while TCP identifies the receiving transport endpoint.', takeaway: 'MAC addresses reach the next hop; IP addresses guide the packet across hops; ports select an endpoint.', caveat: 'The exact link layer changes across a path. A router removes the incoming frame and builds a new frame for its outgoing link.', stages: [{ label: 'Application', detail: 'HTTPS request bytes' }, { label: 'TCP segment', detail: '51514 → 443' }, { label: 'IP packet', detail: '10.20.10.25 → 203.0.113.80' }, { label: 'Ethernet frame', detail: '02:11:…:25 → gateway MAC' }], evidence: '$ ip route get 203.0.113.80\n… via 10.20.10.1 dev eth0 src 10.20.10.25', failureLabel: 'Show missing neighbor', failure: 'The route is valid, but the host cannot resolve the gateway’s link-layer address. Local delivery waits or fails before the frame can leave.' },
      {
        id: 'cidr', group: 'Address and local link', label: 'CIDR and locality', title: 'The prefix decides what is local', question: 'Does 203.0.113.80 live on the client’s link?',
        inspector: 'The client has 10.20.10.25/24, so its directly connected subnet is 10.20.10.0/24. A destination outside it needs a route through a next hop. A prefix describes a network range, not a physical wire.',
        takeaway: 'Prefix length divides the address space; the route table decides what to do with a destination.',
        caveat: 'IPv6 uses prefixes too, but its address and neighbor behavior differs. Broadcast is an IPv4 local-link concept.',
        stages: [{ label: 'Client IP', detail: '10.20.10.25/24' }, { label: 'Network bits', detail: 'first 24 bits identify 10.20.10.0/24' }, { label: 'Local peer', detail: '10.20.10.80 fits that prefix' }, { label: 'Remote peer', detail: '203.0.113.80 does not fit' }],
        evidence: 'Illustrative: 10.20.10.25/24 → connected route 10.20.10.0/24', failureLabel: 'Show wrong prefix', failure: 'A misconfigured prefix can make the host treat a remote peer as on-link and attempt neighbor resolution instead of using the intended gateway.'
      },
      {
        id: 'arp', group: 'Address and local link', label: 'ARP to the next hop', title: 'The first frame targets the gateway, not the server', question: 'What MAC address goes into the Ethernet destination field?',
        inspector: 'After route selection, the host resolves the selected IPv4 next hop with ARP on the local link. The outgoing frame uses the gateway’s MAC; the IP packet still names 203.0.113.80.',
        takeaway: 'ARP resolves a local next hop. It does not discover the remote server’s Ethernet address across routers.',
        caveat: 'This is IPv4 over Ethernet. IPv6 uses Neighbor Discovery instead of ARP.',
        stages: [{ label: 'Route', detail: 'selected next hop 10.20.10.1' }, { label: 'ARP request', detail: 'who has 10.20.10.1?' }, { label: 'ARP reply', detail: '02:aa:bb:cc:dd:01' }, { label: 'Frame', detail: 'destination MAC is gateway MAC' }],
        evidence: 'Illustrative neighbor record: 10.20.10.1 → 02:aa:bb:cc:dd:01', failureLabel: 'Drop ARP reply', failure: 'The route exists but the gateway cannot be resolved on this link, so the first frame cannot be sent to that next hop.'
      },
      { id: 'forwarding', group: 'Make a decision', label: 'Route and NAT', title: 'Forwarding chooses the most specific route', question: 'Why does this destination use a specific gateway?', inspector: 'The deliberately overlapping route table selects 203.0.113.64/26 for 203.0.113.80. That beats 203.0.113.0/24 and the default route. Only then does the host resolve the selected next hop’s link address.', takeaway: 'Route selection happens before neighbor resolution; the longest matching prefix wins.', caveat: 'NAT is a separate transformation at a configured edge. It is not performed by every router, and the translation state depends on that device.', stages: [{ label: 'Lookup', detail: '203.0.113.80 matches /26, /24, and default' }, { label: 'Next hop', detail: '/26 selects 10.20.10.1 on eth0' }, { label: 'Neighbor', detail: 'Resolve that next hop’s link address' }, { label: 'NAT', detail: 'A later configured edge may rewrite the source tuple' }], evidence: 'Illustrative route table: 203.0.113.64/26 via 10.20.10.1', failureLabel: 'Show no matching route', failure: 'If all matching routes, including the default, are removed, the host stops before neighbor resolution.' },
      {
        id: 'tcp', group: 'Transport endpoints', label: 'TCP and UDP', title: 'TCP establishes a connection before application data', question: 'What does TCP add to this HTTPS request?',
        inspector: 'The client sends SYN, receives SYN-ACK, and returns ACK before exchanging stream data. TCP numbers bytes and acknowledges delivery; UDP carries independent datagrams without a transport handshake.',
        takeaway: 'TCP connection state and retransmission are transport responsibilities; they do not repair missing routes or application failures.',
        caveat: 'This is a simplified three-way handshake. TLS begins after transport setup, and modern clients may choose QUIC over UDP for some HTTPS traffic.',
        stages: [{ label: 'SYN', detail: 'client asks to open a TCP connection' }, { label: 'SYN-ACK', detail: 'server acknowledges and responds' }, { label: 'ACK', detail: 'client completes handshake' }, { label: 'Data', detail: 'application bytes flow in the TCP stream' }],
        evidence: 'Illustrative socket state: SYN-SENT → ESTABLISHED', failureLabel: 'Drop SYN-ACK', failure: 'The client retransmits according to TCP behavior; a route or policy problem can leave it waiting before application data is exchanged.'
      },
      {
        id: 'socket', group: 'Transport endpoints', label: 'Socket and 5-tuple', title: 'A five-tuple distinguishes this connection', question: 'How does the server know which application endpoint should receive it?',
        inspector: 'For this TCP flow, protocol, source IP and port, and destination IP and port distinguish the transport conversation. The server needs a listener on the destination address/port; a successful DNS lookup says nothing about that listener.',
        takeaway: 'An IP address identifies a host/interface context; a port and protocol identify transport endpoints.',
        caveat: 'A socket can bind a specific address or a wildcard; operating-system connection tracking and proxying can add additional state.',
        stages: [{ label: 'Protocol', detail: 'TCP' }, { label: 'Source', detail: '10.20.10.25:51514' }, { label: 'Destination', detail: '203.0.113.80:443' }, { label: 'Listener', detail: 'server process accepts port 443' }],
        evidence: 'Illustrative: TCP 10.20.10.25:51514 → 203.0.113.80:443', failureLabel: 'Close listener', failure: 'A reachable host can reject a connection when no process is listening on the selected destination port.'
      },
      {
        id: 'nat', group: 'Make a decision', label: 'NAT transformation', title: 'NAT rewrites a tuple at a configured edge', question: 'Which fields change when the private client reaches the outside network?',
        inspector: 'In this source-NAT example, the edge maps 10.20.10.25:51514 to 198.51.100.25:62001. Return traffic uses that mapping to find the private client. The remote destination and its port stay the same in this example.',
        takeaway: 'NAT changes selected address or port fields; routing and filtering remain separate decisions.',
        caveat: 'This is an illustrative NAPT mapping, not a universal requirement for IP communication. Both public addresses shown are documentation blocks.',
        stages: [{ label: 'Inside tuple', detail: '10.20.10.25:51514' }, { label: 'Mapping', detail: 'edge allocates 198.51.100.25:62001' }, { label: 'Outside tuple', detail: 'destination remains 203.0.113.80:443' }, { label: 'Reply', detail: 'edge applies reverse mapping' }],
        evidence: 'Illustrative mapping: 10.20.10.25:51514 ↔ 198.51.100.25:62001', failureLabel: 'Expire mapping', failure: 'Without matching translation state, a later reply cannot be mapped back to this private flow.'
      },
      {
        id: 'dns', group: 'Discovery and policy', label: 'DNS lookup', title: 'DNS returns data before transport starts', question: 'How did the client learn 203.0.113.80?',
        inspector: 'The application asks a resolver, which may answer from cache or query the DNS hierarchy. An A record supplies an IPv4 address; TTL bounds how long a cached answer may be reused. The later TCP packet does not pass through DNS.',
        takeaway: 'DNS discovers a destination; it is not a forwarding hop for the application packet.',
        caveat: 'Resolver behavior, search paths, multiple answers, IPv6 AAAA records, and connection reuse can change observed requests.',
        stages: [{ label: 'Query', detail: 'ask for app.example.test A' }, { label: 'Cache', detail: 'reuse valid response if present' }, { label: 'Authority', detail: 'otherwise follow delegation to an answer' }, { label: 'Answer', detail: '203.0.113.80 with TTL' }],
        evidence: 'Illustrative DNS record: app.example.test. 300 IN A 203.0.113.80', failureLabel: 'Show stale answer', failure: 'A cached address may continue to be used until its TTL expires even after the authoritative record changes.'
      },
      {
        id: 'firewall', group: 'Discovery and policy', label: 'Filter and state', title: 'A firewall evaluates packets at its own boundary', question: 'Why can a SYN fail while a later reply is allowed?',
        inspector: 'A stateful firewall can remember an allowed flow and classify return packets using connection state. A stateless rule set evaluates each packet independently. Policy order, direction, and location determine where a packet first fails.',
        takeaway: 'A filter decision depends on rule context and connection state, not just the destination IP.',
        caveat: 'Different firewalls implement state and timeout behavior differently. A silent drop and an active rejection produce different client evidence.',
        stages: [{ label: 'New SYN', detail: 'evaluate ingress/egress policy' }, { label: 'Allow', detail: 'record accepted connection state' }, { label: 'Reply', detail: 'match established flow' }, { label: 'Drop', detail: 'unmatched or denied packet stops here' }],
        evidence: 'Illustrative policy: allow TCP destination 443; allow established replies', failureLabel: 'Drop new SYN', failure: 'A silent drop leaves the client waiting in SYN-SENT; the server may see no request at all.'
      },
      {
        id: 'load-balancer', group: 'Discovery and policy', label: 'L4 versus L7', title: 'Load balancing chooses an endpoint using different evidence', question: 'What can a transport balancer know that an HTTP balancer cannot—and vice versa?',
        inspector: 'An L4 balancer can use addresses, ports, protocol and connection state. An L7 HTTP balancer can inspect application attributes such as host and path once it terminates or parses that protocol. Both need healthy eligible targets.',
        takeaway: 'The layer of inspection determines the routing criteria and the connection behavior a balancer can implement.',
        caveat: 'Products vary in TLS handling, source-IP preservation, connection reuse, and health-check implementation.',
        stages: [{ label: 'L4 input', detail: 'IP, port, protocol, connection' }, { label: 'L4 choice', detail: 'eligible backend for the flow' }, { label: 'L7 input', detail: 'HTTP host/path after protocol inspection' }, { label: 'L7 choice', detail: 'route to matching healthy target' }],
        evidence: 'Illustrative: app.example.test /api → API pool', failureLabel: 'No healthy target', failure: 'The balancer can receive the request but has no eligible backend to send it to.'
      },
      { id: 'diagnose', group: 'Operate the path', label: 'First failed assumption', title: 'Troubleshoot the first checkpoint that fails', question: 'Where should you look when a request times out?', inspector: 'Test a claim at each layer: name resolution, route, neighbor reachability, TCP handshake, policy, then application response. A later test cannot repair an earlier missing prerequisite.', takeaway: 'Find the first failed assumption, then collect evidence at that layer before changing configuration.', caveat: 'ICMP behavior and firewall policy vary, so a failed ping does not by itself prove TCP is blocked.', stages: [{ label: 'Name', detail: 'getent hosts app.example.test' }, { label: 'Route', detail: 'ip route get 203.0.113.80' }, { label: 'Socket', detail: 'ss -tn state syn-sent' }, { label: 'Policy', detail: 'Inspect firewall and conntrack state' }, { label: 'Service', detail: 'Confirm a listener and application response' }], evidence: '$ nc -vz app.example.test 443\nConnection to app.example.test 443 port [tcp/https] succeeded!', failureLabel: 'Inject firewall drop', failure: 'The packet reaches the policy boundary, which silently drops the SYN. The client remains in SYN-SENT until its timeout.' },
    ],
  },
  containers: {
    id: 'containers', title: 'Containers, Illustrated', kicker: 'FOUNDATIONS · PROCESS ISOLATION',
    summary: 'Watch one Node process acquire its filesystem, isolation, resource controls, and lifecycle as it becomes a container.',
    objectLabel: 'node server.js · host PID 18472 · container PID 1', format: 'DEEP DIVE · FOUNDATIONAL', reference: 'HOST · buildbox-01',
    sources: [
      { label: 'Docker — What is a container?', url: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/' },
      { label: 'Docker — What is an image?', url: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/' },
      { label: 'OCI Runtime Specification', url: 'https://github.com/opencontainers/runtime-spec' },
      { label: 'Linux kernel cgroup v2 documentation', url: 'https://docs.kernel.org/admin-guide/cgroup-v2.html' },
    ],
    related: [{ label: 'Linux processes', href: '/linux/processes' }, { label: 'Pod networking and CNI', href: '/pod-networking-cni' }, { label: 'Docker multi-architecture', href: '/docker-multiarch' }],
    views: [
      { id: 'assemble', group: 'Build the boundary', label: 'From process to container', title: 'A container starts as an ordinary Linux process', question: 'What extra mechanisms turn node server.js into a container?', inspector: 'A container is not a small VM. The runtime starts a host process with namespaces, cgroup membership, a root filesystem, and configured security restrictions.', takeaway: 'Containers isolate and constrain processes while sharing the host kernel.', caveat: 'The exact setup belongs to the runtime and host configuration. Namespaces and cgroups are Linux mechanisms; their security properties depend on configuration.', stages: [{ label: 'Process', detail: 'host PID 18472 runs node server.js' }, { label: 'Namespaces', detail: 'PID, mount, network, UTS and IPC views' }, { label: 'Rootfs', detail: 'image-derived filesystem view' }, { label: 'cgroup', detail: 'resource accounting and limits' }, { label: 'Policy', detail: 'capabilities, seccomp and LSM rules' }], evidence: '$ ps -o pid,ppid,cmd -p 18472\n18472  1312 node server.js', failureLabel: 'Remove namespace boundary', failure: 'The process now sees the host’s corresponding namespace. Isolation is not an all-or-nothing property supplied by the image.' },
      {
        id: 'namespaces', group: 'Build the boundary', label: 'Namespace views', title: 'Namespaces change what the process can see', question: 'Why does PID 1 inside still have a different host PID?',
        inspector: 'The process can have distinct PID, mount, network, UTS, and IPC views. The host still schedules it. A namespace alters a selected view; it does not create a second kernel.',
        takeaway: 'Namespace isolation is a set of separate views around ordinary host processes.', caveat: 'User namespaces and their mappings are optional and vary by runtime configuration. Namespaces alone are not a complete security boundary.',
        stages: [{ label: 'Host view', detail: 'host PID 18472' }, { label: 'PID view', detail: 'PID 1 inside the container' }, { label: 'Mount view', detail: 'different root filesystem and mounts' }, { label: 'Network view', detail: 'separate interfaces, routes, and localhost' }],
        evidence: 'Illustrative: host PID 18472 ↔ namespace PID 1', failureLabel: 'Use host network', failure: 'With host networking selected, the process shares the host network namespace; localhost and port binding behave differently.'
      },
      {
        id: 'cgroups', group: 'Build the boundary', label: 'cgroup controls', title: 'A cgroup accounts for and can constrain resources', question: 'Does container isolation automatically reserve CPU and memory?',
        inspector: 'The kernel charges work to the process’s cgroup. Limits can bound use; without a configured memory limit, a container is not magically assigned a fixed memory budget.',
        takeaway: 'Namespaces alter views; cgroups account for and constrain resource use.', caveat: 'Controllers and available limits depend on host cgroup configuration. An OOM event is a kernel decision, not a Docker retry policy.',
        stages: [{ label: 'Place', detail: 'process joins its cgroup' }, { label: 'Account', detail: 'measure CPU and memory use' }, { label: 'Limit', detail: 'optional memory.max and CPU control' }, { label: 'Pressure', detail: 'reclaim or OOM handling can follow' }],
        evidence: 'Illustrative cgroup v2: memory.current < memory.max', failureLabel: 'Remove memory limit', failure: 'The container still exists, but this cgroup has no configured memory ceiling from the container runtime.'
      },
      {
        id: 'build-cache', group: 'Image and runtime', label: 'Build cache', title: 'A source edit should invalidate only the work it touches', question: 'Why does a Dockerfile sometimes reinstall dependencies after a tiny code edit?',
        inspector: 'Build cache reuses a step when its instruction and relevant inputs still match. Copying package files before source files lets a source-only edit reuse the dependency-install result.',
        takeaway: 'Build cache is about inputs to build steps; it is separate from a running container’s writable state.', caveat: 'Modern builders can use mounts and optimizations beyond a one-instruction-one-layer sketch. The diagram shows a useful Dockerfile order, not a storage-driver implementation.',
        stages: [{ label: 'Base', detail: 'FROM node:22 remains reusable' }, { label: 'Packages', detail: 'COPY package files' }, { label: 'Install', detail: 'RUN npm ci can be cached' }, { label: 'Source', detail: 'COPY server.js rebuilds after edit' }],
        evidence: 'Illustrative Dockerfile: COPY package*.json . / RUN npm ci / COPY . .', failureLabel: 'Move COPY . . first', failure: 'A source edit now affects the dependency-install inputs and can trigger avoidable work.'
      },
      { id: 'image', group: 'Build the boundary', label: 'Image and writable layer', title: 'An image is a template; a container adds runtime state', question: 'Why does a new container not keep the files from a previous one?', inspector: 'Images contain ordered filesystem changes. Starting a container adds a writable layer and runtime configuration. A volume is a separately managed mount, not image content.', takeaway: 'Build output becomes immutable image layers; container-local writes belong to that container’s writable layer.', caveat: '“Immutable” describes image content after it is created. Registries, tags, layers, and storage drivers have their own implementation details.', stages: [{ label: 'Base', detail: 'node:22 runtime files' }, { label: 'Dependencies', detail: 'npm ci layer' }, { label: 'App', detail: 'server.js layer' }, { label: 'Writable', detail: 'container-local changes' }, { label: 'Volume', detail: 'optional persistent mount' }], evidence: '$ docker image history demo-api:1.0\n… COPY server.js /srv/server.js', failureLabel: 'Remove the container', failure: 'Container-local writable data is removed with the container. Data that must outlive it belongs in an explicit volume or external store.' },
      { id: 'run', group: 'Run and communicate', label: 'Trace docker run', title: 'docker run creates, configures, then starts', question: 'What does the runtime do between a command and a listening service?', inspector: 'Docker resolves an image, creates a container, supplies a writable layer and networking, then starts the configured process. The container remains running only while its main process runs.', takeaway: 'The image is input; the runtime creates the runnable container and starts its configured process.', caveat: 'Docker’s daemon and default bridge are common examples, not the universal container architecture. Other runtimes expose the OCI lifecycle differently.', stages: [{ label: 'Resolve image', detail: 'use local image or pull manifest and layers' }, { label: 'Create', detail: 'record config and writable layer' }, { label: 'Network', detail: 'attach interface and assign address' }, { label: 'Start', detail: 'exec node server.js as PID 1' }, { label: 'Publish', detail: 'optional host port → container port rule' }], evidence: '$ docker run -p 8080:3000 demo-api:1.0\nServer listening on 3000', failureLabel: 'Stop PID 1', failure: 'When the main process exits, the container stops. A background child process does not automatically keep the intended workload healthy.' },
      {
        id: 'container-packet', group: 'Run and communicate', label: 'Packet to the process', title: 'Published traffic still crosses several boundaries', question: 'How does a client on host port 8080 reach node server.js on port 3000?',
        inspector: 'A published port creates a host-side forwarding path into the container network namespace. In a common Linux bridge setup, traffic crosses host rules and a veth attachment before reaching the process listener.',
        takeaway: 'A published host port and an application listener are separate requirements.', caveat: 'Bridge, veth, NAT, and rootless forwarding details depend on the runtime/network driver; the path is a common Linux example.',
        stages: [{ label: 'Client', detail: 'connects to host :8080' }, { label: 'Publish rule', detail: 'host maps traffic toward container :3000' }, { label: 'Attachment', detail: 'traffic enters container network namespace' }, { label: 'Listener', detail: 'node server.js accepts :3000' }],
        evidence: 'Illustrative: host :8080 → container :3000', failureLabel: 'Bind app to localhost', failure: 'If the app listens only on 127.0.0.1 inside its namespace, the published path to its container address may fail.'
      },
      { id: 'boundary', group: 'Operate the boundary', label: 'Limits and signals', title: 'Resource limits and lifecycle signals are real boundaries', question: 'What happens when the process needs more memory or receives a stop request?', inspector: 'A cgroup can account for and limit resources. Container PID 1 receives lifecycle signals and must handle them appropriately; the runtime can later escalate if the process does not exit.', takeaway: 'Isolation does not replace capacity planning, safe shutdown, or least-privilege configuration.', caveat: 'Exact OOM selection, signal handling, and runtime stop behavior depend on kernel, runtime, and configured timeout.', stages: [{ label: 'Limit', detail: 'memory.max constrains cgroup use' }, { label: 'Pressure', detail: 'kernel reclaims or selects a victim' }, { label: 'Stop', detail: 'runtime sends configured termination signal' }, { label: 'Exit', detail: 'PID 1 exits; container stops' }], evidence: '$ docker stop demo-api\n# runtime requests graceful termination', failureLabel: 'Simulate unhandled stop', failure: 'The process ignores or mishandles the graceful signal. After the configured grace period, the runtime may force termination.' },
      {
        id: 'security-boundary', group: 'Security and distribution', label: 'Security controls', title: 'Isolation and security controls address different risks', question: 'What can a compromised process still do if the container is poorly configured?',
        inspector: 'Namespaces limit what the process sees; capabilities, seccomp, Linux security modules, user mappings, and mount policy reduce what it may do. Host mounts and privileged mode can reopen dangerous paths.',
        takeaway: 'Treat the container as a configured process boundary, and reduce privileges and host access deliberately.', caveat: 'No single switch makes a container fully secure. The effective boundary depends on kernel, runtime, user privileges, filesystem mounts, and workload needs.',
        stages: [{ label: 'Namespace', detail: 'separate selected views' }, { label: 'Capability', detail: 'remove unneeded kernel privileges' }, { label: 'Syscalls', detail: 'apply seccomp and LSM policy' }, { label: 'Mounts', detail: 'avoid broad host write access' }],
        evidence: 'Illustrative controls: cap-drop, read-only rootfs, restricted mounts', failureLabel: 'Add privileged host mount', failure: 'A broad writable host mount gives the process access outside its intended filesystem boundary.'
      },
      {
        id: 'registry', group: 'Security and distribution', label: 'Build to registry', title: 'An image digest travels from build to deployment', question: 'What gets pushed and pulled when this app moves to another host?',
        inspector: 'The builder emits image metadata and content-addressed layers. A tag is a human-friendly pointer that can move; the digest identifies specific content. The runtime pulls the relevant manifest and layers before creating a container.',
        takeaway: 'Use tags to discover versions and digests to identify exact image content.', caveat: 'Multi-platform indexes can point to platform-specific manifests. A pull selects content for the target platform rather than downloading every platform image.',
        stages: [{ label: 'Build', detail: 'produce manifest, config, and layers' }, { label: 'Tag', detail: 'name demo-api:1.0' }, { label: 'Push', detail: 'publish content to registry' }, { label: 'Pull', detail: 'resolve manifest/digest on target host' }, { label: 'Run', detail: 'start a new container from that image' }],
        evidence: 'Illustrative image reference: demo-api:1.0@sha256:4ad7…91c2', failureLabel: 'Move the tag', failure: 'If a tag is repointed, two pulls at different times can resolve different content unless a digest is pinned.'
      },
      {
        id: 'break-fix', group: 'Operate and compare', label: 'Break and diagnose', title: 'Find the failing boundary before rebuilding the image', question: 'Why does the container show “running” while callers still fail?',
        inspector: 'A running PID 1 proves that a process exists. It does not prove that the app listens on the right address, that the port is published, or that the container has permission and memory to answer.',
        takeaway: 'Inspect process, listener, network path, mounts, and resource events as separate claims.', caveat: 'Example commands and output vary by runtime and host network driver. Treat this as a diagnostic order, not a universal CLI transcript.',
        stages: [{ label: 'Process', detail: 'is PID 1 still running?' }, { label: 'Listener', detail: 'is app bound to the container address?' }, { label: 'Publish', detail: 'does host :8080 map to :3000?' }, { label: 'Resource', detail: 'check cgroup/OOM events' }, { label: 'Storage', detail: 'check mount paths and permissions' }],
        evidence: 'Illustrative checks: docker ps / docker logs / ss -ltn / cgroup events', failureLabel: 'Inject loopback bind', failure: 'The process is healthy but listens only inside its own loopback; traffic forwarded to the container address cannot reach that listener.'
      },
      {
        id: 'vm-compare', group: 'Operate and compare', label: 'Container versus VM', title: 'Containers and VMs isolate at different layers', question: 'Where does the kernel boundary sit in each model?',
        inspector: 'A Linux container runs host-kernel-scheduled processes with isolated views. A VM runs a guest kernel over virtualized hardware. They are often stacked together in cloud environments.',
        takeaway: 'A container isolates a process context; a VM supplies a separate guest operating system and kernel.', caveat: 'Strong isolation depends on implementation and configuration. This comparison is architectural, not a blanket security ranking.',
        stages: [{ label: 'Container', detail: 'app process shares host kernel' }, { label: 'Namespaces', detail: 'selected views differ' }, { label: 'VM', detail: 'guest OS has its own kernel' }, { label: 'Together', detail: 'many containers can run inside one VM' }],
        evidence: 'Model comparison: host kernel versus guest kernel', failureLabel: 'Show privileged container', failure: 'Broad host privileges can weaken the intended container boundary; the presence of a container label alone is not a security guarantee.'
      },
    ],
  },
  ssh: {
    id: 'ssh', title: 'SSH, Illustrated', kicker: 'FOUNDATIONS · SECURE CONNECTION',
    summary: 'Watch SSH build a trusted encrypted transport, authenticate a user, then open channels for a shell, command, or forwarding.',
    objectLabel: 'ssh alice@server.example · TCP 22 · session pending', format: 'FLOW EXPLORER · FOUNDATIONAL', reference: 'CLIENT · laptop-01',
    sources: [
      { label: 'OpenSSH ssh(1) manual', url: 'https://man.openbsd.org/ssh' },
      { label: 'OpenSSH sshd(8) manual', url: 'https://man.openbsd.org/sshd' },
      { label: 'OpenSSH ssh_config(5) manual', url: 'https://man.openbsd.org/ssh_config' },
      { label: 'OpenSSH sshd_config(5) manual', url: 'https://man.openbsd.org/sshd_config' },
    ],
    related: [{ label: 'Linux security', href: '/linux/security' }, { label: 'Linux networking', href: '/linux/networking' }, { label: 'AWS identity flows', href: '/aws-identity-credential-flows' }],
    views: [
      { id: 'trust', group: 'Build the transport', label: 'Server trust', title: 'Verify the server during key exchange', question: 'How does the client know that sshd is the server it intended to reach?', inspector: 'During key exchange, the server signs the exchange with its host private key. The client checks the proof and the presented host key against its known_hosts policy before accepting the server identity.', takeaway: 'A server host key answers “which server?”; it is separate from a user’s login key.', caveat: 'Host-key algorithms and verification policy depend on OpenSSH configuration. Host certificates and DNS-based mechanisms are additional supported models.', stages: [{ label: 'TCP', detail: 'client connects to server.example:22' }, { label: 'Identify', detail: 'both sides exchange SSH protocol versions' }, { label: 'KEXINIT', detail: 'choose compatible algorithms' }, { label: 'Host proof', detail: 'server signs the key exchange' }, { label: 'Verify', detail: 'client checks signature and known_hosts policy' }], evidence: '$ ssh-keygen -F server.example\n# locate an existing known_hosts entry', failureLabel: 'Simulate host-key mismatch', failure: 'The presented key differs from the trusted record. SSH warns because a changed host key can be legitimate, but it can also indicate a redirection or interception attempt.' },
      { id: 'encrypted', group: 'Build the transport', label: 'Key agreement', title: 'Key agreement produces an encrypted transport', question: 'Why does SSH not encrypt the whole session with a user public/private key pair?', inspector: 'Key exchange derives shared secret material. After NEWKEYS, both peers use symmetric session keys for normal traffic; asymmetric signatures prove identities without sending private keys.', takeaway: 'SSH uses signatures and key agreement to establish trust, then symmetric keys to carry session traffic.', caveat: 'The view intentionally omits cryptographic calculations and algorithm details. Negotiated algorithms must be supported by both peers and accepted by local policy.', stages: [{ label: 'Exchange', detail: 'public key-agreement values cross the network' }, { label: 'Derive', detail: 'each side computes shared secret material locally' }, { label: 'NEWKEYS', detail: 'activate encryption and integrity protection' }, { label: 'Encrypted', detail: 'transport carries later protocol messages' }], evidence: '$ ssh -vv alice@server.example\n… kex: algorithm: curve25519-sha256', failureLabel: 'Reject algorithm set', failure: 'No mutually acceptable key-exchange or host-key algorithm exists. The transport stops before user authentication.' },
      { id: 'user-auth', group: 'Authenticate and use', label: 'User authentication', title: 'The user proves access after encryption exists', question: 'Why does the private key stay on the client?', inspector: 'For public-key authentication, the client offers a key and signs the authentication request locally, often through ssh-agent. The server checks the public key against its authorization source and verifies the signature.', takeaway: 'A private key creates a proof locally; the public key lets the server verify that proof.', caveat: 'Public-key authentication is one method. Servers can also use passwords, certificates, keyboard-interactive methods, or policy modules.', stages: [{ label: 'Offer', detail: 'client offers public key identity' }, { label: 'Check', detail: 'server checks authorized_keys and policy' }, { label: 'Sign', detail: 'private key or agent signs locally' }, { label: 'Accept', detail: 'server verifies signature and authenticates alice' }], evidence: '$ ssh-add -l\n256 SHA256:… alice@laptop (ED25519)', failureLabel: 'Reject user key', failure: 'The encrypted transport remains valid, but user authentication fails because the key is absent, unauthorized, or does not satisfy server policy.' },
      { id: 'channels', group: 'Authenticate and use', label: 'Channels and failures', title: 'One SSH transport can carry several logical channels', question: 'What changes when you run a command, use SFTP, or create a tunnel?', inspector: 'After authentication, SSH opens logical channels within the protected connection. A shell, remote command, SFTP subsystem, and forwarding each use a channel request with their own purpose.', takeaway: 'Authentication creates a session; channels decide what work travels inside that encrypted transport.', caveat: 'Forwarding permission can be restricted separately from login. ProxyJump uses SSH connections to reach a later host; it is not a magical network tunnel.', stages: [{ label: 'Shell', detail: 'interactive session channel' }, { label: 'Exec', detail: 'one remote command and its streams' }, { label: 'SFTP', detail: 'subsystem channel' }, { label: 'Forward', detail: 'local, remote, or dynamic forwarding channel' }], evidence: '$ ssh -L 15432:db.internal:5432 alice@bastion\n# local listener carried through SSH', failureLabel: 'Deny forwarding', failure: 'The user may authenticate successfully while forwarding is refused by server policy or an unavailable destination behind the server.' },
      {
        id: 'ssh-forwarding', group: 'Channels and access', label: 'Three forwarding forms', title: 'Forwarding changes where a listener lives', question: 'What is different about -L, -R, and -D?',
        inspector: 'Local forwarding opens a listener near the client and connects from the server side to one destination. Remote forwarding opens a listener near the server and returns traffic to the client side. Dynamic forwarding opens a local SOCKS listener for varying destinations.',
        takeaway: 'For a tunnel, first identify which side owns the listener and which side opens the destination connection.',
        caveat: 'Listener binding, target reachability, and server forwarding policy affect each form. ProxyJump uses a bastion as a route to a second SSH server, not necessarily the final shell host.',
        stages: [{ label: 'Local -L', detail: 'client listener → SSH → server-side destination' }, { label: 'Remote -R', detail: 'server listener → SSH → client-side destination' }, { label: 'Dynamic -D', detail: 'client SOCKS listener → SSH → chosen destination' }, { label: 'Jump -J', detail: 'client → bastion → private SSH server' }],
        evidence: 'Examples: ssh -L 15432:db.internal:5432 bastion / ssh -R 8080:localhost:3000 server / ssh -D 1080 bastion',
        failureLabel: 'Block forwarding', failure: 'Authentication can succeed while the server rejects a forwarding request or cannot reach the destination.'
      },
      {
        id: 'credential-tooling', group: 'Channels and access', label: 'Agent and certificates', title: 'Helpers change key handling, not the transport order', question: 'Where does ssh-agent sign, and what does forwarding it expose?',
        inspector: 'ssh-agent is a local signing helper. Agent forwarding exposes a proxy socket to a remote host so it can request signatures; the private key is not copied, but a compromised remote session could misuse that signing ability. SSH certificates let a CA sign user or host identities.',
        takeaway: 'Keep private signing material local and treat access to an agent socket as sensitive authority.',
        caveat: 'Hardware-backed keys and certificate policy vary by deployment. ControlMaster can reuse a connection but does not replace host verification or user authentication of the original master.',
        stages: [{ label: 'Local key', detail: 'private material stays client-side' }, { label: 'Agent', detail: 'local socket requests a signature' }, { label: 'Forwarded agent', detail: 'remote socket can request signatures' }, { label: 'Certificate', detail: 'CA signs user/host identity metadata' }],
        evidence: 'Illustrative: ssh-add -l / ssh -A bastion / TrustedUserCAKeys', failureLabel: 'Expose agent socket', failure: 'A compromised remote environment with forwarded-agent access may request signatures while that connection is available.'
      },
      {
        id: 'hardening', group: 'Operate and diagnose', label: 'Server policy', title: 'Hardening choices affect different SSH stages', question: 'Which setting blocks TCP entry, user login, or a forwarding channel?',
        inspector: 'A network firewall controls reachability before SSH starts. sshd authentication settings govern user access after transport setup. Forwarding settings govern channel requests after login. Treat these as distinct gates when changing policy.',
        takeaway: 'Apply a control at the boundary it owns, then test the exact connection stage it changes.',
        caveat: 'PasswordAuthentication no does not by itself describe all keyboard-interactive methods. Validate effective sshd configuration and retain a known working access path before tightening a remote host.',
        stages: [{ label: 'Network', detail: 'limit which clients can reach TCP :22' }, { label: 'Host trust', detail: 'manage server host-key identity' }, { label: 'User auth', detail: 'scope public keys and login policy' }, { label: 'Channels', detail: 'allow or deny forwarding separately' }],
        evidence: 'Examples: PermitRootLogin no / PasswordAuthentication no / AllowTcpForwarding no', failureLabel: 'Deny this user', failure: 'The encrypted transport can remain healthy while server login policy refuses this user.'
      },
      {
        id: 'ssh-diagnose', group: 'Operate and diagnose', label: 'First failing stage', title: 'SSH failures tell you which stage stopped', question: 'Why does “permission denied” require a different investigation from “connection timed out”?',
        inspector: 'Work from DNS and TCP to algorithm negotiation, host verification, user authentication, and channel setup. The first failed stage narrows the evidence you need; -v/-vv/-vvv logs can expose protocol progress without revealing private key material.',
        takeaway: 'Find the first incomplete SSH stage and inspect its actors before changing keys or server policy.',
        caveat: 'Client diagnostics are only one side of the story. Server logs and effective sshd configuration may be needed for policy, account, or forwarding failures.',
        stages: [{ label: 'Name/TCP', detail: 'resolve and connect to port 22' }, { label: 'Algorithms', detail: 'find compatible transport algorithms' }, { label: 'Host key', detail: 'verify intended server' }, { label: 'User auth', detail: 'server accepts an allowed method' }, { label: 'Channel', detail: 'shell or forwarding request succeeds' }],
        evidence: 'Illustrative debug: ssh -vvv alice@server.example', failureLabel: 'Inject host-key mismatch', failure: 'The TCP connection and algorithm negotiation succeeded, but the client stopped at server host-key verification.'
      },
    ],
  },
};
