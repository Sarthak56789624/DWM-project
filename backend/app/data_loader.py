import json
import logging
import time
from typing import Any, Dict, Optional
import joblib
import pandas as pd
from app.config import (
    ASSOCIATION_RULES_PATH,
    BASE_DIR,
    METRICS_PATH,
    MODELS_DIR,
    PARQUET_PATH,
    SEARCH_DATA_PATH,
    TIMING_PROFILES_PATH,
)

logger = logging.getLogger("data_loader")

class DataLoader:
    _instance: Optional["DataLoader"] = None

    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.metadata: Dict[str, Any] = {}
        self.metrics: Dict[str, Any] = {}
        self.thumbnails_map: Dict[str, str] = {}
        self.models: Dict[str, Any] = {}
        self.association_rules: Dict[str, Any] = {}
        self.timing_profiles: Dict[str, Any] = {}
        self.load_time: float = 0.0
        self.loaded_at: float = 0.0

    @classmethod
    def get_instance(cls) -> "DataLoader":
        if cls._instance is None:
            cls._instance = DataLoader()
        return cls._instance

    def load_all(self):
        start_time = time.time()
        logger.info("Initializing DataLoader and caching dataset into memory...")

        # 1. Load main Parquet
        logger.info(f"Loading main parquet from {PARQUET_PATH}...")
        self.df = pd.read_parquet(PARQUET_PATH)
        logger.info(f"Loaded {len(self.df):,} rows into memory.")

        # 2. Load metadata JSON
        metadata_file = PARQUET_PATH.parent / "metadata.json"
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

        # 3. Load metrics JSON
        if METRICS_PATH.exists():
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                self.metrics = json.load(f)

        # 3b. Load Association Rules JSON
        if ASSOCIATION_RULES_PATH.exists():
            try:
                with open(ASSOCIATION_RULES_PATH, "r", encoding="utf-8") as f:
                    self.association_rules = json.load(f)
                logger.info(f"Loaded {self.association_rules.get('unique_mined_rules', 0):,} mined association rules.")
            except Exception as e:
                logger.warning(f"Failed to load association rules: {e}")

        # 3c. Load Category Timing Profiles JSON
        if TIMING_PROFILES_PATH.exists():
            try:
                with open(TIMING_PROFILES_PATH, "r", encoding="utf-8") as f:
                    self.timing_profiles = json.load(f)
                logger.info(f"Loaded timing profiles for {len(self.timing_profiles)} categories.")
            except Exception as e:
                logger.warning(f"Failed to load timing profiles: {e}")

        # 4. Load thumbnails map from search parquet if available
        if SEARCH_DATA_PATH.exists():
            try:
                logger.info("Loading thumbnails map for top videos...")
                search_df = pd.read_parquet(SEARCH_DATA_PATH, columns=["video_id", "thumbnail_link"])
                # Keep first thumbnail for unique video_ids
                unique_thumbs = search_df.drop_duplicates(subset=["video_id"])
                self.thumbnails_map = dict(zip(unique_thumbs["video_id"], unique_thumbs["thumbnail_link"]))
                logger.info(f"Cached {len(self.thumbnails_map):,} thumbnail links.")
            except Exception as e:
                logger.warning(f"Failed to load search parquet: {e}")

        # 5. Load Scikit-Learn Models
        model_names = [
            ("simple_linear_regression", "simple_linear_regression.joblib"),
            ("multiple_linear_regression", "multiple_linear_regression.joblib"),
            ("decision_tree", "decision_tree.joblib"),
            ("gaussian_nb", "gaussian_nb.joblib"),
            ("scaler", "scaler.joblib"),
            ("kmeans", "kmeans.joblib"),
            ("pca", "pca.joblib"),
            ("scaler_log", "scaler_log.joblib"),
            ("kmeans_log", "kmeans_log.joblib"),
            ("pca_log", "pca_log.joblib"),
        ]

        for key, fname in model_names:
            model_path = MODELS_DIR / fname
            if model_path.exists():
                self.models[key] = joblib.load(model_path)
                logger.info(f"Loaded model '{key}' from {model_path.name}")
            else:
                logger.warning(f"Model file {fname} not found in {MODELS_DIR}")

        self.load_time = time.time() - start_time
        self.loaded_at = time.time()
        logger.info(f"DataLoader warmup complete in {self.load_time:.2f} seconds.")

data_loader = DataLoader.get_instance()
