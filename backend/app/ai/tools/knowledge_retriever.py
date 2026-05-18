"""
Knowledge Retrieval Tool - LLM-accessible tool for searching knowledge base.

This tool allows the LLM to search safety tips, FAQs, travel tips, policies, and visa requirements
when the user asks questions about these topics.
"""
import json
import logging
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Tool definition for LLM
KNOWLEDGE_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_knowledge",
        "description": """Search the knowledge base for information about:
- Safety tips and warnings for destinations
- Frequently asked questions (FAQ)
- Travel tips and advice
- Company policies (cancellation, booking, payment)
- Visa requirements for countries

Use this when the user asks about:
- Safety concerns ("có an toàn không", "cẩn thận gì", "cảnh báo")
- Policy questions ("chính sách", "hủy tour", "hoàn tiền")
- Travel advice ("nên làm gì", "mẹo", "tips")
- Visa/passport ("visa", "hộ chiếu", "nhập cảnh")
- FAQ topics ("câu hỏi", "thường gặp")

Args:
    query: The search query in natural language (Vietnamese or English)
    kb_type: Type of knowledge to search (optional):
        - "safety": Safety tips and warnings
        - "faq": Frequently asked questions
        - "travel": Travel tips and advice
        - "policy": Company policies
        - "visa": Visa requirements
        - "all": Search all categories (default)
    destination: Filter by destination name (optional)
    top_k: Number of results to return (default 3)""",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query in natural language (Vietnamese or English)"
                },
                "kb_type": {
                    "type": "string",
                    "enum": ["all", "safety", "faq", "travel", "policy", "visa"],
                    "description": "Type of knowledge to search",
                    "default": "all"
                },
                "destination": {
                    "type": "string",
                    "description": "Filter by destination name (optional, e.g., 'Đà Nẵng', 'Sapa')"
                },
                "top_k": {
                    "type": "integer",
                    "description": "Number of results to return",
                    "default": 3,
                    "minimum": 1,
                    "maximum": 10
                }
            },
            "required": ["query"]
        }
    }
}


@dataclass
class KnowledgeSearchResult:
    """Result from knowledge search."""
    success: bool
    results: dict
    formatted_context: str
    error: Optional[str] = None


