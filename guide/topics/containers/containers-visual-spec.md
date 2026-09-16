# Containers, Illustrated — Visual specification

**Status:** Integrated refactor; design and factual review 2026-09-16. **Version:** 2.0.
**Audience:** Working developers moving into DevOps, SRE and cloud infrastructure.
**Page promise:** Watch one Node process acquire its filesystem, isolation, resource controls, and lifecycle as it becomes a container.
**Persistent scenario:** node server.js on buildbox-01, host PID 18472; after namespace setup the same process is PID 1 inside its container, serving port 3000.
**Scope:** Linux process isolation, namespaces, cgroups, image/run state, Docker lifecycle, networking, least privilege, distribution and diagnosis.
**Non-goals:** Complete OCI implementation, every storage driver, kernel exploit analysis, Kubernetes orchestration internals and Windows containers.
**Visual thesis:** Build one process into a container while retaining the host kernel as the visible foundation.

## Semantic visual grammar

Use the confirmed dark console tokens from `src/styles/global.css`: cyan is live data movement, violet is lookup/namespace/secret context, green is resolved or allowed state, amber is waiting/pressure, and red is blocked state. Solid arrows carry runtime traffic or protocol messages; dashed connectors mark lookup/configuration. A packet pulse, newly enclosing process boundary, or SSH NEWKEYS tunnel transition highlights only the changed actor or path. Every color state also has a text label, border, or connector style.

## Concept groups and narrative

The native disclosure index groups views as **Build the boundary**, **Image and runtime**, **Run and communicate**, **Operate the boundary**, **Security and distribution**, **Operate and compare**. The default active view is **From process to container**. Selection opens only its group and updates a current/total counter.

| # | Index group / view | Core learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Build the boundary / From process to container | What extra mechanisms turn node server.js into a container? | Host process list remains outside a visibly layered container execution context; namespaces, rootfs, cgroup and policy surround the same process above one host-kernel rail | Step, play/pause, failure | Containers isolate and constrain processes while sharing the host kernel. |
| 2 | Build the boundary / Namespace views | Why does PID 1 inside still have a different host PID? | A host process line branches into separate PID, mount and network lenses, then rejoins on one shared-kernel rail | Manual inspection and alternate state | Namespace isolation is a set of separate views around ordinary host processes. |
| 3 | Build the boundary / cgroup controls | Does container isolation automatically reserve CPU and memory? | Process group leads into two usage gauges and a pressure outcome, visually separate from the namespace lenses | Manual inspection and alternate state | Namespaces alter views; cgroups account for and constrain resource use. |
| 4 | Image and runtime / Build cache | Why does a Dockerfile sometimes reinstall dependencies after a tiny code edit? | Dockerfile order at left is mapped to CACHED/REBUILT statuses at right after editing server | Manual inspection and alternate state | Build cache is about inputs to build steps; it is separate from a running container’s writable state. |
| 5 | Build the boundary / Image and writable layer | Why does a new container not keep the files from a previous one? | Read-only image layer stack feeds three separate running instances; only the selected container has a writable layer and independent volume path | Manual inspection and alternate state | Build output becomes immutable image layers; container-local writes belong to that container’s writable layer. |
| 6 | Run and communicate / Trace docker run | What does the runtime do between a command and a listening service? | Command ribbon feeds Docker/runtime and container swimlanes; host:8080 → container:3000 is a separate publication strip | Step, play/pause, failure | The image is input; the runtime creates the runnable container and starts its configured process. |
| 7 | Run and communicate / Packet to the process | How does a client on host port 8080 reach node server.js on port 3000? | Directional client → host port rule → container attachment → process rail, with listener scope below | Manual inspection and alternate state | A published host port and an application listener are separate requirements. |
| 8 | Operate the boundary / Limits and signals | What happens when the process needs more memory or receives a stop request? | PID 1 and workers sit over a resource meter and a stop/pressure/exit timeline | Manual inspection and alternate state | Isolation does not replace capacity planning, safe shutdown, or least-privilege configuration. |
| 9 | Security and distribution / Security controls | What can a compromised process still do if the container is poorly configured? | One process is surrounded by four flat, separate control rails: namespace view, capability, syscall/LSM and host-mount policy | Manual inspection and alternate state | Treat the container as a configured process boundary, and reduce privileges and host access deliberately. |
| 10 | Security and distribution / Build to registry | What gets pushed and pulled when this app moves to another host? | Five-stage build → tag → push → pull → run rail ends in a tag/digest identity comparison | Manual inspection and alternate state | Use tags to discover versions and digests to identify exact image content. |
| 11 | Operate and compare / Break and diagnose | Why does the container show “running” while callers still fail? | Process → listener → published port → resource → storage ladder with a highlighted loopback-only trap | Step, play/pause, failure | Inspect process, listener, network path, mounts, and resource events as separate claims. |
| 12 | Operate and compare / Container versus VM | Where does the kernel boundary sit in each model? | Two parallel kernel ownership stacks compare host-kernel container with guest-kernel VM; bottom handoff shows containers inside a VM | Manual inspection and alternate state | A container isolates a process context; a VM supplies a separate guest operating system and kernel. |

