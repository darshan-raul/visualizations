import { gitViews, getStepInternals, type GitLab, type GitFile } from './git-data';

const byViewId = new Map<string, GitLab>(gitViews.map((v) => [v.id, v]));

const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => root.querySelector<T>(selector);
const qa = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => [...root.querySelectorAll<T>(selector)];
const setText = (root: ParentNode, selector: string, value: string) => {
  const target = q<HTMLElement>(root, selector);
  if (target) target.textContent = value;
};

export function initGitConsoles() {
  qa<HTMLElement>(document, '.git-console').forEach((consoleEl) => initConsole(consoleEl));
}

function initConsole(consoleEl: HTMLElement) {
  const sections = qa<HTMLElement>(consoleEl, '[data-git-view]');
  const links = qa<HTMLAnchorElement>(consoleEl, '[data-git-view-link]');
  let activeIndex = 0;
  const timers = new Set<() => void>();
  const pauseAll = () => timers.forEach((stop) => stop());

  const updateInspector = (title: string, copy: string, state: string, operation: string, caveat?: string) => {
    setText(consoleEl, '[data-git-inspector-title]', title);
    setText(consoleEl, '[data-git-inspector-copy]', copy);
    setText(consoleEl, '[data-git-inspector-state]', state);
    setText(consoleEl, '[data-git-inspector-operation]', operation);
    if (caveat !== undefined) setText(consoleEl, '[data-git-inspector-caveat]', caveat);
  };

  const selectView = (index: number, push = true) => {
    pauseAll();
    activeIndex = (index + sections.length) % sections.length;
    const activeSection = sections[activeIndex];
    const labId = activeSection.getAttribute('data-git-view') || gitViews[0].id;
    const lab = byViewId.get(labId) || gitViews[0];

    // Toggle active view section
    sections.forEach((sec, i) => {
      sec.classList.toggle('is-active', i === activeIndex);
    });

    // Update navigation links
    links.forEach((link, i) => {
      if (i === activeIndex) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Expand current accordion group, close others
    const groupDetails = links[activeIndex]?.closest<HTMLDetailsElement>('[data-git-index-group]');
    qa<HTMLDetailsElement>(consoleEl, '[data-git-index-group]').forEach((details) => {
      details.open = details === groupDetails;
    });

    // Update view counters
    const countStr = `${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`;
    setText(consoleEl, '[data-git-view-count]', countStr);
    setText(consoleEl, '[data-git-view-counter]', countStr);

    // Update scenario ribbon
    setText(consoleEl, '[data-git-scenario-repo]', `~/repos/infra-platform (${lab.branch})`);
    setText(consoleEl, '[data-git-scenario-branch]', lab.branch);
    setText(consoleEl, '[data-git-scenario-path]', lab.path);

    // Update bottom takeaway and context inspector
    setText(consoleEl, '[data-git-bottom-takeaway]', lab.takeaway);
    updateInspector(
      lab.title,
      lab.inspector,
      'Active Workspace Ready',
      `Laboratory ${String(activeIndex + 1).padStart(2, '0')}: ${lab.label}`,
      lab.caveat
    );

    if (push && location.hash !== `#${lab.id}`) {
      history.pushState(null, '', `#${lab.id}`);
    }
  };

  // Bind index link clicks
  links.forEach((link, idx) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      selectView(idx);
    });
  });

  // Bind footer prev / next stepper buttons
  q(consoleEl, '[data-git-view-prev]')?.addEventListener('click', () => selectView(activeIndex - 1));
  q(consoleEl, '[data-git-view-next]')?.addEventListener('click', () => selectView(activeIndex + 1));

  // Synchronize URL hash
  const syncHash = () => {
    const hash = location.hash.slice(1);
    const targetIdx = sections.findIndex((sec) => sec.id === hash);
    if (targetIdx >= 0) {
      selectView(targetIdx, false);
    }
  };
  window.addEventListener('hashchange', syncHash);
  window.addEventListener('popstate', syncHash);

  // Initialize all interactive workspaces
  qa<HTMLElement>(consoleEl, '[data-git-workspace]').forEach((wsEl) => {
    initWorkspace(wsEl, timers, updateInspector);
  });

  // Check initial location hash or default to 0
  const initialHash = location.hash.slice(1);
  const initialIdx = sections.findIndex((sec) => sec.id === initialHash);
  selectView(initialIdx >= 0 ? initialIdx : 0, false);

  // Mark console enhanced
  consoleEl.classList.add('is-enhanced');
}

