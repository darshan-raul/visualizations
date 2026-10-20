/** Real-browser checks for the testing console. Requires a local Playwright install.
 * Overrides: PLAYWRIGHT_PACKAGE, CHROMIUM_PATH, TESTING_BASE_URL.
 */
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { viewIds } from '../src/components/testing/testing-data.ts';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE ?? `${homedir()}/.cache/ms-playwright-go/1.57.0/package`);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? `${homedir()}/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const url = `${process.env.TESTING_BASE_URL ?? 'http://localhost:4321'}/testing`;
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
const active = () => page.locator('[data-lsn-view].is-active');
const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
let cases = 0;
try {
  for (const width of [1440, 1000, 720, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of viewIds) {
      await page.goto(`${url}#${id}`); await page.waitForSelector(`#${id}.is-active`);
      assert.equal(await page.locator('[data-lsn-view]:visible').count(), 1);
      const frames = await active().locator('.lsn-frame').count();
      const choices = active().locator('[data-lsn-choices] [data-lsn-choice]');
      for (let i = 0; i < frames; i++) {
        if (i > 0) { if (await choices.count()) await choices.nth(i).click(); else await active().locator('[data-lsn-next]').click(); }
        assert.equal(await active().locator('.lsn-frame:visible').count(), 1);
        assert.ok(await noOverflow(), `${width} ${id} frame ${i}`); cases++;
      }
      assert.ok(await noOverflow(), `${width} ${id}`); cases++;
    }
  }
  // Old fragments still land on a view.
  for (const [alias, id] of [['pipeline-map', 'build-once'], ['find-the-gap', 'release-lab'], ['api-e2e', 'contracts-api'], ['artifact-checks', 'build-once']]) {
    await page.goto(`${url}#${alias}`); assert.equal(await active().getAttribute('id'), id);
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(`${url}#release-lab`);
  const releaseCases = [['healthy', false, true, 'Canary evaluation', 'FULL ROLLOUT'], ['math', false, true, 'Static + unit', 'BLOCKED'], ['schema', false, true, 'Integration', 'BLOCKED'], ['schema', true, true, 'API', 'BLOCKED'], ['contract', false, true, 'Contract', 'BLOCKED'], ['ui', false, true, 'Browser journey', 'BLOCKED'], ['latency', false, true, 'Load threshold', 'BLOCKED'], ['latency', false, false, 'Canary evaluation', 'BLOCKED']];
  for (const [fault, mock, large, gate, status] of releaseCases) {
    await page.locator('[data-fault]').selectOption(fault);
    await page.locator('[data-db-double]').setChecked(mock);
    await page.locator('[data-large-carts]').setChecked(large);
    await page.locator('[data-run-all]').click();
    assert.ok((await page.locator('[data-lab-gate]').textContent()).startsWith(gate), `${fault} → ${gate}`);
    assert.equal(await page.locator('[data-lab-status]').textContent(), status);
    const failedActor = { math: 'price', schema: 'database', contract: 'payment', ui: 'browser', latency: 'database' }[fault];
    if (status === 'BLOCKED') {
      const node = page.locator('[data-release-lab] [data-system-actor].is-failed');
      assert.equal(await node.count(), 1, `${fault} marks one failed actor`);
      if (!(fault === 'latency' && !large)) assert.equal(await node.getAttribute('data-system-actor'), failedActor);
    } else assert.equal(await page.locator('[data-release-lab] [data-system-actor].is-failed').count(), 0);
    await page.locator('[data-run-reset]').click();
  }
  await page.locator('[data-fault]').selectOption('schema'); await page.locator('[data-db-double]').check();
  assert.equal(await page.locator('[data-catch-row="schema"] [data-catch="catch"]').count(), 1);
  assert.equal(await page.locator('[data-catch-row="schema"] td').nth(4).getAttribute('data-catch'), 'catch'); // API catches it once integration is doubled
  await page.goto(`${url}#production-signals`); await active().locator('[data-lsn-choice]').nth(2).click();
  for (const [preset, verdict] of [['healthy', 'CONTINUE'], ['slow', 'HALT'], ['small', 'WAIT']]) {
    await page.locator(`[data-canary-preset="${preset}"]`).click(); assert.equal(await page.locator('[data-canary-verdict]').textContent(), verdict);
    assert.equal(await page.locator(`[data-canary-preset="${preset}"]`).getAttribute('aria-pressed'), 'true');
  }
  await page.locator('[name="candidateP95"]').fill('500');
  assert.equal(await page.locator('[data-canary-preset][aria-pressed="true"]').count(), 0, 'slider clears preset');
  assert.equal(await page.locator('[data-latency-label="candidate"]').textContent(), '500 ms');
  const no = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } }); await no.goto(url);
  assert.equal(await no.locator('[data-lsn-view]:visible').count(), viewIds.length);
  assert.equal(await no.locator('[data-run-next]:visible').count(), 0);
  assert.ok(await no.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(errors, []);
  console.log(`PASS: ${cases} view/frame/viewport checks, 4 old fragments, 8 release outcomes, catch grid, failed actors, canary presets and no-JS.`);
} finally { await browser.close(); }
