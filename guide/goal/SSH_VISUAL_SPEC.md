# Infra Illustrated — SSH Interactive Visual Specification

## 1. Working title

**SSH — Watch a Secure Connection Build Itself**

Alternative short page title: **SSH, Illustrated**

Primary promise: the learner should be able to watch an SSH session assemble from `ssh user@server` through TCP connection, algorithm negotiation, host verification, session-key establishment, user authentication, channel creation, shell/command execution, forwarding and disconnect.

The page should not behave like a static article with diagrams placed between paragraphs. It should behave like a small protocol simulator with explanatory text attached to the simulation.

---

## 2. Core learning goals

By the end, the learner should be able to explain:

1. The difference between the SSH client and the SSH server (`sshd`).
2. The difference between a server host key and a user authentication key.
3. Why SSH uses asymmetric cryptography / signatures and key agreement, but carries normal session traffic using symmetric keys.
4. Why the user's private key does not need to cross the network.
5. What `known_hosts` protects against.
6. What happens between typing `ssh user@server` and receiving a shell prompt.
7. Why user authentication happens after an encrypted transport is established.
8. How SSH channels allow shells, commands, file transfer and forwarding to coexist inside one connection.
9. How local, remote and dynamic forwarding differ.
10. How ProxyJump / bastions fit into the same model.
11. What `ssh-agent`, agent forwarding, ControlMaster and SSH certificates do.
12. Which SSH hardening controls matter, which are merely hygiene, and which change functionality.
13. How to reason about common SSH failures using protocol stage and `ssh -v/-vv/-vvv` output.

---

## 3. Teaching thesis

The central mental model is:

> **SSH first builds a trusted encrypted transport, then authenticates the user, then opens one or more logical channels inside that transport.**

The visual must continually reinforce three distinct questions:

- **Transport:** Can the two machines speak securely?
- **Server identity:** Is this the intended server?
- **User identity:** Is this client allowed to act as this user?

The page must explicitly reject the common oversimplification:

> “SSH encrypts the whole session with my public/private key pair.”

Instead show:

- Host keys / signatures: authenticate the server.
- User keys / signatures: authenticate the user.
- Key exchange: derives shared cryptographic material.
- Symmetric keys: carry normal encrypted traffic efficiently.

---

## 4. Page structure

The page should have six major sections, all reusing the same visual language.

### Section A — The two actors
A client and a server separated by a network rail.

### Section B — Crypto primer
Three small interactive visual cards:
- asymmetric / signatures
- key agreement
- symmetric session encryption

### Section C — Main SSH connection builder
The flagship step-by-step flow. Each click adds a new row below the previous row, preserving history.

### Section D — What rides inside SSH?
Shell, remote command, SFTP/SCP, forwarding, ProxyJump, agent forwarding and multiplexing.

### Section E — Hardening lab
Interactive `sshd_config` and network controls with immediate visual feedback.

### Section F — Failure simulator
Inject a failure, highlight the broken stage, and show the kind of `ssh -vvv` evidence expected.

---

## 5. Global visual language

### 5.1 Layout

