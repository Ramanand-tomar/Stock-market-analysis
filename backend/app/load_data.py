"""Migration script: load processed Parquet data into PostgreSQL tables."""

import asyncio
import logging
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import text

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.database import engine, init_db, Base
from app.models.sql_models import Stock, StockPrice, StockIndicator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(settings.ML_DATA_DIR)
BATCH_SIZE = 5000


async def load_stock_data():
    """Load all parquet splits into stock_prices and stock_indicators."""
    await init_db()

    # Load all splits for full data
    dfs = []
    for name in ["train.parquet", "val.parquet", "test.parquet"]:
        path = DATA_DIR / name
        if path.exists():
            dfs.append(pd.read_parquet(path))
            logger.info("Loaded %s", name)

    if not dfs:
        logger.error("No parquet files found in %s", DATA_DIR)
        return

    df = pd.concat(dfs, ignore_index=True)
    logger.info("Total rows: %d", len(df))

    async with engine.begin() as conn:
        # Clear existing data
        await conn.execute(text("DELETE FROM stock_indicators"))
        await conn.execute(text("DELETE FROM stock_prices"))
        await conn.execute(text("DELETE FROM stocks"))

        # 1. Insert unique stocks
        stocks = df[["Ticker", "Company_Name", "Sector"]].drop_duplicates(subset=["Ticker"])
        stock_rows = [
            {"ticker": r["Ticker"], "company_name": r["Company_Name"], "sector": r["Sector"]}
            for _, r in stocks.iterrows()
        ]
        for row in stock_rows:
            await conn.execute(
                text("INSERT INTO stocks (ticker, company_name, sector) VALUES (:ticker, :company_name, :sector)"),
                row,
            )
        logger.info("Inserted %d stocks", len(stock_rows))

        # 2. Insert stock prices in batches
        price_count = 0
        for i in range(0, len(df), BATCH_SIZE):
            batch = df.iloc[i:i + BATCH_SIZE]
            rows = [
                {
                    "ticker": r["Ticker"],
                    "date": r["Date"],
                    "open": _safe_float(r.get("Open")),
                    "high": _safe_float(r.get("High")),
                    "low": _safe_float(r.get("Low")),
                    "close": _safe_float(r.get("Close")),
                    "volume": _safe_float(r.get("Volume")),
                }
                for _, r in batch.iterrows()
            ]
            await conn.execute(
                text(
                    "INSERT INTO stock_prices (ticker, date, open, high, low, close, volume) "
                    "VALUES (:ticker, :date, :open, :high, :low, :close, :volume)"
                ),
                rows,
            )
            price_count += len(rows)
            if price_count % 50000 == 0:
                logger.info("  Inserted %d price rows...", price_count)

        logger.info("Inserted %d stock price rows", price_count)

        # 3. Insert stock indicators in batches
        ind_count = 0
        for i in range(0, len(df), BATCH_SIZE):
            batch = df.iloc[i:i + BATCH_SIZE]
            rows = [
                {
                    "ticker": r["Ticker"],
                    "date": r["Date"],
                    "daily_return": _safe_float(r.get("Daily_Return")),
                    "volatility_20d": _safe_float(r.get("Volatility_20D")),
                    "ma_50": _safe_float(r.get("MA_50")),
                    "ma_200": _safe_float(r.get("MA_200")),
                    "rsi_14": _safe_float(r.get("RSI_14")),
                    "macd": _safe_float(r.get("MACD")),
                    "macd_signal": _safe_float(r.get("MACD_Signal")),
                    "pe_ratio": _safe_float(r.get("PE_Ratio")),
                    "beta": _safe_float(r.get("Beta")),
                }
                for _, r in batch.iterrows()
            ]
            await conn.execute(
                text(
                    "INSERT INTO stock_indicators (ticker, date, daily_return, volatility_20d, "
                    "ma_50, ma_200, rsi_14, macd, macd_signal, pe_ratio, beta) "
                    "VALUES (:ticker, :date, :daily_return, :volatility_20d, "
                    ":ma_50, :ma_200, :rsi_14, :macd, :macd_signal, :pe_ratio, :beta)"
                ),
                rows,
            )
            ind_count += len(rows)
            if ind_count % 50000 == 0:
                logger.info("  Inserted %d indicator rows...", ind_count)

        logger.info("Inserted %d stock indicator rows", ind_count)

    logger.info("Data loading complete!")


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        import math
        f = float(val)
        return None if math.isnan(f) else f
    except (ValueError, TypeError):
        return None


if __name__ == "__main__":
    asyncio.run(load_stock_data())
