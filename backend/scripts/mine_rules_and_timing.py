import json
import logging
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("miner")

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
SEARCH_PARQUET = PROCESSED_DIR / "search_metadata.parquet"
TRENDING_PARQUET = PROCESSED_DIR / "trending.parquet"
RULES_OUTPUT = PROCESSED_DIR / "association_rules.json"
TIMING_OUTPUT = PROCESSED_DIR / "category_timing_profiles.json"

CATEGORY_MAP = {
    1: "Film & Animation",
    2: "Autos & Vehicles",
    10: "Music",
    15: "Pets & Animals",
    17: "Sports",
    20: "Gaming",
    22: "People & Blogs",
    23: "Comedy",
    24: "Entertainment",
    25: "News & Politics",
    26: "Howto & Style",
    27: "Education",
    28: "Science & Technology",
}

def clean_tag(t: str) -> str:
    cleaned = t.strip().lower()
    if cleaned in {"[none]", "none", "", "nan", "null"}:
        return ""
    # Remove leading/trailing quotes or brackets
    cleaned = cleaned.strip("\"'[]{}")
    if len(cleaned) < 2 or len(cleaned) > 40:
        return ""
    return cleaned

def mine_association_rules():
    logger.info("Loading dataset for tag association mining...")
    search_df = pd.read_parquet(SEARCH_PARQUET, columns=["video_id", "tags"])
    trending_df = pd.read_parquet(TRENDING_PARQUET, columns=["video_id", "categoryId", "publishedAt", "view_count", "likes"])

    # Merge on video_id and deduplicate by video_id
    logger.info("Merging and deduplicating unique videos...")
    df = pd.merge(trending_df, search_df, on="video_id", how="inner").drop_duplicates(subset=["video_id"])
    total_videos = len(df)
    logger.info(f"Unique videos to mine: {total_videos:,}")

    # 1. Process Transactions
    transactions = []
    category_transactions = defaultdict(list)
    tag_counts = Counter()

    for _, row in df.iterrows():
        raw_tags = str(row.get("tags", ""))
        cat_id = int(row.get("categoryId", 24))
        if not raw_tags or raw_tags == "[None]":
            continue
        cleaned = set()
        for t in raw_tags.split("|"):
            ct = clean_tag(t)
            if ct:
                cleaned.add(ct)
        if len(cleaned) >= 2:
            tag_list = sorted(list(cleaned))
            transactions.append(tag_list)
            category_transactions[cat_id].append(tag_list)
            tag_counts.update(tag_list)

    num_tx = len(transactions)
    logger.info(f"Total valid transactions with >=2 tags: {num_tx:,}")

    # Top tags considered (prune extreme long-tail for efficient and meaningful DWM rules)
    frequent_tags = {tag for tag, count in tag_counts.most_common(1200) if count >= 30}
    logger.info(f"Frequent item candidate pool: {len(frequent_tags)} tags")

    # Count pair co-occurrences
    pair_counts = Counter()
    filtered_tag_counts = Counter()

    for tx in transactions:
        tx_filtered = [t for t in tx if t in frequent_tags]
        if len(tx_filtered) >= 2:
            filtered_tag_counts.update(tx_filtered)
            for pair in combinations(tx_filtered, 2):
                pair_counts[pair] += 1

    # Generate Rules: A -> B and B -> A
    logger.info("Computing association metrics (Support, Confidence, Lift)...")
    rules = []
    # min_support >= 0.001 (at least ~65 occurrences), min_confidence >= 0.25, lift >= 1.5
    min_support = 0.001
    min_confidence = 0.20
    min_lift = 1.3

    for (t1, t2), count in pair_counts.items():
        supp_both = count / num_tx
        if supp_both < min_support:
            continue

        # Rule 1: t1 -> t2
        supp_t1 = filtered_tag_counts[t1] / num_tx
        supp_t2 = filtered_tag_counts[t2] / num_tx

        conf_1 = supp_both / supp_t1
        lift_1 = conf_1 / supp_t2

        if conf_1 >= min_confidence and lift_1 >= min_lift:
            rules.append({
                "antecedent": [t1],
                "consequent": [t2],
                "support": round(supp_both, 4),
                "confidence": round(conf_1, 4),
                "lift": round(lift_1, 3),
                "count": count
            })

        # Rule 2: t2 -> t1
        conf_2 = supp_both / supp_t2
        lift_2 = conf_2 / supp_t1

        if conf_2 >= min_confidence and lift_2 >= min_lift:
            rules.append({
                "antecedent": [t2],
                "consequent": [t1],
                "support": round(supp_both, 4),
                "confidence": round(conf_2, 4),
                "lift": round(lift_2, 3),
                "count": count
            })

    # Sort rules by lift descending
    rules.sort(key=lambda x: (x["lift"], x["confidence"]), reverse=True)
    logger.info(f"Discovered {len(rules):,} strong association rules!")

    # Build Network Graph (Top 100 strongest edges)
    graph_rules = rules[:120]
    node_set = set()
    links = []
    for r in graph_rules:
        src = r["antecedent"][0]
        tgt = r["consequent"][0]
        node_set.add(src)
        node_set.add(tgt)
        links.append({
            "source": src,
            "target": tgt,
            "weight": r["support"],
            "lift": r["lift"],
            "confidence": r["confidence"]
        })

    nodes = []
    for n in node_set:
        nodes.append({
            "id": n,
            "name": n,
            "symbolSize": min(40, max(12, int(filtered_tag_counts[n] / 25))),
            "count": filtered_tag_counts[n]
        })

    # 2. Category-Specific Top Rules
    category_rules = {}
    for cat_id, cat_txs in category_transactions.items():
        if len(cat_txs) < 500:
            continue
        cat_name = CATEGORY_MAP.get(cat_id, f"Category {cat_id}")
        cat_num_tx = len(cat_txs)
        cat_tag_cnt = Counter()
        for ctx in cat_txs:
            cat_tag_cnt.update(ctx)

        cat_frequent = {t for t, c in cat_tag_cnt.most_common(200) if c >= 15}
        cat_pair_cnt = Counter()
        for ctx in cat_txs:
            ctx_fil = [t for t in ctx if t in cat_frequent]
            for p in combinations(ctx_fil, 2):
                cat_pair_cnt[p] += 1

        c_rules = []
        for (ct1, ct2), ccount in cat_pair_cnt.items():
            csupp = ccount / cat_num_tx
            if csupp < 0.005:
                continue
            c_s1 = cat_tag_cnt[ct1] / cat_num_tx
            c_s2 = cat_tag_cnt[ct2] / cat_num_tx
            cconf1 = csupp / c_s1
            clift1 = cconf1 / c_s2
            if cconf1 >= 0.25 and clift1 >= 1.3:
                c_rules.append({
                    "antecedent": [ct1],
                    "consequent": [ct2],
                    "support": round(csupp, 4),
                    "confidence": round(cconf1, 4),
                    "lift": round(clift1, 3),
                    "count": ccount
                })
        c_rules.sort(key=lambda x: (x["lift"], x["confidence"]), reverse=True)
        category_rules[str(cat_id)] = {
            "category_name": cat_name,
            "rules": c_rules[:50],
            "top_tags": [t for t, _ in cat_tag_cnt.most_common(30)]
        }

    rules_payload = {
        "total_transactions": num_tx,
        "unique_mined_rules": len(rules),
        "top_rules": rules[:300],
        "graph": {
            "nodes": nodes,
            "links": links
        },
        "category_rules": category_rules
    }

    with open(RULES_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(rules_payload, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved association rules to {RULES_OUTPUT}")

    # 3. Category Timing Profiles & Virality Heatmaps (Feature 4 backend data)
    logger.info("Computing optimal publishing timing profiles by category...")
    df["publishedAt"] = pd.to_datetime(df["publishedAt"], utc=True)
    # Convert to Indian Standard Time (IST = UTC+5:30)
    df_ist = df.copy()
    df_ist["ist_publish"] = df_ist["publishedAt"] + pd.Timedelta(hours=5, minutes=30)
    df_ist["publish_day"] = df_ist["ist_publish"].dt.day_name()
    df_ist["publish_hour"] = df_ist["ist_publish"].dt.hour

    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    timing_profiles = {}
    for cat_id, cat_name in CATEGORY_MAP.items():
        cat_df = df_ist[df_ist["categoryId"] == cat_id]
        if len(cat_df) < 100:
            continue

        # Day aggregation
        day_stats = cat_df.groupby("publish_day").agg(
            video_count=("video_id", "count"),
            median_views=("view_count", "median"),
            mean_likes=("likes", "mean")
        ).reindex(days_order).fillna(0)

        # Hour aggregation
        hour_stats = cat_df.groupby("publish_hour").agg(
            video_count=("video_id", "count"),
            median_views=("view_count", "median")
        ).reindex(range(24)).fillna(0)

        best_day = day_stats["median_views"].idxmax()
        best_hour = int(hour_stats["median_views"].idxmax())
        most_active_hour = int(hour_stats["video_count"].idxmax())

        # 2D Heatmap: day x hour matrix of median views normalized
        grid = cat_df.groupby(["publish_day", "publish_hour"])["view_count"].median().unstack(level=1).reindex(days_order).fillna(0)
        grid_data = []
        max_val = float(grid.values.max()) if grid.values.max() > 0 else 1.0
        for d_idx, day_name in enumerate(days_order):
            for h in range(24):
                val = float(grid.loc[day_name, h]) if h in grid.columns else 0.0
                score = round((val / max_val) * 100, 1)
                grid_data.append([h, d_idx, score])

        timing_profiles[str(cat_id)] = {
            "categoryId": cat_id,
            "category_name": cat_name,
            "total_videos": len(cat_df),
            "best_day": best_day,
            "best_hour_ist": best_hour,
            "most_active_hour_ist": most_active_hour,
            "best_window": f"{best_hour:02d}:00 - {(best_hour+2)%24:02d}:00 IST",
            "day_distribution": [
                {"day": d, "video_count": int(day_stats.loc[d, "video_count"]), "median_views": float(day_stats.loc[d, "median_views"])}
                for d in days_order
            ],
            "hour_distribution": [
                {"hour": h, "video_count": int(hour_stats.loc[h, "video_count"]), "median_views": float(hour_stats.loc[h, "median_views"])}
                for h in range(24)
            ],
            "heatmap_grid": grid_data,
            "suggested_tags": category_rules.get(str(cat_id), {}).get("top_tags", [])[:15]
        }

    with open(TIMING_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(timing_profiles, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved category timing profiles to {TIMING_OUTPUT}")

if __name__ == "__main__":
    mine_association_rules()
