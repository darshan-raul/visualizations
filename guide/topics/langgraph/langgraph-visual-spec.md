# LangGraph: The Agent Loop as a Graph — visual specification

- **Topic:** the agent loop redrawn as a graph over shared state, and what that makes possible.
- **Status and version:** 1.0, written and integrated on 2026-10-11 at `/langgraph`. Canonical source is [`src/content/topics/langgraph.mdx`](../../../src/content/topics/langgraph.mdx) with lesson data in `src/components/lesson/langgraph-lesson.ts`. Built from the second half of the owner's brief without an approval prototype; the first half is [LangChain](../langchain/langchain-visual-spec.md), whose specification lists every change made to the brief.
- **Target audience:** engineers who know an agent is a model-and-tools loop and want to know what a graph runtime adds.
- **Page promise:** the reader can look at an agent requirement (fixed routing, surviving a restart, waiting for approval) and say which LangGraph feature provides it and what it costs.
- **Persistent scenario:** the same question, "Why is payments-api failing?", for pod `payments-api-7d9f` in namespace `payments`, run as thread `session-123`.
- **Scope:** why a loop in a script runs out, state and nodes, reducers, the agent as a graph, the loop/graph/`create_agent` equivalence, typed state, conditional routing, bounded cycles, checkpoints, resume after a crash, `interrupt()` for approval, the graph inside a service, and who owns what.
- **Non-goals:** subgraphs, parallel branches and `Send`, stream modes, the long-term Store, time travel, multi-agent patterns, LangSmith and the Agent Server.

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

Five index groups: **Why a graph** (01–03), **The agent as a graph** (04–05), **Your own flow** (06–08), **Saved state** (09–11), **In a service** (12–13).

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
| 12 | In a service (`#service`) | Where does this sit? | Service map, tools in process or behind MCP | 2 options | The graph is one component. |
| 13 | Who owns what (`#whole-picture`) | What is each layer for? | The agent graph and an ownership table | None | Authority stays with the application. |

Hero interactions: the stepped agent run (view 4), the routing switch (view 7), and crash and resume (view 10).

## Per-view contracts

Composition, accessibility and responsive behaviour are those of the [LangChain specification](../langchain/langchain-visual-spec.md#per-view-contracts); both pages use the same console component.

Failure and alternate states: a restart, a needed approval and a fixed order the script cannot give (view 1); a cycle with no exit stopped by `GraphRecursionError` (8); a process killed during a tool call (10); a rejected write (11).

Data states worth fixing in an implementation:

- View 4: messages count 1, 2, 3, 5, 6 across the five steps.
- View 9: snapshots `next: model · 1`, `tools · 2`, `model · 3`, `tools · 4`, `model · 5`, `nothing · 6`.
- View 10: the crash leaves the newest snapshot at `next: tools · 4 messages`; resuming runs `tools`, then `model`.
- View 11: paused at `next: approval`; `Command(resume=True)` reaches `apply_fix`, `Command(resume=False)` reaches END.

## Persistent console elements

As the LangChain page, with `thread session-123` in the scenario line. `#lg-sources` opens the sources. Without JavaScript all 13 views are stacked with every step and option drawn.

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
| `durability="sync"` | LangGraph checkpointers documentation; not run |
| `MCPAdapter` | LangChain MCP documentation; present in 1.4.4, not run (needs the `fastmcp` extra and a server) |

## Integration notes

Shared with the LangChain page: `src/components/lesson/`, `src/styles/lesson-console.css`, and `scripts/verify-agent-lessons.py`. Deep-dive handoffs, not yet written: streaming a run to a UI, and multi-agent graphs.

## Page-level acceptance

- [x] `npm run verify` passes; `scripts/verify-agent-lessons.py` passes.
- [x] Every source URL returned 200 on 2026-10-11.
- [x] Headless Firefox screenshots inspected at 1440 px (nine view states), 320 px, and with JavaScript disabled.
- [ ] Not yet exercised by hand: keyboard and touch operation, focus order, 200% zoom, reduced motion, Back and Forward.

## Source index

1. [LangGraph: Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) — views 1–8, 13
2. [LangGraph: persistence](https://docs.langchain.com/oss/python/langgraph/persistence) — views 1, 9, 10, 12
3. [LangGraph: checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers) — views 9, 10
4. [LangGraph: interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) — view 11
5. [LangChain: agents](https://docs.langchain.com/oss/python/langchain/agents) — views 4, 13
6. [LangChain reference: create_agent](https://reference.langchain.com/python/langchain/agents/factory/create_agent) — view 5
7. [LangChain: human-in-the-loop middleware](https://docs.langchain.com/oss/python/langchain/human-in-the-loop) — view 11
8. [Kubernetes: Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) — views 6, 7
9. [LangChain: Model Context Protocol](https://docs.langchain.com/oss/python/langchain/mcp) — view 12
10. [Kubernetes: RBAC authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) — views 12, 13
