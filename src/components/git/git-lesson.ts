/**
 * One picture that grows: a folder, a line of saved versions, and labels on them.
 * Each view adds one idea; each frame is one action on the same practice project.
 */
export type FileCard = { name: string; lines: string[]; tag?: string; tone?: 'edited' | 'staged' | 'conflict' | 'restored'; hot?: number };
export type Dot = { id: string; col: number; lane?: number; parents?: string[]; fresh?: boolean; ghost?: boolean; peek?: boolean; text?: string; sub?: string };
export type Label = { name: string; at: string; remote?: boolean; fresh?: boolean };
export type Graph = { dots: Dot[]; labels?: Label[]; head?: string; headFresh?: boolean; earlier?: boolean; empty?: string };
export type ObjectCard = { title: string; sub?: string; rows: [string, string][]; tone?: 'commit' | 'tree' | 'blob' | 'log'; hot?: number };
export type Notice = { tone: 'ok' | 'warn' | 'stop'; label: string; text: string };
export type Scene = {
  title?: string;
  desk?: FileCard[];
  tray?: FileCard[];
  graph?: Graph;
  peek?: { id: string; files: FileCard[] };
  cards?: ObjectCard[];
  notice?: Notice;
};
export type Frame = { action: string; caption: string; scenes: Scene[] };
export type View = {
  id: string;
  aliases?: string[];
  group: string;
  label: string;
  title: string;
  lede: string;
  mode: 'steps' | 'choices';
  /** Show Git's own names for the three places once view 4 has introduced them. */
  terms?: boolean;
  frames: Frame[];
  inspector: { heading: string; body: string; facts: [string, string][]; evidence: [string, string]; note: string };
  takeaway: string;
  sources: number[];
};

const DOCS = 'https://git-scm.com/docs/';
const BOOK = 'https://git-scm.com/book/en/v2/';
export const gitSources = [
  { label: 'Pro Git: What is Git?', url: `${BOOK}Getting-Started-What-is-Git%3F` },
  { label: 'Pro Git: Recording Changes to the Repository', url: `${BOOK}Git-Basics-Recording-Changes-to-the-Repository` },
  { label: 'Git documentation: git-add', url: `${DOCS}git-add` },
  { label: 'Git documentation: git-commit', url: `${DOCS}git-commit` },
  { label: 'Pro Git: Branches in a Nutshell', url: `${BOOK}Git-Branching-Branches-in-a-Nutshell` },
  { label: 'Git documentation: git-branch', url: `${DOCS}git-branch` },
  { label: 'Git documentation: git-switch', url: `${DOCS}git-switch` },
  { label: 'Git documentation: git-merge', url: `${DOCS}git-merge` },
  { label: 'Git documentation: git-rebase', url: `${DOCS}git-rebase` },
  { label: 'Git documentation: git-fetch', url: `${DOCS}git-fetch` },
  { label: 'Git documentation: git-push', url: `${DOCS}git-push` },
  { label: 'Git documentation: git-pull', url: `${DOCS}git-pull` },
  { label: 'Git documentation: git-restore', url: `${DOCS}git-restore` },
  { label: 'Git documentation: git-reset', url: `${DOCS}git-reset` },
  { label: 'Git documentation: git-revert', url: `${DOCS}git-revert` },
  { label: 'Git documentation: git-reflog', url: `${DOCS}git-reflog` },
  { label: 'Pro Git: Git Objects', url: `${BOOK}Git-Internals-Git-Objects` },
];

export const gitRelated = [
  { label: 'GitHub Actions Cheatsheet', href: '/github-actions-cheatsheet' },
  { label: 'DevSecOps Pipeline', href: '/secopspipeline' },
];

const file = (name: string, lines: string[], tag?: string, tone?: FileCard['tone'], hot?: number): FileCard => ({ name, lines, tag, tone, hot });
const app = (replicas: number, extra: string[] = [], tag?: string, tone?: FileCard['tone']) => file('app.yaml', ['name: shop', `replicas: ${replicas}`, ...extra], tag, tone, tag ? 1 : undefined);
const notes = (extra: string[] = [], tag?: string, tone?: FileCard['tone']) => file('notes.md', ['- add a cache', ...extra], tag, tone, tag && extra.length ? 1 : undefined);
const dot = (id: string, col: number, parents: string[] = [], lane = 0, more: Partial<Dot> = {}): Dot => ({ id, col, lane, parents, ...more });
const CACHE = ['cache: on'];
const FULL = ['cache: on', 'timeout: 30'];

