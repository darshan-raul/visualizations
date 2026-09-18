# Linux Foundations — complete tutorial visual specification

Topic: Linux foundations at `/linux` and eight stable chapter routes.

Status/version: Integrated tutorial rebuild v3, 2026-09-18.

Target audience: Working developers moving into DevOps/SRE who know commands but need durable operating-system models.

Page promise: Complete the eight chapters and be able to explain, observe, and diagnose the Linux mechanisms underneath services, containers, and cloud hosts.

Persistent scenario: `devbox-01`, a documentation-only host running nginx master PID 418 and worker PID 421 as UID 33, with ext4 mounted at `/srv` and a listener on TCP/443. The host provides continuity; it is not a forced trace through every subject.

Scope: identity, storage, processes, networking, packages, shell execution, host security, and evidence-led troubleshooting.

Non-goals: installation, desktop administration, exhaustive command coverage, certification preparation, complete SELinux policy authoring, or a claim that all distributions share one init, firewall, filesystem, or security configuration.

Visual thesis: teach objects first, reveal one consequential mechanism, connect it to observable evidence, then ask the learner to apply it. `/linux` is a curriculum roadmap; tracing is one visual form among several.
Semantic grammar: cyan is active mechanism or inspection; purple is identity/ownership; green is confirmed healthy or allowed; amber is pressure, waiting, or caveat; red is denial, exhaustion, or broken state. Solid connectors show real direction; dashed connectors show references or control association. Text and shape always accompany color.

## 1. Audit that reopened the Linux migration

The rejected implementation had real breadth—64 views and six custom labs—but its learning architecture was a view gallery.

- `LinuxHub.astro` led with three traces and a radial set of nearly identical route cards. It did not state outcomes, prerequisites, applied tasks, or why chapter order matters.
- All `pillars/*.ts` definitions used two broad groups. Mechanisms, operations, and failure diagnosis were mixed, so the index did not form a tutorial progression.
- `LinuxPillarConsole.astro` opened with a scenario ribbon, without saying what a chapter builds or which kernel objects the learner should retain.
- Claims were overconfident: `shell.ts` fixed pipe capacity at 64 KB; identity/security copy treated UID 0 as a universal bypass; `processes.ts` promised systemd would terminate every descendant; security copy called local records immutable; SSH copy described decrypting a server challenge.
- `PacketTraceLab.astro` created clickable `div` elements, and its core controls/stages were empty before JavaScript.
- Generic actor boxes recurred where state machines, descriptor graphs, resource meters, decision ladders, or comparisons better fit the mechanism.
- The old canonical spec centered tracing and repeated the inaccuracies. Root `guide/linux-foundation-visual-spec.md` is a superseded pre-console planning artifact retained because deletion requires approval.

The rebuild preserves useful routes, fragments, fixtures, and labs while adding chapter outcomes, kernel objects, applied tasks, progressive groups, and two mechanism checks per pillar.

## 2. Concept groups and narrative sequence

Hub phases: (I) Build the machine model—Identity and Storage; (II) Run and connect software—Processes, Networking, Packages, Shell; (III) Protect and operate—Security and Troubleshooting.

Each pillar has three short disclosure groups: model/foundations, mechanism/operation, and failure/practice. Only the selected group stays open under enhancement. The index exposes `current / total`; direct fragments select the view and group; `popstate` and `hashchange` restore history. Existing view IDs remain canonical.

