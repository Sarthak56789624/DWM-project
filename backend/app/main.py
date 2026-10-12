from contextlib import asynccontextmanager
import logging
import time
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import API_PREFIX, CORS_ORIGINS
from app.data_loader import data_loader
from app.routers import (
    channels,
    classification,
    clustering,
    creator,
    eda,
    live_youtube,
    mining,
    overview,
    regression,
    report,
    timeseries,
)
from app.schemas import HealthResponse, MetaResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("main")

START_TIME = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load parquet dataset, metadata, and ML models once into memory
    logger.info("Starting up FastAPI application...")
    data_loader.load_all()
    yield
    # Shutdown
    logger.info("Shutting down FastAPI application...")

app = FastAPI(
    title="YouTube Trending India Analytics API",
    description="Production-grade analytics and ML prediction service for Indian YouTube trending data.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
is_wildcard = not CORS_ORIGINS or "*" in CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if not is_wildcard else ["*"],
    allow_origin_regex=r".*" if is_wildcard else None,
    allow_credentials=False if is_wildcard else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler for consistent {"error": {...}} responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "path": request.url.path,
            }
        },
    )

# Include Routers under API_PREFIX (/api/v1)
api_router = FastAPI()
api_router.include_router(overview.router)
api_router.include_router(eda.router)
api_router.include_router(channels.router)
api_router.include_router(timeseries.router)
api_router.include_router(regression.router)
api_router.include_router(classification.router)
api_router.include_router(clustering.router)
api_router.include_router(mining.router)
api_router.include_router(creator.router)
api_router.include_router(live_youtube.router)
api_router.include_router(report.router)

@api_router.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """Service health and uptime status."""
    is_loaded = data_loader.df is not None
    rows = len(data_loader.df) if is_loaded else 0
    return {
        "status": "healthy" if is_loaded else "degraded",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "data_loaded": is_loaded,
        "total_rows": rows,
    }

@api_router.get("/meta", response_model=MetaResponse, tags=["System"])
def meta_info():
    """Metadata regarding dataset volume, models loaded, and cache status."""
    df_loaded = data_loader.df is not None
    return {
        "app_name": "yt-trending-india-api",
        "version": "1.0.0",
        "dataset": "IN_youtube_trending_data (Aug 2020 - Apr 2024)",
        "date_range": {
            "min": str(data_loader.metadata.get("min_trending_date", "")),
            "max": str(data_loader.metadata.get("max_trending_date", "")),
        },
        "total_rows": len(data_loader.df) if df_loaded else 0,
        "models_available": list(data_loader.models.keys()),
        "cache_info": {
            "load_time_seconds": round(data_loader.load_time, 2),
            "in_memory_rows": len(data_loader.df) if df_loaded else 0,
        },
    }

app.mount(API_PREFIX, api_router)

@app.get("/", tags=["System"])
def root():
    return {
        "service": "YouTube Trending India API",
        "status": "online",
        "docs_url": "/docs",
        "api_v1": API_PREFIX,
    }