## Per-visual contracts

### Visual 1 — A container starts as an ordinary Linux process

#### Purpose

Resolve “What extra mechanisms turn node server.js into a container?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What extra mechanisms turn node server.js into a container?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Process** and can advance to **Policy**.

#### Concepts and actors

Host process, PID namespace, rootfs, cgroup, security policy and host kernel.

#### Composition

Build the boundary / From process to container in the one persistent console. Host process list remains outside a visibly layered container execution context; namespaces, rootfs, cgroup and policy surround the same process above one host-kernel rail. The active view’s actor labels and state cues stay in the canvas; A container is not a small VM. The runtime starts a host process with namespaces, cgroup membership, a root filesystem, and configured security restrictions. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Process.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Remove namespace boundary**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Process:** host PID 18472 runs node server.js
- 2. **Namespaces:** PID, mount, network, UTS and IPC views
- 3. **Rootfs:** image-derived filesystem view
- 4. **cgroup:** resource accounting and limits
- 5. **Policy:** capabilities, seccomp and LSM rules
- Observable fixture: $ ps -o pid,ppid,cmd -p 18472 / 18472  1312 node server.js

#### Failure or edge state

The process now sees the host’s corresponding namespace. Isolation is not an all-or-nothing property supplied by the image.

#### Required copy

Canvas labels: Process → Namespaces → Rootfs → cgroup → Policy. Bottom takeaway: “Containers isolate and constrain processes while sharing the host kernel.”

#### Accuracy caveats

The exact setup belongs to the runtime and host configuration. Namespaces and cgroups are Linux mechanisms; their security properties depend on configuration.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://specs.opencontainers.org/runtime-spec/), [primary source](https://man7.org/linux/man-pages/man7/namespaces.7.html)

#### Acceptance checks

- Host PID 18472 and inside PID 1 refer to the same process; no guest kernel appears.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 2 — Namespaces change what the process can see

#### Purpose

Resolve “Why does PID 1 inside still have a different host PID?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why does PID 1 inside still have a different host PID?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Host view** and can advance to **Network view**.

#### Concepts and actors

Host PID, namespace PID, mount view, network interfaces/routes/localhost.

#### Composition

Build the boundary / Namespace views in the one persistent console. A host process line branches into separate PID, mount and network lenses, then rejoins on one shared-kernel rail. The active view’s actor labels and state cues stay in the canvas; The process can have distinct PID, mount, network, UTS, and IPC views. The host still schedules it. A namespace alters a selected view; it does not create a second kernel. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Host view.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Use host network** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Host view:** host PID 18472
- 2. **PID view:** PID 1 inside the container
- 3. **Mount view:** different root filesystem and mounts
- 4. **Network view:** separate interfaces, routes, and localhost
- Observable fixture: Illustrative: host PID 18472 ↔ namespace PID 1

#### Failure or edge state

With host networking selected, the process shares the host network namespace; localhost and port binding behave differently.

#### Required copy

Canvas labels: Host view → PID view → Mount view → Network view. Bottom takeaway: “Namespace isolation is a set of separate views around ordinary host processes.”

#### Accuracy caveats

User namespaces and their mappings are optional and vary by runtime configuration. Namespaces alone are not a complete security boundary.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://man7.org/linux/man-pages/man7/namespaces.7.html), [primary source](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)

#### Acceptance checks

