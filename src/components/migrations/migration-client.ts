import { initLessonConsole } from '../lesson/lesson-client';
import { oldOrders, nextBatch, countMissing, rollout } from './migration-model';

export function initMigrations() {
  const root = document.querySelector<HTMLElement>('.migration-console');
  if (!root) return;
  initLessonConsole();

  const rolloutLab = root.querySelector<HTMLElement>('[data-mig-rollout]');
  if (rolloutLab) {
    const frames = [...rolloutLab.querySelectorAll<HTMLElement>('[data-rollout-frame]')];
    const failure = rolloutLab.querySelector<HTMLElement>('[data-rollout-failure]')!;
    const next = rolloutLab.querySelector<HTMLButtonElement>('[data-rollout-next]')!;
    const back = rolloutLab.querySelector<HTMLButtonElement>('[data-rollout-back]')!;
    let at = 0;
    const show = (index: number, bad = false, announce = true) => {
      at = Math.max(0, Math.min(frames.length - 1, index));
      frames.forEach((frame, i) => { frame.hidden = bad || i !== at; frame.classList.toggle('mig-fresh', i === at); });
      failure.hidden = !bad;
      rolloutLab.querySelectorAll('[data-rollout-stage]').forEach((stage, i) => i === at && !bad ? stage.setAttribute('aria-current', 'step') : stage.removeAttribute('aria-current'));
      next.disabled = !bad && at === frames.length - 1;
      next.textContent = bad ? 'Start the safe order →' : at === frames.length - 1 ? 'Rollout complete' : `Next: ${rollout[at + 1].label.toLowerCase()} →`;
      back.disabled = bad || at === 0;
      if (announce) rolloutLab.querySelector('[data-rollout-live]')!.textContent = bad ? 'New application first: query failed because currency does not exist.' : rollout[at].result;
    };
    next.addEventListener('click', () => show(failure.hidden ? at + 1 : 0));
    back.addEventListener('click', () => show(at - 1));
    rolloutLab.querySelector('[data-rollout-reset]')!.addEventListener('click', () => show(0));
    rolloutLab.querySelector('[data-rollout-bad]')!.addEventListener('click', () => show(0, true));
    rolloutLab.querySelector('[data-rollout-controls]')!.removeAttribute('hidden');
    show(0, false, false);
  }

  const backfill = root.querySelector<HTMLElement>('[data-mig-backfill]');
  if (backfill) {
    let rows = oldOrders.map(row => ({ ...row }));
    let paused = false;
    let extra = 0;
    const find = <T extends HTMLElement>(selector: string) => backfill.querySelector<T>(selector)!;
    const render = (message: string, fresh: number[] = [], announce = true) => {
      const body = find<HTMLTableSectionElement>('[data-mig-rows]');
      body.replaceChildren(...rows.map(row => {
        const tr = document.createElement('tr');
        tr.dataset.orderId = String(row.id);
        if (fresh.includes(row.id)) tr.className = 'mig-fresh-row';
        [String(row.id), String(row.cents), row.currency ?? 'NULL'].forEach((value, i) => {
          const td = document.createElement('td'); td.textContent = value;
          if (i === 2) { td.dataset.migCell = ''; td.className = `mig-new-col${row.currency === null ? ' is-null' : ''}`; }
          tr.append(td);
        });
        return tr;
      }));
      const missing = countMissing(rows);
      const filledHistorical = oldOrders.length - missing;
      find('[data-backfill-count]').textContent = `${filledHistorical} / ${oldOrders.length} filled`;
      find('[data-backfill-status]').textContent = missing === 0 ? 'Backfill complete' : paused ? 'Worker paused' : 'Ready for a batch';
      find('[data-backfill-message]').textContent = message;
      const progress = find('[data-backfill-progress]');
      progress.setAttribute('aria-valuenow', String(filledHistorical));
      progress.querySelector<HTMLElement>('span')!.style.width = `${filledHistorical / oldOrders.length * 100}%`;
      find<HTMLButtonElement>('[data-backfill-run]').disabled = paused || missing === 0;
      find<HTMLButtonElement>('[data-backfill-interrupt]').disabled = paused || missing === 0;
      find<HTMLButtonElement>('[data-backfill-pause]').hidden = paused;
      find<HTMLButtonElement>('[data-backfill-pause]').disabled = missing === 0;
      find('[data-backfill-resume]').hidden = !paused;
      find<HTMLButtonElement>('[data-backfill-insert]').disabled = extra >= 2;
      if (announce) find('[data-backfill-live]').textContent = message;
    };
    find('[data-backfill-run]').addEventListener('click', () => {
      const fresh = rows.filter(row => row.currency === null).slice(0, 2).map(row => row.id);
      rows = nextBatch(rows);
      render(`Committed USD for orders ${fresh.join(' and ')}. ${countMissing(rows)} historical rows remain.`, fresh);
    });
    find('[data-backfill-interrupt]').addEventListener('click', () => {
      paused = true;
      const ids = rows.filter(row => row.currency === null).slice(0, 2).map(row => row.id);
      render(`Batch for orders ${ids.join(' and ')} was interrupted before commit. Its writes rolled back; earlier committed batches stay. Resume to retry the remaining rows.`);
    });
    find('[data-backfill-pause]').addEventListener('click', () => { paused = true; render('Paused between batches. All committed values stay.'); });
    find('[data-backfill-resume]').addEventListener('click', () => { paused = false; render('Worker resumed. The next batch selects remaining NULL rows.'); });
    find('[data-backfill-insert]').addEventListener('click', () => {
      extra++; const id = 1047 + extra;
      rows.push({ id, cents: 7500, currency: 'USD' });
      render(`New order ${id} omitted currency. The database default supplied USD; historical rows still need their backfill.`, [id]);
    });
    find('[data-backfill-reset]').addEventListener('click', () => {
      rows = oldOrders.map(row => ({ ...row })); paused = false; extra = 0;
      render('Reset: six historical rows have no currency. New inserts can get the USD database default.');
    });
    find('[data-backfill-controls]').hidden = false;
    render('Six historical rows have no currency. A new insert that omits currency will get USD from the default.', [], false);
  }

  const locks = root.querySelector<HTMLElement>('[data-mig-locks]');
  if (locks) {
    const select = (name: string, announce = true) => {
      locks.querySelectorAll<HTMLElement>('[data-lock-state]').forEach(state => { state.hidden = state.dataset.lockState !== name; });
      locks.querySelector<HTMLButtonElement>('[data-lock-release]')!.disabled = name !== 'waiting';
      locks.querySelector<HTMLButtonElement>('[data-lock-timeout]')!.disabled = name !== 'waiting';
      if (announce) locks.querySelector('[data-lock-live]')!.textContent = locks.querySelector(`[data-lock-state="${name}"] .mig-caption`)!.textContent;
    };
    locks.querySelector('[data-lock-release]')!.addEventListener('click', () => select('released'));
    locks.querySelector('[data-lock-timeout]')!.addEventListener('click', () => select('timeout'));
    locks.querySelector('[data-lock-reset]')!.addEventListener('click', () => select('waiting'));
    locks.querySelector('[data-lock-controls]')!.removeAttribute('hidden');
    select('waiting', false);
  }
}
