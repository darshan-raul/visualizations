/**
 * One map that grows: an instance at the centre, a ring for each distance, and a receipt for
 * whichever road the same gigabytes take. Each view adds one idea. Prices come from RATES.
 */
import { RATES, rate, type Meter } from './rates.ts';

export type NodeId = keyof typeof NODES;
export type Charge = { what: string; hop: number; rate: number; meter?: Meter };
export type Standing = { what: string; perHour: number };
export type Route = { name: string; path: NodeId[]; charges: Charge[]; standing?: Standing[]; tiers?: Meter; shift?: number; mark?: string };
export type Frame = { action: string; caption: string; routes: Route[] };
export type BillRow = { where: string; price: string; usage: string };
export type View = {
  id: string;
  group: string;
  label: string;
  title: string;
  lede: string;
  /** How many rings the map has revealed so far. */
  rings: 1 | 2 | 3 | 4;
  mode: 'choices' | 'trace' | 'map';
  frames: Frame[];
  /** Nodes drawn faintly for orientation when no route passes through them. */
  context?: NodeId[];
  bill?: BillRow[];
  inspector: { heading: string; body: string; facts: [string, string][]; evidence: [string, string]; note: string };
  takeaway: string;
  sources: number[];
};

const R = RATES;
const CODE = R.regionCode;
const each = rate(R.regional.perGBEachSide);
const out = rate(R.crossRegion.out);
const back = rate(R.crossRegion.back);
const first = R.internetEgress.tiers[0].perGB;
const last = R.internetEgress.tiers[R.internetEgress.tiers.length - 1].perGB;
const free = `${R.internetEgress.freeGB} GB`;
const nat = rate(R.nat.perGB);
const cdn = R.cloudfront.tiers[0].perGB;
const cdnFree = `${R.cloudfront.freeGB / 1024} TB`;
const hourly = (value: number) => `${rate(value)} per hour`;
const perGB = (value: number) => `${rate(value)} per GB`;

/** Map geometry: a 520 × 440 drawing with the instance at the centre. */
export const MAP = { width: 520, height: 440, cx: 260, cy: 220, radii: [96, 146, 184, 216] };
export const RINGS = [
  { name: 'Same AZ', price: 'free', tone: 'free' },
  { name: 'Other AZ', price: `${each} each end`, tone: 'low' },
  { name: R.peerRegion, price: `${out} out`, tone: 'high' },
  { name: 'Internet', price: `from ${rate(first)}`, tone: 'top' },
];

/** r and deg place a node on the map (deg runs clockwise from east); side says where its label sits. */
export const NODES = {
  app: { label: 'app', r: 0, deg: 0, side: 'below' },
  db: { label: 'db', r: 62, deg: 30, side: 'right' },
  natA: { label: 'NAT', r: 62, deg: -35, side: 'right' },
  gwe: { label: 'gateway endpoint', r: 60, deg: 168, side: 'below' },
  ife: { label: 'interface endpoint', r: 60, deg: 168, side: 'below' },
  vpcA: { label: 'orders · VPC B', r: 62, deg: 48, side: 'below' },
  replica: { label: 'replica', r: 121, deg: 30, side: 'below' },
  natB: { label: 'NAT · 1b', r: 121, deg: -30, side: 'above' },
  alb: { label: 'ALB', r: 121, deg: -14, side: 'below' },
  s3: { label: 'S3', r: 121, deg: 200, side: 'above' },
  svc: { label: 'ECR', r: 121, deg: 200, side: 'above' },
  vpcB: { label: 'orders · VPC B', r: 121, deg: 70, side: 'below' },
  tgw: { label: 'transit gateway', r: 121, deg: 115, side: 'below' },
  use1: { label: R.peerRegion, r: 165, deg: 150, side: 'below' },
  cf: { label: 'CloudFront', r: 200, deg: -14, side: 'above' },
  user: { label: 'user', r: 200, deg: 12, side: 'below' },
  api: { label: 'payment API', r: 200, deg: -40, side: 'above' },
  vpn: { label: 'VPN', r: 184, deg: 50, side: 'right' },
  dx: { label: 'Direct Connect', r: 184, deg: 50, side: 'right' },
  dc: { label: 'data centre', r: 203, deg: 76, side: 'left' },
} as const;

export const point = (id: NodeId) => {
  const node = NODES[id];
  const angle = (node.deg * Math.PI) / 180;
  return { x: Math.round(MAP.cx + node.r * Math.cos(angle)), y: Math.round(MAP.cy + node.r * Math.sin(angle)) };
};

