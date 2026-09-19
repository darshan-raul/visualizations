export interface GitFile {
  path: string;
  name: string;
  status?: 'M' | 'A' | 'MM' | '??' | 'UU' | 'D';
  isDir?: boolean;
  depth?: number;
  highlight?: boolean;
}

export interface StateShelfItem {
  label: string;
  value: string;
  detail?: string;
  badge?: 'neutral' | 'changed' | 'warning' | 'success';
}

export interface GitInternalsState {
  head: string;
  branchRef: string;
  commitHash?: string;
  commitMsg?: string;
  treeHash?: string;
  treeDetail?: string;
  blobHash?: string;
  blobDetail?: string;
}

export interface LabStep {
  label: string;
  command: string;
  output: string[];
  files: GitFile[];
  shelf: StateShelfItem[];
  inspectorState: string;
  inspectorDetail: string;
  inspectorOperation: string;
  internalChange: string;
  takeaway: string;
  caveat?: string;
  dagNodeId?: string;
  worktreePath?: string;
  plumbingCommand?: string;
  xrayNote?: string;
  internals?: GitInternalsState;
}

export interface GitLab {
  id: string;
  level: number;
  title: string;
  label: string;
  group: string;
  path: string;
  branch: string;
  question: string;
  takeaway: string;
  caveat: string;
  inspector: string;
  whatLearnerThinks: string;
  whatWeReveal: string;
  steps: LabStep[];
  sources: string[];
}

