# LangGraph: The Agent Loop as a Graph — visual specification

- **Topic:** the agent loop redrawn as a graph over shared state, and what that makes possible.
- **Status and version:** 1.1, written and integrated on 2026-10-11, and extended the same day from the owner's "LangGraph Field Notes" revision sheet (three views and a cheat sheet; see below) at `/langgraph`. Canonical source is [`src/content/topics/langgraph.mdx`](../../../src/content/topics/langgraph.mdx) with lesson data in `src/components/lesson/langgraph-lesson.ts`. Built from the second half of the owner's brief without an approval prototype; the first half is [LangChain](../langchain/langchain-visual-spec.md), whose specification lists every change made to the brief.
- **Target audience:** engineers who know an agent is a model-and-tools loop and want to know what a graph runtime adds.
- **Page promise:** the reader can look at an agent requirement (fixed routing, surviving a restart, waiting for approval) and say which LangGraph feature provides it and what it costs.
- **Persistent scenario:** the same question, "Why is payments-api failing?", for pod `payments-api-7d9f` in namespace `payments`, run as thread `session-123`.
- **Scope:** why a loop in a script runs out, state and nodes, reducers, the agent as a graph, the loop/graph/`create_agent` equivalence, typed state, conditional routing, bounded cycles, checkpoints, resume after a crash, `interrupt()` for approval, routing on a label and a confidence, specialist agents as nodes, the graph inside a service, stream modes, and who owns what.
- **Non-goals:** parallel branches and `Send`, custom stream events, the long-term Store, time travel, handoffs between agents and subagents called as tools, LangSmith and the Agent Server.

## Changes specific to this half of the brief

| Brief | Built | Why |
| --- | --- | --- |
| State, nodes and edges introduced as three words before any example | The one-node `greet` example first; the words arrive in its inspector | Owner's teaching preference: show the thing, then name it. |
| No reducers | View 3 | Without them, "nodes return updates" does not explain how a message list grows, and a missing reducer is a real bug. |
| Pending, CrashLoop, ImagePull and OOMKilled as four peer branches | Pending, CrashLoopBackOff, ImagePullBackOff and a fallback; OOMKilled appears as evidence | They are different kinds of thing: a phase, two waiting reasons and a termination reason. A crash-looping pod is often also OOMKilled. |
| "Delete pod", then "Restart deployment?" | One proposed write: raise the memory limit | The brief named two different actions, and neither addresses an OOM kill. |
| Checkpoints and crash recovery with no caveat | The node that was running starts again, so its side effects must be safe to repeat | Verified by running it; this is what a reader will get wrong. |
| Approval pauses the run | Adds that the node restarts from its first line on resume, and that a checkpointer and thread id are required | LangGraph interrupts documentation; verified by running it. |
| No loop bound in the graph | View 8: a counter in state, with `recursion_limit` as the backstop | The graph version of `MAX_STEPS` was missing. |
| FastAPI named in the production diagram | "your API" | The page is about the graph, and the framework in front of it is a free choice. |
| `MultiServerMCPClient` | `MCPAdapter` from `langchain.mcp` | Current in langchain 1.4; the older package is named in the note. |

## Changes from the field notes (1.1)

The revision sheet has ten cards. Seven were already on the page. The other three became views 12, 13 and 15, and its recap table became a second option in view 16. Where the sheet and the running code disagree, the page follows the code.

| Field notes | Built | Why |
| --- | --- | --- |
| Card 05: Jev owns the routing decision, `JevClient().decide()`, `langgraph-jev-router` | View 12 teaches the pattern (a label and a score in state, a low score goes to a person) and names Jev in the note | The pattern holds for any classifier. Jev is confirmed by the LangChain post of 2026-09-25, which gives no call signature or package name, so neither is printed. |
| Card 05: billing and security branches | workloads and network | The page's persistent scenario is a Kubernetes question. |
| Card 07: "supervisor pattern" | View 13 keeps the word supervisor for the node and says the LangChain guide calls this shape a router | In that guide a supervisor-like main agent calls subagents as tools, which is a different wiring. |
| Card 07: `Command(goto=…, update=…)` | Shown with its `Command[Literal[…]]` return type | Without the annotation the run works but the drawn graph has no edges out of the node. Verified by running it. |
| Card 06: `create_react_agent` is this graph, prebuilt | `create_agent`, with a note on the older name | `create_react_agent` is deprecated since LangGraph 1.0 and names its model node `agent`. Verified. |
| Card 08: a crash at step 7 resumes from step 7 | Unchanged view 10: the node in flight runs again | Already verified for 1.0. |
| Card 10: `interrupt()` returns the answer and the node continues where it paused | Unchanged view 11: the node restarts from its first line | Already verified for 1.0. |
| Card 09: two stream modes | View 15 shows `updates`, `messages` and a list of both, and names `values` and `version="v2"` | Verified by running each. |
| Card 03: the messages list is the memory | Not a new view | Covered by views 4 and 6 here and by the LangChain page. |

