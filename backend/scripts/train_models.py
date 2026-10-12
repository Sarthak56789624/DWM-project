import json
import logging
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    silhouette_score,
)
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier, _tree

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_models")

SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parent
PARQUET_PATH = BASE_DIR / "data" / "processed" / "trending.parquet"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
METRICS_PATH = MODELS_DIR / "metrics.json"

def export_tree_json(tree_model, feature_names, class_names):
    """Export sklearn DecisionTreeClassifier to a recursive JSON structure."""
    tree_ = tree_model.tree_

    def recurse(node):
        if tree_.feature[node] != _tree.TREE_UNDEFINED:
            name = feature_names[tree_.feature[node]]
            threshold = float(tree_.threshold[node])
            return {
                "name": f"{name} <= {threshold:,.1f}",
                "feature": name,
                "threshold": threshold,
                "samples": int(tree_.n_node_samples[node]),
                "impurity": round(float(tree_.impurity[node]), 4),
                "value": [int(v) for v in tree_.value[node][0]],
                "children": [
                    recurse(tree_.children_left[node]),
                    recurse(tree_.children_right[node]),
                ],
            }
        else:
            val = tree_.value[node][0]
            pred_class = class_names[int(np.argmax(val))]
            return {
                "name": f"Leaf: {pred_class}",
                "prediction": pred_class,
                "samples": int(tree_.n_node_samples[node]),
                "impurity": round(float(tree_.impurity[node]), 4),
                "value": [int(v) for v in val],
            }

    return recurse(0)

