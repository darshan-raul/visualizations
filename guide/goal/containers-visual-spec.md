# Infra Illustrated — Containers Visual Specification v1

**Topic:** Containers — Linux primitives, images, runtime, networking, storage, lifecycle, security, build/distribution, and operations  
**Status:** Approval-ready visual specification  
**Verified:** 2026-09-12 against current Docker, OCI, containerd, Linux kernel, and Linux man-page documentation  
**Target audience:** DevOps, platform, cloud, SRE, and software engineers with Linux/networking fundamentals  
**Page promise:** By the end of the page, the learner can explain a container without relying on Docker vocabulary, then map that Linux reality back to Docker/OCI/containerd and troubleshoot common failures.  
**Persistent scenario:** One Node.js web process, `node server.js`, listening on container port `3000`, packaged as `infra-demo/node-app:v1`, running on a Linux host.  

---

# 1. Non-negotiable visual rule

The page must teach containers as **a process that progressively acquires isolation, resource boundaries, a filesystem view, network plumbing, and security constraints**.

The learner should never be shown a sealed “container box” before the page explains what makes the box exist.

The primary visual language is a hybrid of a Linux terminal and a live host X-ray:

```text
┌ Container Lab — host: devbox ───────────────────────────────────────────┐
│ Linux host X-ray                                                       │
│                                                                        │
│ host processes              selected process / container               │
│ systemd                     ┌───────────────────────────────┐          │
│ sshd                        │ node server.js                │          │
│ node server.js ───────────► │ PID view / net / mounts ...   │          │
│                             └───────────────────────────────┘          │
├────────────────────────────────────────────────────────────────────────┤
│ $ exact command                                                        │
│ realistic output                                                       │
├────────────────────────────────────────────────────────────────────────┤
│ action rail / step controls                                            │
├────────────────────────────────────────────────────────────────────────┤
│ live state shelf: PID · netns · cgroup · rootfs · runtime · health     │
└────────────────────────────────────────────────────────────────────────┘
```

Every major visual must answer at least three of these questions:

1. What Linux process exists right now?
2. Which isolation/resource/security primitives affect it?
3. What filesystem and network view does the process see?
4. Which container-engine/runtime component created or manages that state?
5. What observable evidence would an operator inspect?

Do not make the page a Docker command cheat sheet.

---

# 2. Core mental model

The page revolves around this sentence:

> **A Linux container is a process (or process group) running with an isolated view of selected kernel resources, resource controls, a prepared root filesystem, and security restrictions. A container engine assembles and manages those pieces.**

The page must repeatedly contrast:

```text
Docker / engine abstraction       Linux / runtime reality
----------------------------      ------------------------
container                         process(es)
container filesystem              mounts + image snapshots/layers
container network                 network namespace + interfaces + routes + firewall/NAT
CPU/memory limit                  cgroup controllers
container user/root               credentials + user namespace mapping where configured
container security                capabilities + seccomp + LSM + namespace boundaries
image                             content-addressed config + filesystem layers + manifest
run                               engine → containerd/runtime → kernel primitives
```

A permanent top-right toggle must be available where useful:

```text
VIEW:  [ Engine abstraction ] [ Linux reality ]
```

The default on the opening visual is **Linux reality**.

---

# 3. Scope and non-goals

## In scope

- Process versus container mental model.
- Linux namespaces relevant to mainstream containers: PID, mount, network, UTS, IPC, user; mention cgroup/time namespaces only as advanced extensions.
- cgroup v2 mental model and common CPU/memory/PIDs controls.
- OCI image/runtime/distribution concepts.
- Docker Engine as one container-engine implementation.
- Current Docker/containerd runtime path at a conceptual level.
- Image layers, runtime writable state, current containerd image-store caveat, OverlayFS as a common implementation.
- Volumes, bind mounts, tmpfs, writable container state.
- Bridge networking, user-defined bridges, embedded DNS, port publishing, NAT/firewall behavior.
- PID 1, signals, graceful stop, zombie/reaping concepts.
- Capabilities, seccomp, root/rootless/user namespaces, privileged mode warning, read-only root filesystem.
- Dockerfile build cache, multi-stage builds, tags versus digests, registries.
- Container versus VM mental model.
- Troubleshooting and production operating loop.
- Handoff to Compose/ECS/Kubernetes without teaching orchestration in depth.

## Explicit non-goals

- Full Docker CLI reference.
- Full OCI schema reference.
- Deep kernel source-code treatment of namespace implementation.
- Complete iptables/nftables rule generation internals.
- CNI/CSI/CRI deep dive; those belong to Kubernetes pages.
- Windows container internals beyond the comparison note that Linux-container primitives are Linux-specific.
- Docker Swarm deep dive.
- Supply-chain signing/SBOM implementation details; link to a later image-security page.

---

# 4. Accuracy decisions that shape the visual

1. **Do not define a container as “a lightweight VM.”** Use the shared-kernel process model first.
2. **Do not equate containers with Docker.** Docker is introduced as an engine/tooling layer after Linux primitives.
3. **Do not teach `overlay2` as universal current Docker storage.** Docker Engine 29.0+ fresh installations use the containerd image store by default; teach read-only image layers + runtime writable snapshot/layer as the stable abstraction, then show OverlayFS as one implementation.
4. **Do not hard-code iptables as the only packet implementation.** Teach bridge/interface/routes/firewall/NAT as the stable path and label iptables/nftables details as implementation/configuration dependent.
5. **Do not imply every Docker run path is forever `dockerd → containerd → shim → runc` in exactly the same form.** Use it as the default Linux Docker Engine runtime path for the teaching scenario, while noting containerd supports multiple runtimes and shim models.
6. **Do not claim that container root always equals host root.** Show user namespace/rootless modes as alternate mappings.
7. **Do not imply a memory limit simply “kills the container.”** Show the memory cgroup as the boundary and the kernel OOM behavior/process termination as the resulting failure path; exact victims/behavior depend on configuration.
8. **Do not imply a container automatically has a strict CPU/memory limit.** Docker documents that containers have no resource constraints by default unless configured.
9. **Do not treat tags as immutable identities.** Tags are human-readable pointers; digests identify content.
10. **Do not conflate image filesystem layers with Dockerfile instructions in all cases.** Docker teaching material often maps build steps to layers, but modern BuildKit can optimize build behavior; the prototype should say “build/cache result” rather than asserting a permanent one-instruction-one-layer rule for every build.

---

# 5. Persistent scenario

Use the same application throughout:

```text
project: infra-demo
image:   infra-demo/node-app:v1
process: node server.js
port:    3000/tcp
host:    devbox
host IP: 192.0.2.10       (documentation range)
bridge:  app-net
subnet:  172.20.0.0/24
app IP:  172.20.0.2
peer:    redis → 172.20.0.3
volume:  app-data
```

Canonical Dockerfile used in the build visuals:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

Canonical run command:

```bash
docker run -d \
  --name web \
  --network app-net \
  -p 127.0.0.1:8080:3000 \
  --memory 512m \
  --cpus 1.0 \
  --read-only \
  --tmpfs /tmp \
  infra-demo/node-app:v1
```

