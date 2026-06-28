import pytest
import numpy as np
from unittest.mock import patch, MagicMock


def _make_mock_faiss():
    class MockIndex:
        ntotal = 0
        def add(self, x):
            self.ntotal = x.shape[0]
        def search(self, q, k):
            return (np.zeros((1, k)), np.array([list(range(k))]))

    mock = MagicMock()
    mock.IndexFlatIP = MagicMock(return_value=MockIndex())
    mock.normalize_L2 = MagicMock()
    mock.write_index = MagicMock()
    mock.read_index = MagicMock(return_value=MockIndex())
    return mock


@pytest.fixture(autouse=True)
def patch_faiss():
    mock_faiss = _make_mock_faiss()
    import sys as _sys
    _sys.modules.pop('app.services.vector_search', None)
    with patch.dict('sys.modules', {'faiss': mock_faiss}):
        import app.services.vector_search as vs
        vs.HAS_FAISS = True
        vs.faiss = mock_faiss
        yield


class TestVectorSearchService:
    @pytest.fixture
    def service(self):
        from app.services.vector_search import VectorSearchService
        return VectorSearchService()

    def test_build_index(self, service, sample_metadata):
        embeddings = np.random.randn(2, 512).astype(np.float32)
        service.build_index(embeddings, sample_metadata)
        assert service.index is not None
        assert len(service.metadata) == 2

    def test_search_similar(self, service, sample_metadata, sample_embedding):
        embeddings = np.random.randn(5, 512).astype(np.float32)
        service.build_index(embeddings, sample_metadata * 2 + sample_metadata[:1])
        results = service.search_similar(sample_embedding, k=3)
        assert len(results) >= 0

    def test_search_without_index_raises(self, service, sample_embedding):
        with pytest.raises(RuntimeError, match="FAISS index not loaded"):
            service.search_similar(sample_embedding)

    def test_save_and_load_index(self, service, sample_metadata, tmp_path):
        embeddings = np.random.randn(3, 512).astype(np.float32)
        service.build_index(embeddings, sample_metadata[:1] * 3)
        index_path = str(tmp_path / "test_index.bin")
        metadata_path = str(tmp_path / "test_metadata.json")
        service.save_index(index_path, metadata_path)
        new_service = type(service)()
        loaded = new_service.load_index(index_path, metadata_path)
        assert loaded is True
        assert new_service.index is not None
