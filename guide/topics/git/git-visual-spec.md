# Git: Snapshots and Moving Labels — visual specification

- **Topic:** Git, taught from first save to internals as one growing picture.
- **Status and version:** 3.0, rebuilt from scratch on 2026-10-08. Integrated at `/git`; canonical source is [`src/content/topics/git.mdx`](../../../src/content/topics/git.mdx) with components in `src/components/git/`. The owner approved the 14-visual chain in conversation and asked for direct integration without an approval prototype, so none exists. Versions 1 and 2 (the X-Ray workspace and the state slideshow) are discarded.
- **Target audience:** someone who has never used Git, through to an engineer who uses it daily without a model of what the commands move.
- **Page promise:** by the end the reader can predict what any everyday Git command does to three things: their files, the line of commits, and the labels on it.
- **Persistent scenario:** a practice project `my-app/` with two files. `app.yaml` holds `name: shop` and a `replicas:` number that changes through the page; `notes.md` holds a to-do line. Commits are lettered A, B, C… in the order the reader makes them.
- **Scope:** saving, staging, branches, HEAD, switching, merge, conflict, rebase, remotes, rejected push, undo, and the object model.
- **Non-goals:** stash, tags, cherry-pick, interactive rebase, submodules, worktrees, hosting-platform features, and branching strategy. Detached HEAD, `git pull --rebase`, and force-push appear only as inspector notes.

## Visual thesis

**Git only ever adds a snapshot or moves a label.** Every view is the same drawing with one more thing in it, built from four shapes: a file card, a dot, a label, and an arrow.

The teaching rule that orders everything: one new idea per view, each motivated by something the previous view left unsolved, and Git's word for it given only after the reader has seen the thing. Views 1–3 use no Git vocabulary until their inspector names it.

## Semantic color and diagram grammar

| Element | Form | Meaning |
| --- | --- | --- |
| Dot | Blue-outlined circle with a letter | One commit. Position never changes within a view. |
| Solid cyan arrow | Newer dot → older dot | Parent link (a direct, stored relationship). |
| Dashed grey dot and arrow | | A commit no label points at. |
| Green tag | Solid rectangle on a dot | A branch. |
| Dashed grey tag | | A remote-tracking label (`origin/main`): your note of another copy, so conceptual rather than live. |
| Purple pointer | `HEAD` chip joined to the left of a tag | Identity: the branch you are on. |
| File card | Name bar plus contents | A file in the folder, the staging area, or inside a commit. Amber border and `edited` tag: changed, unsaved. Blue: staged. Purple: rewritten by Git. Red: conflict. |
| Result line | Left-ruled box with a word and Git's message | `Done` green, `Paused` amber, `Refused` or `Lost` red. The word carries the meaning without color. |
| Motion | Label or HEAD slides between dots; a new dot pops in | Something moved or was added. Nothing else animates. |

## Concept groups and narrative sequence

Five groups in the index, one open at a time: **Save versions** (01–04), **Branches** (05–07), **Combine** (08–10), **Share** (11–12), **Undo and inside** (13–14).

