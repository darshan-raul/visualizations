/**
 * The opening chain of the identity page: one signed S3 request, the four questions AWS asks about it (who, what, how,
 * from where), and how the answers combine. The gate panels come from iam-eval.ts, so the views and the simulator that
 * ends the chain always agree. Account IDs, ARNs and addresses are teaching fixtures.
 */
import { code, edge, node, type Diagram, type GatePanel, type View } from '../lesson/lesson-types';
import { BUCKET, ENDPOINT, OFFICE, evaluate, json, policies, policyResourceOf, resourceOf, who, words, type Ask, type Row } from './iam-eval';

export const FOUR = 'Four questions';

const base: Ask = { who: 'same', action: 's3:ListBucket', origin: 'office', identity: true, bucket: false, scp: true, boundary: true, deny: false, require: 'none' };
const ask = (more: Partial<Ask>): Ask => ({ ...base, ...more });
const gates = (request: Ask, change: (rows: Row[]) => Row[] = (rows) => rows): GatePanel => {
  const decision = evaluate(request);
  const rows = change(decision.rows);
  const ok = rows.every((row) => row.result !== 'fail');
  return {
    title: 'How AWS decides', words, ok, verdict: decision.reason,
    call: `${who[request.who].short} → ${request.action} ${resourceOf(request.action).replace('arn:aws:s3:::', '')}`,
    rows: rows.map((row) => ({ check: request.who === 'cross' ? `${row.account} · ${row.check}` : row.check, result: row.result, why: row.why })),
  };
};

const REQ: Diagram = {
  title: 'One signed request, broken into the four questions AWS asks', width: 800, height: 280,
  nodes: [
    node('cli', 'code', 6, 101, 'Maya\'s CLI', 'SupportRead session', 150, 60),
    node('req', 'terminal', 196, 109, 'signed request', undefined, 150, 44),
    node('who', 'part', 400, 24, 'WHO', 'assumed-role/SupportRead/maya', 236, 54),
    node('what', 'part', 400, 104, 'WHAT', 's3:ListBucket on the bucket', 236, 54),
    node('where', 'part', 400, 184, 'FROM WHERE', '203.0.113.24 · TLS · 10:42', 236, 54),
    node('dec', 'gate', 672, 104, 'decision', undefined, 122, 54),
    node('how', 'store', 664, 210, 'HOW', 'the policies', 136, 58),
  ],
  edges: [
    edge('e0', 'cli', 'req', 'signs'),
    edge('ew', 'req', 'who'),
    edge('ea', 'req', 'what'),
    edge('eh', 'req', 'where'),
    edge('dw', 'who', 'dec'), edge('da', 'what', 'dec'), edge('dh', 'where', 'dec'), edge('dp', 'how', 'dec'),
  ],
};
const REQ_ALL = ['cli', 'req', 'who', 'what', 'where', 'how', 'dec', 'e0', 'ew', 'ea', 'eh', 'dw', 'da', 'dh', 'dp'];

const EVAL: Diagram = {
  title: 'A request, the policies that could allow it, and the bucket', width: 780, height: 220,
  nodes: [
    node('req', 'terminal', 6, 88, 'request', undefined, 130, 44),
    node('idp', 'store', 200, 14, 'identity policy', 'on the SupportRead role', 200, 58),
    node('bp', 'store', 200, 148, 'bucket policy', 'on the reports bucket', 200, 58),
    node('dec', 'gate', 440, 83, 'decision', undefined, 120, 54),
    node('s3', 'kube', 640, 82, 'reports bucket', 'account 222…', 136, 56),
  ],
  edges: [edge('r', 'req', 'dec'), edge('i', 'idp', 'dec'), edge('b', 'bp', 'dec'), edge('go', 'dec', 's3')],
};

const WHERE: Diagram = {
  title: 'The same call from three places', width: 780, height: 250,
  zones: [{ id: 'zvpc', x: 0, y: 156, w: 470, h: 94, label: 'VPC' }],
  nodes: [
    node('office', 'code', 10, 14, 'office laptop', '203.0.113.24', 170, 56),
    node('home', 'code', 10, 92, 'home laptop', '198.51.100.7', 170, 56),
    node('ec2', 'code', 10, 186, 'EC2 instance', '10.0.4.17', 170, 56),
    node('vpce', 'part', 270, 190, 'VPC endpoint', 'vpce-0a1b…', 170, 48),
    node('s3', 'kube', 590, 92, 'S3', 'reports bucket', 180, 56),
  ],
  edges: [edge('o', 'office', 's3', 'internet'), edge('h', 'home', 's3', 'internet'), edge('e1', 'ec2', 'vpce'), edge('e2', 'vpce', 's3', 'private')],
};
const WHERE_ALL = ['office', 'home', 'ec2', 'vpce', 's3', 'zvpc'];

