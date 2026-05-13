# Docker Multi-Architecture Images — Deep Dive

Companion markdown document to `docker-multiarch.html` — detailed explanatory prose for each tab.

---

## Part 0: Why Multi-Arch?

### The Platform Fragmentation Problem

For most of computing history, "software" ran on one type of CPU. Intel's x86 dominated personal computers and servers. If you wrote a Windows executable or a Linux binary, it was implicitly for x86_64. There was no ambiguity.

Then ARM happened — but ARM was mostly phones and embedded devices. Docker, launched in 2013, initially targeted Linux servers running x86_64. A Docker image was essentially a Linux x86_64 binary package.

The world changed in November 2020 when Apple shipped the M1 Mac. Within months, millions of developers were running ARM64 laptops. Then AWS launched Graviton2 (ARM64) instances offering dramatically better price-performance. Suddenly, your `python:3.12` image that worked perfectly on Intel EC2 failed on Apple Silicon with a cryptic "no matching manifest" error.

The solution — multi-architecture images — predates Apple's Silicon Macs but became critical for everyday developers only afterward.

### What "No Matching Manifest" Actually Means

When Docker pulls an image, it asks the registry for the manifest list. If the manifest list contains entries for `linux/amd64` and `linux/arm64` but your client is running `linux/arm64` (Apple Silicon Linux VM), Docker finds the matching entry and proceeds normally.

But if you're running an older image that only built for `linux/amd64`, the manifest list has no `arm64` entry. Docker prints:

```
ERROR: no matching manifest for linux/arm64/v8 in the manifest list
```

This isn't a networking error or an authentication error — it's a platform compatibility error. The image literally doesn't have an ARM64 variant.

### The Developer Experience Goal

The promise of multi-architecture Docker is simple: `docker run nginx:latest` should work identically whether you're on an Intel Mac, an Apple Silicon Mac, a Raspberry Pi, or an x86_64 EC2 instance. The image tag is the same. The container behavior is the same. Only the underlying binary differs.

This is fundamentally what containerization promised: write once, run anywhere. Multi-arch images deliver on that promise for CPU architecture.

---

## Part 1: CPU Architectures Explained

### Registers: The Fundamental Difference

CPUs store data in registers — tiny, ultra-fast memory locations built into the processor. The number, size, and behavior of registers define an architecture.

x86_64 registers are named and accessible in different modes:
- General purpose: `rax`, `rbx`, `rcx`, `rdx`, `rsi`, `rdi`, `rbp`, `rsp`, `r8`-`r15`
- 64-bit wide (8 bytes each)
- Accumulator register `rax` used for return values and many instructions

ARM64 registers:
- 31 general purpose: `x0`-`x30` (64-bit) with `w0`-`w30` as 32-bit views
- `x30` is the link register (holds return address)
- No dedicated accumulator — all registers are symmetric
- Much simpler register model than x86

The architectural simplicity of ARM makes it more power-efficient: no complex instruction decoding, predictable instruction timing.

### Instruction Encoding

x86_64 uses variable-length instructions (1 to 15 bytes). The same opcode might mean different things based on prefixes. This complexity dates to the 8086 in 1978 and has accumulated since.

ARM64 uses fixed-length 4-byte instructions. Every instruction is exactly 32 bits. Decoding is simpler → lower power consumption, faster pipeline.

### Endianness

Both x86_64 and ARM64 are typically used in **little-endian** mode for desktop/server workloads (except IBM s390x which is big-endian). This means multi-byte values are stored least-significant byte first. Network protocols and some legacy systems use big-endian.

### Cross-Compilation Toolchains

Building software for multiple architectures without physical hardware for each requires cross-compilers:

| Target | Cross-Compiler Package | Notes |
|---|---|---|
| ARM64 (on x86_64) | `gcc-aarch64-linux-gnu` | GNU toolchain for ARM64 |
| ARM64 (on x86_64) | `clang --target=aarch64-linux-gnu` | LLVM/Clang |
| ARMv7 (on x86_64) | `gcc-arm-linux-gnueabihf` | ARM hard-float |
| s390x (on x86_64) | `gcc-s390x-linux-gnu` | IBM Z |
| x86_64 (on ARM64) | `gcc-x86_64-linux-gnu` | Reverse cross-compile |

Docker buildx uses these automatically when native toolchains are available. When they're not, it falls back to QEMU emulation.

---

