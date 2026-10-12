from functools import lru_cache
import logging
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from app.config import CATEGORY_MAP
from app.data_loader import data_loader

logger = logging.getLogger("eda_service")

class EDAService:
    @staticmethod
    @lru_cache(maxsize=1)
    def get_overview() -> Dict[str, Any]:
        df = data_loader.df
        meta = data_loader.metadata

        num_cols = ["view_count", "likes", "dislikes", "comment_count", "engagement_rate"]
        desc = df[num_cols].describe().to_dict()

        formatted_summary = {}
        for col, stats in desc.items():
            formatted_summary[col] = {
                "count": float(stats["count"]),
                "mean": round(float(stats["mean"]), 2),
                "std": round(float(stats["std"]), 2),
                "min": round(float(stats["min"]), 2),
                "25%": round(float(stats["25%"]), 2),
                "50%": round(float(stats["50%"]), 2),
                "75%": round(float(stats["75%"]), 2),
                "max": round(float(stats["max"]), 2),
            }

        return {
            "total_rows": meta.get("total_rows", len(df)),
            "total_columns": meta.get("total_columns", 16),
            "unique_videos": meta.get("unique_videos", int(df["video_id"].nunique())),
            "unique_channels": meta.get("unique_channels", int(df["channelTitle"].nunique())),
            "median_views": meta.get("median_views", float(df["view_count"].median())),
            "date_range": {
                "min_trending_date": meta.get("min_trending_date", str(df["trending_date"].min())),
                "max_trending_date": meta.get("max_trending_date", str(df["trending_date"].max())),
                "min_published_date": meta.get("min_published_date", str(df["publishedAt"].min())),
                "max_published_date": meta.get("max_published_date", str(df["publishedAt"].max())),
            },
            "missing_values": meta.get("missing_values", {"channelTitle": 1, "description": 19455}),
            "numerical_summary": formatted_summary,
            "comments_disabled": {
                "count": meta.get("comments_disabled_count", int(df["comments_disabled"].sum())),
                "percentage": round(meta.get("comments_disabled_pct", float(df["comments_disabled"].mean() * 100)), 2),
            },
            "ratings_disabled": {
                "count": meta.get("ratings_disabled_count", int(df["ratings_disabled"].sum())),
                "percentage": round(meta.get("ratings_disabled_pct", float(df["ratings_disabled"].mean() * 100)), 2),
            },
        }

    @staticmethod
    @lru_cache(maxsize=32)
    def get_distribution(metric: str = "view_count", bins: int = 30, is_log: bool = False) -> Dict[str, Any]:
        df = data_loader.df
        if metric not in df.columns:
            metric = "view_count"

        series = df[metric].dropna()
        if is_log:
            data = np.log1p(series.values)
        else:
            data = series.values

        # Histogram
        counts, bin_edges = np.histogram(data, bins=bins)

        # Boxplot calculation (IQR method)
        q1 = float(np.percentile(data, 25))
        median = float(np.percentile(data, 50))
        q3 = float(np.percentile(data, 75))
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        whisker_min = float(np.min(data[data >= lower_bound])) if any(data >= lower_bound) else float(np.min(data))
        whisker_max = float(np.max(data[data <= upper_bound])) if any(data <= upper_bound) else float(np.max(data))
        outliers_count = int(np.sum((data < lower_bound) | (data > upper_bound)))

        return {
            "metric": metric,
            "is_log": is_log,
            "bins": bins,
            "bin_edges": [round(float(e), 4) for e in bin_edges],
            "counts": [int(c) for c in counts],
            "boxplot": {
                "min": round(whisker_min, 4),
                "q1": round(q1, 4),
                "median": round(median, 4),
                "q3": round(q3, 4),
                "max": round(whisker_max, 4),
                "outlier_count": outliers_count,
            },
            "summary": {
                "min": round(float(np.min(data)), 4),
                "max": round(float(np.max(data)), 4),
                "mean": round(float(np.mean(data)), 4),
                "median": round(median, 4),
            },
        }

    @staticmethod
    @lru_cache(maxsize=16)
    def get_top_channels(limit: int = 10) -> List[Dict[str, Any]]:
        df = data_loader.df
        top = df["channelTitle"].value_counts().head(limit)
        return [{"channel": str(ch), "trending_appearances": int(cnt)} for ch, cnt in top.items()]

    @staticmethod
    @lru_cache(maxsize=16)
    def get_avg_views_by_channel(limit: int = 10) -> List[Dict[str, Any]]:
        df = data_loader.df
        top_channels_list = df["channelTitle"].value_counts().head(limit).index
        filtered = df[df["channelTitle"].isin(top_channels_list)]
        avg_views = (
            filtered.groupby("channelTitle", observed=True)["view_count"]
            .mean()
            .sort_values(ascending=False)
        )
        return [{"channel": str(ch), "avg_views": round(float(val), 1)} for ch, val in avg_views.items()]

    @staticmethod
    @lru_cache(maxsize=1)
    def get_categories() -> List[Dict[str, Any]]:
        df = data_loader.df
        counts = df["categoryId"].value_counts().sort_values(ascending=False)
        total = len(df)
        res = []
        for cat_id, cnt in counts.items():
            cat_int = int(cat_id)
            res.append(
                {
                    "categoryId": cat_int,
                    "name": CATEGORY_MAP.get(cat_int, f"Category {cat_int}"),
                    "count": int(cnt),
                    "percentage": round(float(cnt / total * 100), 2),
                }
            )
        return res

    @staticmethod
    @lru_cache(maxsize=1)
    def get_correlation() -> Dict[str, Any]:
        df = data_loader.df
        cols = ["categoryId", "view_count", "likes", "dislikes", "comment_count"]
        corr = df[cols].corr().round(4)
        return {
            "columns": cols,
            "matrix": [[float(corr.loc[r, c]) for c in cols] for r in cols],
        }

    @staticmethod
    @lru_cache(maxsize=32)
    def get_scatter(x: str = "view_count", y: str = "likes", sample_size: int = 3000) -> Dict[str, Any]:
        df = data_loader.df
        if x not in df.columns:
            x = "view_count"
        if y not in df.columns:
            y = "likes"

        sub = df[[x, y]].dropna()
        sampled = sub.sample(n=min(sample_size, len(sub)), random_state=42)

        points = [{"x": float(r[x]), "y": float(r[y])} for _, r in sampled.iterrows()]
        return {
            "x_metric": x,
            "y_metric": y,
            "sample_size": len(points),
            "points": points,
        }

    @staticmethod
    @lru_cache(maxsize=4)
    def get_timeseries(granularity: str = "day") -> Dict[str, Any]:
        df = data_loader.df
        td = df["trending_date"]

        if granularity == "month":
            grouped = df.groupby(td.dt.tz_localize(None).dt.to_period("M"))
        elif granularity == "week":
            grouped = df.groupby(td.dt.tz_localize(None).dt.to_period("W"))
        else:  # day
            granularity = "day"
            grouped = df.groupby(td.dt.date)

        agg = grouped.agg(
            video_count=("view_count", "count"),
            avg_view_count=("view_count", "mean"),
        ).reset_index()

        date_col = agg.columns[0]
        points = []
        for _, row in agg.iterrows():
            points.append(
                {
                    "date": str(row[date_col]),
                    "video_count": int(row["video_count"]),
                    "avg_view_count": round(float(row["avg_view_count"]), 1),
                }
            )

        return {"granularity": granularity, "series": points}

    @staticmethod
    @lru_cache(maxsize=16)
    def get_top_videos(limit: int = 10) -> List[Dict[str, Any]]:
        df = data_loader.df
        top_df = (
            df.sort_values("view_count", ascending=False)
            .drop_duplicates(subset=["video_id"])
            .head(limit)
        )

        res = []
        for _, row in top_df.iterrows():
            vid = str(row["video_id"])
            thumb = data_loader.thumbnails_map.get(
                vid, f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
            )
            res.append(
                {
                    "video_id": vid,
                    "title": str(row["title"]),
                    "channel": str(row["channelTitle"]),
                    "view_count": int(row["view_count"]),
                    "likes": int(row["likes"]),
                    "thumbnail_url": thumb,
                }
            )
        return res

    @staticmethod
    @lru_cache(maxsize=1)
    def get_engagement() -> Dict[str, Any]:
        df = data_loader.df
        eng = df["engagement_rate"].dropna()
        desc = eng.describe().to_dict()

        counts, bin_edges = np.histogram(eng.values, bins=30)

        c_status = df["comments_disabled"].value_counts().to_dict()
        r_status = df["ratings_disabled"].value_counts().to_dict()

        return {
            "describe": {
                "count": float(desc["count"]),
                "mean": round(float(desc["mean"]), 5),
                "std": round(float(desc["std"]), 5),
                "min": round(float(desc["min"]), 5),
                "25%": round(float(desc["25%"]), 5),
                "50%": round(float(desc["50%"]), 5),
                "75%": round(float(desc["75%"]), 5),
                "max": round(float(desc["max"]), 5),
            },
            "histogram": {
                "bin_edges": [round(float(e), 5) for e in bin_edges],
                "counts": [int(c) for c in counts],
            },
            "comments_status": {
                "enabled": int(c_status.get(False, 0)),
                "disabled": int(c_status.get(True, 0)),
            },
            "ratings_status": {
                "enabled": int(r_status.get(False, 0)),
                "disabled": int(r_status.get(True, 0)),
            },
        }

eda_service = EDAService()