- A namespace changes one view; host networking removes that particular isolated view.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 3 — A cgroup accounts for and can constrain resources

#### Purpose

Resolve “Does container isolation automatically reserve CPU and memory?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Does container isolation automatically reserve CPU and memory?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Place** and can advance to **Pressure**.

#### Concepts and actors

Processes, cgroup placement, CPU/memory usage and optional limits.

#### Composition

Build the boundary / cgroup controls in the one persistent console. Process group leads into two usage gauges and a pressure outcome, visually separate from the namespace lenses. The active view’s actor labels and state cues stay in the canvas; The kernel charges work to the process’s cgroup. Limits can bound use; without a configured memory limit, a container is not magically assigned a fixed memory budget. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Place.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Remove memory limit** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Place:** process joins its cgroup
- 2. **Account:** measure CPU and memory use
- 3. **Limit:** optional memory.max and CPU control
- 4. **Pressure:** reclaim or OOM handling can follow
- Observable fixture: Illustrative cgroup v2: memory.current < memory.max

#### Failure or edge state

The container still exists, but this cgroup has no configured memory ceiling from the container runtime.

#### Required copy

Canvas labels: Place → Account → Limit → Pressure. Bottom takeaway: “Namespaces alter views; cgroups account for and constrain resource use.”

#### Accuracy caveats

Controllers and available limits depend on host cgroup configuration. An OOM event is a kernel decision, not a Docker retry policy.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.kernel.org/admin-guide/cgroup-v2.html)

#### Acceptance checks

- No runtime memory ceiling is implied when one is not configured.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 4 — A source edit should invalidate only the work it touches

#### Purpose

Resolve “Why does a Dockerfile sometimes reinstall dependencies after a tiny code edit?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why does a Dockerfile sometimes reinstall dependencies after a tiny code edit?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Base** and can advance to **Source**.

#### Concepts and actors

Base image, package files, npm install, source copy and build cache.

#### Composition

Image and runtime / Build cache in the one persistent console. Dockerfile order at left is mapped to CACHED/REBUILT statuses at right after editing server.js. The active view’s actor labels and state cues stay in the canvas; Build cache reuses a step when its instruction and relevant inputs still match. Copying package files before source files lets a source-only edit reuse the dependency-install result. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Base.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Move COPY . . first** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Base:** FROM node:22 remains reusable
- 2. **Packages:** COPY package files
- 3. **Install:** RUN npm ci can be cached
- 4. **Source:** COPY server.js rebuilds after edit
- Observable fixture: Illustrative Dockerfile: COPY package*.json . / RUN npm ci / COPY . .

#### Failure or edge state

A source edit now affects the dependency-install inputs and can trigger avoidable work.

#### Required copy

Canvas labels: Base → Packages → Install → Source. Bottom takeaway: “Build cache is about inputs to build steps; it is separate from a running container’s writable state.”

#### Accuracy caveats

Modern builders can use mounts and optimizations beyond a one-instruction-one-layer sketch. The diagram shows a useful Dockerfile order, not a storage-driver implementation.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.docker.com/build/cache/optimize/)

#### Acceptance checks

- A source-only edit can reuse earlier dependency work when inputs remain unchanged.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 5 — An image is a template; a container adds runtime state

#### Purpose

Resolve “Why does a new container not keep the files from a previous one?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why does a new container not keep the files from a previous one?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Base** and can advance to **Volume**.

#### Concepts and actors

Image layers, container-local writes, three instances and explicit volume.

#### Composition

Build the boundary / Image and writable layer in the one persistent console. Read-only image layer stack feeds three separate running instances; only the selected container has a writable layer and independent volume path. The active view’s actor labels and state cues stay in the canvas; Images contain ordered filesystem changes. Starting a container adds a writable layer and runtime configuration. A volume is a separately managed mount, not image content. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Base.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Remove the container** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Base:** node:22 runtime files
- 2. **Dependencies:** npm ci layer
- 3. **App:** server.js layer
- 4. **Writable:** container-local changes
- 5. **Volume:** optional persistent mount
- Observable fixture: $ docker image history demo-api:1.0 / … COPY server.js /srv/server.js

#### Failure or edge state

Container-local writable data is removed with the container. Data that must outlive it belongs in an explicit volume or external store.

#### Required copy

