export interface PromLab {
  id: string;
  group: PromDomain;
  label: string;
  title: string;
  question: string;
  takeaway: string;
  caveat: string;
  inspector: string;
  sources: string[];
}

export type PromDomain =
  | 'understand'
  | 'collect'
  | 'store'
  | 'query'
  | 'act'
  | 'scale'
  | 'debug';

export const promGroups: { key: PromDomain; label: string; number: string }[] = [
  { key: 'understand', label: '01 UNDERSTAND', number: '01' },
  { key: 'collect', label: '02 COLLECT', number: '02' },
  { key: 'store', label: '03 STORE', number: '03' },
  { key: 'query', label: '04 QUERY', number: '04' },
  { key: 'act', label: '05 ACT', number: '05' },
  { key: 'scale', label: '06 SCALE', number: '06' },
  { key: 'debug', label: '07 DEBUG', number: '07' },
];

export interface AcmeService {
  id: string;
  name: string;
  instances: string[];
  baseRate: number;
  baseError: number;
  baseLatencyMs: number;
  cpuBase: number;
  memBaseMb: number;
}

export const acmeServices: AcmeService[] = [
  { id: 'frontend', name: 'Frontend Web', instances: ['frontend-1'], baseRate: 340, baseError: 0.008, baseLatencyMs: 45, cpuBase: 0.28, memBaseMb: 320 },
  { id: 'api-gateway', name: 'API Gateway', instances: ['gateway-1', 'gateway-2'], baseRate: 340, baseError: 0.009, baseLatencyMs: 38, cpuBase: 0.35, memBaseMb: 410 },
  { id: 'checkout', name: 'Checkout Service', instances: ['checkout-1', 'checkout-2', 'checkout-3'], baseRate: 140, baseError: 0.012, baseLatencyMs: 85, cpuBase: 0.42, memBaseMb: 680 },
  { id: 'catalog', name: 'Product Catalog', instances: ['catalog-1', 'catalog-2', 'catalog-3'], baseRate: 210, baseError: 0.004, baseLatencyMs: 22, cpuBase: 0.31, memBaseMb: 520 },
  { id: 'payment', name: 'Payment Gateway', instances: ['payment-1', 'payment-2'], baseRate: 85, baseError: 0.015, baseLatencyMs: 120, cpuBase: 0.48, memBaseMb: 490 },
  { id: 'postgres', name: 'PostgreSQL Primary', instances: ['postgres-primary'], baseRate: 450, baseError: 0.001, baseLatencyMs: 8, cpuBase: 0.55, memBaseMb: 1840 },
  { id: 'redis', name: 'Redis Cache Cluster', instances: ['redis-cache'], baseRate: 820, baseError: 0.0005, baseLatencyMs: 2, cpuBase: 0.22, memBaseMb: 760 },
];

export interface SimulationPreset {
  id: string;
  label: string;
  description: string;
  trafficMultiplier: number;
  errorRate: number;
  latencyMultiplier: number;
  checkout3Down: boolean;
  userCardinalityActive: boolean;
}

export const simulationPresets: Record<string, SimulationPreset> = {
  healthy: {
    id: 'healthy',
    label: 'Healthy Normal',
    description: 'Balanced nominal traffic across all 3 nodes and services. Zero target failures.',
    trafficMultiplier: 1.0,
    errorRate: 0.008,
    latencyMultiplier: 1.0,
    checkout3Down: false,
    userCardinalityActive: false,
  },
  traffic_spike: {
    id: 'traffic_spike',
    label: 'Traffic Spike',
    description: 'Flash sale surge 3.8x requests/sec. CPU utilization spikes across gateway & checkout.',
    trafficMultiplier: 3.8,
    errorRate: 0.018,
    latencyMultiplier: 1.4,
    checkout3Down: false,
    userCardinalityActive: false,
  },
  error_spike: {
    id: 'error_spike',
    label: 'Error Rate Spike',
    description: 'Downstream payment gateway degradation causes 19% 500 status codes in checkout.',
    trafficMultiplier: 1.1,
    errorRate: 0.19,
    latencyMultiplier: 2.1,
    checkout3Down: false,
    userCardinalityActive: false,
  },
  latency_incident: {
    id: 'latency_incident',
    label: 'Latency Incident',
    description: 'PostgreSQL connection pool exhaustion leads to 950ms p95 latency on checkout.',
    trafficMultiplier: 0.9,
    errorRate: 0.035,
    latencyMultiplier: 4.5,
    checkout3Down: false,
    userCardinalityActive: false,
  },
  instance_failure: {
    id: 'instance_failure',
    label: 'Target Failure',
    description: 'checkout-3 instance crashes. Scrape manager reports connection refused; up==0.',
    trafficMultiplier: 1.0,
    errorRate: 0.05,
    latencyMultiplier: 1.2,
    checkout3Down: true,
    userCardinalityActive: false,
  },
  cardinality_explosion: {
    id: 'cardinality_explosion',
    label: 'Cardinality Explosion',
    description: 'Developer committed user_id label to http_requests_total; 2.8 million series created.',
    trafficMultiplier: 1.0,
    errorRate: 0.01,
    latencyMultiplier: 1.0,
    checkout3Down: false,
    userCardinalityActive: true,
  },
};