Desktop composition:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ HERO / TITLE / CURRENT CONNECTION STATE                             │
├──────────────────────────────────────────────────────────────────────┤
│ CLIENT RAIL                NETWORK RAIL                SERVER RAIL   │
│                                                                  │
│ terminal / files           packet animation          sshd / files   │
└──────────────────────────────────────────────────────────────────────┘
```

The client and server cards stay visually anchored as the learner progresses.

The center “wire” is the stage. All protocol messages travel across it.

### 5.2 Semantic colors

Do not rely on color alone; pair with icons / labels.

- Neutral / not established: slate / gray.
- Cleartext / pre-encryption: amber.
- Encrypted transport: cyan / electric blue.
- Verified / success: green.
- Warning / trust decision: yellow.
- Failure / blocked: red.
- Private secret: violet lock treatment.
- Public data: pale blue outlined chip.

### 5.3 Visual grammar

Use consistent tokens:

- `PRIVATE` chip: never leaves local machine.
- `PUBLIC` chip: may cross the wire.
- `SIGN` action: private key creates proof.
- `VERIFY` action: public key validates proof.
- `DERIVE` action: local calculation.
- `ENCRYPTED` tunnel: thick glowing rail.
- `CHANNEL` ribbon: logical stream within transport.

### 5.4 Motion

Animation should teach directionality and stage change rather than decorate.

Preferred motion:
- packets travel left ↔ right along the network rail
- local-only secrets pulse but never move
- signatures visibly leave the signing side
- state badges morph when a trust/crypto milestone is reached
- new timeline nodes slide in below the prior nodes
- when `NEWKEYS` completes, the central rail visibly transforms from dashed amber to solid glowing cyan

Avoid infinite ambient motion except subtle encrypted-flow particles after the tunnel exists.

---

## 6. Persistent connection-state panel

Sticky compact panel visible throughout the main flow:

```text
CONNECTION STATE
TCP        disconnected | connecting | established
HOST       unknown | presented | verified | mismatch
CRYPTO     plaintext | negotiating | encrypted
USER       unauthenticated | authenticating | authenticated
CHANNEL    none | opening | shell | exec | sftp | forwarding
```

State changes should animate and correspond exactly to the selected protocol step.

---

## 7. Section A — Client vs server

### 7.1 Client card

Show:

```text
SSH CLIENT
$ ssh alice@server

~/.ssh/
├─ config
├─ known_hosts
├─ id_ed25519
├─ id_ed25519.pub
└─ sockets / agent
```

Expandable explanations:

- `ssh`: client binary and connection initiator.
- `~/.ssh/config`: connection preferences / aliases / identity selection / ProxyJump.
- `known_hosts`: trusted server host-key identities.
- private key: user credential, should remain local.
- public key: shareable identity material.
- `ssh-agent`: optional signing helper / credential cache.

### 7.2 Server card

Show:

```text
SSH SERVER
sshd :22

/etc/ssh/
├─ sshd_config
├─ ssh_host_*_key
└─ ssh_host_*_key.pub

/home/alice/.ssh/
└─ authorized_keys
```

Expandable explanations:

- `sshd`: long-running server daemon.
- host private key: proves server identity.
- `authorized_keys`: public keys allowed for a user.
- PAM / local users / directory services: alternate or supporting authentication paths.

### 7.3 Mandatory distinction callout

Render side by side:

```text
HOST KEY                         USER KEY
Who is the server?              Who is the client/user?
Server private key              Client private key
Client remembers public side    Server stores public side
known_hosts                     authorized_keys
```

This distinction must occur before the handshake.

---

## 8. Section B — Crypto primer

### 8.1 Asymmetric signatures

Interactive demo:

1. User clicks `SIGN`.
2. A message digest / session-bound data enters a local signing box.
3. Private key stays physically inside the client/server card.
4. A signature object exits.
5. Remote side clicks / animates `VERIFY` using public key.

Caption:

> The private key proves possession by producing a signature. It is not sent across the network.

### 8.2 Key agreement

Show two local ephemeral secrets:

```text
CLIENT SECRET A                         SERVER SECRET B
     │                                        │
 derive public A                       derive public B
     │                                        │
     └──────────── exchange public values ────┘

         both independently derive
            SHARED SECRET