Canvas labels: Base → Dependencies → App → Writable → Volume. Bottom takeaway: “Build output becomes immutable image layers; container-local writes belong to that container’s writable layer.”

#### Accuracy caveats

“Immutable” describes image content after it is created. Registries, tags, layers, and storage drivers have their own implementation details.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.docker.com/engine/storage/), [primary source](https://docs.docker.com/engine/containers/run/)

#### Acceptance checks

- Deleting web-a removes its local writes without mutating image or web-b/web-c.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 6 — docker run creates, configures, then starts

#### Purpose

Resolve “What does the runtime do between a command and a listening service?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What does the runtime do between a command and a listening service?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Resolve image** and can advance to **Publish**.

#### Concepts and actors

Docker image reference, create state, network attachment, PID 1 and port mapping.

#### Composition

Run and communicate / Trace docker run in the one persistent console. Command ribbon feeds Docker/runtime and container swimlanes; host:8080 → container:3000 is a separate publication strip. The active view’s actor labels and state cues stay in the canvas; Docker resolves an image, creates a container, supplies a writable layer and networking, then starts the configured process. The container remains running only while its main process runs. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Resolve image.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Stop PID 1**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Resolve image:** use local image or pull manifest and layers
- 2. **Create:** record config and writable layer
- 3. **Network:** attach interface and assign address
- 4. **Start:** exec node server.js as PID 1
- 5. **Publish:** optional host port → container port rule
- Observable fixture: $ docker run -p 8080:3000 demo-api:1.0 / Server listening on 3000

#### Failure or edge state

When the main process exits, the container stops. A background child process does not automatically keep the intended workload healthy.

#### Required copy

Canvas labels: Resolve image → Create → Network → Start → Publish. Bottom takeaway: “The image is input; the runtime creates the runnable container and starts its configured process.”

#### Accuracy caveats

Docker’s daemon and default bridge are common examples, not the universal container architecture. Other runtimes expose the OCI lifecycle differently.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.docker.com/engine/containers/run/)

#### Acceptance checks

- Image is input, runnable container and listener are later runtime states.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 7 — Published traffic still crosses several boundaries

#### Purpose

Resolve “How does a client on host port 8080 reach node server.js on port 3000?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

How does a client on host port 8080 reach node server.js on port 3000?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Client** and can advance to **Listener**.

#### Concepts and actors

Client, host port, forwarding rule, container network, app listener.

#### Composition

Run and communicate / Packet to the process in the one persistent console. Directional client → host port rule → container attachment → process rail, with listener scope below. The active view’s actor labels and state cues stay in the canvas; A published port creates a host-side forwarding path into the container network namespace. In a common Linux bridge setup, traffic crosses host rules and a veth attachment before reaching the process listener. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Client.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Bind app to localhost** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Client:** connects to host :8080
- 2. **Publish rule:** host maps traffic toward container :3000
- 3. **Attachment:** traffic enters container network namespace
- 4. **Listener:** node server.js accepts :3000
- Observable fixture: Illustrative: host :8080 → container :3000

#### Failure or edge state

If the app listens only on 127.0.0.1 inside its namespace, the published path to its container address may fail.

#### Required copy

Canvas labels: Client → Publish rule → Attachment → Listener. Bottom takeaway: “A published host port and an application listener are separate requirements.”

#### Accuracy caveats

Bridge, veth, NAT, and rootless forwarding details depend on the runtime/network driver; the path is a common Linux example.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.docker.com/engine/network/drivers/bridge/)

#### Acceptance checks

- Published host port cannot reach an app that only binds unsuitable loopback scope.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 8 — Resource limits and lifecycle signals are real boundaries

#### Purpose

Resolve “What happens when the process needs more memory or receives a stop request?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What happens when the process needs more memory or receives a stop request?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Limit** and can advance to **Exit**.

#### Concepts and actors

Main process, child workers, cgroup memory, termination signal and possible forced exit.

#### Composition

Operate the boundary / Limits and signals in the one persistent console. PID 1 and workers sit over a resource meter and a stop/pressure/exit timeline. The active view’s actor labels and state cues stay in the canvas; A cgroup can account for and limit resources. Container PID 1 receives lifecycle signals and must handle them appropriately; the runtime can later escalate if the process does not exit. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Limit.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Simulate unhandled stop** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Limit:** memory.max constrains cgroup use
- 2. **Pressure:** kernel reclaims or selects a victim
- 3. **Stop:** runtime sends configured termination signal
- 4. **Exit:** PID 1 exits; container stops
- Observable fixture: $ docker stop demo-api / # runtime requests graceful termination

