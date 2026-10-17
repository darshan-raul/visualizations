import { code, edge, node, type Diagram, type Gate, type GatePanel, type Lesson, type View } from "../lesson/lesson-types";

const DEV_ACCT = "111111111111";
const PROD_ACCT = "222222222222";
const DEPUTY_ACCT = "777777777777";
const ATK_ACCT = "999999999999";
const PROD_ROLE = `arn:aws:iam::${PROD_ACCT}:role/ProdReadOnly`;
const PROD_SESS = `arn:aws:sts::${PROD_ACCT}:assumed-role/ProdReadOnly/darshan`;
const ENG_ROLE = `arn:aws:iam::${DEV_ACCT}:role/Engineering`;
const PROD_OBJ = "arn:aws:s3:::prod-artifacts/releases/app.zip";

const WORDS = {
  ok: "ALLOWED",
  stopped: "DENIED",
  pass: "yes",
  fail: "no",
  skip: "not reached",
};

const gatePanel = (title: string, call: string, ok: boolean, verdict: string, rows: Gate[]): GatePanel => ({
  title,
  call,
  ok,
  verdict,
  words: WORDS,
  rows,
});

/* --------------------------------------------------------------------------
 * Diagrams — one progressive visual chain from a single account to multi-account
 * -------------------------------------------------------------------------- */

const ONE_ACCOUNT: Diagram = {
  title: "Starting with one account and one bucket, then adding a second account across a wall",
  width: 1248,
  height: 368,
  zones: [
    { id: "zdev", x: 12.8, y: 12.8, w: 688, h: 336, label: `ACCOUNT ${DEV_ACCT} · DEV` },
    { id: "zprod", x: 739.2, y: 12.8, w: 496, h: 336, label: `ACCOUNT ${PROD_ACCT} · PROD` },
  ],
  nodes: [
    node("darshan", "person", 82.8, 84, "Darshan", "user/darshan", 148, 56),
    node("devpol", "model", 82.8, 244, "identity policy", "on user/darshan", 148, 56),
    node("devbkt", "store", 453.6, 84, "dev-notes", "readme.txt", 168, 56),
    node("prodrole", "model", 815.2, 244, "ProdReadOnly", "role in Prod", 136, 56),
    node("prodbkt", "store", 988.6, 84, "prod-artifacts", "releases/app.zip", 170, 56),
  ],
  edges: [
    edge("get-dev", "darshan", "devbkt", "s3:GetObject"),
    edge("pol-allow", "devpol", "darshan", "Allow"),
    edge("cross-try", "darshan", "prodbkt", "s3:GetObject across wall", { via: [[336, 201.6], [864, 201.6]] }),
    edge("assume-path", "darshan", "prodrole", "1. AssumeRole", { via: [[336, 272]] }),
    edge("role-read", "prodrole", "prodbkt", "2. GetObject", { via: [[1073.6, 272]] }),
  ],
};

const WORKLOADS: Diagram = {
  title: "People and compute workloads signing HTTPS requests to S3",
  width: 1248,
  height: 400,
  zones: [
    { id: "zdev", x: 12.8, y: 12.8, w: 1222.4, h: 374.4, label: `ACCOUNT ${DEV_ACCT} · CALLERS & CREDENTIAL SOURCES` },
  ],
  nodes: [
    node("user", "person", 84.9, 69.4, "Darshan", "user/darshan", 155, 50),
    node("ec2", "code", 84.9, 162.2, "EC2 instance", "AppServer", 155, 50),
    node("eks", "code", 84.9, 255, "EKS pod / ECS", "payments-api", 155, 50),
    node("lambda", "code", 417.5, 296.6, "Lambda function", "OrderProcessor", 165, 50),
    node("keys", "part", 516.5, 70, "long-term key", "AKIA… (no expiry)", 175, 52),
    node("sts", "tool", 516.5, 180, "STS + metadata", "ASIA… (rotates)", 175, 56),
    node("s3", "store", 986.4, 155, "dev-notes bucket", "signed HTTPS call", 168, 58),
  ],
  edges: [
    edge("u-k", "user", "keys", "stored key"),
    edge("k-s3", "keys", "s3", "SigV4 (no STS)"),
    edge("ec2-sts", "ec2", "sts", "IMDSv2"),
    edge("eks-sts", "eks", "sts", "Pod Identity"),
    edge("lam-sts", "lambda", "sts", "runtime"),
    edge("sts-s3", "sts", "s3", "SigV4 + token"),
  ],
};

const ROLE_UNIFORM: Diagram = {
  title: "An IAM role separates who can put it on (trust policy) from what it can do (permissions policy)",
  width: 1248,
  height: 392,
  zones: [
    { id: "zdev", x: 12.8, y: 12.8, w: 313.6, h: 364.8, label: `ACCOUNT ${DEV_ACCT}` },
    { id: "zprod", x: 617.6, y: 12.8, w: 617.6, h: 364.8, label: `ACCOUNT ${PROD_ACCT} · PROD` },
  ],
  nodes: [
    node("caller", "person", 85.6, 164.6, "Engineering", "Darshan's session", 168, 58),
    node("sts", "tool", 405, 164.6, "AWS STS", "AssumeRole", 134, 58),
    node("trust", "model", 696.8, 61, "trust policy", "who can wear me?", 168, 54),
    node("role", "model", 696.8, 167.2, "ProdReadOnly", "assumed-role session", 168, 56),
    node("perm", "model", 696.8, 281.8, "permissions policy", "what can I do?", 168, 54),
    node("s3", "store", 1015.2, 167.2, "prod-artifacts", "releases/app.zip", 152, 56),
    node("lambda", "code", 405, 290.8, "Lambda service", "assumes later", 134, 52),
  ],
  edges: [
    edge("ask-sts", "caller", "sts", "sts:AssumeRole"),
    edge("chk-trust", "trust", "sts", "allows caller?"),
    edge("mint-role", "sts", "role", "ASIA… session"),
    edge("chk-perm", "perm", "role", "allows action?"),
    edge("call-s3", "role", "s3", "s3:GetObject"),
    edge("pass-role", "caller", "lambda", "iam:PassRole"),
    edge("svc-assume", "lambda", "sts", "AssumeRole"),
  ],
};

const STS_MINT: Diagram = {
  title: "AWS STS issues a temporary credential set with an expiration timestamp",
  width: 1248,
  height: 352,
  zones: [
    { id: "zdev", x: 12.8, y: 12.8, w: 304, h: 326.4, label: `ACCOUNT ${DEV_ACCT}` },
    { id: "zprod", x: 640, y: 12.8, w: 595.2, h: 326.4, label: `ACCOUNT ${PROD_ACCT} · PROD` },
  ],
  nodes: [
    node("eng", "person", 83.8, 145.4, "Engineering", "source session", 162, 58),
    node("sts", "tool", 402.8, 145.4, "AWS STS", "AssumeRole", 148, 58),
    node("pass", "model", 721.3, 75, "ASIA… credential set", "key + secret + token", 175, 58),
    node("clock", "part", 721.3, 217.2, "Expiration timestamp", "15m to 12h TTL", 175, 52),
    node("s3", "store", 1030.8, 145.4, "prod-artifacts", "releases/app.zip", 140, 58),
  ],
  edges: [
    edge("e-sts", "eng", "sts", "AssumeRole"),
    edge("sts-pass", "sts", "pass", "returns trio"),
    edge("clock-pass", "clock", "pass", "bounds TTL"),
    edge("pass-s3", "pass", "s3", "signed GetObject"),
  ],
};

const LAPTOP_SIGV4: Diagram = {
  title: "Local CLI profile configuration on your laptop and SigV4 request signing",
  width: 1248,
  height: 384,
  zones: [
    { id: "zlap", x: 12.8, y: 12.8, w: 744, h: 358.4, label: "YOUR LAPTOP · OUTSIDE AWS" },
    { id: "zaws", x: 792, y: 12.8, w: 443.2, h: 358.4, label: `AWS CLOUD · ${PROD_ACCT}` },
  ],
  nodes: [
    node("cfg", "store", 76.6, 84, "~/.aws/config", "[profile prod]", 138, 56),
    node("cli", "code", 334, 84, "AWS CLI", "--profile prod", 132, 56),
    node("sig", "tool", 579.4, 84, "SigV4 signer", "HMAC-SHA256", 118, 56),
    node("sec", "part", 376.6, 249.2, "SecretAccessKey", "never leaves laptop", 274, 52),
    node("sts", "tool", 858.5, 246.6, "AWS STS", "returns ASIA…", 115, 54),
    node("s3", "store", 1000, 84, "prod-artifacts", "verifies signature", 160, 56),
  ],
  edges: [
    edge("c-cli", "cfg", "cli", "reads"),
    edge("cli-sts", "cli", "sts", "1. AssumeRole", { via: [[400, 188.8], [915.2, 188.8]] }),
    edge("cli-sig", "cli", "sig", "request"),
    edge("sec-sig", "sec", "sig", "signs hash"),
    edge("sig-s3", "sig", "s3", "2. Authorization + token"),
    edge("ghost", "cfg", "s3", "sends profile name?", { kind: "imagined", via: [[145.6, 339.2], [1080, 339.2]] }),
  ],
};

