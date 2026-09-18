import type { LinuxPillar } from '../linux-types';
import { man, systemd } from '../linux-types';

export const processesPillar: LinuxPillar = {
  id: 'processes',
  name: 'Processes & Services',
  short: 'Processes',
  promise: 'Watch an executable file on disk wake up and become an active kernel task with virtual memory segments, open file descriptors, signal masks, and a supervised systemd lifecycle.',
  hints: 'PID · task_struct · signals · FDs · systemd · cgroups',
  bridge: 'Containers are not virtual machines; they are ordinary Linux processes isolated by namespaces and throttled by cgroup controllers under the host kernel.',
  groups: [
    { label: 'Runtime', viewIds: ['fork', 'tree', 'fds', 'signals'] },
    { label: 'Services', viewIds: ['unit', 'unit-files', 'env-vars', 'failed'] },
  ],
  views: [
    {
      id: 'fork',
      label: 'Program to PID',
      title: 'A program is passive ELF machine code; a process is an active kernel task.',
      question: 'How does an executable file on disk become a live running process?',
      kind: 'path',
      actors: [
        { label: 'ELF Binary on Disk', detail: 'Read-only executable machine code (/usr/sbin/nginx)' },
        { label: 'clone() / fork() Syscall', detail: 'Kernel duplicates task_struct; marks memory pages Copy-on-Write (CoW)' },
        { label: 'execve() Syscall', detail: 'Clears old memory; maps ELF Text, Data, BSS, Heap, and Stack segments' },
        { label: 'Running task_struct', detail: 'Scheduler queues new PID 418 in CPU runqueue; jumps to entry point' }
      ],
      explanation: 'Transforming an executable into a running process requires two fundamental kernel operations. First, fork() or clone() creates a duplicate of the calling process, allocating a new task_struct and duplicating memory page table pointers marked Copy-on-Write (CoW). Next, execve() unmaps the old address space, inspects the ELF binary header, creates fresh virtual memory segments (Text, Data, Heap, Stack), loads shared libraries, and transfers CPU execution to the program entry point.',
      takeaway: 'Executables are passive storage bytes; processes are dynamic kernel tasks with virtual memory, credentials, and state.',
      command: 'ps -eo pid,ppid,user,stat,comm | grep nginx',
      output: '  418     1 root     Ss   nginx\n  421   418 www-data S    nginx',
      probe: 'readlink /proc/418/exe',
      probeOutput: '/usr/sbin/nginx',
      caveat: 'Copy-on-Write (CoW) ensures fork() is fast: physical RAM pages are shared read-only until either parent or child writes to memory, triggering a minor page fault to copy the page.',
      source: `${man}man2/execve.2.html`,
    },
    {
      id: 'tree',
      label: 'Process tree',
      title: 'The process hierarchy: parentage, orphan adoption, and zombie states.',
      question: 'Who started this process, and what happens when a parent process crashes?',
      kind: 'interactive-tree',
      treeData: {
        pid: 1,
        comm: 'systemd',
        state: 'S',
        user: 'root',
        desc: 'Root of userspace, adopts orphans',
        children: [
          {
            pid: 418,
            comm: 'nginx',
            state: 'S',
            user: 'root',
            desc: 'Master process, manages workers',
            children: [
              {
                pid: 421,
                comm: 'nginx',
                state: 'S',
                user: 'www-data',
                desc: 'Worker process, handles requests',
                children: []
              },
              {
                pid: 422,
                comm: 'nginx',
                state: 'S',
                user: 'www-data',
                desc: 'Worker process, handles requests',
                children: []
              }
            ]
          },
          {
            pid: 800,
            comm: 'sshd',
            state: 'S',
            user: 'root',
            desc: 'SSH daemon listening for connections',
            children: [
              {
                pid: 1024,
                comm: 'sshd',
                state: 'S',
                user: 'root',
                desc: 'Privilege separated SSH session',
                children: [
                  {
                    pid: 1025,
                    comm: 'bash',
                    state: 'S',
                    user: 'darshan',
                    desc: 'Interactive shell',
                    children: [
                      {
                        pid: 2048,
                        comm: 'top',
                        state: 'R',
                        user: 'darshan',
                        desc: 'System monitor',
                        children: []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      explanation: 'All Linux processes exist within a strict genealogical tree rooted at PID 1 (systemd). When a child process terminates, it transitions to state EXIT_ZOMBIE (Z) where its memory is freed, but its exit status remains in the kernel task list until its parent calls waitpid(). If a parent terminates before its children, the kernel reparents the surviving orphaned children to PID 1, which periodically reaps them.',
      takeaway: 'Process management flows hierarchically down the tree. Zombies are dead processes waiting for their parent to read their exit status.',
      command: 'pstree -p 418',
      output: 'nginx(418)─┬─nginx(421)\n           └─nginx(422)',
      probe: 'grep PPid /proc/421/status',
      probeOutput: 'PPid:\t418',
      caveat: 'If a parent process is stuck in an uninterruptible sleep (D state) and fails to call wait(), zombie children accumulate in the process table and cannot be killed by kill -9.',
      source: `${man}man1/pstree.1.html`,
    },
    {
      id: 'fds',
      label: 'Open handles',
      title: 'File Descriptors: how processes interface with files, pipes, and sockets.',
      question: 'How does a process address open files, network connections, and pipes?',
      kind: 'tree',
      actors: [
        { label: 'FD Table (files_struct)', detail: 'Kernel array of pointers from integer indexes to struct file' },
        { label: 'FD 0, 1, 2', detail: 'Standard Input (stdin), Standard Output (stdout), Standard Error (stderr)' },
        { label: 'FD 7 (Regular File)', detail: 'Open write handle to /var/log/nginx/access.log' },
        { label: 'FD 11 (TCP Socket)', detail: 'Listening socket on 0.0.0.0:443 (inode [123456])' }
      ],
      explanation: 'To a Linux process, all external resources are accessed through File Descriptors (FDs)—small non-negative integers indexing into the process files_struct table. Each FD points to a kernel struct file containing the current read/write offset, access mode flags, and pointers to the underlying inode or socket buffer. When an application exhausts its configured file descriptor limit (RLIMIT_NOFILE), further open() or accept() calls fail with EMFILE (Too many open files).',
      takeaway: 'Files, sockets, pipes, and event loops (epoll) all present as integer FDs; check them via /proc/<pid>/fd or lsof.',
      command: 'ls -l /proc/421/fd',
      output: 'lrwx------ 1 www-data www-data 64 Sep 18 19:40 0 -> /dev/null\nlrwx------ 1 www-data www-data 64 Sep 18 19:40 1 -> /dev/null\nl-wx------ 1 www-data www-data 64 Sep 18 19:40 7 -> /var/log/nginx/access.log\nlrwx------ 1 www-data www-data 64 Sep 18 19:40 11 -> socket:[123456]',
      probe: 'cat /proc/421/limits | grep "Max open files"',
      probeOutput: 'Max open files            65535                65535                files',
      caveat: 'The system-wide open file limit is controlled by /proc/sys/fs/file-max, while per-process limits are configured via ulimit -n or LimitNOFILE= in systemd units.',
      source: `${man}man5/proc.5.html`,
    },
    {
      id: 'signals',
      label: 'Signals & job control',
      title: 'Asynchronous kernel notifications and process interrupt handling.',
      question: 'Which signal should you send, and what happens when the kernel delivers it?',
      kind: 'reference',
      headers: ['Signal', 'Number', 'Catchable?', 'Default Action', 'Operational Purpose'],
      rows: [
        ['SIGHUP', '1', 'Yes', 'Terminate', 'Reload configuration without dropping connections (nginx, sshd)'],
        ['SIGINT', '2', 'Yes', 'Terminate', 'Terminal interrupt (Ctrl+C): polite request to cancel active work'],
        ['SIGQUIT', '3', 'Yes', 'Core Dump', 'Terminal quit (Ctrl+\\): stops execution and writes core dump file'],
        ['SIGKILL', '9', 'NO (Uncatchable)', 'Terminate', 'Kernel unconditionally evicts task from runqueue; no cleanup runs'],
        ['SIGUSR1', '10', 'Yes', 'Terminate', 'Application-defined: commonly used to reopen rotated log files'],
        ['SIGTERM', '15', 'Yes', 'Terminate', 'Polite shutdown request: allows process to finish work and close sockets'],
        ['SIGSTOP', '19', 'NO (Uncatchable)', 'Stop / Freeze', 'Kernel immediately freezes process execution; resumes on SIGCONT'],
        ['SIGCONT', '18', 'Yes', 'Continue', 'Resumes execution of a previously stopped process'],
      ],
      tableNote: 'SIGTERM is the default signal sent by kill and systemctl stop. Always attempt SIGTERM before SIGKILL; SIGKILL prevents in-flight buffers from flushing and corrupts database state.',
      explanation: 'Signals are asynchronous software interrupts delivered by the kernel to a process task_struct. When a signal arrives, the kernel checks the process signal mask (sigset_t). If unblocked, the kernel interrupts user space execution and jumps to an application-installed signal handler function. If no handler exists, the kernel executes the default action (terminate, core dump, ignore, or stop). Two signals CANNOT be caught, blocked, or ignored: SIGKILL (9) and SIGSTOP (19).',
      takeaway: 'SIGTERM requests polite termination with graceful buffer flushing; SIGKILL forcefully terminates at the kernel level without cleanup.',
      command: 'kill -l',
      output: ' 1) SIGHUP   2) SIGINT   3) SIGQUIT  4) SIGILL   5) SIGTRAP  6) SIGABRT\n 9) SIGKILL 10) SIGUSR1 11) SIGSEGV 12) SIGUSR2 13) SIGPIPE 14) SIGALRM\n15) SIGTERM 18) SIGCONT 19) SIGSTOP 20) SIGTSTP',
      probe: 'grep -E "^(SigBlk|SigIgn|SigCgt):" /proc/421/status',
      probeOutput: 'SigBlk:\t0000000000000000\nSigIgn:\t0000000000000006\nSigCgt:\t0000000180014a01',
      caveat: 'Processes in state D (Uninterruptible Sleep) are blocked waiting for hardware I/O and will NOT respond to any signal—including SIGKILL—until the I/O completes.',
      source: `${man}man7/signal.7.html`,
    },
    {
      id: 'unit',
      label: 'Unit state',
      title: 'Installed vs Enabled vs Active: separating boot configuration from runtime.',
      question: 'How do you determine whether a systemd service is active, enabled, or failed?',
      kind: 'split',
      actors: [
        { label: 'Installed on Disk', detail: 'Unit file exists in /lib/systemd/system or /etc/systemd/system' },
        { label: 'Enabled at Boot', detail: 'Symlinked in multi-user.target.wants to automatically start on boot' },
        { label: 'Active at Runtime', detail: 'Kernel cgroup slice contains running process (e.g. system.slice/nginx.service)' }
      ],
      explanation: 'System administration requires separating persistent boot intent from dynamic runtime state. An installed unit exists on disk but does nothing. An enabled unit has a symlink in /etc/systemd/system/*.wants/ ensuring PID 1 launches it when the boot target is reached. An active unit is currently running inside its own dedicated cgroup slice. A service can be enabled but failed (crashed on boot), or active but disabled (running now, but will not restart after reboot).',
      takeaway: 'Enable controls boot startup; start controls current execution. Always verify both using systemctl is-enabled and is-active.',
      command: 'systemctl is-enabled nginx && systemctl is-active nginx',
      output: 'enabled\nactive',
      probe: 'systemctl status nginx --no-pager',
      probeOutput: '● nginx.service - A high performance web server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)\n     Active: active (running) since Wed 2026-09-18 19:40:00 UTC\n   Main PID: 418 (nginx)\n      Tasks: 2 (limit: 9514)\n     Memory: 14.2M (max: 512.0M)\n        CPU: 120ms\n     CGroup: /system.slice/nginx.service\n             ├─418 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"\n             └─421 "nginx: worker process"',
      caveat: 'systemd creates a dedicated cgroup slice for every service (e.g. system.slice/nginx.service). When you stop a service, systemd guarantees all child workers in that cgroup are terminated.',
      source: `${systemd}systemctl.html`,
    },
    {
      id: 'unit-files',
      label: 'systemd unit files',
      title: 'Unit file anatomy: declarative process supervision and security sandboxing.',
      question: 'What directives configure a systemd service, and how do you enforce least-privilege runtime?',
      kind: 'walkthrough',
      steps: [
        { command: 'cat /etc/systemd/system/nginx.service.d/override.conf', output: '[Unit]\nDescription=High Performance Web Server\nAfter=network-online.target remote-fs.target\nWants=network-online.target', annotation: 'The [Unit] section defines metadata and ordering. After= specifies sequence; Wants= specifies a non-blocking dependency.' },
        { command: '# Inspect [Service] execution & sandboxing', output: '[Service]\nType=forking\nPIDFile=/run/nginx.pid\nExecStart=/usr/sbin/nginx\nExecReload=/bin/kill -s HUP $MAINPID\nRestart=on-failure\nRestartSec=5s', annotation: 'Type=forking expects the parent to fork and exit. Restart=on-failure automatically restarts crashes but ignores clean exits.' },
        { command: '# Modern security isolation directives', output: 'ProtectSystem=strict\nProtectHome=yes\nPrivateTmp=yes\nNoNewPrivileges=yes\nCapabilityBoundingSet=CAP_NET_BIND_SERVICE', annotation: 'systemd built-in sandboxing: mounts / read-only except /srv, hides /home, gives isolated /tmp, and strips all root capabilities except binding port 443.' },
        { command: 'sudo systemctl daemon-reload', output: '# systemd unit cache reloaded in memory', annotation: 'ALWAYS run systemctl daemon-reload after editing unit files. systemd caches unit graphs in memory; edits are invisible until reloaded.' }
      ],
      explanation: 'A systemd unit file is a declarative service contract. The [Unit] section configures dependency ordering. The [Service] section configures execution lifecycle, process types (simple, forking, notify), restart policies, and kernel security hardening. Directives like ProtectSystem=strict, PrivateTmp=yes, and CapabilityBoundingSet allow systemd to build tight kernel namespaces and seccomp filters around the service without modifying application source code.',
      takeaway: 'Use drop-in override files (systemctl edit <service>) rather than modifying vendor files in /lib/systemd/system.',
      command: 'systemctl show nginx --property=ActiveState,SubState,MainPID,MemoryCurrent',
      output: 'ActiveState=active\nSubState=running\nMainPID=418\nMemoryCurrent=14888960',
      probe: 'systemd-analyze security nginx',
      probeOutput: '→ Overall exposure level for nginx.service: 2.1 OK (Protected by systemd sandboxing)',
      caveat: 'systemd-analyze security audits any unit file against modern Linux kernel security directives and outputs an exposure score from 0 (safest) to 10 (unsafe).',
      source: `${systemd}systemd.service.html`,
    },
    {
      id: 'env-vars',
      label: 'Environment variables',
      title: 'Context propagation: how environment strings are passed via the process stack.',
      question: 'How do processes receive environment variables, and why do background services lack shell profiles?',
      kind: 'walkthrough',
      steps: [
        { command: 'echo $PATH', output: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', annotation: 'PATH is an environment variable in your interactive shell process. When you run a command without an absolute path, the shell searches these directories in order.' },
        { command: 'cat /proc/421/environ | tr "\\0" "\\n" | grep -E "(PATH|STAGE)"', output: 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin\nSTAGE=production', annotation: 'The kernel stores environment variables as a null-delimited array on the process stack. /proc/<pid>/environ provides unalterable evidence of what the process was given at launch.' },
        { command: 'cat /etc/default/nginx', output: 'STAGE="production"\nWORKER_PROCESSES=auto', annotation: 'systemd daemons do NOT source ~/.bashrc or /etc/profile! They read variables exclusively from Environment= or EnvironmentFile= directives.' }
      ],
      explanation: 'When execve() creates a process, it places an array of key=value string pointers onto the new stack frame above argv. In C, these are accessed through the global pointer environ. Children inherit a copy of their parent environment variables during fork(). A universal operational gotcha is running a command manually in a shell where it succeeds, but watching it fail under systemd or cron because shell profile variables (PATH, AWS_PROFILE) were never loaded into the daemon environment.',
      takeaway: 'Daemons do not inherit shell profiles; inspect /proc/<pid>/environ to verify the exact variables delivered to a running process.',
      command: 'strings /proc/421/environ | grep STAGE',
      output: 'STAGE=production',
      probe: 'env -i PATH="/usr/bin" /usr/sbin/nginx -t',
      probeOutput: 'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful',
      caveat: 'Never pass passwords or API tokens as command-line arguments (ps aux leaks them); pass them via environment variables or secret files, but restrict /proc/<pid>/environ access.',
      source: `${man}man7/environ.7.html`,
    },
    {
      id: 'failed',
      label: 'Service won\'t start',
      title: 'Systematic service triage: from unit failure to root-cause isolation.',
      question: 'A service fails to start or crashes in a restart loop. Where do you look first?',
      kind: 'decision',
      decisions: [
        { id: 'start', label: 'Service won\'t start (status: failed / activating)', type: 'start', next: 'q-status' },
        { id: 'q-status', label: 'Does systemctl status show an exit code or signal?', type: 'question', yes: 'q-journal', no: 'a-unit' },
        { id: 'a-unit', label: 'Unit file missing or invalid: run systemctl daemon-reload', type: 'action', next: 'q-status' },
        { id: 'q-journal', label: 'Inspect journalctl -u <service> -n 30 --no-pager: is there a syntax error?', type: 'question', yes: 'a-syntax', no: 'q-port' },
        { id: 'a-syntax', label: 'Fix syntax error in configuration file; test with daemon -t or --dry-run', type: 'action', next: 'r-done' },
        { id: 'q-port', label: 'Is there a "bind: Address already in use" error?', type: 'question', yes: 'a-killconflict', no: 'q-perms' },
        { id: 'a-killconflict', label: 'Find conflicting process holding port using ss -tlnp and stop it', type: 'action', next: 'r-done' },
        { id: 'q-perms', label: 'Is there a "Permission denied" or EACCES error on socket/PID/log?', type: 'question', yes: 'a-fixperms', no: 'q-oom' },
        { id: 'a-fixperms', label: 'Correct file ownership (chown) and directory traversal (+x)', type: 'action', next: 'r-done' },
        { id: 'q-oom', label: 'Did the kernel OOM killer terminate the process (signal 9 / status 137)?', type: 'question', yes: 'a-raiseoom', no: 'r-escalate' },
        { id: 'a-raiseoom', label: 'Increase cgroup MemoryMax= in unit or optimize application footprint', type: 'action', next: 'r-done' },
        { id: 'r-done', label: 'Restart service with systemctl start and verify active (running)', type: 'result' },
        { id: 'r-escalate', label: 'Check dmesg -T for kernel hardware I/O or SELinux audit denials', type: 'result' },
      ],
      explanation: 'When a service fails to start, never restart blindly in a loop. Follow an evidence-based triage ladder: 1. Inspect unit status for the exact exit code (e.g. exit 1 = app error, exit 137 = OOM killer, exit 203 = binary not found); 2. Read journalctl -u <service> -n 50 for the exact stderr error message; 3. Distinguish syntax errors from port collisions, permission denials, and memory exhaustion.',
      takeaway: 'Exit codes tell what happened; journalctl explains why it happened. Follow the diagnostic tree before changing configuration.',
      command: 'systemctl status nginx --no-pager',
      output: '● nginx.service - A high performance web server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)\n     Active: failed (Result: exit-code) since Wed 2026-09-18 19:40:12 UTC\n    Process: 9812 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (code=exited, status=1/FAILURE)',
      probe: 'journalctl -u nginx -n 3 --no-pager',
      probeOutput: 'nginx[9812]: nginx: [emerg] bind() to 0.0.0.0:443 failed (98: Address already in use)\nnginx[9812]: nginx: [emerg] still could not bind()',
      caveat: 'Status code 203/EXEC indicates systemd could not execute the binary (missing file, wrong architecture, or execute permission missing). Status 137 indicates the OOM killer or kill -9.',
      source: `${systemd}systemctl.html`,
    },
  ],
};
