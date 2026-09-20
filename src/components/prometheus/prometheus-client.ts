import {
  promViews,
  acmeServices,
  simulationPresets,
  promChallenges,
  type PromLab,
  type SimulationPreset
} from './prometheus-data';

const byViewId = new Map<string, PromLab>(promViews.map((v) => [v.id, v]));

const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => root.querySelector<T>(selector);
const qa = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => [...root.querySelectorAll<T>(selector)];
const setText = (root: ParentNode, selector: string, value: string) => {
  const target = q<HTMLElement>(root, selector);
  if (target) target.textContent = value;
};

export function initPromConsoles() {
  qa<HTMLElement>(document, '.prom-console').forEach((consoleEl) => initConsole(consoleEl));
}

function initConsole(consoleEl: HTMLElement) {
  const sections = qa<HTMLElement>(consoleEl, '[data-prom-view]');
  const links = qa<HTMLAnchorElement>(consoleEl, '[data-prom-view-link]');
  let activeIndex = 0;

  // Global Simulation State
  const simState = {
    running: true,
    simTimeSec: 14 * 3600 + 2 * 60 + 15, // 14:02:15
    trafficMult: 1.0,
    errorRate: 0.008,
    latencyMult: 1.0,
    checkout3Down: false,
    userCardinalityActive: false,
    activeScenario: 'healthy' as string,
    rawCounter: 18421,
    gaugeVal: 42,
  };

  // Inspector Update Function
  const updateInspector = (
    title: string,
    copy: string,
    state: string,
    operation: string,
    config?: string,
    caveat?: string,
    metrics?: string[]
  ) => {
    setText(consoleEl, '[data-prom-inspector-title]', title);
    setText(consoleEl, '[data-prom-inspector-copy]', copy);
    setText(consoleEl, '[data-prom-inspector-state]', state);
    setText(consoleEl, '[data-prom-inspector-operation]', operation);
    if (config !== undefined) setText(consoleEl, '[data-prom-inspector-config]', config);
    if (caveat !== undefined) setText(consoleEl, '[data-prom-inspector-caveat]', caveat);
    if (metrics !== undefined) {
      const metricList = q<HTMLElement>(consoleEl, '[data-prom-inspector-metrics]');
      if (metricList) {
        metricList.innerHTML = metrics.map((m) => `<li><code>${m}</code></li>`).join('');
      }
    }
  };

  // View Navigation
  const selectView = (index: number, push = true) => {
    activeIndex = (index + sections.length) % sections.length;
    const activeSection = sections[activeIndex];
    const labId = activeSection.getAttribute('data-prom-view') || promViews[0].id;
    const lab = byViewId.get(labId) || promViews[0];

    // Toggle active view section
    sections.forEach((sec, i) => {
      sec.classList.toggle('is-active', i === activeIndex);
    });

    // Update navigation links
    links.forEach((link, i) => {
      if (i === activeIndex) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Expand current accordion group, close others
    const groupDetails = links[activeIndex]?.closest<HTMLDetailsElement>('[data-prom-index-group]');
    qa<HTMLDetailsElement>(consoleEl, '[data-prom-index-group]').forEach((details) => {
      details.open = details === groupDetails;
    });

    // Update view counters
    const countStr = `${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`;
    setText(consoleEl, '[data-prom-view-count]', countStr);
    setText(consoleEl, '[data-prom-view-counter]', countStr);

    // Update bottom takeaway and context inspector
    setText(consoleEl, '[data-prom-bottom-takeaway]', lab.takeaway);
    updateInspector(
      lab.title,
      lab.inspector,
      'Active Workspace Ready',
      `View ${String(activeIndex + 1).padStart(2, '0')}: ${lab.label}`,
      undefined,
      lab.caveat
    );

    if (push && location.hash !== `#${lab.id}`) {
      history.pushState(null, '', `#${lab.id}`);
    }
  };

  // Bind index link clicks
  links.forEach((link, idx) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      selectView(idx);
    });
  });

  // Bind footer prev / next stepper buttons
  q(consoleEl, '[data-prom-view-prev]')?.addEventListener('click', () => selectView(activeIndex - 1));
  q(consoleEl, '[data-prom-view-next]')?.addEventListener('click', () => selectView(activeIndex + 1));

  // Synchronize URL hash
  const syncHash = () => {
    const hash = location.hash.slice(1);
    const targetIdx = sections.findIndex((sec) => sec.id === hash);
    if (targetIdx >= 0) {
      selectView(targetIdx, false);
    }
  };
  window.addEventListener('hashchange', syncHash);
  syncHash();

  // -------------------------------------------------------------
  // SIMULATION ENGINE & PERSISTENT CONTROLS
  // -------------------------------------------------------------
  const pauseBtn = q<HTMLButtonElement>(consoleEl, '[data-sim-toggle-pause]');
  pauseBtn?.addEventListener('click', () => {
    simState.running = !simState.running;
    pauseBtn.textContent = simState.running ? 'Pause' : 'Resume';
    pauseBtn.classList.toggle('paused', !simState.running);
  });

  const scenarioSelect = q<HTMLSelectElement>(consoleEl, '[data-sim-scenario]');
  scenarioSelect?.addEventListener('change', () => {
    const presetKey = scenarioSelect.value;
    const preset: SimulationPreset = simulationPresets[presetKey] || simulationPresets.healthy;
    simState.activeScenario = preset.id;
    simState.trafficMult = preset.trafficMultiplier;
    simState.errorRate = preset.errorRate;
    simState.latencyMult = preset.latencyMultiplier;
    simState.checkout3Down = preset.checkout3Down;
    simState.userCardinalityActive = preset.userCardinalityActive;

    // Update sliders to reflect preset
    const tSlider = q<HTMLInputElement>(consoleEl, '[data-sim-traffic]');
    if (tSlider) tSlider.value = String(preset.trafficMultiplier);
    const eSlider = q<HTMLInputElement>(consoleEl, '[data-sim-errors]');
    if (eSlider) eSlider.value = String(preset.errorRate);
    const lSlider = q<HTMLInputElement>(consoleEl, '[data-sim-latency]');
    if (lSlider) lSlider.value = String(preset.latencyMultiplier);

    addEventLog(`[SCENARIO] Applied preset: ${preset.label} — ${preset.description}`);
  });

  q<HTMLInputElement>(consoleEl, '[data-sim-traffic]')?.addEventListener('input', (e) => {
    simState.trafficMult = parseFloat((e.target as HTMLInputElement).value);
  });
  q<HTMLInputElement>(consoleEl, '[data-sim-errors]')?.addEventListener('input', (e) => {
    simState.errorRate = parseFloat((e.target as HTMLInputElement).value);
  });
  q<HTMLInputElement>(consoleEl, '[data-sim-latency]')?.addEventListener('input', (e) => {
    simState.latencyMult = parseFloat((e.target as HTMLInputElement).value);
  });

  // Event Log helper
  const addEventLog = (msg: string) => {
    const logBox = q<HTMLElement>(consoleEl, '[data-events-log]');
    if (!logBox) return;
    const timeStr = formatSimTime(simState.simTimeSec);
    const item = document.createElement('div');
    item.className = 'event-item';
    item.innerHTML = `<span>${timeStr}</span> ${msg}`;
    logBox.prepend(item);
    if (logBox.children.length > 25) {
      logBox.removeChild(logBox.lastElementChild!);
    }
  };

  const formatSimTime = (sec: number) => {
    const h = String(Math.floor(sec / 3600) % 24).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s} UTC`;
  };

  // Main Simulation Tick (every 1.5s real time)
  setInterval(() => {
    if (!simState.running) return;

    simState.simTimeSec += 15;
    const timeStr = formatSimTime(simState.simTimeSec);
    setText(consoleEl, '[data-prom-sim-clock]', timeStr);

    // Compute live values with gentle jitter
    const jitter = 0.96 + Math.random() * 0.08;
    const totalTraffic = Math.round(340 * simState.trafficMult * jitter);
    const currentErrPct = (simState.errorRate * 100 * jitter).toFixed(1);
    const p95Latency = Math.round(45 * simState.latencyMult * jitter);

    setText(consoleEl, '[data-metric-user-traffic]', `${totalTraffic} req/s · ${currentErrPct}% err`);

    // Update service nodes
    acmeServices.forEach((srv) => {
      const srvRate = Math.round(srv.baseRate * simState.trafficMult * jitter);
      const srvLat = Math.round(srv.baseLatencyMs * simState.latencyMult * jitter);
      setText(consoleEl, `[data-node-traffic="${srv.id}"]`, `${srvRate} req/s · ${srvLat}ms`);
    });

    // Update Head Series & Samples
    const seriesCount = simState.userCardinalityActive ? 2840000 : 480;
    const sampleRate = simState.userCardinalityActive ? 189000 : Math.round(1421 * simState.trafficMult);
    setText(consoleEl, '[data-sim-stat-series]', seriesCount.toLocaleString());
    setText(consoleEl, '[data-sim-stat-samples]', `${sampleRate.toLocaleString()}/s`);
    setText(consoleEl, '[data-prom-head-series]', `${seriesCount.toLocaleString()} Series`);

    // Counter View Update
    simState.rawCounter += Math.round(25 * simState.trafficMult);
    setText(consoleEl, '[data-sample-live-val]', simState.rawCounter.toLocaleString());
    setText(consoleEl, '[data-sample-timeline-now]', simState.rawCounter.toLocaleString());

    // Emit particles on architecture canvas
    emitParticles();

    // Occasional periodic events
    if (simState.simTimeSec % 60 === 0) {
      addEventLog(`[RULE] Evaluated 4 rule groups in 2.8ms. TSDB head appended 1,421 samples.`);
    } else if (simState.simTimeSec % 15 === 0) {
      const targetsActive = simState.checkout3Down ? '10 / 11' : '11 / 11';
      addEventLog(`[SCRAPE] Pulled ${targetsActive} targets in ${p95Latency}ms. Ingested ${sampleRate} samples.`);
    }
  }, 1500);

  // -------------------------------------------------------------
  // SVG PARTICLE SYSTEM FOR ARCHITECTURE CANVAS
  // -------------------------------------------------------------
  const particleLayer = q<SVGGElement>(consoleEl, '[data-particle-layer]');
  const emitParticles = () => {
    if (!particleLayer) return;
    // Clean up old particles
    while (particleLayer.children.length > 24) {
      particleLayer.removeChild(particleLayer.firstChild!);
    }

    const paths = [
      'M 200 265 L 200 320 L 320 400',
      'M 500 265 L 500 400',
      'M 800 265 L 800 320 L 320 400'
    ];

    paths.forEach((d) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', simState.errorRate > 0.1 ? '#ef4444' : '#f97316');
      circle.setAttribute('class', 'metric-particle');

      const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      anim.setAttribute('path', d);
      anim.setAttribute('dur', '1.2s');
      anim.setAttribute('repeatCount', '1');
      anim.setAttribute('fill', 'freeze');

      circle.appendChild(anim);
      particleLayer.appendChild(circle);

      setTimeout(() => {
        if (circle.parentNode === particleLayer) {
          particleLayer.removeChild(circle);
        }
      }, 1250);
    });
  };

  // -------------------------------------------------------------
  // VIEW 1: CLICKABLE ARCHITECTURE NODES & INSPECTOR BINDINGS
  // -------------------------------------------------------------
  qa<HTMLElement>(consoleEl, '[data-node-id]').forEach((node) => {
    node.addEventListener('click', () => {
      const id = node.getAttribute('data-node-id');
      handleNodeClick(id || '');
    });
  });

  const handleNodeClick = (nodeId: string) => {
    switch (nodeId) {
      case 'checkout':
        updateInspector(
          'Microservice: Checkout (3 Replicas)',
          'Core ACME Shop purchase transaction handler. Replicas: checkout-1, checkout-2, checkout-3 running in pod network 10.244.1.0/24.',
          'HTTP Server Online (3 Instances)',
          'Exposing /metrics with http_requests_total, http_request_duration_seconds, and process_resident_memory_bytes.',
          `scrape_configs:
  - job_name: 'checkout'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['checkout-1:8080', 'checkout-2:8080', 'checkout-3:8080']`,
          'checkout-3 will fail scrapes if its container crashes or port 8080 becomes unreachable.',
          ['http_requests_total{service="checkout"}', 'http_request_duration_seconds_bucket', 'process_cpu_seconds_total']
        );
        break;
      case 'scrape-manager':
        updateInspector(
          'Prometheus Subsystem: Scrape Manager',
          'Responsible for target lifecycle, scrape scheduling, timeout enforcement, and target label isolation.',
          'Active Pool: 11 Targets Scraped Every 15s',
          'Dispatches HTTP GET /metrics requests concurrently with configured scrape_timeout (default: 10s).',
          `global:
  scrape_interval: 15s
  scrape_timeout: 10s
  evaluation_interval: 15s`,
          'If a scrape exceeds scrape_timeout, the scrape aborts, samples are discarded, and up{job="..."} is recorded as 0.',
          ['scrape_duration_seconds', 'scrape_samples_scraped', 'scrape_series_added', 'up']
        );
        break;
      case 'tsdb':
        updateInspector(
          'Prometheus Subsystem: TSDB (Time Series Database)',
          'High-performance append-only storage engine. Combines memory Head chunk, on-disk Write-Ahead Log (WAL), and compacted 2-hour blocks.',
          'Ingestion Rate: 1,421 samples/s · Head Series: 480',
          'Appends samples with double-delta timestamp compression and XOR value compression (Gorilla).',
          `storage:
  tsdb:
    path: /prometheus/data
    retention.time: 30d
    wal-compression: true`,
          'Unbounded label cardinality will cause Head series to balloon, triggering Linux kernel OOM killer.',
          ['prometheus_tsdb_head_series', 'prometheus_tsdb_head_chunks', 'prometheus_tsdb_wal_records_appended_total']
        );
        break;
      case 'promql-engine':
        updateInspector(
          'Prometheus Subsystem: PromQL Engine',
          'Read-only functional query evaluator. Parses expressions into an AST and evaluates vector operations across TSDB postings lists.',
          'Engine Status: Idle · Average Latency 2.4ms',
          'Evaluates instant vectors, range vectors, subqueries, and mathematical transformations.',
          `query:
  timeout: 2m
  max-samples: 50000000`,
          'Queries scanning unbounded regexes over long time windows (e.g. [30d]) can cause query engine timeout.',
          ['prometheus_engine_queries', 'prometheus_engine_query_duration_seconds']
        );
        break;
      case 'alertmanager':
        updateInspector(
          'Ecosystem Component: Alertmanager',
          'Independent notification pipeline. Handles deduplication, grouping, silencing, inhibition, and routing to PagerDuty/Slack.',
          'Cluster Status: Healthy · 0 Active Silences',
          'Receives firing alerts via HTTP POST from Prometheus rule evaluation loops.',
          `alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']`,
          'Prometheus evaluates alert expressions; Alertmanager handles delivery. Never confuse alert evaluation with notification routing.',
          ['alertmanager_alerts_received_total', 'alertmanager_notifications_total']
        );
        break;
      default:
        break;
    }
  };

  q(consoleEl, '[data-trigger-node="scrape-manager"]')?.addEventListener('click', () => handleNodeClick('scrape-manager'));
  q(consoleEl, '[data-trigger-node="tsdb"]')?.addEventListener('click', () => handleNodeClick('tsdb'));

  // -------------------------------------------------------------
  // VIEW 2: METRIC ANATOMY INTERACTIVE PARTS
  // -------------------------------------------------------------
  qa<HTMLElement>(consoleEl, '[data-part]').forEach((part) => {
    part.addEventListener('click', () => {
      qa(consoleEl, '[data-part]').forEach((p) => p.classList.remove('active'));
      part.classList.add('active');

      const pType = part.getAttribute('data-part');
      const titleEl = q(consoleEl, '[data-part-title]');
      const descEl = q(consoleEl, '[data-part-desc]');

      if (pType === 'name') {
        if (titleEl) titleEl.textContent = 'METRIC NAME: http_requests_total';
        if (descEl) descEl.textContent = 'Identifies the physical measurement being observed. Must follow naming pattern [a-zA-Z_:][a-zA-Z0-9_:]*. Suffix _total signals monotonic counter semantics.';
      } else if (pType?.startsWith('label-')) {
        const lbl = pType.replace('label-', '');
        if (titleEl) titleEl.textContent = `LABEL DIMENSION: ${lbl}`;
        if (descEl) descEl.textContent = `Key-value metadata adding orthogonal dimensions to the metric. Enables slicing and dicing in PromQL (e.g. sum by (${lbl})).`;
      } else if (pType === 'value') {
        if (titleEl) titleEl.textContent = 'SAMPLE VALUE: Float64';
        if (descEl) descEl.textContent = 'Standard 64-bit IEEE 754 floating point number paired with a millisecond timestamp. Prometheus records only numeric samples, never arbitrary text payloads.';
      }
    });
  });

  // -------------------------------------------------------------
  // VIEW 3: METRIC TYPES LABORATORY
  // -------------------------------------------------------------
  const typeTabs = qa<HTMLButtonElement>(consoleEl, '[data-type-tab]');
  const typeViews = qa<HTMLElement>(consoleEl, '[data-type-view]');

  typeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetType = tab.getAttribute('data-type-tab');
      typeTabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      typeViews.forEach((v) => v.classList.toggle('is-active', v.getAttribute('data-type-view') === targetType));
    });
  });

  // Counter Simulator Controls
  q(consoleEl, '[data-counter-add="1"]')?.addEventListener('click', () => {
    simState.rawCounter += 1;
    setText(consoleEl, '[data-sample-live-val]', simState.rawCounter.toLocaleString());
  });
  q(consoleEl, '[data-counter-add="100"]')?.addEventListener('click', () => {
    simState.rawCounter += 100;
    setText(consoleEl, '[data-sample-live-val]', simState.rawCounter.toLocaleString());
  });
  q(consoleEl, '[data-counter-reset]')?.addEventListener('click', () => {
    simState.rawCounter = 0;
    setText(consoleEl, '[data-sample-live-val]', '0 (RESET)');
    addEventLog(`[COUNTER RESET] Application process restarted. http_requests_total reset to 0. rate() handles transition.`);
  });

  // Gauge Simulator Controls
  const gaugeValEl = q<HTMLElement>(consoleEl, '[data-gauge-val]');
  const updateGauge = (delta: number) => {
    simState.gaugeVal = Math.max(0, simState.gaugeVal + delta);
    if (gaugeValEl) gaugeValEl.textContent = String(simState.gaugeVal);
  };
  q(consoleEl, '[data-gauge-delta="-5"]')?.addEventListener('click', () => updateGauge(-5));
  q(consoleEl, '[data-gauge-delta="5"]')?.addEventListener('click', () => updateGauge(5));
  q(consoleEl, '[data-gauge-delta="25"]')?.addEventListener('click', () => updateGauge(25));

  // Histogram Simulator Latency Slider
  q<HTMLInputElement>(consoleEl, '[data-latency-slider]')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    setText(consoleEl, '[data-latency-display]', `${val}ms`);
  });

  // -------------------------------------------------------------
  // VIEW 4: NATIVE HISTOGRAMS TOGGLE
  // -------------------------------------------------------------
  qa<HTMLButtonElement>(consoleEl, '[data-hist-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-hist-mode');
      qa(consoleEl, '[data-hist-mode]').forEach((b) => b.classList.toggle('is-active', b === btn));
      qa(consoleEl, '[data-hist-view]').forEach((v) => v.classList.toggle('is-active', v.getAttribute('data-hist-view') === mode));
    });
  });

  // -------------------------------------------------------------
  // VIEW 5: CARDINALITY EXPLORER
  // -------------------------------------------------------------
  const cardInputs = qa<HTMLInputElement>(consoleEl, '[data-card-dim]');
  const userToggle = q<HTMLInputElement>(consoleEl, '[data-card-toggle="user_id"]');
  const totalSeriesEl = q<HTMLElement>(consoleEl, '[data-total-series]');
  const ramEstimateEl = q<HTMLElement>(consoleEl, '[data-ram-estimate]');
  const oomWarningEl = q<HTMLElement>(consoleEl, '[data-oom-warning]');
  const cardCanvasBox = q<HTMLElement>(consoleEl, '#cardinality-canvas-box');

  const updateCardinality = () => {
    let total = 1;
    cardInputs.forEach((input) => {
      const val = parseInt(input.value, 10) || 1;
      total *= Math.max(1, val);
    });

    const isUserActive = userToggle?.checked;
    if (isUserActive) {
      total *= 100000;
    }

    if (totalSeriesEl) {
      totalSeriesEl.textContent = isUserActive
        ? `${(total / 1000000).toFixed(1)} MILLION SERIES`
        : `${total.toLocaleString()} SERIES`;
    }

    if (ramEstimateEl) {
      const ramMb = Math.round((total * 1.5) / 1024);
      ramEstimateEl.textContent = ramMb > 1024
        ? `~${(ramMb / 1024).toFixed(1)} GB TSDB Head RAM (CRITICAL OOM RISK!)`
        : `~${ramMb} MB TSDB Head RAM`;
    }

    if (oomWarningEl) {
      oomWarningEl.textContent = isUserActive ? 'DANGER: TSDB OOM CRASH IMMINENT' : 'HEALTHY CARDINALITY';
      oomWarningEl.classList.toggle('danger', isUserActive);
    }

    // Render Particle Grid
    if (cardCanvasBox) {
      cardCanvasBox.innerHTML = '';
      const numParticles = isUserActive ? 120 : Math.min(60, total);
      for (let i = 0; i < numParticles; i++) {
        const dot = document.createElement('div');
        dot.className = isUserActive ? 'series-cell danger' : 'series-cell';
        cardCanvasBox.appendChild(dot);
      }
    }
  };

  cardInputs.forEach((inp) => inp.addEventListener('input', updateCardinality));
  userToggle?.addEventListener('change', updateCardinality);
  updateCardinality();

  // -------------------------------------------------------------
  // VIEW 6: SCRAPE JOURNEY STEPPER
  // -------------------------------------------------------------
  let journeyStep = 0;
  const journeyStages = [
    { title: 'STAGE 1: SERVICE DISCOVERY', desc: 'Prometheus queries Kubernetes API or static config to fetch targets with __meta_* labels.', code: '__address__ = "10.244.2.45:8080"\n__meta_kubernetes_namespace = "prod"\n__meta_kubernetes_pod_name = "checkout-7d9c89f"' },
    { title: 'STAGE 2: TARGET LABELS INITIALIZATION', desc: 'Internal target metadata structure initialized. Internal labels prefixed with double underscores.', code: '__address__ = "10.244.2.45:8080"\n__scheme__ = "http"\n__metrics_path__ = "/metrics"' },
    { title: 'STAGE 3: TARGET RELABELING (relabel_configs)', desc: 'Rules applied BEFORE HTTP scrape. Selects which targets to keep, drop, or rewrite.', code: 'action: replace\nsource_labels: [__meta_kubernetes_pod_label_app]\ntarget_label: job -> job="checkout"' },
    { title: 'STAGE 4: HTTP GET /metrics SCRAPE', desc: 'Prometheus opens TCP connection and issues HTTP GET /metrics with Accept: text/plain; version=0.0.4.', code: 'GET /metrics HTTP/1.1\nHost: 10.244.2.45:8080\nUser-Agent: Prometheus/3.8.0' },
    { title: 'STAGE 5: PROTOCOL PARSING', desc: 'Line-by-line parsing of Prometheus text exposition format or OpenMetrics payload.', code: '# HELP http_requests_total Total requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="POST",status="500"} 18421' },
    { title: 'STAGE 6: METRIC RELABELING (metric_relabel_configs)', desc: 'Filters applied AFTER scrape. Allows dropping debug metrics or high-cardinality label keys.', code: 'action: drop\nregex: "debug_.*"\nsource_labels: [__name__]' },
    { title: 'STAGE 7: TSDB INGESTION', desc: 'Samples appended to Write-Ahead Log (WAL) on disk and active Head chunk in process RAM.', code: 'WAL segment: data/wal/00000125\nHead Series ID: #84920\nTimestamp: 1726754535000\nValue: 18421.0' }
  ];

  const updateJourney = (idx: number) => {
    journeyStep = Math.max(0, Math.min(6, idx));
    setText(consoleEl, '[data-journey-indicator]', `Step ${journeyStep + 1} / 7: ${journeyStages[journeyStep].title.replace('STAGE ' + (journeyStep + 1) + ': ', '')}`);
    setText(consoleEl, '[data-stage-title]', journeyStages[journeyStep].title);
    setText(consoleEl, '[data-stage-desc]', journeyStages[journeyStep].desc);
    const codeEl = q(consoleEl, '[data-stage-code] pre');
    if (codeEl) codeEl.textContent = journeyStages[journeyStep].code;

    qa(consoleEl, '[data-pipe-index]').forEach((node, i) => {
      node.classList.toggle('is-active', i === journeyStep);
    });
  };

  q(consoleEl, '[data-journey-step="prev"]')?.addEventListener('click', () => updateJourney(journeyStep - 1));
  q(consoleEl, '[data-journey-step="next"]')?.addEventListener('click', () => updateJourney(journeyStep + 1));
  q(consoleEl, '[data-journey-step="autoplay"]')?.addEventListener('click', () => {
    let s = 0;
    const interval = setInterval(() => {
      updateJourney(s);
      s++;
      if (s > 6) clearInterval(interval);
    }, 1000);
  });

  // -------------------------------------------------------------
  // VIEW 13: WAL RECOVERY SIMULATION
  // -------------------------------------------------------------
  const walRamStatus = q<HTMLElement>(consoleEl, '[data-wal-ram-status]');
  const walLog = q<HTMLElement>(consoleEl, '[data-wal-log]');

  q(consoleEl, '[data-wal-action="crash"]')?.addEventListener('click', () => {
    if (walRamStatus) {
      walRamStatus.textContent = 'TERMINATED (0 MB RAM · Process Memory Zeroed)';
      walRamStatus.classList.add('crashed');
    }
    if (walLog) {
      walLog.innerHTML = `<code class="err">[KERNEL PANIC] SIGKILL received. Prometheus process terminated immediately. In-memory Head chunk lost! WAL segments on disk intact.</code>`;
    }
    addEventLog(`[CRASH] Prometheus process killed. WAL remains on disk.`);
  });

  q(consoleEl, '[data-wal-action="restart"]')?.addEventListener('click', () => {
    if (walLog) {
      walLog.innerHTML = `<code>[STARTUP] Reading existing 2-hour blocks from disk...<br/>
[WAL REPLAY] Replaying data/wal/00000124 (128 MB)...<br/>
[WAL REPLAY] Replaying data/wal/00000125 (42 MB)...<br/>
[HEAD RESTORED] Reconstructed 480 active series headers in RAM. Zero data lost!</code>`;
    }
    if (walRamStatus) {
      setTimeout(() => {
        walRamStatus.textContent = 'RESTORED (480 Active Series Rebuilt from WAL)';
        walRamStatus.classList.remove('crashed');
      }, 600);
    }
    addEventLog(`[RECOVERY] WAL replayed successfully. Server state restored.`);
  });

  // -------------------------------------------------------------
  // VIEW 14: STORAGE SIZING CALCULATOR
  // -------------------------------------------------------------
  const calcSeriesInput = q<HTMLInputElement>(consoleEl, '[data-calc-input="series"]');
  const calcIntervalInput = q<HTMLInputElement>(consoleEl, '[data-calc-input="interval"]');
  const calcRetentionInput = q<HTMLInputElement>(consoleEl, '[data-calc-input="retention"]');
  const calcBytesInput = q<HTMLInputElement>(consoleEl, '[data-calc-input="bytes"]');

  const updateCalculator = () => {
    const series = parseInt(calcSeriesInput?.value || '2000000', 10);
    const interval = parseInt(calcIntervalInput?.value || '15', 10);
    const retentionDays = parseInt(calcRetentionInput?.value || '30', 10);
    const bytesPerSample = parseFloat(calcBytesInput?.value || '1.7');

    setText(consoleEl, '[data-calc-series-disp]', series.toLocaleString());
    setText(consoleEl, '[data-calc-interval-disp]', `${interval} seconds`);
    setText(consoleEl, '[data-calc-retention-disp]', `${retentionDays} days`);
    setText(consoleEl, '[data-calc-bytes-disp]', `${bytesPerSample.toFixed(1)} bytes`);

    const samplesPerSec = Math.round(series / interval);
    const retentionSeconds = retentionDays * 86400;
    const totalBytes = samplesPerSec * retentionSeconds * bytesPerSample * 1.3; // 30% compaction buffer
    const totalGb = Math.round(totalBytes / (1024 * 1024 * 1024));

    setText(consoleEl, '[data-calc-samples-sec]', `${samplesPerSec.toLocaleString()} / s`);
    setText(consoleEl, '[data-calc-total-disk]', `${totalGb.toLocaleString()} GB`);
  };

  [calcSeriesInput, calcIntervalInput, calcRetentionInput, calcBytesInput].forEach((inp) => {
    inp?.addEventListener('input', updateCalculator);
  });
  updateCalculator();

  // -------------------------------------------------------------
  // VIEW 15: PROMQL DOJO & QUERY EVALUATOR
  // -------------------------------------------------------------
  const dojoInput = q<HTMLInputElement>(consoleEl, '[data-dojo-query-input]');
  const dojoRunBtn = q<HTMLButtonElement>(consoleEl, '[data-dojo-run]');
  const dojoResultsTable = q<HTMLElement>(consoleEl, '[data-dojo-results] tbody');

  const executeDojoQuery = (queryStr: string) => {
    if (!dojoResultsTable) return;
    const clean = queryStr.trim();

    if (clean.includes('sum by (service)') || clean.includes('by (service)')) {
      dojoResultsTable.innerHTML = `
        <tr><td><code>{service="catalog"}</code></td><td><strong>${(210 * simState.trafficMult).toFixed(2)} req/s</strong></td></tr>
        <tr><td><code>{service="checkout"}</code></td><td><strong>${(140 * simState.trafficMult).toFixed(2)} req/s</strong></td></tr>
        <tr><td><code>{service="payment"}</code></td><td><strong>${(85 * simState.trafficMult).toFixed(2)} req/s</strong></td></tr>
      `;
    } else if (clean.includes('histogram_quantile')) {
      dojoResultsTable.innerHTML = `
        <tr><td><code>{quantile="0.95"}</code></td><td><strong>${(0.085 * simState.latencyMult).toFixed(3)}s (85ms)</strong></td></tr>
      `;
    } else if (clean.includes('5..') || clean.includes('500') || clean.includes('error')) {
      const errRate = (simState.errorRate * 100).toFixed(2);
      dojoResultsTable.innerHTML = `
        <tr><td><code>{metric="5xx_error_percentage"}</code></td><td><strong>${errRate}%</strong></td></tr>
      `;
    } else {
      dojoResultsTable.innerHTML = `
        <tr><td><code>http_requests_total{service="checkout", instance="checkout-1"}</code></td><td><strong>${(46.8 * simState.trafficMult).toFixed(2)} req/s</strong></td></tr>
        <tr><td><code>http_requests_total{service="checkout", instance="checkout-2"}</code></td><td><strong>${(48.2 * simState.trafficMult).toFixed(2)} req/s</strong></td></tr>
        <tr><td><code>http_requests_total{service="checkout", instance="checkout-3"}</code></td><td><strong>${(45.0 * simState.trafficMult).toFixed(2)} req/s</strong></td></tr>
      `;
    }

    addEventLog(`[PROMQL EVAL] Executed: ${clean}`);
  };

  dojoRunBtn?.addEventListener('click', () => {
    executeDojoQuery(dojoInput?.value || '');
  });

  qa<HTMLButtonElement>(consoleEl, '[data-dojo-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const qVal = btn.getAttribute('data-dojo-preset') || '';
      if (dojoInput) dojoInput.value = qVal;
      executeDojoQuery(qVal);
    });
  });

  // -------------------------------------------------------------
  // VIEW 23: CHEATSHEET SEARCH & EXECUTION
  // -------------------------------------------------------------
  const cheatSearch = q<HTMLInputElement>(consoleEl, '[data-cheat-search]');
  cheatSearch?.addEventListener('input', () => {
    const term = cheatSearch.value.toLowerCase();
    qa(consoleEl, '.cheat-card').forEach((card) => {
      const text = card.textContent?.toLowerCase() || '';
      card.style.display = text.includes(term) ? 'block' : 'none';
    });
  });

  qa<HTMLButtonElement>(consoleEl, '[data-run-cheat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const qVal = btn.getAttribute('data-run-cheat') || '';
      const drawerInput = q<HTMLInputElement>(consoleEl, '[data-drawer-query-input]');
      if (drawerInput) drawerInput.value = qVal;
      // Switch drawer to PromQL tab and run
      q<HTMLButtonElement>(consoleEl, '[data-drawer-tab="promql"]')?.click();
      executeDrawerQuery(qVal);
    });
  });

  // -------------------------------------------------------------
  // VIEW 24: PROMQL CHALLENGES RUNNER
  // -------------------------------------------------------------
  const challengeSelect = q<HTMLSelectElement>(consoleEl, '[data-challenge-select]');
  const cTitle = q<HTMLElement>(consoleEl, '[data-c-title]');
  const cScenario = q<HTMLElement>(consoleEl, '[data-c-scenario]');
  const cObjective = q<HTMLElement>(consoleEl, '[data-c-objective]');
  const cInput = q<HTMLInputElement>(consoleEl, '[data-c-input]');
  const cFeedback = q<HTMLElement>(consoleEl, '[data-c-feedback]');
  const cHintsList = q<HTMLElement>(consoleEl, '[data-c-hints-list]');

  const loadChallenge = (challengeId: string) => {
    const c = promChallenges.find((item) => item.id === challengeId) || promChallenges[0];
    if (cTitle) cTitle.textContent = c.title;
    if (cScenario) cScenario.textContent = c.scenario;
    if (cObjective) cObjective.textContent = c.objective;
    if (cInput) cInput.value = c.starterQuery;
    if (cFeedback) {
      cFeedback.innerHTML = '<span>Awaiting query submission...</span>';
      cFeedback.className = 'c-feedback-box';
    }
    if (cHintsList) {
      cHintsList.innerHTML = c.hints.map((h) => `<li>${h}</li>`).join('');
    }
  };

  challengeSelect?.addEventListener('change', () => {
    loadChallenge(challengeSelect.value);
  });

  q(consoleEl, '[data-c-submit]')?.addEventListener('click', () => {
    const currentId = challengeSelect?.value || promChallenges[0].id;
    const c = promChallenges.find((item) => item.id === currentId) || promChallenges[0];
    const userQ = (cInput?.value || '').trim();

    // Check required keywords
    const missingKeyword = c.requiredKeywords.find((kw) => !userQ.includes(kw));

    if (missingKeyword) {
      if (cFeedback) {
        cFeedback.innerHTML = `<strong>INCOMPLETE QUERY:</strong> Missing required operator or concept: <code>${missingKeyword}</code>. Check the objective carefully.`;
        cFeedback.className = 'c-feedback-box warn';
      }
      return;
    }

    if (cFeedback) {
      cFeedback.innerHTML = `<strong>CHALLENGE PASSED! &check;</strong> ${c.explanation}`;
      cFeedback.className = 'c-feedback-box pass';
    }
    addEventLog(`[CHALLENGE] Passed Level ${c.level}: ${c.title}`);
  });

  // -------------------------------------------------------------
  // VIEW 26: ALERT RULE STATE MACHINE SIMULATOR
  // -------------------------------------------------------------
  let pendingTimer = 0;
  let pendingInterval: ReturnType<typeof setInterval> | null = null;

  qa<HTMLButtonElement>(consoleEl, '[data-trigger-error]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const err = parseFloat(btn.getAttribute('data-trigger-error') || '0.01');
      simState.errorRate = err;

      const inactiveNode = q(consoleEl, '[data-alert-state-node="inactive"]');
      const pendingNode = q(consoleEl, '[data-alert-state-node="pending"]');
      const firingNode = q(consoleEl, '[data-alert-state-node="firing"]');
      const timerEl = q(consoleEl, '[data-alert-pending-timer]');

      if (err > 0.05) {
        // Trigger Pending state
        inactiveNode?.classList.remove('is-active');
        pendingNode?.classList.add('is-active');
        firingNode?.classList.remove('is-active');

        if (pendingInterval) clearInterval(pendingInterval);
        pendingTimer = 0;
        pendingInterval = setInterval(() => {
          pendingTimer += 15;
          const min = String(Math.floor(pendingTimer / 60)).padStart(2, '0');
          const sec = String(pendingTimer % 60).padStart(2, '0');
          if (timerEl) timerEl.textContent = `${min}:${sec} / 05:00`;

          if (pendingTimer >= 300) {
            // Transition to FIRING
            if (pendingInterval) clearInterval(pendingInterval);
            pendingNode?.classList.remove('is-active');
            firingNode?.classList.add('is-active');
            setText(consoleEl, '[data-alert-state]', '1 FIRING');
            addEventLog(`[ALERT FIRING] HighErrorRate: Error ratio > 0.05 for 5m. Dispatched to Alertmanager!`);
          }
        }, 300);
      } else {
        // Reset to Inactive
        if (pendingInterval) clearInterval(pendingInterval);
        inactiveNode?.classList.add('is-active');
        pendingNode?.classList.remove('is-active');
        firingNode?.classList.remove('is-active');
        if (timerEl) timerEl.textContent = '00:00 / 05:00';
        setText(consoleEl, '[data-alert-state]', '0 Firing');
      }
    });
  });

  // -------------------------------------------------------------
  // VIEW 31: REMOTE WRITE SIMULATOR
  // -------------------------------------------------------------
  qa<HTMLButtonElement>(consoleEl, '[data-rw-sim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-rw-sim');
      const depthEl = q(consoleEl, '[data-rw-depth]');
      const shardsEl = q(consoleEl, '[data-rw-shards]');

      if (mode === 'lag') {
        if (depthEl) depthEl.textContent = '284,000 SAMPLES (BACKLOG)';
        if (shardsEl) shardsEl.textContent = '32 Shards (Auto-scaled Max)';
        addEventLog(`[REMOTE WRITE] Remote endpoint response time > 1,400ms. Queue backlog building. Shards scaled to 32.`);
      } else {
        if (depthEl) depthEl.textContent = '120 SAMPLES';
        if (shardsEl) shardsEl.textContent = '4 Shards';
        addEventLog(`[REMOTE WRITE] Queue flushed. Backlog drained to normal 120 samples.`);
      }
    });
  });

  // -------------------------------------------------------------
  // VIEW 7: SERVICE DISCOVERY TABS
  // -------------------------------------------------------------
  qa<HTMLButtonElement>(consoleEl, '[data-sd-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-sd-mode') || 'k8s';
      qa<HTMLButtonElement>(consoleEl, '[data-sd-mode]').forEach((b) => b.classList.toggle('is-active', b === btn));
      const yamlEl = q<HTMLElement>(consoleEl, '[data-sd-yaml]');
      const tableEl = q<HTMLElement>(consoleEl, '[data-sd-table]');

      if (mode === 'k8s') {
        if (yamlEl) {
          yamlEl.textContent = `scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: ['prod']
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true`;
        }
        if (tableEl) {
          const tbody = tableEl.querySelector('tbody');
          if (tbody) {
            tbody.innerHTML = `
              <tr><td><code>10.244.1.12:8080</code></td><td>prod</td><td>checkout-7d9c89f</td><td><span class="status-badge up">KEEP</span></td></tr>
              <tr><td><code>10.244.2.33:8080</code></td><td>prod</td><td>catalog-5f6b21c</td><td><span class="status-badge up">KEEP</span></td></tr>
              <tr><td><code>10.244.3.44:9100</code></td><td>kube-system</td><td>coredns-8594b</td><td><span class="status-badge drop">DROP</span></td></tr>
            `;
          }
        }
      } else if (mode === 'static') {
        if (yamlEl) {
          yamlEl.textContent = `scrape_configs:
  - job_name: 'infra-static'
    static_configs:
      - targets: ['10.0.1.5:9100', '10.0.1.6:9100']
        labels:
          env: 'production'
          tier: 'database'`;
        }
        if (tableEl) {
          const tbody = tableEl.querySelector('tbody');
          if (tbody) {
            tbody.innerHTML = `
              <tr><td><code>10.0.1.5:9100</code></td><td>infra</td><td>postgres-primary</td><td><span class="status-badge up">KEEP</span></td></tr>
              <tr><td><code>10.0.1.6:9100</code></td><td>infra</td><td>redis-cache</td><td><span class="status-badge up">KEEP</span></td></tr>
            `;
          }
        }
      } else if (mode === 'ec2') {
        if (yamlEl) {
          yamlEl.textContent = `scrape_configs:
  - job_name: 'aws-ec2'
    ec2_sd_configs:
      - region: us-east-1
        port: 9100
        filters:
          - name: "tag:Environment"
            values: ["production"]`;
        }
        if (tableEl) {
          const tbody = tableEl.querySelector('tbody');
          if (tbody) {
            tbody.innerHTML = `
              <tr><td><code>172.31.12.8:9100</code></td><td>us-east-1a</td><td>i-0abcd1234ef (checkout-asg)</td><td><span class="status-badge up">KEEP</span></td></tr>
              <tr><td><code>172.31.28.14:9100</code></td><td>us-east-1b</td><td>i-0efgh5678ij (payment-asg)</td><td><span class="status-badge up">KEEP</span></td></tr>
            `;
          }
        }
      } else if (mode === 'consul') {
        if (yamlEl) {
          yamlEl.textContent = `scrape_configs:
  - job_name: 'consul-services'
    consul_sd_configs:
      - server: 'consul.internal:8500'
        services: ['api-gateway', 'auth-service']`;
        }
        if (tableEl) {
          const tbody = tableEl.querySelector('tbody');
          if (tbody) {
            tbody.innerHTML = `
              <tr><td><code>192.168.1.10:443</code></td><td>dc1</td><td>api-gateway</td><td><span class="status-badge up">KEEP</span></td></tr>
              <tr><td><code>192.168.1.11:8080</code></td><td>dc1</td><td>auth-service</td><td><span class="status-badge up">KEEP</span></td></tr>
            `;
          }
        }
      } else if (mode === 'dns') {
        if (yamlEl) {
          yamlEl.textContent = `scrape_configs:
  - job_name: 'dns-srv'
    dns_sd_configs:
      - names: ['_prometheus._tcp.internal.acme.shop']
        type: 'SRV'`;
        }
        if (tableEl) {
          const tbody = tableEl.querySelector('tbody');
          if (tbody) {
            tbody.innerHTML = `
              <tr><td><code>10.0.50.2:9090</code></td><td>dns-zone</td><td>srv-prom-1</td><td><span class="status-badge up">KEEP</span></td></tr>
              <tr><td><code>10.0.50.3:9090</code></td><td>dns-zone</td><td>srv-prom-2</td><td><span class="status-badge up">KEEP</span></td></tr>
            `;
          }
        }
      }
    });
  });

  // -------------------------------------------------------------
  // VIEW 10: TARGET INSPECTOR FILTERS
  // -------------------------------------------------------------
  qa<HTMLElement>(consoleEl, '[data-target-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.getAttribute('data-target-filter') || 'all';
      qa<HTMLElement>(consoleEl, '[data-target-filter]').forEach((c) => c.classList.toggle('active', c === chip));
      const rows = qa<HTMLElement>(consoleEl, '.targets-list-view .target-row');
      rows.forEach((row) => {
        const state = row.getAttribute('data-state');
        if (filter === 'all') {
          row.style.display = 'flex';
        } else if (filter === 'up') {
          row.style.display = state === 'up' ? 'flex' : 'none';
        } else if (filter === 'down') {
          row.style.display = state === 'down' ? 'flex' : 'none';
        }
      });
    });
  });

  // -------------------------------------------------------------
  // VIEW 16: SELECTORS & MATCHERS TABS
  // -------------------------------------------------------------
  qa<HTMLButtonElement>(consoleEl, '[data-matcher-type]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-matcher-type') || 'exact';
      qa<HTMLButtonElement>(consoleEl, '[data-matcher-type]').forEach((t) => t.classList.toggle('is-active', t === tab));
      const codeEl = q<HTMLElement>(consoleEl, '[data-matcher-code]');
      const noteEl = q<HTMLElement>(consoleEl, '[data-matcher-note]');
      const gridEl = q<HTMLElement>(consoleEl, '.matcher-series-grid');

      if (type === 'exact') {
        if (codeEl) codeEl.textContent = 'http_requests_total{service="checkout"}';
        if (noteEl) noteEl.textContent = 'Exact equality match: matches only series with label service exactly equal to "checkout".';
        if (gridEl) {
          gridEl.innerHTML = `
            <div class="series-card matched">
              <span class="match-badge pass">MATCHED</span>
              <code>{service="checkout", status="200"}</code>
              <small>service is exactly checkout</small>
            </div>
            <div class="series-card matched">
              <span class="match-badge pass">MATCHED</span>
              <code>{service="checkout", status="500"}</code>
              <small>service is exactly checkout</small>
            </div>
            <div class="series-card rejected">
              <span class="match-badge fail">REJECTED</span>
              <code>{service="catalog", status="200"}</code>
              <small>service is catalog != checkout</small>
            </div>
          `;
        }
      } else if (type === 'neg') {
        if (codeEl) codeEl.textContent = 'http_requests_total{status!="200"}';
        if (noteEl) noteEl.textContent = 'Negative equality match: selects all series where status is not "200", including 4xx, 5xx, or unset.';
        if (gridEl) {
          gridEl.innerHTML = `
            <div class="series-card matched">
              <span class="match-badge pass">MATCHED</span>
              <code>{service="checkout", status="500"}</code>
              <small>status is 500 != 200</small>
            </div>
            <div class="series-card matched">
              <span class="match-badge pass">MATCHED</span>
              <code>{service="checkout", status="404"}</code>
              <small>status is 404 != 200</small>
            </div>
            <div class="series-card rejected">
              <span class="match-badge fail">REJECTED</span>
              <code>{service="checkout", status="200"}</code>
              <small>status is 200 (excluded)</small>
            </div>
          `;
        }
      } else if (type === 'regex') {
        if (codeEl) codeEl.textContent = 'http_requests_total{status=~"5.."}';
        if (noteEl) noteEl.textContent = 'Google RE2 regex match. Fully anchored (^ and $) implicitly. Matches status codes starting with 5 (500, 502, 503, 504).';
        if (gridEl) {
          gridEl.innerHTML = `
            <div class="series-card matched">
              <span class="match-badge pass">MATCHED</span>
              <code>{service="checkout", status="500"}</code>
              <small>Status starts with 5</small>
            </div>
            <div class="series-card matched">
              <span class="match-badge pass">MATCHED</span>
              <code>{service="checkout", status="503"}</code>
              <small>Status starts with 5</small>
            </div>
            <div class="series-card rejected">
              <span class="match-badge fail">REJECTED</span>
              <code>{service="checkout", status="200"}</code>
              <small>Does not match RE2 5..</small>
            </div>
          `;
        }
      } else if (type === 'nregex') {
        if (codeEl) codeEl.textContent = 'http_requests_total{service!~"api-.*"}';
        if (noteEl) noteEl.textContent = 'Negative RE2 regex match: excludes all service labels beginning with "api-".';
        if (gridEl) {
          gridEl.innerHTML = `
            <div class="series-card matched">
              <span class="match-badge pass">MATCHED</span>
              <code>{service="checkout", status="200"}</code>
              <small>Does not begin with api-</small>
            </div>
            <div class="series-card matched">
              <span class="match-badge pass">MATCHED</span>
              <code>{service="payment", status="200"}</code>
              <small>Does not begin with api-</small>
            </div>
            <div class="series-card rejected">
              <span class="match-badge fail">REJECTED</span>
              <code>{service="api-gateway", status="200"}</code>
              <small>Matches regex api-.* (rejected)</small>
            </div>
          `;
        }
      }
    });
  });

  // -------------------------------------------------------------
  // VIEW 19: AGGREGATION MODIFIERS
  // -------------------------------------------------------------
  qa<HTMLButtonElement>(consoleEl, '[data-agg-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-agg-mode') || 'by';
      qa<HTMLButtonElement>(consoleEl, '[data-agg-mode]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.classList.toggle('secondary', b !== btn);
      });
      const outputEl = q<HTMLElement>(consoleEl, '[data-agg-output]');
      if (!outputEl) return;

      if (mode === 'by') {
        outputEl.innerHTML = `
          <div class="agg-series-pill final"><code>{service="catalog"}</code> <strong>210/s</strong></div>
          <div class="agg-series-pill final"><code>{service="checkout"}</code> <strong>97/s</strong></div>
          <div class="agg-series-pill final"><code>{service="payment"}</code> <strong>85/s</strong></div>
        `;
      } else {
        outputEl.innerHTML = `
          <div class="agg-series-pill final"><code>{service="catalog", status="200"}</code> <strong>210/s</strong></div>
          <div class="agg-series-pill final"><code>{service="checkout", status="200"}</code> <strong>93/s</strong></div>
          <div class="agg-series-pill final"><code>{service="checkout", status="500"}</code> <strong>4/s</strong></div>
          <div class="agg-series-pill final"><code>{service="payment", status="200"}</code> <strong>85/s</strong></div>
        `;
      }
    });
  });

  // -------------------------------------------------------------
  // VIEW 27: ALERTMANAGER ROUTING SIMULATION
  // -------------------------------------------------------------
  qa<HTMLButtonElement>(consoleEl, '[data-sim-route]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-sim-route');
      const rootNode = q(consoleEl, '#am-root');
      const critBranch = q(consoleEl, '#branch-critical');
      const warnBranch = q(consoleEl, '#branch-warning');
      const leafPayment = q(consoleEl, '#leaf-payment');
      const leafSlack = q(consoleEl, '#leaf-slack');

      // Reset active classes
      qa(consoleEl, '.tree-node').forEach((n) => n.classList.remove('active'));
      rootNode?.classList.add('active');

      if (route === 'payment-critical') {
        critBranch?.querySelector('.sub-node')?.classList.add('active');
        leafPayment?.classList.add('active');
        addEventLog(`[AM ROUTING] Alert{alertname="PaymentGatewayDown", severity="critical", service="payment"} matched root -> severity=critical -> team=payments -> Dispatched to PagerDuty!`);
      } else if (route === 'general-warn') {
        warnBranch?.querySelector('.slack')?.classList.add('active');
        leafSlack?.classList.add('active');
        addEventLog(`[AM ROUTING] Alert{alertname="HighDiskUsage", severity="warning"} matched root -> severity=warning -> Dispatched to Slack #infra-warns.`);
      }
    });
  });

  // -------------------------------------------------------------
  // VIEW 40: BOSS FIGHT STEPPER (EVENT DELEGATION)
  // -------------------------------------------------------------
  let bossStep = 1;
  const bossWorkspace = q<HTMLElement>(consoleEl, '[data-boss-workspace]');

  bossWorkspace?.addEventListener('click', (e) => {
    const submitBtn = (e.target as HTMLElement)?.closest('[data-boss-submit]');
    if (!submitBtn) return;

    if (bossStep === 1) {
      bossStep = 2;
      const step1 = q(consoleEl, '[data-boss-step="1"]');
      const step2 = q(consoleEl, '[data-boss-step="2"]');
      step1?.classList.remove('active');
      step1?.classList.add('done');
      step2?.classList.add('active');

      if (bossWorkspace) {
        bossWorkspace.innerHTML = `
          <h5>STEP 2: CALCULATE CHECKOUT 5xx ERROR RATIO</h5>
          <p>Divide the rate of 5xx status codes by total checkout request throughput.</p>
          <div class="c-editor-row">
            <input type="text" class="dojo-promql-input" value="sum(rate(http_requests_total{service='checkout',status=~'5..'}[5m])) / sum(rate(http_requests_total{service='checkout'}[5m]))" data-boss-input />
            <button type="button" class="action-btn run-btn" data-boss-submit>EXECUTE STEP</button>
          </div>
          <div class="boss-step-result pass">
            <span>Result: Error ratio is 0.008 (0.8%). Error rates are within nominal budget! The issue is pure latency.</span>
          </div>
        `;
      }
    } else if (bossStep === 2) {
      bossStep = 3;
      const step2 = q(consoleEl, '[data-boss-step="2"]');
      const step3 = q(consoleEl, '[data-boss-step="3"]');
      step2?.classList.remove('active');
      step2?.classList.add('done');
      step3?.classList.add('active');

      if (bossWorkspace) {
        bossWorkspace.innerHTML = `
          <h5>STEP 3: IDENTIFY THE THROTTLED INSTANCE</h5>
          <p>Inspect container CPU throttling rates across checkout pods: <code>rate(container_cpu_usage_seconds_total{service='checkout'}[5m])</code></p>
          <div class="boss-step-result pass">
            <strong>ROOT CAUSE LOCATED! &check;</strong>
            <p><code>checkout-2</code> is pinned at 0.98 CPU cores against a 1.0 core cgroup limit. CPU throttling is causing request queues to back up to 980ms P95 latency.</p>
          </div>
        `;
      }
      addEventLog(`[INCIDENT RESOLVED] Boss fight triage complete: checkout-2 CPU throttling identified as root cause.`);
    }
  });

  // -------------------------------------------------------------
  // BOTTOM CONSOLE DRAWER (PROMQL / TERMINAL / EVENTS)
  // -------------------------------------------------------------
  const drawerTabs = qa<HTMLButtonElement>(consoleEl, '[data-drawer-tab]');
  const drawerContents = qa<HTMLElement>(consoleEl, '[data-drawer-content]');

  drawerTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetContent = tab.getAttribute('data-drawer-tab');
      drawerTabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      drawerContents.forEach((c) => c.classList.toggle('is-active', c.getAttribute('data-drawer-content') === targetContent));
    });
  });

  // Drawer PromQL execution
  const executeDrawerQuery = (qStr: string) => {
    const outBox = q(consoleEl, '[data-drawer-query-output]');
    if (!outBox) return;
    const mult = simState.trafficMult;

    if (qStr.includes('sum by (service)')) {
      outBox.innerHTML = `
        <div class="output-series-item"><code>{service="catalog"}</code><strong>${(210 * mult).toFixed(1)} req/s</strong></div>
        <div class="output-series-item"><code>{service="checkout"}</code><strong>${(140 * mult).toFixed(1)} req/s</strong></div>
        <div class="output-series-item"><code>{service="payment"}</code><strong>${(85 * mult).toFixed(1)} req/s</strong></div>
      `;
    } else {
      outBox.innerHTML = `
        <div class="output-series-item"><code>http_requests_total{service="checkout", instance="checkout-1"}</code><strong>${(46.8 * mult).toFixed(1)} req/s</strong></div>
        <div class="output-series-item"><code>http_requests_total{service="checkout", instance="checkout-2"}</code><strong>${(48.2 * mult).toFixed(1)} req/s</strong></div>
        <div class="output-series-item"><code>http_requests_total{service="checkout", instance="checkout-3"}</code><strong>${(45.0 * mult).toFixed(1)} req/s</strong></div>
      `;
    }
  };

  q(consoleEl, '[data-drawer-query-run]')?.addEventListener('click', () => {
    const inp = q<HTMLInputElement>(consoleEl, '[data-drawer-query-input]');
    executeDrawerQuery(inp?.value || '');
  });

  // Terminal Simulator Commands
  const termInput = q<HTMLInputElement>(consoleEl, '[data-term-input]');
  const termHistory = q<HTMLElement>(consoleEl, '[data-term-history]');

  termInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = termInput.value.trim();
      termInput.value = '';
      if (!termHistory || !cmd) return;

      const line = document.createElement('div');
      line.className = 'term-line user-cmd';
      line.innerHTML = `<span class="term-user">sre@acme-bastion:~$</span> ${cmd}`;
      termHistory.appendChild(line);

      const resp = document.createElement('div');
      resp.className = 'term-line response';

      if (cmd === 'help') {
        resp.innerHTML = `Available diagnostic commands:<br/>
  - <code>curl http://checkout-1:8080/metrics</code><br/>
  - <code>curl http://checkout-3:8080/metrics</code><br/>
  - <code>nc -vz checkout-3 8080</code><br/>
  - <code>promtool check config /etc/prometheus/prometheus.yml</code><br/>
  - <code>promtool check rules /etc/prometheus/rules.yml</code><br/>
  - <code>clear</code>`;
      } else if (cmd === 'clear') {
        termHistory.innerHTML = '';
        return;
      } else if (cmd.includes('checkout-1:8080/metrics')) {
        resp.innerHTML = `# HELP http_requests_total Total requests.<br/>
# TYPE http_requests_total counter<br/>
http_requests_total{method="POST",status="200"} 18340<br/>
http_requests_total{method="POST",status="500"} 81<br/>
# HELP process_resident_memory_bytes Resident memory size in bytes.<br/>
process_resident_memory_bytes 713031680`;
      } else if (cmd.includes('checkout-3:8080/metrics')) {
        resp.innerHTML = `<span class="term-err">curl: (7) Failed to connect to checkout-3 port 8080 after 0 ms: Connection refused</span>`;
      } else if (cmd.includes('nc -vz checkout-3')) {
        resp.innerHTML = `<span class="term-err">nc: connect to checkout-3 (10.244.3.18) port 8080 (tcp) failed: Connection refused</span>`;
      } else if (cmd.includes('promtool check config')) {
        resp.innerHTML = `<span class="term-ok">Checking /etc/prometheus/prometheus.yml<br/>  SUCCESS: 0 errors found. 11 targets discovered.</span>`;
      } else if (cmd.includes('promtool check rules')) {
        resp.innerHTML = `<span class="term-ok">Checking /etc/prometheus/rules.yml<br/>  SUCCESS: 4 rules found in 2 rule groups. Syntax valid.</span>`;
      } else {
        resp.innerHTML = `bash: ${cmd}: command not found. Type <code>help</code> for available diagnostic commands.`;
      }

      termHistory.appendChild(resp);
      termHistory.scrollTop = termHistory.scrollHeight;
    }
  });
}
