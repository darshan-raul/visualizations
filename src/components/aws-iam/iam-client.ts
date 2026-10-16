/**
 * Interactive logic for the AWS IAM Kingdom & Request Spine console.
 */
export function initIam() {
  const root = document.querySelector<HTMLElement>('.aws-iam-console');
  if (!root) return;

  const all = <T extends Element = HTMLElement>(s: string, scope: ParentNode = root) => [...scope.querySelectorAll<T>(s)];
  const one = <T extends Element = HTMLElement>(s: string, scope: ParentNode = root) => scope.querySelector<T>(s);
  const write = (s: string, t: string) => { const el = one(s); if (el) el.textContent = t; };

  // Reveal interactive controls once JavaScript is ready
  all('[data-iam-controls]').forEach((el) => { (el as HTMLElement).hidden = false; });

  /* -------------------------------------------------------------
   * 1. Vocabulary Lens Switcher (Analogy + AWS vs Pure AWS)
   * ----------------------------------------------------------- */
  all<HTMLButtonElement>('[data-lens-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lens = btn.dataset.lensToggle ?? 'analogy';
      const isPure = lens === 'aws';
      root.classList.toggle('is-pure-aws', isPure);
      all<HTMLButtonElement>('[data-lens-toggle]').forEach((b) => {
        const active = b.dataset.lensToggle === lens;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
    });
  });

  /* -------------------------------------------------------------
   * 2. Actor Switcher in View 2 (Identities & Workloads)
   * ----------------------------------------------------------- */
  const actors: Record<string, { name: string; arn: string; icon: string; proof: string; delivery: string; risk: string }> = {
    human: {
      name: 'Darshan (IAM User)',
      arn: 'arn:aws:iam::111111111111:user/Darshan',
      icon: '👤',
      proof: 'Console Password + MFA Sign-In, or permanent Access Keys (AKIA...)',
      delivery: 'Local CLI ~/.aws/credentials or IAM User Console session',
      risk: 'Avoid long-term access keys. Prefer assuming temporary roles via Identity Center.',
    },
    ec2: {
      name: 'EC2 Instance Profile (AppServer)',
      arn: 'arn:aws:iam::111111111111:instance-profile/AppServer',
      icon: '💻',
      proof: 'Instance identity document & signature verified by IMDSv2',
      delivery: 'IMDSv2 endpoint: http://169.254.169.254/latest/meta-data/iam/security-credentials/',
      risk: 'Enforce IMDSv2 (hop limit 1) to prevent SSRF credential theft.',
    },
    ecs: {
      name: 'ECS Task Role (PaymentService)',
      arn: 'arn:aws:iam::111111111111:role/PaymentServiceTaskRole',
      icon: '📦',
      proof: 'ECS agent injects token into container environment',
      delivery: 'Container credential provider: AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
      risk: 'Distinct from Task Execution Role (which only pulls images and writes CloudWatch logs).',
    },
    eks: {
      name: 'EKS Pod Identity (BackendPod)',
      arn: 'arn:aws:iam::111111111111:role/BackendPodRole',
      icon: '☸️',
      proof: 'EKS Pod Identity Agent authenticates Kubernetes ServiceAccount to STS',
      delivery: 'EKS credential agent mounts temporary token inside pod container',
      risk: 'Simplifies IAM for Kubernetes without managing OIDC thumbprints or IRSA role trust ARNs.',
    },
    lambda: {
      name: 'Lambda Execution Role (OrderProcessor)',
      arn: 'arn:aws:iam::111111111111:role/OrderProcessorExecutionRole',
      icon: '⚡',
      proof: 'AWS Lambda service assumes role directly before invoking function',
      delivery: 'Lambda runtime environment supplies rotating credentials to AWS SDK',
      risk: 'Ensure function execution role has minimal resource-level permissions.',
    },
    federated: {
      name: 'Federated Identity (Microsoft Entra ID / OIDC)',
      arn: 'arn:aws:sts::111111111111:assumed-role/FederatedDev/alice',
      icon: '🌐',
      proof: 'Cryptographically signed SAML 2.0 assertion or OIDC JWT token',
      delivery: 'sts:AssumeRoleWithWebIdentity or sts:AssumeRoleWithSAML',
      risk: 'Always validate audience (aud) and subject (sub) claims in role trust policy.',
    },
  };

  all<HTMLButtonElement>('[data-actor]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.actor ?? 'human';
      const data = actors[key];
      if (!data) return;

      all('[data-actor]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });

      write('[data-actor-name]', data.name);
      write('[data-actor-arn]', data.arn);
      write('[data-actor-icon]', data.icon);
      write('[data-actor-proof]', data.proof);
      write('[data-actor-delivery]', data.delivery);
      write('[data-actor-risk]', data.risk);
    });
  });

  /* -------------------------------------------------------------
   * 3. STS Credential Expiry Countdown in View 4 (Temporary Credentials)
   * ----------------------------------------------------------- */
  const expiryInput = one<HTMLInputElement>('[data-expiry]');
  const setExpiry = () => {
    const elapsed = Number(expiryInput?.value ?? 0);
    const left = Math.max(0, 60 - elapsed);
    const ring = one<SVGPathElement>('[data-expiry-ring]');
    const card = one('[data-credential-card]');

    if (ring) {
      ring.style.strokeDasharray = `${(left / 60) * 100}, 100`;
    }
    card?.classList.toggle('is-expired', left === 0);

    write('[data-expiry-value]', left > 0 ? `${left} minutes remaining` : 'EXPIRED (0m)');
    write(
      '[data-expiry-feedback]',
      left > 0
        ? `All three credential fields are required to sign AWS requests. The CLI can sign requests until the pass expires in ${left} minutes.`
        : 'EXPIRED · Requests signed with these stale credentials will immediately fail authentication with RequestExpired. Obtain fresh credentials via AssumeRole.'
    );
  };

  expiryInput?.addEventListener('input', setExpiry);
  one('[data-expiry-reset]')?.addEventListener('click', () => {
    if (expiryInput) expiryInput.value = '0';
    setExpiry();
  });

  /* -------------------------------------------------------------
   * 4. Profile Switcher in View 5 (Profiles & SigV4)
   * ----------------------------------------------------------- */
  const profiles: Record<string, { config: string; flag: string }> = {
    prod: {
      config: `[profile prod]\nrole_arn = arn:aws:iam::222222222222:role/ProdReadOnly\nsource_profile = dev\nrole_session_name = darshan\nregion = ap-south-1`,
      flag: '--profile prod',
    },
    dev: {
      config: `[profile dev]\naws_access_key_id = AKIA1111EXAMPLE4567\naws_secret_access_key = ••••••••••••••••••••••••••••••••\nregion = ap-south-1`,
      flag: '--profile dev',
    },
  };

  all<HTMLButtonElement>('[data-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.profile ?? 'prod';
      const data = profiles[key];
      if (!data) return;

      all('[data-profile]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      write('[data-profile-config]', data.config);
      write('[data-profile-flag]', data.flag);
    });
  });

  /* -------------------------------------------------------------
   * 5. Cross-Account Bridge in View 6
   * ----------------------------------------------------------- */
  all<HTMLButtonElement>('[data-bridge-state]').forEach((button) => {
    button.addEventListener('click', () => {
      const state = button.dataset.bridgeState ?? 'ready';
      const ok = state === 'ready';

      all('[data-bridge-state]').forEach((el) => el.setAttribute('aria-pressed', String(el === button)));
      all('[data-bridge-state]').forEach((el) => el.classList.toggle('is-active', el === button));

      const world = one('[data-bridge]');
      world?.classList.toggle('is-broken-caller', state === 'caller');
      world?.classList.toggle('is-broken-trust', state === 'trust');
      world?.classList.toggle('is-broken', !ok);

      one('[data-bridge-output]')?.classList.toggle('is-blocked', !ok);

      write('[data-bridge-caller]', state === 'caller' ? '✕ Blocked: Account A policy omits sts:AssumeRole' : '✓ Outbound Allow: sts:AssumeRole on Prod role');
      write('[data-bridge-trust]', state === 'trust' ? '✕ Blocked: Prod role trust policy rejects Account A' : '✓ Inbound Trust: Trusts arn:aws:iam::111111111111:role/Engineering');
      write('[data-bridge-label]', ok ? 'MUTUAL TRUST BRIDGE (ACTIVE)' : state === 'caller' ? 'DEV OUTBOUND DENIED' : 'PROD TRUST REJECTED');

      write(
        '[data-bsr-title]',
        ok
          ? 'AssumeRole Authorized → Session Credentials Minted'
          : state === 'caller'
          ? 'AccessDenied: Caller lacks permission to assume role'
          : 'AccessDenied: Target role trust policy does not permit caller'
      );

      write(
        '[data-bsr-text]',
        ok
          ? 'Darshan crosses the bridge and enters Prod Fortress wearing the ProdReadOnly uniform as arn:aws:sts::222222222222:assumed-role/ProdReadOnly/darshan.'
          : state === 'caller'
          ? 'Account A (Dev) explicitly denies or omits sts:AssumeRole for this role ARN. The request halts before reaching Account B.'
          : 'Account B (Prod) inspects the caller ARN against its Trust Policy. Since Engineering is not trusted, STS refuses to mint the uniform badge.'
      );

      write(
        '[data-bridge-feedback]',
        ok
          ? 'AssumeRole succeeds. Cross-account access requires a handshake: caller outbound permission and target trust policy must both agree.'
          : 'Access Denied: The trust bridge collapsed because one of the two accounts rejected the handshake.'
      );
    });
  });

  /* -------------------------------------------------------------
   * 6. Identity Center Account Switchboard in View 7
   * ----------------------------------------------------------- */
  const ports: Record<string, { set: string; role: string }> = {
    dev: { set: 'AdministratorAccess', role: 'AWSReservedSSO_AdministratorAccess_4a17b8c2' },
    prod: { set: 'ReadOnlyAccess', role: 'AWSReservedSSO_ReadOnlyAccess_8f29c4e1' },
    test: { set: 'PowerUserAccess', role: 'AWSReservedSSO_PowerUserAccess_3d98a120' },
    security: { set: 'SecurityAuditor', role: 'AWSReservedSSO_SecurityAuditor_7c51e934' },
  };

  all<HTMLButtonElement>('[data-port]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.port ?? 'prod';
      const data = ports[key];
      if (!data) return;

      all('[data-port]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      write('[data-prov-set]', data.set);
      write('[data-prov-role]', data.role);
    });
  });

  /* -------------------------------------------------------------
   * 7. 5-Gate Checkpoint Corridor in View 8
   * ----------------------------------------------------------- */
  const scenarioSelect = one<HTMLSelectElement>('[data-eval-scenario]');
  let activeGateIndex = 0;

  const gateNames = [
    'Gate 1: Organization SCP',
    'Gate 2: Resource Policy (Bucket Policy)',
    'Gate 3: Identity Policy',
    'Gate 4: Permissions Boundary',
    'Gate 5: Session Policy',
  ];

  const updateCorridor = () => {
    const scenario = scenarioSelect?.value ?? 'allow';

    // Gate statuses: true = green/open, false = red/closed
    const gateStatus: [boolean, string][] = [
      scenario === 'scp' ? [false, 'Slammed Red!'] : [true, 'Permits'],
      scenario === 'deny' ? [false, 'Slammed Red!'] : [true, 'No Deny'],
      scenario === 'missing' ? [false, 'Implicit Deny'] : [true, 'Allows'],
      scenario === 'boundary' ? [false, 'Slammed Red!'] : [true, 'Within Ceiling'],
      [true, 'Permits'],
    ];

    gateStatus.forEach(([isOpen, mark], i) => {
      write(`[data-gate-mark="${i}"]`, mark);
      const gateEl = one(`[data-gate="${i}"]`);
      if (gateEl) {
        gateEl.classList.toggle('is-open', isOpen);
        gateEl.classList.toggle('is-denied', !isOpen);
      }
    });

    const isAllowed = scenario === 'allow';
    const verdict = one('[data-eval-verdict]');
    if (verdict) {
      verdict.classList.toggle('is-allowed', isAllowed);
      verdict.classList.toggle('is-denied', !isAllowed);

      const verdicts: Record<string, string> = {
        allow: 'ALLOWED · Identity grant survives all guardrails. The request reaches the S3 Treasury Vault (200 OK).',
        deny: 'DENIED (403 AccessDenied) · Gate 2 (Bucket Policy) explicitly denied s3:GetObject. Explicit Deny overrides all allows.',
        scp: 'DENIED (403 AccessDenied) · Gate 1 (SCP Kingdom Law) disallows S3 actions for this member account. Kingdom law cannot be bypassed.',
        boundary: 'DENIED (403 AccessDenied) · Gate 4 (Permissions Boundary) omitted s3:GetObject. The identity grant exceeded its rank ceiling.',
        missing: 'DENIED (403 AccessDenied) · Gate 3 (Identity Policy) had no matching Allow statement. AWS defaults to Implicit Deny.',
      };
      verdict.textContent = verdicts[scenario] ?? verdicts.allow;
    }

    // Update inspector for active gate
    const gateBodies: Record<number, { json: string; status: string; explain: string }> = {
      0: {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: scenario === 'scp' ? 'Deny' : 'Allow',
            Action: 's3:*',
            Resource: '*',
          }],
        }, null, 2),
        status: scenario === 'scp' ? 'Explicit Deny in SCP' : 'Permits S3 via FullAWSAccess',
        explain: scenario === 'scp'
          ? 'Kingdom Law SCP denies S3 in this account. Even an AdministratorAccess identity is blocked.'
          : 'SCPs define the maximum permission ceiling for member accounts. This example permits S3 actions.',
      },
      1: {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: scenario === 'deny' ? 'Deny' : 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::prod-artifacts/releases/app.zip',
            Condition: scenario === 'deny' ? { Bool: { 'aws:SecureTransport': 'true' } } : undefined,
          }],
        }, null, 2),
        status: scenario === 'deny' ? 'Explicit Deny Statement' : 'No conflicting Deny',
        explain: scenario === 'deny'
          ? 'The bucket door has an explicit Deny rule that matches this request. Under AWS evaluation logic, any explicit deny trumps all allows.'
          : 'A bucket policy can grant access or deny it. Here, no deny matches, so evaluation proceeds.',
      },
      2: {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: scenario === 'missing' ? [] : [{
            Effect: 'Allow',
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::prod-artifacts/releases/app.zip',
          }],
        }, null, 2),
        status: scenario === 'missing' ? 'No matching statement' : 'Grants s3:GetObject',
        explain: scenario === 'missing'
          ? 'No statement grants permission. AWS follows the default rule: Implicit Deny.'
          : 'The identity policy attached to the role explicitly grants GetObject on the release artifact.',
      },
      3: {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: scenario === 'boundary' ? 's3:ListBucket' : 's3:GetObject',
            Resource: '*',
          }],
        }, null, 2),
        status: scenario === 'boundary' ? 'Omits s3:GetObject' : 'Permits s3:GetObject',
        explain: scenario === 'boundary'
          ? 'Permissions boundaries set the maximum ceiling for an identity. Because GetObject is omitted, the identity grant cannot exceed it.'
          : 'The boundary permits s3:GetObject, so the identity policy grant survives this ceiling checkpoint.',
      },
      4: {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: 's3:GetObject',
            Resource: '*',
          }],
        }, null, 2),
        status: 'Permits s3:GetObject',
        explain: 'Session policies are optional filters passed during AssumeRole. This session policy permits GetObject.',
      },
    };

    const activeData = gateBodies[activeGateIndex] ?? gateBodies[0];
    write('[data-policy-label]', `${gateNames[activeGateIndex]} · Selected Statement`);
    write('[data-policy-status]', activeData.status);
    write('[data-policy-json]', activeData.json);
    write('[data-policy-explain]', activeData.explain);

    all<HTMLButtonElement>('[data-gate]').forEach((g, idx) => {
      g.setAttribute('aria-pressed', String(idx === activeGateIndex));
    });
  };

  scenarioSelect?.addEventListener('change', updateCorridor);
  one('[data-eval-reset]')?.addEventListener('click', () => {
    if (scenarioSelect) scenarioSelect.value = 'allow';
    activeGateIndex = 0;
    updateCorridor();
  });

  all<HTMLButtonElement>('[data-gate]').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      activeGateIndex = idx;
      updateCorridor();
    });
  });

  updateCorridor();

  /* -------------------------------------------------------------
   * 8. Handle Anchor Aliases on Hash Change
   * ----------------------------------------------------------- */
  const aliasMap: Record<string, string> = {
    'identity-map': 'kingdom',
    'request-journey': 'kingdom',
    'users-roles': 'workload-identity',
    'principal-who-signed-the-request': 'workload-identity',
    'policies': 'assume-role',
    'policies-where-can-permission-come-from': 'assume-role',
    'sessions-what-happens-when-a-role-is-assumed': 'temporary-credentials',
    'cross-account-which-two-sides-must-agree': 'cross-account',
    'federation': 'identity-center',
    'organizations': 'policy-evaluation',
    'boundaries': 'policy-evaluation',
    'guardrails-how-is-power-capped': 'policy-evaluation',
    'evaluation-why-was-it-allowed-or-denied': 'policy-evaluation',
    'role-and-session-principals-are-different': 'policy-evaluation',
    'principal-grant-title': 'policy-evaluation',
    'least-privilege-how-do-you-refine-access': 'real-world-flows',
    'diagnose-an-accessdenied': 'real-world-flows',
  };

  const handleHash = () => {
    const raw = location.hash.replace(/^#/, '');
    const targetViewId = aliasMap[raw];
    if (targetViewId) {
      const link = one<HTMLAnchorElement>(`[data-lsn-link][href="#${targetViewId}"]`);
      if (link) {
        link.click();
      }
    }
  };

  window.addEventListener('hashchange', handleHash);
  if (location.hash) {
    handleHash();
  }
}