## Part 2: Operating Systems & Base Images

### musl vs glibc: The Hidden Architecture Difference

Alpine Linux uses `musl libc` instead of `glibc`. This matters for compiled software:

- Most official language images (Python, Node, Go) ship with statically linked binaries that work on both glibc and musl systems
- But some binaries compiled on Debian/Ubuntu (glibc) won't run on Alpine without recompilation
- Example: Docker's official `docker` CLI binary works on Alpine because it's statically linked

The Go toolchain produces statically linked binaries by default, which is why Go-based images (like `golang:alpine`) work everywhere.

Python's official images ship pre-compiled wheels for multiple platforms. The pip install process downloads the correct wheel for your architecture from PyPI.

### Multi-Stage Builds and Architecture

A typical Dockerfile for a compiled language:
```dockerfile
FROM golang:1.22 AS builder
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o myapp

FROM alpine:3.19
COPY --from=builder /src/myapp /myapp
ENTRYPOINT ["/myapp"]
```

The `golang` image must match the target architecture. If building for ARM64 on an x86_64 host, you'd use `--platform linux/arm64` with a cross-compiling Go toolchain.

### Windows Container Isolation Modes

Windows containers support two isolation modes:
- **Process isolation**: Container shares the host's Windows Server kernel (default, more efficient)
- **Hyper-V isolation**: Container has its own minimal kernel (more secure, required for some scenarios)

Hyper-V isolation creates a lightweight VM for each container. This has performance overhead but stronger tenant isolation. Azure Container Instances use Hyper-V isolation by default for multi-tenant scenarios.

---

## Part 3: Single-Arch Image Anatomy

### Layer DAG (Directed Acyclic Graph)

Docker images are stored as a DAG of layers. Each layer represents a filesystem diff. Layers are immutable and content-addressable.

```
Layer 3 (COPY app /app)       ← most specific
    ↑
Layer 2 (RUN pip install)     ← depends on Layer 1
    ↑
Layer 1 (COPY requirements.txt)
    ↑
Layer 0 (FROM python:3.12)     ← base image layer
```

When pulling, Docker downloads layers in parallel. Layer 0 might be a 100 MB Python base layer. Layers 1-3 might be only a few MB each (the application code).

### The Container Image Spec (OCI)

The Open Container Initiative defines standards for container images:
- **Image Manifest**: describes the image for a specific platform (Docker Manifest V2, OCI Manifest)
- **Image Index**: a manifest list pointing to multiple platform-specific manifests
- **Image Layout**: directory structure for storing images on disk
- **Distribution Spec**: how images are transferred between registries

Docker adopted OCI standards, so `docker` CLI works with any OCI-compatible registry (Docker Hub, ECR, ACR, GCR, Harbor, etc.)

### Config JSON Deep Dive

The image config contains:
```json
{
  "architecture": "arm64",
  "os": "linux",
  "config": {
    "Env": ["PATH=/usr/local/bin:/usr/bin:/bin"],
    "Cmd": ["/bin/sh"],
    "WorkingDir": "",
    "ExposedPorts": { "80/tcp": {} },
    "Entrypoint": ["nginx"],
    "Labels": { "maintainer": "NGINX Docker Maintainers" }
  },
  "rootfs": {
    "type": "layers",
    "diff_ids": ["sha256:abc...", "sha256:def..."]
  },
  "history": [
    {"created_by": "/bin/sh -c #(nop) CMD [\"nginx\"]"},
    {"created_by": "/bin/sh -c #(nop) EXPOSE 80/tcp"}
  ]
}
```

The `history` array is what `docker history` shows. Each entry corresponds to a Dockerfile instruction. `docker history` is useful for understanding what each layer added.

---

## Part 4: The Manifest List

### Schema Version 2 vs OCI Image Index

Docker originally defined its own Manifest V2 Schema 2. This was later contributed to the OCI project as the OCI Image Index specification. Both are structurally similar — the OCI version uses `application/vnd.oci.image.index.v1+json` media type instead of `application/vnd.docker.distribution.manifest.list.v2+json`.

Modern registries support both. `docker manifest inspect` handles either.

### Annotations on Manifest List Entries

Each platform entry in a manifest list can include annotations:
```json
{
  "platform": {
    "architecture": "amd64",
    "os": "linux",
    "variant": "v3",
    "os.version": "5.4.0",
    "features": ["pax_kernel", "seccomp"]
  },
  "annotations": {
    "org.opencontainers.image.description": "AMD64 build for linux 5.x kernel"
  }
}
```

