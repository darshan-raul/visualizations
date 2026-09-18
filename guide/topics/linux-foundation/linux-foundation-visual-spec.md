# Linux foundations — console integration visual specification

Topic: Linux foundations for the Foundations collection, with `/linux` and eight subsystem pillar routes.  
Status/version: Comprehensive Educational Overhaul (Option C), v2.0, 2026-09-18.  
Target audience: Developers moving into cloud/DevOps/SRE, and engineers who know common shell commands but lack accurate mental models of kernel subsystems and operating system boundaries.  
Page promise: Understand how the Linux kernel mediates resources, processes, storage, and networking through authentic visual systems—not abstract card decks.  
Persistent scenario: `devbox-01`, a production-style Linux host running an nginx web service (`nginx: master PID 418`, `worker PID 421` running unprivileged as UID 33 `www-data`), with configuration in `/etc/nginx/`, a TLS listener on TCP/443, static web assets on ext4 mounted at `/srv`, and connection logging via journald. Values are deterministic teaching fixtures verified against Linux man-pages and upstream kernel documentation.  
Visual thesis: The Linux hub is an interactive Host Architecture Canvas showing the boundary between User Space, the System Call Interface, Kernel Subsystems, and Hardware. Each pillar console zooms into one subsystem with dedicated, domain-accurate diagrams: VFS inode pipelines, kernel packet paths, virtual memory layouts, and diagnostic decision trees.  
Semantic grammar:
- Cyan (`#42d6e8`): direct execution path, active state, kernel mediation, syscall transition, and inspection probes.
- Purple (`#9d7cd8`): identity, credentials, user ownership, and access grants.
- Green (`#49d6a3`): healthy state, successful traversal, cache hit, and least-privilege compliance.
- Amber (`#f6c763`): caveat, transient state, waiting queue, resource pressure, or non-fatal boundary.
- Red (`#fb7e85`): hard failure, denied permission (`EACCES`), blocked traversal, dropped packet, or resource exhaustion (`ENOSPC`).
- Solid arrows: direct execution flow, memory mapping, or physical data transfer.
- Dashed connectors: indirect dependency, reference count, or kernel control association.

---

## 1. Technical Accuracy Worksheet & Mental Model Matrix

