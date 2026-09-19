# Infra Illustrated — Git Visual Specification v3

**Topic:** Git — fundamentals, daily operations, worktrees, and plumbing  
**Visual standard:** Workspace-first interactive labs  
**Status:** Full replacement of previous Git visual standard  
**Audience:** DevOps, platform, cloud, SRE, and software engineers

---

# 1. Non-negotiable visual rule

Every substantial Git concept must be shown as a **developer workspace simulation**, not as a standalone infographic card.

The reference visual language is:

```text
┌ Interactive workspace ─ path · branch ─────────────────────────────┐
│ Repository / file explorer │ Linux terminal                        │
│                             │ exact Git command + realistic output │
│                             │                                      │
├─────────────────────────────┴──────────────────────────────────────┤
│ command/action buttons                                              │
├────────────────────────────────────────────────────────────────────┤
│ live Git state / graph / internals / explanation strip             │
└────────────────────────────────────────────────────────────────────┘
```

A learner should feel that they are operating a real repository and watching Git react.

The visualization must answer four questions simultaneously:

1. **What files/repository state exist right now?**
2. **What command did I run?**
3. **What state did Git mutate?**
4. **What changed internally?**

No major section may consist only of conceptual boxes, arrows, or explanatory cards.

---

# 2. Persistent repository scenario

Use one repository across the entire page:

```text
infra-platform/
├── environments/
│   ├── sandbox.tfvars
│   └── prod.tfvars
├── modules/
│   ├── networking/
│   │   ├── vpc.tf
│   │   ├── subnets.tf
│   │   └── routes.tf
│   └── iam/
│       ├── roles.tf
│       └── policies.tf
├── app/
│   └── deployment.yaml
├── README.md
└── .gitignore
```

Canonical shell prompt:

```text
dev@lab:~/repos/infra-platform (feature/cache)$
```

Use realistic Git status output, abbreviated object IDs, branch names, paths, and command syntax throughout.

---

# 3. Workspace-first component standard

Every visual/lab uses the same components.

## 3.1 Header

Example:

```text
Interactive workspace     app/deployment.yaml · feature/cache
```

Header metadata can instead show a remote, selected ref, worktree, or recovery target when appropriate.

## 3.2 Repository Explorer

Left pane should show context-sensitive data:

- normal file tree for working-tree concepts;
- `.git/objects`, `.git/refs`, `HEAD`, `index` for internals concepts;
- local + remote refs for fetch/push;
- multiple worktree roots for worktree labs;
- conflict badges/stages for merge conflict labs.

Status badges:

- `M` working-tree modification
- `A` added/staged
- `MM` staged plus additional working-tree edit
- `??` untracked
- `UU` unresolved merge
- `D` deleted

Never rely on color alone.

## 3.3 Linux Terminal

Right pane contains exact commands and realistic output.

The terminal is the narrative engine. Each action button should append output and visibly update the explorer/state panel.

The learner should never have to infer which command caused the current state.

## 3.4 Action rail

Buttons use actual Git vocabulary whenever possible:

```text
git status | edit file | git add | git commit | git restore | reset lab
```

For advanced labs:

```text
git cat-file | git ls-files --stage | git update-ref | git reflog | git fsck
```

## 3.5 State shelf

Directly under the workspace, show 3–5 live state cells relevant to the current lab.

Possible cells:

- Working tree
- Index
- Object database
- HEAD
- Branch ref
- Remote-tracking ref
- Reflog
- Worktree metadata
- Reachability

Values change live with interaction.

## 3.6 Supporting graph

Graphs are supporting visuals, never the primary UI.

They belong below or beside the workspace and update in response to commands.

---

# 4. Page sequence

## Lab 1 — Working tree → index → commit

Workspace path: `app/deployment.yaml · feature/cache`

Actions:

1. `git status`
2. edit replicas `2 → 3`
3. `git add app/deployment.yaml`
4. edit again `3 → 4`
5. observe `MM`
6. `git commit -m "Scale cache deployment"`
7. reset lab