| # | Group / view (fragment) | Learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | Save versions / Why Git (`#why-git`) | Why not just keep copies? | Folder of renamed copies against one file plus a line of dots | Two-option comparison | Git is a history kept beside the files. |
| 2 | A snapshot (`#snapshot`) | What does a saved version hold? | Folder, one dot, and the files inside the dot | 3 steps | A commit is a frozen copy of the project. |
| 3 | The timeline (`#timeline`) | How do versions relate? | Dots chained by parent arrows; open any dot | 4 steps | Commits are added at the end and never edited. |
| 4 | Three places (`#three-places`) | How do I save only part of my work? | Folder, staging area, history side by side | 3 steps | A commit is built from the staging area. |
| 5 | Branches / A label (`#branch-label`) | How does Git know the latest? | A tag on the newest dot that slides on commit | 3 steps | A branch is a movable name for one commit. |
| 6 | Two labels (`#two-labels`) | Which label moves? | Two tags and the HEAD pointer | 5 steps | Commit moves only the branch under HEAD. |
| 7 | Switching (`#switching`) | What happens to my files? | HEAD hops; the file card is rewritten; a refusal | 4 steps, last is the failure | Switching changes which snapshot the folder shows. |
| 8 | Combine / Fork and join (`#merge`) | How do two lines come together? | Fast-forward slide, then a fork and a two-parent dot | 4 steps | A merge commit is a snapshot with two parents. |
| 9 | Conflict (`#conflict`) | What if both changed the same line? | Conflict markers in the file; paused result line | 4 steps | A conflict pauses the merge until you choose. |
| 10 | Rebase (`#rebase`) | Can I have a straight line? | Copy onto a new parent; old dot dashed; side-by-side with merge | 3 steps | Rebase makes new commits; merge keeps both lines. |
| 11 | Share / Two timelines (`#remote`) | How do copies stay in step? | Two graphs: your computer and origin | 6 steps | `origin/main` is what you last saw. |
| 12 | Out of sync (`#out-of-sync`) | Why was my push rejected? | Both graphs diverge; refusal; fetch, merge, push | 5 steps | Bring in their commits, then push. |
| 13 | Undo and inside / Undo (`#undo`) | How do I take something back? | Before and after of the three places | Four-option comparison | Restore rewinds a file, reset a label, revert adds a commit. |
| 14 | Inside a dot (`#inside-a-commit`) | Why did all that behave as it did? | Commit, tree and blob cards; reflog | 4 steps | Commits are immutable and named by content. |

Hero interactions are the stepped label movement in views 6, 8, and 11. Every other view uses the same step control or a comparison, with no extra controls.

## Per-view contracts

All views share one composition, so it is stated once. The canvas shows, top to bottom: view number and group, title, one-line setup, the step control, the caption for the current step, then the scene. A scene is up to three bordered places in a row (**Your folder**, **Ready to save**, **Saved versions**) that wrap on narrow screens; views show only the places that matter to them. From view 4 on, each place also carries Git's name (working directory, staging area, history). Paired scenes sit side by side under a small heading. The inspector holds a reusable statement, a short explanation, two facts (usually the new word and the command), one command to try, a model note, and the view's sources.

The step control's main button names the next action (for example `git add app.yaml →`), so the reader triggers each change by its real name. At the last step it becomes "Next view".

### 1 — Why Git
- **Purpose:** motivate history before any mechanism. **Scenario state:** before the project uses Git.
- **States:** (a) five copies, `app.yaml` to `app-USE-THIS.yaml`; (b) one `app.yaml` and three unlettered dots labelled Monday, Tuesday, today.
- **Static choice:** a two-option comparison, because these are alternatives, not a sequence.
- **Caveat:** the dots here are a preview and carry no letters; the real history starts in view 2.
- **Checks:** no Git term appears in the canvas. **Sources:** Pro Git, What is Git?

### 2 — A snapshot
- **States:** folder with both files and "Nothing saved yet" → Save a snapshot: dot A appears with both files inside → Edit `app.yaml` to 3: folder shows 3, A still shows 2.
- **Required copy:** the inspector introduces *commit*. **Caveat:** "Save" stands for `git add` plus `git commit`; view 4 separates them, and the model note says so.
- **Checks:** the reader can point to 2 inside A while the folder says 3. **Sources:** What is Git?; Recording Changes.

### 3 — The timeline
- **States:** A with an unsaved edit → Save again: B with an arrow to A → Edit to 4 and save: C → Open A again: A's files unchanged, folder unchanged.
- **Required copy:** *parent*; arrows point from newer to older because a commit knows its parent. **Caveat:** opening a commit here means reading it (`git show`), not switching to it.
- **Checks:** three dots, two arrows, both pointing left. **Sources:** What is Git?; git-commit.

