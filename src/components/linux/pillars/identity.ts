import type { LinuxPillar } from '../linux-types';
import { man } from '../linux-types';

export const identityPillar: LinuxPillar = {
  id: 'identity',
  name: 'Identity & Access',
  short: 'Identity',
  promise: 'Follow usernames from human configuration through NSS resolution into the numeric kernel credential vectors (RUID, EUID, FSUID) and hierarchical directory traversal gates.',
  hints: 'UID/GID · struct cred · path traversal · sudo · SSH',
  bridge: 'Kubernetes securityContexts (runAsUser, fsGroup, supplementalGroups) inject numeric IDs directly into the kernel task_struct cred structure explored here.',
  chapter: { number: 1, foundation: 'Start here if usernames, groups, sudo, SSH, and file permissions feel like one security feature. This chapter separates account lookup, process credentials, authentication, and authorization.', objectives: ['Resolve a name to numeric identity without confusing NSS with authentication', 'Predict which owner, group, or other mode class the kernel selects', 'Locate the first directory that blocks a pathname', 'Explain what sudo and SSH change—and what they do not'], kernelObjects: ['struct cred', 'UID / GID vectors', 'inode ownership', 'supplementary groups'], practice: 'Diagnose why nginx UID 33 cannot read /srv/site/config.json without reaching for chmod 777.' },
  checkpoints: [
    { question: 'nginx matches the file owner, whose mode bits deny read. The group bits allow read. Which class applies?', choices: [{ label: 'Owner bits deny the read', correct: true, feedback: 'Correct. DAC chooses the owner class and stops; it does not fall through to more permissive group bits.' }, { label: 'Group bits allow the read', correct: false, feedback: 'Matching the owner selects the owner class. Linux does not choose the most permissive class.' }, { label: 'Other bits decide', correct: false, feedback: 'Other applies only when neither owner nor group matches.' }] },
    { question: 'index.html is mode 0644, but /srv/site lacks search permission for the process. What happens?', choices: [{ label: 'Path lookup returns EACCES first', correct: true, feedback: 'Correct. Every non-final directory component needs search permission before the leaf can be checked.' }, { label: 'The file read succeeds because 0644 is readable', correct: false, feedback: 'The kernel cannot reach the leaf inode through the blocked parent directory.' }, { label: 'NSS retries another username', correct: false, feedback: 'NSS name lookup is separate from VFS pathname permission checks.' }] },
  ],
  groups: [
    { label: 'Identity model', viewIds: ['identity-concepts', 'account', 'process'] },
    { label: 'Access decisions', viewIds: ['users-groups', 'permission', 'deny'] },
    { label: 'Privilege & login', viewIds: ['privilege', 'ssh-auth'] },
  ],
  views: [
    {
      id: 'identity-concepts',
      label: 'Core concepts',
      title: 'Before looking at the mechanics, what actually is a User or a Group?',
      question: 'What are the foundational primitives of Linux Identity?',
      kind: 'concept-primer',
      concepts: [
        {
          term: 'UID (User ID)',
          analogy: 'A Social Security Number',
          definition: 'Linux does not care about your username ("nginx"). It only cares about an integer number (e.g. 33). This integer is stamped onto every process and every file to determine who owns what.'
        },
        {
          term: 'GID (Group ID)',
          analogy: 'A Company Department Badge',
          definition: 'Another integer. A single UID can belong to multiple GIDs (like belonging to both HR and Engineering). This allows multiple different users to share access to the same files.'
        },
        {
          term: 'NSS (Name Service Switch)',
          analogy: 'A Phonebook Directory',
          definition: 'The system that translates human names (like "nginx") into the integer IDs (like 33). It can look up names in local files (/etc/passwd) or over the network (Active Directory).'
        },
        {
          term: 'Mode Bits (Permissions)',
          analogy: 'Three Locks on a Door',
          definition: 'Every file has 3 locks: one for the Owner UID, one for the Group GID, and one for Everyone Else. Each lock grants or denies Read, Write, or Execute access.'
        }
      ],
      explanation: 'Identity in Linux fundamentally reduces to two 32-bit integers: a UID and a GID. Everything you do on a Linux system—starting a web server, reading a file, SSHing in—is evaluated mathematically by the kernel comparing your process\'s UID against a file\'s UID. Human names like "root" are just illusions provided by user-space tools for our convenience.',
      takeaway: 'Strip away the usernames. At the kernel level, you are just an integer UID knocking on a door with a matching integer lock.',
      command: 'id',
      output: 'uid=1000(darshan) gid=1000(darshan) groups=1000(darshan),27(sudo)',
      probe: 'stat -c "%u:%g" /etc/passwd',
      probeOutput: '0:0',
      caveat: 'The kernel evaluates numeric credentials, not the spelling of a username. UID 0 conventionally receives a full capability set, but namespaces, dropped capabilities, LSM policy, seccomp, and mount state can still constrain a process.',
      source: `${man}man7/credentials.7.html`
    },
    {
      id: 'account',
      label: 'Account lookup',
      title: 'Usernames are human syntax; the kernel only evaluates numeric IDs.',
      question: 'How does Linux translate a username into kernel-enforced credentials?',
      kind: 'interactive-nss',
      nssData: {
        config: { files: true, sss: true }, // /etc/nsswitch.conf `passwd: files sss`
        databases: {
          files: [
            { username: 'root', uid: 0, gid: 0, dir: '/root', shell: '/bin/bash' },
            { username: 'nginx', uid: 33, gid: 33, dir: '/var/cache/nginx', shell: '/sbin/nologin' }
          ],
          sss: [ // System Security Services Daemon (LDAP/AD)
            { username: 'ldap_user', uid: 5001, gid: 5001, dir: '/home/ldap_user', shell: '/bin/bash' },
            { username: 'nginx', uid: 9999, gid: 9999, dir: '/network/nginx', shell: '/bin/bash' } // Conflict!
          ]
        }
      },
      explanation: 'When a service starts or a user authenticates, glibc calls getpwnam() to resolve the username. The Name Service Switch (/etc/nsswitch.conf) configures the resolution order—typically local files first, then directory services like LDAP, SSSD, or Winbind. The kernel itself has no concept of usernames; all discretionary access checks operate exclusively on 32-bit integer UIDs and GIDs.',
      takeaway: 'Never grep /etc/passwd in automation; use getent passwd to query the full NSS resolution chain.',
      command: 'getent passwd nginx',
      output: 'nginx:x:33:33:nginx user:/var/cache/nginx:/sbin/nologin',
      probe: 'id -u nginx',
      probeOutput: '33',
      caveat: 'In rootless containers and user namespaces, container UID 0 is mapped to an unprivileged high UID on the host (e.g. 100000) via /etc/subuid.',
      source: `${man}man5/nsswitch.conf.5.html`
    },
    {
      id: 'process',
      label: 'Process credentials',
      title: 'Every process carries a vector of distinct numeric identities.',
      question: 'Which UIDs does a running process hold, and which one gates file access?',
      kind: 'tree',
      actors: [
        { label: 'Kernel struct cred', detail: 'Credential pointer embedded in task_struct' },
        { label: 'Real UID (RUID)', detail: 'Identifies who launched the process (for accounting)' },
        { label: 'Effective UID (EUID)', detail: 'Used for most permission checks & setuid transitions' },
        { label: 'Filesystem UID (FSUID)', detail: 'Linux-specific: used for all VFS path operations' }
      ],
      explanation: 'Linux processes do not hold a single UID; the kernel maintains a credential structure (struct cred) with Real, Effective, Saved, and Filesystem IDs. The Real UID tracks who started the process. The Effective UID determines process privileges and signals. The Filesystem UID (FSUID) is tested for all filesystem open() and stat() operations, allowing NFS daemons and setuid binaries to drop filesystem privileges without losing signal control.',
      takeaway: 'The Effective and Filesystem UIDs govern permission checks; verify them via ps -eo pid,user,euser or /proc/<pid>/status.',
      command: 'ps -eo pid,user,euser,comm | grep nginx',
      output: '  418 root     root     nginx\n  421 nginx    nginx    nginx',
      probe: 'grep -E "^(Uid|Gid):" /proc/421/status',
      probeOutput: 'Uid:\t33\t33\t33\t33\nGid:\t33\t33\t33\t33',
      caveat: 'Saved UID (SUID) allows a process that temporarily lowered its EUID to regain root privileges when needed, a pattern common in setuid utility binaries.',
      source: `${man}man7/credentials.7.html`
    },
    {
      id: 'users-groups',
      label: 'Users & groups',
      title: 'The Linux Access Control Matrix: Subject vs Object.',
      question: 'How does the kernel match process credentials against file mode bits?',
      kind: 'interactive-permission',
      permissionData: {
        file: { path: '/srv/site/config.json', owner: 0, group: 1001, mode: '0640' },
        users: [
          { uid: 0, gid: 0, name: 'root', groups: [0] },
          { uid: 33, gid: 33, name: 'nginx (worker)', groups: [33, 1001] },
          { uid: 1000, gid: 1000, name: 'dev1 (unprivileged)', groups: [1000] }
        ],
        groups: { 0: 'root', 33: 'nginx', 1000: 'dev1', 1001: 'appgroup' }
      },
      explanation: 'Linux separates identity from access control. For ordinary mode-bit checks, the kernel compares a process\'s effective credentials with inode ownership, selects exactly one class—owner, matching group, or other—and evaluates that class. Relevant capabilities can override specific DAC checks; that is narrower than a universal “root bypass.”',
      takeaway: 'Permissions are evaluated strictly numerically. Changing group memberships requires the process to restart to acquire the new GID.',
      command: 'id',
      output: 'uid=33(nginx) gid=33(nginx) groups=33(nginx),1001(appgroup)',
      probe: 'stat -c "%a %U:%G" /srv/site/config.json',
      probeOutput: '640 root:appgroup',
      caveat: 'PAM (Pluggable Authentication Modules) can bypass local databases completely when authenticating against OAuth or LDAP.',
      source: `${man}man5/passwd.5.html`
    },
    {
      id: 'permission',
      label: 'Path traversal checks',
      title: 'Access is a hierarchical walk: ancestor directories gate the leaf file.',
      question: 'Why can a process with read permission on a file still get Permission Denied?',
      kind: 'layers',
      actors: [
        { label: 'Root Directory /', detail: 'Mode 0755: execute (+x) search permitted for all' },
        { label: 'Mount /srv', detail: 'Mode 0755: execute (+x) search permitted for all' },
        { label: 'Directory /srv/site', detail: 'Mode 0750: missing execute (+x) for worker UID 33' },
        { label: 'Target index.html', detail: 'Mode 0777: read check NEVER REACHED due to traversal block' }
      ],
      failure: {
        label: 'Grant directory search (+x)',
        result: 'Directory search permission is restored. The kernel can now traverse /srv/site and read index.html.',
        output: 'chmod o+x /srv/site && sudo -u nginx cat /srv/site/index.html\n<!DOCTYPE html><html><body>Web Application Active</body></html>',
        blocked: 2,
        afterActors: [
          { label: 'Root Directory /', detail: 'Mode 0755: search permitted' },
          { label: 'Mount /srv', detail: 'Mode 0755: search permitted' },
          { label: 'Directory /srv/site', detail: 'Mode 0755: search granted (chmod +x)' },
          { label: 'Target index.html', detail: 'Read permitted (200 OK)' }
        ]
      },
      explanation: 'To open any file, the kernel must resolve every component of its path from the root directory downward (path_resolution(7)). For every directory along the way, the process requires the execute (+x) permission bit, which functions as the "search" right. If even one ancestor directory denies execute permission to the process credentials, traversal immediately aborts with EACCES (Permission Denied)—the leaf file permissions are never even evaluated.',
      takeaway: 'Directory execute (+x) means search/traverse; directory read (+r) means list filenames. Without +x, you cannot access files inside.',
      command: 'namei -om /srv/site/index.html',
      output: 'f: /srv/site/index.html\n drwxr-xr-x root root / \n drwxr-xr-x root root srv\n drwxr-x--- root root site    # BLOCKED: other lacks +x\n -rwxrwxrwx root root index.html',
      probe: 'sudo -u nginx cat /srv/site/index.html',
      probeOutput: 'cat: /srv/site/index.html: Permission denied',
      caveat: 'The namei utility is essential in production to inspect permissions at every step of a path chain simultaneously.',
      source: `${man}man7/path_resolution.7.html`
    },
    {
      id: 'deny',
      label: 'Permission diagnosis',
      title: 'chmod 777 destroys security boundaries and masks architectural bugs.',
      question: 'Why is chmod 777 dangerous, and how do you implement least-privilege access?',
      kind: 'gotcha',
      mistake: 'Running chmod -R 777 to "fix" permission denied errors. This grants every local user and breached process read, write, and execute rights.',
      why: 'World-writable directories allow any unprivileged process or compromised container to overwrite application binaries, tamper with logs, or plant backdoors. It treats an access-control failure by eliminating access control entirely.',
      fix: 'Identify the exact failing boundary using namei, set appropriate group ownership (chown root:appgroup), and grant group-read/search (chmod 0750 or 0640).',
      wrongCommand: 'chmod -R 777 /srv/site',
      wrongOutput: '# "Works" immediately, but directory is now world-writable and vulnerable to tampering',
      rightCommand: 'chgrp -R www-data /srv/site && chmod 0750 /srv/site && chmod 0640 /srv/site/index.html',
      rightOutput: '# Least-privilege: only root and www-data group can read/traverse; others receive EACCES',
      explanation: 'Every permission error has an exact reason: a specific UID or GID failed a specific bit check on a specific inode. Least-privilege system administration requires assigning files to a shared group (like www-data or appgroup) and using mode 0640 for files and 0750 for directories. This ensures application workers can read their data while preventing rogue processes from reading secrets or altering code.',
      takeaway: 'Use group ownership (chgrp) and targeted modes (0640/0750) rather than opening the door to world-write permissions.',
      command: 'stat -c "%a %U:%G" /srv/site/index.html',
      output: '640 root:www-data',
      probe: 'sudo -u nginx test -r /srv/site/index.html && echo "Read OK"',
      probeOutput: 'Read OK',
      caveat: 'SetGID on directories (chmod g+s /dir) causes new files created inside to automatically inherit the directory group rather than the creating user primary group.',
      source: `${man}man1/chmod.1.html`
    },
    {
      id: 'privilege',
      label: 'sudo in practice',
      title: 'Controlled privilege delegation with attributable records.',
      question: 'How does sudo safely elevate process credentials from unprivileged to root?',
      kind: 'walkthrough',
      steps: [
        { command: 'sudo -l', output: 'User dev1 may run the following commands on devbox-01:\n    (ALL : ALL) ALL\n    (root) NOPASSWD: /bin/systemctl restart nginx', annotation: 'sudo -l lists all allowed privileges for the current user, including NOPASSWD exemptions for automated operational commands.' },
        { command: 'sudo id', output: 'uid=0(root) gid=0(root) groups=0(root)', annotation: 'When sudo runs, its setuid bit transitions EUID to 0. It verifies /etc/sudoers policy, prompts for the invoking user password, and executes the target binary.' },
        { command: 'grep sudo /var/log/auth.log | tail -n 1', output: 'devbox-01 sudo: dev1 : TTY=pts/0 ; PWD=/home/dev1 ; USER=root ; COMMAND=/bin/systemctl restart nginx', annotation: 'With normal logging enabled, sudo records the invoking user, target identity, working directory, and command. Protect and centralize logs if tamper resistance matters.' },
        { command: 'sudo visudo -cf /etc/sudoers', output: '/etc/sudoers: parsed OK', annotation: 'Never edit /etc/sudoers with a standard text editor. visudo locks the file and validates syntax before committing, preventing lockouts.' }
      ],
      explanation: 'The sudo binary relies on the setuid permission bit (mode 04755). When an ordinary user executes /usr/bin/sudo, the kernel transitions the process Effective UID (EUID) to 0 (root) while preserving the Real UID (RUID). sudo reads /etc/sudoers, checks if the invoking user is authorized to run the command, prompts for authentication, and logs the execution to journald or /var/log/auth.log before execve()ing the command.',
      takeaway: 'sudo can delegate narrowly scoped commands and produce useful accountability records; the policy and logging pipeline determine how strong that control is.',
      command: 'sudo -u nginx whoami',
      output: 'nginx',
      probe: 'ls -l /usr/bin/sudo',
      probeOutput: '-rwsr-xr-x 1 root root 232416 /usr/bin/sudo # Notice "s" setuid bit!',
      caveat: 'By default, sudo sanitizes the environment (env_reset), stripping LD_PRELOAD, PATH, and custom variables to prevent privilege escalation exploits.',
      source: `${man}man8/sudo.8.html`
    },
    {
      id: 'ssh-auth',
      label: 'SSH key auth',
      title: 'Cryptographic challenge-response eliminates brute-force vectors.',
      question: 'How does SSH public key authentication work at the protocol level?',
      kind: 'recipe',
      recipeSteps: [
        { step: 'Generate modern elliptic-curve keypair', command: 'ssh-keygen -t ed25519 -C "admin@devbox-01"', output: 'Your identification has been saved in ~/.ssh/id_ed25519\nYour public key has been saved in ~/.ssh/id_ed25519.pub', note: 'Ed25519 keys are faster, shorter, and cryptographically superior to legacy RSA-2048 keys.' },
        { step: 'Install public key on target host', command: 'ssh-copy-id -i ~/.ssh/id_ed25519.pub dev1@10.0.1.17', output: 'Number of key(s) added: 1\nNow try logging into the machine.', note: 'Appends the public key to ~/.ssh/authorized_keys and enforces strict 0600 file permissions.' },
        { step: 'Verify key login without password prompt', command: 'ssh -i ~/.ssh/id_ed25519 dev1@10.0.1.17 "uptime"', output: '19:50:00 up 42 days, 2 users, load average: 0.12, 0.08, 0.05', note: 'Always confirm key-based access in an independent shell before modifying sshd_config!' },
        { step: 'Disable password authentication in sshd', command: 'sudo sed -i "s/^#*PasswordAuthentication.*/PasswordAuthentication no/" /etc/ssh/sshd_config', output: '# Password authentication disabled', note: 'Eliminates 100% of brute-force dictionary attacks against the SSH daemon.' },
        { step: 'Reload OpenSSH server daemon', command: 'sudo systemctl reload sshd', output: '# Daemon reloaded without dropping active sessions', note: 'Reloading preserves existing connected SSH sessions while applying key-only policy to new handshakes.' }
      ],
      explanation: 'SSH public-key authentication uses proof of private-key possession. After the server accepts a permitted public key, the client signs session-bound authentication data with its private key; the private key never crosses the network. The server verifies that signature, then applies account, PAM, and session policy before starting the requested session.',
      takeaway: 'Never expose a production server with PasswordAuthentication enabled; enforce Ed25519 keys and strict file permissions.',
      command: 'cat ~/.ssh/authorized_keys',
      output: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKeyPayload admin@devbox-01',
      probe: 'sshd -T | grep -E "^(passwordauthentication|pubkeyauthentication)"',
      probeOutput: 'pubkeyauthentication yes\npasswordauthentication no',
      caveat: 'sshd will silently reject public key authentication if ~/.ssh (0700) or ~/.ssh/authorized_keys (0600) are writable by group or other (StrictModes).',
      source: `${man}man1/ssh-keygen.1.html`
    }
  ]
};