| Subsystem | Common Mental Trap / Misconception | Kernel Truth & Operating System Mechanism | Visual Anchor in Console |
| :--- | :--- | :--- | :--- |
| **Host Architecture (`/linux`)** | "Linux is just an OS where apps run on hardware." | Applications run strictly in **User Space (Ring 3)**. To touch any file, socket, or device, they must invoke the **System Call Interface** (`syscall`), triggering a CPU context switch to **Kernel Space (Ring 0)**. Containers are not mini-virtual machines; they are ordinary processes restricted by **Namespaces** (isolation) and **Cgroups** (resource throttling). | Radial Host Architecture Canvas with interactive multi-layer scenario traces. |
| **Storage (`/linux/storage`)** | "A file is a pathname on disk; deleting it immediately frees disk blocks." | A file's metadata is stored in an **Inode** (`stat`). The directory entry (**dentry**) only maps a human name to that inode number. When `rm` is run, the dentry is unlinked (`nlink` decremented). If an open process holds a **File Descriptor (FD)** to that inode, the kernel retains the data blocks in RAM Page Cache and on disk. `df` reports full disk, while `du` finds nothing! | VFS Pipeline Canvas: Dentry Cache → Inode Table (`nlink` + refcount) → Page Cache → Extent Tree → NVMe. |
| **Networking (`/linux/networking`)** | "Listening on port 443 means anyone on the network can connect." | The **bind address** determines reachability. Binding to `127.0.0.1` instructs the kernel IP layer to accept only packets from the loopback interface (`lo`). Binding to `0.0.0.0` accepts packets from any local interface. Even then, Netfilter chains (`PREROUTING`, `INPUT`) and routing policies can drop packets before they reach the socket buffer. | Kernel Packet Path: NIC RX Ring → Netfilter Hooks → Routing Table (`FIB`) → Socket Receive Buffer (`sk_buff`). |
| **Processes (`/linux/processes`)** | "A process is an executable binary file." | A binary on disk is passive ELF machine code. A **Process** is a dynamic kernel `task_struct` with a private **Virtual Address Space** (Text, Data, Heap, Memory-mapped libraries, Stack) translated via Page Tables to physical RAM frames. It transitions through explicit states (`TASK_RUNNING`, `TASK_INTERRUPTIBLE`, `TASK_UNINTERRUPTIBLE` D-state, `EXIT_ZOMBIE`). | Process Anatomy Canvas: Virtual Memory Map + Kernel State Machine + Signal Dispatcher. |
| **Identity (`/linux/identity`)** | "If a file is mode 0777 or 0644, anyone can read it." | Linux checks permissions **hierarchically during path resolution**. Every ancestor directory in the path must have the execute (`+x`) search bit granted to the process's effective credentials (`EUID`/`FSUID` and groups). If `/srv` lacks `+x`, `/srv/site/index.html` cannot be opened regardless of its file mode bits. | Credential & Path Traversal Gate Matrix: Real UID/EUID/FSUID vs Mode Bits. |
| **Shell (`/linux/shell`)** | "Pipes just magically forward text; `grep` receives stderr too." | A pipe (`|`) is a 64 KB unidirectional **kernel ring buffer**. The shell uses `pipe()` to create read/write FDs and `dup2()` to redirect standard output (`FD 1`) to the pipe write-end, and standard input (`FD 0`) to the read-end. Standard error (`FD 2`) bypasses the pipe entirely unless explicitly merged (`2>&1`). Standard bash pipeline exit status is that of the *last* command unless `pipefail` is enabled. | Pipeline Plumbing Canvas: FD Tables, Kernel Pipe Buffers, and Exit Code Propagation. |
| **Security (`/linux/security`)** | "Discretionary access control (chmod/chown) is the only security layer." | Security is an onion: **DAC** (file modes) is merely the first gate. Next are **POSIX ACLs**, **Linux Capabilities** (fine-grained root powers like `CAP_NET_BIND_SERVICE`), **Mandatory Access Control (MAC)** (SELinux contexts or AppArmor profiles), **Seccomp** syscall filters, and **Cgroups/Namespaces**. | Defense-in-Depth Enforcement Board showing progressive containment. |
| **Troubleshooting (`/linux/troubleshooting`)** | "Start troubleshooting an outage by restarting services or changing config." | Senior engineers use the **USE Method** (Utilization, Saturation, Errors) across resources (CPU, Memory, Disk, Network) to eliminate hypotheses systematically before mutating system state. | Diagnostic Decision Matrix & Golden Signals Triage Flow. |

---

## 2. Narrative and Route Inventory