const PRICING = 'https://aws.amazon.com/';
const DOCS = 'https://docs.aws.amazon.com/';
export const dtcSources = [
  { label: 'Amazon EC2 On-Demand pricing: data transfer', url: `${PRICING}ec2/pricing/on-demand/` },
  { label: 'AWS Price List bulk API (source of the rates)', url: `${DOCS}awsaccountbilling/latest/aboutv2/using-the-aws-price-list-bulk-api.html` },
  { label: 'Cost and Usage Reports: understanding data transfer charges', url: `${DOCS}cur/latest/userguide/cur-data-transfers-charges.html` },
  { label: 'Amazon VPC pricing: NAT gateway, peering, public IPv4', url: `${PRICING}vpc/pricing/` },
  { label: 'Gateway endpoints', url: `${DOCS}vpc/latest/privatelink/gateway-endpoints.html` },
  { label: 'AWS PrivateLink pricing: interface endpoints', url: `${PRICING}privatelink/pricing/` },
  { label: 'Amazon S3 pricing: data transfer', url: `${PRICING}s3/pricing/` },
  { label: 'Elastic Load Balancing pricing', url: `${PRICING}elasticloadbalancing/pricing/` },
  { label: 'Amazon CloudFront pay-as-you-go pricing', url: `${PRICING}cloudfront/pricing/pay-as-you-go/` },
  { label: 'AWS Transit Gateway pricing', url: `${PRICING}transit-gateway/pricing/` },
  { label: 'AWS Direct Connect pricing', url: `${PRICING}directconnect/pricing/` },
  { label: 'AWS Site-to-Site VPN pricing', url: `${PRICING}vpn/pricing/` },
  { label: 'AWS Architecture Blog: data transfer costs for common architectures', url: `${PRICING}blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/` },
  { label: 'Pricing for NAT gateways', url: `${DOCS}vpc/latest/userguide/nat-gateway-pricing.html` },
];

export const dtcRelated = [
  { label: 'AWS ENI', href: '/aws/vpc/eni' },
  { label: 'VPC Packet Flow', href: '/vpc-flow' },
  { label: 'AWS Load Balancers', href: '/aws-load-balancers' },
];

export const dtcGroups = ['Distance', 'Direction', 'Paths inside AWS', 'Paths out', 'The bill'];

const flat = (what: string, value: number, hop = 0): Charge => ({ what, hop, rate: value });
const internet = (what: string, hop = 0): Charge => ({ what, hop, rate: first, meter: 'internet' });
const crossing = (from: string, to: string, hop = 0): Charge[] => [flat(`Leaves ${from} (out)`, R.regional.perGBEachSide, hop), flat(`Arrives at ${to} (in)`, R.regional.perGBEachSide, hop)];
const natHour: Standing = { what: 'NAT gateway', perHour: R.nat.perHour };
const albHour: Standing = { what: 'Application Load Balancer', perHour: R.alb.perHour };
const breakEven = Math.round((R.interfaceEndpoint.perHourPerAz * R.hoursPerMonth) / (R.nat.perGB - R.interfaceEndpoint.perGB));

