import logging
from typing import Any, Dict
import numpy as np
import pandas as pd
from app.data_loader import data_loader

logger = logging.getLogger("ml_service")

class MLService:
    @staticmethod
    def get_regression_metrics() -> Dict[str, Any]:
        metrics = data_loader.metrics
        return {
            "simple": metrics.get("simple_linear_regression", {}),
            "multiple": metrics.get("multiple_linear_regression", {}),
        }

    @staticmethod
    def predict_regression(
        likes: int, dislikes: int = 0, comment_count: int = 0, model: str = "simple"
    ) -> Dict[str, Any]:
        if model == "multiple":
            mlr = data_loader.models.get("multiple_linear_regression")
            if mlr is None:
                raise RuntimeError("Multiple linear regression model not loaded")
            # Feature order: ['likes', 'dislikes', 'comment_count']
            X = pd.DataFrame([[likes, dislikes, comment_count]], columns=["likes", "dislikes", "comment_count"])
            pred = float(mlr.predict(X)[0])
        else:
            slr = data_loader.models.get("simple_linear_regression")
            if slr is None:
                raise RuntimeError("Simple linear regression model not loaded")
            # Feature order: ['likes']
            X = pd.DataFrame([[likes]], columns=["likes"])
            pred = float(slr.predict(X)[0])

        # Views cannot be negative
        predicted_views = max(0.0, round(pred, 1))

        return {
            "model": model,
            "predicted_views": predicted_views,
            "inputs": {
                "likes": likes,
                "dislikes": dislikes,
                "comment_count": comment_count,
            },
        }

    @staticmethod
    def get_classification_metrics() -> Dict[str, Any]:
        metrics = data_loader.metrics
        return {
            "decision_tree": metrics.get("decision_tree", {}),
            "naive_bayes": metrics.get("naive_bayes", {}),
        }

    @staticmethod
    def predict_classification(
        likes: int, dislikes: int, comment_count: int, categoryId: int, model: str = "decision_tree"
    ) -> Dict[str, Any]:
        features = ["likes", "dislikes", "comment_count", "categoryId"]
        X = pd.DataFrame([[likes, dislikes, comment_count, categoryId]], columns=features)

        if model == "naive_bayes":
            clf = data_loader.models.get("gaussian_nb")
            model_key = "naive_bayes"
        else:
            clf = data_loader.models.get("decision_tree")
            model_key = "decision_tree"

        if clf is None:
            raise RuntimeError(f"Model {model} is not loaded")

        pred_class = str(clf.predict(X)[0])
        probs = clf.predict_proba(X)[0]
        classes = list(clf.classes_)

        prob_map = {classes[i]: round(float(probs[i]), 4) for i in range(len(classes))}

        return {
            "model": model_key,
            "predicted_class": pred_class,
            "probabilities": prob_map,
            "inputs": {
                "likes": likes,
                "dislikes": dislikes,
                "comment_count": comment_count,
                "categoryId": categoryId,
            },
        }

    @staticmethod
    def get_clustering_summary() -> Dict[str, Any]:
        return data_loader.metrics.get("clustering", {})

    @staticmethod
    def assign_cluster(
        view_count: int,
        likes: int,
        dislikes: int,
        comment_count: int,
        log_transform: bool = False,
    ) -> Dict[str, Any]:
        features = ["view_count", "likes", "dislikes", "comment_count"]
        raw_vals = [view_count, likes, dislikes, comment_count]

        if log_transform:
            scaler = data_loader.models.get("scaler_log")
            kmeans = data_loader.models.get("kmeans_log")
            profiles = data_loader.metrics.get("clustering", {}).get("log_transformed", {}).get("profiles", {})
            X = pd.DataFrame(np.log1p([raw_vals]), columns=features)
        else:
            scaler = data_loader.models.get("scaler")
            kmeans = data_loader.models.get("kmeans")
            profiles = data_loader.metrics.get("clustering", {}).get("standard", {}).get("profiles", {})
            X = pd.DataFrame([raw_vals], columns=features)

        if scaler is None or kmeans is None:
            raise RuntimeError("Clustering model or scaler not loaded")

        X_scaled = scaler.transform(X)
        cluster_id = int(kmeans.predict(X_scaled)[0])

        return {
            "cluster_id": cluster_id,
            "is_log_transformed": log_transform,
            "cluster_profile": profiles.get(str(cluster_id), profiles.get(cluster_id, {})),
        }

ml_service = MLService()
