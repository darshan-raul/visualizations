/**
 * Replays the resolver and dig behaviour the DNS page describes (src/components/dns/dns-lesson.ts) against live servers.
 * Needs dig (BIND 9) on the PATH and outbound DNS on UDP and TCP 53. Run with: node scripts/verify-dns-lesson.mjs
 * The hosts-file and cache-ignoring cases need a changed machine and are not replayed.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';

const run = promisify(execFile);
const dig = async (...args) => (await run('dig', ['+nocookie', '+time=5', '+tries=2', ...args])).stdout;
const flags = (text) => text.match(/;; flags: ([a-z ]+);/)?.[1].trim().split(' ') ?? [];
const status = (text) => text.match(/status: ([A-Z]+)/)?.[1];
const checks = [];
const check = (name, test) => checks.push([name, test]);

check('the root answers shop.example.com with a referral to com, not an answer', async () => {
  const out = await dig('+norecurse', '@a.root-servers.net', 'shop.example.com', 'A');
  assert.equal(status(out), 'NOERROR');
  assert.ok(!flags(out).includes('aa'), 'a referral is not authoritative');
  assert.match(out, /ANSWER: 0,/);
  assert.match(out, /^com\.\s+172800\s+IN\s+NS\s+\S+gtld-servers\.net\./m);
});

check('com delegates example.com with NS records and a two-day TTL', async () => {
  const out = await dig('+norecurse', '@a.gtld-servers.net', 'example.com', 'NS');
  assert.match(out, /^example\.com\.\s+172800\s+IN\s+NS\s/m);
});

check('a recursive answer has rd and ra but not aa', async () => {
  const out = await dig('@1.1.1.1', 'example.com', 'A');
  const set = flags(out);
  assert.ok(set.includes('rd') && set.includes('ra') && !set.includes('aa'), set.join(' '));
});

check('NXDOMAIN carries the zone SOA, whose last field sets the negative TTL', async () => {
  const out = await dig('@1.1.1.1', 'no-such-name-for-infra-illustrated.iana.org', 'A');
  assert.equal(status(out), 'NXDOMAIN');
  assert.match(out, /AUTHORITY SECTION:\n\S+\s+\d+\s+IN\s+SOA\s+\S+ \S+ \d+ \d+ \d+ \d+ \d+/);
});

check('a validating resolver returns SERVFAIL with an extended error for a broken chain', async () => {
  const out = await dig('@8.8.8.8', 'dnssec-failed.org', 'A');
  assert.equal(status(out), 'SERVFAIL');
  assert.match(out, /EDE: \d+ \(/);
});

check('the same query with checking disabled (+cd) returns the answer', async () => {
  const out = await dig('@8.8.8.8', '+cd', 'dnssec-failed.org', 'A');
  assert.equal(status(out), 'NOERROR');
  assert.match(out, /ANSWER: [1-9]/);
});

check('a signed, valid answer from a validating resolver has the ad flag', async () => {
  const out = await dig('@8.8.8.8', 'iana.org', 'A');
  assert.ok(flags(out).includes('ad'), flags(out).join(' '));
});

check('a too-large UDP answer sets TC, and dig retries over TCP', async () => {
  const udp = await dig('+noedns', '+ignore', '@a.root-servers.net', '.', 'DNSKEY');
  assert.ok(flags(udp).includes('tc'), flags(udp).join(' '));
  const retried = await dig('+noedns', '@a.root-servers.net', '.', 'DNSKEY');
  assert.match(retried, /;; Truncated, retrying in TCP mode\./);
  assert.match(retried, /\(TCP\)/);
});

let failed = 0;
for (const [name, test] of checks) {
  try { await test(); console.log(`ok    ${name}`); } catch (error) { failed += 1; console.log(`FAIL  ${name}\n      ${error.message.split('\n').join('\n      ')}`); }
}
const { stdout, stderr } = await run('dig', ['-v']);
const version = (stdout || stderr).trim();
console.log(failed ? `${failed} of ${checks.length} checks failed.` : `All ${checks.length} checks passed with ${version}.`);
process.exit(failed ? 1 : 0);
