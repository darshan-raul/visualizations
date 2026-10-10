// Replays the Git lesson's claims against the installed Git in a throwaway repository.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = mkdtempSync(join(tmpdir(), 'infra-illustrated-git-'));
const repo = join(root, 'my-app');
const origin = join(root, 'origin.git');
const mate = join(root, 'teammate');
const env = { ...process.env, GIT_AUTHOR_NAME: 'Example', GIT_AUTHOR_EMAIL: 'dev@example.invalid', GIT_COMMITTER_NAME: 'Example',
  GIT_COMMITTER_EMAIL: 'dev@example.invalid', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', LC_ALL: 'C' };
const run = (cwd, ...args) => spawnSync('git', args, { cwd, env, encoding: 'utf8' });
const git = (cwd, ...args) => {
  const result = run(cwd, ...args);
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout.trimEnd();
};
const app = (replicas, extra = []) => ['name: shop', `replicas: ${replicas}`, ...extra, ''].join('\n');
const put = (cwd, name, content) => writeFileSync(join(cwd, name), content);
const read = (cwd, name) => readFileSync(join(cwd, name), 'utf8');
const save = (cwd, message) => { git(cwd, 'add', '-A'); git(cwd, 'commit', '-m', message); return git(cwd, 'rev-parse', 'HEAD'); };
const at = (cwd, rev) => git(cwd, 'rev-parse', rev);
const parents = (cwd, rev) => git(cwd, 'log', '-1', '--format=%P', rev).split(' ').filter(Boolean);

try {
  git(root, 'init', '-q', '-b', 'main', repo);
  // Views 2–3: a commit keeps its contents; each commit names its parent.
  put(repo, 'app.yaml', app(2)); put(repo, 'notes.md', '- add a cache\n');
  const A = save(repo, 'A');
  put(repo, 'app.yaml', app(3));
  assert.equal(git(repo, 'show', `${A}:app.yaml`), app(2).trimEnd());
  const B = save(repo, 'B');
  assert.deepEqual(parents(repo, B), [A]);
  put(repo, 'app.yaml', app(4));
  const C = save(repo, 'C');

  // View 4: the commit is built from the staging area, not the folder.
  put(repo, 'app.yaml', app(5)); put(repo, 'notes.md', '- add a cache\n- half an idea\n');
  git(repo, 'add', 'app.yaml'); git(repo, 'commit', '-m', 'D');
  assert.equal(git(repo, 'show', 'HEAD:notes.md'), '- add a cache');
  assert.match(read(repo, 'notes.md'), /half an idea/);
  git(repo, 'restore', 'notes.md');

  // Views 5–6: a commit moves only the branch HEAD is on; a new branch adds no commit.
  put(repo, 'notes.md', '- add a cache\n- e\n');
  const E = save(repo, 'E');
  git(repo, 'branch', 'idea');
  assert.equal(at(repo, 'idea'), at(repo, 'main'));
  git(repo, 'switch', '-q', 'idea');
  put(repo, 'app.yaml', app(5, ['cache: on']));
  const F = save(repo, 'F');
  assert.equal(at(repo, 'main'), E);

  // View 7: switching rewrites files, and refuses to overwrite an unsaved edit.
  git(repo, 'switch', '-q', 'main');
  assert.equal(read(repo, 'app.yaml'), app(5));
  git(repo, 'switch', '-q', 'idea');
  put(repo, 'app.yaml', app(7, ['cache: on']));
  const refused = run(repo, 'switch', 'main');
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /Your local changes to the following files would be overwritten by checkout/);
  assert.equal(git(repo, 'branch', '--show-current'), 'idea');
  git(repo, 'restore', 'app.yaml');

  // View 8: fast-forward, then a merge commit with two parents that holds both changes.
  git(repo, 'switch', '-q', 'main');
  assert.match(git(repo, 'merge', 'idea'), /Fast-forward/);
  assert.equal(at(repo, 'main'), F);
  put(repo, 'app.yaml', app(6, ['cache: on']));
  const G = save(repo, 'G');
  git(repo, 'switch', '-q', 'idea');
  put(repo, 'app.yaml', app(5, ['cache: on', 'timeout: 30']));
  const H = save(repo, 'H');
  git(repo, 'switch', '-q', 'main');
  git(repo, 'merge', '-q', '--no-edit', 'idea');
  assert.deepEqual(parents(repo, 'HEAD'), [G, H]);
  assert.equal(read(repo, 'app.yaml'), app(6, ['cache: on', 'timeout: 30']));
  assert.equal(at(repo, 'idea'), H);

  // View 9: same line on both sides stops the merge; add and commit finish it.
  const FULL = ['cache: on', 'timeout: 30'];
  git(repo, 'branch', 'tune');
  put(repo, 'app.yaml', app(8, FULL));
  const I = save(repo, 'I');
  git(repo, 'switch', '-q', 'tune');
  put(repo, 'app.yaml', app(10, FULL));
  const J = save(repo, 'J');
  git(repo, 'switch', '-q', 'main');
  const conflict = run(repo, 'merge', 'tune');
  assert.notEqual(conflict.status, 0);
  assert.match(conflict.stdout, /CONFLICT \(content\): Merge conflict in app\.yaml/);
  assert.equal(read(repo, 'app.yaml'), ['name: shop', '<<<<<<< HEAD', 'replicas: 8', '=======', 'replicas: 10', '>>>>>>> tune', ...FULL, ''].join('\n'));
  assert.equal(at(repo, 'main'), I);
  put(repo, 'app.yaml', app(10, FULL));
  git(repo, 'add', 'app.yaml'); git(repo, 'commit', '-q', '--no-edit');
  assert.deepEqual(parents(repo, 'HEAD'), [I, J]);

  // View 10: rebase makes a new commit with a new parent and leaves the old one unlabelled.
  const N = at(repo, 'HEAD');
  git(repo, 'branch', 'fix');
  put(repo, 'notes.md', '- add a cache\n- e\n- o\n');
  const O = save(repo, 'O');
  git(repo, 'switch', '-q', 'fix');
  put(repo, 'app.yaml', app(10, [...FULL, 'retries: 2']));
  const P = save(repo, 'P');
  assert.deepEqual(parents(repo, P), [N]);
  git(repo, 'rebase', '-q', 'main');
  assert.notEqual(at(repo, 'fix'), P);
  assert.deepEqual(parents(repo, 'fix'), [O]);
  assert.equal(git(repo, 'cat-file', '-t', P), 'commit');
  assert.equal(git(repo, 'branch', '--contains', P), '');
  git(repo, 'switch', '-q', 'main'); git(repo, 'merge', '-q', 'fix');

  // View 11: push moves the shared branch; fetch moves only origin/main.
  git(root, 'init', '-q', '--bare', '-b', 'main', origin);
  git(repo, 'remote', 'add', 'origin', origin);
  git(repo, 'push', '-q', '-u', 'origin', 'main');
  git(root, 'clone', '-q', origin, mate);
  put(mate, 'notes.md', read(mate, 'notes.md') + '- s\n');
  const S = save(mate, 'S');
  git(mate, 'push', '-q');
  const before = at(repo, 'main');
  assert.equal(at(repo, 'origin/main'), before);
  git(repo, 'fetch', '-q');
  assert.equal(at(repo, 'origin/main'), S);
  assert.equal(at(repo, 'main'), before);
  assert.match(git(repo, 'merge', 'origin/main'), /Fast-forward/);

  // View 12: a push that would drop a commit is rejected; fetch, merge, push succeeds.
  put(repo, 'app.yaml', app(11, [...FULL, 'retries: 2']));
  const T = save(repo, 'T');
  put(mate, 'notes.md', read(mate, 'notes.md') + '- u\n');
  const U = save(mate, 'U');
  git(mate, 'push', '-q');
  const rejected = run(repo, 'push');
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /! \[rejected\]\s+main -> main \(fetch first\)/);
  assert.equal(at(origin, 'main'), U);
  git(repo, 'fetch', '-q'); git(repo, 'merge', '-q', '--no-edit', 'origin/main');
  assert.deepEqual(parents(repo, 'HEAD'), [T, U]);
  git(repo, 'push', '-q');
  assert.equal(at(origin, 'main'), at(repo, 'main'));

  // View 13: restore, restore --staged, reset (mixed), revert.
  const V = at(repo, 'HEAD');
  put(repo, 'app.yaml', app(12, FULL));
  const W = save(repo, 'W');
  put(repo, 'app.yaml', app(14, FULL));
  git(repo, 'restore', 'app.yaml');
  assert.equal(read(repo, 'app.yaml'), app(12, FULL));
  put(repo, 'notes.md', '- ship it\n'); git(repo, 'add', 'notes.md');
  git(repo, 'restore', '--staged', 'notes.md');
  assert.equal(git(repo, 'diff', '--cached', '--name-only'), '');
  assert.equal(read(repo, 'notes.md'), '- ship it\n');
  git(repo, 'restore', 'notes.md');
  git(repo, 'reset', '-q', 'HEAD~1');
  assert.equal(at(repo, 'main'), V);
  assert.equal(read(repo, 'app.yaml'), app(12, FULL));
  assert.equal(git(repo, 'diff', '--name-only'), 'app.yaml');
  git(repo, 'reset', '-q', '--hard', W);
  git(repo, 'revert', '--no-edit', 'HEAD');
  assert.deepEqual(parents(repo, 'HEAD'), [W]);
  assert.equal(git(repo, 'diff', '--name-only', V, 'HEAD'), '');

  // View 14: a commit names a tree and a parent; unchanged files reuse a blob; the reflog finds an unlabelled commit.
  assert.match(git(repo, 'cat-file', '-p', W), /^tree [0-9a-f]+\nparent [0-9a-f]+\nauthor /);
  assert.equal(at(repo, `${A}:notes.md`), at(repo, `${C}:notes.md`));
  git(repo, 'reset', '-q', '--hard', 'HEAD~1');
  assert.match(git(repo, 'reflog'), /HEAD@\{0\}: reset: moving to HEAD~1/);
  git(repo, 'branch', 'rescue', 'HEAD@{1}');
  assert.deepEqual(parents(repo, 'rescue'), [W]);

  console.log(`Git lesson claims hold on ${git(root, '--version')}.`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
