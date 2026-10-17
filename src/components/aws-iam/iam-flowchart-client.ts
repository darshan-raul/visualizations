/**
 * iam-flowchart-client.ts
 *
 * Client-side interactivity for the official AWS Policy Evaluation Logic flowchart.
 * Drives scenario preset selection, active path highlighting, node inspection,
 * and accessibility keyboard navigation.
 */

interface ScenarioData {
  status: 'allow' | 'deny' | 'branch';
  statusText: string;
  title: string;
  narrative: string;
  nodes: string[];
  edges: string[];
  steps: { text: string; pass?: boolean; fail?: boolean }[];
  codeTitle: string;
  code: string;
  rule: string;
}

const SCENARIOS: Record<string, ScenarioData> = {
  'role-allow': {
    status: 'allow',
    statusText: 'FINAL DECISION: ALLOW',
    title: '1. Standard Role Session (Allow)',
    narrative:
      'Darshan assumes the ProdReadOnly role with no extra session policy. No explicit Deny matches, the Organization SCP allows S3, the role\'s identity policy has Allow s3:GetObject, no boundary restricts it, and as a standard role session, the request passes directly to Allow.',
    nodes: [
      'node-start', 'node-eval', 'node-deny', 'node-scp-org', 'node-scp-allow',
      'node-res-has', 'node-id-has', 'node-id-allow', 'node-bnd-has',
      'node-sess-is', 'node-sess-has', 'node-role-sess', 'node-res-allow-top',
    ],
    edges: [
      'edge-start-eval', 'edge-eval-deny', 'edge-deny-no', 'edge-scp-yes',
      'edge-scpallow-yes', 'edge-res-no', 'edge-idhas-yes', 'edge-idallow-yes',
      'edge-bndhas-no', 'edge-sessis-yes', 'edge-sesshas-no', 'edge-rolesess-yes',
    ],
    steps: [
      { text: 'Explicit Deny check: Evaluates all policies; no matching Deny statement.', pass: true },
      { text: 'Organizations SCP ceiling: FullAWSAccess allows S3 actions.', pass: true },
      { text: 'Resource-based policy: prod-artifacts bucket has no resource policy (moves to identity check).' },
      { text: 'Identity-based policy: ProdReadOnly has explicit Allow s3:GetObject.', pass: true },
      { text: 'Permissions boundary: ProdReadOnly has no boundary attached (moves to session check).' },
      { text: 'Session principal: Caller is a role session; no extra session policy passed → ALLOW.', pass: true },
    ],
    codeTitle: 'Identity policy on ProdReadOnly in Account 222222222222:',
    code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::prod-artifacts/releases/app.zip"
  }]
}`,
    rule:
      'In a single account, an Allow in either an identity-based policy or a resource-based policy permits the action, as long as no explicit Deny, SCP, permissions boundary, or session policy restricts it.',
  },

  'explicit-deny': {
    status: 'deny',
    statusText: 'FINAL DECISION: DENY (EXPLICIT DENY)',
    title: '2. Explicit Deny in Bucket Policy (TLS Enforcement)',
    narrative:
      'The prod-artifacts bucket policy explicitly denies requests where aws:SecureTransport is false. Even though ProdReadOnly\'s identity policy has an Allow, the explicit Deny terminates evaluation immediately. No other checks are reached.',
    nodes: ['node-start', 'node-eval', 'node-deny', 'node-res-exp-deny'],
    edges: ['edge-start-eval', 'edge-eval-deny', 'edge-deny-yes'],
    steps: [
      { text: 'Evaluate all applicable policies: Scans SCPs, bucket policy, identity policy, and boundaries.' },
      { text: 'Explicit Deny found: Bucket policy contains Effect: Deny when aws:SecureTransport is false.', fail: true },
      { text: 'Immediate short-circuit: Overrides all Allows across all policy types → DENIED.', fail: true },
    ],
    codeTitle: 'Bucket policy enforcing TLS with an explicit Deny:',
    code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyInsecureTransport",
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": "arn:aws:s3:::prod-artifacts/*",
    "Condition": {
      "Bool": { "aws:SecureTransport": "false" }
    }
  }]
}`,
    rule:
      'An explicit Deny statement in ANY applicable policy (SCP, identity, resource, boundary, or session policy) immediately overrides all Allows and stops evaluation.',
  },

  'scp-deny': {
    status: 'deny',
    statusText: 'FINAL DECISION: DENY (IMPLICIT DENY)',
    title: '3. Blocked by Organization SCP Ceiling',
    narrative:
      'Account 222222222222 is in an AWS Organization whose SCP only permits EC2 and CloudWatch. Because s3:GetObject is not in the SCP allow list, the request is implicitly denied at the organization boundary, even if the role has AdministratorAccess.',
    nodes: [
      'node-start', 'node-eval', 'node-deny', 'node-scp-org', 'node-scp-allow',
      'node-res-scp-deny',
    ],
    edges: [
      'edge-start-eval', 'edge-eval-deny', 'edge-deny-no', 'edge-scp-yes',
      'edge-scpallow-no',
    ],
    steps: [
      { text: 'Explicit Deny check: No explicit Deny statement found.', pass: true },
      { text: 'Organizations SCP: Account 222222222222 belongs to an Organization with attached SCP.', pass: true },
      { text: 'SCP ceiling check: SCP allows only ec2:* and cloudwatch:*; s3:* is omitted.', fail: true },
      { text: 'Evaluation terminates: Request is outside the organization ceiling → IMPLICIT DENY.', fail: true },
    ],
    codeTitle: 'Organization SCP attached to Account 222222222222:',
    code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["ec2:*", "cloudwatch:*"],
    "Resource": "*"
  }]
}`,
    rule:
      'SCPs are guardrails that set the maximum available permissions for member accounts. SCPs never grant permissions on their own. Principals in the Organization management account and service-linked roles are exempt from SCPs.',
  },

  'res-policy-allow': {
    status: 'allow',
    statusText: 'FINAL DECISION: ALLOW (SAME-ACCOUNT RESOURCE POLICY)',
    title: '4. Same-Account Resource Policy Supplies the Grant',
    narrative:
      'ProdReadOnly has no S3 statement in its identity policy, but the prod-artifacts bucket policy explicitly allows Principal ProdReadOnly. In the same account, this resource policy Allow grants access directly without needing an identity policy allow.',
    nodes: [
      'node-start', 'node-eval', 'node-deny', 'node-scp-org', 'node-scp-allow',
      'node-res-has', 'node-res-allow', 'node-res-branch',
    ],
    edges: [
      'edge-start-eval', 'edge-eval-deny', 'edge-deny-no', 'edge-scp-yes',
      'edge-scpallow-yes', 'edge-res-yes', 'edge-resallow-yes',
    ],
    steps: [
      { text: 'Explicit Deny check: No explicit Deny matches.', pass: true },
      { text: 'Organizations SCP: FullAWSAccess permits S3.', pass: true },
      { text: 'Resource-based policy check: S3 bucket has an attached bucket policy.', pass: true },
      { text: 'Bucket policy evaluation: Statement explicitly allows Principal ProdReadOnly.', pass: true },
      { text: 'Single-account rule: Resource policy Allow is sufficient on its own → ALLOW.', pass: true },
    ],
    codeTitle: 'Bucket policy on prod-artifacts in Account 222222222222:',
    code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::222222222222:role/ProdReadOnly" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::prod-artifacts/releases/app.zip"
  }]
}`,
    rule:
      'In a single account, permissions are the union of identity-based and resource-based policies. An Allow in either policy grants access. In cross-account calls, both the trusting account and trusted account must allow.',
  },

  'boundary-deny': {
    status: 'deny',
    statusText: 'FINAL DECISION: DENY (IMPLICIT DENY)',
    title: '5. Capped by IAM Permissions Boundary',
    narrative:
      'ProdReadOnly\'s identity policy allows s3:GetObject, but an administrator attached a Permissions Boundary that only allows s3:ListBucket. Because effective permissions are the intersection of identity policy and boundary, s3:GetObject is blocked.',
    nodes: [
      'node-start', 'node-eval', 'node-deny', 'node-scp-org', 'node-scp-allow',
      'node-res-has', 'node-id-has', 'node-id-allow', 'node-bnd-has',
      'node-bnd-allow', 'node-res-bnd-deny',
    ],
    edges: [
      'edge-start-eval', 'edge-eval-deny', 'edge-deny-no', 'edge-scp-yes',
      'edge-scpallow-yes', 'edge-res-no', 'edge-idhas-yes', 'edge-idallow-yes',
      'edge-bndhas-yes', 'edge-bndallow-no',
    ],
    steps: [
      { text: 'Explicit Deny check: No explicit Deny statement.', pass: true },
      { text: 'Organizations SCP: SCP permits S3 actions.', pass: true },
      { text: 'Identity policy check: Role has Allow s3:GetObject.', pass: true },
      { text: 'Permissions boundary check: Role has an attached boundary.', pass: true },
      { text: 'Boundary allow check: Boundary allows s3:ListBucket only; omits s3:GetObject.', fail: true },
      { text: 'Intersection rule: Action outside boundary ceiling is implicitly denied → DENY.', fail: true },
    ],
    codeTitle: 'Permissions Boundary attached to ProdReadOnly:',
    code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:ListBucket",
    "Resource": "arn:aws:s3:::prod-artifacts"
  }]
}`,
    rule:
      'A permissions boundary sets the maximum permissions an identity-based policy can grant. It cannot grant access by itself; effective access is the intersection between identity policy and boundary.',
  },

  'missing-grant': {
    status: 'deny',
    statusText: 'FINAL DECISION: DENY (IMPLICIT DENY)',
    title: '6. Ceilings Allow, but Missing an Explicit Grant',
    narrative:
      'The Organization SCP allows *, and the Permissions Boundary allows *, but nobody attached an identity policy or bucket policy with an explicit Allow for s3:GetObject. Because AWS defaults to implicit deny, the request fails.',
    nodes: [
      'node-start', 'node-eval', 'node-deny', 'node-scp-org', 'node-scp-allow',
      'node-res-has', 'node-id-has', 'node-id-allow', 'node-res-id-deny',
    ],
    edges: [
      'edge-start-eval', 'edge-eval-deny', 'edge-deny-no', 'edge-scp-yes',
      'edge-scpallow-yes', 'edge-res-no', 'edge-idhas-yes', 'edge-idallow-no',
    ],
    steps: [
      { text: 'Explicit Deny check: No explicit Deny statement.', pass: true },
      { text: 'Organizations SCP: FullAWSAccess permits all actions.', pass: true },
      { text: 'Resource-based policy: No bucket policy exists.', pass: true },
      { text: 'Identity policy check: Role identity policy omits s3:GetObject.', fail: true },
      { text: 'Default implicit deny: Zero matching grants → DENY.', fail: true },
    ],
    codeTitle: 'Exact AWS error message returned to caller:',
    code: `An error occurred (AccessDenied) when calling the GetObject operation:
