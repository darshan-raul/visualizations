"""Runs the LangChain and LangGraph behaviour that /langchain and /langgraph describe, with a scripted
stand-in for the model, so no API key or cluster is needed.

    uv run --with langchain --with langgraph scripts/verify-agent-lessons.py
"""
import operator
from importlib.metadata import version
from typing import Annotated, TypedDict

from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware, ModelCallLimitMiddleware
from langchain.tools import tool
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.utils.function_calling import convert_to_openai_tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.errors import GraphRecursionError
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.types import Command, interrupt

RAN = []


@tool
def list_pods(namespace: str) -> str:
    """List the pods in one namespace with phase, readiness and restart count."""
    RAN.append("list_pods")
    return "payments-api-7d9f  phase=Running  ready=0/1  restarts=8"


@tool
def get_pod_details(namespace: str, pod_name: str) -> str:
    """Show one pod's container state, last exit code and reason."""
    RAN.append("get_pod_details")
    return "state=waiting reason=CrashLoopBackOff restarts=8 last_exit_code=137 last_reason=OOMKilled"


@tool
def set_memory_limit(deployment: str, limit: str) -> str:
    """Set the memory limit on a deployment's container."""
    RAN.append("set_memory_limit")
    return f"deployment/{deployment} memory limit set to {limit}"


TOOLS = [list_pods, get_pod_details]


class Scripted(GenericFakeChatModel):
    """Replies with a fixed sequence of messages, the way the page's example run does."""

    def bind_tools(self, tools, **kwargs):
        return self


def call(name, args, call_id):
    return AIMessage(content="", tool_calls=[{"name": name, "args": args, "id": call_id}])


def investigation():
    return Scripted(messages=iter([
        call("list_pods", {"namespace": "payments"}, "call_1"),
        call("get_pod_details", {"namespace": "payments", "pod_name": "payments-api-7d9f"}, "call_2"),
        AIMessage(content="payments-api-7d9f was OOMKilled."),
    ]))


def kinds(messages):
    return [type(message).__name__ for message in messages]


QUESTION = {"messages": [{"role": "user", "content": "Why is payments-api failing?"}]}
SIX = ["HumanMessage", "AIMessage", "ToolMessage", "AIMessage", "ToolMessage", "AIMessage"]

# /langchain: @tool builds the schema from the name, docstring and type hints.
schema = convert_to_openai_tool(get_pod_details)["function"]
assert schema["name"] == "get_pod_details"
assert schema["description"] == "Show one pod's container state, last exit code and reason."
assert schema["parameters"]["required"] == ["namespace", "pod_name"]
assert schema["parameters"]["properties"]["pod_name"] == {"type": "string"}

# tool.invoke(call) returns a ToolMessage with the matching id, and validates arguments first.
result = list_pods.invoke({"name": "list_pods", "args": {"namespace": "payments"}, "id": "call_1", "type": "tool_call"})
assert type(result).__name__ == "ToolMessage" and result.tool_call_id == "call_1"
try:
    get_pod_details.invoke({"name": "get_pod_details", "args": {"namespace": "payments"}, "id": "x", "type": "tool_call"})
    raise AssertionError("a missing argument should not reach the function")
except Exception as error:
    assert type(error).__name__ == "ValidationError"

# prompt | model | parser is a Runnable.
chain = ChatPromptTemplate.from_messages([("human", "{question}")]) | Scripted(messages=iter([AIMessage(content="A Pod is one or more containers.")])) | StrOutputParser()
assert chain.invoke({"question": "What is a Pod?"}) == "A Pod is one or more containers."

# create_agent returns a compiled graph with a model node and a tools node.
agent = create_agent(investigation(), tools=TOOLS, system_prompt="You are a read-only Kubernetes assistant.")
assert type(agent).__name__ == "CompiledStateGraph"
assert list(agent.get_graph().nodes) == ["__start__", "model", "tools", "__end__"]
assert kinds(agent.invoke(QUESTION)["messages"]) == SIX

# /langgraph: a node returns an update, which is merged.
class Greeting(TypedDict):
    name: str
    greeting: str


graph = StateGraph(Greeting)
graph.add_node("greet", lambda state: {"greeting": f"Hello {state['name']}"})
graph.add_edge(START, "greet")
graph.add_edge("greet", END)
assert graph.compile().invoke({"name": "Darshan"}) == {"name": "Darshan", "greeting": "Hello Darshan"}


class K8sAgentState(TypedDict):
    namespace: str
    pod_name: str
    failure_type: str | None
    evidence: Annotated[list[str], operator.add]
    diagnosis: str | None


# Replace by default; add with a reducer. Routing is a plain function.
def route_problem(state) -> str:
    kind = state["failure_type"]
    if kind == "Pending":
        return "inspect_scheduler"
    if kind == "CrashLoopBackOff":
        return "inspect_logs"
    if kind == "ImagePullBackOff":
        return "inspect_image"
    return "general_checks"


def flow(found):
    graph = StateGraph(K8sAgentState)
    graph.add_node("inspect_pod", lambda state: {"failure_type": found, "evidence": ["restarts=8"]})
    for name in ["inspect_scheduler", "inspect_logs", "inspect_image", "general_checks"]:
        graph.add_node(name, lambda state, name=name: {"evidence": [f"from {name}"]})
        graph.add_edge(name, "diagnose")
    graph.add_node("diagnose", lambda state: {"diagnosis": "done"})
    graph.add_edge(START, "inspect_pod")
    graph.add_conditional_edges("inspect_pod", route_problem)
    graph.add_edge("diagnose", END)
    return graph.compile().invoke({"namespace": "payments", "pod_name": "payments-api-7d9f", "evidence": []})