export const gitViews: View[] = [
  {
    id: 'why-git', aliases: ['where-is-git'], group: 'Save versions', label: 'Why Git', mode: 'choices',
    title: 'One folder, or one folder and its history',
    lede: 'Two ways to keep old versions of the same file.',
    frames: [
      {
        action: 'Copies in a folder',
        caption: 'Every copy is a guess at what might matter later. The names can\'t tell you what changed, in what order, or which one was running last Tuesday.',
        scenes: [{ desk: [file('app.yaml', ['replicas: 4']), file('app-old.yaml', ['replicas: 2']), file('app-final.yaml', ['replicas: 3']), file('app-final-v2.yaml', ['replicas: 3']), file('app-USE-THIS.yaml', ['replicas: 4'])] }],
      },
      {
        action: 'One file and its history',
        caption: 'The folder holds only the current file. Each dot is a saved version you can open again, and the line keeps them in the order they were made.',
        scenes: [{ desk: [file('app.yaml', ['replicas: 4'])], graph: { dots: [dot('v1', 0, [], 0, { text: '', sub: 'Monday' }), dot('v2', 1, ['v1'], 0, { text: '', sub: 'Tuesday' }), dot('v3', 2, ['v2'], 0, { text: '', sub: 'today' })] } }],
      },
    ],
    inspector: {
      heading: 'Git keeps the history so the folder doesn\'t have to',
      body: 'Renamed copies put the history into file names, where it gets lost. Git stores each saved version outside your working files and keeps them in order, so the folder can stay small and current.',
      facts: [['In the picture', 'A dot is one saved version'], ['New word', 'None yet']],
      evidence: ['What you will build', 'a folder → a line of dots → labels on the dots'],
      note: 'The rest of this page adds one thing at a time to this picture. Git\'s own vocabulary arrives after you have seen what each word names.',
    },
    takeaway: 'Git is a history of your project, kept beside the files instead of inside their names.',
    sources: [0],
  },
  {
    id: 'snapshot', aliases: ['what-git-commit-creates'], group: 'Save versions', label: 'A snapshot', mode: 'steps',
    title: 'A snapshot is a copy of everything, frozen',
    lede: 'What does a saved version actually hold?',
    frames: [
      {
        action: 'Start with two files',
        caption: 'A small project folder. Nothing has been saved yet, so there is no way back from the next edit.',
        scenes: [{ desk: [app(2), notes()], graph: { dots: [], empty: 'Nothing saved yet' } }],
      },
      {
        action: 'Save a snapshot',
        caption: 'A dot appears. It holds a copy of every file exactly as it was at that moment.',
        scenes: [{ desk: [app(2), notes()], graph: { dots: [dot('A', 0, [], 0, { fresh: true, peek: true })] }, peek: { id: 'A', files: [app(2), notes()] } }],
      },
      {
        action: 'Edit app.yaml',
        caption: 'Your folder has moved on to 3. Snapshot A still says 2, and it always will.',
        scenes: [{ desk: [app(3, [], 'edited', 'edited'), notes()], graph: { dots: [dot('A', 0, [], 0, { peek: true })] }, peek: { id: 'A', files: [app(2), notes()] } }],
      },
    ],
    inspector: {
      heading: 'Saving takes a picture of the whole project',
      body: 'A snapshot is not a list of edits. It records what every file contained at one moment, and nothing you do afterwards changes it. Git calls a snapshot a commit.',
      facts: [['In the picture', 'The dot, and the files inside it'], ['New word', 'commit: one saved snapshot']],
      evidence: ['Look inside a commit', 'git show A:app.yaml'],
      note: '“Save a snapshot” stands for two Git commands run together. View 4 separates them, once there is a reason to.',
    },
    takeaway: 'A commit is a frozen copy of the project. Your folder keeps changing; the commit does not.',
    sources: [0, 1],
  },
  {
    id: 'timeline', group: 'Save versions', label: 'The timeline', mode: 'steps',
    title: 'Each snapshot points back at the one before',
    lede: 'How do saved versions relate to each other?',
    frames: [
      {
        action: 'One snapshot so far',
        caption: 'A is saved. The folder already holds an edit that A doesn\'t have.',
        scenes: [{ desk: [app(3, [], 'edited', 'edited'), notes()], graph: { dots: [dot('A', 0)] } }],
      },
      {
        action: 'Save again',
        caption: 'B is the new snapshot. Its arrow points back at A: every snapshot remembers the one it was made from.',
        scenes: [{ desk: [app(3), notes()], graph: { dots: [dot('A', 0), dot('B', 1, ['A'], 0, { fresh: true, peek: true })] }, peek: { id: 'B', files: [app(3), notes()] } }],
      },
      {
        action: 'Edit to 4 and save',
        caption: 'C points back at B. The line only ever grows at its newest end.',
        scenes: [{ desk: [app(4), notes()], graph: { dots: [dot('A', 0), dot('B', 1, ['A']), dot('C', 2, ['B'], 0, { fresh: true, peek: true })] }, peek: { id: 'C', files: [app(4), notes()] } }],
      },
      {
        action: 'Open A again',
        caption: 'A still holds the files as they were. Adding B and C changed nothing inside it, and looking at it changes nothing in your folder.',
        scenes: [{ desk: [app(4), notes()], graph: { dots: [dot('A', 0, [], 0, { peek: true }), dot('B', 1, ['A']), dot('C', 2, ['B'])] }, peek: { id: 'A', files: [app(2), notes()] } }],
      },
    ],
    inspector: {
      heading: 'History is a chain of snapshots',
      body: 'The arrow from a commit leads to its parent, the commit it was built on. Follow the arrows from the newest dot and you walk back through every earlier version.',
      facts: [['In the picture', 'An arrow from newer to older'], ['New word', 'parent: the commit this one came from']],
      evidence: ['List the chain', 'git log --oneline'],
      note: 'Arrows point backwards because a commit knows its parent, while an older commit knows nothing about what came after it.',
    },
    takeaway: 'New commits are added at the end of the chain. Existing commits are never edited.',
    sources: [0, 3],
  },
  {
    id: 'three-places', aliases: ['what-git-add-does'], group: 'Save versions', label: 'Three places', mode: 'steps', terms: true,
    title: 'You choose what goes into the next snapshot',
    lede: 'Two files changed, and only one is ready to save.',
    frames: [
      {
        action: 'Two edits, one ready',
        caption: 'app.yaml is finished. notes.md has half an idea in it. Saving everything would put the half-idea into history.',
        scenes: [{ desk: [app(5, [], 'edited', 'edited'), notes(['- half an idea'], 'edited', 'edited')], tray: [], graph: { dots: [dot('A', 0), dot('B', 1, ['A']), dot('C', 2, ['B'])] } }],
      },
      {
        action: 'git add app.yaml',
        caption: 'Git copies app.yaml, as it is right now, into the staging area. notes.md stays where it is.',
        scenes: [{ desk: [app(5, [], 'edited', 'edited'), notes(['- half an idea'], 'edited', 'edited')], tray: [app(5, [], 'staged', 'staged')], graph: { dots: [dot('A', 0), dot('B', 1, ['A']), dot('C', 2, ['B'])] } }],
      },
      {
        action: 'git commit',
        caption: 'D is built from the staging area. It has the new app.yaml and the old notes.md; the half-idea is still only in your folder.',
        scenes: [{ desk: [app(5), notes(['- half an idea'], 'edited', 'edited')], tray: [], graph: { dots: [dot('A', 0), dot('B', 1, ['A']), dot('C', 2, ['B']), dot('D', 3, ['C'], 0, { fresh: true, peek: true })] }, peek: { id: 'D', files: [app(5), notes()] } }],
      },
    ],
    inspector: {
      heading: 'A change lives in one of three places',
      body: 'Your folder holds what you are editing. The staging area holds what the next commit will contain. History holds what is already saved. git add moves a file\'s current contents from the first to the second; git commit turns the second into a new dot.',
      facts: [['New words', 'working directory, staging area'], ['Commands', 'git add, then git commit']],
      evidence: ['See all three at once', 'git status'],
      note: 'git add copies the file as it is at that moment. If you edit it again afterwards, the staging area still holds the earlier contents until you add it again.',
    },
    takeaway: 'A commit is built from the staging area, not straight from your folder.',
    sources: [1, 2, 3],
  },
  {
    id: 'branch-label', aliases: ['branches-are-references'], group: 'Branches', label: 'A label', mode: 'steps', terms: true,
    title: 'A branch is a label stuck on one snapshot',
    lede: 'How does Git know which snapshot is the latest?',
    frames: [
      {
        action: 'Which one is newest?',
        caption: 'You can see that D is the newest dot. Git needs a name it can look up.',
        scenes: [{ graph: { earlier: true, dots: [dot('C', 0), dot('D', 1, ['C'])] } }],
      },
      {
        action: 'Show the label',
        caption: 'This label has been here since your first commit. It is called main, and it sits on the newest snapshot.',
        scenes: [{ graph: { earlier: true, dots: [dot('C', 0), dot('D', 1, ['C'])], labels: [{ name: 'main', at: 'D', fresh: true }] } }],
      },
      {
        action: 'git commit',
        caption: 'E appears and main slides onto it. That is all a commit does to a label.',
        scenes: [{ graph: { earlier: true, dots: [dot('C', 0), dot('D', 1, ['C']), dot('E', 2, ['D'], 0, { fresh: true })], labels: [{ name: 'main', at: 'E' }] } }],
      },
    ],
    inspector: {
      heading: 'The label moves; the snapshots stay put',
      body: 'Git calls this label a branch. It holds nothing except the name of one commit. When you commit, Git adds the new dot and moves the label onto it.',
      facts: [['In the picture', 'A tag sitting on a dot'], ['New word', 'branch: a movable name for one commit']],
      evidence: ['See where each label points', 'git branch -v'],
      note: 'main is only the usual name for the first branch. Git treats it like any other label.',
    },
    takeaway: 'A branch is a name that points at one commit and moves forward when you commit.',
    sources: [4, 5],
  },
  {
    id: 'two-labels', aliases: ['head-pointer-and-detached-head'], group: 'Branches', label: 'Two labels', mode: 'steps', terms: true,
    title: 'With two labels, Git tracks which one you are on',
    lede: 'You want to try an idea without disturbing main.',
    frames: [
      {
        action: 'One label',
        caption: 'main sits on the newest snapshot, E.',
        scenes: [{ graph: { earlier: true, dots: [dot('D', 0), dot('E', 1, ['D'])], labels: [{ name: 'main', at: 'E' }] } }],
      },
      {
        action: 'git branch idea',
        caption: 'A second label lands on the same snapshot. No files were copied and no dot was added.',
        scenes: [{ graph: { earlier: true, dots: [dot('D', 0), dot('E', 1, ['D'])], labels: [{ name: 'main', at: 'E' }, { name: 'idea', at: 'E', fresh: true }] } }],
      },
      {
        action: 'Show where you are',
        caption: 'Two labels on one dot: which will the next commit move? Git marks the one you are on. It calls that marker HEAD.',
        scenes: [{ graph: { earlier: true, dots: [dot('D', 0), dot('E', 1, ['D'])], labels: [{ name: 'main', at: 'E' }, { name: 'idea', at: 'E' }], head: 'main', headFresh: true } }],
      },
      {
        action: 'git switch idea',
        caption: 'HEAD moves to idea. Both labels still point at E, so no file needs to change.',
        scenes: [{ graph: { earlier: true, dots: [dot('D', 0), dot('E', 1, ['D'])], labels: [{ name: 'main', at: 'E' }, { name: 'idea', at: 'E' }], head: 'idea' } }],
      },
      {
        action: 'git commit',
        caption: 'F appears and only the label under HEAD moves. main still points at E.',
        scenes: [{ graph: { earlier: true, dots: [dot('D', 0), dot('E', 1, ['D']), dot('F', 2, ['E'], 0, { fresh: true })], labels: [{ name: 'main', at: 'E' }, { name: 'idea', at: 'F' }], head: 'idea' } }],
      },
    ],
    inspector: {
      heading: 'HEAD says which label the next commit moves',
      body: 'Making a branch adds a label and nothing else, which is why it is instant. HEAD is Git\'s “you are here” marker. A commit moves the branch HEAD is on and leaves every other branch where it was.',
      facts: [['New word', 'HEAD: the branch you are on'], ['Commands', 'git branch idea, git switch idea']],
      evidence: ['Create and switch in one step', 'git switch -c idea'],
      note: 'HEAD can also sit directly on a commit with no branch between them, which Git calls a detached HEAD. Commits made there have no label holding them until you create one.',
    },
    takeaway: 'Creating a branch copies nothing. Committing moves only the branch that HEAD is on.',
    sources: [4, 5, 6],
  },
  {
    id: 'switching', aliases: ['checkout-switch-rebuilding-workspace'], group: 'Branches', label: 'Switching', mode: 'steps', terms: true,
    title: 'Switching rewrites your folder from a snapshot',
    lede: 'What happens to your files when HEAD moves?',
    frames: [
      {
        action: 'On idea',
        caption: 'HEAD is on idea, so your folder shows snapshot F. F added a cache line that E does not have.',
        scenes: [{ desk: [app(5, CACHE)], graph: { earlier: true, dots: [dot('E', 0), dot('F', 1, ['E'])], labels: [{ name: 'main', at: 'E' }, { name: 'idea', at: 'F' }], head: 'idea' } }],
      },
      {
        action: 'git switch main',
        caption: 'HEAD moves to main, and Git rewrites app.yaml to match snapshot E. The cache line is gone from the folder, not from F.',
        scenes: [{ desk: [file('app.yaml', ['name: shop', 'replicas: 5'], 'rewritten', 'restored')], graph: { earlier: true, dots: [dot('E', 0), dot('F', 1, ['E'])], labels: [{ name: 'main', at: 'E' }, { name: 'idea', at: 'F' }], head: 'main' } }],
      },
      {
        action: 'git switch idea',
        caption: 'Back on idea, the folder matches F again and the cache line returns.',
        scenes: [{ desk: [file('app.yaml', ['name: shop', 'replicas: 5', 'cache: on'], 'rewritten', 'restored', 2)], graph: { earlier: true, dots: [dot('E', 0), dot('F', 1, ['E'])], labels: [{ name: 'main', at: 'E' }, { name: 'idea', at: 'F' }], head: 'idea' } }],
      },
      {
        action: 'Edit app.yaml, then git switch main',
        caption: 'Switching would have to overwrite an edit you haven\'t saved, so Git refuses and moves nothing. Commit the edit or undo it, then switch.',
        scenes: [{
          desk: [app(7, CACHE, 'edited', 'edited')],
          graph: { earlier: true, dots: [dot('E', 0), dot('F', 1, ['E'])], labels: [{ name: 'main', at: 'E' }, { name: 'idea', at: 'F' }], head: 'idea' },
          notice: { tone: 'stop', label: 'Refused', text: 'error: Your local changes to the following files would be overwritten by checkout: app.yaml' },
        }],
      },
    ],
    inspector: {
      heading: 'Your folder shows one snapshot at a time',
      body: 'Switching moves HEAD to another branch and then makes your files match the commit that branch points at. Both versions stay in history; only the folder changes.',
      facts: [['In the picture', 'HEAD hops; the file is rewritten'], ['Command', 'git switch main']],
      evidence: ['Check before you switch', 'git status'],
      note: 'Git refuses only when an unsaved edit touches a file that differs between the two commits. An edit to a file that is the same on both sides travels with you.',
    },
    takeaway: 'Switching branches changes which snapshot your folder shows, and Git won\'t overwrite unsaved work to do it.',
    sources: [6],
  },
  {
    id: 'merge', group: 'Combine', label: 'Fork and join', mode: 'steps', terms: true,
    title: 'Merging joins two lines of work',
    lede: 'idea worked. Now bring it into main.',
    frames: [
      {
        action: 'idea is ahead',
        caption: 'idea has one snapshot that main lacks. You are on main.',
        scenes: [{ graph: { earlier: true, dots: [dot('E', 0), dot('F', 1, ['E'])], labels: [{ name: 'idea', at: 'F' }, { name: 'main', at: 'E' }], head: 'main' } }],
      },
      {
        action: 'git merge idea',
        caption: 'There was nothing to combine, so main slides forward to F. Git calls this a fast-forward. No new dot was needed.',
        scenes: [{ graph: { earlier: true, dots: [dot('E', 0), dot('F', 1, ['E'])], labels: [{ name: 'idea', at: 'F' }, { name: 'main', at: 'F' }], head: 'main' }, notice: { tone: 'ok', label: 'Done', text: 'Fast-forward' } }],
      },
      {
        action: 'Commit on both branches',
        caption: 'G raised replicas on main. H added a timeout on idea. Each label now has a snapshot the other lacks: history has forked at F.',
        scenes: [{ graph: { earlier: true, dots: [dot('E', 0), dot('F', 1, ['E']), dot('G', 2, ['F'], 0, { fresh: true }), dot('H', 2, ['F'], 1, { fresh: true })], labels: [{ name: 'main', at: 'G' }, { name: 'idea', at: 'H' }], head: 'main' } }],
      },
      {
        action: 'git merge idea',
        caption: 'M is a snapshot with two parents. It contains both changes, and idea has not moved.',
        scenes: [{
          graph: { earlier: true, dots: [dot('E', 0), dot('F', 1, ['E']), dot('G', 2, ['F']), dot('H', 2, ['F'], 1), dot('M', 3, ['G', 'H'], 0, { fresh: true, peek: true })], labels: [{ name: 'main', at: 'M' }, { name: 'idea', at: 'H' }], head: 'main' },
          peek: { id: 'M', files: [file('app.yaml', ['name: shop', 'replicas: 6', 'cache: on', 'timeout: 30'])] },
        }],
      },
    ],
    inspector: {
      heading: 'A merge either slides a label or adds a dot with two parents',
      body: 'If the other branch is simply ahead, Git moves your label forward. If both branches have new commits, Git combines the two sets of changes into one new commit that points back at both.',
      facts: [['New words', 'fast-forward, merge commit'], ['Command', 'git merge idea']],
      evidence: ['See the fork and the join', 'git log --oneline --graph'],
      note: 'You merge into the branch HEAD is on. The branch you name is read, never moved.',
    },
    takeaway: 'A merge commit is an ordinary snapshot that happens to have two parents.',
    sources: [7],
  },
  {
    id: 'conflict', aliases: ['merge-conflicts-three-stage-index'], group: 'Combine', label: 'Conflict', mode: 'steps', terms: true,
    title: 'A conflict is Git asking you to choose',
    lede: 'Both branches changed the same line.',
    frames: [
      {
        action: 'Same line, two answers',
        caption: 'A new branch, tune, starts at M. Then main sets replicas to 8 in I, and tune sets the same line to 10 in J.',
        scenes: [{
          desk: [app(8, FULL)],
          graph: { earlier: true, dots: [dot('M', 0), dot('I', 1, ['M']), dot('J', 1, ['M'], 1, { peek: true })], labels: [{ name: 'main', at: 'I' }, { name: 'tune', at: 'J' }], head: 'main' },
          peek: { id: 'J', files: [file('app.yaml', ['name: shop', 'replicas: 10', 'cache: on', 'timeout: 30'], undefined, undefined, 1)] },
        }],
      },
      {
        action: 'git merge tune',
        caption: 'Git cannot pick a number for you. It stops, adds no dot, and writes both versions into the file between markers.',
        scenes: [{
          desk: [file('app.yaml', ['name: shop', '<<<<<<< HEAD', 'replicas: 8', '=======', 'replicas: 10', '>>>>>>> tune', 'cache: on', 'timeout: 30'], 'conflict', 'conflict')],
          graph: { earlier: true, dots: [dot('M', 0), dot('I', 1, ['M']), dot('J', 1, ['M'], 1)], labels: [{ name: 'main', at: 'I' }, { name: 'tune', at: 'J' }], head: 'main' },
          notice: { tone: 'warn', label: 'Paused', text: 'CONFLICT (content): Merge conflict in app.yaml' },
        }],
      },
      {
        action: 'Edit the file: keep 10',
        caption: 'You decide. Delete the markers and leave the line you want.',
        scenes: [{
          desk: [app(10, FULL, 'edited', 'edited')],
          graph: { earlier: true, dots: [dot('M', 0), dot('I', 1, ['M']), dot('J', 1, ['M'], 1)], labels: [{ name: 'main', at: 'I' }, { name: 'tune', at: 'J' }], head: 'main' },
          notice: { tone: 'warn', label: 'Paused', text: 'The merge is still open until you stage the file and commit' },
        }],
      },
      {
        action: 'git add app.yaml, then git commit',
        caption: 'Staging the file tells Git the question is settled. The commit is an ordinary merge snapshot with two parents.',
        scenes: [{
          desk: [app(10, FULL)],
          graph: { earlier: true, dots: [dot('M', 0), dot('I', 1, ['M']), dot('J', 1, ['M'], 1), dot('N', 2, ['I', 'J'], 0, { fresh: true, peek: true })], labels: [{ name: 'main', at: 'N' }, { name: 'tune', at: 'J' }], head: 'main' },
          peek: { id: 'N', files: [app(10, FULL)] },
        }],
      },
    ],
    inspector: {
      heading: 'Git merges what it can and stops where it can\'t',
      body: 'Changes to different lines combine on their own, as they did in the last view. When both sides change the same lines, Git has no rule for choosing, so it hands the file to you and waits.',
      facts: [['In the file', 'Yours above =======, theirs below'], ['To finish', 'edit, git add, git commit']],
      evidence: ['Back out and try later', 'git merge --abort'],
      note: 'Until you commit or abort, the repository is in the middle of a merge. Nothing on either branch has moved, so backing out loses only your conflict edits.',
    },
    takeaway: 'A conflict pauses the merge. You settle the file, stage it, and commit to finish.',
    sources: [7],
  },
  {
    id: 'rebase', aliases: ['merge-vs-rebase-graph-surgery'], group: 'Combine', label: 'Rebase', mode: 'steps', terms: true,
    title: 'Rebase copies your work onto a new starting point',
    lede: 'You would rather have one straight line than a fork and a join.',
    frames: [
      {
        action: 'A fork again',
        caption: 'A new branch, fix, started at N. Since then main gained O and fix gained P. You are on fix.',
        scenes: [{ graph: { earlier: true, dots: [dot('N', 0), dot('O', 1, ['N']), dot('P', 1, ['N'], 1)], labels: [{ name: 'main', at: 'O' }, { name: 'fix', at: 'P' }], head: 'fix' } }],
      },
      {
        action: 'git rebase main',
        caption: 'Git replays P\'s change on top of O as a new snapshot, P′, and moves fix onto it. The old P is still there, but no label points at it.',
        scenes: [{ graph: { earlier: true, dots: [dot('N', 0), dot('O', 1, ['N']), dot('P', 1, ['N'], 1, { ghost: true }), dot('P′', 2, ['O'], 0, { fresh: true })], labels: [{ name: 'main', at: 'O' }, { name: 'fix', at: 'P′' }], head: 'fix' } }],
      },
      {
        action: 'Compare with a merge',
        caption: 'The files end up the same either way. Rebase gives a straight line made of new snapshots; merge keeps both lines and joins them.',
        scenes: [
          { title: 'After git rebase main', graph: { earlier: true, dots: [dot('N', 0), dot('O', 1, ['N']), dot('P', 1, ['N'], 1, { ghost: true }), dot('P′', 2, ['O'])], labels: [{ name: 'main', at: 'O' }, { name: 'fix', at: 'P′' }], head: 'fix' } },
          { title: 'If you had run git merge main', graph: { earlier: true, dots: [dot('N', 0), dot('O', 1, ['N']), dot('P', 1, ['N'], 1), dot('X', 2, ['P', 'O'], 1)], labels: [{ name: 'main', at: 'O' }, { name: 'fix', at: 'X' }], head: 'fix' } },
        ],
      },
    ],
    inspector: {
      heading: 'Rebase makes new commits; it does not move old ones',
      body: 'P was built on N. A commit cannot change its parent, so Git creates P′ with the same change and O as its parent, then moves your branch to it. The original is left behind without a label.',
      facts: [['In the picture', 'Dashed dot: the old copy'], ['Command', 'git rebase main']],
      evidence: ['Stop a rebase part-way', 'git rebase --abort'],
      note: 'Rebase only work that nobody else has yet. If the old commits were already shared, other people are still building on them, and view 12 shows the disagreement that causes.',
    },
    takeaway: 'Merge preserves how the work happened. Rebase rewrites it as if it had started later.',
    sources: [8, 7],
  },
  {
    id: 'remote', aliases: ['remotes-fetch-and-push'], group: 'Share', label: 'Two timelines', mode: 'steps', terms: true,
    title: 'A remote is another copy of the same timeline',
    lede: 'A shared server holds the project too.',
    frames: [
      {
        action: 'Two copies',
        caption: 'The shared copy is called origin. It has its own dots and its own main. Right now both copies end at Q.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('Q', 0)], labels: [{ name: 'main', at: 'Q' }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('Q', 0)], labels: [{ name: 'main', at: 'Q' }] } },
        ],
      },
      {
        action: 'git commit',
        caption: 'Your main moves to R. The dashed label origin/main has been on Q since you copied the project: it is your note of where the shared main was when you last checked.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q'], 0, { fresh: true })], labels: [{ name: 'origin/main', at: 'Q', remote: true, fresh: true }, { name: 'main', at: 'R' }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('Q', 0)], labels: [{ name: 'main', at: 'Q' }] } },
        ],
      },
      {
        action: 'git push',
        caption: 'Push sends R to origin and moves the shared main onto it. Your note, origin/main, is updated to match.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q'])], labels: [{ name: 'main', at: 'R' }, { name: 'origin/main', at: 'R', remote: true }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q'], 0, { fresh: true })], labels: [{ name: 'main', at: 'R' }] } },
        ],
      },
      {
        action: 'A teammate pushes S',
        caption: 'origin has moved on. Your copy has not heard: origin/main still says R.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q'])], labels: [{ name: 'main', at: 'R' }, { name: 'origin/main', at: 'R', remote: true }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q']), dot('S', 2, ['R'], 0, { fresh: true })], labels: [{ name: 'main', at: 'S' }] } },
        ],
      },
      {
        action: 'git fetch',
        caption: 'Fetch downloads S and moves only origin/main. Your main and your files are untouched.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q']), dot('S', 2, ['R'], 0, { fresh: true })], labels: [{ name: 'main', at: 'R' }, { name: 'origin/main', at: 'S', remote: true }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q']), dot('S', 2, ['R'])], labels: [{ name: 'main', at: 'S' }] } },
        ],
      },
      {
        action: 'git merge origin/main',
        caption: 'main fast-forwards to S, the same slide you saw in view 8. git pull runs fetch and this step together.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q']), dot('S', 2, ['R'])], labels: [{ name: 'origin/main', at: 'S', remote: true }, { name: 'main', at: 'S' }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('Q', 0), dot('R', 1, ['Q']), dot('S', 2, ['R'])], labels: [{ name: 'main', at: 'S' }] } },
        ],
      },
    ],
    inspector: {
      heading: 'Push and fetch carry dots and labels between copies',
      body: 'Each copy is a complete repository. Nothing travels between them until you ask. Push uploads your commits and moves the shared branch; fetch downloads theirs and moves your origin/ labels.',
      facts: [['New words', 'remote, origin, origin/main'], ['Commands', 'git push, git fetch, git pull']],
      evidence: ['Compare your branch with the note', 'git status -sb'],
      note: 'origin/main is stored on your computer and changes only when you fetch, pull, or push. It can be out of date without anything looking wrong.',
    },
    takeaway: 'origin/main is what you last saw, not what the server holds now. Fetch refreshes it.',
    sources: [9, 10, 11],
  },
  {
    id: 'out-of-sync', group: 'Share', label: 'Out of sync', mode: 'steps', terms: true,
    title: 'When both copies moved, combine first and then push',
    lede: 'You committed. So did a teammate.',
    frames: [
      {
        action: 'Both copies moved',
        caption: 'You committed T. Meanwhile a teammate pushed U. Each copy has a snapshot the other lacks.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('S', 0), dot('T', 1, ['S'])], labels: [{ name: 'origin/main', at: 'S', remote: true }, { name: 'main', at: 'T' }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('S', 0), dot('U', 1, ['S'])], labels: [{ name: 'main', at: 'U' }] } },
        ],
      },
      {
        action: 'git push',
        caption: 'origin refuses. Moving its main to T would drop U from the shared history. Nothing changed on either side.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('S', 0), dot('T', 1, ['S'])], labels: [{ name: 'origin/main', at: 'S', remote: true }, { name: 'main', at: 'T' }], head: 'main' }, notice: { tone: 'stop', label: 'Refused', text: '! [rejected] main -> main (fetch first)' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('S', 0), dot('U', 1, ['S'])], labels: [{ name: 'main', at: 'U' }] } },
        ],
      },
      {
        action: 'git fetch',
        caption: 'Now your copy has U and knows where the shared main is. Your own main is still on T.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('S', 0), dot('T', 1, ['S']), dot('U', 1, ['S'], 1, { fresh: true })], labels: [{ name: 'main', at: 'T' }, { name: 'origin/main', at: 'U', remote: true }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('S', 0), dot('U', 1, ['S'])], labels: [{ name: 'main', at: 'U' }] } },
        ],
      },
      {
        action: 'git merge origin/main',
        caption: 'The same join as view 8: V has your T and their U as parents.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('S', 0), dot('T', 1, ['S']), dot('U', 1, ['S'], 1), dot('V', 2, ['T', 'U'], 0, { fresh: true })], labels: [{ name: 'main', at: 'V' }, { name: 'origin/main', at: 'U', remote: true }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('S', 0), dot('U', 1, ['S'])], labels: [{ name: 'main', at: 'U' }] } },
        ],
      },
      {
        action: 'git push',
        caption: 'origin already had U, so it receives T and V. The shared main moves forward and nobody\'s work is dropped.',
        scenes: [
          { title: 'Your computer', graph: { earlier: true, dots: [dot('S', 0), dot('T', 1, ['S']), dot('U', 1, ['S'], 1), dot('V', 2, ['T', 'U'])], labels: [{ name: 'main', at: 'V' }, { name: 'origin/main', at: 'V', remote: true }], head: 'main' } },
          { title: 'Shared copy · origin', graph: { earlier: true, dots: [dot('S', 0), dot('U', 1, ['S']), dot('T', 1, ['S'], 1, { fresh: true }), dot('V', 2, ['T', 'U'], 0, { fresh: true })], labels: [{ name: 'main', at: 'V' }] } },
        ],
      },
    ],
    inspector: {
      heading: 'A push may only move the shared branch forward',
      body: 'origin accepts a push when the commit you send has the current shared commit somewhere behind it. If it doesn\'t, you are missing someone\'s work, so you fetch it, combine it with yours, and push the result.',
      facts: [['Why it bounced', 'T does not have U behind it'], ['The loop', 'fetch, merge or rebase, push']],
      evidence: ['Fetch and replay yours on top', 'git pull --rebase'],
      note: 'git push --force makes origin take your branch anyway and discards what was there. This is how a rebase of shared commits loses a teammate\'s work.',
    },
    takeaway: 'A rejected push means the server has commits you don\'t. Bring them in, then push again.',
    sources: [10, 9, 11],
  },
  {
    id: 'undo', aliases: ['reset-restore-revert'], group: 'Undo and inside', label: 'Undo', mode: 'choices', terms: true,
    title: 'To undo, pick which place to rewind',
    lede: 'Four different things people mean by “undo”.',
    frames: [
      {
        action: 'git restore app.yaml',
        caption: 'Rewinds your folder. Git copies the file back from the staging area, and the edit is gone for good because it was never saved anywhere else.',
        scenes: [
          { title: 'Before', desk: [app(14, FULL, 'edited', 'edited')], tray: [], graph: { earlier: true, dots: [dot('V', 0), dot('W', 1, ['V'])], labels: [{ name: 'main', at: 'W' }], head: 'main' } },
          { title: 'After', desk: [app(12, FULL, 'restored', 'restored')], tray: [], graph: { earlier: true, dots: [dot('V', 0), dot('W', 1, ['V'])], labels: [{ name: 'main', at: 'W' }], head: 'main' }, notice: { tone: 'stop', label: 'Lost', text: 'The edit to 14 cannot be recovered' } },
        ],
      },
      {
        action: 'git restore --staged notes.md',
        caption: 'Rewinds the staging area. The file leaves the next commit, and your edit is still in the folder.',
        scenes: [
          { title: 'Before', desk: [notes(['- ship it'], 'edited', 'edited')], tray: [notes(['- ship it'], 'staged', 'staged')], graph: { earlier: true, dots: [dot('V', 0), dot('W', 1, ['V'])], labels: [{ name: 'main', at: 'W' }], head: 'main' } },
          { title: 'After', desk: [notes(['- ship it'], 'edited', 'edited')], tray: [], graph: { earlier: true, dots: [dot('V', 0), dot('W', 1, ['V'])], labels: [{ name: 'main', at: 'W' }], head: 'main' } },
        ],
      },
      {
        action: 'git reset HEAD~1',
        caption: 'Rewinds the label. main moves back one snapshot to V. W\'s change stays in your folder as an unsaved edit, and W itself is left without a label.',
        scenes: [
          { title: 'Before', desk: [app(12, FULL)], tray: [], graph: { earlier: true, dots: [dot('V', 0), dot('W', 1, ['V'])], labels: [{ name: 'main', at: 'W' }], head: 'main' } },
          { title: 'After', desk: [app(12, FULL, 'edited', 'edited')], tray: [], graph: { earlier: true, dots: [dot('V', 0), dot('W', 1, ['V'], 0, { ghost: true })], labels: [{ name: 'main', at: 'V' }], head: 'main' } },
        ],
      },
      {
        action: 'git revert HEAD',
        caption: 'Rewinds nothing. Git adds a new snapshot that reverses W\'s change, so the history others have already seen stays intact.',
        scenes: [
          { title: 'Before', desk: [app(12, FULL)], tray: [], graph: { earlier: true, dots: [dot('V', 0), dot('W', 1, ['V'])], labels: [{ name: 'main', at: 'W' }], head: 'main' } },
          { title: 'After', desk: [app(10, FULL, 'rewritten', 'restored')], tray: [], graph: { earlier: true, dots: [dot('V', 0), dot('W', 1, ['V']), dot('Y', 2, ['W'], 0, { fresh: true, sub: 'undoes W' })], labels: [{ name: 'main', at: 'Y' }], head: 'main' } },
        ],
      },
    ],
    inspector: {
      heading: 'Undo depends on how far the change has travelled',
      body: 'An edit that is only in your folder can be thrown away. A staged file can be taken back out. A commit only you have can be dropped by moving the label. A commit others already have should be cancelled with a new commit.',
      facts: [['HEAD~1', 'The commit one step before HEAD'], ['Safe after pushing', 'git revert']],
      evidence: ['Reset, and choose how far it reaches', 'git reset --soft | --mixed | --hard'],
      note: 'git reset --hard also rewrites your folder to match, destroying unsaved edits. Plain git reset (the default, --mixed) keeps them; --soft keeps the staging area as well.',
    },
    takeaway: 'Restore rewinds a file, reset rewinds a label, and revert adds a commit that cancels another.',
    sources: [12, 13, 14],
  },
  {
    id: 'inside-a-commit', aliases: ['plumbing-objects-and-refs', 'reflog-recovery', 'worktrees-reflog-and-plumbing'], group: 'Undo and inside', label: 'Inside a dot', mode: 'steps', terms: true,
    title: 'What a dot is made of',
    lede: 'Open a commit and see why the earlier views behaved as they did.',
    frames: [
      {
        action: 'Open a commit',
        caption: 'Four things are inside: a snapshot of the folder, the parent, who and when, and a message. The letters were nicknames. The real name is a fingerprint computed from these contents.',
        scenes: [{ cards: [{ title: 'commit 4f9c2e1', sub: 'the dot you called W', tone: 'commit', rows: [['snapshot', 'tree 8a31d07'], ['parent', '1c7be52'], ['author', 'you · Tue 14:02'], ['message', 'Raise replicas to 12']] }] }],
      },
      {
        action: 'Open the snapshot',
        caption: 'The snapshot is a list of file names, each pointing at stored contents. notes.md has not changed since A, so every commit since then points at the same stored copy.',
        scenes: [{ cards: [
          { title: 'commit 4f9c2e1', tone: 'commit', hot: 0, rows: [['snapshot', 'tree 8a31d07'], ['parent', '1c7be52']] },
          { title: 'tree 8a31d07', sub: 'the folder listing', tone: 'tree', rows: [['app.yaml', 'blob e52b9d4'], ['notes.md', 'blob 0d6f1aa']] },
          { title: 'blob 0d6f1aa', sub: 'contents of notes.md, stored once', tone: 'blob', rows: [['', '- add a cache']] },
        ] }],
      },
      {
        action: 'Change only the parent',
        caption: 'Same files, same message, different parent, so a different fingerprint. This is why rebase had to create P′ instead of moving P.',
        scenes: [{ cards: [
          { title: 'commit 4f9c2e1', sub: 'original', tone: 'commit', hot: 1, rows: [['snapshot', 'tree 8a31d07'], ['parent', '1c7be52']] },
          { title: 'commit b83a0f6', sub: 'the rebased copy', tone: 'commit', hot: 1, rows: [['snapshot', 'tree 8a31d07'], ['parent', '97de310']] },
        ] }],
      },
      {
        action: 'Find a dot with no label',
        caption: 'Git keeps a diary of everywhere HEAD has been. A commit that lost its label is still listed there, and a new label brings it back.',
        scenes: [{ cards: [
          { title: 'git reflog', sub: 'newest first', tone: 'log', hot: 1, rows: [['1c7be52', 'HEAD@{0}: reset: moving to HEAD~1'], ['4f9c2e1', 'HEAD@{1}: commit: Raise replicas to 12'], ['1c7be52', 'HEAD@{2}: commit (merge): Merge origin/main']] },
          { title: 'git branch rescue 4f9c2e1', sub: 'a label on the lost commit', tone: 'commit', rows: [['rescue', '→ 4f9c2e1'], ['main', '→ 1c7be52']] },
        ] }],
      },
    ],
    inspector: {
      heading: 'A commit\'s name is computed from what it contains',
      body: 'Because the fingerprint covers the snapshot and the parent, a commit can never be edited in place: any change produces a different commit. That is what makes old dots trustworthy, and why rewriting history always means making new dots.',
      facts: [['New words', 'hash, tree, blob, reflog'], ['A label is', 'a small file holding one hash']],
      evidence: ['Print a commit\'s contents', 'git cat-file -p HEAD'],
      note: 'The hashes here are illustrative. The reflog is local and its entries expire: by default Git keeps entries for commits with no label for at least 30 days. Edits you never committed are not in it.',
    },
    takeaway: 'Commits are immutable and named by content, so Git only ever adds a snapshot or moves a label.',
    sources: [16, 15],
  },
];