const LAYERS: Diagram = {
  title: 'Every layer has to let the request through', width: 800, height: 150,
  nodes: [
    node('req', 'terminal', 4, 53, 'request', undefined, 100, 44),
    node('deny', 'gate', 130, 48, 'any Deny?', undefined, 120, 54),
    node('scp', 'part', 278, 51, 'SCP', 'org ceiling', 110, 48),
    node('allow', 'store', 414, 46, 'an Allow', 'identity or bucket', 140, 58),
    node('bnd', 'part', 580, 51, 'boundary', 'role ceiling', 110, 48),
    node('s3', 'kube', 714, 49, 'bucket', undefined, 82, 52),
  ],
  edges: [edge('l1', 'req', 'deny'), edge('l2', 'deny', 'scp'), edge('l3', 'scp', 'allow'), edge('l4', 'allow', 'bnd'), edge('l5', 'bnd', 's3')],
};
const LAYERS_ALL = ['req', 'deny', 'scp', 'allow', 'bnd', 's3', 'l1', 'l2', 'l3', 'l4', 'l5'];

const TWO: Diagram = {
  title: 'A caller in one account, a bucket in another', width: 800, height: 250,
  zones: [
    { id: 'z1', x: 0, y: 0, w: 330, h: 250, label: 'ACCOUNT 111… · CALLER' },
    { id: 'z2', x: 360, y: 0, w: 440, h: 250, label: 'ACCOUNT 222… · BUCKET' },
  ],
  nodes: [
    node('dev', 'code', 24, 40, 'DeveloperAccess', 'Maya\'s session', 180, 58),
    node('idp', 'store', 24, 160, 'identity policy', 'on DeveloperAccess', 180, 58),
    node('sup', 'code', 384, 160, 'SupportRead', 'Maya\'s other session', 170, 58),
    node('s3', 'kube', 600, 40, 'reports bucket', undefined, 180, 58),
    node('bp', 'store', 610, 160, 'bucket policy', 'on the bucket', 170, 58),
  ],
  edges: [
    edge('x', 'dev', 's3', 'GetObject'),
    edge('s', 'sup', 's3', 'GetObject'),
    edge('i', 'idp', 'dev', 'allows?'),
    edge('b', 'bp', 's3', 'allows?'),
  ],
};

/** Line numbers (1-based) of the lines that contain any of the given fragments. */
const lines = (text: string, ...parts: string[]) => text.split('\n').flatMap((line, index) => parts.some((part) => line.includes(part)) ? [index + 1] : []);
const hot = (title: string, text: string, ...parts: string[]) => code(title, text, lines(text, ...parts));

const identityJson = (request: Ask) => json(policies(request).identity);
const bucketJson = (request: Ask) => json(policies(request).bucket);

