"""End-to-end pipeline runner: ingest -> clean -> features -> split."""

import logging
import sys
from pathlib import Path

# Ensure project root is on the path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.pipeline.ingest import ingest
from ml.pipeline.clean import clean
from ml.pipeline.features import add_features
from ml.pipeline.split import split_and_save

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    logger.info("=== STEP 1: Ingestion ===")
    df = ingest()

    logger.info("=== STEP 2: Cleaning ===")
    df = clean(df)

    logger.info("=== STEP 3: Feature Engineering ===")
    df = add_features(df)

    logger.info("=== STEP 4: Normalization & Splitting ===")
    splits = split_and_save(df)

    logger.info("=== Pipeline Complete ===")
    for name, split_df in splits.items():
        logger.info(
            "  %s: %d rows, date range %s to %s",
            name,
            len(split_df),
            split_df["Date"].min().strftime("%Y-%m-%d"),
            split_df["Date"].max().strftime("%Y-%m-%d"),
        )


if __name__ == "__main__":
    main()