| # | Index group / view | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 0 | Hub / orientation | Where should I start and where do chapters fit? | Layered machine map + curriculum | Three orientation states | Chapters share a machine model but need different visual forms. |
| 1 | Identity / account → access | Which identity and permission class applies? | Lookup ladder + credential map + decision lab | Change principal/mode | Names are userspace data; the kernel checks numeric credentials and applicable controls. |
| 2 | Storage / name → open object | Why can deletion fail to free capacity? | VFS lookup + reference graph + meters | Step lookup/change state | Pathname, inode, open file, page, and block are different objects. |
| 3 | Processes / executable → service | What makes software a supervised workload? | State machine + address map + tree | Create/reap/signal | A service is policy around processes, not a binary. |
| 4 | Networking / socket → reachability | Where can a connection fail? | Packet path + comparisons | Inject failed stage | Listener, route, filter allow, and application response are separate claims. |
| 5 | Packages / repository → runtime | Why is installed not running? | Trust graph + loader/service states | Inspect failure | Packaging establishes files; execution adds linking, supervision, and sockets. |
| 6 | Shell / source → process graph | What changes before a program starts? | Expansion sequence + FD graph | Rewire stderr/pipefail | A pipe carries bytes between descriptors, not commands. |
| 7 | Security / request → decision | Which applicable control denied it? | Decision stack + evidence board | Change inputs/evidence | Passing DAC does not cancel LSM, seccomp, namespace, or network policy. |
| 8 | Troubleshooting / symptom → proof | Which observation eliminates hypotheses? | Diagnostic matrix + evidence sequence | Select probes | Preserve evidence and localize before mutation. |

## 3. Per-visual contracts

### Visual 0 — Curriculum and machine orientation

