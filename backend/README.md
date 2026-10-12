# YouTube Trending India – Backend REST API (`yt-trending-india-api`)

Production-grade FastAPI service replicating and extending the Data Warehousing & Mining (DWM) analysis on 251,277 Indian YouTube trending records (August 2020 – April 2024).

---

## Architecture & Features

- **Blazing Fast In-Memory Parquet**: Replaces slow 420 MB raw CSV reads with an optimized 17 MB Parquet file loaded once into memory via lifespan handler.
- **Microsecond Caching**: All analytical aggregations are cached via `@lru_cache`, serving responses in < 15ms.
- **Machine Learning Inference**:
  - **Simple Linear Regression** (Likes → Views, $R^2 \approx 0.628$)
  - **Multiple Linear Regression** (Likes, Dislikes, Comments → Views, $R^2 \approx 0.635$)
  - **Decision Tree Classifier** (Depth 5, Accuracy $\approx 82.2\%$) with recursive tree structure JSON export for interactive tree diagrams
  - **Gaussian Naive Bayes** (Accuracy $\approx 74.4\%$, Precision $\approx 0.97$)
  - **K-Means Clustering** ($K=4$, Standard & Log-transformed models, Elbow inertia, Silhouette scores, 2D PCA projection)

---

## Quickstart

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Place Raw Dataset & Prepare Data
Ensure `IN_youtube_trending_data.csv` is located in `backend/data/raw/` (or repository root), then execute:
```bash
python scripts/prepare_data.py
```
This produces `data/processed/trending.parquet`, `search_metadata.parquet`, and `metadata.json`.

### 3. Train Models & Verify Notebook Parity
```bash
python scripts/train_models.py
```
Trains all regression, classification, and clustering models, validates all metrics against the notebook targets within 1%, and outputs `models/*.joblib` and `models/metrics.json`.

### 4. Run Automated Tests
```bash
python -m pytest tests/test_api.py -v
```

### 5. Launch the API Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)  
Alternative ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Example cURL Commands

### 1. Health & Meta
```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/meta
```

### 2. Overview
```bash
curl http://localhost:8000/api/v1/overview
```

### 3. Distributions
```bash
# Linear scale
curl "http://localhost:8000/api/v1/distributions?metric=view_count&bins=30&log=false"
# Log1p scale
curl "http://localhost:8000/api/v1/distributions?metric=view_count&bins=30&log=true"
```

### 4. Channels & Categories
```bash
curl "http://localhost:8000/api/v1/channels/top?limit=10"
curl "http://localhost:8000/api/v1/channels/avg-views?limit=10"
curl "http://localhost:8000/api/v1/categories"
```

### 5. Correlation & Scatter
```bash
curl "http://localhost:8000/api/v1/correlation"
curl "http://localhost:8000/api/v1/scatter?x=view_count&y=likes&sample=1000"
```

### 6. Time Series Trends
```bash
curl "http://localhost:8000/api/v1/timeseries/daily?granularity=day"
curl "http://localhost:8000/api/v1/timeseries/daily?granularity=month"
```

### 7. Top Videos & Engagement
```bash
curl "http://localhost:8000/api/v1/videos/top?limit=10"
curl "http://localhost:8000/api/v1/engagement"
```

### 8. Regression Lab
```bash
curl "http://localhost:8000/api/v1/regression/metrics"

curl -X POST "http://localhost:8000/api/v1/regression/predict" \
  -H "Content-Type: application/json" \
  -d '{"likes": 150000, "dislikes": 1200, "comment_count": 3500, "model": "multiple"}'
```

### 9. Popularity Classifier
```bash
curl "http://localhost:8000/api/v1/classification/metrics"

curl -X POST "http://localhost:8000/api/v1/classification/predict" \
  -H "Content-Type: application/json" \
  -d '{"likes": 85000, "dislikes": 400, "comment_count": 2200, "categoryId": 24, "model": "decision_tree"}'
```

### 10. Cluster Explorer
```bash
curl "http://localhost:8000/api/v1/clustering/summary"

curl -X POST "http://localhost:8000/api/v1/clustering/assign" \
  -H "Content-Type: application/json" \
  -d '{"view_count": 2500000, "likes": 120000, "dislikes": 2000, "comment_count": 5000, "log_transform": false}'
```
