"""AI Tools module for TravelGPT."""

# Import knowledge retriever directly (it's in app/ai/tools/knowledge_retriever.py)
from app.ai.tools.knowledge_retriever import (
    KnowledgeRetriever,
    KnowledgeSearchResult,
    get_knowledge_retriever,
    execute_knowledge_search,
    KNOWLEDGE_SEARCH_TOOL,
)

# Import TOOL_DEFINITIONS from llm_tools.py
from app.ai.llm_tools import TOOL_DEFINITIONS

__all__ = [
    "KnowledgeRetriever",
    "KnowledgeSearchResult",
    "get_knowledge_retriever",
    "execute_knowledge_search",
    "KNOWLEDGE_SEARCH_TOOL",
    "TOOL_DEFINITIONS",
]
