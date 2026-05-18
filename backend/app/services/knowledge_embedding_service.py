"""
Knowledge Embedding Service - Semantic Search for Knowledge Base.

Uses ChromaDB for vector storage and sentence-transformers for embeddings.
Supports: destinations, safety tips, FAQs, travel tips, policies, visa requirements.
"""
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

# Path for persistent ChromaDB storage
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"
EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)

# Collection names for knowledge base
COLLECTION_DESTINATIONS = "knowledge_destinations"
COLLECTION_SAFETY_TIPS = "knowledge_safety_tips"
COLLECTION_FAQS = "knowledge_faqs"
COLLECTION_TRAVEL_TIPS = "knowledge_travel_tips"
COLLECTION_POLICIES = "knowledge_policies"
COLLECTION_VISA = "knowledge_visa"

# Singleton instance
_knowledge_embedding_service: Optional["KnowledgeEmbeddingService"] = None


class KnowledgeEmbeddingService:
    """
    Manages ChromaDB vector store for knowledge base data.
    
    Collections:
    - knowledge_destinations: Travel destinations info
    - knowledge_safety_tips: Safety tips per destination
    - knowledge_faqs: Frequently asked questions
    - knowledge_travel_tips: General travel tips
    - knowledge_policies: Company policies
    - knowledge_visa: Visa requirements
    """

    def __init__(self):
        self._client = None
        self._collections: Dict[str, Any] = {}
        self._embedder = None

    @property
    def client(self):
        """Lazy-init ChromaDB client."""
        if self._client is None:
            import chromadb
            self._client = chromadb.PersistentClient(path=str(EMBEDDINGS_DIR))
        return self._client

    @property
    def embedder(self):
        """Lazy-load the embedding model."""
        if self._embedder is None:
            try:
                # Try to use existing embedding service
                from app.services.embedding_service import get_embedding_service
                svc = get_embedding_service()
                self._embedder = svc.embedder
                logger.info("Using embedding model from EmbeddingService")
            except Exception as e:
                logger.error(f"Failed to get embedding model: {e}")
                raise
        return self._embedder

    def _get_collection(self, name: str):
        """Get or create a collection."""
        if name not in self._collections:
            self._collections[name] = self.client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )
        return self._collections[name]

    # ============================================
    # DESTINATIONS
    # ============================================

    async def index_destination(self, destination: Dict) -> bool:
        """Index a destination."""
        try:
            text = self._destination_to_text(destination)
            embedding = self.embedder.embed_query(text)
            
            collection = self._get_collection(COLLECTION_DESTINATIONS)
            collection.upsert(
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "id": destination.get("id", ""),
                    "name": destination.get("name", ""),
                    "slug": destination.get("slug", ""),
                    "region": destination.get("region", ""),
                }],
                ids=[destination.get("id", destination.get("name", ""))]
            )
            logger.debug(f"Indexed destination: {destination.get('name')}")
            return True
        except Exception as e:
            logger.error(f"Failed to index destination: {e}")
            return False

    def _destination_to_text(self, dest: Dict) -> str:
        """Convert destination to searchable text."""
        parts = [
            dest.get("name", ""),
            dest.get("description", ""),
            dest.get("region", ""),
            dest.get("bestTime", ""),
            " ".join(dest.get("highlights", [])) if isinstance(dest.get("highlights"), list) else "",
        ]
        return " | ".join(p for p in parts if p)

    # ============================================
    # SAFETY TIPS
    # ============================================

    async def index_safety_tip(self, tip: Dict) -> bool:
        """Index a safety tip."""
        try:
            text = self._safety_tip_to_text(tip)
            embedding = self.embedder.embed_query(text)
            
            collection = self._get_collection(COLLECTION_SAFETY_TIPS)
            collection.upsert(
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "id": tip.get("id", ""),
                    "destination": tip.get("destination", ""),
                    "category": tip.get("category", ""),
                    "title": tip.get("title", ""),
                    "severity": tip.get("severity", "info"),
                }],
                ids=[tip.get("id", "")]
            )
            logger.debug(f"Indexed safety tip: {tip.get('title')}")
            return True
        except Exception as e:
            logger.error(f"Failed to index safety tip: {e}")
            return False

    async def index_safety_tips(self, tips: List[Dict]) -> int:
        """Index multiple safety tips."""
        if not tips:
            return 0
        
        texts, embeddings, metadatas, ids = [], [], [], []
        
        for tip in tips:
            try:
                text = self._safety_tip_to_text(tip)
                emb = self.embedder.embed_query(text)
                texts.append(text)
                embeddings.append(emb)
                metadatas.append({
                    "id": tip.get("id", ""),
                    "destination": tip.get("destination", ""),
                    "category": tip.get("category", ""),
                    "title": tip.get("title", ""),
                    "severity": tip.get("severity", "info"),
                })
                ids.append(tip.get("id", ""))
            except Exception as e:
                logger.warning(f"Skipping safety tip: {e}")
                continue

        if not ids:
            return 0

        collection = self._get_collection(COLLECTION_SAFETY_TIPS)
        collection.upsert(embeddings=embeddings, documents=texts, metadatas=metadatas, ids=ids)
        return len(ids)

    def _safety_tip_to_text(self, tip: Dict) -> str:
        """Convert safety tip to searchable text."""
        parts = [
            f"Điểm đến: {tip.get('destination', '')}",
            f"Loại: {tip.get('category', '')}",
            f"Tiêu đề: {tip.get('title', '')}",
            f"Nội dung: {tip.get('content', '')}",
        ]
        return " | ".join(p for p in parts if p)

    # ============================================
    # FAQs
    # ============================================

    async def index_faq(self, faq: Dict) -> bool:
        """Index a FAQ."""
        try:
            text = self._faq_to_text(faq)
            embedding = self.embedder.embed_query(text)
            
            collection = self._get_collection(COLLECTION_FAQS)
            collection.upsert(
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "id": faq.get("id", ""),
                    "code": faq.get("code", ""),
                    "category": faq.get("category", ""),
                    "question": faq.get("question", ""),
                }],
                ids=[faq.get("id") or faq.get("code") or ""]
            )
            logger.debug(f"Indexed FAQ: {faq.get('question', '')[:50]}")
            return True
        except Exception as e:
            logger.error(f"Failed to index FAQ: {e}")
            return False

    async def index_faqs(self, faqs: List[Dict]) -> int:
        """Index multiple FAQs."""
        if not faqs:
            return 0

        texts, embeddings, metadatas, ids = [], [], [], []
        
        for i, faq in enumerate(faqs):
            try:
                text = self._faq_to_text(faq)
                emb = self.embedder.embed_query(text)
                texts.append(text)
                embeddings.append(emb)
                metadatas.append({
                    "id": faq.get("id", f"faq_{i}"),
                    "code": faq.get("code", ""),
                    "category": faq.get("category", ""),
                    "question": faq.get("question", ""),
                })
                faq_id = faq.get("id") or faq.get("code") or f"faq_{i}"
                ids.append(str(faq_id))
            except Exception as e:
                logger.warning(f"Skipping FAQ: {e}")
                continue

        if not ids:
            return 0

        collection = self._get_collection(COLLECTION_FAQS)
        collection.upsert(embeddings=embeddings, documents=texts, metadatas=metadatas, ids=ids)
        return len(ids)

    def _faq_to_text(self, faq: Dict) -> str:
        """Convert FAQ to searchable text."""
        parts = [
            f"Câu hỏi: {faq.get('question', '')}",
            f"Trả lời: {faq.get('answer', '')}",
            f"Danh mục: {faq.get('category', '')}",
            " ".join(faq.get("tags", [])) if isinstance(faq.get("tags"), list) else "",
        ]
        return " | ".join(p for p in parts if p)

    # ============================================
    # TRAVEL TIPS
    # ============================================

    async def index_travel_tip(self, tip: Dict) -> bool:
        """Index a travel tip."""
        try:
            text = self._travel_tip_to_text(tip)
            embedding = self.embedder.embed_query(text)
            
            collection = self._get_collection(COLLECTION_TRAVEL_TIPS)
            collection.upsert(
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "id": tip.get("id", ""),
                    "destination": tip.get("destination", ""),
                    "category": tip.get("category", ""),
                    "title": tip.get("title", ""),
                }],
                ids=[tip.get("id", "")]
            )
            logger.debug(f"Indexed travel tip: {tip.get('title')}")
            return True
        except Exception as e:
            logger.error(f"Failed to index travel tip: {e}")
            return False

    async def index_travel_tips(self, tips: List[Dict]) -> int:
        """Index multiple travel tips."""
        if not tips:
            return 0

        texts, embeddings, metadatas, ids = [], [], [], []
        
        for i, tip in enumerate(tips):
            try:
                text = self._travel_tip_to_text(tip)
                emb = self.embedder.embed_query(text)
                texts.append(text)
                embeddings.append(emb)
                metadatas.append({
                    "id": tip.get("id", ""),
                    "destination": tip.get("destination", ""),
                    "category": tip.get("category", ""),
                    "title": tip.get("title", ""),
                })
                tip_id = tip.get("id") or f"tip_{i}"
                ids.append(str(tip_id))
            except Exception as e:
                logger.warning(f"Skipping travel tip: {e}")
                continue

        if not ids:
            return 0

        collection = self._get_collection(COLLECTION_TRAVEL_TIPS)
        collection.upsert(embeddings=embeddings, documents=texts, metadatas=metadatas, ids=ids)
        return len(ids)

    def _travel_tip_to_text(self, tip: Dict) -> str:
        """Convert travel tip to searchable text."""
        parts = [
            f"Tiêu đề: {tip.get('title', '')}",
            f"Nội dung: {tip.get('content', '')}",
            f"Điểm đến: {tip.get('destination', 'Tổng quát')}",
            f"Danh mục: {tip.get('category', '')}",
        ]
        return " | ".join(p for p in parts if p)

    # ============================================
    # POLICIES
    # ============================================

    async def index_policy(self, policy: Dict) -> bool:
        """Index a policy."""
        try:
            text = self._policy_to_text(policy)
            embedding = self.embedder.embed_query(text)
            
            collection = self._get_collection(COLLECTION_POLICIES)
            collection.upsert(
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "code": policy.get("code", ""),
                    "name": policy.get("name", ""),
                    "title": policy.get("title", ""),
                }],
                ids=[policy.get("code", "")]
            )
            logger.debug(f"Indexed policy: {policy.get('code')}")
            return True
        except Exception as e:
            logger.error(f"Failed to index policy: {e}")
            return False

    async def index_policies(self, policies: List[Dict]) -> int:
        """Index multiple policies."""
        if not policies:
            return 0

        texts, embeddings, metadatas, ids = [], [], [], []
        
        for policy in policies:
            try:
                text = self._policy_to_text(policy)
                emb = self.embedder.embed_query(text)
                texts.append(text)
                embeddings.append(emb)
                metadatas.append({
                    "code": policy.get("code", ""),
                    "name": policy.get("name", ""),
                    "title": policy.get("title", ""),
                })
                ids.append(policy.get("code", ""))
            except Exception as e:
                logger.warning(f"Skipping policy: {e}")
                continue

        if not ids:
            return 0

        collection = self._get_collection(COLLECTION_POLICIES)
        collection.upsert(embeddings=embeddings, documents=texts, metadatas=metadatas, ids=ids)
        return len(ids)

    def _policy_to_text(self, policy: Dict) -> str:
        """Convert policy to searchable text."""
        parts = [
            f"Mã: {policy.get('code', '')}",
            f"Tên: {policy.get('name', '')}",
            f"Tiêu đề: {policy.get('title', '')}",
            f"Nội dung: {policy.get('content', '')}",
        ]
        return " | ".join(p for p in parts if p)

    # ============================================
    # VISA REQUIREMENTS
    # ============================================

    async def index_visa_requirement(self, visa: Dict) -> bool:
        """Index a visa requirement."""
        try:
            text = self._visa_to_text(visa)
            embedding = self.embedder.embed_query(text)
            
            collection = self._get_collection(COLLECTION_VISA)
            collection.upsert(
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "countryCode": visa.get("countryCode", ""),
                    "countryName": visa.get("countryName", ""),
                    "visaRequired": str(visa.get("visaRequired", True)),
                    "visaType": visa.get("visaType", ""),
                }],
                ids=[visa.get("countryCode", "")]
            )
            logger.debug(f"Indexed visa: {visa.get('countryName')}")
            return True
        except Exception as e:
            logger.error(f"Failed to index visa: {e}")
            return False

    async def index_visa_requirements(self, visas: List[Dict]) -> int:
        """Index multiple visa requirements."""
        if not visas:
            return 0

        texts, embeddings, metadatas, ids = [], [], [], []
        
        for i, visa in enumerate(visas):
            try:
                text = self._visa_to_text(visa)
                emb = self.embedder.embed_query(text)
                texts.append(text)
                embeddings.append(emb)
                metadatas.append({
                    "countryCode": visa.get("countryCode", ""),
                    "countryName": visa.get("countryName", ""),
                    "visaRequired": str(visa.get("visaRequired", True)),
                    "visaType": visa.get("visaType", ""),
                })
                # Use index to avoid duplicates
                visa_id = f"visa_{i}_{visa.get('countryCode', 'unknown')}"
                ids.append(visa_id)
            except Exception as e:
                logger.warning(f"Skipping visa: {e}")
                continue

        if not ids:
            return 0

        collection = self._get_collection(COLLECTION_VISA)
        collection.upsert(embeddings=embeddings, documents=texts, metadatas=metadatas, ids=ids)
        return len(ids)

    def _visa_to_text(self, visa: Dict) -> str:
        """Convert visa requirement to searchable text."""
        parts = [
            f"Quốc gia: {visa.get('countryName', '')}",
            f"Mã: {visa.get('countryCode', '')}",
            f"Loại visa: {visa.get('visaType', 'Cần visa' if visa.get('visaRequired') else 'Miễn visa')}",
            f"Thời hạn: {visa.get('maxStay', '')}",
            f"Ghi chú: {visa.get('notes', '')}",
        ]
        return " | ".join(p for p in parts if p)

    # ============================================
    # SEMANTIC SEARCH
    # ============================================

    async def search_knowledge(
        self,
        query: str,
        kb_type: str = "all",
        destination: Optional[str] = None,
        top_k: int = 5,
    ) -> Dict[str, List[Dict]]:
        """
        Search across knowledge base.
        
        Args:
            query: Natural language query
            kb_type: Type of knowledge - 'all', 'safety', 'faq', 'travel', 'policy', 'visa'
            destination: Optional destination filter
            top_k: Number of results per category
            
        Returns:
            Dict with categorized results
        """
        try:
            query_embedding = self.embedder.embed_query(query)
            results = {}
            
            # Determine which collections to search
            collections_to_search = []
            if kb_type == "all":
                collections_to_search = [
                    COLLECTION_DESTINATIONS,
                    COLLECTION_SAFETY_TIPS,
                    COLLECTION_FAQS,
                    COLLECTION_TRAVEL_TIPS,
                    COLLECTION_POLICIES,
                    COLLECTION_VISA,
                ]
            elif kb_type == "destination":
                collections_to_search = [COLLECTION_DESTINATIONS]
            elif kb_type == "safety":
                collections_to_search = [COLLECTION_SAFETY_TIPS]
            elif kb_type == "faq":
                collections_to_search = [COLLECTION_FAQS]
            elif kb_type == "travel":
                collections_to_search = [COLLECTION_TRAVEL_TIPS]
            elif kb_type == "policy":
                collections_to_search = [COLLECTION_POLICIES]
            elif kb_type == "visa":
                collections_to_search = [COLLECTION_VISA]
            
            for collection_name in collections_to_search:
                collection = self._get_collection(collection_name)
                
                # Build where filter
                where_filter = None
                if destination and collection_name == COLLECTION_SAFETY_TIPS:
                    where_filter = {"destination": {"$eq": destination}}
                
                search_results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    where=where_filter,
                    include=["metadatas", "distances", "documents"]
                )
                
                if search_results and search_results.get("ids") and search_results["ids"][0]:
                    category = self._get_category_from_collection(collection_name)
                    results[category] = self._format_search_results(search_results)
            
            return results
            
        except Exception as e:
            logger.error(f"Knowledge search failed: {e}")
            return {}

    def _get_category_from_collection(self, collection_name: str) -> str:
        """Map collection name to category."""
        mapping = {
            COLLECTION_DESTINATIONS: "destinations",
            COLLECTION_SAFETY_TIPS: "safety_tips",
            COLLECTION_FAQS: "faqs",
            COLLECTION_TRAVEL_TIPS: "travel_tips",
            COLLECTION_POLICIES: "policies",
            COLLECTION_VISA: "visa",
        }
        return mapping.get(collection_name, collection_name)

    def _format_search_results(self, raw_results: Dict) -> List[Dict]:
        """Format ChromaDB results."""
        formatted = []
        for i, (doc_id, distance, metadata, document) in enumerate(zip(
            raw_results["ids"][0],
            raw_results["distances"][0],
            raw_results["metadatas"][0],
            raw_results["documents"][0]
        )):
            formatted.append({
                "id": doc_id,
                "distance": distance,
                "metadata": metadata,
                "document": document,
                "relevance_score": 1 - distance,  # Convert distance to similarity
            })
        return formatted

    # ============================================
    # REINDEX ALL
    # ============================================

    async def reindex_all(self, db) -> Dict[str, int]:
        """
        Reindex all knowledge base from database.
        
        Returns:
            Dict with counts per category
        """
        from app.services.knowledge_service import KnowledgeService
        
        service = KnowledgeService(db)
        counts = {}
        
        # Reindex safety tips
        try:
            tips = await service.get_safety_tips()
            count = await self.index_safety_tips(tips)
            counts["safety_tips"] = count
            logger.info(f"Indexed {count} safety tips")
        except Exception as e:
            logger.error(f"Failed to index safety tips: {e}")
            counts["safety_tips"] = 0
        
        # Reindex FAQs
        try:
            faqs = await service.get_faqs()
            count = await self.index_faqs(faqs)
            counts["faqs"] = count
            logger.info(f"Indexed {count} FAQs")
        except Exception as e:
            logger.error(f"Failed to index FAQs: {e}")
            counts["faqs"] = 0
        
        # Reindex travel tips
        try:
            tips = await service.get_travel_tips()
            count = await self.index_travel_tips(tips)
            counts["travel_tips"] = count
            logger.info(f"Indexed {count} travel tips")
        except Exception as e:
            logger.error(f"Failed to index travel tips: {e}")
            counts["travel_tips"] = 0
        
        # Reindex policies
        try:
            policies = await service.get_policies()
            count = await self.index_policies(policies)
            counts["policies"] = count
            logger.info(f"Indexed {count} policies")
        except Exception as e:
            logger.error(f"Failed to index policies: {e}")
            counts["policies"] = 0
        
        # Reindex visa requirements
        try:
            visas = await service.get_visa_requirements()
            count = await self.index_visa_requirements(visas)
            counts["visa"] = count
            logger.info(f"Indexed {count} visa requirements")
        except Exception as e:
            logger.error(f"Failed to index visa: {e}")
            counts["visa"] = 0
        
        return counts

    def is_ready(self) -> bool:
        """Check if the service is ready."""
        try:
            _ = self.embedder
            return True
        except Exception:
            return False


def get_knowledge_embedding_service() -> KnowledgeEmbeddingService:
    """Get or create the singleton KnowledgeEmbeddingService."""
    global _knowledge_embedding_service
    if _knowledge_embedding_service is None:
        _knowledge_embedding_service = KnowledgeEmbeddingService()
    return _knowledge_embedding_service


async def reindex_knowledge_on_startup(db):
    """Called on app startup to ensure all knowledge is indexed."""
    svc = get_knowledge_embedding_service()
    if not svc.is_ready():
        logger.warning("KnowledgeEmbeddingService not ready — skipping startup reindex")
        return {}
    return await svc.reindex_all(db)