const CROSS_DEPUTY: Diagram = {
  title: "Cross-account access paths and the confused deputy attack across three parties",
  width: 1248,
  height: 505.6,
  zones: [
    { id: "zdev", x: 12.8, y: 12.8, w: 371.2, h: 188.8, label: `ACCOUNT ${DEV_ACCT} · DEV` },
    { id: "zext", x: 12.8, y: 220.8, w: 371.2, h: 272, label: `DEPUTY (${DEPUTY_ACCT.slice(0, 3)}…) & ATTACKER (${ATK_ACCT.slice(0, 3)}…)` },
    { id: "zprod", x: 761.6, y: 12.8, w: 473.6, h: 480, label: `ACCOUNT ${PROD_ACCT} · PROD` },
  ],
  nodes: [
    node("eng", "person", 96.4, 80.8, "Engineering", "outbound IAM policy", 204, 56),
    node("deputy", "tool", 96.4, 273.6, "Trusted Deputy", "ScoutCorp / SNS", 204, 48),
    node("atk", "person", 96.4, 408, "Attacker 999…", "supplies Prod ARN", 204, 48),
    node("sts", "tool", 489.7, 80.8, "AWS STS", "checks trust + ID", 131, 56),
    node("role", "model", 870.4, 80.8, "ProdReadOnly", "trust policy on role", 256, 56),
    node("bkt", "store", 870.4, 234.4, "prod-artifacts", "releases/app.zip", 256, 56),
    node("bpol", "model", 870.4, 380.4, "bucket policy", "resource policy on S3", 256, 52),
  ],
  edges: [
    edge("e-sts", "eng", "sts", "AssumeRole"),
    edge("sts-role", "sts", "role", "ASIA…"),
    edge("role-bkt", "role", "bkt", "s3:GetObject"),
    edge("direct-bkt", "eng", "bkt", "direct GetObject", { via: [[555.2, 262.4]] }),
    edge("bpol-bkt", "bpol", "bkt", "allows 111…"),
    edge("atk-dep", "atk", "deputy", "1. spoof ARN", { shift: 6 }),
    edge("dep-sts", "deputy", "sts", "2. AssumeRole", { via: [[555.2, 297.6]] }),
    edge("dep-bkt", "deputy", "bkt", "2. service call", { via: [[555.2, 297.6]] }),
  ],
};

const SSO_CENTER: Diagram = {
  title: "IAM Identity Center connects an external identity provider to provisioned IAM roles in member accounts",
  width: 1248,
  height: 384,
  zones: [
    { id: "zidp", x: 12.8, y: 12.8, w: 328, h: 358.4, label: "EXTERNAL IDP" },
    { id: "zorg", x: 376, y: 12.8, w: 859.2, h: 358.4, label: "AWS ORGANIZATION · IAM IDENTITY CENTER" },
  ],
  nodes: [
    node("idp", "person", 88, 155, "Identity Provider", "Okta / Entra ID", 176, 58),
    node("sso", "tool", 459, 155, "Identity Center", "Permission Sets", 170, 58),
    node("devrole", "model", 856.4, 71.2, `Dev account ${DEV_ACCT.slice(0, 3)}…`, "AWSReservedSSO_Admin…", 268, 56),
    node("prodrole", "model", 856.4, 189.6, `Prod account ${PROD_ACCT.slice(0, 3)}…`, "AWSReservedSSO_ReadOnly…", 268, 56),
    node("prodbkt", "store", 856.4, 292.2, "prod-artifacts", "read via SSO role session", 268, 46),
  ],
  edges: [
    edge("idp-sso", "idp", "sso", "SAML / OIDC"),
    edge("sso-dev", "sso", "devrole", "provisions role"),
    edge("sso-prod", "sso", "prodrole", "provisions role"),
    edge("prod-bkt", "prodrole", "prodbkt", "s3:GetObject"),
  ],
};


const DIAG_FLOW: Diagram = {
  title: "Where an AWS request can fail: at STS role assumption, caller selection, or S3 resource evaluation",
  width: 1248,
  height: 344,
  nodes: [
    node("cli", "code", 64.2, 80.8, "Your CLI / app", "--profile prod", 150, 56),
    node("sts", "tool", 392.1, 80.8, "1. AWS STS", "sts:AssumeRole", 155, 56),
    node("sess", "person", 729.5, 80.8, "2. Role session", "ProdReadOnly/darshan", 165, 56),
    node("s3", "store", 1052, 80.8, "3. Amazon S3", "s3:GetObject", 136, 56),
    node("ct", "store", 568, 237, "CloudTrail event log", "userIdentity · errorCode", 240, 54),
  ],
  edges: [
    edge("c-sts", "cli", "sts", "AssumeRole"),
    edge("sts-sess", "sts", "sess", "ASIA…"),
    edge("sess-s3", "sess", "s3", "GetObject"),
    edge("cli-s3", "cli", "s3", "wrong key (111…)", { via: [[139.2, 25.6], [1120, 25.6]] }),
    edge("sts-ct", "sts", "ct", "logs AssumeRole"),
    edge("s3-ct", "s3", "ct", "logs GetObject"),
  ],
};

/* --------------------------------------------------------------------------
 * Views
 * -------------------------------------------------------------------------- */

