# SSH, Illustrated — Visual specification

**Status:** Integrated refactor; design and factual review 2026-09-16. **Version:** 2.0.
**Audience:** Working developers moving into DevOps, SRE and cloud infrastructure.
**Page promise:** Watch SSH build a trusted encrypted transport, authenticate a user, then open channels for a shell, command, or forwarding.
**Persistent scenario:** ssh alice@server.example from laptop-01 to sshd on port 22; client known_hosts and user key remain at the client, server host key and authorized_keys remain at the server.
**Scope:** SSH transport order, host verification, key agreement, user public-key proof, channels, forwarding, agents/certificates, hardening and stage-based diagnosis.
**Non-goals:** Cryptographic calculations, every algorithm, complete SCP/SFTP semantics, PAM internals, and provider-specific bastion products.
**Visual thesis:** A trusted encrypted transport is built first; user authentication and logical channels follow inside it.

## Semantic visual grammar

Use the confirmed dark console tokens from `src/styles/global.css`: cyan is live data movement, violet is lookup/namespace/secret context, green is resolved or allowed state, amber is waiting/pressure, and red is blocked state. Solid arrows carry runtime traffic or protocol messages; dashed connectors mark lookup/configuration. A packet pulse, newly enclosing process boundary, or SSH NEWKEYS tunnel transition highlights only the changed actor or path. Every color state also has a text label, border, or connector style.

## Concept groups and narrative

The native disclosure index groups views as **Build the transport**, **Authenticate and use**, **Channels and access**, **Operate and diagnose**. The default active view is **Server trust**. Selection opens only its group and updates a current/total counter.

| # | Index group / view | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Build the transport / Server trust | How does the client know that sshd is the server it intended to reach? | Anchored client and server boundaries flank an ordered TCP/identification/KEXINIT/host-proof/verification message rail; private keys remain visibly local | Step, play/pause, failure | A server host key answers “which server?”; it is separate from a user’s login key. |
| 2 | Build the transport / Key agreement | Why does SSH not encrypt the whole session with a user public/private key pair? | Two local ephemeral secrets flank a public-value exchange; local derivation and NEWKEYS transition lead into a thick encrypted tunnel | Step, play/pause, failure | SSH uses signatures and key agreement to establish trust, then symmetric keys to carry session traffic. |
| 3 | Authenticate and use / User authentication | Why does the private key stay on the client? | Client key/agent boundary sends public-key offer and signature across an already encrypted rail to authorized_keys and server verification | Manual inspection and alternate state | A private key creates a proof locally; the public key lets the server verify that proof. |
| 4 | Authenticate and use / Channels and failures | What changes when you run a command, use SFTP, or create a tunnel? | One protected tunnel contains parallel shell, exec, SFTP and forwarding ribbons, with a separate example destination strip | Manual inspection and alternate state | Authentication creates a session; channels decide what work travels inside that encrypted transport. |
| 5 | Channels and access / Three forwarding forms | What is different about -L, -R, and -D? | Four flat direction diagrams compare local listener, remote listener, dynamic SOCKS listener and bastion jump | Manual inspection and alternate state | For a tunnel, first identify which side owns the listener and which side opens the destination connection. |
| 6 | Channels and access / Agent and certificates | Where does ssh-agent sign, and what does forwarding it expose? | Local key → agent socket → remote proxy risk → CA certificate authority forms an authority-scope sequence | Manual inspection and alternate state | Keep private signing material local and treat access to an agent socket as sensitive authority. |
| 7 | Operate and diagnose / Server policy | Which setting blocks TCP entry, user login, or a forwarding channel? | Four gates follow actual order: network reachability, host trust, user authorization, channel policy; effective sshd setting examples sit below | Manual inspection and alternate state | Apply a control at the boundary it owns, then test the exact connection stage it changes. |
| 8 | Operate and diagnose / First failing stage | Why does “permission denied” require a different investigation from “connection timed out”? | Name/TCP → algorithm → host key → user auth → channel evidence ladder with curated debug interpretation below | Step, play/pause, failure | Find the first incomplete SSH stage and inspect its actors before changing keys or server policy. |

## Per-visual contracts

### Visual 1 — Verify the server during key exchange

#### Purpose

Resolve “How does the client know that sshd is the server it intended to reach?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

How does the client know that sshd is the server it intended to reach?

#### Persistent scenario state

ssh alice@server.example · TCP 22 · session pending. At this view the active checkpoint begins at **TCP** and can advance to **Verify**.

#### Concepts and actors

