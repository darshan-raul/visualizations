# Docker Multi-Architecture Images — Outline

## Overview
Companion markdown document to `docker-multiarch.html` — comprehensive deep-dive into Docker multi-architecture image concepts and buildx workflow.

---

## Structure: 10 Parts

```
docker-multiarch.html
├── Part 0: Why Multi-Arch?
├── Part 1: CPU Architectures Explained
├── Part 2: Operating Systems & Base Images
├── Part 3: Single-Arch Image Anatomy
├── Part 4: The Manifest List (Multi-Arch Manifest)
├── Part 5: Registry Variant Resolution
├── Part 6: Buildx — Building for Multiple Platforms
├── Part 7: Cross-Platform Push & Pull Flow
├── Part 8: Windows Containers (nano / servercore)
└── Part 9: Real-World Examples & Manifest Inspector
```

---

## Part 0: Why Multi-Arch?

### 0.1 The Problem
- Docker images are tied to a specific instruction set architecture (ISA)
- An image built for `linux/amd64` will not run on ARM-based Macs (M1/M2)
- Developers increasingly have heterogeneous hardware (Apple Silicon, Intel Macs, EC2 x86, ARM Graviton instances)

### 0.2 Historical Context
- 2020: Apple Silicon (M1) launched — first mass-market ARM laptops
- AWS Graviton2 (ARM) instances offer 20-40% better price-performance vs x86
- Organizations now target: `amd64` (Intel/AMD), `arm64` (Apple Silicon, Graviton), `arm/v7` (Raspberry Pi), `s390x` (IBM mainframe)

### 0.3 The Solution
- One logical image name → multiple platform-specific image variants stored in a registry
- Client pulls the correct variant automatically based on `uname -m` / `uname -p`
- No conditional `Dockerfile` branching; single tag means same image everywhere

### 0.4 What You Can Target
| Platform | Aliases | Example Machines |
|---|---|---|
| `linux/amd64` | x86_64 | Intel Macs, Intel EC2, AMD EPYC servers |
| `linux/arm64` | aarch64 | Apple Silicon Macs, AWS Graviton2/3 |
| `linux/arm/v7` | armhf | Raspberry Pi 3/4 |
| `linux/s390x` | s390x | IBM Z mainframes |
| `windows/amd64` | win32-x86_64 | Windows Server, Windows containers |

---

## Part 1: CPU Architectures Explained

### 1.1 What Is a CPU Architecture?
- Instruction Set Architecture (ISA): the contract between hardware and software
- Defines: registers, data types, memory model, system calls, calling conventions
- Compilers (gcc, clang) emit machine code for a specific ISA

### 1.2 x86_64 (AMD64)
- Created by AMD in 2003 as 64-bit extension to Intel's x86
- Dominant in desktops, laptops, servers (Intel + AMD)
- Complex CISC design; hundreds of instructions, many with variable length
- High single-threaded performance; powers most cloud workloads
- Binary: compiled code runs natively on any Intel/AMD 64-bit CPU

### 1.3 ARM64 (AArch64)
- 64-bit ARM architecture (ARMv8-A onwards)
- Designed for power efficiency: more performance per watt than x86
- Powers: Apple Silicon (M1/M2/M3), AWS Graviton2/3, mobile devices, embedded
- Simpler RISC design; fixed-length instructions; cleaner design than x86
- Growing rapidly in cloud due to price/performance

### 1.4 ARMv7 (armhf)
- 32-bit ARM — common in IoT, Raspberry Pi 2/3/4
- Docker supports `linux/arm/v7` as a third-tier platform
- Many images ship a variant here

### 1.5 IBM s390x
- IBM Z mainframe architecture
- Used by IBM zSeries mainframes
- Docker supports `linux/s390x`
- Less common but fully supported by official images (e.g., `python`, `node`)

