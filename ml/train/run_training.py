"""Orchestrator: train all models and aggregate metrics into metrics.json."""

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.train.train_regression import train_regression
from ml.train.train_classification import train_classification
from ml.train.train_unsupervised import train_unsupervised
from ml.train.utils import load_metrics, save_metrics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    metrics = load_metrics()

    logger.info("========== REGRESSION TRAINING ==========")
    metrics["regression"] = train_regression()

    logger.info("========== CLASSIFICATION TRAINING ==========")
    metrics["classification"] = train_classification()

    logger.info("========== UNSUPERVISED TRAINING ==========")
    metrics["unsupervised"] = train_unsupervised()

    save_metrics(metrics)
    logger.info("All training complete. Metrics saved.")


if __name__ == "__main__":
    main()
