"""Insights endpoints: K-Means clusters and PCA projections."""

import csv
import logging
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter(prefix="/insights", tags=["insights"])
logger = logging.getLogger(__name__)

CLUSTER_DIR = Path(settings.ML_MODELS_DIR) / "clustering"
DATA_DIR = Path(settings.ML_DATA_DIR)

# Cluster labels based on feature characteristics
_CLUSTER_LABELS = {
    "high_beta_volatile": "High Beta & Volatile",
    "stable_blue_chip": "Stable Blue Chip",
    "growth_mid_cap": "Growth Mid-Cap",
    "defensive_low_vol": "Defensive Low Volatility",
    "high_pe_premium": "Premium Valuation",
}


def _load_projection() -> pd.DataFrame:
    path = CLUSTER_DIR / "pca_projection.csv"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Clustering data not found. Run unsupervised training first.",
        )
    return pd.read_csv(path)


def _load_ticker_sectors() -> dict[str, dict]:
    """Load ticker → (company_name, sector) from any available parquet."""
    for name in ["train.parquet", "val.parquet", "test.parquet"]:
        path = DATA_DIR / name
        if path.exists():
            df = pd.read_parquet(path, columns=["Ticker", "Company_Name", "Sector"])
            dedup = df.drop_duplicates("Ticker").set_index("Ticker")
            return {
                row.name: {"company_name": row["Company_Name"], "sector": row["Sector"]}
                for _, row in dedup.iterrows()
            }
    return {}


def _generate_cluster_label(cluster_df: pd.DataFrame, sectors: dict) -> str:
    """Generate a descriptive label based on cluster feature averages."""
    avg_beta = cluster_df["beta"].mean()
    avg_vol = cluster_df["volatility"].mean()
    avg_return = cluster_df["mean_return"].mean()
    avg_pe = cluster_df["mean_pe"].mean()

    if avg_beta > 0.5 and avg_vol > 0.5:
        return "High Beta & Volatile"
    if avg_beta < -0.3 and avg_vol < -0.3:
        return "Defensive Low Volatility"
    if avg_pe > 0.5:
        return "Premium Valuation"
    if avg_return > 0.3:
        return "Growth Oriented"
    if avg_vol < 0:
        return "Stable Blue Chip"
    return "Diversified Mix"


def _generate_cluster_description(
    cluster_id: int, cluster_df: pd.DataFrame, sectors: dict
) -> str:
    """Generate plain-language description for a cluster."""
    tickers = cluster_df["Ticker"].tolist()
    ticker_sectors = [sectors.get(t, {}).get("sector", "Unknown") for t in tickers]

    # Find dominant sectors
    from collections import Counter
    sector_counts = Counter(ticker_sectors)
    top_sectors = [s for s, _ in sector_counts.most_common(3) if s != "Unknown"]

    avg_beta = cluster_df["beta"].mean()
    avg_vol = cluster_df["volatility"].mean()
    avg_return = cluster_df["mean_return"].mean()

    parts = [f"Cluster {cluster_id} contains {len(tickers)} stocks"]

    if top_sectors:
        parts.append(f"primarily from the {', '.join(top_sectors)} sector{'s' if len(top_sectors) > 1 else ''}")

    traits = []
    if avg_beta > 0.3:
        traits.append("high-beta")
    elif avg_beta < -0.3:
        traits.append("low-beta")

    if avg_vol > 0.3:
        traits.append("high-volatility")
    elif avg_vol < -0.3:
        traits.append("low-volatility")

    if avg_return > 0.2:
        traits.append("above-average returns")
    elif avg_return < -0.2:
        traits.append("below-average returns")

    if traits:
        parts.append(f"characterized by {', '.join(traits)}")

    return ". ".join(parts) + "."


@router.get("/clusters")
async def get_clusters():
    projection = _load_projection()
    sectors = _load_ticker_sectors()

    clusters = {}
    for cluster_id in sorted(projection["Cluster"].unique()):
        cluster_df = projection[projection["Cluster"] == cluster_id]
        tickers = cluster_df["Ticker"].tolist()

        label = _generate_cluster_label(cluster_df, sectors)
        description = _generate_cluster_description(cluster_id, cluster_df, sectors)

        members = []
        for t in tickers:
            info = sectors.get(t, {})
            members.append({
                "ticker": t,
                "company_name": info.get("company_name", t),
                "sector": info.get("sector", "Unknown"),
            })

        clusters[str(cluster_id)] = {
            "cluster_id": int(cluster_id),
            "label": label,
            "description": description,
            "count": len(tickers),
            "members": members,
            "avg_stats": {
                "beta": round(float(cluster_df["beta"].mean()), 4),
                "volatility": round(float(cluster_df["volatility"].mean()), 4),
                "mean_return": round(float(cluster_df["mean_return"].mean()), 6),
                "mean_pe": round(float(cluster_df["mean_pe"].mean()), 2),
            },
        }

    return {"clusters": clusters, "total_tickers": len(projection)}


@router.get("/pca")
async def get_pca():
    projection = _load_projection()
    sectors = _load_ticker_sectors()

    points = []
    for _, row in projection.iterrows():
        ticker = row["Ticker"]
        info = sectors.get(ticker, {})
        points.append({
            "ticker": ticker,
            "x": round(float(row["PCA_1"]), 4),
            "y": round(float(row["PCA_2"]), 4),
            "cluster": int(row["Cluster"]),
            "sector": info.get("sector", "Unknown"),
            "company_name": info.get("company_name", ticker),
        })

    return {"points": points, "total": len(points)}
