"""Admin endpoints: user management, data loading."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.sql_models import User, Stock, StockPrice, PredictionLog

router = APIRouter(prefix="/admin", tags=["admin"])


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/stats")
async def admin_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user_count = (await db.execute(select(func.count(User.id)))).scalar()
    stock_count = (await db.execute(select(func.count(Stock.id)))).scalar()
    price_count = (await db.execute(select(func.count(StockPrice.id)))).scalar()
    pred_count = (await db.execute(select(func.count(PredictionLog.id)))).scalar()

    return {
        "users": user_count,
        "stocks": stock_count,
        "stock_prices": price_count,
        "prediction_logs": pred_count,
    }
