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

// Persistent repository helper: keeps the exact same repo structure throughout all 10 levels
function getRepoFiles(options: {
  includeGit?: boolean;
  deploymentStatus?: 'M' | 'A' | 'MM' | '??' | 'UU' | 'D';
  deploymentHighlight?: boolean;
  deploymentName?: string;
  hasRedis?: boolean;
  redisStatus?: 'M' | 'A' | '??';
  redisHighlight?: boolean;
  redisName?: string;
  gitFiles?: GitFile[];
  readmeStatus?: '??';
}): GitFile[] {
  const files: GitFile[] = [];

  if (options.includeGit) {
    files.push(
      { path: '.git', name: '.git/ [Hidden Git Vault]', isDir: true, depth: 0, highlight: true },
      { path: '.git/HEAD', name: 'HEAD (active pointer)', depth: 1, highlight: true },
      { path: '.git/index', name: 'index (binary staging ledger)', depth: 1 },
      { path: '.git/objects', name: 'objects/ (immutable object storage)', isDir: true, depth: 1 },
      { path: '.git/refs', name: 'refs/heads/ (branch pointer files)', isDir: true, depth: 1 }
    );
    if (options.gitFiles) {
      files.push(...options.gitFiles);
    }
  }

  // Working Directory files (infra-platform)
  files.push(
    { path: 'app', name: 'app/', isDir: true, depth: 0 },
    {
      path: 'app/deployment.yaml',
      name: options.deploymentName || 'deployment.yaml',
      depth: 1,
      status: options.deploymentStatus,
      highlight: options.deploymentHighlight
    }
  );

  if (options.hasRedis) {
    files.push({
      path: 'app/redis.yaml',
      name: options.redisName || 'redis.yaml',
      depth: 1,
      status: options.redisStatus,
      highlight: options.redisHighlight
    });
  }

  files.push(
    { path: 'environments', name: 'environments/', isDir: true, depth: 0 },
    { path: 'environments/prod.tfvars', name: 'prod.tfvars', depth: 1 },
    { path: 'environments/sandbox.tfvars', name: 'sandbox.tfvars', depth: 1 },
    { path: 'modules', name: 'modules/', isDir: true, depth: 0 },
    { path: 'modules/iam', name: 'iam/', isDir: true, depth: 1 },
    { path: 'modules/iam/roles.tf', name: 'roles.tf', depth: 2 },
    { path: 'modules/networking', name: 'networking/', isDir: true, depth: 1 },
    { path: 'modules/networking/vpc.tf', name: 'vpc.tf', depth: 2 },
    { path: 'README.md', name: 'README.md', depth: 0, status: options.includeGit ? undefined : '??' },
    { path: '.gitignore', name: '.gitignore', depth: 0 }
  );

  return files;
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
    path: '~/repos/infra-platform',
    branch: 'main',
    question: 'When you run git init, where does Git actually live and how does it track your files?',
    whatLearnerThinks: '“Git tracks this folder by injecting hidden tracking codes or altering my project files.”',
    whatWeReveal: 'Git never alters your code files. It sets up a secret hidden vault (.git/) right inside your project with four primary doors: HEAD, index, objects/, and refs/.',
    takeaway: 'Think of your project folder as your bedroom with toys on the floor. Running git init does not touch your toys at all! It just sets up a secret clubhouse in your closet (.git/) with a camera, a notebook, and locked chests. If you delete that .git/ folder, your files stay right where they are, but Git forgets everything it ever saw!',
    caveat: 'Deleting the hidden .git directory completely erases your entire commit history, all branches, and staging records without touching your current disk files.',
    inspector: 'Inspect the newly initialized repository. Notice the clean separation between ordinary filesystem files and the hidden .git metadata database.',
    sources: [
      'https://git-scm.com/docs/git-init',
      'https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain'
    ],
    steps: [
      {
        label: '1. inspect folder before git',
        command: 'cd ~/repos/infra-platform && ls -la',
        output: [
          'dev@lab:~/repos/infra-platform$ ls -la',
          'total 24',
          'drwxr-xr-x 5 dev dev 4096 Sep 20 09:00 .',
          'drwxr-xr-x 3 dev dev 4096 Sep 20 09:00 ..',
          'drwxr-xr-x 2 dev dev 4096 Sep 20 09:00 app',
          'drwxr-xr-x 2 dev dev 4096 Sep 20 09:00 environments',
          'drwxr-xr-x 4 dev dev 4096 Sep 20 09:00 modules',
          '-rw-r--r-- 1 dev dev  140 Sep 20 09:00 README.md',
          '-rw-r--r-- 1 dev dev   85 Sep 20 09:00 .gitignore',
          '# A regular Linux folder with files. Notice: .git does NOT exist yet!'
        ],
        files: getRepoFiles({ includeGit: false }),
        shelf: [
          { label: 'Working Tree', value: 'infra-platform/', detail: 'Ordinary files on disk', badge: 'neutral' },
          { label: 'Git Database', value: 'Not Initialized', detail: 'No .git directory yet', badge: 'warning' },
          { label: 'HEAD Reference', value: 'None', detail: 'Repository does not exist', badge: 'neutral' },
          { label: 'Tracking Mode', value: 'Untracked', detail: 'Ordinary OS filesystem', badge: 'neutral' }
        ],
        inspectorState: 'Ordinary Operating System Folder',
        inspectorDetail: 'ELI5: Your project is just normal files on a normal computer hard drive. Git is not watching you yet. Nothing is saved or protected until you turn Git on with git init.',
        inspectorOperation: 'ls -la',
        internalChange: 'Standard filesystem inode read. Zero Git metadata.',
        takeaway: 'Before git init, files are just ordinary disk bytes managed exclusively by your operating system.',
        plumbingCommand: 'test -d .git || echo "No repository exists yet"',
        xrayNote: 'Look at Column 1: Only your ordinary code files exist. The .git/ vault has not been built.',
        internals: {
          head: 'None (Git not initialized)',
          branchRef: 'None',
          commitHash: 'None',
          commitMsg: 'No repository initialized',
          treeHash: 'None',
          treeDetail: 'No git tree object',
          blobHash: 'None',
          blobDetail: 'Files are ordinary disk bytes'
        }
      },
      {
        label: '2. git init (create .git vault)',
        command: 'git init -b main',
        output: [
          'dev@lab:~/repos/infra-platform$ git init -b main',
          'Initialized empty Git repository in /home/dev/repos/infra-platform/.git/',
          '# Git just created the hidden .git directory!',
          '# This folder is the entire database: every commit, branch, and object lives here.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: '??',
          deploymentHighlight: true,
          readmeStatus: '??'
        }),
        shelf: [
          { label: 'Working Tree', value: 'infra-platform/', detail: 'Files marked untracked (??)', badge: 'warning' },
          { label: 'Git Vault (.git)', value: 'Initialized', detail: 'Secret database created', badge: 'success' },
          { label: 'Default Branch', value: 'main (unborn)', detail: 'Waiting for initial commit', badge: 'neutral' },
          { label: 'Object Storage', value: '0 objects', detail: 'Vault is currently empty', badge: 'neutral' }
        ],
        inspectorState: 'Git Secret Vault Initialized',
        inspectorDetail: 'ELI5: Git just built its secret clubhouse (.git/) in your closet! It put a blank diary (index), an empty photo album (objects/), and a bookmark label (HEAD) inside.',
        inspectorOperation: 'git init -b main',
        internalChange: 'Created .git/ folder with HEAD, config, description, hooks/, info/, objects/, and refs/.',
        takeaway: 'Git is not in the cloud; Git is literally this tiny hidden .git folder sitting right inside your project directory.',
        plumbingCommand: 'git rev-parse --git-dir',
        xrayNote: 'Switch to ⚡ X-Ray mode to see the hidden .git/ folder illuminate at the top of the file tree!',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main (unborn)',
          commitHash: 'None (empty repo)',
          commitMsg: 'Waiting for initial commit',
          treeHash: 'None',
          treeDetail: 'Index awaiting git add',
          blobHash: 'None',
          blobDetail: '0 loose objects in .git/objects/'
        }
      },
      {
        label: '3. open the 4 doors of .git',
        command: 'ls -la .git && cat .git/HEAD',
        output: [
          'dev@lab:~/repos/infra-platform$ ls -la .git && cat .git/HEAD',
          'total 32',
          '-rw-r--r-- 1 dev dev   23 Sep 20 09:00 HEAD',
          '-rw-r--r-- 1 dev dev  130 Sep 20 09:00 config',
          'drwxr-xr-x 2 dev dev 4096 Sep 20 09:00 objects',
          'drwxr-xr-x 4 dev dev 4096 Sep 20 09:00 refs',
          '',
          'ref: refs/heads/main',
          '# THE FOUR SACRED DOORS OF GIT:',
          '# 1. HEAD      -> "You are here" pin pointing to refs/heads/main',
          '# 2. index     -> The staging conveyor belt (created on first git add)',
          '# 3. objects/  -> The locked vault storing immutable blobs, trees, commits',
          '# 4. refs/     -> The box of branch bookmarks'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: '??',
          readmeStatus: '??'
        }),
        shelf: [
          { label: 'Door 1: HEAD', value: 'ref: refs/heads/main', detail: 'Red pin on the map', badge: 'neutral' },
          { label: 'Door 2: index', value: 'Conveyor Belt', detail: 'Awaiting first git add', badge: 'neutral' },
          { label: 'Door 3: objects/', value: 'The Photo Vault', detail: 'Stores blobs, trees, commits', badge: 'neutral' },
          { label: 'Door 4: refs/', value: 'Branch Bookmarks', detail: 'refs/heads/ holds main', badge: 'neutral' }
        ],
        inspectorState: 'The 4 Doors of Git',
        inspectorDetail: 'ELI5: Every single Git command you will ever run simply shuffles papers between these 4 doors: HEAD (where you are), index (what is on the scanner), objects/ (photos in the safe), and refs/ (named bookmarks).',
        inspectorOperation: 'cat .git/HEAD',
        internalChange: 'Inspected .git/HEAD contents: points symbolically to refs/heads/main.',
        takeaway: 'Mastering Git internals is just understanding how HEAD, index, objects/, and refs/ talk to each other.',
        plumbingCommand: 'cat .git/HEAD',
        xrayNote: 'Turn on X-Ray mode: notice HEAD glowing cyan. It is literally a 1-line text file!',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main',
          commitHash: 'None',
          commitMsg: 'Initial state ready',
          treeHash: 'None',
          treeDetail: 'No snapshot taken yet',
          blobHash: 'None',
          blobDetail: 'Files are on disk, not in objects/'
        }
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
    path: '~/repos/infra-platform',
    branch: 'main',
    question: 'Why does Git have a "staging area" instead of committing directly, and what is a Blob?',
    whatLearnerThinks: '“git add puts my file in a temporary holding list of filenames.”',
    whatWeReveal: 'git add immediately hashes your file contents, compresses the raw bytes into a permanent Blob inside .git/objects/, and registers the path-to-hash mapping in the binary index. Shows why the MM state occurs.',
    takeaway: 'ELI5: Think of git add like putting a drawing onto a photocopier scanner bed. Git makes an airtight photocopy (a Blob), stamps it with a fingerprint seal (the SHA-1 hash), locks it in the vault (.git/objects/), and writes on a clipboard (the index): "File deployment.yaml matches photocopy #7ab38f4". Git does not even write the filename on the drawing!',
    caveat: 'If you run git add and then edit your file again without running git add a second time, Git tracks both! Your file enters the famous MM state: one version is staged on the scanner, and a newer version is on your desk.',
    inspector: 'Observe how git add immediately creates an immutable Blob object in .git/objects/ and updates the index before you ever run git commit.',
    sources: [
      'https://git-scm.com/docs/git-add',
      'https://git-scm.com/docs/git-hash-object',
      'https://git-scm.com/book/en/v2/Git-Internals-Git-Objects'
    ],
    steps: [
      {
        label: '1. edit app/deployment.yaml',
        command: 'sed -i "s/replicas: 2/replicas: 3/" app/deployment.yaml && git status -s',
        output: [
          'dev@lab:~/repos/infra-platform$ sed -i "s/replicas: 2/replicas: 3/" app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git status -s',
          ' M app/deployment.yaml',
          '# Red "M" in second column = Modified in WORKING TREE (your desk).',
          '# Git has NOT hashed this change yet. .git/objects/ has not changed!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'M',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml (replicas: 3)'
        }),
        shelf: [
          { label: 'Working Tree', value: 'replicas: 3', detail: 'Unsaved scribbles on your desk', badge: 'warning' },
          { label: 'Staging Index', value: 'replicas: 2 (old)', detail: 'Scanner bed has old version', badge: 'neutral' },
          { label: 'Object Storage', value: 'Blob 94b810a', detail: 'Previous committed blob', badge: 'neutral' },
          { label: 'HEAD Commit', value: 'c3904e1', detail: 'Last snapshot in album', badge: 'neutral' }
        ],
        inspectorState: 'File Modified Locally on Desk',
        inspectorDetail: 'ELI5: You picked up a pencil and changed "replicas: 2" to "replicas: 3" on your desk. Git notices the file looks different from the last photo, but it has not made a photocopy yet.',
        inspectorOperation: 'edit app/deployment.yaml',
        internalChange: 'Working tree file modified on disk. Index and .git/objects remain untouched.',
        takeaway: 'Edits on your disk stay purely on your disk until you explicitly tell Git to scan them with git add.',
        plumbingCommand: 'git diff app/deployment.yaml',
        xrayNote: 'Working tree file glows amber (M). Notice .git/objects still only holds the old baseline blob.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1',
          commitMsg: 'Initial infrastructure baseline',
          treeHash: 'e189ac2',
          treeDetail: 'Previous committed tree',
          blobHash: '94b810a',
          blobDetail: 'app/deployment.yaml (replicas: 2)'
        }
      },
      {
        label: '2. git add (hash & write blob)',
        command: 'git add app/deployment.yaml && git status -s',
        output: [
          'dev@lab:~/repos/infra-platform$ git add app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git status -s',
          'M  app/deployment.yaml',
          '# Green "M" in first column = Staged in INDEX (on the scanner).',
          '# X-RAY REVEAL: Git just hashed the file and wrote blob 7ab38f4 to .git/objects/7a/!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'A',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml [staged: 7ab38f4]',
          gitFiles: [
            { path: '.git/objects/7a', name: 'objects/7a/b38f4... [Blob 7ab38f4]', depth: 1, highlight: true },
            { path: '.git/index', name: 'index [staged: 7ab38f4 app/deployment.yaml]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Working Tree', value: 'replicas: 3', detail: 'Matches staged content', badge: 'neutral' },
          { label: 'Staging Index', value: 'blob 7ab38f4', detail: 'Registered path -> SHA mapping', badge: 'success' },
          { label: 'Object Storage', value: '7ab38f4 written', detail: 'Zlib compressed blob in vault', badge: 'changed' },
          { label: 'HEAD Commit', value: 'c3904e1', detail: 'HEAD has not moved yet!', badge: 'neutral' }
        ],
        inspectorState: 'Blob Sealed in Vault & Registered in Index',
        inspectorDetail: 'ELI5: Git took your drawing, compressed it, gave it a unique barcode (7ab38f4), and slipped it into the vault! Then it wrote on its scanner clipboard: "deployment.yaml is now barcode 7ab38f4".',
        inspectorOperation: 'git add app/deployment.yaml',
        internalChange: 'Compressed zlib blob written to .git/objects/7a/b38f4. Binary .git/index updated with SHA 7ab38f4.',
        takeaway: 'git add is what actually saves your file content into Git storage. git commit just ties a bow around what is already saved!',
        plumbingCommand: 'git ls-files --stage app/deployment.yaml',
        xrayNote: 'Turn on ⚡ X-Ray: See objects/7a/b38f4 appear! Notice the blob contains pure bytes—no filename is stored inside a blob!',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1',
          commitMsg: 'HEAD still at previous commit',
          treeHash: 'Index cache updated (mode 100644)',
          treeDetail: 'Binary index registers 7ab38f4',
          blobHash: '7ab38f4',
          blobDetail: 'app/deployment.yaml (replicas: 3)'
        }
      },
      {
        label: '3. inspect index & blob (cat-file)',
        command: 'git ls-files --stage app/deployment.yaml && git cat-file -p 7ab38f4',
        output: [
          'dev@lab:~/repos/infra-platform$ git ls-files --stage app/deployment.yaml',
          '100644 7ab38f4a2190cd89e1401bc389012478901234ab 0	app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git cat-file -p 7ab38f4',
          'apiVersion: apps/v1',
          'kind: Deployment',
          'metadata:',
          '  name: cache-redis',
          'spec:',
          '  replicas: 3',
          '# LOOK CLOSELY: The blob contains ONLY file bytes. File names live in Trees, not Blobs!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'A',
          deploymentName: 'deployment.yaml [staged: 7ab38f4]',
          gitFiles: [
            { path: '.git/objects/7a', name: 'objects/7a/b38f4... [Blob: replicas: 3]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Index Entry', value: '100644 7ab38f4', detail: 'Mode + Hash + Stage 0 + Path', badge: 'success' },
          { label: 'Object Type', value: 'blob', detail: 'Pure unadorned file content', badge: 'neutral' },
          { label: 'Filename Location', value: 'In Index (Not Blob)', detail: 'Blobs are content-addressable', badge: 'changed' },
          { label: 'Deduplication', value: 'Identical content = 1 blob', detail: 'Zero duplicate storage', badge: 'neutral' }
        ],
        inspectorState: 'Peeking Inside the Blob',
        inspectorDetail: 'ELI5: When we open jar #7ab38f4 with git cat-file, we see your exact text: "replicas: 3". If you had 5 identical files across your project, Git would only store this single jar once!',
        inspectorOperation: 'git cat-file -p 7ab38f4',
        internalChange: 'Read blob decompressed from .git/objects/7a/. Verified index mapping.',
        takeaway: 'A Blob is pure content. If you rename a file without changing its content, Git does not write a single new byte to objects/!',
        plumbingCommand: 'git cat-file -t 7ab38f4',
        xrayNote: 'Try running Plumbing mode above: see how git cat-file -p unzips the raw blob from disk.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1',
          commitMsg: 'HEAD still at c3904e1',
          treeHash: 'Index staged with 7ab38f4',
          treeDetail: 'File name mapped to SHA in index',
          blobHash: '7ab38f4',
          blobDetail: 'replicas: 3 (pure payload)'
        }
      },
      {
        label: '4. edit again (3 -> 4) => MM state',
        command: 'sed -i "s/replicas: 3/replicas: 4/" app/deployment.yaml && git status -s',
        output: [
          'dev@lab:~/repos/infra-platform$ sed -i "s/replicas: 3/replicas: 4/" app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git status -s',
          'MM app/deployment.yaml',
          '# THE FAMOUS "MM" STATE REVEALED:',
          '# First M (green)  = Version staged in INDEX (replicas: 3)',
          '# Second M (red)   = Newer version in WORKING TREE on disk (replicas: 4)',
          '# HEAD commit      = Old baseline (replicas: 2)',
          '# THREE distinct versions exist simultaneously!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'MM',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml [MM: staged=3, disk=4]'
        }),
        shelf: [
          { label: 'Working Tree (Desk)', value: 'replicas: 4', detail: 'Second M: Unstaged on disk', badge: 'warning' },
          { label: 'Index (Scanner)', value: 'replicas: 3 (blob 7ab38f)', detail: 'First M: Staged ready to commit', badge: 'success' },
          { label: 'HEAD (Album)', value: 'replicas: 2 (commit C1)', detail: 'Last permanent snapshot', badge: 'neutral' },
          { label: 'State Resolution', value: 'git add stages 4', detail: 'Or git restore reverts to 3', badge: 'changed' }
        ],
        inspectorState: 'The 3-Layer MM State',
        inspectorDetail: 'ELI5: You put a drawing on the scanner bed (replicas: 3), but then you grabbed your pencil and scribbled on your desk copy again (replicas: 4) before hitting the camera button! Git knows both versions exist.',
        inspectorOperation: 'edit without staging',
        internalChange: 'Working tree diverges from index. Three independent states exist simultaneously.',
        takeaway: 'MM is not an error! It proves that the Working Tree, the Index, and the Commit History are three physically separate worlds.',
        plumbingCommand: 'git diff (working vs index) && git diff --staged (index vs HEAD)',
        xrayNote: 'Look at the badge MM in Column 1. Green M means index is staged; red M means disk has unstaged edits.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1',
          commitMsg: 'HEAD matches baseline commit',
          treeHash: 'Staged index differs from HEAD',
          treeDetail: 'MM state: 3 distinct representations',
          blobHash: '7ab38f4 (staged: 3)',
          blobDetail: 'Disk has unstaged replicas: 4'
        }
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
    path: '~/repos/infra-platform',
    branch: 'main',
    question: 'Does Git store diffs or full snapshots, and how does the Merkle Tree work?',
    whatLearnerThinks: '“Git saves the lines I added and deleted (+ and -) as a diff patch.”',
    whatWeReveal: 'Git never stores diffs. It freezes the index into root trees and subtrees (write-tree), wraps the root tree in a commit envelope (commit-tree), and advances the branch pointer (update-ref). Unmodified subtrees are reused by SHA reference with zero disk duplication.',
    takeaway: 'ELI5: Git does not save a list of changes like "+ line 4". Git takes a full photograph of your entire universe every single time! It builds a set of Russian nesting dolls: Blobs (files) fit into Trees (folders), which fit into a Root Tree (your whole project), which gets sealed inside a Commit Envelope with author, date, and previous commit ID. If a folder did not change, Git just points to the old doll—saving huge amounts of space!',
    caveat: 'Because every commit contains a full snapshot, comparing two commits is an ultra-fast O(1) pointer comparison between tree hashes, rather than scanning gigabytes of diffs.',
    inspector: 'Explore how git commit mints a Root Tree object and a Commit Envelope, linking parent ancestry and advancing the branch reference.',
    sources: [
      'https://git-scm.com/docs/git-commit',
      'https://git-scm.com/docs/git-write-tree',
      'https://git-scm.com/docs/git-commit-tree'
    ],
    steps: [
      {
        label: '1. stage all clean files',
        command: 'git add app/deployment.yaml && git status',
        output: [
          'dev@lab:~/repos/infra-platform$ git add app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git status',
          'On branch main',
          'Changes to be committed:',
          '  (use "git restore --staged <file>..." to unstage)',
          '    modified:   app/deployment.yaml',
          '',
          '# The index conveyor belt is fully prepared.',
          '# All project paths now map to immutable blob SHAs.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'A',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml (staged: 7ab38f4)'
        }),
        shelf: [
          { label: 'Working Tree', value: 'Clean state', detail: 'Matches index', badge: 'neutral' },
          { label: 'Index (Staging)', value: 'Ready for write-tree', detail: 'All paths mapped to SHAs', badge: 'success' },
          { label: 'Object DB', value: 'Loose blobs ready', detail: 'Blobs written in Step 2', badge: 'neutral' },
          { label: 'HEAD Pointer', value: 'main -> c3904e1', detail: 'Waiting to advance', badge: 'neutral' }
        ],
        inspectorState: 'Index Snapshot Ready to Freeze',
        inspectorDetail: 'ELI5: All your toys are lined up on the scanner bed. The camera is loaded and ready. Git is waiting for you to say "Cheese!" with git commit.',
        inspectorOperation: 'git add .',
        internalChange: 'Index updated. All directory entries mapped to current blob hashes.',
        takeaway: 'git commit does not look at your files on disk. git commit takes a picture of whatever is on the index conveyor belt!',
        plumbingCommand: 'git write-tree (dry run)',
        xrayNote: 'Notice in X-Ray: the index has all the hashes lined up, ready to be frozen into Tree objects.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> c3904e1',
          commitHash: 'c3904e1 (parent)',
          commitMsg: 'Initial infrastructure baseline',
          treeHash: '7b2a901 (staged in index)',
          treeDetail: 'Ready for write-tree',
          blobHash: '7ab38f4',
          blobDetail: 'app/deployment.yaml (staged)'
        }
      },
      {
        label: '2. git commit (write tree & mint commit)',
        command: 'git commit -m "Scale cache deployment" && git status',
        output: [
          'dev@lab:~/repos/infra-platform$ git commit -m "Scale cache deployment"',
          '[main 4f901ab] Scale cache deployment',
          ' 1 file changed, 1 insertion(+), 1 deletion(-)',
          'dev@lab:~/repos/infra-platform$ git status',
          'On branch main',
          'nothing to commit, working tree clean',
          '# WHAT JUST PHYSICALLY HAPPENED:',
          '# 1. git write-tree   -> froze index into Root Tree f419dc8',
          '# 2. git commit-tree  -> sealed tree in Commit envelope 4f901ab',
          '# 3. git update-ref   -> moved main pointer to 4f901ab'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (replicas: 4)',
          gitFiles: [
            { path: '.git/objects/4f', name: 'objects/4f/901ab... [Commit Envelope 4f901ab]', depth: 1, highlight: true },
            { path: '.git/objects/f4', name: 'objects/f4/19dc8... [Root Tree f419dc8]', depth: 1, highlight: true },
            { path: '.git/refs/heads/main', name: 'refs/heads/main -> 4f901ab [ADVANCED!]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Working Tree', value: 'Clean', detail: 'Matches committed HEAD', badge: 'neutral' },
          { label: 'Root Tree', value: 'f419dc8 created', detail: 'Complete project directory table', badge: 'success' },
          { label: 'Commit Object', value: '4f901ab minted', detail: 'Envelope sealed in objects/', badge: 'changed' },
          { label: 'Branch Pointer', value: 'main -> 4f901ab', detail: 'Moved forward by 1 commit', badge: 'success' }
        ],
        inspectorState: 'The 3-Step Commit Chain Reaction',
        inspectorDetail: 'ELI5: Click! The camera flashed. Git created a photo receipt (Tree f419dc8), sealed it in an envelope (Commit 4f901ab), and slid the "main" bookmark to point to this new envelope.',
        inspectorOperation: 'git commit -m "Scale cache deployment"',
        internalChange: 'Tree f419dc8 written. Commit 4f901ab created with parent c3904e1. refs/heads/main updated to 4f901ab.',
        takeaway: 'Commits are envelopes holding a Tree pointer, parent commit pointers, an author signature, and your message.',
        plumbingCommand: 'git rev-parse HEAD',
        xrayNote: 'In X-Ray: See objects/4f and objects/f4 appear. Look at the DAG diagram below: the commit node points to the root tree!',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 4f901ab (ADVANCED!)',
          commitHash: '4f901ab',
          commitMsg: '"Scale cache deployment"',
          treeHash: 'f419dc8',
          treeDetail: 'Root Merkle snapshot tree',
          blobHash: '7ab38f4',
          blobDetail: 'app/deployment.yaml (in tree)'
        }
      },
      {
        label: '3. inspect commit envelope (cat-file -p)',
        command: 'git cat-file -p 4f901ab',
        output: [
          'dev@lab:~/repos/infra-platform$ git cat-file -p 4f901ab',
          'tree f419dc8e18ac49b012891ac37890123456789abc',
          'parent c3904e189012345678901234567890123456789a',
          'author SRE Engineer <dev@infra.local> 1726750000 +0000',
          'committer SRE Engineer <dev@infra.local> 1726750000 +0000',
          '',
          'Scale cache deployment',
          '# ANATOMY OF A COMMIT ENVELOPE:',
          '# 1. tree    -> Pointer to Root Tree snapshot',
          '# 2. parent  -> Pointer to previous commit (forms the history chain)',
          '# 3. author  -> Who made the change and timestamp',
          '# 4. message -> Your commit explanation'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml'
        }),
        shelf: [
          { label: 'Commit SHA', value: '4f901ab', detail: 'Hash of envelope contents', badge: 'neutral' },
          { label: 'Tree Pointer', value: 'tree f419dc8', detail: 'Points to project root tree', badge: 'success' },
          { label: 'Parent Pointer', value: 'parent c3904e1', detail: 'Forms the backward history DAG', badge: 'neutral' },
          { label: 'Envelope Size', value: '~200 bytes', detail: 'Ultra lightweight metadata envelope', badge: 'neutral' }
        ],
        inspectorState: 'Inside the Commit Envelope',
        inspectorDetail: 'ELI5: Look inside envelope #4f901ab: it only contains 4 lines of text! It points to the photo receipt (tree f419dc8) and remembers who its parent was (c3904e1). That is how Git builds history backwards!',
        inspectorOperation: 'git cat-file -p HEAD',
        internalChange: 'Decompressed commit object 4f901ab from .git/objects/4f/.',
        takeaway: 'Git history is not a forward timeline; it is a backward chain of breadcrumbs where each commit points to its parent.',
        plumbingCommand: 'git cat-file -p HEAD',
        xrayNote: 'Plumbing trick: cat-file -p HEAD shows the exact raw text that Git hashed to produce 4f901ab.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: '"Scale cache deployment"',
          treeHash: 'f419dc8',
          treeDetail: 'tree pointer in commit envelope',
          blobHash: '7ab38f4',
          blobDetail: 'app/deployment.yaml (replicas: 4)'
        }
      },
      {
        label: '4. inspect Merkle tree & subtree reuse',
        command: 'git cat-file -p f419dc8',
        output: [
          'dev@lab:~/repos/infra-platform$ git cat-file -p f419dc8',
          '040000 tree 7b2a901e18ac49b012891ac37890123456789abc	app',
          '040000 tree 8190ac2e89012345678901234567890123456789a	environments',
          '040000 tree e2018bae89012345678901234567890123456789a	modules',
          '100644 blob a48fe12e89012345678901234567890123456789a	README.md',
          '100644 blob b2190cde89012345678901234567890123456789a	.gitignore',
          '# LOOK AT SUBTREE REUSE:',
          '# modules/ was NOT changed. Its tree hash (e2018ba) is 100% IDENTICAL to C1!',
          '# Git reused the existing subtree pointer: O(1) deduplication, 0 bytes duplicated!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml',
          gitFiles: [
            { path: '.git/objects/7b', name: 'objects/7b/2a901... [app/ subtree - NEW]', depth: 1, highlight: true },
            { path: '.git/objects/e2', name: 'objects/e2/018ba... [modules/ subtree - REUSED]', depth: 1 }
          ]
        }),
        shelf: [
          { label: 'Root Tree', value: 'f419dc8', detail: 'Project directory table', badge: 'neutral' },
          { label: 'Subtree app/', value: '7b2a901 (NEW)', detail: 'Contains modified deployment blob', badge: 'changed' },
          { label: 'Subtree modules/', value: 'e2018ba (REUSED)', detail: 'O(1) pointer reuse: zero duplicate bytes', badge: 'success' },
          { label: 'Subtree envs/', value: '8190ac2 (REUSED)', detail: 'Zero duplicate storage', badge: 'success' }
        ],
        inspectorState: 'The Magic of Merkle Subtree Reuse',
        inspectorDetail: 'ELI5: We only changed 1 file inside app/. Notice that modules/ and environments/ did not change at all! Git did not copy them; it just reused their existing receipt barcodes. That is why Git repos are so tiny and fast!',
        inspectorOperation: 'git cat-file -p f419dc8',
        internalChange: 'Parsed root tree. Subtrees modules/ and environments/ reused unchanged by hash.',
        takeaway: 'Trees store directory listings. If a directory does not change, its tree hash is identical and Git reuses it with zero duplication.',
        plumbingCommand: 'git ls-tree -r HEAD',
        xrayNote: 'Look at the diagram below: see the green REUSED badge on modules/. Only app/ needed a new tree!',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: '"Scale cache deployment"',
          treeHash: 'f419dc8 (Root)',
          treeDetail: 'app/ (7b2a901) + modules/ (reused)',
          blobHash: '7ab38f4',
          blobDetail: 'app/deployment.yaml'
        }
      }
    ]
  },

  // =========================================================================
  // LEVEL 4: BRANCHES ARE JUST MOVABLE REFERENCES
  // =========================================================================
  {
    id: 'branches-are-references',
    level: 4,
    title: 'Level 4: Branches Are Just Movable References',
    label: '04. Branches Are References',
    group: 'Navigation & References',
    path: '~/repos/infra-platform',
    branch: 'main',
    question: 'Are Git branches heavy copies of your files, and how much disk space does a branch use?',
    whatLearnerThinks: '“A branch is a duplicate copy of my whole project folder.”',
    whatWeReveal: 'A branch is literally a 41-byte text file inside .git/refs/heads/. It stores a 40-character commit hash plus a newline character. Creating a branch takes 0.001 ms and duplicates zero files.',
    takeaway: 'ELI5: A branch is NOT a copy of your project folder! A branch is literally a tiny sticky note with a commit barcode written on it. Making a new branch is just sticking a second sticky note on the exact same photo envelope! It takes 41 bytes of disk space and zero milliseconds. When you make a new commit, Git just peels the sticky note off and moves it to the new envelope.',
    caveat: 'Because branches are just 41-byte pointer files, deleting a branch (git branch -d) never deletes commits immediately. Commits remain safely in .git/objects/ until garbage collection (git gc).',
    inspector: 'Inspect .git/refs/heads/ to see that branches are ordinary 41-byte text files holding commit hashes.',
    sources: [
      'https://git-scm.com/docs/git-branch',
      'https://git-scm.com/docs/git-switch',
      'https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell'
    ],
    steps: [
      {
        label: '1. inspect .git/refs/heads/main',
        command: 'cat .git/refs/heads/main && ls -lh .git/refs/heads/main',
        output: [
          'dev@lab:~/repos/infra-platform$ cat .git/refs/heads/main',
          '4f901ab789012345678901234567890123456789',
          'dev@lab:~/repos/infra-platform$ ls -lh .git/refs/heads/main',
          '-rw-r--r-- 1 dev dev 41 Sep 20 09:00 .git/refs/heads/main',
          '# LOOK AT THE FILE SIZE: 41 BYTES!',
          '# 40 hex characters + 1 newline character (\\n).',
          '# That is literally all a branch is.'
        ],
        files: getRepoFiles({
          includeGit: true,
          gitFiles: [
            { path: '.git/refs/heads/main', name: 'refs/heads/main (41 bytes text file)', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Branch Name', value: 'main', detail: 'File inside .git/refs/heads/', badge: 'neutral' },
          { label: 'File Size', value: '41 bytes', detail: '40 char SHA + newline', badge: 'success' },
          { label: 'Target Commit', value: '4f901ab', detail: 'Points to commit envelope', badge: 'neutral' },
          { label: 'Project Files', value: 'Zero duplicated', detail: 'Shared immutable object vault', badge: 'neutral' }
        ],
        inspectorState: 'A Branch is a 41-Byte Text File',
        inspectorDetail: 'ELI5: Look at the file on disk: .git/refs/heads/main is only 41 bytes! It is just a scrap of paper that says "4f901ab". It does not contain any code.',
        inspectorOperation: 'cat .git/refs/heads/main',
        internalChange: 'Read reference file .git/refs/heads/main.',
        takeaway: 'A branch in Git is not a container or a parallel folder. It is a 41-byte text pointer to a commit.',
        plumbingCommand: 'git rev-parse refs/heads/main',
        xrayNote: 'In X-Ray mode: see the branch file in .git/refs/heads/. It is completely human-readable!',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: 'Scale cache deployment',
          treeHash: 'f419dc8',
          treeDetail: 'Shared root tree',
          blobHash: '7ab38f4',
          blobDetail: 'app/deployment.yaml'
        }
      },
      {
        label: '2. git switch -c feature/cache',
        command: 'git switch -c feature/cache && ls -la .git/refs/heads/',
        output: [
          'dev@lab:~/repos/infra-platform$ git switch -c feature/cache',
          'Switched to a new branch \'feature/cache\'',
          'dev@lab:~/repos/infra-platform$ ls -la .git/refs/heads/',
          'total 16',
          '-rw-r--r-- 1 dev dev 41 Sep 20 09:00 feature/cache',
          '-rw-r--r-- 1 dev dev 41 Sep 20 09:00 main',
          '# TWO BRANCHES NOW EXIST!',
          '# Both files contain the exact same hash: 4f901ab.',
          '# Git created 1 file of 41 bytes. Zero project files were copied!'
        ],
        files: getRepoFiles({
          includeGit: true,
          gitFiles: [
            { path: '.git/refs/heads/feature/cache', name: 'feature/cache (41 bytes) -> 4f901ab', depth: 1, highlight: true },
            { path: '.git/refs/heads/main', name: 'main (41 bytes) -> 4f901ab', depth: 1 },
            { path: '.git/HEAD', name: 'HEAD -> ref: refs/heads/feature/cache', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Active Branch', value: 'feature/cache', detail: 'HEAD points to new branch', badge: 'success' },
          { label: 'main Branch', value: '4f901ab', detail: 'Both branches point to same commit', badge: 'neutral' },
          { label: 'Disk Overhead', value: '+41 bytes', detail: 'One tiny text file added', badge: 'success' },
          { label: 'Creation Time', value: '~0.001 ms', detail: 'Instantaneous pointer creation', badge: 'neutral' }
        ],
        inspectorState: 'New Branch Created Instantly',
        inspectorDetail: 'ELI5: Git took a fresh sticky note labeled "feature/cache", wrote "4f901ab" on it, and stuck it on the exact same envelope! Both main and feature/cache point to the exact same photo.',
        inspectorOperation: 'git switch -c feature/cache',
        internalChange: 'Created .git/refs/heads/feature/cache (41 bytes). Updated .git/HEAD to point to refs/heads/feature/cache.',
        takeaway: 'Creating a branch in Git is virtually free. You can create 1,000 branches and your disk will barely notice.',
        plumbingCommand: 'git symbolic-ref HEAD',
        xrayNote: 'Turn on X-Ray: HEAD now says "ref: refs/heads/feature/cache". Both branch files point to 4f901ab.',
        internals: {
          head: 'ref: refs/heads/feature/cache',
          branchRef: 'feature/cache: 4f901ab | main: 4f901ab',
          commitHash: '4f901ab',
          commitMsg: 'Both branches share commit 4f901ab',
          treeHash: 'f419dc8',
          treeDetail: 'Zero duplicate files',
          blobHash: '7ab38f4',
          blobDetail: 'app/deployment.yaml'
        }
      },
      {
        label: '3. commit on feature/cache',
        command: 'echo "redis: enabled" >> app/deployment.yaml && git commit -am "Add redis cache config"',
        output: [
          'dev@lab:~/repos/infra-platform$ echo "redis: enabled" >> app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git commit -am "Add redis cache config"',
          '[feature/cache b14c80e] Add redis cache config',
          ' 1 file changed, 1 insertion(+)',
          'dev@lab:~/repos/infra-platform$ cat .git/refs/heads/feature/cache',
          'b14c80e789012345678901234567890123456789',
          'dev@lab:~/repos/infra-platform$ cat .git/refs/heads/main',
          '4f901ab789012345678901234567890123456789',
          '# LOOK: feature/cache moved to b14c80e! main stayed at 4f901ab!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (redis enabled)',
          gitFiles: [
            { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> b14c80e [ADVANCED]', depth: 1, highlight: true },
            { path: '.git/refs/heads/main', name: 'main -> 4f901ab [STABLE]', depth: 1 }
          ]
        }),
        shelf: [
          { label: 'feature/cache', value: 'b14c80e', detail: 'Moved to new commit', badge: 'success' },
          { label: 'main branch', value: '4f901ab', detail: 'Remains untouched at baseline', badge: 'neutral' },
          { label: 'Branch Divergence', value: '1 commit ahead', detail: 'feature/cache parent is 4f901ab', badge: 'changed' },
          { label: 'Mutation Cost', value: 'Overwrote 40 bytes', detail: 'In .git/refs/heads/feature/cache', badge: 'neutral' }
        ],
        inspectorState: 'Only the Active Branch Pointer Moved',
        inspectorDetail: 'ELI5: Git made a new photo envelope (b14c80e). Because your finger (HEAD) was on "feature/cache", Git peeled the "feature/cache" sticky note off and moved it forward! The "main" sticky note never budged.',
        inspectorOperation: 'git commit on branch',
        internalChange: 'Overwrote .git/refs/heads/feature/cache with new SHA b14c80e. main remains at 4f901ab.',
        takeaway: 'Advancing a branch does not move other branches. Git simply overwrites 40 bytes in the active ref file.',
        plumbingCommand: 'git merge-base main feature/cache',
        xrayNote: 'Check the diagram below: feature/cache is 1 commit ahead, while main stays anchored at 4f901ab.',
        internals: {
          head: 'ref: refs/heads/feature/cache',
          branchRef: 'feature/cache -> b14c80e (main at 4f901ab)',
          commitHash: 'b14c80e',
          commitMsg: '"Add redis cache config"',
          treeHash: '9a210cd',
          treeDetail: 'New tree object created',
          blobHash: 'd19028a',
          blobDetail: 'app/deployment.yaml (redis enabled)'
        }
      }
    ]
  },

  // =========================================================================
  // LEVEL 5: HEAD POINTER & DETACHED HEAD
  // =========================================================================
  {
    id: 'head-pointer-and-detached-head',
    level: 5,
    title: 'Level 5: HEAD: The "You Are Here" Pointer',
    label: '05. HEAD & Detached HEAD',
    group: 'Navigation & References',
    path: '~/repos/infra-platform',
    branch: 'feature/cache',
    question: 'What is HEAD, and why does everyone panic when it becomes "detached"?',
    whatLearnerThinks: '“HEAD is just another word for the latest commit.”',
    whatWeReveal: 'HEAD is normally a symbolic reference: a pointer to a branch pointer (ref: refs/heads/main). When you check out a raw commit SHA, HEAD detaches from the branch safety net and points directly to the commit. Commits made here risk becoming unreferenced orphans.',
    takeaway: 'ELI5: Imagine a book. A branch is a bookmark stuck between pages. HEAD is your finger: usually your finger points at a bookmark ("I am reading the main bookmark"). But if you run git checkout <hash>, your finger slides off the bookmark and points directly to a raw page! If you write notes on this page and flip somewhere else, you will lose your place because you have no bookmark! That is Detached HEAD. To fix it, simply stick a new bookmark there: git switch -c rescue-branch!',
    caveat: 'Commits created in a detached HEAD state are not deleted immediately, but if you switch away without a branch bookmark, they become unreferenced orphans. They survive in the reflog for 30–90 days before git gc purges them.',
    inspector: 'Watch HEAD transition from a symbolic reference pointing to a branch into a detached state pointing directly to a raw commit hash.',
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
          'dev@lab:~/repos/infra-platform$ cat .git/HEAD',
          'ref: refs/heads/feature/cache',
          '# NORMAL (ATTACHED) STATE:',
          '# HEAD does not store a hash! It stores "ref: refs/heads/feature/cache".',
          '# HEAD is a pointer to a pointer. You are protected by a branch safety net!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (redis enabled)',
          gitFiles: [
            { path: '.git/HEAD', name: 'HEAD -> ref: refs/heads/feature/cache', depth: 1, highlight: true },
            { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> b14c80e', depth: 1 }
          ]
        }),
        shelf: [
          { label: 'HEAD Mode', value: 'Symbolic Reference', detail: 'Points to branch, not a SHA', badge: 'success' },
          { label: 'Active Ref', value: 'refs/heads/feature/cache', detail: 'The bookmark you are on', badge: 'neutral' },
          { label: 'Commit Target', value: 'b14c80e', detail: 'Resolved via branch file', badge: 'neutral' },
          { label: 'Safety Net', value: 'Protected', detail: 'New commits advance branch', badge: 'success' }
        ],
        inspectorState: 'Symbolic HEAD (Safe on Branch)',
        inspectorDetail: 'ELI5: Your finger (HEAD) is resting safely on the "feature/cache" bookmark. Whenever you make a new commit, Git moves the bookmark along with your finger.',
        inspectorOperation: 'cat .git/HEAD',
        internalChange: 'HEAD verified as symbolic ref to refs/heads/feature/cache.',
        takeaway: 'Under normal operation, HEAD does not point to a commit. HEAD points to a branch name.',
        plumbingCommand: 'git symbolic-ref HEAD',
        xrayNote: 'Look at Column 3: The HEAD card says "ref: refs/heads/feature/cache" in cyan.',
        internals: {
          head: 'ref: refs/heads/feature/cache',
          branchRef: 'refs/heads/feature/cache -> b14c80e',
          commitHash: 'b14c80e',
          commitMsg: '"Add redis cache configuration"',
          treeHash: '9a210cd',
          treeDetail: 'Feature tree',
          blobHash: 'd19028a',
          blobDetail: 'redis enabled'
        }
      },
      {
        label: '2. git checkout 4f901ab (detach HEAD)',
        command: 'git checkout 4f901ab',
        output: [
          'dev@lab:~/repos/infra-platform$ git checkout 4f901ab',
          'Note: switching to \'4f901ab\'.',
          'You are in \'detached HEAD\' state. You can look around, make experimental',
          'changes and commit them, and you can discard any commits you make in this',
          'state without impacting any branches by switching back to a branch.',
          '',
          'HEAD is now at 4f901ab Scale cache deployment',
          'dev@lab:~/repos/infra-platform$ cat .git/HEAD',
          '4f901ab789012345678901234567890123456789',
          '# WARNING: HEAD now contains a RAW 40-CHAR SHA! The branch name is GONE.'
        ],
        files: getRepoFiles({
          includeGit: true,
          gitFiles: [
            { path: '.git/HEAD', name: 'HEAD -> 4f901ab [DETACHED HEAD!]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'HEAD State', value: 'DETACHED HEAD', detail: 'Points directly to raw SHA', badge: 'warning' },
          { label: 'Active Branch', value: 'NONE', detail: 'No branch reference attached', badge: 'warning' },
          { label: 'Commit Point', value: '4f901ab', detail: 'Looking at older commit', badge: 'neutral' },
          { label: 'Orphan Risk', value: 'High', detail: 'New commits will have no branch', badge: 'warning' }
        ],
        inspectorState: 'Detached HEAD Warning Active',
        inspectorDetail: 'ELI5: Your finger slid off the bookmark and is now pointing directly at page 4f901ab! There is no bookmark here. Git warns you so you don\'t wander off and lose your work.',
        inspectorOperation: 'git checkout 4f901ab',
        internalChange: '.git/HEAD overwritten with raw 40-character commit hash 4f901ab. Symbolic ref removed.',
        takeaway: 'Detached HEAD simply means HEAD contains a 40-character SHA instead of a branch path.',
        plumbingCommand: 'git symbolic-ref HEAD 2>&1 || echo "Detached!"',
        xrayNote: 'Column 3: The HEAD card turns red/amber with [DETACHED HEAD]. It holds a raw SHA directly.',
        internals: {
          head: '4f901ab (DETACHED HEAD!)',
          branchRef: 'No branch reference! HEAD is a raw SHA.',
          commitHash: '4f901ab',
          commitMsg: 'Read-only inspection state',
          treeHash: '7b2a901',
          treeDetail: 'Main root tree',
          blobHash: '7ab38f4',
          blobDetail: 'replicas: 3'
        }
      },
      {
        label: '3. commit in detached HEAD',
        command: 'echo "probe: true" >> app/deployment.yaml && git commit -am "Experimental probe"',
        output: [
          'dev@lab:~/repos/infra-platform$ echo "probe: true" >> app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git commit -am "Experimental probe"',
          '[detached HEAD c5019a2] Experimental probe',
          ' 1 file changed, 1 insertion(+)',
          'dev@lab:~/repos/infra-platform$ cat .git/HEAD',
          'c5019a2e89012345678901234567890123456789',
          '# COMMIT MINTED: c5019a2 is floating in space!',
          '# No branch pointer references it. If you switch away, it becomes an orphan!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (probe: true)',
          gitFiles: [
            { path: '.git/objects/c5', name: 'objects/c5/019a2... [Orphan Commit c5019a2]', depth: 1, highlight: true },
            { path: '.git/HEAD', name: 'HEAD -> c5019a2 [DETACHED]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'HEAD Position', value: 'c5019a2', detail: 'New detached commit', badge: 'warning' },
          { label: 'Branch Ref', value: 'NONE', detail: 'Unreferenced in refs/heads/', badge: 'warning' },
          { label: 'Commit Status', value: 'Floating Orphan', detail: 'No branch pointer attached', badge: 'warning' },
          { label: 'Next Action', value: 'Must attach branch', detail: 'git switch -c to save it', badge: 'changed' }
        ],
        inspectorState: 'Floating Orphan Commit Created',
        inspectorDetail: 'ELI5: You wrote notes on a loose piece of paper (c5019a2). It is in the room, but there is no bookmark holding it in the book. If you walk out the door, the wind might blow it away!',
        inspectorOperation: 'commit in detached state',
        internalChange: 'Minted commit c5019a2 with parent 4f901ab. HEAD points to c5019a2. No file updated in .git/refs/heads/.',
        takeaway: 'Commits made in detached HEAD are completely valid, but they have no named reference keeping them alive.',
        plumbingCommand: 'git fsck --lost-found',
        xrayNote: 'Look at the diagram below: commit c5019a2 is floating in space without any branch arrow pointing to it!',
        internals: {
          head: 'c5019a2 (DETACHED HEAD!)',
          branchRef: 'No branch pointer! Risk of becoming orphan.',
          commitHash: 'c5019a2',
          commitMsg: '"Experimental probe" (unbranched)',
          treeHash: '8b190ac',
          treeDetail: 'Floating commit tree',
          blobHash: 'e1401bc',
          blobDetail: 'probe: true'
        }
      },
      {
        label: '4. rescue with git switch -c',
        command: 'git switch -c fix/cache-probe && cat .git/HEAD',
        output: [
          'dev@lab:~/repos/infra-platform$ git switch -c fix/cache-probe',
          'Switched to a new branch \'fix/cache-probe\'',
          'dev@lab:~/repos/infra-platform$ cat .git/HEAD',
          'ref: refs/heads/fix/cache-probe',
          'dev@lab:~/repos/infra-platform$ cat .git/refs/heads/fix/cache-probe',
          'c5019a2e89012345678901234567890123456789',
          '# RESCUED! What Git did:',
          '# 1. Created .git/refs/heads/fix/cache-probe pointing to c5019a2',
          '# 2. Turned HEAD back into a symbolic ref!',
          '# The floating commit is now permanently anchored in history.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (probe: true)',
          gitFiles: [
            { path: '.git/refs/heads/fix/cache-probe', name: 'fix/cache-probe -> c5019a2 [ATTACHED]', depth: 1, highlight: true },
            { path: '.git/HEAD', name: 'HEAD -> ref: refs/heads/fix/cache-probe', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'HEAD State', value: 'Symbolic Ref', detail: 'Anchored to fix/cache-probe', badge: 'success' },
          { label: 'Rescued Commit', value: 'c5019a2 saved', detail: 'Named branch ref attached', badge: 'success' },
          { label: 'Branch Created', value: 'fix/cache-probe', detail: '41-byte ref in refs/heads/', badge: 'neutral' },
          { label: 'Orphan Status', value: 'Resolved', detail: 'Protected from garbage collection', badge: 'neutral' }
        ],
        inspectorState: 'Orphan Rescued with New Branch',
        inspectorDetail: 'ELI5: Phew! You slapped a new bookmark ("fix/cache-probe") onto page c5019a2, and put your finger (HEAD) back on that bookmark. Your work is safe forever!',
        inspectorOperation: 'git switch -c fix/cache-probe',
        internalChange: 'Created .git/refs/heads/fix/cache-probe pointing to c5019a2. HEAD restored to symbolic reference.',
        takeaway: 'Never panic in detached HEAD. Running git switch -c <name> immediately turns your floating commit into a permanent branch.',
        plumbingCommand: 'git symbolic-ref HEAD',
        xrayNote: 'Look at Column 3: HEAD is cyan again, safely referencing refs/heads/fix/cache-probe.',
        internals: {
          head: 'ref: refs/heads/fix/cache-probe',
          branchRef: 'refs/heads/fix/cache-probe -> c5019a2',
          commitHash: 'c5019a2',
          commitMsg: '"Experimental probe" (safely anchored)',
          treeHash: '8b190ac',
          treeDetail: 'Branch ref successfully attached',
          blobHash: 'e1401bc',
          blobDetail: 'probe: true'
        }
      }
    ]
  },

  // =========================================================================
  // LEVEL 6: CHECKOUT / SWITCH: REBUILDING THE WORKSPACE
  // =========================================================================
  {
    id: 'checkout-switch-rebuilding-workspace',
    level: 6,
    title: 'Level 6: Checkout / Switch: Rebuilding the Workspace',
    label: '06. Checkout / Switch Rebuild',
    group: 'Navigation & References',
    path: '~/repos/infra-platform',
    branch: 'feature/cache',
    question: 'When you run git switch, how does Git replace all the files on your screen in milliseconds?',
    whatLearnerThinks: '“Git downloads or re-copies all the files from somewhere.”',
    whatWeReveal: 'Switching branches executes three atomic steps: 1. Updates the HEAD ref pointer, 2. Swaps the binary index from the target commit\'s Root Tree, 3. Materializes and dematerializes files on your physical disk. A dirty file guard blocks the switch if uncommitted changes would be overwritten.',
    takeaway: 'ELI5: Switching branches is like a super-fast theater stage crew swapping props between scenes: 1. They move the stage sign (HEAD), 2. They look at the prop inventory for the new scene (Index), 3. They whisk away props that don\'t belong on stage and set out the new ones. If you have messy uncommitted notes on a prop, the stage crew shouts: "Wait! Commit or stash your changes first so we don\'t crush them!"',
    caveat: 'Git refuses to switch branches if a file modified in your working tree differs from the target branch. It aborts immediately to protect you from silent data loss.',
    inspector: 'Observe the 3-step atomic workspace rebuild during branch switching and watch Git\'s dirty file safety guard in action.',
    sources: [
      'https://git-scm.com/docs/git-switch',
      'https://git-scm.com/docs/git-read-tree',
      'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging'
    ],
    steps: [
      {
        label: '1. inspect feature branch on disk',
        command: 'ls -la app/ && git status -s',
        output: [
          'dev@lab:~/repos/infra-platform$ ls -la app/',
          'total 16',
          '-rw-r--r-- 1 dev dev 142 Sep 20 09:00 deployment.yaml',
          '-rw-r--r-- 1 dev dev 210 Sep 20 09:00 redis.yaml',
          'dev@lab:~/repos/infra-platform$ git status -s',
          '# Clean state on feature/cache. Notice redis.yaml exists here.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (replicas: 3)',
          hasRedis: true,
          redisName: 'redis.yaml (feature config)'
        }),
        shelf: [
          { label: 'Current Branch', value: 'feature/cache', detail: 'Target commit b14c80e', badge: 'neutral' },
          { label: 'Working Tree Files', value: 'deployment + redis', detail: 'Both files on physical disk', badge: 'neutral' },
          { label: 'Staging Index', value: 'Tree 9a210cd', detail: 'Indexes both app files', badge: 'neutral' },
          { label: 'Main Comparison', value: 'main lacks redis.yaml', detail: 'main has replicas: 2', badge: 'changed' }
        ],
        inspectorState: 'Feature Scene Active on Stage',
        inspectorDetail: 'ELI5: On this branch, your stage has two props: deployment.yaml and redis.yaml. Now let\'s watch what happens when we tell the stage crew to switch back to main.',
        inspectorOperation: 'inspect feature/cache state',
        internalChange: 'Reading active working tree files. feature/cache tree loaded in index.',
        takeaway: 'Your disk files reflect the current commit pointed to by HEAD.',
        plumbingCommand: 'git ls-tree HEAD app/',
        xrayNote: 'Column 1: See both deployment.yaml and redis.yaml listed under app/.',
        internals: {
          head: 'ref: refs/heads/feature/cache',
          branchRef: 'refs/heads/feature/cache -> b14c80e',
          commitHash: 'b14c80e',
          commitMsg: 'Feature branch with Redis config',
          treeHash: '9a210cd',
          treeDetail: 'Redis cache tree on disk',
          blobHash: 'd19028a',
          blobDetail: 'active in working tree'
        }
      },
      {
        label: '2. git switch main (3-step rebuild)',
        command: 'git switch main && ls -la app/',
        output: [
          'dev@lab:~/repos/infra-platform$ git switch main',
          'Switched to branch \'main\'',
          'Your branch is up to date with \'origin/main\'.',
          'dev@lab:~/repos/infra-platform$ ls -la app/',
          'total 12',
          '-rw-r--r-- 1 dev dev 120 Sep 20 09:00 deployment.yaml',
          '# WHAT JUST HAPPENED IN 3 ATOMIC STEPS:',
          '# 1. HEAD moved from refs/heads/feature/cache to refs/heads/main',
          '# 2. Binary index reloaded from main\'s Root Tree (7b2a901)',
          '# 3. Disk updated: deployment.yaml updated, redis.yaml cleanly DEMATERIALIZED!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (replicas: 2)',
          hasRedis: false
        }),
        shelf: [
          { label: 'Step 1: HEAD Ref', value: 'refs/heads/main', detail: 'Finger moved to main bookmark', badge: 'success' },
          { label: 'Step 2: Index Cache', value: 'Reloaded from Tree', detail: 'Binary cache rebuilt from C1', badge: 'success' },
          { label: 'Step 3: Disk Tree', value: 'redis.yaml removed', detail: 'deployment.yaml restored to C1', badge: 'changed' },
          { label: 'Total Duration', value: '< 2 ms', detail: 'O(changed files) operations', badge: 'neutral' }
        ],
        inspectorState: 'Workspace Atomically Rebuilt for main',
        inspectorDetail: 'ELI5: Presto! In less than 2 milliseconds, the stage crew updated the sign, wiped the inventory, swapped deployment.yaml, and whisked redis.yaml away. Your screen matches main perfectly.',
        inspectorOperation: 'git switch main',
        internalChange: 'HEAD moved to main. Index reloaded from tree 7b2a901. File app/redis.yaml unlinked from disk.',
        takeaway: 'Switching branches does not rescan your whole project; Git only touches the specific files that differ between the two trees.',
        plumbingCommand: 'git read-tree -u -m HEAD',
        xrayNote: 'Notice Column 1: redis.yaml vanished from app/. It was cleanly unlinked from disk without touching your git history.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: 'Switched to main',
          treeHash: '7b2a901',
          treeDetail: 'Rebuilt index & disk in 3 atomic steps',
          blobHash: '7ab38f4',
          blobDetail: 'disk overwritten safely'
        }
      },
      {
        label: '3. dirty file guard blocks switch',
        command: 'echo "dirty unstaged work" >> app/deployment.yaml && git switch feature/cache',
        output: [
          'dev@lab:~/repos/infra-platform$ echo "dirty unstaged work" >> app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git switch feature/cache',
          'error: Your local changes to the following files would be overwritten by checkout:',
          '  app/deployment.yaml',
          'Please commit your changes or stash them before you switch branches.',
          'Aborting',
          '# SAFETY GUARD TRIGGERED! Git refused to overwrite your unsaved desk work!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'M',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml [DIRTY: BLOCKS SWITCH]'
        }),
        shelf: [
          { label: 'Dirty Guard', value: 'ABORTED (Safe)', detail: 'Prevented silent data destruction', badge: 'warning' },
          { label: 'Conflicting File', value: 'app/deployment.yaml', detail: 'Differs between main & feature', badge: 'warning' },
          { label: 'HEAD Position', value: 'Stayed on main', detail: 'Switch aborted atomically', badge: 'neutral' },
          { label: 'Recommended Fix', value: 'git stash', detail: 'Or git commit -am "wip"', badge: 'changed' }
        ],
        inspectorState: 'Git Guard Blocks Data Loss',
        inspectorDetail: 'ELI5: You scribbled on deployment.yaml without saving it. If Git switched scenes right now, your scribbles would be wiped out! Git stops everything and says: "I refuse to destroy your work. Stash it or commit it first!"',
        inspectorOperation: 'git switch feature/cache (blocked)',
        internalChange: 'Three-way merge check failed. Checkout aborted. Working tree preserved untouched.',
        takeaway: 'Git has built-in seatbelts: it will never let checkout or switch overwrite uncommitted work.',
        plumbingCommand: 'git status',
        xrayNote: 'Column 1: deployment.yaml glows red with status M. Git protects this file from being crushed.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: 'Switch blocked: uncommitted edits!',
          treeHash: '7b2a901',
          treeDetail: 'Dirty working tree conflict',
          blobHash: '7ab38f4',
          blobDetail: 'Preventing silent data loss'
        }
      },
      {
        label: '4. git stash & clean switch',
        command: 'git stash && git switch feature/cache',
        output: [
          'dev@lab:~/repos/infra-platform$ git stash',
          'Saved working directory and index state WIP on main: 4f901ab Scale cache deployment',
          'dev@lab:~/repos/infra-platform$ git switch feature/cache',
          'Switched to branch \'feature/cache\'',
          '# CLEAN SWITCH SUCCEEDED!',
          '# git stash wrapped dirty work into a temporary commit in .git/refs/stash.',
          '# Working tree was cleaned, allowing Git to materialize feature/cache safely.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (redis enabled)',
          hasRedis: true,
          redisName: 'redis.yaml',
          gitFiles: [
            { path: '.git/refs/stash', name: 'refs/stash [Temporary Stash Envelope]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Stash Location', value: '.git/refs/stash', detail: 'Special stash commit object', badge: 'success' },
          { label: 'Active Branch', value: 'feature/cache', detail: 'Switched cleanly', badge: 'success' },
          { label: 'Restoration', value: 'git stash pop', detail: 'Restores dirty work when back on main', badge: 'neutral' },
          { label: 'Working Tree', value: 'Clean feature state', detail: 'redis.yaml rematerialized', badge: 'neutral' }
        ],
        inspectorState: 'Work Stashed & Switch Completed',
        inspectorDetail: 'ELI5: You tucked your scribbles into a temporary drawer (git stash). With your desk clean, the stage crew happily switched to feature/cache. When you go back to main, just run git stash pop to get your scribbles back!',
        inspectorOperation: 'git stash && git switch feature/cache',
        internalChange: 'Stash commit created in .git/refs/stash. Working tree cleaned. Switched to feature/cache.',
        takeaway: 'git stash is a temporary drawer: it lets you clear your desk instantly so you can switch scenes without losing anything.',
        plumbingCommand: 'git stash list',
        xrayNote: 'Turn on X-Ray: See refs/stash appear in .git/. It stores your paused work as a commit envelope!',
        internals: {
          head: 'ref: refs/heads/feature/cache',
          branchRef: 'refs/heads/feature/cache -> b14c80e',
          commitHash: 'b14c80e',
          commitMsg: 'Stashed safely; clean switch allowed',
          treeHash: '9a210cd',
          treeDetail: 'Stash object stored in .git/refs/stash',
          blobHash: 'd19028a',
          blobDetail: 'redis enabled'
        }
      }
    ]
  },

  // =========================================================================
  // LEVEL 7: MERGE VS. REBASE: GRAPH SURGERY
  // =========================================================================
  {
    id: 'merge-vs-rebase-graph-surgery',
    level: 7,
    title: 'Level 7: Merge vs. Rebase: Graph Surgery',
    label: '07. Merge vs Rebase',
    group: 'Branch Surgery & Recovery',
    path: '~/repos/infra-platform',
    branch: 'main',
    question: 'What is the real physical difference between git merge and git rebase?',
    whatLearnerThinks: '“Merge and rebase are just stylistic choices for making the git log look pretty.”',
    whatWeReveal: 'Merge creates a 3-way commit with TWO parents, preserving historical divergence. Rebase copies and replays commits onto a new base, minting brand-new commit hashes and discarding the originals.',
    takeaway: 'ELI5: Merge is like tying two trails together with a rope: it creates a special 2-handled basket (a merge commit with two parents). It keeps the true history of where both trails walked. Rebase is like unscrewing your LEGO bricks from an old tower and rebuilding them on top of the newest tower. Every LEGO brick gets a brand new serial number (commit hash)! That is why you NEVER rebase a public branch that other people are building on!',
    caveat: 'Rebase rewrites commit history. Because commit hashes include their parent hash, changing the base creates completely new commits with new SHA hashes. Rebasing shared public branches breaks teammates\' repositories.',
    inspector: 'Compare the two fundamental branching strategies: non-destructive two-parent merge vs history-rewriting rebase surgery.',
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
          'dev@lab:~/repos/infra-platform$ git log --graph --oneline --all',
          '* b14c80e (feature/cache) Add redis cache configuration',
          '| * e78b21a (HEAD -> main) Add IAM production roles',
          '|/  ',
          '* c3904e1 Initial infrastructure definition',
          '# DIVERGENCE DETECTED:',
          '# Common ancestor is c3904e1.',
          '# main moved to e78b21a. feature/cache moved to b14c80e.',
          '# Two independent histories exist.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml',
          gitFiles: [
            { path: '.git/refs/heads/main', name: 'main -> e78b21a (C2)', depth: 1 },
            { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> b14c80e (C3)', depth: 1 }
          ]
        }),
        shelf: [
          { label: 'Common Ancestor', value: 'c3904e1 (BASE)', detail: 'Where branches split', badge: 'neutral' },
          { label: 'main Tip (OURS)', value: 'e78b21a', detail: 'Added IAM roles', badge: 'neutral' },
          { label: 'feature Tip (THEIRS)', value: 'b14c80e', detail: 'Added redis config', badge: 'neutral' },
          { label: 'Graph Topology', value: 'Forked (Y-shape)', detail: 'Requires resolution', badge: 'warning' }
        ],
        inspectorState: 'Forked Branch Topology',
        inspectorDetail: 'ELI5: Two teammates walked down different paths from point c3904e1. One added IAM roles on main; the other added Redis cache on feature. Now we need to bring their work together.',
        inspectorOperation: 'git log --graph',
        internalChange: 'Reading commit graph ancestry. Common ancestor identified via merge-base.',
        takeaway: 'Before merging or rebasing, Git always finds the Common Ancestor (the fork point) to figure out what changed on each side.',
        plumbingCommand: 'git merge-base main feature/cache',
        xrayNote: 'Look at the diagram below: see the Y-shaped fork splitting off from c3904e1.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'main -> e78b21a | feature -> b14c80e',
          commitHash: 'e78b21a',
          commitMsg: 'Common ancestor at c3904e1',
          treeHash: '3d19ac0',
          treeDetail: 'Diverged histories',
          blobHash: '7ab38f4',
          blobDetail: 'Independent branch snapshots'
        }
      },
      {
        label: '2. git merge (two-parent commit M1)',
        command: 'git merge feature/cache -m "Merge branch feature/cache" && git cat-file -p HEAD',
        output: [
          'dev@lab:~/repos/infra-platform$ git merge feature/cache -m "Merge branch feature/cache"',
          'Merge made by the \'ort\' strategy.',
          ' app/deployment.yaml | 1 +',
          ' 1 file changed, 1 insertion(+)',
          'dev@lab:~/repos/infra-platform$ git cat-file -p HEAD',
          'tree 9d201ab89012345678901234567890123456789a',
          'parent e78b21a89012345678901234567890123456789a',
          'parent b14c80e89012345678901234567890123456789a',
          'author SRE Engineer <dev@infra.local> 1726750000 +0000',
          '',
          'Merge branch feature/cache',
          '# NOTICE: TWO PARENTS! Merge commit ties both histories together.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (merged)',
          hasRedis: true,
          redisName: 'redis.yaml (merged)',
          gitFiles: [
            { path: '.git/objects/8c', name: 'objects/8c/1490e... [Merge Commit (2 Parents)]', depth: 1, highlight: true },
            { path: '.git/refs/heads/main', name: 'main -> 8c1490e [MERGED]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Merge Commit', value: '8c1490e', detail: 'New commit created', badge: 'success' },
          { label: 'Parent 1 (main)', value: 'e78b21a', detail: 'First parent pointer', badge: 'neutral' },
          { label: 'Parent 2 (feature)', value: 'b14c80e', detail: 'Second parent pointer', badge: 'neutral' },
          { label: 'History Preserved', value: '100% Intact', detail: 'Non-destructive true history', badge: 'success' }
        ],
        inspectorState: 'Two-Parent Merge Commit Created',
        inspectorDetail: 'ELI5: Merge built a bridge connecting the two trails! The new commit envelope #8c1490e literally has TWO parents written inside: parent 1 (main) and parent 2 (feature). The true history is completely preserved.',
        inspectorOperation: 'git merge feature/cache',
        internalChange: 'Created merge commit 8c1490e with two parent pointers: e78b21a and b14c80e. main advanced to 8c1490e.',
        takeaway: 'A merge commit is special because it has two parents. It never erases or rewrites past commits.',
        plumbingCommand: 'git rev-parse HEAD^1 && git rev-parse HEAD^2',
        xrayNote: 'Look at the diagram below: see the two arrows converging into commit 8c1490e. That is a merge knot!',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main -> 8c1490e',
          commitHash: '8c1490e (MERGE COMMIT)',
          commitMsg: '2 parents: e78b21a & b14c80e',
          treeHash: 'f419dc8',
          treeDetail: '3-way merge snapshot',
          blobHash: 'b14c80e',
          blobDetail: 'Merged replica and port config'
        }
      },
      {
        label: '3. git rebase (history rewritten: C3 -> C3\')',
        command: 'git switch feature/cache && git rebase main && git log --oneline -n 3',
        output: [
          'dev@lab:~/repos/infra-platform$ git switch feature/cache && git rebase main',
          'Successfully rebased and updated refs/heads/feature/cache.',
          'dev@lab:~/repos/infra-platform$ git log --oneline -n 3',
          'a92d18f (HEAD -> feature/cache) Add redis cache configuration',
          'e78b21a (main) Add IAM production roles',
          'c3904e1 Initial infrastructure definition',
          '# LOOK AT THE HASH: a92d18f is a BRAND NEW COMMIT!',
          '# Original commit b14c80e was abandoned.',
          '# Rebase lifted the commit, replayed it atop main, and minted a new SHA.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (rebased)',
          hasRedis: true,
          redisName: 'redis.yaml',
          gitFiles: [
            { path: '.git/objects/a9', name: 'objects/a9/2d18f... [Brand New Rebased Commit]', depth: 1, highlight: true },
            { path: '.git/refs/heads/feature/cache', name: 'feature/cache -> a92d18f [REWRITTEN]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Rebased Commit', value: 'a92d18f (NEW)', detail: 'Brand new clone commit minted', badge: 'changed' },
          { label: 'Original Commit', value: 'b14c80e (Orphaned)', detail: 'Left behind in object store', badge: 'warning' },
          { label: 'History Shape', value: 'Completely Linear', detail: 'Zero merge commits created', badge: 'success' },
          { label: 'Public Rule', value: 'Never rebase public', detail: 'Rewrites hashes teammates rely on', badge: 'warning' }
        ],
        inspectorState: 'History Rewritten via Rebase Surgery',
        inspectorDetail: 'ELI5: Rebase lifted your Redis LEGO brick off the old table, walked over to the tip of main, and stuck it on top. Because its parent is now e78b21a, its barcode changed from b14c80e to a92d18f! The old brick is left behind as trash.',
        inspectorOperation: 'git rebase main',
        internalChange: 'Replayed commit atop e78b21a. Minted new commit a92d18f. Original commit b14c80e unreferenced.',
        takeaway: 'Rebase does not move commits; rebase makes new copies of commits with new parents, abandoning the originals.',
        plumbingCommand: 'git reflog feature/cache',
        xrayNote: 'In X-Ray: See the brand-new hash a92d18f. The old commit b14c80e still exists in .git/objects/ until gc!',
        internals: {
          head: 'ref: refs/heads/feature/cache',
          branchRef: 'feature/cache -> a92d18f (rebased)',
          commitHash: 'a92d18f (BRAND NEW HASH)',
          commitMsg: 'Replayed commit atop main',
          treeHash: 'f419dc8',
          treeDetail: 'Linearized Merkle tree',
          blobHash: 'b14c80e',
          blobDetail: 'Original b14c80e orphaned!'
        }
      }
    ]
  },

  // =========================================================================
  // LEVEL 8: RESET, RESTORE, AND REVERT
  // =========================================================================
  {
    id: 'reset-restore-revert',
    level: 8,
    title: 'Level 8: Reset, Restore, and Revert: The Three-State Machine',
    label: '08. Reset, Restore, Revert',
    group: 'Branch Surgery & Recovery',
    path: '~/repos/infra-platform',
    branch: 'main',
    question: 'What is the physical difference between reset --soft, --mixed, and --hard?',
    whatLearnerThinks: '“git reset is terrifying and deletes random files without warning.”',
    whatWeReveal: 'The three reset modes target the three physical boundaries of Git: --soft moves HEAD only (keeps index and disk); --mixed moves HEAD and resets index (keeps disk); --hard moves HEAD, resets index, and destroys disk changes.',
    takeaway: 'ELI5: Think of Git as having 3 rooms: Room 1 is your Desk (Working Tree), Room 2 is the Conveyor Belt (Index), and Room 3 is the Vault (Commit History). git reset is simply an undo lever with 3 power settings: 1. --soft: Opens the vault and pulls the envelope back, but leaves all papers sitting on the conveyor belt ready to re-send. 2. --mixed: Pulls the envelope back and clears the conveyor belt, but leaves your notes on your desk. 3. --hard: THE SLEDGEHAMMER. Resets the vault, clears the conveyor belt, and wipes your desk clean back to the old photo!',
    caveat: 'git reset --hard permanently destroys uncommitted changes in your working tree. Because uncommitted changes were never hashed into .git/objects/, not even git reflog can recover them!',
    inspector: 'Test the 3 settings of git reset and see exactly how each flag selectively affects HEAD, the Index, and the Working Tree.',
    sources: [
      'https://git-scm.com/docs/git-reset',
      'https://git-scm.com/docs/git-restore',
      'https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified'
    ],
    steps: [
      {
        label: '1. baseline: clean state at commit C2',
        command: 'git status && git log -n 2 --oneline',
        output: [
          'dev@lab:~/repos/infra-platform$ git status',
          'On branch main',
          'nothing to commit, working tree clean',
          'dev@lab:~/repos/infra-platform$ git log -n 2 --oneline',
          '4f901ab (HEAD -> main) Scale cache deployment',
          'e78b21a Add IAM production roles',
          '# All 3 zones (HEAD, Index, Working Tree) are aligned at 4f901ab.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (replicas: 4)'
        }),
        shelf: [
          { label: 'HEAD Pointer', value: '4f901ab (C2)', detail: 'Top commit', badge: 'neutral' },
          { label: 'Staging Index', value: 'Matches 4f901ab', detail: 'Clean staging area', badge: 'neutral' },
          { label: 'Working Tree', value: 'Matches 4f901ab', detail: 'Clean desk', badge: 'neutral' },
          { label: 'Target Undo', value: 'Rewind to e78b21a', detail: 'Undo commit 4f901ab', badge: 'changed' }
        ],
        inspectorState: 'Clean Baseline (3 Zones Aligned)',
        inspectorDetail: 'ELI5: All three rooms are in perfect sync: your desk, the conveyor belt, and the photo vault all match commit 4f901ab. Now let\'s test the 3 undo settings.',
        inspectorOperation: 'git status',
        internalChange: 'All three boundaries aligned at commit 4f901ab.',
        takeaway: 'Before resetting, check which commit you want to rewind to using git log.',
        plumbingCommand: 'git rev-parse HEAD~1',
        xrayNote: 'All 3 stages on the ledger shelf below are green and clean.',
        internals: {
          head: 'ref: refs/heads/main -> 4f901ab',
          branchRef: 'HEAD, Index, and Disk aligned at 4f901ab',
          commitHash: '4f901ab',
          commitMsg: '"Scale cache deployment"',
          treeHash: '7b2a901',
          treeDetail: 'Baseline clean state',
          blobHash: '7ab38f4',
          blobDetail: 'replicas: 4'
        }
      },
      {
        label: '2. git reset --soft HEAD~1 (move REF only)',
        command: 'git reset --soft HEAD~1 && git status -s',
        output: [
          'dev@lab:~/repos/infra-platform$ git reset --soft HEAD~1',
          'dev@lab:~/repos/infra-platform$ git status -s',
          'M  app/deployment.yaml',
          '# NOTICE: GREEN "M" IN FIRST COLUMN!',
          '# HEAD moved back to e78b21a.',
          '# BUT the Index and Working Tree were NOT touched!',
          '# Your changes are still neatly staged on the conveyor belt, ready to commit again!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'A',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml [STAGED in index]'
        }),
        shelf: [
          { label: 'HEAD Pointer', value: 'e78b21a (REWOUND)', detail: 'Moved back 1 commit', badge: 'changed' },
          { label: 'Staging Index', value: 'PRESERVED (Staged)', detail: 'Changes still in index (green M)', badge: 'success' },
          { label: 'Working Tree', value: 'PRESERVED (Desk)', detail: 'Files on disk untouched', badge: 'success' },
          { label: 'Best Use Case', value: 'Fix commit message', detail: 'Or combine multiple commits', badge: 'neutral' }
        ],
        inspectorState: 'Soft Reset: Only the Bookmark Moved',
        inspectorDetail: 'ELI5: --soft is the gentlest undo. Git peeled the bookmark back to the previous envelope, but left all your papers sitting on the conveyor belt ready to go. Zero work was lost!',
        inspectorOperation: 'git reset --soft HEAD~1',
        internalChange: '.git/refs/heads/main updated to e78b21a. Index and working tree completely unchanged.',
        takeaway: 'git reset --soft is the best way to undo a commit when you just want to edit the commit message or add another file.',
        plumbingCommand: 'git update-ref refs/heads/main HEAD~1',
        xrayNote: 'Notice in Column 1: deployment.yaml has green badge A (staged). Index and desk are 100% safe.',
        internals: {
          head: 'ref: refs/heads/main -> e78b21a',
          branchRef: 'HEAD moved back. Index & Disk untouched!',
          commitHash: 'e78b21a',
          commitMsg: '4f901ab changes now staged in index',
          treeHash: '7b2a901 (Index still at 4f901ab)',
          treeDetail: 'Zero work lost',
          blobHash: '7ab38f4',
          blobDetail: 'Safe undo of commit envelope'
        }
      },
      {
        label: '3. git reset --mixed HEAD (move REF + reset INDEX)',
        command: 'git reset HEAD && git status -s',
        output: [
          'dev@lab:~/repos/infra-platform$ git reset HEAD',
          'Unstaged changes after reset:',
          'M\tapp/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git status -s',
          ' M app/deployment.yaml',
          '# NOTICE: RED "M" IN SECOND COLUMN!',
          '# HEAD stayed at e78b21a. Index was RESET to match HEAD.',
          '# BUT your working tree desk was NOT touched! Edits are safe on disk as unstaged.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'M',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml [UNSTAGED on desk]'
        }),
        shelf: [
          { label: 'HEAD Pointer', value: 'e78b21a', detail: 'Anchored at earlier commit', badge: 'neutral' },
          { label: 'Staging Index', value: 'RESET to e78b21a', detail: 'Conveyor belt cleared', badge: 'changed' },
          { label: 'Working Tree', value: 'PRESERVED (Desk)', detail: 'Changes still safe on disk (red M)', badge: 'success' },
          { label: 'Default Mode', value: 'git reset (mixed)', detail: 'Safe default: never deletes disk files', badge: 'neutral' }
        ],
        inspectorState: 'Mixed Reset: Index Cleared, Desk Safe',
        inspectorDetail: 'ELI5: --mixed is Git\'s default. It takes the papers off the conveyor belt and puts them back on your desk. Your code is still completely safe on your hard drive, just marked unstaged.',
        inspectorOperation: 'git reset (mixed)',
        internalChange: 'Index reset from tree e78b21a. Working tree files preserved on disk.',
        takeaway: 'git reset (without flags) is --mixed. It un-stages files without deleting a single line of your code.',
        plumbingCommand: 'git ls-files --stage app/deployment.yaml',
        xrayNote: 'Column 1: deployment.yaml turns amber (M). The file is unstaged, but your disk edits are 100% intact.',
        internals: {
          head: 'ref: refs/heads/main -> e78b21a',
          branchRef: 'HEAD and Index moved back. Disk untouched!',
          commitHash: 'e78b21a',
          commitMsg: '4f901ab changes now unstaged on disk',
          treeHash: '3d19ac0 (Index reset to e78b21a)',
          treeDetail: 'Working tree retains edits',
          blobHash: '7ab38f4 (on disk)',
          blobDetail: 'Default git reset mode'
        }
      },
      {
        label: '4. git reset --hard (move REF + INDEX + WORKTREE)',
        command: 'git reset --hard HEAD && git status',
        output: [
          'dev@lab:~/repos/infra-platform$ git reset --hard HEAD',
          'HEAD is now at e78b21a Add IAM production roles',
          'dev@lab:~/repos/infra-platform$ git status',
          'On branch main',
          'nothing to commit, working tree clean',
          '# THE SLEDGEHAMMER EXECUTED:',
          '# 1. HEAD moved back',
          '# 2. Index reset',
          '# 3. WORKING TREE FORCIBLY OVERWRITTEN ON DISK!',
          '# Uncommitted changes are permanently destroyed!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (reverted to e78b21a)'
        }),
        shelf: [
          { label: 'HEAD Pointer', value: 'e78b21a', detail: 'Rewound', badge: 'changed' },
          { label: 'Staging Index', value: 'RESET to e78b21a', detail: 'Matches rewound commit', badge: 'changed' },
          { label: 'Working Tree', value: 'FORCIBLY OVERWRITTEN', detail: 'Disk changes destroyed', badge: 'warning' },
          { label: 'Danger Level', value: 'DESTRUCTIVE', detail: 'Cannot recover uncommitted edits', badge: 'warning' }
        ],
        inspectorState: 'Hard Reset: Sledgehammer Destroyed Disk Edits',
        inspectorDetail: 'ELI5: CRASH! --hard reset all three rooms: the vault, the conveyor belt, AND your desk! Any uncommitted scribbles on your desk were thrown into the incinerator. Use with extreme caution!',
        inspectorOperation: 'git reset --hard HEAD',
        internalChange: 'HEAD, Index, and Working tree forcibly reset to tree e78b21a. Uncommitted disk diffs discarded.',
        takeaway: 'git reset --hard is the ONLY common git command that permanently destroys work. Double-check before running it!',
        plumbingCommand: 'git reflog (to rescue the commit)',
        xrayNote: 'Look at the shelf: Working Tree was wiped clean. Fortunately, the old commit 4f901ab still lives in the reflog!',
        internals: {
          head: 'ref: refs/heads/main -> e78b21a',
          branchRef: 'HEAD, Index, and Working Tree FORCIBLY OVERWRITTEN!',
          commitHash: 'e78b21a',
          commitMsg: 'Destructive reset executed',
          treeHash: '3d19ac0',
          treeDetail: 'Uncommitted working tree changes destroyed',
          blobHash: 'c3904e1 bytes',
          blobDetail: 'Requires reflog rescue to recover'
        }
      }
    ]
  },

  // =========================================================================
  // LEVEL 9: MERGE CONFLICTS & THE THREE-STAGE INDEX
  // =========================================================================
  {
    id: 'merge-conflicts-three-stage-index',
    level: 9,
    title: 'Level 9: Merge Conflicts & The Three-Stage Index',
    label: '09. 3-Stage Merge Conflicts',
    group: 'Branch Surgery & Recovery',
    path: '~/repos/infra-platform',
    branch: 'main',
    question: 'What actually happens inside Git during a merge conflict, and what is the 3-stage index?',
    whatLearnerThinks: '“Git got confused and ruined my file with weird <<<<<<< arrows.”',
    whatWeReveal: 'During a conflict, Git\'s index temporarily expands into three concurrent slots: Stage 1 = Common Ancestor (BASE), Stage 2 = Target Branch (OURS), Stage 3 = Merging Branch (THEIRS). Running git add collapses all three back into Stage 0.',
    takeaway: 'ELI5: Imagine two chefs editing line 5 of a recipe at the same time: one wrote "add chocolate", the other wrote "add cheese". Git refuses to guess who is right! Behind the scenes, Git opens 3 separate trays on its conveyor belt: Tray 1 holds the original recipe (BASE), Tray 2 holds your version (OURS), and Tray 3 holds their version (THEIRS). Then Git writes both onto your desk separated by <<<<<<< and >>>>>>>. Once you pick the winner and run git add, Git throws away the 3 trays and puts the clean recipe back in Tray 0!',
    caveat: 'A merge conflict stops Git mid-operation. You cannot commit until every conflicting file has been resolved and staged with git add.',
    inspector: 'Inspect Git\'s internal 3-stage index using git ls-files --stage to see BASE, OURS, and THEIRS blob hashes simultaneously.',
    sources: [
      'https://git-scm.com/docs/git-merge#_how_conflicts_are_presented',
      'https://git-scm.com/docs/git-ls-files',
      'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#_basic_merge_conflicts'
    ],
    steps: [
      {
        label: '1. trigger merge conflict',
        command: 'git merge feature/cache',
        output: [
          'dev@lab:~/repos/infra-platform$ git merge feature/cache',
          'Auto-merging app/deployment.yaml',
          'CONFLICT (content): Merge conflict in app/deployment.yaml',
          'Automatic merge failed; fix conflicts and then commit the result.',
          'dev@lab:~/repos/infra-platform$ git status -s',
          'UU app/deployment.yaml',
          '# UU = Unmerged, both modified!',
          '# Git has paused the merge and entered conflict mode.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'UU',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml [CONFLICT: UU]'
        }),
        shelf: [
          { label: 'Merge Status', value: 'CONFLICT (Paused)', detail: 'Automatic merge halted', badge: 'warning' },
          { label: 'File Status', value: 'UU (Both Modified)', detail: 'Unmerged index state', badge: 'warning' },
          { label: 'Index Mode', value: '3-Stage Active', detail: 'Holds BASE, OURS, THEIRS', badge: 'changed' },
          { label: 'Working Tree', value: 'Conflict Markers', detail: '<<<<<<< HEAD on disk', badge: 'warning' }
        ],
        inspectorState: 'Merge Halted: 3-Stage Index Activated',
        inspectorDetail: 'ELI5: Git says: "Both of you changed line 5 of deployment.yaml and I don\'t know whose change is better! You have to decide." The file is marked UU (Unmerged).',
        inspectorOperation: 'git merge feature/cache (conflict)',
        internalChange: 'Index entered unmerged state. Slots 1, 2, 3 populated for app/deployment.yaml.',
        takeaway: 'A conflict is not a crash. It is Git safely pausing to let a human engineer decide which code to keep.',
        plumbingCommand: 'git ls-files -u',
        xrayNote: 'Look at Column 1: deployment.yaml has a pulsing red warning badge UU. It is unmerged.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'refs/heads/main (merging feature/cache)',
          commitHash: 'e78b21a',
          commitMsg: 'Merge halted due to overlapping edits',
          treeHash: 'Index in conflict mode',
          treeDetail: 'deployment.yaml unmerged',
          blobHash: 'Stage 1, 2, 3 active',
          blobDetail: 'Conflict markers written to disk'
        }
      },
      {
        label: '2. inspect 3-stage index (ls-files -u)',
        command: 'git ls-files --stage app/deployment.yaml',
        output: [
          'dev@lab:~/repos/infra-platform$ git ls-files --stage app/deployment.yaml',
          '100644 c3904e189012345678901234567890123456789a 1\tapp/deployment.yaml',
          '100644 e78b21a89012345678901234567890123456789a 2\tapp/deployment.yaml',
          '100644 b14c80e89012345678901234567890123456789a 3\tapp/deployment.yaml',
          '# THE SECRET THREE STAGES REVEALED:',
          '# Stage 1 = BASE   (common ancestor c3904e1: replicas: 2)',
          '# Stage 2 = OURS   (current branch main: replicas: 5)',
          '# Stage 3 = THEIRS (feature/cache: replicas: 3)',
          '# Three distinct blobs exist in .git/objects/ right now!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'UU',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml [3 stages active]',
          gitFiles: [
            { path: '.git/index', name: 'index [Stage 1: BASE c3904e1]', depth: 1 },
            { path: '.git/index', name: 'index [Stage 2: OURS e78b21a]', depth: 1, highlight: true },
            { path: '.git/index', name: 'index [Stage 3: THEIRS b14c80e]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Stage 1 (BASE)', value: 'c3904e1 (reps: 2)', detail: 'Common ancestor baseline', badge: 'neutral' },
          { label: 'Stage 2 (OURS)', value: 'e78b21a (reps: 5)', detail: 'Version on main branch', badge: 'changed' },
          { label: 'Stage 3 (THEIRS)', value: 'b14c80e (reps: 3)', detail: 'Version on feature branch', badge: 'changed' },
          { label: 'Stage 0 (Clean)', value: 'MISSING', detail: 'Cannot commit without Stage 0', badge: 'warning' }
        ],
        inspectorState: 'Inside the 3-Stage Index',
        inspectorDetail: 'ELI5: Look at git ls-files --stage: Git literally created 3 entries in its ledger! Stage 1 is the original ancestor, Stage 2 is your version, and Stage 3 is their version. Git is holding all 3 for you.',
        inspectorOperation: 'git ls-files --stage',
        internalChange: 'Binary index holds three concurrent SHA records for the same filepath.',
        takeaway: 'Git does not mangle files. It holds all three parent versions cleanly in the index so merge tools can compare them.',
        plumbingCommand: 'git checkout --ours app/deployment.yaml (or --theirs)',
        xrayNote: 'Turn on ⚡ X-Ray: See Stage 1, 2, and 3 listed inside the index! Each has its own blob hash.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'Stage 1: BASE | Stage 2: OURS | Stage 3: THEIRS',
          commitHash: 'e78b21a vs b14c80e',
          commitMsg: 'Common ancestor: c3904e1',
          treeHash: '3-stage index entries',
          treeDetail: 'git ls-files --stage reveals 3 blobs',
          blobHash: '1: c3904 (2 reps) | 2: e78b (5 reps) | 3: b14c (3 reps)',
          blobDetail: 'Three distinct blob hashes in .git/objects/'
        }
      },
      {
        label: '3. inspect conflict markers on disk',
        command: 'cat app/deployment.yaml',
        output: [
          'dev@lab:~/repos/infra-platform$ cat app/deployment.yaml',
          'apiVersion: apps/v1',
          'kind: Deployment',
          'spec:',
          '<<<<<<< HEAD',
          '  replicas: 5',
          '=======',
          '  replicas: 3',
          '>>>>>>> feature/cache',
          '# ON YOUR DESK: Conflict markers show OURS (top) vs THEIRS (bottom).'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'UU',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml (has <<<<<<< markers)'
        }),
        shelf: [
          { label: '<<<<<<< HEAD', value: 'replicas: 5', detail: 'Our change on main', badge: 'neutral' },
          { label: '=======', value: 'Separator', detail: 'Divides the two versions', badge: 'neutral' },
          { label: '>>>>>>> feature', value: 'replicas: 3', detail: 'Their change on feature', badge: 'neutral' },
          { label: 'Resolution', value: 'Choose correct value', detail: 'Delete markers and save', badge: 'changed' }
        ],
        inspectorState: 'Conflict Markers on Disk',
        inspectorDetail: 'ELI5: Git wrote the conflict markers right into your file: everything between <<<<<<< HEAD and ======= is your version (replicas: 5). Everything between ======= and >>>>>>> is their version (replicas: 3).',
        inspectorOperation: 'cat app/deployment.yaml',
        internalChange: 'Working tree file contains conflict markers. Index remains in 3-stage mode.',
        takeaway: 'Conflict markers are just plain text. Fixing a conflict is simply editing the text and deleting the marker lines.',
        plumbingCommand: 'git diff',
        xrayNote: 'The file on disk has the raw conflict markers. Index still has 3 separate stages.',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'Working tree file has <<<<<<< and >>>>>>>',
          commitHash: 'e78b21a',
          commitMsg: 'Manual resolution required',
          treeHash: 'Unmerged index state',
          treeDetail: 'Cannot commit until resolved',
          blobHash: 'Diff markers on disk',
          blobDetail: 'Engineer chooses correct lines'
        }
      },
      {
        label: '4. resolve conflict & git add',
        command: 'echo -e "apiVersion: apps/v1\\nkind: Deployment\\nspec:\\n  replicas: 4" > app/deployment.yaml && git add app/deployment.yaml && git ls-files --stage app/deployment.yaml',
        output: [
          'dev@lab:~/repos/infra-platform$ git add app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git ls-files --stage app/deployment.yaml',
          '100644 f5819ab89012345678901234567890123456789a 0\tapp/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ git status -s',
          'M  app/deployment.yaml',
          '# CONFLICT RESOLVED! What git add just did:',
          '# 1. Hashed the resolved file into new blob f5819ab',
          '# 2. ERASED Stages 1, 2, and 3 from the index!',
          '# 3. Restored normal Stage 0! Ready for git commit.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentStatus: 'A',
          deploymentHighlight: true,
          deploymentName: 'deployment.yaml [RESOLVED: Stage 0]'
        }),
        shelf: [
          { label: 'Conflict State', value: 'RESOLVED', detail: 'Stages 1, 2, 3 deleted', badge: 'success' },
          { label: 'Index Stage', value: 'Stage 0 (Clean)', detail: 'Normal index slot restored', badge: 'success' },
          { label: 'Resolved Value', value: 'replicas: 4', detail: 'Engineering compromise saved', badge: 'neutral' },
          { label: 'Ready to Commit', value: 'git commit', detail: 'Finalizes the merge commit', badge: 'success' }
        ],
        inspectorState: 'Stages Collapsed Back to Stage 0',
        inspectorDetail: 'ELI5: You picked "replicas: 4", erased the conflict arrows, and ran git add. Git threw away the 3 temporary trays, made a fresh blob for replicas: 4, and placed it cleanly in Stage 0. The conflict is gone!',
        inspectorOperation: 'git add (resolving conflict)',
        internalChange: 'Stages 1, 2, and 3 purged from index. New resolved blob f5819ab written. Single Stage 0 entry created.',
        takeaway: 'git add is the universal conflict resolver: it tells Git "I have fixed this file, collapse the 3 stages back to normal Stage 0."',
        plumbingCommand: 'git commit -m "Merge resolved with replicas: 4"',
        xrayNote: 'Notice in X-Ray: The 3 stages vanished from the index, replaced by a single clean Stage 0 entry!',
        internals: {
          head: 'ref: refs/heads/main',
          branchRef: 'Conflict resolved! Stages 1-3 collapsed to Stage 0',
          commitHash: 'e78b21a',
          commitMsg: 'Ready for merge commit',
          treeHash: 'Resolved index snapshot',
          treeDetail: 'Normal stage 0 entry restored',
          blobHash: 'f5819ab (new resolved blob)',
          blobDetail: 'replicas: 4 (resolved compromise)'
        }
      }
    ]
  },

  // =========================================================================
  // LEVEL 10: WORKTREES, REFLOG RECOVERY & PLUMBING
  // =========================================================================
  {
    id: 'worktrees-reflog-and-plumbing',
    level: 10,
    title: 'Level 10: Worktrees, Reflog Recovery & Plumbing',
    label: '10. Worktrees & Plumbing',
    group: 'Worktrees & Plumbing',
    path: '~/repos/infra-platform',
    branch: 'main',
    question: 'How do senior engineers work on multiple branches at once without re-cloning, rescue lost commits, and build commits with plumbing?',
    whatLearnerThinks: '“If I need two branches at once, I have to clone the repository again. And if I delete a commit, it is gone forever.”',
    whatWeReveal: 'git worktree add creates independent working directories sharing one central .git/objects vault with zero disk duplication. The reflog keeps a black-box flight recorder of every HEAD movement, enabling 100% recovery. Plumbing commands reveal the true engine underneath porcelain.',
    takeaway: 'ELI5: 1. Worktrees: Instead of buying a second house, you just open a second desk in another room. Both desks share the exact same central photo vault (.git/objects/). You can code on feature/networking at Desk 1 while reviewing main at Desk 2 with zero wasted space! 2. Reflog: Git has an indestructible black-box flight recorder (.git/logs/HEAD). Even if you run reset --hard, the commit still exists in the vault for 30–90 days! 3. Plumbing: Everyday commands (git add, git commit) are just friendly steering wheels. Underneath, Git is a 5-step engine: hash-object -> update-index -> write-tree -> commit-tree -> update-ref!',
    caveat: 'Worktrees isolate Git checkouts, but they share the same physical machine: running simultaneous servers in both worktrees can cause TCP port collisions or cloud resource lock conflicts.',
    inspector: 'Explore multi-directory worktree isolation, rescue an orphaned commit with git reflog, and execute a manual plumbing commit pipeline.',
    sources: [
      'https://git-scm.com/docs/git-worktree',
      'https://git-scm.com/docs/git-reflog',
      'https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain'
    ],
    steps: [
      {
        label: '1. git worktree (shared .git vault)',
        command: 'git worktree add ../wt/networking -b feature/networking && git worktree list',
        output: [
          'dev@lab:~/repos/infra-platform$ git worktree add ../wt/networking -b feature/networking',
          'Preparing worktree (new branch \'feature/networking\')',
          'HEAD is now at 4f901ab Scale cache deployment',
          'dev@lab:~/repos/infra-platform$ git worktree list',
          '/home/dev/repos/infra-platform   4f901ab [main]',
          '/home/dev/wt/networking          4f901ab [feature/networking]',
          '# MULTI-DIRECTORY WORKSPACE ACTIVE!',
          '# ../wt/networking has its own private HEAD and index.',
          '# But it SHARES .git/objects: zero gigabytes duplicated!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml',
          gitFiles: [
            { path: '.git/worktrees/networking', name: 'worktrees/networking/ [Private HEAD & Index]', depth: 1, highlight: true },
            { path: '.git/objects', name: 'objects/ [SHARED BY ALL WORKTREES]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Root Worktree', value: '/repos/infra-platform', detail: 'Branch: main', badge: 'neutral' },
          { label: 'Linked Worktree', value: '/wt/networking', detail: 'Branch: feature/networking', badge: 'success' },
          { label: 'Object DB Sharing', value: '100% Shared', detail: 'Zero duplicate object storage', badge: 'success' },
          { label: 'Independence', value: 'Private HEAD & Index', detail: 'Work on both simultaneously', badge: 'neutral' }
        ],
        inspectorState: 'Multiple Desks, One Central Vault',
        inspectorDetail: 'ELI5: You just opened a second desk down the hall (/wt/networking). You can compile and test feature/networking there while keeping main open here. Both desks share the exact same photo vault (.git/objects/)!',
        inspectorOperation: 'git worktree add',
        internalChange: 'Created .git/worktrees/networking with dedicated private HEAD and index files. Linked to root object db.',
        takeaway: 'Never clone a repository twice to work on two branches. Use git worktree add to get independent checkouts with zero disk bloat.',
        plumbingCommand: 'git worktree list --porcelain',
        xrayNote: 'Try clicking the ACTIVE WORKTREE buttons above the 3-column workspace to switch between worktree desks!',
        internals: {
          head: '/wt/networking: ref: refs/heads/feature/networking',
          branchRef: 'Independent worktree directory',
          commitHash: 'b14c80e',
          commitMsg: 'Worktree shares .git/objects with main repo',
          treeHash: 'Dedicated private index',
          treeDetail: 'Separate HEAD pointer file',
          blobHash: 'b14c80e',
          blobDetail: 'Zero duplicated object storage'
        }
      },
      {
        label: '2. lose a commit with reset --hard',
        command: 'git reset --hard c3904e1 && git log --oneline -n 2',
        output: [
          'dev@lab:~/repos/infra-platform$ git reset --hard c3904e1',
          'HEAD is now at c3904e1 Initial infrastructure definition',
          'dev@lab:~/repos/infra-platform$ git log --oneline -n 2',
          'c3904e1 Initial infrastructure definition',
          '# PANIC MOMENT: Commit 4f901ab is completely gone from git log!',
          '# Is it deleted? NO! It is only unreferenced.',
          '# It still sits safely inside .git/objects/4f/!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (C1 baseline)',
          gitFiles: [
            { path: '.git/objects/4f', name: 'objects/4f/901ab... [ORPHANED, BUT ALIVE!]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'HEAD Position', value: 'c3904e1 (REWOUND)', detail: 'Accidental hard reset', badge: 'warning' },
          { label: 'Lost Commit', value: '4f901ab', detail: 'Missing from git log', badge: 'warning' },
          { label: 'Object Vault', value: 'Object Still Alive', detail: '4f901ab not deleted on disk', badge: 'success' },
          { label: 'Rescue Window', value: '30 to 90 Days', detail: 'Protected by reflog expiry', badge: 'neutral' }
        ],
        inspectorState: 'Accidental Commit Loss (Simulated)',
        inspectorDetail: 'ELI5: Oh no! You ran reset --hard and commit 4f901ab disappeared from your git log! Junior devs panic, but senior devs smile: the commit envelope is still sitting in the vault. Git just lost the bookmark.',
        inspectorOperation: 'git reset --hard c3904e1 (accidental)',
        internalChange: 'main ref moved to c3904e1. Commit 4f901ab remains in .git/objects/4f/ as an unreferenced object.',
        takeaway: 'Git rarely deletes anything immediately. A "lost" commit is usually just an unreferenced object waiting to be found.',
        plumbingCommand: 'git reflog',
        xrayNote: 'Turn on X-Ray: See objects/4f/901ab glowing in the vault. It was never destroyed!',
        internals: {
          head: 'ref: refs/heads/main -> c3904e1',
          branchRef: 'main rewound to initial commit',
          commitHash: 'c3904e1',
          commitMsg: 'Commit 4f901ab temporarily lost from log',
          treeHash: 'e189ac2',
          treeDetail: 'Working tree rewound to baseline',
          blobHash: '94b810a',
          blobDetail: '4f901ab blob still safe in objects/'
        }
      },
      {
        label: '3. reflog rescue: recover lost commit',
        command: 'git reflog -n 3 && git switch -c rescue 4f901ab',
        output: [
          'dev@lab:~/repos/infra-platform$ git reflog -n 3',
          'c3904e1 HEAD@{0}: reset: moving to c3904e1',
          '4f901ab HEAD@{1}: commit: Scale cache deployment',
          'e78b21a HEAD@{2}: checkout: moving from main to feature/cache',
          'dev@lab:~/repos/infra-platform$ git switch -c rescue 4f901ab',
          'Switched to a new branch \'rescue\'',
          '# RESCUED! Reflog flight recorder showed HEAD@{1} was 4f901ab.',
          '# We created a new branch bookmark on it. 100% of work restored!'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml (rescued!)',
          gitFiles: [
            { path: '.git/refs/heads/rescue', name: 'refs/heads/rescue -> 4f901ab [RESCUED!]', depth: 1, highlight: true },
            { path: '.git/logs/HEAD', name: 'logs/HEAD [Reflog Journal]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: 'Reflog Record', value: 'HEAD@{1}: 4f901ab', detail: 'Found in flight recorder', badge: 'success' },
          { label: 'Rescue Action', value: 'git switch -c rescue', detail: 'Attached named branch bookmark', badge: 'success' },
          { label: 'Data Recovery', value: '100% Recovered', detail: 'Zero lines of code lost', badge: 'success' },
          { label: 'Reflog Lifespan', value: '90 days default', detail: 'Managed by gc.reflogExpire', badge: 'neutral' }
        ],
        inspectorState: 'Reflog Flight Recorder Rescues Work',
        inspectorDetail: 'ELI5: Git keeps a secret diary in .git/logs/HEAD recording every step your finger ever took. We checked the diary, saw that 5 minutes ago your finger was on 4f901ab, and stuck a brand new bookmark ("rescue") right back on it. Saved!',
        inspectorOperation: 'git reflog && git switch -c rescue',
        internalChange: 'Consulted .git/logs/HEAD. Created .git/refs/heads/rescue pointing to 4f901ab. HEAD attached to rescue.',
        takeaway: 'git reflog is your ultimate safety net. If you ever think you ruined your repository, run git reflog first.',
        plumbingCommand: 'git reflog show HEAD',
        xrayNote: 'Column 1: See logs/HEAD and refs/heads/rescue appear. The commit is fully re-attached to the active graph.',
        internals: {
          head: 'HEAD@{1} = 4f901ab (from .git/logs/HEAD)',
          branchRef: 'Reflog rescued orphaned commit',
          commitHash: '4f901ab',
          commitMsg: 'Restored before git gc prune',
          treeHash: '7b2a901',
          treeDetail: 'Object was never deleted, only unreferenced',
          blobHash: '7ab38f4',
          blobDetail: '30-90 day reflog safety window'
        }
      },
      {
        label: '4. plumbing challenge: commit without porcelain',
        command: 'git hash-object -w app/deployment.yaml && git write-tree && git commit-tree 9b310ef -m "Plumbing commit" -p HEAD && git update-ref refs/heads/main 5f201ab',
        output: [
          'dev@lab:~/repos/infra-platform$ # THE 5-STEP PLUMBING ENGINE CHALLENGE:',
          'dev@lab:~/repos/infra-platform$ # 1. Write Blob:   git hash-object -w app/deployment.yaml',
          '7ab38f4a2190cd89e1401bc389012478901234ab',
          'dev@lab:~/repos/infra-platform$ # 2. Stage Entry:  git update-index --add --cacheinfo 100644 7ab38f4 app/deployment.yaml',
          'dev@lab:~/repos/infra-platform$ # 3. Freeze Tree:  git write-tree',
          '9b310efe18ac49b012891ac37890123456789abc',
          'dev@lab:~/repos/infra-platform$ # 4. Mint Commit:  git commit-tree 9b310ef -p HEAD -m "Plumbing commit"',
          '5f201ab789012345678901234567890123456789',
          'dev@lab:~/repos/infra-platform$ # 5. Advance Ref:  git update-ref refs/heads/main 5f201ab',
          '# CONGRATULATIONS! You just minted a real Git commit without git add or git commit!',
          '# Every porcelain command is just a wrapper around these 5 plumbing primitives.'
        ],
        files: getRepoFiles({
          includeGit: true,
          deploymentName: 'deployment.yaml',
          gitFiles: [
            { path: '.git/objects/5f', name: 'objects/5f/201ab... [Plumbing Commit]', depth: 1, highlight: true },
            { path: '.git/objects/9b', name: 'objects/9b/310ef... [Plumbing Tree]', depth: 1, highlight: true },
            { path: '.git/objects/7a', name: 'objects/7a/b38f4... [Plumbing Blob]', depth: 1, highlight: true },
            { path: '.git/refs/heads/main', name: 'refs/heads/main -> 5f201ab [Plumbing Ref]', depth: 1, highlight: true }
          ]
        }),
        shelf: [
          { label: '1. hash-object', value: '7ab38f4 (Blob)', detail: 'Direct byte compression', badge: 'neutral' },
          { label: '2. write-tree', value: '9b310ef (Tree)', detail: 'Direct directory snapshot', badge: 'neutral' },
          { label: '3. commit-tree', value: '5f201ab (Commit)', detail: 'Direct envelope minting', badge: 'success' },
          { label: '4. update-ref', value: 'refs/heads/main', detail: 'Direct pointer advancement', badge: 'success' }
        ],
        inspectorState: 'The Complete 5-Step Engine Exposed',
        inspectorDetail: 'ELI5: You just lifted the entire car hood and turned the engine crankshaft with your bare hands! You made a blob, staged it, built a tree receipt, sealed a commit envelope, and moved the branch bookmark—without touching git add or git commit. You now know how Git works better than 95% of software engineers.',
        inspectorOperation: 'hash-object -> update-index -> write-tree -> commit-tree -> update-ref',
        internalChange: 'Direct execution of Git core plumbing primitives without porcelain abstraction.',
        takeaway: 'Git is not magic. It is a content-addressed key-value database with a staging cache and branch pointer files.',
        plumbingCommand: 'git cat-file -p HEAD',
        xrayNote: 'You have mastered Git from high-level porcelain down to low-level engine primitives. Turn on ⚙ Plumbing mode anytime to inspect the gears!',
        internals: {
          head: 'ref: refs/heads/main -> 5f201ab',
          branchRef: 'Advanced directly via git update-ref',
          commitHash: '5f201ab (minted via commit-tree)',
          commitMsg: 'Manual plumbing pipeline completed',
          treeHash: '9b310ef (written via write-tree)',
          treeDetail: 'Generated directly from index entries',
          blobHash: '7ab38f4 (hashed via hash-object -w)',
          blobDetail: 'Porcelain commands are just wrappers!'
        }
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
      return {
        head: 'ref: refs/heads/main',
        branchRef: stepIdx >= 1 ? 'refs/heads/main -> 4f901ab (ADVANCED!)' : 'refs/heads/main -> c3904e1',
        commitHash: '4f901ab',
        commitMsg: '"Scale cache deployment"',
        treeHash: 'f419dc8',
        treeDetail: 'tree pointer in commit envelope',
        blobHash: '7ab38f4',
        blobDetail: 'app/deployment.yaml (replicas: 4)'
      };

    case 'branches-are-references':
      if (stepIdx < 2) {
        return {
          head: 'ref: refs/heads/main',
          branchRef: stepIdx === 1 ? 'main: 4f901ab | feature/cache: 4f901ab' : 'refs/heads/main -> 4f901ab',
          commitHash: '4f901ab',
          commitMsg: 'Both branch files point to same commit',
          treeHash: 'f419dc8',
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
          head: '4f901ab (DETACHED HEAD!)',
          branchRef: 'No branch reference! HEAD is a raw SHA.',
          commitHash: '4f901ab',
          commitMsg: '"Scale cache deployment"',
          treeHash: '7b2a901',
          treeDetail: 'Main root tree',
          blobHash: '7ab38f4',
          blobDetail: 'replicas: 3'
        };
      }
      if (stepIdx === 2) {
        return {
          head: 'c5019a2 (DETACHED HEAD!)',
          branchRef: 'No branch reference! Floating commit.',
          commitHash: 'c5019a2',
          commitMsg: 'New commits here will become orphans!',
          treeHash: '8b190ac',
          treeDetail: 'Read-only inspection state',
          blobHash: 'e1401bc',
          blobDetail: 'probe: true'
        };
      }
      return {
        head: 'ref: refs/heads/fix/cache-probe',
        branchRef: 'refs/heads/fix/cache-probe -> c5019a2 (RESCUED!)',
        commitHash: 'c5019a2',
        commitMsg: 'Rescued with named branch',
        treeHash: '8b190ac',
        treeDetail: 'Anchored in graph',
        blobHash: 'e1401bc',
        blobDetail: 'probe: true'
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
          blobDetail: 'replicas: 4'
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
          commitHash: 'c3904e1',
          commitMsg: 'Commit 4f901ab temporarily lost from log',
          treeHash: 'e189ac2',
          treeDetail: 'Working tree rewound to baseline',
          blobHash: '94b810a',
          blobDetail: '4f901ab blob still safe in objects/'
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
