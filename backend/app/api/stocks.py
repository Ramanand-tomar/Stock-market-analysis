"""Stock endpoints: list, detail, history, indicators."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import (
    PaginatedStocks,
    StockIndicatorResponse,
    StockPriceResponse,
    StockResponse,
)
from app.models.sql_models import Stock, StockIndicator, StockPrice

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("", response_model=PaginatedStocks)
async def list_stocks(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * per_page
    total_q = await db.execute(select(func.count(Stock.id)))
    total = total_q.scalar()

    result = await db.execute(
        select(Stock).order_by(Stock.ticker).offset(offset).limit(per_page)
    )
    items = result.scalars().all()

    return PaginatedStocks(
        items=[StockResponse.model_validate(s) for s in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{ticker}", response_model=StockResponse)
async def get_stock(ticker: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stock).where(Stock.ticker == ticker))
    stock = result.scalar_one_or_none()
    if stock is None:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")
    return stock


@router.get("/{ticker}/history", response_model=list[StockPriceResponse])
async def get_history(
    ticker: str,
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    limit: int = Query(500, ge=1, le=5000),
    db: AsyncSession = Depends(get_db),
):
    q = select(StockPrice).where(StockPrice.ticker == ticker)
    if start:
        q = q.where(StockPrice.date >= start)
    if end:
        q = q.where(StockPrice.date <= end)
    q = q.order_by(StockPrice.date.desc()).limit(limit)

    result = await db.execute(q)
    rows = result.scalars().all()
    if not rows:
        raise HTTPException(status_code=404, detail=f"No price data for {ticker}")
    return rows


@router.get("/{ticker}/indicators", response_model=list[StockIndicatorResponse])
async def get_indicators(
    ticker: str,
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    limit: int = Query(500, ge=1, le=5000),
    db: AsyncSession = Depends(get_db),
):
    q = select(StockIndicator).where(StockIndicator.ticker == ticker)
    if start:
        q = q.where(StockIndicator.date >= start)
    if end:
        q = q.where(StockIndicator.date <= end)
    q = q.order_by(StockIndicator.date.desc()).limit(limit)

    result = await db.execute(q)
    rows = result.scalars().all()
    if not rows:
        raise HTTPException(status_code=404, detail=f"No indicator data for {ticker}")
    return rows
