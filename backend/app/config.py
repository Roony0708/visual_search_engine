from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "AI Visual Search Engine"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/visual_search"
    database_url_sync: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/visual_search"

    upload_dir: str = "data/uploads"
    faiss_index_path: str = "data/faiss_index.bin"
    faiss_metadata_path: str = "data/faiss_metadata.npy"
    products_data_path: str = "data/products"
    fashion_csv_path: str = "data_set/styles.csv"
    fashion_images_path: str = "data_set/images"
    max_products: int = 2000
    embedding_model: str = "openai/clip-vit-base-patch32"
    embedding_dim: int = 512
    device: str = "cuda" if os.path.exists("/usr/local/cuda") else "cpu"
    mlflow_tracking_uri: str = "file:./mlruns"
    max_upload_size_mb: int = 10
    cors_origins: str = "http://localhost:3000"


settings = Settings()