export const promViews: PromLab[] = [
  // 01 UNDERSTAND
  {
    id: 'mental-model',
    group: 'understand',
    label: 'Mental Model & ACME Shop',
    title: 'The Prometheus Mental Model: Pull-Based Telemetry Over ACME Shop',
    question: 'How does Prometheus discover, pull, and transform telemetry without active agent pushing?',
    takeaway: 'Prometheus periodically pulls (scrapes) HTTP endpoints exposed by applications, indexing multidimensional numeric samples into an append-only TSDB queried via PromQL.',
    caveat: 'Prometheus is an operational monitoring system, not an event-logging bus or transactional ledger. It records numeric values over time with millisecond timestamps, not arbitrary text payloads.',
    inspector: 'Explore the ACME Shop architecture. Incoming user traffic flows through API Gateway to Checkout, Catalog, and Payment services. Every 15 seconds, the Prometheus Scrape Manager reaches out over HTTP GET /metrics.',
    sources: [
      'https://prometheus.io/docs/introduction/overview/',
      'https://prometheus.io/docs/concepts/metric_types/'
    ]
  },
  {
    id: 'metric-anatomy',
    group: 'understand',
    label: 'Metric Anatomy & Series',
    title: 'Metric Anatomy: Labels, Series Identity, and Sample Values',
    question: 'What constitutes a unique time series in Prometheus TSDB?',
    takeaway: 'A time series is uniquely identified by the combination of its metric name and full key-value label set: {metric_name, label1=val1, label2=val2}. Adding even one label creates a completely new series.',
    caveat: 'Every distinct combination of label key-value pairs allocates a separate in-memory series header in the TSDB Head chunk. Labels are dimensions, not free-form logging annotations.',
    inspector: 'Inspect the dissected metric: http_requests_total{service="checkout", method="POST", status="500", instance="checkout-2"}. Each piece serves a distinct architectural purpose.',
    sources: [
      'https://prometheus.io/docs/concepts/data_model/',
      'https://prometheus.io/docs/practices/naming/'
    ]
  },
  {
    id: 'metric-types',
    group: 'understand',
    label: 'Metric Types: 4 Core Primitives',
    title: 'Metric Types Laboratory: Counter, Gauge, Histogram, Summary',
    question: 'When must an engineer choose a Counter versus a Gauge, Histogram, or Summary?',
    takeaway: 'Counters only increment (or reset on process restart) and track totals. Gauges can rise and fall to represent current state. Histograms aggregate observations into configurable cumulative buckets. Summaries calculate client-side quantiles.',
    caveat: 'Never calculate rate() on a Gauge—rate() assumes counter reset semantics and will produce nonsensical negative spikes or reset compensation artifacts.',
    inspector: 'Step through the 4 interactive type tabs. Send simulated requests to observe counter monotonically increasing; manipulate gauge connections; see histogram observations accumulate in buckets.',
    sources: [
      'https://prometheus.io/docs/concepts/metric_types/',
      'https://prometheus.io/docs/practices/histograms/'
    ]
  },
  {
    id: 'native-histograms',
    group: 'understand',
    label: 'Classic vs Native Histograms',
    title: 'High-Resolution Latency: Classic Cumulative Buckets vs Native Histograms',
    question: 'Why do classic histograms suffer from bucket boundary estimation errors and cardinality bloat?',
    takeaway: 'Classic histograms store each bucket as an independent time series with an le label (typically 10–20 series per metric). Native histograms store an entire dynamic exponential distribution inside a single TSDB sample.',
    caveat: 'Native histograms are stable in Prometheus 3.8+, but your client library and remote write endpoints must explicitly support sparse exponential histogram schemas (e.g. scrape_native_histograms: true).',
    inspector: 'Compare the memory and series footprint: 15 separate series for classic buckets vs 1 native histogram series capturing higher dynamic resolution without manual bucket boundary guesswork.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/feature_flags/#native-histograms',
      'https://prometheus.io/docs/specs/native_histograms/'
    ]
  },
  {
    id: 'cardinality',
    group: 'understand',
    label: 'Cardinality Explorer',
    title: 'Cardinality Multiplier: The Physics of TSDB Head Memory Exhaustion',
    question: 'How does an innocent label like user_id cause Prometheus to OOM within minutes?',
    takeaway: 'Total series count is the Cartesian product of all distinct label values across every monitored target. Unbounded labels (UUIDs, user IDs, raw URLs) explode memory exponentially.',
    caveat: 'Each active series consumes ~1.5 KB of RAM in the TSDB Head chunk. Adding a label with 100,000 values multiplies existing series by 100,000, quickly consuming 15–30 GB of RAM.',
    inspector: 'Adjust label values in the Cardinality Matrix below. Watch 480 series explode to 2.8 million series when user_id is enabled, triggering the TSDB OOM boundary alarm.',
    sources: [
      'https://prometheus.io/docs/practices/naming/#labels',
      'https://prometheus.io/docs/prometheus/latest/storage/#head-truncation'
    ]
  },

  // 02 COLLECT
  {
    id: 'scrape-journey',
    group: 'collect',
    label: 'Scrape Lifecycle Pipeline',
    title: 'The Scrape Journey: From Service Discovery to TSDB Ingestion',
    question: 'What exact stages does a scrape request undergo from discovery to memory storage?',
    takeaway: 'The scrape loop moves through: Discovery -> Target Relabeling -> HTTP GET /metrics -> Protocol Parsing -> Metric Relabeling -> TSDB Appender -> WAL + Head chunk.',
    caveat: 'Scrapes occur strictly on the configured scrape_interval timer. If a scrape takes longer than scrape_timeout, the scrape is aborted, the sample is marked stale, and up evaluates to 0.',
    inspector: 'Follow the glowing scrape packet as it advances through each stage of the 7-step collection pipeline. Notice how target relabeling happens before the scrape, while metric relabeling happens after.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#scrape_config',
      'https://prometheus.io/docs/concepts/jobs_instances/'
    ]
  },
  {
    id: 'service-discovery',
    group: 'collect',
    label: 'Service Discovery Modes',
    title: 'Service Discovery: Static, DNS, Kubernetes, EC2, Consul, and File SD',
    question: 'How does Prometheus know which IP addresses and ports to monitor in dynamic cloud environments?',
    takeaway: 'Prometheus queries platform APIs (Kubernetes API, AWS EC2, Consul, DNS SRV) to stream target metadata prefixed with __meta_*, which relabeling then transforms into operational labels.',
    caveat: 'Prometheus never listens for targets to register themselves; it continuously polls discovery providers to maintain an in-memory target pool, maintaining pull architecture sovereignty.',
    inspector: 'Toggle discovery mechanisms. In Kubernetes mode, see pods labeled with __meta_kubernetes_pod_name, __meta_kubernetes_namespace, and __address__ discovered automatically.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config',
      'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#file_sd_config'
    ]
  },
  {
    id: 'relabeling',
    group: 'collect',
    label: 'Relabeling Laboratory',
    title: 'Relabeling Laboratory: The Rule Engine Powering Target Metadata Transformation',
    question: 'How do source_labels, regex, action, and target_label rewrite dimensions on the fly?',
    takeaway: 'Relabeling is a sequential filter pipeline applied to target metadata (before scrape) or scraped samples (after scrape). Actions include replace, keep, drop, labelmap, labeldrop, and hashmod.',
    caveat: 'A failed keep or matched drop rule discards the entire target or sample silently. Always test relabel regexes with promtool or this interactive visual laboratory before applying to production.',
    inspector: 'Test live relabel configs against ACME Shop discovered pod labels. Watch __meta_kubernetes_pod_name get rewritten into pod="checkout-7d9c" and private __meta_* labels automatically stripped.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#relabel_config'
    ]
  },
  {
    id: 'target-vs-metric-relabel',
    group: 'collect',
    label: 'Target vs Metric Relabeling',
    title: 'Target Relabeling vs Metric Relabeling: Architectural Timing and Scope',
    question: 'What is the critical operational difference between relabel_configs and metric_relabel_configs?',
    takeaway: 'Target relabeling (relabel_configs) executes BEFORE the HTTP scrape to determine WHICH targets exist and their target-level labels. Metric relabeling (metric_relabel_configs) executes AFTER HTTP parsing to filter or drop specific metric samples before TSDB ingestion.',
    caveat: 'Dropping a high-cardinality metric in metric_relabel_configs saves TSDB storage and RAM, but does NOT reduce network bandwidth or exporter CPU because the metric is still scraped across the wire.',
    inspector: 'Side-by-side execution trace: 10,000 metrics scraped over HTTP GET, then metric_relabel_configs applies regex action: drop on debug_.*, ingesting only 6,800 production metrics into TSDB.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#scrape_config'
    ]
  },
  {
    id: 'target-inspector',
    group: 'collect',
    label: 'Target Inspector & Health',
    title: 'Prometheus Target Inspector: Health Checks, Scrape Latency, and Synthetic "up" Metric',
    question: 'How does Prometheus record target availability and scrape duration?',
    takeaway: 'On every scrape, Prometheus appends two synthetic metrics: up{job="...", instance="..."} (1 for success, 0 for failure) and scrape_duration_seconds (time taken to complete HTTP scrape).',
    caveat: 'When a target goes down, Prometheus does not erase its historical data. It appends up=0 and a stale NaN marker to indicate the series has ceased publishing.',
    inspector: 'Review the live ACME Shop target table. Inspect checkout-1 (healthy 18ms scrape) vs checkout-3 (connection refused, up=0, last scrape error shown).',
    sources: [
      'https://prometheus.io/docs/concepts/jobs_instances/#automatically-generated-labels-and-time-series'
    ]
  },

  // 03 STORE
  {
    id: 'tsdb-internals',
    group: 'store',
    label: 'TSDB Internals & Memory Layout',
    title: 'TSDB Internals: Head, WAL, Chunks, and Inverted Index Architecture',
    question: 'Where do samples live in memory before they are written to durable on-disk blocks?',
    takeaway: 'New samples are appended concurrently to the Write-Ahead Log (WAL) on disk and the in-memory Head chunk. Once Head chunks fill (~120 samples), they are cut to mmap-backed chunks, and every 2 hours flushed to immutable blocks.',
    caveat: 'Head chunks reside in process memory. If Prometheus crashes, uncompacted Head chunks are lost from RAM and must be reconstructed by replaying WAL log segments on restart.',
    inspector: 'Trace a new sample entering Prometheus: split writes to disk WAL and in-memory Head. Examine the on-disk folder structure: data/wal, data/chunks_head, and 2-hour immutable block directories.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/storage/',
      'https://ganeshvernekar.com/blog/prometheus-tsdb-the-head-chunk/'
    ]
  },
  {
    id: 'tsdb-timeline',
    group: 'store',
    label: 'TSDB Timeline & Compaction',
    title: 'TSDB Time Horizon: 2-Hour Blocks, Compaction Waves, and Retention Windows',
    question: 'How does Prometheus prevent disk fragmentation across weeks of continuous metric collection?',
    takeaway: 'Prometheus writes immutable 2-hour blocks consisting of chunks, index, meta.json, and tombstones. A background compaction loop merges adjacent 2h blocks into larger 6h, 18h, and 54h blocks, removing soft-deleted tombstones.',
    caveat: 'Compaction creates temporary duplicate blocks during merges, requiring up to 30% additional scratch disk headroom. Never run Prometheus on a disk with >85% baseline utilization.',
    inspector: 'Observe the 24-hour time horizon. Watch the Head chunk transition into 2h immutable blocks, followed by the background compactor merging them into higher-level historical blocks.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/storage/#compaction'
    ]
  },
  {
    id: 'wal-recovery',
    group: 'store',
    label: 'WAL Crash Recovery Simulation',
    title: 'Crash Recovery Simulation: How the Write-Ahead Log Prevents Telemetry Loss',
    question: 'What happens when Prometheus is killed with SIGKILL or suffers host power loss?',
    takeaway: 'The WAL records every append operation in durable 128 MB disk segments. On startup, Prometheus iterates through existing immutable blocks, replays WAL segments since the last checkpoint, and reconstructs the active Head state.',
    caveat: 'Corrupted WAL segments from sudden disk power failures can stall Prometheus boot. Modern Prometheus can auto-repair minor corruptions, but catastrophic storage failure requires manual promtool recovery.',
    inspector: 'Click [Crash Prometheus] to simulate kernel panic. Notice Head memory zeroed out while WAL remains on disk. Click [Restart Prometheus] to watch WAL replay step-by-step.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/storage/#crash-recovery'
    ]
  },
  {
    id: 'storage-calculator',
    group: 'store',
    label: 'Storage Capacity Simulator',
    title: 'Storage Sizing Calculator: Gorilla Chunk Compression & Disk Planning',
    question: 'How do you accurately estimate disk requirements for 2 million active series?',
    takeaway: 'Prometheus utilizes Gorilla double-delta timestamp and XOR value compression, averaging 1.3 to 2.0 bytes per stored sample: Disk = Retention(sec) x ScrapeRate(samples/sec) x 1.7 bytes + CompactionBuffer(30%).',
    caveat: 'High churn (frequent pod restarts, short-lived jobs) degrades compression efficiency toward 3+ bytes/sample due to repeated series header postings in the inverted index.',
    inspector: 'Adjust sliders for Active Series (2M), Scrape Interval (15s), and Retention Days (30d). Review the estimated storage footprint broken into TSDB blocks, WAL buffer, and compaction headroom.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/storage/#operational-aspects'
    ]
  },

  // 04 QUERY
  {
    id: 'promql-dojo',
    group: 'query',
    label: 'PromQL Dojo & Query Pipeline',
    title: 'The PromQL Dojo: Interactive Query Engine & Visual Transformation Pipeline',
    question: 'How does PromQL evaluate an expression from raw time series down to a final graph or table?',
    takeaway: 'PromQL evaluates queries as a pipelined dataflow: Label Filtering -> Range Vector Windowing -> Mathematical Transformation (rate/increase) -> Grouped Aggregation (sum/avg) -> Result Vector.',
    caveat: 'PromQL does not return arbitrary table schemas. Every expression evaluates to one of four fundamental types: Instant vector, Range vector, Scalar, or String.',
    inspector: 'Enter any query or choose a preset. The visual pipeline below details how 240 series from ACME Shop are filtered to 32 checkout series, transformed by rate(), and aggregated to 3 service rows.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/basics/',
      'https://prometheus.io/docs/prometheus/latest/querying/operators/'
    ]
  },
  {
    id: 'selectors-matchers',
    group: 'query',
    label: 'Selectors & Matchers',
    title: 'Selectors and Matchers: Querying Series via Equality and RE2 Regex Filters',
    question: 'How do equality and regular expression label matchers narrow down time series?',
    takeaway: 'PromQL supports four matchers: = (exact match), != (not equal), =~ (regex match), and !~ (regex not match). Regexes use Google RE2 syntax and are fully anchored by default (^ and $ are implicit).',
    caveat: 'Unconstrained label matchers like {status=~".*"} force Prometheus to scan millions of postings lists in the index. Always supply at least one high-selectivity metric or label matcher.',
    inspector: 'Try live matchers: http_requests_total{status=~"5.."}. Watch Prometheus evaluate postings lists to return only 500, 502, 503, and 504 series across checkout and payment.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/basics/#instant-vector-selectors'
    ]
  },
  {
    id: 'range-vectors',
    group: 'query',
    label: 'Range Vectors & Time Modifiers',
    title: 'Range Vectors vs Instant Vectors: Lookback Windows, offset, and Subqueries',
    question: 'Why cannot you graph a range vector directly in Grafana?',
    takeaway: 'An Instant Vector contains a single sample per series at evaluation time. A Range Vector (e.g. [5m]) contains a matrix of samples over a lookback duration, designed as input to functions like rate() or avg_over_time().',
    caveat: 'Graphing engines like Grafana require instant vectors at every step interval. Attempting to plot http_requests_total[5m] directly throws a type error because a graph point cannot plot an array of points.',
    inspector: 'Inspect the timeline visualization: see the 5-minute lookback window capturing multiple 15-second scrape samples, compared against an instant vector evaluation snapshot.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/basics/#range-vector-selectors',
      'https://prometheus.io/docs/prometheus/latest/querying/basics/#offset-modifier'
    ]
  },
  {
    id: 'counter-functions',
    group: 'query',
    label: 'Counter Functions (rate, irate)',
    title: 'Counter Mechanics: rate(), irate(), and Automatic Counter Reset Handling',
    question: 'How does rate() accurately measure requests per second even when an application restarts?',
    takeaway: 'rate() calculates the per-second average rate of increase across a range vector, extrapolating boundaries and automatically detecting when a counter resets (drops to 0) to add the previous value.',
    caveat: 'Never use irate() in alerting rules—irate() only inspects the last two samples and is extremely volatile, causing erratic alert firing on momentary network micro-bursts. Use rate() for alerts.',
    inspector: 'Click [Restart Application] in the counter simulator. Watch the raw counter plummet from 1,200 to 0, while rate(http_requests_total[5m]) cleanly maintains the true 25 req/sec slope.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/functions/#rate',
      'https://prometheus.io/docs/prometheus/latest/querying/functions/#irate'
    ]
  },
  {
    id: 'aggregation',
    group: 'query',
    label: 'Aggregation & Grouping',
    title: 'Aggregation Mechanics: sum, avg, min, max with "by" and "without" Clauses',
    question: 'How do you aggregate across instances without losing essential dimension tags?',
    takeaway: 'Aggregation operators (sum, avg, count, min, max, topk) combine multiple series into fewer series. "by (label...)" preserves only the specified dimensions, while "without (label...)" preserves everything except the excluded labels.',
    caveat: 'Omitting both by and without collapses ALL series into a single dimensionless scalar series: sum(http_requests_total) strips service, instance, and status tags completely.',
    inspector: 'Watch the series grouping animation: 8 individual instance series collapse cleanly into 3 service totals when evaluated under sum by (service) (rate(http_requests_total[5m])).',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/operators/#aggregation-operators'
    ]
  },
  {
    id: 'vector-matching',
    group: 'query',
    label: 'Vector Matching Lab',
    title: 'Vector Matching: One-to-One, Many-to-One, on(), ignoring(), and group_left',
    question: 'How does Prometheus perform mathematical joins between two distinct metric series?',
    takeaway: 'Binary operations (e.g. errors / requests) require matching label sets. Use on(label...) to match on specific keys, ignoring(label...) to exclude mismatching keys, and group_left/group_right for many-to-one joins.',
    caveat: 'In group_left, the "many" side is on the LEFT and the "one" side is on the RIGHT. The left vector provides the resulting series identity while extra labels from the right vector can be copied.',
    inspector: 'Connect matching vectors: error series on left join total request series on right using on(service, instance). Observe how group_left handles 3 checkout instances matching 1 service capacity threshold.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/operators/#vector-matching'
    ]
  },
  {
    id: 'many-to-many',
    group: 'query',
    label: 'Many-to-Many Join Failures',
    title: 'Why Many-to-Many Joins Fail: Visualizing Ambiguous Cardinality in PromQL',
    question: 'Why does PromQL immediately abort with "many-to-many matching not allowed"?',
    takeaway: 'Prometheus requires deterministic arithmetic. If both sides of a binary operation contain duplicate matching label sets, a Cartesian cross-product would occur, which PromQL explicitly forbids.',
    caveat: 'To resolve many-to-many errors, you must either aggregate one side down to unique keys using sum by (...) or identify missing discriminator labels using on(...) or ignoring(...).',
    inspector: 'Observe the 2x2 label matrix: 2 checkout instances with zone=a and zone=b attempting to join 2 checkout instances with version=v1 and version=v2. See the ambiguous cross-connects get rejected.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/operators/#many-to-one-and-one-to-many-vector-matches'
    ]
  },
  {
    id: 'histogram-quantiles',
    group: 'query',
    label: 'Histogram Quantiles (P95/P99)',
    title: 'Calculating Latency SLOs: Inside histogram_quantile() and Linear Interpolation',
    question: 'How does Prometheus mathematically derive P95 latency from cumulative bucket counts?',
    takeaway: 'histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m]))) identifies which cumulative bucket contains the 95th percentile rank and linearly interpolates within that bucket boundary.',
    caveat: 'Histogram quantiles are approximations. If your buckets are too wide (e.g. 0.1s to 10s), linear interpolation assumes an even distribution within the bucket, skewing true percentile accuracy.',
    inspector: 'Step through the 5-stage calculation: Raw latencies -> Cumulative buckets -> rate() per bucket -> sum by (le) -> histogram_quantile(0.95) -> 412ms result.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/functions/#histogram_quantile'
    ]
  },
  {
    id: 'promql-cheatsheet',
    group: 'query',
    label: 'Intent-Based Cheatsheet',
    title: 'Operational PromQL Cheatsheet: Real Queries for Production Engineering',
    question: 'What are the battle-tested PromQL formulas for Traffic, Errors, Latency, Saturation, and K8s?',
    takeaway: 'High-performing SREs organize PromQL by operational intent rather than alphabetical functions: USE method (Utilization, Saturation, Errors) and Google Golden Signals (Latency, Traffic, Errors, Saturation).',
    caveat: 'Copying arbitrary PromQL from internet posts without checking scrape intervals can cause empty graphs. A range window [1m] with a 1m scrape interval fails because rate() requires at least 2 samples.',
    inspector: 'Search and filter 50+ production-grade queries. Click [RUN] to immediately execute any query against the live ACME Shop simulation in the bottom console.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/examples/'
    ]
  },
  {
    id: 'promql-challenges',
    group: 'query',
    label: 'PromQL Practice Engine',
    title: 'PromQL Dojo Practice Engine: 14 Levels of Scenario-Based SRE Challenges',
    question: 'Can you solve realistic production monitoring challenges under live system conditions?',
    takeaway: 'Mastery comes from diagnosing real system scenarios. The practice engine validates semantic query intent against parsed AST rules rather than rigid character matching.',
    caveat: 'Challenges test operational reasoning: distinguishing error ratios from absolute error counts, detecting pod CPU throttling, and calculating multi-dimensional service availability.',
    inspector: 'Select any challenge level from 01 Selectors to 14 Production Incidents. Write your query in the Dojo editor, run validation, and receive contextual hints.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/basics/'
    ]
  },

  // 05 ACT
  {
    id: 'recording-rules',
    group: 'act',
    label: 'Recording Rules Laboratory',
    title: 'Recording Rules: Precomputing Expensive PromQL Expressions Into New Time Series',
    question: 'How do you prevent 50 Grafana dashboards from overloading Prometheus with repeated queries?',
    takeaway: 'Recording rules evaluate complex PromQL expressions on a regular schedule (e.g. every 1m) and save the result as a brand new, highly efficient time series in TSDB.',
    caveat: 'Follow the standard Prometheus naming convention: level:metric:operations (e.g. job:http_requests_total:rate5m). Recording rules run in evaluation groups and consume disk space like scraped series.',
    inspector: 'Compare query latency: 120ms to scan 240 series on every dashboard refresh versus 1.2ms to read the precomputed service:http_requests:rate5m time series.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/'
    ]
  },
  {
    id: 'alert-rules',
    group: 'act',
    label: 'Alert Rule State Machine',
    title: 'Alerting Rules: The Inactive -> Pending -> Firing Lifecycle and the "for" Clause',
    question: 'How does Prometheus prevent transient network blips from paging engineers in the middle of the night?',
    takeaway: 'Alert rules evaluate PromQL boolean expressions. When true, the alert enters PENDING state. Only if the expression remains true continuously for the configured for: duration does it transition to FIRING and notify Alertmanager.',
    caveat: 'If the expression flickers false for even a single evaluation interval, the pending timer resets to 0. Use rate() lookback windows appropriately to smooth noisy thresholds.',
    inspector: 'Trigger an Error Spike simulation. Watch the HighErrorRate alert transition from INACTIVE to PENDING. A timer visibly counts down 5 minutes before firing.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/'
    ]
  },
  {
    id: 'alertmanager-routing',
    group: 'act',
    label: 'Alertmanager Routing Tree',
    title: 'Alertmanager Routing Trees: Hierarchy, Grouping, and Notification Dispatch',
    question: 'How does Alertmanager direct critical payment alerts to PagerDuty while routing warnings to Slack?',
    takeaway: 'Alertmanager processes firing alerts through a hierarchical routing tree. An alert enters at the root route and evaluates child matchers (severity, team, service) until a leaf receiver is selected, with optional continue: true propagation.',
    caveat: 'If an alert does not match any child route, it falls back to the root route default receiver. Always define a sensible catch-all receiver on the root route to avoid silent alert drops.',
    inspector: 'Watch a simulated alert packet traverse the routing tree. Edit labels from team=frontend to team=payments to see the dispatch path redirect from Slack #general to Payment PagerDuty.',
    sources: [
      'https://prometheus.io/docs/alerting/latest/configuration/#route'
    ]
  },
  {
    id: 'alertmanager-concepts',
    group: 'act',
    label: 'Grouping, Silence & Inhibition',
    title: 'Alertmanager Superpowers: Deduplication, Grouping, Active Silences, and Inhibition Rules',
    question: 'How do you prevent 100 alerts from firing when a single underlying Kubernetes node dies?',
    takeaway: 'Inhibition rules automatically mute target alerts when a matching source alert is active (e.g. NodeDown inhibits ContainerCrashLoopBackOff). Grouping aggregates multiple related alerts into a single batch notification.',
    caveat: 'Inhibition rules require matching label equality (e.g. equal: [node, cluster]). If label names differ between exporter and kube-state-metrics, inhibition will fail to match.',
    inspector: 'Simulate a Worker Node Down event. Watch 24 container and pod alerts get inhibited by the single NodeDown alert, reducing 25 notifications to exactly 1 high-signal alert.',
    sources: [
      'https://prometheus.io/docs/alerting/latest/inhibition/',
      'https://prometheus.io/docs/alerting/latest/silences/'
    ]
  },

  // 06 SCALE
  {
    id: 'ha-pairs',
    group: 'scale',
    label: 'High-Availability Pairs',
    title: 'Prometheus High Availability: Independent Parallel Scraping and Alert Deduplication',
    question: 'Why does Prometheus HA avoid active-passive clustering or shared database replication?',
    takeaway: 'Prometheus HA consists of two identical, independent Prometheus servers scraping the exact same targets. Alertmanager handles deduplication of firing alerts received from both instances.',
    caveat: 'Prometheus instances do NOT replicate local TSDB blocks or synchronize WALs. Their graphs may differ slightly due to millisecond jitter in scrape timing.',
    inspector: 'Observe two Prometheus servers (Prom-A and Prom-B) scraping checkout-1 independently. Watch both send identical HighLatency alerts to Alertmanager, which consolidates them into 1 page.',
    sources: [
      'https://prometheus.io/docs/introduction/faq/#can-prometheus-be-made-highly-available'
    ]
  },
  {
    id: 'federation',
    group: 'scale',
    label: 'Prometheus Federation',
    title: 'Federation: Hierarchical Metric Aggregation Across Edge and Global Servers',
    question: 'How does a global Prometheus aggregate summaries from 20 regional data centers without overwhelming network links?',
    takeaway: 'Federation allows a Prometheus server to scrape selected time series from another Prometheus server via the /federate HTTP endpoint using match[] query filters.',
    caveat: 'Never federate raw metrics or unbounded series like http_requests_total directly. Only federate pre-aggregated recording rule summaries (e.g. job:http_requests:rate5m).',
    inspector: 'Inspect the federation topology: Edge Prometheus in US-East, EU-Central, and AP-South scrape local pods, while Global Prometheus scrapes /federate?match[]={job="service-summaries"}.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/federation/'
    ]
  },
  {
    id: 'remote-write',
    group: 'scale',
    label: 'Remote Write & Backlog',
    title: 'Remote Write Architecture: Long-Term Storage, Sharding Queues, and Backlog Management',
    question: 'How does Prometheus ship millions of samples to Thanos, Cortex, M3DB, or VictoriaMetrics?',
    takeaway: 'Remote Write reads samples from the TSDB Head via a memory queue, batches them into Snappy-compressed Protocol Buffer requests, and dispatches them across dynamic concurrent worker shards.',
    caveat: 'If the remote endpoint is slow or unreachable, the in-memory write queue backs up (prometheus_remote_storage_samples_pending). If memory capacity is exceeded, samples are dropped.',
    inspector: 'Simulate remote endpoint latency. Watch the pending samples queue climb from 120 to 284,000, triggering auto-sharding from 4 to 32 shards to recover throughput.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#remote_write',
      'https://prometheus.io/docs/specs/remote_write_spec_2_0/'
    ]
  },
  {
    id: 'agent-mode',
    group: 'scale',
    label: 'Prometheus Agent Mode',
    title: 'Prometheus Agent Mode: Lightweight Forwarding Without Local PromQL or Rule Engines',
    question: 'Why run a dedicated forwarding agent instead of a full Prometheus server at the edge?',
    takeaway: 'Prometheus Agent Mode (--enable-feature=agent) strips out local PromQL querying, alert rule evaluation, and historical block compaction, acting as a streamlined scrape-and-forward proxy with WAL protection.',
    caveat: 'Prometheus Agent cannot serve PromQL queries or trigger local alerts. If your remote storage is down longer than the agent WAL retention, edge data will be lost.',
    inspector: 'Compare memory and binary footprints: Full Prometheus Server (2.8 GB RAM, complete TSDB + PromQL engine) vs Prometheus Agent Mode (310 MB RAM, slim WAL forwarder).',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/feature_flags/#agent'
    ]
  },
  {
    id: 'kubernetes-operator',
    group: 'scale',
    label: 'Kubernetes & Prometheus Operator',
    title: 'Kubernetes Telemetry: The Prometheus Operator Pattern and Declarative CRDs',
    question: 'How do ServiceMonitor, PodMonitor, and PrometheusRule CRDs automate scrape configuration?',
    takeaway: 'The Prometheus Operator watches Kubernetes Custom Resource Definitions (CRDs) and dynamically reconciles the generated prometheus.yml config and rule files without server restarts.',
    caveat: 'A ServiceMonitor selects Kubernetes Services using label selectors, NOT Pods directly. If your Service selector does not match the target Service labels, Prometheus discovers 0 targets.',
    inspector: 'Interactive CRD selector flow: Click the ServiceMonitor selector app: checkout. See it match the checkout Kubernetes Service, which references endpoints, populating Prometheus targets.',
    sources: [
      'https://prometheus-operator.dev/docs/operator/architecture/',
      'https://prometheus-operator.dev/docs/operator/troubleshooting/'
    ]
  },
  {
    id: 'modern-prometheus',
    group: 'scale',
    label: 'Modern Prometheus: OTLP & Tracing',
    title: 'Modern Prometheus: OpenTelemetry (OTLP) Ingestion and Exemplar-Driven Tracing',
    question: 'How do modern SREs jump directly from a 99th percentile metric latency spike into a distributed trace?',
    takeaway: 'Exemplars attach external trace identifiers (trace_id) to specific metric observations. Modern Prometheus can also receive OpenTelemetry metrics directly via the built-in OTLP receiver.',
    caveat: 'Exemplars are stored in a dedicated circular in-memory buffer in the TSDB Head and are not retained long-term in immutable TSDB blocks.',
    inspector: 'Click the P95 latency spike in the graph. Inspect the attached Exemplar carrying trace_id="bd239fa8e71". Click [Jump to Trace] to bridge metrics to OpenTelemetry spans.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/feature_flags/#exemplars-storage',
      'https://prometheus.io/docs/prometheus/latest/feature_flags/#otlp-receiver'
    ]
  },

  // 07 DEBUG
  {
    id: 'incident-target-down',
    group: 'debug',
    label: 'Incident: Target Down',
    title: 'Troubleshooting Target Down: Diagnosing Connection Refused and Scrape Timeouts',
    question: 'What systematic diagnostic steps isolate why checkout-3 is reporting up == 0?',
    takeaway: 'Follow the target triage ladder: 1. Service discovery presence -> 2. Network connectivity (nc/telnet) -> 3. HTTP path & port (/metrics) -> 4. Authentication/TLS -> 5. Exporter crash/hang.',
    caveat: 'A target reporting down does not always mean the application is dead; a slow /metrics handler exceeding scrape_timeout marks the target down even if HTTP traffic succeeds.',
    inspector: 'Open the simulated debugging terminal. Execute curl http://checkout-3:8080/metrics and nc -vz checkout-3 8080. Identify that a container port misconfiguration caused connection refused.',
    sources: [
      'https://prometheus.io/docs/guides/common-problems/#target-down'
    ]
  },
  {
    id: 'incident-cardinality',
    group: 'debug',
    label: 'Incident: High Cardinality Explosion',
    title: 'Troubleshooting Cardinality: Hunting Down Unbounded Labels and Memory Leaks',
    question: 'How do you pinpoint which label caused active series to spike from 200k to 6.9 million?',
    takeaway: 'Query TSDB Head status via prometheus_tsdb_head_series or API /api/v1/status/tsdb to rank series by label cardinality, then apply metric_relabel_configs or deploy an application fix.',
    caveat: 'Increasing container memory limits is a temporary band-aid, not a fix; unbounded labels will eventually exhaust any memory allocation.',
    inspector: 'Analyze the TSDB Head top-cardinality report. Uncover user_id generating 2.8 million unique postings. Deploy a drop relabel rule to instantly arrest memory growth.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/api/#tsdb-status'
    ]
  },
  {
    id: 'incident-slow-query',
    group: 'debug',
    label: 'Incident: Slow PromQL Query',
    title: 'Troubleshooting Slow Queries: Execution Limits, Postings Scanning, and Rule Remedies',
    question: 'Why does sum(rate(http_requests_total[30d])) cause PromQL to time out or max out CPU?',
    takeaway: 'Unconstrained 30-day regex queries force the query engine to load and scan tens of millions of raw chunk samples across dozens of compacted blocks from disk.',
    caveat: 'Set query.timeout and query.max-samples flags in production to prevent rogue ad-hoc dashboard queries from causing Prometheus server denial-of-service.',
    inspector: 'Analyze the slow query trace. Observe 4.2 million series selected. Optimize the dashboard by replacing the raw 30d query with the precomputed recording rule.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/querying/basics/#time-durations'
    ]
  },
  {
    id: 'incident-remote-write',
    group: 'debug',
    label: 'Incident: Remote Write Backlog',
    title: 'Troubleshooting Remote Write: Queue Starvation, Shard Exhaustion, and 429 Rate Limits',
    question: 'What causes prometheus_remote_storage_samples_pending to climb continuously?',
    takeaway: 'Remote Write backlog occurs when ingestion rate exceeds network delivery throughput, commonly triggered by remote endpoint 429 rate-limiting, network throttling, or inadequate max_shards.',
    caveat: 'If the queue reaches capacity and samples are dropped, data cannot be recovered unless the remote endpoint catches up before the Head memory buffer drops them.',
    inspector: 'Investigate remote storage diagnostics. Inspect shard count, retry backoff graphs, and sample backlog. Tune queue_config (max_shards: 50, batch_send_deadline: 5s) to drain the queue.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#remote_write'
    ]
  },
  {
    id: 'incident-alert-storm',
    group: 'debug',
    label: 'Incident: Alert Storm & Inhibition',
    title: 'Troubleshooting Alert Storms: Suppressing Cascading Cascades via Alertmanager Inhibition',
    question: 'How do you stop on-call engineers from receiving 60 separate notifications during a network partition?',
    takeaway: 'Configure Alertmanager inhibit_rules to match common labels between a root failure (e.g. NodeDown or KubeNodeNotReady) and secondary symptoms (PodCrashLooping, HighLatency).',
    caveat: 'Always test inhibition rules in staging. Overly broad source matchers can inadvertently silence unrelated legitimate production alerts.',
    inspector: 'Simulate worker-node-2 failure. Watch 42 cascading pod alerts fire. Enable the NodeDown inhibition rule and observe all 42 child alerts instantly muted.',
    sources: [
      'https://prometheus.io/docs/alerting/latest/inhibition/'
    ]
  },
  {
    id: 'incident-boss-fight',
    group: 'debug',
    label: 'Boss Fight: Live SRE Incident',
    title: 'PromQL Boss Fight: Live Triage of a Multi-Service Checkout SLO Outage',
    question: 'Can you correlate throughput, error ratios, latency, and CPU saturation to locate root cause?',
    takeaway: 'Effective incident response uses the RED method (Rate, Errors, Duration) to isolate the failing component, drill down to the specific instance, and verify system recovery.',
    caveat: 'Do not jump to conclusions based on raw error counts alone; always calculate the error ratio relative to total throughput to avoid false positives during traffic swings.',
    inspector: 'Live incident active at 14:02 UTC! Step through the 7 triage tasks: verify request throughput, measure 500 error percentage, calculate P95 latency, and identify checkout-2 CPU throttling.',
    sources: [
      'https://prometheus.io/docs/practices/rules/'
    ]
  },
  {
    id: 'meta-monitoring',
    group: 'debug',
    label: 'Meta-Monitoring: Who Monitors Prometheus?',
    title: 'Meta-Monitoring: Inside Prometheus Internal Metrics and Self-Observability',
    question: 'How do SREs monitor the health, memory, and scrape performance of Prometheus itself?',
    takeaway: 'Prometheus dogfoods its own data model by scraping itself at /metrics. Key internal metrics include prometheus_tsdb_head_series, prometheus_rule_evaluation_duration_seconds, and scrape_duration_seconds.',
    caveat: 'If Prometheus crashes or deadlocks, it cannot evaluate alerts about its own death. Production infrastructure always uses an external watcher or secondary Prometheus server to meta-monitor.',
    inspector: 'Click on any Prometheus internal metric to trace it directly to the corresponding engine component on the architecture canvas: Head series -> TSDB, scrape duration -> Scrape Manager.',
    sources: [
      'https://prometheus.io/docs/prometheus/latest/monitoring/'
    ]
  }
];

