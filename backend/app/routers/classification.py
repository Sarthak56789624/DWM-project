from fastapi import APIRouter, HTTPException
from app.data_loader import data_loader
from app.schemas import (
    ClassificationMetricsResponse,
    ClassificationPredictRequest,
    ClassificationPredictResponse,
    ClassificationURLRequest,
    ClassificationURLResponse,
)
from app.services.channel_analytics import channel_analytics_service
from app.services.ml import ml_service
from app.services.youtube_fetcher import extract_video_id, fetch_youtube_metadata

router = APIRouter(prefix="/classification", tags=["Classification"])

@router.get("/metrics", response_model=ClassificationMetricsResponse)
def get_classification_metrics():
    """
    Returns accuracy, precision, recall, F1, confusion matrices, feature importances,
    and recursive decision tree structure for Decision Tree and Gaussian Naive Bayes classifiers.
    """
    return ml_service.get_classification_metrics()

@router.post("/predict", response_model=ClassificationPredictResponse)
def predict_classification(payload: ClassificationPredictRequest):
    """
    Classifies a video as Popular or Not Popular based on early signals (likes, dislikes, comments, category).
    """
    return ml_service.predict_classification(
        likes=payload.likes,
        dislikes=payload.dislikes,
        comment_count=payload.comment_count,
        categoryId=payload.categoryId,
        model=payload.model,
    )

@router.post("/predict-url", response_model=ClassificationURLResponse)
async def predict_classification_by_url(payload: ClassificationURLRequest):
    """
    Automatically fetches live YouTube video values and channel historical analytics,
    then predicts popularity status using Decision Tree / Gaussian Naive Bayes classifiers.
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

    # 2. Run both ML Models
    dt_res = ml_service.predict_classification(
        likes=meta["likes"],
        dislikes=meta["dislikes"],
        comment_count=meta["comment_count"],
        categoryId=cat_id,
        model="decision_tree",
    )
    nb_res = ml_service.predict_classification(
        likes=meta["likes"],
        dislikes=meta["dislikes"],
        comment_count=meta["comment_count"],
        categoryId=cat_id,
        model="naive_bayes",
    )

    chosen_res = dt_res if payload.model == "decision_tree" else nb_res
    predicted_class = chosen_res["predicted_class"]
    pop_prob = chosen_res["probabilities"].get("Popular", 0.0)

    # 3. Channel & Model Analytical Verdict Synthesis
    ch_pop_rate = channel_info.get("popularity_rate", 50.0)
    ch_title = channel_info.get("channel_title", "Channel")
    is_tracked = channel_info.get("is_tracked", False)
    eng_ratio = channel_info.get("video_engagement_ratio", 1.0)
    model_name = "Decision Tree (82.2% Acc)" if payload.model == "decision_tree" else "Gaussian Naïve Bayes (74.4% Acc)"

    if predicted_class == "Popular":
        if is_tracked and ch_pop_rate >= 75.0:
            verdict = (
                f"High-Confidence Viral Consensus: {model_name} projects 'Popular' status with "
                f"{pop_prob * 100:.1f}% probability. This is strongly reinforced by {ch_title}'s "
                f"exceptional {ch_pop_rate:.1f}% historical popularity rate across "
                f"{channel_info['appearances']:,} trending videos. Engagement velocity is {eng_ratio}x "
                f"relative to channel baseline."
            )
        elif is_tracked:
            verdict = (
                f"Popular Projection: {model_name} classifies as 'Popular' ({pop_prob * 100:.1f}% probability) "
                f"driven by strong early interaction metrics ({meta['likes']:,} likes, {meta['comment_count']:,} comments). "
                f"{ch_title} holds a {ch_pop_rate:.1f}% historical trending baseline."
            )
        else:
            verdict = (
                f"Organic Engagement Virality: {model_name} predicts 'Popular' ({pop_prob * 100:.1f}% probability) "
                f"based on strong engagement volume ({meta['likes']:,} likes) exceeding Category {cat_id} thresholds, "
                f"projecting the video to surpass the 947k median view cutoff."
            )
    else:
        if is_tracked and ch_pop_rate >= 80.0:
            verdict = (
                f"Under-Baseline Warning: {model_name} projects 'Not Popular' ({chosen_res['probabilities'].get('Not Popular', 0.0) * 100:.1f}%), "
                f"as current interaction velocity ({meta['likes']:,} likes) is tracking below the high threshold required, "
                f"even though {ch_title} historically achieves {ch_pop_rate:.1f}% popularity."
            )
        else:
            verdict = (
                f"Sub-Median Trajectory: {model_name} classifies as 'Not Popular' "
                f"({chosen_res['probabilities'].get('Not Popular', 0.0) * 100:.1f}% probability). Current interaction signals "
                f"({meta['likes']:,} likes, {meta['comment_count']:,} comments) are insufficient to reach the 947k Indian trending median threshold."
            )

    # 4. Percentile Rank in 251k records
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

    classification_payload = {
        "model": payload.model,
        "predicted_class": predicted_class,
        "probabilities": chosen_res["probabilities"],
        "inputs": chosen_res["inputs"],
        "decision_tree": {
            "predicted_class": dt_res["predicted_class"],
            "probabilities": dt_res["probabilities"],
        },
        "naive_bayes": {
            "predicted_class": nb_res["predicted_class"],
            "probabilities": nb_res["probabilities"],
        },
        "analytical_verdict": verdict,
    }

    benchmark_summary = {
        "median_threshold": 947434,
        "actual_views": meta["view_count"],
        "exceeds_threshold": meta["view_count"] >= 947434,
        "percentile_rank": percentile,
        "virality_grade": grade,
    }

    return {
        "metadata": meta,
        "channel_analytics": channel_info,
        "classification": classification_payload,
        "benchmark_comparison": benchmark_summary,
    }