### 1.6 Why Cross-Compilation Matters
- Native compilation on each architecture is slow (build times × N architectures)
- Cross-compilation: compile on x86 for ARM and vice versa using tools like:
  - `gcc aarch64-linux-gnu` (ARM64 cross-compiler)
  - `docker buildx --platform` (uses QEMU or native cross-compilation)
- Docker BuildKit's buildx handles this transparently

---

## Part 2: Operating Systems & Base Images

### 2.1 Linux Distributions as Base Images
- `alpine` — minimal (5 MB), musl libc, BusyBox, designed for containers
- `debian` — full-featured, larger (120 MB+), glibc
- `ubuntu` — Debian-based, familiar tooling
- `distroless` — Google minimal images, no shell, just runtime
- `scratch` — empty image, no OS, just your binary (static binaries only)

### 2.2 libc Differences
- `glibc` (GNU): standard on debian, ubuntu, most x86 images
- `musl libc`: standard on alpine — smaller, slightly different behavior
- Some binaries compiled against glibc won't run on alpine (need recompile or static linking)
- Python/Node/Rust binaries often statically linked to avoid this

### 2.3 Windows Base Images
- `mcr.microsoft.com/windows/nanoserver` — minimal Windows Server base
- `mcr.microsoft.com/windows/servercore` — full Windows Server with GUI tools
- `mcr.microsoft.com/windows` — full Windows with desktop experience
- Windows base images are **much larger** (gigabytes vs megabytes for Linux)
- Cannot run Windows containers on Linux hosts (and vice versa)

### 2.4 Windows Versions in Tags
- `windows/servercore:ltsc2022` — Windows Server 2022
- `windows/nanoserver:ltsc2022` — Windows Server 2022 Nano
- `windows/servercore:2004` — Windows Server 2004 (older, rarely used now)
- Each Windows version has specific platform manifest entries

### 2.5 Why Base Images Are Platform-Specific
- Linux base images contain binaries compiled for a specific architecture
- `alpine:latest` on ARM64 is a different image binary than `alpine:latest` on x86
- They share the same tag but have different manifests pointing to different layer blobs
- The registry tracks this via the manifest list

---

## Part 3: Single-Arch Image Anatomy

### 3.1 What Makes Up a Docker Image?
A Docker image is a collection of read-only layers + a JSON manifest + a runtime configuration:

```
docker-image/
├── manifest.json         ← describes image for a specific platform
├── config.json           ← environment, entrypoint, cmd, volumes, etc.
└── layerN.tar            ← filesystem diffs, each layer is a tar+gzip
```

### 3.2 The Manifest (per-platform)
```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": {
    "mediaType": "application/vnd.docker.container.image.v1+json",
    "size": 7023,
    "digest": "sha256:abc123..."
  },
  "layers": [
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 45123456,
      "digest": "sha256:def456..."
    }
  ]
}
```

### 3.3 Layer Sharing
- Layers are content-addressable (by SHA256 digest)
- Two images sharing the same base layers only store those layers once
- Alpine's base layer might be shared across 10,000 images in a registry
- Reduces storage and pull bandwidth dramatically

### 3.4 The Config JSON
Contains:
- `architecture` and `os` fields
- `config` section: exposed ports, env vars, default command, working dir
- `rootfs` section: list of layer digests
- `history`: timestamps and creation info for each layer (used by `docker history`)

### 3.5 Content-Addressable Storage
- Each object in the registry is addressed by its SHA256 digest
- `sha256:abc123` always refers to the exact same bytes
- This enables deduplication, integrity verification, and parallel pulls

---

## Part 4: The Manifest List (Multi-Arch Manifest)

### 4.1 What Is a Manifest List?
- Top-level "index" pointing to multiple platform-specific manifests
- Also called "multi-arch manifest" or "image index"
- Allows a single tag (`nginx:latest`) to work across all architectures
- Added to Docker distribution spec v2.2 (2016)

