from fastapi import APIRouter, Query
from app.schemas import TimeSeriesResponse
from app.services.eda import eda_service

router = APIRouter(prefix="/timeseries", tags=["Time Series"])

@router.get("/daily", response_model=TimeSeriesResponse)
def get_timeseries(
    granularity: str = Query(default="day", pattern="^(day|week|month)$", description="Aggregation level")
):
    """
    Returns time series trend of video count and average views across trending dates.
    Supports day, week, and month granularities.
    """
    return eda_service.get_timeseries(granularity=granularity)
