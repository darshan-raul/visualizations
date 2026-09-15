# Infra Illustrated — Linux Foundation Visual System Specification

**Topic:** Linux foundations for cloud, DevOps, SRE, platform engineering, containers, and Kubernetes  
**Status:** Approval-ready architecture/specification draft v1.0  
**Artifact type:** One Linux foundation topic with one permanent hub page and eight pillar sub-pages  
**Target audience:** Learners who need strong Linux mental models before progressing into AWS, DevOps tooling, containers, and Kubernetes; also useful for working engineers who know commands but want to understand the system underneath them  
**Primary implementation target:** Existing Infra Illustrated project in Codex  
**Prototype companion:** `linux-foundation-visual-prototype.html`  
**Verified/updated:** 2026-09-12

**Console integration note (2026-09-15):** The confirmed [topic-console brief](../SITE-REBUILD-BRIEF.md#confirmed-topic-console-design-language) governs pillar-page presentation. The hub and eight routes below remain the Linux information architecture; each pillar's flat concept rail/tabs become a grouped disclosure index with one active canvas and right/bottom explanation. The suggested order remains optional, with all pillar routes freely available. Saved progress is not part of this static library. The implementation addendum and prototype live under `guide/topics/linux-foundation/`.

---

# 0. Executive intent

This specification defines the Linux foundation experience for **Infra Illustrated**.

The design must **not** attempt to teach all of Linux on one infinitely scrolling page and must **not** create eight unrelated top-level Linux pages that lose the sense of a single system.

Instead, implement Linux as a **hub-and-spoke learning system**:

- `/linux` is the permanent Linux homepage and orientation hub.
- The first and dominant visual on `/linux` is the **Linux Map**.
- The Linux Map contains eight clickable pillar nodes.
- Each pillar node opens its own dedicated **Linux sub-page**.
- Pillar visuals are never expanded inline on the Linux homepage.
- Every pillar page has a clear **Back to Linux Map** action.
- Learners may either explore freely from the map or follow a recommended sequence.
- The homepage contains a small amount of foundational material below the map: the Linux machine mental model, boot/runtime orientation, and the recommended learning sequence.
- Each pillar page is itself a substantial visual learning experience with a large primary canvas, progressive exploration, a persistent or reusable terminal interaction pattern, operational examples, misconceptions, failure paths, and explicit connections to cloud/container/Kubernetes concepts.

The overall product promise is:

> **One Linux machine, explored through eight lenses. Learn the primitives once; later recognize AWS, containers, and Kubernetes as compositions of those primitives.**

This is a foundational topic. The learner should leave with mental models, not merely a memorized command list.

---

# 1. Non-negotiable information architecture

## 1.1 Route model

Implement these routes (adapt to the project router if exact syntax differs):

```text
/linux
/linux/identity
/linux/storage
/linux/processes
/linux/networking
/linux/packages
/linux/shell
/linux/security
/linux/troubleshooting
```

The conceptual depth limit should normally stop here:

```text
LEVEL 1 — Linux hub
/linux

LEVEL 2 — Pillar page
/linux/networking

LEVEL 3 — Concepts inside the pillar page
Routing / DNS / sockets / firewall / namespaces / troubleshooting
```

Do **not** automatically turn every level-3 concept into routes such as:

```text
/linux/networking/routing/static-routes/metrics/...
```

Use in-page sections, progressive disclosures, focus states, labs, or drawers for level-3 concepts. Only create a deeper page later when the topic genuinely deserves a separate advanced deep dive.

## 1.2 Homepage vs pillar-page boundary

This boundary is strict.

### The Linux homepage `/linux` MUST contain

1. The Linux Map as the first useful visual.
2. A concise page promise/orientation.
3. Eight clickable pillar nodes.
4. A visible suggested learning order.
5. A lightweight “Meet the Linux Machine” foundation section below the map.
6. A concise kernel/userspace/hardware mental model.
7. A concise boot-to-running-system lifecycle.
8. Optional learner progress indicators.
9. Entry points to Git and SSH foundation siblings where the broader site navigation makes that appropriate.

### The Linux homepage `/linux` MUST NOT contain

- The complete Networking visual.
- The complete Storage visual.
- The complete Identity visual.
- Large terminal labs belonging to a pillar.
- Long command catalogs.
- Deep firewall, LVM, systemd, PAM, SELinux/AppArmor, namespaces, cgroups, etc. instruction.
- Eight full pillar chapters stacked below the map.

The homepage is a **map and orientation space**, not a compressed Linux textbook.

### A pillar page MUST contain

- Breadcrumb: `Linux > <Pillar>`.
- Prominent `← Back to Linux Map` control.
- Pillar title and one-sentence promise.
- A large hero visual specific to that pillar.
- A concept rail or concept map for that pillar.
- Progressive concept exploration.
- Representative real Linux commands and realistic output.
- At least one mechanics view (what the kernel/userspace/system actually does).
- At least one failure/troubleshooting state.
- At least one misconception correction where materially useful.
- Cross-pillar links where the current concept depends on another pillar.
- Previous/Next guided-navigation controls.
- “Why this matters later” connections to cloud/containers/Kubernetes/operations.

---

# 2. Page promise and narrative thesis

## 2.1 Page promise

By the time a learner has completed the Linux hub and its pillar sequence, they should be able to answer questions like:

1. Who is this process running as, and why can or cannot it access a resource?
2. Where does a file actually live—from pathname to filesystem to block device?
3. What is a process, how does it relate to a program, and how do systemd services manage processes?
4. How does a userspace process reach another host through a socket, route, firewall, and network interface?
5. How did software arrive on the machine, where did its files go, and which shared libraries or services does it depend on?
6. What is the shell doing when commands, pipes, redirections, variables, and exit codes are used?
7. How do Linux security mechanisms layer identity, permissions, privilege, MAC, capabilities, firewalling, and hardening?
8. When something is broken, what evidence should an operator inspect and in what order?
9. Which of these same primitives are later reused by EC2, EBS, containers, Kubernetes Pods, systemd-managed agents, CI/CD runners, and other infrastructure systems?

## 2.2 Visual thesis

Use the visual thesis:

> **The Linux machine as an explorable system.**

The hub shows one Linux machine surrounded by eight lenses. Each pillar page “zooms” into one subsystem while retaining visible relationships to the same machine.

Avoid generic dashboard aesthetics. The experience should feel like a **technical systems explorer**: layered diagrams, running state, inspection commands, cause/effect, and animated flow when movement matters.

## 2.3 Persistent conceptual object

Unlike Git or SSH, Linux does not have one single packet/request that naturally persists through every chapter. Use a persistent **reference machine** and a persistent **reference workload** instead.

Reference machine:

```text
Host: devbox-01
OS family: generic modern Linux (examples may show Ubuntu/Debian and RHEL-family variants where needed)
Primary user: learner
Example service: nginx (or a simple web service)
Primary interface: eth0
Example service port: TCP/443
Example data/config paths: /etc, /var/log, /home, /srv
```

The exact distro must not become the main teaching model. Mark distro-specific behavior explicitly.

Reference workload:

```text
A web service installed on the machine,
started by systemd,
running as a non-root service identity,
reading configuration from /etc,
writing logs,
listening on a socket,
and accepting network traffic.
```

This workload can reappear across pillars:

- Identity: which UID/GID runs it?
- Storage: where do config/data/log files live?
- Processes: which PID(s) exist and who is the parent?
- Networking: which socket/port/interface/route carries traffic?
- Packages: which package installed the binary and service unit?
- Shell: how does the operator inspect and automate it?
- Security: which permissions, capabilities, firewall/MAC constraints apply?
- Troubleshooting: why is it not reachable or not starting?

This produces continuity without forcing an artificial single-object story onto every Linux subsystem.

---

# 3. Linux Map — canonical homepage hero visual

## 3.1 Purpose

The map must immediately answer:

> “What are the major systems I need to understand in Linux, and where should I start?”

It is the canonical mental model and must remain recognizable across the project.

## 3.2 Required node set

Exactly these eight top-level pillar nodes are recommended for v1:

1. **Identity & Access**
2. **Filesystem & Storage**
3. **Processes & Services**
4. **Networking**
5. **Packages & Software**
6. **Shell & Automation**
7. **Security**
8. **Observability & Troubleshooting**

For route slugs use concise names:

```text
identity
storage
processes
networking
packages
shell
security
troubleshooting
```

## 3.3 Required map composition

Desktop conceptual layout:

```text
                              LINUX

                 Identity             Processes
                     \                   /
                      \                 /
     Storage ---------- LINUX MACHINE ---------- Networking
                      /                 \
                     /                   \
                 Packages              Security
                      \                 /
                       \               /
                       Shell & Automation
                              |
                    Observability & Troubleshooting
```

This ASCII layout is conceptual, not pixel-perfect. The implemented map may use a circular/radial graph, machine silhouette, kernel-core layout, or high-quality node network, but the relationships and hierarchy must remain obvious.

### Center node

Center node label:

```text
LINUX MACHINE
Kernel + Userspace
```

The center is not a ninth pillar. Selecting it should reveal or scroll to **Meet the Linux Machine** basics, not navigate to a separate `/linux/machine` page in v1.

### Node content

Each node should have:

- Pillar name.
- 3–5 tiny concept hints, not a full syllabus.
- Sequence number for guided mode.
- State indicator: not started / current / completed (if progress is implemented).
- Clear hover/focus treatment.
- Route destination.

Example Networking node hints:

```text
IP · routes · sockets · DNS · firewall
```

Example Storage node hints:

```text
files · mounts · partitions · filesystems · LVM
```

## 3.4 Map interactions

### Click/tap

Clicking a pillar node navigates to the dedicated route.

Example:

```text
Networking → /linux/networking
```

It does **not** expand the full Networking page in place.

### Hover/focus preview

Hover or keyboard focus may show a small preview panel:

- “What this answers”
- 4–6 major topics
- Approximate learning position
- CTA: `Explore Networking →`

Do not reveal the full pillar visual on hover.

### Guided mode

Optional but recommended control:

```text
Explore freely | Follow the path
```

In guided mode, draw or animate a subtle sequence through the eight numbered pillars. Do not lock the map; learners must still be able to jump freely.

### Progress

Progress is optional for the initial implementation, but the UI/state model should be designed so it can be added without redesign.

Potential states:

```text
○ Not started
◐ In progress
✓ Completed
```

Never rely on color alone.

When returning from a pillar, its node may be highlighted and the map may restore the previous viewport/scroll position.

## 3.5 Map accessibility

- Each node must be a real link or keyboard-operable control.
- Tab order should follow the recommended learning sequence.
- Use visible focus rings.
- Provide an accessible name that includes the pillar and destination intent, e.g. `Explore Linux Networking`.
- Connector animation must honor `prefers-reduced-motion`.
- The map must remain intelligible when animation is disabled.
- On mobile, replace a cramped radial graph with a compact stacked/journey layout if needed; do not shrink node text into illegibility.

---

# 4. Homepage foundation content below the map

The homepage may include **basics beneath the map**, but must stay intentionally concise.

## 4.1 Foundation visual A — Meet the Linux Machine

### Learner question

> “What am I actually looking at when I say ‘a Linux machine’?”

### Composition

Use three clear layers:

```text
┌────────────────────────────────────┐
│             USERSPACE              │
│ shell · nginx · sshd · cron · apps │
├────────────────────────────────────┤
│              KERNEL                │
│ process · memory · FS · net · I/O  │
├────────────────────────────────────┤
│             HARDWARE               │
│ CPU · RAM · disk · NIC · devices   │
└────────────────────────────────────┘
```

Required takeaway:

- Linux kernel is not the whole userspace distribution.
- Applications normally run in userspace and request kernel services through system calls/APIs.
- Hardware resources are mediated by the kernel and drivers.

Do not turn this into a kernel-internals chapter.

### Optional interaction

Click `nginx`, `file read`, or `network send` to show a short path into the kernel and back out.

## 4.2 Foundation visual B — From boot to a running system

### Learner question

> “How does the machine get from power-on to me having a shell and services?”

Use a simplified sequence:

```text
Firmware
  ↓
Bootloader
  ↓
Kernel + initramfs
  ↓
PID 1 / init system (commonly systemd)
  ↓
Services / targets
  ↓
Login / shell / applications
```

Important wording:

- “commonly systemd” rather than implying every Linux system uses systemd.
- Bootloader specifics differ by platform/distro.
- Containers may not run a traditional full boot sequence.

This sequence is orientation only. Detailed systemd and process behavior belongs under Processes & Services.

## 4.3 Foundation visual C — Filesystem orientation

Show a deliberately minimal hierarchy:

```text
/
├── etc
├── home
├── var
├── usr
├── run
├── tmp
├── proc
├── sys
└── dev
```

Only explain one-line purposes and clearly distinguish real disk-backed data from virtual/pseudo filesystems where appropriate.

Do not teach mount internals here; route to Storage.

## 4.4 Recommended learning journey

Show the path:

```text
1 Identity
   ↓
2 Filesystem & Storage
   ↓
3 Processes & Services
   ↓
4 Networking
   ↓
5 Packages & Software
   ↓
6 Shell & Automation
   ↓
7 Security
   ↓
8 Observability & Troubleshooting
```

Why this order:

- Identity comes first because actions and process permissions are always associated with credentials/UIDs/GIDs.
- Storage establishes paths and resources that processes interact with.
- Processes establishes runtime behavior.
- Networking then shows how processes communicate.
- Packages explains how software and service definitions arrive.
- Shell consolidates the operator interaction/automation model used throughout.
- Security recombines identity, filesystem, process, and networking primitives.
- Troubleshooting is the synthesis layer that uses evidence from all prior pillars.

Keep free navigation available at all times.

---

# 5. Shared pillar-page shell

All eight pillar pages should feel like parts of one Linux system, not eight different microsites.

## 5.1 Header

Required desktop pattern:

```text
Linux > Networking                                      [Back to Linux Map]

Linux Networking
How a process gets from a socket to another machine—and how to prove each step.
```

The `Back to Linux Map` action should be prominent and predictable.

If the application supports history correctly, a browser back button should also work; do not rely exclusively on history because the user might land directly on a pillar URL.

## 5.2 Pillar concept rail

Each page has a compact rail, tabs, or step list of concepts. Example Networking:

```text
Interfaces | Addressing | Routes | Neighbours | DNS | Sockets | TCP/UDP | Firewall | Namespaces | Diagnose
```

This rail changes in-page focus. It does not create a new top-level page for every concept.

## 5.3 Hero canvas

Each pillar has one dominant mental model that can grow progressively as concepts are selected.

Do not use a grid of unrelated “definition cards” as the primary teaching surface.

## 5.4 Terminal drawer / command inspector

A terminal-style region should be available consistently across pillar pages.

Recommended behavior:

- Desktop: docked under or beside the main visual.
- Mobile: collapsible drawer below the active concept.
- Selecting a visual object reveals relevant inspection commands.
- Running a simulated command updates at least one other visual area.
- Terminal output should be realistic but deterministic.
- Commands that differ by distribution/toolchain must be labelled.

Examples:

```text
Identity        id, whoami, groups, getent
Storage         lsblk, findmnt, df, du, stat
Processes       ps, pstree, systemctl, kill
Networking      ip, ss, dig/getent, ping, curl
Packages        apt/dpkg or dnf/rpm
Shell           bash/sh syntax, env, redirection, pipes
Security        sudo, getcap, ls -Z where supported, aa-status where supported
Troubleshooting journalctl, dmesg, lsof, strace, free, vmstat, iostat where installed
```

Do not imply every utility is preinstalled on every distribution.

## 5.5 Cross-pillar links

Each page must be allowed to say “this concept depends on another pillar.”

Example:

```text
nginx process
├── Who runs this? → Identity
├── Where is its config? → Storage
├── Who starts it? → Processes
├── What is it listening on? → Networking
├── How was it installed? → Packages
├── What confines it? → Security
└── Why is it failing? → Troubleshooting
```

Cross-pillar links should preserve the sense that the same machine is being explored through different lenses.

## 5.6 Previous/next navigation

Every pillar page ends with:

```text
← Previous: <pillar>          Back to Linux Map          Next: <pillar> →
```

Recommended sequence:

```text
Identity → Storage → Processes → Networking → Packages → Shell → Security → Troubleshooting
```

On Identity, previous can be `Linux Basics` (the hub). On Troubleshooting, next can be `Foundation complete` with links to SSH, Git, containers, Kubernetes, or AWS foundation tracks.

---

# 6. Pillar 1 — Identity & Access

**Route:** `/linux/identity`  
**Core learner question:** “Who am I, who is this process, and why can it access this resource?”  
**Visual thesis:** Identity flows from account records into process credentials and then into permission checks.

## 6.1 Hero mental model

```text
Username
learner
   ↓ resolve
UID 1000
   ↓
Primary GID + supplementary groups
   ↓
Process credentials
   ↓
Kernel permission checks
   ↓
Files / devices / sockets / privileged operations
```

Use the reference service alongside the human user:

```text
nginx user → UID → process → config/log/socket access
```

## 6.2 Required concept sequence

1. Usernames vs numeric UIDs.
2. Groups, primary GID, supplementary groups.
3. `/etc/passwd` and account lookup concept.
4. Password/authentication material and `/etc/shadow` at a safe conceptual level.
5. Process real/effective/saved IDs at an overview level where appropriate.
6. Ownership of files and processes.
7. Permission bits: user/group/other.
8. Directory permission semantics (`r`, `w`, `x` are not identical to file semantics).
9. `sudo` vs `su` conceptual difference.
10. Service accounts/system users.
11. PAM as an authentication/account/session framework; do not overexpand internals.
12. Root/superuser and the danger of using UID 0 as a default.
13. Optional advanced bridge: Linux capabilities as a more granular privilege model; full treatment belongs in Security.

## 6.3 Representative terminal interactions

```text
whoami
id
groups
getent passwd learner
getent group <group>
ls -l <path>
stat <path>
sudo -l
ps -o user,uid,group,gid,pid,ppid,cmd -p <pid>
```

## 6.4 Misconceptions to correct

- A username is not the kernel’s primary identity token; numeric IDs matter.
- Being able to read a directory is not the same as being able to traverse it.
- `sudo` and `su` are not interchangeable mechanisms.
- A process runs with credentials; permissions are not merely attributes attached to a shell command.
- `root` is not a normal recommendation for fixing permission problems.

## 6.5 Failure lab

Scenario:

```text
nginx cannot read /srv/site/index.html
```

Progressively inspect:

1. nginx UID/GID.
2. path ownership.
3. directory traversal permissions.
4. file permissions.
5. ACL/MAC pointer if applicable.

Output should identify the first blocking layer rather than displaying a generic `permission denied` card.

## 6.6 Cloud/container/Kubernetes bridges

- EC2 login user vs service user.
- Container UID/GID and host filesystem permissions.
- Kubernetes `runAsUser`, `runAsGroup`, `fsGroup` as future applications of Linux identity primitives.
- SSH authentication leads to a Linux user/session; SSH is a sibling foundation topic rather than a replacement for Linux identity.

---

# 7. Pillar 2 — Filesystem & Storage

**Route:** `/linux/storage`  
**Core learner question:** “Where does data live, and how does a pathname become bytes on a device?”  
**Visual thesis:** Trace a file downward from pathname to mount to filesystem to block device.

## 7.1 Hero mental model

```text
/srv/app/data.db
      ↓ path lookup
Directory tree / VFS
      ↓
Mount point
      ↓
Filesystem (ext4/xfs/...)
      ↓
Partition / LVM logical volume (when used)
      ↓
Block device
      ↓
Physical / virtual storage
```

## 7.2 Required concept sequence

1. Paths: absolute, relative, current working directory.
2. Files vs directories.
3. Inodes conceptually; filename/directory entry vs file object.
4. Hard links vs symbolic links.
5. Filesystem hierarchy orientation.
6. Block devices and device nodes.
7. Partitioning concept.
8. Filesystem creation concept; warn that formatting is destructive.
9. Mounts and mount points.
10. `/etc/fstab` persistence concept.
11. `df` vs `du` and why they can disagree.
12. Inode exhaustion vs block-space exhaustion.
13. LVM: PV → VG → LV, at an operational mental-model level.
14. Filesystem growth at a conceptual level; distinguish underlying block device growth from filesystem growth.
15. `/proc`, `/sys`, `/dev`, `/run` as special/virtual/runtime filesystems or namespaces of objects—not normal persistent disk directories.
16. File descriptors as a bridge to Processes.

## 7.3 Representative commands

```text
pwd
ls -la
stat
readlink
findmnt
mount
lsblk
blkid
df -h
df -i
du -sh
find
lsof <path>     # when available
```

LVM commands can appear in an advanced drawer:

```text
pvs
vgs
lvs
```

## 7.4 Failure labs

A. Disk is “full” but `du` does not explain it:

- deleted-open file possibility;
- reserved/metadata differences;
- mounted-over directory possibility;
- do not overpromise a single cause.

B. Mount missing after reboot:

- inspect block device identity;
- inspect `fstab`;
- inspect mount state/logs.

C. Inode exhaustion:

- `df -h` may show space while `df -i` reveals no free inodes.

## 7.5 Misconceptions

- A directory is not merely a visual folder abstraction; it maps names to filesystem objects.
- Deleting a pathname is not necessarily the same instant as freeing storage if a process still has the file open.
- `df` and `du` measure different things.
- A partition, filesystem, mount point, and directory are not synonyms.
- Extending an EBS volume is not the same as automatically extending a Linux filesystem in all cases.

## 7.6 Bridges

- AWS EBS → Linux block device → partition/LVM → filesystem → mount.
- Kubernetes volumes → mounted filesystems inside containers/Pods.
- Container layers/overlay filesystems as a future deep dive.

---

# 8. Pillar 3 — Processes & Services

**Route:** `/linux/processes`  
**Core learner question:** “What is actually running, how did it start, and how is it controlled?”  
**Visual thesis:** Grow a live process tree from PID 1 and connect programs, processes, file descriptors, signals, cgroups, and services.

## 8.1 Hero mental model

```text
PID 1 (init/system manager)
   |
   +-- sshd
   |    `-- ssh session
   |         `-- shell
   |              `-- command
   |
   +-- nginx master
   |    +-- worker
   |    `-- worker
   |
   `-- other services
```

## 8.2 Required concept sequence

1. Program vs process.
2. PID and PPID.
3. Process tree / parent-child relationship.
4. Process lifecycle and exit status.
5. Foreground/background/jobs as shell-facing behavior.
6. Signals: TERM, KILL, HUP, INT conceptually; do not teach `kill -9` as first choice.
7. Environment and working directory.
8. Open file descriptors.
9. Process state overview (running/sleeping/stopped/zombie) without drowning in scheduler internals.
10. `/proc/<pid>` as process inspection surface.
11. systemd unit/service concepts: unit file, enable vs start, dependency, restart policy, journal.
12. Daemon concept.
13. Timers and cron as scheduled execution; Shell pillar may go deeper into automation.
14. cgroups as resource-accounting/control primitive and bridge to containers/Kubernetes.
15. Namespaces as isolation primitive at a high level; detailed network namespace treatment lives in Networking.

## 8.3 Commands

```text
ps aux
ps -ef
pstree
pgrep
pidof
top
kill
jobs
fg
bg
systemctl status <service>
systemctl start|stop|restart <service>
systemctl enable|disable <service>
journalctl -u <service>
cat /proc/<pid>/status
ls -l /proc/<pid>/fd
```

## 8.4 Required interaction

Click a process in the tree and update an inspector with:

- PID/PPID.
- user/UID.
- state.
- executable.
- command line.
- working directory.
- selected open FDs.
- cgroup path (advanced).
- owning systemd unit where applicable.

Selecting `Send SIGTERM` should show graceful shutdown behavior; selecting `SIGKILL` should explain that the process cannot handle/catch it and why it is a last-resort control.

## 8.5 Failure lab

Service fails to start:

```text
systemctl status
journalctl -u
process absent
socket absent
config/permission dependency hint
```

The lab must demonstrate that `systemctl failed` is a state to investigate, not an explanation.

## 8.6 Bridges

- ECS/containers run Linux processes.
- Kubernetes Pods ultimately contain processes isolated/accounted with Linux primitives.
- systemd-managed agents on cloud VMs.
- OOM/resource constraints connect to cgroups and Troubleshooting.

---

# 9. Pillar 4 — Networking

**Route:** `/linux/networking`  
**Core learner question:** “How does a process communicate from a socket through the kernel and onto a network?”  
**Visual thesis:** One flow moves from process → socket → protocol → routing/firewall → interface → network.

## 9.1 Hero flow

```text
Application / process
      ↓ socket API
Socket :443
      ↓
TCP / UDP
      ↓
IP
      ↓
Routing decision
      ↓
Firewall / netfilter path
      ↓
Neighbour resolution / L2 where relevant
      ↓
Network interface (eth0)
      ↓
LAN / gateway / remote destination
```

Use both inbound and outbound modes.

## 9.2 Concept sequence

1. Network interface.
2. MAC/L2 orientation where useful.
3. IPv4/IPv6 address and prefix.
4. Local/loopback addresses.
5. Routing table and default route.
6. Neighbour/ARP/ND concept.
7. DNS resolution and resolver behavior at a useful overview level.
8. Port and socket.
9. Listening vs established socket.
10. TCP vs UDP at the level needed for infrastructure engineers.
11. Bind addresses: loopback vs specific address vs wildcard.
12. Firewall/netfilter mental model; distinguish packet filtering/NAT from application listeners.
13. iptables vs nftables as tooling/framework evolution; do not imply one command surface is universal.
14. NAT/conntrack overview when appropriate.
15. Network namespaces and veth as the bridge to containers/Kubernetes.
16. Troubleshooting packet path.

## 9.3 Commands

```text
ip addr
ip link
ip route
ip neigh
ss -lntup
getent hosts <name>
dig <name>       # if installed
resolvectl       # where systemd-resolved is used
ping
tracepath/traceroute  # tool availability varies
curl
nc                # if installed
nft list ruleset  # where nftables is in use
iptables -S       # where legacy/compat tooling is relevant
```

## 9.4 Hero interactions

A. **Outbound packet/connection step-through**

Select destination and advance through:

```text
resolve name → select destination IP → route lookup → source/interface → firewall → neighbour/gateway → transmit
```

B. **Listener lab**

Toggle service binding:

```text
127.0.0.1:8080
0.0.0.0:8080
[::]:8080
```

Show which sources can potentially reach it, while clearly noting firewall/routing/security controls can still block access.

C. **Failure injection**

Toggle:

- DNS failure.
- no route/default route missing.
- local firewall drop/reject.
- service not listening.
- service only bound to loopback.

The visual must identify the layer at which failure occurs.

## 9.5 Misconceptions

- An open firewall rule does not make a port exist; a process must listen.
- A listening process does not guarantee remote reachability.
- DNS resolution and packet forwarding are different stages.
- `0.0.0.0` as a bind address is not a destination IP a client normally connects to.
- `127.0.0.1` is local to a network namespace, not “the server’s public IP.”
- Containers/Kubernetes networking is built on Linux network primitives; it is not a completely separate networking universe.

## 9.6 Bridges

- EC2 ENI and Linux network interface.
- Security groups/NACLs live outside the guest and should be contrasted with the Linux firewall.
- Container network namespaces and veth pairs.
- Kubernetes Pod networking.
- Load balancer target reachability depends on listeners, routes, local firewall, and service health.

---

# 10. Pillar 5 — Packages & Software

**Route:** `/linux/packages`  
**Core learner question:** “How does software get onto the machine, what files are installed, and what does the package manager actually track?”  
**Visual thesis:** Repository metadata resolves a package and dependencies into installed files, configuration, binaries, libraries, and service definitions.

## 10.1 Hero flow

```text
Configured repositories
      ↓ metadata
Package manager
      ↓ dependency resolution
Package artifacts
      ↓ install transaction
Files placed on filesystem
      +-- binaries
      +-- libraries
      +-- config
      +-- docs
      `-- service/unit metadata
      ↓
Software can be executed / service started
```

## 10.2 Required concept sequence

1. Package vs executable/program.
2. Package manager vs low-level package format/tool.
3. Repository metadata.
4. Dependency resolution.
5. Debian family: apt + dpkg conceptual relationship.
6. RHEL family: dnf/yum + rpm conceptual relationship.
7. Installed-file ownership by package.
8. Config files and package upgrades at a high level.
9. Shared libraries and dynamic linker concept.
10. `$PATH` search and executable location.
11. Version pinning/holding at a conceptual level.
12. Security updates/patching.
13. Third-party repositories and supply-chain risk.
14. Source builds/manual binaries as “outside normal package-manager ownership.”
15. Snap/Flatpak/containerized packaging only as optional contextual comparison, not core server-operations flow.

## 10.3 Commands

Debian/Ubuntu examples:

```text
apt update
apt install <pkg>
apt-cache policy <pkg>
dpkg -L <pkg>
dpkg -S <path>
```

RHEL-family examples:

```text
dnf install <pkg>
dnf info <pkg>
rpm -ql <pkg>
rpm -qf <path>
```

Cross-distro:

```text
command -v <cmd>
which <cmd>      # explain portability/behavior caveat if used
ldd <binary>     # with safe explanatory context
```

## 10.4 Failure lab

“Command installed but service does not start” or “package dependency conflict.”

Separate these states:

- repository/package availability;
- package installation succeeds/fails;
- binary exists;
- configuration valid/invalid;
- runtime service state.

## 10.5 Misconceptions

- Installing a package is not the same as starting/enabling its service.
- Removing a binary manually is not equivalent to a clean package uninstall.
- `apt` and `dpkg` (or `dnf` and `rpm`) operate at different abstraction levels.
- `$PATH` determines command lookup but does not describe package ownership.

## 10.6 Bridges

- AMI/VM image patching.
- Configuration management.
- Container image builds and package-layer hygiene.
- Supply-chain controls and repository governance.

---

# 11. Pillar 6 — Shell & Automation

**Route:** `/linux/shell`  
**Core learner question:** “What does the shell do between what I type and what the operating system executes?”  
**Visual thesis:** Parse a command line into expansion, redirection, pipelines, processes, file descriptors, and exit status.

## 11.1 Hero example

Use an operator-friendly command such as:

```bash
journalctl -u nginx --since today | grep -i error > /tmp/nginx-errors.txt
```

Animate/step through:

```text
Shell reads input
  ↓
lexing/parsing
  ↓
expansions/quoting
  ↓
redirections/pipes prepared
  ↓
commands executed as processes/builtins
  ↓
stdout/stderr flow
  ↓
exit status returned
```

## 11.2 Required concept sequence

1. Shell vs terminal vs console.
2. Command + arguments.
3. Builtin vs external executable.
4. Environment variables vs shell variables.
5. `$PATH` lookup.
6. Quoting: single, double, escaping.
7. Globbing.
8. Command substitution.
9. stdin/stdout/stderr and file descriptors 0/1/2.
10. Redirection.
11. Pipes.
12. Exit status / `$?`.
13. `&&`, `||`, `;` control behavior.
14. Shell scripts and shebang.
15. functions and parameters at a practical level.
16. `set -euo pipefail` with caveats; do not present as magic safety.
17. `grep`, `sed`, `awk`, `find`, `xargs` as compositional tools without trying to teach every syntax detail.
18. cron/systemd timers as automation schedulers; link to Processes for service lifecycle.
19. idempotence and repeatability as bridge to DevOps automation.

## 11.3 Interactive shell pipeline lab

Let the learner toggle:

- stdout redirected or not;
- stderr merged (`2>&1`) or separate;
- `grep` finds/no finds;
- first command succeeds/fails;
- `pipefail` on/off.

Update exit status and data flow visually.

## 11.4 Misconceptions

- Terminal and shell are not the same thing.
- A pipe normally connects stdout of one command to stdin of another; it does not automatically include stderr.
- Quotes change parsing/expansion semantics.
- `$?` represents the last command/pipeline status according to shell semantics, not a universal application-health flag.
- `set -e` has nuanced behavior and does not replace explicit error handling.

## 11.5 Bridges

- EC2 user data/bootstrap scripts.
- CI/CD job shells.
- Dockerfile `RUN` shell behavior.
- Kubernetes init/container command/args behavior.
- Automation evolution toward Ansible, Terraform/OpenTofu, task runners, and scripting languages.

---

# 12. Pillar 7 — Security

**Route:** `/linux/security`  
**Core learner question:** “Which layers protect a Linux system, and what happens when one layer allows something but another blocks it?”  
**Visual thesis:** Defense-in-depth rings around processes/resources, built from primitives already learned.

## 12.1 Security synthesis map

```text
Identity
  ↓
DAC permissions / ownership / ACLs
  ↓
Privilege / sudo / capabilities
  ↓
Process & service isolation
  ↓
MAC (SELinux/AppArmor where applicable)
  ↓
Network firewall
  ↓
Kernel/system hardening
  ↓
Audit/logging/patching
```

The visual must explicitly show that different distributions may ship different MAC systems and firewall defaults.

## 12.2 Required concept sequence

1. Least privilege.
2. Root and privilege boundaries.
3. File ownership/mode review (recap, not duplicate full Identity lesson).
4. sudo policy concept.
5. Linux capabilities.
6. setuid/setgid risk at a conceptual level.
7. POSIX ACLs overview.
8. SELinux vs AppArmor orientation; do not imply both operate identically.
9. Firewall and exposed services.
10. SSH hardening handoff to the separate SSH foundation visual.
11. Kernel/sysctl hardening orientation.
12. Patch/package hygiene.
13. Secrets and file permissions.
14. Audit trail orientation (`auditd`, journald/logging depending environment).
15. Service hardening/systemd sandboxing concepts as advanced expandable content.
16. Namespaces/cgroups are isolation/resource primitives, not complete security boundaries by themselves.

## 12.3 Required decision lab

Scenario:

```text
Can nginx read /srv/secret/config?
```

Show layered checks:

- process UID/GID;
- DAC mode/ACL;
- capability relevance if any;
- MAC policy if enabled;
- mount/filesystem flags where relevant;

Do not manufacture a universal fixed ordering where actual kernel behavior is more nuanced. Use the lab to teach “multiple independent controls can deny access.”

## 12.4 Misconceptions

- `chmod 777` is not a valid general fix.
- Running as root is not a valid general fix.
- A firewall does not replace application/service hardening.
- Disabled SELinux/AppArmor is not a security troubleshooting strategy.
- Namespaces alone are not a complete container security model.

## 12.5 Bridges

- EC2 hardening.
- Container least privilege/capabilities/read-only filesystems.
- Kubernetes securityContext and Pod Security.
- SIEM/audit pipelines.
- SSH hardening links directly to the separate SSH visual.

---

# 13. Pillar 8 — Observability & Troubleshooting

**Route:** `/linux/troubleshooting`  
**Core learner question:** “The system is broken. What evidence do I collect, in what order, and how do I localize the failure?”  
**Visual thesis:** A hypothesis-driven diagnostic board that traverses the same machine learned in earlier pillars.

This is the synthesis pillar and should feel like a practical challenge rather than another catalog.

## 13.1 Primary incident scenario

Default incident:

```text
“The web service is not reachable.”
```

Diagnostic path:

```text
Is DNS resolving?
      ↓
Can the host be reached / route selected?
      ↓
Is the process running?
      ↓
Is the expected socket listening on the expected address/port?
      ↓
Is local firewalling blocking the path?
      ↓
Is application health/configuration failing?
      ↓
What do logs/journal say?
      ↓
Are CPU/memory/disk/file-descriptor/resource limits involved?
```

Do not enforce this exact order for all incidents; explain that troubleshooting is evidence-driven and scenario-specific.

## 13.2 Evidence domains

1. Service state.
2. Process state.
3. Logs/journal.
4. CPU/load.
5. Memory/swap/OOM.
6. Disk space/inodes/I/O.
7. Network interfaces/routes/DNS/sockets.
8. File descriptors.
9. Kernel messages.
10. System calls with `strace` where appropriate.
11. Open files/sockets with `lsof` where available.
12. Metrics/history tools when installed.

## 13.3 Commands

```text
systemctl status
journalctl
ps
top
uptime
free
vmstat
df -h
df -i
du
lsblk
ip addr
ip route
ss -lntp
getent hosts
dmesg
lsof
strace
```

Clearly label which tools are core vs commonly installed but not guaranteed.

## 13.4 Failure scenarios

At minimum support selectable scenarios:

1. Service stopped/crashed.
2. Port bound only to loopback.
3. Local firewall blocks traffic.
4. DNS wrong/unavailable.
5. Disk full.
6. Inodes full.
7. OOM kill / memory pressure.
8. Permission denied reading config.

Each scenario should change evidence consistently across:

- diagram;
- terminal output;
- status panel;
- recommended next probe.

## 13.5 Misconceptions

- Rebooting is not a root-cause analysis method.
- A successful ping does not prove the application is healthy.
- A process existing does not prove a service is reachable.
- High load average does not map directly to CPU percentage in every situation.
- “Disk full” can mean blocks, inodes, quotas, or open-deleted files depending on evidence.
- Logs are evidence, not always the root cause by themselves.

## 13.6 Completion bridge

At the end, show:

```text
Linux foundation complete

You now have primitives used by:
SSH
Git
Docker / containers
Kubernetes
AWS compute/network/storage
Observability agents
CI/CD runners
Configuration management
```

Git and SSH remain sibling foundational visuals; containers/Kubernetes/AWS are the next abstraction layers.

---

# 14. Cross-pillar relationship model

The map is not merely navigation. Pillars must explicitly refer to each other.

Use the reference web service as a cross-pillar object:

| Question | Pillar |
| --- | --- |
| Who runs nginx? | Identity |
| Where is `/etc/nginx/nginx.conf`? | Storage |
| Which PID exists and who started it? | Processes |
| Which address/port is it listening on? | Networking |
| Which package installed `/usr/sbin/nginx`? | Packages |
| How do I compose inspection commands? | Shell |
| Which controls allow/deny access? | Security |
| Why is it failing now? | Troubleshooting |

When practical, context links should carry a small semantic parameter/state so the destination pillar can focus the related concept. Example:

```text
/linux/networking?focus=socket&ref=nginx
```

This is optional in v1 implementation, but design components so it can be added later.

---

# 15. Concept → kernel/system representation → command → configuration → failure pattern

Use this pattern repeatedly inside pillar pages where it fits:

```text
CONCEPT
What is it?

SYSTEM REPRESENTATION
What object/state does Linux actually maintain?

INSPECT
Which command proves the state?

CONFIGURE
Where/how is it changed?

FAILURE
What breaks and what evidence proves the layer?
```

Example — routing:

```text
Concept       Where should this packet go?
Kernel state  Routing table
Inspect       ip route
Configure     ip route / distro network config
Failure       Missing/wrong route, gateway, source, policy route, etc.
```

Example — identity:

```text
Concept       Which credentials does this process have?
Kernel state  UID/GID/groups/capabilities
Inspect       id / ps / /proc
Configure     account/group/sudo/service config
Failure       EACCES/permission denial or failed privilege transition
```

This should become a recognizable Infra Illustrated Linux teaching grammar.

---

# 16. Command-quality rules

1. Commands are teaching instruments, not decorative snippets.
2. Every command should answer a visible question.
3. Use modern preferred command families where appropriate (`ip`, `ss`, `findmnt`) while optionally explaining legacy equivalents (`ifconfig`, `netstat`) in a “you may still see this” note.
4. Do not imply optional tools (`dig`, `lsof`, `strace`, `iostat`, `traceroute`) are installed everywhere.
5. Label Debian/Ubuntu vs RHEL-family package commands.
6. Never encourage destructive storage or security commands without safe simulation and explicit warning.
7. Avoid copy/paste recipes that hide the mental model.
8. Terminal output should be realistic, deterministic, and correlated with the active diagram.
9. At least one visual area besides the terminal should update when a simulated command changes state.
10. Provide a reset control for each stateful lab.

---

# 17. Misconception inventory across the whole Linux system

Place these corrections contextually rather than in one wall of text.

1. **Linux = Ubuntu** → Linux is the kernel/ecosystem; distributions package userspace/tooling/configuration differently.
2. **Username is the identity** → kernel permission checks fundamentally use numeric credentials such as UID/GID, with richer credential state.
3. **File path = file data** → path lookup, directory entries, inodes/filesystem objects, mounts, and underlying storage are different layers.
4. **Program = process** → executable/program is not the same thing as a running process instance.
5. **Port belongs to the firewall** → sockets are created by processes; firewall policy only filters/rewrites traffic paths.
6. **Package installed = service running** → installation, configuration, enabling, starting, and healthy runtime are separate states.
7. **Terminal = shell** → terminal UI and command interpreter are distinct.
8. **root fixes permissions** → root bypass/escalation hides design errors and increases risk.
9. **container networking is magic** → namespaces, veth, routes, firewall/NAT/eBPF mechanisms build on Linux primitives.
10. **reboot fixes Linux** → reboot may clear state but does not identify root cause.

---

# 18. Visual language and semantic tokens

The existing Infra Illustrated design system should take precedence. If implementing standalone, use semantic tokens similar to:

```css
:root {
  --page-bg: #06111d;
  --surface: #091725;
  --surface-raised: #0d2032;
  --border: #29445e;
  --border-soft: #17324a;
  --text: #eef6ff;
  --muted: #91a8be;

  --identity: #55adff;
  --storage: #f5b940;
  --process: #2df0a1;
  --network: #54d7d3;
  --package: #ae82ff;
  --shell: #80b7ff;
  --security: #ff8f66;
  --observe: #d4a9ff;

  --success: #2df0a1;
  --warning: #f5b940;
  --failure: #ff5f6d;
  --kernel: #54d7d3;
  --userspace: #55adff;
  --hardware: #9aa9b8;
}
```

Do not communicate state through color alone. Every state should include text/icon/line-style changes.

## 18.1 Diagram grammar

- Solid arrow: runtime flow or direct relationship.
- Dashed arrow: configuration/ownership/dependency relationship.
- Animated pulse: active packet/process/data/action; animation is supportive, not required for comprehension.
- Outer frame: scope such as userspace, kernel, filesystem, namespace, or machine.
- Numbered badge: guided sequence.
- Red cut/stop marker: failure at this exact layer.
- Magnifier/inspection marker: command can inspect this object.
- Config-file marker: persistent configuration source.
- Terminal prompt marker: operator action.
- Dotted cross-link: conceptual relationship to another pillar.

---

# 19. Animation rules

Animation is encouraged when it demonstrates mechanics.

Good uses:

- Flow of a packet through networking layers.
- Process appearing under a parent after execution.
- File path resolving down to mount/filesystem/device.
- Shell pipeline data moving between file descriptors.
- Permission check halting at a blocking layer.
- Troubleshooting probe illuminating the next piece of evidence.

Bad uses:

- Continuous decorative node floating.
- Excessive particle effects.
- Pulses that imply traffic where none is being discussed.
- Animating all eight homepage nodes simultaneously.

All animation must honor `prefers-reduced-motion`.

---

# 20. Responsive behavior

## 20.1 Desktop

- Linux map can be radial/networked.
- Pillar pages may use split layouts: visual 60–70%, terminal/inspector 30–40% where useful.
- Sticky breadcrumb/back-to-map may be used carefully.
- Concept rail may remain horizontal or vertical depending pillar.

## 20.2 Tablet

- Reduce connector density.
- Preserve large touch targets.
- Terminal moves beneath canvas when horizontal space becomes cramped.
- Concept rail may become horizontally scrollable.

## 20.3 Mobile

The requirement is comprehension, not visual fidelity to desktop.

- Homepage map should become a vertical journey/stack of connected nodes if radial map becomes unreadable.
- Center “Linux Machine” remains visible as the anchor.
- Nodes are full-width touch targets.
- Pillar concept rail becomes a scrollable chip/step bar or accordion.
- Terminal becomes full-width below the active visual, optionally collapsible.
- No page-level horizontal scroll.
- Minimum comfortable touch target around 44px.
- Avoid tiny SVG text; use HTML labels where practical.

---

# 21. Accessibility requirements

1. All navigation nodes are semantic links/buttons.
2. Full keyboard navigation.
3. Visible focus state.
4. `aria-current` for active route/concept where appropriate.
5. Dynamic terminal/result panels use suitable live regions only when they need announcement; avoid noisy re-announcement of entire diagrams.
6. Color is never the sole state signal.
7. Reduced-motion mode.
8. Meaningful diagram labels in DOM, not baked only into inaccessible canvas pixels.
9. SVGs need titles/descriptions or equivalent adjacent text.
10. Maintain adequate contrast.
11. Route transitions should focus the new page heading or otherwise preserve accessible navigation context.

---

# 22. State and persistence

Recommended client-side learning state (adapt to project conventions):

```ts
type LinuxProgress = {
  completedPillars: string[];
  inProgressPillar?: string;
  lastVisitedPillar?: string;
  lastConceptByPillar?: Record<string, string>;
  guidedMode?: boolean;
};
```

Storage can initially be local/browser state. Do not require authentication just to retain progress unless the broader project already has user accounts.

Progress should never block free exploration.

---

# 23. Source and technical-accuracy strategy

Linux behavior varies by kernel version, userspace, init system, distribution, network stack configuration, filesystem, and installed tools. The visual must distinguish:

- Linux kernel primitives.
- Common GNU/Linux userspace conventions.
- systemd-specific behavior.
- Debian/Ubuntu-specific package tooling.
- RHEL-family package tooling.
- optional tooling.

Primary references to use during implementation/review:

- Linux kernel documentation: https://docs.kernel.org/
- Linux kernel `/proc` documentation: https://docs.kernel.org/filesystems/proc.html
- Linux kernel namespaces/admin documentation: https://docs.kernel.org/admin-guide/namespaces/
- Linux man-pages project: https://www.kernel.org/doc/man-pages/
- iproute2 upstream/source/manual references: https://git.kernel.org/pub/scm/network/iproute2/iproute2.git/
- GNU Coreutils manual: https://www.gnu.org/software/coreutils/manual/coreutils.html
- GNU Bash manual: https://www.gnu.org/software/bash/manual/
- systemd manuals: https://www.freedesktop.org/software/systemd/man/latest/
- util-linux documentation/man pages for mount/findmnt/lsblk: https://www.kernel.org/pub/linux/utils/util-linux/
- nftables documentation: https://wiki.nftables.org/ (cross-check implementation details with upstream/man pages)
- SELinux project / distribution documentation where SELinux behavior is taught.
- AppArmor upstream/distribution documentation where AppArmor behavior is taught.

Do not freeze a distro-specific default into a universal statement.

---

# 24. Implementation component model

Suggested reusable components; names may be adapted to existing project conventions.

```text
LinuxHubPage
├── LinuxMap
│   ├── LinuxMachineCore
│   ├── PillarNode × 8
│   ├── SequenceConnector
│   └── PillarPreview
├── LinuxMachineBasics
├── BootLifecycle
├── FilesystemOrientation
└── GuidedJourney

LinuxPillarLayout
├── LinuxBreadcrumb
├── BackToLinuxMap
├── PillarHeader
├── ConceptRail
├── PillarHeroCanvas
├── InspectorPanel
├── TerminalDrawer
├── MisconceptionCallout
├── FailureLab
├── CrossPillarLinks
└── PillarPager
```

Optional state-oriented primitives:

```text
FlowArrow
BoundaryFrame
ProcessNode
FileNode
SocketNode
BlockDeviceNode
PermissionGate
FailureMarker
CommandChip
StateInspector
```

Avoid eight copies of slightly different one-off components when a shared interaction grammar fits.

---

# 25. Homepage detailed acceptance criteria

The Linux homepage is accepted only when:

- [ ] The map is the first major visual.
- [ ] All eight pillars are visible without reading a long intro first.
- [ ] Every pillar node navigates to its dedicated route.
- [ ] No pillar's large visual is rendered inline on the homepage.
- [ ] Center Linux Machine node explains/links to basics, not a ninth pillar route.
- [ ] Free exploration and recommended sequence are both obvious.
- [ ] Basics below the map remain concise.
- [ ] The route can be bookmarked directly.
- [ ] Back navigation from pillar returns to the map reliably.
- [ ] Mobile uses an understandable alternative to a cramped radial graph.
- [ ] Keyboard navigation works.
- [ ] Reduced-motion behavior works.

---

# 26. Pillar-page acceptance criteria

Every pillar is accepted only when:

- [ ] Direct route loads independently.
- [ ] `Linux > Pillar` breadcrumb is present.
- [ ] `Back to Linux Map` is present.
- [ ] One dominant mental model is visible near the top.
- [ ] Concept rail has a clear order.
- [ ] Commands correlate with the active visual state.
- [ ] At least one mechanics view exists.
- [ ] At least one failure state exists.
- [ ] At least one production/cloud/container/Kubernetes bridge exists.
- [ ] Misconceptions are corrected in context.
- [ ] Previous/Next guided navigation exists.
- [ ] Mobile layout remains usable.
- [ ] No generic definition-card wall replaces the actual visual.

---

# 27. Prototype scope vs production scope

The companion HTML prototype is intentionally a **navigation and interaction proof**, not eight completed production pillar experiences.

It must demonstrate:

1. Permanent Linux homepage.
2. Clickable eight-node Linux Map.
3. Guided/free mode.
4. `Back to Linux Map` behavior.
5. Dedicated route-like pillar views that replace the homepage rather than appearing below it.
6. Pillar breadcrumb.
7. Concept rail.
8. Representative interactive mental model for at least Networking.
9. Terminal/inspection response.
10. Previous/Next pillar navigation.
11. Responsive behavior.
12. Reduced-motion support.

The production Codex implementation should use this specification, existing project components, and established design tokens rather than treating the standalone HTML as the final code architecture.

---

# 28. Explicit non-goals for v1

Do not allow the first implementation to balloon into these areas:

- Kernel compilation/development.
- Device-driver development.
- Advanced scheduler internals.
- eBPF programming deep dive.
- Complete systemd reference.
- Complete SELinux policy authoring.
- Complete AppArmor policy authoring.
- Full LVM administration course.
- Filesystem repair/recovery internals.
- Bash language reference.
- Full TCP protocol implementation.
- Advanced nftables rule-language course.
- Performance engineering at Brendan-Gregg-level depth.
- Distribution installation/desktop Linux administration.

These can become later deep dives if the project grows.

---

# 29. Future deep-dive candidates

Potential sub-pages later, but **not required now**:

1. Linux boot and systemd deep dive.
2. Linux permissions, ACLs, capabilities, and credential internals.
3. LVM and filesystem growth/recovery.
4. Linux network namespaces, veth, bridges, NAT, and container networking.
5. Netfilter/nftables packet path.
6. cgroups v2 and resource control.
7. Linux namespaces and container isolation.
8. SELinux/AppArmor comparative deep dive.
9. Linux performance troubleshooting.
10. eBPF observability.

When created, these should link from the relevant pillar rather than becoming new top-level map pillars.

---

# 30. Recommended Codex build order

Implement in this order so information architecture cannot accidentally drift:

1. Add `/linux` route and persistent hub shell.
2. Implement static Linux Map with all routes wired.
3. Implement responsive mobile map alternative.
4. Implement shared `LinuxPillarLayout` with breadcrumb, back-to-map, concept rail, pager, and terminal drawer.
5. Stub all eight routes using the shared layout.
6. Add concise homepage basics.
7. Fully implement **Networking** as the first reference pillar because its flow-based mechanics validate animation, terminal integration, and failure injection.
8. Implement Identity and Processes next; they establish reusable object/inspector patterns.
9. Implement Storage.
10. Implement Packages and Shell.
11. Implement Security after the primitive pillars exist so it can reuse them rather than duplicate them.
12. Implement Troubleshooting last as the synthesis experience.
13. Add learning progress only after navigation and content architecture are stable.
14. Validate direct routes, browser history, keyboard navigation, mobile, reduced motion, and state reset.

---

# 31. Final content dependency graph

```text
                           /linux
                             |
                  [Meet the Linux Machine]
                             |
              +--------------+--------------+
              |                             |
       free exploration                guided path
              |                             |
              |       1 Identity            |
              |           ↓                 |
              |       2 Storage             |
              |           ↓                 |
              |       3 Processes           |
              |           ↓                 |
              |       4 Networking          |
              |           ↓                 |
              |       5 Packages            |
              |           ↓                 |
              |       6 Shell               |
              |           ↓                 |
              |       7 Security            |
              |           ↓                 |
              +-----> 8 Troubleshooting <---+
                             |
                  Linux foundation complete
                             |
        SSH / Git / containers / Kubernetes / AWS
```

---

# 32. One-paragraph implementation brief for Codex

Build Linux in Infra Illustrated as a hub-and-spoke foundation system. `/linux` is a permanent orientation homepage whose first major visual is an interactive Linux Map centered on one Linux machine and eight clickable pillars: Identity, Storage, Processes, Networking, Packages, Shell, Security, and Troubleshooting. Clicking a pillar must navigate to a dedicated sub-page; the pillar's full visual must never render inline on the hub. Every pillar uses a common page shell with breadcrumb, prominent Back to Linux Map action, concept rail, large mechanics-first visual, terminal/command inspector, failure state, misconception correction, cross-pillar connections, cloud/container/Kubernetes relevance, and Previous/Next learning navigation. Keep the homepage basics concise: userspace/kernel/hardware, boot-to-running-system, minimal filesystem orientation, and the suggested sequence. Treat Linux as one system seen through eight lenses; teach primitives once and let later AWS/DevOps/Kubernetes visuals reuse those mental models.

---

# 33. Definition of done

The Linux foundation is not complete when it merely has eight navigation cards. It is complete when:

- The hub gives the learner a stable mental map.
- Each pillar visually explains actual mechanics.
- Commands inspect or mutate visible system state.
- Pillars cross-reference the same machine/workload.
- Failure states teach where and how to gather evidence.
- Distro-specific differences are labelled rather than universalized.
- Navigation supports both exploration and a guided sequence.
- The whole system remains accessible and responsive.
- The learner can recognize Linux primitives underneath later cloud, container, and Kubernetes abstractions.
