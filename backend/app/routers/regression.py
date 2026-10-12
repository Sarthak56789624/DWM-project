from fastapi import APIRouter
from app.schemas import (
    RegressionMetricsResponse,
    RegressionPredictRequest,
    RegressionPredictResponse,
)
from app.services.ml import ml_service

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
