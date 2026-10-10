# AWS Network Charges: Distance, Direction, Path — visual specification

- **Topic:** AWS data transfer pricing, taught as one map that grows.
- **Status and version:** 1.0, written and integrated on 2026-10-10 at `/aws-data-transfer-costs`. Canonical source is [`src/content/topics/aws-data-transfer-costs.mdx`](../../../src/content/topics/aws-data-transfer-costs.mdx) with components in `src/components/dtc/`. The owner approved the view chain and the worked example in conversation and asked for direct integration, so no approval prototype exists.
- **Target audience:** engineers who run workloads on AWS and have seen "data transfer" on a bill without a model of what produces it.
- **Page promise:** for any flow, the reader can say what it costs per gigabyte by asking how far it goes, which way, and through what.
- **Persistent scenario:** `app`, an EC2 instance in a private subnet in `ap-south-1a`, sends the same monthly volume (1,000 GB by default, set by the reader) to a different destination in each view. Mumbai is the home Region and `us-east-1` the second Region.
- **Scope:** same AZ, cross-AZ, public addresses, inter-Region, internet egress tiers, ingress, NAT gateway, S3 in and out of Region, gateway and interface endpoints, VPC peering, Transit Gateway, ALB, CloudFront, Site-to-Site VPN, Direct Connect, and the usage types these become on a bill.
- **Non-goals:** request fees, storage, Savings Plans and private pricing, Global Accelerator, Local Zones, Outposts, IPv6 differences, Regions other than the two named, and live pricing calls.

## Origin and changes from the owner's brief

The owner supplied a brief for a standalone `index.html`. It was adapted to this repository and to current prices. Each change was raised before building.

| Brief | Built | Why |
| --- | --- | --- |
| One `index.html`, README, light and dark themes | One console topic in the AWS collection, dark only | `SITE-REBUILD-BRIEF.md`: one console per topic; light mode deferred. |
| Three ideas layered on one canvas | 13 views; the composite is the last one | Owner's teaching preference: one idea per view on a growing picture. |
| Hover tooltips on rings | Ring name and price printed on the ring; detail in the inspector | Generator: no essential content behind hover. |
| Dashed red egress arrow, emoji icons | Solid arrows coloured free or charged; diamond for a device | Brief: dashed means optional or conceptual; no decorative marks. |
| Placeholder US rates | Mumbai rates from the AWS Price List files | See accuracy decisions. |
| Worked example: NAT against CloudFront for a user request | S3 upload through a shared NAT gateway against a gateway endpoint | Responses to users never pass through a NAT gateway, and CloudFront's India rate is within 0.3% of the Region's. Owner chose the replacement. |
| `RATES` object, `computeCost`, three assertions | Kept: `rates.ts` and `scripts/verify-data-transfer-costs.mjs` | |
| Patterns in the AWS Architecture Blog overview | Added VPC peering, Transit Gateway, VPN, Direct Connect, internet gateway to S3, cross-Region S3, RDS Multi-AZ replication, interface endpoints | Owner's follow-up request. |

## Visual thesis

**Rings price the distance, arrows show the direction, and devices on the road add a toll.** Every view is the same drawing: `app` at the centre, a ring for each distance revealed so far, one route with a chip on every hop, and a receipt that multiplies the chips by the month's volume.

## Semantic color and diagram grammar

