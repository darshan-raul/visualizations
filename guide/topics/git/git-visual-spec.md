# Infra Illustrated — Git Topic Visual Specification

**Topic:** Git — Fundamentals, Daily Operations, Worktrees, and Plumbing  
**Slug:** `git`  
**Public Route:** `/git`  
**Collection:** `devops-sre`  
**Format:** Deep Dive (`deep-dive`)  
**Difficulty:** Intermediate (`intermediate`)  
**Visual Standard:** Developer Workspace Simulation Labs (3-Column Layout + 3-Mode X-Ray)  
**Canonical Page Path:** `src/pages/git.astro`  
**Integration Status:** Complete MDX and TypeScript components (`src/content/topics/git.mdx`, `src/components/git/`)  
**Published Date:** 2026-09-19  
**Reviewed Date:** 2026-09-19  
**Version Scope:** Git 2.45+ object database, worktree, index, ref, and plumbing behavior verified against git-scm primary documentation on 2026-09-19  

---

## 1. Executive Summary & Teaching Contract

Git is frequently taught as vocabulary memorization (`blob`, `tree`, `commit`, `refs`, `HEAD`, packfiles) before a learner understands why these concepts exist. For an engineer who already knows:

```bash
git add .
git commit -m "change"
git push
```

that vocabulary-first approach creates cognitive fatigue and disconnects everyday commands from internal reality.

This interactive reference rebuilds the entire visual around one pedagogical thesis:

> **You already know the commands. Now turn on X-ray mode and watch what Git actually does when you run them.**

### Core Tenets:
1. **One Persistent Repository & Environment:** The same repository (`infra-platform/`), the same working tree files (`app/deployment.yaml`, `README.md`), and the same interactive bash shell throughout the entire 10-level journey.
2. **Three Operational Modes:**
   - **`[Normal / Learn]`**: Everyday porcelain commands with clean intuition.
   - **`[⚡ X-Ray]`**: Illuminates `.git/`, index entries, loose objects, refs, HEAD, and DAG animations.
   - **`[⚙ Plumbing]`**: Reveals the low-level engine primitives (`hash-object -w`, `update-index`, `write-tree`, `commit-tree`, `update-ref`).
3. **Persistent 3-Column Split UI:**
   - **Column 1: Filesystem** (Working directory &rarr; expandable `.git/` in X-ray)
   - **Column 2: Linux Terminal** (Interactive bash shell with command execution, history, autocomplete)
   - **Column 3: Git Internals** (`HEAD` &rarr; `refs/heads/*` &rarr; `Commit` &rarr; `Tree` &rarr; `Blob`)
4. **Bottom 4-Stage Ledger Shelf:**
   - `WORKING TREE` &rarr; `INDEX` &rarr; `OBJECT DB` &rarr; `COMMIT GRAPH`

---

## 2. Persistent Repository Scenario

All 10 levels operate within a persistent infrastructure platform repository:

```text
infra-platform/
├── environments/
│   ├── sandbox.tfvars
│   └── prod.tfvars
├── modules/
│   ├── networking/
│   │   ├── vpc.tf
│   │   └── routes.tf
│   └── iam/
│       └── roles.tf
├── app/
│   └── deployment.yaml
├── README.md
└── .gitignore
```

- **Default Shell Prompt:** `dev@lab:~/repos/infra-platform (main)$`
- **Working Tree Object:** `app/deployment.yaml` (Kubernetes deployment specifying cache replicas)
- **Shared Branches:** `main` (production root), `feature/cache` (active feature branch)

---

## 3. Console & Workspace Architecture

### 3.1 Topbar & Mode Switcher
The workspace header provides instant switching between three visual perspectives:
- `[Normal / Learn]`: Porcelain commands, collapsed `.git/`, high-level pointers.
- `[⚡ X-Ray]`: Expanded `.git/`, illuminated SHA hashes, Merkle hierarchy, and X-Ray reveal callouts.
- `[⚙ Plumbing]`: Exposes low-level engine commands with executable terminal triggers.

