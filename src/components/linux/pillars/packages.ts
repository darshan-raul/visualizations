import type { LinuxPillar } from '../linux-types';
import { man, debian, systemd } from '../linux-types';

export const packagesPillar: LinuxPillar = {
  id: 'packages',
  name: 'Packages & Software',
  short: 'Packages',
  promise: 'Follow a package from signed repository to unpacked files and runtime dynamic linking, and see why installing is not running.',
  hints: 'repos · GPG trust · dpkg/rpm · ld.so · dynamic linking · pinning · systemd',
  bridge: 'Understanding Linux package management directly translates to minimizing container image layers, authoring deterministic Dockerfiles, and patching host CVEs without downtime.',
  groups: [
    { label: 'Install pipeline', viewIds: ['repository', 'files', 'libraries'] },
    { label: 'Runtime lifecycle', viewIds: ['service', 'versioning', 'missing'] }
  ],
  views: [
    {
      id: 'repository',
      label: 'Repository & trust',
      title: 'A package manager is a cryptographically verified distribution pipeline.',
      question: 'Where do deb and rpm packages originate, and how does the system prove authenticity before execution?',
      kind: 'comparison',
      items: [
        {
          label: 'Debian / Ubuntu (APT)',
          detail: 'Configured in /etc/apt/sources.list.d/. Validated via detached GPG signatures on InRelease metadata in /usr/share/keyrings/. Packages.gz supplies per-package SHA256 checksums.',
          command: 'apt-cache policy nginx',
          output: 'nginx:\n  Installed: 1.22.1-9\n  Candidate: 1.22.1-9\n  Version table:\n *** 1.22.1-9 500\n        500 http://deb.debian.org/debian bookworm/main amd64 Packages',
          highlight: 'neutral'
        },
        {
          label: 'RHEL / Fedora (DNF/RPM)',
          detail: 'Configured in /etc/yum.repos.d/*.repo. Validated via repomd.xml signatures; individual RPM package headers embed detached GPG signatures verified before unpacking.',
          command: 'dnf info nginx',
          output: 'Name         : nginx\nVersion      : 1.24.0\nRelease      : 1.el9\nArchitecture : x86_64\nRepository   : @System\nFrom repo    : epel',
          highlight: 'neutral'
        },
        {
          label: 'GPG Keyring Security',
          detail: 'Modern APT stores armored GPG public keys in /usr/share/keyrings/ rather than legacy trusted.gpg. The signed-by directive strictly limits key authority to a single repo.',
          command: 'gpg --show-keys /usr/share/keyrings/nginx-archive-keyring.gpg',
          output: 'pub   rsa2048 2011-08-19 [SC] [expires: 2027-04-12]\n      573B FD6B 3D8F BC64 1079  A6AB ABF5 BD82 7BD9 BF62\nuid   nginx signing key <signing-key@nginx.com>',
          highlight: 'good'
        },
        {
          label: 'Maintainer Script Risk',
          detail: 'Packages execute maintainer scripts (preinst, postinst, prerm, postrm) as root during installation with zero container sandboxing. Malicious PPAs can compromise the host.',
          command: 'head -n 15 /var/lib/dpkg/info/nginx.postinst',
          output: '#!/bin/sh\nset -e\nif [ "$1" = "configure" ]; then\n    if ! getent passwd nginx >/dev/null; then\n        adduser --system --quiet --group --home /var/cache/nginx nginx\n    fi\nfi',
          highlight: 'bad'
        }
      ],
      explanation: 'Package managers do not compile software; they download pre-built binary archives from static HTTP mirrors. Trust is established mathematically: the repository Release file is signed with a private GPG key, which matches a public key in your local keyring. The Release file lists SHA256 hashes for all package index files, which in turn specify hashes for each .deb archive. If a single byte is modified in transit, the package manager halts installation.',
      takeaway: 'Repositories are static HTTP mirrors; trust is anchored by local GPG keyrings and chained SHA256 checksums.',
      command: 'apt-cache policy nginx',
      output: 'nginx:\n  Installed: 1.22.1-9\n  Candidate: 1.22.1-9\n  Version table:\n *** 1.22.1-9 500\n        500 http://deb.debian.org/debian bookworm/main amd64 Packages',
      probe: 'cat /etc/apt/sources.list.d/nginx.sources 2>/dev/null || cat /etc/apt/sources.list.d/nginx.list 2>/dev/null || grep -v "^#" /etc/apt/sources.list | head -n 3',
      probeOutput: 'deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/mainline/debian/ bookworm nginx',
      caveat: 'Maintainer scripts (preinst/postinst) run as unrestricted root. Adding random PPAs or running "curl | bash" allows third parties to execute arbitrary code on your system.',
      source: `${debian}apt.html`,
    },
    {
      id: 'files',
      label: 'Installed files',
      title: 'A package is an archive that unpacks into the filesystem hierarchy.',
      question: 'Where do binaries, configs, and unit files land when unpacking, and how does the database track ownership?',
      kind: 'walkthrough',
      steps: [
        {
          command: 'dpkg -L nginx',
          output: '/etc/nginx\n/etc/nginx/nginx.conf\n/lib/systemd/system/nginx.service\n/usr/sbin/nginx\n/usr/share/man/man8/nginx.8.gz',
          annotation: 'The package database records every file extracted into the Filesystem Hierarchy Standard (FHS). Binaries go to /usr/sbin, configs to /etc, and unit files to /lib/systemd/system.'
        },
        {
          command: 'dpkg -S /etc/nginx/nginx.conf',
          output: 'nginx: /etc/nginx/nginx.conf',
          annotation: 'Query the database backwards: "Which package owns this path?" Essential for identifying unknown binaries or validating config file origins during incident response.'
        },
        {
          command: 'dpkg -V nginx',
          output: '??5?????? c /etc/nginx/nginx.conf',
          annotation: 'Verifies installed files against database MD5 checksums. "5" denotes that nginx.conf MD5 digest has changed from the upstream maintainer version due to local editing.'
        },
        {
          command: 'dpkg-query -W -f=\'${Package} ${Installed-Size} ${Status}\\n\' nginx',
          output: 'nginx 1240 install ok installed',
          annotation: 'Inspect low-level package status in /var/lib/dpkg/status. Status indicates whether the package is cleanly installed, half-configured, or scheduled for removal.'
        }
      ],
      explanation: 'Linux packages do not install into isolated application folders like macOS bundles. Instead, the archive extracts files across standard directories: executables into /usr/bin or /usr/sbin, configuration files into /etc, libraries into /usr/lib, and man pages into /usr/share/man. The local database (/var/lib/dpkg or /var/lib/rpm) stores a complete index of all extracted files and MD5 checksums.',
      takeaway: 'Use dpkg -L to find where files landed, dpkg -S to identify file ownership, and dpkg -V to detect modified configurations.',
      command: 'dpkg -S /usr/sbin/nginx',
      output: 'nginx: /usr/sbin/nginx',
      probe: 'dpkg -V nginx 2>/dev/null || rpm -V nginx 2>/dev/null',
      probeOutput: '??5?????? c /etc/nginx/nginx.conf',
      caveat: 'Files generated dynamically at runtime (access logs in /var/log, databases in /var/lib, cache in /var/cache) are not tracked by dpkg and remain on disk after "apt remove".',
      source: `${man}man1/dpkg.1.html`,
    },
    {
      id: 'libraries',
      label: 'Shared libraries',
      title: 'The dynamic linker binds shared ELF libraries at runtime before main().',
      question: 'Why does an installed binary fail with "error while loading shared libraries" even though the file exists?',
      kind: 'layers',
      actors: [
        { label: 'Process Exec', detail: 'Kernel execve() reads ELF binary header' },
        { label: 'Dynamic Linker', detail: 'Hands control to /lib64/ld-linux-x86-64.so.2' },
        { label: 'DT_NEEDED Lookup', detail: 'Parses required .so names: libssl.so, libc.so' },
        { label: 'ld.so Cache', detail: 'Consults /etc/ld.so.cache and maps pages via mmap()' }
      ],
      failure: {
        label: 'Rebuild ld.so cache after library install',
        result: 'Dynamic linker resolves all DT_NEEDED symbols; execution enters application main()',
        output: 'sudo apt-get install -y libssl3 && sudo ldconfig\n/usr/sbin/nginx -v\nnginx version: nginx/1.22.1',
        blocked: 2,
        afterActors: [
          { label: 'Process Exec', detail: 'Kernel execve() loads ELF binary' },
          { label: 'Dynamic Linker', detail: 'ld-linux-x86-64.so.2 active' },
          { label: 'DT_NEEDED Lookup', detail: 'All library symbols resolved' },
          { label: 'Application Entry', detail: 'Jumps to application main() cleanly' }
        ]
      },
      explanation: 'Most Linux binaries are dynamically linked ELF executables. When executed, the kernel starts the dynamic linker (ld-linux.so), which parses the binary\'s DT_NEEDED ELF tags to find required shared libraries (.so files). The linker searches in a strict priority order: DT_RPATH/RUNPATH, LD_LIBRARY_PATH, the compiled binary cache in /etc/ld.so.cache, and standard system paths (/lib, /usr/lib). If any library is missing or incompatible, the process aborts with exit code 127 before main() ever executes.',
      takeaway: 'Inspect dynamic library requirements with ldd or readelf -d; update the linker cache with ldconfig after installing custom libraries.',
      command: 'ldd /usr/sbin/nginx',
      output: '\tlinux-vdso.so.1 (0x00007ffe12345000)\n\tlibcrypt.so.1 => /lib/x86_64-linux-gnu/libcrypt.so.1 (0x00007f1234000000)\n\tlibpcre2-8.so.0 => /lib/x86_64-linux-gnu/libpcre2-8.so.0 (0x00007f1234100000)\n\tlibssl.so.3 => /lib/x86_64-linux-gnu/libssl.so.3 (0x00007f1234200000)\n\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f1234300000)',
      probe: 'readelf -d /usr/sbin/nginx | grep -E "(NEEDED|RPATH|RUNPATH)"',
      probeOutput: ' 0x0000000000000001 (NEEDED)             Shared library: [libcrypt.so.1]\n 0x0000000000000001 (NEEDED)             Shared library: [libpcre2-8.so.0]\n 0x0000000000000001 (NEEDED)             Shared library: [libssl.so.3]\n 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]',
      caveat: 'ldd may execute untrusted binaries under certain linker configurations; for untrusted binaries, inspect ELF headers safely using "readelf -d" or "objdump -p".',
      source: `${man}man8/ld.so.8.html`,
    },
    {
      id: 'service',
      label: 'Install ≠ running',
      title: 'Package installation extracts files; it does not guarantee a running process or socket.',
      question: 'Why does an application fail to respond immediately after running "apt install" or "dnf install"?',
      kind: 'split',
      actors: [
        { label: 'Package State', detail: 'dpkg -s nginx: Status: install ok installed' },
        { label: 'Systemd Unit', detail: 'systemctl is-enabled nginx: enabled in multi-user.target' },
        { label: 'Cgroup Process', detail: 'systemctl is-active nginx: active (running) with PID 418' },
        { label: 'Network Socket', detail: 'ss -tulpn: LISTEN on 0.0.0.0:80' }
      ],
      explanation: 'Installing software simply writes files into the filesystem hierarchy. Transforming those static files into an active, listening server requires distinct orchestration steps: the package manager must invoke systemd triggers, systemd must parse the unit file, spawn the executable in an isolated cgroup slice, and the application must successfully bind to its configured network sockets. On Debian/Ubuntu, packages attempt to start immediately upon install; on RHEL/Fedora, services default to disabled and stopped.',
      takeaway: 'Installing writes files to disk. Running requires systemd service activation and successful socket binding.',
      command: 'systemctl status nginx',
      output: '● nginx.service - A high performance web server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)\n     Active: active (running) since Wed 2026-09-16 10:00:00 UTC; 2h ago\n   Main PID: 418 (nginx)\n      Tasks: 2 (limit: 4915)\n     Memory: 8.2M\n        CPU: 120ms\n     CGroup: /system.slice/nginx.service\n             ├─418 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"\n             └─421 "nginx: worker process"',
      probe: 'systemctl is-enabled nginx && systemctl is-active nginx',
      probeOutput: 'enabled\nactive',
      caveat: 'If the default configuration contains an error or the target port is occupied, the package post-install script may fail, leaving the package in a half-configured state ("iF" in dpkg).',
      source: `${man}man1/systemctl.1.html`,
    },
    {
      id: 'versioning',
      label: 'Version pinning',
      title: 'Package pinning protects production systems from unintended breaking upgrades.',
      question: 'How do you freeze critical database and runtime packages while applying security patches across the host?',
      kind: 'walkthrough',
      steps: [
        {
          command: 'apt list -a postgresql-15',
          output: 'postgresql-15/stable 15.6-0+deb12u1 amd64 [upgradable from: 15.4-1]\npostgresql-15/now 15.4-1 amd64 [installed,upgradable]',
          annotation: 'Query repository version candidate table. We have 15.4 installed, while 15.6 is available in upstream repositories.'
        },
        {
          command: 'apt-mark hold postgresql-15',
          output: 'postgresql-15 set on hold.',
          annotation: 'Sets the package state flag to "hold" in the package database, instructing apt upgrade to skip this package during automated updates.'
        },
        {
          command: 'apt-get upgrade -s',
          output: 'The following packages have been kept back:\n  postgresql-15\n0 upgraded, 0 newly installed, 0 to remove and 1 not upgraded.',
          annotation: 'Simulate system upgrade: apt deliberately skips the held package, preserving database compatibility until the planned maintenance window.'
        },
        {
          command: 'cat /etc/apt/preferences.d/postgres-pin',
          output: 'Package: postgresql-15\nPin: version 15.4*\nPin-Priority: 1001',
          annotation: 'For fleet automation, enforce version locks via APT Pin-Priority. A priority > 1000 prevents upgrades even across repository suite transitions.'
        }
      ],
      explanation: 'Unattended upgrades are critical for host security, but automated major or minor version bumps can break database schemas or API contracts. Holding a package (or configuring APT Pin-Priority) instructs the resolver to freeze that specific package at its current version while continuing to patch the rest of the operating system.',
      takeaway: 'Use apt-mark hold or /etc/apt/preferences.d/ pinning to prevent automated upgrades of stateful databases and critical runtimes.',
      command: 'apt-mark showhold',
      output: 'postgresql-15\nkubelet\nkubeadm\nkubectl',
      probe: 'dpkg --get-selections | grep hold',
      probeOutput: 'postgresql-15                                   hold\nkubelet                                         hold',
      caveat: 'Held packages do not receive security updates. Track pinned CVEs in your vulnerability management pipeline and schedule explicit upgrade windows.',
      source: `${man}man8/apt-mark.8.html`,
    },
    {
      id: 'missing',
      label: 'Broken runtime',
      title: 'A systematic diagnosis tree to isolate runtime application failures.',
      question: 'When an application fails to start or respond after an update, how do you isolate where the failure occurred?',
      kind: 'decision',
      decisions: [
        { id: 'start', label: 'Service down / Unresponsive', type: 'start', next: 'q-pkg' },
        { id: 'q-pkg', label: 'Is package cleanly installed? (dpkg -s app)', type: 'question', yes: 'q-bin', no: 'a-pkg' },
        { id: 'a-pkg', label: 'Resolve half-installed state: apt-get install -f', type: 'action', next: 'q-bin' },
        { id: 'q-bin', label: 'Does the binary execute syntax check? (app -t / --version)', type: 'question', yes: 'q-unit', no: 'a-ldd' },
        { id: 'a-ldd', label: 'Inspect missing libraries with ldd; run ldconfig or install deps', type: 'action', next: 'q-unit' },
        { id: 'q-unit', label: 'Does systemd service start cleanly? (systemctl start app)', type: 'question', yes: 'q-port', no: 'a-journal' },
        { id: 'a-journal', label: 'Read journalctl -u app.service -e for exact exit codes or missing dirs', type: 'action', next: 'q-port' },
        { id: 'q-port', label: 'Is app listening on configured network sockets? (ss -tulpn)', type: 'question', yes: 'r-ok', no: 'a-bind' },
        { id: 'a-bind', label: 'Check for port conflicts or loopback-only bind address (127.0.0.1)', type: 'action', next: 'r-ok' },
        { id: 'r-ok', label: 'Service verified: package valid, binary linked, unit active, socket listening', type: 'result' }
      ],
      explanation: 'Troubleshooting software requires isolating system layers from the inside out: Package database -> Binary dynamic linking -> Configuration syntax -> Systemd unit manager -> Network socket binding. Blindly restarting services without checking these boundaries destroys ephemeral logs and masks the root cause.',
      takeaway: 'Test from the inside out: Package database -> Binary dynamic linker -> Config syntax -> Systemd unit -> Network socket.',
      command: 'nginx -t',
      output: 'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful',
      probe: 'systemctl status nginx --no-pager',
      probeOutput: '● nginx.service - A high performance web server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)\n     Active: active (running)',
      caveat: 'AppArmor and SELinux policies can silently block an otherwise valid binary from reading configuration files or binding ports. Check dmesg or audit.log for AVC denials.',
      source: `${systemd}systemctl.html`,
    }
  ]
};
