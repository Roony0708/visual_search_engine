import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from PIL import Image


class TestEmbeddingService:
    @pytest.fixture
    def service(self):
        from app.services.embedding_service import EmbeddingService
        return EmbeddingService()

    def test_singleton_pattern(self, service):
        from app.services.embedding_service import EmbeddingService
        service2 = EmbeddingService()
        assert service is service2

    @patch.dict('sys.modules', {'torch': MagicMock()})
    @patch("app.services.embedding_service.EmbeddingService._load_model")
    def test_generate_embedding_shape(self, mock_load, service, sample_image):
        mock_processor = MagicMock()
        mock_model = MagicMock()
        mock_model.get_image_features.return_value.cpu.return_value.numpy.return_value = \
            np.random.randn(1, 512).astype(np.float32)
        service._model = mock_model
        service._processor = mock_processor

        image = Image.open(sample_image).convert("RGB")
        embedding = service.generate_embedding(image)

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (512,)
        assert embedding.dtype == np.float32

    def test_normalized_embedding(self, service):
        emb = np.array([0.5, 0.5, 0.5, 0.5], dtype=np.float32)
        normalized = emb / np.linalg.norm(emb)
        assert abs(np.linalg.norm(normalized) - 1.0) < 1e-6
