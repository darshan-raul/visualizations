import type { LinuxPillar } from '../linux-types';
import { man } from '../linux-types';

export const identityPillar: LinuxPillar = {
  id: 'identity',
  name: 'Identity & Access',
  short: 'Identity',
  promise: 'Ever wonder who a process really is? Let\'s follow a username all the way down to the numeric IDs the kernel actually checks.',
  hints: 'UID · groups · modes · sudo · SSH',
  bridge: 'Kubernetes securityContexts (runAsUser, fsGroup) use the exact same kernel credential structures we explore here.',
  groups: [
    { label: 'Credentials', viewIds: ['account', 'process', 'users-groups'] },
    { label: 'Access', viewIds: ['permission', 'deny', 'privilege', 'ssh-auth'] },
  ],
  views: [
    {
      id: 'account',
      label: 'Account lookup',
      title: 'Usernames are for humans; the kernel only sees numbers.',
      question: 'How does Linux know my UID when I log in?',
      kind: 'path',
      actors: [
        { label: 'Name', detail: 'The string "appuser"' },
        { label: 'NSS Lookup', detail: 'nsswitch.conf routes to files (or LDAP)' },
        { label: 'UID+GID', detail: '1001:1001' },
        { label: 'Process Creds', detail: 'Shell starts with these IDs' }
      ],
      explanation: 'When you log in or run a service, the system must translate the username into a numeric User ID (UID) and Group ID (GID). The kernel uses these numbers for all access control. The Name Service Switch (NSS) configures where to look up these names — usually local files like /etc/passwd, but sometimes LDAP or Active Directory.',
      takeaway: 'If a username doesn\'t resolve correctly, check /etc/nsswitch.conf and getent passwd first.',
      command: 'getent passwd nginx',
      output: 'nginx:x:33:33:nginx user:/var/cache/nginx:/sbin/nologin',
      probe: 'id -u nginx',
      probeOutput: '33',
      caveat: 'In container environments, the UID in the container might map to a different UID on the host, but inside the namespace, the mapping works the same way.',
      source: `${man}man5/nsswitch.conf.5.html`
    },
    {
      id: 'process',
      label: 'Process credentials',
      title: 'A running process carries a wallet of IDs.',
      question: 'Which IDs does a running process actually carry?',
      kind: 'tree',
      actors: [
        { label: 'Process Wallet', detail: 'The set of IDs attached to the process structure' },
        { label: 'Real UID', detail: 'Who started it' },
        { label: 'Effective UID', detail: 'Who it\'s acting as right now' },
        { label: 'Saved UID', detail: 'Who it can switch back to' }
      ],
      explanation: 'Every process has a "wallet" of credentials. The Real UID is who launched the process. The Effective UID (EUID) is what the kernel actually checks for file access. Usually they are the same, but setuid binaries (like sudo) temporarily change the EUID to root.',
      takeaway: 'The Effective UID is the one that matters for permissions. Check it with ps -o euser.',
      command: 'ps -eo pid,user,euser,comm | grep nginx',
      output: '  420 root     root     nginx\n  421 nginx    nginx    nginx',
      probe: 'grep ^Uid /proc/421/status',
      probeOutput: 'Uid:    33      33      33      33',
      caveat: 'The filesystem UID (fsuid) is a Linux-specific quirk originally used for NFS, but it usually mirrors the effective UID.',
      source: `${man}man7/credentials.7.html`
    },
    {
      id: 'users-groups',
      label: 'Users & groups',
      title: 'The local identity database.',
      question: 'How are users and groups actually stored?',
      kind: 'walkthrough',
      steps: [
        { command: 'cat /etc/passwd | grep nginx', output: 'nginx:x:33:33:nginx user:/var/cache/nginx:/sbin/nologin', annotation: 'The passwd file maps name to UID/GID, home dir, and shell. The "x" means the password hash is in /etc/shadow. Notice the shell is /sbin/nologin, preventing interactive login.' },
        { command: 'sudo cat /etc/shadow | grep nginx', output: 'nginx:!!:19245::::::', annotation: 'Only root can read /etc/shadow. The "!!" means the account is locked and cannot be logged into with a password (perfect for system services).' },
        { command: 'cat /etc/group | grep appgroup', output: 'appgroup:x:1001:dev1,dev2', annotation: 'The group file maps group names to GIDs and lists secondary members. Primary group memberships (from /etc/passwd) aren\'t listed here.' },
        { command: 'sudo usermod -aG appgroup nginx', output: '# No output on success', annotation: 'usermod modifies existing accounts. -aG appends the user to a supplementary group. Forgetting the -a replaces all their groups!' }
      ],
      explanation: 'Local users and groups are managed via standard text files. While you could edit them directly, tools like useradd, usermod, and groupadd handle locking and format validation safely. System accounts (like nginx) should always have disabled passwords and nologin shells.',
      takeaway: 'User info is public (/etc/passwd), but secrets are locked away (/etc/shadow).',
      command: 'id nginx',
      output: 'uid=33(nginx) gid=33(nginx) groups=33(nginx),1001(appgroup)',
      probe: 'getent group appgroup',
      probeOutput: 'appgroup:x:1001:dev1,dev2,nginx',
      caveat: 'Changes to group membership don\'t affect already-running processes for that user. They must restart or log in again to pick up the new group.',
      source: `${man}man5/passwd.5.html`
    },
    {
      id: 'permission',
      label: 'Path traversal checks',
      title: 'Access is a journey, not just a destination.',
      question: 'Why can\'t my process read a file when it has read permissions on it?',
      kind: 'layers',
      actors: [
        { label: 'Directory /srv', detail: 'Search perm OK (a+x)' },
        { label: 'Directory /srv/app', detail: 'Blocked: missing +x for worker' },
        { label: 'File config.json', detail: 'Unreachable' }
      ],
      failure: {
        label: 'Grant directory search (+x)',
        result: 'Directory traversal succeeds. The process can now reach and read config.json.',
        output: 'chmod o+x /srv/app && cat /srv/app/config.json\n{"status": "ok", "env": "production"}',
        blocked: 1,
        afterActors: [
          { label: 'Directory /srv', detail: 'Search perm OK (a+x)' },
          { label: 'Directory /srv/app', detail: 'Search perm granted (chmod +x)' },
          { label: 'File config.json', detail: 'Read allowed (200 OK)' }
        ]
      },
      explanation: 'To read a file, having read permission on the file itself isn\'t enough. The kernel must resolve the path from the root down to the file. For every directory in the path, the process needs execute (+x) permission to "search" or pass through it.',
      takeaway: 'A missing execute bit on any parent directory will block access to everything inside it.',
      command: 'namei -l /srv/app/config.json',
      output: 'drwxr-xr-x root root /srv\ndrwxr-x--- root root /srv/app\n-rw-r--r-- root root /srv/app/config.json',
      probe: 'sudo -u nginx cat /srv/app/config.json',
      probeOutput: 'cat: /srv/app/config.json: Permission denied',
      caveat: 'The namei command is incredibly useful for finding the exact directory that breaks the chain.',
      source: `${man}man7/path_resolution.7.html`
    },
    {
      id: 'deny',
      label: 'Permission diagnosis',
      title: 'chmod 777 is never the answer (seriously).',
      question: 'Why shouldn\'t I just chmod 777 when I get Permission denied?',
      kind: 'gotcha',
      mistake: 'Running chmod 777 on files or directories to "fix" permission errors. This gives every user on the system full read, write, and execute access.',
      why: 'It\'s like removing the front door of your house because your key stuck. You fix the immediate problem but create a much bigger one. Any process, any user, any compromised service can now read, modify, or delete those files.',
      fix: 'Find the actual denying boundary first: check the file owner, the group, and every parent directory (using namei). Grant only the specific access the service needs — usually group membership.',
      wrongCommand: 'chmod -R 777 /srv/app',
      wrongOutput: '# "Works" but now everything is world-writable',
      rightCommand: 'chgrp appgroup /srv/app/config && chmod 640 /srv/app/config',
      rightOutput: '# Only the app group can read; nobody else can',
      explanation: 'Permission denied errors have a specific cause: a particular user or process lacks a particular access right on a particular path component. The fix should be equally specific. chmod 777 bypasses all file-level access control, violating the principle of least privilege.',
      takeaway: 'Find the specific lock that\'s blocking you, then grant the narrowest key that fits.',
      command: 'stat -c "%a %U:%G" /srv/app/config.json',
      output: '640 root:appgroup',
      probe: 'sudo -u nginx stat -c "%a %U:%G" /srv/app/config.json',
      probeOutput: '640 root:appgroup',
      caveat: 'ACLs, MAC policies (SELinux), and mount flags can add additional denials beyond basic file mode.',
      source: `${man}man1/chmod.1.html`
    },
    {
      id: 'privilege',
      label: 'sudo in practice',
      title: 'Temporary superpowers, logged and controlled.',
      question: 'What actually happens when I run sudo?',
      kind: 'walkthrough',
      steps: [
        { command: 'sudo -l', output: 'User dev1 may run the following commands:\n    (ALL : ALL) ALL\n    (root) NOPASSWD: /bin/systemctl restart nginx', annotation: 'sudo -l shows exactly what your user is allowed to do. Here, dev1 has full admin rights, plus a specific command that doesn\'t require typing a password.' },
        { command: 'sudo id', output: 'uid=0(root) gid=0(root) groups=0(root)...', annotation: 'sudo executes a command as another user (root by default). Your EUID becomes 0. The audit log records that dev1 invoked the command.' },
        { command: 'su -', output: 'Password:\nroot@server:~#', annotation: 'su (substitute user) starts a whole new shell as root. You need the root password to do this. Once inside, the system forgets who you originally were.' },
        { command: 'sudo visudo', output: '# Opens /etc/sudoers safely', annotation: 'Always use visudo to edit /etc/sudoers. If you make a syntax error, visudo will refuse to save it. If you break the sudoers file with a regular editor, you might lock yourself out of root entirely.' }
      ],
      explanation: 'sudo (superuser do) elevates privileges for a single command. It checks /etc/sudoers to see if you are authorized, asks for YOUR password to confirm it\'s you, and runs the command with EUID 0. It also logs the attempt, which is crucial for auditing.',
      takeaway: 'sudo delegates authority while preserving accountability. Never edit sudoers without visudo.',
      command: 'sudo -u nginx whoami',
      output: 'nginx',
      probe: 'grep sudo /var/log/auth.log | tail -n 1',
      probeOutput: 'sudo: dev1 : TTY=pts/0 ; PWD=/home/dev1 ; USER=root ; COMMAND=/usr/bin/id',
      caveat: 'Environment variables are heavily stripped by default when running sudo for security reasons.',
      source: `${man}man8/sudo.8.html`
    },
    {
      id: 'ssh-auth',
      label: 'SSH key auth',
      title: 'Retiring passwords for good.',
      question: 'How do I set up SSH keys and disable password login?',
      kind: 'recipe',
      recipeSteps: [
        { step: 'Generate key pair (on your laptop)', command: 'ssh-keygen -t ed25519 -C "laptop"', output: 'Your identification has been saved in /home/user/.ssh/id_ed25519', note: 'ed25519 is the modern, secure, and fast standard. Always use a passphrase.' },
        { step: 'Copy public key to server', command: 'ssh-copy-id user@server', output: 'Number of key(s) added: 1', note: 'This appends your public key to the server\'s ~/.ssh/authorized_keys file. You\'ll need your password one last time.' },
        { step: 'Test key login', command: 'ssh user@server', output: 'Welcome to Ubuntu 22.04 LTS...', note: 'Verify you can get in without a password before proceeding.' },
        { step: 'Disable password auth', command: 'sudo sed -i "s/PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config', output: '# edits config', note: 'This is the most critical security step for any internet-facing server.' },
        { step: 'Restart SSH service', command: 'sudo systemctl restart sshd', output: '# No output on success', note: 'Active connections won\'t drop, but new connections will require keys.' }
      ],
      explanation: 'SSH keys rely on asymmetric cryptography. Your private key stays safely on your laptop; only the public key goes to the server. When you connect, the server challenges your SSH client to prove it holds the matching private key. Disabling password authentication eliminates brute-force login attacks entirely.',
      takeaway: 'Never expose a server to the internet with password authentication enabled.',
      command: 'cat ~/.ssh/authorized_keys',
      output: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... laptop',
      probe: 'sshd -T | grep passwordauthentication',
      probeOutput: 'passwordauthentication no',
      caveat: 'Ensure the permissions on ~/.ssh (700) and authorized_keys (600) are strict, or SSH will silently ignore the keys.',
      source: `${man}man1/ssh-keygen.1.html`
    }
  ]
};
