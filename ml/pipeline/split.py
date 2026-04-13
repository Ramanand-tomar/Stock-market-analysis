"""Normalization and time-aware train/val/test splitting."""

import logging
from pathlib import Path

import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = PROJECT_ROOT / "ml" / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "ml" / "models"

# Columns excluded from scaling
NON_FEATURE_COLS = [
    "Date", "Ticker", "Company_Name", "Sector",
    "Target_Close", "Target_Direction",
]

# Time-aware split boundaries
TRAIN_END = "2022-12-31"
VAL_END = "2023-12-31"


def split_and_save(df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # Encode categorical columns
    label_encoders = {}
    for col in ["Ticker", "Sector"]:
        le = LabelEncoder()
        df[f"{col}_Encoded"] = le.fit_transform(df[col])
        label_encoders[col] = le

    joblib.dump(label_encoders, MODELS_DIR / "label_encoders.pkl")
    logger.info("Saved label encoders")

    # Time-aware split
    train = df[df["Date"] <= TRAIN_END].copy()
    val = df[(df["Date"] > TRAIN_END) & (df["Date"] <= VAL_END)].copy()
    test = df[df["Date"] > VAL_END].copy()

    logger.info(
        "Split sizes — Train: %d, Val: %d, Test: %d", len(train), len(val), len(test)
    )

    # Identify numeric feature columns for scaling
    feature_cols = [
        c for c in df.columns
        if c not in NON_FEATURE_COLS and df[c].dtype in ("float64", "float32", "int64")
    ]

    # Fit scaler on training data only (no leakage)
    scaler = StandardScaler()
    scaler.fit(train[feature_cols].fillna(0))

    for split_df in [train, val, test]:
        split_df[feature_cols] = scaler.transform(split_df[feature_cols].fillna(0))

    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")
    logger.info("Saved scaler (fitted on training data only)")

    # Save Parquet files
    train.to_parquet(PROCESSED_DIR / "train.parquet", index=False)
    val.to_parquet(PROCESSED_DIR / "val.parquet", index=False)
    test.to_parquet(PROCESSED_DIR / "test.parquet", index=False)
    logger.info("Saved train/val/test parquet files to %s", PROCESSED_DIR)

    return {"train": train, "val": val, "test": test}
