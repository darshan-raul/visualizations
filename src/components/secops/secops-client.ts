import { steps } from './secops-data';

export function initSecops(): void {
  const root = document.querySelector<HTMLElement>('.secops-console');
  if (!root) return;

  root.classList.add('is-enhanced');

  const views = Array.from(root.querySelectorAll<HTMLElement>('[data-lsn-view]'));
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-lsn-link]'));
  const groups = Array.from(root.querySelectorAll<HTMLDetailsElement>('[data-lsn-group]'));
  const countEl = root.querySelector<HTMLElement>('[data-lsn-count]');
  const progressEl = root.querySelector<HTMLElement>('[data-lsn-progress]');
  const titleEl = root.querySelector<HTMLElement>('[data-lsn-view-title]');
  const pointEl = root.querySelector<HTMLElement>('[data-lsn-point]');
  const liveEl = root.querySelector<HTMLElement>('[data-lsn-live]');
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-lsn-prev]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-lsn-forward]');
  const timelineEl = root.querySelector<HTMLElement>('[data-lsn-timeline]');

  if (timelineEl) timelineEl.hidden = false;

  const aliasMap: Record<string, string> = {
    'tab-flow': 'dep-review',
    'tab-jobs': 'security-matrix',
    'tab-security': 'security-matrix',
    'tab-design': 'build-once',
    'tab-config': 'security-matrix',
    'tab-code': 'security-matrix',
    'dependency-review': 'dep-review',
    'code-quality': 'code-quality',
    'build': 'build-once',
    'scan-sign': 'attest-sign',
    'deploy-staging': 'deploy-staging',
    'dast-staging': 'dast-staging',
    'promote': 'promote-gate',
    'deploy-prod': 'deploy-prod',
    'rollback-prod': 'rollback-prod',
  };

  function resolveId(hash: string): string {
    const raw = hash.replace(/^#/, '');
    return aliasMap[raw] || raw;
  }

  function setActiveView(targetId: string, pushHistory = false): void {
    const cleanId = resolveId(targetId);
    let stepIndex = steps.findIndex((s) => s.id === cleanId);
    if (stepIndex === -1) stepIndex = 0;

    const currentStep = steps[stepIndex];
    const pad = (n: number) => String(n).padStart(2, '0');

    views.forEach((v, idx) => {
      const active = idx === stepIndex;
      v.classList.toggle('is-active', active);
    });

    links.forEach((l) => {
      const href = l.getAttribute('href') || '';
      const linkId = resolveId(href);
      if (linkId === currentStep.id) {
        l.setAttribute('aria-current', 'step');
        // Ensure parent group is open
        const parentGroup = l.closest<HTMLDetailsElement>('[data-lsn-group]');
        if (parentGroup) {
          groups.forEach((g) => {
            if (g !== parentGroup) g.open = false;
          });
          parentGroup.open = true;
        }
      } else {
        l.removeAttribute('aria-current');
      }
    });

    if (countEl) countEl.textContent = `${pad(stepIndex + 1)} / ${pad(steps.length)}`;
    if (progressEl) progressEl.textContent = `${pad(stepIndex + 1)} / ${currentStep.label}`;
    if (titleEl) titleEl.textContent = currentStep.label;
    if (pointEl) pointEl.textContent = currentStep.takeaway;

    if (prevBtn) prevBtn.disabled = stepIndex === 0;
    if (nextBtn) nextBtn.disabled = stepIndex === steps.length - 1;

    if (liveEl) {
      liveEl.textContent = `Active view: ${currentStep.label}. ${currentStep.takeaway}`;
    }

    if (pushHistory && window.location.hash !== `#${currentStep.id}`) {
      history.pushState(null, '', `#${currentStep.id}`);
    }
  }

  // Handle Hash Changes
  function onHash(): void {
    const hash = window.location.hash;
    if (hash) {
      setActiveView(hash, false);
    } else {
      setActiveView(steps[0].id, false);
    }
  }

  window.addEventListener('hashchange', onHash);
  onHash();

  // Index Links
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href') || '';
      setActiveView(href, true);
    });
  });

  // Timeline Buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const current = root.querySelector<HTMLElement>('[data-lsn-view].is-active');
      const idx = views.indexOf(current!);
      if (idx > 0) setActiveView(steps[idx - 1].id, true);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const current = root.querySelector<HTMLElement>('[data-lsn-view].is-active');
      const idx = views.indexOf(current!);
      if (idx < steps.length - 1) setActiveView(steps[idx + 1].id, true);
    });
  }

  // Failure Simulation Toggles
  root.querySelectorAll<HTMLButtonElement>('[data-secops-fail-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const board = btn.closest('[data-secops-board]');
      if (!board) return;
      const normalView = board.querySelector<HTMLElement>('[data-secops-normal-view]');
      const failView = board.querySelector<HTMLElement>('[data-secops-fail-view]');
      const isFailed = btn.getAttribute('aria-pressed') === 'true';

      const nextState = !isFailed;
      btn.setAttribute('aria-pressed', String(nextState));
      const textEl = btn.querySelector('.secops-toggle-text');
      if (textEl) {
        textEl.textContent = nextState ? 'Reset Normal State' : 'Simulate Gate Failure';
      }

      if (normalView) normalView.hidden = nextState;
      if (failView) failView.hidden = !nextState;
    });
  });

  // Canary Simulator
  const canarySim = root.querySelector<HTMLElement>('[data-secops-canary]');
  if (canarySim) {
    const barStable = canarySim.querySelector<HTMLElement>('[data-bar-stable]');
    const barCanary = canarySim.querySelector<HTMLElement>('[data-bar-canary]');
    const countStable = canarySim.querySelector<HTMLElement>('[data-stable-count]');
    const countCanary = canarySim.querySelector<HTMLElement>('[data-canary-count]');
    const dotsStable = canarySim.querySelector<HTMLElement>('[data-stable-dots]');
    const dotsCanary = canarySim.querySelector<HTMLElement>('[data-canary-dots]');
    const metricCanary = canarySim.querySelector<HTMLElement>('[data-canary-metric]');
    const statusBadge = canarySim.querySelector<HTMLElement>('[data-status-badge]');
    const statusDesc = canarySim.querySelector<HTMLElement>('[data-status-desc]');
    const buttons = Array.from(canarySim.querySelectorAll<HTMLButtonElement>('[data-canary-step]'));

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const step = btn.getAttribute('data-canary-step');

        if (step === '10') {
          if (barStable) { barStable.style.width = '90%'; barStable.textContent = '90% Stable'; }
          if (barCanary) { barCanary.style.width = '10%'; barCanary.textContent = '10% Canary'; barCanary.style.background = 'var(--purple)'; }
          if (countStable) countStable.textContent = '9 Pods Active';
          if (countCanary) countCanary.textContent = '1 Pod Active';
          if (dotsStable) dotsStable.innerHTML = Array(9).fill('<span class="pod-dot active"></span>').join('');
          if (dotsCanary) dotsCanary.innerHTML = '<span class="pod-dot is-canary-dot"></span>';
          if (metricCanary) metricCanary.innerHTML = 'p99 Latency: <strong>49ms</strong> · Analysis: <strong>Healthy (1/5)</strong>';
          if (statusBadge) { statusBadge.className = 'secops-status-badge is-pass'; statusBadge.textContent = 'CANARY ACTIVE: STEP 1/3 (10% WEIGHT)'; }
          if (statusDesc) statusDesc.textContent = 'Argo Rollouts is routing 10% of production traffic to the new container digest. Prometheus AnalysisTemplate is validating error thresholds for 10 minutes.';
        } else if (step === '50') {
          if (barStable) { barStable.style.width = '50%'; barStable.textContent = '50% Stable'; }
          if (barCanary) { barCanary.style.width = '50%'; barCanary.textContent = '50% Canary'; barCanary.style.background = 'var(--purple)'; }
          if (countStable) countStable.textContent = '5 Pods Active';
          if (countCanary) countCanary.textContent = '5 Pods Active';
          if (dotsStable) dotsStable.innerHTML = Array(5).fill('<span class="pod-dot active"></span>').join('');
          if (dotsCanary) dotsCanary.innerHTML = Array(5).fill('<span class="pod-dot is-canary-dot"></span>').join('');
          if (metricCanary) metricCanary.innerHTML = 'p99 Latency: <strong>51ms</strong> · Analysis: <strong>Healthy (3/5)</strong>';
          if (statusBadge) { statusBadge.className = 'secops-status-badge is-pass'; statusBadge.textContent = 'CANARY PROMOTING: STEP 2/3 (50% WEIGHT)'; }
          if (statusDesc) statusDesc.textContent = 'Traffic split evenly between versions. Metrics remain within SLO boundaries; preparing for final promotion.';
        } else if (step === '100') {
          if (barStable) { barStable.style.width = '0%'; barStable.textContent = ''; }
          if (barCanary) { barCanary.style.width = '100%'; barCanary.textContent = '100% Promoted'; barCanary.style.background = 'var(--green)'; }
          if (countStable) countStable.textContent = '0 Pods (Drained)';
          if (countCanary) countCanary.textContent = '10 Pods Active';
          if (dotsStable) dotsStable.innerHTML = '<span style="color:var(--muted);font-size:0.75rem;">Old ReplicaSet terminated</span>';
          if (dotsCanary) dotsCanary.innerHTML = Array(10).fill('<span class="pod-dot" style="background:var(--green)"></span>').join('');
          if (metricCanary) metricCanary.innerHTML = 'p99 Latency: <strong>48ms</strong> · Rollout: <strong>Completed (Healthy)</strong>';
          if (statusBadge) { statusBadge.className = 'secops-status-badge is-pass'; statusBadge.textContent = 'ROLLOUT COMPLETE: 100% OF PRODUCTION'; }
          if (statusDesc) statusDesc.textContent = 'Analysis passed with zero degraded metrics. The new immutable digest sha256:d4e891b is now the proven stable baseline.';
        } else if (step === 'rollback') {
          if (barStable) { barStable.style.width = '100%'; barStable.textContent = '100% Stable (Restored)'; }
          if (barCanary) { barCanary.style.width = '0%'; barCanary.textContent = ''; }
          if (countStable) countStable.textContent = '10 Pods Restored';
          if (countCanary) countCanary.textContent = '0 Pods (Aborted)';
          if (dotsStable) dotsStable.innerHTML = Array(10).fill('<span class="pod-dot active"></span>').join('');
          if (dotsCanary) dotsCanary.innerHTML = '<span style="color:var(--red);font-size:0.75rem;">Traffic disconnected</span>';
          if (metricCanary) metricCanary.innerHTML = 'Error Rate: <strong>3.8% (ANOMALY DETECTED)</strong>';
          if (statusBadge) { statusBadge.className = 'secops-status-badge is-danger'; statusBadge.textContent = 'EMERGENCY UNDO: TRAFFIC REVERTED IN 1.4s'; }
          if (statusDesc) statusDesc.textContent = 'Argo Rollouts detected HTTP 500 error spike during analysis. Instant undo restored 100% traffic to stable v2.14.0. Zero user downtime sustained.';
        }
      });
    });
  }

  // Code Tab Switching
  root.querySelectorAll<HTMLElement>('[data-code-viewer]').forEach((viewer) => {
    const tabs = Array.from(viewer.querySelectorAll<HTMLButtonElement>('[data-tab-target]'));
    const panels = Array.from(viewer.querySelectorAll<HTMLElement>('.secops-code-panel'));

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach((p) => {
          p.classList.remove('is-active');
          p.hidden = true;
        });

        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        const targetId = tab.getAttribute('data-tab-target');
        const targetPanel = viewer.querySelector<HTMLElement>(`#${targetId.replace('tab', 'panel')}`);
        if (targetPanel) {
          targetPanel.classList.add('is-active');
          targetPanel.hidden = false;
        }
      });
    });

    // Copy Snippet Buttons
    viewer.querySelectorAll<HTMLButtonElement>('[data-copy-btn]').forEach((copyBtn) => {
      copyBtn.addEventListener('click', () => {
        const panel = copyBtn.closest('.secops-code-panel');
        const codeEl = panel?.querySelector('code');
        if (!codeEl) return;

        navigator.clipboard.writeText(codeEl.textContent || '').then(() => {
          const original = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('is-copied');
          setTimeout(() => {
            copyBtn.textContent = original;
            copyBtn.classList.remove('is-copied');
          }, 2000);
        });
      });
    });
  });
}
