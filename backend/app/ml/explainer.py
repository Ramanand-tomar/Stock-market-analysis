"""Feature importance extraction and rule-based insight generation."""

import json
from pathlib import Path

import numpy as np
import pandas as pd

from app.core.config import settings
from app.ml.inference import get_latest_features, _get_feature_cols, _load_metrics

DATA_DIR = Path(settings.ML_DATA_DIR)
MODELS_DIR = Path(settings.ML_MODELS_DIR)


def get_top_features(model_name: str) -> list[dict]:
    """Return top-10 features for a model from metrics.json."""
    metrics = _load_metrics()
    for model_type in ["regression", "classification"]:
        model_metrics = metrics.get(model_type, {}).get(model_name, {})
        if "top_features" in model_metrics:
            return model_metrics["top_features"]
    return []


def generate_insight(ticker: str) -> str:
    """Rule-based insight text from the latest indicators for a ticker."""
    test_path = DATA_DIR / "test.parquet"
    if not test_path.exists():
        return "Insight unavailable: no test data found."

    df = pd.read_parquet(test_path)
    ticker_df = df[df["Ticker"] == ticker].sort_values("Date")
    if ticker_df.empty:
        return f"No data available for ticker {ticker}."

    row = ticker_df.iloc[-1]
    parts = []

    # RSI insight
    rsi = row.get("RSI_14")
    if rsi is not None and not np.isnan(rsi):
        # Values are scaled; use sign/magnitude as directional hint
        if rsi > 1.0:
            parts.append("RSI indicates strongly overbought conditions")
        elif rsi > 0.5:
            parts.append("RSI suggests mildly overbought territory")
        elif rsi < -1.0:
            parts.append("RSI indicates strongly oversold conditions")
        elif rsi < -0.5:
            parts.append("RSI suggests mildly oversold territory")
        else:
            parts.append("RSI is in neutral territory")

    # MA comparison
    close_vs_ma50 = row.get("Close_vs_MA50")
    if close_vs_ma50 is not None and not np.isnan(close_vs_ma50):
        if close_vs_ma50 > 0.5:
            parts.append("price is well above the 50-day moving average (bullish)")
        elif close_vs_ma50 < -0.5:
            parts.append("price is well below the 50-day moving average (bearish)")
        else:
            parts.append("price is near the 50-day moving average")

    close_vs_ma200 = row.get("Close_vs_MA200")
    if close_vs_ma200 is not None and not np.isnan(close_vs_ma200):
        if close_vs_ma200 > 0.5:
            parts.append("long-term trend is bullish (above 200-day MA)")
        elif close_vs_ma200 < -0.5:
            parts.append("long-term trend is bearish (below 200-day MA)")

    # Volatility
    vol = row.get("Volatility_20D")
    if vol is not None and not np.isnan(vol):
        if vol > 1.0:
            parts.append("recent volatility is elevated")
        elif vol < -0.5:
            parts.append("recent volatility is low")

    # MACD
    macd = row.get("MACD")
    macd_signal = row.get("MACD_Signal")
    if macd is not None and macd_signal is not None:
        if not np.isnan(macd) and not np.isnan(macd_signal):
            if macd > macd_signal:
                parts.append("MACD is above signal line (bullish momentum)")
            else:
                parts.append("MACD is below signal line (bearish momentum)")

    if not parts:
        return f"Insufficient indicator data to generate insight for {ticker}."

    return f"For {ticker}: " + "; ".join(parts) + "."
