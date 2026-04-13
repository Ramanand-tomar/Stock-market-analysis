-- PostgreSQL initialization script for NIFTY 50 AI Stock Intelligence
-- Run against Neon DB or local PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(30) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(30) NOT NULL,
    date TIMESTAMP NOT NULL,
    open DOUBLE PRECISION,
    high DOUBLE PRECISION,
    low DOUBLE PRECISION,
    close DOUBLE PRECISION,
    volume DOUBLE PRECISION,
    UNIQUE(ticker, date)
);

CREATE TABLE IF NOT EXISTS stock_indicators (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(30) NOT NULL,
    date TIMESTAMP NOT NULL,
    daily_return DOUBLE PRECISION,
    volatility_20d DOUBLE PRECISION,
    ma_50 DOUBLE PRECISION,
    ma_200 DOUBLE PRECISION,
    rsi_14 DOUBLE PRECISION,
    macd DOUBLE PRECISION,
    macd_signal DOUBLE PRECISION,
    pe_ratio DOUBLE PRECISION,
    beta DOUBLE PRECISION,
    UNIQUE(ticker, date)
);

CREATE TABLE IF NOT EXISTS model_metadata (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    is_best BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prediction_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    ticker VARCHAR(30) NOT NULL,
    predicted_close DOUBLE PRECISION,
    predicted_direction INTEGER,
    confidence DOUBLE PRECISION,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_prices_ticker ON stock_prices(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_prices_date ON stock_prices(date);
CREATE INDEX IF NOT EXISTS idx_stock_prices_ticker_date ON stock_prices(ticker, date);
CREATE INDEX IF NOT EXISTS idx_stock_indicators_ticker ON stock_indicators(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_indicators_ticker_date ON stock_indicators(ticker, date);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_user ON prediction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