```

Critical visual rule: the local secret boxes must never cross the wire.

### 8.3 Symmetric transport

Once the shared material exists:

```text
plaintext → encrypt → ciphertext → decrypt → plaintext
```

Show session keys as fast reusable transport keys.

Caption:

> SSH uses expensive trust/key-establishment mechanisms to create fast symmetric session protection.

---

## 9. Section C — Main SSH connection builder

### 9.1 Interaction model

Primary controls:

- `Start connection`
- `Previous`
- `Next step`
- `Auto play`
- `Reset`
- toggle: `Learner mode | Protocol mode`

Every `Next step` action:

1. updates persistent state badges;
2. animates the relevant packet / local cryptographic operation;
3. appends a new timeline row below the previous row;
4. keeps all prior rows visible;
5. updates a short explanation panel.

The timeline grows vertically and becomes the learner's “full connection trace”.

### 9.2 Timeline node anatomy

Each row:

```text
[STEP NUMBER] [TITLE] [STATE TAG]
client-side action     packet / local operation     server-side action
short explanation
optional protocol labels
```

Completed rows collapse slightly but stay readable.

### 9.3 Canonical flow

#### Step 01 — User invokes SSH

Command:

```bash
ssh alice@server.example.com
```

Client highlights:
- CLI arguments
- `~/.ssh/config`
- hostname resolution
- port selection
- username selection
- identity / agent selection
- ProxyJump if configured

State:

```text
TCP disconnected
HOST unknown
CRYPTO plaintext
USER unauthenticated
CHANNEL none
```

#### Step 02 — TCP connection

Animate:

```text
SYN →
← SYN/ACK
ACK →
```

Teach:

- SSH is normally carried over TCP.
- There is no SSH encryption before the transport connection exists.
- Connection refused and timeout belong here, before SSH authentication exists.

State: `TCP established`.

#### Step 03 — SSH version identification exchange

Animate readable text crossing the wire:

```text
SSH-2.0-OpenSSH_...
```

Teach:

- This identification exchange is visible before encrypted packet protection begins.
- This is protocol compatibility discovery, not authentication.

#### Step 04 — Algorithm negotiation / KEXINIT

Both sides expose capability lists:

- key exchange algorithms
- server host-key algorithms
- ciphers client→server
- ciphers server→client
- integrity / AEAD capability
- compression

Animate set intersection.

UI example:

```text
CLIENT       SERVER
A B C        B C D
  \          /
   chosen B
```

Protocol mode: `SSH_MSG_KEXINIT`.

#### Step 05 — Ephemeral key exchange

Visualize local ephemeral secret generation and exchange values.

Teach:

- Shared key material is derived, not transmitted as a finished secret.
- The exact algorithm can vary by implementation and policy.

State: `CRYPTO negotiating`.

#### Step 06 — Server presents host identity and proof

Server highlights host key and signing operation.

Animate:

```text
exchange/session data → SIGN with host private key → signature → client
```

Teach:

- The host private key remains on the server.
- The client receives enough information to verify the server proof.

#### Step 07 — Client checks `known_hosts`

Client expands `~/.ssh/known_hosts`.

Three possible branches:

1. known + matching → verified
2. first connection → trust-on-first-use decision
3. known + changed → prominent mismatch warning

State: `HOST verified` or failure branch.

Include MITM mini-animation when mismatch is selected.

#### Step 08 — Derive transport keys

Both sides feed:

- shared secret
- exchange hash / transcript context
- directional labels

into a local derivation box.

Output:

```text
client→server key
server→client key
IV / nonce material
integrity / AEAD state
```

Teach that directions can use distinct key material.

#### Step 09 — NEWKEYS / encryption starts

This is the major visual transition.

Before:
- center rail is dashed amber
- protocol text is readable

After:
- center rail becomes solid cyan / encrypted tunnel
- payloads crossing the wire become ciphertext chips

Protocol mode: `SSH_MSG_NEWKEYS`.

State: `CRYPTO encrypted`.

#### Step 10 — User authentication service begins

Big conceptual divider:

```text
SERVER IDENTITY ALREADY VERIFIED
NOW VERIFY THE USER
```

Teach that user authentication occurs inside the protected SSH transport.

#### Step 11 — Public-key authentication

Default branch for the visual.

Flow:

```text
CLIENT                                SERVER
public key offer  ------------------> authorized_keys lookup
              <--------------------- acceptable / continue
session-bound data
      ↓
SIGN with private key
      ↓
signature          ----------------> VERIFY with public key
                                      AUTH SUCCESS
