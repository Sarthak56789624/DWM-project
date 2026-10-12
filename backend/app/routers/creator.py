import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.config import CATEGORY_MAP
from app.data_loader import data_loader
from app.services.ml import MLService

router = APIRouter(prefix="/creator", tags=["Creator Simulator"])

class SimulationRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, example="Pathaan Official Trailer | Shah Rukh Khan | Deepika Padukone")
    categoryId: int = Field(default=24, ge=1, le=50, example=24)
    planned_day: str = Field(default="Friday", example="Friday")
    planned_hour_ist: int = Field(default=18, ge=0, le=23, example=18)
    expected_likes: int = Field(default=150000, ge=0, example=150000)
    expected_dislikes: int = Field(default=2000, ge=0, example=2000)
    expected_comments: int = Field(default=12000, ge=0, example=12000)
    planned_tags: Optional[str] = Field(default="", example="bollywood, trailer, action")

@router.post("/simulate")
def simulate_video_performance(req: SimulationRequest):
    """
    Simulates video virality potential using ML models, category timing heatmaps,
    and title/tag heuristics from the 251k trending records.
    """
    category_id_str = str(req.categoryId)
    category_name = CATEGORY_MAP.get(req.categoryId, f"Category {req.categoryId}")
    timing_profiles = data_loader.timing_profiles
    cat_timing = timing_profiles.get(category_id_str, {})

    # 1. ML Predictions
    ml_reg = MLService.predict_regression(
        likes=req.expected_likes,
        dislikes=req.expected_dislikes,
        comment_count=req.expected_comments,
        model="multiple"
    )
    predicted_views = ml_reg["predicted_views"]

    ml_clf = MLService.predict_classification(
        likes=req.expected_likes,
        dislikes=req.expected_dislikes,
        comment_count=req.expected_comments,
        categoryId=req.categoryId,
        model="decision_tree"
    )
    pop_prob = ml_clf["probabilities"].get("Popular", 0.5)

    # 2. Timing Analysis
    day_normalized = req.planned_day.capitalize()
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    if day_normalized not in days_order:
        day_normalized = "Friday"
    day_idx = days_order.index(day_normalized)

    # Find heatmap score for (planned_hour, day_idx)
    timing_score = 50.0
    grid = cat_timing.get("heatmap_grid", [])
    for item in grid:
        if len(item) == 3 and item[0] == req.planned_hour_ist and item[1] == day_idx:
            timing_score = float(item[2])
            break

    best_day = cat_timing.get("best_day", "Thursday")
    best_hour = cat_timing.get("best_hour_ist", 17)
    best_window = cat_timing.get("best_window", "17:00 - 19:00 IST")

    # 3. Title Heuristics
    title = req.title.strip()
    title_len = len(title)
    upper_chars = sum(1 for c in title if c.isupper())
    upper_ratio = upper_chars / title_len if title_len > 0 else 0

    hype_keywords = ["official", "trailer", "teaser", "first look", "full video", "live", "episode", "highlights", "review", "vlog", "challenge", "song"]
    detected_hype = [k for k in hype_keywords if re.search(rf"\b{k}\b", title, re.IGNORECASE)]

    title_score = 60.0
    title_tips = []
    if 35 <= title_len <= 85:
        title_score += 15.0
    elif title_len < 25:
        title_tips.append("Title is short. Adding creator name or event context increases search visibility.")
    else:
        title_tips.append("Title exceeds 85 characters; mobile viewers might see truncation.")

    if 0.15 <= upper_ratio <= 0.60:
        title_score += 15.0
    elif upper_ratio > 0.75:
        title_tips.append("Title is largely ALL-CAPS. Moderate caps improve readability.")

    if detected_hype:
        title_score += 10.0
    else:
        title_tips.append("Consider adding release tags like 'Official Video', 'Trailer', or 'Ep' for indexing.")

    title_score = min(100.0, max(20.0, title_score))

    # 4. Tags Suggestions
    input_tags = set([t.strip().lower() for t in re.split(r"[,|]", req.planned_tags) if len(t.strip()) > 1])
    cat_suggested = cat_timing.get("suggested_tags", [])
    recommended_tags = [t for t in cat_suggested if t not in input_tags][:8]

    # 5. Composite Virality Index (0-100)
    # Weightings: 45% ML Popularity Probability, 25% Engagement Magnitude, 15% Timing, 15% Title Score
    engagement_factor = min(100.0, (req.expected_likes / 150000) * 80 + (req.expected_comments / 5000) * 20)
    virality_index = round(
        (pop_prob * 100 * 0.40) +
        (engagement_factor * 0.25) +
        (timing_score * 0.20) +
        (title_score * 0.15),
        1
    )
    virality_index = min(99.9, max(15.0, virality_index))

    # Determine Virality Tier
    if virality_index >= 85:
        tier = "Viral Supernova"
        tier_color = "emerald"
        tier_description = "Extremely high probability of landing in the top trending rankings within 24 hours."
    elif virality_index >= 70:
        tier = "High Trending Potential"
        tier_color = "blue"
        tier_description = "Strong engagement indicators with favorable category velocity."
    elif virality_index >= 50:
        tier = "Moderate Traction"
        tier_color = "amber"
        tier_description = "Solid base performance. Optimizing publish time and tags could boost reach."
    else:
        tier = "Niche / Steady Growth"
        tier_color = "slate"
        tier_description = "Lower engagement metrics compared to historical trending medians for this category."

    return {
        "virality_index": virality_index,
        "tier": tier,
        "tier_color": tier_color,
        "tier_description": tier_description,
        "predicted_metrics": {
            "predicted_views": predicted_views,
            "predicted_views_range": {
                "low": max(0, int(predicted_views * 0.75)),
                "mid": int(predicted_views),
                "high": int(predicted_views * 1.35),
            },
            "popularity_classification": ml_clf["predicted_class"],
            "popularity_probability": pop_prob,
        },
        "timing_insights": {
            "selected_day": day_normalized,
            "selected_hour_ist": req.planned_hour_ist,
            "timing_score": timing_score,
            "category_best_day": best_day,
            "category_best_window": best_window,
            "is_timing_optimal": timing_score >= 70.0,
            "timing_advice": f"In {category_name}, historical peak virality occurs on {best_day} around {best_window}.",
        },
        "title_analysis": {
            "title_score": round(title_score, 1),
            "character_count": title_len,
            "uppercase_ratio": round(upper_ratio * 100, 1),
            "detected_keywords": detected_hype,
            "suggestions": title_tips,
        },
        "tag_recommendations": {
            "current_tags": list(input_tags),
            "recommended_tags": recommended_tags,
        },
    }

@router.get("/timing/{category_id}")
def get_category_timing(category_id: int):
    """
    Returns full 24x7 heatmap grid and timing statistics for a given category.
    """
    timing_profiles = data_loader.timing_profiles
    cat_str = str(category_id)
    if cat_str not in timing_profiles:
        raise HTTPException(status_code=404, detail=f"Category {category_id} not found in timing profiles")
    return timing_profiles[cat_str]