class KnowledgeRetriever:
    """
    Tool for retrieving knowledge base information.
    
    This tool is called by the LLM when it needs to answer questions
    about safety, policies, FAQs, travel tips, or visa requirements.
    """

    def __init__(self):
        self._service = None

    @property
    def service(self):
        """Lazy-load the knowledge embedding service."""
        if self._service is None:
            from app.services.knowledge_embedding_service import get_knowledge_embedding_service
            self._service = get_knowledge_embedding_service()
        return self._service

    async def search(
        self,
        query: str,
        kb_type: str = "all",
        destination: Optional[str] = None,
        top_k: int = 3,
    ) -> KnowledgeSearchResult:
        """
        Search the knowledge base.
        
        Args:
            query: Natural language query
            kb_type: Type of knowledge to search
            destination: Optional destination filter
            top_k: Number of results
            
        Returns:
            KnowledgeSearchResult with results and formatted context
        """
        try:
            # Perform semantic search
            results = await self.service.search_knowledge(
                query=query,
                kb_type=kb_type,
                destination=destination,
                top_k=top_k,
            )
            
            # Format results as context for LLM
            context = self._format_context(query, results)
            
            return KnowledgeSearchResult(
                success=True,
                results=results,
                formatted_context=context
            )
            
        except Exception as e:
            logger.error(f"Knowledge search failed: {e}")
            return KnowledgeSearchResult(
                success=False,
                results={},
                formatted_context="",
                error=str(e)
            )

    def _format_context(self, query: str, results: dict) -> str:
        """
        Format search results as context string for LLM.
        
        The LLM will use this context to generate accurate responses.
        """
        if not results:
            return "Không tìm thấy thông tin liên quan."

        context_parts = []
        context_parts.append(f"Tìm kiếm: {query}\n")
        context_parts.append("=" * 50)
        
        # Helper to extract content after label, fallback to full doc
        def extract_content(doc: str, label: str, max_len: int = 200) -> str:
            if label in doc:
                parts = doc.split(label, 1)
                if len(parts) > 1:
                    return parts[1].strip()[:max_len]
            return doc.strip()[:max_len]
        
        # Destinations
        if "destinations" in results and results["destinations"]:
            context_parts.append("\n🏝️ ĐIỂM ĐẾN:")
            for item in results["destinations"][:3]:
                metadata = item.get("metadata", {})
                doc = item.get("document", "")
                name = metadata.get("name", "")
                region = metadata.get("region", "")
                content = extract_content(doc, "Mùa tốt:", 200) or extract_content(doc, "Thời gian:", 200) or doc[:200]
                context_parts.append(f"\n📍 {name}")
                if region:
                    context_parts.append(f"   🗺️ {region}")
                context_parts.append(f"   {content}")
        
        # Safety tips
        if "safety_tips" in results and results["safety_tips"]:
            context_parts.append("\n🛡️ MẸO AN TOÀN:")
            for item in results["safety_tips"][:3]:
                metadata = item.get("metadata", {})
                doc = item.get("document", "")
                severity = metadata.get("severity", "info")
                severity_emoji = {"critical": "🔴", "warning": "🟡", "info": "🔵"}.get(severity, "🔵")
                title = metadata.get("title", "")
                dest = metadata.get("destination", "")
                content = extract_content(doc, "Nội dung:", 300)
                context_parts.append(f"\n{severity_emoji} {title}")
                if dest:
                    context_parts.append(f"   📍 {dest}")
                context_parts.append(f"   {content}")
        
        # FAQs
        if "faqs" in results and results["faqs"]:
            context_parts.append("\n\n❓ CÂU HỎI THƯỜNG GẶP:")
            for item in results["faqs"][:3]:
                metadata = item.get("metadata", {})
                doc = item.get("document", "")
                question = metadata.get("question", "")
                answer = extract_content(doc, "Trả lời:", 300)
                context_parts.append(f"\n📌 Câu hỏi: {question}")
                context_parts.append(f"   Trả lời: {answer}")
        
        # Travel tips
        if "travel_tips" in results and results["travel_tips"]:
            context_parts.append("\n\n💡 MẸO DU LỊCH:")
            for item in results["travel_tips"][:3]:
                metadata = item.get("metadata", {})
                doc = item.get("document", "")
                title = metadata.get("title", "")
                dest = metadata.get("destination", "Tổng quát")
                content = extract_content(doc, "Nội dung:", 200)
                context_parts.append(f"\n✈️ {title}")
                context_parts.append(f"   📍 {dest}")
                context_parts.append(f"   {content}")
        
        # Policies
        if "policies" in results and results["policies"]:
            context_parts.append("\n\n📋 CHÍNH SÁCH:")
            for item in results["policies"][:3]:
                metadata = item.get("metadata", {})
                doc = item.get("document", "")
                name = metadata.get("name", "")
                content = extract_content(doc, "Nội dung:", 300)
                context_parts.append(f"\n📌 {name}")
                context_parts.append(f"   {content}")
        
        # Visa
        if "visa" in results and results["visa"]:
            context_parts.append("\n\n🛂 VISA:")
            for item in results["visa"][:3]:
                metadata = item.get("metadata", {})
                country = metadata.get("countryName", "")
                visa_required = "Cần visa" if metadata.get("visaRequired") == "True" else "Miễn visa"
                visa_type = metadata.get("visaType", "")
                context_parts.append(f"\n🌍 {country}")
                context_parts.append(f"   Loại: {visa_required}")
                if visa_type:
                    context_parts.append(f"   Chi tiết: {visa_type}")
        
        return "\n".join(context_parts)

    def _format_for_llm(self, results: dict) -> str:
        """Format results as a clean JSON string for LLM."""
        return json.dumps(results, ensure_ascii=False, indent=2)


# Singleton instance
_knowledge_retriever: Optional[KnowledgeRetriever] = None


def get_knowledge_retriever() -> KnowledgeRetriever:
    """Get or create the singleton KnowledgeRetriever."""
    global _knowledge_retriever
    if _knowledge_retriever is None:
        _knowledge_retriever = KnowledgeRetriever()
    return _knowledge_retriever


# Async function for tool execution
async def execute_knowledge_search(
    query: str,
    kb_type: str = "all",
    destination: Optional[str] = None,
    top_k: int = 3,
) -> str:
    """
    Execute knowledge search and return formatted context.
    
    This function is called by the LLM tool executor.
    """
    retriever = get_knowledge_retriever()
    result = await retriever.search(
        query=query,
        kb_type=kb_type,
        destination=destination,
        top_k=top_k,
    )
    
    if result.success:
        return result.formatted_context
    else:
        return f"Không thể tìm kiếm: {result.error}"
