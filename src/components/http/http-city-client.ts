const pad = (value: number) => String(value).padStart(2, '0');

export function initCityConsole() {
  const root = document.querySelector<HTMLElement>('.city-console');
  if (!root) return;
  const all = <T extends Element = HTMLElement>(selector: string) => [...root.querySelectorAll<T>(selector)];
  const one = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const write = (selector: string, value: string) => { const target = one(selector); if (target) target.textContent = value; };

  const panels = all('[data-city-code]');
  const signs = all<SVGAElement>('[data-city-sign]');
  const links = all<HTMLAnchorElement>('[data-city-link]');
  const groups = all<HTMLDetailsElement>('[data-city-group]');
  const map = one<SVGSVGElement>('[data-city-map]');
  const inspector = one('[data-city-inspector]');
  const menu = one<HTMLDetailsElement>('[data-city-menu]');
  const reference = one<HTMLDetailsElement>('[data-city-sources]');
  const narrow = window.matchMedia('(max-width: 760px)');
  let active = Math.max(0, panels.findIndex((panel) => panel.classList.contains('is-active')));

  /** `from` says what the reader used, which decides where focus and the viewport go. */
  const show = (next: number, from: 'load' | 'hash' | 'map' | 'index' | 'arrows') => {
    active = (next + panels.length) % panels.length;
    const panel = panels[active];
    const label = panel.dataset.cityLabel ?? '';
    panels.forEach((item, position) => item.classList.toggle('is-active', position === active));
    signs.forEach((sign, position) => position === active ? sign.setAttribute('aria-current', 'true') : sign.removeAttribute('aria-current'));
    links.forEach((link) => Number(link.dataset.cityLink) === active ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    const home = links.find((link) => Number(link.dataset.cityLink) === active)?.closest('[data-city-group]');
    groups.forEach((group) => { group.open = group === home; });
    map?.setAttribute('data-family', panel.dataset.cityFamily ?? '');
    write('[data-city-count]', `${pad(active + 1)} / ${pad(panels.length)}`);
    write('[data-city-title]', label);
    write('[data-city-progress]', label);
    write('[data-city-point]', panel.dataset.cityTakeaway ?? '');
    if (inspector) inspector.innerHTML = panel.querySelector('[data-city-reading]')?.innerHTML ?? '';
    if (from === 'load') return;
    if (from !== 'hash' && location.hash !== `#${panel.id}`) history.pushState(null, '', `#${panel.id}`);
    write('[data-city-live]', `${label}. ${panel.querySelector('.city-says')?.textContent ?? ''}`);
    if (from === 'index' && menu && narrow.matches) menu.open = false;
    // The map stays put on a wide screen. On a narrow one the detail is below the fold, so bring it up.
    if (from === 'index' || from === 'hash' || narrow.matches) {
      (narrow.matches ? panel : one('.lsn-main'))?.scrollIntoView({ block: 'start', behavior: 'auto' });
      if (from !== 'map') panel.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    }
  };

  const fromHash = () => {
    const target = decodeURIComponent(location.hash.slice(1));
    if (reference && target === reference.id) reference.open = true;
    return panels.findIndex((panel) => panel.id === target);
  };

  signs.forEach((sign, index) => sign.addEventListener('click', (event) => { event.preventDefault(); show(index, 'map'); }));
  links.forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); show(Number(link.dataset.cityLink), 'index'); }));
  one('[data-city-prev]')?.addEventListener('click', () => show(active - 1, 'arrows'));
  one('[data-city-next]')?.addEventListener('click', () => show(active + 1, 'arrows'));
  one('[data-city-timeline]')?.removeAttribute('hidden');
  const sync = () => { const index = fromHash(); if (index >= 0) show(index, 'hash'); };
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', sync);

  root.classList.add('is-enhanced');
  if (menu && narrow.matches) menu.open = false;
  const start = fromHash();
  show(start >= 0 ? start : active, 'load');
  if (start >= 0) show(start, 'hash');
}
