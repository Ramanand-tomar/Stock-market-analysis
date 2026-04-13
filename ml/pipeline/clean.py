"""Cleaning module: handle nulls, outliers, negative prices, and stock splits."""

import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    initial_rows = len(df)

    # 1. Drop rows where Close is null
    df = df.dropna(subset=["Close"])
    logger.info("Dropped %d rows with null Close", initial_rows - len(df))

    # 2. Forward-fill MA_50, MA_200, Volatility_20D within each ticker (max 5 gaps)
    fill_cols = ["MA_50", "MA_200", "Volatility_20D"]
    df[fill_cols] = df.groupby("Ticker")[fill_cols].transform(
        lambda s: s.ffill(limit=5)
    )
    logger.info("Forward-filled %s (limit=5)", fill_cols)

    # 3. Cap Volume at 99th percentile per ticker
    def cap_volume(group: pd.DataFrame) -> pd.Series:
        cap = group["Volume"].quantile(0.99)
        return group["Volume"].clip(upper=cap)

    df["Volume"] = df.groupby("Ticker", group_keys=False).apply(cap_volume)
    logger.info("Capped Volume at 99th percentile per ticker")

    # 4. Remove rows with negative OHLC values
    ohlc = ["Open", "High", "Low", "Close"]
    neg_mask = (df[ohlc] < 0).any(axis=1)
    neg_count = neg_mask.sum()
    df = df[~neg_mask].reset_index(drop=True)
    logger.info("Removed %d rows with negative OHLC values", neg_count)

    # 5. Adjust historical prices for stock splits
    df = _adjust_for_splits(df)

    logger.info("Cleaning complete: %d rows remaining", len(df))
    return df


def _adjust_for_splits(df: pd.DataFrame) -> pd.DataFrame:
    price_cols = ["Open", "High", "Low", "Close"]

    # Stock_Split column: 0 or NaN means no split; values like 2.0 mean 2-for-1
    df["Stock_Split"] = df["Stock_Split"].fillna(0.0)

    adjusted = []
    for ticker, group in df.groupby("Ticker"):
        group = group.sort_values("Date").copy()
        splits = group[group["Stock_Split"] > 0]

        if splits.empty:
            adjusted.append(group)
            continue

        # For each split event, divide all prior prices by the split ratio
        for _, split_row in splits.iterrows():
            split_date = split_row["Date"]
            ratio = split_row["Stock_Split"]
            if ratio <= 0 or ratio == 1:
                continue
            mask = group["Date"] < split_date
            group.loc[mask, price_cols] = group.loc[mask, price_cols] / ratio

        adjusted.append(group)

    result = pd.concat(adjusted, ignore_index=True)
    result = result.sort_values(["Ticker", "Date"]).reset_index(drop=True)

    split_count = (df["Stock_Split"] > 0).sum()
    logger.info("Adjusted prices for %d stock-split events", split_count)
    return result
