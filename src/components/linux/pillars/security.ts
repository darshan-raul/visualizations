import type { LinuxPillar } from '../linux-types';
import { man, kernel, debian, nftables } from '../linux-types';

export const securityPillar: LinuxPillar = {
  id: 'security',
  name: 'Security',
  short: 'Security',
  promise: 'Let\'s untangle security! We\'ll see how multiple independent layers all wrap around the same process and file.',
  hints: 'DAC · capabilities · MAC · firewall · hardening · logs',
  bridge: 'Connect to container security contexts, Kubernetes RBAC + PodSecurityStandards, cloud IAM',
  groups: [
    { label: 'Access layers', viewIds: ['rings', 'dac', 'mac', 'hardening'] },
    { label: 'Host posture', viewIds: ['network', 'auth-logs', 'decision'] },
  ],
  views: [
    {
      id: 'rings',
      label: 'Control layers',
      title: 'Security layers wrap around every file operation.',
      question: 'How many permission checks does a process pass to read a file?',
      kind: 'layers',
      actors: [
        { label: 'Worker Process', detail: 'UID 33 (www-data)' },
        { label: 'DAC (Filesystem)', detail: 'Owner/Group/Mode checks' },
        { label: 'MAC Policy', detail: 'SELinux/AppArmor rules' },
        { label: 'Mount Flags', detail: 'noexec, ro (read-only)' }
      ],
      explanation: 'Linux doesn\'t have a single "allow" switch. Every operation passes through a series of independent checks. You can have the right DAC file permissions (rwx), but if SELinux denies it, or the mount is read-only, access is denied. One "Yes" doesn\'t bypass the other guards.',
      takeaway: 'Security is cumulative. A single "Deny" from any layer halts the operation, no matter what other layers say.',
      command: 'su -s /bin/bash -c "cat /etc/shadow" www-data',
      output: 'cat: /etc/shadow: Permission denied',
      probe: 'ls -l /etc/shadow',
      probeOutput: '-rw-r----- 1 root shadow 1234 Sep 15 12:00 /etc/shadow',
      caveat: 'Capabilities (like CAP_DAC_OVERRIDE) can bypass some checks, but are usually scoped to root.',
      source: `${kernel}admin-guide/security-bugs.html`
    },
    {
      id: 'dac',
      label: 'File controls (DAC)',
      title: 'Discretionary Access Control determines the base permissions.',
      question: 'How do standard Linux file permissions work?',
      kind: 'split',
      actors: [
        { label: 'Owner (User)', detail: 'Usually the creator' },
        { label: 'Group', detail: 'Shared access' },
        { label: 'Others', detail: 'Everyone else' }
      ],
      explanation: 'DAC is the classic "rwxr-xr-x" model. Every file has an owner and a group. Permissions are checked in order: if you are the owner, it applies owner permissions and stops. If not, but you are in the group, it applies group permissions. Otherwise, it uses "others". ACLs (Access Control Lists) add fine-grained user/group specifics on top of this.',
      takeaway: 'Match order matters: Owner → Group → Others. The first match defines your access.',
      command: 'stat -c "%A %U:%G" /var/log/syslog',
      output: '-rw-r----- syslog:adm',
      probe: 'getfacl /var/log/syslog 2>/dev/null || echo "No ACLs"',
      probeOutput: '# file: /var/log/syslog\n# owner: syslog\n# group: adm\nuser::rw-\ngroup::r--\nother::---',
      caveat: 'Root (UID 0) bypasses all DAC checks by default, which is why running services as root is dangerous.',
      source: `${man}man1/chmod.1.html`
    },
    {
      id: 'mac',
      label: 'MAC policy',
      title: 'Mandatory Access Control confines even root.',
      question: 'How do SELinux and AppArmor compare to standard permissions?',
      kind: 'comparison',
      items: [
        { label: 'DAC (Standard)', detail: 'Users own files and control access. Root bypasses everything.', command: 'ls -l /etc/passwd', output: '-rw-r--r-- 1 root root', highlight: 'neutral' },
        { label: 'SELinux (Red Hat)', detail: 'Label-based. Processes and files get labels (contexts). Rules dictate which process labels can touch which file labels.', command: 'ls -Z /etc/passwd', output: 'system_u:object_r:passwd_file_t:s0 /etc/passwd', highlight: 'neutral' },
        { label: 'AppArmor (Debian)', detail: 'Path-based. Profiles map to executable paths and declare what they can do.', command: 'aa-status | grep nginx', output: '  /usr/sbin/nginx (enforce)', highlight: 'neutral' },
        { label: 'Denial Logs', detail: 'Where MAC writes its complaints when it blocks something.', command: 'grep "denied" /var/log/audit/audit.log', output: 'type=AVC msg=audit(..): denied { read } for pid=123 comm="nginx" path="/secret"', highlight: 'bad' }
      ],
      explanation: 'MAC enforces policy over the whole system. Even if a web server runs as root (or gets exploited), MAC prevents it from touching files outside its designated context or profile. SELinux focuses on labels, AppArmor focuses on paths. Both write to audit logs when denying access.',
      takeaway: 'MAC means "Even if you have the key, you can\'t open this door unless it\'s your job."',
      command: 'sestatus 2>/dev/null || aa-status --enabled',
      output: 'SELinux status:                 enabled\nCurrent mode:                   enforcing',
      probe: 'journalctl | grep -i avc',
      probeOutput: 'audit[1345]: AVC apparmor="DENIED" operation="open" profile="/usr/sbin/nginx" name="/etc/shadow"',
      caveat: 'MAC policies are complex to author. Many admins incorrectly disable them ("setenforce 0") instead of fixing the labels.',
      source: `${man}man8/selinux.8.html`
    },
    {
      id: 'hardening',
      label: 'Server hardening',
      title: 'Securing a fresh Linux server involves basic, necessary steps.',
      question: 'What are the first steps to harden a new server?',
      kind: 'recipe',
      recipeSteps: [
        { step: 'Disable Root Login & Passwords', command: 'sed -i "s/PermitRootLogin yes/PermitRootLogin no/" /etc/ssh/sshd_config && sed -i "s/PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config', output: '# Reload SSH after changing config', note: 'Use SSH keys and a regular user with sudo.' },
        { step: 'Configure Firewall', command: 'ufw default deny incoming && ufw allow ssh && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable', output: 'Firewall is active and enabled on system startup', note: 'Drop all unsolicited incoming traffic by default.' },
        { step: 'Install fail2ban', command: 'apt-get install fail2ban -y', output: 'Setting up fail2ban...', note: 'Bans IPs that show malicious signs (like repeated SSH failures).' },
        { step: 'Remove Unneeded Packages', command: 'apt-get purge rpcbind xinetd -y', output: 'Removing rpcbind...', note: 'Fewer packages mean a smaller attack surface.' },
        { step: 'Enable Automatic Updates', command: 'apt-get install unattended-upgrades -y && dpkg-reconfigure --priority=low unattended-upgrades', output: 'unattended-upgrades configured', note: 'Security patches should apply automatically.' }
      ],
      explanation: 'A fresh server on the internet gets scanned and attacked within minutes. Hardening is about reducing the attack surface: removing passwords, restricting root, blocking unused ports, and staying updated.',
      takeaway: 'Keys over passwords, drop by default, and update automatically.',
      command: 'ss -lntp',
      output: 'LISTEN  0  128  0.0.0.0:22  0.0.0.0:*  users:(("sshd",pid=710,fd=3))\nLISTEN  0  511  0.0.0.0:443 0.0.0.0:*  users:(("nginx",pid=750,fd=6))',
      probe: 'ufw status verbose',
      probeOutput: 'Status: active\nLogging: on (low)\nDefault: deny (incoming), allow (outgoing), disabled (routed)',
      caveat: 'Cloud providers often provide managed firewalls (Security Groups) which should be used alongside or instead of host-based firewalls.',
      source: `${debian}ch-securing-services.en.html`
    },
    {
      id: 'network',
      label: 'Network exposure',
      title: 'A packet must cross multiple boundaries to reach an app.',
      question: 'Why can\'t I reach my service on port 443?',
      kind: 'layers',
      actors: [
        { label: 'Application Listener', detail: '0.0.0.0:443 (ss)' },
        { label: 'Host Firewall', detail: 'iptables / nftables / ufw' },
        { label: 'Cloud Security Group', detail: 'VPC Ingress Rules' },
        { label: 'Client Routing', detail: 'Internet -> Router' }
      ],
      explanation: 'Network security is deeply layered. Even if the application is bound to 0.0.0.0 (all interfaces) and listening, a packet from the outside might be blocked by the host OS firewall (nftables), the cloud provider\'s security group (AWS SG, GCP Firewall), or misrouted altogether.',
      takeaway: 'Check the listener first, then verify the host firewall, then the cloud firewall.',
      command: 'iptables -L INPUT -v -n',
      output: 'Chain INPUT (policy DROP)\n pkts bytes target     prot opt in     out     source               destination\n 120K 8000K ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            state RELATED,ESTABLISHED\n    5   300 ACCEPT     tcp  --  eth0   *       0.0.0.0/0            0.0.0.0/0            tcp dpt:443',
      probe: 'ss -lnt',
      probeOutput: 'State  Recv-Q Send-Q Local Address:Port Peer Address:Port\nLISTEN 0      511    0.0.0.0:443      0.0.0.0:*',
      caveat: 'iptables output can be overwhelmingly long when using Kubernetes or Docker, which insert their own routing chains.',
      source: `${nftables}Main_Page`
    },
    {
      id: 'auth-logs',
      label: 'Authentication & audit',
      title: 'Logs reveal who tried to do what, and when.',
      question: 'Where do I look to see who logged in or ran commands?',
      kind: 'walkthrough',
      steps: [
        { command: 'cat /var/log/auth.log | grep sshd | tail -n 3', output: 'Sep 15 10:00:01 devbox sshd[102]: Accepted publickey for user from 192.168.1.5\nSep 15 10:01:22 devbox sshd[105]: Invalid user admin from 10.0.0.9\nSep 15 10:01:22 devbox sshd[105]: Connection closed by invalid user admin 10.0.0.9', annotation: '/var/log/auth.log (or /var/log/secure on RHEL) contains authentication attempts. You can see successful logins and brute-force scans.' },
        { command: 'journalctl -t sudo --since "1 hour ago"', output: 'Sep 15 10:15:00 devbox sudo[200]: user : TTY=pts/0 ; PWD=/home/user ; USER=root ; COMMAND=/bin/cat /etc/shadow', annotation: 'Every sudo execution is logged. This shows exactly who ran what privileged command, from which terminal, and in which directory.' },
        { command: 'last -a', output: 'user     pts/0        Tue Sep 15 10:00   still logged in    192.168.1.5\nreboot   system boot  Mon Sep 14 08:00   still running      0.0.0.0', annotation: 'The "last" command reads /var/log/wtmp to show a history of successful user logins and system reboots.' },
        { command: 'faillog -a', output: 'Login       Failures Maximum Latest                   On\nroot            43       0   Tue Sep 15 10:05:00 +0000 10.0.0.9', annotation: 'faillog tracks failed authentication attempts. It\'s a quick way to spot accounts under attack.' }
      ],
      explanation: 'Authentication logging is centralized but scattered across a few specific files. The kernel and system daemons write to syslog/journald, while tools like wtmp and btmp maintain structured binary logs of sessions. Monitoring these helps detect compromise and audit administrative actions.',
      takeaway: 'auth.log, sudo logs, and last/faillog are your primary lenses into system access history.',
      command: 'grep -i "failed password" /var/log/auth.log | wc -l',
      output: '4521',
      probe: 'ausearch -m USER_AUTH -ts recent',
      probeOutput: '---- \ntime->Tue Sep 15 10:10:00 2026\ntype=USER_AUTH msg=audit(1694772600.123:45): pid=710 uid=0 auid=4294967295 ses=4294967295 msg=\'op=PAM:authentication grantors=pam_unix acct="root" exe="/usr/sbin/sshd" hostname=10.0.0.9 addr=10.0.0.9 terminal=ssh res=failed\'',
      caveat: 'Logs can be tampered with if a system is compromised. Forwarding logs to a remote, read-only server (like an SIEM) is crucial for real security.',
      source: `${man}man8/journald.8.html`
    },
    {
      id: 'decision',
      label: 'Security diagnosis',
      title: 'Diagnosing blocked access requires following the chain of evidence.',
      question: 'How do I figure out exactly why my app gets "Permission denied"?',
      kind: 'evidence',
      actors: [
        { label: 'Worker UID', detail: 'Identify the active process user' },
        { label: 'File Mode', detail: 'Check owner/group/mode' },
        { label: 'MAC Context', detail: 'Check SELinux/AppArmor' },
        { label: 'Resolution', detail: 'Apply least privilege fix' }
      ],
      explanation: 'Start by confirming the exact UID/GID the process is running as. Then stat the target file and all parent directories (a restrictive parent directory will block access to a permissive child). Check for ACLs. Finally, check MAC audit logs for denials. The fix should be the narrowest possible permission grant.',
      takeaway: 'Don\'t use chmod 777. Find the exact boundary that blocked access and surgically open it.',
      command: 'namei -mo /srv/app/secret.key',
      output: 'drwxr-xr-x root root / \ndrwxr-xr-x root root srv\ndrwxr-x--- root app  app\n-rw------- root root secret.key',
      probe: 'sudo -u www-data stat /srv/app/secret.key',
      probeOutput: 'stat: cannot stat \'/srv/app/secret.key\': Permission denied',
      caveat: 'Sometimes the "Permission denied" is because the filesystem is mounted read-only or with noexec, regardless of file permissions.',
      source: `${man}man1/namei.1.html`
    }
  ]
};
