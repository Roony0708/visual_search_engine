from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    price: float
    category: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    image_path: str


class ProductResponse(ProductBase):
    id: str
    image_path: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProductMatch(BaseModel):
    id: str
    name: str
    price: float
    similarity: float
    image_url: str
    category: str


class SearchResponse(BaseModel):
    query_image: str
    matches: list[ProductMatch]


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