export interface PromChallenge {
  id: string;
  level: number;
  category: string;
  title: string;
  scenario: string;
  objective: string;
  expectedPattern: RegExp;
  requiredKeywords: string[];
  forbiddenKeywords?: string[];
  hints: string[];
  explanation: string;
  starterQuery: string;
}

export const promChallenges: PromChallenge[] = [
  // Level 01: Selectors
  {
    id: 'c-01',
    level: 1,
    category: 'Selectors',
    title: 'Select All Checkout Requests',
    scenario: 'You are investigating traffic reaching the Checkout service.',
    objective: 'Write a selector to query http_requests_total for the "checkout" service.',
    expectedPattern: /^http_requests_total\{service="checkout"\}$/,
    requiredKeywords: ['http_requests_total', 'checkout'],
    hints: ['Specify the metric name followed by label matchers in curly braces {}.', 'Use service="checkout".'],
    explanation: 'http_requests_total{service="checkout"} queries all time series matching that exact metric name and service label.',
    starterQuery: 'http_requests_total',
  },
  {
    id: 'c-02',
    level: 1,
    category: 'Selectors',
    title: 'Check Target Health',
    scenario: 'The team suspect some instances are unreachable.',
    objective: 'Query the synthetic health metric "up" for all targets in job "kubernetes-pods".',
    expectedPattern: /^up\{job="kubernetes-pods"\}$/,
    requiredKeywords: ['up', 'kubernetes-pods'],
    hints: ['The metric name is simply "up".', 'Filter on job="kubernetes-pods".'],
    explanation: 'The up metric is automatically generated by Prometheus for every scraped target (1 for up, 0 for down).',
    starterQuery: 'up',
  },
  {
    id: 'c-03',
    level: 2,
    category: 'Matchers',
    title: 'Find All HTTP 5xx Server Errors',
    scenario: 'API Gateway is reporting an error spike.',
    objective: 'Query http_requests_total where status matches any 5xx code using a regex matcher.',
    expectedPattern: /^http_requests_total\{status=~"5.."\}$/,
    requiredKeywords: ['http_requests_total', '=~', '5..'],
    hints: ['Use the regex matcher =~.', 'Match all three-digit 500 codes with "5..".'],
    explanation: 'In PromQL, status=~"5.." uses Google RE2 regex matching to match status codes 500 through 599.',
    starterQuery: 'http_requests_total{status=~"..."}',
  },
  {
    id: 'c-04',
    level: 2,
    category: 'Matchers',
    title: 'Exclude Staging Environment',
    scenario: 'You only want to observe production infrastructure.',
    objective: 'Select process_resident_memory_bytes where environment is NOT equal to "staging".',
    expectedPattern: /^process_resident_memory_bytes\{environment!="staging"\}$/,
    requiredKeywords: ['process_resident_memory_bytes', '!=', 'staging'],
    hints: ['Use the negative equality operator !=.', 'Filter out environment="staging".'],
    explanation: 'The != operator filters out any series whose label equals the given string while retaining all others.',
    starterQuery: 'process_resident_memory_bytes',
  },
  {
    id: 'c-05',
    level: 3,
    category: 'Range Vectors',
    title: 'Query a 5-Minute Lookback Window',
    scenario: 'You need to supply a time window of raw samples to a rate function.',
    objective: 'Query http_requests_total for service="checkout" across a 5-minute range vector.',
    expectedPattern: /^http_requests_total\{service="checkout"\}\[5m\]$/,
    requiredKeywords: ['http_requests_total', 'checkout', '[5m]'],
    hints: ['Append the range bracket [5m] to the end of the selector.', 'Example: metric{...}[5m].'],
    explanation: 'Appending [5m] transforms an instant vector into a range vector containing an array of samples over the past 5 minutes.',
    starterQuery: 'http_requests_total{service="checkout"}',
  },
  {
    id: 'c-06',
    level: 4,
    category: 'Counters & Rate',
    title: 'Calculate Per-Second Request Rate',
    scenario: 'Traffic is fluctuating. Raw counters only tell you total cumulative requests.',
    objective: 'Calculate the per-second rate of increase of http_requests_total over 5 minutes.',
    expectedPattern: /^rate\(http_requests_total\[5m\]\)$/,
    requiredKeywords: ['rate', 'http_requests_total', '[5m]'],
    hints: ['Wrap the range vector query in rate(...).', 'rate() requires a range vector like [5m].'],
    explanation: 'rate(http_requests_total[5m]) calculates the per-second average rate of increase across the 5m window with counter reset handling.',
    starterQuery: 'http_requests_total[5m]',
  },
  {
    id: 'c-07',
    level: 4,
    category: 'Counters & Rate',
    title: 'Calculate Request Rate for Checkout Only',
    scenario: 'You want per-second throughput for the checkout service specifically.',
    objective: 'Calculate rate over 5 minutes for http_requests_total filtering for service="checkout".',
    expectedPattern: /^rate\(http_requests_total\{service="checkout"\}\[5m\]\)$/,
    requiredKeywords: ['rate', 'http_requests_total', 'checkout', '[5m]'],
    hints: ['Place the label filter inside the metric selector before the range bracket.'],
    explanation: 'Filtering inside the selector rate(http_requests_total{service="checkout"}[5m]) minimizes series scanned by Prometheus.',
    starterQuery: 'rate(http_requests_total[5m])',
  },
  {
    id: 'c-08',
    level: 5,
    category: 'Aggregations',
    title: 'Total System Request Rate',
    scenario: 'Executive leadership wants a single number for total cluster request throughput.',
    objective: 'Sum the per-second request rates across all services into a single scalar value.',
    expectedPattern: /^sum\(rate\(http_requests_total\[5m\]\)\)$/,
    requiredKeywords: ['sum', 'rate', 'http_requests_total', '[5m]'],
    hints: ['Wrap the rate(...) expression with sum(...).', 'Do not include any by or without clauses.'],
    explanation: 'sum() without grouping collapses all matching series into a single overall total.',
    starterQuery: 'rate(http_requests_total[5m])',
  },
  {
    id: 'c-09',
    level: 5,
    category: 'Aggregations',
    title: 'Request Rate Grouped By Service',
    scenario: 'Multiple instances exist for checkout, payment, and catalog. You need one metric per service.',
    objective: 'Calculate the total per-second request rate grouped by service over 5 minutes.',
    expectedPattern: /^sum by \s*\(service\)\s*\(rate\(http_requests_total\[5m\]\)\)$|^sum\(rate\(http_requests_total\[5m\]\)\)\s*by\s*\(service\)$/,
    requiredKeywords: ['sum', 'by', 'service', 'rate', 'http_requests_total', '[5m]'],
    hints: ['Use sum by (service) (...).', 'Remember to wrap the rate() inside the sum.'],
    explanation: 'sum by (service) aggregates all individual instance series into their respective service parent buckets.',
    starterQuery: 'sum(rate(http_requests_total[5m]))',
  },
  {
    id: 'c-10',
    level: 5,
    category: 'Aggregations',
    title: 'Request Rate Excluding Instance (without)',
    scenario: 'You want to preserve all dimensional labels except the ephemeral pod instance name.',
    objective: 'Sum the request rate over 5 minutes while stripping only the "instance" label using without.',
    expectedPattern: /^sum without \s*\(instance\)\s*\(rate\(http_requests_total\[5m\]\)\)$|^sum\(rate\(http_requests_total\[5m\]\)\)\s*without\s*\(instance\)$/,
    requiredKeywords: ['sum', 'without', 'instance', 'rate', 'http_requests_total', '[5m]'],
    hints: ['Use sum without (instance) (...).'],
    explanation: 'without(instance) removes the instance label while preserving service, method, status, and environment.',
    starterQuery: 'sum(rate(http_requests_total[5m]))',
  },
  {
    id: 'c-11',
    level: 6,
    category: 'Gauges',
    title: 'Average Memory Over 30 Minutes',
    scenario: 'Memory usage fluctuates with garbage collection spikes. You need a smoothed baseline.',
    objective: 'Calculate the 30-minute average of process_resident_memory_bytes across time.',
    expectedPattern: /^avg_over_time\(process_resident_memory_bytes\[30m\]\)$/,
    requiredKeywords: ['avg_over_time', 'process_resident_memory_bytes', '[30m]'],
    hints: ['Gauges use _over_time aggregation functions like avg_over_time(...).', 'Provide a [30m] range window.'],
    explanation: 'avg_over_time(process_resident_memory_bytes[30m]) computes the arithmetic mean of all samples in the 30m window.',
    starterQuery: 'process_resident_memory_bytes',
  },
  {
    id: 'c-12',
    level: 7,
    category: 'Histograms',
    title: 'Calculate 95th Percentile Latency',
    scenario: 'Your team committed to an SLO of 95% of requests completing under 500ms.',
    objective: 'Calculate the cluster-wide P95 latency from http_request_duration_seconds_bucket over 5m.',
    expectedPattern: /^histogram_quantile\(0\.95,\s*sum by \s*\(le\)\s*\(rate\(http_request_duration_seconds_bucket\[5m\]\)\)\)$/,
    requiredKeywords: ['histogram_quantile', '0.95', 'sum', 'by', 'le', 'rate', 'http_request_duration_seconds_bucket', '[5m]'],
    hints: ['Use histogram_quantile(0.95, ...).', 'Inside, sum by (le) the rate of http_request_duration_seconds_bucket[5m].'],
    explanation: 'histogram_quantile calculates the 0.95 quantile from cumulative buckets aggregated with sum by (le).',
    starterQuery: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])))',
  },
  {
    id: 'c-13',
    level: 8,
    category: 'Binary Operations',
    title: 'Calculate Error Percentage',
    scenario: 'Raw error counts do not indicate severity without total traffic context.',
    objective: 'Calculate the percentage of 5xx errors: 100 * 5xx rate / total request rate.',
    expectedPattern: /^100\s*\*\s*sum\(rate\(http_requests_total\{status=~"5.."\}\[5m\]\)\)\s*\/\s*sum\(rate\(http_requests_total\[5m\]\)\)$/,
    requiredKeywords: ['100', '*', 'sum', 'rate', '5..', '/', 'http_requests_total'],
    hints: ['Multiply by 100 at the front.', 'Divide sum(rate(5xx)) by sum(rate(total)).'],
    explanation: 'Binary division of aggregated rates normalizes errors into a percentage of total traffic.',
    starterQuery: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))',
  },
  {
    id: 'c-14',
    level: 9,
    category: 'Vector Matching',
    title: 'Match Error Rates by Service',
    scenario: 'Calculate error rates per service where both sides have matching service labels.',
    objective: 'Divide 5xx error rate by total request rate grouped by service using sum by (service).',
    expectedPattern: /^sum by \s*\(service\)\s*\(rate\(http_requests_total\{status=~"5.."\}\[5m\]\)\)\s*\/\s*sum by \s*\(service\)\s*\(rate\(http_requests_total\[5m\]\)\)$/,
    requiredKeywords: ['sum', 'by', 'service', '5..', '/', 'rate', 'http_requests_total'],
    hints: ['Use sum by (service) on BOTH the numerator and denominator so their label dimensions match exactly 1-to-1.'],
    explanation: 'When both sides share identical label sets (service), PromQL performs automatic 1-to-1 vector matching.',
    starterQuery: 'sum by (service)(rate(http_requests_total{status=~"5.."}[5m])) / rate(http_requests_total[5m])',
  },
  {
    id: 'c-15',
    level: 10,
    category: 'Time Modifiers',
    title: 'Compare Traffic Against Yesterday',
    scenario: 'Verify whether today’s traffic surge is abnormal compared to this exact time yesterday.',
    objective: 'Calculate request rate over 5 minutes offset by 1 day.',
    expectedPattern: /^rate\(http_requests_total\[5m\]\s*offset\s*1d\)$/,
    requiredKeywords: ['rate', 'http_requests_total', '[5m]', 'offset', '1d'],
    hints: ['Place "offset 1d" immediately after the range vector bracket [5m].'],
    explanation: 'The offset modifier shifts the evaluation time backward by 1 day while keeping the current query instant.',
    starterQuery: 'rate(http_requests_total[5m])',
  },
  {
    id: 'c-16',
    level: 14,
    category: 'Production Incidents',
    title: 'Boss Fight: Identify the Throttling Instance',
    scenario: 'Checkout service is breaching its P95 SLO. Determine which checkout instance has CPU usage exceeding 0.8 cores.',
    objective: 'Filter container_cpu_usage_seconds_total rate over 5m for service="checkout" where rate > 0.8.',
    expectedPattern: /^rate\(container_cpu_usage_seconds_total\{service="checkout"\}\[5m\]\)\s*>\s*0\.8$/,
    requiredKeywords: ['rate', 'container_cpu_usage_seconds_total', 'checkout', '[5m]', '>', '0.8'],
    hints: ['Calculate rate of container_cpu_usage_seconds_total{service="checkout"}[5m].', 'Filter with > 0.8.'],
    explanation: 'Binary comparison filters the vector, isolating checkout-2 as the CPU-throttled culprit.',
    starterQuery: 'rate(container_cpu_usage_seconds_total{service="checkout"}[5m])',
  }
];