The published port intentionally binds to `127.0.0.1` to teach that `-p 8080:3000` without a host IP may expose on all host addresses by default.

---

# 6. Visual thesis

**“Container Assembly Lab.”**

The page begins with a plain host process. Each chapter either:

- adds a Linux boundary,
- reveals how the engine created it,
- moves data/packets through it,
- or removes/breaks one boundary and asks the learner to diagnose the result.

The visual silhouette should resemble a purpose-built systems debugger: large host/process diagrams, terminal evidence, compact controls, and a live state shelf.

---

# 7. Semantic color and diagram grammar

```css
:root {
  --page-bg: #06111e;
  --surface: #0a1a2b;
  --surface-raised: #0d2237;
  --border: #24435d;
  --text: #e7f0f7;
  --muted: #8ba6bc;
  --process: #6bd6ff;
  --isolation: #9e8cff;
  --resource: #5ce0a1;
  --filesystem: #f1bd61;
  --network: #5cb7ff;
  --security: #ff9c72;
  --runtime: #d5a6ff;
  --success: #61dda0;
  --warning: #f3c969;
  --failure: #ff7878;
  --state: #72d4ff;
}
```

Diagram grammar:

- Solid arrow → runtime call, packet movement, process transition, or direct relationship.
- Dashed arrow → configuration/management relationship.
- Animated pulse → current persistent process/packet/event.
- Purple boundary → namespace/isolation boundary.
- Green gauge/boundary → cgroup/resource boundary.
- Amber stacked slabs → image/root-filesystem state.
- Blue path → network packet path.
- Orange shield/ring → security control.
- Broken connector + `BLOCKED` label → failed path.
- Number badges → strict lifecycle sequence.
- Eye icon/text label `HOST VIEW` / `CONTAINER VIEW` → perspective switch.
- Never encode success/failure by color alone; always show text/state glyphs.

---

# 8. Narrative sequence

| # | Section | Core learner question | Visual form | Interaction | Required takeaway |
|---|---|---|---|---|---|
| 1 | Build a container from a process | What actually turns a process into a container? | Host X-ray + step-through assembly | **Hero** | A container is still host-kernel-scheduled process(es) with isolation/controls around them. |
| 2 | Namespace glasses | What does each namespace change from the process's point of view? | Perspective split | Toggle namespaces / host vs container view | Namespaces change visibility/identity, not the underlying kernel. |
| 3 | Resource control room | Who enforces CPU/memory/PID limits? | Boundary playground | Sliders + stress action | cgroups organize processes and enforce/distribute resources; limits are not automatic. |
| 4 | Image anatomy and cache | What is an image, and why do rebuilds reuse work? | Layer/snapshot peel + build timeline | Edit source/dependency inputs | Images are content-addressed config + layers; cache depends on build inputs. |
| 5 | Image vs container + storage | Where do runtime writes live, and what survives deletion? | Shared image with three containers + persistence paths | Create file / delete / mount mode selector | Image stays immutable; runtime writable state is container-specific; durable data needs a mount/volume strategy. |
| 6 | Trace `docker run` | Which components act between CLI and Linux process? | Runtime sequence | **Hero** step-through | Engine UX, containerd/shim/runtime, OCI config, and kernel primitives are distinct layers. |
| 7 | Ride the packet | How does `localhost:8080` reach container port 3000? | Packet path | Next-hop + abstraction/reality toggle | Published ports involve host bind/firewall/NAT/routing and the container network interface; custom bridge DNS resolves peers. |
| 8 | PID 1 and lifecycle | Why do signals and process parenting matter? | Process tree + stop timeline | Send SIGTERM / force-stop / child spawn | PID 1 is special inside PID namespace; apps must handle shutdown and child processes correctly. |
| 9 | Security boundary builder | What stops a containerized process from doing host-like privileged work? | Security onion / control stack | Toggle capabilities/seccomp/rootless/privileged/read-only | Container security is layered; `--privileged` removes major isolation safeguards. |
|10| Build → tag → push → pull → run | What exactly moves through a registry? | Supply chain conveyor | Tag/digest and multi-stage comparison | Registry distribution moves manifests/config/layers; tags are pointers, digests identify content. |
|11| Break/Fix lab | What evidence tells me why a container is failing? | Integrated terminal + topology + inspector | **Hero** failure injection | Troubleshoot from symptom → evidence → first broken primitive, not by restarting blindly. |
|12| Container vs VM + orchestration handoff | Where do containers stop and orchestrators begin? | Side-by-side stack + “Remove Docker” ending | Abstraction toggle | Containers share a host kernel; engines assemble them; orchestrators schedule/manage many containers. |

---

# 9. Visual 1 — Build a Container from a Process

## Purpose

Destroy the “tiny VM” misconception before any Docker command is taught.

## Learner question

> I already know a Linux process. What extra things make this process a container?

## Persistent scenario state

`node server.js` is initially a normal host process, PID `18472`, listening directly on the host namespace.

## Concepts and actors

Runtime:
- host Linux kernel;
- host process `node server.js`;
- PID namespace;
- mount namespace/rootfs;
- network namespace;
- UTS namespace;
- IPC namespace;
- optional user namespace mapping;
- cgroup placement;
- capability/seccomp/LSM controls;
- veth/network interface and bridge as later stage;
- image-derived root filesystem.

Configuration:
- desired namespace set;
- resource limits;
- image/rootfs config;
- runtime security profile.

## Composition

Desktop layout:

```text
left 28%                         right 72%
HOST PROCESS LIST                ASSEMBLY STAGE
systemd 1                       ┌ node server.js ┐
sshd 921                        │ host PID 18472 │
node 18472 ───────────────────► └───────────────┘
                                ↓ step 1 PID namespace
                                ↓ step 2 mount/rootfs
                                ↓ step 3 net namespace
                                ↓ step 4 cgroup
                                ↓ step 5 security controls
                                ↓ running container
```

Terminal is directly below:

```bash
$ ps -o pid,ppid,cmd -p 18472
18472  1312  node server.js
```

At later steps show the same process as host PID `18472` and container PID `1`.

## Interaction

**Hero interaction.**

Controls:
- `Start process`
- `Add PID namespace`
- `Add mount/rootfs`
- `Add network namespace`
- `Place in cgroup`
- `Apply security controls`
- `Container complete`
- `Reset`
- `Auto play` optional, never required.

Each step:
1. appends one terminal/evidence line;
2. adds one visible boundary or primitive;
3. updates the live state shelf;
4. updates an `aria-live` textual summary.

Keyboard:
- buttons in DOM sequence;
- arrow keys not required; Tab/Enter/Space sufficient.

Reset always returns to plain host process.

## Data/content states

State shelf example:

```text
PID view       host:18472 / container:—
netns          host
cgroup         user.slice
rootfs         /
security       host process defaults
status         plain process
```

Final state:

```text
PID view       host:18472 / container:1
netns          web-netns
cgroup         docker/web
rootfs         image snapshot + writable state
security       reduced capabilities + seccomp
status         containerized process
```

