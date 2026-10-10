/**
 * From one model call to an agent, then the same loop spelled with LangChain.
 * One picture grows: your code on the left, the model on the right, and the list that travels between them.
 */
import { code, edge, msg, node, type Diagram, type Gate, type Lesson, type Msg, type View } from './lesson-types';

const SOURCES = [
  { label: 'OpenRouter: quickstart', url: 'https://openrouter.ai/docs/quickstart' },
  { label: 'OpenAI: function calling guide', url: 'https://developers.openai.com/api/docs/guides/function-calling' },
  { label: 'LangChain: messages', url: 'https://docs.langchain.com/oss/python/langchain/messages' },
  { label: 'LangChain: models and bind_tools', url: 'https://docs.langchain.com/oss/python/langchain/models' },
  { label: 'LangChain: tools', url: 'https://docs.langchain.com/oss/python/langchain/tools' },
  { label: 'LangChain: agents', url: 'https://docs.langchain.com/oss/python/langchain/agents' },
  { label: 'LangChain reference: create_agent', url: 'https://reference.langchain.com/python/langchain/agents/factory/create_agent' },
  { label: 'LangChain: human-in-the-loop middleware', url: 'https://docs.langchain.com/oss/python/langchain/human-in-the-loop' },
  { label: 'Kubernetes: Pod lifecycle', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/' },
  { label: 'Kubernetes: RBAC authorization', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' },
  { label: 'Kubernetes: API concepts', url: 'https://kubernetes.io/docs/reference/using-api/api-concepts/' },
  { label: 'LangChain reference: Runnable', url: 'https://reference.langchain.com/python/langchain_core/runnables/' },
  { label: 'LangChain: Model Context Protocol', url: 'https://docs.langchain.com/oss/python/langchain/mcp' },
];
const [OPENROUTER, FUNCTIONS, MESSAGES, MODELS, TOOLS, AGENTS, CREATE_AGENT, HITL, POD, RBAC, K8S_API, RUNNABLE, MCP] = SOURCES.map((_, index) => index);

/* The picture. Views reuse these positions so a box never moves between views. */
const PROC = (height: number) => ({ id: 'proc', x: 10, y: 20, w: 178, h: height, label: 'YOUR PROCESS' });
const PROV = { id: 'prov', x: 452, y: 20, w: 178, h: 100, label: 'MODEL PROVIDER' };
const APP = node('app', 'code', 24, 48, 'your code', 'Python');
const MODEL = node('model', 'model', 466, 48, 'model', 'remote API');
const REQ = edge('req', 'app', 'model', 'request', { shift: -12 });
const REP = edge('rep', 'model', 'app', 'reply', { shift: 12 });

const TALK: Diagram = { title: 'Your code and the model', width: 640, height: 134, zones: [PROC(100), PROV], nodes: [APP, MODEL], edges: [REQ, REP] };

const HOPS: Diagram = {
  title: 'What sits between your code and the model', width: 640, height: 134,
  zones: [{ id: 'proc', x: 4, y: 20, w: 132, h: 100, label: 'YOUR PROCESS' }, { id: 'procwide', x: 4, y: 20, w: 297, h: 100, label: 'YOUR PROCESS' }, { id: 'net', x: 324, y: 20, w: 310, h: 100, label: "SOMEONE ELSE'S SERVERS" }],
  nodes: [
    node('app', 'code', 12, 48, 'your code', 'Python', 116),
    node('sdk', 'part', 165, 55, 'OpenAI SDK', 'builds the request', 128),
    node('router', 'part', 332, 55, 'OpenRouter', 'picks a provider', 128),
    node('model', 'model', 496, 48, 'model', 'at its provider', 130),
  ],
  edges: [
    edge('req', 'app', 'model', 'request: a list of messages', { shift: -12 }),
    edge('rep', 'model', 'app', 'reply: one message', { shift: 12 }),
    edge('h1', 'app', 'sdk'), edge('h2', 'sdk', 'router'), edge('h3', 'router', 'model'),
  ],
};

const WORK: Diagram = {
  title: 'Your code, the model, a tool function and the cluster', width: 640, height: 256,
  zones: [PROC(222), PROV],
  nodes: [APP, MODEL, node('fn', 'tool', 24, 170, 'tool function', 'plain Python'), node('k8s', 'kube', 245, 170, 'API server', 'Kubernetes'), node('pods', 'kube', 466, 170, 'pods', 'payments namespace')],
  edges: [
    REQ, REP,
    edge('call', 'app', 'fn', 'call', { shift: 16 }),
    edge('ret', 'fn', 'app', 'return', { shift: -16 }),
    edge('ghost', 'model', 'fn', 'the model runs the tool?', { kind: 'imagined' }),
    edge('kget', 'fn', 'k8s', 'HTTPS GET', { shift: -11 }),
    edge('kret', 'k8s', 'fn', 'JSON', { shift: 11 }),
    edge('kp', 'k8s', 'pods'),
  ],
};
const TOOL_ONLY = ['proc', 'prov', 'app', 'model', 'fn', 'req', 'rep', 'call', 'ret'];
const WITH_KUBE = [...TOOL_ONLY, 'k8s', 'pods', 'kget', 'kret', 'kp'];

const LOOP: Diagram = {
  title: 'The loop around a model and its tools', width: 640, height: 300,
  zones: [{ id: 'yours', x: 40, y: 100, w: 560, h: 188, label: 'YOUR CODE RUNS THIS PART' }, { id: 'built', x: 40, y: 100, w: 560, h: 188, label: 'BUILT BY create_agent' }],
  nodes: [
    node('model', 'model', 245, 22, 'model', 'remote API'),
    node('ask', 'gate', 256, 118, 'tool calls?'),
    node('tools', 'tool', 60, 214, 'run the tools', 'your functions'),
    node('answer', 'terminal', 430, 222, 'return the answer', undefined, 150, 42),
  ],
  edges: [
    edge('m-ask', 'model', 'ask', 'reply'),
    edge('yes', 'ask', 'tools', 'yes'),
    edge('no', 'ask', 'answer', 'no'),
    edge('again', 'tools', 'model', 'results', { via: [[135, 51]] }),
  ],
};
const LOOP_BASE = ['yours', 'model', 'ask', 'tools', 'answer', 'm-ask', 'yes', 'no', 'again'];

const PIPE: Diagram = {
  title: 'A chain of Runnables', width: 640, height: 226,
  nodes: [
    node('input', 'terminal', 10, 45, 'input', undefined, 84),
    node('prompt', 'part', 124, 40, 'prompt', 'fills a template', 116),
    node('model', 'model', 270, 33, 'model', 'one call', 120),
    node('parser', 'part', 420, 40, 'parser', 'pulls out text', 112),
    node('output', 'terminal', 562, 45, 'output', undefined, 72),
    node('tools', 'tool', 270, 158, 'tools', 'your functions', 120, 52),
  ],
  edges: [
    edge('p1', 'input', 'prompt'), edge('p2', 'prompt', 'model'), edge('p3', 'model', 'parser'), edge('p4', 'parser', 'output'),
    edge('down', 'model', 'tools', undefined, { shift: -16 }),
    edge('up', 'tools', 'model', 'no way back', { shift: 16 }),
  ],
};
const PIPE_ROW = ['input', 'prompt', 'model', 'parser', 'output', 'p1', 'p2', 'p3', 'p4'];

/* The conversation that the second half of the page follows. */
const fresh = (row: Msg): Msg => ({ ...row, fresh: true });
const SYS = msg('system', 'You are a read-only Kubernetes assistant for the payments namespace.');
const Q = msg('user', 'Why is payments-api failing?');
const A1 = msg('assistant', 'tool_calls: list_pods(namespace="payments")   id=call_1');
const T1 = msg('tool', 'payments-api-7d9f  phase=Running  ready=0/1  restarts=8   (answers call_1)');
const A2 = msg('assistant', 'tool_calls: get_pod_details(namespace="payments", pod_name="payments-api-7d9f")   id=call_2');
const T2 = msg('tool', 'state=waiting reason=CrashLoopBackOff  restarts=8  last_exit_code=137  last_reason=OOMKilled   (answers call_2)');
const A3 = msg('assistant', 'payments-api-7d9f is crash-looping. Its last run was killed for exceeding its memory limit (OOMKilled, exit code 137), and it has restarted 8 times.');
const receives = (conversation: number, call: number) => ({
  title: `What model call ${call} receives`,
  rows: [{ label: 'System prompt', tokens: 40 }, { label: 'Tool schemas', tokens: 160 }, { label: 'Conversation', tokens: conversation, fresh: true }],
});

const CHECKS = ['Is this a tool we registered?', 'Do the arguments match the schema?', 'Is it inside the scope the server set?', 'Does Kubernetes allow our credential?'];
const gates = (results: [Gate['result'], string][]): Gate[] => results.map(([result, why], index) => ({ check: CHECKS[index], result, why }));

const HAND_LOOP = `
messages = [system, question]
for _ in range(MAX_STEPS):                # your limit
    reply = call_model(messages, TOOLS)
    messages.append(reply)                # keep the request
    if not reply.tool_calls:
        return reply.content              # plain text: done
    for call in reply.tool_calls:         # may be several
        result = run_tool(call)           # your code runs it
        messages.append(tool_message(call.id, result))
return "Stopped: step limit reached."`;

const LAYERS = [
  ['Model API', 'Messages in, one message out', 'Everything else'],
  ['SDK', 'Builds the HTTP call, parses the JSON', 'Messages, tools, the loop'],
  ['Tool calling', 'Lets the reply be a structured request', 'Running the tool, sending the result'],
  ['A loop you wrote', 'Repeats until the model answers in text', 'Limits, checks, errors'],
  ['LangChain parts', 'One spelling for messages, models and tools', 'The loop'],
  ['create_agent', 'The standard loop, with hooks', 'Tools, limits, approvals'],
  ['LangGraph', 'The loop as a graph you can change, save and pause', 'Designing the graph'],
];

const views: View[] = [
  {
    id: 'one-call', group: 'One call', label: 'One call', mode: 'steps',
    title: 'One question, one answer',
    lede: 'Your code sends some text to a model over HTTPS and gets some text back.',
    diagram: HOPS,
    frames: [
      {
        action: 'Send', caption: 'Your code sends a request. Inside it is a list with one item: the question.',
        pic: { show: ['proc', 'app', 'model', 'req', 'rep'], hot: ['req', 'app'] },
        code: [
          code('Python', `
response = client.chat.completions.create(
    model=MODEL,
    messages=[
        {"role": "user",
         "content": "What is a Kubernetes Pod?"},
    ],
)`, [3, 4, 5, 6]),
          code('What goes over the wire', `
POST /api/v1/chat/completions
{
  "model": "…",
  "messages": [
    {"role": "user",
     "content": "What is a Kubernetes Pod?"}
  ]
}`, [4, 5, 6, 7]),
        ],
      },
      {
        action: 'Receive', caption: 'The model sends back one item of the same shape, written by it. Then it forgets the exchange.',
        pic: { show: ['proc', 'app', 'model', 'req', 'rep'], hot: ['rep', 'model'] },
        code: [
          code('Python', `
message = response.choices[0].message
print(message.content)
# A Pod is the smallest unit Kubernetes
# schedules: one or more containers that
# share a network address and storage.`, [1]),
          code('What came back', `
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "A Pod is the smallest unit…"
    },
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 14,
            "completion_tokens": 31}
}`, [3, 4, 5, 6]),
        ],
      },
      {
        action: 'Look inside the arrow', caption: 'That arrow was three things. A library in your process built the request, a routing service received it, and a provider ran the model.',
        pic: { show: ['procwide', 'net', 'app', 'sdk', 'router', 'model', 'h1', 'h2', 'h3'], hot: ['h1', 'h2', 'h3'], fresh: ['sdk', 'router', 'net'] },
        code: [
          code('Where each one is named', `
from openai import OpenAI                       # the SDK

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",    # the router
    api_key=os.environ["OPENROUTER_API_KEY"],
)
MODEL = "anthropic/…"    # the model, at its provider`, [1, 4, 7]),
        ],
      },
    ],
    inspector: {
      heading: 'A model is an HTTP endpoint',
      body: 'Nothing in this exchange is specific to AI plumbing. Your code makes a POST request and reads JSON. The reply has a role and some content, and the provider keeps no record of the conversation for the next call.',
      facts: [['You send', 'A list of messages'], ['You get', 'One message, plus token counts'], ['Kept between calls', 'Nothing']],
      evidence: ['Where the text is', 'response.choices[0].message.content'],
      note: 'The SDK, the router and the model fail separately: a bad key is rejected by the router, a rate limit comes from the provider, a timeout can be any of them. The wire format shown here is Chat Completions, which OpenRouter accepts. OpenAI\'s newer Responses API names the fields differently.',
    },
    takeaway: 'Under every framework there is one HTTP call: a list of messages goes out, one message comes back.',
    sources: [OPENROUTER],
  },
  {
    id: 'messages', group: 'One call', label: 'The list', mode: 'choices',
    title: 'The request is a list, and each item says who wrote it',
    lede: 'Three kinds of item are enough for a conversation.',
    diagram: TALK,
    frames: [
      {
        action: 'Read the list', caption: 'You wrote the first item, the user wrote the second, and the model wrote the third. The label on each one is called its role.',
        pic: { hot: ['req'], say: { req: 'request: the whole list', rep: 'reply: one more item' } },
        messages: {
          title: 'messages',
          rows: [
            msg('system', 'You are a Kubernetes troubleshooting assistant. Answer briefly.'),
            msg('user', 'What is a Pod?'),
            msg('assistant', 'A Pod is the smallest unit Kubernetes schedules: one or more containers that share a network address.'),
          ],
        },
        code: [code('The same list in Python', `
messages = [
    {"role": "system",    "content": "You are a Kubernetes…"},
    {"role": "user",      "content": "What is a Pod?"},
    {"role": "assistant", "content": "A Pod is the smallest…"},
]`)],
      },
    ],
    inspector: {
      heading: 'Three roles, three authors',
      body: 'The system message is where you say how the model should behave. The user message carries what the person asked. An assistant message is something the model said earlier, which your code chose to put back into the list.',
      facts: [['system', 'Your standing instructions'], ['user', 'The person\'s words'], ['assistant', 'The model\'s earlier replies']],
      evidence: ['Every item has', '{"role": …, "content": …}'],
      note: 'A system message is instructions the model usually follows. It is not memory, not a database, and not a permission check: text arriving later in the list can talk the model out of it.',
    },
    takeaway: 'A conversation is a list of role-tagged messages that your code assembles before every call.',
    sources: [MESSAGES, OPENROUTER],
  },
  {
    id: 'memory', group: 'One call', label: 'No memory', mode: 'steps',
    title: 'The model remembers nothing, so you send everything again',
    lede: 'Ask three questions in a row and watch what each request has to carry.',
    diagram: TALK,
    frames: [
      {
        action: 'Request 1', caption: 'The first question goes out on its own.',
        pic: { hot: ['req'], say: { req: 'request 1: 2 items' } },
        messages: { title: 'Request 1 carries', rows: [msg('system', 'You are a Kubernetes troubleshooting assistant.'), fresh(msg('user', 'What is a Pod?'))] },
        meter: { title: 'Tokens sent', rows: [{ label: 'Request 1', tokens: 30, fresh: true }] },
      },
      {
        action: 'Request 2', caption: '"Can it contain two containers?" only makes sense after the first exchange, so your code sends that exchange again with the new question on the end.',
        pic: { hot: ['req'], say: { req: 'request 2: 4 items' } },
        messages: {
          title: 'Request 2 carries',
          rows: [msg('system', 'You are a Kubernetes troubleshooting assistant.'), msg('user', 'What is a Pod?'), msg('assistant', 'A Pod is the smallest unit Kubernetes schedules…'), fresh(msg('user', 'Can it contain two containers?'))],
        },
        meter: { title: 'Tokens sent', rows: [{ label: 'Request 1', tokens: 30 }, { label: 'Request 2', tokens: 95, fresh: true }] },
      },
      {
        action: 'Request 3', caption: 'The third request carries both earlier exchanges. Each call is billed for the whole list, not for the new line.',
        pic: { hot: ['req'], say: { req: 'request 3: 6 items' } },
        messages: {
          title: 'Request 3 carries',
          rows: [
            msg('system', 'You are a Kubernetes troubleshooting assistant.'), msg('user', 'What is a Pod?'), msg('assistant', 'A Pod is the smallest unit Kubernetes schedules…'),
            msg('user', 'Can it contain two containers?'), msg('assistant', 'Yes. Containers in one Pod share its network and can share volumes.'), fresh(msg('user', 'Why would I do that?')),
          ],
        },
        meter: { title: 'Tokens sent', rows: [{ label: 'Request 1', tokens: 30 }, { label: 'Request 2', tokens: 95 }, { label: 'Request 3', tokens: 170, fresh: true }] },
        code: [code('The whole of "memory"', `
messages.append(reply)       # what the model just said
messages.append(question)    # what the user asks next
reply = call_model(messages) # everything, every time`)],
      },
    ],
    inspector: {
      heading: 'Your list is the memory',
      body: 'The model answers a follow-up correctly because the earlier turns are in front of it again. If your code drops a turn, the model never saw it. If the process exits, the list is gone unless you stored it.',
      facts: [['Who keeps history', 'Your code'], ['What grows', 'Input tokens, on every call'], ['What limits it', 'The model\'s context window']],
      evidence: ['Watch it grow', 'response.usage.prompt_tokens'],
      note: 'Long conversations are trimmed or summarised for this reason. Whatever stays in the list also stays in front of the model, including anything a tool returned earlier.',
    },
    takeaway: 'History is context you resend, and you pay for all of it on every call.',
    sources: [MESSAGES, MODELS],
  },
  {
    id: 'tool-request', group: 'Tools', label: 'A tool', mode: 'steps',
    title: 'The model asks for a function. Your code runs it.',
    lede: 'Give the model one function it could use, ask a question that needs it, and follow what happens.',
    diagram: WORK,
    frames: [
      {
        action: 'Describe it', caption: 'There are two things here: a function that runs, and a description of it. Only the description will be sent.',
        pic: { show: TOOL_ONLY.filter((id) => id !== 'call' && id !== 'ret'), fresh: ['fn'], hot: ['fn'], say: { req: 'request', rep: 'reply' } },
        code: [
          code('The function: runs in your process', `
def get_cluster_name():
    return "kind-dev"`),
          code('Its description: shown to the model', `
{"type": "function",
 "function": {
   "name": "get_cluster_name",
   "description": "Get the current Kubernetes cluster",
   "parameters": {"type": "object", "properties": {}}
 }}`),
        ],
      },
      {
        action: 'Ask', caption: 'The request now carries the question and the description.',
        pic: { show: TOOL_ONLY.filter((id) => id !== 'call' && id !== 'ret'), hot: ['req'], say: { req: 'messages + description' } },
        messages: { title: 'messages', rows: [fresh(msg('user', 'Which cluster am I connected to?'))] },
        code: [code('Python', `
response = client.chat.completions.create(
    model=MODEL,
    messages=messages,
    tools=TOOLS,        # the descriptions
)`, [4])],
      },
      {
        action: 'The reply', caption: 'The reply has no answer in it. It names the function and stops.',
        notice: { tone: 'stop', label: 'NOTHING HAS RUN', text: 'The model wrote a request. It has no connection to your function, and until your code acts, nothing happens.' },
        pic: { show: [...TOOL_ONLY.filter((id) => id !== 'call' && id !== 'ret'), 'ghost'], hot: ['rep'], say: { rep: 'a request to call a function' } },
        messages: { title: 'messages', rows: [msg('user', 'Which cluster am I connected to?'), fresh(msg('assistant', 'tool_calls: get_cluster_name()   id=call_1'))] },
        code: [code('What came back', `
{"role": "assistant",
 "content": null,
 "tool_calls": [{
   "id": "call_1",
   "type": "function",
   "function": {"name": "get_cluster_name",
                "arguments": "{}"}
 }]}`, [3, 4, 6, 7])],
      },
      {
        action: 'Run it', caption: 'Your code reads the name, finds the function, and calls it.',
        pic: { show: TOOL_ONLY, hot: ['call', 'ret', 'fn'], fresh: ['call', 'ret'], say: { ret: '"kind-dev"' } },
        messages: { title: 'messages', rows: [msg('user', 'Which cluster am I connected to?'), msg('assistant', 'tool_calls: get_cluster_name()   id=call_1')] },
        code: [code('Python', `
call = message.tool_calls[0]
function = TOOLS_BY_NAME[call.function.name]
result = function()            # "kind-dev"`, [3])],
      },
      {
        action: 'Send the result', caption: 'The result goes back as a new item, tagged with the id of the request it answers. The model is called a second time.',
        pic: { show: TOOL_ONLY, hot: ['req'], say: { req: 'the list, now 3 items' } },
        messages: { title: 'messages', rows: [msg('user', 'Which cluster am I connected to?'), msg('assistant', 'tool_calls: get_cluster_name()   id=call_1'), fresh(msg('tool', '"kind-dev"   (answers call_1)'))] },
        code: [code('Python', `
messages.append(message)       # the model's request
messages.append({
    "role": "tool",
    "tool_call_id": call.id,   # which request this answers
    "content": result,
})`, [1, 4])],
      },
      {
        action: 'The answer', caption: 'With the result in the list, the model can answer in words.',
        pic: { show: TOOL_ONLY, hot: ['rep'], say: { rep: 'plain text' } },
        messages: {
          title: 'messages',
          rows: [msg('user', 'Which cluster am I connected to?'), msg('assistant', 'tool_calls: get_cluster_name()   id=call_1'), msg('tool', '"kind-dev"   (answers call_1)'), fresh(msg('assistant', 'You are connected to the kind-dev cluster.'))],
        },
      },
    ],
    inspector: {
      heading: 'Tool calling is a reply format',
      body: 'A model with tool descriptions has two ways to reply: text, or a structured request naming a function and its arguments. This is called tool calling, or function calling. The request is data. Your process decides whether to act on it.',
      facts: [['The model produces', 'A name and arguments'], ['Your code does', 'The lookup, the call, the result message'], ['A fourth role', 'tool: a result written by your code']],
      evidence: ['Where requests arrive', 'response.choices[0].message.tool_calls'],
      note: 'Order matters. The assistant message holding the request must be in the list before the tool message that answers it, and the ids must match, or the provider rejects the next call. One reply can also ask for several tools at once; each gets its own result message.',
    },
    takeaway: 'The model never executes a tool. It writes a request, and your application decides what happens next.',
    sources: [FUNCTIONS, MODELS],
  },
  {
    id: 'arguments', group: 'Tools', label: 'Arguments', mode: 'choices',
    title: 'Arguments arrive as text, and text can be wrong',
    lede: 'A tool that takes arguments gets them as a string the model wrote. Three things can come back.',
    diagram: {
      title: 'From the model\'s text to a function call', width: 640, height: 96,
      nodes: [
        node('text', 'part', 8, 26, 'JSON string', 'from the model', 124),
        node('parse', 'part', 172, 26, 'json.loads', 'text to dict', 112),
        node('check', 'gate', 322, 21, 'valid?', undefined, 112, 54),
        node('run', 'tool', 474, 20, 'get_pod_status', '(**arguments)', 156, 56),
      ],
      edges: [edge('a1', 'text', 'parse'), edge('a2', 'parse', 'check'), edge('a3', 'check', 'run')],
    },
    frames: [
      {
        action: 'A good call', caption: 'The string parses, the names and types match the description, and the function runs.',
        pic: { hot: ['a1', 'a2', 'a3', 'run'] },
        code: [
          code('What the model sent', `
"arguments": "{\\"namespace\\": \\"payments\\",
               \\"pod_name\\": \\"payments-api-7d9f\\"}"`),
          code('Python', `
arguments = json.loads(call.function.arguments)
check(arguments, SCHEMA)           # names, types, required
result = get_pod_status(**arguments)`, [3]),
        ],
        notice: { tone: 'ok', label: 'RUNS', text: 'get_pod_status(namespace="payments", pod_name="payments-api-7d9f")' },
      },
      {
        action: 'Missing argument', caption: 'The string parses, but pod_name is missing. Your check catches it, and the error goes back to the model as the tool\'s result.',
        pic: { hot: ['a1', 'a2'], denied: ['a3', 'check'] },
        code: [
          code('What the model sent', `
"arguments": "{\\"namespace\\": \\"payments\\"}"`),
          code('What your code sends back', `
{"role": "tool",
 "tool_call_id": "call_2",
 "content": "error: pod_name is required"}`, [3]),
        ],
        notice: { tone: 'warn', label: 'DOES NOT RUN', text: 'The model reads the error on its next call and can try again with both arguments.' },
      },
      {
        action: 'Cut-off JSON', caption: 'The reply hit its length limit halfway through the arguments, so the string is not JSON at all.',
        pic: { hot: ['a1'], denied: ['a2', 'parse'] },
        code: [
          code('What the model sent', `
"arguments": "{\\"namespace\\": \\"payments\\", \\"pod_na"
"finish_reason": "length"`, [2]),
          code('Python', `
try:
    arguments = json.loads(call.function.arguments)
except json.JSONDecodeError:
    result = "error: arguments were not valid JSON"`, [3, 4]),
        ],
        notice: { tone: 'stop', label: 'DOES NOT RUN', text: 'json.loads raises. Catch it and return an error, or the whole run ends on one malformed reply.' },
      },
    ],
    inspector: {
      heading: 'The description guides. Your check decides.',
      body: 'The description uses JSON Schema to say which arguments exist, their types, and which are required. It steers what the model writes. It does not make the output correct, so the code that receives the string has to parse it and validate it before anything runs.',
      facts: [['A schema is', 'Guidance to the model, and a contract you can check against'], ['Valid arguments are', 'Well-formed, not necessarily permitted'], ['Errors go', 'Back to the model, as the tool result']],
      evidence: ['The contract', '"required": ["namespace", "pod_name"]'],
      note: 'Some providers offer a strict mode that constrains the reply to the schema. Chat Completions requests are not strict by default. Either way, a well-formed call can still name a namespace this user should never read. That check comes later on this page.',
    },
    takeaway: 'A schema shapes what the model writes. Validation in your code decides what runs.',
    sources: [FUNCTIONS],
  },
  {
    id: 'real-tool', group: 'Tools', label: 'A real tool', mode: 'steps',
    title: 'Behind the function is the Kubernetes API',
    lede: 'Swap the toy function for one that lists pods. The model\'s side does not change at all.',
    diagram: WORK,
    frames: [
      {
        action: 'Call the API', caption: 'The function makes the same request kubectl get pods -n payments would make, with whatever credential your process holds.',
        pic: { show: WITH_KUBE, hot: ['kget', 'fn'], fresh: ['k8s', 'pods', 'kget', 'kret', 'kp'], say: { kget: 'GET …/pods' } },
        code: [code('Python', `
from kubernetes import client, config

config.load_kube_config()        # or the pod's ServiceAccount
core = client.CoreV1Api()

def list_pods(namespace: str):
    pods = core.list_namespaced_pod(namespace).items`, [3, 7])],
      },
      {
        action: 'Read the answer', caption: 'The API server replies with complete Pod objects: spec, status, managed fields, every condition.',
        pic: { show: WITH_KUBE, hot: ['kret', 'k8s'], say: { kret: 'full JSON' } },
        meter: { title: 'If you returned it as is', rows: [{ label: 'Full Pod objects', tokens: 5200, fresh: true }], note: 'Example size for a handful of pods. All of it would be model input, on this call and every later one.' },
      },
      {
        action: 'Return four fields', caption: 'The function keeps what a diagnosis needs and returns that.',
        pic: { show: WITH_KUBE, hot: ['ret', 'fn'], say: { ret: 'compact' } },
        meter: { title: 'What the model is sent', rows: [{ label: 'Full Pod objects', tokens: 5200 }, { label: 'Four fields per pod', tokens: 45, fresh: true }], note: 'Example sizes. The result becomes a message, so it is resent on every later call.' },
        code: [
          code('Python', `
    return [
        {"name": pod.metadata.name,
         "phase": pod.status.phase,
         "ready": all(c.ready for c in statuses(pod)),
         "restarts": sum(c.restart_count
                         for c in statuses(pod))}
        for pod in pods
    ]`),
          code('Tool result', `
[{"name": "payments-api-7d9f",
  "phase": "Running",
  "ready": false,
  "restarts": 8}]`),
        ],
      },
    ],
    inspector: {
      heading: 'A tool is ordinary code with ordinary credentials',
      body: 'The function reaches the cluster the way any client does: an HTTPS request to the API server, authenticated with a kubeconfig or a ServiceAccount token. Kubernetes authorises that credential. It has no idea a model was involved.',
      facts: [['Same API as', 'kubectl get pods -n payments'], ['Authorised by', 'RBAC, for the credential your process uses'], ['The model sees', 'Only what the function returns']],
      evidence: ['The request underneath', 'GET /api/v1/namespaces/payments/pods'],
      note: 'A pod reported as Running can still be failing: Running is the phase, and it only says a container has started at least once. The ready flag and restart count are what show the trouble here.',
    },
    takeaway: 'Return the few facts the model needs. Every byte a tool returns is input on every later call.',
    sources: [K8S_API, POD, TOOLS],
  },
  {
    id: 'investigation', group: 'The loop', label: 'Two tools', mode: 'steps',
    title: 'A real question takes several round trips',
    lede: 'Ask why payments-api is failing. The model has two tools and decides what to look at.',
    diagram: WORK,
    frames: [
      {
        action: 'Model call 1', caption: 'The question goes out with the system message and both tool descriptions.',
        pic: { show: WITH_KUBE, hot: ['req'], say: { req: 'model call 1' } },
        messages: { title: 'messages', rows: [SYS, fresh(Q)] },
        meter: receives(10, 1),
      },
      {
        action: 'It asks for the pods', caption: 'The model wants to see what is in the namespace first.',
        pic: { show: WITH_KUBE, hot: ['rep'], say: { rep: 'asks for list_pods' } },
        messages: { title: 'messages', rows: [SYS, Q, fresh(A1)] },
        meter: receives(10, 1),
      },
      {
        action: 'Your code lists them', caption: 'Your code runs list_pods and appends the result. One pod is not ready and has restarted eight times.',
        pic: { show: WITH_KUBE, hot: ['call', 'kget', 'kret', 'ret', 'fn'], say: { ret: 'result' } },
        messages: { title: 'messages', rows: [SYS, Q, A1, fresh(T1)] },
        meter: receives(70, 2),
      },
      {
        action: 'Model call 2', caption: 'The whole list goes out again. This time the model asks for details of the pod that looked wrong.',
        pic: { show: WITH_KUBE, hot: ['req', 'rep'], say: { req: 'model call 2', rep: 'asks for get_pod_details' } },
        messages: { title: 'messages', rows: [SYS, Q, A1, T1, fresh(A2)] },
        meter: receives(70, 2),
      },
      {
        action: 'Your code gets details', caption: 'The container is waiting in CrashLoopBackOff, and its previous run ended with exit code 137, reason OOMKilled.',
        pic: { show: WITH_KUBE, hot: ['call', 'kget', 'kret', 'ret', 'fn'], say: { ret: 'result' } },
        messages: { title: 'messages', rows: [SYS, Q, A1, T1, A2, fresh(T2)] },
        meter: receives(165, 3),
      },
      {
        action: 'Model call 3', caption: 'Third call, six items. The model has what it needs and answers in text.',
        pic: { show: WITH_KUBE, hot: ['req', 'rep'], say: { req: 'model call 3', rep: 'plain text' } },
        messages: { title: 'messages', rows: [SYS, Q, A1, T1, A2, T2, fresh(A3)] },
        meter: receives(165, 3),
      },
    ],
    inspector: {
      heading: 'One question, three model calls',
      body: 'Nobody told the model to list pods before asking for details. It chose that order from the tool descriptions and from what the first result showed. Your code did the same thing each time round: run what was asked, append the result, call again.',
      facts: [['Model calls', '3'], ['Tool runs', '2, both by your code'], ['Items in the list at the end', '7']],
      evidence: ['The evidence it used', 'last_exit_code=137  last_reason=OOMKilled'],
      note: 'CrashLoopBackOff is what the container is doing now: waiting before its next restart. Why it crashed is recorded on the previous run, as the last termination reason. OOMKilled there means the container went over its memory limit.',
    },
    takeaway: 'The model picks the next tool from what it has seen so far. Your code runs it and reports back.',
    sources: [POD, FUNCTIONS],
  },
  {
    id: 'loop', group: 'The loop', label: 'The loop', mode: 'choices',
    title: 'Fold those round trips up and you have a loop',
    lede: 'The three calls you just followed are one pattern repeated: call the model, run what it asks for, call it again.',
    diagram: LOOP,
    frames: [
      {
        action: 'A normal run', caption: 'Round the left side while the model keeps asking for tools, out through the right side when it answers in text.',
        pic: { show: LOOP_BASE, hot: ['m-ask', 'yes', 'again', 'tools'] },
        code: [code('The loop', HAND_LOOP, [3, 5, 6, 8, 9])],
      },
      {
        action: 'A tool fails', caption: 'Kubernetes refuses the request. The function returns the error as text, and the model reads it like any other result and explains it.',
        pic: { show: LOOP_BASE, hot: ['again'], denied: ['tools'], say: { again: '"error: 403 Forbidden"' }, badge: { tools: 'failed' } },
        code: [code('The loop', HAND_LOOP, [9, 10])],
        notice: { tone: 'warn', label: 'THE LOOP KEEPS GOING', text: 'An exception here would end the run. An error string gives the model something to report: "I can\'t read pods in that namespace."' },
      },
      {
        action: 'It never stops asking', caption: 'A confused model can keep requesting tools. The loop has no natural end, so yours needs a limit.',
        pic: { show: LOOP_BASE, hot: ['no', 'answer'], denied: ['yes'], say: { no: 'limit reached' }, badge: { ask: 'call 6 of 6' } },
        code: [code('The loop', HAND_LOOP, [2, 11])],
        notice: { tone: 'stop', label: 'STOPPED BY YOUR CODE', text: 'Without MAX_STEPS this run would continue, and bill, until something outside it gave up.' },
      },
    ],
    inspector: {
      heading: 'This loop is what people call an agent',
      body: 'An agent is a model, some tools, the message list, and a loop that keeps calling the model until it stops asking for tools. The model steers. Everything that actually happens is done by the code around it.',
      facts: [['The model decides', 'Which tool, which arguments, when it has enough'], ['Your loop decides', 'Whether to run it, how often, when to give up'], ['State', 'The message list']],
      evidence: ['The exit condition', 'if not reply.tool_calls: return reply.content'],
      note: 'The limit, the tool lookup, argument checks, timeouts and permissions all live in this loop. A prebuilt agent still has them; they are just configured instead of written.',
    },
    takeaway: 'An agent is a loop around a model and tools, and the loop belongs to your code.',
    sources: [AGENTS, MODELS],
  },
  {
    id: 'authority', group: 'The loop', label: 'Who decides', mode: 'choices',
    title: 'The model proposes. Four checks decide.',
    lede: 'Assume the model can be talked into requesting anything. Then look at what each request has to get past.',
    diagram: WORK,
    frames: [
      {
        action: 'Read its own namespace', caption: 'An ordinary request passes every check and runs.',
        pic: { show: WITH_KUBE, hot: ['rep', 'call', 'kget', 'kret', 'ret'], say: { rep: 'a request' } },
        gates: {
          title: 'What the request has to pass', call: 'list_pods(namespace="payments")', ok: true, verdict: 'The pods are listed.',
          rows: gates([['pass', 'list_pods is one of two tools this agent was given.'], ['pass', 'namespace is a string.'], ['pass', 'The server fixed this session to payments.'], ['pass', 'The ServiceAccount may list pods in payments.']]),
        },
      },
      {
        action: 'Delete a system pod', caption: 'Text in a log line persuaded the model to ask for a deletion. There is no such tool to run.',
        pic: { show: WITH_KUBE, hot: ['rep'], denied: ['call'], say: { rep: 'a request', call: 'no such tool' } },
        gates: {
          title: 'What the request has to pass', call: 'delete_pod(namespace="kube-system", pod_name="coredns-5d78c")', ok: false, verdict: 'Your code returns "error: unknown tool" and the model has to say it cannot do that.',
          rows: gates([['fail', 'This agent has list_pods and get_pod_details. Nothing that writes.'], ['skip', ''], ['skip', ''], ['skip', '']]),
        },
      },
      {
        action: 'Read another namespace', caption: 'A real tool, well-formed arguments, wrong scope.',
        pic: { show: WITH_KUBE, hot: ['rep'], denied: ['call'], say: { rep: 'a request', call: 'out of scope' } },
        gates: {
          title: 'What the request has to pass', call: 'list_pods(namespace="kube-system")', ok: false, verdict: 'The call is refused before it reaches Kubernetes.',
          rows: gates([['pass', 'list_pods is registered.'], ['pass', 'namespace is a string.'], ['fail', 'The server set namespace=payments for this session. The model\'s value is not used to widen it.'], ['skip', '']]),
        },
      },
      {
        action: 'Your check has a gap', caption: 'Suppose the scope check was never written. The request reaches the API server, and the credential itself is refused.',
        pic: { show: WITH_KUBE, hot: ['rep', 'call'], denied: ['kget', 'k8s'], say: { rep: 'a request', kget: '403' } },
        gates: {
          title: 'What the request has to pass', call: 'list_pods(namespace="kube-system")', ok: false, verdict: 'Kubernetes answers 403. The Role only grants reads in payments.',
          rows: gates([['pass', 'list_pods is registered.'], ['pass', 'namespace is a string.'], ['pass', 'No scope check exists in this version.'], ['fail', 'RBAC: this ServiceAccount cannot list pods in kube-system.']]),
        },
      },
    ],
    inspector: {
      heading: 'Authority lives in tools and credentials',
      body: 'A prompt cannot stop a model from asking. Any text it reads, from a user, a document or a tool result, can change what it requests. What you control is which tools exist, what your code checks before running one, and what the credential underneath is allowed to do.',
      facts: [['The model controls', 'Which registered tool it asks for, with which arguments, and when it stops'], ['Your code controls', 'Which tools exist, validation, scope, timeouts, retries, loop limits, approval'], ['The platform controls', 'What the credential may do: IAM, RBAC']],
      evidence: ['The last line of defence', 'kubectl auth can-i list pods -n kube-system --as=system:serviceaccount:payments:agent'],
      note: 'Take values that carry authority, such as the namespace or tenant, from server context instead of from the model\'s arguments. Then a successful injection changes what is asked for, and nothing else.',
    },
    takeaway: 'The system prompt asks nicely. Tools, checks and least-privilege credentials are what enforce.',
    sources: [RBAC, TOOLS, FUNCTIONS],
  },
  {
    id: 'langchain', group: 'LangChain', label: 'Same loop', mode: 'choices',
    title: 'LangChain gives the same pieces one spelling',
    lede: 'Nothing new happens in this view. The request, the reply and the tool result get standard classes.',
    diagram: WORK,
    frames: [
      {
        action: 'By hand', caption: 'Everything so far, written against one provider\'s JSON.',
        pic: { show: TOOL_ONLY, hot: ['req', 'rep'], say: { req: 'list of dicts + JSON schemas', rep: 'provider JSON' } },
        code: [code('By hand', `
messages = [{"role": "user", "content": question}]
response = client.chat.completions.create(
    model=MODEL, messages=messages, tools=SCHEMAS)
message = response.choices[0].message
call = message.tool_calls[0]
arguments = json.loads(call.function.arguments)
result = TOOLS_BY_NAME[call.function.name](**arguments)
messages.append(message)
messages.append({"role": "tool",
                 "tool_call_id": call.id,
                 "content": result})`)],
      },
      {
        action: 'With LangChain', caption: 'The same exchange. The picture has not changed; the objects travelling along it have names.',
        pic: { show: TOOL_ONLY, hot: ['req', 'rep'], say: { req: 'messages + bound tools', rep: 'AIMessage' } },
        code: [code('With LangChain', `
messages = [HumanMessage(question)]
reply = model_with_tools.invoke(messages)   # an AIMessage
call = reply.tool_calls[0]     # {"name", "args", "id"}
result = TOOLS_BY_NAME[call["name"]].invoke(call)
messages.append(reply)
messages.append(result)        # already a ToolMessage`, [2, 3, 4])],
        table: {
          title: 'What replaced what',
          head: ['By hand', 'LangChain', 'What you stop writing'],
          rows: [
            ['{"role": …} dicts', 'SystemMessage, HumanMessage, AIMessage, ToolMessage', 'Per-provider message shapes'],
            ['A JSON schema per function', '@tool', 'The schema'],
            ['Provider client and response parsing', 'A chat model class with .invoke()', 'Digging through choices[0]'],
            ['json.loads on the arguments', 'AIMessage.tool_calls, already parsed', 'The parse step'],
            ['A {"role": "tool"} dict', 'ToolMessage from tool.invoke(call)', 'Matching the id by hand'],
          ],
        },
      },
    ],
    inspector: {
      heading: 'A standard layer over many provider APIs',
      body: 'Each provider names these things differently on the wire. LangChain gives messages, models and tools one interface, with a provider package underneath that does the translation. Change the provider and the loop you wrote stays the same.',
      facts: [['langchain-core', 'Messages, tools, the Runnable interface'], ['Provider packages', 'langchain-openai, langchain-anthropic, langchain-openrouter, …'], ['Still yours', 'The loop']],
      evidence: ['One constructor for any provider', 'init_chat_model("…", model_provider="openrouter")'],
      note: 'LangChain\'s documentation recommends the dedicated langchain-openrouter package for OpenRouter. Pointing ChatOpenAI at OpenRouter\'s base URL works for plain chat, but fields a router adds may not survive.',
    },
    takeaway: 'LangChain standardises the pieces around the model call. It does not change what the call is.',
    sources: [MESSAGES, MODELS, TOOLS],
  },
  {
    id: 'tool-decorator', group: 'LangChain', label: '@tool', mode: 'steps',
    title: '@tool writes the description from the function',
    lede: 'The JSON you wrote by hand earlier is built from three things the function already has.',
    frames: [
      {
        action: 'The name', caption: 'The function\'s name becomes the tool\'s name.',
        code: [
          code('You write', `
@tool
def get_pod_details(namespace: str, pod_name: str) -> str:
    """Show one pod's container state, last exit code
    and reason."""
    …`, [2]),
          code('The model is sent', `
{"type": "function",
 "function": {
   "name": "get_pod_details",
   "description": "Show one pod's container state,
                   last exit code and reason.",
   "parameters": {
     "type": "object",
     "properties": {"namespace": {"type": "string"},
                    "pod_name":  {"type": "string"}},
     "required": ["namespace", "pod_name"]}}}`, [3]),
        ],
      },
      {
        action: 'The docstring', caption: 'The docstring becomes the description. The model reads it to decide when to use the tool, so it is prompt text.',
        code: [
          code('You write', `
@tool
def get_pod_details(namespace: str, pod_name: str) -> str:
    """Show one pod's container state, last exit code
    and reason."""
    …`, [3, 4]),
          code('The model is sent', `
{"type": "function",
 "function": {
   "name": "get_pod_details",
   "description": "Show one pod's container state,
                   last exit code and reason.",
   "parameters": {
     "type": "object",
     "properties": {"namespace": {"type": "string"},
                    "pod_name":  {"type": "string"}},
     "required": ["namespace", "pod_name"]}}}`, [4, 5]),
        ],
      },
      {
        action: 'The type hints', caption: 'The type hints become the argument schema. An argument with no default is required.',
        code: [
          code('You write', `
@tool
def get_pod_details(namespace: str, pod_name: str) -> str:
    """Show one pod's container state, last exit code
    and reason."""
    …`, [2]),
          code('The model is sent', `
{"type": "function",
 "function": {
   "name": "get_pod_details",
   "description": "Show one pod's container state,
                   last exit code and reason.",
   "parameters": {
     "type": "object",
     "properties": {"namespace": {"type": "string"},
                    "pod_name":  {"type": "string"}},
     "required": ["namespace", "pod_name"]}}}`, [6, 7, 8, 9, 10]),
        ],
      },
    ],
    inspector: {
      heading: 'Three parts of a function become three parts of a schema',
      body: 'The decorator turns the function into a tool object. Calling tool.invoke(call) with a tool-call dict validates the arguments against this schema, runs the function, and wraps the return value in a ToolMessage with the matching id.',
      facts: [['Function name', 'Tool name'], ['Docstring', 'Description the model reads'], ['Type hints', 'Argument schema, checked before the function runs']],
      evidence: ['See what was built', 'get_pod_details.name, .description, .args'],
      note: 'Write the docstring for the model: say when to call the tool and what it returns. A missing argument raises a validation error before your function body runs.',
    },
    takeaway: 'Name, docstring and type hints are the tool\'s contract. Write them for the model that will read them.',
    sources: [TOOLS],
  },
  {
    id: 'bind-tools', group: 'LangChain', label: 'bind_tools', mode: 'steps',
    title: 'bind_tools attaches descriptions. It runs nothing.',
    lede: 'This is the same step you saw with one toy function, under its LangChain name.',
    diagram: WORK,
    frames: [
      {
        action: 'Bind', caption: 'bind_tools returns a copy of the model that will attach the tool descriptions to every request.',
        pic: { show: TOOL_ONLY.filter((id) => id !== 'call' && id !== 'ret'), hot: ['app'] },
        code: [code('Python', `
model_with_tools = model.bind_tools(
    [list_pods, get_pod_details]
)`)],
      },
      {
        action: 'Invoke', caption: 'The request carries messages and descriptions. The reply is an AIMessage with empty content and one tool call.',
        pic: { show: [...TOOL_ONLY.filter((id) => id !== 'call' && id !== 'ret'), 'ghost'], hot: ['req', 'rep'], say: { req: 'messages + descriptions', rep: 'AIMessage(tool_calls=[…])' } },
        notice: { tone: 'stop', label: 'NOTHING HAS RUN', text: 'list_pods has not been called. The reply only says the model would like it to be.' },
        code: [
          code('Python', `
reply = model_with_tools.invoke(messages)`),
          code('reply', `
AIMessage(
  content="",
  tool_calls=[{
    "name": "list_pods",
    "args": {"namespace": "payments"},
    "id": "call_1",
  }],
)`, [3, 4, 5, 6]),
        ],
      },
      {
        action: 'Run it yourself', caption: 'Outside an agent, running the tool and appending its ToolMessage is still your code\'s job.',
        pic: { show: TOOL_ONLY, hot: ['call', 'ret', 'fn'], say: { ret: 'ToolMessage' } },
        code: [code('Python', `
messages.append(reply)
for call in reply.tool_calls:
    tool = TOOLS_BY_NAME[call["name"]]
    messages.append(tool.invoke(call))   # a ToolMessage`, [4])],
      },
    ],
    inspector: {
      heading: 'What bind_tools does and does not do',
      body: 'It makes the tool descriptions part of each request, so the model can reply with a structured tool call. It does not connect the model to your functions. The arguments in reply.tool_calls are already parsed into a dict, which is one step fewer than the raw API.',
      facts: [['Does', 'Send the descriptions with every request'], ['Does not', 'Execute a tool, ever'], ['tool_choice', 'Can force a tool call, or one specific tool']],
      evidence: ['Where the request lands', 'reply.tool_calls[0]["args"]'],
      note: 'Some providers offer tools they run on their own servers, such as web search. Those come back already executed inside the reply. Tools you define are always run by you.',
    },
    takeaway: 'Binding a tool gives the model a way to ask. Execution stays in your process.',
    sources: [MODELS],
  },
  {
    id: 'runnables', group: 'LangChain', label: 'Pipes', mode: 'steps',
    title: 'The pieces snap together in a line, and only in a line',
    lede: 'Prompts, models and parsers share one interface, so they can be joined with a pipe.',
    diagram: PIPE,
    frames: [
      {
        action: 'One interface', caption: 'Each box takes an input and returns an output through the same three methods. LangChain calls anything with this interface a Runnable.',
        pic: { show: PIPE_ROW },
        table: {
          title: 'What every Runnable has', head: ['Method', 'Does'],
          rows: [['invoke(input)', 'One input, one output'], ['stream(input)', 'Yields the output in chunks as it is produced'], ['batch([inputs])', 'Runs several inputs concurrently']],
        },
      },
      {
        action: 'Join them', caption: 'The pipe feeds each output into the next input. The result is itself a Runnable, so the whole chain can be invoked, streamed or batched.',
        pic: { show: PIPE_ROW, hot: ['p1', 'p2', 'p3', 'p4'] },
        code: [code('Python', `
chain = prompt | model | parser

chain.invoke({"question": "What is a Pod?"})
# "A Pod is one or more containers…"`, [1])],
      },
      {
        action: 'Now draw the agent', caption: 'The agent needs to go from the model to the tools and back to the model, as many times as it takes. A pipe only runs forward.',
        pic: { show: [...PIPE_ROW, 'tools', 'down', 'up'], hot: ['down'], denied: ['up'], fresh: ['tools', 'down', 'up'] },
        notice: { tone: 'stop', label: 'A PIPE CANNOT LOOP', text: 'prompt | model | tools runs each step once and ends. "Again, until the model stops asking" has nowhere to go.' },
      },
    ],
    inspector: {
      heading: 'Good for pipelines, silent about loops',
      body: 'Composing Runnables with | is called LCEL, the LangChain Expression Language. It describes data flowing one way: fill a prompt, call a model, parse the result. That covers a lot of useful programs. It has no way to repeat a step until a condition holds.',
      facts: [['Fits', 'Fixed steps known in advance'], ['Does not fit', 'Repeating, branching on results, pausing'], ['Also Runnables', 'Tools, retrievers, and compiled LangGraph graphs']],
      evidence: ['The same thing without the pipe', 'parser.invoke(model.invoke(prompt.invoke(x)))'],
      note: 'This is why the loop earlier was a plain Python for loop even though every piece inside it was a LangChain object.',
    },
    takeaway: 'LCEL composes straight pipelines. An agent needs a cycle, which is a different kind of structure.',
    sources: [RUNNABLE, MODELS],
  },
  {
    id: 'create-agent', group: 'LangChain', label: 'create_agent', mode: 'steps',
    title: 'create_agent is the loop, already written',
    lede: 'Hand it a model and tools, and it builds the loop you wrote by hand.',
    diagram: LOOP,
    frames: [
      {
        action: 'Your loop', caption: 'The loop from earlier: call the model, run the tools it asks for, repeat until it answers.',
        pic: { show: LOOP_BASE },
        code: [code('By hand', HAND_LOOP)],
      },
      {
        action: 'One call', caption: 'The same loop, built for you. The picture is identical.',
        pic: { show: LOOP_BASE.map((id) => id === 'yours' ? 'built' : id), fresh: ['built'] },
        code: [code('With create_agent', `
from langchain.agents import create_agent

agent = create_agent(
    model,
    tools=[list_pods, get_pod_details],
    system_prompt="You are a read-only Kubernetes…",
)
result = agent.invoke({"messages": [
    {"role": "user",
     "content": "Why is payments-api failing?"}]})
result["messages"][-1].text`, [3, 4, 5, 6, 7])],
      },
      {
        action: 'Look at what it built', caption: 'What comes back is a graph with a model node and a tools node. The loop was not removed. It was drawn for you.',
        pic: { show: LOOP_BASE.map((id) => id === 'yours' ? 'built' : id), hot: ['model', 'tools'], badge: { model: 'node: model', tools: 'node: tools' } },
        code: [
          code('Python', `
type(agent).__name__
# 'CompiledStateGraph'
list(agent.get_graph().nodes)
# ['__start__', 'model', 'tools', '__end__']`, [2, 4]),
          code('Your limits become middleware', `
from langchain.agents.middleware import (
    ModelCallLimitMiddleware, HumanInTheLoopMiddleware)

agent = create_agent(model, tools=TOOLS, middleware=[
    ModelCallLimitMiddleware(run_limit=6),  # MAX_STEPS
    HumanInTheLoopMiddleware(
        interrupt_on={"set_memory_limit": True}),
], checkpointer=checkpointer)`, [5, 6, 7]),
        ],
      },
    ],
    inspector: {
      heading: 'The standard loop as a compiled graph',
      body: 'create_agent returns a compiled LangGraph graph. Its model node calls the model; if the reply contains tool calls, the tools node runs them and appends the results; then the model node runs again. The run ends when a reply has no tool calls.',
      facts: [['Input and output', 'A dict with a messages list'], ['Customised with', 'Middleware: hooks around the model call and each tool call'], ['Still yours', 'Which tools exist and what they are allowed to do']],
      evidence: ['Nodes in the graph it returns', "['__start__', 'model', 'tools', '__end__']"],
      note: 'Older tutorials use AgentExecutor, or create_react_agent from langgraph.prebuilt. create_agent in the langchain package replaces both. Pausing for approval needs a checkpointer, which is where LangGraph comes in.',
    },
    takeaway: 'create_agent packages the model-and-tools loop as a graph. The graph is still there to inspect and extend.',
    sources: [AGENTS, CREATE_AGENT, HITL],
  },
  {
    id: 'layers', group: 'All the layers', label: 'Five levels', mode: 'scale',
    title: 'The same question at five levels',
    lede: '"Why is payments-api failing?" runs the same way at every level. What changes is how much of it you write.',
    frames: [
      {
        action: 'Raw HTTP', caption: 'You build the JSON, send it, parse the reply, and write the loop.',
        code: [code('Raw HTTP', `
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer $OPENROUTER_API_KEY

{"model": "…",
 "messages": [{"role": "user",
               "content": "Why is payments-api failing?"}],
 "tools": [{"type": "function", "function": {…}}]}`)],
        table: { title: 'What each layer adds', head: ['Layer', 'It gives you', 'You still write'], rows: LAYERS, hot: 0 },
      },
      {
        action: 'SDK', caption: 'The SDK builds the request and gives you objects back. Messages, tool schemas and the loop are still yours.',
        code: [code('OpenAI SDK', `
response = client.chat.completions.create(
    model=MODEL, messages=messages, tools=SCHEMAS)
message = response.choices[0].message
if message.tool_calls:
    …   # parse arguments, run, append, call again`)],
        table: { title: 'What each layer adds', head: ['Layer', 'It gives you', 'You still write'], rows: LAYERS, hot: 1 },
      },
      {
        action: 'LangChain parts', caption: 'Messages, the model and the tools are standard objects. The loop is still a few lines of your Python.',
        code: [code('LangChain parts', `
model_with_tools = model.bind_tools(TOOLS)
for _ in range(MAX_STEPS):
    reply = model_with_tools.invoke(messages)
    messages.append(reply)
    if not reply.tool_calls:
        break
    for call in reply.tool_calls:
        messages.append(TOOLS_BY_NAME[call["name"]].invoke(call))`)],
        table: { title: 'What each layer adds', head: ['Layer', 'It gives you', 'You still write'], rows: LAYERS, hot: 4 },
      },
      {
        action: 'create_agent', caption: 'The loop disappears from your code. Limits and approvals become configuration.',
        code: [code('create_agent', `
agent = create_agent(model, tools=TOOLS,
                     system_prompt=SYSTEM)
result = agent.invoke({"messages": [question]})`)],
        table: { title: 'What each layer adds', head: ['Layer', 'It gives you', 'You still write'], rows: LAYERS, hot: 5 },
      },
      {
        action: 'LangGraph', caption: 'The loop comes back into view as a graph, so you can change its shape, save its state and pause it.',
        code: [code('LangGraph', `
graph = StateGraph(MessagesState)
graph.add_node("model", call_model)
graph.add_node("tools", ToolNode(TOOLS))
graph.add_edge(START, "model")
graph.add_conditional_edges("model", tools_condition)
graph.add_edge("tools", "model")
app = graph.compile()`)],
        table: { title: 'What each layer adds', head: ['Layer', 'It gives you', 'You still write'], rows: LAYERS, hot: 6 },
      },
    ],
    inspector: {
      heading: 'Pick the lowest level that does the job',
      body: 'A single call needs no framework. A fixed pipeline fits a chain. A tool loop you want to ship fits create_agent. Reach for a hand-built graph when you need your own control flow, saved state, or a pause for a person.',
      facts: [['Before shipping', 'Bound the loop, cap tool output, return errors as text'], ['Watch', 'Model calls per question, input tokens per call, tool errors'], ['Never rely on', 'The system prompt as a permission check']],
      evidence: ['What one reply cost', 'reply.usage_metadata["input_tokens"]'],
      note: 'Moving a tool behind an MCP server changes where the function runs, from your process to another one over the network. The loop on this page is unchanged, and so are the four checks.',
    },
    takeaway: 'Each layer formalises plumbing you could write yourself. The model call underneath is the same at every level.',
    sources: [AGENTS, MODELS, MCP],
  },
];

export const langchainLesson: Lesson = {
  id: 'lc',
  kicker: 'AI · AGENT LOOP CONSOLE',
  title: 'LangChain: From One Model Call to an Agent',
  summary: 'Start with one HTTP call to a model. Add the message list, a tool, and a loop, one idea at a time, then see which of those pieces LangChain names for you.',
  reference: 'QUESTION · Why is payments-api failing?',
  format: 'FOUNDATIONAL · DEEP DIVE',
  scenario: 'namespace payments · pod payments-api-7d9f · tools list_pods, get_pod_details',
  scope: 'Wire examples use the Chat Completions format through OpenRouter; other providers and OpenAI\'s Responses API name the fields differently. LangChain names were checked by running them against langchain 1.4.4, langchain-core 1.6.9 and langgraph 1.2.14 on 2026-10-11. Token counts are examples. The pod, namespace and call ids are made up, and the model\'s wording will differ from run to run. Retrieval, structured output, streaming and multi-agent patterns are outside this page.',
  groups: ['One call', 'Tools', 'The loop', 'LangChain', 'All the layers'],
  views,
  sources: SOURCES,
  related: [{ label: 'LangGraph: The Agent Loop as a Graph', href: '/langgraph' }, { label: 'Kubernetes API Server', href: '/kubernetes-api-server' }],
};