export interface CheatsheetEntry {
  category: string;
  title: string;
  query: string;
  description: string;
}

export const promCheatsheet: CheatsheetEntry[] = [
  // Health
  { category: 'Health', title: 'Find targets currently down', query: 'up == 0', description: 'Lists all targets failing HTTP scrapes with connection refused, DNS error, or timeout.' },
  { category: 'Health', title: 'Target availability percentage', query: 'avg_over_time(up[1h]) * 100', description: 'Calculates the percentage of successful scrapes over the past hour.' },
  { category: 'Health', title: 'Detect missing critical metric', query: 'absent(http_requests_total{service="checkout"})', description: 'Returns a 1-value series if the specified metric has ceased reporting entirely.' },

  // Traffic
  { category: 'Traffic', title: 'Total cluster requests/sec', query: 'sum(rate(http_requests_total[5m]))', description: 'Overall system request volume across all applications.' },
  { category: 'Traffic', title: 'Throughput grouped by service', query: 'sum by (service) (rate(http_requests_total[5m]))', description: 'Collapses instance series to give per-service request rates.' },
  { category: 'Traffic', title: 'Top 5 endpoints by traffic', query: 'topk(5, sum by (endpoint) (rate(http_requests_total[5m])))', description: 'Identifies the heaviest traffic endpoints in the cluster.' },

  // Errors
  { category: 'Errors', title: 'Total 5xx error rate/sec', query: 'sum(rate(http_requests_total{status=~"5.."}[5m]))', description: 'Total rate of internal server errors across all services.' },
  { category: 'Errors', title: 'Cluster 5xx error percentage', query: '100 * sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))', description: 'Calculates the ratio of errors to total requests as a percentage.' },
  { category: 'Errors', title: 'Services breaching 1% error budget', query: '(sum by (service) (rate(http_requests_total{status=~"5.."}[5m])) / sum by (service) (rate(http_requests_total[5m]))) * 100 > 1', description: 'Filters services currently violating an SLO of 99% success rate.' },

  // Latency
  { category: 'Latency', title: 'P95 latency per service', query: 'histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))', description: 'Calculates 95th percentile latency segmented by service.' },
  { category: 'Latency', title: 'P99 latency cluster-wide', query: 'histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))', description: 'Measures high-tail latency across all requests.' },
  { category: 'Latency', title: 'Average request duration', query: 'rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])', description: 'Calculates true mathematical average duration without histogram bucket approximations.' },

  // Resources
  { category: 'Resources', title: 'Container CPU cores used', query: 'sum by (pod) (rate(container_cpu_usage_seconds_total[5m]))', description: 'Real-time CPU core utilization per Kubernetes pod.' },
  { category: 'Resources', title: 'Node memory usage percent', query: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100', description: 'Accurate Linux memory saturation accounting for kernel caches.' },
  { category: 'Resources', title: 'Disk space remaining < 15%', query: '(node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15', description: 'Fires when any mounted filesystem has less than 15% free space.' },

  // Debugging & Time Machine
  { category: 'Debugging', title: 'Compare throughput to 1 week ago', query: 'sum(rate(http_requests_total[5m])) / sum(rate(http_requests_total[5m] offset 1w))', description: 'Ratio of current traffic compared to the identical day and hour last week.' },
  { category: 'Debugging', title: 'TSDB Head active series count', query: 'prometheus_tsdb_head_series', description: 'Internal gauge tracking total time series currently resident in memory.' },
  { category: 'Debugging', title: 'Remote write pending backlog', query: 'prometheus_remote_storage_samples_pending', description: 'Queue depth of samples awaiting dispatch to remote storage.' }
];

export const promSources = [
  { label: 'Prometheus Official Documentation: Overview & Architecture', url: 'https://prometheus.io/docs/introduction/overview/' },
  { label: 'Prometheus Data Model & Time Series Identity', url: 'https://prometheus.io/docs/concepts/data_model/' },
  { label: 'Prometheus Metric Types: Counter, Gauge, Histogram, Summary', url: 'https://prometheus.io/docs/concepts/metric_types/' },
  { label: 'Prometheus Scrape Configuration & Relabeling', url: 'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#relabel_config' },
  { label: 'Prometheus TSDB Storage & In-Memory Head Architecture', url: 'https://prometheus.io/docs/prometheus/latest/storage/' },
  { label: 'PromQL Query Language: Basics, Operators, Functions', url: 'https://prometheus.io/docs/prometheus/latest/querying/basics/' },
  { label: 'Prometheus Recording Rules & Query Precomputation', url: 'https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/' },
  { label: 'Prometheus Alerting Rules & State Evaluation', url: 'https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/' },
  { label: 'Alertmanager Configuration: Routing, Silences, and Inhibition', url: 'https://prometheus.io/docs/alerting/latest/configuration/' },
  { label: 'Prometheus Operator Architecture & CRD Specifications', url: 'https://prometheus-operator.dev/docs/operator/architecture/' },
  { label: 'Native Histograms Specification (Prometheus 3.8+)', url: 'https://prometheus.io/docs/specs/native_histograms/' },
  { label: 'Remote Write Specification 2.0 & WAL Sharding', url: 'https://prometheus.io/docs/specs/remote_write_spec_2_0/' }
];
