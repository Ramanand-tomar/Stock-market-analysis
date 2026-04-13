"""Pydantic request/response schemas."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ── Auth ────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Stocks ──────────────────────────────────────────────────
class StockResponse(BaseModel):
    ticker: str
    company_name: str
    sector: str

    model_config = {"from_attributes": True}


class StockPriceResponse(BaseModel):
    date: datetime
    open: float | None
    high: float | None
    low: float | None
    close: float | None
    volume: float | None

    model_config = {"from_attributes": True}


class StockIndicatorResponse(BaseModel):
    date: datetime
    daily_return: float | None
    volatility_20d: float | None
    ma_50: float | None
    ma_200: float | None
    rsi_14: float | None
    macd: float | None
    macd_signal: float | None
    pe_ratio: float | None
    beta: float | None

    model_config = {"from_attributes": True}


# ── Prediction ──────────────────────────────────────────────
class PredictionResponse(BaseModel):
    ticker: str
    predicted_close: float
    direction: int
    confidence: float
    model_used: str
    insight: str
    cached: bool = False


class ExplainResponse(BaseModel):
    ticker: str
    top_features: list[dict]
    insight: str


# ── Model Metrics ───────────────────────────────────────────
class ModelMetricsResponse(BaseModel):
    regression: dict
    classification: dict
    unsupervised: dict | None = None


# ── Watchlist ───────────────────────────────────────────────
class WatchlistAdd(BaseModel):
    ticker: str


class WatchlistResponse(BaseModel):
    tickers: list[str]


# ── Pagination ──────────────────────────────────────────────
class PaginatedStocks(BaseModel):
    items: list[StockResponse]
    total: int
    page: int
    per_page: int
