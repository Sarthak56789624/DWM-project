from fastapi import APIRouter
from app.schemas import OverviewResponse
from app.services.eda import eda_service

router = APIRouter(tags=["Overview"])

@router.get("/overview", response_model=OverviewResponse)
def get_overview():
    """
    Returns an instant statistical overview of the 251k trending Indian YouTube videos,
    including row/column counts, unique videos and channels, median views, missing values,
    and describe() statistics.
    """
    return eda_service.get_overview()
