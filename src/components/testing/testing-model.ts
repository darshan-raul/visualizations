/** Bounded teaching model. Evaluates fixture assertions locally; never invokes infrastructure. */
export const faults = {
  healthy: 'Healthy discount change', math: 'Wrong discount arithmetic', schema: 'Missing database migration',
  contract: 'Payment response renamed', ui: 'Checkout button disconnected', latency: 'Large carts trigger slow queries',
} as const;
export type Fault = keyof typeof faults;
export type Options = { fault: Fault; databaseDouble: boolean; largeCarts: boolean };
export type Actor = 'browser' | 'api' | 'price' | 'database' | 'payment' | 'storage';
/** The zone a gate runs in and the promotion its failure stops. */
export const zones = ['CI runner', 'Build', 'Test env', 'Staging', 'Production'] as const;
export type Result = { name: string; zone: number; blocks: string; environment: string; status: 'pass' | 'fail'; command: string; expected: string; observed: string; reason: string; real: Actor[]; mocked: Actor[]; failed: Actor };
export const defaults: Options = { fault: 'healthy', databaseDouble: false, largeCarts: true };
export function releaseResults(o: Options): Result[] {
  const amount = o.fault === 'math' ? 100 - .2 : 100 * (1 - .2);
  const migration = o.fault !== 'schema';
  const response = o.fault === 'contract' ? { id: 'pay_test' } : { paymentId: 'pay_test' };
  const latency = o.fault === 'latency' && o.largeCarts ? 850 : 280;
  const r = (name: string, zone: number, blocks: string, environment: string, pass: boolean, command: string, expected: string, observed: string, reason: string, failed: Actor, real: Actor[], mocked: Actor[] = []): Result => ({ name, zone, blocks, environment, status: pass ? 'pass' : 'fail', command, expected, observed, reason, failed, real, mocked });
  return [
    r('Static + unit', 0, 'the merge', 'CI runner', amount === 80, 'assert.equal(total(100, 0.20), 80)', '80', String(amount), 'The static checks accept both expressions. The unit assertion compares the business result. The price function is pure, so nothing needs replacing.', 'price', ['price']),
    r('Build + scan', 1, 'the artifact', 'Build runner', true, 'build → digest → inventory → scan policy', 'Reports bound to sha256:abc…', 'SBOM and required reports attached', 'The fixture has no blocking scan finding. Reports stay attached to the built digest.', 'api', []),
    r('Integration', 2, 'deploy to staging', 'Test env', o.databaseDouble || migration, 'INSERT INTO orders (discount_total) VALUES (20)', 'Order written to the configured test dependency', o.databaseDouble ? 'Test double accepts the write' : migration ? '1 row inserted' : 'Column discount_total does not exist', o.databaseDouble ? 'The double cannot detect a real schema mismatch. A green result leaves that boundary unverified.' : 'A real disposable database exercises migrations and the driver together.', 'database', ['api', ...(o.databaseDouble ? [] : ['database'] as Actor[])], o.databaseDouble ? ['database'] : []),
    r('Contract', 2, 'deploy to staging', 'Test env · provider check', 'paymentId' in response, 'verify(providerResponse, consumerContract)', 'paymentId: string', JSON.stringify(response), 'Provider unit tests can pass while the consumer-required field disappears. Versioned contract verification catches this compatibility break. The consumer is replaced by its recorded expectations.', 'payment', ['payment'], ['api']),
    r('API', 2, 'deploy to staging', 'Test env', migration, 'POST /orders { cart: [item], coupon: "SAVE20" }', '201 + persisted order', migration ? '201; total 80; row exists' : '500; database column missing', 'This API fixture uses a real database. It catches the schema failure even when the earlier integration test used a double.', 'database', ['api', 'price', 'database'], ['payment']),
    r('Browser journey', 3, 'production', 'Staging', o.fault !== 'ui', 'browser: add item → apply coupon → pay', 'Confirmation visible; order stored once', o.fault === 'ui' ? 'No request sent; confirmation timed out' : 'Confirmation rendered; one order stored', 'The browser exercises wiring that a direct API request bypasses. Payment uses a sandbox, not real charges.', 'browser', ['browser', 'api', 'price', 'database', 'payment']),
    r('Load threshold', 3, 'production', 'Staging', latency < 300, '100 requests/s · 10 min · assert p95 < 300 ms', '< 300 ms with the selected cart distribution', `${latency} ms; ${o.largeCarts ? 'large carts included' : 'small carts only'}`, o.largeCarts ? 'Large carts exercise the expensive query path. A functional pass says nothing about contention at this workload.' : 'The load is substantial, but the inputs never exercise the large-cart path. More requests do not repair missing coverage.', 'database', ['api', 'price', 'database'], ['payment']),
    r('Canary evaluation', 4, 'the rollout', 'Production · 5%', o.fault !== 'latency', 'compare(candidate, baseline) after sample + time gates', 'Candidate p95 ≤ baseline × 1.20', o.fault === 'latency' ? '850 ms > 250 × 1.20; halt expansion' : '270 ms ≤ 300 ms; next rollout step allowed', 'Production includes large carts. Halt limits further exposure; recovery still needs a compatible rollback, flag disablement, or roll-forward plan.', 'api', ['browser', 'api', 'price', 'database', 'payment']),
  ];
}
export type CanaryInput = { minutes: number; requests: number; errors: number; baselineP95: number; candidateP95: number };
export function evaluateCanary(input: CanaryInput) {
  const rate = input.requests ? input.errors / input.requests * 100 : 0;
  const checks = [
    { name: 'Observation window', pass: input.minutes >= 10, value: `${input.minutes} / 10 min` },
    { name: 'Candidate sample', pass: input.requests >= 1000, value: `${input.requests.toLocaleString('en')} / 1,000 requests` },
    { name: 'Candidate errors', pass: input.requests > 0 && rate < 1, pending: input.requests === 0, value: input.requests ? `${rate.toFixed(2)}% < 1%` : 'No candidate requests observed' },
    { name: 'Latency comparison', pass: input.requests > 0 && input.candidateP95 <= input.baselineP95 * 1.2, pending: input.requests === 0, value: input.requests ? `${input.candidateP95} ms ≤ ${(input.baselineP95 * 1.2).toFixed(0)} ms` : 'No candidate latency sample' },
  ];
  // A demonstrated guardrail breach halts immediately; a clean but tiny sample waits.
  const verdict = input.requests === 0 ? 'WAIT' : !checks[2].pass || !checks[3].pass ? 'HALT' : !checks[0].pass || !checks[1].pass ? 'WAIT' : 'CONTINUE';
  return { rate, checks, verdict };
}
