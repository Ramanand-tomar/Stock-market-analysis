"""Prediction endpoints: predict and explain."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.core.database import get_mongo_db
from app.ml.explainer import generate_insight, get_top_features
from app.ml.inference import predict, _get_best_model_name
from app.models.schemas import ExplainResponse, PredictionResponse
from app.models.sql_models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["predict"])


@router.get("/{ticker}", response_model=PredictionResponse)
async def predict_ticker(ticker: str, user: User = Depends(get_current_user)):
    result = predict(ticker.upper())
    if result is None:
        # Try returning 503 if models are missing
        raise HTTPException(
            status_code=503,
            detail=f"Prediction unavailable for {ticker}. Models may not be loaded.",
        )

    insight = generate_insight(ticker.upper())

    # Log the prediction to MongoDB so /user/predictions can return history.
    # Failures here must not break the user-facing response.
    if not result.get("cached"):
        try:
            db = get_mongo_db()
            await db.prediction_history.insert_one({
                "user_id": user.id,
                "ticker": ticker.upper(),
                "predicted_close": result["predicted_close"],
                "direction": result["direction"],
                "confidence": result["confidence"],
                "model_used": result["model_used"],
                "insight": insight,
                "created_at": datetime.now(timezone.utc),
            })
        except Exception as e:
            logger.warning("Failed to log prediction for %s: %s", ticker, e)

    return PredictionResponse(
        ticker=ticker.upper(),
        predicted_close=result["predicted_close"],
        direction=result["direction"],
        confidence=result["confidence"],
        model_used=result["model_used"],
        insight=insight,
        cached=result.get("cached", False),
    )


@router.get("/{ticker}/explain", response_model=ExplainResponse)
async def explain_ticker(ticker: str, user: User = Depends(get_current_user)):
    # Use best classification model's features
    best_clf = _get_best_model_name("classification")
    best_reg = _get_best_model_name("regression")

    features = get_top_features(best_clf or best_reg or "")
    if not features:
        raise HTTPException(status_code=404, detail="Feature importance data not available")

    insight = generate_insight(ticker.upper())

    return ExplainResponse(
        ticker=ticker.upper(),
        top_features=features,
        insight=insight,
    )
