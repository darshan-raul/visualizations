/**
 * Replays the client behaviour the HTTP Status Codes page describes (src/components/http/http-codes.ts), against a local server.
 * Needs curl on the PATH. Run with: node scripts/verify-http-status-lesson.mjs
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import http from 'node:http';
import http2 from 'node:http2';
import assert from 'node:assert/strict';

const seen = [];
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    seen.push({ method: req.method, url: req.url, body });
    const redirect = req.url.match(/^\/r(30[12378])$/);
    if (redirect) return res.writeHead(Number(redirect[1]), { Location: '/pay' }).end();
    if (req.url === '/fine') { res.statusMessage = 'Fine'; return res.writeHead(200).end('ok'); }
    if (req.url === '/logo.png') {
      if (req.headers['if-none-match'] === '"v7"') return res.writeHead(304, { ETag: '"v7"' }).end();
      return res.writeHead(200, { ETag: '"v7"' }).end('image bytes');
    }
    if (req.url === '/hints') { res.writeEarlyHints({ link: '</app.css>; rel=preload; as=style' }); return res.writeHead(200).end('page'); }
    const odd = req.url.match(/^\/code\/(\d{3})$/);
    if (odd) return res.writeHead(Number(odd[1])).end('x');
    res.writeHead(200).end(`${req.method} ${body}`);
  });
});
const h2 = http2.createServer((_req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); });

const listen = (target) => new Promise((resolve) => target.listen(0, '127.0.0.1', () => resolve(target.address().port)));
// Asynchronous on purpose: the server above runs in this process and must stay free to answer.
const run = promisify(execFile);
const curl = async (...args) => (await run('curl', ['-s', '--max-time', '10', ...args])).stdout;
const statusLines = (text) => text.split(/\r?\n/).filter((line) => line.startsWith('HTTP/'));
const checks = [];
const check = (name, run) => checks.push([name, run]);

const port = await listen(server);
const h2port = await listen(h2);
const base = `http://127.0.0.1:${port}`;

check('HTTP/1.1 puts version, number and words on the first line', async () => {
  assert.equal(statusLines(await curl('-i', `${base}/cart`))[0], 'HTTP/1.1 200 OK');
});
check('a server may write any words; the answer is still a 200', async () => {
  assert.equal(statusLines(await curl('-i', `${base}/fine`))[0], 'HTTP/1.1 200 Fine');
  assert.equal((await fetch(`${base}/fine`)).ok, true);
});
check('HTTP/2 carries the number and no words', async () => {
  assert.equal(statusLines(await curl('-i', '--http2-prior-knowledge', `http://127.0.0.1:${h2port}/`))[0].trim(), 'HTTP/2 200');
});
check('curl stops at a redirect unless given -L', async () => {
  assert.deepEqual(statusLines(await curl('-I', `${base}/r301`)), ['HTTP/1.1 301 Moved Permanently']);
  assert.equal(statusLines(await curl('-IL', `${base}/r301`)).length, 2);
});
for (const [status, method] of [[301, 'GET'], [302, 'GET'], [303, 'GET'], [307, 'POST'], [308, 'POST']]) {
  check(`a POST redirected with ${status} arrives as ${method}`, async () => {
    seen.length = 0;
    const final = await curl('-L', '-o', '/dev/null', '-w', '%{method} %{url_effective}', '-d', 'a=1', `${base}/r${status}`);
    assert.equal(final, `${method} ${base}/pay`);
    assert.deepEqual(seen.at(-1), { method, url: '/pay', body: method === 'POST' ? 'a=1' : '' });
    seen.length = 0;
    await fetch(`${base}/r${status}`, { method: 'POST', body: 'a=1' });
    assert.deepEqual(seen.at(-1), { method, url: '/pay', body: method === 'POST' ? 'a=1' : '' });
  });
}
check('a matching If-None-Match gets a 304 with no body', async () => {
  const [head, body] = (await curl('-i', '-H', 'If-None-Match: "v7"', `${base}/logo.png`)).split(/\r?\n\r?\n/);
  assert.equal(statusLines(head)[0], 'HTTP/1.1 304 Not Modified');
  assert.equal(body, '');
  assert.match(await curl('-i', `${base}/logo.png`), /image bytes$/);
});
check('one request can get an interim answer and then a final one', async () => {
  assert.deepEqual(statusLines(await curl('-i', `${base}/hints`)), ['HTTP/1.1 103 Early Hints', 'HTTP/1.1 200 OK']);
  const upload = statusLines(await curl('-i', '-H', 'Expect: 100-continue', '-d', 'photo', `${base}/photos`));
  assert.deepEqual(upload, ['HTTP/1.1 100 Continue', 'HTTP/1.1 200 OK']);
});
check('an unknown code is handled by its first digit', async () => {
  assert.equal((await fetch(`${base}/code/299`)).ok, true);
  assert.equal((await fetch(`${base}/code/471`)).ok, false);
  await assert.rejects(run('curl', ['-s', '--fail', `${base}/code/471`]));
  await assert.doesNotReject(run('curl', ['-s', '--fail', `${base}/code/299`]));
});
check('curl --retry sends a 503 again and gives up on a 404', async () => {
  for (const [status, attempts] of [[503, 2], [404, 1]]) {
    seen.length = 0;
    try { await curl('--fail', '--retry', '1', '--retry-delay', '0', `${base}/code/${status}`); } catch { /* the failure is expected */ }
    assert.equal(seen.length, attempts);
  }
});

let failed = 0;
for (const [name, test] of checks) {
  try { await test(); console.log(`ok    ${name}`); } catch (error) { failed += 1; console.log(`FAIL  ${name}\n      ${error.message.split('\n').join('\n      ')}`); }
}
server.close(); h2.close(); server.closeAllConnections();
console.log(failed ? `${failed} of ${checks.length} checks failed.` : `All ${checks.length} checks passed with ${(await curl('--version')).split('\n')[0].split(' ').slice(0, 2).join(' ')} and Node.js ${process.versions.node}.`);
process.exit(failed ? 1 : 0);