SSH client, sshd, known_hosts, server host private/public keys and signed exchange.

#### Composition

Build the transport / Server trust in the one persistent console. Anchored client and server boundaries flank an ordered TCP/identification/KEXINIT/host-proof/verification message rail; private keys remain visibly local. The active view’s actor labels and state cues stay in the canvas; During key exchange, the server signs the exchange with its host private key. The client checks the proof and the presented host key against its known_hosts policy before accepting the server identity. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: TCP.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Simulate host-key mismatch**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **TCP:** client connects to server.example:22
- 2. **Identify:** both sides exchange SSH protocol versions
- 3. **KEXINIT:** choose compatible algorithms
- 4. **Host proof:** server signs the key exchange
- 5. **Verify:** client checks signature and known_hosts policy
- Observable fixture: $ ssh-keygen -F server.example / # locate an existing known_hosts entry

#### Failure or edge state

The presented key differs from the trusted record. SSH warns because a changed host key can be legitimate, but it can also indicate a redirection or interception attempt.

#### Required copy

Canvas labels: TCP → Identify → KEXINIT → Host proof → Verify. Bottom takeaway: “A server host key answers “which server?”; it is separate from a user’s login key.”

#### Accuracy caveats

Host-key algorithms and verification policy depend on OpenSSH configuration. Host certificates and DNS-based mechanisms are additional supported models.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc4253), [primary source](https://man.openbsd.org/ssh)

#### Acceptance checks

- Host proof occurs during key exchange; mismatch blocks trust before user authentication.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 2 — Key agreement produces an encrypted transport

#### Purpose

Resolve “Why does SSH not encrypt the whole session with a user public/private key pair?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why does SSH not encrypt the whole session with a user public/private key pair?

#### Persistent scenario state

ssh alice@server.example · TCP 22 · session pending. At this view the active checkpoint begins at **Exchange** and can advance to **Encrypted**.

#### Concepts and actors

Client/server ephemeral values, derived key material, host proof, NEWKEYS and protected traffic.

#### Composition

Build the transport / Key agreement in the one persistent console. Two local ephemeral secrets flank a public-value exchange; local derivation and NEWKEYS transition lead into a thick encrypted tunnel. The active view’s actor labels and state cues stay in the canvas; Key exchange derives shared secret material. After NEWKEYS, both peers use symmetric session keys for normal traffic; asymmetric signatures prove identities without sending private keys. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Exchange.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Reject algorithm set**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Exchange:** public key-agreement values cross the network
- 2. **Derive:** each side computes shared secret material locally
- 3. **NEWKEYS:** activate encryption and integrity protection
- 4. **Encrypted:** transport carries later protocol messages
- Observable fixture: $ ssh -vv alice@server.example / … kex: algorithm: curve25519-sha256

#### Failure or edge state

No mutually acceptable key-exchange or host-key algorithm exists. The transport stops before user authentication.

#### Required copy

Canvas labels: Exchange → Derive → NEWKEYS → Encrypted. Bottom takeaway: “SSH uses signatures and key agreement to establish trust, then symmetric keys to carry session traffic.”

#### Accuracy caveats

The view intentionally omits cryptographic calculations and algorithm details. Negotiated algorithms must be supported by both peers and accepted by local policy.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc4253)

#### Acceptance checks

- Finished session keys are derived locally; ordinary session traffic uses negotiated symmetric protection.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 3 — The user proves access after encryption exists

#### Purpose

Resolve “Why does the private key stay on the client?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why does the private key stay on the client?

#### Persistent scenario state

ssh alice@server.example · TCP 22 · session pending. At this view the active checkpoint begins at **Offer** and can advance to **Accept**.

#### Concepts and actors

Client user key, optional agent, server authorized key, signed authentication request.

#### Composition

Authenticate and use / User authentication in the one persistent console. Client key/agent boundary sends public-key offer and signature across an already encrypted rail to authorized_keys and server verification. The active view’s actor labels and state cues stay in the canvas; For public-key authentication, the client offers a key and signs the authentication request locally, often through ssh-agent. The server checks the public key against its authorization source and verifies the signature. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Offer.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Reject user key** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Offer:** client offers public key identity
- 2. **Check:** server checks authorized_keys and policy
- 3. **Sign:** private key or agent signs locally
- 4. **Accept:** server verifies signature and authenticates alice
- Observable fixture: $ ssh-add -l / 256 SHA256:… alice@laptop (ED25519)

#### Failure or edge state

The encrypted transport remains valid, but user authentication fails because the key is absent, unauthorized, or does not satisfy server policy.