export const gitViews: GitLab[] = [
  // =========================================================================
  // LEVEL 1: WHERE IS GIT?
  // =========================================================================
  {
    id: 'where-is-git',
    level: 1,
    title: 'Level 1: Where Did Git Put Everything?',
    label: '01. Where is Git?',
    group: 'Foundations: Inside .git',
    path: '.git/',
    branch: 'main',
    question: 'When you run git init, where does Git actually live and how does it track your files?',
    whatLearnerThinks: '“Git tracks this folder.”',
    whatWeReveal: 'Working directory vs hidden .git repository. Four doors: HEAD, index, objects/, refs/.',
    takeaway: 'Git does not inject metadata into your files. It creates a single hidden .git directory containing four critical structures: HEAD, index, objects/, and refs/. Everything else in your project is just your ordinary working tree.',
    caveat: 'Deleting the hidden .git directory completely destroys all commit history, branches, and staging information without touching your current working tree files.',
    inspector: 'Inspect the newly initialized repository. Notice the clean separation between ordinary filesystem files and the hidden .git metadata database.',
    sources: [
      'https://git-scm.com/docs/git-init',
      'https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain'
    ],
    steps: [
      {
        label: '1. mkdir & inspect folder',
        command: 'mkdir infra-platform && cd infra-platform && ls -la',
        output: [
          'dev@lab:~$ mkdir infra-platform && cd infra-platform',
          'total 4',
          'drwxr-xr-x 2 dev dev 4096 Sep 19 14:00 .',
          'drwxr-xr-x 4 dev dev 4096 Sep 19 14:00 ..',
          '-rw-r--r-- 1 dev dev   94 Sep 19 14:00 deployment.yaml',
          '-rw-r--r-- 1 dev dev  140 Sep 19 14:00 README.md',
          '# A regular Linux folder with files. Git is not present yet.'
        ],
        files: [
          { path: 'app', name: 'app/', isDir: true, depth: 0 },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 1 },
          { path: 'README.md', name: 'README.md', depth: 0 }
        ],
        shelf: [
          { label: 'Working Tree', value: 'infra-platform/', detail: 'Ordinary files on disk', badge: 'neutral' },
          { label: 'Git Database', value: 'Not Initialized', detail: 'No .git directory yet', badge: 'warning' },
          { label: 'HEAD Reference', value: 'None', detail: 'Repository does not exist', badge: 'neutral' },
          { label: 'Tracking Mode', value: 'Untracked', detail: 'Ordinary OS filesystem', badge: 'neutral' }
        ],
        inspectorState: 'Ordinary Operating System Directory',
        inspectorDetail: 'The directory contains files, but Git is not yet active. Git tracks nothing until you initialize a repository with git init.',
        inspectorOperation: 'mkdir infra-platform',
        internalChange: 'Standard filesystem inode creation. Zero Git metadata.',
        takeaway: 'Before git init, files are just ordinary bytes managed exclusively by the operating system filesystem.',
        plumbingCommand: 'test -d .git || echo "No repository"',
        xrayNote: 'Filesystem view shows raw files. No .git metadata exists.'
      },
      {
        label: '2. git init (create .git)',
        command: 'git init -b main',
        output: [
          'Initialized empty Git repository in /home/dev/repos/infra-platform/.git/',
          '# Git just created the hidden .git directory!',
          '# All repository state, objects, and refs will live here.'
        ],
        files: [
          { path: '.git', name: '.git/ [Git Repository Database]', isDir: true, depth: 0, highlight: true },
          { path: '.git/HEAD', name: 'HEAD (active ref pointer)', depth: 1 },
          { path: '.git/objects', name: 'objects/ (content store)', isDir: true, depth: 1 },
          { path: '.git/refs', name: 'refs/ (branch pointers)', isDir: true, depth: 1 },
          { path: 'app', name: 'app/', isDir: true, depth: 0 },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 1, status: '??' },
          { path: 'README.md', name: 'README.md', depth: 0, status: '??' }
        ],
        shelf: [
          { label: 'Working Tree', value: '2 files (??)', detail: 'Untracked by Git', badge: 'warning' },
          { label: '.git Created', value: 'Active Database', detail: 'Hidden metadata container', badge: 'success' },
          { label: 'Default Branch', value: 'main', detail: 'Symbolic target in HEAD', badge: 'neutral' },
          { label: 'Object DB', value: 'Empty (0 objects)', detail: 'No blobs written yet', badge: 'neutral' }
        ],
        inspectorState: 'Git Repository Initialized',
        inspectorDetail: 'git init created the hidden .git directory. Your project is now split into two worlds: the visible Working Tree and the hidden Git Database.',
        inspectorOperation: 'git init -b main',
        internalChange: '.git directory initialized with HEAD, config, objects/, and refs/heads/.',
        takeaway: 'Git is not an external cloud service; Git is simply this hidden .git folder sitting right inside your project directory.',
        plumbingCommand: 'git rev-parse --git-dir',
        xrayNote: '.git appears! Notice how clean the separation is between working files and repository metadata.'
      },
      {
        label: '3. open the four doors of .git',
        command: 'find .git -maxdepth 2',
        output: [
          '.git',
          '.git/HEAD',
          '.git/config',
          '.git/description',
          '.git/hooks',
          '.git/info',
          '.git/objects',
          '.git/refs',
          '.git/refs/heads',
          '.git/refs/tags',
          '# THE FOUR CRITICAL DOORS OF GIT:',
          '# 1. HEAD       -> your "you are here" pointer',
          '# 2. index      -> staging ledger (created on first git add)',
          '# 3. objects/   -> immutable content-addressed storage (blobs, trees, commits)',
          '# 4. refs/      -> named pointers (branches & tags)'
        ],
        files: [
          { path: '.git/HEAD', name: 'HEAD -> refs/heads/main', depth: 1, highlight: true },
          { path: '.git/index', name: 'index (staging ledger)', depth: 1 },
          { path: '.git/objects', name: 'objects/ (content store)', isDir: true, depth: 1, highlight: true },
          { path: '.git/refs', name: 'refs/heads/ (branch pointers)', isDir: true, depth: 1, highlight: true },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0, status: '??' },
          { path: 'README.md', name: 'README.md', depth: 0, status: '??' }
        ],
        shelf: [
          { label: 'Door 1: HEAD', value: 'refs/heads/main', detail: 'Symbolic pointer', badge: 'neutral' },
          { label: 'Door 2: index', value: 'Awaiting git add', detail: 'Snapshot candidate ledger', badge: 'neutral' },
          { label: 'Door 3: objects', value: '4 Object Types', detail: 'blob, tree, commit, tag', badge: 'neutral' },
          { label: 'Door 4: refs', value: 'refs/heads/', detail: 'Branch name records', badge: 'neutral' }
        ],
        inspectorState: 'The Core Anatomy of Git',
        inspectorDetail: 'Almost everything in Git lives behind these four doors: HEAD points to your active ref, index stages snapshots, objects/ stores immutable data, and refs/ stores branch names.',
        inspectorOperation: 'ls -la .git',
        internalChange: 'Reading filesystem metadata. HEAD initialized to ref: refs/heads/main.',
        takeaway: 'Mastering Git internals is simply understanding how HEAD, index, objects/, and refs/ interact when you run everyday commands.',
        plumbingCommand: 'cat .git/HEAD',
        xrayNote: 'Turn on X-Ray mode to see the internal files highlighted in cyan.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 2: WHAT GIT ADD ACTUALLY DOES
  // =========================================================================
  {
    id: 'what-git-add-does',
    level: 2,
    title: 'Level 2: What git add Actually Does',
    label: '02. What git add Does',
    group: 'Foundations: Inside .git',
    path: 'app/deployment.yaml',
    branch: 'main',
    question: 'Why does git add exist, and what physically happens to your file when you stage it?',
    whatLearnerThinks: '“Git stages my file into a staging area.”',
    whatWeReveal: 'Working tree → SHA hash function → Blob object written to .git/objects/ → Path-to-SHA mapping recorded in index.',
    takeaway: 'git add does not merely flip a flag. It immediately hashes file contents, writes an immutable compressed blob object into .git/objects/, and registers the path-to-blob SHA mapping in the binary index.',
    caveat: 'Subsequent edits in the working tree are not automatically staged. If you edit a file after git add, you produce an MM state: staged change in the index, plus unstaged change in the working tree.',
    inspector: 'Watch the X-Ray transition as git add calculates SHA-1, creates loose object 7ab38f in .git/objects/, and updates the binary index.',
    sources: [
      'https://git-scm.com/docs/git-add',
      'https://git-scm.com/docs/git-ls-files',
      'https://git-scm.com/docs/git-cat-file'
    ],
    steps: [
      {
        label: '1. edit deployment.yaml (replicas: 2 -> 3)',
        command: 'sed -i "s/replicas: 2/replicas: 3/" app/deployment.yaml',
        output: [
          '# Edited app/deployment.yaml: replicas changed from 2 to 3',
          '$ git status -s',
          ' M app/deployment.yaml',
          '# Working tree has modified bytes on disk.',
          '# Notice: Git has NOT created any objects in .git yet!'
        ],
        files: [
          { path: 'app', name: 'app/', isDir: true, depth: 0 },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 1, status: 'M', highlight: true },
          { path: 'README.md', name: 'README.md', depth: 0 }
        ],
        shelf: [
          { label: 'Working Tree', value: 'replicas: 3', detail: 'Modified locally on disk', badge: 'changed' },
          { label: 'Index (Staging)', value: 'replicas: 2 (old)', detail: 'Points to previous blob', badge: 'neutral' },
          { label: 'Object DB', value: 'No new blob', detail: 'Not created until git add', badge: 'warning' },
          { label: 'Status Badge', value: ' M (unstaged)', detail: 'Working tree modification', badge: 'warning' }
        ],
        inspectorState: 'Unstaged Working Tree Modification',
        inspectorDetail: 'Editing a file changes only bytes in your working tree. The index still holds the previous snapshot pointer, and no new object exists in .git/objects/.',
        inspectorOperation: 'File edit on disk',
        internalChange: 'OS file modified. File modification time and hash differ from index cache entry.',
        takeaway: 'Editing a file modifies only disk bytes. Git does not create objects or update history until you tell it to.',
        plumbingCommand: 'git diff --raw',
        xrayNote: 'Working tree is dirty (M). The index and .git/objects are completely unchanged.'
      },
      {
        label: '2. git add (hash & write blob)',
        command: 'git add app/deployment.yaml',
        output: [
          '$ git add app/deployment.yaml',
          '# X-RAY REVEAL: What Git actually did under the hood:',
          '# 1. Hashed content: sha1("blob 94\\0" + file_bytes) -> 7ab38f...',
          '# 2. Compressed with zlib & wrote: .git/objects/7a/b38f...',
          '# 3. Updated binary index: app/deployment.yaml -> 7ab38f... (mode 100644)',
          '',
          '$ git status -s',
          'M  app/deployment.yaml'
        ],
        files: [
          { path: '.git/objects/7a', name: 'objects/7a/b38f... [blob object]', depth: 1, highlight: true },
          { path: '.git/index', name: 'index [app/deployment.yaml -> 7ab38f]', depth: 1, highlight: true },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0, status: 'A', highlight: true }
        ],
        shelf: [
          { label: 'Working Tree', value: 'replicas: 3', detail: 'Matches staged index', badge: 'neutral' },
          { label: 'Index (Staging)', value: 'blob 7ab38f...', detail: 'Snapshot candidate registered', badge: 'changed' },
          { label: 'Object DB', value: 'blob 7ab38f written', detail: '.git/objects/7a/b38f...', badge: 'success' },
          { label: 'Status Badge', value: 'A  (staged)', detail: 'Ready for commit', badge: 'success' }
        ],
        inspectorState: 'Blob Created & Index Updated',
        inspectorDetail: 'git add did two physical things: 1) It wrote a new compressed blob into .git/objects/7a/b38f. 2) It registered that blob hash against path app/deployment.yaml in the index.',
        inspectorOperation: 'git add app/deployment.yaml',
        internalChange: 'Loose object written to .git/objects/7a/b38f... Binary index updated with mode 100644 and 7ab38f.',
        takeaway: 'git add is the moment content is permanently stored in Git. Staging is not an abstract concept; it is writing a blob and recording its hash in the index.',
        plumbingCommand: 'git hash-object -w app/deployment.yaml && git update-index --add --cacheinfo 100644 7ab38f app/deployment.yaml',
        xrayNote: 'Notice that blob 7ab38f was created immediately! The file content is already inside .git/objects.'
      },
      {
        label: '3. inspect index & blob (cat-file)',
        command: 'git ls-files --stage && git cat-file -p 7ab38f',
        output: [
          '$ git ls-files --stage',
          '100644 7ab38f912c9b4e19572d4f80164e29b1dc94f291 0   app/deployment.yaml',
          '100644 a48fe12018b8109a018901ef3381a90c1018901e 0   README.md',
          '',
          '$ git cat-file -t 7ab38f',
          'blob',
          '',
          '$ git cat-file -p 7ab38f',
          'apiVersion: apps/v1',
          'kind: Deployment',
          'metadata:',
          '  name: redis-cache',
          'spec:',
          '  replicas: 3',
          '',
          '# LOOK CLOSELY: Notice what is missing from the blob!',
          '# The blob contains ZERO filenames ("deployment.yaml" is not here!).',
          '# The filename lives in the index and directory trees, NOT in the blob.'
        ],
        files: [
          { path: '.git/index', name: 'index [100644 7ab38f app/deployment.yaml]', depth: 1, highlight: true },
          { path: '.git/objects/7a', name: 'objects/7a/b38f... [raw content]', depth: 1, highlight: true },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0, status: 'A' }
        ],
        shelf: [
          { label: 'Index Entry', value: '100644 7ab38f', detail: 'app/deployment.yaml', badge: 'neutral' },
          { label: 'Blob Type', value: 'blob (pure data)', detail: 'Raw bytes payload', badge: 'neutral' },
          { label: 'Filename in Blob?', value: 'NO (0 metadata)', detail: 'Only content bytes', badge: 'warning' },
          { label: 'Deduplication', value: '100% Hash Exact', detail: 'Identical files share 1 blob', badge: 'success' }
        ],
        inspectorState: 'Inspecting Raw Git Plumbing',
        inspectorDetail: 'git ls-files --stage prints the actual binary index table. git cat-file -p prints the uncompressed blob content. Notice that the filename app/deployment.yaml is recorded in the index, NOT inside the blob.',
        inspectorOperation: 'git ls-files --stage && git cat-file -p 7ab38f',
        internalChange: 'Plumbing query. Index and object database read without mutations.',
        takeaway: 'Blobs hold pure data. Filenames, paths, and POSIX permissions live in the index and directory tree objects.',
        plumbingCommand: 'git cat-file -p :app/deployment.yaml',
        xrayNote: 'The index pairs the filename with the blob hash. The blob itself is anonymous byte storage.'
      },
      {
        label: '4. edit again (3 -> 4) => MM status',
        command: 'sed -i "s/replicas: 3/replicas: 4/" app/deployment.yaml && git status -s',
        output: [
          '$ sed -i "s/replicas: 3/replicas: 4/" app/deployment.yaml',
          '$ git status -s',
          'MM app/deployment.yaml',
          '',
          '# THE "MM" MYSTERY SOLVED:',
          '# Col 1: Index vs HEAD (M = staged changes: replicas 3 differs from HEAD)',
          '# Col 2: Working tree vs Index (M = unstaged changes: replicas 4 differs from index 3)',
          '# The file exists in THREE distinct states simultaneously!'
        ],
        files: [
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0, status: 'MM', highlight: true },
          { path: '.git/index', name: 'index (holds replicas: 3)', depth: 1 },
          { path: '.git/objects/7a', name: 'objects/7a/b38f (holds replicas: 3)', depth: 1 }
        ],
        shelf: [
          { label: 'Working Tree', value: 'replicas: 4', detail: 'Unstaged local edit', badge: 'changed' },
          { label: 'Index (Staging)', value: 'blob 7ab38f (replicas: 3)', detail: 'Staged snapshot', badge: 'changed' },
          { label: 'HEAD Baseline', value: 'replicas: 2', detail: 'Committed state', badge: 'neutral' },
          { label: 'Status Badge', value: 'MM (3 distinct states)', detail: 'Staged + Modified', badge: 'warning' }
        ],
        inspectorState: 'Simultaneous Staged & Unstaged State (MM)',
        inspectorDetail: 'MM proves that staging is a physical snapshot. Column 1 (index vs HEAD) is M because replicas: 3 is staged. Column 2 (working tree vs index) is M because replicas: 4 is unstaged on disk.',
        inspectorOperation: 'git status -s (MM demonstration)',
        internalChange: 'Working tree disk bytes changed. Index still points to 7ab38f (replicas: 3).',
        takeaway: 'The index is a real snapshot candidate, not an invisible cache. A file can simultaneously differ across HEAD, index, and working tree.',
        plumbingCommand: 'git diff HEAD -- app/deployment.yaml',
        xrayNote: 'If you run git commit now, Git commits replicas: 3! Replicas: 4 remains unstaged in the working tree.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 3: WHAT GIT COMMIT REALLY CREATES
  // =========================================================================
  {
    id: 'what-git-commit-creates',
    level: 3,
    title: 'Level 3: What git commit Really Creates',
    label: '03. What git commit Creates',
    group: 'Foundations: Inside .git',
    path: '.git/objects',
    branch: 'main',
    question: 'Does a commit store a diff of your changes, or something completely different?',
    whatLearnerThinks: '“Git saves my changes as a bag of file diffs.”',
    whatWeReveal: 'Index written as Tree T1 → Tree wrapped in Commit C1 → branch ref moves. The branch moved, not the commit!',
    takeaway: 'Commits do not store diffs! A commit is an immutable plain-text envelope pointing to a full root tree snapshot, parent commit SHA(s), author/timestamp metadata, and a log message. The branch pointer simply advances to the new commit hash.',
    caveat: 'Changing a single character in a commit message or amending a timestamp creates an entirely new commit hash because the commit header is cryptographically sealed.',
    inspector: 'Watch the X-Ray commit animation: Index -> Tree T1 -> Commit C1 -> main branch pointer advances.',
    sources: [
      'https://git-scm.com/docs/git-commit',
      'https://git-scm.com/docs/git-write-tree',
      'https://git-scm.com/docs/git-commit-tree'
    ],
    steps: [
      {
        label: '1. inspect staged index snapshot',
        command: 'git status && git ls-files --stage',
        output: [
          '$ git status',
          'On branch main',
          'Changes to be committed:',
          '  (use "git restore --staged <file>..." to unstage)',
          '	modified:   app/deployment.yaml',
          '',
          '$ git ls-files --stage',
          '100644 7ab38f912c9b4e19572d4f80164e29b1dc94f291 0   app/deployment.yaml',
          '100644 a48fe12018b8109a018901ef3381a90c1018901e 0   README.md',
          '# The index contains the exact tree candidate ready to be frozen into history.'
        ],
        files: [
          { path: '.git/index', name: 'index (complete project snapshot)', depth: 1, highlight: true },
          { path: 'app/deployment.yaml', name: 'app/deployment.yaml (blob 7ab38f)', depth: 0, status: 'A' },
          { path: 'README.md', name: 'README.md (blob a48fe1)', depth: 0 }
        ],
        shelf: [
          { label: 'Active Ref', value: 'main', detail: 'refs/heads/main', badge: 'neutral' },
          { label: 'Index Entries', value: '2 paths registered', detail: 'Ready to write tree', badge: 'changed' },
          { label: 'Target Tree', value: 'Unwritten', detail: 'Will be written by commit', badge: 'neutral' },
          { label: 'Current HEAD', value: 'C0 (e78b21a)', detail: 'Parent commit', badge: 'neutral' }
        ],
        inspectorState: 'Index Snapshot Prepared',
        inspectorDetail: 'The index already holds all file modes, names, and blob hashes. When you run git commit, Git writes this table into a tree object.',
        inspectorOperation: 'git status',
        internalChange: 'No repository mutations. Index examined.',
        takeaway: 'The index is the blueprint for the tree object that git commit will create.',
        plumbingCommand: 'git write-tree --dry-run',
        xrayNote: 'All files are staged. The next command will freeze this index into a tree.'
      },
      {
        label: '2. git commit (write tree & mint commit)',
        command: 'git commit -m "Scale application to 3 replicas"',
        output: [
          '[main 4f901ab] Scale application to 3 replicas',
          ' 1 file changed, 1 insertion(+), 1 deletion(-)',
          '',
          '# X-RAY REVEAL: What git commit did in 3 atomic steps:',
          '# Step 1: Wrote index into Root Tree T1 (f419dc8)',
          '# Step 2: Minted Commit C1 (4f901ab) pointing to tree f419dc8 and parent e78b21a',
          '# Step 3: Advanced branch pointer refs/heads/main to 4f901ab!'
        ],
        files: [
          { path: '.git/objects/4f', name: 'objects/4f/901ab... [commit C1]', depth: 1, highlight: true },
          { path: '.git/objects/f4', name: 'objects/f4/19dc8... [root tree T1]', depth: 1, highlight: true },
          { path: '.git/refs/heads/main', name: 'refs/heads/main -> 4f901ab', depth: 1, highlight: true },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0 }
        ],
        shelf: [
          { label: 'Working Tree', value: 'Clean', detail: 'Matches new commit', badge: 'neutral' },
          { label: 'Tree Object', value: 'T1 (f419dc8)', detail: 'Full project snapshot', badge: 'changed' },
          { label: 'Commit Minted', value: 'C1 (4f901ab)', detail: 'Envelope sealed', badge: 'success' },
          { label: 'Branch Moved', value: 'main -> 4f901ab', detail: 'Pointer advanced', badge: 'changed' }
        ],
        inspectorState: 'Tree Written, Commit Minted, Branch Advanced',
        inspectorDetail: 'Git serialized the index into root tree f419dc8, created commit object 4f901ab referencing parent e78b21a, and updated refs/heads/main to point to 4f901ab.',
        inspectorOperation: 'git commit -m "Scale application to 3 replicas"',
        internalChange: 'Tree object and commit object written to .git/objects. Branch ref refs/heads/main updated.',
        takeaway: 'The commit was minted. The branch moved. The commit did not move.',
        plumbingCommand: 'TREE=$(git write-tree) && COMMIT=$(git commit-tree $TREE -p HEAD -m "msg") && git update-ref refs/heads/main $COMMIT',
        xrayNote: 'Notice: refs/heads/main simply updated its 40-character text file from e78b21a to 4f901ab.'
      },
      {
        label: '3. inspect commit envelope (cat-file -p)',
        command: 'git cat-file -p HEAD',
        output: [
          '$ git cat-file -p HEAD',
          'tree f419dc822a10b8921a9901ef2b8901aa9901ef338',
          'parent e78b21a049182bc018901ef3381a90c1018901ef',
          'author Dev <dev@lab> 1774011832 +0000',
          'committer Dev <dev@lab> 1774011832 +0000',
          '',
          'Scale application to 3 replicas',
          '',
          '# MYTH BUSTED: Look at the commit text above!',
          '# Where are the diffs? THERE ARE NO DIFFS.',
          '# A commit contains only 4 elements: tree pointer, parent pointer, author, and message.'
        ],
        files: [
          { path: '.git/objects/4f', name: 'objects/4f/901ab... [commit object text]', depth: 1, highlight: true },
          { path: '.git/refs/heads/main', name: 'main -> 4f901ab', depth: 1 }
        ],
        shelf: [
          { label: 'Commit SHA', value: '4f901ab...', detail: 'Cryptographically sealed', badge: 'success' },
          { label: 'Tree Pointer', value: 'f419dc8 (root)', detail: 'Snapshot, NOT a diff', badge: 'changed' },
          { label: 'Parent Pointer', value: 'e78b21a (root)', detail: 'Ancestor DAG node', badge: 'neutral' },
          { label: 'Diff Storage', value: 'ZERO diffs stored', detail: 'Calculated on demand', badge: 'success' }
        ],
        inspectorState: 'Commit Object Internals Revealed',
        inspectorDetail: 'A commit is an immutable plain-text envelope. It connects a root tree snapshot to previous history via parent pointers. Diffs are never stored on disk; they are computed on the fly by comparing trees.',
        inspectorOperation: 'git cat-file -p HEAD',
        internalChange: 'Reading commit object payload from .git/objects/4f/901ab...',
        takeaway: 'Git commits are snapshots, not diff chains. Every commit knows the exact state of the entire project via its root tree.',
        plumbingCommand: 'git rev-parse HEAD^{commit}',
        xrayNote: 'The commit object is just 180 bytes of text sealing tree, parent, and author together.'
      },
      {
        label: '4. inspect tree T1 (snapshot contents)',
        command: 'git cat-file -p HEAD^{tree}',
        output: [
          '$ git cat-file -p HEAD^{tree}',
          '040000 tree 7b2a901ee34a81ba01901ef2b8901aa9901ef338    app',
          '100644 blob a48fe12018b8109a018901ef3381a90c1018901e    README.md',
          '',
          '$ git cat-file -p 7b2a901',
          '100644 blob 7ab38f912c9b4e19572d4f80164e29b1dc94f291    deployment.yaml',
          '',
          '# Merkle Tree Hierarchy:',
          '# Root Tree (f419dc8) -> Subtree app/ (7b2a901) -> Blob (7ab38f)'
        ],
        files: [
          { path: '.git/objects/f4', name: 'objects/f4/19dc8... [root tree]', depth: 1, highlight: true },
          { path: '.git/objects/7b', name: 'objects/7b/2a901... [app/ subtree]', depth: 1, highlight: true },
          { path: '.git/objects/7a', name: 'objects/7a/b38f... [deployment.yaml blob]', depth: 1 }
        ],
        shelf: [
          { label: 'Root Tree', value: 'f419dc8', detail: 'Top-level directory', badge: 'neutral' },
          { label: 'Subtree app/', value: '7b2a901', detail: 'Directory table', badge: 'neutral' },
          { label: 'Blob deployment', value: '7ab38f', detail: 'Pure file content', badge: 'neutral' },
          { label: 'Architecture', value: 'Merkle DAG', detail: 'Hashes bubble up to root', badge: 'success' }
        ],
        inspectorState: 'Hierarchical Merkle Tree',
        inspectorDetail: 'Trees represent directories. Root tree f419dc8 points to subtree 7b2a901 (app/), which points to blob 7ab38f (deployment.yaml). Unmodified files (like README.md) are reused without duplicating storage.',
        inspectorOperation: 'git cat-file -p HEAD^{tree}',
        internalChange: 'Reading tree binary directory records.',
        takeaway: 'Directories are trees pointing to subtrees or blobs. Changing one file cascades hashes up to the root tree, creating a tamper-evident Merkle DAG.',
        plumbingCommand: 'git ls-tree -r HEAD',
        xrayNote: 'Notice how the tree structure forms a complete snapshot of your directory.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 4: BRANCHES ARE JUST MOVABLE REFERENCES
  // =========================================================================
  {
    id: 'branches-movable-refs',
    level: 4,
    title: 'Level 4: Branches Are Just Movable References',
    label: '04. Branches Are Pointers',
    group: 'Navigation & References',
    path: '.git/refs/heads/',
    branch: 'feature/cache',
    question: 'What is a branch physically on disk, and why is creating a branch instantaneous?',
    whatLearnerThinks: '“Branches contain different copies of my code in separate folders.”',
    whatWeReveal: 'A branch is a 41-byte plain-text file containing a commit hash. A branch is just a movable reference.',
    takeaway: 'A branch is not a container of files or a parallel folder. A branch is a 41-byte text file inside .git/refs/heads/ that stores the 40-character SHA of a commit. Creating a branch copies zero files; it writes 41 bytes to disk.',
    caveat: 'Deleting a branch deletes only the 41-byte pointer file. The commit objects remain in .git/objects/ until garbage-collected.',
    inspector: 'Inspect .git/refs/heads/ before and after creating feature/cache. See how Git tracks branches with lightweight pointer files.',
    sources: [
      'https://git-scm.com/docs/git-branch',
      'https://git-scm.com/docs/git-switch',
      'https://git-scm.com/book/en/v2/Git-Branching-Git-Branches-in-a-Nutshell'
    ],
    steps: [
      {
        label: '1. inspect .git/refs/heads/main',
        command: 'cat .git/refs/heads/main',
        output: [
          '$ cat .git/refs/heads/main',
          '4f901ab3c91820ba19028bc01928bc01928bc01a',
          '',
          '$ ls -lh .git/refs/heads/main',
          '-rw-r--r-- 1 dev dev 41 Sep 19 14:10 .git/refs/heads/main',
          '',
          '# LOOK AT THE FILE SIZE: 41 bytes!',
          '# 40 hexadecimal characters + 1 newline byte.',
          '# That is the entire physical reality of a Git branch on disk.'
        ],
        files: [
          { path: '.git/refs/heads/main', name: 'main (41 bytes text file)', depth: 1, highlight: true },
          { path: '.git/HEAD', name: 'HEAD -> ref: refs/heads/main', depth: 1 }
        ],
        shelf: [
          { label: 'Branch Name', value: 'main', detail: 'refs/heads/main', badge: 'neutral' },
          { label: 'Physical Size', value: '41 bytes', detail: 'Plain text file', badge: 'success' },
          { label: 'Target Commit', value: '4f901ab', detail: 'Current tip of main', badge: 'neutral' },
          { label: 'Disk Overhead', value: 'Zero file duplication', detail: 'Lightweight pointer', badge: 'success' }
        ],
        inspectorState: 'Branch Pointer on Disk',
        inspectorDetail: 'The branch main is literally a 41-byte text file containing 4f901ab. It contains no file contents, diffs, or directories.',
        inspectorOperation: 'cat .git/refs/heads/main',
        internalChange: 'Reading plain text ref file.',
        takeaway: 'In Git, branches are not heavy copies. A branch is just a 41-byte text file containing a commit hash.',
        plumbingCommand: 'git show-ref --heads',
        xrayNote: 'Notice the file size: exactly 41 bytes.'
      },
      {
        label: '2. git switch -c feature/cache',
        command: 'git switch -c feature/cache',
        output: [
          'Switched to a new branch \'feature/cache\'',
          '',
          '# X-RAY REVEAL: What Git physically did:',
          '# 1. Created .git/refs/heads/feature/cache containing 4f901ab (41 bytes)',
          '# 2. Updated .git/HEAD to: ref: refs/heads/feature/cache',
          '# ZERO files in your working directory were copied or altered!'
        ],
        files: [
          { path: '.git/refs/heads/feature/cache', name: 'feature/cache (41 bytes) -> 4f901ab', depth: 1, highlight: true },
          { path: '.git/refs/heads/main', name: 'main (41 bytes) -> 4f901ab', depth: 1 },
          { path: '.git/HEAD', name: 'HEAD -> ref: refs/heads/feature/cache', depth: 1, highlight: true }
        ],
        shelf: [
          { label: 'Active Branch', value: 'feature/cache', detail: 'Newly created ref', badge: 'changed' },
          { label: 'main Branch', value: '4f901ab', detail: 'Still points to C1', badge: 'neutral' },
          { label: 'HEAD Pointer', value: 'refs/heads/feature/cache', detail: 'Symbolic reference', badge: 'changed' },
          { label: 'Creation Time', value: '< 1 millisecond', detail: 'Wrote 41 bytes to disk', badge: 'success' }
        ],
        inspectorState: 'New Branch Reference Created',
        inspectorDetail: 'Both main and feature/cache now point to the exact same commit 4f901ab. HEAD was updated to point to feature/cache.',
        inspectorOperation: 'git switch -c feature/cache',
        internalChange: '.git/refs/heads/feature/cache written with 4f901ab. HEAD updated.',
        takeaway: 'Creating a branch in Git is virtually free. It creates a single 41-byte text file pointing to the current commit.',
        plumbingCommand: 'git update-ref refs/heads/feature/cache HEAD && git symbolic-ref HEAD refs/heads/feature/cache',
        xrayNote: 'Both branch pointers are now stacked on commit 4f901ab.'
      },
      {
        label: '3. commit on feature/cache',
        command: 'git commit -m "Add Redis cache configuration"',
        output: [
          '[feature/cache b14c80e] Add Redis cache configuration',
          ' 1 file changed, 8 insertions(+)',
          '',
          '# THE KEY SENTENCE BECOMES VISUALLY UNAVOIDABLE:',
          '# main          -> 4f901ab (C1)',
          '# feature/cache -> b14c80e (C2)',
          '#',
          '# The branch moved. The commit did not.'
        ],
        files: [
          { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> b14c80e [ADVANCED]', depth: 1, highlight: true },
          { path: '.git/refs/heads/main', name: 'main -> 4f901ab [STABLE]', depth: 1 },
          { path: '.git/HEAD', name: 'HEAD -> feature/cache', depth: 1 }
        ],
        shelf: [
          { label: 'feature/cache', value: 'b14c80e (C2)', detail: 'Advanced with new commit', badge: 'success' },
          { label: 'main branch', value: '4f901ab (C1)', detail: 'Unchanged at previous commit', badge: 'neutral' },
          { label: 'HEAD Target', value: 'feature/cache', detail: 'Followed active branch', badge: 'neutral' },
          { label: 'Branch Status', value: 'Diverged (ahead 1)', detail: '1 commit ahead of main', badge: 'changed' }
        ],
        inspectorState: 'Active Branch Ref Advanced',
        inspectorDetail: 'Committing advanced only the active branch ref feature/cache to b14c80e. The main ref remained at 4f901ab.',
        inspectorOperation: 'git commit -m "Add Redis cache configuration"',
        internalChange: 'New commit object b14c80e created. .git/refs/heads/feature/cache updated to b14c80e.',
        takeaway: 'A branch is just a movable reference. Committing moves the ref you are currently on; all other branches stay where they were.',
        plumbingCommand: 'git log --oneline --graph --all',
        xrayNote: 'Watch the graph: feature/cache moved forward to C2. Main stayed at C1.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 5: HEAD — THE "YOU ARE HERE" POINTER
  // =========================================================================
  {
    id: 'head-you-are-here',
    level: 5,
    title: 'Level 5: HEAD — The "You Are Here" Pointer',
    label: '05. HEAD & Detached State',
    group: 'Navigation & References',
    path: '.git/HEAD',
    branch: 'HEAD (detached)',
    question: 'What is HEAD, why does it point to a branch, and what really happens in detached HEAD?',
    whatLearnerThinks: '“HEAD is an invisible mysterious pointer, and detached HEAD is a fatal error.”',
    whatWeReveal: 'HEAD is your "you are here" pointer. In detached HEAD, HEAD points directly to a commit hash without an intermediate branch.',
    takeaway: 'HEAD is simply your active position in Git. Normally it points symbolically to a branch ref (HEAD -> refs/heads/main -> C1). When you checkout a specific commit SHA, HEAD detaches and points directly to that commit (HEAD -> C1). Commits made in detached HEAD are orphaned if you switch away without naming a branch.',
    caveat: 'Commits made while in detached HEAD are not deleted immediately if you switch away, but they become unreachable and will eventually be purged by git gc unless rescued.',
    inspector: 'Witness the symbolic pointer vs detached state transition in .git/HEAD.',
    sources: [
      'https://git-scm.com/docs/git-checkout#_detached_head',
      'https://git-scm.com/docs/git-symbolic-ref',
      'https://git-scm.com/book/en/v2/Git-Internals-Git-References'
    ],
    steps: [
      {
        label: '1. normal state: HEAD is symbolic',
        command: 'cat .git/HEAD',
        output: [
          '$ cat .git/HEAD',
          'ref: refs/heads/feature/cache',
          '',
          '# HEAD is a symbolic reference (a pointer to a pointer):',
          '# HEAD -> refs/heads/feature/cache -> b14c80e',
          '# When you run git commit, Git updates whatever ref HEAD points to.'
        ],
        files: [
          { path: '.git/HEAD', name: 'HEAD (ref: refs/heads/feature/cache)', depth: 1, highlight: true },
          { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> b14c80e', depth: 1 }
        ],
        shelf: [
          { label: 'HEAD State', value: 'Symbolic Reference', detail: 'Points to branch name', badge: 'neutral' },
          { label: 'Active Branch', value: 'feature/cache', detail: 'Target of HEAD', badge: 'neutral' },
          { label: 'Commit Target', value: 'b14c80e (C2)', detail: 'Tip of active branch', badge: 'neutral' },
          { label: 'Safety Mode', value: 'Safe (Branch Attached)', detail: 'Commits update branch', badge: 'success' }
        ],
        inspectorState: 'Symbolic Reference Attached',
        inspectorDetail: 'Normally .git/HEAD contains ref: refs/heads/<branch>. Git uses this indirection so committing advances the branch ref automatically.',
        inspectorOperation: 'cat .git/HEAD',
        internalChange: 'Reading HEAD symbolic pointer.',
        takeaway: 'HEAD is your "you are here" pointer. When attached to a branch, committing advances that branch.',
        plumbingCommand: 'git symbolic-ref HEAD',
        xrayNote: 'Notice the ref: prefix in .git/HEAD. It points to a branch name, not a commit hash.'
      },
      {
        label: '2. git checkout 4f901ab (detach HEAD)',
        command: 'git checkout 4f901ab',
        output: [
          'Note: switching to \'4f901ab\'.',
          '',
          'You are in \'detached HEAD\' state. You can look around, make experimental',
          'changes and commit them, and you can discard any commits you make in this',
          'state without impacting any branches by switching back to a branch.',
          '',
          '$ cat .git/HEAD',
          '4f901ab3c91820ba19028bc01928bc01928bc01a',
          '',
          '# LOOK AT .git/HEAD NOW: The "ref:" prefix is gone!',
          '# HEAD now points directly to commit 4f901ab.'
        ],
        files: [
          { path: '.git/HEAD', name: 'HEAD -> 4f901ab [DETACHED!]', depth: 1, highlight: true },
          { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> b14c80e', depth: 1 },
          { path: '.git/refs/heads/main', name: 'main -> 4f901ab', depth: 1 }
        ],
        shelf: [
          { label: 'HEAD State', value: 'DETACHED HEAD', detail: 'Direct commit hash', badge: 'warning' },
          { label: 'HEAD Points To', value: '4f901ab (C1)', detail: 'No intermediate branch', badge: 'warning' },
          { label: 'feature/cache', value: 'b14c80e (C2)', detail: 'Unaffected', badge: 'neutral' },
          { label: 'Risk Level', value: 'Commits are unbranched', detail: 'Can be orphaned if switched', badge: 'warning' }
        ],
        inspectorState: 'Detached HEAD State',
        inspectorDetail: 'The branch disappeared from between HEAD and the commit. .git/HEAD now contains a raw 40-character commit hash instead of a branch reference.',
        inspectorOperation: 'git checkout 4f901ab',
        internalChange: '.git/HEAD rewritten with raw commit SHA 4f901ab... Working tree updated to C1 snapshot.',
        takeaway: 'Detached HEAD is not a broken state. It simply means HEAD is pointing directly to a commit hash rather than a named branch.',
        plumbingCommand: 'git rev-parse HEAD',
        xrayNote: 'The branch ref was bypassed. HEAD is anchored directly to commit 4f901ab.'
      },
      {
        label: '3. commit in detached HEAD',
        command: 'git commit -m "Experimental cache probe"',
        output: [
          '[detached HEAD c5019a2] Experimental cache probe',
          ' 1 file changed, 4 insertions(+)',
          '',
          '# WHAT HAPPENED:',
          '# Commit c5019a2 was created with parent 4f901ab (C1).',
          '# HEAD moved forward to c5019a2.',
          '# BUT NO BRANCH POINTS TO c5019a2!',
          '# If you switch to main right now, c5019a2 will be left behind without a name.'
        ],
        files: [
          { path: '.git/objects/c5', name: 'objects/c5/019a2... [unbranched commit]', depth: 1, highlight: true },
          { path: '.git/HEAD', name: 'HEAD -> c5019a2 [DETACHED]', depth: 1, highlight: true },
          { path: '.git/refs/heads/main', name: 'main -> 4f901ab', depth: 1 }
        ],
        shelf: [
          { label: 'New Commit', value: 'c5019a2', detail: 'Minted successfully', badge: 'success' },
          { label: 'HEAD Ref', value: 'c5019a2 (detached)', detail: 'Moved to new commit', badge: 'warning' },
          { label: 'Branch Pointer', value: 'NONE', detail: 'No branch ref points here', badge: 'warning' },
          { label: 'Orphan Status', value: 'Unreachable on switch', detail: 'Must attach branch to keep', badge: 'warning' }
        ],
        inspectorState: 'Unbranched Commit Created',
        inspectorDetail: 'A valid commit object c5019a2 was created, and HEAD moved to it. However, because no branch ref was updated, this commit is vulnerable to becoming unreachable.',
        inspectorOperation: 'git commit -m "Experimental cache probe"',
        internalChange: 'New commit c5019a2 written. HEAD updated to c5019a2.',
        takeaway: 'You can make commits in detached HEAD, but because no branch holds them, you must attach a branch before switching away.',
        plumbingCommand: 'git branch --contains HEAD',
        xrayNote: 'Notice that neither main nor feature/cache moved. Only HEAD advanced.'
      },
      {
        label: '4. rescue with git switch -c',
        command: 'git switch -c fix/cache-probe',
        output: [
          'Switched to a new branch \'fix/cache-probe\'',
          '',
          '# RESCUED! What Git did:',
          '# 1. Created .git/refs/heads/fix/cache-probe -> c5019a2',
          '# 2. Re-attached HEAD: ref: refs/heads/fix/cache-probe',
          '# The commit is now safe and permanently anchored by a branch ref.'
        ],
        files: [
          { path: '.git/refs/heads/fix/cache-probe', name: 'fix/cache-probe -> c5019a2 [ATTACHED]', depth: 1, highlight: true },
          { path: '.git/HEAD', name: 'HEAD -> ref: refs/heads/fix/cache-probe', depth: 1, highlight: true }
        ],
        shelf: [
          { label: 'Rescued Branch', value: 'fix/cache-probe', detail: 'Anchors c5019a2', badge: 'success' },
          { label: 'HEAD Status', value: 'Symbolic Ref Re-attached', detail: 'Points to fix/cache-probe', badge: 'success' },
          { label: 'Commit Safety', value: '100% Reachable', detail: 'Protected from garbage collection', badge: 'success' },
          { label: 'Repository Health', value: 'Clean', detail: 'No orphaned tip', badge: 'neutral' }
        ],
        inspectorState: 'Branch Attached to Detached Tip',
        inspectorDetail: 'git switch -c created the branch ref fix/cache-probe at the current commit c5019a2 and reattached HEAD as a symbolic reference.',
        inspectorOperation: 'git switch -c fix/cache-probe',
        internalChange: '.git/refs/heads/fix/cache-probe created. HEAD updated to ref: refs/heads/fix/cache-probe.',
        takeaway: 'Attaching a branch to a detached commit is just writing a 41-byte text file with the commit hash.',
        plumbingCommand: 'git symbolic-ref HEAD',
        xrayNote: 'HEAD is back in attached mode (ref: prefix restored). The commit is safe.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 6: CHECKOUT / SWITCH REBUILDING THE WORKSPACE
  // =========================================================================
  {
    id: 'checkout-switch-workspace',
    level: 6,
    title: 'Level 6: Checkout / Switch Rebuilding the Workspace',
    label: '06. Workspace Materialization',
    group: 'Navigation & References',
    path: 'app/',
    branch: 'main',
    question: 'How does Git magically change the files in your directory when you switch branches?',
    whatLearnerThinks: '“Git magically swaps files in place.”',
    whatWeReveal: 'Three-step materialization: 1. HEAD updates -> 2. Index populated from target commit tree -> 3. Working tree files overwritten from index.',
    takeaway: 'Switching branches is a 3-step physical rebuild: 1) HEAD points to the new branch. 2) The index is updated to match the target commit root tree. 3) The operating system working tree files are rewritten, created, or deleted to match the index.',
    caveat: 'If you have uncommitted changes in your working tree that conflict with files being materialized from the target branch, Git aborts the switch to prevent data loss.',
    inspector: 'Watch the 3-step pipeline execute as Git switches between main and feature/cache.',
    sources: [
      'https://git-scm.com/docs/git-switch',
      'https://git-scm.com/docs/git-checkout',
      'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging'
    ],
    steps: [
      {
        label: '1. inspect main branch state',
        command: 'git switch main && ls -la app/',
        output: [
          'Switched to branch \'main\'',
          'total 4',
          '-rw-r--r-- 1 dev dev 94 Sep 19 14:20 deployment.yaml',
          '',
          '$ grep replicas app/deployment.yaml',
          '    replicas: 2',
          '# Notice: On main, deployment.yaml has replicas: 2, and redis.yaml does NOT exist.'
        ],
        files: [
          { path: 'app', name: 'app/', isDir: true, depth: 0 },
          { path: 'app/deployment.yaml', name: 'deployment.yaml (replicas: 2)', depth: 1 },
          { path: 'README.md', name: 'README.md', depth: 0 }
        ],
        shelf: [
          { label: 'Active Ref', value: 'main', detail: 'refs/heads/main', badge: 'neutral' },
          { label: 'deployment.yaml', value: 'replicas: 2', detail: 'Baseline configuration', badge: 'neutral' },
          { label: 'redis.yaml', value: 'Does not exist', detail: 'Not present on main', badge: 'neutral' },
          { label: 'Index State', value: 'Matches main tree', detail: 'Clean staging ledger', badge: 'neutral' }
        ],
        inspectorState: 'Workspace at main Branch',
        inspectorDetail: 'Currently on main. The working tree reflects the root tree of commit C1 (4f901ab).',
        inspectorOperation: 'git switch main',
        internalChange: 'Working tree matches main tree.',
        takeaway: 'Your working tree is the physical manifestation of whatever commit HEAD points to.',
        plumbingCommand: 'git ls-tree HEAD app/',
        xrayNote: 'Only deployment.yaml exists in app/. Target branch has additional files.'
      },
      {
        label: '2. git switch feature/cache (3-step rebuild)',
        command: 'git switch feature/cache',
        output: [
          'Switched to branch \'feature/cache\'',
          '',
          '# X-RAY REVEAL: The 3-Step Workspace Rebuild Pipeline:',
          '# Step 1: HEAD updated -> ref: refs/heads/feature/cache',
          '# Step 2: Index wiped and rebuilt from target commit tree b14c80e',
          '# Step 3: Working tree updated on disk:',
          '#         - app/deployment.yaml overwritten (replicas 2 -> 3)',
          '#         - app/redis.yaml materialized on disk (+created)'
        ],
        files: [
          { path: 'app', name: 'app/', isDir: true, depth: 0 },
          { path: 'app/deployment.yaml', name: 'deployment.yaml (replicas: 3)', depth: 1, highlight: true },
          { path: 'app/redis.yaml', name: 'redis.yaml (materialized on disk)', depth: 1, highlight: true },
          { path: 'README.md', name: 'README.md', depth: 0 }
        ],
        shelf: [
          { label: 'Step 1: HEAD', value: 'feature/cache', detail: 'Symbolic pointer moved', badge: 'changed' },
          { label: 'Step 2: Index', value: 'Rebuilt from Tree', detail: 'Loaded b14c80e entries', badge: 'changed' },
          { label: 'Step 3: Disk', value: 'Files Materialized', detail: 'redis.yaml written to OS', badge: 'success' },
          { label: 'deployment.yaml', value: 'Updated to replicas: 3', detail: 'Overwritten from blob', badge: 'changed' }
        ],
        inspectorState: 'Three-Step Workspace Materialization',
        inspectorDetail: 'Git updated HEAD, rebuilt the index from the target commit tree, and materialized files onto disk. Files appeared and changed in the filesystem explorer.',
        inspectorOperation: 'git switch feature/cache',
        internalChange: 'Working tree files updated on OS filesystem from target commit tree blobs.',
        takeaway: 'Git does not "swap folders". It uses the target commit tree to update the index, then writes the files to your OS filesystem.',
        plumbingCommand: 'git read-tree -u -m HEAD feature/cache',
        xrayNote: 'Watch the left explorer: redis.yaml physically appeared, and deployment.yaml changed.'
      },
      {
        label: '3. switch back to main (dematerialization)',
        command: 'git switch main && ls app/',
        output: [
          'Switched to branch \'main\'',
          'deployment.yaml',
          '',
          '# NOTICE WHAT HAPPENED TO redis.yaml:',
          '# Because redis.yaml does not exist in main\'s tree, Git physically unlinked (deleted)',
          '# redis.yaml from your OS disk. It is safely preserved in feature/cache\'s tree.'
        ],
        files: [
          { path: 'app', name: 'app/', isDir: true, depth: 0 },
          { path: 'app/deployment.yaml', name: 'deployment.yaml (replicas: 2)', depth: 1, highlight: true },
          { path: 'README.md', name: 'README.md', depth: 0 }
        ],
        shelf: [
          { label: 'Active Ref', value: 'main', detail: 'Returned to stable branch', badge: 'neutral' },
          { label: 'redis.yaml', value: 'Deleted from Disk', detail: 'Safely preserved in feature tree', badge: 'warning' },
          { label: 'deployment.yaml', value: 'Reverted to replicas: 2', detail: 'Overwritten from C1 blob', badge: 'neutral' },
          { label: 'Safety Guarantee', value: 'Zero Data Loss', detail: 'All states safe in object DB', badge: 'success' }
        ],
        inspectorState: 'Working Tree Restored to Baseline',
        inspectorDetail: 'Switching back to main removed redis.yaml from the working tree and restored deployment.yaml to replicas: 2.',
        inspectorOperation: 'git switch main',
        internalChange: 'redis.yaml unlinked from filesystem. deployment.yaml rewritten.',
        takeaway: 'Git creates and deletes files on disk during checkout based on tree differences between commits.',
        plumbingCommand: 'git diff-tree --name-status main feature/cache',
        xrayNote: 'redis.yaml disappeared from filesystem. It lives safely inside feature/cache.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 7: MERGE VS REBASE — GRAPH SURGERY
  // =========================================================================
  {
    id: 'merge-rebase-graph-surgery',
    level: 7,
    title: 'Level 7: Merge vs. Rebase — Graph Surgery',
    label: '07. Merge vs. Rebase',
    group: 'Branch Surgery & Recovery',
    path: '.git/refs/heads/',
    branch: 'main',
    question: 'What is the structural difference between merging and rebasing, and why does rebase rewrite history?',
    whatLearnerThinks: '“Merge and rebase are just two ways to combine code.”',
    whatWeReveal: 'A merge commit has two parents. Rebase replays commits onto a new parent, creating brand-new commit hashes.',
    takeaway: 'Merging preserves authentic history by creating a new merge commit with two parents (parent 1 = current branch, parent 2 = incoming branch). Rebasing replays commits one-by-one onto a new base. Because each commit incorporates its parent hash into its own checksum, rebasing creates brand-new commit hashes (C3 -> C3\').',
    caveat: 'Never rebase commits that have already been pushed to a shared public branch. Rewriting shared commit hashes forces collaborators into divergent histories.',
    inspector: 'Inspect the two parent pointers of a merge commit vs the brand-new hashes generated by rebase.',
    sources: [
      'https://git-scm.com/docs/git-merge',
      'https://git-scm.com/docs/git-rebase',
      'https://git-scm.com/book/en/v2/Git-Branching-Rebasing'
    ],
    steps: [
      {
        label: '1. inspect diverged branches',
        command: 'git log --graph --oneline --all',
        output: [
          '* b14c80e (feature/cache) Add Redis cache configuration',
          '| * e78b21a (HEAD -> main) Add IAM production roles',
          '|/  ',
          '* c3904e1 Initial infrastructure baseline',
          '# main and feature/cache diverged at common ancestor C0 (c3904e1).'
        ],
        files: [
          { path: '.git/refs/heads/main', name: 'main -> e78b21a (C2)', depth: 1 },
          { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> b14c80e (C3)', depth: 1 },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0 }
        ],
        shelf: [
          { label: 'Common Ancestor', value: 'C0 (c3904e1)', detail: 'Merge base commit', badge: 'neutral' },
          { label: 'main Tip', value: 'C2 (e78b21a)', detail: 'HEAD position', badge: 'neutral' },
          { label: 'feature/cache Tip', value: 'C3 (b14c80e)', detail: 'Incoming branch tip', badge: 'neutral' },
          { label: 'Topology', value: 'Diverged (Y-shaped)', detail: 'Requires 3-way reconciliation', badge: 'warning' }
        ],
        inspectorState: 'Diverged History Topology',
        inspectorDetail: 'Both branches have commits that the other lacks. To combine them, Git must perform a 3-way merge using common ancestor C0.',
        inspectorOperation: 'git log --graph --all',
        internalChange: 'Reading commit DAG traversal.',
        takeaway: 'When branches diverge, Git finds their best common ancestor (merge-base) to reconcile changes.',
        plumbingCommand: 'git merge-base main feature/cache',
        xrayNote: 'Common ancestor is c3904e1. Two paths lead forward.'
      },
      {
        label: '2. git merge (two-parent commit M1)',
        command: 'git merge feature/cache -m "Merge branch feature/cache"',
        output: [
          'Merge made by the \'ort\' strategy.',
          ' app/redis.yaml | 8 ++++++++',
          ' 1 file changed, 8 insertions(+)',
          '',
          '$ git cat-file -p HEAD',
          'tree 9d201ab881901ef3381a90c1018901ef2b8901aa',
          'parent e78b21a049182bc018901ef3381a90c1018901ef  (main: C2)',
          'parent b14c80e712ad8901ef2b8901aa9901ef3381a90c  (feature/cache: C3)',
          'author Dev <dev@lab> 1774011832 +0000',
          'committer Dev <dev@lab> 1774011832 +0000',
          '',
          '# LOOK AT THE PARENTS: TWO PARENT LINES!',
          '# A merge commit is special solely because it has multiple parents.'
        ],
        files: [
          { path: '.git/objects/9d', name: 'objects/9d/201ab... [merge commit M1]', depth: 1, highlight: true },
          { path: '.git/refs/heads/main', name: 'main -> 9d201ab (M1)', depth: 1, highlight: true },
          { path: 'app/redis.yaml', name: 'redis.yaml (merged)', depth: 0 }
        ],
        shelf: [
          { label: 'Merge Commit', value: 'M1 (9d201ab)', detail: 'Newly minted commit', badge: 'success' },
          { label: 'Parent 1', value: 'C2 (main)', detail: 'First parent (target branch)', badge: 'neutral' },
          { label: 'Parent 2', value: 'C3 (feature)', detail: 'Second parent (merged branch)', badge: 'neutral' },
          { label: 'History Integrity', value: 'Authentic Lineage', detail: 'Preserves exact branch shapes', badge: 'success' }
        ],
        inspectorState: 'Two-Parent Merge Commit Created',
        inspectorDetail: 'git merge created commit M1 with two parent pointers: parent 1 points to C2 (main) and parent 2 points to C3 (feature/cache). The authentic history of both branches is preserved.',
        inspectorOperation: 'git merge feature/cache',
        internalChange: 'New commit with 2 parent headers written. refs/heads/main updated to M1.',
        takeaway: 'A merge commit is special because it has two parents. It ties together two independent histories without modifying either branch.',
        plumbingCommand: 'git rev-parse HEAD^1 HEAD^2',
        xrayNote: 'Notice the two parent lines in the commit object. That is the entire definition of a merge commit.'
      },
      {
        label: '3. git rebase (history rewritten: C3 -> C3\')',
        command: 'git reset --hard HEAD~1 && git switch feature/cache && git rebase main',
        output: [
          'Successfully rebased and updated refs/heads/feature/cache.',
          '',
          '$ git log --oneline --graph',
          '* 7e4019a (HEAD -> feature/cache) Add Redis cache configuration  [C3\']',
          '* e78b21a (main) Add IAM production roles                        [C2]',
          '* c3904e1 Initial infrastructure baseline                        [C0]',
          '',
          '# WHY DID THE COMMIT HASH CHANGE FROM b14c80e TO 7e4019a?',
          '# Old C3 parent was C0 (c3904e1).',
          '# New C3\' parent is C2 (e78b21a).',
          '# Different parent -> different commit text -> completely new SHA-1 hash!'
        ],
        files: [
          { path: '.git/objects/7e', name: 'objects/7e/4019a... [new commit C3\']', depth: 1, highlight: true },
          { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> 7e4019a [REWRITTEN]', depth: 1, highlight: true },
          { path: '.git/refs/heads/main', name: 'main -> e78b21a [C2]', depth: 1 }
        ],
        shelf: [
          { label: 'Old Commit C3', value: 'b14c80e (Orphaned)', detail: 'Parent was C0', badge: 'warning' },
          { label: 'New Commit C3\'', value: '7e4019a (Active)', detail: 'Parent is C2', badge: 'changed' },
          { label: 'Graph Topology', value: 'Strictly Linear', detail: 'Zero merge commits', badge: 'success' },
          { label: 'History Rewrite', value: 'Permanent SHA Change', detail: 'C3 != C3\'', badge: 'warning' }
        ],
        inspectorState: 'Rebase: Commit Replayed with New Hash',
        inspectorDetail: 'Rebase took the changes from C3 and replayed them onto C2. Because C3\' has a different parent, its SHA-1 hash is completely different (7e4019a instead of b14c80e).',
        inspectorOperation: 'git rebase main',
        internalChange: 'New commit C3\' minted with parent C2. feature/cache ref moved to C3\'. Old C3 abandoned.',
        takeaway: 'Rebase rewrites history because a commit hash incorporates its parent hash. Changing a commit\'s base changes its identity forever.',
        plumbingCommand: 'git cat-file -p 7e4019a | grep parent',
        xrayNote: 'The old commit b14c80e still exists in .git/objects, but nothing references it anymore.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 8: RESET, RESTORE, AND REVERT — THE THREE-STATE MACHINE
  // =========================================================================
  {
    id: 'reset-restore-revert',
    level: 8,
    title: 'Level 8: Reset, Restore, and Revert — The Three-State Machine',
    label: '08. The 3-State Machine',
    group: 'Branch Surgery & Recovery',
    path: 'app/deployment.yaml',
    branch: 'main',
    question: 'What do --soft, --mixed, and --hard actually do, and how do you undo changes safely?',
    whatLearnerThinks: '“git reset is terrifying and destroys work unpredictably.”',
    whatWeReveal: 'The 3-layer state machine: Ref/HEAD, Index, and Working Tree. Each reset flag simply decides how many layers to move.',
    takeaway: 'Git reset is not chaotic; it is a precision 3-layer elevator: --soft moves only the branch ref (keeps index and working tree). --mixed moves the branch ref and resets the index (keeps working tree). --hard moves the branch ref, resets the index, and overwrites the working tree.',
    caveat: 'git reset --hard discards uncommitted working tree changes permanently. Those uncommitted modifications never became blobs in .git/objects, so Git cannot recover them.',
    inspector: 'Watch the 3 layers (Branch Ref, Index, Working Tree) update across --soft, --mixed, and --hard.',
    sources: [
      'https://git-scm.com/docs/git-reset',
      'https://git-scm.com/docs/git-restore',
      'https://git-scm.com/docs/git-revert'
    ],
    steps: [
      {
        label: '1. baseline: clean state at commit C2',
        command: 'git status && git log -1 --oneline',
        output: [
          '$ git status',
          'On branch main',
          'nothing to commit, working tree clean',
          '$ git log -1 --oneline',
          'e78b21a (HEAD -> main) Add IAM production roles',
          '# All three layers (HEAD ref, index, working tree) are perfectly in sync.'
        ],
        files: [
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0 },
          { path: 'README.md', name: 'README.md', depth: 0 }
        ],
        shelf: [
          { label: 'Layer 1: REF / HEAD', value: 'e78b21a (C2)', detail: 'Points to commit C2', badge: 'neutral' },
          { label: 'Layer 2: INDEX', value: 'Matches C2', detail: 'Staging ledger clean', badge: 'neutral' },
          { label: 'Layer 3: WORKTREE', value: 'Clean on Disk', detail: 'Files match index', badge: 'neutral' },
          { label: 'System State', value: 'Synchronized', detail: 'All 3 layers identical', badge: 'success' }
        ],
        inspectorState: 'Three Layers in Synchrony',
        inspectorDetail: 'All three layers (Branch Ref, Index, Working Tree) contain identical trees. Any reset command will move one or more of these layers backward.',
        inspectorOperation: 'git status',
        internalChange: 'Clean state. No pending mutations.',
        takeaway: 'Every undo operation in Git is simply a decision about which of the three layers (Ref, Index, Working Tree) to move.',
        plumbingCommand: 'git diff HEAD',
        xrayNote: 'Layer 1 (Ref), Layer 2 (Index), Layer 3 (Worktree) are all at commit C2.'
      },
      {
        label: '2. git reset --soft HEAD~1 (move REF only)',
        command: 'git reset --soft HEAD~1 && git status -s',
        output: [
          '$ git reset --soft HEAD~1',
          '$ git status -s',
          'M  app/deployment.yaml',
          '',
          '# WHAT --soft DID:',
          '# Layer 1 (REF / HEAD): MOVED backward to C1 (c3904e1)',
          '# Layer 2 (INDEX):      KEPT unchanged (still has C2 changes staged!)',
          '# Layer 3 (WORKTREE):   KEPT unchanged (files on disk intact)'
        ],
        files: [
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0, status: 'A', highlight: true },
          { path: '.git/refs/heads/main', name: 'main -> c3904e1 [REWOUND]', depth: 1, highlight: true }
        ],
        shelf: [
          { label: 'Layer 1: REF / HEAD', value: 'c3904e1 (C1)', detail: 'MOVED backward', badge: 'changed' },
          { label: 'Layer 2: INDEX', value: 'STILL STAGED', detail: 'KEPT (C2 changes ready)', badge: 'success' },
          { label: 'Layer 3: WORKTREE', value: 'INTACT', detail: 'KEPT on disk', badge: 'neutral' },
          { label: 'Result', value: 'Changes ready to commit', detail: 'Perfect for amending', badge: 'success' }
        ],
        inspectorState: 'Reset --soft: Move Ref Only',
        inspectorDetail: 'git reset --soft moved refs/heads/main back to C1, but left the index and working tree untouched. The changes from C2 are still staged, ready to commit immediately.',
        inspectorOperation: 'git reset --soft HEAD~1',
        internalChange: 'refs/heads/main updated to c3904e1. Index and working tree unchanged.',
        takeaway: 'reset --soft moves only the branch reference. Use it when you want to re-do a commit message or squash commits.',
        plumbingCommand: 'git update-ref refs/heads/main HEAD~1',
        xrayNote: 'Ref moved backward. Index and working tree remained at C2.'
      },
      {
        label: '3. git reset --mixed HEAD (move REF + reset INDEX)',
        command: 'git reset --mixed HEAD && git status -s',
        output: [
          '$ git reset --mixed HEAD',
          'Unstaged changes after reset:',
          'M	app/deployment.yaml',
          '',
          '$ git status -s',
          ' M app/deployment.yaml',
          '',
          '# WHAT --mixed (default) DID:',
          '# Layer 1 (REF / HEAD): MOVED backward to C1',
          '# Layer 2 (INDEX):      RESET to match C1 (changes are now UNSTAGED)',
          '# Layer 3 (WORKTREE):   KEPT unchanged (your code is still on disk!)'
        ],
        files: [
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0, status: 'M', highlight: true },
          { path: '.git/index', name: 'index [RESET to C1]', depth: 1, highlight: true }
        ],
        shelf: [
          { label: 'Layer 1: REF / HEAD', value: 'c3904e1 (C1)', detail: 'At ancestor commit', badge: 'neutral' },
          { label: 'Layer 2: INDEX', value: 'RESET to C1', detail: 'Changes now unstaged', badge: 'changed' },
          { label: 'Layer 3: WORKTREE', value: 'INTACT on Disk', detail: 'Changes preserved locally', badge: 'neutral' },
          { label: 'Status Badge', value: ' M (unstaged)', detail: 'Working tree modification', badge: 'warning' }
        ],
        inspectorState: 'Reset --mixed: Move Ref + Reset Index',
        inspectorDetail: 'git reset --mixed (the default) moved the branch and reset the index to match C1. Your work is still completely safe in your working tree, but it is now unstaged.',
        inspectorOperation: 'git reset --mixed HEAD',
        internalChange: 'Index binary records overwritten with tree of C1. Working tree files untouched.',
        takeaway: 'reset --mixed un-stages changes while keeping your code safe on disk. This is the default behavior of git reset.',
        plumbingCommand: 'git read-tree HEAD',
        xrayNote: 'The index was cleared back to C1. Your code is still safe in your working directory.'
      },
      {
        label: '4. git reset --hard (move REF + INDEX + WORKTREE)',
        command: 'git reset --hard HEAD && git status -s',
        output: [
          '$ git reset --hard HEAD',
          'HEAD is now at c3904e1 Initial infrastructure baseline',
          '$ git status -s',
          '# Output is empty! Working tree is completely clean.',
          '',
          '# WHAT --hard DID:',
          '# Layer 1 (REF / HEAD): AT C1',
          '# Layer 2 (INDEX):      RESET to C1',
          '# Layer 3 (WORKTREE):   OVERWRITTEN to match C1 (uncommitted edits discarded!)'
        ],
        files: [
          { path: 'app/deployment.yaml', name: 'deployment.yaml (restored to C1)', depth: 0, highlight: true },
          { path: 'README.md', name: 'README.md', depth: 0 }
        ],
        shelf: [
          { label: 'Layer 1: REF / HEAD', value: 'c3904e1 (C1)', detail: 'Rewound to C1', badge: 'neutral' },
          { label: 'Layer 2: INDEX', value: 'C1 Snapshot', detail: 'Staging clean', badge: 'neutral' },
          { label: 'Layer 3: WORKTREE', value: 'Overwritten to C1', detail: 'Uncommitted edits lost', badge: 'warning' },
          { label: 'Clean Status', value: '100% Synchronized', detail: 'Matches C1 baseline', badge: 'success' }
        ],
        inspectorState: 'Reset --hard: All Three Layers Overwritten',
        inspectorDetail: 'git reset --hard rewrote all three layers to match C1. Uncommitted working tree changes were permanently discarded because they never became objects in .git.',
        inspectorOperation: 'git reset --hard HEAD',
        internalChange: 'Working tree files overwritten from C1 tree. Index reset. Ref at C1.',
        takeaway: 'reset --hard overwrites everything. Use with caution: uncommitted working tree edits cannot be recovered.',
        plumbingCommand: 'git read-tree -u --reset HEAD',
        xrayNote: 'All 3 layers were forcibly synchronized to C1. Working tree modifications were wiped.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 9: MERGE CONFLICTS & THE THREE-STAGE INDEX
  // =========================================================================
  {
    id: 'conflicts-three-stage-index',
    level: 9,
    title: 'Level 9: Merge Conflicts & The Three-Stage Index',
    label: '09. Conflict Three-Stage Index',
    group: 'Branch Surgery & Recovery',
    path: 'app/deployment.yaml',
    branch: 'main',
    question: 'What is really happening inside Git when a merge conflict occurs?',
    whatLearnerThinks: '“A merge conflict is just text markers inside my editor.”',
    whatWeReveal: 'Git writes three separate entries into the index: Stage 1 BASE, Stage 2 OURS, Stage 3 THEIRS.',
    takeaway: 'When Git cannot auto-resolve a 3-way merge, it stores all three competing versions in the index: Stage 1 = common ancestor (BASE), Stage 2 = target branch (OURS / HEAD), Stage 3 = incoming branch (THEIRS). Running git add on the resolved file collapses stages 1, 2, and 3 into normal Stage 0.',
    caveat: 'The conflict markers in your file (<<<<<<<, =======, >>>>>>>) are generated by Git combining Stage 2 and Stage 3 against Stage 1. Running git add declares the conflict resolved.',
    inspector: 'Inspect the 3-stage index table using git ls-files -u and see how Git tracks conflicting blobs.',
    sources: [
      'https://git-scm.com/docs/git-merge',
      'https://git-scm.com/docs/git-ls-files#_stage_numbers',
      'https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging'
    ],
    steps: [
      {
        label: '1. trigger merge conflict',
        command: 'git merge feature/routes',
        output: [
          'Auto-merging app/deployment.yaml',
          'CONFLICT (content): Merge conflict in app/deployment.yaml',
          'Automatic merge failed; fix conflicts and then commit the result.',
          '',
          '$ git status -s',
          'UU app/deployment.yaml',
          '# UU = Unmerged, both modified!'
        ],
        files: [
          { path: 'app/deployment.yaml', name: 'deployment.yaml [CONFLICT]', depth: 0, status: 'UU', highlight: true },
          { path: '.git/index', name: 'index (holds 3 conflicting stages!)', depth: 1, highlight: true }
        ],
        shelf: [
          { label: 'Conflict Status', value: 'UU (Unresolved)', detail: 'Both branches modified file', badge: 'warning' },
          { label: 'Stage 1 (BASE)', value: 'blob 8a3f912', detail: 'Common ancestor version', badge: 'neutral' },
          { label: 'Stage 2 (OURS)', value: 'blob 7ab38f9', detail: 'main branch version (HEAD)', badge: 'changed' },
          { label: 'Stage 3 (THEIRS)', value: 'blob c14901e', detail: 'feature branch version', badge: 'changed' }
        ],
        inspectorState: 'Merge Conflict Triggered (Status UU)',
        inspectorDetail: 'Both branches modified app/deployment.yaml at the same lines since their common ancestor. Git halted the merge and flagged the file as UU in the index.',
        inspectorOperation: 'git merge feature/routes',
        internalChange: 'Index expanded: stage 0 entry replaced by stage 1, stage 2, and stage 3 entries.',
        takeaway: 'A merge conflict occurs when two branches make incompatible edits to the same lines relative to their common ancestor.',
        plumbingCommand: 'git ls-files -u',
        xrayNote: 'Turn on X-Ray mode: instead of one index row, the index now holds THREE stages!'
      },
      {
        label: '2. inspect the 3-stage index (ls-files -u)',
        command: 'git ls-files --stage app/deployment.yaml',
        output: [
          '$ git ls-files --stage app/deployment.yaml',
          '100644 8a3f912c9b4e19572d4f80164e29b1dc94f2910a 1   app/deployment.yaml  (BASE)',
          '100644 7ab38f912c9b4e19572d4f80164e29b1dc94f291 2   app/deployment.yaml  (OURS / HEAD)',
          '100644 c14901e018902bc01928bc01928bc01a01928bc0 3   app/deployment.yaml  (THEIRS / feature)',
          '',
          '# X-RAY REVEAL: The index stage numbers:',
          '# Stage 0: Normal clean file (no conflict)',
          '# Stage 1: Ancestor baseline (merge-base)',
          '# Stage 2: Target branch version (OURS - what you were on)',
          '# Stage 3: Incoming branch version (THEIRS - what you are merging)'
        ],
        files: [
          { path: '.git/index', name: 'index [Stage 1: BASE 8a3f912]', depth: 1 },
          { path: '.git/index', name: 'index [Stage 2: OURS 7ab38f9]', depth: 1, highlight: true },
          { path: '.git/index', name: 'index [Stage 3: THEIRS c14901e]', depth: 1, highlight: true },
          { path: 'app/deployment.yaml', name: 'deployment.yaml (has markers)', depth: 0, status: 'UU' }
        ],
        shelf: [
          { label: 'Stage 0', value: 'Empty', detail: 'No clean entry during conflict', badge: 'neutral' },
          { label: 'Stage 1: BASE', value: '8a3f912 (replicas: 2)', detail: 'Common ancestor', badge: 'neutral' },
          { label: 'Stage 2: OURS', value: '7ab38f9 (replicas: 3)', detail: 'main branch tip', badge: 'success' },
          { label: 'Stage 3: THEIRS', value: 'c14901e (replicas: 5)', detail: 'feature branch tip', badge: 'changed' }
        ],
        inspectorState: 'Three Distinct Blobs in the Index',
        inspectorDetail: 'git ls-files --stage proves that the index holds all three competing versions simultaneously. Git keeps all three blobs in .git/objects so merge tools can compare them.',
        inspectorOperation: 'git ls-files --stage app/deployment.yaml',
        internalChange: 'Reading 3-stage index entries.',
        takeaway: 'The index is not a dumb staging folder. During conflicts, it is a 3-way reconciliation ledger storing ancestor, local, and remote versions.',
        plumbingCommand: 'git cat-file -p :2:app/deployment.yaml',
        xrayNote: 'You can inspect each stage individually using git cat-file -p :1:file, :2:file, :3:file.'
      },
      {
        label: '3. resolve conflict & git add (collapse stages)',
        command: 'edit app/deployment.yaml && git add app/deployment.yaml',
        output: [
          '# Resolved conflict: decided on replicas: 4 with high-availability config.',
          '$ git add app/deployment.yaml',
          '',
          '$ git ls-files --stage app/deployment.yaml',
          '100644 d4019ab018902bc01928bc01928bc01a01928bc0 0   app/deployment.yaml',
          '',
          '# LOOK AT THE STAGE NUMBER: It is 0 again!',
          '# Running git add computed a new blob d4019ab, deleted stages 1, 2, and 3,',
          '# and wrote the unified resolved file as Stage 0.'
        ],
        files: [
          { path: '.git/index', name: 'index [Stage 0: d4019ab RESOLVED]', depth: 1, highlight: true },
          { path: 'app/deployment.yaml', name: 'deployment.yaml', depth: 0, status: 'A', highlight: true }
        ],
        shelf: [
          { label: 'Resolved Blob', value: 'd4019ab (replicas: 4)', detail: 'Merged result written', badge: 'success' },
          { label: 'Index Stages', value: 'Collapsed to Stage 0', detail: 'Stages 1, 2, 3 removed', badge: 'success' },
          { label: 'File Status', value: 'A (Resolved & Staged)', detail: 'Ready for merge commit', badge: 'success' },
          { label: 'Conflict State', value: 'RESOLVED', detail: 'Zero unmerged paths remain', badge: 'success' }
        ],
        inspectorState: 'Stages Collapsed to Stage 0',
        inspectorDetail: 'Running git add on the resolved file hashed the final content, wrote blob d4019ab, cleared stages 1, 2, 3, and registered the clean stage 0 entry in the index.',
        inspectorOperation: 'git add app/deployment.yaml',
        internalChange: 'Stages 1, 2, 3 removed from index. Stage 0 entry written. Blob d4019ab stored.',
        takeaway: 'git add resolves merge conflicts by removing stages 1, 2, and 3 from the index and replacing them with a clean stage 0 entry.',
        plumbingCommand: 'git commit -m "Merge and resolve deployment replicas"',
        xrayNote: 'The 3 conflicting stages vanished. Stage 0 is restored.'
      }
    ]
  },

  // =========================================================================
  // LEVEL 10: WORKTREES, REFLOG RECOVERY & PLUMBING
  // =========================================================================
  {
    id: 'worktrees-and-plumbing',
    level: 10,
    title: 'Level 10: Worktrees, Reflog Recovery & Plumbing',
    label: '10. Worktrees & Plumbing',
    group: 'Worktrees & Plumbing',
    path: '.git/',
    branch: 'main',
    question: 'How do worktrees share objects, how does Reflog rescue lost commits, and how does plumbing build porcelain?',
    whatLearnerThinks: '“Git magic / If I reset --hard a commit it is deleted forever.”',
    whatWeReveal: 'Common .git directory shared across worktrees. Reflog rescues unreferenced commits. Plumbing commands assemble commits from scratch.',
    takeaway: 'You now understand all of Git: 1) Worktrees share .git/objects and refs while keeping independent working trees, HEADs, and indexes. 2) Commits abandoned by git reset --hard are not deleted; they are preserved in the reflog and can be rescued instantly. 3) git add and git commit are just porcelain wrappers around hash-object, update-index, write-tree, commit-tree, and update-ref.',
    caveat: 'Reflog entries expire after 90 days (or 30 days for unreferenced commits). Once reflog entries expire and git gc runs, unreachable objects are permanently purged.',
    inspector: 'Explore the flagship architecture: shared worktrees, the reflog safety net, and the raw plumbing pipeline.',
    sources: [
      'https://git-scm.com/docs/git-worktree',
      'https://git-scm.com/docs/git-reflog',
      'https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain'
    ],
    steps: [
      {
        label: '1. git worktree (shared .git engine)',
        command: 'git worktree add ../wt-networking feature/networking',
        output: [
          'Preparing worktree (checking out \'feature/networking\')',
          'HEAD is now at 8a109fe Add VPC network routing',
          '',
          '# X-RAY REVEAL: Worktree Architecture:',
          '# SHARED:              .git/objects/ (immutable object database) & .git/refs/',
          '# PRIVATE PER-WORKTREE: private HEAD, private index, private working files',
          '# Result: Two branches checked out simultaneously with ZERO disk object duplication!'
        ],
        files: [
          { path: '.git/objects', name: '.git/objects/ [SHARED OBJECT DB]', depth: 1, highlight: true },
          { path: '.git/worktrees/wt-networking', name: '.git/worktrees/wt-networking/ [PRIVATE HEAD & INDEX]', depth: 1, highlight: true },
          { path: '/home/dev/repos/infra-platform', name: 'Main Worktree [branch: main]', depth: 0 },
          { path: '/home/dev/repos/wt-networking', name: 'Linked Worktree [branch: feature/networking]', depth: 0, highlight: true }
        ],
        shelf: [
          { label: 'Common Engine', value: '.git/objects/', detail: 'Zero object duplication', badge: 'success' },
          { label: 'Main Worktree', value: 'main', detail: 'Private HEAD & index', badge: 'neutral' },
          { label: 'Linked Worktree', value: 'feature/networking', detail: 'Private HEAD & index', badge: 'changed' },
          { label: 'Concurrent Branches', value: '2 Simultaneous', detail: 'Zero stash/switch friction', badge: 'success' }
        ],
        inspectorState: 'Multi-Worktree Shared Engine',
        inspectorDetail: 'git worktree created a new linked worktree. It shares .git/objects and .git/refs with the main repository, but maintains its own private HEAD and index.',
        inspectorOperation: 'git worktree add ../wt-networking feature/networking',
        internalChange: '.git/worktrees/wt-networking directory created with private HEAD and index files.',
        takeaway: 'Worktrees share the object database and refs while maintaining independent working trees and HEADs.',
        plumbingCommand: 'git worktree list',
        xrayNote: 'Both worktrees draw from the same .git/objects store without duplicating gigabytes of repo data.'
      },
      {
        label: '2. lose a commit with reset --hard',
        command: 'git reset --hard HEAD~1',
        output: [
          'HEAD is now at c3904e1 Initial infrastructure baseline',
          '',
          '# DRAMATIC MOMENT: We just deliberately "lost" commit 4f901ab!',
          '# main now points to c3904e1.',
          '# Commit 4f901ab is gone from git log.',
          '# IS IT GONE FROM DISK? NO! It still lives in .git/objects/4f/901ab...'
        ],
        files: [
          { path: '.git/refs/heads/main', name: 'main -> c3904e1 [REWOUND]', depth: 1 },
          { path: '.git/objects/4f', name: 'objects/4f/901ab... [ORPHANED, BUT ALIVE!]', depth: 1, highlight: true }
        ],
        shelf: [
          { label: 'Active HEAD', value: 'c3904e1', detail: 'Rewound by reset --hard', badge: 'warning' },
          { label: 'Lost Commit', value: '4f901ab', detail: 'Unreachable from branch graph', badge: 'warning' },
          { label: 'Physical Status', value: 'Still in .git/objects', detail: 'Object not deleted', badge: 'neutral' },
          { label: 'Safety Net', value: '.git/logs/HEAD (Reflog)', detail: 'Recorded previous position', badge: 'success' }
        ],
        inspectorState: 'Commit Orphaned by Reset',
        inspectorDetail: 'Commit 4f901ab is no longer reachable from any branch ref. However, it was not deleted from .git/objects. Git recorded the reset in .git/logs/HEAD (the Reflog).',
        inspectorOperation: 'git reset --hard HEAD~1',
        internalChange: 'refs/heads/main moved to c3904e1. Entry appended to .git/logs/HEAD.',
        takeaway: 'In Git, commits are rarely deleted immediately. When you reset, the commit stays in .git/objects and is logged in the reflog.',
        plumbingCommand: 'git fsck --unreachable',
        xrayNote: 'Commit 4f901ab has no ref pointing to it, but the reflog remembers it.'
      },
      {
        label: '3. reflog rescue: recover lost commit',
        command: 'git reflog -2 && git branch rescue HEAD@{1}',
        output: [
          '$ git reflog -2',
          'c3904e1 HEAD@{0}: reset: moving to HEAD~1',
          '4f901ab HEAD@{1}: commit: Scale application to 3 replicas',
          '',
          '$ git branch rescue HEAD@{1}',
          '',
          '# RESCUED!',
          '# We attached a new branch ref "rescue" to HEAD@{1} (4f901ab).',
          '# The commit is immediately 100% reachable and back in history!'
        ],
        files: [
          { path: '.git/refs/heads/rescue', name: 'refs/heads/rescue -> 4f901ab [RESCUED!]', depth: 1, highlight: true },
          { path: '.git/logs/HEAD', name: 'logs/HEAD [reflog journal]', depth: 1, highlight: true },
          { path: '.git/objects/4f', name: 'objects/4f/901ab... [RE-ATTACHED TO GRAPH]', depth: 1, highlight: true }
        ],
        shelf: [
          { label: 'Reflog Entry', value: 'HEAD@{1} (4f901ab)', detail: 'Previous HEAD position', badge: 'success' },
          { label: 'Rescue Branch', value: 'rescue -> 4f901ab', detail: 'Re-attached to commit', badge: 'success' },
          { label: 'Reachability', value: '100% Reachable', detail: 'Safe from garbage collection', badge: 'success' },
          { label: 'Data Recovery', value: 'Zero Data Lost', detail: 'Reflog safety net worked', badge: 'success' }
        ],
        inspectorState: 'Commit Rescued via Reflog',
        inspectorDetail: 'The reflog tracked the previous HEAD position before the reset. Creating branch rescue at HEAD@{1} restored the commit to active history.',
        inspectorOperation: 'git branch rescue HEAD@{1}',
        internalChange: '.git/refs/heads/rescue written with 4f901ab. Commit re-anchored.',
        takeaway: 'The reflog is Git\'s ultimate flight recorder. As long as a commit was recorded in HEAD, you can rescue it with git branch <name> HEAD@{n}.',
        plumbingCommand: 'git rev-parse HEAD@{1}',
        xrayNote: 'Commit 4f901ab is back in the active commit graph under branch rescue.'
      },
      {
        label: '4. plumbing challenge: commit without porcelain',
        command: 'TREE=$(git write-tree) && COMMIT=$(git commit-tree $TREE -m "Plumbing commit") && git update-ref refs/heads/main $COMMIT',
        output: [
          '# THE GRAND PLUMBING REVEAL:',
          '# We created a commit WITHOUT using "git add" or "git commit"!',
          '',
          'Step 1: git hash-object -w <file>           -> wrote blob to .git/objects/',
          'Step 2: git update-index --add --cacheinfo  -> updated binary index',
          'Step 3: TREE=$(git write-tree)              -> wrote root tree object',
          'Step 4: COMMIT=$(git commit-tree $TREE ...) -> minted commit envelope',
          'Step 5: git update-ref refs/heads/main ...  -> advanced branch pointer',
          '',
          '# You have now seen every physical gear underneath the porcelain commands.'
        ],
        files: [
          { path: '.git/objects', name: '.git/objects/ [blobs, trees, commits]', depth: 1, highlight: true },
          { path: '.git/index', name: '.git/index [staged cacheinfo]', depth: 1, highlight: true },
          { path: '.git/refs/heads/main', name: '.git/refs/heads/main [updated via update-ref]', depth: 1, highlight: true }
        ],
        shelf: [
          { label: 'Plumbing Level', value: 'Core Engine Exposed', detail: 'Zero porcelain commands', badge: 'success' },
          { label: 'Raw Primitives', value: 'hash-object, write-tree', detail: 'commit-tree, update-ref', badge: 'success' },
          { label: 'Porcelain Facade', value: 'git add & git commit', detail: 'Convenient wrappers', badge: 'neutral' },
          { label: 'Mental Model', value: 'Complete Mastery', detail: 'Transparent Git Engine', badge: 'success' }
        ],
        inspectorState: 'Complete Plumbing Pipeline Executed',
        inspectorDetail: 'Every porcelain command (git add, git commit, git branch) is a user-friendly wrapper over five plumbing primitives: hash-object, update-index, write-tree, commit-tree, and update-ref.',
        inspectorOperation: 'git write-tree && git commit-tree && git update-ref',
        internalChange: 'Tree written from index. Commit minted from tree. Branch ref advanced directly.',
        takeaway: 'Git is not magic. It is a content-addressed object store with a staging index and branch pointer files.',
        plumbingCommand: 'git cat-file -p HEAD',
        xrayNote: 'You have mastered the mechanics of Git from everyday commands to deep storage engine plumbing.'
      }
    ]
  }
];

export const gitGroups = [
  'Foundations: Inside .git',
  'Navigation & References',
  'Branch Surgery & Recovery',
  'Worktrees & Plumbing'
] as const;

export const gitRelated = [
  { href: '/github-actions-cheatsheet', label: 'GitHub Actions Cheatsheet' },
  { href: '/secopspipeline', label: 'DevSecOps Pipeline' },
  { href: '/containers', label: 'Containers Foundations' }
];

export function getStepInternals(lab: GitLab, stepIdx: number): GitInternalsState {
  const step = lab.steps[stepIdx] || lab.steps[0];
  if (step?.internals) return step.internals;

  switch (lab.id) {
    case 'where-is-git':
      if (stepIdx === 0) {
        return {
          head: 'None (Git not initialized)',
          branchRef: 'None',
          commitHash: 'None',
          commitMsg: 'No commits in working tree',
          treeHash: 'None',
          treeDetail: 'No git tree object',
          blobHash: 'None',
          blobDetail: 'Files are ordinary disk bytes'
        };
      }
      return {
        head: 'ref: refs/heads/main',
        branchRef: 'refs/heads/main (unborn)',
        commitHash: 'None (empty repository)',
        commitMsg: 'Waiting for initial commit',
        treeHash: 'None',
        treeDetail: 'Index awaiting git add',
        blobHash: 'None',
        blobDetail: '0 loose objects in .git/objects/'
      };

    case 'what-git-add-does':
      if (stepIdx === 0) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1',
          commitMsg: 'Initial infrastructure setup',
          treeHash: 'e189ac2',
          treeDetail: 'Previous committed tree',
          blobHash: '94b810a',
          blobDetail: 'deployment.yaml (replicas: 2)'
        };
      }
      if (stepIdx === 3) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1',
          commitMsg: 'HEAD matches baseline commit',
          treeHash: 'Staged index differs from HEAD',
          treeDetail: 'MM state: 3 distinct representations',
          blobHash: '7ab38f4 (staged: 3)',
          blobDetail: 'Disk has unstaged replicas: 4'
        };
      }
      return {
        head: 'ref: refs/heads/main',
        branchRef: 'refs/heads/main -> c3904e1',
        commitHash: 'c3904e1',
        commitMsg: 'HEAD still at previous commit',
        treeHash: 'Index cache updated (mode 100644)',
        treeDetail: 'Binary index registers 7ab38f4',
        blobHash: '7ab38f4',
        blobDetail: 'app/deployment.yaml (replicas: 3)'
      };

    case 'what-git-commit-creates':
      if (stepIdx === 0) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1 (parent)',
          commitMsg: 'Initial infrastructure setup',
          treeHash: '7b2a901 (staged in index)',
          treeDetail: 'Ready for write-tree',
          blobHash: '7ab38f4',
          blobDetail: 'deployment.yaml (staged)'
        };
      }
      if (stepIdx === 1) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1 (parent)',
          commitMsg: 'Commit not minted yet',
          treeHash: '7b2a901 (written to objects/)',
          treeDetail: 'Root Merkle tree frozen',
          blobHash: '7ab38f4',
          blobDetail: 'Referenced by tree 7b2a901'
        };
      }
      return {
        head: 'ref: refs/heads/main',
        branchRef: stepIdx === 3 ? 'refs/heads/main -> 4f901ab (ADVANCED!)' : 'refs/heads/main -> c3904e1',
        commitHash: '4f901ab',
        commitMsg: '"Scale cache deployment"',
        treeHash: '7b2a901',
        treeDetail: 'tree pointer in commit envelope',
        blobHash: '7ab38f4',
        blobDetail: 'app/deployment.yaml (replicas: 3)'
      };

    case 'branches-are-references':
      if (stepIdx < 2) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: stepIdx === 1 ? 'main: 4f901ab | feature/cache: 4f901ab' : 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: 'Both branch files point to same commit',
          treeHash: '7b2a901',
          treeDetail: 'Identical snapshot shared',
          blobHash: '7ab38f4',
          blobDetail: 'No files duplicated'
        };
      }
      return {
        head: 'ref: refs/heads/feature/cache',
        branchRef: 'feature/cache -> b14c80e (main at 4f901ab)',
        commitHash: 'b14c80e',
        commitMsg: '"Add redis cache configuration"',
        treeHash: '9a210cd',
        treeDetail: 'New tree object created',
        blobHash: 'd19028a',
        blobDetail: 'app/deployment.yaml (redis enabled)'
      };

    case 'head-pointer-and-detached-head':
      if (stepIdx === 0) {
        return {
          head: 'ref: refs/heads/feature/cache',
          branchRef: 'refs/heads/feature/cache -> b14c80e',
          commitHash: 'b14c80e',
          commitMsg: '"Add redis cache configuration"',
          treeHash: '9a210cd',
          treeDetail: 'Feature tree',
          blobHash: 'd19028a',
          blobDetail: 'redis enabled'
        };
      }
      if (stepIdx === 1) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: '"Scale cache deployment"',
          treeHash: '7b2a901',
          treeDetail: 'Main root tree',
          blobHash: '7ab38f4',
          blobDetail: 'replicas: 3'
        };
      }
      return {
        head: '4f901ab (DETACHED HEAD!)',
        branchRef: 'No branch reference! HEAD is a raw SHA.',
        commitHash: '4f901ab',
        commitMsg: 'New commits here will become orphans!',
        treeHash: '7b2a901',
        treeDetail: 'Read-only inspection state',
        blobHash: '7ab38f4',
        blobDetail: 'replicas: 3'
      };

    case 'checkout-switch-rebuilding-workspace':
      if (stepIdx === 0) {
        return {
          head: 'ref: refs/heads/feature/cache',
          branchRef: 'refs/heads/feature/cache -> b14c80e',
          commitHash: 'b14c80e',
          commitMsg: 'Feature branch with Redis config',
          treeHash: '9a210cd',
          treeDetail: 'Redis cache tree on disk',
          blobHash: 'd19028a',
          blobDetail: 'active in working tree'
        };
      }
      if (stepIdx === 1) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: 'Switched to main',
          treeHash: '7b2a901',
          treeDetail: 'Rebuilt index & disk in 3 atomic steps',
          blobHash: '7ab38f4',
          blobDetail: 'disk overwritten safely'
        };
      }
      return {
        head: 'ref: refs/heads/feature/cache',
        branchRef: 'refs/heads/feature/cache -> b14c80e',
        commitHash: 'b14c80e',
        commitMsg: stepIdx === 2 ? 'Switch blocked: uncommitted edits!' : 'Stashed safely; clean switch allowed',
        treeHash: '9a210cd',
        treeDetail: stepIdx === 3 ? 'Stash object stored in .git/refs/stash' : 'Dirty working tree conflict',
        blobHash: 'd19028a',
        blobDetail: 'Preventing silent data loss'
      };

    case 'merge-vs-rebase-graph-surgery':
      if (stepIdx === 0) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'main -> e78b21a | feature -> b14c80e',
          commitHash: 'e78b21a',
          commitMsg: 'Common ancestor at c3904e1',
          treeHash: '3d19ac0',
          treeDetail: 'Diverged histories',
          blobHash: '7ab38f4',
          blobDetail: 'Independent branch snapshots'
        };
      }
      if (stepIdx === 1) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 8c1490e',
          commitHash: '8c1490e (MERGE COMMIT)',
          commitMsg: '2 parents: e78b21a & b14c80e',
          treeHash: 'f419dc8',
          treeDetail: '3-way merge snapshot',
          blobHash: 'b14c80e',
          blobDetail: 'Merged replica and port config'
        };
      }
      return {
        head: 'ref: refs/heads/feature/cache',
        branchRef: 'feature/cache -> a92d18f (rebased)',
        commitHash: 'a92d18f (BRAND NEW HASH)',
        commitMsg: 'Replayed commit atop main',
        treeHash: 'f419dc8',
        treeDetail: 'Linearized Merkle tree',
        blobHash: 'b14c80e',
        blobDetail: 'Original b14c80e orphaned!'
      };

    case 'reset-restore-revert':
      if (stepIdx === 0) {
        return {
          head: 'ref: refs/heads/main -> 4f901ab',
          branchRef: 'HEAD, Index, and Disk aligned at 4f901ab',
          commitHash: '4f901ab',
          commitMsg: '"Scale cache deployment"',
          treeHash: '7b2a901',
          treeDetail: 'Baseline clean state',
          blobHash: '7ab38f4',
          blobDetail: 'replicas: 3'
        };
      }
      if (stepIdx === 1) {
        return {
          head: 'ref: refs/heads/main -> e78b21a',
          branchRef: 'HEAD moved back. Index & Disk untouched!',
          commitHash: 'e78b21a',
          commitMsg: '4f901ab changes now staged in index',
          treeHash: '7b2a901 (Index still at 4f901ab)',
          treeDetail: 'Zero work lost',
          blobHash: '7ab38f4',
          blobDetail: 'Safe undo of commit envelope'
        };
      }
      if (stepIdx === 2) {
        return {
          head: 'ref: refs/heads/main -> e78b21a',
          branchRef: 'HEAD and Index moved back. Disk untouched!',
          commitHash: 'e78b21a',
          commitMsg: '4f901ab changes now unstaged on disk',
          treeHash: '3d19ac0 (Index reset to e78b21a)',
          treeDetail: 'Working tree retains edits',
          blobHash: '7ab38f4 (on disk)',
          blobDetail: 'Default git reset mode'
        };
      }
      return {
        head: 'ref: refs/heads/main -> e78b21a',
        branchRef: 'HEAD, Index, and Working Tree FORCIBLY OVERWRITTEN!',
        commitHash: 'e78b21a',
        commitMsg: 'Destructive reset executed',
        treeHash: '3d19ac0',
        treeDetail: 'Uncommitted working tree changes destroyed',
        blobHash: 'c3904e1 bytes',
        blobDetail: 'Requires reflog rescue to recover'
      };

    case 'merge-conflicts-three-stage-index':
      if (stepIdx === 0) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main (merging feature/cache)',
          commitHash: 'e78b21a',
          commitMsg: 'Merge halted due to overlapping edits',
          treeHash: 'Index in conflict mode',
          treeDetail: 'deployment.yaml unmerged',
          blobHash: 'Stage 1, 2, 3 active',
          blobDetail: 'Conflict markers written to disk'
        };
      }
      if (stepIdx === 1) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'Stage 1: BASE | Stage 2: OURS | Stage 3: THEIRS',
          commitHash: 'e78b21a vs b14c80e',
          commitMsg: 'Common ancestor: c3904e1',
          treeHash: '3-stage index entries',
          treeDetail: 'git ls-files --stage reveals 3 blobs',
          blobHash: '1: c3904 (2 reps) | 2: e78b (5 reps) | 3: b14c (3 reps)',
          blobDetail: 'Three distinct blob hashes in .git/objects/'
        };
      }
      if (stepIdx === 2) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: 'Working tree file has <<<<<<< and >>>>>>>',
          commitHash: 'e78b21a',
          commitMsg: 'Manual resolution required',
          treeHash: 'Unmerged index state',
          treeDetail: 'Cannot commit until resolved',
          blobHash: 'Diff markers on disk',
          blobDetail: 'Engineer chooses correct lines'
        };
      }
      return {
        head: 'ref: refs/heads/main',
        branchRef: 'Conflict resolved! Stages 1-3 collapsed to Stage 0',
        commitHash: 'e78b21a',
        commitMsg: 'Ready for merge commit',
        treeHash: 'Resolved index snapshot',
        treeDetail: 'Normal stage 0 entry restored',
        blobHash: 'f5819ab (new resolved blob)',
        blobDetail: 'replicas: 4 (resolved compromise)'
      };

    case 'worktrees-reflog-and-plumbing':
      if (stepIdx === 0) {
        return {
          head: '/wt/networking: ref: refs/heads/feature/networking',
          branchRef: 'Independent worktree directory',
          commitHash: 'b14c80e',
          commitMsg: 'Worktree shares .git/objects with main repo',
          treeHash: 'Dedicated private index',
          treeDetail: 'Separate HEAD pointer file',
          blobHash: 'b14c80e',
          blobDetail: 'Zero duplicated object storage'
        };
      }
      if (stepIdx === 1) {
        return {
          head: '/repos/infra-platform: ref: refs/heads/main',
          branchRef: 'Root repository worktree',
          commitHash: '4f901ab',
          commitMsg: 'Context switch without stashing or branch switching',
          treeHash: 'Root index intact',
          treeDetail: 'Different branch checked out simultaneously',
          blobHash: '7ab38f4',
          blobDetail: 'Multi-directory development'
        };
      }
      if (stepIdx === 2) {
        return {
          head: 'HEAD@{1} = 4f901ab (from .git/logs/HEAD)',
          branchRef: 'Reflog rescued orphaned commit',
          commitHash: '4f901ab',
          commitMsg: 'Restored before git gc prune',
          treeHash: '7b2a901',
          treeDetail: 'Object was never deleted, only unreferenced',
          blobHash: '7ab38f4',
          blobDetail: '30-90 day reflog safety window'
        };
      }
      return {
        head: 'ref: refs/heads/main -> 5f201ab',
        branchRef: 'Advanced directly via git update-ref',
        commitHash: '5f201ab (minted via commit-tree)',
        commitMsg: 'Manual plumbing pipeline completed',
        treeHash: '9b310ef (written via write-tree)',
        treeDetail: 'Generated directly from index entries',
        blobHash: '7ab38f4 (hashed via hash-object -w)',
        blobDetail: 'Porcelain commands are just wrappers!'
      };

    default:
      return {
        head: `ref: refs/heads/${lab.branch}`,
        branchRef: `refs/heads/${lab.branch}`,
        commitHash: step.dagNodeId || '4f901ab',
        commitMsg: step.label,
        treeHash: '7b2a901',
        treeDetail: 'Snapshot root tree',
        blobHash: '7ab38f4',
        blobDetail: 'app/deployment.yaml'
      };
  }
}
