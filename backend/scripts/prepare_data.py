import json
import logging
import os
import sys
from pathlib import Path
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("prepare_data")

# Setup paths
SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parent
RAW_PATH = BASE_DIR / "data" / "raw" / "IN_youtube_trending_data.csv"
if not RAW_PATH.exists() and (BASE_DIR.parent / "IN_youtube_trending_data.csv").exists():
    RAW_PATH = BASE_DIR.parent / "IN_youtube_trending_data.csv"

PROCESSED_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
PARQUET_PATH = PROCESSED_DIR / "trending.parquet"
SEARCH_PARQUET_PATH = PROCESSED_DIR / "search_metadata.parquet"
METADATA_PATH = PROCESSED_DIR / "metadata.json"

def prepare_data():
    logger.info(f"Reading raw CSV from: {RAW_PATH}")
    if not RAW_PATH.exists():
        logger.error(f"Raw data file not found at {RAW_PATH}")
        sys.exit(1)

    # Read CSV
    df = pd.read_csv(RAW_PATH)
    logger.info(f"Loaded {len(df):,} rows with {df.shape[1]} columns")

    # Missing values check
    missing = df.isnull().sum()
    logger.info("Missing values per column:\n" + str(missing[missing > 0]))

    # Datetime parsing (tz-aware UTC)
    logger.info("Parsing datetime columns publishedAt and trending_date...")
    df["publishedAt"] = pd.to_datetime(df["publishedAt"], utc=True)
    df["trending_date"] = pd.to_datetime(df["trending_date"], utc=True)

    # Compute engagement_rate
    logger.info("Computing engagement_rate...")
    denom = df["view_count"].replace(0, np.nan)
    df["engagement_rate"] = (df["likes"] + df["comment_count"]) / denom
    df["engagement_rate"] = df["engagement_rate"].replace([np.inf, -np.inf], 0.0).fillna(0.0)

    # Compute median view_count for popularity target
    median_views = float(df["view_count"].median())
    logger.info(f"Median view_count: {median_views:,.1f}")

    # Add popularity and popularity_numeric
    df["popularity"] = np.where(df["view_count"] >= median_views, "Popular", "Not Popular")
    df["popularity_numeric"] = (df["popularity"] == "Popular").astype(np.int8)

    # Separate search and text metadata (description, tags, thumbnail_link)
    search_df = df[["video_id", "title", "channelTitle", "tags", "thumbnail_link", "description"]].copy()
    logger.info(f"Saving search metadata parquet to {SEARCH_PARQUET_PATH}...")
    search_df.to_parquet(SEARCH_PARQUET_PATH, index=False, compression="snappy")

    # Drop heavy columns for the main analytics parquet
    df_main = df.drop(columns=["thumbnail_link", "description", "tags"]).copy()

    # Downcast types
    df_main["view_count"] = df_main["view_count"].astype(np.int64)
    df_main["likes"] = df_main["likes"].astype(np.int64)
    df_main["dislikes"] = df_main["dislikes"].astype(np.int64)
    df_main["comment_count"] = df_main["comment_count"].astype(np.int64)
    df_main["categoryId"] = df_main["categoryId"].astype(np.int32)
    df_main["channelTitle"] = df_main["channelTitle"].fillna("Unknown").astype("category")
    df_main["comments_disabled"] = df_main["comments_disabled"].astype(bool)
    df_main["ratings_disabled"] = df_main["ratings_disabled"].astype(bool)

    # Save metadata summary
    metadata = {
        "total_rows": int(len(df_main)),
        "total_columns": int(df.shape[1]),
        "unique_videos": int(df_main["video_id"].nunique()),
        "unique_channels": int(df_main["channelTitle"].nunique()),
        "median_views": median_views,
        "min_trending_date": df_main["trending_date"].min().isoformat(),
        "max_trending_date": df_main["trending_date"].max().isoformat(),
        "min_published_date": df_main["publishedAt"].min().isoformat(),
        "max_published_date": df_main["publishedAt"].max().isoformat(),
        "missing_values": {k: int(v) for k, v in missing.items()},
        "comments_disabled_count": int(df_main["comments_disabled"].sum()),
        "comments_disabled_pct": float(df_main["comments_disabled"].mean() * 100),
        "ratings_disabled_count": int(df_main["ratings_disabled"].sum()),
        "ratings_disabled_pct": float(df_main["ratings_disabled"].mean() * 100)
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved metadata to {METADATA_PATH}")

    # Save to parquet
    logger.info(f"Saving main parquet to {PARQUET_PATH}...")
    df_main.to_parquet(PARQUET_PATH, index=False, compression="snappy")
    parquet_size_mb = os.path.getsize(PARQUET_PATH) / (1024 * 1024)
    logger.info(f"Main parquet saved! Size: {parquet_size_mb:.2f} MB (vs ~420 MB raw CSV)")
    print("DATA PREPARATION COMPLETE.")

if __name__ == "__main__":
    prepare_data()
