import { chargeCost, money, rate, tiersFor, volume, type Meter } from './rates';

const pad = (value: number) => String(value).padStart(2, '0');

export function initDtcConsole() {
  const root = document.querySelector<HTMLElement>('.dtc-console');
  if (!root) return;
  const all = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => [...scope.querySelectorAll<T>(selector)];
  const one = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => scope.querySelector<T>(selector);
  const write = (selector: string, value: string) => { const target = one(selector); if (target) target.textContent = value; };

  const views = all('[data-dtc-view]');
  const links = all<HTMLAnchorElement>('[data-dtc-link]');
  const groups = all<HTMLDetailsElement>('[data-dtc-group]');
  const inspector = one('[data-dtc-inspector]');
  const menu = one<HTMLDetailsElement>('[data-dtc-menu]');
  const input = one<HTMLInputElement>('[data-dtc-gb]');
  const narrow = window.matchMedia('(max-width: 760px)');
  const choice = new Map<HTMLElement, number>();
  /** Hops revealed so far in a trace view; a view that isn't a trace shows every hop. */
  const traced = new Map<HTMLElement, number>();
  let active = 0;
  let gb = Number(input?.value) || 0;
  let timer = 0;

  const hopsIn = (view: HTMLElement) => Math.max(...all('[data-dtc-charge]', view).map((row) => Number(row.dataset.hop))) + 1;

  /** Recomputes every amount in one view from the current volume and, in a trace, the current step. */
  const price = (view: HTMLElement) => {
    const step = traced.get(view) ?? Infinity;
    const totals = all('[data-dtc-receipt]', view).map((receipt) => {
      let total = 0;
      all('[data-dtc-charge]', receipt).forEach((row) => {
        const pending = Number(row.dataset.hop) >= step;
        const cost = chargeCost({ meter: row.dataset.meter as Meter, rate: Number(row.dataset.rate) }, gb);
        row.classList.toggle('is-pending', pending);
        const cell = one('[data-dtc-amount]', row);
        if (cell) cell.textContent = pending ? '·' : money(cost);
        if (!pending) total += cost;
      });
      const sum = one('[data-dtc-total]', receipt);
      if (sum) sum.textContent = money(total);
      const tiers = one<HTMLTableElement>('[data-dtc-tiers]', receipt);
      if (tiers) {
        const body = tiers.tBodies[0];
        body.replaceChildren(...tiersFor(tiers.dataset.dtcTiers as Meter, gb).map((line) => {
          const row = document.createElement('tr');
          row.classList.toggle('is-empty', line.gb === 0);
          const head = document.createElement('th');
          head.scope = 'row';
          head.textContent = line.label;
          const cells = [volume(line.gb), line.perGB === 0 ? 'free' : `${rate(line.perGB)}/GB`, money(line.cost)].map((text) => Object.assign(document.createElement('td'), { textContent: text }));
          row.append(head, ...cells);
          return row;
        }));
      }
      return total;
    });
    all('[data-dtc-volume]', view).forEach((item) => { item.textContent = volume(gb); });
    const savings = one('[data-dtc-savings]', view);
    if (savings && totals.length > 1) {
      const saved = totals[0] - totals[1];
      const done = step >= hopsIn(view);
      savings.classList.toggle('is-pending', !done);
      one('[data-dtc-saved]', savings)!.textContent = money(saved);
      one('[data-dtc-share]', savings)!.textContent = `${totals[0] > 0 ? Math.round((saved / totals[0]) * 100) : 0}%`;
    }
  };

  const setVolume = (next: number) => {
    gb = Math.max(0, Math.min(10_000_000, Math.round(next) || 0));
    if (input && Number(input.value) !== gb) input.value = String(gb);
    all<HTMLButtonElement>('[data-dtc-preset]').forEach((preset) => preset.setAttribute('aria-pressed', String(Number(preset.dataset.dtcPreset) === gb)));
    views.forEach(price);
  };

  const showFrame = (view: HTMLElement, next: number, announce = false) => {
    const frames = all('[data-dtc-frame]', view);
    const index = Math.max(0, Math.min(frames.length - 1, next));
    choice.set(view, index);
    frames.forEach((frame, position) => frame.classList.toggle('is-active', position === index));
    all<HTMLButtonElement>('[data-dtc-choice]', view).forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
    if (announce) write('[data-dtc-live]', `${frames[index].dataset.dtcAction}. ${all('[data-dtc-receipt]', frames[index]).map((receipt) => `${one('h3', receipt)?.textContent}: ${one('[data-dtc-total]', receipt)?.textContent} a month`).join('. ')}.`);
  };

  /** Moves a trace to a step: hops before it are drawn and billed, the rest wait. */
  const showStep = (view: HTMLElement, next: number, announce = false) => {
    const last = hopsIn(view);
    const step = Math.max(0, Math.min(last, next));
    traced.set(view, step);
    all<SVGGElement>('.dtc-route', view).forEach((route) => {
      const stops = (route.dataset.stops ?? '0').split(',');
      one<SVGCircleElement>('.dtc-packet', route)?.style.setProperty('offset-distance', `${stops[Math.min(step, stops.length - 1)]}%`);
    });
    all<SVGElement>('.dtc-hop, .dtc-chip', view).forEach((mark) => mark.classList.toggle('is-pending', Number(mark.dataset.hop) >= step));
    price(view);
    const forward = one<HTMLButtonElement>('[data-dtc-step]', view);
    const reset = one<HTMLButtonElement>('[data-dtc-reset]', view);
    if (forward) forward.disabled = step === last;
    if (reset) reset.disabled = step === 0;
    write('[data-dtc-step-count]', step === 0 ? 'Start: nothing sent yet' : `Hop ${step} of ${last}`);
    if (announce) write('[data-dtc-live]', `${step === 0 ? 'Reset' : `Hop ${step} of ${last}`}. ${all('[data-dtc-receipt]', view).map((receipt) => `${one('h3', receipt)?.textContent}: ${one('[data-dtc-total]', receipt)?.textContent} so far`).join('. ')}.`);
  };

  const stop = (view: HTMLElement) => {
    window.clearInterval(timer);
    timer = 0;
    const play = one<HTMLButtonElement>('[data-dtc-play]', view);
    if (play) { play.textContent = '▶ Play'; play.setAttribute('aria-pressed', 'false'); }
  };

  const showView = (next: number, push = false, focus = false) => {
    views.forEach(stop);
    active = Math.max(0, Math.min(views.length - 1, next));
    const view = views[active];
    views.forEach((item, position) => item.classList.toggle('is-active', position === active));
    links.forEach((link, position) => position === active ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    const home = links[active]?.closest('[data-dtc-group]');
    groups.forEach((group) => { group.open = group === home; });
    const label = view.dataset.dtcLabel ?? '';
    write('[data-dtc-count]', `${pad(active + 1)} / ${pad(views.length)}`);
    write('[data-dtc-view-title]', label);
    write('[data-dtc-progress]', `${pad(active + 1)} / ${label}`);
    write('[data-dtc-point]', view.dataset.dtcTakeaway ?? '');
    if (menu && narrow.matches && push) menu.open = false;
    if (inspector) inspector.innerHTML = one('[data-dtc-reading]', view)?.innerHTML ?? '';
    const prev = one<HTMLButtonElement>('[data-dtc-prev]');
    const forward = one<HTMLButtonElement>('[data-dtc-forward]');
    if (prev) prev.disabled = active === 0;
    if (forward) forward.disabled = active === views.length - 1;
    if (push && location.hash !== `#${view.id}`) history.pushState(null, '', `#${view.id}`);
    if (focus) {
      one('.dtc-main')?.scrollIntoView({ block: 'start', behavior: 'auto' });
      one('h2', view)?.focus({ preventScroll: true });
    }
  };

  const fromHash = () => {
    const target = decodeURIComponent(location.hash.slice(1));
    if (!target) return -1;
    if (target === 'dtc-sources') one<HTMLDetailsElement>('#dtc-sources')?.setAttribute('open', '');
    return views.findIndex((view) => view.id === target);
  };

  views.forEach((view) => {
    one('[data-dtc-choices]', view)?.removeAttribute('hidden');
    all<HTMLButtonElement>('[data-dtc-choice]', view).forEach((button, index) => button.addEventListener('click', () => showFrame(view, index, true)));
    showFrame(view, 0);
    const trace = one('[data-dtc-trace]', view);
    if (!trace) return;
    trace.removeAttribute('hidden');
    one('[data-dtc-step]', view)?.addEventListener('click', () => { stop(view); showStep(view, (traced.get(view) ?? 0) + 1, true); });
    one('[data-dtc-reset]', view)?.addEventListener('click', () => { stop(view); showStep(view, 0, true); });
    one<HTMLButtonElement>('[data-dtc-play]', view)?.addEventListener('click', (event) => {
      const play = event.currentTarget as HTMLButtonElement;
      if (timer) return stop(view);
      if ((traced.get(view) ?? 0) >= hopsIn(view)) showStep(view, 0);
      play.textContent = '❚❚ Pause';
      play.setAttribute('aria-pressed', 'true');
      const advance = () => {
        showStep(view, (traced.get(view) ?? 0) + 1, true);
        if ((traced.get(view) ?? 0) >= hopsIn(view)) stop(view);
      };
      advance();
      timer = window.setInterval(advance, 1500);
    });
    showStep(view, 0);
  });

  const form = one<HTMLFormElement>('[data-dtc-volume-form]');
  form?.removeAttribute('hidden');
  form?.addEventListener('submit', (event) => event.preventDefault());
  input?.addEventListener('input', () => setVolume(Number(input.value)));
  all<HTMLButtonElement>('[data-dtc-preset]').forEach((preset) => preset.addEventListener('click', () => setVolume(Number(preset.dataset.dtcPreset))));

  links.forEach((link, index) => link.addEventListener('click', (event) => { event.preventDefault(); showView(index, true, true); }));
  one('[data-dtc-prev]')?.addEventListener('click', () => showView(active - 1, true, true));
  one('[data-dtc-forward]')?.addEventListener('click', () => showView(active + 1, true, true));
  one('[data-dtc-timeline]')?.removeAttribute('hidden');
  const sync = () => { const index = fromHash(); if (index >= 0) showView(index, false, true); };
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', sync);

  root.classList.add('is-enhanced');
  if (menu && narrow.matches) menu.open = false;
  const start = fromHash();
  showView(start >= 0 ? start : 0, false, start >= 0);
}