#### Failure or edge state

The process ignores or mishandles the graceful signal. After the configured grace period, the runtime may force termination.

#### Required copy

Canvas labels: Limit → Pressure → Stop → Exit. Bottom takeaway: “Isolation does not replace capacity planning, safe shutdown, or least-privilege configuration.”

#### Accuracy caveats

Exact OOM selection, signal handling, and runtime stop behavior depend on kernel, runtime, and configured timeout.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.docker.com/reference/cli/docker/container/stop/), [primary source](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)

#### Acceptance checks

- Graceful stop and forced termination are different outcomes, with no universal timeout claim.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 9 — Isolation and security controls address different risks

#### Purpose

Resolve “What can a compromised process still do if the container is poorly configured?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What can a compromised process still do if the container is poorly configured?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Namespace** and can advance to **Mounts**.

#### Concepts and actors

Untrusted process, privileges, syscall filtering, filesystem mounts and host.

#### Composition

Security and distribution / Security controls in the one persistent console. One process is surrounded by four flat, separate control rails: namespace view, capability, syscall/LSM and host-mount policy. The active view’s actor labels and state cues stay in the canvas; Namespaces limit what the process sees; capabilities, seccomp, Linux security modules, user mappings, and mount policy reduce what it may do. Host mounts and privileged mode can reopen dangerous paths. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Namespace.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Add privileged host mount** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Namespace:** separate selected views
- 2. **Capability:** remove unneeded kernel privileges
- 3. **Syscalls:** apply seccomp and LSM policy
- 4. **Mounts:** avoid broad host write access
- Observable fixture: Illustrative controls: cap-drop, read-only rootfs, restricted mounts

#### Failure or edge state

A broad writable host mount gives the process access outside its intended filesystem boundary.

#### Required copy

Canvas labels: Namespace → Capability → Syscalls → Mounts. Bottom takeaway: “Treat the container as a configured process boundary, and reduce privileges and host access deliberately.”

#### Accuracy caveats

