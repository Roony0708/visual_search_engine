import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.database.database import create_tables
from app.services.vector_search import vector_search

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Visual Search Engine...")
    await create_tables()

    try:
        import mlflow
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        mlflow.set_experiment("visual_search")
    except ImportError:
        logger.info("MLflow not installed. Skipping experiment tracking.")

    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(Path(settings.faiss_index_path).parent, exist_ok=True)

    vector_search.load_index()

    yield

    logger.info("Shutting down Visual Search Engine...")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

upload_dir = Path(settings.upload_dir)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

products_dir = Path(settings.products_data_path)
products_dir.mkdir(parents=True, exist_ok=True)
app.mount("/products", StaticFiles(directory=str(products_dir)), name="products")

dataset_images_dir = Path(settings.fashion_images_path)
if dataset_images_dir.exists():
    app.mount("/dataset/images", StaticFiles(directory=str(dataset_images_dir)), name="dataset_images")
