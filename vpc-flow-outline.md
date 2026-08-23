# AWS VPC Packet Flow & Architecture — Deep Dive: Outline

## Overview
Companion markdown document to `vpc-flow.html` — comprehensive deep-dive into AWS VPC networking internals, from single-subnet packet life cycles to cross-VPC topologies, cross-region transit networks, hybrid links, and diagnostic matrices.

---

## Structure: 10 Parts

```
vpc-flow-deep-dive.md
├── Part 1: VPC Substrate & Core Primitives
├── Part 2: Subnet Ingress & Egress (IGW, NAT GW & EIGW)
├── Part 3: Stateful Security Groups vs Stateless Network ACLs
├── Part 4: VPC Endpoints (Gateway vs Interface PrivateLink)
├── Part 5: Cross-VPC Peering & Non-Transitive Routing
├── Part 6: AWS Transit Gateway (TGW) Hub-and-Spoke
├── Part 7: Cross-Region Peering & AWS Cloud WAN
├── Part 8: Hybrid Connectivity (Direct Connect, DXGW & VPN)
├── Part 9: End-to-End Packet Lifecycle & Simulator Mechanics
└── Part 10: Troubleshooting & Packet Drop Matrix
```

---

## Part 1: VPC Substrate & Core Primitives

### 1.1 The Software-Defined Virtual Substrate (Nitro & Mapping Service)
- Why physical networking does not apply directly to VPCs (Geneve/VXLAN overlay encapsulation)
- AWS Nitro System: Offloading VPC routing, encryption, and connection tracking to dedicated Nitro PCIe cards
- The Mapping Service (Mapping Layer): Resolving private IP + VPC ID to hypervisor physical chassis IP (`underlay` vs `overlay`)

### 1.2 CIDR Blocks & Subnet Math
- Primary and Secondary IPv4 CIDRs (`/16` down to `/28`)
- IPv6 CIDRs (AWS-assigned `/56` per VPC, fixed `/64` per subnet)
- AZ mappings (Logical AZ name e.g., `us-east-1a` vs Physical Account AZ ID e.g., `use1-az1`)

### 1.3 The 5 Reserved IP Addresses per Subnet
- `.0`: Network address (unusable)
- `.1`: VPC Router (Subnet Default Gateway)
- `.2`: Amazon Route 53 Resolver (Amazon Provided DNS)
- `.3`: Reserved by AWS for future internal use
- `.255`: Network broadcast address (unusable in VPC)
- Subnet capacity formula: $(2^{(32 - \text{prefix})}) - 5$ usable IPs

### 1.4 Elastic Network Interfaces (ENIs)
- Anatomy of an ENI: MAC address, Primary Private IPv4, Secondary IPs, Elastic IP binding, Security Groups
- Hyperplane ENIs: High-throughput shared ENI substrate for Lambda, NAT GW, Network Load Balancer, and PrivateLink

---

## Part 2: Subnet Ingress & Egress (IGW, NAT GW & EIGW)

### 2.1 Internet Gateway (IGW)
- Logical 1:1 NAT mapping: Public IPv4 is never bound directly to the EC2 OS interface (`eth0`)
- How the IGW rewrites packet headers on ingress (Destination Public IP ➔ Private IP) and egress (Source Private IP ➔ Public IP)
- Horizontal scalability: Why IGW is not a single gateway appliance or bottleneck

### 2.2 NAT Gateway (Stateful SNAT in Public Subnet)
- Source NAT (SNAT) mechanics: Private Subnet IP (`10.0.2.15`) ➔ NAT GW Public IP (`54.210.10.5`)
- Ephemeral Port Allocation: Managing `1024-65535` port space per destination IP
- Concurrency Limits: 55,000 simultaneous connections per IP target
- Multi-AZ Deployment pattern: Eliminating cross-AZ data transfer fees and single-AZ failure domains

### 2.3 Egress-Only Internet Gateway (EIGW)
- IPv6 design: Globally routable IPv6 without private RFC 1918 addresses
- Stateful outbound-only filtering: Allows IPv6 instances to initiate outbound connections while dropping unsolicited inbound packets

---

## Part 3: Stateful Security Groups vs Stateless Network ACLs

