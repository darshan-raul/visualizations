# AWS Identity and Credential Flows — visual specification

- **Topic:** AWS identity pipeline and credential flows.
- **Status and version:** Integrated v3.1, October 15, 2026. v3.1 puts a six-view "Four questions" chain (who, what, how, from where) ahead of the six-stage pipeline at the owner's request; the pipeline and its focused views from v3.0 are unchanged and follow it. The prototype file remains the v3.0 design record.
- **Target audience:** Engineers learning AWS identity from source to signed, authorized resource request.
- **Page promise:** Show the four questions AWS asks of every request and how the answers combine into a decision, then how a user or workload obtains or selects AWS credentials and signs the request.
- **Persistent scenario:** Maya in account 111111111111 reads the fictional reports bucket in account 222222222222. Other source paths keep the same S3 goal where possible. ARNs, outputs and timestamps are teaching fixtures.
- **Scope and non-goals:** Human and workload credential entry points, IAM Identity Center, STS exchanges, SigV4, policy boundaries, renewal and diagnosis. v3.1 adds a deterministic model of one S3 decision (explicit deny, SCP, bucket policy, identity policy, permissions boundary; one evaluation per account across accounts). It is not a general IAM policy evaluator or a live AWS simulator: RCPs, session policies, ACLs, S3 Block Public Access and other services' rules are left out and named as left out.
- **Visual thesis:** A six-column identity pipeline fills the opening canvas. Selecting a common path lights the relevant stages and draws a matching six-step trace. A credential example panel shows the selected exchange. Focused views below the grouped topic navigation handle details the pipeline cannot fit.
- **Semantic color and diagram grammar:** Purple denotes identity, trust and policy context; cyan/teal denotes normal credential delivery and requests; green means permitted; red means denied; amber is reserved for constraints. Solid arrows link runtime steps. Scope boxes show accounts/processes. A selected card highlight means this route uses or discusses that item, not that every AWS path performs every item. No loop, timing or STS call is inferred from left-to-right placement alone.

## Reference adaptation and accuracy worksheet

The reference’s six numbered stages, arrows, selectable flow strip, credential example panel and bottom concept row are the production page’s composition. The site’s persistent masthead, grouped index, stable route and sources remain. The grouped index is a row of native disclosures above the pipeline; this topic-specific placement departs from the brief’s normal side index to preserve the six-column view. The deeper views remain in the same console. The first view’s sample panel serves as its contextual inspector; subsequent views use the shared right/bottom inspector.

Key corrections to the supplied image:

1. **Direct IAM user keys:** Access key ID and secret can sign an API request without STS. A session token accompanies temporary credentials, not every AWS request.
2. **Identity Center:** CLI account access through a permission set uses an Identity Center token and GetRoleCredentials. This token is distinct from the AWS session token used in SigV4 requests.
3. **STS paths:** Ordinary AssumeRole is signed with existing AWS credentials. AssumeRoleWithWebIdentity and AssumeRoleWithSAML use trusted tokens/assertions. GetSessionToken creates a temporary user session; GetFederationToken is a narrower IAM-user-backed broker API and requires a session policy for permissions. Neither is the default workforce path shown here.
4. **Workload providers:** EC2, ECS, Lambda, IRSA, EKS Pod Identity and IoT Core certificate credential provider deliver credentials differently. A Lambda function does not call AssumeRole merely to use its own execution role.
5. **Authorization:** Role trust is evaluated at the assumption request. The later S3 request has a separate policy decision. Boundaries, session policies and Organizations controls constrain rather than grant; direct resource-policy grants and same-account trust have documented nuances handled in the related authorization explorer.
6. **Signing:** The secret key stays with the signer. The access key ID and SigV4 signature identify/prove the chosen credential, but a valid signature does not grant ListBucket.
7. **Time and attribution:** Refresh obtains a new credential set; logout does not instantly revoke every issued set. Session names are labels; source identity and tags require controlled assignment.
8. **Current limits and CLI behavior:** Verified October 15, 2026 against AWS documentation. CLI v2.22.0+ defaults to PKCE for SSO login; role chaining caps a target session at one hour. Values in snippets are fictional.

## Concept groups and navigation

Four questions; Credential pipeline (was "Interactive flow"); Identity sources; Authentication; Authorization; Assume role; Across accounts; Services & use cases. Native disclosure groups are short horizontal tabs with one expanded after navigation; the selected view and 01/12 count remain available. The index is responsive and wraps on narrow screens. Direct fragments, browser Back/Forward and old section aliases open the corresponding view. The first canvas is #identity-map to preserve its prior deep link; #identity-map--user and #identity-map--role also target the relevant first-stage objects.

## Narrative sequence

| # | Index group / view | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| F1 | Four questions / One request | Every AWS request answers four questions | Request diagram that splits into WHO, WHAT, FROM WHERE and HOW, with the request context filling in | Five steps | Write the request as principal, action, resource and context before reading any policy. |
| F2 | Four questions / No allow, no access | Nothing is allowed until a policy says so | Request, two policies, decision, bucket + gate trail | Three steps | With no matching Allow the answer is no; an Allow must match the action and the exact resource form (ListBucket → bucket ARN). |
| F3 | Four questions / From where | A condition decides whether an Allow applies | Three origins (office, home, EC2 via VPC endpoint) to S3 + gate trail | Four choices | A failed or missing condition key drops its Allow out (implicit deny), which is different from a Deny. aws:SourceIp is absent through a VPC endpoint; use aws:SourceVpce. |
| F4 | Four questions / Deny wins | One Deny beats every Allow, and ceilings cap the rest | Deny → SCP → Allow → boundary chain + gate trail | Four choices | One matching Allow, under every ceiling; one matching Deny ends it. SCPs and boundaries never grant. |
| F5 | Four questions / Two accounts | Across accounts, both sides must say yes | Two account zones + gate trail per account | Four choices | Cross-account needs identity policy and bucket policy; in one account either can allow (role trust and KMS key policies excepted). |
| F6 | Four questions / Try it | Ask the four questions yourself | Four pillar fieldsets, decision trail, request context, both policies as JSON | Four presets + free controls | Name the four answers, look for a Deny, check each ceiling, find the Allow, in each account the request touches. |
| 1 | Credential pipeline / Pipeline | From identity to authorized request | Six-stage pipeline + path workbench | Nine route presets + five code samples | The source proves who it is. A provider supplies credentials. Each signed request is authorized for its action and resource. |
| 2 | Identity sources / Workforce login | Browser sign-in is the beginning of the credential journey | Credential journey strip | Manual steps | The Identity Center access token gets role credentials; the AWS session token accompanies the signed AWS request. |
| 3 | Identity sources / Permission sets | Identity Center configures a role inside the account | Identity Center provisioning boundary | Static inspection | The permission set is the template; an account-side IAM role is what the issued session uses. |
| 4 | Identity sources / Workload identity | Workloads need a credential provider, not a human login | Workload provider comparison | Named choices | Identify the workload’s role and provider. An OIDC identity token can bootstrap AWS credentials without an AWS access key. |
| 5 | Authentication / Signed request | The CLI signs the request without sending the secret key | Request signing envelope | Static inspection | The secret computes the signature locally; the service still needs to authorize the requested action. |
| 6 | Assume role / Cross-account | Cross-account access has two separate requests | Two-account decision board | Named choices | Permission to create a role session and permission to use a resource are different decisions. |
| 7 | Assume role / Role chaining | A second role starts a new permission context | Session duration comparison | Named choices | Role chaining creates separate credentials with a one-hour maximum; source permissions do not accumulate into the new session. |
| 8 | Authorization / Assume or pass? | Who should receive the role’s credentials? | Credential recipient comparison | Named choices | AssumeRole returns credentials to the caller. PassRole authorizes a service-role association. |
| 9 | Across accounts / Vendor access | ExternalId binds the deputy to the customer | Tenant binding decision | Named choices | The vendor chooses ExternalId from its authenticated tenant record; a customer-supplied role ARN alone cannot choose the tenant. |
| 10 | Services & use cases / Expiry & refresh | An upstream login and AWS credentials have different clocks | Two-clock timeline | Named choices | A provider obtains a new credential set. It does not extend the lifetime of the old one. |
| 11 | Across accounts / Session context | Trace the request back through the role session | Annotated CloudTrail identity | Static inspection | Audit the acting session and its issuer. Constrain the context that callers are allowed to attach. |
| 12 | Services & use cases / Find the failure | Find the first credential boundary that failed | Symptom and evidence lab | Named choices | First verify the provider and actual caller; then separate issuance failure from resource authorization failure. |