| # | Route & Name | Core Learner Question | Visual Form | Key Educational Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `/linux` · Linux Map | How do userspace, kernel, and hardware coordinate to run applications? | Full-width Host Architecture Canvas with multi-layer layout | Interactive Tracing: Follow an HTTP packet, a file read, a process spawn, and container isolation across Ring 3 / Ring 0. |
| **2** | `/linux/identity` · Identity & Access | Which credentials does the kernel test, and why do file permissions fail? | Hierarchical Path Traversal Gate + Credential Vector Matrix | Step-by-step traversal: why `/srv/site` blocking `+x` throws `EACCES` before `index.html` is ever evaluated. |
| **3** | `/linux/storage` · Filesystem & Storage | What happens between a pathname string and physical disk sectors? | VFS Stack Pipeline + Capacity Meters (Blocks vs Inodes) | The Open-Unlinked File mystery: why `du` can't find files while `df` reports 100% full. |
| **4** | `/linux/processes` · Processes & Runtime | How does the kernel represent, isolate, and schedule running software? | Process Virtual Memory Map + Lifecycle State Machine | Process states (`R`, `S`, `D`, `Z`), `fork()` + `execve()` Copy-On-Write, and Signal delivery (`SIGTERM` vs `SIGKILL`). |
| **5** | `/linux/networking` · Networking & Sockets | How does an Ethernet packet become data inside an application buffer? | Kernel Packet Journey Canvas (NIC → Netfilter → FIB → Socket) | Bind address reachability (`127.0.0.1` vs `0.0.0.0`), Netfilter drop points, and `veth` container bridges. |
| **6** | `/linux/packages` · Packages & Software | What is the difference between an installed package and a running service? | Package Transaction Flow + Dynamic Linker (`ld.so`) Map | Shared libraries (`/etc/ld.so.cache`), configuration integrity, and systemd unit activation. |
| **7** | `/linux/shell` · Shell & Automation | How do shells parse commands, route streams, and manage child exit codes? | File Descriptor Wiring Canvas + Pipe Ring-Buffer Schematics | `dup2()` FD rewiring, standard error isolation, and `set -o pipefail` exit code semantics. |
| **8** | `/linux/security` · Host Security & Posture | Why can a root or service operation still fail under modern Linux security? | Layered Defense Board (DAC → Caps → MAC → Seccomp) | Blast-radius containment: demonstrating why an escaped container process is constrained by LSM and seccomp. |
| **9** | `/linux/troubleshooting` · Observability | How does an engineer systematically localize an outage without guessing? | The USE Method Triage Tree + Diagnostic Command Terminal | Interactive scenario triage: localizing memory saturation, disk full vs inode exhaustion, and firewall drops. |

---

## 3. Per-Visual Contracts (High-Impact Learning Models)

### Visual 1 — The Linux Host Architecture Canvas (`/linux`)

**Purpose & Mental Model:**  
Teach the three fundamental boundaries of Linux computing:
1. **User Space (Ring 3)**: Unprivileged execution where application logic runs.
2. **System Call Interface (`syscall`)**: The secure gate where CPU switches privilege level and executes kernel code on behalf of the application.
3. **Kernel Space (Ring 0)**: The privileged master that schedules CPUs, manages page tables, routes packets, controls file systems, and arbitrates hardware drivers.
4. **Hardware**: CPU, MMU, Physical RAM, NVMe/SATA Controllers, Network Interface Cards (NIC).

**Interactive Flows (Scenarios):**
- **Scenario A: Serving an HTTPS Request**:
  1. Packet arrives at NIC → DMA transfers frame to RX Ring buffer.
  2. NIC triggers hardware interrupt → CPU runs kernel driver ISR/NAPI.
  3. Netfilter `PREROUTING` hook evaluates firewall rules.
  4. Forwarding Information Base (`FIB`) routing table confirms destination is local `10.0.1.17`.
  5. Netfilter `INPUT` hook passes packet to TCP/IP stack.
  6. TCP payload placed in socket receive queue for TCP/443.
  7. `epoll_wait()` wakes up `nginx: worker (PID 421)`.
  8. Worker calls `read(fd, buffer, len)` syscall → kernel copies data to user space.
- **Scenario B: Reading a Static Asset (`/srv/site/index.html`)**:
  1. Worker calls `openat(AT_FDCWD, "/srv/site/index.html", O_RDONLY)`.
  2. VFS parses path across dentry cache and checks credentials (UID 33 against directory `+x` permissions).
  3. Inode lookup yields file metadata and block map.
  4. VFS checks Page Cache in RAM:
     - *Cache Hit*: Memory copied immediately without disk access.
     - *Cache Miss*: ext4 block driver schedules block read via NVMe controller.
  5. New File Descriptor (`FD 12`) returned to worker.
