# AWS IAM — visual specification

- **Topic:** AWS IAM: The Kingdom of Access
- **Status/version:** Redesigned implementation, 2.0; 2026-10-17. Owner visual review pending.
- **Audience:** Developers and infrastructure engineers building an AWS identity mental model.
- **Page promise:** Explain who is making a request, how AWS authenticates it, and which policies allow or deny the requested work using the Kingdom of Access spatial mental model and permanent Request Spine.
- **Persistent scenario:** Darshan starts as the Engineering role session in 111111111111 (Dev Fortress), assumes ProdReadOnly in Production 222222222222 (Prod Fortress), and reads `s3://prod-artifacts/releases/app.zip`. All identifiers are fictional examples.
- **Scope:** Nine concept views in five groups inside one topic console: The Kingdom, Identities & Roles, Credentials & Signing, Crossing Boundaries, and Authorization & Guardrails. Persistent top Formula Ribbon (`WHO → WHAT → WHICH → CONDITIONS`) with toggleable Analogy ↔ Pure AWS lens; permanent bottom 7-stage Request Spine. Preserves all earlier fragment aliases.
- **Visual thesis:** Architectural Kingdom schematics in SVG/CSS: walled Account fortress cities, wearable Role uniform split-flap, STS badge minting desk with countdown clock, local laptop outside kingdom walls with SigV4 seal, cross-account trust drawbridge, central royal passport office (Identity Center), and the 5-gate authorization corridor.
- **Semantics:** Shared tokens: purple identity/policy; cyan direct request and active stage; green permitted/success; amber constraints/SCPs; red denied/slammed-gate. Expiry countdown ring reflects remaining credential validity.

## Accuracy worksheet

1. Primitives: account, user, group, role, policy, role session, credential set, request, resource, external identity/provider, permission set.
2. Configuration: roles/trust/policies/assignments/profiles. Runtime: role sessions, credentials, signed requests. Profile stays local.
3. Ownership: Engineering owns source role; Production owns target role and bucket. The organization administers guardrails; Identity Center provisions account roles.
4. Initiator: CLI resolves the profile and authenticates AssumeRole with source credentials.
5. Decisions: STS authorizes assumption and validates external proof where applicable; the resource service authorizes its request.
6. Runtime calls: CLI→STS, then CLI→S3. A policy document is not a network appliance.
7. State: IAM stores configuration; credential provider caches expiring credentials; CloudTrail stores configured event evidence.
8. Union: identity/resource grants can supply access under the documented same-account rules, with service/principal exceptions.
9. Intersection: applicable identity-path boundary/session/SCP limits. Direct session resource grants have documented implicit-deny exceptions.
10. Override: any applicable explicit deny wins. Invalid/expired credentials fail authentication before useful resource access.
11. Failure: a denied AssumeRole creates no target session credentials; expired credentials require refresh; a successful AssumeRole does not guarantee S3 access. Policy changes and credentials are separate lifecycles.
12. Wrong models: profile is an identity; trust alone suffices across accounts; boundary grants permissions; SCP grants access or constrains management; every principal follows one gate corridor; session token is necessarily a JWT.

## Narrative and concept groups

Five groups: The Kingdom; Identities & Roles; Credentials & Signing; Crossing Boundaries; Authorization & Guardrails. Default view is `#kingdom`. The shared index shows current/09, opens only the selected group after navigation, and uses short labels. All earlier 15 URLs remain functional as fragment aliases.

| # | Index group / view | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | The Kingdom / The Kingdom (`#kingdom`) | How does the AWS Organization kingdom fit together? | kingdom | Hero (Hotspots & Spine) | Everything in AWS IAM unfolds from one question: who signed this request, and which rules govern that identity? |
| 2 | Identities & Roles / Identities & Workloads (`#workload-identity`) | How do human users, EC2, containers, and serverless callers compare? | workloads | Switcher (6 Actors) | AWS IAM does not authorize beings; it authorizes signed API requests. |
| 3 | Identities & Roles / Role = Uniform (`#assume-role`) | What is the difference between an IAM user and an IAM role? | badge | Hero (Uniform Split-Flap) | Trust policy answers 'who can wear me?'; permissions policy answers 'what can the wearer do?'. |
| 4 | Credentials & Signing / STS = Badge Office (`#temporary-credentials`) | How do temporary credentials work and why do they expire? | mint | Slider (Expiry Clock) | Temporary credentials expire automatically, eliminating the permanent blast radius of IAM user access keys. |
| 5 | Credentials & Signing / Profiles & SigV4 (`#profiles`) | Where does an AWS profile live, and what is SigV4? | terminal | Switcher (--profile prod/dev) | A profile is local CLI configuration, not an IAM object. AWS never sees your profile name. |
| 6 | Crossing Boundaries / Cross-Account Bridge (`#cross-account`) | How does a caller in Account A operate in Account B? | bridge | Hero (Bridge Break/Heal) | Cross-account access requires a handshake: the caller account must permit outbound AssumeRole, and the target role must trust the caller. |
| 7 | Crossing Boundaries / Central Passport Office (`#identity-center`) | How does Identity Center manage multi-account workforce access? | switchboard | Switcher (4 Account Ports) | Identity Center does not replace IAM; it manages workforce sign-in and provisions IAM roles into member accounts. |
| 8 | Authorization & Guardrails / Checkpoint Corridor (`#policy-evaluation`) | How do SCPs, bucket policies, identity policies, and boundaries combine? | gates | Hero (5-Gate Slam Lab) | An explicit deny anywhere slams the gate shut. SCPs and permissions boundaries set ceilings; they never grant access. |
| 9 | Authorization & Guardrails / Ledger & Diagnosis (`#real-world-flows`) | How do you systematically troubleshoot an AccessDenied error? | diagnosis | 4-Step Decision Tree | Always determine whether failure occurred during role assumption (credential office) or resource access (checkpoint corridor). |

