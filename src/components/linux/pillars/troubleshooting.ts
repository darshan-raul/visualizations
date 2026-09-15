import type { LinuxPillar } from '../linux-types';
import { man, kernel } from '../linux-types';

export const troubleshootingPillar: LinuxPillar = {
  id: 'troubleshooting',
  name: 'Observability & Troubleshooting',
  short: 'Troubleshooting',
  promise: 'Time to put on your detective hat! We\'ll learn to diagnose an unreachable service by gathering evidence from the machine.',
  hints: 'logs · memory · disk · sockets · diagnosis · checklist',
  bridge: 'Connect to container debugging (kubectl logs, exec), cloud monitoring, SRE observability',
  groups: [
    { label: 'Localize', viewIds: ['incident', 'probes', 'logs-journald', 'resources'] },
    { label: 'Resolve', viewIds: ['memory-cpu', 'scenarios', 'practice'] },
  ],
  views: [
    {
      id: 'incident',
      label: 'Unreachable app',
      title: 'Break the problem down from the client\'s perspective.',
      question: 'When a user says "the site is down," what could it be?',
      kind: 'tree',
      actors: [
        { label: 'Client Error', detail: 'Connection refused / Timeout' },
        { label: 'Network Level', detail: 'DNS, Firewall, Routing' },
        { label: 'System Level', detail: 'Service down, Out of Memory' }
      ],
      explanation: 'A client timeout or connection refused could mean many things. The service might be crashed, the firewall might be dropping packets, DNS might point to the wrong IP, or the disk might be 100% full causing a hang. You must hypothesize by layer and test each one.',
      takeaway: 'Don\'t guess. Form a hypothesis (Network? System? App?) and test it with specific commands.',
      command: 'curl -v https://mysite.com',
      output: '* Rebuilt URL to: https://mysite.com/\n*   Trying 192.168.1.10...\n* TCP_NODELAY set\n* connect to 192.168.1.10 port 443 failed: Connection refused\n* Failed to connect to mysite.com port 443: Connection refused\n* Closing connection 0\ncurl: (7) Failed to connect to mysite.com port 443: Connection refused',
      probe: 'ping -c 1 mysite.com',
      probeOutput: 'PING mysite.com (192.168.1.10) 56(84) bytes of data.\n64 bytes from 192.168.1.10: icmp_seq=1 ttl=64 time=0.345 ms',
      caveat: '"Connection refused" means a server responded with an RST packet (port is closed). A "Timeout" usually means a firewall dropped the packet silently.',
      source: `${man}man1/curl.1.html`
    },
    {
      id: 'probes',
      label: 'Probe by layer',
      title: 'Use the right tool to gather evidence from the right subsystem.',
      question: 'How do I test my hypotheses?',
      kind: 'evidence',
      actors: [
        { label: 'Service', detail: 'systemctl status nginx' },
        { label: 'Sockets', detail: 'ss -lntp' },
        { label: 'Process', detail: 'ps aux | grep nginx' },
        { label: 'Logs', detail: 'journalctl -u nginx' }
      ],
      explanation: 'Instead of blindly restarting, gather evidence. Is the service active according to systemd? Is it actually listening on the expected port according to the kernel (ss)? Is the worker process running? What did it say in its logs right before it failed?',
      takeaway: 'Gather state first. Restarting destroys evidence.',
      command: 'ss -lntp | grep :443',
      output: '# Empty output - nothing is listening on port 443',
      probe: 'systemctl status nginx --no-pager',
      probeOutput: '● nginx.service - A high performance web server\n   Loaded: loaded\n   Active: failed (Result: exit-code)',
      caveat: 'Some tools like netstat are deprecated; use ss for sockets and ip for networking.',
      source: `${man}man8/ss.8.html`
    },
    {
      id: 'logs-journald',
      label: 'Logs & journald',
      title: 'Logs are the application\'s black box flight recorder.',
      question: 'How do I find out what an application was complaining about?',
      kind: 'walkthrough',
      steps: [
        { command: 'journalctl -u nginx.service -e', output: 'Sep 15 14:02:11 devbox systemd[1]: Starting A high performance web server...\nSep 15 14:02:11 devbox nginx[890]: nginx: [emerg] bind() to 0.0.0.0:443 failed (98: Address already in use)\nSep 15 14:02:11 devbox systemd[1]: nginx.service: Control process exited, code=exited, status=1/FAILURE', annotation: 'Use -u to filter by a specific systemd unit, and -e to jump to the end (the newest logs). Here we see a clear error: the port is in use.' },
        { command: 'journalctl --since "10 minutes ago" -p err', output: 'Sep 15 13:55:01 devbox kernel: Out of memory: Killed process 842 (python3) total-vm:1048576kB, anon-rss:512000kB, file-rss:0kB\nSep 15 14:02:11 devbox nginx[890]: nginx: [emerg] bind() to 0.0.0.0:443 failed', annotation: 'Filter temporally (--since) and by priority (-p err) to cut through the noise of informational logs.' },
        { command: 'tail -f /var/log/nginx/access.log', output: '192.168.1.100 - - [15/Sep/2026:14:05:12 +0000] "GET /api/data HTTP/1.1" 500 120 "-" "curl/7.81.0"', annotation: 'Not all logs go to journald. Many applications (especially web servers and databases) write to their own files in /var/log/. Use tail -f to watch them live.' }
      ],
      explanation: 'Linux logging is a mix of the modern, structured journald and traditional flat text files in /var/log. System services generally log to journald, which captures both standard output and syslog messages. Reading logs is usually the fastest way to pinpoint a failure.',
      takeaway: 'Let the application tell you what\'s wrong. Always check journalctl -u <service> and /var/log/<service>.',
      command: 'journalctl -k -n 5',
      output: '# Shows the last 5 kernel messages (dmesg equivalent)',
      probe: 'ls -l /var/log',
      probeOutput: 'drwxr-xr-x 2 root   root     4096 Sep 15 00:00 apt\n-rw-r----- 1 syslog adm     12345 Sep 15 14:10 auth.log\ndrwxr-xr-x 2 root   root     4096 Sep 15 14:02 nginx\n-rw-r----- 1 syslog adm     45678 Sep 15 14:15 syslog',
      caveat: 'Logs rotate! If you are looking for an error from yesterday, it might be in a compressed file like syslog.1 or /var/log/nginx/error.log.1.gz.',
      source: `${man}man1/journalctl.1.html`
    },
    {
      id: 'resources',
      label: 'Resource clues',
      title: 'Services crash when they run out of fundamental resources.',
      question: 'What system limits commonly cause applications to fail?',
      kind: 'split',
      actors: [
        { label: 'Memory', detail: 'OOM Killer strikes' },
        { label: 'Disk Blocks', detail: 'No space left on device' },
        { label: 'Inodes', detail: 'Too many tiny files' },
        { label: 'File Descriptors', detail: 'Too many open connections' }
      ],
      explanation: 'Resource exhaustion causes bizarre app behaviors. "No space left on device" happens when disk blocks are full (df -h). Less obviously, it happens if inodes are exhausted by millions of empty files (df -i). The OOM killer terminates memory-hungry processes to save the kernel. Maxed-out file descriptors prevent accepting new network connections.',
      takeaway: 'Check df -h, df -i, free -h, and dmesg -T | grep -i oom.',
      command: 'df -h /',
      output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   50G     0 100% /',
      probe: 'dmesg -T | grep -i "out of memory"',
      probeOutput: '[Tue Sep 15 13:55:01 2026] Out of memory: Killed process 842 (python3)',
      caveat: 'Resource limits can also be enforced at the systemd unit level (LimitNOFILE=) or via cgroups in containers, overriding system-wide limits.',
      source: `${man}man1/free.1.html`
    },
    {
      id: 'memory-cpu',
      label: 'Memory & CPU diagnosis',
      title: 'Understand performance by reading the right meters.',
      question: 'How do I know if the server is overloaded?',
      kind: 'walkthrough',
      steps: [
        { command: 'uptime', output: ' 14:20:01 up 10 days,  4:12,  2 users,  load average: 4.52, 3.10, 2.85', annotation: 'Load average shows the number of processes waiting for CPU or disk I/O over 1, 5, and 15 minutes. If it\'s higher than your CPU core count, the system is burdened.' },
        { command: 'free -h', output: '               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       6.1Gi       200Mi        50Mi       1.5Gi       1.2Gi\nSwap:          2.0Gi       1.8Gi       200Mi', annotation: 'Look at "available" (not free). Available memory includes cache that the kernel can drop instantly. Heavy swap usage indicates memory pressure and hurts performance.' },
        { command: 'top -bn1 | head -n 12', output: '%Cpu(s): 85.0 us, 10.0 sy,  0.0 ni,  3.0 id,  2.0 wa,  0.0 hi,  0.0 si,  0.0 st\nMiB Mem :   8000.0 total,   200.0 free,   6200.0 used,   1600.0 buff/cache\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n  842 myapp     20   0   4.2g   3.1g  20000 S  95.0  40.0 120:05.10 python3', annotation: 'top shows real-time process usage. "us" is user CPU, "sy" is kernel (system), "wa" is I/O wait. Here, python3 is eating a whole core and a ton of RAM.' },
        { command: 'vmstat 1 3', output: 'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 3  0 188400 204800  50000 1500000 1024  512  2048  1024 1500 2000 85 10  3  2', annotation: 'vmstat tracks virtual memory and block I/O. High si/so (swap in/out) means active thrashing. High bi/bo (blocks in/out) or wa (wait) points to a disk bottleneck.' }
      ],
      explanation: 'Performance diagnosis is about finding the bottleneck: CPU, Memory, Disk I/O, or Network. High load average isn\'t necessarily bad unless it correlates with slow response times. Memory "free" looks artificially low on Linux because unused memory is aggressively used to cache disk reads.',
      takeaway: 'Available RAM matters more than Free RAM. CPU Wait (%wa) often means your disk is too slow.',
      command: 'htop',
      output: '# Interactive color-coded process viewer (requires installation)',
      probe: 'cat /proc/cpuinfo | grep processor | wc -l',
      probeOutput: '4',
      caveat: 'In virtualized/cloud environments, "st" (steal time) in top shows time the hypervisor took away from your VM to serve other tenants.',
      source: `${man}man1/top.1.html`
    },
    {
      id: 'scenarios',
      label: 'Failure board',
      title: 'Practice diagnosing different classes of failures.',
      question: 'Can you spot the difference between a network block and an app crash?',
      kind: 'evidence',
      actors: [
        { label: 'DNS', detail: 'Resolution' },
        { label: 'Service', detail: 'Systemd state' },
        { label: 'Socket', detail: 'Kernel listening port' },
        { label: 'Client', detail: 'Request result' }
      ],
      explanation: 'The same "website is down" symptom can originate from totally different root causes. A stopped service refuses connections instantly. A firewall drop causes a timeout. A DNS failure fails before touching the network. OOM kills the process unexpectedly. You must triangulate using different tools.',
      takeaway: 'Different failures leave different evidence signatures. Cross-reference them.',
      command: 'systemctl is-failed nginx',
      output: 'failed',
      probe: 'nslookup mysite.com',
      probeOutput: 'Server:		127.0.0.53\nAddress:	127.0.0.53#53\n\nNon-authoritative answer:\nName:	mysite.com\nAddress: 192.168.1.10',
      caveat: 'This view supports interactive scenarios on the UI.',
      source: `${man}man8/ss.8.html`
    },
    {
      id: 'practice',
      label: 'Five-minute server check',
      title: 'A rapid checklist to assess server health.',
      question: 'If you log into a broken server, what do you type first?',
      kind: 'recipe',
      recipeSteps: [
        { step: 'Check load and uptime', command: 'uptime', output: 'up 4 days, load average: 0.10, 0.05, 0.01', note: 'Is the box overloaded right now? Did it recently reboot?' },
        { step: 'Check disk space', command: 'df -h', output: '/dev/sda1 50G 48G 2G 97% /', note: 'Is a full disk crashing the database or preventing log writes?' },
        { step: 'Check memory pressure', command: 'free -h', output: 'Mem: 8Gi used 6Gi available 1.5Gi', note: 'Are we swapping heavily? Is there available RAM?' },
        { step: 'Check listening services', command: 'ss -lntp', output: 'LISTEN 0 511 0.0.0.0:443 0.0.0.0:* users:(("nginx",pid=750,fd=6))', note: 'Are the expected ports open and bound to the right processes?' },
        { step: 'Check failed services', command: 'systemctl --failed', output: 'UNIT LOAD ACTIVE SUB DESCRIPTION\n0 loaded units listed.', note: 'Did systemd give up trying to start something critical?' },
        { step: 'Check recent errors', command: 'journalctl -p err --since "1 hour ago"', output: '-- No entries --', note: 'Are there any glaring kernel or application errors in the logs?' },
        { step: 'Check top CPU hogs', command: 'top -bn1 | head -15', output: '%Cpu(s): 1.5 us, 0.5 sy... ', note: 'Is a specific process consuming all resources?' }
      ],
      explanation: 'When responding to an incident, run a standard diagnostic checklist before changing anything. This 5-minute check verifies the fundamental resources (CPU, RAM, Disk) and service state (Systemd, Sockets, Logs). If all these pass, the issue is likely deeper in the application logic or network path.',
      takeaway: 'Develop muscle memory for initial triage. Check the basics before diving into complex debuggers.',
      command: 'history | tail -n 10',
      output: '# See what the last person was doing before it broke.',
      probe: 'dmesg -T | tail -n 10',
      probeOutput: '[Tue Sep 15 14:10:22 2026] Firewall: *DROP* IN=eth0 OUT= MAC=... SRC=1.2.3.4 DST=192.168.1.10 LEN=40 TOS=0x00 PREC=0x00 TTL=241 ID=54321 PROTO=TCP SPT=45678 DPT=22 WINDOW=65535 RES=0x00 SYN URGP=0',
      caveat: 'These commands give a point-in-time snapshot. For historical trends, you need a metrics system like Prometheus.',
      source: `${kernel}admin-guide/index.html`
    }
  ]
};
