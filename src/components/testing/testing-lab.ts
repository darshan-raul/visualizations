import { defaults, releaseResults, evaluateCanary, faults, type Fault, type Actor, type Options } from './testing-model';

export function initReleaseLab() {
  const root = document.querySelector<HTMLElement>('[data-release-lab]');
  if (!root) return;
  const el = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const write = (s: string, value: string) => { el(s).textContent = value; };
  const fault = el<HTMLSelectElement>('[data-fault]');
  const db = el<HTMLInputElement>('[data-db-double]');
  const carts = el<HTMLInputElement>('[data-large-carts]');
  let cursor = 0;
  const options = (f: Fault = fault.value as Fault): Options => ({ fault: f, databaseDouble: db.checked, largeCarts: carts.checked });

  /** The defect grid depends only on coverage, so it is redrawn whenever coverage changes. */
  const drawCatches = () => {
    root.querySelectorAll<HTMLElement>('[data-catch-row]').forEach((row) => {
      const first = releaseResults(options(row.dataset.catchRow as Fault)).findIndex((r) => r.status === 'fail');
      row.querySelectorAll<HTMLElement>('[data-catch]').forEach((cell, i) => {
        const s = first < 0 || i < first ? 'pass' : i === first ? 'catch' : 'skip';
        cell.dataset.catch = s;
        cell.querySelector('span')!.textContent = s === 'pass' ? '✓' : s === 'catch' ? '✕ caught' : '·';
      });
      row.classList.toggle('is-selected', row.dataset.catchRow === fault.value);
    });
  };

  const show = (announce = true) => {
    const all = releaseResults(options());
    const current = cursor ? all[cursor - 1] : null;
    const stopped = current?.status === 'fail';
    root.querySelectorAll<HTMLElement>('[data-gate]').forEach((gate) => {
      const i = Number(gate.dataset.gate);
      const status = i < cursor ? all[i].status : stopped ? 'skip' : 'pending';
      gate.dataset.status = status;
      gate.classList.toggle('is-current', i === cursor - 1);
      gate.querySelector('[data-gate-status]')!.textContent = status === 'pass' ? '✓ passed' : status === 'fail' ? '✕ blocked' : status === 'skip' ? 'not reached' : 'not run';
    });
    el<HTMLButtonElement>('[data-run-next]').disabled = stopped || cursor === all.length;
    el<HTMLButtonElement>('[data-run-all]').disabled = stopped || cursor === all.length;
    el<HTMLButtonElement>('[data-run-reset]').disabled = cursor === 0;
    write('[data-lab-position]', `${cursor} / ${all.length} gates run`);
    write('[data-lab-gate]', current ? `${current.name} · ${current.environment}` : 'Ready to run');
    write('[data-lab-status]', current ? stopped ? 'BLOCKED' : cursor === all.length ? 'FULL ROLLOUT' : 'PASSED' : 'NOT RUN');
    el('[data-assertion]').dataset.status = current?.status ?? 'pending';
    write('[data-lab-command]', current?.command ?? 'Choose a change and coverage, then run the next gate.');
    write('[data-lab-expected]', current?.expected ?? 'Each gate meets its assertion.');
    write('[data-lab-observed]', current?.observed ?? 'No run yet.');
    write('[data-lab-reason]', current?.reason ?? 'The artifact is built once at gate 2 and promoted by digest from there.');
    el('[data-lab-stop]').hidden = !stopped;
    write('[data-lab-blocks]', current?.blocks ?? '');
    const real = current?.real ?? [];
    const mocked = current?.mocked ?? [];
    const failed = stopped ? current!.failed : null;
    root.querySelectorAll<HTMLElement>('[data-system-actor],[data-mobile-actor]').forEach((node) => {
      const actor = (node.dataset.systemActor ?? node.dataset.mobileActor) as Actor;
      const state = actor === failed ? 'failed' : mocked.includes(actor) ? 'double' : real.includes(actor) ? 'real' : 'outside';
      node.classList.remove('is-real', 'is-double', 'is-outside', 'is-failed');
      node.classList.add(`is-${state}`);
      node.querySelector('[data-system-status]')!.textContent = state === 'real' ? 'real' : state === 'double' ? 'double' : state === 'failed' ? 'fails' : 'not used';
    });
    root.querySelectorAll<SVGElement>('[data-wire]').forEach((wire) => {
      const ids = wire.dataset.wire!.split(' ') as Actor[];
      const anyReal = ids.some((id) => real.includes(id));
      wire.classList.toggle('is-real', ids.every((id) => real.includes(id)));
      wire.classList.toggle('is-double', anyReal && ids.some((id) => mocked.includes(id)));
    });
    if (announce) write('[data-lab-live]', current ? `${current.name}: ${current.status}. ${current.observed}. ${stopped ? `Stops ${current.blocks}.` : ''}` : `Reset. ${faults[fault.value as Fault]}. No gates run.`);
  };

  root.querySelectorAll<HTMLElement>('[data-lab-controls]').forEach((e) => { e.hidden = false; });
  el<HTMLDetailsElement>('[data-lab-reference]').open = false;
  const reset = () => { cursor = 0; drawCatches(); show(); };
  [fault, db, carts].forEach((e) => e.addEventListener('change', reset));
  el('[data-run-next]').addEventListener('click', () => { cursor++; show(); });
  el('[data-run-all]').addEventListener('click', () => {
    const all = releaseResults(options());
    do { cursor++; } while (cursor < all.length && all[cursor - 1].status === 'pass');
    show();
  });
  el('[data-run-reset]').addEventListener('click', reset);
  fault.value = defaults.fault; db.checked = defaults.databaseDouble; carts.checked = defaults.largeCarts;
  drawCatches();
  show(false);
}

