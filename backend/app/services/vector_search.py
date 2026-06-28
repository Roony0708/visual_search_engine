import numpy as np
import json
import logging
from typing import Optional, Any
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False
    logger.warning("FAISS not installed. Vector search will not be available.")
    faiss = None


class VectorSearchService:
    def __init__(self):
        self.index: Optional[Any] = None
        self.metadata: list[dict] = []
        self.dimension = settings.embedding_dim

    def build_index(self, embeddings: np.ndarray, metadata: list[dict]) -> None:
        if not HAS_FAISS:
            raise RuntimeError("FAISS is required to build index")

        if len(embeddings) == 0:
            raise ValueError("No embeddings provided to build index")

        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)

        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        self.metadata = metadata

        logger.info(f"Built FAISS index with {self.index.ntotal} vectors")

    def save_index(self, index_path: Optional[str] = None, metadata_path: Optional[str] = None) -> None:
        if not HAS_FAISS:
            raise RuntimeError("FAISS is required to save index")

        index_path = index_path or settings.faiss_index_path
        metadata_path = metadata_path or settings.faiss_metadata_path

        Path(index_path).parent.mkdir(parents=True, exist_ok=True)
        Path(metadata_path).parent.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self.index, index_path)
        with open(metadata_path, "w") as f:
            json.dump(self.metadata, f)

        logger.info(f"Index saved to {index_path}, metadata to {metadata_path}")

    def load_index(self, index_path: Optional[str] = None, metadata_path: Optional[str] = None) -> bool:
        if not HAS_FAISS:
            logger.warning("FAISS not installed. Cannot load index.")
            return False

        index_path = index_path or settings.faiss_index_path
        metadata_path = metadata_path or settings.faiss_metadata_path

        try:
            self.index = faiss.read_index(index_path)
            with open(metadata_path, "r") as f:
                self.metadata = json.load(f)
            logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors")
            return True
        except (FileNotFoundError, RuntimeError) as e:
            logger.warning(f"Could not load index: {e}")
            return False

    def search_similar(self, query_embedding: np.ndarray, k: int = 10) -> list[tuple[dict, float]]:
        if self.index is None:
            raise RuntimeError("FAISS index not loaded. Call load_index() or build_index() first.")

        query = query_embedding.reshape(1, -1).astype(np.float32)
        faiss.normalize_L2(query)

        distances, indices = self.index.search(query, min(k, self.index.ntotal))

        results = []
        for idx, score in zip(indices[0], distances[0]):
            if idx < len(self.metadata):
                results.append((self.metadata[idx], float(score)))

        return sorted(results, key=lambda x: x[1], reverse=True)


vector_search = VectorSearchService()