No single switch makes a container fully secure. The effective boundary depends on kernel, runtime, user privileges, filesystem mounts, and workload needs.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.docker.com/engine/security/), [primary source](https://docs.kernel.org/userspace-api/seccomp_filter.html)

#### Acceptance checks

- Broad writable host mount crosses the intended filesystem boundary.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 10 — An image digest travels from build to deployment

#### Purpose

Resolve “What gets pushed and pulled when this app moves to another host?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

What gets pushed and pulled when this app moves to another host?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Build** and can advance to **Run**.

#### Concepts and actors

Builder, OCI manifest/config/layers, tag, digest, registry and target host.

#### Composition

Security and distribution / Build to registry in the one persistent console. Five-stage build → tag → push → pull → run rail ends in a tag/digest identity comparison. The active view’s actor labels and state cues stay in the canvas; The builder emits image metadata and content-addressed layers. A tag is a human-friendly pointer that can move; the digest identifies specific content. The runtime pulls the relevant manifest and layers before creating a container. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Build.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Move the tag** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Build:** produce manifest, config, and layers
- 2. **Tag:** name demo-api:1.0
- 3. **Push:** publish content to registry
- 4. **Pull:** resolve manifest/digest on target host
- 5. **Run:** start a new container from that image
- Observable fixture: Illustrative image reference: demo-api:1.0@sha256:4ad7…91c2

#### Failure or edge state

If a tag is repointed, two pulls at different times can resolve different content unless a digest is pinned.

#### Required copy

Canvas labels: Build → Tag → Push → Pull → Run. Bottom takeaway: “Use tags to discover versions and digests to identify exact image content.”

#### Accuracy caveats

Multi-platform indexes can point to platform-specific manifests. A pull selects content for the target platform rather than downloading every platform image.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://specs.opencontainers.org/image-spec/), [primary source](https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/)

#### Acceptance checks

- Tag may move; digest identifies content; a pull precedes a new runtime instance.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 11 — Find the failing boundary before rebuilding the image

#### Purpose

Resolve “Why does the container show “running” while callers still fail?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Why does the container show “running” while callers still fail?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Process** and can advance to **Storage**.

#### Concepts and actors

PID 1, socket binding, host publication, cgroup events and mounts.

#### Composition

Operate and compare / Break and diagnose in the one persistent console. Process → listener → published port → resource → storage ladder with a highlighted loopback-only trap. The active view’s actor labels and state cues stay in the canvas; A running PID 1 proves that a process exists. It does not prove that the app listens on the right address, that the port is published, or that the container has permission and memory to answer. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Process.

#### Interaction

Manual previous/next and checkpoint selection, play/pause, and **Inject loopback bind**. Play resets to the first checkpoint and stops after the final one; selecting another view pauses it.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Process:** is PID 1 still running?
- 2. **Listener:** is app bound to the container address?
- 3. **Publish:** does host :8080 map to :3000?
- 4. **Resource:** check cgroup/OOM events
- 5. **Storage:** check mount paths and permissions
- Observable fixture: Illustrative checks: docker ps / docker logs / ss -ltn / cgroup events

#### Failure or edge state

The process is healthy but listens only inside its own loopback; traffic forwarded to the container address cannot reach that listener.

#### Required copy

Canvas labels: Process → Listener → Publish → Resource → Storage. Bottom takeaway: “Inspect process, listener, network path, mounts, and resource events as separate claims.”

#### Accuracy caveats

Example commands and output vary by runtime and host network driver. Treat this as a diagnostic order, not a universal CLI transcript.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.docker.com/engine/containers/run/), [primary source](https://docs.docker.com/engine/network/drivers/bridge/)

#### Acceptance checks

- A RUNNING process is not proof of a reachable service.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

### Visual 12 — Containers and VMs isolate at different layers

#### Purpose

Resolve “Where does the kernel boundary sit in each model?” by making the relevant actors, boundaries, and changed state visible.

#### Learner question

Where does the kernel boundary sit in each model?

#### Persistent scenario state

node server.js · host PID 18472 · container PID 1. At this view the active checkpoint begins at **Container** and can advance to **Together**.

#### Concepts and actors

Application process, namespaces/cgroups, host kernel, virtual hardware and guest kernel.

#### Composition

Operate and compare / Container versus VM in the one persistent console. Two parallel kernel ownership stacks compare host-kernel container with guest-kernel VM; bottom handoff shows containers inside a VM. The active view’s actor labels and state cues stay in the canvas; A Linux container runs host-kernel-scheduled processes with isolated views. A VM runs a guest kernel over virtualized hardware. They are often stacked together in cloud environments. sits in the contextual inspector to the right or below, and the takeaway stays in the bottom strip. Default checkpoint: Container.

#### Interaction

Direct checkpoint selection and previous/next inspect the states without a timed simulation. **Show privileged container** exposes the alternate state.
Tab/Enter/Space operate all controls. Selecting a checkpoint clears an injected failure; the failure button can be toggled off.

#### Data or content states

- 1. **Container:** app process shares host kernel
- 2. **Namespaces:** selected views differ
- 3. **VM:** guest OS has its own kernel
- 4. **Together:** many containers can run inside one VM
- Observable fixture: Model comparison: host kernel versus guest kernel

#### Failure or edge state

Broad host privileges can weaken the intended container boundary; the presence of a container label alone is not a security guarantee.

#### Required copy

Canvas labels: Container → Namespaces → VM → Together. Bottom takeaway: “A container isolates a process context; a VM supplies a separate guest operating system and kernel.”

#### Accuracy caveats

Strong isolation depends on implementation and configuration. This comparison is architectural, not a blanket security ranking.

#### Mobile behavior

Below 720 px, the visual’s horizontal relationship becomes a vertical reading path; actor order, connector direction, field labels and failure cues remain legible at 320 px. The inspector follows the canvas.

#### Accessibility

The named figure and surrounding heading provide a text summary. Native buttons and disclosure controls follow DOM order, selected checkpoint uses `aria-current="step"`, result changes are announced in a live region, focus is visible, and reduced motion shows the final selected state without a timed trace. Without JavaScript the whole view and explanation remain in narrative order.

#### Source anchors

[primary source](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)

#### Acceptance checks

- Container and VM isolation layers are distinct and can be stacked.
- The failure control marks the first relevant boundary and names observable evidence without relying on red color alone.

## Persistent console and deep-link contract

The canonical public route is `/containers`. Every major view uses its stable fragment (the view IDs in the narrative table). Browser refresh, direct fragment, back and forward select the correct view and open its index group. These are new routes, so no earlier public section aliases exist. Without JavaScript, all 12 figures, their explanations, the grouped index and sources remain stacked inside the same console.

The console contains brand and library navigation, Foundations breadcrumb, title, format/difficulty, publication/review dates, persistent scenario state ribbon, grouped disclosure index, one active canvas, right/bottom inspector, bottom takeaway and previous/current/next navigation, related visuals, primary sources and footer.

## Prototype implementation and quality contract

The self-contained `guide/topics/containers/containers-visual-prototype.html` is generated from the integrated static route with its CSS and JavaScript inlined. It covers the full narrative and controls in one console; it is a review artifact outside catalogue, routing and Pagefind. Its hero traces have manual steps, play/pause, and a material alternate failure.

Factual checks compare every actor, ordering, source value and failure boundary with the linked primary references. Narrative checks ensure the scenario persists and related mechanisms follow dependency order. HTML checks cover semantic controls, direct fragments/history, no-JavaScript stacked reading, keyboard/focus, reduced motion and source reachability. `npm run check`, `npm run build`, `npm run check:graph`, and `npm run check:links` are the publication commands. Browser screenshots at 320 px, 200% zoom and reduced motion remain a separate QA gate; the workspace could not bind a preview socket and Firefox crashed in its sandbox on 2026-09-16.

## Deep-dive handoffs

Published related visuals: [Linux processes](/linux/processes), [Pod networking and CNI](/pod-networking-cni), [Docker multi-architecture](/docker-multiarch). The console ends with these existing targets; proposed extensions wait until a canonical target is published. Keep this specification and its prototype outside the catalogue, routing, and search index.

## Page-level acceptance

- All 12 named figures, inspector explanations, failure copy, sources, and the grouped index are readable inside the same console with JavaScript disabled.
- Under enhancement, exactly one selected visual canvas is shown; selecting a new view opens only its concept group and preserves a stable fragment across refresh and history navigation.
- Every manual checkpoint updates its canvas state and named result, every selected hero trace can be paused and inspected, and its failure state marks a relevant boundary and evidence.
- Topic color and connector meaning follow the brief, while static comparisons remain static where movement adds no teaching value.
- Metadata, catalogue route, related links, source links, type check, static build, graph validation, and generated internal links all resolve.
- Browser review at desktop, 320 px, 200% zoom, keyboard, touch, reduced motion, and no JavaScript is recorded before this page is marked fully migration-complete.

## Integration guidance and status

Canonical metadata: `src/content/topics/containers.mdx`. Canonical route: `src/pages/containers.astro`. Neutral shell: `src/components/TopicConsoleShell.astro`; reusable console behavior: `src/components/foundations/ProtocolConsole.astro`; topic-specific visual forms: `src/components/foundations/VisualCanvas.astro`; source state: `src/components/foundations/protocol-data.ts`; reusable tokens/styles: `src/styles/protocol-console.css`. The prototype remains an approval artifact and must be regenerated after final production edits. Integration status: built and indexed on 2026-09-16; browser visual QA still pending.

## Source index

- [Docker — What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)
- [Docker — What is an image?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/)
- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec)
- [Linux kernel cgroup v2 documentation](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [Additional primary reference](https://specs.opencontainers.org/runtime-spec/)
- [Additional primary reference](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Additional primary reference](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)
- [Additional primary reference](https://docs.docker.com/build/cache/optimize/)
- [Additional primary reference](https://docs.docker.com/engine/storage/)
- [Additional primary reference](https://docs.docker.com/engine/containers/run/)
- [Additional primary reference](https://docs.docker.com/engine/network/drivers/bridge/)
- [Additional primary reference](https://docs.docker.com/reference/cli/docker/container/stop/)
- [Additional primary reference](https://docs.docker.com/engine/security/)
- [Additional primary reference](https://docs.kernel.org/userspace-api/seccomp_filter.html)
- [Additional primary reference](https://specs.opencontainers.org/image-spec/)
- [Additional primary reference](https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/)