#### Purpose
Replace the route gallery with a complete learning path and shared machine frame.
#### Learner question
“Where should I start, and how do these chapters fit?”
#### Persistent scenario state
`devbox-01` is healthy; network, file, and container states locate boundaries only.
#### Concepts and actors
Processes, syscall boundary, kernel subsystems, devices, eight chapters, three phases, and model → mechanism → evidence → practice.
#### Composition
A learning contract precedes a stable vertical architecture map. Three curriculum phases then contain numbered chapter cards with lesson count and applied task. Connectors appear only inside mechanisms.
#### Interaction
Three native buttons select network, file, or container orientation; `aria-pressed` changes while stable nodes remain. Reload resets to network.
#### Data or content states
PID 421, UID 33, `/srv/site/index.html`, `eth0` `10.0.1.17`, and a 512 MiB teaching cgroup.
#### Failure or edge state
Container state shows a shared host kernel. Chapter links work without JavaScript.
#### Required copy
“Understand the Linux machine—not just its commands.” Follow all chapters or enter by operational question.
#### Accuracy caveats
Ring terms are x86-oriented. A syscall changes privilege context, not necessarily a full process context switch.
#### Mobile behavior
Layers and chapters stack; buttons wrap; no radial positioning.
#### Accessibility
Native controls, visible focus, text states, non-color active borders, reduced motion.
#### Source anchors
[Kernel userspace API](https://docs.kernel.org/userspace-api/index.html), [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html), [cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html).
#### Acceptance checks
All phases and routes are named and the map reads correctly without scripts.

### Visual 1 — Identity lookup and access decision

#### Purpose
Separate name lookup, authentication, credentials, traversal, and authorization.
#### Learner question
“Why EACCES when the filename looks readable?”
#### Persistent scenario state
nginx PID 421 reads `/srv/site/config.json` as UID/GID 33.
#### Concepts and actors
NSS, UID/GID vectors, supplementary groups, directory search, inode mode/owner, ACL/capability caveats, sudo, SSH.
#### Composition
Account resolution is a lookup ladder; runtime identity a credential vector; pathname access a left-to-right gate; the lab a first-match decision tree.
#### Interaction
Switch NSS source; select process and edit mode bits. Native controls update the chosen class and live result. Reset returns nginx/mode 0640.
#### Data or content states
`www-data:x:33:33`, groups `[33]`, file owner 0/group 33, blocked parent 0750.
#### Failure or edge state
Parent search denial precedes leaf read. Owner denial never falls through to group.
#### Required copy
“The kernel normally compares numeric credentials; usernames are userspace presentation.”
#### Accuracy caveats
ACLs alter the simple classes. Capabilities/user namespaces scope overrides. PAM is not NSS.
#### Mobile behavior
Credential columns and gates become numbered blocks.
#### Accessibility
Labelled radios/checkboxes, live result, static decision summary.
#### Source anchors
[credentials(7)](https://man7.org/linux/man-pages/man7/credentials.7.html), [path_resolution(7)](https://man7.org/linux/man-pages/man7/path_resolution.7.html), [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html).
#### Acceptance checks
The lab never falls through after owner/group match and names the blocked directory.

### Visual 2 — VFS names, open files, cache, and capacity

#### Purpose
Replace “a file is bytes at a path” with relationships needed for mount/capacity diagnosis.
#### Learner question
“Why do df, du, lsof, and stat disagree?”
#### Persistent scenario state
PID 421 holds FD 14 to an unlinked access log on `/srv`.
#### Concepts and actors
Path component, dentry, inode, mount, open file description, FD, page cache, filesystem, block device, block/inode capacity.
#### Composition
Path lookup is a ladder; open-unlinked behavior a reference graph; capacity paired meters; volume growth layered before/after.
#### Interaction
Step lookup and toggle capacity cleanup; stable objects remain while evidence updates.
#### Data or content states
Inode 262145, FD 14, `nlink=0`, `/dev/vdb1`, and safe `df`, `du`, `lsof +L1`, `findmnt`, `stat` output.
#### Failure or edge state
ENOSPC from inode exhaustion; blocks persist until the last open reference closes.
#### Required copy
“Unlink removes a name; it does not invalidate an open file.”
#### Accuracy caveats
Allocation/cache behavior varies with filesystem, direct I/O, writeback, and mounts. Truncation through `/proc` is not a universal first action.
#### Mobile behavior
Pipelines become numbered vertical sequences; meters wrap.
#### Accessibility
Manual steps, stable text states, live result, no auto-only animation.
#### Source anchors
[VFS](https://docs.kernel.org/filesystems/vfs.html), [path lookup](https://docs.kernel.org/filesystems/path-lookup.html), [unlink(2)](https://man7.org/linux/man-pages/man2/unlink.2.html), [open(2)](https://man7.org/linux/man-pages/man2/open.2.html).
#### Acceptance checks
The view distinguishes dentry, inode, open description, FD, and both ENOSPC cases.

### Visual 3 — Process and service lifecycle

#### Purpose
Separate executable, process, thread, state, cgroup, and supervision.
#### Learner question
“Installed software exists; what must happen for a healthy service?”
#### Persistent scenario state
systemd starts nginx; alternates leave a zombie or failed unit.
#### Concepts and actors
ELF, fork/clone, execve, task, memory, FDs, scheduler state, parent/wait, signals, unit, cgroup.
#### Composition
Lifecycle state machine, process tree, conceptual address map, descriptor table, unit dependency sequence.
#### Interaction
Create, stop, exit, and reap a child. Signal state distinguishes delivery/disposition; reset restores healthy tree.
#### Data or content states
PIDs 1/418/421; R/S/D/T/Z; exit status; active/failed/activating.
#### Failure or edge state
Zombie retained until wait; D may persist; SIGTERM is not guaranteed graceful.
#### Required copy
“A program is bytes; a process is execution state; a unit is supervision policy.”
#### Accuracy caveats
Address layout varies by architecture/ASLR/ABI/mitigations. systemd stop depends on KillMode, signals, timeouts, and cgroup membership.
#### Mobile behavior
Trees retain indentation; address regions/states stack.
#### Accessibility
Letter plus text states, native buttons, live changes.
#### Source anchors
[proc_pid_status(5)](https://man7.org/linux/man-pages/man5/proc_pid_status.5.html), [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html), [systemd.service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html), [systemd.kill](https://www.freedesktop.org/software/systemd/man/latest/systemd.kill.html).
#### Acceptance checks
Zombie differs from runnable work; signal/stop outcomes are not promised universally.

### Visual 4 — Network reachability boundaries

#### Purpose
Turn “port open” into route, namespace, filter, socket, transport, and application evidence.
#### Learner question
“Where did the connection stop, and what proves it?”
#### Persistent scenario state
A client connects to `10.0.1.17:443`; alternates bind loopback or drop at a filter.
#### Concepts and actors
Net namespace, interface, address, FIB, neighbour, Netfilter hooks, socket tuple/queues, listener, process, NSS/DNS.
#### Composition
Directional packet traversal, route ladder, bind comparison, namespace/veth boundary map. Failed states retain unaffected stages.
#### Interaction
Real buttons toggle one stage with `aria-pressed`; result names the first failure; reset restores all.
#### Data or content states
`lo`, `eth0`, `10.0.1.17/24`, gateway `10.0.1.1`, listeners `127.0.0.1:443` and `0.0.0.0:443`.
#### Failure or edge state
Timeout is absence of response, not proof of one firewall. Refusal, DNS, TLS, and HTTP failures remain distinct.
#### Required copy
“A listener proves local socket state, not the whole path.”
#### Accuracy caveats
Hook order depends on family, chain type/priority and local/forwarded path. `getent` and `dig` answer different questions.
#### Mobile behavior
Packet path becomes a numbered timeline; comparisons stack.
#### Accessibility
Text state and live result; no required motion.
#### Source anchors
[network_namespaces(7)](https://man7.org/linux/man-pages/man7/network_namespaces.7.html), [ip-route(8)](https://man7.org/linux/man-pages/man8/ip-route.8.html), [socket(7)](https://man7.org/linux/man-pages/man7/socket.7.html), [nftables](https://netfilter.org/projects/nftables/manpage.html).
#### Acceptance checks
Bind scopes differ visibly and the first failed stage stays identifiable.

### Visual 5 — Package trust, files, linking, and activation

#### Purpose
Separate trust, dependency solving, files, runtime linking, service activation, and health.
#### Learner question
“What succeeded when installation completed?”
#### Persistent scenario state
nginx files unpack; alternate loader/service failure prevents a listener.
#### Concepts and actors
Repository metadata, trust anchor, dependency solver, archive, database, scripts, paths, ELF interpreter, shared objects, unit, process, socket.
#### Composition
Dependency graph, file manifest, loader sequence, and installed/enabled/active/listening state board.
#### Interaction
Static comparison/walkthrough; extra controls would duplicate the meaningful failure selector.
#### Data or content states
`dpkg -L`/`rpm -ql`, loader evidence, `systemctl status`, `ss -lntp`.
#### Failure or edge state
Signature rejection, missing library, start then exit, active without intended socket.
#### Required copy
“Installed is package-database state, not runtime health.”
#### Accuracy caveats
Package ecosystems differ. Signatures authenticate under configured policy, not safety or compatibility.
#### Mobile behavior
Graphs become lists; state board becomes rows.
#### Accessibility
Ordered semantics and explicit state words.
#### Source anchors
[Debian repository format](https://wiki.debian.org/DebianRepository/Format), [ld.so(8)](https://man7.org/linux/man-pages/man8/ld.so.8.html), [systemd.unit](https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html).
#### Acceptance checks
Learners can name a post-install boundary and locate files without universalizing one tool.

### Visual 6 — Shell parse, descriptor wiring, and status

#### Purpose
Make expansion, process creation, pipes, redirection order, and status observable.
#### Learner question
“Why did data go there, and why did the script report success?”
#### Persistent scenario state
The operator runs an nginx log pipeline with stderr and a failing producer.
#### Concepts and actors
Tokens, expansions, words, child processes, FD 0/1/2, pipe ends, bounded buffer, EOF/SIGPIPE/EPIPE, status, pipefail, jobs.
#### Composition
Parse sequence plus FD graph; pipe stays stable while endpoints change; status is a truth table.
#### Interaction
Switch descriptor wiring/failure; reveal destinations and Bash status; reset to stdout-only pipe.
#### Data or content states
`false | true`, `>out 2>&1`, and `2>&1 >out`.
#### Failure or edge state
Full pipe blocks a blocking writer; closed reads trigger SIGPIPE/EPIPE; default status may mask earlier failure.
#### Required copy
“The pipe carries bytes between descriptors; it does not automatically include stderr.”
#### Accuracy caveats
Capacity is bounded, not portable; Linux exposes `F_GETPIPE_SZ`. Bash claims are labelled.
#### Mobile behavior
FD graph becomes process → FD → object rows; controls wrap.
#### Accessibility
Text equivalents for connectors, live destination/status, reduced-motion still state.
#### Source anchors
[Bash pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html), [Bash redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html), [pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html).
#### Acceptance checks
Redirection order changes the graph and no copy fixes capacity at 64 KB.

### Visual 7 — Security decision and evidence stack

#### Purpose
Replace a simplistic onion with independent applicable controls and evidence.
#### Learner question
“DAC allows this; what can still deny it?”
#### Persistent scenario state
nginx passes mode bits but receives an SELinux AVC denial in the alternate fixture.
#### Concepts and actors
Credentials, DAC/ACL, capabilities, mount flags, LSM, seccomp, namespaces, Netfilter, sandbox, auth/audit records.
#### Composition
Decision tree, capability boundary, MAC comparison, network layers, evidence board. Decisions converge; they are not one universal ordered chain.
#### Interaction
Shared permission lab plus evidence selection identifying the denying control.
#### Data or content states
0644, `CAP_NET_BIND_SERVICE`, SELinux/AppArmor events, `ausearch`, journal, systemd-specific analysis.
#### Failure or edge state
DAC allow + LSM deny; namespace UID 0 lacks parent-namespace capabilities.
#### Required copy
“An allow from one applicable control is not a universal allow.”
#### Accuracy caveats
LSM models differ and may be absent. Local logs are not inherently immutable. Capabilities are scoped.
#### Mobile behavior
Decision/evidence sections stack.
#### Accessibility
Written outcomes, fieldsets, denial not color-only.
#### Source anchors
[capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html), [user_namespaces(7)](https://man7.org/linux/man-pages/man7/user_namespaces.7.html), [LSM](https://docs.kernel.org/security/lsm-development.html), [seccomp](https://docs.kernel.org/userspace-api/seccomp_filter.html).
#### Acceptance checks
No universal root bypass, identical LSM, or immutable-log claim remains.

### Visual 8 — Evidence-led failure isolation

#### Purpose
Combine prior chapters into a repeatable operational method.
#### Learner question
“Which measurement next, and which hypothesis would it weaken?”
#### Persistent scenario state
Caller reports “site down”; fixtures cover refusal, timeout, DNS, failed unit, inode, OOM, FD, and CPU failures.
#### Concepts and actors
Symptom, hypothesis, boundary, probe, observation, utilization/saturation/error, mutation, recovery, caller.
#### Composition
Symptom decision tree, USE-style matrix, four meters, five-minute evidence sequence. Every command states its question.
#### Interaction
Select fixture then probe; inspector gives observation, weakened hypotheses, next boundary. Reset restores symptom; no score/persistence.
#### Data or content states
`systemctl`, `journalctl`, `ss`, `curl`, `df -h/-i`, `/proc`, PSI, `vmstat`, interface counters.
#### Failure or edge state
Local curl succeeds while remote times out, moving the boundary outward. Restart can erase transient evidence.
#### Required copy
“Collect evidence, localize, change one variable, verify from the caller.”
#### Accuracy caveats
USE is an operational heuristic, not a kernel algorithm; tools/metrics vary.
#### Mobile behavior
Branches become question cards; matrix becomes resource sections.
#### Accessibility
Native probe controls, live result, full conclusions in no-JS source order.
#### Source anchors
[PSI](https://docs.kernel.org/accounting/psi.html), [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html), [journalctl](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html).
#### Acceptance checks
Commands name their question, evidence precedes mutation, recovery is verified at host and caller.

## 4. Persistent console and no-JavaScript contract

Every pillar retains `TopicConsoleShell`: title/dates, grouped index, one active canvas under enhancement, contextual inspector, bottom takeaway, chapter knowledge check, previous/current/next navigation, sources, related links, footer. `ChapterGuide.astro` supplies objectives, kernel objects, and applied task; `KnowledgeCheck.astro` supplies two mechanism questions with feedback.

Without JavaScript, every view and explanation remains in document order. Enhancement hides inactive views only after initialization. Direct fragments, reload, and Back/Forward select the correct view/group. Native controls, visible focus, 44 px targets where feasible, live decisions, and stable reduced-motion states are required.

Production stays composable: pillar data owns content, interactive modules own one mechanism, and `linux.css` owns shared presentation. The prototype is an approval record, not published copy.

## 5. Deep-dive handoffs

No unpublished route is linked. Future candidates: namespace/cgroup internals, SELinux policy analysis, scheduler performance, storage writeback. Each needs a separate page because version branches would interrupt the foundation.

## 6. Page-level acceptance

- `/linux` and eight pillar URLs remain stable; current view IDs remain valid fragments.
- Hub identifies a complete tutorial and dependency order; no decorative radial map.
- Every chapter states outcomes, objects, practice, misconceptions, evidence, and references.
- No page has more than three hero interactions; controls change consequential state.
- At 320 px and 200% zoom, content stacks without clipped labels or page-level overflow.
- Keyboard, touch, focus, reduced motion, semantic state, contrast, and no-JS order satisfy the console contract.
- Claims are scoped to generic Linux, Bash, systemd, nftables, or distribution tooling.
- Automated and browser results are recorded truthfully.

## 7. Prototype and integration

The prototype must show the complete curriculum, chapter guide/index/canvas/inspector/takeaway pattern, representative states from all eight chapters, and working permission, packet-failure, and diagnostic interactions. It uses native controls, unique IDs, inline CSS/JS, no dependencies, reduced motion, and readable source order.

Canonical published implementation: `src/pages/linux/index.astro`, `src/pages/linux/[pillar].astro`, `src/content/topics/linux.mdx`, `src/components/linux/**`, `src/styles/linux.css`.

Canonical design artifact: this file.

Working artifact: `linux-foundation-visual-prototype.html`.

Superseded artifact retained pending deletion approval: `guide/linux-foundation-visual-spec.md`.
Integration status: chapter architecture and accuracy corrections integrated 2026-09-18; final validation is recorded after checks.

## 8. Source index

- [Linux kernel documentation](https://docs.kernel.org/)
- [Linux VFS](https://docs.kernel.org/filesystems/vfs.html)
- [Linux cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [Linux Security Modules](https://docs.kernel.org/security/lsm-development.html)
- [Linux seccomp](https://docs.kernel.org/userspace-api/seccomp_filter.html)
- [Linux man-pages](https://man7.org/linux/man-pages/)
- [GNU Bash](https://www.gnu.org/software/bash/manual/)
- [systemd manuals](https://www.freedesktop.org/software/systemd/man/latest/)
- [nftables](https://netfilter.org/projects/nftables/manpage.html)
- [OpenSSH sshd](https://man.openbsd.org/sshd.8)

## 9. Validation record — 2026-09-18

- `npm run check`: passed; 139 files, 0 errors, 0 warnings, 0 hints.
- `npm run build`: passed; 31 static routes built and Pagefind indexed 36 HTML files / 9,989 words.
- `npm run check:graph`: passed; 22 topic nodes and 159 explained relationships.
- `npm run check:links`: passed; 36 generated pages, all internal routes and anchors resolve.
- `npm run verify`: passed; it reran all four checks above successfully.
- Additional static inspection: all eight pillar documents contain every view in no-JavaScript source order (64 total); generated Linux pages and the prototype contain no duplicate IDs; prototype inline JavaScript parses.
- Browser QA was unavailable because no Chromium, Playwright, Puppeteer, or equivalent browser runner is installed. Desktop rendering, 320 px, 200% zoom, keyboard-only behavior, touch emulation, reduced-motion emulation, disabled-JavaScript rendering, history navigation, contrast, and console-error checks remain unclaimed.