## Four questions chain (v3.1)

Requested by the owner on October 15, 2026 from a "who, what, how, from where" policy-simulator concept. The concept was adapted rather than copied; corrections made to it:

1. **Conditions are part of a statement, not a final stage.** A condition that fails, or whose key is missing from the request, makes its own Allow not apply; the result is an implicit deny unless another Allow matches.
2. **Evaluation order follows AWS's documentation:** explicit deny across all policies, then RCPs and SCPs, then resource-based, identity-based, permissions boundary and session policies. RCPs and session policies are named and left out of the model.
3. **Resource forms are exact.** s3:ListBucket and s3:DeleteBucket act on `arn:aws:s3:::bucket`; s3:GetObject on `bucket/*`. The concept's DeleteBucket-on-objects pairing is not used.
4. **Same account vs cross account.** In one account an identity or a resource policy can allow; a bucket-policy grant to a role ARN is still capped by the role's boundary. Across accounts both evaluations must allow. Role trust and KMS key policies are the documented same-account exceptions.
5. **MFA is not a simulator control.** aws:MultiFactorAuthPresent is only in the context for temporary credentials; the From where view carries AWS's BoolIfExists caveat instead.
6. **Anonymous requests** have no caller account, so SCPs and identity policies don't apply; S3 Block Public Access is named as left out.

Implementation: `src/components/identity/iam-eval.ts` is the single model. The gate panels in views F2–F5 and the simulator (`IamPillars.astro`, `pillars-client.ts`, `pillars-view.ts`) are generated from it, so they cannot disagree. Without JavaScript the simulator shows the first preset worked through with its controls disabled. Sources: IAM "How AWS enforcement code logic evaluates requests", "Processing the request context", "Cross-account policy evaluation logic", "AWS global condition context keys", Organizations SCPs, S3 policy actions and VPC-endpoint bucket policies; read October 15, 2026.

Acceptance checks (in `scripts/verify-identity-console.mjs`): the page opens on F1; each preset gives its documented verdict; turning on the bucket policy for the cross-account preset allows it; the same-account bucket-policy grant is denied by an unchecked boundary; an endpoint request against an IP condition reports the missing aws:SourceIp; anonymous disables identity, SCP and boundary controls; no page overflow at 1536, 1100, 760, 390 and 320 px; all 18 views render without JavaScript.

## Visual 1 — Interactive identity pipeline

### Purpose

Make the whole mechanism visible before asking readers to reason about specific STS APIs. The six stages answer who acts, what proof starts the path, who supplies AWS credentials, what goes on the wire, where permission is evaluated, and what resource action follows.

### Learner question

“From a human or workload identity to an AWS resource request, what actually happens, and where can it fail?”

### Persistent scenario state

Default: Maya already has a workforce role session in account 111111111111 and needs to list reports through SupportRead in account 222222222222. Other presets replace the source and credential path while keeping the resource goal. S3 denied differs only at the last authorization boundary.

### Concepts and actors

1. Identity source: human user, workload, external identity, Device/IoT using an X.509 certificate and AWS IoT policy, AWS service. IAM role may be the resulting acting identity or an existing caller. The source is not automatically an IAM user.
2. Authenticate: access keys, Identity Center browser sign-in/access token, SAML/OIDC proof, or a service/provider path. These are alternatives, not sequential mandatory steps.
3. Obtain/select credentials: direct user key; Identity Center GetRoleCredentials; STS AssumeRole; STS web identity; STS SAML; GetFederationToken for IAM-user-backed brokers; GetSessionToken for IAM-user temporary credentials; workload and IoT providers. Direct signing is deliberately shown here to avoid implying an STS call.
4. Sign request: a SigV4 header-signed S3 example, access key ID, signature, optional session token for temporary credentials, secret local to the signer.
5. Authorization: identity/resource policies, boundaries and Organizations guardrails, explicit deny. For a cross-account role route, target trust was checked at its earlier AssumeRole call, not at S3.
6. AWS resource: S3 as the active example plus EC2, RDS, Lambda, EKS and Secrets Manager API destinations.

### Composition

The stage grid spans the full main canvas, with six equal-reading vertical panels at wide desktop widths and numbered badges. Each stage uses compact clickable icon/text entries and a solid arrow to the next stage. The path workbench follows: five common routes, a disclosure for four additional routes, the six-step selected trace and a right panel. That panel shows either the selected credential example or a clicked component’s explanation and primary-source link, so one click changes one thing. A six-concept row sits beside an advanced-topic link panel; a one-line takeaway finishes the canvas. Sources and footer remain beneath it. The selected path emphasizes relevant entries; unrelated alternatives are dimmed but remain visible. The main read path fits at 1536 px without horizontal page scrolling. At narrower widths, stages become 3, then 2, then 1 column; the six-step trace reflows independently.

### Interaction

All 29 stage entries are native buttons. A click selects one entry and replaces the credential example with a short explanation and AWS reference; clicking it again or closing the panel restores the example. The current route does not change. Where a matching route exists, a separate “Show route” action makes that transition explicit. Nine route buttons select IAM user keys, Identity Center, cross-account role, EKS IRSA, EC2 instance role, Lambda execution, SAML user, OIDC workload and S3 denied. Five common routes are immediately visible; four additional routes sit in a native disclosure. Default is cross-account role so the initially visible CLI AssumeRole sample matches the route. Each route selection changes the six trace cards, selected stage entries, result color and suggested credential sample, and clears any component explanation. Five native buttons choose Direct keys, CLI AssumeRole, SDK provider, Web identity and SAML assertion examples independently. aria-pressed identifies each current choice; the live region announces the selected item. Selecting S3 denied keeps the new target credentials and changes the later S3 result. Re-selecting the default restores the default route. No autoplay or hidden timing is needed.

