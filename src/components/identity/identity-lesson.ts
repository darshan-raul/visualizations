import type { Lesson, View } from '../lesson/lesson-types';
import { panels } from './identity-model';
import { FOUR, fourViews } from './four-questions-lesson';
const aws = (path: string) => `https://docs.aws.amazon.com/${path}`;
export const identitySources = [
  { label: 'AWS CLI: configure Identity Center', url: aws('cli/latest/userguide/cli-configure-sso.html') },
  { label: 'AWS CLI: Identity Center concepts', url: aws('cli/latest/userguide/cli-configure-sso-concepts.html') },
  { label: 'Identity Center: GetRoleCredentials', url: aws('singlesignon/latest/PortalAPIReference/API_GetRoleCredentials.html') },
  { label: 'Identity Center: provisioned IAM roles', url: aws('singlesignon/latest/userguide/identity-center-and-iam-roles.html') },
  { label: 'AWS STS: AssumeRole', url: aws('STS/latest/APIReference/API_AssumeRole.html') },
  { label: 'IAM: cross-account evaluation', url: aws('IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html') },
  { label: 'IAM: using temporary credentials', url: aws('IAM/latest/UserGuide/id_credentials_temp_use-resources.html') },
  { label: 'IAM: Signature Version 4', url: aws('IAM/latest/UserGuide/reference_sigv.html') },
  { label: 'SDKs: credential providers', url: aws('sdkref/latest/guide/standardized-credentials.html') },
  { label: 'EC2: roles and instance profiles', url: aws('AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html') },
  { label: 'ECS: task role', url: aws('AmazonECS/latest/developerguide/task-iam-roles.html') },
  { label: 'Lambda: execution role', url: aws('lambda/latest/dg/lambda-intro-execution-role.html') },
  { label: 'STS: AssumeRoleWithWebIdentity', url: aws('STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html') },
  { label: 'IAM: PassRole', url: aws('IAM/latest/UserGuide/id_roles_use_passrole.html') },
  { label: 'IAM: confused deputy and ExternalId', url: aws('IAM/latest/UserGuide/confused-deputy.html') },
  { label: 'IAM: source identity', url: aws('IAM/latest/UserGuide/id_credentials_temp_control-access_monitor.html') },
  { label: 'IAM: session tags', url: aws('IAM/latest/UserGuide/id_session-tags.html') },
  { label: 'IAM: role and role-session principals', url: aws('IAM/latest/UserGuide/reference_policies_elements_principal.html') },
  { label: 'AWS CLI: role profiles', url: aws('cli/latest/userguide/cli-configure-role.html') },
  { label: 'AWS CLI: configuration precedence', url: aws('cli/latest/userguide/cli-chap-configure.html') },
  { label: 'STS: GetCallerIdentity', url: aws('STS/latest/APIReference/API_GetCallerIdentity.html') },
  { label: 'AWS CLI: configure list', url: aws('cli/latest/reference/configure/list.html') },
  { label: 'IAM: session policies and boundaries', url: aws('IAM/latest/UserGuide/access_policies_boundaries.html') },
  { label: 'STS: GetFederationToken', url: aws('STS/latest/APIReference/API_GetFederationToken.html') },
  { label: 'IAM: policy evaluation', url: aws('IAM/latest/UserGuide/reference_policies_evaluation-logic.html') },
  { label: 'IoT Core: certificate credential provider', url: aws('iot/latest/developerguide/authorizing-direct-aws.html') },
  { label: 'STS: GetSessionToken', url: aws('STS/latest/APIReference/API_GetSessionToken.html') },
  { label: 'IAM: how requests are allowed or denied', url: aws('IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html') },
  { label: 'IAM: the request context', url: aws('IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-reqcontext.html') },
  { label: 'IAM: global condition keys', url: aws('IAM/latest/UserGuide/reference_policies_condition-keys.html') },
  { label: 'Organizations: SCPs', url: aws('organizations/latest/userguide/orgs_manage_policies_scps.html') },
  { label: 'S3: policy actions', url: aws('AmazonS3/latest/userguide/using-with-s3-policy-actions.html') },
  { label: 'S3: bucket policies for VPC endpoints', url: aws('AmazonS3/latest/userguide/example-bucket-policies-vpc-endpoint.html') },
];
const source = (label: string) => {
  const index = identitySources.findIndex((item) => item.label === label);
  if (index < 0) throw new Error(`Unknown identity source: ${label}`);
  return index;
};
const info = [
  { group: 'Credential pipeline', label: 'Pipeline', title: 'From identity to authorized request', lede: 'Choose a source path, then follow credentials and authorization through six stages.', point: 'The source proves who it is. A provider supplies credentials. Each signed request is authorized for its action and resource.', note: 'A role ARN and a session ARN are identifiers, not credentials. Temporary AWS credentials also differ from an Identity Center access token.', sources: [2,4,6,7,17,23,24] },
  { group: 'Identity sources', label: 'Workforce login', title: 'Browser sign-in is the beginning of the credential journey', lede: 'Start with the workforce profile in account 111111111111. The CLI obtains AWS credentials after the human signs in.', point: 'The Identity Center access token gets role credentials; the AWS session token accompanies the signed AWS request.', note: 'Verified October 15, 2026: CLI v2.22.0 and later default to PKCE. --use-device-code selects device authorization. Cache files are tool-managed.', sources: [0,1,2] },
  { group: 'Identity sources', label: 'Permission sets', title: 'Identity Center configures a role inside the account', lede: 'The group assignment selects who gets access; the permission set describes the account-side role to provision.', point: 'The permission set is the template; an account-side IAM role is what the issued session uses.', note: 'Removing all assignments for a permission set in an account and assigning it again can change the role’s ARN suffix. Review policies that reference that ARN.', sources: [3,0] },
  { group: 'Identity sources', label: 'Workload identity', title: 'Workloads need a credential provider, not a human login', lede: 'Keep the same report-reading job and change where it runs. Watch what supplies the SDK’s credential set.', point: 'Identify the workload’s role and provider. An OIDC identity token can bootstrap AWS credentials without an AWS access key.', note: 'Provider support, refresh and precedence vary by SDK and version. IAM user access keys can also sign AssumeRole, but they are not the workforce path shown here.', sources: [8,9,10,11,12] },
  { group: 'Authentication', label: 'Signed request', title: 'The CLI signs the request without sending the secret key', lede: 'Use SupportRead’s temporary credentials for one header-signed S3 ListObjectsV2 call.', point: 'The secret computes the signature locally; the service still needs to authorize the requested action.', note: 'This is SigV4 with temporary credentials over HTTPS. Presigned URLs and services with other authentication schemes are outside this view.', sources: [7,6] },
  { group: 'Assume role', label: 'Cross-account', title: 'Cross-account access has two separate requests', lede: 'First ask STS for SupportRead in production. Then use that session to ask S3 for the report listing.', point: 'Permission to create a role session and permission to use a resource are different decisions.', note: 'These four presets isolate documented boundaries; they do not run AWS’s complete policy engine. Same-account direct trust has additional identity-policy nuances. Other applicable policies can still deny access.', sources: [4,5,22] },
  { group: 'Assume role', label: 'Role chaining', title: 'A second role starts a new permission context', lede: 'The workforce session is already a role session, so its AssumeRole request to production is role chaining.', point: 'Role chaining creates separate credentials with a one-hour maximum; source permissions do not accumulate into the new session.', note: 'Verified October 15, 2026: AssumeRole has a 15-minute minimum; a role’s configured maximum can be 1–12 hours. A chained session is capped at one hour. Resource-policy grants and other controls need their own evaluation.', sources: [4,18,22] },
  { group: 'Authorization', label: 'Assume or pass?', title: 'Who should receive the role’s credentials?', lede: 'Compare Maya using a role herself with Maya configuring a Lambda function to use an execution role.', point: 'AssumeRole returns credentials to the caller. PassRole authorizes a service-role association.', note: 'Scope iam:PassRole to approved role ARNs and, where appropriate, iam:PassedToService. Audit the service API event, such as CreateFunction; there is no separate PassRole API event.', sources: [13,11] },
  { group: 'Across accounts', label: 'Vendor access', title: 'ExternalId binds the deputy to the customer', lede: 'A reporting vendor serves several customers. Each customer trusts the vendor, but only for the expected tenant context.', point: 'The vendor chooses ExternalId from its authenticated tenant record; a customer-supplied role ARN alone cannot choose the tenant.', note: 'The vendor generates and controls a unique ExternalId per customer. It is not a secret, a password, or a replacement for the vendor principal and scoped permissions.', sources: [14,4] },
  { group: 'Services & use cases', label: 'Expiry & refresh', title: 'An upstream login and AWS credentials have different clocks', lede: 'Distinguish refreshing a provider from keeping an exported access-key snapshot in a shell.', point: 'A provider obtains a new credential set. It does not extend the lifetime of the old one.', note: 'Timeline lengths are illustrative, not service defaults. Reauthentication, credential expiration and revocation are separate mechanisms; do not treat logout as immediate revocation of every issued session.', sources: [1,6,8,18] },
  { group: 'Across accounts', label: 'Session context', title: 'Trace the request back through the role session', lede: 'Read the session ARN, the issuing role and optional attribution context without mistaking a label for proof of a person.', point: 'Audit the acting session and its issuer. Constrain the context that callers are allowed to attach.', note: 'Prefer role principals in policies where practical. Direct grants to role-session principals have different interactions with implicit denies from boundaries and session policies; use the authorization explorer for that decision.', sources: [15,16,17,22] },
  { group: 'Services & use cases', label: 'Find the failure', title: 'Find the first credential boundary that failed', lede: 'Choose a symptom, then reveal the evidence one check at a time. These are deterministic teaching transcripts, not live AWS calls.', point: 'First verify the provider and actual caller; then separate issuance failure from resource authorization failure.', note: 'Exact AWS error wording varies. A generic AccessDenied does not identify a single failing policy. GetCallerIdentity identifies the caller and does not prove S3 permission.', sources: [19,20,21,5] },
];
export const identityLesson: Lesson = {
  id: 'identity', collection: { href: '/aws', label: 'AWS' },
  kicker: 'AWS · IDENTITY & CREDENTIALS', title: 'AWS Identity Pipeline',
  summary: 'How AWS judges a request, and how callers get credentials to send it.',
  reference: 'MAYA → PRODUCTION REPORTS', format: 'FLOW EXPLORER · INTERMEDIATE',
  scenario: 'Maya · list reports · workforce 111… → production 222…',
  scope: 'AWS CLI v2 and documented IAM, STS and Identity Center relationships, verified October 15, 2026. Account IDs, ARNs, outputs and times are fictional teaching fixtures. The diagrams show API contracts and ownership, not AWS internal service topology. The opening views and simulator model one S3 decision in AWS\'s documented evaluation order and leave out RCPs, session policies, ACLs and Block Public Access; the authorization explorer covers more policy types.',
  groups: [FOUR, 'Credential pipeline', 'Identity sources', 'Authentication', 'Authorization', 'Assume role', 'Across accounts', 'Services & use cases'],
  views: [...fourViews(source), ...info.map((item, index): View => ({
    id: panels[index].id, group: item.group, label: item.label, title: item.title, lede: item.lede,
    mode: 'custom', hero: [0,5,11].includes(index), frames: [], sources: item.sources, takeaway: item.point,
    inspector: { heading: panels[index].states[0].title, body: panels[index].states[0].body,
      facts: panels[index].states[0].facts ?? [['Starting actor', 'Maya or the selected workload'], ['Resource goal', 'List the production report bucket']],
      evidence: ['CURRENT CREDENTIAL CONTEXT', panels[index].states[0].credential], note: item.note },
  }))],
  sources: identitySources,
  related: [{label:'AWS authorization decisions',href:'/aws-authorization-decision-explorer'},{label:'OAuth 2.0 & OIDC',href:'/oauth2-explainer'},{label:'SSH trust & authentication',href:'/ssh'}],
  legend: [{ kind:'identity',label:'identity / trust' },{kind:'hot',label:'request / response'},{kind:'concept',label:'configuration relationship (dashed)'},{kind:'denied',label:'blocked exchange'}],
};
