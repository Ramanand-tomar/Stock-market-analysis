"""Feature engineering module: compute lag features, technical indicators, and targets."""

import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["Ticker", "Date"]).reset_index(drop=True)

    featured = []
    for ticker, group in df.groupby("Ticker"):
        group = group.sort_values("Date").copy()
        group = _compute_features(group)
        featured.append(group)

    df = pd.concat(featured, ignore_index=True)
    df = df.sort_values(["Ticker", "Date"]).reset_index(drop=True)

    logger.info("Feature engineering complete — %d columns total", len(df.columns))
    return df


def _compute_features(g: pd.DataFrame) -> pd.DataFrame:
    # Lag features
    g["Lag_Close_1"] = g["Close"].shift(1)
    g["Lag_Close_5"] = g["Close"].shift(5)
    g["Lag_Return_1"] = g["Daily_Return"].shift(1)

    # Price range
    g["Price_Range"] = g["High"] - g["Low"]
    g["Price_Range_Pct"] = g["Price_Range"] / g["Open"]

    # Close vs moving averages
    g["Close_vs_MA50"] = g["Close"] / g["MA_50"] - 1
    g["Close_vs_MA200"] = g["Close"] / g["MA_200"] - 1

    # RSI 14
    g["RSI_14"] = _compute_rsi(g["Close"], period=14)

    # MACD
    ema12 = g["Close"].ewm(span=12, adjust=False).mean()
    ema26 = g["Close"].ewm(span=26, adjust=False).mean()
    g["MACD"] = ema12 - ema26
    g["MACD_Signal"] = g["MACD"].ewm(span=9, adjust=False).mean()

    # Targets (next day)
    g["Target_Close"] = g["Close"].shift(-1)
    g["Target_Direction"] = (g["Target_Close"] > g["Close"]).astype(int)

    return g


def _compute_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    delta = prices.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi
