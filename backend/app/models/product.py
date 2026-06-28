from sqlalchemy import Column, String, Float, Text, DateTime, func
from app.database.database import Base
import uuid


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
