const pad = (value: number) => String(value).padStart(2, '0');

export function initLessonConsole() {
  const root = document.querySelector<HTMLElement>('.lsn-console');
  if (!root) return;
  const all = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => [...scope.querySelectorAll<T>(selector)];
  const one = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => scope.querySelector<T>(selector);
  const write = (selector: string, value: string) => { const target = one(selector); if (target) target.textContent = value; };

  const views = all('[data-lsn-view]');
  const links = all<HTMLAnchorElement>('[data-lsn-link]');
  const groups = all<HTMLDetailsElement>('[data-lsn-group]');
  const inspector = one('[data-lsn-inspector]');
  const menu = one<HTMLDetailsElement>('[data-lsn-menu]');
  const reference = one<HTMLDetailsElement>('[data-lsn-sources]');
  const narrow = window.matchMedia('(max-width: 760px)');
  const at = new Map<HTMLElement, number>();
  let active = 0;

  /** Shows one frame of a view: a step in time, or one of the alternatives. */
  const showFrame = (view: HTMLElement, next: number, announce = false) => {
    const frames = all('[data-lsn-frame]', view);
    const index = Math.max(0, Math.min(frames.length - 1, next));
    at.set(view, index);
    frames.forEach((frame, position) => frame.classList.toggle('is-active', position === index));
    all<HTMLButtonElement>('[data-lsn-choice]', view).forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
    const forward = one<HTMLButtonElement>('[data-lsn-next]', view);
    const back = one<HTMLButtonElement>('[data-lsn-back]', view);
    const restart = one<HTMLButtonElement>('[data-lsn-restart]', view);
    if (forward) forward.disabled = index === frames.length - 1;
    if (back) back.disabled = index === 0;
    if (restart) restart.disabled = index === 0;
    const count = one('[data-lsn-step]', view);
    if (count) count.textContent = `Step ${index + 1} of ${frames.length}`;
    if (announce) write('[data-lsn-live]', `${frames[index].dataset.lsnAction}. ${one('figcaption p', frames[index])?.textContent ?? ''}`);
  };

  const showView = (next: number, push = false, focus = false) => {
    active = Math.max(0, Math.min(views.length - 1, next));
    const view = views[active];
    views.forEach((item, position) => item.classList.toggle('is-active', position === active));
    links.forEach((link, position) => position === active ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    const home = links[active]?.closest('[data-lsn-group]');
    groups.forEach((group) => { group.open = group === home; });
    const label = view.dataset.lsnLabel ?? '';
    write('[data-lsn-count]', `${pad(active + 1)} / ${pad(views.length)}`);
    write('[data-lsn-view-title]', label);
    write('[data-lsn-progress]', `${pad(active + 1)} / ${label}`);
    write('[data-lsn-point]', view.dataset.lsnTakeaway ?? '');
    if (menu && narrow.matches && push) menu.open = false;
    if (inspector) inspector.innerHTML = one('[data-lsn-reading]', view)?.innerHTML ?? '';
    const prev = one<HTMLButtonElement>('[data-lsn-prev]');
    const forward = one<HTMLButtonElement>('[data-lsn-forward]');
    if (prev) prev.disabled = active === 0;
    if (forward) forward.disabled = active === views.length - 1;
    if (push && location.hash !== `#${view.id}`) history.pushState(null, '', `#${view.id}`);
    if (focus) {
      one('.lsn-main')?.scrollIntoView({ block: 'start', behavior: 'auto' });
      one('h2', view)?.focus({ preventScroll: true });
    }
  };

  const fromHash = () => {
    const target = decodeURIComponent(location.hash.slice(1));
    if (!target) return -1;
    if (reference && target === reference.id) reference.open = true;
    return views.findIndex((view) => view.id === target);
  };

  views.forEach((view) => {
    one('[data-lsn-steps]', view)?.removeAttribute('hidden');
    one('[data-lsn-choices]', view)?.removeAttribute('hidden');
    all<HTMLButtonElement>('[data-lsn-choice]', view).forEach((button, index) => button.addEventListener('click', () => showFrame(view, index, true)));
    one('[data-lsn-next]', view)?.addEventListener('click', () => showFrame(view, (at.get(view) ?? 0) + 1, true));
    one('[data-lsn-back]', view)?.addEventListener('click', () => showFrame(view, (at.get(view) ?? 0) - 1, true));
    one('[data-lsn-restart]', view)?.addEventListener('click', () => showFrame(view, 0, true));
    showFrame(view, 0);
  });

  links.forEach((link, index) => link.addEventListener('click', (event) => { event.preventDefault(); showView(index, true, true); }));
  one('[data-lsn-prev]')?.addEventListener('click', () => showView(active - 1, true, true));
  one('[data-lsn-forward]')?.addEventListener('click', () => showView(active + 1, true, true));
  one('[data-lsn-timeline]')?.removeAttribute('hidden');
  const sync = () => { const index = fromHash(); if (index >= 0) showView(index, false, true); };
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', sync);

  root.classList.add('is-enhanced');
  if (menu && narrow.matches) menu.open = false;
  const start = fromHash();
  showView(start >= 0 ? start : 0, false, start >= 0);
}
