import pytest
import pytest_asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport


@pytest_asyncio.fixture
async def client(mock_db):
    with patch.dict('sys.modules', {'faiss': MagicMock()}):
        import app.services.vector_search as vs
        vs.HAS_FAISS = True
        vs.faiss = MagicMock()

        from app.main import app
        from app.database.database import get_db
        app.dependency_overrides[get_db] = lambda: mock_db
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_products_empty(client):
    response = await client.get("/products")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_product_not_found(client):
    response = await client.get("/product/999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_upload_image_no_file(client):
    response = await client.post("/upload-image")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_no_file(client):
    response = await client.post("/search")
    assert response.status_code == 422
