const pad = (value: number) => String(value).padStart(2, '0');

export function initGitConsole() {
  const root = document.querySelector<HTMLElement>('.git-console');
  if (!root) return;
  const all = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => [...scope.querySelectorAll<T>(selector)];
  const one = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => scope.querySelector<T>(selector);
  const write = (selector: string, value: string) => { const target = one(selector); if (target) target.textContent = value; };

  const views = all('[data-git-view]');
  const links = all<HTMLAnchorElement>('[data-git-link]');
  const groups = all<HTMLDetailsElement>('[data-git-group]');
  const inspector = one('[data-git-inspector]');
  const stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const step = new Map<HTMLElement, number>();
  const menu = one<HTMLDetailsElement>('[data-git-menu]');
  const narrow = window.matchMedia('(max-width: 760px)');
  /** The newest commit is on the right, so a graph that overflows starts scrolled to its end. */
  const showNewest = (scope: ParentNode) => all('.git-graph', scope).forEach((graph) => { graph.scrollLeft = graph.scrollWidth; });
  let active = 0;

  /** Labels and HEAD keep their identity between frames, so slide them from where they were. */
  const slide = (from: HTMLElement, to: HTMLElement) => {
    if (stillMotion.matches) return;
    all<SVGGElement>('[data-key]', to).forEach((mark) => {
      const slot = mark.closest<HTMLElement>('[data-git-scene]')?.dataset.gitScene;
      const before = one<SVGGElement>(`[data-git-scene="${slot}"] [data-key="${mark.dataset.key}"]`, from);
      if (!before) return;
      const { x: fromX, y: fromY } = before.dataset;
      const { x, y } = mark.dataset;
      if (fromX === x && fromY === y) return;
      mark.animate([{ transform: `translate(${fromX}px, ${fromY}px)` }, { transform: `translate(${x}px, ${y}px)` }], { duration: 560, easing: 'cubic-bezier(.4, 0, .2, 1)' });
    });
  };

  const showFrame = (view: HTMLElement, next: number, announce = false) => {
    const frames = all('[data-git-frame]', view);
    const index = Math.max(0, Math.min(frames.length - 1, next));
    const previous = step.get(view) ?? 0;
    step.set(view, index);
    frames.forEach((frame, position) => frame.classList.toggle('is-active', position === index));
    showNewest(frames[index]);
    if (previous !== index) slide(frames[previous], frames[index]);
    all<HTMLButtonElement>('[data-git-choice]', view).forEach((choice, position) => choice.setAttribute('aria-pressed', String(position === index)));
    const back = one<HTMLButtonElement>('[data-git-back]', view);
    const restart = one<HTMLButtonElement>('[data-git-restart]', view);
    const forward = one<HTMLButtonElement>('[data-git-next]', view);
    if (back) back.disabled = index === 0;
    if (restart) restart.disabled = index === 0;
    if (forward) {
      const upcoming = frames[index + 1];
      const nextView = views[views.indexOf(view) + 1];
      forward.textContent = upcoming ? `${upcoming.dataset.gitAction} →` : nextView ? `Next view: ${nextView.dataset.gitLabel} →` : 'End of the chain';
      forward.classList.toggle('is-onward', !upcoming);
      forward.disabled = !upcoming && !nextView;
    }
    const count = one('[data-git-step]', view);
    if (count) count.textContent = `Step ${index + 1} of ${frames.length}`;
    if (announce) write('[data-git-live]', `${frames[index].dataset.gitAction}. ${one('figcaption p', frames[index])?.textContent ?? ''}`);
  };

  const showView = (next: number, push = false, focus = false) => {
    active = Math.max(0, Math.min(views.length - 1, next));
    const view = views[active];
    views.forEach((item, position) => item.classList.toggle('is-active', position === active));
    links.forEach((link, position) => position === active ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    const home = links[active]?.closest('[data-git-group]');
    groups.forEach((group) => { group.open = group === home; });
    const label = view.dataset.gitLabel ?? '';
    write('[data-git-count]', `${pad(active + 1)} / ${pad(views.length)}`);
    write('[data-git-view-title]', label);
    write('[data-git-progress]', `${pad(active + 1)} / ${label}`);
    write('[data-git-point]', view.dataset.gitTakeaway ?? '');
    showNewest(view);
    if (menu && narrow.matches && push) menu.open = false;
    if (inspector) inspector.innerHTML = one('[data-git-reading]', view)?.innerHTML ?? '';
    const prev = one<HTMLButtonElement>('[data-git-prev]');
    const forward = one<HTMLButtonElement>('[data-git-forward]');
    if (prev) prev.disabled = active === 0;
    if (forward) forward.disabled = active === views.length - 1;
    if (push && location.hash !== `#${view.id}`) history.pushState(null, '', `#${view.id}`);
    if (focus) {
      one('.git-main')?.scrollIntoView({ block: 'start', behavior: 'auto' });
      one('h2', view)?.focus({ preventScroll: true });
    }
  };

  const fromHash = () => {
    const target = decodeURIComponent(location.hash.slice(1));
    if (!target) return -1;
    if (target === 'git-sources') one<HTMLDetailsElement>('#git-sources')?.setAttribute('open', '');
    return views.findIndex((view) => view.id === target || (view.dataset.gitAliases ?? '').split(' ').includes(target));
  };

  views.forEach((view) => {
    one('[data-git-controls]', view)?.removeAttribute('hidden');
    one('[data-git-next]', view)?.addEventListener('click', () => {
      const current = step.get(view) ?? 0;
      if (current < all('[data-git-frame]', view).length - 1) showFrame(view, current + 1, true);
      else showView(views.indexOf(view) + 1, true, true);
    });
    one('[data-git-back]', view)?.addEventListener('click', () => showFrame(view, (step.get(view) ?? 0) - 1, true));
    one('[data-git-restart]', view)?.addEventListener('click', () => showFrame(view, 0, true));
    all<HTMLButtonElement>('[data-git-choice]', view).forEach((choice, index) => choice.addEventListener('click', () => showFrame(view, index, true)));
    showFrame(view, 0);
  });
  links.forEach((link, index) => link.addEventListener('click', (event) => { event.preventDefault(); showView(index, true, true); }));
  one('[data-git-prev]')?.addEventListener('click', () => showView(active - 1, true, true));
  one('[data-git-forward]')?.addEventListener('click', () => showView(active + 1, true, true));
  one('[data-git-timeline]')?.removeAttribute('hidden');
  const sync = () => { const index = fromHash(); if (index >= 0) showView(index, false, true); };
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', sync);

  root.classList.add('is-enhanced');
  if (menu && narrow.matches) menu.open = false;
  const start = fromHash();
  showView(start >= 0 ? start : 0, false, start >= 0);
}
