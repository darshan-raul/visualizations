export interface PacketStep {
  node: string;
  direction: 'Request' | 'Reply';
  source: string;
  destination: string;
  explanation: string;
  failure?: string;
}
export interface PacketScenario {
  id: string;
  title: string;
  setup: string;
  path: string[];
  steps: PacketStep[];
}
const request = (node: string, source: string, destination: string, explanation: string, failure?: string): PacketStep => ({ node, source, destination, explanation, failure, direction: 'Request' });
const reply = (node: string, source: string, destination: string, explanation: string, failure?: string): PacketStep => ({ node, source, destination, explanation, failure, direction: 'Reply' });

export const scenarios: PacketScenario[] = [
  {
    id: 'public', title: 'Internet → public EC2',
    setup: 'TCP connection to port 443. Public address 203.0.113.10 maps to EC2 10.0.1.5. The subnet has an IGW route. Example addresses are documentation-only.',
    path: ['Client', 'Internet gateway', 'Subnet NACL', 'EC2 security group', 'EC2'],
    steps: [
      request('Client', '198.51.100.4:52140', '203.0.113.10:443', 'The client chooses temporary source port 52140 and sends a TCP SYN to the public address.'),
      request('Internet gateway', '198.51.100.4:52140', '10.0.1.5:443', 'The IGW translates the destination public IPv4 address to the private address. EC2 sees its private address.'),
      request('Subnet NACL', '198.51.100.4:52140', '10.0.1.5:443', 'The inbound ACL must allow TCP destination port 443 from the client.', 'Inbound NACL denies TCP 443. Check the first matching rule, including lower-numbered denies.'),
      request('EC2 security group', '198.51.100.4:52140', '10.0.1.5:443', 'The inbound SG allows this client to reach TCP 443.', 'No inbound SG allow rule matches this client and port. The connection cannot reach EC2.'),
      request('EC2', '198.51.100.4:52140', '10.0.1.5:443', 'A listening application and host firewall accept the connection. The server prepares a SYN-ACK.'),
      reply('EC2 security group', '10.0.1.5:443', '198.51.100.4:52140', 'This tracked reply is allowed by SG connection state, even without an outbound rule for 52140.'),
      reply('Subnet NACL', '10.0.1.5:443', '198.51.100.4:52140', 'The stateless outbound ACL must separately allow destination port 52140.', 'The reply is dropped: outbound NACL rules do not allow client port 52140. Allow the appropriate client ephemeral range and destination.'),
      reply('Internet gateway', '203.0.113.10:443', '198.51.100.4:52140', 'The subnet route sends the reply to the IGW, which maps the source private address back to the public address.'),
      reply('Client', '203.0.113.10:443', '198.51.100.4:52140', 'The SYN-ACK reaches the client. The final TCP ACK and TLS exchange are omitted.'),
    ],
  },
  {
    id: 'nat', title: 'Private EC2 → internet',
    setup: 'A zonal public NAT gateway lives in a public subnet. Its private address is 10.0.1.10 and its Elastic IP is represented by 203.0.113.20. Other SG and ACL rules allow this example.',
    path: ['Private EC2', 'Private route table', 'NAT gateway', 'Internet gateway', 'API'],
    steps: [
      request('Private EC2', '10.0.2.15:48920', '198.51.100.80:443', 'The instance has no public IPv4 address. Its SG allows outbound HTTPS and the private-subnet ACL allows the request.'),
      request('Private route table', '10.0.2.15:48920', '198.51.100.80:443', 'The destination matches 0.0.0.0/0 → nat-gateway.', 'The private subnet has no matching route to the NAT gateway. Check its actual route-table association.'),
      request('NAT gateway', '10.0.1.10:62000', '198.51.100.80:443', 'Source NAT maps the instance address and port to the NAT private address and an illustrative translated port, 62000.'),
      request('Internet gateway', '203.0.113.20:62000', '198.51.100.80:443', 'The public subnet routes to the IGW. The IGW maps the NAT private address to its Elastic IP.', 'The NAT subnet lacks an IGW route. Reaching the NAT gateway alone does not provide internet access.'),
      request('API', '203.0.113.20:62000', '198.51.100.80:443', 'The API sees the NAT Elastic IP as the client address.'),
      reply('Internet gateway', '198.51.100.80:443', '10.0.1.10:62000', 'The reply to the Elastic IP is translated back to the NAT private address.'),
      reply('NAT gateway', '198.51.100.80:443', '10.0.2.15:48920', 'The existing translation restores the original client destination and port. Public-subnet ACLs must permit both sides of the translation.'),
      reply('Private EC2', '198.51.100.80:443', '10.0.2.15:48920', 'The private-subnet inbound ACL allows 48920; the SG admits the tracked reply.', 'The private-subnet inbound NACL blocks 48920. Outbound HTTPS permission alone does not admit the reply.'),
    ],
  },
  {
    id: 's3', title: 'Private EC2 → S3 endpoint',
    setup: 'An IPv4 S3 gateway endpoint in the same Region is associated with the instance subnet route table. S3-IP represents an address in the AWS-managed S3 prefix list.',
    path: ['EC2', 'Route table', 'Gateway endpoint', 'S3'],
    steps: [
      request('EC2', '10.0.2.15:39120', 'S3-IP:443', 'DNS resolves an S3 service address. The SG and outbound ACL allow HTTPS to that address.'),
      request('Route table', '10.0.2.15:39120', 'S3-IP:443', 'The matching S3 prefix-list route selects the gateway endpoint ahead of a default route.', 'This subnet route table has no S3 endpoint route. With no other egress route in this example, the request stops here.'),
      request('Gateway endpoint', '10.0.2.15:39120', 'S3-IP:443', 'The request uses the gateway endpoint without NAT or an IGW. There is no interface endpoint ENI or endpoint SG.'),
      request('S3', '10.0.2.15:39120', 'S3-IP:443', 'Endpoint, identity and bucket policies must authorize the operation. Network reachability alone grants no object access.', 'An applicable policy denies GetObject. This is an authorization failure, typically an HTTP error, rather than an SG/NACL packet drop.'),
      reply('Gateway endpoint', 'S3-IP:443', '10.0.2.15:39120', 'The response travels back through the endpoint path.'),
      reply('EC2', 'S3-IP:443', '10.0.2.15:39120', 'The ACL allows the client ephemeral destination port; SG state admits the response.'),
    ],
  },
  {
    id: 'peering', title: 'App VPC → database VPC',
    setup: 'VPC A is 10.0.0.0/16; VPC B is 10.1.0.0/16. An accepted peering connection joins them. Source SG and both subnet ACLs allow the illustrated TCP flow.',
    path: ['App', 'Route A', 'Peering', 'Database', 'Route B'],
    steps: [
      request('App', '10.0.1.5:51000', '10.1.2.10:5432', 'The application connects directly to the database private address.'),
      request('Route A', '10.0.1.5:51000', '10.1.2.10:5432', '10.1.0.0/16 → pcx selects the peer. The destination remains the database address.', 'VPC A has no route for the peer CIDR. An accepted peering connection does not install your subnet routes.'),
      request('Peering', '10.0.1.5:51000', '10.1.2.10:5432', 'Peering forwards between the two VPCs without NAT. It does not make a third VPC reachable through this peer.'),
      request('Database', '10.0.1.5:51000', '10.1.2.10:5432', 'The database SG allows 5432 from the app, and PostgreSQL is listening.', 'The database SG has no matching inbound allow rule for the application source.'),
      reply('Route B', '10.1.2.10:5432', '10.0.1.5:51000', '10.0.0.0/16 → pcx provides the reverse route; SG state does not create it.', 'VPC B is missing its route back to VPC A. Request delivery cannot compensate for a missing reverse route.'),
      reply('Peering', '10.1.2.10:5432', '10.0.1.5:51000', 'The return packet crosses the same peering connection with private addresses unchanged.'),
      reply('App', '10.1.2.10:5432', '10.0.1.5:51000', 'The app subnet ACL allows the reply and the app SG recognizes the connection.'),
    ],
  },
  {
    id: 'tgw', title: 'Cross-Region transit gateways',
    setup: 'VPC A in us-east-1 reaches VPC B in eu-west-1 through two peered transit gateways. All VPC attachment routes and network filters are configured. Packet size is within path MTU.',
    path: ['VPC A', 'TGW A', 'TGW peering', 'TGW B', 'VPC B'],
    steps: [
      request('VPC A', '10.0.1.10:52000', '10.2.1.20:443', 'The source subnet route for 10.2.0.0/16 targets TGW A.'),
      request('TGW A', '10.0.1.10:52000', '10.2.1.20:443', 'The route table associated with the incoming VPC attachment selects a static route to the peering attachment.', 'The associated TGW route table has no static route to the peer for 10.2.0.0/16. Peering does not propagate these routes automatically.'),
      request('TGW peering', '10.0.1.10:52000', '10.2.1.20:443', 'The packet crosses the Region boundary without changing the private source or destination.'),
      request('TGW B', '10.0.1.10:52000', '10.2.1.20:443', 'The table associated with the incoming peering attachment sends the packet to VPC B.'),
      request('VPC B', '10.0.1.10:52000', '10.2.1.20:443', 'Destination subnet routing, ACLs and the service SG admit the request.'),
      reply('TGW B', '10.2.1.20:443', '10.0.1.10:52000', 'The VPC B subnet routes to its TGW. The table associated with its VPC attachment needs a return static route to the peer.', 'The TGW B return route to 10.0.0.0/16 is absent. Forward and reverse lookups use different incoming attachment contexts.'),
      reply('TGW peering', '10.2.1.20:443', '10.0.1.10:52000', 'The response traverses the peering connection back to TGW A.'),
      reply('TGW A', '10.2.1.20:443', '10.0.1.10:52000', 'The peering-associated table selects the VPC A attachment.'),
      reply('VPC A', '10.2.1.20:443', '10.0.1.10:52000', 'The reply reaches the original client after return filtering.'),
    ],
  },
  {
    id: 'privatelink', title: 'Consumer → PrivateLink service',
    setup: 'A same-Region consumer uses a provider-approved interface endpoint at 10.0.1.50. The provider exposes a TCP service through an NLB. Provider-side packet addresses are intentionally abstracted.',
    path: ['Consumer', 'Endpoint ENI', 'Provider NLB', 'Service'],
    steps: [
      request('Consumer', '10.0.1.5:53000', '10.0.1.50:443', 'The endpoint DNS name resolves to an endpoint ENI private address; the consumer SG permits the request.'),
      request('Endpoint ENI', '10.0.1.5:53000', '10.0.1.50:443', 'The endpoint SG allows TCP 443 from the consumer. Required subnet ACL rules also allow the flow.', 'The endpoint SG does not allow TCP 443 from this consumer. Service approval does not replace network rules.'),
      request('Provider NLB', 'Provider-side connection', 'Configured target:443', 'PrivateLink delivers the connection to the provider NLB. This exposes a service, not general routing into the provider VPC.'),
      request('Service', 'Provider-side connection', 'Configured target:443', 'A configured listener forwards to a healthy target; provider network rules and the application allow the request.', 'No service is available on the configured target path. Check target health, listener configuration, provider filtering and the application.'),
      reply('Provider NLB', 'Configured target:443', 'Provider-side connection', 'The service response follows the load-balanced connection back through PrivateLink.'),
      reply('Endpoint ENI', '10.0.1.50:443', '10.0.1.5:53000', 'On the consumer side, the peer remains the endpoint address.'),
      reply('Consumer', '10.0.1.50:443', '10.0.1.5:53000', 'The response reaches the consumer. No peering route to the provider CIDR was needed.'),
    ],
  },
];