### 4 — Three places
- **States:** `app.yaml` and `notes.md` both edited, staging area empty → `git add app.yaml`: staged copy appears → `git commit`: D appears; inside D is the new `app.yaml` and the old `notes.md`; `notes.md` is still edited in the folder.
- **Required copy:** *working directory*, *staging area*. **Caveat (model note):** `git add` copies contents at that moment; a later edit needs another add. After a commit the staging area matches the commit, shown as "Nothing waiting".
- **Checks:** the half-finished line is absent from D. **Sources:** Recording Changes; git-add; git-commit.

### 5 — A label
- **States:** C and D with no tag → Show the label: `main` on D → `git commit`: E appears, `main` slides to it.
- **Caveat:** `main` has existed since the first commit; the earlier views left it out, and the caption says so. The name is conventional.
- **Checks:** the tag slides; no dot moves. **Sources:** Branches in a Nutshell; git-branch.

### 6 — Two labels (hero)
- **States:** `main` on E → `git branch idea`: second tag, same dot → Show where you are: HEAD on `main` → `git switch idea`: HEAD hops → `git commit`: F appears, `idea` and HEAD move, `main` stays.
- **Caveat (model note):** detached HEAD is named but not drawn.
- **Checks:** tag order on a dot stays fixed so only HEAD moves at step 4. **Sources:** Branches in a Nutshell; git-branch; git-switch.

### 7 — Switching
- **States:** on `idea`, file has a cache line → `git switch main`: line gone, card marked rewritten → `git switch idea`: line back → edit then switch: refused with Git's message, HEAD unmoved.
- **Failure state:** the refusal. **Caveat:** Git refuses only when the edit touches a file that differs between the two commits.
- **Sources:** git-switch.

### 8 — Fork and join (hero)
- **States:** `idea` one ahead of `main` → `git merge idea`: `main` slides to F, "Fast-forward" → commit on both: G on the top lane, H below → `git merge idea`: M with arrows to G and H; inside M both changes.
- **Caveat:** the branch named in the command never moves. The example's two changes touch different lines so the merge is automatic.
- **Sources:** git-merge.

### 9 — Conflict
- **States:** `tune` branched at M; I sets replicas 8, J sets 10 → `git merge tune`: paused, markers in the file, no new dot → edit to keep 10 → `git add` then `git commit`: N with two parents.
- **Failure state:** the paused merge. **Caveat:** `git merge --abort` backs out; index stages 1–3 are deliberately not shown.
- **Sources:** git-merge.

### 10 — Rebase
- **States:** `fix` branched at N; `main` has O, `fix` has P → `git rebase main`: P′ after O, P dashed → compare: the rebase result beside what `git merge main` would have produced.
- **Caveat (model note):** rebase only unshared work; forward reference to view 12.
- **Sources:** git-rebase; git-merge.

### 11 — Two timelines (hero)
- **States:** both copies end at Q → `git commit`: R locally, `origin/main` revealed on Q → `git push`: origin gains R → teammate pushes S → `git fetch`: S arrives, only `origin/main` moves → `git merge origin/main`: fast-forward.
- **Caveat:** `origin/main` exists from the clone; it is revealed at step 2 with a caption saying it was there. `git pull` is fetch plus the last step.
- **Sources:** git-fetch; git-push; git-pull.

### 12 — Out of sync
- **States:** you have T, origin has U → `git push`: refused, nothing moves → `git fetch` → `git merge origin/main`: V → `git push`: origin gains T and V.
- **Failure state:** the rejected push. **Caveat (model note):** `--force` overwrites; `git pull --rebase` is the linear alternative.
- **Sources:** git-push; git-fetch; git-pull.

### 13 — Undo
- **States:** four options, each a Before and After of all three places: `git restore app.yaml` (edit lost), `git restore --staged notes.md`, `git reset HEAD~1` (label back, change kept as an edit, W dashed), `git revert HEAD` (new commit Y).
- **Static choice:** a comparison, because each option starts from its own baseline and they must not read as a sequence.
- **Caveat (model note):** `--soft` and `--hard`; `--hard` destroys unsaved edits.
- **Sources:** git-restore; git-reset; git-revert.

