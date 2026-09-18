import type { LinuxPillar } from '../linux-types';
import { man, bash } from '../linux-types';

export const shellPillar: LinuxPillar = {
  id: 'shell',
  name: 'Shell & Automation',
  short: 'Shell',
  promise: 'Peek behind the prompt to see how the shell parses command lines, routes data through kernel pipes, manages file descriptors, and executes child processes.',
  hints: 'expansions · quoting · pipes · FDs · dup2 · exit status · text filters · automation',
  bridge: 'Shell mastery directly translates to writing bulletproof CI/CD runners, crafting secure Dockerfile RUN directives, and debugging user-data cloud-init bootstrap scripts.',
  groups: [
    { label: 'Command execution', viewIds: ['shell-concepts', 'parse', 'pipeline', 'redirection', 'text-tools'] },
    { label: 'Scripting & automation', viewIds: ['status', 'bash-patterns', 'here-docs', 'automation'] }
  ],
  views: [
    {
      id: 'shell-concepts',
      label: 'Core concepts',
      title: 'Before looking at the mechanics, what actually is a Shell or a Pipeline?',
      question: 'What are the foundational primitives of the Linux Shell?',
      kind: 'concept-primer',
      concepts: [
        {
          term: 'The Shell (Bash/Zsh)',
          analogy: 'A Human-to-Kernel Translator',
          definition: 'The shell is just a normal program (like a web browser). Its only job is to take text you type, parse it, and translate it into system calls (like fork and exec) that the kernel understands.'
        },
        {
          term: 'Standard Streams (0, 1, 2)',
          analogy: 'The Mouth, Ears, and Alarm',
          definition: 'Every process starts with 3 open File Descriptors: Standard Input (0) to hear data, Standard Output (1) to speak data, and Standard Error (2) to yell about errors.'
        },
        {
          term: 'Redirection (>, <)',
          analogy: 'Rerouting the Plumbing',
          definition: 'Redirection is how the shell intercepts those streams BEFORE the program starts. Instead of speaking to the screen, the shell wires the program\'s mouth (Output 1) directly to a file.'
        },
        {
          term: 'Pipe (|)',
          analogy: 'Connecting Two Hoses',
          definition: 'A pipe is a 64KB chunk of RAM managed by the kernel. It connects the mouth (Output 1) of one process directly to the ears (Input 0) of another process, streaming data in real-time.'
        }
      ],
      explanation: 'The command line looks like magic, but it\'s just a sequence of text string manipulations. Before any command actually runs, the shell evaluates variables, expands wildcards (*), and wires up File Descriptors for pipes and redirections. The command itself never sees the ">" or the "|" symbols—the shell handles all of that on its behalf.',
      takeaway: 'The shell is a translator. It parses your syntax, sets up the plumbing, and only then asks the kernel to run the program.',
      command: 'ls -l /proc/$$/fd',
      output: 'lrwx------ 1 root root 64 0 -> /dev/pts/0  # stdin\nlrwx------ 1 root root 64 1 -> /dev/pts/0  # stdout\nlrwx------ 1 root root 64 2 -> /dev/pts/0  # stderr',
      probe: 'echo $SHELL',
      probeOutput: '/bin/bash',
      caveat: 'Wildcards (like *.txt) are expanded by the SHELL, not by the command (like "ls"). If you run "ls *.txt", the "ls" program just sees a list of file names passed to it.',
      source: `${bash}Shell-Operation.html`,
    },
    {
      id: 'parse',
      label: 'Parse & expand',
      title: 'The shell rewrites your command line through expansion phases before execution.',
      question: 'Why doesn\'t a command run with literal wildcards, and what occurs between pressing Enter and kernel execve()?',
      kind: 'path',
      actors: [
        { label: 'Tokenization', detail: 'Shell parses line into words, operators, and evaluates aliases' },
        { label: 'Parameter & Command Expansion', detail: 'Evaluates $USER, $(command), and arithmetic $((1 + 2))' },
        { label: 'Pathname Globbing', detail: 'Expands *.log into matching directory filenames via readdir()' },
        { label: 'Quote Stripping & Execve', detail: 'Strips quotes and executes execve("/bin/echo", argv, environ)' }
      ],
      explanation: 'When you enter a command, the binary never sees your original input string. The shell intercepts the line and executes a multi-stage transformation: tokenization, alias replacement, brace expansion, parameter/variable expansion, command substitution, arithmetic expansion, word splitting according to $IFS, pathname glob expansion, and final quote removal. Only after this complete pipeline does the shell invoke the execve() system call with the resulting argv array.',
      takeaway: 'Programs never see wildcards or variable syntax; the shell expands them in-memory and passes an array of distinct strings.',
      command: 'bash -c \'set -x; echo *.txt "$USER"\'',
      output: '+ echo a.txt b.txt darshan\na.txt b.txt darshan',
      probe: 'python3 -c "import sys; print(sys.argv[1:])" *.txt 2>/dev/null || echo "$@"',
      probeOutput: "['a.txt', 'b.txt']",
      caveat: 'Bash and Zsh handle non-matching globs differently: Bash passes the literal string "*.txt" if no files match (unless nullglob is set), whereas Zsh raises a fatal error ("no matches found").',
      source: `${bash}Shell-Expansions.html`,
    },
    {
      id: 'pipeline',
      label: 'Pipe data',
      title: 'UNIX pipelines stream data through kernel-managed circular RAM buffers.',
      question: 'How do commands communicate in memory without writing intermediate files to disk?',
      kind: 'interactive-pipeline',
      pipelineData: {
        command: 'cat /var/log/syslog | grep "error" | head -n 1',
        processes: [
          { name: 'cat', pid: 101, fdOut: 1, state: 'RUNNING', outQueue: ['<line 1>', '<line 2>', '<line 3 error>'] },
          { name: 'grep', pid: 102, fdIn: 0, fdOut: 1, state: 'RUNNING', outQueue: [] },
          { name: 'head', pid: 103, fdIn: 0, state: 'RUNNING', outQueue: [] }
        ]
      },
      explanation: 'The pipeline operator "|" connects the stdout of the upstream process to the stdin of the downstream process. The kernel implements this via the pipe() system call, creating a circular FIFO buffer in kernel RAM (typically 64 KB). Data streams directly between processes in real time. If the producer generates data faster than the consumer reads, the producer blocks on write(). If the consumer exits early (e.g. "head -n 5"), the kernel sends SIGPIPE to the producer to terminate it cleanly.',
      takeaway: 'Pipes stream data directly through kernel RAM. If the downstream consumer dies, the kernel sends SIGPIPE to prevent wasted computation.',
      command: 'cat /var/log/syslog | grep "error" | wc -l',
      output: '42',
      probe: 'ls -l /proc/$$/fd',
      probeOutput: 'lrwx------ 1 darshan darshan 64 Sep 16 10:00 0 -> /dev/pts/1\nlrwx------ 1 darshan darshan 64 Sep 16 10:00 1 -> /dev/pts/1\nlrwx------ 1 darshan darshan 64 Sep 16 10:00 2 -> /dev/pts/1',
      caveat: 'Standard error (FD 2) bypasses the pipeline by default and writes directly to the terminal. To pipe both stdout and stderr together, use "|&" (Bash) or "2>&1 |".',
      source: `${bash}Pipelines.html`,
    },
    {
      id: 'redirection',
      label: 'FD routing',
      title: 'Redirection rebinds file descriptor slots via the dup2() system call.',
      question: 'How do you separate data output from error streams, and why does redirection order matter?',
      kind: 'split',
      actors: [
        { label: 'FD 0 (stdin)', detail: 'Standard input: default terminal (/dev/pts/1); rebound via < file' },
        { label: 'FD 1 (stdout)', detail: 'Standard output: normal data; rebound via > file' },
        { label: 'FD 2 (stderr)', detail: 'Standard error: diagnostics; rebound via 2> file' },
        { label: 'Stream Duplicate (dup2)', detail: '2>&1 clones pointer from FD 1 into FD 2' }
      ],
      explanation: 'Every process is initialized with three default file descriptors: 0 (stdin), 1 (stdout), and 2 (stderr), pointing to the controlling terminal. Redirection operators instruct the shell to invoke open() and dup2() to overwrite these table slots before invoking execve(). Order is evaluated strictly from left to right: "> file 2>&1" first opens file for FD 1, then clones FD 1 into FD 2, sending both to the file. In contrast, "2>&1 > file" clones the original terminal into FD 2, and then points FD 1 at the file!',
      takeaway: 'Order matters: "> file 2>&1" directs both streams to the file; "2>&1 > file" leaves stderr pointing at your terminal.',
      command: 'find /etc -name "*.conf" > /tmp/found.txt 2> /tmp/denied.txt',
      output: '# Terminal remains silent. Found paths in /tmp/found.txt, permission errors in /tmp/denied.txt',
      probe: 'cat /tmp/denied.txt | head -n 2',
      probeOutput: 'find: \'/etc/ssl/private\': Permission denied\nfind: \'/etc/polkit-1/rules.d\': Permission denied',
      caveat: '"&> file" is a Bash extension. For guaranteed POSIX compliance in portable /bin/sh scripts, always use "> file 2>&1".',
      source: `${bash}Redirections.html`,
    },
    {
      id: 'text-tools',
      label: 'Text processing toolkit',
      title: 'The UNIX text processing toolkit operates as a stream-oriented line processor.',
      question: 'Which tool is best suited for filtering, extracting, transforming, or aggregating tabular streams?',
      kind: 'reference',
      headers: ['Tool', 'Core Purpose', 'Kernel / Memory Profile', 'Idiomatic Command'],
      rows: [
        ['grep', 'Regex line filter', 'Line-by-line streaming; minimal memory footprint', 'grep -E "^(error|fatal)" /var/log/syslog'],
        ['awk', 'Field & column extractor', 'Tokenizes lines by delimiter; full programming language', 'awk -F: \'$3 >= 1000 {print $1, $6}\' /etc/passwd'],
        ['sed', 'Stream editor (substitutions)', 'Applies regex substitutions per pattern space', 'sed -i.bak \'s/PORT=80/PORT=8080/g\' /etc/app.conf'],
        ['cut', 'Delimiter byte/char splitter', 'Extremely fast fixed-delimiter extraction', 'cut -d: -f1,7 /etc/passwd'],
        ['sort', 'Line sorter & comparator', 'Buffers stream; spills to /tmp for multi-GB data sets', 'sort -t: -k3 -n /etc/passwd'],
        ['uniq', 'Adjacent duplicate eliminator', 'Compares consecutive lines (requires prior sort)', 'sort access.log | uniq -c | sort -nr'],
        ['xargs', 'Converts stream to argument vector', 'Batches stream items into execve() ARG_MAX limits', 'find /tmp -type f -name "*.tmp" | xargs rm -f'],
        ['jq', 'Structured JSON parser', 'Parses complete JSON AST; avoids fragile regex scraping', 'curl -s http://api/health | jq -r .status']
      ],
      tableNote: 'Mastering these standard tools enables rapid inspection of multi-gigabyte log streams directly in memory without writing custom Python or Go scripts.',
      explanation: 'UNIX architectures express system configuration and audit logs as human-readable plain text streams. Each core text processing utility is optimized for a specific transformation step. Because these tools process data line-by-line, they execute in constant memory even when operating on multi-gigabyte files.',
      takeaway: 'Learn grep for line filtering, awk for column extraction, sed for replacements, and jq for structured JSON.',
      command: 'awk -F: \'$3 >= 1000 {print $1, $3, $7}\' /etc/passwd | sort -k2 -n',
      output: 'darshan 1000 /bin/bash\nappuser 1001 /usr/sbin/nologin',
      probe: 'cat /etc/passwd | cut -d: -f7 | sort | uniq -c | sort -nr',
      probeOutput: '     28 /usr/sbin/nologin\n      4 /bin/bash\n      1 /bin/sync',
      caveat: 'Parsing JSON, YAML, or XML with grep and awk is fragile and prone to security edge cases. Use dedicated parsers like jq or yq for structured data.',
      source: `${man}man1/grep.1.html`,
    },
    {
      id: 'status',
      label: 'Pipeline status',
      title: 'Pipelines hide upstream failures by default unless strict options are configured.',
      question: 'Why did an automated script proceed when an upstream command in a pipeline failed?',
      kind: 'layers',
      actors: [
        { label: 'Failing Command', detail: 'curl http://invalid-domain (Exits 6: Could not resolve host)' },
        { label: 'Pipe Stream', detail: 'Hands empty stream to consumer process' },
        { label: 'Downstream Command', detail: 'grep "healthy" (Exits 1: pattern not found in empty stream)' },
        { label: 'Default Shell Status', detail: '$? evaluates ONLY the exit code of the final command in the chain' }
      ],
      failure: {
        label: 'Enable pipefail in shell',
        result: 'Pipeline evaluates all stages and returns the earliest failing exit code',
        output: 'set -o pipefail; curl http://invalid-domain | grep healthy; echo "Exit status: $?"\n# curl fails with 6; pipeline returns 6 (early error exposed!)',
        blocked: 3,
        afterActors: [
          { label: 'Failing Command', detail: 'curl http://invalid-domain (Exits 6)' },
          { label: 'Pipe Stream', detail: 'Hands empty stream to consumer' },
          { label: 'Downstream Command', detail: 'grep "healthy"' },
          { label: 'Pipefail Status', detail: '$? = 6 (early failure caught; script halts safely)' }
        ]
      },
      explanation: 'By default in POSIX shells, the exit status of a pipeline is determined exclusively by the final command. If "curl" fails to download a tarball, but "tar -tz" successfully unpacks an empty stream (or exits with a generic code), your deployment script continues as if the download succeeded! Enabling "set -o pipefail" alters this behavior so the pipeline returns the exit status of the earliest failing command, and Bash stores the full vector of exit codes in the ${PIPESTATUS[@]} array.',
      takeaway: 'Always include "set -o pipefail" in production scripts to prevent pipelines from silently masking fatal upstream errors.',
      command: 'set -o pipefail; false | true; echo "Pipefail exit: $?"',
      output: 'Pipefail exit: 1',
      probe: 'false | true; echo "Default exit: $? (PIPESTATUS: ${PIPESTATUS[*]})"',
      probeOutput: 'Default exit: 0 (PIPESTATUS: 1 0)',
      caveat: 'When pipefail is active, commands like "grep" that return exit code 1 when no matches are found will cause the entire pipeline to fail. Handle expected zero-match queries with "|| true".',
      source: `${bash}The-Set-Builtin.html`,
    },
    {
      id: 'bash-patterns',
      label: 'Bash scripting patterns',
      title: 'Defensive Bash programming idioms prevent subtle production outages.',
      question: 'What control structures, subshells, and quoting rules produce resilient shell scripts?',
      kind: 'walkthrough',
      steps: [
        {
          command: 'if [[ -f "$CONFIG_PATH" ]]; then\n  source "$CONFIG_PATH"\nfi',
          output: '# Configuration loaded cleanly',
          annotation: 'Use modern [[ ]] compound test operators rather than legacy [ ]. [[ ]] supports regex matches (=~), does not perform word splitting on empty variables, and prevents syntax errors.'
        },
        {
          command: 'while IFS= read -r line; do\n  process_item "$line"\ndone < data.txt',
          output: '# Reads line by line without corrupting backslashes',
          annotation: 'The canonical safe loop for processing files line-by-line. "IFS=" preserves leading/trailing whitespace; "-r" disables backslash escaping.'
        },
        {
          command: '(cd /opt/app && ./build.sh)',
          output: '# Build completed inside subshell',
          annotation: 'Run directory-sensitive tasks inside parentheses (...) to spawn an isolated subshell. When the subshell exits, the parent shell\'s working directory and environment variables remain unchanged.'
        },
        {
          command: 'trap \'rm -rf "$TMP_DIR"; log "Cleaned up"\' EXIT INT TERM',
          output: '# Signal trap registered',
          annotation: 'Signal traps ensure temporary directories, locks, and resources are deterministically removed even if the script aborts unexpectedly or receives SIGINT (Ctrl-C).'
        }
      ],
      explanation: 'Bash was designed as an interactive command interpreter, so its default scripting behavior prioritizes convenience over strict safety. Writing resilient automation requires defensive conventions: double-quoting all variable expansions, using [[ ]] instead of [ ], employing subshells to isolate side effects, and registering EXIT signal traps for guaranteed resource cleanup.',
      takeaway: 'Use [[ ]] for tests, IFS= read -r for reading lines, subshells (...) for directory isolation, and trap ... EXIT for cleanup.',
      command: 'shellcheck myscript.sh 2>/dev/null || echo "Run shellcheck to detect unsafe word splitting and unquoted variables"',
      output: 'myscript.sh:4:12: note: Double quote to prevent globbing and word splitting. [SC2086]',
      probe: 'bash -n myscript.sh',
      probeOutput: '# No syntax errors detected',
      caveat: 'A subshell created inside a pipeline ("cat file | while read line; do ... done") runs in a separate process; variables modified inside that loop cannot be read by the parent script.',
      source: `${bash}Shell-Commands.html`,
    },
    {
      id: 'here-docs',
      label: 'Here documents & substitution',
      title: 'Here-docs, here-strings, and process substitution eliminate temporary files.',
      question: 'How do you stream multi-line configuration templates and compare outputs without writing scratch files?',
      kind: 'comparison',
      items: [
        {
          label: 'Here-Document (<<EOF)',
          detail: 'Feeds a multi-line string directly into standard input. Unquoted EOF expands variables; quoting \'EOF\' preserves literal characters (e.g. for generating scripts).',
          command: 'cat <<\'EOF\' > /tmp/demo.sh\necho "Current user: $USER"\nEOF',
          output: '# $USER is written literally into the script file',
          highlight: 'neutral'
        },
        {
          label: 'Tab-Stripping Here-Doc (<<-EOF)',
          detail: 'Strips leading tab characters from each line, allowing here-documents to be cleanly indented inside functions without injecting leading whitespace into the output.',
          command: 'cat <<-EOF\n\tline one\n\tline two\nEOF',
          output: 'line one\nline two',
          highlight: 'neutral'
        },
        {
          label: 'Here-String (<<< "$VAR")',
          detail: 'Passes a single variable or string directly to standard input without spawning a subshell or pipeline process.',
          command: 'grep "darshan" <<< "$USER_LIST"',
          output: 'darshan:x:1000:1000::/home/darshan:/bin/bash',
          highlight: 'neutral'
        },
        {
          label: 'Process Substitution (<(cmd))',
          detail: 'Connects command output to an anonymous pipe (/dev/fd/63), allowing commands that require file paths (like diff) to consume dynamic command output directly.',
          command: 'diff -u <(systemctl list-units --state=failed) <(echo "0 loaded units listed.")',
          output: '# Displays diff directly without writing temporary files to /tmp',
          highlight: 'good'
        }
      ],
      explanation: 'Modern shells provide rich syntax to feed text streams and compare outputs without polluting disk storage with temporary files. Here-docs provide clean multi-line file generation; here-strings eliminate "echo $var | cmd" pipeline overhead; and process substitution creates temporary anonymous file descriptors that allow file-oriented utilities to consume streaming command output.',
      takeaway: 'Quote \'EOF\' to generate scripts with literal dollar signs; use process substitution <(...) to diff commands without disk I/O.',
      command: 'cat <<\'EOF\' > /tmp/template.conf\nserver {\n  listen 80;\n  server_name $host;\n}\nEOF',
      output: '# /tmp/template.conf created with literal $host intact',
      probe: 'cat <<< "Test here-string pipeline: $USER"',
      probeOutput: 'Test here-string pipeline: darshan',
      caveat: 'Process substitution (<(...) and >(...)) requires /dev/fd support and is specific to Bash, Zsh, and Ksh; it is not supported in minimal POSIX /bin/sh (dash or busybox ash).',
      source: `${bash}Redirections.html`,
    },
    {
      id: 'automation',
      label: 'Production script walkthrough',
      title: 'Anatomy of an idempotent, production-grade Linux automation script.',
      question: 'What foundational skeleton ensures a shell script fails safely, logs cleanly, and runs idempotently?',
      kind: 'recipe',
      recipeSteps: [
        {
          step: 'Strict Mode & Shebang',
          command: '#!/usr/bin/env bash\nset -euo pipefail\nIFS=$\'\\n\\t\'',
          output: '',
          note: '-e exits on command failure; -u exits on undefined variables; -o pipefail catches pipeline errors; IFS prevents spaces from splitting words.'
        },
        {
          step: 'Signal Trapping & Cleanup',
          command: 'TMP_DIR=$(mktemp -d)\ncleanup() { rm -rf "$TMP_DIR"; log "Shutdown complete"; }\ntrap cleanup EXIT INT TERM',
          output: '',
          note: 'Registers a deterministic teardown function. The EXIT pseudo-signal runs on both normal script completion and unexpected aborts.'
        },
        {
          step: 'Structured Stderr Logging',
          command: 'log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [${BASH_SOURCE[0]}:$LINENO] $*" >&2; }',
          output: '',
          note: 'Writes formatted timestamps and line numbers to stderr (FD 2), ensuring standard output (FD 1) remains clean for piping downstream.'
        },
        {
          step: 'Concurrency Flocks',
          command: 'exec 200>/var/lock/myjob.lock\nflock -n 200 || { log "Job already running; exiting"; exit 0; }',
          output: '',
          note: 'Uses kernel-level file advisory locking (flock) on a dedicated file descriptor to prevent concurrent cron executions from colliding.'
        },
        {
          step: 'Idempotency Precondition Checks',
          command: 'if id -u nginx >/dev/null 2>&1; then\n  log "User nginx already exists; skipping creation"\nelse\n  useradd --system --no-create-home nginx\nfi',
          output: '',
          note: 'Every operation must test state first. Running an idempotent script multiple times produces the exact same desired end state.'
        }
      ],
      explanation: 'A production script must anticipate failure, prevent concurrent execution collisions, and clean up temporary state automatically. By enabling strict mode (-euo pipefail), using kernel file locks (flock), logging exclusively to stderr, and designing every step to be idempotent, you eliminate the most common causes of automation outages in production.',
      takeaway: 'Start every production script with set -euo pipefail, register an EXIT signal trap, and enforce flock concurrency guards.',
      command: 'bash -euo pipefail -c \'echo "Strict mode verification successful"\'',
      output: 'Strict mode verification successful',
      probe: 'flock -n /tmp/test.lock -c \'echo "Acquired exclusive lock"\'',
      probeOutput: 'Acquired exclusive lock',
      caveat: 'Strict mode ("set -e") does not trigger on commands inside "if" conditions, "while" loops, or the left-hand side of "||" statements. Always test return codes explicitly.',
      source: `${bash}The-Set-Builtin.html`,
    }
  ]
};