### Data or content states

- **IAM user keys:** IAM user → Access key → Current credentials → SigV4 request → IAM policies → S3 ListBucket. Long-term IAM user keys can sign API requests directly. They do not become temporary just because the request passes an identity stage.
- **Identity Center:** Maya → Browser sign-in → GetRoleCredentials → AWS role credentials → Evaluate request → S3 ListBucket. The Identity Center access token obtains AWS role credentials. It is different from the AWS session token that accompanies the resource request.
- **Cross-account role:** Maya’s role session → Signed STS request → AssumeRole → New SupportRead set → Target-role policies → S3 ListBucket. AssumeRole and the later S3 request are two authorizations. A valid target session can still be denied at S3.
- **EKS Pod · IRSA:** Pod service account → OIDC token → AssumeRoleWithWebIdentity → Role credentials → Pod request policy → S3 ListBucket. IRSA uses a Kubernetes service account token with STS web identity. EKS Pod Identity uses a different delivery path.
- **EC2 instance role:** EC2 workload → Instance profile → IMDS provider → Role credentials → Role policies → S3 ListBucket. The SDK’s EC2 provider supplies temporary credentials. Application code does not need to call AssumeRole for its own instance role.
- **Lambda execution:** Lambda function → Service trust → Runtime credentials → Execution-role session → Role policies → S3 ListBucket. iam:PassRole can authorize the role association when the function is configured; Lambda later uses the execution role.
- **Federated user · SAML:** Workforce user → SAML assertion → AssumeRoleWithSAML → Role credentials → Role policies → S3 ListBucket. The SAML assertion is the input to the STS exchange; it is not the AWS credential set returned for signing.
- **Workload · OIDC:** CI workload → OIDC identity token → AssumeRoleWithWebIdentity → Role credentials → Role policies → S3 ListBucket. A matching token, configured provider and role trust are required. An arbitrary OIDC token grants no AWS access.
- **S3 denied:** Maya’s role session → Signed STS request → AssumeRole allowed → Valid SupportRead set → S3 denies ListBucket → No listing. The failure is at the later S3 authorization boundary. Reworking the role trust policy would not add s3:ListBucket.

Credential examples: Direct keys; CLI · AssumeRole; SDK · provider; Web identity; SAML assertion. All show fictional or redacted values; no code executes AWS calls.

### Failure or edge state

S3 denied: AssumeRole succeeds and yields a SupportRead set; the later s3:ListBucket permission check denies. IAM user keys: no temporary exchange and no AWS session token. Both edges are visible from the first screen.

### Required copy

“Who can access what, and how?”; “Identity source”; “Authenticate”; “Obtain credentials”; “Sign the request”; “Authorization”; “AWS resource”; “A valid role session can still be denied at S3.” The bottom takeaway distinguishes source proof, credential selection and per-request authorization.

### Accuracy caveats

The six columns are a learning path, not an AWS internal sequence diagram. Some sources start with valid AWS credentials; Identity Center uses GetRoleCredentials; workload roles may arrive through providers. Guardrails do not supply permission on their own. A successful IAM user key path has no session token. Source-path details are described beside each route.

### Mobile behavior

At 320 px the six panels stack, entries form two compact columns inside each panel, and selecting an entry scrolls its explanation into view. The route buttons scroll horizontally, and selected trace cards become two columns. Code wraps within its own panel, and key concepts become two columns. The page has no horizontal overflow. At 200% CSS zoom the layout reflows without clipping.

### Accessibility

Stage numbers, titles and text labels carry sequence and state without color. All stage entries and route buttons support Enter/Space, expose pressed state and have visible focus. The selected entry explanation and route are announced politely. Reduced motion disables transitions and smooth scrolling. Without JavaScript, all nine flow states and all five examples are server-rendered in the same console after the pipeline; stage entry labels remain readable in source order while their enhancement-only buttons are disabled.

### Source anchors

