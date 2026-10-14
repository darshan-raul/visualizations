import { answersHtml, checksHtml, trip, view } from './cors-trip';
import { aliases, views } from './cors-views';
import { compare, comparison, presets } from './cors-origin';

const pad = (value: number) => String(value).padStart(2, '0');

export function initCorsConsole() {
  const root = document.querySelector<HTMLElement>('.cors-console');
  if (!root) return;
  const all = <T extends Element = HTMLElement>(selector: string, from: ParentNode = root) => [...from.querySelectorAll<T>(selector)];
  const one = <T extends Element = HTMLElement>(selector: string, from: ParentNode = root) => from.querySelector<T>(selector);
  const write = (selector: string, value: string) => { const target = one(selector); if (target) target.textContent = value; };

  // Panel 0 is Origins; panel n is views[n - 1], which shares the one stage (answers, map, playback).
  const panels = all('[data-cors-view]');
  const links = all<HTMLAnchorElement>('[data-cors-link]');
  const groups = all<HTMLDetailsElement>('[data-cors-group]');
  const stage = one('[data-cors-stage]');
  const maps = all<SVGSVGElement>('[data-cors-map]');
  const inspector = one('[data-cors-inspector]');
  const menu = one<HTMLDetailsElement>('[data-cors-menu]');
  const reference = one<HTMLDetailsElement>('[data-cors-sources]');
  const narrow = window.matchMedia('(max-width: 760px)');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chosen = views.map(() => 0);
  let active = 0;
  let upto = Infinity;
  let timer: number | undefined;

  const current = () => (active > 0 ? views[active - 1].choices[chosen[active - 1]] : undefined);

  /** Draw the active choice on both maps, up to step `upto` while playing. */
  const paint = () => {
    const choice = current();
    if (!choice) return;
    const t = trip(choice.config);
    const v = view(t);
    const last = v.steps - 1;
    const shown = Math.min(upto, last);
    const playing = upto < Infinity;
    maps.forEach((map) => {
      all<SVGElement>('[data-leg]', map).forEach((leg) => { const key = leg.dataset.leg as keyof typeof v.legs; leg.dataset.state = v.legs[key]; leg.classList.toggle('is-now', playing && v.at[key] === shown); });
      all<SVGElement>('[data-leg-label]', map).forEach((label) => { label.dataset.state = v.legs[label.dataset.legLabel as keyof typeof v.legs]; });
      all<SVGElement>('[data-t]', map).forEach((text) => { text.textContent = v.text[text.dataset.t as keyof typeof v.text] ?? ''; });
      all<SVGElement>('[data-s]', map).forEach((part) => { part.dataset.state = v.state[part.dataset.s as keyof typeof v.state]; });
      all<SVGElement>('[data-badge]', map).forEach((badge) => {
        const key = badge.dataset.badge as keyof typeof v.badge;
        badge.classList.toggle('is-off', !v.badge[key] || v.legs[key] === 'off');
        const label = badge.querySelector('text');
        if (label) label.textContent = v.badge[key] ? String(v.badge[key]) : '';
      });
      all<SVGElement>('[data-when]', map).forEach((element) => {
        element.dataset.at = String(v.at[element.dataset.when ?? ''] ?? 0);
        element.classList.toggle('is-later', Number(element.dataset.at) > shown);
      });
    });
    const box = one('[data-cors-answers]');
    if (box) box.innerHTML = answersHtml(t);
    const states = new Set(Object.values(v.legs));
    all('[data-cors-key]').forEach((key) => { key.hidden = !states.has(key.dataset.corsKey as typeof v.legs.call); });
    const check = one('[data-cors-check]');
    if (check) {
      check.innerHTML = checksHtml(t);
      all('[data-at]', check).forEach((part) => part.classList.toggle('is-later', Number(part.dataset.at) > shown));
    }
    const panel = panels[active];
    all('[data-cors-step]', panel).forEach((step) => {
      const index = Number(step.dataset.corsStep);
      step.classList.toggle('is-now', playing && index === shown);
      step.classList.toggle('is-later', index > shown);
    });
    write('[data-cors-now]', playing ? `Step ${shown + 1} of ${v.steps}: ${t.steps[shown].text}` : '');
  };

  const stop = () => { if (timer) window.clearInterval(timer); timer = undefined; };

  /** Pick one choice in the active view: its buttons, its panel, the diagnosis row it lands on, the map. */
  const choose = (index: number, announce: boolean) => {
    if (active === 0) return;
    stop();
    upto = Infinity;
    const item = views[active - 1];
    chosen[active - 1] = index;
    const panel = panels[active];
    all<HTMLButtonElement>('[data-cors-choice]', panel).forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.corsChoice) === index)));
    all('[data-cors-choice-panel]', panel).forEach((choicePanel) => choicePanel.classList.toggle('is-active', Number(choicePanel.dataset.corsChoicePanel) === index));
    const catches = item.choices[index].catches;
    all('[data-cors-diagnosis] li', panel).forEach((row, position) => {
      row.classList.toggle('is-caught', position === catches);
      row.classList.toggle('is-passed', catches !== undefined && position < catches);
    });
    paint();
    if (announce) {
      const t = trip(item.choices[index].config);
      write('[data-cors-live]', `${item.choices[index].label}. Reached the server: ${t.log[0].startsWith('(') ? 'no' : 'yes'}. ${t.scriptOk ? 'The script can read it.' : 'The script cannot read it.'}`);
    }
  };

  /** `from` says what the reader used, which decides where focus and the viewport go. */
  const show = (next: number, from: 'load' | 'hash' | 'index' | 'arrows', choice?: number) => {
    stop();
    active = (next + panels.length) % panels.length;
    const panel = panels[active];
    const label = panel.dataset.label ?? '';
    root.classList.toggle('is-intro', active === 0);
    panels.forEach((item, position) => item.classList.toggle('is-active', position === active));
    links.forEach((link) => Number(link.dataset.corsLink) === active ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    const home = links.find((link) => Number(link.dataset.corsLink) === active)?.closest('[data-cors-group]');
    groups.forEach((group) => { group.open = group === home; });
    write('[data-cors-count]', `${pad(active + 1)} / ${pad(panels.length)}`);
    write('[data-cors-title]', label);
    write('[data-cors-progress]', label);
    write('[data-cors-point]', panel.dataset.takeaway ?? '');
    if (inspector) inspector.innerHTML = panel.querySelector('[data-cors-reading]')?.innerHTML ?? '';
    // The stage sits between the view's choice buttons and its explanation.
    const slot = one('[data-cors-slot]', panel);
    if (stage && slot && stage.parentElement !== slot) slot.append(stage);
    if (active > 0) choose(choice ?? chosen[active - 1], false);
    if (from === 'load') return;
    if (from !== 'hash' && location.hash !== `#${panel.id}`) history.pushState(null, '', `#${panel.id}`);
    write('[data-cors-live]', label);
    if (from === 'index' && menu && narrow.matches) menu.open = false;
    if (from === 'index' || from === 'hash') {
      one('.lsn-main')?.scrollIntoView({ block: 'start', behavior: 'auto' });
      panel.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    }
  };

  /** A fragment names a view, a choice inside one, or a trip from the page's first version. */
  const fromHash = (): [number, number?] => {
    const target = decodeURIComponent(location.hash.slice(1));
    if (reference && target === reference.id) reference.open = true;
    const [viewId, choiceId] = aliases[target] ?? target.split('--');
    const index = panels.findIndex((panel) => panel.id === viewId);
    const choice = index > 0 && choiceId ? views[index - 1].choices.findIndex((item) => item.id === choiceId) : -1;
    return [index, choice >= 0 ? choice : undefined];
  };

  panels.forEach((panel) => all<HTMLButtonElement>('[data-cors-choice]', panel).forEach((button) => button.addEventListener('click', () => choose(Number(button.dataset.corsChoice), true))));

  // Playback reveals the trip one step at a time, with the step's sentence under the map.
  const steps = () => { const choice = current(); return choice ? view(trip(choice.config)).steps : 0; };
  const stepTo = (index: number) => { upto = Math.min(index, steps() - 1); paint(); if (upto >= steps() - 1) stop(); };
  one('[data-cors-run]')?.addEventListener('click', () => {
    stop();
    stepTo(0);
    timer = window.setInterval(() => stepTo(upto + 1), still.matches ? 1800 : 1300);
  });
  one('[data-cors-step]')?.addEventListener('click', () => { stop(); stepTo(upto >= steps() - 1 ? 0 : upto + 1); });

  // Origins: compare any URL with the page's origin.
  const oResult = one('[data-cors-o-result]');
  const oInput = one<HTMLInputElement>('#cors-o-input');
  const oPresets = all<HTMLButtonElement>('[data-cors-o-preset]');
  const compareWith = (url: string, why = '', pressed = -1) => {
    if (oResult) oResult.innerHTML = comparison(compare(url), why);
    oPresets.forEach((button, index) => button.setAttribute('aria-pressed', String(index === pressed)));
  };
  oPresets.forEach((button, index) => button.addEventListener('click', () => {
    if (oInput) oInput.value = presets[index].url;
    compareWith(presets[index].url, presets[index].why, index);
  }));
  one<HTMLFormElement>('[data-cors-o-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const url = oInput?.value ?? '';
    const preset = presets.findIndex((item) => item.url === url.trim());
    compareWith(url, preset >= 0 ? presets[preset].why : '', preset);
  });
  one('[data-cors-go]')?.addEventListener('click', (event) => { event.preventDefault(); show(1, 'index'); });

  links.forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); show(Number(link.dataset.corsLink), 'index'); }));
  one('[data-cors-prev]')?.addEventListener('click', () => show(active - 1, 'arrows'));
  one('[data-cors-next]')?.addEventListener('click', () => show(active + 1, 'arrows'));
  for (const selector of ['[data-cors-timeline]', '[data-cors-play]', '[data-cors-o-form]']) one(selector)?.removeAttribute('hidden');
  all('[data-cors-choose]').forEach((group) => group.removeAttribute('hidden'));
  const sync = () => { const [index, choice] = fromHash(); if (index >= 0) show(index, 'hash', choice); };
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', sync);

  root.classList.add('is-enhanced');
  if (menu && narrow.matches) menu.open = false;
  const [start, choice] = fromHash();
  show(0, 'load');
  if (start >= 0) show(start, 'hash', choice);
}
