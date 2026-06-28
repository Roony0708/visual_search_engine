import os
import uuid
import logging
from pathlib import Path
from PIL import Image
from io import BytesIO

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse, SearchResponse, ProductMatch, HealthResponse
from app.services.embedding_service import embedding_service
from app.services.vector_search import vector_search
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


def _full_url(request: Request, path: str | None) -> str:
    if not path:
        return ""
    if path.startswith("http"):
        return path
    base = str(request.base_url).rstrip("/")
    return f"{base}{path}"


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy")


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.max_upload_size_mb}MB")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = upload_dir / filename

    with open(filepath, "wb") as f:
        f.write(contents)

    image = Image.open(BytesIO(contents)).convert("RGB")
    embedding = embedding_service.generate_embedding(image)

    return {
        "image_url": f"/uploads/{filename}",
        "embedding": embedding.tolist(),
        "filename": filename,
    }


@router.post("/search", response_model=SearchResponse)
async def search_by_image(
    request: Request,
    file: UploadFile = File(...),
    top_k: int = Form(10),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.max_upload_size_mb}MB")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = upload_dir / filename

    with open(filepath, "wb") as f:
        f.write(contents)

    image = Image.open(BytesIO(contents)).convert("RGB")

    embedding = embedding_service.generate_embedding(image)

    if vector_search.index is None:
        loaded = vector_search.load_index()
        if not loaded:
            raise HTTPException(status_code=503, detail="Vector index not available. Run indexing pipeline first.")

    results = vector_search.search_similar(embedding, k=top_k)

    matches = []
    for metadata, score in results:
        matches.append(ProductMatch(
            id=metadata["id"],
            name=metadata["name"],
            price=metadata["price"],
            similarity=round(score, 4),
            image_url=_full_url(request, metadata.get("image_url")),
            category=metadata.get("category", ""),
        ))

    return SearchResponse(
        query_image=_full_url(request, f"/uploads/{filename}"),
        matches=matches,
    )


@router.get("/products", response_model=list[ProductResponse])
async def get_products(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Product)

    if category:
        query = query.where(Product.category == category)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    products = result.scalars().all()

    result = []
    for p in products:
        item = ProductResponse.model_validate(p)
        item.image_url = _full_url(request, item.image_url)
        result.append(item)
    return result


@router.get("/product/{product_id}", response_model=ProductResponse)
async def get_product(
    request: Request,
    product_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    item = ProductResponse.model_validate(product)
    item.image_url = _full_url(request, item.image_url)
    return item


@router.get("/products/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    result = await db.execute(
        select(Product.category, func.count(Product.id))
        .group_by(Product.category)
    )
    categories = [{"category": row[0], "count": row[1]} for row in result]
    return categories