### 3.2 3-Column Split Canvas
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Git Internals Lab · infra-platform (main)         [Normal / Learn] [⚡ X-Ray] [⚙ Plumbing] │
├────────────────────────┬────────────────────────────────┬──────────────────────────────┤
│ FILESYSTEM             │ TERMINAL (BASH)                │ GIT INTERNALS                │
│                        │                                │                              │
│ infra-platform/        │ dev@lab:~/repos/...$           │ ┌ HEAD                       │
│ ├── app/               │ $ git add app/deployment.yaml  │ │  ref: refs/heads/main      │
│ │   └── deployment.yml │                                │ └─▶ COMMIT: 4f901ab          │
│ └── README.md          │ (terminal history & output)    │      │ "Scale cache deploy"  │
│                        │                                │      └─▶ ROOT TREE: 7b2a901  │
│ [.git/ hidden] (learn) │                                │            └─▶ BLOB: b14c80e │
│ OR:                    │ > git status                   │                              │
│ ├── .git/ (x-ray/plumb)│                                │ [Plumbing Command]           │
│ │   ├── HEAD           │                                │ $ git cat-file -p 4f901ab    │
│ │   ├── index          │                                │                              │
│ │   ├── objects/       │                                │ [X-Ray Insight]              │
│ │   └── refs/          │                                │ File names live in Trees,    │
│                        │                                │ not Blobs!                   │
├────────────────────────┴────────────────────────────────┴──────────────────────────────┤
│ [01. edit file] [02. git add] [03. edit MM] [04. add final]    |<-  <-  ▶ Play  ->  ↺ Reset │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [WORKING TREE]         [INDEX / STAGING]     [OBJECT DB (.git)]     [COMMIT GRAPH / REFS]    │
│ modified locally       staged in binary idx  blob 7ab38f written    HEAD -> main (e78b21a)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 4-Stage Ledger Shelf
Located beneath the action rail, this shelf tracks mutations across the four physical boundaries of Git:
1. **STAGE 01: WORKING TREE** (Local disk files, unstaged byte diffs)
2. **STAGE 02: INDEX (STAGING)** (Binary cache mapping paths to blob SHA hashes)
3. **STAGE 03: OBJECT DB (.git/objects)** (Immutable zlib-compressed content-addressed objects)
4. **STAGE 04: COMMIT GRAPH (REFS & HEAD)** (DAG ancestry nodes and branch tip pointer files)

---

## 4. The 10 Progressive Levels

### Level 1: Where is Git? (Working Directory vs Hidden `.git` Repository)
- **ID:** `where-is-git`
- **Group:** `Foundations: Inside .git`
- **What Learner Thinks:** “Git tracks this folder.”
- **What We Reveal:** Git does not inject metadata into your code. It creates a hidden `.git` directory containing four critical structures: `HEAD`, `index`, `objects/`, and `refs/`.
- **Plumbing Primitive:** `cat .git/HEAD`

### Level 2: What `git add` Actually Does (Working Tree &rarr; Blob &rarr; Index Entry)
- **ID:** `what-git-add-does`
- **Group:** `Foundations: Inside .git`
- **What Learner Thinks:** “Git stages my file into a staging area.”
- **What We Reveal:** `git add` hashes file contents, writes an immutable compressed blob object into `.git/objects/`, and registers the path-to-blob SHA mapping in the binary index. Shows why `MM` state occurs.
- **Plumbing Primitive:** `git hash-object -w <file>` & `git ls-files --stage`

### Level 3: What `git commit` Really Creates (Index &rarr; Tree &rarr; Commit &rarr; Branch Ref Moves)
- **ID:** `what-git-commit-creates`
- **Group:** `Foundations: Inside .git`
- **What Learner Thinks:** “Git saves a diff of my changes.”
- **What We Reveal:** Git never stores diffs. It freezes the index into root and subtrees (`write-tree`), wraps the root tree in a commit envelope (`commit-tree`), and advances the branch pointer (`update-ref`).
- **Plumbing Primitive:** `git write-tree` & `git commit-tree`

### Level 4: Branches Are Just Movable References (41-Byte Text File Pointer)
- **ID:** `branches-are-references`
- **Group:** `Navigation & References`
- **What Learner Thinks:** “Branches are folders or heavy parallel tracks of code.”
- **What We Reveal:** A branch is literally a 41-byte text file containing a 40-character commit hash plus a newline. Creating a branch (`git branch`) takes 0.001 ms and duplicates zero project files.
- **Plumbing Primitive:** `cat .git/refs/heads/main`