```

Hard visual rule:

`PRIVATE KEY NEVER LEFT THIS MACHINE`

If agent toggle enabled:

```text
ssh → local ssh-agent → sign → signature back to ssh
```

State: `USER authenticated`.

Optional auth-method switcher:
- public key
- password
- keyboard-interactive / PAM
- certificate-backed key

#### Step 12 — SSH connection service / channels

The encrypted tunnel expands into a container with logical channels.

```text
SSH CONNECTION
┌────────────────────────────────────┐
│ channel 0  shell                   │
│ channel 1  exec                    │
│ channel 2  SFTP                    │
│ channel 3  forwarding              │
└────────────────────────────────────┘
```

Teach:

> One authenticated SSH transport can carry multiple logical streams.

#### Step 13 — Open session channel

Animate `channel open` then `pty-req` then `shell`.

State: `CHANNEL shell`.

Protocol mode labels:
- `SSH_MSG_CHANNEL_OPEN`
- channel request `pty-req`
- channel request `shell`

#### Step 14 — Interactive shell traffic

User types:

```bash
cat /etc/os-release
```

Client side shows plaintext typed locally.

Wire shows ciphertext blocks only.

Server side shows plaintext after decryption and command execution.

Response follows reverse path.

#### Step 15 — Rekey during long-lived session

After a configurable amount of simulated traffic:

```text
ACTIVE SESSION
   ↓
REKEY NEGOTIATION
   ↓
NEW TRANSPORT KEYS
   ↓
CHANNELS CONTINUE
```

Teach that channel/application state can survive a transport rekey.

#### Step 16 — Clean disconnect

Animate:

- shell exits
- channel close
- SSH disconnect
- TCP FIN sequence

Final state:

```text
TCP closed
HOST verified (historical)
CRYPTO ended
USER authenticated (historical)
CHANNEL none
```

---

## 10. Learner mode vs protocol mode

### Learner mode
Uses plain language:

- “Negotiate algorithms”
- “Verify the server”
- “Start encryption”
- “Authenticate the user”
- “Open a shell”

### Protocol mode
Adds exact protocol vocabulary where useful:

- identification string
- `KEXINIT`
- `NEWKEYS`
- userauth request / success
- channel open
- `pty-req`
- `shell`
- `exec`

Protocol mode must add information, not replace the simpler explanation.

---

## 11. Section D — What can ride inside SSH?

Use the same established encrypted transport visual.

### 11.1 Interactive shell

```bash
ssh alice@server
```

Render as a session channel with PTY + shell.

### 11.2 Remote command / exec

```bash
ssh alice@server 'uptime'
```

Visual:

```text
command → encrypted channel → exec on server → stdout/stderr return
```

### 11.3 SFTP / SCP

Show:

```bash
sftp alice@server
scp file.txt alice@server:/tmp/
```

Visual message:

> File transfer is another use of the authenticated SSH transport, not a separate security model.

Implementation note: describe modern `scp` as normally using SFTP semantics underneath in current OpenSSH, but avoid making the foundational diagram version-dependent.

### 11.4 Local forwarding (`-L`)

Command:

```bash
ssh -L 5432:db.internal:5432 bastion
```

Visual:

```text
local app → localhost:5432 → SSH tunnel → bastion → db.internal:5432
```

Caption:

> Make a remote destination reachable through a local listening port.

Animate packet origin, tunnel encapsulation and destination connection separately.

### 11.5 Remote forwarding (`-R`)

Command:

```bash
ssh -R 8080:localhost:3000 server
```

Visual:

```text
remote listener → SSH tunnel → client side → localhost:3000
```

Caption:

> Make something on the client side reachable from the remote side.

### 11.6 Dynamic forwarding (`-D`)

Command:

```bash
ssh -D 1080 bastion
```

Visual:

```text
browser/app → SOCKS localhost:1080 → SSH → varying destinations
```

Caption:

> Create a SOCKS proxy rather than one fixed forwarded destination.

### 11.7 ProxyJump / bastions

Command:

```bash
ssh -J bastion private-server
```

Visual:

```text
CLIENT → BASTION → PRIVATE SERVER
```

Teach:

- jump host is transport path, not necessarily the final shell destination;
- avoid visually implying that the bastion magically becomes the private server;
- distinguish nested SSH from proxying a connection through the jump host.

### 11.8 `ssh-agent`

Visual:

```text
ssh process → agent socket → local signing operation → signature
```

Private key stays with local agent / backing store.

### 11.9 Agent forwarding

Command:

```bash
ssh -A bastion
```

Show remote host gaining access to an agent socket proxy.

Warning treatment:

> The key is not copied to the server, but a compromised remote environment may be able to request signatures through the forwarded agent.

### 11.10 Connection multiplexing

Show:

```text
MASTER SSH TCP CONNECTION
  ├─ terminal invocation A
  ├─ terminal invocation B
  └─ scp/sftp invocation