## Visual thesis

**Boxes do the work, arrows choose what runs next, and one record is passed between them.** The page draws that with one function, then with the agent's two boxes, then with a branching troubleshooting flow, and keeps the record and its saved copies beside the picture.

## Semantic color and diagram grammar

The grammar is the LangChain page's, with three additions.

| Element | Form | Meaning |
| --- | --- | --- |
| Pill | START, END | Where a run enters and leaves |
| Dashed amber box | | A step that waits for a person |
| State panel | Rows tagged "reads" (blue) or "writes" (green) | What the active node touches |
| Checkpoint panel | Rows tagged "just saved", "loaded" or "lost" | The saved snapshots for the thread |
| Green tag on a box | "saved", "runs again", "paused" | What the runtime did at that node |
| Red frame | "ONE PROCESS" | The process has died |

## Concept groups and narrative sequence

Six index groups: **Why a graph** (01–03), **The agent as a graph** (04–05), **Your own flow** (06–08), **Saved state** (09–11), **Bigger graphs** (12–13), **In a service** (14–16). Sixteen views is above the generator's 7–12 for a detailed overview; the page is a deep dive and each view still carries one idea.

| # | View (fragment) | Learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | The limit (`#why`) | What is wrong with my loop? | A loop and a list inside one process | 4 options | State, pausing and steering need structure. |
| 2 | One box (`#state-node`) | What is a node? | START, one function, END, and a record | 3 steps | A node returns only what it changed. |
| 3 | Merging (`#reducers`) | What happens when two nodes write? | Two nodes, one record | 2 options | Updates merge per key; lists need an adding reducer. |
| 4 | Agent graph (`#agent-graph`) | How is the agent a graph? | Two boxes and a question, with the state | 5 steps | A loop is a conditional edge and an edge back. |
| 5 | Three spellings (`#same-graph`) | Is this different from my loop? | The same graph beside three pieces of code | 3 options | The loop was already a graph. |
| 6 | Typed state (`#custom-state`) | Why more than messages? | A branching flow; fields each node reads and writes | 3 options | Name what later steps depend on. |
| 7 | Routing (`#routing`) | Who picks the path? | The flow with one branch lit | 4 options | Code picks the path when you know it. |
| 8 | Bounded loop (`#bounded-loop`) | How does a cycle end? | A cycle with a question | 3 options | Exit condition in state; runtime limit as a fuse. |
| 9 | Checkpoints (`#checkpoints`) | Where does state live? | The agent graph with a growing list of snapshots | 4 steps | State moves out of the process, one snapshot per step. |
| 10 | Crash, resume (`#resume`) | What survives a crash? | The process frame turns red, then a new one loads a snapshot | 5 steps | A crash costs one step, and that step runs twice. |
| 11 | Approval (`#approval`) | How does it wait for a person? | A flow with a waiting step before a write | 3 options | A pause is a checkpoint and a resume. |
| 12 | Unsure (`#confidence`) | What if the input is free text? | A triage box, a question and three destinations, with the label and score | 3 options | Store the decision and its confidence; a low score goes to a person. |
| 13 | Specialists (`#specialists`) | How does this grow past a few branches? | A supervisor over three agent graphs, each with its own loop | 4 options | A compiled graph can be a node; keep the top level small. |
| 14 | In a service (`#service`) | Where does this sit? | Service map, tools in process or behind MCP | 2 options | The graph is one component. |
| 15 | Streaming (`#streaming`) | What does the caller see during a run? | The agent graph and a table of arriving events | 4 options | `invoke` for the result, `stream` when someone is watching. |
| 16 | Who owns what (`#whole-picture`) | What is each layer for? | The agent graph, an ownership table and a cheat sheet | 2 options | Authority stays with the application. |

Hero interactions: the stepped agent run (view 4), the routing switch (view 7), and crash and resume (view 10).

## Per-view contracts