User: arn:aws:sts::222222222222:assumed-role/ProdReadOnly/darshan is not authorized
to perform: s3:GetObject on resource: "arn:aws:s3:::prod-artifacts/releases/app.zip"
because no identity-based policy allows the s3:GetObject action`,
    rule:
      'By default, all requests are implicitly denied. Unless at least one applicable policy explicitly grants an Allow, the decision remains Deny.',
  },

  'session-policy-deny': {
    status: 'deny',
    statusText: 'FINAL DECISION: DENY (IMPLICIT DENY)',
    title: '7. Dynamic Session Policy Restricts the Session',
    narrative:
      'When calling aws sts assume-role, the caller passed an inline session policy (--policy) that allows only CloudWatch logs. Even though the underlying ProdReadOnly role allows S3, the temporary session\'s effective permissions are intersected with the session policy, blocking S3.',
    nodes: [
      'node-start', 'node-eval', 'node-deny', 'node-scp-org', 'node-scp-allow',
      'node-res-has', 'node-id-has', 'node-id-allow', 'node-bnd-has',
      'node-sess-is', 'node-sess-has', 'node-sess-allow', 'node-res-sess-deny',
    ],
    edges: [
      'edge-start-eval', 'edge-eval-deny', 'edge-deny-no', 'edge-scp-yes',
      'edge-scpallow-yes', 'edge-res-no', 'edge-idhas-yes', 'edge-idallow-yes',
      'edge-bndhas-no', 'edge-sessis-yes', 'edge-sesshas-yes', 'edge-sessallow-no',
    ],
    steps: [
      { text: 'Explicit Deny & SCP checks: Both pass.', pass: true },
      { text: 'Role identity policy: Underlying role permits s3:GetObject.', pass: true },
      { text: 'Session principal check: Caller is using assumed-role temporary credentials.', pass: true },
      { text: 'Session policy check: An inline session policy was passed during AssumeRole.', pass: true },
      { text: 'Session policy allow check: Session policy allows logs:*; omits S3.', fail: true },
      { text: 'Intersection rule: Session credentials cannot exceed session policy ceiling → DENY.', fail: true },
    ],
    codeTitle: 'CLI command passing a runtime session policy:',
    code: `aws sts assume-role \\
  --role-arn arn:aws:iam::222222222222:role/ProdReadOnly \\
  --role-session-name darshan-scoped \\
  --policy '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"logs:*","Resource":"*"}]}'`,
    rule:
      'Session policies are advanced policies passed at runtime when assuming a role or federating. They further restrict the session\'s permissions down to the intersection of role permissions and session policy.',
  },

  'all': {
    status: 'branch',
    statusText: 'INTERACTIVE AWS POLICY EVALUATION FLOWCHART',
    title: 'Full Evaluation Decision Flowchart',
    narrative:
      'Explore the official AWS policy evaluation tree. Click any scenario button above to trace a request path, or click any diamond or terminal below to inspect its exact evaluation rules.',
    nodes: [],
    edges: [],
    steps: [
      { text: 'Column 1: Deny evaluation — starts denied; explicit Deny terminates immediately.' },
      { text: 'Column 2: Organizations SCPs — member account guardrail ceiling.' },
      { text: 'Column 3: Resource-based policies — same-account allow grants access; cross-account requires both.' },
      { text: 'Column 4: Identity-based policies — managed and inline policies on users, groups, and roles.' },
      { text: 'Column 5: IAM permissions boundaries — caps identity-based policies.' },
      { text: 'Column 6: Session policies — temporary credential filters passed at AssumeRole.' },
    ],
    codeTitle: 'Core AWS evaluation logic rule:',
    code: `// Deterministic Evaluation Rule:
