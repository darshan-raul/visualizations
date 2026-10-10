# LangChain: From One Model Call to an Agent — visual specification

- **Topic:** what happens when an LLM application uses tools, taught from the HTTP call upward, and which of those pieces LangChain names.
- **Status and version:** 1.0, written and integrated on 2026-10-11 at `/langchain`. Canonical source is [`src/content/topics/langchain.mdx`](../../../src/content/topics/langchain.mdx) with lesson data in `src/components/lesson/langchain-lesson.ts`. The owner supplied the stage list and asked for the visual to be built, so no approval prototype exists. The companion page is [LangGraph](../langgraph/langgraph-visual-spec.md).
- **Target audience:** engineers who can read Python and have used `kubectl`, and have not looked underneath an agent framework.
- **Page promise:** the reader can say, for any agent, what is sent to the model, what comes back, and which code actually runs a tool.
- **Persistent scenario:** a read-only assistant for the `payments` namespace is asked "Why is payments-api failing?". It has two tools, `list_pods` and `get_pod_details`, and the pod `payments-api-7d9f` is in CrashLoopBackOff after being OOMKilled.
- **Scope:** one model call, the SDK and router layers, roles, resending history, tool calling, argument parsing and validation, a Kubernetes-backed tool, the multi-step run, the loop and its limits, the authority checks, LangChain messages, `@tool`, `bind_tools`, Runnables and LCEL, `create_agent`, and one comparison of the layers.
- **Non-goals:** retrieval, structured output, streaming, prompt templates, callbacks, evaluation, multi-agent patterns, model pricing, and the Responses API.

## Gaps found in the owner's brief, and what was built

The brief described 23 stages, two side lessons and six persistent panels on one horizontal canvas. These are the places where it was changed, with the reason.

| Brief | Built | Why |
| --- | --- | --- |
| One page, 23 stages | Two console topics: 15 views here, 13 on `/langgraph` | The brief's own split point (stage 13 to 14) is where the subject changes from pieces to control flow. Each page stands alone, as the site brief requires. |
| Persistent message inspector, code inspector, context meter, layer table, "who controls" toggle, abstraction slider | Messages, meter and code appear in the views that need them; the layer table and slider are the last view; "who controls" is its own view | The console has one inspector, and the generator allows three hero interactions. |
| Site has four collections | A fifth, `ai` | Owner's request. It amends `SITE-REBUILD-BRIEF.md`, which is recorded there. |
| Model purple, tools amber, LangChain green, LangGraph teal; logos | Shape and label identify an actor; cyan is "happening now", red "stopped", dashed amber "a path that does not exist"; no logos | The site's semantic colours reserve green for success and amber for caution. |
| Tool loop without appending the model's request or any limit (stage 7) | The loop appends the reply before the results and has `MAX_STEPS` | As written, the brief's loop would resend the same list forever. Providers also reject a tool result whose request is not in the list. |
| No tool-call ids | Every request and result carries an id | The id is what pairs a result with its request, and one reply can hold several requests. |
| `tool_call.function.arguments` and `AIMessage.tool_calls` used interchangeably | The raw API gives a JSON string; LangChain gives a parsed dict. Each is shown at its own level | They are different shapes, and the difference is the parse step LangChain removes. |
| Schema examples missing `type: object`, `required` and the `function` wrapper | Complete Chat Completions tool definitions | The examples should be valid if copied. |
| Happy path only for arguments | Missing argument, and JSON cut off by the length limit | Both happen, and both need handling before a function runs. |
| Security gates as a separate late visual | View 9, directly after the loop, with four checks and four requests | The checks belong to the loop the reader has just built. |
| `$` cost per call | Token counts only, labelled as examples | A price needs a model and a date. |
| ChatOpenAI pointed at OpenRouter | Shown for the raw SDK; the inspector names `langchain-openrouter` | LangChain's docs now recommend the dedicated package. |
| `create_agent` shown with no way to add limits or approvals | Middleware for the call limit and approval | It is how the hand-written guards carry over. |
| RAG and MCP side lessons, advanced concepts drawer | Left out; MCP is one option in the LangGraph service view | Deep-dive material. Nothing is linked until a page exists. |

## Visual thesis

**Your code on the left, the model on the right, and one list that travels between them.** Each view adds one thing to that picture: a second message, a tool function under your code, the Kubernetes API beside it, then the loop that the round trips fold into.

