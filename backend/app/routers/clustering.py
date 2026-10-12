from fastapi import APIRouter
from app.schemas import (
    ClusteringAssignRequest,
    ClusteringAssignResponse,
    ClusteringSummaryResponse,
)
from app.services.ml import ml_service

router = APIRouter(prefix="/clustering", tags=["Clustering"])

@router.get("/summary", response_model=ClusteringSummaryResponse)
def get_clustering_summary():
    """
    Returns elbow inertia curves (K=2..10), silhouette scores, cluster profiles,
    and 2D PCA projections for both standard and log1p-transformed K-Means models.
    """
    return ml_service.get_clustering_summary()

@router.post("/assign", response_model=ClusteringAssignResponse)
def assign_cluster(payload: ClusteringAssignRequest):
    """
    Assigns a video to a cluster profile based on view_count, likes, dislikes, and comments.
    Supports ?log_transform=true for balanced clustering.
    """
    return ml_service.assign_cluster(
        view_count=payload.view_count,
        likes=payload.likes,
        dislikes=payload.dislikes,
        comment_count=payload.comment_count,
        log_transform=payload.log_transform,
    )
