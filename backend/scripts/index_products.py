#!/usr/bin/env python3
"""Product Indexing Pipeline

Loads product images from the fashion dataset (CSV + images),
generates CLIP embeddings, builds FAISS index,
and persists metadata to PostgreSQL.

Usage:
    python scripts/index_products.py [--limit N]
"""

import argparse
import asyncio
import csv
import logging
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.database.database import create_tables, get_async_session
from app.models.product import Product
from app.services.embedding_service import embedding_service
from app.services.vector_search import vector_search

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

CATEGORY_PRICE_RANGES = {
    "Apparel": (9.99, 129.99),
    "Footwear": (19.99, 199.99),
    "Accessories": (4.99, 299.99),
    "Personal Care": (2.99, 49.99),
    "Free Items": (0, 0),
    "Sporting Goods": (14.99, 149.99),
    "Home": (9.99, 99.99),
}


def random_price(master_category: str) -> float:
    low, high = CATEGORY_PRICE_RANGES.get(master_category, (9.99, 99.99))
    return round(random.uniform(low, high), 2)


def load_fashion_products(
    csv_path: str,
    images_dir: str,
    limit: int = 2000,
) -> list[dict]:
    csv_path = Path(csv_path)
    images_dir = Path(images_dir)
    products: list[dict] = []

    if not csv_path.exists():
        logger.warning(f"Fashion CSV not found at {csv_path}")
        return products

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if limit and i >= limit:
                break

            product_id = row["id"]
            image_path = images_dir / f"{product_id}.jpg"
            if not image_path.exists():
                continue

            category = row.get("masterCategory", "Apparel")
            description = (
                f"{row.get('articleType', '')} in {row.get('baseColour', '')} "
                f"- {row.get('gender', '')} {row.get('usage', '')} wear"
            ).strip("- ")

            products.append({
                "id": product_id,
                "name": row.get("productDisplayName", f"Product {product_id}"),
                "price": random_price(category),
                "category": category,
                "description": description,
                "image_path": str(image_path),
                "image_url": f"/dataset/images/{product_id}.jpg",
            })

    logger.info(f"Loaded {len(products)} fashion products from CSV")
    return products


def load_product_images(
    metadata: list[dict],
) -> tuple[list[Image.Image], list[dict]]:
    images: list[Image.Image] = []
    valid_metadata: list[dict] = []

    for item in metadata:
        image_path = Path(item["image_path"])
        if not image_path.exists():
            logger.warning(f"Image not found: {image_path}, skipping {item['id']}")
            continue

        try:
            img = Image.open(image_path).convert("RGB")
            images.append(img)
            valid_metadata.append(item)
        except Exception as e:
            logger.error(f"Error loading image {image_path}: {e}")
            continue

    logger.info(f"Loaded {len(images)} product images")
    return images, valid_metadata


def index_products(limit: int | None = None):
    effective_limit = limit if limit is not None else settings.max_products
    logger.info("Starting product indexing pipeline...")
    logger.info(f"Fashion CSV: {settings.fashion_csv_path}")
    logger.info(f"Images dir: {settings.fashion_images_path}")
    logger.info(f"Product limit: {effective_limit}")
    logger.info(f"Device: {settings.device}")

    metadata = load_fashion_products(
        settings.fashion_csv_path,
        settings.fashion_images_path,
        limit=effective_limit,
    )

    if not metadata:
        logger.warning("No fashion data found. Falling back to synthetic products...")
        from app.config import settings as cfg
        create_synthetic_products(cfg.products_data_path)
        synthetic_metadata = _load_synthetic_metadata(cfg.products_data_path)
        images, valid_metadata = _load_synthetic_images(synthetic_metadata, cfg.products_data_path)
    else:
        images, valid_metadata = load_product_images(metadata)

    if not images:
        logger.error("No product images loaded. Aborting indexing.")
        sys.exit(1)

    embeddings = embedding_service.generate_batch_embeddings(images)
    logger.info(f"Generated {len(embeddings)} embeddings with dimension {embeddings.shape[1]}")

    vector_search.build_index(embeddings, valid_metadata)
    vector_search.save_index()

    asyncio.run(_sync_products_to_db(valid_metadata))

    logger.info("Product indexing pipeline completed successfully!")
    logger.info(f"Indexed {len(embeddings)} products")