## Failure/edge state

Optional `Skip cgroup limit` demonstration: container still exists but shows `CPU/MEM: unconstrained by Docker flags` and a warning that containers are not automatically resource-limited.

## Required copy

Takeaway:

> **The process never stops being a Linux process. The container is the execution context built around it.**

Misconception:

> Common misconception: “Docker starts a tiny Linux VM.”  
> Correct model: On Linux, the application normally runs as host-kernel-scheduled processes with isolated views and controls.

## Accuracy caveats

- Linux container implementation is shown; Windows containers use different OS primitives.
- Exact namespace/security setup varies by runtime and options.
- A “container” can contain more than one process.

## Mobile behavior

Host list collapses above the assembly stage. Steps become numbered vertical cards. State shelf becomes 2-column then 1-column below 420 px.

## Accessibility

- Semantic buttons.
- Current step marked `aria-current="step"`.
- Live summary announces newly added primitive.
- Reduced motion removes boundary animation and updates instantly.
- Text summary under diagram repeats the model.

## Source anchors

- OCI Runtime Spec: https://specs.opencontainers.org/runtime-spec/
- Linux namespaces overview: https://man7.org/linux/man-pages/man7/namespaces.7.html
- PID namespaces: https://man7.org/linux/man-pages/man7/pid_namespaces.7.html
- Linux cgroup v2: https://docs.kernel.org/admin-guide/cgroup-v2.html

## Acceptance checks

- Learner can see a valid “plain process” state before containerization.
- Host PID and container PID are simultaneously visible after PID namespace stage.
- Final state names at least isolation, resources, rootfs, and security.
- No wording equates container with VM.

---

# 10. Visual 2 — Namespace Glasses

## Purpose

Turn namespaces from memorized names into changes in what a process can observe.

## Learner question

> If the kernel is shared, how can the process believe it has its own machine-like environment?

## Persistent scenario state

The `web` process is containerized. The learner temporarily toggles one namespace view at a time.

## Concepts and actors

- PID namespace → PID number space.
- mount namespace → mount table/root filesystem view.
- network namespace → interfaces/routes/ports/network stack view.
- UTS namespace → hostname/domain identifiers.
- IPC namespace → System V IPC/POSIX message queue isolation.
- user namespace → UID/GID mapping and privilege context.
- advanced drawer: cgroup namespace and time namespace exist but are not required for the core lesson.

## Composition

Two synchronized panes:

```text
HOST VIEW                         CONTAINER VIEW
PID 18472 node server.js          PID 1 node server.js
eth0 192.0.2.10                   eth0 172.20.0.2
hostname devbox                   hostname web
/ host mount tree                 / image-derived rootfs
UID mapping host context          UID node / mapped IDs if userns enabled
```

Namespace buttons sit between them.

## Interaction

Buttons/toggles:
- PID
- NET
- MNT
- UTS
- IPC
- USER

Selecting one highlights exactly the rows it changes and shows a one-sentence consequence.

A `Share host namespace` alternate state deliberately collapses one boundary, e.g. `--network host` conceptually, but exact Docker syntax should be used only in the detail text.

## Data/content states

Examples use documentation IPs and fictional IDs only.

## Failure/edge state

`NET namespace shared` shows a port collision: the app tries to bind a host port already in use, explaining why isolated network stacks matter.

## Required copy

> **Namespaces answer “what can this process see or identify?” Cgroups answer “how much can it consume?”**

## Accuracy caveats

- Namespaces isolate selected global resources; they are not a universal security boundary by themselves.
- User namespaces alter credential mapping and deserve their own deep dive.

## Mobile behavior

Host pane then container pane; namespace controls become a wrapped chip grid.

## Accessibility

- Use checkboxes or pressed buttons with text labels.
- Announce changed rows.
- Highlight changed rows with icon + border, not color alone.

## Source anchors

- Namespaces: https://man7.org/linux/man-pages/man7/namespaces.7.html
- PID: https://man7.org/linux/man-pages/man7/pid_namespaces.7.html
- UTS: https://man7.org/linux/man-pages/man7/uts_namespaces.7.html
- IPC: https://man7.org/linux/man-pages/man7/ipc_namespaces.7.html

## Acceptance checks

- PID view demonstrates host PID ≠ container PID.
- NET view changes interfaces/routes/addresses rather than merely hiding an IP label.
- Namespace explanation never says “separate kernel.”

---

# 11. Visual 3 — cgroup Resource Control Room

## Purpose

Explain that resource boundaries are kernel-enforced cgroup behavior, not properties inherent to the word “container.”

## Learner question

> What actually stops one container from consuming the whole host?

## Persistent scenario state

`web` runs in a cgroup under the Docker-managed hierarchy with optional CPU/memory/PID constraints.

## Concepts and actors

- cgroup v2 hierarchy.
- process membership.
- CPU weight/quota concept.
- memory max concept.
- PIDs controller concept.
- IO as expandable advanced control.
- kernel OOM behavior.
- default no Docker resource constraints warning.

## Composition

Control-room panel:

```text
web cgroup
CPU       [ slider ] 1.0 CPU
Memory    [ slider ] 512 MiB
PIDs      [ slider ] 100

LIVE USAGE
CPU       0.26 / 1.00
Memory    181 / 512 MiB
PIDs      7 / 100
```

At right, show cgroup tree:

```text
/
└─ system.slice / container hierarchy
   └─ web
      ├─ PID 18472 / ns PID 1
      └─ worker children
```

## Interaction

- CPU slider.
- memory slider.
- PIDs slider.
- `Stress CPU`.
- `Allocate 700 MiB`.
- `Fork 150 workers`.
- `Remove explicit limits`.
- `Reset`.

When memory request exceeds the configured limit, show the boundary hit and an OOM event path, not a magical “Docker killed it” animation.

## Data/content states

Default learning state: 1 CPU, 512 MiB, 100 PIDs.
Alternate: unlimited Docker resource flags.

## Failure/edge state

- OOM.
- PID creation denied/reaches boundary.
- CPU throttling rather than process termination.

## Required copy

> **Namespaces isolate views. cgroups organize processes and control/distribute resources.**

Misconception:

> Common misconception: “Containers are automatically capped.”  
> Correct model: Docker documents no resource constraints by default unless limits are configured.

## Accuracy caveats

- Exact cgroup filenames and mappings depend on cgroup version, runtime, systemd integration, and Docker settings.
- Do not promise a deterministic OOM victim beyond the simplified lab scenario.

## Mobile behavior

Gauges stack over cgroup tree.

## Accessibility

Native range inputs plus explicit numeric labels; buttons provide equivalent preset values for keyboard users.

## Source anchors

- Linux cgroup v2: https://docs.kernel.org/admin-guide/cgroup-v2.html
- Docker resource constraints: https://docs.docker.com/engine/containers/resource_constraints/

## Acceptance checks

- “Remove limits” is a valid visible state.
- CPU stress results in throttling/limited throughput rather than kill.
- memory overflow path references kernel/cgroup behavior.

---

