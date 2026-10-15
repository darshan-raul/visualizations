import type { CellState, ChangeTimeline, PlaceId, Route, RouteState, SplitRouting } from './dns-lesson';

/** The record map, the change board and the split routing board. The lesson console handles views, frames and checks. */
export function initDnsConsole() {
  const root = document.querySelector<HTMLElement>('.dns-console');
  if (!root) return;
  const all = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => [...scope.querySelectorAll<T>(selector)];
  const one = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => scope.querySelector<T>(selector);
  const say = (text: string) => { const live = one('[data-lsn-live]'); if (live) live.textContent = text; };
  const narrow = window.matchMedia('(max-width: 760px)');

  /* Record map: a sign, a type button or a #record-x fragment selects one record. */
  const selectRecord = (type: string, push = false, focus = false) => {
    const panel = one(`[data-dns-record="${type}"]`);
    if (!panel) return;
    all('[data-dns-record]').forEach((item) => item.classList.toggle('is-active', item === panel));
    all('[data-dns-sign]').forEach((sign) => sign.dataset.dnsSign === type ? sign.setAttribute('aria-current', 'true') : sign.removeAttribute('aria-current'));
    all('[data-dns-pick]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.dnsPick === type)));
    if (push && location.hash !== `#${panel.id}`) history.pushState(null, '', `#${panel.id}`);
    if (push) say(`${type}: ${one('.dns-says', panel)?.textContent ?? ''}`);
    // The detail sits under the map; on a narrow screen bring it into view.
    if (focus) { panel.scrollIntoView({ block: 'start' }); one('h3', panel)?.focus({ preventScroll: true }); }
  };
  all('[data-dns-sign]').forEach((sign) => sign.addEventListener('click', (event) => { event.preventDefault(); selectRecord(sign.dataset.dnsSign ?? '', true, narrow.matches); }));
  all('[data-dns-pick]').forEach((button) => button.addEventListener('click', () => selectRecord(button.dataset.dnsPick ?? '', true, narrow.matches)));
  one('[data-dns-picker]')?.removeAttribute('hidden');
  const fromHash = () => {
    const target = decodeURIComponent(location.hash.slice(1));
    if (target.startsWith('record-')) selectRecord(target.slice(7).toUpperCase());
  };
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('popstate', fromHash);
  fromHash();

  initRouteBoard(root, say);

  /* Change board. */
  const data = one('[data-dns-change-data]');
  const view = one('#change');
  if (!data || !view) return;
  const change = JSON.parse(data.textContent ?? '{}') as ChangeTimeline;
  const LABEL: Record<CellState, string> = { old: 'old address', new: 'new address', gone: 'broken' };
  const last = change.times.length - 1;
  let mode = change.modes[0].id;
  let moment = 0;
  const render = (announce: boolean) => {
    const plan = change.modes.find((item) => item.id === mode)!;
    all('[data-dns-mode]', view).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.dnsMode === mode)));
    all('[data-dns-change-table]', view).forEach((table) => table.classList.toggle('is-active', table.dataset.dnsChangeTable === mode));
    all('[data-dns-col]', view).forEach((cell) => {
      const column = Number(cell.dataset.dnsCol);
      cell.classList.toggle('is-future', column > moment);
      cell.classList.toggle('is-now', column === moment);
    });
    all('[data-dns-tick]', view).forEach((tick, index) => {
      tick.classList.toggle('is-now', index === moment);
      tick.classList.toggle('is-past', index < moment);
      const button = one('button', tick);
      if (index === moment) button?.setAttribute('aria-current', 'step'); else button?.removeAttribute('aria-current');
    });
    const line = one('[data-dns-moment]', view);
    if (line) line.textContent = `${change.times[moment]}: ${change.moments[moment]}${moment === 0 ? ` ${plan.summary}` : ''}`;
    const ttl = one('[data-dns-ttl]', view);
    if (ttl) ttl.textContent = plan.ttl[moment];
    const old = one('[data-dns-old]', view);
    if (old) old.textContent = moment === last ? 'switched off' : 'running';
    const spoken: string[] = [];
    for (const client of change.clients) {
      const [state, text] = change.cells[mode][client.id][moment];
      const card = one(`[data-dns-client="${client.id}"]`, view);
      if (!card) continue;
      const before = card.dataset.state;
      card.className = `is-${state}${before && before !== state ? ' is-changed' : ''}`;
      card.dataset.state = state;
      const label = one('.dns-client-state', card);
      if (label) label.textContent = LABEL[state];
      const value = one('code', card);
      if (value) value.textContent = text;
      spoken.push(`${client.label}: ${LABEL[state]}, ${text}`);
    }
    const set = (selector: string, disabled: boolean) => { const button = one<HTMLButtonElement>(selector, view); if (button) button.disabled = disabled; };
    set('[data-dns-tnext]', moment === last);
    set('[data-dns-tback]', moment === 0);
    set('[data-dns-treset]', moment === 0);
    const count = one('[data-dns-tcount]', view);
    if (count) count.textContent = `Moment ${moment + 1} of ${change.times.length}`;
    if (announce) say(`${change.times[moment]}. ${spoken.join('. ')}.`);
  };
  const go = (next: number) => { moment = Math.max(0, Math.min(last, next)); render(true); };
  one('[data-dns-change-controls]', view)?.removeAttribute('hidden');
  one('[data-dns-board]', view)?.removeAttribute('hidden');
  all('[data-dns-mode]', view).forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.dnsMode as typeof mode;
    all('[data-dns-client]', view).forEach((card) => { delete card.dataset.state; });
    render(true);
  }));
  one('[data-dns-tnext]', view)?.addEventListener('click', () => go(moment + 1));
  one('[data-dns-tback]', view)?.addEventListener('click', () => go(moment - 1));
  one('[data-dns-treset]', view)?.addEventListener('click', () => go(0));
  all('[data-dns-jump]', view).forEach((button) => button.addEventListener('click', () => go(Number(button.dataset.dnsJump))));
  render(false);
}

