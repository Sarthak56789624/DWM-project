from fastapi import APIRouter
from app.schemas import (
    ClassificationMetricsResponse,
    ClassificationPredictRequest,
    ClassificationPredictResponse,
)
from app.services.ml import ml_service

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
