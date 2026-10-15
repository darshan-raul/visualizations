/**
 * A small, deterministic model of IAM policy evaluation for one S3 request, used by the "who, what, how, from where" views
 * and the simulator. It follows the documented order (explicit deny, SCPs, resource-based policy, identity-based policy,
 * permissions boundary) and the documented cross-account rule (both accounts must allow). It leaves out RCPs, session
 * policies, S3 Block Public Access, ACLs and every other service's own rules. Names and account IDs are teaching fixtures.
 */
export type Who = 'same' | 'cross' | 'anonymous';
export type Action = 's3:ListBucket' | 's3:GetObject' | 's3:DeleteBucket';
export type Origin = 'office' | 'home' | 'endpoint';
export type Requirement = 'none' | 'office-ip' | 'endpoint';
export type Ask = {
  who: Who; action: Action; origin: Origin;
  /** Each one answers: does this policy have a statement for this request? */
  identity: boolean; bucket: boolean; scp: boolean; boundary: boolean;
  /** The bucket policy carries `Deny s3:DeleteBucket` for everyone. */
  deny: boolean;
  /** A Condition on both Allow statements. */
  require: Requirement;
};
export type Row = { account: string; check: string; result: 'pass' | 'fail' | 'skip'; why: string };
export type Decision = { allowed: boolean; rows: Row[]; reason: string };

export const BUCKET = 'amzn-s3-demo-bucket-reports';
export const OFFICE = '203.0.113.0/24';
export const ENDPOINT = 'vpce-0a1b2c3d4e5f60718';
export const actions: Action[] = ['s3:ListBucket', 's3:GetObject', 's3:DeleteBucket'];

export const who = {
  same: { label: 'SupportRead session', account: '222222222222', short: 'SupportRead/maya',
    arn: 'arn:aws:sts::222222222222:assumed-role/SupportRead/maya', role: 'arn:aws:iam::222222222222:role/SupportRead' },
  cross: { label: 'DeveloperAccess session', account: '111111111111', short: 'DeveloperAccess/maya',
    arn: 'arn:aws:sts::111111111111:assumed-role/DeveloperAccess/maya', role: 'arn:aws:iam::111111111111:role/DeveloperAccess' },
  anonymous: { label: 'No credentials', account: '', short: 'anonymous', arn: 'anonymous (unsigned request)', role: '*' },
} as const;

export const origins = {
  office: { label: 'Office network', context: [['aws:SourceIp', '203.0.113.24']] },
  home: { label: 'Home network', context: [['aws:SourceIp', '198.51.100.7']] },
  endpoint: { label: 'EC2 through a VPC endpoint', context: [['aws:SourceVpce', ENDPOINT], ['aws:VpcSourceIp', '10.0.4.17']] },
} as const;

export const requirements = {
  none: { label: 'No condition', key: '' },
  'office-ip': { label: 'Only from the office IP range', key: 'aws:SourceIp' },
  endpoint: { label: 'Only through the VPC endpoint', key: 'aws:SourceVpce' },
} as const;

export const resourceOf = (action: Action) => action === 's3:GetObject' ? `arn:aws:s3:::${BUCKET}/2026/q3.csv` : `arn:aws:s3:::${BUCKET}`;
/** The resource a policy names: objects take the /* form, bucket actions the bucket itself. */
export const policyResourceOf = (action: Action) => action === 's3:GetObject' ? `arn:aws:s3:::${BUCKET}/*` : `arn:aws:s3:::${BUCKET}`;

/** A missing key doesn't match an ordinary operator, so a request through an endpoint has no aws:SourceIp to match. */
export const conditionMet = (ask: Pick<Ask, 'require' | 'origin'>) =>
  ask.require === 'none' || (ask.require === 'office-ip' ? ask.origin === 'office' : ask.origin === 'endpoint');

export function context(ask: Ask): [string, string][] {
  const rows: [string, string][] = [];
  if (ask.who !== 'anonymous') rows.push(['aws:PrincipalArn', who[ask.who].role], ['aws:PrincipalAccount', who[ask.who].account]);
  rows.push(...origins[ask.origin].context.map(([key, value]) => [key, value] as [string, string]));
  rows.push(['aws:SecureTransport', 'true']);
  return rows;
}