### 14 — Inside a dot
- **States:** commit card (snapshot, parent, author, message) → commit → tree → blob → two commits differing only in parent → reflog and `git branch rescue`.
- **Caveat (model note):** hashes are illustrative; reflog is local and expires (at least 30 days by default for unreachable entries); uncommitted edits are not recoverable.
- **Sources:** Git Objects; git-reflog.

## Console, deep links, and no-JavaScript reading

The page uses the neutral `TopicConsoleShell` with frame values matching the RDS and ENI pilots: masthead, title and metadata, grouped index with a `current / total` counter, toolbar with legend, canvas, inspector, "The point to keep", sources and related visuals, footer. A previous/next bar under the canvas moves between views.

Each view's fragment is its `id`. The thirteen fragments from the previous page resolve to the nearest new view through hidden anchors and a client alias map: `where-is-git` → 1, `what-git-commit-creates` → 2, `what-git-add-does` → 4, `branches-are-references` → 5, `head-pointer-and-detached-head` → 6, `checkout-switch-rebuilding-workspace` → 7, `merge-conflicts-three-stage-index` → 9, `merge-vs-rebase-graph-surgery` → 10, `remotes-fetch-and-push` → 11, `reset-restore-revert` → 13, and `plumbing-objects-and-refs`, `reflog-recovery`, `worktrees-reflog-and-plumbing` → 14. Selecting a view pushes history; back and forward restore it.

Without JavaScript every view is stacked in order, every step of every view is shown with its caption, and each view is followed by its inspector text, sources, and takeaway. The step controls, right-hand inspector, and bottom takeaway are hidden because their content is already inline.

## Responsive and accessibility requirements

- Below 1200 px the inspector moves under the canvas; below 760 px the index collapses to a single "View index" disclosure and the places stack.
- Graphs keep their drawn size so text stays legible. A graph wider than its container scrolls sideways inside a focusable region and starts scrolled to the newest commit.
- All controls are buttons or links with 44 px targets. Each graph has a text description of its parent links, labels, and HEAD. Step changes are announced through a polite live region.
- State never depends on color alone: tags on file cards and the leading word on result lines carry it.
- Reduced motion removes the slide and pop; the selected state is shown immediately.

## Implementation

- `git-lesson.ts` — all content and the graph geometry. `GitGraph.astro` — the SVG. `GitScene.astro` — places, file cards, object cards, result line. `GitConsole.astro` — console slots. `git-client.ts` — view and step selection, label sliding. `src/styles/git-console.css` — tokens from `global.css` plus the pilots' frame values.
- `node scripts/verify-git-lesson.mjs` replays the lesson's claims against the installed Git, including the refusal, conflict, and rejection messages and the exact conflicted file.

## Acceptance criteria

- A reader who stops after view 4 can say what `git add` and `git commit` each do.
- Views 1–3 show no Git term in the canvas.
- In every stepped view, dots hold their position while labels move.
- Each failure (views 7, 9, 12) shows that nothing moved.
- `npm run check`, `npm run build`, `npm run check:links`, `npm run check:graph`, and the Git replay pass.
- Desktop, 390 px, 320 px, and no-JavaScript layouts are inspected in a browser.

## Source index

Pro Git: [What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F), [Recording Changes to the Repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository), [Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell), [Git Objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects). Git documentation: [git-add](https://git-scm.com/docs/git-add), [git-commit](https://git-scm.com/docs/git-commit), [git-branch](https://git-scm.com/docs/git-branch), [git-switch](https://git-scm.com/docs/git-switch), [git-merge](https://git-scm.com/docs/git-merge), [git-rebase](https://git-scm.com/docs/git-rebase), [git-fetch](https://git-scm.com/docs/git-fetch), [git-push](https://git-scm.com/docs/git-push), [git-pull](https://git-scm.com/docs/git-pull), [git-restore](https://git-scm.com/docs/git-restore), [git-reset](https://git-scm.com/docs/git-reset), [git-revert](https://git-scm.com/docs/git-revert), [git-reflog](https://git-scm.com/docs/git-reflog). All URLs resolved on 2026-10-08.