export function initCanaryLab() {
  const root = document.querySelector<HTMLElement>('[data-canary-lab]');
  if (!root) return;
  const names = ['minutes', 'requests', 'errors', 'baselineP95', 'candidateP95'] as const;
  const input = (name: string) => root.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  const presets = { healthy: [10, 1000, 3, 250, 270], slow: [10, 1000, 3, 250, 850], small: [1, 20, 0, 250, 240] };
  const pct = (ms: number) => `${Math.min(100, ms / 1200 * 100)}%`;
  const render = () => {
    const values = Object.fromEntries(names.map((name) => [name, Number(input(name).value)])) as Record<typeof names[number], number>;
    // Failures are a subset of requests; keep the control and the model consistent.
    if (values.errors > values.requests) { values.errors = values.requests; input('errors').value = String(values.errors); }
    const result = evaluateCanary(values);
    root.querySelectorAll<HTMLElement>('[data-canary-value]').forEach((e) => { e.textContent = String(values[e.dataset.canaryValue as typeof names[number]]); });
    result.checks.forEach((check, i) => {
      const row = root.querySelector<HTMLElement>(`[data-policy-row="${i}"]`)!;
      row.dataset.status = check.pending ? 'pending' : check.pass ? 'pass' : 'fail';
      row.querySelector('[data-policy-value]')!.textContent = check.value;
      row.querySelector('[data-policy-status]')!.textContent = check.pending ? '○ no sample' : check.pass ? '✓ met' : '✕ unmet';
    });
    root.querySelector('[data-canary-verdict]')!.textContent = result.verdict;
    root.dataset.verdict = result.verdict.toLowerCase();
    const meaning = result.verdict === 'HALT' ? 'A guardrail is breached. Stop widening exposure and prepare to roll back.' : result.verdict === 'WAIT' ? 'Nothing is breached, but the sample or observation window is too small to decide.' : 'All four criteria pass in this teaching policy. Proceed to the next rollout step.';
    root.querySelector('[data-canary-meaning]')!.textContent = meaning;
    root.querySelector('[data-canary-live]')!.textContent = `${result.verdict}. ${meaning}`;
    const chart = root.querySelector<HTMLElement>('[data-latency-chart]')!;
    chart.style.setProperty('--limit', pct(values.baselineP95 * 1.2));
    root.querySelector<HTMLElement>('[data-latency-bar="baseline"]')!.style.setProperty('--size', pct(values.baselineP95));
    const candidate = root.querySelector<HTMLElement>('[data-latency-bar="candidate"]')!;
    candidate.style.setProperty('--size', pct(values.candidateP95));
    candidate.classList.toggle('is-over', values.candidateP95 > values.baselineP95 * 1.2);
    root.querySelector('[data-latency-label="baseline"]')!.textContent = `${values.baselineP95} ms`;
    root.querySelector('[data-latency-label="candidate"]')!.textContent = `${values.candidateP95} ms`;
    // A preset stays pressed only while the sliders still match it.
    root.querySelectorAll<HTMLElement>('[data-canary-preset]').forEach((b) => {
      const preset = presets[b.dataset.canaryPreset as keyof typeof presets];
      b.setAttribute('aria-pressed', String(names.every((n, i) => values[n] === preset[i])));
    });
    root.querySelector('[data-canary-rate]')!.textContent = values.requests ? `${result.rate.toFixed(2)}%` : 'not observed';
  };
  names.forEach((name) => input(name).addEventListener('input', render));
  root.querySelectorAll<HTMLButtonElement>('[data-canary-preset]').forEach((button) => button.addEventListener('click', () => {
    const values = presets[button.dataset.canaryPreset as keyof typeof presets];
    names.forEach((n, i) => { input(n).value = String(values[i]); });
    render();
  }));
  root.querySelectorAll<HTMLElement>('[data-canary-controls]').forEach((e) => { e.hidden = false; });
  render();
}
