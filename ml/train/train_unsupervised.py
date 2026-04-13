"""Unsupervised learning: K-Means clustering and PCA projection on per-ticker features."""

import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from ml.train.utils import MODELS_DIR, load_splits

logger = logging.getLogger(__name__)

CLUSTER_DIR = MODELS_DIR / "clustering"


def train_unsupervised() -> dict:
    CLUSTER_DIR.mkdir(parents=True, exist_ok=True)

    train_df, val_df, _ = load_splits()
    # Use train + val for aggregation (no test)
    df = pd.concat([train_df, val_df], ignore_index=True)

    # Aggregate per-ticker features
    agg = df.groupby("Ticker").agg(
        mean_return=("Daily_Return", "mean"),
        volatility=("Volatility_20D", "mean"),
        beta=("Beta", "mean"),
        mean_volume=("Volume", "mean"),
        mean_pe=("PE_Ratio", "mean"),
        mean_market_cap=("Market_Cap", "mean"),
    ).reset_index()

    feature_cols = [c for c in agg.columns if c != "Ticker"]
    X = agg[feature_cols].fillna(0).values

    # Scale features for clustering/PCA
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # K-Means (k=5)
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    agg["Cluster"] = kmeans.fit_predict(X_scaled)

    joblib.dump(kmeans, CLUSTER_DIR / "kmeans.pkl")
    logger.info("K-Means (k=5) fitted — cluster distribution:\n%s", agg["Cluster"].value_counts().to_string())

    # PCA (2 components)
    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(X_scaled)
    agg["PCA_1"] = coords[:, 0]
    agg["PCA_2"] = coords[:, 1]

    joblib.dump(pca, CLUSTER_DIR / "pca.pkl")

    # Save projection CSV
    projection = agg[["Ticker", "Cluster", "PCA_1", "PCA_2"] + feature_cols]
    projection.to_csv(CLUSTER_DIR / "pca_projection.csv", index=False)
    logger.info("PCA projection saved — explained variance: %.2f%%", pca.explained_variance_ratio_.sum() * 100)

    return {
        "kmeans": {
            "n_clusters": 5,
            "cluster_sizes": agg["Cluster"].value_counts().to_dict(),
            "inertia": float(kmeans.inertia_),
        },
        "pca": {
            "n_components": 2,
            "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
            "total_explained_variance": float(pca.explained_variance_ratio_.sum()),
        },
    }