# 12. Visual 4 — Image Anatomy and Build Cache

## Purpose

Separate image content from running-container state and make build-cache invalidation visible.

## Learner question

> What is an image made of, and why does Docker sometimes rebuild only part of it?

## Persistent scenario state

The app is not running. The learner builds `infra-demo/node-app:v1` from the canonical Dockerfile.

## Concepts and actors

- OCI manifest.
- config.
- filesystem layers.
- image index/multi-platform concept.
- content digest.
- build cache.
- BuildKit cache-input logic.
- image store/snapshotter.
- OverlayFS detail view as one Linux implementation.

## Composition

Left: Dockerfile with highlighted instruction.
Center: build result timeline.
Right: OCI peel view:

```text
image index (optional / multi-platform)
      ↓
manifest
 ├─ config
 └─ layer descriptors
     ├─ layer A
     ├─ layer B
     └─ layer C
```

An implementation drawer can show:

```text
containerd image store → snapshotter
or legacy overlay2 → lowerdir/upperdir/merged
```

## Interaction

Three change presets:
- `Change server.js`.
- `Change package-lock.json`.
- `Change base image reference`.

Build timeline marks `CACHED` versus `REBUILT` and explains why downstream work changes.

## Data/content states

Use deterministic fake digests such as `sha256:4ad7…91c2` clearly labelled “example digest.”

## Failure/edge state

`COPY . .` before dependency install shows broad cache invalidation; optimized order shows dependency layer reuse when only source changes.

## Required copy

> **An OCI image is content plus metadata: manifest/config/layers, identified by digests. Build cache is a build-system optimization, not the running container’s writable filesystem.**

## Accuracy caveats

- Avoid asserting every Dockerfile instruction always maps 1:1 to a final filesystem layer.
- Docker Engine 29+ fresh installations use the containerd image store by default; upgraded installations may retain legacy storage drivers until migrated.

## Mobile behavior

Dockerfile → timeline → peel view vertically.

## Accessibility

Change presets are buttons; cache statuses include text labels/icons.

## Source anchors

- OCI image spec: https://github.com/opencontainers/image-spec
- OCI image manifest: https://specs.opencontainers.org/image-spec/manifest/
- Docker build cache: https://docs.docker.com/build/cache/
- Cache optimization: https://docs.docker.com/build/cache/optimize/
- Containerd image store: https://docs.docker.com/engine/storage/containerd/

## Acceptance checks

- Image shown separately from running container.
- Tag is not used as immutable identity.
- OverlayFS is labelled implementation detail rather than universal definition.

---

# 13. Visual 5 — Image vs Container and Persistence

## Purpose

Show shared immutable image content versus per-container runtime state and external persistence.

## Learner question

> If three containers use the same image, what do they share and what is private? What survives deletion?

## Persistent scenario state

Three `web` containers are created from the same image; only `web-a` writes `/app/runtime.txt`.

## Concepts and actors

- shared image.
- per-container writable state/snapshot.
- named volume.
- bind mount.
- tmpfs.
- delete semantics.
- copy-on-write concept where applicable.

## Composition

```text
              infra-demo/node-app:v1
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
          web-a       web-b       web-c
         writable    writable    writable
          state        state        state
            │
         /data
            │
      [ selected mount ]
```

Persistence selector below:

```text
Writable state | Named volume | Bind mount | tmpfs
```

## Interaction

Actions:
- `Create runtime.txt`.
- `Write 42 records`.
- select persistence mode.
- `Delete web-a`.
- `Recreate web-a`.

Result panel tells exactly what remains.

## Data/content states

Named volume: `app-data`.
Bind mount: `/srv/infra-demo/data` (fictional host path).
tmpfs: `/run/cache`.

## Failure/edge state

- Delete container with data only in writable state → data disappears with that container state.
- tmpfs disappears when container stops/removes and consumes memory subject to memory cgroup accounting.

## Required copy

> **The image is reusable input. A running container gets its own runtime filesystem state. Persist important data outside that disposable state.**

## Accuracy caveats

- “Writable layer” is a conceptual Docker term; implementation may be a containerd snapshot rather than legacy graph-driver layout.
- Bind mounts couple the container to host paths/permissions.

## Mobile behavior

Image at top, containers in vertical list, selected mount detail below.

## Accessibility

Radio group for persistence mode; deletion result announced via live region.

## Source anchors

- Docker storage drivers: https://docs.docker.com/engine/storage/drivers/
- Docker tmpfs: https://docs.docker.com/engine/storage/tmpfs/
- Docker storage overview: https://docs.docker.com/engine/storage/

## Acceptance checks

- Changing `web-a` never mutates the image or `web-b`/`web-c` state.
- Deletion semantics differ visibly by selected persistence mode.

---

# 14. Visual 6 — Trace `docker run`

## Purpose

Connect familiar Docker UX to engine/runtime/OCI/kernel layers without presenting them as one monolith.

## Learner question

> When I type `docker run`, who actually does what?

## Persistent scenario state

The image exists locally and the learner executes the canonical `docker run` command.

## Concepts and actors

- Docker CLI.
- Docker Engine API.
- `dockerd`.
- containerd.
- image content/snapshotter.
- runtime v2 shim.
- OCI runtime such as `runc`.
- OCI bundle/config concept.
- Linux kernel primitives.
- running `node server.js`.

## Composition

Full-width numbered sequence:

```text
1 docker CLI
    │ Engine API
2 dockerd
    │ request container/task
3 containerd
    ├─ resolve image/config
    ├─ prepare rootfs snapshot
    └─ choose runtime
4 containerd-shim-runc-v2
    │ invokes runtime engine
5 runc / OCI runtime
    │ namespaces+cgroups+mounts+credentials+process
6 Linux kernel
    │
7 node server.js (container PID 1)
```

An `OCI lens` drawer maps image spec → runtime bundle/config → runtime lifecycle.

## Interaction

**Hero interaction.**

Controls:
- `Run command`.
- `Next`.
- `Previous`.
- `Auto trace`.
- `Reset`.

Each step updates:
- highlighted actor;
- terminal/evidence text;
- “owns this decision” label;
- state shelf.

At the image-resolution stage, alternate branch `Image missing` shows registry pull before continuing.

## Data/content states

Example terminal/evidence:

```text
$ docker run ... infra-demo/node-app:v1
Docker client → Engine API request
Docker daemon: create container metadata
containerd: prepare snapshot + task runtime
shim: runtime control channel
runc: create/start OCI container
kernel: process running as ns PID 1 / host PID 18472
```

## Failure/edge state

`Image missing` branch:
- engine resolves/pulls manifest/config/layers from registry via distribution APIs;
- digest verified by content address;
- then runtime path proceeds.

## Required copy

> **Docker Engine provides the user-facing management model. containerd manages container lifecycle/content. A lower-level runtime creates the OS process according to OCI runtime configuration.**

Misconception:

> Common misconception: “Docker itself is the thing executing my application.”  
> Correct model: the final application is an OS process; engine/runtime components prepare and manage its execution context.

## Accuracy caveats