The `variant` field disambiguates ARM versions: `v6` (ARMv6), `v7` (ARMv7), `v8` (ARMv8/AArch64).

### Local Manifest Cache

Docker caches manifests locally:
```bash
~/.docker/manifests/
├── docker.io_library_nginx_latest/
│   ├── manifest.json         ← the cached manifest list
│   └── sha256_<digest>/      ← per-manifest JSON files
```

This cache means `docker manifest inspect` works offline after the first pull. `docker pull` always fetches fresh from registry (unless using `docker pull --quiet` with local cache).

---

## Part 5: Registry Variant Resolution

### Docker Hub Automated Builds

Docker Hub's Automated Build system connects a GitHub repo to Docker Hub. On every git push:
1. GitHub webhook triggers Docker Hub
2. Docker Hub clones the repo
3. For each defined build rule (branch + tag mapping):
   - Runs `docker build` with the appropriate `--platform`
   - Pushes the resulting single-arch manifest
4. After all platforms build, generates and pushes the manifest list

The Dockerfile in the GitHub repo should use `FROM` base images that support the target platforms. If a base image is single-arch, the final image will be too.

### GitHub Actions with Buildx

Modern CI/CD uses GitHub Actions + Docker/setup-buildx-action:
```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: myrepo/myimage:latest
```

Builds run in parallel on Docker's build servers (or self-hosted runners with buildx). Each platform gets its own build container. Buildx orchestrates them and merges manifests into a manifest list.

### Authentication and Registry Scoping

When pushing to a private registry:
1. `docker login registry.example.com`
2. Credentials stored in `~/.docker/config.json`
3. Buildx uses these credentials when pushing each platform variant
4. Each push is authenticated per registry (supports different creds for different registries)

---

## Part 6: Buildx

### BuildKit Architecture

BuildKit is Docker's next-generation build backend. Key improvements over classic build:
- **Parallel builds**: Independent Dockerfile instructions run concurrently
- **Incremental builds**: Only changed layers are rebuilt (better caching)
- **Better caching**: Cache can be exported to registries, GitHub Actions, or local
- **Container-based builds**: Sandboxed build environment
- **QoS**: Better handling of resource constraints

Buildx exposes BuildKit functionality via the familiar `docker build` interface.

### QEMU vs Native Cross-Compilation

QEMU user-mode emulation works by:
1. Registering binfmt_misc handlers for foreign architectures on the host
2. When the kernel encounters a binary for a foreign arch, it invokes QEMU
3. QEMU translates the foreign binary's instructions to host instructions on the fly
4. JIT compilation makes this fast enough for builds (slower than native, faster than full VM)

For Go and Rust (which produce statically linked binaries), QEMU is very effective. For C/C++ projects using autotools or cmake, native cross-compilers (gcc-aarch64-linux-gnu) are much faster and more reliable.

### Remote Builders

Docker buildx supports remote builders for CI/CD:
```bash
docker buildx create \
  --name remote-builder \
  --driver docker-container \
  --url tcp://builder-server:2376 \
  --use
```

The remote builder runs as a container on the remote Docker host. This keeps build resources isolated from the developer's machine. Remote builders can be ARM64 machines (like AWS Graviton instances) for native, fast ARM64 builds.

---

## Part 7: Cross-Platform Push & Pull Flow

### Parallel Upload Architecture

Modern registries support parallel blob uploads. When pushing a large image:
1. Client initiates resumable upload session
2. Client streams layer tar file in chunks (typically 1MB-10MB per chunk)
3. Registry acknowledges each chunk, allowing resumption on failure
4. After all chunks, registry assembles and verifies SHA256
5. Manifest (or manifest list) pushed last, referencing confirmed blob digests

This makes pushing multi-arch images faster: each platform's layers can upload simultaneously.

### The Manifest List Digest Chain

The tag `myrepo/app:latest` points to the manifest list digest (not a manifest). This is critical:

```
Tag: myrepo/app:latest
  → digest: sha256:ABCD1234... (the manifest list's SHA256)

Manifest List (sha256:ABCD1234...)
  → manifests[0]: sha256:EFGH5678... (amd64 manifest)
  → manifests[1]: sha256:IJKL9012... (arm64 manifest)

Manifest (sha256:EFGH5678... for amd64)
  → config: sha256:CONF0001...
  → layers: [sha256:LAYR001..., sha256:LAYR002...]

Manifest (sha256:IJKL9012... for arm64)
  → config: sha256:CONF0002...
  → layers: [sha256:LAYR001... (same base!), sha256:LAYR003...]
```

