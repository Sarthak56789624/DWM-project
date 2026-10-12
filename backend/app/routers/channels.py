from typing import List
from fastapi import APIRouter, Query
from app.schemas import ChannelAvgViews, ChannelCount
from app.services.eda import eda_service

router = APIRouter(prefix="/channels", tags=["Channels"])

@router.get("/top", response_model=List[ChannelCount])
def get_top_channels(limit: int = Query(default=10, ge=1, le=100)):
    """
    Returns the top YouTube channels with the highest number of trending video appearances.
    """
    return eda_service.get_top_channels(limit=limit)

@router.get("/avg-views", response_model=List[ChannelAvgViews])
def get_channel_avg_views(limit: int = Query(default=10, ge=1, le=100)):
    """
    Returns the average views of the top trending YouTube channels (notebook cell 17 logic).
    """
    return eda_service.get_avg_views_by_channel(limit=limit)