State shelf:

- Working tree blob/content
- Index blob
- HEAD commit
- branch ref

Critical lesson: the index is a real snapshot candidate and can differ from both HEAD and the working tree.

---

## Lab 2 — Git object database

Explorer switches from normal files to an internals view:

```text
.git/
├── objects/
│   ├── 8a/...
│   ├── b1/...
│   └── f4/...
├── refs/
└── HEAD
```

Actions:

- `git hash-object app/deployment.yaml`
- `git cat-file -t <oid>`
- `git cat-file -p <oid>`
- inspect tree
- inspect commit

State shelf:

`blob → tree → commit`

Critical lesson: Git stores immutable content-addressed objects; filenames live in trees rather than blobs.

---

## Lab 3 — Branches, refs, and HEAD

Explorer shows:

```text
.git/HEAD
.git/refs/heads/main
.git/refs/heads/feature/cache
```

Actions:

- `git switch main`
- `git switch feature/cache`
- detach HEAD at a commit
- create branch from detached commit
- `git show-ref`

Supporting commit graph updates live.

Critical lesson: a branch is a movable ref; HEAD is normally a symbolic ref to a branch.

---

## Lab 4 — Revision navigation

Terminal-led lab for:

- `HEAD`
- `HEAD~1`
- `HEAD^`
- `main..feature/cache`
- `main...feature/cache`
- `git merge-base`

Explorer may show a selected commit's tree.

Supporting graph highlights selected commits and paths.

---

## Lab 5 — Remote synchronization

Workspace header:

```text
origin · main · origin/main
```

Explorer contains Local refs and Remote-tracking refs.

Actions:

- `git fetch origin`
- `git log main..origin/main`
- `git merge origin/main`
- `git pull --ff-only`
- local commit
- `git push origin main`

State shelf:

- local `main`
- `origin/main`
- remote `refs/heads/main`
- working tree

Critical lesson: fetch updates local remote-tracking knowledge; push updates a remote ref.

---

## Lab 6 — Merge / rebase / cherry-pick

Workspace remains visible while graph topology changes.

Actions:

- create divergence
- `git merge feature/cache`
- reset scenario
- `git rebase main`
- reset scenario
- `git cherry-pick <commit>`

Terminal explains when commits are reused vs newly created.

Critical lesson: rebase/cherry-pick normally create new commits with new object IDs.

---

## Lab 7 — Restore / reset / revert

Workspace file state is the main visual.

Actions:

- dirty file
- stage file
- `git restore <file>`
- `git restore --staged <file>`
- `git reset --soft HEAD~1`
- `git reset --mixed HEAD~1`
- `git reset --hard HEAD~1`
- `git revert <commit>`

State shelf must clearly mark which of `HEAD/ref`, index, and working tree changed.

---

## Lab 8 — Merge conflict and the three-stage index

Explorer shows `UU modules/networking/routes.tf`.

Terminal:

- run merge
- show conflict
- `git ls-files --stage modules/networking/routes.tf`
- show stage 1/base, stage 2/ours, stage 3/theirs
- edit resolution
- `git add`
- `git commit`

State shelf represents index stages explicitly.

---

## Lab 9 — Git Worktrees (flagship advanced lab)

This is the richest workspace on the page.

Top workspace selector:

```text
/repos/infra-platform     main
/wt/networking            feature/networking
/wt/iam                   feature/iam
/wt/hotfix                hotfix/alb-healthcheck
```

Each selected worktree gets its own explorer + terminal.

Actions:

- `git worktree list`
- `git worktree add ../wt/networking -b feature/networking`
- edit/stage/commit independently
- switch selected worktree
- try same branch in a second worktree and show Git refusal
- `git worktree lock`
- `git worktree unlock`
- `git worktree remove`
- `git worktree prune`
- inspect internals

Advanced internals drawer:

```text
$ git rev-parse --git-dir
/repos/infra-platform/.git/worktrees/networking

$ git rev-parse --git-common-dir
/repos/infra-platform/.git
```

Show explicitly:

**shared**
- object database
- most refs
- config/common repository data

**per worktree**
- `HEAD`
- index
- checked-out files
- worktree metadata

Use an AI-agent scenario:

- human/integration → main worktree
- networking agent → networking worktree
- IAM agent → IAM worktree
- hotfix agent → hotfix worktree

Also warn that Git worktrees do not isolate Terraform state, credentials, ports, cloud resources, caches, or databases.

---

## Lab 10 — Build a commit manually with plumbing

Explorer emphasizes `.git/objects`, index, and refs.

Sequential actions:

```text
git hash-object -w ...
git update-index --cacheinfo ...
git write-tree
git commit-tree ...
git update-ref refs/heads/feature/cache ...
```

After each step, highlight exactly what changed.

Critical lesson: a commit object can exist before any branch ref points to it.

---

## Lab 11 — Reflog and recovery

Scenario:

1. C3 is reachable from `feature/cache`
2. `git reset --hard HEAD~1`
3. branch moves back to C2
4. C3 becomes unreachable from normal refs
5. `git reflog` reveals previous branch/HEAD movement
6. create `recovered/cache` pointing to C3

Explorer should show:

```text
.git/logs/HEAD
.git/logs/refs/heads/feature/cache
```

Supporting graph visually marks C3 as reachable → unreachable → reachable again.

Critical lesson: unreachable is not the same as deleted; reflog is recovery metadata, not a backup guarantee.

---

## Lab 12 — Reachability, fsck, reflog expiry, gc

Terminal-led advanced operations workspace:

```text
git fsck --unreachable
git reflog expire ...
git gc
git count-objects -v
git verify-pack ...
```

The lab should be explanatory/simulated rather than encouraging destructive commands against a real repository.

State shelf:

- referenced objects
- reflog-protected objects
- unreachable objects
- prune-eligible objects

Critical lesson: object retention depends on reachability, reflog retention, and garbage collection policy/timing.

---

# 5. Visual design

Match the uploaded reference style:

- dark navy/black workspace
- subtle 1px blue-gray borders
- high-contrast monospace terminal
- green shell prompt
- cyan/blue path and branch metadata
- file status badges aligned to the right
- buttons integrated into the workspace footer
- large full-width panels
- restrained corner radius
- no floating decorative illustrations
- no giant infographic icons

The terminal pane should dominate the layout visually.

The page should feel closer to a purpose-built Git teaching IDE than a documentation site.

---

# 6. Responsive behavior

Desktop:

- explorer 25–30%
- terminal 70–75%
- action rail full width
- state shelf horizontal

Tablet:

- explorer 34%
- terminal 66%

Mobile:

- explorer collapsible above terminal
- terminal remains full-width
- actions horizontal-scroll or wrap
- state shelf stacks vertically

---

# 7. Interaction quality rules

1. Never fake interactivity with buttons that do nothing.
2. Every state-mutating command updates at least two visual areas.
3. Terminal output must remain visible after a mutation.
4. A reset action must exist in every independent lab.
5. Use deterministic simulated SHA values to make transitions teachable.
6. Show dangerous/destructive semantics before executing a simulated destructive operation.
7. Use Git's real vocabulary: object, ref, symbolic ref, index, worktree, remote-tracking ref, reflog, reachability.

---

# 8. Definition of done

The Git page is complete only if:

- every major concept is taught through a workspace;
- every workspace has a Linux-style terminal;
- all core state transitions are interactive;
- the file/repo explorer visibly updates;
- abstract Git internals are tied back to commands;
- worktrees are treated as a first-class advanced concept;
- plumbing and recovery are interactive rather than static command lists;
- all labs use a single coherent visual language.

The reference mental model is:

> **I type a Git command, and the entire page shows me exactly what moved.**