- **Scenario C: Container Sandbox Isolation**:
  Shows a container process alongside host processes. Visualizes how namespaces (Mount, PID, Network, IPC, UTS) give it a private view of the OS, while Cgroups enforce hard limits (e.g. 512MB RAM, 1 CPU core) managed by the same kernel!

---

### Visual 2 — Identity & Path Resolution (`/linux/identity`)

**Purpose & Mental Model:**  
Explain why file permissions are ineffective without directory search rights.
1. **Process Credential Vector**:
   - `RUID` (Real User ID): Who initiated the process.
   - `EUID` (Effective User ID): Used for standard access checks.
   - `FSUID` (Filesystem User ID): Linux-specific credential for all VFS path operations.
   - `Supplementary Groups`: Array of secondary group IDs.
2. **Path Traversal Gate**:
   - To open `/srv/site/index.html`, kernel starts at root `/`.
   - Evaluates execute (`+x`) on `/` → Pass.
   - Evaluates execute (`+x`) on `/srv` → Pass.
   - Evaluates execute (`+x`) on `/srv/site`:
     - *Default*: Mode `0755 root:root` → Other has `rx` → Pass.
     - *Failure State*: Mode `0750 root:root` → Worker UID 33 has no match in owner or group → **DENIED with `EACCES`**.
   - Evaluates read (`+r`) on `index.html`:
     - Even if `index.html` is `0777`, the check is **NEVER REACHED** because traversal was denied at `/srv/site`!

---

### Visual 3 — Filesystem & Storage Internals (`/linux/storage`)

**Purpose & Mental Model:**  
Explain the separation between pathnames, inodes, the page cache, and storage blocks.
1. **The VFS Chain**:
   `Path string` → `Dentry Cache (RAM)` → `Inode (Metadata, Link Count, Pointers)` → `Page Cache (RAM)` → `ext4 Extent Tree` → `Block Device (/dev/vdb1)`.
2. **The "Disk Full" Inode Paradox**:
   Visualizes two distinct meters:
   - Data Block Usage (e.g. 20% used, 80 GB free).
   - Inode Usage (e.g. 100% used, 0 inodes free).
   When applications create millions of zero-byte or tiny files, `df -h` shows plenty of space, but any `touch` or `mkdir` fails with `ENOSPC: No space left on device`!
3. **The "Deleted but Open" Phantom Storage Mystery**:
   - Worker PID 421 holds `/var/log/nginx/access.log` open (FD 14).
   - Operator runs `rm /var/log/nginx/access.log`.
   - VFS unlinks the directory entry (`dentry` deleted, `inode.i_nlink = 0`).
   - `du /var/log` cannot find the file and reports 0 MB used.
   - But because PID 421 still has FD 14 open, the kernel refcount on the inode is > 0!
   - Disk blocks remain allocated on disk. `df -h` reports disk is still full!
   - Shows how `lsof +L1` reveals unlinked files, and how truncating (`> /proc/421/fd/14`) reclaims blocks immediately without rebooting.

---

### Visual 4 — Process Anatomy & Lifecycle (`/linux/processes`)

**Purpose & Mental Model:**  
Show how an executable binary transforms into an active, managed runtime process.
1. **Virtual Address Space Layout**:
   - `0xFFFFFFFFFFFFFFFF`: Kernel Space (mapped in top memory, inaccessible in Ring 3).
   - `Stack`: Function call frames, local variables (grows downward).
   - `Memory Mapping Segment`: Shared libraries (`libc.so`), memory-mapped files via `mmap()`.
   - `Heap`: Dynamically allocated memory via `brk()`/`sbrk()`/`malloc()` (grows upward).
   - `BSS & Data`: Uninitialized and initialized global variables.
   - `Text (Code)`: Read-only machine instructions loaded from ELF binary.