## Semantic color and diagram grammar

| Element | Form | Meaning |
| --- | --- | --- |
| Square-cornered box | Grey outline | Code that runs in your process |
| Rounded box | Purple outline | The model, a remote API |
| Box | Blue outline | Kubernetes |
| Box | Teal outline | A tool function |
| Diamond | | A decision your code makes |
| Dotted frame | Labelled | Whose process or servers the boxes are in |
| Solid arrow | Cyan and thick when active, grey otherwise | A call or reply, in its direction. A dot travels the active arrow. |
| Dashed arrow with ✕ | Amber | A path people assume and that does not exist: the model calling a function |
| Arrow or box with ✕ | Red | Stopped here |
| Message row | Left bar and role label | One item in the list, with who wrote it; new items are outlined and tagged "new" |
| Bars | With numbers | Example token counts for a request |
| Code panel | Left bar on a line | The line that does what the picture shows |

## Concept groups and narrative sequence

Five index groups, one open at a time: **One call** (01–03), **Tools** (04–06), **The loop** (07–09), **LangChain** (10–14), **All the layers** (15).

| # | View (fragment) | Learner question | Visual form | Interaction | Required takeaway |
| --- | --- | --- | --- | --- | --- |
| 1 | One call (`#one-call`) | What is a model call? | Two boxes, request and reply, then the SDK and router inside the arrow | 3 steps | One HTTP call: messages out, one message back. |
| 2 | The list (`#messages`) | What is in the request? | The list with three roles | None | A conversation is a role-tagged list your code assembles. |
| 3 | No memory (`#memory`) | How does it remember? | The list resent, growing, with token bars | 3 steps | History is context you resend and pay for. |
| 4 | A tool (`#tool-request`) | Who runs a tool? | Function appears under your code; an imagined path from the model is crossed out | 6 steps | The model writes a request; your code runs it. |
| 5 | Arguments (`#arguments`) | Can I trust the arguments? | String, parse, check, call | 3 options | A schema guides; validation decides. |
| 6 | A real tool (`#real-tool`) | What is behind a tool? | Kubernetes API appears; full objects against four fields | 3 steps | Return the few facts the model needs. |
| 7 | Two tools (`#investigation`) | What does a real question look like? | The whole picture with the list and context bars | 6 steps | The model picks the next tool; your code runs it. |
| 8 | The loop (`#loop`) | What is an agent? | The round trips folded into a loop | 3 options | An agent is a loop your code owns. |
| 9 | Who decides (`#authority`) | What stops a bad request? | Four checks beside the picture | 4 options | Tools, checks and credentials enforce; the prompt does not. |
| 10 | Same loop (`#langchain`) | What does LangChain change? | The same picture, by hand and with LangChain | 2 options | It standardises the pieces, not the call. |
| 11 | @tool (`#tool-decorator`) | Where does the schema come from? | Function beside its schema, matching lines lit | 3 steps | Name, docstring and hints are the contract. |
| 12 | bind_tools (`#bind-tools`) | Does binding run anything? | The crossed-out path again | 3 steps | Binding lets the model ask. |
| 13 | Pipes (`#runnables`) | Why not just chain it? | A row of parts, then a blocked arrow back | 3 steps | Pipes do not loop. |
| 14 | create_agent (`#create-agent`) | What does the prebuilt agent do? | The loop, relabelled as built for you | 3 steps | The loop packaged as a graph. |
| 15 | Five levels (`#layers`) | Which level do I need? | A low-to-high scale with code and a layer table | 5 levels | Each layer formalises plumbing. |

Hero interactions: the tool round trip (view 4), the stepped investigation with its growing list (view 7), and the level scale (view 15). The other views use plain steps or an option switch.

## Per-view contracts

All views share one composition. Top to bottom in the canvas: number and group, title, one-line setup, step or option controls, the caption for the current frame, a notice when something is refused, the diagram at full width, then panels (messages, checks, token bars), then tables and code. On screens wider than 1800 px the panels sit beside the diagram. Below 760 px the diagram scrolls sideways inside its own box at 620 px. The inspector holds a statement, a short explanation, three facts, one line of code to look at, one thing worth knowing, and sources.

Accessibility for every view: each diagram is an `img` with a title and a description generated from the boxes shown, the active arrows and any stopped path; messages and checks are lists with their state in text; controls are buttons with `aria-pressed` or a step count; frame changes are announced through one polite live region; nothing depends on colour or hover. Reduced motion removes the travelling dot and the fade.

