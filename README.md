# AI Visual Search Engine

AI-powered visual product search using CLIP embeddings and FAISS vector search. Upload any image to find visually similar products from a catalog of 44k+ fashion items.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌────────────┐
│  Frontend   │────▶│   Backend   │────▶│ PostgreSQL │
│  Next.js 15 │     │  FastAPI    │     │  Products  │
│  Port 3000  │◀────│  Port 8000  │     └────────────┘
└─────────────┘     │             │     ┌────────────┐
                    │  CLIP +     │────▶│   FAISS    │
                    │  FAISS      │     │   Index    │
                    └─────────────┘     └────────────┘
```

## Tech Stack

### Frontend
- **Next.js 15** (App Router) + TypeScript
- Tailwind CSS + Shadcn UI components
- Framer Motion animations
- react-dropzone for image upload

### Backend
- **FastAPI** (async Python)
- **OpenAI CLIP** (`openai/clip-vit-base-patch32`) for embedding generation
- **FAISS** (IndexFlatIP) for cosine similarity search
- **PostgreSQL** + SQLAlchemy (async) for product metadata
- MLflow for experiment tracking

## Features

- Visual search by image upload (drag-and-drop)
- Real fashion product catalog with 44k+ products
- Category filtering and sorting (relevance, price)
- Product detail pages with "search similar" functionality
- Search history (localStorage)
- Dark/light theme
- Responsive design
- Docker Compose deployment

## Dataset

Uses the [Fashion Product Images Dataset](https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small) with 44k+ fashion products across categories:
- Apparel (Shirts, T-shirts, Jeans, Dresses, etc.)
- Footwear (Shoes, Sandals, Flip Flops, etc.)
- Accessories (Watches, Bags, Belts, Jewellery, etc.)
- Personal Care (Fragrance, Lips, etc.)

## Quick Start

### Prerequisites
- Docker & Docker Compose

### Run

```bash
docker compose up -d
```

Wait ~3 minutes for the CLIP model to download and 500 products to index on first run.

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Health Check | http://localhost:8000/health |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload-image` | Upload an image and get its embedding |
| POST | `/search` | Upload image + get similar products |
| GET | `/products` | List products (supports `?category=`, `?skip=`, `?limit=`) |
| GET | `/product/{id}` | Get product details |
| GET | `/products/categories` | Get categories with counts |

## Development

### Configuration

Key environment variables (`.env` or docker-compose):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@postgres:5432/visual_search` | PostgreSQL connection |
| `MAX_PRODUCTS` | `2000` | Max products to index from dataset |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `EMBEDDING_MODEL` | `openai/clip-vit-base-patch32` | CLIP model name |

### Re-index products

```bash
# Rebuild FAISS index and re-sync database
docker compose exec backend python scripts/index_products.py --limit 2000
```

### Run tests

```bash
docker compose exec backend python -m pytest tests/ -v
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes.py        # REST API endpoints
│   │   ├── config.py            # Settings via pydantic
│   │   ├── database/database.py # Async SQLAlchemy setup
│   │   ├── models/product.py    # Product ORM model
│   │   ├── schemas/product.py   # Pydantic schemas
│   │   └── services/
│   │       ├── embedding_service.py  # CLIP embedding
│   │       └── vector_search.py      # FAISS search
│   ├── scripts/index_products.py # Indexing pipeline
│   └── tests/
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Homepage
│   │   ├── search/page.tsx      # Search results
│   │   ├── product/[id]/page.tsx # Product detail
│   │   └── history/page.tsx     # Search history
│   ├── components/              # Reusable UI components
│   └── services/api.ts          # API client
├── data_set/
│   ├── styles.csv               # Product metadata (44k rows)
│   └── images/                  # Product images (60x80 JPEGs)
└── docker-compose.yml
```

## Dataset

The fashion dataset (`data_set/`) is **not included in the repository** due to its size (~600MB). You need to download it separately:

```bash
# Download from Kaggle
kaggle datasets download paramaggarwal/fashion-product-images-small
unzip fashion-product-images-small.zip -d data_set/
```

Or manually from: https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small

## Deployment (Render)

Render offers a free tier suitable for hosting this project. You'll deploy two services (backend + frontend) and a PostgreSQL database.

### 1. Create a PostgreSQL Database

1. Go to https://dashboard.render.com → **New** → **PostgreSQL**
2. Choose **Free** plan
3. Note the **Internal Database URL** (looks like `postgres://user:pass@host:5432/db`)

### 2. Deploy the Backend (FastAPI)

1. Go to https://dashboard.render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `visual-search-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Build Command**: (leave empty — uses Dockerfile)
   - **Start Command**: (leave empty — uses Dockerfile)
   - **Instance Type**: **Free**
4. Set Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Render PostgreSQL Internal URL with `+asyncpg` → `postgresql+asyncpg://user:pass@host:5432/db` |
| `DATABASE_URL_SYNC` | Same URL with `+psycopg2` → `postgresql+psycopg2://user:pass@host:5432/db` |
| `CORS_ORIGINS` | `https://your-frontend.onrender.com` |
| `MAX_PRODUCTS` | `200` |
| `DEBUG` | `false` |

5. Click **Deploy Web Service**

> **Note:** First deploy takes 10-15 minutes (CLIP model downloads from HuggingFace). Render free tier has a 512MB RAM limit — keep `MAX_PRODUCTS` at 200 or less to avoid out-of-memory errors.

#### Persistent Disk (for FAISS index + uploads)

1. In your backend service dashboard, go to **Disks**
2. Create a Disk:
   - **Name**: `data`
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB
3. This persists the FAISS index and uploaded images across deploys

### 3. Deploy the Frontend (Next.js)

1. Go to https://dashboard.render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `visual-search-frontend`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**
4. Set Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` |
| `PORT` | `10000` |

5. Click **Deploy Web Service**

### 4. Verify

- Frontend: `https://visual-search-frontend.onrender.com`
- Backend health: `https://visual-search-backend.onrender.com/health`
- API products: `https://visual-search-backend.onrender.com/products`

### Render Free Tier Limits

| Resource | Limit |
|----------|-------|
| Web Services | 2 services (covers backend + frontend) |
| PostgreSQL | 1 database, 256MB storage |
| Build Minutes | 500 hours/month |
| Bandwidth | 100 GB/month |
| RAM | 512 MB per service |
| Disk | 1 GB persistent disk |

Performance may be slower on the free tier due to CPU and RAM constraints.

## License

MIT