// 1. Any explicit Deny in ANY policy -> DENY (hard stop).
// 2. Otherwise, every applicable ceiling (SCP, Boundary, Session Policy) must permit the action.
// 3. AND at least one grant (Identity Policy or Resource Policy) must allow the action.`,
    rule:
      'Source: AWS Identity and Access Management User Guide (reference_policies_evaluation-logic.html).',
  },
};

const NODE_INFO: Record<string, { title: string; desc: string; rule: string }> = {
  'node-start': {
    title: 'Decision starts with Deny',
    desc: 'By default, all AWS requests start with an implicit deny. The AWS account root user is the sole exception inside its own account.',
    rule: 'Unless a policy explicitly grants access, the request remains denied.',
  },
  'node-eval': {
    title: 'Evaluate all applicable policies',
    desc: 'The AWS enforcement engine gathers all policies applicable to the context: SCPs, RCPs, Resource policies, Identity policies, Permissions boundaries, and Session policies.',
    rule: 'Evaluation looks for an explicit Deny first before looking for any Allows.',
  },
  'node-deny': {
    title: 'Is there an explicit Deny?',
    desc: 'Checks all gathered policy statements for "Effect": "Deny" matching the requested Action, Resource, Principal, and Conditions.',
    rule: 'If an explicit Deny is found anywhere, evaluation terminates immediately. An explicit Deny ALWAYS wins.',
  },
  'node-res-exp-deny': {
    title: 'Final decision: Deny (explicit deny)',
    desc: 'The request is blocked immediately. CloudTrail reports AccessDenied with an explicit deny in the relevant policy.',
    rule: 'No Allow in any policy can overturn an explicit Deny.',
  },
  'node-scp-org': {
    title: 'Is account in Org with applicable SCP?',
    desc: 'Checks whether the account is a member account in AWS Organizations with Service Control Policies enabled.',
    rule: 'Principals in the Organization management account and service-linked roles are exempt from SCPs.',
  },
  'node-scp-allow': {
    title: 'Is there an Allow in the SCP?',
    desc: 'Because SCPs set the maximum available permissions, the action must be explicitly permitted in the SCP hierarchy.',
    rule: 'SCPs never grant access on their own; they only act as a permission ceiling.',
  },
  'node-res-scp-deny': {
    title: 'Final decision: Deny (implicit deny at SCP)',
    desc: 'The member account principal cannot perform the action because the Organization administrator omitted it from the SCP ceiling.',
    rule: 'Error message: "with an explicit deny in a service control policy" or implicit deny.',
  },
  'node-res-has': {
    title: 'Does resource have a resource-based policy?',
    desc: 'Checks if the target resource (Amazon S3 bucket, KMS key, SQS queue, Secrets Manager secret) has an attached policy.',
    rule: 'Resource policies specify who can access the resource and under what conditions.',
  },
  'node-res-allow': {
    title: 'Is there an Allow in the resource policy?',
    desc: 'Checks if the resource policy contains a statement with "Effect": "Allow" matching the principal and action.',
    rule: 'In the same account, a resource policy Allow is sufficient on its own. In cross-account calls, both accounts must allow.',
  },
  'node-res-branch': {
    title: 'See Resource-based policies rule',
    desc: 'In a single account, an Allow in a resource-based policy grants access directly to the resource without needing an identity policy allow.',
    rule: 'Permissions boundaries attached to the caller role do not restrict access granted by a resource-based policy.',
  },
  'node-id-has': {
    title: 'Does principal have an identity-based policy?',
    desc: 'Checks if managed or inline policies are attached to the IAM user, group, or role.',
    rule: 'If neither a resource policy nor an identity policy grants access, the request is implicitly denied.',
  },
  'node-id-allow': {
    title: 'Is there an Allow in the identity policy?',
    desc: 'Checks if the identity policy contains an "Effect": "Allow" matching the action and resource.',
    rule: 'Error when missing: "because no identity-based policy allows the action".',
  },
  'node-res-id-deny': {
    title: 'Final decision: Deny (implicit deny)',
    desc: 'The request is implicitly denied because no policy granted permission.',
    rule: 'Attach an identity-based policy or resource-based policy with Effect: Allow.',
  },
  'node-bnd-has': {
    title: 'Does principal have a permissions boundary?',
    desc: 'Checks if a boundary policy is attached to the IAM entity to cap its maximum permissions.',
    rule: 'Commonly used when delegating IAM role creation to developers.',
  },
  'node-bnd-allow': {
    title: 'Is there an Allow in the permissions boundary?',
    desc: 'The action must be included in the permissions boundary ceiling.',
    rule: 'Effective permission is the intersection of identity policy and permissions boundary.',
  },
  'node-res-bnd-deny': {
    title: 'Final decision: Deny (capped by boundary)',
    desc: 'The identity policy allowed the action, but the permissions boundary omitted it.',
    rule: 'Update the permissions boundary attached to the user or role.',
  },
  'node-sess-is': {
    title: 'Is principal a session principal?',
    desc: 'A session principal is either an assumed IAM role session (AWS STS AssumeRole) or an IAM federated user session.',
    rule: 'Standard IAM users with long-term AKIA keys are NOT session principals and pass directly to Allow.',
  },
  'node-res-allow-top': {
    title: 'Final decision: Allow (Standard Principal)',
    desc: 'An IAM user with AKIA keys or role session without session policies is granted access.',
    rule: 'HTTP 200 OK.',
  },
  'node-sess-has': {
    title: 'Is there a session policy?',
    desc: 'Checks if an inline session policy (--policy or --policy-arns) was passed during the sts:AssumeRole call.',
    rule: 'Session policies act as an extra runtime filter.',
  },
  'node-role-sess': {
    title: 'Is this a role session?',
    desc: 'If no session policy was passed, standard IAM role sessions pass directly to Allow.',
    rule: 'Federated user sessions created via GetFederationToken without a session policy have no permissions.',
  },
  'node-sess-allow': {
    title: 'Is there an Allow in the session policy?',
    desc: 'Checks if the runtime session policy includes the requested action and resource.',
    rule: 'Effective permissions cannot exceed the session policy.',
  },
  'node-res-sess-deny': {
    title: 'Final decision: Deny (session policy restriction)',
    desc: 'The temporary credentials cannot perform the action because the runtime session policy filtered it out.',
    rule: 'Ensure the session policy passed to AssumeRole includes all necessary actions.',
  },
  'node-res-allow-bot': {
    title: 'Final decision: Allow (Session policy permits)',
    desc: 'The request is allowed because both the role identity policy and session policy include the action.',
    rule: 'HTTP 200 OK.',
  },
};

