import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.data_loader import data_loader
from app.services.channel_analytics import channel_analytics_service
from app.services.ml import MLService
from app.services.youtube_fetcher import (
    SAMPLE_PRESETS,
    extract_video_id,
    fetch_youtube_metadata,
)

logger = logging.getLogger("live_youtube")
router = APIRouter(prefix="/youtube", tags=["Live YouTube"])


class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL or 11-char Video ID")
    categoryId: Optional[int] = Field(default=None, ge=1, le=50)


@router.get("/samples")
def get_sample_videos():
    """
    Returns curated sample viral videos for instant 1-click live testing.
    """
    return SAMPLE_PRESETS


@router.post("/analyze")
async def analyze_youtube_video(req: AnalyzeRequest):
    """
    Extracts live YouTube video statistics and feeds them through
    Regression, Popularity Classification, and K-Means Clustering models,
    with comprehensive channel historical performance analytics.
    """
    video_id = extract_video_id(req.url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid YouTube URL or Video ID. Example: https://www.youtube.com/watch?v=v7K4vGYL9ow",
        )

    meta = await fetch_youtube_metadata(video_id)
    cat_id = req.categoryId or meta.get("categoryId", 24)

    # 1. Run Channel Analytics from 251k records
    channel_info = channel_analytics_service.analyze_channel(
        channel_name=meta.get("channelTitle", "YouTube Creator"),
        video_views=meta.get("view_count", 0),
        video_likes=meta.get("likes", 0),
        video_comments=meta.get("comment_count", 0),
        category_id=cat_id,
    )

    # 2. Run ML Regression
    reg = MLService.predict_regression(
        likes=meta["likes"],
        dislikes=meta["dislikes"],
        comment_count=meta["comment_count"],
        model="multiple",
    )
    predicted_views = reg["predicted_views"]

    # Ratio of Actual vs Model Expected views
    ratio = round(meta["view_count"] / max(1.0, predicted_views), 2)
    if ratio > 1.3:
        performance_verdict = "Outperforming Model Expectation"
        performance_status = "viral"
    elif ratio < 0.7:
        performance_verdict = "Underperforming Engagement Potential"
        performance_status = "lagging"
    else:
        performance_verdict = "Aligned with Historical Trending Baseline"
        performance_status = "normal"

    # 3. Run Popularity Classification
    clf = MLService.predict_classification(
        likes=meta["likes"],
        dislikes=meta["dislikes"],
        comment_count=meta["comment_count"],
        categoryId=cat_id,
        model="decision_tree",
    )

    # 4. Run K-Means Cluster Assignment
    cluster_info = MLService.assign_cluster(
        view_count=meta["view_count"],
        likes=meta["likes"],
        dislikes=meta["dislikes"],
        comment_count=meta["comment_count"],
        log_transform=True,
    )

    # 5. Percentile Rank in 251k Records
    df = data_loader.df
    views = meta["view_count"]
    percentile = 50.0
    if df is not None and "view_count" in df.columns:
        percentile = round(float((df["view_count"] < views).mean() * 100), 1)

    if percentile >= 95.0:
        grade = "S+"
    elif percentile >= 80.0:
        grade = "A"
    elif percentile >= 50.0:
        grade = "B"
    else:
        grade = "C"

    return {
        "metadata": meta,
        "channel_analytics": channel_info,
        "benchmark_analysis": {
            "percentile_rank": percentile,
            "virality_grade": grade,
            "performance_verdict": performance_verdict,
            "performance_status": performance_status,
            "actual_views": meta["view_count"],
            "model_predicted_views": predicted_views,
            "ratio_actual_to_predicted": ratio,
        },
        "classification": clf,
        "clustering": cluster_info,
    }