| Element | Form | Meaning |
| --- | --- | --- |
| Ring | Concentric band with its name and price at the top (the core's at its foot) | A distance from `app`: same AZ, other AZ, `us-east-1`, internet. |
| Heat scale | Green, amber, orange, red | Free, low, high, highest. A topic-specific extension of the semantic palette; every ring and chip also prints its price. |
| Ring 2 | Stroke more than twice as thick as the others | The charge most often missed. |
| Circle | Blue outline; `app` is filled cyan | An instance, service or network that sends or receives. |
| Diamond | Purple outline | A device on the road that can add its own charge. |
| Solid arrow | Green when every charge on the route is zero, amber otherwise | A hop the data takes, in the direction it travels. |
| Chip | Pill beside a hop: `free` or `+$0.056` | The per-GB rate that hop adds. |
| Receipt | Table: charge, rate, month, total | The route priced at the chosen volume. Hourly charges are listed under it and left out of the total. |
| Motion | A white dot runs each route twice when a view or option opens; in the trace it moves one hop per step | Direction and order. Reduced motion removes the travel and keeps the states. |

## Concept groups and narrative sequence

Five index groups, one open at a time: **Distance** (01–04), **Direction** (05), **Paths inside AWS** (06–09), **Paths out** (10–11), **The bill** (12–13).

| # | Group / view (fragment) | Learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Distance / Same AZ (`#same-az`) | Does talking to a neighbour cost anything? | Core ring, one hop | None | The shortest distance is free. |
| 2 | Next AZ (`#next-az`) | What about the next zone? | Two rings, emphasised ring 2, two chips | 2 options: other AZ; same AZ by public address | A zone crossing is counted at both ends. |
| 3 | Another Region (`#another-region`) | And another Region? | Three rings | 2 options: each direction | The sending Region sets the price. |
| 4 | Internet (`#internet`) | And the internet? | Four rings, tier table under the receipt | Volume input | A free allowance, then tiers on the month's total. |
| 5 | Direction / In and out (`#direction`) | Is arriving data charged? | Paired opposing arrows, two receipts | 3 options: internet, Region, AZ | Inbound is free at the Region's edge only. |
| 6 | Paths inside AWS / NAT gateway (`#nat-gateway`) | Why is my private subnet expensive? | Route through a diamond | 2 options: NAT in the same or another AZ | A NAT gateway charges per gigabyte in both directions. |
| 7 | S3, same Region (`#s3-same-region`) | Isn't S3 transfer free? | Three routes to S3 | 3 options: public subnet, through NAT, bucket in `us-east-1` | A free destination can have a toll on the way. |
| 8 | Endpoints (`#endpoints`) | How do I avoid the NAT charge? | Route through an endpoint diamond | 2 options: gateway, interface | A gateway endpoint is free; an interface endpoint has a break-even. |
| 9 | VPC to VPC (`#vpc-to-vpc`) | Peering or Transit Gateway? | Routes to a second VPC | 4 options | Peering bills distance; a transit gateway bills per gigabyte. |
| 10 | Paths out / Serving users (`#serving-users`) | Where do responses leave? | Route through ALB, then CloudFront | 2 options | Each exit has its own allowance. |
| 11 | On-premises (`#on-premises`) | What about my data centre? | Route through VPN or Direct Connect | 2 options | The link sets the exit rate. |
| 12 | The bill / Trace the bill (`#trace`) | What would I actually save? | Two routes, two receipts, a saving | Step, Play, Reset | Check whether the traffic needs that road at all. |
| 13 | The whole map (`#whole-map`) | How do I find this on my bill? | Every node, in and out arrows, usage-type list | None | Distance, direction, path; read the bill by usage type. |

Hero interactions: the monthly volume control (every receipt on the page), the stepped trace in view 12, and the direction comparison in view 5. Other views use a plain option switch or nothing.

## Per-view contracts

The views share one composition, stated once. Top to bottom in the canvas: view number and group, title, one-line setup, the option switch or trace controls, the caption for the current option, then the stage. The stage is the map on the left and the receipts on the right; below about 760 px the receipts move under the map and the map scrolls sideways inside its own box at a minimum of 400 px. The inspector holds a reusable statement, a short explanation, two to four facts, the usage type to look for on the bill, one thing worth knowing, and the view's sources. Everything in a view that is a price is computed from `RATES`.

Data states for every view: default volume 1,000 GB; presets 50 GB, 1,000 GB, 10 TB, 200 TB; any whole number from 0 to 10,000,000.

Accessibility for every view: each map is an `img` with a title and a description generated from its rings, route and charges; receipts are real tables; options are buttons with `aria-pressed`; changes are announced through one polite live region; nothing depends on colour or hover.

| View | Map content | Receipt at 1,000 GB | Caveat carried in the inspector |
| --- | --- | --- | --- |
| 1 | `app → db` in the core | $0.00 | AZ names are mapped per account. |
| 2 | `app → replica`; or `app → db` by public address | $10.00 out + $10.00 in | Some managed services don't meter their own end; Multi-AZ RDS replication isn't charged. |
| 3 | `app → us-east-1`; reverse | $86.00; $20.00 | A transit gateway adds processing on top. |
| 4 | `app → user` | $98.37, with tier rows | The allowance is account-wide. |
| 5 | In and out pairs for internet, Region, AZ | $0.00 and $98.37; $0.00 and $86.00; $20.00 and $20.00 | A small request can cause a large outbound response. |
| 6 | `app → NAT → payment API`, NAT in 1a or 1b | $154.37; $164.37 | Per-AZ gateways trade the crossing for an hourly charge; regional NAT gateways bill per zone covered. |
| 7 | `app → S3`; via NAT; via NAT to `us-east-1` | $0.00; $56.00; $142.00 | Request fees and storage aren't shown. |
| 8 | `app → gateway endpoint → S3`; `app → interface endpoint → ECR` | $0.00; $10.00 | Gateway endpoints can't be reached from on-premises or peered VPCs. |
| 9 | Peering same AZ; other AZ; transit gateway; transit gateway to `us-east-1` | $0.00; $20.00; $20.00; $106.00 | The sending VPC's owner pays transit gateway processing. |
| 10 | `app → ALB → user`; `→ CloudFront → user` | $106.37; $8.00 | The hop to the load balancer isn't priced; CloudFront has request fees, edge-based rates and flat-rate plans. |
| 11 | `app → VPN → data centre`; `→ Direct Connect →` | $98.37; $45.00 | Port hours and partner fees are fixed costs. |
| 12 | Road A `app → NAT · 1b → S3`; road B `app → gateway endpoint → S3` | $66.00 against $0.00, saving 100% | The crossing is counted once, at `app`; return traffic is processed too. |
| 13 | 13 nodes, in and out arrows | 12-row list of rate and usage type | Unprefixed usage types are `us-east-1`; CloudFront's prefix is the edge area. |

### View 12 interaction

Step advances one hop on both roads; Play advances every 1.5 s and becomes Pause; Reset returns to the start. Before a hop is reached its arrow, chip and receipt row are dimmed and its amount shows `·`. Each receipt's total counts only the hops reached. The saving appears after the last hop. Without JavaScript both receipts are shown complete, with the saving.

### Failure and alternate states

The topic's failure is paying for a road that wasn't needed, so the alternates are priced side by side: the public-address shortcut in view 2, the shared NAT gateway in views 6 and 12, the cross-Region bucket in view 7, and Direct Connect through the wrong location in view 11's inspector.

## Persistent console elements

- **Title and metadata:** masthead, breadcrumb, title, summary, `RATES · ap-south-1 · 2026-10`, format and dates.
- **Grouped index:** five native disclosure groups, `current / total` counter, one-line labels, a link to sources.
- **Scenario ribbon:** `app sends [volume] GB a month` with four presets; a static sentence without JavaScript.
- **Active canvas, inspector, bottom takeaway, previous and next controls, sources with scope note, rates footnote, related visuals, footer.**

Deep links: each view's fragment selects it and opens its group; Back and Forward follow view changes; `#dtc-sources` opens the sources. Without JavaScript all 13 views are stacked in order, each option drawn one after another with its receipt at 1,000 GB, followed by the inspector copy and takeaway.

## Accuracy decisions

Rates were read from the AWS Price List bulk files on 2026-10-10 (publication dates 2026-09-11 to 2026-10-09).

| Decision | Basis |
| --- | --- |
| Internet egress from Mumbai is $0.1093, $0.085, $0.082, $0.08 after 100 GB free; tiers begin after the allowance | `AWSDataTransfer`, `APS3-DataTransfer-Out-Bytes` ("beyond the global free tier") |
| Mumbai → N. Virginia $0.086; N. Virginia → Mumbai $0.02; inbound $0 | `APS3-USE1-AWS-Out-Bytes`, `USE1-APS3-AWS-Out-Bytes`; CUR guide |
| A zone crossing is billed at both ends ($0.01 each) | CUR guide: two `DataTransfer-Regional-Bytes` line items per transfer; VPC pricing for peering |
| Crossing to a NAT gateway in another AZ is counted once, at `app` | VPC pricing says cross-AZ traffic to a NAT gateway is charged; the gateway's own end isn't documented as a second line, so the page states its assumption |
| NAT gateway $0.056 per GB and per hour | `AmazonEC2`, ap-south-1, effective 2026-10-01 |
| ALB shown as about $0.008 per GB | $0.008 per LCU-hour; one LCU covers 1 GB an hour to instance targets. Labelled approximate |
| The `app → ALB` hop is left unpriced | The EC2 pricing rule for load balancers and private addresses could not be re-read from the live page |
| CloudFront: 1 TB free, then $0.109 for India; origin fetch free | CloudFront pay-as-you-go pricing; `AmazonCloudFront`, `IN-DataTransfer-Out-Bytes` |
| Direct Connect out of Mumbai at an India location: $0.045 | `AWSDirectConnect`, e.g. `APS3-EQMB2-DataXfer-Out` |
| Transit gateway $0.02 per GB, $0.07 per attachment-hour; interface endpoint $0.01 per GB, $0.013 per AZ-hour | `AmazonVPC`, ap-south-1 |

## Integration notes

- `rates.ts` is the only place a price is written. To review the page for a new month, update `RATES`, set `asOf` and `verified`, then run `node scripts/verify-data-transfer-costs.mjs` and adjust its hand-worked figures. To re-point the page at another Region, also change the Region names and codes in `RATES`.
- The console uses the neutral `TopicConsoleShell`. Its frame rules in `src/styles/dtc-console.css` repeat the Git console's values under a `dtc-` prefix; they should move into the shared shell stylesheet when the checklist's shell extraction is done.
- Deep-dive handoffs, not yet written: NAT gateway cost patterns (per-AZ against shared against regional), and reading data transfer in the Cost and Usage Report.

## Page-level acceptance

- [x] `npm run verify` passes; `node scripts/verify-data-transfer-costs.mjs` passes (50 GB, 1,000 GB, 200 TB, CloudFront tiers, both roads of the trace).
- [x] No price is written outside `rates.ts`.
- [x] Ring 2 is the most emphasised ring.
- [x] Rates footnote with the as-of month is visible in the console.
- [x] Headless Firefox screenshots inspected at 1440 px, 390 px and 320 px, and with JavaScript disabled.
- [ ] Not yet exercised by hand: keyboard and touch operation, focus order, 200% zoom, reduced motion, Back and Forward, and the trace's Play control.

## Source index

1. [Amazon EC2 On-Demand pricing: data transfer](https://aws.amazon.com/ec2/pricing/on-demand/) — views 1, 2, 4, 5, 10, 13
2. [AWS Price List bulk API](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/using-the-aws-price-list-bulk-api.html) — every rate
3. [Cost and Usage Reports: understanding data transfer charges](https://docs.aws.amazon.com/cur/latest/userguide/cur-data-transfers-charges.html) — views 2–5, 13
4. [Amazon VPC pricing](https://aws.amazon.com/vpc/pricing/) — views 6–9, 12
5. [Gateway endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html) — views 8, 12
6. [AWS PrivateLink pricing](https://aws.amazon.com/privatelink/pricing/) — view 8
7. [Amazon S3 pricing](https://aws.amazon.com/s3/pricing/) — view 7
8. [Elastic Load Balancing pricing](https://aws.amazon.com/elasticloadbalancing/pricing/) — view 10
9. [Amazon CloudFront pay-as-you-go pricing](https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/) — view 10
10. [AWS Transit Gateway pricing](https://aws.amazon.com/transit-gateway/pricing/) — view 9
11. [AWS Direct Connect pricing](https://aws.amazon.com/directconnect/pricing/) — view 11
12. [AWS Site-to-Site VPN pricing](https://aws.amazon.com/vpn/pricing/) — view 11
13. [AWS Architecture Blog: overview of data transfer costs for common architectures](https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/) — views 1–3, 5–7, 9, 11
14. [Pricing for NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-pricing.html) — views 6, 12
