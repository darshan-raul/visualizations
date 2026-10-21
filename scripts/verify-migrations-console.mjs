/** Browser checks for the progressive database migrations lesson.
 * Uses local Playwright, as do the other topic checks. Optional AXE_PATH enables axe.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE ?? `${homedir()}/.cache/ms-playwright-go/1.57.0/package`);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? `${homedir()}/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`, headless: true });
const url = `${process.env.MIGRATIONS_BASE_URL ?? 'http://127.0.0.1:4321'}/database-migrations`;
const shots = process.env.MIGRATIONS_SCREENSHOTS ?? '/tmp/database-migrations-qa';
await mkdir(shots, { recursive: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [], violations = [];
page.on('pageerror', error => errors.push(error.message));
const active = () => page.locator('[data-lsn-view].is-active');
const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const filled = () => page.locator('[data-mig-backfill] [data-mig-cell]').allTextContents();
let cases = 0;
try {
  await page.goto(url);
  const ids = await page.locator('[data-lsn-view]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(ids.length, 9);
  assert.equal(await active().getAttribute('id'), 'one-app-one-table');
  assert.equal(await active().locator('th').count(), 2);
  assert.equal(await active().locator('tbody tr').count(), 1);
  assert.equal(await active().locator('.mig-version').count(), 0);
  assert.equal(await active().locator('aside.mig-inspect:visible').count(), 1);
  assert.equal(await page.locator('details.mig-inspect').count(), 0);
  assert.doesNotMatch(await active().locator('.mig-view-content').textContent(), /Alembic|SQLAlchemy|revision/);
  for (const width of [1440, 1280, 1000, 720, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ids) {
      await page.goto(`${url}#${id}`);
      await page.waitForSelector(`#${id}.is-active`);
      assert.equal(await page.locator('[data-lsn-view]:visible').count(), 1);
      assert.equal(await page.locator('[data-lsn-group][open]').count(), 1);
      assert.ok(await noOverflow(), `${width}px ${id}`);
      const panel = active().locator('.mig-inspect');
      assert.equal(await panel.isVisible(), true);
      assert.ok(await panel.locator('.mig-code').first().isVisible());
      const { visualBox, panelBox } = await active().evaluate(el => ({
        visualBox: el.querySelector('.mig-visual').getBoundingClientRect().toJSON(),
        panelBox: el.querySelector('.mig-inspect').getBoundingClientRect().toJSON(),
      }));
      if (width > 1100) assert.ok(panelBox.x + 1 >= visualBox.x + visualBox.width, `${width}px ${id}: explanation on the right`);
      else assert.ok(panelBox.y + 1 >= visualBox.y + visualBox.height, `${width}px ${id}: explanation below visual`);
      assert.ok(await noOverflow(), `${width}px ${id} explanation`);
      if (id === 'a-new-field') {
        assert.equal(await active().locator('th').count(), 2);
        assert.match(await active().locator('.mig-result').textContent(), /does not exist/);
      }
      if (id === 'change-the-table') {
        assert.equal(await active().locator('th').count(), 3);
        assert.equal(await active().locator('[data-mig-cell]').textContent(), 'NULL');
      }
      if (id === 'deploy-in-order') {
        await page.locator('[data-rollout-reset]').click();
        for (let stage = 0; stage < 5; stage++) {
          if (stage) await page.locator('[data-rollout-next]').click();
          assert.equal(await page.locator('[data-rollout-frame]:visible').getAttribute('data-rollout-frame'), String(stage));
          assert.equal(await page.locator('[data-rollout-stage][aria-current]').count(), 1);
          assert.equal(await page.locator('[data-rollout-frame]:visible .mig-version strong').textContent(), ['001','002','002','002','003'][stage]);
          assert.ok(await noOverflow(), `${width}px rollout ${stage}`); cases++;
        }
        assert.equal(await page.locator('[data-rollout-next]').isDisabled(), true);
        await page.locator('[data-rollout-bad]').click();
        assert.equal(await page.locator('[data-rollout-frame]:visible').count(), 0);
        assert.equal(await page.locator('[data-rollout-failure]:visible').count(), 1);
        assert.match(await page.locator('[data-rollout-failure] .mig-result').textContent(), /does not exist/);
        await page.locator('[data-rollout-next]').click();
        assert.equal(await page.locator('[data-rollout-frame]:visible').getAttribute('data-rollout-frame'), '0');
      }
      if (id === 'fill-existing-rows') {
        await page.locator('[data-backfill-reset]').click();
        await page.locator('[data-backfill-insert]').click();
        assert.deepEqual(await filled(), ['NULL','NULL','NULL','NULL','NULL','NULL','USD']);
        await page.locator('[data-backfill-run]').click();
        assert.deepEqual(await filled(), ['USD','USD','NULL','NULL','NULL','NULL','USD']);
        assert.equal(await page.locator('[data-backfill-progress]').getAttribute('aria-valuenow'), '2');
        await page.locator('[data-backfill-interrupt]').click();
        assert.deepEqual(await filled(), ['USD','USD','NULL','NULL','NULL','NULL','USD']);
        assert.equal(await page.locator('[data-backfill-run]').isDisabled(), true);
        assert.match(await page.locator('[data-backfill-message]').textContent(), /rolled back/);
        await page.locator('[data-backfill-resume]').click();
        await page.locator('[data-backfill-run]').click();
        await page.locator('[data-backfill-pause]').click();
        assert.equal(await page.locator('[data-backfill-run]').isDisabled(), true);
        await page.locator('[data-backfill-resume]').click();
        await page.locator('[data-backfill-run]').click();
        assert.equal(await page.locator('[data-backfill-count]').textContent(), '6 / 6 filled');
        assert.equal(await page.locator('[data-backfill-run]').isDisabled(), true);
        assert.deepEqual(await filled(), Array(7).fill('USD'));
        assert.ok(await noOverflow());
        await page.locator('[data-backfill-reset]').click();
        assert.deepEqual(await filled(), Array(6).fill('NULL'));
        cases += 6;
      }
      if (id === 'when-a-change-waits') {
        await page.locator('[data-lock-reset]').click();
        assert.equal(await page.locator('[data-lock-state]:visible').getAttribute('data-lock-state'), 'waiting');
        await page.locator('[data-lock-release]').click();
        assert.equal(await page.locator('[data-lock-state]:visible').getAttribute('data-lock-state'), 'released');
        await page.locator('[data-lock-reset]').click();
        await page.locator('[data-lock-timeout]').click();
        assert.equal(await page.locator('[data-lock-state]:visible').getAttribute('data-lock-state'), 'timeout');
        assert.match(await page.locator('[data-lock-state="timeout"] .mig-caption').textContent(), /does not kill the blocker/);
        assert.ok(await noOverflow()); cases += 3;
      }
      if (width === 1440 && process.env.AXE_PATH) {
        await page.addScriptTag({ path: process.env.AXE_PATH });
        const results = await page.evaluate(async () => (await window.axe.run(document.querySelector('.migration-console'))).violations);
        violations.push(...results.filter(item => ['serious', 'critical'].includes(item.impact)).map(item => ({ id: item.id, view: id, nodes: item.nodes.map(node => node.target) })));
      }
      cases++;
    }
  }
  // Keyboard controls and visible focus, then browser history selecting the right group.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${url}#fill-existing-rows`);
  await page.locator('[data-backfill-reset]').click();
  const run = page.locator('[data-backfill-run]');
  await run.focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-backfill-count]').textContent(), '2 / 6 filled');
  assert.ok(await run.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'));
  await page.locator('a[data-lsn-link][href="#deploy-in-order"]').click();
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'deploy-in-order-title');
  await page.goBack(); assert.equal(await active().getAttribute('id'), 'fill-existing-rows');
  await page.goForward(); assert.equal(await active().getAttribute('id'), 'deploy-in-order');
  await page.goto(`${url}#database-migrations-sources`);
  assert.equal(await page.locator('[data-lsn-sources]').getAttribute('open'), '');
  const duplicates = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  assert.deepEqual(duplicates, []);
  for (const id of ids) {
    await page.goto(`${url}#${id}`);
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    assert.ok(await noOverflow(), `200% CSS zoom ${id}`);
    assert.ok(await active().evaluate(el => {
      const visual = el.querySelector('.mig-visual').getBoundingClientRect();
      const panel = el.querySelector('.mig-inspect').getBoundingClientRect();
      return panel.top + 1 >= visual.bottom;
    }), `200% CSS zoom ${id}: explanation stacks to preserve the visual`);
  }
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${url}#deploy-in-order`);
  await page.locator('[data-rollout-reset]').click(); await page.locator('[data-rollout-next]').click();
  assert.equal(await page.locator('[data-rollout-frame]:visible .is-changed').evaluate(el => getComputedStyle(el).animationName), 'none');
  const no = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  await no.goto(url);
  assert.equal(await no.locator('[data-lsn-view]:visible').count(), 9);
  assert.equal(await no.locator('[data-rollout-frame]:visible').count(), 5);
  assert.equal(await no.locator('[data-rollout-failure]:visible').count(), 1);
  assert.equal(await no.locator('[data-lock-state]:visible').count(), 3);
  assert.equal(await no.locator('[data-backfill-controls]:visible').count(), 0);
  assert.match(await no.locator('[data-mig-backfill]').textContent(), /interrupted before commit/);
  assert.equal(await no.locator('aside.mig-inspect:visible').count(), 9);
  assert.ok(await no.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await no.close();
  const touch = await browser.newPage({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 900 } });
  await touch.goto(`${url}#fill-existing-rows`); await touch.locator('[data-backfill-run]').tap();
  assert.equal(await touch.locator('[data-backfill-count]').textContent(), '2 / 6 filled'); await touch.close();
  for (const [width, id] of [[1440,'one-app-one-table'],[1440,'change-the-table'],[1280,'record-with-alembic'],[1440,'fill-existing-rows'],[1440,'python-and-go'],[390,'when-a-change-waits'],[320,'deploy-in-order']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${url}#${id}`);
    await page.addStyleTag({ content: 'astro-dev-toolbar { display:none!important }' });
    if (id === 'deploy-in-order') { await page.locator('[data-rollout-reset]').click(); await page.locator('[data-rollout-next]').click(); await page.locator('[data-rollout-next]').click(); }
    await page.screenshot({ path: `${shots}/${width}-${id}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []); assert.deepEqual(violations, []);
  console.log(`PASS: ${cases} view/state/viewport checks, simple opening, 9 always-visible right/bottom explanation panels, interrupted/resumed backfills, rollout order, lock outcomes, keyboard/focus, deep links/history, unique IDs, no-JS, reduced motion, CSS 200% zoom and simulated touch${process.env.AXE_PATH ? '; axe serious/critical checks' : ''}.`);
} finally { await browser.close(); }