export function initIamFlowchart(): void {
  const board = document.querySelector<HTMLElement>('[data-iam-fc-board]');
  if (!board) return;

  const presetButtons = board.querySelectorAll<HTMLButtonElement>('[data-iam-fc-preset]');
  const nodes = board.querySelectorAll<SVGGraphicsElement>('[data-iam-node]');
  const edges = board.querySelectorAll<SVGPathElement>('.iam-edge');
  const branchLabels = board.querySelectorAll<SVGTextElement>('.iam-branch-lbl');

  const statusBadge = board.querySelector<HTMLElement>('[data-iam-status-badge]');
  const detailTitle = board.querySelector<HTMLElement>('[data-iam-detail-title]');
  const detailNarrative = board.querySelector<HTMLElement>('[data-iam-detail-narrative]');
  const stepsList = board.querySelector<HTMLElement>('[data-iam-steps-list]');
  const codeTitle = board.querySelector<HTMLElement>('[data-iam-code-title]');
  const codeEl = board.querySelector<HTMLElement>('[data-iam-code]');
  const ruleText = board.querySelector<HTMLElement>('[data-iam-rule-text]');

  const root = board;

  function applyScenario(scenarioKey: string): void {
    const data = SCENARIOS[scenarioKey];
    if (!data || !root) return;

    // Update preset buttons state
    presetButtons.forEach((btn) => {
      const active = btn.getAttribute('data-iam-fc-preset') === scenarioKey;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (scenarioKey === 'all') {
      root.removeAttribute('data-has-active-path');
      nodes.forEach((n) => n.classList.remove('is-active-path'));
      edges.forEach((e) => {
        e.classList.remove('is-active-path', 'is-allow-path', 'is-deny-path');
        e.setAttribute('marker-end', 'url(#iam-arrow-default)');
      });
      branchLabels.forEach((l) => l.classList.remove('is-active-path'));
    } else {
      root.setAttribute('data-has-active-path', 'true');

      // Highlight active nodes
      nodes.forEach((n) => {
        const id = n.getAttribute('data-iam-node') ?? '';
        const inPath = data.nodes.includes(id) || data.nodes.includes(n.id);
        n.classList.toggle('is-active-path', inPath);
      });

      // Highlight active edges
      edges.forEach((e) => {
        const inPath = data.edges.includes(e.id);
        e.classList.toggle('is-active-path', inPath);
        if (inPath) {
          const isAllow = data.status === 'allow' && (e.id.includes('allow') || e.id.includes('rolesess-yes') || e.id.includes('sessis-no'));
          const isDeny = data.status === 'deny' && (e.id.includes('deny') || e.id.includes('no'));
          e.classList.toggle('is-allow-path', isAllow);
          e.classList.toggle('is-deny-path', isDeny);
          e.setAttribute(
            'marker-end',
            isAllow ? 'url(#iam-arrow-allow)' : isDeny ? 'url(#iam-arrow-deny)' : 'url(#iam-arrow-active)'
          );
        } else {
          e.classList.remove('is-allow-path', 'is-deny-path');
          e.setAttribute('marker-end', 'url(#iam-arrow-default)');
        }
      });

      // Highlight matching branch labels
      branchLabels.forEach((l) => {
        l.classList.remove('is-active-path');
      });
    }

    // Update Detail Panel
    if (statusBadge) {
      statusBadge.textContent = data.statusText;
      statusBadge.className = `iam-fc-status-badge is-${data.status}`;
    }
    if (detailTitle) detailTitle.textContent = data.title;
    if (detailNarrative) detailNarrative.textContent = data.narrative;
    if (codeTitle) codeTitle.textContent = data.codeTitle;
    if (codeEl) codeEl.textContent = data.code;
    if (ruleText) ruleText.textContent = data.rule;

    if (stepsList) {
      stepsList.innerHTML = '';
      data.steps.forEach((step) => {
        const li = document.createElement('li');
        if (step.pass) li.className = 'is-pass';
        if (step.fail) li.className = 'is-fail';
        li.textContent = step.text;
        stepsList.appendChild(li);
      });
    }
  }

  // Bind preset button clicks
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const scenario = btn.getAttribute('data-iam-fc-preset');
      if (scenario) applyScenario(scenario);
    });
  });

  // Bind node clicks for inspection
  nodes.forEach((node) => {
    node.addEventListener('click', () => {
      const id = node.getAttribute('data-iam-node') || node.id;
      const info = NODE_INFO[id];
      if (!info) return;

      if (detailTitle) detailTitle.textContent = `Inspecting: ${info.title}`;
      if (detailNarrative) detailNarrative.textContent = info.desc;
      if (ruleText) ruleText.textContent = info.rule;
      if (codeTitle) codeTitle.textContent = `AWS IAM Specification Context for "${info.title}":`;
      if (codeEl) codeEl.textContent = `// Evaluation check:\n// Node: ${id}\n// ${info.rule}`;

      // Highlight this single node
      nodes.forEach((n) => n.classList.toggle('is-active-path', n === node));
      board.setAttribute('data-has-active-path', 'true');
    });

    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        node.dispatchEvent(new MouseEvent('click'));
      }
    });
  });

  // Initial scenario: Role Allow
  applyScenario('role-allow');
}