- This is the default Linux teaching path, not a guarantee that every container engine/runtime stack uses the same binaries.
- containerd supports multiple runtime implementations and shim models.

## Mobile behavior

Sequence becomes a numbered vertical timeline with terminal beneath current step.

## Accessibility

- Current step `aria-current="step"`.
- Previous/Next native buttons.
- Animation optional and disabled under reduced-motion preference.

## Source anchors

- Docker Engine: https://docs.docker.com/engine/
- Docker overview: https://docs.docker.com/get-started/docker-overview/
- containerd Runtime v2: https://github.com/containerd/containerd/blob/main/docs/runtime-v2.md
- OCI Runtime Spec: https://specs.opencontainers.org/runtime-spec/

## Acceptance checks

- CLI, daemon, containerd, shim, runtime, kernel, and app are separate actors.
- Registry branch appears only if image content is not local.
- Final node is the app process, not `runc` remaining as its permanent wrapper.

---

# 15. Visual 7 — Ride the Packet

## Purpose

Make container networking a concrete packet journey rather than a vocabulary list.

## Learner question

> How does `curl 127.0.0.1:8080` reach `node` on port 3000 inside the container?

## Persistent scenario state

`web` runs at `172.20.0.2:3000` on user-defined bridge `app-net`; host publishes `127.0.0.1:8080` to container port `3000`.

## Concepts and actors

- host loopback/interface binding.
- published port rule.
- host firewall/NAT/PAT behavior.
- bridge network.
- veth/interface pair concept.
- container `eth0`.
- route/network namespace.
- application socket `0.0.0.0:3000`.
- custom-network embedded DNS (`127.0.0.11`) for peer name resolution.
- outbound masquerading concept.

## Composition

Packet path:

```text
curl 127.0.0.1:8080
        │
        ▼
host port/firewall rule
        │
        ▼
bridge app-net
        │
   host-side veth
        ║
 container-side interface
        │
        ▼
eth0 172.20.0.2
        │
        ▼
node :3000
```

Peer DNS side-flow:

```text
web → DNS 127.0.0.11 → redis → 172.20.0.3
```

## Interaction

- `Next hop` / `Previous hop`.
- Toggle `Engine abstraction` / `Linux reality`.
- Toggle app bind address `0.0.0.0` vs `127.0.0.1` inside container.
- Toggle peer same network / different network.

## Data/content states

Host: `192.0.2.10`.
Container: `172.20.0.2`.
Redis: `172.20.0.3`.

## Failure/edge state

1. App binds only container-loopback `127.0.0.1:3000` → published path cannot reach expected interface endpoint.
2. Peer is moved off `app-net` → name/route reachability fails under the simplified scenario.
3. Port published as `-p 8080:3000` without explicit host IP → warning that Docker publishes to all host addresses by default.

## Required copy

> **A container network is a real network namespace with interfaces, addresses, routes, and host-side forwarding/firewall behavior—not a Docker-only virtual concept.**

## Accuracy caveats

- Firewall implementation may involve iptables/nftables depending on platform/version/configuration; draw “host firewall/NAT rules” as the stable abstraction.
- Docker bridge behavior is host-local; multi-host networking is a separate topic.

## Mobile behavior

Packet path becomes vertical naturally; DNS side-flow moves below.

## Accessibility

Current packet hop has text prefix `Current hop:` and not only a moving dot.

## Source anchors

- Docker bridge driver: https://docs.docker.com/engine/network/drivers/bridge/
- Docker port publishing: https://docs.docker.com/engine/network/port-publishing/
- Docker networking overview/DNS: https://docs.docker.com/engine/network/

## Acceptance checks

- User-defined bridge DNS appears.
- Port publishing is not drawn as “Docker proxy magic”; host rules/network path are visible.
- Host-IP binding warning is explicit.

---

# 16. Visual 8 — PID 1, Signals, and Container Lifecycle

## Purpose

Explain why container shutdown behavior depends on the application process model.

## Learner question

> Why does an app that runs fine interactively sometimes shut down badly in containers?

## Persistent scenario state

Inside its PID namespace, `node server.js` is PID 1 and may spawn worker children.

## Concepts and actors

- namespace PID 1.
- host PID mapping.
- signal delivery.
- graceful stop window concept.
- SIGTERM then forced termination concept.
- child processes/zombies/reaping.
- init helper concept such as `--init`/tini without making it mandatory.

## Composition

Process tree + stop timeline:

```text
container PID namespace
PID 1 node server.js
 ├─ PID 8 worker
 └─ PID 9 worker

stop request → termination signal → grace period → forced termination if still running
```

## Interaction

- `Spawn workers`.
- `Send SIGTERM`.
- toggle `App handles SIGTERM` yes/no.
- toggle `Init helper` on/off.
- `Force stop`.

## Data/content states

Good path: app logs “draining connections”, workers exit, process exits 0.
Bad path: app ignores/does not handle shutdown correctly; grace window expires; forced termination.

## Failure/edge state

Child process exits without proper reaping in simplified demo → zombie state appears; init-helper toggle demonstrates the role of a subreaper/reaper.

## Required copy

> **The container lifecycle becomes application process lifecycle. Signal handling and child-process behavior are production concerns.**

## Accuracy caveats

- Exact stop signal and timeout are engine/image/configuration dependent.
- Do not present a single fixed timeout as universal.

## Mobile behavior

Tree above timeline.

## Accessibility

Process states use text labels (`RUNNING`, `ZOMBIE`, `EXITED`).

## Source anchors

- OCI Runtime Spec lifecycle: https://specs.opencontainers.org/runtime-spec/
- containerd runtime v2 lifecycle: https://github.com/containerd/containerd/blob/main/docs/runtime-v2.md
- PID namespaces: https://man7.org/linux/man-pages/man7/pid_namespaces.7.html

## Acceptance checks

- Container PID 1 and host PID can both be shown.
- Graceful and forced shutdown are distinguishable.
- No universal hard-coded stop timeout in core copy.

---

# 17. Visual 9 — Security Boundary Builder

## Purpose

Show that security emerges from multiple controls rather than from “being inside a container.”

## Learner question

> If the kernel is shared, what reduces what the container process can do?

## Persistent scenario state

`web` runs as non-root image user with default/reduced capabilities, Docker’s default seccomp profile, read-only root filesystem, tmpfs `/tmp`, and no privileged mode.

## Concepts and actors

- process UID/GID.
- user namespaces/rootless mode concept.
- Linux capabilities.
- seccomp syscall filtering.
- AppArmor/SELinux LSM layer when present.
- read-only root filesystem.
- devices.
- privileged mode.
- host Docker socket as explicit dangerous deep-dive handoff.

## Composition

Concentric/stacked controls around process:

```text
process: node (UID node)
  ↓ capabilities
  ↓ seccomp
  ↓ user/namespace boundaries
  ↓ LSM policy (when configured)
  ↓ filesystem/device exposure
  ↓ shared host kernel
```

Side inspector:

```text
Privileged       OFF
Run as root      OFF
CAP_NET_ADMIN    OFF
Seccomp          DEFAULT
Rootfs           READ ONLY
User namespace   engine/config dependent
```