The tag-to-manifest-list digest mapping is stored in the registry's tag index. The manifest list digest is immutable — changing the list (adding a new platform) changes the digest, requiring a new tag push.

### Concurrent Pull Optimization

When multiple platforms share base layers (very common), a concurrent pull of two platform variants downloads the shared base layer only once. Docker's layer caching is content-addressable, so the second pull recognizes the already-downloaded base layer by its digest.

---

## Part 8: Windows Containers

### Windows Container Internals

Windows containers use a different isolation architecture than Linux containers:

- **Process-isolated Windows containers** (default on Windows Server): share the Windows kernel with the host. The container runs as an isolated process namespace but uses the same kernel binaries. This is similar to how Linux containers share the Linux kernel.

- **Hyper-V isolated Windows containers**: the container runs inside a lightweight Hyper-V VM with its own kernel. This provides stronger isolation (required for untrusted workloads) at the cost of some performance.

Windows containers cannot run on Windows 10/11 Home (only Pro/Enterprise/Education with Docker Desktop). Windows Server is required for production Windows container workloads.

### Windows Server Core vs Nano Server

Server Core contains the full Windows Server GUI stack and all traditional Windows server roles:
- Full cmd.exe, PowerShell with all modules
- .NET Framework 4.x (full)
- MSI installers work
- Slightly smaller than full Windows Server with Desktop Experience

Nano Server is the minimalist Windows Server for cloud-native scenarios:
- No GUI, no cmd.exe, minimal PowerShell
- .NET Core only (not .NET Framework)
- ~350 MB vs ~5 GB (compressed)
- Designed for containers and IoT scenarios

### Windows Image Version Compatibility Matrix

Windows containers have strict version compatibility:
- Windows 10 (Pro/Enterprise) 1909+ can run containers built for Windows 10 or Windows Server
- Windows Server 2022 can run containers built for Windows Server 2022, 2019, and 2004
- Windows Server 2019 containers can run on Windows Server 2019 and Windows 10 1809+
- Windows 10 containers cannot run on Windows Server (only Windows 10)

This means the manifest list for `mcr.microsoft.com/windows/servercore:ltsc2022` includes entries for multiple Windows versions, and the Docker client selects the most compatible one for the host.

### Building Windows Containers in CI

GitHub Actions with Windows runners can build Windows containers natively:
```yaml
jobs:
  build:
    runs-on: windows-latest  # Windows Server 2022
    steps:
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v5
        with:
          platforms: windows/amd64
          push: true
          file: Dockerfile.windows
          tags: myrepo/winapp:latest
```

No QEMU needed — the Windows runner natively executes Windows binaries.

---

## Part 9: Real-World Examples & Manifest Inspector

### What You'll See in the Interactive Inspector

The interactive manifest inspector on this page fetches:
```
docker manifest inspect <image>
```

For `nginx:latest`, you'll see entries like:
- `linux/amd64`: 140+ MB compressed, NGINX 1.25.x, Alpine 3.18 base
- `linux/arm64`: Same NGINX version, ARM64 binaries, Alpine 3.18 base
- `linux/arm/v7`: For Raspberry Pi, ARM v7 hard-float

For `python:3.12`, add s390x and see the IBM Z mainframe variant.

For Microsoft .NET images, you'll see both `linux/amd64` and `windows/amd64` — demonstrating that some images truly span operating systems, not just architectures within the same OS.

### Size Differences Across Architectures

In most cases, the compressed layer sizes for the same image across architectures are very similar. The largest layer is typically the language runtime (Python interpreter, Node.js, JVM). These are typically within 5-10% of each other in compressed size.

Windows images can be dramatically different in size because:
1. Windows Server Core is ~5 GB compressed vs Alpine at ~3 MB
2. Different Windows cumulative update patches create different layer content
3. Different base Windows versions have different feature sets

### Cached Layer Analysis

When you `docker history <image>`, you see each layer and its size. Layers marked `<missing>` are layers that exist in the remote image but haven't been downloaded locally.

The `docker images --digests` command shows the full content-addressable digest per image, which lets you verify you're running exactly the bits you think you are.