function initWorkspace(
  wsEl: HTMLElement,
  globalTimers: Set<() => void>,
  updateInspector: (title: string, copy: string, state: string, op: string, caveat?: string) => void
) {
  const labId = wsEl.getAttribute('data-git-workspace') || '';
  const lab = byViewId.get(labId);
  if (!lab) return;

  let currentStepIdx = 0;
  let playTimer: number | undefined;

  const actionButtons = qa<HTMLButtonElement>(wsEl, '[data-step-index]');
  const termHistoryEl = q<HTMLElement>(wsEl, '[data-ws-term-history]');
  const terminalWindowEl = q<HTMLElement>(wsEl, '[data-ws-terminal]');
  const fileTreeEl = q<HTMLElement>(wsEl, '[data-ws-file-tree]');
  const shelfGridEl = q<HTMLElement>(wsEl, '[data-ws-shelf-grid]');
  const fileCountEl = q<HTMLElement>(wsEl, '[data-ws-file-count]');
  const playBtn = q<HTMLButtonElement>(wsEl, '[data-act-play]');
  const promptBranchEl = q<HTMLElement>(wsEl, '[data-ws-branch]');
  const promptPathEl = q<HTMLElement>(wsEl, '[data-ws-path]');
  const termTabEl = q<HTMLElement>(wsEl, '[data-ws-term-tab]');
  const cliForm = q<HTMLFormElement>(wsEl, '[data-ws-cli-form]');
  const cliInput = q<HTMLInputElement>(wsEl, '[data-ws-cli-input]');
  const activePromptEl = q<HTMLElement>(wsEl, '[data-ws-active-prompt]');
  const plumbingRunBtn = q<HTMLButtonElement>(wsEl, '[data-ws-plumbing-run]');
  const svgCanvasEl = q<HTMLElement>(wsEl, '[data-ws-graph-canvas]');

  const cmdHistory: string[] = [];
  let historyIdx = -1;

  const stopPlay = () => {
    if (playTimer !== undefined) {
      window.clearInterval(playTimer);
      playTimer = undefined;
      if (playBtn) playBtn.textContent = '▶ Play';
    }
  };
  globalTimers.add(stopPlay);

  // Mode switching logic (Normal / X-Ray / Plumbing)
  const setMode = (newMode: 'learn' | 'xray' | 'plumbing') => {
    wsEl.setAttribute('data-ws-mode', newMode);

    const modeBtns = qa<HTMLButtonElement>(wsEl, '[data-ws-mode-btn]');
    modeBtns.forEach((b) => {
      const target = b.getAttribute('data-ws-mode-btn');
      const isActive = target === newMode;
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-checked', String(isActive));
    });

    const fsHintEl = q<HTMLElement>(wsEl, '[data-ws-fs-hint]');
    if (fsHintEl) {
      fsHintEl.textContent =
        newMode === 'learn'
          ? '[.git/ hidden]'
          : newMode === 'xray'
          ? '[.git/ visible]'
          : '[.git/ & raw primitives visible]';
    }

    const internalsTagEl = q<HTMLElement>(wsEl, '[data-ws-internals-mode-tag]');
    if (internalsTagEl) {
      internalsTagEl.textContent =
        newMode === 'learn'
          ? 'PORCELAIN'
          : newMode === 'xray'
          ? '⚡ X-RAY ACTIVE'
          : '⚙ PLUMBING ENGINE';
    }
  };

  const modeBtns = qa<HTMLButtonElement>(wsEl, '[data-ws-mode-btn]');
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetMode = btn.getAttribute('data-ws-mode-btn') as 'learn' | 'xray' | 'plumbing';
      if (targetMode) setMode(targetMode);
    });
  });

  q<HTMLButtonElement>(wsEl, '[data-ws-trigger-xray]')?.addEventListener('click', () => {
    setMode('xray');
  });

  const appendCustomOutput = (cmd: string, outputLines: string[], isErr = false) => {
    if (!termHistoryEl || !terminalWindowEl) return;
    const promptDiv = document.createElement('div');
    promptDiv.className = 'terminal-line is-prompt';
    const curBranch = promptBranchEl?.textContent || lab.branch;
    promptDiv.innerHTML = `
      <span class="term-prompt">dev@lab:~/repos/infra-platform (${escapeHtml(curBranch)})$</span>
      <span class="term-cmd">${escapeHtml(cmd)}</span>
    `;
    const outputDiv = document.createElement('div');
    outputDiv.className = 'terminal-output';
    outputLines.forEach((line) => {
      const pre = document.createElement('pre');
      pre.className = `term-out-line ${isErr ? 'term-error' : line.startsWith('#') ? 'term-comment' : ''}`;
      pre.textContent = line;
      outputDiv.appendChild(pre);
    });
    termHistoryEl.append(promptDiv, outputDiv);
    terminalWindowEl.scrollTop = terminalWindowEl.scrollHeight;
  };

  const renderStep = (stepIdx: number, appendTerminal = true) => {
    currentStepIdx = Math.max(0, Math.min(lab.steps.length - 1, stepIdx));
    const step = lab.steps[currentStepIdx];
    const internals = getStepInternals(lab, currentStepIdx);

    // Highlight active action button
    actionButtons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === currentStepIdx);
      btn.setAttribute('aria-pressed', String(i === currentStepIdx));
    });

    // Update active prompt text
    if (activePromptEl) {
      activePromptEl.textContent = `dev@lab:~/repos/infra-platform (${promptBranchEl?.textContent || lab.branch})$`;
    }
    if (cliInput) {
      const nextStep = lab.steps[currentStepIdx + 1];
      cliInput.placeholder = nextStep
        ? `Next step: '${nextStep.command}' (or type 'git status' / 'cat .git/HEAD')...`
        : `All steps complete. Try 'git status', 'git log', 'cat .git/HEAD' or reset!`;
    }

    // Update Primary Quick-Run Chip
    const nextStepChip = q<HTMLButtonElement>(wsEl, '.term-chip.is-next-step');
    if (nextStepChip) {
      nextStepChip.setAttribute('data-chip-cmd', step.command);
      nextStepChip.textContent = `▶ Run Step ${currentStepIdx + 1}: ${step.command}`;
      nextStepChip.title = `Execute: ${step.command}`;
    }

    // Update Column 1: Explorer file tree
    if (fileTreeEl) {
      fileTreeEl.innerHTML = '';
      step.files.forEach((file: GitFile) => {
        const isGitInternal = file.path.startsWith('.git');
        const li = document.createElement('li');
        li.className = [
          'file-tree-item',
          file.isDir && 'is-dir',
          file.highlight && 'is-highlighted',
          file.status && `status-${file.status.toLowerCase()}`,
          isGitInternal && 'is-git-internal'
        ]
          .filter(Boolean)
          .join(' ');
        li.style.setProperty('--depth', String(file.depth || 0));
        li.setAttribute('data-file-path', file.path);
        li.title = `Click to inspect ${file.path} in terminal`;

        const icon = document.createElement('span');
        icon.className = 'file-icon';
        icon.textContent = file.isDir ? '📁' : file.status === 'UU' ? '⚠️' : isGitInternal ? '⚙️' : '📄';

        const name = document.createElement('span');
        name.className = 'file-name';
        name.textContent = file.name;

        li.append(icon, name);

        if (file.status) {
          const badge = document.createElement('span');
          badge.className = `file-badge badge-${file.status.toLowerCase()}`;
          badge.textContent = file.status;
          badge.setAttribute('aria-label', `Status: ${file.status}`);
          li.append(badge);
        }

        fileTreeEl.appendChild(li);
      });
    }

    if (fileCountEl) {
      fileCountEl.textContent = `${step.files.length} items`;
    }

    // Update Column 2: Terminal History
    if (termHistoryEl && terminalWindowEl) {
      if (!appendTerminal || currentStepIdx === 0) {
        termHistoryEl.innerHTML = `
          <div class="terminal-line is-welcome">
            <span class="term-comment"># Git Internals Lab Interactive Terminal</span>
            <span class="term-comment"># Target repository: ~/repos/infra-platform (${lab.branch})</span>
            <span class="term-comment"># Tip: Click buttons, cards, files, or quick chips below to run real Git commands!</span>
          </div>
        `;
      }

      const promptDiv = document.createElement('div');
      promptDiv.className = 'terminal-line is-prompt';
      promptDiv.innerHTML = `
        <span class="term-prompt">dev@lab:~/repos/infra-platform (${escapeHtml(promptBranchEl?.textContent || lab.branch)})$</span>
        <span class="term-cmd">${escapeHtml(step.command)}</span>
      `;

      const outputDiv = document.createElement('div');
      outputDiv.className = 'terminal-output';
      step.output.forEach((line) => {
        const pre = document.createElement('pre');
        pre.className = 'term-out-line';
        if (line.startsWith('#')) pre.classList.add('term-comment');
        else if (line.includes('fatal:') || line.includes('CONFLICT') || line.includes('error:')) {
          pre.classList.add('term-error');
        } else if (line.includes('Fast-forward') || line.includes('Successfully') || line.includes('written') || line.includes('Switched') || line.includes('Created')) {
          pre.classList.add('term-success');
        }
        pre.textContent = line;
        outputDiv.appendChild(pre);
      });

      termHistoryEl.append(promptDiv, outputDiv);
      terminalWindowEl.scrollTop = terminalWindowEl.scrollHeight;
    }

    // Update Column 3: Git Internals Cards
    setText(wsEl, '[data-ws-head-ref]', internals.head);
    setText(wsEl, '[data-ws-branch-ref]', internals.branchRef);
    setText(wsEl, '[data-ws-commit-hash]', internals.commitHash || 'None');
    setText(wsEl, '[data-ws-commit-msg]', internals.commitMsg || '');
    setText(wsEl, '[data-ws-tree-hash]', internals.treeHash || 'None');
    setText(wsEl, '[data-ws-tree-detail]', internals.treeDetail || '');
    setText(wsEl, '[data-ws-blob-hash]', internals.blobHash || 'None');
    setText(wsEl, '[data-ws-blob-detail]', internals.blobDetail || '');

    // Update X-Ray note & Plumbing command
    setText(wsEl, '[data-ws-xray-text]', step.xrayNote || step.internalChange);
    setText(wsEl, '[data-ws-plumbing-cmd]', step.plumbingCommand || 'git cat-file -p HEAD');

    // Update 4-Stage State Shelf
    if (shelfGridEl) {
      shelfGridEl.innerHTML = '';
      step.shelf.forEach((cell, cellIdx) => {
        const art = document.createElement('article');
        art.className = `shelf-cell ${cell.badge ? `badge-${cell.badge}` : ''}`;

        const stageNum = document.createElement('span');
        stageNum.className = 'cell-stage-num';
        stageNum.textContent = `STAGE 0${cellIdx + 1}`;

        const label = document.createElement('span');
        label.className = 'cell-label';
        label.textContent = cell.label;

        const val = document.createElement('strong');
        val.className = 'cell-value';
        val.textContent = cell.value;

        art.append(stageNum, label, val);

        if (cell.detail) {
          const detail = document.createElement('small');
          detail.className = 'cell-detail';
          detail.textContent = cell.detail;
          art.append(detail);
        }

        shelfGridEl.appendChild(art);
      });
    }

    // Update inspector aside with step specifics
    updateInspector(
      `${lab.label}: ${step.label}`,
      step.inspectorDetail,
      step.inspectorState,
      step.inspectorOperation,
      step.caveat || lab.caveat
    );

    // Update bottom takeaway
    const bottomTakeaway = q<HTMLElement>(wsEl.closest('.git-console')!, '[data-git-bottom-takeaway]');
    if (bottomTakeaway) {
      bottomTakeaway.textContent = step.takeaway;
    }

    // Update SVG active diagram nodes
    const svgEl = q<SVGSVGElement>(wsEl, '.graph-svg');
    if (svgEl) {
      qa<SVGElement>(svgEl, '[data-svg-step]').forEach((node) => {
        const stepTarget = node.getAttribute('data-svg-step');
        const isActive = stepTarget === String(currentStepIdx);
        node.classList.toggle('is-svg-active', isActive);
      });
    }
  };

  // Wire plumbing run button
  if (plumbingRunBtn) {
    plumbingRunBtn.addEventListener('click', () => {
      const step = lab.steps[currentStepIdx];
      const cmd = step.plumbingCommand || 'git cat-file -p HEAD';
      executeCommand(cmd);
    });
  }

  const executeCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;
    cmdHistory.push(cmd);
    historyIdx = -1;

    const norm = cmd.toLowerCase().replace(/\s+/g, ' ');
    const curInternals = getStepInternals(lab, currentStepIdx);

    // 1. Built-in: clear
    if (norm === 'clear') {
      if (termHistoryEl) {
        termHistoryEl.innerHTML = '';
      }
      return;
    }

    // 2. Built-in: help
    if (norm === 'help' || norm === 'git help' || norm === 'git --help') {
      appendCustomOutput(cmd, [
        'GNU bash, interactive Git lab simulator (Infra Illustrated)',
        'Laboratory Actions:',
        ...lab.steps.map((s, idx) => `  ${String(idx + 1).padStart(2, '0')}. ${s.command}`),
        '',
        'Inspection commands you can run anytime:',
        '  git status -s                    - Short working tree status',
        '  cat .git/HEAD                    - Read "you are here" pointer',
        '  git ls-files --stage             - Inspect binary staging index',
        '  git cat-file -p <sha|HEAD>       - Decompress commit envelope, tree, or blob',
        '  git count-objects -v             - Report object vault statistics',
        '  git log --oneline                - View commit ancestry history',
        '  git diff                         - Compare working directory with index',
        '  clear                            - Clear terminal screen'
      ], false);
      return;
    }

    // 3. Built-in: pwd
    if (norm === 'pwd') {
      appendCustomOutput(cmd, [promptPathEl?.textContent || '/home/dev/repos/infra-platform']);
      return;
    }

    // 4. Built-in: ls
    if (norm === 'ls' || norm === 'ls -la' || norm === 'ls -l' || norm.startsWith('ls ')) {
      const curStep = lab.steps[currentStepIdx];
      appendCustomOutput(cmd, [
        'total 16',
        ...curStep.files.map((f) => `${f.isDir ? 'drwxr-xr-x' : '-rw-r--r--'}  dev dev  ${f.name}${f.status ? `  [${f.status}]` : ''}`)
      ]);
      return;
    }

    // 5. Built-in: cat <file>
    if (norm.startsWith('cat ')) {
      const target = norm.slice(4).trim();
      if (target.includes('head')) {
        if (curInternals.head.startsWith('ref: ')) {
          appendCustomOutput(cmd, [
            curInternals.head,
            '# [Symbolic Ref]: HEAD points to a branch name, not a raw commit hash directly.'
          ]);
        } else {
          appendCustomOutput(cmd, [
            curInternals.head,
            '# ⚠️ DETACHED HEAD: HEAD is storing a raw 40-character commit SHA directly!',
            '# Any new commits created now are orphans without a branch lifeline.'
          ]);
        }
        return;
      }
      if (target.includes('refs/heads/')) {
        appendCustomOutput(cmd, [
          curInternals.commitHash || '4f901ab789012345678901234567890123456789',
          '# 41-byte text file: A Git branch is merely a text file holding the commit SHA!'
        ]);
        return;
      }
      if (target.includes('deployment.yaml')) {
        const curStep = lab.steps[currentStepIdx];
        const replicaVal = curStep.shelf.find(s => s.label === 'Working Tree')?.value || 'replicas: 2';
        appendCustomOutput(cmd, [
          'apiVersion: apps/v1',
          'kind: Deployment',
          'metadata:',
          '  name: cache-redis',
          '  namespace: default',
          'spec:',
          `  ${replicaVal}`,
          '  selector:',
          '    matchLabels:',
          '      app: cache',
          '  template:',
          '    spec:',
          '      containers:',
          '      - name: redis',
          '        image: redis:7.0-alpine'
        ]);
        return;
      }
      if (target.includes('readme.md')) {
        appendCustomOutput(cmd, [
          '# Infra Platform Core',
          'Shared platform infrastructure services and Kubernetes configurations.',
          'Maintained by the Platform Infrastructure Team.'
        ]);
        return;
      }
      if (target.includes('.gitignore')) {
        appendCustomOutput(cmd, [
          '# Local development overrides',
          '*.tfstate',
          '*.tfstate.backup',
          '.terraform/',
          '*.log'
        ]);
        return;
      }
      appendCustomOutput(cmd, [`# Contents of ${target} displayed`]);
      return;
    }

    // 6. Direct match with any lab step
    const directIdx = lab.steps.findIndex((s) => s.command.toLowerCase().replace(/\s+/g, ' ') === norm);
    if (directIdx >= 0) {
      stopPlay();
      renderStep(directIdx, true);
      return;
    }

    // 7. Core Porcelain Commands
    if (norm === 'git status' || norm === 'git status -s' || norm === 'git status --short') {
      const curStep = lab.steps[currentStepIdx];
      const dirtyFiles = curStep.files.filter((f) => f.status);
      if (dirtyFiles.length === 0) {
        appendCustomOutput(cmd, [
          `On branch ${lab.branch}`,
          `Your branch is up to date with 'origin/${lab.branch}'.`,
          '',
          'nothing to commit, working tree clean'
        ]);
      } else {
        appendCustomOutput(cmd, [
          `On branch ${lab.branch}`,
          ...dirtyFiles.map(f => `${(f.status ?? '??').padEnd(2)} ${f.path}`)
        ]);
      }
      return;
    }

    if (norm.startsWith('git add')) {
      const addStep = lab.steps.findIndex((s) => s.command.startsWith('git add'));
      if (addStep >= 0) {
        stopPlay();
        renderStep(addStep, true);
        return;
      }
    }

    if (norm.startsWith('git commit')) {
      const commitStep = lab.steps.findIndex((s) => s.command.startsWith('git commit'));
      if (commitStep >= 0) {
        stopPlay();
        renderStep(commitStep, true);
        return;
      }
    }

    if (norm.startsWith('git switch') || norm.startsWith('git checkout')) {
      const switchStep = lab.steps.findIndex((s) => s.command.startsWith('git switch') || s.command.startsWith('git checkout'));
      if (switchStep >= 0) {
        stopPlay();
        renderStep(switchStep, true);
        return;
      }
    }

    if (norm.startsWith('git log')) {
      appendCustomOutput(cmd, [
        `* ${curInternals.commitHash || '4f901ab'} (HEAD -> ${curInternals.branchRef || lab.branch}) ${curInternals.commitMsg || 'Scale cache deployment'}`,
        '* b14c80e Add redis cache configuration',
        '* e78b21a (main) Add IAM production roles',
        '* c3904e1 Initial infrastructure definition'
      ]);
      return;
    }

    if (norm.startsWith('git branch')) {
      appendCustomOutput(cmd, [
        `* ${curInternals.branchRef || lab.branch}`,
        '  main',
        '  feature/networking',
        '  feature/iam',
        '  remotes/origin/main'
      ]);
      return;
    }

    if (norm.startsWith('git diff')) {
      appendCustomOutput(cmd, [
        'diff --git a/app/deployment.yaml b/app/deployment.yaml',
        '--- a/app/deployment.yaml',
        '+++ b/app/deployment.yaml',
        '@@ -5,3 +5,3 @@',
        '-  replicas: 2',
        '+  replicas: 3'
      ]);
      return;
    }

    if (norm.startsWith('git reflog')) {
      appendCustomOutput(cmd, [
        `${curInternals.commitHash || '4f901ab'} (HEAD -> ${curInternals.branchRef || lab.branch}) HEAD@{0}: commit: Scale cache deployment`,
        'b14c80e HEAD@{1}: commit: Add redis cache configuration',
        'e78b21a HEAD@{2}: checkout: moving from main to feature/cache',
        'c3904e1 HEAD@{3}: commit (initial): Initial infrastructure'
      ]);
      return;
    }

    if (norm === 'git rev-parse head' || norm === 'git rev-parse --short head') {
      appendCustomOutput(cmd, [curInternals.commitHash || '4f901ab']);
      return;
    }

    // 8. Raw Plumbing Commands Support
    if (norm.includes('cat-file')) {
      if (norm.includes('-t')) {
        const type = norm.includes('tree') ? 'tree' : norm.includes('commit') ? 'commit' : 'blob';
        appendCustomOutput(cmd, [type]);
        return;
      }
      if (norm.includes('tree') || norm.includes('7b2a901') || norm.includes('f419dc8')) {
        appendCustomOutput(cmd, [
          '040000 tree 7b2a901e18ac49b012891ac37890123456789abc	app',
          '040000 tree 8e14bc2390124789012345678901234567890123	environments',
          '040000 tree 319ca01234567890123456789012345678901234	modules',
          '100644 blob a48fe12e89012345678901234567890123456789	README.md',
          '100644 blob 91c48ea12891ac37890123456789abcdeff01234	.gitignore'
        ]);
        return;
      }
      if (norm.includes('head') || norm.includes('4f901ab') || norm.includes('commit')) {
        appendCustomOutput(cmd, [
          `tree ${curInternals.treeHash || '7b2a901e18ac49b012891ac37890123456789abc'}`,
          'parent e78b21a89012345678901234567890123456789a',
          'author SRE Engineer <dev@infra.local> 1726750000 +0000',
          'committer SRE Engineer <dev@infra.local> 1726750000 +0000',
          '',
          curInternals.commitMsg || 'Scale cache deployment'
        ]);
        return;
      }
      appendCustomOutput(cmd, [
        'apiVersion: apps/v1',
        'kind: Deployment',
        'metadata:',
        '  name: cache-redis',
        'spec:',
        '  replicas: 3'
      ]);
      return;
    }

    if (norm.startsWith('git count-objects')) {
      appendCustomOutput(cmd, [
        'count: 14',
        'size: 32',
        'in-pack: 0',
        'packs: 0',
        'prune-packable: 0',
        'garbage: 0',
        'size-garbage: 0'
      ]);
      return;
    }

    if (norm.startsWith('git hash-object')) {
      appendCustomOutput(cmd, [curInternals.blobHash || '7ab38f4a2190cd89e1401bc389012478901234ab']);
      return;
    }

    if (norm.startsWith('git write-tree')) {
      appendCustomOutput(cmd, [curInternals.treeHash || '7b2a901e18ac49b012891ac37890123456789abc']);
      return;
    }

    if (norm.startsWith('git commit-tree')) {
      appendCustomOutput(cmd, [curInternals.commitHash || '4f901ab789012345678901234567890123456789']);
      return;
    }

    if (norm.startsWith('git update-ref')) {
      appendCustomOutput(cmd, [`# Updated ref refs/heads/${lab.branch} to ${curInternals.commitHash || '4f901ab'}`]);
      return;
    }

    if (norm.startsWith('git ls-files')) {
      if (lab.id === 'merge-conflicts-three-stage-index') {
        appendCustomOutput(cmd, [
          '100644 8a12f90123456789012345678901234567890123 1	app/deployment.yaml  (Stage 1: BASE)',
          '100644 b41c9e2345678901234567890123456789012345 2	app/deployment.yaml  (Stage 2: OURS)',
          '100644 6d34e81234567890123456789012345678901234 3	app/deployment.yaml  (Stage 3: THEIRS)'
        ]);
        return;
      }
      appendCustomOutput(cmd, [
        `100644 ${curInternals.blobHash || '7ab38f4a2190cd89e1401bc389012478901234ab'} 0	app/deployment.yaml`,
        '100644 a48fe12e89012345678901234567890123456789 0	README.md',
        '100644 91c48ea12891ac37890123456789abcdeff01234 0	.gitignore'
      ]);
      return;
    }

    // 9. Typo suggestions
    if (norm.startsWith('git ')) {
      const sub = norm.slice(4).split(' ')[0];
      const known = [
        'status', 'add', 'commit', 'branch', 'checkout', 'switch', 'diff',
        'log', 'fetch', 'pull', 'push', 'merge', 'rebase', 'reset', 'restore',
        'revert', 'worktree', 'reflog', 'fsck', 'gc', 'cat-file', 'hash-object',
        'write-tree', 'update-index', 'update-ref', 'ls-files', 'ls-tree', 'rev-parse'
      ];
      const suggestion = known.find(k => k.startsWith(sub.slice(0, 2)) || (sub.length > 3 && k.includes(sub.slice(1, 3))));
      appendCustomOutput(cmd, [
        `git: '${sub}' is not a git command. See 'git --help'.`,
        ...(suggestion ? [`\nDid you mean this?\n\t${suggestion}`] : [])
      ], true);
      return;
    }

    // 10. Unknown command
    appendCustomOutput(cmd, [`bash: ${cmd.split(' ')[0]}: command not found`], true);
  };

  // Wire CLI form and keyboard navigation
  if (cliForm && cliInput) {
    cliForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = cliInput.value;
      cliInput.value = '';
      executeCommand(val);
    });

    cliInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cmdHistory.length === 0) return;
        if (historyIdx < cmdHistory.length - 1) {
          historyIdx++;
        }
        cliInput.value = cmdHistory[cmdHistory.length - 1 - historyIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIdx > 0) {
          historyIdx--;
          cliInput.value = cmdHistory[cmdHistory.length - 1 - historyIdx];
        } else if (historyIdx === 0) {
          historyIdx = -1;
          cliInput.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const current = cliInput.value.trim().toLowerCase();
        if (!current) return;
        const candidates = [
          'git status',
          'git status -s',
          'git add app/deployment.yaml',
          'git add .',
          'git commit -m "Scale cache deployment"',
          'git switch main',
          'git switch feature/cache',
          'git checkout HEAD~1',
          'git log --oneline',
          'git diff',
          'git rebase main',
          'git restore --staged app/deployment.yaml',
          'git reset --soft HEAD~1',
          'git reset --mixed HEAD~1',
          'git reset --hard HEAD~1',
          'git revert HEAD',
          'git worktree list',
          'git worktree add ../wt/networking -b feature/networking',
          'git reflog',
          'git cat-file -p HEAD',
          'git cat-file -p HEAD^{tree}',
          'git hash-object -w app/deployment.yaml',
          'git write-tree',
          'clear',
          'help',
          'pwd',
          'ls -la',
          ...lab.steps.map(s => s.command)
        ];
        const match = candidates.find(c => c.toLowerCase().startsWith(current));
        if (match) {
          cliInput.value = match;
        }
      }
    });
  }

  // Focus input when clicking inside terminal window
  terminalWindowEl?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON' && target.tagName !== 'A' && target !== cliInput) {
      cliInput?.focus();
    }
  });

  // Action Rail buttons
  actionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      stopPlay();
      const idx = Number(btn.getAttribute('data-step-index') || 0);
      renderStep(idx, true);
    });
  });

  // Steppers
  q(wsEl, '[data-act-first]')?.addEventListener('click', () => {
    stopPlay();
    renderStep(0, false);
  });

  q(wsEl, '[data-act-prev]')?.addEventListener('click', () => {
    stopPlay();
    renderStep(currentStepIdx - 1, true);
  });

  q(wsEl, '[data-act-next]')?.addEventListener('click', () => {
    stopPlay();
    renderStep(currentStepIdx + 1, true);
  });

  q(wsEl, '[data-act-reset]')?.addEventListener('click', () => {
    stopPlay();
    renderStep(0, false);
  });

  // Play animation through steps
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (playTimer !== undefined) {
        stopPlay();
        return;
      }
      playBtn.textContent = '⏸ Pause';
      if (currentStepIdx >= lab.steps.length - 1) {
        renderStep(0, false);
      }
      playTimer = window.setInterval(() => {
        if (currentStepIdx >= lab.steps.length - 1) {
          stopPlay();
          return;
        }
        renderStep(currentStepIdx + 1, true);
      }, 1600);
    });
  }

  // Clickable Quick-Run Chips
  qa<HTMLButtonElement>(wsEl, '[data-chip-cmd]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-chip-cmd');
      if (cmd) executeCommand(cmd);
    });
  });

  // Clickable Filesystem items in Column 1
  fileTreeEl?.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('.file-tree-item');
    if (!item) return;
    const path = item.getAttribute('data-file-path');
    if (!path) return;
    if (item.classList.contains('is-dir')) {
      executeCommand(`ls -la ${path}`);
    } else {
      executeCommand(`cat ${path}`);
    }
  });

  // Clickable Internals Cards in Column 3
  qa<HTMLElement>(wsEl, '[data-inspect-card]').forEach((card) => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-inspect-card');
      const curInternals = getStepInternals(lab, currentStepIdx);
      if (type === 'head') {
        executeCommand('cat .git/HEAD');
      } else if (type === 'branch') {
        executeCommand(`cat .git/refs/heads/${curInternals.branchRef || lab.branch}`);
      } else if (type === 'commit') {
        executeCommand(`git cat-file -p ${curInternals.commitHash || 'HEAD'}`);
      } else if (type === 'tree') {
        executeCommand(`git cat-file -p ${curInternals.treeHash || 'HEAD^{tree}'}`);
      } else if (type === 'blob') {
        executeCommand(`git cat-file -p ${curInternals.blobHash || 'HEAD:app/deployment.yaml'}`);
      }
    });
  });

  // Clickable SVG diagram nodes in Bottom Topology strip
  svgCanvasEl?.addEventListener('click', (e) => {
    const node = (e.target as Element).closest<SVGElement>('[data-git-inspect-cmd]');
    if (!node) return;
    const cmd = node.getAttribute('data-git-inspect-cmd');
    if (cmd) executeCommand(cmd);
  });

  // Worktree selector handlers for Lab 10
  if (labId === 'worktrees-reflog-and-plumbing') {
    const wtButtons = qa<HTMLButtonElement>(wsEl, '[data-wt-target]');
    const wtConfig: Record<string, { path: string; branch: string }> = {
      main: { path: '/home/dev/repos/infra-platform', branch: 'main' },
      networking: { path: '/home/dev/wt/networking', branch: 'feature/networking' },
      iam: { path: '/home/dev/wt/iam', branch: 'feature/iam' },
      hotfix: { path: '/home/dev/wt/hotfix', branch: 'hotfix/alb-healthcheck' }
    };

    wtButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-wt-target') || 'main';
        const cfg = wtConfig[target];
        if (!cfg) return;

        wtButtons.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });

        if (promptBranchEl) promptBranchEl.textContent = cfg.branch;
        if (promptPathEl) promptPathEl.textContent = cfg.path;
        if (termTabEl) termTabEl.textContent = `bash · dev@lab:${cfg.path} (${cfg.branch})`;

        if (termHistoryEl && terminalWindowEl) {
          const switchDiv = document.createElement('div');
          switchDiv.className = 'terminal-line is-prompt';
          switchDiv.innerHTML = `
            <span class="term-prompt">dev@lab:${escapeHtml(cfg.path)} (${escapeHtml(cfg.branch)})$</span>
            <span class="term-cmd">pwd &amp;&amp; git status -s</span>
          `;
          const outDiv = document.createElement('div');
          outDiv.className = 'terminal-output';
          outDiv.innerHTML = `
            <pre class="term-out-line">${escapeHtml(cfg.path)}</pre>
            <pre class="term-out-line term-success"># Switched active worktree shell. Dedicated HEAD and index loaded.</pre>
          `;
          termHistoryEl.append(switchDiv, outDiv);
          terminalWindowEl.scrollTop = terminalWindowEl.scrollHeight;
        }

        updateInspector(
          `Switched Worktree: ${cfg.path}`,
          `Active working directory updated to ${cfg.path}. Isolated HEAD points to ${cfg.branch}, referencing shared .git/objects without disk duplication.`,
          `Checked out: ${cfg.branch}`,
          `cd ${cfg.path}`,
          'Worktrees isolate Git checkout and index, but do not isolate local TCP ports or cloud Terraform locks!'
        );
      });
    });
  }

  // Initial step render
  renderStep(0, false);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
