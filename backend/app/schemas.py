from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# ----------------- General & Meta -----------------
class ErrorResponse(BaseModel):
    error: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    data_loaded: bool
    total_rows: int

class MetaResponse(BaseModel):
    app_name: str
    version: str
    dataset: str
    date_range: Dict[str, str]
    total_rows: int
    models_available: List[str]
    cache_info: Dict[str, Any]

# ----------------- Overview -----------------
class OverviewResponse(BaseModel):
    total_rows: int
    total_columns: int
    unique_videos: int
    unique_channels: int
    median_views: float
    date_range: Dict[str, str]
    missing_values: Dict[str, int]
    numerical_summary: Dict[str, Dict[str, float]]
    comments_disabled: Dict[str, Any]
    ratings_disabled: Dict[str, Any]

# ----------------- Distributions -----------------
class BoxPlotStats(BaseModel):
    min: float
    q1: float
    median: float
    q3: float
    max: float
    outlier_count: int

class DistributionResponse(BaseModel):
    metric: str
    is_log: bool
    bins: int
    bin_edges: List[float]
    counts: List[int]
    boxplot: BoxPlotStats
    summary: Dict[str, float]

# ----------------- Channels & Categories -----------------
class ChannelCount(BaseModel):
    channel: str
    trending_appearances: int

class ChannelAvgViews(BaseModel):
    channel: str
    avg_views: float

class CategoryItem(BaseModel):
    categoryId: int
    name: str
    count: int
    percentage: float

# ----------------- Relationships -----------------
class CorrelationResponse(BaseModel):
    columns: List[str]
    matrix: List[List[float]]

class ScatterPoint(BaseModel):
    x: float
    y: float

class ScatterResponse(BaseModel):
    x_metric: str
    y_metric: str
    sample_size: int
    points: List[ScatterPoint]

# ----------------- Time Series -----------------
class TimeSeriesPoint(BaseModel):
    date: str
    video_count: int
    avg_view_count: float

class TimeSeriesResponse(BaseModel):
    granularity: str
    series: List[TimeSeriesPoint]

# ----------------- Top Videos & Engagement -----------------
class TopVideoItem(BaseModel):
    video_id: str
    title: str
    channel: str
    view_count: int
    likes: int
    thumbnail_url: str

class EngagementResponse(BaseModel):
    describe: Dict[str, float]
    histogram: Dict[str, Any]
    comments_status: Dict[str, int]
    ratings_status: Dict[str, int]

# ----------------- Regression -----------------
class RegressionPredictRequest(BaseModel):
    likes: int = Field(ge=0, description="Likes count")
    dislikes: int = Field(default=0, ge=0, description="Dislikes count")
    comment_count: int = Field(default=0, ge=0, description="Comment count")
    model: str = Field(default="simple", pattern="^(simple|multiple)$")

class RegressionPredictResponse(BaseModel):
    model: str
    predicted_views: float
    inputs: Dict[str, int]

class RegressionMetricsResponse(BaseModel):
    simple: Dict[str, Any]
    multiple: Dict[str, Any]

# ----------------- Classification -----------------
class ClassificationPredictRequest(BaseModel):
    likes: int = Field(ge=0, description="Likes count")
    dislikes: int = Field(default=0, ge=0, description="Dislikes count")
    comment_count: int = Field(default=0, ge=0, description="Comment count")
    categoryId: int = Field(default=24, ge=1, le=100, description="YouTube Category ID")
    model: str = Field(default="decision_tree", pattern="^(decision_tree|naive_bayes)$")

class ClassificationPredictResponse(BaseModel):
    model: str
    predicted_class: str
    probabilities: Dict[str, float]
    inputs: Dict[str, Any]

class ClassificationMetricsResponse(BaseModel):
    decision_tree: Dict[str, Any]
    naive_bayes: Dict[str, Any]

class ClassificationURLRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL or Video ID")
    model: str = Field(default="decision_tree", pattern="^(decision_tree|naive_bayes)$")
    categoryId: Optional[int] = Field(default=None, ge=1, le=100)

class ChannelAnalyticsResponse(BaseModel):
    channel_title: str
    matched_channel: Optional[str] = None
    is_tracked: bool
    appearances: int
    unique_videos: int
    avg_views: float
    median_views: float
    avg_likes: float
    avg_comments: float
    avg_engagement_rate: float
    popularity_rate: float
    channel_tier: str
    tier_badge: str
    tier_color: str
    authority_score: float
    rank_appearances: Optional[int] = None
    rank_avg_views: Optional[int] = None
    dominant_category_id: int
    dominant_category_name: str
    video_views_ratio: float
    video_engagement_ratio: float
    video_engagement_rate: float
    channel_verdict: str
    category_benchmark: Dict[str, Any]

class ClassificationURLResponse(BaseModel):
    metadata: Dict[str, Any]
    channel_analytics: ChannelAnalyticsResponse
    classification: Dict[str, Any]
    benchmark_comparison: Dict[str, Any]

# ----------------- Clustering -----------------
class ClusteringAssignRequest(BaseModel):
    view_count: int = Field(ge=0, description="View count")
    likes: int = Field(ge=0, description="Likes count")
    dislikes: int = Field(default=0, ge=0, description="Dislikes count")
    comment_count: int = Field(default=0, ge=0, description="Comment count")
    log_transform: bool = Field(default=False)

class ClusteringAssignResponse(BaseModel):
    cluster_id: int
    is_log_transformed: bool
    cluster_profile: Dict[str, Any]

class ClusteringSummaryResponse(BaseModel):
    standard: Dict[str, Any]
    log_transformed: Dict[str, Any]