```

Terms:
- `ControlMaster`
- `ControlPath`
- `ControlPersist`

### 11.11 SSH certificates / CA

Enterprise scale visual:

Before:

```text
hundreds of servers × thousands of user public keys
```

After:

```text
SSH CA signs user certificate
servers trust CA
```

Also include host certificates:

```text
Host CA signs server host keys → clients trust Host CA
```

### 11.12 Hardware-backed keys

Show local authenticator / FIDO security key performing the signing step.

---

## 12. Section E — Hardening lab

### 12.1 UI layout

Split panel:

```text
LEFT: editable config               RIGHT: architecture effect
/etc/ssh/sshd_config                ingress/auth/forwarding visual
```

Each toggle immediately modifies the visual.

### 12.2 Controls

At minimum:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers / AllowGroups
MaxAuthTries
AllowAgentForwarding
AllowTcpForwarding
X11Forwarding
PermitTunnel
GatewayPorts
```

Also show network controls:

- security group / firewall CIDRs
- VPN-only access
- bastion-only access
- private subnet
- fail2ban / rate-limiting as supplemental host controls

### 12.3 Port change nuance

Interactive control:

```text
Port 22 → 49222
```

Result label must be:

```text
reduces opportunistic scan noise
≠ strong authentication control
```

Never present “change port” as equivalent to disabling passwords or restricting network origin.

### 12.4 Hardening presets

Preset buttons:

- `Default-ish`
- `Internet-facing hardened`
- `Private admin host`
- `Bastion`
- `File-transfer only`

Presets should simply change visible controls; do not hide what changed.

### 12.5 Configuration safety

Before “apply” simulation:

- run `sshd -t` / syntax validation conceptually;
- recommend keeping a second admin session while testing changes;
- show risk of lockout when changing auth + network policy simultaneously.

---

## 13. Section F — Failure simulator

### 13.1 Interaction

Button: `BREAK SSH`

Inject one controlled failure.

Highlight the exact timeline stage where progress stops.

### 13.2 Scenarios

1. DNS resolution failure
2. TCP timeout / firewall drop
3. TCP connection refused / `sshd` not listening
4. no matching key-exchange algorithm
5. no matching host-key algorithm
6. host key changed / mismatch
7. no matching cipher / policy mismatch
8. wrong username
9. wrong private key
10. public key absent from authorization source
11. wrong permissions on `~/.ssh` or `authorized_keys`
12. account locked / shell disabled
13. root login denied
14. password auth disabled
15. forwarding disabled
16. ProxyJump unreachable
17. destination behind forward unreachable
18. agent unavailable / wrong socket

### 13.3 Debug panel

Buttons:

```bash
ssh -v
ssh -vv
ssh -vvv
```

Show a curated, synthetic log trace tied to the animation.

The learner should be able to map log evidence to the protocol stage.

---

## 14. Content architecture / page copy pattern

For each visual concept:

