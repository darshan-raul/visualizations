/**
 * Replays the split DNS views of the DNS page (src/components/dns/dns-lesson.ts) in a Docker lab: scripts/dns-split-lab.
 * A systemd container plays the laptop (wlan0 to the home router, wg0 to the VPN); CoreDNS containers play the public zone,
 * the Route 53 VPC Resolver with its private zone and corp.example.com forwarding rule, and the corporate DNS server.
 * The lab emulates Route 53 behaviour from its documentation; it doesn't call AWS. Needs Docker and dig on the PATH.
 * Run with: node scripts/verify-dns-split.mjs [--keep]   (--keep leaves the lab running)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const run = promisify(execFile);
const lab = fileURLToPath(new URL('./dns-split-lab/', import.meta.url));
const compose = (...args) => run('docker', ['compose', '--project-directory', lab, ...args], { cwd: lab });
const laptop = async (...command) => {
  try { return (await compose('exec', '-T', 'laptop', ...command)).stdout; } catch (error) { return `${error.stdout ?? ''}${error.stderr ?? ''}`; }
};
const query = (name) => laptop('resolvectl', 'query', name);
const dig = async (server, name) => (await run('dig', ['+nocookie', '+time=3', '+tries=2', `@${server}`, name, 'A'])).stdout;
const status = (text) => text.match(/status: ([A-Z]+)/)?.[1];
const VPC = '172.30.3.20';
const CORP = '172.30.2.30';
const HOME = '172.30.1.10';

const checks = [];
const check = (name, test) => checks.push([name, test]);

check('with ~corp.example.com on wg0, the internal name goes to the VPN link', async () => {
  assert.match(await query('db.corp.example.com'), /db\.corp\.example\.com: 10\.20\.0\.5\s+-- link: wg0/);
});
check('every other name still goes to the home link and gets the public answer', async () => {
  assert.match(await query('shop.example.com'), /shop\.example\.com: 192\.0\.2\.10\s+-- link: wlan0/);
});
check('a link with a routing-only domain stops being a default route', async () => {
  assert.match(await laptop('resolvectl', 'status', 'wg0'), /-DefaultRoute/);
  assert.match(await laptop('resolvectl', 'status', 'wlan0'), /\+DefaultRoute/);
});
check('VPN up but its DNS server not registered: the internal name is not found', async () => {
  await laptop('resolvectl', 'revert', 'wg0');
  assert.match(await query('db.corp.example.com'), /Name 'db\.corp\.example\.com' not found/);
  await laptop('resolvectl', 'dns', 'wg0', CORP);
  await laptop('resolvectl', 'domain', 'wg0', '~corp.example.com');
});
check('with ~. on wg0 every name goes through the VPN, and shop gets the private answer', async () => {
  await laptop('resolvectl', 'domain', 'wg0', '~.');
  await laptop('resolvectl', 'flush-caches');
  assert.match(await query('shop.example.com'), /shop\.example\.com: 10\.0\.1\.10\s+-- link: wg0/);
});
check('…and status.example.com, which only the public zone has, is not found', async () => {
  assert.match(await query('status.example.com'), /Name 'status\.example\.com' not found/);
  await laptop('resolvectl', 'domain', 'wg0', '~corp.example.com');
  await laptop('resolvectl', 'flush-caches');
});
check('VPC resolver: the private zone answers shop with the private address', async () => {
  assert.match(await dig(VPC, 'shop.example.com'), /^shop\.example\.com\.\s+\d+\s+IN\s+A\s+10\.0\.1\.10$/m);
});
check('VPC resolver: a name missing from the private zone is NXDOMAIN, not the public answer', async () => {
  const out = await dig(VPC, 'status.example.com');
  assert.equal(status(out), 'NXDOMAIN');
  assert.doesNotMatch(out, /192\.0\.2\.30/);
});
check('VPC resolver: the more specific corp.example.com rule forwards to the corporate server', async () => {
  assert.match(await dig(VPC, 'db.corp.example.com'), /^db\.corp\.example\.com\.\s+\d+\s+IN\s+A\s+10\.20\.0\.5$/m);
});
check('public DNS has no corp.example.com names', async () => {
  assert.equal(status(await dig(HOME, 'db.corp.example.com')), 'NXDOMAIN');
});
check('on-premises: forwarding example.com to the inbound endpoint gives the private view, gaps included', async () => {
  assert.match(await dig(CORP, 'shop.example.com'), /^shop\.example\.com\.\s+\d+\s+IN\s+A\s+10\.0\.1\.10$/m);
  assert.equal(status(await dig(CORP, 'status.example.com')), 'NXDOMAIN');
});

const keep = process.argv.includes('--keep');
await compose('up', '-d', '--build', '--force-recreate');
let failed = 0;
try {
  for (let tries = 0; !/running|degraded/.test(await laptop('systemctl', 'is-system-running')); tries += 1) {
    if (tries > 30) throw new Error('the laptop container did not finish booting');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  await compose('exec', '-T', 'laptop', 'sh', '/zones/laptop-setup.sh');
  for (const [name, test] of checks) {
    try { await test(); console.log(`ok    ${name}`); } catch (error) { failed += 1; console.log(`FAIL  ${name}\n      ${error.message.split('\n').join('\n      ')}`); }
  }
  const version = (await laptop('resolvectl', '--version')).split('\n')[0];
  console.log(failed ? `${failed} of ${checks.length} checks failed.` : `All ${checks.length} checks passed with ${version} and CoreDNS 1.11.3.`);
} finally {
  if (!keep) await compose('down', '--remove-orphans');
}
process.exit(failed ? 1 : 0);
