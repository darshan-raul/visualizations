import type { LinuxPillar } from '../linux-types';
import { man, kernel, debian, nftables } from '../linux-types';

export const securityPillar: LinuxPillar = {
  id: 'security',
  name: 'Security & Access Control',
  short: 'Security',
  promise: 'Untangle Linux security architecture by exploring how independent layers—DAC, ACLs, capabilities, MAC, and firewalls—converge on every process and file operation.',
  hints: 'DAC · ACLs · capabilities · SELinux/AppArmor · firewalls · auditd · hardening',
  bridge: 'Directly connects to container security contexts, Kubernetes PodSecurityStandards (restricted/baseline), Seccomp profiles, and cloud IAM boundary enforcement.',
  groups: [
    { label: 'Access control layers', viewIds: ['rings', 'dac', 'mac', 'hardening'] },
    { label: 'Host posture & audit', viewIds: ['network', 'auth-logs', 'decision'] },
  ],
  views: [
    {
      id: 'rings',
      label: 'Control layers',
      title: 'Linux security is a multi-layered gatekeeper; every check must pass.',
      question: 'How many independent security subsystems must approve an operation before the kernel grants access?',
      kind: 'layers',
      actors: [
        { label: 'DAC & POSIX ACLs', detail: 'Checks file owner, group, mode bits (chmod), and extended ACL entries' },
        { label: 'Linux Capabilities', detail: 'Deconstructs monolithic root into 41 granular privileges (e.g. CAP_NET_BIND_SERVICE)' },
        { label: 'LSM / MAC Policy', detail: 'SELinux type enforcement or AppArmor profiles evaluate mandatory security labels' },
        { label: 'Seccomp BPF Sandbox', detail: 'Filters allowed kernel system calls, terminating or blocking unauthorized syscalls' }
      ],
      explanation: 'Linux does not possess a single "allow" switch. When a process attempts to open a file or execute a syscall, the request traverses a series of completely independent kernel security layers. Discretionary Access Control (DAC) evaluates standard permissions; Linux capabilities determine process superpowers; Linux Security Modules (LSM) enforce mandatory MAC policies; and Seccomp filters syscall vectors. A single "Deny" from any layer immediately aborts the operation with EACCES or EPERM, regardless of what the other layers allow.',
      takeaway: 'Security checks are cumulative. DAC permission does not override an AppArmor denial; a capability does not bypass a Seccomp filter.',
      command: 'su -s /bin/bash -c "cat /etc/shadow" www-data 2>&1',
      output: 'cat: /etc/shadow: Permission denied',
      probe: 'grep Cap /proc/$$/status',
      probeOutput: 'CapInh:\t0000000000000000\nCapPrm:\t0000000000000000\nCapEff:\t0000000000000000\nCapBnd:\t000001ffffffffff',
      caveat: 'Root (UID 0) bypasses standard DAC file permissions, but is completely constrained by Mandatory Access Control (SELinux/AppArmor) and Seccomp system call filters.',
      source: `${kernel}admin-guide/security-bugs.html`
    },
    {
      id: 'dac',
      label: 'File controls (DAC)',
      title: 'Discretionary Access Control evaluates permissions via a strict first-match hierarchy.',
      question: 'How does the VFS check file permissions, and why doesn\'t group membership help if you own the file?',
      kind: 'split',
      actors: [
        { label: 'Step 1: Owner Match', detail: 'Does process EUID match file i_uid? If YES, evaluate Owner bits (rwx) and STOP' },
        { label: 'Step 2: Group Match', detail: 'If not owner, does process GID/Groups match file i_gid? If YES, evaluate Group bits and STOP' },
        { label: 'Step 3: Other Match', detail: 'If neither matches, evaluate Others bits (rwx)' },
        { label: 'POSIX Extended ACLs', detail: 'If an ACL is present, named user/group entries override standard class bits' }
      ],
      explanation: 'Linux Discretionary Access Control operates via the classic 9-bit mode matrix (rwxrwxrwx) stored in the inode. The kernel VFS evaluates identity classes in a strict, non-cumulative hierarchy: if the process Effective UID matches the file owner, the owner permissions apply immediately and evaluation stops. If the owner permissions do not permit reading (e.g. 0044), access is denied immediately—the kernel never checks whether your group has read permissions! Extended ACLs (setfacl/getfacl) add granular per-user and per-group rules on top of the base mode bits.',
      takeaway: 'DAC evaluation stops at the first matching identity class: Owner -> Group -> Others. If you own the file, group permissions are never evaluated.',
      command: 'stat -c "%a %A %U:%G" /etc/shadow',
      output: '640 -rw-r----- root:shadow',
      probe: 'getfacl /var/log/syslog 2>/dev/null || echo "No ACLs set"',
      probeOutput: '# file: /var/log/syslog\n# owner: syslog\n# group: adm\nuser::rw-\ngroup::r--\nother::---',
      caveat: 'If a file is owned by your user with mode 0000, you cannot read it even if the group permissions are 0777. The owner check matches and halts evaluation.',
      source: `${man}man1/chmod.1.html`
    },
    {
      id: 'mac',
      label: 'MAC policy',
      title: 'Mandatory Access Control confines processes based on security labels and paths.',
      question: 'How do SELinux and AppArmor enforce mandatory access rules even against root processes?',
      kind: 'comparison',
      items: [
        {
          label: 'DAC (Traditional)',
          detail: 'Users and applications control file modes. Any process running as root (UID 0) bypasses all permission checks, leaving the host vulnerable if a daemon is compromised.',
          command: 'ls -l /etc/shadow',
          output: '-rw-r----- 1 root shadow 1234 Sep 16 10:00 /etc/shadow',
          highlight: 'neutral'
        },
        {
          label: 'SELinux (Label-Based)',
          detail: 'Assigns security contexts (user:role:type:level) to every process and file. Strict Type Enforcement policy matrix dictates which process domain types can access which target file types.',
          command: 'ls -Z /etc/nginx/nginx.conf 2>/dev/null || echo "system_u:object_r:httpd_config_t:s0"',
          output: 'system_u:object_r:httpd_config_t:s0 /etc/nginx/nginx.conf',
          highlight: 'good'
        },
        {
          label: 'AppArmor (Path-Based)',
          detail: 'Profiles attach directly to executable paths (/usr/sbin/nginx) and declare allowed filesystem paths, capabilities, and network calls. Default on Debian and Ubuntu.',
          command: 'aa-status 2>/dev/null | grep nginx || echo "nginx profile (enforce)"',
          output: '  /usr/sbin/nginx (enforce)',
          highlight: 'good'
        },
        {
          label: 'LSM Denial Audit (AVC)',
          detail: 'When a confined process attempts an unapproved action, the kernel LSM hook logs an Access Vector Cache (AVC) denial to the system audit stream.',
          command: 'grep -i "avc:  denied" /var/log/audit/audit.log 2>/dev/null || journalctl -t audit -g "denied" -n 1',
          output: 'type=AVC msg=audit(1694772600.123:45): avc: denied { read } for pid=421 comm="nginx" name="shadow" dev="sda1" ino=123 scontext=system_u:system_r:httpd_t:s0 tcontext=system_u:object_r:shadow_t:s0 tclass=file permissive=0',
          highlight: 'bad'
        }
      ],
      explanation: 'Mandatory Access Control (MAC) addresses the critical flaw of traditional UNIX security: that root can do anything, and users control file access. With MAC, the kernel enforces a centralized security policy across the entire machine. Even if an attacker compromises a web daemon running as root, SELinux or AppArmor prevents the process from reading /etc/shadow, accessing home directories, or opening arbitrary network sockets.',
      takeaway: 'MAC enforces the principle of least privilege against processes. Even a compromised root daemon cannot touch files outside its declared security profile.',
      command: 'sestatus 2>/dev/null || aa-status 2>/dev/null || echo "SELinux/AppArmor active"',
      output: 'SELinux status:                 enabled\nCurrent mode:                   enforcing\nLoaded policy name:             targeted',
      probe: 'grep -i avc /var/log/audit/audit.log 2>/dev/null | tail -n 1 || echo "No recent AVC denials"',
      probeOutput: '# Audit stream clean; no active confinement violations',
      caveat: 'Disabling SELinux ("setenforce 0") or disabling AppArmor is an operational antipattern. Use "audit2why" or "aa-logprof" to generate surgical policy exceptions instead.',
      source: `${man}man8/selinux.8.html`
    },
    {
      id: 'hardening',
      label: 'Server hardening',
      title: 'Baseline host hardening minimizes the attack surface through 5 core controls.',
      question: 'What baseline security posture must be established on a modern Linux server before exposing it to the network?',
      kind: 'recipe',
      recipeSteps: [
        {
          step: 'Disable Passwords & Root SSH',
          command: 'sed -i \'s/^#\\?PermitRootLogin.*/PermitRootLogin no/\' /etc/ssh/sshd_config && sed -i \'s/^#\\?PasswordAuthentication.*/PasswordAuthentication no/\' /etc/ssh/sshd_config',
          output: '',
          note: 'Enforces asymmetric Ed25519/RSA cryptographic key authentication and blocks automated brute-force attacks against the root account.'
        },
        {
          step: 'Configure Default-Deny Firewall',
          command: 'ufw default deny incoming && ufw default allow outgoing && ufw allow 22/tcp && ufw allow 443/tcp && ufw enable',
          output: '',
          note: 'Drops all unsolicited incoming network packets by default, opening strictly required listening ports.'
        },
        {
          step: 'Automated Security Patching',
          command: 'apt-get install -y unattended-upgrades && dpkg-reconfigure --priority=low unattended-upgrades',
          output: '',
          note: 'Installs critical CVE patches automatically from stable security repositories without human delay.'
        },
        {
          step: 'Kernel Sysctl Hardening',
          command: 'sysctl -w net.ipv4.tcp_syncookies=1 kernel.dmesg_restrict=1 fs.protected_hardlinks=1 fs.protected_symlinks=1',
          output: '',
          note: 'Mitigates TCP SYN flood attacks, restricts unprivileged access to dmesg kernel pointers, and prevents symlink race condition exploits.'
        },
        {
          step: 'Systemd Service Sandboxing',
          command: 'systemctl show nginx -p ProtectSystem,NoNewPrivileges,PrivateTmp',
          output: '',
          note: 'Configures ProtectSystem=strict, NoNewPrivileges=true, and PrivateTmp=true to prevent compromised daemons from gaining setuid privileges or modifying system binaries.'
        }
      ],
      explanation: 'A fresh Linux instance exposed to the internet will experience automated scanning and brute-force attacks within minutes. Host hardening reduces the attack surface: cryptographic SSH keys replace vulnerable passwords, a default-drop host firewall blocks probing, automatic security updates eliminate known CVE windows, and systemd sandboxing confines daemons in restricted namespaces.',
      takeaway: 'SSH keys over passwords, default-drop firewall rules, automated patching, and systemd service sandboxing form the core defense baseline.',
      command: 'ss -lntp',
      output: 'LISTEN 0 128   0.0.0.0:22   0.0.0.0:* users:(("sshd",pid=710,fd=3))\nLISTEN 0 511   0.0.0.0:443  0.0.0.0:* users:(("nginx",pid=750,fd=6))',
      probe: 'sysctl net.ipv4.tcp_syncookies kernel.dmesg_restrict',
      probeOutput: 'net.ipv4.tcp_syncookies = 1\nkernel.dmesg_restrict = 1',
      caveat: 'Cloud provider security groups (AWS SG, GCP VPC firewall) operate at the hypervisor layer outside the VM and should always provide the primary ingress perimeter.',
      source: `${debian}ch-securing-services.en.html`
    },
    {
      id: 'network',
      label: 'Network exposure',
      title: 'Inbound packets cross 4 distinct defense boundaries before reaching an application socket.',
      question: 'Why does an external client fail to connect even though ss -tulpn confirms the service is listening on port 443?',
      kind: 'layers',
      actors: [
        { label: 'Cloud Security Group', detail: 'Hypervisor VPC firewall filters packets before reaching virtual NIC' },
        { label: 'Host Netfilter / nftables', detail: 'Kernel PREROUTING and INPUT chains evaluate firewall rules and drop unauthorized SYN packets' },
        { label: 'Socket Bind IP', detail: 'Socket bound to 0.0.0.0 accepts traffic across all NICs; 127.0.0.1 rejects non-loopback packets' },
        { label: 'TCP Accept Backlog', detail: 'Kernel socket backlog queue accepts TCP 3-way handshake and delivers connection to accept()' }
      ],
      explanation: 'Network security is deeply layered. Even if an application is running and bound to port 443, incoming packets must survive a gauntlet: the cloud provider\'s hypervisor security group, the host operating system\'s Netfilter/nftables firewall rules, interface binding restrictions, and kernel socket queue capacity. Troubleshooting connection timeouts requires validating each boundary in order from the outside network inward.',
      takeaway: 'Troubleshoot network blocks from the outside in: Cloud Security Group -> Host nftables -> Socket Bind IP -> Accept Backlog.',
      command: 'iptables -S INPUT 2>/dev/null || nft list ruleset 2>/dev/null || echo "Host firewall active"',
      output: '-P INPUT DROP\n-A INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT\n-A INPUT -p tcp -m tcp --dport 22 -j ACCEPT\n-A INPUT -p tcp -m tcp --dport 443 -j ACCEPT',
      probe: 'ss -lnt \'sport = :443\'',
      probeOutput: 'State  Recv-Q Send-Q Local Address:Port Peer Address:Port\nLISTEN 0      511    0.0.0.0:443      0.0.0.0:*',
      caveat: 'Container runtimes like Docker and Kubernetes insert their own Netfilter chains (DOCKER, KUBE-SERVICES) that may bypass standard UFW or firewalld rules.',
      source: `${nftables}Main_Page`
    },
    {
      id: 'auth-logs',
      label: 'Authentication & audit',
      title: 'Authentication events, privilege escalations, and audit records leave immutable audit trails.',
      question: 'Where does the system record successful logins, brute-force attempts, sudo commands, and kernel audit events?',
      kind: 'walkthrough',
      steps: [
        {
          command: 'cat /var/log/auth.log | grep sshd | tail -n 3',
          output: 'Sep 16 10:00:01 devbox sshd[710]: Accepted publickey for darshan from 192.168.1.5 port 54321 ssh2: ED25519 SHA256:...\nSep 16 10:01:22 devbox sshd[715]: Invalid user admin from 10.0.0.9 port 43210\nSep 16 10:01:22 devbox sshd[715]: Connection closed by invalid user admin 10.0.0.9 port 43210 [preauth]',
          annotation: '/var/log/auth.log (or /var/log/secure on RHEL) records PAM authentication events, public key logins, and rejected password attempts.'
        },
        {
          command: 'journalctl _COMM=sudo -f -n 2',
          output: 'Sep 16 10:15:00 devbox sudo[820]: darshan : TTY=pts/0 ; PWD=/home/darshan ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow',
          annotation: 'Every sudo execution is recorded with full context: invoking user, terminal TTY, working directory, target user, and exact command string.'
        },
        {
          command: 'last -F -n 3',
          output: 'darshan  pts/0        192.168.1.5      Wed Sep 16 10:00:00 2026   still logged in\nreboot   system boot  0.0.0.0          Wed Sep 16 08:00:00 2026   still running',
          annotation: 'Parses the binary /var/log/wtmp file to display historical user login sessions, logout timestamps, remote IP addresses, and reboot events.'
        },
        {
          command: 'ausearch -m USER_AUTH,USER_CMD -ts recent',
          output: 'type=USER_CMD msg=audit(1694772600.123:45): pid=820 uid=1000 auid=1000 ses=1 subj=unconfined cmd="cat /etc/shadow" terminal=pts/0 res=success',
          annotation: 'Queries the kernel audit daemon (auditd) for cryptographically structured audit events containing immutable login UIDs (auid).'
        }
      ],
      explanation: 'Linux logs security and authentication activity through multiple complementary subsystems: PAM writes authentication attempts to auth.log/secure; sudo logs every elevated privilege execution; wtmp records session logins; and the Linux kernel audit framework (auditd) generates tamper-evident structured event records with immutable audit IDs (auid) that survive setuid transitions.',
      takeaway: 'Monitor auth.log for login attempts, journalctl _COMM=sudo for command auditing, and ausearch for tamper-resistant kernel audit logs.',
      command: 'grep -i "Failed password" /var/log/auth.log 2>/dev/null | tail -n 5 || journalctl -u ssh -g "Failed password" -n 5 --no-pager',
      output: '# Displays recent failed password attempts from brute-force scanners',
      probe: 'last -n 3',
      probeOutput: 'darshan  pts/0        192.168.1.5      Wed Sep 16 10:00   still logged in\nreboot   system boot  6.1.0-11-amd64   Wed Sep 16 08:00   still running',
      caveat: 'Local log files can be modified or erased if an attacker achieves root access. Production systems must forward logs immediately over TLS to a centralized SIEM or remote syslog server.',
      source: `${man}man8/journald.8.html`
    },
    {
      id: 'decision',
      label: 'Security diagnosis',
      title: 'A systematic chain of evidence to diagnose "Permission denied" errors.',
      question: 'When an application receives EACCES (Permission denied), how do you pinpoint the exact barrier blocking access?',
      kind: 'evidence',
      actors: [
        { label: 'Process Identity', detail: 'Verify running process UID, EUID, and supplementary GIDs via ps or /proc' },
        { label: 'Directory Traversal', detail: 'Inspect execute (+x) permissions across all parent directories via namei -om' },
        { label: 'DAC & ACL Mode', detail: 'Inspect target file owner, group, mode bits (stat), and extended ACLs (getfacl)' },
        { label: 'Mount Flags & MAC', detail: 'Check mount flags for ro/noexec in /proc/mounts and search audit.log for AVC denials' }
      ],
      explanation: 'Diagnosing blocked file access requires methodical investigation. Begin by identifying the exact numeric UID and GIDs of the worker process. Next, use "namei -om" to verify that the process possesses execute (+x) permissions on every parent directory in the path. Then inspect the target file\'s owner, group, and mode bits. Finally, check if the filesystem is mounted read-only (ro) or if SELinux/AppArmor recorded an AVC denial in the audit log.',
      takeaway: 'Never use chmod 777. Use namei to test directory traversal, inspect process credentials, and check audit logs for MAC denials.',
      command: 'namei -om /srv/app/config.json',
      output: 'f: /srv/app/config.json\n drwxr-xr-x root     root     /\n drwxr-xr-x root     root     srv\n drwxr-x--- root     appgroup app\n -rw-r----- root     appgroup config.json',
      probe: 'sudo -u www-data stat /srv/app/config.json 2>&1',
      probeOutput: 'stat: cannot stat \'/srv/app/config.json\': Permission denied',
      caveat: 'Filesystems mounted with "noexec", "nosuid", or "ro" in /etc/fstab will block execution or write operations regardless of file permissions.',
      source: `${man}man1/namei.1.html`
    }
  ]
};
