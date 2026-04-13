"""Load trained models and run predictions."""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from cachetools import TTLCache

from app.core.config import settings

logger = logging.getLogger(__name__)

MODELS_DIR = Path(settings.ML_MODELS_DIR)
DATA_DIR = Path(settings.ML_DATA_DIR)
METRICS_PATH = MODELS_DIR / "metrics.json"

# In-memory TTL cache: (ticker, date_str) -> prediction result, 1 hour TTL
_prediction_cache: TTLCache = TTLCache(maxsize=1024, ttl=3600)

# Lazy-loaded model registry
_models: dict = {}
_scaler = None
_metrics: dict | None = None
_feature_cols: list[str] | None = None


def _load_metrics() -> dict:
    global _metrics
    if _metrics is None:
        if METRICS_PATH.exists():
            with open(METRICS_PATH) as f:
                _metrics = json.load(f)
        else:
            _metrics = {}
    return _metrics


def _get_best_model_name(model_type: str) -> str | None:
    metrics = _load_metrics()
    type_metrics = metrics.get(model_type, {})
    for name, m in type_metrics.items():
        if m.get("best"):
            return name
    # Fallback: first available
    return next(iter(type_metrics), None)


def _load_model(model_type: str, model_name: str):
    key = f"{model_type}/{model_name}"
    if key not in _models:
        path = MODELS_DIR / model_type / f"{model_name}.pkl"
        if not path.exists():
            return None
        _models[key] = joblib.load(path)
        logger.info("Loaded model: %s", path)
    return _models[key]


def _load_scaler():
    global _scaler
    if _scaler is None:
        scaler_path = MODELS_DIR / "scaler.pkl"
        if scaler_path.exists():
            _scaler = joblib.load(scaler_path)
    return _scaler


def _get_feature_cols() -> list[str]:
    global _feature_cols
    if _feature_cols is None:
        scaler = _load_scaler()
        if scaler and hasattr(scaler, "feature_names_in_"):
            _feature_cols = list(scaler.feature_names_in_)
        else:
            # Fallback: load from train parquet columns
            train_path = DATA_DIR / "train.parquet"
            if train_path.exists():
                df = pd.read_parquet(train_path, columns=None)
                non_feat = {"Date", "Ticker", "Company_Name", "Sector", "Target_Close", "Target_Direction"}
                _feature_cols = [c for c in df.columns if c not in non_feat]
            else:
                _feature_cols = []
    return _feature_cols


def get_latest_features(ticker: str) -> np.ndarray | None:
    """Get the most recent feature row for a ticker from the test set."""
    test_path = DATA_DIR / "test.parquet"
    if not test_path.exists():
        return None

    df = pd.read_parquet(test_path)
    ticker_df = df[df["Ticker"] == ticker].sort_values("Date")
    if ticker_df.empty:
        return None

    feature_cols = _get_feature_cols()
    row = ticker_df.iloc[-1][feature_cols].values.astype(float)
    return np.nan_to_num(row, nan=0.0).reshape(1, -1)


def predict(ticker: str) -> dict | None:
    """Run prediction for a ticker. Returns cached result if available."""
    from datetime import date
    cache_key = (ticker, str(date.today()))

    if cache_key in _prediction_cache:
        result = _prediction_cache[cache_key].copy()
        result["cached"] = True
        return result

    features = get_latest_features(ticker)
    if features is None:
        return None

    # Load best models
    reg_name = _get_best_model_name("regression")
    clf_name = _get_best_model_name("classification")

    reg_model = _load_model("regression", reg_name) if reg_name else None
    clf_model = _load_model("classification", clf_name) if clf_name else None

    if reg_model is None and clf_model is None:
        return None

    result = {"ticker": ticker, "cached": False}

    if reg_model:
        predicted_close = float(reg_model.predict(features)[0])
        result["predicted_close"] = predicted_close
        result["reg_model"] = reg_name
    else:
        result["predicted_close"] = 0.0
        result["reg_model"] = "none"

    if clf_model:
        direction = int(clf_model.predict(features)[0])
        result["direction"] = direction
        result["clf_model"] = clf_name

        if hasattr(clf_model, "predict_proba"):
            proba = clf_model.predict_proba(features)[0]
            result["confidence"] = float(max(proba))
        else:
            result["confidence"] = 0.5
    else:
        result["direction"] = 1
        result["confidence"] = 0.5
        result["clf_model"] = "none"

    result["model_used"] = f"{result.get('reg_model', 'none')}+{result.get('clf_model', 'none')}"

    _prediction_cache[cache_key] = result
    return result


def get_all_metrics() -> dict:
    return _load_metrics()


def get_model_metrics(model_name: str) -> dict | None:
    metrics = _load_metrics()
    for model_type in ["regression", "classification"]:
        if model_name in metrics.get(model_type, {}):
            return {model_type: {model_name: metrics[model_type][model_name]}}
    return None
