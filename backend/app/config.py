import os
from pathlib import Path
from typing import List, Dict

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_DATA_PATH = Path(os.getenv("RAW_DATA_PATH", BASE_DIR / "data" / "raw" / "IN_youtube_trending_data.csv"))
if not RAW_DATA_PATH.exists() and (BASE_DIR.parent / "IN_youtube_trending_data.csv").exists():
    RAW_DATA_PATH = BASE_DIR.parent / "IN_youtube_trending_data.csv"

PROCESSED_DATA_PATH = Path(os.getenv("PROCESSED_DATA_PATH", BASE_DIR / "data" / "processed" / "trending.parquet"))
PARQUET_PATH = PROCESSED_DATA_PATH
SEARCH_DATA_PATH = Path(os.getenv("SEARCH_DATA_PATH", BASE_DIR / "data" / "processed" / "search_metadata.parquet"))
ASSOCIATION_RULES_PATH = Path(os.getenv("ASSOCIATION_RULES_PATH", BASE_DIR / "data" / "processed" / "association_rules.json"))
TIMING_PROFILES_PATH = Path(os.getenv("TIMING_PROFILES_PATH", BASE_DIR / "data" / "processed" / "category_timing_profiles.json"))
MODELS_DIR = Path(os.getenv("MODELS_DIR", BASE_DIR / "models"))
METRICS_PATH = MODELS_DIR / "metrics.json"

API_PREFIX = os.getenv("API_PREFIX", "/api/v1")
CORS_ORIGINS: List[str] = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

CATEGORY_MAP: Dict[int, str] = {
    1: "Film & Animation",
    2: "Autos & Vehicles",
    10: "Music",
    15: "Pets & Animals",
    17: "Sports",
    18: "Short Movies",
    19: "Travel & Events",
    20: "Gaming",
    21: "Videoblogging",
    22: "People & Blogs",
    23: "Comedy",
    24: "Entertainment",
    25: "News & Politics",
    26: "Howto & Style",
    27: "Education",
    28: "Science & Technology",
    29: "Nonprofits & Activism",
    30: "Movies",
    31: "Anime/Animation",
    32: "Action/Adventure",
    33: "Classics",
    34: "Comedy",
    43: "Shows",
    44: "Trailers"
}