export const fourViews = (source: (label: string) => number): View[] => [
  {
    id: 'four-questions', group: FOUR, label: 'One request', mode: 'steps',
    title: 'Every AWS request answers four questions',
    lede: 'Maya lists the reports bucket from her laptop. Follow the one request and see what AWS reads from it before S3 does anything.',
    diagram: REQ,
    frames: [
      { action: 'The request arrives', caption: 'Maya\'s CLI sends one signed HTTPS request to the reports bucket. Before S3 lists anything, AWS has to decide whether this request may run.',
        pic: { show: ['cli', 'req', 'e0'], hot: ['e0'] },
        code: [code('What travels over the wire', `
GET /?list-type=2 HTTP/1.1
Host: ${BUCKET}.s3.amazonaws.com
Authorization: AWS4-HMAC-SHA256 Credential=ASIA…DEMO/20261015/ap-south-1/s3/aws4_request, …
X-Amz-Security-Token: [session token]
X-Amz-Date: 20261015T104200Z`, [1, 3])] },
      { action: 'WHO is asking', caption: 'The access key ID in the signature belongs to a temporary credential set, and that set belongs to a role session. The session is who is asking, not Maya\'s laptop or her name.',
        pic: { show: ['cli', 'req', 'who', 'e0', 'ew'], hot: ['ew', 'who'] },
        state: { title: 'What AWS knows so far', rows: [{ key: 'Principal', value: who.same.arn, mark: 'new' }] } },
      { action: 'WHAT it wants', caption: 'S3 turns the API call into an action and a resource. ListObjectsV2 is checked as s3:ListBucket, and it acts on the bucket itself, not on the objects inside it.',
        pic: { show: ['cli', 'req', 'who', 'what', 'e0', 'ew', 'ea'], hot: ['ea', 'what'] },
        state: { title: 'What AWS knows so far', rows: [{ key: 'Principal', value: who.same.arn }, { key: 'Action', value: 's3:ListBucket', mark: 'new' }, { key: 'Resource', value: `arn:aws:s3:::${BUCKET}`, mark: 'new' }] } },
      { action: 'FROM WHERE', caption: 'The connection adds facts about where and how the request came: the source IP, whether it came through a VPC endpoint, whether it used TLS, and the time. Policies read these as condition keys.',
        pic: { show: ['cli', 'req', 'who', 'what', 'where', 'e0', 'ew', 'ea', 'eh'], hot: ['eh', 'where'] },
        state: { title: 'What AWS knows so far', rows: [{ key: 'Principal', value: who.same.arn }, { key: 'Action', value: 's3:ListBucket' }, { key: 'Resource', value: `arn:aws:s3:::${BUCKET}` },
          { key: 'aws:SourceIp', value: '203.0.113.24', mark: 'new' }, { key: 'aws:SecureTransport', value: 'true', mark: 'new' }, { key: 'aws:CurrentTime', value: '2026-10-15T10:42:00Z', mark: 'new' }] } },
      { action: 'HOW it is judged', caption: 'AWS gathers every policy that applies: the role\'s identity policy, the bucket policy, the organization\'s SCPs and the role\'s permissions boundary. It compares the request with each one. AWS calls the four parts of a request PARC: Principal, Action, Resource and Condition.',
        pic: { show: REQ_ALL, hot: ['how', 'dp', 'dw', 'da', 'dh', 'dec'] },
        state: { title: 'The request context', rows: [{ key: 'Principal', value: who.same.arn }, { key: 'Action', value: 's3:ListBucket' }, { key: 'Resource', value: `arn:aws:s3:::${BUCKET}` },
          { key: 'aws:SourceIp', value: '203.0.113.24' }, { key: 'aws:SecureTransport', value: 'true' }, { key: 'aws:CurrentTime', value: '2026-10-15T10:42:00Z' }] } },
    ],
    inspector: {
      heading: 'A request becomes a request context',
      body: 'AWS turns each signed request into a request context: who sent it, the action, the resource, and facts about the request such as the source IP and time. Every policy is matched against that context. The signature only proves the request came from the credential holder; whether the action is allowed is decided by the policies.',
      facts: [['WHO', 'Principal: the session or user that signed'], ['WHAT', 'Action + Resource ARN'], ['FROM WHERE', 'Condition keys from the request'], ['HOW', 'Effect and type of each policy that applies']],
      evidence: ['SEE YOUR OWN PRINCIPAL', 'aws sts get-caller-identity'],
      note: 'An API name and its IAM action can differ: ListObjectsV2 is authorized as s3:ListBucket. The Service Authorization Reference lists the action and resource type for every API.',
    },
    takeaway: 'Before reading a policy, write the request as principal, action, resource and context; every policy is matched against those four answers.',
    sources: [source('IAM: the request context'), source('S3: policy actions'), source('IAM: Signature Version 4')],
  },
  {
    id: 'no-allow', group: FOUR, label: 'No allow, no access', mode: 'steps',
    title: 'Nothing is allowed until a policy says so',
    lede: 'Start the SupportRead role with no permissions, then add one statement and get its resource wrong.',
    diagram: EVAL,
    frames: [
      { action: 'Nothing allows it', caption: 'The role is new and has no policies. Every request starts out denied, and with no Allow anywhere it stays denied. AWS calls this an implicit deny.',
        pic: { show: ['req', 'idp', 'bp', 'dec', 's3', 'r', 'go'], hot: ['r'], denied: ['go'] },
        gates: gates(ask({ identity: false })) },
      { action: 'Add an Allow', caption: 'One statement in the role\'s identity policy names the action and the bucket. It matches the request, nothing denies it, and S3 returns the listing.',
        pic: { show: ['req', 'idp', 'bp', 'dec', 's3', 'r', 'i', 'go'], hot: ['r', 'i', 'go'] },
        gates: gates(ask({})),
        code: [hot('Identity policy on SupportRead', identityJson(ask({})), '"Action"', '"Resource"')] },
      { action: 'Allow the wrong resource', caption: 'This statement names bucket/*, which means the objects. ListBucket acts on the bucket itself, so the statement doesn\'t match and the request is denied again.',
        pic: { show: ['req', 'idp', 'bp', 'dec', 's3', 'r', 'i', 'go'], hot: ['r'], denied: ['go'] },
        gates: gates(ask({ identity: false }), (rows) => rows.map((row) => row.check === 'Identity policy' ? { ...row, why: `Its Allow names ${policyResourceOf('s3:GetObject').replace('arn:aws:s3:::', '')}, the objects. s3:ListBucket is checked against the bucket ARN, so the statement doesn't match.` } : row)),
        code: [hot('Identity policy on SupportRead', identityJson(ask({})).replace(`"arn:aws:s3:::${BUCKET}"`, `"arn:aws:s3:::${BUCKET}/*"`), '"Resource"')] },
    ],
    inspector: {
      heading: 'Implicit deny is the starting point',
      body: 'Every request starts denied. A request runs only if a policy has an Allow statement whose action, resource and condition all match it, and nothing else denies or caps it. A statement that almost matches allows nothing.',
      facts: [['Default', 'Implicit deny'], ['An Allow must match', 'Action, Resource, Condition'], ['ListBucket resource', `arn:aws:s3:::${BUCKET}`], ['GetObject resource', `arn:aws:s3:::${BUCKET}/*`]],
      evidence: ['TEST WITHOUT CALLING S3', `aws iam simulate-principal-policy --policy-source-arn ${who.same.role} --action-names s3:ListBucket --resource-arns arn:aws:s3:::${BUCKET}`],
      note: 'The account root user is the one documented exception to the default deny: it starts with full access to its own account, which is why it should not be used for daily work.',
    },
    takeaway: 'Access is the exception: with no matching Allow, the answer is no, and an Allow has to match the action and the exact resource form.',
    sources: [source('IAM: how requests are allowed or denied'), source('S3: policy actions')],
  },
  {
    id: 'from-where', group: FOUR, label: 'From where', mode: 'choices',
    title: 'A condition decides whether an Allow applies',
    lede: 'Add one condition to the Allow: only from the office IP range. Then send the same call from three places.',
    diagram: WHERE,
    frames: [
      { action: 'From the office', caption: `The request comes from 203.0.113.24, inside ${OFFICE}. The Condition matches, so the Allow applies.`,
        pic: { show: [...WHERE_ALL, 'o'], hot: ['o', 'office'] },
        gates: gates(ask({ require: 'office-ip' })),
        code: [hot('Identity policy on SupportRead', identityJson(ask({ require: 'office-ip' })), 'aws:SourceIp')] },
      { action: 'From home', caption: 'The same credentials from 198.51.100.7. The Condition doesn\'t match, so that Allow simply doesn\'t apply. No other Allow exists, so the request is denied.',
        pic: { show: [...WHERE_ALL, 'h'], hot: ['home'], denied: ['h'] },
        gates: gates(ask({ require: 'office-ip', origin: 'home' })),
        notice: { tone: 'warn', label: 'NOT A DENY', text: 'A failed Condition switches off its own statement. Another Allow could still grant the call; only a Deny statement blocks it outright.' } },
      { action: 'Through a VPC endpoint', caption: 'An EC2 instance in the office VPC reaches S3 through a gateway endpoint. Requests through an endpoint carry no aws:SourceIp, so the IP condition can\'t match.',
        pic: { show: [...WHERE_ALL, 'e1', 'e2'], hot: ['ec2', 'e1'], denied: ['e2'] },
        gates: gates(ask({ require: 'office-ip', origin: 'endpoint' })) },
      { action: 'Match the endpoint instead', caption: 'For traffic through the endpoint, check the endpoint\'s ID with aws:SourceVpce. Now the instance\'s request matches.',
        pic: { show: [...WHERE_ALL, 'e1', 'e2'], hot: ['ec2', 'e1', 'e2', 'vpce'] },
        gates: gates(ask({ require: 'endpoint', origin: 'endpoint' })),
        code: [hot('The condition, rewritten', `"Condition": {\n  "StringEquals": { "aws:SourceVpce": "${ENDPOINT}" }\n}`, 'aws:SourceVpce')] },
    ],
    inspector: {
      heading: 'Conditions read the request context',
      body: 'A Condition is part of the statement that holds it. When a condition key in it doesn\'t match, or the request doesn\'t carry that key at all, the statement doesn\'t apply. With no other Allow, the result is an implicit deny.',
      facts: [['aws:SourceIp', 'public IP; absent through a VPC endpoint'], ['aws:SourceVpce', 'present only through a VPC endpoint'], ['aws:SecureTransport', 'whether the request used TLS'], ['Missing key', 'an ordinary operator doesn\'t match']],
      evidence: ['READ THE KEY YOUR POLICY NEEDS', 'CloudTrail event → sourceIPAddress, vpcEndpointId'],
      note: 'aws:MultiFactorAuthPresent is only in the context for temporary credentials. AWS recommends a Deny with BoolIfExists set to false, so that requests signed with long-term access keys, which carry no MFA key, are denied too.',
    },
    takeaway: 'A condition narrows the statement it sits in; when the request lacks the key or the value differs, that Allow drops out, which is different from being denied.',
    sources: [source('IAM: global condition keys'), source('S3: bucket policies for VPC endpoints'), source('IAM: the request context')],
  },
  {
    id: 'deny-wins', group: FOUR, label: 'Deny wins', mode: 'choices',
    title: 'One Deny beats every Allow, and ceilings cap the rest',
    lede: 'The HOW of a decision is more than one policy. Keep the role\'s Allow in place and change one other policy at a time.',
    diagram: LAYERS,
    frames: [
      { action: 'Every layer allows', caption: 'No Deny matches, the SCP leaves room for S3, the identity policy allows the call and the role\'s boundary includes it.',
        pic: { show: LAYERS_ALL, hot: ['l1', 'l2', 'l3', 'l4', 'l5'] },
        gates: gates(ask({})) },
      { action: 'A Deny in the bucket policy', caption: 'The bucket owner protects the bucket: Deny s3:DeleteBucket to every principal. Maya\'s role allows DeleteBucket, and so does the bucket policy, but one matching Deny ends the evaluation.',
        pic: { show: LAYERS_ALL, hot: ['l1'], denied: ['deny'] },
        gates: gates(ask({ action: 's3:DeleteBucket', bucket: true, deny: true })),
        code: [hot('Bucket policy statement', json(policies(ask({ action: 's3:DeleteBucket', deny: true })).bucket.Statement[0]), '"Deny"', '"Principal"', '"Action"')] },
      { action: 'The SCP leaves S3 out', caption: 'The organization replaced FullAWSAccess on this account with an SCP that allows only EC2 and CloudWatch. The role\'s own Allow can\'t reach past that ceiling.',
        pic: { show: LAYERS_ALL, hot: ['l1', 'l2'], denied: ['scp'] },
        gates: gates(ask({ scp: false })),
        code: [hot('SCP on account 222…', json({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['ec2:*', 'cloudwatch:*'], Resource: '*' }] }), 'ec2:*', 'cloudwatch:*')] },
      { action: 'The boundary leaves it out', caption: 'The role has a permissions boundary that allows only s3:GetObject. ListBucket is in the identity policy but outside the boundary, so it is denied.',
        pic: { show: LAYERS_ALL, hot: ['l1', 'l2', 'l3', 'l4'], denied: ['bnd'] },
        gates: gates(ask({ boundary: false })) },
    ],
    inspector: {
      heading: 'Grants and ceilings',
      body: 'Identity policies and bucket policies grant. SCPs, permissions boundaries and session policies only set a ceiling: they never grant anything, but an action outside them is denied. A Deny statement in any of these policies overrides every Allow.',
      facts: [['Explicit Deny', 'ends the evaluation'], ['SCP', 'ceiling for principals in member accounts'], ['Permissions boundary', 'ceiling for one user or role'], ['Session policy', 'ceiling for one role session']],
      evidence: ['FIND THE LAYER THAT SAID NO', 'AccessDenied message → "because no … policy allows" or "with an explicit deny in a … policy"'],
      note: 'SCPs don\'t limit principals in the organization\'s management account or service-linked roles. Resource control policies (RCPs) are the matching ceiling on resources; they are left out of this example.',
    },
    takeaway: 'To be allowed, a request needs one matching Allow and must fit under every ceiling that applies; one matching Deny anywhere ends it.',
    sources: [source('IAM: how requests are allowed or denied'), source('Organizations: SCPs'), source('IAM: session policies and boundaries')],
  },
  {
    id: 'two-accounts', group: FOUR, label: 'Two accounts', mode: 'choices',
    title: 'Across accounts, both sides must say yes',
    lede: 'Maya reads the bucket directly from her DeveloperAccess session in account 111…, without assuming a role. Turn each side\'s Allow on and off.',
    diagram: TWO,
    frames: [
      { action: 'Only the identity policy', caption: 'Maya\'s role in 111… allows GetObject on the bucket. Account 222… owns the bucket and hasn\'t agreed, so the request is denied.',
        pic: { show: ['z1', 'z2', 'dev', 'idp', 's3', 'bp', 'x', 'i'], hot: ['i'], denied: ['x'] },
        gates: gates(ask({ who: 'cross', action: 's3:GetObject' })) },
      { action: 'Only the bucket policy', caption: 'Now the bucket policy names DeveloperAccess, but Maya\'s own account gives her role no Allow. Account 111… says no.',
        pic: { show: ['z1', 'z2', 'dev', 'idp', 's3', 'bp', 'x', 'b'], hot: ['b'], denied: ['x'] },
        gates: gates(ask({ who: 'cross', action: 's3:GetObject', identity: false, bucket: true })) },
      { action: 'Both allow', caption: 'AWS evaluates the request once in each account. Both evaluations allow it, so S3 returns the object.',
        pic: { show: ['z1', 'z2', 'dev', 'idp', 's3', 'bp', 'x', 'i', 'b'], hot: ['x', 'i', 'b'] },
        gates: gates(ask({ who: 'cross', action: 's3:GetObject', bucket: true })),
        code: [hot('Identity policy on DeveloperAccess (111…)', identityJson(ask({ who: 'cross', action: 's3:GetObject' })), '"Action"', '"Resource"'),
          hot('Bucket policy (222…)', bucketJson(ask({ who: 'cross', action: 's3:GetObject', bucket: true })), 'DeveloperAccess')] },
      { action: 'Same account: one is enough', caption: 'Compare Maya\'s SupportRead session, which lives in 222… with the bucket. Inside one account, the bucket policy alone allows the request.',
        pic: { show: ['z2', 'sup', 's3', 'bp', 's', 'b'], hot: ['s', 'b'] },
        gates: gates(ask({ action: 's3:GetObject', identity: false, bucket: true })) },
    ],
    inspector: {
      heading: 'Two evaluations, one answer',
      body: 'For a cross-account request, AWS evaluates the request in the caller\'s account, where the identity policy and its ceilings apply, and in the resource\'s account, where the resource policy applies. It allows the request only if both evaluations allow it.',
      facts: [['Caller\'s account', 'identity policy, SCP, boundary'], ['Resource\'s account', 'bucket policy, RCP'], ['Same account', 'either an identity or a resource policy can allow'], ['Exceptions', 'role trust and KMS key policies must name the principal']],
      evidence: ['WHICH ACCOUNT AM I IN?', 'aws sts get-caller-identity --query Account'],
      note: 'This is one of two ways across accounts. The other is the Cross-account view later on this page: assume a role in the bucket\'s account and act as a principal there.',
    },
    takeaway: 'A request that crosses an account boundary needs an Allow on both sides; inside one account, either side can grant it.',
    sources: [source('IAM: cross-account evaluation'), source('IAM: how requests are allowed or denied')],
  },
  {
    id: 'four-pillars', group: FOUR, label: 'Try it', mode: 'custom', hero: true,
    title: 'Ask the four questions yourself',
    lede: 'Set who is asking, what they want, how the policies read and where the call comes from. The trail shows each check in the order AWS documents.',
    frames: [],
    inspector: {
      heading: 'A model of one S3 decision',
      body: 'The simulator follows AWS\'s documented order: explicit deny, SCP, bucket policy, identity policy, permissions boundary. For a caller in another account it runs one evaluation per account. It doesn\'t call AWS.',
      facts: [['Left out', 'RCPs, session policies, ACLs, Block Public Access'], ['Bucket', BUCKET], ['Accounts', '111… caller · 222… bucket']],
      evidence: ['CHECK A REAL POLICY', 'aws iam simulate-principal-policy …  or IAM Access Analyzer policy checks'],
      note: 'A real anonymous request also has to get past S3 Block Public Access, which is on by default for new buckets.',
    },
    takeaway: 'Name the principal, action, resource and context first; then look for a Deny, check each ceiling, and find the Allow, in each account the request touches.',
    sources: [source('IAM: how requests are allowed or denied'), source('IAM: cross-account evaluation'), source('IAM: global condition keys')],
  },
];
