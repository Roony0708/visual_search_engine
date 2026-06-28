import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
import numpy as np
from PIL import Image
from io import BytesIO
from unittest.mock import patch, MagicMock, AsyncMock


@pytest.fixture
def sample_image():
    img = Image.new("RGB", (224, 224), color=(255, 255, 255))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


@pytest.fixture
def sample_embedding():
    return np.random.randn(512).astype(np.float32)


@pytest.fixture
def sample_metadata():
    return [
        {"id": "1", "name": "Product 1", "price": 19.99, "category": "Clothing",
         "image_url": "/products/1.jpg", "description": "Test product 1"},
        {"id": "2", "name": "Product 2", "price": 29.99, "category": "Electronics",
         "image_url": "/products/2.jpg", "description": "Test product 2"},
    ]


@pytest.fixture
def mock_db():
    db = AsyncMock()

    result = MagicMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = []
    result.scalars.return_value = scalars_mock
    result.scalar_one_or_none.return_value = None

    async def async_execute(*args, **kwargs):
        return result

    db.execute = async_execute

    return db