- [STS AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [Identity Center GetRoleCredentials](https://docs.aws.amazon.com/singlesignon/latest/PortalAPIReference/API_GetRoleCredentials.html)
- [STS AssumeRoleWithWebIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html)
- [SigV4](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html)
- [IAM policy evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [GetFederationToken, for the special broker exception](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetFederationToken.html)
- [IoT Core credential provider](https://docs.aws.amazon.com/iot/latest/developerguide/authorizing-direct-aws.html)

### Acceptance checks

- All six panels and nine selected routes render; each route has exactly one visible trace and one suggested credential example under enhancement.
- IAM user keys select Direct keys and display no STS call/session token. Cross-account selects CLI AssumeRole. The denied preset retains issued credentials and blocks S3.
- The group navigation remains visible and opens each deeper view. Reloading a deep link and browser history restore the correct group/view.
- No-JavaScript exposes the complete route and example inventory. Desktop, mobile, keyboard, reduced motion and 200% zoom checks pass.

## Visual 2 — Workforce login

### Purpose

Start with the workforce profile in account 111111111111. The CLI obtains AWS credentials after the human signs in.

### Learner question

Browser sign-in is the beginning of the credential journey

### Persistent scenario state

The workforce profile points to an sso-session, an account, and an assigned role. It tells the CLI where to obtain credentials; it contains no AWS secret key.

### Concepts and actors

- Read profile: Not established; No AWS credentials yet
- Sign in: Maya at the identity source; Browser authentication in progress
- Cache token: Maya’s Identity Center session; Identity Center access token
- Get credentials: AWSReservedSSO_DeveloperAccess… / maya; Temporary AWS role credentials
- Sign API call: arn:aws:sts::111111111111:assumed-role/AWSReservedSSO_DeveloperAccess_a1b2c3d4e5f67890/maya; SigV4 + AWS session token

### Composition

Grouped index: **Identity sources**; stable fragment #workforce-login. Five numbered stations: profile, browser sign-in, Identity Center token, GetRoleCredentials, signed S3 request. A single selected station changes the exchange drawing; source and resulting AWS token are separate objects. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “The Identity Center access token gets role credentials; the AWS session token accompanies the signed AWS request.”

### Interaction

Native buttons choose 5 states; default is Read profile. Numbered steps can be revisited and Restart returns to the first.  Diagram and inspector change together, and a polite live region reports the selected result.

### Data or content states

- **Read profile:** Configuration selects an account and role. The workforce profile points to an sso-session, an account, and an assigned role. It tells the CLI where to obtain credentials; it contains no AWS secret key. Current credentials: No AWS credentials yet.
- **Sign in:** Authenticate Maya through the browser. aws sso login starts the configured Identity Center authorization flow. The identity source authenticates Maya. Current CLI v2 uses PKCE by default; device authorization is an explicit alternative. Current credentials: Browser authentication in progress.
- **Cache token:** The CLI holds an Identity Center access token. A successful login establishes the Identity Center session and tool-managed token cache. That access token is used with Identity Center APIs; it is not the AWS session token used for a SigV4 S3 request. Current credentials: Identity Center access token.
- **Get credentials:** GetRoleCredentials returns AWS role credentials. When a command needs AWS credentials, the CLI provider calls GetRoleCredentials for the selected account and assigned role using the Identity Center access token. AWS returns an access key ID, secret key, session token, and expiration. Current credentials: Temporary AWS role credentials.
- **Sign API call:** The resource request uses the AWS credential set. The CLI signs the AWS API request with the selected AWS credentials and includes the AWS session token. Identity Center sign-in and authorization of that resource request are separate decisions. Current credentials: SigV4 + AWS session token.

### Failure or edge state

Verified October 15, 2026: CLI v2.22.0 and later default to PKCE. --use-device-code selects device authorization. Cache files are tool-managed.

### Required copy

**Takeaway:** The Identity Center access token gets role credentials; the AWS session token accompanies the signed AWS request.

**Material caveat:** Verified October 15, 2026: CLI v2.22.0 and later default to PKCE. --use-device-code selects device authorization. Cache files are tool-managed.

### Accuracy caveats

Verified October 15, 2026: CLI v2.22.0 and later default to PKCE. --use-device-code selects device authorization. Cache files are tool-managed. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [AWS CLI: configure Identity Center](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)
- [AWS CLI: Identity Center concepts](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso-concepts.html)
- [Identity Center: GetRoleCredentials](https://docs.aws.amazon.com/singlesignon/latest/PortalAPIReference/API_GetRoleCredentials.html)

### Acceptance checks

- Direct #workforce-login loads this view and expands Identity sources; Back/Forward restores the prior view.
- All 5 states update the drawing and contextual text, and are readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 3 — Permission sets

### Purpose

The group assignment selects who gets access; the permission set describes the account-side role to provision.

### Learner question

Identity Center configures a role inside the account

### Persistent scenario state

Assigning a user or group to an AWS account through a permission set causes Identity Center to create and manage an AWSReservedSSO_ role in that account. The permission set is a template; the account role supplies the permissions used by its sessions.

### Concepts and actors

- Assignment to account role: Account-side AWSReservedSSO_ role; Configuration creates no credential in your profile

### Composition

Grouped index: **Identity sources**; stable fragment #permission-sets. Identity Center assignment and permission-set configuration occupy the left scope. The provisioned account-side AWSReservedSSO role sits in the right account scope, connected by a dashed configuration arrow. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “The permission set is the template; an account-side IAM role is what the issued session uses.”

### Interaction

Static inspection: more controls would not clarify this comparison.

### Data or content states

- **Assignment to account role:** A permission set provisions an account-side IAM role. Assigning a user or group to an AWS account through a permission set causes Identity Center to create and manage an AWSReservedSSO_ role in that account. The permission set is a template; the account role supplies the permissions used by its sessions. Current credentials: Configuration creates no credential in your profile.

### Failure or edge state

Removing all assignments for a permission set in an account and assigning it again can change the role’s ARN suffix. Review policies that reference that ARN.

### Required copy

**Takeaway:** The permission set is the template; an account-side IAM role is what the issued session uses.

**Material caveat:** Removing all assignments for a permission set in an account and assigning it again can change the role’s ARN suffix. Review policies that reference that ARN.

### Accuracy caveats

Removing all assignments for a permission set in an account and assigning it again can change the role’s ARN suffix. Review policies that reference that ARN. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [Identity Center: provisioned IAM roles](https://docs.aws.amazon.com/singlesignon/latest/userguide/identity-center-and-iam-roles.html)
- [AWS CLI: configure Identity Center](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)

### Acceptance checks

- Direct #permission-sets loads this view and expands Identity sources; Back/Forward restores the prior view.
- The static diagram and explanation remain readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 4 — Workload identity

### Purpose

Keep the same report-reading job and change where it runs. Watch what supplies the SDK’s credential set.

### Learner question

Workloads need a credential provider, not a human login

### Persistent scenario state

Attach the role through an instance profile. An SDK’s EC2 provider retrieves temporary credentials through Instance Metadata Service; the workload signs requests as that role’s session. IMDS access and instance configuration affect delivery.

### Concepts and actors

- EC2: ReportWorker session; IMDS → SDK credential provider
- ECS task: ReportTask session; Container provider → SDK
- Lambda: ReportFunction execution-role session; Runtime credential provider → SDK
- OIDC workload: Federated workload role session; OIDC token → STS → AWS credentials

### Composition

Grouped index: **Identity sources**; stable fragment #workload-credentials. Four alternatives retain the report-reading job while comparing EC2 instance metadata, ECS task role, Lambda execution role and OIDC web identity. The final SDK request is held constant. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “Identify the workload’s role and provider. An OIDC identity token can bootstrap AWS credentials without an AWS access key.”

### Interaction

Native buttons choose 4 states; default is EC2. Selecting the first option restores the initial comparison.  Diagram and inspector change together, and a polite live region reports the selected result.

### Data or content states

- **EC2:** An instance profile connects EC2 to its role. Attach the role through an instance profile. An SDK’s EC2 provider retrieves temporary credentials through Instance Metadata Service; the workload signs requests as that role’s session. IMDS access and instance configuration affect delivery. Current credentials: IMDS → SDK credential provider.
- **ECS task:** Application credentials come from the task role. The container credential provider receives credentials for the task IAM role. The task execution role is a separate role used by ECS for platform work such as image pulls and log delivery; it does not substitute for the application’s task role. Current credentials: Container provider → SDK.
- **Lambda:** Lambda supplies execution-role credentials. The service assumes the execution role and supplies temporary credentials to the function runtime. Function code uses the SDK’s normal provider; it does not need to call AssumeRole just to use its own execution role. Current credentials: Runtime credential provider → SDK.
- **OIDC workload:** A workload token can bootstrap AWS access. AssumeRoleWithWebIdentity validates an identity-provider token against the configured provider and role trust. It does not require pre-existing AWS credentials. Restrict the intended audience and subject; possession of an arbitrary OIDC token grants no AWS role access. Current credentials: OIDC token → STS → AWS credentials.

### Failure or edge state

Provider support, refresh and precedence vary by SDK and version. IAM user access keys can also sign AssumeRole, but they are not the workforce path shown here.

### Required copy

**Takeaway:** Identify the workload’s role and provider. An OIDC identity token can bootstrap AWS credentials without an AWS access key.

**Material caveat:** Provider support, refresh and precedence vary by SDK and version. IAM user access keys can also sign AssumeRole, but they are not the workforce path shown here.

### Accuracy caveats

Provider support, refresh and precedence vary by SDK and version. IAM user access keys can also sign AssumeRole, but they are not the workforce path shown here. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [SDKs: credential providers](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html)
- [EC2: roles and instance profiles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [ECS: task role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [Lambda: execution role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [STS: AssumeRoleWithWebIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html)

### Acceptance checks

- Direct #workload-credentials loads this view and expands Identity sources; Back/Forward restores the prior view.
- All 4 states update the drawing and contextual text, and are readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 5 — Signed request

### Purpose

Use SupportRead’s temporary credentials for one header-signed S3 ListObjectsV2 call.

### Learner question

The CLI signs the request without sending the secret key

### Persistent scenario state

For this header-signed S3 example, the CLI uses the secret access key to derive a signing key and calculate a signature over canonical request data. The access key ID identifies the credential; the AWS session token accompanies temporary credentials. HTTPS protects the exchange. A correct signature does not grant the requested action.

### Concepts and actors

- Sign locally: arn:aws:sts::222222222222:assumed-role/SupportRead/maya; Access key ID + signature + session token sent

### Composition

Grouped index: **Authentication**; stable fragment #signed-request. A signer/process region stays left; the HTTPS wire and S3 request sit right. Secret-key derivation never crosses the boundary. This is one header-signed SigV4 request. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “The secret computes the signature locally; the service still needs to authorize the requested action.”

### Interaction

Static inspection: more controls would not clarify this comparison.

### Data or content states

- **Sign locally:** The secret key stays with the signer. For this header-signed S3 example, the CLI uses the secret access key to derive a signing key and calculate a signature over canonical request data. The access key ID identifies the credential; the AWS session token accompanies temporary credentials. HTTPS protects the exchange. A correct signature does not grant the requested action. Current credentials: Access key ID + signature + session token sent.

### Failure or edge state

This is SigV4 with temporary credentials over HTTPS. Presigned URLs and services with other authentication schemes are outside this view.

### Required copy

**Takeaway:** The secret computes the signature locally; the service still needs to authorize the requested action.

**Material caveat:** This is SigV4 with temporary credentials over HTTPS. Presigned URLs and services with other authentication schemes are outside this view.

### Accuracy caveats

This is SigV4 with temporary credentials over HTTPS. Presigned URLs and services with other authentication schemes are outside this view. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [IAM: Signature Version 4](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html)
- [IAM: using temporary credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)

### Acceptance checks

- Direct #signed-request loads this view and expands Authentication; Back/Forward restores the prior view.
- The static diagram and explanation remain readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 6 — Cross-account

### Purpose

First ask STS for SupportRead in production. Then use that session to ask S3 for the report listing.

### Learner question

Cross-account access has two separate requests

### Persistent scenario state

Maya’s source session signs AssumeRole for SupportRead in production. Caller permission and target-role trust both allow this cross-account request. STS returns a new credential set; the later S3 request uses SupportRead’s session and is authorized separately.

### Concepts and actors

- Allowed path: arn:aws:sts::222222222222:assumed-role/SupportRead/maya; New SupportRead credentials
- Caller denies: Source session remains available; No target credentials issued
- Trust denies: Source session remains available; No target credentials issued
- S3 denies: arn:aws:sts::222222222222:assumed-role/SupportRead/maya; Valid SupportRead credentials

### Composition

Grouped index: **Assume role**; stable fragment #cross-account. Source account and target account scopes sit above two distinct runtime requests: STS AssumeRole and S3 ListObjectsV2. Four presets locate the first blocking boundary. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “Permission to create a role session and permission to use a resource are different decisions.”

### Interaction

Native buttons choose 4 states; default is Allowed path. Selecting the first option restores the initial comparison.  Diagram and inspector change together, and a polite live region reports the selected result.

### Data or content states

- **Allowed path:** STS issues the target session; S3 allows the request. Maya’s source session signs AssumeRole for SupportRead in production. Caller permission and target-role trust both allow this cross-account request. STS returns a new credential set; the later S3 request uses SupportRead’s session and is authorized separately. Current credentials: New SupportRead credentials.
- **Caller denies:** The source side does not permit AssumeRole. The source role’s effective permissions do not allow sts:AssumeRole on SupportRead in this preset. Target trust alone cannot grant this cross-account access. No target credential set is issued. Current credentials: No target credentials issued.
- **Trust denies:** The target role does not trust this caller. The source side permits AssumeRole, but the target-role trust policy does not admit the source principal in this preset. STS denies session creation, before the production S3 request exists. Current credentials: No target credentials issued.
- **S3 denies:** AssumeRole succeeds; the resource request fails. STS issues SupportRead credentials, but the later S3 ListBucket request is denied in this preset. Investigate the session’s resource permissions and applicable policies; changing who can assume the role does not itself grant ListBucket. Current credentials: Valid SupportRead credentials.

### Failure or edge state

The source role’s effective permissions do not allow sts:AssumeRole on SupportRead in this preset. Target trust alone cannot grant this cross-account access. No target credential set is issued.

### Required copy

**Takeaway:** Permission to create a role session and permission to use a resource are different decisions.

**Material caveat:** These four presets isolate documented boundaries; they do not run AWS’s complete policy engine. Same-account direct trust has additional identity-policy nuances. Other applicable policies can still deny access.

### Accuracy caveats

These four presets isolate documented boundaries; they do not run AWS’s complete policy engine. Same-account direct trust has additional identity-policy nuances. Other applicable policies can still deny access. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [AWS STS: AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [IAM: cross-account evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html)
- [IAM: session policies and boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)

### Acceptance checks

- Direct #cross-account loads this view and expands Assume role; Back/Forward restores the prior view.
- All 4 states update the drawing and contextual text, and are readable without JavaScript.
- Caller/trust denial issues no target credentials and does not reach S3. S3 denial retains valid credentials.

## Visual 7 — Role chaining

### Purpose

The workforce session is already a role session, so its AssumeRole request to production is role chaining.

### Learner question

A second role starts a new permission context

### Persistent scenario state

The Identity Center role session in the workforce account calls AssumeRole for SupportRead. This is role chaining: the resulting session is limited to one hour even if SupportRead permits a longer maximum. The new session uses target-role permissions rather than a union with the source role.

### Concepts and actors

- Request 1 hour: arn:aws:sts::222222222222:assumed-role/SupportRead/maya; SupportRead session · up to 1 hour here
- Request 2 hours: Source session remains the caller; No new credential set

### Composition

Grouped index: **Assume role**; stable fragment #role-chaining. Three nodes and a duration strip compare a one-hour chained session with a rejected two-hour request under a four-hour target maximum example. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “Role chaining creates separate credentials with a one-hour maximum; source permissions do not accumulate into the new session.”

### Interaction

Native buttons choose 2 states; default is Request 1 hour. Selecting the first option restores the initial comparison.  Diagram and inspector change together, and a polite live region reports the selected result.

### Data or content states

- **Request 1 hour:** Role credentials assuming a role is role chaining. The Identity Center role session in the workforce account calls AssumeRole for SupportRead. This is role chaining: the resulting session is limited to one hour even if SupportRead permits a longer maximum. The new session uses target-role permissions rather than a union with the source role. Current credentials: SupportRead session · up to 1 hour here.
- **Request 2 hours:** A longer role maximum does not extend a chained session. A DurationSeconds value of 7200 exceeds the one-hour role-chaining limit, so this request fails. This does not mean all temporary credentials last one hour: the limit here follows the role-to-role path. Current credentials: No new credential set.

### Failure or edge state

A DurationSeconds value of 7200 exceeds the one-hour role-chaining limit, so this request fails. This does not mean all temporary credentials last one hour: the limit here follows the role-to-role path.

### Required copy

**Takeaway:** Role chaining creates separate credentials with a one-hour maximum; source permissions do not accumulate into the new session.

**Material caveat:** Verified October 15, 2026: AssumeRole has a 15-minute minimum; a role’s configured maximum can be 1–12 hours. A chained session is capped at one hour. Resource-policy grants and other controls need their own evaluation.

### Accuracy caveats

Verified October 15, 2026: AssumeRole has a 15-minute minimum; a role’s configured maximum can be 1–12 hours. A chained session is capped at one hour. Resource-policy grants and other controls need their own evaluation. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [AWS STS: AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [AWS CLI: role profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html)
- [IAM: session policies and boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)

### Acceptance checks

- Direct #role-chaining loads this view and expands Assume role; Back/Forward restores the prior view.
- All 2 states update the drawing and contextual text, and are readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 8 — Assume or pass?

### Purpose

Compare Maya using a role herself with Maya configuring a Lambda function to use an execution role.

### Learner question

Who should receive the role’s credentials?

### Persistent scenario state

An authorized caller sends an STS AssumeRole request and receives temporary credentials. That caller chooses the returned set to sign a later AWS request.

### Concepts and actors

- AssumeRole: Caller uses the resulting role session; Returned to the calling application
- PassRole: Lambda later uses the execution-role session; None returned by PassRole

### Composition

Grouped index: **Authorization**; stable fragment #assume-or-pass. Two routes identify who receives credentials: STS returns them to a caller, whereas a service API associates an execution role after iam:PassRole authorization. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “AssumeRole returns credentials to the caller. PassRole authorizes a service-role association.”

### Interaction

Native buttons choose 2 states; default is AssumeRole. Selecting the first option restores the initial comparison.  Diagram and inspector change together, and a polite live region reports the selected result.

### Data or content states

- **AssumeRole:** The caller receives credentials for its own next request. An authorized caller sends an STS AssumeRole request and receives temporary credentials. That caller chooses the returned set to sign a later AWS request. Current credentials: Returned to the calling application.
- **PassRole:** The service uses the execution role later. When Maya creates a Lambda function with a role ARN, iam:PassRole is checked as part of the service API authorization. PassRole is not an API operation and returns no credentials. Lambda must be trusted by the role; the passed role and Lambda function are in the same account. Current credentials: None returned by PassRole.

### Failure or edge state

Scope iam:PassRole to approved role ARNs and, where appropriate, iam:PassedToService. Audit the service API event, such as CreateFunction; there is no separate PassRole API event.

### Required copy

**Takeaway:** AssumeRole returns credentials to the caller. PassRole authorizes a service-role association.

**Material caveat:** Scope iam:PassRole to approved role ARNs and, where appropriate, iam:PassedToService. Audit the service API event, such as CreateFunction; there is no separate PassRole API event.

### Accuracy caveats

Scope iam:PassRole to approved role ARNs and, where appropriate, iam:PassedToService. Audit the service API event, such as CreateFunction; there is no separate PassRole API event. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [IAM: PassRole](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_passrole.html)
- [Lambda: execution role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)

### Acceptance checks

- Direct #assume-or-pass loads this view and expands Authorization; Back/Forward restores the prior view.
- All 2 states update the drawing and contextual text, and are readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 9 — Vendor access

### Purpose

A reporting vendor serves several customers. Each customer trusts the vendor, but only for the expected tenant context.

### Learner question

ExternalId binds the deputy to the customer

### Persistent scenario state

The vendor authenticates the reports customer, then obtains its configured role ARN and vendor-generated external ID from the tenant record. The target trust requires the trusted vendor principal and the matching external ID.

### Concepts and actors

- Reports tenant: Vendor session in the customer account; Customer-role credentials issued
- Other tenant: Vendor’s starting session; No customer-role credentials issued

### Composition

Grouped index: **Across accounts**; stable fragment #vendor-external-id. Two tenant records and a customer trust condition demonstrate that the vendor chooses ExternalId from the authenticated tenant record, not from a role ARN supplied by another customer. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “The vendor chooses ExternalId from its authenticated tenant record; a customer-supplied role ARN alone cannot choose the tenant.”

### Interaction

Native buttons choose 2 states; default is Reports tenant. Selecting the first option restores the initial comparison.  Diagram and inspector change together, and a polite live region reports the selected result.

### Data or content states

- **Reports tenant:** The vendor selects the customer’s configured external ID. The vendor authenticates the reports customer, then obtains its configured role ARN and vendor-generated external ID from the tenant record. The target trust requires the trusted vendor principal and the matching external ID. Current credentials: Customer-role credentials issued.
- **Other tenant:** Knowing the role ARN does not select its external ID. Another vendor customer supplies the reports role ARN. The vendor still chooses the external ID from the authenticated other-tenant record. The mismatch fails the customer role’s trust condition. An external ID is a tenant-binding value, not a password or a substitute for vendor authentication. Current credentials: No customer-role credentials issued.

### Failure or edge state

Another vendor customer supplies the reports role ARN. The vendor still chooses the external ID from the authenticated other-tenant record. The mismatch fails the customer role’s trust condition. An external ID is a tenant-binding value, not a password or a substitute for vendor authentication.

### Required copy

**Takeaway:** The vendor chooses ExternalId from its authenticated tenant record; a customer-supplied role ARN alone cannot choose the tenant.

**Material caveat:** The vendor generates and controls a unique ExternalId per customer. It is not a secret, a password, or a replacement for the vendor principal and scoped permissions.

### Accuracy caveats

The vendor generates and controls a unique ExternalId per customer. It is not a secret, a password, or a replacement for the vendor principal and scoped permissions. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [IAM: confused deputy and ExternalId](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html)
- [AWS STS: AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)

### Acceptance checks

- Direct #vendor-external-id loads this view and expands Across accounts; Back/Forward restores the prior view.
- All 2 states update the drawing and contextual text, and are readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 10 — Expiry & refresh

### Purpose

Distinguish refreshing a provider from keeping an exported access-key snapshot in a shell.

### Learner question

An upstream login and AWS credentials have different clocks

### Persistent scenario state

A configured refresh-capable provider obtains a fresh AWS credential set while its upstream authorization remains usable. The old access key and expiration do not mutate. Identity Center tokens and account-role credentials have separate validity periods.

### Concepts and actors

- Provider refreshes: A session of the selected account role; New credential set replaces the selected set
- Exported snapshot: Expired session credentials; Expired exported credential snapshot
- Sign-in required: Earlier AWS credentials have their own expiry; Refresh blocked at upstream session

### Composition

Grouped index: **Services & use cases**; stable fragment #expiry-refresh. Separate validity rows track the upstream Identity Center session, AWS set A and replacement set B. Copied environment variables have no provider refresh. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “A provider obtains a new credential set. It does not extend the lifetime of the old one.”

### Interaction

Native buttons choose 3 states; default is Provider refreshes. Selecting the first option restores the initial comparison.  Diagram and inspector change together, and a polite live region reports the selected result.

### Data or content states

- **Provider refreshes:** Refresh replaces a credential set before it expires. A configured refresh-capable provider obtains a fresh AWS credential set while its upstream authorization remains usable. The old access key and expiration do not mutate. Identity Center tokens and account-role credentials have separate validity periods. Current credentials: New credential set replaces the selected set.
- **Exported snapshot:** A copied credential set has no refresh mechanism. Copying access key, secret key, and session token into environment variables gives the process a snapshot. It does not copy the original provider’s refresh behavior. When those credentials expire, obtain a new set or use the provider directly. Current credentials: Expired exported credential snapshot.
- **Sign-in required:** An upstream session can stop future refresh. If the Identity Center session is no longer usable, the provider cannot keep obtaining account-role credentials; the CLI can require aws sso login. Browser or SSO logout is not an instant revocation mechanism for every already-issued AWS role credential. Current credentials: Refresh blocked at upstream session.

### Failure or edge state

Copying access key, secret key, and session token into environment variables gives the process a snapshot. It does not copy the original provider’s refresh behavior. When those credentials expire, obtain a new set or use the provider directly.

### Required copy

**Takeaway:** A provider obtains a new credential set. It does not extend the lifetime of the old one.

**Material caveat:** Timeline lengths are illustrative, not service defaults. Reauthentication, credential expiration and revocation are separate mechanisms; do not treat logout as immediate revocation of every issued session.

### Accuracy caveats

Timeline lengths are illustrative, not service defaults. Reauthentication, credential expiration and revocation are separate mechanisms; do not treat logout as immediate revocation of every issued session. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [AWS CLI: Identity Center concepts](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso-concepts.html)
- [IAM: using temporary credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)
- [SDKs: credential providers](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html)
- [AWS CLI: role profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html)

### Acceptance checks

- Direct #expiry-refresh loads this view and expands Services & use cases; Back/Forward restores the prior view.
- All 3 states update the drawing and contextual text, and are readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 11 — Session context

### Purpose

Read the session ARN, the issuing role and optional attribution context without mistaking a label for proof of a person.

### Learner question

Trace the request back through the role session

### Persistent scenario state

CloudTrail records the assumed-role identity and session issuer for resource requests. A session name is useful context, not independently verified human identity. SourceIdentity can preserve an origin across role chaining when configured; session tags carry attributes, with only transitive tags persisting through chaining.

### Concepts and actors

- Follow the session: arn:aws:sts::222222222222:assumed-role/SupportRead/maya; Temporary session credentials

### Composition

Grouped index: **Across accounts**; stable fragment #session-context. An annotated CloudTrail identity excerpt distinguishes the session ARN from its issuer role and optional source identity. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “Audit the acting session and its issuer. Constrain the context that callers are allowed to attach.”

### Interaction

Static inspection: more controls would not clarify this comparison.

### Data or content states

- **Follow the session:** The role ARN names configuration; the session ARN names the acting principal. CloudTrail records the assumed-role identity and session issuer for resource requests. A session name is useful context, not independently verified human identity. SourceIdentity can preserve an origin across role chaining when configured; session tags carry attributes, with only transitive tags persisting through chaining. Current credentials: Temporary session credentials.

### Failure or edge state

Prefer role principals in policies where practical. Direct grants to role-session principals have different interactions with implicit denies from boundaries and session policies; use the authorization explorer for that decision.

### Required copy

**Takeaway:** Audit the acting session and its issuer. Constrain the context that callers are allowed to attach.

**Material caveat:** Prefer role principals in policies where practical. Direct grants to role-session principals have different interactions with implicit denies from boundaries and session policies; use the authorization explorer for that decision.

### Accuracy caveats

Prefer role principals in policies where practical. Direct grants to role-session principals have different interactions with implicit denies from boundaries and session policies; use the authorization explorer for that decision. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [IAM: source identity](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_monitor.html)
- [IAM: session tags](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html)
- [IAM: role and role-session principals](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html)
- [IAM: session policies and boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)

### Acceptance checks

- Direct #session-context loads this view and expands Across accounts; Back/Forward restores the prior view.
- The static diagram and explanation remain readable without JavaScript.
- The selected credential and principal are not conflated.

## Visual 12 — Find the failure

### Purpose

Choose a symptom, then reveal the evidence one check at a time. These are deterministic teaching transcripts, not live AWS calls.

### Learner question

Find the first credential boundary that failed

### Persistent scenario state

In this fixture the command omitted --profile and environment credentials won over the profile selected through AWS_PROFILE. Inspect provider selection and the actual caller before editing production trust.

### Concepts and actors

- Wrong principal: arn:aws:iam::111111111111:user/legacy-build; Environment credentials selected
- AssumeRole denied: arn:aws:sts::111111111111:assumed-role/AWSReservedSSO_DeveloperAccess_a1b2c3d4e5f67890/maya; Source credentials only
- S3 denied: arn:aws:sts::222222222222:assumed-role/SupportRead/maya; Valid SupportRead credentials
- Expired credentials: No current usable session credentials; Expired environment snapshot
- Incomplete set: Temporary session cannot authenticate correctly; Session token missing

### Composition

Grouped index: **Services & use cases**; stable fragment #credential-diagnosis. Five symptom choices show two deterministic command/output/interpretation checks each. Evidence is revealed manually before the operating loop is stated. The main canvas holds compact labels and state, while the selected context appears in the right inspector or below on mobile. The bottom strip states: “First verify the provider and actual caller; then separate issuance failure from resource authorization failure.”

### Interaction

Native buttons choose 5 states; default is Wrong principal. Selecting the first option restores the initial comparison. Changing symptoms resets to the first check; Reveal next check exposes the second. Diagram and inspector change together, and a polite live region reports the selected result.

### Data or content states

- **Wrong principal:** Inspect the credentials selected by this process. In this fixture the command omitted --profile and environment credentials won over the profile selected through AWS_PROFILE. Inspect provider selection and the actual caller before editing production trust. Current credentials: Environment credentials selected.
- **AssumeRole denied:** The target session was never created. This fixture has valid source credentials but fails at target-role trust. Start with the actual caller, then inspect both sides of this cross-account exchange and its conditions. This is distinct from failure of the later S3 request. Current credentials: Source credentials only.
- **S3 denied:** Valid credentials do not prove permission to list the bucket. The target role session exists in production, but ListBucket is denied. The identity flow has succeeded; investigate the resource authorization decision with the correct action and bucket ARN. Current credentials: Valid SupportRead credentials.
- **Expired credentials:** Find the provider that can obtain a fresh set. A process using an exported snapshot reaches its credential expiration. Changing the target role’s trust policy cannot refresh those environment values. Current credentials: Expired environment snapshot.
- **Incomplete set:** Temporary credentials include a session token. An access key ID and secret alone are incomplete for this temporary session. Keep all three credential values from the same issuance; do not combine values from different sessions. Current credentials: Session token missing.

### Failure or edge state

In this fixture the command omitted --profile and environment credentials won over the profile selected through AWS_PROFILE. Inspect provider selection and the actual caller before editing production trust.

### Required copy

**Takeaway:** First verify the provider and actual caller; then separate issuance failure from resource authorization failure.

**Material caveat:** Exact AWS error wording varies. A generic AccessDenied does not identify a single failing policy. GetCallerIdentity identifies the caller and does not prove S3 permission.

### Accuracy caveats

Exact AWS error wording varies. A generic AccessDenied does not identify a single failing policy. GetCallerIdentity identifies the caller and does not prove S3 permission. Commands and outputs are deterministic teaching fixtures; this view does not query AWS.

### Mobile behavior

Horizontal exchanges and account frames stack in reading order. Controls wrap into rows with at least 44 px height. Code wraps inside the panel rather than creating page-level overflow.

### Accessibility

Native buttons and links work with keyboard and touch. Selected state uses labels and aria-pressed, not color alone; focus remains visible. No-JavaScript renders all states and context in order. Reduced motion disables transitions.

### Source anchors

- [AWS CLI: configuration precedence](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
- [STS: GetCallerIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html)
- [AWS CLI: configure list](https://docs.aws.amazon.com/cli/latest/reference/configure/list.html)
- [IAM: cross-account evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html)

### Acceptance checks

- Direct #credential-diagnosis loads this view and expands Services & use cases; Back/Forward restores the prior view.
- All 5 states update the drawing and contextual text, and are readable without JavaScript.
- Each symptom reveals one check before the second; output never claims a live command was run.

## Persistent console and progressive enhancement

The shared console provides brand, title, publication/review metadata, grouped index, one active canvas under JavaScript, contextual inspector, bottom takeaway, sources, related links and footer. The pipeline’s credential sample is the first view’s right-side inspector inside the canvas; focused views retain the shell inspector. The top index remains one group open after navigation, with current/total count and stable direct fragments. The 55 legacy journey/article aliases remain in their corresponding focused views; the previous #identity-map route stays on the pipeline. Without JavaScript, all twelve views, all alternate states and every source remain in one stacked console. Native disclosure groups and anchors preserve reading order.

## Prototype implementation contract

The standalone prototype is generated from the production build into guide/topics/aws-identity-credential-flows/aws-identity-credential-flows-visual-prototype.html with inline CSS and bundled JavaScript. It contains the entire console and nine working paths, five credential examples, failure state, grouped navigation, source links and all focused views. No third-party CDN is required. It is an approval artifact, not a competing maintained page.

## Integration guidance

Canonical MDX: src/content/topics/aws-identity-credential-flows.mdx; route: src/pages/aws-identity-credential-flows.astro; first visual: IdentityPipeline.astro; flow fixtures: pipeline-data.ts; interactive behavior: pipeline-client.ts; topic styling: identity-pipeline.css and focused-view identity.css. LessonConsole accepts a topic-supplied grouped index so other topics retain their existing index. The shared client resolves links by fragment ID, which supports this index’s group order without assuming DOM order equals view order. Old map-specific components and data were removed.

## Production-practice ending

Choose the source and provider; scope role trust and resource permissions; test the actual caller and requested action; inspect the first failed boundary; review CloudTrail attribution; rotate or refresh through a provider and remove copied credentials. The diagnosis view embodies this loop and links the authorization explorer for full policy interpretation.

## Deep-dive handoffs

Published AWS authorization decision explorer: exact policy evaluation and resource-principal exceptions, following Maya’s same S3 request. Published OAuth 2.0/OIDC explainer: identity-provider token issuance before web identity exchange. Service-specific EKS Pod Identity and IRSA details remain in official source links until a separate published page exists.

## Page-level acceptance criteria and validation

- Six visible numbered stages, all 29 stage entries clickable with a contextual explanation and primary-source link, nine selectable paths, five credential examples and a separate denied S3 state in the first console canvas.
- Seven concept groups with one expanded after navigation; twelve views total, stable fragments and old aliases.
- Three primary teaching interactions: pipeline route selector, cross-account decision board, evidence reveal. Workforce step-through remains a small supporting interaction.
- A primary source anchors each major view; all claims above were checked against current AWS docs on October 15, 2026.
- Automated Chromium checks cover all 29 stage entry controls, nine paths, five samples, twelve views, keyboard activation, denied S3 behavior, direct fragments, browser history, 320/390/760/1100/1536 widths, CSS zoom 200%, no JavaScript and zero page errors. The build and graph/link gates pass when marked in the completion record.
- Manual screen-reader, physical touch-device, native browser zoom and full contrast audit remain separate from automated evidence.

## Source index

1. [AWS CLI: configure Identity Center](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)
2. [AWS CLI: Identity Center concepts](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso-concepts.html)
3. [Identity Center: GetRoleCredentials](https://docs.aws.amazon.com/singlesignon/latest/PortalAPIReference/API_GetRoleCredentials.html)
4. [Identity Center: provisioned IAM roles](https://docs.aws.amazon.com/singlesignon/latest/userguide/identity-center-and-iam-roles.html)
5. [AWS STS: AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
6. [IAM: cross-account evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html)
7. [IAM: using temporary credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)
8. [IAM: Signature Version 4](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html)
9. [SDKs: credential providers](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html)
10. [EC2: roles and instance profiles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
11. [ECS: task role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
12. [Lambda: execution role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
13. [STS: AssumeRoleWithWebIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html)
14. [IAM: PassRole](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_passrole.html)
15. [IAM: confused deputy and ExternalId](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html)
16. [IAM: source identity](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_monitor.html)
17. [IAM: session tags](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html)
18. [IAM: role and role-session principals](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html)
19. [AWS CLI: role profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html)
20. [AWS CLI: configuration precedence](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
21. [STS: GetCallerIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html)
22. [AWS CLI: configure list](https://docs.aws.amazon.com/cli/latest/reference/configure/list.html)
23. [IAM: session policies and boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)
24. [STS: GetFederationToken](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetFederationToken.html)
25. [IAM: policy evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
26. [IoT Core: certificate credential provider](https://docs.aws.amazon.com/iot/latest/developerguide/authorizing-direct-aws.html)
27. [STS: GetSessionToken](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetSessionToken.html)

## Completion record — October 15, 2026

The production route, canonical MDX and standalone prototype are integrated. `npm run check` and `npm run build` pass: Astro reports 0 errors and 0 warnings (two unrelated CORS unused-variable hints), and the production build creates the Pagefind index. The Chromium suite passes six stages, all 29 clickable stage entries and their explanations/source links, nine routes, five examples, twelve views, 55 old aliases, keyboard selection, denied S3 behavior, direct fragments, Back/Forward, reduced motion, 320/390/760/1100/1536 px layouts, 200% CSS zoom, unique IDs and a full no-JavaScript reading path with zero page errors. The selected desktop state was visually inspected. The standalone HTML was opened from file:// and a stage-entry inspector was verified at 390 px with zero page errors. Manual screen-reader, physical touch, native browser zoom and full contrast audit remain as separate review items.