## Interaction

Controls:
- `Run as root`.
- `Add CAP_NET_ADMIN`.
- `Disable seccomp`.
- `Privileged`.
- `Read-only rootfs`.
- `Rootless/userns view`.

Each updates a “what newly becomes possible?” panel.

## Data/content states

A safe baseline and intentionally unsafe lab state.

## Failure/edge state

Attempt `mount`/network-admin-like action under safe baseline → denied. Toggle privileged → capability/device/LSM protections are shown as dramatically widened; explicit warning label.

## Required copy

> **Isolation is not the same as authorization. Treat the container as a restricted process on a shared kernel and remove unnecessary privilege.**

Misconception:

> Common misconception: “Root inside a container is harmless because it is inside the box.”  
> Correct model: credential mapping and granted capabilities matter; rootless/user namespaces can reduce host impact, but configuration must be understood.

## Accuracy caveats

- Docker default seccomp behavior can vary by platform/build and explicit overrides.
- LSM availability/configuration is host-specific.

## Mobile behavior

Controls above security stack; inspector below.

## Accessibility

Toggle labels state `ON/OFF`; unsafe states add `HIGH RISK` text.

## Source anchors

- Docker seccomp: https://docs.docker.com/engine/security/seccomp/
- Docker rootless mode: https://docs.docker.com/engine/security/rootless/
- Docker run/privileged behavior: https://docs.docker.com/engine/containers/run/

## Acceptance checks

- Privileged state visibly widens multiple controls rather than changing one badge.
- Read-only rootfs does not imply volume mounts are read-only unless configured so.
- Rootless and userns-remap are not conflated.

---

# 18. Visual 10 — Build → Tag → Push → Pull → Run

## Purpose

Connect local builds to portable OCI content and explain tags/digests/multi-stage output.

## Learner question

> What exactly is being pushed to a registry, and why can `latest` change while a digest does not?

## Persistent scenario state

`infra-demo/node-app:v1` is built locally, tagged, pushed to `registry.example/infra-demo/node-app:v1`, then pulled by another host.

## Concepts and actors

- build context.
- BuildKit/build output.
- multi-stage build.
- local image content.
- repository/tag.
- digest.
- manifest/config/layers.
- registry distribution API.
- optional image index for multi-platform image.

## Composition

Conveyor:

```text
source → build stages → final image → tag → registry → pull → verify digest → runtime
```

Below: `tag` and `digest` pointers:

```text
v1      ─┐
stable  ─┼──► manifest digest sha256:4ad7…
latest  ─┘

later:
latest ─────► different manifest digest
v1     ─────► original digest
```

Multi-stage mini-factory:

```text
builder stage: compiler/dev deps/source
              │ COPY --from
              ▼
runtime stage: only runtime artifacts
```

## Interaction

- `Move latest to v2`.
- `Pin by digest`.
- `Show multi-stage`.
- `Show multi-platform index`.

## Data/content states

Registry name is fictional `registry.example`.

## Failure/edge state

`latest` changes between deploys → two hosts resolve different content at different times; digest pinning demonstrates reproducibility trade-off.

## Required copy

> **Tags are convenient names; digests identify content. Registries distribute manifests/config/layers using standardized APIs.**

## Accuracy caveats

- Signature/SBOM/referrer mechanics belong to image-supply-chain deep dive.

## Mobile behavior

Conveyor becomes ordered vertical steps; tag/digest diagram below.

## Accessibility

Pointer state includes explicit target digest text.

## Source anchors

- OCI Distribution Spec: https://github.com/opencontainers/distribution-spec
- OCI Image Spec: https://github.com/opencontainers/image-spec
- Docker multi-stage builds: https://docs.docker.com/build/building/multi-stage/
- Docker build best practices: https://docs.docker.com/build/building/best-practices/

## Acceptance checks

- Changing a tag never changes the already-identified digest object in the visual.
- Multi-stage build discards build-only content from final runtime stage.

---

# 19. Visual 11 — Break/Fix the Container Lab

## Purpose

Teach a repeatable troubleshooting method using observable evidence and the mental model established earlier.

## Learner question

> The container is “up” or keeps restarting, but the app is broken. Where do I look first?

## Persistent scenario state

The same `web` container is deliberately broken in one of five deterministic ways.

## Concepts and actors

Diagnostics:
- `docker ps -a`.
- `docker logs`.
- `docker inspect`.
- `docker stats`.
- `docker top`.
- `docker network inspect`.
- process/signal state.
- mount/storage state.
- cgroup/resource state.

Failure presets:
1. App binds `127.0.0.1` inside container → published-path failure.
2. Wrong host-to-container port mapping.
3. Memory limit too low → OOM.
4. Volume permissions prevent write.
5. PID 1 exits immediately due to missing config/environment.

## Composition

Large workspace:

```text
┌ topology / host x-ray ─────┬ terminal ──────────────────────┐
│ packet / process / mounts  │ $ docker ps -a                │
│ current broken primitive   │ $ docker logs web             │
│                            │ ...                            │
├────────────────────────────┴────────────────────────────────┤
│ diagnostics action rail                                     │
├─────────────────────────────────────────────────────────────┤
│ Evidence board: symptom | evidence | first broken layer | fix│
└─────────────────────────────────────────────────────────────┘
```

## Interaction

**Hero interaction.**

- Select failure preset or `Random challenge` (deterministic seed per reload not required).
- Diagnostic buttons append realistic simulated command output.
- Learner selects suspected root cause.
- `Apply fix` becomes available after relevant evidence is collected, but do not hard-block exploration.
- Reset returns to healthy scenario.

The system should reward the correct mental model, not command memorization:

```text
SYMPTOM → OBSERVE → IDENTIFY LAYER → VERIFY → FIX → RE-TEST
```

## Data/content states

Failure 3 example:

```text
$ docker stats --no-stream web
MEM USAGE / LIMIT   511.8MiB / 512MiB

$ docker inspect web
... OOMKilled: true ...
```

Failure 1 example:

```text
$ docker exec web ss -lnt
LISTEN 127.0.0.1:3000
```

## Failure/edge state

The whole visual is failure-focused. At least five distinct root causes must be represented across network, resource, storage, and process lifecycle layers.

## Required copy

> **Do not troubleshoot “the container” as one box. Identify whether the first broken layer is process, namespace/network, cgroup, filesystem/mount, security, or runtime configuration.**

## Accuracy caveats

- Simulated outputs must be plausible but labelled `Lab simulation`.
- Exact `docker inspect` JSON fields may vary by engine version; show only stable conceptual fields/labels in the approval prototype.

## Mobile behavior

Topology above terminal; action rail wraps; evidence board becomes stacked cards.

## Accessibility

- Terminal output is text, not image.
- New evidence announced politely via live region.
- Challenge can be completed without drag/drop.

## Source anchors

- Docker Engine: https://docs.docker.com/engine/
- Docker networking: https://docs.docker.com/engine/network/
- Docker resource constraints: https://docs.docker.com/engine/containers/resource_constraints/
- Docker storage: https://docs.docker.com/engine/storage/

