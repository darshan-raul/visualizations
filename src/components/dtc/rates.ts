/**
 * Every price on the data transfer page comes from this object. To review the page for a new
 * month, or to re-point it at another Region, change the values here and nothing else.
 * Values are USD from the AWS Price List bulk files, read on 2026-10-10.
 */
export type Tier = { upToGB: number; perGB: number };

export const RATES = {
  asOf: '2026-10',
  verified: '2026-10-10',
  region: 'ap-south-1',
  regionName: 'Mumbai',
  regionCode: 'APS3',
  homeAz: 'ap-south-1a',
  otherAz: 'ap-south-1b',
  peerRegion: 'us-east-1',
  peerRegionName: 'N. Virginia',
  peerRegionCode: 'USE1',
  currency: 'USD',
  hoursPerMonth: 730,
  sameAzPrivate: { perGB: 0 },
  /** Crossing an AZ, or using a public or Elastic IPv4 address inside the Region. Metered at each end. */
  regional: { perGBEachSide: 0.01 },
  crossRegion: { out: 0.086, back: 0.02, in: 0 },
  ingress: { perGB: 0 },
  /** Tier limits are cumulative GB after the free allowance. */
  internetEgress: {
    freeGB: 100,
    tiers: [
      { upToGB: 10240, perGB: 0.1093 },
      { upToGB: 51200, perGB: 0.085 },
      { upToGB: 153600, perGB: 0.082 },
      { upToGB: Infinity, perGB: 0.08 },
    ] as Tier[],
  },
  nat: { perGB: 0.056, perHour: 0.056 },
  /** An ALB bills capacity units; one unit covers 1 GB an hour to instance targets, so this is the per-GB equivalent. */
  alb: { perGB: 0.008, perHour: 0.0239 },
  /** Pay-as-you-go rates for viewers in India. Tier limits include the free allowance. */
  cloudfront: {
    originFetch: 0,
    freeGB: 1024,
    tiers: [
      { upToGB: 10240, perGB: 0.109 },
      { upToGB: 51200, perGB: 0.085 },
      { upToGB: 153600, perGB: 0.082 },
      { upToGB: 512000, perGB: 0.08 },
      { upToGB: 1048576, perGB: 0.078 },
      { upToGB: 5242880, perGB: 0.075 },
      { upToGB: Infinity, perGB: 0.072 },
    ] as Tier[],
  },
  gatewayEndpoint: { perGB: 0, perHour: 0 },
  interfaceEndpoint: { perGB: 0.01, perHourPerAz: 0.013 },
  transitGateway: { perGB: 0.02, perAttachmentHour: 0.07 },
  vpn: { perHour: 0.05 },
  /** Out of Mumbai over a Direct Connect location in India. */
  directConnect: { outPerGB: 0.045, inPerGB: 0 },
  s3: { sameRegion: 0, toCloudFront: 0 },
};

/** The volume every receipt is rendered with before the reader changes it. */
export const DEFAULT_GB = 1000;

export type Meter = 'flat' | 'internet' | 'cloudfront';
export type Priced = { meter?: Meter; rate: number };
export type TierLine = { label: string; gb: number; perGB: number; cost: number };

const size = (gb: number) => (gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`);

/** Splits a month's volume across a free allowance and then the paid tiers. */
function tiered(gb: number, freeGB: number, tiers: Tier[], limitsIncludeFree: boolean): TierLine[] {
  const volume = Math.max(0, gb);
  const lines: TierLine[] = [{ label: `First ${size(freeGB)}`, gb: Math.min(volume, freeGB), perGB: 0, cost: 0 }];
  let floor = freeGB;
  for (const tier of tiers) {
    const ceiling = limitsIncludeFree ? tier.upToGB : tier.upToGB + freeGB;
    const used = Math.max(0, Math.min(volume, ceiling) - floor);
    const label = ceiling === Infinity ? `Above ${size(limitsIncludeFree ? floor : floor - freeGB)}` : `Next ${size(ceiling - floor)}`;
    lines.push({ label, gb: used, perGB: tier.perGB, cost: used * tier.perGB });
    floor = ceiling;
  }
  return lines;
}

/** The tiers worth showing: every one in use, and the next one up. */
export const visibleTiers = (lines: TierLine[]) => lines.slice(0, Math.max(2, lines.findLastIndex((line) => line.gb > 0) + 2));
export const tiersFor = (meter: Meter, gb: number) => visibleTiers(meter === 'cloudfront' ? cloudfrontTiers(gb) : internetTiers(gb));

export const internetTiers = (gb: number) => tiered(gb, RATES.internetEgress.freeGB, RATES.internetEgress.tiers, false);
export const cloudfrontTiers = (gb: number) => tiered(gb, RATES.cloudfront.freeGB, RATES.cloudfront.tiers, true);
const sum = (lines: TierLine[]) => lines.reduce((total, line) => total + line.cost, 0);

/** The month's charge for one line of a route. */
export function chargeCost(charge: Priced, gb: number): number {
  if (charge.meter === 'internet') return sum(internetTiers(gb));
  if (charge.meter === 'cloudfront') return sum(cloudfrontTiers(gb));
  return Math.max(0, gb) * charge.rate;
}

/** The month's per-GB charges for a whole route. Hourly charges are listed separately and never included. */
export const computeCost = (path: { charges: Priced[] }, gb: number) => path.charges.reduce((total, charge) => total + chargeCost(charge, gb), 0);

export const money = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** A per-GB or hourly rate, keeping the digits AWS quotes ($0.01, $0.056, $0.1093). */
export const rate = (value: number) => `$${value.toFixed(4).replace(/0{1,2}$/, '')}`;
export const volume = (gb: number) => `${Math.max(0, gb).toLocaleString('en-US')} GB`;