1. one-sentence mental model;
2. animated visual;
3. concise “what moved over the network?” explanation;
4. “what stayed local?” explanation where cryptography is involved;
5. exact command example where useful;
6. “common mistake” card;
7. optional protocol-depth expansion.

Avoid long paragraphs directly above animations.

---

## 15. Prototype interaction requirements

The first prototype should prove the following interactions:

1. fixed client/server cards;
2. `Start / Previous / Next / Reset` controls;
3. main connection state panel;
4. vertically accumulating timeline nodes;
5. animated packet moving between rails;
6. explicit local-only private-key treatment;
7. rail transition from plaintext to encrypted after NEWKEYS;
8. known-host verification state;
9. public-key user-authentication animation;
10. channel opening / shell state;
11. at least one tunnel mode selector (`-L`, `-R`, `-D`);
12. at least one hardening control that modifies the architecture visual;
13. learner / protocol mode toggle.

---

## 16. Suggested state model for implementation

```js
connection = {
  step: 0,
  tcp: 'disconnected',
  host: 'unknown',
  crypto: 'plaintext',
  user: 'unauthenticated',
  channel: 'none',
  protocolMode: false,
  tunnelMode: 'local',
  hardening: {
    permitRootLogin: false,
    passwordAuthentication: false,
    pubkeyAuthentication: true,
    allowTcpForwarding: true,
    allowAgentForwarding: false,
    networkScope: 'trusted'
  }
}
```

Each timeline step should be data-driven rather than hardcoded into animation functions.

Example step object:

```js
{
  id: 9,
  title: 'Encryption starts',
  protocol: 'SSH_MSG_NEWKEYS',
  state: {
    tcp: 'established',
    host: 'verified',
    crypto: 'encrypted',
    user: 'unauthenticated',
    channel: 'none'
  },
  packet: {
    from: 'client',
    to: 'server',
    label: 'NEWKEYS'
  },
  explanation: 'Both sides switch to the newly derived transport keys.'
}
```

---

## 17. Responsive behaviour

### Desktop
Three-column hero rail with full packet animation.

### Tablet
Client and server remain side by side, explanation panel moves below.

### Mobile
Use a vertical endpoint stack while preserving direction markers:

```text
CLIENT
  ↓
NETWORK EVENT
  ↓
SERVER
```

The timeline remains vertical and full fidelity.

Do not shrink labels until unreadable simply to preserve the desktop geometry.

---

## 18. Accessibility

- all state changes need text labels in addition to color;
- `prefers-reduced-motion` disables travel animation and replaces it with instant transitions;
- keyboard controls for next/previous/reset;
- packet animations should never be the only way to understand direction;
- syntax highlighting must maintain contrast;
- tooltips should also be available on focus;
- timeline should be semantically ordered for screen readers.

---

## 19. Visual polish guidance

Target aesthetic:

- dark terminal / protocol lab rather than generic cloud dashboard;
- subtle grid / network background;
- mono font for packets, config, terminal and protocol names;
- human-readable sans font for explanations;
- softly glowing endpoint rails after encryption starts;
- no cartoon padlocks floating everywhere;
- cryptographic objects should feel like actual protocol artifacts, not decorative icons.

Suggested visual hierarchy:

```text
H1 / concept title
terminal command
connection-state badges
large protocol rail
step timeline
explanatory copy
optional deep-dive cards
```

---

## 20. Acceptance criteria

A first-time learner should be able to answer the following after using the page without reading external material:

- What runs on the client and server?
- What is `sshd`?
- Why do `known_hosts` and `authorized_keys` solve different problems?
- Does my private key get sent to the server?
- When does SSH become encrypted?
- Why is the server authenticated before the user?
- What is the point of symmetric session keys?
- What is an SSH channel?
- How do `-L`, `-R` and `-D` differ?
- What does ProxyJump do?
- What does an SSH agent do?
- Why is agent forwarding sensitive?
- Why is changing port 22 not a primary security control?
- At what stage would a firewall block differ from a bad public key?

If the page makes those answers obvious visually, the design has succeeded.
