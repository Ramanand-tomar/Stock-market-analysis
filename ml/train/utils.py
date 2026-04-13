"""Shared utilities for model training: data loading, feature/target separation, saving."""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = PROJECT_ROOT / "ml" / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "ml" / "models"
METRICS_PATH = MODELS_DIR / "metrics.json"

NON_FEATURE_COLS = [
    "Date", "Ticker", "Company_Name", "Sector",
    "Target_Close", "Target_Direction",
]


def load_splits() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train = pd.read_parquet(PROCESSED_DIR / "train.parquet")
    val = pd.read_parquet(PROCESSED_DIR / "val.parquet")
    test = pd.read_parquet(PROCESSED_DIR / "test.parquet")
    logger.info("Loaded splits — train: %d, val: %d, test: %d", len(train), len(val), len(test))
    return train, val, test


def get_feature_cols(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c not in NON_FEATURE_COLS]


def prepare_xy(
    df: pd.DataFrame,
    target: str,
    feature_cols: list[str],
) -> tuple[np.ndarray, np.ndarray]:
    X = df[feature_cols].values
    y = df[target].values
    # Replace any remaining NaN with 0 (data is already scaled)
    X = np.nan_to_num(X, nan=0.0)
    y_mask = ~np.isnan(y) if np.issubdtype(y.dtype, np.floating) else np.ones(len(y), dtype=bool)
    return X[y_mask], y[y_mask]


def save_model(model, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    logger.info("Saved model to %s", path)


def load_metrics() -> dict:
    if METRICS_PATH.exists():
        with open(METRICS_PATH) as f:
            return json.load(f)
    return {}


def save_metrics(metrics: dict) -> None:
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2, default=_json_default)
    logger.info("Saved metrics to %s", METRICS_PATH)


def _json_default(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
