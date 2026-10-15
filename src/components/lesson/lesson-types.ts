/**
 * A lesson is a chain of views on one growing picture. Each view owns a diagram; each frame says
 * which parts of it exist yet, which are active, and what sits beside it (messages, state, code).
 */
export type NodeKind = 'code' | 'model' | 'tool' | 'kube' | 'store' | 'person' | 'terminal' | 'gate' | 'part';
export type Node = { id: string; x: number; y: number; w?: number; h?: number; kind: NodeKind; label: string; sub?: string };
export type Edge = {
  id: string; from: string; to: string; label?: string;
  /** `imagined` is a path people assume exists; it is drawn dashed and never carries anything. */
  kind?: 'flow' | 'imagined';
  /** Moves a straight edge sideways so two edges between the same nodes don't overlap. */
  shift?: number;
  /** Corner points for an edge that can't be a straight line. */
  via?: [number, number][];
};
export type Zone = { id: string; x: number; y: number; w: number; h: number; label: string };
export type Diagram = { width: number; height: number; nodes: Node[]; edges: Edge[]; zones?: Zone[]; title: string };

export type Pic = {
  /** Ids of the nodes, edges and zones drawn in this frame. Omit to draw everything. */
  show?: string[];
  hot?: string[];
  fresh?: string[];
  denied?: string[];
  /** Replaces an edge's label for this frame. */
  say?: Record<string, string>;
  /** A short tag on a node's corner, such as "saved" or "runs again". */
  badge?: Record<string, string>;
};

export type Role = 'system' | 'user' | 'assistant' | 'tool';
export type Msg = { role: Role; text: string; by?: string; fresh?: boolean; dim?: boolean };
export type MessagePanel = { title: string; rows: Msg[]; note?: string };
export type Meter = { title: string; rows: { label: string; tokens: number; fresh?: boolean }[]; note?: string };
export type StateRow = { key: string; value: string; mark?: 'read' | 'write' | 'new' };
export type StatePanel = { title: string; rows: StateRow[]; note?: string };
export type StoreRow = { id: string; text: string; mark?: 'fresh' | 'loaded' | 'lost' };
export type StorePanel = { title: string; rows: StoreRow[]; note?: string };
export type Gate = { check: string; result: 'pass' | 'fail' | 'skip'; why: string };
export type GatePanel = {
  title: string; call: string; rows: Gate[]; verdict: string; ok: boolean;
  /** Replaces the verdict label (RUNS / DOES NOT RUN) and the row marks (yes / no / not reached). */
  words?: { ok: string; stopped: string; pass: string; fail: string; skip: string };
};
export type TablePanel = { title: string; head: string[]; rows: string[][]; hot?: number };
export type Code = { title: string; text: string; hot?: number[] };
export type Notice = { tone: 'ok' | 'warn' | 'stop'; label: string; text: string };
/** A command, what it printed, and what that tells you. Revealed one at a time. */
export type Check = [command: string, output: string, meaning: string];

export type Frame = {
  action: string;
  caption: string;
  pic?: Pic;
  messages?: MessagePanel;
  meter?: Meter;
  state?: StatePanel;
  store?: StorePanel;
  gates?: GatePanel;
  table?: TablePanel;
  code?: Code[];
  notice?: Notice;
  /** With checks, the caption is shown as the symptom and the verdict follows the last check. */
  checks?: Check[];
  verdict?: string;
};

export type View = {
  id: string;
  group: string;
  label: string;
  title: string;
  lede: string;
  /**
   * `steps` is a sequence in time; `choices` compares alternatives; `scale` is choices along one axis.
   * `custom` draws the slot named `view-<id>` instead of frames.
   */
  mode: 'steps' | 'choices' | 'scale' | 'custom';
  /** Marks one of the page's few rich interactions. */
  hero?: boolean;
  /** A table shown under every frame of the view. */
  table?: TablePanel;
  diagram?: Diagram;
  frames: Frame[];
  inspector: { heading: string; body: string; facts: [string, string][]; evidence: [string, string]; note: string };
  takeaway: string;
  sources: number[];
};

export type Lesson = {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  reference: string;
  format: string;
  scenario: string;
  scope: string;
  groups: string[];
  views: View[];
  sources: { label: string; url: string }[];
  related: { label: string; href: string }[];
  /** Defaults to the AI collection, where the lesson console started. */
  collection?: { href: string; label: string };
  /** Legend entries; `kind` is a node kind or one of hot, imagined, denied. Defaults to the AI legend. */
  legend?: { kind: string; label: string }[];
};

/** Builders that keep the lesson files readable. */
export const node = (id: string, kind: NodeKind, x: number, y: number, label: string, sub?: string, w?: number, h?: number): Node => ({ id, kind, x, y, label, sub, w, h });
export const edge = (id: string, from: string, to: string, label?: string, more: Partial<Edge> = {}): Edge => ({ id, from, to, label, ...more });
export const code = (title: string, text: string, hot?: number[]): Code => ({ title, text: text.replace(/^\n/, '').trimEnd(), hot });
export const msg = (role: Role, text: string, more: Partial<Msg> = {}): Msg => ({ role, text, ...more });