### 4.2 Manifest List Structure
```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.list.v2+json",
  "manifests": [
    {
      "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
      "size": 7143,
      "digest": "sha256:aaa111...",      ← points to linux/amd64 manifest
      "platform": {
        "architecture": "amd64",
        "os": "linux",
        "os.version": "5.10.0"
      }
    },
    {
      "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
      "size": 7143,
      "digest": "sha256:bbb222...",      ← points to linux/arm64 manifest
      "platform": {
        "architecture": "arm64",
        "os": "linux",
        "variant": "v8"
      }
    }
  ]
}
```

### 4.3 How the Client Chooses a Variant
1. Client calls `docker pull nginx:latest`
2. Registry returns the manifest list
3. Client reads its own `architecture` and `os` from the kernel (`uname -m`, `uname -s`)
4. Client finds the matching `platform` entry in the manifest list
5. Client fetches that specific manifest (e.g., `sha256:aaa111...`)
6. Client downloads the layers referenced by that manifest

### 4.4 Manifest List Per Registry Call
- Not cached separately — the manifest list IS the response to `docker pull`
- Each tag pull: registry sends manifest list → client selects matching entry → downloads that manifest's layers

### 4.5 Why Not Just One Image Per Tag?
- Without manifest lists: one tag = one platform only
- Users would need `nginx:amd64` and `nginx:arm64` separate tags
- CI/CD would need conditional logic to select the right tag
- Docker Hub automatically builds multi-arch via manifest lists

---

## Part 5: Registry Variant Resolution

### 5.1 How Docker Hub Builds Multi-Arch Images
- Official images use GitHub Actions + Docker Buildx to build for multiple platforms
- Each platform builds in parallel (separate VM or QEMU emulation)
- Each build produces a single-platform manifest
- A manifest list is generated and pushed along with all manifests
- The single tag (`python:3.12`) resolves to the right variant per client

### 5.2 AWS ECR Variant Resolution
- ECR supports multi-arch manifests natively
- `aws ecr batch-get-image` returns all platform variants
- `docker pull` from ECR uses the same manifest list resolution
- ECR also supports WCI (Windows Container Image) variant support

### 5.3 Docker Manifest Inspect (Live Demo)
Use the interactive demo on this page to inspect any manifest list.
Paste an image reference and see:
- All platforms in its manifest list
- Per-platform layer digests and sizes
- Total compressed vs uncompressed image size per platform
- OS version info (for Windows images)