### 3.1 Security Groups (Stateful Hypervisor Filtering)
- Evaluation point: MicroVM Nitro hypervisor level (per ENI)
- Connection Tracking Engine (`conntrack` table): Tracking 5-tuples (`Src IP`, `Dst IP`, `Src Port`, `Dst Port`, `Protocol`)
- Automatic Return Traffic: Outbound response packets automatically bypass outbound rule checks if inbound connection was accepted
- Rule referencing: Referencing Security Group IDs (`sg-xxxx`) across instances in the same VPC or peered VPC

### 3.2 Network ACLs (Stateless Subnet Firewalls)
- Evaluation point: Subnet boundary (before reaching ENI)
- Rule Ordering: Numbered rules (1 to 32766) evaluated in strict ascending numerical order; first matching rule terminates evaluation
- Default `*` Deny rule
- Ephemeral Return Port Requirement: Why outbound response traffic for an inbound HTTP request requires NACL Outbound rules allowing ports `1024-65535`

### 3.3 The Evaluation Flow Matrix
- Inbound flow: `NACL Inbound Check` ➔ `SG Inbound Check` ➔ `OS eth0`
- Outbound flow: `OS eth0` ➔ `SG Outbound Check (or conntrack pass)` ➔ `NACL Outbound Check` ➔ `Route Table`

---

## Part 4: VPC Endpoints (Gateway vs Interface PrivateLink)

### 4.1 Gateway Endpoints (S3 & DynamoDB)
- Mechanism: Prefix Lists (`pl-xxxx`) injected directly into Subnet Route Tables
- Zero hourly cost, zero data processing fee
- Limitations: Same-region only; not accessible from Direct Connect, VPN, or VPC Peering

### 4.2 Interface Endpoints (AWS PrivateLink)
- Mechanism: Elastic Network Interface with private IP placed directly in your subnet
- Private DNS Resolution: `s3.us-east-1.amazonaws.com` dynamically resolves to local VPC endpoint ENIs (`10.0.1.20`)
- Extensibility: Routable across VPC Peering, Transit Gateway, and on-premises Direct Connect
- Pricing: Hourly per-AZ ENI cost + per-GB data processing fee

### 4.3 Endpoint Policies
- Fine-grained IAM JSON policies attached to endpoints restricting which principals and buckets/actions can traverse the tunnel

---

## Part 5: Cross-VPC Peering & Non-Transitive Routing

### 5.1 VPC Peering Architecture
- Point-to-point interconnect over AWS dedicated network fabric
- No single point of failure; line-rate throughput matching EC2 instance limits
- Security Group referencing across peered VPCs (intra-region)

### 5.2 The Non-Transitive Routing Rule
- Why $A \leftrightarrow B$ and $B \leftrightarrow C$ does NOT enable $A \leftrightarrow C$
- AWS routing limitation: Edge-to-edge packet forwarding is blocked in standard VPCs
- Mesh complexity: $N \times (N-1) / 2$ connections required for full mesh

### 5.3 CIDR Constraints & Route Tables
- Non-overlapping IP CIDR requirement
- Adding explicit static routes: `Target: pcx-xxxx` for destination VPC CIDR in both VPCs

---

## Part 6: AWS Transit Gateway (TGW) Hub-and-Spoke

### 6.1 Architecture & Attachment Mechanics
- Regional cloud router acting as a central hub
- Attachment types: VPC, Direct Connect Gateway, VPN, Peering Attachment
- Elastic ENI placement in subnets (one ENI per AZ per attachment)

### 6.2 Route Domains (Association & Propagation)
- Multiple TGW Route Tables
- **Association**: Defines which TGW route table a VPC attachment uses for forwarding decisions
- **Propagation**: Automatically injects a VPC's CIDRs into one or more TGW route tables
- Example architecture: Prod Domain, Dev Domain, Shared Services Domain, Egress/Inspection Domain

### 6.3 Security Inspection & Appliance Mode
- East-West inspection topologies (routing all inter-VPC traffic through a firewall cluster)
- **Appliance Mode**: Forcing symmetric flow hashing so both forward and return packets hit the same firewall instance in the same AZ

---

## Part 7: Cross-Region Peering & AWS Cloud WAN

### 7.1 Inter-Region VPC Peering
- Traffic stays on AWS's redundant global fiber network
- Encryption: Physical layer AES-256 MACsec on all cross-region links
- Maximum MTU: 1500 bytes (Jumbo frames 9001 bytes are not supported across regions)
- Pricing: Inter-region data transfer egress fees

