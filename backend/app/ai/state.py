"""
Agent State Schema - LangGraph state management
"""
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from datetime import datetime

try:
    from langgraph.graph import add_messages
except ImportError:
    def add_messages(*args, **kwargs):
        return list(args[0]) + list(args[1]) if len(args) > 1 else []


class AgentState(TypedDict):
    """Main state schema for LangGraph agent"""
    messages: Annotated[List[Dict[str, str]], add_messages]
    intent: str
    entities: Dict[str, Any]
    memory_context: str
    user_id: str
    session_id: str
    booking_flow_step: Optional[str]
    is_booking_active: bool
    booking_data: Dict[str, Any]
    cancellation_active: bool
    cancellation_step: Optional[str]
    response: str
    tool_calls: List[Dict[str, Any]]
    suggestions: List[str]


def create_initial_state(
    user_id: str,
    session_id: str,
    message: str
) -> AgentState:
    """Create initial state for a new conversation turn"""
    return AgentState(
        messages=[{"role": "user", "content": message}],
        intent="",
        entities={},
        memory_context="",
        user_id=user_id,
        session_id=session_id,
        booking_flow_step=None,
        is_booking_active=False,
        booking_data={},
        cancellation_active=False,
        cancellation_step=None,
        response="",
        tool_calls=[],
        suggestions=[]
    )


def add_assistant_message(state: AgentState, message: str) -> AgentState:
    """Add assistant message to state"""
    state["messages"].append({"role": "assistant", "content": message})
    state["response"] = message
    return state


def add_tool_result(state: AgentState, tool_name: str, result: Any) -> AgentState:
    """Add tool call result to state"""
    state["tool_calls"].append({
        "tool": tool_name,
        "result": result,
        "timestamp": datetime.now().isoformat()
    })
    return state
