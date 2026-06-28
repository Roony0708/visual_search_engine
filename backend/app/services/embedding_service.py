import numpy as np
from PIL import Image
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._model = None
            cls._instance._processor = None
        return cls._instance

    def _load_model(self):
        if self._model is None:
            logger.info(f"Loading CLIP model: {settings.embedding_model}")
            from transformers import CLIPProcessor, CLIPModel
            self._model = CLIPModel.from_pretrained(settings.embedding_model)
            self._processor = CLIPProcessor.from_pretrained(settings.embedding_model)
            self._model.to(settings.device)
            self._model.eval()
            logger.info(f"CLIP model loaded on {settings.device}")

    def generate_embedding(self, image: Image.Image) -> np.ndarray:
        self._load_model()
        inputs = self._processor(images=image, return_tensors="pt")
        inputs = {k: v.to(settings.device) for k, v in inputs.items()}

        import torch
        with torch.no_grad():
            embedding = self._model.get_image_features(**inputs)

        embedding = embedding.cpu().numpy().flatten()
        embedding = embedding / np.linalg.norm(embedding)
        return embedding.astype(np.float32)

    def generate_batch_embeddings(self, images: list[Image.Image]) -> np.ndarray:
        self._load_model()
        embeddings = []

        import torch
        batch_size = 32
        for i in range(0, len(images), batch_size):
            batch = images[i:i + batch_size]
            inputs = self._processor(images=batch, return_tensors="pt", padding=True)
            inputs = {k: v.to(settings.device) for k, v in inputs.items()}

            with torch.no_grad():
                batch_embeddings = self._model.get_image_features(**inputs)

            batch_embeddings = batch_embeddings.cpu().numpy()
            for emb in batch_embeddings:
                emb = emb / np.linalg.norm(emb)
                embeddings.append(emb.astype(np.float32))

            logger.info(f"Processed batch {i // batch_size + 1}/{(len(images) + batch_size - 1) // batch_size}")

        return np.array(embeddings)


embedding_service = EmbeddingService()
