import type { LinuxPillar } from '../linux-types';
import { man, kernel } from '../linux-types';

export const troubleshootingPillar: LinuxPillar = {
  id: 'troubleshooting',
  name: 'Observability & Troubleshooting',
  short: 'Troubleshooting',
  promise: 'Put on your detective hat and diagnose unreachable services, saturated resources, and kernel faults by gathering empirical system evidence.',
  hints: 'USE method · load average · journald · OOM killer · inodes · file descriptors · triage',
  bridge: 'Directly connects to Kubernetes pod triage (CrashLoopBackOff, OOMKilled, Evicted), cloud incident response, and production SRE observability.',
  groups: [
    { label: 'Triage & localization', viewIds: ['incident', 'probes', 'logs-journald', 'resources'] },
    { label: 'Root cause & resolution', viewIds: ['memory-cpu', 'scenarios', 'practice'] },
  ],
  views: [
    {
      id: 'incident',
      label: 'Unreachable app',
      title: 'Deconstruct service outages into verifiable failure signatures.',
      question: 'When a user reports "the site is down," how do you isolate network, host, and application root causes?',
      kind: 'tree',
      actors: [
        { label: 'Client Error Signal', detail: 'Connection refused (TCP RST) vs Connection timed out (packet dropped silently)' },
        { label: 'Network Transport', detail: 'DNS resolution failure, route blackhole, or host/cloud firewall DROP rules' },
        { label: 'Host Resource Health', detail: 'Out of memory (OOM), 100% disk blocks full, or exhausted inode metadata slots' },
        { label: 'Application State', detail: 'Systemd service inactive, worker crashed, or thread stuck in uninterruptible disk wait (D state)' }
      ],
      explanation: 'A client error code is the first clue in an incident investigation. A "Connection refused" error means the target IP received the packet, but no socket was listening on that port, causing the kernel to respond immediately with a TCP RST packet. A "Connection timed out" error means packets vanished into the void—typically dropped by an ingress firewall or security group. Form a hypothesis based on the error signature and verify each layer with specific commands before modifying system state.',
      takeaway: 'Connection refused means the host is alive but the port is closed (TCP RST). Connection timed out means a firewall or routing rule dropped the packet silently.',
      command: 'curl -Iv https://devbox-01:443 2>&1 | head -n 10',
      output: '* Trying 10.0.1.17:443...\n* TCP_NODELAY set\n* connect to 10.0.1.17 port 443 failed: Connection refused\n* Failed to connect to devbox-01 port 443: Connection refused\n* Closing connection 0\ncurl: (7) Failed to connect to devbox-01 port 443: Connection refused',
      probe: 'ping -c 2 10.0.1.17',
      probeOutput: 'PING 10.0.1.17 (10.0.1.17) 56(84) bytes of data.\n64 bytes from 10.0.1.17: icmp_seq=1 ttl=64 time=0.210 ms\n64 bytes from 10.0.1.17: icmp_seq=2 ttl=64 time=0.198 ms\n\n--- 10.0.1.17 ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss',
      caveat: 'Reverse proxies (nginx, AWS ALB) return HTTP 502 (Bad Gateway) when the upstream application crashes, and HTTP 504 (Gateway Timeout) when the application hangs or exhausts its worker pool.',
      source: `${man}man1/curl.1.html`
    },
    {
      id: 'probes',
      label: 'Probe by layer',
      title: 'The USE Method: Systematically inspect Utilization, Saturation, and Errors.',
      question: 'How do senior SREs triage an unfamiliar server incident without guessing or running random commands?',
      kind: 'evidence',
      actors: [
        { label: 'CPU Subsystem', detail: 'Utilization (%Cpu in top) · Saturation (run-queue in vmstat) · Errors (hardware MCE in mcelog)' },
        { label: 'Memory Subsystem', detail: 'Utilization (free -m available) · Saturation (vmstat si/so swap activity) · Errors (OOM killer in dmesg)' },
        { label: 'Storage I/O Subsystem', detail: 'Utilization (%util in iostat) · Saturation (await queue latency) · Errors (dmesg I/O errors, full blocks df -h)' },
        { label: 'Network Stack', detail: 'Utilization (ip -s link throughput) · Saturation (netstat -s listen drops) · Errors (NIC frame drops, retransmits)' }
      ],
      explanation: 'Instead of guessing or blindly restarting daemons, apply Brendan Gregg\'s USE Method: for every hardware and software resource (CPU, Memory, Storage, Network), inspect Utilization (percentage of time the resource was busy), Saturation (the degree to which extra work is queued waiting for service), and Errors (explicit fault counters). Gathering empirical evidence across these four dimensions isolates the constrained bottleneck within minutes.',
      takeaway: 'Apply the USE Method: for CPU, Memory, Storage, and Network, systematically verify Utilization, Saturation, and Errors.',
      command: 'vmstat 1 3',
      output: 'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 1  0      0 204800  50000 1500000    0    0    12    45  500  800 15  5 78  2  0\n 1  0      0 204650  50000 1500000    0    0     0     0  450  750 12  4 84  0  0\n 1  0      0 204600  50000 1500000    0    0     0    20  480  790 14  5 81  0  0',
      probe: 'iostat -xz 1 2 2>/dev/null || sar -d 1 2 2>/dev/null || df -h /',
      probeOutput: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   18G   30G  38% /',
      caveat: 'High CPU utilization alone is not an incident if latency and error rates remain within acceptable SLOs; prioritize diagnosing Saturation (processes queued waiting for CPU or disk).',
      source: `${man}man8/ss.8.html`
    },
    {
      id: 'logs-journald',
      label: 'Logs & journald',
      title: 'Systemd journald and /var/log provide high-fidelity chronological flight data.',
      question: 'How do you navigate systemd\'s structured binary journal to find the exact moment an outage began?',
      kind: 'walkthrough',
      steps: [
        {
          command: 'journalctl -u nginx.service --since "15 minutes ago" --no-pager',
          output: 'Sep 16 14:02:11 devbox systemd[1]: Starting A high performance web server...\nSep 16 14:02:11 devbox nginx[890]: nginx: [emerg] bind() to 0.0.0.0:443 failed (98: Address already in use)\nSep 16 14:02:11 devbox systemd[1]: nginx.service: Control process exited, code=exited, status=1/FAILURE\nSep 16 14:02:11 devbox systemd[1]: nginx.service: Failed with result \'exit-code\'.',
          annotation: 'Filter strictly by unit name (-u) and time window (--since) to isolate the target service failure without drowning in unrelated system logs.'
        },
        {
          command: 'journalctl -p err..alert -b --no-pager | tail -n 5',
          output: 'Sep 16 14:02:11 devbox nginx[890]: nginx: [emerg] bind() to 0.0.0.0:443 failed (98: Address already in use)\nSep 16 14:02:11 devbox systemd[1]: Failed to start A high performance web server.',
          annotation: 'Filter by syslog priority (-p err..alert) for the current boot session (-b) to reveal all critical host-level warnings and errors.'
        },
        {
          command: 'journalctl -k -e --no-pager',
          output: 'Sep 16 13:55:01 devbox kernel: Out of memory: Killed process 842 (python3) total-vm:2097152kB, anon-rss:1048576kB, file-rss:0kB\nSep 16 13:55:01 devbox kernel: oom_reaper: reaped process 842 (python3), now anon-rss:0kB',
          annotation: 'Use -k to inspect the kernel message ring buffer (dmesg equivalent), exposing hardware faults, link state changes, and OOM killer events.'
        },
        {
          command: 'tail -f /var/log/nginx/error.log',
          output: '2026/09/16 14:02:11 [emerg] 890#890: bind() to 0.0.0.0:443 failed (98: Address already in use)',
          annotation: 'Not all application logs route to journald; traditional daemons frequently maintain dedicated text log files in /var/log/.'
        }
      ],
      explanation: 'Modern Linux systems centralize logging in systemd-journald, which captures standard output, standard error, syslog events, and kernel messages into structured binary journal files. Querying journald with targeted flags (-u for service unit, -p for severity priority, -k for kernel events, and --since for time boundaries) allows operators to isolate failure sequences in seconds.',
      takeaway: 'Filter journald by unit (-u), priority (-p err), and time window (--since) to rapidly pinpoint service failure causes.',
      command: 'journalctl -u nginx.service -n 5 --no-pager',
      output: 'Sep 16 14:02:11 devbox nginx[890]: nginx: [emerg] bind() to 0.0.0.0:443 failed (98: Address already in use)\nSep 16 14:02:11 devbox systemd[1]: nginx.service: Control process exited, code=exited, status=1/FAILURE',
      probe: 'dmesg -T | tail -n 5',
      probeOutput: '[Wed Sep 16 13:55:01 2026] Out of memory: Killed process 842 (python3) total-vm:2097152kB, anon-rss:1048576kB, file-rss:0kB',
      caveat: 'If /var/log/journal does not exist, journald stores logs in /run/log/journal/ (volatile RAM), causing all historical logs to be lost on system reboot.',
      source: `${man}man1/journalctl.1.html`
    },
    {
      id: 'resources',
      label: 'Resource clues',
      title: 'Resource exhaustion hits 4 distinct operational cliffs; each has unique symptoms.',
      question: 'Which resource limit causes cryptic application crashes when CPU and general memory appear healthy?',
      kind: 'split',
      actors: [
        { label: 'Disk Storage Blocks', detail: 'df -h /: 100% full prevents database writes, logs, and PID creation (ENOSPC)' },
        { label: 'Inode Metadata Slots', detail: 'df -i /: 100% full blocks creating new files even when gigabytes of disk space remain free (ENOSPC)' },
        { label: 'File Descriptors (FDs)', detail: 'cat /proc/sys/fs/file-nr: Process or system-wide exhaustion causes "Too many open files" (EMFILE)' },
        { label: 'Memory Pressure & OOM', detail: 'dmesg | grep oom: Kernel out-of-memory killer terminates processes based on badness score' }
      ],
      explanation: 'Operating system failures frequently stem from hitting one of four critical resource ceilings: Data Blocks (df -h full), Inode Slots (df -i full, usually caused by millions of tiny session or cache files), File Descriptors (reaching per-process RLIMIT_NOFILE or system file-max), or Memory (where the kernel invokes the OOM killer to terminate processes and salvage the host). Each condition triggers distinct error codes in application logs.',
      takeaway: 'Always verify all four resource cliffs: df -h (blocks), df -i (inodes), ulimit -n (file descriptors), and dmesg -T | grep -i oom (memory).',
      command: 'df -h / && df -i /',
      output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   49G     0 100% /\nFilesystem     Inodes IUsed IFree IUse% Mounted on\n/dev/sda1        3.2M  3.2M     0  100% /',
      probe: 'cat /proc/sys/fs/file-nr',
      probeOutput: '1280    0    524288\n# Allocated FDs: 1280 · Free allocated: 0 · Maximum allowable FDs: 524,288',
      caveat: 'Per-process file descriptor limits (configured via /etc/security/limits.conf or systemd LimitNOFILE=) are typically set much lower (1024 or 65536) than the system-wide maximum.',
      source: `${man}man1/free.1.html`
    },
    {
      id: 'memory-cpu',
      label: 'Memory & CPU diagnosis',
      title: 'Deconstructing CPU load average, memory pressure, and swap thrashing.',
      question: 'Why can a system have high load average with low CPU utilization, and what does "free" memory really mean on Linux?',
      kind: 'walkthrough',
      steps: [
        {
          command: 'uptime',
          output: ' 14:20:01 up 10 days,  4:12,  2 users,  load average: 8.52, 6.10, 4.85',
          annotation: 'Load average reflects threads in Runnable (R) state PLUS Uninterruptible Sleep (D, waiting for disk/NFS I/O). A load average higher than your CPU core count with low %CPU indicates an I/O bottleneck, not CPU saturation.'
        },
        {
          command: 'free -h',
          output: '               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       4.1Gi       300Mi        50Mi       3.4Gi       3.3Gi\nSwap:          2.0Gi       100Mi       1.9Gi',
          annotation: 'Ignore "free" memory. Linux aggressively repurposes unused RAM as Page Cache and buffers to accelerate disk reads. "Available" memory is the true metric—the RAM reclaimable without swapping.'
        },
        {
          command: 'vmstat 1 3',
          output: 'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 4  2 102400 307200  51200 3481600 1024  512  2048  1024 2500 4000 45 20 15 20  0',
          annotation: 'Inspect "si" (swap-in) and "so" (swap-out). Non-zero continuous swap I/O indicates memory exhaustion and active thrashing, leading to massive latency spikes.'
        },
        {
          command: 'top -b -n 1 | head -n 15',
          output: '%Cpu(s): 45.0 us, 20.0 sy,  0.0 ni, 15.0 id, 20.0 wa,  0.0 hi,  0.0 si,  0.0 st\nMiB Mem :   8000.0 total,    300.0 free,   4200.0 used,   3500.0 buff/cache\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n  842 myapp     20   0   4.2g   3.1g  20000 D  45.0  40.0 120:05.10 python3',
          annotation: 'Inspect CPU states: "us" (user space), "sy" (kernel syscalls), "wa" (iowait waiting on disk), and "st" (hypervisor steal time). Notice PID 842 in "D" state (uninterruptible disk wait).'
        }
      ],
      explanation: 'Understanding Linux performance requires looking past surface metrics. A machine with only 300 MB of "free" RAM may actually have 3.3 GB of "available" memory ready to be reclaimed from the kernel Page Cache. Similarly, a high load average combined with high "%wa" (iowait) indicates that processes are blocked waiting on slow storage disks rather than competing for CPU compute cores.',
      takeaway: 'Available RAM, not Free RAM, measures memory headroom. High load average with high %wa indicates a disk I/O bottleneck.',
      command: 'free -h',
      output: '               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       4.1Gi       300Mi        50Mi       3.4Gi       3.3Gi\nSwap:          2.0Gi       100Mi       1.9Gi',
      probe: 'vmstat 1 2',
      probeOutput: 'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 1  0 102400 307200  51200 3481600    0    0     0     0  500  800 10  4 86  0  0',
      caveat: 'In virtualized cloud instances (AWS EC2, GCP Compute Engine), high "%st" (steal time) in top means the underlying physical CPU is oversubscribed and other virtual machines are starving your CPU.',
      source: `${man}man1/top.1.html`
    },
    {
      id: 'scenarios',
      label: 'Failure board',
      title: 'Interactive incident simulation matrix: Diagnose 8 real-world host failure modes.',
      question: 'Can you correctly identify whether a service failure is caused by DNS, bind scope, firewall drop, OOM, or disk exhaustion?',
      kind: 'evidence',
      actors: [
        { label: 'DNS Resolution', detail: 'getent hosts devbox-01: Verifies name resolution before network transport' },
        { label: 'Service Lifecycle', detail: 'systemctl status nginx: Verifies unit state, PID, and cgroup exit codes' },
        { label: 'Socket Listener', detail: 'ss -tulpn: Checks bound IP (0.0.0.0 vs 127.0.0.1) and port availability' },
        { label: 'Client Probe', detail: 'curl -Iv https://devbox-01:443: Tests end-to-end transport and HTTP response' }
      ],
      explanation: 'Identical surface symptoms—such as "website is down" or "API unreachable"—can stem from completely distinct root causes across the stack. A stopped service refuses connections instantly; a firewall DROP causes client connection timeouts; a DNS failure aborts before network transmission; and kernel OOM kills the worker process without warning. You must cross-examine evidence from multiple subsystems to isolate the truth.',
      takeaway: 'Different root causes leave distinct evidence fingerprints. Cross-examine systemd status, socket listeners, firewall rules, and kernel logs.',
      command: 'systemctl is-active nginx && ss -lnt \'sport = :443\'',
      output: 'active\nLISTEN 0 511 127.0.0.1:443 0.0.0.0:*',
      probe: 'journalctl -u nginx -n 5 --no-pager',
      probeOutput: 'Sep 16 10:00:00 devbox systemd[1]: Started A high performance web server.',
      caveat: 'Use the interactive Incident Simulation selector above to load and diagnose all 8 real-world failure fixtures.',
      source: `${man}man8/ss.8.html`
    },
    {
      id: 'practice',
      label: 'Five-minute server check',
      title: 'The 60-Second Linux Triage Runbook: First commands on an unfamiliar broken host.',
      question: 'When an emergency alert fires and you SSH into a broken server, what exact command sequence should you run?',
      kind: 'recipe',
      recipeSteps: [
        {
          step: 'Check Uptime & Load Average',
          command: 'uptime',
          output: ' 14:20:01 up 10 days,  4:12,  2 users,  load average: 0.15, 0.20, 0.18',
          note: 'How long has the machine been up? Did an unexpected reboot occur? Is load average spiking above CPU core count?'
        },
        {
          step: 'Check Kernel Messages & Faults',
          command: 'dmesg -T | tail -n 25',
          output: '[Wed Sep 16 14:10:00 2026] EXT4-fs error (device sda1): remounted read-only',
          note: 'Look for hardware errors, filesystem remounts to read-only (EROFS), OOM killer executions, and network link drops.'
        },
        {
          step: 'Check Available Memory & Swap',
          command: 'free -h',
          output: '               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       4.1Gi       300Mi        50Mi       3.4Gi       3.3Gi\nSwap:          2.0Gi       100Mi       1.9Gi',
          note: 'Verify available memory headroom and ensure swap is not actively thrashing.'
        },
        {
          step: 'Check Storage Blocks & Inodes',
          command: 'df -h && df -i',
          output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   48G    2G  96% /\nFilesystem     Inodes IUsed IFree IUse% Mounted on\n/dev/sda1        3.2M  3.1M  100K  97% /',
          note: 'Check whether data blocks or inode slots are approaching 100% exhaustion on root (/) or /var.'
        },
        {
          step: 'Check Listening Network Ports',
          command: 'ss -tulpn',
          output: 'Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process\ntcp   LISTEN 0      128          0.0.0.0:22        0.0.0.0:*    users:(("sshd",pid=710,fd=3))\ntcp   LISTEN 0      511          0.0.0.0:443       0.0.0.0:*    users:(("nginx",pid=750,fd=6))',
          note: 'Are expected service ports open and bound to 0.0.0.0 (all interfaces) rather than 127.0.0.1 (loopback)?'
        },
        {
          step: 'Check Failed Systemd Units',
          command: 'systemctl --failed',
          output: 'UNIT LOAD ACTIVE SUB DESCRIPTION\n0 loaded units listed.',
          note: 'Did any core background service or scheduled timer unit crash or enter a failed restart state?'
        },
        {
          step: 'Check Real-Time Resource Hogs',
          command: 'top -b -n 1 | head -n 17',
          output: '%Cpu(s): 12.0 us,  4.0 sy,  0.0 ni, 82.0 id,  2.0 wa,  0.0 hi,  0.0 si,  0.0 st\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n  750 nginx     20   0  145200  24500  12000 S   5.0   0.3   5:12.30 nginx',
          note: 'Identify processes consuming excessive CPU, memory, or pinned in uninterruptible disk wait (D state).'
        }
      ],
      explanation: 'When responding to a production incident, follow a standardized diagnostic ladder before making changes or restarting daemons. The 60-second triage runbook systematically checks CPU load, kernel hardware logs, memory pressure, storage block/inode headroom, listening sockets, failed systemd units, and top processes. Gathering this baseline evidence prevents destroying diagnostic clues.',
      takeaway: 'Execute the 60-second triage ladder in order: uptime -> dmesg -> free -> df -> ss -> systemctl --failed -> top.',
      command: 'uptime && free -h && df -h /',
      output: ' 14:20:01 up 10 days,  4:12,  2 users,  load average: 0.15, 0.20, 0.18\n               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       4.1Gi       300Mi        50Mi       3.4Gi       3.3Gi\nFilesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   18G   30G  38% /',
      probe: 'systemctl --failed',
      probeOutput: '0 loaded units listed.',
      caveat: 'Never blindly reboot or restart services during an incident before gathering triage evidence; restarting clears transient logs, memory states, and network sockets.',
      source: `${kernel}admin-guide/index.html`
    }
  ]
};
