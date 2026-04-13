"""Train all classification models on Target_Direction — optimized for <5 min local training.

Key speedups vs original:
- NO RandomizedSearchCV — fixed good hyperparameters
- All models train on 30K subsample (full data only for logistic regression)
- LinearSVC instead of kernel SVC (O(n) vs O(n²))
- VotingClassifier uses pre-fitted estimators (no re-training)
- Permutation importance on 1K subsample, 2 repeats
- n_estimators=50, max_depth capped
"""

import logging

import numpy as np
from sklearn.ensemble import (
    AdaBoostClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
    VotingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.inspection import permutation_importance
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.tree import DecisionTreeClassifier

from ml.train.utils import (
    MODELS_DIR,
    get_feature_cols,
    load_splits,
    prepare_xy,
    save_model,
)

logger = logging.getLogger(__name__)

TARGET = "Target_Direction"
SAVE_DIR = MODELS_DIR / "classification"
TRAIN_SAMPLE = 30_000


def _get_base_models() -> dict:
    # Wrap LinearSVC in CalibratedClassifierCV for predict_proba support
    linear_svc = CalibratedClassifierCV(
        LinearSVC(max_iter=2000, random_state=42), cv=3,
    )
    return {
        "logistic_regression": LogisticRegression(max_iter=500, random_state=42, n_jobs=-1),
        "decision_tree": DecisionTreeClassifier(max_depth=15, random_state=42),
        "random_forest": RandomForestClassifier(
            n_estimators=50, max_depth=15, min_samples_leaf=2,
            random_state=42, n_jobs=-1,
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=50, max_depth=4, learning_rate=0.1,
            subsample=0.8, random_state=42,
        ),
        "svc": linear_svc,
        "knn": KNeighborsClassifier(n_neighbors=5, n_jobs=-1),
        "adaboost": AdaBoostClassifier(
            algorithm="SAMME", n_estimators=30, random_state=42,
        ),
    }


FULL_DATA_MODELS = {"logistic_regression"}


def _evaluate(model, X, y) -> dict:
    preds = model.predict(X)
    cm = confusion_matrix(y, preds)
    return {
        "accuracy": float(accuracy_score(y, preds)),
        "precision": float(precision_score(y, preds, zero_division=0)),
        "recall": float(recall_score(y, preds, zero_division=0)),
        "f1": float(f1_score(y, preds, zero_division=0)),
        "confusion_matrix": cm.tolist(),
    }


def _get_feature_importance(model, name, X_val, y_val, feature_cols) -> list[dict]:
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        coef = model.coef_
        importances = np.abs(coef).mean(axis=0) if coef.ndim > 1 else np.abs(coef)
    else:
        n = min(1000, len(X_val))
        idx = np.random.RandomState(42).choice(len(X_val), n, replace=False)
        result = permutation_importance(
            model, X_val[idx], y_val[idx],
            n_repeats=2, random_state=42, n_jobs=-1,
            scoring="f1",
        )
        importances = result.importances_mean

    top_idx = np.argsort(importances)[::-1][:10]
    return [
        {"feature": feature_cols[i], "importance": float(importances[i])}
        for i in top_idx
    ]


def train_classification() -> dict:
    train_df, val_df, test_df = load_splits()
    feature_cols = get_feature_cols(train_df)

    X_train_full, y_train_full = prepare_xy(train_df, TARGET, feature_cols)
    X_val, y_val = prepare_xy(val_df, TARGET, feature_cols)
    X_test, y_test = prepare_xy(test_df, TARGET, feature_cols)

    rng = np.random.RandomState(42)
    idx = rng.choice(len(X_train_full), min(TRAIN_SAMPLE, len(X_train_full)), replace=False)
    X_train_sub, y_train_sub = X_train_full[idx], y_train_full[idx]

    base_models = _get_base_models()
    results = {}

    for name, model in base_models.items():
        logger.info("Training classification: %s", name)

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
            "  %s — val F1=%.4f, Acc=%.4f",
            name, val_metrics["f1"], val_metrics["accuracy"],
        )
        base_models[name] = model

    # VotingClassifier from top 3 — pre-fitted, no re-training
    top3 = sorted(
        [n for n in results], key=lambda n: results[n]["val"]["f1"], reverse=True,
    )[:3]
    logger.info("Voting ensemble from: %s", top3)

    voting = VotingClassifier(
        estimators=[(n, base_models[n]) for n in top3],
        voting="soft",
    )
    voting.estimators_ = [base_models[n] for n in top3]
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    le.classes_ = np.array([0, 1])
    voting.le_ = le
    voting.classes_ = np.array([0, 1])

    val_metrics = _evaluate(voting, X_val, y_val)
    test_metrics = _evaluate(voting, X_test, y_test)
    importance = _get_feature_importance(voting, "voting_classifier", X_val, y_val, feature_cols)

    results["voting_classifier"] = {
        "val": val_metrics, "test": test_metrics,
        "top_features": importance, "ensemble_of": top3,
    }
    save_model(voting, SAVE_DIR / "voting_classifier.pkl")
    logger.info("  voting_classifier — val F1=%.4f", val_metrics["f1"])

    best_name = max(results, key=lambda k: results[k]["val"]["f1"])
    results[best_name]["best"] = True
    logger.info("Best classification: %s (F1=%.4f)", best_name, results[best_name]["val"]["f1"])
    return results
