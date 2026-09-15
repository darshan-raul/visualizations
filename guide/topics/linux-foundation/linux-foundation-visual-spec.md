# Linux foundations — console integration visual specification

Topic: Linux foundations for the Foundations collection, with `/linux` and eight pillar routes.  
Status/version: integrated first implementation, v1.0, 2026-09-15. The [source architecture](../../linux-foundation-visual-spec.md) supplies the full pillar concept inventory; this document resolves the accepted console design and records the implemented page contract.  
Target audience: developers moving into cloud/DevOps/SRE, and engineers who know commands but need Linux system models.  
Page promise: one host and web workload explored through eight lenses.  
Persistent scenario: `devbox-01`, an nginx web service with a non-root worker, configuration and logs, a TCP/443 listener, and storage mounted at `/srv`. Values are deterministic teaching fixtures, not a live shell or a universal distribution default.  
Scope: kernel and common userspace primitives that underlie cloud, containers, and Kubernetes; no kernel development, full systemd reference, distribution installation guide, or advanced security policy authoring.  
Visual thesis: the Linux hub is a navigable machine map; each pillar zooms into one subsystem in its own persistent console.  
Semantic grammar: cyan marks direct system flow and inspection, purple ownership/identity, green successful state, amber transition or caveat, red a blocked boundary. Solid arrows mean direct modeled flow; dashed relations mean conceptual dependency. Motion highlights the selected transition, while still labels and connectors explain it without motion.

The Linux source spec's route model is preserved. The confirmed brief supersedes its optional saved-progress idea and flat concept rail. Suggested sequence is a free-navigation aid, not a locked curriculum. Each pillar index uses native disclosure groups, one expanded after view selection, current/total, and short labels. Direct fragments, reload, and browser back/forward select the intended view. Without JavaScript, all figures, copy, evidence, and sources stay in narrative order inside the same console.

## Narrative and route inventory

| # | Index group / major visual | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | `/linux` · Linux Map | What systems belong to this machine? | Radial eight-pillar map; vertical mobile journey | Free/path display, link/focus preview | Each lens opens a dedicated route, while the host remains the shared reference. |
| 2 | `/linux/identity` · Credentials / Access | Which identity does the kernel check? | Numeric-credential path and path-permission gates | Command probe; denied-path alternate | Process credentials and directory traversal matter separately. |
| 3 | `/linux/storage` · Path to bytes / Capacity | What backs this pathname? | Mount layers, inode/block comparison | Command probe; capacity alternate | Path, mount, filesystem, and device are distinct layers. |
| 4 | `/linux/processes` · Runtime / Services | What is running, and who manages it? | Process tree and service-state comparison | Command probe; failed-start alternate | Installed/active/healthy are separate states. |
| 5 | `/linux/networking` · Connection path / Reachability | Which layer carries or blocks TCP/443? | Socket-to-eth0 trace and reachability board | Step/play/pause, bind selector, failure alternate | Listener, route, firewall, and external controls differ. |
| 6 | `/linux/packages` · Install chain / Runtime | What did the package manager install? | Repository transaction and installed-file tree | Command probe; config failure alternate | Package installation does not prove service runtime. |
| 7 | `/linux/shell` · Command execution / Control | How does the shell route data and report status? | Pipeline FD path and exit-status gate | Command probe; pipefail alternate | A plain pipe carries stdout; status follows shell rules. |
| 8 | `/linux/security` · Access layers / Host posture | Can one allow still be blocked elsewhere? | Independent control layers and denial board | Command probe; narrow-access alternate | Access depends on several independent controls. |
| 9 | `/linux/troubleshooting` · Localize / Resolve | Which evidence identifies this failure? | Hypothesis and incident board | Eight scenario selector, command probe, recovery alternate | Choose probes that eliminate hypotheses, then verify the original path. |