### Visual 1 — AWS Identity Universe

#### Purpose
An AWS account owns identities and resources. A person or workload obtains credentials, makes a signed request, and receives an authorization decision. Use this map to place each concept before following one request.

#### Learner question
Who are you? What can you do? How does AWS know?

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects identity map in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
A centered identity question with six clickable orbital symbols: identities, authentication, temporary access, authorization, organization, workforce. Keep the core in the middle, three satellites on each side. At mobile widths put the core above two columns of symbols. A dotted elliptical line is conceptual, not a packet path. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Whole picture**; stable fragment `#identity-map`. A centered identity question with six clickable orbital symbols: identities, authentication, temporary access, authorization, organization, workforce. Keep the core in the middle, three satellites on each side. At mobile widths put the core above two columns of symbols. A dotted elliptical line is conceptual, not a packet path. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native links select concept views through stable fragments. Center link opens the request journey.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
Authentication alone does not grant resource access; an assignment to one account is not universal access.

#### Required copy
Heading: “AWS Identity Universe”. Frame: “Who are you? What can you do? How does AWS know?”. Takeaway: **Identity, credentials, and permissions answer different questions.**. Place the correction beside the relevant mechanism: The orbit is a concept map, not a network topology. Identity Center and federation can supply a path into role sessions; neither grants universal account access.

#### Accuracy caveats
The orbit is a concept map, not a network topology. Identity Center and federation can supply a path into role sessions; neither grants universal account access. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [IAM policy types](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)
- [Federation into AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers.html)
- [STS credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)

#### Acceptance checks
- Direct `#identity-map` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: Authentication alone does not grant resource access; an assignment to one account is not universal access.
- Native links select concept views through stable fragments. Center link opens the request journey.

### Visual 2 — You are an AWS request

#### Purpose
Darshan starts with an Engineering role session, asks STS to assume ProdReadOnly, and receives a new credential set. The CLI signs the S3 request as that production role session. S3 authorizes the request against its action, resource, and context.

#### Learner question
Follow Darshan reading releases/app.zip from the production bucket.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects request journey in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Seven numbered stages in chronological order: principal, authenticate STS call, assume identity, STS credentials, sign S3 request, authorize, resource. Keep source and target sessions named. The active stage has a cyan border; completed stages have a green border. Below, a live inspector explains the selected operation. Manual Next, direct stage selection, and Restart make the sequence inspectable. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Whole picture**; stable fragment `#request-journey`. Seven numbered stages in chronological order: principal, authenticate STS call, assume identity, STS credentials, sign S3 request, authorize, resource. Keep source and target sessions named. The active stage has a cyan border; completed stages have a green border. Below, a live inspector explains the selected operation. Manual Next, direct stage selection, and Restart make the sequence inspectable. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Hero 1: Next advances through seven stages; numbered stage buttons select directly; Restart returns to stage 1. End disables Next. Feedback announces the stage mechanism.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
A valid credential set can still receive S3 AccessDenied; an IAM-user key path does not require role assumption.

#### Required copy
Heading: “You are an AWS request”. Frame: “Follow Darshan reading releases/app.zip from the production bucket.”. Takeaway: **Getting credentials and being allowed to read the object are separate decisions.**. Place the correction beside the relevant mechanism: This is a role-assumption path. Existing IAM-user access keys can sign API calls without AssumeRole. Passwords and MFA are sign-in proofs, not credentials for signing S3 requests.

#### Accuracy caveats
This is a role-assumption path. Existing IAM-user access keys can sign API calls without AssumeRole. Passwords and MFA are sign-in proofs, not credentials for signing S3 requests. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [SigV4 request signing](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html)
- [Cross-account evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html)

#### Acceptance checks
- Direct `#request-journey` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: A valid credential set can still receive S3 AccessDenied; an IAM-user key path does not require role assumption.
- Hero 1: Next advances through seven stages; numbered stage buttons select directly; Restart returns to stage 1. End disables Next. Feedback announces the stage mechanism.

### Visual 3 — An identity that stays; a session that expires

#### Purpose
An IAM user is an account identity that can have a password and long-term access keys. A role has trust and permission configuration, but no standard long-term access keys. STS issues credentials for a session of that role.

#### Learner question
A role is configuration. An assumed-role session is a caller.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects users & roles in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Two aligned columns distinguish persistent IAM user identity from role configuration → runtime role session. A group rail below makes groups permission containers rather than callers. Compare real credential types and ARN forms. No animation: the simultaneous comparison is the teaching mechanism. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Identities**; stable fragment `#users-roles`. Two aligned columns distinguish persistent IAM user identity from role configuration → runtime role session. A group rail below makes groups permission containers rather than callers. Compare real credential types and ARN forms. No animation: the simultaneous comparison is the teaching mechanism. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
Treating an IAM group as the caller is invalid. Expiring a role session does not delete the role.

#### Required copy
Heading: “An identity that stays; a session that expires”. Frame: “A role is configuration. An assumed-role session is a caller.”. Takeaway: **Prefer temporary role credentials for people and workloads.**. Place the correction beside the relevant mechanism: IAM groups collect users for permission management; a group cannot sign a request or be assumed. Root is a separate account identity: protect it and reserve it for tasks that require it.