Composition, accessibility and responsive behaviour are those of the [LangChain specification](../langchain/langchain-visual-spec.md#per-view-contracts); both pages use the same console component.

Failure and alternate states: a restart, a needed approval and a fixed order the script cannot give (view 1); a cycle with no exit stopped by `GraphRecursionError` (8); a process killed during a tool call (10); a rejected write (11); a low-confidence label that is not followed (12).

Data states worth fixing in an implementation:

- View 4: messages count 1, 2, 3, 5, 6 across the five steps.
- View 9: snapshots `next: model · 1`, `tools · 2`, `model · 3`, `tools · 4`, `model · 5`, `nothing · 6`.
- View 10: the crash leaves the newest snapshot at `next: tools · 4 messages`; resuming runs `tools`, then `model`.
- View 11: paused at `next: approval`; `Command(resume=True)` reaches `apply_fix`, `Command(resume=False)` reaches END.
- View 12: scores 0.94 and 0.88 follow the label; 0.41 goes to `ask_person` although the label says `network`. The bar is 0.6.
- View 13: the storage agent appears only in the third and fourth options. After the workloads agent runs, the outer state has 6 messages.
- View 15: `updates` gives five events (model, tools, model, tools, model); the token rows are illustrative.

## Persistent console elements

As the LangChain page, with `thread session-123` in the scenario line. `#lg-sources` opens the sources. Without JavaScript all 16 views are stacked with every step and option drawn.

## Accuracy decisions

Each row was checked by `scripts/verify-agent-lessons.py` against langgraph 1.2.14 and langchain 1.4.4 unless a document is named.

| Decision | Basis |
| --- | --- |
| A run of three model calls and two tool runs leaves seven checkpoints; the page shows the six that hold state and says so | Script: `get_state_history` |
| After a crash in `tools`, resuming with `invoke(None, config)` runs `tools` then `model`; earlier model calls are not repeated | Script |
| `interrupt()` returns its payload under `__interrupt__`, leaves `next == ('approval',)`, and the node body starts twice | Script |
| `tools_condition` returns `"tools"` or `"__end__"` | Script |
| `add_conditional_edges` with a function returning node names routes all four cases | Script |
| The default recursion limit is not stated as a number to rely on | An endless graph stopped at 10,007 steps in 1.2.14; the Graph API guide says 1,000; earlier releases used 25. The page tells the reader to set it. |
| `HumanInTheLoopMiddleware` stops a write tool and a rejection returns a tool message without running it | Script, and the middleware documentation |
| `stream_mode="updates"` gives one `{node: update}` per finished node; `"messages"` gives `(AIMessageChunk, metadata)` with `langgraph_node`; a list of modes gives `(mode, data)`; `version="v2"` gives dicts with `type`, `ns` and `data` | Script |
| A paused run's `updates` stream is a single `__interrupt__` event | Script |
| `add_conditional_edges` with a list of destinations routes on label and score and draws all three edges | Script |
| A `create_agent` graph passed to `add_node` runs its loop and its messages reach the outer state; `subgraphs=True` tags its events with a non-empty namespace | Script |
| `Command(goto=…, update=…)` routes with or without a return annotation; only the annotated node has edges in `get_graph()` | Script |
| `create_react_agent` warns `LangGraphDeprecatedSinceV10` and builds `__start__, agent, tools, __end__` | Script |
| An LLM's self-reported confidence is not a measured probability; the 0.6 bar is an example | Editorial judgement, not run |
| Jev returns typed answers with probabilities and generates no text | LangChain blog, 2026-09-25; vendor's description, not run |
| `durability="sync"` | LangGraph checkpointers documentation; not run |
| `MCPAdapter` | LangChain MCP documentation; present in 1.4.4, not run (needs the `fastmcp` extra and a server) |

## Integration notes

Shared with the LangChain page: `src/components/lesson/`, `src/styles/lesson-console.css`, and `scripts/verify-agent-lessons.py`. Deep-dive handoffs, not yet written: streaming a run to a UI in full, and handoffs between agents.

## Page-level acceptance

- [x] `npm run verify` passes; `scripts/verify-agent-lessons.py` passes.
- [x] Every source URL returned 200 on 2026-10-11.
- [x] Headless Firefox screenshots inspected at 1440 px (nine view states), 320 px, and with JavaScript disabled.
- [x] 1.1: views 12, 13, 15 and 16 inspected at 1440 px (seven states) and views 12 and 13 at 320 px. The no-JavaScript capture covered only the top of the page.
- [ ] Not yet exercised by hand: keyboard and touch operation, focus order, 200% zoom, reduced motion, Back and Forward.

## Source index

1. [LangGraph: Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) — views 1–8, 12, 13, 16
2. [LangGraph: persistence](https://docs.langchain.com/oss/python/langgraph/persistence) — views 1, 9, 10, 14
3. [LangGraph: checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers) — views 9, 10
4. [LangGraph: interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) — views 11, 12
5. [LangChain: agents](https://docs.langchain.com/oss/python/langchain/agents) — views 4, 16
6. [LangChain reference: create_agent](https://reference.langchain.com/python/langchain/agents/factory/create_agent) — view 5
7. [LangChain: human-in-the-loop middleware](https://docs.langchain.com/oss/python/langchain/human-in-the-loop) — view 11
8. [Kubernetes: Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) — views 6, 7
9. [LangChain: Model Context Protocol](https://docs.langchain.com/oss/python/langchain/mcp) — view 14
10. [Kubernetes: RBAC authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) — views 14, 16
11. [LangGraph: streaming](https://docs.langchain.com/oss/python/langgraph/streaming) — view 15
12. [LangGraph: subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs) — view 13
13. [LangChain: multi-agent](https://docs.langchain.com/oss/python/langchain/multi-agent) — view 13
14. [LangChain blog: Jev and LangGraph](https://www.langchain.com/blog/building-prod-with-jev-and-langgraph) — view 12