Failure and alternate states: the imagined model-to-function path (views 4, 12); a missing argument and cut-off JSON (5); a tool error returned as text and a model that never stops (8); an unregistered tool, an out-of-scope namespace and an RBAC 403 (9); the arrow a pipe cannot draw (13).

## Persistent console elements

Masthead, breadcrumb, title, summary, the question as the reference label, format and dates; the grouped index with a `current / total` counter; a scenario line; legend; active canvas; inspector; bottom takeaway; previous and next; sources with a scope note; related visuals; footer.

Each view's fragment selects it and opens its group; Back and Forward follow view changes; `#lc-sources` opens the sources. Without JavaScript all 15 views are stacked in order with every step drawn, followed by the inspector copy and takeaway.

## Accuracy decisions

| Decision | Basis |
| --- | --- |
| Wire examples are Chat Completions | It is the format OpenRouter documents and the brief used. OpenAI's own guide now leads with the Responses API, so the scope note says the field names differ there. |
| `create_agent` returns a `CompiledStateGraph` with nodes `model` and `tools` | Run against langchain 1.4.4 by `scripts/verify-agent-lessons.py`. |
| `@tool` output, `tool.invoke(call)` returning a `ToolMessage`, validation before the function body | Same script. |
| Strict mode is off by default for Chat Completions | OpenAI function calling guide. |
| CrashLoopBackOff is a waiting reason, OOMKilled a termination reason, Running a phase | Kubernetes Pod lifecycle. |
| Token counts and the size of raw Pod objects | Examples, labelled as such on the page. |

## Integration notes

- `src/components/lesson/` is a neutral lesson console: `LessonConsole.astro`, `LessonDiagram.astro`, `lesson-client.ts` and `lesson-types.ts`, styled by `src/styles/lesson-console.css`. A lesson is data: views, frames, a diagram per view, and panels per frame. The LangGraph page uses the same components.
- The frame rules in `lesson-console.css` repeat the data transfer console's values under an `lsn-` prefix; fold them into the shared shell stylesheet during shell extraction.
- To re-check after a LangChain release: `uv run --with langchain --with langgraph scripts/verify-agent-lessons.py`, then update the versions in the scope note and front matter.
- Deep-dive handoffs, not yet written: retrieval (fixed against agentic), and MCP as a tool boundary.

## Page-level acceptance

- [x] `npm run verify` passes.
- [x] `scripts/verify-agent-lessons.py` passes against langchain 1.4.4, langchain-core 1.6.9, langgraph 1.2.14.
- [x] Every source URL returned 200 on 2026-10-11.
- [x] Headless Firefox screenshots inspected at 1440 px (eleven view states), 390 px, and with JavaScript disabled.
- [ ] Not yet exercised by hand: keyboard and touch operation, focus order, 200% zoom, reduced motion, Back and Forward, and the travelling dot.

## Source index

1. [OpenRouter: quickstart](https://openrouter.ai/docs/quickstart) — views 1, 2
2. [OpenAI: function calling guide](https://developers.openai.com/api/docs/guides/function-calling) — views 4, 5, 7, 9
3. [LangChain: messages](https://docs.langchain.com/oss/python/langchain/messages) — views 2, 3, 10
4. [LangChain: models](https://docs.langchain.com/oss/python/langchain/models) — views 3, 4, 8, 10, 12, 13, 15
5. [LangChain: tools](https://docs.langchain.com/oss/python/langchain/tools) — views 6, 9, 10, 11
6. [LangChain: agents](https://docs.langchain.com/oss/python/langchain/agents) — views 8, 14, 15
7. [LangChain reference: create_agent](https://reference.langchain.com/python/langchain/agents/factory/create_agent) — view 14
8. [LangChain: human-in-the-loop middleware](https://docs.langchain.com/oss/python/langchain/human-in-the-loop) — view 14
9. [Kubernetes: Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) — views 6, 7
10. [Kubernetes: RBAC authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) — view 9
11. [Kubernetes: API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/) — view 6
12. [LangChain reference: Runnable](https://reference.langchain.com/python/langchain_core/runnables/) — view 13
13. [LangChain: Model Context Protocol](https://docs.langchain.com/oss/python/langchain/mcp) — view 15