def train():
    logger.info(f"Loading preprocessed data from {PARQUET_PATH}...")
    df = pd.read_parquet(PARQUET_PATH)
    logger.info(f"Loaded {len(df):,} rows.")

    metrics = {}

    # ========================================================
    # 1. Simple Linear Regression
    # ========================================================
    logger.info("Training 1. Simple Linear Regression (likes -> view_count)...")
    reg_df = df[["view_count", "likes", "dislikes", "comment_count"]].dropna()
    X_slr = reg_df[["likes"]]
    y_reg = reg_df["view_count"]

    X_train_slr, X_test_slr, y_train_slr, y_test_slr = train_test_split(
        X_slr, y_reg, test_size=0.2, random_state=42
    )

    slr = LinearRegression()
    slr.fit(X_train_slr, y_train_slr)
    y_pred_slr = slr.predict(X_test_slr)

    mae_slr = float(mean_absolute_error(y_test_slr, y_pred_slr))
    mse_slr = float(mean_squared_error(y_test_slr, y_pred_slr))
    rmse_slr = float(np.sqrt(mse_slr))
    r2_slr = float(r2_score(y_test_slr, y_pred_slr))

    joblib.dump(slr, MODELS_DIR / "simple_linear_regression.joblib")

    # Sample points for visualization
    sample_indices = np.random.RandomState(42).choice(len(X_test_slr), size=min(1000, len(X_test_slr)), replace=False)
    slr_plot_sample = [
        {"likes": int(X_test_slr.iloc[i, 0]), "actual_views": int(y_test_slr.iloc[i]), "predicted_views": float(y_pred_slr[i])}
        for i in sample_indices
    ]

    metrics["simple_linear_regression"] = {
        "features": ["likes"],
        "target": "view_count",
        "intercept": float(slr.intercept_),
        "coefficients": {"likes": float(slr.coef_[0])},
        "mae": mae_slr,
        "rmse": rmse_slr,
        "r2": r2_slr,
        "plot_sample": slr_plot_sample[:200]
    }
    logger.info(f"SLR - R2: {r2_slr:.4f}, MAE: {mae_slr:,.1f}, RMSE: {rmse_slr:,.1f}")

    # ========================================================
    # 2. Multiple Linear Regression
    # ========================================================
    logger.info("Training 2. Multiple Linear Regression...")
    X_mlr = reg_df[["likes", "dislikes", "comment_count"]]
    X_train_mlr, X_test_mlr, y_train_mlr, y_test_mlr = train_test_split(
        X_mlr, y_reg, test_size=0.2, random_state=42
    )

    mlr = LinearRegression()
    mlr.fit(X_train_mlr, y_train_mlr)
    y_pred_mlr = mlr.predict(X_test_mlr)

    mae_mlr = float(mean_absolute_error(y_test_mlr, y_pred_mlr))
    mse_mlr = float(mean_squared_error(y_test_mlr, y_pred_mlr))
    rmse_mlr = float(np.sqrt(mse_mlr))
    r2_mlr = float(r2_score(y_test_mlr, y_pred_mlr))

    joblib.dump(mlr, MODELS_DIR / "multiple_linear_regression.joblib")

    mlr_plot_sample = [
        {
            "likes": int(X_test_mlr.iloc[i]["likes"]),
            "dislikes": int(X_test_mlr.iloc[i]["dislikes"]),
            "comment_count": int(X_test_mlr.iloc[i]["comment_count"]),
            "actual_views": int(y_test_mlr.iloc[i]),
            "predicted_views": float(y_pred_mlr[i]),
        }
        for i in sample_indices
    ]

    metrics["multiple_linear_regression"] = {
        "features": ["likes", "dislikes", "comment_count"],
        "target": "view_count",
        "intercept": float(mlr.intercept_),
        "coefficients": {
            "likes": float(mlr.coef_[0]),
            "dislikes": float(mlr.coef_[1]),
            "comment_count": float(mlr.coef_[2]),
        },
        "mae": mae_mlr,
        "rmse": rmse_mlr,
        "r2": r2_mlr,
        "plot_sample": mlr_plot_sample[:200]
    }
    logger.info(f"MLR - R2: {r2_mlr:.4f}, MAE: {mae_mlr:,.1f}, RMSE: {rmse_mlr:,.1f}")

    # ========================================================
    # 3. Decision Tree Classifier
    # ========================================================
    logger.info("Training 3. Decision Tree Classifier...")
    cls_df = df[["likes", "dislikes", "comment_count", "categoryId", "popularity"]].dropna()
    X_cls = cls_df[["likes", "dislikes", "comment_count", "categoryId"]]
    y_cls = cls_df["popularity"]

    X_train_cls, X_test_cls, y_train_cls, y_test_cls = train_test_split(
        X_cls, y_cls, test_size=0.20, random_state=42, stratify=y_cls
    )

    dt_model = DecisionTreeClassifier(criterion="gini", max_depth=5, random_state=42)
    dt_model.fit(X_train_cls, y_train_cls)
    y_pred_dt = dt_model.predict(X_test_cls)

    acc_dt = float(accuracy_score(y_test_cls, y_pred_dt))
    prec_dt = float(precision_score(y_test_cls, y_pred_dt, pos_label="Popular"))
    rec_dt = float(recall_score(y_test_cls, y_pred_dt, pos_label="Popular"))
    f1_dt = float(f1_score(y_test_cls, y_pred_dt, pos_label="Popular"))
    cm_dt = confusion_matrix(y_test_cls, y_pred_dt, labels=["Not Popular", "Popular"]).tolist()
    cls_report_dt = classification_report(y_test_cls, y_pred_dt, output_dict=True)

    joblib.dump(dt_model, MODELS_DIR / "decision_tree.joblib")

    # Tree JSON export
    tree_json = export_tree_json(
        dt_model,
        feature_names=["likes", "dislikes", "comment_count", "categoryId"],
        class_names=list(dt_model.classes_),
    )

    feature_importances_dt = {
        name: float(imp)
        for name, imp in zip(["likes", "dislikes", "comment_count", "categoryId"], dt_model.feature_importances_)
    }

    metrics["decision_tree"] = {
        "accuracy": acc_dt,
        "precision": prec_dt,
        "recall": rec_dt,
        "f1": f1_dt,
        "confusion_matrix": cm_dt,
        "classification_report": cls_report_dt,
        "feature_importances": feature_importances_dt,
        "tree_structure": tree_json,
    }
    logger.info(f"DT - Accuracy: {acc_dt:.4f}, Likes importance: {feature_importances_dt['likes']:.4f}")

    # ========================================================
    # 4. Gaussian Naive Bayes
    # ========================================================
    logger.info("Training 4. Gaussian Naive Bayes Classifier...")
    nb_model = GaussianNB()
    nb_model.fit(X_train_cls, y_train_cls)
    y_pred_nb = nb_model.predict(X_test_cls)

    acc_nb = float(accuracy_score(y_test_cls, y_pred_nb))
    prec_nb = float(precision_score(y_test_cls, y_pred_nb, pos_label="Popular"))
    rec_nb = float(recall_score(y_test_cls, y_pred_nb, pos_label="Popular"))
    f1_nb = float(f1_score(y_test_cls, y_pred_nb, pos_label="Popular"))
    cm_nb = confusion_matrix(y_test_cls, y_pred_nb, labels=["Not Popular", "Popular"]).tolist()
    cls_report_nb = classification_report(y_test_cls, y_pred_nb, output_dict=True)

    joblib.dump(nb_model, MODELS_DIR / "gaussian_nb.joblib")

    metrics["naive_bayes"] = {
        "accuracy": acc_nb,
        "precision": prec_nb,
        "recall": rec_nb,
        "f1": f1_nb,
        "confusion_matrix": cm_nb,
        "classification_report": cls_report_nb,
    }
    logger.info(f"NB - Accuracy: {acc_nb:.4f}, Precision: {prec_nb:.4f}, Recall: {rec_nb:.4f}, F1: {f1_nb:.4f}")

    # ========================================================
    # 5. K-Means Clustering (Standard)
    # ========================================================
    logger.info("Training 5. K-Means Clustering...")
    cluster_df = df[["view_count", "likes", "dislikes", "comment_count"]].dropna()
    features_cluster = ["view_count", "likes", "dislikes", "comment_count"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(cluster_df[features_cluster])
    joblib.dump(scaler, MODELS_DIR / "scaler.joblib")

    K_range = range(2, 11)

    # 10k random sample for silhouette and elbow calculation
    rng = np.random.RandomState(42)
    sample_idx_10k = rng.choice(len(X_scaled), size=10000, replace=False)
    X_sample_10k = X_scaled[sample_idx_10k]

    inertia_dict = {}
    sil_dict = {}

    for k in K_range:
        km_k = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels_all = km_k.fit_predict(X_scaled)
        inertia_dict[k] = float(km_k.inertia_)
        sil_k = float(silhouette_score(X_sample_10k, labels_all[sample_idx_10k]))
        sil_dict[k] = sil_k
        logger.info(f"K={k} -> Inertia: {km_k.inertia_:,.1f}, Sil: {sil_k:.4f}")

    # Final KMeans (K=4)
    kmeans_final = KMeans(n_clusters=4, random_state=42, n_init=10)
    clusters = kmeans_final.fit_predict(X_scaled)
    joblib.dump(kmeans_final, MODELS_DIR / "kmeans.joblib")

    cluster_df["cluster"] = clusters
    cluster_sizes = {int(k): int(v) for k, v in cluster_df["cluster"].value_counts().sort_index().items()}

    profiles = {}
    for c_id in sorted(cluster_df["cluster"].unique()):
        sub = cluster_df[cluster_df["cluster"] == c_id]
        profiles[int(c_id)] = {
            "size": int(len(sub)),
            "percentage": round(float(len(sub) / len(cluster_df) * 100), 2),
            "mean_views": round(float(sub["view_count"].mean()), 1),
            "mean_likes": round(float(sub["likes"].mean()), 1),
            "mean_dislikes": round(float(sub["dislikes"].mean()), 1),
            "mean_comments": round(float(sub["comment_count"].mean()), 1),
        }

    # PCA 2D on 5,000-row sample
    pca = PCA(n_components=2, random_state=42)
    pca.fit(X_scaled)
    joblib.dump(pca, MODELS_DIR / "pca.joblib")

    sample_5k_idx = rng.choice(len(X_scaled), size=5000, replace=False)
    X_pca_5k = pca.transform(X_scaled[sample_5k_idx])
    clusters_5k = clusters[sample_5k_idx]

    pca_sample_points = [
        {
            "pca_x": round(float(X_pca_5k[i, 0]), 4),
            "pca_y": round(float(X_pca_5k[i, 1]), 4),
            "cluster": int(clusters_5k[i]),
            "view_count": int(cluster_df.iloc[sample_5k_idx[i]]["view_count"]),
            "likes": int(cluster_df.iloc[sample_5k_idx[i]]["likes"]),
            "dislikes": int(cluster_df.iloc[sample_5k_idx[i]]["dislikes"]),
            "comment_count": int(cluster_df.iloc[sample_5k_idx[i]]["comment_count"]),
        }
        for i in range(len(sample_5k_idx))
    ]

    # ========================================================
    # 5b. Optional Log-transformed Clustering
    # ========================================================
    logger.info("Training Log-Transformed K-Means (log1p) for better cluster balance...")
    cluster_df_log = np.log1p(cluster_df[features_cluster])
    scaler_log = StandardScaler()
    X_scaled_log = scaler_log.fit_transform(cluster_df_log)
    joblib.dump(scaler_log, MODELS_DIR / "scaler_log.joblib")

    kmeans_log = KMeans(n_clusters=4, random_state=42, n_init=10)
    clusters_log = kmeans_log.fit_predict(X_scaled_log)
    joblib.dump(kmeans_log, MODELS_DIR / "kmeans_log.joblib")

    pca_log = PCA(n_components=2, random_state=42)
    X_pca_log_5k = pca_log.fit_transform(X_scaled_log[sample_5k_idx])
    joblib.dump(pca_log, MODELS_DIR / "pca_log.joblib")

    cluster_df["cluster_log"] = clusters_log
    profiles_log = {}
    for c_id in sorted(cluster_df["cluster_log"].unique()):
        sub = cluster_df[cluster_df["cluster_log"] == c_id]
        profiles_log[int(c_id)] = {
            "size": int(len(sub)),
            "percentage": round(float(len(sub) / len(cluster_df) * 100), 2),
            "mean_views": round(float(sub["view_count"].mean()), 1),
            "mean_likes": round(float(sub["likes"].mean()), 1),
            "mean_dislikes": round(float(sub["dislikes"].mean()), 1),
            "mean_comments": round(float(sub["comment_count"].mean()), 1),
        }

    pca_sample_points_log = [
        {
            "pca_x": round(float(X_pca_log_5k[i, 0]), 4),
            "pca_y": round(float(X_pca_log_5k[i, 1]), 4),
            "cluster": int(clusters_log[sample_5k_idx[i]]),
            "view_count": int(cluster_df.iloc[sample_5k_idx[i]]["view_count"]),
            "likes": int(cluster_df.iloc[sample_5k_idx[i]]["likes"]),
            "dislikes": int(cluster_df.iloc[sample_5k_idx[i]]["dislikes"]),
            "comment_count": int(cluster_df.iloc[sample_5k_idx[i]]["comment_count"]),
        }
        for i in range(len(sample_5k_idx))
    ]

    metrics["clustering"] = {
        "standard": {
            "k": 4,
            "elbow_inertia": inertia_dict,
            "silhouette_scores": sil_dict,
            "cluster_sizes": cluster_sizes,
            "profiles": profiles,
            "pca_variance_ratio": [float(v) for v in pca.explained_variance_ratio_],
            "pca_sample_points": pca_sample_points[:2000],  # 2000 sampled points for smooth frontend rendering
            "note": "Standard clustering is heavily dominated by extreme outliers (Cluster 1 has only 10 viral records).",
        },
        "log_transformed": {
            "k": 4,
            "profiles": profiles_log,
            "pca_variance_ratio": [float(v) for v in pca_log.explained_variance_ratio_],
            "pca_sample_points": pca_sample_points_log[:2000],
            "note": "Log1p transformation mitigates skewness and yields well-balanced behavioural segments.",
        },
    }

    # Save metrics JSON
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved all metrics and model artifacts to {METRICS_PATH}")

    # ========================================================
    # Validation against Notebook Expected Values
    # ========================================================
    notebook_targets = {
        "SLR R2": (0.6283, r2_slr),
        "SLR MAE (M)": (1.6136, mae_slr / 1e6),
        "SLR RMSE (M)": (4.1645, rmse_slr / 1e6),
        "MLR R2": (0.6346, r2_mlr),
        "MLR MAE (M)": (1.5963, mae_mlr / 1e6),
        "MLR RMSE (M)": (4.1286, rmse_mlr / 1e6),
        "Decision Tree Accuracy": (0.8224, acc_dt),
        "Naive Bayes Accuracy": (0.7444, acc_nb),
    }

    print("\n" + "=" * 60)
    print("MODEL VALIDATION COMPARISON (Notebook vs Trained)")
    print("=" * 60)
    print(f"{'Metric':<28} | {'Notebook':<10} | {'Trained':<10} | {'Diff %':<8} | {'Status'}")
    print("-" * 60)

    for name, (expected, actual) in notebook_targets.items():
        diff_pct = abs(actual - expected) / expected * 100
        status = "PASS" if diff_pct <= 1.0 else "FAIL"
        print(f"{name:<28} | {expected:<10.4f} | {actual:<10.4f} | {diff_pct:<7.2f}% | {status}")
        if diff_pct > 1.0:
            raise ValueError(f"Metric {name} differs by {diff_pct:.2f}% (> 1.0% tolerance)!")

    print("=" * 60)
    print("ALL MODEL METRICS MATCH NOTEBOOK EXACTLY (<= 1% DIFF).")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    train()