2. **Process State Machine**:
   - `TASK_RUNNING (R)`: Actively executing on a CPU core or queued in the runqueue.
   - `TASK_INTERRUPTIBLE (S)`: Sleeping, waiting for an event (timer, I/O, socket). Wakes on signals.
   - `TASK_UNINTERRUPTIBLE (D)`: Deep sleep waiting on hardware/disk I/O. Cannot be interrupted or terminated, not even by `kill -9`!
   - `TASK_STOPPED (T)`: Suspended via `SIGSTOP` or debugger.
   - `EXIT_ZOMBIE (Z)`: Process has finished execution, but its exit status is preserved in the kernel process table until the parent calls `waitpid()`.
3. **Interactive Signal Dispatcher**:
   Interactive triggers on worker PID 421:
   - `SIGTERM (15)`: Application catches signal, closes client connections, flushes buffers, and exits cleanly (exit code 0).
   - `SIGKILL (9)`: Kernel unconditionally removes process from scheduler runqueues; no user space code runs; exit code 137.
   - `SIGHUP (1)`: Application re-reads configuration files without terminating worker connections.
   - `SIGSTOP (19)` / `SIGCONT (18)`: Freezes and resumes process execution.

---

### Visual 5 — Networking & Kernel Packet Flow (`/linux/networking`)

**Purpose & Mental Model:**  
Follow an Ethernet frame from the physical wire through Netfilter chains into user space socket buffers.
1. **The Ingress Packet Journey**:
   - `Wire` → `NIC RX Ring` (hardware buffer).
   - `NAPI SoftIRQ` polls ring and creates `sk_buff` (socket buffer data structure).
   - `Netfilter PREROUTING`: Evaluates DNAT rules and connection tracking (`conntrack`).
   - `Routing Decision (FIB lookup)`: Determines if destination IP is local host or needs forwarding.
   - `Netfilter INPUT`: Host firewall rules (`nftables` / `iptables`).
   - `Socket Layer`: Matches packet to socket tuple `(src_ip, src_port, dst_ip, dst_port)`.
   - Segment appended to socket's receive buffer queue.
   - User application awakened via `epoll` or `select`.
2. **Bind Address Scope**:
   - `127.0.0.1:443`: Packet arriving on `eth0` is dropped at routing decision because it didn't arrive on `lo`.
   - `0.0.0.0:443`: Kernel accepts incoming packets on loopback, `eth0`, and all virtual interfaces.
   - `10.0.1.17:443`: Kernel only matches packets addressed specifically to the `eth0` IP.
3. **Container Network Namespace Bridge**:
   Shows how Docker/Kubernetes creates a virtual ethernet pair (`veth`):
   `Host Root NS` ↔ `veth-host` ↔ `Bridge (cbr0)` ↔ `veth-guest` ↔ `Container Net NS (eth0)`.

---

### Visual 6 — Shell & Pipeline Plumbing (`/linux/shell`)

**Purpose & Mental Model:**  
Make file descriptor manipulation, standard streams, and pipeline buffering intuitive.
1. **File Descriptor Table**:
   - `FD 0`: Standard Input (`stdin`), defaults to keyboard/terminal.
   - `FD 1`: Standard Output (`stdout`), defaults to screen/terminal.
   - `FD 2`: Standard Error (`stderr`), defaults to screen/terminal.
2. **How Pipes Work (`cmd1 | cmd2`)**:
   - The shell calls `pipe(fds)`, creating a 64KB circular ring buffer in kernel memory.
   - Shell forks `cmd1` and calls `dup2(pipe_write, 1)`: FD 1 now writes to the kernel pipe.
   - Shell forks `cmd2` and calls `dup2(pipe_read, 0)`: FD 0 now reads from the kernel pipe.
   - `cmd1` outputs data directly into kernel buffer; `cmd2` consumes it as it becomes available.
   - If `cmd2` crashes or closes FD 0, kernel sends `SIGPIPE` to `cmd1`.