The implementation expands each pillar from 5 views to 6–8 deep-linked views (58 views total), adding practical walkthroughs, recipes, comparison tables, reference grids, gotchas, and decision flows. Their precise schemas, commands/outputs, alternate states, and source links are in [linux-data.ts](../../../src/components/linux/linux-data.ts) and the modular files under `src/components/linux/pillars/`. The grouped view inventories are:

- Identity (7 views): Account lookup, Process credentials, Users & groups, Path traversal checks, Permission diagnosis (chmod 777 trap), sudo in practice, SSH key auth.
- Storage (7 views): Path lookup, Mount chain, File types & links, Space vs inodes, Deleted but open, Disk setup & fstab, Cloud disk growth.
- Processes (8 views): Program to PID, Process tree, Open handles, Signals & job control, Unit state, systemd unit files, Environment variables, Service won't start decision flow.
- Networking (8 views): Service socket, Outbound trace, Route & neighbour, DNS in practice, Bind address, iptables/nftables chains, Network namespaces, Blocked path diagnosis.
- Packages (6 views): Repository & trust, Installed files, Shared libraries, Install ≠ running, Version pinning, Broken runtime decision flow.
- Shell (8 views): Parse & expand, Pipe data, FD routing, Text processing toolkit, Pipeline status, Bash scripting patterns, Here documents & substitution, Real script walkthrough.
- Security (7 views): Control layers, File controls (DAC), MAC policy (SELinux/AppArmor), Server hardening, Network exposure, Authentication & audit logs, Security diagnosis.
- Troubleshooting (7 views): Unreachable app, Probe by layer, Logs & journald, Resource clues, Memory & CPU diagnosis, Failure board, Five-minute server check.

## Per-visual contracts

### Visual 1 — Linux Map

**Purpose and learner question.** Establish the whole system before the learner enters a pillar: “Where does my current Linux question belong?”

**Persistent scenario state.** `devbox-01` occupies the center. The eight links are lenses, not separate machines; nginx recurs in their examples.

**Concepts and actors.** Center: userspace, kernel, hardware. Outer nodes: Identity, Storage, Processes, Networking, Packages, Shell, Security, Troubleshooting. Concept hints and guided numbers are labels, not progress status.

**Composition.** Radial desktop map with a central machine boundary and eight links around it. Below the map, concise userspace/kernel/hardware layers, boot orientation, and a minimal filesystem hierarchy. At narrow widths, nodes become a numbered vertical journey anchored by the same machine. The free/path control changes only the displayed suggestion; links remain usable.

**Interaction and states.** Native pillar links navigate to dedicated routes. Focus/hover updates a short preview. Free/path buttons expose `aria-pressed`; path mode accents sequence numbers. Reset is “Explore freely.” Keyboard follows recommended number order. No pillar diagram expands inline.

**Data and edge state.** The center links to `#linux-machine`, not `/linux/machine`. A direct pillar landing does not need hub history because every pillar has a real `/linux` back link.

**Required copy and caveat.** “One Linux machine. Eight lenses.” The boot strip says “commonly systemd” and notes that containers do not usually execute a full host boot. The map does not equate Linux with one distribution.