/** Split routing board: pick a place and a name in the table, choose a setup, and follow the question hop by hop. */
function initRouteBoard(root: HTMLElement, say: (text: string) => void) {
  const view = root.querySelector<HTMLElement>('#routes');
  const data = view?.querySelector('[data-dns-route-data]');
  if (!view || !data) return;
  const routing = JSON.parse(data.textContent ?? '{}') as SplitRouting;
  const one = <T extends Element = HTMLElement>(selector: string) => view.querySelector<T>(selector);
  const LABEL: Record<RouteState, string> = { public: 'public view', private: 'private view', corp: 'corporate', fail: 'not found' };
  let setup = routing.setups[0];
  let place: PlaceId = 'vpn';
  let index = 2;

  const routeOf = (at: PlaceId, column: number): Route => setup.changes[at]?.[column] ?? routing.routes[at][column];
  const changed = (at: PlaceId, column: number) => Boolean(setup.changes[at]?.[column]);
  /** What the place's own tool prints for this question. The formats come from scripts/verify-dns-split.mjs runs. */
  const check = (at: PlaceId, name: string, route: Route) => {
    const ask = routing.places.find((item) => item.id === at)!.ask;
    const ok = route.state !== 'fail';
    if (ask === 'resolvectl query') return `$ resolvectl query ${name}\n${ok ? `${name}: ${route.answer}    -- link: ${route.hops[1][0]}` : `${name}: Name '${name}' not found`}`;
    if (ask === 'getent hosts') return `$ kubectl exec deploy/web -- getent hosts ${name}\n${ok ? `${route.answer}       ${name}` : '(no output; exit status 2)'}`;
    return ok ? `$ ${ask} ${name} +short\n${route.answer}` : `$ ${ask} ${name} | grep status\n;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: …`;
  };

  const cells = [...view.querySelectorAll<HTMLTableCellElement>('[data-dns-cell]')];
  const render = (announce: boolean) => {
    view.querySelectorAll<HTMLButtonElement>('[data-dns-setup]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.dnsSetup === setup.id)));
    const summary = one('[data-dns-route-summary]');
    if (summary) summary.textContent = setup.summary;
    const caption = one('.dns-route-table caption');
    if (caption) caption.textContent = `Where each question ends up: ${setup.label.toLowerCase()}. Rows are where the question starts.`;
    for (const cell of cells) {
      const [at, column] = cell.dataset.dnsCell!.split(':');
      const route = routeOf(at as PlaceId, Number(column));
      const selected = at === place && Number(column) === index;
      cell.className = `dns-route-cell is-${route.state}${changed(at as PlaceId, Number(column)) ? ' is-changed' : ''}${selected ? ' is-selected' : ''}`;
      const button = cell.querySelector('button')!;
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('span')!.textContent = LABEL[route.state];
      button.querySelector('b')!.textContent = route.answer;
      button.querySelector('small')!.textContent = `via ${route.hops.at(-1)![0]}`;
    }
    const route = routeOf(place, index);
    const name = routing.names[index];
    const label = routing.places.find((item) => item.id === place)!.label;
    one('[data-dns-route-place]')!.textContent = label;
    one('[data-dns-route-name]')!.textContent = name;
    one('[data-dns-hops]')!.replaceChildren(...route.hops.map(([what, detail]) => {
      const item = document.createElement('li');
      const title = document.createElement('b');
      title.textContent = what;
      const small = document.createElement('small');
      small.textContent = detail;
      item.append(title, small);
      return item;
    }));
    const answer = one('[data-dns-route-answer]')!;
    answer.className = `dns-route-answer is-${route.state}`;
    answer.textContent = `${LABEL[route.state]}: ${route.answer}`;
    one('[data-dns-route-why]')!.textContent = `${changed(place, index) ? 'Changed by this setup. ' : ''}${route.why}`;
    one('[data-dns-route-check]')!.textContent = check(place, name, route);
    if (announce) say(`${label} asks for ${name}: ${route.hops.map(([what]) => what).join(', then ')}. Answer: ${route.answer}. ${route.why}`);
  };

  // Each cell becomes a button that picks its place and name.
  for (const cell of cells) {
    const button = document.createElement('button');
    button.type = 'button';
    button.append(...cell.childNodes);
    cell.append(button);
    const [at, column] = cell.dataset.dnsCell!.split(':');
    button.addEventListener('click', () => { place = at as PlaceId; index = Number(column); render(true); });
  }
  view.querySelectorAll<HTMLButtonElement>('[data-dns-setup]').forEach((button) => button.addEventListener('click', () => {
    setup = routing.setups.find((item) => item.id === button.dataset.dnsSetup) ?? routing.setups[0];
    // Show a question this setup changes, so its effect is visible at once.
    const first = Object.entries(setup.changes).flatMap(([at, changes]) => Object.keys(changes ?? {}).map((key) => [at, Number(key)] as const))[0];
    if (first) { place = first[0] as PlaceId; index = first[1]; }
    render(true);
  }));
  one('[data-dns-route-setups]')?.removeAttribute('hidden');
  one('[data-dns-route]')?.removeAttribute('hidden');
  one('[data-dns-route-mistakes]')?.setAttribute('hidden', '');
  render(false);
}