#### Accuracy caveats
IAM groups collect users for permission management; a group cannot sign a request or be assumed. Root is a separate account identity: protect it and reserve it for tasks that require it. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [IAM policy types](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)
- [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [STS credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)

#### Acceptance checks
- Direct `#users-roles` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: Treating an IAM group as the caller is invalid. Expiring a role session does not delete the role.
- Read the entire relationship without requiring interaction.

### Visual 4 — A grant can live on either side

#### Purpose
Identity policies attach to users, groups, or roles. Resource policies attach to supported resources. A statement only contributes when its action, resource, principal where applicable, and conditions match the request.

#### Learner question
Match the principal, action, resource, and conditions of a real request.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects policy documents in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
One request envelope above two readable JSON documents. Left: identity policy on ProdReadOnly allowing GetObject on an exact object ARN. Right: bucket policy denying insecure transport on bucket and objects. Context is SecureTransport=true, so the deny does not match. Documents reflow vertically on mobile. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Identities**; stable fragment `#policies`. One request envelope above two readable JSON documents. Left: identity policy on ProdReadOnly allowing GetObject on an exact object ARN. Right: bucket policy denying insecure transport on bucket and objects. Context is SecureTransport=true, so the deny does not match. Documents reflow vertically on mobile. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
SecureTransport=false matches the bucket deny, overriding the shown identity Allow.

#### Required copy
Heading: “A grant can live on either side”. Frame: “Match the principal, action, resource, and conditions of a real request.”. Takeaway: **Read a policy against one concrete request, not against its friendly name.**. Place the correction beside the relevant mechanism: An ARN identifies a resource or principal; it does not grant access. S3 object actions use object ARNs, while bucket-list actions use the bucket ARN. KMS and other services have additional authorization rules.

#### Accuracy caveats
An ARN identifies a resource or principal; it does not grant access. S3 object actions use object ARNs, while bucket-list actions use the bucket ARN. KMS and other services have additional authorization rules. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [IAM policy types](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)
- [Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [Cross-account evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html)

#### Acceptance checks
- Direct `#policies` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: SecureTransport=false matches the bucket deny, overriding the shown identity Allow.
- Read the entire relationship without requiring interaction.

### Visual 5 — STS issues a credential set

#### Purpose
After an authorized AssumeRole call, STS returns credentials for the new role session. The access key ID identifies the credential, the secret participates in signing, and the session token must accompany requests using temporary credentials.

#### Learner question
An access key ID, secret access key, session token, and expiration travel together.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects sts credentials in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Authorized AssumeRole enters the STS issuer above a temporary credential card. The card contains access key ID, masked secret, opaque token, and remaining time. A circular remaining-life indicator is adjacent to the credential label, not a decorative service animation. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Identities**; stable fragment `#temporary-credentials`. Authorized AssumeRole enters the STS issuer above a temporary credential card. The card contains access key ID, masked secret, opaque token, and remaining time. A circular remaining-life indicator is adjacent to the credential label, not a decorative service animation. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
A labelled range input advances example elapsed time from 0 to 60 minutes in 15-minute increments. Ring and text update together. Reset time restores 60 minutes remaining. This manual comparison avoids a real-time countdown.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
At 60 elapsed minutes the credential set is expired; show an authentication failure and the need to refresh.

#### Required copy
Heading: “STS issues a credential set”. Frame: “An access key ID, secret access key, session token, and expiration travel together.”. Takeaway: **Expiration ends the usefulness of this credential set; it does not delete the role.**. Place the correction beside the relevant mechanism: The token is opaque; do not assume it is a JWT. The one-hour duration here is an example. AssumeRole duration depends on the role setting and API limits; role chaining is capped at one hour.

#### Accuracy caveats
The token is opaque; do not assume it is a JWT. The one-hour duration here is an example. AssumeRole duration depends on the role setting and API limits; role chaining is capped at one hour. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [STS credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)

#### Acceptance checks
- Direct `#temporary-credentials` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: At 60 elapsed minutes the credential set is expired; show an authentication failure and the need to refresh.
- A labelled range input advances example elapsed time from 0 to 60 minutes in 15-minute increments. Ring and text update together. Reset time restores 60 minutes remaining. This manual comparison avoids a real-time countdown.

### Visual 6 — One badge, two policy questions

#### Purpose
The role trust policy controls assumption. Its permissions policies describe allowed work after assumption. Darshan keeps his original credentials and receives a separate credential set representing ProdReadOnly.

#### Learner question
Who can assume me? What can the resulting session do?

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects assumerole in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
The source Engineering session sits above an AssumeRole arrow into a production role badge. Left half is trust; right half is permissions. The trust JSON is available in a native disclosure. Keep the IAM role configuration visibly distinct from its session credentials. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Identities**; stable fragment `#assume-role`. The source Engineering session sits above an AssumeRole arrow into a production role badge. Left half is trust; right half is permissions. The trust JSON is available in a native disclosure. Keep the IAM role configuration visibly distinct from its session credentials. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
A permissive resource policy for work does not supply missing role trust; PassRole is not AssumeRole.

#### Required copy
Heading: “One badge, two policy questions”. Frame: “Who can assume me? What can the resulting session do?”. Takeaway: **Trust opens the role-assumption path; permissions govern the work afterward.**. Place the correction beside the relevant mechanism: Assuming a role does not add its permissions to the source identity. iam:PassRole is a different permission: it lets a caller pass a role to an AWS service in supported API requests.

#### Accuracy caveats
Assuming a role does not add its permissions to the source identity. iam:PassRole is a different permission: it lets a caller pass a role to an AWS service in supported API requests. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [EC2 role credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html)

#### Acceptance checks
- Direct `#assume-role` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: A permissive resource policy for work does not supply missing role trust; PassRole is not AssumeRole.
- Read the entire relationship without requiring interaction.

### Visual 7 — Two accounts. Two sides of permission.

#### Purpose
Engineering in account 111111111111 needs permission to call sts:AssumeRole on ProdReadOnly in 222222222222. The target role must trust the caller. Only then can STS return credentials for a session in the production account.

#### Learner question
Illuminate the trust bridge, then remove one side.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects cross-account in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Engineering account on the left and Production on the right. The caller policy is inside Engineering, trust inside Production. A cyan direct-call bridge connects them; the conceptual trust label explains why the call can succeed. STS output and the new production session sit below the two scopes. On failure, break the line and mark output unavailable. Stack scopes and bridge vertically on mobile. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Account trust**; stable fragment `#cross-account`. Engineering account on the left and Production on the right. The caller policy is inside Engineering, trust inside Production. A cyan direct-call bridge connects them; the conceptual trust label explains why the call can succeed. STS output and the new production session sit below the two scopes. On failure, break the line and mark output unavailable. Stack scopes and bridge vertically on mobile. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Hero 2: three mutually indicated buttons choose Both sides permit (default/reset), Remove trust, or Remove caller allow. Only affected line, evidence, output state, and outcome change.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
Remove either caller Allow or target trust. STS denies AssumeRole and issues no production session credentials.

#### Required copy
Heading: “Two accounts. Two sides of permission.”. Frame: “Illuminate the trust bridge, then remove one side.”. Takeaway: **Caller permission and target trust must both permit this cross-account AssumeRole request.**. Place the correction beside the relevant mechanism: Trusting an account allows that account to delegate access; it does not automatically authorize every identity there. Direct cross-account resource access is another pattern and does not change the caller into a target-account role session.

#### Accuracy caveats
Trusting an account allows that account to delegate access; it does not automatically authorize every identity there. Direct cross-account resource access is another pattern and does not change the caller into a target-account role session. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [Cross-account evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html)

#### Acceptance checks
- Direct `#cross-account` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: Remove either caller Allow or target trust. STS denies AssumeRole and issues no production session credentials.
- Hero 2: three mutually indicated buttons choose Both sides permit (default/reset), Remove trust, or Remove caller allow. Only affected line, evidence, output state, and outcome change.

### Visual 8 — Find the grant. Apply the limits.

#### Purpose
For the default role identity-policy path, the requested action needs an allow and must survive the applicable boundary, session policy, and Organizations controls. A resource policy can also grant permissions or explicitly deny the request.

#### Learner question
A request starts denied. An applicable explicit deny wins.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects policy evaluation in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Request envelope above a scenario selector. A column of selectable policy gates occupies the left; selected JSON and explanation occupy the right. The final decision is below. Show the identity policy as a grant and the boundary/session/SCP as limiters; a bucket policy may grant or deny. All gate state remains visible together. Do not animate a false internal evaluation order. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Permissions**; stable fragment `#policy-evaluation`. Request envelope above a scenario selector. A column of selectable policy gates occupies the left; selected JSON and explanation occupy the right. The final decision is below. Show the identity policy as a grant and the boundary/session/SCP as limiters; a bucket policy may grant or deny. All gate state remains visible together. Do not animate a false internal evaluation order. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Hero 3: six-scenario native select plus Reset scenario. Each gate button selects actual representative JSON and states aria-pressed. Selection updates scenario-specific policy text and verdict. Default is the allowed identity path.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
Six deterministic scenarios: allow, bucket explicit deny, boundary omission, missing grant, direct role grant under boundary omission, direct session grant under boundary omission.

#### Required copy
Heading: “Find the grant. Apply the limits.”. Frame: “A request starts denied. An applicable explicit deny wins.”. Takeaway: **A green policy somewhere cannot cancel an applicable explicit deny elsewhere.**. Place the correction beside the relevant mechanism: The corridor organizes policy relationships, not AWS internal execution order. Supported resource grants to a same-account session ARN can bypass implicit identity, boundary, and session-policy denies; role-ARN grants remain limited by boundary and session policy. Applicable explicit denies still win.

#### Accuracy caveats
The corridor organizes policy relationships, not AWS internal execution order. Supported resource grants to a same-account session ARN can bypass implicit identity, boundary, and session-policy denies; role-ARN grants remain limited by boundary and session policy. Applicable explicit denies still win. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [Role and session grant exceptions](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html)
- [Permissions boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)
- [Cross-account evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html)

#### Acceptance checks
- Direct `#policy-evaluation` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: Six deterministic scenarios: allow, bucket explicit deny, boundary omission, missing grant, direct role grant under boundary omission, direct session grant under boundary omission.
- Hero 3: six-scenario native select plus Reset scenario. Each gate button selects actual representative JSON and states aria-pressed. Selection updates scenario-specific policy text and verdict. Default is the allowed identity path.

### Visual 9 — An account-wide ceiling

#### Purpose
SCPs bound permissions for principals in member accounts, including their root users. Allows must exist through the applicable root, OU, and account path; an explicit deny at any level blocks the action. The SCP supplies no permission by itself.

#### Learner question
AdministratorAccess still lives inside organization guardrails.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects organizations in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Organization frame contains an explicitly SCP-exempt management account and a member-account SCP frame. Engineering, Production, and Security sit inside that ceiling. Denied actions are labelled. Three conceptual bars below show AdministratorAccess, SCP range, effective range. Bars have no numeric permission-count implication. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Permissions**; stable fragment `#organizations`. Organization frame contains an explicitly SCP-exempt management account and a member-account SCP frame. Engineering, Production, and Security sit inside that ceiling. Denied actions are labelled. Three conceptual bars below show AdministratorAccess, SCP range, effective range. Bars have no numeric permission-count implication. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
AdministratorAccess cannot override the SCP deny. Management account and service-linked roles are exempt.

#### Required copy
Heading: “An account-wide ceiling”. Frame: “AdministratorAccess still lives inside organization guardrails.”. Takeaway: **An SCP limits permissions; it never grants them.**. Place the correction beside the relevant mechanism: SCPs do not constrain the management account or service-linked roles. Resource control policies (RCPs) add resource-side guardrails for supported services; they are distinct from SCPs.

#### Accuracy caveats
SCPs do not constrain the management account or service-linked roles. Resource control policies (RCPs) add resource-side guardrails for supported services; they are distinct from SCPs. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [Organizations SCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [Role and session grant exceptions](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html)

#### Acceptance checks
- Direct `#organizations` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: AdministratorAccess cannot override the SCP deny. Management account and service-linked roles are exempt.
- Read the entire relationship without requiring interaction.

### Visual 10 — The overlap is the grant that survives

#### Purpose
For this identity-policy example, Read and Write are granted, but the boundary allows only Read and List. The overlap contains Read. List was never granted, and Write exceeds the boundary.

#### Learner question
A permissions boundary caps what identity policies can grant.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects boundaries in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Two partially overlapping sets: identity grant Read+Write, boundary allows Read+List. The overlap highlights Read. Write lies outside the allowed ceiling and List lacks a grant. Use static geometry because comparison of all sets at once is clearer than animating a calculation. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Permissions**; stable fragment `#boundaries`. Two partially overlapping sets: identity grant Read+Write, boundary allows Read+List. The overlap highlights Read. Write lies outside the allowed ceiling and List lacks a grant. Use static geometry because comparison of all sets at once is clearer than animating a calculation. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
List cannot appear in effective permissions just because the boundary permits it.

#### Required copy
Heading: “The overlap is the grant that survives”. Frame: “A permissions boundary caps what identity policies can grant.”. Takeaway: **A boundary can remove a grant from this path, but cannot add one.**. Place the correction beside the relevant mechanism: This intersection describes the identity-policy path. Resource-based grants depend on the named principal; same-account user and session grants have important implicit-deny exceptions. Explicit denies continue to apply.

#### Accuracy caveats
This intersection describes the identity-policy path. Resource-based grants depend on the named principal; same-account user and session grants have important implicit-deny exceptions. Explicit denies continue to apply. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [Permissions boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)
- [Role and session grant exceptions](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html)

#### Acceptance checks
- Direct `#boundaries` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: List cannot appear in effective permissions just because the boundary permits it.
- Read the entire relationship without requiring interaction.

### Visual 11 — One workforce identity, many assignments

#### Purpose
Identity Center assigns users or groups to accounts with permission sets. Provisioning creates IAM roles in those accounts. The assigned person obtains temporary role credentials for the selected account and permission set.

#### Learner question
Choose an account and a permission set, then see the account role.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects identity center in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Workforce identity above Identity Center, then four linked account/permission-set ports: Dev/Admin, Test/Developer, Prod/ReadOnly, Security/Auditor. The selected assignment disclosure shows permission set → generated AWSReservedSSO role in that account → credentials. Prod starts expanded. Stack into two columns on mobile. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Access paths**; stable fragment `#identity-center`. Workforce identity above Identity Center, then four linked account/permission-set ports: Dev/Admin, Test/Developer, Prod/ReadOnly, Security/Auditor. The selected assignment disclosure shows permission set → generated AWSReservedSSO role in that account → credentials. Prod starts expanded. Stack into two columns on mobile. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Account links target assignment fragments and open their native disclosure. Prod/ReadOnly starts expanded. These are lightweight inspections, not another simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
Without assignment and successful provisioning there is no usable account role through this path.

#### Required copy
Heading: “One workforce identity, many assignments”. Frame: “Choose an account and a permission set, then see the account role.”. Takeaway: **An account assignment connects a workforce identity, a permission set, and a provisioned IAM role.**. Place the correction beside the relevant mechanism: A permission set is provisioning configuration, not a global IAM policy. The AWSReservedSSO role suffix shown here is illustrative; actual generated names and paths depend on the configuration.

#### Accuracy caveats
A permission set is provisioning configuration, not a global IAM policy. The AWSReservedSSO role suffix shown here is illustrative; actual generated names and paths depend on the configuration. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [Identity Center permission sets](https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html)

#### Acceptance checks
- Direct `#identity-center` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: Without assignment and successful provisioning there is no usable account role through this path.
- Account links target assignment fragments and open their native disclosure. Prod/ReadOnly starts expanded. These are lightweight inspections, not another simulator.

### Visual 12 — Applications are principals too

#### Purpose
EC2 uses an instance profile and metadata credentials. ECS tasks use task roles, while the task execution role serves the ECS agent. Lambda functions use execution roles. EKS can use Pod Identity or IAM roles for service accounts (IRSA).

#### Learner question
Keep the role pattern. Change how the workload receives credentials.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects workload identity in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Five technical rows compare EC2, ECS, Lambda, EKS Pod Identity, and EKS IRSA. Each row has a workload symbol, configuration object, runtime delivery method, and a concise caveat. A common credential→signed-request rail ties them to the persistent S3 scenario. Static comparison avoids five competing simulators. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Access paths**; stable fragment `#workload-identity`. Five technical rows compare EC2, ECS, Lambda, EKS Pod Identity, and EKS IRSA. Each row has a workload symbol, configuration object, runtime delivery method, and a concise caveat. A common credential→signed-request rail ties them to the persistent S3 scenario. Static comparison avoids five competing simulators. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
ECS execution-role permissions do not substitute for task-role application permissions; Pod Identity and IRSA are distinct.

#### Required copy
Heading: “Applications are principals too”. Frame: “Keep the role pattern. Change how the workload receives credentials.”. Takeaway: **Use workload-specific role delivery instead of embedding long-term keys.**. Place the correction beside the relevant mechanism: An EKS Kubernetes ServiceAccount is not itself an IAM role. Pod Identity uses an association and agent; IRSA uses an OIDC trust relationship. SDK credential providers must support the selected delivery path and refresh.

#### Accuracy caveats
An EKS Kubernetes ServiceAccount is not itself an IAM role. Pod Identity uses an association and agent; IRSA uses an OIDC trust relationship. SDK credential providers must support the selected delivery path and refresh. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [EC2 role credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html)
- [EKS Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html)
- [ECS task IAM roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [Lambda execution roles](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [EKS IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)

#### Acceptance checks
- Direct `#workload-identity` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: ECS execution-role permissions do not substitute for task-role application permissions; Pod Identity and IRSA are distinct.
- Read the entire relationship without requiring interaction.

### Visual 13 — Trust an external identity proof

#### Purpose
A configured identity provider supplies a signed assertion or token. STS validates it against the provider and role trust conditions, then returns temporary role credentials. The external token itself is not the AWS access key used to sign S3 calls.

#### Learner question
SAML assertions and OIDC tokens enter AWS through different STS APIs.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects federation in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Two parallel lanes begin outside AWS with corporate SAML and workload OIDC. Each signed proof crosses a dashed AWS trust boundary into the correct STS API. Role credentials appear below. The external proof and resulting credential set have distinct labels. Stack lanes on mobile. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Access paths**; stable fragment `#federation`. Two parallel lanes begin outside AWS with corporate SAML and workload OIDC. Each signed proof crosses a dashed AWS trust boundary into the correct STS API. Role credentials appear below. The external proof and resulting credential set have distinct labels. Stack lanes on mobile. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
A token from a provider is insufficient when audience/subject or role trust do not match.

#### Required copy
Heading: “Trust an external identity proof”. Frame: “SAML assertions and OIDC tokens enter AWS through different STS APIs.”. Takeaway: **Federation exchanges a trusted external proof for an AWS role session.**. Place the correction beside the relevant mechanism: An OIDC trust policy must constrain claims such as audience and subject. IAM Identity Center workforce federation is a separate managed access path; this diagram shows direct IAM federation.

#### Accuracy caveats
An OIDC trust policy must constrain claims such as audience and subject. IAM Identity Center workforce federation is a separate managed access path; this diagram shows direct IAM federation. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [Federation into AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers.html)
- [STS credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)

#### Acceptance checks
- Direct `#federation` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: A token from a provider is insufficient when audience/subject or role trust do not match.
- Read the entire relationship without requiring interaction.

### Visual 14 — Your profile stays on your machine

#### Purpose
The prod profile tells the CLI to use an Engineering source profile and assume ProdReadOnly. The CLI obtains and caches the temporary credentials, then uses SigV4 to sign the requested S3 API call.

#### Learner question
Local configuration selects a credential path. AWS sees the signed request.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects profiles & sigv4 in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Local terminal configuration occupies the top outside a dashed AWS boundary. Show a working profile with source_profile, role_arn, role_session_name and Region, then an exact s3api get-object invocation. Inside AWS show STS and the resource-side authorization. Inspectable request artifacts omit the secret and profile name. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Tooling & diagnosis**; stable fragment `#profiles`. Local terminal configuration occupies the top outside a dashed AWS boundary. Show a working profile with source_profile, role_arn, role_session_name and Region, then an exact s3api get-object invocation. Inside AWS show STS and the resource-side authorization. Inspectable request artifacts omit the secret and profile name. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
A different source or provider precedence can select unintended credentials; inspect the actual caller.

#### Required copy
Heading: “Your profile stays on your machine”. Frame: “Local configuration selects a credential path. AWS sees the signed request.”. Takeaway: **A profile chooses configuration and credentials; it is not an IAM identity and grants no permissions.**. Place the correction beside the relevant mechanism: The source profile must already be configured. Environment variables, explicit options, and SDK provider precedence can change which credentials are selected. The secret access key is never sent as a request header.

#### Accuracy caveats
The source profile must already be configured. Environment variables, explicit options, and SDK provider precedence can change which credentials are selected. The secret access key is never sent as a request header. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [CLI role profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html)
- [SigV4 request signing](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html)

#### Acceptance checks
- Direct `#profiles` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: A different source or provider precedence can select unintended credentials; inspect the actual caller.
- Read the entire relationship without requiring interaction.

### Visual 15 — Follow the evidence back to the boundary

#### Purpose
Resolve the active principal, capture the exact S3 action and object ARN, find the intended grant, and inspect applicable limits and explicit denies. A failed AssumeRole call is a different failure from a successful assumption followed by S3 AccessDenied.

#### Learner question
Start with the caller that actually signed the failed request.

#### Persistent scenario state
Darshan / Engineering → ProdReadOnly / darshan → s3:GetObject on releases/app.zip. This view inspects diagnose access in that journey; the persistent ribbon keeps the caller, target role, and action in view.

#### Concepts and actors
Success trace on the left, two separate failure boundaries on the right: AssumeRole denied versus GetObject denied after a successful assumption. A numbered investigation below resolves caller→request→grant/limits→validate/test/observe/refine. Keep CloudTrail data-event availability caveat in the inspector. Configuration and runtime objects use explicit labels; role configuration never substitutes for the role-session caller.

#### Composition
Group: **Tooling & diagnosis**; stable fragment `#real-world-flows`. Success trace on the left, two separate failure boundaries on the right: AssumeRole denied versus GetObject denied after a successful assumption. A numbered investigation below resolves caller→request→grant/limits→validate/test/observe/refine. Keep CloudTrail data-event availability caveat in the inspector. The right inspector contains cause, caveat, evidence, and sources; below 1200 px it moves underneath. The bottom strip states the takeaway. Default state is the complete happy-path example except the request journey, which starts at stage 1.

#### Interaction
Native disclosures expose supporting detail where present. The main model stays static: simultaneous comparison makes the relationship visible without controls. There is no independent animation or hidden simulator.

#### Data or content states
Use account IDs 111111111111 and 222222222222, role ProdReadOnly, session darshan, action s3:GetObject, resource arn:aws:s3:::prod-artifacts/releases/app.zip. Inspect the caller: `aws sts get-caller-identity --profile prod`. The role permits this exact example read, rather than implying a managed policy grants every read action.

#### Failure or edge state
Do not treat missing S3 object events in standard CloudTrail event history as proof that no call occurred.

#### Required copy
Heading: “Follow the evidence back to the boundary”. Frame: “Start with the caller that actually signed the failed request.”. Takeaway: **Diagnose the failing operation before changing policy.**. Place the correction beside the relevant mechanism: CloudTrail event availability depends on service, event type, and logging configuration; S3 object reads are data events and are not included in ordinary event history. Access Analyzer finds supported access findings and policy issues; it is not a replay of every live authorization decision.

#### Accuracy caveats
CloudTrail event availability depends on service, event type, and logging configuration; S3 object reads are data events and are not included in ordinary event history. Access Analyzer finds supported access findings and policy issues; it is not a replay of every live authorization decision. The diagram shows documented policy relationships and example artifacts rather than AWS internals. Technical source verification: 2026-10-17.

#### Mobile behavior
At 760 px, paired documents, traces, federation lanes, and account scopes stack. The universe becomes a core followed by two columns of satellites; the pipeline becomes one numbered vertical sequence. Labels wrap within the frame. At 320 px code wraps; nested scopes reduce padding; controls fill available width without page-level overflow.

#### Accessibility
Native links/buttons/details/select/range; visible shared focus ring; 44 px control targets; no hover-only detail. Live status announces changed sequence, bridge, expiry, and policy outcomes. Color always has accompanying text, line style, or selected-state indicator. Reduced motion disables state transitions. Without JavaScript, all views, diagrams, explanatory copy, fragments and sources remain readable in source order. Static figures preserve the same core relationship.

#### Source anchors
- [CloudTrail for IAM and STS](https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html)
- [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)
- [Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)

#### Acceptance checks
- Direct `#real-world-flows` navigation selects this view and its group; reload and Back/Forward restore the view.
- Read the heading, relationship and takeaway at desktop, 320 px and 200% CSS zoom without clipped content.
- Verify this concrete edge case: Do not treat missing S3 object events in standard CloudTrail event history as proof that no call occurred.
- Read the entire relationship without requiring interaction.

## Persistent console and integration guidance

Canonical route: `/aws-iam`. The user explicitly requested the rename; `/aws-authorization-decision-explorer`, `/aws/aws-authorization-decision-explorer`, and `/aws/aws-iam` redirect to it. Catalogue routing remains collection-independent. Static compatibility pages preserve query strings and section fragments with location.replace; Vercel permanent redirects handle deployed requests. Without JavaScript, a meta refresh opens the canonical stacked reading path. The existing public route is retained as an alias rather than a duplicate catalogue entry.

Canonical MDX: `src/content/topics/aws-iam.mdx`; `src/pages/aws-iam.astro` renders it. Metadata and authoritative reference list remain in MDX. Topic modules live in `src/components/aws-iam/`; production reuses `LessonConsole`, `TopicConsoleShell`, the established identity symbol primitive, shared tokens and lesson CSS. No new dependency, runtime API, database, or account integration. Topic-specific compositions and mechanisms are kept separate from shared navigation. The prototype is a frozen design record generated from the accepted implementation direction; it is not a second maintained content source.

The title, published/reviewed dates, AWS breadcrumb, difficulty/format, grouped view index, scenario ribbon, active canvas, contextual inspector, takeaway, previous/next controls, sources, related visuals and footer stay inside one console. Under JavaScript, only the active view shows. Without JavaScript, all fifteen views and their own copy show sequentially. The index remains ordinary fragment links.

### Preserved fragments

| Old fragment | New view |
| --- | --- |
| principal-who-signed-the-request | users-roles |
| policies-where-can-permission-come-from | policies |
| evaluation-why-was-it-allowed-or-denied | policy-evaluation |
| role-and-session-principals-are-different | policy-evaluation |
| principal-grant-title | policy-evaluation |
| guardrails-how-is-power-capped | organizations |
| sessions-what-happens-when-a-role-is-assumed | temporary-credentials |
| cross-account-which-two-sides-must-agree | cross-account |
| least-privilege-how-do-you-refine-access | real-world-flows |
| diagnose-an-accessdenied | real-world-flows |
| sources | aws-iam-sources |

Aliases are elements inside their matching view so the existing lesson controller can resolve them. Assignment fragments similarly open the owning Identity Center view. Browser navigation updates active state without creating another history entry. Empty fragments return to the map.

### Prototype implementation contract

`aws-iam-visual-prototype.html` is self-contained: inline CSS, inline compiled console/topic JavaScript, inline SVG symbols, semantic HTML, all fifteen views and the working three hero mechanisms. It needs no package installation, remote image, script, font, or live AWS credentials. It is stored only under guide/topics/aws-iam, excluded from catalogue, routing, legacy synchronization, and Pagefind.

### Deep-dive handoffs

Link only to existing Identity & Credential Flows, OAuth 2.0 & OIDC, and VPC Packet Flow topics. Further service-specific KMS, RCP and endpoint authorization coverage remains inline caveats and primary documentation; do not publish speculative internal routes.

## Page acceptance and validation

Required: factual review, all metadata, no duplicate topic entry, old route redirects, all fragment aliases, six policy outcomes, bridge success and two failure states, seven-stage journey, time expiry/reset, assignment disclosure, 320 px/desktop/200% zoom, keyboard, reduced motion, no-JavaScript reading order, source validation, check/build/graph/link verification. Automated checks do not imply manual screen-reader, physical-touch or native-browser zoom review.

Validation results are recorded below after integration.

## Source index
1. [IAM policy types](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html) — verified 2026-10-17.
2. [Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html) — verified 2026-10-17.
3. [Role and session grant exceptions](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html) — verified 2026-10-17.
4. [STS AssumeRole API](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html) — verified 2026-10-17.
5. [Organizations SCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) — verified 2026-10-17.
6. [Permissions boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html) — verified 2026-10-17.
7. [Identity Center permission sets](https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html) — verified 2026-10-17.
8. [EC2 role credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html) — verified 2026-10-17.
9. [EKS Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html) — verified 2026-10-17.
10. [Federation into AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers.html) — verified 2026-10-17.
11. [CLI role profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html) — verified 2026-10-17.
12. [SigV4 request signing](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html) — verified 2026-10-17.
13. [CloudTrail for IAM and STS](https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html) — verified 2026-10-17.
14. [Cross-account evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html) — verified 2026-10-17.
15. [STS credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html) — verified 2026-10-17.
16. [ECS task IAM roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html) — verified 2026-10-17.
17. [Lambda execution roles](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html) — verified 2026-10-17.
18. [EKS IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) — verified 2026-10-17.
19. [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html) — verified 2026-10-17.

## Integration validation — 2026-10-17

- `npm run verify` passed after the compatibility-route fix: Astro checked 235 files with zero errors/warnings and two pre-existing unused-variable hints in CORS; static build and Pagefind completed; catalogue graph checked 31 topics/300 relationships; internal-link checks passed 49 generated pages.
- Chromium inspected all fifteen views at 1440, 1000, 760, 390 and 320 CSS px: no detected view content overflowing the viewport. All fifteen also passed the same overflow check at 200% CSS zoom. Desktop map, policy lab, request journey and representative mobile screenshots were visually inspected.
- Browser mechanisms passed: seven journey stages, direct stage selection and restart; bridge success, missing target trust and missing caller permission; credential expiration and reset; six policy decisions and representative JSON selection for all five policy types.
- Keyboard Enter operated journey and bridge controls; keyboard End expired the credential set. A mobile context with touch emulation operated the bridge and grouped-index navigation. Reduced-motion computed transitions were zero seconds.
- Axe-core WCAG 2 A/AA and 2.1 A/AA checks reported zero violations across all fifteen selected views after correcting numbered stage-button accessible names. This is an automated scan, not a complete accessibility audit.
- No-JavaScript Chromium showed all fifteen views in source order. Stable fragments, ten old view/figure aliases, assignment disclosure, sources, reload and Back navigation passed. Empty-fragment handling reuses the shared lesson console.
- Production preview verified all three old/collection-prefixed compatibility routes retain `#evaluation-why-was-it-allowed-or-denied` and select the correct IAM view. Astro's default meta-only redirect lost fragments in the initial test; the custom compatibility document fixes this with `location.replace`, while Vercel retains permanent HTTP redirects. Without JavaScript, compatibility documents open the canonical stacked reading path.
- The standalone prototype was opened via `file://`: the journey, bridge failure and session-grant scenario worked; no page errors, external requests or duplicate IDs were detected. Inline CSS and JavaScript require no build or remote assets.
- All nineteen linked primary-source pages returned HTTP 200. No real AWS account or live authorization request was used; the policy lab is a bounded model, not an AWS policy simulator.
- Remaining manual review: screen-reader behavior, physical touch device, native browser zoom, full contrast review, and owner approval of the visual direction. Vercel redirects are configured locally and were not deployed.