/** Marks every row after the first stop in the same account as not reached. */
const settle = (rows: Row[]) => {
  const stopped = new Set<string>();
  return rows.map((row) => {
    if (stopped.has(row.account)) return { ...row, result: 'skip' as const, why: 'Not reached: this account already said no.' };
    if (row.result === 'fail') stopped.add(row.account);
    return row;
  });
};

export function evaluate(ask: Ask): Decision {
  const met = conditionMet(ask);
  const key = requirements[ask.require].key;
  const unmet = `Its Condition needs ${key}${key === 'aws:SourceIp' ? ` in ${OFFICE}` : key ? ` = ${ENDPOINT}` : ''}, and this request ${ask.origin === 'endpoint' && key === 'aws:SourceIp' ? 'has no aws:SourceIp because it came through a VPC endpoint' : 'doesn\'t match'}.`;
  const denies = ask.deny && ask.action === 's3:DeleteBucket';
  const bucketAllows = ask.bucket && met;
  const identityAllows = ask.identity && met;
  const owner = `${ask.who === 'same' ? 'Account' : 'Bucket account'} ${who.same.account.slice(0, 3)}…`;
  const caller = ask.who === 'anonymous' ? owner : `Caller account ${who[ask.who].account.slice(0, 3)}…`;
  const rows: Row[] = [];

  const denyRow = (account: string): Row => denies
    ? { account, check: 'Explicit deny', result: 'fail', why: 'The bucket policy says Deny s3:DeleteBucket to every principal. One matching Deny ends the evaluation.' }
    : { account, check: 'Explicit deny', result: 'pass', why: ask.deny ? `The bucket policy's Deny names s3:DeleteBucket, not ${ask.action}.` : 'No Deny statement matches this request.' };
  const scpRow = (account: string): Row => ask.scp
    ? { account, check: 'SCP on the caller\'s account', result: 'pass', why: 'The organization lets principals in this account use S3. An SCP sets a ceiling; it grants nothing.' }
    : { account, check: 'SCP on the caller\'s account', result: 'fail', why: 'The SCP has no Allow for S3 actions, so nothing in this account can use S3, whatever its own policies say.' };
  const identityRow = (account: string, needed: boolean): Row => identityAllows
    ? { account, check: 'Identity policy', result: 'pass', why: `The role's policy allows ${ask.action} on ${policyResourceOf(ask.action).replace('arn:aws:s3:::', '')}.` }
    : { account, check: 'Identity policy', result: needed ? 'fail' : 'pass',
        why: (ask.identity ? `Its Allow statement doesn't apply. ${unmet}` : `No statement in the role's policy allows ${ask.action}.`) + (needed ? '' : ' The bucket policy already allowed it, so in one account that is enough.') };
  const boundaryRow = (account: string): Row => ask.boundary
    ? { account, check: 'Permissions boundary', result: 'pass', why: 'The role has no boundary, or its boundary includes this action.' }
    : { account, check: 'Permissions boundary', result: 'fail', why: `The role's boundary leaves out ${ask.action}. A boundary caps the role, including grants a bucket policy gives the role.` };
  const bucketRow = (account: string, needed: boolean): Row => bucketAllows
    ? { account, check: 'Bucket policy', result: 'pass', why: `It allows ${ask.who === 'anonymous' ? 'Principal "*"' : who[ask.who].short.split('/')[0]} to ${ask.action}.` }
    : { account, check: 'Bucket policy', result: needed ? 'fail' : 'pass',
        why: (ask.bucket ? `Its Allow statement doesn't apply. ${unmet}` : 'It has no statement for this principal.') + (needed ? '' : ' In one account, the identity policy can allow it instead.') };

  if (ask.who === 'anonymous') {
    rows.push(denyRow(owner), { account: owner, check: 'SCP on the caller\'s account', result: 'skip', why: 'There is no caller account. SCPs only cap principals inside the organization.' }, bucketRow(owner, true));
  } else if (ask.who === 'same') {
    rows.push(denyRow(owner), scpRow(owner), bucketRow(owner, false), identityRow(owner, !bucketAllows), boundaryRow(owner));
  } else {
    rows.push({ account: caller, check: 'Explicit deny', result: 'pass', why: 'No Deny statement in the caller account\'s policies.' },
      scpRow(caller), identityRow(caller, true), boundaryRow(caller), denyRow(owner), bucketRow(owner, true));
  }
  const settled = settle(rows);
  const failed = settled.find((row) => row.result === 'fail');
  const reason = !failed ? (ask.who === 'cross' ? 'Both accounts allow the request.' : 'An Allow applies and nothing denies or caps it.')
    : failed.check === 'Explicit deny' ? 'Explicit deny: one Deny beats every Allow.'
    : failed.check.startsWith('SCP') ? 'Implicit deny: the SCP sets no room for S3.'
    : failed.check === 'Permissions boundary' ? 'Implicit deny: the boundary caps the role.'
    : ask.who === 'cross' ? `Implicit deny: across accounts, the ${failed.check.toLowerCase()} must allow too.`
    : 'Implicit deny: no Allow applies to this request.';
  return { allowed: !failed, rows: settled, reason };
}