3. **Standard Error Isolation & Redirection**:
   - `cmd > file.txt`: Only redirects FD 1. Errors on FD 2 still print to terminal!
   - `cmd 2>&1 | grep "error"`: Merges FD 2 into FD 1 before entering the pipe.
4. **Pipeline Exit Codes & `pipefail`**:
   - Default bash: In `false | true`, the exit status `$?` is `0` (from `true`).
   - With `set -o pipefail`: The exit status `$?` is `1` (reflecting the failure of `false`).

---

### Visual 7 — Defense-in-Depth Host Security (`/linux/security`)

**Purpose & Mental Model:**  
Show how modern Linux prevents privilege escalation through independent security checks.
1. **The Layered Security Onion**:
   - **Layer 1: Discretionary Access Control (DAC)**: Traditional owner/group/other permission bits.
   - **Layer 2: POSIX Capabilities**: Divides root power into 41 granular privileges (`CAP_NET_BIND_SERVICE`, `CAP_SYS_ADMIN`, `CAP_CHOWN`). A binary can bind port 443 without full root!
   - **Layer 3: Mandatory Access Control (MAC)**: SELinux or AppArmor labels (`system_u:system_r:httpd_t`). Even if an attacker gains root inside the process, the kernel enforces type enforcement rules!
   - **Layer 4: System Call Filtering (Seccomp)**: BPF-based filter restricting which system calls the process can invoke (e.g. blocking `ptrace`, `bpf`, or `mount`).
   - **Layer 5: Cgroups & Namespaces**: Hard resource limits and namespace isolation.

---

### Visual 8 — Observability & Troubleshooting (`/linux/troubleshooting`)

**Purpose & Mental Model:**  
Teach the USE Method (Utilization, Saturation, Errors) across the four core host resources.
1. **The USE Matrix**:
   - **CPU**:
     - *Utilization*: `%user`, `%system` via `mpstat 1` or `top`.
     - *Saturation*: Runqueue length in `/proc/loadavg` (load average > core count).
     - *Errors*: Thermal throttling in `dmesg`.
   - **Memory**:
     - *Utilization*: Used memory excluding buffers/cache via `free -m`.
     - *Saturation*: Swap in/out rate in `vmstat 1` (`si`/`so`).
     - *Errors*: Out of Memory Killer invocations (`dmesg -T | grep -i oom`).
   - **Storage / Disk I/O**:
     - *Utilization*: Device busy `%util` via `iostat -xz 1`.
     - *Saturation*: Average queue size `aqu-sz` and `await` latency.
     - *Errors*: Read/write errors in `smartctl` or filesystem remount read-only.
   - **Network**:
     - *Utilization*: Throughput vs interface line rate (`sar -n DEV 1`).
     - *Saturation*: Dropped packets, socket buffer overruns (`netstat -s`).
     - *Errors*: CRC errors or frame errors in `ip -s link`.

---

## 4. Acceptance Criteria & Implementation Plan

1. **Specification & Prototype**:
   - `linux-foundation-visual-spec.md` updated with full contracts.
   - `linux-foundation-visual-prototype.html` updated with interactive visual diagrams for the Hub and representative pillars.
2. **Production Code**:
   - `src/components/linux/LinuxHub.astro`: Implement the interactive Host Architecture Canvas with multi-layer tracing.
   - `src/components/linux/LinuxPillarConsole.astro`: Render authentic visual diagrams (VFS storage pipeline, packet journey, virtual memory map, credential matrix, pipeline plumbing, and USE method triage tree).
   - `src/styles/linux.css`: High-fidelity dark mode styles for all architectural components, SVG pipelines, and interactive controls.
   - `src/components/linux/pillars/*.ts`: Update view metadata to power the diagrams.
3. **Verification**:
   - Run `npm run verify` (`check`, `build`, `check:graph`, `check:links`) — 0 errors.
   - Update `guide/CONSOLE-MIGRATION-CHECKLIST.md`.
