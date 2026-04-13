"""SQLAlchemy ORM models for PostgreSQL tables."""

from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, Integer, String, Text, UniqueConstraint,
)

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(30), unique=True, nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=False)


class StockPrice(Base):
    __tablename__ = "stock_prices"
    __table_args__ = (UniqueConstraint("ticker", "date", name="uq_ticker_date"),)

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(30), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)


class StockIndicator(Base):
    __tablename__ = "stock_indicators"
    __table_args__ = (UniqueConstraint("ticker", "date", name="uq_indicator_ticker_date"),)

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(30), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    daily_return = Column(Float)
    volatility_20d = Column(Float)
    ma_50 = Column(Float)
    ma_200 = Column(Float)
    rsi_14 = Column(Float)
    macd = Column(Float)
    macd_signal = Column(Float)
    pe_ratio = Column(Float)
    beta = Column(Float)


class ModelMetadata(Base):
    __tablename__ = "model_metadata"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), unique=True, nullable=False)
    model_type = Column(String(50), nullable=False)  # regression / classification
    file_path = Column(Text, nullable=False)
    is_best = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    ticker = Column(String(30), nullable=False)
    predicted_close = Column(Float)
    predicted_direction = Column(Integer)
    confidence = Column(Float)
    model_used = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
