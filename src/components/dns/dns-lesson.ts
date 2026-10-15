/**
 * DNS: from a name to an answer. One name, shop.example.com, followed from an app to the root and back,
 * through every cache, a move to a new address, and the ways a lookup fails.
 * Views 5 (record map), 7 (change board) and 11 (split routing) are custom views drawn by RecordMap.astro, ChangeBoard.astro
 * and RouteBoard.astro.
 */
import { code, edge, node, type Diagram, type Lesson, type View } from '../lesson/lesson-types';

const RFC = (n: number, section = '') => `https://www.rfc-editor.org/rfc/rfc${n}.html${section ? `#section-${section}` : ''}`;
const sources = [
  { label: 'RFC 1034: DNS concepts', url: RFC(1034) },
  { label: 'RFC 1035: DNS implementation', url: RFC(1035) },
  { label: 'RFC 9499: DNS terminology', url: RFC(9499) },
  { label: 'RFC 9156: QNAME minimisation', url: RFC(9156) },
  { label: 'RFC 2308: negative caching', url: RFC(2308) },
  { label: 'RFC 8767: serving stale data', url: RFC(8767) },
  { label: 'RFC 2181: clarifications to the DNS spec', url: RFC(2181) },
  { label: 'RFC 9471: glue in referrals', url: RFC(9471) },
  { label: 'RFC 3596: AAAA records', url: RFC(3596) },
  { label: 'RFC 8305: Happy Eyeballs v2', url: RFC(8305) },
  { label: 'RFC 9460: SVCB and HTTPS records', url: RFC(9460) },
  { label: 'RFC 5321: SMTP, MX lookup', url: RFC(5321, '5.1') },
  { label: 'RFC 7505: null MX', url: RFC(7505) },
  { label: 'RFC 7208: SPF', url: RFC(7208) },
  { label: 'RFC 2782: SRV records', url: RFC(2782) },
  { label: 'RFC 8659: CAA records', url: RFC(8659) },
  { label: 'RFC 4033: DNSSEC introduction', url: RFC(4033) },
  { label: 'RFC 4034: DNSSEC records', url: RFC(4034) },
  { label: 'RFC 4035: DNSSEC protocol', url: RFC(4035) },
  { label: 'RFC 9824: compact denial of existence', url: RFC(9824) },
  { label: 'RFC 6891: EDNS(0)', url: RFC(6891) },
  { label: 'RFC 7766: DNS over TCP', url: RFC(7766) },
  { label: 'DNS Flag Day 2020: 1232-byte buffer', url: 'https://www.dnsflagday.net/2020/' },
  { label: 'RFC 7858: DNS over TLS', url: RFC(7858) },
  { label: 'RFC 8484: DNS over HTTPS', url: RFC(8484) },
  { label: 'RFC 8914: extended DNS errors', url: RFC(8914) },
  { label: 'nsswitch.conf(5)', url: 'https://man7.org/linux/man-pages/man5/nsswitch.conf.5.html' },
  { label: 'resolv.conf(5)', url: 'https://man7.org/linux/man-pages/man5/resolv.conf.5.html' },
  { label: 'getaddrinfo(3)', url: 'https://man7.org/linux/man-pages/man3/getaddrinfo.3.html' },
  { label: 'systemd-resolved.service(8)', url: 'https://man7.org/linux/man-pages/man8/systemd-resolved.service.8.html' },
  { label: 'Java networking properties', url: 'https://docs.oracle.com/en/java/javase/21/core/java-networking.html' },
  { label: 'Route 53: private hosted zone considerations', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zone-private-considerations.html' },
  { label: 'Kubernetes: DNS for Services and Pods', url: 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/' },
  { label: 'nginx: proxy_pass', url: 'https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass' },
  { label: 'Unbound: unbound.conf', url: 'https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html' },
  { label: 'BIND 9: dig', url: 'https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility' },
  { label: 'IANA: root servers', url: 'https://www.iana.org/domains/root/servers' },
  { label: 'BIND 9: views', url: 'https://bind9.readthedocs.io/en/latest/reference.html#view-block-definition-and-usage' },
  { label: 'Route 53: Resolver rules', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-overview-forward-vpc-to-network-using-rules.html' },
  { label: 'Route 53: Resolver endpoints', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-overview-DSN-queries-to-vpc.html' },
  { label: 'systemd.network(5): Domains=', url: 'https://man7.org/linux/man-pages/man5/systemd.network.5.html' },
  { label: 'resolvectl(1)', url: 'https://man7.org/linux/man-pages/man1/resolvectl.1.html' },
  { label: 'Kubernetes: customizing DNS', url: 'https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/' },
];
const [R1034, R1035, TERMS, QMIN, NEG, STALE, R2181, GLUE, AAAA, HE, SVCB, MX, NULLMX, SPF, SRV, CAA, DS_INTRO, DS_RECORDS, DS_PROTO, COMPACT, EDNS, TCP, FLAGDAY, DOT, DOH, EDE, NSSWITCH, RESOLVCONF, GAI, RESOLVED, JAVA, R53, K8S, NGINX, UNBOUND, DIG, ROOTS, VIEWS, R53_RULES, R53_ENDPOINTS, NETWORKD, RESOLVECTL, K8S_CUSTOM] = sources.map((_, i) => i);

/* ---------- Diagrams ---------- */

const NAME: Diagram = {
  title: 'A browser, a resolver, and the shop server', width: 640, height: 200,
  nodes: [
    node('browser', 'code', 20, 60, 'your browser', 'wants the shop', 150, 64),
    node('resolver', 'tool', 260, 20, 'a resolver', 'answers name questions', 170, 64),
    node('server', 'kube', 470, 130, 'shop server', '192.0.2.10', 150, 58),
  ],
  edges: [
    edge('ask', 'browser', 'resolver', 'address?', { shift: -8 }),
    edge('answer', 'resolver', 'browser', '192.0.2.10', { shift: 10 }),
    edge('wish', 'browser', 'server', 'connect to a name?', { kind: 'imagined' }),
    edge('connect', 'browser', 'server', 'HTTPS to 192.0.2.10'),
  ],
};

const LOCAL: Diagram = {
  title: 'Where an application looks before it asks the network', width: 780, height: 240,
  nodes: [
    node('app', 'code', 10, 50, 'your app', 'getaddrinfo()', 135, 64),
    node('appcache', 'store', 175, 50, "app's cache", 'browser, JVM', 135, 64),
    node('hosts', 'part', 340, 50, '/etc/hosts', 'a local file', 125, 64),
    node('oscache', 'store', 495, 50, 'OS cache', 'systemd-resolved', 135, 64),
    node('res', 'tool', 660, 50, 'resolver', 'on the network', 110, 64),
    node('dig', 'code', 10, 170, 'dig', 'a DNS client', 135, 50),
  ],
  edges: [
    edge('l1', 'app', 'appcache', '1'),
    edge('l2', 'appcache', 'hosts', '2'),
    edge('l3', 'hosts', 'oscache', '3'),
    edge('l4', 'oscache', 'res', '4'),
    edge('d1', 'dig', 'res', 'dig skips 1, 2 and 3', { via: [[715, 195]] }),
  ],
};

const LOOKUP: Diagram = {
  title: 'A recursive resolver walking from the root to the example.com servers', width: 780, height: 390,
  nodes: [
    node('stub', 'code', 10, 150, 'your laptop', 'stub resolver', 140, 64),
    node('res', 'tool', 280, 20, 'recursive resolver', 'walks the tree for you', 150, 290),
    node('root', 'kube', 590, 20, 'root server', 'knows com, net, org…', 180, 64),
    node('tld', 'kube', 590, 133, 'com server', 'knows example.com', 180, 64),
    node('auth', 'kube', 590, 246, 'example.com server', 'ns1.example.com', 180, 64),
    node('cache', 'store', 280, 330, 'resolver cache', undefined, 150, 50),
  ],
  edges: [
    edge('ask', 'stub', 'res', 'shop.example.com A?', { shift: -10 }),
    edge('reply', 'res', 'stub', '192.0.2.10', { shift: 10 }),
    edge('q-root', 'res', 'root', 'who serves com?', { shift: -10 }),
    edge('r-root', 'root', 'res', 'ask the com servers', { shift: 10 }),
    edge('q-tld', 'res', 'tld', 'who serves example.com?', { shift: -10 }),
    edge('r-tld', 'tld', 'res', 'ask ns1.example.com', { shift: 10 }),
    edge('q-auth', 'res', 'auth', 'shop.example.com A?', { shift: -10 }),
    edge('a-auth', 'auth', 'res', 'A 192.0.2.10', { shift: 10 }),
    edge('store', 'res', 'cache', 'keep for the TTL'),
  ],
};
const LOOKUP_ALL = LOOKUP.nodes.map((n) => n.id);

const ZONES: Diagram = {
  title: 'The name tree cut into zones', width: 780, height: 340,
  zones: [
    { id: 'zroot', x: 250, y: 6, w: 280, h: 76, label: 'ROOT ZONE' },
    { id: 'zex', x: 10, y: 190, w: 470, h: 112, label: 'ZONE example.com · ns1, ns2.example.com' },
    { id: 'zeu', x: 500, y: 190, w: 270, h: 112, label: 'ZONE eu.example.com · another provider' },
  ],
  nodes: [
    node('root', 'kube', 315, 24, '.', 'the root', 150, 48),
    node('com', 'kube', 90, 110, 'com', 'a TLD zone', 140, 48),
    node('net', 'kube', 320, 110, 'net', 'a TLD zone', 140, 48),
    node('old', 'kube', 530, 110, 'old-dns.example.net', 'previous provider', 230, 48),
    node('ex', 'kube', 25, 222, 'example.com', 'SOA, NS, MX…', 140, 58),
    node('shop', 'part', 180, 229, 'shop', undefined, 90, 44),
    node('www', 'part', 285, 229, 'www', undefined, 90, 44),
    node('ns1', 'part', 390, 229, 'ns1', undefined, 78, 44),
    node('eu', 'kube', 530, 222, 'eu.example.com', 'delegated subzone', 210, 58),
  ],
  edges: [
    edge('r-com', 'root', 'com', 'NS'),
    edge('r-net', 'root', 'net', 'NS'),
    edge('com-ex', 'com', 'ex', 'NS + glue'),
    edge('ex-eu', 'ex', 'eu', 'NS: a cut inside your domain', { via: [[95, 326], [635, 326]] }),
    edge('com-old', 'com', 'old', 'NS at the registrar', { via: [[160, 176], [645, 176]] }),
  ],
};
const ZONES_BASE = ['zroot', 'zex', 'zeu', 'root', 'com', 'net', 'ex', 'shop', 'www', 'ns1', 'eu', 'r-com', 'r-net', 'com-ex', 'ex-eu'];

const CACHES: Diagram = {
  title: 'One answer copied into several caches', width: 780, height: 200,
  nodes: [
    node('app', 'store', 10, 60, "app's cache", 'JVM, browser', 140, 64),
    node('os', 'store', 210, 60, 'OS cache', 'systemd-resolved', 140, 64),
    node('res', 'tool', 410, 60, 'resolver cache', 'your ISP or VPC', 150, 64),
    node('auth', 'kube', 620, 60, 'example.com server', 'sets the TTL', 150, 64),
  ],
  edges: [
    edge('a-r', 'auth', 'res', 'TTL 3600'),
    edge('r-o', 'res', 'os', 'TTL left'),
    edge('o-a', 'os', 'app', 'TTL left'),
  ],
};

const TRANSPORT: Diagram = {
  title: 'A query from the laptop to the resolver to the authoritative server', width: 780, height: 210,
  nodes: [
    node('laptop', 'code', 10, 70, 'your laptop', 'stub resolver', 150, 64),
    node('res', 'tool', 315, 70, 'resolver', undefined, 150, 64),
    node('auth', 'kube', 620, 70, 'example.com server', undefined, 150, 64),
  ],
  edges: [
    edge('q1', 'laptop', 'res', 'UDP 53', { shift: -10 }),
    edge('r1', 'res', 'laptop', 'answer', { shift: 10 }),
    edge('q2', 'res', 'auth', 'UDP 53', { shift: -10 }),
    edge('r2', 'auth', 'res', 'answer', { shift: 10 }),
  ],
};

const CHAIN: Diagram = {
  title: 'The DNSSEC chain of trust from the root key to one signed record', width: 780, height: 400,
  zones: [
    { id: 'zr', x: 10, y: 8, w: 760, h: 94, label: 'ROOT ZONE' },
    { id: 'zc', x: 10, y: 128, w: 760, h: 94, label: 'com ZONE' },
    { id: 'ze', x: 10, y: 248, w: 760, h: 144, label: 'example.com ZONE' },
  ],
  nodes: [
    node('anchor', 'person', 30, 32, 'trust anchor', 'configured in the resolver', 190, 56),
    node('rk', 'kube', 300, 32, 'root DNSKEY', undefined, 170, 56),
    node('dsc', 'part', 570, 36, 'DS for com', undefined, 180, 48),
    node('ck', 'kube', 570, 152, 'com DNSKEY', undefined, 180, 56),
    node('dse', 'part', 300, 156, 'DS for example.com', undefined, 170, 48),
    node('ek', 'kube', 300, 272, 'example.com DNSKEY', undefined, 170, 56),
    node('sig', 'part', 30, 276, 'RRSIG over shop A', undefined, 190, 48),
    node('a', 'part', 30, 342, 'shop A 192.0.2.10', undefined, 190, 40),
  ],
  edges: [
    edge('c1', 'anchor', 'rk', 'matches'),
    edge('c2', 'rk', 'dsc', 'signs'),
    edge('c3', 'dsc', 'ck', 'fingerprint of'),
    edge('c4', 'ck', 'dse', 'signs'),
    edge('c5', 'dse', 'ek', 'fingerprint of'),
    edge('c6', 'ek', 'sig', 'made'),
    edge('c7', 'sig', 'a', 'proves', { shift: -1 }),
  ],
};
const CHAIN_LINKS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];

const SPLIT: Diagram = {
  title: 'The same name asked from the internet, a VPC and an office', width: 780, height: 350,
  zones: [
    { id: 'zvpc', x: 0, y: 108, w: 780, h: 104, label: 'VPC 10.0.0.0/16' },
    { id: 'zoff', x: 0, y: 236, w: 780, h: 104, label: 'OFFICE 10.20.0.0/16' },
  ],
  nodes: [
    node('laptop', 'code', 14, 24, 'laptop', 'on the internet', 150, 58),
    node('pubres', 'tool', 250, 24, 'public resolver', undefined, 160, 58),
    node('pub', 'kube', 500, 24, 'public zone', 'shop → 192.0.2.10', 266, 58),
    node('ec2', 'code', 14, 136, 'EC2 instance', undefined, 150, 58),
    node('vpcres', 'tool', 250, 136, 'VPC resolver', '10.0.0.2', 160, 58),
    node('phz', 'kube', 500, 136, 'private zone', 'shop → 10.0.1.10', 266, 58),
    node('office', 'code', 14, 264, 'office PC', undefined, 150, 58),
    node('bind', 'tool', 250, 264, 'office DNS server', 'BIND, two views', 160, 58),
    node('internal', 'kube', 500, 264, 'internal view', 'shop → 10.0.1.10', 266, 58),
  ],
  edges: [
    edge('p1', 'laptop', 'pubres'),
    edge('p2', 'pubres', 'pub', 'shop?'),
    edge('v1', 'ec2', 'vpcres'),
    edge('v2', 'vpcres', 'phz', 'shop?'),
    edge('fall', 'vpcres', 'pub', 'falls back?', { kind: 'imagined' }),
    edge('o1', 'office', 'bind'),
    edge('o2', 'bind', 'internal', 'shop?'),
    edge('x1', 'ec2', 'pubres', 'dig @1.1.1.1'),
  ],
};
const SPLIT_ALL = [...SPLIT.nodes.map((n) => n.id), 'zvpc', 'zoff'];

const DIAG: Diagram = {
  title: 'Where a lookup can fail', width: 780, height: 250,
  nodes: [
    node('app', 'code', 10, 40, 'your app', 'curl, a service', 140, 58),
    node('hosts', 'part', 10, 176, '/etc/hosts', undefined, 140, 50),
    node('res', 'tool', 250, 20, 'resolver', 'validates DNSSEC', 150, 210),
    node('com', 'kube', 540, 20, 'com server', undefined, 230, 56),
    node('auth', 'kube', 540, 97, 'ns1.example.com', 'your zone', 230, 56),
    node('old', 'kube', 540, 174, 'ns1.old-dns.example.net', 'previous provider', 230, 56),
  ],
  edges: [
    edge('q', 'app', 'res', 'query', { shift: -9 }),
    edge('a', 'res', 'app', 'answer', { shift: 11 }),
    edge('h', 'app', 'hosts', 'read first'),
    edge('rc', 'res', 'com'),
    edge('ra', 'res', 'auth'),
    edge('ro', 'res', 'old'),
  ],
};
const DIAG_BASE = ['app', 'hosts', 'res', 'com', 'auth', 'q', 'a', 'h', 'rc', 'ra'];

const LOOP: Diagram = {
  title: 'A loop for changing DNS safely', width: 780, height: 250,
  nodes: [
    node('plan', 'part', 20, 30, 'lower the TTL', 'a TTL ahead', 200, 56),
    node('change', 'part', 290, 30, 'change one record', 'bump the serial', 200, 56),
    node('verify', 'part', 560, 30, 'check the source', 'dig @ns1 +norecurse', 200, 56),
    node('watch', 'part', 560, 170, 'watch from outside', 'several resolvers', 200, 56),
    node('drain', 'part', 290, 170, 'drain the old target', 'until traffic stops', 200, 56),
    node('restore', 'part', 20, 170, 'raise the TTL', 'back to normal', 200, 56),
  ],
  edges: [
    edge('e1', 'plan', 'change'), edge('e2', 'change', 'verify'), edge('e3', 'verify', 'watch'),
    edge('e4', 'watch', 'drain'), edge('e5', 'drain', 'restore'), edge('e6', 'restore', 'plan', 'next change'),
  ],
};

/* ---------- The record map ---------- */

export type Tone = 'blue' | 'teal' | 'purple' | 'amber' | 'grey';
export type District = { id: string; name: string; means: string; tone: Tone; box: { x: number; y: number; w: number; h: number }; outside?: boolean };
export type RecordType = {
  type: string; district: string; phrase: string;
  /** The few words on the map sign. */
  sign: string;
  says: string; line: string;
  /** Field name, the value in this example, and what it means. */
  fields: [string, string, string][];
  dig: [string, string];
  trap: string; sources: number[];
};

export const districts: District[] = [
  { id: 'connect', name: 'Where to connect', means: 'addresses and aliases', tone: 'blue', box: { x: 16, y: 54, w: 520, h: 110 } },
  { id: 'mail', name: 'Mail and policy text', means: 'who takes mail, what to trust', tone: 'teal', box: { x: 556, y: 54, w: 258, h: 110 } },
  { id: 'run', name: 'Running the zone', means: 'who answers, how to cache', tone: 'purple', box: { x: 16, y: 184, w: 258, h: 110 } },
  { id: 'services', name: 'Services', means: 'port and host for a protocol', tone: 'teal', box: { x: 294, y: 184, w: 242, h: 110 } },
  { id: 'certs', name: 'Certificates', means: 'which CAs may issue', tone: 'amber', box: { x: 556, y: 184, w: 258, h: 110 } },
  { id: 'proof', name: 'Proof', means: 'DNSSEC keys and signatures', tone: 'purple', box: { x: 16, y: 314, w: 520, h: 110 } },
  { id: 'reverse', name: 'Reverse zone', means: 'owned by the address holder', tone: 'grey', box: { x: 556, y: 314, w: 258, h: 110 }, outside: true },
];

export const records: RecordType[] = [
  {
    type: 'A', district: 'connect', phrase: 'IPv4 address', sign: 'IPv4 address',
    says: 'This name\'s IPv4 address.',
    line: 'shop.example.com.  3600  IN  A  192.0.2.10',
    fields: [['owner', 'shop.example.com.', 'The name the record belongs to. The trailing dot makes it absolute.'], ['TTL', '3600', 'Seconds a cache may keep it.'], ['class', 'IN', 'Internet. Effectively always IN.'], ['type', 'A', ''], ['data', '192.0.2.10', 'One IPv4 address. Several A records at one name give several addresses.']],
    dig: ['dig +short shop.example.com A', '192.0.2.10'],
    trap: 'Several A records are not a health-checked load balancer. The resolver returns all of them whether the servers behind them are up or not, and clients differ in which one they try first.',
    sources: [R1035, R2181],
  },
  {
    type: 'AAAA', district: 'connect', phrase: 'IPv6 address', sign: 'IPv6 address',
    says: 'This name\'s IPv6 address.',
    line: 'shop.example.com.  3600  IN  AAAA  2001:db8::10',
    fields: [['owner', 'shop.example.com.', ''], ['TTL', '3600', ''], ['type', 'AAAA', 'Four times the size of A, hence the name.'], ['data', '2001:db8::10', 'One IPv6 address.']],
    dig: ['dig +short shop.example.com AAAA', '2001:db8::10'],
    trap: 'A client with IPv6 asks for A and AAAA and races connections to both (Happy Eyeballs), often preferring IPv6. A stale or wrong AAAA breaks only IPv6 users, so the site "works for me" on an IPv4-only network. Move AAAA with A during a migration.',
    sources: [AAAA, HE],
  },
  {
    type: 'CNAME', district: 'connect', phrase: 'alias to another name', sign: 'alias',
    says: 'This name is another name. Look that one up instead.',
    line: 'www.example.com.  3600  IN  CNAME  shop.example.com.',
    fields: [['owner', 'www.example.com.', 'The alias.'], ['type', 'CNAME', 'Canonical name.'], ['data', 'shop.example.com.', 'The real name. The resolver follows it and returns both records.']],
    dig: ['dig www.example.com A +noall +answer', 'www.example.com.   3600 IN CNAME shop.example.com.\nshop.example.com.  3600 IN A     192.0.2.10'],
    trap: 'A CNAME can\'t share its name with any other record. The zone apex (example.com) always has SOA and NS, so it can\'t be a CNAME. DNS providers offer an ALIAS, ANAME or "flattening" feature instead: the provider resolves the target and serves plain A and AAAA records. Each hop in a CNAME chain keeps its own TTL.',
    sources: [R1034, R2181],
  },
  {
    type: 'HTTPS', district: 'connect', phrase: 'how to connect', sign: 'connection hints',
    says: 'How to reach this HTTPS service: protocols, port, address hints, before the first packet.',
    line: 'shop.example.com.  3600  IN  HTTPS  1 . alpn="h3,h2" ipv4hint=192.0.2.10',
    fields: [['priority', '1', '0 means alias mode (point at another name); 1 or more is service mode, lowest first.'], ['target', '.', 'A dot means "this same name".'], ['alpn', 'h3,h2', 'The client can try HTTP/3 on its first connection.'], ['ipv4hint', '192.0.2.10', 'A hint only. Clients still look up A and AAAA.']],
    dig: ['dig +short shop.example.com HTTPS', '1 . alpn="h3,h2" ipv4hint=192.0.2.10'],
    trap: 'HTTPS records are type 65, a sibling of the general SVCB type. Alias mode (priority 0) is allowed at the zone apex, where a CNAME is not, but only clients that ask for HTTPS records follow it. Forgetting to update ipv4hint during a move leaves clients with a stale address until they check A.',
    sources: [SVCB],
  },
  {
    type: 'MX', district: 'mail', phrase: 'mail exchanger', sign: 'mail servers',
    says: 'Where to deliver email for this domain. Lower preference first.',
    line: 'example.com.  3600  IN  MX  10 mail.example.com.',
    fields: [['owner', 'example.com.', 'The domain after the @.'], ['preference', '10', 'Lower is tried first; equal values share load.'], ['exchange', 'mail.example.com.', 'A host name that has A or AAAA records.']],
    dig: ['dig +short example.com MX', '10 mail.example.com.'],
    trap: 'The exchange must be a host name with address records: not an IP address and not a CNAME. A domain that receives no mail can say so with a null MX, "MX 0 .", so senders fail fast instead of retrying for days.',
    sources: [MX, R2181, NULLMX],
  },
  {
    type: 'TXT', district: 'mail', phrase: 'text: policies, proofs', sign: 'policies, proofs',
    says: 'Free text. In practice: published policies (SPF, DKIM keys, DMARC) and domain-ownership proofs.',
    line: 'example.com.  3600  IN  TXT  "v=spf1 include:_spf.mail.example.net -all"',
    fields: [['owner', 'example.com.', 'DMARC lives at _dmarc.example.com and DKIM keys at <selector>._domainkey.example.com.'], ['data', '"v=spf1 …"', 'One or more strings of up to 255 bytes each, joined by the reader.']],
    dig: ['dig +short example.com TXT', '"v=spf1 include:_spf.mail.example.net -all"\n"site-verification=4f2a…"'],
    trap: 'Only one SPF record per name. A second "v=spf1" TXT makes SPF evaluation fail with a permanent error. SPF also allows at most 10 DNS lookups for include and similar terms, which long include chains exceed.',
    sources: [SPF],
  },
  {
    type: 'SRV', district: 'services', phrase: 'service location', sign: 'host and port',
    says: 'Which host and port serve a named protocol.',
    line: '_imaps._tcp.example.com.  3600  IN  SRV  10 5 993 mail.example.com.',
    fields: [['owner', '_imaps._tcp.example.com.', '_service._protocol, then the domain.'], ['priority', '10', 'Lower first.'], ['weight', '5', 'Share between records with equal priority.'], ['port', '993', ''], ['target', 'mail.example.com.', 'A host name, not a CNAME.']],
    dig: ['dig +short _imaps._tcp.example.com SRV', '10 5 993 mail.example.com.'],
    trap: 'A client uses SRV only when its protocol says to: SIP, XMPP, LDAP, Kerberos, mail client set-up. Browsers don\'t use SRV for HTTP. Kubernetes publishes SRV records for named Service ports.',
    sources: [SRV, K8S],
  },
  {
    type: 'NS', district: 'run', phrase: 'name servers', sign: 'name servers',
    says: 'Which servers answer for this zone.',
    line: 'example.com.  172800  IN  NS  ns1.example.com.',
    fields: [['owner', 'example.com.', 'The zone.'], ['data', 'ns1.example.com.', 'A host name of an authoritative server.']],
    dig: ['dig +short example.com NS', 'ns1.example.com.\nns2.example.com.'],
    trap: 'NS records exist twice: in the parent (com) as the delegation, and in your zone as its own copy. Resolvers find you through the parent\'s copy, which you change at your registrar. Editing only the copy in your zone changes nothing for a resolver starting from the root.',
    sources: [R1034, R2181],
  },
  {
    type: 'SOA', district: 'run', phrase: 'start of authority', sign: 'zone facts',
    says: 'Facts about the zone itself, including how long to remember a "no".',
    line: 'example.com.  3600  IN  SOA  ns1.example.com. hostmaster.example.com. 2026101501 7200 3600 1209600 300',
    fields: [['primary', 'ns1.example.com.', ''], ['mailbox', 'hostmaster.example.com.', 'hostmaster@example.com, with the first dot as the @.'], ['serial', '2026101501', 'Secondaries copy the zone when this goes up.'], ['refresh / retry / expire', '7200 3600 1209600', 'Timers for secondary servers.'], ['minimum', '300', 'Since RFC 2308: how long resolvers cache NXDOMAIN and NODATA (the lower of this and the SOA\'s own TTL).']],
    dig: ['dig +short example.com SOA', 'ns1.example.com. hostmaster.example.com. 2026101501 7200 3600 1209600 300'],
    trap: 'The last field is no longer a default TTL. It sets negative caching: if anyone looks up a name before you create it, resolvers can keep answering "no such name" for that long after you add the record.',
    sources: [NEG, R1035],
  },
  {
    type: 'CAA', district: 'certs', phrase: 'certificate authority authorization', sign: 'allowed CAs',
    says: 'Which certificate authorities may issue certificates for this name.',
    line: 'example.com.  3600  IN  CAA  0 issue "letsencrypt.org"',
    fields: [['flags', '0', '128 marks a tag the CA must understand.'], ['tag', 'issue', 'issuewild covers wildcards; iodef gives a reporting address.'], ['value', '"letsencrypt.org"', 'The CA\'s domain.']],
    dig: ['dig +short example.com CAA', '0 issue "letsencrypt.org"'],
    trap: 'Only CAs read CAA, and only when issuing. Browsers ignore it, existing certificates are unaffected, and it encrypts nothing. A CA checks the exact name first, then climbs (shop.example.com, example.com) and uses the first CAA set it finds.',
    sources: [CAA],
  },
  {
    type: 'DS', district: 'proof', phrase: 'delegation signer', sign: 'fingerprint, in com',
    says: 'A fingerprint of the child zone\'s key, stored in the parent. One link in the chain of trust.',
    line: 'example.com.  86400  IN  DS  12345 13 2 3F5A…C9',
    fields: [['key tag', '12345', 'Which DNSKEY it fingerprints.'], ['algorithm', '13', 'ECDSA P-256 with SHA-256.'], ['digest type', '2', 'SHA-256.'], ['digest', '3F5A…C9', '']],
    dig: ['dig +short example.com DS', '12345 13 2 3F5A…C9'],
    trap: 'The DS lives in the com zone, so you set it at your registrar. Moving DNS providers or rolling keys without updating it makes every validating resolver return SERVFAIL for the whole zone.',
    sources: [DS_RECORDS, DS_INTRO],
  },
  {
    type: 'DNSKEY', district: 'proof', phrase: 'zone public key', sign: 'public key',
    says: 'The public keys that check this zone\'s signatures.',
    line: 'example.com.  3600  IN  DNSKEY  257 3 13 mdsswUyr…',
    fields: [['flags', '257', '257 is a key-signing key, which the DS points at; 256 is a zone-signing key.'], ['protocol', '3', 'Always 3.'], ['algorithm', '13', ''], ['key', 'mdsswUyr…', 'Base64 public key.']],
    dig: ['dig +multi example.com DNSKEY', 'example.com. 3600 IN DNSKEY 257 3 13 (\n        mdsswUyr… ) ; KSK; alg = ECDSAP256SHA256 ; key id = 12345'],
    trap: 'The key tag dig prints must match the tag in the parent\'s DS. When they differ, the chain breaks at this zone.',
    sources: [DS_RECORDS],
  },
  {
    type: 'RRSIG', district: 'proof', phrase: 'signature', sign: 'signature',
    says: 'A signature over one set of records, valid between two dates.',
    line: 'shop.example.com.  3600  IN  RRSIG  A 13 3 3600 20261029000000 20261015000000 34567 example.com. kQ9…',
    fields: [['covers', 'A', 'The record type it signs.'], ['labels / TTL', '3 3600', ''], ['expires / signed', '20261029… 20261015…', 'Outside this window the signature is invalid.'], ['key tag, signer', '34567 example.com.', 'Which DNSKEY made it.']],
    dig: ['dig +dnssec shop.example.com A +noall +answer', 'shop.example.com. 3600 IN A     192.0.2.10\nshop.example.com. 3600 IN RRSIG A 13 3 3600 20261029000000 …'],
    trap: 'Signatures expire. If whatever re-signs the zone stops, validation fails on the expiry date even though nobody changed a record.',
    sources: [DS_RECORDS, DS_PROTO],
  },
  {
    type: 'PTR', district: 'reverse', phrase: 'name for an address', sign: 'address → name',
    says: 'The name for an IP address. Lives in a reverse zone, not in example.com.',
    line: '10.2.0.192.in-addr.arpa.  3600  IN  PTR  shop.example.com.',
    fields: [['owner', '10.2.0.192.in-addr.arpa.', '192.0.2.10 with the octets reversed. IPv6 uses ip6.arpa, one label per hex digit.'], ['data', 'shop.example.com.', '']],
    dig: ['dig +short -x 192.0.2.10', 'shop.example.com.'],
    trap: 'The reverse zone belongs to whoever holds the address block: your cloud provider or ISP. Owning example.com doesn\'t let you set it; you ask the address owner, for example through EC2\'s reverse DNS setting. Mail servers often check that the PTR name\'s A record points back to the same address.',
    sources: [R1035],
  },
];

/* ---------- The record change timeline ---------- */

export type CellState = 'old' | 'new' | 'gone';
export type ChangeTimeline = {
  times: string[];
  moments: string[];
  modes: { id: 'prepared' | 'rushed'; label: string; summary: string; ttl: string[] }[];
  clients: { id: string; label: string; sub: string }[];
  /** [state, text] per plan, client and moment. */
  cells: Record<'prepared' | 'rushed', Record<string, [CellState, string][]>>;
};

export const change: ChangeTimeline = {
  times: ['T − 48 h', 'T − 47 h', 'T: change', 'T + 2 min', 'T + 1 h', 'T + 1 day'],
  moments: [
    'Today the A record says 192.0.2.10 with a TTL of 3600. You plan the move for T.',
    'An hour later, every honest cache has dropped answers that carried the old TTL.',
    'You change the A record to 203.0.113.20. Caches still hold the old address for up to their TTL.',
    'Two minutes on: the time a cache could hold the old answer has passed.',
    'An hour on: the unprepared plan has caught up, too.',
    'You switch off the old server.',
  ],
  modes: [
    { id: 'prepared', label: 'Lower the TTL first', summary: 'You lowered the TTL to 60 two days ahead.', ttl: ['3600 → 60', '60', '60', '60', '60', '3600'] },
    { id: 'rushed', label: 'Change it now', summary: 'You change the record with the TTL still at 3600.', ttl: ['3600', '3600', '3600', '3600', '3600', '3600'] },
  ],
  clients: [
    { id: 'laptop', label: 'Laptop', sub: 'ISP resolver, honours TTL' },
    { id: 'office', label: 'Office resolver', sub: 'cached seconds before T' },
    { id: 'java', label: 'Java service', sub: 'networkaddress.cache.ttl=-1' },
    { id: 'pool', label: 'Pooled connection', sub: 'keep-alive opened at T − 1 h' },
  ],
  cells: {
    prepared: {
      laptop: [['old', '192.0.2.10'], ['old', '192.0.2.10 · TTL 60'], ['old', 'old for ≤ 60 s'], ['new', '203.0.113.20'], ['new', '203.0.113.20'], ['new', '203.0.113.20']],
      office: [['old', '192.0.2.10'], ['old', '192.0.2.10 · TTL 60'], ['old', 'old, 55 s left'], ['new', '203.0.113.20'], ['new', '203.0.113.20'], ['new', '203.0.113.20']],
      java: [['old', '192.0.2.10'], ['old', 'cached forever'], ['old', 'cached forever'], ['old', '192.0.2.10'], ['old', '192.0.2.10'], ['gone', 'fails until restart']],
      pool: [['old', 'connected'], ['old', 'connected'], ['old', 'no lookup'], ['old', 'no lookup'], ['old', 'still connected'], ['gone', 'drops, reconnects → new']],
    },
    rushed: {
      laptop: [['old', '192.0.2.10'], ['old', '192.0.2.10'], ['old', 'old for ≤ 60 min'], ['old', 'old for ≤ 58 min'], ['new', '203.0.113.20'], ['new', '203.0.113.20']],
      office: [['old', '192.0.2.10'], ['old', '192.0.2.10'], ['old', 'old, 59 min left'], ['old', 'old, 57 min left'], ['new', '203.0.113.20'], ['new', '203.0.113.20']],
      java: [['old', '192.0.2.10'], ['old', 'cached forever'], ['old', 'cached forever'], ['old', '192.0.2.10'], ['old', '192.0.2.10'], ['gone', 'fails until restart']],
      pool: [['old', 'connected'], ['old', 'connected'], ['old', 'no lookup'], ['old', 'no lookup'], ['old', 'still connected'], ['gone', 'drops, reconnects → new']],
    },
  },
};

/* ---------- Split routing: who gets the question ---------- */

export type RouteState = 'public' | 'private' | 'corp' | 'fail';
/** One question's path: hops as [what, detail], the answer, its kind, and why it went that way. */
export type Route = { hops: [string, string][]; answer: string; state: RouteState; why: string };
export type PlaceId = 'home' | 'vpn' | 'ec2' | 'pod' | 'onprem';
export type SplitRouting = {
  names: string[];
  places: { id: PlaceId; label: string; sub: string; ask: string }[];
  setups: { id: string; label: string; summary: string; changes: Partial<Record<PlaceId, Partial<Record<number, Route>>>> }[];
  /** The routes as designed, one per name, for each place. A setup replaces some of them. */
  routes: Record<PlaceId, Route[]>;
};

const HOP = {
  resolved: ['systemd-resolved', 'the laptop\'s resolver'],
  wlan: ['wlan0', 'no domain matches: default route'],
  wgCorp: ['wg0', 'routing domain ~corp.example.com'],
  wgAll: ['wg0', 'routing domain ~.'],
  home: ['home router', 'forwards to the ISP'],
  pub: ['public zone', 'example.com'],
  corpDns: ['corporate DNS', '10.20.0.53'],
  corpZone: ['corp zone', 'corp.example.com'],
  vpc: ['VPC resolver', '10.0.0.2'],
  phz: ['private zone', 'example.com'],
  rule: ['forwarding rule', 'corp.example.com'],
  outbound: ['outbound endpoint', 'leaves the VPC'],
  internet: ['Internet Resolver rule', 'recursion for the rest'],
  forwarder: ['forwarder', 'example.com → inbound endpoint'],
  inbound: ['inbound endpoint', '10.0.0.10'],
  pod: ['Pod', 'search list first, ndots:5'],
  coredns: ['CoreDNS', 'not cluster.local: forward'],
  recurse: ['recursion', 'every other name'],
} satisfies Record<string, [string, string]>;
const via = (...hops: [string, string][]) => hops;
const PUBLIC_SHOP = '192.0.2.10';
const PUBLIC_STATUS = '192.0.2.30';
const PRIVATE_SHOP = '10.0.1.10';
const DB = '10.20.0.5';
const NO_FALLBACK = 'The private zone matches example.com but has no status record, so the answer is NXDOMAIN. The resolver does not try public DNS.';

const fromVpc = (prefix: [string, string][]): Route[] => [
  { hops: via(...prefix, HOP.vpc, HOP.phz), answer: PRIVATE_SHOP, state: 'private', why: 'A private zone named example.com is associated with the VPC, so the resolver answers from it.' },
  { hops: via(...prefix, HOP.vpc, HOP.phz), answer: 'NXDOMAIN', state: 'fail', why: NO_FALLBACK },
  { hops: via(...prefix, HOP.vpc, HOP.rule, HOP.outbound, HOP.corpDns, HOP.corpZone), answer: DB, state: 'corp', why: 'A forwarding rule for corp.example.com sends the question through the outbound endpoint to the corporate DNS server.' },
];

export const splitRouting: SplitRouting = {
  names: ['shop.example.com', 'status.example.com', 'db.corp.example.com'],
  places: [
    { id: 'home', label: 'Laptop, no VPN', sub: 'home Wi-Fi', ask: 'resolvectl query' },
    { id: 'vpn', label: 'Laptop on the VPN', sub: 'wg0 · ~corp.example.com', ask: 'resolvectl query' },
    { id: 'ec2', label: 'EC2 instance', sub: 'VPC resolver 10.0.0.2', ask: 'dig @10.0.0.2' },
    { id: 'pod', label: 'Pod', sub: 'CoreDNS, then the VPC', ask: 'getent hosts' },
    { id: 'onprem', label: 'On-premises server', sub: 'corporate DNS 10.20.0.53', ask: 'dig @10.20.0.53' },
  ],
  routes: {
    home: [
      { hops: via(HOP.resolved, HOP.wlan, HOP.home, HOP.pub), answer: PUBLIC_SHOP, state: 'public', why: 'No link has a routing domain for this name, so it goes to the default-route link and public DNS answers.' },
      { hops: via(HOP.resolved, HOP.wlan, HOP.home, HOP.pub), answer: PUBLIC_STATUS, state: 'public', why: 'The status page is published only in the public zone, and public DNS is all this laptop can reach.' },
      { hops: via(HOP.resolved, HOP.wlan, HOP.home, HOP.pub), answer: 'NXDOMAIN', state: 'fail', why: 'Off the VPN nothing routes corp.example.com, so the question goes to public DNS, which has no such name. The internal name has still left the laptop.' },
    ],
    vpn: [
      { hops: via(HOP.resolved, HOP.wlan, HOP.home, HOP.pub), answer: PUBLIC_SHOP, state: 'public', why: 'The VPN routes only corp.example.com. shop matches no routing domain, so it still goes out on wlan0 and gets the public answer.' },
      { hops: via(HOP.resolved, HOP.wlan, HOP.home, HOP.pub), answer: PUBLIC_STATUS, state: 'public', why: 'Like shop, this name matches no routing domain and is answered by public DNS.' },
      { hops: via(HOP.resolved, HOP.wgCorp, HOP.corpDns, HOP.corpZone), answer: DB, state: 'corp', why: 'The name ends in corp.example.com, the routing domain on wg0, so systemd-resolved sends it only to the VPN\'s DNS server.' },
    ],
    ec2: fromVpc([]),
    pod: fromVpc([HOP.pod, HOP.coredns]).map((route, index) => index === 0 ? { ...route, why: 'CoreDNS answers cluster.local names itself and forwards everything else to the node\'s resolver, so the Pod gets what the VPC gets.' } : route),
    onprem: [
      { hops: via(HOP.corpDns, HOP.forwarder, HOP.inbound, HOP.vpc, HOP.phz), answer: PRIVATE_SHOP, state: 'private', why: 'The corporate server forwards example.com to the Route 53 inbound endpoint, so on-premises machines see the VPC\'s private view.' },
      { hops: via(HOP.corpDns, HOP.forwarder, HOP.inbound, HOP.vpc, HOP.phz), answer: 'NXDOMAIN', state: 'fail', why: `Forwarding brings the private view's gaps along. ${NO_FALLBACK}` },
      { hops: via(HOP.corpDns, HOP.corpZone), answer: DB, state: 'corp', why: 'The corporate server holds corp.example.com itself and answers directly.' },
    ],
  },
  setups: [
    { id: 'designed', label: 'As designed', summary: 'The VPN routes corp.example.com, the VPC has a forwarding rule for it, and the corporate server forwards example.com to the VPC.', changes: {} },
    {
      id: 'unregistered', label: 'VPN DNS not registered', summary: 'The tunnel is up, but the VPN client never gave its DNS server and domain to systemd-resolved.',
      changes: { vpn: { 2: { hops: via(HOP.resolved, ['wlan0', 'wg0 has no DNS server'], HOP.home, HOP.pub), answer: 'NXDOMAIN', state: 'fail', why: 'Only wlan0 has a DNS server, so the internal name goes to public DNS. Packets to 10.20.0.5 would cross the tunnel; the name never gets there.' } } },
    },
    {
      id: 'all', label: 'VPN takes all DNS', summary: 'The VPN sets ~. on wg0, so every name goes to the corporate server.',
      changes: { vpn: {
        0: { hops: via(HOP.resolved, HOP.wgAll, HOP.corpDns, HOP.forwarder, HOP.inbound, HOP.vpc, HOP.phz), answer: PRIVATE_SHOP, state: 'private', why: 'The routing domain ~. makes wg0 the best match for every name. The corporate server forwards example.com to the VPC, so the laptop now sees the private view.' },
        1: { hops: via(HOP.resolved, HOP.wgAll, HOP.corpDns, HOP.forwarder, HOP.inbound, HOP.vpc, HOP.phz), answer: 'NXDOMAIN', state: 'fail', why: `VPN users lose the status page. ${NO_FALLBACK}` },
        2: { hops: via(HOP.resolved, HOP.wgAll, HOP.corpDns, HOP.corpZone), answer: DB, state: 'corp', why: 'Internal names still work: wg0 gets every question now.' },
      } },
    },
    {
      id: 'norule', label: 'Rule not associated', summary: 'The corp.example.com forwarding rule exists but isn\'t associated with this VPC.',
      changes: Object.fromEntries((['ec2', 'pod'] as const).map((place) => [place, { 2: { hops: via(...(place === 'pod' ? [HOP.pod, HOP.coredns] : []), HOP.vpc, HOP.internet, HOP.pub), answer: 'NXDOMAIN', state: 'fail', why: 'No rule for this VPC matches corp.example.com, so the Internet Resolver rule resolves it publicly, and public DNS has no such name.' } }])),
    },
    {
      id: 'noforwarder', label: 'No forwarder on-premises', summary: 'The corporate server has no forwarder for example.com and resolves it like any other name.',
      changes: { onprem: {
        0: { hops: via(HOP.corpDns, HOP.recurse, HOP.pub), answer: PUBLIC_SHOP, state: 'public', why: 'Without the forwarder, on-premises servers get the public view and reach the shop through its public address.' },
        1: { hops: via(HOP.corpDns, HOP.recurse, HOP.pub), answer: PUBLIC_STATUS, state: 'public', why: 'The status page resolves again, because the question no longer reaches the private zone.' },
      } },
    },
  ],
};

/* ---------- Views ---------- */

const groups = ['Finding a name', 'The zone\'s records', 'Time and change', 'Transport and trust', 'Split DNS', 'Context and failure'];

const views: View[] = [
  {
    id: 'name', group: groups[0], label: 'A name, a number', mode: 'steps',
    title: 'A browser can\'t connect to a name',
    lede: 'You type shop.example.com. Before a single byte of the shop can load, something has to turn that name into an address.',
    diagram: NAME,
    frames: [
      { action: 'A name', caption: 'Your browser has a name, but packets need an IP address. It can\'t open a connection to shop.example.com as it stands.', pic: { show: ['browser', 'server', 'wish'] } },
      { action: 'Ask', caption: 'So it asks a question: what is the IPv4 address for shop.example.com? The question has two parts, a name and a type (A, for IPv4). The answer comes back as a record: 192.0.2.10, reusable for 3600 seconds.', pic: { show: ['browser', 'resolver', 'server', 'ask', 'answer'], hot: ['ask', 'answer'], fresh: ['resolver'] },
        state: { title: 'The question and its answer', rows: [{ key: 'name', value: 'shop.example.com' }, { key: 'type', value: 'A (IPv4 address)' }, { key: 'answer', value: '192.0.2.10', mark: 'new' }, { key: 'TTL', value: '3600 seconds', mark: 'new' }] } },
      { action: 'Connect', caption: 'Then the browser connects to the address. DNS is done at this point: it carries none of the shop\'s traffic and never learns whether the connection worked.', pic: { show: ['browser', 'resolver', 'server', 'ask', 'answer', 'connect'], hot: ['connect'], badge: { server: 'connected' } } },
    ],
    inspector: {
      heading: 'DNS answers one kind of question',
      body: 'Every lookup is a name plus a type, and every answer is a set of records of that type. A, AAAA, MX and the rest are just different questions about the same name. The TTL tells anyone holding the answer how long they may reuse it without asking again.',
      facts: [['Question', 'name + type'], ['Answer', 'records, each with a TTL'], ['DNS carries', 'only the lookup, not your traffic']],
      evidence: ['ASK IT YOURSELF', 'dig +short shop.example.com A'],
      note: 'DNS doesn\'t check that the server behind an address is healthy. A perfectly correct answer can point at a machine that is down.',
    },
    takeaway: 'DNS turns a name and a type into records; everything after that is a connection DNS never sees.',
    sources: [R1034, R1035],
  },
  {
    id: 'before-dns', group: groups[0], label: 'Before the network', mode: 'choices',
    title: 'Your machine answers itself first',
    lede: 'Most applications don\'t speak DNS. They ask the operating system, and the operating system checks a few places before any packet leaves.',
    diagram: LOCAL,
    frames: [
      { action: 'The usual path', caption: 'Your app calls getaddrinfo(). Browsers and some runtimes check their own cache first (1). On Linux, glibc then follows the hosts line in /etc/nsswitch.conf, commonly the hosts file before DNS (2), then a local caching service such as systemd-resolved (3), and only then the network resolver (4).', pic: { hot: ['l1', 'l2', 'l3', 'l4'], badge: { res: '192.0.2.10' } },
        code: [code('What each tool consults', `
getent ahosts shop.example.com   # follows nsswitch, like your app
resolvectl query shop.example.com # asks systemd-resolved
dig shop.example.com             # asks the resolver, nothing else`)] },
      { action: 'A hosts file entry', caption: 'Someone added a line to /etc/hosts while testing. The lookup stops at step 2, so the app connects to 10.0.0.5. dig never reads the file, so it shows the public answer and looks healthy.', pic: { hot: ['l1', 'l2', 'd1'], denied: [], badge: { hosts: '10.0.0.5', res: '192.0.2.10' } },
        notice: { tone: 'warn', label: 'DNS LOOKS FINE, THE APP IS WRONG', text: 'dig says 192.0.2.10; curl and your service connect to 10.0.0.5.' },
        code: [code('Same name, two answers', `
$ dig +short shop.example.com
192.0.2.10
$ getent ahosts shop.example.com
10.0.0.5        STREAM shop.example.com
$ grep shop /etc/hosts
10.0.0.5  shop.example.com   # added for a test, never removed`, [4, 7])] },
      { action: 'An answer kept too long', caption: 'The record moved to 203.0.113.20 an hour ago. dig and new processes see the new address, but a long-running JVM still holds the old one in its own cache and never asks again.', pic: { hot: ['l1', 'd1'], badge: { appcache: '192.0.2.10 (old)', res: '203.0.113.20' } },
        notice: { tone: 'warn', label: 'RESTART FIXES IT', text: 'If a restart cures it, look for a cache inside the process.' } },
    ],
    inspector: {
      heading: 'dig is not what your app does',
      body: 'dig, host and nslookup send a DNS query straight to a resolver. Your application goes through the system resolver library, which reads /etc/hosts and may use a local cache, and the app may cache on top of that. When dig and the app disagree, the difference is somewhere between them.',
      facts: [['Order is set by', '/etc/nsswitch.conf, hosts line'], ['Resolver address from', '/etc/resolv.conf (often 127.0.0.53)'], ['glibc itself', 'does not cache answers']],
      evidence: ['ASK LIKE THE APP DOES', 'getent ahosts shop.example.com'],
      note: 'macOS and Windows have their own system resolvers and caches, and browsers can send DNS over HTTPS to a provider they choose, skipping the system resolver entirely.',
    },
    takeaway: 'When dig and your app disagree, the difference lives between them: an app cache, a hosts file, or a local cache.',
    sources: [NSSWITCH, GAI, RESOLVCONF, RESOLVED, JAVA],
  },
  {
    id: 'lookup', group: groups[0], label: 'Follow a lookup', mode: 'steps', hero: true,
    title: 'The resolver walks the tree for you',
    lede: 'Your laptop asks one question. A recursive resolver does the walking: root, then com, then the servers for example.com, keeping everything it learns.',
    diagram: LOOKUP,
    frames: [
      { action: 'Ask', caption: 'Your laptop\'s stub resolver sends one question to the recursive resolver it was given by DHCP or VPN settings, and asks it to do the work (the RD flag). The resolver\'s cache is empty.', pic: { show: [...LOOKUP_ALL, 'ask'], hot: ['ask'] },
        store: { title: 'Resolver cache', rows: [{ id: '—', text: 'empty' }] } },
      { action: 'Ask the root', caption: 'The resolver knows the root servers\' addresses from a built-in hints file. With QNAME minimisation, it tells the root only what the root needs: it wants the servers for com, not the full name.', pic: { show: [...LOOKUP_ALL, 'ask', 'q-root'], hot: ['q-root'] },
        notice: { tone: 'ok', label: 'MINIMISED', text: 'Older resolvers send shop.example.com to every server on the way. RFC 9156 limits each server to the part it is responsible for.' } },
      { action: 'Referral', caption: 'The root doesn\'t know shop.example.com and doesn\'t need to. It returns a referral: NS records for com and their addresses. No answer, only "ask them".', pic: { show: [...LOOKUP_ALL, 'ask', 'q-root', 'r-root'], hot: ['r-root'], badge: { root: 'referral' } },
        code: [code('From a.root-servers.net', `
;; flags: qr; ANSWER: 0, AUTHORITY: 13, ADDITIONAL: 27
;; AUTHORITY SECTION:
com.   172800  IN  NS  a.gtld-servers.net.
com.   172800  IN  NS  b.gtld-servers.net.
;; ADDITIONAL SECTION:
a.gtld-servers.net.  172800  IN  A  192.5.6.30`, [1, 3])] },
      { action: 'Ask com', caption: 'The resolver asks a com server who serves example.com.', pic: { show: [...LOOKUP_ALL, 'ask', 'q-root', 'r-root', 'q-tld'], hot: ['q-tld'] } },
      { action: 'Referral with glue', caption: 'Another referral: ns1 and ns2.example.com. Those names are inside example.com itself, so the com server also returns their addresses (glue). Without glue the resolver would need example.com\'s servers to find example.com\'s servers.', pic: { show: [...LOOKUP_ALL, 'ask', 'q-root', 'r-root', 'q-tld', 'r-tld'], hot: ['r-tld'], badge: { tld: 'referral + glue' } },
        code: [code('From a com server', `
;; AUTHORITY SECTION:
example.com.  172800  IN  NS  ns1.example.com.
example.com.  172800  IN  NS  ns2.example.com.
;; ADDITIONAL SECTION:
ns1.example.com.  172800  IN  A  192.0.2.53
ns2.example.com.  172800  IN  A  198.51.100.53`, [5, 6])] },
      { action: 'Ask example.com', caption: 'Now the resolver asks the zone\'s own server the full question.', pic: { show: [...LOOKUP_ALL, 'ask', 'q-root', 'r-root', 'q-tld', 'r-tld', 'q-auth'], hot: ['q-auth'] } },
      { action: 'Answer', caption: 'ns1.example.com answers with the record and sets the aa flag: the answer comes from a server authoritative for the zone, not from a cache.', pic: { show: [...LOOKUP_ALL, 'ask', 'q-root', 'r-root', 'q-tld', 'r-tld', 'q-auth', 'a-auth'], hot: ['a-auth'], badge: { auth: 'aa' } },
        code: [code('From ns1.example.com', `
;; flags: qr aa; ANSWER: 1
;; ANSWER SECTION:
shop.example.com.  3600  IN  A  192.0.2.10`, [1])] },
      { action: 'Cache', caption: 'The resolver keeps everything it learned, each for its own TTL: two days for the delegations, an hour for the shop.', pic: { show: [...LOOKUP_ALL, 'ask', 'q-root', 'r-root', 'q-tld', 'r-tld', 'q-auth', 'a-auth', 'store'], hot: ['store'] },
        store: { title: 'Resolver cache', rows: [{ id: 'com NS', text: '172800 s', mark: 'fresh' }, { id: 'example.com NS', text: '172800 s', mark: 'fresh' }, { id: 'shop A', text: '192.0.2.10 · 3600 s', mark: 'fresh' }] } },
      { action: 'Reply', caption: 'Your laptop gets the answer. The ra flag says the resolver did recursion; aa is gone because, to you, this is now the resolver\'s answer.', pic: { show: [...LOOKUP_ALL, 'ask', 'q-root', 'r-root', 'q-tld', 'r-tld', 'q-auth', 'a-auth', 'store', 'reply'], hot: ['reply'] },
        code: [code('What dig shows on the laptop', `
;; ->>HEADER<<- opcode: QUERY, status: NOERROR
;; flags: qr rd ra; QUERY: 1, ANSWER: 1
;; ANSWER SECTION:
shop.example.com.  3600  IN  A  192.0.2.10`, [2])] },
      { action: 'A second laptop', caption: 'Twenty minutes later a colleague asks the same resolver. It answers from its cache without contacting any server, and the TTL it hands out has counted down to 2400.', pic: { show: [...LOOKUP_ALL, 'ask', 'reply', 'store'], hot: ['ask', 'reply'], say: { reply: '192.0.2.10 · TTL 2400' }, badge: { cache: 'hit' } },
        store: { title: 'Resolver cache', rows: [{ id: 'com NS', text: '171 000 s left' }, { id: 'example.com NS', text: '171 000 s left' }, { id: 'shop A', text: '192.0.2.10 · 2400 s left', mark: 'loaded' }] } },
    ],
    inspector: {
      heading: 'Referrals, then an answer',
      body: 'Only the last server knows the answer. The root and com servers know who to ask next, and say so with NS records in a referral. Because the resolver caches those referrals for days, the full walk is rare: most lookups start at a server the resolver already knows.',
      facts: [['Root servers', '13 names, a–m.root-servers.net, each many anycast sites'], ['Walking done by', 'the recursive resolver'], ['aa flag', 'answer from the zone\'s own server']],
      evidence: ['WATCH THE WALK', 'dig +trace shop.example.com'],
      note: 'dig +trace does the walk from your machine, not from your resolver. It shows what the delegation says, which is not necessarily what your resolver has cached.',
    },
    takeaway: 'A resolver follows referrals from the root down and caches each one, so most lookups skip straight to the last server or to the cache.',
    sources: [R1034, QMIN, GLUE, ROOTS, DIG],
  },
  {
    id: 'zones', group: groups[0], label: 'Zones and delegation', mode: 'choices',
    title: 'The tree is cut into zones',
    lede: 'The referrals in the last view happen at zone cuts. A zone is the part of the tree one set of servers answers for; the parent points to it with NS records.',
    diagram: ZONES,
    frames: [
      { action: 'Zones and cuts', caption: 'The root zone delegates com, com delegates example.com, and example.com can delegate eu.example.com to another provider. shop and www aren\'t zones; they are names inside example.com and live in its zone file.', pic: { show: ZONES_BASE, hot: ['r-com', 'com-ex', 'ex-eu'] },
        table: { title: 'Who answers for what', head: ['Name', 'Answered by'], rows: [['com', 'the com servers'], ['example.com, shop, www', 'ns1 and ns2.example.com'], ['eu.example.com', 'the other provider\'s servers']] } },
      { action: 'Glue', caption: 'ns1.example.com is a name inside the zone it serves. To break the loop, the com zone holds a copy of its address. That copy is glue: not authoritative data, just enough to reach the server.', pic: { show: ZONES_BASE, hot: ['com-ex'], fresh: ['ns1'], badge: { ns1: '192.0.2.53', com: 'holds glue' } },
        table: { title: 'What the com zone holds for example.com', head: ['Record', 'Purpose'], rows: [['example.com NS ns1.example.com', 'the delegation'], ['example.com NS ns2.example.com', 'the delegation'], ['ns1.example.com A 192.0.2.53', 'glue'], ['ns2.example.com A 198.51.100.53', 'glue'], ['example.com DS 12345 13 2 …', 'DNSSEC link, if signed']], hot: 2 } },
      { action: 'Parent still points at the old provider', caption: 'You moved example.com to new servers and updated NS inside the zone, but the registrar still lists the old provider. Resolvers follow the parent, reach servers that no longer hold the zone, and get REFUSED or nothing. This is a lame delegation.', pic: { show: [...ZONES_BASE.filter((id) => id !== 'com-ex'), 'old', 'com-old'], denied: ['old', 'com-old'], badge: { old: 'REFUSED', ex: 'never asked' } },
        notice: { tone: 'stop', label: 'LAME DELEGATION', text: 'The new servers answer correctly when asked directly, which makes this easy to miss. The registrar\'s NS list is what resolvers follow.' } },
    ],
    inspector: {
      heading: 'Authority is handed down',
      body: 'A parent zone doesn\'t store its children\'s records. It stores NS records that say who does, plus glue when needed. That one handover is what lets each organisation run its own part of the tree.',
      facts: [['Delegation', 'NS records in the parent'], ['Glue', 'addresses for in-zone name servers'], ['You change the parent\'s NS', 'at your registrar']],
      evidence: ['ASK THE PARENT DIRECTLY', 'dig @a.gtld-servers.net example.com NS +norecurse'],
      note: 'A subdomain is not automatically a separate zone. eu.example.com becomes one only when example.com delegates it with NS records.',
    },
    takeaway: 'Resolvers trust the parent\'s NS records to find a zone, so a provider change is finished only when the registrar says so.',
    sources: [R1034, GLUE, R2181, TERMS],
  },
  {
    id: 'records', group: groups[1], label: 'Record map', mode: 'custom',
    title: 'What the zone for example.com holds',
    lede: 'A zone is a list of records. Each type answers a different question about a name. Choose a sign to see its fields, an example, and the trap that catches people.',
    frames: [],
    inspector: {
      heading: 'Every record has the same shape',
      body: 'Owner name, TTL, class, type, then data whose format depends on the type. A lookup asks for one name and one type and gets back every record that matches both, which DNS calls a record set.',
      facts: [['Shape', 'owner TTL IN type data'], ['A lookup returns', 'all records of one name and type'], ['Reverse records', 'live in a different zone']],
      evidence: ['SEE ONE TYPE', 'dig example.com MX +noall +answer'],
      note: 'Records of one name and type share a TTL. If they differ, RFC 2181 says to treat it as an error and use the lowest.',
    },
    takeaway: 'A record type is a question; pick the type that asks what the client actually needs, and remember who else reads it.',
    sources: [R1035, R2181],
  },
  {
    id: 'caches', group: groups[2], label: 'Caches and TTLs', mode: 'choices',
    title: 'Every layer keeps a copy',
    lede: 'The answer you saw in the lookup doesn\'t live in one cache. It\'s copied into the resolver, the operating system and sometimes the app, each counting down on its own.',
    diagram: CACHES,
    frames: [
      { action: 'A normal answer', caption: 'The zone sets TTL 3600. The resolver got the answer 20 minutes ago, so it hands out the remaining 2400. Each layer counts down from what it received, so no copy can outlive the original by following TTLs alone.', pic: { hot: ['a-r', 'r-o', 'o-a'], say: { 'a-r': '3600', 'r-o': '2400', 'o-a': '2390' }, badge: { res: '2400 s', os: '2390 s', app: '30 s, its own rule' } } },
      { action: '"No such name"', caption: 'Someone looked up new.example.com before you created it. The resolver cached NXDOMAIN for the lower of the SOA\'s TTL and its minimum field: 300 seconds. Create the record now and that resolver can keep saying "no" for up to five minutes.', pic: { hot: ['a-r', 'r-o'], say: { 'a-r': 'NXDOMAIN + SOA', 'r-o': 'NXDOMAIN' }, badge: { res: 'no, for 300 s' } },
        code: [code('The SOA in a negative answer', `
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN
;; AUTHORITY SECTION:
example.com.  300  IN  SOA  ns1.example.com. hostmaster.example.com. (
              2026101501 7200 3600 1209600 300 )`, [1, 4])] },
      { action: 'The resolver\'s own limits', caption: 'Resolvers apply their own bounds. Unbound caps every TTL at one day and negative answers at an hour by default; operators can also set a floor. A TTL of 604800 in your zone may be held for only 86400.', pic: { hot: ['a-r'], say: { 'a-r': 'TTL 604800' }, badge: { res: 'kept 86400' } } },
      { action: 'Serving stale', caption: 'Your name servers are unreachable and the cached answer has expired. A resolver that implements serve-stale may keep answering with the expired record, using a short TTL, rather than failing. Your site stays reachable; it also means an old answer can outlive its TTL.', pic: { hot: ['r-o', 'o-a'], denied: ['a-r', 'auth'], badge: { res: 'expired, served stale', auth: 'unreachable' } },
        notice: { tone: 'warn', label: 'OPTIONAL BEHAVIOUR', text: 'RFC 8767 describes serve-stale and suggests a 30-second TTL on stale answers. Whether a resolver does it is a configuration choice.' } },
    ],
    table: { title: 'Caches that don\'t follow DNS TTLs', head: ['Where', 'What it does'], rows: [['OpenJDK', 'Caches successful lookups for 30 s by default, forever if a security manager is installed; set networkaddress.cache.ttl in java.security.'], ['nginx proxy_pass with a fixed host name', 'Looks the name up when the configuration loads. A variable plus a resolver directive makes it look up at run time.'], ['Connection pools, keep-alive, HTTP/2', 'Don\'t look anything up while the connection is open. They keep using the old address until it closes.'], ['Browsers', 'Keep their own short-lived cache in addition to the OS.']] },
    inspector: {
      heading: 'A TTL is a maximum, counted per copy',
      body: 'A cache may drop an answer early, and well-behaved caches never keep it past its TTL. But the clock starts when each copy is made, resolvers bound TTLs with their own limits, and some application caches ignore DNS TTLs altogether.',
      facts: [['TTL set by', 'the zone owner, per record set'], ['Negative TTL', 'min(SOA TTL, SOA minimum)'], ['Unbound default cap', '86400 s; negative 3600 s']],
      evidence: ['SEE THE TTL COUNT DOWN', 'dig shop.example.com +noall +answer   # run twice'],
      note: 'Flushing your laptop\'s cache doesn\'t flush your resolver\'s, and neither touches the cache inside a running app.',
    },
    takeaway: 'Each cache counts down from the TTL it was handed, and some caches ignore TTLs altogether, so a change takes as long as the slowest copy to clear.',
    sources: [NEG, STALE, UNBOUND, JAVA, NGINX, R2181],
  },
  {
    id: 'change', group: groups[2], label: 'Change a record', mode: 'custom', hero: true,
    title: 'Moving the shop to a new address',
    lede: 'The shop moves from 192.0.2.10 to 203.0.113.20. Step through the hours around the change and compare four clients that each remember the old address differently.',
    frames: [],
    inspector: {
      heading: 'You can\'t recall an answer',
      body: 'Once a cache holds the old record, nothing you change in the zone reaches it before it expires. You control the change through the TTL you published before it: lower it at least one old TTL in advance, then the window after the change is short.',
      facts: [['Lower the TTL', 'at least one old TTL before'], ['Keep the old target', 'until its traffic stops'], ['Not covered by DNS', 'pinned caches, open connections']],
      evidence: ['WATCH THE OLD TARGET', 'tail the old server\'s access log'],
      note: 'Clients that cache forever or hold connections open only move when they restart or reconnect. Find them in the old server\'s logs before you switch it off.',
    },
    takeaway: 'A DNS change is safe when the old TTL has already been lowered and the old target stays up until its logs go quiet.',
    sources: [R1034, NEG, JAVA, NGINX],
  },
  {
    id: 'transport', group: groups[3], label: 'UDP, TCP, encrypted', mode: 'choices',
    title: 'How the question travels',
    lede: 'Most lookups are one UDP packet each way. Large answers need TCP, and the hop from your laptop to the resolver can be encrypted.',
    diagram: TRANSPORT,
    frames: [
      { action: 'Small answer', caption: 'A query and its answer each fit in one UDP datagram on port 53. No connection set-up, so a lookup costs one round trip per server asked.', pic: { hot: ['q1', 'r1', 'q2', 'r2'] } },
      { action: 'Large answer', caption: 'A signed answer or a long TXT set can exceed the size the client advertised with EDNS (1232 bytes is the common choice). The server sends what fits and sets the TC flag. The client retries over TCP on port 53 and gets the full answer.', pic: { hot: ['q2', 'r2'], say: { q2: 'retry: TCP 53', r2: 'TC=1, then full' }, badge: { auth: 'truncated' } },
        code: [code('dig, when a UDP answer is truncated', `
;; Truncated, retrying in TCP mode.
;; ->>HEADER<<- opcode: QUERY, status: NOERROR
;; flags: qr aa; QUERY: 1, ANSWER: 12`, [1])] },
      { action: 'TCP blocked', caption: 'A firewall allows only UDP 53. Small answers work; large ones never arrive. Lookups for a few names time out or fail, and only after DNSSEC or a long TXT record pushed them over the limit.', pic: { hot: ['q2'], denied: ['r2'], say: { q2: 'retry: TCP 53', r2: 'TCP blocked' }, badge: { res: 'times out' } },
        notice: { tone: 'stop', label: 'TCP IS REQUIRED', text: 'RFC 7766 makes TCP support mandatory for DNS. Firewalls must allow TCP 53 as well as UDP.' } },
      { action: 'Encrypted to the resolver', caption: 'DNS over TLS (port 853) or HTTPS (port 443) hides your questions from the network between your laptop and the resolver. The resolver still sees them, and still talks to authoritative servers in the clear.', pic: { hot: ['q1', 'r1'], say: { q1: 'DoT 853 / DoH 443', r1: 'encrypted' }, badge: { res: 'sees every query' } } },
    ],
    inspector: {
      heading: 'Size decides UDP or TCP',
      body: 'Classic DNS limited UDP answers to 512 bytes. EDNS lets each side advertise a bigger buffer, and DNS Flag Day 2020 settled on 1232 bytes to avoid IP fragmentation. Anything larger falls back to TCP, so TCP 53 has to work.',
      facts: [['Plain DNS', 'UDP and TCP 53'], ['DNS over TLS', 'TCP 853'], ['DNS over HTTPS', '443, alongside web traffic']],
      evidence: ['FORCE TCP', 'dig +tcp shop.example.com'],
      note: 'Encrypting the hop doesn\'t prove the answer is genuine; a resolver can still pass on a forged record. Proving answers is DNSSEC\'s job, next.',
    },
    takeaway: 'DNS needs both UDP and TCP on port 53; encryption protects one hop from eavesdroppers, not the answer\'s authenticity.',
    sources: [R1035, EDNS, TCP, FLAGDAY, DOT, DOH],
  },
  {
    id: 'dnssec', group: groups[3], label: 'Proving answers', mode: 'choices',
    title: 'DNSSEC: a chain of signatures from the root',
    lede: 'DNSSEC lets a validating resolver prove that a record came from the zone\'s owner unchanged. Each zone signs its records; each parent vouches for its child\'s key.',
    diagram: CHAIN,
    frames: [
      { action: 'Valid chain', caption: 'The resolver trusts the root key it was configured with. The root signs a DS for com, which fingerprints com\'s key; com signs a DS for example.com; example.com\'s key made the RRSIG over the shop\'s A record. Every link checks, so the resolver sets the ad flag.', pic: { hot: CHAIN_LINKS, badge: { a: 'secure' } },
        code: [code('dig from a validating resolver', `
;; ->>HEADER<<- opcode: QUERY, status: NOERROR
;; flags: qr rd ra ad; QUERY: 1, ANSWER: 1`, [2])] },
      { action: 'Broken link', caption: 'example.com moved to a new DNS provider with new keys, but the registrar still has the old DS. The fingerprint matches no key, the chain breaks, and the resolver refuses to return the answer at all: SERVFAIL. Non-validating resolvers still answer, so it fails for some users only.', pic: { hot: ['c1', 'c2', 'c3', 'c4'], denied: ['c5', 'ek'], badge: { a: 'withheld' } },
        code: [code('dig, and dig with checking disabled', `
$ dig shop.example.com
;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL
; EDE: 9 (DNSKEY Missing): (No DNSKEY matches DS RRs of example.com)
$ dig +cd shop.example.com +short
192.0.2.10`, [2, 3, 5])] },
      { action: 'Unsigned zone', caption: 'com has no DS for example.com, so there is no chain to follow. The answer is returned as insecure: no ad flag and no protection, but no failure either. Most zones are in this state.', pic: { hot: ['c1', 'c2', 'c3'], show: ['zr', 'zc', 'ze', 'anchor', 'rk', 'dsc', 'ck', 'a', 'c1', 'c2', 'c3'], badge: { a: 'insecure', ck: 'no DS for example.com' } } },
    ],
    table: { title: 'Three protections people mix up', head: ['Mechanism', 'What it protects', 'What it doesn\'t'], rows: [['DNSSEC', 'The answer came from the zone owner and wasn\'t changed.', 'Privacy: queries and answers are readable.'], ['DoT / DoH', 'The hop to the resolver is private and untampered.', 'Who wrote the answer; the resolver could lie.'], ['CAA', 'Which CAs may issue a certificate for the name.', 'Lookups. Only CAs read it, only when issuing.']] },
    inspector: {
      heading: 'Validation happens at the resolver',
      body: 'Your laptop usually trusts its resolver\'s ad flag rather than validating itself. When validation fails, a validating resolver returns SERVFAIL instead of an answer it can\'t prove, and may add an extended error code saying why.',
      facts: [['DS', 'in the parent, set at the registrar'], ['DNSKEY, RRSIG', 'in your zone'], ['Failure looks like', 'SERVFAIL, works with +cd']],
      evidence: ['TEST VALIDATION', 'dig +cd shop.example.com   # answers? then DNSSEC is the problem'],
      note: 'Some signed zones answer a nonexistent name with NOERROR and no records instead of NXDOMAIN (compact denial, RFC 9824). Scripts that look only for NXDOMAIN miss it.',
    },
    takeaway: 'DNSSEC proves who wrote an answer, encryption hides the question in transit, and CAA governs certificates; none of them does another\'s job.',
    sources: [DS_INTRO, DS_RECORDS, DS_PROTO, EDE, COMPACT, CAA],
  },
  {
    id: 'split', group: groups[4], label: 'One name, two answers', mode: 'choices',
    title: 'Same name, different answer',
    lede: 'Who asks matters. The same name can resolve to a public address from the internet and a private one from inside your network.',
    diagram: SPLIT,
    frames: [
      { action: 'From the internet', caption: 'A laptop asks a public resolver, which walks the public delegation to the public zone and gets 192.0.2.10.', pic: { show: [...SPLIT_ALL, 'p1', 'p2'], hot: ['p1', 'p2'], badge: { pub: '192.0.2.10' } } },
      { action: 'Inside the VPC', caption: 'An EC2 instance asks the VPC resolver. A private hosted zone also named example.com is associated with this VPC, so the resolver answers from it: 10.0.1.10, a private address. This is split-horizon DNS; AWS calls it split-view.', pic: { show: [...SPLIT_ALL, 'p1', 'p2', 'v1', 'v2'], hot: ['v1', 'v2'], badge: { phz: '10.0.1.10' } } },
      { action: 'Name missing from the private zone', caption: 'The instance looks up status.example.com, which exists only in the public zone. The private zone matches example.com, has no such record, and the resolver returns NXDOMAIN. It does not fall back to the public zone.', pic: { show: [...SPLIT_ALL, 'p1', 'p2', 'v1', 'v2', 'fall'], hot: ['v1', 'v2'], say: { v2: 'status?' }, badge: { phz: 'NXDOMAIN' } },
        notice: { tone: 'stop', label: 'NO FALLBACK', text: 'Route 53 documents this: a matching private zone without the record returns NXDOMAIN rather than asking public DNS. Copy every name internal clients need into the private zone.' } },
      { action: 'Without a cloud', caption: 'An office DNS server can do the same with BIND views. Each view holds its own copy of example.com and matches clients by source address; a question is answered from the first view that matches. Office PCs get the internal copy.', pic: { show: [...SPLIT_ALL, 'p1', 'p2', 'v1', 'v2', 'o1', 'o2'], hot: ['o1', 'o2'], badge: { internal: '10.0.1.10' } },
        code: [code('named.conf: two views of one zone', `
view "internal" {
  match-clients { 10.20.0.0/16; };
  zone "example.com" { type primary; file "internal/example.com"; };
};
view "external" {
  match-clients { any; };
  zone "example.com" { type primary; file "external/example.com"; };
};`, [2, 6])] },
      { action: 'Which view answered?', caption: 'When two machines disagree about a name, ask each resolver directly. The answers differ because the questions reached different zones, not because one copy is stale.', pic: { show: [...SPLIT_ALL, 'p2', 'v1', 'v2', 'x1'], hot: ['x1', 'p2', 'v1', 'v2'], badge: { pub: '192.0.2.10', phz: '10.0.1.10' } },
        code: [code('Ask both views from the instance', `
$ dig @10.0.0.2 shop.example.com +short
10.0.1.10
$ dig @1.1.1.1 shop.example.com +short
192.0.2.10`, [1, 3])] },
    ],
    inspector: {
      heading: 'The resolver you ask decides the view',
      body: 'Split-horizon DNS serves different records for one name depending on where the question comes from. Cloud private zones, BIND views and corporate DNS servers all do it. Each view is a separate copy of the zone, so a name added to one is missing from the other until you add it there too.',
      facts: [['Route 53 VPC resolver', 'VPC CIDR base + 2'], ['Private zone without the record', 'NXDOMAIN, no fallback'], ['BIND views', 'first matching view answers']],
      evidence: ['COMPARE VIEWS', 'dig @10.0.0.2 shop.example.com +short; dig @1.1.1.1 shop.example.com +short'],
      note: 'A geo or latency routing policy is the same idea driven by the resolver\'s location instead of its network.',
    },
    takeaway: 'An answer belongs to a view; when results differ between machines, first ask which resolver each one used.',
    sources: [R53, VIEWS],
  },
  {
    id: 'routes', group: groups[4], label: 'Who gets the question', mode: 'custom', hero: true,
    title: 'Which resolver gets the question',
    lede: 'Before any view can answer, something decides where a question goes. Pick a place and a name to follow the question, then break one piece of the setup and see which answers change.',
    frames: [],
    inspector: {
      heading: 'Routing by suffix',
      body: 'Split DNS also means sending different names to different resolvers. A laptop on a VPN sends corp.example.com to the VPN\'s server and everything else to its usual one. A VPC forwards matching names to your network, and a corporate server forwards names to the VPC. Each picks the longest matching suffix.',
      facts: [['systemd-resolved', 'best routing domain, else default route'], ['Route 53 VPC Resolver', 'most specific rule wins'], ['CoreDNS', 'cluster.local itself, the rest forwarded']],
      evidence: ['SEE THE ROUTE', 'resolvectl query db.corp.example.com   # -- link: wg0'],
      note: 'A rule for a name also covers its subdomains. In Route 53 a forwarding rule beats a private zone of the same name, and a system rule carves a subdomain back out.',
    },
    takeaway: 'Split routing decides which resolver hears a name; when an internal name fails, find which link or rule it left on before blaming the zone.',
    sources: [RESOLVED, NETWORKD, RESOLVECTL, R53_RULES, R53_ENDPOINTS, R53, K8S_CUSTOM, K8S],
  },
  {
    id: 'diagnose', group: groups[5], label: 'Diagnose a failure', mode: 'choices', hero: true,
    title: 'Diagnose a failed lookup',
    lede: 'Applications flatten every DNS problem into "could not resolve". Pick a fault, then run the checks in order to see the evidence that separates them.',
    diagram: DIAG,
    frames: [
      { action: 'No such name', caption: 'curl: (6) Could not resolve host: shop.example.com', pic: { show: DIAG_BASE, hot: ['q', 'a', 'rc', 'ra'], say: { a: 'NXDOMAIN' }, badge: { auth: 'NXDOMAIN' } },
        checks: [
          ['dig shop.example.com', ';; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN\n;; AUTHORITY SECTION:\nexample.com.  300  IN  SOA  ns1.example.com. …', 'NXDOMAIN with the zone\'s SOA: a server for example.com says the name doesn\'t exist.'],
          ['dig @ns1.example.com shop.example.com +norecurse', ';; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN\n;; flags: qr aa', 'The authoritative server agrees (aa). This isn\'t a cache; the record really is missing or misspelt.'],
        ],
        verdict: 'Create the record. Resolvers that cached the NXDOMAIN keep it for up to the SOA minimum, 300 s here.' },
      { action: 'Name exists, type doesn\'t', caption: 'curl: (6) Could not resolve host: api.example.com', pic: { show: DIAG_BASE, hot: ['q', 'a', 'rc', 'ra'], say: { a: 'NOERROR, 0 answers' }, badge: { auth: 'no A record' } },
        checks: [
          ['dig api.example.com A', ';; ->>HEADER<<- opcode: QUERY, status: NOERROR\n;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1', 'NOERROR with no answers: NODATA. The name exists, but has no A record.'],
          ['dig api.example.com TXT +short', '"site-verification=4f2a…"', 'Only a TXT record was created at this name. Add A (and AAAA) records.'],
        ],
        verdict: 'Add the missing type. NODATA is cached like NXDOMAIN, for the SOA minimum.' },
      { action: 'Broken signatures', caption: 'Node: getaddrinfo EAI_AGAIN shop.example.com · curl: (6) Could not resolve host', pic: { show: DIAG_BASE, hot: ['q', 'rc', 'ra'], denied: ['a', 'res'], say: { a: 'SERVFAIL' }, badge: { res: 'bogus' } },
        checks: [
          ['dig shop.example.com', ';; ->>HEADER<<- opcode: QUERY, status: SERVFAIL\n; EDE: 9 (DNSKEY Missing): (No DNSKEY matches DS RRs of example.com)', 'SERVFAIL, and the extended error names a DNSSEC problem.'],
          ['dig +cd shop.example.com +short', '192.0.2.10', 'With checking disabled the answer comes back, so the data is there and validation is what fails.'],
          ['dig example.com DS +short; dig @ns1.example.com example.com DNSKEY +multi', '12345 13 2 3F5A…\n… ; KSK; alg = ECDSAP256SHA256 ; key id = 48213', 'The parent\'s DS points at key 12345; the zone now publishes 48213.'],
        ],
        verdict: 'Update the DS at the registrar to match the new key, or remove it to go unsigned. Expect the fix to take up to the DS TTL.' },
      { action: 'Lame delegation', caption: 'Lookups take seconds, then fail with SERVFAIL for some users', pic: { show: [...DIAG_BASE.filter((id) => id !== 'ra'), 'old', 'ro'], hot: ['q', 'rc', 'ro'], denied: ['old', 'a'], say: { a: 'SERVFAIL' }, badge: { old: 'REFUSED' } },
        checks: [
          ['dig +trace shop.example.com', 'example.com.  172800  IN  NS  ns1.old-dns.example.net.\n;; Received 98 bytes from 192.5.6.30#53(a.gtld-servers.net)', 'The com zone still delegates to the old provider.'],
          ['dig @ns1.old-dns.example.net example.com SOA +norecurse', ';; ->>HEADER<<- opcode: QUERY, status: REFUSED', 'The old provider no longer serves the zone.'],
          ['dig @ns1.example.com shop.example.com +norecurse +short', '192.0.2.10', 'Your new servers are fine, which is why this hides so well.'],
        ],
        verdict: 'Change the NS records at the registrar to the new servers. Resolvers keep the old delegation for up to its TTL, two days for com.' },
      { action: 'No response', caption: 'Every lookup hangs for seconds, then: Temporary failure in name resolution', pic: { show: DIAG_BASE, denied: ['q', 'res'], badge: { res: 'no reply' } },
        checks: [
          ['dig shop.example.com', ';; communications error to 10.0.0.2#53: timed out\n;; no servers could be reached', 'Nothing came back from the configured resolver.'],
          ['dig @1.1.1.1 shop.example.com +short', '192.0.2.10', 'Another resolver answers, so the zone is fine. The problem is your resolver or the path to it.'],
          ['resolvectl status   # or cat /etc/resolv.conf', 'Current DNS Server: 10.0.0.2', 'Check the resolver is up and that security groups or firewalls allow UDP and TCP 53 to it.'],
        ],
        verdict: 'Fix or remove the dead resolver. glibc waits 5 s for a server before trying the next, so a dead first resolver adds about 5 s to every lookup; with no working server it gives up after two rounds.' },
      { action: 'VPN up, internal name fails', caption: 'ssh: Could not resolve hostname db.corp.example.com: Name or service not known', pic: { show: DIAG_BASE, hot: ['q', 'a'], say: { a: 'NXDOMAIN' }, badge: { res: 'asked public DNS' } },
        checks: [
          ['resolvectl query db.corp.example.com', "db.corp.example.com: Name 'db.corp.example.com' not found", 'A DNS server answered, and the answer was no. The tunnel isn\'t the problem.'],
          ['resolvectl status wg0', 'Link 3 (wg0)\n    Current Scopes: none\n         Protocols: -DefaultRoute -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported', 'The VPN link has no DNS server and no routing domain, so the question went out on the home link.'],
          ['dig @10.20.0.53 db.corp.example.com +short', '10.20.0.5', 'The VPN\'s DNS server knows the name. Nothing sent the question there.'],
        ],
        verdict: 'Give the VPN link its server and routing domain. resolvectl dns wg0 10.20.0.53 and resolvectl domain wg0 \'~corp.example.com\' fix it until the next reconnect; set them in the VPN client for good.' },
      { action: 'Works in dig, not in the app', caption: 'curl connects to 10.0.0.5 and times out; dig shows 192.0.2.10', pic: { show: DIAG_BASE, hot: ['h'], badge: { hosts: '10.0.0.5' } },
        checks: [
          ['dig +short shop.example.com', '192.0.2.10', 'DNS is correct.'],
          ['getent ahosts shop.example.com', '10.0.0.5        STREAM shop.example.com', 'The system resolver library returns something else.'],
          ['grep shop /etc/hosts', '10.0.0.5  shop.example.com', 'An old hosts entry wins before DNS is asked.'],
        ],
        verdict: 'Remove the entry. If getent agrees with dig and the app still disagrees, look for a cache inside the app.' },
    ],
    inspector: {
      heading: 'Read the status, then ask the source',
      body: 'Start with the status and flags, not the application\'s message. NXDOMAIN and NODATA are answers from the zone. SERVFAIL means a resolver couldn\'t produce a trustworthy answer. A timeout means nobody answered. Then ask the authoritative server directly with +norecurse to take caches out of the picture.',
      facts: [['NXDOMAIN', 'name doesn\'t exist'], ['NOERROR, 0 answers', 'name exists, type doesn\'t'], ['SERVFAIL', 'resolver gave up: DNSSEC, lame, unreachable']],
      evidence: ['THE SEQUENCE', 'dig name → dig @auth name +norecurse → dig +trace → dig +cd'],
      note: 'Application errors don\'t keep these distinctions. glibc reports SERVFAIL and timeouts as EAI_AGAIN, a temporary failure that callers often retry.',
    },
    takeaway: 'Name the DNS status before guessing: NXDOMAIN and NODATA come from the zone, SERVFAIL from the resolver, a timeout from the path.',
    sources: [NEG, EDE, DIG, RESOLVCONF, GAI, DS_PROTO, RESOLVECTL],
  },
  {
    id: 'operate', group: groups[5], label: 'Running DNS well', mode: 'steps',
    title: 'A loop for every DNS change',
    lede: 'Most DNS incidents come from changes. The same six steps cover a record move, a provider migration and a key roll.',
    diagram: LOOP,
    frames: [
      { action: 'Prepare', caption: 'Lower the TTL on the records you will change, then wait at least the old TTL so every cache holds the short one.', pic: { hot: ['e1'], badge: { plan: 'now' } } },
      { action: 'Change and check', caption: 'Change one thing. Confirm the authoritative servers serve it, with the serial raised, before anyone else sees it.', pic: { hot: ['e2', 'e3'], badge: { verify: 'aa' } },
        code: [code('Ask every authoritative server', `
for ns in $(dig +short example.com NS); do
  dig @$ns shop.example.com A +norecurse +short
done`)] },
      { action: 'Watch and drain', caption: 'Check from outside through several public resolvers and from inside your networks. Keep the old target running until its logs go quiet.', pic: { hot: ['e4', 'e5'], badge: { drain: 'logs quiet?' } } },
      { action: 'Restore', caption: 'Raise the TTL back. Long TTLs reduce query load and keep names resolving through short outages of your name servers.', pic: { hot: ['e6'], badge: { restore: 'done' } } },
    ],
    table: { title: 'What to watch continuously', head: ['Signal', 'Why'], rows: [['SERVFAIL and timeout rate at your resolvers', 'Rises with DNSSEC breaks, lame delegations and unreachable servers.'], ['Registrar NS matches zone NS', 'Catches half-finished provider moves.'], ['RRSIG expiry dates and DS key tags', 'Signatures expire on schedule; DS must track key rolls.'], ['Lookup latency from your apps', 'A slow first resolver adds seconds to every request.']] },
    inspector: {
      heading: 'Plan for the caches you can\'t see',
      body: 'Every step in the loop is about time. You can\'t flush other people\'s caches, so you shorten their memory before a change and wait for evidence, not a clock, before removing the old target.',
      facts: [['Before', 'lower TTL, wait old TTL'], ['During', 'one change, verify at the source'], ['After', 'drain, then raise TTL']],
      evidence: ['CHECK THE DELEGATION', 'dig +trace example.com NS'],
      note: 'Avoid TTL 0 as a permanent setting. It sends every lookup to your servers and some resolvers raise it anyway.',
    },
    takeaway: 'Shorten caches before a change, verify at the authoritative servers, and keep the old target alive until the evidence says nobody uses it.',
    sources: [R1034, NEG, DS_PROTO, DIG],
  },
];

export const dnsLesson: Lesson = {
  id: 'dns',
  kicker: 'FOUNDATIONS · NAME RESOLUTION CONSOLE',
  title: 'DNS: From a Name to an Answer',
  summary: 'Follow shop.example.com from your app to the root and back, see every cache it lands in, then move it to a new address and diagnose the ways a lookup fails.',
  reference: 'NAME · shop.example.com',
  format: 'FOUNDATIONAL · DEEP DIVE',
  scenario: 'shop.example.com · A 192.0.2.10 · TTL 3600 → moving to 203.0.113.20',
  scope: 'Covers name resolution as seen from Linux clients and recursive resolvers, the common record types, caching, record changes, transport, DNSSEC validation, split DNS (split-horizon views and routing names to different resolvers) and troubleshooting with dig. Out of scope: running an authoritative server, zone transfers, dynamic updates, anycast design and DNS-based attacks. Addresses and names use documentation ranges (RFC 5737, RFC 3849) and example.com. Resolver defaults were read on 2026-10-15.',
  groups, views, sources,
  collection: { href: '/foundations', label: 'Foundations' },
  legend: [
    { kind: 'code', label: 'your machine' }, { kind: 'tool', label: 'resolver' }, { kind: 'kube', label: 'authoritative server' },
    { kind: 'store', label: 'cache' }, { kind: 'hot', label: 'happening now' }, { kind: 'imagined', label: 'no such path' }, { kind: 'denied', label: 'fails' },
  ],
  related: [
    { label: 'Kubernetes DNS', href: '/kubernetes-dns' },
    { label: 'Networking', href: '/networking' },
    { label: 'HTTP Status Codes', href: '/http-status-codes' },
    { label: 'VPC Packet Flow', href: '/vpc-flow' },
  ],
};

/** Source list shared with the custom views, which cite by index. */
export { sources as dnsSources };