### 7.2 Inter-Region Transit Gateway Peering
- Connecting TGW in Region A (e.g. `us-east-1`) to TGW in Region B (e.g. `eu-west-1`)
- Static routes across peering attachments (`tgw-attach-peering-xxxx`)
- Building global SD-WAN backbones across multi-region AWS footprints

### 7.3 AWS Cloud WAN
- Centralized policy engine using a single JSON policy file (`core-network-policy.json`)
- Dynamic segment routing across global edge locations (Core Network Edges - CNEs)
- Automatic global attachment orchestration

---

## Part 8: Hybrid Connectivity (Direct Connect, DXGW & VPN)

### 8.1 AWS Site-to-Site VPN
- IPsec tunnels over public internet (IKEv1/IKEv2, AES-256)
- 2 Tunnels per VPN connection for high availability
- Bandwidth: 1.25 Gbps per tunnel limit (BGP Equal-Cost Multi-Path ECMP for up to ~5 Gbps)

### 8.2 AWS Direct Connect (DX) & Virtual Interfaces
- Dedicated physical port (1G / 10G / 100G)
- **Private VIF**: Connect to single VPC Virtual Private Gateway (VGW)
- **Transit VIF**: Connect to AWS Transit Gateway
- **Public VIF**: Connect to public AWS services (S3, DynamoDB) over dedicated line

### 8.3 Direct Connect Gateway (DXGW)
- Global routing abstraction: Connect a single on-premises Direct Connect link to VPCs and TGWs across any AWS region

---

## Part 9: End-to-End Packet Lifecycle & Simulator Mechanics

### 9.1 The Step-by-Step Traversal Algorithm
1. **Source Process**: Application binds socket (`Src IP:Port` ➔ `Dst IP:Port`)
2. **Subnet Route Table**: Longest prefix match evaluation
3. **Gateway Translation**:
   - IGW: 1:1 NAT translation
   - NAT GW: SNAT to NAT GW IP + ephemeral port allocation
   - TGW: Attachment ENI encapsulation & TGW Route Table lookup
4. **Destination Subnet NACL Inbound**: Evaluates rules 100, 200, ... Default `*`
5. **Destination ENI Security Group Inbound**: Evaluates stateful allow rules + records entry in `conntrack` table
6. **Destination Host Kernel**: Delivery to listening socket
7. **Return Packet Generation**: Host generates response packet (`Src Dst swap`)
8. **Host Security Group Outbound**: Matches `conntrack` established session (bypasses outbound rules)
9. **Subnet NACL Outbound**: Evaluates outbound rules (MUST match ephemeral return port `1024-65535`)
10. **Router & Gateway Return**: Destination delivery

### 9.2 Simulator Scenarios
- **Scenario 1**: Internet Client ➔ Public Subnet EC2 (Inbound HTTP/HTTPS)
- **Scenario 2**: Private Subnet EC2 ➔ Internet (Outbound API call with NAT GW SNAT)
- **Scenario 3**: Private EC2 ➔ S3 (Gateway Endpoint vs Interface Endpoint)
- **Scenario 4**: Cross-VPC (VPC App ➔ VPC DB via Peering vs TGW)
- **Scenario 5**: Cross-Region (EC2 us-east-1 ➔ EC2 eu-west-1 via Inter-Region TGW)
- **Scenario 6**: Cross-Account PrivateLink (SaaS Provider NLB ➔ Consumer ENI)

---

## Part 10: Troubleshooting & Packet Drop Matrix

### 10.1 The Top 8 Silent Drop Scenarios
1. **Stateless NACL Return Drop**: Outbound ephemeral ports `1024-65535` blocked
2. **Asymmetric Route Drop in Peering**: Forward route in VPC A exists, missing return route in VPC B
3. **NAT GW in Private Subnet Trap**: NAT GW placed in subnet without route to IGW
4. **Cross-Region SG Reference Trap**: Referencing `sg-xxxx` across regions (only IP CIDRs allowed)
5. **Jumbo Frame MTU Blackhole**: 9001-byte packet sent across 1500-byte inter-region peering with `DF=1`
6. **TGW Firewall Asymmetry Drop**: Inspection VPC without Appliance Mode enabled
7. **Gateway Endpoint over VPN/DX**: Trying to route to S3 Gateway Endpoint via Direct Connect
8. **NAT GW Ephemeral Port Exhaustion**: More than 55,000 concurrent flows to a single destination IP
