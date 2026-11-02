from typing import Optional
from fastapi import APIRouter, HTTPException
from app.schemas import (
    RegressionMetricsResponse,
    RegressionPredictRequest,
    RegressionPredictResponse,
    RegressionURLRequest,
    RegressionURLResponse,
)
from app.services.channel_analytics import channel_analytics_service
from app.services.ml import ml_service
from app.services.youtube_fetcher import extract_video_id, fetch_youtube_metadata

router = APIRouter(prefix="/regression", tags=["Regression"])

@router.get("/metrics", response_model=RegressionMetricsResponse)
def get_regression_metrics():
    """
    Returns performance metrics (MAE, RMSE, R2, intercept, coefficients) and plotting sample
    for both Simple Linear Regression and Multiple Linear Regression.
    """
    return ml_service.get_regression_metrics()

@router.post("/predict", response_model=RegressionPredictResponse)
def predict_regression(payload: RegressionPredictRequest):
    """
    Predicts expected view count given engagement metrics (likes, dislikes, comments).
    """
    return ml_service.predict_regression(
        likes=payload.likes,
        dislikes=payload.dislikes,
        comment_count=payload.comment_count,
        model=payload.model,
    )

@router.post("/predict-url", response_model=RegressionURLResponse)
async def predict_regression_by_url(payload: RegressionURLRequest):
    """
    Automatically fetches live YouTube video metrics and channel historical analytics,
    then evaluates regression predictions, residuals, and performance benchmarking.
    """
    video_id = extract_video_id(payload.url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid YouTube URL or Video ID. Example: https://www.youtube.com/watch?v=v7K4vGYL9ow",
        )

    meta = await fetch_youtube_metadata(video_id)
    cat_id = payload.categoryId or meta.get("categoryId", 24)

    # 1. Channel Historical Analytics from 251k records
    channel_info = channel_analytics_service.analyze_channel(
        channel_name=meta.get("channelTitle", "YouTube Creator"),
        video_views=meta.get("view_count", 0),
        video_likes=meta.get("likes", 0),
        video_comments=meta.get("comment_count", 0),
        category_id=cat_id,
    )

    # 2. Run Simple and Multiple Linear Regression
    simple_pred = ml_service.predict_regression(
        likes=meta["likes"],
        dislikes=meta["dislikes"],
        comment_count=meta["comment_count"],
        model="simple",
    )
    mult_pred = ml_service.predict_regression(
        likes=meta["likes"],
        dislikes=meta["dislikes"],
        comment_count=meta["comment_count"],
        model="multiple",
    )

    chosen_pred = mult_pred if payload.model == "multiple" else simple_pred
    predicted_views = chosen_pred["predicted_views"]
    actual_views = meta.get("view_count", 0)
    residual = round(actual_views - predicted_views, 1)
    ratio = round(actual_views / max(1.0, predicted_views), 2)

    if ratio > 1.3:
        status = "viral"
        verdict = (
            f"Super-Linear Viral Outperformer: Actual reach ({actual_views:,} views) outperforms linear "
            f"model expectation ({predicted_views:,.0f} views) by +{round((ratio - 1) * 100, 1)}% ({ratio}x). "
            f"The positive residual (+{residual:,.0f} views) signals exponential word-of-mouth momentum beyond raw interaction volume."
        )
    elif ratio < 0.7:
        status = "lagging"
        verdict = (
            f"Under-Performing Engagement Potential: The model expected {predicted_views:,.0f} views based on interaction "
            f"velocity ({meta['likes']:,} likes), but the video garnered {actual_views:,} views (a -{round((1 - ratio) * 100, 1)}% gap). "
            f"Negative residual ({residual:,.0f} views) suggests high engagement-to-impression ratio or niche community concentration."
        )
    else:
        status = "normal"
        verdict = (
            f"Balanced Linear Trajectory: Actual views ({actual_views:,}) closely track the regression hyperplane "
            f"({predicted_views:,.0f} projected, {ratio}x ratio). Residual of {residual:,.0f} views falls well within the "
            f"1.6M MAE confidence band for Category {cat_id}."
        )

    benchmark_comp = {
        "actual_views": actual_views,
        "predicted_views": predicted_views,
        "residual": residual,
        "ratio_actual_to_predicted": ratio,
        "performance_status": status,
        "likes": meta["likes"],
        "dislikes": meta["dislikes"],
        "comment_count": meta["comment_count"],
        "simple_predicted_views": simple_pred["predicted_views"],
        "multiple_predicted_views": mult_pred["predicted_views"],
        "simple_residual": round(actual_views - simple_pred["predicted_views"], 1),
        "multiple_residual": round(actual_views - mult_pred["predicted_views"], 1),
    }

    # 3. Temporal Growth Projections (7 days, 30 days, 90 days, 365 days)
    import math
    base_views = max(float(actual_views), float(predicted_views))
    eng_rate = float(meta.get("engagement_rate", 2.5)) / 100.0
    v_factor = min(0.65, max(0.20, 0.25 + eng_rate * 4.0))

    def project_at_day(d: int) -> int:
        growth_multiplier = 1.0 + v_factor * math.log(1.0 + d / 3.0)
        return int(round(base_views * growth_multiplier))

    temporal_proj = {
        "base_views": int(base_views),
        "velocity_factor": round(v_factor, 3),
        "projections": {
            "7_days": {
                "days": 7,
                "label": "1 Week (7 Days)",
                "projected_views": project_at_day(7),
                "multiplier": round(project_at_day(7) / max(1.0, base_views), 2),
            },
            "30_days": {
                "days": 30,
                "label": "1 Month (30 Days)",
                "projected_views": project_at_day(30),
                "multiplier": round(project_at_day(30) / max(1.0, base_views), 2),
            },
            "90_days": {
                "days": 90,
                "label": "1 Quarter (90 Days)",
                "projected_views": project_at_day(90),
                "multiplier": round(project_at_day(90) / max(1.0, base_views), 2),
            },
            "365_days": {
                "days": 365,
                "label": "1 Year (365 Days)",
                "projected_views": project_at_day(365),
                "multiplier": round(project_at_day(365) / max(1.0, base_views), 2),
            },
        },
        "curve": [
            {
                "day": d,
                "projected_views": project_at_day(d),
                "lower_bound": max(0, int(project_at_day(d) - 1596353)),
                "upper_bound": int(project_at_day(d) + 1596353),
            }
            for d in [1, 3, 7, 14, 21, 30, 60, 90, 180, 270, 365]
        ],
    }

    return {
        "metadata": meta,
        "channel_analytics": channel_info,
        "prediction": chosen_pred,
        "simple_prediction": simple_pred,
        "multiple_prediction": mult_pred,
        "benchmark_comparison": benchmark_comp,
        "regression_verdict": verdict,
        "temporal_projections": temporal_proj,
    }
