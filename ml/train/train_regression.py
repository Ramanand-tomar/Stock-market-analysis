"""Train all regression models on Target_Close — optimized for <5 min local training.

Key speedups vs original:
- NO RandomizedSearchCV — fixed good hyperparameters
- All models train on 30K subsample (full data only for linear models)
- LinearSVR instead of kernel SVR (O(n) vs O(n²))
- Permutation importance on 1K subsample, 2 repeats
- n_estimators=50, max_depth capped
"""

import logging

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.neighbors import KNeighborsRegressor
from sklearn.inspection import permutation_importance
from sklearn.svm import LinearSVR
from sklearn.tree import DecisionTreeRegressor

from ml.train.utils import (
    MODELS_DIR,
    get_feature_cols,
    load_splits,
    prepare_xy,
    save_model,
)

logger = logging.getLogger(__name__)

TARGET = "Target_Close"
SAVE_DIR = MODELS_DIR / "regression"
TRAIN_SAMPLE = 30_000  # subsample for ensemble/slow models


def _get_models() -> dict:
    return {
        "linear_regression": LinearRegression(),
        "decision_tree": DecisionTreeRegressor(max_depth=15, random_state=42),
        "random_forest": RandomForestRegressor(
            n_estimators=50, max_depth=15, min_samples_leaf=2,
            random_state=42, n_jobs=-1,
        ),
        "gradient_boosting": GradientBoostingRegressor(
            n_estimators=50, max_depth=4, learning_rate=0.1,
            subsample=0.8, random_state=42,
        ),
        "svr": LinearSVR(max_iter=2000, random_state=42),
        "knn": KNeighborsRegressor(n_neighbors=5, n_jobs=-1),
    }


# Models fast enough to train on full data
FULL_DATA_MODELS = {"linear_regression"}


def _evaluate(model, X, y) -> dict:
    preds = model.predict(X)
    return {
        "rmse": float(np.sqrt(mean_squared_error(y, preds))),
        "mae": float(mean_absolute_error(y, preds)),
        "r2": float(r2_score(y, preds)),
    }


def _get_feature_importance(model, name, X_val, y_val, feature_cols) -> list[dict]:
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_)
    else:
        n = min(1000, len(X_val))
        idx = np.random.RandomState(42).choice(len(X_val), n, replace=False)
        result = permutation_importance(
            model, X_val[idx], y_val[idx],
            n_repeats=2, random_state=42, n_jobs=-1,
            scoring="neg_mean_squared_error",
        )
        importances = result.importances_mean

    top_idx = np.argsort(importances)[::-1][:10]
    return [
        {"feature": feature_cols[i], "importance": float(importances[i])}
        for i in top_idx
    ]


def train_regression() -> dict:
    train_df, val_df, test_df = load_splits()
    feature_cols = get_feature_cols(train_df)

    X_train_full, y_train_full = prepare_xy(train_df, TARGET, feature_cols)
    X_val, y_val = prepare_xy(val_df, TARGET, feature_cols)
    X_test, y_test = prepare_xy(test_df, TARGET, feature_cols)

    # Subsample for most models
    rng = np.random.RandomState(42)
    idx = rng.choice(len(X_train_full), min(TRAIN_SAMPLE, len(X_train_full)), replace=False)
    X_train_sub, y_train_sub = X_train_full[idx], y_train_full[idx]

    models = _get_models()
    results = {}

    for name, model in models.items():
        logger.info("Training regression: %s", name)

        Xt = X_train_full if name in FULL_DATA_MODELS else X_train_sub
        yt = y_train_full if name in FULL_DATA_MODELS else y_train_sub

        model.fit(Xt, yt)

        val_metrics = _evaluate(model, X_val, y_val)
        test_metrics = _evaluate(model, X_test, y_test)
        importance = _get_feature_importance(model, name, X_val, y_val, feature_cols)

        results[name] = {
            "val": val_metrics,
            "test": test_metrics,
            "top_features": importance,
        }

        save_model(model, SAVE_DIR / f"{name}.pkl")
        logger.info(
            "  %s — val RMSE=%.4f, R²=%.4f",
            name, val_metrics["rmse"], val_metrics["r2"],
        )

    best_name = min(results, key=lambda k: results[k]["val"]["rmse"])
    results[best_name]["best"] = True
    logger.info("Best regression: %s (RMSE=%.4f)", best_name, results[best_name]["val"]["rmse"])
    return results