const views: View[] = [
  /* VIEW 1: ONE ACCOUNT, ONE BUCKET, THEN A WALL */
  {
    id: "kingdom",
    aliases: ["identity-map", "request-journey"],
    group: "One account & wall",
    label: "One account, one wall",
    title: "Start with one account, one bucket, and one person",
    lede: "Before looking at roles, organizations, or cross-account bridges, start inside a single AWS account. Darshan wants to read a file from an S3 bucket. Build the mental model one piece at a time.",
    mode: "steps",
    hero: true,
    diagram: ONE_ACCOUNT,
    frames: [
      {
        action: "1. No policy yet",
        caption: `Account ${DEV_ACCT} contains one IAM user (Darshan) and one S3 bucket (dev-notes). When Darshan asks S3 for readme.txt, AWS starts from Implicit Deny: nothing allows the call, so S3 rejects it.`,
        pic: {
          show: ["zdev", "darshan", "devbkt", "get-dev"],
          denied: ["get-dev", "devbkt"],
          badge: { devbkt: "403 Denied" },
        },
        gates: gatePanel(
          "Every request starts denied",
          `user/darshan → s3:GetObject arn:aws:s3:::dev-notes/readme.txt`,
          false,
          "Implicit deny: no policy statement allows s3:GetObject on this bucket.",
          [
            { check: "Explicit Deny anywhere?", result: "pass", why: "No policy explicitly denies the call." },
            { check: "Matching Allow statement?", result: "fail", why: "Darshan has no identity policy attached, and dev-notes has no bucket policy." },
          ]
        ),
      },
      {
        action: "2. Attach an Allow",
        caption: "Attach one identity policy to Darshan that allows s3:GetObject on arn:aws:s3:::dev-notes/*. Now the Principal, Action, and Resource all match, so S3 returns readme.txt.",
        pic: {
          show: ["zdev", "darshan", "devpol", "devbkt", "pol-allow", "get-dev"],
          fresh: ["devpol", "pol-allow"],
          hot: ["pol-allow", "get-dev", "devbkt"],
          badge: { devbkt: "200 OK" },
        },
        gates: gatePanel(
          "One matching Allow inside the same account",
          `user/darshan → s3:GetObject arn:aws:s3:::dev-notes/readme.txt`,
          true,
          "Allowed: the identity policy on user/darshan grants s3:GetObject on dev-notes/*.",
          [
            { check: "Explicit Deny anywhere?", result: "pass", why: "No Deny statement matches." },
            { check: "Identity policy on Darshan", result: "pass", why: "Allows Action s3:GetObject on Resource arn:aws:s3:::dev-notes/*." },
          ]
        ),
        code: [
          code(
            "Identity policy attached to user/darshan",
            `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::dev-notes/*"
  }]
}`,
            [4, 5, 6]
          ),
        ],
      },
      {
        action: "3. Add a second account",
        caption: `Production lives in a second AWS account (${PROD_ACCT}) with a wall around its resources. Even if Darshan's Dev policy says Allow s3:GetObject on *, Account ${DEV_ACCT} cannot unilaterally grant access to Account ${PROD_ACCT}'s bucket.`,
        pic: {
          show: ["zdev", "zprod", "darshan", "devpol", "devbkt", "prodbkt", "pol-allow", "cross-try"],
          fresh: ["zprod", "prodbkt"],
          denied: ["cross-try", "prodbkt"],
          badge: { prodbkt: "403 Denied" },
        },
        gates: gatePanel(
          "An account boundary stops unilateral grants",
          `user/darshan (${DEV_ACCT}) → s3:GetObject arn:aws:s3:::prod-artifacts/releases/app.zip (${PROD_ACCT})`,
          false,
          `Denied: Account ${DEV_ACCT} allows the call, but Account ${PROD_ACCT} has not agreed.`,
          [
            { check: `Caller account (${DEV_ACCT}) identity policy`, result: "pass", why: "Allows s3:GetObject on *." },
            { check: `Target account (${PROD_ACCT}) agreement`, result: "fail", why: "Prod's bucket policy does not name Account 111111111111." },
          ]
        ),
      },
      {
        action: "4. Two ways across the wall",
        caption: `To let Darshan read prod-artifacts/releases/app.zip, Account ${PROD_ACCT} must agree. Either Darshan temporarily puts on an IAM role inside Production (ProdReadOnly), or Production's bucket policy directly allows Darshan's Dev principal.`,
        pic: {
          show: ["zdev", "zprod", "darshan", "devpol", "devbkt", "prodrole", "prodbkt", "pol-allow", "assume-path", "role-read"],
          fresh: ["prodrole", "assume-path", "role-read"],
          hot: ["assume-path", "role-read"],
          badge: { prodbkt: "2 paths in" },
        },
        state: {
          title: "The four questions AWS asks on every request (PARC)",
          rows: [
            { key: "Principal (WHO)", value: "The user or role session that signed the request", mark: "new" },
            { key: "Action (WHAT)", value: "The operation, such as s3:GetObject or sts:AssumeRole", mark: "new" },
            { key: "Resource (WHICH)", value: "The target ARN, such as arn:aws:s3:::prod-artifacts/*", mark: "new" },
            { key: "Condition (WHEN/WHERE)", value: "Optional context checks on IP, TLS, or ExternalId", mark: "new" },
          ],
        },
      },
    ],
    inspector: {
      heading: "Accounts are hard administrative boundaries",
      body: "An AWS account is the fundamental container for identities and resources. Inside one account, an identity policy attached to a user or role is enough to grant access to most resources in that same account. Across two accounts, the boundary wall limits the blast radius to a single account: one account can never grant itself access to another account's resources unless the second account also agrees.",
      facts: [
        ["Default stance", "Implicit deny until a policy statement grants Allow"],
        ["PARC model", "Principal, Action, Resource, Condition"],
        ["Same-account call", "An identity policy Allow is usually sufficient"],
        ["Cross-account call", "Both the caller's account and target account must allow it"],
      ],
      evidence: ["CHECK WHO YOU ARE RIGHT NOW", "aws sts get-caller-identity"],
      note: "The account root user is the one exception to default implicit deny inside its own account. Lock away root credentials with MFA and use IAM roles for daily work.",
    },
    takeaway: "Every AWS request starts denied and is matched against Principal, Action, Resource, and Condition; an account wall blocks access until both accounts agree.",
    sources: [0, 1, 13],
  },

  /* VIEW 2: PEOPLE & WORKLOADS */
  {
    id: "workload-identity",
    aliases: ["users-roles", "principal-who-signed-the-request"],
    group: "Identities & roles",
    label: "People & workloads",
    title: "People and workloads make the exact same signed request",
    lede: "AWS does not have one authorization system for humans and another for servers. Whether a request comes from your laptop, an EC2 instance, a container, or a Lambda function, S3 only sees an HTTPS request signed with credentials.",
    mode: "choices",
    hero: false,
    diagram: WORKLOADS,
    frames: [
      {
        action: "1. IAM user (AKIA… key)",
        caption: "An IAM user can hold long-term access keys starting with AKIA. The CLI signs the S3 request directly with that key—it never calls AWS STS, and the key never expires unless someone rotates or deletes it.",
        pic: {
          show: ["zdev", "user", "ec2", "eks", "lambda", "keys", "sts", "s3", "u-k", "k-s3"],
          hot: ["user", "u-k", "keys", "k-s3", "s3"],
          badge: { keys: "never expires" },
        },
        state: {
          title: "IAM user long-term credentials",
          rows: [
            { key: "Principal ARN", value: `arn:aws:iam::${DEV_ACCT}:user/darshan` },
            { key: "AccessKeyId prefix", value: "AKIA… (long-term access key)", mark: "read" },
            { key: "Touches AWS STS?", value: "No — signs S3 requests directly" },
            { key: "Operational risk", value: "Valid indefinitely if leaked to git or logs", mark: "new" },
          ],
        },
      },
      {
        action: "2. EC2 instance (IMDSv2)",
        caption: "Instead of copying AKIA keys onto a server, attach an Instance Profile to EC2. The AWS SDK fetches short-lived ASIA… role credentials from the local metadata address 169.254.169.254 and rotates them automatically.",
        pic: {
          show: ["zdev", "user", "ec2", "eks", "lambda", "keys", "sts", "s3", "ec2-sts", "sts-s3"],
          hot: ["ec2", "ec2-sts", "sts", "sts-s3", "s3"],
          badge: { sts: "ASIA… rotated" },
        },
        state: {
          title: "EC2 Instance Profile delivery",
          rows: [
            { key: "Session ARN", value: `arn:aws:sts::${DEV_ACCT}:assumed-role/AppServerRole/i-0abc123` },
            { key: "Delivery endpoint", value: "http://169.254.169.254/latest/meta-data/iam/security-credentials/", mark: "read" },
            { key: "AccessKeyId prefix", value: "ASIA… + X-Amz-Security-Token" },
            { key: "Hardening rule", value: "Require IMDSv2 session tokens (HttpTokens=required, hop limit 1)", mark: "new" },
          ],
        },
      },
      {
        action: "3. EKS pod / ECS task",
        caption: "Containers get their own role per workload rather than sharing the underlying node's role. EKS Pod Identity or the ECS container agent injects temporary ASIA… credentials into the pod or task.",
        pic: {
          show: ["zdev", "user", "ec2", "eks", "lambda", "keys", "sts", "s3", "eks-sts", "sts-s3"],
          hot: ["eks", "eks-sts", "sts", "sts-s3", "s3"],
          badge: { eks: "per-pod role" },
        },
        state: {
          title: "Container workload credentials",
          rows: [
            { key: "Session ARN", value: `arn:aws:sts::${DEV_ACCT}:assumed-role/PaymentsPodRole/eks-payments` },
            { key: "EKS mechanism", value: "EKS Pod Identity agent or IRSA projected OIDC token", mark: "read" },
            { key: "ECS mechanism", value: "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI (Task Role)" },
            { key: "Common trap", value: "ECS Task Role is for your app code; Task Execution Role is for the ECS agent", mark: "new" },
          ],
        },
      },
      {
        action: "4. Lambda function",
        caption: "When Lambda invokes your function, lambda.amazonaws.com assumes the function's Execution Role via STS and populates AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN in the environment.",
        pic: {
          show: ["zdev", "user", "ec2", "eks", "lambda", "keys", "sts", "s3", "lam-sts", "sts-s3"],
          hot: ["lambda", "lam-sts", "sts", "sts-s3", "s3"],
          badge: { lambda: "env injected" },
        },
        state: {
          title: "Lambda execution role credentials",
          rows: [
            { key: "Session ARN", value: `arn:aws:sts::${DEV_ACCT}:assumed-role/OrderProcessorRole/OrderFn` },
            { key: "Who calls STS?", value: "Service principal lambda.amazonaws.com", mark: "read" },
            { key: "Delivery to code", value: "Runtime environment variables read automatically by AWS SDK" },
            { key: "Least privilege", value: "Give each function its own execution role scoped to specific resources", mark: "new" },
          ],
        },
      },
    ],
    table: {
      title: "How different callers obtain credentials",
      head: ["Caller", "Credential prefix", "How credentials arrive", "Key distinction"],
      rows: [
        ["IAM User", "AKIA… (long-term)", "Created in IAM; stored in ~/.aws/credentials", "Does not use STS; never expires automatically"],
        ["EC2 Instance", "ASIA… (temporary)", "IMDSv2 at 169.254.169.254 via Instance Profile", "Instance Profile wraps exactly one IAM role"],
        ["ECS Task", "ASIA… (temporary)", "Container credential endpoint via Task Role", "Separate from the ECS agent's Task Execution Role"],
        ["EKS Pod", "ASIA… (temporary)", "EKS Pod Identity or OIDC service account (IRSA)", "Scopes permissions to a single Kubernetes ServiceAccount"],
        ["Lambda Function", "ASIA… (temporary)", "Injected into runtime environment by Lambda", "Trust policy trusts lambda.amazonaws.com"],
      ],
    },
    inspector: {
      heading: "Replace long-term keys with role sessions",
      body: "An IAM user is a permanent identity inside one account. Because its AKIA access keys stay valid until you delete them, a key accidentally committed to a repository can be used from anywhere. Compute workloads—and engineers signing in through an identity provider—use IAM roles instead, receiving short-lived ASIA credentials from AWS STS.",
      facts: [
        ["AKIA… prefix", "Long-term access key belonging to an IAM user"],
        ["ASIA… prefix", "Temporary access key issued by AWS STS"],
        ["IAM group", "Permission container for IAM users; not a principal and cannot sign calls"],
        ["IMDSv2", "Token-backed EC2 metadata service that blocks simple SSRF key theft"],
      ],
      evidence: [
        "QUERY EC2 METADATA CREDENTIALS (IMDSV2)",
        "TOKEN=$(curl -sX PUT 'http://169.254.169.254/latest/api/token' -H 'X-aws-ec2-metadata-token-ttl-seconds: 60') && curl -H \"X-aws-ec2-metadata-token: $TOKEN\" http://169.254.169.254/latest/meta-data/iam/security-credentials/",
      ],
      note: "An IAM group is only a way to attach policies to multiple IAM users at once. You cannot name an IAM group as a Principal in a role trust policy or bucket policy.",
    },
    takeaway: "IAM users hold permanent keys (AKIA…) that skip STS; workloads and role sessions use temporary STS credentials (ASIA…) that rotate automatically.",
    sources: [0, 7, 8, 15, 16, 17],
  },

  /* VIEW 3: A ROLE YOU PUT ON (TRUST VS PERMISSIONS) */
  {
    id: "assume-role",
    aliases: ["policies", "policies-where-can-permission-come-from"],
    group: "Identities & roles",
    label: "A role you put on",
    title: "A role is a uniform you put on, governed by two separate policies",
    lede: "To work cleanly across accounts, Darshan operates as the Engineering role in Account 111111111111 and temporarily puts on the ProdReadOnly role in Account 222222222222. Every IAM role has two policies that answer two different questions at two different times.",
    mode: "choices",
    hero: true,
    diagram: ROLE_UNIFORM,
    frames: [
      {
        action: "1. Both policies allow",
        caption: "First, Darshan calls sts:AssumeRole. AWS STS checks ProdReadOnly's trust policy ('who may put me on?') and issues a session. Second, Darshan calls s3:GetObject as that session, and S3 checks the role's permissions policy ('what may the wearer do?').",
        pic: {
          show: ["zdev", "zprod", "caller", "sts", "trust", "role", "perm", "s3", "ask-sts", "chk-trust", "mint-role", "chk-perm", "call-s3"],
          hot: ["caller", "ask-sts", "chk-trust", "sts", "mint-role", "role", "chk-perm", "call-s3", "s3"],
          badge: { sts: "1. Trust OK", s3: "2. Read OK" },
        },
        code: [
          code(
            "1. Trust policy on ProdReadOnly (checked by STS)",
            `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "${ENG_ROLE}" },
    "Action": "sts:AssumeRole"
  }]
}`,
            [5, 6]
          ),
          code(
            "2. Permissions policy on ProdReadOnly (checked by S3)",
            `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:GetObject",
    "Resource": "${PROD_OBJ}"
  }]
}`,
            [5, 6]
          ),
        ],
      },
      {
        action: "2. Trust policy says no",
        caption: "If the caller is not listed in ProdReadOnly's trust policy, STS rejects sts:AssumeRole immediately. No temporary credentials are created, and the permissions policy on ProdReadOnly is never even consulted.",
        pic: {
          show: ["zdev", "zprod", "caller", "sts", "trust", "role", "perm", "s3", "ask-sts", "chk-trust"],
          hot: ["caller"],
          denied: ["ask-sts", "chk-trust", "sts"],
          badge: { sts: "AccessDenied" },
        },
        gates: gatePanel(
          "Stopped at Step 1 (AWS STS)",
          `untrusted-caller → sts:AssumeRole ${PROD_ROLE}`,
          false,
          "STS denies AssumeRole because the role's trust policy does not allow this caller.",
          [
            { check: "Target role trust policy (who can wear me?)", result: "fail", why: "Principal is not trusted to call sts:AssumeRole." },
            { check: "Target role permissions policy (what can I do?)", result: "skip", why: "Never reached — no role session was issued." },
          ]
        ),
      },
      {
        action: "3. Trust says yes, permissions say no",
        caption: "Darshan is trusted to put on ProdReadOnly, so AssumeRole succeeds and STS issues valid ASIA… credentials. Then Darshan tries s3:DeleteObject. S3 checks the permissions policy, sees only s3:GetObject is allowed, and denies the delete.",
        pic: {
          show: ["zdev", "zprod", "caller", "sts", "trust", "role", "perm", "s3", "ask-sts", "chk-trust", "mint-role", "chk-perm", "call-s3"],
          hot: ["caller", "ask-sts", "chk-trust", "sts", "mint-role", "role"],
          denied: ["chk-perm", "call-s3", "s3"],
          say: { "call-s3": "s3:DeleteObject" },
          badge: { sts: "1. Assumed OK", s3: "2. 403 Denied" },
        },
        gates: gatePanel(
          "Assumed the role, but stopped at Step 2 (Amazon S3)",
          `${PROD_SESS} → s3:DeleteObject ${PROD_OBJ}`,
          false,
          "Obtaining role credentials and being allowed to perform an S3 action are two separate decisions.",
          [
            { check: "Step 1: STS AssumeRole (trust policy)", result: "pass", why: "Engineering is trusted; STS issued ProdReadOnly/darshan credentials." },
            { check: "Step 2: S3 DeleteObject (permissions policy)", result: "fail", why: "ProdReadOnly only allows s3:GetObject, not s3:DeleteObject." },
          ]
        ),
      },
      {
        action: "4. PassRole is not AssumeRole",
        caption: "When you configure a Lambda function or EC2 instance to use a role, you do not put the role on yourself. You pass the role ARN to AWS, which checks iam:PassRole on your identity so you cannot attach an admin role to a function you control.",
        pic: {
          show: ["zdev", "zprod", "caller", "lambda", "sts", "trust", "role", "pass-role", "svc-assume", "chk-trust", "mint-role"],
          hot: ["caller", "pass-role", "lambda", "svc-assume", "sts", "mint-role", "role"],
          badge: { lambda: "assumes at runtime" },
        },
        code: [
          code(
            "Caller needs iam:PassRole when configuring the service",
            `{
  "Effect": "Allow",
  "Action": ["lambda:CreateFunction", "iam:PassRole"],
  "Resource": "arn:aws:iam::111111111111:role/OrderProcessorRole",
  "Condition": {
    "StringEquals": { "iam:PassedToService": "lambda.amazonaws.com" }
  }
}`,
            [3, 6]
          ),
        ],
      },
    ],
    inspector: {
      heading: "Two policies on one role",
      body: "An IAM role is a configuration object with two distinct policy attachments. Its trust policy is a resource-based policy attached to the role itself that tells AWS STS which principals may call AssumeRole. Its permissions policies are identity-based policies that tell target services (like S3, EC2, or DynamoDB) what the resulting assumed-role session is allowed to do.",
      facts: [
        ["Trust policy", "Resource policy on the role; evaluated by STS during AssumeRole"],
        ["Permissions policy", "Identity policy on the role; evaluated by the service you call next"],
        ["Role ARN (configuration)", PROD_ROLE],
        ["Session ARN (runtime caller)", PROD_SESS],
      ],
      evidence: ["INSPECT A ROLE'S TRUST POLICY", "aws iam get-role --role-name ProdReadOnly --query 'Role.AssumeRolePolicyDocument'"],
      note: "Assuming a role does not add the new role's permissions to your previous permissions. While using the assumed-role session, you have only the permissions of the role you put on.",
    },
    takeaway: "A role's trust policy answers 'who can assume me?' at STS; its permissions policy answers 'what can this session do?' at the target service.",
    sources: [0, 3, 7, 16],
  },

  /* VIEW 4: STS & EXPIRING CREDENTIALS */
  {
    id: "temporary-credentials",
    aliases: ["sessions-what-happens-when-a-role-is-assumed"],
    group: "Credentials & signing",
    label: "STS & expiry",
    title: "STS hands out a temporary credential set with an expiration time",
    lede: "When AssumeRole succeeds, AWS Security Token Service (STS) returns three values that must travel together plus an expiration timestamp. Follow the credential set from issuance to expiration.",
    mode: "steps",
    hero: false,
    diagram: STS_MINT,
    frames: [
      {
        action: "1. Call AssumeRole",
        caption: `Darshan's Engineering session in Account ${DEV_ACCT} calls sts:AssumeRole, naming the target role ARN (${PROD_ROLE}) and a session label (RoleSessionName=darshan).`,
        pic: {
          show: ["zdev", "zprod", "eng", "sts", "e-sts"],
          hot: ["eng", "e-sts", "sts"],
        },
        code: [
          code(
            "Requesting a temporary session from AWS STS",
            `aws sts assume-role \\
  --role-arn ${PROD_ROLE} \\
  --role-session-name darshan \\
  --duration-seconds 3600`,
            [2, 3, 4]
          ),
        ],
      },
      {
        action: "2. STS mints the trio",
        caption: "STS verifies the trust policy and returns a temporary credential set: an AccessKeyId starting with ASIA, a SecretAccessKey, an opaque SessionToken, and an Expiration timestamp.",
        pic: {
          show: ["zdev", "zprod", "eng", "sts", "pass", "clock", "e-sts", "sts-pass", "clock-pass"],
          fresh: ["pass", "clock", "sts-pass", "clock-pass"],
          hot: ["sts-pass", "pass", "clock"],
          badge: { pass: "60m left" },
        },
        state: {
          title: "What STS returns in Credentials",
          rows: [
            { key: "AccessKeyId", value: "ASIAVEXAMPLE7890123 (identifies temporary key)", mark: "new" },
            { key: "SecretAccessKey", value: "wJalrXUtnFEMI/K7MDENG/bPxRfiCY… (signs request locally)", mark: "new" },
            { key: "SessionToken", value: "IQoJb3JpZ2luX2Vj… (opaque proof sent in header)", mark: "new" },
            { key: "Expiration", value: "2026-10-17T10:00:00Z (60 minutes remaining)", mark: "new" },
          ],
        },
      },
      {
        action: "3. Use while valid (15m left)",
        caption: "Before the Expiration timestamp, the CLI signs s3:GetObject with the ASIA key and includes the SessionToken. S3 authenticates the session as ProdReadOnly/darshan and returns releases/app.zip.",
        pic: {
          show: ["zdev", "zprod", "eng", "sts", "pass", "clock", "s3", "e-sts", "sts-pass", "clock-pass", "pass-s3"],
          hot: ["pass", "pass-s3", "s3"],
          badge: { pass: "15m left", s3: "200 OK" },
        },
        state: {
          title: "Active role session",
          rows: [
            { key: "Caller identity", value: PROD_SESS, mark: "read" },
            { key: "Remaining lifetime", value: "15 minutes left before Expiration" },
            { key: "Required header", value: "X-Amz-Security-Token must accompany every ASIA… call" },
          ],
        },
      },
      {
        action: "4. After expiration (0m left)",
        caption: "At 60 minutes, the credential set expires. Any request signed with it fails authentication immediately with ExpiredToken. The ProdReadOnly role itself still exists; the client simply calls AssumeRole again for a fresh set.",
        pic: {
          show: ["zdev", "zprod", "eng", "sts", "pass", "clock", "s3", "e-sts", "sts-pass", "clock-pass", "pass-s3"],
          denied: ["pass", "clock", "pass-s3", "s3"],
          badge: { pass: "0m · EXPIRED", s3: "ExpiredToken" },
        },
        notice: {
          tone: "stop",
          label: "EXPIRED CREDENTIALS FAIL AUTHENTICATION",
          text: "An expired ASIA credential set cannot pass authentication, even if the role's permissions policy still allows s3:GetObject. Expiration ends that specific session pass without altering or deleting the IAM role.",
        },
      },
    ],
    inspector: {
      heading: "Why temporary credentials matter",
      body: "Long-term IAM user keys (AKIA…) stay valid until someone manually deactivates them. STS credentials (ASIA…) carry a built-in expiration time—from 15 minutes up to the role's configured maximum (up to 12 hours, or 1 hour when chaining one role from another role session). If you omit X-Amz-Security-Token when using an ASIA key, AWS rejects the signature.",
      facts: [
        ["AssumeRole duration", "15 minutes to 12 hours (depending on role max setting)"],
        ["Role chaining limit", "Capped at 1 hour when assuming a role from another role session"],
        ["Session token format", "Opaque AWS structure — never try to parse it like a JWT"],
        ["Revoking an active session", "Attach an inline Deny with aws:TokenIssueTime < now"],
      ],
      evidence: ["ASSUME A ROLE AND SEE THE CREDENTIAL TRIO", `aws sts assume-role --role-arn ${PROD_ROLE} --role-session-name darshan`],
      note: "Policy changes and credential lifetime are separate: if you add an explicit Deny to ProdReadOnly's policy, existing unexpired sessions are blocked on their next API call.",
    },
    takeaway: "STS issues an AccessKeyId (ASIA…), SecretAccessKey, SessionToken, and Expiration; when time runs out, the credential set stops working while the role remains intact.",
    sources: [3, 14],
  },

  /* VIEW 5: LAPTOP PROFILES & SIGV4 */
  {
    id: "profiles",
    aliases: [],
    group: "Credentials & signing",
    label: "Laptop & SigV4",
    title: "Your profile stays on your laptop; SigV4 signs the request",
    lede: "Where does --profile prod actually live? On your machine in ~/.aws/config. Follow what stays on your laptop versus what actually crosses the network to Amazon S3.",
    mode: "steps",
    hero: false,
    diagram: LAPTOP_SIGV4,
    frames: [
      {
        action: "1. Read ~/.aws/config locally",
        caption: "When you run aws s3api get-object ... --profile prod, the AWS CLI looks up [profile prod] in ~/.aws/config on your laptop. AWS has no concept of CLI profile names—the string 'prod' never crosses the network.",
        pic: {
          show: ["zlap", "zaws", "cfg", "cli", "s3", "c-cli", "ghost"],
          hot: ["cfg", "c-cli", "cli"],
        },
        code: [
          code(
            "~/.aws/config on your laptop (never sent to AWS)",
            `[profile dev]
region = ap-south-1

[profile prod]
role_arn = ${PROD_ROLE}
source_profile = dev
role_session_name = darshan
region = ap-south-1`,
            [4, 5, 6, 7]
          ),
        ],
      },
      {
        action: "2. Fetch & cache STS session",
        caption: "Because [profile prod] specifies role_arn and source_profile = dev, the CLI uses your dev credentials to call sts:AssumeRole behind the scenes and caches the returned ASIA… credential set in ~/.aws/cli/cache.",
        pic: {
          show: ["zlap", "zaws", "cfg", "cli", "sec", "sts", "s3", "c-cli", "cli-sts"],
          fresh: ["sts", "sec"],
          hot: ["cli", "cli-sts", "sts"],
          badge: { sts: "caches ASIA…" },
        },
        state: {
          title: "What the CLI caches on disk (~/.aws/cli/cache)",
          rows: [
            { key: "Profile name ('prod')", value: "Stays local on your laptop", mark: "read" },
            { key: "Assumed role session", value: PROD_SESS, mark: "new" },
            { key: "SecretAccessKey", value: "Kept in memory/cache for local HMAC signing only", mark: "new" },
          ],
        },
      },
      {
        action: "3. Sign with SigV4 & send",
        caption: "Before sending the HTTPS call to S3, the CLI's SigV4 signer builds a canonical hash of the HTTP method, host, X-Amz-Date, X-Amz-Security-Token, and body, then signs it with the SecretAccessKey using HMAC-SHA256. Only the signature, public AccessKeyId, and SessionToken travel over the wire.",
        pic: {
          show: ["zlap", "zaws", "cfg", "cli", "sig", "sec", "sts", "s3", "c-cli", "cli-sig", "sec-sig", "sig-s3"],
          hot: ["cli-sig", "sec-sig", "sig", "sig-s3", "s3"],
          badge: { s3: "SigV4 verified" },
        },
        code: [
          code(
            "What actually crosses the wire to S3 (HTTPS headers)",
            `GET /releases/app.zip HTTP/1.1
Host: prod-artifacts.s3.ap-south-1.amazonaws.com
X-Amz-Date: 20261017T091500Z
X-Amz-Security-Token: IQoJb3JpZ2luX2Vj…
Authorization: AWS4-HMAC-SHA256
  Credential=ASIAVEXAMPLE7890123/20261017/ap-south-1/s3/aws4_request,
  SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-security-token,
  Signature=c3ab879f42e19b048d68…`,
            [3, 4, 5, 6, 8]
          ),
        ],
      },
    ],
    inspector: {
      heading: "Profiles are local; SigV4 proves possession without sending the secret",
      body: "People often ask how to 'grant permissions to an AWS profile.' You cannot: a profile is only a named stanza in ~/.aws/config on your workstation that tells the CLI or SDK how to obtain credentials. Once the CLI has credentials, Signature Version 4 (SigV4) derives a date-and-service-scoped signing key from your SecretAccessKey and signs the canonical HTTP request.",
      facts: [
        ["~/.aws/config", "Local client file mapping profile names to role ARNs or SSO settings"],
        ["SecretAccessKey on wire?", "Never — only the HMAC-SHA256 Signature hex string is sent"],
        ["Replay protection", "X-Amz-Date timestamp is signed; AWS rejects skewed clocks (> 5 min)"],
        ["Presigned URL", "Puts the same SigV4 parameters into query strings for temporary sharing"],
      ],
      evidence: ["SEE HOW THE CLI RESOLVES A PROFILE", "aws configure list --profile prod"],
      note: "If AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are exported in your shell environment, they override ~/.aws/config profiles unless you unset them.",
    },
    takeaway: "AWS never sees your --profile name or your SecretAccessKey; it only sees the public AccessKeyId, SessionToken, and SigV4 HMAC signature on the HTTP request.",
    sources: [10, 11, 14],
  },

  /* VIEW 6: CROSS-ACCOUNT & CONFUSED DEPUTY */
  {
    id: "cross-account",
    aliases: ["cross-account-which-two-sides-must-agree", "confused-deputy"],
    group: "Crossing accounts",
    label: "Cross-account & deputy",
    title: "Crossing the account wall—and stopping the confused deputy",
    lede: "Across accounts, both sides must agree. Compare the two ways across the wall (assuming a role vs a direct bucket policy), then see what happens when your account trusts a shared deputy—a third-party vendor or an AWS service—that an attacker can trick.",
    mode: "choices",
    hero: true,
    diagram: CROSS_DEPUTY,
    frames: [
      {
        action: "1. Role bridge (AssumeRole)",
        caption: `Account ${DEV_ACCT}'s identity policy allows Engineering to call sts:AssumeRole on ${PROD_ROLE}, and ProdReadOnly's trust policy in Account ${PROD_ACCT} trusts Engineering. Darshan assumes the Prod role and reads prod-artifacts as a Prod session.`,
        pic: {
          show: ["zdev", "zprod", "eng", "sts", "role", "bkt", "e-sts", "sts-role", "role-bkt"],
          hot: ["eng", "e-sts", "sts", "sts-role", "role", "role-bkt", "bkt"],
          badge: { sts: "both agree", bkt: "200 OK" },
        },
        gates: gatePanel(
          "Cross-account role assumption handshake",
          `${ENG_ROLE} → sts:AssumeRole ${PROD_ROLE}`,
          true,
          "Both accounts agree: STS issues a ProdReadOnly session, which then reads prod-artifacts inside Account 222222222222.",
          [
            { check: `Account ${DEV_ACCT} outbound identity policy`, result: "pass", why: `Allows sts:AssumeRole on ${PROD_ROLE}.` },
            { check: `Account ${PROD_ACCT} ProdReadOnly trust policy`, result: "pass", why: `Trusts Principal ${ENG_ROLE}.` },
            { check: `Account ${PROD_ACCT} ProdReadOnly permissions policy`, result: "pass", why: `Allows s3:GetObject on ${PROD_OBJ}.` },
          ]
        ),
      },
      {
        action: "2. Direct bucket policy (no STS)",
        caption: `You do not always need AssumeRole to cross an account wall. If Account ${DEV_ACCT}'s identity policy allows s3:GetObject AND Account ${PROD_ACCT}'s S3 bucket policy explicitly allows Principal ${ENG_ROLE}, Darshan reads the bucket directly without calling STS.`,
        pic: {
          show: ["zdev", "zprod", "eng", "bkt", "bpol", "direct-bkt", "bpol-bkt"],
          hot: ["eng", "direct-bkt", "bpol", "bpol-bkt", "bkt"],
          badge: { bkt: "direct 200 OK" },
        },
        code: [
          code(
            `Bucket policy on prod-artifacts in Account ${PROD_ACCT}`,
            `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "${ENG_ROLE}" },
    "Action": "s3:GetObject",
    "Resource": "${PROD_OBJ}"
  }]
}`,
            [5, 6, 7]
          ),
        ],
      },
      {
        action: "3. Missing one side",
        caption: `If ProdReadOnly trusts Account ${DEV_ACCT}, but Account ${DEV_ACCT}'s administrator has not allowed Darshan to call sts:AssumeRole (or vice versa), the cross-account handshake fails at STS.`,
        pic: {
          show: ["zdev", "zprod", "eng", "sts", "role", "bkt", "e-sts", "sts-role"],
          denied: ["e-sts", "sts"],
          badge: { sts: "403 Denied" },
        },
        gates: gatePanel(
          "One-sided trust is not enough",
          `${ENG_ROLE} → sts:AssumeRole ${PROD_ROLE}`,
          false,
          "Denied: both the caller's identity policy in 111111111111 and the target role's trust policy in 222222222222 must allow AssumeRole.",
          [
            { check: `Account ${DEV_ACCT} outbound identity policy`, result: "fail", why: "Omits sts:AssumeRole on the Production role ARN." },
            { check: `Account ${PROD_ACCT} ProdReadOnly trust policy`, result: "pass", why: `Trusts ${ENG_ROLE}, but cannot override Account ${DEV_ACCT}'s missing allow.` },
          ]
        ),
      },
      {
        action: "4. Confused deputy (attack)",
        caption: `Now suppose Prod (${PROD_ACCT}) hires a SaaS monitoring service, ScoutCorp (${DEPUTY_ACCT}), and trusts ScoutCorp's AWS account on ProdReadOnly. An Attacker (${ATK_ACCT}) is also a ScoutCorp customer and pastes Prod's role ARN into their own ScoutCorp settings. ScoutCorp—the 'confused deputy'—assumes Prod's role using its own trusted identity and reads Prod's bucket for the attacker!`,
        pic: {
          show: ["zext", "zprod", "atk", "deputy", "sts", "role", "bkt", "atk-dep", "dep-sts", "sts-role", "role-bkt"],
          hot: ["atk", "atk-dep", "deputy", "dep-sts", "sts", "sts-role", "role", "role-bkt", "bkt"],
          badge: { deputy: "confused deputy!", bkt: "leaked to 999…" },
        },
        notice: {
          tone: "stop",
          label: "THE CONFUSED DEPUTY PROBLEM",
          text: `Attacker ${ATK_ACCT} has zero access to Prod ${PROD_ACCT}. Instead, the attacker tricks a trusted deputy (ScoutCorp ${DEPUTY_ACCT}) that DOES have access into performing the action on the attacker's behalf.`,
        },
        code: [
          code(
            "VULNERABLE trust policy on ProdReadOnly (checks only WHO the deputy is)",
            `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::${DEPUTY_ACCT}:root" },
    "Action": "sts:AssumeRole"
  }]
}`,
            [5, 6]
          ),
        ],
      },
      {
        action: "5. Guard 3rd-party (sts:ExternalId)",
        caption: `To stop a third-party confused deputy, Prod generates a unique tenant ID ('prod-tenant-8f92a') with ScoutCorp and requires sts:ExternalId in ProdReadOnly's trust policy. When the attacker tells ScoutCorp to assume Prod's role, ScoutCorp sends the attacker's ExternalId ('atk-tenant-001'), and STS blocks the call.`,
        pic: {
          show: ["zext", "zprod", "atk", "deputy", "sts", "role", "bkt", "atk-dep", "dep-sts", "sts-role"],
          hot: ["atk", "atk-dep", "deputy"],
          denied: ["dep-sts", "sts"],
          say: { "dep-sts": "ExternalId=atk-001" },
          badge: { sts: "ExternalId mismatch" },
        },
        gates: gatePanel(
          "sts:ExternalId binds the deputy call to the right customer tenant",
          `ScoutCorp (${DEPUTY_ACCT}) → sts:AssumeRole ${PROD_ROLE} (ExternalId="atk-tenant-001")`,
          false,
          "Denied at STS: ScoutCorp is the trusted principal, but the ExternalId condition does not match Prod's tenant ID.",
          [
            { check: `Principal matches ScoutCorp (${DEPUTY_ACCT})`, result: "pass", why: "ScoutCorp is the caller signing the AssumeRole request." },
            { check: `Condition sts:ExternalId == "prod-tenant-8f92a"`, result: "fail", why: "ScoutCorp passed the attacker's tenant ID ('atk-tenant-001') instead." },
          ]
        ),
        code: [
          code(
            "GUARDED trust policy for a 3rd-party vendor (sts:ExternalId)",
            `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::${DEPUTY_ACCT}:root" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "sts:ExternalId": "prod-tenant-8f92a" }
    }
  }]
}`,
            [7, 8, 9]
          ),
        ],
      },
      {
        action: "6. Guard AWS service (aws:SourceArn)",
        caption: `AWS services (like sns.amazonaws.com, cloudfront.amazonaws.com, or scheduler.amazonaws.com) can also be confused deputies if a role or bucket policy trusts the service principal without scoping which resource triggered it. Require aws:SourceAccount and aws:SourceArn so only YOUR account's resources can drive the service.`,
        pic: {
          show: ["zext", "zprod", "atk", "deputy", "bkt", "bpol", "atk-dep", "dep-bkt", "bpol-bkt"],
          hot: ["atk", "atk-dep", "deputy"],
          denied: ["dep-bkt", "bkt"],
          say: { "dep-bkt": "SourceAccount=999…" },
          badge: { bkt: "SourceArn blocked" },
        },
        code: [
          code(
            "GUARDED policy when trusting an AWS service principal",
            `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "sns.amazonaws.com" },
    "Action": "s3:PutObject",
    "Resource": "arn:aws:s3:::prod-artifacts/*",
    "Condition": {
      "StringEquals": { "aws:SourceAccount": "${PROD_ACCT}" },
      "ArnLike": { "aws:SourceArn": "arn:aws:sns:ap-south-1:${PROD_ACCT}:prod-alerts" }
    }
  }]
}`,
            [5, 8, 9, 10]
          ),
        ],
      },
    ],
    inspector: {
      heading: "Two cross-account patterns and two confused-deputy guards",
      body: "You can cross an account boundary either by assuming a role in the target account (switching the caller into a target-account session) or by making a direct call when the target resource has a resource-based policy that allows your caller. Whenever the trusted principal in your policy is a shared deputy—a multi-tenant SaaS vendor or an AWS service principal—an attacker can try to point that deputy at your ARN. Scope third-party role assumptions with sts:ExternalId, and scope AWS service principals with aws:SourceAccount and aws:SourceArn.",
      facts: [
        ["Cross-account role vs resource", "AssumeRole switches identity into Target Account; resource policy keeps Caller Account identity"],
        ["What is a confused deputy?", "A privileged service tricked by a less-privileged party into misusing its authority"],
        ["3rd-party deputy guard", "Condition StringEquals on sts:ExternalId in the role trust policy"],
        ["AWS service deputy guard", "Condition StringEquals on aws:SourceAccount + ArnLike/ArnEquals on aws:SourceArn"],
      ],
      evidence: ["SIMULATE CROSS-ACCOUNT ASSUMEROLE WITH EXTERNALID", `aws sts assume-role --role-arn ${PROD_ROLE} --role-session-name test --external-id prod-tenant-8f92a`],
      note: "sts:ExternalId is not a secret password for authentication—SigV4 already authenticates the vendor's AWS account. ExternalId ensures the vendor only assumes your role when acting for your tenant record.",
    },
    takeaway: "Cross-account access requires agreement from both accounts; when trusting a third-party vendor or AWS service, require sts:ExternalId or aws:SourceArn/aws:SourceAccount so an attacker cannot use them as a confused deputy.",
    sources: [0, 3, 13],
  },

  /* VIEW 7: IDENTITY CENTER (SSO) */
  {
    id: "identity-center",
    aliases: ["federation"],
    group: "Crossing accounts",
    label: "Identity Center (SSO)",
    title: "Workforce sign-in across accounts with IAM Identity Center",
    lede: "Creating an IAM user for Darshan in 50 separate AWS accounts does not scale. Instead, IAM Identity Center connects your external identity provider (Okta, Entra ID, Google Workspace) to IAM roles provisioned inside each account.",
    mode: "steps",
    hero: false,
    diagram: SSO_CENTER,
    frames: [
      {
        action: "1. Authenticate with your IdP",
        caption: "Darshan signs in once through his company's identity provider (such as Okta or Microsoft Entra ID). The identity provider verifies his password and MFA and sends a signed SAML 2.0 or OIDC assertion to AWS IAM Identity Center.",
        pic: {
          show: ["zidp", "zorg", "idp", "sso", "idp-sso"],
          hot: ["idp", "idp-sso", "sso"],
          badge: { idp: "1 login + MFA" },
        },
        state: {
          title: "Authentication vs Authorization",
          rows: [
            { key: "External IdP (Okta / Entra)", value: "Verifies who Darshan is (sign-in + MFA)", mark: "new" },
            { key: "IAM Identity Center", value: "Maps workforce users/groups to accounts and Permission Sets", mark: "new" },
          ],
        },
      },
      {
        action: "2. Provision IAM roles from Permission Sets",
        caption: "A Permission Set (like ReadOnlyAccess or AdministratorAccess) is only a template. When you assign Darshan's group to Dev and Prod with a Permission Set, Identity Center creates a real IAM role (AWSReservedSSO_…) inside each target account.",
        pic: {
          show: ["zidp", "zorg", "idp", "sso", "devrole", "prodrole", "idp-sso", "sso-dev", "sso-prod"],
          fresh: ["devrole", "prodrole", "sso-dev", "sso-prod"],
          hot: ["sso", "sso-dev", "sso-prod", "devrole", "prodrole"],
          badge: { prodrole: "real IAM role" },
        },
        code: [
          code(
            "Role created inside Account 222222222222 by Identity Center",
            `RoleName: AWSReservedSSO_ReadOnlyAccess_8f29c4e1a0b2
Arn:      arn:aws:iam::${PROD_ACCT}:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_ReadOnlyAccess_8f29c4e1a0b2
Trusts:   arn:aws:iam::${PROD_ACCT}:saml-provider/AWSSSO_…_DO_NOT_DELETE`,
            [1, 2, 3]
          ),
        ],
      },
      {
        action: "3. Assume the account's SSO role",
        caption: "When Darshan selects Prod (222222222222) in the portal or runs aws sso login --profile prod, AWS STS issues temporary ASIA… credentials for that account's AWSReservedSSO_ReadOnlyAccess role. From there on, S3 evaluates the request like any other IAM role session.",
        pic: {
          show: ["zidp", "zorg", "idp", "sso", "devrole", "prodrole", "prodbkt", "idp-sso", "sso-dev", "sso-prod", "prod-bkt"],
          hot: ["prodrole", "prod-bkt", "prodbkt"],
          badge: { prodbkt: "200 OK" },
        },
        state: {
          title: "Resulting runtime caller in Prod",
          rows: [
            { key: "Caller ARN", value: `arn:aws:sts::${PROD_ACCT}:assumed-role/AWSReservedSSO_ReadOnlyAccess_8f29c4e1/darshan`, mark: "new" },
            { key: "CLI login command", value: "aws sso login --profile prod" },
            { key: "Does SSO replace IAM?", value: "No — it provisions and assumes standard IAM roles in each account" },
          ],
        },
      },
    ],
    inspector: {
      heading: "Identity Center provisions IAM roles; it does not replace IAM",
      body: "A common misconception is that IAM Identity Center (formerly AWS SSO) is a separate authorization engine that bypasses IAM. In reality, Identity Center is an orchestration layer: it authenticates workforce users against your identity provider and materializes Permission Set templates into ordinary IAM roles (prefixed with AWSReservedSSO_) inside each assigned member account.",
      facts: [
        ["Permission Set", "A role template stored in Identity Center, not a live principal"],
        ["Provisioned role", "AWSReservedSSO_<Name>_<Hash> created inside each target account"],
        ["Direct workload OIDC", "GitHub Actions or Kubernetes can also federate directly via AssumeRoleWithWebIdentity"],
        ["Session duration", "Configured on the Permission Set (1 to 12 hours)"],
      ],
      evidence: [
        "LIST ROLES PROVISIONED BY IDENTITY CENTER",
        "aws iam list-roles --query 'Roles[?starts_with(RoleName, `AWSReservedSSO_`)].RoleName'",
      ],
      note: "Do not manually edit AWSReservedSSO_ roles in the IAM console; Identity Center overwrites them the next time you reprovision the Permission Set.",
    },
    takeaway: "Identity Center does not replace IAM: your IdP proves who you are, and Identity Center provisions real IAM roles into each member account from Permission Set templates.",
    sources: [6, 9, 10],
  },

  /* VIEW 8: HOW AWS DECIDES (THE POLICY EVALUATION LOGIC FLOWCHART) */
  {
    id: "policy-evaluation",
    aliases: [
      "organizations",
      "boundaries",
      "guardrails-how-is-power-capped",
      "evaluation-why-was-it-allowed-or-denied",
      "role-and-session-principals-are-different",
      "principal-grant-title",
      "evaluation-flowchart",
      "decision-flowchart",
    ],
    group: "Policies & diagnosis",
    label: "Evaluation flowchart",
    title: "The official AWS policy evaluation flowchart: from explicit Deny to session principal",
    lede: "When AWS evaluates an API request, it executes a deterministic sequence across six policy layers. Trace requests through the official AWS evaluation flowchart to see how explicit denies, SCP guardrails, resource policies, boundaries, and session credentials combine.",
    mode: "custom",
    hero: true,
    frames: [],
    inspector: {
      heading: "The official AWS evaluation sequence",
      body: "Every request starts implicitly denied. AWS first checks ALL applicable policies for an explicit Deny; if any statement denies, evaluation terminates immediately. Next, AWS verifies that account-level SCPs permit the action. Then, AWS checks resource-based and identity-based policies: in a single account, an Allow in either grants access. If permissions boundaries are set, they cap what identity policies can grant. Finally, if the caller is a session principal, session policies further filter permissions.",
      facts: [
        ["1. Explicit Deny wins", "Overrides every Allow across all policy layers"],
        ["2. SCPs & RCPs (Ceilings)", "Filter member accounts; never grant permissions on their own"],
        ["3. Same-account Resource policy", "An Allow on S3/KMS grants access directly without identity policy"],
        ["4. Boundary ceiling", "Effective permission is intersection of identity policy and boundary"],
        ["5. Session principal", "Role sessions pass unless an explicit session policy restricts them"],
      ],
      evidence: [
        "AWS DOCUMENTATION BENCHMARK",
        "docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html",
      ],
      note: "SCPs do not restrict the AWS Organizations management account root/principals or service-linked roles. In cross-account requests, both the trusting and trusted accounts must grant an Allow.",
    },
    takeaway: "AWS policy evaluation is deterministic: explicit Deny stops it immediately; otherwise, the action must pass every applicable ceiling (SCP, boundary, session policy) and receive at least one explicit grant.",
    sources: [1, 2, 4, 5, 18],
  },


  /* VIEW 9: CLOUDTRAIL & DIAGNOSING ACCESSDENIED */
  {
    id: "real-world-flows",
    aliases: ["least-privilege-how-do-you-refine-access", "diagnose-an-accessdenied"],
    group: "Policies & diagnosis",
    label: "CloudTrail & diagnosis",
    title: "Diagnosing AccessDenied: follow the trail from caller to policy",
    lede: "When a command fails with AccessDenied, resist the urge to attach AdministratorAccess. Use the error message, get-caller-identity, and CloudTrail to pinpoint whether the failure happened at STS role assumption, caller selection, or S3 policy evaluation.",
    mode: "choices",
    hero: false,
    diagram: DIAG_FLOW,
    frames: [
      {
        action: "Case 1: Denied at S3",
        caption: "An error occurred (AccessDenied) when calling the GetObject operation: User: arn:aws:sts::222222222222:assumed-role/ProdReadOnly/darshan is not authorized to perform: s3:GetObject on resource: \"arn:aws:s3:::prod-artifacts/releases/app.zip\" with an explicit deny in a resource-based policy",
        pic: {
          show: ["cli", "sts", "sess", "s3", "ct", "c-sts", "sts-sess", "sess-s3", "s3-ct"],
          hot: ["cli", "c-sts", "sts", "sts-sess", "sess", "s3-ct", "ct"],
          denied: ["sess-s3", "s3"],
          badge: { sts: "Assumed OK", s3: "Explicit Deny" },
        },
        checks: [
          [
            "aws sts get-caller-identity --profile prod",
            `{\n  "UserId": "AROA2222EXAMPLE:darshan",\n  "Account": "${PROD_ACCT}",\n  "Arn": "${PROD_SESS}"\n}`,
            "Step 1: Confirm who signed the call and which stage failed. The ARN is already assumed-role/ProdReadOnly/darshan in Account 222222222222, which proves STS AssumeRole succeeded and the failure happened at S3.",
          ],
          [
            "aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=GetObject --max-results 1",
            `{\n  "eventSource": "s3.amazonaws.com",\n  "eventName": "GetObject",\n  "userIdentity": { "type": "AssumedRole", "arn": "${PROD_SESS}" },\n  "requestParameters": { "bucketName": "prod-artifacts", "key": "releases/app.zip" },\n  "errorCode": "AccessDenied",\n  "errorMessage": "Access Denied"\n}`,
            "Step 2: Read the CloudTrail event and the CLI error wording. AWS states 'with an explicit deny in a resource-based policy' (versus 'because no identity-based policy allows'), pointing straight to the bucket policy.",
          ],
          [
            "aws s3api get-bucket-policy --bucket prod-artifacts --output text",
            `{"Statement":[{"Effect":"Deny","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::prod-artifacts/releases/*","Condition":{"StringNotEquals":{"aws:SourceVpce":"vpce-0123456789abcdef0"}}}]}`,
            "Step 3: Inspect the bucket policy. It has an explicit Deny on releases/* unless the request arrives through VPC endpoint vpce-0123456789abcdef0.",
          ],
        ],
        verdict: "The role's identity policy was fine; the bucket policy explicitly denied requests arriving from outside the production VPC endpoint.",
      },
      {
        action: "Case 2: Denied at STS",
        caption: "An error occurred (AccessDenied) when calling the AssumeRole operation: User: arn:aws:sts::111111111111:assumed-role/Engineering/darshan is not authorized to perform: sts:AssumeRole on resource: arn:aws:iam::222222222222:role/ProdReadOnly",
        pic: {
          show: ["cli", "sts", "sess", "s3", "ct", "c-sts", "sts-ct"],
          hot: ["cli", "sts-ct", "ct"],
          denied: ["c-sts", "sts"],
          badge: { sts: "AssumeRole 403" },
        },
        checks: [
          [
            "aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::111111111111:role/Engineering --action-names sts:AssumeRole --resource-arns arn:aws:iam::222222222222:role/ProdReadOnly",
            `EvalDecision: allowed\nMatchedStatements: [ { "SourcePolicyId": "EngineeringOutboundAssume" } ]`,
            "Step 1: The error happened on sts:AssumeRole, before any Prod session existed. First check the caller side in Account 111111111111: Engineering's identity policy allows sts:AssumeRole.",
          ],
          [
            "aws iam get-role --role-name ProdReadOnly --query 'Role.AssumeRolePolicyDocument' --profile prod-admin",
            `{\n  "Statement": [{\n    "Effect": "Allow",\n    "Principal": { "AWS": "${ENG_ROLE}" },\n    "Action": "sts:AssumeRole",\n    "Condition": { "StringEquals": { "sts:ExternalId": "prod-tenant-8f92a" } }\n  }]\n}`,
            "Step 2: Check the target role's trust policy in Account 222222222222. It requires sts:ExternalId = 'prod-tenant-8f92a' (or MFA / session tags), which was missing from the caller's ~/.aws/config profile.",
          ],
        ],
        verdict: "When AssumeRole fails across accounts, check both halves of the bridge: the caller's outbound sts:AssumeRole permission and the target role's trust policy conditions.",
      },
      {
        action: "Case 3: Wrong caller signed",
        caption: "An error occurred (AccessDenied) when calling the GetObject operation: Access Denied (even though ProdReadOnly has full S3 read access in Account 222222222222)",
        pic: {
          show: ["cli", "sts", "sess", "s3", "ct", "cli-s3", "s3-ct"],
          hot: ["cli", "s3-ct", "ct"],
          denied: ["cli-s3", "s3"],
          badge: { cli: "wrong key!", s3: "403 Denied" },
        },
        checks: [
          [
            "aws sts get-caller-identity",
            `{\n  "UserId": "AIDA1111EXAMPLE",\n  "Account": "${DEV_ACCT}",\n  "Arn": "arn:aws:iam::${DEV_ACCT}:user/darshan"\n}`,
            "Step 1: Never assume your script used the profile you intended. Running get-caller-identity reveals the call was signed by user/darshan in Account 111111111111, not ProdReadOnly in 222222222222.",
          ],
          [
            "aws configure list",
            `      Name                    Value             Type    Location\n      ----                    -----             ----    --------\n   profile                <not set>             None    None\naccess_key     ****************4567              env    AWS_ACCESS_KEY_ID\nsecret_key     ****************abcd              env    AWS_SECRET_ACCESS_KEY`,
            "Step 2: Inspect the credential provider chain. Stale AWS_ACCESS_KEY_ID environment variables in the shell overrode the config file.",
          ],
        ],
        verdict: "Unset the stale AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY environment variables and pass --profile prod (or AWS_PROFILE=prod) so the CLI assumes ProdReadOnly.",
      },
    ],
    inspector: {
      heading: "Read the error wording and CloudTrail together",
      body: "Modern AWS AccessDenied messages tell you which policy layer failed when both stay inside your organization: look for 'because no identity-based policy allows', 'with an explicit deny in a resource-based policy', 'with an explicit deny in a service control policy', or 'because no permissions boundary allows'. When S3 returns a generic AccessDenied (for example, on cross-account calls to prevent account enumeration), look up the event in CloudTrail to confirm userIdentity.arn and the exact action.",
      facts: [
        ["First command to run", "aws sts get-caller-identity (verifies actual signing principal)"],
        ["Credential precedence", "Env vars (AWS_ACCESS_KEY_ID) beat ~/.aws/config profiles"],
        ["S3 ListBucket vs GetObject", "ListObjectsV2 checks s3:ListBucket on bucket ARN; GetObject checks bucket/*"],
        ["Encrypted S3 objects (SSE-KMS)", "Caller also needs kms:Decrypt on the KMS key, not just s3:GetObject"],
      ],
      evidence: [
        "CHECK EFFECTIVE CREDENTIAL SOURCE",
        "aws configure list --profile prod",
      ],
      note: "If s3:GetObject still fails on an object after S3 policies pass, check whether the bucket uses SSE-KMS encryption—the caller needs permission to use the KMS key as well.",
    },
    takeaway: "Start every AccessDenied investigation with aws sts get-caller-identity and the error's operation name: separate STS AssumeRole failures from target-service policy failures before editing any JSON.",
    sources: [1, 2, 12, 18],
  },
];