export const gitGroups = [...new Set(gitViews.map((view) => view.group))];

/** Graph geometry, shared by every frame of a view so nothing shifts between steps. */
export const COL = 110;
export const LANE = 86;
export const RADIUS = 17;
export const TAG = 24;
export type GraphBox = { width: number; height: number; top: number; left: number };

const stack = (graph: Graph, id: string) => (graph.labels ?? []).filter((label) => label.at === id).length;

export function graphBox(graphs: Graph[]): GraphBox {
  let cols = 0, lanes = 0, above = 0, below = 0, sub = false, earlier = false;
  for (const graph of graphs) {
    earlier ||= Boolean(graph.earlier);
    for (const item of graph.dots) {
      cols = Math.max(cols, item.col);
      lanes = Math.max(lanes, item.lane ?? 0);
      sub ||= Boolean(item.sub);
      if ((item.lane ?? 0) === 0) above = Math.max(above, stack(graph, item.id));
      else below = Math.max(below, stack(graph, item.id));
    }
  }
  const left = earlier ? 78 : 50;
  const top = 14 + above * TAG + RADIUS + 8;
  const bottom = Math.max(below * TAG + 8, sub ? 26 : 0);
  return { left, top, width: left + cols * COL + 62, height: top + lanes * LANE + RADIUS + bottom + 12 };
}