#### Required copy

Canvas labels: Offer → Check → Sign → Accept. Bottom takeaway: “A private key creates a proof locally; the public key lets the server verify that proof.”

#### Accuracy caveats

Public-key authentication is one method. Servers can also use passwords, certificates, keyboard-interactive methods, or policy modules.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc4252), [primary source](https://man.openbsd.org/sshd)

#### Acceptance checks

- Private user key stays local and authentication happens after encrypted transport exists.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 4 — One SSH transport can carry several logical channels

#### Purpose

Resolve “What changes when you run a command, use SFTP, or create a tunnel?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What changes when you run a command, use SFTP, or create a tunnel?

#### Persistent scenario state

ssh alice@server.example · TCP 22 · session pending. At this view the active checkpoint begins at **Shell** and can advance to **Forward**.

#### Concepts and actors

Authenticated transport, logical channel IDs, shell/exec/SFTP and forwarding.

#### Composition

Authenticate and use / Channels and failures in the one persistent console. One protected tunnel contains parallel shell, exec, SFTP and forwarding ribbons, with a separate example destination strip. The active view’s actor labels and state cues stay in the canvas; After authentication, SSH opens logical channels within the protected connection. A shell, remote command, SFTP subsystem, and forwarding each use a channel request with their own purpose. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Shell.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Deny forwarding** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Shell:** interactive session channel
- 2. **Exec:** one remote command and its streams
- 3. **SFTP:** subsystem channel
- 4. **Forward:** local, remote, or dynamic forwarding channel
- Observable fixture: $ ssh -L 15432:db.internal:5432 alice@bastion / # local listener carried through SSH

#### Failure or edge state

The user may authenticate successfully while forwarding is refused by server policy or an unavailable destination behind the server.

#### Required copy

Canvas labels: Shell → Exec → SFTP → Forward. Bottom takeaway: “Authentication creates a session; channels decide what work travels inside that encrypted transport.”

#### Accuracy caveats

Forwarding permission can be restricted separately from login. ProxyJump uses SSH connections to reach a later host; it is not a magical network tunnel.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://www.rfc-editor.org/rfc/rfc4254)

#### Acceptance checks

- One connection may multiplex distinct channel purposes.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 5 — Forwarding changes where a listener lives

#### Purpose

Resolve “What is different about -L, -R, and -D?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What is different about -L, -R, and -D?

#### Persistent scenario state

ssh alice@server.example · TCP 22 · session pending. At this view the active checkpoint begins at **Local -L** and can advance to **Jump -J**.

#### Concepts and actors

Client, bastion/server, local/remote listener, SOCKS proxy and final target.

#### Composition

Channels and access / Three forwarding forms in the one persistent console. Four flat direction diagrams compare local listener, remote listener, dynamic SOCKS listener and bastion jump. The active view’s actor labels and state cues stay in the canvas; Local forwarding opens a listener near the client and connects from the server side to one destination. Remote forwarding opens a listener near the server and returns traffic to the client side. Dynamic forwarding opens a local SOCKS listener for varying destinations. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Local -L.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Block forwarding** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Local -L:** client listener → SSH → server-side destination
- 2. **Remote -R:** server listener → SSH → client-side destination
- 3. **Dynamic -D:** client SOCKS listener → SSH → chosen destination
- 4. **Jump -J:** client → bastion → private SSH server
- Observable fixture: Examples: ssh -L 15432:db.internal:5432 bastion / ssh -R 8080:localhost:3000 server / ssh -D 1080 bastion

#### Failure or edge state

Authentication can succeed while the server rejects a forwarding request or cannot reach the destination.

#### Required copy

Canvas labels: Local -L → Remote -R → Dynamic -D → Jump -J. Bottom takeaway: “For a tunnel, first identify which side owns the listener and which side opens the destination connection.”

#### Accuracy caveats

Listener binding, target reachability, and server forwarding policy affect each form. ProxyJump uses a bastion as a route to a second SSH server, not necessarily the final shell host.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://man.openbsd.org/ssh), [primary source](https://www.rfc-editor.org/rfc/rfc4254)

#### Acceptance checks

- Listener ownership defines direction; a jump host is not the final SSH server by default.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 6 — Helpers change key handling, not the transport order

#### Purpose

Resolve “Where does ssh-agent sign, and what does forwarding it expose?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Where does ssh-agent sign, and what does forwarding it expose?

#### Persistent scenario state

ssh alice@server.example · TCP 22 · session pending. At this view the active checkpoint begins at **Local key** and can advance to **Certificate**.

#### Concepts and actors

Private key, local agent, forwarded socket proxy, user/host certificate CA.

#### Composition

Channels and access / Agent and certificates in the one persistent console. Local key → agent socket → remote proxy risk → CA certificate authority forms an authority-scope sequence. The active view’s actor labels and state cues stay in the canvas; ssh-agent is a local signing helper. Agent forwarding exposes a proxy socket to a remote host so it can request signatures; the private key is not copied, but a compromised remote session could misuse that signing ability. SSH certificates let a CA sign user or host identities. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Local key.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Expose agent socket** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Local key:** private material stays client-side
- 2. **Agent:** local socket requests a signature
- 3. **Forwarded agent:** remote socket can request signatures
- 4. **Certificate:** CA signs user/host identity metadata
- Observable fixture: Illustrative: ssh-add -l / ssh -A bastion / TrustedUserCAKeys

#### Failure or edge state

A compromised remote environment with forwarded-agent access may request signatures while that connection is available.

#### Required copy

Canvas labels: Local key → Agent → Forwarded agent → Certificate. Bottom takeaway: “Keep private signing material local and treat access to an agent socket as sensitive authority.”

#### Accuracy caveats

Hardware-backed keys and certificate policy vary by deployment. ControlMaster can reuse a connection but does not replace host verification or user authentication of the original master.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://man.openbsd.org/ssh-agent), [primary source](https://man.openbsd.org/ssh_config)

#### Acceptance checks

- Agent forwarding exposes signing authority without copying the key.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 7 — Hardening choices affect different SSH stages

#### Purpose

Resolve “Which setting blocks TCP entry, user login, or a forwarding channel?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Which setting blocks TCP entry, user login, or a forwarding channel?

#### Persistent scenario state

ssh alice@server.example · TCP 22 · session pending. At this view the active checkpoint begins at **Network** and can advance to **Channels**.

#### Concepts and actors

Firewall, host-key policy, sshd authentication settings, forwarding settings.

#### Composition

Operate and diagnose / Server policy in the one persistent console. Four gates follow actual order: network reachability, host trust, user authorization, channel policy; effective sshd setting examples sit below. The active view’s actor labels and state cues stay in the canvas; A network firewall controls reachability before SSH starts. sshd authentication settings govern user access after transport setup. Forwarding settings govern channel requests after login. Treat these as distinct gates when changing policy. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Network.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Deny this user** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Network:** limit which clients can reach TCP :22
- 2. **Host trust:** manage server host-key identity
- 3. **User auth:** scope public keys and login policy
- 4. **Channels:** allow or deny forwarding separately
- Observable fixture: Examples: PermitRootLogin no / PasswordAuthentication no / AllowTcpForwarding no

#### Failure or edge state

The encrypted transport can remain healthy while server login policy refuses this user.

#### Required copy

Canvas labels: Network → Host trust → User auth → Channels. Bottom takeaway: “Apply a control at the boundary it owns, then test the exact connection stage it changes.”

#### Accuracy caveats

PasswordAuthentication no does not by itself describe all keyboard-interactive methods. Validate effective sshd configuration and retain a known working access path before tightening a remote host.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://man.openbsd.org/sshd_config)

#### Acceptance checks

- A login denial after NEWKEYS is different from an unreachable TCP port.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 8 — SSH failures tell you which stage stopped

#### Purpose

Resolve “Why does “permission denied” require a different investigation from “connection timed out”?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why does “permission denied” require a different investigation from “connection timed out”?

#### Persistent scenario state

ssh alice@server.example · TCP 22 · session pending. At this view the active checkpoint begins at **Name/TCP** and can advance to **Channel**.

#### Concepts and actors

Resolver, TCP socket, KEXINIT, known_hosts, authorized_keys, channels and client debug log.

#### Composition

Operate and diagnose / First failing stage in the one persistent console. Name/TCP → algorithm → host key → user auth → channel evidence ladder with curated debug interpretation below. The active view’s actor labels and state cues stay in the canvas; Work from DNS and TCP to algorithm negotiation, host verification, user authentication, and channel setup. The first failed stage narrows the evidence you need; -v/-vv/-vvv logs can expose protocol progress without revealing private key material. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Name/TCP.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Inject host-key mismatch**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Name/TCP:** resolve and connect to port 22
- 2. **Algorithms:** find compatible transport algorithms
- 3. **Host key:** verify intended server
- 4. **User auth:** server accepts an allowed method
- 5. **Channel:** shell or forwarding request succeeds
- Observable fixture: Illustrative debug: ssh -vvv alice@server.example

#### Failure or edge state

The TCP connection and algorithm negotiation succeeded, but the client stopped at server host-key verification.

#### Required copy

Canvas labels: Name/TCP → Algorithms → Host key → User auth → Channel. Bottom takeaway: “Find the first incomplete SSH stage and inspect its actors before changing keys or server policy.”

#### Accuracy caveats

Client diagnostics are only one side of the story. Server logs and effective sshd configuration may be needed for policy, account, or forwarding failures.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://man.openbsd.org/ssh), [primary source](https://www.rfc-editor.org/rfc/rfc4253)

#### Acceptance checks

- The first incomplete stage narrows the owner and evidence; host mismatch stops before login.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

## Persistent console and deep-link contract

The canonical public route is `/ssh`. Every major view uses its stable fragment (the view IDs in the narrative table). Browser refresh, direct fragment, back and forward select the correct view and open its index group. These are new routes, so no earlier public section aliases exist. Without JavaScript, all 8 figures, their explanations, the grouped index and sources remain stacked inside the same console.

The console contains brand and library navigation, Foundations breadcrumb, title, format/difficulty, publication/review dates, persistent scenario state ribbon, grouped disclosure index, one active canvas, right/bottom inspector, bottom takeaway and previous/current/next navigation, related visuals, primary sources and footer.

## Prototype implementation and quality contract

The self-contained `guide/topics/ssh/ssh-visual-prototype.html` is generated from the integrated static route with its CSS and JavaScript inlined. It covers the full narrative and controls in one console; it is a review artifact outside catalogue, routing and Pagefind. Its hero traces have manual steps, play/pause, and a material alternate failure.

Factual checks compare every actor, ordering, source value and failure boundary with the linked primary references. Narrative checks ensure the scenario persists and related mechanisms follow dependency order. HTML checks cover semantic controls, direct fragments/history, no-JavaScript stacked reading, keyboard/focus, reduced motion and source reachability. `npm run check`, `npm run build`, `npm run check:graph`, and `npm run check:links` are the publication commands. Browser screenshots at 320 px, 200% zoom and reduced motion remain a separate QA gate; the workspace could not bind a preview socket and Firefox crashed in its sandbox on 2026-09-16.

## Deep-dive handoffs

Published related visuals: [Linux security](/linux/security), [Linux networking](/linux/networking), [AWS identity flows](/aws-identity-credential-flows). The console ends with these existing targets; proposed extensions wait until a canonical target is published. Keep this specification and its prototype outside the catalogue, routing, and search index.

## Page-level acceptance

- All 8 named figures, inspector explanations, failure copy, sources, and the grouped index are readable inside the same console with JavaScript disabled.
- Under enhancement, exactly one selected visual canvas is shown; selecting a new view opens only its concept group and preserves a stable fragment across refresh and history navigation.
- Every manual checkpoint updates its canvas state and named result, every selected hero trace can be paused and inspected, and its failure state marks a relevant boundary and evidence.
- Topic color and connector meaning follow the brief, while static comparisons remain static where movement adds no teaching value.
- Metadata, catalogue route, related links, source links, type check, static build, graph validation, and generated internal links all resolve.
- Browser review at desktop, 320 px, 200% zoom, keyboard, touch, reduced motion, and no JavaScript is recorded before this page is marked fully migration-complete.

## Integration guidance and status

Canonical metadata: `src/content/topics/ssh.mdx`. Canonical route: `src/pages/ssh.astro`. Neutral shell: `src/components/TopicConsoleShell.astro`; reusable console behavior: `src/components/foundations/ProtocolConsole.astro`; topic-specific visual forms: `src/components/foundations/VisualCanvas.astro`; source state: `src/components/foundations/protocol-data.ts`; reusable tokens/styles: `src/styles/protocol-console.css`. The prototype remains an approval artifact and must be regenerated after final production edits. Integration status: built and indexed on 2026-09-16; browser visual QA still pending.

## Source index

- [OpenSSH ssh(1) manual](https://man.openbsd.org/ssh)
- [OpenSSH sshd(8) manual](https://man.openbsd.org/sshd)
- [OpenSSH ssh_config(5) manual](https://man.openbsd.org/ssh_config)
- [OpenSSH sshd_config(5) manual](https://man.openbsd.org/sshd_config)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc4253)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc4252)
- [Additional primary reference](https://www.rfc-editor.org/rfc/rfc4254)
- [Additional primary reference](https://man.openbsd.org/ssh-agent)