export const dtcViews: View[] = [
  {
    id: 'same-az', group: 'Distance', label: 'Same AZ', rings: 1, mode: 'choices',
    title: 'One instance, one neighbour, no charge',
    lede: 'An instance called app sends data to a database in the same Availability Zone.',
    frames: [{
      action: 'Private address',
      caption: 'The traffic stays inside one zone and uses private addresses, so nothing is metered in either direction.',
      routes: [{ name: 'app → db', path: ['app', 'db'], charges: [flat(`Inside ${R.homeAz}, private address`, R.sameAzPrivate.perGB)] }],
    }],
    inspector: {
      heading: 'Same zone, private address: free',
      body: 'An Availability Zone (AZ) is one or more data centres inside a Region. Two instances in the same AZ that talk over their private addresses aren\'t billed for the bytes they exchange.',
      facts: [['Rate', perGB(R.sameAzPrivate.perGB)], ['Both conditions needed', 'Same AZ and private addresses']],
      evidence: ['On the bill', 'No line item'],
      note: `AZ names are mapped per account, so your ${R.homeAz} can be a different building from another account's. Compare AZ IDs such as aps1-az1 when two accounts need to share a zone.`,
    },
    takeaway: 'Distance is the first thing AWS prices, and the shortest distance is free.',
    sources: [0, 12],
  },
  {
    id: 'next-az', group: 'Distance', label: 'Next AZ', rings: 2, mode: 'choices',
    title: 'Cross one zone boundary and both ends are metered',
    lede: 'The same data now goes to a replica one zone over.',
    frames: [
      {
        action: 'Other AZ',
        caption: `The bytes are counted as they leave app and counted again as they arrive at the replica. Each count is ${each} a gigabyte, so one gigabyte moved between two of your own instances costs ${rate(R.regional.perGBEachSide * 2)}.`,
        routes: [{ name: `app → replica in ${R.otherAz}`, path: ['app', 'replica'], charges: crossing('app', 'the replica') }],
      },
      {
        action: 'Same AZ, public IP',
        caption: 'Back to the database in the same zone, but app now calls its public address. AWS bills that like a zone crossing, although the packets never leave the AWS network.',
        routes: [{ name: 'app → db, by public address', path: ['app', 'db'], charges: crossing('app', 'the database') }],
      },
    ],
    inspector: {
      heading: 'The charge that hides in ordinary architecture',
      body: 'Spreading a workload over several AZs is standard advice, and every busy pair that lands in different zones pays this rate: app to database, service to service, consumer to broker. No single line looks large, which is why it tends to be found late.',
      facts: [['Rate', `${each} per GB at each end`], ['Billed the same way', 'Public or Elastic IPv4 addresses inside the Region'], ['Not charged', 'Replication between a Multi-AZ RDS primary and its standby']],
      evidence: ['On the bill', `${CODE}-DataTransfer-Regional-Bytes`],
      note: 'Some managed services don\'t meter their own end, so a crossing to one of them shows one line instead of two. Check the service\'s pricing page before assuming either.',
    },
    takeaway: 'A gigabyte that crosses an AZ is counted at both ends.',
    sources: [0, 2, 12],
  },
  {
    id: 'another-region', group: 'Distance', label: 'Another Region', rings: 3, mode: 'choices',
    title: `Leaving ${R.regionName} for ${R.peerRegionName}`,
    lede: `A second copy of the data lives in ${R.peerRegion}.`,
    frames: [
      {
        action: `${R.regionName} → ${R.peerRegionName}`,
        caption: `The Region that sends the data pays. Out of ${R.regionName} that is ${out} a gigabyte, close to what the internet costs. Arriving in ${R.peerRegionName} is free.`,
        routes: [{ name: `app → ${R.peerRegion}`, path: ['app', 'use1'], charges: [flat(`Leaves ${R.region}`, R.crossRegion.out), flat(`Arrives in ${R.peerRegion}`, R.crossRegion.in)] }],
      },
      {
        action: `${R.peerRegionName} → ${R.regionName}`,
        caption: `The same gigabytes coming back cost ${back}. The rate belongs to the Region the data leaves, and ${R.peerRegion} is one of the cheapest to leave.`,
        routes: [{ name: `${R.peerRegion} → app`, path: ['use1', 'app'], charges: [flat(`Leaves ${R.peerRegion}`, R.crossRegion.back), flat(`Arrives in ${R.region}`, R.crossRegion.in)] }],
      },
    ],
    inspector: {
      heading: 'The price is set by the Region you leave',
      body: `Transfer between Regions has one rate per source Region, charged on the way out only. That makes a pair of Regions lopsided: sending out of ${R.regionName} costs ${(R.crossRegion.out / R.crossRegion.back).toFixed(1)} times what the return direction does.`,
      facts: [[`${R.regionName} → ${R.peerRegionName}`, perGB(R.crossRegion.out)], [`${R.peerRegionName} → ${R.regionName}`, perGB(R.crossRegion.back)], ['Receiving Region', perGB(R.crossRegion.in)]],
      evidence: ['On the bill', `${CODE}-${R.peerRegionCode}-AWS-Out-Bytes`],
      note: 'The same rate applies over inter-Region VPC peering and over public endpoints. A transit gateway adds its own processing charge on top.',
    },
    takeaway: 'Between Regions, the sending Region sets the price and the receiving Region charges nothing.',
    sources: [1, 2, 12],
  },
  {
    id: 'internet', group: 'Distance', label: 'Internet', rings: 4, mode: 'choices',
    title: 'Out to the internet',
    lede: 'Someone outside AWS downloads from app.',
    frames: [{
      action: 'To the internet',
      caption: `The first ${free} a month are free across the whole account. After that the rate starts at ${rate(first)} a gigabyte and steps down as the month's total grows.`,
      routes: [{ name: 'app → user', path: ['app', 'user'], charges: [internet('Data transfer out to the internet')], tiers: 'internet' }],
    }],
    inspector: {
      heading: 'A free allowance, then tiers',
      body: 'The allowance and the tiers are counted on the account\'s combined internet traffic from most services and all commercial Regions. Change the monthly volume above the map to see which tiers fill.',
      facts: [['Free', `${free} a month, account-wide`], [`First ${R.internetEgress.tiers[0].upToGB / 1024} TB after that`, perGB(first)], [`Above ${R.internetEgress.tiers[R.internetEgress.tiers.length - 2].upToGB / 1024} TB`, perGB(last)]],
      evidence: ['On the bill', `${CODE}-DataTransfer-Out-Bytes`],
      note: 'This receipt treats app as the account\'s only source of internet traffic. In a real account something else has usually used the allowance already.',
    },
    takeaway: 'The internet is the most expensive place to send a gigabyte, and the rate depends on the month\'s total.',
    sources: [0, 1, 2],
  },
  {
    id: 'direction', group: 'Direction', label: 'In and out', rings: 4, mode: 'choices',
    title: 'The same wire, priced in one direction',
    lede: 'Compare a gigabyte arriving with a gigabyte leaving.',
    frames: [
      {
        action: 'Internet',
        caption: 'Uploads, API requests and anything else arriving from the internet cost nothing to receive. The same volume going back out is metered.',
        routes: [
          { name: 'Arriving: user → app', mark: 'in', shift: -9, path: ['user', 'app'], charges: [flat('Data transfer in from the internet', R.ingress.perGB)] },
          { name: 'Leaving: app → user', mark: 'out', shift: -9, path: ['app', 'user'], charges: [internet('Data transfer out to the internet')] },
        ],
      },
      {
        action: 'Another Region',
        caption: 'Between Regions the rule is the same: the receiving side is free and the sending side pays its own Region\'s rate.',
        routes: [
          { name: `Arriving: ${R.peerRegion} → app`, mark: 'in', shift: -9, path: ['use1', 'app'], charges: [flat(`Arrives in ${R.region}`, R.crossRegion.in)] },
          { name: `Leaving: app → ${R.peerRegion}`, mark: 'out', shift: -9, path: ['app', 'use1'], charges: [flat(`Leaves ${R.region}`, R.crossRegion.out)] },
        ],
      },
      {
        action: 'Next AZ',
        caption: 'Inside the Region the rule stops working. Between zones, the sending interface and the receiving interface are both metered, so neither direction is free.',
        routes: [
          { name: 'Arriving: replica → app', mark: 'in', shift: -9, path: ['replica', 'app'], charges: crossing('the replica', 'app') },
          { name: 'Leaving: app → replica', mark: 'out', shift: -9, path: ['app', 'replica'], charges: crossing('app', 'the replica') },
        ],
      },
    ],
    inspector: {
      heading: 'Inbound is free at the edges of a Region',
      body: 'Data arriving from the internet or from another Region is never charged to the receiver. That is the rule people remember, and it holds only at the Region\'s edge: between AZs there is no free direction.',
      facts: [['Internet → AWS', perGB(R.ingress.perGB)], ['Region → Region', 'Sender pays'], ['AZ → AZ', 'Both ends pay']],
      evidence: ['On the bill', `${CODE}-DataTransfer-In-Bytes at ${rate(R.ingress.perGB)}`],
      note: 'Free to receive doesn\'t mean free to answer. A request is small, its response is often large, and the response is outbound.',
    },
    takeaway: 'AWS takes your data for free. It charges to let it leave.',
    sources: [0, 2, 12],
  },
  {
    id: 'nat-gateway', group: 'Paths inside AWS', label: 'NAT gateway', rings: 4, mode: 'choices',
    title: 'A private instance calls out',
    lede: 'app sits in a private subnet, so its calls to a payment API on the internet go through a NAT gateway.',
    frames: [
      {
        action: 'NAT in the same AZ',
        caption: `The gateway charges ${nat} for every gigabyte it handles, on top of the internet rate from the earlier view. The first hop is free because the gateway is in app's zone.`,
        routes: [{ name: 'app → NAT → payment API', path: ['app', 'natA', 'api'], charges: [flat('app → NAT gateway, same AZ', 0), flat('NAT gateway processing', R.nat.perGB, 1), internet('Data transfer out to the internet', 1)], standing: [natHour] }],
      },
      {
        action: 'NAT in another AZ',
        caption: `Many VPCs run one shared gateway to save its hourly charge. Every instance outside the gateway's zone then pays ${each} a gigabyte to reach it.`,
        routes: [{ name: `app → NAT in ${R.otherAz} → payment API`, path: ['app', 'natB', 'api'], charges: [flat(`Crosses to ${R.otherAz}, counted at app`, R.regional.perGBEachSide), flat('NAT gateway processing', R.nat.perGB, 1), internet('Data transfer out to the internet', 1)], standing: [natHour] }],
      },
    ],
    inspector: {
      heading: 'Processing is charged in both directions',
      body: 'A NAT gateway meters every gigabyte that passes through it, whichever way it is going. Downloads, container image pulls and package updates arrive through the gateway and are processed at the same rate, even though the transfer in is free.',
      facts: [['Processing', `${perGB(R.nat.perGB)}, both directions`], ['Hourly', `${rate(R.nat.perHour)} per gateway`], ['Shared gateway in another AZ', 'Adds the zone crossing']],
      evidence: ['On the bill', `${CODE}-NatGateway-Bytes`],
      note: 'One gateway per AZ removes the crossing and adds an hourly charge for each zone; which is cheaper depends on how much traffic crosses. A regional NAT gateway spans zones as one resource and is billed for each zone it covers.',
    },
    takeaway: 'A NAT gateway adds a per-gigabyte charge that distance alone doesn\'t explain.',
    sources: [3, 13, 12],
  },
  {
    id: 's3-same-region', group: 'Paths inside AWS', label: 'S3, same Region', rings: 4, mode: 'choices',
    title: 'Sending to S3 in the same Region',
    lede: `app writes its exports to an S3 bucket in ${R.region}.`,
    frames: [
      {
        action: 'Public subnet',
        caption: 'From an instance with a public address, traffic reaches S3 through the internet gateway and stays on the AWS network. Transfer between EC2 and S3 in the same Region is free in both directions.',
        routes: [{ name: 'app → S3', path: ['app', 's3'], charges: [flat('EC2 → S3, same Region', R.s3.sameRegion)] }],
      },
      {
        action: 'Through the NAT',
        caption: `app is in a private subnet, so the same upload goes through the NAT gateway. The transfer is still free. The gateway's ${nat} a gigabyte is not.`,
        routes: [{ name: 'app → NAT → S3', path: ['app', 'natA', 's3'], charges: [flat('app → NAT gateway, same AZ', 0), flat('NAT gateway processing', R.nat.perGB, 1), flat('NAT gateway → S3, same Region', R.s3.sameRegion, 1)], standing: [natHour] }],
      },
      {
        action: `Bucket in ${R.peerRegion}`,
        caption: 'Point the same job at a bucket in another Region and the inter-Region rate comes back, on top of the gateway.',
        routes: [{ name: `app → NAT → S3 in ${R.peerRegion}`, path: ['app', 'natA', 'use1'], charges: [flat('app → NAT gateway, same AZ', 0), flat('NAT gateway processing', R.nat.perGB, 1), flat(`Leaves ${R.region}`, R.crossRegion.out, 1)], standing: [natHour] }],
      },
    ],
    inspector: {
      heading: 'The service is free. The road to it may not be.',
      body: 'S3 doesn\'t charge for transfer to or from other AWS services in its own Region, and DynamoDB and many other services follow the same rule. That is a statement about the transfer line only. If a private subnet\'s route to the service runs through a NAT gateway, the gateway bills for processing.',
      facts: [['EC2 ↔ S3, same Region', perGB(R.s3.sameRegion)], ['S3 → CloudFront', perGB(R.s3.toCloudFront)], ['Transfer Acceleration', 'An extra per-GB charge on top of transfer']],
      evidence: ['On the bill', `${CODE}-NatGateway-Bytes, with no S3 transfer line`],
      note: 'S3 request fees and storage are billed separately from data transfer and aren\'t shown on these receipts.',
    },
    takeaway: 'A free destination can still have a toll on the way.',
    sources: [6, 12, 3],
  },
  {
    id: 'endpoints', group: 'Paths inside AWS', label: 'Endpoints', rings: 4, mode: 'choices',
    title: 'A private road to the service',
    lede: 'The same upload to S3, without the NAT gateway.',
    frames: [
      {
        action: 'Gateway endpoint',
        caption: 'A gateway endpoint is a route table entry that sends S3 and DynamoDB traffic straight to the service. It has no hourly charge and no per-gigabyte charge.',
        routes: [{ name: 'app → gateway endpoint → S3', path: ['app', 'gwe', 's3'], charges: [flat('app → gateway endpoint', R.gatewayEndpoint.perGB), flat('Gateway endpoint → S3, same Region', R.s3.sameRegion, 1)] }],
      },
      {
        action: 'Interface endpoint',
        caption: `Most other services, such as ECR, are reached through an interface endpoint: a network interface in your subnet. It charges ${rate(R.interfaceEndpoint.perGB)} a gigabyte and an hourly rate in each AZ, well below the NAT gateway's ${nat}.`,
        routes: [{ name: 'app → interface endpoint → ECR', path: ['app', 'ife', 'svc'], charges: [flat('Interface endpoint processing', R.interfaceEndpoint.perGB), flat('Endpoint → ECR, same Region', 0, 1)], standing: [{ what: 'Interface endpoint, in each AZ', perHour: R.interfaceEndpoint.perHourPerAz }] }],
      },
    ],
    inspector: {
      heading: 'Two kinds of endpoint, two prices',
      body: 'Gateway endpoints exist only for S3 and DynamoDB, and only for buckets and tables in the VPC\'s own Region. Everything else uses interface endpoints, which are priced per hour and per gigabyte, so each one needs enough traffic to beat the NAT gateway it replaces.',
      facts: [['Gateway endpoint', `${perGB(R.gatewayEndpoint.perGB)}, no hourly charge`], ['Interface endpoint', `${perGB(R.interfaceEndpoint.perGB)} + ${hourly(R.interfaceEndpoint.perHourPerAz)} per AZ`], ['Pays for itself against NAT', `Above about ${breakEven} GB a month per AZ`]],
      evidence: ['On the bill', `${CODE}-VpcEndpoint-Bytes`],
      note: 'A gateway endpoint works through the VPC\'s route tables, so traffic from an on-premises network or a peered VPC can\'t use it. Those paths need an interface endpoint.',
    },
    takeaway: 'For S3 and DynamoDB, a gateway endpoint removes the toll at no cost.',
    sources: [4, 5, 3],
  },
  {
    id: 'vpc-to-vpc', group: 'Paths inside AWS', label: 'VPC to VPC', rings: 4, mode: 'choices',
    title: 'Reaching another VPC',
    lede: 'The orders service runs in a second VPC.',
    frames: [
      {
        action: 'Peering, same AZ',
        caption: 'A peering connection adds no charge of its own. If both instances are in the same zone, the transfer is free, as it was inside one VPC.',
        routes: [{ name: 'app → orders, peered VPC', path: ['app', 'vpcA'], charges: [flat('VPC peering, same AZ', 0)] }],
      },
      {
        action: 'Peering, other AZ',
        caption: 'Across zones, peering traffic is billed like any other zone crossing: once out and once in.',
        routes: [{ name: `app → orders in ${R.otherAz}`, path: ['app', 'vpcB'], charges: crossing('app', 'orders') }],
      },
      {
        action: 'Transit gateway',
        caption: `A transit gateway charges ${rate(R.transitGateway.perGB)} for each gigabyte a VPC sends into it, and an hourly rate for every attachment. Peering is cheaper per gigabyte; the gateway is easier to run across many VPCs.`,
        routes: [{ name: 'app → transit gateway → orders', path: ['app', 'tgw', 'vpcB'], charges: [flat('Transit gateway processing', R.transitGateway.perGB), flat('Transit gateway → VPC B', 0, 1)], standing: [{ what: 'Transit gateway attachment, each VPC', perHour: R.transitGateway.perAttachmentHour }] }],
      },
      {
        action: `Transit gateway to ${R.peerRegion}`,
        caption: 'Two transit gateways peered across Regions process the data once, where the VPC sends it in. The crossing between Regions is then billed at the inter-Region rate.',
        routes: [{ name: `app → transit gateway → ${R.peerRegion}`, path: ['app', 'tgw', 'use1'], charges: [flat('Transit gateway processing', R.transitGateway.perGB), flat(`Leaves ${R.region}`, R.crossRegion.out, 1)], standing: [{ what: 'Transit gateway attachment, each', perHour: R.transitGateway.perAttachmentHour }] }],
      },
    ],
    inspector: {
      heading: 'Peering is a path. A transit gateway is a meter.',
      body: 'VPC peering has no hourly or processing charge, so only the distance is billed. A transit gateway bills the owner of the sending VPC for every gigabyte and bills each attachment by the hour. Data arriving over a peering attachment from another transit gateway isn\'t processed a second time.',
      facts: [['VPC peering', 'Distance charges only'], ['Transit gateway', `${perGB(R.transitGateway.perGB)} sent in`], ['Attachment', hourly(R.transitGateway.perAttachmentHour)]],
      evidence: ['On the bill', `${CODE}-TransitGateway-Bytes`],
      note: 'On a shared transit gateway the processing charge goes to the account that owns the sending VPC, which may not be the account that owns the gateway. These receipts show the gateway\'s own charges; standard transfer charges still apply around it.',
    },
    takeaway: 'Peering costs what the distance costs. A transit gateway adds its own rate per gigabyte.',
    sources: [9, 3, 12],
  },
  {
    id: 'serving-users', group: 'Paths out', label: 'Serving users', rings: 4, mode: 'choices',
    title: 'Answering users on the internet',
    lede: 'Requests arrive through an Application Load Balancer (ALB), and the responses go back the same way.',
    frames: [
      {
        action: 'Load balancer',
        caption: `Responses leave through the load balancer, never through the NAT gateway. The balancer adds about ${rate(R.alb.perGB)} a gigabyte in capacity units, and the internet rate applies after the ${free} allowance.`,
        routes: [{ name: 'app → ALB → user', path: ['app', 'alb', 'user'], charges: [flat('Load balancer capacity, approximate', R.alb.perGB), internet('Data transfer out to the internet', 1)], standing: [albHour] }],
      },
      {
        action: 'CloudFront in front',
        caption: `CloudFront fetches from the load balancer for free and delivers from an edge location. Its own allowance is ${cdnFree} a month, and past that its rate for viewers in India is ${rate(cdn)} against ${rate(first)} from the Region.`,
        routes: [{ name: 'app → ALB → CloudFront → user', path: ['app', 'alb', 'cf', 'user'], charges: [flat('Load balancer capacity, approximate', R.alb.perGB), flat('ALB → CloudFront, origin fetch', R.cloudfront.originFetch, 1), { what: 'CloudFront to viewers in India', hop: 2, rate: cdn, meter: 'cloudfront' }], standing: [albHour], tiers: 'cloudfront' }],
      },
    ],
    inspector: {
      heading: 'CloudFront moves the exit more than it discounts it',
      body: `For viewers in India, CloudFront's per-gigabyte rate is almost the same as leaving ${R.regionName} directly. The saving comes from its larger monthly allowance and from caching: a response served from the edge never reaches the load balancer or the instance, so the Region doesn't process or send it at all.`,
      facts: [['Origin → CloudFront', perGB(R.cloudfront.originFetch)], ['CloudFront, India', `${perGB(cdn)} after ${cdnFree}`], [`Direct from ${R.regionName}`, `${perGB(first)} after ${free}`]],
      evidence: ['On the bill', 'IN-DataTransfer-Out-Bytes, under Amazon CloudFront'],
      note: 'The hop from app to the load balancer isn\'t priced on these receipts. CloudFront also charges per request and prices by the edge location that serves each viewer, so a global audience pays a blend of rates. Its flat-rate plans replace all of this with a monthly fee.',
    },
    takeaway: 'Responses to users leave through the load balancer or the CDN, and each exit has its own allowance.',
    sources: [8, 7, 0],
  },
  {
    id: 'on-premises', group: 'Paths out', label: 'On-premises', rings: 4, mode: 'choices',
    title: 'Back to your own data centre',
    lede: 'A nightly job copies data from app to a data centre in India.',
    frames: [
      {
        action: 'Site-to-Site VPN',
        caption: 'A VPN tunnel rides the internet, so data leaving AWS through it is billed at the internet rate. The connection has its own hourly charge.',
        routes: [{ name: 'app → VPN → data centre', path: ['app', 'vpn', 'dc'], charges: [internet('Data transfer out through the VPN', 1)], standing: [{ what: 'Site-to-Site VPN connection', perHour: R.vpn.perHour }] }],
      },
      {
        action: 'Direct Connect',
        caption: `Over a dedicated link from a Direct Connect location in India, data leaving ${R.regionName} costs ${rate(R.directConnect.outPerGB)} a gigabyte, about ${Math.round((R.directConnect.outPerGB / first) * 100)}% of the internet rate. Data coming in is free. The port is billed by the hour whether or not it carries traffic.`,
        routes: [{ name: 'app → Direct Connect → data centre', path: ['app', 'dx', 'dc'], charges: [flat('Data transfer out over Direct Connect', R.directConnect.outPerGB), flat('Direct Connect location → data centre', 0, 1)] }],
      },
    ],
    inspector: {
      heading: 'A dedicated link has its own exit rate',
      body: `Direct Connect prices outbound data by the pair of source Region and Direct Connect location. ${R.regionName} to a location in India is the cheap pair. The same data leaving ${R.regionName} through a location in Singapore or Virginia costs about what the internet does.`,
      facts: [['Direct Connect out, India location', perGB(R.directConnect.outPerGB)], ['Direct Connect in', perGB(R.directConnect.inPerGB)], ['VPN out', `Internet rate + ${hourly(R.vpn.perHour)}`]],
      evidence: ['On the bill', `${CODE}-…-DataXfer-Out:dc.3`],
      note: 'Port hours and any partner fees are fixed costs that aren\'t on this receipt. Compare the monthly port cost with the per-gigabyte saving before assuming the link is cheaper.',
    },
    takeaway: 'On the way to your own network, the link you choose sets the exit rate.',
    sources: [10, 11, 12],
  },
  {
    id: 'trace', group: 'The bill', label: 'Trace the bill', rings: 4, mode: 'trace',
    title: 'One upload, two roads',
    lede: 'app uploads to S3 every night. Step through both roads and watch each receipt fill in.',
    frames: [{
      action: 'Trace',
      caption: 'Both roads end at the same bucket in the same Region, and the transfer to S3 is free on both. Everything on the first receipt is the price of the road.',
      routes: [
        { name: 'A · Shared NAT gateway', mark: 'A', path: ['app', 'natB', 's3'], charges: [flat(`Crosses to ${R.otherAz}, counted at app`, R.regional.perGBEachSide), flat('NAT gateway processing', R.nat.perGB, 1), flat('NAT gateway → S3, same Region', R.s3.sameRegion, 1)], standing: [natHour] },
        { name: 'B · Gateway endpoint', mark: 'B', path: ['app', 'gwe', 's3'], charges: [flat('app → gateway endpoint', R.gatewayEndpoint.perGB), flat('Gateway endpoint → S3, same Region', R.s3.sameRegion, 1)] },
      ],
    }],
    inspector: {
      heading: 'The saving is the road, not the destination',
      body: 'Nothing about S3 changed between the two receipts. Adding a gateway endpoint to the private subnet\'s route table moves S3 traffic off the NAT gateway, and the application keeps using the same bucket name and the same credentials.',
      facts: [['Road A', perGB(R.regional.perGBEachSide + R.nat.perGB)], ['Road B', perGB(0)], ['Change required', 'One endpoint and its route table association']],
      evidence: ['On the bill', `${CODE}-NatGateway-Bytes falls; S3 usage is unchanged`],
      note: 'Road A counts the zone crossing once, at app\'s interface. Responses returning through the gateway are processed at the same rate, and S3 request fees apply on both roads. The NAT gateway\'s hourly charge stays for as long as other traffic needs it.',
    },
    takeaway: 'Before negotiating a transfer rate, check whether the traffic needs to be on that road at all.',
    sources: [3, 4, 13],
  },
  {
    id: 'whole-map', group: 'The bill', label: 'The whole map', rings: 4, mode: 'map',
    title: 'Distance, direction and path on one map',
    lede: 'Every charge on this page, and the line it becomes on the bill.',
    frames: [{
      action: 'Map',
      caption: 'Rings price the distance. An arrow pointing inward is free at the Region\'s edge, and the same arrow pointing outward is metered. Devices on the road add their own charge per gigabyte.',
      routes: [
        { name: 'Arriving', mark: 'in', shift: -9, path: ['user', 'app'], charges: [flat('Data transfer in from the internet', R.ingress.perGB)] },
        { name: 'Leaving', mark: 'out', shift: -9, path: ['app', 'user'], charges: [internet('Data transfer out to the internet')] },
      ],
    }],
    context: ['app', 'db', 'natA', 'gwe', 'replica', 'alb', 's3', 'tgw', 'use1', 'cf', 'user', 'dx', 'dc'],
    bill: [
      { where: 'Same AZ, private address', price: perGB(R.sameAzPrivate.perGB), usage: 'No line item' },
      { where: 'Other AZ, or a public address in the Region', price: `${each} at each end`, usage: `${CODE}-DataTransfer-Regional-Bytes` },
      { where: `${R.regionName} → ${R.peerRegionName}`, price: perGB(R.crossRegion.out), usage: `${CODE}-${R.peerRegionCode}-AWS-Out-Bytes` },
      { where: `Internet, after ${free}`, price: `${rate(first)} down to ${rate(last)}`, usage: `${CODE}-DataTransfer-Out-Bytes` },
      { where: 'Anything arriving from outside the Region', price: perGB(R.ingress.perGB), usage: `${CODE}-DataTransfer-In-Bytes` },
      { where: 'Through a NAT gateway', price: `+ ${rate(R.nat.perGB)}`, usage: `${CODE}-NatGateway-Bytes` },
      { where: 'Through a gateway endpoint', price: `+ ${rate(R.gatewayEndpoint.perGB)}`, usage: 'No line item' },
      { where: 'Through an interface endpoint', price: `+ ${rate(R.interfaceEndpoint.perGB)}`, usage: `${CODE}-VpcEndpoint-Bytes` },
      { where: 'Through a transit gateway', price: `+ ${rate(R.transitGateway.perGB)}`, usage: `${CODE}-TransitGateway-Bytes` },
      { where: 'Through an Application Load Balancer', price: `about + ${rate(R.alb.perGB)}`, usage: `${CODE}-LCUUsage` },
      { where: `CloudFront to India, after ${cdnFree}`, price: `from ${rate(cdn)}`, usage: 'IN-DataTransfer-Out-Bytes' },
      { where: 'Direct Connect, India location', price: perGB(R.directConnect.outPerGB), usage: `${CODE}-…-DataXfer-Out` },
    ],
    inspector: {
      heading: 'Read the bill by usage type',
      body: 'Data transfer never appears as one number. In Cost Explorer, group by usage type and look for names containing Bytes: each row of the table is one of those names. The largest row tells you which ring or which device to look at first.',
      facts: [['1 · Find', 'Group the month\'s cost by usage type'], ['2 · Locate', 'Match the largest line to a ring or a device'], ['3 · Shorten', 'Same AZ, an endpoint, or an edge cache'], ['4 · Recheck', 'Compare the same usage type next month']],
      evidence: ['Where to look', 'Cost Explorer → Group by: Usage type'],
      note: `Usage types with no Region prefix belong to ${R.peerRegion}. CloudFront's prefix names the area of the edge location, not your Region.`,
    },
    takeaway: 'Ask three questions of any flow: how far does it go, which way, and through what.',
    sources: [2, 1, 0],
  },
];
