/**
 * The agent loop as a graph over saved state.
 * One picture grows: boxes that do work, arrows that choose what runs next, and the record they share.
 */
import { code, edge, node, type Diagram, type Lesson, type StateRow, type StoreRow, type View } from './lesson-types';

const SOURCES = [
  { label: 'LangGraph: Graph API', url: 'https://docs.langchain.com/oss/python/langgraph/graph-api' },
  { label: 'LangGraph: persistence', url: 'https://docs.langchain.com/oss/python/langgraph/persistence' },
  { label: 'LangGraph: checkpointers', url: 'https://docs.langchain.com/oss/python/langgraph/checkpointers' },
  { label: 'LangGraph: interrupts', url: 'https://docs.langchain.com/oss/python/langgraph/interrupts' },
  { label: 'LangChain: agents', url: 'https://docs.langchain.com/oss/python/langchain/agents' },
  { label: 'LangChain reference: create_agent', url: 'https://reference.langchain.com/python/langchain/agents/factory/create_agent' },
  { label: 'LangChain: human-in-the-loop middleware', url: 'https://docs.langchain.com/oss/python/langchain/human-in-the-loop' },
  { label: 'Kubernetes: Pod lifecycle', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/' },
  { label: 'LangChain: Model Context Protocol', url: 'https://docs.langchain.com/oss/python/langchain/mcp' },
  { label: 'Kubernetes: RBAC authorization', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' },
];
const [GRAPH_API, PERSISTENCE, CHECKPOINTERS, INTERRUPTS, AGENTS, CREATE_AGENT, HITL, POD, MCP, RBAC] = SOURCES.map((_, index) => index);

const SCRIPT: Diagram = {
  title: 'An agent loop inside one process', width: 640, height: 196,
  zones: [{ id: 'process', x: 14, y: 22, w: 440, h: 116, label: 'ONE PYTHON PROCESS' }],
  nodes: [
    node('loop', 'code', 30, 58, 'the while loop', 'model, tools, repeat', 170, 64),
    node('list', 'store', 280, 58, 'messages', 'a Python list', 158, 64),
    node('person', 'person', 478, 58, 'a person', 'has to approve', 150, 64),
  ],
  edges: [
    edge('keeps', 'loop', 'list', 'appends'),
    edge('waits', 'loop', 'person', 'stop here until they answer', { via: [[115, 168], [553, 168]] }),
  ],
};
const SCRIPT_BASE = ['process', 'loop', 'list', 'keeps'];

const MINI: Diagram = {
  title: 'The smallest graph', width: 640, height: 132,
  nodes: [node('start', 'terminal', 40, 50, 'START'), node('greet', 'code', 245, 38, 'greet', 'a function'), node('end', 'terminal', 522, 50, 'END')],
  edges: [edge('in', 'start', 'greet'), edge('out', 'greet', 'end')],
};

const PAIR: Diagram = {
  title: 'Two nodes writing to one state', width: 640, height: 132,
  nodes: [
    node('start', 'terminal', 12, 50, 'START', undefined, 70),
    node('a', 'code', 130, 38, 'inspect_pod', 'writes two keys'),
    node('b', 'code', 350, 38, 'inspect_logs', 'writes one key'),
    node('end', 'terminal', 558, 50, 'END', undefined, 70),
  ],
  edges: [edge('s-a', 'start', 'a'), edge('a-b', 'a', 'b', 'update'), edge('b-e', 'b', 'end', 'update')],
};

const AGENT: Diagram = {
  title: 'The agent loop as a graph', width: 640, height: 250,
  zones: [{ id: 'process', x: 4, y: 8, w: 632, h: 236, label: 'ONE PROCESS' }],
  nodes: [
    node('start', 'terminal', 14, 40, 'START', undefined, 70),
    node('model', 'code', 140, 28, 'model', 'calls the LLM', 140),
    node('cond', 'gate', 336, 30, 'tool calls?', undefined, 120),
    node('end', 'terminal', 542, 40, 'END', undefined, 78),
    node('tools', 'tool', 326, 170, 'tools', 'runs each tool call', 140),
  ],
  edges: [
    edge('s-m', 'start', 'model'),
    edge('m-c', 'model', 'cond'),
    edge('c-e', 'cond', 'end', 'no'),
    edge('c-t', 'cond', 'tools', 'yes'),
    edge('t-m', 'tools', 'model', 'results', { via: [[210, 199]] }),
  ],
};
const AGENT_BASE = ['start', 'model', 'cond', 'end', 'tools', 's-m', 'm-c', 'c-e', 'c-t', 't-m'];
const IN_PROCESS = ['process', ...AGENT_BASE];

const BRANCHES = [['scheduler', 'inspect_scheduler', 14], ['logs', 'inspect_logs', 90], ['image', 'inspect_image', 166], ['general', 'general_checks', 242]] as const;
const FLOW: Diagram = {
  title: 'A troubleshooting graph that branches on the failure', width: 640, height: 300,
  nodes: [
    node('start', 'terminal', 4, 128, 'START', undefined, 58),
    node('inspect', 'code', 82, 116, 'inspect_pod', undefined, 116),
    ...BRANCHES.map(([id, label, y]) => node(id, 'code', 352, y, label, undefined, 144, 44)),
    node('diagnose', 'code', 528, 116, 'diagnose', undefined, 106),
    node('end', 'terminal', 545, 236, 'END', undefined, 72),
  ],
  edges: [
    edge('s-i', 'start', 'inspect'),
    edge('to-scheduler', 'inspect', 'scheduler', 'Pending'),
    edge('to-logs', 'inspect', 'logs', 'CrashLoopBackOff'),
    edge('to-image', 'inspect', 'image', 'ImagePullBackOff'),
    edge('to-general', 'inspect', 'general', 'anything else'),
    ...BRANCHES.map(([id]) => edge(`${id}-d`, id, 'diagnose')),
    edge('d-e', 'diagnose', 'end'),
  ],
};

const CYCLE: Diagram = {
  title: 'A cycle with an exit condition', width: 640, height: 262,
  nodes: [
    node('diagnose', 'code', 40, 40, 'diagnose', 'calls the LLM'),
    node('enough', 'gate', 270, 36, 'enough evidence?', undefined, 190, 66),
    node('end', 'terminal', 546, 52, 'END', undefined, 78),
    node('gather', 'code', 290, 184, 'gather_more', 'runs another tool'),
  ],
  edges: [
    edge('d-q', 'diagnose', 'enough'),
    edge('q-e', 'enough', 'end', 'yes'),
    edge('q-g', 'enough', 'gather', 'no'),
    edge('g-d', 'gather', 'diagnose', 'more evidence', { via: [[115, 213]] }),
  ],
};

const APPROVAL: Diagram = {
  title: 'A graph that waits for a person before a write', width: 640, height: 226,
  nodes: [
    node('diagnose', 'code', 10, 56, 'diagnose', 'read-only', 120),
    node('propose', 'code', 160, 56, 'propose_fix', 'picks a change', 130),
    node('approval', 'person', 320, 56, 'approval', 'asks a person', 140),
    node('apply', 'tool', 490, 56, 'apply_fix', 'a write tool', 140),
    node('end', 'terminal', 520, 172, 'END', undefined, 80),
  ],
  edges: [
    edge('d-p', 'diagnose', 'propose'), edge('p-a', 'propose', 'approval'), edge('a-x', 'approval', 'apply'),
    edge('x-e', 'apply', 'end'),
    edge('a-e', 'approval', 'end', 'rejected'),
  ],
};
const APPROVAL_FLOW = ['diagnose', 'propose', 'approval', 'apply', 'end', 'd-p', 'p-a', 'a-x', 'x-e'];

const SERVICE: Diagram = {
  title: 'Where the graph sits in a service', width: 640, height: 292,
  nodes: [
    node('user', 'person', 8, 22, 'user', 'web or CLI', 112, 52),
    node('api', 'code', 150, 22, 'your API', 'auth, sessions', 130, 52),
    node('graph', 'code', 310, 22, 'graph runtime', 'LangGraph', 150, 52),
    node('llm', 'model', 490, 22, 'model API', 'remote', 142, 52),
    node('store', 'store', 130, 124, 'checkpoint store', 'Postgres', 150, 52),
    node('tools', 'tool', 310, 124, 'tools', 'your functions', 150, 52),
    node('k8s', 'kube', 490, 124, 'Kubernetes API', 'RBAC decides', 142, 52),
    node('mcp', 'tool', 310, 226, 'MCP server', 'another process', 150, 52),
  ],
  edges: [
    edge('u-a', 'user', 'api'), edge('a-g', 'api', 'graph'), edge('g-l', 'graph', 'llm'),
    edge('g-s', 'graph', 'store'),
    edge('g-t', 'graph', 'tools', 'tool calls'),
    edge('t-k', 'tools', 'k8s'),
    edge('t-m', 'tools', 'mcp', 'MCP'),
    edge('m-k', 'mcp', 'k8s'),
  ],
};
const SERVICE_DIRECT = ['user', 'api', 'graph', 'llm', 'store', 'tools', 'k8s', 'u-a', 'a-g', 'g-l', 'g-s', 'g-t', 't-k'];
const SERVICE_MCP = ['user', 'api', 'graph', 'llm', 'store', 'tools', 'k8s', 'mcp', 'u-a', 'a-g', 'g-l', 'g-s', 'g-t', 't-m', 'm-k'];

/* The agent run, as the state and the saved checkpoints see it. */
const row = (key: string, value: string, mark?: StateRow['mark']): StateRow => ({ key, value, mark });
const said = (count: number, last: string, mark?: StateRow['mark']) => ({ title: 'State', rows: [row('messages', `${count} ${count === 1 ? 'item' : 'items'}`, mark), row('newest', last, mark)] });
const SAVED = [
  'next: model · 1 message', 'next: tools · 2 messages', 'next: model · 3 messages',
  'next: tools · 4 messages', 'next: model · 5 messages', 'next: nothing · 6 messages',
];
const saved = (count: number, marks: Record<number, StoreRow['mark']> = {}): StoreRow[] => SAVED.slice(0, count).map((text, index) => ({ id: `#${index}`, text, mark: marks[index] }));
const THREAD = 'Checkpoints · thread_id "session-123"';

const WHILE = `
while True:
    reply = model.invoke(messages)
    messages.append(reply)
    if not reply.tool_calls:
        return reply
    messages.extend(run_tools(reply.tool_calls))`;
const BUILD = `
graph = StateGraph(MessagesState)
graph.add_node("model", call_model)
graph.add_node("tools", ToolNode(TOOLS))
graph.add_edge(START, "model")
graph.add_conditional_edges("model", tools_condition)
graph.add_edge("tools", "model")
app = graph.compile()`;
const ROUTE = `
def route_problem(state) -> str:
    kind = state["failure_type"]
    if kind == "Pending":
        return "inspect_scheduler"
    if kind == "CrashLoopBackOff":
        return "inspect_logs"
    if kind == "ImagePullBackOff":
        return "inspect_image"
    return "general_checks"

graph.add_conditional_edges("inspect_pod", route_problem)`;
const SCHEMA = `
class K8sAgentState(TypedDict):
    namespace: str
    pod_name: str
    failure_type: str | None
    evidence: Annotated[list[str], operator.add]
    diagnosis: str | None`;
const APPROVE = `
def approval(state):
    answer = interrupt({             # the run stops here
        "question": "Apply this change?",
        "action": state["proposed_action"],
    })
    return {"approved": answer}      # runs after resume`;

const views: View[] = [
  {
    id: 'why', group: 'Why a graph', label: 'The limit', mode: 'choices',
    title: 'A loop in a script works until you need more than a script',
    lede: 'An agent is a loop that calls a model and runs the tools it asks for. Here it is as plain Python, in one process.',
    diagram: SCRIPT,
    frames: [
      {
        action: 'As a script', caption: 'The loop appends every message to a list in memory. For a script you run and watch, this is all you need.',
        pic: { show: SCRIPT_BASE, hot: ['keeps'] },
        code: [code('The loop', WHILE)],
      },
      {
        action: 'The process restarts', caption: 'A deploy, a crash, or the next request landing on another replica. The list lived in this process, so the conversation is gone.',
        pic: { show: SCRIPT_BASE, denied: ['process', 'list'], badge: { list: 'gone' } },
        notice: { tone: 'stop', label: 'NOTHING TO RESUME', text: 'The model calls and tool calls already paid for have to be made again from the first message.' },
      },
      {
        action: 'A person must approve', caption: 'The model proposes a change to the cluster. Someone has to say yes, and they might answer in an hour.',
        pic: { show: [...SCRIPT_BASE, 'person', 'waits'], denied: ['waits'], fresh: ['person', 'waits'] },
        notice: { tone: 'stop', label: 'NOWHERE TO WAIT', text: 'A while loop can only block. Holding a process open for an hour, and hoping it survives, is not a pause.' },
      },
      {
        action: 'You want fixed steps', caption: 'For a crash-looping pod you always want the previous logs checked. In this loop the model picks every next step, so "always" is a hope.',
        pic: { show: SCRIPT_BASE, denied: ['loop'], badge: { loop: 'model picks the order' } },
        notice: { tone: 'warn', label: 'NO PLACE FOR YOUR RULES', text: 'You can ask for an order in the prompt. You cannot enforce one without restructuring the loop.' },
      },
    ],
    inspector: {
      heading: 'Four things a plain loop cannot hold',
      body: 'The loop itself is fine. What it lacks is everything around it: a place to keep state outside the process, a way to stop and continue later, and a way for your code to own part of the order of work.',
      facts: [['State', 'A variable in one process'], ['Pausing', 'Only by blocking'], ['Order of work', 'Decided by the model each time']],
      evidence: ['Where the conversation lives', 'messages = []   # in this process only'],
      note: 'You can build each missing piece yourself: a database table for messages, a job queue for approvals, an if-ladder for routing. LangGraph is those pieces built once and made to fit together.',
    },
    takeaway: 'The loop is easy. Keeping its state, pausing it and steering it are what need structure.',
    sources: [PERSISTENCE, GRAPH_API],
  },
  {
    id: 'state-node', group: 'Why a graph', label: 'One box', mode: 'steps',
    title: 'A box does some work and hands back what changed',
    lede: 'Before the agent, the smallest possible example: one record, one function.',
    diagram: MINI,
    frames: [
      {
        action: 'A record goes in', caption: 'The run starts with a record that has one field filled in.',
        pic: { hot: ['in'] },
        state: { title: 'The record', rows: [row('name', '"Darshan"'), row('greeting', 'not set')] },
        code: [code('Python', `
class State(TypedDict):
    name: str
    greeting: str

app.invoke({"name": "Darshan"})`, [6])],
      },
      {
        action: 'The function runs', caption: 'The function reads the record and returns only the field it wants to change.',
        pic: { hot: ['greet'] },
        state: { title: 'The record', rows: [row('name', '"Darshan"', 'read'), row('greeting', 'not set')] },
        code: [code('Python', `
def greet(state: State):
    return {"greeting": f"Hello {state['name']}"}`, [2])],
      },
      {
        action: 'The change is merged', caption: 'The returned field is merged into the record. Everything else is left as it was.',
        pic: { hot: ['out'] },
        state: { title: 'The record', rows: [row('name', '"Darshan"'), row('greeting', '"Hello Darshan"', 'write')] },
        code: [code('Python', `
graph = StateGraph(State)
graph.add_node("greet", greet)
graph.add_edge(START, "greet")
graph.add_edge("greet", END)
app = graph.compile()

app.invoke({"name": "Darshan"})
# {'name': 'Darshan', 'greeting': 'Hello Darshan'}`, [2, 3, 4])],
      },
    ],
    inspector: {
      heading: 'State, nodes and edges',
      body: 'LangGraph has names for these three things. The shared record is the state. A function that reads it and returns a change is a node. An arrow saying what runs next is an edge. START and END mark where a run enters and leaves.',
      facts: [['State', 'What the run knows so far'], ['Node', 'A function: state in, update out'], ['Edge', 'What runs next']],
      evidence: ['A node returns an update', '{"greeting": "Hello Darshan"}'],
      note: 'A node does not return the whole record. It returns the keys it changed, and the runtime merges them. That is what lets several nodes work on one state without overwriting each other.',
    },
    takeaway: 'A node reads the shared state and returns only what it changed.',
    sources: [GRAPH_API],
  },
  {
    id: 'reducers', group: 'Why a graph', label: 'Merging', mode: 'choices',
    title: 'Each field says how a change is merged: replace or add',
    lede: 'Two nodes write to the same record, one after the other. What the second write does depends on the field.',
    diagram: PAIR,
    frames: [
      {
        action: 'Replace', caption: 'By default a new value replaces the old one. failure_type holds whatever was written last.',
        pic: { hot: ['a', 'a-b'] },
        state: { title: 'After inspect_pod', rows: [row('failure_type', '"CrashLoopBackOff"', 'write'), row('evidence', '["restarts=8"]', 'write')] },
        code: [code('Python', SCHEMA, [4])],
      },
      {
        action: 'Add', caption: 'evidence is declared with a function that joins lists, so the second node\'s item is added to the first node\'s.',
        pic: { hot: ['b', 'b-e'] },
        state: { title: 'After inspect_logs', rows: [row('failure_type', '"CrashLoopBackOff"'), row('evidence', '["restarts=8", "last_reason=OOMKilled"]', 'write')] },
        code: [
          code('Python', SCHEMA, [5]),
          code('What inspect_logs returned', `
return {"evidence": ["last_reason=OOMKilled"]}
# one item, not the whole list`),
        ],
      },
    ],
    inspector: {
      heading: 'The merge rule is called a reducer',
      body: 'A reducer takes the current value and the update and returns the new value. With none declared, the update wins. For a message list you want appending, which is what the built-in MessagesState does: its messages key uses a reducer named add_messages.',
      facts: [['No reducer', 'New value replaces old'], ['operator.add', 'Lists are joined'], ['add_messages', 'Appends messages, or replaces one with the same id']],
      evidence: ['Declaring one', 'evidence: Annotated[list[str], operator.add]'],
      note: 'With an adding reducer, returning an empty list clears nothing. Forgetting the reducer on a list is the opposite bug: each node silently wipes what the last one found.',
    },
    takeaway: 'Updates are merged per key. A list that should grow needs a reducer that adds.',
    sources: [GRAPH_API],
  },
  {
    id: 'agent-graph', group: 'The agent as a graph', label: 'Agent graph', mode: 'steps',
    title: 'The agent loop, drawn as two boxes and a question',
    lede: 'Now the real thing. The state is a message list, and the question is "Why is payments-api failing?"',
    diagram: AGENT,
    frames: [
      {
        action: 'Start', caption: 'The question is put into the state and the run enters the model node.',
        pic: { show: AGENT_BASE, hot: ['s-m', 'model'] },
        state: said(1, 'user: Why is payments-api failing?', 'write'),
        code: [code('Building the graph', BUILD, [4])],
      },
      {
        action: 'The model asks for a tool', caption: 'The model node calls the LLM and returns its reply, which is appended. The reply contains a tool call, so the arrow out of the question goes down.',
        pic: { show: AGENT_BASE, hot: ['m-c', 'c-t', 'cond'] },
        state: said(2, 'assistant: list_pods(namespace="payments")', 'write'),
        code: [code('Building the graph', BUILD, [2, 5])],
      },
      {
        action: 'The tools node runs it', caption: 'The tools node runs each requested tool and appends the results. A fixed arrow leads back to the model node.',
        pic: { show: AGENT_BASE, hot: ['tools', 't-m'] },
        state: said(3, 'tool: payments-api-7d9f ready=0/1 restarts=8', 'write'),
        code: [code('Building the graph', BUILD, [3, 6])],
      },
      {
        action: 'Round again', caption: 'The model sees the pod list and asks for details. Down and back once more.',
        pic: { show: AGENT_BASE, hot: ['m-c', 'c-t', 'tools', 't-m'] },
        state: said(5, 'tool: CrashLoopBackOff, last_reason=OOMKilled', 'write'),
        code: [code('Building the graph', BUILD, [5, 6])],
      },
      {
        action: 'The model answers', caption: 'This reply has no tool call, so the arrow out of the question goes to END and the run returns the state.',
        pic: { show: AGENT_BASE, hot: ['m-c', 'c-e', 'end'] },
        state: said(6, 'assistant: payments-api-7d9f was OOMKilled…', 'write'),
        code: [code('Building the graph', BUILD, [5])],
      },
    ],
    inspector: {
      heading: 'A branch that depends on the state',
      body: 'The arrow from model is a conditional edge: a function looks at the state and names the next node. tools_condition is a ready-made one. It returns "tools" when the newest message has tool calls, and END when it does not. The arrow from tools back to model is the cycle.',
      facts: [['call_model', 'A node you write: calls the LLM, returns {"messages": [reply]}'], ['ToolNode', 'A ready-made node that runs every tool call in the newest message'], ['MessagesState', 'A ready-made state with one key, messages']],
      evidence: ['Checked by running it', "tools_condition(state)  →  'tools'  or  '__end__'"],
      note: 'tools_condition and ToolNode both expect the state to have a messages key, and tools_condition routes to a node named "tools". Name things differently and you write the three-line condition yourself.',
    },
    takeaway: 'A loop is a conditional edge plus an edge that points back.',
    sources: [GRAPH_API, AGENTS],
  },
  {
    id: 'same-graph', group: 'The agent as a graph', label: 'Three spellings', mode: 'choices',
    title: 'The while loop was this graph all along',
    lede: 'One picture, three ways to write it down.',
    diagram: AGENT,
    frames: [
      {
        action: 'while loop', caption: 'The if is the question. The bottom of the loop body is the arrow back.',
        pic: { show: AGENT_BASE },
        code: [code('A while loop', WHILE)],
        table: {
          title: 'The same four parts', head: ['In the loop', 'In the graph'],
          rows: [['messages, a local list', 'State with a messages key'], ['if not reply.tool_calls', 'A conditional edge out of model'], ['return reply', 'The edge to END'], ['The end of the loop body', 'The edge from tools back to model']],
        },
      },
      {
        action: 'StateGraph', caption: 'Each line adds one box or one arrow of the picture.',
        pic: { show: AGENT_BASE, hot: ['model', 'tools', 'c-t', 't-m', 'c-e'] },
        code: [code('A graph you build', `
from langgraph.graph import StateGraph, MessagesState, START
from langgraph.prebuilt import ToolNode, tools_condition

def call_model(state: MessagesState):
    reply = model_with_tools.invoke(state["messages"])
    return {"messages": [reply]}
${BUILD}`)],
      },
      {
        action: 'create_agent', caption: 'The prebuilt agent builds a graph of this shape and compiles it for you.',
        pic: { show: AGENT_BASE },
        code: [code('The prebuilt agent', `
from langchain.agents import create_agent

agent = create_agent(model, tools=TOOLS)
list(agent.get_graph().nodes)
# ['__start__', 'model', 'tools', '__end__']`, [3])],
      },
    ],
    inspector: {
      heading: 'Nothing was added, the structure was named',
      body: 'Writing the loop as a graph does not make it do anything new. It makes the control flow into data the runtime can see. Once the runtime knows where a run is, it can save that position, stop there, and show it to you.',
      facts: [['Loop', 'Control flow hidden inside Python'], ['Graph', 'Control flow the runtime can save, pause and draw'], ['create_agent', 'The standard graph, prebuilt']],
      evidence: ['Draw any compiled graph', 'app.get_graph().draw_mermaid()'],
      note: 'A compiled graph has the same invoke, stream and batch methods as a model or a chain, so it drops into code that already uses those.',
    },
    takeaway: 'LangGraph turns the implicit loop into an explicit graph over state.',
    sources: [GRAPH_API, CREATE_AGENT],
  },
  {
    id: 'custom-state', group: 'Your own flow', label: 'Typed state', mode: 'choices',
    title: 'State can hold more than messages',
    lede: 'Give the troubleshooting run named fields, and each node touches only the ones it needs.',
    diagram: FLOW,
    frames: [
      {
        action: 'inspect_pod', caption: 'Reads which pod to look at. Writes what kind of failure it found and the first evidence.',
        pic: { hot: ['inspect'] },
        state: { title: 'K8sAgentState', rows: [row('namespace', '"payments"', 'read'), row('pod_name', '"payments-api-7d9f"', 'read'), row('failure_type', '"CrashLoopBackOff"', 'write'), row('evidence', '["restarts=8"]', 'write'), row('diagnosis', 'None')] },
        code: [code('The state', SCHEMA), code('The node', `
def inspect_pod(state: K8sAgentState):
    status = get_pod_status(state["namespace"],
                            state["pod_name"])
    return {"failure_type": status.waiting_reason
                            or status.phase,
            "evidence": [f"restarts={status.restarts}"]}`)],
      },
      {
        action: 'inspect_logs', caption: 'Reads the same pod. Adds what the previous run\'s termination says.',
        pic: { hot: ['logs'] },
        state: { title: 'K8sAgentState', rows: [row('namespace', '"payments"', 'read'), row('pod_name', '"payments-api-7d9f"', 'read'), row('failure_type', '"CrashLoopBackOff"'), row('evidence', '[…, "exit_code=137", "last_reason=OOMKilled"]', 'write'), row('diagnosis', 'None')] },
        code: [code('The state', SCHEMA, [5])],
      },
      {
        action: 'diagnose', caption: 'Reads the failure type and the evidence. Writes the diagnosis. It never needs the raw tool output.',
        pic: { hot: ['diagnose'] },
        state: { title: 'K8sAgentState', rows: [row('namespace', '"payments"'), row('pod_name', '"payments-api-7d9f"'), row('failure_type', '"CrashLoopBackOff"', 'read'), row('evidence', '3 items', 'read'), row('diagnosis', '"Killed for exceeding its memory limit…"', 'write')] },
        code: [code('The state', SCHEMA, [6])],
      },
    ],
    inspector: {
      heading: 'Named fields instead of one long transcript',
      body: 'With only a message list, every fact a later step needs has to be found again in the text. Named fields let a node read exactly what it needs and say exactly what it produced. They also let plain code, with no model involved, make decisions from the state.',
      facts: [['A node reads', 'Any key in the state'], ['A node writes', 'Only the keys it returns'], ['Worth a field', 'Anything a later decision depends on']],
      evidence: ['Keeping messages as well', 'class K8sAgentState(MessagesState): …'],
      note: 'Pending is a pod phase. CrashLoopBackOff and ImagePullBackOff are reasons a container is waiting. OOMKilled is why a container\'s previous run ended. inspect_pod folds the first two into one failure_type field; OOMKilled turns up later, as evidence.',
    },
    takeaway: 'Put what later steps depend on into named state, and each node can stay small.',
    sources: [GRAPH_API, POD],
  },
  {
    id: 'routing', group: 'Your own flow', label: 'Routing', mode: 'choices',
    title: 'Your code picks the path',
    lede: 'Choose what inspect_pod found, and see which box runs next.',
    diagram: FLOW,
    frames: [
      {
        action: 'Pending', caption: 'The pod has not been scheduled or started. The next evidence is with the scheduler: events about nodes, taints and unbound volumes.',
        pic: { hot: ['to-scheduler', 'scheduler', 'scheduler-d'] },
        state: { title: 'State', rows: [row('failure_type', '"Pending"', 'read')] },
        code: [code('The routing function', ROUTE, [3, 4])],
      },
      {
        action: 'CrashLoopBackOff', caption: 'The container starts and dies. The next evidence is the previous run: its logs, exit code and termination reason.',
        pic: { hot: ['to-logs', 'logs', 'logs-d'] },
        state: { title: 'State', rows: [row('failure_type', '"CrashLoopBackOff"', 'read')] },
        code: [code('The routing function', ROUTE, [5, 6])],
      },
      {
        action: 'ImagePullBackOff', caption: 'The image cannot be pulled. The next evidence is the image reference and the pull events.',
        pic: { hot: ['to-image', 'image', 'image-d'] },
        state: { title: 'State', rows: [row('failure_type', '"ImagePullBackOff"', 'read')] },
        code: [code('The routing function', ROUTE, [7, 8])],
      },
      {
        action: 'Anything else', caption: 'A reason this graph has no dedicated path for still gets handled: a general set of checks.',
        pic: { hot: ['to-general', 'general', 'general-d'] },
        state: { title: 'State', rows: [row('failure_type', '"CreateContainerConfigError"', 'read')] },
        code: [code('The routing function', ROUTE, [9])],
      },
    ],
    inspector: {
      heading: 'A conditional edge is an ordinary function',
      body: 'route_problem reads one field and returns the name of the next node. No model is called to make this decision, so it costs nothing, behaves the same way every time, and can be tested with a dict. The model still does the reading and reasoning inside the nodes.',
      facts: [['The application owns', 'Which path a failure takes'], ['The model owns', 'Reading the evidence and wording the diagnosis'], ['Fallback', 'Always give unmatched values somewhere to go']],
      evidence: ['Testing it without a model', 'assert route_problem({"failure_type": "Pending"}) == "inspect_scheduler"'],
      note: 'You are trading flexibility for predictability. A free-running agent can investigate failures you did not anticipate; a routed graph does the same thing every time for the ones you did. Many systems use fixed routing with one small agent loop inside a node.',
    },
    takeaway: 'When you already know the right next step, say so in an edge instead of hoping the model picks it.',
    sources: [GRAPH_API, POD],
  },
  {
    id: 'bounded-loop', group: 'Your own flow', label: 'Bounded loop', mode: 'choices',
    title: 'A cycle needs a way out that you wrote',
    lede: 'Let the graph go round for more evidence when the first pass is not enough.',
    diagram: CYCLE,
    frames: [
      {
        action: 'Enough on the second pass', caption: 'The first diagnosis is unsure, so the run gathers more and tries again. The second one is confident, and the run ends.',
        pic: { hot: ['q-g', 'gather', 'g-d', 'q-e'], badge: { diagnose: 'attempt 2' } },
        state: { title: 'State', rows: [row('attempts', '2', 'write'), row('diagnosis', '"Killed for exceeding its memory limit…"', 'write')] },
        code: [code('Python', `
def enough(state) -> str:
    if state["diagnosis"] or state["attempts"] >= 3:
        return END
    return "gather_more"

graph.add_conditional_edges("diagnose", enough)
graph.add_edge("gather_more", "diagnose")`, [2, 3])],
      },
      {
        action: 'Never enough, with a counter', caption: 'The evidence never settles it. After three attempts the counter in the state sends the run to END with what it has.',
        pic: { hot: ['q-e', 'end'], badge: { diagnose: 'attempt 3' } },
        state: { title: 'State', rows: [row('attempts', '3', 'read'), row('diagnosis', 'None')] },
        code: [code('Python', `
def enough(state) -> str:
    if state["diagnosis"] or state["attempts"] >= 3:
        return END
    return "gather_more"`, [2, 3])],
        notice: { tone: 'ok', label: 'ENDS CLEANLY', text: 'The caller gets the evidence collected so far and can say "no confident diagnosis after three attempts".' },
      },
      {
        action: 'Never enough, no counter', caption: 'Without the counter the cycle has no exit. The runtime stops it at its step limit and raises an error.',
        pic: { hot: ['q-g', 'gather', 'g-d'], denied: ['q-e'], badge: { diagnose: 'step 12 of 12' } },
        code: [code('Python', `
app.invoke(state, {"recursion_limit": 12})
# GraphRecursionError: Recursion limit of 12 reached
# without hitting a stop condition.`, [1])],
        notice: { tone: 'stop', label: 'STOPPED BY THE RUNTIME', text: 'An exception, not an answer. Every model call up to the limit has been paid for.' },
      },
    ],
    inspector: {
      heading: 'Two limits, and only one of them is yours',
      body: 'The runtime counts steps and raises GraphRecursionError at recursion_limit. That is a safety net for bugs. The limit you design belongs in the state: a counter the routing function checks, so the run ends with a usable result.',
      facts: [['Your limit', 'A counter in state, checked by the conditional edge'], ['The runtime\'s limit', 'recursion_limit, passed in the run config'], ['For create_agent', 'ModelCallLimitMiddleware(run_limit=…)']],
      evidence: ['Set it where you invoke', 'app.invoke(state, {"recursion_limit": 12})'],
      note: 'Do not lean on the default. It was 25 in early releases; an endless graph run against LangGraph 1.2.14 for this page stopped at 10,007 steps, and the Graph API guide gives 1,000. Set the number you mean.',
    },
    takeaway: 'Put the exit condition in the state. Treat the runtime\'s step limit as a fuse.',
    sources: [GRAPH_API],
  },
  {
    id: 'checkpoints', group: 'Saved state', label: 'Checkpoints', mode: 'steps',
    title: 'After every step, the state is saved',
    lede: 'Compile the agent graph with somewhere to save, and give the run a name.',
    diagram: AGENT,
    frames: [
      {
        action: 'Start a named run', caption: 'The run is given an id. Before the model node runs, the state is saved with a note of what comes next.',
        pic: { show: AGENT_BASE, hot: ['s-m'] },
        store: { title: THREAD, rows: saved(1, { 0: 'fresh' }) },
        code: [code('Python', `
app = graph.compile(checkpointer=checkpointer)
config = {"configurable": {"thread_id": "session-123"}}
app.invoke({"messages": [question]}, config)`, [1, 2])],
      },
      {
        action: 'After the model node', caption: 'The model node finishes. The state, now two messages long, is saved again.',
        pic: { show: AGENT_BASE, hot: ['model', 'm-c'], badge: { model: 'saved' } },
        store: { title: THREAD, rows: saved(2, { 1: 'fresh' }) },
      },
      {
        action: 'After the tools node', caption: 'And again after the tools node. Each save is a complete snapshot, and the earlier ones are kept.',
        pic: { show: AGENT_BASE, hot: ['tools', 't-m'], badge: { model: 'saved', tools: 'saved' } },
        store: { title: THREAD, rows: saved(3, { 2: 'fresh' }) },
      },
      {
        action: 'End of the run', caption: 'Three model calls and two tool runs have left six snapshots. The last one has nothing left to run.',
        pic: { show: AGENT_BASE, hot: ['end'], badge: { model: 'saved', tools: 'saved' } },
        store: { title: THREAD, rows: saved(6, { 5: 'fresh' }), note: 'Ask a follow-up with the same thread_id and the run starts from #5, history included.' },
        code: [code('Python', `
app.invoke({"messages": [follow_up]}, config)  # same thread
app.get_state(config).next                     # ()
len(list(app.get_state_history(config)))
# 7: these six, and an empty one from before the input`, [1])],
      },
    ],
    inspector: {
      heading: 'Checkpoints, threads and checkpointers',
      body: 'Each saved snapshot is a checkpoint. The id that groups a run\'s checkpoints is its thread_id, and the object that writes them is a checkpointer. With one in place, conversation memory stops being a variable in your process: any replica can load the thread and carry on.',
      facts: [['Saved', 'After each step, with the nodes due next'], ['Keyed by', 'thread_id in the run config'], ['Where', 'InMemorySaver to learn; SqliteSaver or PostgresSaver to keep']],
      evidence: ['Read the latest one', 'app.get_state(config).values["messages"]'],
      note: 'InMemorySaver keeps checkpoints in the process, so it survives nothing. Saved threads are also data you now hold: scope them per user, protect them, and expire them, because they contain every tool result.',
    },
    takeaway: 'A checkpointer moves the run\'s state out of your process and into a store, one snapshot per step.',
    sources: [CHECKPOINTERS, PERSISTENCE],
  },
  {
    id: 'resume', group: 'Saved state', label: 'Crash, resume', mode: 'steps',
    title: 'Kill the process mid-run and pick up where it stopped',
    lede: 'Same run, with checkpoints going to a database. The process dies during the second tool call.',
    diagram: AGENT,
    frames: [
      {
        action: 'Running', caption: 'Two model calls and one tool run are done. The tools node has started on get_pod_details.',
        pic: { show: IN_PROCESS, hot: ['tools'], badge: { tools: 'running' } },
        store: { title: THREAD, rows: saved(4, { 3: 'fresh' }) },
      },
      {
        action: 'The process dies', caption: 'Out of memory, a node drain, a deploy. Whatever the tools node was doing is lost. The checkpoints are in the database and are not.',
        pic: { show: IN_PROCESS, denied: ['process', 'tools'], badge: { tools: 'lost' } },
        store: { title: THREAD, rows: saved(4), note: 'The newest checkpoint says: next is tools, with 4 messages.' },
        notice: { tone: 'stop', label: 'PROCESS GONE', text: 'With a list in memory this would be the end of the conversation.' },
      },
      {
        action: 'A new process resumes', caption: 'Any process with the same graph and the same store can continue. It passes no new input, only the thread id.',
        pic: { show: IN_PROCESS, fresh: ['process'], hot: ['tools'] },
        store: { title: THREAD, rows: saved(4, { 3: 'loaded' }) },
        code: [code('Python', `
config = {"configurable": {"thread_id": "session-123"}}
app.invoke(None, config)     # None: continue, don't restart`, [2])],
      },
      {
        action: 'The interrupted node runs again', caption: 'The tools node starts over from its first line. The two model calls before it are not repeated.',
        pic: { show: IN_PROCESS, hot: ['tools', 't-m'], badge: { tools: 'runs again' } },
        store: { title: THREAD, rows: saved(5, { 4: 'fresh' }) },
      },
      {
        action: 'The run finishes', caption: 'The model sees the details and answers. The user gets one reply, as if nothing happened.',
        pic: { show: IN_PROCESS, hot: ['m-c', 'c-e', 'end'] },
        store: { title: THREAD, rows: saved(6, { 5: 'fresh' }) },
      },
    ],
    inspector: {
      heading: 'Resuming repeats one node, not the whole run',
      body: 'A run continues from its last checkpoint, which sits between nodes. The node that was in flight when the process died has no partial record, so it runs again from the top. Everything before it is read back from the store.',
      facts: [['Repeated', 'The node that was running'], ['Not repeated', 'Every node that had finished'], ['So', 'A node with side effects must be safe to run twice']],
      evidence: ['Checked by running it', 'resumed: tools, model   (earlier model calls: 0)'],
      note: 'Re-running a read is harmless. Re-running "create ticket" or "scale deployment" is not, unless the call is idempotent. Put the write in its own node, after the decision, and make it safe to retry. Checkpoint writes can also be made synchronous with durability="sync" when losing the last step is not acceptable.',
    },
    takeaway: 'Durable state means a crash costs you one step. It also means every step may run twice.',
    sources: [CHECKPOINTERS, PERSISTENCE],
  },
  {
    id: 'approval', group: 'Saved state', label: 'Approval', mode: 'choices',
    title: 'Stop for a person, with no process waiting',
    lede: 'The diagnosis suggests raising the memory limit. That is a write to the cluster, so someone has to agree first.',
    diagram: APPROVAL,
    frames: [
      {
        action: 'Waiting', caption: 'The approval node asks its question and the run stops. The state is saved; the process is free to do anything else, or exit.',
        pic: { show: APPROVAL_FLOW, hot: ['approval'], badge: { approval: 'paused' } },
        store: { title: 'Checkpoints · thread_id "session-123"', rows: [{ id: '#7', text: 'next: approval · waiting on a person', mark: 'fresh' }], note: 'The caller gets the question back and can show it to someone.' },
        code: [
          code('The node', APPROVE, [2, 3, 4, 5]),
          code('What the caller sees', `
result = app.invoke(inputs, config)
result["__interrupt__"][0].value
# {'question': 'Apply this change?',
#  'action': 'set_memory_limit(payments-api, 512Mi)'}`, [2]),
        ],
      },
      {
        action: 'Approve', caption: 'An hour later, someone approves. The run is loaded from the store, the approval node runs again and this time gets an answer, and the write goes ahead.',
        pic: { show: APPROVAL_FLOW, hot: ['a-x', 'apply', 'x-e'], badge: { approval: 'approved' } },
        store: { title: 'Checkpoints · thread_id "session-123"', rows: [{ id: '#7', text: 'next: approval · waiting on a person', mark: 'loaded' }, { id: '#8', text: 'next: apply_fix · approved=True', mark: 'fresh' }] },
        code: [code('Resuming', `
from langgraph.types import Command

app.invoke(Command(resume=True), config)   # same thread_id`, [3])],
      },
      {
        action: 'Reject', caption: 'Someone says no. The run resumes the same way, the answer is False, and the edge out of approval goes to END. The write tool never runs.',
        pic: { show: [...APPROVAL_FLOW, 'a-e'], hot: ['a-e', 'end'], denied: ['a-x', 'apply'], badge: { approval: 'rejected' } },
        store: { title: 'Checkpoints · thread_id "session-123"', rows: [{ id: '#7', text: 'next: approval · waiting on a person', mark: 'loaded' }, { id: '#8', text: 'next: nothing · approved=False', mark: 'fresh' }] },
        code: [code('Resuming', `
app.invoke(Command(resume=False), config)`), code('The edge out of approval', `
def after_approval(state) -> str:
    return "apply_fix" if state["approved"] else END

graph.add_conditional_edges("approval", after_approval)`, [2])],
      },
    ],
    inspector: {
      heading: 'A pause is a saved state and an unanswered question',
      body: 'interrupt() stops the run inside a node and hands its argument to the caller. Nothing is sleeping. Resuming loads the thread and runs that node again from its first line; this time interrupt() returns the value you passed to Command(resume=…).',
      facts: [['Needs', 'A checkpointer and a thread_id'], ['On resume', 'The node restarts from the top'], ['Rule of thumb', 'Read tools run freely; write tools wait for a person']],
      evidence: ['The run is parked here', "app.get_state(config).next  →  ('approval',)"],
      note: 'Because the node restarts, anything before interrupt() runs twice. Keep the lines above it free of side effects. With create_agent you get the same pause from HumanInTheLoopMiddleware, which lets a reviewer approve, edit or reject each tool call.',
    },
    takeaway: 'Human approval is a checkpoint plus a resume. The wait costs nothing because no process is holding it.',
    sources: [INTERRUPTS, HITL],
  },
  {
    id: 'service', group: 'In a service', label: 'In a service', mode: 'choices',
    title: 'Where the graph sits when it is a service',
    lede: 'Around the graph are the same things any backend has: an API in front, a database beside it, and the systems it calls.',
    diagram: SERVICE,
    frames: [
      {
        action: 'Tools in your process', caption: 'The tool functions run inside the service and call Kubernetes with the service\'s own credential.',
        pic: { show: SERVICE_DIRECT, hot: ['g-t', 't-k', 'tools'] },
      },
      {
        action: 'Tools behind MCP', caption: 'The same tools, served by a separate process over the Model Context Protocol. The graph is unchanged: a function call became a network call.',
        pic: { show: SERVICE_MCP, hot: ['g-t', 't-m', 'm-k', 'mcp'], fresh: ['mcp', 't-m', 'm-k'] },
        code: [code('Python', `
from langchain.mcp import MCPAdapter

async with MCPAdapter("https://k8s-mcp.internal.example/mcp") as adapter:
    tools = await adapter.list_tools()   # ordinary tools
    agent = create_agent(model, tools)`, [4])],
      },
    ],
    inspector: {
      heading: 'An ordinary service with a graph in the middle',
      body: 'The API authenticates the user and picks the thread. The runtime loads that thread\'s checkpoint, runs nodes, and saves after each one. Model calls go out to a provider. Tool calls go to systems that authorise them with their own rules.',
      facts: [['Watch', 'Model calls and tokens per run, tool errors, steps per run, runs waiting on approval'], ['Test', 'Routing functions with plain dicts; a resume after a killed process'], ['Decide early', 'Who can read a thread, and when threads are deleted']],
      evidence: ['Show progress as it happens', 'app.stream(inputs, config, stream_mode="updates")'],
      note: 'MCP changes where a tool runs and who operates it. It does not change who is responsible: your service still chooses which servers and tools to expose, and the credential the MCP server uses still decides what can be done. The MCPAdapter shown is from langchain 1.4; earlier code uses the langchain-mcp-adapters package.',
    },
    takeaway: 'The graph is one component. Identity, storage and the permissions of what it calls are still your service\'s job.',
    sources: [MCP, PERSISTENCE, RBAC],
  },
  {
    id: 'whole-picture', group: 'In a service', label: 'Who owns what', mode: 'choices',
    title: 'What each layer is responsible for',
    lede: 'From one HTTP call to a graph with saved state, each layer took over one piece of plumbing. None of them took over authority.',
    diagram: AGENT,
    frames: [
      {
        action: 'Everything together', caption: 'The same two boxes and a question, now with state that is saved and a run that can stop and continue.',
        pic: { show: AGENT_BASE, badge: { model: 'saved', tools: 'saved' } },
        table: {
          title: 'Who does what', head: ['Part', 'Its job', 'What it does not do'],
          rows: [
            ['The model', 'Proposes the next step: a tool call or an answer', 'Run anything'],
            ['LangChain', 'Standard messages, models and tools', 'Decide the control flow'],
            ['LangGraph', 'Control flow, saved state, pauses', 'Decide what a tool may do'],
            ['Your application', 'Which tools exist, checks, scope, approvals', 'Hand authority to the prompt'],
            ['Kubernetes RBAC', 'What the credential may do', 'Know a model was involved'],
          ],
        },
      },
    ],
    inspector: {
      heading: 'A loop you already understood, made explicit',
      body: 'A model call takes messages and returns one. A tool call is a request your code may run. An agent is that in a loop. LangGraph writes the loop down as nodes and edges over a state it can save, which is what makes restarts, approvals and your own routing possible.',
      facts: [['Start with', 'The smallest graph that works: model, tools, one condition'], ['Add state fields', 'When a decision needs them'], ['Add checkpoints', 'When a run must outlive a process or wait for a person']],
      evidence: ['The whole agent', 'START → model → tools? → tools → model … → END'],
      note: 'Saved state brings obligations a script never had: migrations when the state schema changes, retention for stored threads, and nodes that tolerate running twice. Skip persistence until you need what it gives.',
    },
    takeaway: 'LangChain standardises the pieces, LangGraph standardises the control flow, and your application still owns authority.',
    sources: [GRAPH_API, AGENTS, RBAC],
  },
];

export const langgraphLesson: Lesson = {
  id: 'lg',
  kicker: 'AI · GRAPH RUNTIME CONSOLE',
  title: 'LangGraph: The Agent Loop as a Graph',
  summary: 'Take the loop that calls a model and runs its tools, and redraw it as boxes and arrows over one shared record. Then see what that buys: your own routing, saved state, resume after a crash, and a pause for approval.',
  reference: 'QUESTION · Why is payments-api failing?',
  format: 'INTERMEDIATE · DEEP DIVE',
  scenario: 'namespace payments · pod payments-api-7d9f · thread session-123',
  scope: 'Names and behaviour were checked by running them against langgraph 1.2.14 and langchain 1.4.4 on 2026-10-11, with a scripted stand-in for the model: node names, checkpoint order, which nodes repeat after a crash, the interrupt and resume values, and the recursion error. The pod, the tools and the troubleshooting graph are examples, and checkpoint numbers are simplified to count from the first saved step. Subgraphs, parallel branches, streaming modes, the long-term Store and multi-agent patterns are outside this page.',
  groups: ['Why a graph', 'The agent as a graph', 'Your own flow', 'Saved state', 'In a service'],
  views,
  sources: SOURCES,
  related: [{ label: 'LangChain: From One Model Call to an Agent', href: '/langchain' }, { label: 'Kubernetes API Server', href: '/kubernetes-api-server' }],
};
