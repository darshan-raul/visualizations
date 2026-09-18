/** Source URL constants for primary references */
export const man = 'https://man7.org/linux/man-pages/';
export const kernel = 'https://docs.kernel.org/';
export const systemd = 'https://www.freedesktop.org/software/systemd/man/latest/';
export const bash = 'https://www.gnu.org/software/bash/manual/html_node/';
export const debian = 'https://www.debian.org/doc/manuals/apt-guide/';
export const nftables = 'https://wiki.nftables.org/wiki-nftables/index.php/Main_Page';

/** View kinds — actor diagrams are the original layout; structured kinds are the new additions */
export type ViewKind =
  | 'path' | 'tree' | 'layers' | 'split' | 'evidence'
  | 'walkthrough' | 'comparison' | 'recipe' | 'reference' | 'gotcha' | 'decision' | 'interactive-tree' | 'interactive-permission' | 'interactive-vfs' | 'interactive-packet' | 'interactive-pipeline' | 'interactive-nss';

export const actorKinds: readonly string[] = ['path', 'tree', 'layers', 'split', 'evidence'];

export type Actor = { label: string; detail: string };

export type FailureState = {
  label: string;
  result: string;
  output: string;
  blocked: number;
  afterActors: Actor[];
};

export type WalkthroughStep = {
  command: string;
  output: string;
  annotation: string;
};

export type ComparisonItem = {
  label: string;
  detail: string;
  command?: string;
  output?: string;
  highlight?: 'good' | 'bad' | 'neutral';
};

export type RecipeStep = {
  step: string;
  command?: string;
  output?: string;
  note?: string;
};

export type DecisionNode = {
  id: string;
  label: string;
  type: 'start' | 'question' | 'action' | 'result';
  yes?: string;
  no?: string;
  next?: string;
};

/**
 * A single view within a Linux pillar.
 * The `kind` field determines which optional content fields are used for rendering.
 */
export type LinuxView = {
  id: string;
  label: string;
  title: string;
  question: string;
  kind: ViewKind;
  explanation: string;
  takeaway: string;
  caveat: string;
  source: string;

  /** Inspector terminal — provide for ALL views so the sidebar always has a relevant command */
  command?: string;
  output?: string;
  probe?: string;
  probeOutput?: string;

  /** Actor-diagram views (path, tree, layers, split, evidence) */
  actors?: Actor[];
  failure?: FailureState;

  /** Command walkthrough — annotated command sequences */
  steps?: WalkthroughStep[];

  /** Comparison — side-by-side items */
  items?: ComparisonItem[];

  /** Recipe — numbered practical steps */
  recipeSteps?: RecipeStep[];

  /** Reference table */
  headers?: string[];
  rows?: string[][];
  tableNote?: string;

  /** Gotcha — common mistake with fix */
  mistake?: string;
  why?: string;
  fix?: string;
  wrongCommand?: string;
  wrongOutput?: string;
  rightCommand?: string;
  rightOutput?: string;

  /** Decision flow — troubleshooting flowchart nodes */
  decisions?: DecisionNode[];

  /** Interactive Tree Data */
  treeData?: any;

  /** Interactive Permission Data */
  permissionData?: any;

  /** Interactive VFS Data */
  vfsData?: any;

  /** Interactive Packet Data */
  packetData?: any;

  /** Interactive Pipeline Data */
  pipelineData?: any;

  /** Interactive NSS Data */
  nssData?: any;
};

/**
 * A pillar groups related views about one Linux subsystem.
 */
export type LinuxPillar = {
  id: string;
  name: string;
  short: string;
  promise: string;
  hints: string;
  bridge: string;
  groups: { label: string; viewIds: string[] }[];
  views: LinuxView[];
};