const condition = (require: Requirement) => require === 'office-ip' ? { IpAddress: { 'aws:SourceIp': OFFICE } }
  : require === 'endpoint' ? { StringEquals: { 'aws:SourceVpce': ENDPOINT } } : undefined;

/** The two policies this request meets, written as JSON. */
export function policies(ask: Ask) {
  const when = condition(ask.require);
  const identity = { Version: '2012-10-17', Statement: ask.identity && ask.who !== 'anonymous'
    ? [{ Sid: 'ReadReports', Effect: 'Allow', Action: ask.action, Resource: policyResourceOf(ask.action), ...(when && { Condition: when }) }] : [] };
  const statements: object[] = [];
  if (ask.bucket) statements.push({ Sid: 'ShareReports', Effect: 'Allow', Principal: ask.who === 'anonymous' ? '*' : { AWS: who[ask.who].role },
    Action: ask.action, Resource: policyResourceOf(ask.action), ...(when && { Condition: when }) });
  if (ask.deny) statements.push({ Sid: 'NeverDeleteBucket', Effect: 'Deny', Principal: '*', Action: 's3:DeleteBucket', Resource: `arn:aws:s3:::${BUCKET}` });
  return { identity, bucket: { Version: '2012-10-17', Statement: statements } };
}

/** Row marks and verdict words for a lesson gate panel. */
export const words = { ok: 'ALLOWED', stopped: 'DENIED', pass: 'passes', fail: 'stops here', skip: 'not reached' };

export const json = (value: unknown) => JSON.stringify(value, null, 2);

/** The four simulator presets. Each one is the end state of one focused view. */
export const presets: { id: string; label: string; note: string; ask: Ask }[] = [
  { id: 'basic', label: 'One account', note: 'The SupportRead session lists the reports bucket in its own account. Its identity policy allows it, and nothing denies it.',
    ask: { who: 'same', action: 's3:ListBucket', origin: 'office', identity: true, bucket: false, scp: true, boundary: true, deny: false, require: 'none' } },
  { id: 'where', label: 'From where', note: 'The Allow now holds a Condition: only from the office range. Maya is at home, so the statement doesn\'t apply and nothing else allows the call. Switch FROM WHERE to the office network.',
    ask: { who: 'same', action: 's3:ListBucket', origin: 'home', identity: true, bucket: false, scp: true, boundary: true, deny: false, require: 'office-ip' } },
  { id: 'deny', label: 'Deny wins', note: 'Both policies allow s3:DeleteBucket, but the bucket policy also denies it to everyone. Change WHAT to another action and the Deny no longer matches.',
    ask: { who: 'same', action: 's3:DeleteBucket', origin: 'office', identity: true, bucket: true, scp: true, boundary: true, deny: true, require: 'none' } },
  { id: 'cross', label: 'Two accounts', note: 'Maya reads the bucket from her DeveloperAccess session in account 111…, without assuming a role. Her identity policy allows it; the bucket policy in 222… doesn\'t name her role yet. Turn on the bucket policy.',
    ask: { who: 'cross', action: 's3:GetObject', origin: 'office', identity: true, bucket: false, scp: true, boundary: true, deny: false, require: 'none' } },
];