async def _sync_products_to_db(metadata: list[dict]):
    await create_tables()
    session = get_async_session()
    async with session() as db:
        existing = set()
        result = await db.execute(select(Product.id))
        for row in result.scalars().all():
            existing.add(row)

        new_count = 0
        for item in metadata:
            if item["id"] in existing:
                continue
            product = Product(
                id=item["id"],
                name=item["name"],
                price=item["price"],
                category=item["category"],
                description=item.get("description", ""),
                image_path=item.get("image_path", ""),
                image_url=item.get("image_url", ""),
            )
            db.add(product)
            new_count += 1

        if new_count > 0:
            await db.commit()
            logger.info(f"Inserted {new_count} new products into database")
        else:
            logger.info("All products already exist in database")


def _load_synthetic_metadata(products_dir: str) -> list[dict]:
    import json
    products_path = Path(products_dir)
    metadata = []
    for f in sorted(products_path.glob("*.json")):
        with open(f) as fh:
            metadata.append(json.load(fh))
    return metadata


def _load_synthetic_images(metadata: list[dict], base_dir: str) -> tuple[list[Image.Image], list[dict]]:
    images = []
    valid = []
    for item in metadata:
        path = Path(base_dir) / f"{item['id']}.jpg"
        if not path.exists():
            continue
        try:
            images.append(Image.open(path).convert("RGB"))
            valid.append(item)
        except Exception:
            continue
    return images, valid


def create_synthetic_products(products_dir: str):
    from PIL import Image, ImageDraw

    products_path = Path(products_dir)
    products_path.mkdir(parents=True, exist_ok=True)

    categories = {
        "Clothing": ["Classic White Shirt", "Blue Denim Jacket", "Black Leather Jacket",
                     "Red Summer Dress", "Casual Sneakers", "Wool Sweater"],
        "Electronics": ["Wireless Headphones", "Smart Watch", "Bluetooth Speaker",
                        "USB-C Hub", "Laptop Stand", "Mechanical Keyboard"],
        "Home": ["Ceramic Mug", "Throw Pillow", "Desk Lamp", "Plant Pot",
                 "Wall Clock", "Photo Frame"],
        "Accessories": ["Leather Wallet", "Sunglasses", "Gold Watch",
                        "Canvas Backpack", "Silk Scarf", "Beaded Bracelet"],
    }

    colors = [
        (255, 255, 255), (50, 50, 180), (30, 30, 30), (200, 50, 50),
        (100, 180, 100), (255, 200, 0), (150, 75, 0), (200, 100, 200),
    ]

    import json
    product_id = 1
    for category, items in categories.items():
        for item_name in items:
            product = {
                "id": str(product_id),
                "name": item_name,
                "price": round(np.random.uniform(9.99, 299.99), 2),
                "category": category,
                "description": f"A premium {item_name.lower()} with exceptional quality and design.",
                "image_path": f"{product_id}.jpg",
                "image_url": f"/products/{product_id}.jpg",
            }

            img = Image.new("RGB", (224, 224), colors[product_id % len(colors)])
            draw = ImageDraw.Draw(img)
            draw.rectangle([20, 20, 204, 204], outline=(200, 200, 200), width=2)
            draw.text((60, 100), item_name[:12], fill=(255, 255, 255))
            img.save(products_path / f"{product_id}.jpg")

            meta_path = products_path / f"{product_id}.json"
            with open(meta_path, "w") as f:
                json.dump(product, f, indent=2)

            product_id += 1

    logger.info(f"Created {product_id - 1} synthetic products in {products_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index fashion products")
    parser.add_argument("--limit", type=int, default=None, help="Max products to index")
    args = parser.parse_args()
    index_products(limit=args.limit)
