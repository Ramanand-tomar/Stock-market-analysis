"""Model metrics endpoints."""

from fastapi import APIRouter, HTTPException

from app.ml.inference import get_all_metrics, get_model_metrics

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/metrics")
async def all_metrics():
    metrics = get_all_metrics()
    if not metrics:
        raise HTTPException(status_code=404, detail="No metrics found. Run training first.")
    return metrics


@router.get("/{model_name}/metrics")
async def single_model_metrics(model_name: str):
    metrics = get_model_metrics(model_name)
    if metrics is None:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    return metrics