## Acceptance checks

- Each diagnostic action changes at least terminal + evidence board or topology.
- No “restart container” shortcut solves every scenario.
- At least one challenge requires understanding application bind address, not Docker daemon state.

---

# 20. Visual 12 — Container vs VM, Remove Docker, and Orchestration Handoff

## Purpose

Close the conceptual loop and prepare the learner for Compose/ECS/Kubernetes without teaching those systems prematurely.

## Learner question

> What is the real boundary between a container, a VM, a container engine, and an orchestrator?

## Persistent scenario state

`web` is healthy. The page zooms out from process to host to fleet.

## Concepts and actors

Container stack:

```text
hardware
Linux kernel
container engine/runtime
isolated process(es)
```

VM stack:

```text
hardware
host/hypervisor layer
VM guest kernel
guest userspace/processes
```

Engine removal ending:

```text
REMOVE DOCKER

still visible:
processes
namespaces
cgroups
mounts/snapshots
veth/bridge/routes
capabilities/seccomp/LSM
OCI concepts/runtime implementation
```

Orchestration handoff:

```text
one host / containers
        ↓
Compose-style local grouping
        ↓
ECS / Kubernetes / other orchestrators
schedule · restart · roll out · discover · scale · attach policy/storage/network
```

## Interaction

- `Container` / `VM` comparison selector.
- `Remove Docker abstraction` button.
- `Scale to 100 containers` button reveals orchestrator responsibilities, not 100 DOM nodes.

## Data/content states

No cloud-provider-specific defaults in core visual.

## Failure/edge state

Question card:

> Can a Linux container directly run a Windows-kernel application just because the image contains Windows files?

Answer derives from kernel/OS compatibility rather than memorized vendor rule.

## Required copy

Final statement:

> **Docker is not the container. The container is the runtime isolation/control context around OS processes. Docker and other engines make that model usable; orchestrators manage it at fleet scale.**

## Accuracy caveats

- Hypervisor architectures differ; keep VM comparison conceptual.
- Orchestrator runtime interfaces differ; do not imply Kubernetes requires Docker.

## Mobile behavior

Container and VM stacks appear one after the other.

## Accessibility

Remove-Docker action updates a textual inventory of remaining primitives.

## Source anchors

- OCI overview: https://opencontainers.org/about/overview/
- containerd runtime architecture: https://github.com/containerd/containerd/blob/main/docs/runtime-v2.md
- Docker Engine overview: https://docs.docker.com/engine/

## Acceptance checks

- Shared-kernel difference is explicit.
- Removing Docker leaves the Linux primitives visible.
- Orchestrators are framed as managers of containers, not ingredients inside a single container.

---

# 21. Persistent page elements

## 21.1 Compact chapter navigation

Sticky, low-height navigation:

```text
Process → Isolation → Resources → Images → Storage → Runtime → Network → Lifecycle → Security → Distribution → Troubleshoot → Next
```

On mobile it becomes horizontally scrollable and must not exceed roughly 15% of viewport height.

## 21.2 Scenario ribbon

A 36–44 px persistent ribbon shows:

```text
web | node server.js | host PID 18472 | ns PID 1 | 172.20.0.2:3000 | 512MiB | HEALTHY
```

When sections intentionally break the scenario, status changes to the relevant explicit label: `OOM`, `PORT UNREACHABLE`, `WRITE DENIED`, `EXITED`.

## 21.3 Reality toggle

Where applicable:

```text
ENGINE ABSTRACTION | LINUX REALITY
```

This must never hide the core explanation; it changes labels/details, not whether the learner can understand the diagram.

## 21.4 Misconception markers

Use at most six, exactly where the model is corrected:

1. Container ≠ tiny VM.
2. Docker ≠ container.
3. Namespace ≠ resource limit.
4. Image ≠ running container.
5. Tag ≠ immutable identity.
6. Root-in-container ≠ automatically harmless.

---

# 22. Responsive and accessibility requirements

## Responsive

- 320 px minimum width.
- No page-level horizontal scrolling.
- Horizontal lifecycle diagrams convert to vertical timelines below ~760 px.
- Terminal stays selectable and wraps long output with controlled overflow.
- Large host X-rays use stacked regions rather than tiny scaled diagrams.
- Touch targets minimum ~44 px where practical.
- Sticky nav/ribbon combined height remains restrained.

## Accessibility

- All interactions are native buttons, radios, checkboxes, ranges, links.
- Use `aria-pressed`, `aria-current`, `aria-live`, and labelled fieldsets appropriately.
- Provide visible focus styles.
- Every dynamic visual has adjacent textual state.
- Never require hover.
- Never use color alone for status.
- `prefers-reduced-motion: reduce` removes moving packet/process animations and performs instant state changes.
- Terminal and diagrams maintain readable text at 200% zoom.
- Each major section includes a text takeaway even when JavaScript is disabled.

---

# 23. Prototype implementation contract

Create `containers-visual-prototype.html` as one self-contained file.

Required implementation:

- all 12 sections in narrative order;
- representative content for every section;
- fully working hero interactions for Visuals 1, 6, and 11;
- lighter but functional interactions for namespace, cgroup, image cache, storage, networking, PID 1, security, and tag/digest concepts;
- chapter nav;
- scenario ribbon;
- at least one alternate/failure state per relevant section;
- source links;
- responsive CSS;
- reduced-motion CSS;
- no external fonts/scripts/images;
- no build step.

The approval prototype is not expected to emulate a real kernel or Docker daemon. It must deterministically simulate state transitions while using technically correct labels and plausible evidence.

---

# 24. Integration guidance for Infra Illustrated

This page should follow the current project’s workspace-first visual direction used for Git, while adapting the workspace to container internals:

```text
Git page                         Containers page
-----------------------------    -----------------------------
repository explorer              host/process X-ray
Linux terminal                   Linux terminal
Git action rail                  engine/kernel action rail
state shelf                      PID/netns/cgroup/rootfs shelf
commit graph                     process/packet/runtime topology
```

Reuse the existing project typography, spacing, border, terminal, navigation, and state-chip primitives where possible.

The page should become the **Containers homepage**. Advanced nodes should link to later sub-pages rather than overloading the home page.

Recommended sub-page routes/names:

```text
/containers/namespaces
/containers/cgroups
/containers/images-buildkit
/containers/storage
/containers/networking
/containers/runtime-oci-containerd
/containers/process-lifecycle
/containers/security
/containers/registry-supply-chain
/containers/troubleshooting
```

Every sub-page needs a visible `Back to Containers` control that returns to the Containers homepage map/state.

---

# 25. Deep-dive handoffs

## Namespaces deep dive

Why separate: clone/unshare/setns semantics, namespace lifetime, nesting, user namespace mappings, time/cgroup namespaces are too detailed for the overview.

Entry: Visual 2.

Persistent object: the same `node` process observed from host and nested namespaces.

## cgroup v2 deep dive

Why separate: hierarchy, delegation, controller enablement, `cpu.max`, `cpu.weight`, `memory.max`, PSI, IO controls, and systemd delegation deserve dedicated treatment.

