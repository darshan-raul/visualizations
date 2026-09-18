import type { LinuxPillar } from '../linux-types';
import { man, systemd, nftables } from '../linux-types';

export const networkingPillar: LinuxPillar = {
  id: 'networking',
  name: 'Networking & Sockets',
  short: 'Networking',
  promise: 'Follow network packets from physical wire reception through Netfilter firewall chains, the Forwarding Information Base (FIB), and socket queues into application memory buffers.',
  hints: 'sockets · Netfilter · routing (FIB) · DNS · namespaces · veth',
  bridge: 'Kubernetes Pod networking, AWS ENI multi-homing, and container CNI plugins are built directly on Linux network namespaces, veth pairs, routing tables, and Netfilter rules.',
  groups: [
    { label: 'Connection path', viewIds: ['networking-concepts', 'socket', 'outbound', 'route', 'dns'] },
    { label: 'Reachability', viewIds: ['listener', 'firewall-chains', 'net-ns', 'blocked'] },
  ],
  views: [
    {
      id: 'networking-concepts',
      label: 'Core concepts',
      title: 'Before looking at the mechanics, what actually is a Socket or a Port?',
      question: 'What are the foundational primitives of Linux Networking?',
      kind: 'concept-primer',
      concepts: [
        {
          term: 'IP Address',
          analogy: 'A Street Address',
          definition: 'A numerical label assigned to a device (like 10.0.1.17). It ensures packets can find their way across the internet to the correct machine.'
        },
        {
          term: 'Port',
          analogy: 'An Apartment Number',
          definition: 'Once a packet reaches the correct machine (IP), the Port (like 443 or 80) tells the kernel WHICH specific application should receive the data.'
        },
        {
          term: 'Socket',
          analogy: 'A Mailbox',
          definition: 'A Socket is a software mailbox created by an application. It binds to a Port so the kernel knows to deliver incoming packets for that Port into this specific mailbox.'
        },
        {
          term: 'Netfilter (Firewall)',
          analogy: 'A Security Guard',
          definition: 'A kernel subsystem that intercepts every packet arriving or leaving. It checks rules (iptables/nftables) and decides whether to Accept (let it through) or Drop (discard it silently).'
        }
      ],
      explanation: 'Networking in Linux is simply about moving bytes between memory buffers. An application asks the kernel for a Socket (a mailbox). When packets arrive off the physical wire, the kernel checks the IP, checks the Firewall, checks the Port, and finally drops the payload into the Socket\'s buffer for the application to read.',
      takeaway: 'IPs find the machine, Ports find the application, Sockets hold the data, and Firewalls guard the gates.',
      command: 'ss -lnt',
      output: 'State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port\nLISTEN  0       511          0.0.0.0:443         0.0.0.0:*',
      probe: 'ip addr show',
      probeOutput: 'inet 10.0.1.17/24 brd 10.0.1.255 scope global eth0',
      caveat: 'A "Connection Refused" error means the packet reached the machine, but there was no Socket listening on that Port. A "Timeout" means a Firewall dropped it entirely.',
      source: `${man}man7/socket.7.html`,
    },
    {
      id: 'socket',
      label: 'Service socket',
      title: 'A listening port is an entry in the kernel TCP protocol control table.',
      question: 'How does an application bind a port, and how does the kernel queue connections?',
      kind: 'path',
      actors: [
        { label: 'Application Process', detail: 'nginx worker PID 421 invokes socket(), bind(), and listen()' },
        { label: 'Kernel Socket Struct', detail: 'Allocates TCP protocol control block and assigns File Descriptor 11' },
        { label: 'SYN Backlog Queue', detail: 'Holds half-open handshakes (SYN_RECV) during initial TCP negotiation' },
        { label: 'Accept Queue (Backlog)', detail: 'Holds ESTABLISHED connections ready for user space accept() syscall' }
      ],
      explanation: 'A port is not physical hardware; it is a 16-bit integer index into the kernel TCP protocol state table. When a process calls listen(fd, backlog), the kernel allocates two FIFO queues: the SYN backlog (for connections completing the 3-way handshake) and the Accept queue (for fully established connections waiting for accept()). If the application event loop stalls and the Accept queue fills up, incoming client SYN packets are silently dropped or rejected with TCP resets.',
      takeaway: 'Sockets are backed by kernel queues (sk_buff); inspect queue depth and dropped handshakes via ss -lnt and netstat -s.',
      command: 'ss -tlnp | grep :443',
      output: 'State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process\nLISTEN 0      511          0.0.0.0:443        0.0.0.0:*     users:(("nginx",pid=421,fd=11),("nginx",pid=418,fd=11))',
      probe: 'cat /proc/sys/net/core/somaxconn',
      probeOutput: '4096 # Maximum listen backlog queue length',
      caveat: 'Privileged ports (under 1024) require root or the CAP_NET_BIND_SERVICE capability. Send-Q in ss -lnt shows the configured backlog limit (511), while Recv-Q shows currently queued handshakes.',
      source: `${man}man7/socket.7.html`,
    },
    {
      id: 'outbound',
      label: 'Outbound trace',
      title: 'The 6-stage journey of an egress packet: from socket to wire.',
      question: 'What kernel decisions execute when a process calls curl https://example.com?',
      kind: 'interactive-packet',
      packetData: {
        destination: '93.184.215.14',
        port: 443,
        stages: [
          { id: 'dns', name: 'DNS Resolution', desc: 'Translates domain to IP', active: true, failure: 'NXDOMAIN: Could not resolve host' },
          { id: 'socket', name: 'Ephemeral Port', desc: 'Allocates local port (49152)', active: true, failure: 'EADDRNOTAVAIL: No ports available' },
          { id: 'route', name: 'Routing (FIB)', desc: 'Selects eth0 and gateway 10.0.1.1', active: true, failure: 'ENETUNREACH: Network is unreachable' },
          { id: 'firewall', name: 'Netfilter OUTPUT', desc: 'Firewall rules', active: true, failure: 'EPERM: Operation not permitted (DROP)' },
          { id: 'arp', name: 'ARP Lookup', desc: 'Resolves gateway MAC', active: true, failure: 'EHOSTUNREACH: Destination Host Unreachable' },
          { id: 'nic', name: 'NIC TX Queue', desc: 'Hardware transmission', active: true, failure: 'Transmit queue dropped packet' }
        ]
      },
      explanation: 'Initiating an outbound network connection requires six sequential kernel operations. First, DNS translates the hostname to an IP. Next, the kernel allocates an ephemeral client port. The routing engine evaluates the Forwarding Information Base (FIB) to select the egress interface (eth0) and next hop. The Netfilter OUTPUT chain verifies firewall policy. The neighbor table (ARP) resolves the gateway IP to an Ethernet MAC address. Finally, the packet is queued in the device driver TX ring for DMA transmission.',
      takeaway: 'Egress requires the entire chain: DNS → Ephemeral Port → Route → Netfilter → ARP → Device Driver.',
      command: 'curl -v https://93.184.215.14:443',
      output: '* Trying 93.184.215.14:443...\n* Connected to 93.184.215.14 port 443\n* TLS Handshake completed',
      probe: 'ip route get 93.184.215.14',
      probeOutput: '93.184.215.14 via 10.0.1.1 dev eth0 src 10.0.1.17 uid 33\n    cache',
      caveat: 'If the gateway MAC is unresolvable (ARP failure), the packet is dropped with "Destination Host Unreachable", even if DNS and routing tables are completely valid.',
      source: `${man}man8/ip-route.8.html`,
    },
    {
      id: 'route',
      label: 'Route & neighbour',
      title: 'Next-hop routing (FIB) vs physical hardware addressing (ARP/NDP).',
      question: 'How does Linux know where to forward a packet on the local subnet?',
      kind: 'layers',
      actors: [
        { label: 'Destination IP', detail: 'Ultimate endpoint address (e.g. 1.1.1.1)' },
        { label: 'Forwarding Information Base', detail: 'Longest prefix match selects default via 10.0.1.1 dev eth0' },
        { label: 'Neighbor Table (ARP / NDP)', detail: 'Maps gateway 10.0.1.1 to MAC 00:16:3e:5f:aa:11' },
        { label: 'Ethernet Frame Header', detail: 'Rewrites destination MAC to gateway; transmits out eth0' }
      ],
      explanation: 'The Linux kernel does not know the physical path to a remote internet destination; it only knows the next hop gateway. The Forwarding Information Base (FIB) uses longest prefix matching to select the best route. Once the next-hop IP is determined, the kernel queries its Neighbor Cache (ARP for IPv4, NDP for IPv6) to locate the gateway physical 48-bit MAC address. The packet IP payload is untouched, but the L2 Ethernet header is stamped with the gateway MAC.',
      takeaway: 'IP routing finds the next-hop IP; ARP finds the next-hop MAC. Both must succeed for packets to leave the host.',
      command: 'ip route show',
      output: 'default via 10.0.1.1 dev eth0 proto dhcp src 10.0.1.17 metric 100\n10.0.1.0/24 dev eth0 proto kernel scope link src 10.0.1.17',
      probe: 'ip neigh show dev eth0',
      probeOutput: '10.0.1.1 dev eth0 lladdr 00:16:3e:5f:aa:11 REACHABLE',
      caveat: 'Neighbor states progress: INCOMPLETE → REACHABLE → STALE → DELAY → PROBE → FAILED. A STALE entry still sends packets while triggering background reachability probes.',
      source: `${man}man8/ip-neigh.8.html`,
    },
    {
      id: 'dns',
      label: 'DNS in practice',
      title: 'Domain name resolution: NSS, systemd-resolved, and stub resolvers.',
      question: 'How does Linux resolve names, and why can dig succeed while curl fails?',
      kind: 'walkthrough',
      steps: [
        { command: 'cat /etc/nsswitch.conf | grep hosts', output: 'hosts: files dns', annotation: 'nsswitch.conf governs system resolution order. files checks /etc/hosts first; dns invokes resolver libraries.' },
        { command: 'cat /etc/resolv.conf', output: 'nameserver 127.0.0.53\noptions edns0 trust-ad\nsearch c.internal', annotation: '127.0.0.53 is the local loopback stub resolver managed by systemd-resolved. It provides local DNS caching and search domain expansion.' },
        { command: 'resolvectl status eth0', output: 'Link 2 (eth0)\n    Current DNS Server: 10.0.0.2\n           DNS Servers: 10.0.0.2\n            DNS Domain: c.internal', annotation: 'resolvectl shows the real upstream recursive DNS servers assigned per-interface via DHCP or cloud metadata.' },
        { command: 'getent hosts example.com', output: '93.184.215.14   example.com', annotation: 'ALWAYS test with getent hosts instead of dig. dig queries DNS servers directly, bypassing /etc/hosts and NSS configuration completely!' }
      ],
      explanation: 'Name resolution in modern Linux involves multiple abstraction layers. Applications call glibc getaddrinfo(), which consults /etc/nsswitch.conf. If /etc/hosts has no matching entry, it delegates to the resolver specified in /etc/resolv.conf. In modern distributions, this points to 127.0.0.53—the local systemd-resolved caching daemon—which forwards queries to the interface DNS servers assigned by DHCP.',
      takeaway: 'dig queries DNS servers directly; getent hosts tests the actual NSS lookup pipeline used by real applications.',
      command: 'resolvectl query devbox-01',
      output: 'devbox-01: 10.0.1.17\n-- Information acquired via protocol DNS in 1.2ms.',
      probe: 'grep -E "^(nameserver|search)" /etc/resolv.conf',
      probeOutput: 'nameserver 127.0.0.53\nsearch c.internal',
      caveat: 'Alpine Linux and musl-libc do not support /etc/nsswitch.conf or search domain ndots logic the same way glibc does, leading to famous Kubernetes DNS timeouts in Alpine images.',
      source: `${systemd}systemd-resolved.service.html`,
    },
    {
      id: 'listener',
      label: 'Bind address',
      title: 'Listener binding: how the IP address restricts connection scope.',
      question: 'Why does an app respond to curl on localhost but reject connections from the network?',
      kind: 'split',
      actors: [
        { label: '0.0.0.0 (Wildcard IPv4)', detail: 'Accepts TCP connections on all local interfaces (eth0, lo, bridges)' },
        { label: '127.0.0.1 (Loopback Only)', detail: 'Accepts connections ONLY from local processes within the same network namespace' },
        { label: '10.0.1.17 (Interface Specific)', detail: 'Accepts connections addressed exclusively to the eth0 IP address' }
      ],
      explanation: 'When an application calls bind(fd, sockaddr, len), the IP address in sockaddr determines the packet reception filter. Binding to 0.0.0.0 (INADDR_ANY) instructs the kernel to accept packets destined for any IP assigned to any local network interface. Binding to 127.0.0.1 restricts the socket to packets originating on the loopback interface (lo); packets arriving from eth0 are rejected at the routing layer before reaching the socket.',
      takeaway: 'Binding to 127.0.0.1 isolates a service to the host; binding to 0.0.0.0 exposes it to all network interfaces.',
      command: 'ss -tlnp',
      output: 'State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process\nLISTEN 0      128        127.0.0.1:8080        0.0.0.0:*     users:(("app",pid=2048,fd=3))\nLISTEN 0      511          0.0.0.0:443         0.0.0.0:*     users:(("nginx",pid=421,fd=11))',
      probe: 'curl -I http://127.0.0.1:8080',
      probeOutput: 'HTTP/1.1 200 OK\nServer: internal-worker',
      caveat: 'IPv6 uses :: for wildcard binding and ::1 for loopback. By default on Linux, binding to [::]:443 also accepts IPv4 connections via IPv4-mapped IPv6 addresses unless IPV6_V6ONLY is set.',
      source: `${man}man2/bind.2.html`,
    },
    {
      id: 'firewall-chains',
      label: 'Firewall chains',
      title: 'Netfilter architecture: tables, hooks, and packet processing order.',
      question: 'Where do firewall rules evaluate during packet transit through the kernel?',
      kind: 'reference',
      headers: ['Hook Point', 'When it Executes', 'Common Tables', 'Operational Purpose'],
      rows: [
        ['PREROUTING', 'Immediately after NIC driver receives frame', 'raw, mangle, nat', 'DNAT (port forwarding), connection tracking (conntrack)'],
        ['INPUT', 'After routing confirms packet is for local host', 'mangle, filter, security', 'Host firewall rules: allow/drop incoming traffic to local sockets'],
        ['FORWARD', 'After routing determines packet is for another host', 'mangle, filter, security', 'Container/router forwarding: Kubernetes Pod-to-Pod traffic'],
        ['OUTPUT', 'When a local process transmits an outbound packet', 'raw, mangle, nat, filter', 'Egress firewall rules: restrict outbound connections from host'],
        ['POSTROUTING', 'Just before packet is handed to NIC driver', 'mangle, nat', 'SNAT / Masquerade: replace source IP with public interface IP'],
      ],
      tableNote: 'Netfilter is the kernel framework; iptables, nftables, and firewalld are user space frontends. Rules are evaluated sequentially within priority-ordered tables.',
      explanation: 'Netfilter provides five hooks inside the kernel network stack where packet processing can be intercepted. Inbound packets hit PREROUTING where DNAT translates destination addresses. The kernel routing engine makes a routing decision: if addressed to the host, the packet hits INPUT before entering the socket; if addressed to another host (e.g. a container), it traverses FORWARD. Outbound packets traverse OUTPUT and POSTROUTING for SNAT masquerading.',
      takeaway: 'Host firewall rules live in the INPUT hook; container routing and NAT occur in PREROUTING, FORWARD, and POSTROUTING.',
      command: 'sudo nft list ruleset',
      output: 'table inet filter {\n  chain input {\n    type filter hook input priority filter; policy accept;\n    ct state established,related accept\n    tcp dport 443 accept\n    iifname "lo" accept\n    drop\n  }\n}',
      probe: 'sudo iptables -L INPUT -v -n --line-numbers',
      probeOutput: 'num   pkts bytes target     prot opt in     out     source               destination\n1    4210K 3.2G  ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:443',
      caveat: 'Connection tracking (conntrack) maintains state for stateful firewalls. If the conntrack table fills up (/proc/sys/net/netfilter/nf_conntrack_max), the kernel drops all new connections!',
      source: `${nftables}`,
    },
    {
      id: 'net-ns',
      label: 'Network namespaces',
      title: 'Container network isolation: private interfaces, routes, and veth pairs.',
      question: 'How does Linux give Docker containers and Kubernetes Pods isolated networking?',
      kind: 'layers',
      actors: [
        { label: 'Host Root Namespace', detail: 'Owns physical interface eth0 and default gateway' },
        { label: 'Virtual Ethernet Pair (veth)', detail: 'Virtual wire: packets entering veth-host exit veth-container' },
        { label: 'Linux Software Bridge (cbr0)', detail: 'Switches packets between multiple container veth interfaces' },
        { label: 'Container Network Namespace', detail: 'Private loopback (lo), private eth0, isolated IP 10.244.1.5, and private routing table' }
      ],
      explanation: 'A network namespace provides an isolated copy of the entire network stack: its own network interfaces, routing tables, firewall rules, and socket lists. To connect a container to the host, the kernel creates a Virtual Ethernet pair (veth). One end remains in the host root namespace plugged into a bridge (like cbr0 or docker0), while the peer end is moved into the container namespace and renamed eth0.',
      takeaway: 'Containers achieve network isolation via network namespaces; veth pairs act as virtual Ethernet cables connecting them to host bridges.',
      command: 'ip netns list',
      output: 'cgroup_ns_web (id: 1)\ncontainer_db (id: 2)',
      probe: 'sudo ip netns exec cgroup_ns_web ip addr show',
      probeOutput: '1: lo: <LOOPBACK,UP> mtu 65536\n2: eth0@if14: <BROADCAST,MULTICAST,UP> mtu 1500 inet 10.244.1.5/24',
      caveat: 'To inspect container networking from the host without ip netns, use nsenter: sudo nsenter -t <container-pid> -n ip addr.',
      source: `${man}man7/network_namespaces.7.html`,
    },
    {
      id: 'blocked',
      label: 'Blocked path diagnosis',
      title: 'Isolating dropped traffic: firewall reject, routing blackhole, or port closed.',
      question: 'A client connection fails with timeout or connection refused. Where is it breaking?',
      kind: 'layers',
      actors: [
        { label: 'Client TCP SYN Packet', detail: 'Packet arrives on eth0 destined for 10.0.1.17:443' },
        { label: 'Netfilter INPUT Gate', detail: 'DROP rule discards packet; host sends NO response' },
        { label: 'Socket Listen Queue', detail: 'Never notified because packet was dropped in Netfilter' },
        { label: 'Client Symptom', detail: 'Connection Timeout after 60 seconds (SYN retries exhausted)' }
      ],
      failure: {
        label: 'Remove Netfilter DROP rule',
        result: 'Netfilter rule updated to ACCEPT. Incoming TCP handshakes reach the socket queue immediately.',
        output: 'sudo nft add rule inet filter input tcp dport 443 accept\ncurl -I https://10.0.1.17:443\nHTTP/1.1 200 OK',
        blocked: 1,
        afterActors: [
          { label: 'Client TCP SYN Packet', detail: 'Packet arrives on eth0' },
          { label: 'Netfilter INPUT Gate', detail: 'Rule MATCH: ACCEPT tcp dport 443' },
          { label: 'Socket Listen Queue', detail: 'TCP handshake completes; connection queued' },
          { label: 'Client Symptom', detail: 'HTTP/1.1 200 OK received in 1.4ms' }
        ]
      },
      explanation: 'Connection failures present three distinct symptoms that identify the failing layer: 1. "Connection Refused" means the packet reached the host and was allowed by the firewall, but no process was listening on the port (kernel sent TCP RST); 2. "Connection Timed Out" means the packet was dropped by a firewall (or routing blackhole) without responding; 3. "No route to host" means ARP failed or the routing table has no gateway.',
      takeaway: 'Connection Refused = port closed (kernel sent RST). Connection Timed Out = firewall DROP (silent silence).',
      command: 'sudo tcpdump -nn -i eth0 port 443',
      output: '19:40:00.120 IP 192.168.1.5.54321 > 10.0.1.17.443: Flags [S], seq 123456 # SYN arrives\n19:40:01.124 IP 192.168.1.5.54321 > 10.0.1.17.443: Flags [S], seq 123456 # Retried! Host never responded (DROP)',
      probe: 'sudo nft list chain inet filter input',
      probeOutput: 'chain input {\n  type filter hook input priority 0; policy accept;\n  tcp dport 443 drop # CAUSE OF OUTAGE\n}',
      caveat: 'tcpdump captures packets BEFORE Netfilter ingress rules drop them! Seeing packets in tcpdump proves they reached the NIC, but does NOT prove they reached the application.',
      source: `${nftables}`,
    }
  ]
};
