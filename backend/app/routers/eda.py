from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas import (
    CategoryItem,
    CorrelationResponse,
    DistributionResponse,
    EngagementResponse,
    ScatterResponse,
    TopVideoItem,
)
from app.services.eda import eda_service

router = APIRouter(tags=["EDA"])

@router.get("/distributions", response_model=DistributionResponse)
def get_distribution(
    metric: str = Query(default="view_count", description="Column to analyse (view_count, likes, comment_count, dislikes)"),
    bins: int = Query(default=30, ge=5, le=100),
    log: bool = Query(default=False, description="Whether to apply log1p transform to smooth right skew"),
):
    """
    Returns histogram bin edges, counts, and box-plot statistics (with outlier count).
    Supports log1p scaling to handle heavy right skew.
    """
    return eda_service.get_distribution(metric=metric, bins=bins, is_log=log)

@router.get("/categories", response_model=List[CategoryItem])
def get_categories():
    """
    Returns the distribution of trending videos across YouTube categories with human-readable names.
    """
    return eda_service.get_categories()

@router.get("/correlation", response_model=CorrelationResponse)
def get_correlation():
    """
    Returns the Pearson correlation matrix for categoryId, view_count, likes, dislikes, and comment_count.
    """
    return eda_service.get_correlation()

@router.get("/scatter", response_model=ScatterResponse)
def get_scatter(
    x: str = Query(default="view_count"),
    y: str = Query(default="likes"),
    sample: int = Query(default=3000, ge=100, le=10000),
):
    """
    Returns a reproducible random sample of (x, y) coordinates for responsive scatter plotting.
    """
    return eda_service.get_scatter(x=x, y=y, sample_size=sample)

@router.get("/videos/top", response_model=List[TopVideoItem])
def get_top_videos(limit: int = Query(default=10, ge=1, le=50)):
    """
    Returns the top unique videos ranked by highest view count (deduplicated by video_id).
    """
    return eda_service.get_top_videos(limit=limit)

@router.get("/engagement", response_model=EngagementResponse)
def get_engagement():
    """
    Returns engagement rate summary statistics, distribution histogram, and comments/ratings disabled counts.
    """
    return eda_service.get_engagement()
