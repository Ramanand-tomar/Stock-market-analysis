"""User endpoints: watchlist CRUD and prediction history (MongoDB)."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.core.database import get_mongo_db
from app.models.schemas import WatchlistAdd, WatchlistResponse
from app.models.sql_models import User

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/watchlist", response_model=WatchlistResponse)
async def get_watchlist(user: User = Depends(get_current_user)):
    db = get_mongo_db()
    doc = await db.user_watchlists.find_one({"user_id": user.id})
    tickers = doc["tickers"] if doc else []
    return WatchlistResponse(tickers=tickers)


@router.post("/watchlist", response_model=WatchlistResponse, status_code=201)
async def add_to_watchlist(body: WatchlistAdd, user: User = Depends(get_current_user)):
    db = get_mongo_db()
    ticker = body.ticker.upper()

    await db.user_watchlists.update_one(
        {"user_id": user.id},
        {"$addToSet": {"tickers": ticker}},
        upsert=True,
    )

    doc = await db.user_watchlists.find_one({"user_id": user.id})
    return WatchlistResponse(tickers=doc["tickers"])


@router.delete("/watchlist/{ticker}", response_model=WatchlistResponse)
async def remove_from_watchlist(ticker: str, user: User = Depends(get_current_user)):
    db = get_mongo_db()
    ticker = ticker.upper()

    result = await db.user_watchlists.update_one(
        {"user_id": user.id},
        {"$pull": {"tickers": ticker}},
    )

    doc = await db.user_watchlists.find_one({"user_id": user.id})
    tickers = doc["tickers"] if doc else []
    return WatchlistResponse(tickers=tickers)


@router.get("/predictions")
async def get_prediction_history(
    user: User = Depends(get_current_user),
    limit: int = 50,
):
    db = get_mongo_db()
    cursor = db.prediction_history.find(
        {"user_id": user.id},
        {"_id": 0},
    ).sort("created_at", -1).limit(limit)

    history = await cursor.to_list(length=limit)
    return {"history": history}