### Level 5: HEAD: The "You Are Here" Pointer (Symbolic Ref vs Detached HEAD)
- **ID:** `head-pointer-and-detached-head`
- **Group:** `Navigation & References`
- **What Learner Thinks:** “HEAD is just the latest commit.”
- **What We Reveal:** `HEAD` is a pointer to a pointer (`ref: refs/heads/main`). When you check out a raw commit directly (`git checkout <sha>`), HEAD becomes detached, storing the SHA directly with no branch safety net.
- **Plumbing Primitive:** `git symbolic-ref HEAD`

### Level 6: Checkout / Switch Rebuilding the Workspace (3-Step Materialization)
- **ID:** `checkout-switch-rebuilding-workspace`
- **Group:** `Navigation & References`
- **What Learner Thinks:** “Git switch magically changes my screen.”
- **What We Reveal:** Switching branches executes three atomic steps: updates HEAD pointer &rarr; rebuilds the binary index from target commit's tree &rarr; updates files on disk. Refuses to switch if uncommitted files would be overwritten.
- **Plumbing Primitive:** `git read-tree -u -m <tree>`

### Level 7: Merge vs. Rebase: Graph Surgery (2-Parent Merge vs Replay Hashes)
- **ID:** `merge-vs-rebase-graph-surgery`
- **Group:** `Branch Surgery & Recovery`
- **What Learner Thinks:** “Merge and rebase are just stylistic preferences.”
- **What We Reveal:** Merge creates a 3-way commit with two parents (`parent1 = main`, `parent2 = feature`), preserving historical divergence. Rebase copies and replays commits onto a new base, minting brand-new commit hashes and discarding the originals.
- **Plumbing Primitive:** `git merge-base main feature/cache`

### Level 8: Reset, Restore, and Revert: The Three-State Machine (`--soft`, `--mixed`, `--hard`)
- **ID:** `reset-restore-revert`
- **Group:** `Branch Surgery & Recovery`
- **What Learner Thinks:** “git reset deletes things randomly.”
- **What We Reveal:** The three flags cleanly target the three boundaries:
  - `--soft`: Moves HEAD ref only (Index & Working Tree preserved).
  - `--mixed` (default): Moves HEAD ref + resets Index (Working Tree preserved).
  - `--hard`: Moves HEAD ref + resets Index + destroys Working Tree edits.
- **Plumbing Primitive:** `git update-ref` vs `git read-tree --reset`

### Level 9: Merge Conflicts & The Three-Stage Index (Stage 1 BASE, Stage 2 OURS, Stage 3 THEIRS)
- **ID:** `merge-conflicts-three-stage-index`
- **Group:** `Branch Surgery & Recovery`
- **What Learner Thinks:** “Git broke my file with weird angle brackets.”
- **What We Reveal:** The index temporarily expands into three concurrent slots for each conflicting file: Stage 1 = Common Ancestor, Stage 2 = Target Branch (OURS), Stage 3 = Merging Branch (THEIRS). Running `git add` collapses them back to Stage 0.
- **Plumbing Primitive:** `git ls-files --stage`

### Level 10: Worktrees, Reflog Recovery & Plumbing (Shared `.git`, Reflog Rescue, Plumbing Challenge)
- **ID:** `worktrees-reflog-and-plumbing`
- **Group:** `Worktrees & Plumbing`
- **What Learner Thinks:** “If I need two branches at once, I have to re-clone the repository.”
- **What We Reveal:** `git worktree add` checks out independent branches into separate folders with private HEADs and indices, sharing the exact same `.git/objects` with zero disk bloat. The reflog rescues "lost" commits before `git gc`. The manual plumbing challenge builds a real commit from scratch without porcelain commands.
- **Plumbing Primitive:** `git hash-object -w` &rarr; `git update-index` &rarr; `git write-tree` &rarr; `git commit-tree` &rarr; `git update-ref`

---

## 5. Acceptance Verification Gates

1. `npm run check`: 0 errors, 0 warnings, 0 hints across all Astro and TypeScript files.
2. `npm run build`: Astro static build and Pagefind search index generation succeed cleanly.
3. `npm run check:links`: All 10 section anchor links resolve.
4. `npm run check:graph`: 23 topic nodes and 166 relationships validated.
