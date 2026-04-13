"""Ingestion module: load CSV, parse dates, validate columns, log missing tickers."""

import json
import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

EXPECTED_TICKERS = 49
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = PROJECT_ROOT / "Dataset"
METADATA_PATH = DATASET_DIR / "metadata.json"
CSV_PATH = DATASET_DIR / "nifty50_historical_data.csv"


def load_metadata() -> dict:
    with open(METADATA_PATH) as f:
        return json.load(f)


def ingest() -> pd.DataFrame:
    metadata = load_metadata()
    expected_columns = metadata["columns"]

    logger.info("Loading CSV from %s", CSV_PATH)
    df = pd.read_csv(CSV_PATH)

    # Validate columns
    missing_cols = set(expected_columns) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing columns in CSV: {missing_cols}")
    logger.info("All %d expected columns present", len(expected_columns))

    # Parse Date
    df["Date"] = pd.to_datetime(df["Date"], utc=True)
    df["Date"] = df["Date"].dt.tz_convert("Asia/Kolkata").dt.tz_localize(None)

    # Sort by Ticker then Date
    df = df.sort_values(["Ticker", "Date"]).reset_index(drop=True)

    # Log ticker counts
    tickers = df["Ticker"].nunique()
    logger.info("Found %d unique tickers (expected %d)", tickers, EXPECTED_TICKERS)
    if tickers < EXPECTED_TICKERS:
        found = set(df["Ticker"].unique())
        logger.warning("Potentially missing tickers — only %d found", tickers)

    logger.info("Ingested %d rows", len(df))
    return df
