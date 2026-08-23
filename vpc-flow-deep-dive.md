# AWS VPC Packet Flow & Architecture — Deep Dive

A comprehensive architectural reference detailing how packets traverse Amazon Virtual Private Clouds (VPC), from single-subnet kernel interfaces to cross-VPC peering, Transit Gateway route domains, inter-region global backbones, and hybrid Direct Connect topologies.

---

## Table of Contents
1. [Part 1: VPC Substrate & Core Primitives](#part-1-vpc-substrate--core-primitives)
2. [Part 2: Subnet Ingress & Egress (IGW, NAT GW & EIGW)](#part-2-subnet-ingress--egress-igw-nat-gw--eigw)
3. [Part 3: Stateful Security Groups vs Stateless Network ACLs](#part-3-stateful-security-groups-vs-stateless-network-acls)
4. [Part 4: VPC Endpoints (Gateway vs Interface PrivateLink)](#part-4-vpc-endpoints-gateway-vs-interface-privatelink)
5. [Part 5: Cross-VPC Peering & Non-Transitive Routing](#part-5-cross-vpc-peering--non-transitive-routing)
6. [Part 6: AWS Transit Gateway (TGW) Hub-and-Spoke](#part-6-aws-transit-gateway-tgw-hub-and-spoke)
7. [Part 7: Cross-Region Peering & AWS Cloud WAN](#part-7-cross-region-peering--aws-cloud-wan)
8. [Part 8: Hybrid Connectivity (Direct Connect, DXGW & VPN)](#part-8-hybrid-connectivity-direct-connect-dxgw--vpn)
9. [Part 9: End-to-End Packet Lifecycle & Traversal Algorithm](#part-9-end-to-end-packet-lifecycle--traversal-algorithm)
10. [Part 10: Troubleshooting & Packet Drop Diagnostic Matrix](#part-10-troubleshooting--packet-drop-diagnostic-matrix)

---

## Part 1: VPC Substrate & Core Primitives

### 1.1 The Software-Defined Virtual Substrate (Nitro & Mapping Service)
In traditional data centers, network segmentation relies on VLAN tags (802.1Q) and physical Top-of-Rack (ToR) switches. In AWS, physical network isolation is completely abstracted away by the **AWS Virtual Network Substrate**.

Every EC2 instance runs atop a hardware hypervisor (the **AWS Nitro System**). When an EC2 instance emits an Ethernet frame from its virtual network interface (`eth0`), the Nitro PCIe card intercepts the frame before it hits physical copper or fiber.

```
+-------------------------------------------------------------------+
|                           EC2 MicroVM                             |
|  [Guest OS Kernel: TCP Socket -> IP Stack -> eth0 Virtual Device] |
+---------------------------------+---------------------------------+
                                  | Virtual PCI Ring Buffer
+---------------------------------v---------------------------------+
|                    AWS Nitro System PCIe Card                     |
|  1. Evaluates Security Group State (Connection Tracking Engine)   |
|  2. Queries AWS Mapping Service (VPC ID + 10.0.1.5 -> Hypervisor)  |
|  3. Encapsulates frame into Geneve/VXLAN overlay tunnel (L3/L4)   |
|  4. Applies hardware line-rate AES-256 GCM encryption             |
+---------------------------------+---------------------------------+
                                  | Physical Underlay
+---------------------------------v---------------------------------+
|               AWS Physical Fabric (Clos Network / Spine-Leaf)     |
+-------------------------------------------------------------------+
```

The **AWS Mapping Service** acts as a globally distributed, high-speed directory service:
- When Host A (`10.0.1.5` in VPC `vpc-aaa`) sends a packet to Host B (`10.0.2.10` in `vpc-aaa`), Nitro queries the local Mapping Service cache for the physical underlay IP of Host B's Nitro card.
- Nitro wraps the original packet in an outer IP/UDP envelope (Geneve or proprietary VXLAN encapsulation), marking it with the VPC Tenant ID and Elastic Network Interface ID.
- The physical spine-leaf Clos network only routes outer physical IP packets. The inner VPC IP space is purely logical.

### 1.2 CIDR Blocks & Subnet Mathematics
A VPC is defined by a primary IPv4 CIDR block ranging from `/16` (65,536 addresses) to `/28` (16 addresses). Up to 4 secondary CIDR blocks can be attached after creation.

Every VPC is subdivided into **Subnets**, each bound to a single physical Availability Zone (AZ).
> **Note on AZ IDs**: Logical AZ names like `us-east-1a` are randomly mapped per AWS account to distribute load. The immutable physical identifier is the **AZ ID** (e.g., `use1-az1`, `use1-az2`).

### 1.3 The 5 Reserved IP Addresses per Subnet
In every subnet, AWS reserves 5 IP addresses out of the CIDR block. For a subnet with CIDR `10.0.1.0/24`:

| IP Address | Name | Purpose |
|---|---|---|
| `10.0.1.0` | **Network Address** | The first address of the CIDR block. Cannot be assigned to any interface. |
| `10.0.1.1` | **VPC Router** | The Subnet Default Gateway. All egress routing decisions hand off to this virtual address. |
| `10.0.1.2` | **Amazon Route 53 Resolver** | The Amazon Provided DNS server (VPC Base IP + 2). Handles split-horizon internal DNS resolution. |
| `10.0.1.3` | **Reserved by AWS** | Reserved for future internal AWS infrastructure functionality. |
| `10.0.1.255`| **Broadcast Address** | Standard IPv4 broadcast address. Broadcast is not supported inside AWS VPCs. |

**Subnet Usable Capacity Formula**:
$$\text{Usable IPs} = 2^{(32 - \text{prefix})} - 5$$
For a `/24` subnet: $256 - 5 = 251\text{ usable IPs}$.

---

## Part 2: Subnet Ingress & Egress (IGW, NAT GW & EIGW)

### 2.1 Internet Gateway (IGW)
An **Internet Gateway (IGW)** is a horizontally scaled, redundant, highly available logical VPC component. It is **not** an appliance or physical router.

Key characteristics:
1. **1-to-1 NAT Mapping**: The public IPv4 address associated with an EC2 instance is never assigned directly to the instance's OS interface. The OS only sees its private IP (`10.0.1.5`).
2. When traffic leaves the EC2 instance destined for the internet (`0.0.0.0/0`), the route table points to `igw-xxxx`.
3. As the packet passes through the IGW, the IGW performs stateless 1:1 NAT, translating the Source IP from `10.0.1.5` to Elastic IP `54.210.10.5`.
4. Ingress packets undergo the exact reverse translation (Destination `54.210.10.5` rewritten to `10.0.1.5`).

```
[EC2 eth0: 10.0.1.5] 
       | (Src: 10.0.1.5, Dst: 93.184.216.34)
       v
[Subnet Route Table: 0.0.0.0/0 -> igw-xxx]
       v
[Internet Gateway] -> Rewrites Src IP to 54.210.10.5 (1:1 Stateless NAT)
       | (Src: 54.210.10.5, Dst: 93.184.216.34)
       v
[Public Internet]
```

### 2.2 NAT Gateway (Stateful SNAT in Public Subnet)
Private subnets have no route to an IGW. To allow instances in private subnets to reach the internet for updates or third-party APIs without accepting inbound connections, a **NAT Gateway** is deployed in a **Public Subnet**.

```
[Private EC2: 10.0.2.15]
       | (Src: 10.0.2.15:48920, Dst: 140.82.121.4:443)
       v
[Private Route Table: 0.0.0.0/0 -> nat-0abc123]
       v
[NAT Gateway in Public Subnet: Private 10.0.1.50 / EIP 52.86.14.99]
       | Translates Src IP:Port -> 52.86.14.99:21045 (SNAT + Ephemeral Port)
       | Stores 5-tuple translation in internal state table
       v
[Public Subnet Route Table: 0.0.0.0/0 -> igw-xxx]
       v
[Internet Destination: 140.82.121.4:443]
```

**Under the Hood Constraints**:
- **55,000 Concurrent Connections**: A single NAT Gateway Elastic IP can manage up to 55,000 simultaneous connections per unique destination IP:port combination across ephemeral ports `1024-65535`.
- **Cross-AZ Traffic & High Availability**: NAT Gateways are AZ-scoped. If an EC2 instance in AZ-a routes through a NAT Gateway in AZ-b, AWS charges cross-AZ data transfer fees ($0.01/GB each way). If AZ-b experiences an outage, AZ-a loses internet connectivity. Best practice: Deploy 1 NAT Gateway per AZ.

### 2.3 Egress-Only Internet Gateway (EIGW)
IPv6 addresses are globally unique and routable. There is no private IPv6 space (no RFC 1918) in standard VPC configurations.

To prevent internet actors from opening unsolicited connections to internal IPv6 instances while still allowing outbound internet egress, AWS provides the **Egress-Only Internet Gateway (EIGW)**:
- Stateful firewalling for IPv6.
- Outbound traffic (`::/0 ➔ eigw-xxxx`) is permitted and state is tracked.
- Inbound connection attempts from external IPv6 clients are blocked.

---

## Part 3: Stateful Security Groups vs Stateless Network ACLs

The interaction between Security Groups and Network Access Control Lists (NACLs) is one of the most critical aspects of AWS networking.

```
                    +---------------------------------------+
                    |           INCOMING PACKET             |
                    +-------------------+-------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |         Subnet Boundary: NACL         |
                    |  - Stateless evaluation               |
                    |  - Numbered rules (100, 200, *)       |
                    |  - First matching rule decides        |
                    +-------------------+-------------------+
                                        | (ALLOW)
                                        v
                    +---------------------------------------+
                    |         EC2 Interface: Sec Group      |
                    |  - Stateful evaluation (conntrack)    |
                    |  - All rules evaluated (Permissive)   |
                    |  - If matched -> create conntrack entry|
                    +-------------------+-------------------+
                                        | (ALLOW)
                                        v
                    +---------------------------------------+
                    |             OS Kernel (eth0)          |
                    +---------------------------------------+
```

### 3.1 Security Groups (Stateful Hypervisor Filtering)
- **Attachment Point**: Attached to individual Elastic Network Interfaces (ENIs).
- **Stateful Engine**: Built into the Nitro hardware. When an inbound packet matches an Allow rule (e.g. Inbound TCP 443), Nitro writes a 5-tuple entry into its connection tracking (`conntrack`) table.
- **Return Traffic**: The return packet (SYN-ACK or HTTP 200 Response) is checked against the active `conntrack` table. Because the flow is recognized as established, the packet is **automatically permitted out**, completely bypassing all Outbound Security Group rules!
- **SG ID Referencing**: SGs allow referencing other Security Group IDs as a source (e.g., `Allow TCP 5432 from sg-web-app`). This works dynamically without managing static IP lists.

### 3.2 Network ACLs (Stateless Subnet Firewalls)
- **Attachment Point**: Attached to the Subnet boundary. Every packet entering or leaving the subnet must pass through the NACL.
- **Stateless Nature**: NACLs do **not** track connection state. Every single packet is evaluated in isolation.
- **Numbered Rule Evaluation**: Rules are evaluated in strict numerical order (Rule 100 before Rule 200). As soon as a packet matches a rule (ALLOW or DENY), evaluation stops. The default rule `*` denies everything not explicitly allowed.
- **The Ephemeral Return Port Trap**:
  When a client at `198.51.100.4` connects to your web server (`10.0.1.5:443`), the client chooses a random ephemeral port (e.g. `52140`).
  1. Inbound to Subnet: Evaluates NACL Inbound rules. Rule 100 allows `TCP 443` ➔ **PASS**.
  2. Inbound to EC2: Evaluates SG Inbound rules. Rule allows `TCP 443` ➔ **PASS** (conntrack created).
  3. Server replies: `Src: 10.0.1.5:443 ➔ Dst: 198.51.100.4:52140`.
  4. Outbound from EC2: SG conntrack match ➔ **PASS**.
  5. Outbound from Subnet: Evaluates NACL Outbound rules. If there is **no rule** allowing outbound traffic to ports `1024-65535`, the packet is **DROPPED** by rule `*`!

### 3.3 Side-by-Side Comparison Matrix

| Feature | Security Group (SG) | Network ACL (NACL) |
|---|---|---|
| **Operates At** | ENI level (Virtual Interface) | Subnet boundary |
| **Statefulness** | **Stateful** (Return traffic auto-allowed) | **Stateless** (Return traffic requires explicit rule) |
| **Rule Types** | **ALLOW only** (Implicit deny) | **ALLOW and DENY** |
| **Rule Processing** | All rules evaluated together | Evaluated in **numerical order** (first match wins) |
| **Cross-Referencing** | Can reference other SG IDs | IP CIDRs only (cannot reference SGs) |
| **Default State** | Inbound: Deny all, Outbound: Allow all | Inbound: Allow all, Outbound: Allow all (default NACL) |

---

## Part 4: VPC Endpoints (Gateway vs Interface PrivateLink)

Accessing AWS services (such as Amazon S3, DynamoDB, Secrets Manager, ECR) without traversing the public internet is accomplished via **VPC Endpoints**.

```
                           +-------------------------------------------------------+
                           |                     AWS VPC                           |
                           |                                                       |
                           |   +---------------------+   +---------------------+   |
                           |   |    Private EC2      |   |    Private EC2      |   |
                           |   |      (App A)        |   |      (App B)        |   |
                           |   +----------+----------+   +----------+----------+   |
                           |              |                         |              |
                           +--------------|-------------------------|--------------+
                                          |                         |
               Route Table Prefix List    |                         | DNS -> 10.0.1.20 (Private ENI)
                        (pl-63a5400a)     |                         |
                                          v                         v
                       +-----------------------+       +-----------------------+
                       |   Gateway Endpoint    |       |  Interface Endpoint   |
                       |    (S3 / DynamoDB)    |       |   (AWS PrivateLink)   |
                       +-----------+-----------+       +-----------+-----------+
                                   |                               |
                                   v                               v
                       +-----------------------+       +-----------------------+
                       |   Amazon S3 Service   |       |  AWS Secrets Manager  |
                       |   (Regional Fabric)   |       |   (ECR / KMS / SaaS)  |
                       +-----------------------+       +-----------------------+
```

### 4.1 Gateway Endpoints (S3 & DynamoDB)
- **Implementation**: AWS injects a managed **Prefix List** (e.g. `pl-63a5400a` for `com.amazonaws.us-east-1.s3`) directly into specified Subnet Route Tables.
- **Routing**: When an instance makes an API call to S3, the VPC router matches the prefix list route and routes traffic directly across the AWS internal software-defined network bus.
- **Cost**: 100% Free (no hourly fee, no data processing fee).
- **Limitations**:
  - Only available for **Amazon S3** and **DynamoDB**.
  - Does not extend across VPC Peering, Transit Gateway, Direct Connect, or VPN connections.

### 4.2 Interface Endpoints (AWS PrivateLink)
- **Implementation**: AWS provisions an **Elastic Network Interface (ENI)** with a private IP address (`10.0.1.20`) directly inside your subnet.
- **Private DNS Integration**: When Private DNS is enabled, AWS Route 53 intercepts regional DNS queries (e.g. `secretsmanager.us-east-1.amazonaws.com`) and resolves them to the local ENI IP (`10.0.1.20`).
- **Network Reachability**: Because it is a standard ENI inside your VPC, it is fully routable across **VPC Peering**, **AWS Transit Gateway**, and **Direct Connect** from on-premises data centers.
- **Cost**: ~$0.01/hour per AZ + $0.01/GB data processed.

---

## Part 5: Cross-VPC Peering & Non-Transitive Routing

A **VPC Peering Connection** (`pcx-xxxx`) connects two VPCs, allowing instances in either VPC to communicate using private IPv4/IPv6 addresses.

```
       [VPC A: 10.0.0.0/16] <==== Peering pcx-123 ====> [VPC B: 10.1.0.0/16]
               |                                                 |
               |                                                 |
          Peering pcx-456                                   Peering pcx-789
               |                                                 |
               v                                                 v
       [VPC C: 10.2.0.0/16] <====================================+
               
               NON-TRANSITIVE RULE: VPC A cannot reach VPC C through VPC B!
               Direct peering pcx-456 is required between A and C.
```

### 5.1 Architecture & Performance
- **Zero Bottleneck**: VPC Peering uses the existing AWS network fabric. There is no physical intermediary gateway, router appliance, or bandwidth limiter. Traffic travels at line rate (up to 100 Gbps on modern instance types).
- **Security Group Referencing**: If both VPCs are in the same AWS Region, you can configure Security Group rules in VPC B that reference the SG ID of an instance in VPC A (e.g., `Allow TCP 3306 from sg-12345678 (VPC A)`).

### 5.2 The Non-Transitive Routing Constraint
VPC Peering routing is strictly **non-transitive**:
- If VPC A is peered with VPC B ($A \leftrightarrow B$), and VPC B is peered with VPC C ($B \leftrightarrow C$), **VPC A cannot send packets to VPC C through VPC B**.
- AWS intentionally disables edge routing (routing through an intermediate VPC) in standard VPC peering.
- To connect $N$ VPCs in a full mesh requires:
  $$\text{Peering Connections} = \frac{N \times (N - 1)}{2}$$
  For 10 VPCs: $\frac{10 \times 9}{2} = 45$ separate peering connections and 90 route table updates.

---

## Part 6: AWS Transit Gateway (TGW) Hub-and-Spoke

**AWS Transit Gateway (TGW)** is a regional, highly scalable cloud router that connects VPCs, AWS accounts, Direct Connect links, and VPN connections through a central hub.

```
   [VPC A: Prod (10.0.0.0/16)]      [VPC B: Dev (10.1.0.0/16)]      [VPC C: Shared (10.2.0.0/16)]
               \                                |                               /
     Attachment \                     Attachment|                     Attachment/
                 v                              v                              v
   +---------------------------------------------------------------------------------------+
   |                               AWS Transit Gateway (TGW)                               |
   |                                                                                       |
   |   [TGW Route Table: Prod]         [TGW Route Table: Dev]       [TGW Route Table: Shared]
   |   - 10.0.0.0/16 -> VPC A          - 10.1.0.0/16 -> VPC B       - 10.0.0.0/16 -> VPC A  |
   |   - 10.2.0.0/16 -> VPC C (Shared) - 10.2.0.0/16 -> VPC C       - 10.1.0.0/16 -> VPC B  |
   |   (Dev route NOT propagated!)     (Prod route NOT propagated!) - 10.2.0.0/16 -> VPC C  |
   +---------------------------------------------------------------------------------------+
```

### 6.1 Attachments & Subnet ENIs
When attaching a VPC to a Transit Gateway:
1. AWS creates a dedicated **Transit Gateway ENI** in one subnet per selected Availability Zone inside the VPC.
2. When an EC2 instance routes traffic to `tgw-xxxx`, the packet is sent to the local TGW ENI in that AZ.
3. The TGW processes the packet through its internal high-performance Hyperplane routing fabric.

### 6.2 Route Domains (Association & Propagation)
Transit Gateway allows creating custom **Route Domains** (network segmentation) using multiple TGW route tables:
- **Route Table Association**: Determines which TGW Route Table an attachment uses to look up the destination for incoming packets.
- **Route Table Propagation**: Determines which TGW Route Tables automatically receive the CIDR routes of an attached VPC.

**Example Isolation Pattern**:
- *Production VPC Attachment* is associated with **Prod Route Table**. Prod routes propagate to **Prod** and **Shared Services** tables.
- *Development VPC Attachment* is associated with **Dev Route Table**. Dev routes propagate to **Dev** and **Shared Services** tables.
- *Result*: Prod and Dev are mathematically isolated (no routes to each other), while both can communicate with Shared Services!

### 6.3 Security Inspection & Appliance Mode
When routing inter-VPC or ingress traffic through a centralized inspection VPC containing a cluster of stateful firewalls (e.g., AWS Network Firewall, Palo Alto, Fortinet):
- Without **Appliance Mode**, return traffic from the destination might hit a different firewall instance in a different AZ, breaking stateful connection inspection (asymmetric routing).
- Enabling **TGW Appliance Mode** guarantees that for the entire duration of a flow, all packets (forward and reverse) are symmetrically routed through the exact same Transit Gateway ENI in the same Availability Zone.

---

## Part 7: Cross-Region Peering & AWS Cloud WAN

### 7.1 Inter-Region VPC Peering
VPCs in different AWS Regions (e.g. `us-east-1` and `eu-west-1`) can be connected directly via **Inter-Region VPC Peering**.

```
[VPC us-east-1: 10.0.0.0/16]                                    [VPC eu-west-1: 10.1.0.0/16]
          |                                                                   |
          | Route: 10.1.0.0/16 -> pcx-region                                  | Route: 10.0.0.0/16 -> pcx-region
          v                                                                   v
+-------------------+                                               +-------------------+
| AWS us-east-1 Pop | <====== Encrypted AWS Global Backbone ======> | AWS eu-west-1 Pop |
+-------------------+             (AES-256 MACsec / MTU 1500)       +-------------------+
```

Key Architectural Principles:
1. **Private AWS Backbone**: Traffic never traverses the public internet. Packets travel over AWS's owned global subsea and terrestrial fiber cables.
2. **Physical Encryption**: All cross-region traffic on AWS infrastructure is automatically encrypted at the data-link layer using **AES-256 MACsec**.
3. **The MTU 1500 Limit**: While intra-region VPCs support **Jumbo Frames (9001 bytes MTU)**, inter-region peering packets are strictly limited to **1500 bytes MTU**. Packets exceeding 1500 bytes with the "Don't Fragment" (DF) bit set will be silently dropped unless Path MTU Discovery (PMTUD) is functioning.
4. **No SG Referencing**: You cannot reference Security Group IDs across regions; rules must specify explicit IP CIDR blocks.

### 7.2 Inter-Region Transit Gateway Peering
To connect multi-region enterprises, a Transit Gateway in `us-east-1` can peer directly with a Transit Gateway in `eu-west-1`:
- Traffic between any VPC in Virginia and any VPC in Ireland hops through local TGW ➔ Cross-Region Peering Attachment ➔ Remote TGW ➔ Destination VPC.
- Static routing is configured across the peering attachment.

### 7.3 AWS Cloud WAN
For large global footprints spanning dozens of regions, **AWS Cloud WAN** replaces manual TGW peering meshes:
- Defines a global **Core Network Policy** using a single declarative JSON document.
- Automates multi-region segment routing, edge attachments, and BGP routing across **Core Network Edges (CNEs)** globally.

---

## Part 8: Hybrid Connectivity (Direct Connect, DXGW & VPN)

```
                                  +---------------------------------------+
                                  |            AWS Global Cloud           |
                                  |                                       |
                                  |    [VPC us-east-1]    [VPC eu-west-1] |
                                  |           \                 /         |
                                  |            \               /          |
                                  |      +---------------------------+    |
                                  |      | Direct Connect Gateway    |    |
                                  |      | (DXGW - Global Entity)    |    |
                                  |      +-------------+-------------+    |
                                  +--------------------|------------------+
                                                       | Transit / Private VIF
                                                       v
+------------------------+       Dedicated Fiber       +------------------------+
| On-Premises Data Center| <=========================> | AWS Direct Connect Pop |
| (Customer Router / BGP)|      (1G / 10G / 100G)      | (Meet-Me Room Cross-Con)|
+------------------------+                             +------------------------+
```

### 8.1 AWS Site-to-Site VPN
- **Protocol**: IPsec (IKEv1 / IKEv2) over UDP port 500 / 4500 with AES-256 encryption.
- **Topology**: Every AWS VPN connection provisions **2 independent tunnels** terminated on different AWS endpoints for high availability.
- **Throughput**: Max 1.25 Gbps per tunnel. Using BGP Equal-Cost Multi-Path (ECMP) across multiple VPN connections allows aggregating bandwidth up to ~5 Gbps.

### 8.2 AWS Direct Connect (DX)
- **Physical Link**: Dedicated fiber cross-connect in a Direct Connect colocation facility (1 Gbps, 10 Gbps, or 100 Gbps).
- **Virtual Interfaces (VIFs)**:
  - **Private VIF**: Connects to a single VPC's Virtual Private Gateway (VGW).
  - **Transit VIF**: Connects directly to an AWS Transit Gateway.
  - **Public VIF**: Provides dedicated, low-latency access to public AWS endpoints (S3, DynamoDB) without using an ISP.

### 8.3 Direct Connect Gateway (DXGW)
- A **Direct Connect Gateway** is a global routing abstraction.
- A single physical Direct Connect connection attached to a DXGW can communicate with multiple VPCs and Transit Gateways spread across **any AWS Region in the world** (excluding AWS China).

---

## Part 9: End-to-End Packet Lifecycle & Traversal Algorithm

When an application on Host A initiates a TCP connection to Host B, the packet undergoes an exact 10-step traversal:

```
[Host A (10.0.1.5:48920)]
   │
   ├─► 1. Socket Creation & OS Route Table Lookup
   │
   ├─► 2. Subnet Route Table (Longest Prefix Match)
   │
   ├─► 3. Source Subnet Outbound NACL (Stateless Check)
   │
   ├─► 4. Virtual Gateway / Substrate Encapsulation (IGW / NAT / TGW / PCX)
   │
   ├─► 5. AWS Physical Network Transmission (Underlay Fabric / Geneve Overlay)
   │
   ├─► 6. Destination Subnet Inbound NACL (Stateless Check)
   │
   ├─► 7. Destination ENI Security Group Inbound (Stateful Check + conntrack entry)
   │
   ├─► 8. Destination OS Kernel Delivery (eth0 -> TCP Stack -> Listening Port)
   │
   ├─► 9. Return Packet Generated: Host B -> Host A (Src/Dst Swap)
   │
   └─► 10. Reverse Path Evaluation (SG conntrack bypass -> Subnet Outbound NACL check)
```

### Detailed Evaluation Steps:

1. **Socket Bind**: Process opens `TCP SYN` with `Src: 10.0.1.5:48920` and `Dst: 10.0.2.10:443`.
2. **Subnet Route Table Evaluation**:
   - Router evaluates route table entries using **Longest Prefix Match** (LPM).
   - If destination is within VPC CIDR (`10.0.0.0/16`), target is `local`.
   - If destination is `0.0.0.0/0`, target is `nat-xxxx` or `igw-xxxx`.
   - If destination is peered VPC (`10.1.0.0/16`), target is `pcx-xxxx` or `tgw-xxxx`.
3. **Source Subnet NACL (Outbound)**:
   - Evaluates outbound rules in ascending numerical order.
   - Must match rule allowing `TCP 443` to destination CIDR.
4. **Gateway / Encapsulation**:
   - Nitro encapsulates packet with destination hypervisor's underlay IP and overlay metadata.
5. **Physical Transit**:
   - Packet traverses spine-leaf fabric (or encrypted inter-region backbone).
6. **Destination Subnet NACL (Inbound)**:
   - Evaluates inbound rules in ascending order.
   - Must match rule allowing `TCP 443` from source CIDR.
7. **Destination Security Group (Inbound)**:
   - Nitro hypervisor evaluates all inbound rules.
   - If matched, an active session entry is written to Nitro's `conntrack` table.
8. **Kernel Socket Delivery**:
   - Guest OS receives frame on `eth0`, verifies TCP checksum, and hands payload to socket listener.
9. **Return Packet Generation**:
   - Server emits `TCP SYN-ACK` with `Src: 10.0.2.10:443` and `Dst: 10.0.1.5:48920`.
10. **Reverse Path Security Checks**:
    - **Security Group**: Matches existing `conntrack` session ➔ **Instantly Allowed Out**.
    - **NACL Outbound**: Evaluated statelessly! **Must match an outbound rule covering ephemeral port `48920` (`1024-65535`)**, or the response is dropped at the subnet perimeter!

---

## Part 10: Troubleshooting & Packet Drop Diagnostic Matrix

When packets fail to reach their destination in AWS, use this diagnostic decision tree to pinpoint the exact failure point:

```
                                  [Packet Dropped]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
        [Forward Path Drop]                             [Return Path Drop]
                 │                                               │
     ┌───────────┴───────────┐                       ┌───────────┴───────────┐
     │                       │                       │                       │
[Route Issue]         [Security Issue]        [Stateless NACL]       [Asymmetric Route]
- Missing Route       - SG Inbound Missing    - Missing Outbound     - Peered VPC missing
- Blackhole Target    - NACL Inbound Deny       Ephemeral Ports        return route to
- MTU > 1500 cross-   - Overlapping CIDR        (1024-65535)           origin CIDR
  region peering        blocking route                               - TGW Appliance Mode
                                                                       disabled for NVA
```

### The Top 8 Silent Drop Scenarios & Fixes

| # | Silent Failure Scenario | Root Cause | Symptom | How to Fix |
|---|---|---|---|---|
| 1 | **Stateless NACL Ephemeral Drop** | Subnet NACL allows Inbound 443 but Outbound NACL lacks `1024-65535` rule. | Outbound connection from client hangs; TCP SYN arrives at server, but SYN-ACK never returns to client. | Add Outbound NACL Rule: `ALLOW TCP Ports 1024-65535` to `0.0.0.0/0`. |
| 2 | **Asymmetric Route in Peering** | Route table in VPC A points `10.1.0.0/16 ➔ pcx-123`, but VPC B has no route for `10.0.0.0/16 ➔ pcx-123`. | Traffic arrives at VPC B instance, but return packets are routed to default gateway (`igw` or `nat`) and blackholed. | Add matching static route in VPC B's route table pointing to `pcx-123`. |
| 3 | **NAT Gateway in Private Subnet** | NAT Gateway deployed in a private subnet whose route table lacks a route to `igw-xxxx`. | Private instances route to NAT GW, but NAT GW cannot forward packets to the internet. | Move NAT Gateway to a **Public Subnet** with a default route `0.0.0.0/0 ➔ igw-xxxx`. |
| 4 | **Cross-Region SG Reference** | Security Group rule in `eu-west-1` attempts to reference `sg-xxxx` from `us-east-1`. | AWS Console/API returns validation error or rule fails to evaluate. | Use explicit **IP CIDR blocks** (e.g. `10.0.1.0/24`) instead of SG IDs for cross-region peering. |
| 5 | **Jumbo Frame MTU Blackhole** | EC2 sends 9001-byte packets across Inter-Region VPC Peering or VPN. | Small `ping` packets succeed, but large HTTP payload or `ssh`/`scp` file transfers freeze mid-stream. | Configure instance interface MTU to `1500` or ensure Path MTU Discovery (ICMP Type 3 Code 4) is allowed in NACLs. |
| 6 | **TGW Firewall Asymmetry Drop** | Stateful firewall cluster deployed in shared services without TGW Appliance Mode. | Forward packet hits Firewall 1 in AZ-a; return packet hits Firewall 2 in AZ-b. Firewall 2 drops packet as invalid state. | Run: `aws ec2 modify-transit-gateway-vpc-attachment --transit-gateway-attachment-id <id> --options ApplianceModeSupport=enable`. |
| 7 | **Gateway Endpoint over VPN/DX** | On-premises client attempts to reach S3 Gateway Endpoint via Direct Connect / VPN. | DNS resolves to public S3 IPs, and traffic is routed out on-prem ISP instead of traversing Direct Connect. | Deploy an **Interface Endpoint (PrivateLink)** for S3 with Private DNS enabled. |
| 8 | **NAT GW Port Exhaustion** | >55,000 concurrent requests sent to a single destination IP (e.g. popular third-party API). | CloudWatch metric `ErrorPortAllocation` spikes; new outbound connections time out. | Associate secondary Elastic IPs with the NAT Gateway or distribute traffic across multiple NAT Gateways. |

---

*This document serves as the authoritative companion to `vpc-flow.html`.*
