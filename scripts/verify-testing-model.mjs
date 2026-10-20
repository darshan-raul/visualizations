import assert from 'node:assert/strict';
import { releaseResults, defaults, evaluateCanary } from '../src/components/testing/testing-model.ts';
const firstFailure = (o) => releaseResults({...defaults,...o}).find(r=>r.status==='fail')?.name ?? null;
assert.equal(firstFailure({}),null);
assert.equal(firstFailure({fault:'math'}),'Static + unit');
assert.equal(firstFailure({fault:'schema'}),'Integration');
assert.equal(firstFailure({fault:'schema',databaseDouble:true}),'API');
assert.equal(firstFailure({fault:'contract'}),'Contract');
assert.equal(firstFailure({fault:'ui'}),'Browser journey');
assert.equal(firstFailure({fault:'latency'}),'Load threshold');
assert.equal(firstFailure({fault:'latency',largeCarts:false}),'Canary evaluation');
const base={minutes:10,requests:1000,errors:3,baselineP95:250,candidateP95:270};
assert.equal(evaluateCanary(base).verdict,'CONTINUE');
assert.equal(evaluateCanary({...base,minutes:9}).verdict,'WAIT');
assert.equal(evaluateCanary({...base,requests:999}).verdict,'WAIT');
assert.equal(evaluateCanary({...base,requests:0,errors:0}).verdict,'WAIT');
assert.equal(evaluateCanary({...base,errors:10}).verdict,'HALT'); // < 1%, not <=
assert.equal(evaluateCanary({...base,candidateP95:300}).verdict,'CONTINUE'); // <= 20% increase
assert.equal(evaluateCanary({...base,candidateP95:301}).verdict,'HALT');
assert.equal(evaluateCanary({...base,minutes:1,candidateP95:850}).verdict,'HALT'); // known breach outranks missing samples
assert.equal(evaluateCanary({...base,requests:20,errors:0,minutes:1}).verdict,'WAIT');
console.log('PASS: 8 defect/coverage outcomes and 9 canary policy boundary cases.');
