import logging
from typing import Any, Dict, Optional
import numpy as np
import pandas as pd
from app.config import CATEGORY_MAP
from app.data_loader import data_loader

logger = logging.getLogger("channel_analytics")


class ChannelAnalyticsService:
    _instance: Optional["ChannelAnalyticsService"] = None

    def __init__(self):
        self._channel_cache: Optional[Dict[str, Dict[str, Any]]] = None
        self._channel_lookup_lower: Optional[Dict[str, str]] = None
        self._category_benchmarks: Optional[Dict[int, Dict[str, Any]]] = None
        self._overall_median_views: float = 947434.0

    @classmethod
    def get_instance(cls) -> "ChannelAnalyticsService":
        if cls._instance is None:
            cls._instance = ChannelAnalyticsService()
        return cls._instance

    def _ensure_cache(self):
        if self._channel_cache is not None:
            return

        df = data_loader.df
        if df is None:
            logger.warning("DataLoader dataframe not ready for channel analytics.")
            return

        logger.info("Building channel analytics cache from 251k records...")
        self._overall_median_views = float(df["view_count"].median())

        # Category benchmarks
        cat_grouped = df.groupby("categoryId", observed=True).agg(
            total_videos=("view_count", "count"),
            avg_views=("view_count", "mean"),
            median_views=("view_count", "median"),
            avg_likes=("likes", "mean"),
            avg_comments=("comment_count", "mean"),
            avg_engagement=("engagement_rate", "mean"),
            popular_count=("popularity_numeric", "sum"),
        )
        cat_benchmarks = {}
        for cat_id, row in cat_grouped.iterrows():
            cid = int(cat_id)
            pop_rate = float((row["popular_count"] / max(1, row["total_videos"])) * 100)
            cat_benchmarks[cid] = {
                "categoryId": cid,
                "category_name": CATEGORY_MAP.get(cid, f"Category {cid}"),
                "total_videos": int(row["total_videos"]),
                "avg_views": round(float(row["avg_views"]), 1),
                "median_views": round(float(row["median_views"]), 1),
                "avg_likes": round(float(row["avg_likes"]), 1),
                "avg_comments": round(float(row["avg_comments"]), 1),
                "avg_engagement_rate": round(float(row["avg_engagement"] * 100), 2),
                "popularity_rate": round(pop_rate, 1),
            }
        self._category_benchmarks = cat_benchmarks

        # Channel aggregation
        grouped = df.groupby("channelTitle", observed=True).agg(
            appearances=("view_count", "count"),
            unique_videos=("video_id", "nunique"),
            avg_views=("view_count", "mean"),
            median_views=("view_count", "median"),
            avg_likes=("likes", "mean"),
            avg_comments=("comment_count", "mean"),
            avg_engagement=("engagement_rate", "mean"),
            popular_count=("popularity_numeric", "sum"),
            top_category=("categoryId", lambda s: int(s.mode().iloc[0]) if len(s) else 24),
        )

        grouped["popularity_rate"] = (grouped["popular_count"] / grouped["appearances"]) * 100
        # Sort for ranking
        grouped_by_app = grouped.sort_values("appearances", ascending=False)
        rank_app_map = {name: rank + 1 for rank, name in enumerate(grouped_by_app.index)}

        grouped_by_views = grouped.sort_values("avg_views", ascending=False)
        rank_views_map = {name: rank + 1 for rank, name in enumerate(grouped_by_views.index)}

        channel_cache = {}
        lookup_lower = {}

        for ch_name, row in grouped.iterrows():
            name_str = str(ch_name)
            pop_rate = float(row["popularity_rate"])
            app_count = int(row["appearances"])
            avg_v = float(row["avg_views"])
            top_cat_id = int(row["top_category"])

            # Tier assignment
            if app_count >= 1000 or avg_v >= 15_000_000:
                tier = "Tier 1: Mega Broadcaster (Top 1%)"
                badge = "Mega Broadcaster"
                color = "purple"
            elif app_count >= 150 or avg_v >= 4_000_000:
                tier = "Tier 2: Elite Viral Creator"
                badge = "Elite Creator"
                color = "amber"
            elif app_count >= 25 or avg_v >= 1_200_000:
                tier = "Tier 3: Established Trending Star"
                badge = "Established Star"
                color = "emerald"
            else:
                tier = "Tier 4: Occasional Trending Creator"
                badge = "Trending Regular"
                color = "blue"

            # Authority Score (0-100) combining popularity rate, appearances and view volume
            auth_score = min(
                99.0,
                round(
                    (pop_rate * 0.5)
                    + (min(100.0, (app_count / 1000.0) * 100.0) * 0.3)
                    + (min(100.0, (avg_v / 10_000_000.0) * 100.0) * 0.2),
                    1,
                ),
            )

            channel_cache[name_str] = {
                "channel_title": name_str,
                "is_tracked": True,
                "appearances": app_count,
                "unique_videos": int(row["unique_videos"]),
                "avg_views": round(avg_v, 1),
                "median_views": round(float(row["median_views"]), 1),
                "avg_likes": round(float(row["avg_likes"]), 1),
                "avg_comments": round(float(row["avg_comments"]), 1),
                "avg_engagement_rate": round(float(row["avg_engagement"] * 100), 2),
                "popularity_rate": round(pop_rate, 1),
                "channel_tier": tier,
                "tier_badge": badge,
                "tier_color": color,
                "authority_score": auth_score,
                "rank_appearances": rank_app_map.get(name_str, 9999),
                "rank_avg_views": rank_views_map.get(name_str, 9999),
                "dominant_category_id": top_cat_id,
                "dominant_category_name": CATEGORY_MAP.get(top_cat_id, f"Category {top_cat_id}"),
            }
            lookup_lower[name_str.strip().lower()] = name_str

        self._channel_cache = channel_cache
        self._channel_lookup_lower = lookup_lower
        logger.info(f"Cached {len(channel_cache):,} channels for fast analytics lookup.")

    def find_channel_match(self, channel_name: str) -> Optional[str]:
        self._ensure_cache()
        if not self._channel_cache or not channel_name:
            return None

        clean = channel_name.strip()
        lower = clean.lower()

        # 1. Exact case-insensitive match
        if lower in self._channel_lookup_lower:
            return self._channel_lookup_lower[lower]

        # 2. Check if clean name matches directly in cache keys
        if clean in self._channel_cache:
            return clean

        # 3. Substring matching (for channel titles like "Lahari Music | T-Series")
        for key_lower, orig_name in self._channel_lookup_lower.items():
            if len(key_lower) >= 3 and (key_lower in lower or lower in key_lower):
                return orig_name

        return None

    def analyze_channel(
        self,
        channel_name: str,
        video_views: int = 0,
        video_likes: int = 0,
        video_comments: int = 0,
        category_id: int = 24,
    ) -> Dict[str, Any]:
        self._ensure_cache()

        matched_key = self.find_channel_match(channel_name)
        cat_bench = (self._category_benchmarks or {}).get(
            category_id,
            {
                "categoryId": category_id,
                "category_name": CATEGORY_MAP.get(category_id, f"Category {category_id}"),
                "total_videos": 0,
                "avg_views": 1800000.0,
                "median_views": 947434.0,
                "avg_likes": 80000.0,
                "avg_comments": 4500.0,
                "avg_engagement_rate": 4.2,
                "popularity_rate": 50.0,
            },
        )

        video_engagement_rate = round(
            ((video_likes + video_comments) / max(1.0, float(video_views))) * 100, 2
        )

        if matched_key and matched_key in self._channel_cache:
            ch_data = self._channel_cache[matched_key].copy()
            ch_avg_views = max(1.0, ch_data["avg_views"])
            ch_avg_eng = max(0.01, ch_data["avg_engagement_rate"])

            views_ratio = round(video_views / ch_avg_views, 2)
            engagement_ratio = round(video_engagement_rate / ch_avg_eng, 2)

            # Generate insightful channel diagnostic verdict
            pop_rate = ch_data["popularity_rate"]
            apps = ch_data["appearances"]
            ch_title = ch_data["channel_title"]
            badge = ch_data["tier_badge"]

            if pop_rate >= 85.0:
                standing = f"exceptional viral authority ({pop_rate}% of its {apps:,} trending videos exceed median views)"
            elif pop_rate >= 60.0:
                standing = f"strong historical consistency ({pop_rate}% popularity rate across {apps:,} trending videos)"
            else:
                standing = f"moderate trending track record ({pop_rate}% popularity rate across {apps:,} videos)"

            if engagement_ratio >= 1.2:
                eng_note = f"current video engagement ({video_engagement_rate}%) is {engagement_ratio}x higher than the channel baseline"
            elif engagement_ratio <= 0.8:
                eng_note = f"video engagement ({video_engagement_rate}%) is tracking slightly below usual channel benchmarks ({ch_avg_eng}%)"
            else:
                eng_note = f"video engagement is solidly in line with the channel historical standard ({ch_avg_eng}%)"

            verdict = f"{ch_title} is a {badge} with {standing}. The {eng_note}."

            ch_data.update(
                {
                    "matched_channel": matched_key,
                    "video_views_ratio": views_ratio,
                    "video_engagement_ratio": engagement_ratio,
                    "video_engagement_rate": video_engagement_rate,
                    "channel_verdict": verdict,
                    "category_benchmark": cat_bench,
                }
            )
            return ch_data

        # Fallback for uncatalogued / emerging creator
        cat_name = cat_bench.get("category_name", "Entertainment")
        cat_avg_views = max(1.0, cat_bench["avg_views"])
        cat_avg_eng = max(0.01, cat_bench["avg_engagement_rate"])

        views_ratio = round(video_views / cat_avg_views, 2)
        engagement_ratio = round(video_engagement_rate / cat_avg_eng, 2)

        verdict = (
            f"'{channel_name}' is an emerging creator not yet logged in India's top 251k trending dataset. "
            f"Evaluated against {cat_name} category standards (category average: {cat_avg_views:,.0f} views, "
            f"{cat_bench['popularity_rate']}% popularity rate)."
        )

        return {
            "channel_title": channel_name,
            "matched_channel": None,
            "is_tracked": False,
            "appearances": 0,
            "unique_videos": 0,
            "avg_views": cat_bench["avg_views"],
            "median_views": cat_bench["median_views"],
            "avg_likes": cat_bench["avg_likes"],
            "avg_comments": cat_bench["avg_comments"],
            "avg_engagement_rate": cat_bench["avg_engagement_rate"],
            "popularity_rate": cat_bench["popularity_rate"],
            "channel_tier": "Emerging Creator (Outside Trending Dataset)",
            "tier_badge": "Emerging Creator",
            "tier_color": "slate",
            "authority_score": 35.0,
            "rank_appearances": None,
            "rank_avg_views": None,
            "dominant_category_id": category_id,
            "dominant_category_name": cat_name,
            "video_views_ratio": views_ratio,
            "video_engagement_ratio": engagement_ratio,
            "video_engagement_rate": video_engagement_rate,
            "channel_verdict": verdict,
            "category_benchmark": cat_bench,
        }


channel_analytics_service = ChannelAnalyticsService.get_instance()