**Mobile, accessibility, sources, acceptance.** Use full-width real links, 44 px targets, visible focus, no tiny radial labels, and reduced-motion still connectors. [Kernel documentation](https://docs.kernel.org/) supports the kernel scope; [Linux man-pages](https://man7.org/linux/man-pages/) supports the subsystem concepts. All eight routes load, the map is the first major visual, and the center leads only to concise basics.

### Visual 2 — Identity and access

**Purpose and learner question.** Resolve username-versus-credential and file-versus-path-permission confusion: “Why can’t the nginx worker read this file?”

**Persistent scenario state.** A service account starts a worker with fixture UID 33; the worker opens `/srv/site/index.html`.

**Concepts and actors.** Account lookup, numeric UID/GID/groups, process credentials, `/srv`, `/srv/site`, file mode, optional ACL/MAC pointer. Account record is configuration; process credentials are runtime.

**Composition.** Credentials flow left to right. Access views nest directory traversal gates before the final file-read gate. The Denied read view marks `/srv/site` red and leaves the file “not reached.” Inspector and bottom takeaway hold detailed explanation.

**Interaction and states.** Command buttons choose `id`/`ps` or a path probe and highlight the relevant actor. The alternate state restores group search permission in the fixture; button, diagram, inspector, and terminal change together. Reset returns the blocked default. Path views also permit manual stepping or playback.

**Data and edge state.** UID 33 is illustrative; the denial is one DAC fixture. ACLs, capabilities, or MAC can add separate denials. No universal shortcut recommends root or chmod 777.

**Required copy and caveat.** “A readable file can still be unreachable through its parent directory.” Linux normally uses filesystem IDs for file checks, with ordinary processes having them equal to effective IDs.

**Mobile, accessibility, sources, acceptance.** Stack gates vertically below 520 px, retain the blocked marker and text, announce alternate output politely, and keep the still path readable. [credentials(7)](https://man7.org/linux/man-pages/man7/credentials.7.html) and [path_resolution(7)](https://man7.org/linux/man-pages/man7/path_resolution.7.html) anchor the model. The denial must identify the first blocked directory, not generically blame file mode.

### Visual 3 — Filesystem and storage

**Purpose and learner question.** Make the storage stack inspectable: “Which layer owns `/srv/app/data.db`, and why can writes fail?”

**Persistent scenario state.** nginx reads from a path on a fixture ext4 filesystem mounted at `/srv` from `/dev/vdb1`.

**Concepts and actors.** Pathname, directory entry, open descriptor, mount point, filesystem, partition, block device, data-block and inode counters. The mount and directory are not synonyms.

**Composition.** The main chain descends path → mount → filesystem → block device. Capacity views split block and inode counters; the no-inodes gate is marked red. Deleted-open-file view branches from pathname to process FD and retained object.

**Interaction and states.** `findmnt`, `lsblk`, `df -h`, and `df -i` probes highlight the layer they inspect. A capacity alternate frees a fixture inode; diagram, terminal, and inspector state change. Reset restores no free inodes.

**Data and edge state.** `df`/`du` disagreement has several causes; open-deleted files are one documented possibility. LVM and filesystem growth are optional layers, never automatic after cloud volume resize.

**Required copy and caveat.** “Free bytes do not guarantee room for another file.” No formatting or destructive storage command is offered as an action.

**Mobile, accessibility, sources, acceptance.** Stack the layers with explicit downward arrows; commands wrap within their panel. [path_resolution(7)](https://man7.org/linux/man-pages/man7/path_resolution.7.html), [unlink(2)](https://man7.org/linux/man-pages/man2/unlink.2.html), and [util-linux findmnt](https://man7.org/linux/man-pages/man8/findmnt.8.html) anchor the views. The learner can distinguish a path, mount, filesystem, and device without animation.

### Visual 4 — Processes and services

**Purpose and learner question.** Show executable-versus-process and unit-versus-runtime: “What is running, and what evidence says it started?”

**Persistent scenario state.** A systemd-based fixture starts nginx master PID 418 and worker PID 421; the worker owns an FD and socket.

**Concepts and actors.** Executable, PID/PPID tree, credentials, FDs, unit definition, enabled state, active state, application health. Unit configuration and process runtime remain distinct.

**Composition.** The tree grows from PID 1 to master and worker. Service-state comparison separates installed, enabled, active, and healthy. Failed-start view puts the unit failure and absent socket beside the journal’s config error.

**Interaction and states.** `ps`, `/proc`, `systemctl`, and `journalctl` probes highlight the relevant runtime or evidence object. A simulated config fix changes failed unit to active and adds a socket, but the inspector reminds readers to verify application reachability. Reset restores failed fixture.

**Data and edge state.** PIDs and log text are fixtures. systemd is common, not required on every Linux host. `pstree` and `lsof` may be absent.

**Required copy and caveat.** “A service state is evidence; the cause appears in the surrounding trace.” SIGTERM is the ordinary graceful signal; SIGKILL is not presented as a first troubleshooting step.

**Mobile, accessibility, sources, acceptance.** Stack process branches, retain PPID labels, provide text summaries and non-color failure marks. [execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html), [/proc](https://man7.org/linux/man-pages/man5/proc.5.html), and [systemctl](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html) support the views. Installed, enabled, active, and healthy must remain separate in copy and diagram.

### Visual 5 — Networking

**Purpose and learner question.** Distinguish the decisions along a flow: “Who created TCP/443, and where can the connection stop?”

**Persistent scenario state.** nginx listens on the fixture host and connects toward documentation-safe `192.0.2.25`, routed via `10.0.1.1` through eth0.

**Concepts and actors.** Process, socket, DNS lookup, route, source/interface, local firewall, neighbour/next hop, client. Guest controls and AWS SG/NACL controls occupy different scopes.

**Composition.** Service socket and outbound path use directional arrows; route/neighbor view separates destination from next-hop MAC. Listener comparison shows loopback, IPv4 wildcard, and eth0-specific bind. Blocked path cuts the local firewall arrow at the denial.

**Interaction and states.** The outbound trace has manual step, play/pause/replay; selected actor and step counter update. The listener selector changes bind address, highlighted actor, terminal, and inspector. The blocked-path alternate removes a local DROP fixture and changes the evidence. Reset restores each deterministic default.

**Data and edge state.** Bind wildcard changes potential local destinations, not guaranteed remote reachability. IPv6 dual-stack behavior is excluded from the IPv4 fixture. `nft` is optional/host-dependent; AWS controls are outside the guest.

**Required copy and caveat.** “Resolving a name and forwarding a packet are separate stages.” The diagram is an overview, not a literal universal netfilter hook order.

**Mobile, accessibility, sources, acceptance.** Turn the path into numbered vertical steps; keep controls native and at least 44 px. Reduced motion leaves selected steps visible and manual controls usable. [socket(7)](https://man7.org/linux/man-pages/man7/socket.7.html), [ip-route(8)](https://man7.org/linux/man-pages/man8/ip-route.8.html), and [nftables documentation](https://wiki.nftables.org/wiki-nftables/index.php/Main_Page) anchor the model. Listener, route, firewall, and external control remain separately labelled.

### Visual 6 — Packages and software

**Purpose and learner question.** Trace the install-to-runtime boundary: “Did installing nginx actually make it serve traffic?”

**Persistent scenario state.** Distribution repository metadata supplies the nginx package, whose files include a binary, config, and service unit in the fixture.

**Concepts and actors.** Repository/trust, package manager, dependency resolution, package artifact, owned files, dynamic libraries, unit, process, socket. Repository and unit definition are configuration; process/socket are runtime.

**Composition.** Transaction chain flows into an installed-file tree. Start policy splits installed/active/healthy. Broken runtime puts invalid config red between binary presence and service start; absent socket follows as consequence.

**Interaction and states.** Debian-family `apt`/`dpkg` and RHEL-family `dnf`/`rpm` probes have explicit labels. The alternate fixes config without reinstalling the package, updates terminal and diagram, and resets to failed.

**Data and edge state.** The shown package version/path is illustrative; post-install service behavior varies. `ldd` is not suggested for an untrusted binary.

**Required copy and caveat.** “Installed does not mean enabled, active, or ready.”

**Mobile, accessibility, sources, acceptance.** Use a vertical transaction path and readable installed-file branches; terminal outputs wrap. [Debian APT guide](https://www.debian.org/doc/manuals/apt-guide/), [dynamic loader manual](https://man7.org/linux/man-pages/man8/ld.so.8.html), and [systemctl](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html) support the distinctions. Fixing config must leave package state unchanged.

### Visual 7 — Shell and automation

**Purpose and learner question.** Expose file-descriptor routing and pipeline status: “Which stream went through the pipe, and what status came back?”

**Persistent scenario state.** An operator on devbox-01 filters nginx journal lines with a Bash pipeline.

**Concepts and actors.** Terminal, shell parser, argv, FD 0/1/2, pipe, grep, file redirection, exit status, Bash pipefail option. Text interpretation and process runtime are distinct.

**Composition.** Parse and pipeline views show directional data movement. FD routing splits stdout and stderr; status view shows producer exit 1, consumer exit 0, and resulting default/pipefail status.

**Interaction and states.** Command probes switch terminal and actor highlight. The pipefail alternate reports producer failure and updates the status gate. Reset restores Bash default behavior. Path controls are manual or playback, with a still summary.

**Data and edge state.** `pipefail` is Bash-specific; `set -e` has exceptions and is not a safety guarantee. A bare `>` captures stdout, not stderr.

**Required copy and caveat.** “A plain pipe carries stdout; stderr needs an explicit choice.”

**Mobile, accessibility, sources, acceptance.** Stack FD branches and preserve labels; announce selected command output politely. [GNU Bash pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html) and [redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html) support the model. The default status must be 0 for `false | cat`, while the pipefail fixture reports 1.

### Visual 8 — Security

**Purpose and learner question.** Teach independent constraints: “Why can nginx still be denied after one control permits it?”

**Persistent scenario state.** The nginx worker requests `/srv/secret/config` under a root-only DAC mode in the failure fixture.

**Concepts and actors.** Worker credentials, DAC/group/ACL, optional MAC, mount flags, guest firewall, external cloud controls, audit evidence. Independent constraints are grouped for learning, not asserted as one universal kernel call order.

**Composition.** Access-layer stack surrounds the worker/resource. DAC mode comparison exposes who matches 0640. Denied-secret board marks root-only DAC gate red; the following MAC gate is labelled “not reached in model.” Network exposure separates socket, guest, and cloud scope.

**Interaction and states.** Command probes inspect UID and file mode. A narrow alternate changes fixture file to 0640 root:nginx; diagram, terminal, and inspector update, while copy still requires MAC/path verification. Reset restores 0600 root:root.

**Data and edge state.** SELinux/AppArmor presence, policy, audit format, and firewall defaults vary. No generic “disable MAC” or chmod 777 action is offered.

**Required copy and caveat.** “A DAC allow does not guarantee a MAC allow.”

**Mobile, accessibility, sources, acceptance.** Stack controls; denial has red marker plus text and line cut. [path_resolution(7)](https://man7.org/linux/man-pages/man7/path_resolution.7.html), [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html), and [kernel LSM docs](https://docs.kernel.org/security/lsm.html) anchor the overview. The alternate must explicitly say other controls still need checks.

### Visual 9 — Troubleshooting

**Purpose and learner question.** Turn system knowledge into evidence-based diagnosis: “Which probe should I run next for an unreachable service?”

**Persistent scenario state.** A remote client cannot reach nginx on devbox-01. Default fixture: service active, socket bound only to 127.0.0.1:443.

**Concepts and actors.** Client symptom, DNS/route, process/unit, socket/bind, guest firewall, logs, blocks/inodes, memory/OOM, config permissions. These are hypotheses, not one fixed probe order.

**Composition.** Hypothesis tree leads to an evidence board. Each scenario changes a marked actor and a concise status line; inspector and terminal show the next discriminating probe. Diagnostic loop ends observe → probe → narrow fix → verify original client path → record.

**Interaction and states.** Native scenario select supports loopback, service stopped, local firewall, DNS unavailable, blocks full, inodes full, OOM, and config permission denied. Every selection changes diagram highlight, terminal, and inspector; a separate loopback recovery alternate changes bind fixture to eth0. Reset returns loopback default.

**Data and edge state.** Ping, a process existing, and an active unit do not prove the application is reachable. The displayed logs and addresses are fixtures.

**Required copy and caveat.** “A good probe eliminates hypotheses before changing state.”

**Mobile, accessibility, sources, acceptance.** The evidence board stacks with explicit failure labels, select is labelled, and live terminal output is concise. [systemctl](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html), [socket(7)](https://man7.org/linux/man-pages/man7/socket.7.html), and [df](https://man7.org/linux/man-pages/man1/df.1.html) support the example paths. Selecting each of eight scenarios must change at least the terminal, inspector, and highlighted failure actor.

## Persistent console, integration, and acceptance

Every pillar uses title/metadata, a Back to Linux Map link, grouped index, active canvas, inspector and deterministic simulated terminal, bottom takeaway and cloud/container bridge, previous/map/next pillar links, source drawer, related visuals, and site footer in one container. At mobile widths the grouped index is a compact “Explore views” disclosure so the first diagram follows the header; without JavaScript it stays open and all five views remain readable. The [hub](../../../src/components/linux/LinuxHub.astro) is a map/orientation surface and does not embed full pillar diagrams. The neutral [TopicConsoleShell.astro](../../../src/components/TopicConsoleShell.astro) owns the common page frame; [LinuxPillarConsole.astro](../../../src/components/linux/LinuxPillarConsole.astro), [linux.css](../../../src/styles/linux.css), and the per-pillar data provide the Linux visual language. [linux.mdx](../../../src/content/topics/linux.mdx) is the single canonical topic entry. Astro routes are `/linux` and `/linux/<pillar>`; the catalogue shows one Linux topic card. Existing RDS/ENI pilots still need alignment to this neutral frame.

The [approval prototype](linux-foundation-visual-prototype.html) is a standalone navigation/interaction proof with representative content for all eight pillars and the richer Networking path. It is outside the published site and is not a second maintained implementation. The current implementation was authorized by the user's request to create the visual; future work should improve the canonical MDX/components, not copy the prototype into production.

- [ ] Complete browser interaction QA at 320 px, 200% zoom, keyboard/touch, reduced motion, direct fragments, back/forward, and no-JavaScript. Desktop (1440 px) and mobile (390 px) screenshots were inspected; the final 320 px screenshot attempt was interrupted by a Firefox headless crash.
- [x] Verify the map never embeds full pillar pages and each pillar has breadcrumb/back/map/previous/next.
- [x] Confirm deterministic command fixtures, alternate actor counts, and optional/distro/systemd scope labels in the data and rendered pages. Browser click-through of every fixture remains in the interaction QA above.
- [x] Confirm all eight pillars show mechanics, a failure or alternate state, misconception correction, and a cloud/container/Kubernetes bridge.
- [x] Run `npm run check`, `npm run build`, topic graph and internal links; recheck external primary sources and copy where wording changes the claim. `npm run verify` passed on 2026-09-15.

Future deep dives: cgroups v2, Linux namespaces/container isolation, LVM/volume growth, nftables packet path, MAC policy comparison, and performance diagnosis merit separate pages when substantial. Link them only after publication.

## Source index

Primary sources are linked near each visual and in [linux.mdx](../../../src/content/topics/linux.mdx). Core source families: [Linux kernel documentation](https://docs.kernel.org/), [Linux man-pages](https://man7.org/linux/man-pages/), [GNU Bash manual](https://www.gnu.org/software/bash/manual/), [systemd manuals](https://www.freedesktop.org/software/systemd/man/latest/), [GNU Coreutils](https://www.gnu.org/software/coreutils/manual/coreutils.html), [Debian APT](https://www.debian.org/doc/manuals/apt-guide/), and [nftables documentation](https://wiki.nftables.org/wiki-nftables/index.php/Main_Page). Source behavior and site content were reviewed on 2026-09-15; distro-specific defaults are not treated as universal.