export const iamLesson: Lesson = {
  id: "aws-iam",
  kicker: "AWS · IDENTITY & ACCESS MANAGEMENT",
  title: "AWS IAM: From One Account to Cross-Account Roles",
  summary: "Start with one person and one S3 bucket in a single AWS account, then add workloads, wearable IAM roles, STS temporary credentials, SigV4 signing, cross-account bridges, confused-deputy guards, and policy ceilings one step at a time.",
  reference: "AWS IAM · STS · ORGANIZATIONS",
  format: "Intermediate · Deep Dive",
  scenario: "Darshan (111111111111) → ProdReadOnly (222222222222) → s3:GetObject",
  scope: "AWS IAM, STS, Organizations SCPs, IAM Identity Center, and Confused Deputy protections (sts:ExternalId, aws:SourceArn, aws:SourceAccount). Account IDs and ARNs are teaching fixtures. Verified October 2026.",
  collection: { href: "/aws", label: "AWS" },
  legend: [
    { kind: "person", label: "caller / session" },
    { kind: "model", label: "role / policy" },
    { kind: "tool", label: "AWS STS / signer" },
    { kind: "store", label: "S3 bucket / config" },
    { kind: "hot", label: "allowed request" },
    { kind: "imagined", label: "no such path" },
    { kind: "denied", label: "denied / blocked" },
  ],
  groups: [
    "One account & wall",
    "Identities & roles",
    "Credentials & signing",
    "Crossing accounts",
    "Policies & diagnosis",
  ],
  views,
  sources: [
    { label: "IAM policy types", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html" },
    { label: "Policy evaluation logic", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html" },
    { label: "Role and session grant exceptions", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html" },
    { label: "STS AssumeRole API", url: "https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html" },
    { label: "Organizations SCPs", url: "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html" },
    { label: "Permissions boundaries", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html" },
    { label: "Identity Center permission sets", url: "https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html" },
    { label: "EC2 role credentials", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html" },
    { label: "EKS Pod Identity", url: "https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html" },
    { label: "Federation into AWS", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers.html" },
    { label: "CLI role profiles", url: "https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html" },
    { label: "SigV4 request signing", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html" },
    { label: "CloudTrail for IAM and STS", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html" },
    { label: "Cross-account evaluation & confused deputy", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html" },
    { label: "Temporary credentials", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html" },
    { label: "ECS task IAM roles", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html" },
    { label: "Lambda execution roles", url: "https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html" },
    { label: "EKS IAM roles for service accounts", url: "https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html" },
    { label: "IAM Access Analyzer", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html" },
  ],
  related: [
    { label: "AWS Identity and Credential Flows", href: "/aws-identity-credential-flows" },
  ],
};
