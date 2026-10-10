// Checks the data transfer page's arithmetic against hand-worked figures for the rates in rates.ts.
import assert from 'node:assert/strict';
import { RATES, cloudfrontTiers, computeCost, internetTiers, money } from '../src/components/dtc/rates.ts';
import { dtcViews } from '../src/components/dtc/dtc-lesson.ts';

const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 0.005, `${label}: expected ${expected}, got ${actual}`);
const egress = { charges: [{ meter: 'internet', rate: 0 }] };
const TB = 1024;

// Internet egress from ap-south-1: under the allowance, in the first tier, and across all four tiers.
close(computeCost(egress, 50), 0, '50 GB stays inside the free 100 GB');
close(computeCost(egress, 1000), 900 * 0.1093, '1,000 GB');
close(computeCost(egress, 200 * TB), 10240 * 0.1093 + 40960 * 0.085 + 102400 * 0.082 + (204800 - 100 - 153600) * 0.08, '200 TB');
close(computeCost(egress, 100), 0, 'exactly the allowance');
close(computeCost(egress, -5), 0, 'negative volume');
assert.equal(internetTiers(200 * TB).reduce((sum, line) => sum + line.gb, 0), 200 * TB, 'tiers account for every gigabyte');

// CloudFront's allowance is counted inside its first 10 TB.
close(cloudfrontTiers(1000).reduce((sum, line) => sum + line.cost, 0), 0, 'CloudFront under 1 TB');
close(cloudfrontTiers(10 * TB).reduce((sum, line) => sum + line.cost, 0), 9 * TB * 0.109, 'CloudFront at 10 TB');

// The worked example: a shared NAT gateway in another AZ against a gateway endpoint.
const trace = dtcViews.find((view) => view.id === 'trace');
const [nat, endpoint] = trace.frames[0].routes;
close(computeCost(nat, 1000), 1000 * (0.01 + 0.056), 'road A at 1,000 GB');
close(computeCost(endpoint, 1000), 0, 'road B at 1,000 GB');

// Every route's charges sit on a hop that exists, and every view cites a source.
for (const view of dtcViews) {
  assert.ok(view.sources.length > 0, `${view.id} has sources`);
  for (const frame of view.frames) for (const route of frame.routes) {
    for (const charge of route.charges) assert.ok(charge.hop < route.path.length - 1, `${view.id}: "${charge.what}" is on a hop of ${route.name}`);
  }
}
assert.equal(new Set(dtcViews.map((view) => view.id)).size, dtcViews.length, 'view ids are unique');

console.log(`Checked ${dtcViews.length} views against ${RATES.region} rates as of ${RATES.asOf}. 1,000 GB to the internet: ${money(computeCost(egress, 1000))}; 200 TB: ${money(computeCost(egress, 200 * TB))}.`);