Entry: Visual 3.

Persistent object: `web` competing with a noisy-neighbor process tree.

## Images + BuildKit deep dive

Why separate: LLB/build graph, cache exporters, secrets, SSH mounts, reproducibility, multi-platform builds, build attestations.

Entry: Visual 4/10.

Persistent object: one source change through build graph to registry content.

## Container storage deep dive

Why separate: snapshotters, OverlayFS copy-up/whiteouts, volumes, bind propagation, permissions, database performance.

Entry: Visual 5.

Persistent object: one write to `/data/orders.db`.

## Container networking deep dive

Why separate: netns, veth creation, bridge FDB, routing, conntrack, NAT/firewall implementation, IPv6/direct routing.

Entry: Visual 7.

Persistent object: one packet.

## OCI/containerd/runc deep dive

Why separate: runtime bundles, `config.json`, shim API, task/container distinction, alternate runtimes, CRI.

Entry: Visual 6.

Persistent object: one `docker run` request transformed into an OCI process.

## Container security deep dive

Why separate: seccomp profiles, capability set semantics, user namespaces, LSM, devices, rootless networking, Docker socket/daemon trust boundary, runtime sandboxing.

Entry: Visual 9.

Persistent object: one attempted privileged syscall.

## Registry/supply-chain deep dive

Why separate: signatures, attestations, SBOMs, referrers, policy verification, promotion workflows.

Entry: Visual 10.

Persistent object: one manifest digest promoted from build to production.

---

# 26. Production-practice ending

End with a repeatable operating loop instead of a wall of best-practice bullets:

```text
1 Define
  process, ports, writable paths, runtime user, CPU/memory needs, shutdown behavior

2 Build small
  minimal runtime content, cache-aware Dockerfile, multi-stage where useful

3 Constrain
  explicit resources, least capabilities, seccomp, read-only rootfs where feasible

4 Connect deliberately
  user-defined networks, explicit port bindings, avoid accidental all-interface exposure

5 Persist deliberately
  durable data in appropriate volumes/storage; know bind-mount ownership and backup scope

6 Observe
  logs, exit codes, OOM/resource signals, health, network reachability, storage usage

7 Break it on purpose
  OOM, bad bind address, missing dependency, read-only write, SIGTERM handling

8 Pin and promote
  know tag semantics, use digests where reproducibility matters, scan/sign in dedicated supply-chain workflow

9 Re-test after changes
  image, runtime flags, kernel/runtime upgrades, network/security policy changes
```

Dangerous shortcuts to call out:

- `--privileged` as a “make it work” fix.
- unlimited resources in noisy multi-tenant hosts.
- `-p 8080:3000` without understanding host exposure.
- storing durable database data only in disposable runtime state.
- baking secrets into image layers.
- assuming `latest` means a stable immutable release.
- ignoring PID 1/signal behavior.

---

# 27. Page-level acceptance criteria

The page is complete only if a learner can answer these without memorized slogans:

1. Why is a Linux container still a Linux process?
2. What is the difference between a PID namespace and a cgroup?
3. Why can host PID and container PID differ?
4. Where does the container root filesystem come from?
5. What is shared when three containers use one image?
6. What data is lost when a container is deleted?
7. Why does a named volume survive the container lifecycle?
8. What happens between `docker run` and the application process?
9. What role does OCI play?
10. How does a published host port reach a process in a network namespace?
11. Why does application bind address matter?
12. Why does PID 1/signal handling matter?
13. Why is `--privileged` risky?
14. Why is a tag different from a digest?
15. How would you distinguish OOM, wrong port, bind-address, volume-permission, and immediate-exit failures?
16. Why does Kubernetes not fundamentally require Docker to be the container runtime?
17. What remains conceptually if the Docker abstraction is removed?

Prototype validation checks:

- JavaScript parses without errors.
- all internal nav targets exist.
- all buttons do something observable.
- hero visual resets are deterministic.
- no duplicate IDs.
- no third-party dependencies.
- no page-level horizontal scroll at 320 px.
- reduced-motion rules present.
- source links use primary/upstream documentation.

---

# 28. Source index

Primary/upstream references verified for this specification:

1. Docker Engine overview — https://docs.docker.com/engine/
2. Docker overview / client-daemon architecture — https://docs.docker.com/get-started/docker-overview/
3. Docker Engine API — https://docs.docker.com/reference/api/engine/
4. Docker resource constraints — https://docs.docker.com/engine/containers/resource_constraints/
5. Docker storage drivers and image/container writable state — https://docs.docker.com/engine/storage/drivers/
6. Docker containerd image store — https://docs.docker.com/engine/storage/containerd/
7. Docker OverlayFS driver — https://docs.docker.com/engine/storage/drivers/overlayfs-driver/
8. Docker tmpfs mounts — https://docs.docker.com/engine/storage/tmpfs/
9. Docker networking overview — https://docs.docker.com/engine/network/
10. Docker bridge network driver — https://docs.docker.com/engine/network/drivers/bridge/
11. Docker port publishing — https://docs.docker.com/engine/network/port-publishing/
12. Docker seccomp — https://docs.docker.com/engine/security/seccomp/
13. Docker rootless mode — https://docs.docker.com/engine/security/rootless/
14. Docker running containers / privileged mode — https://docs.docker.com/engine/containers/run/
15. Docker build cache — https://docs.docker.com/build/cache/
16. Docker build cache optimization — https://docs.docker.com/build/cache/optimize/
17. Docker multi-stage builds — https://docs.docker.com/build/building/multi-stage/
18. Docker build best practices — https://docs.docker.com/build/building/best-practices/
19. OCI overview — https://opencontainers.org/about/overview/
20. OCI Runtime Specification — https://specs.opencontainers.org/runtime-spec/
21. OCI Image Specification — https://github.com/opencontainers/image-spec
22. OCI Image Manifest Specification — https://specs.opencontainers.org/image-spec/manifest/
23. OCI Distribution Specification — https://github.com/opencontainers/distribution-spec
24. containerd Runtime v2 architecture — https://github.com/containerd/containerd/blob/main/docs/runtime-v2.md
25. Linux kernel cgroup v2 documentation — https://docs.kernel.org/admin-guide/cgroup-v2.html
26. Linux namespaces overview — https://man7.org/linux/man-pages/man7/namespaces.7.html
27. Linux PID namespaces — https://man7.org/linux/man-pages/man7/pid_namespaces.7.html
28. Linux UTS namespaces — https://man7.org/linux/man-pages/man7/uts_namespaces.7.html
29. Linux IPC namespaces — https://man7.org/linux/man-pages/man7/ipc_namespaces.7.html

---

# 29. Final reference mental model

> **Start with a process. Give it different views with namespaces. Put resource boundaries around it with cgroups. Give it an image-derived filesystem plus deliberate persistence. Connect it through a network namespace and host networking rules. Reduce its privilege. Let an engine/runtime assemble and manage those pieces. Then troubleshoot each piece as a real Linux primitive—not as an opaque “container box.”**
