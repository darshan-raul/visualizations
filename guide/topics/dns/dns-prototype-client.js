/* Console behaviour, ported from src/components/lesson/lesson-client.ts, plus the record map, the change timeline and the diagnose checks. */
(() => {
  const root = document.querySelector('.lsn-console');
  if (!root) return;
  const pad = (n) => String(n).padStart(2, '0');
  const all = (sel, scope = root) => [...scope.querySelectorAll(sel)];
  const one = (sel, scope = root) => scope.querySelector(sel);
  const write = (sel, value) => { const t = one(sel); if (t) t.textContent = value; };
  const say = (text) => write('[data-lsn-live]', text);

  const views = all('[data-lsn-view]');
  const links = all('[data-lsn-link]');
  const groups = all('[data-lsn-group]');
  const inspector = one('[data-lsn-inspector]');
  const menu = one('[data-lsn-menu]');
  const reference = one('[data-lsn-sources]');
  const narrow = window.matchMedia('(max-width: 760px)');
  const at = new Map();
  let active = 0;

  /* Diagnose: reveal checks one at a time inside the active fault. */
  const resetChecks = (frame) => {
    const box = one('[data-dns-diagnose]', frame);
    if (!box) return;
    const checks = all('[data-dns-check]', box);
    checks.forEach((c, i) => { c.hidden = i > 0; c.classList.remove('is-new'); });
    box.dataset.shown = '1';
    one('[data-dns-verdict]', box).hidden = checks.length > 1;
    const run = one('[data-dns-run]', box);
    run.disabled = checks.length <= 1;
    run.textContent = checks.length > 1 ? 'Run check 2 →' : 'All checks run';
  };
  all('[data-dns-diagnose]').forEach((box) => {
    one('[data-dns-check-controls]', box).hidden = false;
    one('[data-dns-run]', box).addEventListener('click', () => {
      const checks = all('[data-dns-check]', box);
      const shown = Number(box.dataset.shown) + 1;
      box.dataset.shown = String(shown);
      const fresh = checks[shown - 1];
      fresh.hidden = false; fresh.classList.add('is-new');
      const run = one('[data-dns-run]', box);
      if (shown >= checks.length) { one('[data-dns-verdict]', box).hidden = false; run.disabled = true; run.textContent = 'All checks run'; }
      else run.textContent = `Run check ${shown + 1} →`;
      say(`${one('.dns-cmd', fresh).textContent}. ${one('p', fresh).textContent}`);
    });
    one('[data-dns-reset]', box).addEventListener('click', () => resetChecks(box.closest('[data-lsn-frame]')));
  });

  const showFrame = (view, next, announce = false) => {
    const frames = all('[data-lsn-frame]', view);
    if (!frames.length) return;
    const index = Math.max(0, Math.min(frames.length - 1, next));
    at.set(view, index);
    frames.forEach((f, i) => f.classList.toggle('is-active', i === index));
    all('[data-lsn-choice]', view).forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
    const fwd = one('[data-lsn-next]', view), back = one('[data-lsn-back]', view), restart = one('[data-lsn-restart]', view);
    if (fwd) fwd.disabled = index === frames.length - 1;
    if (back) back.disabled = index === 0;
    if (restart) restart.disabled = index === 0;
    const count = one('[data-lsn-step]', view);
    if (count) count.textContent = `Step ${index + 1} of ${frames.length}`;
    resetChecks(frames[index]);
    if (announce) say(`${frames[index].dataset.lsnAction}. ${one('figcaption p', frames[index])?.textContent ?? ''}`);
  };

  const showView = (next, push = false, focus = false) => {
    active = Math.max(0, Math.min(views.length - 1, next));
    const view = views[active];
    views.forEach((v, i) => v.classList.toggle('is-active', i === active));
    links.forEach((l, i) => i === active ? l.setAttribute('aria-current', 'step') : l.removeAttribute('aria-current'));
    const home = links[active]?.closest('[data-lsn-group]');
    groups.forEach((g) => { g.open = g === home; });
    const label = view.dataset.lsnLabel ?? '';
    write('[data-lsn-count]', `${pad(active + 1)} / ${pad(views.length)}`);
    write('[data-lsn-view-title]', label);
    write('[data-lsn-progress]', `${pad(active + 1)} / ${label}`);
    write('[data-lsn-point]', view.dataset.lsnTakeaway ?? '');
    if (menu && narrow.matches && push) menu.open = false;
    if (inspector) inspector.innerHTML = one('[data-lsn-reading]', view)?.innerHTML ?? '';
    one('[data-lsn-prev]').disabled = active === 0;
    one('[data-lsn-forward]').disabled = active === views.length - 1;
    if (push && location.hash !== `#${view.id}`) history.pushState(null, '', `#${view.id}`);
    if (focus) { one('.lsn-main').scrollIntoView({ block: 'start' }); one('h2', view)?.focus({ preventScroll: true }); }
  };

  /* Record map: a sign, a button or a #record-x fragment selects one record. */
  const recordView = views.findIndex((v) => v.id === 'records');
  const selectRecord = (type, push = false, focus = false) => {
    const panel = one(`[data-dns-record="${type}"]`);
    if (!panel) return;
    all('[data-dns-record]').forEach((p) => p.classList.toggle('is-active', p === panel));
    all('[data-dns-sign]').forEach((s) => s.dataset.dnsSign === type ? s.setAttribute('aria-current', 'true') : s.removeAttribute('aria-current'));
    all('[data-dns-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dnsPick === type)));
    if (push) history.pushState(null, '', `#${panel.id}`);
    say(`${type}: ${one('.dns-says', panel).textContent}`);
    if (focus) { panel.scrollIntoView({ block: 'nearest' }); one('h3', panel).focus({ preventScroll: true }); }
  };
  all('[data-dns-sign]').forEach((s) => s.addEventListener('click', (e) => { e.preventDefault(); selectRecord(s.dataset.dnsSign, true, narrow.matches); }));
  all('[data-dns-pick]').forEach((b) => b.addEventListener('click', () => selectRecord(b.dataset.dnsPick, true)));
  one('[data-dns-picker]')?.removeAttribute('hidden');

  /* Change timeline. */
  const dataEl = document.getElementById('dns-change-data');
  if (dataEl) {
    const c = JSON.parse(dataEl.textContent);
    const view = one('#change');
    let mode = c.modes[0].id, t = 0;
    const LABEL = { old: 'old address', new: 'new address', gone: 'broken' };
    const render = (announce) => {
      const m = c.modes.find((x) => x.id === mode);
      all('[data-dns-mode]', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dnsMode === mode)));
      all('[data-dns-change-table]', view).forEach((tb) => tb.classList.toggle('is-active', tb.dataset.dnsChangeTable === mode));
      all('[data-dns-col]', view).forEach((cell) => { const i = Number(cell.dataset.dnsCol); cell.classList.toggle('is-future', i > t); cell.classList.toggle('is-now', i === t); });
      all('[data-dns-tick]', view).forEach((li, i) => { li.classList.toggle('is-now', i === t); li.classList.toggle('is-past', i < t); one('button', li).setAttribute('aria-current', i === t ? 'step' : 'false'); });
      one('[data-dns-moment]', view).textContent = `${c.times[t]}: ${c.moments[t]} ${t === 0 ? m.summary : ''}`;
      one('[data-dns-ttl]', view).textContent = m.ttl[t];
      one('[data-dns-old]', view).textContent = t === c.times.length - 1 ? 'switched off' : 'running';
      const states = [];
      c.clients.forEach((cl) => {
        const [s, text] = c.cells[mode][cl.id][t];
        const li = one(`[data-dns-client="${cl.id}"]`, view);
        const before = li.dataset.state;
        li.className = `is-${s}${before && before !== s ? ' is-changed' : ''}`;
        li.dataset.state = s;
        one('.dns-client-state', li).textContent = LABEL[s];
        one('code', li).textContent = text;
        states.push(`${cl.label}: ${LABEL[s]}, ${text}`);
      });
      one('[data-dns-tnext]', view).disabled = t === c.times.length - 1;
      one('[data-dns-tback]', view).disabled = t === 0;
      one('[data-dns-treset]', view).disabled = t === 0;
      one('[data-dns-tcount]', view).textContent = `Moment ${t + 1} of ${c.times.length}`;
      if (announce) say(`${c.times[t]}. ${states.join('. ')}.`);
    };
    one('[data-dns-change-controls]', view).hidden = false;
    one('[data-dns-board]', view).hidden = false;
    all('[data-dns-mode]', view).forEach((b) => b.addEventListener('click', () => { mode = b.dataset.dnsMode; all('[data-dns-client]', view).forEach((li) => delete li.dataset.state); render(true); }));
    one('[data-dns-tnext]', view).addEventListener('click', () => { t = Math.min(c.times.length - 1, t + 1); render(true); });
    one('[data-dns-tback]', view).addEventListener('click', () => { t = Math.max(0, t - 1); render(true); });
    one('[data-dns-treset]', view).addEventListener('click', () => { t = 0; render(true); });
    all('[data-dns-jump]', view).forEach((b) => b.addEventListener('click', () => { t = Number(b.dataset.dnsJump); render(true); }));
    render(false);
  }

  const fromHash = () => {
    const target = decodeURIComponent(location.hash.slice(1));
    if (!target) return -1;
    if (reference && target === reference.id) { reference.open = true; return -1; }
    if (target.startsWith('record-') && one(`#${CSS.escape(target)}`)) { selectRecord(target.slice(7).toUpperCase()); return recordView; }
    return views.findIndex((v) => v.id === target);
  };

  views.forEach((view) => {
    one('[data-lsn-steps]', view)?.removeAttribute('hidden');
    one('[data-lsn-choices]', view)?.removeAttribute('hidden');
    all('[data-lsn-choice]', view).forEach((b, i) => b.addEventListener('click', () => showFrame(view, i, true)));
    one('[data-lsn-next]', view)?.addEventListener('click', () => showFrame(view, (at.get(view) ?? 0) + 1, true));
    one('[data-lsn-back]', view)?.addEventListener('click', () => showFrame(view, (at.get(view) ?? 0) - 1, true));
    one('[data-lsn-restart]', view)?.addEventListener('click', () => showFrame(view, 0, true));
    showFrame(view, 0);
  });
  links.forEach((l, i) => l.addEventListener('click', (e) => { e.preventDefault(); showView(i, true, true); }));
  one('[data-lsn-prev]').addEventListener('click', () => showView(active - 1, true, true));
  one('[data-lsn-forward]').addEventListener('click', () => showView(active + 1, true, true));
  one('[data-lsn-timeline]').removeAttribute('hidden');
  const sync = () => { const i = fromHash(); if (i >= 0) showView(i, false, true); };
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', sync);

  root.classList.add('is-enhanced');
  if (menu && narrow.matches) menu.open = false;
  selectRecord('A');
  const start = fromHash();
  showView(start >= 0 ? start : 0, false, start >= 0);
})();