for found, branch in [("Pending", "inspect_scheduler"), ("CrashLoopBackOff", "inspect_logs"), ("ImagePullBackOff", "inspect_image"), ("CreateContainerConfigError", "general_checks")]:
    assert flow(found)["evidence"] == ["restarts=8", f"from {branch}"], found
    assert route_problem({"failure_type": found}) == branch


# The agent loop as a graph, with checkpoints.
def agent_graph(model_node, tools_node=None, checkpointer=None):
    graph = StateGraph(MessagesState)
    graph.add_node("model", model_node)
    graph.add_node("tools", tools_node or ToolNode(TOOLS))
    graph.add_edge(START, "model")
    graph.add_conditional_edges("model", tools_condition)
    graph.add_edge("tools", "model")
    return graph.compile(checkpointer=checkpointer)


model = investigation()
app = agent_graph(lambda state: {"messages": [model.invoke(state["messages"])]}, checkpointer=InMemorySaver())
config = {"configurable": {"thread_id": "session-123"}}
assert kinds(app.invoke(QUESTION, config)["messages"]) == SIX
assert tools_condition({"messages": [AIMessage(content="done")]}) == "__end__"
assert tools_condition({"messages": [call("list_pods", {}, "c")]}) == "tools"
history = list(reversed(list(app.get_state_history(config))))
assert [(snapshot.next, len(snapshot.values.get("messages", []))) for snapshot in history] == [
    (("__start__",), 0), (("model",), 1), (("tools",), 2), (("model",), 3), (("tools",), 4), (("model",), 5), ((), 6)]
assert app.get_state(config).next == ()

# A cycle with no exit is stopped by the runtime.
endless = agent_graph(lambda state: {"messages": [call("list_pods", {"namespace": "payments"}, "c")]})
try:
    endless.invoke(QUESTION, {"recursion_limit": 12})
    raise AssertionError("an endless graph should hit the recursion limit")
except GraphRecursionError as error:
    assert "Recursion limit of 12 reached" in str(error)

# Kill the run during the second tool call, then resume: only the tools node repeats.
model, ran, crash = investigation(), [], {"armed": True}
tool_node = ToolNode(TOOLS)


def model_node(state):
    ran.append("model")
    return {"messages": [model.invoke(state["messages"])]}


def tools_node(state):
    if crash["armed"] and state["messages"][-1].tool_calls[0]["name"] == "get_pod_details":
        raise RuntimeError("process died")
    ran.append("tools")
    return tool_node.invoke(state)


app = agent_graph(model_node, tools_node, InMemorySaver())
config = {"configurable": {"thread_id": "session-456"}}
try:
    app.invoke(QUESTION, config)
except RuntimeError:
    pass
snapshot = app.get_state(config)
assert snapshot.next == ("tools",) and len(snapshot.values["messages"]) == 4
crash["armed"] = False
ran.clear()
assert kinds(app.invoke(None, config)["messages"]) == SIX
assert ran == ["tools", "model"]

# interrupt() parks the run; resuming re-runs the node from its first line.
starts = []


class Fix(TypedDict):
    proposed_action: str
    approved: bool
    applied: bool


def approval(state):
    starts.append("approval")
    answer = interrupt({"question": "Apply this change?", "action": state["proposed_action"]})
    return {"approved": answer}


def after_approval(state) -> str:
    return "apply_fix" if state["approved"] else END


def fix_graph():
    graph = StateGraph(Fix)
    graph.add_node("approval", approval)
    graph.add_node("apply_fix", lambda state: {"applied": True})
    graph.add_edge(START, "approval")
    graph.add_conditional_edges("approval", after_approval)
    graph.add_edge("apply_fix", END)
    return graph.compile(checkpointer=InMemorySaver())


for answer, applied in [(True, True), (False, None)]:
    app, config = fix_graph(), {"configurable": {"thread_id": f"fix-{answer}"}}
    starts.clear()
    paused = app.invoke({"proposed_action": "set_memory_limit(payments-api, 512Mi)"}, config)
    assert paused["__interrupt__"][0].value["question"] == "Apply this change?"
    assert app.get_state(config).next == ("approval",)
    done = app.invoke(Command(resume=answer), config)
    assert done["approved"] is answer and done.get("applied") == applied
    assert starts == ["approval", "approval"]

# create_agent: the approval middleware stops a write tool until a person decides.
RAN.clear()
writer = Scripted(messages=iter([call("set_memory_limit", {"deployment": "payments-api", "limit": "512Mi"}, "call_9"), AIMessage(content="Left unchanged.")]))
agent = create_agent(writer, tools=[list_pods, set_memory_limit], checkpointer=InMemorySaver(), middleware=[
    ModelCallLimitMiddleware(run_limit=6),
    HumanInTheLoopMiddleware(interrupt_on={"set_memory_limit": True}),
])
config = {"configurable": {"thread_id": "session-789"}}
paused = agent.invoke(QUESTION, config)
assert paused["__interrupt__"][0].value["action_requests"][0]["name"] == "set_memory_limit" and RAN == []
done = agent.invoke(Command(resume={"decisions": [{"type": "reject", "message": "Not during the freeze."}]}), config)
assert RAN == [] and kinds(done["messages"])[-2:] == ["ToolMessage", "AIMessage"]

# The MCP adapter the service view names ships in this release (importing it needs the fastmcp extra).
import pathlib  # noqa: E402

import langchain  # noqa: E402

assert (pathlib.Path(langchain.__file__).parent / "mcp" / "adapter.py").exists()

print(f"Checked /langchain and /langgraph against langchain {version('langchain')}, langchain-core {version('langchain-core')}, langgraph {version('langgraph')}.")
