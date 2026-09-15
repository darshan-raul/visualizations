import type { LinuxPillar } from '../linux-types';
import { man, debian, systemd } from '../linux-types';

export const packagesPillar: LinuxPillar = {
  id: 'packages',
  name: 'Packages & Software',
  short: 'Packages',
  promise: 'Let\'s follow a package from repository to installed files and see why installing isn\'t the same as running.',
  hints: 'repos · deps · files · updates · pinning',
  bridge: 'Understanding Linux packages directly translates to optimizing container image layers, writing reliable Dockerfile install steps, and effective CVE patching.',
  groups: [
    { label: 'Install chain', viewIds: ['repository', 'files', 'libraries'] },
    { label: 'Runtime', viewIds: ['service', 'versioning', 'missing'] }
  ],
  views: [
    {
      id: 'repository',
      label: 'Repository & trust',
      title: 'A package manager is just a downloader that verifies signatures.',
      question: 'Where do packages come from and how do we trust them?',
      kind: 'comparison',
      items: [
        { label: 'Debian / Ubuntu (APT)', detail: 'Uses /etc/apt/sources.list and /etc/apt/sources.list.d/. GPG keys verify Release files.', command: 'apt update && apt install nginx', output: 'Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]', highlight: 'neutral' },
        { label: 'RHEL / Fedora (DNF)', detail: 'Uses /etc/yum.repos.d/. GPG keys verify individual RPM packages directly.', command: 'dnf install nginx', output: 'Fedora 39 - x86_64 - Updates  14 MB/s |  22 MB     00:01', highlight: 'neutral' },
      ],
      explanation: 'Package managers don\'t magically create software; they fetch pre-compiled binaries from HTTP servers. Trust is established via GPG signatures. If the signature doesn\'t match, the package manager refuses to install it, preventing man-in-the-middle attacks.',
      takeaway: 'Repositories are just web servers. GPG signatures ensure the files haven\'t been tampered with in transit.',
      command: 'apt-cache policy nginx',
      output: 'nginx:\n  Installed: (none)\n  Candidate: 1.22.1-9\n  Version table:\n     1.22.1-9 500\n        500 http://deb.debian.org/debian bookworm/main amd64 Packages',
      probe: 'cat /etc/apt/sources.list.d/nginx.list',
      probeOutput: 'deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/mainline/debian/ bookworm nginx',
      caveat: 'Adding random PPAs or third-party repositories grants them root execution during package install scripts. Only add trusted sources.',
      source: `${debian}apt.html`,
    },
    {
      id: 'files',
      label: 'Installed files',
      title: 'A package is just a tarball that splatters files across your disk.',
      question: 'Where did all these files go when I ran apt install?',
      kind: 'walkthrough',
      steps: [
        { command: 'dpkg -L nginx', output: '/etc/nginx\n/etc/nginx/nginx.conf\n/usr/sbin/nginx\n/lib/systemd/system/nginx.service', annotation: 'The package manager extracts files into standard filesystem locations. Configuration goes to /etc, binaries to /usr/sbin, and service definitions to /lib/systemd.' },
        { command: 'dpkg -S /etc/nginx/nginx.conf', output: 'nginx: /etc/nginx/nginx.conf', annotation: 'You can query the package database backwards: "Which package owns this file?" Crucial when you find a weird binary and want to know where it came from.' },
        { command: 'rpm -ql nginx', output: '/etc/nginx/nginx.conf\n/usr/sbin/nginx', annotation: 'On Red Hat/Fedora systems using RPM, you use rpm -ql for listing files. The concept is identical, just different tooling.' },
        { command: 'rpm -V nginx', output: 'S.5....T.  c /etc/nginx/nginx.conf', annotation: 'You can verify if installed files have been modified. Here, RPM tells us the size (S), MD5 sum (5), and timestamp (T) of nginx.conf have changed since installation.' }
      ],
      explanation: 'Installing a package doesn\'t put everything in one neat folder like Windows or macOS. It distributes files into the standard Linux hierarchy. The package manager keeps a local database mapping every installed file back to its source package.',
      takeaway: 'Packages distribute files across your system. The package manager\'s database tracks what went where.',
      command: 'dpkg-query -W -f=\'${Installed-Size} ${Package}\\n\' | sort -n | tail -n 5',
      output: '111456 linux-image-6.1.0-11-amd64\n157832 libc6-dbg\n195328 gcc-12',
      probe: 'dpkg -s nginx',
      probeOutput: 'Package: nginx\nStatus: install ok installed\nVersion: 1.22.1-9\nArchitecture: amd64',
      caveat: 'Files generated at runtime (like logs or compiled bytecode) are not tracked by the package manager.',
      source: `${man}man1/dpkg.1.html`,
    },
    {
      id: 'libraries',
      label: 'Shared libraries',
      title: 'Having the binary isn\'t enough if the shared libraries are missing.',
      question: 'Why does my binary fail to run even though the file is there?',
      kind: 'layers',
      actors: [
        { label: 'Process Execution', detail: 'You run ./my-app' },
        { label: 'Dynamic Linker', detail: 'Kernel hands control to ld-linux.so' },
        { label: 'Shared Libraries', detail: 'ld.so searches for required .so files' },
        { label: 'Main Function', detail: 'App actually starts running' }
      ],
      failure: {
        label: 'Install missing library',
        result: 'Dynamic linker resolves all symbols; binary executes',
        output: 'sudo apt-get install -y libssl-dev && ./my-app\nApplication initialized successfully.',
        blocked: 2,
        afterActors: [
          { label: 'Process Execution', detail: 'You run ./my-app' },
          { label: 'Dynamic Linker', detail: 'Kernel hands control to ld-linux.so' },
          { label: 'Shared Libraries', detail: 'ld.so finds libssl.so' },
          { label: 'Main Function', detail: 'App starts running cleanly' }
        ]
      },
      explanation: 'Most Linux binaries are dynamically linked. When you start them, the kernel actually starts the dynamic linker (ld.so), which searches your system for required shared libraries (like libssl or libc). If a library is missing, or the wrong version, the app crashes before its code even starts.',
      takeaway: 'Check ldd on your binary when it refuses to start with cryptic library errors.',
      command: 'ldd /usr/sbin/nginx',
      output: '\tlinux-vdso.so.1 (0x00007ffe34567000)\n\tlibcrypt.so.1 => /lib/x86_64-linux-gnu/libcrypt.so.1 (0x00)\n\tlibpcre2-8.so.0 => /lib/x86_64-linux-gnu/libpcre2-8.so.0\n\tlibssl.so.3 => /lib/x86_64-linux-gnu/libssl.so.3',
      probe: 'objdump -p /usr/sbin/nginx | grep NEEDED',
      probeOutput: '  NEEDED               libcrypt.so.1\n  NEEDED               libpcre2-8.so.0\n  NEEDED               libssl.so.3\n  NEEDED               libc.so.6',
      caveat: 'Statically linked binaries (like typical Go programs) bundle all dependencies and don\'t rely on ld.so, making them much more portable.',
      source: `${man}man8/ld.so.8.html`,
    },
    {
      id: 'service',
      label: 'Install ≠ running',
      title: 'Installing a package does not mean the application is running.',
      question: 'I just ran apt install. Why isn\'t my server working?',
      kind: 'split',
      actors: [
        { label: 'Package State', detail: 'dpkg -s nginx (Installed)' },
        { label: 'Unit State', detail: 'systemctl is-enabled nginx (Enabled)' },
        { label: 'Service State', detail: 'systemctl is-active nginx (Inactive)' },
        { label: 'Process State', detail: 'ps aux | grep nginx (Missing)' }
      ],
      explanation: 'Installing software is just copying files to disk. Actually running it is a separate step usually handled by systemd. Debian/Ubuntu attempt to start services automatically after installation, but RHEL/Fedora do not. Furthermore, if the default config is invalid, the service will fail to start even if it tries.',
      takeaway: 'Installing provides the files. Systemctl provides the process.',
      command: 'systemctl status nginx',
      output: '○ nginx.service - A high performance web server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)\n     Active: inactive (dead)',
      probe: 'systemctl start nginx',
      probeOutput: '# No output on success, but process is now running',
      caveat: 'Some package installs trigger post-install scripts that generate configuration, create users, or initialize databases before starting the service.',
      source: `${man}man1/systemctl.1.html`,
    },
    {
      id: 'versioning',
      label: 'Version pinning',
      title: 'Updates can break things. Sometimes you need to freeze time.',
      question: 'How do I stop apt from upgrading a specific package?',
      kind: 'walkthrough',
      steps: [
        { command: 'apt list -a postgresql-15', output: 'postgresql-15/stable 15.6-0+deb12u1 amd64 [upgradable from: 15.4-1]\npostgresql-15/now 15.4-1 amd64 [installed,upgradable]', annotation: 'Checking available versions shows we have 15.4 installed, but 15.6 is available in the repository.' },
        { command: 'apt-mark hold postgresql-15', output: 'postgresql-15 set on hold.', annotation: 'This tells the package manager to ignore this package during global apt upgrade runs. Crucial for sensitive infrastructure like databases.' },
        { command: 'apt upgrade', output: 'The following packages have been kept back:\n  postgresql-15\n0 upgraded, 0 newly installed, 0 to remove and 1 not upgraded.', annotation: 'When you upgrade the system, the held package is deliberately skipped, preventing unexpected downtime or breaking changes.' },
        { command: 'apt-mark unhold postgresql-15', output: 'Canceled hold on postgresql-15.', annotation: 'When you are ready for your planned maintenance window, you unhold the package and upgrade it explicitly.' }
      ],
      explanation: 'Unattended upgrades are great for security, but terrible for stability if applied to core databases or custom-compiled dependencies. Holding a package (pinning) gives you control over when disruptive updates happen, allowing you to test them in staging first.',
      takeaway: 'Use apt-mark hold to prevent accidental upgrades of critical infrastructure components.',
      command: 'apt-mark showhold',
      output: 'postgresql-15\nkubernetes-cni\nkubelet',
      probe: 'dpkg --get-selections | grep hold',
      probeOutput: 'postgresql-15                                   hold',
      caveat: 'Holding packages means you will not receive security patches for them. Use this tool selectively and temporarily.',
      source: `${man}man8/apt-mark.8.html`,
    },
    {
      id: 'missing',
      label: 'Broken runtime',
      title: 'A logical path to debugging a broken application.',
      question: 'My app isn\'t working. How do I trace the failure?',
      kind: 'decision',
      decisions: [
        { id: 'start', label: 'App isn\'t running', type: 'start', next: 'q-pkg' },
        { id: 'q-pkg', label: 'Is the package actually installed?', type: 'question', yes: 'q-bin', no: 'a-install' },
        { id: 'a-install', label: 'apt install the package', type: 'action', next: 'q-bin' },
        { id: 'q-bin', label: 'Does the binary exist and run manually? (Try app --version)', type: 'question', yes: 'q-cfg', no: 'a-libs' },
        { id: 'a-libs', label: 'Check ldd for missing libraries or path issues', type: 'action', next: 'q-cfg' },
        { id: 'q-cfg', label: 'Is the configuration valid? (Try app --test-config)', type: 'question', yes: 'q-svc', no: 'a-cfg' },
        { id: 'a-cfg', label: 'Fix syntax errors in /etc/app/config', type: 'action', next: 'q-svc' },
        { id: 'q-svc', label: 'Does systemctl start succeed?', type: 'question', yes: 'r-done', no: 'a-journal' },
        { id: 'a-journal', label: 'Read journalctl -u app.service for exact failure reason', type: 'action', next: 'r-done' },
        { id: 'r-done', label: 'Verify app is listening on expected ports', type: 'result' }
      ],
      explanation: 'Troubleshooting requires isolating the layers. Don\'t blindly restart systemd services without checking if the underlying binary even executes. By testing the package, then the binary, then the config, you isolate exactly where the chain is broken.',
      takeaway: 'Test from the inside out: binary → config → service wrapper.',
      command: 'nginx -t',
      output: 'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful',
      probe: 'systemctl status nginx --no-pager',
      probeOutput: '● nginx.service - A high performance web server\n     Loaded: loaded\n     Active: active (running)',
      caveat: 'AppArmor or SELinux profiles can silently block a perfectly configured application. Check dmesg or audit logs if the app dies mysteriously.',
      source: `${systemd}systemctl.html`,
    }
  ]
};
