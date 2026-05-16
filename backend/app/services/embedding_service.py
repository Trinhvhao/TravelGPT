"""
Embedding Service - Semantic Search for TravelGPT Tours.

Uses ChromaDB for vector storage and sentence-transformers for embeddings.
Supports multilingual queries (including Vietnamese).
"""
import logging
import os
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# Path for persistent ChromaDB storage
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"
EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)

# Default embedding model — multilingual, good for Vietnamese
DEFAULT_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# Singleton instance
_embedding_service: Optional["EmbeddingService"] = None


class EmbeddingService:
    """
    Manages ChromaDB vector store and embedding generation for tour data.

    On first use, downloads the embedding model from HuggingFace (~500MB).
    Model is cached locally after first download.
    """

    def __init__(self, model_name: str = DEFAULT_MODEL):
        self.model_name = model_name
        self._client = None
        self._collection = None
        self._embedder = None
        self._indexed_tour_ids: set = set()

    @property
    def client(self):
        """Lazy-init ChromaDB client."""
        if self._client is None:
            import chromadb
            self._client = chromadb.PersistentClient(path=str(EMBEDDINGS_DIR))
        return self._client

    @property
    def collection(self):
        """Lazy-init or get the tours collection."""
        if self._collection is None:
            self._collection = self.client.get_or_create_collection(
                name="tours",
                metadata={"hnsw:space": "cosine"}
            )
        return self._collection

    @property
    def embedder(self):
        """Lazy-load the embedding model."""
        if self._embedder is None:
            try:
                from langchain_huggingface import HuggingFaceEmbeddings
                self._embedder = HuggingFaceEmbeddings(
                    model_name=self.model_name,
                    model_kwargs={"device": "cpu"},
                    encode_kwargs={"normalize_embeddings": True}
                )
                logger.info(f"Embedding model loaded: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise
        return self._embedder

    def _tour_to_text(self, tour) -> str:
        """Convert a tour object to searchable text."""
        parts = [
            tour.name or "",
            tour.shortDescription or "",
            tour.description or "",
            tour.destination or "",
            tour.category or "",
            tour.region or "",
            tour.duration or "",
        ]
        return " | ".join(p for p in parts if p)

    async def index_tour(self, tour) -> bool:
        """Index a single tour. Returns True if successful."""
        try:
            text = self._tour_to_text(tour)
            embedding = self.embedder.embed_query(text)

            self.collection.upsert(
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "tour_id": tour.id,
                    "name": tour.name or "",
                    "destination": tour.destination or "",
                    "region": tour.region or "",
                }],
                ids=[tour.id]
            )
            self._indexed_tour_ids.add(tour.id)
            logger.debug(f"Indexed tour: {tour.id} — {tour.name}")
            return True
        except Exception as e:
            logger.error(f"Failed to index tour {tour.id}: {e}")
            return False

    async def index_tours(self, tours: list) -> int:
        """Index multiple tours. Returns number of successfully indexed tours."""
        if not tours:
            return 0

        texts = []
        embeddings = []
        metadatas = []
        ids = []

        for tour in tours:
            try:
                text = self._tour_to_text(tour)
                emb = self.embedder.embed_query(text)
                texts.append(text)
                embeddings.append(emb)
                metadatas.append({
                    "tour_id": tour.id,
                    "name": tour.name or "",
                    "destination": tour.destination or "",
                    "region": tour.region or "",
                })
                ids.append(tour.id)
            except Exception as e:
                logger.warning(f"Skipping tour {tour.id} due to embedding error: {e}")
                continue

        if not ids:
            return 0

        try:
            self.collection.upsert(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            for tid in ids:
                self._indexed_tour_ids.add(tid)
            logger.info(f"Indexed {len(ids)} tours in batch")
            return len(ids)
        except Exception as e:
            logger.error(f"Batch indexing failed: {e}")
            return 0

    async def semantic_search(
        self,
        query: str,
        top_k: int = 5,
        region_filter: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> list[dict]:
        """
        Perform semantic search for tours.

        Args:
            query: Natural language query (e.g. "tour biển mùa hè cho gia đình")
            top_k: Number of results to return
            region_filter: Optional region to filter results
            max_price: Optional max price filter

        Returns:
            List of dicts with tour_id, distance, name, destination, region
        """
        try:
            query_embedding = self.embedder.embed_query(query)

            # Build where filter for ChromaDB
            where_filter = None
            if region_filter or max_price is not None:
                where_filter = {}
                if region_filter:
                    where_filter["region"] = region_filter
                # ChromaDB doesn't support price filtering on metadata directly
                # We'll filter post-query in Python

            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k * 3, 50),  # Over-fetch for price filtering
                where=where_filter,
                include=["metadatas", "distances", "documents"]
            )

            if not results or not results["ids"] or not results["ids"][0]:
                return []

            raw_results = list(zip(
                results["ids"][0],
                results["distances"][0],
                results["metadatas"][0],
                results["documents"][0]
            ))

            # Post-filter by price if needed
            # Note: price is not stored in metadata, so we skip price filter here
            # The caller (TourService) will do price filtering on the actual Tour objects

            # Filter by region if specified
            if region_filter:
                raw_results = [
                    r for r in raw_results
                    if r[2].get("region") == region_filter
                ]

            # Take top_k
            top_results = raw_results[:top_k]

            return [
                {
                    "tour_id": r[0],
                    "distance": r[1],
                    "name": r[2].get("name", ""),
                    "destination": r[2].get("destination", ""),
                    "region": r[2].get("region", ""),
                }
                for r in top_results
            ]
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []

    async def delete_tour(self, tour_id: str) -> bool:
        """Remove a tour from the index."""
        try:
            self.collection.delete(ids=[tour_id])
            self._indexed_tour_ids.discard(tour_id)
            return True
        except Exception as e:
            logger.warning(f"Failed to delete tour {tour_id} from index: {e}")
            return False

    async def reindex_all(self, db) -> int:
        """
        Delete all existing data and reindex all tours from the database.

        Args:
            db: Prisma client instance

        Returns:
            Number of tours indexed
        """
        try:
            # Delete existing collection
            try:
                self.client.delete_collection("tours")
                logger.info("Deleted existing tours collection")
            except Exception:
                pass

            # Recreate
            self._collection = None
            self._indexed_tour_ids.clear()

            # Fetch all active tours
            tours = await db.tour.find_many(
                where={"isActive": True},
                take=1000,
            )
            logger.info(f"Found {len(tours)} active tours to index")

            indexed = await self.index_tours(tours)
            logger.info(f"Reindexed {indexed} tours")
            return indexed

        except Exception as e:
            logger.error(f"Reindex failed: {e}", exc_info=True)
            return 0

    def is_ready(self) -> bool:
        """Check if the embedding service is ready (model loaded, collection exists)."""
        try:
            _ = self.collection
            _ = self.embedder
            return True
        except Exception:
            return False


def get_embedding_service() -> EmbeddingService:
    """Get or create the singleton EmbeddingService."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service


async def reindex_tours_on_startup(db):
    """Called on app startup to ensure all tours are indexed."""
    svc = get_embedding_service()
    if not svc.is_ready():
        logger.warning("EmbeddingService not ready — skipping startup reindex")
        return 0
    return await svc.reindex_all(db)