### 5.4 What Happens on Mismatched Architectures
- If no matching platform in manifest list → error: "no matching manifest"
- `docker pull` will error: "no manifest for linux/arm64 in manifest list" (if image doesn't support ARM)
- Solution: rebuild with `--platform` support, or find an alternative image

### 5.5 Feature Detection (OCI Index Annotations)
- Docker manifest lists can include `annotations` for human-readable notes
- `org.opencontainers.image.architecture` — canonical architecture name
- `org.opencontainers.image.variant` — variant like `v8` for ARM64
- OCI Image Spec defines standard annotations

---

## Part 6: Buildx — Building for Multiple Platforms

### 6.1 Docker Buildx Introduction
- Buildx is Docker's advanced build frontend (built on BuildKit)
- Enabled by default in Docker Desktop; install via `docker buildx` plugin on Linux
- Supports: multi-platform builds, build caching, parallel builds, remote builders

### 6.2 Creating a Multi-Platform Builder
```bash
# Create a builder with multi-platform support
docker buildx create --name mybuilder --use
docker buildx inspect mybuilder --bootstrap
```

### 6.3 The `--platform` Flag
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag myrepo/myimage:latest \
  --push \
  .
```
- Builds for both platforms in parallel
- Uses QEMU emulation (linux user-mode emulation) by default on native hosts
- Native cross-compilation when a native toolchain is available

### 6.4 QEMU User-Mode Emulation
- `qemu-user-static` provides linux-user emulation for foreign architectures
- Example: run ARM64 binaries on x86_64 host via CPU trap + translation
- Transparent to the build process
- Slow compared to native cross-compilation but requires no special setup
- Enabled by registering binfmt_misc handlers

### 6.5 Docker Bake (HCL Definition Files)
```hcl
# bake-definition.hcl
variable "TAG" { default = "myrepo/app:latest" }

group "default" {
  targets = ["image.amd64", "image.arm64"]
}

target "image.amd64" {
  platforms = ["linux/amd64"]
  tags = [var.TAG]
}

target "image.arm64" {
  platforms = ["linux/arm64"]
  tags = [var.TAG]
}

target "image.all" {
  platforms = ["linux/amd64", "linux/arm64", "linux/arm/v7"]
  tags = [var.TAG]
}
```
Run: `docker buildx bake -f bake-definition.hcl --push`

### 6.6 Build Secrets & SSH Forwarding
- BuildKit allows secure secret injection during build (no secrets in final image layers)
- `docker buildx build --secret id=aws,env=AWS_SECRETS`
- SSH agent forwarding for private registry authentication

### 6.7 Caching Build Layers
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --cache-from=type=registry,ref=myrepo/app:buildcache \
  --cache-to=type=registry,ref=myrepo/app:buildcache,mode=max \
  --push \
  .
```
- `mode=max` pushes all layers (not just final)
- Next build pulls cached layers → much faster incremental builds

---

## Part 7: Cross-Platform Push & Pull Flow

### 7.1 Full Build & Push Lifecycle (Step by Step)

```
Step 1: Developer runs: docker buildx bake --push
         │
Step 2: BuildKit spawns build container per platform
         │
         ├── [linux/amd64 builder]
         │      docker build → layers: L1, L2, L3
         │      manifest M1 created: config + layer refs
         │
         ├── [linux/arm64 builder via QEMU]
         │      docker build → layers: L1', L2', L3' (same content, different arch)
         │      manifest M2 created: config + layer refs
         │
         └── [linux/arm/v7 builder via QEMU]
                docker build → layers: L1'', L2'', L3''
                manifest M3 created: config + layer refs
         │
Step 3: Buildx generates Manifest List ML
         ML = [M1(amd64), M2(arm64), M3(arm/v7)]
         │
Step 4: All objects pushed to registry in parallel:
         registry/
         ├── blobs/ (layer tar files, shared across manifests)
         ├── manifests/
         │      ├── sha256:M1 (single-arch manifest for amd64)
         │      ├── sha256:M2 (single-arch manifest for arm64)
         │      └── sha256:M3 (single-arch manifest for arm/v7)
         └── manifest-list/
                └── sha256:ML (the manifest list, root of tag)
         │
Step 5: Tag `myrepo/app:latest` → points to sha256:ML (manifest list digest)
```

### 7.2 Pull Flow (Client-Side Resolution)

```
User runs: docker pull myrepo/app:latest
         │
Step 1: Docker client fetches manifest list for sha256:ML
         │
Step 2: Client reads os/arch from kernel (uname -s, uname -m)
         │
Step 3: Client searches manifest list for matching platform
         Found: sha256:M2 (arm64)
         │
Step 4: Docker fetches manifest M2 (arm64-specific)
         │
Step 5: Docker fetches layers referenced by M2
         (Note: layer blobs may be shared across platforms, fetched once)
         │
Step 6: Layers extracted to local storage
         Image ready to run!
```

### 7.3 Layer Sharing Optimization
- If all platform images share the same base layer (e.g., `alpine:3.19`), that blob is stored once
- Manifest M1, M2, M3 all reference the same base layer digest
- On pull, the base layer is downloaded once regardless of architecture
- Subsequent pulls of any variant reuse that cached layer

### 7.4 Cross-Architecture Layer Sharing Caveats
- Base image layers may differ in actual bytes (x86 glibc vs ARM musl)
- But the same logical layer (e.g., `COPY --from=base /lib /lib`) may compile to different files
- Docker handles this: each platform's layers are independent blobs
- Shared digests only when content is identical (which for base images, it usually isn't — different binaries)

---

## Part 8: Windows Containers

### 8.1 Windows Container Basics
- Windows containers run on Windows hosts only (cannot run on Linux)
- Two base image families: Nano Server (minimal) and Server Core (full compatibility)
- Windows images are large: Server Core ~5 GB, Nano Server ~350 MB
- Multi-arch manifest lists for Windows include multiple Windows versions

### 8.2 Windows Version Manifests
```json
{
  "manifests": [
    {
      "digest": "sha256:win2022amd64...",
      "platform": {
        "architecture": "amd64",
        "os": "windows",
        "os.version": "10.0.20348.1906"
      }
    }
  ]
}
```

### 8.3 Windows SKU Differences
| Image | Size (compressed) | Use Case |
|---|---|---|
| `windows/servercore` | ~5 GB | Full .NET Framework, legacy apps, MSI installers |
| `windows/nanoserver` | ~350 MB | Cloud-native .NET apps, microservices, .NET Core/5+ |

### 8.4 Windows Container Compatibility
- Container host must match or exceed image's Windows version
- Windows 10/11 Pro+ can run Windows containers (Docker Desktop)
- Windows Server 2022 runs Windows containers natively
- Cannot run newer Windows image on older host (version mismatch error)

### 8.5 Windows Multi-Arch Manifest List Example
```
mcr.microsoft.com/windows/servercore:ltsc2022
  ├── windows/amd64:ltsc2022         (Windows Server 2022 x64)
  └── windows/amd64:2004             (Windows Server 2004 x64 — historical)
```

### 8.6 Building Windows Containers with Buildx
```bash
docker buildx build \
  --platform windows/amd64 \
  --tag myrepo/win-app:latest \
  --push \
  --file Dockerfile.windows .
```
- Requires Windows host with container support (or remote Windows builder)
- Buildx uses QEMU on Linux to build Windows images (cross-compilation via Wine-like environment)
- Not as mature as Linux multi-arch builds

---

## Part 9: Real-World Examples & Manifest Inspector

### 9.1 nginx Official Image Manifest List
```bash
docker manifest inspect nginx:latest
```
Typical platforms: `linux/amd64`, `linux/arm64`, `linux/arm/v7`
- All share the same NGINX binary compiled per platform
- Same config defaults, same entrypoint
- Only binaries differ (x86_64 vs ARM64 machine code)

### 9.2 python Official Image Manifest List
```bash
docker manifest inspect python:3.12
```
Typical platforms: `linux/amd64`, `linux/arm64`, `linux/arm/v7`, `linux/s390x`
- Python interpreter compiled per platform
- Many layers identical across platforms (standard library modules)
- Different Python interpreter binary per platform

### 9.3 Microsoft .NET Image Manifest List
```bash
docker manifest inspect mcr.microsoft.com/dotnet/runtime:8.0
```
Typical platforms: `linux/amd64`, `linux/arm64`, `linux/arm/v7`, `windows/amd64`
- Runtime images ship for both Linux and Windows
- Windows version for .NET Framework 4.8 apps
- Linux version for .NET Core / .NET 5+ apps

### 9.4 Interactive Manifest Inspector (on this page)
- Paste any public image reference (e.g., `nginx:latest`, `python:3.12`, `mcr.microsoft.com/dotnet/aspnet:8.0`)
- See all manifests in its manifest list
- Per-manifest: architecture, OS, OS version (Windows), layer count, total size
- Color-coded platform badges
- Error state if image is single-platform only

### 9.5 Layer Size Comparison Across Architectures
- For most images, layer sizes are nearly identical across architectures
- Windows images: sometimes different sizes due to different Windows build artifacts
- Real difference: CPU utilization at runtime (ARM code on Graviton vs x86 on Intel)

---

## Companion Markdown Files

- `docker-multiarch-outline.md` — this file (structure and tab outline)
- `docker-multiarch-deep-dive.md` — detailed explanatory prose for each tab